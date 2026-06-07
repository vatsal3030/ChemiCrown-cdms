const express = require('express');
const router = express.Router();
const fc = require('../controllers/finance.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/rbac.middleware');

router.use(requireAuth);
router.use(requireRole(['SUPER_ADMIN', 'OWNER']));

// P&L overview
router.get('/overview', fc.getOverview);

// Full ledger log with pagination + filters
router.get('/ledger', fc.getLedger);

// Expenses CRUD
router.get('/expenses',       fc.getExpenses);
router.post('/expenses',      fc.createExpense);
router.put('/expenses/:id',   fc.updateExpense);
router.delete('/expenses/:id', fc.deleteExpense);

// Retroactive ledger sync (one-time / on-demand)
router.post('/sync-ledger', fc.syncLedger);

module.exports = router;
