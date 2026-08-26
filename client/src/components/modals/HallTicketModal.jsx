import React, { useRef, useState } from 'react';
import { X, Printer, ChevronLeft, ChevronRight } from 'lucide-react';
import logo from '../../assets/logo-2.jpeg';

const HallTicketModal = ({ students, exam, onClose }) => {
  const printRef = useRef();
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrint = () => {
    const printContent = printRef.current;
    const styleTags = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(el => el.outerHTML)
      .join('\\n');

    const windowPrint = window.open('', '', 'width=900,height=800');
    windowPrint.document.write(`
      <html>
        <head>
          <title>Print Hall Tickets</title>
          ${styleTags}
          <style>
            @page { size: A4; margin: 10mm; }
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #fff; color: #000; }
            .hall-ticket-container { page-break-after: always; padding: 20px; border: 2px solid #000; box-sizing: border-box; min-height: 270mm; position: relative; }
            .hall-ticket-container:last-child { page-break-after: auto; }
            
            @media print {
              body { background: #fff !important; -webkit-print-color-adjust: exact; }
              button { display: none; }
              .hall-ticket-container { border: 2px solid #000 !important; }
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
    
    // Give external stylesheets a moment to load if there are any
    setTimeout(() => {
      windowPrint.print();
      windowPrint.close();
    }, 750);
  };

  const instructions = [
    "Candidates will not be permitted to take the exam, if they arrive 10 minutes after the commencement of the exam. Candidates will not be allowed to leave the examination hall till the examination is over.",
    "Candidates will not be permitted to appear for the exam without the valid hall ticket, identity card. Candidates are advised to check that all information on the hall ticket are correct.",
    "If your photo is not available in the Hall Ticket or if your photo is not clear, please paste the recent stamp size photograph in this Hall Ticket.",
    "Candidates should bring the valid original photo ID proof (Voter ID / Aadhar Card / Pan Card / Driving License / Passport / Photo ID issued by any Govt. Organization) to the examination Centre.",
    "In case of candidates who have changed their names, they will be allowed only if they produce original Gazette Notification / Registered Marriage Certificate.",
    "The name of the candidate in the original ID proof brought for verification should exactly match with the name given in the hall ticket.",
    "The hall ticket is not transferable Impersonation is a legally punishable offence.",
    "Calculator, Log Table, Mobile Phone, Bluetooth or any other Electronic Communication Devices are strictly prohibited inside the examination hall. The institution is not responsible for any of your belongings.",
    "In case of any discrepancy, Institution's decision will be final."
  ];

  const renderTicket = (student, index, isPrint = false) => {
    if (!student) return null;
    const courseTitle = student.enrolledCourses?.[0]?.course?.title || exam?.course?.title || "N/A";
    
    return (
      <div key={student._id || index} className="hall-ticket-container bg-white text-black" style={{ border: '2px solid #000', padding: '20px', minHeight: '270mm' }}>
        
        {/* Header */}
        <div className="flex items-center border-b-2 border-black pb-2 mb-0">
          <div className="w-32 text-center p-2">
            <img src={logo} alt="Logo" className="w-24 h-auto mx-auto" />
          </div>
          <div className="flex-1 text-center">
            <h1 className="text-[#1e3a8a] text-3xl font-bold m-0" style={{ fontFamily: 'Times New Roman, serif' }}>
              RG MODERN COMMUNITY COLLEGE
            </h1>
            <div className="text-[11px] font-bold mt-1 text-[#1e3a8a]">Managed By - R.G MODERN EDUCATIONAL AND CHARITABLE TRUST - (RGMECT)</div>
            <div className="text-[10px] mt-1 text-[#1e3a8a] max-w-lg mx-auto">No: 21, 3rd Floor, 9th Main, 6th Cross, RK Layout – 2nd Stage, Padmanabha Nagar, Bengaluru – 560070, Karnataka. Email : rgmect@gmail.com</div>
            <div className="text-lg font-bold mt-2 uppercase text-[#1e3a8a]">
              EXAM HALL TICKET – {exam?.name || "N/A"}
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="flex border-b-2 border-black">
          <div className="flex-1 p-4 border-r-2 border-black text-[15px] leading-relaxed font-semibold">
            <div className="grid grid-cols-[130px_10px_1fr] gap-1">
              <div className="text-[#1e3a8a]">Enrolment No</div>
              <div className="text-[#1e3a8a]">:</div>
              <div className="text-black">{student.studentId}</div>

              <div className="text-[#1e3a8a]">Candidate Name</div>
              <div className="text-[#1e3a8a]">:</div>
              <div className="uppercase font-bold text-lg text-black">{student.studentNameEnglish}</div>

              <div className="text-[#1e3a8a]">Programme</div>
              <div className="text-[#1e3a8a]">:</div>
              <div className="uppercase text-black">{courseTitle}</div>

              <div className="text-[#1e3a8a]">Exam Centre</div>
              <div className="text-[#1e3a8a]">:</div>
              <div className="uppercase font-bold text-black">{exam?.centers?.[0]?.name || "N/A"}</div>
            </div>
          </div>
          <div className="w-[220px] p-4 flex flex-col items-center justify-center text-center text-[15px] text-[#1e3a8a] font-semibold">
            <div className="h-24 w-20 border-2 border-dashed border-slate-300 mb-4 flex items-center justify-center text-xs text-slate-400">Photo</div>
            <div>Signature of<br/>Candidate<br/>(In front of<br/>Invigilator)</div>
          </div>
        </div>

        {/* Timetable Table */}
        <table className="w-full border-collapse" style={{ border: 'none', marginTop: '0px' }}>
          <thead>
            <tr>
              <th className="border-2 border-black border-t-0 p-3 text-center w-16 text-[#1e3a8a]">S.NO</th>
              <th className="border-2 border-black border-t-0 p-3 text-center w-32 text-[#1e3a8a]">DATE OF<br/>EXAM</th>
              <th className="border-2 border-black border-t-0 p-3 text-center w-40 text-[#1e3a8a]">SUBJECT<br/>CODE</th>
              <th className="border-2 border-black border-t-0 p-3 text-center text-[#1e3a8a]">TITLE OF THE PAPER</th>
            </tr>
          </thead>
          <tbody>
            {exam?.subjects?.map((subConfig, subIdx) => {
              const dateStr = subConfig.date ? new Date(subConfig.date).toLocaleDateString('en-GB').replace(/\//g, '-') : "N/A";
              return (
                <tr key={subIdx}>
                  <td className="border-2 border-black p-3 text-center text-black font-bold">{subIdx + 1}</td>
                  <td className="border-2 border-black p-3 text-center text-black font-bold">{dateStr}</td>
                  <td className="border-2 border-black p-3 text-center text-black uppercase font-bold">{subConfig.subject?.code || "N/A"}</td>
                  <td className="border-2 border-black p-3 text-left text-black uppercase font-bold pl-4">{subConfig.subject?.name || "N/A"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Footer Box */}
        <div className="border-2 border-black border-t-0 border-l-0 border-r-0 p-4 flex justify-between items-end font-bold text-[15px] text-[#1e3a8a]">
          <div className="leading-relaxed">
            
          </div>
          <div className="pr-12 pt-16 text-black font-semibold">
            Examiner Signature
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 px-4">
          <div className="font-bold text-[15px] mb-3 text-[#1e3a8a]">Instructions to the Candidates:</div>
          <ul className="list-disc pl-5 text-[12px] text-justify leading-relaxed text-[#1e3a8a] space-y-1">
            {instructions.map((inst, i) => (
              <li key={i}>{inst}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleNext = () => {
    if (currentIndex < students.length - 1) setCurrentIndex(currentIndex + 1);
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-100 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[95vh]">
        {/* Modal Header */}
        <div className="bg-white px-6 py-4 rounded-t-2xl border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Hall Tickets</h2>
            <p className="text-sm text-slate-500 font-medium">Viewing Student {currentIndex + 1} of {students?.length || 0}</p>
          </div>
          
          {/* Pagination Controls */}
          {students?.length > 1 && (
            <div className="flex items-center gap-4 bg-slate-100 p-1.5 rounded-xl">
              <button 
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="p-2 rounded-lg bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="font-bold text-slate-700 text-sm w-12 text-center">
                {currentIndex + 1} / {students.length}
              </span>
              <button 
                onClick={handleNext}
                disabled={currentIndex === students.length - 1}
                className="p-2 rounded-lg bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button 
              onClick={handlePrint}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20 font-bold"
            >
              <Printer size={18} /> Print All ({students?.length || 0})
            </button>
            <button onClick={onClose} className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Modal Body with Display Content */}
        <div className="overflow-y-auto p-8 flex flex-col gap-8 items-center bg-slate-200">
          <div className="w-full flex flex-col gap-8 max-w-[210mm]">
            {students?.length > 0 && renderTicket(students[currentIndex], currentIndex)}
          </div>
        </div>

        {/* Hidden Print Content */}
        <div style={{ display: 'none' }}>
          <div ref={printRef}>
            {students?.map((student, index) => renderTicket(student, index, true))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HallTicketModal;
