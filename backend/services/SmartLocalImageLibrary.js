const fs = require('fs').promises;
const path = require('path');

class SmartLocalImageLibrary {
  constructor() {
    // Base directory: backend/diagrams/
    this.imageBaseDir = path.join(__dirname, '..', 'diagrams');
    
    // Cache for faster lookups
    this.imageCache = new Map(); // Format: "grade|subject" => [filenames]
    
    // ✅ FIX: Use HTTP URLs instead of base64
    this.baseURL = process.env.BASE_URL || 'http://localhost:5000' || 'https://dbsl.onrender.com';
  }

  /**
 * ✅ MAIN FUNCTION: Auto-detect and match images by filename similarity - FIXED VERSION
 */
async findImagesForConcepts(learningConcepts, subject, grade) {
  const results = [];
  
  // Normalize grade and subject
  const gradeFolder = this.normalizeGrade(grade);
  const subjectFolder = this.normalizeSubject(subject);
  
  console.log(`[SmartImageLibrary] 🔍 Auto-detecting in: diagrams/${gradeFolder}/${subjectFolder}/`);
  console.log(`[SmartImageLibrary] Processing ${learningConcepts.length} concepts`);
  
  // Get all available images in this folder
  const availableImages = await this.getAvailableImages(gradeFolder, subjectFolder);
  
  if (availableImages.length === 0) {
    console.log(`[SmartImageLibrary] ⚠️ No images found in diagrams/${gradeFolder}/${subjectFolder}/`);
    console.log(`[SmartImageLibrary]    💡 TIP: Create folder and add images there`);
    
    return learningConcepts.map((concept, i) => ({
      week: concept.week || `Concept ${i + 1}`,
      concept: concept.concept || concept,
      hasImage: false,
      reason: 'No images in folder',
      suggestedPath: `diagrams/${gradeFolder}/${subjectFolder}/`,
      index: i
    }));
  }
  
  console.log(`[SmartImageLibrary] 📁 Found ${availableImages.length} images in folder`);
  
  // Match each concept to best available image
  for (let i = 0; i < learningConcepts.length; i++) {
    const concept = learningConcepts[i];
    const conceptText = concept.concept || concept;
    
    console.log(`\n[SmartImageLibrary] Concept ${i + 1}: "${conceptText}"`);
    
    // Find best matching image by filename similarity
    const match = this.findBestMatch(conceptText, availableImages);
    
    if (match) {
      // ✅ CRITICAL FIX: Use the ORIGINAL filename, not the cleaned one
      const originalFilename = match.originalFilename || match.filename;
      const imagePath = path.join(gradeFolder, subjectFolder, originalFilename);
      
      // ✅ CRITICAL FIX: Clean concept text for display only
      const cleanConceptText = conceptText
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/\_\_/g, '')
        .replace(/\_/g, '')
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
        .replace(/`/g, '')
        .trim();
      
      // ✅ CRITICAL FIX: Generate URL with ORIGINAL filename (no cleaning)
      const imageUrl = `${this.baseURL}/api/diagrams/${gradeFolder}/${subjectFolder}/${encodeURIComponent(originalFilename)}`;
      
      // 🔍 DEBUG: Check URL at generation
      console.log(`[SmartImageLibrary] 🔍 DEBUG: Generated URL: ${imageUrl}`);
      console.log(`[SmartImageLibrary] 🔍 DEBUG: Original filename: ${originalFilename}`);
      
      console.log(`[SmartImageLibrary] ✅ Matched to: ${originalFilename} (${match.score}% similarity)`);
      console.log(`[SmartImageLibrary] 🌐 URL: ${imageUrl}`)
      
      results.push({
        week: concept.week || `Concept ${i + 1}`,
        concept: cleanConceptText,
        hasImage: true,
        imagePath: imagePath,
        filename: originalFilename, // ✅ Use original filename
        imageUrl: imageUrl,
        imageData: imageUrl,
        matchScore: match.score,
        index: i
      });
    } else {
      // ... rest of no-match handling
    }
  }
  
  return results;
}

  /**
   * ✅ Find best matching image by filename similarity
   */
  /**
 * ✅ Find best matching image by filename similarity - FIXED VERSION
 */
findBestMatch(conceptText, availableImages) {
  // Clean and normalize concept text
  const cleanConcept = this.cleanConceptText(conceptText);
  const conceptWords = cleanConcept.split(/[\s-]+/).filter(w => w.length > 2);
  
  console.log(`[SmartImageLibrary]    🔍 Searching for keywords: ${conceptWords.join(', ')}`);
  
  let bestMatch = null;
  let highestScore = 0;
  
  for (const image of availableImages) {
    // Clean filename (remove extension and special chars) for matching only
    const cleanFilename = image.cleanName;
    const filenameWords = cleanFilename.split(/[\s-]+/).filter(w => w.length > 2);
    
    // Calculate similarity score
    const score = this.calculateSimilarity(conceptWords, filenameWords);
    
    if (score > highestScore) {
      highestScore = score;
      bestMatch = {
        filename: image.filename, // ✅ Use original filename
        originalFilename: image.filename, // ✅ Store original
        cleanName: image.cleanName, // ✅ Keep cleaned for matching
        score: Math.round(score)
      };
    }
  }
  
  // Only return match if similarity is above threshold (40%)
  if (highestScore >= 40) {
    return bestMatch;
  }
  
  return null;
}

  /**
   * ✅ Calculate similarity score between concept and filename
   */
  calculateSimilarity(conceptWords, filenameWords) {
    if (conceptWords.length === 0 || filenameWords.length === 0) {
      return 0;
    }
    
    let matchCount = 0;
    let totalWeight = 0;
    
    // Check each concept word against filename words
    conceptWords.forEach((conceptWord, index) => {
      // Earlier words are more important (higher weight)
      const weight = conceptWords.length - index;
      totalWeight += weight;
      
      if (filenameWords.some(fw => fw === conceptWord || fw.includes(conceptWord) || conceptWord.includes(fw))) {
        matchCount += weight;
      }
    });
    
    // Calculate percentage
    return totalWeight > 0 ? (matchCount / totalWeight) * 100 : 0;
  }

  /**
   * ✅ Clean concept text for matching
   */
  cleanConceptText(text) {
    return text
      .toLowerCase()
      // ✅ CRITICAL: Remove markdown formatting first
      .replace(/\*\*/g, '')  // Remove bold markers
      .replace(/\*/g, '')    // Remove italic markers
      .replace(/\_\_/g, '')  // Remove underline markers
      .replace(/\_/g, '')    // Remove underscore markers
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')  // Remove links, keep text
      .replace(/`/g, '')     // Remove code markers
      // Remove action verbs at the start
      .replace(/^(describe|identify|explain|analyze|analyse|explore|distinguish|examine|state|define|illustrate|demonstrate|compare|contrast|evaluate|assess|investigate|determine|calculate|construct|create|design|develop|formulate|interpret|justify|outline|predict|propose|recall|recognize|relate|select|summarize|apply|arrange|categorize|classify|collect|combine|compose|discuss|establish|generalize|infer|measure|modify|organize|plan|prepare|prove|solve|test|verify)\s+/i, '')
      // Remove common filler words
      .replace(/\b(the|a|an|and|or|of|in|on|at|to|for|with|from|by|about|as|into|through|during|before|after|above|below|between|among|under|over|that|this|these|those)\b/g, '')
      // Remove extra spaces
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * ✅ Get all available images in a folder
   */
  /**
 * ✅ Get all available images in a folder - FIXED VERSION
 */
async getAvailableImages(gradeFolder, subjectFolder) {
  const cacheKey = `${gradeFolder}|${subjectFolder}`;
  
  // Check cache first
  if (this.imageCache.has(cacheKey)) {
    return this.imageCache.get(cacheKey);
  }
  
  const folderPath = path.join(this.imageBaseDir, gradeFolder, subjectFolder);
  
  try {
    // Check if folder exists
    await fs.access(folderPath);
  } catch {
    // Folder doesn't exist
    return [];
  }
  
  try {
    const files = await fs.readdir(folderPath);
    
    // Filter for image files
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg'];
    const images = files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return imageExtensions.includes(ext);
      })
      .map(filename => ({
        filename, // ✅ Original filename
        cleanName: this.cleanFilename(filename) // ✅ Cleaned for matching only
      }));
    
    // Cache the results
    this.imageCache.set(cacheKey, images);
    
    return images;
    
  } catch (error) {
    console.error(`[SmartImageLibrary] Error reading folder: ${error.message}`);
    return [];
  }
}

