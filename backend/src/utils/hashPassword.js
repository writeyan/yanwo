/**
 * 遗留示例文件：内含 JWT protect/admin 雏形，当前项目未引用。
 * 实际鉴权请使用 `src/middleware/authMiddleware.js`（含 optionalAuth）。
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      res.status(401).json({ code: 401, message: '无效的令牌' });
    }
  }
  if (!token) {
    res.status(401).json({ code: 401, message: '未授权，无令牌' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ code: 403, message: '需要管理员权限' });
  }
};

module.exports = { protect, admin };
