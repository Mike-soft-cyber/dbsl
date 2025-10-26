import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import API from "@/api";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, BookOpen, Clock, Users, Target, Download, Printer } from "lucide-react";
import DocumentContent from "../components/document/DocumentContent";
import LinkedDocumentButton from "../components/document/LinkedDocumentButton";

export default function DocumentPage() {
  const { id } = useParams();
  const [document, setDocument] = useState(null);
  const [cbcEntry, setCbcEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [actionTriggered, setActionTriggered] = useState(false);
  const printRef = useRef();

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const res = await API.get(`/documents/${id}`);
        const doc = res.data.document || res.data;
        
        setDocument(doc);

        if (doc?.cbcEntry) {
          const entryRes = await API.get(`/cbc/${doc.cbcEntry}`);
          setCbcEntry(entryRes.data);
        }
      } catch (err) {
        console.error("Failed to fetch document:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, [id]);

  const handlePrint = () => {
    if (actionTriggered) return;
    setActionTriggered(true);
    try {
      window.print();
    } catch (error) {
      console.error('Print failed:', error);
      alert('Print failed. Please try again.');
    } finally {
      setTimeout(() => setActionTriggered(false), 2000);
    }
  };

  const sanitizeElementStyles = (element) => {
  const stylesheets = Array.from(window.document.styleSheets);
  const disabledSheets = [];
  
  stylesheets.forEach((sheet) => {
    try {
      const rules = Array.from(sheet.cssRules || sheet.rules || []);
      const hasProblematicColors = rules.some(rule => {
        const text = rule.cssText || '';
        return text.includes('oklch') || 
               text.includes('oklab') || 
               text.includes('lch') || 
               text.includes('lab') ||
               text.includes('color-mix') ||
               text.includes('hsl(var(');
      });
      
      if (hasProblematicColors) {
        sheet.disabled = true;
        disabledSheets.push(sheet);
        console.log('[PDF] Disabled problematic stylesheet');
      }
    } catch (e) {
      // Skip CORS-protected stylesheets
      console.warn('[PDF] Could not access stylesheet:', e.message);
    }
  });
  
  // Return cleanup function
  return () => {
    disabledSheets.forEach(sheet => {
      sheet.disabled = false;
    });
    console.log('[PDF] Re-enabled', disabledSheets.length, 'stylesheets');
  };
};

  const trackDownload = async () => {
  const userData = JSON.parse(localStorage.getItem('userData'));
  if (userData?._id && document?._id) {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      
      await fetch(`${API_BASE_URL}/teacher/${userData._id}/track-download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          documentId: document._id,
          documentType: document.type,
          grade: document.grade,
          subject: document.subject,
          strand: document.strand,
          substrand: document.substrand
        })
      });
      
      // Trigger event to update navbar count
      window.dispatchEvent(new Event('documentDownloaded'));
    } catch (error) {
      console.error('Error tracking download:', error);
    }
  }
};

// Enhanced PDF generation function with proper table handling
const handleDownloadPDF = async () => {
  if (actionTriggered || downloading) return;
  
  setDownloading(true);
  setActionTriggered(true);

  try {
    console.log('[PDF] Requesting server-side PDF generation');
    
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/documents/${id}/pdf`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('PDF generation failed');
    }

    // Download the PDF blob
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = `${document?.type || 'document'}-${document?.grade || ''}-${new Date().toISOString().slice(0, 10)}.pdf`;
    link.click();
    
    window.URL.revokeObjectURL(url);
    
    console.log('[PDF] PDF downloaded successfully');
    await trackDownload();

  } catch (error) {
    console.error('[PDF] Generation failed:', error);
    alert('PDF download failed. Please use the Print button instead.');
  } finally {
    setTimeout(() => {
      setDownloading(false);
      setActionTriggered(false);
    }, 2000);
  }
};

// Enhanced PDF-compatible styles with table fixes
const addPDFCompatibleStylesWithTableFixes = () => {
  const styleId = 'pdf-compatible-styles';
  let existingStyle = window.document.getElementById(styleId);
  
  if (existingStyle) {
    return existingStyle;
  }
  
  const style = window.document.createElement('style');
  style.id = styleId;
  style.textContent = `
    /* Force simple colors for PDF mode */
    .pdf-mode * {
      color: #000000 !important;
      background-color: transparent !important;
      background-image: none !important;
      border-color: #000000 !important;
      box-shadow: none !important;
      text-shadow: none !important;
    }
    
    /* White backgrounds for specific elements */
    .pdf-mode,
    .pdf-mode .bg-white,
    .pdf-mode table {
      background-color: #ffffff !important;
    }
    
    /* Table-specific styles */
    .pdf-mode table {
      width: 100% !important;
      border-collapse: collapse !important;
      page-break-inside: auto !important;
      border: 2px solid #000000 !important;
      margin: 0 !important;
    }
    
    .pdf-mode thead {
      display: table-header-group !important;
      page-break-inside: avoid !important;
      page-break-after: avoid !important;
    }
    
    .pdf-mode tbody {
      display: table-row-group !important;
    }
    
    .pdf-mode tr {
      page-break-inside: avoid !important;
      page-break-after: auto !important;
      display: table-row !important;
    }
    
    .pdf-mode th,
    .pdf-mode td {
      border: 1px solid #000000 !important;
      padding: 8px 6px !important;
      text-align: left !important;
      vertical-align: top !important;
      word-wrap: break-word !important;
      overflow-wrap: break-word !important;
      word-break: break-word !important;
      hyphens: auto !important;
      font-size: 11px !important;
      line-height: 1.4 !important;
      display: table-cell !important;
      font-family: Arial, Helvetica, sans-serif !important;
      page-break-inside: avoid !important;
      color: #000000 !important;
    }
    
    .pdf-mode th {
      background-color: #e0e0e0 !important;
      font-weight: bold !important;
      text-align: center !important;
      font-size: 12px !important;
    }
    
    /* Alternating row colors for better readability */
    .pdf-mode tbody tr:nth-child(even) {
      background-color: #f5f5f5 !important;
    }
    
    .pdf-mode tbody tr:nth-child(odd) {
      background-color: #ffffff !important;
    }
    
    /* Header and text elements */
    .pdf-mode h1 {
      font-size: 20px !important;
      font-weight: bold !important;
      margin: 10px 0 !important;
      page-break-after: avoid !important;
    }
    
    .pdf-mode h2 {
      font-size: 16px !important;
      font-weight: bold !important;
      margin: 8px 0 !important;
      page-break-after: avoid !important;
    }
    
    .pdf-mode h3 {
      font-size: 14px !important;
      font-weight: bold !important;
      margin: 6px 0 !important;
    }
    
    .pdf-mode p,
    .pdf-mode div:not(table div),
    .pdf-mode span {
      font-size: 11px !important;
      line-height: 1.4 !important;
    }
    
    /* Remove all decorative elements */
    .pdf-mode [class*="shadow"],
    .pdf-mode [class*="gradient"],
    .pdf-mode [class*="rounded"] {
      box-shadow: none !important;
      border-radius: 0 !important;
      background-image: none !important;
    }
    
    /* Hide non-printable elements */
    .pdf-mode .no-print {
      display: none !important;
    }
    
    /* Page break helpers */
    .pdf-mode .page-break-before {
      page-break-before: always !important;
    }
    
    .pdf-mode .page-break-after {
      page-break-after: always !important;
    }
    
    .pdf-mode .page-break-avoid {
      page-break-inside: avoid !important;
    }
  `;
  
  window.document.head.appendChild(style);
  console.log('[PDF] Added PDF-compatible styles');
  
  return style;
};

  const handleDownloadText = () => {
    if (actionTriggered) return;
    setDownloading(true);
    setActionTriggered(true);

    try {
      const element = window.document.getElementById("print-content");
      if (!element) throw new Error("Print content not found");

      const text = element.innerText;
      const blob = new Blob([text], { type: "text/plain" });
      const link = window.document.createElement("a");

      link.href = URL.createObjectURL(blob);
      link.download = `${document?.type || "document"}-${document?.grade || ""}-${document?.subject || ""}.txt`;
      link.click();

      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Text download failed:", error);
      alert("Text download failed. Please try again.");
    } finally {
      setTimeout(() => {
        setDownloading(false);
        setActionTriggered(false);
      }, 2000);
    }
  };

  const getLessonPlanStats = () => {
    if (document?.type !== 'Lesson Plan') return null;
    const content = document?.content || '';
    const stepCount = (content.match(/STEP \d+/gi) || []).length;
    const sloCount = (content.match(/- [^-]/g) || []).length;
    const questionCount = (content.match(/\d+\. [^.]/g) || []).length;

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 no-print">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center">
          <Target className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <div className="text-3xl font-bold text-slate-800 mb-1">{stepCount}</div>
          <div className="text-sm text-slate-600 font-medium">Lesson Steps</div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center">
          <Users className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <div className="text-3xl font-bold text-slate-800 mb-1">{sloCount}</div>
          <div className="text-sm text-slate-600 font-medium">Learning Outcomes</div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center">
          <Clock className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <div className="text-3xl font-bold text-slate-800 mb-1">{questionCount}</div>
          <div className="text-sm text-slate-600 font-medium">Key Questions</div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-slate-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-semibold">Loading document...</p>
          <p className="text-gray-500 text-sm mt-2">Please wait while we fetch your document</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200 max-w-md">
          <div className="text-center">
            <FileText className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <p className="text-red-600 text-xl font-bold">Document not found</p>
            <p className="text-gray-600 mt-2">The requested document could not be loaded.</p>
            <button 
              onClick={() => window.history.back()} 
              className="mt-4 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Action Buttons */}
<div className="mb-6 no-print">
  {/* Top Row: Title and Action Buttons */}
  <div className="flex justify-between items-center mb-4">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">{document.type || 'Document'}</h1>
      <p className="text-gray-600">
        {document.subject} • {document.grade} • {document.term}
      </p>
    </div>
    
    <div className="flex gap-2">
      <button
        onClick={handleDownloadPDF}
        disabled={downloading || actionTriggered}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {downloading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            PDF...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            PDF
          </>
        )}
      </button>
      
      <button
        onClick={handlePrint}
        disabled={actionTriggered}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Printer className="w-4 h-4" />
        Print
      </button>
      
      <button
        onClick={handleDownloadText}
        disabled={actionTriggered}
        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FileText className="w-4 h-4" />
        Text
      </button>
    </div>
  </div>

  {/* Bottom Row: Linked Notes Card (only for Lesson Concept Breakdown) */}
  {document.type === 'Lesson Concept Breakdown' && (
    <LinkedDocumentButton document={document} />
  )}
</div>

        {/* Print/Download Area */}
        <div id="print-content" className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Lesson Plan Statistics (non-printable) */}
          {getLessonPlanStats()}

          {/* Main Content Area */}
          <div className="main-content-area">
            <Card className="shadow-sm border border-gray-200 bg-white rounded-lg">
              <CardContent className="p-6">
                <DocumentContent 
                  content={document.content}
                  documentType={document.type}
                  cbcEntry={cbcEntry}
                  documentId={id}
                  learningArea={document.subject}
                />
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center py-6 border-t border-gray-200 no-print">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 mb-2">
              <FileText className="h-4 w-4" />
              <span>Generated by CBC Document Generator</span>
            </div>
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
              <span>{new Date().toLocaleDateString()}</span>
              <span>•</span>
              <span>Kenyan Competency Based Curriculum</span>
              <span>•</span>
              <span>{document.school || 'Educational Institution'}</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 text-center text-sm text-gray-500 no-print">
          <p>Document generated on {new Date().toLocaleDateString()}</p>
          <p className="text-blue-600 font-medium mt-2">
            💡 Tip: Use "Download PDF" for PDF file, "Print" for physical printing
          </p>
        </div>
      </div>

      {/* Print-specific styles */}
      <style>
        {`
          @media print {
            .no-print { display: none !important; }
            body { 
              background: white !important;
              font-size: 12pt;
              line-height: 1.4;
              margin: 0;
              padding: 20px;
            }
            #print-content { 
              box-shadow: none !important;
              border: 1px solid #ccc !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            h1 { font-size: 18pt !important; }
            h2 { font-size: 16pt !important; }
            h3 { font-size: 14pt !important; }
          }
        `}
      </style>
    </div>
  );
}