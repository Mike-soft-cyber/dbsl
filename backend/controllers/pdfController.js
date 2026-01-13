const puppeteer = require('puppeteer');
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const Document = require('../models/Document');
const axios = require('axios');

/**
 * Convert diagram URLs to base64 for embedding in PDF
 */
async function convertImagesToBase64(content, baseUrl) {
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match;
  const replacements = [];
  
  console.log('[PDF] Scanning content for images...');
  
  while ((match = imageRegex.exec(content)) !== null) {
    const [fullMatch, alt, imagePath] = match;
    
    console.log(`[PDF] Found image: ${imagePath.substring(0, 50)}...`);
    
    // Skip if already base64
    if (imagePath.startsWith('data:image')) {
      console.log(`[PDF] Skipping base64 image`);
      continue;
    }
    
    // Build full URL
    let imageUrl = imagePath;
    if (!imagePath.startsWith('http')) {
      // Handle relative paths
      if (imagePath.startsWith('/api/diagrams/')) {
        imageUrl = `${baseUrl}${imagePath}`;
      } else if (imagePath.startsWith('/')) {
        imageUrl = `${baseUrl}${imagePath}`;
      } else {
        // Just a filename
        imageUrl = `${baseUrl}/api/diagrams/${imagePath}`;
      }
    }
    
    replacements.push({ fullMatch, alt, imageUrl, imagePath });
  }
  
  console.log(`[PDF] Found ${replacements.length} images to convert`);
  
  for (const { fullMatch, alt, imageUrl } of replacements) {
    try {
      console.log(`[PDF] Converting: ${imageUrl}`);
      
      const response = await axios.get(imageUrl, { 
        responseType: 'arraybuffer',
        timeout: 15000,
        validateStatus: (status) => status < 500,
        headers: {
          'User-Agent': 'PDF-Generator/1.0'
        }
      });
      
      if (response.status === 404) {
        console.warn(`[PDF] ⚠️ Image not found: ${imageUrl}`);
        content = content.replace(fullMatch, `*[Image: ${alt}]*`);
        continue;
      }
      
      if (!response.data || response.data.length === 0) {
        console.warn(`[PDF] ⚠️ Empty response for: ${imageUrl}`);
        content = content.replace(fullMatch, `*[Image: ${alt}]*`);
        continue;
      }
      
      const base64 = Buffer.from(response.data).toString('base64');
      let mimeType = response.headers['content-type'] || 'image/png';
      
      // Ensure valid mime type
      if (!mimeType.startsWith('image/')) {
        mimeType = 'image/png';
      }
      
      const base64Image = `data:${mimeType};base64,${base64}`;
      content = content.replace(fullMatch, `![${alt}](${base64Image})`);
      
      console.log(`[PDF] ✅ Converted: ${imageUrl} (${base64.length} bytes)`);
    } catch (error) {
      console.error(`[PDF] ❌ Failed: ${imageUrl}`, error.message);
      content = content.replace(fullMatch, `*[Image: ${alt}]*`);
    }
  }
  
  console.log(`[PDF] Image conversion complete`);
  return content;
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
const markdownToHtml = (markdown, baseUrl, documentType) => {
  if (!markdown) return '<p>No content available</p>';
  
  let html = markdown;
  
  // Handle base64 images first
  html = html.replace(/!\[(.*?)\]\((data:image\/[^;]+;base64,[^)]+)\)/g, (match, alt, base64Data) => {
    return `
  <div class="image-container">
    <img src="${base64Data}" alt="${alt}" class="diagram-image" />
    <p class="image-caption">${alt}</p>
  </div>`;
  });
  
  // Convert markdown tables
  html = convertMarkdownTables(html);
  
  // Convert other markdown images
  html = html.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, url) => {
    if (url.startsWith('data:image')) return match;
    if (url.startsWith('/')) url = `${baseUrl}${url}`;
    
    return `
  <div class="image-container">
    <img src="${url}" alt="${alt}" class="diagram-image" />
    <p class="image-caption">${alt}</p>
  </div>`;
  });
  
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
  
  // Convert ordered lists
  let inOrderedList = false;
  html = html.split('\n').map(line => {
    if (line.includes('<table>') || line.includes('</table>')) return line;
    
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
 * MAIN PDF GENERATION FUNCTION
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

    // Fetch document with diagrams
    console.log('[PDF] Fetching document with diagrams...');
    const doc = await Document.findById(id);
    
    if (!doc) {
      console.error('[PDF] ❌ Document not found');
      return res.status(404).json({ error: 'Document not found' });
    }

    console.log('[PDF] ✅ Document found:', doc.type);
    console.log('[PDF] Content length:', doc.content?.length || 0);
    console.log('[PDF] Diagrams:', doc.diagrams?.length || 0);

    // Get base URL
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    console.log('[PDF] Base URL:', baseUrl);
    
    // Process content to use stored base64 from diagrams array
    let contentForPdf = doc.content || '';
    
    // Replace diagram file paths with base64 from stored diagrams
    if (doc.diagrams && doc.diagrams.length > 0) {
      console.log('[PDF] Processing', doc.diagrams.length, 'stored diagrams');
      
      doc.diagrams.forEach((diagram, index) => {
        if (diagram.imageData) {
          const filenamePattern = diagram.fileName || `diagram-${index + 1}.png`;
          const pathPattern = `/api/diagrams/${filenamePattern}`;
          
          console.log('[PDF] Replacing', pathPattern, 'with base64 data');
          
          contentForPdf = contentForPdf.replace(
            new RegExp(`!\\[(.*?)\\]\\(${pathPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g'),
            `![$1](${diagram.imageData})`
          );
        }
      });
      
      console.log('[PDF] ✅ Diagram replacement complete');
    }

    // Try to convert any remaining non-base64 images
    try {
      contentForPdf = await convertImagesToBase64(contentForPdf, baseUrl);
      console.log('[PDF] ✅ Additional image conversion complete');
    } catch (imageError) {
      console.warn('[PDF] ⚠️ Some image conversions failed:', imageError.message);
    }
    
    // Convert to HTML
    console.log('[PDF] Converting to HTML...');
    const contentHtml = markdownToHtml(contentForPdf, baseUrl, doc.type);
    console.log('[PDF] ✅ HTML ready:', contentHtml.length, 'chars');

    // ✅ FIX: Simplified browser launch for development
    console.log('[PDF] Launching browser...');
    
    const isProduction = process.env.NODE_ENV === 'production';
    
    // ✅ FIXED: Better browser configuration
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
    
    // Only specify executablePath in production (Render)
    if (isProduction) {
      // For production (Render), use chromium from @sparticuz/chromium
      const chromium = require('@sparticuz/chromium');
      launchOptions.executablePath = await chromium.executablePath();
      launchOptions.args = chromium.args;
      launchOptions.defaultViewport = chromium.defaultViewport;
      launchOptions.headless = chromium.headless;
    }
    // In development, puppeteer will find Chrome/Chromium automatically
    
    browser = await puppeteer.launch(launchOptions);
    console.log('[PDF] ✅ Browser launched');

    const page = await browser.newPage();
    
    // Enable console logging from the page
    page.on('console', msg => console.log('[PDF Browser]', msg.text()));
    page.on('pageerror', error => console.error('[PDF Browser Error]', error));
    
    const isWide = doc.type === 'Lesson Concept Breakdown' || doc.type === 'Schemes of Work';
    
    // Build HTML with embedded base64 images
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
    
    // Wait for base64 images to render
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