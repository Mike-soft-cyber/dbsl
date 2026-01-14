// routes/documentRoutes.js - ADD THIS ROUTE

const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const pdfController = require('../controllers/pdfController');
const Document = require('../models/Document')
const authenticate = require('../middleware/auth');
const path = require('path');
const fs = require('fs').promises;

// Static/specific routes (before dynamic :id routes)
router.get('/document', documentController.getDocument);
router.get('/terms', documentController.getTerms);
router.get('/grades', documentController.getGrades);

// POST routes
router.post('/generate', documentController.generateDocumentEnhanced);
router.post('/generate-linked-notes/:id', authenticate, documentController.generateLinkedNotesFromBreakdown);
router.post('/teacher/:teacherId/track-download', documentController.trackDocumentDownload);

router.get('/breakdowns', async (req, res) => {
  const { grade, term, strand, substrand, teacher } = req.query;
  
  const breakdowns = await Document.find({
    type: 'Lesson Concept Breakdown',
    grade,
    term,
    strand,
    substrand,
    teacher
  }).select('_id substrand strand grade term createdAt content');
  
  // Extract concept count from content
  const breakdownsWithCount = breakdowns.map(bd => ({
    ...bd.toObject(),
    conceptCount: (bd.content.match(/\|\s*Week\s*\d+/gi) || []).length
  }));
  
  res.json({ breakdowns: breakdownsWithCount });
});

router.post('/generate-scheme-from-breakdown/:breakdownId', authenticate, documentController.generateSchemeFromBreakdown);
router.post('/generate-lesson-plan-from-breakdown/:breakdownId', authenticate, documentController.generateLessonPlanFromBreakdown);

// More specific routes before generic :id routes
router.get('/:schoolCode/count', documentController.getDocCountOfSchool);
router.get('/:schoolCode/downloads/count', documentController.getNumberOfDownloadsByTeachers);
router.get('/streams/:id', documentController.getStreams);
router.get('/teachers/:teacherId/count', documentController.getDocCreatedByTeacher);
router.get('/teachers/:teacherId', documentController.getUserDocumentsCreated);
router.get('/recent-downloads/:userId', documentController.getRecentDownloads);

// Most specific :id routes before the generic :id route
router.get('/:id/pdf', pdfController.generatePDF);
router.get('/:id/has-linked-notes', documentController.hasLinkedNotes);
router.get('/:id/diagrams/:diagramIndex', documentController.diagramFallback);
router.get('/:documentId/diagrams/:diagramIndex', documentController.getDocumentDiagram);
router.get('/documents/:id/pdf', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    // ✅ Load diagrams from files
    const diagramsWithBase64 = await DocumentGeneratorFactory.prepareDiagramsForPDF(document);
    
    // Generate PDF with loaded diagrams
    const pdf = await generatePDF({
      ...document.toObject(),
      diagrams: diagramsWithBase64 // Use file-loaded diagrams
    });
    
    res.contentType('application/pdf');
    res.send(pdf);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE route
router.delete('/:id', documentController.deleteDocument);

// Generic :id route - MUST BE LAST
router.get('/:id', documentController.fetchGeneratedDocument);


module.exports = router;