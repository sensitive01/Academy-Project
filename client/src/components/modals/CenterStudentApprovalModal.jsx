import React, { useState, useEffect } from "react";
import { X, Save, FileText, CheckCircle, IndianRupee, Wallet, Upload } from "lucide-react";
import DocumentUploadModal from "./DocumentUploadModal";
import api from "../../services/api";
import toast from "react-hot-toast";

const CenterStudentApprovalModal = ({ isOpen, onClose, student, students, onApprove, onBulkApprove }) => {
  const [loading, setLoading] = useState(false);
  const [feeForm, setFeeForm] = useState({ councilFee: "", courseFee: "", selectedScheme: "" });
  const [localDocuments, setLocalDocuments] = useState([]);
  const [showDocumentModal, setShowDocumentModal] = useState(false);

  const isBulk = Array.isArray(students) && students.length > 0;
  const targetStudents = isBulk ? students : (student ? [student] : []);

  useEffect(() => {
    if (!isBulk && student) {
      setFeeForm({
        councilFee: student.councilFee || "",
        courseFee: student.courseFee || "",
        selectedScheme: student.paymentScheme || ""
      });
      setLocalDocuments(student.documents || []);
    } else if (isBulk) {
      setFeeForm({ councilFee: "", courseFee: "", selectedScheme: "" });
      setLocalDocuments([]);
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
    <div className="w-full min-h-screen bg-slate-50 flex flex-col animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="px-8 py-6 border-b border-slate-200 flex items-center justify-between bg-white shadow-sm">
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
        <div className="flex-1 p-4 md:p-8">
          <div className="max-w-6xl mx-auto flex flex-col gap-8 pb-20">
            
            {/* Left Col: Uploaded Documents or Selected Students */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <FileText size={16} className="text-brand-600" /> 
                  {isBulk ? 'Selected Students' : 'Documents'}
                </h3>
                {!isBulk && (
                  <button 
                    onClick={() => setShowDocumentModal(true)}
                    className="flex items-center gap-1 text-[10px] bg-brand-50 text-brand-700 px-2 py-1 rounded-md font-bold hover:bg-brand-100 transition-colors"
                  >
                    <Upload size={12} /> Upload
                  </button>
                )}
              </div>
              <div className="bg-white rounded-xl p-5 border border-slate-200 flex flex-col gap-3 shadow-sm">
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
                  localDocuments && localDocuments.length > 0 ? (
                    localDocuments.map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-bold text-slate-700 truncate">{doc.name || doc.docType || doc.title || `Document ${idx+1}`}</p>
                          <p className="text-[10px] text-slate-500">Document Uploaded</p>
                        </div>
                        <a href={doc.url || (api.defaults.baseURL.replace('/api', '') + doc.fileUrl)} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline text-xs font-bold shrink-0">
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

            {/* Middle Col: Payments */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Wallet size={16} className="text-brand-600" /> Payments
              </h3>
              <div className="bg-white rounded-xl p-5 border border-slate-200 flex flex-col sm:flex-row gap-4 shadow-sm">
                {!isBulk && student ? (
                  <>
                    <div className="flex-1 flex flex-col gap-3">
                      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                        <p className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-100 pb-2">Scholarship Payment</p>
                        <div className="grid grid-cols-2 gap-y-3 text-[11px]">
                          <span className="text-slate-500 font-medium">Total Fee:</span> 
                          <span className="font-black text-slate-800 text-right">₹{student.scholarshipFeeSummary?.total || 0}</span>
                          
                          <span className="text-slate-500 font-medium">Amount Paid:</span> 
                          <span className="font-black text-emerald-600 text-right">₹{student.scholarshipFeeSummary?.paid || 0}</span>
                          
                          <span className="text-slate-500 font-medium">Balance:</span> 
                          <span className="font-black text-rose-600 text-right">₹{student.scholarshipFeeSummary?.balance || 0}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Payment History</p>
                        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                          {student.scholarshipFeeSummary?.history?.length > 0 ? (
                            student.scholarshipFeeSummary.history.map((h, i) => (
                              <div key={i} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[10px] flex justify-between items-center">
                                <div>
                                  <p className="font-black text-emerald-600 text-xs">₹{h.amount}</p>
                                  <p className="text-slate-500">{new Date(h.date).toLocaleDateString('en-IN')}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-slate-700">{h.paymentMode || 'N/A'}</p>
                                  <p className={`font-bold ${h.status === 'Approved' ? 'text-emerald-500' : 'text-amber-500'}`}>{h.status}</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-[10px] text-slate-400 italic px-1">No payments found</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col gap-3">
                      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                        <p className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-100 pb-2">Admission Payment</p>
                        <div className="grid grid-cols-2 gap-y-3 text-[11px]">
                          <span className="text-slate-500 font-medium">Total Fee:</span> 
                          <span className="font-black text-slate-800 text-right">₹{student.admissionFeeSummary?.total || 0}</span>
                          
                          <span className="text-slate-500 font-medium">Amount Paid:</span> 
                          <span className="font-black text-emerald-600 text-right">₹{student.admissionFeeSummary?.paid || 0}</span>
                          
                          <span className="text-slate-500 font-medium">Balance:</span> 
                          <span className="font-black text-rose-600 text-right">₹{student.admissionFeeSummary?.balance || 0}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Payment History</p>
                        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                          {student.admissionFeeSummary?.history?.length > 0 ? (
                            student.admissionFeeSummary.history.map((h, i) => (
                              <div key={i} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[10px] flex justify-between items-center">
                                <div>
                                  <p className="font-black text-emerald-600 text-xs">₹{h.amount}</p>
                                  <p className="text-slate-500">{new Date(h.date).toLocaleDateString('en-IN')}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-slate-700">{h.paymentMode || 'N/A'}</p>
                                  <p className={`font-bold ${h.status === 'Approved' ? 'text-emerald-500' : 'text-amber-500'}`}>{h.status}</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-[10px] text-slate-400 italic px-1">No payments found</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-slate-500 italic">Payments overview not available in bulk mode.</p>
                )}
              </div>
            </div>

            {/* Right Col: Fees Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <IndianRupee size={16} className="text-brand-600" /> Fees Allocation System
              </h3> 
              <div className="bg-white rounded-xl p-5 border border-slate-200 flex flex-col gap-4 shadow-sm">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Council Fees</label>
                  <input 
                    type="text" 
                    value={feeForm.councilFee ? Number(feeForm.councilFee).toLocaleString('en-IN') : ''}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/,/g, '');
                      if (/^\d*$/.test(raw)) setFeeForm(p => ({ ...p, councilFee: raw }));
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm " 
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
                </div>

                <div className="space-y-1.5 pt-2">
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

            {/* Actions */}
            <div className="w-full flex justify-end gap-3 px-1 mt-4">
              <button 
                onClick={onClose} 
                className="px-6 py-2.5 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 rounded-xl text-sm font-bold transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleApprove}
                disabled={loading}
                className="px-8 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-70"
              >
                {loading ? <span className="animate-pulse">Processing...</span> : (
                  <>
                    <CheckCircle size={18} /> Approve & Move to Center
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      
      <DocumentUploadModal
        isOpen={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        student={student ? { ...student, documents: localDocuments } : null}
        onUpdate={(docs) => setLocalDocuments(docs)}
      />
    </div>
  );
};

export default CenterStudentApprovalModal;
