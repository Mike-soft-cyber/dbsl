import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import API from "@/api";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, BookOpen, Clock, Users, Target, Download, Printer, ChevronLeft, Menu } from "lucide-react";
import DocumentContent from "../components/document/DocumentContent";
import LinkedDocumentButton from "../components/document/LinkedDocumentButton";
import GenerateLessonPlanButton from "@/components/document/GenerateLessonPlanButton";
import GenerateSchemeButton from "@/components/document/GenerateSchemeButton";

export default function DocumentPage() {
  const { id } = useParams();
  const [document, setDocument] = useState(null);
  const [cbcEntry, setCbcEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [actionTriggered, setActionTriggered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
        
        window.dispatchEvent(new Event('documentDownloaded'));
      } catch (error) {
        console.error('Error tracking download:', error);
      }
    }
  };

  const handleDownloadPDF = async () => {
    if (actionTriggered || downloading) return;
    
    setDownloading(true);
    setActionTriggered(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/documents/${id}/pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('PDF generation failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `${document?.type || 'document'}-${document?.grade || ''}-${new Date().toISOString().slice(0, 10)}.pdf`;
      link.click();
      
      window.URL.revokeObjectURL(url);
      
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8 no-print">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 md:p-6 text-center">
          <Target className="w-6 h-6 md:w-8 md:h-8 text-slate-600 mx-auto mb-2 md:mb-3" />
          <div className="text-2xl md:text-3xl font-bold text-slate-800 mb-1">{stepCount}</div>
          <div className="text-xs md:text-sm text-slate-600 font-medium">Lesson Steps</div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 md:p-6 text-center">
          <Users className="w-6 h-6 md:w-8 md:h-8 text-slate-600 mx-auto mb-2 md:mb-3" />
          <div className="text-2xl md:text-3xl font-bold text-slate-800 mb-1">{sloCount}</div>
          <div className="text-xs md:text-sm text-slate-600 font-medium">Learning Outcomes</div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 md:p-6 text-center">
          <Clock className="w-6 h-6 md:w-8 md:h-8 text-slate-600 mx-auto mb-2 md:mb-3" />
          <div className="text-2xl md:text-3xl font-bold text-slate-800 mb-1">{questionCount}</div>
          <div className="text-xs md:text-sm text-slate-600 font-medium">Key Questions</div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 md:h-16 md:w-16 border-b-4 border-slate-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-semibold">Loading document...</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg border border-gray-200 max-w-md w-full">
          <div className="text-center">
            <FileText className="w-12 h-12 md:w-16 md:h-16 text-red-400 mx-auto mb-4" />
            <p className="text-red-600 text-lg md:text-xl font-bold">Document not found</p>
            <p className="text-gray-600 mt-2 text-sm md:text-base">The requested document could not be loaded.</p>
            <button 
              onClick={() => window.history.back()} 
              className="mt-4 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm md:text-base"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2 md:p-6">
      {/* Mobile Header */}
      {isMobile && (
        <div className="sticky top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm z-50 mb-4">
          <div className="flex items-center justify-between p-3">
            <button
              onClick={() => window.history.back()}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex-1 text-center">
              <h1 className="text-base font-bold text-gray-900 truncate px-2">
                {document.type || 'Document'}
              </h1>
            </div>
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        {/* Desktop Action Buttons */}
        {!isMobile && (
          <div className="mb-6 no-print">
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
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                >
                  {downloading ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-b-2 border-white"></div>
                      PDF...
                    </>
                  ) : (
                    <>
                      <Download className="w-3 h-3 md:w-4 md:h-4" />
                      PDF
                    </>
                  )}
                </button>
                
                <button
                  onClick={handlePrint}
                  disabled={actionTriggered}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                >
                  <Printer className="w-3 h-3 md:w-4 md:h-4" />
                  Print
                </button>
                
                <button
                  onClick={handleDownloadText}
                  disabled={actionTriggered}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                >
                  <FileText className="w-3 h-3 md:w-4 md:h-4" />
                  Text
                </button>
              </div>
            </div>

            {document.type === 'Lesson Concept Breakdown' && (
              <div className="flex flex-wrap gap-2">
                <LinkedDocumentButton document={document} />
                <GenerateSchemeButton document={document} />
                <GenerateLessonPlanButton document={document} />
              </div>
            )}
          </div>
        )}

        {/* Mobile Action Menu */}
        {isMobile && showMobileMenu && (
          <div className="fixed inset-0 z-50">
            <div 
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowMobileMenu(false)}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl p-4">
              <div className="space-y-2 mb-4">
                <button
                  onClick={() => {
                    handleDownloadPDF();
                    setShowMobileMenu(false);
                  }}
                  disabled={downloading || actionTriggered}
                  className="flex items-center justify-between w-full p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                >
                  <span className="font-medium">Download PDF</span>
                  <Download className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => {
                    handlePrint();
                    setShowMobileMenu(false);
                  }}
                  disabled={actionTriggered}
                  className="flex items-center justify-between w-full p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                >
                  <span className="font-medium">Print Document</span>
                  <Printer className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => {
                    handleDownloadText();
                    setShowMobileMenu(false);
                  }}
                  disabled={actionTriggered}
                  className="flex items-center justify-between w-full p-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  <span className="font-medium">Download as Text</span>
                  <FileText className="w-4 h-4" />
                </button>
              </div>
              
              {document.type === 'Lesson Concept Breakdown' && (
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <LinkedDocumentButton document={document} />
                  <GenerateSchemeButton document={document} />
                  <GenerateLessonPlanButton document={document} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile Document Info */}
        {isMobile && (
          <div className="mb-4 p-3 bg-white rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-1">{document.type || 'Document'}</h2>
            <div className="flex flex-wrap gap-2 text-sm text-gray-600">
              <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">{document.subject}</span>
              <span className="bg-green-50 text-green-700 px-2 py-1 rounded">{document.grade}</span>
              <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded">{document.term}</span>
            </div>
            <div className="mt-3 flex justify-between items-center">
              <button
                onClick={() => setShowMobileMenu(true)}
                className="flex items-center gap-2 px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium text-sm"
              >
                <Menu className="w-4 h-4" />
                Actions
              </button>
              <span className="text-xs text-gray-500">
                Created: {new Date(document.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}

        {/* Print/Download Area */}
        <div id="print-content" className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-8">
          {/* Lesson Plan Statistics */}
          {getLessonPlanStats()}

          {/* Main Content Area */}
          <div className="main-content-area">
            <Card className="shadow-sm border border-gray-200 bg-white rounded-lg">
              <CardContent className="p-4 md:p-6">
                <DocumentContent 
                  content={document.content}
                  documentType={document.type}
                  cbcEntry={cbcEntry}
                  documentId={id}
                  learningArea={document.subject}
                  strand={document.strand}
                  substrand={document.substrand}
                />
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          <div className="mt-6 md:mt-8 text-center py-4 md:py-6 border-t border-gray-200 no-print">
            <div className="flex items-center justify-center space-x-2 text-xs md:text-sm text-gray-600 mb-2">
              <FileText className="h-3 w-3 md:h-4 md:w-4" />
              <span>Generated by CBC Document Generator</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-gray-500">
              <span>{new Date().toLocaleDateString()}</span>
              <span>•</span>
              <span>Kenyan Competency Based Curriculum</span>
              <span>•</span>
              <span>{document.school || 'Educational Institution'}</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 md:mt-6 text-center text-xs md:text-sm text-gray-500 no-print">
          <p>Document generated on {new Date().toLocaleDateString()}</p>
          <p className="text-blue-600 font-medium mt-1 md:mt-2 text-xs md:text-sm">
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
              padding: 10px;
            }
            #print-content { 
              box-shadow: none !important;
              border: 1px solid #ccc !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            h1 { font-size: 16pt !important; }
            h2 { font-size: 14pt !important; }
            h3 { font-size: 12pt !important; }
          }
          
          @media (max-width: 640px) {
            #print-content {
              padding: 12px !important;
            }
            .main-content-area .card-content {
              padding: 12px !important;
            }
          }
        `}
      </style>
    </div>
  );
}