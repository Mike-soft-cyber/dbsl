const User = require('../models/User');
const { newTeacherMess } = require('../controllers/activityController');
const SchoolConfig = require('../models/SchoolConfig');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const activityController = require('../controllers/activityController');
const Document = require('../models/Document');

exports.registerTeacher = async (req, res) => {
    try {
        const { firstName, lastName, email, password, schoolCode } = req.body;

        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Teacher already exists with this email' });
        }

        
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            schoolCode,
            role: 'Teacher'
        });

        await newUser.save();

        const teacherName = `${newUser.firstName} ${newUser.lastName}`;
        await newTeacherMess(teacherName);

        res.status(201).json({ message: 'Teacher registered successfully', user: newUser });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error registering teacher' });
    }
}

exports.getTeacher = async (req, res) => {
    try {
        const teacher = await User.findById(req.params.id, 'firstName lastName _id email role profilePic')
        if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
        res.json(teacher)
    } catch (err) {
        res.status(500).json({ message: 'Server Error(getTeacher)' })
    }
}

exports.getAllTeachers = async (req, res) => {
    try {
        const { schoolCode } = req.params;
        
        if (!schoolCode) {
            return res.status(400).json({ message: 'School code is required' });
        }
        
        const teachers = await User.find({ schoolCode, role: { $in: ['Teacher', 'Admin'] } });
        res.status(200).json(teachers);
    } catch (err) {
        console.error('Error in getAllTeachers:', err);
        res.status(500).json({ message: 'Server error' });
    }
}

exports.updateTeacher = async (req, res) => {
    const { id } = req.params;
    const { firstName, lastName, password } = req.body;

    try {
        const updateData = { firstName, lastName };
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateData.password = hashedPassword;
        }
        const updated = await User.findByIdAndUpdate(id, updateData, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: "Failed to update teacher" });
    }
};

exports.updateTeacherRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        const updated = await User.findByIdAndUpdate(
            id,
            { role },
            { new: true }
        );
        if (!updated) return res.status(404).json({ message: 'User not found' });

        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: 'Failed to update role' });
    }
};

exports.deleteTeacher = async (req, res) => {
    const { id } = req.params;

    try {
        const deleted = await User.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ message: 'Teacher not found' });
        res.json({ message: 'Teacher deleted successfully', user: deleted });
    } catch (err) {
        res.status(500).json({ message: "Failed to delete teacher" });
    }
}

exports.postStreamsOfSchool = async (req, res) => {
    const { streams } = req.body;
    const { schoolCode } = req.params;

    try {
        const config = await SchoolConfig.findOneAndUpdate(
            { schoolCode },
            { $addToSet: { streams: { $each: streams } } },
            { new: true, upsert: true }
        );

        res.json(config);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to add stream(s)' });
    }
};


exports.getStreams = async (req, res) => {
    const { schoolCode } = req.params;
    try {
        const config = await SchoolConfig.findOne({ schoolCode });
        if (!config) return res.status(404).json({ message: 'School config not found' });
        res.json({ streams: config.streams || [] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch streams' });
    }
};

exports.deleteStream = async (req, res) => {
    const { schoolCode } = req.params;
    const { stream } = req.query;

    try {
        const config = await SchoolConfig.findOneAndUpdate(
            { schoolCode },
            { $pull: { streams: stream } },
            { new: true }
        );

        if (!config) return res.status(404).json({ message: 'School not found' })

        res.json({ message: 'Stream removed', config });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to remove stream' });
    }
};

exports.assignClass = async (req, res) => {
    try {
        const { id } = req.params;
        const { grade, stream, learningArea } = req.body;

        const assign = await User.findByIdAndUpdate(
            id,
            {
                $addToSet: {
                    assignedClasses: { grade, stream, learningArea }
                }
            },
            { new: true }
        );

        if (!assign) {
            return res.status(404).json({ message: 'Teacher not found' });
        }

        
        const teacherName = `${assign.firstName} ${assign.lastName}`;
        await activityController.teacherAssignedClassActivity({ 
            teacherName,
            teacherId: id,
            assignedClasses: [{ grade, stream, learningArea }],
            schoolCode: assign.schoolCode
        });

        res.json(assign);
    } catch (error) {
        console.error('Error assigning class:', error);
        res.status(500).json({ message: 'Failed to assign class' });
    }
};


exports.removeFromAssignedClasses = async (req, res) => {
    try {
        const { id } = req.params;
        const { grade, stream, learningArea } = req.body;

        const remove = await User.findByIdAndUpdate(
            id,
            {
                $pull: {
                    assignedClasses: { grade, stream, learningArea }
                }
            },
            { new: true }
        );

        if (!remove) return res.status(404).json({ message: 'Teacher not found' });

        
        const teacherName = `${remove.firstName} ${remove.lastName}`;
        await activityController.teacherRemovedClassActivity({ 
            teacherName,
            teacherId: id,
            removedClass: { grade, stream, learningArea },
            schoolCode: remove.schoolCode
        });

        res.json(remove);
    } catch (error) {
        console.error('Error removing class:', error);
        res.status(500).json({ message: 'Failed to remove class' });
    }
};

exports.getAssignedClasses = async (req, res) => {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid or missing user id" });
    }

    try {
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: "Teacher not found" });
        res.json(user.assignedClasses);
    } catch (error) {
        console.error("Error fetching assigned classes:", error);
        res.status(500).json({ message: "Failed to fetch assigned classes" });
    }
};

