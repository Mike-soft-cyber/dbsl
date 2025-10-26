// LessonNotesGenerator.js - FINAL WORKING VERSION

const BaseDocumentGenerator = require('./BaseDocumentGenerator');
const CBCDiagramInstructions = require('../CBCDiagramInstructions');
const CBCContentEnhancer = require('../CBCContentEnhancer');

class LessonNotesGenerator extends BaseDocumentGenerator {
  constructor() {
    super('Lesson Notes');
  }

  async generate(requestData, cbcEntry) {
    const startTime = Date.now();
    
    try {
      console.log(`[${this.type}] Starting generation with web research enhancement`);
      
      // Validate inputs
      const safeRequestData = this.validateAndSanitizeRequestData(requestData, cbcEntry);
      
      // ✅ NEW: Enhance learning concepts with web research
      let enhancedConcepts = requestData.learningConcepts || [];
      
      if (enhancedConcepts.length > 0) {
        console.log(`[${this.type}] Enhancing ${enhancedConcepts.length} concepts with web research...`);
        
        try {
          enhancedConcepts = await CBCContentEnhancer.enhanceWithWebResearch(
            enhancedConcepts,
            safeRequestData.grade,
            safeRequestData.learningArea,
            safeRequestData.substrand
          );
          
          console.log(`[${this.type}] ✅ Web research complete`);
        } catch (researchError) {
          console.warn(`[${this.type}] Web research failed, continuing with original concepts:`, researchError.message);
        }
      }
      
      // Create base prompt
      const basePrompt = this.createPrompt(safeRequestData, cbcEntry);
      
      // ✅ NEW: Enhance prompt with web-researched context
      const enhancedPrompt = CBCContentEnhancer.buildEnhancedPromptWithWebContext(
        basePrompt,
        enhancedConcepts
      );
      
      console.log(`[${this.type}] Prompt enhanced with web context (${enhancedPrompt.length} chars)`);
      
      // Generate with enhanced prompt
      const aiContent = await this.generateWithRetry(enhancedPrompt, 3);
      
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
    // ✅ CRITICAL FIX 1: Ensure grade exists at the VERY START
    if (!requestData.grade) {
      console.warn('[LessonNotesGenerator] ⚠️ WARNING: grade is undefined, using fallback');
      requestData.grade = cbcEntry?.grade || 'Grade 7';
    }

    // ✅ CRITICAL FIX 2: Create safe variables IMMEDIATELY
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

  console.log('[LessonNotesGenerator] Generating Scribd-style CBC lesson notes');
  
  const sloList = cbcEntry?.slo || cbcEntry?.specificLearningOutcomes || [];
  const learningExperiences = cbcEntry?.learningExperiences || cbcEntry?.suggestedLearningActivities || [];
  const keyInquiryQuestions = cbcEntry?.keyInquiryQuestions || [];
  const coreCompetencies = cbcEntry?.coreCompetencies || [];
  const values = cbcEntry?.values || [];
  const noOfLessons = cbcEntry?.noOfLessons || 'Not specified';

  const hasLearningConcepts = learningConcepts && learningConcepts.length > 0;

  // Get diagram instructions
  const cbcDiagramInstructions = CBCDiagramInstructions.getDiagramInstructionsSafely(
    safeLearningArea,
    safeStrand,
    safeSubstrand,
    safeGrade,
    sloList
  );

  const diagramGuidance = this.buildSLOBasedDiagramGuidance(
    cbcDiagramInstructions,
    safeLearningArea,
    safeSubstrand,
    safeGrade,
    learningConcepts,
    sloList
  );

  let conceptGuidance = '';
  if (hasLearningConcepts) {
    conceptGuidance = `
📋 WEEKLY PROGRESSION (${learningConcepts.length} weeks):
${learningConcepts.map((c, i) => `${i+1}. ${c.week}: ${c.concept}`).join('\n')}

Create comprehensive content for EACH week above.
`;
  }

  // ✅ SCRIBD-STYLE PROMPT WITH BETTER DIAGRAM INSTRUCTIONS
  return `Generate professional CBC Lesson Notes following the Scribd.com structure and formatting style.

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

DIAGRAM INSTRUCTIONS (CRITICAL):
Include MAXIMUM ${hasLearningConcepts ? Math.min(learningConcepts.length, 2) : 2} diagrams ONLY.

Each diagram placeholder must use this EXACT format:

[DIAGRAM:{
  "description": "ULTRA-SIMPLE diagram showing [MAIN CONCEPT ONLY]. White background, ONE central element, 3-4 labeled parts maximum, large text (20pt+), flat design with bright solid colors and bold black outlines. Like a teacher's whiteboard drawing. Focus ONLY on [specific concept], NOT complex charts or data tables.",
  "caption": "Figure X: [Simple descriptive title]",
  "educationalPurpose": "Helps students understand [specific learning outcome]",
  "context": "Week X visual aid",
  "visualElements": ["main concept element", "label 1", "label 2", "label 3"],
  "labels": ["simple term 1", "simple term 2", "simple term 3"],
  "sloReference": "[Which specific SLO this supports]"
}]

DIAGRAM REQUIREMENTS:
- Description must be 50+ words with SPECIFIC visual instructions
- Emphasize "SIMPLE", "CLEAN", "FLAT DESIGN", "WHITE BACKGROUND"
- Say "NOT complex charts", "NOT data tables", "NOT multiple diagrams"
- Specify exact number of elements (e.g., "4 labeled parts")
- Make it clear it should look like a teacher's whiteboard drawing

---

GENERATE LESSON NOTES IN THIS EXACT SCRIBD-STYLE FORMAT:

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

**Term 3:** [Clear definition in 1-2 sentences]  
*Example:* [Kenyan example showing the term in use]

[Include 8-10 key terms total]

---

${hasLearningConcepts ? `
## DETAILED CONTENT BY WEEK

${learningConcepts.map((c, i) => `
### ${c.week.toUpperCase()}: ${c.concept}

**Learning Focus:**  
[1-2 sentences explaining what students will learn this week]

**Core Content:**

[Write 250-300 words explaining this concept thoroughly, including:]
- What it is (definition and explanation)
- Why it's important
- How it works or applies
- Connection to Kenyan context with specific examples

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

${this.shouldIncludeDiagramForWeek(i, learningConcepts.length) ? `

${this.generateSLOBasedDiagramPlaceholder(c.concept, safeLearningArea, safeGrade, i+1, c.week, sloList)}

` : ''}

---
`).join('\n')}
` : `
## CORE CONTENT

### Part 1: [Main Topic 1]

[Detailed explanation with Kenyan examples - 300+ words]

### Part 2: [Main Topic 2]

[Detailed explanation with Kenyan examples - 300+ words]

### Part 3: [Main Topic 3]

[Detailed explanation with Kenyan examples - 300+ words]
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
- [Career 4]: [Brief description]
- [Career 5]: [Brief description]

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
4. [Step 4]

**Expected Outcome:** [What students should achieve]

### Activity 2: [Activity Name]
[Same structure]

### Activity 3: [Activity Name]
[Same structure]

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
6. [Question requiring problem-solving]

**Evaluation and Creation (Evaluate/Create):**
7. [Question requiring evaluation or judgment]
8. [Question requiring creation or design]

---

## RESOURCES AND MATERIALS

### Required Materials
- [Material 1]
- [Material 2]
- [Material 3]

### Recommended Textbooks
- [CBC-approved textbook 1 with page numbers]
- [CBC-approved textbook 2 with page numbers]

### Digital Resources
- KICD online resources
- [Specific relevant websites]
- Educational videos (where available)

### Community Resources
- [Local experts who could be invited]
- [Field trip locations relevant to topic]

---

## DIFFERENTIATION

**For Learners Needing Support:**
- [Specific strategy 1]
- [Specific strategy 2]
- [Specific strategy 3]

**For Advanced Learners:**
- [Extension activity 1]
- [Extension activity 2]
- [Extension activity 3]

**For English Language Learners:**
- [Support strategy 1]
- [Support strategy 2]
- Visual aids and bilingual support

---

## CROSS-CURRICULAR LINKS

**Connection to [Subject 1]:**  
[Explain specific connection]

**Connection to [Subject 2]:**  
[Explain specific connection]

**Connection to [Subject 3]:**  
[Explain specific connection]

---

## TEACHER REFLECTION

**After teaching these lessons, reflect on:**

1. How well did students achieve the learning outcomes?
2. Which activities were most effective? Why?
3. What challenges did students face?
4. What would you do differently next time?
5. How can you better support struggling learners?

---

## SUMMARY

[Write 3-4 comprehensive paragraphs (150-200 words total) that:]
- Recap all major concepts covered
- Emphasize key takeaways
- Reinforce importance of this knowledge
- Connect to future learning
- Highlight CBC competencies developed

---

## HOMEWORK ASSIGNMENTS

**Assignment 1:**  
[Specific homework task with clear instructions]

**Assignment 2:**  
[Specific homework task with clear instructions]

**Assignment 3:**  
[Specific homework task with clear instructions]

---

*These lesson notes align with the Kenyan Competency Based Curriculum and support the development of 21st-century skills.*

---

CRITICAL FORMATTING REQUIREMENTS:
✓ Use clear section headers with horizontal lines (---)
✓ Write in full sentences and paragraphs (no bullet point lists for main content)
✓ Include specific Kenyan examples throughout
✓ Make content appropriate for ${safeGrade} level
✓ Total length: 5000-6500 words
✓ Professional, teacher-friendly format
✓ Include MAXIMUM ${hasLearningConcepts ? Math.min(learningConcepts.length, 2) : 2} diagrams ONLY
✓ Each diagram must directly illustrate a specific learning concept

Generate the complete, professional Scribd-style CBC lesson notes now.`;
}

  /**
   * ✅ Build SLO-based diagram guidance with SAFE VALUES
   */
  buildSLOBasedDiagramGuidance(cbcInstructions, learningArea, substrand, grade, learningConcepts, sloList) {
    const hasLearningConcepts = learningConcepts && learningConcepts.length > 0;
    
    let guidance = `
🎨 SLO-BASED DIAGRAM INSTRUCTIONS

**LEARNING OUTCOMES ANALYSIS:**
${sloList && sloList.length > 0 ? sloList.map((slo, i) => `${i+1}. ${slo}`).join('\n') : '1. General learning outcome'}

**DIAGRAM FOCUS:** ${cbcInstructions.keyConcepts?.join(', ') || 'Key concepts from learning outcomes'}
**DIAGRAM TYPE:** ${cbcInstructions.type?.toUpperCase() || 'EDUCATIONAL_INFOGRAPHIC'}
**COMPLEXITY LEVEL:** ${cbcInstructions.complexity || 'medium'}
**GRADE LEVEL:** ${grade}
`;

    if (hasLearningConcepts) {
      const diagramConcepts = learningConcepts.filter((c, i) => 
        this.shouldIncludeDiagramForWeek(i, learningConcepts.length)
      ).slice(0, 2);

      guidance += `
**CONCEPT-SPECIFIC DIAGRAMS:**
${diagramConcepts.map((c, i) => `${i+1}. **${c.concept}** - Create ${cbcInstructions.type || 'educational diagram'} showing: ${this.getSLOBasedDiagramFocus(c.concept, sloList)}`).join('\n')}
`;
    }

    guidance += `
**CRITICAL REQUIREMENTS:**
- Directly illustrate the specific learning outcomes
- Include Kenyan context and examples
- Use ${cbcInstructions.style || 'educational textbook'} style
- White background for printability
- Grade-appropriate for ${grade}
- Clear educational purpose

**VISUAL ELEMENTS TO INCLUDE:**
${(cbcInstructions.elements || ['main concept', 'key components', 'educational labels']).map((el, i) => `${i+1}. ${el}`).join('\n')}

Each diagram must teach the specific concepts from the learning outcomes and be immediately useful in a Kenyan classroom.`;

    return guidance;
  }

  /**
   * ✅ Generate SLO-based diagram placeholder
   */
  generateSLOBasedDiagramPlaceholder(conceptText, learningArea, grade, diagramNumber, weekNumber, sloList) {
    const cleanConcept = conceptText
      .replace(/^(identify|distinguish|explore|assess|analyze|analyse|examine|describe|explain|understand|learn about|study|construct|explain factors for)\s+/i, '')
      .trim();
    
    // Find relevant SLO for context
    const relevantSLO = sloList && sloList.length > 0 
      ? sloList.find(slo => slo && slo.toLowerCase().includes(cleanConcept.toLowerCase().substring(0, 30)))
      : null;

    const educationalPurpose = relevantSLO 
      ? `Help students achieve: ${relevantSLO.substring(0, 80)}`
      : `Visual aid to help ${grade} students understand ${cleanConcept.substring(0, 60)}`;

    // Get diagram instructions with SAFE GRADE
    const cbcInstructions = CBCDiagramInstructions.getDiagramInstructionsSafely(
      learningArea,
      '', // strand can be empty for concept-specific
      cleanConcept,
      grade, // Use the safe grade
      sloList || []
    );

    return `[DIAGRAM:{
  "description": "${cbcInstructions.description || `Educational diagram showing ${cleanConcept} for ${grade} students with Kenyan context`}",
  "caption": "Figure ${diagramNumber}: ${cleanConcept.substring(0, 80)}",
  "educationalPurpose": "${educationalPurpose}",
  "context": "Week ${weekNumber} learning concept aligned with CBC outcomes",
  "visualElements": ${JSON.stringify(cbcInstructions.elements || ['main concept', 'key components', 'educational labels'])},
  "labels": ${JSON.stringify(cbcInstructions.keyConcepts || this.getLabelsForConcept(cleanConcept))},
  "sloReference": "${relevantSLO || 'General learning outcome'}"
}]`;
  }

  /**
   * Get SLO-based diagram focus
   */
  getSLOBasedDiagramFocus(concept, sloList) {
    if (!sloList || sloList.length === 0) {
      return 'key components and relationships of this concept';
    }

    const conceptLower = concept.toLowerCase();
    
    // Find relevant SLO for this concept
    const relevantSLO = sloList.find(slo => 
      slo && slo.toLowerCase().includes(conceptLower.substring(0, 20))
    );

    if (relevantSLO) {
      const sloLower = relevantSLO.toLowerCase();
      if (sloLower.includes('describe')) {
        return 'clear visual representation with labeled components';
      }
      if (sloLower.includes('explain')) {
        return 'causal relationships and explanatory annotations';
      }
      if (sloLower.includes('compare')) {
        return 'side-by-side comparison with similarities and differences';
      }
      if (sloLower.includes('analyze')) {
        return 'detailed breakdown with analytical components';
      }
      if (sloLower.includes('process') || sloLower.includes('sequence')) {
        return 'step-by-step sequence with clear progression';
      }
      if (sloLower.includes('illustrate') || sloLower.includes('show')) {
        return 'visual demonstration with clear examples';
      }
    }

    return 'key components and relationships from the learning outcomes';
  }

  getLabelsForConcept(concept) {
    if (!concept) return ['Key Concept', 'Main Components', 'Important Features'];
    
    const conceptLower = concept.toLowerCase();
    
    if (conceptLower.includes('solar system') || conceptLower.includes('origin of the earth')) {
      return ['Sun', 'Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Asteroid Belt', 'Orbit'];
    }
    
    if (conceptLower.includes('internal structure')) {
      return ['Crust', 'Mantle', 'Outer Core', 'Inner Core', 'Lithosphere', 'Asthenosphere'];
    }
    
    if (conceptLower.includes('rotation') || conceptLower.includes('revolution')) {
      return ['Rotation Axis', 'Orbital Path', 'Seasons', 'Day/Night Cycle', 'Axial Tilt'];
    }
    
    return ['Key Concept', 'Main Components', 'Important Features', 'Educational Notes'];
  }

  shouldIncludeDiagramForWeek(weekIndex, totalWeeks) {
    if (!totalWeeks || totalWeeks <= 0) return false;
    
    // Only 2 diagrams maximum: first week and one in the middle
    if (totalWeeks <= 2) return weekIndex === 0;
    
    const middleWeek = Math.floor(totalWeeks / 2);
    return weekIndex === 0 || weekIndex === middleWeek;
  }

  escapeForPrompt(text) {
    if (!text) return '';
    return String(text).replace(/["'\\]/g, '\\$&').trim();
  }
}

module.exports = LessonNotesGenerator;