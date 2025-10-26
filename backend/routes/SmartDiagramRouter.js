// SmartDiagramRouter.js - Intelligent diagram source selection for CBC curriculum

class SmartDiagramRouter {
  /**
   * Main routing decision based on topic, subject, and grade
   */
  static analyzeTopicAndRoute(topic, subject, grade, substrand = '') {
    const analysis = {
      isAbstract: this.isAbstractConcept(topic),
      isConcrete: this.isConcreteConcept(topic, subject),
      complexity: this.assessComplexity(topic),
      subjectCategory: this.categorizeSubject(subject),
      hasWikimediaKeywords: this.hasWikimediaKeywords(topic),
      substrand: substrand
    };

    console.log(`[SmartRouter] Analysis:`, {
      topic: topic.substring(0, 50),
      abstract: analysis.isAbstract,
      concrete: analysis.isConcrete,
      category: analysis.subjectCategory
    });

    // RULE 1: Concrete science topics with anatomical/structural focus
    if (analysis.isConcrete && 
        analysis.subjectCategory === 'science' && 
        analysis.hasWikimediaKeywords) {
      return {
        primary: 'wikimedia',
        fallback: 'dalle',
        reason: 'Concrete scientific topic with likely Wikimedia matches',
        confidence: 'high'
      };
    }

    // RULE 2: Abstract concepts, processes, relationships (Social Studies, most concepts)
    if (analysis.isAbstract || analysis.subjectCategory === 'social_studies') {
      return {
        primary: 'dalle',
        fallback: null,
        reason: 'Abstract concept needs custom visualization',
        confidence: 'high'
      };
    }

    // RULE 3: Mathematics - always DALL-E for precision
    if (analysis.subjectCategory === 'mathematics') {
      return {
        primary: 'dalle',
        fallback: null,
        reason: 'Math diagrams need precise geometric construction',
        confidence: 'high'
      };
    }

    // RULE 4: Languages - always DALL-E for custom word relationships
    if (analysis.subjectCategory === 'language') {
      return {
        primary: 'dalle',
        fallback: null,
        reason: 'Language concepts need custom typographic diagrams',
        confidence: 'high'
      };
    }

    // RULE 5: Geography with maps/physical features
    if (analysis.subjectCategory === 'social_studies' && 
        this.isGeographicalContent(topic)) {
      return {
        primary: 'wikimedia',
        fallback: 'dalle',
        reason: 'Geographical content available on Wikimedia',
        confidence: 'medium'
      };
    }

    // RULE 6: Arts, PE, Practical subjects
    if (['arts', 'practical', 'pe'].includes(analysis.subjectCategory)) {
      return {
        primary: 'dalle',
        fallback: 'wikimedia',
        reason: 'Creative/practical subjects need custom illustrations',
        confidence: 'medium'
      };
    }

    // DEFAULT: Try Wikimedia first (free), fallback to DALL-E
    return {
      primary: 'wikimedia',
      fallback: 'dalle',
      reason: 'Default strategy: free resource first',
      confidence: 'low'
    };
  }

  /**
   * Check if topic is abstract (relationships, concepts, processes)
   */
  static isAbstractConcept(topic) {
    const abstractIndicators = [
      'relationship', 'concept', 'theory', 'principle', 'idea',
      'comparison', 'classification', 'timeline', 'process',
      'system', 'cycle', 'framework', 'model', 'method',
      'strategy', 'approach', 'stages', 'steps', 'phases',
      'hierarchy', 'organization', 'structure of', 'types of',
      'categories', 'flowchart', 'flow', 'sequence',
      'cause and effect', 'vs', 'versus', 'between',
      'how to', 'ways to', 'methods of', 'sources of'
    ];
    
    const topicLower = topic.toLowerCase();
    return abstractIndicators.some(indicator => topicLower.includes(indicator));
  }

  /**
   * Check if topic is concrete (physical objects, organisms, structures)
   */
  static isConcreteConcept(topic, subject) {
    const concreteKeywords = {
      science: [
        'cell', 'cells', 'plant cell', 'animal cell', 'bacteria',
        'leaf', 'flower', 'root', 'stem', 'seed', 'fruit',
        'heart', 'lung', 'brain', 'liver', 'kidney', 'stomach',
        'skeleton', 'skull', 'bone', 'joint', 'muscle',
        'eye', 'ear', 'nose', 'tongue', 'skin',
        'digestive system', 'respiratory system', 'circulatory',
        'atom', 'molecule', 'element', 'compound',
        'rock', 'mineral', 'crystal', 'fossil',
        'volcano', 'mountain', 'valley', 'plateau',
        'solar system', 'planet', 'moon', 'sun', 'earth'
      ],
      geography: [
        'map', 'globe', 'compass', 'kenya map', 'africa map',
        'mountain', 'river', 'lake', 'ocean', 'sea',
        'valley', 'plateau', 'plain', 'hill', 'coast'
      ],
      general: [
        'tool', 'equipment', 'instrument', 'machine', 'device',
        'building', 'structure', 'monument'
      ]
    };
    
    const topicLower = topic.toLowerCase();
    const subjectLower = subject.toLowerCase();
    
    // Check subject-specific keywords
    if (subjectLower.includes('science')) {
      return concreteKeywords.science.some(keyword => topicLower.includes(keyword));
    }
    
    if (subjectLower.includes('geography') || subjectLower.includes('social')) {
      return concreteKeywords.geography.some(keyword => topicLower.includes(keyword));
    }
    
    // Check general keywords
    return concreteKeywords.general.some(keyword => topicLower.includes(keyword));
  }

