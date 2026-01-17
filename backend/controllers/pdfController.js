const puppeteer = require('puppeteer');
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const Document = require('../models/Document');
const axios = require('axios');

// Escape HTML special characters
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

// Special handler for Lesson Concept Breakdown
function handleLessonConceptBreakdown(markdown) {
  const lines = markdown.split('\n');
  let inMainTable = false;
  let headers = [];
  let dataRows = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and metadata
    if (!line || line.startsWith('SCHOOL:') || line.startsWith('FACILITATOR:')) {
      continue;
    }
    
    // Look for table header with actual content
    if (line.includes('|') && 
        (line.toLowerCase().includes('week') && 
         (line.toLowerCase().includes('strand') ||
          line.toLowerCase().includes('learning concept')))) {
      
      const potentialHeaders = line.split('|').map(c => c.trim()).filter(c => c);
      if (potentialHeaders.length >= 4 && potentialHeaders[0].toLowerCase().includes('week')) {
        headers = potentialHeaders;
        inMainTable = true;
        console.log('[PDF] Found main table headers:', headers);
        continue;
      }
    }
    
    // Collect table data rows
    if (inMainTable && line.includes('|')) {
      const cells = line.split('|').map(c => c.trim()).filter(c => c);
      
      if (cells.length >= 4 && cells[0].toLowerCase().includes('week')) {
        let row = cells;
        if (row.length === 4) {
          row.push('Were learners able to meet the learning objectives?');
        }
        dataRows.push(row);
      }
    }
    
    // Stop when we hit non-table content
    if (inMainTable && !line.includes('|') && line.length > 0) {
      if (dataRows.length > 0) break;
      inMainTable = false;
    }
  }
  
  if (dataRows.length === 0) {
    return parseLessonConceptFallback(markdown);
  }
  
  let html = '<table class="data-table">\n';
  
  const standardHeaders = ['WEEK', 'STRAND', 'SUB-STRAND', 'LEARNING CONCEPT', 'REFLECTION'];
  html += '  <thead>\n    <tr>\n';
  standardHeaders.forEach(header => {
    html += `      <th>${escapeHtml(header)}</th>\n`;
  });
  html += '    </tr>\n  </thead>\n';
  
  html += '  <tbody>\n';
  dataRows.forEach(row => {
    html += '    <tr>\n';
    
    const week = row[0] || '';
    const strand = row[1] || '';
    const substrand = row[2] || '';
    const concept = row[3] || '';
    const reflection = row[4] || 'Were learners able to meet the learning objectives?';
    
    [week, strand, substrand, concept, reflection].forEach(cell => {
      html += `      <td>${escapeHtml(cell)}</td>\n`;
    });
    
    html += '    </tr>\n';
  });
  html += '  </tbody>\n</table>\n';
  
  console.log(`[PDF] Built Lesson Concept Breakdown table with ${dataRows.length} rows`);
  return html;
}

// Fallback for Lesson Concept Breakdown
function parseLessonConceptFallback(markdown) {
  const lines = markdown.split('\n');
  const rows = [];
  let currentWeek = '';
  let currentStrand = '';
  let currentSubstrand = '';
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    const weekMatch = trimmed.match(/Week\s+(\d+)/i);
    if (weekMatch) {
      currentWeek = `Week ${weekMatch[1]}`;
    }
    
    if (trimmed.includes('|')) {
      const cells = trimmed.split('|').map(c => c.trim()).filter(c => c);
      
      if (cells.length >= 3) {
        if (cells[0] && cells[0].length > 2 && 
            !cells[0].toLowerCase().includes('week') &&
            !cells[0].toLowerCase().includes('stand')) {
          
          if (!currentStrand && cells[0].length > 3) {
            currentStrand = cells[0];
          }
          if (!currentSubstrand && cells[1] && cells[1].length > 3) {
            currentSubstrand = cells[1];
          }
          
          const conceptIdx = cells.length === 3 ? 2 : (cells.length === 4 ? 3 : 2);
          const concept = cells[conceptIdx];
          
          if (concept && concept.length > 10 && !concept.toLowerCase().includes('learning concept')) {
            rows.push([
              currentWeek || 'Week 1',
              currentStrand || '',
              currentSubstrand || '',
              concept,
              'Were learners able to meet the learning objectives?'
            ]);
          }
        }
      }
    }
  }
  
  if (rows.length > 0) {
    let html = '<table class="data-table">\n';
    html += '  <thead>\n    <tr>\n';
    ['WEEK', 'STRAND', 'SUB-STRAND', 'LEARNING CONCEPT', 'REFLECTION'].forEach(header => {
      html += `      <th>${escapeHtml(header)}</th>\n`;
    });
    html += '    </tr>\n  </thead>\n';
    
    html += '  <tbody>\n';
    rows.forEach(row => {
      html += '    <tr>\n';
      row.forEach(cell => {
        html += `      <td>${escapeHtml(cell)}</td>\n`;
      });
      html += '    </tr>\n';
    });
    html += '  </tbody>\n</table>\n';
    
    console.log(`[PDF] Fallback parsing extracted ${rows.length} rows`);
    return html;
  }
  
  return '<p>Table content could not be parsed for PDF generation.</p>';
}

