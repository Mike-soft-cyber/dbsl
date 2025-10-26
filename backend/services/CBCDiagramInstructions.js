// CBCDiagramInstructions.js - COMPREHENSIVE SLO-BASED DIAGRAM GENERATION

class CBCDiagramInstructions {
  /**
   * Get specific diagram instructions for a substrand with SLO analysis
   */
  static getDiagramInstructions(learningArea, strand, substrand, grade, sloArray = []) {
    // First try SLO-based analysis (most accurate)
    if (sloArray && sloArray.length > 0) {
      console.log(`[CBCDiagrams] 🔍 Analyzing ${sloArray.length} SLOs for diagram generation`);
      const sloBasedInstructions = this.analyzeSLOForDiagram(sloArray, learningArea, strand, substrand);
      
      if (sloBasedInstructions && sloBasedInstructions.sloBased) {
        console.log(`[CBCDiagrams] ✅ Using SLO-based diagram instructions for: ${substrand}`);
        return this.formatInstructions(sloBasedInstructions, grade);
      }
    }

    // Fallback to database lookup
    const key = this.generateKey(learningArea, strand, substrand);
    const instructions = this.DIAGRAM_DATABASE[key];
    
    if (instructions) {
      console.log(`[CBCDiagrams] ✓ Found specific instructions for: ${substrand}`);
      return this.formatInstructions(instructions, grade);
    }
    
    // Try broader matching
    const broadMatch = this.findBroadMatch(learningArea, substrand);
    if (broadMatch) {
      console.log(`[CBCDiagrams] ≈ Using broad match for: ${substrand}`);
      return this.formatInstructions(broadMatch, grade);
    }
    
    console.log(`[CBCDiagrams] ! No specific instructions, using generic for: ${substrand}`);
    return this.getGenericInstructions(learningArea, grade);
  }

  /**
   * ✅ NEW: Analyze SLO to determine diagram type and content
   */
  static analyzeSLOForDiagram(sloArray, learningArea, strand, substrand) {
    if (!sloArray || sloArray.length === 0) {
      return this.getGenericInstructions(learningArea, 'general');
    }

    // Combine all SLOs for analysis
    const combinedSLO = sloArray.join(' ').toLowerCase();
    
    console.log(`[SLO Analysis] Analyzing ${sloArray.length} SLOs for diagram type`);
    console.log(`[SLO Analysis] Sample SLO: ${sloArray[0]?.substring(0, 100)}...`);

    // Determine diagram type based on SLO content
    const diagramType = this.determineDiagramTypeFromSLO(combinedSLO, learningArea);
    const keyConcepts = this.extractKeyConceptsFromSLO(sloArray);
    const complexity = this.assessSLOComplexity(sloArray);

    return {
      type: diagramType,
      description: this.generateDiagramDescription(diagramType, keyConcepts, learningArea, substrand),
      elements: this.getDiagramElements(diagramType, keyConcepts),
      style: this.getDiagramStyle(diagramType, learningArea),
      visualComplexity: this.getVisualComplexity(this.getGradeLevel(grade)),
      labelSize: this.getLabelSize(this.getGradeLevel(grade)),
      colorScheme: this.getColorScheme(this.getGradeLevel(grade)),
      gradeLevel: this.getGradeLevel(grade),
      priority: 'high',
      keyConcepts: keyConcepts,
      sloBased: true,
      complexity: complexity,
      isGeneric: false
    };
  }

