const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true, trim: true},
    lastName: { type: String, required: true, trim: true},
    phone: { type: String, required: true, unique: true},
    role: { type: String, enum: ['Director', 'Principal', 'Deputy Principal', 'Dean of Studies', 'Teacher'], default: 'Teacher' },
    schoolName: { type: String, required: true },
    schoolCode: { type: String, required: true, unique: true },
    downloads: { type: Number, required: true, default: 0},
    documentsCreated: {type: Number, required: true, default: 0},
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

})

module.exports = mongoose.model('User',userSchema);