// Special handler for Schemes of Work
function handleSchemesOfWork(markdown) {
  const lines = markdown.split('\n');
  let inTable = false;
  let headers = [];
  let dataRows = [];
  
  console.log('[PDF] Looking for Schemes of Work table...');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line) continue;
    
    // Look for table header with 10 columns
    if (line.includes('|') && 
        (line.toLowerCase().includes('week') && 
         line.toLowerCase().includes('lesson') &&
         (line.toLowerCase().includes('specific learning outcomes') ||
          line.toLowerCase().includes('slo)')))) {
      
      const potentialHeaders = line.split('|').map(c => c.trim()).filter(c => c);
      if (potentialHeaders.length >= 8) {
        headers = potentialHeaders;
        inTable = true;
        console.log('[PDF] Found Schemes table headers with', headers.length, 'columns');
        continue;
      }
    }
    
    if (inTable && line.includes('|')) {
      const cells = line.split('|').map(c => c.trim()).filter(c => c);
      
      if (cells.length >= 8 && cells[0].toLowerCase().includes('week')) {
        dataRows.push(cells);
      }
    }
    
    if (inTable && !line.includes('|') && line.length > 50) {
      if (dataRows.length > 0) break;
      inTable = false;
    }
  }
  
  if (dataRows.length === 0) {
    console.log('[PDF] Using alternative Schemes parsing');
    return parseSchemesFallback(markdown);
  }
  
  let html = '<table class="data-table">\n';
  
  const standardHeaders = [
    'WEEK', 'LESSON', 'STRAND', 'SUB-STRAND', 
    'SPECIFIC LEARNING OUTCOMES (SLO)', 'LEARNING EXPERIENCES', 
    'KEY INQUIRY QUESTION (KIQ)', 'LEARNING RESOURCES', 
    'ASSESSMENT', 'REFLECTION'
  ];
  
  html += '  <thead>\n    <tr>\n';
  standardHeaders.forEach(header => {
    html += `      <th>${escapeHtml(header)}</th>\n`;
  });
  html += '    </tr>\n  </thead>\n';
  
  html += '  <tbody>\n';
  dataRows.forEach(row => {
    html += '    <tr>\n';
    
    let paddedRow = [...row];
    
    while (paddedRow.length < 10) {
      paddedRow.push('');
    }
    
    if (paddedRow.length > 10) {
      paddedRow = paddedRow.slice(0, 10);
    }
    
    paddedRow.forEach(cell => {
      html += `      <td>${escapeHtml(cell)}</td>\n`;
    });
    
    html += '    </tr>\n';
  });
  html += '  </tbody>\n</table>\n';
  
  console.log(`[PDF] Built Schemes of Work table with ${dataRows.length} rows`);
  return html;
}

