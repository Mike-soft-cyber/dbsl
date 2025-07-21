const Strand = require('../models/Strands');
const LearningArea = require('../models/learningArea')


// Fetch strands by grade and learning area
exports.getStrandsByGradeAndLearningArea = async (req, res) => {
  try {
    const { grade, learningAreaId } = req.params;
    const strands = await Strand.find({ grade, learningArea: learningAreaId }).populate('learningArea');
    res.json(strands);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
