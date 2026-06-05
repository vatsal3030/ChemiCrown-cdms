const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cloudinary = require('../config/cloudinary');
const stream = require('stream');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';
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
    res.status(200).json({
      message: 'User profile fetched successfully',
      user: req.user
    });
  } catch (error) {
    next(error);
  }
};

const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;
    
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

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        profileImageUrl,
        role: role || (email === 'admin@chemicrown.com' ? 'SUPER_ADMIN' : 'CUSTOMER')
      }
    });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, profileImageUrl: user.profileImageUrl }
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ 
      where: { email },
      include: { customerProfile: true }
    });
    
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify Customer Status
    if (user.role === 'CUSTOMER' && user.customerProfile && !user.customerProfile.isVerified) {
      return res.status(401).json({ error: 'Account pending admin verification. Please wait until an admin verifies your account.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

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
    res.status(500).json({ error: 'Login failed' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    
    let updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone) updateData.phone = phone;

    console.log('Update Profile Request:', { body: req.body, file: req.file ? 'Present' : 'Missing' });

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
    await prisma.customer.update({
      where: { id },
      data: { isVerified: true }
    });
    res.status(200).json({ success: true, message: 'Customer verified' });
  } catch (error) {
    next(error);
  }
};

module.exports = { syncUser, getMe, register, login, updateProfile, getPendingCustomers, verifyCustomer };