exports.uploadProfilePic = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const userId = req.params.id || req.userId; 
    const filePath = req.file.filename;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: filePath },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Profile picture updated',
      profilePic: updatedUser.profilePic,
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({
      success: false,
      message: 'Upload failed',
      error: err.message, 
    });
  }
};


exports.getNumberOfTeachersforSchool = async (req, res) => {
    const { schoolCode } = req.params;
    try {
        const count = await User.countDocuments({ schoolCode, role: { $in: ['Teacher', 'Admin'] } });
        res.json({ count });
    } catch (error) {
        console.error('Error counting teachers:', error);
        res.status(500).json({ message: 'Failed to count teachers' });
    }
};

exports.getTotalAssignedClassesBySchool = async (req, res) => {
    const { schoolCode } = req.params;
    try {
        const totalClasses = await User.aggregate([
            { $match: { schoolCode } },
            { $unwind: "$assignedClasses" },
            { $group: { _id: null, total: { $sum: 1 } } }
        ]);

        res.json({ total: totalClasses[0]?.total || 0 });
    } catch (error) {
        console.error('Error counting assigned classes:', error);
        res.status(500).json({ message: 'Failed to count assigned classes' });
    }
};

exports.verifyEmail = async (req, res) => {
    try {
        const { token, email } = req.query;

        if (!token || !email) {
            return res.status(400).json({ message: "Missing token or email" });
        }

        const user = await User.findOne({ email, verificationToken: token });
        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        res.json({ message: "Email verified successfully" });
    } catch (error) {
        console.error("Error verifying email:", error);
        res.status(500).json({ message: "Server error verifying email" });
    }
};


exports.getUserDownloadsCount = async (req, res) => {
    const { userId } = req.params;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid or missing userId" });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ count: user.downloads || 0 });
    } catch (error) {
        console.error("Error fetching user downloads:", error);
        res.status(500).json({ message: "Failed to fetch downloads count" });
    }
};


exports.getUserDocumentsCreatedCount = async (req, res) => {
    const { userId } = req.params;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid or missing userId" });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ count: user.documentsCreated || 0 });
    } catch (error) {
        console.error("Error fetching user documents created:", error);
        res.status(500).json({ message: "Failed to fetch documents created count" });
    }
};



exports.trackDocumentDownload = async (req, res) => {
    const { userId } = req.params;
    const { documentId, documentType, grade, subject, strand, substrand, learningArea } = req.body;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid userId" });
    }

    try {
        const user = await User.findByIdAndUpdate(
            userId,
            {
                $inc: { downloads: 1 },
                $push: {
                    downloadedDocuments: {
                        documentId,
                        documentType,
                        grade,
                        subject,
                        strand,
                        substrand,
                        learningArea,
                        downloadedAt: new Date()
                    }
                }
            },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        console.log(`✅ Download tracked for user ${userId}. New download count: ${user.downloads}`);

        
        const teacherName = `${user.firstName} ${user.lastName}`;
        await activityController.docDownloadedActivity({ 
            teacherName,
            teacherId: userId,
            docType: documentType,
            schoolCode: user.schoolCode,
            documentId,
            grade,
            subject,
            learningArea
        });

        res.json({ 
            success: true, 
            message: "Download tracked",
            newDownloadCount: user.downloads
        });
    } catch (error) {
        console.error("Error tracking download:", error);
        res.status(500).json({ message: "Failed to track download" });
    }
};

exports.deleteDownloadFromHistory = async (req, res) => {
    const { userId, downloadId } = req.params;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid userId" });
    }

    try {
        const user = await User.findByIdAndUpdate(
            userId,
            {
                $pull: { downloadedDocuments: { _id: downloadId } },
                $inc: { downloads: -1 }
            },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ success: true, message: "Download removed from history" });
    } catch (error) {
        console.error("Error deleting download:", error);
        res.status(500).json({ message: "Failed to delete download" });
    }
};


