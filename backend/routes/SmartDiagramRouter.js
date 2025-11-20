// SmartDiagramRouter.js - ENHANCED with learning concept context

class SmartDiagramRouter {
  /**
   * ✅ NEW: Analyze learning concept with week context for better diagram selection
   */
  static analyzeLearningConceptWithContext(conceptText, weekNumber, allConcepts = []) {
    if (!conceptText || typeof conceptText !== 'string') {
      return null;
    }

    const lower = conceptText.toLowerCase();
    
    console.log(`[SmartRouter] 📖 Analyzing Week ${weekNumber}: "${conceptText.substring(0, 60)}..."`);
    
    // ========== MAPS AND GEOGRAPHY ==========
    if (lower.includes('position') && lower.includes('shape') && lower.includes('africa')) {
      return {
        type: 'africa_geography',
        searchTerms: [
          'Africa continent outline map',
          'Africa political map boundaries',
          'Map of Africa countries labeled'
        ],
        requiredKeywords: ['africa', 'map'],
        rejectKeywords: ['politics', 'war', 'conflict', 'celebrity', 'flag'],
        educationalFocus: 'Geography of Africa - position, shape, size'
      };
    }

    if (lower.includes('countries') && lower.includes('africa')) {
      return {
        type: 'africa_countries',
        searchTerms: [
          'Africa political map countries',
          'African nations map labeled',
          'Map showing African countries'
        ],
        requiredKeywords: ['africa', 'countries', 'map'],
        rejectKeywords: ['flag', 'politics', 'war', 'conflict'],
        educationalFocus: 'African countries and boundaries'
      };
    }

    if (lower.includes('latitude') && lower.includes('longitude')) {
      return {
        type: 'coordinates',
        searchTerms: [
          'latitude longitude grid world map',
          'geographic coordinate system diagram',
          'world map latitude longitude lines'
        ],
        requiredKeywords: ['latitude', 'longitude', 'map'],
        rejectKeywords: ['gps', 'technology', 'phone', 'app'],
        educationalFocus: 'Latitude and longitude coordinate system'
      };
    }

    if (lower.includes('time') && lower.includes('longitude')) {
      return {
        type: 'time_zones',
        searchTerms: [
          'world time zones map',
          'international time zones diagram',
          'time zone map with longitude'
        ],
        requiredKeywords: ['time', 'zone', 'map'],
        rejectKeywords: ['clock', 'watch', 'digital', 'app'],
        educationalFocus: 'Time calculation using longitude'
      };
    }

    if (lower.includes('pictures') && lower.includes('plans') && lower.includes('maps')) {
      return {
        type: 'map_types_comparison',
        searchTerms: [
          'types of maps geography diagram',
          'political physical topographic map comparison',
          'map types classification educational'
        ],
        requiredKeywords: ['map', 'type'],
        rejectKeywords: ['google', 'app', 'phone', 'technology'],
        educationalFocus: 'Different types of maps in geography'
      };
    }

    if (lower.includes('three types of maps')) {
      return {
        type: 'map_classification',
        searchTerms: [
          'physical political topographic map',
          'types of maps educational chart',
          'map classification diagram'
        ],
        requiredKeywords: ['map'],
        rejectKeywords: ['google', 'app', 'digital'],
        educationalFocus: 'Three main types of maps'
      };
    }

    if (lower.includes('importance of maps')) {
      return {
        type: 'map_uses',
        searchTerms: [
          'map reading education diagram',
          'uses of maps in daily life',
          'map skills educational chart'
        ],
        requiredKeywords: ['map'],
        rejectKeywords: ['gps', 'phone', 'app'],
        educationalFocus: 'Importance and uses of maps'
      };
    }

    // ========== HISTORICAL SOURCES ==========
    if (lower.includes('sources of historical information') || 
        (lower.includes('identify') && lower.includes('historical'))) {
      return {
        type: 'historical_sources_types',
        searchTerms: [
          'historical sources types diagram',
          'primary secondary sources classification',
          'sources of history educational chart'
        ],
        requiredKeywords: ['historical', 'source'],
        rejectKeywords: ['fiction', 'novel', 'movie', 'entertainment'],
        educationalFocus: 'Types of historical information sources'
      };
    }

    if (lower.includes('primary') && lower.includes('secondary')) {
      return {
        type: 'source_classification',
        searchTerms: [
          'primary vs secondary sources diagram',
          'historical sources classification chart',
          'primary secondary sources comparison'
        ],
        requiredKeywords: ['primary', 'secondary', 'source'],
        rejectKeywords: ['fiction', 'novel', 'movie'],
        educationalFocus: 'Primary vs Secondary historical sources'
      };
    }

    if (lower.includes('preserv') && lower.includes('historical')) {
      return {
        type: 'preservation_methods',
        searchTerms: [
          'historical preservation methods diagram',
          'museum conservation techniques',
          'archiving historical documents methods'
        ],
        requiredKeywords: ['preserv', 'historical', 'conservation'],
        rejectKeywords: ['food', 'cooking', 'recipe'],
        educationalFocus: 'Methods of preserving historical information'
      };
    }

    if (lower.includes('significance') && lower.includes('historical')) {
      return {
        type: 'historical_importance',
        searchTerms: [
          'importance of historical sources',
          'why study history diagram',
          'historical sources significance'
        ],
        requiredKeywords: ['historical', 'significance'],
        rejectKeywords: ['fiction', 'entertainment'],
        educationalFocus: 'Significance of historical sources'
      };
    }

    // ========== EARTH AND SOLAR SYSTEM ==========
    if (lower.includes('origin') && lower.includes('earth') && lower.includes('solar system')) {
      return {
        type: 'solar_system_formation',
        searchTerms: [
          'solar system formation diagram',
          'origin of earth solar system',
          'planets formation educational chart'
        ],
        requiredKeywords: ['solar', 'system', 'earth'],
        rejectKeywords: ['science fiction', 'movie', 'game', 'fantasy'],
        educationalFocus: 'Origin of Earth in the solar system'
      };
    }

    if (lower.includes('rotation') && lower.includes('revolution')) {
      return {
        type: 'earth_movements',
        searchTerms: [
          'earth rotation revolution diagram',
          'earth movement day night seasons',
          'rotation revolution earth educational'
        ],
        requiredKeywords: ['earth', 'rotation', 'revolution'],
        rejectKeywords: ['politics', 'social'],
        educationalFocus: 'Earth rotation and revolution effects'
      };
    }

    if (lower.includes('internal structure') && lower.includes('earth')) {
      return {
        type: 'earth_layers',
        searchTerms: [
          'earth layers diagram crust mantle core',
          'internal structure of earth',
          'earth cross section labeled'
        ],
        requiredKeywords: ['earth', 'layer', 'structure', 'crust'],
        rejectKeywords: ['mining', 'drilling', 'industry'],
        educationalFocus: 'Internal structure of the Earth'
      };
    }

    if (lower.includes('solar system') && !lower.includes('origin')) {
      return {
        type: 'solar_system_overview',
        searchTerms: [
          'solar system diagram labeled planets',
          'planets sun diagram educational',
          'solar system chart with planet names'
        ],
        requiredKeywords: ['solar', 'planet', 'sun'],
        rejectKeywords: ['science fiction', 'movie', 'game'],
        educationalFocus: 'Overview of the solar system'
      };
    }

    // ========== FALLBACK ==========
    console.log(`[SmartRouter] ⚠️ No specific match for: "${conceptText.substring(0, 60)}"`);
    
    const words = conceptText.split(/\s+/)
      .filter(w => w.length > 4 && !['identify', 'describe', 'explain', 'distinguish'].includes(w.toLowerCase()))
      .slice(0, 4);

    return {
      type: 'educational_generic',
      searchTerms: [
        `${words.join(' ')} educational diagram`,
        `${words.join(' ')} chart labeled`,
        `${words.join(' ')} illustration geography`
      ],
      requiredKeywords: words.map(w => w.toLowerCase()).filter(w => w.length > 3),
      rejectKeywords: ['celebrity', 'politics', 'fiction', 'movie', 'novel', 'entertainment'],
      educationalFocus: `Educational content about ${words.join(' ')}`
    };
  }

