import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Download, FileText, Search, Calendar, Filter, Info, ExternalLink } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import API from "@/api";
import { Loader2 } from "lucide-react";

export default function DocDashboard() {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [downloadingIds, setDownloadingIds] = useState(new Set());

    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                const response = await API.get('/document-purchases');
                console.log("Fetched documents:", response.data);
                setDocuments(response.data);
            } catch (error) {
                console.error("Error fetching documents:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDocuments();
    }, []);

    const handleDelete = async (id) => {
        try {
            await API.delete(`/document-purchases/${id}`);
            setDocuments(documents.filter(doc => doc._id !== id));
        } catch (error) {
            console.error("Error deleting document:", error);
        }
    };

    // Updated download function that opens the actual document
    const handleDownload = (doc) => {
        if (!doc._id) {
            alert("Document ID not found. Cannot download.");
            return;
        }

        // Open the document in a new tab where users can download the actual content
        const documentUrl = `/documents/${doc._id}`;
        window.open(documentUrl, '_blank');
    };

    // Alternative: Direct download of the actual document content
    const handleDirectDownload = async (doc) => {
        setDownloadingIds(prev => new Set(prev).add(doc._id));
        
        try {
            // Fetch the actual document content from your document endpoint
            const response = await API.get(`/documents/${doc._id}`);
            const documentData = response.data.document || response.data;
            
            if (!documentData || !documentData.content) {
                alert("No document content found to download.");
                return;
            }

            // Create a text file with the actual document content
            const textContent = documentData.content.replace(/<[^>]*>/g, ''); // Strip HTML tags
            const blob = new Blob([textContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `${doc.documentType || 'document'}-${doc.grade || ''}-${doc.learningArea || ''}.txt`;
            link.click();
            
            URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error("Error downloading document:", error);
            alert("Failed to download document. Please try again.");
        } finally {
            setDownloadingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(doc._id);
                return newSet;
            });
        }
    };

    // Extract substrands from content as a fallback
    const extractSubstrandsFromContent = (content) => {
        if (!content) return [];
        
        try {
            const substrands = new Set();
            const lines = content.split('\n');
            
            for (const line of lines) {
                if (line.includes('|') && line.includes('Sub-strand')) {
                    const parts = line.split('|').filter(part => part.trim());
                    if (parts.length >= 4) {
                        const substrand = parts[3].trim();
                        if (substrand && substrand !== 'Sub-strand' && substrand !== '------------') {
                            substrands.add(substrand);
                        }
                    }
                }
            }
            
            return Array.from(substrands);
        } catch (error) {
            console.error("Error extracting substrands from content:", error);
            return [];
        }
    };

    // Helper function to normalize substrands (handle both string and array)
    const normalizeSubstrands = (substrands) => {
        if (!substrands) return [];
        
        if (Array.isArray(substrands)) {
            return substrands;
        }
        
        if (typeof substrands === 'string') {
            return [substrands];
        }
        
        return [];
    };

    // Helper function to get substrands from document
    const getSubstrands = (doc) => {
        // First try the substrands field (could be string or array)
        if (doc.substrands) {
            const normalized = normalizeSubstrands(doc.substrands);
            if (normalized.length > 0) {
                return normalized;
            }
        }
        
        // Then try to extract from content
        return extractSubstrandsFromContent(doc.content);
    };

    // Filter documents based on search term
    const filteredDocuments = documents.filter(doc => {
        if (!doc) return false;
        
        // Get substrands for search
        const docSubstrands = getSubstrands(doc);
        
        const searchableText = [
            doc.teacherName,
            doc.documentType,
            doc.grade,
            doc.learningArea,
            doc.strand,
            docSubstrands.join(' ')
        ].join(' ').toLowerCase();
        
        return searchableText.includes(searchTerm.toLowerCase());
    });

    // Helper function to safely handle substrands display
    const renderSubstrands = (doc) => {
        const substrands = getSubstrands(doc);
        
        if (!substrands || substrands.length === 0) {
            return (
                <span className="text-gray-400 text-sm italic">No substrands specified</span>
            );
        }
        
        return (
            <div className="flex flex-wrap gap-1">
                {substrands.map((substrand, index) => (
                    <Badge 
                        key={index} 
                        variant="outline" 
                        className="bg-gray-100 text-gray-700 text-xs"
                    >
                        {typeof substrand === 'string' ? substrand.trim() : JSON.stringify(substrand)}
                    </Badge>
                ))}
            </div>
        );
    };

    // Helper function to render status badge - REMOVED since status is not needed
    // const renderStatusBadge = (status) => { ... }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading documents...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">📄 Document Creations</h1>
                    <p className="text-gray-600 mt-1">Manage and track all documents made by teachers</p>
                </div>

                <Card className="bg-white rounded-xl shadow-md overflow-hidden border-0">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-teal-50 p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <CardTitle className="text-xl font-semibold text-gray-800">Document Creation History</CardTitle>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <Input
                                        placeholder="Search documents..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 pr-4 py-2 border-gray-300 rounded-lg w-full md:w-64"
                                    />
                                </div>
                                <Button variant="outline" className="border-gray-300 flex items-center gap-2">
                                    <Filter className="h-4 w-4" />
                                    Filter
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        {filteredDocuments.length > 0 ? (
                            <div className="overflow-x-auto rounded-lg border border-gray-200">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50">
                                            <TableHead className="font-semibold text-gray-700 py-4">Teacher</TableHead>
                                            <TableHead className="font-semibold text-gray-700 py-4">Document Type</TableHead>
                                            <TableHead className="font-semibold text-gray-700 py-4">Grade</TableHead>
                                            <TableHead className="font-semibold text-gray-700 py-4">Learning Area</TableHead>
                                            <TableHead className="font-semibold text-gray-700 py-4">Strand</TableHead>
                                            <TableHead className="font-semibold text-gray-700 py-4">Substrands</TableHead>
                                            <TableHead className="font-semibold text-gray-700 py-4">Date</TableHead>

                                            <TableHead className="font-semibold text-gray-700 py-4 text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredDocuments.map(doc => (
                                            <TableRow key={doc._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                                <TableCell className="py-4 font-medium text-gray-800">
                                                    {doc.teacherName || "N/A"}
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="h-4 w-4 text-blue-600" />
                                                        <span className="text-gray-700">{doc.documentType || "N/A"}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <Badge className="bg-blue-100 text-blue-800">
                                                        {doc.grade || "N/A"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-4 text-gray-700">
                                                    {doc.learningArea || "N/A"}
                                                </TableCell>
                                                <TableCell className="py-4 text-gray-700">
                                                    {doc.strand || "N/A"}
                                                </TableCell>
                                                <TableCell className="py-4 text-gray-700 max-w-xs">
                                                    {renderSubstrands(doc)}
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <Calendar className="h-4 w-4" />
                                                        <span className="text-sm">
                                                            {doc.date ? new Date(doc.date).toLocaleDateString() : "N/A"}
                                                        </span>
                                                    </div>
                                                </TableCell>

                                                <TableCell className="py-4">
                                                    <div className="flex justify-end gap-2">
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm"
                                                            onClick={() => handleDelete(doc._id)}
                                                            className="border-red-200 text-red-700 hover:bg-red-50 flex items-center gap-1"
                                                        >
                                                            {loading ? (
                                                                <>
                                                                <Loader2 />
                                                                </>
                                                            ) : (
                                                                <>
                                                                <Trash2 className="h-4 w-4" />
                                                                Delete
                                                                </>
                                                            )}
                                                        </Button>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm"
                                                            onClick={() => handleDownload(doc)}
                                                            disabled={downloadingIds.has(doc._id)}
                                                            className="border-teal-200 text-teal-700 hover:bg-teal-50 flex items-center gap-1 disabled:opacity-50"
                                                        >
                                                            <ExternalLink className="h-4 w-4" />
                                                            View Document
                                                        </Button>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm"
                                                            onClick={() => handleDirectDownload(doc)}
                                                            disabled={downloadingIds.has(doc._id)}
                                                            className="border-green-200 text-green-700 hover:bg-green-50 flex items-center gap-1 disabled:opacity-50"
                                                        >
                                                            <Download className="h-4 w-4" />
                                                            {downloadingIds.has(doc._id) ? 'Downloading...' : 'Download Text'}
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                                <p className="text-gray-500">No document purchases found</p>
                                {searchTerm && (
                                    <p className="text-sm text-gray-400 mt-1">
                                        No results for "{searchTerm}". Try a different search term.
                                    </p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}