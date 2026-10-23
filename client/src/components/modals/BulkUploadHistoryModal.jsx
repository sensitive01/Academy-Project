import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, Clock, CheckCircle, XCircle, AlertCircle, FileSpreadsheet, Trash2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import BulkUploadDataModal from './BulkUploadDataModal';

const BulkUploadHistoryModal = ({ isOpen, onClose, module, onSuccess }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [confirmDeleteRecord, setConfirmDeleteRecord] = useState(null);
  const [revertingId, setRevertingId] = useState(null);

  useEffect(() => {
    if (isOpen && module) {
      fetchHistory();
    }
  }, [isOpen, module]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/bulk-upload-history/${module}`);
      setHistory(data);
    } catch (error) {
      toast.error('Failed to load upload history');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (fileUrl) => {
    window.open(fileUrl, '_blank');
  };

  const handleConfirmRevert = async () => {
    if (!confirmDeleteRecord) return;
    setRevertingId(confirmDeleteRecord._id);
    const toastId = toast.loading(`Reverting ${module || ''} bulk upload records...`);
    try {
      const res = await api.delete(`/bulk-upload-history/${confirmDeleteRecord._id}`);
      toast.success(res.data?.message || 'Bulk upload reverted and deleted successfully!', { id: toastId });
      setConfirmDeleteRecord(null);
      await fetchHistory();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to revert bulk upload', { id: toastId });
    } finally {
      setRevertingId(null);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{module} Upload History</h2>
            <p className="text-xs font-medium text-slate-500 mt-1">Timeline of all bulk uploads for this module.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No upload history found.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {history.map((entry, index) => (
                <div key={entry._id} className="relative pl-6 pb-6 last:pb-0">
                  {/* Timeline Line */}
                  {index !== history.length - 1 && (
                    <div className="absolute left-[11px] top-8 bottom-0 w-[2px] bg-slate-200"></div>
                  )}

                  {/* Timeline Dot */}
                  <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full flex items-center justify-center border-4 border-slate-50
                    ${entry.status === 'Success' ? 'bg-emerald-500' : entry.status === 'Partial' ? 'bg-amber-500' : 'bg-red-500'}`}
                  ></div>

                  {/* Content Card */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

                      {/* Left Info */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">#{index + 1}</span>
                          <button
                            onClick={() => setSelectedRecord(entry)}
                            className="font-bold text-slate-900 hover:text-brand-600 hover:underline flex items-center gap-1.5 text-left"
                          >
                            <FileSpreadsheet size={16} className="text-emerald-500" />
                            {entry.fileName}
                          </button>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider
                            ${entry.status === 'Success' ? 'bg-emerald-100 text-emerald-700' :
                              entry.status === 'Partial' ? 'bg-amber-100 text-amber-700' :
                                'bg-red-100 text-red-700'}`}
                          >
                            {entry.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {new Date(entry.createdAt).toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            By {entry.uploadedBy?.name || 'Unknown'}
                          </span>
                        </div>
                        {entry.summary && (
                          <div className="text-xs font-medium text-slate-600 mt-2 bg-slate-50 p-2 rounded-lg inline-block">
                            {entry.summary}
                          </div>
                        )}
                      </div>

                      {/* Right Stats & Action */}
                      <div className="flex items-center gap-4">
                        <div className="flex gap-4">
                          <div className="text-center">
                            <div className="text-xs font-bold text-slate-500 mb-1">Total</div>
                            <div className="text-sm font-black text-slate-900">{entry.totalRecords}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs font-bold text-emerald-600 mb-1 flex items-center gap-1"><CheckCircle size={12} /> Success</div>
                            <div className="text-sm font-black text-emerald-700">{entry.successfulRecords}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs font-bold text-red-600 mb-1 flex items-center gap-1"><XCircle size={12} /> Failed</div>
                            <div className="text-sm font-black text-red-700">{entry.failedRecords}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {entry.fileUrl && (
                            <button
                              onClick={() => handleDownload(entry.fileUrl)}
                              className="flex items-center justify-center w-10 h-10 bg-brand-50 text-brand-600 hover:bg-brand-600 hover:text-white rounded-xl transition-colors border border-brand-200"
                              title="Download Original File"
                            >
                              <Download size={18} />
                            </button>
                          )}

                          <button
                            onClick={() => setConfirmDeleteRecord(entry)}
                            disabled={revertingId === entry._id}
                            className="flex items-center justify-center w-10 h-10 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-colors border border-red-200 disabled:opacity-50"
                            title="Revert and delete this bulk upload data"
                          >
                            {revertingId === entry._id ? (
                              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 size={18} />
                            )}
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedRecord && (
        <BulkUploadDataModal
          isOpen={!!selectedRecord}
          historyRecord={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}

      {/* Confirmation Modal */}
      {confirmDeleteRecord && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Revert & Delete Upload?</h3>
            <p className="text-sm text-slate-600 mb-4">
              Are you sure you want to revert and delete <strong className="text-slate-800">{confirmDeleteRecord.fileName}</strong>?
            </p>
            <div className="bg-red-50/80 border border-red-100 rounded-xl p-3 text-left mb-6 text-xs text-red-800 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle size={14} className="shrink-0" />
                This will automatically:
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-red-700 pl-1">
                {(confirmDeleteRecord.module || module) === 'Fees' && (
                  <>
                    <li>Remove all <strong>{confirmDeleteRecord.successfulRecords || confirmDeleteRecord.totalRecords}</strong> payment records created by this file.</li>
                    <li>Restore affected students' fee balances and reset their status back to <strong>pending</strong>.</li>
                    <li>Preserve the student records and base fee structures safely.</li>
                  </>
                )}
                {(confirmDeleteRecord.module || module) === 'Students' && (
                  <>
                    <li>Remove student profiles and user logins created by this upload file.</li>
                    <li>Unlink students from their assigned batches.</li>
                    <li>Delete associated initial fee structures safely.</li>
                  </>
                )}
                
                {(confirmDeleteRecord.module || module) === 'Attendance' && (
                  <>
                    <li>Remove attendance records created by this upload file.</li>
                    <li>Leave manual punches and device attendance untouched.</li>
                  </>
                )}
                {(confirmDeleteRecord.module || module) === 'Marks' && (
                  <>
                    <li>Clear exam marks and grades recorded by this upload batch.</li>
                    <li>Preserve student course enrollments and exam schedules.</li>
                  </>
                )}
                {(confirmDeleteRecord.module || module) === 'Payroll' && (
                  <>
                    <li>Revert salary adjustments, allowances, and deductions from this file.</li>
                    <li>Automatically recalculate affected employees' net salaries.</li>
                  </>
                )}
              </ul>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={revertingId !== null}
                onClick={() => setConfirmDeleteRecord(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={revertingId !== null}
                onClick={handleConfirmRevert}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-200"
              >
                {revertingId ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Reverting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Yes, Revert & Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default BulkUploadHistoryModal;
