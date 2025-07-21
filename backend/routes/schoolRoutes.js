const express = require('express')
const router = express.Router()
const  schoolController= require('../controllers/schoolController')

router.get('/teacher/:id/schoolName', schoolController.getSchool)

module.exports = router