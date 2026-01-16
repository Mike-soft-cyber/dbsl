// ✅ COMPLETE PDF CONTROLLER FIX
// Replace your entire pdfController.js with this

const puppeteer = require('puppeteer');
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const Document = require('../models/Document');

/**
 * ✅ MAIN PDF GENERATION FUNCTION
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

    const doc = await Document.findById(id);
    
    if (!doc) {
      console.error('[PDF] ❌ Document not found');
      return res.status(404).json({ error: 'Document not found' });
    }

    console.log('[PDF] ✅ Document found:', doc.type);
    console.log('[PDF] Content length:', doc.content?.length || 0);

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    console.log('[PDF] Base URL:', baseUrl);
    
    // Process content
    let contentForPdf = doc.content || '';
    
    // Replace diagram paths with base64 if available
    if (doc.diagrams && doc.diagrams.length > 0) {
      console.log('[PDF] Processing', doc.diagrams.length, 'stored diagrams');
      
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

    // ✅ Convert to HTML with proper table handling
    console.log('[PDF] Converting to HTML...');
    const contentHtml = markdownToHtmlWithTables(contentForPdf, baseUrl, doc.type);
    console.log('[PDF] ✅ HTML ready:', contentHtml.length, 'chars');

    // ✅ Determine page format
    const isLessonConcept = doc.type === 'Lesson Concept Breakdown';
    const isSchemesOfWork = doc.type === 'Schemes of Work';
    const isWide = isLessonConcept || isSchemesOfWork;
    
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
      launchOptions.defaultViewport = chromium.defaultViewport;
      launchOptions.headless = chromium.headless;
    }
    
    browser = await puppeteer.launch(launchOptions);
    console.log('[PDF] ✅ Browser launched');

    const page = await browser.newPage();
    
    page.on('console', msg => console.log('[PDF Browser]', msg.text()));
    page.on('pageerror', error => console.error('[PDF Browser Error]', error));
    
    // Build HTML
    const html = buildPDFHTML(doc, contentHtml, isWide, isLessonConcept, isSchemesOfWork);

    console.log('[PDF] Setting content...');
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 90000 });
    console.log('[PDF] ✅ Content set');
    
    // Wait for images
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

    // Create temp file
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
    console.log('[PDF] ====================================================');
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('[PDF] ==================== ERROR ====================');
    console.error('[PDF] ❌ Type:', error.name);
    console.error('[PDF] ❌ Message:', error.message);
    console.error('[PDF] ❌ Stack:', error.stack);
    console.error('[PDF] ====================================================');
    
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

/**
 * ✅ Convert markdown tables to HTML - PROPERLY HANDLES 5 COLUMNS
 */
function convertMarkdownTablesToHTML(content) {
  const lines = content.split('\n');
  const result = [];
  let currentTable = [];
  let inTable = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Detect table line (has pipes and isn't just separator)
    if (line.includes('|') && !line.match(/^[\|\-\s:]+$/)) {
      if (!inTable) {
        inTable = true;
        currentTable = [];
      }
      currentTable.push(line);
    } else {
      // End of table
      if (inTable && currentTable.length > 0) {
        result.push(buildHTMLTableFromLines(currentTable));
        currentTable = [];
        inTable = false;
      }
      result.push(line);
    }
  }
  
  // Handle table at end
  if (inTable && currentTable.length > 0) {
    result.push(buildHTMLTableFromLines(currentTable));
  }
  
  return result.join('\n');
}

/**
 * ✅ Build HTML table - PROPERLY HANDLES ANY NUMBER OF COLUMNS
 */
