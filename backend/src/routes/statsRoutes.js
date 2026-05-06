/**
 * 管理端统计：仪表盘、趋势、标签占比、访问来源等，均需 protect + admin。
 */
const express = require('express');
const { getDashboardStats, getVisitTrend, getTagRatio, getVisitSources } = require('../controllers/statsController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/dashboard', protect, admin, getDashboardStats);
router.get('/trend', protect, admin, getVisitTrend);
router.get('/tag-ratio', protect, admin, getTagRatio);
router.get('/visit-sources', protect, admin, getVisitSources);

module.exports = router;
