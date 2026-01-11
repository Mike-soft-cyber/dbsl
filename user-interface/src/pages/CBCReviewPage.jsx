import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Edit2, AlertCircle, Loader2, Plus, Minus, ArrowLeft } from 'lucide-react';

export default function CBCReviewPage() {
  // Get token from URL (you'll need to pass this as a prop in your actual app)
  const token = new URLSearchParams(window.location.search).get('token') || 'demo-token';
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [editedData, setEditedData] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchPendingEntry();
  }, []);

  const fetchPendingEntry = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/cbc-review/${token}`);
      
      if (!response.ok) {
        throw new Error('Entry not found or has expired');
      }
      
      const result = await response.json();
      setData(result.extractedData);
      setEditedData(result.extractedData);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field, index, value) => {
    const newArray = [...editedData[field]];
    newArray[index] = value;
    setEditedData(prev => ({
      ...prev,
      [field]: newArray
    }));
  };

  const addArrayItem = (field) => {
    setEditedData(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), '']
    }));
  };

  const removeArrayItem = (field, index) => {
    const newArray = editedData[field].filter((_, i) => i !== index);
    setEditedData(prev => ({
      ...prev,
      [field]: newArray
    }));
  };

  const handleAssessmentChange = (index, field, value) => {
    const newAssessment = [...editedData.assessment];
    newAssessment[index][field] = value;
    setEditedData(prev => ({
      ...prev,
      assessment: newAssessment
    }));
  };

  const addAssessment = () => {
    setEditedData(prev => ({
      ...prev,
      assessment: [...(prev.assessment || []), {
        skill: '',
        exceeds: '',
        meets: '',
        approaches: '',
        below: ''
      }]
    }));
  };

  const removeAssessment = (index) => {
    const newAssessment = editedData.assessment.filter((_, i) => i !== index);
    setEditedData(prev => ({
      ...prev,
      assessment: newAssessment
    }));
  };

  const handleApprove = async () => {
    try {
      setSaving(true);
      const response = await fetch(`http://localhost:5000/api/cbc-review/${token}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedData)
      });

      if (!response.ok) throw new Error('Failed to save');

      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/cbc-data';
      }, 2000);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    if (!confirm('Are you sure you want to reject this entry?')) return;

    try {
      setSaving(true);
      await fetch(`http://localhost:5000/api/cbc-review/${token}/reject`, {
        method: 'POST'
      });
      alert('Entry rejected');
      window.location.href = '/cbc-data';
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading data for review...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.href = '/cbc-data'}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Success!</h2>
          <p className="text-gray-600 mb-6">CBC entry has been approved and saved to database.</p>
          <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => window.location.href = '/cbc-data'}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                📝 Review CBC Entry
              </h1>
              <p className="text-gray-600 mt-1">Review and edit extracted curriculum data before saving</p>
            </div>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-800 font-semibold">Please Review Carefully</p>
                <p className="text-yellow-700 text-sm mt-1">
                  AI-extracted data may not be 100% accurate. Please verify all fields before approving.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
          {/* Basic Information */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-blue-600" />
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Grade *</label>
                <input
                  type="text"
                  value={editedData?.grade || ''}
                  onChange={(e) => handleFieldChange('grade', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Grade 7, PP 1"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Learning Area *</label>
                <input
                  type="text"
                  value={editedData?.learningArea || ''}
                  onChange={(e) => handleFieldChange('learningArea', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Mathematics, English"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Strand *</label>
                <input
                  type="text"
                  value={editedData?.strand || ''}
                  onChange={(e) => handleFieldChange('strand', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Numbers, Speaking"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Substrand *</label>
                <input
                  type="text"
                  value={editedData?.substrand || ''}
                  onChange={(e) => handleFieldChange('substrand', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Addition, Comprehension"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Age Range</label>
                <input
                  type="text"
                  value={editedData?.ageRange || ''}
                  onChange={(e) => handleFieldChange('ageRange', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 12-14 years"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Lesson Duration (min)</label>
                <input
                  type="number"
                  value={editedData?.lessonDuration || ''}
                  onChange={(e) => handleFieldChange('lessonDuration', parseInt(e.target.value) || null)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 40"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Lessons per Week</label>
                <input
                  type="number"
                  value={editedData?.lessonsPerWeek || ''}
                  onChange={(e) => handleFieldChange('lessonsPerWeek', parseInt(e.target.value) || null)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 5"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Lessons</label>
                <input
                  type="number"
                  value={editedData?.noOfLessons || ''}
                  onChange={(e) => handleFieldChange('noOfLessons', parseInt(e.target.value) || null)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>

          {/* Array Fields */}
          {['slo', 'learningExperiences', 'keyInquiryQuestions', 'resources', 'coreCompetencies', 'values', 'pertinentIssues', 'linkToOtherSubjects', 'communityLinkActivities'].map(field => (
            <div key={field} className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {field === 'slo' ? 'Specific Learning Outcomes' : 
                   field.replace(/([A-Z])/g, ' $1').trim().replace(/^./, str => str.toUpperCase())}
                </h3>
                <button
                  onClick={() => addArrayItem(field)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-semibold text-sm"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>

              <div className="space-y-3">
                {editedData[field]?.map((item, index) => (
                  <div key={index} className="flex gap-3">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleArrayChange(field, index, e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={`Item #${index + 1}`}
                    />
                    {editedData[field].length > 1 && (
                      <button
                        onClick={() => removeArrayItem(field, index)}
                        className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Assessment Rubrics */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Assessment Rubrics</h3>
              <button
                onClick={addAssessment}
                className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors font-semibold text-sm"
              >
                <Plus className="w-4 h-4" /> Add Assessment
              </button>
            </div>

            {editedData?.assessment?.map((item, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-lg mb-4 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-700">Assessment #{index + 1}</h4>
                  {editedData.assessment.length > 1 && (
                    <button
                      onClick={() => removeAssessment(index)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-semibold"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <input
                    type="text"
                    value={item.skill}
                    onChange={(e) => handleAssessmentChange(index, 'skill', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Skill being assessed"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <textarea
                      value={item.exceeds}
                      onChange={(e) => handleAssessmentChange(index, 'exceeds', e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Exceeds expectations"
                      rows="2"
                    />
                    <textarea
                      value={item.meets}
                      onChange={(e) => handleAssessmentChange(index, 'meets', e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Meets expectations"
                      rows="2"
                    />
                    <textarea
                      value={item.approaches}
                      onChange={(e) => handleAssessmentChange(index, 'approaches', e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Approaches expectations"
                      rows="2"
                    />
                    <textarea
                      value={item.below}
                      onChange={(e) => handleAssessmentChange(index, 'below', e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Below expectations"
                      rows="2"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="border-t border-gray-200 pt-6 flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleApprove}
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {saving ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-6 h-6" />
                  Approve & Save to Database
                </>
              )}
            </button>

            <button
              onClick={handleReject}
              disabled={saving}
              className="px-8 py-4 bg-red-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              <XCircle className="w-6 h-6" />
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}