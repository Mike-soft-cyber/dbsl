import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CircleCheckBig, FileText, ArrowLeft } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Toaster, toast } from "sonner";
import Navbar from "@/components/ui/dashboard/NavBar";
import API from "@/api";

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state;
  const userData = JSON.parse(localStorage.getItem("userData"));
  const teacherId = localStorage.getItem("teacherId");
  const [loading, setLoading] = useState(false);

  const handleGenerateDocument = async () => {
  try {
    setLoading(true);

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
    };

    console.log("📤 Sending payload:", payload);

    const res = await API.post(`/documents/generate`, payload);
    
    console.log("📥 Response received:", res.data);
    
    if (res.data.success) {
      toast.success("Document generated successfully!");
      
      // Get the document ID from the response
      const documentId = res.data.document?._id || res.data.documentId;
      
      if (documentId) {
        console.log("✅ Navigating to document:", documentId);
        navigate(`/documents/${documentId}`);
      } else {
        console.error("❌ No document ID in response:", res.data);
        toast.error("Document generated but ID not found. Please check your documents.");
        navigate('/my-documents');
      }
    } else {
      throw new Error(res.data.error || "Failed to generate document");
    }
  } catch (err) {
    console.error("❌ Error generating document:", err.response?.data || err.message);
    toast.error(err.response?.data?.message || "Failed to generate document");
  } finally {
    setLoading(false);
  }
};

  const handleBack = () => {
    navigate('/createDocument');
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
        <Navbar />
        <Toaster richColors position="top-center" />
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 text-center">
          <p className="text-gray-600 mb-4">
            No document data found.
          </p>
          <Button 
            onClick={() => navigate('/dashboard')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar userData={userData} />

      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            onClick={handleBack}
            className="bg-white text-gray-700 border border-gray-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-all hover:bg-gray-50"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="bg-white p-6 rounded-2xl shadow-lg flex-1 border border-gray-100">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Document Preview
            </h1>
            <p className="text-gray-600 mt-2">
              Review your document details before generation
            </p>
          </div>
        </div>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-green-600 h-2 w-full"></div>
          
          <CardHeader className="pb-6">
            <CardTitle className="text-xl md:text-2xl font-semibold text-gray-800 flex items-center gap-3">
              <CircleCheckBig className="text-green-600 w-6 h-6" />
              Document Ready to Generate
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-sm font-semibold text-gray-600">Document Type</span>
                <p className="text-gray-800 font-medium">{data?.type}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-semibold text-gray-600">Term</span>
                <p className="text-gray-800 font-medium">{data?.term}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-semibold text-gray-600">Grade</span>
                <p className="text-gray-800 font-medium">{data?.grade}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-semibold text-gray-600">Stream</span>
                <p className="text-gray-800 font-medium">{data?.stream}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-semibold text-gray-600">Facilitator</span>
                <p className="text-gray-800 font-medium">{data?.teacherName}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-semibold text-gray-600">Learning Area</span>
                <p className="text-gray-800 font-medium">{data?.learningArea}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-semibold text-gray-600">Strand</span>
                <p className="text-gray-800 font-medium">{data?.strand}</p>
              </div>
              <div className="space-y-1">
  <span className="text-sm font-semibold text-gray-600">Substrand</span>
  <p className="text-gray-800 font-medium">{data?.substrand}</p> {/* CHANGED: data?.substrands -> data?.substrand */}
</div>
            </div>

            <Button
              onClick={handleGenerateDocument}
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-5 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:transform-none disabled:cursor-not-allowed mt-6"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Generating Document...
                </div>
              ) : (
                <>
                  <FileText className="w-5 h-5 mr-2" />
                  Generate Document Now
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Toaster richColors position="top-center" />
    </div>
  );
}