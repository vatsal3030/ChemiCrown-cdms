const express = require('express');
const { syncUser, getMe, register, login, updateProfile, changePassword, getPendingCustomers, verifyCustomer, rejectCustomer, forgotPassword, verifyOtp, resetPassword } = require('../controllers/auth.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { validateRequest } = require('../middlewares/validate.middleware');
const { syncUserSchema } = require('../validations/auth.validation');
const upload = require('../middlewares/upload.middleware');

const router = express.Router();

// Endpoint for Supabase webhooks or initial frontend registration to sync User to Prisma
router.post('/sync', validateRequest(syncUserSchema), syncUser);

// Protected endpoint to fetch current authenticated user profile
router.get('/me', requireAuth, getMe);

// Local JWT endpoints
router.post('/register', upload.single('image'), register);
router.post('/login', login);
router.put('/profile', requireAuth, upload.single('image'), updateProfile);
router.post('/change-password', requireAuth, changePassword);

// Password Reset endpoints
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

// Admin customer verification
const { requireRole } = require('../middlewares/rbac.middleware');
router.get('/pending-customers', requireAuth, requireRole(['SUPER_ADMIN', 'OWNER']), getPendingCustomers);
router.post('/verify-customer/:id', requireAuth, requireRole(['SUPER_ADMIN', 'OWNER']), verifyCustomer);
router.delete('/reject-customer/:id', requireAuth, requireRole(['SUPER_ADMIN', 'OWNER']), rejectCustomer);

module.exports = router;
