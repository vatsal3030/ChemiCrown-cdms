const express = require('express');
const router = express.Router();
const leavesController = require('../controllers/leaves.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/rbac.middleware');

router.use(requireAuth);

// Employee: submit and view own leaves
router.post('/', leavesController.submitLeaveRequest);
router.get('/my', leavesController.getMyLeaves);

// HR/Admin: view all and review
const hrAccess = requireRole(['SUPER_ADMIN', 'OWNER', 'MANAGER']);
router.get('/', hrAccess, leavesController.getAllLeaves);
router.put('/:id/review', hrAccess, leavesController.reviewLeave);

module.exports = router;
