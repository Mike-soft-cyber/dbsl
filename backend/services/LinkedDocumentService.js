

const Document = require('../models/Document');
const DocumentGeneratorFactory = require('./DocumentGeneratorFactory');

class LinkedDocumentService {
  


  static async generateLessonNotesFromConcepts(lessonConceptId, requestData) {
    try {
      console.log('[LinkedDocs] Generating Lesson Notes from Concept Breakdown:', lessonConceptId);
      
      
      const conceptDoc = await Document.findById(lessonConceptId).populate('cbcEntry');
      
      if (!conceptDoc) {
        throw new Error('Lesson Concept Breakdown not found');
      }
      
      if (conceptDoc.type !== 'Lesson Concept Breakdown') {
        throw new Error('Source document must be a Lesson Concept Breakdown');
      }
      
      console.log('[LinkedDocs] Found concept breakdown with', 
        this.countConceptRows(conceptDoc.content), 'learning concepts');
      
      
      const learningConcepts = this.extractLearningConcepts(conceptDoc.content);
      
      if (learningConcepts.length === 0) {
        throw new Error('No learning concepts found in breakdown');
      }
      
      console.log('[LinkedDocs] Extracted', learningConcepts.length, 'learning concepts');
      
      
      const enhancedRequestData = this.buildSafeRequestData(requestData, conceptDoc, learningConcepts);
      
      console.log('[LinkedDocs] Safe request data prepared:', {
        grade: enhancedRequestData.grade,
        learningArea: enhancedRequestData.learningArea,
        concepts: learningConcepts.length
      });
      
      
      const lessonNotes = await DocumentGeneratorFactory.generate(
        'Lesson Notes',
        enhancedRequestData,
        conceptDoc.cbcEntry
      );
      
      
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

  


  static buildSafeRequestData(originalData, conceptDoc, learningConcepts) {
    
    const safeData = { ...originalData };
    
    
    safeData.grade = originalData.grade || conceptDoc.grade || 'Grade 7';
    safeData.learningArea = originalData.learningArea || conceptDoc.subject || 'Social Studies';
    safeData.strand = originalData.strand || conceptDoc.strand || 'Natural and the Built Environments in Africa';
    safeData.substrand = originalData.substrand || conceptDoc.substrand || 'The Earth and the Solar system';
    safeData.term = originalData.term || conceptDoc.term || 'Term 3';
    safeData.school = originalData.school || conceptDoc.school || 'Kenyan School';
    safeData.teacherName = originalData.teacherName || 'Teacher';
    
    
    safeData.learningConcepts = learningConcepts;
    safeData.sourceLessonConceptId = conceptDoc._id;
    
    return safeData;
  }

  


  static extractLearningConcepts(content) {
    if (!content) return [];
    
    const concepts = [];
    const lines = content.split('\n');
    let inTable = false;
    
    for (const line of lines) {
      
      if (line.includes('|') && !line.match(/^[\|\-\s:]+$/)) {
        
        if (line.toLowerCase().includes('learning concept')) {
          inTable = true;
          continue;
        }
        
        if (inTable) {
          const cells = line.split('|').map(c => c.trim()).filter(c => c);
          
          
          if (cells.length >= 5) {
            const term = cells[0];
            const week = cells[1];
            const strand = cells[2];
            const substrand = cells[3];
            const concept = cells[4];
            
            
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

  


  static countConceptRows(content) {
    if (!content) return 0;
    return (content.match(/\|\s*Week\s*\d+/gi) || []).length;
  }

  


  static groupConceptsByWeek(concepts) {
    const grouped = {};
    concepts.forEach(c => {
      const weekNum = c.week.match(/\d+/)?.[0] || 'unknown';
      if (!grouped[weekNum]) grouped[weekNum] = [];
      grouped[weekNum].push(c.concept);
    });
    return grouped;
  }

  


  static async linkDocuments(conceptId, notesId) {
    try {
      
      await Document.findByIdAndUpdate(notesId, {
        $set: {
          'metadata.sourceDocument': conceptId,
          'metadata.sourceType': 'Lesson Concept Breakdown',
          'metadata.linkedAt': new Date()
        }
      });
      
      
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
      
    }
  }

  


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