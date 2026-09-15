import React, { useState } from 'react';
import { Upload, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import CustomDataTable from '../common/DataTable';

const BulkUploadFeeView = ({ onBack, onSuccess, parsedData = [] }) => {
  const [step, setStep] = useState('preview'); // preview -> result
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleConfirmUpload = async () => {
    setLoading(true);
    try {
      const response = await api.post('/student-fees/bulk-upload', { fees: parsedData });
      setResult(response.data);
      setStep('result');
      
      if (response.data.successCount > 0) {
        toast.success(`Successfully processed ${response.data.successCount} payments!`);
      } else {
        toast.error("Failed to process any payments. Check errors below.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred during upload");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { name: "S.No", selector: (row, index) => index + 1, width: "80px" },
    { name: "Student ID", selector: row => row.studentId || "-", sortable: true, width: "150px" },
    { name: "Year", selector: row => row.year || "-", sortable: true, width: "100px" },
    { name: "Fee Type", selector: row => row.feeType || "-", sortable: true, width: "150px" },
    { name: "Total Amt", selector: row => row.totalAmount || 0, sortable: true, cell: row => `₹${Number(row.totalAmount || 0).toLocaleString('en-IN')}`, width: "150px" },
    { name: "Paid Amt", selector: row => row.paidAmount || 0, sortable: true, cell: row => <span className="font-bold text-green-600">₹{Number(row.paidAmount || 0).toLocaleString('en-IN')}</span>, width: "150px" },
    { name: "Payment Mode", selector: row => row.paymentMode || "-", sortable: true, width: "150px" },
    { name: "Paid Date", selector: row => row.paidDate || "-", sortable: true, width: "150px" }
  ];

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col h-[calc(100vh-100px)] animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-700">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {step === 'preview' && "Preview Data"}
              {step === 'result' && "Upload Results"}
            </h3>
            <p className="text-slate-500 text-xs mt-1">
              {step === 'preview' && `Review the ${parsedData.length} records parsed from your file before uploading.`}
              {step === 'result' && "Summary of the bulk upload operation."}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {step === 'preview' && (
            <button 
              onClick={handleConfirmUpload}
              disabled={loading}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm ${
                loading ? "bg-slate-300 text-slate-500 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 text-white shadow-green-200"
              }`}
            >
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Upload size={16} />}
              {loading ? "Uploading..." : "Confirm & Upload"}
            </button>
          )}
          
          {step === 'result' && result && (
            <button onClick={result.successCount > 0 ? onSuccess : onBack} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors">
              {result.successCount > 0 ? "Done" : "Cancel"}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {step === 'preview' && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <CustomDataTable columns={columns} data={parsedData} pagination={true} paginationPerPage={10} paginationRowsPerPageOptions={[10, 20, 50]} />
          </div>
        )}

        {step === 'result' && result && (
          <div className="max-w-4xl mx-auto mt-4">
            <div className="flex gap-6 mb-8">
              <div className="flex-1 bg-green-50 border border-green-100 rounded-2xl p-5 flex items-center gap-4">
                <CheckCircle2 className="text-green-500" size={32} />
                <div><div className="text-3xl font-black text-green-700">{result.successCount}</div><div className="text-xs font-bold text-green-600 uppercase tracking-wider mt-1">Successful Records</div></div>
              </div>
              <div className="flex-1 bg-red-50 border border-red-100 rounded-2xl p-5 flex items-center gap-4">
                <AlertCircle className="text-red-500" size={32} />
                <div><div className="text-3xl font-black text-red-700">{result.failedCount}</div><div className="text-xs font-bold text-red-600 uppercase tracking-wider mt-1">Failed Records</div></div>
              </div>
            </div>

            {result.failedRows && result.failedRows.length > 0 && (
              <div className="bg-white border border-red-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-red-50 px-4 py-3 border-b border-red-100 text-sm font-bold text-red-800 flex items-center gap-2"><AlertCircle size={16} /> Error Details</div>
                <div className="max-h-96 overflow-y-auto custom-scrollbar">
                  <ul className="text-sm text-slate-600 divide-y divide-slate-100">
                    {result.failedRows.map((err, idx) => (
                      <li key={idx} className="p-4 border-b border-slate-100 last:border-0 flex gap-3 hover:bg-slate-50 transition-colors">
                        <span className="font-bold text-slate-800 whitespace-nowrap bg-white px-2 py-1 rounded shadow-sm border border-slate-200">Row {err.row}</span> 
                        <span className="text-red-600 self-center">{err.reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkUploadFeeView;
