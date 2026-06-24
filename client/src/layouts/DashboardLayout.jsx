import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import Loading from "../components/Loading";

const DashboardLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsNavigating(true);
    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, 600); // Premium short transition delay
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Helper to determine page title
  const getPageTitle = () => {
    const p = location.pathname;
    if (p.includes("/dashboard/lms")) return "My Learning";
    if (p.includes("/dashboard/enroll")) return "Enroll New Class";
    if (p.includes("/dashboard/attendance")) return "My Attendance";
    if (p.includes("/dashboard/subscription")) return "Subscription Plan";
    if (p.includes("/dashboard/timetable")) return "Class Time Table";
    if (p.includes("/hr")) return "Employee Management";
    if (p.includes("/finance")) return "Finance";
    if (p.includes("/students")) return "Student Management";
    if (p.includes("/admin")) return "Administration";
    if (p.includes("/settings")) return "Settings";
    return "Overview Dashboard";
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-50 flex font-sans">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        mobileOpen={isMobileSidebarOpen}
        closeMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Wrapper */}
      <div
        className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 ease-in-out`}
      >
        {/* Top Header */}
        <DashboardHeader
          toggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          title={getPageTitle()}
        />
        <main className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col">
          <div className="flex-1 p-6">
            {isNavigating ? (
              <div className="flex items-center justify-center h-full">
                <Loading message="Loading..." />
              </div>
            ) : (
              <Outlet />
            )}
          </div>
          {/* Dashboard Footer */}
          <footer className="mt-auto py-4 px-6 text-center text-sm text-slate-500 border-t border-slate-200">
            Designed and developed by{" "}
            <a 
              href="https://sensitive.co.in/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-brand-600 hover:text-brand-700 hover:underline font-medium transition-colors"
            >
              sensitive technologies
            </a>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
