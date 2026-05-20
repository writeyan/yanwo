/**
 * 页面访问记录（路径、来源 URL、解析后的 referer 主机、可选关联文章）。
 * 可用于后续统计；当前部分仪表盘仍用发文量作代理指标。
 */
const mongoose = require('mongoose');

const pageVisitSchema = new mongoose.Schema(
  {
    path: { type: String, required: true, maxlength: 500 },
    referer: { type: String, default: '', maxlength: 1000 },
    refererHost: { type: String, default: '', maxlength: 255 },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  },
  { timestamps: true }
);

pageVisitSchema.index({ createdAt: -1 });
pageVisitSchema.index({ refererHost: 1, createdAt: -1 });

module.exports = mongoose.model('PageVisit', pageVisitSchema);
