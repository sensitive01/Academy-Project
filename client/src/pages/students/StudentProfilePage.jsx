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
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);

  const [formData, setFormData] = useState(() => {
    const clone = JSON.parse(JSON.stringify(student || {}));
    const currentCourse = clone.enrolledCourses?.[0]?.course;
    const currentBatch = clone.enrolledCourses?.[0]?.batch;
    return {
      ...clone,
      email: student?.user?.email || student?.email || "",
      whatsapp: student?.whatsapp || student?.phone || "",
      center: student?.center?._id || student?.center || "",
      course: typeof currentCourse === 'object' ? currentCourse?._id || "" : currentCourse || "",
      batch: typeof currentBatch === 'object' ? currentBatch?._id || "" : currentBatch || "",
      maritalStatus: clone.maritalStatus || "",
      abcId: clone.abcId || "",
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
      bankDetails: clone.bankDetails || {},
      // SSLC fields mapping from sslcDetails or direct
      sslcRegNo: clone.sslcDetails?.registerNo || clone.sslcRegNo || "",
      sslcYear: clone.sslcDetails?.yearOfPassing || clone.sslcYear || "",
      sslcSchool: clone.sslcDetails?.schoolName || clone.sslcSchool || "",
      sslcPlace: clone.sslcDetails?.placeOfSchool || clone.sslcPlace || "",
      sslcBoard: clone.sslcDetails?.boardOfExamination || clone.sslcBoard || "",
      sslcTotalMarks: clone.sslcDetails?.totalMarks || clone.sslcTotalMarks || "",
      sslcSecuredMarks: clone.sslcDetails?.securedMarks || clone.sslcSecuredMarks || "",
      sslcPercentage: clone.sslcDetails?.percentage || clone.sslcPercentage || "",
      // HSC fields mapping from hscDetails or direct
      hscRegNo: clone.hscDetails?.registerNo || clone.hscRegNo || "",
      hscYear: clone.hscDetails?.yearOfPassing || clone.hscYear || "",
      hscSchool: clone.hscDetails?.schoolName || clone.hscSchool || "",
      hscPlace: clone.hscDetails?.placeOfSchool || clone.hscPlace || "",
      hscBoard: clone.hscDetails?.boardOfExamination || clone.hscBoard || "",
      hscTotalMarks: clone.hscDetails?.totalMarks || clone.hscTotalMarks || "",
      hscSecuredMarks: clone.hscDetails?.securedMarks || clone.hscSecuredMarks || "",
      hscPercentage: clone.hscDetails?.percentage || clone.hscPercentage || "",
      // SSLC and HSC subject mark arrays
      sslcSubjects: clone.sslcSubjects && clone.sslcSubjects.length > 0 
        ? clone.sslcSubjects 
        : Array.from({ length: 6 }, () => ({ subject: "", totalMark: "", securedMark: "" })),
      hscSubjects: clone.hscSubjects && clone.hscSubjects.length > 0 
        ? clone.hscSubjects 
        : Array.from({ length: 7 }, () => ({ subject: "", totalMark: "", securedMark: "" })),
      // Languages
      language1: clone.languagesKnown?.[0] || clone.language1 || "",
      language2: clone.languagesKnown?.[1] || clone.language2 || "",
      language3: clone.languagesKnown?.[2] || clone.language3 || "",
      // Arrays
      familyBackground: clone.familyBackground || [],
      references: clone.references || [],
      educationBackground: clone.educationBackground || []
    };
  });

  const [feeForm, setFeeForm] = useState({
    councilFee: student?.councilFee || "",
    courseFee: student?.courseFee || "",
    selectedScheme: student?.paymentScheme || "",
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
    
    // Fetch options for course and batch assignment
    api.get("/courses").then(res => setCourses(res.data)).catch(console.error);
    api.get("/batches").then(res => setBatches(res.data)).catch(console.error);
  }, [student]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "center") {
      setFormData(prev => ({ ...prev, [name]: value, batch: "", course: "" }));
      return;
    }

    if (name === "batch") {
      const selectedBatch = batches.find(b => b._id === value);
      
      let courseIdForBatch = formData.course;
      if (selectedBatch) {
        const batchCourses = selectedBatch.courses?.map(c => c._id || c) || [];
        const legacyCourse = selectedBatch.course?._id || selectedBatch.course;
        if (legacyCourse && !batchCourses.includes(legacyCourse)) {
          batchCourses.push(legacyCourse);
        }
        if (batchCourses.length === 1) {
          courseIdForBatch = batchCourses[0].toString();
        } else if (batchCourses.length > 1 && !batchCourses.includes(courseIdForBatch)) {
          courseIdForBatch = "";
        }
      }

      const centerIdForBatch = selectedBatch && selectedBatch.centers && selectedBatch.centers.length > 0 
        ? (selectedBatch.centers[0]?._id || selectedBatch.centers[0]) 
        : "";
      
      setFormData(prev => ({ 
        ...prev, 
        batch: value, 
        ...(courseIdForBatch && { course: typeof courseIdForBatch === 'object' ? courseIdForBatch.toString() : courseIdForBatch }),
        ...(centerIdForBatch && { center: typeof centerIdForBatch === 'object' ? centerIdForBatch.toString() : centerIdForBatch })
      }));
      return;
    }

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
    // The payment scheme is now only saved for reference, 
    // no automatic fee installments are generated.
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    
    if (Number(feeForm.courseFee) > 0 && !feeForm.selectedScheme) {
      toast.error("Please select a course fee payment scheme!");
      return;
    }

    setSaving(true);
    try {
      // Ensure that Council Fee and Course Fee exist as fee records in the backend
      const cFeeAmt = Number(feeForm.councilFee) || 0;
      const crsFeeAmt = Number(feeForm.courseFee) || 0;
      
      let finalFees = [...feeForm.fees];

      const currentYearMatch = formData.year?.match(/\d+/);
      const currentYear = currentYearMatch ? currentYearMatch[0] : "1";

      if (cFeeAmt > 0) {
        const cIndex = finalFees.findIndex(f => (f.name === `Council Fees - Year ${currentYear}`) || (!f.name?.includes("Year") && (f.name === 'Council Fees' || f.feeType === 'Council' || (f.feeType === 'Other' && f.otherFeeType === 'Council Fees'))));
        if (cIndex >= 0) {
          finalFees[cIndex].amount = cFeeAmt;
          finalFees[cIndex].name = `Council Fees - Year ${currentYear}`;
          finalFees[cIndex].year = currentYear;
        } else {
          finalFees.push({ feeType: 'Other', otherFeeType: 'Council Fees', name: `Council Fees - Year ${currentYear}`, amount: cFeeAmt, year: currentYear });
        }
      }

      if (crsFeeAmt > 0) {
        const expectedName = `Course Fees - Year ${currentYear}`;

        // Try to identify legacy unified course fee to migrate its payment history safely
        const legacyIndex = finalFees.findIndex(f => (f.feeType === 'Course' || f.otherFeeType === 'Course Fees' || f.name === 'Course Fees') && (!f.name || !f.name.includes("Year")));
        
        if (legacyIndex >= 0) {
           finalFees[legacyIndex].name = expectedName;
           finalFees[legacyIndex].year = currentYear;
           finalFees[legacyIndex].amount = crsFeeAmt;
        } else {
          const crsIndex = finalFees.findIndex(f => f.name === expectedName);
          if (crsIndex >= 0) {
            finalFees[crsIndex].amount = crsFeeAmt;
            finalFees[crsIndex].year = currentYear;
          } else {
            finalFees.push({ 
              feeType: 'Course', 
              otherFeeType: 'Course Fees', 
              name: expectedName, 
              amount: crsFeeAmt,
              year: currentYear
            });
          }
        }
      }

      const payload = {
        ...formData,
        councilFee: feeForm.councilFee,
        courseFee: feeForm.courseFee,
        paymentScheme: feeForm.selectedScheme,
        fees: finalFees,
        sslcDetails: {
          registerNo: formData.sslcRegNo || "",
          yearOfPassing: formData.sslcYear || "",
          schoolName: formData.sslcSchool || "",
          placeOfSchool: formData.sslcPlace || "",
          boardOfExamination: formData.sslcBoard || "",
          totalMarks: formData.sslcTotalMarks || "",
          securedMarks: formData.sslcSecuredMarks || "",
          percentage: formData.sslcPercentage || "",
        },
        hscDetails: {
          registerNo: formData.hscRegNo || "",
          yearOfPassing: formData.hscYear || "",
          schoolName: formData.hscSchool || "",
          placeOfSchool: formData.hscPlace || "",
          boardOfExamination: formData.hscBoard || "",
          totalMarks: formData.hscTotalMarks || "",
          securedMarks: formData.hscSecuredMarks || "",
          percentage: formData.hscPercentage || "",
        },
        sslcSubjects: (formData.sslcSubjects || []).map(s => ({
          subject: s.subject || "",
          totalMark: Number(s.totalMark) || 0,
          securedMark: Number(s.securedMark) || 0
        })),
        hscSubjects: (formData.hscSubjects || []).map(s => ({
          subject: s.subject || "",
          totalMark: Number(s.totalMark) || 0,
          securedMark: Number(s.securedMark) || 0
        })),
        languagesKnown: [formData.language1, formData.language2, formData.language3].map(l => (l || "").trim()).filter(Boolean),
      };
      
      // Update enrolledCourses based on selected course and batch
      if (payload.course || payload.batch) {
        payload.enrolledCourses = [{
          ...((payload.enrolledCourses && payload.enrolledCourses[0]) || {}),
          course: payload.course || undefined,
          batch: payload.batch || undefined,
          completed: false,
          progress: 0
        }];
      }

      await onUpdate(payload);
      setMode("view");
      if (onBack) onBack();
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
                  <FormInput label="Student ID" name="studentId" value={formData.studentId} onChange={handleChange} />
                  <div className="grid grid-cols-2 gap-6">
                    <FormInput label="Date of Birth" type="date" name="dob" value={formData.dob ? formData.dob.split("T")[0] : ""} onChange={handleChange} />
                    <FormInput label="Age" name="age" value={formData.age} onChange={handleChange} />
                  </div>
                  <FormInput label="Father Name" name="fatherName" value={formData.fatherName} onChange={handleChange} />
                  <SelectBox label="Gender" name="gender" value={formData.gender} onChange={handleChange} options={["Male", "Female", "Other"]} />
                  <div className="grid grid-cols-2 gap-6">
                    <FormInput label="Nationality" name="nationality" value={formData.nationality} onChange={handleChange} />
                    <SelectBox label="Year" name="year" value={formData.year} onChange={handleChange} options={["1st Year", "2nd Year", "3rd Year", "4th Year"]} />
                  </div>
                </div>

                <StepHeader title="National & Academic IDs" icon={<ShieldCheck className="text-brand-700" />} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormInput label="Aadhar No" name="aadharNo" value={formData.aadharNo} onChange={handleChange} />
                  <FormInput label="KCET Reg No" name="kcetRegNo" value={formData.kcetRegNo} onChange={handleChange} />
                  <FormInput label="NEET Reg No" name="neetRegNo" value={formData.neetRegNo} onChange={handleChange} />
                  <FormInput label="APAAR ID" name="apaarId" value={formData.apaarId} onChange={handleChange} />
                  <FormInput label="DEB ID" name="debId" value={formData.debId} onChange={handleChange} />
                  <FormInput label="ABC ID" name="abcId" value={formData.abcId} onChange={handleChange} />
                </div>

                <StepHeader title="Demographics & Center" icon={<Globe className="text-brand-700" />} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormInput label="Religion" name="religion" value={formData.religion} onChange={handleChange} />
                  <FormInput label="Community" name="community" value={formData.community} onChange={handleChange} />
                  <SelectBox label="Marital Status" name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} options={["Married", "Unmarried"]} />
                  <SelectBox label="Academic Center" name="center" value={formData.center} onChange={handleChange} isObjectOptions options={centers.map(c => ({ value: c._id, label: `${c.name} - ${c.location}` }))} />
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormDisplay label="Name of Student (English)" value={formData.studentNameEnglish || student.user?.name} />
                  <FormDisplay label="Name of Student (Mother Tongue)" value={formData.studentNameMotherTongue} />
                  <FormDisplay label="Student ID" value={formData.studentId} />
                  <FormDisplay label="Date of Birth" value={formData.dob ? new Date(formData.dob).toLocaleDateString() : "-"} />
                  <FormDisplay label="Age" value={formData.age} />
                  <FormDisplay label="Father Name" value={formData.fatherName} />
                  <FormDisplay label="Gender" value={formData.gender} />
                  <FormDisplay label="Nationality" value={formData.nationality} />
                  <FormDisplay label="Year" value={formData.year} />
                </div>

                <StepHeader title="National & Academic IDs" icon={<ShieldCheck className="text-brand-700" />} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormDisplay label="Aadhar No" value={formData.aadharNo} />
                  <FormDisplay label="KCET Reg No" value={formData.kcetRegNo} />
                  <FormDisplay label="NEET Reg No" value={formData.neetRegNo} />
                  <FormDisplay label="APAAR ID" value={formData.apaarId} />
                  <FormDisplay label="DEB ID" value={formData.debId} />
                  <FormDisplay label="ABC ID" value={formData.abcId} />
                </div>

                <StepHeader title="Demographics & Center" icon={<Globe className="text-brand-700" />} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormDisplay label="Religion" value={formData.religion} />
                  <FormDisplay label="Community" value={formData.community} />
                  <FormDisplay label="Marital Status" value={formData.maritalStatus} />
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  <SelectBox label="English Fluency" name="englishFluency" value={formData.englishFluency} onChange={handleChange} options={["Fluent", "Intermediate", "Basic"]} />
                  <FormInput label="Language 1" name="language1" value={formData.language1} onChange={handleChange} />
                  <FormInput label="Language 2" name="language2" value={formData.language2} onChange={handleChange} />
                  <FormInput label="Language 3" name="language3" value={formData.language3} onChange={handleChange} />
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <FormDisplay label="English Fluency" value={formData.englishFluency} />
                  <FormDisplay label="Language 1" value={formData.language1} />
                  <FormDisplay label="Language 2" value={formData.language2} />
                  <FormDisplay label="Language 3" value={formData.language3} />
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
                {/* SSLC SECTION */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">SSLC Details</h3>
                    <div className="h-1 w-12 bg-brand-700 mt-1.5 rounded-full"></div>
                  </div>

                  {/* DETAILS ABOVE TABLE */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/60 p-6 rounded-2xl border border-slate-200/80">
                    <FormInput label="Register No" name="sslcRegNo" value={formData.sslcRegNo} onChange={handleChange} />
                    <FormInput label="Year of Passing" name="sslcYear" value={formData.sslcYear} onChange={handleChange} />
                    <FormInput label="School / Institution" name="sslcSchool" value={formData.sslcSchool} onChange={handleChange} />
                    <FormInput label="Place of school" name="sslcPlace" value={formData.sslcPlace} onChange={handleChange} />
                    <FormInput label="Board of Examination" name="sslcBoard" value={formData.sslcBoard} onChange={handleChange} />
                  </div>

                  {/* SSLC SUBJECT MARKS TABLE */}
                  <div className="overflow-hidden border border-slate-200 rounded-2xl">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                        <tr>
                          <th className="p-3 text-center w-12 font-bold">S.No</th>
                          <th className="p-3 text-left font-bold">Subject</th>
                          <th className="p-3 text-center font-bold w-28">Total</th>
                          <th className="p-3 text-center font-bold w-28">Secured</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {[0, 1, 2, 3, 4, 5].map((idx) => {
                          const item = (formData.sslcSubjects && formData.sslcSubjects[idx]) || {};
                          return (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="text-center font-semibold text-slate-400 p-2">{idx + 1}</td>
                              <td className="p-2">
                                <input
                                  value={item.subject || ""}
                                  placeholder="Subject"
                                  onChange={(e) => {
                                    const updated = [...(formData.sslcSubjects || [])];
                                    while (updated.length <= idx) updated.push({ subject: "", totalMark: "", securedMark: "" });
                                    updated[idx] = { ...updated[idx], subject: e.target.value };
                                    setFormData(prev => ({ ...prev, sslcSubjects: updated }));
                                  }}
                                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-brand-600"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  value={item.totalMark !== undefined && item.totalMark !== null ? item.totalMark : ""}
                                  onChange={(e) => {
                                    const updated = [...(formData.sslcSubjects || [])];
                                    while (updated.length <= idx) updated.push({ subject: "", totalMark: "", securedMark: "" });
                                    updated[idx] = { ...updated[idx], totalMark: e.target.value };
                                    const total = updated.reduce((sum, s) => sum + (Number(s.totalMark) || 0), 0);
                                    const secured = updated.reduce((sum, s) => sum + (Number(s.securedMark) || 0), 0);
                                    const pct = total > 0 ? ((secured / total) * 100).toFixed(2) : "";
                                    setFormData(prev => ({ ...prev, sslcSubjects: updated, sslcTotalMarks: total || prev.sslcTotalMarks, sslcPercentage: pct || prev.sslcPercentage }));
                                  }}
                                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none text-center focus:border-brand-600"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  value={item.securedMark !== undefined && item.securedMark !== null ? item.securedMark : ""}
                                  onChange={(e) => {
                                    const updated = [...(formData.sslcSubjects || [])];
                                    while (updated.length <= idx) updated.push({ subject: "", totalMark: "", securedMark: "" });
                                    updated[idx] = { ...updated[idx], securedMark: e.target.value };
                                    const total = updated.reduce((sum, s) => sum + (Number(s.totalMark) || 0), 0);
                                    const secured = updated.reduce((sum, s) => sum + (Number(s.securedMark) || 0), 0);
                                    const pct = total > 0 ? ((secured / total) * 100).toFixed(2) : "";
                                    setFormData(prev => ({ ...prev, sslcSubjects: updated, sslcTotalMarks: total || prev.sslcTotalMarks, sslcPercentage: pct || prev.sslcPercentage }));
                                  }}
                                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none text-center focus:border-brand-600"
                                />
                              </td>
                            </tr>
                          );
                        })}

                        {/* TOTAL ROW */}
                        <tr className="bg-slate-50 font-semibold">
                          <td colSpan="2" className="p-3 text-right">Total</td>
                          <td className="p-2">
                            <input
                              type="number"
                              name="sslcTotalMarks"
                              value={formData.sslcTotalMarks || ""}
                              onChange={handleChange}
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center outline-none focus:border-brand-600"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              name="sslcSecuredMarks"
                              value={formData.sslcSecuredMarks || (formData.sslcSubjects ? formData.sslcSubjects.reduce((sum, s) => sum + (Number(s.securedMark) || 0), 0) || "" : "")}
                              onChange={handleChange}
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center outline-none focus:border-brand-600"
                            />
                          </td>
                        </tr>

                        {/* PERCENTAGE ROW */}
                        <tr className="bg-white">
                          <td colSpan="3" className="p-3 text-right text-slate-500 font-medium">Percentage (%)</td>
                          <td className="p-2">
                            <input
                              name="sslcPercentage"
                              value={formData.sslcPercentage || ""}
                              onChange={handleChange}
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-center outline-none focus:border-brand-600"
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* HSC / PU SECTION */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">HSC / PU Details</h3>
                    <div className="h-1 w-12 bg-brand-700 mt-1.5 rounded-full"></div>
                  </div>

                  {/* DETAILS ABOVE TABLE */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/60 p-6 rounded-2xl border border-slate-200/80">
                    <FormInput label="Register No" name="hscRegNo" value={formData.hscRegNo} onChange={handleChange} />
                    <FormInput label="Year of Passing" name="hscYear" value={formData.hscYear} onChange={handleChange} />
                    <FormInput label="School / Institution" name="hscSchool" value={formData.hscSchool} onChange={handleChange} />
                    <FormInput label="Place of school" name="hscPlace" value={formData.hscPlace} onChange={handleChange} />
                    <FormInput label="Board of Examination" name="hscBoard" value={formData.hscBoard} onChange={handleChange} />
                  </div>

                  {/* HSC SUBJECT MARKS TABLE */}
                  <div className="overflow-hidden border border-slate-200 rounded-2xl">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                        <tr>
                          <th className="p-3 text-center w-12 font-bold">S.No</th>
                          <th className="p-3 text-left font-bold">Subject</th>
                          <th className="p-3 text-center font-bold w-28">Total</th>
                          <th className="p-3 text-center font-bold w-28">Secured</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {[0, 1, 2, 3, 4, 5, 6].map((idx) => {
                          const item = (formData.hscSubjects && formData.hscSubjects[idx]) || {};
                          return (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="text-center font-semibold text-slate-400 p-2">{idx + 1}</td>
                              <td className="p-2">
                                <input
                                  value={item.subject || ""}
                                  placeholder="Subject"
                                  onChange={(e) => {
                                    const updated = [...(formData.hscSubjects || [])];
                                    while (updated.length <= idx) updated.push({ subject: "", totalMark: "", securedMark: "" });
                                    updated[idx] = { ...updated[idx], subject: e.target.value };
                                    setFormData(prev => ({ ...prev, hscSubjects: updated }));
                                  }}
                                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-brand-600"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  value={item.totalMark !== undefined && item.totalMark !== null ? item.totalMark : ""}
                                  onChange={(e) => {
                                    const updated = [...(formData.hscSubjects || [])];
                                    while (updated.length <= idx) updated.push({ subject: "", totalMark: "", securedMark: "" });
                                    updated[idx] = { ...updated[idx], totalMark: e.target.value };
                                    const total = updated.reduce((sum, s) => sum + (Number(s.totalMark) || 0), 0);
                                    const secured = updated.reduce((sum, s) => sum + (Number(s.securedMark) || 0), 0);
                                    const pct = total > 0 ? ((secured / total) * 100).toFixed(2) : "";
                                    setFormData(prev => ({ ...prev, hscSubjects: updated, hscTotalMarks: total || prev.hscTotalMarks, hscPercentage: pct || prev.hscPercentage }));
                                  }}
                                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none text-center focus:border-brand-600"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  value={item.securedMark !== undefined && item.securedMark !== null ? item.securedMark : ""}
                                  onChange={(e) => {
                                    const updated = [...(formData.hscSubjects || [])];
                                    while (updated.length <= idx) updated.push({ subject: "", totalMark: "", securedMark: "" });
                                    updated[idx] = { ...updated[idx], securedMark: e.target.value };
                                    const total = updated.reduce((sum, s) => sum + (Number(s.totalMark) || 0), 0);
                                    const secured = updated.reduce((sum, s) => sum + (Number(s.securedMark) || 0), 0);
                                    const pct = total > 0 ? ((secured / total) * 100).toFixed(2) : "";
                                    setFormData(prev => ({ ...prev, hscSubjects: updated, hscTotalMarks: total || prev.hscTotalMarks, hscPercentage: pct || prev.hscPercentage }));
                                  }}
                                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none text-center focus:border-brand-600"
                                />
                              </td>
                            </tr>
                          );
                        })}

                        {/* TOTAL ROW */}
                        <tr className="bg-slate-50 font-semibold">
                          <td colSpan="2" className="p-3 text-right">Total</td>
                          <td className="p-2">
                            <input
                              type="number"
                              name="hscTotalMarks"
                              value={formData.hscTotalMarks || ""}
                              onChange={handleChange}
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center outline-none focus:border-brand-600"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              name="hscSecuredMarks"
                              value={formData.hscSecuredMarks || (formData.hscSubjects ? formData.hscSubjects.reduce((sum, s) => sum + (Number(s.securedMark) || 0), 0) || "" : "")}
                              onChange={handleChange}
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center outline-none focus:border-brand-600"
                            />
                          </td>
                        </tr>

                        {/* PERCENTAGE ROW */}
                        <tr className="bg-white">
                          <td colSpan="3" className="p-3 text-right text-slate-500 font-medium">Percentage (%)</td>
                          <td className="p-2">
                            <input
                              name="hscPercentage"
                              value={formData.hscPercentage || ""}
                              onChange={handleChange}
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-center outline-none focus:border-brand-600"
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <StepHeader title="Other Educational History" icon={<GraduationCap className="text-brand-700" />} />
                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold">
                      <tr>
                        <th className="p-3 text-left">Exam Passed</th>
                        <th className="p-3 text-left">Institute / School</th>
                        <th className="p-3 text-left">Group</th>
                        <th className="p-3 text-left">Year</th>
                        <th className="p-3 text-left">Mark %</th>
                        <th className="p-3 text-left">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[0, 1, 2].map(idx => {
                        const item = (formData.educationBackground && formData.educationBackground[idx]) || {};
                        return (
                          <tr key={idx} className="bg-white">
                            <td className="p-2">
                              <input
                                value={item.examinationPassed || ""}
                                placeholder="Exam..."
                                onChange={(e) => {
                                  const updated = [...(formData.educationBackground || [])];
                                  while (updated.length <= idx) updated.push({});
                                  updated[idx] = { ...updated[idx], examinationPassed: e.target.value };
                                  setFormData(prev => ({ ...prev, educationBackground: updated }));
                                }}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:border-brand-700 shadow-sm"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                value={item.instituteName || ""}
                                placeholder="Institute..."
                                onChange={(e) => {
                                  const updated = [...(formData.educationBackground || [])];
                                  while (updated.length <= idx) updated.push({});
                                  updated[idx] = { ...updated[idx], instituteName: e.target.value };
                                  setFormData(prev => ({ ...prev, educationBackground: updated }));
                                }}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:border-brand-700 shadow-sm"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                value={item.group || ""}
                                placeholder="Group..."
                                onChange={(e) => {
                                  const updated = [...(formData.educationBackground || [])];
                                  while (updated.length <= idx) updated.push({});
                                  updated[idx] = { ...updated[idx], group: e.target.value };
                                  setFormData(prev => ({ ...prev, educationBackground: updated }));
                                }}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:border-brand-700 shadow-sm"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                value={item.yearOfPassing || ""}
                                placeholder="Year..."
                                onChange={(e) => {
                                  const updated = [...(formData.educationBackground || [])];
                                  while (updated.length <= idx) updated.push({});
                                  updated[idx] = { ...updated[idx], yearOfPassing: e.target.value };
                                  setFormData(prev => ({ ...prev, educationBackground: updated }));
                                }}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:border-brand-700 shadow-sm"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                value={item.marksPercentage || ""}
                                placeholder="%"
                                onChange={(e) => {
                                  const updated = [...(formData.educationBackground || [])];
                                  while (updated.length <= idx) updated.push({});
                                  updated[idx] = { ...updated[idx], marksPercentage: e.target.value };
                                  setFormData(prev => ({ ...prev, educationBackground: updated }));
                                }}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:border-brand-700 shadow-sm"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                value={item.remarks || ""}
                                placeholder="Remarks..."
                                onChange={(e) => {
                                  const updated = [...(formData.educationBackground || [])];
                                  while (updated.length <= idx) updated.push({});
                                  updated[idx] = { ...updated[idx], remarks: e.target.value };
                                  setFormData(prev => ({ ...prev, educationBackground: updated }));
                                }}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:border-brand-700 shadow-sm"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* SSLC SECTION IN VIEW MODE */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">SSLC Details</h3>
                    <div className="h-1 w-12 bg-brand-700 mt-1.5 rounded-full"></div>
                  </div>

                  {/* DETAILS ABOVE TABLE */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/60 p-6 rounded-2xl border border-slate-200/80">
                    <FormDisplay label="Register No" value={formData.sslcRegNo} />
                    <FormDisplay label="Year of Passing" value={formData.sslcYear} />
                    <FormDisplay label="School / Institution" value={formData.sslcSchool} />
                    <FormDisplay label="Place of school" value={formData.sslcPlace} />
                    <FormDisplay label="Board of Examination" value={formData.sslcBoard} />
                  </div>

                  {/* SSLC SUBJECT MARKS TABLE */}
                  <div className="overflow-hidden border border-slate-200 rounded-2xl">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                        <tr>
                          <th className="p-3 text-center w-12">S.No</th>
                          <th className="p-3 text-left">Subject</th>
                          <th className="p-3 text-center w-28">Total</th>
                          <th className="p-3 text-center w-28">Secured</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {formData.sslcSubjects && formData.sslcSubjects.some(s => s.subject || s.securedMark) ? (
                          formData.sslcSubjects.filter(s => s.subject || s.securedMark).map((s, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="text-center font-semibold text-slate-400 p-2.5">{idx + 1}</td>
                              <td className="p-2.5 font-medium text-slate-800">{s.subject || "-"}</td>
                              <td className="p-2.5 text-center text-slate-600 font-mono">{s.totalMark ?? "-"}</td>
                              <td className="p-2.5 text-center font-bold text-brand-700 font-mono">{s.securedMark ?? "-"}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="p-4 text-center text-slate-400 font-medium">No subject marks recorded</td>
                          </tr>
                        )}
                        {(formData.sslcTotalMarks || formData.sslcPercentage || formData.sslcSecuredMarks) && (
                          <>
                            <tr className="bg-slate-50 font-bold text-slate-800">
                              <td colSpan="2" className="p-3 text-right">Total</td>
                              <td className="p-3 text-center font-mono">{formData.sslcTotalMarks || "-"}</td>
                              <td className="p-3 text-center font-mono text-brand-700">
                                {formData.sslcSecuredMarks || (formData.sslcSubjects ? formData.sslcSubjects.reduce((sum, s) => sum + (Number(s.securedMark) || 0), 0) || "-" : "-")}
                              </td>
                            </tr>
                            <tr className="bg-white font-semibold">
                              <td colSpan="3" className="p-3 text-right text-slate-500">Percentage (%)</td>
                              <td className="p-3 text-center text-brand-700 font-bold font-mono">
                                {formData.sslcPercentage ? `${formData.sslcPercentage}%` : "-"}
                              </td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* HSC / PU SECTION IN VIEW MODE */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">HSC / PU Details</h3>
                    <div className="h-1 w-12 bg-brand-700 mt-1.5 rounded-full"></div>
                  </div>

                  {/* DETAILS ABOVE TABLE */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/60 p-6 rounded-2xl border border-slate-200/80">
                    <FormDisplay label="Register No" value={formData.hscRegNo} />
                    <FormDisplay label="Year of Passing" value={formData.hscYear} />
                    <FormDisplay label="School / Institution" value={formData.hscSchool} />
                    <FormDisplay label="Place of school" value={formData.hscPlace} />
                    <FormDisplay label="Board of Examination" value={formData.hscBoard} />
                  </div>

                  {/* HSC SUBJECT MARKS TABLE */}
                  <div className="overflow-hidden border border-slate-200 rounded-2xl">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                        <tr>
                          <th className="p-3 text-center w-12">S.No</th>
                          <th className="p-3 text-left">Subject</th>
                          <th className="p-3 text-center w-28">Total</th>
                          <th className="p-3 text-center w-28">Secured</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {formData.hscSubjects && formData.hscSubjects.some(s => s.subject || s.securedMark) ? (
                          formData.hscSubjects.filter(s => s.subject || s.securedMark).map((s, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="text-center font-semibold text-slate-400 p-2.5">{idx + 1}</td>
                              <td className="p-2.5 font-medium text-slate-800">{s.subject || "-"}</td>
                              <td className="p-2.5 text-center text-slate-600 font-mono">{s.totalMark ?? "-"}</td>
                              <td className="p-2.5 text-center font-bold text-brand-700 font-mono">{s.securedMark ?? "-"}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="p-4 text-center text-slate-400 font-medium">No subject marks recorded</td>
                          </tr>
                        )}
                        {(formData.hscTotalMarks || formData.hscPercentage || formData.hscSecuredMarks) && (
                          <>
                            <tr className="bg-slate-50 font-bold text-slate-800">
                              <td colSpan="2" className="p-3 text-right">Total</td>
                              <td className="p-3 text-center font-mono">{formData.hscTotalMarks || "-"}</td>
                              <td className="p-3 text-center font-mono text-brand-700">
                                {formData.hscSecuredMarks || (formData.hscSubjects ? formData.hscSubjects.reduce((sum, s) => sum + (Number(s.securedMark) || 0), 0) || "-" : "-")}
                              </td>
                            </tr>
                            <tr className="bg-white font-semibold">
                              <td colSpan="3" className="p-3 text-right text-slate-500">Percentage (%)</td>
                              <td className="p-3 text-center text-brand-700 font-bold font-mono">
                                {formData.hscPercentage ? `${formData.hscPercentage}%` : "-"}
                              </td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {formData.educationBackground && formData.educationBackground.some(e => e.examinationPassed || e.instituteName) && (
                  <>
                    <StepHeader title="Other Educational History" icon={<GraduationCap className="text-brand-700" />} />
                    <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-100 text-slate-700 font-bold">
                          <tr>
                            <th className="p-3 text-left">Exam Passed</th>
                            <th className="p-3 text-left">Institute / School</th>
                            <th className="p-3 text-left">Group</th>
                            <th className="p-3 text-left">Year</th>
                            <th className="p-3 text-left">Mark %</th>
                            <th className="p-3 text-left">Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {formData.educationBackground.filter(e => e.examinationPassed || e.instituteName).map((item, idx) => (
                            <tr key={idx} className="bg-white">
                              <td className="p-3 font-semibold text-slate-800">{item.examinationPassed || "-"}</td>
                              <td className="p-3 text-slate-700">{item.instituteName || "-"}</td>
                              <td className="p-3 text-slate-700">{item.group || "-"}</td>
                              <td className="p-3 text-slate-700">{item.yearOfPassing || "-"}</td>
                              <td className="p-3 text-slate-700">{item.marksPercentage ? `${item.marksPercentage}%` : "-"}</td>
                              <td className="p-3 text-slate-500">{item.remarks || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
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
                  {mode === "edit" ? (
                    ["Father", "Mother", "Brother / Sister", "Brother / Sister", "Brother / Sister"].map((defaultRel, i) => {
                      const current = (formData.familyBackground && formData.familyBackground[i]) || { relationship: defaultRel, name: "", phone: "", occupation: "" };
                      return (
                        <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                          <FormInput
                            label={`Relationship`}
                            value={current.relationship || defaultRel}
                            onChange={(e) => {
                              const updated = [...(formData.familyBackground || [])];
                              while (updated.length <= i) updated.push({ relationship: "", name: "", phone: "" });
                              updated[i] = { ...updated[i], relationship: e.target.value };
                              setFormData(prev => ({ ...prev, familyBackground: updated }));
                            }}
                          />
                          <FormInput
                            label="Full Name"
                            value={current.name || ""}
                            onChange={(e) => {
                              const updated = [...(formData.familyBackground || [])];
                              while (updated.length <= i) updated.push({ relationship: defaultRel, name: "", phone: "" });
                              updated[i] = { ...updated[i], name: e.target.value };
                              setFormData(prev => ({ ...prev, familyBackground: updated }));
                            }}
                          />
                          <FormInput
                            label="Mobile Number"
                            value={current.phone || ""}
                            onChange={(e) => {
                              const updated = [...(formData.familyBackground || [])];
                              while (updated.length <= i) updated.push({ relationship: defaultRel, name: "", phone: "" });
                              updated[i] = { ...updated[i], phone: e.target.value };
                              setFormData(prev => ({ ...prev, familyBackground: updated }));
                            }}
                          />
                        </div>
                      );
                    })
                  ) : (
                    formData.familyBackground?.length > 0 ? (
                      formData.familyBackground.map((mem, i) => (
                        <div key={i} className="flex justify-between items-center p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{mem.relationship}</p>
                            <p className="font-bold text-slate-900">{mem.name || "-"}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mobile</p>
                            <p className="font-bold text-slate-700">{mem.phone || "-"}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs font-bold text-slate-400 italic bg-slate-50 p-4 rounded-xl border border-dashed text-center">No family background records available</p>
                    )
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Key References</h4>
                <div className="space-y-3">
                  {mode === "edit" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[1, 2, 3, 4, 5].map((num, i) => {
                        const current = (formData.references && formData.references[i]) || { name: "", mobile: "" };
                        return (
                          <div key={i} className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
                            <span className="text-[11px] font-black text-brand-700 uppercase tracking-wider">Reference {num}</span>
                            <div className="grid grid-cols-2 gap-3">
                              <FormInput
                                label="Name"
                                value={current.name || ""}
                                onChange={(e) => {
                                  const updated = [...(formData.references || [])];
                                  while (updated.length <= i) updated.push({ name: "", mobile: "" });
                                  updated[i] = { ...updated[i], name: e.target.value };
                                  setFormData(prev => ({ ...prev, references: updated }));
                                }}
                              />
                              <FormInput
                                label="Mobile"
                                value={current.mobile || ""}
                                onChange={(e) => {
                                  const updated = [...(formData.references || [])];
                                  while (updated.length <= i) updated.push({ name: "", mobile: "" });
                                  updated[i] = { ...updated[i], mobile: e.target.value };
                                  setFormData(prev => ({ ...prev, references: updated }));
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    formData.references?.length > 0 ? (
                      formData.references.map((ref, i) => (
                        <div key={i} className="flex justify-between items-center p-4 bg-slate-50 border border-slate-100 rounded-2xl border-dashed">
                          <p className="font-bold text-slate-900">{ref.name || "-"}</p>
                          <p className="font-bold text-brand-700">{ref.mobile || "-"}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs font-bold text-slate-400 italic bg-slate-50 p-4 rounded-xl border border-dashed text-center">No reference records available</p>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* STEP 6: FEES STRUCTURE & ENROLLMENT */}
          <div id="section-6" className="bg-white border border-slate-100 rounded-3xl shadow-xl overflow-hidden p-6 md:p-10 scroll-mt-48">
            <StepHeader title="Step 6. Course, Batch & Fees" icon={<Wallet className="text-brand-700" />} />
            
            {mode === "edit" ? (
              <div className="space-y-8">
                <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200/80 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 pb-6 border-b border-slate-200/80">
                    <SelectBox
                      label="Assigned Batch"
                      name="batch"
                      value={formData.batch}
                      onChange={handleChange}
                      isObjectOptions
                      options={(() => {
                        const filtered = batches.filter(b => {
                          let matchesCenter = true;
                          if (formData.center) {
                            const studentCenterId = formData.center.toString();
                            const bCenterIds = b.centers?.map(c => c._id ? c._id.toString() : c.toString()) || [];
                            const bCenterId = b.center?._id ? b.center._id.toString() : b.center?.toString();
                            matchesCenter = bCenterIds.includes(studentCenterId) || (bCenterId === studentCenterId);
                          }
                          return matchesCenter || (b._id && formData.batch && b._id.toString() === formData.batch.toString());
                        });
                        
                        if (filtered.length === 0) {
                          return [{ value: "", label: "no batch available for these center" }];
                        }
                        
                        return filtered.map(b => ({ value: b._id, label: b.name }));
                      })()}
                    />

                    <SelectBox
                      label="Enrolled Course"
                      name="course"
                      value={formData.course}
                      onChange={handleChange}
                      isObjectOptions
                      options={(() => {
                        if (!formData.batch) return [{ value: "", label: "Select a batch first" }];
                        const selectedBatch = batches.find(b => b._id === formData.batch);
                        if (!selectedBatch) return [{ value: "", label: "Batch not found" }];
                        
                        const batchCourseIds = [];
                        if (selectedBatch.courses) {
                          selectedBatch.courses.forEach(c => batchCourseIds.push((c._id || c).toString()));
                        }
                        if (selectedBatch.course) {
                          batchCourseIds.push((selectedBatch.course._id || selectedBatch.course).toString());
                        }
                        
                        const uniqueCourseIds = [...new Set(batchCourseIds)];
                        const availableCourses = courses.filter(c => 
                          uniqueCourseIds.includes(c._id.toString()) || c._id.toString() === formData.course?.toString()
                        );
                        
                        if (availableCourses.length === 0) return [{ value: "", label: "No courses assigned to batch" }];
                        
                        const opts = availableCourses.map(c => ({ value: c._id, label: c.title }));
                        if (opts.length > 1 && !formData.course) {
                          opts.unshift({ value: "", label: "Select a course..." });
                        }
                        return opts;
                      })()}
                    />
                  </div>

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
                        { value: "sem", label: "Semester Scheme (Total / 2 Semesters)" },
                        { value: "term3", label: "Term Scheme (Total / 3 Terms)" },
                        { value: "term4", label: "Term Scheme (Total / 4 Terms)" },
                      ]}
                    />
                  </div>
                </div>


              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pb-6 border-b border-slate-100">
                  <FormDisplay 
                    label="Enrolled Course" 
                    value={
                      courses.find(c => c._id === formData.course)?.title || 
                      student.enrolledCourses?.[0]?.course?.title || 
                      "Not Assigned"
                    } 
                  />
                  <FormDisplay 
                    label="Assigned Batch" 
                    value={
                      batches.find(b => b._id === formData.batch)?.name || 
                      student.enrolledCourses?.[0]?.batch?.name || 
                      "Not Assigned"
                    } 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 pb-6 border-b border-slate-100">
                  <FormDisplay 
                    label="Council Fees (₹)" 
                    value={formData.councilFee || "0"} 
                  />
                  <FormDisplay 
                    label="Course Fees (₹)" 
                    value={formData.courseFee || "0"} 
                  />
                  <FormDisplay 
                    label="Payment Scheme" 
                    value={
                      formData.paymentScheme === "monthly" ? "Monthly Scheme" :
                      formData.paymentScheme === "sem" ? "Semester Scheme" :
                      formData.paymentScheme === "term3" ? "Term Scheme (3 Terms)" :
                      formData.paymentScheme === "term4" ? "Term Scheme (4 Terms)" :
                      formData.paymentScheme || "Not Selected"
                    } 
                  />
                </div>


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

const FormInput = ({ label, className = "", ...props }) => (
  <div className="group space-y-1">
    {label && <label className="text-xs font-black tracking-widest text-slate-700 ml-1 group-focus-within:text-brand-700 transition-colors">{label}</label>}
    <input
      {...props}
      className={`w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl outline-none transition-all text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-brand-700 focus:ring-2 focus:ring-brand-700/10 shadow-sm ${className}`}
    />
  </div>
);

const SelectBox = ({ label, options, isObjectOptions, className = "", ...props }) => (
  <div className="group space-y-1">
    {label && <label className="text-xs font-black tracking-widest text-slate-700 ml-1 group-focus-within:text-brand-700 transition-colors">{label}</label>}
    <select
      {...props}
      className={`w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl outline-none transition-all text-xs font-bold text-slate-900 appearance-none cursor-pointer focus:bg-white focus:border-brand-700 focus:ring-2 focus:ring-brand-700/10 shadow-sm disabled:bg-slate-100 disabled:text-slate-500 ${className}`}
    >
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
