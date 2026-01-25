import React, { useState, useEffect } from 'react';
import { FileText, Loader2, AlertCircle, ChevronDown, ChevronUp, Info } from 'lucide-react';
import ContentParser from '../parsing/contentParser';

const GenerateLessonPlanButton = ({ document }) => {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(1);
  const [totalLessons, setTotalLessons] = useState(0);
  const [concepts, setConcepts] = useState([]);
  const [extractionError, setExtractionError] = useState(null);

  console.log('🚀 Debug GenerateLessonPlanButton:');
  console.log('Document ID:', document?._id);
  console.log('Document type:', document?.type);
  console.log('Content length:', document?.content?.length);
  console.log('Concepts found:', concepts.length);
  console.log('Selected lesson:', selectedLesson);
  console.log('Selected concept:', concepts[selectedLesson - 1]);
  console.log('Button disabled?', generating || concepts.length === 0 || !concepts[selectedLesson - 1] || selectedLesson < 1 || selectedLesson > concepts.length);
  console.log('---');

  useEffect(() => {
  if (document?.content) {
    console.log('[useEffect] Starting concept extraction...');
    
    const parsed = ContentParser.parse(document.content, 'Lesson Concept Breakdown');
    
    console.log('[useEffect] Parsed table structure:');
    console.log('Headers:', parsed.data?.headers);
    console.log('Header count:', parsed.data?.headers?.length);
    console.log('First row:', parsed.data?.rows?.[0]);
    
    if (parsed.type === 'table' && parsed.data?.rows?.length > 0) {
      console.log('[useEffect] ContentParser found table with', parsed.data.rows.length, 'rows');
      
      const extractedConcepts = [];
      parsed.data.rows.forEach((row, index) => {
        let term = '';
        let week = '';
        let concept = '';
        
        // CHANGED: Handle 5 columns [Term, Week, Strand, Sub-strand, Learning Concept]
        if (row.length >= 5) {
          term = row[0];     // Term
          week = row[1];     // Week
          concept = row[4];  // Learning Concept
        } else if (row.length === 4) {
          // Fallback: [Week, Strand, Sub-strand, Learning Concept]
          week = row[0];     // Week
          concept = row[3];  // Learning Concept
          term = 'Term 1';
        } else if (row.length >= 2) {
          week = row[0];
          concept = row[1];
          term = 'Term 1';
        }
        
        // Validate
        if (week && concept && concept.length > 10) {
          const weekMatch = week.toString().match(/(\d+)/);
          const weekNumber = weekMatch ? parseInt(weekMatch[1]) : index + 1;
          
          extractedConcepts.push({
            term: term || 'Term 1',
            week: `Week ${weekNumber}`,
            weekNumber: weekNumber,
            concept: concept.toString()
          });
        }
      });
      
      console.log('[useEffect] Extracted from ContentParser:', extractedConcepts.length, 'concepts');
      if (extractedConcepts.length > 0) {
        console.log('[useEffect] Sample concept:', extractedConcepts[0]);
      }
      setConcepts(extractedConcepts);
      setTotalLessons(extractedConcepts.length);
    }
  }
}, [document]);

  const extractConceptsFromContent = (content) => {
    if (!content) return [];
    
    const concepts = [];
    const lines = content.split('\n');
    let inTable = false;
    let headerFound = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Look for table header
      if (!headerFound && trimmedLine.includes('|') && 
          (trimmedLine.toLowerCase().includes('term') || 
           trimmedLine.toLowerCase().includes('week') || 
           trimmedLine.toLowerCase().includes('learning concept'))) {
        headerFound = true;
        inTable = true;
        continue;
      }
      
      // Skip separator lines
      if (trimmedLine.match(/^[\|\-\s:]+$/)) {
        continue;
      }
      
      // Process data rows
      if (inTable && trimmedLine.includes('|')) {
        const cells = trimmedLine.split('|')
          .map(c => c.trim())
          .filter(c => c && c !== '');
        
        // Expected format: | Term | Week | Strand | Sub-strand | Learning Concept |
        if (cells.length >= 5) {
          const week = cells[1];
          const concept = cells[4];
          
          // Validate it's a real data row
          const isValidRow = 
            concept && 
            concept.length > 10 && 
            week && week.toLowerCase().includes('week') &&
            !concept.toLowerCase().includes('learning concept') &&
            !concept.toLowerCase().includes('strand') &&
            !concept.toLowerCase().includes('sub-strand');
          
          if (isValidRow) {
            concepts.push({
              week: week,
              concept: concept
            });
          }
        }
      }
    }
    
    return concepts;
  };

  const generateLessonPlan = async () => {
    if (generating) return;
    
    // Validate before proceeding
    if (!document?._id) {
      setError('Document ID is missing');
      return;
    }
    
    if (selectedLesson < 1 || selectedLesson > concepts.length) {
      setError(`Please select a valid lesson (1-${concepts.length})`);
      return;
    }

    const selectedConcept = concepts[selectedLesson - 1];
    if (!selectedConcept) {
      setError('Selected lesson concept not found');
      return;
    }

    try {
      setGenerating(true);
      setError(null);
      
      console.log('🚀 Generating Lesson Plan for lesson:', selectedLesson);
      console.log('📚 Selected concept:', selectedConcept.concept.substring(0, 50));

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }
      
      const response = await fetch(
        `${API_BASE_URL}/documents/generate-lesson-plan-from-breakdown/${document._id}`, 
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            lessonNumber: selectedLesson,
            teacherName: document.teacherName || 'Teacher',
            school: document.school || 'School',
            date: new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }),
            time: '7:30 am – 8:10 am'
          })
        }
      );

      const data = await response.json();
      console.log('📦 Response:', data);

      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP ${response.status}: Failed to generate lesson plan`);
      }

      // Better success handling
      if (data.success) {
        const planId = data.document?._id || data.documentId;
        if (planId) {
          console.log('✅ Success! Redirecting to document:', planId);
          alert(`✅ Lesson Plan generated for "${selectedConcept.concept.substring(0, 50)}..."!`);
          
          // Use window.location for reliable navigation
          setTimeout(() => {
            window.location.href = `/documents/${planId}`;
          }, 1000);
        } else {
          throw new Error('Document ID not found in response');
        }
      } else {
        throw new Error(data.message || 'Generation failed');
      }

    } catch (err) {
      console.error('❌ Generation failed:', err);
      setError(err.message || 'Failed to generate lesson plan');
      alert('Error: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const selectedConcept = concepts[selectedLesson - 1];

  // Disabled conditions
  const isButtonDisabled = 
    generating || 
    concepts.length === 0 || 
    !selectedConcept || 
    selectedLesson < 1 || 
    selectedLesson > concepts.length ||
    !document?._id;
    

  return (
    <div className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg overflow-hidden mb-6">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="bg-purple-600 p-2 rounded-lg">
            <FileText className="w-5 h-5 text-white" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-bold text-purple-900 text-sm">
              Generate Lesson Plan
            </h3>
            <p className="text-xs text-purple-700">
              Create a detailed lesson plan for a specific lesson from this breakdown
            </p>
            {concepts.length > 0 && (
              <p className="text-xs text-purple-600 mt-1">
                {concepts.length} lesson concepts found
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 hover:bg-purple-100 rounded transition-colors"
            disabled={concepts.length === 0}
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-purple-700" />
            ) : (
              <ChevronDown className="w-4 h-4 text-purple-700" />
            )}
          </button>
        </div>
      </div>

      {/* Error in concept extraction */}
      {extractionError && (
        <div className="border-t border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-start gap-2 text-sm">
            <Info className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-yellow-700 font-medium">Note: </span>
              <span className="text-yellow-700">{extractionError}</span>
            </div>
          </div>
        </div>
      )}

      {/* Expandable Content */}
      {expanded && (
        <div className="border-t border-purple-200 bg-white p-4">
          {concepts.length > 0 ? (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Lesson Number (1-{totalLessons})
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min="1"
                    max={totalLessons}
                    value={selectedLesson}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val >= 1 && val <= totalLessons) {
                        setSelectedLesson(val);
                      }
                    }}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <span className="text-sm text-gray-600">of {totalLessons} lessons</span>
                </div>
              </div>

              {selectedConcept && (
                <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="text-xs font-medium text-purple-700 mb-1">
                    {selectedConcept.week} - Lesson {selectedLesson}
                  </div>
                  <div className="text-sm text-purple-900 font-medium">
                    {selectedConcept.concept}
                  </div>
                </div>
              )}

              <button
                onClick={generateLessonPlan}
                disabled={isButtonDisabled}
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium transition-colors"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating Lesson Plan...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Generate Lesson Plan for Lesson {selectedLesson}
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 text-sm">
                No learning concepts found. This document might not be a valid Lesson Concept Breakdown.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
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

      {/* Generating Status */}
      {generating && (
        <div className="border-t border-purple-200 bg-purple-50 p-3">
          <div className="flex items-start gap-2 text-sm">
            <Loader2 className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5 animate-spin" />
            <div>
              <span className="text-purple-700 font-medium">Generating... </span>
              <span className="text-purple-700">
                Creating lesson plan for: "{selectedConcept?.concept?.substring(0, 50)}..."
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerateLessonPlanButton;