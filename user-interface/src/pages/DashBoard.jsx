import React, { useState, useEffect } from "react";
import { User, Clock, BookOpen, Shield, Download, BookText, Medal, MoveRight, Plus, TrendingUp, FileText, BarChart3 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import Navbar from "@/components/ui/dashboard/NavBar";
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardFooter, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RecentDocuments from "./RecentDocuments";
import API from "@/api";

export default function DashBoard() {
    const navigate = useNavigate();
    const userData = JSON.parse(localStorage.getItem('userData'));

    const [classes, setClasses] = useState([]);
    const [downloadsCount, setDownloadsCount] = useState(0);
    const [documentsCreatedCount, setDocumentsCreatedCount] = useState(0);

    // Redirect to login if userData is missing
    useEffect(() => {
        if (!userData) navigate('/login');
    }, [userData, navigate]);

    // Fetch assigned classes
    useEffect(() => {
        const fetchClasses = async () => {
            if (!userData?._id) return;
            try {
                const res = await API.get(`teacher/${userData._id}/assigned-classes`);
                setClasses(res.data || []);
            } catch (err) {
                console.error('Error loading assigned classes');
            }
        };
        fetchClasses();
    }, [userData?._id]);

    // Fetch PERSONAL downloads count
    const fetchPersonalDownloadsCount = async () => {
        if (!userData?._id) return;
        try {
            const res = await API.get(`/teacher/${userData._id}/downloads/count`);
            setDownloadsCount(res.data.count || 0);
        } catch (err) {
            console.error('Error loading personal downloads count:', err);
            setDownloadsCount(0);
        }
    };

    // Fetch documents created count
    const fetchDocumentsCreatedCount = async () => {
        if (!userData?._id) return;
        try {
            const res = await API.get(`/documents/teachers/${userData._id}/count`);
            setDocumentsCreatedCount(res.data.count || 0);
        } catch (err) {
            console.error('Error loading documents created count:', err);
            setDocumentsCreatedCount(0);
        }
    };

    // Fetch both stats when component loads
    useEffect(() => {
        if (userData?._id) {
            fetchPersonalDownloadsCount();
            fetchDocumentsCreatedCount();
        }
    }, [userData?._id]);

    // Listen for download events to refresh stats
    useEffect(() => {
        const handleDocumentDownloaded = () => {
            console.log('📥 Dashboard: Document downloaded, refreshing stats...');
            fetchPersonalDownloadsCount();
            fetchDocumentsCreatedCount();
        };

        window.addEventListener('documentDownloaded', handleDocumentDownloaded);

        return () => {
            window.removeEventListener('documentDownloaded', handleDocumentDownloaded);
        };
    }, []);

    // Periodic refresh (optional)
    useEffect(() => {
        const interval = setInterval(() => {
            if (userData?._id) {
                fetchPersonalDownloadsCount();
                fetchDocumentsCreatedCount();
            }
        }, 30000); // Refresh every 30 seconds

        return () => clearInterval(interval);
    }, [userData?._id]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <Navbar userData={userData} />

            {/* Header Section */}
            <section className="flex flex-col md:flex-row justify-between items-center py-8 px-6 max-w-6xl mx-auto">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        Welcome back, {userData?.firstName}!
                    </h1>
                    <p className="text-gray-600">Ready to create amazing learning materials?</p>
                </div>
                <Button
                    onClick={() => navigate('/createDocument')}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-5 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 mt-4 md:mt-0"
                >
                    <Plus className="mr-2 w-5 h-5" /> Create New Document
                </Button>
            </section>

            {/* Assigned Classes Section */}
            <section className="py-8 px-6 max-w-6xl mx-auto">
    <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Your Assigned Classes</h2>
        <p className="text-gray-600">Select a class to create documents</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.length > 0 ? (
            classes.map((cls) => (
                <Link
                    key={cls._id}
                    to="/createDocument"
                    state={{ 
                        grade: cls.grade, 
                        stream: cls.stream, 
                        learningArea: cls.learningArea 
                    }}
                    className="block" // Add this to make the link work properly
                >
                    <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden group cursor-pointer">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 w-full"></div>
                        <CardHeader className="pb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <BookOpen className="text-blue-600 w-6 h-6" />
                            </div>
                            <CardTitle className="text-xl font-semibold text-gray-800">
                                {cls.grade} - {cls.stream}
                            </CardTitle>
                            <p className="text-gray-600 text-sm">{cls.learningArea}</p>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-500 text-sm">Click to create documents for this class</p>
                        </CardContent>
                    </Card>
                </Link>
            ))
        ) : (
            <div className="col-span-full text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="text-gray-400 w-8 h-8" />
                </div>
                <p className="text-gray-500">No classes assigned yet</p>
            </div>
        )}
    </div>
</section>

            {/* Stats Section */}
            <section className="py-8 px-6 max-w-6xl mx-auto">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Your Document Stats</h2>
                    <p className="text-gray-600">Track your teaching resources</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
                        <div className="bg-gradient-to-r from-green-500 to-green-600 h-2 w-full"></div>
                        <CardHeader className="pb-4">
                            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
                                <FileText className="text-green-600 w-6 h-6" />
                            </div>
                            <CardTitle className="text-xl font-semibold text-gray-800">Documents Created</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-gray-800">{documentsCreatedCount}</p>
                        </CardContent>
                        <CardFooter>
                            <p className="text-gray-500 text-sm">Your created documents</p>
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
                            <p className="text-3xl font-bold text-gray-800">{downloadsCount}</p>
                        </CardContent>
                        <CardFooter>
                            <p className="text-gray-500 text-sm">Documents you downloaded</p>
                        </CardFooter>
                    </Card>

                    <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 w-full"></div>
                        <CardHeader className="pb-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mb-4">
                                <BarChart3 className="text-purple-600 w-6 h-6" />
                            </div>
                            <CardTitle className="text-xl font-semibold text-gray-800">Teaching Productivity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold text-gray-800">+{(documentsCreatedCount) * 3}%</p>
                            <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-purple-700">{documentsCreatedCount} resources created</span>
                                    <span className="text-purple-900 font-medium">
                                        ~{(documentsCreatedCount) * 2} hours saved
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col items-start gap-2">
                            <p className="text-gray-500 text-sm">Based on time saved through resource creation</p>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div 
                                    className="bg-purple-600 h-1.5 rounded-full transition-all duration-300" 
                                    style={{ width: `${Math.min(100, (documentsCreatedCount) * 3)}%` }}
                                ></div>
                            </div>
                        </CardFooter>
                    </Card>
                </div>
            </section>

            {/* Recent Downloads Section */}
<section className="py-8 px-6 max-w-6xl mx-auto">
  <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 w-full"></div>
    <CardHeader className="pb-4">
      <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
        <Download className="h-5 w-5 text-blue-600" />
        Recently Downloaded Documents
      </CardTitle>
      <p className="text-gray-600 text-sm">
        Your most recently downloaded teaching resources
      </p>
    </CardHeader>
    <CardContent>
      <RecentDocuments userId={userData?._id} />
    </CardContent>
  </Card>
</section>
        </div>
    );
}