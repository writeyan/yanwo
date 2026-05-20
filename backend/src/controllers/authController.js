/**
 * 认证与用户资料控制器
 *
 * 职责概览：
 * - 注册 / 登录：校验输入、查重、签发 JWT（登录成功时）
 * - 资料：读取当前用户档案及文章统计；部分更新头像 URL、简介
 * - 安全：修改密码、算术验证码辅助的「忘记密码」重置（无邮件链路）
 * - 头像：接收 multer 上传后的文件路径并写库
 * - 审计：敏感写操作（改密、上传头像、忘记密码重置）调用 writeAudit
 *
 * 约定：成功响应多含 { code, message?, data? }；req.user 由鉴权中间件注入（需登录的接口）。
 */

const User = require('../models/User');
const Post = require('../models/Post');
const generateToken = require('../utils/generateToken');
const { validatePasswordStrength } = require('../utils/passwordPolicy');
const { validateEmail } = require('../utils/emailValidate');
const { createChallenge, consumeChallenge } = require('../utils/forgotChallenge');
const { writeAudit } = require('../utils/auditLog');

/**
 * 用户注册
 *
 * 流程：校验用户名长度 → 邮箱格式 → 密码强度 → 用户名/邮箱唯一性 → 创建用户。
 * 密码由 User 模型 pre-save 钩子哈希，此处传入明文即可。
 *
 * @param {import('express').Request} req Express 请求；body: { username, email, password }
 * @param {import('express').Response} res 201 返回新用户公开字段；400/500 为业务或服务器错误
 */
const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    // 统一 trim，避免首尾空格导致展示或查重异常
    const usernameTrim = String(username || '').trim();
    const emailTrim = String(email || '').trim();

    // 用户名：2–40 字符，与前端/产品约定一致
    if (!usernameTrim || usernameTrim.length < 2 || usernameTrim.length > 40) {
      return res.status(400).json({ code: 400, message: '用户名长度需在 2–40 个字符之间' });
    }

    const emailOk = validateEmail(emailTrim);
    if (!emailOk.ok) return res.status(400).json({ code: 400, message: emailOk.message });

    const pwdCheck = validatePasswordStrength(password);
    if (!pwdCheck.ok) {
      return res.status(400).json({ code: 400, message: pwdCheck.message });
    }

    // 邮箱在库中通常存小写；查重时与注册写入保持一致
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
        // 不返回 password；仅返回前端展示所需字段
        data: { id: user._id, username: user.username, email: user.email, role: user.role },
      });
    } else {
      res.status(400).json({ code: 400, message: '注册失败' });
    }
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
};

/**
 * 用户登录
 *
 * 支持用户名或邮箱 + 密码。邮箱匹配使用小写，与 schema 的 lowercase 一致。
 * 成功：更新 lastLoginAt，返回 accessToken 与用户信息（含头像、简介）。
 * 禁用账号：返回 401，不签发 token。
 *
 * @param {import('express').Request} req body: { usernameOrEmail, password }
 * @param {import('express').Response} res 200 带 token；401 凭据错误或禁用；500 服务器错误
 */
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
      // 用户不存在与密码错误统一文案，降低枚举用户名/邮箱的风险
      res.status(401).json({ code: 401, message: '用户名或密码错误' });
    }
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
};

/**
 * 获取当前登录用户资料及文章统计
 *
 * 需鉴权：req.user._id。并行查询文章篇数与总浏览量（排除已删除文章）。
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }

    // 一篇数、一聚合：减少往返，aggregate 汇总 viewCount
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

/**
 * 更新当前用户资料（部分字段）
 *
 * 仅处理 body 中出现的 string 类型字段；avatar / bio 有长度上限，防止超长存储。
 *
 * @param {import('express').Request} req body: { avatar?, bio? }
 * @param {import('express').Response} res
 */
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

/**
 * 修改密码（需知道当前密码）
 *
 * 校验新密码强度 → 比对当前密码 → 赋值新密码并由模型钩子重新哈希 → 写审计日志。
 *
 * @param {import('express').Request} req body: { currentPassword, newPassword }
 * @param {import('express').Response} res
 */
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

/**
 * 上传头像文件后的回调处理（multer 已把文件落到磁盘）
 *
 * 路由层应使用字段名 `avatar` 与 multer 配置一致；此处将公开 URL 路径写入用户文档。
 *
 * @param {import('express').Request & { file?: import('multer').File }} req
 * @param {import('express').Response} res
 */
const uploadAvatarFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ code: 400, message: '请选择图片文件' });
    }

    // 与静态资源挂载路径一致，前端可直接用作 img src
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

/**
 * 获取「忘记密码」算术验证码题目
 *
 * 不涉及邮箱；服务端生成 challengeId 与题目，客户端展示后随答案一并提交 resetPasswordForgot。
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getForgotChallenge = (req, res) => {
  try {
    const data = createChallenge();
    res.json({ code: 200, data });
  } catch (err) {
    res.status(500).json({ code: 500, message: err.message });
  }
};

/**
 * 通过账号 + 算术验证码重置密码（无邮件验证链路）
 *
 * 校验流程：必填项 → consumeChallenge（过期 / 锁定 / 答案错误）→ 新密码强度 → 查用户 → 禁用则拒绝 → 更新密码与审计。
 * 注意：安全模型弱于邮件链接，依赖验证码与会话侧防刷策略（见 forgotChallenge 工具）。
 *
 * @param {import('express').Request} req body: { usernameOrEmail, challengeId, answer, newPassword }
 * @param {import('express').Response} res
 */
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

    // 审计主体为被重置用户（非必为当前会话用户）
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
