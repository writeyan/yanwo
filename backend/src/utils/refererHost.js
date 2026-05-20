/**
 * 从 HTTP Referer 头解析主机名，用于访问统计聚合（空/非法时返回占位字符串）。
 */
function refererHostFromHeader(ref) {
  if (!ref || typeof ref !== 'string' || !ref.trim()) return '(direct / empty)';
  try {
    const u = new URL(ref.trim());
    return u.hostname || '(unknown)';
  } catch {
    return '(unparsed)';
  }
}

module.exports = { refererHostFromHeader };
