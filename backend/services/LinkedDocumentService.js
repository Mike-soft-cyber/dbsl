// LinkedDocumentService.js - ENHANCED WITH BETTER ERROR HANDLING

const Document = require('../models/Document');
const DocumentGeneratorFactory = require('./DocumentGeneratorFactory');

class LinkedDocumentService {
  /**
   * ✅ ENHANCED: Generate Lesson Notes with robust error handling
   */
  static async generateLessonNotesFromConcepts(lessonConceptId, requestData) {
    try {
      console.log('[LinkedDocs] Generating Lesson Notes from Concept Breakdown:', lessonConceptId);
      
      // 1. Fetch the Lesson Concept Breakdown with proper error handling
      const conceptDoc = await Document.findById(lessonConceptId).populate('cbcEntry');
      
      if (!conceptDoc) {
        throw new Error('Lesson Concept Breakdown not found');
      }
      
      if (conceptDoc.type !== 'Lesson Concept Breakdown') {
        throw new Error('Source document must be a Lesson Concept Breakdown');
      }
      
      console.log('[LinkedDocs] Found concept breakdown with', 
        this.countConceptRows(conceptDoc.content), 'learning concepts');
      
      // 2. Extract learning concepts from the table
      const learningConcepts = this.extractLearningConcepts(conceptDoc.content);
      
      if (learningConcepts.length === 0) {
        throw new Error('No learning concepts found in breakdown');
      }
      
      console.log('[LinkedDocs] Extracted', learningConcepts.length, 'learning concepts');
      
      // 3. ✅ ENHANCED: Build SAFE request data with all required fields
      const enhancedRequestData = this.buildSafeRequestData(requestData, conceptDoc, learningConcepts);
      
      console.log('[LinkedDocs] Safe request data prepared:', {
        grade: enhancedRequestData.grade,
        learningArea: enhancedRequestData.learningArea,
        concepts: learningConcepts.length
      });
      
      // 4. Generate Lesson Notes using the enhanced data
      const lessonNotes = await DocumentGeneratorFactory.generate(
        'Lesson Notes',
        enhancedRequestData,
        conceptDoc.cbcEntry
      );
      
      // 5. Create link between documents
      await this.linkDocuments(lessonConceptId, lessonNotes._id);
      
      console.log('[LinkedDocs] ✅ Generated linked Lesson Notes:', lessonNotes._id);
      
      return {
        success: true,
        lessonNotes: lessonNotes,
        sourceConcepts: learningConcepts,
        metadata: {
          conceptBreakdownId: lessonConceptId,
          conceptCount: learningConcepts.length,
          linkCreated: true
        }
      };
      
    } catch (error) {
      console.error('[LinkedDocs] Failed to generate linked notes:', error);
      throw error;
    }
  }

  /**
   * ✅ NEW: Build safe request data with all required fields
   */
  static buildSafeRequestData(originalData, conceptDoc, learningConcepts) {
    // Start with original data
    const safeData = { ...originalData };
    
    // ✅ CRITICAL: Ensure all required fields are present with fallbacks
    safeData.grade = originalData.grade || conceptDoc.grade || 'Grade 7';
    safeData.learningArea = originalData.learningArea || conceptDoc.subject || 'Social Studies';
    safeData.strand = originalData.strand || conceptDoc.strand || 'Natural and the Built Environments in Africa';
    safeData.substrand = originalData.substrand || conceptDoc.substrand || 'The Earth and the Solar system';
    safeData.term = originalData.term || conceptDoc.term || 'Term 3';
    safeData.school = originalData.school || conceptDoc.school || 'Kenyan School';
    safeData.teacherName = originalData.teacherName || 'Teacher';
    
    // ✅ Add learning concepts
    safeData.learningConcepts = learningConcepts;
    safeData.sourceLessonConceptId = conceptDoc._id;
    
    return safeData;
  }

  /**
   * Extract learning concepts from Lesson Concept Breakdown table
   */
  static extractLearningConcepts(content) {
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
    
    console.log('[LinkedDocs] Extracted concepts by week:', 
      this.groupConceptsByWeek(concepts));
    
    return concepts;
  }

  /**
   * Count rows in concept breakdown
   */
  static countConceptRows(content) {
    if (!content) return 0;
    return (content.match(/\|\s*Week\s*\d+/gi) || []).length;
  }

  /**
   * Group concepts by week for easier processing
   */
  static groupConceptsByWeek(concepts) {
    const grouped = {};
    concepts.forEach(c => {
      const weekNum = c.week.match(/\d+/)?.[0] || 'unknown';
      if (!grouped[weekNum]) grouped[weekNum] = [];
      grouped[weekNum].push(c.concept);
    });
    return grouped;
  }

  /**
   * Create bidirectional link between documents
   */
  static async linkDocuments(conceptId, notesId) {
    try {
      // Add reference in Lesson Notes pointing to Concept Breakdown
      await Document.findByIdAndUpdate(notesId, {
        $set: {
          'metadata.sourceDocument': conceptId,
          'metadata.sourceType': 'Lesson Concept Breakdown',
          'metadata.linkedAt': new Date()
        }
      });
      
      // Add reference in Concept Breakdown pointing to Lesson Notes
      await Document.findByIdAndUpdate(conceptId, {
        $push: {
          'metadata.derivedDocuments': {
            documentId: notesId,
            type: 'Lesson Notes',
            createdAt: new Date()
          }
        }
      });
      
      console.log('[LinkedDocs] ✅ Created bidirectional link');
    } catch (error) {
      console.error('[LinkedDocs] Failed to create link:', error);
      // Don't throw - document generation succeeded even if linking failed
    }
  }

  /**
   * Get all documents linked to a Lesson Concept Breakdown
   */
  static async getLinkedDocuments(conceptId) {
    try {
      const conceptDoc = await Document.findById(conceptId);
      if (!conceptDoc) return [];
      
      const linkedIds = conceptDoc.metadata?.derivedDocuments?.map(d => d.documentId) || [];
      const linkedDocs = await Document.find({ _id: { $in: linkedIds } })
        .select('type grade subject strand substrand term createdAt status');
      
      return linkedDocs;
    } catch (error) {
      console.error('[LinkedDocs] Failed to get linked documents:', error);
      return [];
    }
  }

  /**
   * Check if Lesson Notes already exist for a Concept Breakdown
   */
  static async hasLinkedLessonNotes(conceptId) {
    try {
      const linked = await this.getLinkedDocuments(conceptId);
      return linked.some(doc => doc.type === 'Lesson Notes');
    } catch (error) {
      return false;
    }
  }
}

module.exports = LinkedDocumentService;