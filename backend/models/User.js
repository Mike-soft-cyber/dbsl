// model/User.js - Simplified version
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { 
        type: String, 
        required: function() { return !this.googleId; },
        unique: true,
        sparse: true
    },
    role: { type: String, enum: ['Admin', 'Teacher'], default: 'Teacher' },
    schoolName: { 
        type: String, 
        required: function() { return !this.googleId; }
    },
    schoolCode: { 
        type: String, 
        required: function() { return !this.googleId; }
    },
    downloads: { type: Number, required: true, default: 0 },
    documentsCreated: { type: Number, required: true, default: 0 },
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
    password: { 
        type: String, 
        required: function() { return !this.googleId; }
    },
    googleId: { type: String, unique: true, sparse: true },
    profilePic: { type: String, default: 'default-avatar.png' },
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
    isVerified: { 
        type: Boolean, 
        default: true // Set to true by default
    },
    signupMethod: { 
        type: String, 
        enum: ['email', 'google'], 
        default: 'email' 
    },
    needsCompleteProfile: { 
        type: Boolean, 
        default: function() { 
            return !!this.googleId && (!this.schoolName || !this.schoolCode || !this.phone); 
        } 
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);