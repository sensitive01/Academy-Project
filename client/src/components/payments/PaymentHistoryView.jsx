import React from 'react';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import { useImagePreview } from "../../context/ImagePreviewContext";
import { downloadReceipt } from '../../utils/downloadReceipt';
import CustomDataTable from "../common/DataTable";

const PaymentHistoryView = ({ fee, payments: propPayments, onBack, onClose, onRefresh }) => {
  const { showPreview } = useImagePreview();
  if (!fee) return null;

  const payments = fee.payments || propPayments || [];

  const columns = [
    { 
      name: "S.No", 
      selector: (row, index) => index + 1, 
      width: "70px", 
      center: true,
      cell: (row, index) => <span className="text-sm font-medium text-slate-500">{index + 1}</span>
    },
    {
      name: "Date",
      selector: row => row.paidAt,
      sortable: true,
      width: "140px",
      cell: row => (
        <span className="text-sm font-medium text-slate-600">
          {row.paidAt ? new Date(row.paidAt).toLocaleDateString('en-GB') : 'N/A'}
        </span>
      )
    },
    {
      name: "Amount",
      selector: row => row.amount,
      sortable: true,
      width: "160px",
      cell: row => (
        <span className="text-base font-black text-slate-800">
          ₹{row.amount?.toLocaleString('en-IN')}
        </span>
      )
    },
    {
      name: "Mode",
      selector: row => row.paymentMode,
      sortable: true,
      width: "140px",
      cell: row => (
        <span className="text-sm font-bold text-slate-600 uppercase">
          {row.paymentMode || 'N/A'}
        </span>
      )
    },
    {
      name: "Status",
      selector: row => row.status,
      sortable: true,
      width: "160px",
      cell: row => (
        <span className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider ${
          row.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
          row.status === 'Rejected' ? 'bg-rose-100 text-rose-700' :
          'bg-amber-100 text-amber-700'
        }`}>
          {row.status}
        </span>
      )
    },
    {
      name: "Reference / Proof",
      selector: row => row.bankReference || row.proofOfPayment,
      cell: row => {
        if (row.paymentMode === 'Online' && row.proofOfPayment) {
          return (
            <button 
              onClick={() => showPreview(row.proofOfPayment)} 
              className="text-blue-600 hover:underline text-sm font-semibold cursor-pointer"
            >
              View Proof
            </button>
          );
        }
        return <span className="text-sm font-mono text-slate-500">{row.bankReference || '-'}</span>;
      }
    },
    {
      name: "Action",
      center: true,
      width: "140px",
      cell: row => (
        <button
          onClick={() => {
            let feeId = fee._id;
            if (fee.originalFees && fee.originalFees.length > 0) {
              const parentFee = fee.originalFees.find(of => of.payments && of.payments.some(p => p._id === row._id));
              if (parentFee) feeId = parentFee._id;
              else feeId = fee.originalFees[0]._id;
            }
            
            const url = `/student-fees/${feeId}/receipt?paymentId=${row._id}`;
            downloadReceipt(url, `FeeReceipt_${feeId}.pdf`);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-xl text-xs font-bold transition-colors"
          title="Download Receipt"
        >
          <Download size={16} /> Receipt
        </button>
      )
    }
  ];

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8 animate-in fade-in duration-300 min-h-[600px] flex flex-col">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack}
          className="p-2.5 rounded-xl bg-slate-50 text-slate-600 hover:bg-brand-50 hover:text-brand-600 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-800">Payment History</h2>
          <p className="text-sm font-bold text-slate-500 mt-1">
            Student: <span className="text-brand-600">{fee.student?.studentNameEnglish}</span> 
            <span className="mx-2 text-slate-300">|</span> 
            ID: <span className="text-slate-600">{fee.student?.studentId}</span>
          </p>
        </div>
      </div>

      <div className="flex-1">
        {payments.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <FileText className="mx-auto h-16 w-16 text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-700">No payments found</h3>
            <p className="text-sm text-slate-500 mt-1">There are no payments recorded for this fee yet.</p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <CustomDataTable 
              columns={columns} 
              data={payments}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentHistoryView;
