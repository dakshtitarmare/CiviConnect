const cloudinary = require('../config/cloudinary');
const stream = require('stream');

const imageController = {
  // Upload image to Cloudinary
  async uploadImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No image file provided' });
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'issue-reports'
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            return res.status(500).json({ success: false, error: 'Failed to upload image' });
          }

          res.status(200).json({
            success: true,
            message: 'Image uploaded successfully',
            imageURL: result.secure_url,
            public_id: result.public_id
          });
        }
      );

      const bufferStream = new stream.PassThrough();
      bufferStream.end(req.file.buffer);
      bufferStream.pipe(uploadStream);
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({ success: false, error: 'Failed to upload image' });
    }
  }
};

module.exports = imageController;