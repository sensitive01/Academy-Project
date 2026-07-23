import React, { useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import { Eye, Trash2 } from "lucide-react";
import LeaveApplicationForm from "./LeaveApplicationForm";
import CustomDataTable from "./DataTable";
import ReactDOM from "react-dom";

const LeaveRequestList = ({ showApplyButton = true, onlyMine = false }) => {
  const [requests, setRequests] = useState([]);
  const [user, setUser] = useState(null);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [openStatusId, setOpenStatusId] = useState(null);
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
  const handleDelete = async (id) => {
    try {
      await api.delete(`/leave/${id}`);
      toast.success("Leave deleted successfully");
      fetchRequests(user.role);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to delete leave");
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
    if (searchTerm) {
      list = list.filter(req =>
        req.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.leaveType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.reason.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return list;
  }, [requests, searchTerm, onlyMine, user]);

  const columns = [
    { name: 'S.No', selector: (row, i) => i + 1, width: '70px', center: true },
    { name: 'Employee', selector: row => row.employeeName, sortable: true, cell: row => <span className="font-medium text-slate-700">{row.employeeName || "Unknown"}</span> },
    { name: 'Category', selector: row => row.mode, sortable: true, cell: row => <span className="text-slate-600">{row.mode === "permission" ? "Permission" : "Leave"}</span> },
    { name: 'Type', selector: row => row.leaveType, sortable: true },
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
            <button onClick={() => handleDelete(row._id)} className="text-red-500 hover:text-red-700 transition">
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
                  <a
                    href={`${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '')}/${selectedLeave.fileUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 underline"
                  >
                    View Attachment
                  </a>
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
    </div>
  );
};

export default LeaveRequestList;