function buildHTMLTableFromLines(tableLines) {
  if (tableLines.length === 0) return '';
  
  console.log('[PDF] Building table from', tableLines.length, 'lines');
  
  // Parse all rows
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
  
  console.log('[PDF] First row cells:', allRows[0].length);
  
  // Find separator row
  let separatorIndex = -1;
  for (let i = 0; i < allRows.length; i++) {
    if (allRows[i].every(cell => /^[-:\s]+$/.test(cell))) {
      separatorIndex = i;
      break;
    }
  }
  
  // Determine column count from header
  const columnCount = allRows[0].length;
  console.log('[PDF] ✅ Table has', columnCount, 'columns');
  
  let html = '<table class="data-table">\n';
  
  // Build header
  const headerEndIndex = separatorIndex > 0 ? separatorIndex : 1;
  if (headerEndIndex > 0) {
    html += '  <thead>\n';
    for (let i = 0; i < headerEndIndex; i++) {
      html += '    <tr>\n';
      const row = allRows[i];
      
      row.forEach(cell => {
        html += `      <th>${escapeHtml(cell)}</th>\n`;
      });
      html += '    </tr>\n';
    }
    html += '  </thead>\n';
  }
  
  // Build body
  html += '  <tbody>\n';
  const bodyStartIndex = separatorIndex > 0 ? separatorIndex + 1 : headerEndIndex;
  
  for (let i = bodyStartIndex; i < allRows.length; i++) {
    const row = allRows[i];
    
    // Skip separator rows
    if (row.every(cell => /^[-:\s]+$/.test(cell))) {
      continue;
    }
    
    // Skip empty rows
    if (row.every(cell => !cell || cell.length < 1)) {
      continue;
    }
    
    // ✅ Ensure row matches column count
    while (row.length < columnCount) row.push('');
    if (row.length > columnCount) row.length = columnCount;
    
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

/**
 * ✅ Escape HTML special characters
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
 * ✅ Convert markdown to HTML with table support
 */
function markdownToHtmlWithTables(markdown, baseUrl, documentType) {
  if (!markdown) return '<p>No content available</p>';
  
  let html = markdown;
  
  // Handle base64 images
  html = html.replace(/!\[(.*?)\]\((data:image\/[^;]+;base64,[^)]+)\)/g, (match, alt, base64Data) => {
    return `<div class="image-container"><img src="${base64Data}" alt="${alt}" class="diagram-image" /><p class="image-caption">${alt}</p></div>`;
  });
  
  // ✅ Convert markdown tables
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
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
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
 * ✅ Build complete PDF HTML with proper column widths
 */
function buildPDFHTML(doc, contentHtml, isWide, isLessonConcept, isSchemesOfWork) {
  const baseFontSize = isLessonConcept ? '10pt' : (isWide ? '8pt' : '10pt');
  const tableFontSize = isLessonConcept ? '9pt' : (isWide ? '7pt' : '8pt');
  
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
      padding: ${isWide ? '8mm' : '12mm'};
    }
    .document-header {
      border-bottom: 2px solid #000;
      padding-bottom: 8px;
      margin-bottom: 12px;
      page-break-after: avoid;
    }
    .document-header h1 {
      font-size: ${isWide ? '14pt' : '16pt'};
      font-weight: bold;
      margin-bottom: 4px;
    }
    .metadata { 
      font-size: ${isWide ? '7pt' : '8pt'}; 
      color: #333; 
    }
    
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      font-size: ${tableFontSize};
      page-break-inside: auto;
      table-layout: fixed;
    }
    .data-table th {
      background-color: #2563eb !important;
      color: white !important;
      border: 1px solid #1e40af;
      padding: 4px;
      text-align: center;
      font-weight: bold;
      page-break-after: avoid;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      word-wrap: break-word;
    }
    .data-table td {
      border: 1px solid #333;
      padding: 4px;
      vertical-align: top;
      word-wrap: break-word;
      overflow-wrap: break-word;
      page-break-inside: avoid;
    }
    
    ${isLessonConcept ? `
    .data-table th:nth-child(1), .data-table td:nth-child(1) { width: 12%; }
    .data-table th:nth-child(2), .data-table td:nth-child(2) { width: 10%; }
    .data-table th:nth-child(3), .data-table td:nth-child(3) { width: 20%; }
    .data-table th:nth-child(4), .data-table td:nth-child(4) { width: 20%; }
    .data-table th:nth-child(5), .data-table td:nth-child(5) { width: 38%; }
    ` : ''}
    
    ${isSchemesOfWork ? `
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
    ` : ''}
    
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
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
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