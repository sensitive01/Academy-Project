import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Download, Clock, CheckCircle, XCircle, ArrowLeft, FileSpreadsheet, TrendingUp, AlertCircle, BarChart2, Search, Calendar, Trash2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import BulkUploadDataModal from '../../components/modals/BulkUploadDataModal';

const BulkUploadHistoryPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const module = location.state?.module || 'Students';

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [confirmDeleteRecord, setConfirmDeleteRecord] = useState(null);
  const [revertingId, setRevertingId] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, [module]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/bulk-upload-history/${module}`);
      setHistory(data);
    } catch (error) {
      toast.error('Failed to load upload history');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (fileUrl, fileName) => {
    try {
      const toastId = toast.loading('Preparing download...');
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error('Failed to fetch file');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'bulk_upload_file.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Downloaded!', { id: toastId });
    } catch (err) {
      toast.error('Download failed. Try again.');
    }
  };

  const handleConfirmRevert = async () => {
    if (!confirmDeleteRecord) return;
    setRevertingId(confirmDeleteRecord._id);
    const toastId = toast.loading('Reverting bulk upload and updating records...');
    try {
      const res = await api.delete(`/bulk-upload-history/${confirmDeleteRecord._id}`);
      toast.success(res.data?.message || 'Bulk upload reverted and deleted successfully!', { id: toastId });
      setConfirmDeleteRecord(null);
      await fetchHistory();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to revert bulk upload', { id: toastId });
    } finally {
      setRevertingId(null);
    }
  };

  const statusConfig = (status) => {
    if (status === 'Success') return { dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', line: 'border-emerald-200' };
    if (status === 'Partial Success') return { dot: 'bg-amber-400', badge: 'bg-amber-100 text-amber-700 border-amber-200', line: 'border-amber-200' };
    return { dot: 'bg-red-500', badge: 'bg-red-100 text-red-700 border-red-200', line: 'border-red-200' };
  };

  const filteredHistory = history.filter(entry => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = !q || 
      entry.fileName?.toLowerCase().includes(q) || 
      entry.summary?.toLowerCase().includes(q) || 
      entry.uploadedBy?.name?.toLowerCase().includes(q);

    let matchesDate = true;
    if (fromDate || toDate) {
      const entryDate = new Date(entry.createdAt);
      entryDate.setHours(0, 0, 0, 0); 

      if (fromDate) {
        const fDate = new Date(fromDate);
        fDate.setHours(0, 0, 0, 0);
        if (entryDate < fDate) matchesDate = false;
      }
      if (toDate) {
        const tDate = new Date(toDate);
        tDate.setHours(23, 59, 59, 999);
        if (entryDate > tDate) matchesDate = false;
      }
    }

    return matchesSearch && matchesDate;
  });

  // Summary stats
  const totalUploads = filteredHistory.length;
  const totalSuccess = filteredHistory.reduce((a, h) => a + (h.successfulRecords || 0), 0);
  const totalFailed = filteredHistory.reduce((a, h) => a + (h.failedRecords || 0), 0);
  const totalRecords = filteredHistory.reduce((a, h) => a + (h.totalRecords || 0), 0);

  return (
    <div className="p-4 sm:p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-white hover:bg-slate-100 rounded-xl transition text-slate-500 border border-slate-200 shadow-sm shrink-0"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-black text-slate-900">{module} Upload History</h1>
          <p className="text-slate-400 text-xs font-medium mt-0.5">Timeline of all bulk uploads for this module.</p>
        </div>
      </div>

      {/* Stats Row */}
      {!loading && history.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Uploads', value: totalUploads, icon: BarChart2, color: 'text-brand-600 bg-brand-50' },
            { label: 'Total Records', value: totalRecords, icon: TrendingUp, color: 'text-indigo-600 bg-indigo-50' },
            { label: 'Successful', value: totalSuccess, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
            { label: 'Failed / Skipped', value: totalFailed, icon: AlertCircle, color: 'text-red-500 bg-red-50' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${color}`}>
                <Icon size={18} />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900">{value}</div>
                <div className="text-xs text-slate-400 font-semibold">{label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      {!loading && history.length > 0 && (
        <div className="flex flex-col lg:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm items-start lg:items-center justify-between">
          <div className="relative w-full lg:w-[400px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search file, summary, or uploader..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm font-medium"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
            <span className="text-sm font-bold text-slate-700 hidden lg:block mr-1">Filter:</span>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-full sm:w-auto">
              <Calendar size={16} className="text-slate-400 shrink-0" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-transparent border-none text-sm font-medium text-slate-700 focus:outline-none focus:ring-0 w-full"
              />
            </div>
            <span className="text-slate-400 text-sm font-bold hidden sm:block">to</span>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-full sm:w-auto">
              <Calendar size={16} className="text-slate-400 shrink-0" />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-transparent border-none text-sm font-medium text-slate-700 focus:outline-none focus:ring-0 w-full"
              />
            </div>
            
            {(searchTerm || fromDate || toDate) && (
              <button 
                onClick={() => { setSearchTerm(''); setFromDate(''); setToDate(''); }}
                className="text-sm font-bold text-slate-500 hover:text-brand-600 transition-colors sm:ml-2 whitespace-nowrap px-2"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-64 gap-3">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
              <Clock className="w-8 h-8 text-slate-300" />
            </div>
            <div className="text-center">
              <p className="text-slate-600 font-bold">No upload history yet</p>
              <p className="text-slate-400 text-sm mt-1">Upload a file first to see history here.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-black text-slate-400 uppercase tracking-wider">S.No</th>
                  <th className="text-left px-5 py-3 text-xs font-black text-slate-400 uppercase tracking-wider">File</th>
                  <th className="text-left px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-wider">Date & Time</th>
                  <th className="text-left px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-wider">Uploaded By</th>
                  <th className="text-center px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-wider">Total</th>
                  <th className="text-center px-4 py-3 text-xs font-black text-emerald-600 uppercase tracking-wider">Success</th>
                  <th className="text-center px-4 py-3 text-xs font-black text-red-500 uppercase tracking-wider">Failed</th>
                  <th className="text-center px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-center px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredHistory.map((entry, index) => {
                  const colors = statusConfig(entry.status);
                  return (
                    <tr key={entry._id} className="hover:bg-slate-50 transition-colors">
                      {/* S.No */}
                      <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold text-slate-500">
                        {index + 1}
                      </td>

                      {/* File */}
                      <td className="px-5 py-4 max-w-[200px]">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet size={16} className="text-emerald-500 shrink-0" />
                          <button 
                            onClick={() => setSelectedRecord(entry)}
                            className="text-sm font-bold text-slate-800 truncate hover:text-brand-600 hover:underline text-left" 
                            title={entry.fileName}
                          >
                            {entry.fileName}
                          </button>
                        </div>
                        {entry.summary && (
                          <p className="text-xs text-slate-400 mt-1 truncate" title={entry.summary}>{entry.summary}</p>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-sm text-slate-600 font-medium">
                          <Clock size={13} className="text-slate-400" />
                          {new Date(entry.createdAt).toLocaleString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </div>
                      </td>

                      {/* Uploaded By */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-slate-600">
                          {entry.uploadedBy?.name || 'Unknown'}
                        </span>
                      </td>

                      {/* Total */}
                      <td className="px-4 py-4 text-center">
                        <span className="text-base font-black text-slate-800">{entry.totalRecords ?? '-'}</span>
                      </td>

                      {/* Success */}
                      <td className="px-4 py-4 text-center">
                        <span className="text-base font-black text-emerald-600">{entry.successfulRecords ?? '-'}</span>
                      </td>

                      {/* Failed */}
                      <td className="px-4 py-4 text-center">
                        <span className="text-base font-black text-red-500">{entry.failedRecords ?? '-'}</span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border uppercase tracking-wide ${colors.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`}></span>
                          {entry.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {entry.fileUrl && (
                            <button
                              onClick={() => handleDownload(entry.fileUrl, entry.fileName)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-brand-50 text-brand-700 hover:bg-brand-600 hover:text-white rounded-lg transition-all font-bold border border-brand-200 hover:border-brand-600 text-xs"
                              title="Download File"
                            >
                              <Download size={13} /> Download
                            </button>
                          )}
                          <button
                            onClick={() => setConfirmDeleteRecord(entry)}
                            disabled={revertingId === entry._id}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all font-bold border border-red-200 hover:border-red-600 text-xs disabled:opacity-50"
                            title="Revert and delete this bulk upload data"
                          >
                            {revertingId === entry._id ? (
                              <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 size={13} />
                            )}
                            Revert
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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
                <li>Remove all <strong>{confirmDeleteRecord.successfulRecords || confirmDeleteRecord.totalRecords}</strong> records created by this upload file.</li>
                <li>Restore previous status and balances safely.</li>
                <li>Preserve base records safely.</li>
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
                    <Trash2 size={15} />
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
};

export default BulkUploadHistoryPage;
