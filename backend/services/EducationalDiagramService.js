// EducationalDiagramService.js - UNIVERSAL CBC CURRICULUM SUPPORT

const axios = require('axios');

class EducationalDiagramService {
  static cache = new Map();
  static timeout = 30000;
  static usedImages = new Map(); // Track per document: documentId -> Set of used URLs

  /**
   * Get educational diagrams with uniqueness per document
   */
  static async getEducationalDiagram(topic, subject, grade, documentId = 'default') {
    console.log(`[EduDiagram] 🔍 Searching for: ${topic.substring(0, 80)}`);
    console.log(`  Subject: ${subject}, Grade: ${grade}, Document: ${documentId}`);

    // Initialize used images set for this document if not exists
    if (!this.usedImages.has(documentId)) {
      this.usedImages.set(documentId, new Set());
    }

    const cacheKey = `${subject}_${topic}_${grade}`.toLowerCase().replace(/\s+/g, '_').substring(0, 100);
    
    // Check cache but verify it's not already used in this document
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (!this.usedImages.get(documentId).has(cached.imageUrl)) {
        console.log(`[EduDiagram] 📦 Using cached result (not yet used)`);
        this.usedImages.get(documentId).add(cached.imageUrl);
        return cached;
      }
      console.log(`[EduDiagram] ⏭️ Cached result already used in this document`);
    }

    // Extract key concepts from topic and subject
    const keywords = this.extractKeywords(topic, subject);
    console.log(`[EduDiagram] 📝 Key concepts: ${keywords.slice(0, 5).join(', ')}`);

    // Try Wikimedia with uniqueness check for this document
    let result = await this.getFromWikimediaOptimized(topic, subject, grade, keywords, documentId);
    
    if (!result) {
      console.log(`[EduDiagram] ⚠️ No unique Wikimedia image found`);
      return null; // Trigger DALL-E in DiagramService
    }
    
    // Mark image as used for this document
    this.usedImages.get(documentId).add(result.imageUrl);
    
    // Cache the result
    this.cache.set(cacheKey, result);
    
