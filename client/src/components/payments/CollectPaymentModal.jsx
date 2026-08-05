import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, CreditCard, Banknote, UploadCloud, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const CollectPaymentModal = ({ onClose, onSave, fee }) => {
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [bankReference, setBankReference] = useState('');
  const [proofOfPayment, setProofOfPayment] = useState(null);
  
  const totalAmount = (fee.amount || 0) + (fee.isPenaltyApplied ? fee.penaltyAmount : 0) + (fee.isFinalPenaltyApplied ? fee.finalPenaltyAmount : 0);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofOfPayment(reader.result);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { paymentMode };
    if (paymentMode === 'Bank') {
      data.bankReference = bankReference;
    } else if (paymentMode === 'Online') {
      data.proofOfPayment = proofOfPayment;
    }
    onSave(fee._id, data);
  };

  const centerBank = fee.center?.bankDetails;
  const hasUpiId = Boolean(centerBank?.upiId);

  // Generate UPI URI
  const upiUri = hasUpiId ? `upi://pay?pa=${centerBank.upiId}&pn=${encodeURIComponent(centerBank.accountName || fee.center?.name || "Center")}&am=${totalAmount}&cu=INR` : "";

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-50 text-green-600 rounded-xl">
              <CheckCircle size={24} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Collect Payment</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-full hover:bg-slate-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Due</p>
            <p className="text-2xl font-black text-slate-800">₹{totalAmount.toLocaleString('en-IN')}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Student</p>
            <p className="text-sm font-bold text-slate-700">{fee.student?.studentNameEnglish}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3">Payment Mode</label>
            <div className="grid grid-cols-3 gap-3">
              <label className={`cursor-pointer border rounded-xl p-3 flex flex-col items-center gap-2 transition-all ${paymentMode === 'Cash' ? 'border-green-500 bg-green-50 text-green-700 ring-2 ring-green-500/20' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>
                <input type="radio" name="mode" className="hidden" checked={paymentMode === 'Cash'} onChange={() => setPaymentMode('Cash')} />
                <Banknote size={24} />
                <span className="text-sm font-bold">Cash</span>
              </label>
              {hasUpiId && (
                <label className={`cursor-pointer border rounded-xl p-3 flex flex-col items-center gap-2 transition-all ${paymentMode === 'Online' ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>
                  <input type="radio" name="mode" className="hidden" checked={paymentMode === 'Online'} onChange={() => setPaymentMode('Online')} />
                  <QRCodeSVG value="dummy" size={24} fgColor="currentColor" className="opacity-70" />
                  <span className="text-sm font-bold">Online / QR</span>
                </label>
              )}
              <label className={`cursor-pointer border rounded-xl p-3 flex flex-col items-center gap-2 transition-all ${paymentMode === 'Bank' ? 'border-purple-500 bg-purple-50 text-purple-700 ring-2 ring-purple-500/20' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>
                <input type="radio" name="mode" className="hidden" checked={paymentMode === 'Bank'} onChange={() => setPaymentMode('Bank')} />
                <CreditCard size={24} />
                <span className="text-sm font-bold">Bank Transfer</span>
              </label>
            </div>
          </div>

          {paymentMode === 'Cash' && (
            <div className="bg-green-50 text-green-800 p-4 rounded-xl border border-green-100 flex gap-3">
              <CheckCircle size={20} className="shrink-0 mt-0.5" />
              <p className="text-sm font-medium">Cash payment will immediately mark this fee as paid and update the center's cash balance.</p>
            </div>
          )}

          {paymentMode === 'Online' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Scan to Pay via UPI</p>
                <div className="inline-block bg-white p-2 rounded-lg border border-slate-200 shadow-sm mb-3">
                  {upiUri && <QRCodeSVG value={upiUri} size={150} />}
                </div>
                <div className="text-sm text-slate-700 font-medium">UPI ID: <span className="font-bold">{centerBank?.upiId}</span></div>
                <div className="text-xs text-slate-500 mt-1">Beneficiary: {centerBank?.accountName || fee.center?.name}</div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Upload Proof of Payment *</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="space-y-1 text-center">
                    <UploadCloud className="mx-auto h-10 w-10 text-slate-400" />
                    <div className="flex text-sm text-slate-600">
                      <label className="relative cursor-pointer rounded-md font-bold text-brand-600 hover:text-brand-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brand-500">
                        <span>Upload a file</span>
                        <input name="proof" type="file" className="sr-only" required accept="image/*,.pdf" onChange={handleFileChange} />
                      </label>
                    </div>
                    {proofOfPayment && <p className="text-xs text-green-600 font-bold flex items-center justify-center gap-1"><Check size={12}/> File attached</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {paymentMode === 'Bank' && (
            <div className="space-y-4">
              <div className="bg-purple-50 text-purple-800 p-4 rounded-xl border border-purple-100 text-sm font-medium">
                Bank transfers require approval from the Finance/Admin team before being marked as paid.
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Bank Reference / Check No. *</label>
                <input type="text" required className="w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3 text-sm bg-slate-50" value={bankReference} onChange={(e) => setBankReference(e.target.value)} placeholder="e.g., NEFT/RTGS UTR Number" />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancel</button>
            <button type="submit" className={`flex-1 px-4 py-3 text-white rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${paymentMode === 'Bank' ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/20' : 'bg-green-600 hover:bg-green-700 shadow-green-600/20'}`}>
              <CheckCircle size={18} /> {paymentMode === 'Bank' ? 'Submit for Approval' : 'Confirm Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default CollectPaymentModal;
