// DocumentGeneratorFactory.js - SIMPLIFIED VERSION WITHOUT DIAGRAMS
const LessonConceptGenerator = require('./documentGenerators/LessonConceptGenerator');
const SchemesGenerator = require('./documentGenerators/SchemesGenerator');
const LessonPlanGenerator = require('./documentGenerators/LessonPlanGenerator');
const LessonNotesGenerator = require('./documentGenerators/LessonNotesGenerator');
const ExercisesGenerator = require('./documentGenerators/ExercisesGenerator');
const { postProcessGeneratedContent } = require('../utils/contentProcessor');
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

  static async getCurriculumConfig(grade, learningArea) {
    try {
      console.log(`[CurriculumConfig] Fetching for ${grade} - ${learningArea}`);
      
      const LevelConfig = require('../models/LevelConfig');
      const SubjectConfig = require('../models/SubjectConfig');
      
      const levelConfig = await LevelConfig.findOne({ 
        grades: grade 
      });
      
      const subjectConfig = await SubjectConfig.findOne({
        subject: { $regex: new RegExp(learningArea, 'i') },
        grades: grade
      });
      
      if (!levelConfig || !subjectConfig) {
        console.warn(`[CurriculumConfig] Using defaults`);
        return {
          lessonDuration: 40,
          lessonsPerWeek: 5,
          ageRange: 'Not specified',
          weeks: { term1: 10, term2: 11, term3: 6 }
        };
      }
      
      return {
        lessonDuration: levelConfig.lessonDuration,
        lessonsPerWeek: subjectConfig.lessonsPerWeek,
        ageRange: levelConfig.ageRange,
        weeks: subjectConfig.termWeeks || { term1: 10, term2: 11, term3: 6 }
      };
      
    } catch (error) {
      console.error('[CurriculumConfig] Error:', error);
      return {
        lessonDuration: 40,
        lessonsPerWeek: 5,
        ageRange: 'Not specified',
        weeks: { term1: 10, term2: 11, term3: 6 }
      };
    }
  }

  /**
   * ✅ MAIN GENERATION METHOD - SIMPLIFIED (NO DIAGRAMS)
   */
  static async generate(type, requestData, cbcEntry) {
    const startTime = Date.now();
    
    try {
      console.log(`[DocumentGen] Starting ${type} generation`);
      
      const curriculumConfig = await this.getCurriculumConfig(
        requestData.grade, 
        requestData.learningArea
      );
      
      const termNumber = requestData.term?.replace('Term ', '').replace('term', '');
      const termWeekMap = {
        '1': curriculumConfig.weeks.term1 || 10,
        '2': curriculumConfig.weeks.term2 || 11,
        '3': curriculumConfig.weeks.term3 || 6
      };
      const weeksForTerm = termWeekMap[termNumber] || 10;
      const expectedRows = weeksForTerm * curriculumConfig.lessonsPerWeek;

      console.log(`[DocumentGen] ✅ Configuration:`, {
        term: requestData.term,
        weeks: weeksForTerm,
        lessonsPerWeek: curriculumConfig.lessonsPerWeek,
        expectedRows: expectedRows
      });

      // Get the appropriate generator
      const generator = this.generators[type];
      
      if (!generator) {
        throw new Error(`No generator found for type: ${type}`);
      }

      // Generate content
      const aiContent = await generator.generate(requestData, cbcEntry);
      
      // Process content
      let processedContent = postProcessGeneratedContent(aiContent, type);
      
      // Create document metadata
      const documentMetadata = {
        generationTime: Date.now() - startTime,
        cbcDataQuality: this.assessCBCQuality(cbcEntry),
        aiModel: 'gpt-4o-mini',
        contentLength: processedContent.length,
        hasImages: false,
        curriculumConfig: {
          weeks: weeksForTerm,
          lessonsPerWeek: curriculumConfig.lessonsPerWeek,
          ageRange: curriculumConfig.ageRange,
          lessonDuration: curriculumConfig.lessonDuration,
          expectedRows: expectedRows
        }
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
        content: processedContent,
        diagrams: [],
        references: {
          slo: cbcEntry.slo?.slice(0, 3).join('; ') || '',
          experiences: cbcEntry.learningExperiences?.slice(0, 2).join('; ') || '',
          assessments: cbcEntry.assessment?.map(a => a.skill).slice(0, 3).join(', ') || '',
        },
        resources: cbcEntry.resources || [],
        keyInquiryQuestions: cbcEntry.keyInquiryQuestions || [],
        status: "completed",
        metadata: documentMetadata,
        version: 1,
        generatedBy: 'AI'
      });

      console.log(`[DocumentGen] ✅ ${type} generated successfully in ${Date.now() - startTime}ms`);
      console.log(`[DocumentGen] Document ID: ${newDoc._id}`);
      
      return newDoc;

    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`[DocumentGen] ❌ Generation failed after ${totalTime}ms:`, error);
      throw error;
    }
  }

  /**
   * ✅ Generate Scheme of Work from existing Lesson Concept Breakdown
   */
  static async generateSchemeFromConcepts(requestData, cbcEntry) {
    const startTime = Date.now();
    
    try {
      console.log('[SchemeFromConcepts] Starting generation');
      
      const { learningConcepts, sourceBreakdownId } = requestData;
      
      if (!learningConcepts || learningConcepts.length === 0) {
        throw new Error('No learning concepts provided');
      }
      
      // Split combined SLOs/experiences/questions
      let sloList = cbcEntry?.slo || [];
      if (sloList.length === 1 && sloList[0].includes('b)')) {
        sloList = sloList[0]
          .split(/(?=[a-z]\))/)
          .map(slo => slo.replace(/^[a-z]\)\s*/, '').trim())
          .filter(slo => slo.length > 5);
      }
      
      let learningExperiences = cbcEntry?.learningExperiences || [];
      if (learningExperiences.length === 1 && learningExperiences[0].includes('•')) {
        learningExperiences = learningExperiences[0].split('•').map(e => e.trim()).filter(e => e.length > 5);
      }
      
      let keyInquiryQuestions = cbcEntry?.keyInquiryQuestions || [];
      if (keyInquiryQuestions.length === 1 && /\d+\.\s/.test(keyInquiryQuestions[0])) {
        keyInquiryQuestions = keyInquiryQuestions[0].split(/\d+\.\s/).map(q => q.trim()).filter(q => q.length > 5);
      }
      
      // Build the scheme content
      const schemeContent = this.buildSchemeContentFromConcepts(
        requestData,
        learningConcepts,
        sloList,
        learningExperiences,
        keyInquiryQuestions,
        cbcEntry
      );
      
      // Create the document
      const newDoc = await Document.create({
        teacher: requestData.teacher,
        type: 'Schemes of Work',
        term: requestData.term,
        grade: requestData.grade,
        school: requestData.school,
        subject: requestData.learningArea,
        strand: requestData.strand,
        substrand: requestData.substrand,
        cbcEntry: cbcEntry._id,
        content: schemeContent,
        diagrams: [],
        references: {
          slo: cbcEntry.slo?.slice(0, 3).join('; ') || '',
          experiences: cbcEntry.learningExperiences?.slice(0, 2).join('; ') || '',
          assessments: cbcEntry.assessment?.map(a => a.skill).slice(0, 3).join(', ') || '',
        },
        resources: cbcEntry.resources || [],
        keyInquiryQuestions: cbcEntry.keyInquiryQuestions || [],
        status: "completed",
        metadata: {
          generationTime: Date.now() - startTime,
          sourceDocument: sourceBreakdownId,
          sourceType: 'Lesson Concept Breakdown',
          conceptsUsed: learningConcepts.length,
          generatedFrom: 'breakdown'
        },
        version: 1,
        generatedBy: 'Concept-based generation'
      });
      
      console.log('[SchemeFromConcepts] ✅ Generated:', newDoc._id);
      return newDoc;
      
    } catch (error) {
      console.error('[SchemeFromConcepts] ❌ Error:', error);
      throw error;
    }
  }

  /**
   * ✅ Generate Lesson Plan from a specific concept in breakdown
   */
  static async generateLessonPlanFromConcept(requestData, cbcEntry) {
    const startTime = Date.now();
    
    try {
      console.log('[LessonPlanFromConcept] Starting generation for:', requestData.specificConcept);
      
      // Get the LessonPlanGenerator
      const generator = this.generators['Lesson Plan'];
      
      if (!generator) {
        throw new Error('LessonPlanGenerator not found');
      }
      
      // Generate the lesson plan content
      const aiContent = await generator.generate(requestData, cbcEntry);
      const processedContent = postProcessGeneratedContent(aiContent, 'Lesson Plan');
      
      // Create the document
      const newDoc = await Document.create({
        teacher: requestData.teacher,
        type: 'Lesson Plan',
        term: requestData.term,
        grade: requestData.grade,
        school: requestData.school,
        subject: requestData.learningArea,
        strand: requestData.strand,
        substrand: requestData.substrand,
        cbcEntry: cbcEntry._id,
        content: processedContent,
        diagrams: [],
        lessonDetails: {
          weekNumber: requestData.weekNumber,
          lessonNumber: requestData.lessonNumber,
          specificConcept: requestData.specificConcept
        },
        references: {
          slo: cbcEntry.slo?.slice(0, 3).join('; ') || '',
          experiences: cbcEntry.learningExperiences?.slice(0, 2).join('; ') || '',
        },
        resources: cbcEntry.resources || [],
        keyInquiryQuestions: cbcEntry.keyInquiryQuestions || [],
        status: "completed",
        metadata: {
          generationTime: Date.now() - startTime,
          sourceDocument: requestData.sourceBreakdownId,
          sourceType: 'Lesson Concept Breakdown',
          lessonNumber: requestData.lessonNumber,
          specificConcept: requestData.specificConcept,
          generatedFrom: 'concept'
        },
        version: 1,
        generatedBy: 'Concept-based generation'
      });
      
      console.log('[LessonPlanFromConcept] ✅ Generated:', newDoc._id);
      return newDoc;
      
    } catch (error) {
      console.error('[LessonPlanFromConcept] ❌ Error:', error);
      throw error;
    }
  }

  /**
   * ✅ Build Scheme of Work table from learning concepts
   */
  static buildSchemeContentFromConcepts(
    requestData,
    learningConcepts,
    sloList,
    learningExperiences,
    keyInquiryQuestions,
    cbcEntry
  ) {
    const { school, teacherName, grade, learningArea, strand, substrand, term } = requestData;
    const resources = cbcEntry?.resources || ['Realia', 'charts', 'textbooks'];
    
    const assessmentMethods = ['Observation', 'Oral questions', 'Practical task', 'Portfolio assessment', 'Group discussion'];
    
    // Build header
    let content = `SCHOOL: ${school}\n`;
    content += `FACILITATOR: ${teacherName}\n`;
    content += `GRADE: ${grade}\n`;
    content += `SUBJECT: ${learningArea}\n`;
    content += `TERM: ${term}\n`;
    content += `WEEKS: ${Math.ceil(learningConcepts.length / 5)}\n\n`;
    
    // Build table
    content += `| WEEK | LESSON | STRAND | SUB-STRAND | SPECIFIC LEARNING OUTCOMES (SLO) | LEARNING EXPERIENCES | KEY INQUIRY QUESTION (KIQ) | LEARNING RESOURCES | ASSESSMENT | REFLECTION |\n`;
    content += `|------|--------|--------|------------|----------------------------------|----------------------|---------------------------|-------------------|------------|------------|\n`;
    
    learningConcepts.forEach((conceptObj, index) => {
      const lessonNum = index + 1;
      const weekNum = Math.floor(index / 5) + 1;
      
      // Map concept to appropriate SLO
      const sloIndex = Math.floor(index / Math.ceil(learningConcepts.length / sloList.length));
      const actualSloIndex = Math.min(sloIndex, sloList.length - 1);
      const letter = String.fromCharCode(97 + actualSloIndex);
      const slo = `(${letter}) ${conceptObj.concept}`;
      
      // Rotate experiences and questions
      const experience = learningExperiences[Math.floor(index / 2) % learningExperiences.length] || 'Learners engage in learning activities';
      const question = keyInquiryQuestions[Math.floor(index / 3) % keyInquiryQuestions.length] || 'What did we learn?';
      const resource = resources.slice(0, 2).join(', ');
      const assessment = assessmentMethods[index % assessmentMethods.length];
      const reflection = `Were learners able to ${conceptObj.concept.toLowerCase()}?`;
      
      content += `| Week ${weekNum} | Lesson ${lessonNum} | ${strand} | ${substrand} | ${slo} | ${experience} | ${question} | ${resource} | ${assessment} | ${reflection} |\n`;
    });
    
    return content;
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
      sloCount: cbcEntry.slo?.length || 0
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
      maxContentSize: this.MAX_CONTENT_SIZE,
      supportedTypes: Object.keys(this.generators),
      cacheSize: this.cbcCache.size,
      features: {
        linkedDocuments: true,
        contentOptimization: true
      }
    };
  }
}

module.exports = DocumentGeneratorFactory;