// LessonNotesGenerator.js - NO DIAGRAMS VERSION

const BaseDocumentGenerator = require('./BaseDocumentGenerator');

class LessonNotesGenerator extends BaseDocumentGenerator {
  constructor() {
    super('Lesson Notes');
  }

  async generate(requestData, cbcEntry) {
    const startTime = Date.now();
    
    try {
      console.log(`[${this.type}] Starting CBC-aligned generation (NO DIAGRAMS)`);
      
      const safeRequestData = this.validateAndSanitizeRequestData(requestData, cbcEntry);
      const basePrompt = this.createPrompt(safeRequestData, cbcEntry);
      
      console.log(`[${this.type}] Prompt created (${basePrompt.length} chars)`);
      
      const aiContent = await this.generateWithRetry(basePrompt, 3);
      
      if (!aiContent || aiContent.length < 100) {
        throw new Error('AI generated insufficient content');
      }

      console.log(`[${this.type}] ✅ Generated ${aiContent.length} chars in ${Date.now() - startTime}ms`);
      
      return aiContent;

    } catch (error) {
      console.error(`[${this.type}] ❌ Generation failed:`, error.message);
      return this.generateFallbackContent(requestData, cbcEntry, error);
    }
  }

  createPrompt(requestData, cbcEntry) {
    if (!requestData.grade) {
      console.warn('[LessonNotesGenerator] ⚠️ WARNING: grade is undefined, using fallback');
      requestData.grade = cbcEntry?.grade || 'Grade 7';
    }

    const safeGrade = requestData.grade || cbcEntry?.grade || 'Grade 7';
    const safeLearningArea = requestData.learningArea || cbcEntry?.learningArea || 'General';
    const safeStrand = requestData.strand || cbcEntry?.strand || 'General Strand';
    const safeSubstrand = requestData.substrand || cbcEntry?.substrand || 'General Substrand';
    
    const { 
      school, teacherName, term, learningConcepts, ageRange, lessonDuration 
    } = requestData;

    const sloList = cbcEntry?.slo || [];
    const learningExperiences = cbcEntry?.learningExperiences || [];
    const keyInquiryQuestions = cbcEntry?.keyInquiryQuestions || [];
    const coreCompetencies = cbcEntry?.coreCompetencies || [];
    const values = cbcEntry?.values || [];
    const pertinentIssues = cbcEntry?.pertinentIssues || [];
    const lifeSkills = cbcEntry?.lifeSkills || [];
    const assessmentRubrics = cbcEntry?.assessment || [];
    const resources = cbcEntry?.resources || [];
    const noOfLessons = cbcEntry?.noOfLessons || 'Not specified';

    const hasLearningConcepts = learningConcepts && learningConcepts.length > 0;

    return `Generate comprehensive CBC Lesson Notes following official KICD curriculum structure.

═══════════════════════════════════════════════════════════════════
📚 OFFICIAL CBC CURRICULUM INFORMATION
═══════════════════════════════════════════════════════════════════

SCHOOL: ${school}
FACILITATOR: ${teacherName}
GRADE: ${safeGrade} (Age: ${ageRange})
LEARNING AREA: ${safeLearningArea}
STRAND: ${safeStrand}
SUB-STRAND: ${safeSubstrand}
TERM: ${term || 'Term 1'}
DURATION: ${noOfLessons}
LESSON DURATION: ${lessonDuration} minutes per lesson

═══════════════════════════════════════════════════════════════════
🎯 OFFICIAL CBC FRAMEWORK ELEMENTS
═══════════════════════════════════════════════════════════════════

**SPECIFIC LEARNING OUTCOMES (SLOs):**
By the end of the sub-strand, the learner should be able to:

${sloList.map((slo, idx) => `${String.fromCharCode(97 + idx)}) ${slo}`).join('\n')}

**SUGGESTED LEARNING EXPERIENCES:**
${learningExperiences.length > 0 ? learningExperiences.map((exp) => `• ${exp}`).join('\n') : '• Interactive activities\n• Hands-on exploration\n• Practical applications'}

**KEY INQUIRY QUESTIONS:**
${keyInquiryQuestions.length > 0 ? keyInquiryQuestions.map((q, idx) => `${idx+1}. ${q}`).join('\n') : '1. What do we need to learn?\n2. How does this apply to our lives?\n3. Why is this important?'}

**CORE COMPETENCIES DEVELOPED:**
${coreCompetencies.length > 0 ? coreCompetencies.join(', ') : 'Communication, Critical thinking, Creativity, Collaboration, Learning to learn'}

**VALUES:**
${values.length > 0 ? values.join(', ') : 'Unity, Responsibility, Respect, Patriotism, Peace'}

**LINK TO PCIs (Pertinent & Contemporary Issues):**
${pertinentIssues.length > 0 ? pertinentIssues.join(', ') : 'Citizenship, Life skills'}

${lifeSkills.length > 0 ? `**LIFE SKILLS:**
${lifeSkills.join(', ')}` : ''}

**SUGGESTED LEARNING RESOURCES:**
${resources.length > 0 ? resources.join(', ') : 'Textbooks, realia, ICT devices, charts, locally available materials'}

**SUGGESTED ASSESSMENT:**
${assessmentRubrics.length > 0 ? 'Oral questions, observation, portfolio, practical tasks' : 'Observation, questioning, portfolio'}

═══════════════════════════════════════════════════════════════════
🚫 CRITICAL: NO DIAGRAMS OR IMAGES
═══════════════════════════════════════════════════════════════════

**IMPORTANT:** Do NOT include any diagram placeholders, image references, or [DIAGRAM:...] tags in your response.

This document should be PURE TEXT ONLY with:
- Clear written explanations
- Detailed descriptions
- Step-by-step instructions
- Examples described in words

═══════════════════════════════════════════════════════════════════
📝 LESSON NOTES STRUCTURE (OFFICIAL CBC FORMAT)
═══════════════════════════════════════════════════════════════════

Generate following this EXACT CBC-aligned structure (TEXT ONLY):

# ${safeSubstrand.toUpperCase()}
*${safeLearningArea} - ${safeGrade} - ${term || 'Term 1'}*

---

## 📋 CURRICULUM INFORMATION

- **Strand:** ${safeStrand}
- **Sub-strand:** ${safeSubstrand}
- **Duration:** ${noOfLessons}
- **Grade:** ${safeGrade}
- **Age Range:** ${ageRange}
- **Term:** ${term || 'Term 1'}
- **Lesson Duration:** ${lessonDuration} minutes per lesson

---

## 📖 INTRODUCTION

[Write 3 engaging paragraphs (300 words total) - PURE TEXT, NO DIAGRAMS]

---

## 🎯 SPECIFIC LEARNING OUTCOMES

By the end of the sub-strand, the learner should be able to:

${sloList.map((slo, idx) => `${String.fromCharCode(97 + idx)}) ${slo}`).join('\n')}

---

## 🔑 KEY VOCABULARY

[Define 8-10 key terms with Kenyan examples - DESCRIBED IN WORDS, NO IMAGES]

---

${hasLearningConcepts ? `
## 📚 CONTENT BY LEARNING CONCEPT

