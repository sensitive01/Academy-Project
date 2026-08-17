import React, { useEffect, useState } from "react";
import api from "../../services/api";
import CustomDataTable from "../common/DataTable";
import toast from "react-hot-toast";
import AddStudentFeeModal from "../modals/AddStudentFeeModal";
import CollectPaymentModal from "./CollectPaymentModal";
import { downloadReceipt } from "../../utils/downloadReceipt";
import { Download } from "lucide-react";

const StudentFeesList = ({ feeType }) => {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [centers, setCenters] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [selectedCenter, setSelectedCenter] = useState("all");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedBatch, setSelectedBatch] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  useEffect(() => {
    fetchFees();
    fetchDropdownData();
    // Reset filters on tab changes
    setSelectedCenter("all");
    setSelectedCourse("all");
    setSelectedBatch("all");
    setSelectedStatus("all");
  }, [feeType]);

  const fetchDropdownData = async () => {
    try {
      const [studentsRes, centersRes, coursesRes, batchesRes] = await Promise.all([
        api.get("/students"),
        api.get("/centers"),
        api.get("/courses"),
        api.get("/batches")
      ]);
      setStudents(studentsRes.data.students || studentsRes.data || []);
      setCenters(centersRes.data || []);
      setCourses(coursesRes.data?.filter(c => c.type === "Center Courses") || []);
      setBatches(batchesRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveFee = async (formData) => {
    try {
      const res = await api.post("/student-fees", formData);
      setFees([res.data, ...fees]);
      setShowModal(false);
      toast.success("Fee added successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add fee");
    }
  };
  const fetchFees = async () => {
    try {
      setLoading(true);
      const res = await api.get("/student-fees");
      // Filter by feeType prop
      const filteredData = res.data.filter(f => {
        if (feeType === 'All') return true;
        if (feeType === 'Council') return f.feeType === 'Council' || (f.feeType === 'Other' && f.otherFeeType === 'Council Fees');
        if (feeType === 'Course') return ['Sem', 'Term', 'Monthly'].includes(f.feeType);
        if (feeType === 'Other') return f.feeType === 'Other' && f.otherFeeType !== 'Council Fees';
        return f.feeType === feeType;
      });
      setFees(filteredData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await api.patch(`/student-fees/${id}/toggle-status`);
      setFees(fees.map(f => f._id === id ? res.data : f));
      toast.success("Status updated");
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleCollectPayment = async (id, data) => {
    try {
      const res = await api.post(`/student-fees/${id}/collect`, data);
      setFees(fees.map(f => f._id === id ? res.data : f));
      setShowCollectModal(false);
      setSelectedFee(null);
      toast.success("Payment processed successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to process payment");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this fee record?")) return;
    try {
      await api.delete(`/student-fees/${id}`);
      setFees(fees.filter(f => f._id !== id));
      toast.success("Deleted successfully");
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const filtered = fees.filter((f) => {
    const term = search.toLowerCase();
    const matchesSearch =
      !term ||
      f.student?.studentNameEnglish?.toLowerCase().includes(term) ||
      f.student?.studentId?.toLowerCase().includes(term) ||
      f.course?.title?.toLowerCase().includes(term) ||
      f.center?.name?.toLowerCase().includes(term) ||
      f.batch?.name?.toLowerCase().includes(term);

    const fCenterId = f.center?._id ? f.center._id.toString() : f.center ? f.center.toString() : "";
    const matchesCenter = selectedCenter === "all" || fCenterId === selectedCenter;

    const fCourseId = f.course?._id ? f.course._id.toString() : f.course ? f.course.toString() : "";
    const matchesCourse = selectedCourse === "all" || fCourseId === selectedCourse;

    const fBatchId = f.batch?._id ? f.batch._id.toString() : f.batch ? f.batch.toString() : "";
    const matchesBatch = selectedBatch === "all" || fBatchId === selectedBatch;

    let matchesStatus = true;
    if (selectedStatus !== "all") {
      if (selectedStatus === "paid") {
        matchesStatus = f.status === "paid";
      } else if (selectedStatus === "pending_approval") {
        matchesStatus = f.status === "pending_approval";
      } else if (selectedStatus === "unpaid") {
        matchesStatus = f.status !== "paid" && f.status !== "pending_approval";
      }
    }

    return matchesSearch && matchesCenter && matchesCourse && matchesBatch && matchesStatus;
  });

  const columns = [
    { name: "S.No", selector: (row, i) => i + 1, width: "70px", center: true },
    { 
      name: "Student",width:"150px", 
      selector: row => row.student?.studentNameEnglish, 
      sortable: true,
      cell: row => (
        <div>
          <div className="font-bold text-gray-800">{row.student?.studentNameEnglish || "N/A"}</div>
          <div className="text-[10px] text-gray-500 font-bold">{row.student?.studentId || ""}</div>
        </div>
      )
    },
    { 
      name: "Course & Batch", 
      selector: row => row.course?.title, 
      sortable: true, width:"350px",
      cell: row => (
        <div>
          <div className="font-medium text-gray-700 truncate max-w-[200px]">{row.course?.title || "-"}</div>
          <div className="text-[10px] text-gray-500 truncate max-w-[200px]">{row.batch?.name || "-"}</div>
        </div>
      )
    },
    { 
      name: "Center", 
      selector: row => row.center?.name, 
      sortable: true,
      cell: row => <span className="text-gray-600 text-xs font-medium uppercase tracking-wider">{row.center?.name || "-"}</span>
    },
    { 
      name: "Fee Details", width:"260px",
      selector: row => row.amount, 
      sortable: true, 
      cell: row => {
        const totalDue = row.amount + 
          (row.isPenaltyApplied ? row.penaltyAmount : 0) + 
          (row.isFinalPenaltyApplied ? row.finalPenaltyAmount : 0);
          
        return (
          <div className="flex flex-col gap-1.5 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-slate-800">₹{totalDue?.toLocaleString("en-IN")}</span>
              <span className="px-2 py-0.5 bg-brand-50 text-brand-600 rounded-md border border-brand-100 text-[9px] font-bold tracking-widest uppercase shadow-sm">
                {row.feeType === 'Other' && row.otherFeeType ? row.otherFeeType : row.feeType}
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200 text-[9px] font-bold tracking-wider uppercase">
                Base: ₹{row.amount?.toLocaleString("en-IN")}
              </span>
              {(row.penaltyAmount > 0 || row.finalPenaltyAmount > 0) && (
                <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded border border-red-100 text-[9px] font-bold tracking-wider uppercase">
                  Penalties: ₹{((row.isPenaltyApplied ? row.penaltyAmount : 0) + (row.isFinalPenaltyApplied ? row.finalPenaltyAmount : 0)).toLocaleString("en-IN")}
                </span>
              )}
            </div>

            {row.dueDate && (
              <div className="flex flex-col gap-0.5 mt-1 border-t border-slate-100 pt-1.5">
                <span className="text-[10px] text-slate-500 font-medium flex items-center justify-between">
                  <span><span className="text-orange-500 font-bold">Due:</span> {new Date(row.dueDate).toLocaleDateString("en-GB")}</span>
                </span>
                {row.finalDueDate && (
                  <span className="text-[10px] text-slate-500 font-medium flex items-center justify-between">
                    <span><span className="text-red-500 font-bold">Final:</span> {new Date(row.finalDueDate).toLocaleDateString("en-GB")}</span>
                  </span>
                )}
              </div>
            )}
          </div>
        );
      }
    },
    { 
      name: "Status", width:"150px",
      selector: row => row.status, 
      sortable: true, 
      center: true,
      cell: row => {
        if (row.status === 'paid') {
          return (
            <span className="px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-green-100 text-green-700">
              PAID {row.paymentMode ? `(${row.paymentMode})` : ''}
            </span>
          );
        } else if (row.status === 'pending_approval') {
          return (
            <div className="flex flex-col items-center gap-0.5">
              <span className="px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 whitespace-nowrap">
                Pending Approval
              </span>
              {row.paymentMode && (
                <span className="text-[10px] text-slate-500 font-bold lowercase">
                  ({row.paymentMode})
                </span>
              )}
            </div>
          );
        } else {
          return (
            <button 
              onClick={() => {
                setSelectedFee(row);
                setShowCollectModal(true);
              }}
              className="px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider transition-colors bg-orange-100 text-orange-700 hover:bg-orange-200"
            >
              Collect
            </button>
          );
        }
      }
    },
    { 
      name: "Date", width:"110px",
      selector: row => row.createdAt, 
      sortable: true, 
      cell: row => <span className="text-gray-600 font-medium">{new Date(row.createdAt).toLocaleDateString("en-GB")}</span> 
    },
    {
      name: "Action",
      center: true,
      width: "100px",
      cell: row => (
        <div className="flex items-center gap-1">
          {row.status === "paid" && (
            <button 
              onClick={() => downloadReceipt(`/student-fees/${row._id}/receipt`, `FeeReceipt_${row._id}.pdf`)}
              className="text-brand-500 hover:text-brand-700 hover:bg-brand-50 p-2 rounded-lg transition-colors"
              title="Download Receipt"
            >
              <Download size={16} />
            </button>
          )}
          <button onClick={() => handleDelete(row._id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4 sm:p-6 overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-800">{feeType === 'All' ? 'All' : feeType} Fees</h2>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Add Fee
        </button>
      </div>
      <CustomDataTable
        columns={columns}
        data={filtered}
        progressPending={loading}
        search={search}
        setSearch={setSearch}
        searchPlaceholder={`Search ${feeType} fees by student, ID, course...`}
        pagination
        additionalHeaderContent={
          <div className="flex items-center gap-2 flex-nowrap overflow-x-auto py-1">
            <select
              value={selectedCenter}
              onChange={(e) => setSelectedCenter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-700 shadow-sm cursor-pointer hover:bg-slate-100/50 transition-colors max-w-[130px] truncate"
            >
              <option value="all">All Centers</option>
              {centers.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>

            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-700 shadow-sm cursor-pointer hover:bg-slate-100/50 transition-colors max-w-[160px] truncate"
            >
              <option value="all">All Courses</option>
              {courses.map(c => (
                <option key={c._id} value={c._id}>{c.title}</option>
              ))}
            </select>

            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-700 shadow-sm cursor-pointer hover:bg-slate-100/50 transition-colors max-w-[130px] truncate"
            >
              <option value="all">All Batches</option>
              {batches.map(b => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-700 shadow-sm cursor-pointer hover:bg-slate-100/50 transition-colors max-w-[120px] truncate"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="unpaid">Unpaid</option>
            </select>

            {(selectedCenter !== "all" || selectedCourse !== "all" || selectedBatch !== "all" || selectedStatus !== "all") && (
              <button
                onClick={() => {
                  setSelectedCenter("all");
                  setSelectedCourse("all");
                  setSelectedBatch("all");
                  setSelectedStatus("all");
                }}
                className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-all border border-red-100 shadow-sm shrink-0 whitespace-nowrap animate-in fade-in"
              >
                Reset Filters
              </button>
            )}
          </div>
        }
      />
      {showModal && (
        <AddStudentFeeModal 
          onClose={() => setShowModal(false)}
          onSave={handleSaveFee}
          students={students}
          centers={centers}
          courses={courses}
          batches={batches}
          initialFeeType={feeType}
        />
      )}
      {showCollectModal && selectedFee && (
        <CollectPaymentModal
          fee={selectedFee}
          onClose={() => {
            setShowCollectModal(false);
            setSelectedFee(null);
          }}
          onSave={handleCollectPayment}
        />
      )}
    </div>
  );
};

export default StudentFeesList;
