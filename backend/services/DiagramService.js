const EducationalDiagramService = require('./EducationalDiagramService');
const { OpenAI } = require("openai");
const axios = require('axios');
const SmartDiagramRouter = require('../routes/SmartDiagramRouter');
const CBCDiagramInstructions = require('./CBCDiagramInstructions');

class DiagramService {
  static maxRetries = 3;
  static timeout = 90000;
  static rateLimitDelay = 3000;
  static lastRequestTime = 0;
  static generatedConcepts = new Map();
  static cache = new Map();

  // Lazy initialization of OpenAI client
  static getClient() {
    if (!this._client) {
      if (!process.env.OPENAI_API_KEY) {
        console.warn('[DiagramService] ⚠️ OpenAI API key not configured');
        return null;
      }
      
      try {
        this._client = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
          timeout: this.timeout
        });
        console.log('[DiagramService] ✅ OpenAI client initialized');
      } catch (error) {
        console.error('[DiagramService] ❌ Failed to initialize OpenAI client:', error.message);
        return null;
      }
    }
    return this._client;
  }

  /**
   * Try DALL-E with validation
   */
  static async tryDALLE(match, options, number, cbcInstructions) {
    try {
      const client = this.getClient();
      if (!client) {
        console.warn('[DiagramService] ⚠️ DALL-E not available (no API key)');
        return null;
      }
      
      let enhancedPrompt;
      
      // ✅ CRITICAL FIX: ALWAYS use CBC-specific prompts when available
      if (cbcInstructions && !cbcInstructions.isGeneric) {
        enhancedPrompt = CBCDiagramInstructions.buildPromptFromInstructions(
          cbcInstructions,
          options.substrand,
          options.learningArea,
          options.grade
        );
        console.log(`[DiagramService] 🎯 Using CBC-SPECIFIC educational prompt`);
      } 
      // ✅ If we have a detailed description from the match, use that
      else if (match.description && match.description.length > 100) {
        enhancedPrompt = this.buildDetailedEducationalPrompt(match, options);
        console.log(`[DiagramService] 📝 Using detailed educational prompt`);
      }
      // ❌ Last resort: simplified prompt
      else {
        enhancedPrompt = this.buildTextbookQualityPrompt(match, options);
        console.log(`[DiagramService] ⚠️ Using fallback simplified prompt`);
      }
      
      // Use validated generation with quality checks
      const dalleImage = await this.generateValidatedDiagram(
        enhancedPrompt, 
        options, 
        number,
        2 // maxRetries
      );
      
      if (!dalleImage || !dalleImage.url) {
        console.log(`[DiagramService] ℹ️ No validated diagram generated`);
        return null;
      }
      
      const imageData = await this.downloadImageToServer(dalleImage.url, options, number);
      
      return {
        number,
        description: match.description || cbcInstructions?.description || 'AI Generated Diagram',
        caption: match.caption || match.description,
        educationalPurpose: cbcInstructions?.description || `Visual aid for ${options.substrand}`,
        imageData: imageData,
        source: 'DALL-E 3 HD (CBC-Aligned)',
        attribution: 'AI Generated Educational Diagram',
        error: null,
        cached: dalleImage.cached
      };
      
    } catch (error) {
      console.error(`[DiagramService] ❌ tryDALLE failed:`, error.message);
      return null;
    }
  }

  /**
   * ✅ NEW: Build detailed educational prompt from match description
   */
  static buildDetailedEducationalPrompt(match, options) {
  const { grade, learningArea, substrand, strand } = options;
  const safeGrade = grade || 'Grade 7';
  
  // Get CBC-specific instructions if available
  const cbcInstructions = CBCDiagramInstructions.getDiagramInstructions(
    learningArea,
    strand || '',
    substrand || '',
    safeGrade,
    []
  );

  // If we have CBC-specific instructions, use them
  if (cbcInstructions && !cbcInstructions.isGeneric) {
    return this.buildCleanDiagramPrompt(
      cbcInstructions,
      substrand,
      learningArea,
      safeGrade,
      match.description
    );
  }

  // Fallback to simple prompt
  return this.buildSimpleDiagramPrompt(
    match.description || match.caption,
    learningArea,
    safeGrade
  );
}

