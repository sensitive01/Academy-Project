import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import api from "../../services/api";
import toast from "react-hot-toast";
import { UploadCloud, Download, CheckCircle, Save, ArrowLeft, Edit2, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const BulkAttendance = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [includeEmpty, setIncludeEmpty] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10)
  });
  
  const [previewData, setPreviewData] = useState([]);
  const [studentsMap, setStudentsMap] = useState({});
  const [employees, setEmployees] = useState([]);
  
  const API_URL = import.meta.env.VITE_API_URL;

  // Fetch users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const [studentsRes, employeesRes] = await Promise.all([
          api.get("/students", { headers: { Authorization: `Bearer ${token}` } }),
          api.get("/employees", { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        const sMap = {};
        if (studentsRes.data && studentsRes.data.students) {
          studentsRes.data.students.forEach(s => {
            const uid = s.user?._id || s._id;
            sMap[uid] = s;
          });
        }
        setStudentsMap(sMap);
        
        let emps = employeesRes.data || [];
        emps = emps.filter(emp => emp.role !== "student" && emp.role !== "admin");
        setEmployees(emps);
      } catch (err) {
        toast.error("Failed to load users data");
      }
    };
    fetchUsers();
  }, [token]);
  
  // Combine users for export
  const allUsers = [
    ...(employees || []).map(e => ({ _id: e._id, idDisplay: e.employeeId || e._id, name: e.name, role: e.role })),
    ...(Object.values(studentsMap)).map(s => ({ _id: s.user?._id || s._id, idDisplay: s.studentId || s.user?._id || s._id, name: s.user?.name || s.name, role: "student" }))
  ].filter(u => u._id && u.name);

  // Step 1: Export
  const handleExport = async () => {
    try {
      setLoading(true);
      const res = await api.get(`${API_URL}/attendance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allAtt = res.data;
      
      const filteredAtt = allAtt.filter(a => {
        const d = new Date(a.date).toISOString().slice(0, 10);
        return d >= dateRange.startDate && d <= dateRange.endDate;
      });

      const rows = [];
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      
      if (includeEmpty) {
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().slice(0, 10);
          allUsers.forEach(u => {
            const existing = filteredAtt.find(a => a.userId === u._id && new Date(a.date).toISOString().slice(0, 10) === dateStr);
            rows.push({
              "Student ID": u.idDisplay,
              "Name": u.name,
              "Date": dateStr,
              "Login Time": existing?.loginTime || "",
              "Logout Time": existing?.logoutTime || ""
            });
          });
        }
      } else {
        // Only export existing records
        filteredAtt.forEach(a => {
           const u = allUsers.find(user => user._id === a.userId);
           rows.push({
              "Student ID": u ? u.idDisplay : a.userId,
              "Name": u ? u.name : (a.name || "Unknown"),
              "Date": new Date(a.date).toISOString().slice(0, 10),
              "Login Time": a.loginTime || "",
              "Logout Time": a.logoutTime || ""
           });
        });
        
        if (rows.length === 0) {
           toast.error("No data found in the selected period. Enable 'Template mode' to export an empty template.");
           setLoading(false);
           return;
        }
      }

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Attendance");
      XLSX.writeFile(wb, `Attendance_Template_${dateRange.startDate}_to_${dateRange.endDate}.xlsx`);
      
      toast.success("Template exported!");
      setStep(2);
    } catch (err) {
      toast.error("Failed to export template");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const wb = XLSX.read(data, { type: "array" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rows = XLSX.utils.sheet_to_json(ws, { raw: true, defval: "" });
        
        const parseExcelDate = (val) => {
          if (!val) return null;
          if (typeof val === "number") {
            const parsed = XLSX.SSF.parse_date_code(val);
            if (parsed) return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
          }
          if (typeof val === "string") {
            if (val.match(/^\d{4}-\d{2}-\d{2}$/)) return val;
            if (val.match(/^\d{2}-\d{2}-\d{4}$/)) {
              const p = val.split('-');
              return `${p[2]}-${p[1]}-${p[0]}`;
            }
            const d = new Date(val);
            if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
          }
          return null;
        };

        const parseExcelTime = (val) => {
          if (val === "" || val === null || val === undefined) return "";
          if (typeof val === "number") {
             const totalSeconds = Math.round(val * 24 * 60 * 60);
             const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
             const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
             const s = (totalSeconds % 60).toString().padStart(2, '0');
             return `${h}:${m}:${s}`;
          }
          
          let str = val.toString().trim();
          const ampmMatch = str.match(/(AM|PM|am|pm)/i);
          let isPM = false;
          if (ampmMatch) {
             isPM = ampmMatch[1].toUpperCase() === 'PM';
             str = str.replace(/(AM|PM|am|pm)/i, "").trim();
          }
          
          let parts = str.split(':');
          if (parts.length >= 2) {
             let h = parseInt(parts[0], 10);
             let m = parseInt(parts[1], 10);
             let s = parts.length > 2 ? parseInt(parts[2], 10) : 0;
             
             if (isPM && h < 12) h += 12;
             if (ampmMatch && !isPM && h === 12) h = 0;
             
             if (!isNaN(h) && !isNaN(m)) {
                return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
             }
          }
          return str;
        };
        
        const res = await api.get(`${API_URL}/attendance`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const allAtt = res.data;

        const preview = rows.map((row, index) => {
          const idDisplay = row["Student ID"] || row["ID"] || row["User ID"];
          const matchedUser = allUsers.find(u => u.idDisplay === idDisplay || u._id === idDisplay);
          const userId = matchedUser ? matchedUser._id : idDisplay;
          
          const date = parseExcelDate(row["Date"]);
          const loginTime = parseExcelTime(row["Login Time"]);
          const logoutTime = parseExcelTime(row["Logout Time"]);
          
          if (!userId || !date) return null;

          const existing = allAtt.find(a => a.userId === userId && new Date(a.date).toISOString().slice(0, 10) === date);
          const existingLogin = (existing?.loginTime || "").toString().trim();
          const existingLogout = (existing?.logoutTime || "").toString().trim();
          
          const hasExistingTimes = existingLogin || existingLogout;
          
          let status = "New";
          if (existing && hasExistingTimes) {
            if (!loginTime && !logoutTime) {
              // Both times were removed -> Delete the record
              status = "Deleted";
            } else if (existingLogin !== loginTime || existingLogout !== logoutTime) {
              // Times are different -> Edited
              status = "Edited";
            } else {
              // Exact same times -> Unedited
              status = "Unedited";
            }
          } else if (!loginTime && !logoutTime) {
            // No existing record and no times provided -> Skip
            status = "Skip"; 
          }
          
          return {
            id: index,
            userId,
            name: row["Name"] || (existing ? existing.name : "Unknown"),
            date,
            loginTime: loginTime || "",
            logoutTime: logoutTime || "",
            existingLogin: existing?.loginTime || "",
            existingLogout: existing?.logoutTime || "",
            status,
            isEditing: false
          };
        }).filter(Boolean);

        // Detect missing rows (deleted entirely from excel)
        const startStr = dateRange.startDate;
        const endStr = dateRange.endDate;
        const missingRecords = [];
        let missingIndex = rows.length;

        allAtt.forEach(a => {
           const d = new Date(a.date).toISOString().slice(0, 10);
           if (d >= startStr && d <= endStr) {
               const found = preview.find(p => p.userId === a.userId && p.date === d);
               if (!found) {
                   missingRecords.push({
                      id: missingIndex++,
                      userId: a.userId,
                      name: a.name || "Unknown",
                      date: d,
                      loginTime: "",
                      logoutTime: "",
                      existingLogin: (a.loginTime || "").toString().trim(),
                      existingLogout: (a.logoutTime || "").toString().trim(),
                      status: "Deleted",
                      isEditing: false
                   });
               }
           }
        });

        setPreviewData([...preview, ...missingRecords]);
        setStep(3);
      } catch (err) {
        toast.error("Error parsing file");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Step 3: Save
  const handleSave = async () => {
    const recordsToSave = previewData
      .filter(r => r.status === "New" || r.status === "Edited" || r.status === "Deleted")
      .map(r => ({
        userId: r.userId,
        date: r.date,
        loginTime: r.loginTime,
        logoutTime: r.logoutTime,
        isDelete: r.status === "Deleted"
      }));

    if (recordsToSave.length === 0) {
      toast.error("No new or modified records to save");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post(`${API_URL}/attendance/bulk`, recordsToSave, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(res.data.message || "Bulk upload successful!");
      navigate("/dashboard/students", { state: { activeTab: "student_attendance" } });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save bulk data");
    } finally {
      setLoading(false);
    }
  };

  const updatePreviewRow = (id, field, value) => {
    setPreviewData(prev => prev.map(row => {
      if (row.id === id) {
        const newRow = { ...row, [field]: value };
        // Recalculate status
        if (newRow.existingLogin || newRow.existingLogout) {
           const currentLogin = (newRow.loginTime || "").toString().trim();
           const currentLogout = (newRow.logoutTime || "").toString().trim();
           const prevLogin = (newRow.existingLogin || "").toString().trim();
           const prevLogout = (newRow.existingLogout || "").toString().trim();

           if (!currentLogin && !currentLogout) {
             newRow.status = "Deleted";
           } else if (currentLogin !== prevLogin || currentLogout !== prevLogout) {
             newRow.status = "Edited";
           } else {
             newRow.status = "Unedited";
           }
        } else {
          newRow.status = newRow.loginTime ? "New" : "Skip";
        }
        return newRow;
      }
      return row;
    }));
  };

  const undoDelete = (id) => {
    setPreviewData(prev => prev.map(row => {
      if (row.id === id) {
        return {
          ...row,
          loginTime: row.existingLogin,
          logoutTime: row.existingLogout,
          status: "Unedited",
          isEditing: false
        };
      }
      return row;
    }));
  };

  const toggleEdit = (id) => {
    setPreviewData(prev => prev.map(row => {
      if (row.id === id) {
        return { ...row, isEditing: !row.isEditing };
      }
      return row;
    }));
  };

  const validPreviewData = previewData.filter(r => r.status !== "Skip");
  const totalPages = Math.ceil(validPreviewData.length / rowsPerPage);
  const currentTableData = validPreviewData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="p-4 sm:p-6 animate-in fade-in duration-500 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate("/dashboard/students", { state: { activeTab: "student_attendance" } })} 
            className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition text-slate-500"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Bulk Attendance Upload</h1>
            <p className="text-slate-500 text-sm font-medium">Export template, add records, and bulk upload.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col min-h-[600px]">
        {/* Stepper Header */}
        <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex items-center justify-between">
           {[
             { num: 1, title: "Export Template", icon: Download },
             { num: 2, title: "Upload Data", icon: UploadCloud },
             { num: 3, title: "Preview & Save", icon: CheckCircle }
           ].map((s, i) => (
             <div key={s.num} className="flex items-center gap-3">
               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl transition-all shadow-sm ${step >= s.num ? "bg-indigo-600 text-white shadow-indigo-600/30" : "bg-white text-slate-400 border border-slate-200"}`}>
                 {step > s.num ? <CheckCircle size={24} /> : s.num}
               </div>
               <span className={`font-semibold text-lg hidden sm:block ${step >= s.num ? "text-indigo-900" : "text-slate-400"}`}>{s.title}</span>
               {i < 2 && <div className={`w-16 h-1.5 mx-6 rounded-full ${step > s.num ? "bg-indigo-600" : "bg-slate-200"}`} />}
             </div>
           ))}
        </div>

        {/* Content Body */}
        <div className="p-8 overflow-y-auto flex-1">
          {step === 1 && (
            <div className="flex flex-col items-center justify-center py-16 animate-in fade-in zoom-in-95 duration-300">
               <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-6 ring-8 ring-indigo-50/50">
                 <Download size={48} />
               </div>
               <h3 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">Export Template</h3>
               <p className="text-slate-500 mb-10 text-center max-w-md text-lg">Select a date range to generate an Excel template. You can then fill in or modify the login/logout times for all users.</p>
               
               <div className="flex flex-wrap justify-center gap-6 mb-10">
                 <div className="flex flex-col">
                   <label className="text-sm font-bold text-slate-600 mb-2 uppercase tracking-widest">Start Date</label>
                   <input type="date" className="px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-semibold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm" value={dateRange.startDate} onChange={e => setDateRange({...dateRange, startDate: e.target.value})} />
                 </div>
                 <div className="flex flex-col">
                   <label className="text-sm font-bold text-slate-600 mb-2 uppercase tracking-widest">End Date</label>
                   <input type="date" className="px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-semibold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm" value={dateRange.endDate} onChange={e => setDateRange({...dateRange, endDate: e.target.value})} />
                 </div>
               </div>
               
               <label className="flex items-center gap-3 mt-6 cursor-pointer">
                 <input type="checkbox" checked={includeEmpty} onChange={e => setIncludeEmpty(e.target.checked)} className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer" />
                 <span className="text-sm font-bold text-slate-600 select-none">Include empty rows for missing attendance (Template mode)</span>
               </label>
               
               <div className="mt-10 flex gap-4">
                  <button onClick={() => setStep(2)} className="px-8 py-3.5 rounded-2xl font-bold bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">Skip to Upload</button>
                  <button onClick={handleExport} disabled={loading} className="px-8 py-3.5 rounded-2xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 flex items-center gap-2 transition-all active:scale-95">
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Download size={20} />}
                    Export & Next
                  </button>
               </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col items-center justify-center py-16 animate-in fade-in zoom-in-95 duration-300">
               <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 ring-8 ring-blue-50/50">
                 <UploadCloud size={48} />
               </div>
               <h3 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">Upload Modified Template</h3>
               <p className="text-slate-500 mb-10 text-center max-w-md text-lg">Upload the Excel file with the modified attendance records. We will process and preview the changes before saving.</p>
               
               <label className="cursor-pointer group">
                 <div className="border-2 border-dashed border-slate-300 rounded-[2rem] p-16 bg-slate-50/50 group-hover:bg-blue-50 group-hover:border-blue-400 transition-all flex flex-col items-center justify-center min-w-[400px]">
                    {loading ? (
                      <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                    ) : (
                      <UploadCloud size={40} className="text-slate-400 mb-4 group-hover:text-blue-500 transition-colors" />
                    )}
                    <span className="font-bold text-slate-700 text-lg">{loading ? "Processing File..." : "Click to Browse File"}</span>
                    <span className="text-sm font-semibold text-slate-400 mt-2 uppercase tracking-widest">Supports .xlsx</span>
                 </div>
                 <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} disabled={loading} />
               </label>
               
               <div className="mt-10">
                  <button onClick={() => setStep(1)} disabled={loading} className="px-6 py-2.5 font-bold text-slate-500 hover:text-slate-800 transition disabled:opacity-50 flex items-center gap-2">
                    <ArrowLeft size={18} /> Back to Export
                  </button>
               </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col animate-in fade-in zoom-in-95 duration-300">
               <div className="flex justify-between items-end mb-6">
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Preview Changes</h3>
                    <p className="text-slate-500 font-medium">Review and edit records before finalizing.</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="px-4 py-1.5 rounded-xl bg-green-50 text-green-700 text-sm font-bold border border-green-200/50 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span> New: {previewData.filter(r => r.status === "New").length}
                    </span>
                    <span className="px-4 py-1.5 rounded-xl bg-amber-50 text-amber-700 text-sm font-bold border border-amber-200/50 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span> Edited: {previewData.filter(r => r.status === "Edited").length}
                    </span>
                    <span className="px-4 py-1.5 rounded-xl bg-red-50 text-red-700 text-sm font-bold border border-red-200/50 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span> Deleted: {previewData.filter(r => r.status === "Deleted").length}
                    </span>
                  </div>
               </div>

               <div className="flex-1 overflow-auto bg-white border border-slate-200 rounded-3xl shadow-sm">
                  <table className="w-full text-sm text-left">
                     <thead className="bg-slate-50 text-slate-600 font-bold sticky top-0 shadow-sm z-10 text-[11px] uppercase tracking-wider">
                       <tr>
                         <th className="px-6 py-4 rounded-tl-3xl">S.No</th>
                         <th className="px-6 py-4">Name</th>
                         <th className="px-6 py-4">Date</th>
                         <th className="px-6 py-4 w-48">Login Time</th>
                         <th className="px-6 py-4 w-48">Logout Time</th>
                         <th className="px-6 py-4 text-center">Status</th>
                         <th className="px-6 py-4 text-center rounded-tr-3xl">Action</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                       {currentTableData.length === 0 ? (
                         <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500 font-medium text-lg">No valid records found in the uploaded file.</td></tr>
                       ) : currentTableData.map((row, index) => (
                         <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                           <td className="px-6 py-4 font-bold text-slate-500">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                           <td className="px-6 py-4 font-bold text-slate-800">{row.name}</td>
                           <td className="px-6 py-4 font-semibold text-slate-600">{row.date}</td>
                           <td className="px-6 py-4">
                             <input type="time" step="1" disabled={!row.isEditing || row.status === "Deleted"} className={`px-4 py-2 border border-slate-200 rounded-xl w-full font-semibold focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow ${!row.isEditing || row.status === "Deleted" ? "bg-slate-50 text-slate-400 cursor-not-allowed" : "bg-white"}`} value={row.loginTime} onChange={e => updatePreviewRow(row.id, "loginTime", e.target.value)} />
                             {row.existingLogin && row.loginTime !== row.existingLogin && <div className="text-[10px] font-black text-slate-400 mt-1.5 line-through ml-1 uppercase tracking-widest">Was: {row.existingLogin}</div>}
                           </td>
                           <td className="px-6 py-4">
                             <input type="time" step="1" disabled={!row.isEditing || row.status === "Deleted"} className={`px-4 py-2 border border-slate-200 rounded-xl w-full font-semibold focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow ${!row.isEditing || row.status === "Deleted" ? "bg-slate-50 text-slate-400 cursor-not-allowed" : "bg-white"}`} value={row.logoutTime} onChange={e => updatePreviewRow(row.id, "logoutTime", e.target.value)} />
                             {row.existingLogout && row.logoutTime !== row.existingLogout && <div className="text-[10px] font-black text-slate-400 mt-1.5 line-through ml-1 uppercase tracking-widest">Was: {row.existingLogout}</div>}
                           </td>
                           <td className="px-6 py-4 text-center">
                              {row.status === "New" && <span className="inline-flex items-center px-3 py-1 bg-green-50 text-green-700 text-xs rounded-lg font-black uppercase tracking-wider border border-green-200/50">New</span>}
                              {row.status === "Edited" && <span className="inline-flex items-center px-3 py-1 bg-amber-50 text-amber-700 text-xs rounded-lg font-black uppercase tracking-wider border border-amber-200/50">Edited</span>}
                              {row.status === "Deleted" && <span className="inline-flex items-center px-3 py-1 bg-red-50 text-red-700 text-xs rounded-lg font-black uppercase tracking-wider border border-red-200/50">Deleted</span>}
                              {row.status === "Unedited" && <span className="inline-flex items-center px-3 py-1 bg-slate-50 text-slate-500 text-xs rounded-lg font-black uppercase tracking-wider border border-slate-200">Unedited</span>}
                           </td>
                           <td className="px-6 py-4 text-center">
                              {row.status === "Deleted" ? (
                                <button onClick={() => undoDelete(row.id)} title="Recover Data" className="p-2 text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center justify-center w-full">
                                  <RefreshCw size={16} />
                                </button>
                              ) : (
                                <button onClick={() => toggleEdit(row.id)} title={row.isEditing ? "Save / Done" : "Edit Row"} className={`p-2 rounded-lg transition-colors flex items-center justify-center w-full ${row.isEditing ? "bg-green-50 text-green-600 hover:bg-green-100" : "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"}`}>
                                  {row.isEditing ? <CheckCircle size={16} /> : <Edit2 size={16} />}
                                </button>
                              )}
                           </td>
                         </tr>
                       ))}
                     </tbody>
                  </table>
               </div>
               
               {totalPages > 1 && (
                 <div className="pt-4 flex justify-between items-center px-2">
                   <div className="text-sm font-semibold text-slate-500">
                     Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, validPreviewData.length)} of {validPreviewData.length} records
                   </div>
                   <div className="flex gap-2">
                     <button
                       onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                       disabled={currentPage === 1}
                       className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 font-bold text-slate-600 transition"
                     >
                       Previous
                     </button>
                     <button
                       onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                       disabled={currentPage === totalPages}
                       className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 font-bold text-slate-600 transition"
                     >
                       Next
                     </button>
                   </div>
                 </div>
               )}

               <div className="pt-6 mt-6 border-t border-slate-100 flex justify-between items-center">
                 <button onClick={() => setStep(2)} disabled={loading} className="px-6 py-3 font-bold text-slate-500 hover:text-slate-800 transition disabled:opacity-50 flex items-center gap-2">
                   <ArrowLeft size={18} /> Back
                 </button>
                 <button onClick={handleSave} disabled={loading} className="px-8 py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold shadow-xl shadow-green-600/20 transition-all active:scale-95 flex items-center gap-2">
                   {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save size={20} />}
                   Confirm & Save Changes
                 </button>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkAttendance;
