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
    
    const safeWeeks = weeks || 10;
    const safeLessonsPerWeek = lessonsPerWeek || 5;
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
      ageRange,
      strand,
      substrand
    });
    
    const learningExperiences = cbcEntry?.learningExperiences || [];
    const keyInquiryQuestions = cbcEntry?.keyInquiryQuestions || [];

    // Clean the strand and substrand of any numbering
    const cleanStrand = this.cleanCurriculumNumber(strand);
    const cleanSubstrand = this.cleanCurriculumNumber(substrand);

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

## 🔒 CRITICAL REQUIREMENT: STRAND AND SUB-STRAND RESTRICTION

**YOU MUST ONLY USE THIS STRAND AND SUB-STRAND:**
- **STRAND:** ${cleanStrand}
- **SUB-STRAND:** ${cleanSubstrand}

⛔ **DO NOT:**
- Use ANY other strand (like "LIFE SCIENCES" or "PHYSICAL SCIENCES")
- Use ANY other sub-strand (like "Tools and Equipment" or "Cells and Organisms")
- Create concepts from different curriculum areas
- Mix multiple strands or sub-strands
- Include curriculum numbering (like "1.0:", "1.1:", "2.3.4:") in the strand or substrand columns

✅ **EVERY SINGLE ROW MUST:**
- Use EXACTLY "${cleanStrand}" in the STRAND column (no numbers like "1.0:")
- Use EXACTLY "${cleanSubstrand}" in the SUB-STRAND column (no numbers like "1.1:")
- Have learning concepts ONLY related to "${cleanSubstrand}"

## CBC FRAMEWORK ALIGNMENT:

### SPECIFIC LEARNING OUTCOMES (${sloList.length} available):
${sloList.map((slo, i) => `${i+1}. ${slo}`).join('\n')}

**IMPORTANT:** All ${totalRows} learning concepts MUST be derived from these ${sloList.length} SLOs ONLY. 
Do NOT create concepts from other curriculum areas.

### LEARNING EXPERIENCES:
${learningExperiences.map((exp, i) => `${i+1}. ${exp}`).join('\n')}

### KEY INQUIRY QUESTIONS:
${keyInquiryQuestions.map((q, i) => `${i+1}. ${q}`).join('\n')}

## TABLE FORMAT:

Generate the table with this EXACT structure:

| Term | Week | Strand | Sub-strand | Learning Concept |
|------|------|--------|------------|------------------|
| ${term} | Week 1 | ${cleanStrand} | ${cleanSubstrand} | [First learning concept from the SLOs above] |
| ${term} | Week 1 | ${cleanStrand} | ${cleanSubstrand} | [Second learning concept from the SLOs above] |
| ${term} | Week 1 | ${cleanStrand} | ${cleanSubstrand} | [Third learning concept from the SLOs above] |
...continue for EXACTLY ${totalRows} rows

**EVERY ROW MUST:**
- Use "${term}" in the Term column
- Use "Week X" format (Week 1, Week 2, etc.)
- Use EXACTLY "${cleanStrand}" (no curriculum numbers like "1.0:", no variations)
- Use EXACTLY "${cleanSubstrand}" (no curriculum numbers like "1.1:", no variations)
- Have a unique learning concept derived from the SLOs listed above

## DISTRIBUTION STRATEGY:

${this.generateDistributionStrategy(sloList, safeWeeks, safeLessonsPerWeek, cleanStrand, cleanSubstrand)}

## CRITICAL RULES:

✅ DO:
- Generate EXACTLY ${totalRows} rows (no more, no less)
- Distribute ${safeLessonsPerWeek} lessons per week across ${safeWeeks} weeks
- Use learning concepts ONLY from the ${sloList.length} SLOs listed above for "${cleanSubstrand}"
- Keep STRAND as "${cleanStrand}" in ALL rows (NO curriculum numbers)
- Keep SUB-STRAND as "${cleanSubstrand}" in ALL rows (NO curriculum numbers)
- If you run out of SLOs, break them down into smaller, specific learning steps
- Each row must be ONE continuous line
- Use pipe (|) to separate columns
- Keep concepts clear and educational

❌ DON'T:
- Generate more or fewer than ${totalRows} rows
- Change the strand or sub-strand in any row
- Include curriculum numbering (like "1.0:", "1.1:", "2.3:") in strand or substrand
- Use concepts from other strands like "LIFE SCIENCES" or "PHYSICAL SCIENCES"
- Use concepts from other sub-strands like "Tools and Equipment" or "Cells and Organisms"
- Skip any weeks
- Create empty or placeholder concepts
- Split cells across multiple lines

## HOW TO MEET THE ${totalRows} ROW REQUIREMENT:

Since you have ${sloList.length} SLOs but need ${totalRows} learning concepts ALL FROM "${cleanSubstrand}":

