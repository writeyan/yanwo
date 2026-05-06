const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true, maxlength: 120 },
    resourceType: { type: String, default: '', maxlength: 64 },
    resourceId: { type: String, default: '', maxlength: 64 },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String, default: '', maxlength: 64 },
    userAgent: { type: String, default: '', maxlength: 500 },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
