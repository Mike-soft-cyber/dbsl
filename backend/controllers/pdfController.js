const puppeteer = require('puppeteer');
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const Document = require('../models/Document');
const axios = require('axios');

/**
 * Escape HTML special characters
 */
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

/**
 * ✅ COMPLETELY REWRITTEN: Build HTML table from markdown with STRICT parsing
 */
function buildHTMLTableFromLines(tableLines) {
  if (tableLines.length === 0) return '';
  
  console.log('[PDF Table] Building from', tableLines.length, 'lines');
  
  // Step 1: Clean and parse all lines
  const allRows = [];
  let headerRow = null;
  let foundSeparator = false;
  
  for (let i = 0; i < tableLines.length; i++) {
    const line = tableLines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Check if this is a separator line (only contains |, -, :, and spaces)
    if (/^[\|\-\s:]+$/.test(line)) {
      foundSeparator = true;
      console.log('[PDF Table] Found separator at line', i);
      continue;
    }
    
    // Parse cells from line
    if (line.includes('|')) {
      let cells = line.split('|').map(c => c.trim());
      
      // Remove empty cells at start/end (from leading/trailing pipes)
      if (cells[0] === '') cells.shift();
      if (cells[cells.length - 1] === '') cells.pop();
      
      // Only keep rows with actual content
      if (cells.length > 0 && cells.some(c => c.length > 0)) {
        if (!headerRow && !foundSeparator) {
          // First row with content is the header
          headerRow = cells;
          console.log('[PDF Table] Header found:', headerRow.length, 'columns -', headerRow);
        } else if (headerRow && foundSeparator) {
          // Data rows come after separator
          allRows.push(cells);
        }
      }
    }
  }
  
  if (!headerRow) {
    console.error('[PDF Table] ❌ No header found!');
    return '';
  }
  
  console.log('[PDF Table] Parsed', allRows.length, 'data rows');
  console.log('[PDF Table] Expected columns:', headerRow.length);
  
  const columnCount = headerRow.length;
  
  // Step 2: Build HTML table
  let html = '<table class="data-table">\n';
  
  // Build header
  html += '  <thead>\n    <tr>\n';
  headerRow.forEach(cell => {
    html += `      <th>${escapeHtml(cell)}</th>\n`;
  });
  html += '    </tr>\n  </thead>\n';
  
  // Build body
  html += '  <tbody>\n';
  
  for (let i = 0; i < allRows.length; i++) {
    let row = allRows[i];
    
    // ✅ CRITICAL: Ensure row has correct number of columns
    if (row.length !== columnCount) {
      console.warn(`[PDF Table] Row ${i} has ${row.length} cells, expected ${columnCount} - fixing`);
      
      // Pad short rows
      while (row.length < columnCount) {
        row.push('');
      }
      
      // Trim long rows
      if (row.length > columnCount) {
        row = row.slice(0, columnCount);
      }
    }
    
    // Skip rows that are all empty
    if (row.every(cell => !cell || cell.trim() === '')) {
      continue;
    }
    
    html += '    <tr>\n';
    row.forEach(cell => {
      html += `      <td>${escapeHtml(cell || '')}</td>\n`;
    });
    html += '    </tr>\n';
  }
  
  html += '  </tbody>\n</table>\n';
  
  console.log('[PDF Table] ✅ Built table with', allRows.length, 'rows');
  return html;
}

/**
 * ✅ Convert markdown tables to HTML
 */
function convertMarkdownTablesToHTML(content) {
  const lines = content.split('\n');
  const result = [];
  let currentTable = [];
  let inTable = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Detect table start (line with pipes)
    if (line.includes('|')) {
      if (!inTable) {
        inTable = true;
        currentTable = [];
      }
      currentTable.push(line);
    } else {
      // End of table - process it
      if (inTable && currentTable.length > 0) {
        const tableHtml = buildHTMLTableFromLines(currentTable);
        if (tableHtml) {
          result.push(tableHtml);
        }
        currentTable = [];
        inTable = false;
      }
      result.push(line);
    }
  }
  
  // Handle table at end of content
  if (inTable && currentTable.length > 0) {
    const tableHtml = buildHTMLTableFromLines(currentTable);
    if (tableHtml) {
      result.push(tableHtml);
    }
  }
  
  return result.join('\n');
}

