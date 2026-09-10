import React, { useState, useEffect } from 'react';
import { X, Search, FileSpreadsheet, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import CustomDataTable from '../common/DataTable';
import Loading from '../common/Loading';

const BulkUploadDataModal = ({ isOpen, onClose, historyRecord }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'success', 'failed'
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen && historyRecord?.fileUrl) {
      fetchAndParseFile(historyRecord.fileUrl);
    }
  }, [isOpen, historyRecord]);

  const fetchAndParseFile = async (url) => {
    setLoading(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch file');
      const blob = await response.blob();
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const bstr = e.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const parsedData = XLSX.utils.sheet_to_json(ws);
        
        // Add default status if missing
        const processedData = parsedData.map((row, index) => {
          let status = row['Upload Status'] || row['Upload_Status'] || row['Status'];
          if (!status) {
             // Fallback to overall history record status if row-level status is missing
             status = historyRecord.status === 'Success' ? 'Success' : 
                      historyRecord.status === 'Failed' ? 'Failed' : 'Success'; 
          }
          return {
            ...row,
            _id: index,
            _status: status.toLowerCase() === 'failed' ? 'Failed' : 'Success',
          };
        });

        setData(processedData);
        setLoading(false);
      };
      reader.readAsBinaryString(blob);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (!isOpen || !historyRecord) return null;

  // Filter Data based on Tab & Search
  let filteredData = data;
  if (activeTab === 'success') {
    filteredData = filteredData.filter(r => r._status === 'Success');
  } else if (activeTab === 'failed') {
    filteredData = filteredData.filter(r => r._status === 'Failed');
  }

  if (search) {
    const q = search.toLowerCase();
    filteredData = filteredData.filter(r => {
      return Object.values(r).some(v => String(v).toLowerCase().includes(q));
    });
  }

  // Generate Columns Dynamically
  const columns = [
    {
      name: 'S.No',
      selector: (row, index) => index + 1,
      width: '80px',
    }
  ];

  if (data.length > 0) {
    const keys = Object.keys(data[0]).filter(k => k !== '_id' && k !== '_status');
    keys.forEach(key => {
      columns.push({
        name: key,
        selector: row => row[key],
        sortable: true,
        cell: row => (
          <div className="truncate max-w-[200px]" title={String(row[key] || '')}>
            {String(row[key] || '-')}
          </div>
        )
      });
    });
  }

  // Add generic Status column if not already present
  if (!columns.some(c => c.name.toLowerCase().includes('status'))) {
     columns.push({
        name: 'Status',
        selector: row => row._status,
        sortable: true,
        width: '120px',
        cell: row => (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
            row._status === 'Success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
          }`}>
            {row._status}
          </span>
        )
     });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-100 text-brand-600 rounded-xl">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{historyRecord.fileName}</h2>
              <p className="text-xs font-medium text-slate-500 mt-1">Detailed upload records</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs & Search */}
        <div className="px-6 pt-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            {['all', 'success', 'failed'].map((tab) => {
              const count = tab === 'all' ? data.length : 
                            tab === 'success' ? data.filter(d => d._status === 'Success').length : 
                            data.filter(d => d._status === 'Failed').length;
              
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-4 px-1 text-sm font-bold border-b-2 transition-colors relative flex items-center gap-2 ${
                    activeTab === tab 
                      ? 'border-brand-600 text-brand-600' 
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span className="capitalize">{tab}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                    activeTab === tab ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search records..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-64 pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden relative bg-slate-50 min-h-0 flex flex-col">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loading />
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <AlertCircle className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="text-lg font-bold text-slate-800">No Records Found</h3>
              <p className="text-sm text-slate-500 max-w-sm mt-1">The excel file appears to be empty or could not be parsed.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              <CustomDataTable
                columns={columns}
                data={filteredData}
                progressPending={loading}
                pagination
                customStyles={{
                  headRow: {
                    style: {
                      backgroundColor: '#f8fafc',
                      borderBottom: '1px solid #f1f5f9',
                    },
                  },
                  headCells: {
                    style: {
                      fontSize: '11px',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      color: '#64748b',
                      paddingLeft: '16px',
                      paddingRight: '16px',
                    },
                  },
                  cells: {
                    style: {
                      fontSize: '13px',
                      color: '#334155',
                      paddingLeft: '16px',
                      paddingRight: '16px',
                    },
                  },
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkUploadDataModal;
