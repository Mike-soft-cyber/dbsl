const Document = require('../models/Document');
const CBCEntry = require('../models/CbcEntry');
const User = require('../models/User');
const mongoose = require('mongoose');
const { docCreatedActivity } = require('./activityController');
const DocumentGeneratorFactory = require('../services/DocumentGeneratorFactory');
const ContentParser = require('../utils/contentProcessor');
const { processMarkdownImages } = require('./imageController');

// ADD MISSING IMPORTS
const { OpenAI } = require("openai");
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

// Your existing simple function - FIXED
// Your existing simple function - WITH ACTIVITY TRACKING
exports.createDocument = async (req, res) => {
  try {
    const { type, term, cbcEntry } = req.body;
    const teacher = req.user?._id || null;

    // Simple AI generation - FIXED model name
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4", // FIXED: was "gpt-5"
      messages: [
        { role: "system", content: "You are a teacher assistant AI." },
        { role: "user", content: `Generate a ${type} for ${term} using CBC entry ID ${cbcEntry}` }
      ]
    });

    const content = aiResponse.choices[0].message.content;

    const document = await Document.create({
      teacher,
      type,
      term,
      cbcEntry,
      status: "completed",
      content,
    });

    // ✅ ADD ACTIVITY TRACKING HERE TOO
    try {
      const activityData = {
        teacherName: req.user?.firstName + ' ' + (req.user?.lastName || ''),
        teacherId: req.user?._id,
        grade: 'Unknown', // You might want to get this from cbcEntry
        stream: 'General',
        learningArea: 'Unknown', // You might want to get this from cbcEntry
        docType: type,
        schoolCode: req.user?.schoolCode,
        documentId: document._id
      };

      console.log('Logging simple document creation activity:', activityData);
      await docCreatedActivity(activityData);
      console.log('✅ Simple document creation activity logged successfully');
    } catch (activityError) {
      console.error('❌ Failed to log simple document activity:', activityError);
      // Don't fail the whole request if activity logging fails
    }

    res.status(201).json(document);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate document" });
  }
};

// Keep all your existing simple functions unchanged
exports.getDocument = async (req, res) => {
  try {
    const document = Document.schema.path('type').enumValues;
    res.json(document)
  } catch (error) {
    res.status(500).json({message: "Server Error"})
  }
}

exports.getTerms = async (req,res) => {
  try {
    const terms = Document.schema.path('term').enumValues;
    res.json(terms);
  } catch(err) {
    console.error(err)
    res.status(500).json({ message: 'Server Error' });
  }
}

