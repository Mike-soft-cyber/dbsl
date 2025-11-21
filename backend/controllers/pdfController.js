// pdfController.js - FIXED to use stored diagram data
const puppeteer = require('puppeteer');
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const Document = require('../models/Document');

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
 * Build HTML table from markdown table lines
 */
function buildHtmlTable(tableLines) {
  if (tableLines.length < 2) return tableLines.join('\n');
  
  const rows = tableLines
    .map(line => {
      let clean = line.trim();
      if (!clean.startsWith('|')) clean = '|' + clean;
      if (!clean.endsWith('|')) clean = clean + '|';
      
      return clean
        .split('|')
        .map(cell => cell.trim())
        .filter(cell => cell !== '');
    })
    .filter(row => row.length > 0);
  
  if (rows.length === 0) return '';
  
  // Detect separator row
  let headerEndIndex = 0;
  for (let i = 0; i < rows.length; i++) {
    const isSeparator = rows[i].every(cell => /^[-:\s]+$/.test(cell));
    if (isSeparator) {
      headerEndIndex = i;
      break;
    }
  }
  
  let html = '<table class="data-table">\n';
  
  // Build header
  if (headerEndIndex > 0) {
    html += '  <thead>\n';
    for (let i = 0; i < headerEndIndex; i++) {
      html += '    <tr>\n';
      rows[i].forEach(cell => {
        html += `      <th>${escapeHtml(cell)}</th>\n`;
      });
      html += '    </tr>\n';
    }
    html += '  </thead>\n';
  }
  
  // Build body
  html += '  <tbody>\n';
  const startIdx = headerEndIndex > 0 ? headerEndIndex + 1 : 0;
  for (let i = startIdx; i < rows.length; i++) {
    const isSeparator = rows[i].every(cell => /^[-:\s]+$/.test(cell));
    if (isSeparator) continue;
    
    html += '    <tr>\n';
    rows[i].forEach(cell => {
      html += `      <td>${escapeHtml(cell)}</td>\n`;
    });
    html += '    </tr>\n';
  }
  html += '  </tbody>\n';
  html += '</table>\n';
  
  return html;
}

/**
 * Convert markdown tables to HTML tables
 */
function convertMarkdownTables(markdown) {
  const lines = markdown.split('\n');
  const result = [];
  let inTable = false;
  let tableLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.includes('|') && line.split('|').filter(c => c.trim()).length >= 2) {
      if (!inTable) {
        inTable = true;
        tableLines = [];
      }
      tableLines.push(line);
    } else {
      if (inTable) {
        result.push(buildHtmlTable(tableLines));
        tableLines = [];
        inTable = false;
      }
      result.push(line);
    }
  }
  
  if (inTable && tableLines.length > 0) {
    result.push(buildHtmlTable(tableLines));
  }
  
  return result.join('\n');
}

/**
 * Convert markdown to HTML
 */
const markdownToHtml = (markdown) => {
  if (!markdown) return '<p>No content available</p>';
  
  let html = markdown;
  
  // ✅ Handle images (they should already be base64)
  html = html.replace(/!\[(.*?)\]\((data:image\/[^;]+;base64,[^)]+)\)/g, (match, alt, base64Data) => {
    return `
  <div class="image-container">
    <img src="${base64Data}" alt="${escapeHtml(alt)}" class="diagram-image" />
    <p class="image-caption">${escapeHtml(alt)}</p>
  </div>`;
  });
  
  // ✅ Handle any HTTP URLs (shouldn't exist but just in case)
  html = html.replace(/!\[(.*?)\]\((https?:\/\/[^)]+)\)/g, (match, alt, url) => {
    console.warn('[PDF] ⚠️ Found HTTP URL in content (should be base64):', url);
    return `<p><em>[Image: ${escapeHtml(alt)}]</em></p>`;
  });
  
  // Convert markdown tables
  html = convertMarkdownTables(html);
  
  // Remove diagram placeholders
  html = html.replace(/\[DIAGRAM:[^\]]+\]/g, '');
  
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
  html = html.replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>');
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
    if (block.includes('<img')) return block;
    return `<p>${block.replace(/\n/g, '<br>')}</p>`;
  }).join('\n');
  
  return html;
};

/**
 * ✅ MAIN PDF GENERATION FUNCTION - FIXED
 */
