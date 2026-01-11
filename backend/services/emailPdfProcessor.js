const Anthropic = require('@anthropic-ai/sdk');
const nodemailer = require('nodemailer');
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const crypto = require('crypto');
const CBCEntry = require('../models/CbcEntry');
const PendingCbcEntry = require('../models/PendingCbcEntry');

class EmailPdfProcessor {
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    this.imapConfig = {
      user: process.env.EMAIL_USER,
      password: process.env.EMAIL_PASSWORD,
      host: process.env.EMAIL_IMAP_HOST || 'imap.gmail.com',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    };

    this.smtpTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_SMTP_HOST || 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    this.baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  }

  startMonitoring() {
    console.log('📧 Starting email monitor for CBC PDFs...');
    console.log(`🔍 Checking immediately on startup...`);
    this.checkEmails();
    
    setInterval(() => {
      console.log(`\n[${new Date().toLocaleTimeString()}] 🔍 Checking for new emails...`);
      this.checkEmails();
    }, 1 * 60 * 1000);
  }

  async checkEmails() {
    const imap = new Imap(this.imapConfig);

    imap.once('ready', () => {
      imap.openBox('INBOX', false, (err) => {
        if (err) {
          console.error('❌ Error opening inbox:', err);
          return;
        }

        imap.search(['UNSEEN'], (err, results) => {
          if (err || !results || results.length === 0) {
            console.log('   No new unread emails');
            imap.end();
            return;
          }

          console.log(`📨 Found ${results.length} unread email(s)`);
          const fetch = imap.fetch(results, { bodies: '' });

          fetch.on('message', (msg) => {
            msg.on('body', (stream) => {
              simpleParser(stream, async (err, parsed) => {
                if (!err) await this.processEmail(parsed);
              });
            });

            msg.once('attributes', (attrs) => {
              imap.addFlags(attrs.uid, ['\\Seen'], (err) => {
                if (err) console.error('Error marking as read:', err);
              });
            });
          });

          fetch.once('end', () => imap.end());
        });
      });
    });

    imap.once('error', (err) => console.error('IMAP error:', err));
    imap.connect();
  }

  async processEmail(email) {
    const { from, subject, attachments } = email;
    const senderEmail = from.text;

    console.log(`\n📧 Processing email from: ${senderEmail}`);
    console.log(`📝 Subject: ${subject}`);

    if (!attachments || attachments.length === 0) {
      console.log('⚠️  No attachments found');
      return;
    }

    const pdfAttachments = attachments.filter(
      att => att.contentType === 'application/pdf'
    );

    if (pdfAttachments.length === 0) {
      await this.sendReplyEmail(
        senderEmail,
        subject,
        'error',
        'No PDF attachments found. Please send CBC curriculum PDFs.'
      );
      return;
    }

    console.log(`📄 Found ${pdfAttachments.length} PDF(s)`);
    const results = [];
    const errors = [];

    for (const pdf of pdfAttachments) {
      try {
        console.log(`\n📄 Processing: ${pdf.filename}`);
        
        // Extract ALL substrands from this PDF
        const allSubstrands = await this.extractAllSubstrandsFromPdf(pdf.content);
        
        console.log(`✅ Extracted ${allSubstrands.length} substrand(s) from ${pdf.filename}`);

        // Save each substrand as a separate pending entry
        for (let i = 0; i < allSubstrands.length; i++) {
          const substrandData = allSubstrands[i];
          const reviewToken = crypto.randomBytes(32).toString('hex');

          const pendingEntry = new PendingCbcEntry({
            extractedData: substrandData,
            sourceEmail: senderEmail,
            filename: `${pdf.filename} - ${substrandData.substrand || `Part ${i + 1}`}`,
            reviewToken
          });

          await pendingEntry.save();

          results.push({
            filename: `${pdf.filename} - ${substrandData.substrand || `Part ${i + 1}`}`,
            reviewToken,
            data: substrandData
          });

          console.log(`   ✅ Saved: ${substrandData.strand} > ${substrandData.substrand}`);
        }

      } catch (error) {
        console.error(`❌ Error processing ${pdf.filename}:`, error);
        errors.push({
          filename: pdf.filename,
          error: error.message
        });
      }
    }

    // Send review email
    await this.sendReplyEmail(senderEmail, subject, 'review', { results, errors });
  }

  // Helper function to add delay between API calls
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async extractAllSubstrandsFromPdf(pdfBuffer) {
    console.log('   🤖 Calling Claude AI to extract ALL substrands...');
    const base64Pdf = pdfBuffer.toString('base64');

    // Extract ALL substrands in a SINGLE API call
    console.log('   📊 Extracting all substrands in one comprehensive request...');
    
    try {
      const extractionMessage = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000, // Increased for comprehensive extraction
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: base64Pdf
                }
              },
              {
                type: 'text',
                text: `Extract detailed CBC curriculum data for ALL substrands in this PDF document.

Return a JSON array where each object represents ONE substrand with these exact fields:
[
  {
    "grade": "string (e.g., 'Grade 7')",
    "learningArea": "string (e.g., 'Mathematics')",
    "strand": "string (e.g., 'Numbers')",
    "substrand": "string (e.g., 'Whole Numbers')",
    "ageRange": "string (e.g., '12-14 years')",
    "lessonDuration": number (e.g., 40),
    "lessonsPerWeek": number (e.g., 5),
    "noOfLessons": number or null (lessons for this specific substrand only),
    "slo": ["array of learning outcomes for this substrand only"],
    "learningExperiences": ["array for this substrand only"],
    "keyInquiryQuestions": ["array for this substrand only"],
    "resources": ["array for this substrand only"],
    "coreCompetencies": ["array mentioned in this substrand"],
    "values": ["array mentioned in this substrand"],
    "pertinentIssues": ["array mentioned in this substrand"],
    "linkToOtherSubjects": ["array for this substrand only"],
    "communityLinkActivities": ["array for this substrand only"],
    "assessment": [{"skill": "string", "exceeds": "string", "meets": "string", "approaches": "string", "below": "string"}]
  },
  ... (repeat for each substrand)
]

CRITICAL INSTRUCTIONS:
- Extract EVERY substrand from the document as a separate object in the array
- Each substrand should have complete, detailed data
- Do NOT combine multiple substrands into one entry
- noOfLessons should be specific to each substrand (not total for all substrands)
- The PDF has substrands like "Whole Numbers", "Factors", "Fractions", "Decimals", etc.
- Make sure to extract assessment rubrics for each substrand
- Return ONLY the JSON array, no markdown formatting`
              }
            ]
          }
        ]
      });

      let extractedText = extractionMessage.content[0].text.trim();
      extractedText = extractedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      const allExtractedData = JSON.parse(extractedText);

      console.log(`   ✅ Successfully extracted ${allExtractedData.length} substrand(s) in one request!`);
      return allExtractedData;

    } catch (error) {
      console.error(`   ❌ Error during batch extraction:`, error.message);
      
      // Fallback: If batch extraction fails, try chunked approach
      console.log(`   🔄 Falling back to chunked extraction (extracting 3 substrands at a time)...`);
      return await this.extractSubstrandsInChunks(base64Pdf);
    }
  }

  async extractSubstrandsInChunks(base64Pdf) {
    // First, get the list of all substrands
    const structureMessage = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64Pdf
              }
            },
            {
              type: 'text',
              text: `List ALL strands and substrands in this CBC curriculum PDF.

Return a JSON array:
[
  {"strand": "Numbers", "substrand": "Whole Numbers"},
  {"strand": "Numbers", "substrand": "Factors"},
  ...
]

Only return the JSON array, no markdown.`
            }
          ]
        }
      ]
    });

    let structureText = structureMessage.content[0].text.trim();
    structureText = structureText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    const substrandsList = JSON.parse(structureText);

    console.log(`   📊 Found ${substrandsList.length} substrand(s) to extract`);
    console.log(`   ⏱️  Extracting in batches of 3 to manage rate limits...`);

    const allExtractedData = [];
    const BATCH_SIZE = 3; // Extract 3 substrands per request

    for (let i = 0; i < substrandsList.length; i += BATCH_SIZE) {
      const batch = substrandsList.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(substrandsList.length / BATCH_SIZE);

      console.log(`   🔄 Batch ${batchNum}/${totalBatches}: Extracting ${batch.map(s => s.substrand).join(', ')}`);

      try {
        const batchMessage = await this.anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 6000,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'document',
                  source: {
                    type: 'base64',
                    media_type: 'application/pdf',
                    data: base64Pdf
                  }
                },
                {
                  type: 'text',
                  text: `Extract detailed CBC curriculum data for these specific substrands:
${batch.map((s, idx) => `${idx + 1}. Strand: "${s.strand}", Substrand: "${s.substrand}"`).join('\n')}

Return a JSON array with ${batch.length} objects (one per substrand):
[
  {
    "grade": "string",
    "learningArea": "string",
    "strand": "${batch[0].strand}",
    "substrand": "${batch[0].substrand}",
    "ageRange": "string",
    "lessonDuration": number,
    "lessonsPerWeek": number,
    "noOfLessons": number or null,
    "slo": ["array"],
    "learningExperiences": ["array"],
    "keyInquiryQuestions": ["array"],
    "resources": ["array"],
    "coreCompetencies": ["array"],
    "values": ["array"],
    "pertinentIssues": ["array"],
    "linkToOtherSubjects": ["array"],
    "communityLinkActivities": ["array"],
    "assessment": [{"skill": "", "exceeds": "", "meets": "", "approaches": "", "below": ""}]
  }
  ${batch.length > 1 ? '... (repeat for each substrand)' : ''}
]

IMPORTANT: Extract data ONLY for these ${batch.length} substrand(s). Return ONLY the JSON array.`
                }
              ]
            }
          ]
        });

        let extractedText = batchMessage.content[0].text.trim();
        extractedText = extractedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        const batchData = JSON.parse(extractedText);

        allExtractedData.push(...batchData);
        console.log(`      ✅ Successfully extracted ${batchData.length} substrand(s) from batch ${batchNum}`);

        // Wait 2 minutes between batches to ensure token quota resets
        if (i + BATCH_SIZE < substrandsList.length) {
          console.log(`      ⏳ Waiting 2 minutes before next batch to respect rate limits...`);
          await this.delay(120000); // 120 seconds = 2 minutes
        }

      } catch (error) {
        console.error(`      ❌ Error extracting batch ${batchNum}:`, error.message);
        
        // If rate limit, wait 2 minutes
        if (error.message && error.message.includes('rate_limit_error')) {
          console.log(`      ⏳ Rate limit hit - waiting 2 minutes...`);
          await this.delay(120000);
        }
      }
    }

    console.log(`   ✅ Chunked extraction complete - ${allExtractedData.length} substrands extracted`);
    return allExtractedData;
  }

  async sendReplyEmail(to, originalSubject, type, data) {
    let htmlContent;

    if (type === 'error') {
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif;">
          <h2 style="color: #e53e3e;">❌ Processing Error</h2>
          <p>${data}</p>
          <p>Please ensure you're sending valid CBC curriculum PDF documents.</p>
        </body>
        </html>
      `;
    } else if (type === 'review') {
      const { results, errors } = data;
      
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; background: #f7fafc;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
            <h1 style="color: #667eea;">📄 CBC PDFs Processed</h1>
            <p>Review and approve extracted curriculum data</p>
            
            <div style="background: #e6f2ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3>📊 Summary</h3>
              <p><strong>Successfully Extracted:</strong> ${results.length} substrand(s)</p>
              <p><strong>Failed:</strong> ${errors.length}</p>
            </div>

            ${results.map(r => `
              <div style="border: 2px solid #e2e8f0; padding: 20px; margin: 15px 0; border-radius: 8px;">
                <h3 style="color: #667eea;">📄 ${r.filename}</h3>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 10px 0;">
                  <p><strong>Grade:</strong> ${r.data.grade || 'N/A'}</p>
                  <p><strong>Learning Area:</strong> ${r.data.learningArea || 'N/A'}</p>
                  <p><strong>Strand:</strong> ${r.data.strand || 'N/A'}</p>
                  <p><strong>Substrand:</strong> ${r.data.substrand || 'N/A'}</p>
                  <p><strong>Lessons:</strong> ${r.data.noOfLessons || 'N/A'}</p>
                </div>

                <div style="text-align: center; margin-top: 20px;">
                  <a href="${this.baseUrl}/review?token=${r.reviewToken}" 
                     style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                    ✅ Review & Approve
                  </a>
                </div>
              </div>
            `).join('')}

            ${errors.length > 0 ? `
              <div style="background: #fee; padding: 15px; border-radius: 8px; margin-top: 20px;">
                <h3 style="color: #e53e3e;">❌ Failed Processing</h3>
                ${errors.map(e => `<p><strong>${e.filename}</strong>: ${e.error}</p>`).join('')}
              </div>
            ` : ''}

            <p style="margin-top: 30px; color: #718096; font-size: 14px;">
              ⚠️ Please review each extracted substrand carefully before approving.<br/>
              Review links expire in 7 days.
            </p>
          </div>
        </body>
        </html>
      `;
    }

    try {
      await this.smtpTransporter.sendMail({
        from: `"CBC Data System" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: `Re: ${originalSubject} - Review Required`,
        html: htmlContent
      });

      console.log(`✅ Review email sent to: ${to}`);
    } catch (error) {
      console.error('❌ Error sending email:', error);
    }
  }
}

module.exports = EmailPdfProcessor;