// ============================================
// FIX 2: ADD buildCleanDiagramPrompt method (NEW - add after buildDetailedEducationalPrompt)
// ============================================

static buildCleanDiagramPrompt(instructions, substrand, learningArea, grade, specificConcept = '') {
  const cleanConcept = (specificConcept || substrand)
    .replace(/^(describe|explain|identify|analyze|examine|distinguish|explore|assess)\s+/i, '')
    .trim();

  // Determine if this is a simple concept that needs a simple diagram
  const isSimpleConcept = cleanConcept.split(' ').length <= 6;

  return `Create ONE simple, clean educational diagram (flat design infographic style).

MAIN SUBJECT: ${cleanConcept}
FOR: ${grade} ${learningArea} students in Kenya

CRITICAL STYLE REQUIREMENTS:
✓ Pure white background (#FFFFFF)
✓ ONE central concept or visual element
✓ 3-5 supporting elements maximum
✓ Flat design (2D shapes, no 3D or perspective)
✓ Bold black outlines (3px minimum)
✓ Bright, solid colors only (red, blue, green, yellow, orange)
✓ Large horizontal text (20pt+ sans-serif)
✓ High contrast (dark on light or light on dark)

WHAT TO INCLUDE:
${instructions.elements?.slice(0, 3).map((el, i) => `${i + 1}. ${el}`).join('\n') || '1. Main concept illustration\n2. Clear labels\n3. Key relationships'}

KENYAN CONTEXT:
Include 1-2 Kenyan-specific examples in the diagram

LAYOUT:
- Center: Main concept illustration
- Around: 3-5 labeled supporting elements
- Bottom: Simple title or caption

CRITICAL - WHAT NOT TO INCLUDE:
❌ NO photographs or realistic images
❌ NO complex charts or data tables
❌ NO periodic tables or reference charts
❌ NO multiple separate diagrams
❌ NO maps unless the concept IS about maps
❌ NO rulers, scales, or measurement tools
❌ NO text paragraphs or long explanations
❌ NO decorative borders or frames
❌ NO gradients, shadows, or 3D effects
❌ NO climate zones or complex overlays
❌ NO small unreadable text

THINK: Educational poster for a classroom wall
STYLE: Like a PowerPoint slide with simple shapes
NOT: An infographic with lots of data and charts

Generate ONE SIMPLE, FOCUSED diagram about: ${cleanConcept}`;
}

// ============================================
// FIX 3: ADD buildSimpleDiagramPrompt method (NEW - add after buildCleanDiagramPrompt)
// ============================================

