// BaseDocumentGenerator.js - FIXED VERSION

const { OpenAI } = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 180000, // 3 minutes global timeout
  maxRetries: 0 // Handle retries manually
});

class EnhancedBaseDocumentGenerator {
  constructor(type) {
    this.type = type;
    this.maxRetries = 3; // Increased from 2
    this.timeoutMs = 180000; // Increased to 3 minutes
  }

  /**
   * ✅ ENHANCED: Safe generation with proper error handling
   */
  async generate(requestData, cbcEntry) {
    const startTime = Date.now();
    
    try {
      console.log(`[${this.type}] Starting generation for ${requestData.learningArea}`);
      
      // ✅ VALIDATE CRITICAL FIELDS WITH FALLBACKS
      const safeRequestData = this.validateAndSanitizeRequestData(requestData, cbcEntry);
      
      if (!safeRequestData) {
        throw new Error('Invalid request data after sanitization');
      }

      console.log(`[${this.type}] Input validation passed`);
      
      // Create prompt with safe data
      const prompt = this.createPrompt(safeRequestData, cbcEntry);
      
      if (!prompt || prompt.length < 100) {
        throw new Error('Generated prompt is too short or invalid');
      }

      console.log(`[${this.type}] Prompt created (${prompt.length} chars)`);
      
      // Generate content with retry logic
      const aiContent = await this.generateWithRetry(prompt, 3);
      
      if (!aiContent || aiContent.length < 100) {
        throw new Error('AI generated insufficient content');
      }

      console.log(`[${this.type}] ✅ Generated ${aiContent.length} chars`);
      
      return aiContent;

    } catch (error) {
      console.error(`[${this.type}] ❌ Generation failed:`, error.message);
      
      // ✅ GENERATE FALLBACK CONTENT
      return this.generateFallbackContent(requestData, cbcEntry, error);
    }
  }

  /**
   * ✅ NEW: Validate and sanitize request data with fallbacks
   */
  validateAndSanitizeRequestData(requestData, cbcEntry) {
    if (!requestData) {
      throw new Error('Request data is required');
    }

    // Create a safe copy with fallbacks
    const safeData = {
      ...requestData,
      // ✅ CRITICAL: Ensure grade is always defined
      grade: requestData.grade || cbcEntry?.grade || 'Grade 7',
      // ✅ Ensure other critical fields have fallbacks
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

  /**
   * ✅ ENHANCED: Generate with retry logic
   */
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
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    throw new Error(`All ${maxRetries} AI generation attempts failed`);
  }

  /**
   * ✅ NEW: Generate fallback content when AI fails
   */
  generateFallbackContent(requestData, cbcEntry, error) {
    console.log(`[${this.type}] Generating fallback content due to error: ${error.message}`);
    
    const safeGrade = requestData.grade || cbcEntry?.grade || 'Grade 7';
    const safeLearningArea = requestData.learningArea || cbcEntry?.learningArea || 'General';
    const safeStrand = requestData.strand || cbcEntry?.strand || 'General Strand';
    const safeSubstrand = requestData.substrand || cbcEntry?.substrand || 'General Substrand';

    // Simple fallback content structure
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
This document provides comprehensive lesson content for ${safeSubstrand} in ${safeGrade} ${safeLearningArea}. The content is aligned with the Kenyan Competency Based Curriculum and includes practical examples from the Kenyan context.

## Key Content
Due to a technical issue (${error.message}), the full AI-generated content is unavailable. Please try regenerating this document or contact support if the issue persists.

## Assessment
Basic assessment questions will be included when the full content is generated.

---
*Note: This is fallback content generated due to a technical issue.*
`;
  }

  validateInputs(requestData, cbcEntry) {
    if (!requestData) {
      throw new Error('Request data is required');
    }

    if (!cbcEntry) {
      throw new Error('CBC entry is required');
    }

    const required = ['grade', 'learningArea', 'strand', 'substrand'];
    for (const field of required) {
      if (!requestData[field]) {
        throw new Error(`${field} is required in request data`);
      }
    }

    console.log(`[${this.type}] Input validation passed`);
  }

  validateAIResponse(content) {
    if (!content) {
      throw new Error('AI returned empty content');
    }

    if (typeof content !== 'string') {
      throw new Error('AI returned non-string content');
    }

    if (content.trim().length < 200) {
      throw new Error('AI returned content that is too short');
    }

    if (content.includes('I cannot') || content.includes('I apologize')) {
      throw new Error('AI declined to generate content');
    }

    const errorIndicators = [
      'error occurred',
      'cannot generate',
      'unable to create',
      'insufficient information'
    ];

    for (const indicator of errorIndicators) {
      if (content.toLowerCase().includes(indicator)) {
        throw new Error(`AI response contains error indicator: ${indicator}`);
      }
    }

    console.log(`[${this.type}] AI response validation passed (${content.length} chars)`);
  }

  async callAIWithRetries(prompt) {
    let lastError;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`[${this.type}] AI call attempt ${attempt}/${this.maxRetries}`);

        // ✅ FIX: Exponential backoff between retries
        if (attempt > 1) {
          const delay = Math.min(2000 * Math.pow(2, attempt - 2), 10000);
          console.log(`[${this.type}] Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        const response = await this.callAI(prompt);

        console.log(`[${this.type}] ✅ AI call successful on attempt ${attempt}`);
        return response;

      } catch (error) {
        lastError = error;
        console.error(`[${this.type}] ❌ AI call attempt ${attempt} failed:`, error.message);
        
        // ✅ FIX: Don't retry on specific errors
        if (error.code === 'invalid_api_key' || 
            error.code === 'insufficient_quota' ||
            error.status === 401) {
          console.error(`[${this.type}] Fatal error - not retrying`);
          break;
        }

        if (attempt < this.maxRetries) {
          console.log(`[${this.type}] Will retry...`);
        }
      }
    }

