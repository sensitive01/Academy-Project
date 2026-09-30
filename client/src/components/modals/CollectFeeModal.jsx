import React, { useState } from 'react';
import { X, IndianRupee, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const CollectFeeModal = ({ isOpen, onClose, student, feeType, onSuccess, readOnly }) => {
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [bankReference, setBankReference] = useState('');
  const [proof, setProof] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !student) return null;

  const feeSummary = feeType === "Scholarship" ? student.scholarshipFeeSummary : student.admissionFeeSummary;
  const totalFee = feeSummary?.total || 0;
  const paidFee = feeSummary?.paid || 0;
  const balance = feeSummary?.balance || 0;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!amountPaid || isNaN(amountPaid) || Number(amountPaid) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (Number(amountPaid) > balance) {
      toast.error('Payable Amount is higher than the current balance');
      return;
    }

    if (['Online', 'Bank'].includes(paymentMode) && !proof && !bankReference) {
      toast.error('Please provide a Bank Reference or upload a Payment Proof');
      return;
    }

    try {
      setIsSaving(true);
      const formData = new FormData();
      formData.append('feeType', feeType);
      formData.append('amountPaid', Number(amountPaid));
      formData.append('paymentMode', paymentMode);
      if (bankReference) formData.append('bankReference', bankReference);
      if (proof) formData.append('proof', proof);

      await api.post(`/students/${student._id}/collect-fee`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(`${feeType} Fee collected successfully`);
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to collect fee');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className={`bg-white rounded-2xl shadow-xl w-full ${readOnly ? 'max-w-3xl' : 'max-w-md'} overflow-hidden flex flex-col max-h-[90vh]`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div>
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <IndianRupee className="text-brand-600" size={20} />
              {readOnly ? `Payment Details: ${feeType}` : `Collect ${feeType} Fee`}
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-1">Student: {student.user?.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        {!readOnly && (
        <form id="collect-fee-form" onSubmit={handleSave} className="p-6 space-y-6 overflow-y-auto flex-1">
          
          <div className="flex flex-col gap-1.5 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Total Expected:</span>
              <span className="font-bold text-slate-800">₹{totalFee}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Already Paid:</span>
              <span className="font-bold text-emerald-600">₹{paidFee}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-slate-200 pt-1.5 mt-1.5">
              <span className="text-slate-500">Current Balance:</span>
              <span className="font-bold text-rose-600">₹{balance}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">Amount Paying Now (₹)</label>
            <input
              type="number"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
              placeholder="e.g. 5000"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">Payment Mode</label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
            >
              <option value="Cash">Cash</option>
              <option value="Online">Online / UPI</option>
              <option value="Bank">Bank Transfer / Cheque</option>
            </select>
          </div>

          {paymentMode !== 'Cash' && (
            <div className="space-y-4 border-t border-slate-100 pt-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Bank Reference / Transaction ID</label>
                <input
                  type="text"
                  value={bankReference}
                  onChange={(e) => setBankReference(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                  placeholder="Enter Txn ID"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Upload Proof <span className="text-slate-400 font-normal">(Optional)</span></label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setProof(e.target.files[0])}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                />
              </div>
            </div>
          )}

        </form>
        )}

        {/* Payment History Section for ReadOnly */}
        {readOnly && (
          <div className="px-6 pb-6 space-y-3 flex-1 overflow-y-auto">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Payment History</h3>
            {feeSummary?.history?.length > 0 ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase text-slate-500 font-bold">
                      <th className="px-4 py-2">S.No</th>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Mode</th>
                      <th className="px-4 py-2">Ref</th>
                      <th className="px-4 py-2">Proof</th>
                      <th className="px-4 py-2">Amount</th>
                      <th className="px-4 py-2">Status</th>
                      
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {feeSummary.history.map((h, i) => {
                      let proofUrl = h.proofOfPayment;
                      if (proofUrl && !proofUrl.startsWith('http')) {
                        proofUrl = proofUrl.replace(/\\/g, '/');
                        if (!proofUrl.startsWith('/')) proofUrl = '/' + proofUrl;
                        proofUrl = api.defaults.baseURL.replace('/api', '') + proofUrl;
                      }
                      
                      return (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-600">{i + 1}</td>
                        <td className="px-4 py-3 text-slate-500">{h.date ? new Date(h.date).toLocaleDateString() : 'N/A'}</td>
                        <td className="px-4 py-3 font-bold text-slate-700">{h.paymentMode}</td>
                        <td className="px-4 py-3 text-[10px] text-slate-500">{h.bankReference || '-'}</td>
                        <td className="px-4 py-3">
                          {proofUrl ? (
                            <a 
                              href={proofUrl}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="block overflow-hidden rounded-lg border border-slate-200 hover:border-brand-500 transition-colors"
                              style={{ width: '40px', height: '40px' }}
                            >
                              <img src={proofUrl} alt="Proof" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = '<span class="text-[10px] text-brand-600 font-bold p-2">View</span>'; }} />
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-bold text-emerald-600">₹{h.amount}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                            h.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                            h.status === 'Rejected' ? 'bg-rose-100 text-rose-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {h.status || 'Pending'}
                          </span>
                        </td>
                        
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-sm text-slate-500 italic p-4 text-center bg-slate-50 rounded-xl">
                No payments recorded yet.
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        {!readOnly && (
          <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="collect-fee-form"
              disabled={isSaving}
              className="px-6 py-2 text-sm font-bold text-white bg-brand-600 rounded-xl hover:bg-brand-700 transition-colors flex items-center gap-2 disabled:opacity-70"
            >
              {isSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <Save size={16} />}
              Confirm Payment
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectFeeModal;
