import React, { useState, useEffect, useRef } from 'react';
import { FileText, Search, Calendar, BookOpen, X, Eye, Filter, ChevronDown, Loader, Trash2, AlertTriangle, ChevronLeft, MoreVertical } from 'lucide-react';
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
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(null);
  const searchInputRef = useRef(null);

  // Check mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Add this computed variable AFTER all state declarations:
  const activeFilterCount = Object.values(filters).reduce((count, filterArray) => 
    count + filterArray.length, 0
  );
  
  const hasActiveFilters = activeFilterCount > 0;

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const currentUserId = userData._id;

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
        populate: 'cbcEntry',
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
        setDocuments(prev => prev.filter(doc => doc._id !== documentId));
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
      setShowMobileActions(null);
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
      case 'Lesson Plan': return <BookOpen className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />;
      case 'Lesson Notes': return <FileText className="h-4 w-4 md:h-5 md:w-5 text-green-600" />;
      case 'Exercises': return <FileText className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />;
      case 'Schemes of Work': return <FileText className="h-4 w-4 md:h-5 md:w-5 text-orange-600" />;
      case 'Lesson Concept Breakdown': return <FileText className="h-4 w-4 md:h-5 md:w-5 text-pink-600" />;
      default: return <FileText className="h-4 w-4 md:h-5 md:w-5 text-gray-600" />;
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
      <Badge variant="outline" className={`${config.color} text-xs md:text-sm px-2 py-0.5 md:px-2.5 md:py-1`}>
        {config.label}
      </Badge>
    );
  };

  // ... (keep your existing getSubstrands and extractSubstrandsFromContent functions) ...

  const renderSubstrands = (doc) => {
    const substrands = getSubstrands(doc);
    
    if (!substrands || substrands.length === 0) {
      return (
        <div className="flex items-center gap-2 text-gray-400 text-xs md:text-sm mt-1 md:mt-2">
          <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-gray-300 rounded-full"></span>
          <span>No substrands</span>
        </div>
      );
    }
    
    return (
      <div className="flex flex-wrap gap-1 md:gap-2 items-center mt-1 md:mt-2">
        <span className="text-xs md:text-sm text-gray-600 font-medium mr-1 md:mr-2">
          {substrands.length > 0 ? 'Substrands:' : 'Strand:'}
        </span>
        {substrands.slice(0, isMobile ? 1 : 3).map((substrand, index) => (
          <Badge 
            key={index} 
            variant="outline" 
            className="bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200 text-xs px-2 py-0.5 md:px-3 md:py-1 font-medium"
          >
            {typeof substrand === 'string' ? substrand.trim() : String(substrand)}
          </Badge>
        ))}
        {substrands.length > (isMobile ? 1 : 3) && (
          <Badge 
            variant="outline" 
            className="bg-gray-100 text-gray-600 border-gray-300 text-xs px-2 py-0.5 md:px-3 md:py-1"
          >
            +{substrands.length - (isMobile ? 1 : 3)} more
          </Badge>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-3 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Mobile Header */}
        {isMobile && (
          <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm mb-4">
            <div className="flex items-center justify-between p-3">
              <button
                onClick={() => window.history.back()}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex-1 text-center">
                <h1 className="text-lg font-bold text-gray-900">My Documents</h1>
                <p className="text-xs text-gray-600">Manage your documents</p>
              </div>
              <div className="w-10"></div>
            </div>
          </div>
        )}

        {/* Header - Desktop */}
        {!isMobile && (
          <div className="mb-6 md:mb-8 text-center">
            <div className="flex items-center justify-center space-x-3 mb-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <FileText className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                My Documents
              </h1>
            </div>
            <p className="text-gray-600 text-sm md:text-lg">Manage and access all your created documents</p>
          </div>
        )}

        {/* Stats Card - Mobile Optimized */}
        <Card className="mb-4 md:mb-8 bg-white/80 backdrop-blur-sm border-0 shadow-lg md:shadow-xl rounded-xl md:rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-1 md:h-2 w-full"></div>
          <CardContent className="p-4 md:p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600 uppercase tracking-wide">My Documents</p>
                <p className="text-3xl md:text-5xl font-bold text-gray-900 mt-1 md:mt-2">{pagination?.total || documents.length}</p>
                <p className="text-gray-500 text-xs md:text-base mt-1 md:mt-3">Total created by you</p>
              </div>
              <div className="w-12 h-12 md:w-20 md:h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg md:shadow-2xl">
                <FileText className="h-6 w-6 md:h-10 md:w-10 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filters - Mobile Optimized */}
        <Card className="mb-4 md:mb-8 bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-xl md:rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50/50 border-b">
            <CardContent className="p-3 md:p-6">
              <div className="flex flex-col gap-3 md:gap-4">
                {/* Search Input Row */}
                <div className="flex flex-col md:flex-row gap-2 md:gap-3">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                    </div>
                    <Input
                      ref={searchInputRef}
                      placeholder={isMobile ? "Search documents..." : "Search documents by type, grade, subject, or strand..."}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="pl-9 md:pl-10 pr-10 md:pr-12 h-10 md:h-12 text-sm md:text-lg border border-gray-200 md:border-2 focus:border-blue-500 focus:ring-1 md:focus:ring-2 focus:ring-blue-200 rounded-lg md:rounded-xl bg-white/50 backdrop-blur-sm"
                    />
                    {isSearching && (
                      <div className="absolute right-2 md:right-3 top-1/2 transform -translate-y-1/2">
                        <Loader className="h-4 w-4 md:h-5 md:w-5 animate-spin text-blue-600" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Popover open={showFilters} onOpenChange={setShowFilters}>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="h-10 md:h-12 px-3 md:px-6 border border-gray-200 md:border-2 bg-white/50 backdrop-blur-sm hover:bg-white hover:border-blue-500 rounded-lg md:rounded-xl transition-all flex items-center gap-1 md:gap-2 relative flex-1 md:flex-none"
                        >
                          <Filter className="h-4 w-4 md:h-5 md:w-5" />
                          <span className="text-sm md:font-medium">Filters</span>
                          {hasActiveFilters && (
                            <Badge className="absolute -top-1 -right-1 md:-top-2 md:-right-2 h-4 w-4 md:h-6 md:w-6 flex items-center justify-center p-0 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs border border-white md:border-2 shadow">
                              {activeFilterCount}
                            </Badge>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent 
                        className={`w-[calc(100vw-2rem)] md:w-96 p-4 md:p-6 rounded-lg md:rounded-2xl shadow-lg md:shadow-2xl border-0 bg-white/95 backdrop-blur-sm ${isMobile ? 'max-h-[70vh] overflow-y-auto' : ''}`} 
                        align={isMobile ? "center" : "end"}
                      >
                        <div className="space-y-4 md:space-y-6">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-base md:text-lg text-gray-900">Filter Documents</h3>
                            {hasActiveFilters && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={handleClearFilters} 
                                className="text-blue-600 hover:text-blue-700 text-sm md:font-medium"
                              >
                                Clear all
                              </Button>
                            )}
                          </div>

                          {/* Document Type Filter */}
                          <div>
                            <Label className="text-sm font-semibold text-gray-700 mb-2 md:mb-3 block">Document Type</Label>
                            <div className="space-y-1 md:space-y-2">
                              {filterOptions.documentTypes.map(type => (
                                <div key={type} className="flex items-center space-x-2 md:space-x-3">
                                  <Checkbox
                                    id={`type-${type}`}
                                    checked={filters.documentTypes.includes(type)}
                                    onCheckedChange={() => handleFilterChange('documentTypes', type)}
                                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 h-4 w-4 md:h-5 md:w-5"
                                  />
                                  <Label htmlFor={`type-${type}`} className="text-xs md:text-sm font-medium text-gray-700 cursor-pointer flex-1">
                                    {type}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Grade Filter */}
                          <div>
                            <Label className="text-sm font-semibold text-gray-700 mb-2 md:mb-3 block">Grade Level</Label>
                            <div className="space-y-1 md:space-y-2">
                              {filterOptions.grades.map(grade => (
                                <div key={grade} className="flex items-center space-x-2 md:space-x-3">
                                  <Checkbox
                                    id={`grade-${grade}`}
                                    checked={filters.grades.includes(grade)}
                                    onCheckedChange={() => handleFilterChange('grades', grade)}
                                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 h-4 w-4 md:h-5 md:w-5"
                                  />
                                  <Label htmlFor={`grade-${grade}`} className="text-xs md:text-sm font-medium text-gray-700 cursor-pointer flex-1">
                                    {grade}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Subject Filter */}
                          <div>
                            <Label className="text-sm font-semibold text-gray-700 mb-2 md:mb-3 block">Subject Area</Label>
                            <div className="space-y-1 md:space-y-2">
                              {filterOptions.subjects.map(subject => (
                                <div key={subject} className="flex items-center space-x-2 md:space-x-3">
                                  <Checkbox
                                    id={`subject-${subject}`}
                                    checked={filters.subjects.includes(subject)}
                                    onCheckedChange={() => handleFilterChange('subjects', subject)}
                                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 h-4 w-4 md:h-5 md:w-5"
                                  />
                                  <Label htmlFor={`subject-${subject}`} className="text-xs md:text-sm font-medium text-gray-700 cursor-pointer flex-1">
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
                        className="h-10 md:h-12 px-3 md:px-6 border border-red-200 md:border-2 bg-white/50 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-lg md:rounded-xl transition-all flex-1 md:flex-none"
                      >
                        <X className="h-4 w-4 md:h-5 md:w-5" />
                        <span className="ml-1 md:hidden">Clear</span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Active Filters Display */}
                {hasActiveFilters && (
                  <div className="flex flex-wrap gap-1 md:gap-2">
                    {filters.documentTypes.map(type => (
                      <Badge key={type} variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 px-2 py-0.5 md:px-3 md:py-1 rounded-full flex items-center gap-1 md:gap-2 text-xs md:font-medium">
                        📄 {isMobile ? type.split(' ')[0] : type}
                        <X 
                          className="h-2.5 w-2.5 md:h-3 md:w-3 cursor-pointer hover:text-blue-900" 
                          onClick={() => handleFilterChange('documentTypes', type)}
                        />
                      </Badge>
                    ))}
                    {filters.grades.map(grade => (
                      <Badge key={grade} variant="secondary" className="bg-green-100 text-green-700 border-green-200 px-2 py-0.5 md:px-3 md:py-1 rounded-full flex items-center gap-1 md:gap-2 text-xs md:font-medium">
                        🎓 {grade}
                        <X 
                          className="h-2.5 w-2.5 md:h-3 md:w-3 cursor-pointer hover:text-green-900" 
                          onClick={() => handleFilterChange('grades', grade)}
                        />
                      </Badge>
                    ))}
                    {filters.subjects.map(subject => (
                      <Badge key={subject} variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200 px-2 py-0.5 md:px-3 md:py-1 rounded-full flex items-center gap-1 md:gap-2 text-xs md:font-medium">
                        📚 {isMobile ? subject.slice(0, 4) : subject}
                        <X 
                          className="h-2.5 w-2.5 md:h-3 md:w-3 cursor-pointer hover:text-purple-900" 
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

        {/* Documents List - MOBILE OPTIMIZED */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg md:shadow-xl rounded-xl md:rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-1 md:h-2 w-full"></div>
          <CardHeader className="pb-2 md:pb-4">
            <CardTitle className="text-lg md:text-2xl font-bold text-gray-900 flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-lg md:rounded-xl flex items-center justify-center">
                <FileText className="h-4 w-4 md:h-6 md:w-6 text-blue-600" />
              </div>
              My Created Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 md:py-16">
                <div className="animate-spin rounded-full h-10 w-10 md:h-16 md:w-16 border-b-2 border-blue-600 mb-3 md:mb-4"></div>
                <p className="text-gray-600 text-sm md:text-lg font-medium">Loading your documents...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8 md:py-16">
                <div className="w-16 h-16 md:w-24 md:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                  <FileText className="h-8 w-8 md:h-12 md:w-12 text-gray-300" />
                </div>
                <p className="text-gray-500 text-base md:text-xl font-medium mb-2 md:mb-3">
                  {searchTerm || hasActiveFilters ? 'No documents match your search' : 'No documents created yet'}
                </p>
                <p className="text-gray-400 text-xs md:text-base mb-4 md:mb-6 max-w-md mx-auto">
                  {searchTerm || hasActiveFilters 
                    ? 'Try adjusting your search terms or filters.' 
                    : 'Start creating amazing teaching documents!'
                  }
                </p>
                {!searchTerm && !hasActiveFilters ? (
                  <Button 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 md:px-8 md:py-3 rounded-lg md:rounded-xl shadow hover:shadow-md md:hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 text-sm md:text-base"
                    onClick={() => window.location.href = '/createDocument'}
                  >
                    Create Your First Document
                  </Button>
                ) : (
                  <Button 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 md:px-8 md:py-3 rounded-lg md:rounded-xl shadow hover:shadow-md md:hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 text-sm md:text-base"
                    onClick={handleClearSearch}
                  >
                    Clear Search & Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4">
                {documents.map((document) => (
                  <div
                    key={document._id}
                    className={`border border-gray-200/80 bg-white/60 backdrop-blur-sm rounded-lg md:rounded-2xl overflow-hidden ${
                      isMobile ? 'p-3' : 'p-6'
                    } hover:border-blue-300 hover:shadow-md md:hover:shadow-2xl hover:bg-white/80 transition-all duration-300`}
                  >
                    {/* Mobile Layout - Stacked */}
                    {isMobile ? (
                      <div className="flex flex-col">
                        {/* Top row - Icon and basic info */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg shadow-sm">
                              {getDocumentIcon(document.type)}
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-gray-900 line-clamp-1">
                                {document.type || 'Document'}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                {getStatusBadge(document.status)}
                                <Badge variant="outline" className="bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200 text-xs px-2">
                                  {document.grade || 'N/A'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => setShowMobileActions(showMobileActions === document._id ? null : document._id)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <MoreVertical className="h-4 w-4 text-gray-500" />
                          </button>
                        </div>

                        {/* Subject and details */}
                        <div className="mb-2">
                          <div className="flex items-center text-xs text-gray-600 mb-1">
                            <BookOpen className="h-3 w-3 mr-1 text-blue-500" />
                            {document.subject || document.learningArea || 'N/A'}
                          </div>
                          {renderSubstrands(document)}
                        </div>

                        {/* Date */}
                        <div className="flex items-center text-xs text-gray-500 mb-3">
                          <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                          Created: {new Date(document.createdAt).toLocaleDateString()}
                        </div>

                        {/* Mobile Actions Menu */}
                        {showMobileActions === document._id && (
                          <div className="flex gap-2 mb-3 border-t border-gray-100 pt-3">
                            <Button
                              onClick={() => handleViewDocument(document._id)}
                              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs py-1.5 rounded-lg"
                              size="sm"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button
                              onClick={() => handleDeleteClick(document)}
                              variant="outline"
                              className="flex-1 border-red-200 text-red-600 hover:bg-red-50 text-xs py-1.5 rounded-lg"
                              size="sm"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        )}

                        {/* Always visible action buttons on mobile */}
                        {showMobileActions !== document._id && (
                          <div className="flex gap-2 border-t border-gray-100 pt-3">
                            <Button
                              onClick={() => handleViewDocument(document._id)}
                              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs py-2 rounded-lg"
                              size="sm"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button
                              onClick={() => handleDeleteClick(document)}
                              variant="outline"
                              className="flex-1 border-red-200 text-red-600 hover:bg-red-50 text-xs py-2 rounded-lg"
                              size="sm"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Desktop Layout - Horizontal */
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 md:space-x-5 flex-1">
                          <div className="p-2 md:p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg md:rounded-2xl shadow-sm group-hover:shadow-md transition-shadow duration-300">
                            {getDocumentIcon(document.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2 md:mb-3">
                              <h3 className="text-base md:text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300 truncate">
                                {document.type || 'Document'}
                              </h3>
                              {getStatusBadge(document.status)}
                              <Badge variant="outline" className="bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200 font-semibold text-xs md:text-sm">
                                {document.grade || 'N/A'}
                              </Badge>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 md:gap-4 text-xs md:text-sm text-gray-600 mb-2 md:mb-3">
                              <span className="flex items-center font-medium">
                                <BookOpen className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2 text-blue-500" />
                                {document.subject || document.learningArea || 'N/A'}
                              </span>
                              {document.strand && (
                                <span className="flex items-center font-medium">
                                  <span className="w-1 h-1 bg-gray-400 rounded-full mr-1 md:mr-2"></span>
                                  {document.strand}
                                </span>
                              )}
                            </div>

                            <div className="mb-2 md:mb-4">
                              {renderSubstrands(document)}
                            </div>
                            
                            <div className="flex items-center text-xs md:text-sm text-gray-500">
                              <Calendar className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2 text-gray-400" />
                              Created on {formatDate(document.createdAt)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-end space-x-2 md:space-x-3 ml-3 md:ml-6">
                          <Button
                            onClick={() => handleViewDocument(document._id)}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-3 py-1.5 md:px-6 md:py-2.5 rounded-lg md:rounded-xl shadow hover:shadow-md md:hover:shadow-xl transition-all duration-300 flex items-center gap-1 md:gap-2 text-xs md:font-semibold"
                          >
                            <Eye className="h-3 w-3 md:h-4 md:w-4" />
                            <span className="hidden md:inline">View</span>
                          </Button>
                          <Button
                            onClick={() => handleDeleteClick(document)}
                            variant="outline"
                            className="border border-red-200 md:border-2 bg-white/50 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 px-3 py-1.5 md:px-6 md:py-2.5 rounded-lg md:rounded-xl shadow hover:shadow-md md:hover:shadow-xl transition-all duration-300 flex items-center gap-1 md:gap-2 text-xs md:font-semibold"
                          >
                            <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                            <span className="hidden md:inline">Delete</span>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex flex-col md:flex-row items-center justify-between mt-4 md:mt-8 pt-4 md:pt-6 border-t border-gray-200/50">
                <p className="text-xs md:text-sm text-gray-600 font-medium mb-2 md:mb-0">
                  Showing <span className="text-blue-600 font-bold">{documents.length}</span> of{' '}
                  <span className="text-purple-600 font-bold">{pagination.total}</span> documents
                </p>
                <div className="flex items-center space-x-2 md:space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className="border border-gray-200 md:border-2 bg-white/50 hover:bg-white hover:border-blue-500 disabled:opacity-50 rounded-lg md:rounded-xl px-3 py-1.5 md:px-4 md:py-2 font-medium transition-all duration-300 text-xs md:text-sm"
                  >
                    Previous
                  </Button>
                  <span className="text-xs md:text-sm text-gray-600 font-medium bg-white/50 backdrop-blur-sm px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl border border-gray-200/50">
                    Page <span className="text-blue-600 font-bold">{pagination.current}</span> of{' '}
                    <span className="text-purple-600 font-bold">{pagination.pages}</span>
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className="border border-gray-200 md:border-2 bg-white/50 hover:bg-white hover:border-blue-500 disabled:opacity-50 rounded-lg md:rounded-xl px-3 py-1.5 md:px-4 md:py-2 font-medium transition-all duration-300 text-xs md:text-sm"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog - Mobile Optimized */}
        <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}>
          <AlertDialogContent className={`rounded-lg md:rounded-2xl border-0 shadow-lg md:shadow-2xl bg-white/95 backdrop-blur-sm ${isMobile ? 'w-[calc(100vw-2rem)]' : ''}`}>
            <AlertDialogHeader>
              <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                <div className="w-8 h-8 md:w-12 md:h-12 bg-red-100 rounded-lg md:rounded-xl flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 md:h-6 md:w-6 text-red-600" />
                </div>
                <AlertDialogTitle className="text-lg md:text-2xl font-bold text-gray-900">
                  Delete Document
                </AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-gray-600 text-sm md:text-lg">
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
                <span className="text-red-500 font-medium mt-1 md:mt-2 block text-xs md:text-base">
                  This action cannot be undone.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-3 mt-4 md:mt-6">
              <AlertDialogCancel 
                disabled={deleteDialog.loading}
                className="flex-1 border border-gray-200 md:border-2 bg-white/50 hover:bg-white hover:border-gray-300 rounded-lg md:rounded-xl py-2 md:py-3 font-medium transition-all duration-300 text-sm md:text-base"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                disabled={deleteDialog.loading}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg md:rounded-xl py-2 md:py-3 font-medium shadow hover:shadow-md md:hover:shadow-xl transition-all duration-300 disabled:opacity-50"
              >
                {deleteDialog.loading ? (
                  <>
                    <Loader className="h-3 w-3 md:h-4 md:w-4 animate-spin mr-1 md:mr-2" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                    Delete
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