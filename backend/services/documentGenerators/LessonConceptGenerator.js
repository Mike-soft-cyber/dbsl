const BaseDocumentGenerator = require('./BaseDocumentGenerator');

class LessonConceptGenerator extends BaseDocumentGenerator {
  constructor() {
    super('Lesson Concept Breakdown');
  }

  createPrompt(requestData, cbcEntry) {
    const { school, teacherName, grade, learningArea, strand, substrand, term, weeks, lessonsPerWeek } = requestData;
    
    const safeWeeks = weeks || 12;
    const safeLessonsPerWeek = lessonsPerWeek || 5;
    
    // Use CBC noOfLessons if available, otherwise calculate from weeks
    const cbcLessons = cbcEntry?.noOfLessons;
    const totalConcepts = cbcLessons && cbcLessons > 0 ? cbcLessons : (safeWeeks * safeLessonsPerWeek);
    
    // Extract CBC data with dynamic fallbacks
    const sloList = cbcEntry?.slo || [];
    const learningExperiences = cbcEntry?.learningExperiences || [];
    const keyInquiryQuestions = cbcEntry?.keyInquiryQuestions || [];
    const resources = cbcEntry?.resources || [];
    const assessmentCriteria = cbcEntry?.assessment || [];
    const reflectionNotes = cbcEntry?.reflection || [];
    const noOfLessons = cbcLessons || totalConcepts;

    const hasResources = resources && resources.length > 0;
    const hasReflections = reflectionNotes && reflectionNotes.length > 0;

    return `Generate a Lesson Concept Breakdown with a properly formatted markdown table.

SCHOOL: ${this.escapeForPrompt(school)}
FACILITATOR: ${this.escapeForPrompt(teacherName)}
GRADE: ${this.escapeForPrompt(grade)}
SUBJECT: ${this.escapeForPrompt(learningArea)}
TERM: ${this.escapeForPrompt(term)}
WEEKS: ${safeWeeks}
LESSONS PER WEEK: ${safeLessonsPerWeek}
TOTAL LESSONS: ${totalConcepts}
CBC LESSONS REFERENCE: ${noOfLessons}

## CBC FRAMEWORK ALIGNMENT:
### SPECIFIC LEARNING OUTCOMES (SLOs):
${sloList.map((slo, i) => `${i+1}. ${slo}`).join('\n')}

### LEARNING EXPERIENCES TO INTEGRATE:
${learningExperiences.map((exp, i) => `${i+1}. ${exp}`).join('\n')}

### KEY INQUIRY QUESTIONS FOR REFERENCE:
${keyInquiryQuestions.map((q, i) => `${i+1}. ${q}`).join('\n')}

### ASSESSMENT SKILLS TO DEVELOP:
${assessmentCriteria.map((criteria, i) => `${i+1}. ${criteria.skill}`).join('\n')}

${hasResources ? `### AVAILABLE RESOURCES:
${resources.map((resource, i) => `${i+1}. ${resource}`).join('\n')}` : `### GENERATE APPROPRIATE RESOURCES:
Create 5 specific teaching resources for ${this.escapeForPrompt(substrand)} appropriate for ${this.escapeForPrompt(grade)} level in ${this.escapeForPrompt(learningArea)}.`}

${hasReflections ? `### REFLECTION FRAMEWORK:
${reflectionNotes.map((note, i) => `${i+1}. ${note}`).join('\n')}` : `### GENERATE REFLECTION FRAMEWORK:
Create 4 specific reflection points for evaluating ${this.escapeForPrompt(substrand)} lesson effectiveness and student understanding.`}

CRITICAL TABLE FORMATTING INSTRUCTIONS:
You MUST create a markdown table with this EXACT format. Each row must be a SINGLE LINE with all columns separated by pipes (|).

CORRECT FORMAT EXAMPLE:
| Term | Week | Strand | Sub-strand | Learning Concept |
|------|------|--------|------------|------------------|
| Term 3 | Week 1 | Mathematics | Addition | Understand the concept of addition |
| Term 3 | Week 2 | Mathematics | Addition | Practice addition with single digits |

WRONG FORMAT (DO NOT DO THIS):
| Term |
| Week | Strand |
|------|
| Term 3 |
| Week 1 | Mathematics |

Create exactly ${totalConcepts} rows (${safeWeeks} weeks × ${safeLessonsPerWeek} lessons per week).

TABLE STRUCTURE:
- Column 1: Term (always "${term}")
- Column 2: Week (Week 1, Week 2, ... Week ${safeWeeks})
- Column 3: Strand (always "${this.escapeForPrompt(strand)}")
- Column 4: Sub-strand (always "${this.escapeForPrompt(substrand)}")
- Column 5: Learning Concept (specific concept based on SLOs)

LEARNING CONCEPT REQUIREMENTS:
- Each concept must directly relate to the SLOs: ${sloList.join('; ')}
- Incorporate learning experiences as contexts: ${learningExperiences.join('; ')}
- Address key inquiry questions through concepts: ${keyInquiryQuestions.join('; ')}
- Build assessment skills progressively: ${assessmentCriteria.map(c => c.skill).join('; ')}
- Progress from basic to advanced understanding over the ${safeWeeks} weeks
- Make concepts appropriate for ${this.escapeForPrompt(grade)} level
- Each learning concept should be unique and specific
- Concepts should be 8-15 words long for readability

IMPORTANT: 
- Output ONLY the table with proper markdown formatting
- Each complete row must be on ONE SINGLE LINE
- Do NOT split cells across multiple lines
- Do NOT add extra line breaks between cells
- Use the pipe character (|) to separate columns
- Ensure all rows have exactly 5 columns

Begin with the table header, then the separator row, then all ${totalConcepts} data rows.`;
  }
}

module.exports = LessonConceptGenerator;