const express = require('express');
const router = express.Router();
const schoolConfigController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);



router.post('/:schoolCode/streams', schoolConfigController.postStreamsOfSchool);
router.get('/:schoolCode', schoolConfigController.getSchoolConfig);
router.get('/:schoolCode/streams', schoolConfigController.getStreams);
router.delete('/:schoolCode/streams', schoolConfigController.deleteStream);

module.exports = router;