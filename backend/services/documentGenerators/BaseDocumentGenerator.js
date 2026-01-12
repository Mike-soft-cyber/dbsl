// BaseDocumentGenerator.js - SIMPLIFIED WITHOUT DIAGRAMS
const { OpenAI } = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 180000,
  maxRetries: 0
});

class BaseDocumentGenerator {
  constructor(type) {
    this.type = type;
    this.maxRetries = 3;
    this.timeoutMs = 180000;
  }

  async generate(requestData, cbcEntry) {
    const startTime = Date.now();
    
    try {
      console.log(`[${this.type}] Starting generation for ${requestData.learningArea}`);
      
      const safeRequestData = this.validateAndSanitizeRequestData(requestData, cbcEntry);
      
      if (!safeRequestData) {
        throw new Error('Invalid request data after sanitization');
      }

      console.log(`[${this.type}] Input validation passed`);
      
      const prompt = this.createPrompt(safeRequestData, cbcEntry);
      
      if (!prompt || prompt.length < 100) {
        throw new Error('Generated prompt is too short or invalid');
      }

      console.log(`[${this.type}] Prompt created (${prompt.length} chars)`);
      
      const aiContent = await this.generateWithRetry(prompt, 3);
      
      if (!aiContent || aiContent.length < 100) {
        throw new Error('AI generated insufficient content');
      }

      console.log(`[${this.type}] ✅ Generated ${aiContent.length} chars`);
      
      return aiContent;

    } catch (error) {
      console.error(`[${this.type}] ❌ Generation failed:`, error.message);
      return this.generateFallbackContent(requestData, cbcEntry, error);
    }
  }

  validateAndSanitizeRequestData(requestData, cbcEntry) {
    if (!requestData) {
      throw new Error('Request data is required');
    }

    const safeData = {
      ...requestData,
      grade: requestData.grade || cbcEntry?.grade || 'Grade 7',
      learningArea: requestData.learningArea || cbcEntry?.learningArea || 'General',
      strand: requestData.strand || cbcEntry?.strand || 'General Strand',
      substrand: requestData.substrand || cbcEntry?.substrand || 'General Substrand',
      term: requestData.term || 'Term 1',
      school: requestData.school || 'Kenyan School',
      teacherName: requestData.teacherName || 'Teacher'
    };

    console.log(`[${this.type}] Safe data - Grade: ${safeData.grade}, Subject: ${safeData.learningArea}`);

    return safeData;
  }

  async generateWithRetry(prompt, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[${this.type}] AI call attempt ${attempt}/${maxRetries}`);
        
        const aiContent = await this.callAI(prompt);
        
        if (aiContent && aiContent.length > 100) {
          console.log(`[${this.type}] ✅ AI call successful on attempt ${attempt}`);
          return aiContent;
        }
        
        console.warn(`[${this.type}] ⚠️ AI call returned insufficient content on attempt ${attempt}`);
        
      } catch (error) {
        console.error(`[${this.type}] ❌ AI call failed on attempt ${attempt}:`, error.message);
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    throw new Error(`All ${maxRetries} AI generation attempts failed`);
  }

  generateFallbackContent(requestData, cbcEntry, error) {
    console.log(`[${this.type}] Generating fallback content due to error: ${error.message}`);
    
    const safeGrade = requestData.grade || cbcEntry?.grade || 'Grade 7';
    const safeLearningArea = requestData.learningArea || cbcEntry?.learningArea || 'General';
    const safeStrand = requestData.strand || cbcEntry?.strand || 'General Strand';
    const safeSubstrand = requestData.substrand || cbcEntry?.substrand || 'General Substrand';

    return `
# ${this.type}: ${safeSubstrand}

## Document Information
- Grade: ${safeGrade}
- Subject: ${safeLearningArea}
- Strand: ${safeStrand}
- Sub-strand: ${safeSubstrand}
- Term: ${requestData.term || 'Term 1'}
- School: ${requestData.school || 'Kenyan School'}
- Teacher: ${requestData.teacherName || 'Teacher'}

## Learning Outcomes
${cbcEntry?.slo?.map((slo, i) => `${i+1}. ${slo}`).join('\n') || '1. Understand key concepts\n2. Apply knowledge to real situations'}

## Introduction
This document provides comprehensive lesson content for ${safeSubstrand} in ${safeGrade} ${safeLearningArea}. The content is aligned with the Kenyan Competency Based Curriculum.

## Key Content
Due to a technical issue (${error.message}), the full AI-generated content is unavailable. Please try regenerating this document.

---
*Note: This is fallback content generated due to a technical issue.*
`;
  }

  async callAI(prompt) {
    try {
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'undefined') {
        throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`[${this.type}] ⏱️ Request timeout after ${this.timeoutMs}ms`);
        controller.abort();
      }, this.timeoutMs);

      try {
        const model = "gpt-4o-mini";
        
        console.log(`[${this.type}] Calling ${model}...`);
        console.log(`[${this.type}] Prompt length: ${prompt.length} chars`);
        
        const response = await client.chat.completions.create({
          model: model,
          messages: [
            { 
              role: "system", 
              content: this.getSystemMessage() 
            },
            { 
              role: "user", 
              content: prompt 
            }
          ],
          temperature: 0.3,
          max_completion_tokens: 8000,
          stream: false
        }, {
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        
        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error('AI returned empty content');
        }

        console.log(`[${this.type}] ✅ Generated ${content.length} chars`);
        return content;

      } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError' || error.message.includes('aborted')) {
          throw new Error(`Request timeout after ${this.timeoutMs}ms - try reducing prompt size`);
        }
        
        throw error;
      }

    } catch (error) {
      if (error.code === 'insufficient_quota') {
        throw new Error('OpenAI API quota exceeded. Please add credits at: https://platform.openai.com/billing');
      }
      if (error.code === 'invalid_api_key') {
        throw new Error('Invalid OpenAI API key. Please check your .env file');
      }
      if (error.status === 429) {
        throw new Error('OpenAI rate limit exceeded. Please wait and try again.');
      }
      
      throw new Error(`AI service error: ${error.message}`);
    }
  }

  createPrompt(requestData, cbcEntry) {
    throw new Error('createPrompt must be implemented in subclass');
  }

  getSystemMessage() {
    return `You are a Kenyan CBC curriculum document generator specialized in creating ${this.type}. 

CORE PRINCIPLES:
- Generate comprehensive, professionally structured educational content
- Align with CBC framework and KICD standards
- Use clear, age-appropriate language
- Include practical Kenyan context and examples
- Follow proper markdown formatting

QUALITY STANDARDS:
- Educationally sound and pedagogically appropriate
- Culturally relevant to Kenyan context
- Immediately usable by teachers without editing
- Comprehensive coverage of the topic
- Clear learning objectives and assessment strategies

Generate professional content that serves the needs of Kenyan educators and learners.`;
  }

  escapeForPrompt(text) {
    if (!text) return '';
    return String(text).replace(/["'\\]/g, '\\$&').trim();
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${this.type}] [${level.toUpperCase()}] ${message}`);
  }
}

module.exports = BaseDocumentGenerator;