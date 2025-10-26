// Unified ContentParser for both frontend and backend
class ContentParser {
  static parse(content, documentType, cbcEntry = null) {
    if (!content) {
      console.warn('[ContentParser] No content provided');
      return { type: 'empty', data: null };
    }
    
    console.log('[ContentParser] Parsing', documentType, '- Content length:', content.length);
    
    // Force table parsing for these document types
    if (documentType === 'Lesson Concept Breakdown') {
      const tableData = this.parseLessonConceptTable(content);
      if (tableData && tableData.rows && tableData.rows.length > 0) {
        console.log('[ContentParser] ✅ Successfully parsed Lesson Concept table with', tableData.rows.length, 'rows');
        return { type: 'table', data: tableData };
      }
      console.warn('[ContentParser] ⚠️ Failed to parse Lesson Concept table, falling back to markdown');
    }
    
    if (documentType === 'Schemes of Work') {
      const tableData = this.parseSchemesTable(content, cbcEntry);
      if (tableData && tableData.rows && tableData.rows.length > 0) {
        console.log('[ContentParser] ✅ Successfully parsed Schemes table with', tableData.rows.length, 'rows');
        return { type: 'table', data: tableData };
      }
      console.warn('[ContentParser] ⚠️ Failed to parse Schemes table, falling back to markdown');
    }
    
    // Check for any table-like content
    const tableIndicators = (content.match(/\|.*\|/g) || []);
    if (tableIndicators.length > 3) {
      console.log('[ContentParser] Detected', tableIndicators.length, 'table rows, attempting generic parse');
      const tableData = this.parseGenericTable(content);
      if (tableData && tableData.rows && tableData.rows.length > 0) {
        console.log('[ContentParser] ✅ Successfully parsed generic table with', tableData.rows.length, 'rows');
        return { type: 'table', data: tableData };
      }
    }
    
    // Default to markdown rendering
    console.log('[ContentParser] Using markdown rendering');
    return { type: 'markdown', data: content };
  }

  static parseLessonConceptTable(content) {
  const tableData = {
    headers: ['Term', 'Week', 'Strand', 'Sub-strand', 'Learning Concept'],
    rows: []
  };
  
  if (!content) return null;
  
  const lines = content.split('\n').map(line => line.trim()).filter(line => line);
  let foundTableStart = false;
  let rowNumber = 0;
  
  console.log('[Parser] Processing', lines.length, 'lines for Lesson Concept table');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // More lenient table header detection
    if (!foundTableStart && (
      line.includes('Term') && line.includes('Week') && line.includes('Learning Concept') &&
      line.includes('|')
    )) {
      foundTableStart = true;
      console.log('[Parser] Found table header at line', i);
      continue;
    }
    
    if (!foundTableStart) continue;
    
    // Skip separator rows
    if (line.match(/^[\|\-\s]+$/)) {
      continue;
    }
    
    // Process data rows
    if (line.includes('|')) {
      const cells = line
        .split('|')
        .map(cell => cell.trim())
        .filter(cell => cell !== '');
      
      console.log('[Parser] Row', rowNumber, '- Cells:', cells.length);
      
      // Accept rows with exactly 5 columns (Term, Week, Strand, Sub-strand, Learning Concept)
      if (cells.length === 5) {
        // Validate that we have reasonable content
        const [term, week, strand, substrand, concept] = cells;
        
        if (concept && concept.length > 10 && !concept.includes('please regenerate')) {
          tableData.rows.push(cells);
          console.log('[Parser] ✅ Added row', rowNumber);
          rowNumber++;
        }
      }
    }
    
    // Stop if we've found a reasonable number of rows
    if (tableData.rows.length >= 60) {
      break;
    }
  }
  