// Fallback for Schemes of Work
function parseSchemesFallback(markdown) {
  const lines = markdown.split('\n');
  const rows = [];
  let currentWeek = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line || !line.includes('|')) continue;
    
    const weekMatch = line.match(/Week\s+(\d+)/i);
    if (weekMatch) {
      currentWeek = `Week ${weekMatch[1]}`;
    }
    
    const cells = line.split('|').map(c => c.trim()).filter(c => c);
    
    if (cells.length >= 5 && (
        cells[0].toLowerCase().includes('week') ||
        cells[1]?.toLowerCase().includes('lesson') ||
        /^\d+$/.test(cells[0]) ||
        /^lesson\s*\d+$/i.test(cells[1])
    )) {
      const row = [
        cells[0] || currentWeek,
        cells[1] || '',
        cells[2] || '',
        cells[3] || '',
        cells[4] || '',
        cells[5] || 'Learners engage in activities',
        cells[6] || 'What did we learn?',
        cells[7] || 'Textbook, charts',
        cells[8] || 'Observation',
        cells[9] || 'Were learners able to meet objectives?'
      ];
      
      rows.push(row);
    }
  }
  
  if (rows.length > 0) {
    let html = '<table class="data-table">\n';
    html += '  <thead>\n    <tr>\n';
    const standardHeaders = [
      'WEEK', 'LESSON', 'STRAND', 'SUB-STRAND', 
      'SPECIFIC LEARNING OUTCOMES (SLO)', 'LEARNING EXPERIENCES', 
      'KEY INQUIRY QUESTION (KIQ)', 'LEARNING RESOURCES', 
      'ASSESSMENT', 'REFLECTION'
    ];
    
    standardHeaders.forEach(header => {
      html += `      <th>${escapeHtml(header)}</th>\n`;
    });
    html += '    </tr>\n  </thead>\n';
    
    html += '  <tbody>\n';
    rows.forEach(row => {
      html += '    <tr>\n';
      row.forEach(cell => {
        html += `      <td>${escapeHtml(cell)}</td>\n`;
      });
      html += '    </tr>\n';
    });
    html += '  </tbody>\n</table>\n';
    
    console.log(`[PDF] Fallback parsing extracted ${rows.length} Schemes rows`);
    return html;
  }
  
  return extractAnyTable(markdown);
}

// Extract any table content
function extractAnyTable(markdown) {
  const lines = markdown.split('\n');
  let html = '<table class="data-table">\n';
  let foundRows = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line || !line.includes('|')) continue;
    
    if (line.match(/^[\|\-\s:]+$/)) continue;
    
    const cells = line.split('|').map(c => c.trim()).filter(c => c);
    
    if (cells.length >= 3) {
      if (foundRows === 0) {
        html += '  <thead>\n    <tr>\n';
        cells.forEach(cell => {
          html += `      <th>${escapeHtml(cell)}</th>\n`;
        });
        html += '    </tr>\n  </thead>\n<tbody>\n';
      } else {
        html += '    <tr>\n';
        cells.forEach(cell => {
          html += `      <td>${escapeHtml(cell)}</td>\n`;
        });
        html += '    </tr>\n';
      }
      foundRows++;
    }
  }
  
  if (foundRows > 0) {
    html += '  </tbody>\n</table>\n';
    console.log(`[PDF] Extracted ${foundRows} rows from any table`);
    return html;
  }
  
  return '<p>Table content could not be parsed.</p>';
}

// Convert markdown tables to HTML
function convertMarkdownTablesToHTML(content) {
  const lines = content.split('\n');
  const result = [];
  let currentTable = [];
  let inTable = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.includes('|') && !line.match(/^[\|\-\s:]+$/)) {
      if (!inTable) {
        inTable = true;
        currentTable = [];
      }
      currentTable.push(line);
    } else {
      if (inTable && currentTable.length > 0) {
        result.push(buildHTMLTableFromLines(currentTable));
        currentTable = [];
        inTable = false;
      }
      result.push(line);
    }
  }
  
  if (inTable && currentTable.length > 0) {
    result.push(buildHTMLTableFromLines(currentTable));
  }
  
  return result.join('\n');
}

