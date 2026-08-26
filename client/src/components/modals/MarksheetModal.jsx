import React, { useRef } from 'react';
import { X, Printer } from 'lucide-react';
import logo from '../../assets/logo-2.jpeg';

const getGrade = (percentage) => {
  if (percentage >= 90) return 'O';
  if (percentage >= 80) return 'A+';
  if (percentage >= 70) return 'A';
  if (percentage >= 60) return 'B+';
  if (percentage >= 50) return 'B';
  if (percentage >= 35) return 'C';
  return 'F';
};

const MarksheetModal = ({ data, onClose }) => {
  const printRef = useRef();

  const handlePrint = () => {
    const printContent = printRef.current;
    const styleTags = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(el => el.outerHTML)
      .join('\n');

    const windowPrint = window.open('', '', 'width=900,height=800');
    windowPrint.document.write(`
      <html>
        <head>
          <title>Print Marksheet</title>
          ${styleTags}
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
    }, 750);
  };

  const { student, semester, course, marks, batch } = data;

  let grandMax = 0;
  let grandTotal = 0;

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
            <div className="grid grid-cols-[100px_1fr_100px] items-center mb-6 border-b border-slate-200 pb-6">
              <div className="flex justify-start">
                {/* Academy Logo */}
                <img src={logo} alt="DRRG Academy Logo" className="w-20 h-auto object-contain" />
              </div>
              <div className="text-center">
                <h1 className="text-[#1e3a8a] text-3xl font-extrabold m-0 tracking-wide" style={{ fontFamily: 'Times New Roman, serif' }}>RG MODERN COMMUNITY COLLEGE</h1>
                <p className="text-[#2563eb] text-xs font-semibold m-0 mt-1">Managed By - R.G MODERN EDUCATIONAL AND CHARITABLE TRUST - (RGMECT)</p>
                <p className="text-slate-600 text-[11px] m-0 mt-1 font-medium">No: 21, 3rd Floor, 9th Main, 6th Cross, RK Layout – 2nd Stage, Padmanabha Nagar, Bengaluru – 560070, Karnataka. Email : rgmect@gmail.com</p>
              </div>
              <div></div>
            </div>

            <div className="text-center text-xl font-bold mb-8 uppercase tracking-widest text-slate-800">
              EXAMINATION RESULT
            </div>

            <div className="mb-6 text-sm font-semibold text-slate-800 flex justify-between">
              <div className="space-y-3">
                <div>Student Name : {student.studentNameEnglish?.toUpperCase()}</div>
                <div>Course & Year : {course?.title} - {student.year || 'I Year'}</div>
              </div>
              <div className="space-y-3 text-right">
                <div>Enrollment No : {student.studentId}</div>
                <div>Batch : {batch?.name || 'N/A'}</div>
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
                  <th className="border border-slate-200 p-3 text-center">Max.<br />Marks</th>
                  <th className="border border-slate-200 p-3 text-center">Pass<br />Marks</th>
                  <th className="border border-slate-200 p-3 text-center">External</th>
                  <th className="border border-slate-200 p-3 text-center">Internal</th>
                  <th className="border border-slate-200 p-3 text-center">Total<br />Marks</th>
                  <th className="border border-slate-200 p-3 text-center">Grade</th>
                  <th className="border border-slate-200 p-3 text-center">Result</th>
                </tr>
              </thead>
              <tbody>
                {marks.map((m, idx) => {
                  const external = m.subject?.type === "Practical" ? (m.practicalMark || 0) : (m.theoryMark || 0);
                  const internal = m.internalMark || 0;
                  const total = external + internal;

                  const maxMark = 100;
                  const passMark = 35;

                  grandMax += maxMark;
                  grandTotal += total;

                  return (
                    <tr key={m._id} className="bg-transparent hover:bg-slate-50">
                      <td className="border border-slate-200 p-3 text-center">{idx + 1}</td>
                      <td className="border border-slate-200 p-3 text-left font-medium text-slate-700 uppercase">{m.subject?.name || 'Unknown'} ({m.subject?.type || 'Theory'})</td>
                      <td className="border border-slate-200 p-3 text-center">{maxMark}</td>
                      <td className="border border-slate-200 p-3 text-center">{passMark}</td>
                      <td className="border border-slate-200 p-3 text-center">{external}</td>
                      <td className="border border-slate-200 p-3 text-center">{internal}</td>
                      <td className="border border-slate-200 p-3 text-center font-semibold">{total}</td>
                      <td className="border border-slate-200 p-3 text-center font-bold text-[#1e3a8a]">{getGrade((total / maxMark) * 100)}</td>
                      <td className="border border-slate-200 p-3 text-center font-bold text-slate-800">{m.isPass ? 'PASS' : 'FAIL'}</td>
                    </tr>
                  );
                })}
                <tr className="bg-[#f1f5f9] font-bold text-slate-800">
                  <td className="border border-slate-200 p-3 text-center" colSpan="2"></td>
                  <td className="border border-slate-200 p-3 text-center">{grandMax}</td>
                  <td className="border border-slate-200 p-3 text-center"></td>
                  <td className="border border-slate-200 p-3 text-center"></td>
                  <td className="border border-slate-200 p-3 text-center"></td>
                  <td className="border border-slate-200 p-3 text-center font-bold">{grandTotal}</td>
                  <td className="border border-slate-200 p-3 text-center font-bold text-[#1e3a8a]">{grandMax > 0 ? getGrade((grandTotal / grandMax) * 100) : '-'}</td>
                  <td className="border border-slate-200 p-3 text-center"></td>
                </tr>
              </tbody>
            </table>

            <div className="mt-8 border border-slate-200 rounded-lg bg-slate-50 p-4">
              <h4 className="font-bold text-xs text-slate-800 mb-3 uppercase tracking-wider">Grading Scale Reference</h4>
              <div className="flex flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded text-slate-700 shadow-sm"><span className="font-extrabold text-[#1e3a8a] w-5 text-center">O</span> <span className="text-slate-400">|</span> 90-100%</div>
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded text-slate-700 shadow-sm"><span className="font-extrabold text-[#1e3a8a] w-5 text-center">A+</span> <span className="text-slate-400">|</span> 80-89%</div>
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded text-slate-700 shadow-sm"><span className="font-extrabold text-[#1e3a8a] w-5 text-center">A</span> <span className="text-slate-400">|</span> 70-79%</div>
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded text-slate-700 shadow-sm"><span className="font-extrabold text-[#1e3a8a] w-5 text-center">B+</span> <span className="text-slate-400">|</span> 60-69%</div>
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded text-slate-700 shadow-sm"><span className="font-extrabold text-[#1e3a8a] w-5 text-center">B</span> <span className="text-slate-400">|</span> 50-59%</div>
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded text-slate-700 shadow-sm"><span className="font-extrabold text-[#1e3a8a] w-5 text-center">C</span> <span className="text-slate-400">|</span> 35-49%</div>
                <div className="flex items-center gap-1.5 bg-white border border-red-100 px-2.5 py-1.5 rounded text-red-700 bg-red-50 shadow-sm"><span className="font-extrabold w-5 text-center">F</span> <span className="text-red-300">|</span> Below 35%</div>
              </div>
            </div>

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
