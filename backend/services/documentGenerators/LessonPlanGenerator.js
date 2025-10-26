const BaseDocumentGenerator = require('./BaseDocumentGenerator');

class LessonPlanGenerator extends BaseDocumentGenerator {
  constructor() {
    super('Lesson Plan');
  }

  createPrompt(requestData, cbcEntry) {
    const { school, teacherName, grade, learningArea, strand, substrand, term, weeks, date, time } = requestData;
    
    const safeWeeks = weeks || 12;
    
    // Extract CBC data
    const sloList = cbcEntry?.slo || [];
    const learningExperiences = cbcEntry?.learningExperiences || [];
    const keyInquiryQuestions = cbcEntry?.keyInquiryQuestions || [];
    const resources = cbcEntry?.resources || [];
    const assessmentData = cbcEntry?.assessment || [];
    const reflectionNotes = cbcEntry?.reflection || [];
    const noOfLessons = cbcEntry?.noOfLessons || 'Not specified';

    const hasResources = resources && resources.length > 0;
    const hasReflections = reflectionNotes && reflectionNotes.length > 0;

    return `Generate a Lesson Plan fully aligned with CBC framework data:

SCHOOL: ${this.escapeForPrompt(school)}
FACILITATOR: ${this.escapeForPrompt(teacherName)}
GRADE: ${this.escapeForPrompt(grade)}
SUBJECT: ${this.escapeForPrompt(learningArea)}
TERM: ${this.escapeForPrompt(term)}
WEEKS: ${safeWeeks}
DATE: ${date || 'Thursday 29th January 2025'}
TIME: ${time || '7:30 am – 8:10 am'}
LESSON: [X] of ${noOfLessons} total lessons

STRAND: ${this.escapeForPrompt(strand)}
SUB-STRAND: ${this.escapeForPrompt(substrand)}

## CBC FRAMEWORK ALIGNMENT

SPECIFIC LEARNING OUTCOMES: By the end of the lesson, learners should be able to:
${sloList.slice(0, 4).map((slo, i) => `- ${slo}`).join('\n')}

KEY INQUIRY QUESTIONS:
${keyInquiryQuestions.slice(0, 4).map((q, i) => `${i+1}. ${q}`).join('\n')}

LEARNING EXPERIENCES TO IMPLEMENT:
${learningExperiences.slice(0, 3).map((exp, i) => `${i+1}. ${exp}`).join('\n')}

ASSESSMENT FOCUS:
${assessmentData.slice(0, 3).map((criteria, i) => `• ${criteria.skill} - ${criteria.meets || 'Performance indicator'}`).join('\n')}

${hasResources ? `LEARNING RESOURCES:
${resources.join(', ')}` : `GENERATE LEARNING RESOURCES:
Create 5 specific lesson resources for teaching ${this.escapeForPrompt(substrand)} to ${this.escapeForPrompt(grade)} students.`}

ORGANIZATION OF LEARNING:
[Organize based on learning experiences: ${learningExperiences.join('; ')}]

## LESSON STRUCTURE

INTRODUCTION: (5 minutes)
[Engaging opening that connects to: ${keyInquiryQuestions[0] || 'main inquiry question'}]

LESSON DEVELOPMENT:

STEP 1: [SLO Focus: ${sloList[0] || 'First learning outcome'}]
    Facilitator: [Implement learning experience: ${learningExperiences[0] || 'Primary activity'}]
    Learners: [Respond to inquiry: ${keyInquiryQuestions[0] || 'Key question'}]
    Assessment: [Observe ${assessmentData[0]?.skill || 'key skill'}]

STEP 2: [SLO Focus: ${sloList[1] || 'Second learning outcome'}]
    Facilitator: [Guide activity: ${learningExperiences[1] || 'Secondary activity'}]
    Learners: [Engage with: ${keyInquiryQuestions[1] || 'Inquiry question'}]
    Assessment: [Evaluate ${assessmentData[1]?.skill || 'skill development'}]

STEP 3: [SLO Focus: ${sloList[2] || 'Third learning outcome'}]
    Facilitator: [Facilitate: ${learningExperiences[2] || 'Hands-on experience'}]
    Learners: [Apply knowledge to: ${keyInquiryQuestions[2] || 'Problem-solving'}]
    Assessment: [Check ${assessmentData[2]?.skill || 'understanding'}]

STEP 4: [Integration and Synthesis]
    Facilitator: [Connect all SLOs and experiences]
    Learners: [Demonstrate understanding across inquiry questions]
    Assessment: [Holistic evaluation of all targeted skills]

EXTENDED ACTIVITIES:
• Advanced: [For learners exceeding expectations: ${assessmentData[0]?.exceeds || 'Extension activities'}]
• Support: [For learners below expectations: ${assessmentData[0]?.below || 'Remedial activities'}]

CONCLUSION: (5 minutes)
[Summarize key concepts, link to next lesson in sequence of ${noOfLessons}]

## ASSESSMENT RUBRIC
${assessmentData.map(criteria => `${criteria.skill}:
• Exceeds: ${criteria.exceeds || 'Advanced demonstration'}
• Meets: ${criteria.meets || 'Satisfactory performance'}  
• Approaches: ${criteria.approaches || 'Developing understanding'}
• Below: ${criteria.below || 'Needs support'}`).join('\n\n')}

${hasReflections ? `REFLECTION:
Framework: ${reflectionNotes.join('; ')}` : `GENERATE REFLECTION FRAMEWORK:
Create 6 specific reflection points for evaluating this ${this.escapeForPrompt(substrand)} lesson's effectiveness, including SLO achievement, student engagement, and teaching strategy success.`}

• SLO achievement: [Rate 1-4 for each outcome]
• Learning experience effectiveness: [Evaluate each activity]
• Inquiry question engagement: [Student response quality]
• Assessment accuracy: [Rubric application notes]
• Resource utilization: [Material effectiveness]
• Next lesson preparation: [Adjustments needed]

REQUIREMENTS:
- Integrate ALL CBC data: SLOs, experiences, questions, assessments
- Use specific learning experiences: ${learningExperiences.join('; ')}
- Address all inquiry questions: ${keyInquiryQuestions.join('; ')}
- Apply assessment criteria: ${assessmentData.map(a => a.skill).join('; ')}
- Make appropriate for ${this.escapeForPrompt(grade)} level`;
  }
}

module.exports = LessonPlanGenerator;