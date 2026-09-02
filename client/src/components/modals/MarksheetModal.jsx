import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'react-hot-toast';
import logo2 from '../../assets/logo-2.png';
import logoVocational from '../../assets/CVESW.png';
import logoRGAcademy from '../../assets/RG-Academy.png';
import logoRGModern from '../../assets/RG-MODERN-COMMUNITY-COLLEGE.png';
import logoUnicarewell from '../../assets/UNICAREWELL.png';
import redSeal from '../../assets/red-seal.png';
import sealRGModern from '../../assets/seal-rg-modern.png';
import sealDrRgAcademy from '../../assets/seal-dr-rg-academy.png';
import sealUnicarewel from '../../assets/seal-unicarewel.png';
import sealBglrgm from '../../assets/seal-bglrgm.png';
import sealRgmtn from '../../assets/seal-rgmtn.png';
import councilHeader from '../../assets/council-header.png';

const getTemplateLogo = (templateId) => {
  switch (templateId) {
    case 'vocational_council': return logoVocational;
    case 'dr_rg_academy':
    case 'bglrgm': return logoRGAcademy;
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

const DynamicSeal = ({ template }) => {
  const getStarPoints = (points, outerRadius, innerRadius, center) => {
    let p = [];
    for (let i = 0; i < points * 2; i++) {
      let radius = i % 2 === 0 ? outerRadius : innerRadius;
      let angle = (i * Math.PI) / points;
      let x = center + radius * Math.sin(angle);
      let y = center - radius * Math.cos(angle);
      p.push(`${x},${y}`);
    }
    return p.join(' ');
  };

  const getTemplateSealText = (templateId) => {
    switch (templateId) {
      case 'vocational_council': return { top: 'NATIONAL COUNCIL OF VOCATIONAL', bottom: 'AND RESEARCH TRAINING' };
      case 'dr_rg_academy': return { top: 'DR.R.G. ACADEMY', bottom: 'EDUCATIONAL TRUST' };
      case 'bglrgm': return { top: 'BGLRGM INSTITUTE OF', bottom: 'VOCATIONAL EDUCATION' };
      case 'rg_modern': return { top: 'RG MODERN COMMUNITY', bottom: 'COLLEGE' };
      case 'rgmtn': return { top: 'RGMTN INSTITUTE OF', bottom: 'HOSPITALITY MANAGEMENT' };
      case 'unicarewel': return { top: 'UNICAREWEL GLOBAL', bottom: 'EDUCATION SOLUTIONS' };
      default: return { top: 'RG MODERN COMMUNITY', bottom: 'COLLEGE' };
    }
  };

  const text = getTemplateSealText(template?.id);
  const logoSrc = getTemplateLogo(template?.id);
  const points = getStarPoints(45, 50, 46, 50);

  return (
    <div className="relative w-[100px] h-[100px] flex justify-center items-center">
      <svg className="absolute inset-0 w-full h-full drop-shadow-md" viewBox="0 0 100 100">
        {/* Spiky Red Outer Background */}
        <polygon points={points} fill="#dc2626" />

        {/* Text paths for circular text (Top and Bottom) */}
        <path id="textPathTop" fill="none" stroke="none" d="M 12,50 a 38,38 0 1,1 76,0" />
        <path id="textPathBottom" fill="none" stroke="none" d="M 8,50 a 42,42 0 0,0 84,0" />

        {/* Circular Text */}
        <text fontSize="4.5" fill="white" fontWeight="bold" letterSpacing="0.2">
          <textPath href="#textPathTop" startOffset="50%" textAnchor="middle">{text.top}</textPath>
        </text>
        <text fontSize="4.5" fill="white" fontWeight="bold" letterSpacing="0.2">
          <textPath href="#textPathBottom" startOffset="50%" textAnchor="middle">{text.bottom}</textPath>
        </text>
      </svg>

      {/* Center Logo */}
      <div className="absolute inset-0 flex justify-center items-center z-10 p-[14%]">
        <div className="w-full h-full rounded-full overflow-hidden flex justify-center items-center bg-[#f8fafc]">
          <img
            src={logoSrc}
            alt="Seal Logo"
            className={`w-full h-full ${(template?.id === 'dr_rg_academy' || template?.id === 'bglrgm') ? 'object-contain' : 'object-cover'} mix-blend-multiply grayscale contrast-125 opacity-90`}
          />
        </div>
      </div>
    </div>
  );
};

const MarksheetModal = ({ data, onClose, template, inline = false, title, onConfirm }) => {
  const printRef = useRef();

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;

    const loadingToast = toast.loading('Generating PDF...');

    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        scrollY: -window.scrollY
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      let width = pdfWidth;
      let height = pdfHeight;
      let xOffset = 0;

      // If the image is taller than the A4 page, scale it down to fit on one page
      if (pdfHeight > pageHeight) {
        height = pageHeight;
        width = (canvas.width * pageHeight) / canvas.height;
        xOffset = (pdfWidth - width) / 2; // Center horizontally
      }

      pdf.addImage(imgData, 'PNG', xOffset, 0, width, height);
      pdf.save(`${student?.studentId || 'Student'}_Semester_${semester}_Marksheet.pdf`);

      toast.success('PDF downloaded successfully!', { id: loadingToast });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF', { id: loadingToast });
    }
  };

  const handleBrowserPrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const styleTags = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(el => el.outerHTML)
      .join('\n');

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(`
      <html>
        <head>
          <title>Print Marksheet</title>
          ${styleTags}
          <style>
            * { box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 20px; background: #ffffff; color: #000; }
            table { width: 100%; border-collapse: collapse; background: #ffffff; font-size: 13px; }
            th, td { border: 1px solid #1e293b; padding: 8px; }
            th { font-weight: bold; }
            
            @media print {
              @page { size: A4 portrait; margin: 0; }
              html, body {
                width: 100%;
                height: 100%;
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden !important;
              }
              body { 
                background: #ffffff !important; 
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact;
                display: block;
              }
              .print-wrapper {
                width: 100%;
                height: 100%;
                display: flex;
                justify-content: center;
              }
              .print-marksheet {
                width: 210mm !important;
                height: 297mm !important;
                min-height: 297mm !important;
                max-height: 297mm !important;
                margin: 0 auto !important;
                padding: 12mm !important;
                box-sizing: border-box !important;
              }
              button { display: none; }
              th, td { border: 1px solid #000; }
            }
          </style>
        </head>
        <body>
          <div class="print-wrapper">
            ${printContent.outerHTML}
          </div>
        </body>
      </html>
    `);
    iframeDoc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  };

  const { student, semester, course, marks, batch } = data;

  const passMark = marks && marks.length > 0 && marks[0].passMark !== undefined ? marks[0].passMark : 40;
  let grandMax = 0;
  let grandTotal = 0;

  const content = (
    <div className={inline ? "bg-white rounded-2xl w-full max-w-4xl shadow-xl flex flex-col mx-auto border border-slate-200" : "bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[95vh]"}>
      {!inline && (
        <div className="flex justify-between items-center p-4 border-b border-slate-100 shrink-0 bg-slate-50 rounded-t-2xl">
          <h2 className="text-lg font-bold text-slate-800">Student Marksheet</h2>
          <div className="flex gap-2">
            {onConfirm && (
              <button onClick={onConfirm} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm">
                Confirm & Upload
              </button>
            )}
            <button onClick={handleDownloadPDF} className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors font-semibold text-sm">
              <Download size={16} /> Save PDF
            </button>
            {/* <button onClick={handleBrowserPrint} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-sm">
              <Printer size={16} /> Print
            </button> */}
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      <div className={`overflow-y-auto p-4 md:p-8 bg-white ${inline ? 'rounded-2xl' : 'rounded-b-2xl'}`}>
        {inline && (
          <div className="relative flex flex-col sm:block mb-6 min-h-[44px]">
            <div className="flex justify-center sm:hidden mb-4">
              <button onClick={handleDownloadPDF} className="flex items-center gap-2 bg-brand-600 text-white px-6 py-2.5 rounded-xl hover:bg-brand-700 transition-colors font-bold text-sm shadow-md shadow-brand-600/20">
                <Download size={18} /> Save as PDF
              </button>
            </div>
            
            <div className="flex justify-center items-center relative">
              {title && (
                <h3 className="text-xl font-bold text-slate-800 uppercase tracking-wider text-center">{title}</h3>
              )}
              <button onClick={handleDownloadPDF} className="hidden sm:flex absolute right-0 items-center gap-2 bg-brand-600 text-white px-6 py-2.5 rounded-xl hover:bg-brand-700 transition-colors font-bold text-sm shadow-md shadow-brand-600/20">
                <Download size={18} /> Save as PDF
              </button>
            </div>
          </div>
        )}
        <div ref={printRef} className="print-marksheet mx-auto text-black bg-white flex flex-col" style={{ width: '210mm', minHeight: '297mm', padding: '12mm', boxSizing: 'border-box' }}>

          {/* Outer gold frame */}
          <div className="flex-1 flex flex-col" style={{ background: 'linear-gradient(135deg, #b8860b 0%, #ffd700 30%, #daa520 50%, #ffd700 70%, #b8860b 100%)', padding: '4px' }}>
            {/* Thin white gap */}
            <div className="flex-1 flex flex-col" style={{ background: '#fff', padding: '2px' }}>
              {/* Thin gold inner liner */}
              <div className="flex-1 flex flex-col" style={{ border: '1px solid #b8860b', padding: '2px' }}>
                {/* Red content border */}
                <div className="flex-1 flex flex-col relative" style={{ border: '2px solid #b91c1c', padding: '2px 16px 4px 16px', background: '#fff' }}>

                  {/* Dynamic Header Block */}
                  {template?.id === 'vocational_council' ? (
                    <div className="flex justify-center w-full mt-2 mb-2 px-2">
                      <img src={councilHeader} alt="Council Header" className="w-full h-auto object-contain" />
                    </div>
                  ) : (
                    <div className="flex pb-0 min-h-[65px] items-center justify-between w-full mt-1 ">
                      {/* Left Logo */}
                      <div className={`shrink-0 flex justify-start items-center ${template?.id === 'dr_rg_academy' ? 'w-[100px] -ml-2' : 'w-[90px]'}`}>
                        <img src={getTemplateLogo(template?.id)} alt="Institution Logo" className={`${template?.id === 'dr_rg_academy' ? 'w-[100px] h-[100px]' : 'w-20 h-20'} object-contain`} />
                      </div>

                      {/* Center Text */}
                      <div className="flex-1 text-center flex flex-col justify-center px-2">
                        {template?.id === 'dr_rg_academy' ? (
                          <>
                            <h1 className="text-black text-[36px] font-extrabold m-0 tracking-wide leading-tight whitespace-nowrap" style={{ fontFamily: 'Times New Roman, serif' }}>Dr.R.G Academy</h1>
                            <p className="text-black text-[10.5px] m-0 mt-1 font-bold whitespace-nowrap">Autonomous National Vocational Skill Development Institution Registered Under MCA</p>
                            <p className="text-[18px] font-black m-0 mt-1 tracking-widest uppercase text-black">GOVERNMENT OF INDIA</p>
                          </>
                        ) : (
                          <>
                            {['bglrgm', 'rgmtn', 'unicarewel'].includes(template?.id) ? (
                              <>
                                <h1 className={`text-black font-extrabold m-0 tracking-wide leading-tight whitespace-nowrap ${template.id === 'rgmtn' ? 'text-[23px]' : 'text-[20px]'}`} style={{ fontFamily: 'Times New Roman, serif' }}>
                                  {template.id === 'bglrgm' ? 'BGLRGM Institute Of Vocational Education Training' :
                                    template.id === 'rgmtn' ? 'RGMTN Institute Of Hospitality Management' :
                                      'UNICAREWEL Global Education & Career Solutions'}
                                </h1>
                                <p className="text-black text-[10px] m-0 mt-1 font-bold whitespace-nowrap">Autonomous National Vocational Skill Development Institution Registered Under MCA</p>
                                <p className="text-[18px] font-black m-0 mt-1 tracking-widest uppercase text-black">GOVERNMENT OF INDIA</p>
                              </>
                            ) : (
                              <h1 className="text-black text-[24px] font-extrabold m-0 tracking-wide leading-tight whitespace-nowrap" style={{ fontFamily: 'Times New Roman, serif' }}>{getFullTemplateName(template)}</h1>
                            )}

                            {/* Show full address block for RG Modern */}
                            {(!template || template.id === 'rg_modern') && (
                              <>
                                <p className="text-black text-[11px] font-semibold m-0 mt-1 uppercase whitespace-nowrap">Managed By - R.G MODERN EDUCATIONAL AND CHARITABLE TRUST - (RGMECT)</p>
                                <p className="text-black text-[10px] m-0 mt-1 font-medium whitespace-nowrap">No: 21, 3rd Floor, 9th Main, 6th Cross, RK Layout – 2nd Stage, Padmanabha Nagar, Bengaluru – 560070</p>
                              </>
                            )}
                          </>
                        )}
                      </div>

                      {/* Right Spacer to enforce true page centering */}
                      <div className={`shrink-0 ${template?.id === 'dr_rg_academy' ? 'w-[140px] -mr-2' : 'w-[120px]'}`}></div>
                    </div>
                  )}

                  <div className={`text-center text-[18px] font-extrabold tracking-widest text-black uppercase ${template?.id === 'vocational_council' ? 'mb-1 -mt-2' : template?.id === 'dr_rg_academy' ? 'mb-1 mt-1' : 'mb-1 -mt-1'}`} style={{ fontFamily: 'Times New Roman, serif' }}>
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
                  <table className="w-full border-collapse border border-black text-[13px] text-black" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
                    <tbody>
                      {/* Row 1: Student Headers */}
                      <tr>
                        <th className="border border-black p-2 text-center text-[11px] uppercase font-bold w-[20%]" colSpan="2" style={{ fontFamily: 'Times New Roman, serif' }}>REGISTER NUMBER</th>
                        <th className="border border-black p-2 text-center text-[11px] uppercase font-bold w-[40%]" colSpan="1" style={{ fontFamily: 'Times New Roman, serif' }}>NAME OF THE CANDIDATE</th>
                        <th className="border border-black p-2 text-center text-[11px] uppercase font-bold w-[40%]" colSpan="3" style={{ fontFamily: 'Times New Roman, serif' }}>NAME OF THE COURSE</th>
                      </tr>

                      {/* Row 2: Student Values */}
                      <tr>
                        <td className="border border-black p-2 text-center text-[12.5px] font-normal" colSpan="2">{student.studentId}</td>
                        <td className="border border-black p-2 text-center text-[12.5px] font-normal capitalize" colSpan="1">{student.studentNameEnglish}</td>
                        <td className="border border-black p-2 text-center text-[12.5px] font-normal" colSpan="3">{course?.title}</td>
                      </tr>

                      {/* Row 3: Marks Headers */}
                      <tr>
                        <th className="border border-black p-2 text-center text-[11px] font-bold w-[8%]" rowSpan="2" style={{ fontFamily: 'Times New Roman, serif' }}>PAPER</th>
                        <th className="border border-black p-2 text-center text-[11px] font-bold w-[12%]" rowSpan="2" style={{ fontFamily: 'Times New Roman, serif' }}>COURSE CODE</th>
                        <th className="border border-black p-2 text-center text-[11px] font-bold w-[40%]" rowSpan="2" style={{ fontFamily: 'Times New Roman, serif' }}>TITLE OF THE SUBJECT</th>
                        <th className="border border-black p-2 text-center text-[11px] font-bold w-[26%]" colSpan="2" style={{ fontFamily: 'Times New Roman, serif' }}>MARKS</th>
                        <th className="border border-black p-2 text-center text-[11px] font-bold w-[14%]" rowSpan="2" style={{ fontFamily: 'Times New Roman, serif' }}>RESULT</th>
                      </tr>
                      <tr>
                        <th className="border border-black p-2 text-center text-[9px] font-bold w-[13%]" style={{ fontFamily: 'Times New Roman, serif' }}>ALLOTTED</th>
                        <th className="border border-black p-2 text-center text-[9px] font-bold w-[13%]" style={{ fontFamily: 'Times New Roman, serif' }}>OBTAINED</th>
                      </tr>

                      {/* Dynamic Marks Rows */}
                      {(() => {
                        let tempMax = 0;
                        let tempTotal = 0;
                        const sortedMarks = [...(marks || [])].sort((a, b) => {
                          const typeA = String(a.subject?.type || "").toLowerCase();
                          const nameA = String(a.subject?.name || "").toLowerCase();
                          const isPracA = (typeA === "practical" || nameA.includes("practical")) ? 1 : 0;

                          const typeB = String(b.subject?.type || "").toLowerCase();
                          const nameB = String(b.subject?.name || "").toLowerCase();
                          const isPracB = (typeB === "practical" || nameB.includes("practical")) ? 1 : 0;

                          return isPracA - isPracB;
                        });
                        return sortedMarks.map((m, idx) => {
                          const examConfig = m.examConfig || (m.exam && m.exam.subjects ? m.exam.subjects.find(s => (s.subject?._id || s.subject) === (m.subject?._id || m.subject)) : null);
                          const maxExt = examConfig ? (examConfig.externalMark || examConfig.theoryMark || 0) : 80;
                          const maxInt = examConfig ? (examConfig.internalMark || 0) : 20;
                          const maxMark = examConfig ? (examConfig.totalMark || (maxExt + maxInt)) : 100;
                          const passMark = examConfig && examConfig.passMark !== undefined ? examConfig.passMark : (m.passMark !== undefined ? m.passMark : 40);

                          const thVal = m.theoryMark === 'AB' ? 'AB' : Number(m.theoryMark || 0);
                          const intVal = m.internalMark === 'AB' ? 'AB' : Number(m.internalMark || 0);
                          const pracVal = m.practicalMark === 'AB' ? 'AB' : Number(m.practicalMark || 0);

                          let obtained;
                          let isPass;
                          if (thVal === 'AB' || intVal === 'AB' || pracVal === 'AB') {
                            obtained = 'AB';
                            isPass = false;
                          } else {
                            obtained = thVal + intVal + pracVal;
                            isPass = obtained >= passMark;
                          }

                          tempMax += maxMark;
                          tempTotal += (obtained === 'AB' ? 0 : obtained);

                          // Update globals for the Centre summary later
                          grandMax = tempMax;
                          grandTotal = tempTotal;

                          return (
                            <tr key={m._id}>
                              <td className="border border-black py-2 px-2 text-center text-[12.5px] font-normal">{toRoman(idx + 1)}</td>
                              <td className="border border-black py-2 px-2 text-center text-[12.5px] font-normal uppercase">{m.subject?.code || '-'}</td>
                              <td className="border border-black py-2 px-2 text-left pl-4 text-[12.5px] font-normal">{m.subject?.name}</td>
                              <td className="border border-black py-2 px-2 text-center text-[12.5px] font-normal">{maxMark}</td>
                              <td className="border border-black py-2 px-2 text-center text-[12.5px] font-normal">{obtained}</td>
                              <td className="border border-black py-2 px-2 text-center text-[12.5px] font-normal uppercase">{isPass ? 'PASS' : 'FAIL'}</td>
                            </tr>
                          );
                        });
                      })()}

                      {/* Row: DOB and Total */}
                      <tr>
                        <th className="border border-black p-2 text-center text-[11px] font-bold uppercase whitespace-nowrap" style={{ fontFamily: 'Times New Roman, serif' }}>DATE OF<br />BIRTH</th>
                        <td className="border border-black p-2 text-center text-[12.5px] font-normal">
                          {student.dob ? new Date(student.dob).toLocaleDateString('en-GB') : '-'}
                        </td>
                        <th className="border border-black p-2 text-right pr-4 text-[11px] font-bold" colSpan="2" style={{ fontFamily: 'Times New Roman, serif' }}>TOTAL MARKS SECURED</th>
                        <td className="border border-black p-2 text-center text-[12.5px] font-normal">{grandTotal}</td>
                        <td className="border border-black p-2 text-center"></td>
                      </tr>

                      {/* Row: Centre Headers */}
                      <tr>
                        <th className="border border-black p-2 text-center text-[11px] font-bold uppercase" colSpan="1" style={{ fontFamily: 'Times New Roman, serif' }}>CENTRE<br />CODE</th>
                        <th className="border border-black p-2 text-center text-[11px] font-bold uppercase" colSpan="3" style={{ fontFamily: 'Times New Roman, serif' }}>NAME OF THE CENTRE</th>
                        <th className="border border-black p-2 text-center text-[11px] font-bold uppercase" style={{ fontFamily: 'Times New Roman, serif' }}>PERCENTAGE</th>
                        <th className="border border-black p-2 text-center text-[11px] font-bold uppercase" style={{ fontFamily: 'Times New Roman, serif' }}>GRADE</th>
                      </tr>

                      {/* Row: Centre Values */}
                      <tr>
                        <td className="border border-black p-2 text-center text-[12.5px] font-normal uppercase" colSpan="1">{student.center?.centerId || 'N/A'}</td>
                        <td className="border border-black p-2 text-center text-[12.5px] font-normal whitespace-pre-wrap" colSpan="3">
                          {(() => {
                            const shortName = student.center?.name;
                            if (!shortName) return 'N/A';
                            return shortName;
                          })()}
                        </td>
                        <td className="border border-black p-2 text-center text-[12.5px] font-normal">{grandMax > 0 ? ((grandTotal / grandMax) * 100).toFixed(1) : '0.0'} %</td>
                        <td className="border border-black p-2 text-center font-bold text-lg">{grandMax > 0 ? getGrade((grandTotal / grandMax) * 100) : '-'}</td>
                      </tr>

                      {/* Row: Grade Classification & Abbreviations */}
                      <tr>
                        <td className="border border-black p-2" colSpan="6" style={{ fontFamily: 'Times New Roman, serif' }}>
                          <div className="flex flex-col gap-2">
                            <div>
                              <div className="font-bold text-[12px] mb-1 uppercase">GRADE CLASSIFICATION :</div>
                              <div className="grid grid-cols-2 gap-x-12 gap-y-0.5 text-[11.5px] max-w-[600px]">
                                <div className="flex"><span className="font-bold w-32">O : Outstanding</span><span>(90% & above)</span></div>
                                <div className="flex"><span className="font-bold w-32">C : Fair</span><span>(45% to 59.9%)</span></div>

                                <div className="flex"><span className="font-bold w-32">A : Excellent</span><span>(75% to 89.9%)</span></div>
                                <div className="flex"><span className="font-bold w-32">D : Average</span><span>(40% to 44.9%)</span></div>

                                <div className="flex"><span className="font-bold w-32">B : Good</span><span>(60% to 74.9%)</span></div>
                                <div className="flex"><span className="font-bold w-32">F : Fail</span><span>(Below {passMark}%)</span></div>

                                <div className="flex"><span className="font-bold w-32">AB : Absent</span><span></span></div>
                                <div className="flex"><span className="font-bold w-32">RA : Reappear</span><span></span></div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>

                      {/* Row: Footer Note */}
                      <tr>
                        <td className="border border-black p-2 text-[11px] font-medium" colSpan="7" style={{ fontFamily: 'Times New Roman, serif' }}>
                          <span className="font-bold">Note :</span> Any Correction found in this entry, should be brought to the Notice of the Controller of Examinations for Investigation.
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Footer Signatures */}
                  <div className="mt-8 relative flex items-center justify-between pt-4 mb-4 px-8 min-h-[90px]">
                    {/* Left */}
                    <div className={`flex-1 flex justify-start ${template?.id === 'vocational_council' ? 'pl-4' : 'pl-12'}`}>
                      <p className="text-[12px] font-bold text-black m-0 uppercase" style={{ fontFamily: 'Times New Roman, serif' }}>
                        {template?.id === 'vocational_council' ? 'NEW DELHI - 110 058' : 'INDIA'}
                      </p>
                    </div>

                    {/* Center */}
                    <div className="absolute left-[44%] top-1/2 -translate-x-1/2 -translate-y-1/2 flex justify-center items-center">
                      <DynamicSeal template={template} />
                    </div>

                    {/* Right */}
                    <div className="flex-1 flex justify-end pr-4">
                      <div className="flex flex-col items-center">
                        <p className="text-[11.5px] font-bold text-black m-0 uppercase tracking-wide whitespace-nowrap" style={{ fontFamily: 'Times New Roman, serif' }}>CONTROLLER OF EXAMINATION</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (inline) return content;

  return createPortal(
    <div className="fixed inset-0 z-[10000] overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      {content}
    </div>,
    document.body
  );
};

export default MarksheetModal;