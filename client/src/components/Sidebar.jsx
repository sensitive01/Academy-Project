import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  DollarSign,
  Settings,
  GraduationCap,
  ShieldCheck,
  Building2,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CalendarCheck,
  CreditCard,
  Clock,
  MonitorPlay,
  Megaphone,
  Receipt,
  MessageSquare,
  Briefcase,
  Key,
  ShieldAlert,
  FileText
} from "lucide-react";
import logo from "../assets/logo-2.jpeg";
import { useAuth } from "../context/AuthContext";

const NavItem = ({ item, isCollapsed, closeMobile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // If the current path matches any subItem path, we should keep the dropdown open
  React.useEffect(() => {
    if (item.subItems && item.subItems.some((sub) => location.pathname.includes(sub.path))) {
      setIsOpen(true);
    }
  }, [location.pathname, item.subItems]);

  if (item.subItems) {
    return (
      <li>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-between w-full p-3 my-1 rounded-xl transition-all duration-200 group overflow-hidden whitespace-nowrap text-slate-400 hover:bg-slate-800 hover:text-white`}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">{item.icon}</div>
            <span
              className={`ml-3 font-medium transition-opacity duration-300 ${
                isCollapsed ? "lg:opacity-0 lg:w-0" : "opacity-100"
              }`}
            >
              {item.label}
            </span>
          </div>
          {!isCollapsed && (
            <ChevronDown
              size={16}
              className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            />
          )}
        </button>
        {isOpen && !isCollapsed && (
          <ul className="pl-10 space-y-1 mt-1 mb-2">
            {item.subItems.map((subItem) => (
              <li key={subItem.path}>
                <NavLink
                  to={subItem.path}
                  end
                  onClick={closeMobile}
                  className={({ isActive }) =>
                    `flex items-center p-2 rounded-lg transition-all duration-200 text-sm ${
                      isActive
                        ? "text-brand-400 font-semibold"
                        : "text-slate-500 hover:text-white hover:bg-slate-800/50"
                    }`
                  }
                >
                  {subItem.label}
                </NavLink>
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <li>
      <NavLink
        to={item.path}
        end
        onClick={closeMobile}
        className={({ isActive }) =>
          `flex items-center p-3 my-1 rounded-xl transition-all duration-200 group overflow-hidden whitespace-nowrap ${
            isActive
              ? "bg-brand-600 text-white shadow-lg shadow-brand-900/30"
              : "text-slate-400 hover:bg-slate-800 hover:text-white"
          }`
        }
      >
        <div className="flex-shrink-0">{item.icon}</div>
        <span
          className={`ml-3 font-medium transition-opacity duration-300 ${
            isCollapsed ? "lg:opacity-0 lg:w-0" : "opacity-100"
          }`}
        >
          {item.label}
        </span>
      </NavLink>
    </li>
  );
};

const Sidebar = ({ isCollapsed, toggleSidebar, mobileOpen, closeMobile }) => {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase();

  // ================= STUDENT MENU =================
  const studentItems = [
    { icon: <LayoutDashboard size={22} />, label: "Dashboard", path: "/dashboard" },
    { icon: <MonitorPlay size={22} />, label: "Enroll Class", path: "/dashboard/enroll" },
    { icon: <GraduationCap size={22} />, label: "My Learning", path: "/dashboard/lms" },
    { icon: <CalendarCheck size={22} />, label: "Attendance", path: "/dashboard/attendance" },
    { icon: <UserCheck size={22} />, label: "Leave Request", path: "/dashboard/leave-request" },
    { icon: <CreditCard size={22} />, label: "Subscription", path: "/dashboard/subscription" },
    { icon: <Clock size={22} />, label: "Time Table", path: "/dashboard/timetable" },
    { icon: <FileText size={22} />, label: "Exam Management", path: "/dashboard/exams" },
    { icon: <Megaphone size={22} />, label: "Announcements", path: "/dashboard/announcements" },
    { icon: <MessageSquare size={22} />, label: "Discussion Forum", path: "/dashboard/forum" },
  ];

  // ================= ADMIN / HR MENU =================
  const adminItems = [
    { icon: <LayoutDashboard size={22} />, label: "Dashboard", path: "/dashboard" },
    { icon: <ShieldCheck size={22} />, label: "Course Mgmt", path: "/dashboard/admin/courses" },
    { icon: <GraduationCap size={22} />, label: "Students", path: "/dashboard/students" },
    { icon: <Users size={22} />, label: "Parent Mgmt", path: "/dashboard/admin/parents" },
    { icon: <Building2 size={22} />, label: "Center Management", path: "/dashboard/admin/centers" },
    { 
      icon: <CreditCard size={22} />, 
      label: "Payments", 
      subItems: [
        { label: "Inward", path: "/dashboard/payments/inward" },
        { label: "Outward", path: "/dashboard/payments/outward" }
      ]
    },
    { icon: <Users size={22} />, label: "Employee Management", path: "/dashboard/hr" },
    { icon: <Briefcase size={22} />, label: "Vendor Mgmt", path: "/dashboard/admin/vendors" },
    { icon: <Megaphone size={22} />, label: "Announcements", path: "/dashboard/announcements" },
    { icon: <MessageSquare size={22} />, label: "Discussion Forum", path: "/dashboard/forum" },
    { icon: <MessageSquare size={22} />, label: "Enquiries", path: "/dashboard/admin/enquiries" },
  ];

  // ================= COACH MENU =================
  const coachItems = [
    { icon: <LayoutDashboard size={22} />, label: "Dashboard", path: "/dashboard" },
    { icon: <MonitorPlay size={22} />, label: "My Courses", path: "/dashboard/coach/my-courses" },
    { icon: <GraduationCap size={22} />, label: "Students", path: "/dashboard/students" },
    { icon: <CalendarCheck size={22} />, label: "Attendance", path: "/dashboard/attendance" },
    { icon: <FileText size={22} />, label: "Exam Management", path: "/dashboard/exams" },
    { icon: <UserCheck size={22} />, label: "Leave Request", path: "/dashboard/leave-request" },
    { icon: <Megaphone size={22} />, label: "Announcements", path: "/dashboard/announcements" },
    { icon: <MessageSquare size={22} />, label: "Discussion Forum", path: "/dashboard/forum" },
  ];

  // ================= PARENT MENU =================
  const parentItems = [
    { icon: <Users size={22} />, label: "Dashboard", path: "/dashboard/parent-dashboard" },
    { icon: <CalendarCheck size={22} />, label: "Attendance", path: "/dashboard/parent/child-attendance" },
    { icon: <UserCheck size={22} />, label: "Leave Request", path: "/dashboard/parent/child-leave" },
    { icon: <MonitorPlay size={22} />, label: "Enroll Class", path: "/dashboard/enroll" },
    { icon: <FileText size={22} />, label: "Exam Management", path: "/dashboard/exams" },
    { icon: <Megaphone size={22} />, label: "Announcements", path: "/dashboard/announcements" },
    { icon: <MessageSquare size={22} />, label: "Discussion Forum", path: "/dashboard/forum" },
  ];

  const employeeItems = [
    { icon: <LayoutDashboard size={22} />, label: "Dashboard", path: "/dashboard" },
    { icon: <CalendarCheck size={22} />, label: "Attendance", path: "/dashboard/attendance" },
    { icon: <UserCheck size={22} />, label: "Leave Request", path: "/dashboard/leave-request" },
    { icon: <Megaphone size={22} />, label: "Announcements", path: "/dashboard/announcements" },
    { icon: <MessageSquare size={22} />, label: "Discussion Forum", path: "/dashboard/forum" },
  ];

  const financeItems = [
    { icon: <LayoutDashboard size={22} />, label: "Dashboard", path: "/dashboard" },
    { icon: <GraduationCap size={22} />, label: "Students", path: "/dashboard/students" },
    { icon: <UserCheck size={22} />, label: "Leave Request", path: "/dashboard/leave-request" },
    { icon: <Megaphone size={22} />, label: "Announcements", path: "/dashboard/announcements" },
    { icon: <MessageSquare size={22} />, label: "Discussion Forum", path: "/dashboard/forum" },
  ];

  const centerItems = [
    { icon: <LayoutDashboard size={22} />, label: "Dashboard", path: "/dashboard" },
    { icon: <Users size={22} />, label: "Employee Management", path: "/dashboard/hr" },
    { icon: <GraduationCap size={22} />, label: "Students", path: "/dashboard/students" },
    { icon: <CalendarCheck size={22} />, label: "Attendance", path: "/dashboard/attendance" },
    { icon: <Megaphone size={22} />, label: "Announcements", path: "/dashboard/announcements" },
    { icon: <MessageSquare size={22} />, label: "Discussion Forum", path: "/dashboard/forum" },
  ];

  const vendorItems = [
    { icon: <LayoutDashboard size={22} />, label: "Dashboard", path: "/dashboard/vendor" },
    { icon: <CalendarCheck size={22} />, label: "Attendance", path: "/dashboard/vendor/attendance" },
    { icon: <UserCheck size={22} />, label: "Leave Requests", path: "/dashboard/vendor/leaves" },
  ];

  const subAdminItems = [
    { icon: <LayoutDashboard size={22} />, label: "Dashboard", path: "/dashboard" },
    { icon: <Users size={22} />, label: "Employee Management", path: "/dashboard/hr" },
    { icon: <Megaphone size={22} />, label: "Announcements", path: "/dashboard/announcements" },
    { icon: <MessageSquare size={22} />, label: "Discussion Forum", path: "/dashboard/forum" },
    { 
      icon: <CreditCard size={22} />, 
      label: "Payments", 
      subItems: [
        { label: "Inward", path: "/dashboard/payments/inward" },
        { label: "Outward", path: "/dashboard/payments/outward" }
      ]
    },
    { icon: <Briefcase size={22} />, label: "Vendor Management", path: "/dashboard/admin/vendors" },
  ];

  // ================= ROLE BASED NAVIGATION =================
  let currentNavItems = [];

  if (role === "student") {
    currentNavItems = studentItems;
  } else if (role === "parent") {
    currentNavItems = parentItems;
  } else if (role === "admin" || role === "hr") {
    currentNavItems = adminItems;
  } else if (role === "sub-admin") {
    currentNavItems = subAdminItems;
  } else if (role === "coach") {
    currentNavItems = coachItems;
  } else if (role === "employee") {
    currentNavItems = employeeItems;
  } else if (role === "finance") {
    currentNavItems = financeItems;
  } else if (role === "center") {
    currentNavItems = centerItems;
  } else if (role === "vendor") {
    currentNavItems = vendorItems;
  }

  const sidebarClasses =
    "fixed left-0 top-0 z-50 h-screen bg-slate-900 text-white transition-all duration-300 ease-in-out shadow-xl flex flex-col";

  const responsiveClasses = `${mobileOpen ? "translate-x-0" : "-translate-x-[110%]"
    } lg:translate-x-0 lg:static lg:h-screen lg:m-0 lg:shadow-none`;

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={closeMobile}
        ></div>
      )}

      <aside
        className={`${sidebarClasses} ${responsiveClasses} ${isCollapsed ? "lg:w-20" : "lg:w-72"
          }`}
      >
        {/* HEADER */}
        <div className="h-20 flex items-center px-6 border-b border-white/10 relative">
          {!isCollapsed ? (
            <div className="flex items-center gap-3">
              <div className="p-1 rounded bg-white">
                <img src={logo} alt="DRRG Academy Logo" className="h-10 w-auto object-contain" />
              </div>
            </div>
          ) : (
            <div className="mx-auto bg-brand-600 p-2 rounded-lg">
              <BookOpen size={24} />
            </div>
          )}

          <button
            onClick={toggleSidebar}
            className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-brand-600 rounded-full items-center justify-center text-white shadow-lg border border-slate-900 hover:scale-110 transition-transform"
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* NAVIGATION */}
        <div className="flex-1 overflow-y-auto px-4 py-6 no-scrollbar">
          <ul className="space-y-1 mb-8">
            {currentNavItems.map((item) => (
              <NavItem
                key={item.path}
                item={item}
                isCollapsed={isCollapsed}
                closeMobile={closeMobile}
              />
            ))}
          </ul>
        </div>

        {/* USER FOOTER */}
        <div className="p-4 border-t border-white/10 bg-slate-800/50">
          <div
            className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : ""
              }`}
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-500 to-brand-700 flex items-center justify-center text-sm font-bold border border-white/10">
              {user?.name?.charAt(0)}
            </div>

            {!isCollapsed && (
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate text-white">
                  {user?.name}
                </p>
                <p className="text-xs text-slate-400 truncate capitalize">
                  {user?.role}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;