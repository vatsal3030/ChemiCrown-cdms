const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');
const lotController = require('../controllers/lot.controller');

// All lot endpoints require authentication
router.use(requireAuth);

// Get all lots
router.get('/', lotController.getLots);

// Get a specific lot
router.get('/:id', lotController.getLotById);

// Create a new lot (QC/Admin only) - allows CoA document upload
router.post('/', requireRole(['SUPER_ADMIN', 'OWNER', 'MANAGER', 'QUALITY_CONTROL']), upload.single('coaDocument'), lotController.createLot);

// Update a lot (e.g. approve quarantine)
router.put('/:id', requireRole(['SUPER_ADMIN', 'OWNER', 'MANAGER', 'QUALITY_CONTROL']), upload.single('coaDocument'), lotController.updateLot);

module.exports = router;
