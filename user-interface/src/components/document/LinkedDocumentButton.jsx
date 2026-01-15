import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Link2, CheckCircle, AlertCircle, Loader2, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import API from '@/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const LinkedDocumentButton = ({ document }) => {
  const [hasLinkedNotes, setHasLinkedNotes] = useState(false);
  const [linkedDocuments, setLinkedDocuments] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);
  
  const navigate = useNavigate();

  const isConceptBreakdown = document?.type === 'Lesson Concept Breakdown';

  useEffect(() => {
    if (isConceptBreakdown && document?._id) {
      checkLinkedDocuments();
    }
  }, [document?._id, isConceptBreakdown]);

  const checkLinkedDocuments = async () => {
    try {
      setChecking(true);
      setError(null);
      const response = await API.get(`/documents/${document._id}/has-linked-notes`);
      setHasLinkedNotes(response.data.hasLinkedNotes);
      setLinkedDocuments(response.data.linkedDocuments || []);
    } catch (err) {
      console.error('Failed to check linked documents:', err);
      setError('Failed to check for existing lesson notes');
    } finally {
      setChecking(false);
    }
  };

  const navigateToDocument = (documentId) => {
    if (!documentId) {
      console.error('No document ID provided for navigation');
      setError('Cannot navigate: No document ID found');
      return;
    }

    console.log('Navigating to document:', documentId);
    navigate(`/documents/${documentId}`);
  };

  const generateLinkedNotes = async () => {
  if (generating) return;

  try {
    setGenerating(true);
    setError(null);
    console.log('🚀 Starting lesson notes generation from:', document._id);

    const response = await API.post(`/documents/generate-linked-notes/${document._id}`, {
      regenerate: hasLinkedNotes,
      teacherName: document.teacherName || 'Teacher'
    });

    console.log('📦 Generation response:', response.data);

    if (response.data.success) {
  const newDocumentId = response.data.document?._id || 
                       response.data.documentId || 
                       response.data._id;

  if (newDocumentId) {
    console.log('✅ Generation successful! Document ID:', newDocumentId);
    
    // Show success message
    toast.success('Lesson Notes generated successfully!');
    
    // ✅ FIX: Navigate immediately without setTimeout
    window.location.href = `/documents/${newDocumentId}`;
    
  } else {
    console.error('❌ No document ID in response:', response.data);
    setError('Document generated but ID not found');
    toast.error('Document generated but cannot navigate. Please check My Documents.');
  }
} else {
  throw new Error(response.data.message || 'Generation failed');
}
  } catch (err) {
    console.error('❌ Generation failed:', err);
    const errorMessage = err.response?.data?.message || 
                        err.response?.data?.error || 
                        err.message ||
                        'Failed to generate Lesson Notes';
    
    setError(errorMessage);
    toast.error(errorMessage);
    setGenerating(false);
  }
};

  if (!isConceptBreakdown) {
    return null;
  }

  if (checking) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 px-4 py-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Checking for linked documents...</span>
      </div>
    );
  }

  return (
    <div className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg overflow-hidden mb-6">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Link2 className="w-5 h-5 text-white" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-bold text-blue-900 text-sm">
              Linked Lesson Notes
            </h3>
            {hasLinkedNotes ? (
              <p className="text-xs text-green-700 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Notes generated • {linkedDocuments.length} document(s)
              </p>
            ) : (
              <p className="text-xs text-blue-600">
                Generate comprehensive notes from this breakdown
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {hasLinkedNotes && linkedDocuments.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const firstDoc = linkedDocuments[0];
                const documentId = firstDoc.id || firstDoc._id;
                navigateToDocument(documentId);
              }}
              className="text-blue-700 border-blue-300 hover:bg-blue-100"
            >
              <FileText className="w-4 h-4 mr-1" />
              View Notes
            </Button>
          )}

          <Button
            onClick={generateLinkedNotes}
            disabled={generating}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-1" />
                {hasLinkedNotes ? 'Regenerate' : 'Generate Notes'}
              </>
            )}
          </Button>

          {hasLinkedNotes && linkedDocuments.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 hover:bg-blue-100 rounded transition-colors"
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4 text-blue-700" />
              ) : (
                <ChevronDown className="w-4 h-4 text-blue-700" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Expandable Details */}
      {expanded && hasLinkedNotes && linkedDocuments.length > 0 && (
        <div className="border-t border-blue-200 bg-white p-4">
          <p className="text-sm text-gray-600 mb-3">
            Generated lesson notes documents:
          </p>
          
          <div className="space-y-2">
            {linkedDocuments.map((doc, index) => {
              const documentId = doc.id || doc._id;
              return (
                <div 
                  key={documentId || index}
                  className="flex items-center justify-between bg-blue-50 rounded p-3 border border-blue-100"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {doc.type || 'Lesson Notes'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {doc.concept && `Concept: ${doc.concept}`}
                        {doc.weekNumber && ` • Week ${doc.weekNumber}`}
                      </div>
                      <div className="text-xs text-gray-400">
                        {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : 'Recently generated'}
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigateToDocument(documentId)}
                    className="text-blue-600 hover:bg-blue-100 flex items-center gap-1"
                  >
                    Open
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error Message */}
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

      {/* Success Message (temporary) */}
      {generating && !error && (
        <div className="border-t border-green-200 bg-green-50 p-3">
          <div className="flex items-start gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-green-700 font-medium">Success! </span>
              <span className="text-green-700">Lesson notes generated successfully. Redirecting...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LinkedDocumentButton;