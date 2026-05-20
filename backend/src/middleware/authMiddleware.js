/**
 * 认证与授权中间件
 *
 * - optionalAuth：不强制登录。若请求头带合法 `Authorization: Bearer <jwt>`，则解析并挂载 `req.user`；
 *   解析失败或用户不存在时静默视为游客（req.user = null），仍调用 next()。用于公开接口附加「是否已点赞」等。
 * - protect：必须携带有效 JWT；验证失败或用户不存在返回 401。
 * - admin：须在 protect 之后使用，要求 `req.user.role === 'admin'`，否则 403。
 *
 * JWT 载荷约定：与 generateToken 一致，含 `id`（用户 _id）与 `role`。
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/** 不强制登录；若带合法 Bearer，则挂 req.user，供文章/评论等接口附加 likedByMe 等 */
const optionalAuth = async (req, res, next) => {
  req.user = null;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (user) req.user = user;
    } catch {
      // 游客访问或 token 过期/伪造：不报错，按未登录处理
    }
  }
  return next();
};

const protect = async (req, res, next) => {
  if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer')) {
    return res.status(401).json({ code: 401, message: '未授权，无令牌' });
  }
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ code: 401, message: '用户不存在' });
    }
    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ code: 401, message: '无效的令牌' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ code: 403, message: '需要管理员权限' });
};

module.exports = { protect, admin, optionalAuth };
