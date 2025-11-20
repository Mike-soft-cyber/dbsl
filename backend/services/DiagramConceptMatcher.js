// DiagramConceptMatcher.js - Intelligently match diagrams to learning concepts from breakdown

const CBCConceptVisualLibrary = require('./CBCConceptVisualLibrary');

class DiagramConceptMatcher {
  
  /**
   * ✅ Select best learning concepts for diagram generation
   * @param {Array} learningConcepts - Array of concepts from Lesson Concept Breakdown
   * @param {Number} maxDiagrams - Maximum number of diagrams to generate
   * @param {Object} cbcEntry - CBC entry with SLOs
   * @param {String} learningArea - Subject/Learning Area
   * @param {String} grade - Grade level
   * @returns {Array} Selected concepts with enhanced visual specifications
   */
  static selectConceptsForDiagrams(learningConcepts, maxDiagrams, cbcEntry, learningArea, grade) {
    console.log(`[DiagramMatcher] Analyzing ${learningConcepts.length} concepts for ${maxDiagrams} diagrams`);
    
    if (!learningConcepts || learningConcepts.length === 0) {
      console.warn('[DiagramMatcher] No learning concepts provided');
      return [];
    }

    // Step 1: Score each concept for visual potential
    const scoredConcepts = learningConcepts.map((concept, index) => {
      const visualScore = this.scoreConceptVisualPotential(
        concept.concept, 
        learningArea, 
        cbcEntry
      );
      
      return {
        ...concept,
        index,
        visualScore,
        visualSpec: this.getEnhancedVisualSpec(concept.concept, learningArea, grade)
      };
    });

    // Step 2: Sort by visual potential (highest first)
    scoredConcepts.sort((a, b) => b.visualScore - a.visualScore);

    // Step 3: Select top concepts ensuring variety across weeks
    const selectedConcepts = this.selectWithWeekVariety(
      scoredConcepts, 
      maxDiagrams
    );

    console.log('[DiagramMatcher] Selected concepts:');
    selectedConcepts.forEach((c, i) => {
      console.log(`  ${i+1}. ${c.week}: ${c.concept.substring(0, 50)}... (score: ${c.visualScore})`);
    });

    return selectedConcepts;
  }

