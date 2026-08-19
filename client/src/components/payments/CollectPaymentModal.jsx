import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, CreditCard, Banknote, UploadCloud, Check, Trash2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../services/api';

const CollectPaymentModal = ({ onClose, onSave, fee, schemeLabel }) => {
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [bankReference, setBankReference] = useState('');
  const [proofOfPayment, setProofOfPayment] = useState(null);
  
  const totalAmount = (fee.amount || 0) + (fee.isPenaltyApplied ? fee.penaltyAmount : 0) + (fee.isFinalPenaltyApplied ? fee.finalPenaltyAmount : 0);

  const totalApprovedPaid = fee.payments
    ? fee.payments
        .filter(p => p.status === 'Approved')
        .reduce((sum, p) => sum + p.amount, 0)
    : (fee.status === 'paid' ? fee.amount : 0);

  const remainingBalance = Math.max(0, totalAmount - totalApprovedPaid);

  const [collectAmount, setCollectAmount] = useState(remainingBalance);

  useEffect(() => {
    setCollectAmount(remainingBalance);
  }, [remainingBalance]);

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
    const data = { paymentMode, amount: Number(collectAmount) };
    if (paymentMode === 'Bank') {
      data.bankReference = bankReference;
    } else if (paymentMode === 'Online') {
      data.proofOfPayment = proofOfPayment;
    }
    onSave(fee._id, data);
  };

  const [globalBank, setGlobalBank] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data?.globalBankDetails) {
          setGlobalBank(res.data.globalBankDetails);
        }
      } catch (err) {
        console.error("Failed to fetch settings", err);
      }
    };
    fetchSettings();
  }, []);

  const hasUpiId = Boolean(globalBank?.upiId);

  // Generate UPI URI
  const upiUri = hasUpiId ? `upi://pay?pa=${globalBank.upiId}&pn=${encodeURIComponent(globalBank.accountName || fee.center?.name || "Center")}&am=${collectAmount}&cu=INR` : "";

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <CreditCard size={24} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Collect Payment</h2>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-full hover:bg-slate-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Total Due Card */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-5 rounded-2xl text-white shadow-md flex justify-between items-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 mix-blend-overlay flex items-center justify-center pointer-events-none">
            <svg className="w-full h-full text-white" viewBox="0 0 100 100" preserveAspectRatio="none">
               <path d="M0,0 L100,100 M100,0 L0,100" stroke="currentColor" strokeWidth="1" fill="none"/>
            </svg>
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-1">Remaining Balance / Total Fee</p>
            <p className="text-3xl font-black tracking-tight">₹{remainingBalance.toLocaleString('en-IN')} <span className="text-xs font-normal text-indigo-200/70">/ ₹{totalAmount.toLocaleString('en-IN')}</span></p>
          </div>
          <div className="text-right relative z-10 flex flex-col items-end">
            <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-1">Student</p>
            <p className="text-base font-bold leading-tight">{fee.student?.studentNameEnglish}</p>
            {schemeLabel && (
              <span className="mt-1.5 px-2 py-0.5 bg-indigo-900/60 text-indigo-200 rounded border border-indigo-700/50 text-[9px] font-bold uppercase tracking-wider">
                {schemeLabel}
              </span>
            )}
          </div>
        </div>

        {/* Collection Amount Input */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Amount to Collect *</label>
          <input 
            type="number" 
            required 
            min="1" 
            max={remainingBalance}
            className="w-full rounded-2xl border border-slate-200 p-3.5 text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 font-bold text-slate-800" 
            value={collectAmount} 
            onChange={(e) => setCollectAmount(parseFloat(e.target.value) || 0)} 
            placeholder="Enter manual collection amount" 
          />
        </div>

        {/* Payment Mode Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Select Payment Mode</label>
          <div className="grid grid-cols-3 gap-3">
            <label className={`cursor-pointer border rounded-2xl p-4 flex flex-col items-center gap-2 transition-all ${paymentMode === 'Cash' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-4 ring-emerald-500/10' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>
              <input type="radio" name="mode" className="hidden" checked={paymentMode === 'Cash'} onChange={() => setPaymentMode('Cash')} />
              <Banknote size={24} className={paymentMode === 'Cash' ? 'text-emerald-600' : 'text-slate-400'} />
              <span className="text-xs font-bold">Cash</span>
            </label>
            {hasUpiId && (
              <label className={`cursor-pointer border rounded-2xl p-4 flex flex-col items-center gap-2 transition-all ${paymentMode === 'Online' ? 'border-blue-500 bg-blue-50 text-blue-700 ring-4 ring-blue-500/10' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>
                <input type="radio" name="mode" className="hidden" checked={paymentMode === 'Online'} onChange={() => setPaymentMode('Online')} />
                <QRCodeSVG value={upiUri} size={24} fgColor="currentColor" className="opacity-80" />
                <span className="text-xs font-bold">Online / QR</span>
              </label>
            )}
            <label className={`cursor-pointer border rounded-2xl p-4 flex flex-col items-center gap-2 transition-all ${paymentMode === 'Bank' ? 'border-purple-500 bg-purple-50 text-purple-700 ring-4 ring-purple-500/10' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>
              <input type="radio" name="mode" className="hidden" checked={paymentMode === 'Bank'} onChange={() => setPaymentMode('Bank')} />
              <CreditCard size={24} className={paymentMode === 'Bank' ? 'text-purple-600' : 'text-slate-400'} />
              <span className="text-xs font-bold">Bank Transfer</span>
            </label>
          </div>
        </div>

        {/* Conditional Content */}
        {paymentMode === 'Cash' && (
          <div className="bg-emerald-50/80 border border-emerald-100 p-4 rounded-2xl flex gap-3 text-emerald-850 animate-in fade-in duration-300">
            <CheckCircle size={20} className="shrink-0 text-emerald-600" />
            <p className="text-xs font-medium leading-relaxed">Cash payments require admin approval. Saving this will mark the fee as pending approval. Once approved, the center's cash balance ledger will be updated.</p>
          </div>
        )}

        {paymentMode === 'Online' && (
          <div className="space-y-5 animate-in fade-in duration-300">
            {/* QR Container */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col items-center shadow-sm">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4">Scan using any UPI App</p>
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-md mb-4 flex items-center justify-center shrink-0 w-44 h-44">
                {upiUri && <QRCodeSVG value={upiUri} size={144} level="M" style={{ display: 'block' }} />}
              </div>
              <div className="text-center space-y-1">
                <div className="text-xs text-slate-500">UPI ID</div>
                <div className="text-sm font-bold text-slate-800 select-all">{globalBank?.upiId}</div>
                <div className="text-[11px] font-medium text-slate-400 mt-1">Beneficiary: <span className="text-slate-600 font-semibold">{globalBank?.accountName || fee.center?.name}</span></div>
              </div>
            </div>
            
            {/* File Attachment */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Upload Proof of Payment *</label>
              {!proofOfPayment ? (
                <div className="relative border-2 border-slate-200 border-dashed rounded-2xl p-6 bg-slate-50/50 hover:bg-slate-50 hover:border-blue-400/80 transition-all flex flex-col items-center justify-center text-center cursor-pointer group">
                  <input name="proof" type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required accept="image/*,.pdf" onChange={handleFileChange} />
                  <UploadCloud className="h-10 w-10 text-slate-400 group-hover:text-blue-500 transition-colors mb-2" />
                  <p className="text-sm font-bold text-slate-700">Click to upload file</p>
                  <p className="text-xs text-slate-400 mt-1">Supports Images & PDF</p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/30 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 overflow-hidden">
                    {proofOfPayment.startsWith('data:image/') ? (
                      <img src={proofOfPayment} alt="Proof preview" className="w-12 h-12 object-cover rounded-lg border border-slate-200" />
                    ) : (
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xs border border-blue-100">PDF</div>
                    )}
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-700 truncate">Attached Proof</p>
                      <p className="text-[10px] text-green-600 font-medium flex items-center gap-1 mt-0.5"><Check size={12}/> Ready to save</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setProofOfPayment(null)} className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {paymentMode === 'Bank' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-purple-50 border border-purple-100 p-4 rounded-2xl flex gap-3 text-purple-850">
              <CreditCard size={20} className="shrink-0 text-purple-600" />
              <p className="text-xs font-medium leading-relaxed">Bank transfers require approval from the Finance/Admin team. The payment status will remain pending until approved.</p>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Bank Reference / UTR Number *</label>
              <input 
                type="text" 
                required 
                className="w-full rounded-2xl border border-slate-200 p-3.5 text-sm focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500" 
                value={bankReference} 
                onChange={(e) => setBankReference(e.target.value)} 
                placeholder="Enter NEFT/RTGS UTR Reference Number" 
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-3 pt-6 border-t border-slate-100">
          <button type="button" onClick={onClose} className="flex-1 px-5 py-3.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-350 transition-all text-sm">Cancel</button>
          <button type="submit" className={`flex-1 px-5 py-3.5 text-white rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 text-sm ${paymentMode === 'Bank' ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/25' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'}`}>
            <CheckCircle size={18} /> {paymentMode === 'Bank' ? 'Submit for Approval' : 'Confirm Payment'}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
};

export default CollectPaymentModal;
