/**
 * 文章 REST 路由
 *
 * 静态路径（related、revisions、admin、mine、favorites、upload-cover、meta、archive）必须注册在 `/:slug` 之前，
 * 否则会被误当作 slug。详情页使用 optionalAuth 以返回 likedByMe。
 */
const express = require('express');
const {
  getPosts,
  getPostBySlug,
  getPostById,
  createPost,
  updatePost,
  getAllPostsAdmin,
  getMyPosts,
  deletePost,
  getTagStats,
  getArchive,
  getRelatedPosts,
  getPostRevisions,
  uploadFeaturedCover,
} = require('../controllers/postController');
const { togglePostLike } = require('../controllers/likeController');
const { togglePostFavorite, getMyFavorites } = require('../controllers/favoriteController');
const { protect, admin, optionalAuth } = require('../middleware/authMiddleware');
const { uploadFeatured } = require('../middleware/uploadFeatured');

const router = express.Router();

router.get('/related/:slug', getRelatedPosts);
router.get('/revisions/:postId', protect, getPostRevisions);
router.get('/admin/all', protect, admin, getAllPostsAdmin);
router.get('/mine', protect, getMyPosts);
router.get('/favorites', protect, getMyFavorites);
router.post('/upload-cover', protect, (req, res, next) => {
  // multer 校验失败时返回 JSON，避免默认 HTML 错误响应
  uploadFeatured.single('cover')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ code: 400, message: err.message || '上传失败' });
    }
    next();
  });
}, uploadFeaturedCover);
router.get('/meta/tags', getTagStats);
router.get('/archive', getArchive);
router.get('/', getPosts);
router.post('/', protect, createPost);
router.get('/:id/edit', protect, getPostById);
router.put('/:id', protect, updatePost);
router.post('/:id/like', protect, togglePostLike);
router.post('/:id/favorite', protect, togglePostFavorite);
router.delete('/:id', protect, deletePost);
// optionalAuth：根据是否登录附加 likedByMe
router.get('/:slug', optionalAuth, getPostBySlug);

module.exports = router;