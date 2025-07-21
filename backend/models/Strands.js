const mongoose = require('mongoose')

const strandSchema = new mongoose.Schema({
    learningArea: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningArea', required: true },
    grade: { type: String, enum: ['PP 1', 'PP 2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'] ,required: true },
    strand: { type: String, required: true },
});

module.exports = mongoose.model('Strand', strandSchema)