/**
 * 角色与权限列表（扩展用）；当前业务主要使用 User.role 枚举，本模型可预留 RBAC。
 */
const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  permissions: [{ type: String }],
  isDefault: { type: Boolean, default: false }
});

module.exports = mongoose.model('Role', roleSchema);
