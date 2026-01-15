import { React, useState, useEffect } from "react";
import {
  Users,
  FileText,
  BookOpen,
  CreditCard,
  Settings,
  LayoutDashboard,
  LogOut,
  School,
  Menu,
  X,
  MoreVertical,
  Home,
  Bell,
  Search
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarProvider,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "@/components/ui/sidebar";
import Navbar from "@/components/ui/dashboard/Navbar"; // Your Navbar component
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import axios from "axios";

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const SERVER_BASE_URL = API_BASE_URL.replace("/api", "");

const API = axios.create({
  baseURL: API_BASE_URL,
});

export default function AdminPages() {
  const navigate = useNavigate();
  const location = useLocation();
  const userData = JSON.parse(localStorage.getItem("userData"));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [schoolLogo, setSchoolLogo] = useState(null);
  const [schoolName, setSchoolName] = useState("EduAdmin");
  const [isMobile, setIsMobile] = useState(false);

  const menuItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/adminPages/adminDash" },
    { label: "Teachers", icon: Users, path: "/adminPages/adminTeachers" },
    { label: "CBC Data", icon: BookOpen, path: "/adminPages/cbcdata" },
    { label: "Documents", icon: FileText, path: "/adminPages/docDashboard" },
    { label: "Payments", icon: CreditCard, path: "/adminPages/payment" },
    { label: "Settings", icon: Settings, path: "/adminPages/adminSettings" }
  ];

  // Check mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch school logo and details
  useEffect(() => {
    const fetchSchoolData = async () => {
      try {
        if (!userData?.schoolCode) return;

        const token = localStorage.getItem("token");
        const response = await API.get(`/school-config/${userData.schoolCode}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          const schoolData = response.data.school;
          
          if (schoolData.schoolLogo) {
            setSchoolLogo(`${SERVER_BASE_URL}/uploads/school-logos/${schoolData.schoolLogo}`);
          }
          
          if (schoolData.schoolName) {
            setSchoolName(schoolData.schoolName);
          }
        }
      } catch (error) {
        console.log("Could not fetch school data:", error);
      }
    };

    fetchSchoolData();

    const handleLogoUpdate = (event) => {
      if (event.detail.schoolLogo) {
        setSchoolLogo(`${SERVER_BASE_URL}/uploads/school-logos/${event.detail.schoolLogo}`);
      }
      if (event.detail.schoolName) {
        setSchoolName(event.detail.schoolName);
      }
    };

    window.addEventListener("schoolLogoUpdated", handleLogoUpdate);

    return () => {
      window.removeEventListener("schoolLogoUpdated", handleLogoUpdate);
    };
  }, [userData?.schoolCode]);

  const handleLogout = () => {
    localStorage.removeItem("userData");
    navigate("/login");
  };

  const handleNavigation = (path) => {
    navigate(path);
    setIsSidebarOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-gray-50 text-gray-900">
      <SidebarProvider>
        {/* Desktop Sidebar */}
        <Sidebar className="hidden md:flex bg-white border-r border-gray-200 shadow-sm w-64">
          <SidebarContent>
            <SidebarGroup className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-teal-100 rounded-lg flex-shrink-0">
                  {schoolLogo ? (
                    <img
                      src={schoolLogo}
                      alt="School Logo"
                      className="h-6 w-6 object-contain rounded"
                      onError={() => setSchoolLogo(null)}
                    />
                  ) : (
                    <School className="h-6 w-6 text-teal-700" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="font-bold text-lg text-gray-800 truncate">{schoolName}</h1>
                  <p className="text-xs text-gray-500">Management Portal</p>
                </div>
              </div>
            </SidebarGroup>
            
            <SidebarGroup className="mt-4">
              <SidebarMenu className="space-y-1 px-2">
                {menuItems.map(({ label, icon: Icon, path }) => (
                  <SidebarMenuItem key={label}>
                    <SidebarMenuButton
                      onClick={() => handleNavigation(path)}
                      className={`flex items-center px-3 py-3 rounded-lg transition-colors duration-150 ${
                        isActive(path) 
                          ? 'bg-teal-50 text-teal-700 border-r-2 border-teal-700' 
                          : 'text-gray-600 hover:bg-teal-50 hover:text-teal-700'
                      }`}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      <span className="text-sm font-medium">{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                
                <SidebarMenuItem className="mt-8">
                  <SidebarMenuButton
                    onClick={handleLogout}
                    className="flex items-center px-3 py-3 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-150"
                  >
                    <LogOut className="mr-3 h-5 w-5" />
                    <span className="text-sm font-medium">Logout</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        {/* Main Content Area */}
        <div className="flex flex-col flex-1 w-full">
          {/* NAVBAR - ALWAYS VISIBLE ON BOTH DESKTOP AND MOBILE */}
          <Navbar userData={userData} />
          
          <div className="flex flex-1">
            {/* Mobile-only compact sidebar toggle */}
            {isMobile && (
              <div className="md:hidden fixed top-16 left-0 right-0 bg-white border-b border-gray-200 z-40">
                <div className="flex overflow-x-auto px-2 py-1">
                  {menuItems.map(({ label, icon: Icon, path }) => (
                    <button
                      key={label}
                      onClick={() => handleNavigation(path)}
                      className={`flex flex-col items-center p-2 min-w-[70px] flex-shrink-0 ${
                        isActive(path)
                          ? 'text-teal-600 bg-teal-50'
                          : 'text-gray-600 hover:text-teal-600'
                      }`}
                    >
                      <Icon className="h-4 w-4 mb-1" />
                      <span className="text-xs font-medium truncate">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <main className={`flex-1 overflow-auto bg-gray-50 ${
              isMobile ? 'mt-16' : ''
            }`}>
              {/* Adjust padding based on mobile header */}
              <div className={`${isMobile ? 'pt-2' : 'p-4 md:p-6'}`}>
                <Outlet />
              </div>
            </main>
          </div>

          {/* Mobile Sidebar Menu (Additional options) */}
          {isMobile && isSidebarOpen && (
            <div className="md:hidden fixed inset-0 z-50">
              {/* Backdrop */}
              <div 
                className="absolute inset-0 bg-black/50"
                onClick={() => setIsSidebarOpen(false)}
              />
              
              {/* Slide-up menu */}
              <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl transform transition-transform duration-300 animate-in slide-in-from-bottom-full max-h-[70vh] overflow-y-auto">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-teal-100 rounded-lg">
                        {schoolLogo ? (
                          <img
                            src={schoolLogo}
                            alt="School Logo"
                            className="h-5 w-5 object-contain rounded"
                            onError={() => setSchoolLogo(null)}
                          />
                        ) : (
                          <School className="h-5 w-5 text-teal-700" />
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-800 text-base truncate">{schoolName}</h3>
                    </div>
                    <button 
                      onClick={() => setIsSidebarOpen(false)}
                      className="p-2 hover:bg-gray-100 rounded-full"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <button
                      onClick={() => {
                        navigate('/adminPages/docDashboard');
                        setIsSidebarOpen(false);
                      }}
                      className="p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors flex flex-col items-center"
                    >
                      <FileText className="h-5 w-5 mb-2" />
                      <span className="text-sm font-medium">Documents</span>
                    </button>
                    <button
                      onClick={() => {
                        navigate('/profile');
                        setIsSidebarOpen(false);
                      }}
                      className="p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors flex flex-col items-center"
                    >
                      <Settings className="h-5 w-5 mb-2" />
                      <span className="text-sm font-medium">Profile</span>
                    </button>
                  </div>

                  {/* Additional Links */}
                  <div className="space-y-1 border-t border-gray-100 pt-4">
                    <button
                      onClick={() => {
                        navigate('/my-documents');
                        setIsSidebarOpen(false);
                      }}
                      className="flex items-center w-full p-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                    >
                      <FileText className="mr-3 h-5 w-5" />
                      <span className="font-medium">My Documents</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        navigate('/adminPages/adminSettings');
                        setIsSidebarOpen(false);
                      }}
                      className="flex items-center w-full p-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                    >
                      <Settings className="mr-3 h-5 w-5" />
                      <span className="font-medium">Admin Settings</span>
                    </button>
                    
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full p-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors duration-150 border-t border-gray-100 pt-4 mt-4"
                    >
                      <LogOut className="mr-3 h-5 w-5" />
                      <span className="font-medium">Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </SidebarProvider>
    </div>
  );
}