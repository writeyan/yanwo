const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  excerpt: { type: String, maxlength: 200 },
  featuredImage: { type: String },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  tags: [{ type: String }],
  status: { type: String, enum: ['draft', 'published', 'deleted'], default: 'draft' },
  viewCount: { type: Number, default: 0 },
  likeCount: { type: Number, default: 0 },
  commentCount: { type: Number, default: 0 },
  publishedAt: { type: Date }
}, { timestamps: true });

postSchema.index({ status: 1, publishedAt: -1 });
postSchema.index({ title: 'text', content: 'text', excerpt: 'text' }, { default_language: 'none', name: 'post_text_search' });

module.exports = mongoose.model('Post', postSchema);