 /**
 * ✅ Clean filename for matching - FIXED VERSION
 */
cleanFilename(filename) {
  return filename
    .toLowerCase()
    // ✅ CRITICAL FIX: Remove ALL markdown formatting including **
    .replace(/\*\*/g, '')  // Remove bold markers
    .replace(/\*/g, '')    // Remove italic markers
    .replace(/\_\_/g, '')  // Remove underline markers
    .replace(/\_/g, '')    // Remove underscore markers
    // Remove extension
    .replace(/\.(jpg|jpeg|png|gif|svg)$/i, '')
    // Remove numbers at start (like "1-", "01-")
    .replace(/^\d+-/, '')
    // Remove action verbs
    .replace(/^(describe|identify|explain|analyze|analyse|explore|distinguish|examine|state|define|illustrate|demonstrate|compare|contrast|evaluate|assess|investigate|determine|calculate|construct|create|design|develop|formulate|interpret|justify|outline|predict|propose|recall|recognize|relate|select|summarize|apply|arrange|categorize|classify|collect|combine|compose|discuss|establish|generalize|infer|measure|modify|organize|plan|prepare|prove|solve|test|verify)-/, '')
    .trim();
}

  /**
   * ✅ Generate suggested filename from concept
   */
  generateFilenameFromConcept(conceptText) {
    return this.cleanConceptText(conceptText)
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 60) + '.jpg';
  }

  /**
   * ✅ Normalize grade for folder name
   */
  normalizeGrade(grade) {
    return grade
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/^pp-/, 'pp'); // PP 1 => pp1
  }

  /**
   * ✅ Normalize subject for folder name
   */
  normalizeSubject(subject) {
    const mappings = {
      'science': 'science',
      'integrated science': 'science',
      'mathematics': 'mathematics',
      'math': 'mathematics',
      'social studies': 'social-studies',
      'social': 'social-studies',
      'agriculture': 'agriculture',
      'home science': 'home-science',
      'nutrition': 'home-science',
      'ict': 'ict',
      'computer': 'ict',
      'english': 'english',
      'kiswahili': 'kiswahili',
      'swahili': 'kiswahili'
    };
    
    const subjectLower = subject.toLowerCase();
    
    for (const [key, value] of Object.entries(mappings)) {
      if (subjectLower.includes(key)) {
        return value;
      }
    }
    
    // Fallback: convert to kebab-case
    return subject.toLowerCase().replace(/\s+/g, '-');
  }

  /**
   * ✅ REMOVED: No longer reading as base64, using HTTP URLs instead
   */

  /**
 * ✅ Format image for markdown (using HTTP URL) - FIXED: Use original URLs
 */
