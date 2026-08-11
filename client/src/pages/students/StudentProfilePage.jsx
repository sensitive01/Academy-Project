import React, { useState, useEffect } from "react";
import {
  User, BookOpen, MapPin, Users, CheckCircle, ArrowLeft,
  CreditCard, Languages, ShieldCheck, Globe, GraduationCap, Phone, Mail,
  Info, FileText, Eye, Edit2, Save, Building2, Wallet, Plus, Trash2
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

const StudentProfilePage = ({ student, initialMode = "view", centers = [], onBack, onUpdate }) => {
  const [mode, setMode] = useState(initialMode); // "view" | "edit"
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState(1);

  const [formData, setFormData] = useState(() => {
    const clone = JSON.parse(JSON.stringify(student || {}));
    return {
      ...clone,
      email: student?.user?.email || student?.email || "",
      whatsapp: student?.whatsapp || student?.phone || "",
      center: student?.center?._id || student?.center || "",
      village: clone.address?.village || clone.village || "",
      post: clone.address?.post || clone.post || "",
      taluk: clone.address?.taluk || clone.taluk || "",
      district: clone.address?.district || clone.district || "",
      pin: clone.address?.pin || clone.pin || "",
      accountHolderName: clone.bankDetails?.accountHolderName || clone.accountHolderName || "",
      accountNumber: clone.bankDetails?.accountNumber || clone.accountNumber || "",
      ifscCode: clone.bankDetails?.ifscCode || clone.ifscCode || "",
      bankNameBranch: clone.bankDetails?.bankNameBranch || clone.bankNameBranch || "",
      address: clone.address || {},
      bankDetails: clone.bankDetails || {}
    };
  });

  const [feeForm, setFeeForm] = useState({
    councilFee: "",
    courseFee: "",
    selectedScheme: "",
    fees: []
  });

  useEffect(() => {
    if (student?._id) {
      api.get("/student-fees").then(res => {
        const studentFees = Array.isArray(res.data) 
          ? res.data.filter(f => (f.student?._id || f.student) === student._id)
          : [];
        setFeeForm(prev => ({
          ...prev,
          fees: studentFees.map(f => ({
            _id: f._id,
            feeType: f.feeType,
            otherFeeType: f.otherFeeType || f.name,
            amount: f.amount,
            name: f.name || f.otherFeeType || f.feeType,
            status: f.status || "pending",
            dueDate: f.dueDate
          }))
        }));
      }).catch(err => console.error("Error fetching student fees:", err));
    }
  }, [student]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...( ["village", "post", "taluk", "district", "pin"].includes(name)
        ? { address: { ...(prev.address || {}), [name]: value } }
        : {} ),
      ...( ["accountHolderName", "accountNumber", "ifscCode", "bankNameBranch"].includes(name)
        ? { bankDetails: { ...(prev.bankDetails || {}), [name]: value } }
        : {} )
    }));
  };

  const calculateAndApplyScheme = (councilFeeVal, courseFeeVal, scheme) => {
    const cFee = Number(councilFeeVal) || 0;
    const crsFee = Number(courseFeeVal) || 0;
    const generatedFees = [];

    if (cFee > 0) {
      generatedFees.push({
        feeType: 'Other',
        otherFeeType: 'Council Fees',
        amount: cFee,
        name: 'Council Fees'
      });
    }

    if (crsFee > 0 && scheme) {
      if (scheme === 'monthly') {
        const monthlyAmt = Math.round(crsFee / 12);
        for (let i = 1; i <= 12; i++) {
          generatedFees.push({
            feeType: 'Monthly',
            otherFeeType: `Month ${i}`,
            amount: monthlyAmt,
            name: `Month ${i} Installment`
          });
        }
      } else if (scheme === 'sem') {
        const semAmt = Math.round(crsFee / 6);
        for (let i = 1; i <= 6; i++) {
          generatedFees.push({
            feeType: 'Sem',
            otherFeeType: `Semester ${i}`,
            amount: semAmt,
            name: `Semester ${i} Fee`
          });
        }
      } else if (scheme === 'term3') {
        const termAmt = Math.round(crsFee / 3);
        for (let i = 1; i <= 3; i++) {
          generatedFees.push({
            feeType: 'Term',
            otherFeeType: `Term ${i}`,
            amount: termAmt,
            name: `Term ${i} Fee`
          });
        }
      } else if (scheme === 'term4') {
        const termAmt = Math.round(crsFee / 4);
        for (let i = 1; i <= 4; i++) {
          generatedFees.push({
            feeType: 'Term',
            otherFeeType: `Term ${i}`,
            amount: termAmt,
            name: `Term ${i} Fee`
          });
        }
      }
    }

    setFeeForm(prev => ({ ...prev, fees: generatedFees }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await onUpdate({ ...formData, fees: feeForm.fees });
      setMode("view");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    const elem = document.getElementById(`section-${sectionId}`);
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const steps = [
    { id: 1, title: "Identity", icon: <User size={20} /> },
    { id: 2, title: "Contact", icon: <MapPin size={20} /> },
    { id: 3, title: "Financial", icon: <CreditCard size={20} /> },
    { id: 4, title: "Academic", icon: <GraduationCap size={20} /> },
    { id: 5, title: "Family", icon: <Users size={20} /> },
    { id: 6, title: "Fees", icon: <Wallet size={20} /> },
  ];

  if (!student) return null;

  return (
    <div className="min-h-screen bg-slate-50/50 -mt-4 sm:-mt-6 -mx-4 sm:-mx-6 pb-20">
      {/* Combined Sticky Header (Red Banner + 6 Step Icons) */}
      <div className="sticky top-0 z-50 shadow-xl shadow-slate-900/10">
        {/* Red Banner */}
        <div className="bg-brand-700 text-white py-6 px-6 sm:px-10">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all shrink-0"
                title="Back to Student Directory"
              >
                <ArrowLeft size={18} />
              </button>

              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                    {formData.studentNameEnglish || student.user?.name || "Student Profile"}
                  </h1>
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-black rounded-full uppercase tracking-widest border border-white/20">
                    {student.studentId || "ID-PENDING"}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    student.status === "active" ? "bg-green-500/20 text-green-200 border border-green-400/30" : "bg-red-500/20 text-red-200 border border-red-400/30"
                  }`}>
                    {student.status || "active"}
                  </span>
                </div>
                <p className="text-brand-100 mt-0.5 text-xs font-medium flex items-center gap-2">
                  <Building2 size={13} className="text-brand-200" />
                  {student.center?.name ? `${student.center.name} - ${student.center.location}` : "Online Student"}
                </p>
              </div>
            </div>

            {/* Mode Switcher Pills */}
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 self-start md:self-auto">
              <button
                type="button"
                onClick={() => setMode("view")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black tracking-wider transition-all ${
                  mode === "view"
                    ? "bg-white text-brand-700 shadow-lg"
                    : "text-brand-100 hover:text-white"
                }`}
              >
                <Eye size={15} /> VIEW MODE
              </button>
              <button
                type="button"
                onClick={() => setMode("edit")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black tracking-wider transition-all ${
                  mode === "edit"
                    ? "bg-white text-brand-700 shadow-lg"
                    : "text-brand-100 hover:text-white"
                }`}
              >
                <Edit2 size={15} /> EDIT MODE
              </button>
            </div>
          </div>
        </div>

        {/* White Stepper Node Row */}
        <div className="bg-white/95 backdrop-blur-md py-3.5 px-4 border-b border-slate-200/80">
          <div className="max-w-6xl mx-auto grid grid-cols-6 gap-2 md:gap-4">
            {steps.map((s) => (
              <div
                key={s.id}
                onClick={() => scrollToSection(s.id)}
                className="relative flex flex-col items-center group cursor-pointer"
              >
                <div className={`w-10 h-10 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-all duration-300 border-2 ${
                  activeSection === s.id
                    ? "bg-white border-brand-700 text-brand-700 shadow-lg scale-105"
                    : "bg-white border-slate-200 text-slate-400 hover:border-brand-400"
                }`}>
                  {s.icon}
                </div>
                <span className={`mt-1.5 text-[9px] md:text-[10px] font-black tracking-widest text-center hidden sm:block ${
                  activeSection === s.id ? "text-brand-700" : "text-slate-400"
                }`}>
                  {s.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-8">
        {/* Main Static Full-Page Container (All 6 Steps Stacked) */}
        <div className="space-y-10">
          {/* STEP 1: IDENTITY */}
          <div id="section-1" className="bg-white border border-slate-100 rounded-3xl shadow-xl overflow-hidden p-6 md:p-10 scroll-mt-48">
            <StepHeader title="Step 1. Personal Information & Identity" icon={<User className="text-brand-700" />} />
            {mode === "edit" ? (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                  <FormInput label="Name of Student (English)" name="studentNameEnglish" value={formData.studentNameEnglish} onChange={handleChange} />
                  <FormInput label="Name of Student (Mother Tongue)" name="studentNameMotherTongue" value={formData.studentNameMotherTongue} onChange={handleChange} />
                  <div className="grid grid-cols-2 gap-6">
                    <FormInput label="Date of Birth" type="date" name="dob" value={formData.dob ? formData.dob.split("T")[0] : ""} onChange={handleChange} />
                    <FormInput label="Age" name="age" value={formData.age} onChange={handleChange} />
                  </div>
                  <FormInput label="Father Name" name="fatherName" value={formData.fatherName} onChange={handleChange} />
                  <SelectBox label="Gender" name="gender" value={formData.gender} onChange={handleChange} options={["Male", "Female", "Other"]} />
                  <FormInput label="Nationality" name="nationality" value={formData.nationality} onChange={handleChange} />
                </div>

                <StepHeader title="National & Academic IDs" icon={<ShieldCheck className="text-brand-700" />} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormInput label="Aadhar No" name="aadharNo" value={formData.aadharNo} onChange={handleChange} />
                  <FormInput label="KCET Reg No" name="kcetRegNo" value={formData.kcetRegNo} onChange={handleChange} />
                  <FormInput label="NEET Reg No" name="neetRegNo" value={formData.neetRegNo} onChange={handleChange} />
                  <FormInput label="APAAR ID" name="apaarId" value={formData.apaarId} onChange={handleChange} />
                  <FormInput label="DEB ID" name="debId" value={formData.debId} onChange={handleChange} />
                </div>

                <StepHeader title="Demographics & Center" icon={<Globe className="text-brand-700" />} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormInput label="Religion" name="religion" value={formData.religion} onChange={handleChange} />
                  <FormInput label="Community" name="community" value={formData.community} onChange={handleChange} />
                  <SelectBox label="Academic Center" name="center" value={formData.center} onChange={handleChange} isObjectOptions options={centers.map(c => ({ value: c._id, label: `${c.name} - ${c.location}` }))} />
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormDisplay label="Name of Student (English)" value={formData.studentNameEnglish || student.user?.name} />
                  <FormDisplay label="Name of Student (Mother Tongue)" value={formData.studentNameMotherTongue} />
                  <FormDisplay label="Date of Birth" value={formData.dob ? new Date(formData.dob).toLocaleDateString() : "-"} />
                  <FormDisplay label="Age" value={formData.age} />
                  <FormDisplay label="Father Name" value={formData.fatherName} />
                  <FormDisplay label="Gender" value={formData.gender} />
                  <FormDisplay label="Nationality" value={formData.nationality} />
                </div>

                <StepHeader title="National & Academic IDs" icon={<ShieldCheck className="text-brand-700" />} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormDisplay label="Aadhar No" value={formData.aadharNo} />
                  <FormDisplay label="KCET Reg No" value={formData.kcetRegNo} />
                  <FormDisplay label="NEET Reg No" value={formData.neetRegNo} />
                  <FormDisplay label="APAAR ID" value={formData.apaarId} />
                  <FormDisplay label="DEB ID" value={formData.debId} />
                </div>

                <StepHeader title="Demographics & Center" icon={<Globe className="text-brand-700" />} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormDisplay label="Religion" value={formData.religion} />
                  <FormDisplay label="Community" value={formData.community} />
                  <FormDisplay label="Academic Center" value={student.center?.name ? `${student.center.name} - ${student.center.location}` : "Online Student"} />
                </div>
              </div>
            )}
          </div>

          {/* STEP 2: CONTACT */}
          <div id="section-2" className="bg-white border border-slate-100 rounded-3xl shadow-xl overflow-hidden p-6 md:p-10 scroll-mt-48">
            <StepHeader title="Step 2. Residential Address & Contact" icon={<MapPin className="text-brand-700" />} />
            {mode === "edit" ? (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormInput label="Village / Street" name="village" value={formData.village} onChange={handleChange} />
                  <FormInput label="Post Office" name="post" value={formData.post} onChange={handleChange} />
                  <FormInput label="Taluk" name="taluk" value={formData.taluk} onChange={handleChange} />
                  <FormInput label="District" name="district" value={formData.district} onChange={handleChange} />
                  <FormInput label="PIN Code" name="pin" value={formData.pin} onChange={handleChange} />
                </div>

                <StepHeader title="Communication Channels" icon={<Phone className="text-brand-700" />} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormInput label="WhatsApp / Contact No" name="whatsapp" value={formData.whatsapp} onChange={handleChange} />
                  <FormInput label="Official Email" name="email" value={formData.email} onChange={handleChange} />
                </div>

                <StepHeader title="Language Proficiency" icon={<Languages className="text-brand-700" />} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <SelectBox label="English Fluency" name="englishFluency" value={formData.englishFluency} onChange={handleChange} options={["Fluent", "Intermediate", "Basic"]} />
                  <FormInput label="Language 1" name="language1" value={formData.language1} onChange={handleChange} />
                  <FormInput label="Language 2" name="language2" value={formData.language2} onChange={handleChange} />
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormDisplay label="Village / Street" value={formData.village} />
                  <FormDisplay label="Post Office" value={formData.post} />
                  <FormDisplay label="Taluk" value={formData.taluk} />
                  <FormDisplay label="District" value={formData.district} />
                  <FormDisplay label="PIN Code" value={formData.pin} />
                </div>

                <StepHeader title="Communication Channels" icon={<Phone className="text-brand-700" />} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormDisplay label="WhatsApp / Contact No" value={formData.whatsapp} />
                  <FormDisplay label="Official Email" value={formData.email} />
                </div>

                <StepHeader title="Language Proficiency" icon={<Languages className="text-brand-700" />} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormDisplay label="English Fluency" value={formData.englishFluency} />
                  <FormDisplay label="Language 1" value={formData.language1} />
                  <FormDisplay label="Language 2" value={formData.language2} />
                </div>
              </div>
            )}
          </div>

          {/* STEP 3: FINANCIAL */}
          <div id="section-3" className="bg-white border border-slate-100 rounded-3xl shadow-xl overflow-hidden p-6 md:p-10 scroll-mt-48">
            <StepHeader title="Step 3. Bank Account Information" icon={<CreditCard className="text-brand-700" />} />
            {mode === "edit" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput label="Account Holder Name" name="accountHolderName" value={formData.accountHolderName} onChange={handleChange} />
                <FormInput label="Account Number" name="accountNumber" value={formData.accountNumber} onChange={handleChange} />
                <FormInput label="IFSC Code" name="ifscCode" value={formData.ifscCode} onChange={handleChange} />
                <FormInput label="Bank & Branch Name" name="bankNameBranch" value={formData.bankNameBranch} onChange={handleChange} />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormDisplay label="Account Holder Name" value={formData.accountHolderName} />
                <FormDisplay label="Account Number" value={formData.accountNumber} />
                <FormDisplay label="IFSC Code" value={formData.ifscCode} />
                <FormDisplay label="Bank & Branch Name" value={formData.bankNameBranch} />
              </div>
            )}
          </div>

          {/* STEP 4: ACADEMIC */}
          <div id="section-4" className="bg-white border border-slate-100 rounded-3xl shadow-xl overflow-hidden p-6 md:p-10 scroll-mt-48">
            <StepHeader title="Step 4. Academic History & Marksheets" icon={<GraduationCap className="text-brand-700" />} />
            {mode === "edit" ? (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormInput label="SSLC Reg No" name="sslcRegNo" value={formData.sslcRegNo} onChange={handleChange} />
                  <FormInput label="Year of Passing" name="sslcYear" value={formData.sslcYear} onChange={handleChange} />
                  <FormInput label="School Name" name="sslcSchool" value={formData.sslcSchool} onChange={handleChange} />
                  <FormInput label="Board Name" name="sslcBoard" value={formData.sslcBoard} onChange={handleChange} />
                  <FormInput label="Total Marks" name="sslcTotalMarks" value={formData.sslcTotalMarks} onChange={handleChange} />
                  <FormInput label="Percentage (%)" name="sslcPercentage" value={formData.sslcPercentage} onChange={handleChange} />
                </div>

                <StepHeader title="HSC / PUC Qualification Details" icon={<GraduationCap className="text-brand-700" />} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormInput label="HSC Reg No" name="hscRegNo" value={formData.hscRegNo} onChange={handleChange} />
                  <FormInput label="Year of Passing" name="hscYear" value={formData.hscYear} onChange={handleChange} />
                  <FormInput label="College Name" name="hscSchool" value={formData.hscSchool} onChange={handleChange} />
                  <FormInput label="Board Name" name="hscBoard" value={formData.hscBoard} onChange={handleChange} />
                  <FormInput label="Total Marks" name="hscTotalMarks" value={formData.hscTotalMarks} onChange={handleChange} />
                  <FormInput label="Percentage (%)" name="hscPercentage" value={formData.hscPercentage} onChange={handleChange} />
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormDisplay label="SSLC Reg No" value={formData.sslcRegNo} />
                  <FormDisplay label="Year of Passing" value={formData.sslcYear} />
                  <FormDisplay label="School Name" value={formData.sslcSchool} />
                  <FormDisplay label="Board Name" value={formData.sslcBoard} />
                  <FormDisplay label="Total Marks" value={formData.sslcTotalMarks} />
                  <FormDisplay label="Percentage" value={formData.sslcPercentage ? `${formData.sslcPercentage}%` : "-"} />
                </div>

                <StepHeader title="HSC / PUC Qualification Details" icon={<GraduationCap className="text-brand-700" />} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormDisplay label="HSC Reg No" value={formData.hscRegNo} />
                  <FormDisplay label="Year of Passing" value={formData.hscYear} />
                  <FormDisplay label="College Name" value={formData.hscSchool} />
                  <FormDisplay label="Board Name" value={formData.hscBoard} />
                  <FormDisplay label="Total Marks" value={formData.hscTotalMarks} />
                  <FormDisplay label="Percentage" value={formData.hscPercentage ? `${formData.hscPercentage}%` : "-"} />
                </div>
              </div>
            )}
          </div>

          {/* STEP 5: FAMILY */}
          <div id="section-5" className="bg-white border border-slate-100 rounded-3xl shadow-xl overflow-hidden p-6 md:p-10 scroll-mt-48">
            <StepHeader title="Step 5. Family Background & References" icon={<Users className="text-brand-700" />} />
            <div className="space-y-8">
              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Family Background</h4>
                <div className="space-y-3">
                  {student.familyBackground?.length > 0 ? (
                    student.familyBackground.map((mem, i) => (
                      <div key={i} className="flex justify-between items-center p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{mem.relationship}</p>
                          <p className="font-bold text-slate-900">{mem.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mobile</p>
                          <p className="font-bold text-slate-700">{mem.phone}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs font-bold text-slate-400 italic bg-slate-50 p-4 rounded-xl border border-dashed text-center">No family background records available</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Key References</h4>
                <div className="space-y-3">
                  {student.references?.length > 0 ? (
                    student.references.map((ref, i) => (
                      <div key={i} className="flex justify-between items-center p-4 bg-slate-50 border border-slate-100 rounded-2xl border-dashed">
                        <p className="font-bold text-slate-900">{ref.name}</p>
                        <p className="font-bold text-brand-700">{ref.mobile}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs font-bold text-slate-400 italic bg-slate-50 p-4 rounded-xl border border-dashed text-center">No reference records available</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* STEP 6: FEES STRUCTURE */}
          <div id="section-6" className="bg-white border border-slate-100 rounded-3xl shadow-xl overflow-hidden p-6 md:p-10 scroll-mt-48">
            <StepHeader title="Step 6. Fees Structure & Breakdown" icon={<Wallet className="text-brand-700" />} />
            
            {mode === "edit" ? (
              <div className="space-y-8">
                <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200/80 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormInput
                      label="Council Fees (₹)"
                      type="number"
                      placeholder="e.g. 5000"
                      value={feeForm.councilFee}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFeeForm(prev => ({ ...prev, councilFee: val }));
                        calculateAndApplyScheme(val, feeForm.courseFee, feeForm.selectedScheme);
                      }}
                    />
                    <FormInput
                      label="Course Fees (₹)"
                      type="number"
                      placeholder="e.g. 60000"
                      value={feeForm.courseFee}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFeeForm(prev => ({ ...prev, courseFee: val }));
                        calculateAndApplyScheme(feeForm.councilFee, val, feeForm.selectedScheme);
                      }}
                    />
                    <SelectBox
                      label="Payment Scheme Splitter"
                      value={feeForm.selectedScheme}
                      onChange={(e) => {
                        const sch = e.target.value;
                        setFeeForm(prev => ({ ...prev, selectedScheme: sch }));
                        calculateAndApplyScheme(feeForm.councilFee, feeForm.courseFee, sch);
                      }}
                      isObjectOptions
                      options={[
                        { value: "monthly", label: "Monthly Scheme (Total / 12 Months)" },
                        { value: "sem", label: "Semester Scheme (Total / 6 Semesters)" },
                        { value: "term3", label: "Term Scheme (Total / 3 Terms)" },
                        { value: "term4", label: "Term Scheme (Total / 4 Terms)" },
                      ]}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-700">Fee Installments Breakdown</h4>
                  <button
                    type="button"
                    onClick={() => {
                      setFeeForm(prev => ({
                        ...prev,
                        fees: [
                          ...prev.fees,
                          { feeType: "Other", otherFeeType: "", amount: 0, name: "" }
                        ]
                      }));
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-brand-700 bg-brand-50 px-4 py-2 rounded-xl hover:bg-brand-100 transition-colors"
                  >
                    <Plus size={14} /> Add Custom Fee Row
                  </button>
                </div>

                {feeForm.fees.length > 0 ? (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                        <tr>
                          <th className="p-3">#</th>
                          <th className="p-3">Fee Name / Installment</th>
                          <th className="p-3">Fee Type</th>
                          <th className="p-3 text-right">Amount (₹)</th>
                          <th className="p-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {feeForm.fees.map((fee, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-3 font-semibold text-slate-400">{idx + 1}</td>
                            <td className="p-3">
                              <input
                                type="text"
                                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-brand-700"
                                value={fee.otherFeeType || fee.name || fee.feeType}
                                onChange={(e) => {
                                  const updated = [...feeForm.fees];
                                  updated[idx].otherFeeType = e.target.value;
                                  updated[idx].name = e.target.value;
                                  setFeeForm(prev => ({ ...prev, fees: updated }));
                                }}
                              />
                            </td>
                            <td className="p-3">
                              <select
                                value={fee.feeType}
                                onChange={(e) => {
                                  const updated = [...feeForm.fees];
                                  updated[idx].feeType = e.target.value;
                                  setFeeForm(prev => ({ ...prev, fees: updated }));
                                }}
                                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none"
                              >
                                <option value="Sem">Sem Fee</option>
                                <option value="Term">Term Fee</option>
                                <option value="Monthly">Monthly Fee</option>
                                <option value="Other">Other / Council</option>
                              </select>
                            </td>
                            <td className="p-3 text-right">
                              <input
                                type="number"
                                className="w-32 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-right text-slate-900 outline-none focus:bg-white focus:border-brand-700"
                                value={fee.amount}
                                onChange={(e) => {
                                  const updated = [...feeForm.fees];
                                  updated[idx].amount = e.target.value;
                                  setFeeForm(prev => ({ ...prev, fees: updated }));
                                }}
                              />
                            </td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setFeeForm(prev => ({
                                    ...prev,
                                    fees: prev.fees.filter((_, i) => i !== idx)
                                  }));
                                }}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic p-6 bg-slate-50 rounded-2xl border border-dashed text-center">
                    No fees structured for this student yet.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {feeForm.fees.length > 0 ? (
                  <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-black uppercase tracking-widest">
                        <tr>
                          <th className="p-4">#</th>
                          <th className="p-4">Fee Installment Name</th>
                          <th className="p-4">Category</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {feeForm.fees.map((fee, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-4 font-bold text-slate-400">{idx + 1}</td>
                            <td className="p-4 font-bold text-slate-800">{fee.name || fee.otherFeeType}</td>
                            <td className="p-4 font-bold text-slate-600">{fee.feeType} Fee</td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                fee.status === 'paid' ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}>
                                {fee.status || "pending"}
                              </span>
                            </td>
                            <td className="p-4 font-black text-brand-700 text-right">₹{Number(fee.amount || 0).toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs font-bold text-slate-400 italic bg-slate-50 p-6 rounded-2xl border border-dashed text-center">
                    No fees structured for this student. Click Edit Mode to add fees.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Action Bar at the Bottom of Main Container */}
          <div className="flex justify-end gap-4 p-8 bg-slate-50 border-t border-slate-100 rounded-b-3xl">
            {mode === "edit" ? (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-brand-700 text-white px-10 py-4 rounded-xl font-black text-xs tracking-widest hover:bg-brand-800 transition-all shadow-xl shadow-brand-900/30 disabled:opacity-50"
              >
                <Save size={18} /> {saving ? "Saving Changes..." : "SAVE & SYNC CHANGES"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMode("edit")}
                className="flex items-center gap-2 bg-brand-700 text-white px-10 py-4 rounded-xl font-black text-xs tracking-widest hover:bg-brand-800 transition-all shadow-xl shadow-brand-900/30"
              >
                <Edit2 size={18} /> EDIT STUDENT PROFILE
              </button>
            )}
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;900&display=swap');
        * { font-family: 'Outfit', sans-serif; }
      `}} />
    </div>
  );
};

