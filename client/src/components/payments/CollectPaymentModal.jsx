import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, CreditCard, Banknote, UploadCloud, Check, Trash2, ArrowLeft } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../services/api';

const CollectPaymentModal = ({ onClose, onSave, fee, schemeLabel }) => {
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [bankReference, setBankReference] = useState('');
  const [proofOfPayment, setProofOfPayment] = useState(null);
  
  const hasBreakdown = fee.feeBreakdown && fee.feeBreakdown.length > 0;
  
  const [selectedYearIdx, setSelectedYearIdx] = useState(() => {
    if (!hasBreakdown) return -1;
    
    // Determine the year label of the current fee row
    let currentRowYearLabel = fee.year || fee.otherFeeType || fee.student?.year || "Unknown";
    const match = String(currentRowYearLabel).match(/\d+/);
    if (match) {
      const n = match[0];
      if (n === "1") currentRowYearLabel = "1st Year";
      else if (n === "2") currentRowYearLabel = "2nd Year";
      else if (n === "3") currentRowYearLabel = "3rd Year";
      else currentRowYearLabel = `${n}th Year`;
    }

    // Try to find the exact year match first
    const exactMatchIdx = fee.feeBreakdown.findIndex(b => b.yearLabel === currentRowYearLabel);
    if (exactMatchIdx !== -1) return exactMatchIdx;

    // Fallback: first year with a balance
    const idx = fee.feeBreakdown.findIndex(b => b.balance > 0);
    return idx !== -1 ? idx : 0;
  });

  const currentFeeData = hasBreakdown && selectedYearIdx >= 0 ? fee.feeBreakdown[selectedYearIdx] : fee;
  
  const totalAmount = currentFeeData.totalDue !== undefined ? currentFeeData.totalDue : ((fee.amount || 0) + (fee.isPenaltyApplied ? fee.penaltyAmount : 0) + (fee.isFinalPenaltyApplied ? fee.finalPenaltyAmount : 0));

  const totalApprovedPaid = currentFeeData.balance !== undefined ? (currentFeeData.totalDue - currentFeeData.balance) : (fee.payments ? fee.payments.filter(p => p.status === 'Approved').reduce((sum, p) => sum + p.amount, 0) : (fee.status === 'paid' ? fee.amount : 0));

  const remainingBalance = currentFeeData.balance !== undefined ? currentFeeData.balance : Math.max(0, totalAmount - totalApprovedPaid);

  const isBoth = fee.feeType === 'Both';
  
  const courseTotal = currentFeeData.courseTotal !== undefined ? currentFeeData.courseTotal : ((fee.courseAmount || 0) + (fee.coursePenaltyAmount || 0));
  const courseBalance = currentFeeData.courseBalance !== undefined ? currentFeeData.courseBalance : Math.max(0, courseTotal - (fee.coursePayments ? fee.coursePayments.filter(p => p.status === 'Approved').reduce((s, p) => s + p.amount, 0) : 0));

  const councilTotal = currentFeeData.councilTotal !== undefined ? currentFeeData.councilTotal : ((fee.councilAmount || 0) + (fee.councilPenaltyAmount || 0));
  const councilBalance = currentFeeData.councilBalance !== undefined ? currentFeeData.councilBalance : Math.max(0, councilTotal - (fee.councilPayments ? fee.councilPayments.filter(p => p.status === 'Approved').reduce((s, p) => s + p.amount, 0) : 0));

  const [targetFeeType, setTargetFeeType] = useState(isBoth ? (courseBalance > 0 ? 'Course' : 'Council') : fee.feeType);

  useEffect(() => {
    if (isBoth) {
      setTargetFeeType(courseBalance > 0 ? 'Course' : 'Council');
    }
  }, [selectedYearIdx, courseBalance, isBoth]);

  const displayTotalAmount = isBoth ? (targetFeeType === 'Course' ? courseTotal : councilTotal) : totalAmount;
  const displayRemainingBalance = isBoth ? (targetFeeType === 'Course' ? courseBalance : councilBalance) : remainingBalance;

  const [collectAmount, setCollectAmount] = useState(displayRemainingBalance);

  useEffect(() => {
    setCollectAmount(displayRemainingBalance);
  }, [displayRemainingBalance]);

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
    const actualStudentId = fee.studentId || fee.student?._id || fee.student;
    
    // Determine which year to pass to backend collect-cascade
    let yearToPass = fee.year;
    if (hasBreakdown && selectedYearIdx >= 0) {
      yearToPass = fee.feeBreakdown[selectedYearIdx].yearLabel;
    }
    
    onSave(actualStudentId, data, isBoth ? targetFeeType : undefined, yearToPass);
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

  const container = document.getElementById('main-scroll-container') || document.body;

  return createPortal(
    <div className="absolute inset-0 z-[100] bg-slate-50 flex flex-col min-h-full animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
        <button type="button" onClick={onClose} className="p-2 -ml-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors">
          <ArrowLeft size={22} />
        </button>
        <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <CreditCard size={20} />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Collect Payment</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl max-w-3xl w-full mx-auto shadow-sm border border-slate-100 p-6 sm:p-10 space-y-8">

        {/* Total Due Card */}
        {isBoth && (
          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Fee to Pay</label>
            <div className="flex gap-4">
              <label className={`flex-1 cursor-pointer border rounded-xl p-3 flex items-center justify-between transition-all ${targetFeeType === 'Course' ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20' : 'border-slate-200 bg-white hover:border-slate-300'} ${courseBalance <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <div className="flex items-center gap-2">
                  <input type="radio" name="targetFee" className="w-4 h-4 text-brand-600 focus:ring-brand-500" checked={targetFeeType === 'Course'} onChange={() => setTargetFeeType('Course')} disabled={courseBalance <= 0} />
                  <span className="text-sm font-bold text-slate-800">Course Fees</span>
                </div>
                <span className="text-xs font-bold text-slate-500">Bal: ₹{courseBalance.toLocaleString('en-IN')}</span>
              </label>
              <label className={`flex-1 cursor-pointer border rounded-xl p-3 flex items-center justify-between transition-all ${targetFeeType === 'Council' ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20' : 'border-slate-200 bg-white hover:border-slate-300'} ${councilBalance <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <div className="flex items-center gap-2">
                  <input type="radio" name="targetFee" className="w-4 h-4 text-brand-600 focus:ring-brand-500" checked={targetFeeType === 'Council'} onChange={() => setTargetFeeType('Council')} disabled={councilBalance <= 0} />
                  <span className="text-sm font-bold text-slate-800">Council Fees</span>
                </div>
                <span className="text-xs font-bold text-slate-500">Bal: ₹{councilBalance.toLocaleString('en-IN')}</span>
              </label>
            </div>
          </div>
        )}
        
        {/* Outstanding Balances Summary */}
        {hasBreakdown && fee.feeBreakdown.some(b => (isBoth ? (targetFeeType === 'Course' ? b.courseBalance : b.councilBalance) : b.balance) > 0) && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5">
            <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-3">Outstanding Balances Summary</h3>
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex flex-wrap gap-x-8 gap-y-4">
                {fee.feeBreakdown.filter(b => (isBoth ? (targetFeeType === 'Course' ? b.courseBalance : b.councilBalance) : b.balance) > 0).map((b, idx) => {
                  const bal = isBoth ? (targetFeeType === 'Course' ? b.courseBalance : b.councilBalance) : b.balance;
                  return (
                    <div key={idx} className="flex flex-col">
                      <span className="text-xs text-amber-700 font-medium mb-0.5">{b.yearLabel} {isBoth ? targetFeeType : ''} Fees Balance</span>
                      <span className="text-lg font-black text-amber-900">₹{bal.toLocaleString('en-IN')}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-col p-3 px-4 bg-amber-100/70 rounded-xl border border-amber-200/60 min-w-[160px]">
                <span className="text-xs text-amber-800 font-bold mb-0.5">Total {isBoth ? targetFeeType : ''} Fees Balance</span>
                <span className="text-xl font-black text-amber-900">
                  ₹{fee.feeBreakdown.reduce((sum, b) => sum + (isBoth ? (targetFeeType === 'Course' ? b.courseBalance : b.councilBalance) : b.balance), 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        )}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-5 rounded-2xl text-white shadow-md flex justify-between items-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 mix-blend-overlay flex items-center justify-center pointer-events-none">
            <svg className="w-full h-full text-white" viewBox="0 0 100 100" preserveAspectRatio="none">
               <path d="M0,0 L100,100 M100,0 L0,100" stroke="currentColor" strokeWidth="1" fill="none"/>
            </svg>
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-1">Remaining Balance / Total Fee</p>
            <p className="text-3xl font-black tracking-tight">₹{displayRemainingBalance.toLocaleString('en-IN')} <span className="text-xs font-normal text-indigo-200/70">/ ₹{displayTotalAmount.toLocaleString('en-IN')}</span></p>
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



        {hasBreakdown && fee.feeBreakdown.length > 1 && (
          <div className="space-y-2 mb-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Select Academic Year</label>
            <select
              value={selectedYearIdx}
              onChange={(e) => setSelectedYearIdx(Number(e.target.value))}
              className="w-full rounded-2xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 font-bold text-slate-800 bg-white shadow-sm"
            >
              {fee.feeBreakdown.map((b, idx) => (
                <option key={idx} value={idx}>
                  {b.yearLabel}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Collection Amount Input */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Amount to Collect *</label>
          <input 
            type="text" 
            required 
            className="w-full rounded-2xl border border-slate-200 p-3.5 text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 font-bold text-slate-800" 
            value={collectAmount === '' ? '' : Number(collectAmount).toLocaleString('en-IN')} 
            onChange={(e) => {
              const rawValue = e.target.value.replace(/[^0-9]/g, '');
              if (!rawValue) {
                setCollectAmount('');
              } else {
                let parsed = parseInt(rawValue, 10);
                if (parsed > displayRemainingBalance) {
                  parsed = displayRemainingBalance;
                }
                setCollectAmount(parsed);
              }
            }} 
            placeholder="Enter collection amount" 
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
      </div>
    </div>,
    container
  );
};

export default CollectPaymentModal;
