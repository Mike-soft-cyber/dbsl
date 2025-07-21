const express = require('express')
const router = express.Router()
const getRecentDoc = require('../controllers/recentdocController')

router.get('/recent/:userId', getRecentDoc)

module.exports = router