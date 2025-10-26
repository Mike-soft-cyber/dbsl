// fixCounts.js
const mongoose = require('mongoose');
require('dotenv').config();

// Your MongoDB connection string
const MONGO_URI = process.env.MONGO_URI;

const User = require('./models/User');
const Document = require('./models/Document');

async function fixUserCounts() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    const userId = '6893accb0fabc860ae51a568';
    
    // Count documents created by this user
    const documentsCreatedCount = await Document.countDocuments({ 
      teacher: userId 
    });
    
    // Count downloads from downloadedDocuments array
    const user = await User.findById(userId);
    const downloadsCount = user.downloadedDocuments ? user.downloadedDocuments.length : 0;
    
    // Update the user document
    await User.findByIdAndUpdate(userId, {
      documentsCreated: documentsCreatedCount,
      downloads: downloadsCount
    });
    
    console.log(`\n✅ UPDATED USER ${userId}:`);
    console.log(`📄 Documents Created: ${documentsCreatedCount} (was ${user.documentsCreated})`);
    console.log(`📥 Downloads: ${downloadsCount} (was ${user.downloads})`);
    console.log(`📋 Downloaded Documents in history: ${downloadsCount}`);
    
  } catch (error) {
    console.error('❌ Error fixing counts:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  }
}

// Run the function
fixUserCounts();