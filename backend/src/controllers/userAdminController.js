/**
 * 用户管理（管理员）
 *
 * 列表支持分页与 q 模糊搜索；PATCH 可改 role、status。未实现「至少保留一名管理员」等业务约束。
 */
const User = require('../models/User');

/** 分页用户列表；q 对 username、email 做不区分大小写正则匹配（已转义特殊字符） */
exports.listUsersAdmin = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 30));
    const q = req.query.q && String(req.query.q).trim() ? String(req.query.q).trim() : '';
    const filter = {};
    if (q) {
      const esc = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [{ username: new RegExp(esc, 'i') }, { email: new RegExp(esc, 'i') }];
    }
    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select('username email role status lastLoginAt createdAt')
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);
    res.json({
      code: 200,
      data: {
        users,
        total,
        page,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
};

/** 部分更新：status ∈ active|disabled，role ∈ reader|author|admin */
exports.patchUserAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ code: 400, message: '无效的用户 ID' });
    }
    const { role, status } = req.body;
    const update = {};
    if (typeof status === 'string' && ['active', 'disabled'].includes(status)) {
      update.status = status;
    }
    if (typeof role === 'string' && ['reader', 'author', 'admin'].includes(role)) {
      update.role = role;
    }
    if (Object.keys(update).length === 0) {
      return res.status(400).json({ code: 400, message: '无有效字段' });
    }
    const user = await User.findByIdAndUpdate(id, { $set: update }, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }
    res.json({ code: 200, message: '已更新', data: user });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
};
