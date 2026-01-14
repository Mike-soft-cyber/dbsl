const mongoose = require('mongoose');

const referencesSchema = new mongoose.Schema({
  slo: { type: String },
  experiences: { type: String },
  assessments: { type: String },
}, { _id: false });

const documentSchema = new mongoose.Schema({
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  type: { 
    type: String, 
    enum: [
      'Lesson Concept Breakdown', 
      'Schemes of Work', 
      'Lesson Plan', 
      'Lesson Notes', 
      'Exercises'
    ], 
    required: true 
  },

  term: { 
    type: String, 
    enum: ['Term 1', 'Term 2', 'Term 3'] 
  },

  grade: { type: String },
  school: { type: String },
  subject: { type: String },
  strand: { type: String },
  substrand: { type: String },

  cbcEntry: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'CBCEntry', 
    required: true 
  },

  // ✅ NEW: Link to parent document (e.g., Lesson Notes links to Lesson Concept)
  parentDocument: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    default: null
  },
  
  // ✅ NEW: Specific lesson details when derived from breakdown
  lessonDetails: {
    weekNumber: Number,        // e.g., 1, 2, 3
    lessonNumber: Number,      // e.g., 1 (first lesson of the week)
    specificConcept: String,   // The exact learning concept from breakdown
    conceptIndex: Number       // Position in the breakdown (for reference)
  },

  content: { type: String, required: true },

  references: referencesSchema,
  resources: [String],
  keyInquiryQuestions: [String],

  status: {
    type: String,
    enum: ['completed', 'processing', 'failed', 'partial'],
    default: 'processing'
  },
  
  metadata: {
    generationTime: Number,
    diagramStats: {
      total: Number,
      successful: Number,
      failed: Number
    },
    cbcDataQuality: {
      score: Number,
      issues: [String],
      quality: String
    },
    aiModel: String,
    contentLength: Number,
    tableDetected: Boolean,
    hasImages: Boolean
  },

  version: { type: Number, default: 1 },
  generatedBy: { type: String, default: 'AI' }
}, { timestamps: true });

// Indexes
documentSchema.index({ teacher: 1, createdAt: -1 });
documentSchema.index({ grade: 1, subject: 1, type: 1 });
documentSchema.index({ school: 1, createdAt: -1 });
documentSchema.index({ status: 1, createdAt: -1 });
documentSchema.index({ type: 1, grade: 1, subject: 1, createdAt: -1 });
documentSchema.index({ strand: 1, substrand: 1 });
documentSchema.index({ parentDocument: 1 }); // ✅ NEW: For finding child documents

// Text index for search
documentSchema.index({ 
  type: 'text', 
  subject: 'text', 
  strand: 'text', 
  substrand: 'text' 
});

// ✅ NEW: Virtual for child documents
documentSchema.virtual('childDocuments', {
  ref: 'Document',
  localField: '_id',
  foreignField: 'parentDocument'
});

module.exports = mongoose.model('Document', documentSchema);