${learningConcepts.slice(0, 5).map((c, conceptIdx) => `
### ${c.week.toUpperCase()}: ${c.concept}

**SLO Focus:** [Which SLO (a, b, c, d) this concept addresses]

**Learning Focus:**  
[2-3 sentences explaining what students will master and why it's important]

**Main Content:**

[Write 400-450 words of detailed, clear explanation - PURE TEXT]

**What it is:**
- Clear definition appropriate for ${safeGrade} (age ${ageRange})
- Break complex ideas into simple parts
- Use language young learners understand

**Why it matters:**
- Importance for Kenyan students
- Connection to Kenyan national development, Vision 2030, or community
- Relevance to students' current and future lives

**How it works:**
- Step-by-step explanation or process DESCRIBED IN WORDS
- Cause and effect relationships
- Key principles or mechanisms
- Connection to ${safeLearningArea}

**Kenyan Context:**
- Specific examples from Kenyan agriculture, industry, or economy
- Local applications students can observe in their communities
- Connection to Kenyan culture, traditions, or daily life
- Examples from different regions of Kenya

**Key Points to Remember:**

- ✓ [First important point with explanation - 2 sentences]
- ✓ [Second important point with explanation - 2 sentences]
- ✓ [Third important point with explanation - 2 sentences]
- ✓ [Fourth important point with explanation - 2 sentences]

**Suggested Learning Experiences (from CBC):**

${learningExperiences.slice(0, 2).map((exp, expIdx) => `
**Experience ${expIdx + 1}:** ${exp}
- **Procedure:** [How to implement this in class - 3-4 steps DESCRIBED IN WORDS]
- **Materials:** [What's needed]
- **Expected Outcome:** [What students achieve]
`).join('\n')}

**Real-World Kenyan Examples:**

1. **Agricultural Application:** [How this concept applies to Kenyan farming - 3 sentences, NO DIAGRAMS]

2. **Economic/Industrial Context:** [How this relates to Kenyan industries - 3 sentences, NO DIAGRAMS]

3. **Community & Daily Life:** [How students see this in their communities - 3 sentences, NO DIAGRAMS]

---
`).join('\n')}

` : `
## 📚 CORE CONTENT

[Generate 3 main content sections with detailed explanations - ALL TEXT, NO DIAGRAMS]
`}

---

## 🌍 KENYAN CONTEXT & APPLICATIONS

[4 sections: Agriculture, Industry, Community, Careers - ALL DESCRIBED IN WORDS, NO IMAGES]

---

## 🎨 LEARNING ACTIVITIES

${learningExperiences.slice(0, 3).map((exp, idx) => `
### Activity ${idx + 1}: ${exp}

**Learning Objective:** [What specific skill or knowledge students will gain]  
**Duration:** ${lessonDuration === 30 ? '20-25' : lessonDuration === 35 ? '25-30' : '30-35'} minutes  
**Group Size:** [Individual / Pairs / Groups of 4-5 / Whole class]

**Materials Required:**
- [List materials - NO IMAGES, just descriptions]

**Procedure:**
[Step-by-step instructions DESCRIBED IN WORDS - NO DIAGRAMS]

**Expected Outcome:** [What students should achieve]

**Assessment:** [How to check if students achieved the objective]

---
`).join('\n')}

---

## ❓ KEY INQUIRY QUESTIONS

${keyInquiryQuestions.map((q, i) => `${i+1}. ${q}`).join('\n')}

---

## 📊 ASSESSMENT STRATEGIES

[Formative and Summative assessment - DESCRIBED IN WORDS, NO VISUAL AIDS]

---

## 📚 RESOURCES AND MATERIALS

### Suggested Learning Resources (From CBC):
${resources.length > 0 ? resources.map(r => `- ${r}`).join('\n') : '- Textbooks\n- Realia\n- Locally available materials'}

---

## 🎓 CBC FRAMEWORK INTEGRATION

[Core Competencies, Values, PCIs - ALL TEXT, NO DIAGRAMS]

---

## 📝 SUMMARY

[Write 4 comprehensive paragraphs (300 words total) - PURE TEXT]

---

*These lesson notes align with the Kenyan Competency Based Curriculum (CBC) Framework*  
*Based on KICD Curriculum Designs - ${safeGrade}*  
*Generated: [DATE] | Sub-strand Duration: ${noOfLessons}*

---

⚠️ CRITICAL REMINDER: Your entire response should be PURE TEXT with NO diagram placeholders, NO [DIAGRAM:...] tags, NO image references. Describe everything in words.

Generate the complete, CBC-aligned lesson notes now (TEXT ONLY).`;
  }

  escapeForPrompt(text) {
    if (!text) return '';
    return String(text).replace(/["'\\]/g, '\\$&').trim();
  }
}

module.exports = LessonNotesGenerator;