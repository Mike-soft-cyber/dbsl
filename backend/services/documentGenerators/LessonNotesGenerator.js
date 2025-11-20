// LessonNotesGenerator.js - WITH MANDATORY DIAGRAM PLACEHOLDERS

const BaseDocumentGenerator = require('./BaseDocumentGenerator');

class LessonNotesGenerator extends BaseDocumentGenerator {
  constructor() {
    super('Lesson Notes');
  }

  async generate(requestData, cbcEntry) {
    const startTime = Date.now();
    
    try {
      console.log(`[${this.type}] Starting generation with local image library`);
      
      // Validate inputs
      const safeRequestData = this.validateAndSanitizeRequestData(requestData, cbcEntry);
      
      // Create base prompt
      const basePrompt = this.createPrompt(safeRequestData, cbcEntry);
      
      console.log(`[${this.type}] Prompt created (${basePrompt.length} chars)`);
      
      // Generate with prompt
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
    // ✅ CRITICAL FIX: Ensure grade exists at the VERY START
    if (!requestData.grade) {
      console.warn('[LessonNotesGenerator] ⚠️ WARNING: grade is undefined, using fallback');
      requestData.grade = cbcEntry?.grade || 'Grade 7';
    }

    // ✅ CRITICAL FIX: Create safe variables IMMEDIATELY
    const safeGrade = requestData.grade || cbcEntry?.grade || 'Grade 7';
    const safeLearningArea = requestData.learningArea || cbcEntry?.learningArea || 'General';
    const safeStrand = requestData.strand || cbcEntry?.strand || 'General Strand';
    const safeSubstrand = requestData.substrand || cbcEntry?.substrand || 'General Substrand';
    
    const { 
      school, 
      teacherName, 
      term,
      learningConcepts,
      sourceLessonConceptId
    } = requestData;

    console.log('[LessonNotesGenerator] Generating CBC lesson notes with LOCAL IMAGE LIBRARY');
    
    const sloList = cbcEntry?.slo || cbcEntry?.specificLearningOutcomes || [];
    const learningExperiences = cbcEntry?.learningExperiences || cbcEntry?.suggestedLearningActivities || [];
    const keyInquiryQuestions = cbcEntry?.keyInquiryQuestions || [];
    const coreCompetencies = cbcEntry?.coreCompetencies || [];
    const values = cbcEntry?.values || [];
    const noOfLessons = cbcEntry?.noOfLessons || 'Not specified';

    const hasLearningConcepts = learningConcepts && learningConcepts.length > 0;

    let conceptGuidance = '';
    if (hasLearningConcepts) {
      conceptGuidance = `
📋 WEEKLY PROGRESSION (${learningConcepts.length} weeks):
${learningConcepts.map((c, i) => `${i+1}. ${c.week}: ${c.concept}`).join('\n')}

Create comprehensive content for EACH week above.
`;
    }

    // ✅ DIAGRAM INSTRUCTIONS - Number of diagrams based on concepts
    const maxDiagrams = hasLearningConcepts ? Math.min(learningConcepts.length, 5) : 2;

    // ✅ CRITICAL: SUPER MANDATORY DIAGRAM PLACEHOLDER INSTRUCTIONS
    return `Generate professional CBC Lesson Notes with MANDATORY DIAGRAM PLACEHOLDERS.

DOCUMENT INFORMATION:
Grade: ${safeGrade}
Subject: ${safeLearningArea}
Strand: ${safeStrand}
Sub-strand: ${safeSubstrand}
Term: ${term || 'Term 1'}
Duration: ${noOfLessons} lessons
School: ${school || 'Kenyan School'}
Teacher: ${teacherName || 'Teacher'}

${conceptGuidance}

SPECIFIC LEARNING OUTCOMES (SLOs):
${sloList.length > 0 ? sloList.map((s, i) => `${i+1}. ${s}`).join('\n') : '- Master core concepts\n- Apply to real contexts\n- Develop critical thinking'}

KEY INQUIRY QUESTIONS:
${keyInquiryQuestions.length > 0 ? keyInquiryQuestions.map((q, i) => `${i+1}. ${q}`).join('\n') : '- What do we need to learn?\n- How does this apply?\n- Why is this important?'}

---

🖼️ CRITICAL REQUIREMENT: DIAGRAM PLACEHOLDER FORMAT (ABSOLUTELY MANDATORY)

YOU **MUST** INCLUDE **EXACTLY ${maxDiagrams} DIAGRAM PLACEHOLDERS** IN YOUR RESPONSE.

**THIS IS NOT OPTIONAL. YOU MUST INCLUDE ALL ${maxDiagrams} DIAGRAM PLACEHOLDERS.**

**DIAGRAM PLACEHOLDER FORMAT** (COPY THIS EXACT STRUCTURE):

[DIAGRAM:{
  "description": "Brief description of what visual is needed",
  "caption": "Figure X: Descriptive caption for students",
  "week": "Week X",
  "conceptNumber": X,
  "educationalPurpose": "Explain why this visual helps students"
}]

**MANDATORY PLACEMENT INSTRUCTIONS:**
${hasLearningConcepts ? `
You MUST place ONE diagram placeholder after explaining EACH of these ${maxDiagrams} concepts:

${learningConcepts.slice(0, maxDiagrams).map((c, i) => `
DIAGRAM ${i+1} REQUIREMENT:
- Concept: "${c.concept}"
- Week: ${c.week}
- Place after: The main explanation paragraph for this concept
- Example:
  
[DIAGRAM:{
  "description": "diagram showing ${c.concept.substring(0, 50)}",
  "caption": "Figure ${i+1}: ${c.concept.substring(0, 60)}",
  "week": "${c.week}",
  "conceptNumber": ${i+1},
  "educationalPurpose": "Helps students visualize ${c.concept.substring(0, 50)}"
}]
`).join('\n')}

` : `
You MUST place ${maxDiagrams} diagram placeholders:
- DIAGRAM 1: After introducing fundamental concepts (20-30% through content)
- DIAGRAM 2: When explaining complex relationships (60-70% through content)
`}

⚠️ **VALIDATION CHECKLIST - YOU MUST COMPLETE THIS BEFORE OUTPUTTING:**

Before you generate your response, verify:
☐ I have included EXACTLY ${maxDiagrams} diagram placeholders
☐ Each placeholder uses the EXACT JSON format shown above
☐ Each placeholder has all required fields (description, caption, week, conceptNumber, educationalPurpose)
☐ Placeholders are inserted at natural points in the content
☐ All placeholders are complete and properly formatted
☐ I have NOT used any markdown formatting (**bold**, *italic*, etc.) in concept names or figure captions

**CRITICAL: DO NOT use markdown formatting (** or *) anywhere in learning concept names, figure captions, or headings. Always use plain text only.**

**IF YOU CANNOT COMPLETE THIS CHECKLIST, RETRY YOUR GENERATION.**

---

GENERATE LESSON NOTES IN THIS FORMAT:

# ${safeSubstrand.toUpperCase()}
*${safeLearningArea} - ${safeGrade} - ${term || 'Term 1'}*

---

## INTRODUCTION

[Write 2-3 engaging paragraphs (200-250 words) that:]
- Hook students' interest with a relatable question or scenario
- Explain why this topic matters in everyday Kenyan life
- Preview what students will learn
- Connect to students' prior knowledge

---

## SPECIFIC LEARNING OUTCOMES

By the end of this lesson, the learner should be able to:

${sloList.map((slo, i) => `${i+1}. ${slo}`).join('\n')}

---

## KEY CONCEPTS AND DEFINITIONS

**Term 1:** [Clear definition in 1-2 sentences]  
*Example:* [Kenyan example showing the term in use]

**Term 2:** [Clear definition in 1-2 sentences]  
*Example:* [Kenyan example showing the term in use]

[Include 8-10 key terms total]

---

${hasLearningConcepts ? `
## DETAILED CONTENT BY WEEK

${learningConcepts.slice(0, maxDiagrams).map((c, i) => `
### ${c.week.toUpperCase()}: ${c.concept}

**Learning Focus:**  
[1-2 sentences explaining what students will learn this week]

**Core Content:**

[Write 250-300 words explaining this concept thoroughly, including:]
- What it is (definition and explanation)
- Why it's important
- How it works or applies
- Connection to Kenyan context with specific examples

[DIAGRAM:{
  "description": "${c.concept.substring(0, 100)}",
  "caption": "Figure ${i+1}: ${c.concept.substring(0, 80)}",
  "week": "${c.week}",
  "conceptNumber": ${i+1},
  "educationalPurpose": "Visual aid for ${c.concept.substring(0, 60)}"
}]

**Key Points:**
- [Important point 1 with brief explanation]
- [Important point 2 with brief explanation]
- [Important point 3 with brief explanation]
- [Important point 4 with brief explanation]

**Real-World Examples:**

1. **Example 1:** [Kenyan example from daily life]
2. **Example 2:** [Kenyan example from agriculture/industry]
3. **Example 3:** [Kenyan example relevant to students' community]

**Practical Application:**

[Paragraph explaining how students can apply this knowledge in their lives]

---
`).join('\n')}

` : `
## CORE CONTENT

### Part 1: [Main Topic 1]

[Detailed explanation with Kenyan examples - 300+ words]

[DIAGRAM:{
  "description": "visualization of main concept in Part 1",
  "caption": "Figure 1: [Topic 1]",
  "week": "Week 1",
  "conceptNumber": 1,
  "educationalPurpose": "Helps students understand the fundamental concept"
}]

### Part 2: [Main Topic 2]

[Detailed explanation with Kenyan examples - 300+ words]

[DIAGRAM:{
  "description": "visualization of main concept in Part 2",
  "caption": "Figure 2: [Topic 2]",
  "week": "Week 2",
  "conceptNumber": 2,
  "educationalPurpose": "Clarifies complex relationships in the topic"
}]
`}

---

## PRACTICAL APPLICATIONS IN KENYA

### 1. Agriculture and Food Production
[Explain how this topic relates to Kenyan farming - 150 words]

### 2. Industry and Economic Development
[Connect to Kenyan industries and economy - 150 words]

### 3. Daily Life and Community
[Show relevance to everyday Kenyan life - 150 words]

### 4. Career Opportunities
**Careers related to ${safeSubstrand}:**
- [Career 1]: [Brief description]
- [Career 2]: [Brief description]
- [Career 3]: [Brief description]

---

## LEARNING ACTIVITIES

### Activity 1: [Activity Name]
**Objective:** [What students will learn]  
**Duration:** [Time needed]  
**Materials:** [List materials]  
**Procedure:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Outcome:** [What students should achieve]

[Repeat for Activities 2 and 3]

---

## ASSESSMENT

### Formative Assessment
[Methods for ongoing assessment during lessons]

### Summative Assessment Questions

**Knowledge and Understanding (Remember/Understand):**
1. [Question requiring recall]
2. [Question requiring explanation]
3. [Question testing comprehension]

**Application and Analysis (Apply/Analyze):**
4. [Question requiring application to new situation]
5. [Question requiring comparison or analysis]

**Evaluation and Creation (Evaluate/Create):**
6. [Question requiring evaluation or judgment]
7. [Question requiring creation or design]

---

## RESOURCES AND MATERIALS

### Required Materials
- [Material 1]
- [Material 2]
- [Material 3]

### Recommended Textbooks
- [CBC-approved textbook 1 with page numbers]
- [CBC-approved textbook 2 with page numbers]

---

## SUMMARY

[Write 3-4 comprehensive paragraphs (150-200 words total) that:]
- Recap all major concepts covered
- Emphasize key takeaways
- Reinforce importance of this knowledge
- Connect to future learning

---

*These lesson notes align with the Kenyan Competency Based Curriculum.*

---

FINAL REMINDER BEFORE YOU START GENERATING:

⚠️ **YOU MUST INCLUDE EXACTLY ${maxDiagrams} DIAGRAM PLACEHOLDERS**
⚠️ **EACH MUST USE THE [DIAGRAM:{...}] FORMAT**
⚠️ **DO NOT FORGET THIS REQUIREMENT**

If you generate content without ${maxDiagrams} diagram placeholders, your response will be rejected and you will need to regenerate it.

Generate the complete CBC lesson notes now with ALL ${maxDiagrams} mandatory diagram placeholders.`;
  }

  escapeForPrompt(text) {
    if (!text) return '';
    return String(text).replace(/["'\\]/g, '\\$&').trim();
  }
}

module.exports = LessonNotesGenerator;