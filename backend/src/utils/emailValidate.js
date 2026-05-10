/** 前端可同步使用的宽松邮箱校验（服务端注册用） */
const EMAIL_RX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

function validateEmail(email) {
  const s = String(email || '').trim();
  if (!s) return { ok: false, message: '请填写邮箱' };
  if (s.length > 254) return { ok: false, message: '邮箱过长' };
  if (!EMAIL_RX.test(s)) return { ok: false, message: '邮箱格式不正确' };
  return { ok: true, message: '' };
}

module.exports = { validateEmail, EMAIL_RX };
