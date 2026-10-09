import React from 'react';
import { toWords } from 'number-to-words';
import logo from '../../assets/RG-Academy.png';

const FeeReceiptTemplate = ({ receiptData }) => {
  if (!receiptData) return null;

  const {
    receiptNo = '-',
    date = new Date().toLocaleDateString('en-GB'),
    academicYear = '-',
    department = '-',
    studentName = '-',
    rollNo = '-',
    course = '-',
    semester = '-',
    feeCategory = 'Tuition Fee',
    paymentDetails = [], // Array of { description, amount, date, methodRef }
    baseFee = 0,
    penaltyAmountApplied = 0,
    totalFeesDue = 0,
    totalFeesPaid = 0,
    paymentMethod = '-',
    transactionRef = '-',
  } = receiptData;

  const balanceRemaining = totalFeesDue - totalFeesPaid;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0).replace('₹', '₹');
  };

  let amountInWords = "";
  try {
    amountInWords = toWords(totalFeesPaid).replace(/-/g, ' ');
    amountInWords = amountInWords.replace(/\b\w/g, l => l.toUpperCase());
  } catch (e) {}

  const tableRows = [...paymentDetails];
  // Pad with empty rows to match the template style
  while (tableRows.length < 3) {
    tableRows.push({ description: '', amount: null, date: '', methodRef: '' });
  }

  // Underlined Field Component
  const Field = ({ label, value, width = "w-full" }) => (
    <div className={`flex items-end ${width}`}>
      <span className="font-bold text-gray-700 text-xs whitespace-nowrap mr-3 uppercase">{label}</span>
      <div className="flex-1 border-b border-gray-300 pb-0.5 text-gray-800 text-sm min-w-[50px] font-medium">
        {value}
      </div>
    </div>
  );

  return (
    <div className="bg-white mx-auto p-10 max-w-4xl text-sm font-sans" style={{ color: '#333' }}>
      
      {/* Header */}
      <div className="flex gap-6 mb-6">
        <div className="w-28 h-28 border border-gray-300 rounded-lg p-3 flex items-center justify-center shrink-0">
          <img src={logo} alt="Logo" className="max-w-full max-h-full object-contain" />
        </div>
        <div className="flex-1 flex flex-col justify-center">
          <h1 className="text-2xl font-bold text-[#1c3c5a] mb-2 uppercase tracking-wide">DR. ACADEMY</h1>
          <div className="border-b border-gray-300 mb-2"></div>
          <p className="text-gray-500 text-sm">#123, Education Block, Bangalore, India</p>
          <div className="border-b border-gray-300 my-2"></div>
          <p className="text-gray-500 text-sm">Phone: +91-9876543210 / Email: info@dracademy.in / Website: www.drrgacademy.com</p>
          <div className="border-b border-gray-300 mt-2"></div> 
        </div>
      </div>

      {/* Main Title Banner */}
      <div className="bg-[#1c3c5a] text-white flex justify-between items-center px-5 py-3 rounded-t-sm mb-6">
        <h2 className="text-xl font-bold uppercase tracking-wider">College Fees Receipt</h2>
        <div className="flex flex-col gap-1 items-end text-xs font-bold">
          <div className="flex items-end">
            <span className="mr-2 uppercase">Receipt No.</span>
            <div className="border-b border-white pb-0.5 min-w-[100px] text-right">{receiptNo}</div>
          </div>
          <div className="flex items-end">
            <span className="mr-2 uppercase">Date</span>
            <div className="border-b border-white pb-0.5 min-w-[100px] text-right">{date}</div>
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div className="flex flex-col gap-5 mb-8">
        <div className="flex gap-10">
          <Field label="Academic Year" value={academicYear} width="w-1/2" />
          <Field label="Department" value={department} width="w-1/2" />
        </div>
        <div className="flex gap-10">
          <Field label="Student Name" value={studentName} width="w-1/2" />
          <Field label="Admission / Roll No." value={rollNo} width="w-1/2" />
        </div>
        <div className="flex gap-10">
          <Field label="Course / Program" value={course} width="w-1/2" />
          <Field label="Semester / Year" value={semester} width="w-1/2" />
        </div>
        <div className="flex gap-10">
          <Field label="Fee Category" value={feeCategory} />
        </div>
      </div>

      {/* Payment Details Banner */}
      <div className="bg-[#3b7ba8] text-white px-4 py-2 font-bold uppercase text-sm mb-2 rounded-t-sm">
        Payment Details
      </div>

      {/* Table */}
      <div className="border border-gray-300 rounded-sm mb-6">
        <div className="flex bg-white font-bold text-gray-500 text-xs uppercase">
          <div className="flex-[2] py-3 px-4 border-r border-b border-gray-300">Fee Description</div>
          <div className="flex-1 py-3 px-4 border-r border-b border-gray-300 text-right">Amount</div>
          <div className="flex-1 py-3 px-4 border-r border-b border-gray-300 text-center">Payment Date</div>
          <div className="flex-1 py-3 px-4 border-b border-gray-300 text-center">Method / Ref.</div>
        </div>
        
        {tableRows.map((row, idx) => (
          <div key={idx} className={`flex text-sm text-gray-700 ${idx !== tableRows.length - 1 ? 'border-b border-gray-200' : ''}`}>
            <div className="flex-[2] py-3 px-4 border-r border-gray-200">{row.description}</div>
            <div className="flex-1 py-3 px-4 border-r border-gray-200 text-right font-medium">
              {row.amount !== null ? formatCurrency(row.amount) : ''}
            </div>
            <div className="flex-1 py-3 px-4 border-r border-gray-200 text-center">{row.date}</div>
            <div className="flex-1 py-3 px-4 text-center">{row.methodRef}</div>
          </div>
        ))}
      </div>

      {/* Summary Box */}
      <div className="flex justify-end mb-6">
        <div className="bg-[#eef4f8] rounded p-6 w-[400px]">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-gray-700 uppercase text-xs">Base Fee</span>
            <span className="font-medium text-gray-800 border-b border-gray-300 pb-0.5 min-w-[120px] text-right">
              {formatCurrency(baseFee)}
            </span>
          </div>
          {penaltyAmountApplied > 0 && (
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-red-600 uppercase text-xs">Late Fee Penalty</span>
              <span className="font-medium text-red-700 border-b border-gray-300 pb-0.5 min-w-[120px] text-right">
                {formatCurrency(penaltyAmountApplied)}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center mb-4 mt-4 pt-4 border-t border-gray-300">
            <span className="font-bold text-gray-700 uppercase text-xs">Total Fees Due</span>
            <span className="font-medium text-gray-800 border-b border-gray-300 pb-0.5 min-w-[120px] text-right">
              {formatCurrency(totalFeesDue)}
            </span>
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="font-bold text-gray-700 uppercase text-xs">Total Fees Paid</span>
            <span className="font-medium text-gray-800 border-b border-gray-300 pb-0.5 min-w-[120px] text-right">
              {formatCurrency(totalFeesPaid)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-bold text-[#1c3c5a] uppercase text-sm">Balance Remaining</span>
            <span className="font-bold text-[#1c3c5a] border-b border-gray-400 pb-0.5 min-w-[120px] text-right">
              {formatCurrency(balanceRemaining)}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Method & Ref */}
      <div className="flex gap-10 mb-6">
        <Field label="Payment Method" value={paymentMethod} width="w-1/2" />
        <Field label="Transaction / Reference No." value={transactionRef} width="w-1/2" />
      </div>

      {/* Amount in words */}
      <div className="mb-16">
        <Field label="Amount received in words:" value={`Indian Rupee ${amountInWords} Only`} />
      </div>

      {/* Footer */}
      <div className="text-gray-500 text-xs mb-8">
        Balance remaining = total fees due - total fees paid.
      </div>
      
      <div className="flex justify-between items-end font-bold text-gray-700 text-sm uppercase">
        <div>Student Copy</div>
        <div>Authorized signature / college seal</div>
      </div>

    </div>
  );
};

export default FeeReceiptTemplate;