  /**
   * ✅ ORIGINAL: Keep for backward compatibility
   */
  static analyzeLearningConcept(conceptText) {
    // This is called by DiagramService for diagram placeholder analysis
    // Now we'll extract keywords from the placeholder and route appropriately
    
    if (!conceptText || typeof conceptText !== 'string') {
      return null;
    }

    const lower = conceptText.toLowerCase();
    
    // Try to extract actual concept from placeholder descriptions
    if (lower.includes('africa') && (lower.includes('position') || lower.includes('shape'))) {
      return this.analyzeLearningConceptWithContext('describe the position, shape and size of Africa', 1, []);
    }
    
    if (lower.includes('latitude') || lower.includes('longitude')) {
      return this.analyzeLearningConceptWithContext('use latitudes and longitudes to locate places', 1, []);
    }
    
    if (lower.includes('time') && lower.includes('longitude')) {
      return this.analyzeLearningConceptWithContext('calculate time using longitudes', 1, []);
    }
    
    if (lower.includes('primary') && lower.includes('secondary')) {
      return this.analyzeLearningConceptWithContext('distinguish between primary and secondary sources', 1, []);
    }
    
    if (lower.includes('preserv') && lower.includes('historical')) {
      return this.analyzeLearningConceptWithContext('explore methods of preserving historical information', 1, []);
    }
    
    if (lower.includes('solar system')) {
      return this.analyzeLearningConceptWithContext('describe the origin of the earth in the solar system', 1, []);
    }
    
    if (lower.includes('internal structure') && lower.includes('earth')) {
      return this.analyzeLearningConceptWithContext('illustrate the internal structure of the earth', 1, []);
    }
    
    if (lower.includes('rotation') && lower.includes('revolution')) {
      return this.analyzeLearningConceptWithContext('examine effects of rotation and revolution', 1, []);
    }

    // Generic fallback
    const words = conceptText.split(/\s+/)
      .filter(w => w.length > 4)
      .slice(0, 5);

    return {
      type: 'educational_diagram',
      searchTerms: [
        `${words.join(' ')} diagram educational`,
        `${words.join(' ')} chart labeled`
      ],
      requiredKeywords: words.map(w => w.toLowerCase()),
      rejectKeywords: ['celebrity', 'politics', 'fiction', 'movie', 'novel']
    };
  }

