/**
 * Express 应用组装
 *
 * 中间件顺序：helmet → cors → json → morgan → 静态 `/uploads` → 各 API 子路由 → 测试路由 → 500 兜底。
 * API 版本前缀：`/api/v1` 下分模块挂载（auth、posts、comments、stats、categories、users）。
 * `trust proxy`：部署在 Nginx 等反向代理后时，便于 `req.ip`、日志与限流识别真实客户端。
 */
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');
const statsRoutes = require('./routes/statsRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const userAdminRoutes = require('./routes/userAdminRoutes');

dotenv.config();
const app = express();

// 部署在反向代理后时，用于正确识别客户端 IP（如访问日志、限流）
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
// 用户上传的头像等静态文件
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/posts', postRoutes);
app.use('/api/v1/comments', commentRoutes);
app.use('/api/v1/stats', statsRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/users', userAdminRoutes);

// 可选测试路由（放后面）
app.get('/test', (req, res) => res.send('app root test'));

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ code: 500, message: err.message });
});

module.exports = app;