/**
 * 简单算术验证码（内存 Map，单进程有效；重启即清空）。
 *
 * 用于「忘记密码」无邮件场景：客户端先拉题目，再带 challengeId + 答案提交重置接口。
 * consumeChallenge 在错误次数过多时返回 locked，并删除该题防止暴力试答。
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

/**
 * 校验并消费一次答题机会
 * @returns {'ok'|'expired'|'wrong'|'locked'} ok 时条目已从 store 删除，可继续重置密码
 */
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
