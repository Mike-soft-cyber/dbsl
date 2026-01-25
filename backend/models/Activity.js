const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  type: { 
    type: String, 
    required: true, 
    enum: [
      'teacher_registered', 
      'teacher_assigned_class', 
      'teacher_removed_class',
      'document_created', 
      'document_downloaded', 
      'login', 
      'profile_updated',
      'other'
    ],
    index: true 
  },
  message: { type: String, required: true },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: false 
  },
  schoolCode: { type: String, index: true },
  metadata: {
    teacherName: String,
    grade: String,
    stream: String,
    learningArea: String,
    docType: String,
    documentId: String,
    
    assignedGrades: [String],
    assignedStreams: [String],
    assignedLearningAreas: [String],
    actionType: String 
  },
  createdAt: { type: Date, default: Date.now, index: true }
});


activitySchema.index({ schoolCode: 1, createdAt: -1 });
activitySchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);