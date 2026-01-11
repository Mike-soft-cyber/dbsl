const CBCEntry = require('../models/CbcEntry');

// Create a new CBC entry
exports.createCbcEntry = async (req, res) => {
  try {
    const { 
      grade, learningArea, strand, substrand, 
      slo, learningExperiences, keyInquiryQuestions, 
      resources, assessment, reflection, noOfLessons,
      // ✅ MAKE SURE THESE ARE HERE:
      ageRange, lessonDuration, lessonsPerWeek,
      coreCompetencies, values, pertinentIssues, 
      linkToOtherSubjects, communityLinkActivities,
      learningOutcomesSummary
    } = req.body;
    
    console.log('📥 Creating CBC Entry with data:', {
      grade, learningArea, strand, substrand,
      ageRange, lessonDuration, lessonsPerWeek,
      coreCompetencies, values, pertinentIssues
    });
    
    // Process arrays
    const processedCoreCompetencies = Array.isArray(coreCompetencies) ? coreCompetencies : [];
    const processedValues = Array.isArray(values) ? values : [];
    const processedPertinentIssues = Array.isArray(pertinentIssues) ? pertinentIssues : [];
    const processedLinkToOtherSubjects = Array.isArray(linkToOtherSubjects) ? linkToOtherSubjects : [];
    const processedCommunityLinkActivities = Array.isArray(communityLinkActivities) ? communityLinkActivities : [];

    const entry = new CBCEntry({ 
      grade, 
      learningArea, 
      strand, 
      substrand, 
      slo, 
      learningExperiences, 
      keyInquiryQuestions, 
      resources, 
      assessment, 
      reflection, 
      noOfLessons,
      // ✅ CRITICAL: These must be here
      ageRange: ageRange || undefined,
      lessonDuration: lessonDuration ? parseInt(lessonDuration) : undefined,
      lessonsPerWeek: lessonsPerWeek ? parseInt(lessonsPerWeek) : undefined,
      coreCompetencies: processedCoreCompetencies,
      values: processedValues,
      pertinentIssues: processedPertinentIssues,
      linkToOtherSubjects: processedLinkToOtherSubjects,
      communityLinkActivities: processedCommunityLinkActivities,
      learningOutcomesSummary: learningOutcomesSummary || undefined
    });
    
    await entry.save();
    console.log('✅ CBC Entry created successfully:', entry._id);
    console.log('✅ Saved data:', entry); // ADD THIS LINE TO SEE WHAT'S SAVED
    res.status(201).json(entry);
  } catch (error) {
    console.error("❌ Error creating CBC entry:", error);
    res.status(500).json({ message: 'Error creating entry', error: error.message });
  }
};

// Update a CBC entry
exports.updateCbcEntry = async (req, res) => {
  try {
    const {
      grade, learningArea, strand, substrand, noOfLessons,
      slo, learningExperiences, keyInquiryQuestions,
      resources, reflection, assessment,
      ageRange, lessonDuration, lessonsPerWeek,
      coreCompetencies, values, pertinentIssues,
      linkToOtherSubjects, communityLinkActivities,
      learningOutcomesSummary
    } = req.body;

    console.log('📝 Updating CBC Entry:', req.params.id);
    console.log('📥 Update data received:', {
      ageRange, lessonDuration, lessonsPerWeek,
      coreCompetencies, values, pertinentIssues
    });

    // 🛠️ Build update object
    const updateData = {
      grade,
      learningArea,
      strand,
      substrand,
      slo,
      learningExperiences,
      keyInquiryQuestions,
      resources,
      reflection,
      assessment,
    };

    // Handle noOfLessons (can be null)
    if (noOfLessons === "" || noOfLessons === null) {
      updateData.noOfLessons = null;
    } else if (noOfLessons !== undefined) {
      updateData.noOfLessons = noOfLessons;
    }

    // ✅ Add curriculum config fields
    if (ageRange !== undefined) updateData.ageRange = ageRange;
    
    if (lessonDuration === "" || lessonDuration === null) {
      updateData.lessonDuration = null;
    } else if (lessonDuration !== undefined) {
      updateData.lessonDuration = parseInt(lessonDuration);
    }
    
    if (lessonsPerWeek === "" || lessonsPerWeek === null) {
      updateData.lessonsPerWeek = null;
    } else if (lessonsPerWeek !== undefined) {
      updateData.lessonsPerWeek = parseInt(lessonsPerWeek);
    }

    // ✅ Add KICD fields (arrays)
    if (coreCompetencies !== undefined) updateData.coreCompetencies = coreCompetencies;
    if (values !== undefined) updateData.values = values;
    if (pertinentIssues !== undefined) updateData.pertinentIssues = pertinentIssues;
    if (linkToOtherSubjects !== undefined) updateData.linkToOtherSubjects = linkToOtherSubjects;
    if (communityLinkActivities !== undefined) updateData.communityLinkActivities = communityLinkActivities;
    if (learningOutcomesSummary !== undefined) updateData.learningOutcomesSummary = learningOutcomesSummary;

    console.log('📤 Final update data:', updateData);

    const updated = await CBCEntry.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updated) {
      console.error('❌ Entry not found:', req.params.id);
      return res.status(404).json({ message: "Entry not found" });
    }

    console.log('✅ CBC Entry updated successfully');
    res.json(updated);
  } catch (error) {
    console.error("❌ Error updating CBC Entry:", error);
    res.status(500).json({ 
      message: "Error updating entry", 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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