const express = require('express')
const router = express.Router()
const teacherController = require('../controllers/userController') // corrected import

router.get('/:id', teacherController.getTeacher) // make sure getTeacher is exported

module.exports = router