  /**
   * ✅ NEW: Determine diagram type from SLO content
   */
  static determineDiagramTypeFromSLO(sloText, learningArea) {
    const sloLower = sloText.toLowerCase();
    const learningAreaLower = learningArea.toLowerCase();

    // Social Studies patterns
    if (learningAreaLower.includes('social')) {
      if (sloLower.includes('map') || sloLower.includes('location') || sloLower.includes('geography')) {
        return 'geographical_map';
      }
      if (sloLower.includes('weather') || sloLower.includes('climate') || sloLower.includes('temperature')) {
        return 'meteorological_chart';
      }
      if (sloLower.includes('population') || sloLower.includes('settlement') || sloLower.includes('demographic')) {
        return 'demographic_infographic';
      }
      if (sloLower.includes('government') || sloLower.includes('structure') || sloLower.includes('organization')) {
        return 'organizational_chart';
      }
      if (sloLower.includes('historical') || sloLower.includes('timeline') || sloLower.includes('ancient')) {
        return 'historical_timeline';
      }
      if (sloLower.includes('economic') || sloLower.includes('trade') || sloLower.includes('business')) {
        return 'economic_diagram';
      }
      return 'conceptual_infographic';
    }

    // Science patterns
    if (learningAreaLower.includes('science')) {
      if (sloLower.includes('cell') || sloLower.includes('organism') || sloLower.includes('biological')) {
        return 'biological_diagram';
      }
      if (sloLower.includes('energy') || sloLower.includes('force') || sloLower.includes('motion')) {
        return 'physics_diagram';
      }
      if (sloLower.includes('chemical') || sloLower.includes('reaction') || sloLower.includes('element')) {
        return 'chemical_diagram';
      }
      if (sloLower.includes('ecosystem') || sloLower.includes('environment') || sloLower.includes('habitat')) {
        return 'ecological_diagram';
      }
      if (sloLower.includes('human body') || sloLower.includes('organ') || sloLower.includes('system')) {
        return 'anatomical_diagram';
      }
      return 'scientific_illustration';
    }

    // Mathematics patterns
    if (learningAreaLower.includes('math')) {
      if (sloLower.includes('geometry') || sloLower.includes('shape') || sloLower.includes('angle')) {
        return 'geometric_diagram';
      }
      if (sloLower.includes('algebra') || sloLower.includes('equation') || sloLower.includes('variable')) {
        return 'algebraic_diagram';
      }
      if (sloLower.includes('graph') || sloLower.includes('chart') || sloLower.includes('data')) {
        return 'data_visualization';
      }
      if (sloLower.includes('measurement') || sloLower.includes('unit') || sloLower.includes('convert')) {
        return 'measurement_diagram';
      }
      return 'mathematical_illustration';
    }

    // Languages patterns
    if (learningAreaLower.includes('english') || learningAreaLower.includes('kiswahili')) {
      if (sloLower.includes('grammar') || sloLower.includes('sentence') || sloLower.includes('structure')) {
        return 'linguistic_diagram';
      }
      if (sloLower.includes('composition') || sloLower.includes('writing') || sloLower.includes('essay')) {
        return 'writing_process_chart';
      }
      return 'language_infographic';
    }

    // Default based on verb analysis
    if (sloLower.includes('describe') || sloLower.includes('explain') || sloLower.includes('identify')) {
      return 'descriptive_diagram';
    }
    if (sloLower.includes('compare') || sloLower.includes('contrast') || sloLower.includes('difference')) {
      return 'comparison_chart';
    }
    if (sloLower.includes('process') || sloLower.includes('step') || sloLower.includes('sequence')) {
      return 'process_flowchart';
    }
    if (sloLower.includes('classify') || sloLower.includes('categorize') || sloLower.includes('group')) {
      return 'classification_diagram';
    }

    return 'educational_infographic';
  }

  /**
   * ✅ NEW: Extract key concepts from SLO array
   */
  static extractKeyConceptsFromSLO(sloArray) {
    const concepts = new Set();
    
    sloArray.forEach(slo => {
      const sloLower = slo.toLowerCase();
      
      // Remove common verbs and extract nouns/key phrases
      const cleaned = sloLower
        .replace(/(describe|explain|identify|analyze|compare|contrast|classify|demonstrate|understand|learn about)\s+/g, '')
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .trim();
      
      // Extract meaningful words (3+ characters)
      const words = cleaned.split(/\s+/)
        .filter(word => word.length > 3)
        .slice(0, 5);
      
      words.forEach(word => concepts.add(word));
    });

    return Array.from(concepts);
  }

