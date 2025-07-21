const express = require('express')
const router = express.Router()
const {initiatePayment, paymentCallback} = require('../controllers/mpesaController')

router.post('/mpesa', initiatePayment)
router.post('/callback', paymentCallback)

module.exports = router