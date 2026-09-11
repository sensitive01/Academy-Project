import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Search, Calendar, FileText, ArrowRight, ArrowLeft, Printer } from 'lucide-react';
import logoHeader from "../../assets/RG-Academy.png";
import logo from '../../assets/logo-2.jpeg';

const PublicHallTicket = () => {
  const [step, setStep] = useState(1);
  const [studentId, setStudentId] = useState('');
  const [dob, setDob] = useState('');
  const [hallTicketData, setHallTicketData] = useState(null);
  const [loading, setLoading] = useState(false);
  const printRef = useRef();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleFetchHallTicket = async (e) => {
    e.preventDefault();
    if (!studentId) return toast.error('Please enter your Student ID');
    if (!dob) return toast.error('Please enter your Date of Birth');

    let formattedDob = dob;
    if (dob.includes('-') && dob.split('-')[0].length === 4) {
      const [year, month, day] = dob.split('-');
      formattedDob = `${year}-${month}-${day}`;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/public-hallticket/verify`, { studentId, dob: formattedDob });
      setHallTicketData(data);
      setStep(2);
      toast.success('Details verified successfully.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid Student ID or Date of Birth');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const styleTags = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(el => el.outerHTML)
      .join('\n');

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Print Hall Ticket</title>
          ${styleTags}
          <style>
            @page { size: A4; margin: 10mm; }
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #fff; color: #000; }
            .hall-ticket-container { padding: 20px; border: 2px solid #000; box-sizing: border-box; position: relative; }
            
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
    doc.close();

    iframe.contentWindow.focus();
    setTimeout(() => {
      iframe.contentWindow.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);
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

  const renderTicket = () => {
    if (!hallTicketData) return null;
    const { student, hallTicket } = hallTicketData;
    const { exam } = hallTicket;
    
    // Fallback if populate didn't work as expected
    const courseTitle = student.enrolledCourses?.[0]?.course?.title || exam?.course?.title || "N/A";

    return (
      <div>
        <div className="hall-ticket-container bg-white text-black" style={{ border: '2px solid #000', padding: '20px' }}>
          {/* Header */}
        <div className="flex items-center border-b-2 border-black pb-2 mb-0">
          <div className="w-32 text-center p-2">
            <img src={logo} alt="Logo" className="w-24 h-auto mx-auto" />
          </div>
          <div className="flex-1 text-center overflow-hidden">
            <h1 className="text-[#1e3a8a] text-2xl sm:text-3xl font-bold m-0 whitespace-nowrap" style={{ fontFamily: 'Times New Roman, serif' }}>
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
            <div>Signature of<br />Candidate<br />(In front of<br />Invigilator)</div>
          </div>
        </div>

        {/* Timetable Table */}
        <table className="w-full border-collapse" style={{ border: 'none', marginTop: '0px' }}>
          <thead>
            <tr>
              <th className="border-2 border-black border-t-0 p-3 text-center w-16 text-[#1e3a8a]">S.NO</th>
              <th className="border-2 border-black border-t-0 p-3 text-center w-32 text-[#1e3a8a]">DATE OF<br />EXAM</th>
              <th className="border-2 border-black border-t-0 p-3 text-center w-40 text-[#1e3a8a]">SUBJECT<br />CODE</th>
              <th className="border-2 border-black border-t-0 p-3 text-center text-[#1e3a8a]">TITLE OF THE PAPER</th>
              <th className="border-2 border-black border-t-0 p-3 text-center w-40 text-[#1e3a8a]">INVIGILATOR<br />SIGNATURE</th>
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
                  <td className="border-2 border-black p-3"></td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Footer Box */}
        <div className="border-2 border-black border-t-0 border-l-0 border-r-0 p-4 flex justify-between items-end font-bold text-[15px] text-[#1e3a8a]">
          <div className="leading-relaxed"></div>
          <div className="pr-12 pt-16 text-black font-semibold">
            Examiner Signature
          </div>
        </div>
      </div>

        {/* Instructions */}
        <div className="mt-6 px-4" style={{ pageBreakBefore: 'always' }}>
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

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {step === 1 && (
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex flex-col items-center justify-center mb-6">
                <img src={logoHeader} alt="Academy Logo" className="h-20 object-contain mb-3" />
                <h1 className="text-3xl font-bold text-slate-900">Dr.RG Academy</h1>
              </div>
              <h2 className="text-xl font-medium text-slate-700 mb-2">Download Hall Ticket</h2>
              <p className="text-slate-600">Enter your Student ID and Date of Birth to proceed.</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 sm:p-8">
              <form onSubmit={handleFetchHallTicket} className="space-y-5">
                <div>
                  <label htmlFor="studentId" className="block text-sm font-medium text-slate-700 mb-1">Student ID</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Search size={18} />
                    </div>
                    <input
                      type="text"
                      id="studentId"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase text-slate-900"
                      placeholder="e.g. STU-XXXX-YYYY"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="dob" className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Calendar size={18} />
                    </div>
                    <input
                      type="date"
                      id="dob"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase text-slate-900"
                      required
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span>Loading...</span>
                    ) : (
                      <>
                        Download Hall Ticket <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {step === 2 && hallTicketData && (
          <div>
            <div className="mb-8 flex justify-between items-center bg-white px-8 py-4 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-4">
                <img src={logoHeader} alt="Academy Logo" className="h-14 object-contain drop-shadow-sm" />
                <h2 className="text-3xl font-black text-slate-900 tracking-wide">Dr.RG Academy</h2>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={handlePrint}
                  className="bg-indigo-600 text-white px-5 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-md font-medium"
                >
                  <Printer size={18} /> Print Hall Ticket
                </button>
                <button 
                  onClick={() => { setStep(1); setHallTicketData(null); setStudentId(''); setDob(''); }}
                  className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors bg-slate-100 hover:bg-blue-50 px-4 py-2 rounded-lg"
                >
                  <ArrowLeft size={16} /> Back
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg shadow-sm mb-8 overflow-x-auto">
              <div className="p-8 flex justify-center bg-slate-200 min-h-screen">
                <div ref={printRef} className="bg-white shadow-xl max-w-[210mm] w-full">
                  {renderTicket()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicHallTicket;
