import React, { useEffect, useState, useRef } from "react";
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
  FileText,
  ChevronDown
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

const StudentList = ({ students, loading, onEdit, onToggleStatus, onDelete, onView, onPromote, onSendReminder, search, setSearch, selectableRows, onSelectedRowsChange, clearSelectedRows, tableHeaderActions, selectableRowDisabled }) => {
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
            <div className="text-[10px] font-black text-brand-600 uppercase tracking-tighter shrink-0 mt-0.5">{row.year || ""}</div>
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
                          <Settings size={16} className="text-blue-500" /> Intern Settings
                        </button>
                        <button onClick={() => { onPromote(row, true); setOpenMenuId(null); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                          <Plus size={16} className="text-emerald-500" /> Add New Period
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
        selectableRows={selectableRows}
        selectableRowDisabled={selectableRowDisabled}
        onSelectedRowsChange={onSelectedRowsChange}
        clearSelectedRows={clearSelectedRows}
        additionalHeaderContent={tableHeaderActions}
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
  const [filterVendor, setFilterVendor] = useState([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState("excel");
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, id: null });
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [promoteConfig, setPromoteConfig] = useState({ isOpen: false, student: null, isBulk: false });
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [clearSelectedRows, setClearSelectedRows] = useState(false);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [isAcademicBulkMode, setIsAcademicBulkMode] = useState(false);
  const [academicPromoteConfig, setAcademicPromoteConfig] = useState({ isOpen: false });
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
    referralCharge: "",
    isNewPeriod: false
  });

  const fileInputRef = useRef(null);
  const [bulkUploadResult, setBulkUploadResult] = useState({ isOpen: false, result: null, isLoading: false });
  const [previewModal, setPreviewModal] = useState({ 
    isOpen: false, 
    validRecords: [], 
    duplicateRecords: [], 
    invalidRecords: [], 
    isLoading: false,
    selectedDuplicates: []
  });
  const [activePreviewTab, setActivePreviewTab] = useState('valid');

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

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "Student ID": "",
        "Name": "John Doe",
        "Email": "john@example.com",
        "DOB": "2000-01-01",
        "Course ID": "CRS-XXXX",
        "Batch ID": "B-001",
        "Center ID": "CEN-2024-XXXX",
        "Year": "1st Year"
      }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Student_Bulk_Upload_Template.xlsx");
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPreviewModal(prev => ({ ...prev, isOpen: true, isLoading: true }));

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
            toast.error("File is empty.");
            setPreviewModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
            return;
        }

        const res = await api.post("/students/bulk-upload-preview", { students: data });
        setPreviewModal(prev => ({ 
          ...prev, 
          isOpen: true, 
          validRecords: res.data.validRecords,
          duplicateRecords: res.data.duplicateRecords,
          invalidRecords: res.data.invalidRecords,
          isLoading: false,
          selectedDuplicates: []
        }));
        setActivePreviewTab('valid');
      } catch (error) {
        toast.error(error.response?.data?.message || "Error processing file.");
        setPreviewModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsBinaryString(file);
  };

  const handleCommitUpload = async () => {
    const recordsToProcess = [
      ...previewModal.validRecords,
      ...previewModal.duplicateRecords
        .filter(d => previewModal.selectedDuplicates.includes(d.id))
        .map(d => ({ ...d, isUpdate: true }))
    ];

    if (recordsToProcess.length === 0) {
      toast.error("No records selected to upload.");
      return;
    }

    setPreviewModal(prev => ({ ...prev, isLoading: true }));
    try {
      const res = await api.post("/students/bulk-upload", { recordsToProcess });
      setPreviewModal({ isOpen: false, validRecords: [], duplicateRecords: [], invalidRecords: [], isLoading: false, selectedDuplicates: [] });
      setBulkUploadResult({ isOpen: true, result: res.data, isLoading: false });
      fetchStudents();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error uploading records.");
      setPreviewModal(prev => ({ ...prev, isLoading: false }));
    }
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
      if (filterVendor && filterVendor.length > 0) {
        result = result.filter(s => {
          if (!s.internships || s.internships.length === 0) return false;
          const latest = s.internships[s.internships.length - 1];
          const vendorId = String(latest.vendor?._id || latest.vendor || "");
          return filterVendor.map(v => String(v)).includes(vendorId);
        });
      }
      if (filterCenter && filterCenter.length > 0) {
        result = result.filter(s => filterCenter.includes(s.center) || filterCenter.includes(s.center?._id));
      }
      if (filterCourse && filterCourse.length > 0) {
        result = result.filter(s => s.enrolledCourses?.some(ec => filterCourse.includes(ec.course?._id) || filterCourse.includes(ec.course)));
      }
      if (filterBatch && filterBatch.length > 0) {
        const selectedBatches = batches.filter(b => filterBatch.includes(b.name || b.batchId || b._id));
        if (selectedBatches.length > 0) {
          const batchIds = selectedBatches.map(b => b._id.toString());
          result = result.filter(s => {
            const inBatchState = selectedBatches.some(b => b.students?.some(bs => bs === s._id || bs?._id === s._id));
            const inStudentState = s.enrolledCourses?.some(ec => {
              const ecBatchId = typeof ec.batch === 'object' ? ec.batch?._id : ec.batch;
              return ecBatchId && batchIds.includes(ecBatchId.toString());
            });
            return inBatchState || inStudentState;
          });
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
  }, [search, students, activeTab, filterType, filterCenter, filterCourse, filterBatch, filterYears, filterStatus, filterVendor]);

  const handleDelete = (id) => {
    setConfirmConfig({ isOpen: true, id });
  };

  const handleBulkDelete = async () => {
    const toastId = toast.loading(`Deleting ${selectedStudents.length} students...`);
    try {
      const studentIds = selectedStudents.map(s => s._id);
      const { data } = await api.post(`/students/bulk-delete`, { ids: studentIds });
      toast.success(data.message || "Students deleted successfully!", { id: toastId });
      setSelectedStudents([]);
      setClearSelectedRows(!clearSelectedRows);
      setConfirmBulkDelete(false);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete students", { id: toastId });
    }
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
              filterVendor={filterVendor}
              setFilterVendor={setFilterVendor}
              centers={centers}
              courses={courses.filter(c => c.type === "Center Courses")}
              batches={batches}
              vendors={vendors}
              showType={true}
              showVendor={true}
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
              selectableRows={true}
              onSelectedRowsChange={({ selectedRows }) => setSelectedStudents(selectedRows)}
              clearSelectedRows={clearSelectedRows}
              tableHeaderActions={
                selectedStudents.length > 0 ? (
                  <div className="flex gap-3 animate-in fade-in zoom-in-95 duration-200">
                    <button
                      onClick={() => setConfirmBulkDelete(true)}
                      className="flex items-center gap-2 px-5 py-2.5 font-bold text-white bg-red-600 rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 active:scale-95 cursor-pointer"
                    >
                      <Trash2 size={18} /> Delete Selected ({selectedStudents.length})
                    </button>

                    <div className="relative group">
                      <button className="flex items-center gap-2 px-5 py-2.5 font-bold text-white bg-indigo-600 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 cursor-pointer">
                        <Briefcase size={18} /> Promote Selected <ChevronDown size={16} />
                      </button>
                      <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <button
                          onClick={() => {
                            setPromoteForm({ vendorId: "", location: "", startDate: "", endDate: "", paymentBy: "", vendorPayment: "", salary: "", referralCharge: "", isNewPeriod: false });
                            setPromoteConfig({ isOpen: true, student: null, isBulk: true });
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-indigo-700 hover:bg-indigo-50 transition-colors text-left"
                        >
                          <Briefcase size={16} /> Bulk Promote
                        </button>
                        <div className="h-px bg-slate-50 w-full"></div>
                        <button
                          onClick={() => {
                            setAcademicPromoteConfig({ isOpen: true });
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-emerald-700 hover:bg-emerald-50 transition-colors text-left"
                        >
                          <GraduationCap size={16} /> Academic Promote
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedStudents([]);
                        setClearSelectedRows(!clearSelectedRows);
                      }}
                      className="flex items-center gap-2 px-5 py-2.5 font-bold text-slate-600 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all active:scale-95 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const type = activeTab === "online_students" ? "online" : "center";
                      window.open(`/student-registration?type=${type}`, "_blank");
                    }}
                    className="flex items-center gap-2 px-6 py-2.5 font-bold text-white bg-brand-600 rounded-2xl shadow-lg shadow-brand-600/20 hover:bg-brand-700 transition-all active:scale-95"
                  >
                    <UserPlus size={18} /> Add Student
                  </button>
                  <div className="relative group">
                    <button className="flex items-center gap-2 px-5 py-2.5 font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-2xl hover:bg-blue-100 transition-all cursor-pointer">
                      <UploadCloud size={18} /> Bulk Upload <ChevronDown size={16} />
                    </button>
                    <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <button
                        onClick={handleDownloadTemplate}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-blue-700 hover:bg-blue-50 transition-colors text-left"
                      >
                        <Download size={16} /> Download Template
                      </button>
                      <div className="h-px bg-slate-50 w-full"></div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-brand-700 hover:bg-brand-50 transition-colors text-left"
                      >
                        <UploadCloud size={16} /> Upload Excel/CSV
                      </button>
                      <input 
                        type="file" 
                        accept=".xlsx, .xls, .csv" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        className="hidden" 
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => setShowExportModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 font-bold text-brand-700 bg-brand-50 border border-brand-200 rounded-2xl hover:bg-brand-100 transition-all active:scale-95 cursor-pointer"
                  >
                    <Download size={18} /> Export
                  </button>
                </div>
              )}
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
                  {promoteConfig.isBulk ? "Bulk Promote to Intern" : (promoteForm.isNewPeriod ? "Add New Internship Period" : "Internship Portal")}
                </h2>
                <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">
                  {promoteConfig.isBulk ? `Promoting ${selectedStudents.length} Students` : promoteConfig.student?.user?.name}
                </p>
              </div>
              <button onClick={() => setPromoteConfig({ isOpen: false, student: null })} className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-full">✕</button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                if (promoteConfig.isBulk) {
                  const studentIds = selectedStudents.map(s => s._id);
                  const { data } = await api.post(`/students/bulk-promote-intern`, { studentIds, ...promoteForm });
                  toast.success(data.message || "Students promoted successfully!");
                  setSelectedStudents([]);
                  setClearSelectedRows(!clearSelectedRows);
                  fetchStudents();
                } else {
                  const { data } = await api.post(`/students/${promoteConfig.student._id}/promote-intern`, promoteForm);
                  setStudents(prev => prev.map(s => s._id === data.student._id ? data.student : s));
                  toast.success("Student updated as intern!");
                }
                setPromoteConfig({ isOpen: false, student: null, isBulk: false });
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
                <button type="button" onClick={() => setPromoteConfig({ isOpen: false, student: null, isBulk: false })} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all">Cancel</button>
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
      {/* Academic Promote Confirmation Modal */}
      {academicPromoteConfig.isOpen && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[10000] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4">
              <GraduationCap size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Bulk Academic Promote</h3>
            <p className="text-slate-500 text-xs mb-6">Are you sure you want to promote {selectedStudents.length} students to their next academic year? This will also duplicate their base fee structures for the new year.</p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setAcademicPromoteConfig({ isOpen: false })}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const studentIds = selectedStudents.map(s => s._id);
                    const { data } = await api.post(`/students/bulk-promote-academic`, { studentIds });
                    toast.success(data.message || "Students promoted successfully!");
                    setSelectedStudents([]);
                    setClearSelectedRows(!clearSelectedRows);
                    setIsAcademicBulkMode(false);
                    fetchStudents();
                    setAcademicPromoteConfig({ isOpen: false });
                  } catch (err) {
                    toast.error(err.response?.data?.message || "Failed to promote students");
                  }
                }}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
              >
                Promote
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* Bulk Delete Confirmation Modal */}
      {confirmBulkDelete && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[10000] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete {selectedStudents.length} Students</h3>
            <p className="text-slate-500 text-xs mb-6">Are you sure you want to delete {selectedStudents.length} students? This action will permanently remove their profiles, linked user accounts, and all fee records. This action cannot be undone.</p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmBulkDelete(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-red-600/20 transition-all cursor-pointer"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {confirmConfig.isOpen && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[10000] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Student</h3>
            <p className="text-slate-500 text-xs mb-6">Are you sure you want to delete this student? This action will permanently remove the student profile and their linked user account. This action cannot be undone.</p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmConfig({ isOpen: false, id: null })}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-red-600/20 transition-all cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Bulk Upload Result Modal */}
      {bulkUploadResult.isOpen && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[10000] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Bulk Upload Results</h3>
              <button onClick={() => setBulkUploadResult({ isOpen: false, result: null, isLoading: false })} className="text-slate-400 hover:text-slate-600 transition-colors">
                <XCircle size={24} />
              </button>
            </div>
            {bulkUploadResult.isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mb-4"></div>
                <p className="text-slate-500 font-medium">Processing records, please wait...</p>
              </div>
            ) : bulkUploadResult.result ? (
              <div className="flex-1 overflow-y-auto pr-2">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center"><CheckCircle size={24} /></div>
                    <div>
                      <p className="text-sm text-green-800 font-semibold mb-1">Successfully Uploaded</p>
                      <p className="text-2xl font-black text-green-700">{bulkUploadResult.result.successCount}</p>
                    </div>
                  </div>
                  <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center"><AlertCircle size={24} /></div>
                    <div>
                      <p className="text-sm text-red-800 font-semibold mb-1">Skipped Records</p>
                      <p className="text-2xl font-black text-red-700">{bulkUploadResult.result.skippedRecords?.length || 0}</p>
                    </div>
                  </div>
                </div>
                {bulkUploadResult.result.skippedRecords?.length > 0 && (
                  <div>
                    <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><AlertCircle size={16} className="text-red-500" /> Skipped Records Details</h4>
                    <div className="space-y-3">
                      {bulkUploadResult.result.skippedRecords.map((skip, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row gap-2 sm:gap-4 sm:items-center justify-between">
                          <div className="font-medium text-slate-700 text-sm">{skip.name || "Unknown row"} {skip.studentId ? `(${skip.studentId})` : ""}</div>
                          <div className="text-xs font-bold px-3 py-1 bg-red-100 text-red-700 rounded-full">{skip.reason}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">Something went wrong.</div>
            )}
            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button onClick={() => setBulkUploadResult({ isOpen: false, result: null, isLoading: false })} className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">Close</button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* Preview Modal */}
      {previewModal.isOpen && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[10000] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-4xl w-full shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Preview Upload</h3>
                <p className="text-sm text-slate-500">Review your data before finalizing</p>
              </div>
              <button onClick={() => setPreviewModal(prev => ({ ...prev, isOpen: false, isLoading: false }))} className="text-slate-400 hover:text-slate-600 transition-colors">
                <XCircle size={24} />
              </button>
            </div>
            
            {previewModal.isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 flex-1">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mb-4"></div>
                <p className="text-slate-500 font-medium">Analyzing records...</p>
              </div>
            ) : (
              <>
                <div className="flex gap-4 border-b border-slate-200 mb-4">
                  <button 
                    onClick={() => setActivePreviewTab('valid')}
                    className={`pb-3 font-semibold text-sm px-2 transition-colors relative ${activePreviewTab === 'valid' ? 'text-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Ready ({previewModal.validRecords.length})
                    {activePreviewTab === 'valid' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-600 rounded-t-full"></div>}
                  </button>
                  <button 
                    onClick={() => setActivePreviewTab('duplicates')}
                    className={`pb-3 font-semibold text-sm px-2 transition-colors relative ${activePreviewTab === 'duplicates' ? 'text-orange-600' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Duplicates ({previewModal.duplicateRecords.length})
                    {activePreviewTab === 'duplicates' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-600 rounded-t-full"></div>}
                  </button>
                  <button 
                    onClick={() => setActivePreviewTab('invalid')}
                    className={`pb-3 font-semibold text-sm px-2 transition-colors relative ${activePreviewTab === 'invalid' ? 'text-red-600' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Invalid ({previewModal.invalidRecords.length})
                    {activePreviewTab === 'invalid' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 rounded-t-full"></div>}
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  {activePreviewTab === 'valid' && (
                    <div className="space-y-3">
                      {previewModal.validRecords.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">No valid records found.</div>
                      ) : (
                        previewModal.validRecords.map(r => (
                          <div key={r.id} className="bg-white border border-slate-200 p-3 rounded-xl flex justify-between items-center shadow-sm">
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{r["Name"]}</p>
                              <p className="text-xs text-slate-500">{r["Email"] || "No Email"} | {r["Student ID"] || "New ID will be generated"}</p>
                            </div>
                            <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle size={14}/> Ready</div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activePreviewTab === 'duplicates' && (
                    <div>
                      <div className="mb-4 bg-orange-50 border border-orange-200 text-orange-800 p-3 rounded-xl text-xs flex gap-2 items-start">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                        <p>These records conflict with existing students. <strong>Check the box</strong> to overwrite their existing data, or leave unchecked to safely skip them.</p>
                      </div>
                      <div className="space-y-3">
                        {previewModal.duplicateRecords.length === 0 ? (
                          <div className="text-center py-8 text-slate-500">No duplicates found.</div>
                        ) : (
                          previewModal.duplicateRecords.map(r => {
                            const isSelected = previewModal.selectedDuplicates.includes(r.id);
                            return (
                              <label key={r.id} className={`flex items-center gap-3 bg-white border p-3 rounded-xl cursor-pointer transition-all ${isSelected ? 'border-orange-400 ring-1 ring-orange-400 shadow-md' : 'border-slate-200 hover:border-orange-300'}`}>
                                <input 
                                  type="checkbox" 
                                  className="w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-orange-500"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setPreviewModal(prev => ({ ...prev, selectedDuplicates: [...prev.selectedDuplicates, r.id] }));
                                    } else {
                                      setPreviewModal(prev => ({ ...prev, selectedDuplicates: prev.selectedDuplicates.filter(id => id !== r.id) }));
                                    }
                                  }}
                                />
                                <div className="flex-1">
                                  <p className="font-bold text-slate-800 text-sm">{r["Name"]}</p>
                                  <p className="text-xs text-slate-500">{r["Email"]} | {r["Student ID"]}</p>
                                </div>
                                <div className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold text-right max-w-[200px] truncate">{r.reason}</div>
                              </label>
                            )
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {activePreviewTab === 'invalid' && (
                    <div>
                      <div className="mb-4 bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-xs flex gap-2 items-start">
                        <XCircle size={16} className="mt-0.5 shrink-0" />
                        <p>These records cannot be uploaded due to missing data or invalid references. Please fix them in your spreadsheet and re-upload.</p>
                      </div>
                      <div className="space-y-3">
                        {previewModal.invalidRecords.length === 0 ? (
                          <div className="text-center py-8 text-slate-500">No invalid records found.</div>
                        ) : (
                          previewModal.invalidRecords.map(r => (
                            <div key={r.id} className="bg-white border border-red-100 p-3 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-2 shadow-sm">
                              <div>
                                <p className="font-bold text-slate-800 text-sm">{r["Name"] || "Unknown"}</p>
                                <p className="text-xs text-slate-500">Row ID: {r.id}</p>
                              </div>
                              <div className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold text-right">{r.reason}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                  <div className="text-sm font-semibold text-slate-600">
                    Will upload: <span className="text-brand-600 font-bold">{previewModal.validRecords.length + previewModal.selectedDuplicates.length}</span> records
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setPreviewModal(prev => ({ ...prev, isOpen: false, isLoading: false }))} className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">Cancel</button>
                    <button onClick={handleCommitUpload} className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-lg shadow-brand-600/20 transition-all">Confirm & Upload</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Students;