    throw new Error(`AI generation failed after ${this.maxRetries} attempts: ${lastError.message}`);
  }

  async callAI(prompt) {
    try {
      // ✅ FIX 1: Check API key exists
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'undefined') {
        throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file');
      }

      // ✅ FIX 2: Proper abort controller with cleanup
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`[${this.type}] ⏱️ Request timeout after ${this.timeoutMs}ms`);
        controller.abort();
      }, this.timeoutMs);

      try {
        // ✅ FIX 3: Use gpt-4o-mini with proper parameters
        const model = "gpt-4o-mini";
        
        console.log(`[${this.type}] Calling ${model}...`);
        console.log(`[${this.type}] Prompt length: ${prompt.length} chars`);
        console.log(`[${this.type}] Timeout: ${this.timeoutMs}ms`);
        
        const requestParams = {
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
          // ✅ FIX 4: Add stream to prevent timeout on large responses
          stream: false
        };

        const response = await client.chat.completions.create(requestParams, {
          signal: controller.signal
        });

        // ✅ FIX 5: Clear timeout immediately on success
        clearTimeout(timeoutId);
        
        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error('AI returned empty content');
        }

        console.log(`[${this.type}] ✅ Generated ${content.length} chars`);
        return content;

      } catch (error) {
        clearTimeout(timeoutId);
        
        // ✅ FIX 6: Better error detection
        if (error.name === 'AbortError' || error.message.includes('aborted')) {
          throw new Error(`Request timeout after ${this.timeoutMs}ms - try reducing prompt size`);
        }
        
        throw error;
      }

    } catch (error) {
      // ✅ FIX 7: Comprehensive error handling
      if (error.code === 'insufficient_quota') {
        throw new Error('OpenAI API quota exceeded. Please add credits at: https://platform.openai.com/billing');
      }
      if (error.code === 'invalid_api_key') {
        throw new Error('Invalid OpenAI API key. Please check your .env file');
      }
      if (error.status === 429) {
        throw new Error('OpenAI rate limit exceeded. Please wait and try again.');
      }
      if (error.status === 400) {
        throw new Error(`AI service error: ${error.status} ${error.message}`);
      }
      if (error.code === 'model_not_found') {
        throw new Error(`Model not found. Using fallback model.`);
      }
      
      throw new Error(`AI service error: ${error.message}`);
    }
  }

  extractContentFromResponse(response) {
    if (!response.choices || response.choices.length === 0) {
      throw new Error('No response choices returned from AI');
    }

    const content = response.choices[0].message?.content;
    if (!content) {
      throw new Error('No content in AI response');
    }

    return content;
  }

  createPrompt(requestData, cbcEntry) {
    throw new Error('createPrompt must be implemented in subclass');
  }

  postProcess(content, requestData, cbcEntry) {
    try {
      let processed = content.trim();

      processed = this.sanitizeContent(processed);
      processed = this.ensureContentStructure(processed);
      processed = this.cleanImageMarkdownPaths(processed);

      console.log(`[${this.type}] Post-processing completed`);
      return processed;

    } catch (error) {
      console.error(`[${this.type}] Post-processing failed:`, error);
      return content.trim();
    }
  }
  
  static cleanImageMarkdownPaths(content) {
  if (!content) return content;
  
  return content.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    (match, alt, path) => {
      const cleanAlt = alt.replace(/\*\*/g, '').replace(/\*/g, '').trim();
      const cleanPath = path.replace(/\*\*/g, '').replace(/\*/g, '').trim();
      return `![${cleanAlt}](${cleanPath})`;
    }
  );
}

  sanitizeContent(content) {
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  }

  ensureContentStructure(content) {
    if (!content.includes('#') && !content.includes('**') && !content.includes('|')) {
      const lines = content.split('\n');
      const title = lines[0] || `${this.type}`;
      const body = lines.slice(1).join('\n');
      
      return `# ${title}\n\n${body}`;
    }

    return content;
  }

  generateFallbackContent(requestData, cbcEntry, error) {
    console.log(`[${this.type}] Generating fallback content due to error:`, error.message);

    const fallbackContent = `# ${this.type}

## Document Information
- **Grade:** ${requestData.grade}
- **Subject:** ${requestData.learningArea}
- **Strand:** ${requestData.strand}
- **Sub-strand:** ${requestData.substrand}
- **Term:** ${requestData.term}

## Content Generation Notice

This document could not be automatically generated due to a technical issue: ${error.message}

Please try the following:
1. **Refresh and retry** - Temporary network issues may resolve
2. **Check API configuration** - Verify OpenAI API key in .env file
3. **Reduce content complexity** - Try generating without linked concepts
4. **Contact support** - If the problem persists

## Manual Content Guidelines

Based on your selection (${requestData.substrand}), you may want to include:

### Key Learning Areas
- Core concepts related to ${requestData.substrand}
- Age-appropriate activities for ${requestData.grade}
- Assessment strategies
- Required resources and materials

### CBC Framework Reference
${cbcEntry.slo && cbcEntry.slo.length > 0 ? 
  `**Specific Learning Outcomes:**\n${cbcEntry.slo.map((slo, i) => `${i + 1}. ${slo}`).join('\n')}` : 
  'No specific learning outcomes available'}

${cbcEntry.learningExperiences && cbcEntry.learningExperiences.length > 0 ? 
  `\n**Learning Experiences:**\n${cbcEntry.learningExperiences.map((exp, i) => `${i + 1}. ${exp}`).join('\n')}` : 
  ''}

---

*This is a fallback document. Please regenerate for full content.*

**Troubleshooting Tips:**
- Large linked concept breakdowns (5+ weeks) may timeout
- Try generating lesson notes without linking to breakdowns first
- Ensure stable internet connection
- Check OpenAI API status at https://status.openai.com
`;

    return fallbackContent;
  }

  getSystemMessage() {
    return `You are a Kenyan CBC curriculum document generator specialized in creating ${this.type}. 

CORE PRINCIPLES:
- Generate comprehensive, professionally structured educational content
- Align with CBC framework and KICD standards
- Use clear, age-appropriate language
- Include practical Kenyan context and examples
- Follow proper markdown formatting

MARKDOWN TABLE RULES:
When generating tables, each row must be on ONE continuous line:
| Column1 | Column2 | Column3 | Column4 |

DIAGRAM INSTRUCTIONS:
Include [DIAGRAM: detailed description] placeholders where visuals would enhance learning.
Each diagram description should specify:
- Main visual elements and their relationships
- Educational purpose
- Key labels needed
- Appropriate style for the grade level

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

module.exports = EnhancedBaseDocumentGenerator;