import React, { useState, useEffect } from "react";
import api from "../../services/api";
import {
  User,
  BookOpen,
  Clock,
  CreditCard,
  Award,
  LogOut,
  Search,
  AlertCircle,
  Megaphone,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import CustomDataTable from "../../components/common/DataTable";
import Loading from "../../components/common/Loading";

// Helper function to filter announcements by start and end date
const filterAnnouncementsByDate = (announcements) => {
  if (!announcements || !Array.isArray(announcements)) return [];
  
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  return announcements.filter(ann => {
    const startDate = ann.startDate ? new Date(ann.startDate) : null;
    const hasStarted = !startDate || startDate <= now;
    
    const endDate = ann.endDate ? new Date(ann.endDate) : null;
    let hasNotEnded = true;
    if (endDate) {
      hasNotEnded = endDate >= todayStart;
    }
    
    return hasStarted && hasNotEnded;
  });
};

const AnnouncementTicker = ({ announcements, user }) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);
  const filteredAnnouncements = filterAnnouncementsByDate(announcements);

  React.useEffect(() => {
    if (!filteredAnnouncements || filteredAnnouncements.length <= 1 || isHovered) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % filteredAnnouncements.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [filteredAnnouncements, isHovered]);

  if (!filteredAnnouncements || filteredAnnouncements.length === 0) return null;

  return (
    <div 
      className="bg-white border border-slate-100 rounded-2xl p-4 mb-4 mx-4 mt-4 flex items-center shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl flex-shrink-0 z-10 transition-transform group-hover:scale-110 border border-indigo-100">
        <Megaphone size={20} />
      </div>
      <div className="flex-1 h-8 ml-4 relative overflow-hidden">
        {filteredAnnouncements.map((ann, idx) => {
          const isUnread = !ann.readBy?.some(r => r.userId?.toString() === user?._id?.toString());
          return (
            <div
              key={ann._id || idx}
              onClick={() => window.location.href = '/dashboard/announcements'}
              className={`absolute top-0 left-0 w-full h-full flex items-center cursor-pointer transition-all duration-700 ease-in-out ${
                idx === currentIndex
                  ? 'opacity-100 translate-y-0 z-10'
                  : idx < currentIndex ? 'opacity-0 -translate-y-full -z-10' : 'opacity-0 translate-y-full -z-10'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                {isUnread && (
                  <span className="bg-indigo-600 text-white text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-md shadow-sm shadow-indigo-200 animate-pulse flex-shrink-0">
                    New
                  </span>
                )}
                <p className={`font-bold text-slate-800 transition-colors truncate ${isUnread ? 'text-slate-900 font-black' : 'text-slate-600 font-bold'}`}>
                  {ann.title}
                </p>
                {/* <div className="h-4 w-[1px] bg-slate-200 hidden sm:block"></div>
                <p className="text-slate-400 text-sm truncate hidden md:block max-w-md">
                   {ann.message}
                </p> */}
              </div>
              {/* <span className="ml-auto text-[10px] text-slate-400 font-black uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 hidden lg:flex items-center gap-2">
                <Clock size={12} />
                {new Date(ann.createdAt || new Date()).toLocaleDateString()}
              </span> */}
            </div>
          );
        })}
      </div>
      <button 
        onClick={() => window.location.href = '/dashboard/announcements'}
        className="ml-6 flex items-center justify-center bg-slate-900 text-white text-xs font-black uppercase tracking-widest px-5 py-2.5 rounded-xl hover:bg-indigo-600 transition-all z-10 shadow-lg shadow-slate-200 group-hover:shadow-indigo-100 whitespace-nowrap active:scale-95"
      >
        View All
      </button>

      {/* Decorative background accent */}
      <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-50/50 blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
    </div>
  );
};

const ParentDashboard = () => {
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [overview, setOverview] = useState(null);
  const [attendanceList, setAttendanceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard"); // "dashboard" or "attendance"
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  ); // YYYY-MM
  const [searchTerm, setSearchTerm] = useState(""); // For filtering children
  const [announcements, setAnnouncements] = useState([]);

  const { logout, user } = useAuth();

  // Fetch children linked to parent
  useEffect(() => {
    fetchChildren();
    fetchAnnouncements();
  }, []);

  // Fetch overview when child selected
  useEffect(() => {
    if (selectedChild) fetchOverview(selectedChild._id);
  }, [selectedChild]);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      const res = await api.get("/parent/children");
      setChildren(res.data);
      if (res.data.length > 0) setSelectedChild(res.data[0]);
    } catch (err) {
      console.error("Error fetching children:", err);
      toast.error("Failed to load children");
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get("/announcements?limit=10");
      setAnnouncements(res.data.data || []);
    } catch (err) {
      console.error("Error fetching announcements:", err);
    }
  };

  const fetchOverview = async (studentId) => {
    try {
      setLoading(true);
      const res = await api.get(`/parent/child/${studentId}/overview`);
      setOverview(res.data);
    } catch (err) {
      console.error("Error fetching overview:", err);
      toast.error("Failed to load overview");
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceList = async (studentId, month = selectedMonth) => {
    try {
      setLoading(true);
      const res = await api.get(
        `/parent/child/${studentId}/attendance?month=${month}`
      );

      // Optional: calculate total hours if backend doesn't provide
      const formatted = res.data.map((item, idx) => {
        let totalHours = "-";
        if (item.loginTime && item.logoutTime) {
          const login = new Date(`1970-01-01T${item.loginTime}`);
          const logout = new Date(`1970-01-01T${item.logoutTime}`);
          totalHours = ((logout - login) / 1000 / 60 / 60).toFixed(2); // hours
        }

        const today = new Date().toISOString().slice(0, 10);

        return {
          sNo: idx + 1,
          date: item.date.slice(0, 10),
          day: new Date(item.date).toLocaleDateString("en-US", {
            weekday: "short",
          }),
          loginTime: item.loginTime || "-",
          logoutTime: item.logoutTime || "-",
          totalHours,
          status: item.leave ? "Leave" : item.status || "Absent",
          highlight: item.date.slice(0, 10) === today, // Highlight today
        };
      });

      setAttendanceList(formatted);
      setView("attendance");
    } catch (err) {
      console.error("Error fetching attendance:", err);
      toast.error("Failed to load attendance");
    } finally {
      setLoading(false);
    }
  };

  const filteredChildren = children.filter((c) =>
    c.studentNameEnglish
      ?.toLowerCase()
      .includes(searchTerm?.toLowerCase() || "")
  );

  const conditionalRowStyles = [
    {
      when: row => row.highlight,
      style: {
        backgroundColor: '#fefce8',
      },
    },
  ];

  const columns = [
    { name: 'S.No', selector: row => row.sNo, width: '70px', center: true },
    { name: 'Date', selector: row => row.date, sortable: true },
    { name: 'Day', selector: row => row.day, sortable: true, cell: row => <span className="text-gray-600">{row.day}</span> },
    { name: 'Login', selector: row => row.loginTime },
    { name: 'Logout', selector: row => row.logoutTime },
    { name: 'Hours', selector: row => row.totalHours, center: true, cell: row => <span className="font-medium text-blue-600">{row.totalHours}</span> },
    {
      name: 'Status', selector: row => row.status, sortable: true, cell: row => (
        <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full ${row.status === "Present" ? "text-green-700 bg-green-100" :
            row.status === "Leave" ? "text-yellow-700 bg-yellow-100" :
              "text-red-700 bg-red-100"
          }`}>
          {row.status}
        </span>
      )
    }
  ];

  // Loading Screen
  if (loading && !children.length) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loading message="Syncing parent dashboard..." />
      </div>
    );
  }

  // No Children Linked
  if (!loading && children.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center px-4 bg-gray-50">
        <h2 className="text-lg font-bold text-gray-700 mb-2">
          No students linked to this account
        </h2>
        <a
          href="/dashboard/parent/register-child"
          className="bg-blue-600 text-white px-5 py-2 rounded-lg mt-4"
        >
          Register Child
        </a>
        <button
          onClick={logout}
          className="text-red-500 underline mt-4 text-sm"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-10">
      {/* Header */}
      <AnnouncementTicker announcements={announcements} user={user} />
      <div className="bg-white shadow-sm p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            Parent Dashboard
          </h1>
          <p className="text-xs text-gray-500">
            Monitor your child's progress
          </p>
        </div>

      </div>

      {/* Child Selector with Search */}
      <div className="flex flex-col gap-2 p-3 bg-white shadow-sm">
        <div className="relative flex flex-col w-full sm:w-1/3 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search child..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all shadow-sm text-sm font-medium"
          />
        </div>
        <div className="flex overflow-x-auto gap-2 mt-2">
          {filteredChildren.map((child) => (
            <button
              key={child._id}
              onClick={() => setSelectedChild(child)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm ${selectedChild?._id === child._id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
                }`}
            >
              {child.studentNameEnglish}
            </button>
          ))}
          <a
            href="/dashboard/parent/register-child"
            className="whitespace-nowrap px-4 py-2 rounded-full text-sm bg-green-600 text-white"
          >
            + Add
          </a>
        </div>
      </div>

      <div className="p-4">
        {/* Attendance View */}
        {view === "attendance" ? (
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-4 flex-col sm:flex-row gap-2">
              <h3 className="font-semibold">Attendance Records</h3>
              <div className="flex gap-2">
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    fetchAttendanceList(selectedChild._id, e.target.value);
                  }}
                  className="border px-2 py-1 rounded text-sm"
                />
                <button
                  onClick={() => setView("dashboard")}
                  className="text-blue-600 text-sm underline"
                >
                  Back
                </button>
              </div>
            </div>

            {attendanceList.length > 0 ? (
              <div className="overflow-x-auto pb-4">
                <CustomDataTable
                  columns={columns}
                  data={attendanceList}
                  conditionalRowStyles={conditionalRowStyles}
                />
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                No attendance records found.
              </p>
            )}
          </div>
        ) : (
          // Dashboard Overview Cards
          overview && (
            <div className="space-y-4">
              {/* Profile */}
              <div className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="text-blue-600" size={28} />
                </div>
                <div>
                  <h2 className="font-bold text-lg">{overview.student.studentNameEnglish}</h2>
                  <p className="text-xs text-gray-500">
                    Email: {selectedChild?.user?.email}
                  </p>
                </div>
              </div>

              {/* Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                {/* Attendance Card */}
                <div
                  onClick={() =>
                    fetchAttendanceList(selectedChild._id, selectedMonth)
                  }
                  className="bg-white p-4 rounded-xl shadow-sm cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-purple-600 mb-2">
                    <Clock size={18} />
                    <span className="font-semibold text-sm">Attendance</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {overview.attendance.percentage}%
                  </div>
                </div>

                {/* Fees Card */}
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2 text-green-600 mb-2">
                    <CreditCard size={18} />
                    <span className="font-semibold text-sm">Fees Due</span>
                  </div>
                  <div className="text-xl font-bold">₹ {overview.fees.pending}</div>
                </div>

                {/* Grades Card */}
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2 text-indigo-600 mb-3">
                    <BookOpen size={18} />
                    <span className="font-semibold text-sm">Performance</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {overview.grades.map((g, i) => (
                      <div
                        key={i}
                        className="bg-indigo-50 p-2 rounded text-center"
                      >
                        <div className="text-xs text-gray-500">{g.subject}</div>
                        <div className="font-bold text-indigo-700">{g.grade}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Certificates Card */}
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2 text-yellow-600 mb-2">
                    <Award size={18} />
                    <span className="font-semibold text-sm">Achievements</span>
                  </div>
                  {overview.certificates.length > 0 ? (
                    overview.certificates.map((cert, i) => (
                      <div key={i} className="text-sm border-b py-2">
                        {cert.name}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500">No achievements yet</p>
                  )}
                </div>
              </div>

            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ParentDashboard;