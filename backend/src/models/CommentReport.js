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
