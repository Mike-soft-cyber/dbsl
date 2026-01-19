import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Download, FileText, Search, Calendar, Filter, ExternalLink, School } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import API from "@/api";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function DocDashboard() {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [downloadingIds, setDownloadingIds] = useState(new Set());
    const [schoolCode, setSchoolCode] = useState("");
    const [error, setError] = useState(null);

    useEffect(() => {
        // Get school code from user data
        const userData = JSON.parse(localStorage.getItem('userData'));
        
        if (!userData) {
            toast.error('Please login again');
            setLoading(false);
            return;
        }
        
        const userSchoolCode = userData.schoolCode || localStorage.getItem('schoolCode');
        
        if (!userSchoolCode) {
            setError("School code not found. Please set your school code first.");
            setLoading(false);
            return;
        }
        
        setSchoolCode(userSchoolCode);
        fetchDocuments(userSchoolCode);
    }, []);

    const fetchDocuments = async (schoolCode) => {
        setLoading(true);
        setError(null);
        try {
            const response = await API.get(`/document-purchases?schoolCode=${schoolCode}`);
            console.log(`Fetched documents for school ${schoolCode}:`, response.data);
            setDocuments(response.data);
        } catch (error) {
            console.error("Error fetching documents:", error);
            setError("Failed to fetch documents. Please try again.");
            if (error.response?.status === 400) {
                toast.error("School code is required");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
            return;
        }
        
        try {
            await API.delete(`/document-purchases/${id}?schoolCode=${schoolCode}`);
            setDocuments(documents.filter(doc => doc._id !== id));
            toast.success("Document deleted successfully");
        } catch (error) {
            console.error("Error deleting document:", error);
            if (error.response?.status === 403) {
                toast.error("Unauthorized: You can only delete documents from your school");
            } else {
                toast.error("Failed to delete document");
            }
        }
    };

    const handleDownload = (doc) => {
        if (!doc._id) {
            alert("Document ID not found. Cannot download.");
            return;
        }

        // Open the document in a new tab where users can download the actual content
        const documentUrl = `/documents/${doc._id}`;
        window.open(documentUrl, '_blank');
    };

    const handleDirectDownload = async (doc) => {
        setDownloadingIds(prev => new Set(prev).add(doc._id));
        
        try {
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
            toast.success("Document downloaded successfully");
            
        } catch (error) {
            console.error("Error downloading document:", error);
            toast.error("Failed to download document. Please try again.");
        } finally {
            setDownloadingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(doc._id);
                return newSet;
            });
        }
    };

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

    const getSubstrands = (doc) => {
        if (doc.substrands) {
            const normalized = normalizeSubstrands(doc.substrands);
            if (normalized.length > 0) {
                return normalized;
            }
        }
        
        return extractSubstrandsFromContent(doc.content);
    };

    const filteredDocuments = documents.filter(doc => {
        if (!doc) return false;
        
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

    const refreshData = () => {
        if (schoolCode) {
            fetchDocuments(schoolCode);
        }
    };

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

    if (error && !schoolCode) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                <div className="text-center max-w-md">
                    <School className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">School Code Required</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <Button onClick={() => {
                        const enteredSchoolCode = prompt('Please enter your school code:');
                        if (enteredSchoolCode) {
                            localStorage.setItem('schoolCode', enteredSchoolCode);
                            setSchoolCode(enteredSchoolCode);
                            fetchDocuments(enteredSchoolCode);
                        }
                    }}>
                        Enter School Code
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">📄 Document Creations</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-gray-600">Manage documents for</p>
                                <Badge variant="secondary" className="font-mono">
                                    {schoolCode}
                                </Badge>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={refreshData}
                                    className="h-8 w-8 p-0"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </Button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-sm">
                                {filteredDocuments.length} {filteredDocuments.length === 1 ? 'Document' : 'Documents'}
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="h-5 w-5 text-red-500">
                                    <svg fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <p className="text-red-700">{error}</p>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={refreshData}
                                className="text-red-700 hover:bg-red-100"
                            >
                                Retry
                            </Button>
                        </div>
                    </div>
                )}

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
                                                            <Trash2 className="h-4 w-4" />
                                                            Delete
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
                                <p className="text-gray-500">No documents found for school {schoolCode}</p>
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