exports.getGrades = async (req,res) => {
  try {
    const grades = await CBCEntry.find().distinct('grade');
    res.json(grades);
  } catch (error) {
    console.error('Error fetching grades:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

exports.getStreams = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) return res.status(404).json({ message: 'User not found' });
    const streams = [...new Set(user.assignedClasses.map(cls => cls.stream))];

    res.json(streams);
  } catch (error) {
    console.error('Error fetching streams:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getDocCountOfSchool = async (req, res) => {
  try {
    const { schoolCode } = req.params;
    
    const teachers = await User.find({ 
      schoolCode: schoolCode,
      role: 'Teacher'
    }).select('_id');
    
    const teacherIds = teachers.map(teacher => teacher._id);
    
    const count = await Document.countDocuments({ 
      teacher: { $in: teacherIds } 
    });
    
    res.json({ count });
  } catch (error) {
    console.error('Error counting documents:', error);
    res.status(500).json({ message: 'Failed to count documents' });
  }
};

// SIMPLIFIED enhanced generation - WITH ACTIVITY TRACKING
exports.generateDocumentEnhanced = async (req, res) => {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`[${requestId}] Starting document generation request`);
    
    // Input validation
    const validationResult = validateGenerationRequest(req.body);
    if (!validationResult.isValid) {
      console.log(`[${requestId}] Validation failed:`, validationResult.errors);
      return res.status(400).json({ 
        error: "Invalid request data", 
        details: validationResult.errors 
      });
    }

    const { 
      type, term, grade, learningArea, strand, substrand, 
      school, teacherName, weeks, lessonsPerWeek 
    } = req.body;

    console.log(`[${requestId}] Validated request: ${type} for ${grade} ${learningArea} - ${substrand}`);

    // Find CBC entry
    console.log(`[${requestId}] Fetching CBC entry from database`);
    let cbcEntry = await CBCEntry.findOne({ 
      grade: { $regex: new RegExp(grade, 'i') }, 
      learningArea: { $regex: new RegExp(learningArea, 'i') }, 
      strand: { $regex: new RegExp(strand, 'i') }, 
      substrand: { $regex: new RegExp(substrand, 'i') } 
    });
    
    if (!cbcEntry) {
      console.log(`[${requestId}] CBC entry not found, searching with relaxed criteria`);
      
      cbcEntry = await CBCEntry.findOne({
        grade: { $regex: new RegExp(grade, 'i') },
        learningArea: { $regex: new RegExp(learningArea, 'i') }
      });
      
      if (!cbcEntry) {
        return res.status(404).json({ 
          error: "No CBC data found",
          message: `No curriculum data available for ${grade} ${learningArea} - ${strand} - ${substrand}. Please check your selection.`
        });
      }
    }

    // Validate CBC entry
    const cbcValidation = validateCBCEntry(cbcEntry);

    // Prepare request data
    const requestData = {
      school: sanitizeInput(school) || "Educational Institution",
      teacherName: sanitizeInput(teacherName) || "Teacher",
      grade: sanitizeInput(grade),
      learningArea: sanitizeInput(learningArea),
      strand: sanitizeInput(strand),
      substrand: sanitizeInput(substrand),
      term: sanitizeInput(term),
      weeks: parseInt(weeks) || 12,
      lessonsPerWeek: parseInt(lessonsPerWeek) || 5,
      date: req.body.date,
      time: req.body.time,
      teacher: req.body.teacher
    };

    console.log(`[${requestId}] Request data prepared, generating document...`);

    // Generate document
    let document = await DocumentGeneratorFactory.generate(type, requestData, cbcEntry);

    if (!document) {
      throw new Error('Document generation returned null');
    }

    // FIX: Ensure document has an _id
    if (!document._id) {
      throw new Error('Generated document missing _id');
    }

    console.log(`[${requestId}] Document generated with ID: ${document._id}`);

    // ✅ ADD ACTIVITY TRACKING HERE
    try {
      const activityData = {
        teacherName: req.user?.firstName + ' ' + (req.user?.lastName || ''),
        teacherId: req.user?._id,
        grade: grade,
        stream: requestData.stream || 'General',
        learningArea: learningArea,
        docType: type,
        schoolCode: req.user?.schoolCode,
        documentId: document._id
      };

      console.log(`[${requestId}] Logging document creation activity:`, activityData);
      await docCreatedActivity(activityData);
      console.log(`[${requestId}] ✅ Document creation activity logged successfully`);
    } catch (activityError) {
      console.error(`[${requestId}] ❌ Failed to log activity:`, activityError);
      // Don't fail the whole request if activity logging fails
    }

    // Process images in the generated content
    if (document && document.content) {
      console.log(`[${requestId}] Processing images in document content...`);
      try {
        const { processMarkdownImages } = require('./imageController');
        document.content = await processMarkdownImages(document.content);
        await document.save();
        console.log(`[${requestId}] Images processed and saved`);
      } catch (imageError) {
        console.error(`[${requestId}] Image processing failed:`, imageError);
        // Continue even if image processing fails - document is still usable
      }
    }

    if (req.user?._id) {
      await User.findByIdAndUpdate(
        req.user._id,
        { $inc: { documentsCreated: 1 } }
      );
      console.log(`Updated documentsCreated count for teacher ${req.user._id}`);
    }

    const totalTime = Date.now() - startTime;
    console.log(`[${requestId}] Document generated successfully in ${totalTime}ms`);

    // Return the document with clear ID
    res.status(201).json({
      success: true,
      document: {
        _id: document._id,
        type: document.type,
        grade: document.grade,
        subject: document.subject,
        strand: document.strand,
        substrand: document.substrand,
        term: document.term,
        content: document.content,
        status: document.status,
        createdAt: document.createdAt
      },
      documentId: document._id,
      metadata: {
        requestId,
        generationTime: totalTime,
        cbcDataQuality: cbcValidation.score,
        warnings: cbcValidation.warnings
      }
    });

  } catch (err) {
    const totalTime = Date.now() - startTime;
    console.error(`[${requestId}] Document generation failed after ${totalTime}ms:`, err);

    if (err.message.includes('timeout')) {
      res.status(408).json({ 
        error: "Generation timeout", 
        message: "Document generation took too long. Please try again." 
      });
    } else if (err.message.includes('AI generation')) {
      res.status(503).json({ 
        error: "AI service unavailable", 
        message: "The AI service is currently unavailable. Please try again." 
      });
    } else {
      res.status(500).json({ 
        error: "Generation failed", 
        message: "Document generation encountered an error. Please try again.",
        requestId 
      });
    }
  }
};

