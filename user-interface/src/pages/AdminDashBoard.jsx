import { React, useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Users, FileText, Clock, CircleAlert, Download, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; // Add this import
import { Plus } from "lucide-react";
import API from "@/api";

export default function AdminDashboard() {
    const [TotalTeachers, setTotalTeachers] = useState(0);
    const [TotalDocs, setTotalDocs] = useState(0);
    const [activities, setActivities] = useState([]);
    const navigate = useNavigate();
    const userData = JSON.parse(localStorage.getItem('userData'));
    const [classes, setClasses] = useState([]);
    const [TotalClasses, setTotalClasses] = useState(0);
    const [userDownloads, setUserDownloads] = useState(0);
    const [userDocumentsCreated, setUserDocumentsCreated] = useState(0);

    const fetchUserStats = async () => {
        try {
            const downloadsRes = await API.get(`/teacher/${userData._id}/downloads/count`);
            setUserDownloads(downloadsRes.data.count || 0);
            
            const docsRes = await API.get(`/teacher/${userData._id}/documents/count`);
            setUserDocumentsCreated(docsRes.data.count || 0);
            
        } catch (err) {
            console.error('Error fetching user stats:', err);
            setUserDownloads(0);
            setUserDocumentsCreated(0);
        }
    };

    useEffect(() => {
        if (userData._id) {
            fetchUserStats();
        }

        const handleDocumentDownloaded = () => {
            console.log('📥 Document downloaded event received, refreshing stats...');
            fetchUserStats();
        };

        window.addEventListener('documentDownloaded', handleDocumentDownloaded);

        return () => {
            window.removeEventListener('documentDownloaded', handleDocumentDownloaded);
        };
    }, [userData._id]);

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const teacherId = userData?._id;
                const res = await API.get(`teacher/${teacherId}/assigned-classes`);
                setClasses(res.data || []);
            } catch (err) {
                console.error('Error loading assigned classes');
            }
        };
        fetchClasses();
    }, []);

    // Fetching total number of teachers in the school
    useEffect(() => {
        const fetchTeacherCount = async () => {
            try {
                const res = await API.get(`/teachers/school/${userData.schoolCode}/count`);
                setTotalTeachers(res.data.count);
            } catch (err) {
                console.error('Error fetching teacher count:', err);
                setTotalTeachers(0);
            }
        };
        
        if (userData.schoolCode) {
            fetchTeacherCount();
        }
    }, [userData.schoolCode]);

    // Fetching total number of documents for the entire school
    useEffect(() => {
        const fetchSchoolDocumentCount = async () => {
            try {
                const res = await API.get(`/documents/${userData.schoolCode}/count`);
                setTotalDocs(res.data.count);
            } catch (err) {
                console.error('Error fetching school document count:', err);
                setTotalDocs(0);
            }
        };
        
        if (userData.schoolCode) {
            fetchSchoolDocumentCount();
        }
    }, [userData.schoolCode]);

    // Fetching total number of assigned classes for the entire school
    useEffect(() => {
        const fetchSchoolClassesCount = async () => {
            try {
                const res = await API.get(`/teachers/school/${userData.schoolCode}/assigned-classes/count`);
                setTotalClasses(res.data.total);
            } catch (err) {
                console.error('Error fetching school classes count:', err);
                setTotalClasses(0);
            }
        };
        
        if (userData.schoolCode) {
            fetchSchoolClassesCount();
        }
    }, [userData.schoolCode]);

    // Get recent activities for the school
    useEffect(() => {
        const fetchRecentActivities = async () => {
            try {
                const res = await API.get(`/activities/school/${userData.schoolCode}/recent?limit=10`);
                setActivities(res.data.data || []);
            } catch (err) {
                console.error('Failed to fetch recent activities:', err);
                setActivities([]);
            }
        };

        if (userData.schoolCode) {
            fetchRecentActivities();
        }
    }, [userData.schoolCode]);

    // Fetch current user's document stats
    useEffect(() => {
        const fetchUserStats = async () => {
            try {
                const downloadsRes = await API.get(`/teacher/${userData._id}/downloads/count`);
                setUserDownloads(downloadsRes.data.count || 0);

                const docsRes = await API.get(`/teacher/${userData._id}/documents/count`);
                setUserDocumentsCreated(docsRes.data.count || 0);
                
            } catch (err) {
                console.error('Error fetching user stats:', err);
                setUserDownloads(0);
                setUserDocumentsCreated(0);
            }
        };

        if (userData._id) {
            fetchUserStats();
        }
    }, [userData._id]);

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

    // Calculate productivity score
    const productivityScore = Math.min(100, (userDocumentsCreated || 0) * 3);
    const hoursSaved = (userDocumentsCreated || 0) * 2;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="font-bold text-3xl text-gray-800 mb-2">
                        Welcome, {userData?.firstName} {userData?.lastName}!
                    </h1>
                    <p className="text-gray-600 mb-6 max-w-2xl">
                        Monitor and manage your Digital Blueprint for Smart Learning platform
                    </p>
                    <Button
                        onClick={() => navigate('/createDocument')}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-5 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                    >
                        <Plus className="mr-2 w-5 h-5" /> Create New Document
                    </Button>
                </div>

                {/* School Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <Card className="bg-white rounded-xl shadow-md overflow-hidden border-0">
                        <CardHeader className="flex flex-row items-center justify-between p-6 pb-3">
                            <CardTitle className="text-lg font-semibold text-gray-700">School Teachers</CardTitle>
                            <div className="p-3 bg-blue-100 rounded-full">
                                <Users className="h-5 w-5 text-blue-600" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 pt-0">
                            <p className="text-3xl font-bold text-gray-800">{TotalTeachers}</p>
                            <p className="text-sm text-gray-500 mt-1">Across the school</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white rounded-xl shadow-md overflow-hidden border-0">
                        <CardHeader className="flex flex-row items-center justify-between p-6 pb-3">
                            <CardTitle className="text-lg font-semibold text-gray-700">School Documents</CardTitle>
                            <div className="p-3 bg-green-100 rounded-full">
                                <FileText className="h-5 w-5 text-green-600" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 pt-0">
                            <p className="text-3xl font-bold text-gray-800">{TotalDocs}</p>
                            <p className="text-sm text-gray-500 mt-1">Across the school</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white rounded-xl shadow-md overflow-hidden border-0">
                        <CardHeader className="flex flex-row items-center justify-between p-6 pb-3">
                            <CardTitle className="text-lg font-semibold text-gray-700">School Classes</CardTitle>
                            <div className="p-3 bg-purple-100 rounded-full">
                                <Clock className="h-5 w-5 text-purple-600" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 pt-0">
                            <p className="text-3xl font-bold text-gray-800">{TotalClasses}</p>
                            <p className="text-sm text-gray-500 mt-1">Across the school</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Admin's Personal Stats Section */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Your Teaching Statistics</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
                            <div className="bg-gradient-to-r from-green-500 to-green-600 h-2 w-full"></div>
                            <CardHeader className="pb-4">
                                <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
                                    <FileText className="text-green-600 w-6 h-6" />
                                </div>
                                <CardTitle className="text-xl font-semibold text-gray-800">Your Documents</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold text-gray-800">{userDocumentsCreated}</p>
                            </CardContent>
                            <CardFooter>
                                <p className="text-gray-500 text-sm">Documents you created</p>
                            </CardFooter>
                        </Card>

                        <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 w-full"></div>
                            <CardHeader className="pb-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                                    <Download className="text-blue-600 w-6 h-6" />
                                </div>
                                <CardTitle className="text-xl font-semibold text-gray-800">Your Downloads</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold text-gray-800">{userDownloads}</p>
                            </CardContent>
                            <CardFooter>
                                <p className="text-gray-500 text-sm">Resources you downloaded</p>
                            </CardFooter>
                        </Card>

                        <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
                            <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 w-full"></div>
                            <CardHeader className="pb-4">
                                <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mb-4">
                                    <BarChart3 className="text-purple-600 w-6 h-6" />
                                </div>
                                <CardTitle className="text-xl font-semibold text-gray-800">Your Efficiency</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold text-gray-800">+{productivityScore}%</p>
                                <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-purple-700">{userDocumentsCreated} resources</span>
                                        <span className="text-purple-900 font-medium">~{hoursSaved} hours saved</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col items-start gap-2">
                                <p className="text-gray-500 text-sm">Time saved through resource creation</p>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div 
                                        className="bg-purple-600 h-1.5 rounded-full transition-all duration-300" 
                                        style={{ width: `${productivityScore}%` }}
                                    ></div>
                                </div>
                            </CardFooter>
                        </Card>
                    </div>
                </div>

                {/* Classes Section */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Your Assigned Classes</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {classes.length > 0 ? (
                            classes.map((cls) => (
                                <Link
                                    key={cls._id}
                                    to="/createDocument"
                                    state={{
                                        grade: cls.grade,
                                        stream: cls.stream,
                                        learningArea: cls.learningArea,
                                    }}
                                >
                                    <Card className="bg-white rounded-xl shadow-md overflow-hidden border-0 transition-all hover:shadow-lg cursor-pointer h-full">
                                        <CardHeader className="p-6">
                                            <CardTitle className="text-lg font-semibold text-gray-800">
                                                {cls.grade} - {cls.stream} - {cls.learningArea}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6 pt-0">
                                            <p className="text-gray-600">Click to view or manage this class</p>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))
                        ) : (
                            <p className="text-gray-600 col-span-full text-center py-8 bg-white rounded-xl">
                                No classes assigned yet.
                            </p>
                        )}
                    </div>
                </div>

                {/* Enhanced Recent Activity Section */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Recent School Activities</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Activity Feed */}
                        <Card className="bg-white rounded-xl shadow-md overflow-hidden border-0 lg:col-span-2">
                            <CardHeader className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-blue-100">
                                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center">
                                    <CircleAlert className="h-5 w-5 mr-2 text-blue-600" />
                                    Live Activity Feed
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 max-h-96 overflow-y-auto">
                                {activities.length > 0 ? (
                                    <div className="space-y-4">
                                        {activities.map((activity) => (
                                            <div key={activity._id} className={`border-l-4 pl-4 py-3 rounded-r-lg bg-white shadow-sm ${
                                                activity.type === 'teacher_registered' ? 'border-green-500 bg-green-50' :
                                                activity.type === 'teacher_assigned_class' ? 'border-blue-500 bg-blue-50' :
                                                activity.type === 'teacher_removed_class' ? 'border-red-500 bg-red-50' :
                                                activity.type === 'document_created' ? 'border-purple-500 bg-purple-50' :
                                                activity.type === 'document_downloaded' ? 'border-orange-500 bg-orange-50' :
                                                'border-gray-500 bg-gray-50'
                                            }`}>
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <p className="text-gray-800 font-medium text-sm">{activity.message}</p>
                                                        {activity.user && (
                                                            <p className="text-xs text-gray-600 mt-1">
                                                                👤 {activity.user.name}
                                                            </p>
                                                        )}
                                                        {activity.metadata && (
                                                            <div className="mt-2 flex flex-wrap gap-1">
                                                                {activity.metadata.grade && (
                                                                    <Badge variant="outline" className="text-xs bg-white">
                                                                        📊 {activity.metadata.grade}
                                                                    </Badge>
                                                                )}
                                                                {activity.metadata.subject && (
                                                                    <Badge variant="outline" className="text-xs bg-white">
                                                                        📚 {activity.metadata.subject}
                                                                    </Badge>
                                                                )}
                                                                {activity.metadata.docType && (
                                                                    <Badge variant="outline" className="text-xs bg-white">
                                                                        📄 {activity.metadata.docType}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-gray-500 whitespace-nowrap">
                                                            {activity.timeAgo || getTimeAgo(activity.createdAt)}
                                                        </p>
                                                        <Badge variant="secondary" className="text-xs mt-1 capitalize">
                                                            {activity.type.replace(/_/g, ' ')}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <CircleAlert className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-600">No recent activities</p>
                                        <p className="text-gray-400 text-sm mt-1">Activities will appear here as they happen</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Activity Summary */}
                        <Card className="bg-white rounded-xl shadow-md overflow-hidden border-0">
                            <CardHeader className="p-6 border-b border-gray-100 bg-gradient-to-r from-green-50 to-green-100">
                                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center">
                                    <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
                                    Activity Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                {activities.length > 0 ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="text-center p-3 bg-blue-50 rounded-lg">
                                                <p className="text-2xl font-bold text-blue-600">
                                                    {activities.filter(a => a.type === 'teacher_registered').length}
                                                </p>
                                                <p className="text-xs text-blue-700">New Teachers</p>
                                            </div>
                                            <div className="text-center p-3 bg-purple-50 rounded-lg">
                                                <p className="text-2xl font-bold text-purple-600">
                                                    {activities.filter(a => a.type === 'document_created').length}
                                                </p>
                                                <p className="text-xs text-purple-700">Documents Created</p>
                                            </div>
                                            <div className="text-center p-3 bg-orange-50 rounded-lg">
                                                <p className="text-2xl font-bold text-orange-600">
                                                    {activities.filter(a => a.type === 'document_downloaded').length}
                                                </p>
                                                <p className="text-xs text-orange-700">Downloads</p>
                                            </div>
                                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                                <p className="text-2xl font-bold text-green-600">
                                                    {activities.filter(a => a.type === 'teacher_assigned_class').length}
                                                </p>
                                                <p className="text-xs text-green-700">Class Assignments</p>
                                            </div>
                                        </div>
                                        
                                        <div className="pt-4 border-t border-gray-200">
                                            <p className="text-sm text-gray-600 mb-2 font-medium">Recent Activity Types:</p>
                                            <div className="space-y-2">
                                                {Array.from(new Set(activities.map(a => a.type))).slice(0, 5).map(type => (
                                                    <div key={type} className="flex justify-between items-center text-sm">
                                                        <span className="text-gray-700 capitalize">
                                                            {type.replace(/_/g, ' ')}
                                                        </span>
                                                        <Badge variant="outline">
                                                            {activities.filter(a => a.type === type).length}
                                                        </Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        <div className="pt-3 border-t border-gray-200">
                                            <p className="text-xs text-gray-500">
                                                Last updated: {new Date().toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-600 text-center py-4">No activity data available</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}