const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();
connectDB();


// ✅ CORS - MUST BE BEFORE STATIC FILES
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5000',
  'https://dbsl.onrender.com',
  'https://dbsl-liart.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

// ✅ Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ MANUAL DIAGRAM SERVING - More control than express.static
app.get('/api/diagrams/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    
    // Security: prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).send('Invalid filename');
    }
    
    const filepath = path.join(__dirname, 'uploads', 'diagrams', filename);
    
    console.log('[Diagrams] Request for:', filename);
    
    if (!fs.existsSync(filepath)) {
      console.log('[Diagrams] File not found:', filepath);
      return res.status(404).send('Diagram not found');
    }
    
    // Read file
    const buffer = fs.readFileSync(filepath);
    const ext = path.extname(filename).toLowerCase();
    
    // Set content type
    let contentType = 'image/png';
    if (ext === '.svg') {
      contentType = 'image/svg+xml';
    } else if (ext === '.jpg' || ext === '.jpeg') {
      contentType = 'image/jpeg';
    }
    
    // Set headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    
    console.log('[Diagrams] ✅ Serving:', filename, `(${buffer.length} bytes, ${contentType})`);
    
    // Send file
    res.send(buffer);
    
  } catch (error) {
    console.error('[Diagrams] Error:', error);
    res.status(500).send('Error serving diagram');
  }
});

// General uploads directory (for other files)
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    maxAge: '1d',
    etag: true,
    lastModified: true,
    setHeaders: (res) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "public, max-age=86400");
    },
  })
);

// ✅ Diagnostic routes (optional - for debugging)
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
      const buffer = fs.readFileSync(filepath);
      
      const isPNG = buffer.slice(0, 8).toString('hex') === '89504e470d0a1a0a';
      const contentStart = buffer.toString('utf8', 0, 100);
      const isSVG = contentStart.includes('<svg') || contentStart.includes('<?xml');
      
      return {
        filename,
        size: stats.size,
        created: stats.birthtime,
        isPNG,
        isSVG,
        actualType: isPNG ? 'PNG' : isSVG ? 'SVG' : 'Unknown'
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

app.get('/api/debug/diagram/:filename', (req, res) => {
  try {
    const filepath = path.join(__dirname, 'uploads', 'diagrams', req.params.filename);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'File not found', path: filepath });
    }
    
    const buffer = fs.readFileSync(filepath);
    const stats = fs.statSync(filepath);
    
    const isPNG = buffer.slice(0, 8).toString('hex') === '89504e470d0a1a0a';
    const contentStart = buffer.toString('utf8', 0, 100);
    const isSVG = contentStart.includes('<svg') || contentStart.includes('<?xml');
    
    res.json({
      filename: req.params.filename,
      path: filepath,
      exists: true,
      size: stats.size,
      isPNG,
      isSVG,
      actualType: isPNG ? 'PNG' : isSVG ? 'SVG' : 'Unknown',
      first100chars: contentStart,
      first20bytes: buffer.slice(0, 20).toString('hex')
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint to verify server is working
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    diagramsPath: path.join(__dirname, "uploads", "diagrams")
  });
});

// ✅ API ROUTES
const authRoutes = require('./routes/authRoutes');
const aiRoutes = require('./routes/aiRoutes');
const docRoutes = require('./routes/documentRoutes');
const teachersRoutes = require('./routes/teacherRoutes');
const schoolRoutes = require('./routes/schoolRoutes');
const paymentRoute = require('./routes/paymentRoute');
const activityRoutes = require('./routes/activityRoutes');
const cbcEntryRoutes = require('./routes/cbcEntryRoutes');
const mpesaRoute = require('./routes/mpesaRoute');
const docDashRoutes = require('./routes/docDashRoutes');
const schoolConfigRoutes = require('./routes/schoolConfigRoutes');

app.use('/api/user', authRoutes);
app.use('/api/documents', docRoutes);
app.use('/api/teacher', teachersRoutes);
app.use('/api/teachers', teachersRoutes);
app.use('/api/school', schoolRoutes);
app.use('/api/payments', paymentRoute);
app.use('/api/activities', activityRoutes);
app.use('/api/cbc', cbcEntryRoutes);
app.use('/api', mpesaRoute);
app.use('/api/document-purchases', docDashRoutes);
app.use('/api/school-config', schoolConfigRoutes);
app.use("/api/ai", aiRoutes);
app.get('/api/debug/fix-counts/:userId', teachersRoutes);

// ✅ 404 handler
app.use((req, res, next) => {
  console.log(`[404] Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ 
    error: 'Route not found',
    path: req.url,
    method: req.method
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
  console.log(`✅ Server running on PORT ${PORT}`);
  console.log(`✅ Diagrams: http://localhost:${PORT}/api/diagrams/[filename]`);
  console.log(`✅ Uploads: http://localhost:${PORT}/uploads/[folder]/[filename]`);
  console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
  console.log(`✅ Debug diagrams: http://localhost:${PORT}/api/debug/diagrams`);
});