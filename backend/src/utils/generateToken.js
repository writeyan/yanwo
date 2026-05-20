/**
 * JWT 签发：载荷含用户 id 与 role，供 protect/optionalAuth 中间件还原用户。
 *
 * - 密钥：`JWT_SECRET`（必填，否则 verify 会失败）
 * - 过期：`JWT_EXPIRE`，缺省 `7d`（jsonwebtoken 支持的 expiresIn 格式）
 */
const jwt = require('jsonwebtoken');

const generateToken = (id, role) => {
  const rawExpire = String(process.env.JWT_EXPIRE || '').trim();
  const expire = rawExpire || '7d';
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: expire
  });
};

module.exports = generateToken;
