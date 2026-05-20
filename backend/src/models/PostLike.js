/**
 * 用户对文章的点赞关系；复合唯一索引防止同一用户对同一文章重复点赞。
 */
const mongoose = require('mongoose');

const postLikeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  },
  { timestamps: true }
);

postLikeSchema.index({ user: 1, post: 1 }, { unique: true });

module.exports = mongoose.model('PostLike', postLikeSchema);
