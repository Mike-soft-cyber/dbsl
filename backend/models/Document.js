const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    teacher: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    type: { type: String, enum: ['Lesson Concept Breakdown', 'Schemes of Work', 'Lesson Plan', 'Lesson Notes', 'Exercises'], required: true },
    term: {type: String, enum: ['Term 1', 'Term 2', 'Term 3']},
    strand: { type: mongoose.Schema.Types.ObjectId, ref: 'Strand', required: true },
    substrands:[{ type: mongoose.Schema.Types.ObjectId, ref: 'SubStrand', required: true }],
    amount: {type: Number, required: true},
    isPaid: { type: Boolean, default: false },
    status: { type: String, enum: ['completed', 'pending', 'processing'], default: 'pending' },
    content: {type: String, required: true}
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);