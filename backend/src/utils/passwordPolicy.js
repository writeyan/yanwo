/**
 * 注册/改密共用的密码强度规则（与前端 formValidators 保持一致）。
 * @returns {{ ok: boolean, message: string }}
 */
function validatePasswordStrength(password) {
  if (password == null || typeof password !== 'string') {
    return { ok: false, message: '请填写密码' };
  }
  if (password.length < 8) {
    return { ok: false, message: '密码至少 8 位' };
  }
  if (password.length > 128) {
    return { ok: false, message: '密码过长' };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { ok: false, message: '密码需包含至少一个英文字母' };
  }
  if (!/[0-9]/.test(password)) {
    return { ok: false, message: '密码需包含至少一个数字' };
  }
  return { ok: true, message: '' };
}

module.exports = { validatePasswordStrength };
