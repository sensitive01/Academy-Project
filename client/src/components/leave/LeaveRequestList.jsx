import React, { useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import api from "../../services/api";
import toast from "react-hot-toast";
import { Eye, Trash2 } from "lucide-react";
import LeaveApplicationForm from "./LeaveApplicationForm";
import CustomDataTable from "../common/DataTable";
import ReactDOM from "react-dom";
import { useImagePreview } from "../../context/ImagePreviewContext";
import ConfirmationModal from "../modals/ConfirmationModal";

const LeaveRequestList = ({ showApplyButton = true, onlyMine = false, context = null }) => {
  const [requests, setRequests] = useState([]);
  const [user, setUser] = useState(null);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const { showPreview } = useImagePreview();
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [openStatusId, setOpenStatusId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const location = useLocation();

  // ================= FETCH LOGGED IN USER =================
  const fetchUser = async () => {
    try {
      const res = await api.get("/auth/me");
      setUser(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch user info");
    }
  };

  // ================= FETCH LEAVE LIST =================
  const fetchRequests = async (role) => {
    try {
      setLoadingList(true);
      const url = role === "admin" ? "/leave/all" : "/leave";
      const res = await api.get(url);
      setRequests(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load leave requests");
    } finally {
      setLoadingList(false);
    }
  };

  // ================= FETCH SINGLE LEAVE DETAILS =================
  const fetchLeaveDetails = async (id) => {
    try {
      setLoadingDetails(true);
      const res = await api.get(`/leave/${id}`);
      setSelectedLeave(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load leave details");
    } finally {
      setLoadingDetails(false);
    }
  };

  // ================= UPDATE STATUS =================
  const handleStatusChange = async (id, status) => {
    try {
      await api.patch(`/leave/${id}/status`, { status });
      toast.success(`Leave status updated to ${status}`);
      fetchRequests(user.role);
      if (selectedLeave && selectedLeave._id === id) fetchLeaveDetails(id);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update leave status");
    }
  };

  // ================= DELETE LEAVE =================
  const confirmDelete = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const executeDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/leave/${deleteId}`);
      toast.success("Leave deleted successfully");
      fetchRequests(user.role);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to delete leave");
    } finally {
      setShowDeleteModal(false);
      setDeleteId(null);
    }
  };

  // ================= USE EFFECTS =================
  useEffect(() => { fetchUser(); }, []);
  useEffect(() => { if (user) fetchRequests(user.role); }, [user]);

  // Handle URL query parameter for deep-linking
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const leaveId = params.get("id");
    if (leaveId) {
      fetchLeaveDetails(leaveId);
    }
  }, [location.search]);

  // ================= FILTERED & PAGINATED =================
  const filteredRequests = useMemo(() => {
    let list = requests;
    if (onlyMine && user && user.role !== "admin") {
      list = list.filter(req => req.userId === user._id);
    }
    
    if (fromDate) {
      list = list.filter(req => {
        const reqDate = new Date(req.startDate || req.permissionDate || req.createdAt);
        return reqDate >= new Date(fromDate);
      });
    }
    
    if (toDate) {
      list = list.filter(req => {
        const reqDate = new Date(req.startDate || req.permissionDate || req.createdAt);
        const endDay = new Date(toDate);
        endDay.setDate(endDay.getDate() + 1);
        return reqDate < endDay;
      });
    }

    if (searchTerm) {
      list = list.filter(req =>
        req.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.leaveType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.reason.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return list;
  }, [requests, searchTerm, onlyMine, user, fromDate, toDate]);

  const columns = [
    { name: 'S.No', selector: (row, i) => i + 1, width: '70px', center: true },
    { name: 'Employee', selector: row => row.employeeName, sortable: true, cell: row => <span className="font-medium text-slate-700">{row.employeeName || "Unknown"}</span> },
    { name: 'Category', selector: row => row.mode, sortable: true, cell: row => <span className="text-slate-600">{row.mode === "permission" ? "Permission" : "Leave"}</span> },
    { name: 'Type', selector: row => row.leaveType, sortable: true },
    { 
      name: 'Balances', 
      selector: row => row.leaveBalanceInfo ? row.leaveBalanceInfo.remaining : 0, 
      width: '120px',
      cell: row => (
        <div className="flex flex-col text-xs space-y-1 my-1">
          {row.leaveBalanceInfo ? (
            <>
              <span className="text-slate-600 font-medium">Available: {row.leaveBalanceInfo.maxAllowed} Day(s)</span>
              <span className="text-amber-600">Applied: {row.leaveBalanceInfo.alreadyAppliedCount} Day(s)</span>
            </>
          ) : (
            <span className="text-slate-400 italic">N/A</span>
          )}
        </div>
      )
    },
    { name: 'Reason', selector: row => row.reason, wrap: true, cell: row => <span className="text-slate-600">{row.reason}</span> },
    { name: 'Applied Date', selector: row => row.createdAt, width: '150px', sortable: true, cell: row => <span className="text-slate-600">{new Date(row.createdAt).toLocaleDateString()}</span> },
    {
      name: 'Range', selector: row => row.startDate, cell: row => (
        <span className="text-slate-600">
          {row.mode === "permission" ? (
            <div>
              <p>{new Date(row.permissionDate).toLocaleDateString()}</p>
              <p className="text-xs text-slate-500">{row.startTime} - {row.endTime}</p>
            </div>
          ) : (
            <div>
              <p>{new Date(row.startDate).toLocaleDateString()} - {new Date(row.endDate).toLocaleDateString()}</p>
              <p className="text-xs text-slate-500">{row.numDays} day(s)</p>
            </div>
          )}
        </span>
      )
    },
    {
      name: 'Status', selector: row => row.status, sortable: true, cell: row => (
        user?.role === "admin" ? (
          <div className="relative">
            <select
              value={row.status}
              onChange={(e) => handleStatusChange(row._id, e.target.value)}
              className={`appearance-none px-3 py-1.5 pr-8 rounded-full text-xs font-semibold border cursor-pointer transition
              ${row.status === "approved"
                  ? "bg-green-50 text-green-700 border-green-200"
                  : row.status === "rejected"
                    ? "bg-red-50 text-red-600 border-red-200"
                    : "bg-yellow-50 text-yellow-700 border-yellow-200"
                }
            `}
            >
              {/* Only show pending if current status is pending */}
              {row.status === "pending" && (
                <option value="pending">Pending</option>
              )}

              {/* Always allow switching between approved & rejected */}
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            {/* dropdown arrow */}
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
              ▼
            </span>
          </div>
        ) : (
          <span className={`px-2.5 py-1 text-xs rounded-full font-semibold ${getStatusClass(row.status)}`}>
            {row.status}
          </span>
        )
      )
    },
    {
      name: 'Action', center: true, width: '120px', cell: row => (
        <div className="flex justify-center gap-3">
          <button onClick={() => fetchLeaveDetails(row._id)} className="text-blue-600 hover:text-blue-800 transition">
            <Eye size={18} />
          </button>
          {(user?.role === "admin" || (row.userId === user?._id && row.status === "pending")) && (
            <button onClick={() => confirmDelete(row._id)} className="text-red-500 hover:text-red-700 transition">
              <Trash2 size={18} />
            </button>
          )}
        </div>
      )
    }
  ];

  // ================= STATUS CLASS HELPER =================
  const getStatusClass = (status) => {
    if (status === "approved") return "bg-green-100 text-green-700";
    if (status === "rejected") return "bg-red-100 text-red-600";
    return "bg-yellow-100 text-yellow-700";
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ===== HEADER ===== */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Leave Requests</h1>
            <p className="text-sm text-slate-500">Manage employee leave applications</p>
          </div>

          {showApplyButton && user && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl shadow-md transition"
            >
              + Apply Leave
            </button>
          )}
        </div>

        {/* ===== TABLE CARD ===== */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden pb-4">
          <CustomDataTable
            columns={columns}
            data={filteredRequests}
            progressPending={loadingList}
            pagination
            search={searchTerm}
            setSearch={setSearchTerm}
            searchPlaceholder="Search by employee, leave type or reason..."
            additionalHeaderContent={
              <div className="flex gap-3 items-center w-full sm:w-auto mt-3 sm:mt-0">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 font-medium px-1 mb-0.5">From Date</span>
                  <input 
                    type="date" 
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-slate-50 w-full sm:min-w-[130px] h-[38px]"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 font-medium px-1 mb-0.5">To Date</span>
                  <input 
                    type="date" 
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-slate-50 w-full sm:min-w-[130px] h-[38px]"
                  />
                </div>
                {(fromDate || toDate) && (
                  <button 
                    onClick={() => { setFromDate(""); setToDate(""); }}
                    className="mt-4 text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 bg-red-50 rounded-lg hover:bg-red-100 transition whitespace-nowrap h-[32px]"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            }
          />
        </div>
      </div>

      {/* ===== APPLY LEAVE MODAL ===== */}
      {showApplyButton && showForm && user && ReactDOM.createPortal(
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000] p-4"
          onClick={() => setShowForm(false)}
        >
          <div
            className="w-full max-w-2xl max-h-[95vh] overflow-y-auto no-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <LeaveApplicationForm
              context={context}
              onSuccess={() => {
                fetchRequests(user.role);
                setShowForm(false);
              }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>,
        document.body
      )}

      {/* ===== DETAILS MODAL ===== */}
      {selectedLeave && ReactDOM.createPortal(
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000] p-4"
          onClick={() => setSelectedLeave(null)}
        >
          <div
            className="bg-white w-[500px] p-6 rounded-2xl shadow-xl relative space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold text-slate-800 mb-3">Leave Details</h2>
            {loadingDetails ? (
              <p className="text-slate-500">Loading...</p>
            ) : (
              <div className="space-y-2 text-sm text-slate-600">
                <p><strong>Employee:</strong> {selectedLeave.employeeName}</p>
                <p><strong>Type:</strong> {selectedLeave.leaveType}</p>
                {selectedLeave.leaveBalanceInfo && (
                  <div className="bg-slate-100 p-3 rounded-lg my-2 border border-slate-200">
                    <p className="font-semibold text-slate-800 mb-1">Leave Balance ({selectedLeave.leaveType})</p>
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      <div className="bg-white p-2 rounded border border-slate-200 shadow-sm flex flex-col items-center justify-center">
                        <span className="block text-slate-500 mb-0.5">Allowed</span>
                        <span className="block font-bold text-slate-800 text-sm">{selectedLeave.leaveBalanceInfo.maxAllowed} Days</span>
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-200 shadow-sm flex flex-col items-center justify-center">
                        <span className="block text-slate-500 mb-0.5">Approved</span>
                        <span className="block font-bold text-green-600 text-sm">{selectedLeave.leaveBalanceInfo.approvedCount ?? 0} Days</span>
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-200 shadow-sm flex flex-col items-center justify-center">
                        <span className="block text-slate-500 mb-0.5">Pending</span>
                        <span className="block font-bold text-amber-600 text-sm">{selectedLeave.leaveBalanceInfo.pendingCount ?? 0} Days</span>
                      </div>
                      <div className="bg-white p-2 rounded border border-slate-200 shadow-sm flex flex-col items-center justify-center">
                        <span className="block text-slate-500 mb-0.5">Remaining</span>
                        <span className={`block font-bold text-sm ${selectedLeave.leaveBalanceInfo.remaining > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                          {selectedLeave.leaveBalanceInfo.remaining} Days
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <p><strong>Reason:</strong> {selectedLeave.reason}</p>
                {selectedLeave.mode === "permission" ? (
                  <>
                    <p>
                      <strong>Date:</strong>{" "}
                      {selectedLeave.permissionDate
                        ? new Date(selectedLeave.permissionDate).toLocaleDateString()
                        : "-"}
                    </p>
                    <p>
                      <strong>Time:</strong> {selectedLeave.startTime} - {selectedLeave.endTime}
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      <strong>Start:</strong>{" "}
                      {selectedLeave.startDate
                        ? new Date(selectedLeave.startDate).toLocaleDateString()
                        : "-"}
                    </p>
                    <p>
                      <strong>End:</strong>{" "}
                      {selectedLeave.endDate
                        ? new Date(selectedLeave.endDate).toLocaleDateString()
                        : "-"}
                    </p>
                  </>
                )}
                <p>
                  <strong>Status:</strong>{" "}
                  <span className={`px-2 py-1 text-xs rounded-full font-semibold ${getStatusClass(selectedLeave.status)}`}>
                    {selectedLeave.status}
                  </span>
                </p>
                {selectedLeave.fileUrl && (
                  <button
                    onClick={() => showPreview(`${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '')}/${selectedLeave.fileUrl}`)}
                    className="text-indigo-600 underline cursor-pointer"
                  >
                    View Attachment
                  </button>
                )}
              </div>
            )}
            <button
              onClick={() => setSelectedLeave(null)}
              className="absolute top-3 right-4 text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>
          </div>
        </div>,
        document.body
      )}
      
      {/* ===== DELETE CONFIRMATION MODAL ===== */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteId(null);
        }}
        onConfirm={executeDelete}
        title="Delete Leave Application"
        message="Are you sure you want to delete this leave application? This action cannot be undone."
        confirmText="Delete"
        confirmStyle="danger"
      />
    </div>
  );
};

export default LeaveRequestList;