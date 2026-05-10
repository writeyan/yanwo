/**
 * 文章路由。注意：具体路径需先于 /:slug 注册，避免 slug 与保留字冲突。
 * - 公开：列表、归档、标签、按 slug 读详情（optionalAuth 附加 likedByMe）
 * - 登录：创建、编辑、删除、我的列表、点赞、封面上传 POST /upload-cover
 * - 管理员：/admin/all
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
const { protect, admin, optionalAuth } = require('../middleware/authMiddleware');
const { uploadFeatured } = require('../middleware/uploadFeatured');

const router = express.Router();

router.get('/related/:slug', getRelatedPosts);
router.get('/revisions/:postId', protect, getPostRevisions);
router.get('/admin/all', protect, admin, getAllPostsAdmin);
router.get('/mine', protect, getMyPosts);
router.post('/upload-cover', protect, (req, res, next) => {
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
router.delete('/:id', protect, deletePost);
// optionalAuth：根据是否登录附加 likedByMe
router.get('/:slug', optionalAuth, getPostBySlug);

module.exports = router;