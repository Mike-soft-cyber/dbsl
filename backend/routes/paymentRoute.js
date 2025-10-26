const express = require('express')
const router = express.Router()
const {initiatePayment, getAllPayments} = require('../controllers/mpesaController')
const { handleCallback } = require('../controllers/callbackController');


router.post('/callback', (req, res) => {
  try {
    console.log("📩 Raw callback body:", req.body);

    const data = req.body;

    if (!data.Body || !data.Body.stkCallback) {
      console.log("❌ stkCallback missing in body");
      return res.status(400).send("Invalid callback");
    }

    const callback = data.Body.stkCallback;
    console.log("✅ Received stkCallback:", callback);

    // You can save to DB or process further

    res.status(200).send("Callback received");
  } catch (error) {
    console.error("❌ Error handling callback:", error);
    res.status(500).send("Server error");
  }
});

router.post('/mpesa', initiatePayment)
router.get('/', getAllPayments);

module.exports = router