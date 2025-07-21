const mongoose = require('mongoose');

const subStrandSchema = new mongoose.Schema({
    strand: { type: mongoose.Schema.Types.ObjectId, ref: 'Strand', required: true },
    name: { type: String, required: true},
});

subStrandSchema.index({ strand: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('SubStrand', subStrandSchema);