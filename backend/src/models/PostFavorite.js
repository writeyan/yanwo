/**
 * 用户对文章的收藏关系；复合唯一索引防止重复收藏。
 */
const mongoose = require('mongoose');

const postFavoriteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  },
  { timestamps: true }
);

postFavoriteSchema.index({ user: 1, post: 1 }, { unique: true });

module.exports = mongoose.model('PostFavorite', postFavoriteSchema);
