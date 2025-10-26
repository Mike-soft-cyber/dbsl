// controllers/imageController.js
const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');
const crypto = require('crypto');

// Download image from URL and save to server
exports.downloadAndSaveImage = async (imageUrl) => {
  return new Promise((resolve, reject) => {
    if (!imageUrl || imageUrl === '' || imageUrl === '#') {
      return resolve(null);
    }

    // Generate unique filename
    const fileExtension = '.png';
    const fileName = `diagram-${crypto.randomBytes(16).toString('hex')}${fileExtension}`;
    const uploadsDir = path.join(__dirname, '..', 'uploads', 'diagrams');
    const filePath = path.join(uploadsDir, fileName);

    // Create directory if it doesn't exist
    fs.mkdir(uploadsDir, { recursive: true })
      .then(() => {
        // Determine protocol
        const protocol = imageUrl.startsWith('https') ? https : http;

        const file = require('fs').createWriteStream(filePath);
        
        protocol.get(imageUrl, (response) => {
          if (response.statusCode !== 200) {
            reject(new Error(`Failed to download image: ${response.statusCode}`));
            return;
          }

          response.pipe(file);

          file.on('finish', () => {
            file.close();
            console.log('[IMAGE] Downloaded:', fileName);
            resolve(fileName);
          });

          file.on('error', (err) => {
            fs.unlink(filePath).catch(() => {});
            reject(err);
          });
        }).on('error', (err) => {
          fs.unlink(filePath).catch(() => {});
          reject(err);
        });
      })
      .catch(reject);
  });
};

// Extract all image URLs from markdown content
exports.extractImageUrls = (markdown) => {
  if (!markdown) return [];
  
  // Match markdown image syntax: ![alt text](url)
  const imageRegex = /!\[.*?\]\((https?:\/\/[^\)]+)\)/g;
  const urls = [];
  let match;
  
  while ((match = imageRegex.exec(markdown)) !== null) {
    urls.push(match[1]);
  }
  
  return urls;
};

// Download all images from markdown and replace URLs with local paths
exports.processMarkdownImages = async (markdown) => {
  if (!markdown) return markdown;
  
  console.log('[IMAGE] Processing markdown images...');
  
  // Extract all image URLs
  const imageUrls = exports.extractImageUrls(markdown);
  console.log('[IMAGE] Found', imageUrls.length, 'images');
  
  if (imageUrls.length === 0) {
    return markdown;
  }
  
  // Download each image and create URL mapping
  const urlMap = new Map();
  
  for (const url of imageUrls) {
    try {
      const fileName = await exports.downloadAndSaveImage(url);
      if (fileName) {
        urlMap.set(url, fileName);
      }
    } catch (error) {
      console.error('[IMAGE] Failed to download:', url, error.message);
      // Continue with other images even if one fails
    }
  }
  
  // Replace URLs in markdown with local file names
  let processedMarkdown = markdown;
  urlMap.forEach((fileName, originalUrl) => {
    // Replace the URL but keep the markdown syntax
    processedMarkdown = processedMarkdown.replace(
      new RegExp(originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
      `/uploads/diagrams/${fileName}`
    );
  });
  
  console.log('[IMAGE] Processed', urlMap.size, 'images successfully');
  return processedMarkdown;
};

// Delete an image file
exports.deleteImage = async (fileName) => {
  if (!fileName) return;
  
  try {
    const filePath = path.join(__dirname, '..', 'uploads', 'diagrams', path.basename(fileName));
    await fs.unlink(filePath);
    console.log('[IMAGE] Deleted:', fileName);
  } catch (error) {
    console.error('[IMAGE] Failed to delete:', fileName, error.message);
  }
};