/** 管理端统计数据（需管理员权限） */
import request from './request';
export const getDashboardStats = () => request.get('/stats/dashboard');
export const getVisitTrend = () => request.get('/stats/trend');
export const getTagRatio = () => request.get('/stats/tag-ratio');
export const getCategoryHeatmap = () => request.get('/stats/category-heatmap');
export const getCommentSentiment = () => request.get('/stats/comment-sentiment');