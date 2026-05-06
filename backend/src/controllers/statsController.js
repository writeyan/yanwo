const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');
const PageVisit = require('../models/PageVisit');

exports.getDashboardStats = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const [totalPosts, totalUsers, pendingComments, activeUsers7d] = await Promise.all([
      Post.countDocuments(),
      User.countDocuments(),
      Comment.countDocuments({ status: 'pending' }),
      User.countDocuments({ lastLoginAt: { $gte: sevenDaysAgo } }),
    ]);
    return res.json({
      code: 200,
      data: {
        totalPosts,
        totalUsers,
        pendingComments,
        activeUsers7d,
      },
    });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
};

// 以「每日新发布文章数」为趋势（可后续接独立访问日志）
exports.getVisitTrend = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const series = await Post.aggregate([
      { $match: { publishedAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$publishedAt' } },
          value: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]).then((rows) => rows.map((r) => ({ date: r._id, value: r.value })));

    return res.json({ code: 200, data: { series } });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
};

// 标签占比（已发布文章的标签出现次数占比）
exports.getTagRatio = async (req, res) => {
  try {
    const rows = await Post.aggregate([
      { $match: { status: 'published' } },
      { $unwind: { path: '$tags', preserveNullAndEmptyArrays: false } },
      { $group: { _id: '$tags', value: { $sum: 1 } } },
      { $sort: { value: -1, _id: 1 } },
      { $limit: 12 },
    ]);
    const series = rows.map((r) => ({ name: r._id, value: r.value }));
    return res.json({ code: 200, data: { series } });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
};

/** 管理后台：访问来源 Top（基于 PageVisit.refererHost） */
exports.getVisitSources = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const rows = await PageVisit.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $ifNull: ['$refererHost', '(unknown)'] },
          value: { $sum: 1 },
        },
      },
      { $sort: { value: -1 } },
      { $limit: 15 },
    ]);
    const series = rows.map((r) => ({
      name: String(r._id || '(unknown)'),
      value: r.value,
    }));
    return res.json({ code: 200, data: { series } });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
};