static buildSimpleDiagramPrompt(concept, learningArea, grade) {
  const cleanConcept = concept
    .replace(/^(describe|explain|identify|analyze|examine|distinguish|explore|assess)\s+/i, '')
    .replace(/educational diagram (about|showing|illustrating|for):/gi, '')
    .trim();

  // Extract just the core noun/concept
  const coreWords = cleanConcept.split(' ').slice(0, 4).join(' ');

  return `Draw ONE simple educational diagram: ${coreWords}

STYLE: Minimalist flat design
BACKGROUND: Pure white
LAYOUT: One main element in center, 3-4 labeled parts around it
TEXT: Large (22pt+), horizontal only, maximum 3 words per label
COLORS: Bright and bold (red, blue, green, yellow)
LINES: Thick black outlines (3px)

EXAMPLE LAYOUT:
     [Label]
        ↓
  [Label] → [MAIN CONCEPT] ← [Label]
        ↑
     [Label]

FOR: ${grade} ${learningArea} in Kenya

MUST BE:
- Clean and simple
- Easy to copy by hand
- One focused concept
- Classroom poster style

MUST NOT BE:
- Photo or realistic image
- Chart with data and numbers
- Complex infographic
- Multiple diagrams

Think: "What would a teacher draw on a chalkboard?"
Make it THAT simple.`;
}

  /**
   * Validate diagram quality with retry logic
   */
  static async generateValidatedDiagram(prompt, options, number, maxRetries = 2) {
  let attempt = 0;
  let lastError = null;
  let lastQuality = null;
  
  while (attempt < maxRetries) {
    try {
      console.log(`[DiagramService] 🎨 Generating diagram ${number}, attempt ${attempt + 1}/${maxRetries}`);
      
      const result = await this.generateTextbookQualityImageWithPrompt(
        prompt, 
        options, 
        number
      );
      
      if (!result || !result.url) {
        throw new Error('No URL returned');
      }
      
      const quality = await this.assessDiagramQuality(result.url);
      lastQuality = quality;
      
      console.log(`[DiagramService] 📊 Diagram ${number} quality: ${quality.score}/100`);
      
      if (quality.passed) {
        console.log(`[DiagramService] ✅ Diagram ${number} passed quality check`);
        return result;
      } else {
        console.log(`[DiagramService] ⚠️ Quality issues:`, quality.issues);
        
        // ✅ If it looks like a photo/scan, try with MORE restrictive prompt
        if (quality.shouldRetry && attempt < maxRetries - 1) {
          console.log(`[DiagramService] 🔄 Retrying with more restrictive prompt...`);
          prompt = this.makePromptMuchMoreRestrictive(prompt);
          attempt++;
          await this.sleep(2000);
          continue;
        }
      }
      
    } catch (error) {
      lastError = error;
      console.error(`[DiagramService] ❌ Attempt ${attempt + 1} failed:`, error.message);
      
      if (attempt < maxRetries - 1) {
        attempt++;
        await this.sleep(2000);
        continue;
      }
    }
    
    break;
  }
  
  // ✅ All DALL-E attempts failed - try Wikimedia as fallback
  console.log(`[DiagramService] ⚠️ DALL-E quality unsatisfactory, trying Wikimedia fallback...`);
  
  try {
    const wikimediaResult = await this.tryWikimediaFallback(
      options.substrand || options.learningArea,
      options.learningArea,
      options.grade,
      options.documentId
    );
    
    if (wikimediaResult) {
      console.log(`[DiagramService] ✅ Using Wikimedia fallback`);
      return { url: wikimediaResult.imageUrl, cached: false, source: 'wikimedia' };
    }
  } catch (wikimediaError) {
    console.error(`[DiagramService] ❌ Wikimedia fallback also failed:`, wikimediaError.message);
  }
  
  // ✅ Use the best DALL-E attempt we got, even if quality is low
  console.log(`[DiagramService] ⚠️ Using DALL-E diagram despite quality issues (score: ${lastQuality?.score || 0})`);
  return await this.generateTextbookQualityImageWithPrompt(prompt, options, number);
}

/**
 * ✅ NEW: Much more restrictive prompt to avoid photos
 */
static makePromptMuchMoreRestrictive(originalPrompt) {
  const conceptMatch = originalPrompt.match(/SUBJECT:\s*([^\n]+)/i) || 
                       originalPrompt.match(/MAIN SUBJECT:\s*([^\n]+)/i) ||
                       originalPrompt.match(/simple diagram:\s*([^\n]+)/i);
  const concept = conceptMatch ? conceptMatch[1].trim() : 'educational concept';

  return `Draw the SIMPLEST POSSIBLE educational diagram about: ${concept}

ULTRA-SIMPLE REQUIREMENTS:
- Pure white background
- ONE main shape in the center
- Maximum 4 labels pointing to parts
- Large text (24pt+)
- Basic geometric shapes only (circles, rectangles, triangles)
- Solid bright colors
- Thick black lines

THINK: What a teacher draws on a whiteboard with markers

ABSOLUTELY FORBIDDEN:
❌ NO photos or realistic images
❌ NO charts, graphs, or data tables
❌ NO maps or globes
❌ NO small text or paragraphs
❌ NO complex diagrams with many parts
❌ NO decorative elements

EXAMPLE: If teaching "parts of a flower"
✓ Draw: Simple flower with 4-5 arrows pointing to petals, stem, roots, leaves
✗ DON'T: Complex botanical illustration with cells and scientific details

Keep it EXTREMELY simple - like a children's picture book.`;
}