// Build HTML table from markdown lines
function buildHTMLTableFromLines(tableLines) {
  if (tableLines.length === 0) return '';
  
  const allRows = tableLines.map(line => {
    let clean = line.trim();
    if (clean.startsWith('|')) clean = clean.substring(1);
    if (clean.endsWith('|')) clean = clean.substring(0, clean.length - 1);
    
    return clean
      .split('|')
      .map(cell => cell.trim())
      .filter(cell => cell !== '');
  }).filter(row => row.length > 0);
  
  if (allRows.length === 0) return '';
  
  let separatorIndex = -1;
  for (let i = 0; i < allRows.length; i++) {
    if (allRows[i].every(cell => /^[-:\s]+$/.test(cell))) {
      separatorIndex = i;
      break;
    }
  }
  
  const columnCount = separatorIndex > 0 ? allRows[0].length : 
                      Math.max(...allRows.map(row => row.length));
  
  let html = '<table class="data-table">\n';
  
  const headerEndIndex = separatorIndex > 0 ? separatorIndex : 1;
  if (headerEndIndex > 0) {
    html += '  <thead>\n';
    for (let i = 0; i < headerEndIndex; i++) {
      html += '    <tr>\n';
      const row = allRows[i];
      
      while (row.length < columnCount) {
        row.push('');
      }
      
      row.forEach(cell => {
        html += `      <th>${escapeHtml(cell)}</th>\n`;
      });
      html += '    </tr>\n';
    }
    html += '  </thead>\n';
  }
  
  html += '  <tbody>\n';
  const bodyStartIndex = separatorIndex > 0 ? separatorIndex + 1 : headerEndIndex;
  
  for (let i = bodyStartIndex; i < allRows.length; i++) {
    const row = allRows[i];
    
    if (row.every(cell => /^[-:\s]+$/.test(cell))) {
      continue;
    }
    
    if (row.every(cell => !cell || cell.length < 1)) {
      continue;
    }
    
    while (row.length < columnCount) {
      row.push('');
    }
    
    if (row.length > columnCount) {
      row.length = columnCount;
    }
    
    html += '    <tr>\n';
    row.forEach(cell => {
      html += `      <td>${escapeHtml(cell)}</td>\n`;
    });
    html += '    </tr>\n';
  }
  
  html += '  </tbody>\n';
  html += '</table>\n';
  
  return html;
}

// Main markdown to HTML function
function markdownToHtmlWithTables(markdown, baseUrl, documentType) {
  if (!markdown) return '<p>No content available</p>';
  
  console.log('[PDF] Document type:', documentType);
  
  // Special handling for Lesson Concept Breakdown
  if (documentType === 'Lesson Concept Breakdown') {
    console.log('[PDF] Processing Lesson Concept Breakdown specifically');
    return handleLessonConceptBreakdown(markdown);
  }
  
  // Special handling for Schemes of Work
  if (documentType === 'Schemes of Work') {
    console.log('[PDF] Processing Schemes of Work specifically');
    return handleSchemesOfWork(markdown);
  }
  
  let html = markdown;
  
  html = html.replace(/!\[(.*?)\]\((data:image\/[^;]+;base64,[^)]+)\)/g, (match, alt, base64Data) => {
    return `
  <div class="image-container">
    <img src="${base64Data}" alt="${alt}" class="diagram-image" />
    <p class="image-caption">${alt}</p>
  </div>`;
  });
  
  html = convertMarkdownTablesToHTML(html);
  
  html = html.replace(/\[DIAGRAM:[^\]]+\]/g, '');
  html = html.replace(/\*\[Diagram unavailable\]\*/g, '');
  
  html = html.replace(/^#### (.*?)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
  
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');
  
  html = html.replace(/^\* (.+)$/gm, '<li>$1</li>');
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*?<\/li>\n?)+/g, match => {
    if (!match.includes('<ol>') && !match.includes('<table>')) {
      return '<ul>' + match + '</ul>';
    }
    return match;
  });
  
  html = html.split('\n\n').map(block => {
    block = block.trim();
    if (!block) return '';
    if (block.startsWith('<')) return block;
    if (block.includes('<table>')) return block;
    return `<p>${block.replace(/\n/g, '<br>')}</p>`;
  }).join('\n');
  
  return html;
}

