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
  ChevronLeft,
  ChevronRight,
  LayoutDashboard
} from "lucide-react";
import Loading from "../../components/common/Loading";
import ConfirmationModal from "../../components/modals/ConfirmationModal";

const Reminders = () => {
  const [reminders, setReminders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, seriesId: null });
  const [dayViewModal, setDayViewModal] = useState({ isOpen: false, day: null, date: null, events: [] });

  const executeDelete = async (type = 'single') => {
    const { id, seriesId } = confirmModal;
    if (!id) return;
    try {
      if (type === 'series' && seriesId) {
        await api.delete(`/reminders/series/${seriesId}`);
        setReminders(prev => prev.filter(r => r.seriesId !== seriesId));
        if (dayViewModal.isOpen) {
          setDayViewModal(prev => ({
            ...prev,
            events: prev.events.filter(r => r.seriesId !== seriesId)
          }));
        }
      } else {
        await api.delete(`/reminders/${id}`);
        setReminders(prev => prev.filter(r => r._id !== id));
        if (dayViewModal.isOpen) {
          setDayViewModal(prev => ({
            ...prev,
            events: prev.events.filter(r => r._id !== id)
          }));
        }
      }
    } catch (error) {
      console.error("Error deleting reminder", error);
      alert(error?.response?.data?.message || "Error deleting reminder");
    } finally {
      setConfirmModal({ isOpen: false, id: null, seriesId: null });
    }
  };

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [remindBeforeDays, setRemindBeforeDays] = useState(0);
  const [isMonthly, setIsMonthly] = useState(false);

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());

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
    if (isSaving) return; // prevent double submission
    if (!title.trim()) return;
    setIsSaving(true);
    try {
      const payload = { title, description };
      if (dueDate) payload.dueDate = dueDate;
      payload.remindBeforeDays = remindBeforeDays;
      payload.isMonthly = isMonthly;

      const res = await api.post("/reminders", payload);
      if (Array.isArray(res.data)) {
        setReminders([...res.data, ...reminders]);
      } else {
        setReminders([res.data, ...reminders]);
      }
      
      // Reset form
      setTitle("");
      setDescription("");
      setDueDate("");
      setRemindBeforeDays(0);
      setIsMonthly(false);
      setIsAdding(false);
    } catch (error) {
      console.error("Error adding reminder", error);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteReminder = (r, e) => {
    if (e) e.stopPropagation(); // prevent clicking the day cell
    setConfirmModal({ isOpen: true, id: r._id, seriesId: r.seriesId });
  };

  const toggleStatus = async (id, currentStatus, e) => {
    e.stopPropagation();
    const newStatus = currentStatus === "pending" ? "completed" : "pending";
    
    setReminders(reminders.map(r => r._id === id ? { ...r, status: newStatus } : r));

    try {
      await api.put(`/reminders/${id}`, { status: newStatus });
    } catch (error) {
      console.error("Error toggling reminder", error);
      setReminders(reminders.map(r => r._id === id ? { ...r, status: currentStatus } : r));
    }
  };

  if (isLoading) return <Loading />;

  const pendingReminders = reminders.filter(r => r.status === "pending");
  const completedReminders = reminders.filter(r => r.status === "completed");

  // Calendar logic
  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();
  
  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const handleDateClick = (day, dayEvents) => {
    if (!day) return;
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setDayViewModal({
      isOpen: true,
      day: day,
      date: clickedDate,
      events: dayEvents
    });
  };

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

      {/* Calendar View */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <CalendarIcon className="text-brand-500" />
            {monthName} {year}
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={goToday} className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
              Today
            </button>
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1">
              <button onClick={prevMonth} className="p-1 hover:bg-white hover:shadow-sm rounded text-slate-500 transition-all">
                <ChevronLeft size={18} />
              </button>
              <button onClick={nextMonth} className="p-1 hover:bg-white hover:shadow-sm rounded text-slate-500 transition-all">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-7 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-black text-slate-400 uppercase tracking-widest py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, idx) => {
              let dayEvents = [];
              let isToday = false;
              if (day) {
                const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                isToday = new Date().toDateString() === dateObj.toDateString();
                
                reminders.forEach(r => {
                  if (r.dueDate) {
                    const dDate = new Date(r.dueDate);
                    const calDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                    const dDateNoTime = new Date(dDate.getFullYear(), dDate.getMonth(), dDate.getDate());
                    
                    const diffTime = dDateNoTime.getTime() - calDate.getTime();
                    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                    
                    if (diffDays === 0) {
                      dayEvents.push({ ...r, isReminderFor: false });
                    }
                  }
                });
              }

              return (
                <div 
                  key={idx} 
                  onClick={() => handleDateClick(day, dayEvents)}
                  className={`min-h-[120px] border rounded-xl p-2 transition-all ${!day ? 'bg-slate-50/50 border-transparent' : 'bg-white border-slate-100 hover:border-brand-300 hover:shadow-md cursor-pointer'} ${isToday ? 'ring-2 ring-brand-500 ring-offset-1' : ''}`}
                >
                  {day && (
                    <>
                      <div className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-brand-500 text-white' : 'text-slate-600'}`}>
                        {day}
                      </div>
                      <div className="space-y-1 overflow-y-auto max-h-[85px] no-scrollbar">
                        {dayEvents.map((r, i) => {
                          const canDelete = !r.assignedBy || r.status === 'completed';
                          return (
                            <div 
                              key={`${r._id}-${i}`} 
                              className={`group relative text-[10px] font-bold pl-1.5 pr-5 py-1 rounded flex items-center justify-between ${r.status === 'completed' ? 'bg-slate-100 text-slate-400 line-through' : r.type === 'fee_reminder' ? 'bg-red-50 text-red-600' : r.isReminderFor ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-brand-50 text-brand-600'}`}
                              title={r.title}
                            >
                              <div className="truncate flex-1" onClick={(e) => toggleStatus(r._id, r.status, e)}>
                                {r.isReminderFor ? `🔔 Reminder: ${r.title}` : r.title}
                              </div>
                              {canDelete && (
                                <button 
                                  onClick={(e) => deleteReminder(r, e)}
                                  className="absolute right-1 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
                                >
                                  <X size={12} />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Day View Modal */}
      {dayViewModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md max-h-[80vh] flex flex-col rounded-3xl shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50 rounded-t-3xl flex-shrink-0">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <CalendarIcon className="text-brand-600" size={18} /> 
                {dayViewModal.date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
              </h2>
              <button 
                onClick={() => setDayViewModal({ ...dayViewModal, isOpen: false })} 
                className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-3">
              {dayViewModal.events.length === 0 ? (
                <div className="text-center text-slate-400 py-8 font-medium">
                  No reminders for this day.
                </div>
              ) : (
                dayViewModal.events.map((r, i) => (
                  <div key={i} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col gap-2 relative group">
                    <div className="flex items-start justify-between gap-4">
                      <div className="font-bold text-slate-800 flex flex-wrap items-center gap-2">
                        {r.isReminderFor && <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 tracking-wider">Reminder</span>}
                        <span className={r.status === 'completed' ? 'line-through text-slate-400' : ''}>{r.title}</span>
                      </div>
                      <button 
                        onClick={(e) => deleteReminder(r, e)}
                        className="text-slate-300 hover:text-red-500 transition-colors p-1 flex-shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    {r.description && <div className="text-xs text-slate-500 line-clamp-2">{r.description}</div>}
                    <div className="flex items-center gap-3 mt-2">
                      <button 
                        onClick={(e) => { toggleStatus(r._id, r.status, e); setDayViewModal({...dayViewModal, isOpen: false}) }}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${r.status === 'completed' ? 'bg-slate-200 text-slate-600 hover:bg-slate-300' : 'bg-brand-100 text-brand-700 hover:bg-brand-200'}`}
                      >
                        {r.status === 'completed' ? 'Mark Pending' : 'Mark Completed'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 border-t border-slate-100 flex-shrink-0">
              <button
                onClick={() => {
                  const clickedDate = dayViewModal.date;
                  const yyyy = clickedDate.getFullYear();
                  const mm = String(clickedDate.getMonth() + 1).padStart(2, '0');
                  const dd = String(clickedDate.getDate()).padStart(2, '0');
                  setDueDate(`${yyyy}-${mm}-${dd}`);
                  setDayViewModal({ ...dayViewModal, isOpen: false });
                  setIsAdding(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-brand-600 hover:bg-brand-700 text-white transition-all active:scale-95 shadow-lg shadow-brand-500/30"
              >
                <Plus size={18} />
                Add New Reminder For This Day
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Reminder Modal Popup */}
      {isAdding && (
        <div className="fixed inset-0 z-[100] p-4 sm:p-6 md:p-12 overflow-y-auto bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl mx-auto rounded-3xl shadow-2xl relative animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50 rounded-t-3xl">
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

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Remind Before (Days)</label>
                <input
                  type="number"
                  min="0"
                  value={remindBeforeDays}
                  onChange={(e) => setRemindBeforeDays(e.target.value)}
                  placeholder="e.g. 6"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-medium rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isMonthly"
                  checked={isMonthly}
                  onChange={(e) => setIsMonthly(e.target.checked)}
                  className="w-4 h-4 text-brand-600 bg-slate-50 border-slate-300 rounded focus:ring-brand-500 focus:ring-2"
                />
                <label htmlFor="isMonthly" className="text-sm font-bold text-slate-700">
                  Repeat Every Month (For Current Year)
                </label>
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

      {/* Delete Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden p-6 text-center">
            <h3 className="text-xl font-black text-slate-800 mb-2">Delete Reminder</h3>
            <p className="text-slate-500 text-sm mb-6">Are you sure you want to delete this reminder?</p>
            
            <div className="space-y-3">
              <button 
                onClick={() => executeDelete('single')}
                className="w-full py-3 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                Delete {confirmModal.seriesId ? 'Only This Event' : 'Event'}
              </button>
              
              {confirmModal.seriesId && (
                <button 
                  onClick={() => executeDelete('series')}
                  className="w-full py-3 rounded-xl font-bold bg-rose-100 hover:bg-rose-200 text-red-700 transition-colors border border-rose-200"
                >
                  Delete Entire Series (All Months)
                </button>
              )}
              
              <button 
                onClick={() => setConfirmModal({ isOpen: false, id: null, seriesId: null })}
                className="w-full py-3 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reminders;
