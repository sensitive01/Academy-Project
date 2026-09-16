import React, { useState } from 'react';
import { Upload, ArrowLeft, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const BulkUploadFeeView = ({ onBack, onSuccess, parsedData = [] }) => {
  const [step, setStep] = useState('preview');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const [previewData, setPreviewData] = useState(parsedData);
  const [activeTab, setActiveTab] = useState('all');
  const [focusedCell, setFocusedCell] = useState(null);

  const validateRow = (row) => {
    let isValid = true;
    const errors = {};
    
    if (!row.studentId || String(row.studentId).trim() === "") { isValid = false; errors.studentId = "Required"; }
    if (!row.feeType || String(row.feeType).trim() === "") { isValid = false; errors.feeType = "Required"; }
    
    const tAmt = Number(row.totalAmount);
    const pAmt = Number(row.paidAmount);
    
    if (isNaN(tAmt) || row.totalAmount === undefined || row.totalAmount === null || String(row.totalAmount).trim() === "") { 
      isValid = false; errors.totalAmount = "Invalid amount"; 
    }
    if (isNaN(pAmt) || row.paidAmount === undefined || row.paidAmount === null || String(row.paidAmount).trim() === "") { 
      isValid = false; errors.paidAmount = "Invalid amount"; 
    }
    
    if (!isNaN(tAmt) && !isNaN(pAmt) && pAmt > tAmt) {
      isValid = false;
      errors.paidAmount = "Cannot exceed total";
    }

    return { isValid, errors };
  };

  const processedData = React.useMemo(() => {
    const all = [];
    const invalid = [];
    const displayInvalid = [];

    previewData.forEach((row, idx) => {
      const { isValid, errors } = validateRow(row);
      const rowWithMeta = { ...row, _originalIndex: idx, _errors: errors };
      all.push(rowWithMeta);
      
      if (!isValid) {
        invalid.push(rowWithMeta);
        displayInvalid.push(rowWithMeta);
      } else if (activeTab === 'invalid' && focusedCell?.row === idx) {
        displayInvalid.push(rowWithMeta);
      }
    });

    return { all, invalid, displayInvalid };
  }, [previewData, activeTab, focusedCell]);

  const currentDisplayData = activeTab === 'all' ? processedData.all : processedData.displayInvalid;

  const fieldMapping = [
    { key: 'studentId', label: 'Student ID' },
    { key: 'year', label: 'Year' },
    { key: 'feeType', label: 'Fee Type' },
    { key: 'totalAmount', label: 'Total Amt' },
    { key: 'paidAmount', label: 'Paid Amt' },
    { key: 'paymentMode', label: 'Payment Mode' },
    { key: 'bankReference', label: 'Bank Ref' },
    { key: 'paidDate', label: 'Paid Date' }
  ];

  const handleEditCell = (rowIndex, key, value) => {
    const newData = [...previewData];
    newData[rowIndex] = { ...newData[rowIndex], [key]: value };
    setPreviewData(newData);
  };

  const handleDeleteRow = (rowIndex) => {
    const newData = previewData.filter((_, idx) => idx !== rowIndex);
    setPreviewData(newData);
  };

  const handleConfirmUpload = async () => {
    if (processedData.invalid.length > 0) {
      toast.error("Please fix all invalid records before uploading.");
      return;
    }

    if (previewData.length === 0) {
      toast.error("No data to upload.");
      return;
    }

    setLoading(true);
    try {
      const dataToUpload = processedData.all.map(row => {
        const cleanRow = { ...row };
        delete cleanRow._originalIndex;
        delete cleanRow._errors;
        return cleanRow;
      });

      const response = await api.post('/student-fees/bulk-upload', { fees: dataToUpload });
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

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col h-[calc(100vh-100px)] animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-4 shrink-0">
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
              {step === 'preview' && `Review the ${previewData.length} records parsed from your file before uploading.`}
              {step === 'result' && "Summary of the bulk upload operation."}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {step === 'preview' && (
            <button 
              onClick={handleConfirmUpload}
              disabled={loading || processedData.invalid.length > 0 || previewData.length === 0}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm ${
                loading || processedData.invalid.length > 0 || previewData.length === 0 ? "bg-slate-300 text-slate-500 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 text-white shadow-green-200"
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

      <div className="flex-1 flex flex-col min-h-0">
        {step === 'preview' && (
          <>
            <div className="flex gap-4 border-b border-slate-200 mb-4 px-2 shrink-0">
              <button
                onClick={() => setActiveTab('all')}
                className={`pb-3 px-2 font-bold text-sm transition-all border-b-2 ${activeTab === 'all'
                    ? 'border-brand-500 text-brand-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
              >
                All Records ({processedData.all.length})
              </button>
              {processedData.displayInvalid.length > 0 && (
                <button
                  onClick={() => setActiveTab('invalid')}
                  className={`pb-3 px-2 font-bold text-sm transition-all border-b-2 flex items-center gap-2 ${activeTab === 'invalid'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                  Needs Correction ({processedData.invalid.length})
                  {processedData.invalid.length > 0 && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
                </button>
              )}
            </div>

            <div className="flex-1 overflow-auto bg-slate-50 rounded-xl border border-slate-200 relative custom-scrollbar">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-600 uppercase bg-slate-100 sticky top-0 z-30 shadow-sm">
                  <tr>
                    <th className="px-4 py-3 whitespace-nowrap">S.No</th>
                    {fieldMapping.map(f => <th key={f.key} className="px-4 py-3 whitespace-nowrap">{f.label}</th>)}
                    <th className="px-4 py-3 whitespace-nowrap text-center text-slate-600 bg-slate-100 sticky right-0 z-40 border-l border-slate-200">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentDisplayData.map((row) => (
                    <tr key={row._originalIndex} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{row._originalIndex + 1}</td>
                      {fieldMapping.map(f => (
                        <td key={f.key} className="px-4 py-3 relative group">
                          <input
                            type="text"
                            value={row[f.key] !== undefined && row[f.key] !== null ? row[f.key] : ''}
                            onChange={(e) => handleEditCell(row._originalIndex, f.key, e.target.value)}
                            onFocus={() => setFocusedCell({ row: row._originalIndex, col: f.key })}
                            onBlur={() => {
                              setTimeout(() => {
                                setFocusedCell(prev => (prev?.row === row._originalIndex && prev?.col === f.key) ? null : prev);
                              }, 200);
                            }}
                            disabled={loading}
                            className={`w-full bg-transparent border-b ${row._errors && row._errors[f.key] ? 'border-red-500 text-red-600 font-bold bg-red-50' : 'border-transparent hover:border-slate-300'} focus:border-brand-500 focus:ring-0 px-1 py-1 transition-colors min-w-[80px] disabled:opacity-50`}
                            title={row._errors && row._errors[f.key] ? row._errors[f.key] : ''}
                          />
                          {row._errors && row._errors[f.key] && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-50 whitespace-nowrap bg-red-600 text-white text-[11px] font-bold px-2 py-1 rounded shadow-lg pointer-events-none">
                              {row._errors[f.key]}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-red-600"></div>
                            </div>
                          )}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-center sticky right-0 z-20 bg-white border-l border-slate-100 group-hover:bg-slate-50 flex items-center justify-center gap-2">
                        <button disabled={loading} onClick={() => handleDeleteRow(row._originalIndex)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50" title="Delete Row">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {currentDisplayData.length === 0 && (
                    <tr>
                      <td colSpan={fieldMapping.length + 2} className="px-4 py-8 text-center text-slate-500">
                        No records found in this tab.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {step === 'result' && result && (
          <div className="max-w-4xl mx-auto mt-4 overflow-y-auto w-full">
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
