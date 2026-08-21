import React from "react";
import {
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Play,
  Award,
  FileText,
  Calendar,
  Megaphone,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import CustomDataTable from "../components/common/DataTable";
import api from "../services/api";
import Loading from "../components/common/Loading";

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
      className="bg-white border border-slate-100 rounded-2xl p-4 mb-8 flex items-center shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300"
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
               {/* <div className="h-4 w-[1px] bg-slate-200 hidden sm:block"></div> */}
                {/* <p className="text-slate-400 text-sm truncate hidden md:block max-w-md">
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

const Dashboard = () => {
  const { user } = useAuth();
  const [students, setStudents] = React.useState([]);
  const [enrollments, setEnrollments] = React.useState([]);
  const [studentStats, setStudentStats] = React.useState(null);
  const [studentActivity, setStudentActivity] = React.useState([]);
  const [studentAnnouncements, setStudentAnnouncements] = React.useState([]);
  const [recentAnnouncements, setRecentAnnouncements] = React.useState([]);

const [stats, setStats] = React.useState({
  totalStudents: 0,
  activeCourses: 0,
  totalRevenue: 0,
  totalEnrollments: 0,
  loading: true,
});

const [selectedMonth, setSelectedMonth] = React.useState(() => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
});

  const fetchStats = async () => {
    try {
      const [year, month] = selectedMonth.split("-");
      const { data } = await api.get(`/dashboard-stats?month=${month}&year=${year}`);
      setStats({
        totalStudents: data.totalStudents,
        activeCourses: data.activeCourses,
        totalRevenue: data.totalRevenue,
        totalEnrollments: data.totalEnrollments,
        loading: false,
      });
    } catch (err) {
      console.error("Failed to fetch stats:", err);
      setStats((prev) => ({ ...prev, loading: false }));
    }
  };

  const fetchStudents = async () => {
    try {
      const { data } = await api.get("/dashboard-stats/recent-students");
      setStudents(data);
    } catch (err) {
      console.error("Failed to fetch students", err);
    }
  };

  const fetchEnrollments = async () => {
    try {
      const { data } = await api.get("/dashboard-stats/recent-enrollments");
      setEnrollments(data);
    } catch (err) {
      console.error("Failed to fetch enrollments", err);
    }
  };

  const fetchStudentStats = async () => {
    try {
      const { data } = await api.get("/dashboard-stats/student");
      setStudentStats(data);
      setStudentActivity(data.recentActivity || []);
      setStudentAnnouncements(data.announcements || []);
    } catch (err) {
      console.error("Failed to fetch student stats", err);
    }
  };

  const fetchRecentAnnouncements = async () => {
    try {
      const { data } = await api.get("/announcements?limit=10");
      setRecentAnnouncements(data.data || []);
    } catch (err) {
      console.error("Failed to fetch recent announcements", err);
    }
  };

  React.useEffect(() => {
    if (user?.role === "student") {
      fetchStudentStats();
    } else {
      fetchStats();
      fetchStudents();
      fetchEnrollments();
      fetchRecentAnnouncements();
    }
  }, [user, selectedMonth]);


  const studentActivityData = studentActivity;

  const studentActivityColumns = [
    { name: "S.No", selector: (row, i) => i + 1, width: "70px", center: true },
    { name: 'Course', selector: row => row.course, sortable: true, cell: row => <span className="font-medium text-slate-900">{row.course}</span> },
    { name: 'Activity', selector: row => row.activity,width:"150px", cell: row => <span className="text-slate-500">{row.activity}</span> },
    { name: 'Date', selector: row => row.date,width:"100px", sortable: true, cell: row => <span className="text-slate-500">{row.date}</span> },
    { name: 'Status', selector: row => row.status,width:"120px", sortable: true, cell: row => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          row.status === "Completed" || row.status === "Graded" ? "bg-green-100 text-green-800" :
          row.status === "In Progress" ? "bg-yellow-100 text-yellow-800" :
          "bg-slate-100 text-slate-800"
        }`}>
          {row.status}
        </span>
      )
    },
    { name: 'Action', center: true, width: '100px', cell: row => (
        <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal size={18} /></button>
      )
    }
  ];

  const adminStudentColumns = [
    { name: "S.No", selector: (row, i) => i + 1, width: "70px", center: true },
    { name: "Student Name", selector: r => r.studentNameEnglish, sortable: true },
    { name: "Email", selector: r => r.email, sortable: true },
    { name: "Phone", selector: r => r.whatsapp || r.phone || "N/A" },
    { name: "Joining Date", selector: r => new Date(r.createdAt).toLocaleDateString(), sortable: true },
    { name: "Status", selector: r => r.status,width:"120px", cell: r => (
        <span className={`px-2 py-0.5 rounded text-xs ${
          r.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}>
          {r.status}
        </span>
      ),
    },
    // { name: "Action", center: true, width: "100px",
    //   cell: () => (
    //     <button className="text-slate-400 hover:text-slate-600">
    //       <MoreHorizontal size={18} />
    //     </button>
    //   ),
    // },
  ];

  const enrollmentColumns = [
    { name: "S.No", selector: (row, i) => i + 1, width: "70px", center: true },
    { name: 'Student', selector: row => row.student?.studentNameEnglish, sortable: true, cell: row => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-900">{row.student?.studentNameEnglish || "Unknown"}</span>
          <span className="text-[10px] text-slate-400">{row.student?.email}</span>
        </div>
      )
    },
    { name: 'Course Enrolled', selector: row => row.course?.title, sortable: true, cell: row => (
        <span className="text-brand-600 font-semibold">{row.course?.title || "N/A"}</span>
      )
    },
    { name: 'Amount Paid', selector: row => row.amount, sortable: true, cell: row => (
        <span className="font-bold text-slate-900">₹{row.amount}</span>
      )
    },
    { name: 'Enrollment Date', selector: row => row.createdAt, sortable: true, cell: row => (
        <div className="flex flex-col">
          <span className="text-slate-600">{new Date(row.createdAt).toLocaleDateString()}</span>
          <span className="text-[10px] text-slate-400">{new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      )
    },
    { name: 'Ref', selector: row => row.razorpayPaymentId || row.razorpayOrderId, cell: row => (
        <span className="text-xs font-mono text-slate-400">{row.razorpayPaymentId?.slice(-8) || "Manual"}</span>
      )
    }
  ];

  const colorClasses = {
    blue: "bg-blue-100 text-blue-800",
    green: "bg-green-100 text-green-800",
    yellow: "bg-yellow-100 text-yellow-800",
    red: "bg-red-100 text-red-800",
    purple: "bg-purple-100 text-purple-800",
    pink: "bg-pink-100 text-pink-800",
    orange: "bg-orange-100 text-orange-800",
    indigo: "bg-indigo-100 text-indigo-800",
    teal: "bg-teal-100 text-teal-800",
    slate: "bg-slate-100 text-slate-800",
  };

  if (user && user.role?.toLowerCase() === "student") {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <AnnouncementTicker announcements={studentAnnouncements} user={user} />
        {/* Student Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Student Dashboard
            </h1>
            <p className="text-slate-500 mt-1">
              Welcome back, {user.name || "Student"}. Here's your progress.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              Enrolled
            </span>
            <button className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/20">
              View Courses
            </button>
          </div>
        </div>

        {/* Student Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              label: "Course Progress",
              value: studentStats?.avgProgress || "0%",
              icon: Play,
              change: "Recent",
              trend: "neutral",
              color: "blue",
            },
            {
              label: "Attendance",
              value: studentStats?.attendance || "0%",
              icon: CheckCircle,
              change: "Last 30d",
              trend: "neutral",
              color: "green",
            },
            {
              label: "Alerts & Events",
              value: studentStats?.upcoming || "0",
              icon: Calendar,
              change: "New",
              trend: "neutral",
              color: "purple",
            },
            {
              label: "Courses Completed",
              value: studentStats?.certificates || "0",
              icon: Award,
              change: "Total",
              trend: "neutral",
              color: "yellow",
            },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`p-3 rounded-xl ${colorClasses[stat.color]} group-hover:text-white transition-colors`}
                >
                  <stat.icon size={24} />
                </div>
                <span
                  className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${
                    stat.trend === "up"
                      ? "bg-green-50 text-green-700"
                      : stat.trend === "down"
                        ? "bg-red-50 text-red-700"
                        : "bg-slate-50 text-slate-600"
                  }`}
                >
                  {stat.trend === "up" && (
                    <ArrowUpRight size={14} className="mr-1" />
                  )}
                  {stat.trend === "down" && (
                    <ArrowDownRight size={14} className="mr-1" />
                  )}
                  {stat.change}
                </span>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-slate-900 mb-1">
                  {stat.value}
                </h3>
                <p className="text-sm font-medium text-slate-500">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Student Main Content Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (2/3) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recent Course Activity Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-lg text-slate-900">
                  Recent Course Activity
                </h3>
                <button className="text-brand-600 text-sm font-bold hover:text-brand-700">
                  View All Activity
                </button>
              </div>
              <div className="overflow-x-auto pb-4">
                <CustomDataTable 
                  columns={studentActivityColumns}
                  data={studentActivityData}
                  pagination
                />
              </div>
            </div>

            {/* Quick Student Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-brand-900 rounded-2xl p-6 text-white relative overflow-hidden shadow-xl shadow-brand-900/20">
                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mb-4">
                    <FileText size={20} />
                  </div>
                  <h3 className="text-lg font-bold mb-1">View Grades</h3>
                  <p className="text-brand-200 text-sm mb-6">
                    Check your performance across all courses.
                  </p>
                  <button className="bg-white text-brand-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-brand-50 transition-colors">
                    My Grades
                  </button>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center mb-4">
                    <BookOpen size={20} />
                  </div>
                  <h3 className="text-lg font-bold mb-1 text-slate-900">
                    Explore Courses
                  </h3>
                  <p className="text-slate-500 text-sm mb-6">
                    Discover new courses and learning paths.
                  </p>
                  <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors">
                    Browse Courses
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-slate-50 rounded-full blur-3xl -ml-10 -mb-10"></div>
              </div>
            </div>
          </div>
          {/* Right Column (1/3) */}
          <div className="lg:col-span-1 space-y-8">
            {/* Quick Links */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="p-6 border-b border-slate-100">
                <h3 className="font-bold text-lg text-slate-900">
                  Quick Links
                </h3>
              </div>
              <ul className="divide-y divide-slate-100">
                {[
                  { name: "My Profile", icon: Users },
                  { name: "Support Center", icon: AlertCircle },
                  { name: "Course Catalog", icon: BookOpen },
                ].map((link, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-slate-50 text-slate-600">
                        <link.icon size={20} />
                      </div>
                      <p className="font-medium text-slate-900">{link.name}</p>
                    </div>
                    <ArrowUpRight size={18} className="text-slate-400" />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (user && user.role?.toLowerCase() === "coach") {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <AnnouncementTicker announcements={recentAnnouncements} user={user} />
        {/* Coach Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Coach Dashboard
            </h1>
            <p className="text-slate-500 mt-1">
              Welcome back, {user.name}. Here are the metrics for your assigned courses.
            </p>
          </div>
          <div className="flex items-center gap-3">
             <span className="text-sm text-slate-500 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              Instructor Mode
            </span>
            <button 
              onClick={() => window.location.href='/dashboard/coach/my-courses'}
              className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/20"
            >
              My Courses
            </button>
          </div>
        </div>

        {/* Coach Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              label: "Total Students",
              value: (stats.totalStudents || 0).toLocaleString(),
              icon: Users,
              change: "Enrolled in your courses",
              trend: "neutral",
              color: "blue",
            },
            {
              label: "Active Courses",
              value: stats.activeCourses || 0,
              icon: BookOpen,
              change: "Assigned to you",
              trend: "neutral",
              color: "purple",
            },
            {
              label: "Course Enrollments",
              value: (stats.totalEnrollments || 0).toLocaleString(),
              icon: CheckCircle,
              change: "Course-wise total",
              trend: "neutral",
              color: "orange",
            },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${colorClasses[stat.color]} group-hover:text-white transition-colors`}>
                  <stat.icon size={24} />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</h3>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="text-[10px] text-slate-400 mt-2 italic">{stat.change}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Coach Tables Section */}
        <div className="flex flex-col gap-8">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-900">Recent Students</h3>
              <button 
                onClick={() => window.location.href='/dashboard/students'}
                className="text-brand-600 text-sm font-bold hover:text-brand-700"
              >
                View All
              </button>
            </div>
            <div className="overflow-x-auto pb-4">
              <CustomDataTable 
                columns={adminStudentColumns}
                data={students}
                pagination
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-900">Recent Enrollments</h3>
              <button 
                onClick={() => window.location.href='/dashboard/coach/my-courses'}
                className="text-brand-600 text-sm font-bold hover:text-brand-700"
              >
                Manage Courses
              </button>
            </div>
            <div className="overflow-x-auto pb-4">
              <CustomDataTable 
                columns={enrollmentColumns}
                data={enrollments}
                pagination
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (user && user.role?.toLowerCase() === "parent") {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <AnnouncementTicker announcements={recentAnnouncements} user={user} />
        {/* Parent Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Parent Dashboard
            </h1>
            <p className="text-slate-500 mt-1">
              Welcome back, {user.name || "Parent"}. View updates and broadcasts.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/20">
              View Children Progress
            </button>
          </div>
        </div>

        {/* Parent Main Content */}
        <div className="grid grid-cols-1 gap-8">
          <div className="space-y-8">
             <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center shadow-sm">
                <Users size={48} className="mx-auto mb-4 text-slate-300" />
                <h3 className="text-xl font-bold text-slate-800">Child Progress Insights</h3>
                <p className="text-slate-500 mt-2">Comprehensive progress reports for your children will appear here.</p>
             </div>
          </div>
        </div>
      </div>
    );
  }

  // Default (Admin/Other) Dashboard content
  return (
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 min-h-screen bg-slate-50 relative overflow-hidden animate-in fade-in duration-500">
      <AnnouncementTicker announcements={recentAnnouncements} user={user} />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-indigo-50 via-white to-transparent rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

      <div className="flex justify-between flex-col md:flex-row md:items-end gap-6 relative z-10">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight">
            Welcome back, <span className="text-indigo-600 bg-indigo-50 px-3 py-1 rounded-2xl inline-block -ml-2">{user?.name}</span>
          </h1>
          <p className="text-slate-500 mt-1">Here's what's happening today.</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
            <label className="text-sm font-semibold text-slate-600 ml-2">Filter Month:</label>
            <input
              type="month"
              className="border-none focus:ring-0 text-slate-700 font-medium cursor-pointer"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              System Online
            </span>
            <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20">
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Total Students",
            value: (stats.totalStudents || 0).toLocaleString(),
            icon: Users,
            change: "+12.5%",
            trend: "up",
            color: "blue",
          },
          {
            label: "Total Revenue",
            value: `₹${(stats.totalRevenue || 0).toLocaleString()}`,
            icon: DollarSign,
            change: "+8.2%",
            trend: "up",
            color: "green",
          },
          {
            label: "Active Courses",
            value: stats.activeCourses || 0,
            icon: BookOpen,
            change: "0%",
            trend: "neutral",
            color: "purple",
          },
          {
            label: "Course Enrollments",
            value: (stats.totalEnrollments || 0).toLocaleString(),
            icon: CheckCircle,
            change: "+15.3%",
            trend: "up",
            color: "orange",
          },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`p-3 rounded-xl ${colorClasses[stat.color]} group-hover:text-white transition-colors`}
              >
                <stat.icon size={24} />
              </div>
              <span
                className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${
                  stat.trend === "up"
                    ? "bg-green-50 text-green-700"
                    : stat.trend === "down"
                      ? "bg-red-50 text-red-700"
                      : "bg-slate-50 text-slate-600"
                }`}
              >
                {stat.trend === "up" && (
                  <ArrowUpRight size={14} className="mr-1" />
                )}
                {stat.trend === "down" && (
                  <ArrowDownRight size={14} className="mr-1" />
                )}
                {stat.change}
              </span>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-slate-900 mb-1">
                {stat.value}
              </h3>
              <p className="text-sm font-medium text-slate-500">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          {/* Recent Admissions Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-900">
                Recent Admissions via Portal
              </h3>
              <button className="text-brand-600 text-sm font-bold hover:text-brand-700">
                View All
              </button>
            </div>
            <div className="overflow-x-auto pb-4">
              <CustomDataTable 
                columns={adminStudentColumns}
                data={students}
                pagination
              />
            </div>
          </div>

          {/* Recent Course Enrollments Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-900">
                Course Enrollments <span className="text-xs font-normal text-slate-400 ml-2">(via Payments)</span>
              </h3>
              <button onClick={() => window.location.href='/admin/courses'} className="text-brand-600 text-sm font-bold hover:text-brand-700">
                Manage Courses
              </button>
            </div>
            <div className="overflow-x-auto pb-4">
              <CustomDataTable 
                columns={enrollmentColumns}
                data={enrollments}
                pagination
              />
            </div>
          </div>

          {/* Quick HR Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-brand-900 rounded-2xl p-6 text-white relative overflow-hidden shadow-xl shadow-brand-900/20">
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mb-4">
                  <Users size={20} />
                </div>
                <h3 className="text-lg font-bold mb-1">Employee Onboarding</h3>
                <p className="text-brand-200 text-sm mb-6">
                  Add new staff, assign roles, and setup payroll.
                </p>
                <button className="bg-white text-brand-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-brand-50 transition-colors">
                  Add Employee
                </button>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                  <DollarSign size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  Payroll Processing
                </h3>
                <p className="text-slate-400 text-sm mb-6">
                  Review attendance and process monthly salaries.
                </p>
                <button className="text-blue-600 font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all">
                  Go to Finance <ArrowUpRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
};

export default Dashboard;
