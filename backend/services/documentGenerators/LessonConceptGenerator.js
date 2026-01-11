// LessonConceptGenerator.js - FIXED to match client requirements

const BaseDocumentGenerator = require('./BaseDocumentGenerator');

class FixedLessonConceptGenerator extends BaseDocumentGenerator {
  constructor() {
    super('Lesson Concept Breakdown');
  }

  createPrompt(requestData, cbcEntry) {
    const { 
      school, teacherName, grade, learningArea, strand, substrand, term, 
      weeks, lessonsPerWeek, lessonDuration, ageRange 
    } = requestData;
    
    // ✅ CRITICAL FIX: Use weeks and lessonsPerWeek from curriculum config (not cbcEntry.noOfLessons)
    const safeWeeks = weeks || 10;
    const safeLessonsPerWeek = lessonsPerWeek || 5;
    
    // ✅ CRITICAL FIX: Calculate total rows as per client requirement (WEEKS × LESSONS_PER_WEEK)
    const totalRows = safeWeeks * safeLessonsPerWeek;
    
    const sloList = cbcEntry?.slo || [];
    
    if (!sloList || sloList.length === 0) {
      throw new Error('No Specific Learning Outcomes (SLOs) found in CBC entry.');
    }
    
    console.log(`[LessonConcept] ✅ Configuration:`, {
      weeks: safeWeeks,
      lessonsPerWeek: safeLessonsPerWeek,
      totalRows: totalRows,
      sloCount: sloList.length,
      lessonDuration,
      ageRange
    });
    
    const learningExperiences = cbcEntry?.learningExperiences || [];
    const keyInquiryQuestions = cbcEntry?.keyInquiryQuestions || [];
    const resources = cbcEntry?.resources || [];
    const assessmentCriteria = cbcEntry?.assessment || [];

    return `Generate a Lesson Concept Breakdown table with EXACTLY ${totalRows} rows.

SCHOOL: ${this.escapeForPrompt(school)}
FACILITATOR: ${this.escapeForPrompt(teacherName)}
GRADE: ${this.escapeForPrompt(grade)}
SUBJECT: ${this.escapeForPrompt(learningArea)}
TERM: ${this.escapeForPrompt(term)}
WEEKS: ${safeWeeks}
LESSONS PER WEEK: ${safeLessonsPerWeek}
TOTAL LESSONS: ${totalRows}
LESSON DURATION: ${lessonDuration} minutes
AGE RANGE: ${ageRange}

## 🎯 CRITICAL REQUIREMENT: EXACT ROW COUNT

You MUST generate EXACTLY ${totalRows} rows because:
- WEEKS = ${safeWeeks}
- LESSONS PER WEEK = ${safeLessonsPerWeek}
- TOTAL ROWS = ${safeWeeks} × ${safeLessonsPerWeek} = ${totalRows}

This is a MANDATORY requirement from the client.

## CBC FRAMEWORK ALIGNMENT:

### SPECIFIC LEARNING OUTCOMES (${sloList.length} available):
${sloList.map((slo, i) => `${i+1}. ${slo}`).join('\n')}

### LEARNING EXPERIENCES:
${learningExperiences.map((exp, i) => `${i+1}. ${exp}`).join('\n')}

### KEY INQUIRY QUESTIONS:
${keyInquiryQuestions.map((q, i) => `${i+1}. ${q}`).join('\n')}

## TABLE FORMAT:

Generate the table with this EXACT structure:

| Term | Week | Strand | Sub-strand | Learning Concept |
|------|------|--------|------------|------------------|
| ${term} | Week 1 | ${this.escapeForPrompt(strand)} | ${this.escapeForPrompt(substrand)} | [First learning concept] |
| ${term} | Week 1 | ${this.escapeForPrompt(strand)} | ${this.escapeForPrompt(substrand)} | [Second learning concept] |
| ${term} | Week 1 | ${this.escapeForPrompt(strand)} | ${this.escapeForPrompt(substrand)} | [Third learning concept] |
...continue for EXACTLY ${totalRows} rows

## DISTRIBUTION STRATEGY:

${this.generateDistributionStrategy(sloList, safeWeeks, safeLessonsPerWeek)}

## CRITICAL RULES:

✅ DO:
- Generate EXACTLY ${totalRows} rows (no more, no less)
- Distribute ${safeLessonsPerWeek} lessons per week across ${safeWeeks} weeks
- Use learning concepts from the SLOs above
- If you run out of SLOs (${sloList.length} available), break them down into smaller concepts
- Each row must be ONE continuous line
- Use pipe (|) to separate columns
- Keep concepts clear and educational

❌ DON'T:
- Generate more or fewer than ${totalRows} rows
- Skip any weeks
- Create empty or placeholder concepts
- Split cells across multiple lines

## HOW TO MEET THE ${totalRows} ROW REQUIREMENT:

Since you have ${sloList.length} SLOs but need ${totalRows} learning concepts:

${totalRows > sloList.length ? 
  `You need to EXPAND the SLOs:
- Break complex SLOs into ${Math.ceil(totalRows / sloList.length)} smaller concepts each
- Focus on sub-components of each SLO
- Create progressive learning steps
- Example: "Understand photosynthesis" becomes:
  1. Identify parts of a leaf involved in photosynthesis
  2. Describe the process of photosynthesis
  3. Explain factors affecting photosynthesis
  4. Analyze the importance of photosynthesis`
  :
  `You need to CONDENSE the SLOs:
- Group related SLOs together
- Focus on the most important ${totalRows} concepts
- Prioritize core learning outcomes`
}

## VALIDATION CHECKLIST:

Before you finish, COUNT YOUR ROWS:
☐ I have generated EXACTLY ${totalRows} rows
☐ Each week has ${safeLessonsPerWeek} lessons
☐ All ${safeWeeks} weeks are covered
☐ Each row is on ONE line
☐ All concepts are educational and clear

OUTPUT STRUCTURE:

1. **First**: Output the complete table with ${totalRows} rows
2. Do not add any other content after the table

Begin generating the ${totalRows}-row table now:`;
  }

  /**
   * ✅ Generate distribution strategy explanation
   */
  generateDistributionStrategy(sloList, weeks, lessonsPerWeek) {
    const totalRows = weeks * lessonsPerWeek;
    const sloCount = sloList.length;
    
    let strategy = `**Distribution Strategy for ${totalRows} Rows:**\n\n`;
    
    if (totalRows === sloCount) {
      strategy += `Perfect match! Use each SLO exactly once (1 SLO per lesson).\n`;
    } else if (totalRows > sloCount) {
      const expansionFactor = Math.ceil(totalRows / sloCount);
      strategy += `You need to EXPAND ${sloCount} SLOs into ${totalRows} concepts.\n`;
      strategy += `Strategy: Break each SLO into approximately ${expansionFactor} smaller learning concepts.\n\n`;
      strategy += `Example breakdown:\n`;
      strategy += `Week 1 (${lessonsPerWeek} lessons): Focus on foundational concepts from first ${Math.ceil(lessonsPerWeek / 2)} SLOs\n`;
      strategy += `Week 2 (${lessonsPerWeek} lessons): Continue with next concepts and applications\n`;
      strategy += `Continue this pattern across all ${weeks} weeks\n`;
    } else {
      strategy += `You need to CONDENSE ${sloCount} SLOs into ${totalRows} key concepts.\n`;
      strategy += `Strategy: Group related SLOs and select the most important ${totalRows} concepts.\n`;
    }
    
    return strategy;
  }
}

module.exports = FixedLessonConceptGenerator;