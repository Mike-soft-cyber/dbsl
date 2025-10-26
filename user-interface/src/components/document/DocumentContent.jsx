import React, { useMemo } from 'react';
import { FileText } from 'lucide-react';
import ContentParser from '../parsing/contentParser';
import TableView from './TableView';
import MarkdownView from './MarkdownView';
import { extractHeaderAndBody, enhanceContentWithMarkdown, expandSLOs } from '../../utils/contentFormatter';

const DocumentContent = ({ content, documentType, cbcEntry, documentId, learningArea }) => {
  // Memoize the parsed content to prevent unnecessary re-parsing
  const parsedContent = useMemo(() => {
    if (!content) return { type: 'empty', data: null };
    
    let parsed = ContentParser.parse(content, documentType, cbcEntry);
    
    // TEMPORARY FIX: If table parsing fails but content has tables, force table detection
    if (parsed.type !== 'table' && content.includes('|') && 
        (documentType === 'Lesson Concept Breakdown' || documentType === 'Schemes of Work')) {
      console.log('[TEMP FIX] Forcing table detection for', documentType);
      
      // Simple table detection as fallback
      const lines = content.split('\n').filter(line => line.includes('|'));
      if (lines.length > 5) {
        const headers = lines[0]?.split('|').map(h => h.trim()).filter(h => h) || [];
        const rows = lines.slice(1)
          .map(line => line.split('|').map(cell => cell.trim()).filter(cell => cell))
          .filter(row => row.length === headers.length && row.some(cell => cell.length > 5));
        
        if (rows.length > 0) {
          parsed = {
            type: 'table',
            data: { headers, rows }
          };
          console.log('[TEMP FIX] Created table with', rows.length, 'rows');
        }
      }
    }
    
    return parsed;
  }, [content, documentType, cbcEntry]);

  // Memoize header extraction to prevent unnecessary re-processing
  const { headerPairs, body } = useMemo(
    () => extractHeaderAndBody(content),
    [content]
  );

  // Memoize enhanced body processing
  const enhancedBody = useMemo(() => {
    if (!body) return "";
    
    let formatted = enhanceContentWithMarkdown(body, documentType);
    
    if (cbcEntry?.slo?.length) {
      formatted = expandSLOs(formatted, cbcEntry.slo);
    }
    
    return formatted;
  }, [body, documentType, cbcEntry]);

  // If table parsing succeeded, show the table
  if (parsedContent.type === 'table' && parsedContent.data) {
    return (
      <>
        <div className="mb-6">
          <div className="flex items-center space-x-2 text-sm mb-2">
            <FileText className="h-4 w-4 text-black" />
            <span className="text-black">Structured Educational Content</span>
          </div>
          <p className="text-black text-sm">
            This content has been automatically formatted into a structured table format 
            based on the Kenyan Competency Based Curriculum guidelines.
          </p>
        </div>
        <TableView data={parsedContent.data} />
      </>
    );
  }

  // Fallback to markdown processing
  return (
    <>
      {headerPairs.length > 0 && (
        <div className="p-6 rounded-lg mb-8 border border-gray-200">
          <h3 className="text-lg font-bold mb-4 flex items-center text-black">
            <FileText className="h-5 w-5 mr-2 text-black" />
            Document Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {headerPairs.map(([key, value], idx) => (
              <div key={idx} className="flex flex-col space-y-1">
                <span className="text-sm font-bold uppercase tracking-wide text-black">{key}</span>
                <span className="text-black">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <MarkdownView 
        content={enhancedBody}
        documentId={documentId}
        learningArea={learningArea}
      />
    </>
  );
};

export default DocumentContent;