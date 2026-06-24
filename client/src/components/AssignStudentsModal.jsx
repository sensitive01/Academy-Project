import React, { useState, useEffect, useRef } from 'react';
import { X, Users, Check, Save, Plus, Search } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AssignStudentsModal = ({ batch, onClose, onAssignSuccess }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudentIds, setSelectedStudentIds] = useState(
    batch.students ? batch.students.map(s => typeof s === 'object' ? s._id : s) : []
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await api.get('/students');
        const studentsList = response.data.students || [];
        // Filter students enrolled in the same course as the batch
        const filteredStudents = studentsList.filter(st => {
          if (!st.enrolledCourses) return false;
          return st.enrolledCourses.some(ec => 
            ec.course && 
            (typeof ec.course === 'object' ? ec.course._id : ec.course) === 
            (typeof batch.course === 'object' ? batch.course._id : batch.course)
          );
        });
        setStudents(filteredStudents);
      } catch (error) {
        toast.error("Failed to load students");
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [batch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectStudent = (id) => {
    if (!selectedStudentIds.includes(id)) {
      setSelectedStudentIds(prev => [...prev, id]);
    }
    setSearchQuery('');
    setShowDropdown(false);
  };

  const handleRemoveStudent = (id) => {
    setSelectedStudentIds(prev => prev.filter(sid => sid !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post(`/batches/${batch._id}/assign-students`, {
        studentIds: selectedStudentIds
      });
      toast.success("Students assigned successfully");
      onAssignSuccess(data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to assign students");
    }
  };

  const availableStudents = students.filter(s => !selectedStudentIds.includes(s._id));
  const filteredDropdown = availableStudents.filter(s => 
    s.studentNameEnglish?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.studentId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-start justify-center p-4 py-10">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl scale-in-center">
        <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-50 text-brand-600 rounded-xl shadow-sm">
              <Users size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                Assign Students
              </h2>
              <p className="text-sm text-brand-600 font-semibold mt-1">Batch: {batch.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Search Dropdown Section */}
          <div className="relative mb-8" ref={dropdownRef}>
            <label className="block text-sm font-bold text-gray-700 mb-2">Search & Add Students</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input 
                type="text" 
                placeholder={loading ? "Loading students..." : "Type a name or ID to search..."} 
                className="w-full rounded-xl border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 border py-3 pl-10 pr-4 text-sm disabled:bg-gray-50 disabled:text-gray-400 transition-colors"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                disabled={loading}
              />
            </div>
            
            {showDropdown && (searchQuery.length > 0 || filteredDropdown.length > 0) && (
              <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto py-2">
                {filteredDropdown.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">No matching students found</div>
                ) : (
                  filteredDropdown.map(st => (
                    <div 
                      key={st._id}
                      className="px-4 py-3 hover:bg-brand-50 cursor-pointer flex justify-between items-center transition-colors group"
                      onMouseDown={(e) => {
                        e.preventDefault(); // Prevent input blur
                        handleSelectStudent(st._id);
                      }}
                    >
                      <div>
                        <div className="font-semibold text-gray-900 text-sm group-hover:text-brand-700 transition-colors">{st.studentNameEnglish}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{st.studentId}</div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-brand-100 transition-colors">
                        <Plus size={16} className="text-brand-600" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Selected Items Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-800">
                Selected Students <span className="bg-brand-100 text-brand-700 py-0.5 px-2.5 rounded-full text-xs ml-2">{selectedStudentIds.length}</span>
              </h3>
              {selectedStudentIds.length > 0 && (
                <button 
                  type="button" 
                  onClick={() => setSelectedStudentIds([])}
                  className="text-xs font-semibold text-red-600 hover:text-red-800 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
            
            {selectedStudentIds.length === 0 ? (
              <div className="p-8 bg-gray-50 border border-dashed border-gray-300 rounded-2xl text-center flex flex-col items-center justify-center">
                <Users size={32} className="text-gray-300 mb-3" />
                <p className="text-sm font-medium text-gray-500">No students selected yet.</p>
                <p className="text-xs text-gray-400 mt-1">Search and click to add students to this batch.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                {selectedStudentIds.map(id => {
                  const st = students.find(s => s._id === id);
                  if (!st) return null;
                  return (
                    <div key={id} className="group flex items-center justify-between p-3.5 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-brand-300 hover:shadow-md transition-all">
                      <div className="flex flex-col overflow-hidden pr-3">
                        <span className="font-bold text-sm text-gray-900 truncate">{st.studentNameEnglish}</span>
                        <span className="text-xs text-gray-500 font-medium mt-0.5">{st.studentId}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveStudent(id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-red-200"
                        title="Remove student"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-600/20 transition-all hover:-translate-y-0.5 flex items-center gap-2 disabled:opacity-50 disabled:hover:translate-y-0"
              disabled={loading}
            >
              <Save size={18} /> Save Assignment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignStudentsModal;