  /**
   * ✅ NEW: Get best diagram matches for a set of learning concepts
   */
  static selectBestConceptsForDiagrams(learningConcepts, maxDiagrams = 2) {
    if (!learningConcepts || learningConcepts.length === 0) {
      return [];
    }

    // Priority scoring: which concepts NEED visual representation most?
    const scoredConcepts = learningConcepts.map((concept, index) => {
      let score = 0;
      const lower = concept.concept.toLowerCase();
      
      // High priority: spatial/visual concepts
      if (lower.includes('map') || lower.includes('diagram') || lower.includes('illustrate')) score += 10;
      if (lower.includes('position') || lower.includes('shape') || lower.includes('structure')) score += 8;
      if (lower.includes('compare') || lower.includes('distinguish')) score += 6;
      
      // Medium priority: process/system concepts
      if (lower.includes('system') || lower.includes('process') || lower.includes('method')) score += 5;
      if (lower.includes('types') || lower.includes('classification')) score += 5;
      
      // Lower priority: abstract concepts
      if (lower.includes('significance') || lower.includes('importance') || lower.includes('appreciate')) score += 2;
      
      // Prefer earlier weeks (foundational concepts)
      const weekBonus = Math.max(0, 5 - index);
      score += weekBonus;
      
      return {
        ...concept,
        score,
        index
      };
    });

    // Sort by score and take top N
    const selected = scoredConcepts
      .sort((a, b) => b.score - a.score)
      .slice(0, maxDiagrams);

    console.log(`[SmartRouter] 🎯 Selected ${selected.length} concepts for diagrams:`,
      selected.map(c => `Week ${c.week}: ${c.concept.substring(0, 40)}... (score: ${c.score})`));

    return selected;
  }

  /**
   * ✅ Determine if a concept needs visual representation
   */
  static needsVisualRepresentation(conceptText) {
    if (!conceptText) return false;

    const lower = conceptText.toLowerCase();
    
    const visualKeywords = [
      'describe', 'identify', 'distinguish', 'examine', 'illustrate',
      'map', 'diagram', 'structure', 'system', 'process',
      'parts', 'components', 'types', 'classification', 'compare'
    ];

    return visualKeywords.some(kw => lower.includes(kw));
  }
}

module.exports = SmartDiagramRouter;