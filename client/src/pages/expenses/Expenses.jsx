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
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import AddExpenseModal from "./AddExpenseModel";
import CustomDataTable from "../../components/DataTable";
import ConfirmationModal from "../../components/modals/ConfirmationModal";

const Expenses = ({ hideHeader = false, categoryFilter = null }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchExpense, setSearchExpense] = useState("");
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, id: null });

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
        <div className="relative flex justify-center w-full">
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
            <div className="absolute right-full top-0 mr-2 w-44 bg-white border border-gray-100 rounded-xl shadow-xl z-[9999] text-left overflow-hidden action-menu-content">
              {user.role === "admin" && row.status === "pending" && (
                <>
                  <button onClick={() => handleStatusUpdate(row._id, "approved")} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-semibold text-green-600 hover:bg-green-50 transition"><CheckCircle size={16} /> Approve</button>
                  <button onClick={() => handleStatusUpdate(row._id, "rejected")} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition"><XCircle size={16} /> Reject</button>
                </>
              )}
              {user.role === "admin" && row.status === "approved" && (
                <button onClick={() => handleReimburse(row._id)} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition"><Banknote size={16} /> Reimburse</button>
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
    return true;
  });

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