// Build PDF HTML with LARGER TEXT
function buildPDFHTML(doc, contentHtml, isWide) {
  const isLessonConcept = doc.type === 'Lesson Concept Breakdown';
  const isSchemesOfWork = doc.type === 'Schemes of Work';
  const isWideFormat = isLessonConcept || isSchemesOfWork;
  
  // ✅ INCREASED FONT SIZES for better readability
  const baseFontSize = isLessonConcept ? '11pt' : (isWideFormat ? '10pt' : '12pt');
  const tableFontSize = isLessonConcept ? '10pt' : (isWideFormat ? '8.5pt' : '10pt');
  const headerFontSize = isWideFormat ? '20pt' : '22pt';
  
  // ✅ INCREASED CELL PADDING for better spacing
  const cellPadding = isWideFormat ? '5px 6px' : '6px 8px';
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: ${baseFontSize};
      line-height: 1.5; /* Increased line height */
      color: #000;
      background: #fff;
      padding: ${isWideFormat ? '12mm' : '15mm'};
    }
    
    .document-header {
      border-bottom: 3px solid #000;
      padding-bottom: 15px;
      margin-bottom: 20px;
      page-break-after: avoid;
    }
    
    .document-header h1 {
      font-size: ${headerFontSize};
      font-weight: bold;
      margin-bottom: 8px;
      color: #1a237e;
    }
    
    .metadata { 
      font-size: ${isWideFormat ? '9pt' : '10pt'}; 
      color: #333;
      line-height: 1.4;
    }
    
    .metadata strong {
      color: #1a237e;
    }
    
    /* ✅ ENHANCED TABLE STYLES */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: ${tableFontSize};
      page-break-inside: auto;
      table-layout: fixed;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .data-table th {
      background-color: #1a237e !important;
      color: white !important;
      border: 2px solid #0d1459;
      padding: ${cellPadding};
      text-align: center;
      font-weight: bold;
      font-size: ${parseInt(tableFontSize) + 1}pt;
      page-break-after: avoid;
      page-break-inside: avoid;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      word-wrap: break-word;
      overflow-wrap: break-word;
      line-height: 1.4;
    }
    
    .data-table td {
      border: 1px solid #666;
      padding: ${cellPadding};
      vertical-align: top;
      word-wrap: break-word;
      overflow-wrap: break-word;
      page-break-inside: avoid;
      hyphens: auto;
      line-height: 1.4;
    }
    
    /* ✅ LESSON CONCEPT BREAKDOWN: 5-column layout with better widths */
    ${isLessonConcept ? `
    .data-table th:nth-child(1),
    .data-table td:nth-child(1) { width: 10%; } /* Week */
    .data-table th:nth-child(2),
    .data-table td:nth-child(2) { width: 15%; } /* Strand */
    .data-table th:nth-child(3),
    .data-table td:nth-child(3) { width: 15%; } /* Sub-strand */
    .data-table th:nth-child(4),
    .data-table td:nth-child(4) { width: 45%; } /* Learning Concept */
    .data-table th:nth-child(5),
    .data-table td:nth-child(5) { width: 15%; } /* Reflection */
    ` : `
    /* ✅ SCHEMES OF WORK: 10-column layout with better widths */
    .data-table th:nth-child(1),
    .data-table td:nth-child(1) { width: 7%; }  /* Week */
    .data-table th:nth-child(2),
    .data-table td:nth-child(2) { width: 7%; }  /* Lesson */
    .data-table th:nth-child(3),
    .data-table td:nth-child(3) { width: 10%; } /* Strand */
    .data-table th:nth-child(4),
    .data-table td:nth-child(4) { width: 12%; } /* Sub-strand */
    .data-table th:nth-child(5),
    .data-table td:nth-child(5) { width: 20%; } /* SLO */
    .data-table th:nth-child(6),
    .data-table td:nth-child(6) { width: 15%; } /* Learning Experiences */
    .data-table th:nth-child(7),
    .data-table td:nth-child(7) { width: 12%; } /* KIQ */
    .data-table th:nth-child(8),
    .data-table td:nth-child(8) { width: 8%; }  /* Resources */
    .data-table th:nth-child(9),
    .data-table td:nth-child(9) { width: 6%; }  /* Assessment */
    .data-table th:nth-child(10),
    .data-table td:nth-child(10) { width: 8%; } /* Reflection */
    `}
    
    .data-table tbody tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    
    .data-table tbody tr:nth-child(even) { 
      background-color: #f8f9fa !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    .data-table tbody tr:hover {
      background-color: #e8f4fd !important;
    }
    
    /* ✅ Content styling */
    .content {
      font-size: ${baseFontSize};
      line-height: 1.6;
    }
    
    .content h1 {
      font-size: ${parseInt(baseFontSize) + 4}pt;
      margin: 20px 0 10px 0;
      color: #1a237e;
    }
    
    .content h2 {
      font-size: ${parseInt(baseFontSize) + 2}pt;
      margin: 18px 0 8px 0;
      color: #283593;
    }
    
    .content h3 {
      font-size: ${parseInt(baseFontSize) + 1}pt;
      margin: 16px 0 6px 0;
      color: #3949ab;
    }
    
    .content p {
      margin-bottom: 12px;
      text-align: justify;
    }
    
    .content ul, .content ol {
      margin-left: 24px;
      margin-bottom: 12px;
    }
    
    .content li {
      margin-bottom: 6px;
    }
    
    @page { 
      margin: 15mm; /* Increased margins */
      size: ${isWideFormat ? 'A3 landscape' : 'A4 portrait'}; 
    }
    
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
        font-size: ${parseInt(baseFontSize) + 1}pt; /* Slightly larger for print */
      }
      
      .document-header {
        margin-bottom: 25px;
      }
      
      .data-table {
        font-size: ${parseInt(tableFontSize) + 1}pt; /* Larger for print */
      }
      
      .data-table th {
        font-size: ${parseInt(tableFontSize) + 2}pt; /* Larger headers for print */
      }
      
      .data-table td {
        padding: 8px 10px; /* More padding for print */
      }
      
      .no-print {
        display: none !important;
      }
    }
    
    /* ✅ Print optimization */
    @media print and (color) {
      .data-table th {
        background-color: #1a237e !important;
        color: white !important;
      }
      
      .data-table tbody tr:nth-child(even) {
        background-color: #f8f9fa !important;
      }
    }
  </style>
