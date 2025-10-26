// Enhanced content post-processing function
const postProcessGeneratedContent = (content, documentType) => {
  let processed = content;

  // Fix table concatenation issues
  if (documentType === "Lesson Concept Breakdown" || documentType === "Schemes of Work") {
    // Fix concatenated table rows
    const concatenatedRowPattern = /(\|\s*[^|\n]*\|\s*[^|\n]*\|\s*[^|\n]*\|\s*[^|\n]*\|\s*[^|\n]*\s*\|)(\s*\|\s*[^|\n]*)/g;
    processed = processed.replace(concatenatedRowPattern, '$1\n$2');
    
    // Ensure proper row separation
    processed = processed.replace(/(\|[^|\n]*\|)([^|\n]*\|[^|\n]*\|)/g, '$1\n|$2');
  }

  // Clean up AI explanations
  processed = processed.replace(/^(Here's|I've created|This is|Below is).*$/gm, '');
  processed = processed.replace(/^Note:.*$/gm, '');
  
  // Ensure proper spacing
  processed = processed.replace(/\n{4,}/g, '\n\n\n');
  processed = processed.trim();
  
  return processed;
};

const parseClientLessonConceptBreakdown = (content) => {
  const tableData = {
    headers: ['Number', 'Term', 'Week', 'Strand', 'Sub-strand', 'Learning Concept'],
    rows: []
  };
  
  if (!content) return null;
  
  // Clean the content
  let cleanContent = content.replace(/```[\s\S]*?```/g, '');
  
  // Look for the client's 5-column format: Term, Week, Strand, Sub-strand, Learning Concept
  const lines = cleanContent.split('\n');
  let foundHeader = false;
  let rowNumber = 1;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Find header row
    if (trimmed.includes('Term') && trimmed.includes('Week') && trimmed.includes('Learning Concept')) {
      foundHeader = true;
      continue;
    }
    
    // Skip separator row
    if (trimmed.match(/^\|[\s\-\|]*\|$/)) continue;
    
    // Process data rows after header
    if (foundHeader && trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed
        .slice(1, -1) // Remove outer pipes
        .split('|')
        .map(cell => cell.trim());
      
      // Client format has 5 columns: Term, Week, Strand, Sub-strand, Learning Concept
      if (cells.length >= 5) {
        // Add row number as first column to match display format
        const formattedRow = [
          rowNumber.toString(),
          cells[0], // Term
          cells[1], // Week
          cells[2], // Strand
          cells[3], // Sub-strand
          cells[4]  // Learning Concept
        ];
        
        // Only add if learning concept is meaningful and AI-generated
        if (formattedRow[5] && formattedRow[5].length > 10 && 
            !formattedRow[5].includes('Term') && 
            !formattedRow[5].includes('Week') &&
            !formattedRow[5].includes('MEASUREMENTS')) {
          tableData.rows.push(formattedRow);
          rowNumber++;
        }
      }
    }
  }
  
  // Return null if no valid AI-generated content found
  return tableData.rows.length > 0 ? tableData : null;
};

const parseClientSchemesOfWork = (content, cbcEntry) => {
  const tableData = {
    headers: ['WEEK', 'LESSON', 'STRAND', 'SUB-STRAND', 'SPECIFIC LEARNING OUTCOMES (SLO)', 
              'LEARNING EXPERIENCES', 'KEY INQUIRY QUESTION (KIQ)', 
              'LEARNING RESOURCES', 'ASSESSMENT', 'REFLECTION'],
    rows: []
  };

  if (!content) return null;
  
  // Clean the content
  let cleanContent = content.replace(/```[\s\S]*?```/g, '');
  cleanContent = cleanContent.replace(/^SCHOOL:.*$/gm, '');
  cleanContent = cleanContent.replace(/^FACILITATOR:.*$/gm, '');
  
  const lines = cleanContent.split('\n').filter(line => line.trim());
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip header and separator rows
    if (trimmed.match(/^\|[\s-]+\|/)) continue;
    if (trimmed.match(/^\|\s*WEEK\s*\|/i)) continue;
    
    // Process data rows
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed
        .slice(1, -1)
        .split('|')
        .map(cell => cell.trim());
      
      // Client format requires exactly 10 columns
      if (cells.length >= 10) {
        const cleanedCells = cells.slice(0, 10);
        
        // Only add if content is meaningful and AI-generated
        if (cleanedCells[0] && cleanedCells[1] && 
            !cleanedCells.join('').includes('SCHOOL:') &&
            cleanedCells[4] && cleanedCells[4].length > 20 &&
            !cleanedCells[4].includes('Learners will be able to...')) {
          tableData.rows.push(cleanedCells);
        }
      }
    }
  }
  
  // Return null if no valid AI-generated content found
  return tableData.rows.length > 0 ? tableData : null;
};

// Content preprocessing
const preprocessContent = (content) => {
  if (!content) return content;
  
  // Handle the specific format from markdown code blocks
  let processed = content;
  
  // Extract content from markdown code blocks if present
  const codeBlockMatch = content.match(/```markdown\s*([\s\S]*?)```/);
  if (codeBlockMatch && codeBlockMatch[1]) {
    processed = codeBlockMatch[1].trim();
  }
  
  // Ensure proper table formatting
  processed = processed.replace(/\|\s*\/\s*\/\s*\|/g, '| | |'); // Clean empty cells
  processed = processed.replace(/\|\s*-\s*\|\s*-\s*\|\s*-\s*\|\s*-\s*\|\s*-\s*\|/g, ''); // Remove separator rows
  
  return processed;
};

// Enhanced document structure detection
const detectDocumentStructure = (content) => {
  if (!content) return { isTableFormat: false };
  
  const hasLearningConceptHeader = /learning\s+concept/i.test(content);
  const hasTermWeekStructure = /term.*week.*strand.*sub-strand/i.test(content);
  const hasVolumeCapacityContent = /volume.*capacity|capacity.*volume/i.test(content);
  
  return {
    isTableFormat: true, // Force table detection for this content
    isLessonConcept: hasLearningConceptHeader || hasTermWeekStructure,
    isSchemeOfWork: false,
    hasVolumeCapacity: hasVolumeCapacityContent
  };
};

function expandSLOs(sloString, sloArray) {
  if (!sloArray?.length) return sloString;

  return sloString.replace(/SLO:\s*([0-9,\s]+)/gi, (match, numbers) => {
    const expanded = numbers
      .split(",")
      .map((num) => {
        const index = parseInt(num.trim(), 10) - 1;
        return sloArray[index] || `SLO ${num.trim()}`;
      })
      .join("; ");
    return "SLO: " + expanded;
  });
}

module.exports = {
  postProcessGeneratedContent,
  parseClientLessonConceptBreakdown,
  parseClientSchemesOfWork,
  expandSLOs,
  preprocessContent,
  detectDocumentStructure
};