const Document = require('../models/Document');
const User = require('../models/User');

exports.getAllTeacherPurchases = async (req, res) => {
  try {
    console.log('[DocDashboard] Fetching documents for school...');
    
    
    const { schoolCode } = req.query;
    
    if (!schoolCode) {
      return res.status(400).json({ 
        message: 'School code is required' 
      });
    }
    
    console.log(`[DocDashboard] Fetching documents for school: ${schoolCode}`);
    
    
    const teachersInSchool = await User.find({ 
      schoolCode: schoolCode,
      role: { $in: ['Teacher', 'Admin'] }
    }).select('_id');
    
    const teacherIds = teachersInSchool.map(teacher => teacher._id);
    
    console.log(`[DocDashboard] Found ${teacherIds.length} teachers in school ${schoolCode}`);
    
    if (teacherIds.length === 0) {
      return res.status(200).json([]);
    }
    
    
    const documents = await Document.find({
      teacher: { $in: teacherIds }
    })
      .populate('teacher', 'firstName lastName schoolCode')       
      .populate('cbcEntry', 'grade learningArea strand substrand')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`[DocDashboard] Found ${documents.length} documents in school ${schoolCode}`);

    
    const result = documents.map(doc => {
      
      const teacherName = doc.teacher 
        ? `${doc.teacher.firstName} ${doc.teacher.lastName}`
        : 'Unknown Teacher';

      
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
        status: doc.status || 'completed',
        content: doc.content || '',
        term: doc.term || 'N/A',
        schoolCode: doc.teacher?.schoolCode || schoolCode 
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
  const { schoolCode } = req.query; 

  try {
    console.log(`[DocDashboard] Deleting document: ${id} for school: ${schoolCode || 'not specified'}`);
    
    
    if (schoolCode) {
      const document = await Document.findById(id).populate('teacher', 'schoolCode');
      if (document && document.teacher && document.teacher.schoolCode !== schoolCode) {
        return res.status(403).json({ 
          message: 'Unauthorized: Document does not belong to your school' 
        });
      }
    }
    
    const deletedDocument = await Document.findByIdAndDelete(id);
    
    if (!deletedDocument) {
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