// Keep all your other existing functions unchanged...
exports.debugContent = async (req, res) => {
  try {
    const { content, documentType } = req.body;
    
    if (!content || !documentType) {
      return res.status(400).json({ error: 'Missing content or documentType' });
    }

    const parsed = ContentParser.parse(content, documentType);
    
    const diagnostics = {
      contentStats: {
        totalLength: content.length,
        lineCount: content.split('\n').length,
        wordCount: content.split(/\s+/).length,
        hasTableMarkers: (content.match(/\|/g) || []).length,
        hasHeaderMarkers: (content.match(/^#+ /gm) || []).length
      },
      parseResult: {
        type: parsed.type,
        hasData: parsed.data !== null,
        dataType: typeof parsed.data
      }
    };

    res.json({
      success: true,
      diagnostics,
      sampleContent: content.substring(0, 500),
      parsedData: parsed.type === 'table' ? parsed.data : null
    });

  } catch (error) {
    console.error('[Debug] Content analysis failed:', error);
    res.status(500).json({ error: 'Analysis failed', details: error.message });
  }
};

// Enhanced fallback diagram serving
exports.diagramFallback = async (req, res) => {
  try {
    const { documentId, diagramIndex } = req.params;
    
    console.log(`[DiagramFallback] Serving diagram ${diagramIndex} for document ${documentId}`);
    
    if (!documentId || !diagramIndex) {
      return res.status(400).json({ error: 'Missing documentId or diagramIndex' });
    }
    
    const document = await Document.findById(documentId);
    if (!document) {
      console.log(`[DiagramFallback] Document ${documentId} not found`);
      return res.status(404).json({ error: 'Document not found' });
    }
    
    const diagram = document.diagrams.find(d => d.index === parseInt(diagramIndex));
    if (!diagram || !diagram.imageData) {
      console.log(`[DiagramFallback] Diagram ${diagramIndex} not found in document ${documentId}`);
      return res.status(404).json({ error: 'Diagram not found' });
    }
    
    try {
      // Convert base64 back to buffer
      const base64Data = diagram.imageData.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Set appropriate headers and send
      res.setHeader('Content-Type', diagram.mimeType || 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hour cache
      res.setHeader('Content-Length', buffer.length);
      
      console.log(`[DiagramFallback] Serving diagram ${diagramIndex} (${buffer.length} bytes)`);
      res.send(buffer);
      
    } catch (conversionError) {
      console.error(`[DiagramFallback] Failed to convert diagram data:`, conversionError);
      res.status(500).json({ error: 'Failed to process diagram data' });
    }
    
  } catch (error) {
    console.error(`[DiagramFallback] Error serving diagram:`, error);
    res.status(500).json({ error: 'Failed to serve diagram' });
  }
};

exports.serveDiagram = async (req, res) => {
  try {
    const { filename } = req.params;
    
    console.log(`[Diagrams] Request for: ${filename}`);
    
    // Try to serve from file system first
    const uploadDir = path.join(__dirname, '..', 'uploads', 'diagrams');
    const filepath = path.join(uploadDir, filename);
    
    try {
      // Check if file exists
      await fs.access(filepath);
      
      const stats = await fs.stat(filepath);
      console.log(`[Diagrams] ✅ Serving from file: ${filename} (${stats.size} bytes)`);
      
      // Set appropriate headers
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
      res.setHeader('Content-Length', stats.size);
      
      // Send the file
      return res.sendFile(filepath);
      
    } catch (fileError) {
      // File doesn't exist - try to find it in documents database
      console.log(`[Diagrams] File not found, searching database...`);
      
      // Extract document ID and diagram number from filename pattern
      // Pattern: diagram-grade_X-subject-N-timestamp.png
      const match = filename.match(/diagram-.*?-(\d+)-\d+\.png/);
      
      if (!match) {
        console.log(`[Diagrams] ❌ Could not parse filename pattern`);
        return res.status(404).json({ error: 'Diagram not found' });
      }
      
      const diagramNumber = parseInt(match[1]);
      
      // Search for document containing this diagram
      const Document = require('../models/Document');
      const document = await Document.findOne({
        'diagrams.fileName': filename
      });
      
      if (!document) {
        console.log(`[Diagrams] ❌ No document found with diagram: ${filename}`);
        return res.status(404).json({ error: 'Diagram not found in database' });
      }
      
      // Find the specific diagram
      const diagram = document.diagrams.find(d => d.fileName === filename);
      
      if (!diagram || !diagram.imageData) {
        console.log(`[Diagrams] ❌ Diagram data not found`);
        return res.status(404).json({ error: 'Diagram data not available' });
      }
      
      // Serve from base64 data
      const base64Data = diagram.imageData.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      console.log(`[Diagrams] ✅ Serving from database: ${filename} (${buffer.length} bytes)`);
      
      res.setHeader('Content-Type', diagram.mimeType || 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Content-Length', buffer.length);
      
      return res.send(buffer);
    }
    
  } catch (error) {
    console.error('[Diagrams] ❌ Error serving diagram:', error);
    res.status(500).json({ error: 'Failed to serve diagram' });
  }
};

/**
 * ✅ NEW: Direct document diagram endpoint (alternative access)
 */
exports.getDocumentDiagram = async (req, res) => {
  try {
    const { documentId, diagramIndex } = req.params;
    
    console.log(`[Diagrams] Direct request: document ${documentId}, diagram ${diagramIndex}`);
    
    const Document = require('../models/Document');
    const document = await Document.findById(documentId);
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    const diagram = document.diagrams[parseInt(diagramIndex)];
    
    if (!diagram) {
      return res.status(404).json({ error: 'Diagram not found' });
    }
    
    // Try file system first
    if (diagram.filePath && diagram.fileName) {
      const uploadDir = path.join(__dirname, '..', 'uploads', 'diagrams');
      const filepath = path.join(uploadDir, diagram.fileName);
      
      try {
        await fs.access(filepath);
        
        console.log(`[Diagrams] ✅ Serving from file`);
        
        res.setHeader('Content-Type', diagram.mimeType || 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        
        return res.sendFile(filepath);
      } catch (fileError) {
        console.log(`[Diagrams] File not found, using base64 fallback`);
      }
    }
    
    // Fallback to base64
    if (diagram.imageData) {
      const base64Data = diagram.imageData.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      console.log(`[Diagrams] ✅ Serving from base64 (${buffer.length} bytes)`);
      
      res.setHeader('Content-Type', diagram.mimeType || 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Content-Length', buffer.length);
      
      return res.send(buffer);
    }
    
    return res.status(404).json({ error: 'Diagram data not available' });
    
  } catch (error) {
    console.error('[Diagrams] ❌ Error:', error);
    res.status(500).json({ error: 'Failed to serve diagram' });
  }
};

// Get all documents with enhanced filtering and pagination
exports.getAllDocuments = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, grade, subject, search } = req.query;
    
    console.log(`[GetDocuments] Fetching page ${page}, limit ${limit}`);
    
    // Build filter query
    const filter = {};
    if (type) filter.type = { $regex: new RegExp(type, 'i') };
    if (grade) filter.grade = { $regex: new RegExp(grade, 'i') };
    if (subject) filter.subject = { $regex: new RegExp(subject, 'i') };
    
    if (search) {
      filter.$or = [
        { type: { $regex: new RegExp(search, 'i') } },
        { grade: { $regex: new RegExp(search, 'i') } },
        { subject: { $regex: new RegExp(search, 'i') } },
        { strand: { $regex: new RegExp(search, 'i') } },
        { substrand: { $regex: new RegExp(search, 'i') } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get documents with pagination
    const documents = await Document.find(filter)
      .select('type grade subject strand substrand school term createdAt status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Document.countDocuments(filter);
    
    console.log(`[GetDocuments] Found ${documents.length}/${total} documents`);
    
    res.json({
      success: true,
      data: documents,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        hasNext: skip + documents.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
    
  } catch (error) {
    console.error('[GetDocuments] Error:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
};

// Get document by ID with comprehensive data
exports.getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid document ID format' });
    }
    
    console.log(`[GetDocument] Fetching document ${id}`);
    
    const document = await Document.findById(id).populate('cbcEntry');
    
    if (!document) {
      console.log(`[GetDocument] Document ${id} not found`);
      return res.status(404).json({ error: 'Document not found' });
    }
    
    console.log(`[GetDocument] Document found: ${document.type} - ${document.grade} ${document.subject}`);
    
    res.json({
      success: true,
      document
    });
    
  } catch (error) {
    console.error('[GetDocument] Error:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
};

// Validation helper functions
function validateGenerationRequest(body) {
  const errors = [];
  const required = ['type', 'grade', 'learningArea', 'strand', 'substrand', 'term'];
  
  for (const field of required) {
    if (!body[field] || typeof body[field] !== 'string' || body[field].trim().length === 0) {
      errors.push(`${field} is required and must be a non-empty string`);
    }
  }
  
  const validTypes = ['Lesson Concept Breakdown', 'Schemes of Work', 'Lesson Plan', 'Lesson Notes', 'Exercises'];
  if (body.type && !validTypes.includes(body.type)) {
    errors.push(`type must be one of: ${validTypes.join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateCBCEntry(cbcEntry) {
  const warnings = [];
  let score = 100;
  
  if (!cbcEntry.slo || cbcEntry.slo.length === 0) {
    warnings.push('No Specific Learning Outcomes defined');
    score -= 25;
  }
  
  if (!cbcEntry.learningExperiences || cbcEntry.learningExperiences.length === 0) {
    warnings.push('No learning experiences defined');
    score -= 20;
  }
  
  if (!cbcEntry.keyInquiryQuestions || cbcEntry.keyInquiryQuestions.length === 0) {
    warnings.push('No key inquiry questions defined');
    score -= 15;
  }
  
  return {
    isValid: score >= 50,
    score: Math.max(0, score),
    warnings
  };
}

function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>\"'&]/g, '');
}

// Include all your existing functions at the end
exports.fetchGeneratedDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }
    res.json({ success: true, document });
  } catch (error) {
    console.error("Error fetching document:", error);
    res.status(500).json({ error: "Failed to fetch document" });
  }
};

exports.getNumberOfDownloadsByTeachers = async (req, res) => {
  const { schoolCode } = req.params;
  try {
    const teachers = await User.find({
      schoolCode: schoolCode,
    }).select('_id');

    const teacherIds = teachers.map(teacher => teacher._id);

    const count = await Document.countDocuments({
      teacher: { $in: teacherIds }
    });

    res.json({ count });
  } catch (error) {
    console.error('Error counting documents:', error);
    res.status(500).json({ message: 'Failed to count documents' });
  }
};

exports.getDocCreatedByTeacher = async (req, res) => {
  const { teacherId } = req.params;

  if (!teacherId || !mongoose.Types.ObjectId.isValid(teacherId)) {
    return res.status(400).json({ message: "Invalid or missing teacherId" });
  }

  try {
    const count = await Document.countDocuments({ teacher: teacherId });
    res.json({ count });
  } catch (error) {
    console.error("Error counting documents:", error);
    res.status(500).json({ message: "Failed to count documents" });
  }
};

// Enhanced version with better error handling
exports.getUserDocumentsCreated = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { page = 1, limit = 5, populate = 'false' } = req.query;
    
    console.log(`📁 Fetching documents for teacher: ${teacherId}, populate: ${populate}`);
    
    // Validate teacherId
    if (!teacherId || !mongoose.Types.ObjectId.isValid(teacherId)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid teacher ID" 
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = { teacher: teacherId };

    // Build query with optional population
    let documentsQuery = Document.find(query)
      .select('type grade subject strand substrand createdAt status cbcEntry content')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Populate cbcEntry if requested
    if (populate === 'true') {
      documentsQuery = documentsQuery.populate('cbcEntry', 'substrand strand learningArea grade');
    }

    const documents = await documentsQuery
      .maxTimeMS(10000)
      .lean();

    const total = await Document.countDocuments(query).maxTimeMS(5000);

    console.log(`✅ Found ${documents.length} documents`);
    
    res.json({
      success: true,
      documents,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        hasNext: skip + documents.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
    
  } catch (error) {
    console.error('❌ Fetch error:', error.message);
    res.json({
      success: true,
      documents: [],
      pagination: {
        current: 1,
        pages: 1,
        total: 0,
        hasNext: false,
        hasPrev: false
      },
      message: 'Unable to load documents at this time'
    });
  }
};

// Get recent downloaded documents for a user
exports.getRecentDownloads = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid user ID" 
      });
    }

    console.log(`📥 Fetching recent downloads for user: ${userId}`);
    
    // Get user's download history
    const user = await User.findById(userId).select('downloadedDocuments');
    
    if (!user || !user.downloadedDocuments || user.downloadedDocuments.length === 0) {
      return res.json({
        success: true,
        downloads: [],
        message: 'No downloads found'
      });
    }

    // Sort by most recent and get last 5 downloads
    const recentDownloads = user.downloadedDocuments
      .sort((a, b) => new Date(b.downloadedAt) - new Date(a.downloadedAt))
      .slice(0, 5);

    // Get document details for each download
    const downloadsWithDetails = await Promise.all(
      recentDownloads.map(async (download) => {
        try {
          const document = await Document.findById(download.documentId)
            .select('type grade subject strand substrand createdAt');
          
          return {
            _id: download._id,
            documentId: download.documentId,
            documentType: download.documentType,
            grade: download.grade,
            subject: download.subject || download.learningArea,
            learningArea: download.learningArea,
            downloadedAt: download.downloadedAt,
            documentDetails: document ? {
              type: document.type,
              grade: document.grade,
              subject: document.subject,
              strand: document.strand,
              substrand: document.substrand,
              createdAt: document.createdAt
            } : null
          };
        } catch (error) {
          console.error(`Error fetching document ${download.documentId}:`, error);
          return {
            _id: download._id,
            documentId: download.documentId,
            documentType: download.documentType,
            grade: download.grade,
            subject: download.subject || download.learningArea,
            learningArea: download.learningArea,
            downloadedAt: download.downloadedAt,
            documentDetails: null,
            error: 'Document not found'
          };
        }
      })
    );

    res.json({
      success: true,
      downloads: downloadsWithDetails,
      totalDownloads: user.downloadedDocuments.length
    });

  } catch (error) {
    console.error('Error fetching recent downloads:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch recent downloads',
      message: error.message 
    });
  }
};

// Delete a document
exports.deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Delete request for document: ${id}`);
    
    // Validate document ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid document ID format" 
      });
    }

    // Find the document first
    const document = await Document.findById(id);
    
    if (!document) {
      console.log(`❌ Document ${id} not found`);
      return res.status(404).json({ 
        success: false, 
        error: "Document not found" 
      });
    }

    console.log(`📋 Document found: ${document.type} for ${document.grade} ${document.subject}`);

    // Delete the document
    await Document.findByIdAndDelete(id);

    console.log(`✅ Document ${id} deleted successfully`);

    res.json({
      success: true,
      message: "Document deleted successfully",
      deletedDocument: {
        id: id,
        type: document.type,
        grade: document.grade,
        subject: document.subject
      }
    });

  } catch (error) {
    console.error('❌ Error deleting document:', error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to delete document",
      message: error.message 
    });
  }
};

exports.trackDocumentDownload = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { documentId, documentType, grade, subject, strand, substrand } = req.body;

    if (!teacherId || !mongoose.Types.ObjectId.isValid(teacherId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid teacher ID' 
      });
    }

    if (!documentId || !mongoose.Types.ObjectId.isValid(documentId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid document ID' 
      });
    }

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ 
        success: false, 
        error: 'Document not found' 
      });
    }

    const downloadRecord = {
      documentId,
      documentType: documentType || document.type,
      grade: grade || document.grade,
      subject: subject || document.subject,
      learningArea: subject || document.subject,
      strand: strand || document.strand,
      substrand: substrand || document.substrand,
      downloadedAt: new Date()
    };

    await User.findByIdAndUpdate(
      teacherId,
      { 
        $push: { 
          downloadedDocuments: {
            $each: [downloadRecord],
            $position: 0,
            $slice: 50
          }
        },
        $inc: { totalDownloads: 1 }
      },
      { new: true }
    );

    res.json({ 
      success: true, 
      message: 'Download tracked successfully' 
    });

  } catch (error) {
    console.error('Track download error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to track download'
    });
  }
};

