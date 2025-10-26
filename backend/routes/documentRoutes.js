const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const pdfController = require('../controllers/pdfController');
const authenticate = require('../middleware/auth');

// Static/specific routes (before dynamic :id routes)
router.get('/document', documentController.getDocument);
router.get('/terms', documentController.getTerms);
router.get('/grades', documentController.getGrades);

// POST routes
router.post('/generate', documentController.generateDocumentEnhanced);
router.post('/generate-linked-notes/:id', authenticate, documentController.generateLinkedNotesFromBreakdown);
router.post('/teacher/:teacherId/track-download', documentController.trackDocumentDownload);

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
router.get('/api/documents/:documentId/diagrams/:diagramIndex', documentController.getDocumentDiagram);


// DELETE route
router.delete('/:id', documentController.deleteDocument);

// Generic :id route - MUST BE LAST
router.get('/:id', documentController.fetchGeneratedDocument);

module.exports = router;