formatImageForMarkdown(imageResult, figureNumber) {
  if (!imageResult.hasImage) {
    return '';
  }
  
  // ✅ FIXED: Use the ORIGINAL imageUrl that was already generated in findImagesForConcepts
  // DO NOT clean or modify the filename here!
  const cleanConcept = (imageResult.concept || '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/\_\_/g, '')
    .replace(/\_/g, '')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/`/g, '')
    .trim();
  
  // ✅ CRITICAL: Use the ORIGINAL imageUrl WITHOUT any cleaning
  const imageUrl = imageResult.imageUrl;
  
  return `

---

### Figure ${figureNumber}: ${cleanConcept}

![${cleanConcept}](${imageUrl})

**${imageResult.week}** - ${cleanConcept}

${imageResult.matchScore ? `*Auto-matched with ${imageResult.matchScore}% similarity*` : ''}

---

`;
}

  /**
   * ✅ Clear cache (use after adding new images)
   */
  clearCache() {
    this.imageCache.clear();
    console.log('[SmartImageLibrary] ✅ Cache cleared');
  }

  /**
   * ✅ List all images in a folder with their clean names
   */
  async listImagesInFolder(grade, subject) {
    const gradeFolder = this.normalizeGrade(grade);
    const subjectFolder = this.normalizeSubject(subject);
    
    const images = await this.getAvailableImages(gradeFolder, subjectFolder);
    
    return images.map(img => ({
      filename: img.filename,
      cleanName: img.cleanName,
      path: `diagrams/${gradeFolder}/${subjectFolder}/${img.filename}`,
      url: `${this.baseURL}/api/diagrams/${gradeFolder}/${subjectFolder}/${encodeURIComponent(img.filename)}`
    }));
  }

  /**
   * ✅ Test concept matching (for debugging)
   */
  async testMatch(conceptText, grade, subject) {
    const gradeFolder = this.normalizeGrade(grade);
    const subjectFolder = this.normalizeSubject(subject);
    
    const availableImages = await this.getAvailableImages(gradeFolder, subjectFolder);
    const match = this.findBestMatch(conceptText, availableImages);
    
    return {
      concept: conceptText,
      cleanedConcept: this.cleanConceptText(conceptText),
      match: match ? match.filename : 'No match found',
      score: match ? match.score : 0,
      threshold: 40,
      availableImages: availableImages.length,
      url: match ? `${this.baseURL}/api/diagrams/${gradeFolder}/${subjectFolder}/${encodeURIComponent(match.filename)}` : null
    };
  }
}

module.exports = SmartLocalImageLibrary;