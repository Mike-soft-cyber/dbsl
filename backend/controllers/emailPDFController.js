const PDFParser = require('pdf-parse');
const sgMail = require('@sendgrid/mail');
const crypto = require('crypto');
const PendingCBCEntry = require('../models/PendingCbcEntry');
const CBCEntry = require('../models/CbcEntry');
const { extractCBCData } = require('../utils/pdfExtractor');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);





exports.processIncomingEmail = async (req, res) => {
  try {
    console.log('📧 Received email with attachments');
    
    const { from, subject, text, attachments } = req.body;
    
    
    const pdfAttachment = attachments?.find(att => 
      att.type === 'application/pdf' || att.filename?.endsWith('.pdf')
    );
    
    if (!pdfAttachment) {
      console.log('❌ No PDF attachment found');
      await sendErrorEmail(from, 'No PDF attachment found in your email.');
      return res.status(200).json({ message: 'No PDF found' });
    }
    
    console.log(`📄 Processing PDF: ${pdfAttachment.filename}`);
    
    
    const pdfBuffer = Buffer.from(pdfAttachment.content, 'base64');
    const pdfData = await PDFParser(pdfBuffer);
    
    console.log(`✅ PDF parsed (${pdfData.text.length} characters)`);
    
    
    const extractedData = extractCBCData(pdfData.text);
    
    console.log('🔍 Extracted data:', {
      grade: extractedData.grade,
      learningArea: extractedData.learningArea,
      strand: extractedData.strand
    });
    
    
    const confirmationToken = crypto.randomBytes(32).toString('hex');
    
    
    const pendingEntry = await PendingCBCEntry.create({
      extractedData,
      sourceEmail: from,
      pdfFileName: pdfAttachment.filename,
      pdfContent: pdfData.text,
      confirmationToken,
      submittedBy: from
    });
    
    console.log(`✅ Pending entry created: ${pendingEntry._id}`);
    
    
    await sendConfirmationEmail(from, pendingEntry, extractedData);
    
    res.status(200).json({ 
      message: 'PDF processed successfully. Confirmation email sent.',
      pendingId: pendingEntry._id
    });
    
  } catch (error) {
    console.error('❌ Email processing failed:', error);
    
    try {
      await sendErrorEmail(req.body.from, error.message);
    } catch (emailError) {
      console.error('Failed to send error email:', emailError);
    }
    
    res.status(200).json({ message: 'Processing failed, error email sent' });
  }
};




exports.confirmExtractedData = async (req, res) => {
  try {
    const { token } = req.params;
    const { action, editedData, notes } = req.body;
    
    console.log(`✅ Confirmation request: ${action} for token ${token}`);
    
    const pendingEntry = await PendingCBCEntry.findOne({ 
      confirmationToken: token,
      status: 'pending'
    });
    
    if (!pendingEntry) {
      return res.status(404).json({ 
        error: 'Entry not found or already processed' 
      });
    }
    
    
    if (pendingEntry.expiresAt < new Date()) {
      return res.status(400).json({ 
        error: 'Confirmation link has expired' 
      });
    }
    
    if (action === 'approve') {
      
      const cbcEntry = await CBCEntry.create(pendingEntry.extractedData);
      
      pendingEntry.status = 'approved';
      pendingEntry.reviewedAt = new Date();
      await pendingEntry.save();
      
      console.log(`✅ CBC Entry approved and saved: ${cbcEntry._id}`);
      
      
      await sendSuccessEmail(pendingEntry.sourceEmail, cbcEntry);
      
      res.json({
        success: true,
        message: 'CBC entry approved and saved to database',
        cbcEntryId: cbcEntry._id
      });
      
    } else if (action === 'edit') {
      
      const cbcEntry = await CBCEntry.create({
        ...pendingEntry.extractedData,
        ...editedData
      });
      
      pendingEntry.status = 'edited';
      pendingEntry.reviewedAt = new Date();
      pendingEntry.notes = notes;
      await pendingEntry.save();
      
      console.log(`✅ CBC Entry edited and saved: ${cbcEntry._id}`);
      
      await sendSuccessEmail(pendingEntry.sourceEmail, cbcEntry);
      
      res.json({
        success: true,
        message: 'CBC entry saved with your edits',
        cbcEntryId: cbcEntry._id
      });
      
    } else if (action === 'reject') {
      pendingEntry.status = 'rejected';
      pendingEntry.reviewedAt = new Date();
      pendingEntry.notes = notes;
      await pendingEntry.save();
      
      console.log(`❌ CBC Entry rejected: ${pendingEntry._id}`);
      
      await sendRejectionEmail(pendingEntry.sourceEmail, notes);
      
      res.json({
        success: true,
        message: 'Entry rejected'
      });
    }
    
  } catch (error) {
    console.error('❌ Confirmation failed:', error);
    res.status(500).json({ 
      error: 'Failed to process confirmation',
      details: error.message 
    });
  }
};




