const mongoose = require("mongoose");

const assessmentSchema = new mongoose.Schema({
  skill: { type: String, required: true },
  exceeds: { type: String, default: "" },
  meets: { type: String, default: "" },
  approaches: { type: String, default: "" },
  below: { type: String, default: "" },
});

const cbcEntrySchema = new mongoose.Schema(
  {
    grade: { type: String, required: true },
    learningArea: { type: String, required: true },
    strand: { type: String, required: true },
    substrand: { type: String, required: true },

    
    ageRange: { type: String },
    lessonDuration: { type: Number },
    lessonsPerWeek: { type: Number },
    
    slo: [{ type: String }], 
    learningExperiences: [{ type: String }], 
    keyInquiryQuestions: [{ type: String }], 
    resources: [{ type: String }],
    assessment: [assessmentSchema],
    reflection: [{ type: String }],
    noOfLessons: { 
      type: Number, 
      default: null,
      set: v => (v === "" || v === null ? null : v) 
    },

    
    coreCompetencies: [{ type: String }],
    values: [{ type: String }],
    pertinentIssues: [{ type: String }],
    linkToOtherSubjects: [{ type: String }],
    communityLinkActivities: [{ type: String }],
    learningOutcomesSummary: { type: String },
  },
  { timestamps: true }
);


cbcEntrySchema.index({ grade: 1, learningArea: 1, strand: 1, substrand: 1 });
cbcEntrySchema.index({ grade: 1, learningArea: 1 });
cbcEntrySchema.index({ learningArea: 1 });

module.exports = mongoose.model("CBCEntry", cbcEntrySchema);