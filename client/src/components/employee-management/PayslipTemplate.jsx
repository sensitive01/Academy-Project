import React from 'react';
import { toWords } from 'number-to-words';
import logo from '../../assets/RG-Academy.png';

const PayslipTemplate = ({ payrollData, selectedMonth }) => {
  if (!payrollData) return null;

  const {
    name,
    department,
    employeeId,
    displayId,
    isIntern,
    joiningDate,
    basic,
    grossSalary,
    netSalary,
    totalDays,
    present,
    absent,
    adjustments = [],
    totalAllowances = 0,
    totalDeductions = 0,
    advance = 0,
    courseFeeDeduction = 0,
    councilFeeDeduction = 0,
    examFeeDeduction = 0,
  } = payrollData;

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  let monthStr = selectedMonth;
  let yearStr = "";
  if (selectedMonth && selectedMonth.includes('-')) {
    const [y, m] = selectedMonth.split('-');
    monthStr = monthNames[parseInt(m, 10) - 1];
    yearStr = y;
  }

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0).replace('₹', '₹');
  };

  // Group adjustments
  const allowancesList = adjustments.filter(a => a.type === 'allowance');
  const deductionsList = adjustments.filter(a => ['deduction', 'advance', 'course_fee', 'council_fee', 'exam_fee'].includes(a.type));
  
  if (advance > 0 && !deductionsList.some(a => a.type === 'advance')) {
      deductionsList.push({ type: 'advance', note: 'Advance Pay', amount: advance });
  }
  if (courseFeeDeduction > 0 && !deductionsList.some(a => a.type === 'course_fee')) {
      deductionsList.push({ type: 'course_fee', note: 'Course Fee', amount: courseFeeDeduction });
  }
  if (councilFeeDeduction > 0 && !deductionsList.some(a => a.type === 'council_fee')) {
      deductionsList.push({ type: 'council_fee', note: 'Council Fee', amount: councilFeeDeduction });
  }
  if (examFeeDeduction > 0 && !deductionsList.some(a => a.type === 'exam_fee')) {
      deductionsList.push({ type: 'exam_fee', note: 'Exam Fee', amount: examFeeDeduction });
  }

  const earnings = [
    { label: 'Basic', amount: basic, ytd: basic * 12 },
    ...allowancesList.map(a => ({ label: a.note || 'Allowance', amount: a.amount, ytd: a.amount * 12 }))
  ];

  const totalEarningsAmt = earnings.reduce((acc, curr) => acc + curr.amount, 0);

  const deductions = deductionsList.map(d => ({
    label: d.note || (d.type === 'advance' ? 'Advance' : 'Deduction'),
    amount: d.amount,
    ytd: d.amount * 12
  }));

  const totalDeductionsAmt = deductions.reduce((acc, curr) => acc + curr.amount, 0);

  const calculatedNetSalary = totalEarningsAmt - totalDeductionsAmt;

  // Fill empty rows to make the table symmetrical
  const maxRows = Math.max(earnings.length, deductions.length, 5);
  const earningsRows = [...earnings];
  const deductionsRows = [...deductions];
  
  while (earningsRows.length < maxRows) {
    earningsRows.push({ label: '', amount: null, ytd: null });
  }
  while (deductionsRows.length < maxRows) {
    deductionsRows.push({ label: '', amount: null, ytd: null });
  }

  let amountInWords = "";
  try {
    amountInWords = toWords(calculatedNetSalary).replace(/-/g, ' ');
    // capitalize first letter of each word
    amountInWords = amountInWords.replace(/\b\w/g, l => l.toUpperCase());
  } catch (e) {}

  return (
    <div className="bg-white mx-auto p-8 rounded-xl shadow-sm border border-gray-200 max-w-4xl text-sm font-sans" style={{ color: '#333' }}>
      
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            <img src={logo} alt="Dr. Academy" className="h-12 object-contain mr-3" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight leading-none mb-1">Dr. Academy</h1>
            <p className="text-gray-500 text-xs">Bangalore, India</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-gray-500 text-xs font-semibold mb-1">Payslip For the Month</p>
          <p className="text-lg font-bold text-gray-800">{monthStr} {yearStr}</p>
        </div>
      </div>

      <div className="border-b border-gray-200 mb-6"></div>

      {/* Employee Summary Section */}
      <div className="mb-2">
        <h2 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-4">Employee Summary</h2>
      </div>

      <div className="flex flex-col md:flex-row gap-8 mb-6">
        {/* Details Grid */}
        <div className="flex-1 grid grid-cols-1 gap-y-3 text-sm">
          <div className="flex">
            <div className="w-40 text-gray-500">Employee Name</div>
            <div className="font-semibold text-gray-800">: {name}</div>
          </div>
          <div className="flex">
            <div className="w-40 text-gray-500">Designation</div>
            <div className="font-semibold text-gray-800">: {department || '-'}</div>
          </div>
          <div className="flex">
            <div className="w-40 text-gray-500">{isIntern ? "Intern ID" : "Employee ID"}</div>
            <div className="font-semibold text-gray-800">: {displayId || employeeId?.substring?.(0, 8)?.toUpperCase() || '-'}</div>
          </div>
          <div className="flex">
            <div className="w-40 text-gray-500">Date of Joining</div>
            <div className="font-semibold text-gray-800">: {joiningDate ? new Date(joiningDate).toLocaleDateString('en-GB') : '-'}</div>
          </div>
          <div className="flex">
            <div className="w-40 text-gray-500">Pay Period</div>
            <div className="font-semibold text-gray-800">: {monthStr} {yearStr}</div>
          </div>
          <div className="flex">
            <div className="w-40 text-gray-500">Pay Date</div>
            <div className="font-semibold text-gray-800">: {new Date().toLocaleDateString('en-GB')}</div>
          </div>
        </div>

        {/* Net Pay Card */}
        <div className="w-full md:w-80 bg-[#f4fcf7] border border-[#e5f5ea] rounded-xl p-5 flex flex-col justify-center">
          <div className="flex mb-1">
             <div className="w-1 bg-green-500 rounded-full mr-3"></div>
             <div>
               <div className="text-2xl font-bold text-gray-800">{formatCurrency(calculatedNetSalary)}</div>
               <div className="text-gray-500 text-xs mt-1">{isIntern ? "Intern Net Pay" : "Employee Net Pay"}</div>
             </div>
          </div>
          
          <div className="border-t border-[#e5f5ea] my-4"></div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Paid Days</span>
              <span className="font-semibold text-gray-800">: {totalDays || present || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">LOP Days</span>
              <span className="font-semibold text-gray-800">: {absent || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* PF / UAN Line */}
      <div className="flex gap-16 border-t border-b border-gray-100 py-3 mb-6 text-sm">
        <div className="flex">
          <span className="text-gray-500 w-32">PF A/C Number</span>
          <span className="font-semibold text-gray-800">: -</span>
        </div>
        <div className="flex">
          <span className="text-gray-500 w-24">UAN</span>
          <span className="font-semibold text-gray-800">: -</span>
        </div>
      </div>

      {/* Salary Details Table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
        {/* Table Header */}
        <div className="flex text-xs font-bold text-gray-600 bg-gray-50 border-b border-gray-200 uppercase tracking-wider">
          <div className="flex-1 py-3 px-4 border-r border-gray-200 flex">
            <div className="flex-1">Earnings</div>
            <div className="w-24 text-right">Amount</div>
            <div className="w-24 text-right hidden sm:block">YTD</div>
          </div>
          <div className="flex-1 py-3 px-4 flex">
            <div className="flex-1">Deductions</div>
            <div className="w-24 text-right">Amount</div>
            <div className="w-24 text-right hidden sm:block">YTD</div>
          </div>
        </div>

        {/* Table Body */}
        <div className="flex text-sm text-gray-800">
          {/* Earnings Column */}
          <div className="flex-1 border-r border-gray-200">
            {earningsRows.map((row, i) => (
              <div key={`earn-${i}`} className="flex py-3 px-4">
                <div className="flex-1">{row.label}</div>
                <div className="w-24 text-right font-medium">{row.amount !== null ? formatCurrency(row.amount) : ''}</div>
                <div className="w-24 text-right text-gray-500 hidden sm:block">{row.ytd !== null ? formatCurrency(row.ytd) : ''}</div>
              </div>
            ))}
          </div>

          {/* Deductions Column */}
          <div className="flex-1">
            {deductionsRows.map((row, i) => (
              <div key={`ded-${i}`} className="flex py-3 px-4">
                <div className="flex-1">{row.label}</div>
                <div className="w-24 text-right font-medium">{row.amount !== null ? formatCurrency(row.amount) : ''}</div>
                <div className="w-24 text-right text-gray-500 hidden sm:block">{row.ytd !== null ? formatCurrency(row.ytd) : ''}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Table Footer */}
        <div className="flex text-sm font-bold text-gray-800 bg-gray-50 border-t border-gray-200">
          <div className="flex-1 py-3 px-4 border-r border-gray-200 flex">
            <div className="flex-1">Gross Earnings</div>
            <div className="w-24 text-right">{formatCurrency(totalEarningsAmt)}</div>
            <div className="w-24 hidden sm:block"></div>
          </div>
          <div className="flex-1 py-3 px-4 flex">
            <div className="flex-1">Total Deductions</div>
            <div className="w-24 text-right">{formatCurrency(totalDeductionsAmt)}</div>
            <div className="w-24 hidden sm:block"></div>
          </div>
        </div>
      </div>

      {/* Net Payable Box */}
      <div className="border border-gray-200 rounded-xl overflow-hidden mb-4 flex items-stretch">
        <div className="p-4 flex-1 flex items-center">
          <div className="font-bold text-sm text-gray-800">TOTAL NET PAYABLE</div>
          <div className="text-gray-400 text-xs ml-2">(Gross Earnings - Total Deductions)</div>
        </div>
        <div className="bg-[#f4fcf7] px-8 py-4 flex items-center justify-center min-w-[200px]">
          <span className="text-lg font-bold text-gray-800">{formatCurrency(calculatedNetSalary)}</span>
        </div>
      </div>

      {/* Amount in words */}
      <div className="text-xs text-gray-500 text-right mb-12">
        Amount In Words : <span className="font-semibold text-gray-700">Indian Rupee {amountInWords} Only</span>
      </div>

      {/* Footer Text */}
      <div className="text-center text-[11px] text-gray-400 border-t border-gray-100 pt-4">
        -- This document has been automatically generated by Dr. Academy Payroll; therefore, a signature is not required. --
      </div>

    </div>
  );
};

export default PayslipTemplate;