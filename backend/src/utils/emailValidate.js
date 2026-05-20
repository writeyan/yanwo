/**
 * 宽松邮箱格式校验（注册）；导出 EMAIL_RX 供测试或其它模块复用。
 * @returns {{ ok: boolean, message: string }}
 */
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