  /**
   * ✅ Score a concept's visual potential (0-100)
   */
  static scoreConceptVisualPotential(concept, learningArea, cbcEntry) {
    let score = 50; // Base score
    const conceptLower = concept.toLowerCase();
    const learningAreaLower = learningArea.toLowerCase();

    // HIGH VISUAL POTENTIAL keywords (+20 points each)
    const highVisualKeywords = [
      // Universal high-visual
      'diagram', 'map', 'structure', 'parts', 'cycle', 'process', 'system',
      'comparison', 'types', 'classification', 'stages', 'growth', 'development',
      
      // Subject-specific high-visual
      // Science
      'plant', 'animal', 'body', 'organ', 'cell', 'experiment', 'apparatus',
      'ecosystem', 'food chain', 'life cycle', 'water cycle', 'energy',
      
      // Social Studies
      'weather', 'climate', 'seasons', 'county', 'counties', 'location',
      'historical sources', 'preservation', 'timeline', 'government structure',
      
      // Mathematics
      'shape', 'angle', 'measurement', 'graph', 'chart', 'pattern', 'symmetry',
      
      // Agriculture
      'farm', 'crop', 'livestock', 'tools', 'planting', 'harvest',
      
      // Home Science
      'nutrition', 'food groups', 'balanced diet', 'kitchen',
      
      // ICT
      'computer parts', 'keyboard', 'hardware', 'software'
    ];

    // MEDIUM VISUAL POTENTIAL (+10 points each)
    const mediumVisualKeywords = [
      'describe', 'identify', 'explain', 'demonstrate', 'show', 'illustrate',
      'elements', 'components', 'features', 'characteristics', 'factors',
      'methods', 'techniques', 'steps', 'procedures'
    ];

    // LOW VISUAL POTENTIAL (-10 points each)
    const lowVisualKeywords = [
      'discuss', 'debate', 'argue', 'opinion', 'perspective', 'viewpoint',
      'appreciate', 'value', 'recognize significance', 'understand importance'
    ];

    // Score based on keywords
    highVisualKeywords.forEach(keyword => {
      if (conceptLower.includes(keyword)) score += 20;
    });

    mediumVisualKeywords.forEach(keyword => {
      if (conceptLower.includes(keyword)) score += 10;
    });

    lowVisualKeywords.forEach(keyword => {
      if (conceptLower.includes(keyword)) score -= 10;
    });

    // SUBJECT-SPECIFIC BONUSES
    if (learningAreaLower.includes('science')) {
      // Science concepts are highly visual
      if (conceptLower.match(/\b(observe|experiment|investigate|examine)\b/)) score += 15;
      if (conceptLower.includes('using apparatus')) score += 25;
    }

    if (learningAreaLower.includes('social')) {
      // Geography and visual history are good
      if (conceptLower.match(/\b(map|location|weather|climate|historical sources)\b/)) score += 20;
      if (conceptLower.match(/\b(government|structure|organization)\b/)) score += 15;
    }

    if (learningAreaLower.includes('math')) {
      // Geometry and measurement are visual
      if (conceptLower.match(/\b(shape|angle|measure|graph|chart|pattern)\b/)) score += 20;
      if (conceptLower.match(/\b(calculate|solve|equation)\b/)) score -= 5; // Math solving is less visual
    }

    if (learningAreaLower.includes('agriculture')) {
      // Agriculture is very visual
      if (conceptLower.match(/\b(crop|plant|livestock|farm|tool|soil)\b/)) score += 20;
    }

    // CHECK PREDEFINED LIBRARY
    const hasLibrarySpec = CBCConceptVisualLibrary.getConceptVisual(concept, learningArea, 'Grade 7');
    if (hasLibrarySpec) {
      score += 30; // Big bonus for predefined specs
      console.log(`[DiagramMatcher] ✅ Found library spec for: ${concept.substring(0, 40)}`);
    }

    // SLO ANALYSIS - Check if related to visual SLOs
    if (cbcEntry?.slo) {
      const relatedSLOs = cbcEntry.slo.filter(slo => {
        const sloLower = slo.toLowerCase();
        return conceptLower.split(' ').some(word => 
          word.length > 4 && sloLower.includes(word)
        );
      });
      
      if (relatedSLOs.length > 0) {
        score += 10 * relatedSLOs.length; // Bonus for SLO alignment
      }
    }

    // Ensure score is within bounds
    return Math.max(0, Math.min(100, score));
  }

  /**
   * ✅ Select concepts with variety across weeks
   */
  static selectWithWeekVariety(scoredConcepts, maxDiagrams) {
    const selected = [];
    const weeksUsed = new Set();

    // First pass: Pick top-scoring concepts from different weeks
    for (const concept of scoredConcepts) {
      if (selected.length >= maxDiagrams) break;
      
      const weekNum = this.extractWeekNumber(concept.week);
      
      // Prefer spreading diagrams across different weeks
      if (!weeksUsed.has(weekNum) && concept.visualScore > 60) {
        selected.push(concept);
        weeksUsed.add(weekNum);
      }
    }

    // Second pass: Fill remaining slots with highest scores regardless of week
    if (selected.length < maxDiagrams) {
      for (const concept of scoredConcepts) {
        if (selected.length >= maxDiagrams) break;
        if (!selected.includes(concept) && concept.visualScore > 50) {
          selected.push(concept);
        }
      }
    }

    // Final pass: If still not enough, take any remaining
    if (selected.length < maxDiagrams) {
      for (const concept of scoredConcepts) {
        if (selected.length >= maxDiagrams) break;
        if (!selected.includes(concept)) {
          selected.push(concept);
        }
      }
    }

    return selected;
  }

  /**
   * ✅ Extract week number from week string
   */
  static extractWeekNumber(weekStr) {
    if (!weekStr) return 0;
    const match = weekStr.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  }

  /**
   * ✅ Get enhanced visual specification for a concept
   */
  static getEnhancedVisualSpec(concept, learningArea, grade) {
    // Check library first
    const librarySpec = CBCConceptVisualLibrary.getConceptVisual(concept, learningArea, grade);
    if (librarySpec) {
      return {
        source: 'library',
        spec: librarySpec,
        enhanced: true
      };
    }

    // Generate intelligent spec based on concept analysis
    return {
      source: 'generated',
      spec: this.generateIntelligentSpec(concept, learningArea, grade),
      enhanced: true
    };
  }

