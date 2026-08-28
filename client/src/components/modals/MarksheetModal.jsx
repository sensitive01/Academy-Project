import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer } from 'lucide-react';
import logo2 from '../../assets/logo-2.jpeg';
import logoVocational from '../../assets/CVESW.png';
import logoRGAcademy from '../../assets/RG-Academy.png';
import logoRGModern from '../../assets/RG-MODERN-COMMUNITY-COLLEGE.png';
import logoUnicarewell from '../../assets/UNICAREWELL.jpeg';
import redSeal from '../../assets/red-seal.png';
import sealRGModern from '../../assets/seal-rg-modern.png';
import sealDrRgAcademy from '../../assets/seal-dr-rg-academy.png';
import sealUnicarewel from '../../assets/seal-unicarewel.png';
import sealBglrgm from '../../assets/seal-bglrgm.png';
import sealRgmtn from '../../assets/seal-rgmtn.png';

const getTemplateLogo = (templateId) => {
  switch (templateId) {
    case 'vocational_council': return logoVocational;
    case 'dr_rg_academy': return logoRGAcademy;
    case 'rg_modern':
    case 'rgmtn': return logoRGModern;
    case 'unicarewel': return logoUnicarewell;
    default: return logo2;
  }
};

const getTemplateSeal = (templateId) => {
  switch (templateId) {
    case 'vocational_council': return redSeal;
    case 'dr_rg_academy': return sealDrRgAcademy;
    case 'rg_modern': return sealRGModern;
    case 'unicarewel': return sealUnicarewel;
    case 'bglrgm': return sealBglrgm;
    case 'rgmtn': return sealRgmtn;
    default: return sealRGModern;
  }
};

const getGrade = (percentage) => {
  if (percentage >= 90) return 'O';
  if (percentage >= 75) return 'A';
  if (percentage >= 60) return 'B';
  if (percentage >= 45) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
};

const toRoman = (num) => {
  const roman = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X', 11: 'XI', 12: 'XII' };
  return roman[num] || num;
};

const templates = [
  { id: 'rg_modern', name: 'RG MODERN COMMUNITY COLLEGE' },
  { id: 'bglrgm', name: 'BGLRGM Institute Of Vocational Education Training (OPC) Private Limited' },
  { id: 'rgmtn', name: 'RGMTN Institute Of Hospitality Management (OPC) Private Limited' },
  { id: 'dr_rg_academy', name: 'DR RG ACADEMY' },
  { id: 'unicarewel', name: 'UNICAREWEL Global Education & Career Solutions (OPC) Private Limited' },
  { id: 'vocational_council', name: 'VOCATIONAL COUNCIL' }
];

const getFullTemplateName = (template) => {
  if (!template || !template.id) return 'RG MODERN COMMUNITY COLLEGE';
  switch (template.id) {
    case 'bglrgm': return 'BGLRGM Institute Of Vocational Education Training (OPC) Private Limited';
    case 'rgmtn': return 'RGMTN Institute Of Hospitality Management (OPC) Private Limited';
    case 'unicarewel': return 'UNICAREWEL Global Education & Career Solutions (OPC) Private Limited';
    default: return template.name || 'RG MODERN COMMUNITY COLLEGE';
  }
};