  /**
   * ✅ NEW: Assess complexity of SLOs
   */
  static assessSLOComplexity(sloArray) {
    let complexityScore = 0;
    
    sloArray.forEach(slo => {
      // Word count complexity
      if (slo.split(/\s+/).length > 15) complexityScore += 1;
      
      // Conceptual complexity indicators
      if (slo.toLowerCase().includes('analyze') || slo.toLowerCase().includes('evaluate')) complexityScore += 2;
      if (slo.toLowerCase().includes('compare') || slo.toLowerCase().includes('contrast')) complexityScore += 1;
      if (slo.toLowerCase().includes('create') || slo.toLowerCase().includes('design')) complexityScore += 1;
      if (slo.toLowerCase().includes('relationship') || slo.toLowerCase().includes('interaction')) complexityScore += 1;
    });

    if (complexityScore >= 4) return 'high';
    if (complexityScore >= 2) return 'medium';
    return 'low';
  }

  /**
   * ✅ NEW: Generate diagram description based on analysis
   */
  static generateDiagramDescription(diagramType, keyConcepts, learningArea, substrand) {
    const conceptString = keyConcepts.slice(0, 3).join(', ');
    
    const descriptions = {
      geographical_map: `Detailed map showing ${conceptString} with Kenyan geographical context, clear labels, and relevant features for ${substrand}`,
      meteorological_chart: `Weather and climate diagram showing ${conceptString} with measurement instruments, data visualization, and Kenyan weather patterns`,
      demographic_infographic: `Population and settlement diagram showing ${conceptString} with statistics, distribution patterns, and Kenyan demographic context`,
      organizational_chart: `Structure diagram showing ${conceptString} with hierarchy, relationships, and Kenyan governance context`,
      historical_timeline: `Timeline showing ${conceptString} with key events, dates, and historical context relevant to Kenya`,
      economic_diagram: `Economic activity diagram showing ${conceptString} with production processes, trade flows, and Kenyan economic context`,
      biological_diagram: `Biological illustration showing ${conceptString} with labeled parts, functions, and examples from Kenyan ecosystem`,
      physics_diagram: `Physics concept diagram showing ${conceptString} with forces, energy transfers, and practical Kenyan applications`,
      chemical_diagram: `Chemical process diagram showing ${conceptString} with molecular structures, reactions, and relevant Kenyan examples`,
      ecological_diagram: `Ecosystem diagram showing ${conceptString} with food webs, habitats, and Kenyan environmental context`,
      anatomical_diagram: `Human body diagram showing ${conceptString} with organ systems, functions, and health education for Kenyan students`,
      geometric_diagram: `Geometric illustration showing ${conceptString} with shapes, measurements, and practical Kenyan applications`,
      algebraic_diagram: `Algebraic concept diagram showing ${conceptString} with equations, variables, and step-by-step solutions`,
      data_visualization: `Data analysis diagram showing ${conceptString} with charts, graphs, and Kenyan statistical context`,
      measurement_diagram: `Measurement illustration showing ${conceptString} with units, conversions, and practical Kenyan applications`,
      descriptive_diagram: `Educational diagram clearly illustrating ${conceptString} with labeled components and Kenyan context`,
      comparison_chart: `Comparison diagram showing similarities and differences of ${conceptString} with clear categories and Kenyan examples`,
      process_flowchart: `Step-by-step process diagram showing ${conceptString} with clear sequence and Kenyan practical applications`,
      classification_diagram: `Classification chart showing categories and types of ${conceptString} with Kenyan examples and characteristics`,
      linguistic_diagram: `Language structure diagram showing ${conceptString} with grammatical elements and Kenyan context examples`,
      writing_process_chart: `Writing composition diagram showing ${conceptString} with planning, drafting, and editing stages`,
      language_infographic: `Language learning diagram showing ${conceptString} with vocabulary, grammar, and communication skills`
    };

    return descriptions[diagramType] || `Educational diagram illustrating ${conceptString} for ${learningArea} with Kenyan context and clear explanations`;
  }

