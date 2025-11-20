// DocumentGeneratorFactory.js - COMPLETE VERSION with FIXED markdown cleaning
const LessonConceptGenerator = require('./documentGenerators/LessonConceptGenerator');
const SchemesGenerator = require('./documentGenerators/SchemesGenerator');
const LessonPlanGenerator = require('./documentGenerators/LessonPlanGenerator');
const LessonNotesGenerator = require('./documentGenerators/LessonNotesGenerator');
const ExercisesGenerator = require('./documentGenerators/ExercisesGenerator');
const DiagramService = require('./DiagramService');
const { postProcessGeneratedContent, expandSLOs } = require('../utils/contentProcessor');
const Document = require('../models/Document');

class DocumentGeneratorFactory {
  static generators = {
    'Lesson Concept Breakdown': new LessonConceptGenerator(),
    'Schemes of Work': new SchemesGenerator(),
    'Lesson Plan': new LessonPlanGenerator(),
    'Lesson Notes': new LessonNotesGenerator(),
    'Exercises': new ExercisesGenerator()
  };

  static cbcCache = new Map();
  static cacheTimeout = 5 * 60 * 1000;
  static MAX_CONTENT_SIZE = 16000000;
  static MAX_DIAGRAMS = 5;

  static getCachedCBC(key) {
    const cached = this.cbcCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cbcCache.delete(key);
    return null;
  }

  static setCachedCBC(key, data) {
    this.cbcCache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * ✅ MAIN GENERATION METHOD - FIXED markdown cleaning
   */
  static async generate(type, requestData, cbcEntry) {
    const startTime = Date.now();
    
    try {
      console.log(`[DocumentGen] Starting ${type} generation with web references only...`);
      
      if (!requestData || !cbcEntry) {
        throw new Error('Missing required data for document generation');
      }

      // Generate AI content
      const aiContent = await this.generateWithSLOBasedDiagramInstructions(
        type, 
        requestData, 
        cbcEntry
      );
      
      let processedContent = postProcessGeneratedContent(aiContent, type);
      let finalContent = processedContent;
      let diagramStats = { total: 0, successful: 0, failed: 0, skipped: 0 };

      // ✅ Check for diagram placeholders
      console.log(`[DocumentGen] Checking for diagram placeholders...`);
      const hasDiagramPlaceholders = processedContent.includes('[DIAGRAM:');
      console.log(`[DocumentGen] Diagram placeholders found: ${hasDiagramPlaceholders}`);

      if (hasDiagramPlaceholders) {
        try {
          console.log('[DocumentGen] 🖼️ Processing diagrams with LOCAL IMAGE LIBRARY...');
          
          const diagramResult = await DiagramService.processInlineDiagrams(
            processedContent,
            {
              grade: requestData.grade,
              learningArea: requestData.learningArea,
              strand: requestData.strand,
              substrand: requestData.substrand,
              cbcEntry: cbcEntry,
              maxDiagrams: 5,
              learningConcepts: requestData.learningConcepts || []
            }
          );
          
          if (diagramResult && diagramResult.content) {
            finalContent = diagramResult.content;
            diagramStats = diagramResult.stats || diagramStats;

            // 🔍 DEBUG: Check final content for image URLs
        console.log('[DocumentGen] 🔍 DEBUG: Checking final content for image URLs:');
        const imageUrls = finalContent.match(/!\[.*?\]\((.*?)\)/g) || [];
        imageUrls.forEach((url, index) => {
          console.log(`[DocumentGen] 🔍 DEBUG: Image URL ${index + 1}: ${url}`);
        });
            
            // ✅ FIXED: ONLY clean markdown, NEVER add it back
            console.log('[DocumentGen] 🧹 Cleaning markdown from content...');
            
            // 1. Remove ** from figure headings ONLY (don't add them back)
            finalContent = finalContent.replace(
              /###\s+([^\n]*Figure\s+\d+:)\s*\*\*([^\*]+)\*\*([^\n]*)/gi,
              '### $1 $2$3'
            );

            // 2. Remove ** from concept names in ANY context
            finalContent = finalContent.replace(/\*\*([^\*]+)\*\*/g, '$1');

            // 3. Clean image markdown: remove any ** from alt text and URLs
            finalContent = finalContent.replace(
              /!\[([^\]]*)\]\(([^)]+)\)/g,
              (match, alt, url) => {
                // Clean alt text - ONLY REMOVE markdown, never add
                const cleanAlt = alt
                  .replace(/\*\*/g, '')
                  .replace(/\*/g, '')
                  .replace(/\_\_/g, '')
                  .replace(/\_/g, '')
                  .trim();
                
                // Clean URL - ONLY REMOVE markdown, never add
                const cleanUrl = url
                  .replace(/\*\*/g, '')
                  .replace(/\*/g, '')
                  .replace(/\_\_/g, '')
                  .replace(/\_/g, '')
                  .trim();
                
                return `![${cleanAlt}](${cleanUrl})`;
              }
            );
            
            console.log('[DocumentGen] ✅ Cleaned markdown formatting from content');
            
            console.log(`[DocumentGen] ✅ Processed diagrams:`);
            console.log(`[DocumentGen]    Total: ${diagramStats.total}`);
            console.log(`[DocumentGen]    Successful: ${diagramStats.successful}`);
            console.log(`[DocumentGen]    Skipped: ${diagramStats.skipped}`);
            
            if (diagramStats.averageMatchScore) {
              console.log(`[DocumentGen]    Average match: ${diagramStats.averageMatchScore}%`);
            }
          } else {
            console.warn('[DocumentGen] ⚠️ Diagram processing returned no result');
          }
        } catch (diagramError) {
          console.error('[DocumentGen] ❌ Local image processing failed:', diagramError.message);
          // Remove placeholders if processing fails
          finalContent = processedContent.replace(/\[DIAGRAM:[^\]]+\]/g, '');
        }
      } else {
        console.log('[DocumentGen] ℹ️ No diagram placeholders in content - skipping diagram processing');
      }

