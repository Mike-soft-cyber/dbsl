const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();
connectDB();

// ✅ CRITICAL FIX: Global CORS middleware FIRST (before any routes)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://localhost:5000',
  'https://dbsl.onrender.com',
  'https://dbsl-liart.vercel.app'
];

// ✅ Enhanced CORS config with credentials
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('[CORS] Blocked origin:', origin);
      callback(null, true); // Still allow for development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

// ✅ Additional security headers for images
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  next();
});

// ✅ Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.options('/api/diagrams/:filename', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.sendStatus(204);
});

// ✅ CRITICAL: Diagram serving route BEFORE other routes
app.get('/api/diagrams/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    
    // Security: prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      console.error('[Diagrams] Invalid filename:', filename);
      return res.status(400).send('Invalid filename');
    }
    
    const filepath = path.join(__dirname, 'uploads', 'diagrams', filename);
    
    console.log('[Diagrams] Request for:', filename);
    
    if (!fs.existsSync(filepath)) {
      console.error('[Diagrams] ❌ File not found:', filepath);
      return res.status(404).send('Diagram not found');
    }
    
    // Read file
    const buffer = fs.readFileSync(filepath);
    const ext = path.extname(filename).toLowerCase();
    
    // ✅ Determine content type
    let contentType = 'image/png';
    if (ext === '.svg') {
      contentType = 'image/svg+xml';
    } else if (ext === '.jpg' || ext === '.jpeg') {
      contentType = 'image/jpeg';
    } else if (ext === '.gif') {
      contentType = 'image/gif';
    } else if (ext === '.webp') {
      contentType = 'image/webp';
    }
    
    // ✅ Set headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    
    console.log('[Diagrams] ✅ Serving:', filename, `(${buffer.length} bytes, ${contentType})`);
    
    res.send(buffer);
    
  } catch (error) {
    console.error('[Diagrams] ❌ Error:', error);
    res.status(500).send('Error serving diagram');
  }
});

// ✅ OPTIONS handler for preflight requests
app.options('/api/diagrams/:filename', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.sendStatus(204);
});

// General uploads directory
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    maxAge: '1d',
    etag: true,
    lastModified: true,
    setHeaders: (res, filepath) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.setHeader("Cache-Control", "public, max-age=86400");
    },
  })
);

// ✅ Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    diagramsPath: path.join(__dirname, "uploads", "diagrams"),
    cors: 'enabled'
  });
});

// ✅ Test image endpoint
app.get('/api/test-image', (req, res) => {
  // Create a simple 1x1 red pixel PNG
  const redPixel = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
    0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
    0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xDD, 0x8D, 0xB4, 0x00, 0x00, 0x00,
    0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
  
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache');
  res.send(redPixel);
});

// ✅ Debug endpoint
app.get('/api/debug/diagrams', async (req, res) => {
  try {
    const diagramsPath = path.join(__dirname, 'uploads', 'diagrams');
    
    if (!fs.existsSync(diagramsPath)) {
      return res.json({
        error: 'Diagrams directory does not exist',
        path: diagramsPath
      });
    }
    
    const files = fs.readdirSync(diagramsPath);
    
    const fileDetails = files.map(filename => {
      const filepath = path.join(diagramsPath, filename);
      const stats = fs.statSync(filepath);
      
      return {
        filename,
        size: stats.size,
        url: `/api/diagrams/${filename}`,
        fullUrl: `http://localhost:5000/api/diagrams/${filename}`,
        created: stats.birthtime
      };
    });
    
    res.json({
      directory: diagramsPath,
      totalFiles: files.length,
      files: fileDetails
    });
    
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// ✅ API ROUTES (keep your existing routes)
const authRoutes = require('./routes/authRoutes');
const docRoutes = require('./routes/documentRoutes');
const teachersRoutes = require('./routes/teacherRoutes');
const schoolRoutes = require('./routes/schoolRoutes');
const paymentRoute = require('./routes/paymentRoute');
const activityRoutes = require('./routes/activityRoutes');
const cbcEntryRoutes = require('./routes/cbcEntryRoutes');
const mpesaRoute = require('./routes/mpesaRoute');
const docDashRoutes = require('./routes/docDashRoutes');
const schoolConfigRoutes = require('./routes/schoolConfigRoutes');
const curriculumConfigRoutes = require('./routes/curriculumConfigRoutes');
const cbcReviewRoutes = require('./routes/cbcReviewRoutes');
const imageRoutes = require('./routes/imageRoutes')

app.use('/api/user', authRoutes);
app.use('/api/documents', docRoutes);
app.use('/api/teacher', teachersRoutes);
app.use('/api/teachers', teachersRoutes);
app.use('/api/school', schoolRoutes);
app.use('/api/payments', paymentRoute);
app.use('/api/activities', activityRoutes);
app.use('/api/cbc', cbcEntryRoutes);
app.use('/api', imageRoutes);
app.use('/api/document-purchases', docDashRoutes);
app.use('/api/curriculum-config', curriculumConfigRoutes);
app.use('/api/cbc-review', cbcReviewRoutes);
app.use('/api/school-config', schoolConfigRoutes);

// ✅ 404 handler
app.use((req, res, next) => {
  if (req.path !== '/favicon.ico') {
    console.log(`[404] Route not found: ${req.method} ${req.url}`);
  }
  res.status(404).json({ 
    error: 'Route not found',
    path: req.url
  });
});

// ✅ Error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Server running on PORT ${PORT}`);
  console.log(`✅ Diagrams: http://localhost:${PORT}/api/diagrams/[filename]`);
  console.log(`✅ Test image: http://localhost:${PORT}/api/test-image`);
  console.log(`✅ Debug: http://localhost:${PORT}/api/debug/diagrams`);
  console.log(`✅ CORS enabled for: ${allowedOrigins.join(', ')}`);
  console.log(`🌐 BACKEND_URL: ${process.env.BACKEND_URL || 'NOT SET'}`);
  console.log(`📍 NODE_ENV: ${process.env.NODE_ENV || 'NOT SET'}`);
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});