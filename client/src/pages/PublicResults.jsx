import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Search, ShieldCheck, FileText, ArrowRight, Mail, CheckCircle, GraduationCap } from 'lucide-react';

const PublicResults = () => {
  const [step, setStep] = useState(1);
  const [studentId, setStudentId] = useState('');
  const [studentDetails, setStudentDetails] = useState(null);
  const [otp, setOtp] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  // Step 1: Fetch Student Details
  const handleFetchDetails = async (e) => {
    e.preventDefault();
    if (!studentId) return toast.error('Please enter your Student ID');
    
    setLoading(true);
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/public-results/student/${studentId}`);
      setStudentDetails(data);
      setStep(2);
      toast.success('Student details fetched');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch details');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Request OTP
  const handleRequestOtp = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/public-results/send-otp`, { studentId });
      setStep(3);
      toast.success(data.message || 'OTP sent to your email');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Verify OTP and Fetch Results
  const handleVerifyAndFetch = async (e) => {
    e.preventDefault();
    if (!otp) return toast.error('Please enter the OTP');
    
    setLoading(true);
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/public-results/results`, { studentId, otp });
      setResults(data);
      setStep(4);
      toast.success('Results fetched successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP or failed to fetch results');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-brand-900 overflow-hidden font-sans">
      {/* Background Image with Blur (Consistent with Login/Academy theme) */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
          alt="Academy Background"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-brand-900/85 mix-blend-multiply"></div>
      </div>

      <div className="relative z-10 w-full max-w-4xl">
        {/* Header Logo Area */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-md text-white mb-4 shadow-xl border border-white/20">
            <GraduationCap size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">Dr.RG Academy</h1>
          <p className="mt-2 text-lg text-brand-100 font-light tracking-wide uppercase">Official Results Portal</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-[24px] shadow-2xl overflow-hidden border border-brand-100 transition-all duration-500 ease-in-out">
          
          {/* Progress Bar */}
          <div className="bg-slate-50 border-b border-slate-100 px-6 py-5">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              {[
                { id: 1, label: 'Search', icon: Search },
                { id: 2, label: 'Verify', icon: ShieldCheck },
                { id: 3, label: 'Auth', icon: Mail },
                { id: 4, label: 'Results', icon: FileText }
              ].map((item, index) => (
                <div key={item.id} className="flex flex-col items-center flex-1 relative">
                  {/* Connecting Line */}
                  {index < 3 && (
                     <div className={`absolute top-5 left-[50%] w-full h-[2px] -z-10 transition-colors duration-500 ${step > item.id ? 'bg-brand-500' : 'bg-slate-200'}`}></div>
                  )}
                  
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 relative z-10 ${
                    step >= item.id 
                      ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/30' 
                      : 'bg-white text-slate-400 border border-slate-200'
                  }`}>
                    <item.icon size={18} />
                  </div>
                  <span className={`mt-3 text-xs font-bold uppercase tracking-wider ${step >= item.id ? 'text-brand-700' : 'text-slate-400'}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-8 sm:p-12 md:p-16 relative">
            
            {/* Step 1 */}
            {step === 1 && (
              <form onSubmit={handleFetchDetails} className="space-y-8 animate-fade-in-up max-w-md mx-auto">
                <div className="text-center mb-10">
                  <h2 className="text-3xl font-bold text-slate-800">Find Your Results</h2>
                  <p className="text-slate-500 mt-3 font-light">Enter your official academy Student ID to access your academic transcripts securely.</p>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-brand-400" />
                  </div>
                  <input
                    type="text"
                    id="studentId"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="block w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-lg bg-slate-50 focus:bg-white transition-all uppercase placeholder:normal-case"
                    placeholder="Enter Student ID (e.g. STU-XXXX-YYYY)"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-4 px-4 rounded-xl shadow-lg shadow-brand-500/20 text-lg font-bold text-white bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {loading ? 'Searching...' : <>Proceed <ArrowRight size={20}/></>}
                </button>
              </form>
            )}

            {/* Step 2 */}
            {step === 2 && studentDetails && (
              <div className="space-y-8 animate-fade-in-up text-center max-w-lg mx-auto">
                 <div>
                  <h2 className="text-3xl font-bold text-slate-800">Identity Verification</h2>
                  <p className="text-slate-500 mt-3 font-light">Please verify that these details belong to you before requesting access.</p>
                </div>
                
                <div className="bg-gradient-to-br from-slate-50 to-brand-50 rounded-2xl p-8 border border-brand-100 shadow-inner">
                  <div className="mb-6">
                    <span className="block text-xs font-bold text-brand-500 tracking-widest uppercase mb-1">Student Name</span>
                    <span className="block text-2xl font-bold text-slate-900">{studentDetails.name}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-brand-500 tracking-widest uppercase mb-1">Registered Email</span>
                    <span className="block text-xl font-medium text-slate-700">{studentDetails.maskedEmail}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-4 px-4 border-2 border-slate-200 rounded-xl text-lg font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all"
                  >
                    Not Me? Back
                  </button>
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    disabled={loading}
                    className="flex-1 py-4 px-4 rounded-xl shadow-lg shadow-brand-500/20 text-lg font-bold text-white bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 flex justify-center items-center gap-2"
                  >
                    {loading ? 'Sending OTP...' : <>Send Secure OTP <ShieldCheck size={20}/></>}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
               <form onSubmit={handleVerifyAndFetch} className="space-y-8 animate-fade-in-up max-w-md mx-auto">
                 <div className="text-center mb-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-50 text-brand-500 mb-6">
                    <Mail size={32} />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-800">Check Your Email</h2>
                  <p className="text-slate-500 mt-3 font-light leading-relaxed">
                    We've sent a 6-digit security code to <br/>
                    <span className="font-bold text-slate-800">{studentDetails?.maskedEmail}</span>
                  </p>
                </div>
                
                <div>
                  <input
                    type="text"
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="block w-full rounded-xl border-slate-200 shadow-inner focus:border-brand-500 focus:ring-brand-500 text-center text-3xl font-mono tracking-[0.5em] px-4 py-4 bg-slate-50 transition-colors"
                    placeholder="000000"
                    maxLength={6}
                    required
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                   <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex-1 py-4 px-4 border-2 border-slate-200 rounded-xl text-lg font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || otp.length < 6}
                    className="flex-1 py-4 px-4 rounded-xl shadow-lg shadow-brand-500/20 text-lg font-bold text-white bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 flex justify-center items-center gap-2"
                  >
                    {loading ? 'Verifying...' : <>View Results <CheckCircle size={20}/></>}
                  </button>
                </div>
               </form>
            )}

            {/* Step 4 */}
            {step === 4 && results && (
              <div className="space-y-8 animate-fade-in-up">
                 {/* Results Header */}
                 <div className="flex flex-col md:flex-row md:items-center justify-between bg-gradient-to-r from-slate-900 to-brand-900 p-8 rounded-2xl shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 opacity-10">
                      <GraduationCap size={150} className="-mr-10 -mt-10" />
                    </div>
                    <div className="relative z-10 text-white">
                      <p className="text-brand-300 font-medium tracking-wider text-sm mb-1 uppercase">Official Academic Record</p>
                      <h2 className="text-3xl font-bold">{results.student.name}</h2>
                      <p className="text-brand-100 font-light mt-2 flex items-center gap-2">
                        <span className="bg-brand-800/50 px-3 py-1 rounded-md text-sm border border-brand-700/50">Student ID: {results.student.studentId}</span>
                      </p>
                    </div>
                    {results.student.courseName && (
                      <div className="mt-6 md:mt-0 relative z-10">
                        <div className="px-5 py-3 bg-white text-brand-900 rounded-xl text-sm font-extrabold shadow-xl">
                          {results.student.courseName}
                        </div>
                      </div>
                    )}
                 </div>

                 {/* Results Table */}
                 {results.marks && results.marks.length > 0 ? (
                    <div className="overflow-hidden shadow-lg border border-slate-200 rounded-2xl">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                          <thead className="bg-slate-50">
                            <tr>
                              <th scope="col" className="py-4 pl-6 pr-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Semester</th>
                              <th scope="col" className="px-3 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Subject</th>
                              <th scope="col" className="px-3 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Theory</th>
                              <th scope="col" className="px-3 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Internal</th>
                              <th scope="col" className="px-3 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Practical</th>
                              <th scope="col" className="px-6 py-4 text-center text-xs font-extrabold text-brand-700 uppercase tracking-wider bg-brand-50">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {results.marks.map((mark, index) => {
                               const total = (mark.theoryMark || 0) + (mark.internalMark || 0) + (mark.practicalMark || 0);
                               // Highlight pass/fail or just keep clean. We'll keep it clean.
                               return (
                                <tr key={index} className="hover:bg-slate-50 transition-colors group">
                                  <td className="whitespace-nowrap py-5 pl-6 pr-3 text-sm font-semibold text-slate-900">Sem {mark.semester}</td>
                                  <td className="whitespace-nowrap px-3 py-5">
                                    <span className="text-sm font-bold text-slate-800">{mark.subject ? mark.subject.name : 'N/A'}</span>
                                    {mark.subject && <span className="block text-xs font-medium text-slate-400 mt-1">{mark.subject.code}</span>}
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-5 text-sm text-slate-600 text-center">{mark.theoryMark || '-'}</td>
                                  <td className="whitespace-nowrap px-3 py-5 text-sm text-slate-600 text-center">{mark.internalMark || '-'}</td>
                                  <td className="whitespace-nowrap px-3 py-5 text-sm text-slate-600 text-center">{mark.practicalMark || '-'}</td>
                                  <td className="whitespace-nowrap px-6 py-5 text-sm font-extrabold text-brand-700 text-center bg-brand-50/30 group-hover:bg-brand-50 transition-colors">{total}</td>
                                </tr>
                               );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                 ) : (
                    <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-slate-200 border-dashed">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-sm mb-4">
                        <FileText className="text-slate-400" size={24} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">No Results Found</h3>
                      <p className="mt-2 text-slate-500 max-w-sm mx-auto">We couldn't find any published results for your profile at this time. Please contact administration if you believe this is an error.</p>
                    </div>
                 )}

                 <div className="text-center pt-8 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setStep(1);
                        setStudentId('');
                        setOtp('');
                        setResults(null);
                      }}
                      className="inline-flex items-center gap-2 px-6 py-3 border-2 border-slate-200 text-base font-bold rounded-xl text-slate-600 bg-white hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all"
                    >
                      <Search size={18} /> Search Another Result
                    </button>
                 </div>
              </div>
            )}

          </div>
        </div>
        
        {/* Footer */}
        <div className="text-center mt-8 text-brand-100/60 text-sm font-light">
          &copy; {new Date().getFullYear()} Dr.RG Academy. All rights reserved.
        </div>
      </div>
      
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default PublicResults;
