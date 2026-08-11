import React, { useState, useEffect } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  Upload, 
  Info, 
  CheckCircle2, 
  X,
  Plus,
  Briefcase,
  AlertCircle
} from "lucide-react";

const LeaveApplicationForm = ({ onSuccess, onCancel }) => {
  const today = new Date().toISOString().split("T")[0];

  const [employeeName, setEmployeeName] = useState(
    localStorage.getItem("name") || ""
  );
  const [reason, setReason] = useState("");
  const [leaveType, setLeaveType] = useState("casual");
  const [otherLeaveType, setOtherLeaveType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [numDays, setNumDays] = useState(0);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState("leave");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // Calculate number of days
  useEffect(() => {
    if (mode === "leave" && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setNumDays(diffDays > 0 ? diffDays : 0);
    } else {
      setNumDays(0);
    }
  }, [startDate, endDate, mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const userId = localStorage.getItem("id");
    if (!userId)
      return toast.error("User not found. Please login again.");

    // 🔴 Validation
    if (!employeeName || !reason)
      return toast.error("Please fill all required fields");

    if (mode === "leave") {
      if (!startDate || !endDate)
        return toast.error("Please select leave dates");

      if (startDate < today)
        return toast.error("Start date cannot be in the past");

      if (endDate < startDate)
        return toast.error("End date must be after start date");
    }

    if (mode === "permission") {
      if (!startDate || !startTime || !endTime)
        return toast.error("Please fill all permission details");

      if (endTime <= startTime)
        return toast.error("End time must be after start time");
    }

    if (leaveType === "other" && !otherLeaveType.trim())
      return toast.error("Please specify the leave type");

    const formData = new FormData();

    formData.append("userId", userId);
    formData.append("employeeName", employeeName);
    formData.append("mode", mode);
    formData.append(
      "leaveType",
      leaveType === "other" ? otherLeaveType : leaveType
    );
    formData.append("reason", reason);

    if (mode === "leave") {
      formData.append("startDate", startDate);
      formData.append("endDate", endDate);
      formData.append("numDays", numDays);
    }

    if (mode === "permission") {
      formData.append("permissionDate", startDate);
      formData.append("startTime", startTime);
      formData.append("endTime", endTime);
    }

    if (file) formData.append("file", file);

    try {
      setSubmitting(true);

      await api.post("/leave/apply", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Request submitted successfully!");

      if (onSuccess) onSuccess();

      // Reset
      setReason("");
      setStartDate("");
      setEndDate("");
      setOtherLeaveType("");
      setLeaveType("casual");
      setFile(null);
      setStartTime("");
      setEndTime("");
      setNumDays(0);

    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to submit request"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const inputClasses = "w-full border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all duration-200 bg-slate-50/30";
  const labelClasses = "block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2";

  return (
    <div className="bg-white w-full max-w-3xl mx-auto rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-300">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Briefcase size={80} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Calendar className="text-white" size={24} />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              Apply for Request
            </h2>
          </div>
          <p className="text-red-100 text-sm">
            Submit your leave or permission request for approval.
          </p>
        </div>
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        {/* MODE TOGGLE */}
        <div className="flex p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setMode("leave")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${
              mode === "leave"
                ? "bg-white text-red-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Calendar size={18} />
            Leave Request
          </button>
          <button
            type="button"
            onClick={() => setMode("permission")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${
              mode === "permission"
                ? "bg-white text-red-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Clock size={18} />
            Permission Request
          </button>
        </div>

        {/* BASIC INFO */}
        <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500 delay-150">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClasses}>
                <User size={16} className="text-red-500" />
                Employee Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={employeeName}
                  readOnly
                  className={`${inputClasses} bg-slate-100 cursor-not-allowed`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Info size={16} />
                </div>
              </div>
            </div>

            <div>
              <label className={labelClasses}>
                <Briefcase size={16} className="text-red-500" />
                {mode === "leave" ? "Leave Type" : "Permission Type"}
              </label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                className={inputClasses}
              >
                <option value="casual">Casual</option>
                <option value="sick">Sick</option>
                {mode === "leave" ? (
                  <option value="vacation">Vacation</option>
                ) : (
                  <option value="emergency">Emergency</option>
                )}
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {leaveType === "other" && (
            <div className="animate-in slide-in-from-top-2">
              <label className={labelClasses}>Specify Type</label>
              <input
                type="text"
                value={otherLeaveType}
                placeholder="e.g. Personal Commitment"
                onChange={(e) => setOtherLeaveType(e.target.value)}
                className={inputClasses}
              />
            </div>
          )}
        </div>

        {/* DATES & TIMES */}
        <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500 delay-300">
          <div className="flex items-center gap-2 text-slate-800 font-semibold text-lg border-b border-slate-100 pb-2">
            {mode === "leave" ? <Calendar size={20} className="text-red-600" /> : <Clock size={20} className="text-red-600" />}
            {mode === "leave" ? "Leave Schedule" : "Permission Schedule"}
          </div>

          {mode === "leave" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClasses}>Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  min={today}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>End Date</label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || today}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={inputClasses}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClasses}>Date</label>
                <input
                  type="date"
                  value={startDate}
                  min={today}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={inputClasses}
                />
              </div>
            </div>
          )}

          {mode === "leave" && numDays > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-red-600" size={20} />
                <span className="text-red-800 font-medium">Total Duration Calculated</span>
              </div>
              <div className="text-2xl font-bold text-red-700">
                {numDays} {numDays === 1 ? "Day" : "Days"}
              </div>
            </div>
          )}
        </div>

        {/* ADDITIONAL DETAILS */}
        <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500 delay-500">
          <div className="flex items-center gap-2 text-slate-800 font-semibold text-lg border-b border-slate-100 pb-2">
            <FileText size={20} className="text-red-600" />
            Additional Information
          </div>

          <div>
            <label className={labelClasses}>Reason for Application</label>
            <textarea
              rows="3"
              value={reason}
              placeholder="Provide a brief explanation for your request..."
              onChange={(e) => setReason(e.target.value)}
              className={`${inputClasses} resize-none`}
            />
          </div>

          <div>
            <label className={labelClasses}>Supporting Document</label>
            <div className="relative">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-2xl hover:border-red-400 hover:bg-red-50/50 transition-all cursor-pointer group">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {file ? (
                    <>
                      <div className="p-3 bg-green-100 rounded-full mb-3 text-green-600">
                        <CheckCircle2 size={24} />
                      </div>
                      <p className="text-sm text-slate-700 font-medium">{file.name}</p>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setFile(null);
                        }}
                        className="mt-2 text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                      >
                        <X size={12} /> Remove
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="p-3 bg-slate-100 rounded-full mb-3 text-slate-500 group-hover:text-red-500 group-hover:bg-red-100 transition-colors">
                        <Upload size={24} />
                      </div>
                      <p className="text-sm text-slate-600">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG (Max 5MB)</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files[0])}
                />
              </label>
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95 ${
              submitting
                ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                : "bg-red-600 text-white hover:bg-red-700 shadow-red-500/25"
            }`}
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                Confirm Submission
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LeaveApplicationForm;
