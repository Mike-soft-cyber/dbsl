const SmartLocalImageLibrary = require('./SmartLocalImageLibrary');

class DiagramService {
  static imageLibrary = new SmartLocalImageLibrary();
  static verbose = true;

  static log(...args) {
    if (this.verbose) console.log(...args);
  }

  /**
   * ✅ MAIN METHOD: Process diagrams using HTTP URLs - FIXED
   */
  static async processInlineDiagrams(aiContent, contextData) {
    const {
    grade,
    learningArea,
    strand,
    substrand,
    documentId,
    learningConcepts = [],
    maxDiagrams = 5,
    cbcEntry,
    baseURL  // ✅ Accept base URL
  } = contextData;

    this.log('[DiagramService] 🖼️ Starting AUTO-DETECTION image processing (HTTP URLs)');
    this.log(`[DiagramService] Grade: ${grade}, Subject: ${learningArea}`);
    this.log(`[DiagramService] Learning concepts available: ${learningConcepts.length}`);

    // Validate inputs
    if (!aiContent) {
      this.log('[DiagramService] ⚠️ No content provided');
      return { content: '', diagrams: [], stats: { total: 0, successful: 0, skipped: 0 } };
    }

    if (learningConcepts.length === 0) {
      this.log('[DiagramService] ℹ️ No learning concepts provided, checking content for placeholders');
      
      // Extract concepts from placeholders if none provided
      const extractedConcepts = this.extractConceptsFromPlaceholders(aiContent);
      
      if (extractedConcepts.length > 0) {
        this.log(`[DiagramService] 🔎 Extracted ${extractedConcepts.length} concepts from placeholders`);
        learningConcepts.push(...extractedConcepts);
      } else {
        this.log('[DiagramService] ℹ️ No placeholders found, returning content as-is');
        return { content: aiContent, diagrams: [], stats: { total: 0, successful: 0, skipped: 0 } };
      }
    }

    // Find diagram placeholders in content
    const placeholders = this.findDiagramPlaceholders(aiContent);
    this.log(`[DiagramService] 🔍 Found ${placeholders.length} diagram placeholders in content`);

    if (placeholders.length === 0) {
      this.log('[DiagramService] ℹ️ No diagram placeholders found');
      return { content: aiContent, diagrams: [], stats: { total: 0, successful: 0, skipped: 0 } };
    }

    // ✅ AUTO-DETECT images from folder (returns HTTP URLs, not base64)
    const conceptsToProcess = learningConcepts.slice(0, Math.min(maxDiagrams, placeholders.length));
    this.log(`[DiagramService] 📚 Auto-detecting images for ${conceptsToProcess.length} concepts`);

    if (baseURL) {
    this.imageLibrary.baseURL = baseURL;
  }

  const imageResults = await this.imageLibrary.findImagesForConcepts(
    conceptsToProcess,
    learningArea,
    grade
  );

    // Replace placeholders with matched images or remove them
    let processedContent = aiContent;
    const usedImages = [];
    let figureNumber = 1;
    let successCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < Math.min(placeholders.length, imageResults.length); i++) {
      const placeholder = placeholders[i];
      const imageResult = imageResults[i];

      // 🔍 DEBUG: Check imageResult before processing
    console.log(`[DiagramService] 🔍 DEBUG: imageResult.imageUrl: ${imageResult.imageUrl}`);
    console.log(`[DiagramService] 🔍 DEBUG: imageResult.filename: ${imageResult.filename}`);

      if (imageResult.hasImage) {
        // ✅ Format image using HTTP URL (not base64) - FIXED: No markdown added
        const imageMarkdown = this.formatImageMarkdown(
          imageResult,
          figureNumber,
          learningArea
        );

        // Replace placeholder with image
        processedContent = processedContent.replace(placeholder.fullMatch, imageMarkdown);

        usedImages.push({
          concept: imageResult.concept,
          week: imageResult.week,
          imagePath: imageResult.imagePath,
          imageUrl: imageResult.imageUrl,
          filename: imageResult.filename,
          matchScore: imageResult.matchScore,
          figureNumber: figureNumber
        });

        successCount++;
        figureNumber++;

        this.log(`[DiagramService] ✅ Image ${successCount}: ${imageResult.filename} (${imageResult.matchScore}% match)`);
        this.log(`[DiagramService]    🌐 URL: ${imageResult.imageUrl}`);
      } else {
        // Remove placeholder if no image found
        processedContent = processedContent.replace(placeholder.fullMatch, '');
        skippedCount++;

        this.log(`[DiagramService] ⏭️ Skipped ${skippedCount}: ${imageResult.concept}`);
        this.log(`[DiagramService]    💡 TIP: Save as "${imageResult.suggestedFilename}" in ${imageResult.suggestedPath}`);
      }
    }

    // Remove any remaining unprocessed placeholders
    const remainingPlaceholders = this.findDiagramPlaceholders(processedContent);
    if (remainingPlaceholders.length > 0) {
      this.log(`[DiagramService] 🧹 Removing ${remainingPlaceholders.length} remaining placeholders`);
      remainingPlaceholders.forEach(ph => {
        processedContent = processedContent.replace(ph.fullMatch, '');
      });
    }

    const stats = {
      total: placeholders.length,
      successful: successCount,
      skipped: skippedCount,
      failed: 0,
      autoDetected: successCount,
      averageMatchScore: successCount > 0 
        ? Math.round(usedImages.reduce((sum, img) => sum + (img.matchScore || 0), 0) / successCount)
        : 0
    };

