import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Search, Calendar, FileText, ArrowRight, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import MarksheetModal from '../../components/modals/MarksheetModal';
import logoHeader from "../../assets/RG-Academy.png";

const templates = [
  { id: 'rg_modern', name: 'RG MODERN COMMUNITY COLLEGE' },
  { id: 'bglrgm', name: 'BGLRGM Institute Of Vocational Education Training (OPC) Private Limited' },
  { id: 'rgmtn', name: 'RGMTN Institute Of Hospitality Management (OPC) Private Limited' },
  { id: 'dr_rg_academy', name: 'DR RG ACADEMY' },
  { id: 'unicarewel', name: 'UNICAREWEL Global Education & Career Solutions (OPC) Private Limited' },
  { id: 'vocational_council', name: 'VOCATIONAL COUNCIL' }
];

const PublicResults = () => {
  const [step, setStep] = useState(1);
  const [studentId, setStudentId] = useState('');
  const [dob, setDob] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleFetchResults = async (e) => {
    e.preventDefault();
    if (!studentId) return toast.error('Please enter your Student ID');
    if (!dob) return toast.error('Please enter your Date of Birth');

    // If results are already fetched, move to step 2
    if (results) {
      if (!selectedSemester) return toast.error('Please select a semester');
      setStep(2);
      return;
    }

    let formattedDob = dob;
    if (dob.includes('-') && dob.split('-')[0].length === 4) {
      const [year, month, day] = dob.split('-');
      formattedDob = `${day}-${month}-${year}`;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/public-results/results`, { studentId, dob: formattedDob });
      setResults(data);
      
      // Auto-select the most recent semester
      if (data.marks && data.marks.length > 0) {
        const semesters = [...new Set(data.marks.map(m => m.semester))].sort((a, b) => b - a);
        setSelectedSemester(semesters[0].toString());
        toast.success('Details verified. Please select a semester.');
      } else {
        toast.error('No results found for this student');
      }
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid Student ID or Date of Birth');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentIdChange = (e) => {
    setStudentId(e.target.value);
    if (results) setResults(null);
  };

  const handleDobChange = (e) => {
    setDob(e.target.value);
    if (results) setResults(null);
  };

  const groupedMarks = {};
  if (results && results.marks) {
    results.marks.forEach(m => {
      if (!groupedMarks[m.semester]) groupedMarks[m.semester] = [];
      groupedMarks[m.semester].push(m);
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">


      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">

        {step === 1 && (
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex flex-col items-center justify-center mb-6">
                <img src={logoHeader} alt="Academy Logo" className="h-20 object-contain mb-3" />
                <h1 className="text-3xl font-bold text-slate-900">Dr.RG Academy</h1>
              </div>
              <h2 className="text-xl font-medium text-slate-700 mb-2">Check Your Results</h2>
              <p className="text-slate-600">Enter your Student ID and Date of Birth to proceed.</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 sm:p-8">
              <form onSubmit={handleFetchResults} className="space-y-5">

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
                      onChange={handleStudentIdChange}
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
                      onChange={handleDobChange}
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase text-slate-900"
                      required
                    />
                  </div>
                </div>

                {results && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <label htmlFor="semester" className="block text-sm font-medium text-slate-700 mb-1">Select Semester</label>
                    <select
                      id="semester"
                      value={selectedSemester}
                      onChange={(e) => setSelectedSemester(e.target.value)}
                      className="block w-full px-3 py-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 bg-white"
                      required
                    >
                      <option value="" disabled>Select a semester</option>
                      {(() => {
                        const totalSems = results.student?.totalSemesters || 0;
                        const availableSems = Object.keys(groupedMarks).map(Number);
                        const maxAvailable = availableSems.length > 0 ? Math.max(...availableSems) : 0;
                        // Determine the maximum number of semesters to show
                        const maxToShow = Math.max(totalSems, maxAvailable, 1);
                        
                        return Array.from({ length: maxToShow }, (_, i) => i + 1).map(sem => {
                          const hasResult = availableSems.includes(sem);
                          return (
                            <option key={sem} value={sem} disabled={!hasResult}>
                              Semester {sem} {!hasResult ? '(Result Not Available)' : ''}
                            </option>
                          );
                        });
                      })()}
                    </select>
                  </div>
                )}

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
                        {results ? 'View Result' : 'Fetch Semesters'} <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {step === 2 && results && (
          <div>
            <div className="mb-8 flex justify-center items-center">
              <div className="flex items-center gap-4 bg-white px-8 py-4 rounded-2xl shadow-sm border border-slate-200">
                <img src={logoHeader} alt="Academy Logo" className="h-14 object-contain drop-shadow-sm" />
                <h2 className="text-3xl font-black text-slate-900 tracking-wide">Dr.RG Academy</h2>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg shadow-sm mb-8">
              <div className="p-6 sm:p-8 border-b border-slate-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                  <h2 className="text-2xl font-bold text-slate-900">{results.student.name}</h2>
                  <button 
                    onClick={() => { setStep(1); setResults(null); setSelectedSemester(''); setStudentId(''); setDob(''); }}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors bg-slate-100 hover:bg-blue-50 px-4 py-2 rounded-lg"
                  >
                    <ArrowLeft size={16} /> Check Another Student
                  </button>
                </div>

                <div className="flex flex-wrap gap-x-8 gap-y-4 text-sm text-slate-700">
                  <div>
                    <span className="block text-slate-500 uppercase tracking-wider text-xs mb-1">Student ID</span>
                    <span className="font-semibold">{results.student.studentId}</span>
                  </div>
                  {results.student.courseName && (
                    <div>
                      <span className="block text-slate-500 uppercase tracking-wider text-xs mb-1">Course</span>
                      <span className="font-semibold">{results.student.courseName}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 sm:p-8 bg-slate-50 rounded-b-lg">
                {results.marks && results.marks.length > 0 ? (
                  <div className="space-y-8">
                    {/* Semester selection moved to Step 1 */}

                    {selectedSemester && groupedMarks[selectedSemester] && (
                      (() => {
                        const semMarks = groupedMarks[selectedSemester];
                        const templateId = semMarks[0]?.template || 'rg_modern';
                        const templateObj = templates.find(t => t.id === templateId);

                        const semData = {
                          student: results.studentFull,
                          semester: selectedSemester,
                          course: semMarks[0]?.course,
                          batch: semMarks[0]?.batch,
                          marks: semMarks,
                          templateId: templateId
                        };

                        return (
                          <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
                            <div className="overflow-hidden">
                              <MarksheetModal
                                inline={true}
                                title={`Semester ${selectedSemester} Result`}
                                data={semData}
                                template={templateObj}
                                onClose={() => { }}
                              />
                            </div>
                          </div>
                        );
                      })()
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="text-slate-400 mx-auto mb-4" size={48} />
                    <h3 className="text-xl font-medium text-slate-900 mb-2">No Results Found</h3>
                    <p className="text-slate-600">We couldn't find any results for your profile at this time.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PublicResults;

