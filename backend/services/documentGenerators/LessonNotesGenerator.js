const BaseDocumentGenerator = require('./BaseDocumentGenerator');

class LessonNotesGenerator extends BaseDocumentGenerator {
  constructor() {
    super('Lesson Notes');
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
      school, 
      teacherName, 
      grade, 
      learningArea, 
      strand, 
      substrand, 
      term, 
      learningConcepts,
      lessonDuration,
      ageRange,
      weeks
    } = requestData;
    
    // Clean strand and substrand
    const cleanStrand = this.cleanCurriculumNumber(strand);
    const cleanSubstrand = this.cleanCurriculumNumber(substrand);
    
    // Get CBC data
    const sloList = cbcEntry?.slo || [];
    const learningExperiences = cbcEntry?.learningExperiences || [];
    const keyInquiryQuestions = cbcEntry?.keyInquiryQuestions || [];
    const resources = cbcEntry?.resources || ['Materials from the local environment'];
    const coreCompetencies = cbcEntry?.coreCompetencies || ['Communication and collaboration', 'Self-efficacy'];
    const values = cbcEntry?.values || ['Sharing', 'Cooperation'];
    const pertinentIssues = cbcEntry?.pertinentIssues || ['Education for Sustainable Development'];
    
    // Get curriculum configuration
    const termNumber = term?.replace('Term ', '').replace('term', '');
    const actualWeeks = weeks || 10;
    const actualLessonDuration = lessonDuration || 30;
    const actualAgeRange = ageRange || '4-5 years';
    
    // Limit concepts to prevent timeout
    const allConcepts = learningConcepts || [];
    const limitedConcepts = allConcepts.slice(0, 20);
    
    console.log(`[Lesson Notes] Reducing concepts from ${allConcepts.length} to ${limitedConcepts.length}`);

    return `Generate comprehensive Lesson Notes in POINT FORM ONLY, fully aligned with CBC framework.

CRITICAL FORMATTING REQUIREMENTS:
✓ ALL CONTENT MUST BE IN POINT FORM (bullet points or numbered lists)
✓ NO LONG PARAGRAPHS - Maximum 25 words per point
✓ Use concise, scannable bullet points throughout
✓ Include HONEST, ACCESSIBLE web resources with search strategies
✓ Keep all explanations brief and to the point
✓ Each section should be easy to scan and read quickly

🔒 CRITICAL: Use strand and substrand WITHOUT curriculum numbers (no "1.0:", "1.1:", etc.)

DOCUMENT INFORMATION:
SCHOOL: ${this.escapeForPrompt(school)}
TEACHER: ${this.escapeForPrompt(teacherName)}
GRADE: ${this.escapeForPrompt(grade)}
SUBJECT: ${this.escapeForPrompt(learningArea)}
STRAND: ${cleanStrand}
SUB-STRAND: ${cleanSubstrand}
TERM: ${this.escapeForPrompt(term)}
TOTAL WEEKS: ${actualWeeks}
AGE RANGE: ${actualAgeRange}
LESSON DURATION: ${actualLessonDuration} minutes per lesson

---

# LESSON NOTES: ${cleanSubstrand}
## ${this.escapeForPrompt(learningArea)} - ${this.escapeForPrompt(grade)} - ${this.escapeForPrompt(term)}

---

## 📋 CURRICULUM INFORMATION
- **Strand:** ${cleanStrand}
- **Sub-strand:** ${cleanSubstrand}
- **Duration:** ${actualWeeks} weeks (approximately ${actualWeeks * 5} lessons)
- **Grade:** ${this.escapeForPrompt(grade)}
- **Age Range:** ${actualAgeRange}
- **Term:** ${this.escapeForPrompt(term)}
- **Lesson Duration:** ${actualLessonDuration} minutes per lesson

⚠️ All content in this document focuses ONLY on "${cleanSubstrand}" within "${cleanStrand}"

---

## 📖 INTRODUCTION
Write a brief introduction in 4-5 BULLET POINTS covering:
- What ${cleanSubstrand} is about (1 sentence)
- Why it's important for ${grade} learners in Kenya
- Connection to Kenyan context and Vision 2030
- Real-world applications students will encounter
- Skills students will develop

---

## 🎯 SPECIFIC LEARNING OUTCOMES
By the end of the sub-strand, the learner should be able to:
${sloList.slice(0, 5).map((slo, i) => `${String.fromCharCode(97 + i)}) ${slo}`).join('\n')}

---

## 🔑 KEY VOCABULARY
List 8-10 key terms as bullet points with brief definitions (under 15 words each):
- **Term:** Brief, clear definition
- **Term:** Brief, clear definition
(Focus on terms specific to ${cleanSubstrand} that ${grade} students need to know)

---

## 📚 CONTENT BY LEARNING CONCEPT

${limitedConcepts.map((concept, index) => {
  const sloIndex = Math.floor(index / Math.ceil(limitedConcepts.length / Math.min(sloList.length, 5)));
  const actualSloIndex = Math.min(sloIndex, sloList.length - 1);
  const relevantSLO = sloList[actualSloIndex] || sloList[0];
  const letter = String.fromCharCode(97 + actualSloIndex);
  
  // Clean the concept text
  const cleanConceptText = this.cleanCurriculumNumber(concept.concept);
  
  return `