/**
 * ✅ NEW: Wikimedia fallback for when DALL-E fails
 */
static async tryWikimediaFallback(topic, subject, grade, documentId) {
  console.log(`[DiagramService] 🔍 Searching Wikimedia for: ${topic}`);
  
  try {
    const EducationalDiagramService = require('./EducationalDiagramService');
    
    const result = await EducationalDiagramService.getEducationalDiagram(
      topic,
      subject,
      grade,
      documentId || 'fallback'
    );
    
    return result;
    
  } catch (error) {
    console.error(`[DiagramService] Wikimedia fallback failed:`, error.message);
    return null;
  }
}

  /**
   * Assess diagram quality
   */
  static async assessDiagramQuality(imageUrl) {
  let score = 100;
  const issues = [];
  
  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 10000
    });
    
    const imageData = Buffer.from(response.data);
    const imageSize = imageData.length;
    
    console.log(`[DiagramService] Analyzing image: ${imageSize} bytes`);
    
    // ✅ Size analysis
    if (imageSize < 150000) {
      score -= 40;
      issues.push('Image too small - likely too simple or blank');
    } else if (imageSize > 2200000) {
      score -= 30;
      issues.push('Image too large - likely a photo or scan');
    }
    
    // ✅ Optimal range for clean diagrams
    if (imageSize >= 200000 && imageSize <= 1500000) {
      console.log(`[DiagramService] ✓ Good file size: ${(imageSize / 1000).toFixed(0)}KB`);
    } else {
      score -= 20;
      issues.push('File size outside optimal range for diagrams');
    }
    
    // ✅ Check image complexity (very large = likely photo)
    if (imageSize > 2000000) {
      score -= 40;
      issues.push('Very large file - likely contains photo or scan');
    }
    
  } catch (error) {
    score -= 50;
    issues.push('Failed to download/analyze image');
  }
  
  return {
    score: Math.max(0, score),
    issues: issues,
    passed: score >= 60,
    shouldRetry: score < 60 && issues.some(i => i.includes('photo') || i.includes('scan'))
  };
}

  /**
   * Make prompt more restrictive
   */
  static makePromptMoreRestrictive(originalPrompt, issues) {
    let enhanced = originalPrompt;
    
    enhanced += `\n\n⚠️⚠️ CRITICAL CORRECTIONS NEEDED ⚠️⚠️

Previous attempt had these issues: ${issues.join('; ')}

ABSOLUTE REQUIREMENTS:
1. WHITE BACKGROUND - Must be pure white (#FFFFFF)
2. LARGE TEXT ONLY - Minimum 36pt, preferably 40pt or larger
3. MAXIMUM 3 WORDS per label - No sentences, no paragraphs
4. SIMPLE SHAPES - Only circles, rectangles, or triangles
5. HIGH CONTRAST - Dark text on white, or white text on dark shapes
6. 4-6 ELEMENTS MAXIMUM - Do not add more elements
7. CLEAR SPACING - 2-3cm between all elements
8. NO DECORATIONS - No borders, shadows, gradients, or artistic effects

Generate a SIMPLE, CLEAR diagram with HUGE text that can be read from 5 meters away.`;

    return enhanced;
  }

  /**
   * Generate image with DALL-E
   */
  static async generateTextbookQualityImageWithPrompt(prompt, options, number) {
  try {
    const client = this.getClient();
    if (!client) {
      throw new Error('OpenAI client not available');
    }

    const cacheKey = this.getCacheKey(prompt.substring(0, 200), {
      ...options,
      number: number || 1
    });
    
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 300000) {
      const age = Math.floor((Date.now() - cached.timestamp) / 1000);
      console.log(`[DiagramService] Using cached DALL-E diagram (${age}s old)`);
      return { url: cached.url, cached: true };
    }

    await this.respectRateLimit();
    
    // ✅ Add variation instruction at the END of prompt
    const uniquePrompt = `${prompt}

DIAGRAM VARIATION ${number}: Make this diagram visually different from other diagrams by varying the layout, specific examples, and color scheme while maintaining the same educational content.`;
    
    console.log(`[DiagramService] Calling DALL-E 3 HD (variation #${number || 1})...`);
    console.log(`[DiagramService] Prompt preview:`, uniquePrompt.substring(0, 200) + '...');
    
    const response = await Promise.race([
      client.images.generate({
        model: "dall-e-3",
        prompt: uniquePrompt,
        size: "1024x1024",
        quality: "hd",
        style: "natural", // ✅ "natural" style is better for diagrams than "vivid"
        n: 1
      }),
      this.timeoutPromise(this.timeout)
    ]);

    if (!response.data?.[0]?.url) {
      throw new Error('No image URL returned from DALL-E');
    }

    const imageUrl = response.data[0].url;
    
    // ✅ NEW: Basic quality check - reject if it looks like a textbook photo
    const qualityCheck = await this.quickQualityCheck(imageUrl);
    if (!qualityCheck.passed) {
      console.warn(`[DiagramService] ⚠️ Diagram quality concern: ${qualityCheck.reason}`);
      // Continue anyway - we'll handle it in validation
    }
    
    this.cache.set(cacheKey, {
      url: imageUrl,
      timestamp: Date.now()
    });

    console.log(`[DiagramService] ✅ DALL-E generated NEW diagram #${number || 1}`);
    return { url: imageUrl, cached: false };
    
  } catch (error) {
    console.error('[DiagramService] ❌ DALL-E generation error:', error.message);
    throw error;
  }
}

