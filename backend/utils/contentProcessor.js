
function postProcessGeneratedContent(content, documentType) {
  if (!content) return '';
  
  console.log(`[ContentProcessor] Processing ${documentType}`);
  console.log(`[ContentProcessor] Input length: ${content.length} chars`);
  
  let processed = content;
  
  
  if (documentType === 'Lesson Concept Breakdown' || documentType === 'Schemes of Work') {
    processed = cleanupTableCells(processed);
  }
  
  
  processed = processed.replace(/```markdown\n?/g, '');
  processed = processed.replace(/```\n?/g, '');
  processed = processed.trim();
  
  console.log(`[ContentProcessor] Output length: ${processed.length} chars`);
  
  return processed;
}

function cleanupTableCells(content) {
  const lines = content.split('\n');
  const cleanedLines = [];
  let inTable = false;
  let currentRow = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    
    if (line.includes('|') && (line.includes('Term') || line.includes('WEEK'))) {
      inTable = true;
      cleanedLines.push(line);
      continue;
    }
    
    
    if (line.match(/^\|[\s\-:]+\|$/)) {
      cleanedLines.push(line);
      continue;
    }
    
    
    if (inTable && line.includes('|')) {
      const pipeCount = (line.match(/\|/g) || []).length;
      
      
      if (pipeCount >= 5) { 
        if (currentRow) {
          cleanedLines.push(currentRow);
          currentRow = '';
        }
        cleanedLines.push(line);
      } else {
        
        currentRow += (currentRow ? ' ' : '') + line;
      }
    } else if (inTable && !line.includes('|') && line.length > 0) {
      
      currentRow += ' ' + line;
    } else {
      
      if (currentRow) {
        cleanedLines.push(currentRow);
        currentRow = '';
      }
      cleanedLines.push(line);
      if (!line.includes('|')) {
        inTable = false;
      }
    }
  }
  
  
  if (currentRow) {
    cleanedLines.push(currentRow);
  }
  
  return cleanedLines.join('\n');
}

const parseClientLessonConceptBreakdown = (content) => {
  const tableData = {
    headers: ['Number', 'Term', 'Week', 'Strand', 'Sub-strand', 'Learning Concept'],
    rows: []
  };
  
  if (!content) return null;
  
  
  let cleanContent = content.replace(/```[\s\S]*?```/g, '');
  
  
  const lines = cleanContent.split('\n');
  let foundHeader = false;
  let rowNumber = 1;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    
    if (trimmed.includes('Term') && trimmed.includes('Week') && trimmed.includes('Learning Concept')) {
      foundHeader = true;
      continue;
    }
    
    
    if (trimmed.match(/^\|[\s\-\|]*\|$/)) continue;
    
    
    if (foundHeader && trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed
        .slice(1, -1) 
        .split('|')
        .map(cell => cell.trim());
      
      
      if (cells.length >= 5) {
        
        const formattedRow = [
          rowNumber.toString(),
          cells[0], 
          cells[1], 
          cells[2], 
          cells[3], 
          cells[4]  
        ];
        
        
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
  
  
  let cleanContent = content.replace(/```[\s\S]*?```/g, '');
  cleanContent = cleanContent.replace(/^SCHOOL:.*$/gm, '');
  cleanContent = cleanContent.replace(/^FACILITATOR:.*$/gm, '');
  
  const lines = cleanContent.split('\n').filter(line => line.trim());
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    
    if (trimmed.match(/^\|[\s-]+\|/)) continue;
    if (trimmed.match(/^\|\s*WEEK\s*\|/i)) continue;
    
    
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed
        .slice(1, -1)
        .split('|')
        .map(cell => cell.trim());
      
      
      if (cells.length >= 10) {
        const cleanedCells = cells.slice(0, 10);
        
        
        if (cleanedCells[0] && cleanedCells[1] && 
            !cleanedCells.join('').includes('SCHOOL:') &&
            cleanedCells[4] && cleanedCells[4].length > 20 &&
            !cleanedCells[4].includes('Learners will be able to...')) {
          tableData.rows.push(cleanedCells);
        }
      }
    }
  }
  
  
  return tableData.rows.length > 0 ? tableData : null;
};


const preprocessContent = (content) => {
  if (!content) return content;
  
  
  let processed = content;
  
  
  const codeBlockMatch = content.match(/```markdown\s*([\s\S]*?)```/);
  if (codeBlockMatch && codeBlockMatch[1]) {
    processed = codeBlockMatch[1].trim();
  }
  
  
  processed = processed.replace(/\|\s*\/\s*\/\s*\|/g, '| | |'); 
  processed = processed.replace(/\|\s*-\s*\|\s*-\s*\|\s*-\s*\|\s*-\s*\|\s*-\s*\|/g, ''); 
  
  return processed;
};


const detectDocumentStructure = (content) => {
  if (!content) return { isTableFormat: false };
  
  const hasLearningConceptHeader = /learning\s+concept/i.test(content);
  const hasTermWeekStructure = /term.*week.*strand.*sub-strand/i.test(content);
  const hasVolumeCapacityContent = /volume.*capacity|capacity.*volume/i.test(content);
  
  return {
    isTableFormat: true, 
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
  detectDocumentStructure,
  cleanupTableCells
};