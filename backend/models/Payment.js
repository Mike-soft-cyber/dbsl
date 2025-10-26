const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  phone: String,
  amount: Number,
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: "Document" },
  mpesaReceiptNumber: String,
  transactionDate: String,
  status: { type: String, enum: ["PENDING", "PAID", "FAILED"], default: "PENDING" },
  checkoutRequestID: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Payment", paymentSchema);
