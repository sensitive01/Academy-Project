import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import {
  Eye,
  Trash2,
  Edit2,
  Briefcase,
  Users,
  CheckCircle,
  Clock,
  UserPlus,
  Search,
  Filter,
  MoreVertical,
  Mail,
  Bell,
  Phone,
  Calendar,
  Ban,
  Unlock,
  User,
  XCircle,
  AlertCircle,
  GraduationCap,
  MapPin,
  BookOpen,
  Heart,
  UserCheck,
  Laptop,
  Building2,
  UserCircle,
  Wallet,
  CalendarRange,
  Plus,
  LayoutDashboard,
  UploadCloud,
  Settings,
  RotateCcw,
  Download,
  FileSpreadsheet,
  FileText
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { saveAs } from "file-saver";
import CustomDataTable from "../../components/common/DataTable";
import StudentProfilePage from "./StudentProfilePage";
import Attendance from "../../pages/attendance/Attendance";
import Payroll from "../../pages/finance/Payroll";
import LeaveRequestList from "../../components/leave/LeaveRequestList";
import MultiSelectDropdown from "../../components/common/MultiSelectDropdown";
import StudentFilterBar from "../../components/common/StudentFilterBar";
import api from "../../services/api";
import Loading from "../../components/common/Loading";
import ConfirmationModal from "../../components/modals/ConfirmationModal";
import TakeAttendanceModal from "../../components/modals/TakeAttendanceModal";
import ReactDOM from "react-dom";
import toast from "react-hot-toast";
import ParentManagement from "../admin/ParentManagement";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

const StudentList = ({ students, loading, onEdit, onToggleStatus, onDelete, onView, onPromote, onSendReminder, search, setSearch }) => {
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const toggleMenu = (id, event) => {
    if (openMenuId === id) {
      setOpenMenuId(null);
    } else {
      const rect = event.currentTarget.getBoundingClientRect();
      const menuWidth = 224;
      const menuHeight = 250;
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      let left = rect.right - menuWidth;
      // Ensure menu doesn't go off screen for mobile/sidebar
      if (left < 10) left = 10;
      if (left + menuWidth > screenWidth) left = screenWidth - menuWidth - 10;

      let top = rect.bottom + window.scrollY;
      // If there's not enough room below, show it above the button
      if (rect.bottom + menuHeight > screenHeight) {
        top = rect.top + window.scrollY - menuHeight;
      }

      setMenuPosition({
        top: top,
        left: left,
      });
      setOpenMenuId(id);
    }
  };

  const columns = [
    {
      name: "S.No",
      selector: (row, index) => index + 1,
      width: "80px"
    },
    {
      name: "Student Profile",
      selector: row => row.user?.name,
      sortable: true,
      cell: row => (
        <div className="flex items-center gap-3 py-1">
          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 shadow-sm ring-2 ring-white">
            {row.profilePic?.url ? (
              <img src={row.profilePic.url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-brand-600 font-bold bg-brand-50">
                {row.user?.name?.charAt(0) || "S"}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-slate-900 whitespace-nowrap leading-tight truncate">{row.user?.name}</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter shrink-0">{row.studentId || "NO-ID"}</div>
          </div>
        </div>
      ),
      width: "200px"
    },
    {
      name: "Type",
      selector: row => row.internships?.length > 0 ? "Intern" : (row.center ? "Center Student" : "Online Student"),
      sortable: true,
      cell: row => {
        const isIntern = row.internships && row.internships.length > 0;
        const type = isIntern ? "Intern" : (row.center ? "Center Student" : "Online Student");
        return (
          <div className="flex items-center gap-1.5">
            <div className={`p-0.5 px-2 rounded-md text-[10px] font-black uppercase tracking-widest border truncate ${isIntern ? "text-amber-700 border-amber-200 bg-amber-50" :
              (row.center ? "text-brand-700 border-brand-200 bg-brand-50" : "text-emerald-700 border-emerald-200 bg-emerald-50")
              }`}>
              {type}
            </div>
          </div>
        );
      },
      width: "150px"
    },
    {
      name: "Contact info",
      cell: row => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2 text-[11px] text-slate-600 font-medium truncate max-w-[150px]">
            <Mail size={12} className="text-slate-400 shrink-0" /> {row.user?.email || row.email}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-600 font-medium">
            <Phone size={12} className="text-slate-400 shrink-0" /> {row.whatsapp || row.phone || "N/A"}
          </div>
        </div>
      ),
      width: "250px"
    },
    {
      name: "Center",
      selector: row => row.center?.name,
      sortable: true,
      cell: row => (
        <div className="flex items-center gap-1.5">
          <MapPin size={11} className="text-indigo-400 shrink-0" />
          <div className="p-0.5 px-2 text-indigo-700 rounded-md text-[10px] font-black uppercase tracking-widest border border-indigo-100 truncate">
            {row.center?.name || "N/A"}
          </div>
        </div>
      ),
      width: "200px"
    },
    {
      name: "Status",
      selector: row => row.status,
      sortable: true,
      cell: row => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${row.status === "active" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
          }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${row.status === "active" ? "bg-green-500" : "bg-red-500"}`}></span>
          {row.status}
        </span>
      ),
      width: "150px"
    },
    {
      name: "Registered",
      selector: row => row.createdAt,
      sortable: true,
      cell: row => (
        <span className="text-slate-500 text-[11px] font-bold whitespace-nowrap">
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
        </span>
      ),
      width: "150px"
    },
    {
      name: "Action",
      width: "160px",
      center: true,
      cell: row => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onView(row)}
            className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors border border-transparent hover:border-brand-200"
            title="View Profile"
          >
            <Eye size={18} />
          </button>
          <button
            onClick={() => onEdit(row)}
            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors border border-transparent hover:border-amber-200"
            title="Edit Profile"
          >
            <Edit2 size={18} />
          </button>

          <div className="relative">
            <button
              onClick={(e) => toggleMenu(row._id, e)}
              className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors border border-transparent hover:border-brand-200"
              title="More Actions"
            >
              <MoreVertical size={18} />
            </button>

            {openMenuId === row._id &&
              ReactDOM.createPortal(
                <>
                  <div className="fixed inset-0 z-[9998]" onClick={() => setOpenMenuId(null)}></div>
                  <div
                    className="fixed w-56 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-slate-100 z-[9999] py-2 animate-in fade-in zoom-in duration-100"
                    style={{ top: menuPosition.top, left: menuPosition.left }}
                  >
                    {(!row.internships || row.internships.length === 0) ? (
                      <button onClick={() => { onPromote(row, false); setOpenMenuId(null); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                        <Briefcase size={16} className="text-indigo-600" /> Promote to Intern
                      </button>
                    ) : (
                      <>
                        <button onClick={() => { onPromote(row, false); setOpenMenuId(null); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                          <Edit2 size={16} className="text-amber-500" /> Edit Current Internship
                        </button>
                        <button onClick={() => { onPromote(row, true); setOpenMenuId(null); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                          <Settings size={16} className="text-blue-500" /> Intern Settings
                        </button>
                      </>
                    )}
                    <div className="h-px bg-slate-100 my-1 mx-2"></div>

                    <button onClick={() => { onSendReminder(row); setOpenMenuId(null); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                      <Bell size={16} className="text-blue-500" /> Send Reminder
                    </button>

                    <div className="h-px bg-slate-100 my-1 mx-2"></div>
                    <button onClick={() => { onToggleStatus(row._id); setOpenMenuId(null); }} className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold transition-colors ${row.status === "active" ? "text-orange-600 hover:bg-orange-50" : "text-green-600 hover:bg-green-50"}`}>
                      {row.status === "active" ? <><Ban size={16} /> Block Student</> : <><Unlock size={16} /> Unblock Student</>}
                    </button>
                    <button onClick={() => { onDelete(row._id); setOpenMenuId(null); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors">
                      <Trash2 size={16} /> Delete Student
                    </button>
                  </div>
                </>,
                document.body
              )
            }
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="w-full overflow-x-auto scrollbar-hide">
      <CustomDataTable
        columns={columns}
        data={students}
        progressPending={loading}
        search={search}
        setSearch={setSearch}
        searchPlaceholder="Search by ID, name, email..."
      />
    </div>
  );
};

const Students = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || sessionStorage.getItem("studentsActiveTab") || "dashboard");
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [attendanceRefresh, setAttendanceRefresh] = useState(0);
  // New Filter States
  const [filterType, setFilterType] = useState([]);
  const [filterCenter, setFilterCenter] = useState([]);
  const [filterCourse, setFilterCourse] = useState([]);
  const [filterBatch, setFilterBatch] = useState([]);
  const [filterYears, setFilterYears] = useState([]);
  const [filterStatus, setFilterStatus] = useState([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState("excel");
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, id: null });
  const [promoteConfig, setPromoteConfig] = useState({ isOpen: false, student: null });
  const [reminderConfig, setReminderConfig] = useState({ isOpen: false, student: null });
  const [vendors, setVendors] = useState([]);
  const [promoteForm, setPromoteForm] = useState({
    vendorId: "",
    location: "",
    startDate: "",
    endDate: "",
    paymentBy: "",
    vendorPayment: "",
    salary: "",
    referralCharge: "",
    isNewPeriod: false
  });

  useEffect(() => {
    sessionStorage.setItem("studentsActiveTab", activeTab);
  }, [activeTab]);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentMode, setStudentMode] = useState("view"); // "view" | "edit"
  const [centers, setCenters] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);

  const handleSendReminder = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
      targetUserId: reminderConfig.student.user._id,
      title: formData.get("title"),
      description: formData.get("description"),
      type: formData.get("type")
    };
    if (formData.get("dueDate")) payload.dueDate = formData.get("dueDate");

    try {
      await api.post("/reminders/assign", payload);
      toast.success("Reminder sent successfully!");
      setReminderConfig({ isOpen: false, student: null });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send reminder");
    }
  };

  const fetchCenters = async () => {
    try {
      const { data } = await api.get("/centers");
      setCenters(data || []);
    } catch { /* Fail silently */ }
  };

  const fetchVendors = async () => {
    try {
      const { data } = await api.get("/vendors");
      setVendors(data || []);
    } catch { /* Fail silently */ }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/students");
      setStudents(data.students || []);
      setFiltered(data.students || []);
    } catch {
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const { data } = await api.get("/courses");
      setCourses(data.courses || data || []);
    } catch { /* Fail silently */ }
  };

  const fetchBatches = async () => {
    try {
      const { data } = await api.get("/batches");
      setBatches(data.batches || data || []);
    } catch { /* Fail silently */ }
  };

  useEffect(() => {
    fetchCenters();
    fetchVendors();
    fetchStudents();
    fetchCourses();
    fetchBatches();
  }, []);

  useEffect(() => {
    let result = students;

    if (activeTab === "online_students") {
      result = result.filter(s => !s.center);
    } else if (activeTab === "center_students") {
      result = result.filter(s => !!s.center);

      if (filterType && filterType.length > 0) {
        result = result.filter(s => {
          const isIntern = s.internships && s.internships.length > 0;
          return (filterType.includes("intern") && isIntern) || (filterType.includes("inhouse") && !isIntern);
        });
      }
      if (filterCenter && filterCenter.length > 0) {
        result = result.filter(s => filterCenter.includes(s.center) || filterCenter.includes(s.center?._id));
      }
      if (filterCourse && filterCourse.length > 0) {
        result = result.filter(s => s.enrolledCourses?.some(ec => filterCourse.includes(ec.course?._id) || filterCourse.includes(ec.course)));
      }
      if (filterBatch && filterBatch.length > 0) {
        const selectedBatches = batches.filter(b => filterBatch.includes(b._id));
        if (selectedBatches.length > 0) {
          result = result.filter(s => selectedBatches.some(b => b.students?.some(bs => bs === s._id || bs?._id === s._id)));
        } else {
          result = [];
        }
      }
      if (filterYears && filterYears.length > 0) {
        result = result.filter(s => s.year && filterYears.includes(String(s.year)));
      }
      if (filterStatus && filterStatus.length > 0) {
        result = result.filter(s => {
          const isActive = s.status === "active";
          return (filterStatus.includes("active") && isActive) || (filterStatus.includes("inactive") && !isActive);
        });
      }
    }

    if (search) {
      result = result.filter(
        (s) =>
          s.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
          s.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
          s.studentId?.toLowerCase().includes(search.toLowerCase()) ||
          s.phone?.toLowerCase().includes(search.toLowerCase()) ||
          s.whatsapp?.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFiltered(result);
  }, [search, students, activeTab, filterType, filterCenter, filterCourse, filterBatch, filterYears, filterStatus]);

  const handleDelete = (id) => {
    setConfirmConfig({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    const id = confirmConfig.id;
    if (!id) return;
    try {
      await api.delete(`/students/${id}`);
      toast.success("Student deleted successfully");
      setStudents((prev) => prev.filter((s) => s._id !== id));
      setConfirmConfig({ isOpen: false, id: null });
    } catch {
      toast.error("Failed to delete student");
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await api.patch(`/students/${id}/status`);
      toast.success(res.data.message);
      fetchStudents();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleUpdate = async (updatedData) => {
    try {
      const payload = { ...updatedData };
      if (payload.center && typeof payload.center === "object") payload.center = payload.center._id;
      const { data } = await api.put(`/students/${payload._id}`, payload);
      setStudents((prev) => prev.map((s) => (s._id === payload._id ? data.student : s)));
      setSelectedStudent(data.student);
      setStudentMode("view");
      toast.success("Student updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
      throw err;
    }
  };

  const handleExport = () => {
    setShowExportModal(false);
    if (exportFormat === "excel") {
      const data = filtered.map((s, i) => ({
        "S.No": i + 1,
        "Student ID": s.studentId || "-",
        Name: s.user?.name || "-",
        Email: s.user?.email || "-",
        Phone: s.phone || "-",
        WhatsApp: s.whatsapp || "-",
        Department: s.department || "-",
        Year: s.year || "-",
        Status: s.status || "-",
      }));
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
      XLSX.writeFile(workbook, "Students.xlsx");
      toast.success("Excel exported successfully!");
    } else {
      const doc = new jsPDF();
      doc.text("Students Directory", 14, 15);
      
      const tableColumn = ["S.No", "Student ID", "Name", "Email", "Phone", "WhatsApp", "Dept", "Year", "Status"];
      const tableRows = [];

      filtered.forEach((s, index) => {
        const rowData = [
          index + 1,
          s.studentId || "-",
          s.user?.name || "-",
          s.user?.email || "-",
          s.phone || "-",
          s.whatsapp || "-",
          s.department || "-",
          s.year || "-",
          s.status || "-"
        ];
        tableRows.push(rowData);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 20,
        theme: "striped",
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 10 }, // S.No
          1: { cellWidth: 22 }, // Student ID
          2: { cellWidth: 25 }, // Name
          3: { cellWidth: 38 }, // Email
          4: { cellWidth: 20 }, // Phone
          5: { cellWidth: 20 }, // WhatsApp
          6: { cellWidth: 15 }, // Dept
          7: { cellWidth: 15 }, // Year
          8: { cellWidth: 15 }  // Status
        }
      });
      
      const pdfBlob = doc.output("blob");
      saveAs(pdfBlob, "Students_Report.pdf");
      toast.success("PDF exported successfully!");
    }
  };

  const tabs = {
    dashboard: { label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    online_students: { label: "Online Students", icon: <Laptop size={20} /> },
    center_students: { label: "Center Students", icon: <Building2 size={20} /> },
    student_attendance: { label: "Student Attendance", icon: <CheckCircle size={20} /> },
    intern_payroll: { label: "Intern Payroll", icon: <Wallet size={20} /> },
    leaves: { label: "Leaves", icon: <CalendarRange size={20} /> },
    parent_mgmt: { label: "Parent Mgmt", icon: <Users size={20} /> },
  };

  if (selectedStudent) {
    return (
      <div className="w-full">
        <StudentProfilePage
          student={selectedStudent}
          initialMode={studentMode}
          centers={centers}
          onBack={() => setSelectedStudent(null)}
          onUpdate={handleUpdate}
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-in fade-in duration-500 max-w-full overflow-hidden">
      {/* Header */}
      <TakeAttendanceModal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        onSuccess={() => setAttendanceRefresh(prev => prev + 1)}
      />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative z-10">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Student Directory</h1>
          <p className="text-slate-500 text-sm font-medium">Manage student profiles, enrollments, and internship status.</p>
        </div>

        <div className="flex gap-3">
          {["online_students", "center_students"].includes(activeTab) && (
            <>
              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 font-bold text-brand-700 bg-brand-50 rounded-2xl hover:bg-brand-100 transition-all active:scale-95 cursor-pointer"
              >
                <Download size={18} /> Export
              </button>
              <button
                onClick={() => window.open("/student-registration", "_blank")}
                className="flex items-center gap-2 px-6 py-2.5 font-bold text-white bg-brand-600 rounded-2xl shadow-lg shadow-brand-600/20 hover:bg-brand-700 transition-all active:scale-95"
              >
                <UserPlus size={18} /> Add Student
              </button>
            </>
          )}

          {(activeTab === "student_attendance") && (
            <>
              {["admin", "hr", "center"].includes(user?.role) && (
                <button
                  onClick={() => navigate("/dashboard/students/bulk-attendance")}
                  className="flex items-center gap-2 px-6 py-2.5 font-bold text-slate-700 bg-white border border-slate-200 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95"
                >
                  <UploadCloud size={18} /> Bulk Upload
                </button>
              )}
              <button
                onClick={() => setIsAttendanceModalOpen(true)}
                className="flex items-center gap-2 px-6 py-2.5 font-bold text-white bg-brand-600 rounded-2xl shadow-lg shadow-brand-600/20 hover:bg-brand-700 transition-all active:scale-95"
              >
                <Plus size={18} /> Add Attendance
              </button>
            </>
          )}
        </div>
      </div>

      {/* TABS */}
      <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-200 gap-8">
        {Object.keys(tabs).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 px-2 text-sm font-medium transition-colors relative whitespace-nowrap flex items-center gap-2 group ${activeTab === tab
              ? "text-brand-600"
              : "text-gray-500 hover:text-brand-600"
              }`}
          >
            {tabs[tab].icon}
            {tabs[tab].label}
            <div className={`absolute bottom-0 left-0 w-full h-0.5 rounded-t-full transition-colors ${activeTab === tab ? "bg-brand-600" : "bg-transparent group-hover:bg-brand-600"
              }`} />
          </button>
        ))}
      </div>

      {/* Content Area */}
      {activeTab === "dashboard" ? (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Minimalist Card 1 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-500">Total Students</span>
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                  <Users size={16} className="text-blue-600" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-slate-900">{students.length}</span>
              </div>
              <div className="mt-4 flex gap-4 text-xs font-medium text-slate-400">
                <span>Active: <span className="text-slate-700">{students.filter(s => s.status === 'active').length}</span></span>
                <span>Inactive: <span className="text-slate-700">{students.filter(s => s.status !== 'active').length}</span></span>
              </div>
            </div>

            {/* Minimalist Card 2 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-500">Online Students</span>
                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                  <Laptop size={16} className="text-indigo-600" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-slate-900">{students.filter(s => !s.center).length}</span>
              </div>
              <div className="mt-4 text-xs font-medium text-slate-400">
                Remote learners
              </div>
            </div>

            {/* Minimalist Card 3 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-500">Center Students</span>
                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                  <Building2 size={16} className="text-emerald-600" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-slate-900">{students.filter(s => !!s.center).length}</span>
              </div>
              <div className="mt-4 text-xs font-medium text-slate-400">
                In-person learners
              </div>
            </div>

            {/* Minimalist Card 4 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-500">Active Interns</span>
                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
                  <Briefcase size={16} className="text-amber-600" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-slate-900">{students.filter(s => s.internships?.length > 0).length}</span>
              </div>
              <div className="mt-4 text-xs font-medium text-slate-400">
                Currently on internship
              </div>
            </div>

          </div>
        </div>
      ) : ["online_students", "center_students"].includes(activeTab) ? (
        <>
          {/* Stats Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Total Displayed", value: filtered.length, icon: Users, color: "blue" },
              { label: "Active Records", value: filtered.filter(s => s.status === "active").length, icon: CheckCircle, color: "emerald" },
              { label: "Interns", value: filtered.filter(s => s.internships?.length > 0).length, icon: Briefcase, color: "amber" },
              { label: "Departments", value: [...new Set(filtered.map(s => s.department))].length, icon: GraduationCap, color: "indigo" },
            ].map((stat, i) => (
              <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-brand-200 transition-all">
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none truncate">{stat.label}</p>
                  <p className="text-3xl font-black text-slate-900 mt-2">{stat.value}</p>
                </div>
                <div className={`p-4 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 group-hover:rotate-12 transition-all shrink-0`}>
                  <stat.icon size={26} strokeWidth={2.5} />
                </div>
              </div>
            ))}
          </div>

          {/* Filters Section for Center Students */}
          {activeTab === "center_students" && (
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
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              centers={centers}
              courses={courses.filter(c => c.type === "Center Courses")}
              batches={batches}
              showType={true}
            />
          )}

          {/* Table Section */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <StudentList
              students={filtered}
              loading={loading}
              onEdit={(s) => {
                setSelectedStudent(s);
                setStudentMode("edit");
              }}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
              onView={(s) => {
                setSelectedStudent(s);
                setStudentMode("view");
              }}
              onPromote={(row, isNewPeriod) => {
                if (row.internships && row.internships.length > 0) {
                  const latest = row.internships[row.internships.length - 1];
                  setPromoteForm({
                    vendorId: latest.vendor?._id || latest.vendor || "",
                    location: latest.location || "",
                    startDate: isNewPeriod ? "" : (latest.startDate ? latest.startDate.split('T')[0] : ""),
                    endDate: isNewPeriod ? "" : (latest.endDate ? latest.endDate.split('T')[0] : ""),
                    paymentBy: latest.paymentBy || "",
                    vendorPayment: latest.vendorPayment || "",
                    salary: latest.salary || "",
                    referralCharge: latest.referralCharge || "",
                    isNewPeriod: isNewPeriod
                  });
                } else {
                  setPromoteForm({ vendorId: "", location: "", startDate: "", endDate: "", paymentBy: "", vendorPayment: "", salary: "", referralCharge: "", isNewPeriod: false });
                }
                setPromoteConfig({ isOpen: true, student: row });
              }}
              onSendReminder={(student) => setReminderConfig({ isOpen: true, student })}
              search={search}
              setSearch={setSearch}
            />
          </div>
        </>
      ) : activeTab === "student_attendance" ? (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-2 overflow-hidden">
          <Attendance studentOnly={true} hideHeader={true} refreshTrigger={attendanceRefresh} />
        </div>
      ) : activeTab === "intern_payroll" ? (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4 sm:p-6 overflow-hidden">
          <Payroll internOnly={true} hideHeader={false} />
        </div>
      ) : activeTab === "leaves" ? (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-2 overflow-hidden">
          <LeaveRequestList />
        </div>
      ) : activeTab === "parent_mgmt" ? (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-2 overflow-hidden">
          <ParentManagement />
        </div>
      ) : null}

      {/* PROMOTE INTERN MODAL (PORTAL) */}
      {promoteConfig.isOpen && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setPromoteConfig({ isOpen: false, student: null })}></div>
          <div className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl relative z-10 animate-in zoom-in duration-300">
            <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">
                  {promoteForm.isNewPeriod ? "Add New Internship Period" : "Internship Portal"}
                </h2>
                <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">{promoteConfig.student?.user?.name}</p>
              </div>
              <button onClick={() => setPromoteConfig({ isOpen: false, student: null })} className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-full">✕</button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const { data } = await api.post(`/students/${promoteConfig.student._id}/promote-intern`, promoteForm);
                setStudents(prev => prev.map(s => s._id === data.student._id ? data.student : s));
                setPromoteConfig({ isOpen: false, student: null });
                toast.success("Student updated as intern!");
              } catch (err) {
                toast.error(err.response?.data?.message || "Failed to update");
              }
            }} className="p-8 space-y-5">
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Hiring Vendor</label>
                <select required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-brand-500 outline-none transition-all" value={promoteForm.vendorId} onChange={(e) => setPromoteForm({ ...promoteForm, vendorId: e.target.value })}>
                  <option value="">-- Choose Vendor --</option>
                  {vendors.map(v => <option key={v._id} value={v._id}>{v.companyName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Location</label>
                <input type="text" placeholder="City / Branch" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-brand-500 outline-none transition-all" value={promoteForm.location} onChange={(e) => setPromoteForm({ ...promoteForm, location: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Start Date</label>
                  <input type="date" required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-brand-500 outline-none transition-all" value={promoteForm.startDate} onChange={(e) => setPromoteForm({ ...promoteForm, startDate: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">End Date</label>
                  <input type="date" required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-brand-500 outline-none transition-all" value={promoteForm.endDate} onChange={(e) => setPromoteForm({ ...promoteForm, endDate: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">

                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Payout Method</label>
                  <select required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-brand-500 outline-none transition-all" value={promoteForm.paymentBy} onChange={(e) => setPromoteForm({ ...promoteForm, paymentBy: e.target.value })}>
                    <option value="">Select</option>
                    <option value="Both">Both</option>
                    <option value="Vendor Payment">Vendor Payment</option>
                    <option value="Academy Stipend">Academy Stipend</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Vendor Payment</label>
                  <input type="number" required placeholder="0.00" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-brand-500 outline-none transition-all" value={promoteForm.vendorPayment} onChange={(e) => {
                    const val = e.target.value;
                    const vp = Number(val) || 0;
                    const sal = Number(promoteForm.salary) || 0;
                    setPromoteForm({ ...promoteForm, vendorPayment: val, referralCharge: (vp - sal).toString() });
                  }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Student Salary</label>
                  <input type="number" required placeholder="0.00" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-brand-500 outline-none transition-all" value={promoteForm.salary} onChange={(e) => {
                    const val = e.target.value;
                    const vp = Number(promoteForm.vendorPayment) || 0;
                    const sal = Number(val) || 0;
                    setPromoteForm({ ...promoteForm, salary: val, referralCharge: (vp - sal).toString() });
                  }} />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Referral Charge</label>
                  <input type="number" readOnly placeholder="0.00" className="w-full px-4 py-3 bg-slate-100 border border-slate-200 text-slate-500 rounded-2xl text-sm font-bold outline-none cursor-not-allowed" value={promoteForm.referralCharge} />
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-50">
                <button type="button" onClick={() => setPromoteConfig({ isOpen: false, student: null })} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all">Cancel</button>
                <button type="submit" className="px-10 py-3 bg-brand-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-brand-600/20 hover:bg-brand-700 transition-all active:scale-95">Save Details</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Send Reminder Modal */}
      {reminderConfig.isOpen && reminderConfig.student && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Bell size={20} className="text-blue-500" /> Send Reminder to {reminderConfig.student.user?.name}
              </h2>
              <button onClick={() => setReminderConfig({ isOpen: false, student: null })} className="text-slate-400 hover:text-slate-600">
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleSendReminder} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Reminder Type</label>
                <select
                  name="type"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  required
                >
                  <option value="fee_reminder">Fee Reminder</option>
                  <option value="admin_notice">Administrative Notice</option>
                  <option value="personal">General Task</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. Please pay pending Term 1 Fees"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Additional details..."
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Due Date (Optional)</label>
                <input
                  type="date"
                  name="dueDate"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setReminderConfig({ isOpen: false, student: null })}
                  className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm"
                >
                  Send Reminder
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
      {showExportModal && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[10000] p-4" onClick={() => setShowExportModal(false)}>
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Export Data</h3>
            <p className="text-slate-500 text-xs mb-6">Choose your preferred format to export the filtered student list.</p>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => setExportFormat("excel")}
                className={`p-4 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                  exportFormat === "excel"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-slate-100 hover:border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className={`p-2.5 rounded-xl ${exportFormat === "excel" ? "bg-emerald-500 text-white" : "bg-slate-50 text-slate-400"}`}>
                  <FileSpreadsheet size={20} />
                </div>
                <span className="text-xs font-bold">Excel (.xlsx)</span>
              </button>

              <button
                onClick={() => setExportFormat("pdf")}
                className={`p-4 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                  exportFormat === "pdf"
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-slate-100 hover:border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className={`p-2.5 rounded-xl ${exportFormat === "pdf" ? "bg-red-500 text-white" : "bg-slate-50 text-slate-400"}`}>
                  <FileText size={20} />
                </div>
                <span className="text-xs font-bold">PDF Document</span>
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-brand-600/20 transition-all"
              >
                Export
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Students;