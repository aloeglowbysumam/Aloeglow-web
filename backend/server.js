const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const stream = require('stream');
const Product = require("./models/Product");

const app = express();

// Enable CORS for all origins during development
app.use(cors({
  origin: '*', // Allow all origins for now
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'du37bw0ie',
  api_key: '894243368687274',
  api_secret: 'kcr0-VdUaiq2z6UAd7bQSmz2gIA'
});

// Configure multer for memory storage
const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|gif/;
    const extname = allowedTypes.test(file.originalname.toLowerCase().match(/\.[0-9a-z]+$/i)?.[0] || '');
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, webp, gif)'));
    }
  }
});

// Function to upload buffer to Cloudinary
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "aloeglow-products",
        resource_type: "image",
        transformation: [
          { width: 800, height: 800, crop: "limit" },
          { quality: "auto" },
          { format: "webp" }
        ]
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);
    bufferStream.pipe(uploadStream);
  });
};

// MongoDB Connection - UPDATED OPTIONS
// The previous cloud cluster (cluster0.j8jkgbo.mongodb.net) appears to be deactivated/deleted.
// Please set your MONGODB_URI environment variable, or run MongoDB locally.
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://aloeglowbysumam_db_user:CiECJM5h6jpxeSMM@cluster0.1timxib.mongodb.net/shopdb?appName=Cluster0";

// Simple connection without deprecated options
mongoose.connect(MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch(err => {
    console.error("❌ MongoDB Connection Error:", err.message);
    console.log("ℹ️ Trying alternative connection method...");
    
    // Try alternative connection method
    mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    })
    .then(() => console.log("✅ MongoDB Connected via alternative method"))
    .catch(err2 => console.error("❌ Alternative connection also failed:", err2.message));
  });

// MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Mongoose disconnected from MongoDB');
});

// Test Data (for development)
const seedProducts = async () => {
  try {
    const count = await Product.countDocuments();
    if (count === 0) {
      const products = [
        {
          name: "Aloe Vera Soap",
          price: 149,
          category: "soap",
          rating: 4.5,
          imageUrl: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          description: "Pure aloe vera soap for glowing skin",
          createdAt: new Date()
        },
        {
          name: "Neem Face Wash",
          price: 299,
          category: "skincare",
          rating: 4.2,
          imageUrl: "https://images.unsplash.com/photo-1556228578-9c360e1d8d34?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          description: "Natural neem face wash for clear skin",
          createdAt: new Date()
        },
        {
          name: "Herbal Shampoo",
          price: 249,
          category: "haircare",
          rating: 4.7,
          imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          description: "Herbal shampoo for strong and shiny hair",
          createdAt: new Date()
        }
      ];
      
      await Product.insertMany(products);
      console.log("✅ Test products added to database");
    }
  } catch (error) {
    console.error("❌ Error seeding products:", error);
  }
};

// API ROUTES

// GET ALL PRODUCTS
app.get("/products", async (req, res) => {
  try {
    console.log("📋 Fetching all products...");
    const products = await Product.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: products.length,
      products: products
    });
    
    console.log(`✅ Sent ${products.length} products`);
  } catch (error) {
    console.error("❌ Error fetching products:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
});

// GET SINGLE PRODUCT
app.get("/products/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    console.log(`🔍 Fetching product: ${productId}`);
    
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: "Product not found" 
      });
    }
    
    res.json({
      success: true,
      product: product
    });
    
  } catch (error) {
    console.error("❌ Error fetching product:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
});

