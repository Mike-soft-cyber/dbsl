require('dotenv').config();
const EmailPdfProcessor = require('../services/emailPdfProcessor');
const mongoose = require('mongoose');

async function startEmailWorker() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Start email processor
    const processor = new EmailPdfProcessor();
    processor.startMonitoring();

    console.log('🚀 Email worker started successfully');
    console.log(`📧 Monitoring: ${process.env.EMAIL_USER}`);
    console.log('📄 Send CBC PDFs to this email to auto-process them');

  } catch (error) {
    console.error('❌ Failed to start email worker:', error);
    process.exit(1);
  }
}

startEmailWorker();