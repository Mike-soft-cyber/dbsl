
const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');
const User = require('../models/User');


router.use(authMiddleware);


router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const User = require('../models/User');
    
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
});
router.get('/:id', teacherController.getTeacher);
router.get('/school/:schoolCode/count', teacherController.getNumberOfTeachersforSchool);
router.get('/school/:schoolCode', teacherController.getAllTeachers);
router.put('/:id/role', teacherController.updateTeacherRole);
router.put('/:id', teacherController.updateTeacher);
router.delete('/:id', teacherController.deleteTeacher);
router.post('/:id/class', teacherController.assignClass);
router.delete('/:id/class', teacherController.removeFromAssignedClasses);
router.get('/:id/assigned-classes', teacherController.getAssignedClasses);
router.get('/school/:schoolCode/assigned-classes/count', teacherController.getTotalAssignedClassesBySchool);
router.get('/:userId/downloads/count', teacherController.getUserDownloadsCount);
router.get('/:userId/documents/count', teacherController.getUserDocumentsCreatedCount);
router.post('/:userId/track-download', teacherController.trackDocumentDownload);
router.delete('/:userId/download-history/:downloadId', teacherController.deleteDownloadFromHistory);
router.get('/:userId/debug-counts', teacherController.debugUserCounts);
router.get('/:userId/fix-counts', teacherController.fixUserCounts);
router.get('/profile', authMiddleware, teacherController.getProfile);


router.post(
  "/upload-profile-pic/:id",
  upload.single("profilePic"), 
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }

      const teacherId = req.params.id;
      const fileName = req.file.filename;

      
      const updatedTeacher = await User.findByIdAndUpdate(
        teacherId,
        { profilePic: fileName },
        { new: true }
      );

      if (!updatedTeacher) {
        return res.status(404).json({ success: false, message: "Teacher not found" });
      }

      res.json({
        success: true,
        message: "Profile picture uploaded successfully",
        profilePic: fileName,
      });
    } catch (err) {
      console.error("❌ Upload error:", err); 
      res.status(500).json({
        success: false,
        message: "Server error while uploading file",
        error: err.message, 
      });
    }
  }
);

module.exports = router;