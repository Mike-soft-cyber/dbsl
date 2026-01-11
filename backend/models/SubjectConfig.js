const mongoose = require('mongoose');

const subjectConfigSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true
  },
  level: {
    type: String,
    required: true
  },
  grades: [{
    type: String,
    required: true
  }],
  lessonsPerWeek: {
    type: Number,
    required: true
  },
  termWeeks: {
    term1: { type: Number, default: 10 },
    term2: { type: Number, default: 11 },
    term3: { type: Number, default: 6 }
  },
  isCore: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

subjectConfigSchema.index({ subject: 1, level: 1 });
subjectConfigSchema.index({ grades: 1 });

module.exports = mongoose.model('SubjectConfig', subjectConfigSchema);