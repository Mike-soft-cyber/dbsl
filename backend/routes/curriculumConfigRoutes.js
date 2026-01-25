const express = require('express');
const router = express.Router();
const LevelConfig = require('../models/LevelConfig');
const SubjectConfig = require('../models/SubjectConfig');


router.get('/levels', async (req, res) => {
  try {
    const levels = await LevelConfig.find().sort({ level: 1 });
    res.json(levels);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching levels', error: error.message });
  }
});


router.get('/level/:grade', async (req, res) => {
  try {
    const level = await LevelConfig.findOne({ grades: req.params.grade });
    if (!level) {
      return res.status(404).json({ message: 'Level not found for this grade' });
    }
    res.json(level);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching level', error: error.message });
  }
});


router.get('/subjects/:grade', async (req, res) => {
  try {
    const subjects = await SubjectConfig.find({ grades: req.params.grade });
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subjects', error: error.message });
  }
});


router.get('/subject-config/:grade/:subject', async (req, res) => {
  try {
    const config = await SubjectConfig.findOne({
      grades: req.params.grade,
      subject: req.params.subject
    });
    
    if (!config) {
      return res.status(404).json({ message: 'Subject configuration not found' });
    }
    
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subject config', error: error.message });
  }
});


router.get('/term-weeks/:term', async (req, res) => {
  try {
    const termNumber = req.params.term.toLowerCase().replace('term ', '').replace('term', '');
    const weekMap = {
      '1': 10,
      '2': 11,
      '3': 6
    };
    
    const weeks = weekMap[termNumber] || 10;
    res.json({ term: req.params.term, weeks });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching term weeks', error: error.message });
  }
});

module.exports = router;