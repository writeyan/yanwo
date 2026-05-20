/**
 * 用户头像上传（Multer 磁盘存储）
 *
 * - 目录：`backend/uploads/avatars`（启动时 ensureDir）
 * - 文件名：时间戳 + 随机串 + 安全扩展名（非白名单扩展则回退为 .jpg）
 * - 限制：单文件最大 2MB；MIME 仅 JPEG / PNG / GIF / WebP
 *
 * 路由中应使用 `uploadAvatar.single('avatar')`，与 authController 约定字段名一致。
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads/avatars');
try {
  fs.mkdirSync(uploadDir, { recursive: true });
} catch {
  // 目录已存在或权限问题时忽略；multer 写入时再暴露错误
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safe = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext) ? ext : '.jpg';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${safe}`);
  },
});

const uploadAvatar = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpeg|png|gif|webp)$/i.test(file.mimetype);
    cb(ok ? null : new Error('仅支持 JPEG / PNG / GIF / WebP 图片'), ok);
  },
});

module.exports = { uploadAvatar };