  /**
   * ✅ Generate intelligent visual specification
   */
  static generateIntelligentSpec(concept, learningArea, grade) {
    const conceptLower = concept.toLowerCase();
    const learningAreaLower = learningArea.toLowerCase();

    // Determine diagram type
    let diagramType = 'educational_diagram';
    let layoutType = 'centered_with_labels';
    let keyElements = [];

    // SCIENCE PATTERNS
    if (learningAreaLower.includes('science')) {
      if (conceptLower.match(/\b(plant|crop|vegetation|tree)\b/)) {
        diagramType = 'botanical_diagram';
        layoutType = 'labeled_specimen';
        keyElements = ['roots', 'stem', 'leaves', 'flowers/fruits', 'labels with functions'];
      }
      else if (conceptLower.match(/\b(animal|mammal|bird|insect)\b/)) {
        diagramType = 'zoological_diagram';
        layoutType = 'labeled_specimen';
        keyElements = ['body parts', 'habitat indication', 'diet indicators', 'labels'];
      }
      else if (conceptLower.match(/\b(cycle|process|stages)\b/)) {
        diagramType = 'process_cycle';
        layoutType = 'circular_flow';
        keyElements = ['sequential stages', 'arrows showing flow', 'stage labels', 'Kenyan context'];
      }
      else if (conceptLower.match(/\b(experiment|apparatus|equipment)\b/)) {
        diagramType = 'experimental_setup';
        layoutType = 'labeled_equipment';
        keyElements = ['apparatus pieces', 'safety equipment', 'procedure indicators', 'labels'];
      }
    }

    // SOCIAL STUDIES PATTERNS
    else if (learningAreaLower.includes('social')) {
      if (conceptLower.match(/\b(map|location|geography|county|counties)\b/)) {
        diagramType = 'geographical_map';
        layoutType = 'map_with_legend';
        keyElements = ['map boundaries', 'labels', 'compass rose', 'scale', 'legend', 'key features'];
      }
      else if (conceptLower.match(/\b(weather|climate|seasons)\b/)) {
        diagramType = 'meteorological_diagram';
        layoutType = 'instrument_showcase';
        keyElements = ['weather instruments', 'measurement indicators', 'Kenyan climate zones', 'labels'];
      }
      else if (conceptLower.match(/\b(historical|source|artifact|preservation)\b/)) {
        diagramType = 'historical_classification';
        layoutType = 'categorized_sections';
        keyElements = ['primary sources', 'secondary sources', 'Kenyan examples', 'category labels'];
      }
      else if (conceptLower.match(/\b(government|structure|organization|system)\b/)) {
        diagramType = 'organizational_chart';
        layoutType = 'hierarchical_structure';
        keyElements = ['levels of organization', 'connecting lines', 'role labels', 'Kenyan context'];
      }
      else if (conceptLower.match(/\b(timeline|history|chronology)\b/)) {
        diagramType = 'historical_timeline';
        layoutType = 'chronological_sequence';
        keyElements = ['time periods', 'key events', 'dates', 'Kenyan historical markers'];
      }
    }

    // MATHEMATICS PATTERNS
    else if (learningAreaLower.includes('math')) {
      if (conceptLower.match(/\b(shape|geometry|angle|triangle|square|circle)\b/)) {
        diagramType = 'geometric_diagram';
        layoutType = 'geometric_showcase';
        keyElements = ['shapes with measurements', 'angles marked', 'properties labeled', 'examples'];
      }
      else if (conceptLower.match(/\b(graph|chart|data|statistics)\b/)) {
        diagramType = 'data_visualization';
        layoutType = 'graph_or_chart';
        keyElements = ['axes with labels', 'data points', 'title', 'scale', 'Kenyan data context'];
      }
      else if (conceptLower.match(/\b(fraction|decimal|percentage)\b/)) {
        diagramType = 'fraction_diagram';
        layoutType = 'partitioned_visuals';
        keyElements = ['whole divided into parts', 'shaded sections', 'fraction notation', 'examples'];
      }
      else if (conceptLower.match(/\b(measurement|length|weight|volume)\b/)) {
        diagramType = 'measurement_diagram';
        layoutType = 'tool_and_examples';
        keyElements = ['measuring tools', 'units labeled', 'Kenyan objects measured', 'scale indicators'];
      }
    }

    // AGRICULTURE PATTERNS
    else if (learningAreaLower.includes('agriculture')) {
      if (conceptLower.match(/\b(crop|plant|maize|bean|vegetable)\b/)) {
        diagramType = 'crop_diagram';
        layoutType = 'growth_stages';
        keyElements = ['planting to harvest stages', 'Kenyan crops', 'timeline', 'labels'];
      }
      else if (conceptLower.match(/\b(farm|layout|shamba)\b/)) {
        diagramType = 'farm_layout';
        layoutType = 'aerial_view';
        keyElements = ['farm sections', 'crops/livestock areas', 'Kenyan farm context', 'labels'];
      }
      else if (conceptLower.match(/\b(tool|equipment|jembe|panga)\b/)) {
        diagramType = 'tool_showcase';
        layoutType = 'grid_of_tools';
        keyElements = ['farm tools illustrated', 'names in English/Swahili', 'usage indicators', 'labels'];
      }
      else if (conceptLower.match(/\b(livestock|animal|chicken|cow|goat)\b/)) {
        diagramType = 'livestock_diagram';
        layoutType = 'animal_with_features';
        keyElements = ['animal illustration', 'products from animal', 'care requirements', 'labels'];
      }
    }

    // HOME SCIENCE PATTERNS
    else if (learningAreaLower.includes('home science') || learningAreaLower.includes('nutrition')) {
      if (conceptLower.match(/\b(food|nutrition|balanced diet|meal)\b/)) {
        diagramType = 'nutrition_diagram';
        layoutType = 'food_plate_or_pyramid';
        keyElements = ['food groups', 'Kenyan foods', 'portions', 'balanced meal example', 'labels'];
      }
      else if (conceptLower.match(/\b(hygiene|cleanliness|sanitation)\b/)) {
        diagramType = 'hygiene_steps';
        layoutType = 'step_by_step';
        keyElements = ['hygiene steps illustrated', 'Kenyan context', 'safety symbols', 'labels'];
      }
    }

    // ICT/COMPUTER PATTERNS
    else if (learningAreaLower.includes('computer') || learningAreaLower.includes('ict')) {
      if (conceptLower.match(/\b(parts|components|hardware)\b/)) {
        diagramType = 'computer_diagram';
        layoutType = 'labeled_device';
        keyElements = ['computer parts', 'input/output indicators', 'labels with functions', 'Kenyan school lab'];
      }
      else if (conceptLower.match(/\b(internet|safety|online)\b/)) {
        diagramType = 'safety_infographic';
        layoutType = 'do_and_dont';
        keyElements = ['safety rules', 'icons', 'Kenyan student context', 'clear warnings'];
      }
    }

    return {
      diagramType,
      layoutType,
      keyElements,
      conceptFocus: concept,
      kenyanContextRequired: true,
      gradeAppropriate: grade
    };
  }

