const AuditLog = require('../models/AuditLog');

/**
 * @param {object} opts
 * @param {import('mongoose').Types.ObjectId} [opts.user]
 * @param {string} opts.action
 * @param {string} [opts.resourceType]
 * @param {string} [opts.resourceId]
 * @param {object} [opts.meta]
 * @param {import('express').Request} [opts.req]
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