// Check if a breakdown has linked lesson notes
exports.hasLinkedNotes = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid document ID' });
    }

    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (document.type !== 'Lesson Concept Breakdown') {
      return res.status(400).json({ error: 'Document is not a Lesson Concept Breakdown' });
    }

    // Find all lesson notes linked to this breakdown
    const linkedDocs = await Document.find({ 
      parentDocument: id,
      type: 'Lesson Notes'
    })
    .select('type createdAt lessonDetails')
    .sort({ 'lessonDetails.weekNumber': 1 })
    .lean();

    res.json({
      success: true,
      hasLinkedNotes: linkedDocs.length > 0,
      linkedDocuments: linkedDocs.map(doc => ({
        id: doc._id,
        type: doc.type,
        createdAt: doc.createdAt,
        weekNumber: doc.lessonDetails?.weekNumber,
        concept: doc.lessonDetails?.specificConcept
      }))
    });

  } catch (error) {
    console.error('[HasLinkedNotes] Error:', error);
    res.status(500).json({ error: 'Failed to check linked documents' });
  }
};

// Generate comprehensive lesson notes from entire breakdown - FIXED GENERATOR USAGE
exports.generateLinkedNotesFromBreakdown = async (req, res) => {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`[${requestId}] ===== STARTING LINKED NOTES GENERATION =====`);
    const { id } = req.params;
    const { regenerate = false, teacherName } = req.body;

    console.log(`[${requestId}] Processing breakdown document: ${id}`);

    // Get the breakdown document
    const breakdownDoc = await Document.findById(id).populate('cbcEntry');
    
    if (!breakdownDoc) {
      return res.status(404).json({ error: 'Breakdown document not found' });
    }

    console.log(`[${requestId}] Found breakdown: ${breakdownDoc.grade} ${breakdownDoc.subject}`);
    console.log(`[${requestId}] Breakdown content length: ${breakdownDoc.content?.length} chars`);

    // Parse learning concepts from breakdown content
    console.log(`[${requestId}] Extracting learning concepts...`);
    const learningConcepts = extractLearningConcepts(breakdownDoc.content);
    
    // ✅ FIX 1: Better duplicate detection and validation
    const uniqueConcepts = [];
    const seenKeys = new Set();
    
    learningConcepts.forEach(concept => {
      const key = `${concept.week}-${concept.concept}`.toLowerCase().trim();
      if (!seenKeys.has(key) && concept.concept && concept.concept.length > 10) {
        seenKeys.add(key);
        uniqueConcepts.push(concept);
      }
    });

    console.log(`[${requestId}] Extracted ${learningConcepts.length} concepts, ${uniqueConcepts.length} unique`);

    // ✅ FIX 2: Validate we have concepts before proceeding
    if (uniqueConcepts.length === 0) {
      return res.status(400).json({ 
        error: 'No learning concepts found',
        message: 'Could not extract valid learning concepts from the breakdown document. Please ensure the breakdown contains a properly formatted table with learning concepts.'
      });
    }

    // Check if notes already exist
    const existingNotes = await Document.findOne({ 
      parentDocument: id,
      type: 'Lesson Notes'
    });

    if (existingNotes && !regenerate) {
      console.log(`[${requestId}] Notes already exist: ${existingNotes._id}`);
      return res.json({
        success: true,
        document: existingNotes,
        alreadyExists: true
      });
    }

    // If regenerating, delete existing notes
    if (existingNotes && regenerate) {
      console.log(`[${requestId}] Deleting existing notes for regeneration`);
      await Document.findByIdAndDelete(existingNotes._id);
    }

    // ✅ FIX 3: Properly structure request data with validated concepts
    const requestData = {
      school: breakdownDoc.school || "Educational Institution",
      teacherName: teacherName || req.user?.firstName + ' ' + (req.user?.lastName || '') || "Teacher",
      grade: breakdownDoc.grade,
      learningArea: breakdownDoc.subject,
      strand: breakdownDoc.strand,
      substrand: breakdownDoc.substrand,
      term: breakdownDoc.term,
      teacher: req.user?._id || breakdownDoc.teacher,
      weeks: uniqueConcepts.length, // Use actual concept count
      lessonsPerWeek: 5,
      learningConcepts: uniqueConcepts, // ✅ Pass validated, unique concepts
      sourceLessonConceptId: breakdownDoc._id
    };

    console.log(`[${requestId}] Request data prepared with ${uniqueConcepts.length} unique concepts`);

    // ✅ FIX 4: Generate using DocumentGeneratorFactory with proper error handling
    let generatedDocument;
    
    try {
      console.log(`[${requestId}] Calling DocumentGeneratorFactory.generate...`);
      
      generatedDocument = await DocumentGeneratorFactory.generate(
        'Lesson Notes', 
        requestData, 
        breakdownDoc.cbcEntry
      );

      if (!generatedDocument || !generatedDocument._id) {
        throw new Error('Document generation returned null or missing _id');
      }

      console.log(`[${requestId}] ✅ Document generated with ID: ${generatedDocument._id}`);
      
    } catch (generationError) {
      console.error(`[${requestId}] ❌ Generation failed:`, generationError);
      
      // ✅ FIX 5: Return error instead of creating fallback (preventing duplicates)
      return res.status(500).json({
        success: false,
        error: 'Document generation failed',
        message: generationError.message,
        details: 'Please try again or check the breakdown document format'
      });
    }

    // ✅ FIX 6: Track activity ONLY after successful generation
    try {
      const activityData = {
        teacherName: requestData.teacherName,
        teacherId: req.user?._id,
        grade: breakdownDoc.grade,
        stream: 'General',
        learningArea: breakdownDoc.subject,
        docType: 'Lesson Notes',
        schoolCode: req.user?.schoolCode,
        documentId: generatedDocument._id
      };

      console.log(`[${requestId}] Logging linked notes creation activity`);
      await docCreatedActivity(activityData);
      console.log(`[${requestId}] ✅ Activity logged successfully`);
    } catch (activityError) {
      console.error(`[${requestId}] ❌ Failed to log activity:`, activityError);
      // Don't fail the request if activity logging fails
    }

    // Update user stats
    if (req.user?._id) {
      await User.findByIdAndUpdate(
        req.user._id,
        { $inc: { documentsCreated: 1 } }
      );
      console.log(`[${requestId}] Updated user document count`);
    }

    const totalTime = Date.now() - startTime;
    console.log(`[${requestId}] ✅ Complete in ${totalTime}ms`);

    // ✅ FIX 7: Return clean response
    res.status(201).json({
  success: true,
  document: {
    _id: generatedDocument._id,
    type: generatedDocument.type,
    grade: generatedDocument.grade,
    subject: generatedDocument.subject,
    strand: generatedDocument.strand,
    substrand: generatedDocument.substrand,
    term: generatedDocument.term,
    content: generatedDocument.content,
    status: generatedDocument.status,
    parentDocument: generatedDocument.parentDocument,
    diagrams: generatedDocument.diagrams || [],
    createdAt: generatedDocument.createdAt
  },
  documentId: generatedDocument._id, // ✅ Add this for easy access
  metadata: {
    requestId,
    generationTime: totalTime,
    conceptCount: uniqueConcepts.length,
    diagramCount: generatedDocument.diagrams?.length || 0
  },
  message: 'Lesson notes generated successfully',
  redirectUrl: `/documents/${generatedDocument._id}` // ✅ Optional: explicit redirect URL
});

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`[${requestId}] ❌ Generation failed after ${totalTime}ms:`, error);

    // ✅ FIX 8: Proper error response without fallback creation
    res.status(500).json({ 
      success: false,
      error: "Generation failed", 
      message: error.message || 'An unexpected error occurred',
      requestId 
    });
  }
};

