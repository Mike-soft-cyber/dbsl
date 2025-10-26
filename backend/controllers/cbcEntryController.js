const CBCEntry = require('../models/CbcEntry');

// Create a new CBC entry
exports.createCbcEntry = async (req, res) => {
  try {
    const { grade, learningArea, strand, substrand, slo, learningExperiences, keyInquiryQuestions, resources, assessment, reflection, noOfLessons } = req.body;
    const entry = new CBCEntry({ grade, learningArea, strand, substrand, slo, learningExperiences, keyInquiryQuestions, resources, assessment, reflection, noOfLessons });
    console.log("Received:", req.body);
    await entry.save();
    res.status(201).json(entry);
  } catch (error) {
    console.error("❌ Backend error while saving CBC entry:", error);
    res.status(500).json({ message: 'Error creating entry', error });
  }
};

// Get all CBC entries (with optional filtering)
exports.getAllCbcEntries = async (req, res) => {
  try {
    const { grade, learningArea } = req.query;
    const filter = {};
    if (grade) filter.grade = grade;
    if (learningArea) filter.learningArea = learningArea;

    const entries = await CBCEntry.find(filter);
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching entries', error });
  }
};

exports.getGrades = async (req, res) => {
  try {
    const grades = await CBCEntry.distinct('grade');
    res.json(grades);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getLearningAreasByGrade = async (req, res) => {
  try {
    const { grade } = req.params;
    const learningAreas = await CBCEntry.find({ grade }).distinct('learningArea');
    res.json(learningAreas);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getStrandsByLearningArea = async (req, res) => {
  try {
    const { grade, learningArea } = req.params;
    const strands = await CBCEntry.find({ grade, learningArea }).distinct('strand');
    res.json(strands);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getSubstrandsByStrand = async (req, res) => {
  try {
    const { grade, strand } = req.params;
    const substrands = await CBCEntry.find({ grade, strand }).distinct('substrand');
    res.json(substrands);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};


// Update a CBC entry
exports.updateCbcEntry = async (req, res) => {
  try {
    let {
      grade, learningArea, strand, substrand, noOfLessons,
      slo, learningExperiences, keyInquiryQuestions,
      resources, reflection, assessment
    } = req.body;

    // 🛠️ Sanitize noOfLessons
    if (noOfLessons === "" || noOfLessons === null) {
      noOfLessons = undefined; // prevents CastError
    }

    const updated = await CBCEntry.findByIdAndUpdate(
      req.params.id,
      {
        grade,
        learningArea,
        strand,
        substrand,
        noOfLessons,
        slo,
        learningExperiences,
        keyInquiryQuestions,
        resources,
        reflection,
        assessment,
      },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ message: "Entry not found" });
    res.json(updated);
  } catch (error) {
    console.error("❌ Error updating CBC Entry:", error); // <— log real reason
    res.status(500).json({ message: "Error updating entry", error: error.message });
  }
};

// Delete a CBC entry
exports.deleteCbcEntry = async (req, res) => {
  try {
    const deleted = await CBCEntry.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Entry not found' });
    res.json({ message: 'Entry deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting entry', error });
  }
};

// Get a single CBC entry by ID
exports.getCbcEntryById = async (req, res) => {
  try {
    const entry = await CBCEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: "CBC entry not found" });
    }
    res.json(entry);
  } catch (err) {
    res.status(500).json({ message: "Error fetching CBC entry", error: err });
  }
};
