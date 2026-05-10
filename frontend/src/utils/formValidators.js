/** 与后端策略保持一致的前端校验，减少无效提交 */

export const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function validateEmail(email) {
  const s = String(email || '').trim();
  if (!s) return { ok: false, message: '请填写邮箱' };
  if (s.length > 254) return { ok: false, message: '邮箱过长' };
  if (!EMAIL_REGEX.test(s)) return { ok: false, message: '邮箱格式不正确' };
  return { ok: true, message: '' };
}

export function validatePasswordClient(password) {
  const p = String(password || '');
  if (p.length < 8) return { ok: false, message: '密码至少 8 位' };
  if (p.length > 128) return { ok: false, message: '密码过长' };
  if (!/[a-zA-Z]/.test(p)) return { ok: false, message: '密码需包含至少一个英文字母' };
  if (!/[0-9]/.test(p)) return { ok: false, message: '密码需包含至少一个数字' };
  return { ok: true, message: '' };
}

export function validateUsername(username) {
  const u = String(username || '').trim();
  if (u.length < 2 || u.length > 40) return { ok: false, message: '用户名长度需在 2–40 个字符之间' };
  return { ok: true, message: '' };
}
