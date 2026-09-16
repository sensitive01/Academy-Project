import React, { useState, useEffect } from "react";
import { 
  FileText, Users, GraduationCap, Building2, Calendar, LayoutDashboard,
  Search, Plus, Mail, CheckCircle, Clock
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import CustomDataTable from "../../components/common/DataTable";
import Loading from "../../components/common/Loading";
import toast from "react-hot-toast";

const AdmissionManagement = () => {
  const [activeTab, setActiveTab] = useState("admission_form");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (activeTab === "admission_form") {
      fetchStudents();
    }
  }, [activeTab]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get("/students");
      // Filter for center students or all students, depending on requirement
      const allStudents = (res.data.students || []).filter(s => !!s.center);
      setStudents(allStudents);
    } catch (err) {
      toast.error("Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      (s.user?.name || "").toLowerCase().includes(term) ||
      (s.studentId || "").toLowerCase().includes(term) ||
      (s.user?.email || "").toLowerCase().includes(term)
    );
  });

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
        <div className="flex items-center gap-3 py-2 min-w-0">
          <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-700 font-bold shrink-0">
            {row.user?.name?.charAt(0) || "S"}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-slate-900 truncate">{row.user?.name}</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter truncate">{row.studentId || "NO-ID"}</div>
          </div>
        </div>
      ),
      width: "250px"
    },
    {
      name: "DOB",
      selector: row => row.dob,
      cell: row => (
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 whitespace-nowrap">
          <Calendar size={13} className="text-slate-400" />
          <span>{row.dob ? new Date(row.dob).toLocaleDateString('en-GB') : "N/A"}</span>
        </div>
      ),
      width: "120px"
    },
    {
      name: "Contact Info",
      cell: row => (
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 truncate">
            <Mail size={12} className="shrink-0 text-slate-400" />
            <span className="truncate">{row.user?.email || "N/A"}</span>
          </div>
        </div>
      ),
      width: "200px"
    },
    {
      name: "Status",
      selector: row => row.status,
      cell: row => (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
          row.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
        }`}>
          {row.status === 'active' ? <CheckCircle size={10} /> : <Clock size={10} />}
          {row.status}
        </span>
      ),
      width: "120px"
    },
    {
      name: "Center",
      cell: row => (
        <div className="text-[11px] font-bold text-slate-600 truncate">
          {row.center?.name || row.center || "-"}
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        
        {/* Header */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                Admission Management
              </h1>
              <p className="text-slate-500 mt-2 text-sm font-medium leading-relaxed">
                Manage student admissions, review forms, and process scholarship applications.
              </p>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-200 gap-8">
          <button
            onClick={() => setActiveTab("scholarship_form")}
            className={`pb-4 px-2 text-sm font-medium transition-colors relative whitespace-nowrap flex items-center gap-2 group ${
              activeTab === "scholarship_form"
                ? "text-brand-600"
                : "text-gray-500 hover:text-brand-600"
            }`}
          >
            <FileText size={20} />
            Scholarship Form
            <div className={`absolute bottom-0 left-0 w-full h-0.5 rounded-t-full transition-colors ${
              activeTab === "scholarship_form" ? "bg-brand-600" : "bg-transparent group-hover:bg-brand-600"
            }`} />
          </button>
          <button
            onClick={() => setActiveTab("admission_form")}
            className={`pb-4 px-2 text-sm font-medium transition-colors relative whitespace-nowrap flex items-center gap-2 group ${
              activeTab === "admission_form"
                ? "text-brand-600"
                : "text-gray-500 hover:text-brand-600"
            }`}
          >
            <Users size={20} />
            Admission Form
            <div className={`absolute bottom-0 left-0 w-full h-0.5 rounded-t-full transition-colors ${
              activeTab === "admission_form" ? "bg-brand-600" : "bg-transparent group-hover:bg-brand-600"
            }`} />
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "scholarship_form" && (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm text-center animate-fade-in-up flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mb-6">
              <FileText size={40} className="text-brand-300" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Scholarship Forms Coming Soon</h2>
            <p className="text-slate-500 max-w-md mx-auto text-sm">
              The scholarship application tracking and forms management module is currently under development. Please check back later.
            </p>
          </div>
        )}

        {activeTab === "admission_form" && (
          <div className="animate-fade-in-up space-y-6">
            
            {/* Table */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-visible">
              <CustomDataTable
                columns={columns}
                data={filteredStudents}
                progressPending={loading}
                progressComponent={
                  <div className="p-12"><Loading /></div>
                }
                search={search}
                setSearch={setSearch}
                searchPlaceholder="Search by ID, name, email..."
                additionalHeaderContent={
                  <button 
                    onClick={() => navigate('/student-registration')}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-sm active:scale-95 w-full sm:w-auto"
                  >
                    <Plus size={18} />
                    Add Student
                  </button>
                }
                pagination
                responsive
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdmissionManagement;
