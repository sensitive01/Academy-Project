import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  Search,
  Menu,
  User,
  LogOut,
  Settings,
  ChevronDown,
  CheckCircle,
  XCircle,
  Clock,
  Briefcase,
  CreditCard,
  Inbox
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

const DashboardHeader = ({ toggleMobileSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get("/notifications");
      setNotifications(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }

      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = async () => {
    try {
      await api.patch("/notifications/mark-all");
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (n) => {
    try {
      if (!n.isRead) {
        await api.patch(`/notifications/${n._id}/read`);
      }

      if (n.link) navigate(n.link);

      setNotifications((prev) =>
        prev.map((item) =>
          item._id === n._id ? { ...item, isRead: true } : item
        )
      );

      setShowNotifications(false);
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "leave_approved":
        return <div className="p-2 bg-green-100 text-green-600 rounded-full"><CheckCircle size={18} /></div>;
      case "leave_rejected":
        return <div className="p-2 bg-red-100 text-red-600 rounded-full"><XCircle size={18} /></div>;
      case "leave_applied":
        return <div className="p-2 bg-amber-100 text-amber-600 rounded-full"><Briefcase size={18} /></div>;
      case "payment_received":
        return <div className="p-2 bg-emerald-100 text-emerald-600 rounded-full"><CreditCard size={18} /></div>;
      default:
        return <div className="p-2 bg-blue-100 text-blue-600 rounded-full"><Bell size={18} /></div>;
    }
  };

  const formatRelTime = (date) => {
    try {
      const now = new Date();
      const diff = now - new Date(date);
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return "Just now";
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      if (days < 7) return `${days}d ago`;
      return new Date(date).toLocaleDateString();
    } catch (e) {
      return "";
    }
  };

  return (
    <header className="bg-white h-14 sm:h-16 px-4 sm:px-6 flex items-center justify-between border-b sticky top-0 z-40">

      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMobileSidebar}
          className="lg:hidden text-slate-600 hover:text-slate-800"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4 sm:gap-6">

        {/* 🔍 Search */}
        <button
          className="p-2 text-slate-600 hover:text-slate-800 transition-colors"
        >
          <Search size={20} />
        </button>

        {/* 🔔 Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() =>
              setShowNotifications((prev) => !prev)
            }
            className="relative p-2 text-slate-600 hover:text-slate-800"
          >
            <Bell size={20} />

            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 text-[9px] sm:text-[10px] bg-red-500 text-white rounded-full min-w-[15px] h-[15px] flex items-center justify-center px-1">
                {unreadCount}
              </span>
            )}
          </button>

{showNotifications && (
  <div
    className="
      absolute
      mt-3
      right-0
      w-80 sm:w-96
      bg-white
      rounded-2xl
      shadow-[0_10px_40px_rgba(0,0,0,0.1)]
      border border-slate-100
      z-50
      overflow-hidden
      animate-in fade-in zoom-in duration-200
    "
  >
    {/* Header */}
    <div className="px-5 py-4 border-b flex justify-between items-center bg-slate-50/50">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-bold text-slate-800">
          Notifications
        </h3>
        {unreadCount > 0 && (
          <span className="bg-brand-100 text-brand-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
            {unreadCount} New
          </span>
        )}
      </div>

      {unreadCount > 0 && (
        <button
          onClick={markAllAsRead}
          className="text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors"
        >
          Mark all as read
        </button>
      )}
    </div>

    {/* Body */}
    <div className="max-h-[28rem] overflow-y-auto scrollbar-thin">
      {notifications.length === 0 ? (
        <div className="px-8 py-12 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                <Inbox size={32} />
            </div>
            <p className="text-sm font-medium text-slate-600">No new notifications</p>
            <p className="text-xs text-slate-400 mt-1">We'll notify you when something important happens.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
        {notifications.map((n) => (
          <div
            key={n._id}
            onClick={() => handleNotificationClick(n)}
            className={`px-5 py-4 cursor-pointer transition-all duration-200 group flex gap-4 ${
              !n.isRead
                ? "bg-brand-50/30 hover:bg-brand-50/50"
                : "hover:bg-slate-50"
            }`}
          >
            <div className="flex-shrink-0 transition-transform group-hover:scale-110">
                {getIcon(n.type)}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                    <p className={`text-sm font-semibold truncate ${!n.isRead ? "text-slate-900" : "text-slate-700"}`}>
                        {n.title}
                    </p>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2 flex items-center gap-1">
                        <Clock size={10} />
                        {formatRelTime(n.createdAt)}
                    </span>
                </div>
                <p className={`text-xs leading-relaxed line-clamp-2 ${!n.isRead ? "text-slate-600 font-medium" : "text-slate-500"}`}>
                    {n.message}
                </p>
                {n.link && (
                    <div className="mt-2 text-[10px] text-brand-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 uppercase tracking-wider">
                        View Details →
                    </div>
                )}
            </div>

            {!n.isRead && (
                <div className="flex-shrink-0 w-2 h-2 bg-brand-600 rounded-full mt-2 self-start animate-pulse shadow-[0_0_8px_rgba(var(--brand-primary-rgb),0.5)]"></div>
            )}
          </div>
        ))}
        </div>
      )}
    </div>

    {/* Footer */}
    {notifications.length > 0 && (
        <div className="p-3 border-t bg-slate-50/30 text-center">
            <button 
                onClick={() => {
                    setShowNotifications(false);
                    navigate("/dashboard/notifications");
                }}
                className="text-xs font-bold text-slate-500 hover:text-brand-600 transition-colors uppercase tracking-widest py-1 block w-full"
            >
                View all activity
            </button>
        </div>
    )}
  </div>
)}
        </div>

        {/* 👤 Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() =>
              setShowProfileMenu((prev) => !prev)
            }
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-brand-700 text-white flex items-center justify-center text-sm font-semibold overflow-hidden border border-slate-200 shadow-sm transition-transform hover:scale-105">
              {user?.profilePic?.url ? (
                <img src={user.profilePic.url} alt="" className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0) || <User size={14} />
              )}
            </div>

            <ChevronDown
              size={14}
              className="hidden sm:block"
            />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-50">
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate("/dashboard/profile")
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
              >
                <User size={14} />
                Profile
              </button>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate("/dashboard/settings")
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
              >
                <Settings
                  size={14}
                  className="inline mr-2"
                />
                Settings
              </button>

              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <LogOut
                  size={14}
                  className="inline mr-2"
                />
                Sign Out
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default DashboardHeader;