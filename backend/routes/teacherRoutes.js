// routes/teacherRoutes.js
const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');
const User = require('../models/User');

// Apply auth middleware to all routes
router.use(authMiddleware);

// app.use('/api/teachers')
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

// Profile picture upload route with proper error handling
router.post(
  "/upload-profile-pic/:id",
  upload.single("profilePic"), // field name must match frontend FormData
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }

      const teacherId = req.params.id;
      const fileName = req.file.filename;

      // Update teacher document with new profilePic
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
      console.error("❌ Upload error:", err); // ✅ show exact error in backend console
      res.status(500).json({
        success: false,
        message: "Server error while uploading file",
        error: err.message, // ✅ include real error in response
      });
    }
  }
);

module.exports = router;