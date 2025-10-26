const BaseDocumentGenerator = require('./BaseDocumentGenerator');

class SchemesGenerator extends BaseDocumentGenerator {
  constructor() {
    super('Schemes of Work');
  }

  createPrompt(requestData, cbcEntry) {
    const { school, teacherName, grade, learningArea, strand, substrand, term, weeks, lessonsPerWeek } = requestData;
    
    const safeWeeks = weeks || 12;
    const safeLessonsPerWeek = lessonsPerWeek || 5;
    
    // Use CBC noOfLessons if available, otherwise calculate from weeks (same as LessonConceptGenerator)
    const cbcLessons = cbcEntry?.noOfLessons;
    const totalRows = cbcLessons && cbcLessons > 0 ? cbcLessons : (safeWeeks * safeLessonsPerWeek);
    
    // Extract CBC data
    const sloList = cbcEntry?.slo || [];
    const learningExperiences = cbcEntry?.learningExperiences || [];
    const keyInquiryQuestions = cbcEntry?.keyInquiryQuestions || [];
    const resources = cbcEntry?.resources || [];
    const assessmentData = cbcEntry?.assessment || [];
    const reflectionNotes = cbcEntry?.reflection || [];
    const noOfLessons = cbcLessons || totalRows;

    const hasResources = resources && resources.length > 0;
    const hasReflections = reflectionNotes && reflectionNotes.length > 0;

    return `Generate a Schemes of Work with a properly formatted markdown table.

SCHOOL: ${this.escapeForPrompt(school)}
FACILITATOR: ${this.escapeForPrompt(teacherName)}
GRADE: ${this.escapeForPrompt(grade)}
SUBJECT: ${this.escapeForPrompt(learningArea)}
TERM: ${this.escapeForPrompt(term)}
WEEKS: ${safeWeeks}
LESSONS PER WEEK: ${safeLessonsPerWeek}
TOTAL LESSONS: ${totalRows}
CBC LESSONS REFERENCE: ${noOfLessons}

## CBC FRAMEWORK DATA REFERENCE:

### SPECIFIC LEARNING OUTCOMES (SLOs):
${sloList.map((slo, i) => `${i+1}. ${slo}`).join('\n')}

### LEARNING EXPERIENCES AVAILABLE:
${learningExperiences.map((exp, i) => `${i+1}. ${exp}`).join('\n')}

### KEY INQUIRY QUESTIONS BANK:
${keyInquiryQuestions.map((q, i) => `${i+1}. ${q}`).join('\n')}

### ASSESSMENT SKILLS TO TRACK:
${assessmentData.map((criteria, i) => `${i+1}. ${criteria.skill}`).join('\n')}

${hasResources ? `### AVAILABLE RESOURCES:
${resources.map((resource, i) => `${i+1}. ${resource}`).join('\n')}` : `### GENERATE RESOURCE BANK:
Create 8 diverse teaching resources for ${this.escapeForPrompt(substrand)} in ${this.escapeForPrompt(learningArea)}.`}

${hasReflections ? `### REFLECTION FRAMEWORK:
${reflectionNotes.map((note, i) => `${i+1}. ${note}`).join('\n')}` : `### GENERATE REFLECTION FRAMEWORK:
Create 5 reflection criteria for evaluating teaching effectiveness.`}

CRITICAL TABLE FORMATTING INSTRUCTIONS:
You MUST create a markdown table where EACH COMPLETE ROW is on ONE SINGLE LINE.

CORRECT FORMAT EXAMPLE:
| Week | Lesson | Strand | Sub-strand | SLO | Learning Experiences | KIQ | Resources | Assessment | Reflection |
|------|--------|--------|------------|-----|---------------------|-----|-----------|------------|-----------|
| Week 1 | 1 | Mathematics | Addition | By the end of the lesson learners should be able to add single digit numbers | Learners will practice addition using counters and number lines | How do we combine numbers? | Counters, number cards | Observation, oral questions | Were learners engaged? |
| Week 1 | 2 | Mathematics | Addition | By the end of the lesson learners should be able to solve addition word problems | Learners will work in pairs to solve real-world addition scenarios | When do we use addition in daily life? | Word problem cards, charts | Written work, peer assessment | Did learners understand application? |

WRONG FORMAT (DO NOT DO THIS - cells split across lines):
| Week |
| Lesson | Strand |
|------|
| Week 1 |
| 1 | Mathematics |

TABLE STRUCTURE (10 columns - ALL on ONE LINE per row):
1. WEEK: Week 1, Week 2, ... Week ${safeWeeks}
2. LESSON: Lesson number (1-${safeLessonsPerWeek} per week)
3. STRAND: Always "${this.escapeForPrompt(strand)}"
4. SUB-STRAND: Always "${this.escapeForPrompt(substrand)}"
5. SPECIFIC LEARNING OUTCOMES (SLO): Rotate through the ${sloList.length} SLOs
6. LEARNING EXPERIENCES: Rotate through the ${learningExperiences.length} experiences
7. KEY INQUIRY QUESTION (KIQ): Rotate through the ${keyInquiryQuestions.length} questions
8. LEARNING RESOURCES: Use actual resources: ${resources.join(', ') || 'textbooks, charts, models'}
9. ASSESSMENT: Vary methods (observation, oral, practical, written, portfolio)
10. REFLECTION: Short reflection point (5-10 words)

SLO BANK TO ROTATE:
${sloList.map((slo, i) => `SLO${i+1}: ${slo}`).join('\n')}

LEARNING EXPERIENCES BANK:
${learningExperiences.map((exp, i) => `EXP${i+1}: ${exp}`).join('\n')}

KEY INQUIRY QUESTIONS BANK:
${keyInquiryQuestions.map((q, i) => `KIQ${i+1}: ${q}`).join('\n')}

ASSESSMENT SKILLS TO REFERENCE:
${assessmentData.map(a => a.skill).join(', ')}

Create exactly ${totalRows} complete rows based on CBC reference of ${noOfLessons} lessons.

CRITICAL RULES:
1. Each row must be ONE CONTINUOUS LINE with all 10 columns
2. Use pipe (|) to separate columns: | col1 | col2 | col3 |
3. Keep cells concise (20-50 words for SLO, 10-30 words for others)
4. NO line breaks within cells
5. NO splitting rows across multiple lines
6. Start each row with | and end with |

Output ONLY the table in this format:
| Week | Lesson | Strand | Sub-strand | SPECIFIC LEARNING OUTCOMES (SLO) | LEARNING EXPERIENCES | KEY INQUIRY QUESTION (KIQ) | LEARNING RESOURCES | ASSESSMENT | REFLECTION |
|------|--------|--------|------------|-----------------------------------|---------------------|----------------------------|-------------------|------------|------------|
[${totalRows} complete data rows, each on ONE LINE]`;
  }
}

module.exports = SchemesGenerator;