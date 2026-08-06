import React, { useState, useEffect } from "react";
import api from "../../services/api";
import {
  ListTodo,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Calendar as CalendarIcon,
  X,
  User as UserIcon,
  Clock,
  CheckCircle,
  LayoutDashboard
} from "lucide-react";
import Loading from "../../components/Loading";
import CustomDataTable from "../../components/DataTable";

const Reminders = () => {
  const [reminders, setReminders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [search, setSearch] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      const res = await api.get("/reminders");
      setReminders(res.data);
    } catch (error) {
      console.error("Error fetching reminders", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const payload = { title, description };
      if (dueDate) payload.dueDate = dueDate;

      const res = await api.post("/reminders", payload);
      setReminders([res.data, ...reminders]);
      
      // Reset form
      setTitle("");
      setDescription("");
      setDueDate("");
      setIsAdding(false);
    } catch (error) {
      console.error("Error adding reminder", error);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "pending" ? "completed" : "pending";
    
    // Optimistic UI update
    setReminders(reminders.map(r => r._id === id ? { ...r, status: newStatus } : r));

    try {
      await api.put(`/reminders/${id}`, { status: newStatus });
    } catch (error) {
      console.error("Error toggling reminder", error);
      // Revert on failure
      setReminders(reminders.map(r => r._id === id ? { ...r, status: currentStatus } : r));
    }
  };

  const deleteReminder = async (id) => {
    if (!window.confirm("Are you sure you want to delete this reminder?")) return;

    try {
      await api.delete(`/reminders/${id}`);
      setReminders(reminders.filter(r => r._id !== id));
    } catch (error) {
      console.error("Error deleting reminder", error);
      alert(error?.response?.data?.message || "Error deleting reminder");
    }
  };

  const columns = [
    {
      name: "Status",
      selector: row => row.status,
      sortable: true,
      cell: row => (
        <button 
          onClick={() => toggleStatus(row._id, row.status)}
          className={`flex items-center justify-center p-2 rounded-full transition-colors ${row.status === 'completed' ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-400 hover:text-emerald-500 hover:bg-slate-50'}`}
        >
          {row.status === 'completed' ? <CheckCircle2 size={22} /> : <Circle size={22} />}
        </button>
      ),
      width: "100px"
    },
    {
      name: "Reminder",
      selector: row => row.title,
      sortable: true,
      cell: row => (
        <div className="py-2">
          <div className={`text-sm font-bold ${row.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
            {row.title}
          </div>
          {row.description && (
            <div className="text-xs text-slate-500 truncate max-w-xs mt-0.5" title={row.description}>
              {row.description}
            </div>
          )}
        </div>
      ),
      width: "400px"
    },
    {
      name: "Type",
      selector: row => row.type,
      sortable: true,
      cell: row => {
        const isAssigned = !!row.assignedBy;
        const isFee = row.type === "fee_reminder";
        if (isFee) return <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-md bg-red-100 text-red-700 border border-red-200">Fee Notice</span>;
        if (isAssigned) return <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-md bg-blue-100 text-blue-700 border border-blue-200">Assigned</span>;
        return <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-md bg-slate-100 text-slate-600 border border-slate-200">Personal</span>;
      },
      width: "150px"
    },
    {
      name: "Due Date",
      selector: row => row.dueDate,
      sortable: true,
      cell: row => row.dueDate ? (
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
          <CalendarIcon size={12} className="text-brand-500" />
          {new Date(row.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      ) : <span className="text-slate-400 text-sm font-medium">-</span>,
      width: "160px"
    },
    {
      name: "Assigned By",
      selector: row => row.assignedBy?.name,
      sortable: true,
      cell: row => row.assignedBy ? (
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
          <UserIcon size={14} className="text-brand-500" />
          {row.assignedBy.name}
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
          <UserIcon size={14} />
          Self
        </div>
      ),
      width: "190px"
    },
    {
      name: "Action",
      cell: row => {
        const canDelete = !row.assignedBy || row.status === 'completed';
        return canDelete ? (
          <button 
            onClick={() => deleteReminder(row._id)}
            className="text-slate-400 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition-colors"
            title="Delete Reminder"
          >
            <Trash2 size={18} />
          </button>
        ) : (
          <div className="p-2" title="Cannot delete assigned reminders until completed">
            <Trash2 size={18} className="text-slate-300 cursor-not-allowed opacity-50" />
          </div>
        );
      },
      width: "100px",
      center: true
    }
  ];

  if (isLoading) return <Loading />;

  const pendingReminders = reminders.filter(r => r.status === "pending");
  const completedReminders = reminders.filter(r => r.status === "completed");

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-slate-50/50 space-y-8 animate-in fade-in duration-500">
      
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-brand-50 text-brand-600 rounded-xl">
              <LayoutDashboard size={24} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Reminder Center
            </h1>
          </div>
          <p className="text-slate-500 font-medium ml-1">Organize your workflow and track pending reminders.</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/30"
        >
          <Plus size={20} />
          New Reminder
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
            <ListTodo size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Total Reminders</p>
            <p className="text-3xl font-black text-slate-800">{reminders.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="p-4 bg-amber-50 text-amber-500 rounded-2xl">
            <Clock size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Pending</p>
            <p className="text-3xl font-black text-slate-800">{pendingReminders.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="p-4 bg-emerald-50 text-emerald-500 rounded-2xl">
            <CheckCircle size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Completed</p>
            <p className="text-3xl font-black text-slate-800">{completedReminders.length}</p>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden pt-4 px-2">
        <CustomDataTable
          columns={columns}
          data={reminders}
          search={search}
          setSearch={setSearch}
          searchPlaceholder="Search reminders by title or description..."
        />
      </div>

      {/* Add Reminder Modal Popup */}
      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <Plus className="text-brand-600" /> Create New Reminder
              </h2>
              <button 
                onClick={() => setIsAdding(false)} 
                className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Modal Body */}
            <form onSubmit={handleAddSubmit} className="p-8 space-y-5">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Reminder Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. Follow up with student fees"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-medium rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                />
              </div>
              
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Detailed Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide any additional context or links..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-medium rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all resize-none"
                />
              </div>
              
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Due Date (Optional)</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-medium rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 pt-6 mt-4">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-3 rounded-xl font-bold transition-colors shadow-lg shadow-brand-500/30 active:scale-95"
                >
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Reminders;