exports.getPendingEntry = async (req, res) => {
  try {
    const { token } = req.params;
    
    const pendingEntry = await PendingCBCEntry.findOne({ 
      confirmationToken: token 
    });
    
    if (!pendingEntry) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    
    if (pendingEntry.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Confirmation link has expired' });
    }
    
    res.json({
      success: true,
      data: pendingEntry
    });
    
  } catch (error) {
    console.error('Error fetching pending entry:', error);
    res.status(500).json({ error: 'Failed to fetch entry' });
  }
};





async function sendConfirmationEmail(toEmail, pendingEntry, extractedData) {
  const confirmationUrl = `${process.env.FRONTEND_URL}/confirm-cbc/${pendingEntry.confirmationToken}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .data-section { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea; }
        .data-label { font-weight: bold; color: #667eea; }
        .data-value { margin-left: 10px; }
        .button { display: inline-block; padding: 15px 30px; margin: 10px 5px; text-decoration: none; border-radius: 5px; font-weight: bold; }
        .approve { background: #10b981; color: white; }
        .edit { background: #f59e0b; color: white; }
        .reject { background: #ef4444; color: white; }
        .list-item { margin: 5px 0; padding-left: 20px; }
        .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📚 CBC Data Extraction Complete</h1>
          <p>Please review the extracted data below</p>
        </div>
        
        <div class="content">
          <div class="warning">
            <strong>⚠️ Action Required:</strong> Please review the extracted data carefully and confirm if it's accurate.
          </div>
          
          <div class="data-section">
            <h3>📋 Basic Information</h3>
            <p><span class="data-label">Grade:</span><span class="data-value">${extractedData.grade || 'Not detected'}</span></p>
            <p><span class="data-label">Learning Area:</span><span class="data-value">${extractedData.learningArea || 'Not detected'}</span></p>
            <p><span class="data-label">Strand:</span><span class="data-value">${extractedData.strand || 'Not detected'}</span></p>
            <p><span class="data-label">Sub-strand:</span><span class="data-value">${extractedData.substrand || 'Not detected'}</span></p>
          </div>
          
          <div class="data-section">
            <h3>⏱️ Curriculum Configuration</h3>
            <p><span class="data-label">Age Range:</span><span class="data-value">${extractedData.ageRange || 'Not detected'}</span></p>
            <p><span class="data-label">Lesson Duration:</span><span class="data-value">${extractedData.lessonDuration ? extractedData.lessonDuration + ' minutes' : 'Not detected'}</span></p>
            <p><span class="data-label">Lessons Per Week:</span><span class="data-value">${extractedData.lessonsPerWeek || 'Not detected'}</span></p>
          </div>
          
          <div class="data-section">
            <h3>🎯 Specific Learning Outcomes (${extractedData.slo?.length || 0} found)</h3>
            ${extractedData.slo?.slice(0, 3).map(item => `<p class="list-item">• ${item}</p>`).join('') || '<p>None detected</p>'}
            ${extractedData.slo?.length > 3 ? `<p><em>... and ${extractedData.slo.length - 3} more</em></p>` : ''}
          </div>
          
          <div class="data-section">
            <h3>💡 Learning Experiences (${extractedData.learningExperiences?.length || 0} found)</h3>
            ${extractedData.learningExperiences?.slice(0, 3).map(item => `<p class="list-item">• ${item}</p>`).join('') || '<p>None detected</p>'}
            ${extractedData.learningExperiences?.length > 3 ? `<p><em>... and ${extractedData.learningExperiences.length - 3} more</em></p>` : ''}
          </div>
          
          <div class="data-section">
            <h3>🔑 Core Competencies (${extractedData.coreCompetencies?.length || 0} found)</h3>
            ${extractedData.coreCompetencies?.map(item => `<p class="list-item">• ${item}</p>`).join('') || '<p>None detected</p>'}
          </div>
          
          <div class="data-section">
            <h3>❤️ Values (${extractedData.values?.length || 0} found)</h3>
            ${extractedData.values?.map(item => `<p class="list-item">• ${item}</p>`).join('') || '<p>None detected</p>'}
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <h3>What would you like to do?</h3>
            <p>
              <a href="${confirmationUrl}?action=approve" class="button approve">✅ Approve & Save</a>
              <a href="${confirmationUrl}" class="button edit">✏️ Review & Edit</a>
              <a href="${confirmationUrl}?action=reject" class="button reject">❌ Reject</a>
            </p>
          </div>
          
          <div style="margin-top: 30px; padding: 20px; background: #e5e7eb; border-radius: 5px; font-size: 12px; color: #666;">
            <p><strong>📁 File:</strong> ${pendingEntry.pdfFileName}</p>
            <p><strong>📅 Submitted:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>⏰ Expires:</strong> ${pendingEntry.expiresAt.toLocaleString()}</p>
            <p><strong>🔗 Confirmation Link:</strong> <a href="${confirmationUrl}">${confirmationUrl}</a></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const msg = {
    to: toEmail,
    from: process.env.SYSTEM_EMAIL || 'cbc-import@yourdomain.com',
    subject: '📚 Confirm CBC Data Extraction',
    html
  };
  
  await sgMail.send(msg);
  console.log(`✅ Confirmation email sent to ${toEmail}`);
}

async function sendSuccessEmail(toEmail, cbcEntry) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f0fdf4; padding: 30px; border-radius: 0 0 10px 10px; }
        .success-icon { font-size: 48px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="success-icon">✅</div>
          <h1>CBC Data Saved Successfully!</h1>
        </div>
        <div class="content">
          <p>Your CBC entry has been successfully saved to the database.</p>
          <p><strong>Grade:</strong> ${cbcEntry.grade}</p>
          <p><strong>Learning Area:</strong> ${cbcEntry.learningArea}</p>
          <p><strong>Strand:</strong> ${cbcEntry.strand}</p>
          <p><strong>Sub-strand:</strong> ${cbcEntry.substrand}</p>
          <p style="margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL}/cbc-dashboard" style="display: inline-block; padding: 15px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              View in Dashboard
            </a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const msg = {
    to: toEmail,
    from: process.env.SYSTEM_EMAIL || 'cbc-import@yourdomain.com',
    subject: '✅ CBC Entry Saved Successfully',
    html
  };
  
  await sgMail.send(msg);
}

async function sendRejectionEmail(toEmail, reason) {
  const html = `
    <!DOCTYPE html>
    <html>
    <body>
      <h2>❌ CBC Entry Rejected</h2>
      <p>The CBC data extraction has been rejected.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      <p>You can try uploading the PDF again or contact support if you need assistance.</p>
    </body>
    </html>
  `;
  
  const msg = {
    to: toEmail,
    from: process.env.SYSTEM_EMAIL || 'cbc-import@yourdomain.com',
    subject: '❌ CBC Entry Rejected',
    html
  };
  
  await sgMail.send(msg);
}

async function sendErrorEmail(toEmail, errorMessage) {
  const html = `
    <!DOCTYPE html>
    <html>
    <body>
      <h2>⚠️ Error Processing PDF</h2>
      <p>We encountered an error while processing your CBC PDF.</p>
      <p><strong>Error:</strong> ${errorMessage}</p>
      <p>Please try again or contact support if the problem persists.</p>
    </body>
    </html>
  `;
  
  const msg = {
    to: toEmail,
    from: process.env.SYSTEM_EMAIL || 'cbc-import@yourdomain.com',
    subject: '⚠️ Error Processing CBC PDF',
    html
  };
  
  await sgMail.send(msg);
}

module.exports = {
  processIncomingEmail,
  confirmExtractedData,
  getPendingEntry
};