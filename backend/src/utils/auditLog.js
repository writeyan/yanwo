/**
 * 审计日志写入：失败仅打 console，不阻断主业务流程。
 */
const AuditLog = require('../models/AuditLog');

/**
 * @param {object} opts
 * @param {import('mongoose').Types.ObjectId} [opts.user] 操作者（可为空）
 * @param {string} opts.action 动作标识，如 auth.change_password
 * @param {string} [opts.resourceType] 资源类型
 * @param {string} [opts.resourceId] 资源主键字符串
 * @param {object} [opts.meta] 任意附加 JSON
 * @param {import('express').Request} [opts.req] 用于提取 IP、User-Agent
 */
async function writeAudit(opts) {
  try {
    await AuditLog.create({
      user: opts.user || undefined,
      action: opts.action,
      resourceType: opts.resourceType || '',
      resourceId: opts.resourceId || '',
      meta: opts.meta && typeof opts.meta === 'object' ? opts.meta : {},
      ip: opts.req?.ip || opts.req?.socket?.remoteAddress || '',
      userAgent: typeof opts.req?.get === 'function' ? opts.req.get('user-agent')?.slice(0, 500) || '' : '',
    });
  } catch (e) {
    console.error('audit log failed', e.message);
  }
}

module.exports = { writeAudit };
