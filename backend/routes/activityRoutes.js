const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');

//app.use('/api/activities)

// Get all activities with filtering
router.get('/', activityController.getAllActivities);

// Get recent activities for a specific school
router.get('/school/:schoolCode/recent', activityController.getRecentActivities);

module.exports = router;