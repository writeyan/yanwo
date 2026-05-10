/**
 * 签发 JWT：载荷含用户 id 与 role，密钥与过期时间来自环境变量。
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