const StepHeader = ({ title, subtitle, icon }) => (
  <div className="mb-6 animate-fade-in">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-slate-50 border-2 border-slate-100 rounded-xl flex items-center justify-center shadow-inner">
        {icon}
      </div>
      <div>
        <h3 className="text-xl font-black tracking-tight text-slate-900 leading-none mb-1">{title}</h3>
        {subtitle && <p className="text-xs font-bold text-slate-400 tracking-widest">{subtitle}</p>}
      </div>
    </div>
    <div className="h-1 w-16 bg-brand-700 mt-3 rounded-full"></div>
  </div>
);

const FormInput = ({ label, ...props }) => (
  <div className="group space-y-1">
    <label className="text-xs font-black tracking-widest text-slate-700 ml-1 group-focus-within:text-brand-700 transition-colors">{label}</label>
    <input {...props} className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-transparent rounded-lg outline-none transition-all text-xs font-bold text-slate-900 focus:bg-white focus:border-brand-700 focus:shadow-[0_20px_40px_-20px_rgba(185,28,28,0.1)]" />
  </div>
);

const SelectBox = ({ label, options, isObjectOptions, ...props }) => (
  <div className="group space-y-1">
    <label className="text-xs font-black tracking-widest text-slate-700 ml-1 group-focus-within:text-brand-700 transition-colors">{label}</label>
    <select {...props} className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-transparent rounded-lg outline-none transition-all text-xs font-bold text-slate-900 appearance-none cursor-pointer focus:bg-white focus:border-brand-700 disabled:bg-slate-100 disabled:text-slate-500">
      <option value="">Select Option</option>
      {options.map((opt, i) => (
        <option key={i} value={isObjectOptions ? opt.value : opt}>{isObjectOptions ? opt.label : opt}</option>
      ))}
    </select>
  </div>
);

const FormDisplay = ({ label, value }) => (
  <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-2xl">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-xs font-bold text-slate-800 break-words">{value || "-"}</p>
  </div>
);

export default StudentProfilePage;
