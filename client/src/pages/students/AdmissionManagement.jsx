import React, { useState, useEffect } from "react";
import {
  FileText, Users, GraduationCap, Building2, Calendar, LayoutDashboard,
  Search, Plus, Mail, CheckCircle, Clock, IndianRupee, Trash2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import CustomDataTable from "../../components/common/DataTable";
import Loading from "../../components/common/Loading";
import toast from "react-hot-toast";
import FeeDefinitionModal from "../../components/modals/FeeDefinitionModal";
import ViewListModal from "../../components/modals/ViewListModal";
import ViewFeesModal from "../../components/modals/ViewFeesModal";
import CollectFeeModal from "../../components/modals/CollectFeeModal";
import ConfirmationModal from "../../components/modals/ConfirmationModal";
import StudentFilterBar from "../../components/common/StudentFilterBar";
import DocumentUploadModal from "../../components/modals/DocumentUploadModal";
import CenterStudentApprovalModal from "../../components/modals/CenterStudentApprovalModal";
import StudentProfilePage from "./StudentProfilePage";

const AdmissionManagement = () => {
  const [activeTab, setActiveTab] = useState("admission_form");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentMode, setStudentMode] = useState("view");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [batches, setBatches] = useState([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchSearch, setBatchSearch] = useState("");

  // Modals state
  const [viewListModalData, setViewListModalData] = useState(null);
  const [selectedBatchForFee, setSelectedBatchForFee] = useState(null);
  const [selectedBatchForViewingFees, setSelectedBatchForViewingFees] = useState(null);
  const [feeModalData, setFeeModalData] = useState(null);
  const [documentModalData, setDocumentModalData] = useState(null);
  const [approvalModalData, setApprovalModalData] = useState(null);

  const [confirmModalConfig, setConfirmModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    onConfirm: () => { }
  });

  const navigate = useNavigate();

  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  
  // Bulk selection state
  const [selectedScholarshipRows, setSelectedScholarshipRows] = useState([]);
  const [selectedAdmissionRows, setSelectedAdmissionRows] = useState([]);
  const [selectedApprovalRows, setSelectedApprovalRows] = useState([]);
  const [bulkApprovalModalData, setBulkApprovalModalData] = useState(null);

  const handleBulkUpdatePhase = (selectedRows, newPhase, confirmMessage, clearSelection) => {
    if (selectedRows.length === 0) return;
    
    setConfirmModalConfig({
      isOpen: true,
      title: "Bulk Update Phase",
      message: confirmMessage,
      type: "info",
      onConfirm: async () => {
        try {
          const ids = selectedRows.map(row => row._id);
          await api.patch('/students/bulk/admission-phase', { ids, phase: newPhase });
          toast.success(`${ids.length} students updated successfully!`);
          fetchStudents();
          if (clearSelection) clearSelection();
        } catch (err) {
          console.error(err);
          toast.error("Failed to bulk update students");
        }
      }
    });
  };

  useEffect(() => {
    if (activeTab === "admission_form" || activeTab === "scholarship_form") {
      fetchStudents();
    } else if (activeTab === "payment_data" || activeTab === "approvals") {
      fetchPayments();
    }
  }, [activeTab]);

  const getSessionValue = (key, defaultVal) => {
    const val = sessionStorage.getItem(key);
    if (!val) return defaultVal;
    try { return JSON.parse(val); } catch (e) { return val; }
  };

  const [filterCenter, setFilterCenter] = useState(() => getSessionValue("admission_filterCenter", []));
  const [filterCourse, setFilterCourse] = useState(() => getSessionValue("admission_filterCourse", []));
  const [filterBatch, setFilterBatch] = useState(() => getSessionValue("admission_filterBatch", []));
  const [filterType, setFilterType] = useState(() => getSessionValue("admission_filterType", []));

  const [centers, setCenters] = useState([]);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    sessionStorage.setItem("admission_filterCenter", JSON.stringify(filterCenter));
    sessionStorage.setItem("admission_filterCourse", JSON.stringify(filterCourse));
    sessionStorage.setItem("admission_filterBatch", JSON.stringify(filterBatch));
    sessionStorage.setItem("admission_filterType", JSON.stringify(filterType));
  }, [filterCenter, filterCourse, filterBatch, filterType]);

  useEffect(() => {
    fetchCenters();
    fetchCourses();
    fetchBatches();
  }, []);

  const fetchCenters = async () => {
    try {
      const { data } = await api.get("/centers");
      setCenters(data || []);
    } catch { /* Fail silently */ }
  };

  const fetchCourses = async () => {
    try {
      const { data } = await api.get("/courses");
      const allCourses = data.courses || data || [];
      setCourses(allCourses.filter(c => c.type === 'Center Courses'));
    } catch { /* Fail silently */ }
  };

  const fetchPayments = async () => {
    try {
      setPaymentsLoading(true);
      const res = await api.get('/students/admission-payments/all');
      setPayments(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch payments");
    } finally {
      setPaymentsLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get("/students");
      // Filter for center students or all students, depending on requirement
      const allStudents = (res.data.students || []).filter(s => !!s.center);
      setStudents(allStudents);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      setBatchLoading(true);
      const res = await api.get("/batches");
      setBatches(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch batches");
    } finally {
      setBatchLoading(false);
    }
  };

  const filteredStudents = students.filter(s => {
    if (filterCenter && filterCenter.length > 0) {
      if (!filterCenter.includes(s.center) && !filterCenter.includes(s.center?._id)) return false;
    }
    if (filterCourse && filterCourse.length > 0) {
      if (!s.enrolledCourses?.some(ec => filterCourse.includes(ec.course?._id) || filterCourse.includes(ec.course))) return false;
    }
    if (filterBatch && filterBatch.length > 0) {
      const selectedBatches = batches.filter(b => filterBatch.includes(b.name || b.batchId || b._id));
      if (selectedBatches.length > 0) {
        const batchIds = selectedBatches.map(b => b._id.toString());
        const inBatchState = selectedBatches.some(b => b.students?.some(bs => bs === s._id || bs?._id === s._id));
        const inStudentState = s.enrolledCourses?.some(ec => {
          const ecBatchId = typeof ec.batch === 'object' ? ec.batch?._id : ec.batch;
          return ecBatchId && batchIds.includes(ecBatchId.toString());
        });
        if (!inBatchState && !inStudentState) return false;
      } else {
        return false;
      }
    }
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      (s.user?.name || "").toLowerCase().includes(term) ||
      (s.studentId || "").toLowerCase().includes(term) ||
      (s.user?.email || "").toLowerCase().includes(term)
    );
  });

  const scholarshipStudents = filteredStudents.filter(s => s.studentId?.startsWith('APP-') && ['scholarship', 'admission', 'approval_pending', 'admitted', 'joined'].includes(s.admissionPhase));
  const admissionStudents = filteredStudents.filter(s => s.studentId?.startsWith('APP-') && ['admission', 'approval_pending', 'admitted', 'joined'].includes(s.admissionPhase));
  const studentApprovalStudents = filteredStudents.filter(s => s.studentId?.startsWith('APP-') && ['approval_pending'].includes(s.admissionPhase));

  const handleUpdatePhase = (studentId, newPhase, confirmMessage) => {
    setConfirmModalConfig({
      isOpen: true,
      title: "Update Phase",
      message: confirmMessage,
      type: "info",
      onConfirm: async () => {
        try {
          await api.patch(`/students/${studentId}/admission-phase`, { phase: newPhase });
          toast.success("Student updated successfully!");
          fetchStudents();
        } catch (err) {
          console.error(err);
          toast.error("Failed to update student phase");
        }
      }
    });
  };

  const handleDeleteStudent = (studentId, studentName) => {
    setConfirmModalConfig({
      isOpen: true,
      title: "Delete Student",
      message: `Are you sure you want to permanently delete "${studentName}"? This will also delete all their payment records. This action cannot be undone.`,
      type: "danger",
      onConfirm: async () => {
        try {
          await api.delete(`/students/${studentId}`);
          toast.success("Student and all payment records deleted successfully!");
          fetchStudents();
        } catch (err) {
          console.error(err);
          toast.error("Failed to delete student");
        }
      }
    });
  };

  const filteredBatches = batches.filter(b => {
    if (!batchSearch) return true;
    const term = batchSearch.toLowerCase();
    return (
      (b.name || "").toLowerCase().includes(term) ||
      (b.batchId || "").toLowerCase().includes(term)
    );
  });

  const filteredPayments = payments.filter(p => {
    const s = p.student;
    if (filterType && filterType.length > 0) {
      if (!filterType.includes(p.feeType)) return false;
    }
    if (filterCenter && filterCenter.length > 0) {
      if (!filterCenter.includes(s?.center) && !filterCenter.includes(s?.center?._id) && !filterCenter.includes(p.centerName)) return false;
    }
    if (filterCourse && filterCourse.length > 0) {
      if (!s?.enrolledCourses?.some(ec => filterCourse.includes(ec.course?._id) || filterCourse.includes(ec.course))) return false;
    }
    if (filterBatch && filterBatch.length > 0) {
      const selectedBatches = batches.filter(b => filterBatch.includes(b.name || b.batchId || b._id));
      if (selectedBatches.length > 0) {
        const batchIds = selectedBatches.map(b => b._id.toString());
        const inBatchState = selectedBatches.some(b => b.students?.some(bs => bs === s?._id || bs?._id === s?._id));
        const inStudentState = s?.enrolledCourses?.some(ec => {
          const ecBatchId = typeof ec.batch === 'object' ? ec.batch?._id : ec.batch;
          return ecBatchId && batchIds.includes(ecBatchId.toString());
        });
        if (!inBatchState && !inStudentState) return false;
      } else {
        return false;
      }
    }
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      (p.studentName || "").toLowerCase().includes(term) ||
      (p.studentId || "").toLowerCase().includes(term) ||
      (p.bankReference || "").toLowerCase().includes(term)
    );
  });

  const baseColumns = [
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
        <button
          onClick={() => {
            setSelectedStudent(row);
            setStudentMode("edit");
          }}
          className="flex items-center gap-3 py-2 min-w-0 group hover:bg-slate-50 p-2 rounded-lg transition-colors w-full text-left cursor-pointer"
          title="Click to edit student profile"
        >
          <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-700 font-bold shrink-0 group-hover:bg-brand-100 transition-colors">
            {row.user?.name?.charAt(0) || "S"}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-slate-900 truncate group-hover:text-brand-600 transition-colors">{row.user?.name}</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter truncate">{row.studentId || "NO-ID"}</div>
          </div>
        </button>
      ),
      width: "250px"
    },
    {
      name: "Contact Info",
      selector: row => row.user?.email || "N/A",
      sortable: true,
      cell: row => (
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 truncate">
            <Mail size={12} className="shrink-0 text-slate-400" />
            <span className="truncate">{row.user?.email || "N/A"}</span>
          </div>
        </div>
      ),
      width: "250px"
    },
    {
      name: "Academic Info",
      selector: row => `${row.center?.name || "-"} ${row.enrolledCourses?.[0]?.course?.title || "-"} ${row.enrolledCourses?.[0]?.batch?.name || "-"}`,
      sortable: true,
      cell: row => {
        const center = row.center?.name || "-";
        const enrolled = row.enrolledCourses?.[0] || {};
        const course = enrolled.course?.title || "-";
        const batch = enrolled.batch?.name || "-";
        return (
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-[11px] font-bold text-slate-700 truncate">{center}</span>
            <span className="text-[10px] font-medium text-slate-500 truncate">{course}</span>
            <span className="text-[10px] text-brand-600 font-bold truncate">{batch}</span>
          </div>
        ); 
      },
      width: "300"
    },
    {
      name: "Fee Details",
      selector: row => {
        const feeSummary = activeTab === "scholarship_form" ? row.scholarshipFeeSummary : row.admissionFeeSummary;
        return feeSummary?.total || 0;
      },
      sortable: true,
      cell: row => {
        const feeSummary = activeTab === "scholarship_form" ? row.scholarshipFeeSummary : row.admissionFeeSummary;
        const total = feeSummary?.total || 0;
        const paid = feeSummary?.paid || 0;
        const balance = feeSummary?.balance || 0;

        const openFeeModal = () => {
          const fType = activeTab === "scholarship_form" ? "Scholarship" : "Admission";
          setFeeModalData({ student: row, feeType: fType });
        };

        if (total === 0 && paid === 0) {
          return (
            <button
              onClick={openFeeModal}
              className="text-[11px] font-bold text-slate-400 hover:text-brand-600 hover:underline text-left w-full"
            >
              N/A (No fees available)
            </button>
          );
        }

        return (
          <button
            onClick={openFeeModal}
            className="flex flex-col gap-1 text-[11px] min-w-0 text-left hover:bg-slate-50 p-1.5 rounded w-full transition-colors group"
          >
            <span className="font-medium text-slate-600 group-hover:text-brand-700">Total: ₹{total}</span>
            <span className="font-medium text-emerald-600">Paid: ₹{paid}</span>
            <span className="font-bold text-rose-600">Bal: ₹{balance}</span>
          </button>
        );
      },
      width: "150px"
    },
    {
      name: "Status",
      selector: row => row.admissionPhase,
      sortable: true,
      cell: row => {
        let isAdmitted = false;
        
        if (activeTab === "scholarship_form") {
          // In scholarship form, toggle ON means they are admitted to the next phase
          isAdmitted = ['admission', 'approval_pending', 'admitted', 'joined'].includes(row.admissionPhase);
        } else {
          // In admission form, they are admitted only after approval
          isAdmitted = ['admitted', 'joined'].includes(row.admissionPhase);
        }

        return (
          <span className={`px-2 py-1 text-[10px] font-bold rounded-md ${isAdmitted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
            {isAdmitted ? "Admitted" : "Pending"}
          </span>
        );
      },
      width: "100px"
    }
  ];

  const scholarshipColumns = [
    ...baseColumns,
    {
      name: "Action",
      cell: row => {
        const isMoved = ['admission', 'approval_pending', 'admitted', 'joined'].includes(row.admissionPhase);
        return (
          <div className="flex items-center gap-2">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isMoved}
                onChange={() => {
                  if (!isMoved) {
                    handleUpdatePhase(row._id, 'admission', 'Move this student to the Admission Form?');
                  } else {
                    handleUpdatePhase(row._id, 'scholarship', 'Revert this student back to the Scholarship phase?');
                  }
                }}
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
            </label>
            <button
              onClick={() => handleDeleteStudent(row._id, row.user?.name)}
              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
              title="Delete Student"
            >
              <Trash2 size={15} />
            </button>
          </div>
        );
      },
      width: "130px"
    }
  ];

  const admissionColumns = [
    ...baseColumns,
    {
      name: "Documents",
      cell: row => (
        <button
          onClick={() => setDocumentModalData(row)}
          className="text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors"
        >
          View/Upload
        </button>
      ),
      width: "140px"
    },
    {
      name: "Action",
      cell: row => {
        const isMoved = ['approval_pending', 'admitted', 'joined'].includes(row.admissionPhase);
        return (
          <div className="flex items-center gap-2">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isMoved}
                onChange={() => {
                  if (!isMoved) {
                    handleUpdatePhase(row._id, 'approval_pending', 'Send this student to the Approvals Section?');
                  } else {
                    handleUpdatePhase(row._id, 'admission', 'Revert this student back from Approvals?');
                  }
                }}
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500 peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
            </label>
            <button
              onClick={() => handleDeleteStudent(row._id, row.user?.name)}
              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
              title="Delete Student"
            >
              <Trash2 size={15} />
            </button>
          </div>
        );
      },
      width: "130px"
    }
  ];

  const studentApprovalColumns = [
    ...baseColumns.filter(c => c.name !== 'Fee Details'),
    {
      name: "Scholarship Fee",
      cell: row => {
        const schFee = row.scholarshipFeeSummary || { total: 0, paid: 0, balance: 0 };
        return (
          <button
            onClick={() => setFeeModalData({ student: row, feeType: 'Scholarship', readOnly: true })}
            className="flex flex-col gap-0.5 text-[10px] min-w-0 text-left hover:bg-slate-50 p-1.5 rounded transition-colors group border border-slate-100 w-full"
          >
            <span className="font-bold text-slate-700 group-hover:text-brand-700">Total: ₹{schFee.total}</span>
            <span className="text-slate-500">Paid: ₹{schFee.paid}</span>
          </button>
        );
      },
      width: "150px"
    },
    {
      name: "Admission Fee",
      cell: row => {
        const admFee = row.admissionFeeSummary || { total: 0, paid: 0, balance: 0 };
        return (
          <button
            onClick={() => setFeeModalData({ student: row, feeType: 'Admission', readOnly: true })}
            className="flex flex-col gap-0.5 text-[10px] min-w-0 text-left hover:bg-slate-50 p-1.5 rounded transition-colors group border border-slate-100 w-full"
          >
            <span className="font-bold text-slate-700 group-hover:text-brand-700">Total: ₹{admFee.total}</span>
            <span className="text-slate-500">Paid: ₹{admFee.paid}</span>
          </button>
        );
      },
      width: "150px"
    },
    {
      name: "Documents",
      cell: row => (
        <button
          onClick={() => setDocumentModalData(row)}
          className="text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors"
        >
          View/Upload
        </button>
      ),
      width: "140px"
    },
    {
      name: "Action",
      cell: row => (
        <button
          onClick={() => setApprovalModalData(row)}
          className="text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors"
        >
          Review & Approve
        </button>
      ),
      width: "160px"
    }
  ];

  const handleUpdatePaymentStatus = (feeId, paymentId, status) => {
    setConfirmModalConfig({
      isOpen: true,
      title: `${status} Payment`,
      message: `Are you sure you want to ${status.toLowerCase()} this payment?`,
      type: status === 'Approved' ? "success" : "danger",
      onConfirm: async () => {
        try {
          await api.patch(`/students/admission-payments/${feeId}/status/${paymentId}`, { status });
          toast.success(`Payment ${status.toLowerCase()}!`);
          fetchPayments();
        } catch (err) {
          toast.error(`Failed to ${status.toLowerCase()} payment`);
        }
      }
    });
  };

  const paymentColumns = [
    { name: "S.No", selector: (row, index) => index + 1, width: "70px" },
    {
      name: "Student Profile", selector: row => row.studentName, sortable: true, cell: row => (
        <div className="font-bold text-slate-900 truncate">
          {row.studentName}
          <div className="text-[10px] text-slate-500">{row.studentId}</div>
        </div>
      ), width: "200px"
    },
    {
      name: "Academic Info",
      selector: row => `${row.centerName || "-"} ${row.courseName || "-"} ${row.batchName || "-"}`,
      sortable: true,
      cell: row => (
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-[11px] font-bold text-slate-700 truncate">{row.centerName || "-"}</span>
          <span className="text-[10px] font-medium text-slate-500 truncate">{row.courseName || "-"}</span>
          <span className="text-[10px] text-brand-600 font-bold truncate">{row.batchName || "-"}</span>
        </div>
      ),
      width: "300px"
    },
    { name: "Fee Type", selector: row => row.feeType, sortable: true, width: "150px" },
    { name: "Amount", selector: row => row.amount, sortable: true, cell: row => `₹${row.amount}`, width: "120px" },
    { name: "Mode", selector: row => row.paymentMode, sortable: true, width: "100px" },
    {
      name: "Ref / Proof", selector: row => row.bankReference || "-", sortable: true, cell: row => (
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-xs truncate">{row.bankReference || "-"}</span>
          {row.proofOfPayment && (
            <a
              href={row.proofOfPayment}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-brand-600 font-bold hover:underline"
            >
              View Proof
            </a>
          )}
        </div>
      ), width: "150px"
    },
    {
      name: "Status", selector: row => row.status, sortable: true, cell: row => (
        <span className={`px-2 py-1 rounded text-xs font-bold ${row.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : row.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
          {row.status}
        </span>
      ), width: "120px"
    },
    { name: "Date", selector: row => new Date(row.paidAt).getTime(), sortable: true, format: row => new Date(row.paidAt).toLocaleDateString(), width: "120px" }
  ];

  const approvalColumns = [
    ...paymentColumns.filter(c => c.name !== 'Status'),
    {
      name: "Action",
      cell: row => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleUpdatePaymentStatus(row.studentFeeId, row.paymentId, 'Approved')}
            className="px-3 py-1 bg-brand-600 text-white rounded text-xs font-bold hover:bg-brand-700 transition-colors"
          >
            Approve
          </button>
          <button
            onClick={() => handleUpdatePaymentStatus(row.studentFeeId, row.paymentId, 'Rejected')}
            className="px-3 py-1 bg-rose-50 text-rose-600 rounded text-xs font-bold hover:bg-rose-100 transition-colors"
          >
            Reject
          </button>
        </div>
      ),
      width: "180px"
    }
  ];

  const batchColumns = [
    {
      name: "S.No",
      selector: (row, index) => index + 1,
      width: "80px"
    },
    {
      name: "Batch Name",
      selector: row => row.name,
      sortable: true,
      cell: row => (
        <button
          onClick={() => setSelectedBatchForViewingFees(row)}
          className="font-bold text-brand-600 hover:text-brand-700 underline-offset-2 hover:underline text-left"
        >
          {row.name}
        </button>
      ),
      width: "250px"
    },
    {
      name: "Batch ID",
      selector: row => row.batchId,
      sortable: true,
    },
    {
      name: "Course",
      cell: row => (
        <button
          onClick={() => setViewListModalData({ title: "Courses", items: row.courses || [] })}
          className="text-[11px] bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-bold whitespace-nowrap hover:bg-blue-100 transition-colors flex items-center gap-1.5"
        >
          View Courses
          <span className="bg-blue-200 text-blue-800 px-1.5 rounded-md text-[10px]">{row.courses?.length || 0}</span>
        </button>
      ),
      width: "150px"
    },
    {
      name: "Center",
      cell: row => (
        <button
          onClick={() => setViewListModalData({ title: "Centers", items: row.centers || [] })}
          className="text-[11px] bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg font-bold whitespace-nowrap hover:bg-purple-100 transition-colors flex items-center gap-1.5"
        >
          View Centers
          <span className="bg-purple-200 text-purple-800 px-1.5 rounded-md text-[10px]">{row.centers?.length || 0}</span>
        </button>
      ),
      width: "150px"
    },
    {
      name: "Actions",
      cell: row => (
        <button
          onClick={() => setSelectedBatchForFee(row)}
          className="px-4 py-1.5 bg-brand-50 text-brand-600 rounded-lg text-xs font-bold hover:bg-brand-100 transition-colors"
        >
          Define Fees
        </button>
      ),
      width: "150px"
    }
  ];

  if (selectedStudent) {
    return (
      <div className="w-full">
        <StudentProfilePage
          student={selectedStudent}
          initialMode={studentMode}
          centers={centers}
          onBack={() => setSelectedStudent(null)}
          onUpdate={() => {
            fetchStudents();
            fetchPayments();
          }}
        />
      </div>
    );
  }

  if (approvalModalData) {
    return (
      <div className="w-full">
        <CenterStudentApprovalModal
          isOpen={true}
          onClose={() => setApprovalModalData(null)}
          student={approvalModalData}
          onApprove={async (studentId, phase) => {
            try {
              await api.patch(`/students/${studentId}/admission-phase`, { phase });
              toast.success("Student approved to Center!");
              setApprovalModalData(null);
              fetchStudents();
            } catch(err) {
              console.error(err);
              toast.error("Failed to update phase");
            }
          }}
        />
      </div>
    );
  }

  if (bulkApprovalModalData) {
    return (
      <div className="w-full">
        <CenterStudentApprovalModal
          isOpen={true}
          onClose={() => setBulkApprovalModalData(null)}
          students={bulkApprovalModalData}
          onBulkApprove={async (ids, newPhase) => {
            try {
              await api.patch(`/students/bulk/admission-phase`, { ids, phase: newPhase });
              toast.success(`${ids.length} students approved successfully!`);
              setBulkApprovalModalData(null);
              fetchStudents();
              setSelectedApprovalRows([]);
            } catch(err) {
              console.error(err);
              toast.error("Failed to bulk update phase");
            }
          }}
        />
      </div>
    );
  }

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
            className={`pb-4 px-2 text-sm font-medium transition-colors relative whitespace-nowrap flex items-center gap-2 group ${activeTab === "scholarship_form"
                ? "text-brand-600"
                : "text-gray-500 hover:text-brand-600"
              }`}
          >
            <FileText size={20} />
            Scholarship Form
            <div className={`absolute bottom-0 left-0 w-full h-0.5 rounded-t-full transition-colors ${activeTab === "scholarship_form" ? "bg-brand-600" : "bg-transparent group-hover:bg-brand-600"
              }`} />
          </button>
          <button
            onClick={() => setActiveTab("admission_form")}
            className={`pb-4 px-2 text-sm font-medium transition-colors relative whitespace-nowrap flex items-center gap-2 group ${activeTab === "admission_form"
                ? "text-brand-600"
                : "text-gray-500 hover:text-brand-600"
              }`}
          >
            <Users size={20} />
            Admission Form
            <div className={`absolute bottom-0 left-0 w-full h-0.5 rounded-t-full transition-colors ${activeTab === "admission_form" ? "bg-brand-600" : "bg-transparent group-hover:bg-brand-600"
              }`} />
          </button>
          <button
            onClick={() => setActiveTab("fee_setup")}
            className={`pb-4 px-2 text-sm font-medium transition-colors relative whitespace-nowrap flex items-center gap-2 group ${activeTab === "fee_setup"
                ? "text-brand-600"
                : "text-gray-500 hover:text-brand-600"
              }`}
          >
            <IndianRupee size={20} />
            Fee Setup
            <div className={`absolute bottom-0 left-0 w-full h-0.5 rounded-t-full transition-colors ${activeTab === "fee_setup" ? "bg-brand-600" : "bg-transparent group-hover:bg-brand-600"
              }`} />
          </button>
          <button
            onClick={() => setActiveTab("payment_data")}
            className={`pb-4 px-2 text-sm font-medium transition-colors relative whitespace-nowrap flex items-center gap-2 group ${activeTab === "payment_data"
                ? "text-brand-600"
                : "text-gray-500 hover:text-brand-600"
              }`}
          >
            <LayoutDashboard size={20} />
            Payment Data
            <div className={`absolute bottom-0 left-0 w-full h-0.5 rounded-t-full transition-colors ${activeTab === "payment_data" ? "bg-brand-600" : "bg-transparent group-hover:bg-brand-600"
              }`} />
          </button>
          <button
            onClick={() => setActiveTab("student_approvals")}
            className={`pb-4 px-2 text-sm font-medium transition-colors relative whitespace-nowrap flex items-center gap-2 group ${activeTab === "student_approvals"
                ? "text-brand-600"
                : "text-gray-500 hover:text-brand-600"
              }`}
          >
            <CheckCircle size={20} />
            Student Approvals
            <div className={`absolute bottom-0 left-0 w-full h-0.5 rounded-t-full transition-colors ${activeTab === "student_approvals" ? "bg-brand-600" : "bg-transparent group-hover:bg-brand-600"
              }`} />
          </button>
          <button
            onClick={() => setActiveTab("approvals")}
            className={`pb-4 px-2 text-sm font-medium transition-colors relative whitespace-nowrap flex items-center gap-2 group ${activeTab === "approvals"
                ? "text-brand-600"
                : "text-gray-500 hover:text-brand-600"
              }`}
          >
            <CheckCircle size={20} />
           Fees Approval
            <div className={`absolute bottom-0 left-0 w-full h-0.5 rounded-t-full transition-colors ${activeTab === "approvals" ? "bg-brand-600" : "bg-transparent group-hover:bg-brand-600"
              }`} />
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "scholarship_form" && (
          <div className="animate-fade-in-up space-y-6">
            {/* Table */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-visible">
              <CustomDataTable
                columns={scholarshipColumns}
                data={scholarshipStudents}
                progressPending={loading}
                progressComponent={
                  <div className="p-12"><Loading /></div>
                }
                search={search}
                setSearch={setSearch}
                searchPlaceholder="Search by ID, name, email..."
                additionalHeaderContent={
                  <div className="flex items-center gap-3 justify-end w-full">
                    <StudentFilterBar
                      filterCenter={filterCenter} setFilterCenter={setFilterCenter}
                      filterCourse={filterCourse} setFilterCourse={setFilterCourse}
                      filterBatch={filterBatch} setFilterBatch={setFilterBatch}
                      centers={centers}
                      courses={courses}
                      batches={batches}
                      showType={false}
                      showVendor={false}
                      className="flex items-center gap-2"
                    />
                    {selectedScholarshipRows.length > 0 && (
                      <button
                        onClick={() => handleBulkUpdatePhase(selectedScholarshipRows, 'admission', 'Move selected students to Admission phase?', () => setSelectedScholarshipRows([]))}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all shadow-sm shrink-0"
                      >
                        <CheckCircle size={18} /> Move ({selectedScholarshipRows.length})
                      </button>
                    )}
                    <button
                      onClick={() => navigate('/student-registration?type=admin')}
                      className="flex items-center justify-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-sm active:scale-95 shrink-0"
                    >
                      <Plus size={18} />
                      Add Student
                    </button>
                  </div>
                }
                pagination
                responsive
                selectableRows
                onSelectedRowsChange={({ selectedRows }) => setSelectedScholarshipRows(selectedRows)}
                clearSelectedRows={selectedScholarshipRows.length === 0}
              />
            </div>
          </div>
        )}

        {activeTab === "admission_form" && (
          <div className="animate-fade-in-up space-y-6">
            {/* Table */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-visible">
              <CustomDataTable
                columns={admissionColumns}
                data={admissionStudents}
                progressPending={loading}
                progressComponent={
                  <div className="p-12"><Loading /></div>
                }
                search={search}
                setSearch={setSearch}
                searchPlaceholder="Search by ID, name, email..."
                additionalHeaderContent={
                  <div className="flex items-center justify-end w-full">
                    <StudentFilterBar
                      filterCenter={filterCenter} setFilterCenter={setFilterCenter}
                      filterCourse={filterCourse} setFilterCourse={setFilterCourse}
                      filterBatch={filterBatch} setFilterBatch={setFilterBatch}
                      centers={centers}
                      courses={courses}
                      batches={batches}
                      showType={false}
                      showVendor={false}
                      className="flex items-center gap-2"
                    />
                    {selectedAdmissionRows.length > 0 && (
                      <button
                        onClick={() => handleBulkUpdatePhase(selectedAdmissionRows, 'approval_pending', 'Move selected students to Approvals phase?', () => setSelectedAdmissionRows([]))}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all shadow-sm shrink-0 ml-2"
                      >
                        <CheckCircle size={18} /> Move ({selectedAdmissionRows.length})
                      </button>
                    )}
                  </div>
                }
                pagination
                responsive
                selectableRows
                onSelectedRowsChange={({ selectedRows }) => setSelectedAdmissionRows(selectedRows)}
                clearSelectedRows={selectedAdmissionRows.length === 0}
              />
            </div>
          </div>
        )}

        {activeTab === "student_approvals" && (
          <div className="animate-fade-in-up space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-visible">
              <CustomDataTable
                columns={studentApprovalColumns}
                data={studentApprovalStudents}
                progressPending={loading}
                progressComponent={
                  <div className="p-12"><Loading /></div>
                }
                search={search}
                setSearch={setSearch}
                searchPlaceholder="Search by ID, name, email..."
                additionalHeaderContent={
                  <div className="flex items-center justify-end w-full">
                    <StudentFilterBar
                      filterCenter={filterCenter} setFilterCenter={setFilterCenter}
                      filterCourse={filterCourse} setFilterCourse={setFilterCourse}
                      filterBatch={filterBatch} setFilterBatch={setFilterBatch}
                      centers={centers}
                      courses={courses}
                      batches={batches}
                      showType={false}
                      showVendor={false}
                      className="flex items-center gap-2"
                    />
                  </div>
                }
                pagination
                responsive
              />
            </div>
          </div>
        )}

        {activeTab === "fee_setup" && (
          <div className="animate-fade-in-up space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-visible">
              <CustomDataTable
                columns={batchColumns}
                data={filteredBatches}
                progressPending={batchLoading}
                progressComponent={
                  <div className="p-12"><Loading /></div>
                }
                search={batchSearch}
                setSearch={setBatchSearch}
                searchPlaceholder="Search batches by name or ID..."
                pagination
                responsive
              />
            </div>
          </div>
        )}

        {activeTab === "payment_data" && (
          <div className="animate-fade-in-up space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-visible">
              <CustomDataTable
                columns={paymentColumns}
                data={filteredPayments}
                progressPending={paymentsLoading}
                progressComponent={<div className="p-12"><Loading /></div>}
                search={search}
                setSearch={setSearch}
                searchPlaceholder="Search by student or transaction..."
                additionalHeaderContent={
                  <div className="flex items-center justify-end w-full">
                    <StudentFilterBar
                      filterCenter={filterCenter} setFilterCenter={setFilterCenter}
                      filterCourse={filterCourse} setFilterCourse={setFilterCourse}
                      filterBatch={filterBatch} setFilterBatch={setFilterBatch}
                      filterType={filterType} setFilterType={setFilterType}
                      typeOptions={[
                        { label: "Scholarship Fee", value: "Scholarship Fee" },
                        { label: "Admission Fee", value: "Admission Fee" }
                      ]}
                      centers={centers}
                      courses={courses}
                      batches={batches}
                      showType={true}
                      showVendor={false}
                      className="flex items-center gap-2"
                    />
                  </div>
                }
                pagination
                responsive
              />
            </div>
          </div>
        )}

        {activeTab === "approvals" && (
          <div className="animate-fade-in-up space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-visible">
              <CustomDataTable
                columns={approvalColumns}
                data={filteredPayments.filter(p => p.status === 'Pending')}
                progressPending={paymentsLoading}
                progressComponent={<div className="p-12"><Loading /></div>}
                search={search}
                setSearch={setSearch}
                searchPlaceholder="Search by student or transaction..."
                additionalHeaderContent={
                  <div className="flex items-center justify-end w-full">
                    <StudentFilterBar
                      filterCenter={filterCenter} setFilterCenter={setFilterCenter}
                      filterCourse={filterCourse} setFilterCourse={setFilterCourse}
                      filterBatch={filterBatch} setFilterBatch={setFilterBatch}
                      filterType={filterType} setFilterType={setFilterType}
                      typeOptions={[
                        { label: "Scholarship Fee", value: "Scholarship Fee" },
                        { label: "Admission Fee", value: "Admission Fee" }
                      ]}
                      centers={centers}
                      courses={courses}
                      batches={batches}
                      showType={true}
                      showVendor={false}
                      className="flex items-center gap-2"
                    />
                  </div>
                }
                pagination
                responsive
              />
            </div>
          </div>
        )}

      </div>

      {/* Modals */}
      <ViewListModal
        isOpen={!!viewListModalData}
        onClose={() => setViewListModalData(null)}
        title={viewListModalData?.title || ""}
        items={viewListModalData?.items || []}
      />

      <FeeDefinitionModal
        isOpen={!!selectedBatchForFee}
        onClose={() => setSelectedBatchForFee(null)}
        batch={selectedBatchForFee}
      />

      <ViewFeesModal
        isOpen={!!selectedBatchForViewingFees}
        onClose={() => setSelectedBatchForViewingFees(null)}
        batch={selectedBatchForViewingFees}
      />

      <CollectFeeModal
        isOpen={!!feeModalData}
        onClose={() => setFeeModalData(null)}
        student={feeModalData?.student}
        feeType={feeModalData?.feeType}
        readOnly={feeModalData?.readOnly}
        onSuccess={() => {
          setFeeModalData(null);
          fetchStudents();
        }}
      />

      <ConfirmationModal
        {...confirmModalConfig}
        onClose={() => setConfirmModalConfig({ ...confirmModalConfig, isOpen: false })}
      />

    <DocumentUploadModal
        isOpen={!!documentModalData}
        onClose={() => setDocumentModalData(null)}
        student={documentModalData}
        onUpdate={() => fetchStudents()}
      />

    </div>
  );
};

export default AdmissionManagement;
