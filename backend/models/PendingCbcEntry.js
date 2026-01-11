const mongoose = require('mongoose');

const pendingCbcEntrySchema = new mongoose.Schema({
  extractedData: {
    grade: String,
    learningArea: String,
    strand: String,
    substrand: String,
    ageRange: String,
    lessonDuration: Number,
    lessonsPerWeek: Number,
    noOfLessons: Number,
    slo: [String],
    learningExperiences: [String],
    keyInquiryQuestions: [String],
    resources: [String],
    coreCompetencies: [String],
    values: [String],
    pertinentIssues: [String],
    linkToOtherSubjects: [String],
    communityLinkActivities: [String],
    assessment: [{
      skill: String,
      exceeds: String,
      meets: String,
      approaches: String,
      below: String
    }]
  },
  sourceEmail: String,
  filename: String,
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewToken: {
    type: String,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 604800 // 7 days
  }
});

module.exports = mongoose.model('PendingCbcEntry', pendingCbcEntrySchema);