// ✅ FIX 9: Enhanced extraction function with better validation
function extractLearningConcepts(content) {
  const concepts = [];
  const seenConcepts = new Set(); // Track duplicates
  
  if (!content || typeof content !== 'string') {
    console.warn('[ExtractConcepts] No content provided or content is not a string');
    return concepts;
  }

  console.log('[ExtractConcepts] Starting extraction from content');

  const lines = content.split('\n');
  console.log(`[ExtractConcepts] Processing ${lines.length} lines of content`);
  
  let tableStarted = false;
  let headerFound = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Look for table header
    if (!headerFound && line.includes('|') && (
        line.toLowerCase().includes('term') || 
        line.toLowerCase().includes('week') || 
        line.toLowerCase().includes('learning concept')
    )) {
      headerFound = true;
      tableStarted = true;
      console.log('[ExtractConcepts] Found table header at line', i);
      continue;
    }
    
    // Skip separator lines (---)
    if (line.match(/^[\|\s-:]*$/)) {
      continue;
    }
    
    // Process data rows after header is found
    if (tableStarted && line.includes('|')) {
      const cells = line.split('|')
        .map(c => c.trim())
        .filter(c => c && c !== '');
      
      // Expected format: | Term | Week | Strand | Sub-strand | Learning Concept |
      if (cells.length >= 5) {
        const term = cells[0];
        const week = cells[1];
        const concept = cells[4];
        
        // ✅ Validate it's a real data row with proper content
        const isValidRow = 
          concept && 
          concept.length > 10 && 
          week && week.toLowerCase().includes('week') &&
          !concept.toLowerCase().includes('learning concept') &&
          !concept.toLowerCase().includes('strand') &&
          !concept.toLowerCase().includes('sub-strand') &&
          !concept.toLowerCase().includes('please regenerate');
        
        if (isValidRow) {
          // Create a unique key to check for duplicates
          const conceptKey = `${week}-${concept}`.toLowerCase().trim();
          
          if (!seenConcepts.has(conceptKey)) {
            seenConcepts.add(conceptKey);
            concepts.push({
              term: term || 'Term 1',
              week: week,
              concept: concept
            });
            console.log(`[ExtractConcepts] ✅ Added unique concept: "${concept.substring(0, 50)}..."`);
          } else {
            console.log(`[ExtractConcepts] ⚠️ Skipped duplicate: "${concept.substring(0, 30)}..."`);
          }
        }
      }
    }
    
    // Stop processing if we hit a non-table line after the table
    if (tableStarted && !line.includes('|') && line.length > 10) {
      console.log('[ExtractConcepts] Reached end of table');
      break;
    }
  }
  
  console.log(`[ExtractConcepts] Extraction complete: ${concepts.length} unique concepts found`);
  
  return concepts;
}