// ADD NEW PRODUCT
app.post("/add-product", upload.array("images", 5), async (req, res) => {
  try {
    console.log("📦 Adding new product...");
    
    const { name, price, category, rating, description, whatsappLink, sizes } = req.body;
    
    // Validation
    if (!name || !price || !category || !rating) {
      return res.status(400).json({ 
        success: false,
        message: "Name, price, category, and rating are required" 
      });
    }
    
    let imageUrl = "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
    let additionalImages = [];
    
    // Upload to Cloudinary if files exist
    if (req.files && req.files.length > 0) {
      try {
        console.log(`☁️ Uploading ${req.files.length} images to Cloudinary...`);
        const uploadPromises = req.files.map(file => uploadToCloudinary(file.buffer));
        const results = await Promise.all(uploadPromises);
        
        imageUrl = results[0].secure_url;
        additionalImages = results.slice(1).map(r => r.secure_url);
        console.log("✅ Cloudinary uploads successful");
      } catch (cloudinaryError) {
        console.error("❌ Cloudinary upload error:", cloudinaryError.message);
      }
    }
    
    let parsedSizes = [];
    if (sizes) {
      try {
        parsedSizes = JSON.parse(sizes);
      } catch (e) {
        console.error("Error parsing sizes:", e);
      }
    }

    // Create product
    const product = new Product({
      name: name.trim(),
      price: parseFloat(price),
      category: category.toLowerCase().trim(),
      rating: parseFloat(rating),
      imageUrl: imageUrl,
      additionalImages: additionalImages,
      description: (description || "").trim(),
      whatsappLink: (whatsappLink || "").trim(),
      sizes: parsedSizes,
      createdAt: new Date()
    });
    
    await product.save();
    
    console.log("✅ Product added:", product._id);
    
    res.status(201).json({
      success: true,
      message: "Product added successfully",
      product: product
    });
    
  } catch (error) {
    console.error("❌ Error adding product:", error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false,
        message: "Validation error",
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
});

// EDIT PRODUCT
app.put("/edit-product/:id", upload.array("images", 5), async (req, res) => {
  try {
    const productId = req.params.id;
    console.log(`✏️ Editing product: ${productId}`);
    
    const { name, price, category, rating, description, whatsappLink, sizes } = req.body;
    
    // Validation
    if (!name || !price || !category || !rating) {
      return res.status(400).json({ 
        success: false,
        message: "Name, price, category, and rating are required" 
      });
    }
    
    // Find the existing product
    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    
    let imageUrl = existingProduct.imageUrl;
    let additionalImages = existingProduct.additionalImages;
    
    // If new files were uploaded, overwrite the old images
    if (req.files && req.files.length > 0) {
      try {
        console.log(`☁️ Uploading ${req.files.length} NEW images to Cloudinary...`);
        const uploadPromises = req.files.map(file => uploadToCloudinary(file.buffer));
        const results = await Promise.all(uploadPromises);
        
        imageUrl = results[0].secure_url;
        additionalImages = results.slice(1).map(r => r.secure_url);
        console.log("✅ Cloudinary uploads successful for edited product");
      } catch (cloudinaryError) {
        console.error("❌ Cloudinary upload error during edit:", cloudinaryError.message);
      }
    }
    
    let parsedSizes = [];
    if (sizes) {
      try {
        parsedSizes = JSON.parse(sizes);
      } catch (e) {
        console.error("Error parsing sizes:", e);
      }
    }

    // Update fields
    existingProduct.name = name.trim();
    existingProduct.price = parseFloat(price);
    existingProduct.category = category.toLowerCase().trim();
    existingProduct.rating = parseFloat(rating);
    existingProduct.description = (description || "").trim();
    existingProduct.whatsappLink = (whatsappLink || "").trim();
    existingProduct.imageUrl = imageUrl;
    existingProduct.additionalImages = additionalImages;
    existingProduct.sizes = parsedSizes;
    
    await existingProduct.save();
    
    res.json({
      success: true,
      message: "Product updated successfully",
      product: existingProduct
    });
    
  } catch (error) {
    console.error("❌ Error editing product:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
});

// DELETE PRODUCT
app.delete("/delete/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    console.log(`🗑️ Deleting product: ${productId}`);
    
    const product = await Product.findByIdAndDelete(productId);
    
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: "Product not found" 
      });
    }
    
    res.json({
      success: true,
      message: "Product deleted successfully"
    });
    
  } catch (error) {
    console.error("❌ Error deleting product:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
});

// HEALTH CHECK
app.get("/health", (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  let dbStatusText = "Disconnected";
  
  switch(dbStatus) {
    case 0: dbStatusText = "Disconnected"; break;
    case 1: dbStatusText = "Connected"; break;
    case 2: dbStatusText = "Connecting"; break;
    case 3: dbStatusText = "Disconnecting"; break;
  }
  
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    database: dbStatusText,
    cloudinary: "Configured"
  });
});

// DEFAULT ROUTE
app.get("/", (req, res) => {
  res.json({
    message: "🚀 Aloeglow Store API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      getAllProducts: "GET /products",
      getProduct: "GET /products/:id",
      addProduct: "POST /add-product",
      deleteProduct: "DELETE /delete/:id"
    }
  });
});

// ERROR HANDLING MIDDLEWARE
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.message);
  
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: "File upload error",
      error: err.message
    });
  }
  
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: err.message
  });
});

// START SERVER
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API URL: http://localhost:${PORT}`);
  console.log(`🌐 Health Check: http://localhost:${PORT}/health`);
  console.log(`📦 Products: http://localhost:${PORT}/products`);
  console.log(`☁️ Cloudinary: Configured for image uploads`);
  
  // Wait a moment for MongoDB connection
  setTimeout(async () => {
    if (mongoose.connection.readyState === 1) {
      await seedProducts();
    } else {
      console.log("⚠️ MongoDB not connected, skipping seed data");
    }
  }, 2000);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('👋 Shutting down server...');
  await mongoose.connection.close();
  console.log('✅ MongoDB connection closed');
  process.exit(0);
});