${totalRows > sloList.length ? 
  `You need to EXPAND the ${sloList.length} SLOs about "${cleanSubstrand}":
- Break each SLO into approximately ${Math.ceil(totalRows / sloList.length)} smaller, specific learning steps
- Focus on progressive skill development within "${cleanSubstrand}"
- Create sequential learning concepts that build on each other
- Stay within the scope of "${cleanSubstrand}" - do NOT introduce other sub-strands
- Example approach:
  * Week 1: Introduction and basic concepts
  * Week 2-3: Detailed exploration and skills
  * Week 4-5: Application and practice
  * Week 6-7: Advanced understanding
  * Week 8-9: Integration and analysis
  * Week 10: Review and mastery
  
All concepts must relate to "${cleanSubstrand}" only.`
  :
  `You need to CONDENSE the ${sloList.length} SLOs about "${cleanSubstrand}":
- Select the most important ${totalRows} concepts from "${cleanSubstrand}"
- Focus on core learning outcomes
- Prioritize foundational knowledge and skills
- Stay within "${cleanSubstrand}" only`
}

## VALIDATION CHECKLIST:

Before you finish, verify:
☐ I have generated EXACTLY ${totalRows} rows
☐ Each week has EXACTLY ${safeLessonsPerWeek} lessons
☐ All ${safeWeeks} weeks are covered
☐ EVERY row uses "${cleanStrand}" in the Strand column (NO "1.0:" prefix)
☐ EVERY row uses "${cleanSubstrand}" in the Sub-strand column (NO "1.1:" prefix)
☐ ALL learning concepts are derived from the ${sloList.length} SLOs listed above
☐ NO concepts from other strands or sub-strands are included
☐ Each row is on ONE line
☐ All concepts are educational and clear
☐ NO curriculum numbering in strand or substrand columns

## ⚠️ FINAL WARNING:

If you include concepts from ANY strand other than "${cleanStrand}" or 
ANY sub-strand other than "${cleanSubstrand}", the table will be REJECTED.

If you include curriculum numbering (like "1.0:", "1.1:") in the strand or substrand columns, the table will be REJECTED.

Stay focused ONLY on: ${cleanStrand} → ${cleanSubstrand}

OUTPUT STRUCTURE:

1. **First**: Output the complete table with ${totalRows} rows
2. Do not add any other content after the table

Begin generating the ${totalRows}-row table now:`;
  }

  // Helper to clean curriculum numbers
  cleanCurriculumNumber(text) {
    if (!text || typeof text !== 'string') return text;
    
    return text
      .replace(/^\d+(\.\d+)*\s*:\s*/g, '')
      .replace(/^\d+(\.\d+)*\s+/g, '')
      .trim();
  }

  generateDistributionStrategy(sloList, weeks, lessonsPerWeek, strand, substrand) {
    const totalRows = weeks * lessonsPerWeek;
    const sloCount = sloList.length;
    
    let strategy = `**Distribution Strategy for ${totalRows} Rows (ONLY "${substrand}"):**\n\n`;
    
    strategy += `🔒 **REMEMBER:** Every single concept must be about "${substrand}" within "${strand}".\n`;
    strategy += `Do NOT create concepts about other sub-strands or strands.\n`;
    strategy += `Do NOT include curriculum numbering (like "1.0:", "1.1:") in strand or substrand.\n\n`;
    
    if (totalRows === sloCount) {
      strategy += `Perfect match! Use each SLO about "${substrand}" exactly once (1 SLO per lesson).\n`;
    } else if (totalRows > sloCount) {
      const expansionFactor = Math.ceil(totalRows / sloCount);
      strategy += `You need to EXPAND ${sloCount} SLOs about "${substrand}" into ${totalRows} concepts.\n`;
      strategy += `Strategy: Break each SLO into approximately ${expansionFactor} smaller learning steps.\n\n`;
      strategy += `Example breakdown for "${substrand}":\n`;
      strategy += `Week 1-2 (${lessonsPerWeek * 2} lessons): Foundational concepts of ${substrand}\n`;
      strategy += `Week 3-4 (${lessonsPerWeek * 2} lessons): Skill development in ${substrand}\n`;
      strategy += `Week 5-7 (${lessonsPerWeek * 3} lessons): Application and practice of ${substrand}\n`;
      strategy += `Week 8-9 (${lessonsPerWeek * 2} lessons): Advanced understanding of ${substrand}\n`;
      strategy += `Week 10 (${lessonsPerWeek} lessons): Review and mastery of ${substrand}\n\n`;
      strategy += `ALL concepts must stay within "${substrand}" - no other topics!\n`;
    } else {
      strategy += `You need to CONDENSE ${sloCount} SLOs into ${totalRows} key concepts about "${substrand}".\n`;
      strategy += `Strategy: Select the most important ${totalRows} concepts from "${substrand}".\n`;
    }
    
    return strategy;
  }
}

module.exports = FixedLessonConceptGenerator;