/**
 * ✅ Convert markdown to HTML with proper table handling
 */
function markdownToHtmlWithTables(markdown, baseUrl, documentType) {
  if (!markdown) return '<p>No content available</p>';
  
  let html = markdown;
  
  // Handle base64 images
  html = html.replace(/!\[(.*?)\]\((data:image\/[^;]+;base64,[^)]+)\)/g, (match, alt, base64Data) => {
    return `<div class="image-container"><img src="${base64Data}" alt="${alt}" class="diagram-image" /><p class="image-caption">${alt}</p></div>`;
  });
  
  // ✅ CRITICAL: Convert markdown tables FIRST
  html = convertMarkdownTablesToHTML(html);
  
  // Remove diagram placeholders
  html = html.replace(/\[DIAGRAM:[^\]]+\]/g, '');
  html = html.replace(/\*\[Diagram unavailable\]\*/g, '');
  
  // Convert headings
  html = html.replace(/^#### (.*?)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
  
  // Convert bold and italic
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');
  
  // Convert lists
  html = html.replace(/^\* (.+)$/gm, '<li>$1</li>');
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*?<\/li>\n?)+/g, match => {
    if (!match.includes('<table>')) {
      return '<ul>' + match + '</ul>';
    }
    return match;
  });
  
  // Convert paragraphs
  html = html.split('\n\n').map(block => {
    block = block.trim();
    if (!block) return '';
    if (block.startsWith('<')) return block;
    if (block.includes('<table>')) return block;
    return `<p>${block.replace(/\n/g, '<br>')}</p>`;
  }).join('\n');
  
  return html;
}

/**
 * ✅ Build complete PDF HTML with proper styling
 */
