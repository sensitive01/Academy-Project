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
  UserCheck
} from "lucide-react";
import CustomDataTable from "../../components/DataTable";
import api from "../../services/api";
import Loading from "../../components/Loading";
import ConfirmationModal from "../../components/modals/ConfirmationModal";
import ReactDOM from "react-dom";
import toast from "react-hot-toast";

const StudentList = ({ students, loading, onEdit, onToggleStatus, onDelete, onView, onPromote, search, setSearch }) => {
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
      name: "Contact info", 
      cell: row => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2 text-[11px] text-slate-600 font-medium truncate max-w-[150px]">
            <Mail size={12} className="text-slate-400 shrink-0"/> {row.user?.email || row.email}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-600 font-medium">
            <Phone size={12} className="text-slate-400 shrink-0"/> {row.whatsapp || row.phone || "N/A"}
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
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
          row.status === "active" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
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
      cell: row => (
        <div className="relative">
          <button
            onClick={(e) => toggleMenu(row._id, e)}
            className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors border border-transparent hover:border-brand-200 ml-auto block"
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
                  <button onClick={() => { onView(row); setOpenMenuId(null); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                    <Eye size={16} className="text-blue-500" /> View Full Profile
                  </button>
                  <button onClick={() => { onEdit(row); setOpenMenuId(null); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                    <Edit2 size={16} className="text-amber-500" /> Edit Details
                  </button>
                  <button onClick={() => { onPromote(row); setOpenMenuId(null); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                    <Briefcase size={16} className="text-indigo-600" /> 
                    {row.internships && row.internships.length > 0 ? "Edit Intern Details" : "Promote to Intern"}
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
      ), 
      width: "100px"
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
        exportButton={
          <div className="flex gap-2 shrink-0">
             <button className="flex items-center gap-2 px-4 py-2 text-xs font-black text-slate-600 uppercase tracking-widest bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all">
               <Filter size={14} /> Filter
             </button>
          </div>
        }
      />
    </div>
  );
};

const Students = () => {
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, id: null });
  const [promoteConfig, setPromoteConfig] = useState({ isOpen: false, student: null });
  const [vendors, setVendors] = useState([]);
  const [promoteForm, setPromoteForm] = useState({
    vendorId: "",
    location: "",
    startDate: "",
    endDate: "",
    paymentBy: "",
    salary: ""
  });

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editStudent, setEditStudent] = useState(null);
  const [centers, setCenters] = useState([]);

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

  useEffect(() => {
    fetchCenters();
    fetchVendors();
    fetchStudents();
  }, []);

  useEffect(() => {
    const result = students.filter(
      (s) =>
        s.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
        s.studentId?.toLowerCase().includes(search.toLowerCase()) ||
        s.phone?.toLowerCase().includes(search.toLowerCase()) ||
        s.whatsapp?.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
  }, [search, students]);

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

  const handleUpdate = async () => {
    try {
      const payload = { ...editStudent };
      if (payload.center && typeof payload.center === "object") payload.center = payload.center._id;
      const { data } = await api.put(`/students/${editStudent._id}`, payload);
      setStudents((prev) => prev.map((s) => (s._id === editStudent._id ? data.student : s)));
      setEditStudent(null);
      toast.success("Student updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    }
  };

  const exportToExcel = () => {
    const data = students.map((s, i) => ({
      "S.No": i + 1,
      "Student ID": s.studentId || "-",
      Name: s.user?.name,
      Email: s.user?.email,
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
  };

  return (
    <div className="p-4 sm:p-6 space-y-8 animate-in fade-in duration-500 max-w-full overflow-hidden">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative z-10">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Student Directory</h1>
          <p className="text-slate-500 text-sm font-medium">Manage student profiles, enrollments, and internship status.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={exportToExcel}
            className="flex items-center gap-2 px-5 py-2.5 font-bold text-brand-700 bg-brand-50 rounded-2xl hover:bg-brand-100 transition-all active:scale-95"
          >
            Export XL
          </button>
          <button 
            onClick={() => window.open("/student-registration", "_blank")}
            className="flex items-center gap-2 px-6 py-2.5 font-bold text-white bg-brand-600 rounded-2xl shadow-lg shadow-brand-600/20 hover:bg-brand-700 transition-all active:scale-95"
          >
            <UserPlus size={18} /> Add Student
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Students", value: students.length, icon: Users, color: "blue" },
          { label: "Active Records", value: students.filter(s => s.status === "active").length, icon: CheckCircle, color: "emerald" },
          { label: "Interns", value: students.filter(s => s.internships?.length > 0).length, icon: Briefcase, color: "amber" },
          { label: "Departments", value: [...new Set(students.map(s => s.department))].length, icon: GraduationCap, color: "indigo" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-brand-200 transition-all">
            <div className="min-w-0">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none truncate">{stat.label}</p>
              <p className="text-3xl font-black text-slate-900 mt-2">{stat.value}</p>
            </div>
            <div className={`p-4 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 group-hover:rotate-12 transition-all shrink-0`}>
              <stat.icon size={26} strokeWidth={2.5}/>
            </div>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <StudentList 
          students={filtered}
          loading={loading}
          onEdit={(s) => {
             const clone = JSON.parse(JSON.stringify(s));
             setEditStudent({...clone, email: s.user?.email || s.email || ""});
          }}
          onDelete={handleDelete}
          onToggleStatus={handleToggleStatus}
          onView={(s) => setSelectedStudent(s)}
          onPromote={(row) => {
            if (row.internships && row.internships.length > 0) {
              const latest = row.internships[row.internships.length - 1];
              setPromoteForm({
                vendorId: latest.vendor?._id || latest.vendor || "",
                location: latest.location || "",
                startDate: latest.startDate ? latest.startDate.split('T')[0] : "",
                endDate: latest.endDate ? latest.endDate.split('T')[0] : "",
                paymentBy: latest.paymentBy || "",
                salary: latest.salary || ""
              });
            } else {
              setPromoteForm({ vendorId: "", location: "", startDate: "", endDate: "", paymentBy: "", salary: "" });
            }
            setPromoteConfig({ isOpen: true, student: row });
          }}
          search={search}
          setSearch={setSearch}
        />
      </div>

      {/* PROMOTE INTERN MODAL (PORTAL) */}
      {promoteConfig.isOpen && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setPromoteConfig({ isOpen: false, student: null })}></div>
          <div className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl relative z-10 animate-in zoom-in duration-300">
            <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Internship Portal</h2>
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
                    <select required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-brand-500 outline-none transition-all" value={promoteForm.vendorId} onChange={(e) => setPromoteForm({...promoteForm, vendorId: e.target.value})}>
                        <option value="">-- Choose Vendor --</option>
                        {vendors.map(v => <option key={v._id} value={v._id}>{v.companyName}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Location</label>
                    <input type="text" placeholder="City / Branch" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-brand-500 outline-none transition-all" value={promoteForm.location} onChange={(e) => setPromoteForm({...promoteForm, location: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Start Date</label>
                        <input type="date" required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-brand-500 outline-none transition-all" value={promoteForm.startDate} onChange={(e) => setPromoteForm({...promoteForm, startDate: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">End Date</label>
                        <input type="date" required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-brand-500 outline-none transition-all" value={promoteForm.endDate} onChange={(e) => setPromoteForm({...promoteForm, endDate: e.target.value})} />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Salary</label>
                      <input type="number" required placeholder="00.00" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-brand-500 outline-none transition-all" value={promoteForm.salary} onChange={(e) => setPromoteForm({...promoteForm, salary: e.target.value})} />
                  </div>
                  <div>
                      <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Payout Method</label>
                      <select required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-brand-500 outline-none transition-all" value={promoteForm.paymentBy} onChange={(e) => setPromoteForm({...promoteForm, paymentBy: e.target.value})}>
                          <option value="">Select</option>
                          <option value="Vendor Payment">Vendor Payment</option>
                          <option value="Academy Stipend">Academy Stipend</option>
                      </select>
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

      {/* FULL VIEW MODAL (PORTAL) */}
      {selectedStudent && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[10000] flex justify-center items-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setSelectedStudent(null)}></div>
          <div className="bg-white rounded-[2.5rem] w-full max-w-6xl max-h-[92vh] overflow-hidden relative z-10 shadow-2xl animate-in slide-in-from-bottom-5 duration-500 flex flex-col" onClick={(e)=>e.stopPropagation()}>
            <div className="sticky top-0 bg-white/80 backdrop-blur-xl z-20 border-b border-slate-100 px-10 py-6 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Academic Member Profile</h2>
                <p className="text-sm font-bold text-brand-600 mt-1 uppercase tracking-widest">{selectedStudent.studentId}</p>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-400 transition-all">✕</button>
            </div>

            <div className="p-8 md:p-10 overflow-y-auto space-y-12 pb-20 scrollbar-hide">
              <section>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                  <UserCheck size={16} className="text-brand-600" /> 1. Primary Identity
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6 text-sm">
                  {[
                    { l: "Full Name (EN)", v: selectedStudent.studentNameEnglish },
                    { l: "Name (Local)", v: selectedStudent.studentNameMotherTongue },
                    { l: "Date of Birth", v: selectedStudent.dob ? new Date(selectedStudent.dob).toLocaleDateString() : "-" },
                    { l: "Gender", v: selectedStudent.gender },
                    { l: "Aadhar No", v: selectedStudent.aadharNo },
                    { l: "Father Name", v: selectedStudent.fatherName },
                    { l: "Nationality", v: selectedStudent.nationality },
                    { l: "Age", v: selectedStudent.age },
                    { l: "Religion", v: selectedStudent.religion },
                    { l: "Community", v: selectedStudent.community },
                    { l: "Official Email", v: selectedStudent.user?.email || selectedStudent.email },
                    { l: "Contact No", v: selectedStudent.whatsapp || selectedStudent.phone },
                    { l: "Center", v: selectedStudent.center?.name || "N/A" },
                    { l: "Fluency", v: selectedStudent.englishFluency },
                    { l: "APAAR ID", v: selectedStudent.apaarId },
                    { l: "DEB ID", v: selectedStudent.debId },
                  ].map((item, i) => (
                    <div key={i} className="min-w-0">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5 truncate">{item.l}</p>
                      <p className="font-bold text-slate-800 break-words">{item.v || "-"}</p>
                    </div>
                  ))}
                </div>
              </section>

              <div className="grid lg:grid-cols-2 gap-8">
                <section className="bg-slate-50 p-6 md:p-8 rounded-[2rem] border border-slate-100">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                    <MapPin size={16} className="text-brand-600" /> 2. Residential Data
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div><p className="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-1">Village/Street</p><p className="font-bold text-slate-800 text-sm">{selectedStudent.address?.village || "-"}</p></div>
                    <div><p className="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-1">Post Office</p><p className="font-bold text-slate-800 text-sm">{selectedStudent.address?.post || "-"}</p></div>
                    <div><p className="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-1">Taluk</p><p className="font-bold text-slate-800 text-sm">{selectedStudent.address?.taluk || "-"}</p></div>
                    <div><p className="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-1">District</p><p className="font-bold text-slate-800 text-sm">{selectedStudent.address?.district || "-"}</p></div>
                    <div><p className="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-1">Postal Code</p><p className="font-bold text-slate-800 text-sm">{selectedStudent.address?.pin || "-"}</p></div>
                  </div>
                </section>

                <section className="bg-slate-900 p-6 md:p-8 rounded-[2rem] text-white">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                    <CheckCircle size={16} className="text-emerald-400" /> 3. Financial Metadata
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div><p className="text-[9px] uppercase font-black text-slate-500 tracking-widest mb-1 text-slate-500">Account Holder</p><p className="font-bold text-white text-sm truncate">{selectedStudent.bankDetails?.accountHolderName || "N/A"}</p></div>
                    <div><p className="text-[9px] uppercase font-black text-slate-500 tracking-widest mb-1 text-slate-500">Account Number</p><p className="font-bold text-emerald-400 text-sm tracking-widest">{selectedStudent.bankDetails?.accountNumber || "N/A"}</p></div>
                    <div><p className="text-[9px] uppercase font-black text-slate-500 tracking-widest mb-1 text-slate-500">IFSC Routing</p><p className="font-bold text-white text-sm uppercase">{selectedStudent.bankDetails?.ifscCode || "N/A"}</p></div>
                    <div><p className="text-[9px] uppercase font-black text-slate-500 tracking-widest mb-1 text-slate-500">Bank & Branch</p><p className="font-bold text-white text-sm truncate">{selectedStudent.bankDetails?.bankNameBranch || "N/A"}</p></div>
                  </div>
                </section>
              </div>
 
              <section>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                  <BookOpen size={16} className="text-brand-600" /> 4. Academic History
                </h3>
                <div className="overflow-x-auto border border-slate-100 rounded-3xl bg-white scrollbar-hide">
                  <table className="w-full text-left text-sm min-w-[500px]">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-4 font-black text-slate-400 uppercase text-[9px] tracking-widest">Examination</th>
                        <th className="px-6 py-4 font-black text-slate-400 uppercase text-[9px] tracking-widest">Institute</th>
                        <th className="px-6 py-4 font-black text-slate-400 uppercase text-[9px] tracking-widest">Year</th>
                        <th className="px-6 py-4 font-black text-slate-400 uppercase text-[9px] tracking-widest text-right">Score %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedStudent.educationBackground?.length > 0 ? (
                        selectedStudent.educationBackground.map((edu, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-700">{edu.examinationPassed}</td>
                            <td className="px-6 py-4 text-slate-500 font-medium">{edu.instituteName}</td>
                            <td className="px-6 py-4 text-slate-500 font-medium">{edu.yearOfPassing}</td>
                            <td className="px-6 py-4 font-black text-brand-600 text-right">{edu.marksPercentage}%</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400 font-bold italic">No academic history records found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <div className="grid lg:grid-cols-2 gap-8 pb-10">
                <section>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                    <Heart size={16} className="text-rose-500" /> 5. Family & Kin
                  </h3>
                  <div className="space-y-3">
                    {selectedStudent.familyBackground?.map((mem, i) => (
                      <div key={i} className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                        <div className="min-w-0">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{mem.relationship}</p>
                          <p className="font-bold text-slate-800 truncate">{mem.name}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mobile</p>
                          <p className="font-bold text-slate-600">{mem.phone}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
                <section>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                    <UserPlus size={16} className="text-indigo-500" /> 6. Key References
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {selectedStudent.references?.map((ref, i) => (
                      <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm border-dashed">
                        <p className="font-bold text-slate-800">{ref.name}</p>
                        <p className="font-bold text-brand-600">{ref.mobile}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* EDIT MODAL (PORTAL) */}
      {editStudent && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[10000] flex justify-center items-center p-4">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setEditStudent(null)}></div>
          <div className="bg-white rounded-[2.5rem] w-full max-w-5xl max-h-[92vh] flex flex-col relative z-10 shadow-2xl animate-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="p-8 md:p-10 border-b border-slate-50 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Synchronize Core Records</h2>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-[0.2em]">Member Identity Portal</p>
              </div>
              <button onClick={() => setEditStudent(null)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-400 transition-all">✕</button>
            </div>

            <div className="p-8 md:p-10 overflow-y-auto space-y-10 scrollbar-hide">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                  { l: "Full Name (EN)", f: "studentNameEnglish" },
                  { l: "Father Name", f: "fatherName" },
                  { l: "Date of Birth", f: "dob", t: "date" },
                  { l: "Official Gender", f: "gender" },
                  { l: "Nationality", f: "nationality" },
                  { l: "Aadhar Identity", f: "aadharNo" },
                  { l: "WhatsApp Contact", f: "whatsapp" },
                  { l: "Recovery Email", f: "email" },
                  { l: "Religious Beliefs", f: "religion" },
                  { l: "Community Data", f: "community" },
                  { l: "KCET Serial No", f: "kcetRegNo" },
                ].map((item, i) => (
                  <div key={i}>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1.5">{item.l}</label>
                    <input 
                      type={item.t || "text"}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-brand-500 outline-none transition-all placeholder:text-slate-300" 
                      value={item.t === 'date' ? (editStudent[item.f]?.split("T")[0] || "") : (editStudent[item.f] || "")} 
                      onChange={(e) => setEditStudent({...editStudent, [item.f]: e.target.value})}
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1.5">Academic Center</label>
                  <select 
                     className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-brand-500 outline-none transition-all cursor-pointer"
                     value={editStudent.center?._id || editStudent.center || ""}
                     onChange={(e) => setEditStudent({...editStudent, center: e.target.value})}
                   >
                     <option value="">Select Center</option>
                     {centers.map(c => <option key={c._id} value={c._id}>{c.name} - {c.location}</option>)}
                   </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-8 border-t border-slate-50 pb-4">
                <button onClick={() => setEditStudent(null)} className="px-8 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all active:scale-95">Discard</button>
                <button onClick={handleUpdate} className="px-12 py-3.5 bg-brand-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-brand-600/20 hover:bg-brand-700 transition-all active:scale-95">Verify & Sync</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Students;