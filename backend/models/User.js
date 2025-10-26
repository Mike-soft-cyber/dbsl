const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true, trim: true},
    lastName: { type: String, required: true, trim: true},
    phone: { type: String, required: true, unique: true},
    role: { type: String, enum: ['Admin', 'Teacher'], default: 'Teacher' },
    schoolName: { type: String, required: true },
    schoolCode: { type: String, required: true,},
    downloads: { type: Number, required: true, default: 0},
    documentsCreated: {type: Number, required: true, default: 0},
    downloadedDocuments: [{
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true
    },
    documentType: String,
    grade: String,
    subject: String,
    learningArea: String,
    strand: String,
    substrand: String,
    downloadedAt: {
      type: Date,
      default: Date.now
    }
  }],
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profilePic: {type: String, default: 'default-avatar.png'},
    assignedClasses: [
  {
    grade: String,
    stream: String,
    learningArea: String,
  }
],
totalDownloads: {
    type: Number,
    default: 0
  },

isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  verificationExpires: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('User',userSchema);