import React, { useState, useRef, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import Payroll from "../../pages/finance/Payroll";
import CustomDataTable from "../../components/common/DataTable";
import Loading from "../../components/common/Loading";
import { Search, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import MultiSelectDropdown from "../../components/common/MultiSelectDropdown";
import StudentFilterBar from "../../components/common/StudentFilterBar";

const Attendance = ({ employeeOnly = false, studentOnly = false, internOnly = false, hideHeader = false, refreshTrigger = 0 }) => {
  const { user, token } = useAuth();
  const [photo, setPhoto] = useState(null);
  const [attendanceList, setAttendanceList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewModal, setViewModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const todayDate = new Date().toISOString().slice(0, 10);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [activeTab, setActiveTab] = useState("attendance");
  const [logoutModal, setLogoutModal] = useState(null);

  // New Filter States for Student Attendance
  const [filterType, setFilterType] = useState([]);
  const [filterVendor, setFilterVendor] = useState([]);
  const [filterCenter, setFilterCenter] = useState([]);
  const [filterCourse, setFilterCourse] = useState([]);
  const [filterBatch, setFilterBatch] = useState([]);
  const [filterYears, setFilterYears] = useState([]);

  const [studentsMap, setStudentsMap] = useState({});
  const [centers, setCenters] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [employees, setEmployees] = useState([]);
  
  const [adminForm, setAdminForm] = useState({
    targetUserId: "",
    date: new Date().toISOString().slice(0, 10),
    loginTime: "",
    logoutTime: ""
  });

  const API_URL = import.meta.env.VITE_API_URL;

  const startCamera = async () => {
    setCameraActive(true);
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
      } catch {
        alert("Camera access denied or not available.");
      }
    }
  };

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
      setPhoto(canvas.toDataURL("image/png"));
      if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
      }
      setCameraActive(false);
    }
  };

  const handleRecapture = async () => {
    setPhoto(null);
    startCamera();
  };

  const fetchAttendance = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const params = ["admin", "center"].includes(user.role) ? {} : { name: user.name };
      const res = await api.get(`${API_URL}/attendance`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setAttendanceList(res.data);

      if (studentOnly) {
        const [studentsRes, centersRes, coursesRes, batchesRes, vendorsRes] = await Promise.all([
          api.get("/students", { headers: { Authorization: `Bearer ${token}` } }),
          api.get("/centers", { headers: { Authorization: `Bearer ${token}` } }),
          api.get("/courses", { headers: { Authorization: `Bearer ${token}` } }),
          api.get("/batches", { headers: { Authorization: `Bearer ${token}` } }),
          api.get("/vendors", { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        const sMap = {};
        if (studentsRes.data && studentsRes.data.students) {
           studentsRes.data.students.forEach(s => {
             if (s.user && s.user._id) sMap[s.user._id] = s;
             if (s.user && typeof s.user === 'string') sMap[s.user] = s;
           });
        }
        setStudentsMap(sMap);
        setCenters(centersRes.data || []);
        setCourses(coursesRes.data || []);
        setBatches(batchesRes.data || []);
        setVendors(vendorsRes.data || []);
      } else if (employeeOnly) {
        const empRes = await api.get("/employees", { headers: { Authorization: `Bearer ${token}` } });
        let result = empRes.data || [];
        result = result.filter(emp => emp.role !== "student" && emp.role !== "admin");
        setEmployees(result);
      } else {
        // Fetch both students and employees for the general Admin attendance tab
        const [studentsRes, empRes] = await Promise.all([
          api.get("/students", { headers: { Authorization: `Bearer ${token}` } }),
          api.get("/employees", { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        const sMap = {};
        if (studentsRes.data && studentsRes.data.students) {
           studentsRes.data.students.forEach(s => {
             if (s.user && s.user._id) sMap[s.user._id] = s;
             if (s.user && typeof s.user === 'string') sMap[s.user] = s;
           });
        }
        setStudentsMap(sMap);

        let result = empRes.data || [];
        result = result.filter(emp => emp.role !== "student" && emp.role !== "admin");
        setEmployees(result);
      }
    } catch {
      setAttendanceList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAttendance(); }, [user, studentOnly, refreshTrigger]);
  useEffect(() => { if (showForm) startCamera(); }, [showForm]);

  useEffect(() => {
    if (!showForm && videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  }, [showForm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const loginTime = new Date().toTimeString().slice(0, 8);

      const res = await api.post(
        `${API_URL}/attendance`,
        { loginTime, photo }, // ✅ only send required fields
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAttendanceList([res.data, ...attendanceList]);

      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }

      setPhoto(null);
      setCameraActive(false);
      setShowForm(false);

    } catch (err) {
      console.error("Attendance submit error:", err.response?.data || err.message);
    }

    setLoading(false);
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post(
        `${API_URL}/attendance/admin-add`,
        adminForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAttendanceList([res.data, ...attendanceList]);
      setShowForm(false);
      setAdminForm({ targetUserId: "", date: new Date().toISOString().slice(0, 10), loginTime: "", logoutTime: "" });
      toast.success("Attendance added successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add attendance");
    } finally {
      setLoading(false);
    }
  };

  const handleSetLogout = async (record) => {
    try {
      const logoutTime = new Date().toTimeString().slice(0, 8);

      await api.patch(
        `${API_URL}/attendance/logout/${record._id}`,
        { logoutTime },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAttendanceList(prev =>
        prev.map(a =>
          a._id === record._id ? { ...a, logoutTime } : a
        )
      );

      setLogoutModal(null); // close modal
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const formatTime12Hour = (time) => {
    if (!time) return "-";
    // Check if it already has AM/PM - some old records might
    if (time.includes("AM") || time.includes("PM")) return time;

    // Safely parse HH:mm:ss
    try {
      const [hours, minutes, seconds] = time.split(":");
      const d = new Date();
      d.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds || 0));
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
    } catch (e) {
      return time;
    }
  };

  // FILTERED ATTENDANCE
  const filteredAttendance = useMemo(() => {
    return attendanceList
      .filter(a => {
        // SEARCH: match name or role
        const matchSearch = searchTerm
          ? a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (!studentOnly && a.role?.toLowerCase().includes(searchTerm.toLowerCase()))
          : true;

        // DATE FILTER
        const matchFrom = filterFrom ? new Date(a.date) >= new Date(filterFrom) : true;
        const matchTo = filterTo ? new Date(a.date) <= new Date(filterTo) : true;

        // NON-ADMIN: show only self (except for center role which sees all in their center)
        const matchUser = !["admin", "center"].includes(user?.role) ? a.name === user?.name : true;

        // ROLE FILTERS
        let matchRole = true;
        if (employeeOnly) {
          matchRole = ["admin", "hr", "sub-admin", "coach", "employee", "finance", "center", "vendor"].includes(a.role?.toLowerCase());
        } else if (studentOnly) {
          matchRole = ["student", "intern"].includes(a.role?.toLowerCase());
        } else if (internOnly) {
          matchRole = ["intern"].includes(a.role?.toLowerCase()) || (a.role?.toLowerCase() === "student" && a.internships?.length > 0);
        }

        // NEW STUDENT FILTERS
        let matchStudentFilters = true;
        if (studentOnly) {
          const sProfile = studentsMap[a.userId];
          if (!sProfile) {
            // If student profile not found, they fail strict filters
            if (filterType.length > 0 || filterVendor.length > 0 || filterCenter.length > 0 || filterCourse.length > 0 || filterBatch.length > 0 || filterYears.length > 0) {
              matchStudentFilters = false;
            }
          } else {
            const isIntern = sProfile.internships && sProfile.internships.length > 0;
            if (filterType.length > 0) {
              const matchType = (filterType.includes("intern") && isIntern) || (filterType.includes("inhouse") && !isIntern);
              if (!matchType) matchStudentFilters = false;
            }
            if (filterType.includes("intern") && filterVendor.length > 0 && isIntern) {
              const latest = sProfile.internships[sProfile.internships.length - 1];
              const vendorId = latest.vendor?._id || latest.vendor;
              if (!filterVendor.includes(vendorId)) matchStudentFilters = false;
            }
            if (filterCenter.length > 0 && !filterCenter.includes(sProfile.center?._id || sProfile.center)) matchStudentFilters = false;
            if (filterCourse.length > 0 && !filterCourse.includes(sProfile.department)) matchStudentFilters = false;
            if (filterBatch.length > 0 && !filterBatch.includes(sProfile.year)) matchStudentFilters = false;
            if (filterYears.length > 0 && (!sProfile.year || !filterYears.includes(String(sProfile.year)))) matchStudentFilters = false;
          }
        }

        return matchSearch && matchFrom && matchTo && matchUser && matchRole && matchStudentFilters;
      });
  }, [attendanceList, searchTerm, filterFrom, filterTo, user, employeeOnly, studentOnly, internOnly, filterType, filterVendor, filterCenter, filterCourse, filterBatch, filterYears, studentsMap]);

  // COLUMNS
  const calculateWorkingHours = (loginTime, logoutTime) => {
    if (!loginTime || !logoutTime) return "-";

    const parseTime = (t) => {
      // Handle "HH:mm:ss" or locale specific formats if they exist in DB
      if (t.includes("AM") || t.includes("PM")) {
        // This is harder to parse manually without a library, but let's try a fallback
        const d = new Date(`1970-01-01 ${t}`);
        return d.getTime();
      }
      const [h, m, s] = t.split(":").map(Number);
      const d = new Date(1970, 0, 1, h, m, s || 0);
      return d.getTime();
    };

    try {
      const startMs = parseTime(loginTime);
      const endMs = parseTime(logoutTime);

      const diffMs = endMs - startMs;
      if (isNaN(diffMs) || diffMs < 0) return "-";

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    } catch (e) {
      return "-";
    }
  };

  const columns = [
    { name: 'S.no', selector: (row, i) => i + 1, width: '70px', center: true },
    { 
      name: employeeOnly ? 'Employee' : 'Student', 
      selector: row => row.name, 
      sortable: true, 
      cell: row => {
        let subText = row.role || "N/A";
        if (row.role?.toLowerCase() === "student") {
           const sProfile = studentsMap[row.userId];
           subText = (sProfile?.internships && sProfile.internships.length > 0) ? "Intern" : "Student";
        }
        return (
          <div className="flex flex-col">
            <span className="font-medium text-slate-800">{row.name}</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{subText}</span>
          </div>
        );
      } 
    },
    { name: 'Date', selector: row => row.date, sortable: true, cell: row => new Date(row.date).toISOString().slice(0, 10) },
    { name: 'Login', selector: row => row.loginTime, sortable: true, cell: row => formatTime12Hour(row.loginTime) },
    { name: 'Logout', selector: row => row.logoutTime, sortable: true, cell: row => formatTime12Hour(row.logoutTime) },
    { name: 'Hours', selector: row => calculateWorkingHours(row.loginTime, row.logoutTime), center: true },
    {
      name: 'Action', center: true, width: '200px', cell: row => (
        <div className="flex justify-center gap-2 flex-nowrap">
          <button
            onClick={() => setViewModal(row)}
            className="bg-brand-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-brand-700 transition shadow-sm whitespace-nowrap"
          >
            View
          </button>
          {user.role !== "admin" &&
            new Date(row.date).toISOString().slice(0, 10) === todayDate && (
              <button
                disabled={!!row.logoutTime}
                onClick={() => setLogoutModal(row)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm ${row.logoutTime
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-green-500 text-white hover:bg-green-600"
                  }`}
              >
                {row.logoutTime ? "Logged Out" : "Logout"}
              </button>
            )}
        </div>
      )
    }
  ];

  // STATS (kept same)
  let stats = null;
  if (filteredAttendance.length > 0) {
    const person = filteredAttendance[0].name;
    const month = selectedMonth.getMonth();
    const year = selectedMonth.getFullYear();
    const today = new Date();
    const isCurrentMonth = month === today.getMonth() && year === today.getFullYear();
    const todayDate = isCurrentMonth ? today.getDate() : new Date(year, month + 1, 0).getDate();
    const personMonthRecords = attendanceList.filter(
      (a) =>
        a.name === person &&
        new Date(a.date).getMonth() === month &&
        new Date(a.date).getFullYear() === year
    );
    const present = personMonthRecords.length;

    let workingDaysTillToday = 0;
    for (let day = 1; day <= todayDate; day++) {
      const date = new Date(year, month, day);
      if (date.getDay() !== 0) workingDaysTillToday++;
    }

    let totalWorkingDays = 0;
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const date = new Date(year, month, day);
      if (date.getDay() !== 0) totalWorkingDays++;
    }

    const absent = workingDaysTillToday - present;

    stats = { present, absent, total: totalWorkingDays };
  }

  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, []);


  const hasMarkedToday = attendanceList.some(
    (a) => new Date(a.date).toISOString().slice(0, 10) === todayDate
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Tabs */}
        {!hideHeader && user.role !== "student" && (
          <div className="border-b border-slate-200 mb-4">
            <div className="flex gap-6">
              {["attendance", "payroll"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-sm font-medium border-b-2 transition-colors capitalize ${activeTab === tab
                      ? "border-indigo-600 text-indigo-700"
                      : "border-transparent text-slate-500 hover:text-indigo-700 hover:border-indigo-600"
                    }`}
                >
                  {tab.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="animate-in fade-in duration-300">
          {activeTab === "attendance" && (
            <>
              {/* HEADER */}
              {!hideHeader && (
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-800">Attendance</h1>
                    <p className="text-sm  pb-4 text-slate-500">Manage daily login/logout</p>
                  </div>

                  {!showForm && (
                    <button
                      onClick={() => setShowForm(true)}
                      disabled={hasMarkedToday && !["admin", "hr", "center"].includes(user.role)}
                      className={`bg-indigo-600 hover:bg-indigo-700 transition text-white px-6 py-2.5 rounded-xl shadow-md w-full md:w-auto ${(hasMarkedToday && !["admin", "hr", "center"].includes(user.role)) ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                    >
                      {(hasMarkedToday && !["admin", "hr", "center"].includes(user.role)) ? "Already Marked" : "+ Add Attendance"}
                    </button>
                  )}
                </div>
              )}

              {/* FORM */}
              {showForm && (
                <div className="bg-white rounded-2xl shadow-lg border p-6 w-full max-w-md mx-auto mb-6">
                  {["admin", "hr", "center"].includes(user.role) ? (
                    <form onSubmit={handleAdminSubmit} className="flex flex-col gap-4">
                      <h2 className="text-xl font-bold text-slate-800">Manual Attendance Entry</h2>
                      
                      <div className="flex flex-col gap-1">
                        <label className="text-sm font-semibold text-slate-700">User</label>
                        <select 
                          required
                          value={adminForm.targetUserId} 
                          onChange={e => setAdminForm({...adminForm, targetUserId: e.target.value})}
                          className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none w-full"
                        >
                          <option value="">Select User</option>
                          {studentOnly ? (
                            Object.values(studentsMap).map(s => <option key={s.user?._id} value={s.user?._id}>{s.user?.name} (Student)</option>)
                          ) : employeeOnly ? (
                            employees.map(e => <option key={e._id} value={e._id}>{e.name} (Employee)</option>)
                          ) : (
                            <>
                              <optgroup label="Students">
                                {Object.values(studentsMap).map(s => <option key={s.user?._id} value={s.user?._id}>{s.user?.name}</option>)}
                              </optgroup>
                              <optgroup label="Employees">
                                {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
                              </optgroup>
                            </>
                          )}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-sm font-semibold text-slate-700">Select Date</label>
                        <input 
                          type="date" 
                          required
                          value={adminForm.date} 
                          onChange={e => setAdminForm({...adminForm, date: e.target.value})}
                          className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none w-full"
                        />
                      </div>

                      <div className="flex gap-4">
                        <div className="flex flex-col gap-1 flex-1">
                          <label className="text-sm font-semibold text-slate-700">Login Time</label>
                          <input 
                            type="time" 
                            required
                            value={adminForm.loginTime} 
                            onChange={e => setAdminForm({...adminForm, loginTime: e.target.value})}
                            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none w-full"
                          />
                        </div>
                        <div className="flex flex-col gap-1 flex-1">
                          <label className="text-sm font-semibold text-slate-700">Logout Time</label>
                          <input 
                            type="time" 
                            value={adminForm.logoutTime} 
                            onChange={e => setAdminForm({...adminForm, logoutTime: e.target.value})}
                            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none w-full"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 mt-2">
                        <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-semibold hover:bg-slate-200 transition">Cancel</button>
                        <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition flex justify-center items-center">
                          {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Save Record"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-5">
                      <div className="w-full aspect-video rounded-2xl overflow-hidden border bg-black flex items-center justify-center shadow">
                      {cameraActive ? (
                        <video ref={videoRef} autoPlay className="w-full h-full object-cover" />
                      ) : photo ? (
                        <img src={photo} alt="Attendance" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white text-sm opacity-60">Starting camera...</span>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                      {cameraActive && (
                        <button
                          type="button"
                          onClick={handleCapture}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 transition text-white px-4 py-2 rounded-xl shadow"
                        >
                          Capture
                        </button>
                      )}

                      {photo && (
                        <>
                          <button
                            type="button"
                            onClick={handleRecapture}
                            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-xl"
                          >
                            Retake
                          </button>

                          <button
                            type="submit"
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl shadow flex items-center justify-center gap-2"
                          >
                            {loading ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Submitting...
                              </>
                            ) : "Submit"}
                          </button>
                        </>
                      )}
                    </div>

                    <canvas ref={canvasRef} className="hidden" />
                  </form>
                  )}
                </div>
              )}

              {/* Additional content only when NOT marking attendance */}
              {!showForm && (
                <>
                  {/* Filter */}
                  <div className="flex flex-col md:flex-row items-end justify-between mb-6 gap-4 mt-6">
                    <div className="relative flex flex-col w-full md:w-1/3 group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                      <input
                        id="search"
                        type="text"
                        placeholder={studentOnly ? "Search by name..." : "Search by name or role..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all shadow-sm text-sm font-medium"
                      />
                    </div>

                    <div className="flex gap-4 w-full md:w-auto">
                      <div className="flex flex-col">
                        <label htmlFor="filterFrom" className="text-sm pl-2 font-semibold text-slate-700 mb-1">
                          Start Date :
                        </label>
                        <input
                          id="filterFrom"
                          type="date"
                          value={filterFrom}
                          onChange={(e) => setFilterFrom(e.target.value)}
                          className="border border-slate-300 px-4 py-2 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                        />
                      </div>

                      <div className="flex flex-col">
                        <label htmlFor="filterTo" className="text-sm pl-2 font-semibold text-slate-700 mb-1">
                          End Date :
                        </label>
                        <input
                          id="filterTo"
                          type="date"
                          value={filterTo}
                          onChange={(e) => setFilterTo(e.target.value)}
                          className="border border-slate-300 px-4 py-2 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                        />
                      </div>
                    </div>
                  </div>

                  {studentOnly && (
                    <StudentFilterBar
                      filterType={filterType}
                      setFilterType={setFilterType}
                      filterCenter={filterCenter}
                      setFilterCenter={setFilterCenter}
                      filterCourse={filterCourse}
                      setFilterCourse={setFilterCourse}
                      filterBatch={filterBatch}
                      setFilterBatch={setFilterBatch}
                      filterYears={filterYears}
                      setFilterYears={setFilterYears}
                      filterVendor={filterVendor}
                      setFilterVendor={setFilterVendor}
                      centers={centers}
                      courses={courses}
                      batches={batches}
                      vendors={vendors}
                      showVendor={true}
                      showType={true}
                    />
                  )}

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden pb-4">
                    <CustomDataTable
                      columns={columns}
                      data={filteredAttendance}
                      progressPending={loading}
                      pagination
                    />
                  </div>
                </>
              )}
            </>
          )}

          {activeTab === "payroll" && <Payroll />}
        </div>

        {/* MODAL */}
        {viewModal && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setViewModal(null)}
          >
            <div
              className="bg-white w-full max-w-md p-6 rounded-2xl shadow-2xl relative"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setViewModal(null)}
                className="absolute top-3 right-4 text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>

              <h3 className="text-xl font-semibold mb-4 text-center">
                Attendance Details
              </h3>

              <div className="space-y-3 text-sm text-slate-600">
                <p><strong>Name:</strong> {viewModal.name}</p>
                <p><strong>Role:</strong> {viewModal.role}</p>
                <p>
                  <strong>Date:</strong>{" "}
                  {new Date(viewModal.date).toISOString().slice(0, 10)}
                </p>
                <p><strong>Login:</strong> {formatTime12Hour(viewModal.loginTime)}</p>
                <p><strong>Logout:</strong> {formatTime12Hour(viewModal.logoutTime)}</p>
              </div>

              {viewModal.photo && (
                <img
                  src={viewModal.photo}
                  alt="Attendance"
                  className="w-32 h-32 rounded-xl mt-5 object-cover border shadow-sm mx-auto"
                />
              )}
            </div>
          </div>
        )}

        {logoutModal && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setLogoutModal(null)}
          >
            <div
              className="bg-white w-full max-w-sm p-6 rounded-2xl shadow-2xl text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4 text-slate-800">
                Confirm Logout
              </h3>

              <p className="text-sm text-slate-500 mb-6">
                Are you sure you want to logout for today?
              </p>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setLogoutModal(null)}
                  className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-sm font-medium"
                >
                  Cancel
                </button>

                <button
                  onClick={() => handleSetLogout(logoutModal)}
                  className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium"
                >
                  Yes, Logout
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Attendance;