// import React, { useState, useEffect, useRef } from "react";
// import { NavLink, useNavigate } from "react-router-dom";
// import {
//   LayoutDashboard,
//   BookOpen,
//   Users,
//   DollarSign,
//   GraduationCap,
//   ShieldCheck,
//   Bell,
//   Search,
//   Menu,
//   X,
//   LogOut,
//   ChevronDown,
// } from "lucide-react";
// import { useAuth } from "../../context/AuthContext";
// import api from "../../services/api";

// const TopNavigation = () => {
//   const { user, logout } = useAuth();
//   const navigate = useNavigate();

//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
//   const [notifications, setNotifications] = useState([]);
//   const [showDropdown, setShowDropdown] = useState(false);
//   const [showNotifications, setShowNotifications] = useState(false);

//   const dropdownRef = useRef(null);

//   // Navigation items
//   const navItems = [
//     { icon: <LayoutDashboard size={18} />, label: "Dashboard", path: "/dashboard" },
//     { icon: <BookOpen size={18} />, label: "LMS", path: "/dashboard/lms" },
//     { icon: <Users size={18} />, label: "HR", path: "/dashboard/hr" },
//     { icon: <DollarSign size={18} />, label: "Finance", path: "/dashboard/finance" },
//     { icon: <GraduationCap size={18} />, label: "Students", path: "/dashboard/students" },
//   ];

//   const adminItems = [
//     { icon: <ShieldCheck size={18} />, label: "Admin", path: "/dashboard/admin/courses" },
//   ];

//   const allItems =
//     user?.role === "admin" ? [...navItems, ...adminItems] : navItems;

//   const handleLogout = () => {
//     logout();
//     navigate("/login");
//   };

//   // 🔔 Fetch Notifications
//   useEffect(() => {
//     const fetchNotifications = async () => {
//       try {
//         const { data } = await api.get("/notifications");
//         setNotifications(data);
//       } catch (error) {
//         console.error(error);
//       }
//     };

//     if (user) {
//       fetchNotifications();

//       const interval = setInterval(fetchNotifications, 10000);
//       return () => clearInterval(interval);
//     }
//   }, [user]);