const MarksheetModal = ({ data, onClose, template }) => {
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
            body { font-family: Arial, sans-serif; padding: 20px; background: #ffffff; color: #000; }
            table { width: 100%; border-collapse: collapse; background: #ffffff; font-size: 13px; }
            th, td { border: 1px solid #1e293b; padding: 8px; }
            th { font-weight: bold; }
            
            @media print {
              @page { size: A4 portrait; margin: 15mm; }
              body { 
                background: #ffffff !important; 
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact;
                margin: 0;
                padding: 0;
                display: block;
              }
              button { display: none; }
              th, td { border: 1px solid #000; }
              .fit-page {
                page-break-inside: avoid;
                width: 100%;
                /* Let browser handle scale to fit instead of forced zoom */
              }
            }
          </style>
        </head>
        <body>
          <div class="fit-page">
            ${printContent.innerHTML}
          </div>
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

  const passMark = marks && marks.length > 0 && marks[0].passMark !== undefined ? marks[0].passMark : 40;
  let grandMax = 0;
  let grandTotal = 0;

  return createPortal(
    <div className="fixed inset-0 z-[10000] overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
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

        <div className="overflow-y-auto p-4 md:p-8 bg-white">
          <div ref={printRef} className="max-w-[900px] mx-auto text-black">

            {/* Outer gold frame */}
            <div style={{ background: 'linear-gradient(135deg, #b8860b 0%, #ffd700 30%, #daa520 50%, #ffd700 70%, #b8860b 100%)', padding: '8px' }}>
              {/* Thin white gap */}
              <div style={{ background: '#fff', padding: '3px' }}>
                {/* Thin gold inner liner */}
                <div style={{ border: '2px solid #b8860b', padding: '3px' }}>
                  {/* Red content border */}
                  <div style={{ border: '3px solid #b91c1c', padding: '28px', background: '#fff' }}>

                    {/* Dynamic Header Block */}
                    {template?.id === 'vocational_council' ? (
                      <div className="relative mb-2 pb-2 min-h-[88px] flex justify-center items-center">
                        <img src={getTemplateLogo(template?.id)} alt="CVESW Logo" className="absolute left-0 top-0 w-24 h-24 object-contain" />
                        <div className="text-center px-28">
                          {/* <h2 className="text-black text-lg font-bold m-0 leading-tight">राष्ट्रीय परिषद की व्यावसायिक प्रशिक्षण और अनुसंधान</h2> */}
                          <h1 className="text-black text-[22px] font-black m-0 leading-snug" style={{ fontFamily: 'Georgia, serif' }}>COUNCIL FOR VOCATIONAL EDUCATION AND SOCIAL WELFARE</h1>
                          <p className="text-black text-[11px] m-0 mt-1">Established under article 29 & 30(1) Constitution of India</p>
                          <p className="text-black text-[11px] m-0">Incorporated under the legislation of Ministry of Corporate Affairs, Section (8), Act - 2013.</p>
                          <p className="text-black text-[13px] font-bold m-0 mt-0.5 tracking-wide">GOVERNMENT OF INDIA</p>
                        </div>
                      </div>
                    ) : (
                      <div className="relative mb-2 pb-2 min-h-[88px] flex justify-center items-center">
                        <img
                          src={getTemplateLogo(template?.id)}
                          alt="Academy Logo"
                          className={`absolute left-0 top-0 object-contain rounded-md shadow-sm bg-white ${template?.id === 'dr_rg_academy' ? 'w-24 h-24' : 'w-20 h-20'
                            }`}
                        />
                        <div className="text-center px-32">
                          {template?.id === 'dr_rg_academy' ? (
                            <>
                              <h1 className="text-black text-[26px] font-extrabold m-0 tracking-wide leading-tight" style={{ fontFamily: 'Times New Roman, serif' }}>DR.R.G. Academy</h1>
                              <p className="text-black text-[12px] font-bold m-0 mt-1 uppercase">Managed By R.G.Modern Educational Trust</p>
                              <p className="text-black text-[11px] m-0 mt-1 font-bold">A State Government University, An ISO 9001:2015 Certified Institution</p>
                            </>
                          ) : (
                            <>
                              <h1 className="text-black text-[24px] font-extrabold m-0 tracking-wide leading-tight" style={{ fontFamily: 'Times New Roman, serif' }}>{getFullTemplateName(template)}</h1>

                              {/* Only show Managed By line for these templates */}
                              {['bglrgm', 'rgmtn', 'unicarewel'].includes(template?.id) && (
                                <p className="text-black text-[12px] font-semibold m-0 mt-1 uppercase">Managed By - R.G MODERN EDUCATIONAL AND CHARITABLE TRUST - (RGMECT)</p>
                              )}

                              {/* Show full address block for RG Modern */}
                              {(!template || template.id === 'rg_modern') && (
                                <>
                                  <p className="text-black text-[12px] font-semibold m-0 mt-1 uppercase">Managed By - R.G MODERN EDUCATIONAL AND CHARITABLE TRUST - (RGMECT)</p>
                                  <p className="text-black text-[11px] m-0 mt-1 font-medium">No: 21, 3rd Floor, 9th Main, 6th Cross, RK Layout – 2nd Stage, Padmanabha Nagar, Bengaluru – 560070, Karnataka.</p>
                                  <p className="text-black text-[11px] m-0 mt-1 font-medium">Email : rgmect@gmail.com</p>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="text-center text-lg font-bold mb-2 mt-2 tracking-wider text-black uppercase">
                      {(() => {
                        const map = {
                          1: 'FIRST', 2: 'SECOND', 3: 'THIRD', 4: 'FOURTH',
                          5: 'FIFTH', 6: 'SIXTH', 7: 'SEVENTH', 8: 'EIGHTH'
                        };
                        const semStr = map[semester] ? `${map[semester]} SEMESTER RESULT` : `SEMESTER ${semester} RESULT`;
                        return semStr;
                      })()}
                    </div>

                    {/* Main Monolithic Table */}
                    <table className="w-full border-collapse border border-slate-800 text-[13px] text-black">
                      <tbody>
                        {/* Row 1: Student Headers */}
                        <tr>
                          <th className="border border-slate-800 p-2 text-center text-[11px] uppercase w-[20%]" colSpan="2">REGISTER NUMBER</th>
                          <th className="border border-slate-800 p-2 text-center text-[11px] uppercase w-[40%]" colSpan="3">NAME OF THE CANDIDATE</th>
                          <th className="border border-slate-800 p-2 text-center text-[11px] uppercase w-[40%]" colSpan="4">NAME OF THE COURSE</th>
                        </tr>

                        {/* Row 2: Student Values */}
                        <tr>
                          <td className="border border-slate-800 p-2 text-center font-semibold" colSpan="2">{student.studentId}</td>
                          <td className="border border-slate-800 p-2 text-center font-semibold uppercase" colSpan="3">{student.studentNameEnglish}</td>
                          <td className="border border-slate-800 p-2 text-center font-semibold uppercase" colSpan="4">{course?.title}</td>
                        </tr>

                        {/* Row 3: Marks Headers */}
                        <tr>
                          <th className="border border-slate-800 p-2 text-center text-[11px] w-[10%]" rowSpan="2">PAPER</th>
                          <th className="border border-slate-800 p-2 text-center text-[11px] w-[15%]" rowSpan="2">COURSE CODE</th>
                          <th className="border border-slate-800 p-2 text-center text-[11px] w-[25%]" rowSpan="2">TITLE OF THE SUBJECT</th>
                          <th className="border border-slate-800 p-2 text-center text-[11px] w-[35%]" colSpan="3">MARKS</th>
                          <th className="border border-slate-800 p-2 text-center text-[11px] w-[15%]" rowSpan="2">RESULT</th>
                        </tr>
                        <tr>
                          <th className="border border-slate-800 p-2 text-center text-[9px] w-[11%]">ALLOTED</th>
                          <th className="border border-slate-800 p-2 text-center text-[9px] w-[12%]">PASS MARK</th>
                          <th className="border border-slate-800 p-2 text-center text-[9px] w-[12%]">OBTAINED</th>
                        </tr>

                        {/* Dynamic Marks Rows */}
                        {(() => {
                          let tempMax = 0;
                          let tempTotal = 0;
                          const sortedMarks = [...(marks || [])].sort((a, b) => {
                            const typeA = a.subject?.type === "Practical" ? 1 : 0;
                            const typeB = b.subject?.type === "Practical" ? 1 : 0;
                            return typeA - typeB;
                          });
                          return sortedMarks.map((m, idx) => {
                            const examConfig = m.examConfig || (m.exam && m.exam.subjects ? m.exam.subjects.find(s => (s.subject?._id || s.subject) === (m.subject?._id || m.subject)) : null);
                            const maxExt = examConfig ? (examConfig.externalMark || examConfig.theoryMark || 0) : 80;
                            const maxInt = examConfig ? (examConfig.internalMark || 0) : 20;
                            const maxMark = examConfig ? (examConfig.totalMark || (maxExt + maxInt)) : 100;
                            const passMark = examConfig && examConfig.passMark !== undefined ? examConfig.passMark : (m.passMark !== undefined ? m.passMark : 40);
                            const obtained = m.subject?.type === "Practical" ? (m.practicalMark || 0) : ((m.theoryMark || 0) + (m.internalMark || 0));
                            const isPass = obtained >= passMark;

                            tempMax += maxMark;
                            tempTotal += obtained;

                            // Update globals for the Centre summary later
                            grandMax = tempMax;
                            grandTotal = tempTotal;

                            return (
                              <tr key={m._id}>
                                <td className="border border-slate-800 p-2 text-center font-semibold">{idx + 1}</td>
                                <td className="border border-slate-800 p-2 text-center uppercase">{m.subject?.code || '-'}</td>
                                <td className="border border-slate-800 p-2 text-left pl-4 font-semibold">{m.subject?.name}</td>
                                <td className="border border-slate-800 p-2 text-center">{maxMark}</td>
                                <td className="border border-slate-800 p-2 text-center font-bold text-slate-700">{passMark}</td>
                                <td className="border border-slate-800 p-2 text-center font-bold">{obtained}</td>
                                <td className="border border-slate-800 p-2 text-center font-bold uppercase">{isPass ? 'PASS' : 'FAIL'}</td>
                              </tr>
                            );
                          });
                        })()}

                        {/* Row: DOB and Total */}
                        <tr>
                          <th className="border border-slate-800 p-2 text-center text-[11px] uppercase">DATE OF<br />BIRTH</th>
                          <td className="border border-slate-800 p-2 text-center font-semibold">
                            {student.dob ? new Date(student.dob).toLocaleDateString('en-GB') : '-'}
                          </td>
                          <th className="border border-slate-800 p-2 text-right pr-4 text-[11px]" colSpan="3">TOTAL MARKS SECURED</th>
                          <td className="border border-slate-800 p-2 text-center font-bold">{grandTotal}</td>
                          <td className="border border-slate-800 p-2 text-center"></td>
                        </tr>

                        {/* Row: Centre Headers */}
                        <tr>
                          <th className="border border-slate-800 p-2 text-center text-[11px] uppercase" colSpan="2">CENTRE<br />CODE</th>
                          <th className="border border-slate-800 p-2 text-center text-[11px] uppercase" colSpan="3">NAME OF THE CENTRE</th>
                          <th className="border border-slate-800 p-2 text-center text-[11px] uppercase">PERCENTAGE</th>
                          <th className="border border-slate-800 p-2 text-center text-[11px] uppercase">GRADE</th>
                        </tr>

                        {/* Row: Centre Values */}
                        <tr>
                          <td className="border border-slate-800 p-2 text-center font-semibold uppercase" colSpan="2">{student.center?.centerId || 'N/A'}</td>
                          <td className="border border-slate-800 p-2 text-center font-semibold uppercase" colSpan="3">
                            {(() => {
                              const shortName = student.center?.name;
                              if (!shortName) return 'N/A';
                              const upperName = shortName.toUpperCase().trim();
                              if (upperName === 'BGLRGM') return 'BGLRGM Institute Of Vocational Education Training (OPC) Private Limited';
                              if (upperName === 'RGMTN') return 'RGMTN Institute Of Hospitality Management (OPC) Private Limited';
                              if (upperName === 'UNICAREWEL') return 'UNICAREWEL Global Education & Career Solutions (OPC) Private Limited';
                              return shortName;
                            })()}
                          </td>
                          <td className="border border-slate-800 p-2 text-center font-semibold">{grandMax > 0 ? ((grandTotal / grandMax) * 100).toFixed(1) : '0.0'} %</td>
                          <td className="border border-slate-800 p-2 text-center font-bold text-lg">{grandMax > 0 ? getGrade((grandTotal / grandMax) * 100) : '-'}</td>
                        </tr>

                        {/* Row: Grade Classification & Abbreviations */}
                        <tr>
                          <td className="border border-slate-800 p-4" colSpan="7">
                            <div className="flex flex-col gap-6">
                              <div>
                                <div className="font-bold text-[12px] mb-2 uppercase">GRADE CLASSIFICATION :</div>
                                <div className="grid grid-cols-2 gap-x-12 gap-y-1.5 text-[11.5px] max-w-[600px]">
                                  <div className="flex"><span className="font-bold w-32">O : Outstanding</span><span>(90% & above)</span></div>
                                  <div className="flex"><span className="font-bold w-32">C : Fair</span><span>(45% to 59.9%)</span></div>

                                  <div className="flex"><span className="font-bold w-32">A : Excellent</span><span>(75% to 89.9%)</span></div>
                                  <div className="flex"><span className="font-bold w-32">D : Average</span><span>(40% to 44.9%)</span></div>

                                  <div className="flex"><span className="font-bold w-32">B : Good</span><span>(60% to 74.9%)</span></div>
                                  <div className="flex"><span className="font-bold w-32">F : Fail</span><span>(Below {passMark}%)</span></div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>

                        {/* Row: Footer Note */}
                        <tr>
                          <td className="border border-slate-800 p-2 text-[11px] font-medium" colSpan="7">
                            <span className="font-bold">Note :</span> Any Correction found in this entry, should be brought to the Notice of the Controller of Examinations for Investigation.
                          </td>
                        </tr>

                      </tbody>
                    </table>

                    {/* Footer Signatures (Outside the main table, but inside the border) */}
                    <div className="flex items-end justify-between mt-8 px-4">
                      <div className="text-left pb-4">
                        <p className="text-[11px] font-bold text-black m-0 uppercase">
                          {template?.id === 'vocational_council' ? 'NEW DELHI - 110 058' : 'INDIA'}
                        </p>
                      </div>
                      <div className="flex flex-col items-center">
                        <img
                          src={getTemplateSeal(template?.id)}
                          alt="Seal"
                          className="w-24 h-24 object-contain opacity-90"
                        />
                      </div>
                      <div className="flex flex-col items-center pb-2">
                        <div className="w-40 border-b border-black mb-2"></div>
                        <p className="text-[11px] font-bold text-black m-0 uppercase tracking-wide">CONTROLLER OF EXAMINATION</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default MarksheetModal;
