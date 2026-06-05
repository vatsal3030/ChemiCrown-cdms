const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configure Cloudinary with fallback for local dev if missing
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo', 
  api_key: process.env.CLOUDINARY_API_KEY || '123456789012345', 
  api_secret: process.env.CLOUDINARY_API_SECRET || 'abcde12345'
});

module.exports = cloudinary;
