

const BaseDocumentGenerator = require('./BaseDocumentGenerator');

class SchemesGenerator extends BaseDocumentGenerator {
  constructor() {
    super('Schemes of Work');
  }

  createPrompt(requestData, cbcEntry) {
    const { 
      school, teacherName, grade, learningArea, strand, substrand, term, 
      weeks, lessonsPerWeek 
    } = requestData;
    
    const safeWeeks = weeks || 10;
    const safeLessonsPerWeek = lessonsPerWeek || 5;
    const totalRows = safeWeeks * safeLessonsPerWeek;
    
    
    let sloList = cbcEntry?.slo || [];
    
    
    if (sloList.length === 1 && sloList[0].includes('b)')) {
      console.log('[SchemesGen] ⚠️ Detected combined SLOs, splitting...');
      const combined = sloList[0];
      
      sloList = combined
        .split(/(?=[a-z]\))/) 
        .map(slo => slo.replace(/^[a-z]\)\s*/, '').trim()) 
        .filter(slo => slo.length > 5); 
      
      console.log(`[SchemesGen] ✅ Split into ${sloList.length} separate SLOs`);
    }
    
    
    let learningExperiences = cbcEntry?.learningExperiences || [];
    
    if (learningExperiences.length === 1 && learningExperiences[0].includes('•')) {
      console.log('[SchemesGen] ⚠️ Detected combined Learning Experiences, splitting...');
      learningExperiences = learningExperiences[0]
        .split('•')
        .map(exp => exp.trim())
        .filter(exp => exp.length > 5);
      console.log(`[SchemesGen] ✅ Split into ${learningExperiences.length} separate experiences`);
    } else if (learningExperiences.length === 1 && /\d+\.\s/.test(learningExperiences[0])) {
      console.log('[SchemesGen] ⚠️ Detected numbered Learning Experiences, splitting...');
      learningExperiences = learningExperiences[0]
        .split(/\d+\.\s/)
        .map(exp => exp.trim())
        .filter(exp => exp.length > 5);
      console.log(`[SchemesGen] ✅ Split into ${learningExperiences.length} separate experiences`);
    }
    
    
    let keyInquiryQuestions = cbcEntry?.keyInquiryQuestions || [];
    
    if (keyInquiryQuestions.length === 1 && /\d+\.\s/.test(keyInquiryQuestions[0])) {
      console.log('[SchemesGen] ⚠️ Detected combined Key Inquiry Questions, splitting...');
      keyInquiryQuestions = keyInquiryQuestions[0]
        .split(/\d+\.\s/)
        .map(q => q.trim())
        .filter(q => q.length > 5);
      console.log(`[SchemesGen] ✅ Split into ${keyInquiryQuestions.length} separate questions`);
    } else if (keyInquiryQuestions.length === 1 && keyInquiryQuestions[0].includes('?') && keyInquiryQuestions[0].split('?').length > 2) {
      console.log('[SchemesGen] ⚠️ Detected question-separated KIQs, splitting...');
      keyInquiryQuestions = keyInquiryQuestions[0]
        .split('?')
        .map(q => q.trim() + (q.trim() ? '?' : ''))
        .filter(q => q.length > 5 && q !== '?');
      console.log(`[SchemesGen] ✅ Split into ${keyInquiryQuestions.length} separate questions`);
    }
    
    const resources = cbcEntry?.resources || [];

    
    const lessonsPerSLO = Math.ceil(totalRows / sloList.length);

    return `⚠️ CRITICAL: Generate a table with EXACTLY 10 COLUMNS in this EXACT order:

| WEEK | LESSON | STRAND | SUB-STRAND | SPECIFIC LEARNING OUTCOMES (SLO) | LEARNING EXPERIENCES | KEY INQUIRY QUESTION (KIQ) | LEARNING RESOURCES | ASSESSMENT | REFLECTION |

═══════════════════════════════════════════════════════════════════
📋 SLO DISTRIBUTION STRATEGY (CRITICAL - FOLLOW EXACTLY)
═══════════════════════════════════════════════════════════════════

You have ${sloList.length} SLOs to distribute across ${totalRows} lessons.
Each SLO should cover approximately ${lessonsPerSLO} lessons.

**DISTRIBUTION PLAN:**
${sloList.map((slo, idx) => {
  const letter = String.fromCharCode(97 + idx); // a, b, c, d
  const startLesson = idx * lessonsPerSLO + 1;
  const endLesson = Math.min((idx + 1) * lessonsPerSLO, totalRows);
  return `