  /**
   * ✅ NEW: Get appropriate diagram elements
   */
  static getDiagramElements(diagramType, keyConcepts) {
    const baseElements = {
      geographical_map: ['map outline', 'geographical features', 'scale indicator', 'legend', 'directional compass'],
      meteorological_chart: ['weather symbols', 'measurement scales', 'data visualization', 'instrument illustrations'],
      demographic_infographic: ['population pyramids', 'statistical charts', 'distribution maps', 'trend indicators'],
      organizational_chart: ['hierarchy levels', 'position boxes', 'relationship lines', 'role descriptions'],
      historical_timeline: ['timeline axis', 'event markers', 'date labels', 'historical illustrations'],
      biological_diagram: ['labeled components', 'functional relationships', 'process arrows', 'biological structures'],
      physics_diagram: ['force arrows', 'energy flow', 'motion indicators', 'scientific principles'],
      chemical_diagram: ['molecular structures', 'reaction arrows', 'chemical symbols', 'laboratory equipment'],
      ecological_diagram: ['food chains', 'habitat illustrations', 'species interactions', 'environmental factors'],
      anatomical_diagram: ['organ systems', 'body parts', 'functional labels', 'health information'],
      geometric_diagram: ['shapes', 'measurements', 'angles', 'mathematical formulas'],
      algebraic_diagram: ['equations', 'variables', 'solution steps', 'mathematical operations'],
      data_visualization: ['charts', 'graphs', 'data points', 'statistical analysis'],
      linguistic_diagram: ['sentence structures', 'grammar elements', 'vocabulary categories', 'language rules']
    };

    return baseElements[diagramType] || [
      'main concept visualization',
      'key component labels', 
      'relationship indicators',
      'educational annotations',
      ...keyConcepts.slice(0, 3)
    ];
  }

  /**
   * ✅ NEW: Get diagram style based on type and learning area
   */
  static getDiagramStyle(diagramType, learningArea) {
    const styles = {
      geographical_map: 'cartographic educational style',
      meteorological_chart: 'scientific data visualization',
      demographic_infographic: 'statistical information design',
      organizational_chart: 'hierarchical structure diagram',
      historical_timeline: 'chronological educational illustration',
      biological_diagram: 'scientific biological illustration',
      physics_diagram: 'physical science technical drawing',
      chemical_diagram: 'chemistry educational diagram',
      ecological_diagram: 'environmental science illustration',
      anatomical_diagram: 'medical educational chart',
      geometric_diagram: 'mathematical precision drawing',
      algebraic_diagram: 'mathematical concept visualization',
      data_visualization: 'statistical infographic',
      linguistic_diagram: 'language education infographic'
    };

    return styles[diagramType] || 'educational textbook illustration';
  }

