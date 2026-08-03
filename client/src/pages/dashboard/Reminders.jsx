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
  BellRing,
  User as UserIcon,
} from "lucide-react";
import Loading from "../../components/Loading";

const Reminders = () => {
  const [reminders, setReminders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

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
      alert(error.response?.data?.message || "Error deleting reminder");
    }
  };

  if (isLoading) return <Loading />;

  const pendingReminders = reminders.filter(r => r.status === "pending");
  const completedReminders = reminders.filter(r => r.status === "completed");

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <ListTodo className="text-brand-600" size={28} />
            My Reminders
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage your pending tasks and to-dos.</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-colors shadow-sm"
        >
          <Plus size={20} />
          New Reminder
        </button>
      </div>

      {/* Add Reminder Form */}
      {isAdding && (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-brand-100 animate-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-800">Add New Reminder</h2>
            <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="What do you need to do?"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more details..."
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Due Date (Optional)</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full sm:w-1/2 bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-xl font-semibold transition-colors"
              >
                Save Reminder
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lists */}
      <div className="space-y-8">
        
        {/* Pending */}
        <section>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 px-1">
            Pending Tasks ({pendingReminders.length})
          </h2>
          {pendingReminders.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-slate-500 font-medium">No pending tasks! 🎉</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingReminders.map(reminder => (
                <ReminderCard 
                  key={reminder._id} 
                  reminder={reminder} 
                  onToggle={toggleStatus}
                  onDelete={deleteReminder}
                />
              ))}
            </div>
          )}
        </section>

        {/* Completed */}
        {completedReminders.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 px-1">
              Completed ({completedReminders.length})
            </h2>
            <div className="space-y-3 opacity-60 hover:opacity-100 transition-opacity">
              {completedReminders.map(reminder => (
                <ReminderCard 
                  key={reminder._id} 
                  reminder={reminder} 
                  onToggle={toggleStatus}
                  onDelete={deleteReminder}
                  isCompleted
                />
              ))}
            </div>
          </section>
        )}
      </div>

    </div>
  );
};

const ReminderCard = ({ reminder, onToggle, onDelete, isCompleted }) => {
  const isAssigned = !!reminder.assignedBy;
  const isFee = reminder.type === "fee_reminder";
  
  let borderColor = isCompleted ? 'border-slate-100' : 'border-slate-200 shadow-sm';
  if (!isCompleted) {
    if (isFee) borderColor = 'border-red-200 bg-red-50/30';
    else if (isAssigned) borderColor = 'border-blue-200 bg-blue-50/30';
  }

  // Prevent deletion of assigned reminders unless they are completed
  const canDelete = !isAssigned || isCompleted;

  return (
    <div className={`group flex items-start gap-4 p-4 rounded-2xl border ${borderColor} transition-all hover:border-brand-200`}>
      
      {/* Checkbox */}
      <button 
        onClick={() => onToggle(reminder._id, reminder.status)}
        className="mt-0.5 flex-shrink-0 text-slate-400 hover:text-brand-600 transition-colors"
      >
        {isCompleted ? (
          <CheckCircle2 className="text-emerald-500" size={24} />
        ) : (
          <Circle size={24} />
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className={`text-base font-bold ${isCompleted ? 'text-slate-500 line-through' : (isFee ? 'text-red-700' : 'text-slate-800')}`}>
            {reminder.title}
          </h3>
          {isAssigned && !isCompleted && (
            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${isFee ? 'text-red-600 bg-red-100 border-red-200' : 'text-blue-600 bg-blue-100 border-blue-200'}`}>
              {isFee ? 'Fee Notice' : 'Assigned'}
            </span>
          )}
        </div>
        
        {reminder.description && (
          <p className={`${isCompleted ? 'text-slate-400' : 'text-slate-600'} text-sm break-words`}>
            {reminder.description}
          </p>
        )}
        
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {reminder.dueDate && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-white w-fit px-2.5 py-1 rounded-md border border-slate-100 shadow-sm">
              <CalendarIcon size={12} />
              {new Date(reminder.dueDate).toLocaleDateString()}
            </div>
          )}
          
          {isAssigned && reminder.assignedBy && (
             <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-white w-fit px-2.5 py-1 rounded-md border border-slate-100 shadow-sm">
               <UserIcon size={12} />
               Sent by {reminder.assignedBy.name} ({reminder.assignedBy.role})
             </div>
          )}
        </div>
      </div>

      {/* Delete */}
      {canDelete ? (
        <button 
          onClick={() => onDelete(reminder._id)}
          className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 p-2 transition-all"
          title="Delete Reminder"
        >
          <Trash2 size={18} />
        </button>
      ) : (
        <div className="p-2" title="Cannot delete assigned reminders until completed">
          <Trash2 size={18} className="text-slate-200 cursor-not-allowed" />
        </div>
      )}

    </div>
  );
};

export default Reminders;
