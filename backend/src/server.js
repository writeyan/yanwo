/**
 * Node 进程入口：加载环境变量、连接 MongoDB、监听 HTTP 端口（默认 PORT 或 5000）。
 * Express 应用定义在 app.js。
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