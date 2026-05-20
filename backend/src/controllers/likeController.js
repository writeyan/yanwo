/**
 * 文章点赞 / 评论点赞（切换式）
 *
 * 使用 PostLike、CommentLike 唯一索引 (user, post/comment) 防重复点赞。
 * Post/Comment 上的 likeCount 与关联表同步增减；若出现负数则钳制回 0。
 * 并发下 create 可能撞唯一索引，捕获 11000 后返回当前态幂等响应。
 */
const mongoose = require('mongoose');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const PostLike = require('../models/PostLike');
const CommentLike = require('../models/CommentLike');

/** 严格 24 位十六进制 ObjectId，避免把任意字符串当 ObjectId 查询 */
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id) && String(id).length === 24;

exports.togglePostLike = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ code: 400, message: '无效的文章 ID' });
    }
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ code: 404, message: '文章不存在' });
    }
    if (post.status !== 'published') {
      return res.status(400).json({ code: 400, message: '仅可点赞已发布文章' });
    }
    const userId = req.user._id;
    const exist = await PostLike.findOne({ post: id, user: userId });
    if (exist) {
      await exist.deleteOne();
      const updated = await Post.findByIdAndUpdate(id, { $inc: { likeCount: -1 } }, { new: true });
      let n = Math.max(0, updated.likeCount || 0);
      if (updated.likeCount < 0) {
        const fixed = await Post.findByIdAndUpdate(id, { $set: { likeCount: 0 } }, { new: true });
        n = fixed.likeCount;
      }
      return res.json({ code: 200, data: { liked: false, likeCount: n } });
    }
    try {
      await PostLike.create({ post: id, user: userId });
    } catch (e) {
      if (e.code === 11000) {
        return res.status(200).json({ code: 200, data: { liked: true, likeCount: post.likeCount } });
      }
      throw e;
    }
    const updated = await Post.findByIdAndUpdate(id, { $inc: { likeCount: 1 } }, { new: true });
    return res.json({
      code: 200,
      data: { liked: true, likeCount: updated.likeCount || 0 },
    });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
};

exports.toggleCommentLike = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ code: 400, message: '无效的评论 ID' });
    }
    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ code: 404, message: '评论不存在' });
    }
    if (comment.status !== 'approved') {
      return res.status(400).json({ code: 400, message: '该评论不可点赞' });
    }
    const post = await Post.findById(comment.post);
    if (!post || post.status !== 'published') {
      return res.status(400).json({ code: 400, message: '文章已不可见' });
    }
    const userId = req.user._id;
    const exist = await CommentLike.findOne({ comment: id, user: userId });
    if (exist) {
      await exist.deleteOne();
      const upd = await Comment.findByIdAndUpdate(id, { $inc: { likeCount: -1 } }, { new: true });
      let n = Math.max(0, upd.likeCount || 0);
      if (upd.likeCount < 0) {
        const fixed = await Comment.findByIdAndUpdate(id, { $set: { likeCount: 0 } }, { new: true });
        n = fixed.likeCount;
      }
      return res.json({ code: 200, data: { liked: false, likeCount: n } });
    }
    try {
      await CommentLike.create({ comment: id, user: userId });
    } catch (e) {
      if (e.code === 11000) {
        const c2 = await Comment.findById(id);
        return res.json({ code: 200, data: { liked: true, likeCount: c2?.likeCount || 0 } });
      }
      throw e;
    }
    const updated = await Comment.findByIdAndUpdate(id, { $inc: { likeCount: 1 } }, { new: true });
    return res.json({
      code: 200,
      data: { liked: true, likeCount: updated.likeCount || 0 },
    });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
};