  /**
   * ✅ Build enhanced prompt for matched concept
   */
  static buildEnhancedPromptForConcept(selectedConcept, options) {
    const { grade, learningArea, strand, substrand } = options;
    const visualSpec = selectedConcept.visualSpec;

    if (visualSpec.source === 'library') {
      // Use the detailed library specification
      return this.buildPromptFromLibrarySpec(visualSpec.spec, selectedConcept, options);
    } else {
      // Use the generated intelligent spec
      return this.buildPromptFromGeneratedSpec(visualSpec.spec, selectedConcept, options);
    }
  }

  /**
   * ✅ Build prompt from library specification
   */
  static buildPromptFromLibrarySpec(librarySpec, concept, options) {
    const { grade, learningArea, strand, substrand } = options;

    return `
Create a professional educational diagram for the Kenyan Competency Based Curriculum (CBC).

## LESSON CONTEXT
- Week: ${concept.week}
- Learning Concept: "${concept.concept}"
- Grade: ${grade}
- Subject: ${learningArea}
- Strand: ${strand}
- Sub-strand: ${substrand}

## PREDEFINED VISUAL SPECIFICATION
**Diagram Type:** ${librarySpec.visualType}
**Title:** ${librarySpec.title}
**Layout Style:** ${librarySpec.layout}

**Key Elements to Include:**
${librarySpec.elements.map((el, i) => `${i+1}. ${el}`).join('\n')}

**Kenyan Context:** ${librarySpec.kenyanContext}
**Color Scheme:** ${librarySpec.colorScheme}
**Background:** ${librarySpec.background}
**Label Style:** ${librarySpec.labelStyle}

## GRADE-SPECIFIC ADAPTATIONS
- Detail Level: ${librarySpec.detailLevel}
- Maximum Elements: ${librarySpec.maxElements}
- Label Complexity: ${librarySpec.labelComplexity} words maximum per label

## CRITICAL REQUIREMENTS
✅ This diagram MUST directly illustrate: "${concept.concept}"
✅ Use ONLY Kenyan examples and context
✅ Follow the layout style: ${librarySpec.layout}
✅ Include all key elements listed above
✅ Make it appropriate for ${grade} students
✅ Ensure printability (white background, high contrast)

## OUTPUT GOAL
A professional educational diagram that a ${grade} teacher can use to teach "${concept.concept}" in ${concept.week}.
`;
  }

