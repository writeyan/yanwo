/**
 * Express 应用组装：全局中间件、静态目录、REST 路由挂载（统一前缀 /api/v1）。
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

// 可选测试路由（放后面）
app.get('/test', (req, res) => res.send('app root test'));

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ code: 500, message: err.message });
});

module.exports = app;