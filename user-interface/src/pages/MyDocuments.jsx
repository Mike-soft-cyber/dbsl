import React, { useState, useEffect, useRef } from 'react';
import { FileText, Search, Calendar, BookOpen, X, Eye, Filter, ChevronDown, Loader, Trash2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';

export default function MyDocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [filters, setFilters] = useState({
    documentTypes: [],
    grades: [],
    subjects: [],
    status: []
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    document: null,
    loading: false
  });
  const searchInputRef = useRef(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const currentUserId = userData._id;
  const currentUserName = `${userData.firstName} ${userData.lastName}`;

  // Available filter options
  const filterOptions = {
    documentTypes: ['Lesson Plan', 'Lesson Notes', 'Exercises', 'Schemes of Work', 'Lesson Concept Breakdown'],
    grades: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'],
    subjects: ['Mathematics', 'English', 'Science', 'Social Studies', 'Kiswahili', 'CRE', 'IRE', 'Home Science'],
    status: ['completed', 'pending', 'generating']
  };

  const fetchMyDocuments = async (page = 1, search = '', filterParams = {}) => {
  setLoading(true);
  setIsSearching(true);
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '10',
      populate: 'cbcEntry', // Add this to populate cbcEntry
      ...(search && { search }),
      ...(filterParams.documentTypes?.length && { types: filterParams.documentTypes.join(',') }),
      ...(filterParams.grades?.length && { grades: filterParams.grades.join(',') }),
      ...(filterParams.subjects?.length && { subjects: filterParams.subjects.join(',') }),
      ...(filterParams.status?.length && { status: filterParams.status.join(',') })
    });

    const response = await fetch(
      `${API_BASE_URL}/documents/teachers/${currentUserId}?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
      const data = await response.json();
      
      if (data.success) {
        setDocuments(data.documents || []);
        setPagination(data.pagination || {});
      } else {
        setDocuments([]);
        setPagination(null);
      }
    } catch (error) {
      console.error('Error fetching my documents:', error);
      setDocuments([]);
      setPagination(null);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  // Delete document function
  const deleteDocument = async (documentId) => {
    setDeleteDialog(prev => ({ ...prev, loading: true }));
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/documents/${documentId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Document deleted successfully');
        // Remove the document from the local state
        setDocuments(prev => prev.filter(doc => doc._id !== documentId));
        // Update pagination total
        if (pagination) {
          setPagination(prev => ({
            ...prev,
            total: prev.total - 1
          }));
        }
      } else {
        throw new Error(data.error || 'Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error(error.message || 'Failed to delete document');
    } finally {
      setDeleteDialog({ open: false, document: null, loading: false });
    }
  };

  const handleDeleteClick = (document) => {
    setDeleteDialog({
      open: true,
      document: document,
      loading: false
    });
  };

  const handleConfirmDelete = () => {
    if (deleteDialog.document) {
      deleteDocument(deleteDialog.document._id);
    }
  };

  // Debounced search
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      setCurrentPage(1);
      fetchMyDocuments(1, searchTerm, filters);
    }, 500);

    setSearchTimeout(timeout);

    return () => clearTimeout(timeout);
  }, [searchTerm]);

  // Fetch when filters change
  useEffect(() => {
    setCurrentPage(1);
    fetchMyDocuments(1, searchTerm, filters);
  }, [filters]);

  useEffect(() => {
    if (currentUserId) {
      fetchMyDocuments(currentPage, searchTerm, filters);
    }
  }, [currentPage, currentUserId]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchMyDocuments(1, searchTerm, filters);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setFilters({
      documentTypes: [],
      grades: [],
      subjects: [],
      status: []
    });
    setCurrentPage(1);
    fetchMyDocuments(1, '', {});
    searchInputRef.current?.focus();
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType].includes(value)
        ? prev[filterType].filter(item => item !== value)
        : [...prev[filterType], value]
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      documentTypes: [],
      grades: [],
      subjects: [],
      status: []
    });
  };

  const handleViewDocument = (documentId) => {
    window.open(`/documents/${documentId}`, '_blank');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDocumentIcon = (type) => {
    switch (type) {
      case 'Lesson Plan': return <BookOpen className="h-5 w-5 text-blue-600" />;
      case 'Lesson Notes': return <FileText className="h-5 w-5 text-green-600" />;
      case 'Exercises': return <FileText className="h-5 w-5 text-purple-600" />;
      case 'Schemes of Work': return <FileText className="h-5 w-5 text-orange-600" />;
      case 'Lesson Concept Breakdown': return <FileText className="h-5 w-5 text-pink-600" />;
      default: return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Completed' },
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Pending' },
      failed: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Failed' },
      generating: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Generating' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <Badge variant="outline" className={config.color}>
        {config.label}
      </Badge>
    );
  };

  // Count active filters
  const activeFilterCount = Object.values(filters).reduce((count, filterArray) => 
    count + filterArray.length, 0
  );

  const hasActiveFilters = activeFilterCount > 0;

  const getSubstrands = (doc) => {
  console.log('📋 Document data for substrands:', {
    docId: doc._id,
    type: doc.type,
    hasSubstrand: !!doc.substrand,
    substrandType: typeof doc.substrand,
    substrandValue: doc.substrand,
    hasCbcEntry: !!doc.cbcEntry,
    cbcEntrySubstrand: doc.cbcEntry?.substrand,
    hasStrand: !!doc.strand,
    strandValue: doc.strand
  });

  // First, check if document has a valid substrand field
  if (doc.substrand) {
    if (Array.isArray(doc.substrand) && doc.substrand.length > 0) {
      const validSubstrands = doc.substrand.filter(sub => 
        sub && 
        typeof sub === 'string' && 
        sub.trim().length > 0 &&
        !sub.toLowerCase().includes('week') &&
        !sub.toLowerCase().includes('stran') &&
        !sub.toLowerCase().includes('learning concept')
      );
      if (validSubstrands.length > 0) {
        console.log('✅ Using valid array substrand:', validSubstrands);
        return validSubstrands;
      }
    }
    if (typeof doc.substrand === 'string' && doc.substrand.trim().length > 0) {
      const substrand = doc.substrand.trim();
      // Validate it's not a table header
      if (!substrand.toLowerCase().includes('week') &&
          !substrand.toLowerCase().includes('stran') &&
          !substrand.toLowerCase().includes('learning concept')) {
        console.log('✅ Using valid string substrand:', substrand);
        return [substrand];
      }
    }
  }

  // Check if populated cbcEntry has valid substrand
  if (doc.cbcEntry && doc.cbcEntry.substrand) {
    if (Array.isArray(doc.cbcEntry.substrand) && doc.cbcEntry.substrand.length > 0) {
      const validSubstrands = doc.cbcEntry.substrand.filter(sub => 
        sub && 
        typeof sub === 'string' && 
        sub.trim().length > 0 &&
        !sub.toLowerCase().includes('week') &&
        !sub.toLowerCase().includes('stran') &&
        !sub.toLowerCase().includes('learning concept')
      );
      if (validSubstrands.length > 0) {
        console.log('✅ Using valid cbcEntry array substrand:', validSubstrands);
        return validSubstrands;
      }
    }
    if (typeof doc.cbcEntry.substrand === 'string' && doc.cbcEntry.substrand.trim().length > 0) {
      const substrand = doc.cbcEntry.substrand.trim();
      if (!substrand.toLowerCase().includes('week') &&
          !substrand.toLowerCase().includes('stran') &&
          !substrand.toLowerCase().includes('learning concept')) {
        console.log('✅ Using valid cbcEntry string substrand:', substrand);
        return [substrand];
      }
    }
  }

  // Use strand as fallback if no valid substrand
  if (doc.strand && typeof doc.strand === 'string' && doc.strand.trim().length > 0) {
    const strand = doc.strand.trim();
    if (!strand.toLowerCase().includes('week') &&
        !strand.toLowerCase().includes('stran') &&
        !strand.toLowerCase().includes('learning concept')) {
      console.log('✅ Using strand as fallback:', strand);
      return [strand];
    }
  }

  // Try to extract from content as last resort
  console.log('🔍 No direct substrands found, checking content...');
  const extracted = extractSubstrandsFromContent(doc.content);
  
  // If nothing found in content, return empty array
  if (extracted.length === 0) {
    console.log('❌ No valid substrands found anywhere');
  }
  
  return extracted;
};

const extractSubstrandsFromContent = (content) => {
  if (!content) {
    console.log('❌ No content to extract from');
    return [];
  }

  try {
    const substrands = new Set();
    const lines = content.split('\n');
    
    console.log(`🔍 Analyzing ${lines.length} lines for substrands`);

    let inTableSection = false;
    let tableHeadersFound = false;

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Skip common table headers and section titles
      const commonHeaders = [
        'week', 'stran', 'learning concept', 'sub-strand', 'substrand',
        'date', 'time', 'topic', 'activity', 'resources', 'references',
        'lesson', 'objective', 'assessment', 'duration'
      ];

      const isHeader = commonHeaders.some(header => 
        trimmedLine.toLowerCase().includes(header)
      );

      if (isHeader) {
        console.log(`⏩ Skipping header line: "${trimmedLine}"`);
        continue;
      }

      // Skip lines that are just separators or markdown table dividers
      if (trimmedLine.match(/^[|=-\s]+$/) || trimmedLine.includes('---') || trimmedLine.includes('===')) {
        continue;
      }

      // Pattern 1: Direct substrand mention with actual content
      if ((trimmedLine.toLowerCase().includes('substrand') || trimmedLine.toLowerCase().includes('sub-strand')) && 
          !trimmedLine.toLowerCase().includes('week') &&
          !trimmedLine.toLowerCase().includes('stran') &&
          !trimmedLine.toLowerCase().includes('learning concept')) {
        
        console.log('📌 Found substrand mention:', trimmedLine);
        
        // Extract the actual substrand value more carefully
        const match = trimmedLine.match(/(?:substrand|sub-strand)[:\s]*([^\n|:]+)/i);
        if (match && match[1]) {
          const substrand = match[1].trim();
          // More strict validation - must be meaningful content
          if (substrand && 
              substrand.length > 3 && 
              !substrand.match(/^[0-9\s\-|]+$/) && // Not just numbers/dashes/pipes
              !commonHeaders.some(header => substrand.toLowerCase().includes(header))) {
            console.log(`✅ Extracted valid substrand: "${substrand}"`);
            substrands.add(substrand);
          }
        }
      }

      // Pattern 2: Look for actual content lines in tables (not headers)
      if (trimmedLine.includes('|')) {
        const parts = trimmedLine.split('|')
          .map(part => part.trim())
          .filter(part => part && part.length > 0);
        
        // Skip if this looks like a header row (contains common header words)
        const hasHeaderContent = parts.some(part => 
          commonHeaders.some(header => part.toLowerCase().includes(header))
        );

        if (!hasHeaderContent && parts.length >= 3) {
          // Assume the middle parts might contain actual substrand content
          parts.forEach((part, index) => {
            if (part && 
                part.length > 3 && 
                !part.match(/^[0-9\s\-|.:]+$/) && // Not just numbers, dashes, etc.
                !commonHeaders.some(header => part.toLowerCase().includes(header)) &&
                !part.match(/^(mon|tue|wed|thu|fri|sat|sun)/i) && // Not days
                !part.match(/^[0-9]+(?::[0-9]+)?\s*(?:am|pm)?$/i) && // Not times
                !part.match(/^[0-9]+\/[0-9]+\/[0-9]+$/) // Not dates
            ) {
              console.log(`📊 Potential substrand from table content: "${part}"`);
              substrands.add(part);
            }
          });
        }
      }

      // Pattern 3: Look for meaningful content lines that might be substrands
      if (!trimmedLine.includes('|') && 
          !trimmedLine.startsWith('#') &&
          trimmedLine.length > 10 && // Reasonable length for actual content
          trimmedLine.length < 100 &&
          !commonHeaders.some(header => trimmedLine.toLowerCase().includes(header)) &&
          !trimmedLine.match(/^[0-9]+\.?\s*$/) && // Not just numbers
          trimmedLine.split(' ').length <= 5) { // Short phrases likely to be substrands
        console.log(`📝 Potential substrand from content: "${trimmedLine}"`);
        substrands.add(trimmedLine);
      }
    }

    // Filter out any remaining false positives
    const result = Array.from(substrands).filter(substrand => {
      const lowerSub = substrand.toLowerCase();
      const isFalsePositive = 
        lowerSub.includes('week') ||
        lowerSub.includes('stran') ||
        lowerSub.includes('learning concept') ||
        lowerSub.includes('sub-strand') ||
        lowerSub.includes('substrand') ||
        lowerSub.match(/^[0-9\s\-|.:]+$/) ||
        commonHeaders.some(header => lowerSub.includes(header));
      
      if (isFalsePositive) {
        console.log(`🗑️ Filtered out false positive: "${substrand}"`);
      }
      
      return !isFalsePositive;
    });

    console.log(`🎯 Final extracted substrands:`, result);
    return result;
    
  } catch (error) {
    console.error("❌ Error extracting substrands:", error);
    return [];
  }
};

const renderSubstrands = (doc) => {
  const substrands = getSubstrands(doc);
  
  console.log('🎨 Rendering substrands:', {
    docId: doc._id,
    docType: doc.type,
    hasSubstrands: substrands.length > 0,
    substrandsCount: substrands.length,
    substrands: substrands
  });

  if (!substrands || substrands.length === 0) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm mt-2">
        <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
        <span>No substrands specified</span>
      </div>
    );
  }
  
  return (
    <div className="flex flex-wrap gap-2 items-center mt-2">
      <span className="text-sm text-gray-600 font-medium mr-2">
        {substrands.length > 0 ? 'Substrands:' : 'Strand:'}
      </span>
      {substrands.slice(0, 3).map((substrand, index) => (
        <Badge 
          key={index} 
          variant="outline" 
          className="bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200 text-xs font-medium px-3 py-1"
        >
          {typeof substrand === 'string' ? substrand.trim() : String(substrand)}
        </Badge>
      ))}
      {substrands.length > 3 && (
        <Badge 
          variant="outline" 
          className="bg-gray-100 text-gray-600 border-gray-300 text-xs px-3 py-1"
        >
          +{substrands.length - 3} more
        </Badge>
      )}
    </div>
  );
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              My Documents
            </h1>
          </div>
          <p className="text-gray-600 text-lg">Manage and access all your created documents</p>
        </div>

        {/* Stats Card - Enhanced Styling */}
        <Card className="mb-8 bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 w-full"></div>
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">My Created Documents</p>
                <p className="text-5xl font-bold text-gray-900 mt-2">{pagination?.total || documents.length}</p>
                <p className="text-gray-500 mt-3">Total documents created by you</p>
              </div>
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-2xl">
                <FileText className="h-10 w-10 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Search Bar */}
        <Card className="mb-8 bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50/50 border-b">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4">
                {/* Search Input Row */}
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      ref={searchInputRef}
                      placeholder="Search documents by type, grade, subject, or strand..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="pl-10 pr-12 h-12 text-lg border-2 border-gray-200/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl bg-white/50 backdrop-blur-sm transition-all duration-300"
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Loader className="h-5 w-5 animate-spin text-blue-600" />
                      </div>
                    )}
                  </div>
                  
                  <Popover open={showFilters} onOpenChange={setShowFilters}>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="h-12 px-6 border-2 border-gray-200/80 bg-white/50 backdrop-blur-sm hover:bg-white hover:border-blue-500 rounded-xl transition-all duration-300 flex items-center gap-2 relative"
                      >
                        <Filter className="h-5 w-5" />
                        <span className="font-medium">Filters</span>
                        {hasActiveFilters && (
                          <Badge className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0 bg-gradient-to-r from-blue-500 to-purple-500 text-white border-2 border-white shadow-lg">
                            {activeFilterCount}
                          </Badge>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-96 p-6 rounded-2xl shadow-2xl border-0 bg-white/95 backdrop-blur-sm" align="end">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-lg text-gray-900">Filter Documents</h3>
                          {hasActiveFilters && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={handleClearFilters} 
                              className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                              Clear all
                            </Button>
                          )}
                        </div>

                        {/* Document Type Filter */}
                        <div>
                          <Label className="text-sm font-semibold text-gray-700 mb-3 block">Document Type</Label>
                          <div className="space-y-2">
                            {filterOptions.documentTypes.map(type => (
                              <div key={type} className="flex items-center space-x-3">
                                <Checkbox
                                  id={`type-${type}`}
                                  checked={filters.documentTypes.includes(type)}
                                  onCheckedChange={() => handleFilterChange('documentTypes', type)}
                                  className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                />
                                <Label htmlFor={`type-${type}`} className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                                  {type}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Grade Filter */}
                        <div>
                          <Label className="text-sm font-semibold text-gray-700 mb-3 block">Grade Level</Label>
                          <div className="space-y-2">
                            {filterOptions.grades.map(grade => (
                              <div key={grade} className="flex items-center space-x-3">
                                <Checkbox
                                  id={`grade-${grade}`}
                                  checked={filters.grades.includes(grade)}
                                  onCheckedChange={() => handleFilterChange('grades', grade)}
                                  className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                />
                                <Label htmlFor={`grade-${grade}`} className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                                  {grade}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Subject Filter */}
                        <div>
                          <Label className="text-sm font-semibold text-gray-700 mb-3 block">Subject Area</Label>
                          <div className="space-y-2">
                            {filterOptions.subjects.map(subject => (
                              <div key={subject} className="flex items-center space-x-3">
                                <Checkbox
                                  id={`subject-${subject}`}
                                  checked={filters.subjects.includes(subject)}
                                  onCheckedChange={() => handleFilterChange('subjects', subject)}
                                  className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                />
                                <Label htmlFor={`subject-${subject}`} className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                                  {subject}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  {(searchTerm || hasActiveFilters) && (
                    <Button 
                      variant="outline" 
                      onClick={handleClearSearch}
                      className="h-12 px-6 border-2 border-red-200 bg-white/50 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-xl transition-all duration-300"
                    >
                      <X className="h-5 w-5" />
                      Clear
                    </Button>
                  )}
                </div>

                {/* Active Filters Display */}
                {hasActiveFilters && (
                  <div className="flex flex-wrap gap-2">
                    {filters.documentTypes.map(type => (
                      <Badge key={type} variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 px-3 py-1 rounded-full flex items-center gap-2 font-medium">
                        📄 {type}
                        <X 
                          className="h-3 w-3 cursor-pointer hover:text-blue-900" 
                          onClick={() => handleFilterChange('documentTypes', type)}
                        />
                      </Badge>
                    ))}
                    {filters.grades.map(grade => (
                      <Badge key={grade} variant="secondary" className="bg-green-100 text-green-700 border-green-200 px-3 py-1 rounded-full flex items-center gap-2 font-medium">
                        🎓 {grade}
                        <X 
                          className="h-3 w-3 cursor-pointer hover:text-green-900" 
                          onClick={() => handleFilterChange('grades', grade)}
                        />
                      </Badge>
                    ))}
                    {filters.subjects.map(subject => (
                      <Badge key={subject} variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200 px-3 py-1 rounded-full flex items-center gap-2 font-medium">
                        📚 {subject}
                        <X 
                          className="h-3 w-3 cursor-pointer hover:text-purple-900" 
                          onClick={() => handleFilterChange('subjects', subject)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </div>
        </Card>

        {/* Enhanced Documents Card */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 w-full"></div>
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              My Created Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600 text-lg font-medium">Loading your documents...</p>
                <p className="text-gray-400 text-sm mt-2">Please wait while we fetch your content</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="h-12 w-12 text-gray-300" />
                </div>
                <p className="text-gray-500 text-xl font-medium mb-3">
                  {searchTerm || hasActiveFilters ? 'No documents match your search' : 'No documents created yet'}
                </p>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                  {searchTerm || hasActiveFilters 
                    ? 'Try adjusting your search terms or filters to find what you\'re looking for.' 
                    : 'Start creating amazing teaching documents to build your resource library!'
                  }
                </p>
                {!searchTerm && !hasActiveFilters ? (
                  <Button 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                    onClick={() => window.location.href = '/createDocument'}
                  >
                    Create Your First Document
                  </Button>
                ) : (
                  <Button 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                    onClick={handleClearSearch}
                  >
                    Clear Search & Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {documents.map((document) => (
                  <div
                    key={document._id}
                    className="group border border-gray-200/80 bg-white/60 backdrop-blur-sm rounded-2xl p-6 hover:border-blue-300 hover:shadow-2xl hover:bg-white/80 transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-5 flex-1">
                        <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-sm group-hover:shadow-md transition-shadow duration-300">
                          {getDocumentIcon(document.type)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                              {document.type || 'Document'}
                            </h3>
                            {getStatusBadge(document.status)}
                            <Badge variant="outline" className="bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200 font-semibold">
                              {document.grade || 'N/A'}
                            </Badge>
                          </div>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                            <span className="flex items-center font-medium">
                              <BookOpen className="h-4 w-4 mr-2 text-blue-500" />
                              {document.subject || document.learningArea || 'N/A'}
                            </span>
                            {document.strand && (
                              <span className="flex items-center font-medium">
                                <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                                {document.strand}
                              </span>
                            )}
                          </div>

                          <div className="mb-4">
                            {renderSubstrands(document)}
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                            Created on {formatDate(document.createdAt)}
                            {document.updatedAt && document.updatedAt !== document.createdAt && (
                              <span className="ml-3 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                Updated {formatDate(document.updatedAt)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 ml-6">
                        <Button
                          onClick={() => handleViewDocument(document._id)}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2.5 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2 font-semibold"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                        <Button
                          onClick={() => handleDeleteClick(document)}
                          variant="outline"
                          className="border-2 border-red-200 bg-white/50 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 px-6 py-2.5 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2 font-semibold"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Enhanced Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200/50">
                <p className="text-sm text-gray-600 font-medium">
                  Showing <span className="text-blue-600 font-bold">{documents.length}</span> of{' '}
                  <span className="text-purple-600 font-bold">{pagination.total}</span> documents
                </p>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className="border-2 border-gray-200 bg-white/50 hover:bg-white hover:border-blue-500 disabled:opacity-50 rounded-xl px-4 py-2 font-medium transition-all duration-300"
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600 font-medium bg-white/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-gray-200/50">
                    Page <span className="text-blue-600 font-bold">{pagination.current}</span> of{' '}
                    <span className="text-purple-600 font-bold">{pagination.pages}</span>
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className="border-2 border-gray-200 bg-white/50 hover:bg-white hover:border-blue-500 disabled:opacity-50 rounded-xl px-4 py-2 font-medium transition-all duration-300"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}>
          <AlertDialogContent className="rounded-2xl border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <AlertDialogTitle className="text-2xl font-bold text-gray-900">
                  Delete Document
                </AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-gray-600 text-lg">
                Are you sure you want to delete "
                <span className="font-semibold text-red-600">
                  {deleteDialog.document?.type || 'Document'}
                </span>
                " for{" "}
                <span className="font-semibold text-blue-600">
                  {deleteDialog.document?.grade || 'N/A'} - {deleteDialog.document?.subject || deleteDialog.document?.learningArea || 'N/A'}
                </span>
                ?
                <br />
                <span className="text-red-500 font-medium mt-2 block">
                  This action cannot be undone. The document will be permanently removed.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex space-x-3 mt-6">
              <AlertDialogCancel 
                disabled={deleteDialog.loading}
                className="flex-1 border-2 border-gray-200 bg-white/50 hover:bg-white hover:border-gray-300 rounded-xl py-3 font-semibold transition-all duration-300"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                disabled={deleteDialog.loading}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl py-3 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:transform-none"
              >
                {deleteDialog.loading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Document
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}