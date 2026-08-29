import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Edit2, Trash2, FileArchive, Loader2 } from 'lucide-react';

const templates = [
  { id: 'rg_modern', name: 'RG MODERN COMMUNITY COLLEGE' },
  { id: 'dr_rg_academy', name: 'DR RG ACADEMY' },
  { id: 'bglrgm', name: 'BGLRGM' },
  { id: 'rgmtn', name: 'RGMTN' },
  { id: 'unicarewel', name: 'UNICAREWEL' },
  { id: 'vocational_council', name: 'Council for Vocational Education' }
];

const BulkUploadPreviewModal = ({ data, exams = [], onClose, onSave, onPreviewRow, validateRow }) => {
  const [previewData, setPreviewData] = useState(data);
  const [selectedTemplate, setSelectedTemplate] = useState('rg_modern');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'invalid'

  const processedData = React.useMemo(() => {
    if (!validateRow) return { all: previewData.map((r, i) => ({ ...r, _originalIndex: i, _errors: {} })), invalid: [] };
    
    const all = [];
    const invalid = [];
    
    previewData.forEach((row, idx) => {
      const { isValid, errors } = validateRow(row);
      const rowWithMeta = { ...row, _originalIndex: idx, _errors: errors };
      all.push(rowWithMeta);
      if (!isValid) invalid.push(rowWithMeta);
    });
    
    return { all, invalid };
  }, [previewData, validateRow]);

  const currentDisplayData = activeTab === 'all' ? processedData.all : processedData.invalid;

  const headers = data.length > 0 ? Object.keys(data[0]).filter(k => k !== '_originalIndex' && k !== '_errors') : [];

  const handleEditCell = (rowIndex, key, value) => {
    const newData = [...previewData];
    const updatedRow = { ...newData[rowIndex], [key]: value };

    // Auto-calculate total if Mark or Internal was edited
    const match = key.match(/Subject (\d+) (Mark|Internal|Theory)/);
    if (match) {
      const subjectIndex = match[1];
      const theoryKey = updatedRow[`Subject ${subjectIndex} Theory`] !== undefined ? `Subject ${subjectIndex} Theory` : `Subject ${subjectIndex} Mark`;
      const internalKey = `Subject ${subjectIndex} Internal`;
      const totalKey = `Subject ${subjectIndex} Total`;
      
      // Only update total if the Total column exists in the data
      if (updatedRow[totalKey] !== undefined) {
        const thVal = String(updatedRow[theoryKey] || "").trim().toUpperCase();
        const intVal = String(updatedRow[internalKey] || "").trim().toUpperCase();
        
        if (thVal === 'AB' || intVal === 'AB') {
          updatedRow[totalKey] = 'AB';
        } else {
          const thNum = Number(thVal) || 0;
          const intNum = Number(intVal) || 0;
          updatedRow[totalKey] = thNum + intNum;
        }
      }
    }

    newData[rowIndex] = updatedRow;
    setPreviewData(newData);
  };

  const handleDeleteRow = (rowIndex) => {
    const newData = previewData.filter((_, idx) => idx !== rowIndex);
    setPreviewData(newData);
  };

  const handleSubmit = async () => {
    if (processedData.invalid.length > 0) {
      alert("Please fix all invalid records before uploading.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Clean up metadata before saving
      const cleanData = previewData.map(row => {
        const cleanRow = { ...row };
        delete cleanRow._originalIndex;
        delete cleanRow._errors;
        return cleanRow;
      });
      await onSave({ data: cleanData, template: selectedTemplate });
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-50 flex flex-col animate-in fade-in duration-200">
      <div className="bg-white w-full h-full p-6 flex flex-col shadow-sm max-w-[1600px] mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between mb-4 pb-4 border-b border-slate-100 shrink-0 gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900">Bulk Upload Preview</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-bold text-slate-700">Marksheet Template:</label>
              <select
                className="rounded-lg border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-2 text-sm bg-white"
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                disabled={isSubmitting}
              >
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <button onClick={onClose} disabled={isSubmitting} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-full hover:bg-slate-100 transition-colors disabled:opacity-50">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex gap-4 border-b border-slate-200 mb-4 px-2 shrink-0">
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-3 px-2 font-bold text-sm transition-all border-b-2 ${
              activeTab === 'all'
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            All Records ({processedData.all.length})
          </button>
          {processedData.invalid.length > 0 && (
            <button
              onClick={() => setActiveTab('invalid')}
              className={`pb-3 px-2 font-bold text-sm transition-all border-b-2 flex items-center gap-2 ${
                activeTab === 'invalid'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Needs Correction ({processedData.invalid.length})
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            </button>
          )}
        </div>

        <div className="flex-1 overflow-auto bg-slate-50 rounded-xl border border-slate-200 relative">
          {isSubmitting && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 bg-white p-6 rounded-2xl shadow-xl border border-slate-100">
                <Loader2 size={32} className="animate-spin text-brand-600" />
                <p className="font-bold text-slate-800">Uploading {previewData.length} Records...</p>
                <p className="text-sm text-slate-500">Please wait, this might take a moment.</p>
              </div>
            </div>
          )}
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-600 uppercase bg-slate-100 sticky top-0 z-30 shadow-sm">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">S.No</th>
                {headers.map(h => <th key={h} className="px-4 py-3 whitespace-nowrap">{h}</th>)}
                <th className="px-4 py-3 whitespace-nowrap text-center text-slate-600 bg-slate-100 sticky right-0 z-40 border-l border-slate-200">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentDisplayData.map((row) => (
                <tr key={row._originalIndex} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{row._originalIndex + 1}</td>
                  {headers.map(h => (
                    <td key={h} className="px-4 py-3 relative group">
                      <input
                        type="text"
                        value={row[h] !== undefined && row[h] !== null ? row[h] : ''}
                        onChange={(e) => handleEditCell(row._originalIndex, h, e.target.value)}
                        disabled={isSubmitting}
                        className={`w-full bg-transparent border-b ${row._errors && row._errors[h] ? 'border-red-500 text-red-600 font-bold bg-red-50' : 'border-transparent hover:border-slate-300'} focus:border-brand-500 focus:ring-0 px-1 py-1 transition-colors min-w-[80px] disabled:opacity-50`}
                        title={row._errors && row._errors[h] ? row._errors[h] : ''}
                      />
                      {row._errors && row._errors[h] && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-50 whitespace-nowrap bg-red-600 text-white text-[11px] font-bold px-2 py-1 rounded shadow-lg pointer-events-none">
                          {row._errors[h]}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-red-600"></div>
                        </div>
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center sticky right-0 z-20 bg-white border-l border-slate-100 group-hover:bg-slate-50 flex items-center justify-center gap-2">
                    {onPreviewRow && (
                      <button disabled={isSubmitting} onClick={() => onPreviewRow(row, selectedTemplate)} className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50" title="Preview Marksheet">
                        <FileArchive size={16} />
                      </button>
                    )}
                    <button disabled={isSubmitting} onClick={() => handleDeleteRow(row._originalIndex)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50" title="Delete Row">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {currentDisplayData.length === 0 && (
                <tr>
                  <td colSpan={headers.length + 2} className="px-4 py-8 text-center text-slate-500">
                    No records found in this tab.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex gap-3 pt-4 mt-4 border-t border-slate-100 shrink-0">
          <button type="button" disabled={isSubmitting} onClick={onClose} className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={previewData.length === 0 || isSubmitting || processedData.invalid.length > 0}
            className="flex-1 px-4 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <><Loader2 size={18} className="animate-spin" /> Uploading...</>
            ) : (
              <><Save size={18} /> Confirm Upload ({processedData.all.length} Records)</>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default BulkUploadPreviewModal;
