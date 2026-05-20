/**
 * 文章收藏：切换收藏状态、获取当前用户收藏列表（仅已发布文章）。
 */
const mongoose = require('mongoose');
const Post = require('../models/Post');
const PostFavorite = require('../models/PostFavorite');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id) && String(id).length === 24;

exports.togglePostFavorite = async (req, res) => {
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
      return res.status(400).json({ code: 400, message: '仅可收藏已发布文章' });
    }
    const userId = req.user._id;
    const exist = await PostFavorite.findOne({ post: id, user: userId });
    if (exist) {
      await exist.deleteOne();
      return res.json({ code: 200, data: { favorited: false } });
    }
    try {
      await PostFavorite.create({ post: id, user: userId });
    } catch (e) {
      if (e.code === 11000) {
        return res.json({ code: 200, data: { favorited: true } });
      }
      throw e;
    }
    return res.json({ code: 200, data: { favorited: true } });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
};

exports.getMyFavorites = async (req, res) => {
  try {
    const favorites = await PostFavorite.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    const postIds = favorites.map((f) => f.post);
    if (!postIds.length) {
      return res.json({ code: 200, data: [] });
    }
    const posts = await Post.find({ _id: { $in: postIds }, status: 'published' })
      .populate('category', 'name slug')
      .select(
        'title slug authorName publishedAt viewCount likeCount commentCount excerpt tags featuredImage'
      )
      .lean();
    const order = new Map(postIds.map((pid, i) => [String(pid), i]));
    posts.sort((a, b) => (order.get(String(a._id)) ?? 0) - (order.get(String(b._id)) ?? 0));
    return res.json({ code: 200, data: posts });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
};
