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

module.exports = mongoose.model('Comment', commentSchema)