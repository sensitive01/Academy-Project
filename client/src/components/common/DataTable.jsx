import React from 'react';
import DataTable from 'react-data-table-component';
import { Search } from 'lucide-react';
import Loading from './Loading';

const customStyles = {
  headRow: {
    style: {
      backgroundColor: '#f1f5f9',
      borderTop: '1px solid #e2e8f0',
      borderBottomWidth: '2px',
      borderBottomColor: '#e2e8f0',
      minHeight: '52px',
    },
  },
  headCells: {
    style: {
      color: '#0f172a',
      fontSize: '0.85rem',
      fontWeight: '700',
      textTransform: 'uppercase',
      paddingRight: '16px',
      borderRight: '1px solid #e2e8f0',
      whiteSpace: 'normal !important',
      wordBreak: 'break-word !important',
      overflow: 'visible !important',
      '& > div': {
        whiteSpace: 'normal !important',
        overflow: 'visible !important',
        textOverflow: 'clip !important',
      },
      '&:last-child': {
        borderRight: 'none',
      },
    },
  },
  cells: {
    style: {
      paddingLeft: '16px',
      paddingRight: '16px',
      fontSize: '0.875rem',
      color: '#334155',
      borderRight: '1px solid #f1f5f9',
      whiteSpace: 'normal !important',
      wordBreak: 'break-word !important',
      overflow: 'visible !important',
      '& > div': {
        whiteSpace: 'normal !important',
        overflow: 'visible !important',
        textOverflow: 'clip !important',
      },
      '&:last-child': {
        borderRight: 'none',
      },
    },
  },
  rows: {
    style: {
      minHeight: '60px',
      borderBottomColor: '#f1f5f9',
      transition: 'all 0.2s',
      '&:hover': {
        backgroundColor: '#f8fafc',
      },
    },
  },
};

const CustomDataTable = ({ 
  columns, 
  data, 
  searchPlaceholder = "Search...", 
  search, 
  setSearch, 
  exportButton,
  ...props 
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col w-full h-full">
      {/* Header section with search and export built-in if provided */}
      {(setSearch || exportButton) && (
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white">
          {setSearch && (
            <div className="relative w-full sm:w-72 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all shadow-sm text-sm font-medium"
              />
            </div>
          )}
          {exportButton && (
            <div className="w-full sm:w-auto flex justify-end">
              {exportButton}
            </div>
          )}
        </div>
      )}
      
      <div className="flex-1 w-full relative">
        <DataTable
          columns={columns}
          data={data}
          pagination
          paginationPerPage={10}
          paginationRowsPerPageOptions={[5, 10, 20, 50]}
          customStyles={customStyles}
          highlightOnHover
          pointerOnHover={false}
          responsive
          persistTableHead
          noDataComponent={
            <div className="p-12 text-center text-slate-500 bg-white w-full border-b border-slate-200">
              <span className="text-4xl block mb-2">📄</span>
              <p className="font-medium text-lg">No records found</p>
            </div>
          }
          progressComponent={
            <div className="py-20 flex justify-center items-center w-full">
              <Loading message="Syncing data..." />
            </div>
          }
          {...props}
        />
      </div>
    </div>
  );
};

export default CustomDataTable;
