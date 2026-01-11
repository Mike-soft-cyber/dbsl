import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Eye, RefreshCw, Mail, FileText, Calendar } from 'lucide-react';

export default function PendingReviewsDashboard() {
  const [pendingEntries, setPendingEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPendingEntries = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('http://localhost:5000/api/cbc-review/pending/all');
      
      if (!response.ok) {
        throw new Error('Failed to fetch pending entries');
      }

      const data = await response.json();
      setPendingEntries(data.entries || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPendingEntries();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchPendingEntries, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock, text: 'Pending Review' },
      approved: { color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle, text: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800 border-red-300', icon: XCircle, text: 'Rejected' }
    };
    
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badge.color}`}>
        <Icon className="w-3.5 h-3.5" />
        {badge.text}
      </span>
    );
  };

  if (loading && pendingEntries.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading pending reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                📋 Pending Reviews
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Review and approve extracted CBC curriculum data
              </p>
            </div>
            
            <button
              onClick={fetchPendingEntries}
              disabled={refreshing}
              className="flex items-center gap-2 px-5 py-3 bg-white text-blue-600 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 border-2 border-blue-200"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-semibold mb-1">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {pendingEntries.filter(e => e.status === 'pending').length}
                  </p>
                </div>
                <Clock className="w-12 h-12 text-yellow-500 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-semibold mb-1">Approved</p>
                  <p className="text-3xl font-bold text-green-600">
                    {pendingEntries.filter(e => e.status === 'approved').length}
                  </p>
                </div>
                <CheckCircle className="w-12 h-12 text-green-500 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-semibold mb-1">Rejected</p>
                  <p className="text-3xl font-bold text-red-600">
                    {pendingEntries.filter(e => e.status === 'rejected').length}
                  </p>
                </div>
                <XCircle className="w-12 h-12 text-red-500 opacity-20" />
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-800">Error loading data</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Entries List */}
        {pendingEntries.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">No Pending Reviews</h3>
            <p className="text-gray-600 mb-6">
              Email a CBC PDF to start the extraction process
            </p>
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-50 text-blue-700 rounded-lg font-semibold">
              <Mail className="w-5 h-5" />
              Send PDF to your configured email address
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingEntries.map((entry) => (
              <div
                key={entry._id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden border-2 border-gray-100"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="w-6 h-6 text-blue-600" />
                        <h3 className="text-xl font-bold text-gray-800">
                          {entry.filename}
                        </h3>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-4 h-4" />
                          {entry.sourceEmail}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          {formatDate(entry.createdAt)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {getStatusBadge(entry.status)}
                    </div>
                  </div>

                  {/* Data Preview */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 mb-4">
                    <h4 className="font-semibold text-gray-800 mb-3 text-sm">Extracted Data Preview</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-600 font-semibold mb-1">Grade</p>
                        <p className="text-sm font-bold text-blue-700">
                          {entry.extractedData?.grade || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-semibold mb-1">Learning Area</p>
                        <p className="text-sm font-bold text-green-700">
                          {entry.extractedData?.learningArea || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-semibold mb-1">Strand</p>
                        <p className="text-sm font-bold text-purple-700">
                          {entry.extractedData?.strand || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-semibold mb-1">Substrand</p>
                        <p className="text-sm font-bold text-orange-700">
                          {entry.extractedData?.substrand || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="mt-4 pt-4 border-t border-blue-200 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-gray-600">SLOs:</span>
                        <span className="ml-2 font-semibold text-gray-800">
                          {entry.extractedData?.slo?.length || 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Assessments:</span>
                        <span className="ml-2 font-semibold text-gray-800">
                          {entry.extractedData?.assessment?.length || 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Competencies:</span>
                        <span className="ml-2 font-semibold text-gray-800">
                          {entry.extractedData?.coreCompetencies?.length || 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Values:</span>
                        <span className="ml-2 font-semibold text-gray-800">
                          {entry.extractedData?.values?.length || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  {entry.status === 'pending' && (
                    <div className="flex justify-end">
                      <a
                        href={`/review?token=${entry.reviewToken}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
                      >
                        <Eye className="w-5 h-5" />
                        Review & Approve
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-start gap-4">
            <Mail className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">How to Add New Entries</h3>
              <p className="text-gray-600 text-sm mb-3">
                Email CBC curriculum PDFs to the configured email address. The system will automatically extract
                the data and send you a review link.
              </p>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">Email worker status:</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-800 rounded-full font-semibold">
                  <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                  Running
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}