  /**
   * ✅ ENHANCED: Build comprehensive prompt from instructions
   */
  static buildPromptFromInstructions(instructions, substrand, learningArea, grade, specificConcept = '') {
    let prompt = `Create a professional educational diagram for ${grade} ${learningArea}: ${substrand}`;
    
    if (specificConcept) {
      prompt += `\nSPECIFIC CONCEPT: ${specificConcept}`;
    }
    
    prompt += `\n\nDIAGRAM TYPE: ${instructions.type.toUpperCase()}`;
    prompt += `\n\nVISUAL CONTENT: ${instructions.description}`;
    prompt += `\n\nKEY ELEMENTS TO INCLUDE:`;
    prompt += `\n${instructions.elements.map((el, i) => `${i + 1}. ${el}`).join('\n')}`;
    
    if (instructions.keyConcepts && instructions.keyConcepts.length > 0) {
      prompt += `\n\nKEY CONCEPTS: ${instructions.keyConcepts.join(', ')}`;
    }
    
    prompt += `\n\nSTYLE SPECIFICATIONS:`;
    prompt += `\n- Visual Style: ${instructions.style}`;
    prompt += `\n- Grade Level: ${grade}`;
    prompt += `\n- Visual Complexity: ${instructions.visualComplexity}`;
    prompt += `\n- Label Size: ${instructions.labelSize}`;
    prompt += `\n- Color Scheme: ${instructions.colorScheme}`;
    
    prompt += `\n\nKENYAN CONTEXT REQUIREMENTS:`;
    prompt += `\n- Include relevant Kenyan examples and context`;
    prompt += `\n- Use locally relevant illustrations and scenarios`;
    prompt += `\n- Consider Kenyan geographical and cultural context`;
    
    prompt += `\n\nTECHNICAL REQUIREMENTS:`;
    prompt += `\n- White or very light background for printability`;
    prompt += `\n- High contrast (dark labels on light background)`;
    prompt += `\n- Bold outlines (2-3pt) for educational clarity`;
    prompt += `\n- All text horizontal and readable`;
    prompt += `\n- Professional textbook quality`;
    prompt += `\n- Suitable for CBC curriculum teaching`;
    
    prompt += `\n\nThis diagram must be immediately useful for ${grade} students in Kenya and support the specific learning outcomes for ${substrand}.`;
    
    return prompt;
  }

  // ==================== EXISTING METHODS (keep these) ====================