</head>
<body>
  <div class="document-header">
    <h1>${doc.type || 'Document'}</h1>
    <div class="metadata">
      <strong>Grade:</strong> ${doc.grade || 'N/A'} | 
      <strong>Subject:</strong> ${doc.subject || 'N/A'} | 
      <strong>Term:</strong> ${doc.term || 'N/A'}
      ${doc.strand ? `<br><strong>Strand:</strong> ${doc.strand}` : ''}
      ${doc.substrand ? ` | <strong>Sub-strand:</strong> ${doc.substrand}` : ''}
      ${doc.school ? `<br><strong>School:</strong> ${doc.school}` : ''}
      ${doc.createdAt ? `<br><strong>Generated:</strong> ${new Date(doc.createdAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}` : ''}
    </div>
  </div>
  <div class="content">${contentHtml}</div>
  
  <!-- Footer for print -->
  <div style="margin-top: 30px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 9pt; color: #666; text-align: center;">
    <p>Generated by CBC Document Generator • Kenyan Competency Based Curriculum • ${doc.school || 'Educational Institution'}</p>
    <p>Page generated on ${new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}</p>
  </div>
</body>
</html>`;
}

// MAIN PDF GENERATION FUNCTION
exports.generatePDF = async (req, res) => {
  let browser;
  let tempFilePath;
  
  try {
    const { id } = req.params;
    
    console.log('[PDF] ==================== STARTING PDF GENERATION ====================');
    console.log('[PDF] Document ID:', id);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error('[PDF] ❌ Invalid ID format');
      return res.status(400).json({ error: 'Invalid document ID' });
    }

    const doc = await Document.findById(id);
    
    if (!doc) {
      console.error('[PDF] ❌ Document not found');
      return res.status(404).json({ error: 'Document not found' });
    }

    console.log('[PDF] ✅ Document found:', doc.type);

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    console.log('[PDF] Base URL:', baseUrl);
    
    let contentForPdf = doc.content || '';
    
    if (doc.diagrams && doc.diagrams.length > 0) {
      doc.diagrams.forEach((diagram, index) => {
        if (diagram.imageData) {
          const filenamePattern = diagram.fileName || `diagram-${index + 1}.png`;
          const pathPattern = `/api/diagrams/${filenamePattern}`;
          
          contentForPdf = contentForPdf.replace(
            new RegExp(`!\\[(.*?)\\]\\(${pathPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g'),
            `![$1](${diagram.imageData})`
          );
        }
      });
    }

    console.log('[PDF] Converting to HTML...');
    const contentHtml = markdownToHtmlWithTables(contentForPdf, baseUrl, doc.type);
    console.log('[PDF] ✅ HTML ready');

    const isLessonConcept = doc.type === 'Lesson Concept Breakdown';
    const isSchemesOfWork = doc.type === 'Schemes of Work';
    const isWide = isLessonConcept || isSchemesOfWork;
    
    console.log('[PDF] Launching browser...');
    
    const launchOptions = {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    };
    
    if (process.env.NODE_ENV === 'production') {
      const chromium = require('@sparticuz/chromium');
      launchOptions.executablePath = await chromium.executablePath();
      launchOptions.args = chromium.args;
      launchOptions.defaultViewport = chromium.defaultViewport;
      launchOptions.headless = chromium.headless;
    }
    
    browser = await puppeteer.launch(launchOptions);
    console.log('[PDF] ✅ Browser launched');

    const page = await browser.newPage();
    
    const html = buildPDFHTML(doc, contentHtml, isWide);

    console.log('[PDF] Setting content...');
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 90000 });
    console.log('[PDF] ✅ Content set');
    
    await page.evaluate(() => {
      return Promise.all(
        Array.from(document.images)
          .filter(img => !img.complete)
          .map(img => new Promise(resolve => {
            img.addEventListener('load', resolve);
            img.addEventListener('error', resolve);
            setTimeout(resolve, 5000);
          }))
      );
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));

    const tempDir = path.join(__dirname, '..', 'temp');
    await fs.mkdir(tempDir, { recursive: true });
    tempFilePath = path.join(tempDir, `pdf-${Date.now()}.pdf`);
    
    console.log('[PDF] Generating PDF...');
