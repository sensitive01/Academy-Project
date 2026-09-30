import React, { useState, useEffect } from "react";
import { X, Save, FileText, CheckCircle, IndianRupee } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

const CenterStudentApprovalModal = ({ isOpen, onClose, student, students, onApprove, onBulkApprove }) => {
  const [loading, setLoading] = useState(false);
  const [feeForm, setFeeForm] = useState({ councilFee: "", courseFee: "", selectedScheme: "" });

  const isBulk = Array.isArray(students) && students.length > 0;
  const targetStudents = isBulk ? students : (student ? [student] : []);

  useEffect(() => {
    if (!isBulk && student) {
      setFeeForm({
        councilFee: student.councilFee || "",
        courseFee: student.courseFee || "",
        selectedScheme: student.paymentScheme || ""
      });
    } else if (isBulk) {
      setFeeForm({ councilFee: "", courseFee: "", selectedScheme: "" });
    }
  }, [student, students, isBulk]);

  if (!isOpen || targetStudents.length === 0) return null;

  const handleApprove = async () => {
    if (Number(feeForm.courseFee) > 0 && !feeForm.selectedScheme) {
      toast.error("Please select a course fee payment scheme!");
      return;
    }

    setLoading(true);
    try {
      const cFeeAmt = Number(feeForm.councilFee) || 0;
      const crsFeeAmt = Number(feeForm.courseFee) || 0;

      await Promise.all(targetStudents.map(async (s) => {
        const currentYearMatch = s.year?.match(/\d+/);
        const currentYear = currentYearMatch ? currentYearMatch[0] : "1";
        
        let finalFees = [];
        if (cFeeAmt > 0) {
          finalFees.push({ feeType: 'Other', otherFeeType: 'Council Fees', name: `Council Fees - Year ${currentYear}`, amount: cFeeAmt, year: currentYear });
        }
        if (crsFeeAmt > 0) {
          finalFees.push({ feeType: 'Course', otherFeeType: 'Course Fees', name: `Course Fees - Year ${currentYear}`, amount: crsFeeAmt, year: currentYear });
        }

        await api.put(`/students/${s._id}`, {
          councilFee: cFeeAmt,
          courseFee: crsFeeAmt,
          paymentScheme: feeForm.selectedScheme,
          fees: finalFees
        });
      }));

      if (isBulk && onBulkApprove) {
        await onBulkApprove(targetStudents.map(s => s._id), 'joined');
      } else if (onApprove) {
        await onApprove(student._id, 'joined');
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to approve and save fees.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {isBulk ? `Review & Approve ${targetStudents.length} Students` : 'Review & Approve Student'}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {isBulk ? "Bulk Approval" : `${student?.user?.name || 'Unknown'} - ${student?.studentId || 'N/A'}`}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Col: Uploaded Documents or Selected Students */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FileText size={16} className="text-brand-600" /> 
                {isBulk ? 'Selected Students' : 'Uploaded Documents'}
              </h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col gap-3 h-[300px] overflow-y-auto">
                {isBulk ? (
                  <ul className="space-y-2">
                    {targetStudents.map(s => (
                      <li key={s._id} className="text-xs font-bold text-slate-700 p-2 bg-white rounded border border-slate-200 shadow-sm flex flex-col gap-0.5">
                        <span className="text-brand-700">{s.user?.name}</span>
                        <span className="text-slate-400 text-[10px]">{s.studentId}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  student?.documents && student.documents.length > 0 ? (
                    student.documents.map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                        <div>
                          <p className="text-xs font-bold text-slate-700">{doc.docType || doc.title}</p>
                          <p className="text-[10px] text-slate-500">Document Uploaded</p>
                        </div>
                        <a href={api.defaults.baseURL.replace('/api', '') + doc.fileUrl} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline text-xs font-bold">
                          View
                        </a>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 italic">No documents uploaded.</p>
                  )
                )}
              </div>
            </div>

            {/* Right Col: Fees Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <IndianRupee size={16} className="text-brand-600" /> Fees Allocation System
              </h3>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-4">
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Council Fees</label>
                  <input 
                    type="text" 
                    value={feeForm.councilFee ? Number(feeForm.councilFee).toLocaleString('en-IN') : ''}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/,/g, '');
                      if (/^\d*$/.test(raw)) setFeeForm(p => ({ ...p, councilFee: raw }));
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500" 
                    placeholder="e.g. 2,00,000"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Course Fees</label>
                  <input 
                    type="text" 
                    value={feeForm.courseFee ? Number(feeForm.courseFee).toLocaleString('en-IN') : ''}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/,/g, '');
                      if (/^\d*$/.test(raw)) setFeeForm(p => ({ ...p, courseFee: raw }));
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500" 
                    placeholder="e.g. 3,00,000"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Payment Scheme</label>
                  <select 
                    value={feeForm.selectedScheme}
                    onChange={(e) => setFeeForm(p => ({ ...p, selectedScheme: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">Select Scheme</option>
                    <option value="monthly">Monthly Scheme (Total / 12 Months)</option>
                    <option value="sem">Semester Scheme (Total / 2 Semesters)</option>
                    <option value="term3">Term Scheme (Total / 3 Terms)</option>
                    <option value="term4">Term Scheme (Total / 4 Terms)</option>
                  </select>
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-sm font-bold transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleApprove}
            disabled={loading}
            className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2"
          >
            {loading ? <span className="animate-pulse">Processing...</span> : (
              <>
                <CheckCircle size={16} /> Approve & Move to Center
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CenterStudentApprovalModal;
