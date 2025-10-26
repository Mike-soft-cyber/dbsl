// DocumentGeneratorFactory.js - COMPLETE WITH SLO-BASED DIAGRAM INTEGRATION

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
  static MAX_CONTENT_SIZE = 16000000; // 16MB MongoDB limit
  static MAX_DIAGRAMS = 5; // Maximum diagrams per document

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
   * ✅ ENHANCED: Main document generation with SLO-based diagram support
   */
  static async generate(type, requestData, cbcEntry) {
    const startTime = Date.now();
    
    try {
      console.log(`[DocumentGen] Starting ${type} generation with SLO-based diagrams...`);
      
      // ✅ Validate inputs before generation
      if (!requestData || !cbcEntry) {
        throw new Error('Missing required data for document generation');
      }

      if (!requestData.grade || !requestData.learningArea) {
        throw new Error('Grade and learning area are required');
      }
      
      // STEP 1: Generate AI content with SLO-based diagram instructions
      console.log('[DocumentGen] Step 1: Generating AI content with SLO-based diagrams...');
      const aiContent = await this.generateWithSLOBasedDiagramInstructions(
        type, 
        requestData, 
        cbcEntry
      );

      if (!aiContent || aiContent.length < 100) {
        throw new Error('AI generated insufficient content');
      }
        
      // STEP 2: Apply post-processing
      console.log('[DocumentGen] Step 2: Post-processing content...');
      const processedContent = postProcessGeneratedContent(aiContent, type);
      
      // STEP 3: Process diagrams with SLO context
      console.log('[DocumentGen] Step 3: Processing diagrams with SLO context...');
      let finalContent = processedContent;
      let diagramStats = { total: 0, successful: 0, failed: 0 };
      let processedDiagrams = [];

      // Check if content has diagram placeholders
      const hasDiagramPlaceholders = processedContent.includes('[DIAGRAM:');

      if (hasDiagramPlaceholders) {
        try {
          console.log('[DocumentGen] Found diagram placeholders, processing with SLO context...');
          
          const diagramResult = await DiagramService.processInlineDiagrams(
            processedContent,
            {
              grade: requestData.grade,
              learningArea: requestData.learningArea,
              strand: requestData.strand,
              substrand: requestData.substrand,
              cbcEntry: cbcEntry,
              cbcSLO: cbcEntry?.slo || [], // ✅ Pass SLO array for diagram analysis
              documentId: null,
              maxDiagrams: this.MAX_DIAGRAMS,
              learningConcepts: requestData.learningConcepts || [] // ✅ Pass learning concepts
            }
          );
          
          if (diagramResult && diagramResult.content) {
            finalContent = diagramResult.content;
            diagramStats = diagramResult.stats || diagramStats;
            processedDiagrams = diagramResult.diagrams || [];
            
            console.log(`[DocumentGen] ✅ Diagram processing complete: ${diagramStats.successful}/${diagramStats.total} successful`);
            
            // ✅ DEBUG: Log what the final content contains
            console.log('[DocumentGen] Final content sample:', finalContent.substring(0, 500));
            console.log('[DocumentGen] Has base64 images:', finalContent.includes('data:image/png;base64'));
            console.log('[DocumentGen] Has diagram placeholders:', finalContent.includes('[DIAGRAM:'));
            console.log('[DocumentGen] Content length before size check:', finalContent.length);
          } else {
            console.warn('[DocumentGen] ⚠️ Diagram processing returned no result');
            // Remove placeholders if processing failed
            finalContent = processedContent.replace(/\[DIAGRAM:[^\]]+\]/g, '*[Diagram unavailable]*');
          }
        } catch (diagramError) {
          console.error('[DocumentGen] ❌ Diagram processing failed:', diagramError.message);
          // Remove placeholders on error but continue with document creation
          finalContent = processedContent.replace(/\[DIAGRAM:[^\]]+\]/g, '*[Diagram unavailable]*');
          diagramStats = { total: 0, successful: 0, failed: 0 };
        }
      } else {
        console.log('[DocumentGen] No diagram placeholders found in content');
      }

      // ✅ CRITICAL: Convert ALL base64 to file references to reduce size
      console.log('[DocumentGen] Converting base64 to file references for size optimization...');
      if (finalContent.includes('data:image/png;base64')) {
        const base64Count = (finalContent.match(/data:image\/png;base64/g) || []).length;
        console.log(`[DocumentGen] Converting ${base64Count} base64 images to file references`);
        
        finalContent = finalContent.replace(
          /!\[(.*?)\]\((data:image\/png;base64,[^)]+)\)/g, 
          (match, alt, base64) => {
            return `![${alt}](/api/diagrams/placeholder.png)`;
          }
        );
      }

      console.log('[DocumentGen] Final content length after optimization:', finalContent.length);

      if (finalContent.length > this.MAX_CONTENT_SIZE) {
        console.error(`[DocumentGen] ❌ Content still too large after optimization: ${finalContent.length} bytes`);
        throw new Error(`Generated content too large (${finalContent.length} bytes). Please reduce the number of diagrams or content.`);
      }
      
      // STEP 4: Expand SLOs if available
      if (cbcEntry.slo?.length) {
        console.log('[DocumentGen] Step 4: Expanding SLOs...');
        finalContent = expandSLOs(finalContent, cbcEntry.slo);
      }
      
      // STEP 5: Create document with enhanced metadata
      console.log('[DocumentGen] Step 5: Creating document with SLO-based metadata...');

      const documentMetadata = {
        generationTime: Date.now() - startTime,
        diagramStats: diagramStats,
        cbcDataQuality: this.assessCBCQuality(cbcEntry),
        aiModel: 'gpt-4o-mini',
        contentLength: finalContent.length,
        tableDetected: finalContent.includes('|') && finalContent.split('|').length > 10,
        hasImages: processedDiagrams.length > 0,
        diagramsRequested: (processedContent.match(/\[DIAGRAM:/g) || []).length,
        sizeOptimized: finalContent.length !== processedContent.length,
        sloBasedDiagrams: diagramStats.successful > 0 && cbcEntry?.slo?.length > 0,
        learningConceptsCount: requestData.learningConcepts?.length || 0,
        sourceConceptBreakdown: requestData.sourceLessonConceptId || null
      };

      // ✅ Format diagrams for storage (use file references only)
      const formattedDiagrams = this.formatDiagramsForStorage(processedDiagrams);

      console.log(`[DocumentGen] Creating document with ${formattedDiagrams.length} SLO-based diagrams`);

      // ✅ Create document with optimized content
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
        
        // Store the optimized final content (with file references, not base64)
        content: finalContent,
        
        // Store diagrams with file references only (no base64)
        diagrams: formattedDiagrams,
        
        // CBC references with SLO context
        references: {
          slo: cbcEntry.slo?.slice(0, 3).join('; ') || '',
          experiences: cbcEntry.learningExperiences?.slice(0, 2).join('; ') || '',
          assessments: cbcEntry.assessment?.map(a => a.skill).slice(0, 3).join(', ') || '',
          keyConcepts: this.extractKeyConcepts(cbcEntry.slo) // ✅ New: Store key concepts
        },
        
        // Additional CBC data
        resources: cbcEntry.resources || [],
        keyInquiryQuestions: cbcEntry.keyInquiryQuestions || [],
        
        // Status
        status: "completed",
        
        // Enhanced Metadata
        metadata: documentMetadata,
        
        // Version tracking
        version: 1,
        generatedBy: 'AI with SLO-based diagrams'
      });

      const totalTime = Date.now() - startTime;
      console.log(`[DocumentGen] ✅ ${type} generated successfully in ${totalTime}ms`);
      console.log(`[DocumentGen] Document ID: ${newDoc._id}, Status: ${newDoc.status}`);
      console.log(`[DocumentGen] Diagrams: ${diagramStats.successful} successful, ${diagramStats.failed} failed`);
      console.log(`[DocumentGen] SLO-based diagrams: ${documentMetadata.sloBasedDiagrams}`);
      console.log(`[DocumentGen] Final content size: ${finalContent.length} bytes`);
      
      return newDoc;

    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`[DocumentGen] ❌ Failed to generate ${type} after ${totalTime}ms:`, error);
      
      throw new Error(`Document generation failed: ${error.message}`);
    }
  }

  /**
   * ✅ NEW: Generate content with SLO-based diagram instructions
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
        keyConcepts: this.extractKeyConcepts(cbcEntry.slo) // ✅ Add key concepts
      }
    };

    return await generator.generate(enhancedRequestData, cbcEntry);
  }

  /**
   * ✅ NEW: Get SLO-based diagram instructions
   */
  static getSLOBasedDiagramInstructions(cbcEntry) {
    if (!cbcEntry?.slo || cbcEntry.slo.length === 0) {
      return this.getGenericDiagramInstructions(); // Fallback to generic
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
   * ✅ NEW: Extract key concepts from SLO array
   */
  static extractKeyConcepts(sloArray) {
    if (!sloArray || sloArray.length === 0) return [];
    
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
   * ✅ NEW: Determine diagram type from SLO content
   */
  static determineDiagramTypeFromSLO(sloArray, learningArea) {
    if (!sloArray || sloArray.length === 0) return 'educational_infographic';
    
    const combinedSLO = sloArray.join(' ').toLowerCase();
    const learningAreaLower = learningArea.toLowerCase();

    // Social Studies patterns
    if (learningAreaLower.includes('social')) {
      if (combinedSLO.includes('map') || combinedSLO.includes('location')) return 'geographical_map';
      if (combinedSLO.includes('weather') || combinedSLO.includes('climate')) return 'meteorological_chart';
      if (combinedSLO.includes('population') || combinedSLO.includes('settlement')) return 'demographic_infographic';
      if (combinedSLO.includes('government') || combinedSLO.includes('structure')) return 'organizational_chart';
      if (combinedSLO.includes('historical') || combinedSLO.includes('timeline')) return 'historical_timeline';
      return 'conceptual_infographic';
    }

    // Science patterns
    if (learningAreaLower.includes('science')) {
      if (combinedSLO.includes('cell') || combinedSLO.includes('organism')) return 'biological_diagram';
      if (combinedSLO.includes('energy') || combinedSLO.includes('force')) return 'physics_diagram';
      if (combinedSLO.includes('chemical') || combinedSLO.includes('reaction')) return 'chemical_diagram';
      if (combinedSLO.includes('ecosystem') || combinedSLO.includes('environment')) return 'ecological_diagram';
      return 'scientific_illustration';
    }

    // Mathematics patterns
    if (learningAreaLower.includes('math')) {
      if (combinedSLO.includes('geometry') || combinedSLO.includes('shape')) return 'geometric_diagram';
      if (combinedSLO.includes('algebra') || combinedSLO.includes('equation')) return 'algebraic_diagram';
      if (combinedSLO.includes('graph') || combinedSLO.includes('chart')) return 'data_visualization';
      return 'mathematical_illustration';
    }

    return 'educational_infographic';
  }

  /**
   * ✅ NEW: Get generic diagram instructions (fallback)
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
   * ✅ ENHANCED: Format diagrams for storage (use file references instead of base64)
   */
  static formatDiagramsForStorage(processedDiagrams) {
  return processedDiagrams
    .filter(d => d && d.imageData)
    .map((d, idx) => {
      console.log(`[DocumentGen] Formatting diagram ${idx + 1}:`, {
        hasFileName: !!d.imageData.fileName,
        hasFilePath: !!d.imageData.filePath,
        hasBase64: !!d.imageData.base64Data,
        fileSize: d.imageData.fileSize
      });
      
      return {
        index: idx,
        number: d.number || idx + 1,
        description: d.description || d.caption || `Diagram ${idx + 1}`,
        caption: d.caption || d.description || `Diagram ${idx + 1}`,
        
        // ✅ CRITICAL: Store file path for serving
        fileName: d.imageData.fileName || `diagram-${idx + 1}.png`,
        filePath: d.imageData.filePath || `/api/diagrams/diagram-${idx + 1}.png`,
        
        // ✅ CRITICAL: Store base64 as fallback (but mark it clearly)
        imageData: d.imageData.base64Data 
          ? `data:${d.imageData.mimeType || 'image/png'};base64,${d.imageData.base64Data}`
          : null,
        
        mimeType: d.imageData.mimeType || 'image/png',
        fileSize: d.imageData.fileSize || 0,
        educationalPurpose: d.educationalPurpose || 'Educational illustration',
        sloReference: d.sloReference || 'Supports learning outcomes',
        createdAt: new Date(),
        
        // ✅ Storage strategy marker
        storageType: d.imageData.fileName ? 'file' : 'base64'
      };
    });
}

/**
 * ✅ FIXED: Don't remove base64 - optimize differently
 */
static optimizeContentSize(content, diagramStats) {
  let optimizedContent = content;
  
  console.log('[DocumentGen] Content optimization - current size:', content.length);
  
  // ✅ Only remove base64 from CONTENT, not from diagram storage
  if (optimizedContent.includes('data:image/png;base64')) {
    const base64Count = (optimizedContent.match(/data:image\/png;base64/g) || []).length;
    console.log(`[DocumentGen] Converting ${base64Count} inline base64 images to file references`);
    
    // Replace inline base64 in markdown with file references
    let imageCounter = 0;
    optimizedContent = optimizedContent.replace(
      /!\[(.*?)\]\(data:image\/png;base64,[^)]+\)/g, 
      (match, alt) => {
        imageCounter++;
        return `![${alt}](/api/diagrams/diagram-${imageCounter}.png)`;
      }
    );
  }
  
  // Remove any remaining diagram placeholders
  if (optimizedContent.includes('[DIAGRAM:')) {
    console.log('[DocumentGen] Removing unprocessed diagram placeholders...');
    optimizedContent = optimizedContent.replace(/\[DIAGRAM:[^\]]+\]/g, '*[Diagram unavailable]*');
  }
  
  console.log(`[DocumentGen] Content after optimization: ${optimizedContent.length} bytes`);
  return optimizedContent;
}

  /**
   * ✅ ENHANCED: Assess CBC data quality with SLO focus
   */
  static assessCBCQuality(cbcEntry) {
    let score = 100;
    const issues = [];
    
    if (!cbcEntry.slo || cbcEntry.slo.length === 0) {
      score -= 30;
      issues.push('Missing specific learning outcomes');
    } else {
      // Assess SLO quality
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
      hasDiagramPotential: (cbcEntry.slo?.length || 0) > 0 // ✅ New: Flag for diagram potential
    };
  }

  /**
   * ✅ NEW: Generate linked lesson notes from concept breakdown
   */
  static async generateLinkedLessonNotes(conceptDocId, requestData) {
    try {
      console.log(`[DocumentGen] Generating linked lesson notes from concept: ${conceptDocId}`);
      
      // Fetch the concept breakdown document
      const conceptDoc = await Document.findById(conceptDocId).populate('cbcEntry');
      if (!conceptDoc) {
        throw new Error('Lesson Concept Breakdown not found');
      }

      if (conceptDoc.type !== 'Lesson Concept Breakdown') {
        throw new Error('Source document must be a Lesson Concept Breakdown');
      }

      // Extract learning concepts from content
      const learningConcepts = this.extractLearningConceptsFromContent(conceptDoc.content);
      
      if (learningConcepts.length === 0) {
        throw new Error('No learning concepts found in breakdown');
      }

      console.log(`[DocumentGen] Extracted ${learningConcepts.length} learning concepts for linked notes`);

      // Enhance request data with learning concepts
      const enhancedRequestData = {
        ...requestData,
        grade: conceptDoc.grade,
        learningArea: conceptDoc.subject,
        strand: conceptDoc.strand,
        substrand: conceptDoc.substrand,
        term: conceptDoc.term,
        school: conceptDoc.school,
        learningConcepts: learningConcepts,
        sourceLessonConceptId: conceptDocId
      };

      // Generate lesson notes using the enhanced data
      const lessonNotes = await this.generate(
        'Lesson Notes',
        enhancedRequestData,
        conceptDoc.cbcEntry
      );

      // Create link between documents
      await this.linkDocuments(conceptDocId, lessonNotes._id);

      console.log(`[DocumentGen] ✅ Linked lesson notes generated: ${lessonNotes._id}`);

      return {
        success: true,
        document: lessonNotes,
        sourceConcepts: learningConcepts,
        metadata: {
          conceptBreakdownId: conceptDocId,
          conceptCount: learningConcepts.length,
          linkCreated: true
        }
      };

    } catch (error) {
      console.error('[DocumentGen] Failed to generate linked notes:', error);
      throw error;
    }
  }

  /**
   * ✅ NEW: Extract learning concepts from concept breakdown content
   */
  static extractLearningConceptsFromContent(content) {
    if (!content) return [];
    
    const concepts = [];
    const lines = content.split('\n');
    let inTable = false;
    
    for (const line of lines) {
      // Detect table content
      if (line.includes('|') && !line.match(/^[\|\-\s:]+$/)) {
        // Skip header row
        if (line.toLowerCase().includes('learning concept')) {
          inTable = true;
          continue;
        }
        
        if (inTable) {
          const cells = line.split('|').map(c => c.trim()).filter(c => c);
          
          // Typical structure: | Term | Week | Strand | Sub-strand | Learning Concept |
          if (cells.length >= 5) {
            const term = cells[0];
            const week = cells[1];
            const strand = cells[2];
            const substrand = cells[3];
            const concept = cells[4];
            
            // Validate it's a real concept, not header or separator
            if (concept && concept.length > 10 && 
                !concept.toLowerCase().includes('learning concept') &&
                week.toLowerCase().includes('week')) {
              concepts.push({
                week: week,
                term: term,
                strand: strand,
                substrand: substrand,
                concept: concept
              });
            }
          }
        }
      }
    }
    
    return concepts;
  }

  /**
   * ✅ NEW: Create bidirectional link between documents
   */
  static async linkDocuments(sourceDocId, derivedDocId) {
    try {
      // Add reference in derived document pointing to source
      await Document.findByIdAndUpdate(derivedDocId, {
        $set: {
          'metadata.sourceDocument': sourceDocId,
          'metadata.sourceType': 'Lesson Concept Breakdown',
          'metadata.linkedAt': new Date()
        }
      });
      
      // Add reference in source document pointing to derived
      await Document.findByIdAndUpdate(sourceDocId, {
        $push: {
          'metadata.derivedDocuments': {
            documentId: derivedDocId,
            type: 'Lesson Notes',
            createdAt: new Date()
          }
        }
      });
      
      console.log('[DocumentGen] ✅ Created bidirectional document link');
    } catch (error) {
      console.error('[DocumentGen] Failed to create document link:', error);
      // Don't throw - document generation succeeded even if linking failed
    }
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
        linkedDocuments: true,
        contentOptimization: true
      }
    };
  }

  /**
   * ✅ NEW: Health check for document generation system
   */
  static async healthCheck() {
    const health = {
      status: 'healthy',
      generators: {},
      cache: this.getCacheStats(),
      config: this.getConfig(),
      timestamp: new Date()
    };

    // Check each generator
    for (const [name, generator] of Object.entries(this.generators)) {
      health.generators[name] = {
        available: !!generator,
        hasGenerateMethod: typeof generator.generate === 'function'
      };
    }

    // Check for critical dependencies
    try {
      require('./DiagramService');
      health.diagramService = 'available';
    } catch (error) {
      health.diagramService = 'unavailable';
      health.status = 'degraded';
    }

    return health;
  }
}

module.exports = DocumentGeneratorFactory;