    return result;
  }

  /**
   * ✅ COMPREHENSIVE: Extract keywords for ALL learning areas
   */
  static extractKeywords(topic, subject) {
    const keywords = [];
    const topicLower = topic.toLowerCase();
    const subjectLower = subject.toLowerCase();
    
    // ===== COMPREHENSIVE KEYWORD DATABASE FOR ALL CBC SUBJECTS =====
    
    const allKeywords = {
      // MATHEMATICS
      mathematics: [
        'addition', 'subtraction', 'multiplication', 'division', 'fractions',
        'decimals', 'percentages', 'geometry', 'shapes', 'angles', 'area',
        'perimeter', 'volume', 'algebra', 'equations', 'graphs', 'statistics',
        'probability', 'number line', 'place value', 'ratio', 'proportion'
      ],
      
      // SCIENCE (INTEGRATED/BIOLOGY/CHEMISTRY/PHYSICS)
      science: [
        'cell', 'photosynthesis', 'respiration', 'digestion', 'circulation',
        'reproduction', 'skeleton', 'muscles', 'nervous system', 'senses',
        'food chain', 'ecosystem', 'habitat', 'adaptation', 'classification',
        'matter', 'solid liquid gas', 'atoms', 'molecules', 'elements',
        'compounds', 'mixtures', 'reactions', 'acids', 'bases', 'ph',
        'forces', 'motion', 'energy', 'gravity', 'friction', 'magnetism',
        'electricity', 'circuits', 'light', 'sound', 'heat', 'waves',
        'solar system', 'planets', 'earth', 'moon', 'stars', 'rotation',
        'revolution', 'seasons', 'weather', 'climate', 'water cycle',
        'rock cycle', 'volcano', 'earthquake', 'erosion', 'weathering'
      ],
      
      // SOCIAL STUDIES (GEOGRAPHY/HISTORY/CIVICS)
      social: [
        'map', 'compass', 'directions', 'scale', 'continents', 'oceans',
        'countries', 'kenya', 'africa', 'equator', 'latitude', 'longitude',
        'mountains', 'rivers', 'lakes', 'valleys', 'plains', 'plateau',
        'climate zones', 'vegetation', 'agriculture', 'livestock', 'fishing',
        'mining', 'industry', 'trade', 'transport', 'communication',
        'population', 'settlement', 'urban', 'rural', 'migration',
        'government', 'democracy', 'constitution', 'rights', 'responsibilities',
        'national symbols', 'flag', 'anthem', 'coat of arms',
        'early man', 'stone age', 'iron age', 'colonization', 'independence',
        'communities', 'cultures', 'traditions', 'customs', 'religion'
      ],
      
      // ENGLISH/KISWAHILI (LANGUAGES)
      language: [
        'alphabet', 'vowels', 'consonants', 'syllables', 'phonics',
        'sentence structure', 'parts of speech', 'noun', 'verb', 'adjective',
        'grammar', 'tenses', 'punctuation', 'composition', 'comprehension',
        'vocabulary', 'synonyms', 'antonyms', 'idioms', 'proverbs'
      ],
      
      // CREATIVE ARTS & SPORTS
      arts: [
        'drawing', 'painting', 'sculpture', 'craft', 'colors', 'primary colors',
        'secondary colors', 'shapes', 'patterns', 'texture', 'balance',
        'music', 'rhythm', 'melody', 'instruments', 'dance', 'drama',
        'athletics', 'games', 'gymnastics', 'ball games', 'team sports'
      ],
      
      // HOME SCIENCE/AGRICULTURE
      practical: [
        'nutrition', 'balanced diet', 'food groups', 'vitamins', 'minerals',
        'hygiene', 'sanitation', 'disease prevention', 'first aid',
        'crop farming', 'livestock keeping', 'soil', 'fertilizer', 'irrigation',
        'pests', 'diseases', 'harvesting', 'storage', 'marketing'
      ],
      
      // RELIGIOUS EDUCATION
      religious: [
        'creation', 'bible stories', 'prophets', 'commandments', 'prayers',
        'worship', 'moral values', 'ethics', 'character', 'virtues'
      ],
      
      // BUSINESS STUDIES/LIFE SKILLS
      business: [
        'entrepreneurship', 'business plan', 'profit', 'loss', 'budget',
        'saving', 'investment', 'banking', 'money management', 'marketing',
        'decision making', 'problem solving', 'communication', 'teamwork',
        'leadership', 'time management', 'goal setting'
      ]
    };
    
    // Determine which subject category
    let relevantKeywords = [];
    
    if (subjectLower.includes('math')) {
      relevantKeywords = allKeywords.mathematics;
    } else if (subjectLower.includes('science') || subjectLower.includes('integrated')) {
      relevantKeywords = allKeywords.science;
    } else if (subjectLower.includes('social') || subjectLower.includes('geography') || 
               subjectLower.includes('history') || subjectLower.includes('c.r.e') || 
               subjectLower.includes('cre')) {
      relevantKeywords = [...allKeywords.social, ...allKeywords.religious];
    } else if (subjectLower.includes('english') || subjectLower.includes('kiswahili') || 
               subjectLower.includes('language')) {
      relevantKeywords = allKeywords.language;
    } else if (subjectLower.includes('art') || subjectLower.includes('music') || 
               subjectLower.includes('physical') || subjectLower.includes('sport')) {
      relevantKeywords = allKeywords.arts;
    } else if (subjectLower.includes('home') || subjectLower.includes('agriculture') || 
               subjectLower.includes('nutrition')) {
      relevantKeywords = allKeywords.practical;
    } else if (subjectLower.includes('business') || subjectLower.includes('life skills')) {
      relevantKeywords = allKeywords.business;
    } else {
      // Default: check all categories
      relevantKeywords = Object.values(allKeywords).flat();
    }
    
    // Find matching keywords in topic
    for (const keyword of relevantKeywords) {
      if (topicLower.includes(keyword)) {
        keywords.push(keyword);
      }
    }
    
    // If no specific keywords found, extract first few meaningful words
    if (keywords.length === 0) {
      const words = topicLower
        .replace(/educational diagram|showing|illustrating|for|grade \d+/gi, '')
        .split(/\s+/)
        .filter(w => w.length > 3)
        .slice(0, 3);
      keywords.push(...words);
    }
    
    return keywords.length > 0 ? [...new Set(keywords)] : ['educational'];
  }

  /**
   * Optimized Wikimedia search with document-level uniqueness
   */
  static async getFromWikimediaOptimized(topic, subject, grade, keywords, documentId) {
    const searchStrategies = [];
    const usedInDoc = this.usedImages.get(documentId);
    
    // ✅ Strategy 1: Most specific keywords (top 3)
    for (const keyword of keywords.slice(0, 3)) {
      searchStrategies.push(`${keyword} diagram labeled`);
      searchStrategies.push(`${keyword} structure diagram`);
      searchStrategies.push(`${keyword} educational illustration`);
      searchStrategies.push(`${keyword} schematic`);
    }
    
    // ✅ Strategy 2: Combined keywords
    if (keywords.length >= 2) {
      searchStrategies.push(`${keywords[0]} ${keywords[1]} diagram`);
      searchStrategies.push(`${keywords[0]} ${keywords[1]} illustration`);
    }
    
    // ✅ Strategy 3: Simplified topic
    const simplifiedTopic = this.simplifyTopic(topic);
    if (simplifiedTopic && simplifiedTopic.length > 5) {
      searchStrategies.push(`${simplifiedTopic} diagram`);
      searchStrategies.push(`${simplifiedTopic} educational`);
    }
    
    // ✅ Strategy 4: Subject-specific searches
    if (subject.toLowerCase().includes('science')) {
      searchStrategies.push(`science diagram ${keywords[0] || ''}`);
    } else if (subject.toLowerCase().includes('math')) {
      searchStrategies.push(`mathematics diagram ${keywords[0] || ''}`);
    } else if (subject.toLowerCase().includes('social')) {
      searchStrategies.push(`geography diagram ${keywords[0] || ''}`);
    }
    
    // Remove duplicates
    const uniqueStrategies = [...new Set(searchStrategies)];
    
    console.log(`[Wikimedia] 🎯 Trying ${uniqueStrategies.length} search strategies`);

    // Try each strategy
    for (const searchQuery of uniqueStrategies.slice(0, 12)) {
      console.log(`[Wikimedia] 🔎 "${searchQuery}"`);
      
      const result = await this.searchWikimedia(searchQuery, usedInDoc);
      
      if (result && !usedInDoc.has(result.imageUrl)) {
        console.log(`[Wikimedia] ✅ Found unique image with: "${searchQuery}"`);
        return result;
      }
    }

    console.log(`[Wikimedia] ❌ No unique suitable diagrams found`);
    return null;
  }

  /**
   * Simplify topic to core searchable terms
   */
  static simplifyTopic(topic) {
    let simplified = topic
      .replace(/educational diagram (illustrating|showing|for):/gi, '')
      .replace(/show clear visual representation/gi, '')
      .replace(/with labeled components/gi, '')
      .replace(/main visual showing:/gi, '')
      .replace(/include \d+-\d+ key components/gi, '')
      .replace(/white background/gi, '')
      .replace(/for textbook quality/gi, '')
      .replace(/suitable for grade \d+/gi, '')
      .replace(/grade \d+ students/gi, '')
      .replace(/all text in sans-serif/gi, '')
      .replace(/minimum \d+pt labels/gi, '')
      .trim();
    
    // Extract core concept (first 6-10 meaningful words)
    const words = simplified
      .split(' ')
      .filter(w => w.length > 2)
      .slice(0, 10)
      .join(' ');
    
    return words;
  }

  /**
   * Search Wikimedia Commons with uniqueness check
   */
  static async searchWikimedia(searchQuery, usedInDoc) {
    try {
      const url = 'https://commons.wikimedia.org/w/api.php';
      
      const response = await axios.get(url, {
        params: {
          action: 'query',
          format: 'json',
          list: 'search',
          srsearch: searchQuery,
          srnamespace: 6,
          srlimit: 25, // Increased for more options
          origin: '*'
        },
        timeout: this.timeout,
        headers: {
          'User-Agent': 'EducationalPlatform/1.0 (CBC Educational content)'
        }
      });
      
      const results = response.data?.query?.search;
      
      if (!results || results.length === 0) {
        return null;
      }

      console.log(`[Wikimedia] 📊 Found ${results.length} potential images`);

      // Try each result
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const imageTitle = result.title;
        
        // Quick filter by title
        if (!this.isPotentialDiagram(imageTitle)) {
          continue;
        }

        // Get actual image URL
        const imageUrl = await this.getWikimediaImageUrl(imageTitle);
        
        if (!imageUrl) {
          continue;
        }
        
        // ✅ Critical: Skip if already used in this document
        if (usedInDoc.has(imageUrl)) {
          console.log(`[Wikimedia] ⏭️ Skipping already used: ${imageTitle.substring(0, 40)}`);
          continue;
        }

        // Validate it's educational
        if (this.isEducationalDiagram(imageUrl, imageTitle)) {
          console.log(`[Wikimedia] ✅ Selected: ${imageTitle.substring(0, 60)}...`);
          
          return {
            imageUrl,
            source: 'Wikimedia Commons',
            license: 'CC-BY-SA / Public Domain',
            attribution: `Wikimedia Commons: ${imageTitle.substring(0, 50)}`
          };
        }
      }

      return null;
    } catch (error) {
      console.error('[Wikimedia] ❌ Search error:', error.message);
      return null;
    }
  }

  /**
   * Get actual image URL from Wikimedia
   */
  static async getWikimediaImageUrl(title) {
    try {
      const url = 'https://commons.wikimedia.org/w/api.php';
      
      const response = await axios.get(url, {
        params: {
          action: 'query',
          titles: title,
          prop: 'imageinfo',
          iiprop: 'url|size|mime',
          format: 'json',
          origin: '*'
        },
        timeout: this.timeout,
        headers: {
          'User-Agent': 'EducationalPlatform/1.0'
        }
      });
      
      const pages = response.data?.query?.pages;
      if (!pages) return null;
      
      const pageId = Object.keys(pages)[0];
      const imageInfo = pages[pageId]?.imageinfo?.[0];
      
      if (!imageInfo) return null;

      // Check file size (skip very large files)
      const fileSizeInMB = (imageInfo.size || 0) / (1024 * 1024);
      
      if (fileSizeInMB > 5) {
        console.log(`[Wikimedia] ⚠️ File too large: ${fileSizeInMB.toFixed(2)}MB`);
        return null;
      }

      return imageInfo.url;
    } catch (error) {
      console.error('[Wikimedia] ❌ Image URL error:', error.message);
      return null;
    }
  }

  /**
   * Check if title suggests it's a diagram
   */
  static isPotentialDiagram(title) {
    const lowerTitle = title.toLowerCase();
    
    // Good indicators
    const goodKeywords = [
      'diagram', 'illustration', 'chart', 'schematic', 
      'flowchart', 'labeled', 'labelled', 'structure',
      'educational', 'anatomy', 'system', 'cycle', 
      'process', 'model', '.svg', 'infographic',
      'cross section', 'cutaway', 'exploded view',
      'blueprint', 'layout', 'plan'
    ];
    
    // Bad indicators
    const badKeywords = [
      'photo', 'photograph', 'portrait', 'selfie',
      'picture of', 'image of', 'view of',
      'sunset', 'sunrise', 'landscape',
      'building exterior', 'street', 'city view',
      'logo', 'flag', 'coat of arms', 'emblem',
      'screenshot', 'user interface'
    ];

    const hasGoodKeyword = goodKeywords.some(keyword => lowerTitle.includes(keyword));
    const hasBadKeyword = badKeywords.some(keyword => lowerTitle.includes(keyword));
    
    return hasGoodKeyword && !hasBadKeyword;
  }

  /**
   * Detailed check if image is suitable for education
   */
  static isEducationalDiagram(url, title) {
    const lowerUrl = url.toLowerCase();
    const lowerTitle = title.toLowerCase();
    
    // SVG files are almost always diagrams
    if (lowerUrl.endsWith('.svg')) {
      console.log(`[Wikimedia] ✓ SVG file (preferred)`);
      return true;
    }

    // PNG with strong diagram keywords
    if (lowerUrl.endsWith('.png')) {
      const strongKeywords = ['diagram', 'schematic', 'illustration', 'labeled', 'educational', 'structure', 'chart'];
      const hasStrong = strongKeywords.some(kw => lowerTitle.includes(kw));
      
      if (hasStrong) {
        console.log(`[Wikimedia] ✓ PNG with strong keywords`);
        return true;
      }
    }

    // JPG files - very selective
    if (lowerUrl.endsWith('.jpg') || lowerUrl.endsWith('.jpeg')) {
      const veryStrongKeywords = ['labeled diagram', 'educational diagram', 'schematic diagram', 'illustration diagram'];
      const hasVeryStrong = veryStrongKeywords.some(kw => lowerTitle.includes(kw));
      
      if (!hasVeryStrong) {
        console.log(`[Wikimedia] ✗ JPG without strong keywords`);
        return false;
      }
    }

    return this.isPotentialDiagram(title);
  }

  /**
   * Clear cache for a specific document
   */
  static clearDocumentCache(documentId) {
    if (this.usedImages.has(documentId)) {
      this.usedImages.delete(documentId);
      console.log(`[EduDiagram] 🗑️ Cleared used images for document: ${documentId}`);
    }
  }

  /**
   * Clear all caches
   */
  static clearCache() {
    this.cache.clear();
    this.usedImages.clear();
    console.log('[EduDiagram] 🗑️ All caches cleared');
  }

  /**
   * Reset used images for a document (call at start of generation)
   */
  static resetUsedImages(documentId = 'default') {
    if (!this.usedImages.has(documentId)) {
      this.usedImages.set(documentId, new Set());
    } else {
      this.usedImages.get(documentId).clear();
    }
    console.log(`[EduDiagram] 🔄 Reset used images for document: ${documentId}`);
  }
}

module.exports = EducationalDiagramService;