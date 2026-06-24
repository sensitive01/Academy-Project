import React, { useRef } from 'react';
import { X, Printer } from 'lucide-react';
import logo from '../assets/logo-2.jpeg';

const MarksheetModal = ({ data, onClose }) => {
  const printRef = useRef();

  const handlePrint = () => {
    const printContent = printRef.current;
    const windowPrint = window.open('', '', 'width=900,height=800');
    windowPrint.document.write(`
      <html>
        <head>
          <title>Print Marksheet</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; background: #fffdf2; color: #000; }
            .header-container { display: flex; align-items: center; justify-content: center; margin-bottom: 20px; text-align: center; }
            .logo { width: 80px; height: auto; margin-right: 20px; }
            .college-title { color: #1e3a8a; font-size: 24px; font-weight: bold; margin: 0; }
            .college-subtitle { color: #3b82f6; font-size: 12px; margin: 5px 0; }
            .iso-text { color: #475569; font-size: 11px; margin: 0; }
            
            .exam-title { text-align: center; font-size: 18px; font-weight: bold; margin: 30px 0; }
            
            .student-info { margin-bottom: 20px; line-height: 1.8; font-size: 14px; }
            .semester-title { text-align: center; color: #2563eb; font-size: 14px; margin-bottom: 10px; font-weight: bold; }
            
            table { w-full; border-collapse: collapse; margin-bottom: 30px; background: #f8fafc; font-size: 13px; }
            th, td { border: 1px solid #e2e8f0; padding: 12px 8px; text-align: center; }
            th { font-weight: bold; }
            .subject-col { text-align: left; }
            .bold { font-weight: bold; }
            
            .explanation { margin-top: 40px; font-size: 13px; line-height: 1.6; }
            .explanation-title { font-size: 16px; margin-bottom: 10px; }
            ul { list-style: none; padding-left: 20px; }
            li { margin-bottom: 5px; }
            
            .footer-marks { font-weight: bold; }
            
            @media print {
              body { background: #fffdf2 !important; -webkit-print-color-adjust: exact; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    windowPrint.document.close();
    windowPrint.focus();
    setTimeout(() => {
      windowPrint.print();
      windowPrint.close();
    }, 250);
  };

  const { student, semester, course, marks, batch } = data;

  let grandMax = 0;
  let grandTotal = 0;
  let grandTheory = 0;
  let grandInternal = 0;
  let grandPractical = 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[95vh]">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 shrink-0 bg-slate-50 rounded-t-2xl">
          <h2 className="text-lg font-bold text-slate-800">Student Marksheet</h2>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-sm">
              <Printer size={16} /> Print
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-8" style={{ backgroundColor: '#fffdf2' }}>
          <div ref={printRef} className="max-w-3xl mx-auto">
            
            {/* Header */}
            <div className="flex items-center justify-center mb-6 text-center border-b border-slate-200 pb-6">
              <div className="flex items-center">
                {/* Academy Logo */}
                <img src={logo} alt="DRRG Academy Logo" className="w-20 h-auto mr-4 object-contain" />
                <div className="text-left">
                  <h1 className="text-[#1e3a8a] text-3xl font-extrabold m-0 tracking-wide" style={{ fontFamily: 'Times New Roman, serif' }}>DR.R.G. Academy</h1>
                  <p className="text-[#2563eb] text-xs font-semibold m-0 mt-1">Managed By R.G.Modern Educational Trust</p>
                  <p className="text-slate-600 text-[11px] m-0 mt-1 font-medium">A State Government University, An ISO 9001:2015 Certified Institution</p>
                </div>
              </div>
            </div>

            <div className="text-center text-xl font-bold mb-8 uppercase tracking-widest text-slate-800">
              EXAMINATION RESULT
            </div>

            <div className="mb-6 text-sm font-semibold text-slate-800 grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>Student Name : {student.studentNameEnglish?.toUpperCase()}</div>
                <div>Course & Year : {course?.title} - {student.year || 'I Year'}</div>
                <div>Batch : {batch?.name || 'N/A'}</div>
              </div>
              <div className="space-y-3">
                <div>Exam Code : {marks.find(m => m.examConfig)?.examConfig?.name || 'N/A'}</div>
                <div>Exam Date : {marks.find(m => m.examConfig)?.examConfig?.date ? new Date(marks.find(m => m.examConfig).examConfig.date).toLocaleDateString() : 'N/A'}</div>
              </div>
            </div>

            <div className="text-center text-[#2563eb] text-sm font-bold mb-4 uppercase">
              {semester} Semester
            </div>

            <table className="w-full border-collapse bg-[#f8fafc] text-[13px] border border-slate-200 shadow-sm">
              <thead className="bg-[#f1f5f9]">
                <tr>
                  <th className="border border-slate-200 p-3 text-center w-12">S.No</th>
                  <th className="border border-slate-200 p-3 text-left">Subject</th>
                  <th className="border border-slate-200 p-3 text-center">Max.<br/>Marks</th>
                  <th className="border border-slate-200 p-3 text-center">Pass<br/>Marks</th>
                  <th className="border border-slate-200 p-3 text-center">Theory</th>
                  <th className="border border-slate-200 p-3 text-center">Internal</th>
                  <th className="border border-slate-200 p-3 text-center">Practical</th>
                  <th className="border border-slate-200 p-3 text-center">Total<br/>Marks</th>
                  <th className="border border-slate-200 p-3 text-center">Result</th>
                </tr>
              </thead>
              <tbody>
                {marks.map((m, idx) => {
                  const theory = m.theoryMark || 0;
                  const internal = m.internalMark || 0;
                  const practical = m.practicalMark || 0;
                  const total = theory + internal + practical;
                  
                  const maxMark = m.examConfig?.totalMark || 100;
                  const passMark = m.examConfig?.passMark || 40;

                  grandMax += maxMark;
                  grandTotal += total;
                  grandTheory += theory;
                  grandInternal += internal;
                  grandPractical += practical;

                  return (
                    <tr key={m._id} className="bg-transparent hover:bg-slate-50">
                      <td className="border border-slate-200 p-3 text-center">{idx + 1}</td>
                      <td className="border border-slate-200 p-3 text-left font-medium text-slate-700 uppercase">{m.subject?.name || 'Unknown'}</td>
                      <td className="border border-slate-200 p-3 text-center">{maxMark}</td>
                      <td className="border border-slate-200 p-3 text-center">{passMark}</td>
                      <td className="border border-slate-200 p-3 text-center">{theory}</td>
                      <td className="border border-slate-200 p-3 text-center">{internal}</td>
                      <td className="border border-slate-200 p-3 text-center">{practical}</td>
                      <td className="border border-slate-200 p-3 text-center font-semibold">{total}</td>
                      <td className="border border-slate-200 p-3 text-center font-bold text-slate-800">{m.isPass ? 'PASS' : 'FAIL'}</td>
                    </tr>
                  );
                })}
                <tr className="bg-[#f1f5f9] font-bold text-slate-800">
                  <td className="border border-slate-200 p-3 text-center" colSpan="2"></td>
                  <td className="border border-slate-200 p-3 text-center">{grandMax}</td>
                  <td className="border border-slate-200 p-3 text-center"></td>
                  <td className="border border-slate-200 p-3 text-center">{grandTheory}</td>
                  <td className="border border-slate-200 p-3 text-center">{grandInternal}</td>
                  <td className="border border-slate-200 p-3 text-center">{grandPractical}</td>
                  <td className="border border-slate-200 p-3 text-center">{grandTotal}</td>
                  <td className="border border-slate-200 p-3 text-center"></td>
                </tr>
              </tbody>
            </table>

            <div className="mt-12 text-sm text-slate-800 pb-8">
              <div className="mt-6 flex justify-between items-center relative">
                <p className="font-semibold text-sm m-0 relative z-10"><span className="uppercase tracking-widest text-[#1e3a8a]">R.G. MODERN COMMUNITY COLLEGE</span></p>
                {/* <div className="absolute inset-0 flex justify-center items-center opacity-10 pointer-events-none z-0">
                  <span className="text-6xl font-extrabold text-[#1e3a8a] whitespace-nowrap overflow-hidden">RG MODERN COMMUNITY COLLEGE</span>
                </div> */}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default MarksheetModal;
