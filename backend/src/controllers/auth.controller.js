const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cloudinary = require('../config/cloudinary');
const stream = require('stream');

const JWT_SECRET = process.env.JWT_SECRET; // Startup guard enforced in index.js
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const syncUser = async (req, res, next) => {
  try {
    const { id, email, role } = req.body;

    let user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id,
          email,
          role: role || 'CUSTOMER'
        }
      });
    } else if (role && user.role !== role) {
      // Optional: Update role if explicitly provided and different
      user = await prisma.user.update({
        where: { id },
        data: { role }
      });
    }

    res.status(200).json({
      message: 'User synced successfully with Database',
      user
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        profileImageUrl: true,
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      message: 'User profile fetched successfully',
      user
    });
  } catch (error) {
    next(error);
  }
};

const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, companyName, gstNumber, address } = req.body;
    
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    let profileImageUrl = null;
    if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'chemicrown/profiles' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });
      profileImageUrl = uploadResult.secure_url;
    }

    const finalRole = email === 'admin@chemicrown.com' ? 'SUPER_ADMIN' : 'CUSTOMER';

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          profileImageUrl,
          role: finalRole
        }
      });

      // Always create Customer profile for CUSTOMER role — isVerified = false
      if (finalRole === 'CUSTOMER') {
        await tx.customer.create({
          data: {
            userId: newUser.id,
            companyName: companyName || `${firstName} ${lastName}`,
            gstNumber: gstNumber || null,
            address: address || null,
            isVerified: false // Admin must verify before customer can log in
          }
        });
      }

      return newUser;
    });

    // Do NOT return a session token — customer must wait for verification
    res.status(201).json({
      message: 'Registration successful! Your account is pending admin verification. You will be able to log in once verified.',
      requiresVerification: finalRole === 'CUSTOMER',
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role }
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password, rememberMe } = req.body;

    const user = await prisma.user.findUnique({ 
      where: { email },
      include: { customerProfile: true }
    });
    
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.deletedAt) {
      return res.status(401).json({ error: 'Your account has been deactivated. Please contact administration.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify Customer Status — block unverified customers regardless
    if (user.role === 'CUSTOMER') {
      const customerProfile = user.customerProfile;
      if (!customerProfile || !customerProfile.isVerified) {
        return res.status(403).json({ 
          error: 'Your account is pending admin verification. You will receive access once an administrator approves your account.',
          requiresVerification: true
        });
      }
    }

    const tokenExpiry = rememberMe ? '30d' : '7d';
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: tokenExpiry });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profileImageUrl: user.profileImageUrl
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    
    let updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone) updateData.phone = phone;


    if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'chemicrown/profiles' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });
      updateData.profileImageUrl = uploadResult.secure_url;
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: { id: true, email: true, firstName: true, lastName: true, role: true, profileImageUrl: true, phone: true }
    });

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

const getPendingCustomers = async (req, res, next) => {
  try {
    const customers = await prisma.customer.findMany({
      where: { isVerified: false },
      include: { user: true }
    });
    
    const formatted = customers.map(c => ({
      id: c.id,
      company: c.companyName || `${c.user.firstName} ${c.user.lastName}`,
      email: c.user.email,
      gst: c.gstNumber || 'N/A',
      appliedAt: c.user.createdAt ? c.user.createdAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    }));
    
    res.status(200).json({ success: true, customers: formatted });
  } catch (error) {
    next(error);
  }
};

const verifyCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const customer = await prisma.customer.findUnique({ where: { id }, include: { user: true } });
    if (!customer) return res.status(404).json({ success: false, error: 'Customer not found' });

    await prisma.$transaction(async (tx) => {
      await tx.customer.update({ where: { id }, data: { isVerified: true } });
      await tx.notification.create({
        data: {
          userId: customer.userId,
          message: `Your account has been verified! You can now place orders on ChemiCrown.`
        }
      });
    });

    res.status(200).json({ success: true, message: 'Customer verified successfully' });
  } catch (error) {
    next(error);
  }
};

const rejectCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) return res.status(404).json({ success: false, error: 'Customer not found' });
    if (customer.isVerified) return res.status(400).json({ success: false, error: 'Cannot reject an already verified customer' });

    // Delete customer profile and deactivate user in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.customer.delete({ where: { id } });
      await tx.user.update({
        where: { id: customer.userId },
        data: { deletedAt: new Date() }
      });
    });

    res.status(200).json({ success: true, message: 'Customer rejected and removed' });
  } catch (error) {
    next(error);
  }
};

const { sendOtpEmail } = require('../services/email.service');
const crypto = require('crypto');

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return 200 to prevent email enumeration
      return res.status(200).json({ success: true, message: 'If that email is registered, an OTP has been sent.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await prisma.user.update({
      where: { email },
      data: { resetPasswordOtp: otp, resetPasswordExpires: expires }
    });

    await sendOtpEmail(email, otp);

    res.status(200).json({ success: true, message: 'If that email is registered, an OTP has been sent.' });
  } catch (error) {
    next(error);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });

    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user || user.resetPasswordOtp !== otp || new Date() > user.resetPasswordExpires) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    res.status(200).json({ success: true, message: 'OTP verified successfully' });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ error: 'Email, OTP, and new password are required' });

    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user || user.resetPasswordOtp !== otp || new Date() > user.resetPasswordExpires) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email },
      data: { 
        password: hashedPassword,
        resetPasswordOtp: null,
        resetPasswordExpires: null
      }
    });

    res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || !user.password) {
      return res.status(400).json({ error: 'Cannot change password for this account type' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  syncUser,
  getMe,
  register,
  login,
  updateProfile,
  changePassword,
  getPendingCustomers,
  verifyCustomer,
  rejectCustomer,
  forgotPassword,
  verifyOtp,
  resetPassword
};
