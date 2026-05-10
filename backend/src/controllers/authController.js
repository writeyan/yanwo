/**
 * 认证控制器：注册、登录、资料、改密、头像上传；登录签发 JWT，部分写操作写审计日志。
 */
const User = require('../models/User');
const Post = require('../models/Post');
const generateToken = require('../utils/generateToken');
const { validatePasswordStrength } = require('../utils/passwordPolicy');
const { validateEmail } = require('../utils/emailValidate');
const { createChallenge, consumeChallenge } = require('../utils/forgotChallenge');
const { writeAudit } = require('../utils/auditLog');

const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const usernameTrim = String(username || '').trim();
    const emailTrim = String(email || '').trim();
    if (!usernameTrim || usernameTrim.length < 2 || usernameTrim.length > 40) {
      return res.status(400).json({ code: 400, message: '用户名长度需在 2–40 个字符之间' });
    }
    const emailOk = validateEmail(emailTrim);
    if (!emailOk.ok) return res.status(400).json({ code: 400, message: emailOk.message });

    const pwdCheck = validatePasswordStrength(password);
    if (!pwdCheck.ok) {
      return res.status(400).json({ code: 400, message: pwdCheck.message });
    }
    const userExists = await User.findOne({
      $or: [{ email: emailTrim.toLowerCase() }, { username: usernameTrim }],
    });
    if (userExists) {
      return res.status(400).json({ code: 400, message: '用户名或邮箱已存在' });
    }
    const user = await User.create({ username: usernameTrim, email: emailTrim, password });
    if (user) {
      res.status(201).json({
        code: 201,
        message: '注册成功',
        data: { id: user._id, username: user.username, email: user.email, role: user.role },
      });
    } else {
      res.status(400).json({ code: 400, message: '注册失败' });
    }
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;
    const ident = String(usernameOrEmail || '').trim();
    if (!ident || !password) {
      return res.status(400).json({ code: 400, message: '请填写账号与密码' });
    }
    // 邮箱在库中为小写（User schema lowercase）；登录输入需统一小写才能命中
    const user = await User.findOne({
      $or: [{ username: ident }, { email: ident.toLowerCase() }],
    });
    if (user && (await user.comparePassword(password))) {
      if (user.status === 'disabled') {
        return res.status(401).json({ code: 401, message: '账号已被禁用' });
      }
      user.lastLoginAt = new Date();
      await user.save();
      res.json({
        code: 200,
        message: '登录成功',
        data: {
          accessToken: generateToken(user._id, user.role),
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            bio: user.bio || '',
          },
        },
      });
    } else {
      res.status(401).json({ code: 401, message: '用户名或密码错误' });
    }
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }
    const [articleCount, agg] = await Promise.all([
      Post.countDocuments({ author: user._id, status: { $ne: 'deleted' } }),
      Post.aggregate([
        { $match: { author: user._id, status: { $ne: 'deleted' } } },
        { $group: { _id: null, totalViews: { $sum: '$viewCount' } } },
      ]),
    ]);
    const totalViews = agg[0]?.totalViews || 0;
    return res.json({
      code: 200,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          avatar: user.avatar || '',
          bio: user.bio || '',
        },
        stats: { articleCount, totalViews },
      },
    });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { avatar, bio } = req.body;
    const update = {};
    if (typeof avatar === 'string') {
      update.avatar = avatar.trim().slice(0, 500);
    }
    if (typeof bio === 'string') {
      update.bio = bio.trim().slice(0, 200);
    }
    const user = await User.findByIdAndUpdate(req.user._id, { $set: update }, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }
    return res.json({
      code: 200,
      message: '资料已更新',
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar || '',
        bio: user.bio || '',
      },
    });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ code: 400, message: '请填写当前密码与新密码' });
    }
    const pwdCheck = validatePasswordStrength(newPassword);
    if (!pwdCheck.ok) {
      return res.status(400).json({ code: 400, message: pwdCheck.message });
    }
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ code: 400, message: '当前密码不正确' });
    }
    user.password = newPassword;
    await user.save();
    await writeAudit({
      user: req.user._id,
      action: 'auth.change_password',
      resourceType: 'user',
      resourceId: String(req.user._id),
      req,
    });
    return res.json({ code: 200, message: '密码已更新' });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
};

/** multer 字段名 avatar */
const uploadAvatarFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ code: 400, message: '请选择图片文件' });
    }
    const publicPath = `/uploads/avatars/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { avatar: publicPath } },
      { new: true }
    ).select('-password');
    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }
    await writeAudit({
      user: req.user._id,
      action: 'auth.upload_avatar',
      resourceType: 'user',
      resourceId: String(req.user._id),
      meta: { path: publicPath },
      req,
    });
    return res.json({
      code: 200,
      message: '头像已更新',
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar || '',
        bio: user.bio || '',
      },
    });
  } catch (err) {
    return res.status(500).json({ code: 500, message: err.message });
  }
};

/** 算术验证码出题（不涉及邮箱），用于重置密码前置校验 */
const getForgotChallenge = (req, res) => {
  try {
    const data = createChallenge();
    res.json({ code: 200, data });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
};

/** 仅凭账号 + 验证码重置密码（无邮箱链路） */
const resetPasswordForgot = async (req, res) => {
  try {
    const { usernameOrEmail, challengeId, answer, newPassword } = req.body || {};
    const ident = String(usernameOrEmail || '').trim();
    if (!ident || !challengeId || answer === undefined || answer === null) {
      return res.status(400).json({ code: 400, message: '请填写完整信息' });
    }
    const r = consumeChallenge(challengeId, answer);
    if (r === 'expired') {
      return res.status(400).json({ code: 400, message: '验证码已过期，请刷新题目重试' });
    }
    if (r === 'locked') {
      return res.status(429).json({ code: 429, message: '尝试次数过多，请重新获取题目' });
    }
    if (r !== 'ok') {
      return res.status(400).json({ code: 400, message: '算术结果不正确' });
    }
    const pwdCheck = validatePasswordStrength(newPassword);
    if (!pwdCheck.ok) {
      return res.status(400).json({ code: 400, message: pwdCheck.message });
    }
    const user = await User.findOne({
      $or: [{ username: ident }, { email: ident.toLowerCase() }],
    });
    if (!user) {
      return res.status(404).json({ code: 404, message: '未找到该用户' });
    }
    if (user.status === 'disabled') {
      return res.status(403).json({ code: 403, message: '账号已被禁用' });
    }
    user.password = newPassword;
    await user.save();
    await writeAudit({
      user: user._id,
      action: 'auth.reset_password.forgot',
      resourceType: 'user',
      resourceId: String(user._id),
      req,
    });
    res.json({ code: 200, message: '密码已重置，请使用新密码登录' });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  changePassword,
  uploadAvatarFile,
  getForgotChallenge,
  resetPasswordForgot,
};
