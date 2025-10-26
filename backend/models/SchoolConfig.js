const mongoose = require('mongoose');

const schoolConfigSchema = new mongoose.Schema({
  schoolCode: { type: String, required: true, unique: true },
  streams: [String],
});

module.exports = mongoose.model('SchoolConfig', schoolConfigSchema);