function buildPDFHTML(doc, contentHtml, isWide) {
  const isLessonConcept = doc.type === 'Lesson Concept Breakdown';
  const baseFontSize = isLessonConcept ? '9pt' : (isWide ? '8pt' : '10pt');
  const tableFontSize = isLessonConcept ? '8pt' : (isWide ? '7pt' : '9pt');
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: ${baseFontSize};
      line-height: 1.4;
      color: #000;
      background: #fff;
      padding: ${isWide ? '10mm' : '12mm'};
    }
    .document-header {
      border-bottom: 2px solid #000;
      padding-bottom: 8px;
      margin-bottom: 12px;
      page-break-after: avoid;
    }
    .document-header h1 {
      font-size: ${isWide ? '16pt' : '18pt'};
      font-weight: bold;
      margin-bottom: 4px;
    }
    .metadata { 
      font-size: 8pt;
      color: #333;
    }
    
    /* ✅ TABLE STYLES */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      font-size: ${tableFontSize};
      table-layout: fixed;
    }
    .data-table th {
      background-color: #2563eb !important;
      color: white !important;
      border: 1px solid #1e40af;
      padding: 4px;
      text-align: center;
      font-weight: bold;
      word-wrap: break-word;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .data-table td {
      border: 1px solid #333;
      padding: 4px;
      vertical-align: top;
      word-wrap: break-word;
      overflow-wrap: break-word;
      hyphens: auto;
    }
    
    /* ✅ LESSON CONCEPT: 5 columns */
    ${isLessonConcept ? `
    .data-table th:nth-child(1), .data-table td:nth-child(1) { width: 12%; }
    .data-table th:nth-child(2), .data-table td:nth-child(2) { width: 10%; }
    .data-table th:nth-child(3), .data-table td:nth-child(3) { width: 16%; }
    .data-table th:nth-child(4), .data-table td:nth-child(4) { width: 16%; }
    .data-table th:nth-child(5), .data-table td:nth-child(5) { width: 46%; }
    ` : `
    /* SCHEMES: 10 columns */
    .data-table th:nth-child(1), .data-table td:nth-child(1) { width: 6%; }
    .data-table th:nth-child(2), .data-table td:nth-child(2) { width: 6%; }
    .data-table th:nth-child(3), .data-table td:nth-child(3) { width: 10%; }
    .data-table th:nth-child(4), .data-table td:nth-child(4) { width: 10%; }
    .data-table th:nth-child(5), .data-table td:nth-child(5) { width: 18%; }
    .data-table th:nth-child(6), .data-table td:nth-child(6) { width: 15%; }
    .data-table th:nth-child(7), .data-table td:nth-child(7) { width: 12%; }
    .data-table th:nth-child(8), .data-table td:nth-child(8) { width: 9%; }
    .data-table th:nth-child(9), .data-table td:nth-child(9) { width: 7%; }
    .data-table th:nth-child(10), .data-table td:nth-child(10) { width: 7%; }
    `}
    
    .data-table tbody tr:nth-child(even) { 
      background-color: #f5f5f5 !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    @page { 
      margin: 8mm;
      size: ${isWide ? 'A3 landscape' : 'A4 portrait'};
    }
    
    @media print {
      .data-table thead { display: table-header-group; }
      .data-table tbody { display: table-row-group; }
      .data-table tr { page-break-inside: avoid; }
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
    </div>
  </div>
  <div class="content">${contentHtml}</div>
</body>
</html>`;
}

/**
 * MAIN PDF GENERATION FUNCTION
 */
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

    console.log('[PDF] Fetching document...');
    const doc = await Document.findById(id);
    
    if (!doc) {
      console.error('[PDF] ❌ Document not found');
      return res.status(404).json({ error: 'Document not found' });
    }

    console.log('[PDF] ✅ Document found:', doc.type);
    console.log('[PDF] Content length:', doc.content?.length || 0);

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    let contentForPdf = doc.content || '';
    
    // Replace diagram paths with base64 if available
    if (doc.diagrams && doc.diagrams.length > 0) {
      console.log('[PDF] Processing', doc.diagrams.length, 'diagrams');
      doc.diagrams.forEach((diagram, index) => {
        if (diagram.imageData) {
          const pattern = `/api/diagrams/${diagram.fileName || `diagram-${index + 1}.png`}`;
          contentForPdf = contentForPdf.replace(
            new RegExp(`!\\[(.*?)\\]\\(${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g'),
            `![$1](${diagram.imageData})`
          );
        }
      });
    }

    // Convert to HTML
    console.log('[PDF] Converting to HTML...');
    const contentHtml = markdownToHtmlWithTables(contentForPdf, baseUrl, doc.type);
    console.log('[PDF] ✅ HTML ready:', contentHtml.length, 'chars');

    // Determine page size
    const isWide = doc.type === 'Lesson Concept Breakdown' || doc.type === 'Schemes of Work';
    
    // Launch browser
    console.log('[PDF] Launching browser...');
    const isProduction = process.env.NODE_ENV === 'production';
    
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
    
    if (isProduction) {
      const chromium = require('@sparticuz/chromium');
      launchOptions.executablePath = await chromium.executablePath();
      launchOptions.args = chromium.args;
    }
    
    browser = await puppeteer.launch(launchOptions);
    console.log('[PDF] ✅ Browser launched');

    const page = await browser.newPage();
    page.on('console', msg => console.log('[Browser]', msg.text()));
    
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

    // Create PDF
    const tempDir = path.join(__dirname, '..', 'temp');
    await fs.mkdir(tempDir, { recursive: true });
    tempFilePath = path.join(tempDir, `pdf-${Date.now()}.pdf`);
    
    console.log('[PDF] Generating PDF...');
    await page.pdf({
      path: tempFilePath,
      format: isWide ? 'A3' : 'A4',
      landscape: isWide,
      printBackground: true,
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
    });
    console.log('[PDF] ✅ PDF created');

    await browser.close();
    browser = null;

    // Send PDF
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
    console.error('[PDF] ❌ ERROR:', error.message);
    
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