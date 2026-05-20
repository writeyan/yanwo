/**
 * 用户模型：注册登录、角色与状态、个人资料（头像/简介）。
 *
 * - email：unique + lowercase，登录时需 toLowerCase 匹配
 * - password：pre-save 时若被修改则用 bcrypt 哈希（10 rounds）
 * - comparePassword：登录/改密时校验明文与哈希
 */
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  avatar: { type: String, default: '' },
  bio: { type: String, maxlength: 200 },
  role: { type: String, enum: ['reader', 'author', 'admin'], default: 'reader' },
  status: { type: String, enum: ['active', 'disabled'], default: 'active' },
  lastLoginAt: { type: Date },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
