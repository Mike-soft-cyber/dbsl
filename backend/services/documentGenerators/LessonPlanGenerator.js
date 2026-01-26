const BaseDocumentGenerator = require('./BaseDocumentGenerator');

class LessonPlanGenerator extends BaseDocumentGenerator {
  constructor() {
    super('Lesson Plan');
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
    const { 
      school, teacherName, grade, learningArea, strand, substrand, term, 
      date, time, specificConcept, lessonNumber, weekNumber 
    } = requestData;

    // Clean strand and substrand
    const cleanStrand = this.cleanCurriculumNumber(strand);
    const cleanSubstrand = this.cleanCurriculumNumber(substrand);

    // Get CBC data
    const sloList = cbcEntry?.slo || [];
    const learningExperiences = cbcEntry?.learningExperiences || [];
    const keyInquiryQuestions = cbcEntry?.keyInquiryQuestions || [];
    const resources = cbcEntry?.resources || [];
    const coreCompetencies = cbcEntry?.coreCompetencies || [];
    const values = cbcEntry?.values || [];
    
    // Format SLOs
    let formattedSLOs = 'Not specified';
    if (sloList.length > 0) {
      formattedSLOs = sloList.map((slo, i) => `${i+1}. ${slo}`).join('\n');
    }

    // Format experiences
    let formattedExperiences = 'Not specified';
    if (learningExperiences.length > 0) {
      formattedExperiences = learningExperiences.map((exp, i) => `${i+1}. ${exp}`).join('\n');
    }

    // Format questions
    let formattedQuestions = 'Not specified';
    if (keyInquiryQuestions.length > 0) {
      formattedQuestions = keyInquiryQuestions.map((q, i) => `${i+1}. ${q}`).join('\n');
    }

    // Format resources
    let formattedResources = 'Not specified';
    if (resources.length > 0) {
      formattedResources = resources.join(', ');
    }

    return `Generate a comprehensive Lesson Plan for Kenyan Competency Based Curriculum (CBC).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 DOCUMENT INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SCHOOL: ${school}
FACILITATOR: ${teacherName}
GRADE: ${grade}
SUBJECT: ${learningArea}
TERM: ${term}
LESSON NUMBER: ${lessonNumber || 'X'} of ${cbcEntry?.noOfLessons || 'X'} total lessons
DATE: ${date || 'Thursday 29th January 2025'}
TIME: ${time || '7:30 am – 8:10 am'}
STRAND: ${cleanStrand}
SUB-STRAND: ${cleanSubstrand}

🔒 CRITICAL: Use strand and substrand WITHOUT curriculum numbers (no "1.0:", "1.1:", etc.)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 SPECIFIC LEARNING CONCEPT FOR THIS LESSON
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${specificConcept || 'General concept related to the sub-strand'}

This lesson focuses ONLY on this specific concept from "${cleanSubstrand}".

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 CBC CURRICULUM DATA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SPECIFIC LEARNING OUTCOMES (SLO):
${formattedSLOs}

LEARNING EXPERIENCES:
${formattedExperiences}

KEY INQUIRY QUESTIONS:
${formattedQuestions}

LEARNING RESOURCES:
${formattedResources}

CORE COMPETENCIES:
${coreCompetencies.length > 0 ? coreCompetencies.join(', ') : 'Communication and Collaboration, Critical Thinking and Problem Solving, Creativity and Innovation'}

VALUES:
${values.length > 0 ? values.join(', ') : 'Love, Responsibility, Respect, Unity, Peace'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 LESSON PLAN STRUCTURE REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generate a COMPLETE lesson plan with these sections:

1. LESSON TITLE: Create an engaging title for this lesson

2. LESSON DURATION: 40 minutes (specify time allocation for each section)

3. SPECIFIC LEARNING OUTCOMES (SLO):
   By the end of the lesson, the learner should be able to:
   - Outcome 1 (from CBC data above, specific to "${specificConcept}")
   - Outcome 2 (from CBC data above, specific to "${specificConcept}")

4. KEY INQUIRY QUESTION:
   Use one of the questions from above that relates to "${specificConcept}"

5. LEARNING RESOURCES:
   List specific resources needed for teaching "${specificConcept}"

6. ORGANIZATION OF LEARNING:
   How learners will be organized (pairs, groups, individual)

7. INTRODUCTION (5-7 minutes):
   - How you will introduce "${specificConcept}"
   - Link to previous knowledge
   - Capture learner interest

8. LESSON DEVELOPMENT (25-30 minutes):
   STEP 1: [Activity 1 with time allocation]
     • Teacher Activity:
     • Learner Activity:
   
   STEP 2: [Activity 2 with time allocation]
     • Teacher Activity:
     • Learner Activity:
   
   STEP 3: [Activity 3 with time allocation]
     • Teacher Activity:
     • Learner Activity:

   All activities must focus on "${specificConcept}" only.

9. EXTENDED ACTIVITIES (5 minutes):
   - Additional practice for "${specificConcept}"
   - Homework assignment
   - Further exploration

10. CONCLUSION (5 minutes):
    - Summary of key points about "${specificConcept}"
    - Assessment of learning
    - Preview of next lesson

11. ASSESSMENT:
    - Methods used during the lesson
    - Criteria for success in understanding "${specificConcept}"

12. TEACHER'S REFLECTION:
    - Questions to reflect on after the lesson
    - Notes for improvement

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ QUALITY REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Use CLEAR, professional language suitable for ${grade} level
• Include TIME ALLOCATIONS for each section (total 40 minutes)
• Make activities PRACTICAL and engaging
• Use Kenyan context and examples
• Include differentiation strategies for diverse learners
• Align activities directly with SLOs
• Ensure assessment matches learning outcomes
• Make it immediately usable by teachers
• Focus ONLY on the specific concept: "${specificConcept}"
• Use strand as "${cleanStrand}" (no curriculum numbers)
• Use substrand as "${cleanSubstrand}" (no curriculum numbers)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 START GENERATING NOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generate a complete, ready-to-use lesson plan following the structure above.`;
  }
}

module.exports = LessonPlanGenerator;