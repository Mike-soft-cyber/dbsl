// routes/imageRoutes.js - Serve images from backend/diagrams/

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;

/**
 * ✅ Serve learning concept diagrams
 * Route: GET /api/diagrams/:grade/:subject/:filename
 * Example: /api/diagrams/grade-7/science/parts-of-a-plant.jpg
 */
router.get('/diagrams/:grade/:subject/:filename', async (req, res) => {
  try {
    const { grade, subject, filename } = req.params;
    
    console.log(`[DiagramRoute] Request: ${grade}/${subject}/${filename}`);
    
    // Security: prevent directory traversal
    if (grade.includes('..') || subject.includes('..') || filename.includes('..')) {
      console.log('[DiagramRoute] ❌ Security: Directory traversal attempt blocked');
      return res.status(400).json({ error: 'Invalid path' });
    }
    
    // Security: only allow specific file extensions
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg'];
    const ext = path.extname(filename).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      console.log(`[DiagramRoute] ❌ Security: Invalid file extension: ${ext}`);
      return res.status(400).json({ error: 'Invalid file type' });
    }
    
    // Build path: backend/diagrams/{grade}/{subject}/{filename}
    const imagePath = path.join(
      __dirname,
      '..',
      'diagrams',
      grade,
      subject,
      filename
    );
    
    console.log(`[DiagramRoute] Looking for: ${imagePath}`);
    
    // Check if file exists
    try {
      await fs.access(imagePath);
    } catch {
      console.log(`[DiagramRoute] ❌ File not found: ${imagePath}`);
      return res.status(404).json({ 
        error: 'Image not found',
        path: `diagrams/${grade}/${subject}/${filename}`,
        tip: `Save the image as: backend/diagrams/${grade}/${subject}/${filename}`
      });
    }
    
    // Get file stats
    const stats = await fs.stat(imagePath);
    console.log(`[DiagramRoute] ✅ Found file: ${stats.size} bytes`);
    
    // Determine content type
    const contentTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml'
    };
    
    const contentType = contentTypes[ext] || 'image/jpeg';
    
    // Set headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours cache
    res.setHeader('Access-Control-Allow-Origin', '*'); // CORS for frontend
    
    // Send file
    res.sendFile(imagePath);
    
  } catch (error) {
    console.error('[DiagramRoute] ❌ Error serving image:', error);
    res.status(500).json({ 
      error: 'Failed to serve image',
      message: error.message 
    });
  }
});

/**
 * ✅ List all images for a grade/subject combination
 * Route: GET /api/diagrams/:grade/:subject
 * Example: /api/diagrams/grade-7/science
 */
router.get('/diagrams/:grade/:subject', async (req, res) => {
  try {
    const { grade, subject } = req.params;
    
    console.log(`[DiagramRoute] Listing images: ${grade}/${subject}`);
    
    // Security checks
    if (grade.includes('..') || subject.includes('..')) {
      return res.status(400).json({ error: 'Invalid path' });
    }
    
    const dirPath = path.join(__dirname, '..', 'diagrams', grade, subject);
    
    // Check if directory exists
    try {
      await fs.access(dirPath);
    } catch {
      console.log(`[DiagramRoute] ❌ Directory not found: ${dirPath}`);
      return res.json({
        grade,
        subject,
        images: [],
        count: 0,
        message: 'No images found for this grade/subject combination'
      });
    }
    
    // Read directory
    const files = await fs.readdir(dirPath);
    
    // Filter for image files
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg'];
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return imageExtensions.includes(ext);
    });
    
    // Get file details
    const images = await Promise.all(
      imageFiles.map(async (filename) => {
        const filepath = path.join(dirPath, filename);
        const stats = await fs.stat(filepath);
        
        return {
          filename,
          url: `/api/diagrams/${grade}/${subject}/${filename}`,
          size: stats.size,
          modified: stats.mtime,
          extension: path.extname(filename)
        };
      })
    );
    
    console.log(`[DiagramRoute] ✅ Found ${images.length} images`);
    
    res.json({
      grade,
      subject,
      images,
      count: images.length
    });
    
  } catch (error) {
    console.error('[DiagramRoute] ❌ Error listing images:', error);
    res.status(500).json({ 
      error: 'Failed to list images',
      message: error.message 
    });
  }
});

/**
 * ✅ Get library statistics
 * Route: GET /api/diagrams/stats
 */