### ${concept.week}: ${cleanConceptText}

**SLO Focus:** (${letter}) ${relevantSLO}

**Learning Focus:**
- Main concept: ${cleanConceptText}
- Why this concept matters for ${grade} learners
- Connection to ${cleanSubstrand}

**Main Content:**

**What it is:**
- Brief explanation in 3-4 points (max 20 words each)
- Define the concept clearly for ${actualAgeRange} learners
- Use simple, grade-appropriate language
- Include one Kenyan example

**Why it matters:**
- For Kenyan students (2 points):
  - Relevance to daily life in Kenya
  - Connection to local environment or culture
- Alignment with Kenya's Vision 2030 (1 point)
- Skills developed through this concept

**How it works:**
- Step-by-step process (4-5 numbered steps)
- Each step should be clear and actionable
- Use ${actualAgeRange} appropriate language
- Include practical examples from Kenya

**Kenyan Context:**
- Local examples (2-3 specific points)
- How this connects to student's community
- Cultural or regional relevance
- Locally available materials or resources

**Key Points to Remember:**
✓ Essential concept summary (under 15 words)
✓ Practical application students can use
✓ Kenyan connection or local example
✓ Safety consideration or value emphasized (if relevant)

**Suggested Learning Experiences (from CBC):**
${learningExperiences.slice(0, 3).map((exp, i) => `${i + 1}. ${exp}`).join('\n')}

**Procedure:**
1. **Opening (5 min):** [Brief engaging activity to introduce concept]
2. **Main Activity (${actualLessonDuration - 15} min):** [Hands-on learning experience]
3. **Practice (5 min):** [Students apply what they learned]
4. **Closing (5 min):** [Quick review and reflection]

**Materials:**
- [List 4-6 specific, locally available materials]
- All materials should be accessible in Kenyan schools
- Include alternatives if materials are not available

**Expected Outcome:**
- Students will [specific, observable outcome]
- Direct connection to SLO: [how this achieves the learning outcome]

