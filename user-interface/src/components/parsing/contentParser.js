class ContentParser {
  static parse(content, documentType, cbcEntry = null) {
    if (!content) {
      console.warn('[ContentParser] No content provided');
      return { type: 'empty', data: null };
    }
    
    console.log('[ContentParser] Parsing', documentType, '- Content length:', content.length);
    
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
    
    const tableIndicators = (content.match(/\|.*\|/g) || []);
    if (tableIndicators.length > 3) {
      console.log('[ContentParser] Detected', tableIndicators.length, 'table rows, attempting generic parse');
      const tableData = this.parseGenericTable(content);
      if (tableData && tableData.rows && tableData.rows.length > 0) {
        console.log('[ContentParser] âœ… Successfully parsed generic table with', tableData.rows.length, 'rows');
        return { type: 'table', data: tableData };
      }
    }
    
    console.log('[ContentParser] Using markdown rendering');
    return { type: 'markdown', data: content };
  }

  static parseLessonConceptTable(content) {
  const tableData = {
    headers: ['Term', 'Week', 'Strand', 'Sub-strand', 'Learning Concept'], // Keep Term
    rows: []
  };
  
  if (!content) return null;
  
  const lines = content.split('\n').map(line => line.trim()).filter(line => line);
  let foundTableStart = false;
  let rowNumber = 0;
  
  console.log('[Parser] Processing', lines.length, 'lines for Lesson Concept table');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
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
        .map(c => c.trim())
        .filter(c => c !== '');
      
      console.log('[Parser] Row', rowNumber, '- Raw cells:', cells.length, '-', cells.map(c => c.substring(0, 15)));
      
      // CHANGED: Accept 5 columns for [Term, Week, Strand, Sub-strand, Learning Concept]
      if (cells.length >= 4 && cells.length <= 6) {
        let term, week, strand, substrand, concept;
        
        if (cells.length === 5) {
          // Perfect: [Term, Week, Strand, Sub-strand, Learning Concept]
          [term, week, strand, substrand, concept] = cells;
        } else if (cells.length === 6) {
          // Extra column (possibly empty first cell from |)
          [, term, week, strand, substrand, concept] = cells;
        } else if (cells.length === 4) {
          // Missing term: [Week, Strand, Sub-strand, Learning Concept]
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
          const row = [term || 'Term 1', week, strand || '', substrand || '', concept];
          tableData.rows.push(row);
          console.log('[Parser] ✅ Added row', rowNumber, '- Term:', term, 'Week:', week);
          rowNumber++;
        } else {
          console.log('[Parser] ⚠️ Invalid row - Week valid?', isValidWeek, '| Concept valid?', isValidConcept);
        }
      } else {
        console.log('[Parser] ❌ Wrong column count:', cells.length, '(need 4-6)');
      }
    }
    
    if (tableData.rows.length >= 100) {
      console.log('[Parser] ⚠️ Reached 100 row limit, stopping');
      break;
    }
  }
  
  console.log('[Parser] Final: Extracted', tableData.rows.length, 'valid rows with Term column');
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
      
      if (!foundTableStart && this.isSchemeHeaderLine(line)) {
        foundTableStart = true;
        console.log('[Parser] âœ… Found schemes table header at line', i);
        continue;
      }
      
      if (!foundTableStart) continue;
      
      if (line.match(/^\|[\s\-:]+\|$/)) {
        continue;
      }

      if (line.includes('|')) {
        const cells = line
          .split('|')
          .map(cell => cell.trim());

        if (cells[0] === '') cells.shift();
        if (cells[cells.length - 1] === '') cells.pop();
        
        console.log('[Parser] Row cells:', cells.length, '- First:', cells[0]?.substring(0, 15));

        if (cells.length === 10) {
          const week = cells[0];
          const lesson = cells[1];
          const slo = cells[4];
          const reflection = cells[9];
          
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
        
        if (this.isMetadataLine(trimmed)) {
          continue;
        }
        
        if (!headerRow && cells.length > 2) {
          headerRow = cells;
          console.log('[Parser] Found header with', cells.length, 'columns:', headerRow);
          foundTable = true;
        } else if (foundTable && headerRow && cells.length >= 3) {
          while (cells.length < headerRow.length) cells.push('');
          if (cells.length > headerRow.length) cells = cells.slice(0, headerRow.length);

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
 
  const lcMatchCount = lessonConceptHeaders.filter(header => 
    line.toLowerCase().includes(header.toLowerCase())
  ).length;

  const schemeMatchCount = schemeHeaders.filter(header =>
    line.toLowerCase().includes(header.toLowerCase())
  ).length;
  
  return (lcMatchCount >= 3 || schemeMatchCount >= 5) && line.includes('|');
}

 static isSchemeHeaderLine(line) {
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
  
  return concept.length > 5 && 
         !invalidPatterns.some(pattern => pattern.test(concept));
}

static isValidSchemeRow(week, slo) {
  if (!week || !slo) return false;
  
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
    
    const validWeek = /week/i.test(week) || 
                      /^\d+$/.test(week) || 
                      /^W\d+/i.test(week);
    
    const validSLO = slo.length > 15 && 
                     !slo.includes('SPECIFIC LEARNING OUTCOMES') &&
                     !slo.includes('SLO');
    
    return validWeek && validSLO;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ContentParser;
}

export default ContentParser;