  console.log('[Parser] Final: Extracted', tableData.rows.length, 'valid rows from Lesson Concept table');
  return tableData.rows.length > 0 ? tableData : null;
}

  static parseSchemesTable(content, cbcEntry) {
    const tableData = {
      headers: [
        'WEEK', 'LESSON', 'STRAND', 'SUB-STRAND', 
        'SPECIFIC LEARNING OUTCOMES (SLO)', 'LEARNING EXPERIENCES', 
        'KEY INQUIRY QUESTION (KIQ)', 'LEARNING RESOURCES', 
        'ASSESSMENT', 'REFLECTION'
      ],
      rows: []
    };

    if (!content) return null;
    
    const lines = content.split('\n').filter(line => line.trim());
    let foundTableStart = false;
    
    console.log('[Parser] Processing', lines.length, 'lines for Schemes table');
    console.log('[Parser] First 10 lines:', lines.slice(0, 10));
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Log every line that contains a pipe
      if (line.includes('|')) {
        console.log(`[Parser] Line ${i}:`, line.substring(0, 100), '...');
      }
      
      // Detect table start
      if (!foundTableStart && this.isSchemeHeaderLine(line)) {
        foundTableStart = true;
        console.log('[Parser] Found schemes table header at line', i);
        continue;
      }
      
      // Skip until we find table
      if (!foundTableStart) continue;
      
      // Skip separator rows
      if (line.match(/^\|[\s\-:]+\|/)) {
        console.log('[Parser] Skipping separator row');
        continue;
      }
      
      if (line.includes('|')) {
        const cells = line
          .split('|')
          .map(cell => cell.trim())
          .filter(cell => cell !== '');
        
        console.log('[Parser] Schemes row - Cells:', cells.length, '- Week:', cells[0]?.substring(0, 10));
        
        // FIXED: Accept rows with 8+ columns (more lenient)
        if (cells.length >= 8) {
          const week = cells[0];
          const slo = cells[4] || cells[3]; // Try column 4 or 3
          
          // FIXED: More lenient validation
          if (this.isValidSchemeRow(week, slo)) {
            // Pad with empty strings if needed
            while (cells.length < 10) cells.push('');
            tableData.rows.push(cells.slice(0, 10));
            console.log('[Parser] ✅ Added schemes row');
          } else {
            console.log('[Parser] ❌ Invalid scheme row - Week:', week, 'SLO length:', slo?.length);
          }
        } else {
          console.log('[Parser] ❌ Insufficient columns for schemes:', cells.length);
        }
      }
    }
    
    console.log('[Parser] Final: Extracted', tableData.rows.length, 'valid rows from Schemes table');
    return tableData.rows.length > 0 ? tableData : null;
  }

  static parseGenericTable(content) {
    if (!content) return null;

    const lines = content.split(/\r?\n/).filter(line => line.trim());
    let headerRow = null;
    let dataRows = [];
    let foundTable = false;
    
    console.log('[Parser] Attempting generic table parse');
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.includes('|')) {
        let cells = trimmed
          .split('|')
          .map(cell => cell.trim())
          .filter(cell => cell !== '');
        
        // Skip separator rows
        if (cells.every(cell => /^[-:\s]*$/.test(cell))) {
          foundTable = true;
          continue;
        }
        
        // Skip metadata lines
        if (this.isMetadataLine(trimmed)) {
          continue;
        }
        
        if (!headerRow && cells.length > 2) {
          headerRow = cells;
          console.log('[Parser] Found header with', cells.length, 'columns:', headerRow);
          foundTable = true;
        } else if (foundTable && headerRow && cells.length >= 3) {
          // Pad or trim to match header
          while (cells.length < headerRow.length) cells.push('');
          if (cells.length > headerRow.length) cells = cells.slice(0, headerRow.length);
          
          // FIXED: Accept rows with any content length > 5
          if (cells.some(cell => cell.length > 5)) {
            dataRows.push(cells);
          }
        }
      }
    }
    
    if (headerRow && dataRows.length > 0) {
      console.log('[Parser] ✅ Generic table parsed:', dataRows.length, 'rows');
      return {
        headers: headerRow,
        rows: dataRows
      };
    }
    
    console.warn('[Parser] ❌ Generic table parse failed - Header:', !!headerRow, 'Rows:', dataRows.length);
    return null;
  }

  // Helper methods
  static isMetadataLine(line) {
    // FIXED: More specific patterns to avoid false positives
    const metadataPatterns = [
      /^SCHOOL:\s/i,
      /^FACILITATOR:\s/i,
      /^GRADE:\s/i,
      /^SUBJECT:\s/i,
      /^TERM:\s/i,
      /^WEEKS:\s/i,
      /^TOTAL LESSONS:\s/i,
      /^CBC REFERENCE:\s/i
    ];
    return metadataPatterns.some(pattern => pattern.test(line));
  }

  static isTableHeaderLine(line) {
  const lessonConceptHeaders = ['Term', 'Week', 'Strand', 'Sub-strand', 'Learning Concept'];
  const schemeHeaders = ['WEEK', 'LESSON', 'STRAND', 'SUB-STRAND', 'SPECIFIC LEARNING OUTCOMES', 'LEARNING EXPERIENCES', 'KEY INQUIRY QUESTION', 'LEARNING RESOURCES', 'ASSESSMENT', 'REFLECTION'];
  
  // Check for lesson concept table
  const lcMatchCount = lessonConceptHeaders.filter(header => 
    line.toLowerCase().includes(header.toLowerCase())
  ).length;
  
  // Check for schemes table
  const schemeMatchCount = schemeHeaders.filter(header =>
    line.toLowerCase().includes(header.toLowerCase())
  ).length;
  
  return (lcMatchCount >= 3 || schemeMatchCount >= 5) && line.includes('|');
}

static isSchemeHeaderLine(line) {
  const schemeHeaders = ['WEEK', 'LESSON', 'STRAND', 'SUB-STRAND'];
  const matchCount = schemeHeaders.filter(header => 
    line.toUpperCase().includes(header)
  ).length;
  return matchCount >= 2 && line.includes('|');
}

  static isValidLearningConcept(concept) {
  if (!concept) return false;
  
  const invalidPatterns = [
    /^learning concept$/i,
    /^Term\s*\|/i,
    /^[\s\-|]+$/,
    /^STRAND$/i,
    /^SUB-STRAND$/i,
    /^please regenerate/i,
    /^fallback document/i
  ];
  
  // More lenient validation for fallback content
  return concept.length > 5 && 
         !invalidPatterns.some(pattern => pattern.test(concept));
}

static isValidSchemeRow(week, slo) {
  if (!week || !slo) return false;
  
  // More flexible validation
  const validWeek = /week/i.test(week) || 
                    /^\d+$/.test(week) || 
                    /^W\d+/i.test(week) ||
                    /^\d+$/.test(week.toString().replace('W', ''));
  
  const validSLO = slo.length > 10 && 
                   !slo.includes('SPECIFIC LEARNING OUTCOMES') &&
                   !slo.includes('SLO') &&
                   !slo.includes('please regenerate');
  
  return validWeek && validSLO;
}

  static isValidSchemeRow(week, slo) {
    if (!week || !slo) return false;
    
    // FIXED: More flexible week validation
    const validWeek = /week/i.test(week) || 
                      /^\d+$/.test(week) || 
                      /^W\d+/i.test(week);
    
    // FIXED: Reduced SLO length requirement
    const validSLO = slo.length > 15 && 
                     !slo.includes('SPECIFIC LEARNING OUTCOMES') &&
                     !slo.includes('SLO');
    
    return validWeek && validSLO;
  }
}

// Export for both CommonJS (backend) and ES6 (frontend)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ContentParser;
}

export default ContentParser;