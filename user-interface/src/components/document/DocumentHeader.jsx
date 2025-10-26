import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Printer, FileText, BookOpen, PenTool, Target } from 'lucide-react';

const DocumentHeader = ({ document, onPrint, onDownload }) => {
  const getDocumentIcon = (type) => {
    switch (type) {
      case "Lesson Notes": return <BookOpen className="h-5 w-5 text-black" />;
      case "Exercises": return <PenTool className="h-5 w-5 text-black" />;
      case "Schemes of Work": return <Target className="h-5 w-5 text-black" />;
      case "Lesson Concept Breakdown": return <FileText className="h-5 w-5 text-black" />;
      default: return <FileText className="h-5 w-5 text-black" />;
    }
  };

  return (
    <div className="mb-8">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 p-3 border border-gray-300 rounded-lg">
            {getDocumentIcon(document?.type)}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-black mb-2">
              {document?.type || "Document"}
            </h1>
            <div className="flex items-center space-x-3 text-lg text-black mb-2">
              <span className="font-bold">{document?.subject}</span>
              <span>•</span>
              <span className="font-bold">{document?.grade}</span>
              <span>•</span>
              <span className="px-3 py-1 border border-gray-300 text-black rounded-full text-sm font-bold">
                {document?.term}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 text-sm text-black">
              {document?.school && (
                <span className="px-2 py-1 border border-gray-300 rounded font-bold">{document.school}</span>
              )}
              {document?.strand && (
                <span className="px-2 py-1 border border-gray-300 rounded font-bold">{document.strand}</span>
              )}
              {document?.substrand && (
                <span className="px-2 py-1 border border-gray-300 rounded font-bold">{document.substrand}</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 mt-4 md:mt-0">
          <Button 
            onClick={onDownload}
            variant="outline" 
            size="sm"
            className="border-gray-300 text-black hover:bg-gray-50 font-bold"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button 
            onClick={onPrint}
            variant="outline" 
            size="sm"
            className="border-gray-300 text-black hover:bg-gray-50 font-bold"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DocumentHeader;