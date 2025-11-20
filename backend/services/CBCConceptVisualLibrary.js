// CBCConceptVisualLibrary.js - Predefined visual specifications for common CBC concepts
// This library provides detailed visual instructions for frequently taught concepts

class CBCConceptVisualLibrary {
  
  /**
   * ✅ Get visual specification for a specific concept
   */
  static getConceptVisual(concept, subject, grade) {
    const conceptKey = this.generateConceptKey(concept, subject);
    const gradeLevel = this.getGradeLevel(grade);
    
    // Check for exact match
    if (this.CONCEPT_LIBRARY[conceptKey]) {
      return this.adaptToGradeLevel(this.CONCEPT_LIBRARY[conceptKey], gradeLevel);
    }
    
    // Check for partial matches
    const partialMatch = this.findPartialMatch(concept, subject);
    if (partialMatch) {
      return this.adaptToGradeLevel(partialMatch, gradeLevel);
    }
    
    return null; // No match found, use generic generation
  }

  static generateConceptKey(concept, subject) {
    const cleanConcept = concept.toLowerCase().trim();
    const cleanSubject = subject.toLowerCase().trim();
    return `${cleanSubject}:${cleanConcept}`;
  }

  static findPartialMatch(concept, subject) {
    const conceptLower = concept.toLowerCase();
    const subjectLower = subject.toLowerCase();
    
    for (const [key, value] of Object.entries(this.CONCEPT_LIBRARY)) {
      const [keySubject, keyConcept] = key.split(':');
      
      if (keySubject.includes(subjectLower) || subjectLower.includes(keySubject)) {
        if (conceptLower.includes(keyConcept) || keyConcept.includes(conceptLower)) {
          return value;
        }
      }
    }
    
    return null;
  }

  static getGradeLevel(grade) {
    const gradeLower = grade.toLowerCase();
    if (gradeLower.includes('pp1')) return 'pp1';
    if (gradeLower.includes('pp2')) return 'pp2';
    
    const match = gradeLower.match(/grade?\s*(\d+)/i);
    if (match) {
      const num = parseInt(match[1]);
      if (num <= 3) return 'lower_primary';
      if (num <= 6) return 'upper_primary';
      if (num <= 9) return 'junior_secondary';
    }
    
    return 'general';
  }

  static adaptToGradeLevel(conceptSpec, gradeLevel) {
    const adapted = { ...conceptSpec };
    
    // Adjust complexity based on grade
    const complexityMap = {
      'pp1': { elements: 3, labelWords: 1, detailLevel: 'minimal' },
      'pp2': { elements: 4, labelWords: 2, detailLevel: 'simple' },
      'lower_primary': { elements: 5, labelWords: 3, detailLevel: 'basic' },
      'upper_primary': { elements: 7, labelWords: 5, detailLevel: 'moderate' },
      'junior_secondary': { elements: 10, labelWords: 8, detailLevel: 'detailed' },
      'general': { elements: 6, labelWords: 4, detailLevel: 'moderate' }
    };
    
    const complexity = complexityMap[gradeLevel] || complexityMap.general;
    adapted.maxElements = complexity.elements;
    adapted.labelComplexity = complexity.labelWords;
    adapted.detailLevel = complexity.detailLevel;
    
    return adapted;
  }