**Real-World Kenyan Examples:**
- **Agricultural:** How farmers in Kenya use this concept
- **Economic/Industrial:** Local business application
- **Community & Daily Life:** Example from everyday Kenyan life
`;
}).join('\n---\n')}

---

## 📚 FINDING RESOURCES FOR ${cleanSubstrand}

### 🎯 STEP 1: CHECK OFFICIAL KENYAN SOURCES

**Kenya Institute of Curriculum Development (KICD)**
- **Website:** https://kicd.ac.ke/
- **What's there:** Official CBC curriculum designs, SLOs, assessment frameworks
- **How to use it:**
  - Look for downloadable curriculum design PDFs
  - Search for "${learningArea}" or "${grade}"
  - Download PDF and use Ctrl+F to find "${cleanSubstrand}"
  - Extract official learning outcomes and suggested activities
- **Why it's reliable:** Government-approved, curriculum-aligned content

[Continue with all the resource finding sections from original prompt...]

---

## 🌐 KENYAN CONTEXT & APPLICATIONS

**Agriculture**
- [2-3 specific points about how ${cleanSubstrand} relates to Kenyan agriculture]
- Examples from farming practices students may see in their communities
- Connection to Kenya's agricultural economy

**Industry**
- [2-3 points about industrial/business applications in Kenya]
- Local examples from Kenyan industries or small businesses
- Economic importance and job opportunities

**Community**
- [2-3 points about community practices and daily life]
- How families use these concepts in everyday life
- Cultural connections and traditional practices

**Careers**
- [3-4 career pathways where these skills are valuable]
- Specific jobs in Kenya that require this knowledge
- How learning this helps future opportunities

---

## 🎨 LEARNING ACTIVITIES

**Activity 1: Hands-On Exploration**
- **Learning Objective:** Students will [specific measurable objective linked to SLO]
- **Duration:** ${actualLessonDuration} minutes
- **Group Size:** Groups of 4-5 students
- **Materials Required:**
  - [Specific material 1]
  - [Specific material 2]
  - [Specific material 3]
  - All materials locally available in Kenyan schools

**Procedure:**
1. **Introduction (5 min):** Explain activity objectives and demonstrate
2. **Group Work (${actualLessonDuration - 15} min):** Students work in groups
3. **Sharing (5 min):** Groups present findings or creations
4. **Reflection (5 min):** Class discusses what they learned

**Expected Outcome:**
- Students successfully [observable achievement]
- Evidence of understanding [how you'll know they learned]

**Assessment:**
- Observe group collaboration and participation
- Check understanding through questioning
- Evaluate final product or demonstration

---

## ❓ KEY INQUIRY QUESTIONS
${keyInquiryQuestions.slice(0, 5).map(q => `- ${q}`).join('\n')}

---

## 📊 ASSESSMENT STRATEGIES

**Formative Assessment:**
- **Observation:** Watch students during activities, note participation and understanding
- **Questioning:** Ask targeted questions to check comprehension (see Key Inquiry Questions)
- **Group Discussion:** Listen to peer explanations and collaborative problem-solving
- **Quick Checks:** Short verbal or written responses during lessons

**Summative Assessment:**
- **End-of-Unit Project:** Students create [specific project related to ${cleanSubstrand}]
- **Practical Demonstration:** Students show mastery by [observable skill]
- **Assessment Criteria:**
  - Understanding of key concepts (40%)
  - Practical application skills (30%)
  - Creativity and effort (20%)
  - Collaboration and values (10%)

---

## 📚 RESOURCES AND MATERIALS

**Suggested Learning Resources (From CBC):**
${resources.slice(0, 5).map(r => `- ${r}`).join('\n')}

**Additional Resources:**
- Materials available in local environment
- Recycled or reused household items
- Community resources (with permission)
- School library books on ${learningArea}

---

## 🎓 CBC FRAMEWORK INTEGRATION

**Core Competencies Developed:**
${coreCompetencies.slice(0, 3).map(comp => `- **${comp}:** Developed through collaborative activities and hands-on learning`).join('\n')}

**Values Emphasized:**
${values.slice(0, 3).map(val => `- **${val}:** Practiced throughout lessons and group activities`).join('\n')}

**PCIs (Pertinent & Contemporary Issues):**
${pertinentIssues.slice(0, 3).map(pci => `- **${pci}:** Integrated through use of local materials and sustainable practices`).join('\n')}

---

## 📝 SUMMARY
Write 4-5 CONCISE BULLET POINTS summarizing:
- Main concepts students learned in ${cleanSubstrand}
- Key skills developed
- Practical applications in Kenyan context
- Connection to CBC competencies
- How this prepares students for future learning

---

*These lesson notes align with the Kenyan Competency Based Curriculum (CBC) Framework*
*Based on KICD Curriculum Designs - ${grade}*
*Generated: ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}*
*Sub-strand Duration: ${actualWeeks} weeks | ${actualLessonDuration} minutes per lesson*

---

**Remember:** The best teaching comes from combining official CBC guidelines with your creativity and local resources. Use these references as starting points, not rigid instructions.`;
  }

  getSystemMessage() {
    return `You are an expert Kenyan CBC curriculum specialist creating Lesson Notes for teachers.

CRITICAL REQUIREMENTS:
1. WRITE ONLY IN POINT FORM - NO paragraphs
2. Each point must be under 25 words
3. Provide HONEST, ACCESSIBLE web resources with clear search strategies
4. Use REAL URLs that definitely exist, with honest guidance about what's there
5. All duration and age range info must be ACCURATE from curriculum config
6. Focus on SEARCH STRATEGIES rather than fake navigation paths
7. NEVER include curriculum numbering (like "1.0:", "1.1:") in strand or substrand

Generate professional, comprehensive lesson notes with ACCURATE curriculum information and HONEST, practical resource finding strategies.`;
  }
  
  // Limit concepts to prevent timeout
  async generate(requestData, cbcEntry) {
    const originalConcepts = requestData.learningConcepts || [];
    if (originalConcepts.length > 20) {
      console.log(`[Lesson Notes] Limiting concepts from ${originalConcepts.length} to 20`);
      requestData.learningConcepts = originalConcepts.slice(0, 20);
    }
    
    return await super.generate(requestData, cbcEntry);
  }
}

module.exports = LessonNotesGenerator;