//   // 🔥 Close dropdown on outside click
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (
//         dropdownRef.current &&
//         !dropdownRef.current.contains(event.target)
//       ) {
//         setShowDropdown(false);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () =>
//       document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const unreadCount = notifications.filter((n) => !n.isRead).length;

//   const markAsRead = async (id) => {
//     try {
//       await api.patch(`/notifications/${id}/read`);
//       setNotifications((prev) =>
//         prev.map((n) =>
//           n._id === id ? { ...n, isRead: true } : n
//         )
//       );
//     } catch (error) {
//       console.error(error);
//     }
//   };

//   return (
//     <nav className="bg-white border-b border-slate-200 sticky top-0 z-[100] shadow-sm">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="flex justify-between h-16 items-center">
          
//           {/* Logo */}
//           <div className="flex items-center gap-2.5">
//             <div className="bg-brand-700 text-white p-1.5 rounded-lg shadow-sm">
//               <BookOpen size={20} />
//             </div>
//             <span className="text-xl font-bold text-slate-900 tracking-tight hidden md:block">
//               DRRG Academy
//             </span>
//           </div>

//           {/* Desktop Navigation */}
//           <div className="hidden md:flex md:ml-8 md:space-x-4">
//             {allItems.map((item) => (
//               <NavLink
//                 key={item.path}
//                 to={item.path}
//                 end={item.path === "/dashboard"}
//                 className={({ isActive }) =>
//                   `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-200 ${
//                     isActive
//                       ? "border-brand-700 text-brand-800"
//                       : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
//                   }`
//                 }
//               >
//                 <span className="mr-2">{item.icon}</span>
//                 {item.label}
//               </NavLink>
//             ))}
//           </div>

//           {/* Right Side */}
//           <div className="flex items-center gap-4 relative">

//             <button className="p-2 text-slate-400 hover:text-brand-700 transition-colors">
//               <Search size={20} />
//             </button>

//             {/* 🔔 Notification */}
//             <div className="relative" ref={dropdownRef}>
//               <button
//                 type="button"
//                 onClick={() => setShowNotifications(!showNotifications)}
//                 className="p-2 text-slate-400 hover:text-brand-700 transition-colors relative"
//               >
//                 <Bell size={20} />
//                 {unreadCount > 0 && (
//                   <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] px-1 rounded-full">
//                     {unreadCount}
//                   </span>
//                 )}
//               </button>

//               {showNotifications && (
//                 <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-100 rounded-xl shadow-2xl z-[101] py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
//                   <div className="px-4 py-2 border-b border-slate-50 font-bold text-slate-800">
//                     Notifications
//                   </div>

//                   <div className="max-h-80 overflow-y-auto">
//                     {notifications.length === 0 ? (
//                       <div className="p-4 text-center text-sm text-slate-400">
//                         No notifications
//                       </div>
//                     ) : (
//                       notifications.map((n) => (
//                         <div
//                           key={n._id}
//                           onClick={() => markAsRead(n._id)}
//                           className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${
//                             !n.isRead ? "bg-blue-50/50" : ""
//                           }`}
//                         >
//                           <p className={`text-sm ${!n.isRead ? "font-bold text-slate-900" : "text-slate-600"}`}>
//                             {n.message}
//                           </p>
//                           <p className="text-[10px] text-slate-400 mt-1">
//                              {new Date(n.createdAt).toLocaleDateString()}
//                           </p>
//                         </div>
//                       ))
//                     )}
//                   </div>
//                 </div>
//               )}
//             </div>

//             <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

//             {/* User Profile Desktop */}
//             <div className="hidden md:block relative">
//               <button 
//                 className="flex items-center gap-2 p-1 pl-2 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
//                 onClick={() => setShowDropdown(!showDropdown)}
//               >
//                 <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white bg-brand-600 shadow-sm overflow-hidden">
//                   {user?.profilePic?.url ? (
//                     <img src={user.profilePic.url} alt="" className="w-full h-full object-cover" />
//                   ) : (
//                     user?.name?.charAt(0)
//                   )}
//                 </div>
//                 <div className="text-left leading-none">
//                   <p className="text-xs font-bold text-slate-800 tracking-tight">{user?.name}</p>
//                   <p className="text-[10px] font-medium text-slate-400 capitalize">{user?.role}</p>
//                 </div>
//                 <ChevronDown size={14} className="text-slate-400" />
//               </button>

//               {showDropdown && (
//                 <div className="absolute right-0 mt-3 w-48 bg-white border border-slate-100 rounded-xl shadow-2xl z-[101] py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
//                   <div className="px-4 py-2 border-b border-slate-50 mb-1">
//                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">My Account</p>
//                   </div>
//                   <button 
//                     onClick={() => { navigate("/dashboard/profile"); setShowDropdown(false); }}
//                     className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-brand-50 hover:text-brand-700 transition-colors"
//                   >
//                     <User size={16} /> Edit Profile
//                   </button>
//                   <button 
//                     onClick={handleLogout}
//                     className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
//                   >
//                     <LogOut size={16} /> Sign Out
//                   </button>
//                 </div>
//               )}
//             </div>

//             {/* Mobile Menu Toggle */}
//             <div className="flex md:hidden">
//               <button
//                 onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
//                 className="p-2 text-slate-400 hover:text-slate-500 hover:bg-slate-100 rounded-md"
//               >
//                 {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Mobile Menu Items */}
//       {isMobileMenuOpen && (
//         <div className="md:hidden bg-slate-50 border-t border-slate-200">
//           <div className="pt-2 pb-3 space-y-1">
//             {allItems.map((item) => (
//               <NavLink
//                 key={item.path}
//                 to={item.path}
//                 onClick={() => setIsMobileMenuOpen(false)}
//                 className="flex items-center px-4 py-3 text-base font-medium text-slate-600 hover:bg-slate-100"
//               >
//                 <span className="mr-3">{item.icon}</span>
//                 {item.label}
//               </NavLink>
//             ))}
//             <button
//               onClick={handleLogout}
//               className="w-full flex items-center px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50"
//             >
//               <span className="mr-3">
//                 <LogOut size={18} />
//               </span>
//               Sign Out
//             </button>
//           </div>
//         </div>
//       )}
//     </nav>
//   );
// };

// export default TopNavigation;