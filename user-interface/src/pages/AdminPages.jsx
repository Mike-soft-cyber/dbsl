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
  MoreVertical
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
import Navbar from "@/components/ui/dashboard/NavBar";
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
          
          // Set school logo if available
          if (schoolData.schoolLogo) {
            setSchoolLogo(`${SERVER_BASE_URL}/uploads/school-logos/${schoolData.schoolLogo}`);
          }
          
          // Set school name if available
          if (schoolData.schoolName) {
            setSchoolName(schoolData.schoolName);
          }
        }
      } catch (error) {
        console.log("Could not fetch school data:", error);
        // Silently fail - will use defaults
      }
    };

    fetchSchoolData();

    // Listen for logo updates from settings page
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
        {/* Mobile Header */}
        {isMobile && (
          <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm z-50">
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-100 rounded-lg">
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
                  <h1 className="font-bold text-base text-gray-800 truncate">{schoolName}</h1>
                  <p className="text-xs text-gray-500">Portal</p>
                </div>
              </div>
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        )}

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
        <div className={`flex flex-col flex-1 w-full pb-16 md:pb-0 ${isMobile ? 'pt-16' : ''}`}>
          {/* Show Navbar only on desktop */}
          {!isMobile && <Navbar userData={userData} />}
          
          <main className="flex-1 p-3 md:p-6 overflow-auto bg-gray-50">
            <Outlet />
          </main>

          {/* Mobile Bottom Navigation */}
          {isMobile && (
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
              <div className="flex justify-around items-center py-1">
                {menuItems.slice(0, 4).map(({ label, icon: Icon, path }) => (
                  <button
                    key={label}
                    onClick={() => handleNavigation(path)}
                    className={`flex flex-col items-center p-1 rounded-lg transition-colors duration-150 min-w-0 flex-1 mx-0.5 ${
                      isActive(path) 
                        ? 'text-teal-600 bg-teal-50' 
                        : 'text-gray-600 hover:text-teal-600'
                    }`}
                  >
                    <Icon className="h-4 w-4 mb-0.5" />
                    <span className="text-[10px] font-medium truncate max-w-full px-1">{label}</span>
                  </button>
                ))}
                
                {/* More menu button */}
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className={`flex flex-col items-center p-1 rounded-lg transition-colors duration-150 min-w-0 flex-1 mx-0.5 ${
                    isSidebarOpen 
                      ? 'text-teal-600 bg-teal-50' 
                      : 'text-gray-600 hover:text-teal-600'
                  }`}
                >
                  <MoreVertical className="h-4 w-4 mb-0.5" />
                  <span className="text-[10px] font-medium">More</span>
                </button>
              </div>
            </div>
          )}

          {/* Mobile Sidebar Menu */}
          {isMobile && isSidebarOpen && (
            <div className="md:hidden fixed inset-0 z-50">
              {/* Backdrop */}
              <div 
                className="absolute inset-0 bg-black/50"
                onClick={() => setIsSidebarOpen(false)}
              />
              
              {/* Slide-up menu */}
              <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl transform transition-transform duration-300 animate-in slide-in-from-bottom-full">
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

                  {/* Menu items */}
                  <div className="space-y-1">
                    {menuItems.slice(4).map(({ label, icon: Icon, path }) => (
                      <button
                        key={label}
                        onClick={() => handleNavigation(path)}
                        className={`flex items-center w-full p-3 rounded-lg transition-colors duration-150 ${
                          isActive(path) 
                            ? 'bg-teal-50 text-teal-700' 
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="mr-3 h-5 w-5" />
                        <span className="font-medium">{label}</span>
                      </button>
                    ))}
                    
                    {/* Logout */}
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full p-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors duration-150 mt-2 border-t border-gray-100 pt-3"
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