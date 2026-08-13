import React, { useEffect, useState } from "react";
import api from "../../services/api";
import CustomDataTable from "../common/DataTable";
import toast from "react-hot-toast";

const PendingApprovalsList = () => {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [centers, setCenters] = useState([]);
  const [selectedCenter, setSelectedCenter] = useState("all");
  const [selectedMode, setSelectedMode] = useState("all");

  useEffect(() => {
    fetchPendingFees();
    fetchCenters();
  }, []);

  const fetchCenters = async () => {
    try {
      const res = await api.get("/centers");
      setCenters(res.data || []);
    } catch (err) {
      console.error("Failed to load centers", err);
    }
  };

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
    const matchesSearch =
      f.student?.studentNameEnglish?.toLowerCase().includes(term) ||
      f.student?.studentId?.toLowerCase().includes(term) ||
      f.bankReference?.toLowerCase().includes(term) ||
      f.center?.name?.toLowerCase().includes(term);

    const fCenterId = f.center?._id ? f.center._id.toString() : f.center ? f.center.toString() : "";
    const matchesCenter = selectedCenter === "all" || fCenterId === selectedCenter;

    const matchesMode = selectedMode === "all" || f.paymentMode === selectedMode;

    return matchesSearch && matchesCenter && matchesMode;
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
      name: "Reference / Proof", width: "200px",
      selector: row => row.bankReference || row.proofOfPayment,
      sortable: true,
      cell: row => {
        if (row.paymentMode === 'Online' && row.proofOfPayment) {
          return (
            <a 
              href={row.proofOfPayment} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm whitespace-nowrap"
            >
              View Uploaded Proof
            </a>
          );
        }
        return (
          <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-700 border border-slate-200">
            {row.bankReference || 'N/A'}
          </span>
        );
      }
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
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-700 shadow-sm cursor-pointer hover:bg-slate-100/50 transition-colors max-w-[130px] truncate"
            >
              <option value="all">All Modes</option>
              <option value="Cash">Cash</option>
              <option value="Online">Online</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>

            {(selectedCenter !== "all" || selectedMode !== "all") && (
              <button
                onClick={() => {
                  setSelectedCenter("all");
                  setSelectedMode("all");
                }}
                className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-all border border-red-100 shadow-sm shrink-0 whitespace-nowrap animate-in fade-in"
              >
                Reset Filters
              </button>
            )}
          </div>
        }
      />
    </div>
  );
};

export default PendingApprovalsList;
