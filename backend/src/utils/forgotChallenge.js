/**
 * 简单算术验证码（内存存储，进程重启清空；适合单机部署）。
 * 不包含邮箱链路，仅凭账号 + 验证码重置密码。
 */
const crypto = require('crypto');

const store = new Map();
const TTL_MS = 5 * 60 * 1000;
const MAX_WRONG = 6;

function prune() {
  const now = Date.now();
  for (const [id, row] of store) {
    if (row.expires < now) store.delete(id);
  }
}

function createChallenge() {
  prune();
  const id = crypto.randomBytes(16).toString('hex');
  const a = Math.floor(1 + Math.random() * 19);
  const b = Math.floor(1 + Math.random() * 19);
  const answer = String(a + b);
  store.set(id, {
    answer,
    expires: Date.now() + TTL_MS,
    wrong: 0,
  });
  return { challengeId: id, question: `${a} + ${b} = ?` };
}

/** @returns {'ok'|'expired'|'wrong'|'locked'} */
function consumeChallenge(challengeId, answerStr) {
  prune();
  if (!challengeId || answerStr === undefined || answerStr === null) return 'wrong';
  const row = store.get(challengeId);
  if (!row || row.expires < Date.now()) {
    store.delete(challengeId);
    return 'expired';
  }
  if (row.wrong >= MAX_WRONG) {
    store.delete(challengeId);
    return 'locked';
  }
  const normalized = String(answerStr).trim();
  if (normalized === row.answer) {
    store.delete(challengeId);
    return 'ok';
  }
  row.wrong += 1;
  return 'wrong';
}

module.exports = { createChallenge, consumeChallenge };
