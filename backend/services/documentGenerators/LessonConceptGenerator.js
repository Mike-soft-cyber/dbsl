// EnhancedLessonConceptGenerator.js - WITH PERFECT WEB REFERENCE INTEGRATION

const BaseDocumentGenerator = require('./BaseDocumentGenerator');

class EnhancedLessonConceptGenerator extends BaseDocumentGenerator {
  constructor() {
    super('Lesson Concept Breakdown');
  }

  createPrompt(requestData, cbcEntry) {
    const { school, teacherName, grade, learningArea, strand, substrand, term, weeks, lessonsPerWeek } = requestData;
    
    const safeWeeks = weeks || 12;
    const safeLessonsPerWeek = lessonsPerWeek || 5;
    
    const sloList = cbcEntry?.slo || [];
    
    if (!sloList || sloList.length === 0) {
      throw new Error('No Specific Learning Outcomes (SLOs) found in CBC entry.');
    }
    
    console.log(`[LessonConcept] Found ${sloList.length} SLOs to use as learning concepts`);
    
    const learningExperiences = cbcEntry?.learningExperiences || [];
    const keyInquiryQuestions = cbcEntry?.keyInquiryQuestions || [];
    const resources = cbcEntry?.resources || [];
    const assessmentCriteria = cbcEntry?.assessment || [];
    const reflectionNotes = cbcEntry?.reflection || [];
    const noOfLessons = cbcEntry?.noOfLessons || sloList.length;

    const hasResources = resources && resources.length > 0;
    const hasReflections = reflectionNotes && reflectionNotes.length > 0;

    const totalSLOs = sloList.length;
    const weeksNeeded = Math.ceil(totalSLOs / safeLessonsPerWeek);
    const actualWeeks = Math.max(safeWeeks, weeksNeeded);

    // ✅ Generate ENHANCED per-concept diagram placeholders with better metadata
    const perConceptReferences = this.generateEnhancedPerConceptReferences(
      sloList, 
      learningArea, 
      substrand, 
      grade,
      actualWeeks,
      safeLessonsPerWeek
    );

    return `Generate a Lesson Concept Breakdown with a properly formatted markdown table, followed by enhanced visual resource placeholders for EACH concept.

SCHOOL: ${this.escapeForPrompt(school)}
FACILITATOR: ${this.escapeForPrompt(teacherName)}
GRADE: ${this.escapeForPrompt(grade)}
SUBJECT: ${this.escapeForPrompt(learningArea)}
TERM: ${this.escapeForPrompt(term)}
WEEKS: ${actualWeeks}
LESSONS PER WEEK: ${safeLessonsPerWeek}
TOTAL LESSONS: ${totalSLOs}
CBC LESSONS REFERENCE: ${noOfLessons}

## CBC FRAMEWORK ALIGNMENT:

### ✅ SPECIFIC LEARNING OUTCOMES (USE THESE AS LEARNING CONCEPTS):
${sloList.map((slo, i) => `${i+1}. ${slo}`).join('\n')}

### LEARNING EXPERIENCES TO REFERENCE:
${learningExperiences.map((exp, i) => `${i+1}. ${exp}`).join('\n')}

### KEY INQUIRY QUESTIONS FOR CONTEXT:
${keyInquiryQuestions.map((q, i) => `${i+1}. ${q}`).join('\n')}

### ASSESSMENT SKILLS TO DEVELOP:
${assessmentCriteria.map((criteria, i) => `${i+1}. ${criteria.skill}`).join('\n')}

${hasResources ? `### AVAILABLE RESOURCES:
${resources.map((resource, i) => `${i+1}. ${resource}`).join('\n')}` : `### SUGGESTED RESOURCES:
Create 5 specific teaching resources for ${this.escapeForPrompt(substrand)}.`}

${hasReflections ? `### REFLECTION FRAMEWORK:
${reflectionNotes.map((note, i) => `${i+1}. ${note}`).join('\n')}` : `### REFLECTION POINTS:
Create 4 reflection points for evaluating lesson effectiveness.`}

## 🎯 CRITICAL INSTRUCTION: USE SLOs AS LEARNING CONCEPTS

You have ${totalSLOs} Specific Learning Outcomes. These ARE the learning concepts.

## TABLE FORMAT:

Generate the table with this EXACT structure:

| Term | Week | Strand | Sub-strand | Learning Concept |
|------|------|--------|------------|------------------|
| ${term} | Week 1 | ${this.escapeForPrompt(strand)} | ${this.escapeForPrompt(substrand)} | [First SLO exactly as written] |
| ${term} | Week 1 | ${this.escapeForPrompt(strand)} | ${this.escapeForPrompt(substrand)} | [Second SLO exactly as written] |

[Continue for all ${totalSLOs} SLOs...]

## DISTRIBUTION ACROSS WEEKS:
${this.generateWeekDistribution(sloList, actualWeeks, safeLessonsPerWeek)}

## CRITICAL REQUIREMENTS:

✅ DO:
- Use EACH SLO from the list EXACTLY ONCE
- Keep SLO text unchanged (no paraphrasing)
- Output table first
- Each row on ONE LINE
- Use pipe (|) to separate columns
- Distribute across ${actualWeeks} weeks

❌ DON'T:
- Create new concepts
- Modify SLO text
- Split cells across lines
- Skip any SLOs

---

## 🌐 ENHANCED VISUAL RESOURCES FOR EACH CONCEPT

After the table, add the following ENHANCED web reference placeholders for EACH learning concept.

These placeholders will be replaced with MULTIPLE high-quality educational resources from:
- 🇰🇪 KICD (Kenya Institute of Curriculum Development) - PRIORITY
- 📚 Educational encyclopedias (Wikipedia, Britannica, National Geographic)
- 🎓 Learning platforms (Khan Academy, BBC Bitesize)
- 🎥 Educational videos (YouTube Education)
- 🖼️ Diagram collections and curriculum resources

${perConceptReferences}

**IMPORTANT:** 
- Include ALL ${totalSLOs} enhanced diagram placeholders above
- Each concept will receive up to 3 curated resources from multiple sources
- Resources are ranked by relevance and quality
- Kenyan/CBC resources are prioritized when available
- If no suitable resources found for a concept, that section will be automatically removed

---

OUTPUT STRUCTURE:

1. **First**: Output the complete table (${totalSLOs} rows)
2. **Then**: Output the ${totalSLOs} enhanced diagram placeholders exactly as shown above
3. Do not add any other content

Begin now:`;
  }

