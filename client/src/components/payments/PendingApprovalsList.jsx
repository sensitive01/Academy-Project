import React, { useEffect, useState } from "react";
import api from "../../services/api";
import CustomDataTable from "../common/DataTable";
import toast from "react-hot-toast";

const PendingApprovalsList = () => {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchPendingFees();
  }, []);

  const fetchPendingFees = async () => {
    try {
      setLoading(true);
      const res = await api.get("/student-fees");
      const filteredData = res.data.filter(f => f.status === 'pending_approval');
      setFees(filteredData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (id, status) => {
    try {
      const res = await api.patch(`/student-fees/${id}/approve`, { approvalStatus: status });
      setFees(fees.filter(f => f._id !== id));
      toast.success(`Payment ${status}`);
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${status} payment`);
    }
  };

  const filtered = fees.filter((f) => {
    const term = search.toLowerCase();
    return (
      f.student?.studentNameEnglish?.toLowerCase().includes(term) ||
      f.student?.studentId?.toLowerCase().includes(term) ||
      f.bankReference?.toLowerCase().includes(term) ||
      f.center?.name?.toLowerCase().includes(term)
    );
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
      name: "Course & Center", 
      selector: row => row.course?.title, 
      sortable: true, width:"250px",
      cell: row => (
        <div>
          <div className="font-medium text-gray-700 truncate max-w-[200px]">{row.course?.title || "-"}</div>
          <div className="text-[10px] text-gray-500 font-bold">{row.center?.name || "-"}</div>
        </div>
      )
    },
    { 
      name: "Payment Details", width:"220px",
      selector: row => row.amount, 
      sortable: true, 
      cell: row => {
        const totalDue = row.amount + 
          (row.isPenaltyApplied ? row.penaltyAmount : 0) + 
          (row.isFinalPenaltyApplied ? row.finalPenaltyAmount : 0);
          
        return (
          <div className="flex flex-col gap-1 py-3">
            <span className="text-sm font-black text-slate-800">₹{totalDue?.toLocaleString("en-IN")}</span>
            <span className="text-[10px] text-slate-500 font-bold uppercase">
              Mode: {row.paymentMode}
            </span>
          </div>
        );
      }
    },
    {
      name: "Bank Ref", width: "180px",
      selector: row => row.bankReference,
      sortable: true,
      cell: row => (
        <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-700 border border-slate-200">
          {row.bankReference || 'N/A'}
        </span>
      )
    },
    {
      name: "Action",
      center: true,
      width: "200px",
      cell: row => (
        <div className="flex gap-2">
          <button 
            onClick={() => handleApproval(row._id, 'Approved')} 
            className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-xs font-bold transition-colors"
          >
            Approve
          </button>
          <button 
            onClick={() => handleApproval(row._id, 'Rejected')} 
            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold transition-colors"
          >
            Reject
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4 sm:p-6 overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-800">Pending Approvals</h2>
      </div>
      <CustomDataTable
        columns={columns}
        data={filtered}
        progressPending={loading}
        search={search}
        setSearch={setSearch}
        searchPlaceholder="Search approvals by student, ID, bank ref..."
        pagination
      />
    </div>
  );
};

export default PendingApprovalsList;