      // Create document metadata
      const documentMetadata = {
        generationTime: Date.now() - startTime,
        diagramStats: diagramStats,
        cbcDataQuality: this.assessCBCQuality(cbcEntry),
        aiModel: 'gpt-4o-mini',
        contentLength: finalContent.length,
        localImages: diagramStats.successful || 0,
        hasImages: (diagramStats.successful || 0) > 0
      };

      // Create document
      const newDoc = await Document.create({
        teacher: requestData.teacher,
        type,
        term: requestData.term,
        grade: requestData.grade,
        school: requestData.school || "Educational Institution",
        subject: requestData.learningArea,
        strand: requestData.strand,
        substrand: requestData.substrand,
        cbcEntry: cbcEntry._id,
        content: finalContent,
        diagrams: [],
        references: {
          slo: cbcEntry.slo?.slice(0, 3).join('; ') || '',
          experiences: cbcEntry.learningExperiences?.slice(0, 2).join('; ') || '',
          assessments: cbcEntry.assessment?.map(a => a.skill).slice(0, 3).join(', ') || '',
          keyConcepts: this.extractKeyConcepts(cbcEntry.slo)
        },
        resources: cbcEntry.resources || [],
        keyInquiryQuestions: cbcEntry.keyInquiryQuestions || [],
        status: "completed",
        metadata: documentMetadata,
        version: 1,
        generatedBy: 'AI with local image library'
      });

      console.log(`[DocumentGen] ✅ ${type} generated successfully in ${Date.now() - startTime}ms`);
      console.log(`[DocumentGen] Document ID: ${newDoc._id}`);
      console.log(`[DocumentGen] Local images: ${diagramStats.successful || 0}`);
      