exports.debugUserCounts = async (req, res) => {
  const { userId } = req.params;
  
  try {
    const user = await User.findById(userId);
    const documentCount = await Document.countDocuments({ teacher: userId });
    const downloadHistoryCount = user.downloadedDocuments ? user.downloadedDocuments.length : 0;
    
    res.json({
      userData: {
        downloads: user.downloads,
        documentsCreated: user.documentsCreated
      },
      actualCounts: {
        documentsInDB: documentCount,
        downloadsInHistory: downloadHistoryCount
      },
      downloadedDocuments: user.downloadedDocuments || []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.fixUserCounts = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    
    const documentsCreatedCount = await Document.countDocuments({ 
      teacher: userId 
    });
    
    
    const user = await User.findById(userId);
    const downloadsCount = user.downloadedDocuments ? user.downloadedDocuments.length : 0;
    
    
    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      {
        documentsCreated: documentsCreatedCount,
        downloads: downloadsCount
      },
      { new: true }
    );
    
    res.json({
      success: true,
      message: "✅ User counts fixed successfully!",
      previousCounts: {
        downloads: user.downloads,
        documentsCreated: user.documentsCreated
      },
      newCounts: {
        downloads: updatedUser.downloads,
        documentsCreated: updatedUser.documentsCreated
      },
      actualData: {
        documentsInDB: documentsCreatedCount,
        downloadHistoryItems: downloadsCount
      }
    });
    
  } catch (error) {
    console.error('Error fixing counts:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};


exports.fixUserCountsDebug = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    console.log('🔄 Fixing counts for user:', userId);
    
    
    const documentsCreatedCount = await Document.countDocuments({ 
      teacher: userId 
    });
    
    
    const user = await User.findById(userId);
    const downloadsCount = user.downloadedDocuments ? user.downloadedDocuments.length : 0;
    
    
    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      {
        documentsCreated: documentsCreatedCount,
        downloads: downloadsCount
      },
      { new: true }
    );
    
    console.log('✅ Successfully updated user counts');
    
    res.json({
      success: true,
      message: "✅ User counts fixed successfully!",
      previousCounts: {
        downloads: user.downloads,
        documentsCreated: user.documentsCreated
      },
      newCounts: {
        downloads: updatedUser.downloads,
        documentsCreated: updatedUser.documentsCreated
      },
      actualData: {
        documentsInDB: documentsCreatedCount,
        downloadHistoryItems: downloadsCount
      }
    });
    
  } catch (error) {
    console.error('Error fixing counts:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

exports.debugUserDownloads = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    
    console.log('🔍 Debug user downloads:', {
      userId,
      downloadsCount: user?.downloads,
      downloadedDocuments: user?.downloadedDocuments?.length,
      downloadedDocumentsData: user?.downloadedDocuments
    });
    
    res.json({
      userData: {
        downloads: user?.downloads,
        downloadedDocumentsCount: user?.downloadedDocuments?.length,
        downloadedDocuments: user?.downloadedDocuments || []
      },
      availableEndpoints: [
        'GET /api/teachers/:userId/downloaded-documents',
        'GET /api/teachers/:userId/documents',
        'GET /api/teachers/:userId/debug-downloads'
      ]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getSchoolConfig = async (req, res) => {
    try {
        const { schoolCode } = req.params;
        
        if (!schoolCode) {
            return res.status(400).json({ 
                success: false, 
                message: 'School code is required' 
            });
        }

        
        const schoolConfig = await SchoolConfig.findOne({ schoolCode });
        
        if (!schoolConfig) {
            return res.status(404).json({ 
                success: false, 
                message: 'School configuration not found' 
            });
        }
        res.json({
            success: true,
            school: {
                schoolCode: schoolConfig.schoolCode,
                streams: schoolConfig.streams || []
            }
        });
    } catch (error) {
        console.error('Error fetching school config:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error fetching school configuration' 
        });
    }
};

exports.getProfile = async (req, res) => {
  try {
    console.log('📡 Profile request from user:', req.user?.id);
    
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      console.log('❌ User not found:', req.user?.id);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('✅ Returning user profile:', {
      email: user.email,
      profilePic: user.profilePic,
      signupMethod: user.signupMethod
    });

    
    res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      schoolName: user.schoolName,
      schoolCode: user.schoolCode,
      phone: user.phone,
      profilePic: user.profilePic, 
      signupMethod: user.signupMethod,
      isVerified: user.isVerified,
      assignedClasses: user.assignedClasses,
      documentsCreated: user.documentsCreated,
      downloadedDocuments: user.downloadedDocuments
    });

  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};