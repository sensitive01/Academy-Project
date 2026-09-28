import React, { useState, useEffect } from 'react';
import { X, IndianRupee } from 'lucide-react';
import api from '../../services/api';
import Loading from '../common/Loading';
import toast from 'react-hot-toast';

const ViewFeesModal = ({ isOpen, onClose, batch }) => {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && batch) {
      fetchFees();
    }
  }, [isOpen, batch]);

  const fetchFees = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/batches/${batch._id}/fees`);
      setFees(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch defined fees');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (num) => {
    return Number(num).toLocaleString('en-IN');
  };

  if (!isOpen || !batch) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <IndianRupee className="text-brand-600" size={24} />
              Defined Fees
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-1">Batch: {batch.name}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 overflow-y-auto">
          {loading ? (
            <div className="py-12 flex justify-center"><Loading /></div>
          ) : fees.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider font-bold">
                    <th className="p-4 border-b border-slate-200 w-16">S.No</th>
                    <th className="p-4 border-b border-slate-200">Centers</th>
                    <th className="p-4 border-b border-slate-200">Courses</th>
                    <th className="p-4 border-b border-slate-200">Admission Fee</th>
                    <th className="p-4 border-b border-slate-200">Scholarship Fee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fees.map((fee, index) => (
                    <tr key={fee._id || index} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-sm font-medium text-slate-600">{index + 1}</td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {fee.centers?.map(c => (
                            <span key={c._id} className="text-[11px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-bold">
                              {c.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {fee.courses?.map(c => (
                            <span key={c._id} className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold">
                              {c.title || c.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 text-sm font-bold text-slate-800">
                        ₹ {formatAmount(fee.admissionFee)}
                      </td>
                      <td className="p-4 text-sm font-bold text-slate-800">
                        ₹ {formatAmount(fee.scholarshipFee)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <IndianRupee className="text-slate-300" size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-700">No fees defined</h3>
              <p className="text-slate-500 mt-1 text-sm">You haven't defined any fees for this batch yet.</p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewFeesModal;
