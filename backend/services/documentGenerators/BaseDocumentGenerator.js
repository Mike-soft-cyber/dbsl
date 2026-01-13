// BaseDocumentGenerator.js - COMPLETE FIXED VERSION
const { OpenAI } = require("openai");

class BaseDocumentGenerator {
  constructor(type, config = {}) {
    this.type = type;
    this.maxRetries = 3;
    this.timeoutMs = 180000;
    
    // Default to OpenAI if nothing specified
    this.aiProvider = config.aiProvider || process.env.AI_PROVIDER || 'openai';
    
    console.log(`[${this.type}] Using AI Provider: ${this.aiProvider}`);
    
    this.initializeAIClient();
  }

  initializeAIClient() {
    console.log(`[${this.type}] Initializing ${this.aiProvider} client...`);
    
    switch (this.aiProvider) {
      case 'openai':
        const { OpenAI } = require("openai");
        
        if (!process.env.OPENAI_API_KEY) {
          throw new Error('OPENAI_API_KEY not found in environment variables');
        }
        
        this.client = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
          timeout: 180000,
          maxRetries: 0
        });
        
        this.model = process.env.OPENAI_MODEL || "gpt-4o-mini";
        console.log(`[${this.type}] OpenAI model: ${this.model}`);
        break;

      case 'anthropic':
      const { Anthropic } = require("@anthropic-ai/sdk");
      this.client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
      
      // CLAUDE 4.X MODELS - Use these!
      const claude4Models = [
        'claude-4-haiku-20241022',
        'claude-4-sonnet-20241022',
        'claude-4.5-sonnet-20241022',
        'claude-4-opus-20241022'
      ];
      
      // Try the one from env, or use Claude 4 Haiku (cheapest/fastest)
      const envModel = process.env.ANTHROPIC_MODEL;
      if (envModel && claude4Models.includes(envModel)) {
        this.model = envModel;
      } else {
        this.model = 'claude-4-haiku-20241022'; // Default to Claude 4 Haiku
        console.log(`[${this.type}] Using Claude 4 model: ${this.model}`);
      }
      break;

      case 'google':
        const { GoogleGenerativeAI } = require("@google/generative-ai");
        this.client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        this.model = process.env.GOOGLE_MODEL || "gemini-pro";
        break;

      case 'ollama':
        // For local Ollama
        const { OpenAI: OllamaOpenAI } = require("openai");
        this.client = new OllamaOpenAI({
          baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1",
          apiKey: "ollama" // Not needed for Ollama
        });
        this.model = process.env.OLLAMA_MODEL || "llama2";
        break;

      case 'azure':
        const { AzureOpenAI } = require("openai");
        this.client = new AzureOpenAI({
          apiKey: process.env.AZURE_OPENAI_KEY,
          endpoint: process.env.AZURE_OPENAI_ENDPOINT,
          apiVersion: "2023-12-01-preview"
        });
        this.model = process.env.AZURE_OPENAI_MODEL || "gpt-4";
        break;

      default:
        throw new Error(`Unsupported AI provider: ${this.aiProvider}`);
    }
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
      // Check API key based on provider
      this.validateAPIKey();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`[${this.type}] ⏱️ Request timeout after ${this.timeoutMs}ms`);
        controller.abort();
      }, this.timeoutMs);

      try {
        console.log(`[${this.type}] Calling ${this.aiProvider} (${this.model})...`);
        console.log(`[${this.type}] Prompt length: ${prompt.length} chars`);

        let response;
        
        switch (this.aiProvider) {
          case 'openai':
          case 'azure':
          case 'ollama':
            response = await this.client.chat.completions.create({
              model: this.model,
              messages: [
                { role: "system", content: this.getSystemMessage() },
                { role: "user", content: prompt }
              ],
              temperature: 0.3,
              max_tokens: 8000,
              stream: false
            }, { signal: controller.signal });
            break;

          case 'anthropic':
            response = await this.client.messages.create({
              model: this.model,
              max_tokens: 8000,
              messages: [
                { role: "user", content: prompt }
              ],
              temperature: 0.3,
              system: this.getSystemMessage()
            });
            // Format to match OpenAI response structure
            response = {
              choices: [{
                message: {
                  content: response.content[0].text
                }
              }]
            };
            break;

          case 'google':
            const genAI = this.client;
            const model = genAI.getGenerativeModel({ model: this.model });
            const result = await model.generateContent([
              this.getSystemMessage(),
              prompt
            ].join("\n\n"));
            response = {
              choices: [{
                message: {
                  content: result.response.text()
                }
              }]
            };
            break;
        }

        clearTimeout(timeoutId);
        
        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error('AI returned empty content');
        }

        console.log(`[${this.type}] ✅ Generated ${content.length} chars`);
        return content;

      } catch (error) {
        clearTimeout(timeoutId);
        this.handleAIError(error);
      }

    } catch (error) {
      throw error;
    }
  }

  validateAPIKey() {
    const envVars = {
      'openai': 'OPENAI_API_KEY',
      'anthropic': 'ANTHROPIC_API_KEY',
      'google': 'GOOGLE_API_KEY',
      'azure': 'AZURE_OPENAI_KEY',
      'ollama': null // No API key needed
    };

    const envVar = envVars[this.aiProvider];
    if (envVar && (!process.env[envVar] || process.env[envVar] === 'undefined')) {
      throw new Error(`${this.aiProvider.toUpperCase()} API key not configured. Please set ${envVar} in your .env file`);
    }
  }

  handleAIError(error) {
    if (error.name === 'AbortError' || error.message.includes('aborted')) {
      throw new Error(`Request timeout after ${this.timeoutMs}ms - try reducing prompt size`);
    }

    const providerErrors = {
      'openai': {
        'insufficient_quota': 'OpenAI API quota exceeded. Please add credits at: https://platform.openai.com/billing',
        'invalid_api_key': 'Invalid OpenAI API key. Please check your .env file',
        '429': 'OpenAI rate limit exceeded. Please wait and try again.'
      },
      'anthropic': {
        'invalid_api_key': 'Invalid Anthropic API key.',
        '429': 'Anthropic rate limit exceeded.'
      },
      'google': {
        'INVALID_ARGUMENT': 'Invalid Google AI API key or configuration.',
        'RESOURCE_EXHAUSTED': 'Google AI quota exceeded.'
      },
      'azure': {
        '429': 'Azure OpenAI rate limit exceeded.',
        '401': 'Invalid Azure OpenAI API key.'
      }
    };

    const errors = providerErrors[this.aiProvider] || {};
    const errorCode = error.code || error.status || '';
    
    if (errors[errorCode]) {
      throw new Error(errors[errorCode]);
    }

    if (error.message) {
      throw new Error(`${this.aiProvider.toUpperCase()} error: ${error.message}`);
    }

    throw new Error(`AI service error: ${error.toString()}`);
  }

  // Abstract method - must be implemented by subclasses
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