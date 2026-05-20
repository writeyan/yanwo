/**
 * 文章每次保存前的标题与正文快照，用于编辑历史与回溯展示。
 */
const mongoose = require('mongoose');

const postRevisionSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    editedByName: { type: String, default: '' },
  },
  { timestamps: true }
);

postRevisionSchema.index({ post: 1, createdAt: -1 });

module.exports = mongoose.model('PostRevision', postRevisionSchema);
