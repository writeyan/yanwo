const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const CommentReport = require('../models/CommentReport');
const Post = require('../models/Post');
const CommentLike = require('../models/CommentLike');
const { writeAudit } = require('../utils/auditLog');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id) && String(id).length === 24;

// 用户端：只展示已审核通过的评论；登录用户附加「是否已点赞」；支持分页（按时间正序便于嵌套展示）
exports.getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.params;
    if (!isValidId(postId)) {
      return res.status(400).json({ code: 400, message: '无效的文章 ID' });
    }
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ code: 404, message: '文章不存在' });
    }
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
    const filter = { post: postId, status: 'approved' };

    const total = await Comment.countDocuments(filter);
    const comments = await Comment.find(filter)
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const likedIds = new Set();
    if (req.user && comments.length) {
      const ids = comments.map((c) => c._id);
      const likes = await CommentLike.find({
        user: req.user._id,
        comment: { $in: ids },
      })
        .select('comment')
        .lean();
      likes.forEach((l) => likedIds.add(String(l.comment)));
    }

    const list = comments.map((c) => ({
      ...c,
      likeCount: c.likeCount ?? 0,
      likedByMe: likedIds.has(String(c._id)),
    }));

    return res.json({
      code: 200,
      data: list,
      meta: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
};

exports.createComment = async (req, res) => {
  try {
    const { postId, content, authorName, authorEmail, parent: parentRaw } = req.body;
    if (!postId || !content || !String(content).trim()) {
      return res.status(400).json({ code: 400, message: '文章与评论内容不能为空' });
    }
    if (!isValidId(postId)) {
      return res.status(400).json({ code: 400, message: '无效的文章 ID' });
    }
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ code: 404, message: '文章不存在' });
    }
    if (post.status !== 'published') {
      return res.status(400).json({ code: 400, message: '该文章不可评论' });
    }

    let parentId = null;
    if (parentRaw) {
      const p = String(parentRaw);
      if (!isValidId(p)) {
        return res.status(400).json({ code: 400, message: '无效的上级评论' });
      }
      const parentDoc = await Comment.findOne({
        _id: p,
        post: postId,
        status: 'approved',
      });
      if (!parentDoc) {
        return res.status(400).json({ code: 400, message: '回复的评论不存在' });
      }
      parentId = parentDoc._id;
    }

    let payload;
    let autoMessage = '评论成功';
    if (req.user) {
      payload = {
        post: postId,
        author: req.user._id,
        authorName: req.user.username,
        authorEmail: req.user.email,
        content: String(content).trim().slice(0, 1000),
        status: 'approved',
        parent: parentId,
        likeCount: 0,
      };
    } else {
      if (!authorName || !authorEmail) {
        return res.status(400).json({ code: 400, message: '请填写昵称和邮箱' });
      }
      payload = {
        post: postId,
        author: null,
        authorName: String(authorName).trim().slice(0, 100),
        authorEmail: String(authorEmail).trim().toLowerCase().slice(0, 200),
        content: String(content).trim().slice(0, 1000),
        status: 'pending',
        parent: parentId,
        likeCount: 0,
      };
      autoMessage = '评论已提交，待管理员审核';
    }

    const comment = await Comment.create(payload);
    if (comment.status === 'approved') {
      post.commentCount = (post.commentCount || 0) + 1;
      await post.save();
    }

    return res.status(201).json({ code: 201, data: comment, message: autoMessage });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
};

exports.getPendingComments = async (req, res) => {
  try {
    const comments = await Comment.find({ status: 'pending' })
      .populate('post', 'title slug status')
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ code: 200, data: comments });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
};

exports.reviewComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    if (!isValidId(id)) {
      return res.status(400).json({ code: 400, message: '无效的评论 ID' });
    }
    if (!['approve', 'spam'].includes(action)) {
      return res.status(400).json({ code: 400, message: '无效操作' });
    }
    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ code: 404, message: '评论不存在' });
    }
    const prev = comment.status;
    const next = action === 'approve' ? 'approved' : 'spam';
    if (prev === next) {
      return res.json({ code: 200, data: comment, message: '状态未变化' });
    }
    comment.status = next;
    await comment.save();

    await writeAudit({
      user: req.user._id,
      action: `comment.review.${next}`,
      resourceType: 'comment',
      resourceId: String(comment._id),
      meta: { previousStatus: prev },
      req,
    });

    const post = await Post.findById(comment.post);
    if (post) {
      if (prev !== 'approved' && next === 'approved') {
        post.commentCount = (post.commentCount || 0) + 1;
      } else if (prev === 'approved' && next !== 'approved') {
        post.commentCount = Math.max(0, (post.commentCount || 0) - 1);
      }
      await post.save();
    }

    return res.json({ code: 200, data: comment, message: '审核已更新' });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
};

/** 登录用户举报不当评论 */
exports.reportComment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ code: 400, message: '无效的评论 ID' });
    }
    const comment = await Comment.findById(id);
    if (!comment || comment.status !== 'approved') {
      return res.status(404).json({ code: 404, message: '评论不存在' });
    }
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, 300) : '';
    try {
      await CommentReport.create({
        comment: comment._id,
        reporter: req.user._id,
        reason,
      });
    } catch (e) {
      if (e && e.code === 11000) {
        return res.status(400).json({ code: 400, message: '你已举报过该评论' });
      }
      throw e;
    }
    comment.reportCount = (comment.reportCount || 0) + 1;
    await comment.save();
    await writeAudit({
      user: req.user._id,
      action: 'comment.report',
      resourceType: 'comment',
      resourceId: String(comment._id),
      req,
    });
    return res.json({ code: 200, message: '感谢反馈，我们会尽快处理' });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
};
