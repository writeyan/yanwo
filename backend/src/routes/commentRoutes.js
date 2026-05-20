/**
 * 评论路由：按文章拉取（可选登录以标记 likedByMe）、发表（游客 optionalAuth）、点赞与举报需登录；
 * 管理员待审列表与 PATCH 审核。注意 POST `/` 与 POST `/:id/like` 的路径顺序由 Express 按注册顺序匹配。
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