      return newDoc;

    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`[DocumentGen] ❌ Generation failed after ${totalTime}ms:`, error);
      throw error;
    }
  }

  /**
   * ✅ Generate content with SLO-based diagram instructions
   */
  static async generateWithSLOBasedDiagramInstructions(type, requestData, cbcEntry) {
    const generator = this.generators[type];
    
    if (!generator) {
      throw new Error(`No generator found for type: ${type}`);
    }

    // Enhance request data with SLO-based diagram instructions
    const enhancedRequestData = {
      ...requestData,
      diagramInstructions: this.getSLOBasedDiagramInstructions(cbcEntry),
      maxDiagrams: this.MAX_DIAGRAMS,
      cbcContext: {
        specificLearningOutcomes: cbcEntry.specificLearningOutcomes || cbcEntry.slo || [],
        keyInquiryQuestions: cbcEntry.keyInquiryQuestions || [],
        suggestedLearningActivities: cbcEntry.suggestedLearningActivities || cbcEntry.learningExperiences || [],
        coreCompetencies: cbcEntry.coreCompetencies || [],
        values: cbcEntry.values || [],
        keyConcepts: this.extractKeyConcepts(cbcEntry.slo)
      }
    };

    return await generator.generate(enhancedRequestData, cbcEntry);
  }

  /**
   * ✅ Get SLO-based diagram instructions
   */
  static getSLOBasedDiagramInstructions(cbcEntry) {
    if (!cbcEntry?.slo || cbcEntry.slo.length === 0) {
      return this.getGenericDiagramInstructions();
    }

    const keyConcepts = this.extractKeyConcepts(cbcEntry.slo);
    const diagramType = this.determineDiagramTypeFromSLO(cbcEntry.slo, cbcEntry.learningArea);

    return `
🎯 SLO-BASED DIAGRAM GENERATION

SPECIFIC LEARNING OUTCOMES:
${cbcEntry.slo.map((slo, i) => `${i+1}. ${slo}`).join('\n')}

KEY CONCEPTS IDENTIFIED: ${keyConcepts.join(', ')}
RECOMMENDED DIAGRAM TYPE: ${diagramType}

CRITICAL DIAGRAM REQUIREMENTS:
1. Each diagram MUST directly illustrate the specific learning outcomes above
2. Include Kenyan context and real-world examples
3. Use professional educational style suitable for ${cbcEntry.grade}
4. White background for printability
5. Clear labels and annotations (minimum 16pt font)
6. Maximum ${this.MAX_DIAGRAMS} strategically placed diagrams

DIAGRAM FORMAT INSTRUCTIONS:
When you need to include a diagram, use this EXACT JSON format:

[DIAGRAM:{
  "description": "Detailed description for AI image generation (40+ words with specific visual elements)",
  "caption": "Educational caption for students (Figure X: ...)",
  "context": "Why this diagram is needed at this point",
  "educationalPurpose": "What students should learn from this diagram - reference specific SLO",
  "visualElements": ["specific element 1", "specific element 2", "specific element 3"],
  "labels": ["label 1", "label 2", "label 3"],
  "sloReference": "Specific learning outcome this diagram supports"
}]

Focus on the most important concepts that need visual explanation from the learning outcomes above.
`;
  }

  /**
   * ✅ Extract key concepts from SLO array
   */
  static extractKeyConcepts(sloArray) {
    if (!sloArray || sloArray.length === 0) return [];
    
    const concepts = new Set();
    
    sloArray.forEach(slo => {
      const sloLower = slo.toLowerCase();
      
      const cleaned = sloLower
        .replace(/(describe|explain|identify|analyze|compare|contrast|classify|demonstrate|understand|learn about)\s+/g, '')
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .trim();
      
      const words = cleaned.split(/\s+/)
        .filter(word => word.length > 3)
        .slice(0, 5);
      
      words.forEach(word => concepts.add(word));
    });

    return Array.from(concepts);
  }

  /**
   * ✅ Determine diagram type from SLO content
   */
  static determineDiagramTypeFromSLO(sloArray, learningArea) {
    if (!sloArray || sloArray.length === 0) return 'educational_infographic';
    
    const combinedSLO = sloArray.join(' ').toLowerCase();
    const learningAreaLower = learningArea.toLowerCase();

    if (learningAreaLower.includes('social')) {
      if (combinedSLO.includes('map') || combinedSLO.includes('location')) return 'geographical_map';
      if (combinedSLO.includes('weather') || combinedSLO.includes('climate')) return 'meteorological_chart';
      if (combinedSLO.includes('population') || combinedSLO.includes('settlement')) return 'demographic_infographic';
      if (combinedSLO.includes('government') || combinedSLO.includes('structure')) return 'organizational_chart';
      if (combinedSLO.includes('historical') || combinedSLO.includes('timeline')) return 'historical_timeline';
      return 'conceptual_infographic';
    }

    if (learningAreaLower.includes('science')) {
      if (combinedSLO.includes('cell') || combinedSLO.includes('organism')) return 'biological_diagram';
      if (combinedSLO.includes('energy') || combinedSLO.includes('force')) return 'physics_diagram';
      if (combinedSLO.includes('chemical') || combinedSLO.includes('reaction')) return 'chemical_diagram';
      if (combinedSLO.includes('ecosystem') || combinedSLO.includes('environment')) return 'ecological_diagram';
      return 'scientific_illustration';
    }

    if (learningAreaLower.includes('math')) {
      if (combinedSLO.includes('geometry') || combinedSLO.includes('shape')) return 'geometric_diagram';
      if (combinedSLO.includes('algebra') || combinedSLO.includes('equation')) return 'algebraic_diagram';
      if (combinedSLO.includes('graph') || combinedSLO.includes('chart')) return 'data_visualization';
      return 'mathematical_illustration';
    }

    return 'educational_infographic';
  }

  /**
   * ✅ Get generic diagram instructions (fallback)
   */
  static getGenericDiagramInstructions() {
    return `
CRITICAL DIAGRAM FORMAT INSTRUCTIONS:
When you need to include a diagram, use this EXACT JSON format:

[DIAGRAM:{
  "description": "Detailed description for AI image generation (40+ words with specific visual elements)",
  "caption": "Educational caption for students (Figure X: ...)",
  "context": "Why this diagram is needed at this point",
  "educationalPurpose": "What students should learn from this diagram",
  "visualElements": ["specific element 1", "specific element 2", "specific element 3"],
  "labels": ["label 1", "label 2", "label 3"]
}]

KEY RULES:
1. Description must be 40+ words with SPECIFIC visual details
2. Include ALL visual elements that should appear
3. Specify ALL labels that should be on the diagram
4. Use white background for printability
5. Include maximum ${this.MAX_DIAGRAMS} strategically placed diagrams total
6. Focus on the most important concepts that need visual explanation
7. Avoid redundant or similar diagrams
8. Include Kenyan context and examples
`;
  }

  /**
   * ✅ Assess CBC data quality
   */
  static assessCBCQuality(cbcEntry) {
    let score = 100;
    const issues = [];
    
    if (!cbcEntry.slo || cbcEntry.slo.length === 0) {
      score -= 30;
      issues.push('Missing specific learning outcomes');
    } else {
      const validSLOs = cbcEntry.slo.filter(slo => slo && slo.length > 10);
      if (validSLOs.length < cbcEntry.slo.length) {
        score -= 10;
        issues.push('Some learning outcomes are too short or invalid');
      }
    }
    
    if (!cbcEntry.keyInquiryQuestions || cbcEntry.keyInquiryQuestions.length === 0) {
      score -= 20;
      issues.push('Missing key inquiry questions');
    }
    
    if (!cbcEntry.learningExperiences || cbcEntry.learningExperiences.length === 0) {
      score -= 20;
      issues.push('Missing learning experiences');
    }
    
    if (!cbcEntry.resources || cbcEntry.resources.length === 0) {
      score -= 10;
      issues.push('Missing resources');
    }
    
    if (!cbcEntry.assessment || cbcEntry.assessment.length === 0) {
      score -= 10;
      issues.push('Missing assessment criteria');
    }
    
    return {
      score: Math.max(0, score),
      issues: issues,
      quality: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor',
      sloCount: cbcEntry.slo?.length || 0,
      hasDiagramPotential: (cbcEntry.slo?.length || 0) > 0
    };
  }

  /**
   * Clear cache
   */
  static clearCache() {
    this.cbcCache.clear();
    console.log('[DocumentGen] CBC cache cleared');
  }

  /**
   * Get cache stats
   */
  static getCacheStats() {
    return {
      size: this.cbcCache.size,
      timeout: this.cacheTimeout,
      entries: Array.from(this.cbcCache.keys())
    };
  }

  /**
   * Get factory configuration
   */
  static getConfig() {
    return {
      maxDiagrams: this.MAX_DIAGRAMS,
      maxContentSize: this.MAX_CONTENT_SIZE,
      supportedTypes: Object.keys(this.generators),
      cacheSize: this.cbcCache.size,
      features: {
        sloBasedDiagrams: true,
        webReferences: true,
        linkedDocuments: true,
        contentOptimization: true
      }
    };
  }
}

module.exports = DocumentGeneratorFactory;