  static generateKey(learningArea, strand, substrand) {
    return `${learningArea}|${strand}|${substrand}`
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_|]/g, '');
  }

  static findBroadMatch(learningArea, substrand) {
    const substrandLower = substrand.toLowerCase();
    
    for (const [key, value] of Object.entries(this.DIAGRAM_DATABASE)) {
      if (key.toLowerCase().includes(substrandLower) || 
          substrandLower.includes(key.split('|').pop())) {
        return value;
      }
    }
    
    return null;
  }

  static formatInstructions(instructions, grade) {
    const gradeLevel = this.getGradeLevel(grade);
    
    return {
      ...instructions,
      visualComplexity: this.getVisualComplexity(gradeLevel),
      labelSize: this.getLabelSize(gradeLevel),
      colorScheme: this.getColorScheme(gradeLevel),
      gradeLevel: gradeLevel
    };
  }

  static getGradeLevel(grade) {
    const gradeLower = grade.toLowerCase();
    
    if (gradeLower.includes('pp1') || gradeLower.includes('pp2')) {
      return 'early_years';
    }
    if (gradeLower.match(/grade [1-3]/i)) {
      return 'lower_primary';
    }
    if (gradeLower.match(/grade [4-6]/i)) {
      return 'upper_primary';
    }
    if (gradeLower.match(/grade [7-9]/i)) {
      return 'junior_secondary';
    }
    
    return 'general';
  }

  static getVisualComplexity(gradeLevel) {
    const complexity = {
      early_years: 'very_simple',
      lower_primary: 'simple',
      upper_primary: 'moderate',
      junior_secondary: 'detailed',
      general: 'moderate'
    };
    
    return complexity[gradeLevel] || 'moderate';
  }

  static getLabelSize(gradeLevel) {
    const sizes = {
      early_years: '24-28pt',
      lower_primary: '20-24pt',
      upper_primary: '16-20pt',
      junior_secondary: '14-18pt',
      general: '16-18pt'
    };
    
    return sizes[gradeLevel] || '16-18pt';
  }

  static getColorScheme(gradeLevel) {
    const schemes = {
      early_years: 'bright primary colors (red, blue, yellow, green)',
      lower_primary: 'vibrant colors with clear contrasts',
      upper_primary: 'varied palette with good contrast',
      junior_secondary: 'professional colors with subtle variations',
      general: 'balanced color palette'
    };
    
    return schemes[gradeLevel] || 'balanced color palette';
  }

  static getGenericInstructions(learningArea, grade) {
    const gradeLevel = this.getGradeLevel(grade);
    const category = learningArea.toLowerCase();
    
    const genericTemplates = {
      mathematics: {
        type: 'mathematical',
        description: 'Clear mathematical diagram showing the concept with labeled components, using geometric shapes, number lines, or visual representations appropriate for the topic',
        elements: ['key mathematical elements', 'labels', 'measurements', 'examples', 'step-by-step process'],
        style: 'clean mathematical illustration',
        priority: 'medium'
      },
      
      science: {
        type: 'scientific',
        description: 'Scientific diagram illustrating the concept with clearly labeled parts, showing relationships, processes, or structures relevant to the topic',
        elements: ['main concept visualization', 'labeled components', 'arrows showing relationships', 'process indicators'],
        style: 'scientific illustration style',
        priority: 'medium'
      },
      
      social_studies: {
        type: 'conceptual',
        description: 'Educational diagram showing relationships, processes, or classifications relevant to the social studies topic with clear organization',
        elements: ['organizational structure', 'connecting lines', 'category labels', 'examples', 'context information'],
        style: 'infographic or flowchart style',
        priority: 'medium'
      },
      
      english: {
        type: 'linguistic',
        description: 'Language diagram showing grammatical structures, word relationships, or composition elements with clear examples',
        elements: ['linguistic elements', 'example sentences', 'relationship indicators', 'category labels'],
        style: 'typographic educational diagram',
        priority: 'medium'
      }
    };
    
    for (const [key, template] of Object.entries(genericTemplates)) {
      if (category.includes(key)) {
        return {
          ...template,
          visualComplexity: this.getVisualComplexity(gradeLevel),
          labelSize: this.getLabelSize(gradeLevel),
          colorScheme: this.getColorScheme(gradeLevel),
          gradeLevel: gradeLevel,
          isGeneric: true
        };
      }
    }
    
    return {
      type: 'general',
      description: 'Educational diagram illustrating the key concept with labeled components and clear visual organization',
      elements: ['main concept', 'supporting elements', 'labels', 'relationships'],
      style: 'clear educational illustration',
      visualComplexity: this.getVisualComplexity(gradeLevel),
      labelSize: this.getLabelSize(gradeLevel),
      colorScheme: this.getColorScheme(gradeLevel),
      gradeLevel: gradeLevel,
      priority: 'low',
      isGeneric: true
    };
  }

  // ==================== COMPREHENSIVE DIAGRAM DATABASE ====================
  
  static DIAGRAM_DATABASE = {
    // Social Studies - Physical Environment
    'social_studies|physical_environment|weather': {
      type: 'meteorological_chart',
      description: 'Comprehensive diagram showing all weather elements: temperature, precipitation, wind, humidity, atmospheric pressure, sunshine, cloud cover with Kenyan context',
      elements: ['weather elements grid', 'measurement instruments', 'Kenyan climate zones', 'data recording methods'],
      style: 'meteorological educational chart',
      priority: 'high'
    },

    'social_studies|physical_environment|climate': {
      type: 'geographical_map',
      description: 'Kenya climate zones map showing equatorial, tropical, arid, and temperate regions with characteristic vegetation, rainfall patterns, and temperature ranges',
      elements: ['Kenya map', 'climate zones color coding', 'rainfall graphs', 'temperature charts', 'vegetation illustrations'],
      style: 'climatological reference map',
      priority: 'high'
    },

    'social_studies|physical_environment|soils': {
      type: 'scientific_illustration',
      description: 'Soil types comparison: volcanic, loam, clay, sandy with composition, characteristics, and suitable crops for each type in Kenyan context',
      elements: ['soil layers cross-section', 'particle size comparison', 'crop suitability indicators', 'conservation methods'],
      style: 'agricultural scientific diagram',
      priority: 'high'
    },

    // Social Studies - Human Environment
    'social_studies|human_environment|population': {
      type: 'demographic_infographic',
      description: 'Kenya population distribution map showing density variations, urban centers, migration patterns, and demographic pyramids for different regions',
      elements: ['population density map', 'demographic pyramids', 'migration arrows', 'urban/rural distribution'],
      style: 'demographic infographic',
      priority: 'high'
    },

    'social_studies|human_environment|economic_activities': {
      type: 'economic_diagram',
      description: 'Major economic activities in Kenya: agriculture, tourism, manufacturing, services with regional distribution, products, and employment statistics',
      elements: ['economic activities map', 'product flow charts', 'employment statistics', 'value chain diagrams'],
      style: 'economic infographic',
      priority: 'high'
    },

    // Science - Living Things
    'science|living_things|classification': {
      type: 'biological_diagram',
      description: 'Classification of living things: kingdoms, phyla, classes with examples from Kenyan ecosystem and characteristic features',
      elements: ['classification hierarchy', 'characteristic features', 'Kenyan examples', 'identification keys'],
      style: 'biological taxonomy chart',
      priority: 'high'
    },

    'science|living_things|cells': {
      type: 'biological_diagram',
      description: 'Plant and animal cell structure comparison with organelles, functions, and differences clearly labeled for educational understanding',
      elements: ['cell diagrams side-by-side', 'organelle labels', 'function descriptions', 'structural differences'],
      style: 'microscopic biological illustration',
      priority: 'high'
    },

    // Mathematics
    'mathematics|numbers|fractions': {
      type: 'mathematical_illustration',
      description: 'Fractions concepts: proper, improper, mixed numbers with visual representations, equivalences, and operations step-by-step',
      elements: ['fraction visualizations', 'equivalence demonstrations', 'operation steps', 'real-life applications'],
      style: 'mathematical educational diagram',
      priority: 'high'
    },

    'mathematics|geometry|angles': {
      type: 'geometric_diagram',
      description: 'Types of angles and their properties: acute, obtuse, right, straight, reflex with measurements and real-world examples',
      elements: ['angle type illustrations', 'measurement demonstrations', 'property tables', 'practical applications'],
      style: 'geometric educational diagram',
      priority: 'medium'
    },

    // Add more database entries as needed...
  };

  /**
   * Get database statistics
   */
  static getDatabaseStats() {
    const stats = {
      total: Object.keys(this.DIAGRAM_DATABASE).length,
      bySubject: {},
      byPriority: {
        high: 0,
        medium: 0,
        low: 0
      },
      byType: {}
    };

    for (const [key, value] of Object.entries(this.DIAGRAM_DATABASE)) {
      const subject = key.split('|')[0];
      
      stats.bySubject[subject] = (stats.bySubject[subject] || 0) + 1;
      stats.byPriority[value.priority] = (stats.byPriority[value.priority] || 0) + 1;
      stats.byType[value.type] = (stats.byType[value.type] || 0) + 1;
    }

    return stats;
  }

  /**
 * ✅ NEW: Safe diagram instruction getter with fallbacks
 */
static getDiagramInstructionsSafely(learningArea, strand, substrand, grade, sloArray = []) {
  try {
    // Ensure grade has a value
    const safeGrade = grade || 'Grade 7';
    
    return this.getDiagramInstructions(learningArea, strand, substrand, safeGrade, sloArray);
  } catch (error) {
    console.error('[CBCDiagrams] Error getting diagram instructions:', error.message);
    
    // Return safe fallback instructions
    return {
      type: 'educational_infographic',
      description: `Educational diagram for ${learningArea}: ${substrand} with Kenyan context`,
      elements: ['main concept', 'key components', 'educational labels', 'Kenyan examples'],
      style: 'educational textbook illustration',
      visualComplexity: 'moderate',
      labelSize: '16-18pt',
      colorScheme: 'balanced color palette',
      gradeLevel: 'general',
      priority: 'medium',
      isGeneric: true,
      sloBased: false
    };
  }
}
}

module.exports = CBCDiagramInstructions;