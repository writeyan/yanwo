/**
 * 文章封面图上传（Multer 磁盘存储）
 *
 * - 目录：`backend/uploads/featured`
 * - 命名与头像策略相同（时间戳 + 随机 + 安全扩展名）
 * - 单文件上限 5MB（大于头像）；MIME 限制与头像一致
 *
 * 上传成功后由 postController.uploadFeaturedCover 返回 `/uploads/featured/...` 路径，
 * 前端在保存文章时把该路径写入 `featuredImage` 字段。
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads/featured');
try {
  fs.mkdirSync(uploadDir, { recursive: true });
} catch {
  // ignore
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safe = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext) ? ext : '.jpg';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${safe}`);
  },
});

const uploadFeatured = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpeg|png|gif|webp)$/i.test(file.mimetype);
    cb(ok ? null : new Error('仅支持 JPEG / PNG / GIF / WebP 图片'), ok);
  },
});

module.exports = { uploadFeatured };
