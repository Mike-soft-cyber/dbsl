const Document = require('../models/Document');

exports.getAllTeacherPurchases = async (req, res) => {
  try {
    console.log('[DocDashboard] Fetching all documents...');
    
    // Fetch all documents with populated teacher and cbcEntry
    const documents = await Document.find()
      .populate('teacher', 'firstName lastName')       
      .populate('cbcEntry', 'grade learningArea strand substrand')
      .sort({ createdAt: -1 }) // Most recent first
      .lean(); // Use lean() for better performance

    console.log(`[DocDashboard] Found ${documents.length} documents`);

    // Map documents to the format expected by frontend
    const result = documents.map(doc => {
      // Handle case where teacher might not exist (deleted user)
      const teacherName = doc.teacher 
        ? `${doc.teacher.firstName} ${doc.teacher.lastName}`
        : 'Unknown Teacher';

      // Get data from document or cbcEntry
      const grade = doc.grade || doc.cbcEntry?.grade || 'N/A';
      const learningArea = doc.subject || doc.cbcEntry?.learningArea || 'N/A';
      const strand = doc.strand || doc.cbcEntry?.strand || 'N/A';
      const substrand = doc.substrand || doc.cbcEntry?.substrand || 'N/A';

      return {
        _id: doc._id,
        teacherName: teacherName,
        documentType: doc.type,
        grade: grade,
        learningArea: learningArea,
        strand: strand,
        substrands: substrand ? [substrand] : [],
        date: doc.createdAt,
        status: doc.status || 'completed', // Use document status
        content: doc.content || '', // Include content for frontend extraction
        term: doc.term || 'N/A'
      };
    });

    console.log(`[DocDashboard] Returning ${result.length} formatted documents`);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('[DocDashboard] Failed to fetch documents:', error);
    res.status(500).json({ 
      message: 'Error fetching documents',
      error: error.message 
    });
  }
};

exports.deleteDocumentPurchase = async (req, res) => {
  const { id } = req.params;

  try {
    console.log(`[DocDashboard] Deleting document: ${id}`);
    
    const document = await Document.findByIdAndDelete(id);
    
    if (!document) {
      console.log(`[DocDashboard] Document ${id} not found`);
      return res.status(404).json({ message: 'Document not found' });
    }
    
    console.log(`[DocDashboard] ✅ Deleted document: ${id}`);
    res.status(200).json({ 
      message: 'Document deleted successfully',
      deletedId: id 
    });
  } catch (error) {
    console.error('[DocDashboard] Failed to delete document:', error);
    res.status(500).json({ 
      message: 'Error deleting document',
      error: error.message 
    });
  }
};