  /**
   * ✅ ENHANCED: Generate diagram placeholder for EACH learning concept with rich metadata
   */
  generateEnhancedPerConceptReferences(sloList, learningArea, substrand, grade, weeks, lessonsPerWeek) {
    let references = '';
    let sloIndex = 0;
    const avgPerWeek = Math.ceil(sloList.length / weeks);
    
    for (let week = 1; week <= weeks && sloIndex < sloList.length; week++) {
      const slosThisWeek = Math.min(avgPerWeek, sloList.length - sloIndex);
      const weekSLOs = sloList.slice(sloIndex, sloIndex + slosThisWeek);
      
      weekSLOs.forEach((slo, conceptIndex) => {
        const globalIndex = sloIndex + conceptIndex + 1;
        
        // Extract QUALITY search terms
        const searchTerms = this.extractQualitySearchTerms(slo, substrand, learningArea);
        
        // Determine concept type for targeted search
        const conceptType = this.determineConceptType(slo, learningArea);
        
        references += `
---

### Week ${week} - Concept ${conceptIndex + 1}: Visual Resources

[DIAGRAM:{
  "description": "Educational resource for: ${slo}",
  "caption": "Figure ${globalIndex}: ${slo.substring(0, 80)}${slo.length > 80 ? '...' : ''}",
  "week": "Week ${week}",
  "conceptNumber": ${globalIndex},
  "searchKeywords": ${JSON.stringify(searchTerms)},
  "conceptType": "${conceptType}",
  "substrand": "${substrand}",
  "learningArea": "${learningArea}",
  "grade": "${this.extractGradeNumber(grade)}",
  "educationalPurpose": "Multi-source visual aids to help students understand: ${slo.substring(0, 100)}",
  "context": "Supports learning concept ${globalIndex} in ${substrand} - ${learningArea}"
}]

`;
      });
      
      sloIndex += slosThisWeek;
    }
    
    return references;
  }

