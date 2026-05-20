/**
 * Node HTTP 服务进程入口
 *
 * 启动顺序：
 * 1. 加载 `app`（Express 应用实例，见 app.js）
 * 2. dotenv 读取 `.env`（MONGO_URI、JWT_SECRET、PORT 等）
 * 3. connectDB() 建立 MongoDB 连接；失败时 db.js 内会 process.exit(1)
 * 4. app.listen 绑定端口：环境变量 PORT，缺省 5000
 *
 * 注意：业务路由与中间件均在 app.js 组装，本文件不包含路由定义。
 */
const app = require('./app');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
dotenv.config();

const PORT = process.env.PORT || 5000;

connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