// Helper function stays the same
function extractLearningConcepts(content) {
  const concepts = [];
  const seenConcepts = new Set(); // Track seen concepts to avoid duplicates
  
  if (!content || typeof content !== 'string') {
    console.warn('[ExtractConcepts] No content provided or content is not a string');
    return concepts;
  }

  console.log('[ExtractConcepts] Starting extraction from content');

  const lines = content.split('\n');
  console.log(`[ExtractConcepts] Processing ${lines.length} lines of content`);
  
  let tableStarted = false;
  let headerFound = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Look for table header
    if (!headerFound && line.includes('|') && (
        line.toLowerCase().includes('term') && 
        line.toLowerCase().includes('week') && 
        line.toLowerCase().includes('concept')
    )) {
      headerFound = true;
      tableStarted = true;
      console.log('[ExtractConcepts] Found table header, starting data extraction');
      continue;
    }
    
    // Skip separator lines (---)
    if (line.match(/^[\|\s-]*$/)) {
      continue;
    }
    
    // Process data rows after header is found
    if (tableStarted && line.includes('|')) {
      const cells = line.split('|')
        .map(c => c.trim())
        .filter(c => c && c !== '');
      
      // Expected format: | Term | Week | Strand | Sub-strand | Learning Concept |
      if (cells.length >= 5) {
        const term = cells[0];
        const week = cells[1];
        const concept = cells[4];
        
        // Validate it's a real data row
        if (concept && 
            concept.length > 10 && 
            week.toLowerCase().includes('week') &&
            !concept.toLowerCase().includes('learning concept') &&
            !concept.toLowerCase().includes('strand') &&
            !concept.toLowerCase().includes('sub-strand')) {
          
          // Create a unique key to check for duplicates
          const conceptKey = `${week}-${concept}`.toLowerCase();
          
          if (!seenConcepts.has(conceptKey)) {
            seenConcepts.add(conceptKey);
            concepts.push({
              term: term || 'Term 1',
              week: week,
              concept: concept
            });
            console.log(`[ExtractConcepts] ✅ Added concept: "${concept.substring(0, 50)}..."`);
          } else {
            console.log(`[ExtractConcepts] ⚠️ Skipped duplicate: "${concept}"`);
          }
        }
      }
    }
    
    // Stop processing if we hit a non-table line after the table
    if (tableStarted && !line.includes('|') && line.length > 10) {
      tableStarted = false;
    }
  }
  
  console.log(`[ExtractConcepts] Extraction complete: ${concepts.length} unique concepts found`);
  
  // Log the extracted concepts for debugging
  if (concepts.length > 0) {
    console.log('[ExtractConcepts] Extracted concepts:');
    concepts.forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.week}: ${c.concept.substring(0, 60)}...`);
    });
  }
  
  return concepts;
}

// Helper function to extract learning concepts from breakdown content
function extractLearningConcepts(content) {
  const concepts = [];
  
  if (!content || typeof content !== 'string') {
    console.warn('[ExtractConcepts] No content provided or content is not a string');
    return concepts;
  }

  console.log('[ExtractConcepts] Starting extraction from content:', content.substring(0, 200) + '...');

  const lines = content.split('\n');
  console.log(`[ExtractConcepts] Processing ${lines.length} lines of content`);
  
  let tableStarted = false;
  let headerFound = false;
  let headerColumns = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Look for table header
    if (!headerFound && line.includes('|') && (
        line.toLowerCase().includes('term') || 
        line.toLowerCase().includes('week') || 
        line.toLowerCase().includes('strand') ||
        line.toLowerCase().includes('concept')
    )) {
      headerFound = true;
      tableStarted = true;
      headerColumns = line.split('|').map(c => c.trim()).filter(c => c);
      console.log('[ExtractConcepts] Found table header:', headerColumns);
      continue;
    }
    
    // Skip separator lines (---)
    if (line.match(/^[\|\s-]*$/)) {
      continue;
    }
    
    // Process data rows after header is found
    if (tableStarted && line.includes('|')) {
      const cells = line.split('|')
        .map(c => c.trim())
        .filter(c => c && c !== '');
      
      console.log('[ExtractConcepts] Processing row:', cells);
      
      // Try different column configurations
      if (cells.length >= 3) {
        let term, week, concept;
        
        // Configuration 1: | Term | Week | Strand | Sub-strand | Learning Concept |
        if (cells.length >= 5) {
          term = cells[0];
          week = cells[1];
          concept = cells[4];
        }
        // Configuration 2: | Week | Strand | Sub-strand | Learning Concept |
        else if (cells.length >= 4) {
          term = 'Term 1'; // Default term
          week = cells[0];
          concept = cells[3];
        }
        // Configuration 3: | Week | Learning Concept |
        else if (cells.length >= 2) {
          term = 'Term 1'; // Default term
          week = cells[0];
          concept = cells[1];
        }
        
        // Validate concept
        if (concept && concept.length > 5) {
          // Skip header-like rows
          const isHeaderLike = 
            concept.toLowerCase().includes('learning concept') ||
            concept.toLowerCase().includes('strand') ||
            concept.toLowerCase().includes('sub-strand') ||
            concept.toLowerCase().includes('term') ||
            concept.toLowerCase().includes('week');
          
          // Check if it's a valid week format
          const isWeekFormat = 
            week.toLowerCase().includes('week') ||
            week.match(/week\s*\d+/i) ||
            week.match(/\d+/);
          
          if (!isHeaderLike && isWeekFormat) {
            console.log(`[ExtractConcepts] ✅ Valid concept found: "${concept.substring(0, 50)}..."`);
            concepts.push({
              term: term || 'Term 1',
              week: week,
              concept: concept
            });
          } else {
            console.log(`[ExtractConcepts] ❌ Skipped row - header-like or invalid week:`, { concept, week, isHeaderLike, isWeekFormat });
          }
        } else {
          console.log(`[ExtractConcepts] ❌ Skipped row - concept too short:`, concept);
        }
      }
    }
    
    // Stop processing if we hit a non-table line after the table
    if (tableStarted && !line.includes('|') && line.length > 10) {
      tableStarted = false;
    }
  }
  
  console.log(`[ExtractConcepts] Extraction complete: ${concepts.length} concepts found`);
  
  // If no concepts found with table parsing, try alternative parsing
  if (concepts.length === 0) {
    console.log('[ExtractConcepts] Trying alternative parsing method...');
    const alternativeConcepts = extractLearningConceptsAlternative(content);
    concepts.push(...alternativeConcepts);
    console.log(`[ExtractConcepts] Alternative method found: ${alternativeConcepts.length} concepts`);
  }
  
  return concepts;
}

// Alternative parsing method for different content formats
function extractLearningConceptsAlternative(content) {
  const concepts = [];
  const lines = content.split('\n');
  
  // Look for learning concepts in various formats
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip empty lines and obvious headers
    if (!trimmedLine || 
        trimmedLine.includes('---') ||
        trimmedLine.toLowerCase().includes('term') && trimmedLine.toLowerCase().includes('week')) {
      continue;
    }
    
    // Pattern 1: Lines that contain "Week X" and meaningful content
    const weekMatch = trimmedLine.match(/(week\s*\d+)/i);
    if (weekMatch && trimmedLine.length > 20) {
      const concept = trimmedLine.replace(weekMatch[0], '').trim();
      if (concept.length > 10) {
        concepts.push({
          term: 'Term 1',
          week: weekMatch[0],
          concept: concept
        });
      }
    }
    
    // Pattern 2: Numbered items that might be weekly concepts
    const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
    if (numberedMatch && trimmedLine.length > 15) {
      const weekNum = numberedMatch[1];
      const concept = numberedMatch[2];
      concepts.push({
        term: 'Term 1',
        week: `Week ${weekNum}`,
        concept: concept
      });
    }
  }
  
  return concepts;
}

exports.serveDiagram = async (req, res) => {
  try {
    const { documentId, diagramIndex } = req.params;
    
    const document = await Document.findById(documentId);
    if (!document || !document.diagrams || !document.diagrams[diagramIndex]) {
      return res.status(404).json({ error: 'Diagram not found' });
    }
    
    const diagram = document.diagrams[diagramIndex];
    
    if (diagram.imageData) {
      // Extract base64 data
      const base64Data = diagram.imageData.replace(/^data:image\/\w+;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      res.setHeader('Content-Type', diagram.mimeType || 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
      res.send(imageBuffer);
    } else if (diagram.filePath) {
      // Serve from file system
      const uploadDir = path.join(__dirname, '..', 'uploads', 'diagrams');
      const filepath = path.join(uploadDir, diagram.fileName);
      
      res.setHeader('Content-Type', diagram.mimeType || 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.sendFile(filepath);
    } else {
      return res.status(404).json({ error: 'Diagram data not available' });
    }
    
  } catch (error) {
    console.error('Diagram serving failed:', error);
    res.status(500).json({ error: 'Failed to serve diagram' });
  }
};