import React, { useEffect, useState } from "react";
import api from "../../services/api";
import CustomDataTable from "../common/DataTable";
import toast from "react-hot-toast";
import AddVendorPaymentModal from "./AddVendorPaymentModal";
import { downloadReceipt } from "../../utils/downloadReceipt";
import { Download } from "lucide-react";

const VendorPaymentsList = () => {
  const [payments, setPayments] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedVendor, setSelectedVendor] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  useEffect(() => {
    fetchPayments();
    fetchVendors();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get("/vendor-payments");
      setPayments(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load vendor payments");
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const res = await api.get("/vendors");
      setVendors(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSavePayment = async (formData) => {
    try {
      const res = await api.post("/vendor-payments", formData);
      setPayments([res.data, ...payments]);
      setShowModal(false);
      toast.success("Vendor payment added successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add payment");
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await api.patch(`/vendor-payments/${id}/toggle-status`);
      setPayments(payments.map(p => p._id === id ? res.data : p));
      toast.success("Status updated");
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this payment record?")) return;
    try {
      await api.delete(`/vendor-payments/${id}`);
      setPayments(payments.filter(p => p._id !== id));
      toast.success("Deleted successfully");
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const filtered = payments.filter((p) => {
    const term = search.toLowerCase();
    const matchesSearch =
      p.vendor?.companyName?.toLowerCase().includes(term) ||
      p.vendor?.contactPerson?.toLowerCase().includes(term) ||
      p.title?.toLowerCase().includes(term);

    const pVendorId = p.vendor?._id ? p.vendor._id.toString() : p.vendor ? p.vendor.toString() : "";
    const matchesVendor = selectedVendor === "all" || pVendorId === selectedVendor;

    const matchesStatus = selectedStatus === "all" || p.status === selectedStatus;

    return matchesSearch && matchesVendor && matchesStatus;
  });

  const columns = [
    { name: "S.No", selector: (row, i) => i + 1, width: "70px", center: true },
    { 
      name: "Vendor",
      selector: row => row.vendor?.companyName, 
      sortable: true,
      cell: row => (
        <div>
          <div className="font-bold text-gray-800">{row.vendor?.companyName || "Unknown Vendor"}</div>
          <div className="text-[10px] text-gray-500 font-bold">{row.vendor?.contactPerson || ""}</div>
        </div>
      )
    },
    { 
      name: "Title", 
      selector: row => row.title, 
      sortable: true,
      cell: row => <div className="font-medium text-gray-700">{row.title}</div>
    },
    { 
      name: "Amount", width: "130px",
      selector: row => row.amount, 
      sortable: true, 
      cell: row => <span className="font-bold text-brand-600">₹ {row.amount?.toLocaleString("en-IN")}</span> 
    },
    { 
      name: "Status", width: "150px",
      selector: row => row.status, 
      sortable: true, 
      center: true,
      cell: row => (
        <button 
          onClick={() => handleToggleStatus(row._id)}
          className={`px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider transition-colors ${
            row.status === "paid" ? "bg-green-100 text-green-700 hover:bg-green-200" :
            "bg-orange-100 text-orange-700 hover:bg-orange-200"
          }`}
        >
          {row.status}
        </button>
      )
    },
    { 
      name: "Date", width: "130px",
      selector: row => row.date, 
      sortable: true, 
      cell: row => <span className="text-gray-600 font-medium">{new Date(row.date).toLocaleDateString("en-GB")}</span> 
    },
    {
      name: "Action",
      center: true,
      width: "100px",
      cell: row => (
        <div className="flex items-center gap-1">
          {row.status === "paid" && (
            <button 
              onClick={() => downloadReceipt(`/vendor-payments/${row._id}/receipt`, `Voucher_${row._id}.pdf`)}
              className="text-brand-500 hover:text-brand-700 hover:bg-brand-50 p-2 rounded-lg transition-colors"
              title="Download Voucher"
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
        <h2 className="text-xl font-bold text-slate-800">Vendor Payments</h2>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Add Payment
        </button>
      </div>
      <CustomDataTable
        columns={columns}
        data={filtered}
        progressPending={loading}
        search={search}
        setSearch={setSearch}
        searchPlaceholder="Search vendor payments..."
        pagination
        additionalHeaderContent={
          <div className="flex items-center gap-2 flex-nowrap overflow-x-auto py-1">
            <select
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-700 shadow-sm cursor-pointer hover:bg-slate-100/50 transition-colors max-w-[150px] truncate"
            >
              <option value="all">All Vendors</option>
              {vendors.map(v => (
                <option key={v._id} value={v._id}>{v.companyName}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-700 shadow-sm cursor-pointer hover:bg-slate-100/50 transition-colors max-w-[120px] truncate"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
            </select>

            {(selectedVendor !== "all" || selectedStatus !== "all") && (
              <button
                onClick={() => {
                  setSelectedVendor("all");
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
        <AddVendorPaymentModal 
          onClose={() => setShowModal(false)}
          onSave={handleSavePayment}
          vendors={vendors}
        />
      )}
    </div>
  );
};

export default VendorPaymentsList;