exports.generatePDF = async (req, res) => {
  let browser;
  let tempFilePath;
  
  try {
    const { id } = req.params;
    
    console.log('[PDF] ==================== STARTING PDF GENERATION ====================');
    console.log('[PDF] Document ID:', id);
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error('[PDF] ❌ Invalid ID format');
      return res.status(400).json({ error: 'Invalid document ID' });
    }

    // Fetch document
    console.log('[PDF] Fetching document...');
    const doc = await Document.findById(id);
    
    if (!doc) {
      console.error('[PDF] ❌ Document not found');
      return res.status(404).json({ error: 'Document not found' });
    }

    console.log('[PDF] ✅ Document found:', doc.type);
    console.log('[PDF] Content length:', doc.content?.length || 0);
    
    // ✅ CRITICAL FIX: Content already has base64 images or HTTP URLs
    // We need to remove any localhost URLs and use only base64
    let contentForPdf = doc.content || '';
    
    // Remove any localhost URLs (they won't work)
    contentForPdf = contentForPdf.replace(
      /!\[(.*?)\]\(http:\/\/localhost:\d+[^)]*\)/g,
      '![$ 1](#)'
    );
    
    // Remove any broken image URLs
    contentForPdf = contentForPdf.replace(
      /!\[(.*?)\]\(https?:\/\/[^)]+\)/g,
      (match, alt) => {
        console.log('[PDF] Removing broken image URL:', match);
        return `*[Image: ${alt}]*`;
      }
    );
    
    console.log('[PDF] Content prepared for PDF generation');
    
    // Convert to HTML
    console.log('[PDF] Converting to HTML...');
    const contentHtml = markdownToHtml(contentForPdf);
    console.log('[PDF] ✅ HTML ready:', contentHtml.length, 'chars');

    // Launch Puppeteer
    console.log('[PDF] Launching browser...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security'
      ]
    });
    console.log('[PDF] ✅ Browser launched');

    const page = await browser.newPage();
    
    page.on('console', msg => console.log('[PDF Browser]', msg.text()));
    page.on('pageerror', error => console.error('[PDF Browser Error]', error));
    
    const isWide = doc.type === 'Lesson Concept Breakdown' || doc.type === 'Schemes of Work';
    
    // Build HTML
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #000;
      background: #fff;
      padding: ${isWide ? '15mm' : '20mm'};
    }
    .document-header {
      border-bottom: 3px solid #000;
      padding-bottom: 15px;
      margin-bottom: 25px;
    }
    .document-header h1 {
      font-size: 22pt;
      font-weight: bold;
      margin-bottom: 8px;
    }
    .metadata { font-size: 10pt; color: #333; }
    .content h1 { font-size: 16pt; font-weight: bold; margin: 20px 0 12px; }
    .content h2 { font-size: 14pt; font-weight: bold; margin: 16px 0 10px; }
    .content h3 { font-size: 12pt; font-weight: bold; margin: 12px 0 8px; }
    .content h4 { font-size: 11pt; font-weight: bold; margin: 10px 0 6px; }
    .content p { margin-bottom: 10px; text-align: justify; }
    .content ul, .content ol { margin: 12px 0 12px 25px; }
    .content li { margin-bottom: 6px; }
    
    .content img {
      max-width: 90%;
      height: auto;
      max-height: 450px;
      display: block;
      margin: 20px auto;
      border: 1px solid #ddd;
      padding: 8px;
      page-break-inside: avoid;
    }
    
    .image-container {
      margin: 25px 0;
      text-align: center;
      page-break-inside: avoid;
    }
    .diagram-image {
      max-width: 90%;
      height: auto;
      max-height: 450px;
      border: 1px solid #ddd;
      padding: 8px;
    }
    .image-caption {
      font-size: 9pt;
      font-style: italic;
      color: #555;
      margin-top: 10px;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: ${isWide ? '8pt' : '10pt'};
      page-break-inside: auto;
    }
    .data-table th {
      background-color: #2563eb;
      color: white;
      border: 1px solid #000;
      padding: ${isWide ? '4px' : '6px'};
      text-align: center;
      font-weight: bold;
    }
    .data-table td {
      border: 1px solid #000;
      padding: ${isWide ? '4px' : '6px'};
      text-align: left;
      word-wrap: break-word;
    }
    .data-table tbody tr:nth-child(even) { background-color: #f5f5f5; }
    @page { 
      margin: 15mm; 
      size: ${isWide ? 'A3 landscape' : 'A4 portrait'}; 
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
      margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' }
    });
    console.log('[PDF] ✅ PDF created');

    await browser.close();
    browser = null;

    // Send PDF
    const pdfBuffer = await fs.readFile(tempFilePath);
    await fs.unlink(tempFilePath);
    tempFilePath = null;

    const filename = `${doc.type.replace(/[^a-z0-9]/gi, '-')}-${Date.now()}.pdf`;
    
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