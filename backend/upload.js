

// const multer = require('multer');
// const cloudinary = require('cloudinary').v2;
// const stream = require('stream');

// // Configure Cloudinary
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'ddqxfjw2g', // Replace with your cloud name
//   api_key: process.env.CLOUDINARY_API_KEY || '223975693464699',       // Replace with your API key
//   api_secret: process.env.CLOUDINARY_API_SECRET || 'wAmz9boyL7LOu3fyn4bk8JTNMOc'  // Replace with your API secret
// });

// // Configure multer memory storage
// const storage = multer.memoryStorage();

// // Create multer upload instance
// const upload = multer({ 
//   storage: storage,
//   limits: {
//     fileSize: 5 * 1024 * 1024 // 5MB limit
//   },
//   fileFilter: (req, file, cb) => {
//     const allowedTypes = /jpeg|jpg|png|webp/;
//     const extname = allowedTypes.test(file.originalname.toLowerCase());
//     const mimetype = allowedTypes.test(file.mimetype);
    
//     if (mimetype && extname) {
//       return cb(null, true);
//     } else {
//       cb(new Error('Only images (jpeg, jpg, png, webp) are allowed'));
//     }
//   }
// });

// // Function to upload buffer to Cloudinary
// const uploadToCloudinary = (buffer) => {
//   return new Promise((resolve, reject) => {
//     const uploadStream = cloudinary.uploader.upload_stream(
//       {
//         folder: "aloeglow-products",
//         resource_type: "image",
//         transformation: [
//           { width: 800, height: 800, crop: "limit" },
//           { quality: "auto" },
//           { format: "webp" }
//         ]
//       },
//       (error, result) => {
//         if (error) reject(error);
//         else resolve(result);
//       }
//     );

//     // Create a buffer stream
//     const bufferStream = new stream.PassThrough();
//     bufferStream.end(buffer);
//     bufferStream.pipe(uploadStream);
//   });
// };

// module.exports = {
//   upload,
//   cloudinary,
//   uploadToCloudinary
// };