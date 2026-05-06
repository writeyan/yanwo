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