router.get('/diagrams-stats', async (req, res) => {
  try {
    console.log('[DiagramRoute] Getting library stats');
    
    const diagramsPath = path.join(__dirname, '..', 'diagrams');
    
    // Check if diagrams folder exists
    try {
      await fs.access(diagramsPath);
    } catch {
      return res.json({
        totalImages: 0,
        grades: [],
        subjects: [],
        message: 'Diagrams folder not found. Create: backend/diagrams/'
      });
    }
    
    // Get all grades
    const grades = await fs.readdir(diagramsPath);
    const stats = {
      totalImages: 0,
      byGrade: {},
      bySubject: {},
      grades: [],
      subjects: new Set()
    };
    
    // Scan each grade
    for (const grade of grades) {
      const gradePath = path.join(diagramsPath, grade);
      const gradeStats = await fs.stat(gradePath);
      
      if (!gradeStats.isDirectory()) continue;
      
      stats.grades.push(grade);
      stats.byGrade[grade] = {};
      
      // Scan subjects in this grade
      const subjects = await fs.readdir(gradePath);
      
      for (const subject of subjects) {
        const subjectPath = path.join(gradePath, subject);
        const subjectStats = await fs.stat(subjectPath);
        
        if (!subjectStats.isDirectory()) continue;
        
        stats.subjects.add(subject);
        
        // Count images in this subject
        const files = await fs.readdir(subjectPath);
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg'];
        const imageCount = files.filter(file => {
          const ext = path.extname(file).toLowerCase();
          return imageExtensions.includes(ext);
        }).length;
        
        stats.byGrade[grade][subject] = imageCount;
        stats.totalImages += imageCount;
        
        if (!stats.bySubject[subject]) {
          stats.bySubject[subject] = 0;
        }
        stats.bySubject[subject] += imageCount;
      }
    }
    
    stats.subjects = Array.from(stats.subjects);
    
    console.log(`[DiagramRoute] ✅ Total images: ${stats.totalImages}`);
    
    res.json(stats);
    
  } catch (error) {
    console.error('[DiagramRoute] ❌ Error getting stats:', error);
    res.status(500).json({ 
      error: 'Failed to get statistics',
      message: error.message 
    });
  }
});

/**
 * ✅ Search for images by keyword
 * Route: GET /api/diagrams/search?q=plant&grade=grade-7&subject=science
 */
router.get('/diagrams-search', async (req, res) => {
  try {
    const { q, grade, subject } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }
    
    console.log(`[DiagramRoute] Searching for: "${q}"`);
    
    const searchTerm = q.toLowerCase();
    const results = [];
    
    const diagramsPath = path.join(__dirname, '..', 'diagrams');
    
    // Determine search scope
    let gradesToSearch = [];
    if (grade) {
      gradesToSearch = [grade];
    } else {
      gradesToSearch = await fs.readdir(diagramsPath);
    }
    
    // Search through grades
    for (const gradeFolder of gradesToSearch) {
      const gradePath = path.join(diagramsPath, gradeFolder);
      
      try {
        const gradeStats = await fs.stat(gradePath);
        if (!gradeStats.isDirectory()) continue;
      } catch {
        continue;
      }
      
      let subjectsToSearch = [];
      if (subject) {
        subjectsToSearch = [subject];
      } else {
        subjectsToSearch = await fs.readdir(gradePath);
      }
      
      // Search through subjects
      for (const subjectFolder of subjectsToSearch) {
        const subjectPath = path.join(gradePath, subjectFolder);
        
        try {
          const subjectStats = await fs.stat(subjectPath);
          if (!subjectStats.isDirectory()) continue;
        } catch {
          continue;
        }
        
        // Get all images in this folder
        const files = await fs.readdir(subjectPath);
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg'];
        
        for (const filename of files) {
          const ext = path.extname(filename).toLowerCase();
          if (!imageExtensions.includes(ext)) continue;
          
          // Check if filename matches search term
          if (filename.toLowerCase().includes(searchTerm)) {
            const filepath = path.join(subjectPath, filename);
            const stats = await fs.stat(filepath);
            
            results.push({
              filename,
              grade: gradeFolder,
              subject: subjectFolder,
              url: `/api/diagrams/${gradeFolder}/${subjectFolder}/${filename}`,
              size: stats.size,
              path: `diagrams/${gradeFolder}/${subjectFolder}/${filename}`
            });
          }
        }
      }
    }
    
    console.log(`[DiagramRoute] ✅ Found ${results.length} matching images`);
    
    res.json({
      query: q,
      results,
      count: results.length
    });
    
  } catch (error) {
    console.error('[DiagramRoute] ❌ Search error:', error);
    res.status(500).json({ 
      error: 'Search failed',
      message: error.message 
    });
  }
});

module.exports = router;