await page.pdf({
  path: tempFilePath,
  format: isWide ? 'A3' : 'A4',
  landscape: isWide,
  printBackground: true,
  margin: { 
    top: '15mm', 
    right: '15mm', 
    bottom: '20mm',
    left: '15mm' 
  },
  scale: 0.95,
  preferCSSPageSize: true
});
    console.log('[PDF] ✅ PDF created');

    await browser.close();
    browser = null;

    const pdfBuffer = await fs.readFile(tempFilePath);
    await fs.unlink(tempFilePath);
    tempFilePath = null;

    const filename = `${doc.type.replace(/[^a-z0-9]/gi, '-')}-${doc.grade}-${Date.now()}.pdf`;
    
    console.log('[PDF] ✅ SUCCESS - Size:', pdfBuffer.length, 'bytes');
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('[PDF] ==================== ERROR ====================');
    console.error('[PDF] ❌ Type:', error.name);
    console.error('[PDF] ❌ Message:', error.message);
    
    if (browser) {
      try { await browser.close(); } catch (e) {}
    }
    if (tempFilePath) {
      try { await fs.unlink(tempFilePath); } catch (e) {}
    }
    
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'PDF generation failed', 
        message: error.message
      });
    }
  }
};

// Test endpoint
exports.testPDFTable = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await Document.findById(id);
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    console.log('Document type:', document.type);
    
    const ContentParser = require('../utils/contentProcessor');
    const parsed = ContentParser.parse(document.content, document.type);
    
    res.json({
      success: true,
      documentType: document.type,
      contentLength: document.content.length,
      parsedType: parsed.type,
      headers: parsed.data?.headers || [],
      rowCount: parsed.data?.rows?.length || 0,
      sampleRow: parsed.data?.rows?.[0] || []
    });
    
  } catch (error) {
    console.error('Test error:', error);
    res.status(500).json({ error: error.message });
  }
};