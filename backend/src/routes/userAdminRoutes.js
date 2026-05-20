/**
 * 管理员用户路由：分页列表、按 ID PATCH 角色/状态。
 * 挂载前缀：/api/v1/users（与 app.js 一致）
 */
const express = require('express');
const { listUsersAdmin, patchUserAdmin } = require('../controllers/userAdminController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, admin, listUsersAdmin);
router.patch('/:id', protect, admin, patchUserAdmin);

module.exports = router;