  /**
   * ✅ COMPREHENSIVE CONCEPT LIBRARY
   */
  static CONCEPT_LIBRARY = {
    
    // ==================== MATHEMATICS ====================
    
    'mathematics:shapes': {
      title: 'Basic Shapes',
      visualType: 'geometric_diagram',
      layout: 'grid_layout',
      elements: [
        'Circle with radius and diameter labeled',
        'Square with equal sides marked',
        'Rectangle with length and width',
        'Triangle with base and height',
        'Real-world examples (wheel, book, roof, flag)'
      ],
      kenyanContext: 'Use Kenyan objects: football, exercise book, house roof, Kenyan flag',
      colorScheme: 'Primary colors for each shape',
      background: 'White with light grid',
      labelStyle: 'Bold, clear mathematical terms'
    },

    'mathematics:numbers': {
      title: 'Number Concepts',
      visualType: 'number_line_diagram',
      layout: 'horizontal_sequence',
      elements: [
        'Number line from 0-10 (PP/Lower) or appropriate range',
        'Objects grouped to show quantities',
        'Kenyan currency for larger numbers',
        'Place value chart if appropriate'
      ],
      kenyanContext: 'Use Kenyan shillings, counting matunda (fruits), pencils',
      colorScheme: 'Blue for numbers, red for emphasis',
      background: 'Clean white',
      labelStyle: 'Large, clear numerals'
    },

    'mathematics:fractions': {
      title: 'Understanding Fractions',
      visualType: 'partitioned_diagram',
      layout: 'comparative_sections',
      elements: [
        'Circle or rectangle divided into equal parts',
        'Shaded portions showing fractions',
        'Real-world examples (chapati, cake, pizza)',
        'Fraction notation clearly shown',
        'Multiple examples: 1/2, 1/4, 1/3, 3/4'
      ],
      kenyanContext: 'Use chapati, mandazi, oranges divided into pieces',
      colorScheme: 'Different colors for numerator and denominator',
      background: 'White',
      labelStyle: 'Clear fraction notation'
    },

    'mathematics:time': {
      title: 'Telling Time',
      visualType: 'clock_diagram',
      layout: 'clock_face_with_examples',
      elements: [
        'Analog clock face with clear hour and minute hands',
        'Digital time display alongside',
        'Daily activities at different times',
        'AM and PM concepts (if appropriate for grade)'
      ],
      kenyanContext: 'Show Kenyan school schedule, meal times, sunset time (6:30pm)',
      colorScheme: 'Blue clock, yellow for important times',
      background: 'White',
      labelStyle: 'Clear time notation'
    },

    'mathematics:measurement': {
      title: 'Units of Measurement',
      visualType: 'comparison_chart',
      layout: 'categorized_sections',
      elements: [
        'Length: ruler showing centimeters and meters',
        'Weight: scale with kilograms',
        'Volume: containers with liters',
        'Real objects being measured'
      ],
      kenyanContext: 'Measure typical Kenyan items: maize sack, water jerrican, exercise book',
      colorScheme: 'Different color for each measurement type',
      background: 'White',
      labelStyle: 'Metric units clearly labeled'
    },

    // ==================== SCIENCE ====================

    'science:parts of a plant': {
      title: 'Parts of a Plant',
      visualType: 'labeled_biological_diagram',
      layout: 'central_specimen_with_callouts',
      elements: [
        'Complete plant showing roots, stem, leaves, flowers, fruits',
        'Each part clearly labeled with function',
        'Cross-section views where helpful',
        'Arrows showing water/nutrient flow'
      ],
      kenyanContext: 'Use Kenyan plants: maize plant, bean plant, or tree (mango, avocado)',
      colorScheme: 'Natural colors: green, brown, realistic',
      background: 'White with subtle soil indication',
      labelStyle: 'Scientific terms with simple explanations'
    },

    'science:water cycle': {
      title: 'The Water Cycle',
      visualType: 'cyclical_process_diagram',
      layout: 'circular_flow',
      elements: [
        'Sun providing heat energy',
        'Evaporation from Lake Victoria or Indian Ocean',
        'Condensation forming clouds',
        'Precipitation as rain',
        'Collection in rivers/lakes',
        'Arrows showing cycle direction'
      ],
      kenyanContext: 'Use Kenyan water bodies: Lake Victoria, Tana River, Mt. Kenya snow',
      colorScheme: 'Blue for water, yellow for sun, white for clouds',
      background: 'Light blue sky, brown land',
      labelStyle: 'Clear process labels with arrows'
    },

    'science:food chain': {
      title: 'Food Chain',
      visualType: 'linear_sequence_diagram',
      layout: 'horizontal_chain',
      elements: [
        'Sun as energy source',
        'Producer: grass or plant',
        'Primary consumer: herbivore',
        'Secondary consumer: carnivore',
        'Decomposer: bacteria/fungi',
        'Arrows showing energy flow'
      ],
      kenyanContext: 'Kenyan savanna: Grass → Zebra → Lion → Decomposers',
      colorScheme: 'Green for plants, natural animal colors',
      background: 'Savanna landscape',
      labelStyle: 'Clear role labels (Producer, Consumer, etc.)'
    },

    'science:human body systems': {
      title: 'Human Body Systems',
      visualType: 'anatomical_diagram',
      layout: 'body_outline_with_systems',
      elements: [
        'Human body outline',
        'Major organs labeled (heart, lungs, stomach, brain)',
        'System highlighted (circulatory, digestive, respiratory)',
        'Simple function descriptions'
      ],
      kenyanContext: 'Use diverse Kenyan body representation, health context',
      colorScheme: 'Anatomically accurate colors, coded by system',
      background: 'White or light gray',
      labelStyle: 'Medical terms with simple explanations'
    },

    'science:states of matter': {
      title: 'States of Matter',
      visualType: 'comparison_diagram',
      layout: 'three_column_comparison',
      elements: [
        'Solid: ice cube with tightly packed particles',
        'Liquid: water with loosely packed particles',
        'Gas: steam with dispersed particles',
        'Examples for each state',
        'Temperature effects shown'
      ],
      kenyanContext: 'Use Kenyan examples: ice from freezer, water from tap, steam from cooking',
      colorScheme: 'Blue for ice, light blue for water, white for steam',
      background: 'White',
      labelStyle: 'Clear state labels and particle diagrams'
    },

    // ==================== SOCIAL STUDIES ====================

    'social studies:map of kenya': {
      title: 'Map of Kenya',
      visualType: 'geographical_map',
      layout: 'map_with_legend',
      elements: [
        'Kenya outline with 47 county boundaries',
        'Neighboring countries labeled',
        'Major cities marked with symbols',
        'Topographical features (mountains, lakes, rivers)',
        'Compass rose',
        'Scale bar',
        'Legend with map symbols'
      ],
      kenyanContext: 'Accurate Kenya map, all counties, capital Nairobi marked',
      colorScheme: 'Standard map colors: blue for water, green/brown for land',
      background: 'Ocean blue, land appropriate colors',
      labelStyle: 'Clear place names in standard font'
    },

    'social studies:weather elements': {
      title: 'Elements of Weather',
      visualType: 'weather_station_diagram',
      layout: 'central_station_with_instruments',
      elements: [
        'Weather station in Kenyan school compound',
        'Thermometer measuring temperature (°C)',
        'Rain gauge measuring rainfall (mm)',
        'Wind vane showing direction',
        'Anemometer for wind speed',
        'Barometer for pressure',
        'Hygrometer for humidity'
      ],
      kenyanContext: 'Typical Kenyan school setting with local landscape',
      colorScheme: 'Natural colors, instruments clearly visible',
      background: 'Kenyan school compound with sky',
      labelStyle: 'Instrument names and measurements'
    },

    'social studies:sources of historical information': {
      title: 'Sources of Historical Information',
      visualType: 'classification_chart',
      layout: 'two_column_simple_division',
      elements: [
        'PRIMARY SOURCES header with 3-4 examples below',
        'SECONDARY SOURCES header with 3-4 examples below',
        'Clear vertical dividing line between columns',
        'Simple icons or illustrations for each source type'
      ],
      kenyanContext: 'Use simple Kenyan examples: elder storytelling, independence photos, Kenya museum, CBC textbooks',
      colorScheme: 'Orange/warm for PRIMARY (left), Purple/cool for SECONDARY (right), white background',
      background: 'Pure white',
      labelStyle: 'Bold 28pt headers, 20pt for examples, all black text',
      maxElements: 10,
      detailLevel: 'simple',
      labelComplexity: 3
    },

    'social studies:distinguish sources': {
      title: 'Primary vs Secondary Sources',
      visualType: 'comparison_chart',
      layout: 'side_by_side_comparison',
      elements: [
        'LEFT: "PRIMARY SOURCES" banner with definition',
        'LEFT: 4 examples (oral history, photos, letters, artifacts)',
        'RIGHT: "SECONDARY SOURCES" banner with definition',
        'RIGHT: 4 examples (textbooks, articles, documentaries, encyclopedias)',
        'Simple icon for each example'
      ],
      kenyanContext: 'PRIMARY: Kenyan elder, independence photo, Jomo Kenyatta letter, traditional artifact. SECONDARY: CBC textbook, newspaper article, documentary, biography',
      colorScheme: 'Orange background for PRIMARY, Blue background for SECONDARY, white cards for examples',
      background: 'White',
      labelStyle: 'Bold 24pt for category names, 18pt for examples',
      maxElements: 10,
      detailLevel: 'moderate',
      labelComplexity: 4
    },

    'social studies:counties of kenya': {
      title: '47 Counties of Kenya',
      visualType: 'political_map',
      layout: 'map_with_county_divisions',
      elements: [
        'Kenya map divided into 47 counties',
        'Each county labeled with name',
        'County boundaries clearly marked',
        'County capitals shown',
        'Color-coded regions'
      ],
      kenyanContext: 'Accurate county boundaries post-2010 constitution',
      colorScheme: 'Different colors for neighboring counties',
      background: 'White land, blue ocean',
      labelStyle: 'Clear county names'
    },

    'social studies:seasons in kenya': {
      title: 'Seasons in Kenya',
      visualType: 'calendar_diagram',
      layout: 'annual_calendar_with_seasons',
      elements: [
        'Calendar showing 12 months',
        'Long Rains (March-May) marked',
        'Short Rains (October-December) marked',
        'Dry seasons marked',
        'Temperature and rainfall indicators',
        'Agricultural activities for each season'
      ],
      kenyanContext: 'Kenyan seasonal patterns, planting seasons',
      colorScheme: 'Blue for rainy, yellow for dry',
      background: 'White calendar grid',
      labelStyle: 'Month names and season descriptions'
    },

    // ==================== LANGUAGES (ENGLISH) ====================

    'english:parts of speech': {
      title: 'Parts of Speech',
      visualType: 'categorized_chart',
      layout: 'grid_with_examples',
      elements: [
        'Nouns: Person, Place, Thing with Kenyan examples',
        'Verbs: Action words with illustrations',
        'Adjectives: Describing words',
        'Adverbs: How/when/where words',
        'Example sentences for each'
      ],
      kenyanContext: 'Use Kenyan vocabulary: matatu, ugali, Nairobi, safari',
      colorScheme: 'Different color for each part of speech',
      background: 'White',
      labelStyle: 'Clear grammatical terms'
    },

    'english:sentence structure': {
      title: 'Sentence Structure',
      visualType: 'sentence_diagram',
      layout: 'building_block_style',
      elements: [
        'Subject + Verb + Object shown as blocks',
        'Example: "The girl reads a book"',
        'Color-coded parts',
        'Multiple example sentences',
        'Punctuation highlighted'
      ],
      kenyanContext: 'Use Kenyan context sentences about school, home, community',
      colorScheme: 'Blue for subject, red for verb, green for object',
      background: 'White',
      labelStyle: 'Clear grammatical labels'
    },

    'english:vowels and consonants': {
      title: 'Vowels and Consonants',
      visualType: 'letter_classification',
      layout: 'alphabetsorted_with_categories',
      elements: [
        'Complete alphabet displayed',
        'Vowels (A, E, I, O, U) highlighted',
        'Consonants in different color',
        'Example words starting with each letter',
        'Kenyan objects/words as examples'
      ],
      kenyanContext: 'Use Kenyan words: Avocado, Elephant, Impala, Orange, Umbrella',
      colorScheme: 'Red for vowels, blue for consonants',
      background: 'White',
      labelStyle: 'Large, clear letters'
    },

    // ==================== KISWAHILI ====================

    'kiswahili:nomino': {
      title: 'Nomino (Nouns)',
      visualType: 'word_chart',
      layout: 'categorized_sections',
      elements: [
        'Categories: Watu (People), Wanyama (Animals), Vitu (Things), Miji (Places)',
        'Examples in each category with pictures',
        'Swahili words clearly displayed',
        'Simple sentences using the nouns'
      ],
      kenyanContext: 'Use common Kenyan Swahili: mwalimu, simba, meza, Mombasa',
      colorScheme: 'Vibrant, friendly colors',
      background: 'White',
      labelStyle: 'Clear Swahili text'
    },

    'kiswahili:vitenzi': {
      title: 'Vitenzi (Verbs)',
      visualType: 'action_illustration',
      layout: 'action_demonstrations',
      elements: [
        'Common actions illustrated: kukimbia, kusoma, kucheza, kula',
        'Person performing each action',
        'Verb in present tense',
        'Simple sentence examples'
      ],
      kenyanContext: 'Kenyan school and home activities',
      colorScheme: 'Action-oriented colors',
      background: 'Simple scene backgrounds',
      labelStyle: 'Clear Swahili verbs'
    },

    // ==================== AGRICULTURE ====================

    'agriculture:parts of a farm': {
      title: 'Parts of a Farm',
      visualType: 'farm_layout',
      layout: 'aerial_view_sections',
      elements: [
        'Shamba (plot) with crop sections',
        'Animal pen (boma)',
        'Storage area',
        'Water source',
        'Farm tools area',
        'Kenyan farmhouse (nyumba)'
      ],
      kenyanContext: 'Typical Kenyan small-scale farm in rural area',
      colorScheme: 'Natural farm colors: green, brown, earth tones',
      background: 'Farm setting',
      labelStyle: 'Clear farm terminology'
    },

    'agriculture:maize growth stages': {
      title: 'Growth Stages of Maize',
      visualType: 'growth_sequence',
      layout: 'timeline_progression',
      elements: [
        'Stage 1: Seed planted in soil',
        'Stage 2: Germination (sprout appears)',
        'Stage 3: Vegetative growth (leaves develop)',
        'Stage 4: Tasseling and silking',
        'Stage 5: Grain filling',
        'Stage 6: Maturity and harvest',
        'Time period for each stage'
      ],
      kenyanContext: 'Kenyan maize variety, typical growing season (March-August)',
      colorScheme: 'Brown soil, green plant, yellow mature grain',
      background: 'Farm field setting',
      labelStyle: 'Stage numbers and descriptions'
    },

    'agriculture:farm tools': {
      title: 'Common Farm Tools',
      visualType: 'tool_showcase',
      layout: 'grid_of_tools',
      elements: [
        'Jembe (hoe) - for digging',
        'Panga (machete) - for cutting',
        'Rake - for leveling soil',
        'Wheelbarrow - for transport',
        'Watering can - for irrigation',
        'Spade - for digging',
        'Usage for each tool shown'
      ],
      kenyanContext: 'Tools commonly used in Kenyan farms',
      colorScheme: 'Natural tool colors',
      background: 'White or farm setting',
      labelStyle: 'Tool names in English and Swahili'
    },

    // ==================== PHYSICAL EDUCATION ====================

    'physical education:running technique': {
      title: 'Proper Running Technique',
      visualType: 'form_demonstration',
      layout: 'sequential_positions',
      elements: [
        'Starting position',
        'Arm swing (90-degree angle)',
        'Leg stride (knee lift)',
        'Foot placement (forefoot strike)',
        'Body posture (upright, lean slightly forward)',
        'Breathing technique'
      ],
      kenyanContext: 'Reference Kenya\'s athletics excellence, school sports',
      colorScheme: 'Dynamic, energetic colors',
      background: 'Running track or field',
      labelStyle: 'Clear technique labels'
    },

    'physical education:safety rules': {
      title: 'Sports Safety Rules',
      visualType: 'safety_infographic',
      layout: 'icon_based_rules',
      elements: [
        'Warm up before exercise',
        'Wear proper sports attire',
        'Stay hydrated (water bottle)',
        'Use equipment correctly',
        'Follow game rules',
        'Cool down after exercise'
      ],
      kenyanContext: 'Kenyan school sports context',
      colorScheme: 'Green for safe, red for caution',
      background: 'Sports field',
      labelStyle: 'Clear, simple safety rules'
    },

    // ==================== HOME SCIENCE ====================

    'home science:balanced diet': {
      title: 'Balanced Diet',
      visualType: 'food_plate_diagram',
      layout: 'plate_method',
      elements: [
        'Plate divided into food groups',
        'Carbohydrates: Ugali, rice, chapati (largest section)',
        'Proteins: Meat, beans, fish, eggs (medium section)',
        'Vitamins: Sukuma wiki, fruits, vegetables (medium section)',
        'Water glass on the side',
        'Portion sizes indicated'
      ],
      kenyanContext: 'Typical Kenyan meals and foods',
      colorScheme: 'Natural food colors',
      background: 'Dining table setting',
      labelStyle: 'Food group labels'
    },

    'home science:food hygiene': {
      title: 'Food Hygiene Practices',
      visualType: 'step_process',
      layout: 'sequential_steps',
      elements: [
        'Wash hands before cooking',
        'Clean utensils and surfaces',
        'Wash fruits and vegetables',
        'Cook food thoroughly',
        'Store food properly (covered, refrigerated)',
        'Dispose waste correctly'
      ],
      kenyanContext: 'Kenyan kitchen setting',
      colorScheme: 'Clean, hygienic colors (blues, whites)',
      background: 'Kenyan kitchen',
      labelStyle: 'Clear hygiene steps'
    },

    // ==================== BUSINESS STUDIES ====================

    'business studies:kenyan currency': {
      title: 'Kenyan Currency',
      visualType: 'currency_display',
      layout: 'value_progression',
      elements: [
        'Coins: 1, 5, 10, 20 shillings',
        'Notes: 50, 100, 200, 500, 1000 shillings',
        'Both sides shown',
        'Security features pointed out',
        'Value comparison'
      ],
      kenyanContext: 'Actual Kenyan shilling designs',
      colorScheme: 'Accurate currency colors',
      background: 'White or subtle',
      labelStyle: 'Denomination labels'
    },

    'business studies:supply and demand': {
      title: 'Supply and Demand',
      visualType: 'economic_diagram',
      layout: 'market_scenario',
      elements: [
        'Market scene with buyers and sellers',
        'High supply = lower prices (many goods)',
        'Low supply = higher prices (few goods)',
        'High demand = higher prices (many buyers)',
        'Low demand = lower prices (few buyers)',
        'Graph showing relationship'
      ],
      kenyanContext: 'Kenyan market (gikomba, marikiti)',
      colorScheme: 'Economic colors (greens for profit, reds for loss)',
      background: 'Market setting',
      labelStyle: 'Economic terms'
    },

    // ==================== ICT / COMPUTER ====================

    'ict:parts of a computer': {
      title: 'Parts of a Computer',
      visualType: 'labeled_device_diagram',
      layout: 'central_computer_with_callouts',
      elements: [
        'Monitor - displays information',
        'Keyboard - for typing input',
        'Mouse - for pointing and clicking',
        'CPU/System Unit - processes information',
        'Speakers - for sound output',
        'Printer - for paper output (optional)'
      ],
      kenyanContext: 'Kenyan school computer lab setting',
      colorScheme: 'Tech colors (grays, blacks, blues)',
      background: 'Computer lab or desk',
      labelStyle: 'Clear component labels'
    },

    'ict:internet safety': {
      title: 'Internet Safety Rules',
      visualType: 'safety_infographic',
      layout: 'do_and_dont',
      elements: [
        'DO: Keep passwords private',
        'DO: Tell adults about suspicious content',
        'DO: Use respectful language online',
        'DON\'T: Share personal information',
        'DON\'T: Meet online strangers',
        'DON\'T: Click unknown links'
      ],
      kenyanContext: 'Kenyan students using devices',
      colorScheme: 'Green for DO, red for DON\'T',
      background: 'Digital/tech themed',
      labelStyle: 'Clear safety rules'
    },

    // ==================== CREATIVE ARTS ====================

    'art:color wheel': {
      title: 'Color Wheel',
      visualType: 'color_theory_diagram',
      layout: 'circular_color_arrangement',
      elements: [
        'Primary colors: Red, Yellow, Blue (triangle)',
        'Secondary colors: Orange, Green, Purple',
        'Color mixing demonstrations',
        'Warm vs Cool colors',
        'Complementary colors shown'
      ],
      kenyanContext: 'Using locally available paints/crayons',
      colorScheme: 'Full spectrum accurately shown',
      background: 'White',
      labelStyle: 'Color names clearly labeled'
    },

    'art:traditional kenyan patterns': {
      title: 'Traditional Kenyan Patterns',
      visualType: 'pattern_showcase',
      layout: 'pattern_samples',
      elements: [
        'Maasai beadwork patterns',
        'Kikuyu basket weaving patterns',
        'Luo pottery designs',
        'Coastal Swahili architecture patterns',
        'Kamba wood carving motifs'
      ],
      kenyanContext: 'Authentic Kenyan ethnic art patterns',
      colorScheme: 'Traditional colors for each ethnic group',
      background: 'Neutral to show patterns',
      labelStyle: 'Ethnic group and pattern name'
    }
  };

  /**
   * ✅ Get all concepts for a specific subject
   */
  static getConceptsBySubject(subject) {
    const subjectLower = subject.toLowerCase();
    const concepts = [];
    
    for (const [key, value] of Object.entries(this.CONCEPT_LIBRARY)) {
      const [keySubject] = key.split(':');
      if (keySubject.includes(subjectLower) || subjectLower.includes(keySubject)) {
        concepts.push({ key, ...value });
      }
    }
    
    return concepts;
  }

  /**
   * ✅ Get all concepts for a specific grade level
   */
  static getConceptsByGrade(grade) {
    // All concepts can be adapted to any grade through adaptToGradeLevel
    // This returns appropriate complexity versions
    const gradeLevel = this.getGradeLevel(grade);
    const allConcepts = Object.entries(this.CONCEPT_LIBRARY).map(([key, value]) => ({
      key,
      ...this.adaptToGradeLevel(value, gradeLevel)
    }));
    
    return allConcepts;
  }
}

module.exports = CBCConceptVisualLibrary;