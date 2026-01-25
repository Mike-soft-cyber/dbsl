const express = require('express');
const router = express.Router();
const CBCEntry = require('../models/CbcEntry');
const PendingCbcEntry = require('../models/PendingCbcEntry');


router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const pendingEntry = await PendingCbcEntry.findOne({
      reviewToken: token,
      status: 'pending'
    });

    if (!pendingEntry) {
      return res.status(404).json({
        message: 'Entry not found or has already been processed'
      });
    }

    res.json({
      id: pendingEntry._id,
      extractedData: pendingEntry.extractedData,
      filename: pendingEntry.filename,
      createdAt: pendingEntry.createdAt
    });

  } catch (error) {
    console.error('Error fetching pending entry:', error);
    res.status(500).json({
      message: 'Error fetching entry',
      error: error.message
    });
  }
});


router.post('/:token/approve', async (req, res) => {
  try {
    const { token } = req.params;
    const editedData = req.body;

    
    const pendingEntry = await PendingCbcEntry.findOne({
      reviewToken: token,
      status: 'pending'
    });

    if (!pendingEntry) {
      return res.status(404).json({
        message: 'Entry not found or has already been processed'
      });
    }

    console.log('✅ Approving CBC entry:', editedData.grade, editedData.learningArea);

    
    const cbcEntry = new CBCEntry({
      grade: editedData.grade,
      learningArea: editedData.learningArea,
      strand: editedData.strand,
      substrand: editedData.substrand,
      ageRange: editedData.ageRange,
      lessonDuration: editedData.lessonDuration,
      lessonsPerWeek: editedData.lessonsPerWeek,
      noOfLessons: editedData.noOfLessons,
      slo: editedData.slo?.filter(item => item.trim() !== '') || [],
      learningExperiences: editedData.learningExperiences?.filter(item => item.trim() !== '') || [],
      keyInquiryQuestions: editedData.keyInquiryQuestions?.filter(item => item.trim() !== '') || [],
      resources: editedData.resources?.filter(item => item.trim() !== '') || [],
      coreCompetencies: editedData.coreCompetencies?.filter(item => item.trim() !== '') || [],
      values: editedData.values?.filter(item => item.trim() !== '') || [],
      pertinentIssues: editedData.pertinentIssues?.filter(item => item.trim() !== '') || [],
      linkToOtherSubjects: editedData.linkToOtherSubjects?.filter(item => item.trim() !== '') || [],
      communityLinkActivities: editedData.communityLinkActivities?.filter(item => item.trim() !== '') || [],
      assessment: editedData.assessment?.filter(item => item.skill.trim() !== '') || []
    });

    await cbcEntry.save();

    
    pendingEntry.status = 'approved';
    await pendingEntry.save();

    console.log('✅ CBC entry saved to database:', cbcEntry._id);

    
    

    res.json({
      success: true,
      message: 'CBC entry approved and saved',
      entry: cbcEntry
    });

  } catch (error) {
    console.error('Error approving entry:', error);
    res.status(500).json({
      message: 'Error approving entry',
      error: error.message
    });
  }
});


router.post('/:token/reject', async (req, res) => {
  try {
    const { token } = req.params;

    const pendingEntry = await PendingCbcEntry.findOne({
      reviewToken: token,
      status: 'pending'
    });

    if (!pendingEntry) {
      return res.status(404).json({
        message: 'Entry not found or has already been processed'
      });
    }

    pendingEntry.status = 'rejected';
    await pendingEntry.save();

    console.log('❌ CBC entry rejected');

    res.json({
      success: true,
      message: 'Entry rejected'
    });

  } catch (error) {
    console.error('Error rejecting entry:', error);
    res.status(500).json({
      message: 'Error rejecting entry',
      error: error.message
    });
  }
});


router.get('/pending/all', async (req, res) => {
  try {
    const pendingEntries = await PendingCbcEntry.find({
      status: 'pending'
    }).sort({ createdAt: -1 });

    res.json({
      count: pendingEntries.length,
      entries: pendingEntries
    });

  } catch (error) {
    console.error('Error fetching pending entries:', error);
    res.status(500).json({
      message: 'Error fetching pending entries',
      error: error.message
    });
  }
});


router.post('/bulk/approve', async (req, res) => {
  try {
    const { tokens } = req.body;

    if (!Array.isArray(tokens) || tokens.length === 0) {
      return res.status(400).json({
        message: 'Invalid tokens array'
      });
    }

    const results = [];
    const errors = [];

    for (const token of tokens) {
      try {
        const pendingEntry = await PendingCbcEntry.findOne({
          reviewToken: token,
          status: 'pending'
        });

        if (!pendingEntry) {
          errors.push({ token, error: 'Entry not found' });
          continue;
        }

        const cbcEntry = new CBCEntry(pendingEntry.extractedData);
        await cbcEntry.save();

        pendingEntry.status = 'approved';
        await pendingEntry.save();

        results.push({
          token,
          entryId: cbcEntry._id,
          success: true
        });

      } catch (err) {
        errors.push({ token, error: err.message });
      }
    }

    res.json({
      success: true,
      approved: results.length,
      failed: errors.length,
      results,
      errors
    });

  } catch (error) {
    console.error('Error in bulk approve:', error);
    res.status(500).json({
      message: 'Error in bulk approval',
      error: error.message
    });
  }
});

module.exports = router;