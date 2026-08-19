import React, { useEffect, useState } from "react";
import api from "../../services/api";
import CustomDataTable from "../common/DataTable";
import toast from "react-hot-toast";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import ReactDOM from "react-dom";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { saveAs } from "file-saver";

const PendingApprovalsList = () => {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [centers, setCenters] = useState([]);
  const [selectedCenter, setSelectedCenter] = useState("all");
  const [selectedMode, setSelectedMode] = useState("all");
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState("excel");

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
      const filteredData = res.data.filter(f => f.status === 'pending_approval' && f.student);
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

  const handleExport = () => {
    setShowExportModal(false);
    if (exportFormat === "excel") {
      const data = filtered.map((f, i) => {
        const pendingPayment = f.payments ? f.payments.find(p => p.status === 'Pending') : null;
        const displayAmount = pendingPayment ? pendingPayment.amount : (f.amount + (f.isPenaltyApplied ? f.penaltyAmount : 0) + (f.isFinalPenaltyApplied ? f.finalPenaltyAmount : 0));
          
        return {
          "S.No": i + 1,
          "Student Name": f.student?.studentNameEnglish || "N/A",
          "Student ID": f.student?.studentId || "-",
          "Course": f.course?.title || "-",
          "Center": f.center?.name || "-",
          "Amount": displayAmount || 0,
          "Payment Mode": f.paymentMode || "-",
          "Bank Reference": f.bankReference || "N/A",
          "Status": f.status || "-"
        };
      });
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Pending Approvals");
      XLSX.writeFile(workbook, "Pending_Approvals_Report.xlsx");
      toast.success("Excel exported successfully!");
    } else {
      const doc = new jsPDF({ orientation: "landscape" });
      doc.text("Pending Approvals Report", 14, 15);
      
      const tableColumn = ["S.No", "Student", "Course & Center", "Amount", "Mode", "Reference", "Status"];
      const tableRows = [];
      filtered.forEach((f, index) => {
        const pendingPayment = f.payments ? f.payments.find(p => p.status === 'Pending') : null;
        const displayAmount = pendingPayment ? pendingPayment.amount : (f.amount + (f.isPenaltyApplied ? f.penaltyAmount : 0) + (f.isFinalPenaltyApplied ? f.finalPenaltyAmount : 0));
          
        const rowData = [
          index + 1,
          `${f.student?.studentNameEnglish || "N/A"} (${f.student?.studentId || "-"})`,
          `${f.course?.title || "-"} / ${f.center?.name || "-"}`,
          displayAmount ? `Rs. ${displayAmount.toLocaleString("en-IN")}` : "Rs. 0",
          f.paymentMode || "-",
          f.bankReference || "N/A",
          f.status || "-"
        ];
        tableRows.push(rowData);
      });
      
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 20,
        theme: "striped",
        styles: { fontSize: 8, cellPadding: 2 }
      });
      
      const pdfBlob = doc.output("blob");
      saveAs(pdfBlob, "Pending_Approvals_Report.pdf");
      toast.success("PDF exported successfully!");
    }
  };

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
      selector: row => {
        const pendingPayment = row.payments ? row.payments.find(p => p.status === 'Pending') : null;
        return pendingPayment ? pendingPayment.amount : (row.amount + (row.isPenaltyApplied ? row.penaltyAmount : 0) + (row.isFinalPenaltyApplied ? row.finalPenaltyAmount : 0));
      }, 
      sortable: true, 
      cell: row => {
        const pendingPayment = row.payments ? row.payments.find(p => p.status === 'Pending') : null;
        const displayAmount = pendingPayment ? pendingPayment.amount : (row.amount + (row.isPenaltyApplied ? row.penaltyAmount : 0) + (row.isFinalPenaltyApplied ? row.finalPenaltyAmount : 0));
          
        return (
          <div className="flex flex-col gap-1 py-3">
            <span className="text-sm font-black text-slate-800">₹{displayAmount?.toLocaleString("en-IN")}</span>
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
        exportButton={
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-200 transition-colors cursor-pointer"
          >
            <Download size={14} /> Export
          </button>
        }
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
      {/* EXPORT MODAL */}
      {showExportModal && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[10000] p-4" onClick={() => setShowExportModal(false)}>
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Export Data</h3>
            <p className="text-slate-500 text-xs mb-6">Choose your preferred format to export the filtered list.</p>
            
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
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-red-200 transition-all cursor-pointer"
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

export default PendingApprovalsList;
