import React, { useEffect, useState } from 'react';
import { FileText, Download, Clock, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import API from "@/api";

export default function RecentDocuments({ userId }) {
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchRecentDownloads = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log("📥 Fetching recent downloads for user:", userId);
        const res = await API.get(`/documents/recent-downloads/${userId}`);
        
        console.log("Download data received:", res.data);

        if (res.data.success && Array.isArray(res.data.downloads)) {
          setDownloads(res.data.downloads);
        } else {
          setDownloads([]);
        }

      } catch (err) {
        console.error("Error fetching recent downloads:", err);
        setError('Failed to load recent downloads');
        setDownloads([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentDownloads();

    // Listen for new download events
    const handleNewDownload = () => {
      console.log('🔄 New download detected, refreshing list...');
      fetchRecentDownloads();
    };

    window.addEventListener('documentDownloaded', handleNewDownload);

    return () => {
      window.removeEventListener('documentDownloaded', handleNewDownload);
    };
  }, [userId]);

  const getTimeAgo = (date) => {
    const now = new Date();
    const diffInMs = now - new Date(date);
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return new Date(date).toLocaleDateString();
  };

  const handleViewDocument = (documentId) => {
    if (documentId) {
      window.open(`/document/${documentId}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Download className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Recent Downloads</h3>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading downloads...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Download className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Recent Downloads</h3>
        </div>
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-2" />
          <p className="text-red-600">{error}</p>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        {downloads.length > 0 && (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {downloads.length} {downloads.length === 1 ? 'item' : 'items'}
          </Badge>
        )}
      </div>

      {/* Downloads List */}
      {downloads.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
          <Download className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No downloads yet</p>
          <p className="text-gray-400 text-sm mt-1">
            Documents you download will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {downloads.map((download) => (
            <Card 
              key={download._id} 
              className="border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer"
              onClick={() => handleViewDocument(download.documentId)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <span className="font-medium text-gray-900 truncate">
                        {download.documentType || 'Document'}
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      {download.grade && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Grade:</span>
                          <span>{download.grade}</span>
                        </div>
                      )}
                      
                      {download.subject && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Subject:</span>
                          <span className="truncate">{download.subject}</span>
                        </div>
                      )}
                      
                      {download.learningArea && download.learningArea !== download.subject && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Area:</span>
                          <span className="truncate">{download.learningArea}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        Downloaded {getTimeAgo(download.downloadedAt)}
                      </span>
                    </div>
                  </div>

                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs whitespace-nowrap">
                    Downloaded
                  </Badge>
                </div>

                {/* Document details if available */}
                {download.documentDetails && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <div className="flex flex-wrap gap-1">
                      {download.documentDetails.strand && (
                        <Badge variant="outline" className="text-xs">
                          {download.documentDetails.strand}
                        </Badge>
                      )}
                      {download.documentDetails.substrand && (
                        <Badge variant="outline" className="text-xs">
                          {download.documentDetails.substrand}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {download.error && (
                  <div className="mt-2">
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                      Document unavailable
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      {downloads.length > 0 && (
        <div className="pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>Total downloads this session</span>
            <span className="font-semibold">{downloads.length}</span>
          </div>
        </div>
      )}
    </div>
  );
}