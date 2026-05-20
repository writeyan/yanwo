/**
 * 认证路由：注册、登录、个人资料读写、改密、头像上传（multipart）。
 * 挂载前缀：/api/v1/auth（见 app.js）
 */
const express = require('express');
const {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  changePassword,
  uploadAvatarFile,
  getForgotChallenge,
  resetPasswordForgot,
} = require('../controllers/authController');
const { uploadAvatar } = require('../middleware/uploadAvatar');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

router.get('/forgot/challenge', getForgotChallenge);
router.post('/forgot/reset', resetPasswordForgot);

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, changePassword);

// multer 错误（类型/大小）转为 JSON 400，避免默认 HTML 错误页
router.post('/avatar', protect, (req, res, next) => {
  uploadAvatar.single('avatar')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ code: 400, message: err.message || '上传失败' });
    }
    next();
  });
}, uploadAvatarFile);

module.exports = router;
