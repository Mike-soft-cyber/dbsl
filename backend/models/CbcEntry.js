const mongoose = require("mongoose");

const assessmentSchema = new mongoose.Schema({
  skill: { type: String, required: true }, // keep skill required
  exceeds: { type: String, default: "" },
  meets: { type: String, default: "" },
  approaches: { type: String, default: "" },
  below: { type: String, default: "" }, // ✅ no longer required
});


const cbcEntrySchema = new mongoose.Schema(
  {
    grade: { type: String, required: true },             // e.g. "Grade 7"
    learningArea: { type: String, required: true },      // e.g. "Mathematics"
    strand: { type: String, required: true },            // e.g. "Geometry"
    substrand: { type: String, required: true },         // e.g. "Angles"

    slo: [{ type: String }],                             // Specific Learning Outcomes
    learningExperiences: [{ type: String }],             // Activities / approaches
    keyInquiryQuestions: [{ type: String }],             // Guiding questions
    resources: [{ type: String }],                       // Teaching aids
    assessment: [assessmentSchema],                      // Rubrics
    reflection: [{ type: String }],                      // Notes for improvement
    noOfLessons: { type: Number, default: null,
    set: v => (v === "" || v === null ? null : v) },                      //  Number of lessons 
  },
  { timestamps: true }
);

// Critical indexes for CBC lookups
cbcEntrySchema.index({ grade: 1, learningArea: 1, strand: 1, substrand: 1 }); // Primary lookup
cbcEntrySchema.index({ grade: 1, learningArea: 1 }); // Fallback lookup
cbcEntrySchema.index({ learningArea: 1 }); // Subject filtering


module.exports = mongoose.model("CBCEntry", cbcEntrySchema);
