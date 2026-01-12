import React, { useState, useEffect } from "react";
import { LogOut, User, BookOpen, ChevronDown, X, FileText, Settings } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { getProfilePictureUrl } from "@/utils/profilePicUtils";

export default function Navbar({ userData }) {
  const navigate = useNavigate();
  const [profilePic, setProfilePic] = useState(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [downloadCount, setDownloadCount] = useState(0);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

  // ✅ Sync profile picture using utility function
  const syncProfilePic = () => {
    console.log('🔄 Syncing profile picture...');
    
    // Get userData from props or localStorage
    const currentUserData = userData || JSON.parse(localStorage.getItem("userData"));
    
    if (!currentUserData) {
      console.log('❌ No user data found');
      return;
    }

    const profilePicValue = currentUserData.profilePic;
    console.log('📸 Profile pic value from user data:', profilePicValue);
    
    // Use utility function to get the correct URL
    const picUrl = getProfilePictureUrl(profilePicValue);
    console.log('🎯 Resolved profile pic URL:', picUrl);
    
    setProfilePic(picUrl);
    setImageError(false);
  };

  // Fetch download count
  useEffect(() => {
    const fetchDownloadCount = async () => {
      if (userData?._id) {
        try {
          const response = await fetch(`${API_BASE_URL}/teacher/${userData._id}/downloads/count`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          const data = await response.json();
          setDownloadCount(data.count || 0);
        } catch (error) {
          console.error('Error fetching download count:', error);
        }
      }
    };
    
    fetchDownloadCount();
    window.addEventListener('documentDownloaded', fetchDownloadCount);
    return () => window.removeEventListener('documentDownloaded', fetchDownloadCount);
  }, [userData?._id, API_BASE_URL]);

  // Initial sync and setup listeners
  useEffect(() => {
    syncProfilePic();
    
    // Listen for storage changes
    window.addEventListener("storage", syncProfilePic);
    window.addEventListener("profilePicUpdated", syncProfilePic);

    return () => {
      window.removeEventListener("storage", syncProfilePic);
      window.removeEventListener("profilePicUpdated", syncProfilePic);
    };
  }, [userData]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleProfilePicClick = () => setIsZoomed(true);
  const handleCloseZoom = () => setIsZoomed(false);
  const handleImageError = () => {
    console.error("❌ Failed to load profile image:", profilePic);
    setImageError(true);
  };

  return (
    <>
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 px-6 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <BookOpen className="text-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              DBSL
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden md:flex flex-col items-end mr-3">
              <h2 className="text-sm font-semibold text-gray-800">
                {userData?.firstName} {userData?.lastName}
              </h2>
              <h3 className="text-xs text-gray-600 capitalize">
                {userData?.role}
              </h3>
            </div>

            {/* Profile Picture */}
            <div className="flex items-center space-x-2">
              <div 
                className="w-10 h-10 rounded-full border-2 border-gray-200 shadow-sm cursor-pointer overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 hover:border-gray-300 transition-all duration-200"
                onClick={handleProfilePicClick}
              >
                {profilePic && !imageError ? (
                  <img
                    src={profilePic}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="text-white w-5 h-5" />
                  </div>
                )}
              </div>

              {/* Dropdown Trigger */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full">
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white border border-gray-200 rounded-xl shadow-lg">
                  <div className="px-2 py-1.5 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-800">
                      {userData?.firstName} {userData?.lastName}
                    </p>
                    <p className="text-xs text-gray-600 capitalize">
                      {userData?.role}
                    </p>
                  </div>

                  <DropdownMenuItem asChild>
                    <Link to="/my-documents" className="flex items-center space-x-2 px-3 py-2 cursor-pointer hover:bg-gray-50 rounded-lg">
                      <FileText className="h-4 w-4 text-gray-600" />
                      <span>My Documents</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center space-x-2 px-3 py-2 cursor-pointer hover:bg-gray-50 rounded-lg">
                      <Settings className="h-4 w-4 text-gray-600" />
                      <span>Profile Settings</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={handleLogout} className="flex items-center space-x-2 cursor-pointer px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg focus:text-red-600 focus:bg-red-50">
                    <LogOut className="h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile logout button */}
            <Button onClick={handleLogout} variant="ghost" size="icon" className="md:hidden text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Zoom Modal */}
      {isZoomed && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={handleCloseZoom}>
          <div className="relative max-w-2xl max-h-full">
            <button onClick={handleCloseZoom} className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10">
              <X className="w-8 h-8" />
            </button>
            <div className="bg-white p-2 rounded-lg" onClick={(e) => e.stopPropagation()}>
              {profilePic && !imageError ? (
                <img 
                  src={profilePic} 
                  alt="Profile Preview" 
                  className="w-full h-auto max-h-[70vh] object-contain rounded-md"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="w-64 h-64 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto">
                  <User className="text-white w-20 h-20" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}