import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CircleCheckBig, FileText, ArrowLeft, Link2, Info, AlertCircle, Loader2 } from "lucide-react";
import API from "@/api";
import { toast } from "sonner";

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state; // ✅ Get data from location state
  const userData = JSON.parse(localStorage.getItem("userData"));
  const teacherId = localStorage.getItem("teacherId");

  const [loading, setLoading] = useState(false);
  const [loadingBreakdowns, setLoadingBreakdowns] = useState(false);
  const [existingBreakdowns, setExistingBreakdowns] = useState([]);
  const [generationMode, setGenerationMode] = useState('independent');
  const [selectedBreakdown, setSelectedBreakdown] = useState(null);
  const [showLessonSelector, setShowLessonSelector] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(1);

  // ✅ Handle missing data (redirect back if no data)
  useEffect(() => {
    if (!data) {
      toast.error("No document data found");
      navigate('/createDocument');
    }
  }, [data, navigate]);

  // Check if this document type can be linked
  const canLink = data && ['Schemes of Work', 'Lesson Plan', 'Lesson Notes'].includes(data.type);

  // Fetch matching breakdowns on mount
  useEffect(() => {
    if (canLink && data) {
      fetchMatchingBreakdowns();
    }
  }, [canLink, data]);

  const fetchMatchingBreakdowns = async () => {
    try {
      setLoadingBreakdowns(true);
      
      // Fetch breakdowns matching grade, term, strand, substrand
      const res = await API.get(
        `/documents/breakdowns?grade=${data.grade}&term=${data.term}&strand=${encodeURIComponent(data.strand)}&substrand=${encodeURIComponent(data.substrand)}&teacher=${teacherId}`
      );
      
      setExistingBreakdowns(res.data.breakdowns || []);
      
      // Auto-select if only one matching breakdown
      if (res.data.breakdowns?.length === 1) {
        setSelectedBreakdown(res.data.breakdowns[0]._id);
        setGenerationMode('linked');
      }
      
    } catch (err) {
      console.error('Error fetching breakdowns:', err);
      setExistingBreakdowns([]);
    } finally {
      setLoadingBreakdowns(false);
    }
  };

  const handleGenerateDocument = async () => {
    try {
      setLoading(true);

      // LINKED GENERATION
      if (generationMode === 'linked' && selectedBreakdown) {
        console.log('🔗 Generating linked document from breakdown:', selectedBreakdown);
        
        // For Schemes of Work
        if (data.type === 'Schemes of Work') {
          const res = await API.post(
            `/documents/generate-scheme-from-breakdown/${selectedBreakdown}`,
            {
              teacherName: data.teacherName || userData?.name,
              school: data.school
            }
          );
          
          if (res.data.success) {
            alert(`✅ Scheme of Work generated with ${res.data.conceptsUsed} lessons!`);
            const documentId = res.data.document?._id || res.data.documentId;
            if (documentId) {
              window.location.href = `/documents/${documentId}`;
            }
          }
          return;
        }
        
        // For Lesson Plan
        if (data.type === 'Lesson Plan') {
          setShowLessonSelector(true);
          setLoading(false);
          return;
        }
        
        // For Lesson Notes (future implementation)
        if (data.type === 'Lesson Notes') {
          const res = await API.post(
            `/documents/generate-notes-from-breakdown/${selectedBreakdown}`,
            {
              teacherName: data.teacherName || userData?.name,
              school: data.school
            }
          );
          
          if (res.data.success) {
            alert('✅ Lesson Notes generated!');
            window.location.href = `/documents/${res.data.document._id}`;
          }
          return;
        }
      }

      // INDEPENDENT GENERATION (original method)
      const payload = {
        type: data.type,
        term: data.term,
        grade: data.grade,
        stream: data.stream,
        teacher: teacherId,
        teacherName: data.teacherName || userData?.name,
        school: data.school || "Unknown School",
        weeks: data.weeks || 12,
        lessonsPerWeek: data.lessonsPerWeek || 5,
        learningArea: data.learningArea,
        strand: data.strand,
        substrand: data.substrand,
        time: data.time
      };

      console.log("📤 Sending payload:", payload);

      const res = await API.post(`/documents/generate`, payload);
      
      console.log("📥 Response received:", res.data);
      
      if (res.data.success) {
        alert("✅ Document generated successfully!");
        
        const documentId = res.data.document?._id || res.data.documentId;
        
        if (documentId) {
          console.log("✅ Navigating to document:", documentId);
          window.location.href = `/documents/${documentId}`;
        } else {
          console.error("❌ No document ID in response:", res.data);
          alert("Document generated but ID not found. Please check your documents.");
          window.location.href = '/my-documents';
        }
      } else {
        throw new Error(res.data.error || "Failed to generate document");
      }
    } catch (err) {
      console.error("❌ Error generating document:", err);
      alert(err.message || "Failed to generate document");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLessonPlan = async () => {
    try {
      setLoading(true);
      
      const res = await API.post(
        `/documents/generate-lesson-plan-from-breakdown/${selectedBreakdown}`,
        {
          lessonNumber: selectedLesson,
          teacherName: data.teacherName || userData?.name,
          school: data.school,
          date: new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }),
          time: data.time || '7:30 am – 8:10 am'
        }
      );
      
      if (res.data.success) {
        alert(`✅ Lesson Plan generated for lesson ${selectedLesson}!`);
        window.location.href = `/documents/${res.data.document._id}`;
      }
    } catch (err) {
      console.error('Error generating lesson plan:', err);
      alert(err.message);
    } finally {
      setLoading(false);
      setShowLessonSelector(false);
    }
  };

  const handleBack = () => {
    navigate('/createDocument');
  };

  // ✅ Early return if no data
  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 text-center">
          <p className="text-gray-600 mb-4">
            No document data found.
          </p>
          <button
            onClick={() => navigate('/createDocument')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg"
          >
            Return to Document Creation
          </button>
        </div>
      </div>
    );
  }

  const matchingBreakdowns = existingBreakdowns.filter(
    bd => bd.grade === data.grade && 
          bd.term === data.term && 
          bd.strand === data.strand &&
          bd.substrand === data.substrand
  );

  const hasMatchingBreakdown = matchingBreakdowns.length > 0;

  // Lesson Selector Modal
  if (showLessonSelector) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Select Lesson Number</h2>
          
          <p className="text-sm text-gray-600 mb-4">
            Choose which lesson from the breakdown to create a lesson plan for:
          </p>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lesson Number (1-{data.totalRows})
            </label>
            <input
              type="number"
              min="1"
              max={data.totalRows}
              value={selectedLesson}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (val >= 1 && val <= data.totalRows) {
                  setSelectedLesson(val);
                }
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowLessonSelector(false)}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerateLessonPlan}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={handleBack}
            className="bg-white text-gray-700 border border-gray-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-all hover:bg-gray-50"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="bg-white p-6 rounded-2xl shadow-lg flex-1 border border-gray-100">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Document Preview
            </h1>
            <p className="text-gray-600 mt-2">
              Review your document details before generation
            </p>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-green-600 h-2 w-full"></div>
          
          {/* Document Details Section */}
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <CircleCheckBig className="text-green-600 w-6 h-6" />
              <h2 className="text-xl font-semibold text-gray-800">
                Document Details
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-1">
                <span className="text-sm font-semibold text-gray-600">Document Type</span>
                <p className="text-gray-800 font-medium">{data.type}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-semibold text-gray-600">Term</span>
                <p className="text-gray-800 font-medium">{data.term}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-semibold text-gray-600">Grade</span>
                <p className="text-gray-800 font-medium">{data.grade}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-semibold text-gray-600">Stream</span>
                <p className="text-gray-800 font-medium">{data.stream}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-semibold text-gray-600">Facilitator</span>
                <p className="text-gray-800 font-medium">{data.teacherName}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-semibold text-gray-600">Learning Area</span>
                <p className="text-gray-800 font-medium">{data.learningArea}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-semibold text-gray-600">Strand</span>
                <p className="text-gray-800 font-medium">{data.strand}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-semibold text-gray-600">Substrand</span>
                <p className="text-gray-800 font-medium">{data.substrand}</p>
              </div>
              <div className="space-y-1 md:col-span-2">
                <span className="text-sm font-semibold text-gray-600">Total Lessons</span>
                <p className="text-blue-600 font-bold text-lg">
                  {data.totalRows} lessons
                  <span className="text-gray-500 text-sm ml-2">
                    ({data.weeks} weeks × {data.lessonsPerWeek} lessons/week)
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Generation Mode Section */}
          {canLink && (
            <div className="border-t border-gray-200 bg-gray-50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Link2 className="text-blue-600 w-5 h-5" />
                <h3 className="text-lg font-semibold text-gray-800">
                  Generation Options
                </h3>
              </div>

              {loadingBreakdowns ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Checking for existing breakdowns...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Independent Generation Option */}
                  <label className="flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md bg-white"
                    style={{ borderColor: generationMode === 'independent' ? '#3b82f6' : '#e5e7eb' }}
                  >
                    <input
                      type="radio"
                      name="mode"
                      value="independent"
                      checked={generationMode === 'independent'}
                      onChange={() => {
                        setGenerationMode('independent');
                        setSelectedBreakdown(null);
                      }}
                      className="mt-1 w-4 h-4 text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800 mb-1">
                        Generate Independently
                      </div>
                      <p className="text-sm text-gray-600">
                        Create a new {data.type} with AI-generated content based on CBC curriculum data
                      </p>
                    </div>
                  </label>

                  {/* Linked Generation Option */}
                  {hasMatchingBreakdown ? (
                    <label className="flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md bg-white"
                      style={{ borderColor: generationMode === 'linked' ? '#3b82f6' : '#e5e7eb' }}
                    >
                      <input
                        type="radio"
                        name="mode"
                        value="linked"
                        checked={generationMode === 'linked'}
                        onChange={() => setGenerationMode('linked')}
                        className="mt-1 w-4 h-4 text-blue-600"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-800">
                            Link to Existing Breakdown
                          </span>
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            Recommended
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          Generate {data.type} using concepts from an existing Lesson Concept Breakdown
                        </p>

                        {generationMode === 'linked' && (
                          <div className="mt-3 space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                              Select Breakdown:
                            </label>
                            {matchingBreakdowns.map((bd) => (
                              <label
                                key={bd._id}
                                className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                              >
                                <input
                                  type="radio"
                                  name="breakdown"
                                  value={bd._id}
                                  checked={selectedBreakdown === bd._id}
                                  onChange={() => setSelectedBreakdown(bd._id)}
                                  className="w-4 h-4 text-blue-600"
                                />
                                <div className="flex-1">
                                  <div className="font-medium text-gray-800">
                                    {bd.substrand}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {bd.conceptCount} concepts • Created {new Date(bd.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </label>
                  ) : (
                    <div className="p-4 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-medium text-gray-600 mb-1">
                            No Matching Breakdown Found
                          </div>
                          <p className="text-sm text-gray-500">
                            Create a Lesson Concept Breakdown for this substrand first to enable linked generation
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Info Banner for Linked Generation */}
              {generationMode === 'linked' && selectedBreakdown && (
                <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-600 rounded-r-lg">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-blue-900 font-medium mb-1">
                        Benefits of Linked Generation:
                      </p>
                      <ul className="text-blue-800 space-y-1 list-disc list-inside">
                        <li>Uses actual learning concepts from your breakdown</li>
                        <li>Ensures consistency across documents</li>
                        <li>No repetitive or generic content</li>
                        <li>Documents are trackable and connected</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Warning for Lesson Concept Breakdown */}
          {data.type === 'Lesson Concept Breakdown' && (
            <div className="border-t border-gray-200 bg-yellow-50 p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-yellow-900 font-medium mb-1">
                    📚 Recommended: Generate This First
                  </p>
                  <p className="text-yellow-800">
                    Create this Lesson Concept Breakdown first, then use it to generate linked Schemes of Work and Lesson Plans with consistent content
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <div className="border-t border-gray-200 p-6">
            <button
              onClick={handleGenerateDocument}
              disabled={loading || (generationMode === 'linked' && !selectedBreakdown)}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-5 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Document...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  {generationMode === 'linked' ? 'Generate Linked Document' : 'Generate Document Now'}
                </>
              )}
            </button>

            {generationMode === 'linked' && !selectedBreakdown && (
              <p className="text-sm text-red-600 text-center mt-2">
                Please select a breakdown to continue
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}