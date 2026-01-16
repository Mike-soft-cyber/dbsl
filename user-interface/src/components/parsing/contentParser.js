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
        console.log('[ContentParser] âœ… Successfully parsed Lesson Concept table with', tableData.rows.length, 'rows');
        return { type: 'table', data: tableData };
      }
      console.warn('[ContentParser] âš ï¸ Failed to parse Lesson Concept table, falling back to markdown');
    }
    
    if (documentType === 'Schemes of Work') {
      const tableData = this.parseSchemesTable(content, cbcEntry);
      if (tableData && tableData.rows && tableData.rows.length > 0) {
        console.log('[ContentParser] âœ… Successfully parsed Schemes table with', tableData.rows.length, 'rows');
        return { type: 'table', data: tableData };
      }
      console.warn('[ContentParser] âš ï¸ Failed to parse Schemes table, falling back to markdown');
    }
    
    // Check for any table-like content
    const tableIndicators = (content.match(/\|.*\|/g) || []);
    if (tableIndicators.length > 3) {
      console.log('[ContentParser] Detected', tableIndicators.length, 'table rows, attempting generic parse');
      const tableData = this.parseGenericTable(content);
      if (tableData && tableData.rows && tableData.rows.length > 0) {
        console.log('[ContentParser] âœ… Successfully parsed generic table with', tableData.rows.length, 'rows');
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
    
    // Detect table header - MORE LENIENT
    if (!foundTableStart && line.includes('|')) {
      const lowerLine = line.toLowerCase();
      if ((lowerLine.includes('term') || lowerLine.includes('week')) && 
          (lowerLine.includes('learning concept') || lowerLine.includes('strand'))) {
        foundTableStart = true;
        console.log('[Parser] Found table header at line', i);
        continue;
      }
    }
    
    if (!foundTableStart) continue;
    
    // Skip separator rows
    if (line.match(/^[\|\-\s:]+$/)) {
      continue;
    }
    
    // Process data rows
    if (line.includes('|')) {
      const cells = line
        .split('|')
        .map(cell => cell.trim())
        .filter(cell => cell !== '');
      
      console.log('[Parser] Row', rowNumber, '- Raw cells:', cells.length, '-', cells.map(c => c.substring(0, 15)));
      
      // âœ… FIX: Accept 4 or 5 columns
      if (cells.length >= 4 && cells.length <= 5) {
        let term, week, strand, substrand, concept;
        
        if (cells.length === 5) {
          // Standard format
          [term, week, strand, substrand, concept] = cells;
        } else if (cells.length === 4) {
          // Missing term column
          [week, strand, substrand, concept] = cells;
          term = 'Term 1'; // Default
        }
        
        // Validate data
        const isValidWeek = week && (week.toLowerCase().includes('week') || /week\s*\d+/i.test(week));
        const isValidConcept = concept && concept.length > 10 && 
                              !concept.toLowerCase().includes('learning concept') &&
                              !concept.toLowerCase().includes('please regenerate') &&
                              !concept.toLowerCase().includes('fallback');
        
        if (isValidWeek && isValidConcept) {
          // Ensure we have 5 columns
          const row = [term || 'Term 1', week, strand || '', substrand || '', concept];
          tableData.rows.push(row);
          console.log('[Parser] âœ… Added row', rowNumber, '- Week:', week);
          rowNumber++;
        } else {
          console.log('[Parser] âš ï¸ Invalid row - Week valid?', isValidWeek, '| Concept valid?', isValidConcept);
        }
      } else {
        console.log('[Parser] âŒ Wrong column count:', cells.length, '(need 4-5)');
      }
    }
    
    // Safety limit
    if (tableData.rows.length >= 100) {
      console.log('[Parser] âš ï¸ Reached 100 row limit, stopping');
      break;
    }
  }
  
  console.log('[Parser] Final: Extracted', tableData.rows.length, 'valid rows');
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
    
    console.log('[Parser] Processing Schemes table - Total lines:', lines.length);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Detect table start
      if (!foundTableStart && this.isSchemeHeaderLine(line)) {
        foundTableStart = true;
        console.log('[Parser] âœ… Found schemes table header at line', i);
        continue;
      }
      
      if (!foundTableStart) continue;
      
      // Skip separator rows
      if (line.match(/^\|[\s\-:]+\|$/)) {
        continue;
      }
      
      // Process data rows
      if (line.includes('|')) {
        // Split and clean cells
        const cells = line
          .split('|')
          .map(cell => cell.trim());
        
        // Remove empty cells at start/end only
        if (cells[0] === '') cells.shift();
        if (cells[cells.length - 1] === '') cells.pop();
        
        console.log('[Parser] Row cells:', cells.length, '- First:', cells[0]?.substring(0, 15));
        
        // âœ… STRICT: Only accept rows with exactly 10 columns
        if (cells.length === 10) {
          const week = cells[0];
          const lesson = cells[1];
          const slo = cells[4];
          const reflection = cells[9];
          
          // Validate it's a real data row
          const isValidRow = 
            week && (week.toLowerCase().includes('week') || /^w?\d+$/i.test(week)) &&
            lesson && (lesson.toLowerCase().includes('lesson') || /^\d+$/.test(lesson)) &&
            slo && slo.length > 15 &&
            reflection && reflection.length > 10 &&
            !slo.includes('SPECIFIC LEARNING OUTCOMES') &&
            !reflection.toUpperCase().includes('REFLECTION');
          
          if (isValidRow) {
            tableData.rows.push(cells);
            console.log('[Parser] âœ… Added row with WEEK:', week, 'REFLECTION:', reflection.substring(0, 30));
          } else {
            console.log('[Parser] âš ï¸ Invalid row - Week:', week, 'Lesson:', lesson, 'Has reflection:', !!reflection);
          }
        } else {
          console.log('[Parser] âŒ Wrong column count:', cells.length, '(need exactly 10)');
          
          // Log what's missing
          if (cells.length < 10) {
            console.log('[Parser] Missing columns:', 10 - cells.length);
            console.log('[Parser] Cells:', cells.map((c, i) => `${i}:${c.substring(0, 20)}`).join(' | '));
          }
        }
      }
    }
    
    console.log('[Parser] Final: Extracted', tableData.rows.length, 'valid rows with 10 columns');
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
      console.log('[Parser] âœ… Generic table parsed:', dataRows.length, 'rows');
      return {
        headers: headerRow,
        rows: dataRows
      };
    }
    
    console.warn('[Parser] âŒ Generic table parse failed - Header:', !!headerRow, 'Rows:', dataRows.length);
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
    // More precise header detection
    const requiredHeaders = ['WEEK', 'LESSON', 'STRAND', 'SUB-STRAND', 'SPECIFIC LEARNING OUTCOMES'];
    const lineUpper = line.toUpperCase();
    
    const matchCount = requiredHeaders.filter(header => 
      lineUpper.includes(header)
    ).length;
    
    return matchCount >= 4 && line.includes('|');
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