const Payment = require('../models/Payment');
const Document = require('../models/Document');
const aiController = require('../controllers/aiController');

exports.confirmPayment = async (req, res) => {
  try {
    const { checkoutRequestID, documentData } = req.body;

    
    const paymentStatus = await checkMpesaPayment(checkoutRequestID);

    if (paymentStatus.success && paymentStatus.paid) {
      
      let aiResponse;
      switch (documentData.type) {
        case "Concept Breakdown":
          aiResponse = await aiController.generateConceptBreakdownInternal(documentData);
          break;
        case "Schemes of Work":
          aiResponse = await aiController.generateSchemesOfWorkInternal(documentData);
          break;
        case "Lesson Plan":
          aiResponse = await aiController.generateLessonPlanInternal(documentData);
          break;
        case "Lesson Notes":
          aiResponse = await aiController.generateLessonNotesInternal(documentData);
          break;
        case "Exercise":
          aiResponse = await aiController.generateExerciseInternal(documentData);
          break;
        default:
          throw new Error("Unknown document type");
      }

      
      const fileUrl = await saveDocumentToStorage(aiResponse, documentData);

      
      return res.json({
        success: true,
        paid: true,
        downloadUrl: fileUrl,
      });
    }

    res.json({ success: true, paid: false });
  } catch (error) {
    console.error("Payment confirmation error:", error);
    res.status(500).json({ success: false, error: "Payment check failed" });
  }
};

const paymentCallback = async (req, res) => {
  const { Body } = req.body;

  const result = Body.stkCallback;
  const checkoutRequestID = result.CheckoutRequestID;

  if (result.ResultCode === 0) {
    
    const metadata = result.CallbackMetadata.Item;
    const receipt = metadata.find(i => i.Name === 'MpesaReceiptNumber')?.Value;
    const amount = metadata.find(i => i.Name === 'Amount')?.Value;
    const date = metadata.find(i => i.Name === 'TransactionDate')?.Value;

    const payment = await Payment.findOneAndUpdate(
      { checkoutRequestID },
      {
        status: 'completed',
        mpesaReceiptNumber: receipt,
        transactionDate: date
      },
      { new: true }
    );

    
    await Document.findByIdAndUpdate(payment.document, {
      isPaid: true,
      status: 'completed'
    });

    console.log('✅ Payment successful:', receipt);
  } else {
    
    await Payment.findOneAndUpdate(
      { checkoutRequestID },
      { status: 'failed' }
    );
    console.log('❌ Payment failed:', result.ResultDesc);
  }

  res.status(200).json({ message: 'Callback received successfully' });
};
