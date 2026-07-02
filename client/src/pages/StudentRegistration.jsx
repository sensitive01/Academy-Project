import React, { useState, useEffect } from "react";
import {
  User, BookOpen, MapPin, Users, CheckCircle, ArrowRight, ArrowLeft,
  CreditCard, Languages, ShieldCheck, Globe, GraduationCap, Phone, Mail, Home,
  Info, AlertCircle, FileText
} from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const StudentRegistration = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [centers, setCenters] = useState([]);
  const { user } = useAuth();
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [timer, setTimer] = useState(0);

  const [formData, setFormData] = useState({
    center: (user?.role === 'center' || user?.role === 'hr') ? (user.center?._id || user.center) : "",
    studentNameEnglish: "",
    studentNameMotherTongue: "",
    dob: "",
    age: "",
    fatherName: "",
    gender: "",
    nationality: "",
    aadharNo: "",
    kcetRegNo: "",
    neetRegNo: "",
    apaarId: "",
    debId: "",
    abcId: "",
    religion: "",
    community: "",
    maritalStatus: "",
    village: "",
    post: "",
    taluk: "",
    district: "",
    pin: "",
    whatsapp: "",
    email: "",
    englishFluency: "",
    language1: "",
    language2: "",
    language3: "",
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    bankNameBranch: "",

    sslcRegNo: "",
    sslcYear: "",
    sslcSchool: "",
    sslcPlace: "",
    sslcBoard: "",
    sslcTotalMarks: "",
    sslcSecuredMarks: "",
    sslcPercentage: "",

    hscRegNo: "",
    hscYear: "",
    hscSchool: "",
    hscPlace: "",
    hscBoard: "",
    hscTotalMarks: "",
    hscSecuredMarks: "",
    hscPercentage: "",
  });

  const [declaration, setDeclaration] = useState(false);

  useEffect(() => {
    const fetchCenters = async () => {
      try {
        const res = await api.get("/centers");
        setCenters(res.data);
      } catch (err) {
        console.error("Failed to fetch centers:", err);
      }
    };
    fetchCenters();
    document.title = "Admission Portal | Dr.RG Academy";
  }, []);

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSendOtp = async () => {
    if (!formData.email) {
      toast.error("Please enter your email address first.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setSendingOtp(true);
    try {
      await api.post("/otp/send-otp", { email: formData.email });
      setOtpSent(true);
      setTimer(60);
      toast.success("OTP sent to your email!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP. Try again.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP.");
      return;
    }

    setVerifyingOtp(true);
    try {
      const res = await api.post("/otp/verify-otp", { email: formData.email, otp });
      if (res.data.verified) {
        setIsEmailVerified(true);
        toast.success("Email verified successfully!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const validateStep = (step) => {
    if (step === 1) {
      if (!formData.studentNameEnglish || !formData.dob || !formData.gender) {
        toast.error("Required: Student Name, Date of Birth, and Gender.");
        return false;
      }
    }
    if (step === 2) {
      if (!formData.whatsapp || !formData.email) {
        toast.error("Required: Phone Number and Email Address.");
        return false;
      }
      if (!isEmailVerified) {
        toast.error("Please verify your email address to proceed.");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);

    if (!declaration) {
      toast.error("Please read and accept the final declaration to submit your application.");
      return;
    }

    if (!isEmailVerified) {
      toast.error("Your email is not verified. Please go back to Step 2 and verify your email.");
      setCurrentStep(2);
      return;
    }

    setLoading(true);
    try {
      const educationBackground = [1, 2, 3].map((i) => ({
        examinationPassed: formData[`exam${i}`],
        instituteName: formData[`school${i}`],
        group: formData[`group${i}`],
        yearOfPassing: formData[`year${i}`],
        marksPercentage: formData[`percentage${i}`],
        remarks: formData[`remarks${i}`],
      }));

      const sslcSubjects = [1, 2, 3, 4, 5, 6].map((i) => ({
        subject: formData[`sslcSubject${i}`],
        totalMark: formData[`sslcTotal${i}`],
        securedMark: formData[`sslcMark${i}`],
      }));

      const hscSubjects = [1, 2, 3, 4, 5, 6, 7].map((i) => ({
        subject: formData[`hscSubject${i}`],
        totalMark: formData[`hscTotal${i}`],
        securedMark: formData[`hscMark${i}`],
      }));

      const payload = {
        ...formData,
        educationBackground,
        sslcSubjects,
        hscSubjects,
        familyBackground: ["Father", "Mother", "Brother / Sister", "Brother / Sister", "Brother / Sister"].map((rel, i) => ({
          relationship: rel,
          name: formData[`familyName${i}`],
          occupation: formData[`familyOccupation${i}`],
          phone: formData[`familyPhone${i}`],
        })),
        references: [1, 2, 3, 4, 5].map((i) => ({
          name: formData[`refName${i}`],
          mobile: formData[`refMobile${i}`],
        })),
        sslcDetails: {
          registerNo: formData.sslcRegNo,
          yearOfPassing: formData.sslcYear,
          schoolName: formData.sslcSchool,
          placeOfSchool: formData.sslcPlace,
          boardOfExamination: formData.sslcBoard,
        },
        hscDetails: {
          registerNo: formData.hscRegNo,
          yearOfPassing: formData.hscYear,
          schoolName: formData.hscSchool,
          placeOfSchool: formData.hscPlace,
          boardOfExamination: formData.hscBoard,
        }
      };

      await api.post("/students/public-registration", payload);
      toast.success("Application Submitted Successfully!");
      setCurrentStep(6);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Submission failed. Please check your data.");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { title: "Identity", icon: <User size={20} /> },
    { title: "Contact", icon: <MapPin size={20} /> },
    { title: "Background", icon: <GraduationCap size={20} /> },
    { title: "Marksheet", icon: <BookOpen size={20} /> },
    { title: "Family", icon: <Users size={20} /> },
  ];

  if (currentStep === 6) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white rounded-3xl p-12 text-center shadow-2xl border-t-8 border-brand-700">
          <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle size={56} />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Application Submitted</h1>
          <p className="text-slate-600 mb-10 text-lg">Thank you for choosing Dr.RG Academy. Your registration has been successfully processed. An academic advisor will contact you shortly to complete the admission formalities.</p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <button onClick={() => window.close()} className="px-10 py-4 bg-slate-900 text-white rounded-xl font-bold tracking-widest text-xs hover:bg-black transition-all">Close Window</button>
            <button onClick={() => navigate("/")} className="px-10 py-4 bg-brand-700 text-white rounded-xl font-bold tracking-widest text-xs hover:bg-brand-800 transition-all flex items-center gap-2 justify-center"> <Home size={16} /> Home Page</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Dynamic Breadcrumb/Context */}
      <div className="bg-brand-700 text-white py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tighter">Student Admission Portal</h1>
              <p className="text-brand-100 mt-2 text-sm md:text-base font-medium opacity-80 tracking-widest">Enrollment for Academic Session 2024-2025</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 hidden md:block">
              <p className="text-[10px] font-black tracking-widest text-brand-200 mb-1">Assistance Need?</p>
              <div className="flex items-center gap-4 text-sm font-bold">
                <span className="flex items-center gap-1"><Phone size={14} /> 1800-123-4567</span>
                <span className="flex items-center gap-1"><Mail size={14} /> admissions@drrgacademy.in</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-20">
        {/* Professional Stepper Indicator */}
        <div className="grid grid-cols-5 gap-2 md:gap-4 -mt-8 mb-10">
          {steps.map((s, i) => (
            <div key={i}
              onClick={() => {
                if (i + 1 <= currentStep || validateStep(currentStep)) {
                  setCurrentStep(i + 1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              className={`relative flex flex-col items-center group cursor-pointer`}>
              <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition-all duration-500 border-4 ${currentStep === i + 1 ? "bg-white border-brand-700 text-brand-700 shadow-xl" : currentStep > i + 1 ? "bg-brand-700 border-brand-700 text-white" : "bg-white border-slate-100 text-slate-300"}`}>
                {currentStep > i + 1 ? <CheckCircle size={24} /> : s.icon}
              </div>
              <span className={`mt-3 text-[9px] md:text-[10px] font-black tracking-widest text-center hidden sm:block ${currentStep === i + 1 ? "text-brand-700" : "text-slate-400"}`}>{s.title}</span>
            </div>
          ))}
        </div>

        <div className="bg-white border border-slate-100 rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden min-h-[500px]">
          {/* Internal Instructions */}
          <div className="bg-slate-50 border-b border-slate-100 px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400">
              <Info size={16} />
              <span className="text-[10px] font-bold tracking-widest">Fields marked with (*) are mandatory</span>
            </div>
            <div className="text-[10px] font-bold text-slate-400 tracking-widest">
              Step {currentStep} of 5
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 md:p-14">

            {/* STEP 1: IDENTITY */}
            {currentStep === 1 && (
              <div className="space-y-12 animate-in fade-in duration-700">
                <StepHeader title="Personal Information" icon={<User className="text-brand-700" />} />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-x-12 gap-y-8">
                  <FormInput label="Name of Student (English) *" name="studentNameEnglish" value={formData.studentNameEnglish} onChange={handleChange} />
                  <FormInput label="Name of Student (Mother Tongue)" name="studentNameMotherTongue" value={formData.studentNameMotherTongue} onChange={handleChange} />

                  <div className="grid grid-cols-2 gap-6">
                    <FormInput label="Date of Birth *" type="date" name="dob" value={formData.dob} onChange={handleChange} />
                    <FormInput label="Age" name="age" value={formData.age} onChange={handleChange} />
                  </div>
                  <FormInput label="Father / Mother Name *" name="fatherName" value={formData.fatherName} onChange={handleChange} />

                  <SelectBox label="Gender *" name="gender" value={formData.gender} onChange={handleChange} options={["Male", "Female", "Other"]} />
                  <FormInput label="Nationality *" name="nationality" value={formData.nationality} onChange={handleChange} />
                </div>

                <StepHeader title="National & Academic IDs" icon={<ShieldCheck className="text-brand-700" />} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <FormInput label="Aadhar No *" name="aadharNo" value={formData.aadharNo} onChange={handleChange} />
                  <FormInput label="KCET Reg No" name="kcetRegNo" value={formData.kcetRegNo} onChange={handleChange} />
                  <FormInput label="NEET Reg No" name="neetRegNo" value={formData.neetRegNo} onChange={handleChange} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <FormInput label="APAAR ID Reg No" name="apaarId" value={formData.apaarId} onChange={handleChange} />
                  <FormInput label="DEB Unique ID No" name="debId" value={formData.debId} onChange={handleChange} />
                  <FormInput label="ABC ID No" name="abcId" value={formData.abcId} onChange={handleChange} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-slate-50">
                  <div className="grid grid-cols-2 gap-6">
                    <SelectBox label="Religion" name="religion" value={formData.religion} onChange={handleChange} options={["Hindu", "Muslim", "Christian", "Others"]} />
                    <SelectBox label="Community" name="community" value={formData.community} onChange={handleChange} options={["MBC", "OC", "OBC", "BC", "SC", "ST", "Others"]} />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <SelectBox label="Marital Status" name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} options={["Married", "Unmarried"]} />
                    <SelectBox label="Select Center" name="center" value={formData.center} onChange={handleChange} options={centers.map(c => ({ value: c._id, label: `${c.name} - ${c.location}` }))} isObjectOptions disabled={(user?.role === 'center' || user?.role === 'hr')} />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: CONTACT & BANK */}
            {currentStep === 2 && (
              <div className="space-y-12 animate-in fade-in duration-700 max-w-3xl mx-auto">

                {/* ADDRESS */}
                <div className="space-y-8">
                  <StepHeader title="Address for Correspondence" icon={<MapPin className="text-brand-700" />} />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInput label="Village" name="village" value={formData.village} onChange={handleChange} />
                    <FormInput label="Post" name="post" value={formData.post} onChange={handleChange} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormInput label="Taluk" name="taluk" value={formData.taluk} onChange={handleChange} />
                    <FormInput label="District" name="district" value={formData.district} onChange={handleChange} />
                    <FormInput label="PIN Code" name="pin" value={formData.pin} onChange={handleChange} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    <FormInput label="Phone Number *" name="whatsapp" value={formData.whatsapp} onChange={handleChange} />

                    <div className="space-y-4">
                      {/* Email Input Wrapper */}
                      <div className="group space-y-2">
                        <label className="text-xs font-black tracking-widest text-slate-700 ml-1 group-focus-within:text-brand-700 transition-colors">
                          Email Address *
                        </label>
                        <div className="relative flex items-center">
                          <input
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            disabled={isEmailVerified || (otpSent && !isEmailVerified)}
                            className={`w-full pl-10 pr-24 py-2 bg-slate-50 border-2 border-transparent rounded-lg outline-none transition-all text-[12px] font-bold text-slate-900 focus:bg-white focus:border-brand-700 
                              ${isEmailVerified ? "border-green-500/30 bg-green-50/30 text-green-700" : ""} 
                              ${(otpSent && !isEmailVerified) ? "opacity-70 bg-slate-100" : ""}`}
                            placeholder="email@example.com"
                          />
                          <Mail className={`absolute left-4 size-5 ${isEmailVerified ? "text-green-500" : "text-slate-400"}`} />

                          <div className="absolute right-2 flex gap-1">
                            {!isEmailVerified && !otpSent && (
                              <button
                                type="button"
                                onClick={handleSendOtp}
                                disabled={sendingOtp}
                                className="px-5 py-3 rounded-xl bg-brand-700 text-white text-[9px] font-black tracking-widest hover:bg-brand-800 transition-all shadow-lg shadow-brand-700/20 active:scale-95 disabled:opacity-50"
                              >
                                {sendingOtp ? "Sending..." : "Verify"}
                              </button>
                            )}

                            {isEmailVerified && (
                              <div className="flex items-center gap-1.5 px-4 py-2.5 bg-green-500 text-white rounded-xl shadow-lg shadow-green-500/20 animate-in zoom-in duration-300">
                                <CheckCircle size={14} />
                                <span className="text-[9px] font-black tracking-widest">Verified</span>
                              </div>
                            )}

                            {otpSent && !isEmailVerified && (
                              <button
                                type="button"
                                onClick={() => { setOtpSent(false); setOtp(""); }}
                                className="px-4 py-2.5 text-[9px] font-black tracking-widest text-slate-400 hover:text-brand-700 transition-colors"
                              >
                                Change
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* OTP Input Section */}
                      {otpSent && !isEmailVerified && (
                        <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-200 shadow-md space-y-5 animate-in slide-in-from-top-4 fade-in duration-500">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-brand-700/20 flex items-center justify-center">
                                <ShieldCheck className="text-brand-700 size-4" />
                              </div>
                              <span className="text-xs font-black tracking-widest text-slate-700">Enter OTP Code</span>
                            </div>
                            {timer > 0 ? (
                              <span className="text-[9px] font-bold text-slate-500 tracking-widest">Resend in {timer}s</span>
                            ) : (
                              <button onClick={handleSendOtp} className="text-[9px] font-black text-brand-500 tracking-widest hover:text-brand-400">Resend Code</button>
                            )}
                          </div>

                          <div className="grid grid-cols-6 gap-2">
                            {/* We'll use a single input for simplicity but styled to look like boxes */}
                            <input
                              type="text"
                              maxLength="6"
                              value={otp}
                              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                              className="col-span-6 w-full bg-white border-2 border-slate-300 rounded-lg py-1.5 text-center text-xl font-black tracking-[1em] text-slate-900 focus:border-brand-700 outline-none transition-all placeholder:text-slate-300"
                              placeholder="000000"
                              autoFocus
                            />
                          </div>

                          <button
                            type="button"
                            onClick={handleVerifyOtp}
                            disabled={verifyingOtp || otp.length !== 6}
                            className="w-full py-4 bg-brand-700 hover:bg-brand-800 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl text-[10px] font-black tracking-[0.3em] transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                          >
                            {verifyingOtp ? (
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Verifying...</span>
                              </div>
                            ) : (
                              <>Verify Account <ArrowRight size={14} /></>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* LANGUAGE */}
                <div className="space-y-8">
                  <StepHeader title="Languages" icon={<Globe className="text-brand-700" />} />

                  <div className="space-y-6">
                    <SelectBox
                      label="Fluency in English"
                      name="englishFluency"
                      value={formData.englishFluency}
                      onChange={handleChange}
                      options={["Excellent", "Average", "Below Average"]}
                    />

                    {/* Sub Heading */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 mb-1">
                        Languages Known
                      </h4>
                      <p className="text-xs text-slate-400 mb-4">
                        Please mention the languages you can speak/read/write
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormInput label="Language 1" name="language1" value={formData.language1} onChange={handleChange} />
                        <FormInput label="Language 2" name="language2" value={formData.language2} onChange={handleChange} />
                        <FormInput label="Language 3" name="language3" value={formData.language3} onChange={handleChange} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* BANK */}
                <div className="space-y-8">
                  <StepHeader title="Bank Details" icon={<CreditCard className="text-brand-700" />} />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInput label="Account Holder Name" name="accountHolderName" value={formData.accountHolderName} onChange={handleChange} />
                    <FormInput label="Account Number" name="accountNumber" value={formData.accountNumber} onChange={handleChange} />
                    <FormInput label="IFSC Code" name="ifscCode" value={formData.ifscCode} onChange={handleChange} />
                    <FormInput label="Bank & Branch" name="bankNameBranch" value={formData.bankNameBranch} onChange={handleChange} />
                  </div>
                </div>

              </div>
            )}

            {/* STEP 3: EDUCATIONAL HISTORY */}
            {currentStep === 3 && (
              <div className="space-y-12 animate-in fade-in duration-700">
                <StepHeader title="Academic Background" subtitle="History of examinations completed before SSLC/HSC" icon={<GraduationCap className="text-brand-700" />} />

                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <table className="w-full text-xs min-w-[700px]">
                    <thead className="bg-slate-900 text-white text-[10px] tracking-widest">
                      <tr>
                        <th className="p-4 text-left font-bold">Examination Passed</th>
                        <th className="p-4 text-left font-bold">Institute / School</th>
                        <th className="p-4 text-left font-bold">Group</th>
                        <th className="p-4 text-left font-bold">Year</th>
                        <th className="p-4 text-left font-bold">Mark %</th>
                        <th className="p-4 text-left font-bold">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[1, 2, 3].map(i => (
                        <tr key={i}>
                          <td className="p-2"><input autoComplete="off" name={`exam${i}`} value={formData[`exam${i}`] || ""} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border-2 border-transparent rounded-lg outline-none transition-all text-[12px] font-bold text-slate-900 focus:bg-white focus:border-brand-700" /></td>
                          <td className="p-2"><input autoComplete="off" name={`school${i}`} value={formData[`school${i}`] || ""} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border-2 border-transparent rounded-lg outline-none transition-all text-[12px] font-bold text-slate-900 focus:bg-white focus:border-brand-700" /></td>
                          <td className="p-2"><input autoComplete="off" name={`group${i}`} value={formData[`group${i}`] || ""} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border-2 border-transparent rounded-lg outline-none transition-all text-[12px] font-bold text-slate-900 focus:bg-white focus:border-brand-700" /></td>
                          <td className="p-2"><input autoComplete="off" name={`year${i}`} value={formData[`year${i}`] || ""} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border-2 border-transparent rounded-lg outline-none transition-all text-[12px] font-bold text-slate-900 focus:bg-white focus:border-brand-700" /></td>
                          <td className="p-2"><input autoComplete="off" name={`percentage${i}`} value={formData[`percentage${i}`] || ""} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border-2 border-transparent rounded-lg outline-none transition-all text-[12px] font-bold text-slate-900 focus:bg-white focus:border-brand-700" /></td>
                          <td className="p-2"><input autoComplete="off" name={`remarks${i}`} value={formData[`remarks${i}`] || ""} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border-2 border-transparent rounded-lg outline-none transition-all text-[12px] font-bold text-slate-900 focus:bg-white focus:border-brand-700" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center gap-4 p-8 bg-brand-50 rounded-3xl border border-brand-100">
                  <div className="w-12 h-12 bg-brand-700 text-white rounded-full flex items-center justify-center shrink-0">
                    <AlertCircle size={24} />
                  </div>
                  <p className="text-brand-900 text-sm font-medium leading-relaxed">Please ensure all educational records are accurate as per your original certificates. Verification will be performed during document submission.</p>
                </div>
              </div>
            )}

            {/* STEP 4: MARKSHEETS */}
            {currentStep === 4 && (
              <div className="space-y-16 animate-in fade-in duration-700">

                {/* COMMON TABLE COMPONENT STYLE */}
                {[
                  { title: "SSLC Details", prefix: "sslc", count: 6 },
                  { title: "HSC / PU Details", prefix: "hsc", count: 7 }
                ].map(({ title, prefix, count }) => (
                  <div key={prefix} className="space-y-6">

                    {/* Section Header */}
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{title}</h3>
                      <div className="h-1 w-16 bg-brand-700 mt-2 rounded-full"></div>
                    </div>

                    {/* Table */}
                    <div className="overflow-hidden border border-slate-200 rounded-2xl">
                      <table className="w-full text-sm">
                        <thead className="bg-white border-b border-slate-200">
                          <tr className="text-slate-600 text-xs tracking-wider">
                            <th className="p-4 text-center w-16">S.No</th>
                            <th className="p-4 text-left">Subject</th>
                            <th className="p-4 text-center">Total</th>
                            <th className="p-4 text-center">Secured</th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                          {[...Array(count)].map((_, i) => (
                            <tr key={i} className="hover:bg-slate-50 transition">
                              <td className="text-center font-semibold text-slate-400">{i + 1}</td>

                              <td className="p-2">
                                <input
                                  name={`${prefix}Subject${i + 1}`}
                                  value={formData[`${prefix}Subject${i + 1}`] || ""}
                                  onChange={handleChange}
                                  className="w-full px-3 py-2 bg-slate-50 border-2 border-transparent rounded-lg outline-none transition-all text-[12px] font-bold text-slate-900 focus:bg-white focus:border-brand-700"
                                  placeholder="Subject"
                                />
                              </td>

                              <td className="p-2">
                                <input
                                  name={`${prefix}Total${i + 1}`}
                                  value={formData[`${prefix}Total${i + 1}`] || ""}
                                  onChange={handleChange}
                                  className="w-full px-3 py-2 bg-slate-50 border-2 border-transparent rounded-lg outline-none transition-all text-[12px] font-bold text-slate-900 focus:bg-white focus:border-brand-700 text-center"
                                />
                              </td>

                              <td className="p-2">
                                <input
                                  name={`${prefix}Mark${i + 1}`}
                                  value={formData[`${prefix}Mark${i + 1}`] || ""}
                                  onChange={handleChange}
                                  className="w-full px-3 py-2 bg-slate-50 border-2 border-transparent rounded-lg outline-none transition-all text-[12px] font-bold text-slate-900 focus:bg-white focus:border-brand-700 text-center"
                                />
                              </td>
                            </tr>
                          ))}

                          {/* TOTAL ROW */}
                          <tr className="bg-slate-50 font-semibold">
                            <td colSpan="2" className="p-4 text-right">Total</td>

                            <td className="p-2">
                              <input
                                name={`${prefix}TotalMarks`}
                                value={formData[`${prefix}TotalMarks`] || ""}
                                onChange={handleChange}
                                className="w-full px-3 py-2 bg-slate-50 border-2 border-transparent rounded-lg outline-none transition-all text-[12px] font-bold text-slate-900 focus:bg-white focus:border-brand-700 text-center"
                              />
                            </td>

                            <td className="p-2">
                              <input
                                name={`${prefix}SecuredMarks`}
                                value={formData[`${prefix}SecuredMarks`] || ""}
                                onChange={handleChange}
                                className="w-full px-3 py-2 bg-slate-50 border-2 border-transparent rounded-lg outline-none transition-all text-[12px] font-bold text-slate-900 focus:bg-white focus:border-brand-700 text-center"
                              />
                            </td>
                          </tr>

                          {/* PERCENTAGE ROW */}
                          <tr className="bg-white">
                            <td colSpan="3" className="p-4 text-right text-slate-500 font-medium">
                              Percentage (%)
                            </td>

                            <td className="p-2">
                              <input
                                name={`${prefix}Percentage`}
                                value={formData[`${prefix}Percentage`] || ""}
                                onChange={handleChange}
                                className="w-full px-3 py-2 bg-slate-50 border-2 border-transparent rounded-lg outline-none transition-all text-[12px] font-bold text-slate-900 focus:bg-white focus:border-brand-700 text-center"
                              />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* DETAILS BELOW TABLE */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormInput label="Register No" name={`${prefix}RegNo`} value={formData[`${prefix}RegNo`]} onChange={handleChange} />
                      <FormInput label="Year of Passing" name={`${prefix}Year`} value={formData[`${prefix}Year`]} onChange={handleChange} />
                      <FormInput label="School / Institution" name={`${prefix}School`} value={formData[`${prefix}School`]} onChange={handleChange} />
                      <FormInput label="Place of school" name={`${prefix}Place`} value={formData[`${prefix}Place`]} onChange={handleChange} />
                      <FormInput label="Board of Examination" name={`${prefix}Board`} value={formData[`${prefix}Board`]} onChange={handleChange} />
                    </div>

                  </div>
                ))}

              </div>
            )}

            {/* STEP 5: FAMILY */}
            {currentStep === 5 && (
              <div className="space-y-12 animate-in fade-in duration-700">
                <StepHeader title="Family Background" subtitle="Details of parents and siblings" icon={<Users className="text-brand-700" />} />

                <div className="overflow-hidden rounded-3xl border border-slate-200">
                  <table className="w-full text-xs min-w-[600px]">
                    <thead className="bg-slate-900 text-white text-[10px] font-black tracking-widest">
                      <tr>
                        <th className="p-5 text-left border-r border-white/10">Relationship</th>
                        <th className="p-5 text-left border-r border-white/10">Full Name</th>
                        <th className="p-5 text-left border-r border-white/10">Occupation & Designation</th>
                        <th className="p-5 text-left">Contact Number</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {["Father", "Mother", "Brother / Sister", "Brother / Sister", "Brother / Sister"].map((rel, i) => (
                        <tr key={i}>
                          <td className="p-5 font-black text-slate-800 bg-slate-50/50 whitespace-nowrap">{rel}</td>
                          <td className="p-2 border-r border-slate-100"><input autoComplete="off" name={`familyName${i}`} value={formData[`familyName${i}`] || ""} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border-2 border-transparent rounded-lg outline-none transition-all text-[12px] font-bold text-slate-900 focus:bg-white focus:border-brand-700" placeholder="Full Name..." /></td>
                          <td className="p-2 border-r border-slate-100"><input autoComplete="off" name={`familyOccupation${i}`} value={formData[`familyOccupation${i}`] || ""} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border-2 border-transparent rounded-lg outline-none transition-all text-[12px] font-bold text-slate-900 focus:bg-white focus:border-brand-700" placeholder="Designation..." /></td>
                          <td className="p-2"><input autoComplete="off" name={`familyPhone${i}`} value={formData[`familyPhone${i}`] || ""} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border-2 border-transparent rounded-lg outline-none transition-all text-[12px] font-bold text-slate-900 focus:bg-white focus:border-brand-700" placeholder="+91..." /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="pt-10">
                  <StepHeader title="Guardian/Friends Reference" subtitle="VI. 5 best friends contact information" icon={<Phone className="text-brand-700" />} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div
                        key={i}
                        className="p-6 rounded-2xl border border-slate-200 bg-white hover:shadow-lg transition-all"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-bold text-slate-400 uppercase">
                            Reference {i}
                          </span>
                          <div className="w-8 h-8 flex items-center justify-center bg-brand-700 text-white text-xs font-bold rounded-lg">
                            {i}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <FormInput
                            label="Full Name"
                            name={`refName${i}`}
                            value={formData[`refName${i}`] || ""}
                            onChange={handleChange}
                          />

                          <FormInput
                            label="Mobile Number"
                            name={`refMobile${i}`}
                            value={formData[`refMobile${i}`] || ""}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 mt-10 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-brand-700/20 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                  <label className="flex items-start gap-4 cursor-pointer relative z-10">
                    <input
                      type="checkbox"
                      checked={declaration}
                      onChange={(e) => setDeclaration(e.target.checked)}
                      className="mt-1 w-5 h-5 accent-brand-700 cursor-pointer"
                    />
                    <div>
                      <h4 className="text-lg font-bold text-brand-400 mb-1">
                        Declaration
                      </h4>
                      <p className="text-slate-300 text-sm leading-relaxed">
                        I hereby declare that all the information provided is true and correct.
                        Any false information may lead to cancellation of admission.
                      </p>
                      {/* Inline error */}
                      {submitAttempted && !declaration && (
                        <p className="text-red-400 text-sm mt-2 font-semibold">
                          Please accept the declaration to continue.
                        </p>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Navigation Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mt-12 pt-8 border-t-2 border-slate-50">
              <div className="min-w-[150px]">
                {currentStep > 1 && (
                  <button type="button" onClick={prevStep} className="flex items-center gap-2 px-6 py-3 text-slate-400 font-black tracking-widest hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all group text-[10px]">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back
                  </button>
                )}
              </div>
              <div className="flex flex-wrap justify-end gap-4 w-full md:w-auto">
                {currentStep < 5 ? (
                  <button type="button" onClick={nextStep} className="w-full md:w-auto flex items-center justify-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-xl font-black text-[10px] tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200 group transform hover:scale-[1.02] active:scale-95">
                    Next Step <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                ) : (
                  <button type="submit" disabled={loading} className="w-full md:w-auto flex items-center justify-center gap-3 bg-brand-700 text-white px-10 py-4 rounded-xl font-black text-[10px] tracking-[0.2em] hover:bg-brand-800 transition-all shadow-xl shadow-brand-900/30 disabled:opacity-50 hover:shadow-brand-700/40">
                    {loading ? "Processing..." : "Complete Application"} <CheckCircle size={20} />
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;900&display=swap');
        * { font-family: 'Outfit', sans-serif; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #b91c1c; border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}} />
    </div>
  );
};

const StepHeader = ({ title, subtitle, icon }) => (
  <div className="mb-10 animate-fade-in">
    <div className="flex items-center gap-5">
      <div className="w-12 h-12 bg-slate-50 border-2 border-slate-100 rounded-2xl flex items-center justify-center shadow-inner">
        {icon}
      </div>
      <div>
        <h2 className="text-2xl font-black tracking-tight text-slate-900 leading-none mb-1">{title}</h2>
        {subtitle && <p className="text-xs font-bold text-slate-400 tracking-widest">{subtitle}</p>}
      </div>
    </div>
    <div className="h-1 w-20 bg-brand-700 mt-5 rounded-full"></div>
  </div>
);

const FormInput = ({ label, ...props }) => (
  <div className="group space-y-1">
    <label className="text-xs font-black tracking-widest text-slate-700 ml-1 group-focus-within:text-brand-700 transition-colors">{label}</label>
    <input {...props} className="w-full px-3 py-2 bg-slate-50 border-2 border-transparent rounded-lg outline-none transition-all text-[12px] font-bold text-slate-900 focus:bg-white focus:border-brand-700 focus:shadow-[0_20px_40px_-20px_rgba(185,28,28,0.1)]" />
  </div>
);

const SelectBox = ({ label, options, isObjectOptions, ...props }) => (
  <div className="group space-y-1">
    <label className="text-xs font-black tracking-widest text-slate-700 ml-1 group-focus-within:text-brand-700 transition-colors">{label}</label>
    <select {...props} className="w-full px-3 py-2 bg-slate-50 border-2 border-transparent rounded-lg outline-none transition-all text-[12px] font-bold text-slate-900 appearance-none cursor-pointer focus:bg-white focus:border-brand-700 disabled:bg-slate-100 disabled:text-slate-500">
      <option value="">Select Option</option>
      {options.map((opt, i) => (
        <option key={i} value={isObjectOptions ? opt.value : opt}>{isObjectOptions ? opt.label : opt}</option>
      ))}
    </select>
  </div>
);

export default StudentRegistration;