/**
 * ✅ NEW: Quick quality check for generated images
 */
static async quickQualityCheck(imageUrl) {
  try {
    // Download and check basic properties
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 10000
    });
    
    const imageData = Buffer.from(response.data);
    const imageSize = imageData.length;
    
    // Too small = likely failed or blank
    if (imageSize < 100000) {
      return { 
        passed: false, 
        reason: 'Image too small - likely blank or failed' 
      };
    }
    
    // Too large = likely photo or complex scan
    if (imageSize > 2500000) {
      return { 
        passed: false, 
        reason: 'Image too large - might be a photo or scan' 
      };
    }
    
    return { passed: true, reason: 'Looks good' };
    
  } catch (error) {
    console.warn('[DiagramService] Could not perform quality check:', error.message);
    return { passed: true, reason: 'Could not verify' };
  }
}

  /**
   * Build fallback textbook prompt
   */
  static buildTextbookQualityPrompt(match, options) {
  const { grade, learningArea } = options;
  const topic = (match.description || match.caption || '').trim();
  
  const coreWords = topic
    .replace(/^(a simple educational diagram|educational diagram|diagram)\s+(about|showing|illustrating|for)\s+/i, '')
    .replace(/['"`]/g, '')
    .trim()
    .split(' ')
    .slice(0, 4)
    .join(' ');
  
  console.log(`[DiagramService] Core concept: "${coreWords}"`);
  
  return `Draw a simple educational diagram: ${coreWords}

For ${grade} ${learningArea} students

LAYOUT:
- White background
- One main element in center
- 3-4 labeled parts
- Large text (22pt+)

STYLE:
- Flat design (like shapes in PowerPoint)
- Bright colors (red, blue, green, yellow)
- Bold black outlines
- Simple and clean

IMPORTANT: Make it so simple that a student could copy it by hand.

NOT a photo, NOT a complex chart, just a SIMPLE diagram.`;
}

  // ============ HELPER METHODS ============
  
  static getCacheKey(description, options) {
    const { grade, learningArea, number, substrand } = options;
    const descHash = this.hashDiagramConcept(description || 'default');
    
    return `${grade || 'grade'}_${learningArea || 'subject'}_${substrand || 'topic'}_${number || 0}_${descHash}`
      .toLowerCase()
      .replace(/\s+/g, '_')
      .substring(0, 120);
  }

  static hashDiagramConcept(description) {
    const normalized = description
      .toLowerCase()
      .replace(/educational diagram|illustrating|showing|for grade \d+/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 100);
    
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  static async respectRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      const waitTime = this.rateLimitDelay - timeSinceLastRequest;
      console.log(`[DiagramService] Rate limiting: waiting ${waitTime}ms`);
      await this.sleep(waitTime);
    }
    this.lastRequestTime = Date.now();
  }

  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  static timeoutPromise(ms) {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), ms);
    });
  }

  static async downloadImageToServer(imageUrl, options, number) {
  try {
    console.log(`[DiagramService] Downloading diagram ${number}...`);
    
    let buffer;
    let mimeType;
    let base64Data;
    
    if (imageUrl.startsWith('data:')) {
      const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) throw new Error('Invalid data URL');
      
      mimeType = matches[1];
      base64Data = matches[2];
      buffer = Buffer.from(base64Data, 'base64');
    } else {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000
      });
      
      buffer = Buffer.from(response.data);
      mimeType = response.headers['content-type'] || 'image/png';
      base64Data = buffer.toString('base64');
    }
    
    const path = require('path');
    const fs = require('fs').promises;
    
    const uploadDir = path.join(__dirname, '..', 'uploads', 'diagrams');
    await fs.mkdir(uploadDir, { recursive: true });
    
    const extension = '.png';
    const filename = `diagram-${(options.grade || 'grade').toLowerCase().replace(/\s+/g, '_')}-${(options.learningArea || 'subject').toLowerCase().replace(/\s+/g, '_')}-${number}-${Date.now()}${extension}`
      .replace(/[^a-z0-9_.-]/g, '');
    
    const filepath = path.join(uploadDir, filename);
    await fs.writeFile(filepath, buffer);
    
    console.log(`[DiagramService] ✅ Saved: ${filename} (${buffer.length} bytes)`);
    
    // ✅ CRITICAL: Return BOTH base64 AND file path
    return {
      dataUrl: `data:${mimeType};base64,${base64Data}`,
      base64Data: base64Data, // ✅ Store base64 for fallback
      filePath: `/api/diagrams/${filename}`, // ✅ Relative path for serving
      fileName: filename,
      mimeType: mimeType,
      fileSize: buffer.length // ✅ Track size
    };
    
  } catch (error) {
    console.error('[DiagramService] Download failed:', error.message);
    throw error;
  }
}

  /**
   * Process inline diagrams - main entry point
   */
  static async processInlineDiagrams(aiContent, contextData) {
    if (typeof contextData === 'string') {
      const grade = contextData;
      const learningArea = arguments[2];
      const documentId = arguments[3];
      contextData = { grade, learningArea, documentId };
    }

    const { 
      grade, 
      learningArea, 
      strand, 
      substrand, 
      cbcEntry, 
      documentId,
      maxDiagrams = 5
    } = contextData;

    console.log('[DiagramService] Starting diagram processing');

    const docId = documentId || `${grade}_${learningArea}_${substrand}_${Date.now()}`;
    
    EducationalDiagramService.resetUsedImages(docId);
    this.generatedConcepts.delete(docId);

    let matches = [];
    const enhancedRegex = /\[DIAGRAM:\s*\{[\s\S]*?\}\s*\]/g;
    let match;
    
    while ((match = enhancedRegex.exec(aiContent)) !== null) {
      try {
        const jsonStr = match[0]
          .replace(/\[DIAGRAM:\s*/, '')
          .replace(/\s*\]$/, '')
          .trim();
        
        const spec = JSON.parse(jsonStr);
        
        if (this.isConceptAlreadyGenerated(spec.description, docId)) {
          console.log(`[DiagramService] Skipping duplicate diagram`);
          continue;
        }
        
        matches.push({
          fullMatch: match[0],
          index: match.index,
          enhanced: true,
          description: spec.description,
          caption: spec.caption || spec.description,
          context: spec.context,
          educationalPurpose: spec.educationalPurpose,
          visualElements: spec.visualElements || [],
          labels: spec.labels || []
        });
      } catch (e) {
        console.warn('[DiagramService] Failed to parse enhanced format:', e.message);
      }
    }

    if (matches.length > maxDiagrams) {
      console.log(`[DiagramService] ⚠️ Limiting ${matches.length} diagrams to ${maxDiagrams}`);
      matches = matches.slice(0, maxDiagrams);
    }

    if (matches.length === 0) {
      return { 
        content: aiContent, 
        diagrams: [], 
        stats: { total: 0, successful: 0, failed: 0 } 
      };
    }

    console.log(`[DiagramService] Processing ${matches.length} diagrams`);

    const diagramResults = await this.generateDiagramsBatch(matches, {
      grade,
      learningArea,
      strand,
      substrand,
      cbcEntry,
      documentId: docId
    });

    let processedContent = aiContent;
    let replacementCount = 0;

    diagramResults.forEach((diagram, index) => {
      const placeholder = diagram.placeholder || matches[index]?.fullMatch;
      
      if (!placeholder) {
        console.warn(`[DiagramService] ⚠️ No placeholder for diagram ${index + 1}`);
        return;
      }
      
      if (diagram.imageData && diagram.imageData.filePath) {
        const markdown = `\n\n![${diagram.caption || diagram.description}](${diagram.imageData.filePath})\n\n*Figure ${diagram.number}: ${diagram.caption || diagram.description}*\n\n`;
        
        if (processedContent.includes(placeholder)) {
          processedContent = processedContent.replace(placeholder, markdown);
          replacementCount++;
          console.log(`[DiagramService] ✅ Replaced diagram ${diagram.number}`);
        }
      } else {
        if (processedContent.includes(placeholder)) {
          processedContent = processedContent.replace(placeholder, '');
          console.log(`[DiagramService] ❌ Removed failed diagram ${index + 1}`);
        }
      }
    });

    const remainingPlaceholders = (processedContent.match(/\[DIAGRAM:[^\]]+\]/g) || []).length;
    if (remainingPlaceholders > 0) {
      console.log(`[DiagramService] ⚠️ Removing ${remainingPlaceholders} unprocessed placeholders`);
      processedContent = processedContent.replace(/\[DIAGRAM:[^\]]+\]/g, '');
    }
    
    const successCount = diagramResults.filter(d => d.imageData && d.imageData.filePath).length;
    
    console.log(`[DiagramService] ✅ Completed: ${successCount}/${matches.length} diagrams`);
    
    return {
      content: processedContent,
      diagrams: diagramResults.filter(d => d.imageData && d.imageData.filePath),
      stats: {
        total: matches.length,
        successful: successCount,
        failed: matches.length - successCount,
        replaced: replacementCount
      }
    };
  }

  static isConceptAlreadyGenerated(description, documentId) {
    if (!this.generatedConcepts.has(documentId)) {
      this.generatedConcepts.set(documentId, new Set());
    }
    
    const hash = this.hashDiagramConcept(description);
    const concepts = this.generatedConcepts.get(documentId);
    
    if (concepts.has(hash)) {
      return true;
    }
    
    concepts.add(hash);
    return false;
  }

  static async generateDiagramsBatch(matches, options) {
    const results = [];
    
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      
      try {
        const result = await this.generateDiagramWithRetry(match, i + 1, options);
        results.push(result);
      } catch (error) {
        console.error(`[DiagramService] Diagram ${i + 1} failed:`, error.message);
        results.push({
          number: i + 1,
          description: match.description || 'Diagram',
          caption: match.caption || match.description || 'Diagram',
          placeholder: match.fullMatch,
          imageData: null,
          error: error.message || 'Unknown error',
          failed: true
        });
      }
      
      if (i < matches.length - 1) {
        await this.sleep(this.rateLimitDelay);
      }
    }
    
    return results;
  }

  /**
   * Enhanced diagram generation with comprehensive error handling
   */
  static async generateDiagramWithRetry(match, number, options) {
    console.log(`[DiagramService] Generating diagram ${number} for ${options.learningArea}`);
    
    const originalPlaceholder = match.fullMatch || `[DIAGRAM:${match.description || 'diagram'}]`;
    
    try {
      const topic = match.description || match.caption || 'Educational Concept';
      const subject = options.learningArea || 'General';
      const substrand = options.substrand || '';
      const strand = options.strand || '';
      
      // Ensure grade is defined
      const safeGrade = options.grade || 'Grade 7';
      
      const cbcInstructions = CBCDiagramInstructions.getDiagramInstructions(
        subject,
        strand,
        substrand,
        safeGrade, // Use safe grade
        options.cbcSLO || []
      );
      
      console.log(`[DiagramService] 📋 CBC Instructions: ${cbcInstructions.isGeneric ? 'Generic' : 'Specific'} (Priority: ${cbcInstructions.priority})`);
      
      const routing = SmartDiagramRouter.analyzeTopicAndRoute(
        topic, 
        subject, 
        safeGrade,
        substrand
      );
      
      console.log(`[DiagramService] 🎯 Routing: ${routing.primary} → ${routing.fallback || 'none'}`);
      
      let result = null;
      
      // Try primary source
      if (routing.primary === 'wikimedia') {
        result = await this.tryWikimedia(topic, subject, options, number, cbcInstructions);
      } else if (routing.primary === 'dalle') {
        result = await this.tryDALLE(match, options, number, cbcInstructions);
      }
      
      // Try fallback if primary failed
      if (!result && routing.fallback) {
        console.log(`[DiagramService] ⚠️ Primary failed, trying fallback: ${routing.fallback}`);
        
        if (routing.fallback === 'dalle') {
          result = await this.tryDALLE(match, options, number, cbcInstructions);
        } else if (routing.fallback === 'wikimedia') {
          result = await this.tryWikimedia(topic, subject, options, number, cbcInstructions);
        }
      }
      
      if (result) {
        result.placeholder = originalPlaceholder;
        result.cbcInstructions = cbcInstructions;
        result.routing = routing;
        console.log(`[DiagramService] ✅ Diagram ${number} generated successfully`);
        return result;
      }
      
      throw new Error('All diagram generation methods failed');
      
    } catch (error) {
      console.error(`[DiagramService] ❌ Diagram ${number} failed:`, error.message);
      
      return {
        number,
        description: match.description || 'Diagram',
        caption: match.caption || match.description || `Figure ${number}`,
        placeholder: originalPlaceholder,
        imageData: null,
        error: error.message,
        failed: true
      };
    }
  }

  /**
   * Try Wikimedia
   */
  static async tryWikimedia(topic, subject, options, number, cbcInstructions) {
    try {
      const eduDiagram = await EducationalDiagramService.getEducationalDiagram(
        topic,
        subject,
        options.grade || 'Primary',
        options.documentId || 'default'
      );

      if (eduDiagram && eduDiagram.imageUrl) {
        console.log(`[DiagramService] ✅ Got Wikimedia diagram`);
        
        const imageData = await this.downloadImageToServer(
          eduDiagram.imageUrl, 
          options, 
          number
        );
        
        return {
          number,
          description: topic,
          caption: cbcInstructions.description || topic,
          educationalPurpose: `Illustrates ${options.substrand} for ${options.grade}`,
          imageData: imageData,
          source: eduDiagram.source,
          attribution: eduDiagram.attribution,
          error: null,
          cached: false
        };
      }
      
      console.log(`[DiagramService] ℹ️ No Wikimedia image found`);
      return null;
      
    } catch (error) {
      console.error(`[DiagramService] ❌ Wikimedia error:`, error.message);
      return null;
    }
  }

  static clearDocumentConcepts(documentId) {
    this.generatedConcepts.delete(documentId);
    console.log(`[DiagramService] Cleared concept tracking for: ${documentId}`);
  }
}

module.exports = DiagramService;