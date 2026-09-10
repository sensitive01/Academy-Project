import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, AlertCircle, CheckCircle, Loader2, Info, Search, Edit3 } from 'lucide-react';

// Helper to format any date or serial number to DD/MM/YYYY
const formatDisplayDOB = (val) => {
  if (val === undefined || val === null || String(val).trim() === '') return '';
  const s = String(val).trim();
  // If already DD/MM/YYYY or DD-MM-YYYY
  if (/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/.test(s)) {
    const [, dd, mm, yyyy] = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
    return `${dd.padStart(2, '0')}/${mm.padStart(2, '0')}/${yyyy}`;
  }
  // Excel serial number
  if (/^\d{5}$/.test(s)) {
    const excelEpoch = new Date(1899, 11, 30);
    const d = new Date(excelEpoch.getTime() + Number(s) * 86400000);
    if (!isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      return `${dd}/${mm}/${d.getFullYear()}`;
    }
  }
  // ISO date
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  }
  return s;
};

const BulkEditPreviewModal = ({ previewData, onClose, onConfirm, isSubmitting }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Local state initialized from previewData so user can edit in-place
  const [rows, setRows] = useState(() => {
    if (!previewData) return [];
    const valid = (previewData.valid || []).map((r, i) => ({
      ...r,
      _idInternal: r._mongoId || `v-${i}`,
      _status: 'valid',
      _errorMsg: '',
      DOB: formatDisplayDOB(r["DOB"])
    }));
    const invalid = (previewData.invalid || []).map((r, i) => ({
      ...r,
      _idInternal: r._mongoId || `inv-${i}`,
      _status: 'invalid',
      _errorMsg: r._error || 'Invalid record',
      DOB: formatDisplayDOB(r["DOB"])
    }));
    return [...valid, ...invalid];
  });

  if (!previewData) return null;

  // Validation function when editing
  const validateField = (row, key, value) => {
    let error = null;
    const trimmed = String(value || '').trim();

    if (key === 'Student ID') {
      if (!trimmed) {
        error = 'Student ID cannot be empty.';
      } else {
        const dup = rows.some(r => r._idInternal !== row._idInternal && String(r['Student ID'] || '').trim().toLowerCase() === trimmed.toLowerCase());
        if (dup) error = `Duplicate Student ID "${trimmed}".`;
      }
    } else if (key === 'DOB' && trimmed) {
      if (!/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/.test(trimmed) && isNaN(new Date(trimmed).getTime())) {
        error = 'DOB must be in DD/MM/YYYY format.';
      }
    }
    return error;
  };

  const handleCellChange = (idInternal, key, value) => {
    setRows(prev => prev.map(r => {
      if (r._idInternal !== idInternal) return r;

      const updated = { ...r, [key]: value };
      const fieldError = validateField(updated, key, value);

      if (fieldError) {
        return {
          ...updated,
          _status: 'invalid',
          _errorMsg: fieldError
        };
      } else {
        // Check if there are other errors remaining
        const idErr = validateField(updated, 'Student ID', updated['Student ID']);
        const dobErr = validateField(updated, 'DOB', updated['DOB']);
        const hasOtherErr = idErr || dobErr;

        return {
          ...updated,
          _status: hasOtherErr ? 'invalid' : 'valid',
          _errorMsg: hasOtherErr || ''
        };
      }
    }));
  };

  const validRows = rows.filter(r => r._status === 'valid');
  const invalidRows = rows.filter(r => r._status === 'invalid');

  const filteredRows = (activeTab === 'all' ? rows : activeTab === 'valid' ? validRows : invalidRows).filter(r => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return Object.values(r).some(v => typeof v === 'string' && v.toLowerCase().includes(s));
  });

  const tabs = [
    { id: 'all',     label: `All (${rows.length})`,           color: 'text-slate-700 border-slate-700' },
    { id: 'valid',   label: `Ready (${validRows.length})`,    color: 'text-emerald-700 border-emerald-500' },
    { id: 'invalid', label: `Needs Fix (${invalidRows.length})`, color: 'text-red-700 border-red-500' },
  ];

  // Columns to display (skip internal meta keys)
  const sampleRow = rows[0] || {};
  const allKeys = Object.keys(sampleRow).filter(k => !['_mongoId', '_idInternal', '_status', '_errorMsg', '_error'].includes(k));

  const handleSave = () => {
    // Strip meta fields and pass back valid records for confirm
    const recordsToSave = validRows.map(r => {
      const { _idInternal, _status, _errorMsg, _error, ...rest } = r;
      return rest;
    });
    onConfirm(recordsToSave);
  };

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[10000] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-7xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900">Bulk Edit Preview & Editor</h2>
              <span className="flex items-center gap-1 text-[11px] font-semibold bg-brand-50 text-brand-700 px-2 py-0.5 rounded-md border border-brand-100">
                <Edit3 size={11} /> Inline Editable
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any cell (such as <strong>DOB</strong> or <strong>Student ID</strong>) to edit directly before saving.
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-200/60 text-slate-500 transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* CONTROLS (TABS & SEARCH) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-2.5 border-b border-slate-100 shrink-0 bg-white">
          <div className="flex gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === tab.id ? `${tab.color}` : 'text-slate-400 border-transparent hover:text-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search records..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
            />
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-auto flex-1 bg-slate-50/30">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-100 sticky top-0 z-20 shadow-sm">
              <tr>
                <th className="px-3 py-3 font-bold text-slate-700 border-r border-slate-200 whitespace-nowrap w-24">Status</th>
                {allKeys.map(key => (
                  <th key={key} className="px-3 py-3 font-bold text-slate-700 border-r border-slate-200 whitespace-nowrap">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={allKeys.length + 1} className="text-center py-12 text-slate-400 font-semibold">
                    No records found.
                  </td>
                </tr>
              )}
              {filteredRows.map((row) => {
                const isValid = row._status === 'valid';
                return (
                  <tr
                    key={row._idInternal}
                    className={`border-b border-slate-200/70 transition-colors ${
                      isValid ? 'bg-white hover:bg-emerald-50/20' : 'bg-red-50/30 hover:bg-red-50/50'
                    }`}
                  >
                    {/* STATUS COLUMN */}
                    <td className="px-3 py-2 border-r border-slate-200 shrink-0 align-top">
                      {isValid ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                          <CheckCircle size={12} /> Ready
                        </span>
                      ) : (
                        <div>
                          <span className="inline-flex items-center gap-1 text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded-md border border-red-100">
                            <AlertCircle size={12} /> Needs Fix
                          </span>
                          <span className="text-[10px] text-red-600 block mt-1 leading-tight font-medium max-w-[160px]" title={row._errorMsg}>
                            {row._errorMsg}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* EDITABLE FIELD CELLS */}
                    {allKeys.map(key => {
                      const val = row[key] !== undefined && row[key] !== null ? String(row[key]) : '';
                      const isDateField = key === 'DOB';
                      const isIdField = key === 'Student ID';

                      return (
                        <td key={key} className="p-1 border-r border-slate-200 whitespace-nowrap align-top">
                          <input
                            type="text"
                            value={val}
                            placeholder={isDateField ? 'DD/MM/YYYY' : ''}
                            onChange={e => handleCellChange(row._idInternal, key, e.target.value)}
                            className={`w-full px-2 py-1 rounded text-xs outline-none transition-all ${
                              isIdField || isDateField ? 'font-mono' : ''
                            } ${
                              !isValid && (row._errorMsg.toLowerCase().includes(key.toLowerCase()) || (isDateField && row._errorMsg.includes('DOB')))
                                ? 'bg-red-50 border border-red-300 text-red-700 font-semibold focus:ring-1 focus:ring-red-400'
                                : 'bg-transparent border border-transparent hover:border-slate-300 focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-400 text-slate-800'
                            }`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 shrink-0 bg-white">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info size={15} className="text-brand-600 shrink-0" />
            <span>
              <strong>{validRows.length}</strong> of {rows.length} records ready to save.
              {invalidRows.length > 0 && (
                <span className="text-red-500 font-semibold ml-1">
                  ({invalidRows.length} needs correction — fix inline above or they will be skipped)
                </span>
              )}
            </span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting || validRows.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-lg shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {isSubmitting ? 'Saving Changes...' : `Save & Sync ${validRows.length} Students`}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default BulkEditPreviewModal;
