import React, { useState } from 'react';
import { FileSpreadsheet, Loader2, AlertCircle } from 'lucide-react';

const GenerateSchemeButton = ({ document }) => {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  const generateScheme = async () => {
    if (generating) return;

    try {
      setGenerating(true);
      setError(null);
      
      console.log('🚀 Generating Scheme of Work from breakdown:', document._id);

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      
      console.log('API Base URL:', API_BASE_URL); // Debug log
      
      const response = await fetch(`${API_BASE_URL}/documents/generate-scheme-from-breakdown/${document._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          teacherName: document.teacherName || 'Teacher',
          school: document.school
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate scheme');
      }

      console.log('✅ Scheme generated:', data);

      alert(`Scheme of Work generated with ${data.conceptsUsed} lessons! Redirecting...`);

      // Navigate to the new document
      const schemeId = data.document?._id || data.documentId;
      if (schemeId) {
        setTimeout(() => {
          window.location.href = `/documents/${schemeId}`;
        }, 1000);
      }

    } catch (err) {
      console.error('❌ Generation failed:', err);
      setError(err.message);
      alert('Error: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg overflow-hidden mb-6">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="bg-green-600 p-2 rounded-lg">
            <FileSpreadsheet className="w-5 h-5 text-white" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-bold text-green-900 text-sm">
              Generate Scheme of Work
            </h3>
            <p className="text-xs text-green-700">
              Create a complete scheme using all learning concepts from this breakdown
            </p>
          </div>
        </div>

        <button
          onClick={generateScheme}
          disabled={generating}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium transition-colors"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileSpreadsheet className="w-4 h-4" />
              Generate Scheme
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="border-t border-red-200 bg-red-50 p-3">
          <div className="flex items-start gap-2 text-sm">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-red-700 font-medium">Error: </span>
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        </div>
      )}

      {generating && (
        <div className="border-t border-green-200 bg-green-50 p-3">
          <div className="flex items-start gap-2 text-sm">
            <Loader2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5 animate-spin" />
            <div>
              <span className="text-green-700 font-medium">Generating... </span>
              <span className="text-green-700">Reading concepts from breakdown and creating scheme rows...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerateSchemeButton;