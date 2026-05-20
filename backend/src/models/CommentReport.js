/**
 * 用户对已审核评论的举报；同一用户对同一评论仅允许一条（唯一索引 comment+reporter）。
 */
const mongoose = require('mongoose');

const commentReportSchema = new mongoose.Schema(
  {
    comment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', required: true },
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, maxlength: 300, default: '' },
  },
  { timestamps: true }
);

commentReportSchema.index({ comment: 1, reporter: 1 }, { unique: true });

module.exports = mongoose.model('CommentReport', commentReportSchema);
