const BaseDocumentGenerator = require('./BaseDocumentGenerator');

class ExercisesGenerator extends BaseDocumentGenerator {
  constructor() {
    super('Exercises');
  }

  // Helper to clean curriculum numbers
  cleanCurriculumNumber(text) {
    if (!text || typeof text !== 'string') return text;
    
    return text
      .replace(/^\d+(\.\d+)*\s*:\s*/g, '')
      .replace(/^\d+(\.\d+)*\s+/g, '')
      .trim();
  }

  createPrompt(requestData, cbcEntry) {
    const { school, grade, learningArea, strand, substrand, term } = requestData;
    
    // Clean strand and substrand
    const cleanStrand = this.cleanCurriculumNumber(strand);
    const cleanSubstrand = this.cleanCurriculumNumber(substrand);
    
    // Get CBC data
    const sloList = cbcEntry?.slo || [];
    const learningExperiences = cbcEntry?.learningExperiences || [];
    const keyInquiryQuestions = cbcEntry?.keyInquiryQuestions || [];
    const assessmentCriteria = cbcEntry?.assessment || [];
    const resources = cbcEntry?.resources || []; 
    const noOfLessons = cbcEntry?.noOfLessons || 'Not specified';

    // Extract assessment skills
    const assessmentSkills = assessmentCriteria.map(item => item.skill).filter(Boolean);

    return `Generate comprehensive Exercises fully aligned with CBC framework data:

SCHOOL: ${this.escapeForPrompt(school)}
GRADE: ${this.escapeForPrompt(grade)}
SUBJECT: ${this.escapeForPrompt(learningArea)}
STRAND: ${cleanStrand}
SUB-STRAND: ${cleanSubstrand}
TERM: ${this.escapeForPrompt(term)}
LESSONS COVERED: ${noOfLessons}

🔒 CRITICAL: Use strand and substrand WITHOUT curriculum numbers (no "1.0:", "1.1:", etc.)
All questions must be ONLY about "${cleanSubstrand}" within "${cleanStrand}"

# EXERCISES: ${cleanSubstrand}

## CBC FRAMEWORK ALIGNMENT:

### SPECIFIC LEARNING OUTCOMES (SLOs) TO ASSESS:
${sloList.map((slo, i) => `${i+1}. ${slo}`).join('\n')}

### KEY INQUIRY QUESTIONS REFERENCE:
${keyInquiryQuestions.map((question, i) => `${i+1}. ${question}`).join('\n')}

### LEARNING EXPERIENCES CONTEXT:
${learningExperiences.map((exp, i) => `${i+1}. ${exp}`).join('\n')}

### ASSESSMENT SKILLS TO EVALUATE:
${assessmentSkills.map((skill, i) => `${i+1}. ${skill}`).join('\n')}

## SECTION A: MULTIPLE-CHOICE QUESTIONS (20 marks)
*Choose the correct answer by writing the letter in the brackets provided*

[Create 10 multiple-choice questions (2 marks each) that:
- Test comprehension of each SLO from "${cleanSubstrand}"
- Reference learning experiences from "${cleanSubstrand}"
- Address key inquiry questions about "${cleanSubstrand}"
- Assess skills: ${assessmentSkills.join('; ')}
- Use ONLY content from "${cleanSubstrand}" - no other topics
- Include Kenyan context and examples]

## SECTION B: STRUCTURED QUESTIONS (30 marks)
*Answer all questions in this section. Show all working clearly*

[Create 3 structured questions with multiple parts that:
- Map directly to SLOs from "${cleanSubstrand}": ${sloList.map((slo, i) => `Q${i+1}: ${slo}`).join('; ')}
- Incorporate learning experiences as contexts
- Use key inquiry questions as sub-question prompts
- Test assessment skills at different levels: ${assessmentSkills.join('; ')}
- Reference available resources: ${resources.join('; ')}
- Focus ONLY on "${cleanSubstrand}" - no other sub-strands or strands
- Use Kenyan examples and contexts]

## ASSESSMENT RUBRIC ALIGNMENT:
Design questions to test learners across performance levels:
${assessmentCriteria.map(criteria => 
  `• ${criteria.skill}:
    - Exceeds Expectations: ${criteria.exceeds || 'Advanced application'}
    - Meets Expectations: ${criteria.meets || 'Satisfactory understanding'}
    - Approaches Expectations: ${criteria.approaches || 'Basic comprehension'}
    - Below Expectations: ${criteria.below || 'Requires support'}`
).join('\n')}

## INSTRUCTIONS FOR LEARNERS:
- Read all questions carefully before answering
- Show all working for structured questions
- Use appropriate units where applicable
- Manage your time effectively across all sections
- All questions are about "${cleanSubstrand}"

TOTAL MARKS: 50
Time Allowed: 1 hour 30 minutes

REQUIREMENTS:
- Base ALL questions on the complete CBC framework data provided above
- Ensure every SLO from "${cleanSubstrand}" is tested
- Incorporate learning experiences as real-world contexts from Kenya
- Use key inquiry questions to frame problem-solving scenarios  
- Test all assessment skills: ${assessmentSkills.join('; ')}
- Make questions appropriate for ${this.escapeForPrompt(grade)} level
- Test different cognitive levels (knowledge, comprehension, application, analysis)
- Include practical Kenyan contexts
- Reference available teaching resources: ${resources.join('; ')}
- Align with the assessment criteria for accurate performance evaluation
- ⚠️ CRITICAL: Focus ONLY on "${cleanSubstrand}" - do NOT include questions from other sub-strands or strands`;
  }
}

module.exports = ExercisesGenerator;