    this.log(`[DiagramService] ✅ Complete: ${successCount} images auto-detected (avg ${stats.averageMatchScore}% match), ${skippedCount} skipped`);
    this.log(`[DiagramService] 🌐 All images served via HTTP URLs`);
    

    return {
      content: processedContent,
      diagrams: usedImages,
      stats
    };
  }

  /**
   * ✅ Find all diagram placeholders in content
   */
  static findDiagramPlaceholders(content) {
    const placeholders = [];
    const regex = /\[DIAGRAM:\s*\{[\s\S]*?\}\s*\]/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      try {
        const jsonStr = match[0]
          .replace(/\[DIAGRAM:\s*/, '')
          .replace(/\s*\]$/, '')
          .trim();
        
        const spec = JSON.parse(jsonStr);
        
        placeholders.push({
          fullMatch: match[0],
          position: match.index,
          description: spec.description,
          caption: spec.caption || spec.description,
          context: spec.context,
          week: spec.week,
          conceptNumber: spec.conceptNumber
        });
      } catch (err) {
        console.warn('[DiagramService] Failed to parse diagram spec:', err.message);
      }
    }

    return placeholders;
  }

  /**
   * ✅ Extract concepts from placeholders if no learning concepts provided
   */
  static extractConceptsFromPlaceholders(content) {
    const placeholders = this.findDiagramPlaceholders(content);
    
    return placeholders.map((ph, index) => ({
      concept: ph.description || ph.caption || `Concept ${index + 1}`,
      week: ph.week || `Concept ${index + 1}`,
      index: index
    }));
  }

  /**
   * ✅ Format image as markdown with HTTP URL - FIXED: No markdown added to URLs
   */
  static formatImageMarkdown(imageResult, figureNumber, subject) {
  const subjectEmoji = this.getSubjectEmoji(subject);
  const matchInfo = imageResult.matchScore 
    ? ` *(Auto-matched: ${imageResult.matchScore}%)*` 
    : '';
  
  // ✅ Use the imageUrl directly from imageResult - NO CLEANING!
  const cleanConcept = (imageResult.concept || '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/\_\_/g, '')
    .replace(/\_/g, '')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/`/g, '')
    .trim();
  
  // ✅ CRITICAL: Use imageResult.imageUrl directly - don't modify it!
  const imageUrl = imageResult.imageUrl;
  
  return `
---
### ${subjectEmoji} Figure ${figureNumber}: ${cleanConcept}

![${cleanConcept}](${imageUrl})

**${imageResult.week}** - ${cleanConcept}${matchInfo}

*This diagram supports the learning outcomes for this topic and provides visual context for Kenyan learners.*
---
`;
}

  /**
   * ✅ Get emoji for subject
   */
  static getSubjectEmoji(subject) {
    const subjectLower = (subject || '').toLowerCase();
    
    if (subjectLower.includes('science')) return '🔬';
    if (subjectLower.includes('math')) return '📐';
    if (subjectLower.includes('social')) return '🌍';
    if (subjectLower.includes('agriculture')) return '🌾';
    if (subjectLower.includes('home')) return '🏠';
    if (subjectLower.includes('ict') || subjectLower.includes('computer')) return '💻';
    if (subjectLower.includes('english')) return '📚';
    if (subjectLower.includes('kiswahili')) return '🗣️';
    
    return '📊';
  }

  /**
   * ✅ Get library statistics
   */
  static async getLibraryStats() {
    const fs = require('fs').promises;
    const path = require('path');
    const diagramsPath = path.join(__dirname, '..', 'diagrams');
    
    try {
      const grades = await fs.readdir(diagramsPath);
      let totalImages = 0;
      const byGrade = {};
      
      for (const grade of grades) {
        const gradePath = path.join(diagramsPath, grade);
        const gradeStats = await fs.stat(gradePath);
        
        if (!gradeStats.isDirectory()) continue;
        
        byGrade[grade] = {};
        const subjects = await fs.readdir(gradePath);
        
        for (const subject of subjects) {
          const subjectPath = path.join(gradePath, subject);
          const subjectStats = await fs.stat(subjectPath);
          
          if (!subjectStats.isDirectory()) continue;
          
          const files = await fs.readdir(subjectPath);
          const imageCount = files.filter(f => /\.(jpg|jpeg|png|gif|svg)$/i.test(f)).length;
          
          byGrade[grade][subject] = imageCount;
          totalImages += imageCount;
        }
      }
      
      return {
        totalImages,
        byGrade,
        autoDetection: true,
        servedViaHTTP: true
      };
    } catch (error) {
      return { totalImages: 0, error: error.message };
    }
  }

  /**
   * ✅ List available images for a subject
   */
  static async getAvailableImagesForSubject(subject, grade) {
    return await this.imageLibrary.listImagesInFolder(grade, subject);
  }

  /**
   * ✅ Test if an image exists for a concept (debugging)
   */
  static async testConceptMatch(concept, subject, grade) {
    return await this.imageLibrary.testMatch(concept, grade, subject);
  }

  /**
   * ✅ Clear cache after adding new images
   */
  static clearCache() {
    this.imageLibrary.clearCache();
    this.log('[DiagramService] ✅ Image cache cleared');
  }
}

module.exports = DiagramService;