  /**
   * Check for Wikimedia-friendly keywords
   */
  static hasWikimediaKeywords(topic) {
    const wikimediaFriendly = [
      'anatomy', 'structure', 'labeled', 'labelled', 'cross-section',
      'cross section', 'diagram of', 'parts of',
      'geographical', 'geological', 'biological',
      'anatomical', 'physiological', 'botanical',
      'internal structure', 'external structure'
    ];
    
    const topicLower = topic.toLowerCase();
    return wikimediaFriendly.some(keyword => topicLower.includes(keyword));
  }

  /**
   * Check if content is geographical
   */
  static isGeographicalContent(topic) {
    const geoKeywords = [
      'map', 'geography', 'location', 'place', 'region',
      'country', 'continent', 'kenya', 'africa', 'world',
      'physical features', 'landform', 'climate', 'vegetation'
    ];
    
    const topicLower = topic.toLowerCase();
    return geoKeywords.some(keyword => topicLower.includes(keyword));
  }

  /**
   * Categorize subject area
   */
  static categorizeSubject(subject) {
    const subjectLower = subject.toLowerCase();
    
    if (subjectLower.includes('math')) {
      return 'mathematics';
    }
    
    if (subjectLower.includes('science') || 
        subjectLower.includes('integrated') ||
        subjectLower.includes('biology') ||
        subjectLower.includes('chemistry') ||
        subjectLower.includes('physics')) {
      return 'science';
    }
    
    if (subjectLower.includes('social') || 
        subjectLower.includes('history') ||
        subjectLower.includes('geography') ||
        subjectLower.includes('cre') ||
        subjectLower.includes('c.r.e') ||
        subjectLower.includes('ire') ||
        subjectLower.includes('hre')) {
      return 'social_studies';
    }
    
    if (subjectLower.includes('language') || 
        subjectLower.includes('english') ||
        subjectLower.includes('kiswahili')) {
      return 'language';
    }
    
    if (subjectLower.includes('art') || 
        subjectLower.includes('music') ||
        subjectLower.includes('creative')) {
      return 'arts';
    }
    
    if (subjectLower.includes('physical') || 
        subjectLower.includes('sport') ||
        subjectLower.includes('p.e')) {
      return 'pe';
    }
    
    if (subjectLower.includes('home') || 
        subjectLower.includes('agriculture') ||
        subjectLower.includes('nutrition') ||
        subjectLower.includes('business')) {
      return 'practical';
    }
    
    return 'general';
  }

  /**
   * Assess topic complexity
   */
  static assessComplexity(topic) {
    const words = topic.split(' ').length;
    
    if (words > 25) return 'very_high';
    if (words > 15) return 'high';
    if (words > 8) return 'medium';
    return 'low';
  }

  /**
   * Get routing statistics
   */
  static getRoutingStats(decisions) {
    const stats = {
      total: decisions.length,
      wikimedia: decisions.filter(d => d.primary === 'wikimedia').length,
      dalle: decisions.filter(d => d.primary === 'dalle').length,
      highConfidence: decisions.filter(d => d.confidence === 'high').length,
      mediumConfidence: decisions.filter(d => d.confidence === 'medium').length,
      lowConfidence: decisions.filter(d => d.confidence === 'low').length
    };
    
    stats.wikimediaPercentage = ((stats.wikimedia / stats.total) * 100).toFixed(1);
    stats.dallePercentage = ((stats.dalle / stats.total) * 100).toFixed(1);
    
    return stats;
  }

  /**
   * Validate routing decision
   */
  static validateRouting(routing) {
    const validSources = ['wikimedia', 'dalle', null];
    
    if (!validSources.includes(routing.primary)) {
      throw new Error(`Invalid primary source: ${routing.primary}`);
    }
    
    if (!validSources.includes(routing.fallback)) {
      throw new Error(`Invalid fallback source: ${routing.fallback}`);
    }
    
    if (!routing.reason || routing.reason.length < 10) {
      throw new Error('Routing reason must be descriptive');
    }
    
    if (!['high', 'medium', 'low'].includes(routing.confidence)) {
      throw new Error(`Invalid confidence level: ${routing.confidence}`);
    }
    
    return true;
  }
}

module.exports = SmartDiagramRouter;