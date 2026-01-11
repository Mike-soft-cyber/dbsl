const mongoose = require('mongoose');

const levelConfigSchema = new mongoose.Schema({
  level: {
    type: String,
    required: true,
    enum: [
      'PreSchool',
      'Lower Primary',
      'Upper Primary',
      'Junior School',
      'Senior School',
      'Special Needs - Foundation',
      'Special Needs - Intermediate',
      'Special Needs - Pre-vocational'
    ]
  },
  lessonDuration: {
    type: Number,
    required: true // in minutes: 30, 35, or 40
  },
  grades: [{
    type: String,
    required: true
  }],
  ageRange: {
    type: String,
    required: true // e.g., "4-5 years", "6-8 years"
  },
  description: String
}, { timestamps: true });

levelConfigSchema.index({ level: 1 });
levelConfigSchema.index({ grades: 1 });

module.exports = mongoose.model('LevelConfig', levelConfigSchema);