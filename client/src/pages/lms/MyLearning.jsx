import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  BookOpen, 
  PlayCircle, 
  Clock, 
  GraduationCap, 
  CheckCircle2, 
  Award, 
  Search,
  Layout,
  Flame,
  User,
  ExternalLink
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import Loading from "../../components/common/Loading";

const MyLearning = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchMyCourses = async () => {
      try {
        const { data } = await api.get("/courses/mine");
        setCourses(data);
      } catch (error) {
        console.error("Error fetching my courses:", error);
        toast.error("Failed to load your courses");
      } finally {
        setLoading(false);
      }
    };

    fetchMyCourses();
  }, []);

  const filteredCourses = courses.filter(enrollment => {
    const matchesSearch = enrollment.course.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "in-progress") return matchesSearch && !enrollment.completed;
    if (activeTab === "completed") return matchesSearch && enrollment.completed;
    return matchesSearch;
  });

  const stats = {
    total: courses.length,
    completed: courses.filter(e => e.completed).length,
    inProgress: courses.filter(e => !e.completed && e.progress > 0).length,
    certificates: courses.filter(e => e.completed).length, // assuming 1 per completed course
  };


  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loading message="Fetching your learning progress..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 animate-in fade-in duration-700">
      {/* Header & Stats Section */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 px-8 py-12 text-white shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="space-y-4 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              My Learning <span className="text-brand-400">Hub</span>
            </h1>
            <p className="text-slate-400 max-w-md text-lg">
              Welcome back! You've completed <span className="text-white font-bold">{stats.completed}</span> courses so far. Keep pushing your limits.
            </p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full md:w-auto">
             <StatCard icon={<BookOpen size={20} />} label="Enrolled" value={stats.total} color="bg-blue-500/20 text-blue-400" />
             <StatCard icon={<Flame size={20} />} label="Active" value={stats.inProgress} color="bg-orange-500/20 text-orange-400" />
             <StatCard icon={<CheckCircle2 size={20} />} label="Finished" value={stats.completed} color="bg-green-500/20 text-green-400" />
             <StatCard icon={<Award size={20} />} label="Degrees" value={stats.certificates} color="bg-purple-500/20 text-purple-400" />
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-600/10 blur-[100px] rounded-full -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 blur-[80px] rounded-full -ml-20 -mb-20" />
      </div>

      {/* Navigation and Filters */}
      <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
        <div className="flex items-center p-1.5 bg-slate-100 rounded-2xl w-full md:w-auto overflow-x-auto no-scrollbar">
          <TabButton active={activeTab === "all"} onClick={() => setActiveTab("all")}>All Courses</TabButton>
          <TabButton active={activeTab === "in-progress"} onClick={() => setActiveTab("in-progress")}>In Progress</TabButton>
          <TabButton active={activeTab === "completed"} onClick={() => setActiveTab("completed")}>Completed</TabButton>
        </div>

        <div className="relative flex flex-col w-full md:w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search your courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all shadow-sm text-sm font-medium"
          />
        </div>
      </div>

      {/* Course Grid */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {filteredCourses.map((enrollment) => (
          <CourseCard key={enrollment._id} enrollment={enrollment} />
        ))}

        {!loading && filteredCourses.length === 0 && (
          <div className="col-span-full py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 shadow-inner">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <BookOpen size={40} className="text-slate-300" />
            </div>
            <h3 className="text-2xl font-black text-slate-800">No courses found</h3>
            <p className="text-slate-500 mt-2 mb-8 max-w-sm mx-auto">
              {searchQuery ? `We couldn't find anything matching "${searchQuery}"` : "You haven't started any courses in this category yet."}
            </p>
            <Link
              to="/dashboard/enroll"
              className="inline-flex items-center gap-2 bg-brand-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-brand-700 transition-all shadow-lg shadow-brand-600/20 active:scale-95"
            >
              Discover New Courses <ExternalLink size={18} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <div className={`p-4 rounded-2xl ${color} flex flex-col items-center justify-center min-w-[100px] border border-white/5`}>
    <div className="mb-1 opacity-80">{icon}</div>
    <span className="text-2xl font-black">{value}</span>
    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{label}</span>
  </div>
);

const TabButton = ({ active, children, onClick }) => (
  <button
    onClick={onClick}
    className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all whitespace-nowrap ${
      active 
        ? "bg-white text-slate-900 shadow-md ring-1 ring-slate-200" 
        : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
    }`}
  >
    {children}
  </button>
);

const CourseCard = ({ enrollment }) => {
  const { course, progress, completed } = enrollment;

  return (
    <div className="group relative flex flex-col bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden">
      {/* Thumbnail */}
      <div className="relative h-56 overflow-hidden">
        {course.thumbnail?.url ? (
          <img
            src={course.thumbnail.url}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
            <BookOpen size={64} strokeWidth={1} />
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
           <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm">
             {course.category}
           </span>
        </div>

        {completed && (
          <div className="absolute top-4 right-4 bg-brand-600 text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-600/20 z-10 flex items-center gap-1.5 animate-in slide-in-from-right-4">
            <CheckCircle2 size={12} /> Certified
          </div>
        )}

        {/* Backdrop for play button */}
        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center backdrop-blur-[2px]">
           <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-brand-600 scale-75 group-hover:scale-100 transition-transform duration-500 shadow-2xl">
             <PlayCircle size={32} fill="currentColor" className="text-white" />
             <PlayCircle size={32} className="absolute text-brand-600" />
           </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 flex-1 flex flex-col">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex -space-x-2">
             {/* Dynamic instructor avatar? Using placeholder for now */}
             <div className="w-8 h-8 rounded-full bg-brand-100 border-2 border-white flex items-center justify-center text-brand-600">
               <User size={14} />
             </div>
          </div>
          <span className="text-xs font-bold text-slate-400 capitalize">
            {course.instructor?.name || "Dr-Academy Instructor"}
          </span>
        </div>

        <h3 className="text-xl font-black text-slate-900 mb-6 leading-tight group-hover:text-brand-600 transition-colors line-clamp-2">
          {course.title}
        </h3>

        {/* Progress Bar */}
        <div className="space-y-3 mb-8">
           <div className="flex justify-between items-end">
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                Course Progress
              </span>
              <span className="text-sm font-black text-slate-900">
                {progress || 0}%
              </span>
           </div>
           <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-[1500ms] cubic-bezier(0.4, 0, 0.2, 1) ${
                  completed ? "bg-green-500" : "bg-brand-600"
                }`}
                style={{ width: `${progress || 0}%` }}
              />
           </div>
        </div>

        {/* Actions */}
        <div className="mt-auto grid grid-cols-5 gap-3">
          <Link
            to={`/dashboard/lms/course/${course._id}`}
            className={`col-span-4 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-sm font-black transition-all shadow-lg active:scale-95 ${
              completed 
                ? "bg-slate-100 text-slate-900 hover:bg-slate-200 shadow-slate-200/10" 
                : "bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/20"
            }`}
          >
            {completed ? <Layout size={18} /> : <PlayCircle size={18} />}
            {completed ? "Review Course" : progress > 0 ? "Resume Learning" : "Start Now"}
          </Link>
          
          {completed && (
            <Link
              to={`/dashboard/lms/certificate/${course._id}`}
              className="col-span-1 flex items-center justify-center border-2 border-slate-100 text-brand-600 rounded-2xl hover:bg-brand-50 hover:border-brand-100 transition-all active:scale-95 shadow-sm"
              title="View Certificate"
            >
              <Award size={20} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyLearning;
