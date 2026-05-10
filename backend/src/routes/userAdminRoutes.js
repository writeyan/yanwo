const express = require('express');
const { listUsersAdmin, patchUserAdmin } = require('../controllers/userAdminController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, admin, listUsersAdmin);
router.patch('/:id', protect, admin, patchUserAdmin);

module.exports = router;
