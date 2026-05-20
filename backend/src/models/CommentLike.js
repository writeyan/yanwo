/**
 * 用户对评论的点赞关系；复合唯一索引防重复。
 */
const mongoose = require('mongoose');

const commentLikeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    comment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', required: true },
  },
  { timestamps: true }
);

commentLikeSchema.index({ user: 1, comment: 1 }, { unique: true });

module.exports = mongoose.model('CommentLike', commentLikeSchema);
