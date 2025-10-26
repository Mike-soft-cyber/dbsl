import React from 'react';

const TableView = ({ data }) => {
  if (!data || !data.headers || !data.rows || data.rows.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No table data available
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-full">
        <table className="w-full border-collapse border border-gray-300 bg-white page-break-avoid">
          <thead className="bg-blue-600 text-white">
            <tr>
              {data.headers.map((header, index) => (
                <th 
                  key={index}
                  className="border border-gray-300 px-4 py-3 text-left text-sm font-bold uppercase tracking-wide text-white bg-blue-600"
                  style={{
                    minWidth: getColumnWidth(header, index),
                    wordWrap: 'break-word',
                    hyphens: 'auto'
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white">
            {data.rows.map((row, rowIndex) => (
              <tr 
                key={rowIndex} 
                className={`${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'} page-break-avoid`}
              >
                {row.map((cell, cellIndex) => (
                  <td 
                    key={cellIndex}
                    className="border border-gray-300 px-4 py-3 text-base text-gray-900 align-top"
                    style={{
                      minWidth: getColumnWidth(data.headers[cellIndex], cellIndex),
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      hyphens: 'auto',
                      lineHeight: '1.5'
                    }}
                  >
                    {formatCellContent(cell, data.headers[cellIndex])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Table summary for better context */}
      <div className="mt-4 text-sm text-gray-600 no-print">
        <p>
          Showing {data.rows.length} {data.rows.length === 1 ? 'entry' : 'entries'} 
          across {data.headers.length} columns
        </p>
      </div>
      
      {/* PDF-specific styling */}
      <style jsx>{`
        @media print {
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 11px !important;
          }
          
          th, td {
            border: 1px solid #000 !important;
            padding: 4px !important;
            font-size: 11px !important;
            line-height: 1.3 !important;
          }
          
          th {
            background-color: #e5e5e5 !important;
            font-weight: bold !important;
            text-align: center !important;
          }
          
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

// Helper function to determine column width based on header content
const getColumnWidth = (header, index) => {
  if (!header) return '100px';
  
  const headerLower = header.toLowerCase();
  
  // Set appropriate widths for different column types
  if (headerLower.includes('week') || headerLower.includes('number')) {
    return '80px';
  } else if (headerLower.includes('term')) {
    return '100px';
  } else if (headerLower.includes('strand') && !headerLower.includes('sub')) {
    return '120px';
  } else if (headerLower.includes('sub-strand')) {
    return '140px';
  } else if (headerLower.includes('learning concept') || 
             headerLower.includes('specific learning outcomes') || 
             headerLower.includes('learning experiences')) {
    return '300px';
  } else if (headerLower.includes('key inquiry') || 
             headerLower.includes('assessment') ||
             headerLower.includes('reflection')) {
    return '200px';
  } else if (headerLower.includes('resources')) {
    return '150px';
  } else if (headerLower.includes('lesson')) {
    return '100px';
  }
  
  // Default width based on header length
  return Math.max(120, Math.min(300, header.length * 8)) + 'px';
};

// Helper function to format cell content
const formatCellContent = (content, header) => {
  if (!content || content === '') return '-';
  
  // Convert string content to readable format
  const text = String(content).trim();
  
  // Handle long content with better line breaks
  if (text.length > 100 && (
    header?.toLowerCase().includes('learning concept') ||
    header?.toLowerCase().includes('specific learning outcomes') ||
    header?.toLowerCase().includes('learning experiences')
  )) {
    // Add soft breaks at sentence boundaries for better PDF rendering
    return text
      .replace(/\. ([A-Z])/g, '. $1')
      .replace(/; ([A-Z])/g, '; $1');
  }
  
  return text;
};

export default TableView;