  /**
   * ✅ ENHANCED: Extract QUALITY search terms with smart filtering
   */
  extractQualitySearchTerms(slo, substrand, learningArea) {
    // Remove action verbs
    const cleaned = slo
      .replace(/^(Identify|Describe|Explain|Analyze|Analyse|Explore|Assess|Distinguish|Compare|Contrast|Evaluate|Demonstrate|Understand|Learn about|Examine|Illustrate|Appreciate|Construct|Create|Define|State|Investigate)\s+/i, '')
      .toLowerCase();
    
    // Enhanced filler word list
    const fillerWords = [
      'the', 'and', 'or', 'for', 'with', 'from', 'about', 'that', 'this', 'their',
      'have', 'been', 'were', 'will', 'can', 'should', 'would', 'could', 'may',
      'might', 'must', 'shall', 'of', 'in', 'on', 'at', 'to', 'as', 'by', 'an',
      'a', 'is', 'are', 'was', 'be', 'being', 'has', 'had', 'do', 'does', 'did',
      'using', 'use', 'used', 'make', 'made', 'making', 'day', 'up', 'out', 'into',
      'through', 'over', 'under', 'between', 'among', 'within', 'without'
    ];
    
    // Extract meaningful words (4+ chars, not filler)
    const words = cleaned
      .split(/\s+/)
      .filter(word => word.length >= 4 && !fillerWords.includes(word));
    
    // Build search term array with priority
    const searchTerms = [
      learningArea,        // Always include subject
      substrand,          // Always include substrand
      ...words.slice(0, 4) // Top 4 concept words
    ];
    
    // Add common diagram terms based on concept
    if (cleaned.includes('diagram') || cleaned.includes('illustration')) {
      searchTerms.push('diagram', 'illustration');
    }
    if (cleaned.includes('map') || cleaned.includes('location')) {
      searchTerms.push('map', 'geography');
    }
    if (cleaned.includes('weather') || cleaned.includes('climate')) {
      searchTerms.push('weather', 'meteorology');
    }
    if (cleaned.includes('experiment') || cleaned.includes('practical')) {
      searchTerms.push('experiment', 'demonstration');
    }
    
    // Add curriculum context
    searchTerms.push('Kenya', 'CBC', 'curriculum', 'educational');
    
    return [...new Set(searchTerms)].slice(0, 10); // Deduplicate, max 10 terms
  }

  /**
   * ✅ NEW: Determine concept type for targeted search
   */
  determineConceptType(slo, learningArea) {
    const sloLower = slo.toLowerCase();
    const areaLower = learningArea.toLowerCase();
    
    // Geography/Social Studies
    if (areaLower.includes('social')) {
      if (sloLower.includes('map') || sloLower.includes('location')) return 'geographical_map';
      if (sloLower.includes('weather') || sloLower.includes('climate')) return 'meteorological_diagram';
      if (sloLower.includes('historical') || sloLower.includes('timeline')) return 'historical_content';
      if (sloLower.includes('government') || sloLower.includes('structure')) return 'organizational_chart';
      return 'social_studies_visual';
    }
    
    // Science
    if (areaLower.includes('science')) {
      if (sloLower.includes('experiment') || sloLower.includes('apparatus')) return 'experimental_setup';
      if (sloLower.includes('plant') || sloLower.includes('animal')) return 'biological_diagram';
      if (sloLower.includes('cycle') || sloLower.includes('process')) return 'process_diagram';
      return 'scientific_illustration';
    }
    
    // Mathematics
    if (areaLower.includes('math')) {
      if (sloLower.includes('shape') || sloLower.includes('geometry')) return 'geometric_diagram';
      if (sloLower.includes('graph') || sloLower.includes('chart')) return 'data_visualization';
      if (sloLower.includes('fraction') || sloLower.includes('decimal')) return 'fraction_diagram';
      return 'mathematical_diagram';
    }
    
    // Agriculture
    if (areaLower.includes('agriculture')) {
      if (sloLower.includes('crop') || sloLower.includes('plant')) return 'crop_diagram';
      if (sloLower.includes('farm') || sloLower.includes('layout')) return 'farm_layout';
      if (sloLower.includes('tool') || sloLower.includes('equipment')) return 'tool_showcase';
      return 'agricultural_visual';
    }
    
    return 'educational_diagram';
  }

  /**
   * ✅ Extract numeric grade for search
   */
  extractGradeNumber(grade) {
    const match = grade.match(/\d+/);
    return match ? match[0] : '7';
  }

  /**
   * ✅ Generate week distribution summary
   */
  generateWeekDistribution(sloList, weeks, lessonsPerWeek) {
    const totalSLOs = sloList.length;
    const avgPerWeek = Math.ceil(totalSLOs / weeks);
    
    let distribution = '';
    let sloIndex = 0;
    
    for (let week = 1; week <= weeks && sloIndex < totalSLOs; week++) {
      const slosThisWeek = Math.min(avgPerWeek, totalSLOs - sloIndex);
      const weekSLOs = sloList.slice(sloIndex, sloIndex + slosThisWeek);
      
      distribution += `\n**Week ${week}** (${slosThisWeek} concepts - ${slosThisWeek} visual resource sets):\n`;
      weekSLOs.forEach((slo, i) => {
        const conceptNum = sloIndex + i + 1;
        const shortSlo = slo.substring(0, 70) + (slo.length > 70 ? '...' : '');
        distribution += `  ${conceptNum}. ${shortSlo}\n`;
      });
      
      sloIndex += slosThisWeek;
    }
    
    distribution += `\n**TOTAL: ${totalSLOs} concepts × 3 sources each = Up to ${totalSLOs * 3} curated educational resources**\n`;
    
    return distribution;
  }
}

module.exports = EnhancedLessonConceptGenerator;