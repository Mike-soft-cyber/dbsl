// CBCContentEnhancer.js - Legal web research for CBC content

const axios = require('axios');

class CBCContentEnhancer {
  /**
   * ✅ LEGAL: Use web search to find relevant CBC resources
   * Instead of scraping Scribd, we search for official KICD content
   */
  static async enhanceWithWebResearch(learningConcepts, grade, subject, substrand) {
    try {
      console.log(`[CBCEnhancer] Researching content for ${grade} ${subject} - ${substrand}`);
      
      const enhancedConcepts = [];
      
      for (const concept of learningConcepts.slice(0, 3)) { // Limit to avoid rate limits
        const searchQuery = `${grade} ${subject} ${concept.concept} Kenya CBC KICD`;
        
        console.log(`[CBCEnhancer] Searching: ${searchQuery}`);
        
        // Use DuckDuckGo API (free, no API key needed)
        const searchResults = await this.searchWeb(searchQuery);
        
        const enhancedConcept = {
          ...concept,
          webResources: searchResults.slice(0, 3), // Top 3 results
          suggestedContent: this.extractContentSuggestions(searchResults)
        };
        
        enhancedConcepts.push(enhancedConcept);
        
        // Rate limit: wait 2 seconds between requests
        await this.sleep(2000);
      }
      
      return enhancedConcepts;
      
    } catch (error) {
      console.error('[CBCEnhancer] Research failed:', error.message);
      return learningConcepts; // Return original if research fails
    }
  }

  /**
   * Search web using DuckDuckGo (no API key required)
   */
  static async searchWeb(query) {
    try {
      // DuckDuckGo Instant Answer API
      const response = await axios.get('https://api.duckduckgo.com/', {
        params: {
          q: query,
          format: 'json',
          no_html: 1,
          skip_disambig: 1
        },
        timeout: 10000
      });
      
      const results = [];
      
      // Extract relevant results
      if (response.data.RelatedTopics) {
        for (const topic of response.data.RelatedTopics) {
          if (topic.FirstURL && topic.Text) {
            results.push({
              title: topic.Text.substring(0, 100),
              url: topic.FirstURL,
              snippet: topic.Text
            });
          }
        }
      }
      
      return results;
      
    } catch (error) {
      console.error('[CBCEnhancer] Search failed:', error.message);
      return [];
    }
  }

  /**
   * Extract content suggestions from search results
   */
  static extractContentSuggestions(searchResults) {
    const suggestions = [];
    
    for (const result of searchResults) {
      // Look for PDF links (likely lesson plans or notes)
      if (result.url.includes('.pdf')) {
        suggestions.push({
          type: 'PDF Resource',
          source: this.extractDomain(result.url),
          title: result.title
        });
      }
      
      // Look for KICD official content
      if (result.url.includes('kicd.ac.ke')) {
        suggestions.push({
          type: 'Official KICD Resource',
          source: 'KICD',
          title: result.title,
          priority: 'high'
        });
      }
      
      // Look for teacher resource sites
      if (result.url.includes('teacher') || result.url.includes('education')) {
        suggestions.push({
          type: 'Educational Resource',
          source: this.extractDomain(result.url),
          title: result.title
        });
      }
    }
    
    return suggestions;
  }

  /**
   * Extract domain from URL
   */
  static extractDomain(url) {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return 'Unknown';
    }
  }

  /**
   * ✅ ALTERNATIVE: Enhance AI prompt with web-researched context
   */
  static buildEnhancedPromptWithWebContext(basePrompt, webResources) {
    if (!webResources || webResources.length === 0) {
      return basePrompt;
    }

    const contextSection = `

📚 ADDITIONAL CONTEXT FROM KENYAN CBC RESOURCES:

${webResources.map((resource, i) => `
${i + 1}. **${resource.concept.concept}**
   - Week: ${resource.concept.week}
   - Web Resources Found:
${resource.webResources.map(r => `     • ${r.title} (${this.extractDomain(r.url)})`).join('\n')}
   - Suggested Teaching Approaches:
${resource.suggestedContent.map(s => `     • ${s.type}: ${s.title}`).join('\n')}
`).join('\n')}

Use these resources as inspiration for authentic Kenyan CBC content, but generate original material.

---
`;

    return basePrompt + contextSection;
  }

  /**
   * Helper: Sleep function
   */
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * ✅ RECOMMENDED: Use official KICD API if available
   * This is the LEGAL and PROPER way to access CBC content
   */
  static async fetchOfficialKICDContent(grade, subject, strand, substrand) {
    try {
      // TODO: Replace with actual KICD API endpoint when available
      const kicdApiUrl = 'https://api.kicd.ac.ke/curriculum'; // Hypothetical
      
      const response = await axios.get(kicdApiUrl, {
        params: {
          grade,
          subject,
          strand,
          substrand
        },
        headers: {
          'Authorization': `Bearer ${process.env.KICD_API_KEY}` // If they provide API keys
        },
        timeout: 10000
      });
      
      return response.data;
      
    } catch (error) {
      console.warn('[CBCEnhancer] KICD API not available:', error.message);
      return null;
    }
  }
}

module.exports = CBCContentEnhancer;