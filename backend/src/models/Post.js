/**
 * 博客文章：标题、slug（URL 唯一）、正文、作者冗余名、分类、标签、状态与计数器。
 *
 * - status：draft | published | deleted（软删除）
 * - 文本索引：title/content/excerpt 供 $text 搜索（无结果时控制器可回退正则）
 * - publishedAt：首次发布或从草稿转发布时由控制器写入
 */
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