  /**
   * ✅ Build prompt from generated specification
   */
  static buildPromptFromGeneratedSpec(generatedSpec, concept, options) {
    const { grade, learningArea, strand, substrand } = options;

    return `
Create a professional educational diagram for the Kenyan Competency Based Curriculum (CBC).

## LESSON CONTEXT
- Week: ${concept.week}
- Learning Concept: "${concept.concept}"
- Grade: ${grade}
- Subject: ${learningArea}
- Strand: ${strand}
- Sub-strand: ${substrand}

## INTELLIGENT VISUAL SPECIFICATION
**Diagram Type:** ${generatedSpec.diagramType}
**Layout Style:** ${generatedSpec.layoutType}
**Concept Focus:** ${generatedSpec.conceptFocus}

**Key Visual Elements:**
${generatedSpec.keyElements.map((el, i) => `${i+1}. ${el}`).join('\n')}

## KENYAN CONTEXT REQUIREMENTS
- Use recognizable Kenyan examples
- Include locally relevant illustrations
- Show Kenyan school, home, or community settings
- Use Kenyan crops, animals, landmarks where relevant
- Include Swahili terms where culturally appropriate

## GRADE-APPROPRIATE DESIGN (${grade})
- Visual complexity: Suitable for ${grade} comprehension level
- Label text: Clear, concise, age-appropriate vocabulary
- Color scheme: High contrast, printer-friendly
- Layout: Organized and easy to follow

## CRITICAL REQUIREMENTS
✅ This diagram MUST directly teach: "${concept.concept}"
✅ Follow the ${generatedSpec.layoutType} layout
✅ Include all key elements listed above
✅ Use white or very light background for printing
✅ Bold, horizontal labels (no diagonal text)
✅ Show clear relationships between elements with arrows
✅ Make it immediately useful in a Kenyan ${grade} classroom

## OUTPUT GOAL
A clear, educational diagram that helps ${grade} students understand "${concept.concept}" in the context of ${learningArea} - ${substrand}.
`;
  }

  /**
   * ✅ Format concept for diagram caption
   */
  static formatConceptCaption(concept, index) {
    // Clean up concept text for caption
    let cleanConcept = concept.concept
      .replace(/^(Describe|Explain|Identify|Analyze|Examine|Demonstrate|Show|Illustrate)\s+/i, '')
      .trim();
    
    // Capitalize first letter
    cleanConcept = cleanConcept.charAt(0).toUpperCase() + cleanConcept.slice(1);
    
    // Limit length for caption
    if (cleanConcept.length > 80) {
      cleanConcept = cleanConcept.substring(0, 77) + '...';
    }
    
    return `Figure ${index + 1}: ${cleanConcept} (${concept.week})`;
  }
}

module.exports = DiagramConceptMatcher;