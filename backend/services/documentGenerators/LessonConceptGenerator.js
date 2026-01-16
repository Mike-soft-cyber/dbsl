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
    
    // ✅ CRITICAL FIX: Use weeks and lessonsPerWeek from curriculum config
    const safeWeeks = weeks || 10;
    const safeLessonsPerWeek = lessonsPerWeek || 5;
    
    // ✅ CRITICAL FIX: Calculate total rows (WEEKS × LESSONS_PER_WEEK)
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

    return `Generate a Lesson Concept Breakdown table with EXACTLY ${totalRows} rows.

CRITICAL FORMATTING REQUIREMENTS:
✅ Each row MUST be on ONE continuous line
✅ Use pipe (|) to separate columns
✅ Generate EXACTLY ${totalRows} rows (no more, no less)
✅ DO NOT add extra line breaks within cells
✅ Each cell should be continuous text without newlines

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

## 🎯 MANDATORY REQUIREMENT: EXACT ROW COUNT

You MUST generate EXACTLY ${totalRows} rows because:
- WEEKS = ${safeWeeks}
- LESSONS PER WEEK = ${safeLessonsPerWeek}
- TOTAL ROWS = ${safeWeeks} × ${safeLessonsPerWeek} = ${totalRows}

## CBC FRAMEWORK ALIGNMENT:

### SPECIFIC LEARNING OUTCOMES (${sloList.length} available):
${sloList.map((slo, i) => `${i+1}. ${slo}`).join('\n')}

## TABLE FORMAT - EXACTLY 5 COLUMNS:

| Term | Week | Strand | Sub-strand | Learning Concept |
|------|------|--------|------------|------------------|

## EXAMPLE ROWS (showing correct format):

| ${term} | Week 1 | ${this.escapeForPrompt(strand)} | ${this.escapeForPrompt(substrand)} | Identify materials for modeling |
| ${term} | Week 1 | ${this.escapeForPrompt(strand)} | ${this.escapeForPrompt(substrand)} | Explore different textures of clay |
| ${term} | Week 1 | ${this.escapeForPrompt(strand)} | ${this.escapeForPrompt(substrand)} | Practice rolling clay into balls |

## DISTRIBUTION STRATEGY:

${this.generateDistributionStrategy(sloList, safeWeeks, safeLessonsPerWeek)}

## CRITICAL RULES:

✅ DO:
- Generate EXACTLY ${totalRows} rows (verify count before finishing)
- Distribute ${safeLessonsPerWeek} lessons per week across ${safeWeeks} weeks
- Use learning concepts from the SLOs
- Keep each row on ONE continuous line
- Ensure all ${safeWeeks} weeks are covered
- Make concepts clear and educational

❌ DON'T:
- Generate more or fewer than ${totalRows} rows
- Skip any weeks
- Split cells across multiple lines
- Add line breaks within cells
- Create empty or placeholder concepts

## HOW TO MEET THE ${totalRows} ROW REQUIREMENT:

Since you have ${sloList.length} SLOs but need ${totalRows} learning concepts:

${this.getExpansionGuidance(sloList.length, totalRows, safeWeeks, safeLessonsPerWeek)}

## VALIDATION CHECKLIST:

Before finishing, verify:
☐ Row count = ${totalRows} (COUNT THEM!)
☐ Weeks covered = ${safeWeeks}
☐ Lessons per week = ${safeLessonsPerWeek}
☐ Each row on ONE line
☐ All concepts are educational
☐ No empty cells
☐ Proper pipe (|) separation

OUTPUT FORMAT:

First, output the table header:
| Term | Week | Strand | Sub-strand | Learning Concept |
|------|------|--------|------------|------------------|

Then generate ALL ${totalRows} data rows following this pattern:
| ${term} | Week X | ${this.escapeForPrompt(strand)} | ${this.escapeForPrompt(substrand)} | [Learning concept here] |

Start generating now - remember: EXACTLY ${totalRows} rows!`;
  }

  generateDistributionStrategy(sloList, weeks, lessonsPerWeek) {
    const totalRows = weeks * lessonsPerWeek;
    const sloCount = sloList.length;
    
    let strategy = `**Distribution Strategy for ${totalRows} Rows:**\n\n`;
    
    if (totalRows === sloCount) {
      strategy += `Perfect match! Use each SLO exactly once (1 SLO = 1 lesson).\n`;
    } else if (totalRows > sloCount) {
      const expansionFactor = Math.ceil(totalRows / sloCount);
      strategy += `EXPAND ${sloCount} SLOs into ${totalRows} concepts.\n`;
      strategy += `Strategy: Break each SLO into approximately ${expansionFactor} smaller concepts.\n\n`;
      strategy += `Week-by-week breakdown:\n`;
      for (let week = 1; week <= weeks; week++) {
        const startLesson = (week - 1) * lessonsPerWeek + 1;
        const endLesson = week * lessonsPerWeek;
        strategy += `Week ${week}: Lessons ${startLesson}-${endLesson}\n`;
      }
    } else {
      strategy += `CONDENSE ${sloCount} SLOs into ${totalRows} key concepts.\n`;
      strategy += `Strategy: Group related SLOs and select the ${totalRows} most important concepts.\n`;
    }
    
    return strategy;
  }

  getExpansionGuidance(sloCount, totalRows, weeks, lessonsPerWeek) {
    if (totalRows > sloCount) {
      const expansionFactor = Math.ceil(totalRows / sloCount);
      return `You need to EXPAND ${sloCount} SLOs into ${totalRows} concepts:

STRATEGY: Break down each SLO into ${expansionFactor} smaller, progressive learning concepts.

Example: If SLO is "Understand photosynthesis"
→ Break into:
  1. Identify parts of a leaf
  2. Describe the photosynthesis process
  3. Explain factors affecting photosynthesis
  4. Analyze importance of photosynthesis

Apply this breakdown approach to all ${sloCount} SLOs to reach ${totalRows} total concepts.`;
    } else if (totalRows < sloCount) {
      return `You need to CONDENSE ${sloCount} SLOs into ${totalRows} concepts:

STRATEGY: Group related SLOs and prioritize the ${totalRows} most essential concepts.`;
    } else {
      return `Perfect match! Use each of the ${sloCount} SLOs as one learning concept.`;
    }
  }
}

module.exports = FixedLessonConceptGenerator;