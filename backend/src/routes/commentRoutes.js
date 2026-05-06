/**
 * 评论路由：按文章拉取列表、发表（optionalAuth）、点赞、举报；管理员待审与审核。
 * 挂载前缀：/api/v1/comments
 */
const express = require('express');
const { getCommentsByPost, createComment, getPendingComments, reviewComment, reportComment } = require('../controllers/commentController');
const { toggleCommentLike } = require('../controllers/likeController');
const { optionalAuth, protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/post/:postId', optionalAuth, getCommentsByPost);
router.post('/:id/report', protect, reportComment);
router.post('/:id/like', protect, toggleCommentLike);
router.get('/admin/pending', protect, admin, getPendingComments);
router.patch('/admin/:id/review', protect, admin, reviewComment);
router.post('/', optionalAuth, createComment);

module.exports = router;
