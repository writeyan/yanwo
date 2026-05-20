/**
 * Express 4 参数形式错误处理中间件 (err, req, res, next)
 *
 * 根据当前 res.statusCode 决定 HTTP 状态（若仍为 200 则视为未设置，退回 500）。
 * 生产环境不返回 stack，避免泄露实现细节；开发环境附带 err.stack 便于调试。
 *
 * 说明：app.js 末尾另有一处内联 500 处理器；若需统一可改为挂载本模块。
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    code: statusCode,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = errorHandler;
