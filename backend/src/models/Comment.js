/**
 * 文章评论：支持登录用户（关联 author）或游客（昵称+邮箱）；嵌套回复用 parent。
 *
 * - status：pending（游客默认）| approved | spam；仅 approved 对外展示
 * - likeCount / reportCount：由点赞与举报逻辑维护
 */
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  authorName: { type: String, required: true },
  authorEmail: { type: String },
  content: { type: String, required: true, maxlength: 1000 },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
  likeCount: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['pending', 'approved', 'spam'], default: 'pending' },
  reportCount: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);
