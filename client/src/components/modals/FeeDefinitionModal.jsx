import React, { useState, useEffect } from 'react';
import { X, Save, IndianRupee } from 'lucide-react';
import Select from 'react-select';
import toast from 'react-hot-toast';
import api from '../../services/api';

const FeeDefinitionModal = ({ isOpen, onClose, batch }) => {
  const [selectedCenters, setSelectedCenters] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [admissionFee, setAdmissionFee] = useState('');
  const [scholarshipFee, setScholarshipFee] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when modal opens with a new batch
  useEffect(() => {
    if (isOpen) {
      setSelectedCenters([]);
      setSelectedCourses([]);
      setAdmissionFee('');
      setScholarshipFee('');
    }
  }, [isOpen, batch]);

  const formatAmount = (val) => {
    if (!val) return '';
    const number = val.toString().replace(/\D/g, '');
    if (!number) return '';
    return Number(number).toLocaleString('en-IN');
  };

  const parseAmount = (val) => {
    if (!val) return 0;
    return Number(val.toString().replace(/\D/g, ''));
  };

  if (!isOpen || !batch) return null;

  const centerOptions = batch.centers?.map(c => ({ value: c._id, label: c.name })) || [];
  const courseOptions = batch.courses?.map(c => ({ value: c._id, label: c.title || c.name })) || [];

  const handleSave = async (e) => {
    e.preventDefault();
    if (selectedCenters.length === 0 || selectedCourses.length === 0) {
      toast.error('Please select at least one center and one course.');
      return;
    }
    if (!admissionFee || !scholarshipFee) {
      toast.error('Please enter both admission and scholarship fees.');
      return;
    }

    try {
      setIsSaving(true);
      
      const payload = {
        centers: selectedCenters.map(c => c.value),
        courses: selectedCourses.map(c => c.value),
        admissionFee: parseAmount(admissionFee),
        scholarshipFee: parseAmount(scholarshipFee)
      };
      
      await api.post(`/batches/${batch._id}/fees`, payload);
      
      toast.success('Fee structure defined successfully!');
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save fee structure.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <IndianRupee className="text-brand-600" size={24} />
              Define Fees
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-1">Batch: {batch.name}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 overflow-y-auto">
          <form id="fee-form" onSubmit={handleSave} className="space-y-6">
            
            {/* Centers Selection */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">Select Centers</label>
              <Select
                isMulti
                options={centerOptions}
                value={selectedCenters}
                onChange={setSelectedCenters}
                placeholder="Select one or more centers..."
                className="react-select-container"
                classNamePrefix="react-select"
              />
            </div>
            
            {/* Courses Selection */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">Select Courses</label>
              <Select
                isMulti
                options={courseOptions}
                value={selectedCourses}
                onChange={setSelectedCourses}
                placeholder="Select one or more courses..."
                className="react-select-container"
                classNamePrefix="react-select"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Admission Fee */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Admission Fee (₹)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IndianRupee size={16} className="text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={admissionFee}
                    onChange={(e) => setAdmissionFee(formatAmount(e.target.value))}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all font-medium text-slate-700"
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              {/* Scholarship Fee */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Scholarship Fee (₹)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IndianRupee size={16} className="text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={scholarshipFee}
                    onChange={(e) => setScholarshipFee(formatAmount(e.target.value))}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all font-medium text-slate-700"
                    placeholder="0"
                    required
                  />
                </div>
              </div>
            </div>

          </form>
        </div>
        
        {/* Footer */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="fee-form"
            disabled={isSaving}
            className="px-6 py-2.5 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm shadow-brand-500/20"
          >
            {isSaving ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <Save size={18} />
            )}
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeeDefinitionModal;