SLO (${letter}): "${slo.substring(0, 80)}..."
→ Use in Lessons ${startLesson}-${endLesson}
→ In the SLO column, write: "(${letter}) ${slo}"
`;
}).join('\n')}

**EXAMPLE ROWS SHOWING CORRECT SLO DISTRIBUTION:**

Lesson 1-${lessonsPerSLO}:
| Week 1 | Lesson 1 | ${strand} | ${substrand} | (a) ${sloList[0]?.substring(0, 50)}... | ${learningExperiences[0]?.substring(0, 40)}... | ${keyInquiryQuestions[0]?.substring(0, 35)}? | ${resources.slice(0, 2).join(', ')} | Observation | Were learners able to ${sloList[0]?.substring(0, 30)}...? |

Lesson ${lessonsPerSLO + 1}-${lessonsPerSLO * 2}:
| Week X | Lesson Y | ${strand} | ${substrand} | (b) ${sloList[1]?.substring(0, 50)}... | ${learningExperiences[1]?.substring(0, 40)}... | ${keyInquiryQuestions[1]?.substring(0, 35)}? | ${resources.slice(0, 2).join(', ')} | Portfolio | Did learners ${sloList[1]?.substring(0, 30)}...? |

═══════════════════════════════════════════════════════════════════
📊 DOCUMENT INFORMATION
═══════════════════════════════════════════════════════════════════

SCHOOL: ${school}
FACILITATOR: ${teacherName}
GRADE: ${grade}
SUBJECT: ${learningArea}
TERM: ${term}
WEEKS: ${safeWeeks}
LESSONS PER WEEK: ${safeLessonsPerWeek}
TOTAL LESSONS: ${totalRows}

⚠️ MANDATORY REQUIREMENTS:
1. Generate EXACTLY ${totalRows} rows
2. Each row MUST have EXACTLY 10 columns separated by |
3. DO NOT skip any columns
4. DO NOT merge columns
5. Each row MUST be on ONE continuous line
6. Follow the SLO distribution plan above EXACTLY

═══════════════════════════════════════════════════════════════════
📊 CBC CURRICULUM DATA
═══════════════════════════════════════════════════════════════════

STRAND: ${strand}
SUB-STRAND: ${substrand}

SPECIFIC LEARNING OUTCOMES (distribute as shown above):
${sloList.map((slo, i) => `${String.fromCharCode(97 + i)}) ${slo}`).join('\n')}

LEARNING EXPERIENCES (rotate through these):
${learningExperiences.map((exp, i) => `${i+1}. ${exp}`).join('\n')}

KEY INQUIRY QUESTIONS (rotate through these):
${keyInquiryQuestions.map((q, i) => `${i+1}. ${q}`).join('\n')}

LEARNING RESOURCES (use these):
${resources.join(', ')}

═══════════════════════════════════════════════════════════════════
📝 COLUMN-BY-COLUMN REQUIREMENTS
═══════════════════════════════════════════════════════════════════

Column 1 - WEEK:
Format: "Week 1", "Week 2", ... "Week ${safeWeeks}"

Column 2 - LESSON:
Format: "Lesson 1", "Lesson 2", ... "Lesson ${totalRows}"

Column 3 - STRAND:
Same for all rows: ${strand}

Column 4 - SUB-STRAND:
Same for all rows: ${substrand}

Column 5 - SPECIFIC LEARNING OUTCOMES (SLO):
⚠️ CRITICAL: Reference SLOs with (a), (b), (c), (d) following the distribution plan
- Lessons 1-${lessonsPerSLO}: Use "(a) ${sloList[0]?.substring(0, 60)}..."
- Lessons ${lessonsPerSLO + 1}-${lessonsPerSLO * 2}: Use "(b) ${sloList[1]?.substring(0, 60)}..."
- Continue this pattern for all SLOs

Column 6 - LEARNING EXPERIENCES:
Choose from the list above, rotate through them appropriately

Column 7 - KEY INQUIRY QUESTION (KIQ):
Choose from the list above, match to the current SLO when possible

Column 8 - LEARNING RESOURCES:
2-3 resources from: ${resources.join(', ')}

Column 9 - ASSESSMENT:
Methods: Observation, Oral questions, Practical task, Portfolio, Group discussion

Column 10 - REFLECTION:
Teacher reflection question starting with: "Were learners...", "Did learners...", "Could learners..."

═══════════════════════════════════════════════════════════════════
✅ VERIFICATION BEFORE OUTPUT
═══════════════════════════════════════════════════════════════════

Count your rows: Should be ${totalRows}
Count your columns per row: Should be 10
Check SLO distribution: Should change from (a) to (b) to (c) to (d) at the right lessons
Check first row has all columns: WEEK, LESSON, STRAND, SUB-STRAND, SLO, LEARNING EXPERIENCES, KEY INQUIRY QUESTION, LEARNING RESOURCES, ASSESSMENT, REFLECTION
Check last row has all columns: Same as above

═══════════════════════════════════════════════════════════════════
🚀 START GENERATING NOW
═══════════════════════════════════════════════════════════════════

Output ONLY the table with ${totalRows} complete rows.
Start with the header, then generate all rows following the SLO distribution plan.

| WEEK | LESSON | STRAND | SUB-STRAND | SPECIFIC LEARNING OUTCOMES (SLO) | LEARNING EXPERIENCES | KEY INQUIRY QUESTION (KIQ) | LEARNING RESOURCES | ASSESSMENT | REFLECTION |
|------|--------|--------|------------|----------------------------------|----------------------|---------------------------|-------------------|------------|------------|
[NOW GENERATE ALL ${totalRows} ROWS WITH PROPER SLO DISTRIBUTION]`;
  }

  escapeForPrompt(text) {
    if (!text) return '';
    return String(text).replace(/["'\\]/g, '\\$&').trim();
  }
}

module.exports = SchemesGenerator;