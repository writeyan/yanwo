/**
 * MongoDB（Mongoose）连接封装
 *
 * - 连接串来自环境变量 `MONGO_URI`（需在 .env 中配置）
 * - 成功时打印连接主机名，便于部署排查
 * - 失败时打印错误并 `process.exit(1)`，避免无数据库状态下继续提供服务
 */
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
