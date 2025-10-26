const {stkPush, queryStkPushStatus} = require('../services/payment')
const Payment = require("../models/Payment");
const Document = require('../models/Document');

exports.initiatePayment = async (req, res) => {
  try {
    const { phone, amount, documentId } = req.body;
    console.log('📞 Received phone number:', phone);

    const stkResponse = await stkPush(phone, amount);
    console.log('✅ STK Push initiated:', stkResponse);

    const checkoutRequestID = stkResponse.CheckoutRequestID;

    res.status(200).json({
      message: 'STK Push initiated. Awaiting user confirmation.',
      checkoutRequestID,
    });

  } catch (error) {
    console.error('❌ Payment error:', error);
    res.status(500).json({ message: 'Payment initiation failed', error: error.message });
  }
};

exports.getAllPayments = async (req, res) => {
  try {
    const { grade, status, startDate, endDate } = req.query;

    // Build filter object
    const filter = {};

    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // First, find all matching payments
    const payments = await Payment.find(filter)
      .populate({
        path: "documentId",
        populate: [
          { path: "cbcEntry", model: "CBCEntry" },
          { path: "teacher", model: "User" },
        ],
      })
      .sort({ createdAt: -1 });

    // Then filter by grade if provided
    const filtered = grade
      ? payments.filter(
          (p) => p.documentId?.cbcEntry?.grade?.toLowerCase() === grade.toLowerCase()
        )
      : payments;

    const formatted = filtered.map((p) => ({
      teacherName:
        (p.documentId?.teacher?.firstName || "") +
        " " +
        (p.documentId?.teacher?.lastName || ""),
      grade: p.documentId?.cbcEntry?.grade || "N/A",
      learningAreaName: p.documentId?.cbcEntry?.learningArea || "N/A",
      strand: p.documentId?.cbcEntry?.strand || "N/A",
      substrand: p.documentId?.cbcEntry?.substrand || "N/A",
      documentType: p.documentId?.type,
      phone: p.phone,
      amount: p.amount,
      status: p.status,
      createdAt: p.createdAt,
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch payments" });
  }
};