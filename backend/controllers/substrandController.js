const Substrand = require('../models/SubStrand');

// Fetch substrands by strand
exports.getSubstrandsByStrand = async (req, res) => {
  try {
    const { strandId } = req.params;
    const substrands = await Substrand.find({ strand: strandId }).populate('strand');
    res.json(substrands);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
