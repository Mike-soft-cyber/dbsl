// controllers/pdfController.js - FIXED: Proper image handling for PDF

const puppeteer = require('puppeteer');
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const Document = require('../models/Document');
const axios = require('axios');

/**
 * ✅ FIX: Convert image URLs to base64 for PDF embedding
 */
async function convertImagesToBase64(content, baseUrl) {
  const imageRegex = /!\[(.*?)\]\((\/api\/diagrams\/[^)]+)\)/g;
  let match;
  const replacements = [];
  
  while ((match = imageRegex.exec(content)) !== null) {
    const [fullMatch, alt, imagePath] = match;
    const imageUrl = `${baseUrl}${imagePath}`;
    replacements.push({ fullMatch, alt, imageUrl, imagePath });
  }
  
  console.log(`[PDF] Found ${replacements.length} images to convert`);
  
  for (const { fullMatch, alt, imageUrl, imagePath } of replacements) {
    try {
      console.log(`[PDF] Converting: ${imagePath}`);
      
      const response = await axios.get(imageUrl, { 
        responseType: 'arraybuffer',
        timeout: 10000
      });
      
      const base64 = Buffer.from(response.data).toString('base64');
      
      // Detect mime type from response or file extension
      let mimeType = response.headers['content-type'] || 'image/png';
      if (imagePath.endsWith('.svg')) {
        mimeType = 'image/svg+xml';
      } else if (imagePath.endsWith('.png')) {
        mimeType = 'image/png';
      }
      
      const base64Image = `data:${mimeType};base64,${base64}`;
      
      // Replace in content
      content = content.replace(fullMatch, `![${alt}](${base64Image})`);
      
      console.log(`[PDF] ✅ Converted: ${imagePath} (${base64.length} chars)`);
    } catch (error) {
      console.error(`[PDF] ❌ Failed to load: ${imageUrl}`, error.message);
      // Keep original reference if conversion fails
    }
  }
  
  return content;
}

/**
 * ✅ Enhanced markdown to HTML converter with TABLE support
 */
const markdownToHtml = (markdown, baseUrl, documentType) => {
  if (!markdown) return '<p>No content available</p>';
  
  let html = markdown;
  
  // ===== CRITICAL: HANDLE BASE64 IMAGES FIRST =====
  html = html.replace(/!\[(.*?)\]\((data:image\/[^;]+;base64,[^)]+)\)/g, (match, alt, base64Data) => {
    return `
  <div class="image-container" style="page-break-inside: avoid; margin: 20px 0; text-align: center;">
    <img src="${base64Data}" alt="${alt}" class="diagram-image" style="max-width: 90%; height: auto; max-height: 450px; display: block; margin: 0 auto; border: 1px solid #ddd; padding: 8px; background: white;" />
    <p class="image-caption" style="font-size: 9pt; font-style: italic; color: #555; margin-top: 10px; text-align: center;">${alt}</p>
  </div>`;
  });
  
  // ===== CONVERT MARKDOWN TABLES TO HTML TABLES =====
  html = convertMarkdownTables(html);
  
  // Convert regular markdown images (non-base64) - fallback
  html = html.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, url) => {
    if (url.startsWith('data:image')) return match; // Already processed
    
    if (url.startsWith('/')) {
      url = `${baseUrl}${url}`;
    }
    
    return `
  <div class="image-container" style="page-break-inside: avoid; margin: 20px 0; text-align: center;">
    <img src="${url}" alt="${alt}" class="diagram-image" style="max-width: 90%; height: auto; max-height: 450px; display: block; margin: 0 auto; border: 1px solid #ddd; padding: 8px; background: white;" />
    <p class="image-caption" style="font-size: 9pt; font-style: italic; color: #555; margin-top: 10px;">${alt}</p>
  </div>`;
  });
  
  // ✅ Remove any remaining diagram placeholders
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
  
  // Convert ordered lists
  let inOrderedList = false;
  html = html.split('\n').map(line => {
    if (line.includes('<table>') || line.includes('</table>') || 
        line.includes('<tr>') || line.includes('</tr>')) {
      return line;
    }
    
    const match = line.match(/^(\d+)\.\s+(.+)$/);
    if (match) {
      const item = `<li>${match[2]}</li>`;
      if (!inOrderedList) {
        inOrderedList = true;
        return '<ol>' + item;
      }
      return item;
    } else if (inOrderedList) {
      inOrderedList = false;
      return '</ol>' + line;
    }
    return line;
  }).join('\n');
  if (inOrderedList) html += '</ol>';
  
  // Convert unordered lists
  html = html.replace(/^\* (.+)$/gm, '<li>$1</li>');
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*?<\/li>\n?)+/g, match => {
    if (!match.includes('<ol>') && !match.includes('<table>')) {
      return '<ul>' + match + '</ul>';
    }
    return match;
  });
  
  // Convert paragraphs (but skip table lines and images)
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
 * Convert markdown tables to HTML tables
 */
