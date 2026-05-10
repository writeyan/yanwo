const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');

const POSITIVE_WORDS = [
  '好',
  '喜欢',
  '赞',
  '优秀',
  '棒',
  '支持',
  '感谢',
  '有用',
  '精彩',
  '牛',
];
const NEGATIVE_WORDS = [
  '差',
  '垃圾',
  '讨厌',
  '失望',
  '糟',
  '烂',
  '问题',
  '错误',
  '不行',
  '无语',
];

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

// 分类活跃热力图（近 12 个月：分类 × 月份发文量）
exports.getCategoryHeatmap = async (req, res) => {
  try {
    const months = [];
    const monthSet = new Set();
    const now = new Date();
    for (let i = 11; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push(label);
      monthSet.add(label);
    }

    const rows = await Post.aggregate([
      {
        $match: {
          status: 'published',
        },
      },
      {
        $addFields: {
          actAt: { $ifNull: ['$publishedAt', '$createdAt'] },
        },
      },
      {
        $addFields: {
          monthKey: { $dateToString: { format: '%Y-%m', date: '$actAt' } },
        },
      },
      {
        $match: {
          monthKey: { $in: months },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'cat',
        },
      },
      {
        $addFields: {
          categoryName: {
            $ifNull: [{ $arrayElemAt: ['$cat.name', 0] }, '未分类'],
          },
        },
      },
      {
        $group: {
          _id: { month: '$monthKey', category: '$categoryName' },
          value: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          month: '$_id.month',
          category: '$_id.category',
          value: 1,
        },
      },
    ]);

    const totals = new Map();
    rows.forEach((r) => {
      totals.set(r.category, (totals.get(r.category) || 0) + r.value);
    });
    const categories = Array.from(totals.keys()).sort(
      (a, b) => (totals.get(b) || 0) - (totals.get(a) || 0)
    );

    const points = rows.filter((r) => monthSet.has(r.month) && categories.includes(r.category));
    const max = points.reduce((m, p) => Math.max(m, p.value || 0), 0);

    return res.json({
      code: 200,
      data: { months, categories, points, max },
    });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
};

// 评论情感分析（规则法，近 90 天已审核评论）
exports.getCommentSentiment = async (req, res) => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 90);
    const comments = await Comment.find({
      status: 'approved',
      createdAt: { $gte: since },
    })
      .select('content')
      .lean();

    const counter = { positive: 0, neutral: 0, negative: 0 };
    const toText = (s) => String(s || '').toLowerCase();
    const scoreText = (textRaw) => {
      const text = toText(textRaw);
      let score = 0;
      POSITIVE_WORDS.forEach((w) => {
        if (text.includes(w.toLowerCase())) score += 1;
      });
      NEGATIVE_WORDS.forEach((w) => {
        if (text.includes(w.toLowerCase())) score -= 1;
      });
      return score;
    };

    comments.forEach((c) => {
      const score = scoreText(c.content);
      if (score > 0) counter.positive += 1;
      else if (score < 0) counter.negative += 1;
      else counter.neutral += 1;
    });

    const total = comments.length;
    const series = [
      { name: '正向', value: counter.positive },
      { name: '中性', value: counter.neutral },
      { name: '负向', value: counter.negative },
    ];
    return res.json({ code: 200, data: { total, series } });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
};

