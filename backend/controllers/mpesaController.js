const {stkPush} = require('../services/payment')

exports.initiatePayment = async (req, res) => {
    try {
        const {phone, amount, documentId} = req.body

        const mpesaRes = await stkPush(
            phone,
            amount,
            `DOC${documentId}`,
            `DOcument purchase payment`
        )

        res.json({
            success: true,
            message: 'STK push initiated',
            checkoutRequestID: mpesaRes.checkoutRequestID,
        })
    } catch (error) {
        console.error(error.response?.data || error.message)
        res.status(500).json({success: false, message: "Payment initiation failed"})
    }
}

exports.paymentCallback = async (req, res) => {
    console.log('Mpesa Callback received:', JSON.stringify(req.body, null, 2))


    res.json({ResultCode: 0, ResultDesc: "Received successfully"})
}