import React, { useEffect, useState } from "react";
import {
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  Banknote,
  Download,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import AddExpenseModal from "../expenses/AddExpenseModel";
import CustomDataTable from "../../components/common/DataTable";
import ConfirmationModal from "../../components/modals/ConfirmationModal";
import { downloadReceipt } from "../../utils/downloadReceipt";
import ReactDOM from "react-dom";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { saveAs } from "file-saver";

const Expenses = ({ hideHeader = false, categoryFilter = null }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchExpense, setSearchExpense] = useState("");
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, id: null });
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState("excel");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const user = JSON.parse(localStorage.getItem("user")) || { role: "employee" };

  /* ================= FETCH EXPENSES ================= */
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await api.get("/expenses");
      setExpenses(res.data?.data || []);
    } catch {
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  /* ================= APPROVE / REJECT ================= */
  const handleStatusUpdate = async (id, status) => {
    try {
      await api.patch(`/expenses/${id}/status`, { status });
      toast.success(`Expense ${status}`);
      setOpenMenuId(null);
      fetchExpenses();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  /* ================= REIMBURSE ================= */
  const handleReimburse = async (id) => {
    try {
      await api.patch(`/expenses/${id}/reimburse`, {
        paymentMethod: "UPI",
        transactionId: "AUTO-TXN",
      });
      toast.success("Expense reimbursed");
      setOpenMenuId(null);
      fetchExpenses();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reimburse");
    }
  };

  /* ================= PAID DIRECT ================= */
  const handlePayDirect = async (id) => {
    try {
      await api.patch(`/expenses/${id}/pay`, {
        paymentMethod: "UPI",
        transactionId: "AUTO-TXN",
      });
      toast.success("Expense marked as Paid");
      setOpenMenuId(null);
      fetchExpenses();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to mark as Paid");
    }
  };

  /* ================= DELETE ================= */
  const handleDelete = (id) => {
    setConfirmConfig({ isOpen: true, id });
  };

  const confirmExpenseDelete = async () => {
    const id = confirmConfig.id;
    if (!id) return;
    
    try {
      await api.delete(`/expenses/${id}`);
      toast.success("Expense deleted");
      setOpenMenuId(null);
      fetchExpenses();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    } finally {
      setConfirmConfig({ isOpen: false, id: null });
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);


  /* ================= CLICK AWAY FOR MENUS ================= */
  useEffect(() => {
    const handleGlobalClick = (e) => {
      // If clicking anything other than the menu trigger icons, close the menu
      if (!e.target.closest(".action-menu-trigger") && !e.target.closest(".action-menu-content")) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleGlobalClick);
    return () => document.removeEventListener("mousedown", handleGlobalClick);
  }, []);

  /* ================= COLUMNS ================= */
  const columns = [
    { name: 'S.No', selector: (row, i) => i + 1, width: '70px', center: true },
    { name: 'Employee', selector: row => row.submittedBy?.name || "Unknown", sortable: true, cell: row => <span className="font-medium text-gray-800">{row.submittedBy?.name || "Unknown"}</span> },
    { name: 'Category', selector: row => row.category, sortable: true, cell: row => <span className="text-gray-600">{row.category}</span> },
    { name: 'Amount', selector: row => row.amount, sortable: true, cell: row => <span className="font-bold text-gray-800">₹ {row.amount?.toLocaleString("en-IN")}</span> },
    { name: 'Date', selector: row => row.date, sortable: true, cell: row => <span className="text-gray-600 font-mono">{new Date(row.date).toLocaleDateString("en-IN")}</span> },
    { name: 'Status', selector: row => row.status, sortable: true, center: true, width: '120px', cell: row => <StatusBadge status={row.status} /> },
    { name: 'Action', center: true, width: '100px', cell: row => (
        <div className="relative flex justify-center w-full" style={{ zIndex: openMenuId === row._id ? 9999 : 'auto' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpenMenuId(openMenuId === row._id ? null : row._id);
            }}
            className="p-2 hover:bg-slate-100 rounded-lg text-gray-600 transition action-menu-trigger"
          >
            <MoreVertical size={18} />
          </button>
          
          {openMenuId === row._id && (
            <div className="absolute right-full top-auto bottom-0 mr-2 w-48 whitespace-nowrap bg-white border border-gray-100 rounded-xl shadow-xl z-[9999] text-left overflow-hidden action-menu-content">
              {user.role === "admin" && row.status === "pending" && (
                <>
                  <button onClick={() => handleStatusUpdate(row._id, "approved")} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-semibold text-green-600 hover:bg-green-50 transition"><CheckCircle size={16} /> Approve</button>
                  <button onClick={() => handleStatusUpdate(row._id, "rejected")} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition"><XCircle size={16} /> Reject</button>
                </>
              )}
              {user.role === "admin" && row.status === "approved" && (
                <>
                  <button onClick={() => handleReimburse(row._id)} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition"><Banknote size={16} /> Reimburse</button>
                  <button onClick={() => handlePayDirect(row._id)} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 transition"><Banknote size={16} /> Paid</button>
                </>
              )}
              {["reimbursed", "paid"].includes(row.status) && (
                <button 
                  onClick={() => {
                    const filename = row.status === "paid" ? `Payment_${row._id}.pdf` : `Reimbursement_${row._id}.pdf`;
                    downloadReceipt(`/expenses/${row._id}/receipt`, filename);
                    setOpenMenuId(null);
                  }} 
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-semibold text-brand-600 hover:bg-brand-50 transition border-b border-gray-100"
                >
                  <Download size={16} /> Download Voucher
                </button>
              )}
              <button onClick={() => handleDelete(row._id)} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition border-t border-gray-100"><Trash2 size={16} /> Delete</button>
            </div>
          )}
        </div>
      )
    }
  ];

  /* ================= FILTER EXPENSES ================= */
  const displayedExpenses = expenses.filter((e) => {
    if (categoryFilter && e.category !== categoryFilter) return false;
    if (searchExpense && !e.category?.toLowerCase().includes(searchExpense.toLowerCase()) && !e.submittedBy?.name?.toLowerCase().includes(searchExpense.toLowerCase())) return false;
    
    if (fromDate || toDate) {
      if (!e.date) return false;
      const expenseDate = new Date(e.date).setHours(0,0,0,0);
      if (fromDate) {
        const from = new Date(fromDate).setHours(0,0,0,0);
        if (expenseDate < from) return false;
      }
      if (toDate) {
        const to = new Date(toDate).setHours(23,59,59,999);
        if (expenseDate > to) return false;
      }
    }
    return true;
  });

  const handleExport = () => {
    setShowExportModal(false);
    if (exportFormat === "excel") {
      const data = displayedExpenses.map((e, i) => ({
        "S.No": i + 1,
        "Employee": e.submittedBy?.name || "Unknown",
        "Category": e.category || "-",
        "Amount": e.amount || 0,
        "Date": e.date ? new Date(e.date).toLocaleDateString("en-IN") : "-",
        "Status": e.status || "-"
      }));
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");
      const title = categoryFilter ? `${categoryFilter}_Expenses.xlsx` : "Expenses_Report.xlsx";
      XLSX.writeFile(workbook, title);
      toast.success("Excel exported successfully!");
    } else {
      const doc = new jsPDF({ orientation: "landscape" });
      const title = categoryFilter ? `${categoryFilter} Expenses Report` : "Expenses Report";
      doc.text(title, 14, 15);
      
      const tableColumn = ["S.No", "Employee", "Category", "Amount", "Date", "Status"];
      const tableRows = [];
      displayedExpenses.forEach((e, index) => {
        const rowData = [
          index + 1,
          e.submittedBy?.name || "Unknown",
          e.category || "-",
          e.amount ? `Rs. ${e.amount.toLocaleString("en-IN")}` : "Rs. 0",
          e.date ? new Date(e.date).toLocaleDateString("en-IN") : "-",
          e.status || "-"
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
      const pdfTitle = categoryFilter ? `${categoryFilter}_Expenses.pdf` : "Expenses_Report.pdf";
      saveAs(pdfBlob, pdfTitle);
      toast.success("PDF exported successfully!");
    }
  };

  /* ================= STATS ================= */
  const totalAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const pendingCount = expenses.filter((e) => e.status === "pending").length;
  const approvedAmount = expenses
    .filter((e) => e.status === "approved")
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <div className="space-y-6">

      {/* Header */}
      {!hideHeader && (
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Expense Management</h2>
            <p className="text-sm text-slate-500">
              Track and manage expense claims
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700"
          >
            <Plus size={16} /> Add Expense
          </button>
        </div>
      )}

      <AddExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdded={fetchExpenses}
        defaultCategory={categoryFilter || ""}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Expenses" value={`₹ ${totalAmount}`} icon={DollarSign} />
        <StatCard label="Pending" value={pendingCount} icon={Clock} />
        <StatCard label="Approved Amount" value={`₹ ${approvedAmount}`} icon={CheckCircle} />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-visible pb-4">
        <CustomDataTable 
          columns={columns}
          data={displayedExpenses}
          progressPending={loading}
          search={searchExpense}
          setSearch={setSearchExpense}
          searchPlaceholder="Search by employee or category..."
          exportButton={
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-200 transition-colors cursor-pointer"
            >
              <Download size={14} /> Export
            </button>
          }
          additionalHeaderContent={
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap py-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">From:</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-700 shadow-sm cursor-pointer hover:bg-slate-100/50 transition-colors"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">To:</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-700 shadow-sm cursor-pointer hover:bg-slate-100/50 transition-colors"
                />
              </div>
              {(fromDate || toDate) && (
                <button
                  onClick={() => {
                    setFromDate("");
                    setToDate("");
                  }}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-all border border-red-100 shadow-sm shrink-0 whitespace-nowrap cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          }
        />
      </div>

      <ConfirmationModal
        isOpen={confirmConfig.isOpen}
        title="Delete Expense Claim"
        message="Are you sure you want to delete this expense record? This action cannot be reversed."
        confirmText="Confirm Delete"
        onConfirm={confirmExpenseDelete}
        onClose={() => setConfirmConfig({ isOpen: false, id: null })}
        type="danger"
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


/* ================= STATUS BADGE ================= */
const StatusBadge = ({ status }) => {
  const styles = {
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    reimbursed: "bg-blue-100 text-blue-700",
    paid: "bg-emerald-100 text-emerald-700",
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
};

/* ================= MENU BUTTON ================= */
const MenuButton = ({ icon: Icon, text, color, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 w-full px-4 py-2 text-${color}-600 hover:bg-${color}-50`}
  >
    <Icon size={16} /> {text}
  </button>
);

/* ================= STAT CARD ================= */
const StatCard = ({ label, value, icon: Icon }) => (
  <div className="bg-white p-4 rounded-xl border shadow-sm flex justify-between">
    <div>
      <p className="text-xs text-slate-500 uppercase">{label}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
    </div>
    <div className="p-3 rounded-lg bg-red-50 text-red-600">
      <Icon size={20} />
    </div>
  </div>
);

export default Expenses;
