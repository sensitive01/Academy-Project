import React, { useState, useEffect } from "react";
import { 
  Bell, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Briefcase, 
  CreditCard,
  Inbox,
  Trash2,
  Check
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const Notifications = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            let url = "/notifications";
            const params = new URLSearchParams();
            if (fromDate) params.append("from", fromDate);
            if (toDate) params.append("to", toDate);
            if (params.toString()) {
                url += `?${params.toString()}`;
            }
            const { data } = await api.get(url);
            setNotifications(data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load notifications");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchNotifications();
    }, [user, fromDate, toDate]);

    const markAsRead = async (id) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (err) {
            console.error(err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.patch("/notifications/mark-all");
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            toast.success("All marked as read");
        } catch (err) {
            console.error(err);
        }
    };

    const deleteNotification = async (id) => {
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n._id !== id));
            toast.success("Notification deleted");
        } catch (err) {
            console.error(err);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case "leave_approved":
                return <div className="p-3 bg-green-100 text-green-600 rounded-xl"><CheckCircle size={24} /></div>;
            case "leave_rejected":
                return <div className="p-3 bg-red-100 text-red-600 rounded-xl"><XCircle size={24} /></div>;
            case "leave_applied":
                return <div className="p-3 bg-amber-100 text-amber-600 rounded-xl"><Briefcase size={24} /></div>;
            case "payment_received":
                return <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl"><CreditCard size={24} /></div>;
            default:
                return <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Bell size={24} /></div>;
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
            return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        } catch (e) {
            return "";
        }
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Notifications</h1>
                    <p className="text-slate-500 mt-1">Stay updated with your latest activities</p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="flex items-center gap-2">
                        <input 
                            type="date" 
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                        <span className="text-slate-400">to</span>
                        <input 
                            type="date" 
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                    </div>
                    {notifications.some(n => !n.isRead) && (
                        <button 
                            onClick={markAllAsRead}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium shadow-sm hover:shadow-md"
                        >
                            <Check size={18} />
                            Mark all as read
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden min-h-[400px]">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-20 text-center">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-200">
                            <Inbox size={48} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">Clear as day!</h2>
                        <p className="text-slate-500 mt-2 max-w-xs">You don't have any notifications right now. Check back later.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {notifications.map((n) => (
                            <div 
                                key={n._id}
                                className={`flex flex-col sm:flex-row sm:items-start gap-4 p-6 transition-all duration-300 group ${!n.isRead ? 'bg-brand-50/20' : 'hover:bg-slate-50/50'}`}
                            >
                                <div className="hidden sm:block">
                                    {getIcon(n.type)}
                                </div>
                                
                                <div className="flex-1">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="sm:hidden">
                                                {getIcon(n.type)}
                                            </div>
                                            <h3 className={`text-lg font-bold leading-none ${!n.isRead ? 'text-slate-900' : 'text-slate-700'}`}>
                                                {n.title}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                                            <Clock size={14} />
                                            {formatRelTime(n.createdAt)}
                                        </div>
                                    </div>
                                    
                                    <p className={`text-base mb-4 ${!n.isRead ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>
                                        {n.message}
                                    </p>
                                    
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            {n.link && (
                                                <a 
                                                    href={n.link} 
                                                    className="text-sm font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors uppercase tracking-wider"
                                                >
                                                    View Details →
                                                </a>
                                            )}
                                            {!n.isRead && (
                                                <button 
                                                    onClick={() => markAsRead(n._id)}
                                                    className="text-xs font-bold text-slate-400 hover:text-brand-600 transition-colors uppercase tracking-widest"
                                                >
                                                    Mark Read
                                                </button>
                                            )}
                                        </div>
                                        
                                        <button 
                                            onClick={() => deleteNotification(n._id)}
                                            className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 rounded-lg hover:bg-red-50"
                                            title="Delete notification"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
