const cloudinary = require('./src/config/cloudinary');

console.log('Testing Cloudinary upload...');
cloudinary.uploader.upload('https://via.placeholder.com/150', { folder: 'chemicrown/profiles' }, (error, result) => {
  if (error) {
    console.error('Cloudinary upload failed:', error);
  } else {
    console.log('Cloudinary upload success. Secure URL:', result.secure_url);
  }
});
