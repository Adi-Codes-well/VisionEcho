const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload in-memory buffer
const uploadImageToCloudinary = async (fileBuffer, filename) => {
  try {
    const uploadResponse = await cloudinary.uploader.upload_stream(
      { resource_type: 'image', public_id: `ai-results/${Date.now()}-${filename}` },
      (error, result) => {
        if (error) throw error;
        return result;
      }
    );

    // Convert buffer to readable stream
    const streamifier = require('streamifier');
    streamifier.createReadStream(fileBuffer).pipe(uploadResponse);

    // Await upload result (promisify)
    return new Promise((resolve, reject) => {
      uploadResponse.on('finish', resolve);
      uploadResponse.on('error', reject);
    });
  } catch (err) {
    console.error('Cloudinary upload failed:', err.message);
    throw err;
  }
};

module.exports = { uploadImageToCloudinary };
