const LearningArea = require('../models/learningArea');

// Create a learning area
exports.createLearningArea = async (req, res) => {
  try {
    const { name, grade } = req.body;
    const newLearningArea = new LearningArea({ name, grade });
    await newLearningArea.save();
    res.status(201).json(newLearningArea);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get learning areas by grade
exports.getLearningAreasByGrade = async (req, res) => {
  try {
    const { grade } = req.params;
    const areas = await LearningArea.find({ grade });
    res.json(areas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
