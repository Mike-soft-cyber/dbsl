const Document = require('../models/Document');

// GET /api/admin/document-purchases
exports.getAllTeacherPurchases = async (req, res) => {
  try {
    const documents = await Document.find()
      .populate('teacher', 'firstName lastName')       
      .populate('cbcEntry');                          

    const result = documents.map(doc => ({
      _id: doc._id,
      teacherName: `${doc.teacher.firstName} ${doc.teacher.lastName}`,
      documentType: doc.type,
      grade: doc.cbcEntry?.grade,
      learningArea: doc.cbcEntry?.learningArea,
      strand: doc.cbcEntry?.strand,
      substrands: doc.cbcEntry?.substrand ? [doc.cbcEntry.substrand] : [],
      date: doc.createdAt,
      status: doc.isPaid ? 'Paid' : 'Pending'
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error('Failed to fetch teacher purchases:', error);
    res.status(500).json({ message: 'Error fetching teacher purchases' });
  }
};

exports.deleteDocumentPurchase = async (req, res) => {
  const { id } = req.params;

  try {
    const document = await Document.findByIdAndDelete(id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    res.status(200).json({ message: 'Document purchase deleted successfully' });
  } catch (error) {
    console.error('Failed to delete document purchase:', error);
    res.status(500).json({ message: 'Error deleting document purchase' });
  }
};
