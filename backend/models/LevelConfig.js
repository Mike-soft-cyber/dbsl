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
    required: true 
  },
  grades: [{
    type: String,
    required: true
  }],
  ageRange: {
    type: String,
    required: true 
  },
  description: String
}, { timestamps: true });

levelConfigSchema.index({ level: 1 });
levelConfigSchema.index({ grades: 1 });

module.exports = mongoose.model('LevelConfig', levelConfigSchema);