function convertMarkdownTables(markdown) {
  const lines = markdown.split('\n');
  const result = [];
  let inTable = false;
  let tableLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Detect table lines (contain | character)
    if (line.includes('|') && line.split('|').filter(c => c.trim()).length >= 2) {
      if (!inTable) {
        inTable = true;
        tableLines = [];
      }
      tableLines.push(line);
    } else {
      // End of table
      if (inTable) {
        result.push(buildHtmlTable(tableLines));
        tableLines = [];
        inTable = false;
      }
      result.push(line);
    }
  }
  
  // Handle table at end of document
  if (inTable && tableLines.length > 0) {
    result.push(buildHtmlTable(tableLines));
  }
  
  return result.join('\n');
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
 * Main PDF generation function
 */
exports.generatePDF = async (req, res) => {
  let browser;
  let tempFilePath;
  
  try {
    const { id } = req.params;
    
    console.log('[PDF] Starting generation for:', id);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    const doc = await Document.findById(id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    console.log('[PDF] Found:', doc.type, '- Content length:', doc.content?.length);

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    // ✅ CRITICAL: Convert image URLs to base64 for PDF
    let contentForPdf = doc.content || '';
    contentForPdf = await convertImagesToBase64(contentForPdf, baseUrl);
    
    console.log('[PDF] Content after image conversion:', contentForPdf.length, 'chars');
    
    const contentHtml = markdownToHtml(contentForPdf, baseUrl, doc.type);
    console.log('[PDF] HTML processed, length:', contentHtml.length);

    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox', 
        '--disable-dev-shm-usage',
        '--disable-web-security' // Allow base64 images
      ]
    });

    const page = await browser.newPage();
    const isWide = doc.type === 'Lesson Concept Breakdown' || doc.type === 'Schemes of Work';
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Arial', 'Helvetica', sans-serif;
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
      page-break-after: avoid;
    }
    .document-header h1 {
      font-size: 22pt;
      margin-bottom: 8px;
      font-weight: bold;
    }
    .metadata {
      font-size: 10pt;
      color: #333;
      line-height: 1.8;
    }
    .content h1 {
      font-size: 16pt;
      font-weight: bold;
      margin: 20px 0 12px;
      page-break-after: avoid;
    }
    .content h2 {
      font-size: 14pt;
      font-weight: bold;
      margin: 16px 0 10px;
      page-break-after: avoid;
    }
    .content h3 {
      font-size: 12pt;
      font-weight: bold;
      margin: 12px 0 8px;
      page-break-after: avoid;
    }
    .content h4 {
      font-size: 11pt;
      font-weight: bold;
      margin: 10px 0 6px;
      page-break-after: avoid;
    }
    .content p {
      margin-bottom: 10px;
      text-align: justify;
      line-height: 1.7;
    }
    .content ul, .content ol {
      margin: 12px 0 12px 25px;
      line-height: 1.8;
    }
    .content li {
      margin-bottom: 6px;
    }
    .content strong {
      font-weight: bold;
    }
    .content em {
      font-style: italic;
    }
    
    /* ===== IMAGE STYLES - ENHANCED ===== */
    .image-container {
      margin: 25px 0;
      text-align: center;
      page-break-inside: avoid;
      page-break-before: auto;
      page-break-after: auto;
    }
    .diagram-image {
      max-width: 90% !important;
      height: auto !important;
      max-height: 450px !important;
      display: block !important;
      margin: 0 auto !important;
      border: 1px solid #ddd !important;
      padding: 8px !important;
      background: white !important;
    }
    .image-caption {
      font-size: 9pt !important;
      font-style: italic !important;
      color: #555 !important;
      margin-top: 10px !important;
      text-align: center !important;
      display: block !important;
    }
    
    /* ===== TABLE STYLES ===== */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: ${isWide ? '8pt' : '10pt'};
      page-break-inside: auto;
    }
    .data-table thead {
      display: table-header-group;
    }
    .data-table tbody {
      display: table-row-group;
    }
    .data-table tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    .data-table th {
      background-color: #2563eb;
      color: white;
      border: 1px solid #000;
      padding: ${isWide ? '4px 3px' : '6px 4px'};
      text-align: center;
      font-weight: bold;
      font-size: ${isWide ? '8pt' : '9pt'};
      vertical-align: middle;
    }
    .data-table td {
      border: 1px solid #000;
      padding: ${isWide ? '4px 3px' : '6px 4px'};
      text-align: left;
      vertical-align: top;
      word-wrap: break-word;
      overflow-wrap: break-word;
      hyphens: auto;
      line-height: 1.4;
    }
    .data-table tbody tr:nth-child(even) {
      background-color: #f5f5f5;
    }
    .data-table tbody tr:nth-child(odd) {
      background-color: white;
    }
    
    @page {
      margin: 15mm;
      size: ${isWide ? 'A3 landscape' : 'A4 portrait'};
    }
    
    @media print {
      body { padding: 0; }
      .data-table { page-break-inside: auto; }
      .data-table tr { page-break-inside: avoid; }
      .image-container { page-break-inside: avoid; }
      .diagram-image { max-width: 90% !important; }
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
  <div class="content">
    ${contentHtml}
  </div>
</body>
</html>`;

    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 90000 });
    
    // ✅ Wait for all images to load (including base64)
    await page.evaluate(() => {
      return Promise.all(
        Array.from(document.images)
          .filter(img => !img.complete)
          .map(img => new Promise(resolve => {
            img.addEventListener('load', resolve);
            img.addEventListener('error', resolve);
            setTimeout(resolve, 5000); // Timeout per image
          }))
      );
    });
    
    console.log('[PDF] All images loaded, waiting for final rendering...');
    await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second buffer

    const tempDir = path.join(__dirname, '..', 'temp');
    await fs.mkdir(tempDir, { recursive: true });
    
    tempFilePath = path.join(tempDir, `pdf-${Date.now()}.pdf`);
    
    await page.pdf({
      path: tempFilePath,
      format: isWide ? 'A3' : 'A4',
      landscape: isWide,
      printBackground: true,
      margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
      preferCSSPageSize: true
    });

    await browser.close();
    browser = null;

    const pdfBuffer = await fs.readFile(tempFilePath);
    await fs.unlink(tempFilePath);
    tempFilePath = null;

    const filename = `${doc.type.replace(/[^a-z0-9]/gi, '-')}-${doc.grade.replace(/[^a-z0-9]/gi, '-')}-${Date.now()}.pdf`;
    
    console.log('[PDF] ✅ Generated successfully:', filename, `(${pdfBuffer.length} bytes)`);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('[PDF] ❌ Error:', error.message);
    if (browser) await browser.close().catch(() => {});
    if (tempFilePath) await fs.unlink(tempFilePath).catch(() => {});
    if (!res.headersSent) {
      res.status(500).json({ error: 'PDF generation failed', message: error.message });
    }
  }
};