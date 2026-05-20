/**
 * 管理端统计 API：仪表盘、发文趋势、标签占比、分类热力、评论情感。
 * 均需 protect + admin。
 */
const express = require('express');
const {
  getDashboardStats,
  getVisitTrend,
  getTagRatio,
  getCategoryHeatmap,
  getCommentSentiment,
} = require('../controllers/statsController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/dashboard', protect, admin, getDashboardStats);
router.get('/trend', protect, admin, getVisitTrend);
router.get('/tag-ratio', protect, admin, getTagRatio);
router.get('/category-heatmap', protect, admin, getCategoryHeatmap);
router.get('/comment-sentiment', protect, admin, getCommentSentiment);

module.exports = router;
