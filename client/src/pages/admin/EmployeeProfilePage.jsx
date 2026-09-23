import React, { useState } from "react";
import { ArrowLeft, Briefcase, DollarSign, FileText, User, Plus, X, ShieldCheck, AlertCircle, ChevronRight, CheckCircle, Landmark, Clock, MapPin, QrCode, ScanFace, Smartphone, Fingerprint, MinusCircle, PlusCircle, ChevronDown, Check, Calendar, Trash2, AlertTriangle } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

const CalculationDropdown = ({ selected, onChange, options }) => {
    const [open, setOpen] = React.useState(false);
    const ref = React.useRef(null);
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (ref.current && !ref.current.contains(event.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedArr = selected && selected !== 'None' ? selected.split(',').filter(Boolean) : [];
    
    const toggle = (val) => {
        if (val === 'None') {
            onChange('None');
            setOpen(false);
            return;
        }
        let newArr = [...selectedArr];
        if (newArr.includes(val)) newArr = newArr.filter(v => v !== val);
        else newArr.push(val);
        onChange(newArr.length ? newArr.join(',') : 'None');
    };

    return (
        <div className="relative w-48" ref={ref}>
            <div 
                className="px-3 py-1.5 border border-slate-200 rounded-md text-sm bg-white cursor-pointer flex justify-between items-center h-[34px]"
                onClick={() => setOpen(!open)}
            >
                <span className="truncate">{selectedArr.length > 0 ? selectedArr.join(', ') : 'None'}</span>
                <ChevronDown size={14} className="text-slate-400 shrink-0 ml-2 transition-transform duration-200" style={{ transform: open ? 'rotate(180deg)' : 'none' }} />
            </div>
            {open && (
                <div className="absolute z-[999] top-full left-0 mt-1 w-full min-w-[180px] bg-white border border-slate-200 rounded-md shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] max-h-60 overflow-y-auto py-1">
                    {options.map(opt => {
                        const isSelected = selectedArr.includes(opt) || (opt === 'None' && selectedArr.length === 0);
                        return (
                            <div 
                                key={opt}
                                className={`px-3 py-2 text-sm cursor-pointer flex justify-between items-center hover:bg-slate-50 transition-colors ${isSelected ? 'text-blue-600 font-medium' : 'text-slate-700'}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggle(opt);
                                }}
                            >
                                <span className="truncate pr-2">{opt}</span>
                                {isSelected && <Check size={16} className="text-blue-600 shrink-0 ml-1" />}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const EmployeeProfilePage = ({ employee, onBack, onUpdate, centers, roles, departments }) => {
  const [activeTab, setActiveTab] = useState("personal");
  const [attendanceSubView, setAttendanceSubView] = useState(null);
  const [leaveSubView, setLeaveSubView] = useState(null);
  const [penaltySubView, setPenaltySubView] = useState(null);
  const [weekoffModalDay, setWeekoffModalDay] = useState(null);
  const [shiftModalDay, setShiftModalDay] = useState(null);
  const [tempWeekoffs, setTempWeekoffs] = useState([]);
  const [availableShifts, setAvailableShifts] = useState([
    { name: 'general', startTime: '09:00 AM', endTime: '05:00 PM' },
    { name: 'Full Time', startTime: '10:00 AM', endTime: '06:00 PM' },
    { name: 'Part time', startTime: '09:50 AM', endTime: '01:30 PM' },
  ]);
  const [tempShifts, setTempShifts] = useState([]);
  const [showCustomShiftInput, setShowCustomShiftInput] = useState(false);
  const [customShift, setCustomShift] = useState({name: '', startTime: '', endTime: ''});
  const [editingField, setEditingField] = useState(null);
  const [saving, setSaving] = useState(false);
  const [centersList, setCentersList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);

  React.useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const [deptRes, centerRes] = await Promise.all([
          api.get("/departments"),
          api.get("/centers")
        ]);
        setDepartmentsList(deptRes.data);
        setCentersList(centerRes.data);
      } catch (err) {
        console.error("Failed to load configs", err);
      }
    };
    fetchConfigs();
  }, []);

  React.useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#view_')) {
        const parts = hash.replace('#view_', '').split('/');
        if (parts.length > 1) {
          setActiveTab(parts[1]);
        } else {
          setActiveTab("personal");
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    handlePopState(); // initial sync
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    window.history.pushState(null, '', `#view_${employee._id}/${tab}`);
  };

  const [showPastEmploymentModal, setShowPastEmploymentModal] = useState(false);
  const [showLeaveTypeModal, setShowLeaveTypeModal] = useState(false);
  const [newLeaveTypeName, setNewLeaveTypeName] = useState('');
  const [showBankModal, setShowBankModal] = useState(false);
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [showKioskModal, setShowKioskModal] = useState(false);
  const [tempBiometricDevice, setTempBiometricDevice] = useState({ deviceName: '', serialNumber: '' });
  const [tempKioskDevice, setTempKioskDevice] = useState({ kioskName: '', dialCode: '+91', phoneNumber: '' });
  const [durationModalField, setDurationModalField] = useState(null);
  const [tempDuration, setTempDuration] = useState({ hours: '', minutes: '' });

  // Document states
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [documentType, setDocumentType] = useState('Salary Slip');
  const [customDocumentName, setCustomDocumentName] = useState('');
  const [documentFile, setDocumentFile] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [documentsList, setDocumentsList] = useState(employee.documents || []);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const formatDuration = (mins) => {
    if (!mins) return 'Not Set';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h} hrs ${m} mins`;
    if (h > 0) return `${h} hrs`;
    return `${m} mins`;
  };
  const [tempBankDetails, setTempBankDetails] = useState({ paymentMode: 'bank', accountHolderName: '', accountNumber: '', bankName: '', ifscCode: '', upiId: '' });
  const [pastEmpForm, setPastEmpForm] = useState({
    companyName: "",
    designation: "",
    joiningDate: "",
    leavingDate: "",
    currency: "INR",
    salary: "",
    companyGst: ""
  });

  // Remaining Details Form Data
  const [formData, setFormData] = useState({
    center: employee.center?._id || employee.center || "",
    department: employee.department || "",
    employeeType: employee.employmentType || "full-time",
    joiningDate: employee.joiningDate ? new Date(employee.joiningDate).toISOString().split("T")[0] : "",
    dateOfLeaving: employee.dateOfLeaving ? new Date(employee.dateOfLeaving).toISOString().split("T")[0] : "",
    employeeId: employee.employeeId || "",
    jobTitle: employee.jobTitle || "",
    officialEmail: employee.officialEmail || "",
    esiNumber: employee.esiNumber || "",
    pfNumber: employee.pfNumber || "",
    pastEmployment: employee.pastEmployment || [],
    pan: employee.pan || "",
    drivingLicense: employee.drivingLicense || "",
    voterId: employee.voterId || "",
    uan: employee.uan || "",
    currentAddress: employee.currentAddress || "",
    profilePic: null,
    bankDetails: employee.bankDetails || { paymentMode: 'bank', accountHolderName: '', accountNumber: '', bankName: '', ifscCode: '', upiId: '' },
    attendanceDetails: employee.attendanceDetails || { 
      timezone: 'Kolkata, Asia', 
      staffCanViewOwnAttendance: true,
      workTimings: {
        workTimingType: 'fixed',
        schedule: {
          mon: { isWeekoff: false, shifts: [{ name: 'general', startTime: '09:00 AM', endTime: '05:00 PM' }] },
          tue: { isWeekoff: false, shifts: [{ name: 'general', startTime: '09:00 AM', endTime: '05:00 PM' }] },
          wed: { isWeekoff: false, shifts: [{ name: 'general', startTime: '09:00 AM', endTime: '05:00 PM' }] },
          thu: { isWeekoff: false, shifts: [{ name: 'general', startTime: '09:00 AM', endTime: '05:00 PM' }] },
          fri: { isWeekoff: false, shifts: [{ name: 'general', startTime: '09:00 AM', endTime: '05:00 PM' }] },
          sat: { isWeekoff: false, shifts: [{ name: 'general', startTime: '09:00 AM', endTime: '05:00 PM' }] },
          sun: { isWeekoff: true, weekoffType: ['All Weeks'], shifts: [] }
        }
      },
      attendanceModes: {
        staffAppPunchIn: true, selfieAttendance: true, qrAttendance: false,
        gpsAttendance: { enabled: true, markFrom: 'office', radius: 200 }
      },
      automationRules: {
        autoPresentAtDayStart: false, presentOnPunchIn: true, autoHalfDayIfLateBy: null, mandatoryHalfDayHours: null, mandatoryFullDayHours: null
      }
    },
    
    salaryDetails: {
      effectiveDate: employee.salaryDetails?.effectiveDate || '',
      salaryType: employee.salaryDetails?.salaryType || 'Per Month',
      salaryStructure: employee.salaryDetails?.salaryStructure || 'default',
      ctcAmount: employee.salaryDetails?.ctcAmount || 0,
      earnings: (employee.salaryDetails?.earnings && employee.salaryDetails.earnings.length > 0) ? employee.salaryDetails.earnings : [
        { head: 'Basic', calculation: 'On Attendance', amount: 0 },
        { head: 'HRA', calculation: 'On Attendance', amount: 0 },
        { head: 'Travel Allowance', calculation: 'On Attendance', amount: 0 },
        { head: 'Special Allowance', calculation: 'On Attendance', amount: 0 }
      ],
      employerContributions: (employee.salaryDetails?.employerContributions && employee.salaryDetails.employerContributions.length > 0) ? employee.salaryDetails.employerContributions : [
        { head: 'Employer PF', calculation: 'None', includedInCtc: false, amount: 0 },
        { head: 'PF EDLI & Admin Charges', calculation: 'None', includedInCtc: false, amount: 0 },
        { head: 'Employer ESI', calculation: 'None', includedInCtc: false, amount: 0 },
        { head: 'Employer LWF', calculation: 'None', includedInCtc: false, amount: 0 }
      ],
      employeeContributions: (employee.salaryDetails?.employeeContributions && employee.salaryDetails.employeeContributions.length > 0) ? employee.salaryDetails.employeeContributions : [
        { head: 'Employee PF', calculation: 'None', amount: 0 },
        { head: 'Employee ESI', calculation: 'None', amount: 0 },
        { head: 'Professional Tax', calculation: 'None', amount: 0 },
        { head: 'Employee LWF', calculation: 'None', amount: 0 },
        { head: 'TDS', calculation: 'None', amount: 0 }
      ],
      deductions: employee.salaryDetails?.deductions || []
    },
    
    penaltyDetails: employee.penaltyDetails || {},
    leaveDetails: {
      leaveCycle: employee.leaveDetails?.leaveCycle || 'Monthly',
      leavePolicy: (employee.leaveDetails?.leavePolicy && employee.leaveDetails.leavePolicy.length > 0) ? employee.leaveDetails.leavePolicy : [
        { leaveType: 'Privileged Leave', allowedLeaves: 0, carryForwardLeaves: 0 },
        { leaveType: 'Sick Leave', allowedLeaves: 0, carryForwardLeaves: 0 },
        { leaveType: 'Casual Leave', allowedLeaves: 0, carryForwardLeaves: 0 }
      ],
      leaveBalance: (employee.leaveDetails?.leaveBalance && employee.leaveDetails.leaveBalance.length > 0) ? employee.leaveDetails.leaveBalance : [
        { leaveType: 'Privileged Leave', remainingBalance: 0 },
        { leaveType: 'Sick Leave', remainingBalance: 0 },
        { leaveType: 'Casual Leave', remainingBalance: 0 }
      ]
    },    
    // old fields
    salary: employee.salary || "",
    shiftStart: employee.shift?.start || "",
    shiftEnd: employee.shift?.end || "",
    privilegedLeave: employee.leaveBalances?.privilegedLeave || 0,
    sickLeave: employee.leaveBalances?.sickLeave || 0,
    casualLeave: employee.leaveBalances?.casualLeave || 0,
  });

  
  const [previewPic, setPreviewPic] = useState(employee.profilePic?.url || null);
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, profilePic: e.target.files[0] });
      const url = URL.createObjectURL(e.target.files[0]);
      setPreviewPic(url);
    }
  };

  
  const handleSalaryDetailsChange = (field, value) => {
    let newSd = { ...(formData.salaryDetails || {}) };
    newSd[field] = value;
    if (field === 'ctcAmount' && newSd.salaryStructure === 'default') {
       const ctc = parseFloat(value) || 0;
       newSd.earnings = newSd.earnings.map(e => {
           if(e.head === 'Basic') e.amount = ctc * 0.50;
           if(e.head === 'HRA') e.amount = ctc * 0.25;
           if(e.head === 'Travel Allowance') e.amount = ctc * 0.10;
           if(e.head === 'Special Allowance') e.amount = ctc * 0.15;
           return e;
       });
    }
    if (field === 'salaryStructure' && value === 'default') {
       const ctc = parseFloat(newSd.ctcAmount) || 0;
       newSd.earnings = [
        { head: 'Basic', calculation: 'On Attendance', amount: ctc * 0.50 },
        { head: 'HRA', calculation: 'On Attendance', amount: ctc * 0.25 },
        { head: 'Travel Allowance', calculation: 'On Attendance', amount: ctc * 0.10 },
        { head: 'Special Allowance', calculation: 'On Attendance', amount: ctc * 0.15 }
      ];
    }
    setFormData({...formData, salaryDetails: newSd});
  };

  const recalculateCompliances = (earnings, employerContribs, employeeContribs) => {
      const calcContribs = (contribs) => {
          const pass1 = contribs.map(c => {
              if (c.head === 'PF EDLI & Admin Charges') return c;
              if (!c.calculation || c.calculation === 'None') return c;
              const selectedHeads = c.calculation.split(',').filter(Boolean);
              let sum = 0;
              earnings.forEach(earning => {
                  if (selectedHeads.includes(earning.head)) sum += Number(earning.amount) || 0;
              });
              if (c.calculation.includes('1800 Limit')) return { ...c, amount: Math.min(1800, Math.round(sum * 0.12)) };
              else if (c.calculation.includes('12% Variable')) return { ...c, amount: Math.round(sum * 0.12) };
              return c;
          });
          
          return pass1.map(c => {
              if (c.head === 'PF EDLI & Admin Charges') {
                  const empPf = pass1.find(x => x.head === 'Employer PF');
                  const pfIsNone = !empPf || !empPf.calculation || empPf.calculation === 'None';
                  if (pfIsNone || c.calculation === 'None') return { ...c, amount: 0 };
                  if (c.calculation === '1% Variable') {
                      return { ...c, amount: Math.round((empPf.amount || 0) / 12) }; 
                  }
              }
              if (c.head === 'Employer ESI') {
                  if (!c.calculation || c.calculation === 'None') return { ...c, amount: 0 };
                  if (c.calculation === '3.25% Variable') {
                      let gross = 0;
                      earnings.forEach(earning => { gross += Number(earning.amount) || 0; });
                      return { ...c, amount: Math.round(gross * 0.0325) }; 
                  }
              }
              if (c.head === 'Employee ESI') {
                  if (!c.calculation || c.calculation === 'None') return { ...c, amount: 0 };
                  if (c.calculation === '0.75% Variable') {
                      let gross = 0;
                      earnings.forEach(earning => { gross += Number(earning.amount) || 0; });
                      return { ...c, amount: Math.round(gross * 0.0075) }; 
                  }
              }
              return c;
          });
      };
      
      return {
          employer: calcContribs(employerContribs),
          employee: calcContribs(employeeContribs)
      };
  };

  const handleEarningChange = (idx, field, value) => {
      const newE = [...(formData.salaryDetails.earnings || [])];
      newE[idx] = { ...newE[idx], [field]: value };
      
      let newEmpC = [...(formData.salaryDetails.employerContributions || [])];
      let newEeeC = [...(formData.salaryDetails.employeeContributions || [])];
      
      if (field === 'amount' || field === 'head') {
          const recalced = recalculateCompliances(newE, newEmpC, newEeeC);
          newEmpC = recalced.employer;
          newEeeC = recalced.employee;
      }
      
      setFormData({...formData, salaryDetails: {...formData.salaryDetails, earnings: newE, employerContributions: newEmpC, employeeContributions: newEeeC}});
  };

  const handleEmployerContribChange = (idx, field, value) => {
      const newC = [...(formData.salaryDetails.employerContributions || [])];
      newC[idx] = { ...newC[idx], [field]: value };
      
      if (field === 'calculation') {
          const recalced = recalculateCompliances(formData.salaryDetails.earnings || [], newC, formData.salaryDetails.employeeContributions || []);
          setFormData({...formData, salaryDetails: {...formData.salaryDetails, employerContributions: recalced.employer}});
          return;
      }
      
      setFormData({...formData, salaryDetails: {...formData.salaryDetails, employerContributions: newC}});
  };

  const handleEmployeeContribChange = (idx, field, value) => {
      const newC = [...(formData.salaryDetails.employeeContributions || [])];
      newC[idx] = { ...newC[idx], [field]: value };
      
      if (field === 'calculation') {
          const recalced = recalculateCompliances(formData.salaryDetails.earnings || [], formData.salaryDetails.employerContributions || [], newC);
          setFormData({...formData, salaryDetails: {...formData.salaryDetails, employeeContributions: recalced.employee}});
          return;
      }
      
      setFormData({...formData, salaryDetails: {...formData.salaryDetails, employeeContributions: newC}});
  };

  const handleDeductionChange = (idx, field, value) => {
      const newD = [...(formData.salaryDetails.deductions || [])];
      newD[idx] = { ...newD[idx], [field]: value };
      setFormData({...formData, salaryDetails: {...formData.salaryDetails, deductions: newD}});
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddPastEmployment = () => {
    if (!pastEmpForm.companyName || !pastEmpForm.joiningDate || !pastEmpForm.leavingDate) {
        toast.error("Please fill required past employment fields");
        return;
    }
    setFormData({
        ...formData,
        pastEmployment: [...formData.pastEmployment, pastEmpForm]
    });
    setShowPastEmploymentModal(false);
    setPastEmpForm({
        companyName: "", designation: "", joiningDate: "", leavingDate: "", currency: "INR", salary: "", companyGst: ""
    });
  };

  const removePastEmployment = (index) => {
      const newArr = [...formData.pastEmployment];
      newArr.splice(index, 1);
      setFormData({...formData, pastEmployment: newArr});
  };

  const handleDocumentUpload = async (e) => {
    e.preventDefault();
    if (!documentFile) return toast.error("Please select a file to upload.");
    if (documentType === 'Other' && !customDocumentName.trim()) return toast.error("Please specify the document name.");
    
    if (documentFile.size > 5 * 1024 * 1024) {
      return toast.error("File size exceeds 5MB limit.");
    }
    
    setUploadingDoc(true);
    const formDataObj = new FormData();
    formDataObj.append("documentFile", documentFile);
    formDataObj.append("documentType", documentType);
    formDataObj.append("customDocumentName", customDocumentName);
    
    try {
      const res = await api.post(`/employees/${employee._id}/documents`, formDataObj, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setDocumentsList(res.data.documents);
      toast.success("Document uploaded successfully!");
      setShowDocumentModal(false);
      setDocumentFile(null);
      setCustomDocumentName('');
      setDocumentType('Salary Slip');
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to upload document");
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDocumentDelete = (docId) => {
    setDocumentToDelete(docId);
  };

  const confirmDocumentDelete = async () => {
    if (!documentToDelete) return;
    try {
      const res = await api.delete(`/employees/${employee._id}/documents/${documentToDelete}`);
      setDocumentsList(res.data.documents);
      toast.success("Document deleted successfully!");
      setDocumentToDelete(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete document");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const loadingToast = toast.loading("Saving changes...");
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
          if (formData[key] !== null && formData[key] !== undefined) {
              if (key === 'pastEmployment' || key === 'bankDetails' || key === 'attendanceDetails' || key === 'salaryDetails' || key === 'leaveDetails' || key === 'penaltyDetails') {
                  data.append(key, JSON.stringify(formData[key]));
              } else {
                  data.append(key, formData[key]);
              }
          }
      });
      // also map employeeType to employmentType for backward compat
      data.append('employmentType', formData.employeeType);
      
      await api.put(`/employees/${employee._id}`, data, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Employee details updated successfully!", { id: loadingToast });
      onUpdate();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update employee", { id: loadingToast });
    } finally {
      setSaving(false);
    }
  };

  const getComplianceOptions = (comp) => {
    const isBaseSelected = comp.calculation && (comp.calculation.includes('1800 Limit') || comp.calculation.includes('12% Variable'));
    
    if (isBaseSelected) {
        const earningHeads = (formData.salaryDetails?.earnings || []).map(e => e.head).filter(Boolean);
        const include1800 = comp.calculation.includes('1800 Limit');
        const include12 = comp.calculation.includes('12% Variable');
        
        const base = [];
        if (include1800) base.push('₹ 1800 Limit');
        if (include12) base.push('12% Variable');
        
        return [...base, ...earningHeads, 'Overtime'];
    }
    return ['None', '₹ 1800 Limit', '12% Variable'];
  };

  return (
    <>
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-120px)] animate-in fade-in duration-300">
      <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white z-10 shrink-0">
        <div className="flex items-center gap-4">
          <button type="button" onClick={onBack} className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-brand-600 transition-colors cursor-pointer">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              {employee.firstName} {employee.lastName}
            </h2>
            <p className="text-sm font-semibold text-slate-500 flex items-center gap-2">
              <span className="text-brand-600">{employee.employeeId}</span> • 
              <span className="uppercase">{employee.user?.role || "Employee"}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 bg-slate-50 border-r border-slate-100 flex flex-col shrink-0">
          <div className="p-4 space-y-1">
            <button type="button" onClick={() => handleTabChange("personal")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === "personal" ? "bg-white text-brand-600 shadow-sm border border-slate-200" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}>
              <User size={18} /> Personal Info
            </button>
            <button type="button" onClick={() => handleTabChange("professional")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === "professional" ? "bg-white text-brand-600 shadow-sm border border-slate-200" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}>
              <Briefcase size={18} /> Employment Details
            </button>
            <button type="button" onClick={() => handleTabChange("verification")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === "verification" ? "bg-white text-brand-600 shadow-sm border border-slate-200" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}>
              <ShieldCheck size={18} /> Background Verification
            </button>
            <button type="button" onClick={() => handleTabChange("bank")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === "bank" ? "bg-white text-brand-600 shadow-sm border border-slate-200" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}>
              <Landmark size={18} /> Bank Account
            </button>
            <button type="button" onClick={() => handleTabChange("attendance")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === "attendance" ? "bg-white text-brand-600 shadow-sm border border-slate-200" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}>
              <Clock size={18} /> Attendance
            </button>
            <button type="button" onClick={() => handleTabChange("payroll")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === "payroll" ? "bg-white text-brand-600 shadow-sm border border-slate-200" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}>
              <DollarSign size={18} /> Salary Details
            </button>
            <button type="button" onClick={() => handleTabChange("leave")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === "leave" ? "bg-white text-brand-600 shadow-sm border border-slate-200" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}>
              <Calendar size={18} /> Leave Details
            </button>
            <button type="button" onClick={() => handleTabChange("penalty")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === "penalty" ? "bg-white text-brand-600 shadow-sm border border-slate-200" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}>
              <AlertCircle size={18} /> Penalty & Overtime
            </button>
            <button type="button" onClick={() => handleTabChange("documents")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === "documents" ? "bg-white text-brand-600 shadow-sm border border-slate-200" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}>
              <FileText size={18} /> Documents
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-white p-8">
          <form onSubmit={handleSave} className="max-w-4xl space-y-8">
            {activeTab === "personal" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600"><User size={20} /></div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Basic Details</h3>
                      <p className="text-sm text-slate-500">Personal and contact information</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-100">
                    <div><span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name</span><span className="font-semibold text-slate-900">{employee.firstName} {employee.lastName}</span></div>
                    <div><span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mobile</span><span className="font-semibold text-slate-900">{employee.phone || "-"}</span></div>
                    <div><span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email</span><span className="font-semibold text-slate-900">{employee.user?.email || "-"}</span></div>
                    <div><span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">DOB</span><span className="font-semibold text-slate-900">{employee.dob ? new Date(employee.dob).toLocaleDateString() : "-"}</span></div>
                    <div><span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Gender</span><span className="font-semibold text-slate-900 capitalize">{employee.gender || "-"}</span></div>
                    <div><span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Marital Status</span><span className="font-semibold text-slate-900 capitalize">{employee.maritalStatus || "-"}</span></div>
                    <div><span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Blood Group</span><span className="font-semibold text-slate-900">{employee.bloodGroup || "-"}</span></div>
                    <div><span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Guardian's Name</span><span className="font-semibold text-slate-900">{employee.guardianName || "-"}</span></div>
                  </div>
                  <h4 className="font-bold text-slate-700 text-sm mt-4">Emergency Contact</h4>
                  <div className="grid grid-cols-2 gap-6 bg-red-50/50 p-4 rounded-xl border border-red-100/50">
                    <div><span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Name / Relationship</span><span className="font-semibold text-slate-900">{employee.emergencyContactName || "-"} ({employee.emergencyContactRelationship || "-"})</span></div>
                    <div><span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mobile</span><span className="font-semibold text-slate-900">{employee.emergencyContactMobile || "-"}</span></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600"><FileText size={20} /></div>
                    <div><h3 className="text-lg font-bold text-slate-900">Government IDs</h3></div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-100">
                    <div><span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Aadhaar</span><span className="font-semibold text-slate-900">{employee.aadhaar || "-"}</span></div>
                    <div><span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">PAN</span><span className="font-semibold text-slate-900">{employee.pan || "-"}</span></div>
                    <div><span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Driving License</span><span className="font-semibold text-slate-900">{employee.drivingLicense || "-"}</span></div>
                    <div><span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">UAN</span><span className="font-semibold text-slate-900">{employee.uan || "-"}</span></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600"><Briefcase size={20} /></div>
                    <div><h3 className="text-lg font-bold text-slate-900">Address Details</h3></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-100">
                    <div><span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Current Address</span><span className="font-semibold text-slate-900 whitespace-pre-wrap">{employee.currentAddress || "-"}</span></div>
                    <div><span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Permanent Address</span><span className="font-semibold text-slate-900 whitespace-pre-wrap">{employee.permanentAddress || "-"}</span></div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "professional" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
                      <Briefcase size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Current Employment</h3>
                      <p className="text-sm text-slate-500">Job role, branches, and employment details</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-100">
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-xs font-bold text-slate-700 mb-2">Center <span className="text-red-500">*</span></label>
                    <select name="center" className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white" value={formData.center || ""} onChange={handleChange}>
                      <option value="">Select Center</option>
                      {centersList.map(c => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-xs font-bold text-slate-700 mb-2">Department</label>
                    <select name="department" className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white" value={formData.department || ""} onChange={handleChange}>
                      <option value="">Select Department</option>
                      {departmentsList.map(d => (
                        <option key={d._id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div> 
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">Employee Type</label>
                    <select name="employeeType" className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white" value={formData.employeeType} onChange={handleChange}>
                      <option value="full-time">Full Time</option>
                      <option value="permanent">Permanent</option>
                      <option value="part-time">Part Time</option>
                      <option value="consultant">Consultant</option> 
                      <option value="temporary">Temporary</option>
                      <option value="probation">Probation</option>
                      <option value="internship">Internship</option> 
                      <option value="contract">Contract</option> 
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">Employee ID</label>
                    <input type="text" name="employeeId" className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm" value={formData.employeeId} onChange={handleChange} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">Date of Joining</label>
                    <input type="date" name="joiningDate" className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm" value={formData.joiningDate} onChange={handleChange} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">Date of Leaving</label>
                    <input type="date" name="dateOfLeaving" className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm" value={formData.dateOfLeaving} onChange={handleChange} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">Job Title</label>
                    <input type="text" name="jobTitle" className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm" value={formData.jobTitle} onChange={handleChange} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">Official Email ID</label>
                    <input type="email" name="officialEmail" className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm" value={formData.officialEmail} onChange={handleChange} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">ESI Number</label>
                    <input type="text" name="esiNumber" className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm" value={formData.esiNumber} onChange={handleChange} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">PF Number</label>
                    <input type="text" name="pfNumber" className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm" value={formData.pfNumber} onChange={handleChange} />
                  </div>
                </div>

                <div className="pt-6">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <h4 className="font-bold text-slate-900">Past Employment</h4>
                        <button type="button" onClick={() => setShowPastEmploymentModal(true)} className="flex items-center gap-2 text-sm font-bold text-brand-600 bg-brand-50 px-3 py-1.5 rounded-lg hover:bg-brand-100 transition-colors">
                            <Plus size={16} /> Add
                        </button>
                    </div>
                    {formData.pastEmployment.length === 0 ? (
                        <p className="text-sm text-slate-500 py-4">No Past Employment Details</p>
                    ) : (
                        <div className="space-y-4 py-4">
                            {formData.pastEmployment.map((emp, idx) => (
                                <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border border-slate-100">
                                    <div>
                                        <p className="font-bold text-slate-900">{emp.companyName}</p>
                                        <p className="text-xs text-slate-500">{emp.designation} • {new Date(emp.joiningDate).toLocaleDateString()} to {new Date(emp.leavingDate).toLocaleDateString()}</p>
                                    </div>
                                    <button type="button" onClick={() => removePastEmployment(idx)} className="text-red-500 hover:text-red-700 p-2">
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
              </div>
            )}
            
            {activeTab === "verification" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                

                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    {/* ID Proofs */}
                    <div className="p-4 bg-slate-50 border-b border-slate-200">
                        <h4 className="font-bold text-slate-700 text-sm">ID Proofs</h4>
                    </div>
                    <div className="divide-y divide-slate-100">

                        <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div className="w-1/3"><span className="font-bold text-sm text-slate-700">PAN</span></div>
                            <div className="w-1/3 flex items-center gap-2">
                                {editingField === 'pan' ? (
                                    <input type="text" name="pan" value={formData.pan} onChange={handleChange} className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm" autoFocus onBlur={() => setEditingField(null)} onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)} />
                                ) : (
                                    formData.pan ? (
                                        <><CheckCircle size={16} className="text-green-500" /><span className="text-sm text-green-600 font-medium">Added ({formData.pan})</span></>
                                    ) : (
                                        <><AlertCircle size={16} className="text-red-400" /><span className="text-sm text-red-500 font-medium">Not Added</span></>
                                    )
                                )}
                            </div>
                            <div className="w-1/3 flex items-center justify-end gap-4">
                                <button type="button" onClick={() => setEditingField(editingField === 'pan' ? null : 'pan')} className="text-blue-600 border border-blue-200 bg-white hover:bg-blue-50 px-6 py-1.5 rounded-md text-sm font-medium transition-colors">
                                    {editingField === 'pan' ? "Done" : (formData.pan ? "Edit" : "Add")}
                                </button>
                                <ChevronRight size={18} className="text-slate-400" />
                            </div>
                        </div>

                        <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div className="w-1/3"><span className="font-bold text-sm text-slate-700">Driving License</span></div>
                            <div className="w-1/3 flex items-center gap-2">
                                {editingField === 'drivingLicense' ? (
                                    <input type="text" name="drivingLicense" value={formData.drivingLicense} onChange={handleChange} className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm" autoFocus onBlur={() => setEditingField(null)} onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)} />
                                ) : (
                                    formData.drivingLicense ? (
                                        <><CheckCircle size={16} className="text-green-500" /><span className="text-sm text-green-600 font-medium">Added ({formData.drivingLicense})</span></>
                                    ) : (
                                        <><AlertCircle size={16} className="text-red-400" /><span className="text-sm text-red-500 font-medium">Not Added</span></>
                                    )
                                )}
                            </div>
                            <div className="w-1/3 flex items-center justify-end gap-4">
                                <button type="button" onClick={() => setEditingField(editingField === 'drivingLicense' ? null : 'drivingLicense')} className="text-blue-600 border border-blue-200 bg-white hover:bg-blue-50 px-6 py-1.5 rounded-md text-sm font-medium transition-colors">
                                    {editingField === 'drivingLicense' ? "Done" : (formData.drivingLicense ? "Edit" : "Add")}
                                </button>
                                <ChevronRight size={18} className="text-slate-400" />
                            </div>
                        </div>

                        <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div className="w-1/3"><span className="font-bold text-sm text-slate-700">Voter ID</span></div>
                            <div className="w-1/3 flex items-center gap-2">
                                {editingField === 'voterId' ? (
                                    <input type="text" name="voterId" value={formData.voterId} onChange={handleChange} className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm" autoFocus onBlur={() => setEditingField(null)} onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)} />
                                ) : (
                                    formData.voterId ? (
                                        <><CheckCircle size={16} className="text-green-500" /><span className="text-sm text-green-600 font-medium">Added ({formData.voterId})</span></>
                                    ) : (
                                        <><AlertCircle size={16} className="text-red-400" /><span className="text-sm text-red-500 font-medium">Not Added</span></>
                                    )
                                )}
                            </div>
                            <div className="w-1/3 flex items-center justify-end gap-4">
                                <button type="button" onClick={() => setEditingField(editingField === 'voterId' ? null : 'voterId')} className="text-blue-600 border border-blue-200 bg-white hover:bg-blue-50 px-6 py-1.5 rounded-md text-sm font-medium transition-colors">
                                    {editingField === 'voterId' ? "Done" : (formData.voterId ? "Edit" : "Add")}
                                </button>
                                <ChevronRight size={18} className="text-slate-400" />
                            </div>
                        </div>

                        <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div className="w-1/3"><span className="font-bold text-sm text-slate-700">UAN</span></div>
                            <div className="w-1/3 flex items-center gap-2">
                                {editingField === 'uan' ? (
                                    <input type="text" name="uan" value={formData.uan} onChange={handleChange} className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm" autoFocus onBlur={() => setEditingField(null)} onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)} />
                                ) : (
                                    formData.uan ? (
                                        <><CheckCircle size={16} className="text-green-500" /><span className="text-sm text-green-600 font-medium">Added ({formData.uan})</span></>
                                    ) : (
                                        <><AlertCircle size={16} className="text-red-400" /><span className="text-sm text-red-500 font-medium">Not Added</span></>
                                    )
                                )}
                            </div>
                            <div className="w-1/3 flex items-center justify-end gap-4">
                                <button type="button" onClick={() => setEditingField(editingField === 'uan' ? null : 'uan')} className="text-blue-600 border border-blue-200 bg-white hover:bg-blue-50 px-6 py-1.5 rounded-md text-sm font-medium transition-colors">
                                    {editingField === 'uan' ? "Done" : (formData.uan ? "Edit" : "Add")}
                                </button>
                                <ChevronRight size={18} className="text-slate-400" />
                            </div>
                        </div>
                    </div>

                    {/* Face */}
                    <div className="p-4 bg-slate-50 border-y border-slate-200 flex items-center justify-between">
                        <div className="w-1/3"><span className="font-bold text-sm text-slate-700">Face</span></div>
                        <div className="w-1/3 flex items-center gap-2">
                            {previewPic ? (
                                <><CheckCircle size={16} className="text-green-500" /><span className="text-sm text-green-600 font-medium">Verified</span></>
                            ) : (
                                <><AlertCircle size={16} className="text-red-400" /><span className="text-sm text-red-500 font-medium">Not Verified</span></>
                            )}
                        </div>
                        <div className="w-1/3 flex items-center justify-end gap-4">
                            <label className="text-blue-600 border border-blue-200 bg-white hover:bg-blue-50 px-6 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer">
                                {previewPic ? "Re-Verify" : "Verify"}
                                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                            </label>
                            <ChevronRight size={18} className="text-slate-400" />
                        </div>
                    </div>

                    {/* Address */}

                        <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div className="w-1/3"><span className="font-bold text-sm text-slate-700">Address</span></div>
                            <div className="w-1/3 flex items-center gap-2">
                                {editingField === 'currentAddress' ? (
                                    <input type="text" name="currentAddress" value={formData.currentAddress} onChange={handleChange} className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm" autoFocus onBlur={() => setEditingField(null)} onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)} />
                                ) : (
                                    formData.currentAddress ? (
                                        <><CheckCircle size={16} className="text-green-500" /><span className="text-sm text-green-600 font-medium">Added ({formData.currentAddress})</span></>
                                    ) : (
                                        <><AlertCircle size={16} className="text-red-400" /><span className="text-sm text-red-500 font-medium">Not Added</span></>
                                    )
                                )}
                            </div>
                            <div className="w-1/3 flex items-center justify-end gap-4">
                                <button type="button" onClick={() => setEditingField(editingField === 'currentAddress' ? null : 'currentAddress')} className="text-blue-600 border border-blue-200 bg-white hover:bg-blue-50 px-6 py-1.5 rounded-md text-sm font-medium transition-colors">
                                    {editingField === 'currentAddress' ? "Done" : (formData.currentAddress ? "Edit" : "Add")}
                                </button>
                                <ChevronRight size={18} className="text-slate-400" />
                            </div>
                        </div>

                    {/* Past Employment */}
                    <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors border-t border-slate-200">
                        <div className="w-1/3"><span className="font-bold text-sm text-slate-700">Past Employment</span></div>
                        <div className="w-1/3 flex items-center gap-2">
                            {formData.pastEmployment && formData.pastEmployment.length > 0 ? (
                                <><CheckCircle size={16} className="text-green-500" /><span className="text-sm text-green-600 font-medium">Added ({formData.pastEmployment.length})</span></>
                            ) : (
                                <><AlertCircle size={16} className="text-red-400" /><span className="text-sm text-red-500 font-medium">Not Added</span></>
                            )}
                        </div>
                        <div className="w-1/3 flex items-center justify-end gap-4">
                            <button type="button" onClick={() => setShowPastEmploymentModal(true)} className="text-blue-600 border border-blue-200 bg-white hover:bg-blue-50 px-6 py-1.5 rounded-md text-sm font-medium transition-colors">
                                {formData.pastEmployment && formData.pastEmployment.length > 0 ? "Edit" : "Add"}
                            </button>
                            <ChevronRight size={18} className="text-slate-400" />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 mt-2 text-slate-400">
                    <AlertCircle size={12} />
                    <p className="text-xs">All Verification Reports will be available under <span className="text-blue-500 cursor-pointer hover:underline">Documents</span></p>
                </div>
              </div>
            )}


            
            {activeTab === "bank" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden min-h-[400px] flex flex-col">
                    <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                        <h4 className="font-bold text-slate-800">Bank Account</h4>
                        <button type="button" onClick={() => { setTempBankDetails(formData.bankDetails || { paymentMode: 'bank', accountHolderName: '', accountNumber: '', bankName: '', ifscCode: '', upiId: '' }); setShowBankModal(true); }} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                            {formData.bankDetails?.accountNumber || formData.bankDetails?.upiId ? "Edit Details" : "Add Details"}
                        </button>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4 border border-blue-100">
                            <Landmark size={32} className="text-blue-500" />
                        </div>
                        {(formData.bankDetails?.accountNumber || formData.bankDetails?.upiId) ? (
                            <>
                                <h3 className="text-lg font-bold text-slate-800 mb-2">Bank Details Added</h3>
                                {formData.bankDetails.paymentMode === 'bank' ? (
                                    <div className="text-slate-500 text-sm space-y-1">
                                        <p><strong>Bank:</strong> {formData.bankDetails.bankName}</p>
                                        <p><strong>A/C:</strong> {formData.bankDetails.accountNumber}</p>
                                        <p><strong>IFSC:</strong> {formData.bankDetails.ifscCode}</p>
                                    </div>
                                ) : (
                                    <div className="text-slate-500 text-sm space-y-1">
                                        <p><strong>UPI ID:</strong> {formData.bankDetails.upiId}</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <h3 className="text-lg font-bold text-slate-800 mb-2">Add Bank/UPI details</h3>
                                <p className="text-slate-500 text-sm">Add account details to start paying staff</p>
                            </>
                        )}
                    </div>
                </div>
              </div>
            )}
            
            {showBankModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="p-4 border-b border-slate-200">
                            <h3 className="font-bold text-slate-800">Bank / UPI Details</h3>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="paymentMode" value="bank" checked={tempBankDetails.paymentMode === 'bank'} onChange={(e) => setTempBankDetails({...tempBankDetails, paymentMode: e.target.value})} className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-medium text-slate-700">Bank Account</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="paymentMode" value="upi" checked={tempBankDetails.paymentMode === 'upi'} onChange={(e) => setTempBankDetails({...tempBankDetails, paymentMode: e.target.value})} className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-medium text-slate-700">UPI</span>
                                </label>
                            </div>
                            
                            {tempBankDetails.paymentMode === 'bank' ? (
                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <label className="w-1/3 text-sm text-slate-600 font-medium text-right pr-4"><span className="text-red-500">*</span> Account Holder's name :</label>
                                        <input type="text" className="flex-1 px-3 py-2 border border-slate-200 rounded-md text-sm" value={tempBankDetails.accountHolderName} onChange={(e) => setTempBankDetails({...tempBankDetails, accountHolderName: e.target.value})} />
                                    </div>
                                    <div className="flex items-center">
                                        <label className="w-1/3 text-sm text-slate-600 font-medium text-right pr-4"><span className="text-red-500">*</span> Account Number :</label>
                                        <input type="text" className="flex-1 px-3 py-2 border border-slate-200 rounded-md text-sm" value={tempBankDetails.accountNumber} onChange={(e) => setTempBankDetails({...tempBankDetails, accountNumber: e.target.value})} />
                                    </div>
                                    <div className="flex items-center">
                                        <label className="w-1/3 text-sm text-slate-600 font-medium text-right pr-4"><span className="text-red-500">*</span> Bank Name :</label>
                                        <input type="text" className="flex-1 px-3 py-2 border border-slate-200 rounded-md text-sm" value={tempBankDetails.bankName} onChange={(e) => setTempBankDetails({...tempBankDetails, bankName: e.target.value})} />
                                    </div>
                                    <div className="flex items-center">
                                        <label className="w-1/3 text-sm text-slate-600 font-medium text-right pr-4"><span className="text-red-500">*</span> IFSC Code :</label>
                                        <input type="text" className="flex-1 px-3 py-2 border border-slate-200 rounded-md text-sm" value={tempBankDetails.ifscCode} onChange={(e) => setTempBankDetails({...tempBankDetails, ifscCode: e.target.value})} />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <label className="w-1/3 text-sm text-slate-600 font-medium text-right pr-4"><span className="text-red-500">*</span> UPI ID :</label>
                                        <input type="text" className="flex-1 px-3 py-2 border border-slate-200 rounded-md text-sm" value={tempBankDetails.upiId} onChange={(e) => setTempBankDetails({...tempBankDetails, upiId: e.target.value})} />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
                            <button type="button" onClick={() => setShowBankModal(false)} className="px-6 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50">Cancel</button>
                            <button type="button" onClick={() => { setFormData({...formData, bankDetails: tempBankDetails}); setShowBankModal(false); }} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-medium text-white shadow-sm">Save Details</button>
                        </div>
                    </div>
                </div>
            )}


            
            
            {activeTab === "attendance" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                
                {/* Breadcrumb Header */}
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                        <span onClick={() => setAttendanceSubView(null)} className={`transition-colors ${attendanceSubView ? 'text-blue-500 cursor-pointer hover:underline' : 'text-slate-800'}`}>
                            Attendance Details
                        </span>
                        {attendanceSubView && (
                            <>
                                <span className="text-slate-400 text-sm">»</span>
                                {attendanceSubView === 'biometric-devices' || attendanceSubView === 'kiosk-devices' ? (
                                    <>
                                        <span onClick={() => setAttendanceSubView('attendance-modes')} className="text-blue-500 text-sm cursor-pointer hover:underline">Attendance Modes</span>
                                        <span className="text-slate-400 text-sm mx-2">»</span>
                                        <span className="text-slate-600 text-sm">{attendanceSubView === 'biometric-devices' ? 'Biometric Devices' : 'Kiosk Devices'}</span>
                                    </>
                                ) : (
                                    <span className="text-slate-600 text-sm">
                                        {attendanceSubView === 'work-timings' && 'Work Timings'}
                                        {attendanceSubView === 'attendance-modes' && 'Attendance Modes'}
                                        {attendanceSubView === 'automation-rules' && 'Automation Rules'}
                                    </span>
                                )}
                            </>
                        )}
                    </h3>
                    {attendanceSubView && (
                        <button type="button" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors shadow-sm">
                            Update Details
                        </button>
                    )}
                </div>

                {!attendanceSubView ? (
                    <div className="space-y-4">
                        <div onClick={() => setAttendanceSubView('work-timings')} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between hover:border-slate-300 transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                                <span className="font-semibold text-sm text-slate-700">Work Timings</span>
                                <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">New</span>
                            </div>
                            <ChevronRight size={18} className="text-slate-400" />
                        </div>

                        <div onClick={() => setAttendanceSubView('attendance-modes')} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between hover:border-slate-300 transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                                <span className="font-semibold text-sm text-slate-700">Attendance Modes</span>
                                <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">New</span>
                            </div>
                            <ChevronRight size={18} className="text-slate-400" />
                        </div>

                        <div onClick={() => setAttendanceSubView('automation-rules')} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between hover:border-slate-300 transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                                <span className="font-semibold text-sm text-slate-700">Automation Rules</span>
                                <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">New</span>
                            </div>
                            <ChevronRight size={18} className="text-slate-400" />
                        </div>

                        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                            <span className="font-semibold text-sm text-slate-700">Attendance Timezone</span>
                            <select 
                                className="w-48 px-3 py-1.5 border border-slate-200 rounded-md text-sm bg-slate-50 text-slate-700 outline-none"
                                value={formData.attendanceDetails?.timezone || 'Kolkata, Asia'}
                                onChange={(e) => setFormData({...formData, attendanceDetails: {...formData.attendanceDetails, timezone: e.target.value}})}
                            >
                                <option value="Kolkata, Asia">Kolkata, Asia</option>
                                <option value="Dubai, Asia">Dubai, Asia</option>
                                <option value="London, Europe">London, Europe</option>
                                <option value="New York, America">New York, America</option>
                            </select>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                            <span className="font-semibold text-sm text-slate-700">Staff can view own attendance</span>
                            <button 
                                type="button" 
                                onClick={() => setFormData({...formData, attendanceDetails: {...formData.attendanceDetails, staffCanViewOwnAttendance: !formData.attendanceDetails?.staffCanViewOwnAttendance}})}
                                className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${formData.attendanceDetails?.staffCanViewOwnAttendance ? 'bg-blue-500 justify-end' : 'bg-slate-300 justify-start'}`}
                            >
                                <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                            </button>
                        </div>
                    </div>
                ) : attendanceSubView === 'work-timings' ? (
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center gap-4">
                            <span className="text-sm font-medium text-slate-700 w-1/4">Select Type</span>
                            <div className="flex items-center gap-8">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="workTimingType" value="fixed" checked={formData.attendanceDetails?.workTimings?.workTimingType === 'fixed'} onChange={(e) => setFormData({...formData, attendanceDetails: {...formData.attendanceDetails, workTimings: {...formData.attendanceDetails.workTimings, workTimingType: e.target.value}}})} className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm text-slate-700 font-medium">Fixed</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="workTimingType" value="flexible" checked={formData.attendanceDetails?.workTimings?.workTimingType === 'flexible'} onChange={(e) => setFormData({...formData, attendanceDetails: {...formData.attendanceDetails, workTimings: {...formData.attendanceDetails.workTimings, workTimingType: e.target.value}}})} className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm text-slate-700 font-medium">Flexible</span>
                                </label>
                            </div>
                        </div>
                        <div className="p-6 overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200">
                                        <th className="pb-4 text-sm font-bold text-slate-700 w-24">Day</th>
                                        <th className="pb-4 text-sm font-bold text-slate-700 w-24 text-center">Weekoff</th>
                                        <th className="pb-4 text-sm font-bold text-slate-700">Shifts</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => {
                                        const schedule = formData.attendanceDetails?.workTimings?.schedule?.[day] || { isWeekoff: false, shifts: [] };
                                        return (
                                            <tr key={day} className="border-b border-slate-100 last:border-0">
                                                <td className="py-4 text-sm font-medium text-slate-700 capitalize">
                                                    {!schedule.isWeekoff && <span className="text-red-500 mr-1">*</span>}
                                                    {day}
                                                </td>
                                                <td className="py-4 text-center">
                                                    <input type="checkbox" checked={schedule.isWeekoff} onChange={(e) => {
                                                        const newSchedule = {...formData.attendanceDetails.workTimings.schedule};
                                                        newSchedule[day] = {...schedule, isWeekoff: e.target.checked};
                                                        setFormData({...formData, attendanceDetails: {...formData.attendanceDetails, workTimings: {...formData.attendanceDetails.workTimings, schedule: newSchedule}}});
                                                    }} className="w-4 h-4 text-blue-600 rounded border-slate-300" />
                                                </td>
                                                <td className="py-4">
                                                    {schedule.isWeekoff ? (
                                                        <div 
                                                            onClick={() => { setTempWeekoffs([...(schedule.weekoffType || ['All Weeks'])]); setWeekoffModalDay(day); }}
                                                            className="w-full max-w-xs px-3 py-2 border border-slate-200 rounded-md text-sm text-slate-700 bg-white cursor-pointer flex items-center justify-between hover:bg-slate-50 transition-colors"
                                                        >
                                                            <span>{(schedule.weekoffType || ['All Weeks']).join(', ')}</span>
                                                            <ChevronDown size={16} className="text-slate-400" />
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex flex-col gap-2 w-full max-w-xs">
                                                            {schedule.shifts.length > 0 ? (
                                                                schedule.shifts.map((shift, idx) => (
                                                                    <div key={idx} className="flex items-center border border-slate-200 rounded-md px-3 py-1.5 w-full justify-between bg-white">
                                                                        <span className="text-sm text-slate-600">{shift.name} | {shift.startTime} - {shift.endTime}</span>
                                                                        <MinusCircle size={16} className="text-red-500 cursor-pointer hover:text-red-600" onClick={() => {
                                                                            const newSchedule = {...formData.attendanceDetails.workTimings.schedule};
                                                                            newSchedule[day].shifts = newSchedule[day].shifts.filter((_, i) => i !== idx);
                                                                            setFormData({...formData, attendanceDetails: {...formData.attendanceDetails, workTimings: {...formData.attendanceDetails.workTimings, schedule: newSchedule}}});
                                                                        }} />
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="text-sm text-slate-400 italic">No shift added</div>
                                                            )}
                                                        </div>
                                                        <PlusCircle size={18} className="text-blue-500 cursor-pointer hover:text-blue-600 ml-3" onClick={() => {
                                                            setTempShifts([...(schedule.shifts || [])]);
                                                            setShiftModalDay(day);
                                                        }} />
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    

                    
                    </div>
                ) : attendanceSubView === 'attendance-modes' ? (
                    <div className="space-y-4">
                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-100">
                            {[
                                { key: 'staffAppPunchIn', label: 'Allow punch in from Staff App' },
                                { key: 'selfieAttendance', label: 'Selfie Attendance', icon: <ScanFace size={16} className="text-slate-600" /> },
                                { key: 'qrAttendance', label: 'QR Attendance', icon: <QrCode size={16} className="text-slate-600" /> }
                            ].map((mode) => (
                                <div key={mode.key} className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {mode.icon}
                                        <span className="font-semibold text-sm text-slate-700">{mode.label}</span>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => setFormData({...formData, attendanceDetails: {...formData.attendanceDetails, attendanceModes: {...formData.attendanceDetails.attendanceModes, [mode.key]: !formData.attendanceDetails.attendanceModes[mode.key]}}})}
                                        className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${formData.attendanceDetails?.attendanceModes?.[mode.key] ? 'bg-blue-500 justify-end' : 'bg-slate-300 justify-start'}`}
                                    >
                                        <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                                    </button>
                                </div>
                            ))}
                            
                            <div className="p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <MapPin size={16} className="text-slate-600" />
                                        <span className="font-semibold text-sm text-slate-700">GPS Attendance</span>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => setFormData({...formData, attendanceDetails: {...formData.attendanceDetails, attendanceModes: {...formData.attendanceDetails.attendanceModes, gpsAttendance: {...formData.attendanceDetails.attendanceModes.gpsAttendance, enabled: !formData.attendanceDetails.attendanceModes.gpsAttendance.enabled}}}})}
                                        className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${formData.attendanceDetails?.attendanceModes?.gpsAttendance?.enabled ? 'bg-blue-500 justify-end' : 'bg-slate-300 justify-start'}`}
                                    >
                                        <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                                    </button>
                                </div>
                                {formData.attendanceDetails?.attendanceModes?.gpsAttendance?.enabled && (
                                    <div className="pl-8 space-y-4">
                                        <div className="space-y-2">
                                            <span className="text-sm font-medium text-slate-700">Mark attendance from</span>
                                            <div className="flex items-center gap-4">
                                                <label className={`flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer transition-colors ${formData.attendanceDetails.attendanceModes.gpsAttendance.markFrom === 'office' ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}>
                                                    <input type="radio" name="markFrom" value="office" checked={formData.attendanceDetails.attendanceModes.gpsAttendance.markFrom === 'office'} onChange={(e) => setFormData({...formData, attendanceDetails: {...formData.attendanceDetails, attendanceModes: {...formData.attendanceDetails.attendanceModes, gpsAttendance: {...formData.attendanceDetails.attendanceModes.gpsAttendance, markFrom: e.target.value}}}})} className="w-4 h-4 text-blue-600" />
                                                    <span className="text-sm text-slate-700">From Office</span>
                                                </label>
                                                <label className={`flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer transition-colors ${formData.attendanceDetails.attendanceModes.gpsAttendance.markFrom === 'anywhere' ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}>
                                                    <input type="radio" name="markFrom" value="anywhere" checked={formData.attendanceDetails.attendanceModes.gpsAttendance.markFrom === 'anywhere'} onChange={(e) => setFormData({...formData, attendanceDetails: {...formData.attendanceDetails, attendanceModes: {...formData.attendanceDetails.attendanceModes, gpsAttendance: {...formData.attendanceDetails.attendanceModes.gpsAttendance, markFrom: e.target.value}}}})} className="w-4 h-4 text-blue-600" />
                                                    <span className="text-sm text-slate-700">From Anywhere</span>
                                                </label>
                                            </div>
                                        </div>
                                        {formData.attendanceDetails.attendanceModes.gpsAttendance.markFrom === 'office' && (
                                            <div className="bg-slate-50 border border-slate-200 rounded-md p-4 flex items-center justify-between">
                                                <div>
                                                    <h5 className="font-bold text-sm text-slate-700">CHENNAI 4</h5>
                                                    <p className="text-sm text-slate-500">600045 129, 56, Mudichur Rd, West Tambaram, Tambaram, Chennai, Tamil Nadu 600045, India</p>
                                                </div>
                                                <div className="bg-slate-100 border border-slate-200 px-4 py-2 rounded-md text-center">
                                                    <p className="font-bold text-sm text-slate-800">{formData.attendanceDetails.attendanceModes.gpsAttendance.radius}m</p>
                                                    <p className="text-xs text-slate-500">Allowed Radius</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col shadow-sm">
                            <div className="flex items-center gap-3 mb-1">
                                <Smartphone size={16} className="text-slate-600" />
                                <span className="font-semibold text-sm text-slate-700">Attendance Kiosk</span>
                            </div>
                            <span onClick={() => setAttendanceSubView('kiosk-devices')} className="text-blue-500 text-sm font-medium hover:underline cursor-pointer pl-7">Manage kiosk devices</span>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col shadow-sm">
                            <div className="flex items-center gap-3 mb-1">
                                <Fingerprint size={16} className="text-slate-600" />
                                <span className="font-semibold text-sm text-slate-700">Biometric Attendance</span>
                            </div>
                            <span onClick={() => setAttendanceSubView('biometric-devices')} className="text-blue-500 text-sm font-medium hover:underline cursor-pointer pl-7">Manage biometric devices</span>
                        </div>
                    </div>
                ) : attendanceSubView === 'biometric-devices' ? (
                    <div className="space-y-4">
                        {formData.attendanceDetails?.biometricDevices?.length > 0 ? (
                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                                    <h4 className="font-bold text-slate-800 text-sm">Biometric Devices ({formData.attendanceDetails.biometricDevices.length})</h4>
                                    <button type="button" onClick={() => setShowBiometricModal(true)} className="text-blue-600 font-medium text-sm flex items-center gap-1 hover:underline">
                                        <Plus size={16} /> Add Device
                                    </button>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {formData.attendanceDetails.biometricDevices.map((device, idx) => (
                                        <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50">
                                            <div>
                                                <h5 className="font-semibold text-slate-800 text-sm">{device.deviceName}</h5>
                                                <p className="text-xs text-slate-500 mt-1">Serial: {device.serialNumber}</p>
                                            </div>
                                            <button type="button" onClick={() => {
                                                const newDevs = [...formData.attendanceDetails.biometricDevices];
                                                newDevs.splice(idx, 1);
                                                setFormData({...formData, attendanceDetails: {...formData.attendanceDetails, biometricDevices: newDevs}});
                                            }} className="text-red-400 hover:text-red-600 transition-colors p-2"><X size={16} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center p-16 shadow-sm min-h-[400px]">
                                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6">
                                    <Fingerprint size={32} />
                                </div>
                                <h4 className="font-bold text-lg text-slate-800 mb-2">No biometric devices found</h4>
                                <p className="text-sm text-slate-500 mb-8">Add a biometric device to get started</p>
                                <button type="button" onClick={() => setShowBiometricModal(true)} className="px-6 py-2 bg-white border border-blue-500 text-blue-600 hover:bg-blue-50 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
                                    <Plus size={16} /> Add Biometric Device
                                </button>
                            </div>
                        )}
                    </div>
                ) : attendanceSubView === 'kiosk-devices' ? (
                    <div className="space-y-4">
                        {formData.attendanceDetails?.kioskDevices?.length > 0 ? (
                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                                    <h4 className="font-bold text-slate-800 text-sm">Kiosk Devices ({formData.attendanceDetails.kioskDevices.length})</h4>
                                    <button type="button" onClick={() => setShowKioskModal(true)} className="text-blue-600 font-medium text-sm flex items-center gap-1 hover:underline">
                                        <Plus size={16} /> Add Kiosk
                                    </button>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {formData.attendanceDetails.kioskDevices.map((device, idx) => (
                                        <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50">
                                            <div>
                                                <h5 className="font-semibold text-slate-800 text-sm">{device.kioskName}</h5>
                                                <p className="text-xs text-slate-500 mt-1">Phone: {device.dialCode} {device.phoneNumber}</p>
                                            </div>
                                            <button type="button" onClick={() => {
                                                const newDevs = [...formData.attendanceDetails.kioskDevices];
                                                newDevs.splice(idx, 1);
                                                setFormData({...formData, attendanceDetails: {...formData.attendanceDetails, kioskDevices: newDevs}});
                                            }} className="text-red-400 hover:text-red-600 transition-colors p-2"><X size={16} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center p-16 shadow-sm min-h-[400px]">
                                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6">
                                    <Smartphone size={32} />
                                </div>
                                <h4 className="font-bold text-lg text-slate-800 mb-2">No kiosk devices found</h4>
                                <p className="text-sm text-slate-500 mb-8">Add a kiosk device to get started</p>
                                <button type="button" onClick={() => setShowKioskModal(true)} className="px-6 py-2 bg-white border border-blue-500 text-blue-600 hover:bg-blue-50 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
                                    <Plus size={16} /> Add Kiosk Device
                                </button>
                            </div>
                        )}
                    </div>
                ) : attendanceSubView === 'automation-rules' ? (
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-100">
                        <div className="p-4 flex items-center justify-between">
                            <span className="font-semibold text-sm text-slate-700">Auto Present at day start</span>
                            <button 
                                type="button" 
                                onClick={() => setFormData({...formData, attendanceDetails: {...formData.attendanceDetails, automationRules: {...formData.attendanceDetails.automationRules, autoPresentAtDayStart: !formData.attendanceDetails.automationRules.autoPresentAtDayStart}}})}
                                className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${formData.attendanceDetails?.automationRules?.autoPresentAtDayStart ? 'bg-blue-500 justify-end' : 'bg-slate-300 justify-start'}`}
                            >
                                <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                            </button>
                        </div>
                        <div className="p-4 flex items-center justify-between">
                            <span className="font-semibold text-sm text-slate-700">Present on Punch In</span>
                            <button 
                                type="button" 
                                onClick={() => setFormData({...formData, attendanceDetails: {...formData.attendanceDetails, automationRules: {...formData.attendanceDetails.automationRules, presentOnPunchIn: !formData.attendanceDetails.automationRules.presentOnPunchIn}}})}
                                className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${formData.attendanceDetails?.automationRules?.presentOnPunchIn ? 'bg-blue-500 justify-end' : 'bg-slate-300 justify-start'}`}
                            >
                                <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                            </button>
                        </div>
                        <div className="p-4 flex items-center justify-between">
                            <span className="font-semibold text-sm text-slate-700">Auto half day if late by</span>
                            <button type="button" onClick={() => {
                                setDurationModalField('autoHalfDayIfLateBy');
                                const val = formData.attendanceDetails?.automationRules?.autoHalfDayIfLateBy;
                                setTempDuration({ hours: val ? Math.floor(val / 60) : '', minutes: val ? val % 60 : '' });
                            }} className={`px-4 py-1 border rounded-md text-sm hover:bg-slate-50 transition-colors ${formData.attendanceDetails?.automationRules?.autoHalfDayIfLateBy ? 'border-blue-500 text-blue-600 font-medium' : 'border-slate-200 text-slate-500'}`}>
                                {formatDuration(formData.attendanceDetails?.automationRules?.autoHalfDayIfLateBy)}
                            </button>
                        </div>
                        <div className="p-4 flex items-center justify-between">
                            <span className="font-semibold text-sm text-slate-700">Mandatory half day hours</span>
                            <button type="button" onClick={() => {
                                setDurationModalField('mandatoryHalfDayHours');
                                const val = formData.attendanceDetails?.automationRules?.mandatoryHalfDayHours;
                                setTempDuration({ hours: val ? Math.floor(val / 60) : '', minutes: val ? val % 60 : '' });
                            }} className={`px-4 py-1 border rounded-md text-sm hover:bg-slate-50 transition-colors ${formData.attendanceDetails?.automationRules?.mandatoryHalfDayHours ? 'border-blue-500 text-blue-600 font-medium' : 'border-slate-200 text-slate-500'}`}>
                                {formatDuration(formData.attendanceDetails?.automationRules?.mandatoryHalfDayHours)}
                            </button>
                        </div>
                        <div className="p-4 flex items-center justify-between">
                            <span className="font-semibold text-sm text-slate-700">Mandatory full day hours</span>
                            <button type="button" onClick={() => {
                                setDurationModalField('mandatoryFullDayHours');
                                const val = formData.attendanceDetails?.automationRules?.mandatoryFullDayHours;
                                setTempDuration({ hours: val ? Math.floor(val / 60) : '', minutes: val ? val % 60 : '' });
                            }} className={`px-4 py-1 border rounded-md text-sm hover:bg-slate-50 transition-colors ${formData.attendanceDetails?.automationRules?.mandatoryFullDayHours ? 'border-blue-500 text-blue-600 font-medium' : 'border-slate-200 text-slate-500'}`}>
                                {formatDuration(formData.attendanceDetails?.automationRules?.mandatoryFullDayHours)}
                            </button>
                        </div>
                    </div>
                ) : null}

              </div>
            )}



            
            {activeTab === "payroll" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600"><DollarSign size={20} /></div>
                  <div><h3 className="text-lg font-bold text-slate-900">Salary Details</h3></div>
                </div>
                
                <div className="grid grid-cols-4 gap-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">Effective Date of Change</label>
                    <input type="month" className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white" value={formData.salaryDetails?.effectiveDate || ''} onChange={(e) => handleSalaryDetailsChange('effectiveDate', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">Salary Type</label>
                    <select className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white" value={formData.salaryDetails?.salaryType || 'Per Month'} onChange={(e) => handleSalaryDetailsChange('salaryType', e.target.value)}>
                        <option value="Per Month">Per Month</option>
                        <option value="Per Day">Per Day</option>
                        <option value="Per Hour">Per Hour</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">Salary Structure</label>
                    <select className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white" value={formData.salaryDetails?.salaryStructure || 'default'} onChange={(e) => handleSalaryDetailsChange('salaryStructure', e.target.value)}>
                        <option value="default">Default</option>
                        <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">CTC Amount</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2 text-slate-400">₹</span>
                        <input type="number" className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white" value={formData.salaryDetails?.ctcAmount || ''} onChange={(e) => handleSalaryDetailsChange('ctcAmount', e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* Earnings */}
                <div>
                    <div className="bg-slate-50 p-3 border-y border-slate-200 font-bold text-sm text-slate-800">Earnings</div>
                    <div className="p-4">
                        <div className="flex text-xs font-bold text-slate-500 mb-4 px-2">
                            <div className="w-1/3">Heads</div>
                            <div className="w-1/3">Calculation</div>
                            <div className="w-1/3 text-right">Amount</div>
                        </div>
                        <div className="space-y-3">
                            {(formData.salaryDetails?.earnings || []).map((earning, idx) => (
                                <div key={idx} className="flex items-center px-2 group">
                                    <div className="w-1/3 text-sm text-slate-700">
                                        {formData.salaryDetails?.salaryStructure === 'custom' ? (
                                            <input type="text" className="w-3/4 px-2 py-1 border rounded" value={earning.head} onChange={(e) => handleEarningChange(idx, 'head', e.target.value)} />
                                        ) : (
                                            <span className="text-slate-500 font-medium">{earning.head}</span>
                                        )}
                                    </div>
                                    <div className="w-1/3">
                                        <select disabled={formData.salaryDetails?.salaryStructure === 'default' || earning.head?.toLowerCase() === 'basic' || earning.head?.toLowerCase() === 'hra'} className="w-44 px-3 py-1.5 border border-slate-200 rounded-md text-sm bg-white disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed disabled:border-slate-100 transition-colors" value={earning.calculation} onChange={(e) => handleEarningChange(idx, 'calculation', e.target.value)}>
                                            <option value="On Attendance">On Attendance</option>
                                            <option value="Flat Rate">Flat Rate</option>
                                        </select>
                                    </div>
                                    <div className="w-1/3 flex justify-end items-center">
                                        <div className="relative">
                                            <span className={`absolute left-2 top-1.5 text-sm ${formData.salaryDetails?.salaryStructure === 'default' ? 'text-slate-300' : 'text-slate-400'}`}>₹</span>
                                            <input type="number" disabled={formData.salaryDetails?.salaryStructure === 'default'} className="w-32 pl-6 pr-2 py-1.5 border border-slate-200 rounded-md text-sm bg-white disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed disabled:border-slate-100 transition-colors" value={earning.amount} onChange={(e) => handleEarningChange(idx, 'amount', e.target.value)} />
                                        </div>
                                        {formData.salaryDetails?.salaryStructure === 'custom' && (
                                            <button type="button" onClick={() => {
                                                const newE = [...formData.salaryDetails.earnings];
                                                newE.splice(idx, 1);
                                                setFormData({...formData, salaryDetails: {...formData.salaryDetails, earnings: newE}});
                                            }} className="ml-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><X size={16}/></button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {formData.salaryDetails?.salaryStructure === 'custom' && (
                            <button type="button" onClick={() => {
                                setFormData({...formData, salaryDetails: {...formData.salaryDetails, earnings: [...(formData.salaryDetails?.earnings||[]), {head: '', calculation: 'On Attendance', amount: 0}]}});
                            }} className="mt-4 text-blue-500 font-medium text-sm flex items-center gap-1 hover:text-blue-600"><Plus size={16}/> Add Earning</button>
                        )}
                    </div>
                </div>

                {/* Compliances */}
                <div>
                    <div className="bg-slate-50 p-3 border-y border-slate-200 font-bold text-sm text-slate-800">Compliances</div>
                    <div className="p-4">
                        {/* Employer Contributions */}
                        <div className="mb-8">
                            <h4 className="font-bold text-sm text-slate-800 mb-4">Employer Contributions</h4>
                            <div className="flex text-xs font-bold text-slate-500 mb-4 px-2">
                                <div className="w-1/3">Heads</div>
                                <div className="w-1/4">Calculation</div>
                                <div className="w-1/4">Included in CTC</div>
                                <div className="w-1/6 text-right">Amount</div>
                            </div>
                            <div className="space-y-3">
                                {(formData.salaryDetails?.employerContributions || []).map((comp, idx) => {
                                    const employerPf = (formData.salaryDetails?.employerContributions || []).find(c => c.head === 'Employer PF');
                                    const pfIsNone = !employerPf || !employerPf.calculation || employerPf.calculation === 'None';
                                    
                                    const isPfEdli = comp.head === 'PF EDLI & Admin Charges';
                                    const isEmployerEsi = comp.head === 'Employer ESI';
                                    const pfEdliDisabled = isPfEdli && pfIsNone;
                                    
                                    return (
                                    <div key={idx} className="flex items-center px-2">
                                        <div className="w-1/3 text-sm text-slate-700">{comp.head}</div>
                                        <div className="w-1/4">
                                            {isPfEdli ? (
                                                <select 
                                                    disabled={pfEdliDisabled} 
                                                    className="w-44 px-3 py-1.5 border border-slate-200 rounded-md text-sm bg-white disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed" 
                                                    value={comp.calculation} 
                                                    onChange={(e) => handleEmployerContribChange(idx, 'calculation', e.target.value)}
                                                >
                                                    <option value="None">None</option>
                                                    <option value="1% Variable">1% Variable</option>
                                                </select>
                                            ) : isEmployerEsi ? (
                                                <select 
                                                    className="w-44 px-3 py-1.5 border border-slate-200 rounded-md text-sm bg-white" 
                                                    value={comp.calculation} 
                                                    onChange={(e) => handleEmployerContribChange(idx, 'calculation', e.target.value)}
                                                >
                                                    <option value="None">None</option>
                                                    <option value="3.25% Variable">3.25% Variable</option>
                                                </select>
                                            ) : (
                                                <div className="w-44">
                                                    <CalculationDropdown 
                                                        selected={comp.calculation}
                                                        onChange={(val) => handleEmployerContribChange(idx, 'calculation', val)}
                                                        options={getComplianceOptions(comp)}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div className="w-1/4 pl-8">
                                            <input 
                                                type="checkbox" 
                                                className="w-4 h-4 rounded border-slate-300 text-blue-600 disabled:bg-slate-100 disabled:border-slate-200 disabled:cursor-not-allowed" 
                                                checked={isPfEdli ? (!pfIsNone && comp.calculation !== 'None' ? true : comp.includedInCtc) : comp.includedInCtc} 
                                                onChange={(e) => handleEmployerContribChange(idx, 'includedInCtc', e.target.checked)} 
                                                disabled={isPfEdli} 
                                            />
                                            {isPfEdli && <span className="ml-2 text-xs text-slate-400">{!pfIsNone && comp.calculation !== 'None' ? 'Yes' : 'N/A'}</span>}
                                        </div>
                                        <div className="w-1/6 flex justify-end items-center">
                                            <div className="relative">
                                                <span className={`absolute left-2 top-1.5 text-sm ${pfEdliDisabled ? 'text-slate-300' : 'text-slate-400'}`}>₹</span>
                                                <input 
                                                    type="number" 
                                                    disabled={pfEdliDisabled}
                                                    className="w-24 pl-6 pr-2 py-1.5 border border-slate-200 rounded-md text-sm bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed" 
                                                    value={pfEdliDisabled ? 0 : comp.amount} 
                                                    onChange={(e) => handleEmployerContribChange(idx, 'amount', e.target.value)} 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Employee Contributions */}
                        <div>
                            <h4 className="font-bold text-sm text-slate-800 mb-4">Employee Contributions</h4>
                            <div className="flex text-xs font-bold text-slate-500 mb-4 px-2">
                                <div className="w-1/3">Heads</div>
                                <div className="w-1/3">Calculation</div>
                                <div className="w-1/3 text-right">Amount</div>
                            </div>
                            <div className="space-y-3">
                                {(formData.salaryDetails?.employeeContributions || []).map((comp, idx) => {
                                    const isEmployeeEsi = comp.head === 'Employee ESI';
                                    return (
                                    <div key={idx} className="flex items-center px-2">
                                        <div className="w-1/3 text-sm text-slate-700">{comp.head}</div>
                                        <div className="w-1/3">
                                            {isEmployeeEsi ? (
                                                <select 
                                                    className="w-44 px-3 py-1.5 border border-slate-200 rounded-md text-sm bg-white" 
                                                    value={comp.calculation} 
                                                    onChange={(e) => handleEmployeeContribChange(idx, 'calculation', e.target.value)}
                                                >
                                                    <option value="None">None</option>
                                                    <option value="0.75% Variable">0.75% Variable</option>
                                                </select>
                                            ) : (
                                                <div className="w-44">
                                                    <CalculationDropdown 
                                                        selected={comp.calculation}
                                                        onChange={(val) => handleEmployeeContribChange(idx, 'calculation', val)}
                                                        options={getComplianceOptions(comp)}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div className="w-1/3 flex justify-end items-center">
                                            {(comp.head === 'Professional Tax' || comp.head === 'TDS') ? (
                                                <div className="w-32 py-1.5 bg-slate-100 border border-slate-100 rounded-md text-center cursor-not-allowed">
                                                    <span className="text-xs text-slate-400 italic">System calculated</span>
                                                </div>
                                            ) : (
                                                <div className="relative">
                                                    <span className="absolute left-2 top-1.5 text-slate-400 text-sm">₹</span>
                                                    <input type="number" className="w-32 pl-6 pr-2 py-1.5 border border-slate-200 rounded-md text-sm bg-slate-50" value={comp.amount} onChange={(e) => handleEmployeeContribChange(idx, 'amount', e.target.value)} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Deductions */}
                <div>
                    <div className="bg-slate-50 p-3 border-y border-slate-200 font-bold text-sm text-slate-800">Deductions</div>
                    <div className="p-4">
                        <div className="flex text-xs font-bold text-slate-500 mb-4 px-2">
                            <div className="w-1/3">Heads</div>
                            <div className="w-1/3">Calculation</div>
                            <div className="w-1/3 text-right">Amount</div>
                        </div>
                        {(!formData.salaryDetails?.deductions || formData.salaryDetails.deductions.length === 0) ? (
                            <p className="text-xs text-slate-500 px-2 py-4">No Deductions Added</p>
                        ) : (
                            <div className="space-y-3 mb-4">
                                {formData.salaryDetails.deductions.map((ded, idx) => (
                                    <div key={idx} className="flex items-center px-2 group">
                                        <div className="w-1/3 text-sm text-slate-700">
                                            <input type="text" className="w-3/4 px-2 py-1 border rounded" value={ded.head} onChange={(e) => handleDeductionChange(idx, 'head', e.target.value)} />
                                        </div>
                                        <div className="w-1/3">
                                            <select className="px-3 py-1.5 border border-slate-200 rounded-md text-sm bg-white" value={ded.calculation} onChange={(e) => handleDeductionChange(idx, 'calculation', e.target.value)}>
                                                <option value="None">None</option>
                                                <option value="Flat Rate">Flat Rate</option>
                                            </select>
                                        </div>
                                        <div className="w-1/3 flex justify-end items-center">
                                            <div className="relative">
                                                <span className="absolute left-2 top-1.5 text-slate-400 text-sm">₹</span>
                                                <input type="number" className="w-32 pl-6 pr-2 py-1.5 border border-slate-200 rounded-md text-sm bg-white" value={ded.amount} onChange={(e) => handleDeductionChange(idx, 'amount', e.target.value)} />
                                            </div>
                                            <button type="button" onClick={() => {
                                                const newD = [...formData.salaryDetails.deductions];
                                                newD.splice(idx, 1);
                                                setFormData({...formData, salaryDetails: {...formData.salaryDetails, deductions: newD}});
                                            }} className="ml-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><X size={16}/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <button type="button" onClick={() => {
                            setFormData({...formData, salaryDetails: {...formData.salaryDetails, deductions: [...(formData.salaryDetails?.deductions||[]), {head: 'New Deduction', calculation: 'None', amount: 0}]}});
                        }} className="text-blue-500 font-medium text-sm flex items-center gap-1 hover:text-blue-600"><Plus size={16}/> Add Deduction</button>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <div className="text-sm">
                            <span className="text-slate-500 mr-2">Total CTC:</span>
                            <span className="font-bold text-slate-800 text-lg">₹ {parseFloat(formData.salaryDetails?.ctcAmount || 0).toFixed(2)} /{formData.salaryDetails?.salaryType === 'Per Month' ? 'Month' : formData.salaryDetails?.salaryType === 'Per Day' ? 'Day' : 'Hour'}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button disabled={saving} type="submit" className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md transition-all disabled:opacity-50 flex items-center gap-2">
                            {saving ? "Saving..." : "Update Details"}
                        </button>
                    </div>
                </div>

              </div>
            )}

            {activeTab === "leave" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600"><Calendar size={20} /></div>
                  <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900 cursor-pointer hover:text-blue-600" onClick={() => setLeaveSubView(null)}>Leave Details</h3>
                        {leaveSubView && (
                            <>
                                <ChevronRight size={16} className="text-slate-400" />
                                <span className="text-sm font-medium text-slate-600">{leaveSubView === 'policy' ? 'Leave Policy' : 'Leave Balance'}</span>
                            </>
                        )}
                      </div>
                  </div>
                  {leaveSubView && (
                      <button disabled={saving} type="submit" className="px-6 py-2 bg-[#007bff] hover:bg-blue-600 text-white rounded-md text-sm font-bold shadow-sm transition-all disabled:opacity-50">
                        {saving ? "Saving..." : "Update Details"}
                      </button>
                  )}
                </div>

                {!leaveSubView ? (
                    <div className="space-y-4">
                        <button type="button" onClick={() => setLeaveSubView('policy')} className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all">
                            <span className="font-medium text-slate-800 text-sm">Leave Policy</span>
                            <ChevronRight size={16} className="text-slate-400" />
                        </button>
                        <button type="button" onClick={() => setLeaveSubView('balance')} className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all">
                            <span className="font-medium text-slate-800 text-sm">Leave Balance</span>
                            <ChevronRight size={16} className="text-slate-400" />
                        </button>
                    </div>
                ) : leaveSubView === 'policy' ? (
                    <div className="space-y-6">
                        <div className="flex items-center gap-12 p-4 bg-[#f4f8fb] rounded-lg border border-slate-200">
                            <span className="font-bold text-sm text-slate-800">Leave Cycle</span>
                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                                    <input type="radio" name="leaveCycle" value="Monthly" checked={formData.leaveDetails?.leaveCycle === 'Monthly'} onChange={() => setFormData({...formData, leaveDetails: {...formData.leaveDetails, leaveCycle: 'Monthly'}})} className="w-4 h-4 text-blue-600" />
                                    Monthly
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                                    <input type="radio" name="leaveCycle" value="Yearly" checked={formData.leaveDetails?.leaveCycle === 'Yearly'} onChange={() => setFormData({...formData, leaveDetails: {...formData.leaveDetails, leaveCycle: 'Yearly'}})} className="w-4 h-4 text-blue-600" />
                                    Yearly
                                </label>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {(formData.leaveDetails?.leavePolicy || []).map((policy, idx) => (
                                <div key={idx} className="border border-slate-200 rounded-lg bg-white overflow-hidden">
                                    <div className="bg-[#fcfdfd] px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                                        <span className="font-bold text-sm text-slate-800">{policy.leaveType}</span>
                                        <button type="button" onClick={() => {
                                            const newPolicy = [...formData.leaveDetails.leavePolicy];
                                            newPolicy.splice(idx, 1);
                                            const newBalance = [...formData.leaveDetails.leaveBalance];
                                            newBalance.splice(idx, 1);
                                            setFormData({...formData, leaveDetails: {...formData.leaveDetails, leavePolicy: newPolicy, leaveBalance: newBalance}});
                                        }} className="text-red-500 hover:text-red-700"><X size={16} /></button>
                                    </div>
                                    <div className="p-4 space-y-4">
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm text-slate-600 w-48">Allowed Leaves</span>
                                            <input type="number" min="0" value={policy.allowedLeaves} onChange={(e) => {
                                                const newPolicy = [...formData.leaveDetails.leavePolicy];
                                                newPolicy[idx].allowedLeaves = Number(e.target.value);
                                                setFormData({...formData, leaveDetails: {...formData.leaveDetails, leavePolicy: newPolicy}});
                                            }} className="w-32 px-3 py-1.5 border border-slate-200 rounded text-sm" />
                                            <span className="text-sm text-slate-500">leaves per {formData.leaveDetails?.leaveCycle === 'Yearly' ? 'year' : 'month'}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm text-slate-600 w-48">Carry Forward Leaves</span>
                                            <input type="number" min="0" value={policy.carryForwardLeaves} onChange={(e) => {
                                                const newPolicy = [...formData.leaveDetails.leavePolicy];
                                                newPolicy[idx].carryForwardLeaves = Number(e.target.value);
                                                setFormData({...formData, leaveDetails: {...formData.leaveDetails, leavePolicy: newPolicy}});
                                            }} className="w-32 px-3 py-1.5 border border-slate-200 rounded text-sm" />
                                            <span className="text-sm text-slate-500">leaves on {formData.leaveDetails?.leaveCycle === 'Yearly' ? 'year' : 'month'} end</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div>
                            <button type="button" onClick={() => {
                                setNewLeaveTypeName('');
                                setShowLeaveTypeModal(true);
                            }} className="px-4 py-2 border border-blue-400 text-blue-500 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-blue-50"><Plus size={16}/> Add Leave Type</button>
                        </div>
                    </div>
                ) : leaveSubView === 'balance' ? (
                    <div className="space-y-4">
                        <div className="bg-[#f4f8fb] border border-slate-200 rounded-lg p-3 flex font-bold text-sm text-slate-800">
                            <div className="flex-1">Leave Type</div>
                            <div className="flex-1">Remaining Balance</div>
                        </div>
                        <div className="space-y-3">
                            {(formData.leaveDetails?.leaveBalance || []).map((balance, idx) => (
                                <div key={idx} className="flex items-center p-3 border border-slate-200 rounded-lg bg-white">
                                    <div className="flex-1 text-sm font-bold text-slate-700">{balance.leaveType}</div>
                                    <div className="flex-1 flex items-center gap-3">
                                        <input type="number" min="0" value={balance.remainingBalance} onChange={(e) => {
                                            const newBalance = [...formData.leaveDetails.leaveBalance];
                                            newBalance[idx].remainingBalance = Number(e.target.value);
                                            setFormData({...formData, leaveDetails: {...formData.leaveDetails, leaveBalance: newBalance}});
                                        }} className="w-32 px-3 py-1.5 border border-slate-200 rounded text-sm" />
                                        <span className="text-sm text-slate-500">leaves</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null}
              </div>
            )}

            {activeTab === "penalty" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600"><AlertCircle size={20} /></div>
                  <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900 cursor-pointer hover:text-blue-600" onClick={() => setPenaltySubView(null)}>Penalty & Overtime Details</h3>
                        {penaltySubView && (
                            <>
                                <ChevronRight size={16} className="text-slate-400" />
                                <span className="text-sm font-medium text-slate-600">{penaltySubView === 'early' ? 'Early Leaving Policy' : penaltySubView === 'late' ? 'Late Coming Policy' : 'Overtime Policy'}</span>
                            </>
                        )}
                      </div>
                  </div>
                  {penaltySubView && (
                      <button disabled={saving} type="submit" className="px-6 py-2 bg-[#007bff] hover:bg-blue-600 text-white rounded-md text-sm font-bold shadow-sm transition-all disabled:opacity-50">
                        {saving ? "Saving..." : "Update Details"}
                      </button>
                  )}
                </div>

                {!penaltySubView ? (
                    <div className="space-y-4">
                        <button type="button" onClick={() => setPenaltySubView('early')} className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all">
                            <span className="font-medium text-slate-800 text-sm">Early Leaving Policy</span>
                            <ChevronRight size={16} className="text-slate-400" />
                        </button>
                        <button type="button" onClick={() => setPenaltySubView('late')} className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all">
                            <span className="font-medium text-slate-800 text-sm">Late Coming Policy</span>
                            <ChevronRight size={16} className="text-slate-400" />
                        </button>
                        <button type="button" onClick={() => setPenaltySubView('overtime')} className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all">
                            <span className="font-medium text-slate-800 text-sm">Overtime Policy</span>
                            <ChevronRight size={16} className="text-slate-400" />
                        </button>
                    </div>
                ) : penaltySubView === 'early' ? (
                    <div className="space-y-6">
                        <div className="space-y-4 max-w-lg">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Allowed Early Leaving Days <span className="text-red-500">*</span></label>
                                <div className="flex items-center">
                                    <input type="number" min="0" value={formData.penaltyDetails?.earlyAllowedDays || 0} onChange={e => setFormData({...formData, penaltyDetails: {...formData.penaltyDetails, earlyAllowedDays: Number(e.target.value)}})} className="w-full px-3 py-2 border border-slate-200 rounded-l-lg text-sm" />
                                    <span className="px-4 py-2 bg-slate-50 border border-l-0 border-slate-200 rounded-r-lg text-sm text-slate-500">days</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Only deduct if they leave earlier than <span className="text-red-500">*</span></label>
                                <div className="flex items-center">
                                    <input type="number" min="0" value={formData.penaltyDetails?.earlyMins || 0} onChange={e => setFormData({...formData, penaltyDetails: {...formData.penaltyDetails, earlyMins: Number(e.target.value)}})} className="w-full px-3 py-2 border border-slate-200 rounded-l-lg text-sm" />
                                    <span className="px-4 py-2 bg-slate-50 border border-l-0 border-slate-200 rounded-r-lg text-sm text-slate-500">mins</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-2">Change deduction based on how early they leave? <span className="text-red-500">*</span></label>
                                <div className="space-y-2">
                                    <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${formData.penaltyDetails?.earlyDynamic === false || formData.penaltyDetails?.earlyDynamic === undefined ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200'}`}>
                                        <input type="radio" name="earlyDynamic" checked={formData.penaltyDetails?.earlyDynamic === false || formData.penaltyDetails?.earlyDynamic === undefined} onChange={() => setFormData({...formData, penaltyDetails: {...formData.penaltyDetails, earlyDynamic: false}})} className="w-4 h-4 text-blue-600" />
                                        <span className="text-sm text-slate-700">No, use a fixed deduction for early leaving</span>
                                    </label>
                                    <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${formData.penaltyDetails?.earlyDynamic === true ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200'}`}>
                                        <input type="radio" name="earlyDynamic" checked={formData.penaltyDetails?.earlyDynamic === true} onChange={() => setFormData({...formData, penaltyDetails: {...formData.penaltyDetails, earlyDynamic: true}})} className="w-4 h-4 text-blue-600" />
                                        <span className="text-sm text-slate-700">Yes, deduct based on how early they left</span>
                                    </label>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Deduction <span className="text-red-500">*</span></label>
                                    <select value={formData.penaltyDetails?.earlyDeductionType || 'Fixed Daily Rate'} onChange={e => setFormData({...formData, penaltyDetails: {...formData.penaltyDetails, earlyDeductionType: e.target.value}})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                                        <option value="Half Day Salary">Half Day Salary</option>
                                        <option value="Full Day Salary">Full Day Salary</option>
                                        <option value="1.5x Daily Salary">1.5x Daily Salary</option>
                                        <option value="Custom Multiplier">Custom Multiplier</option>
                                        <option value="Fixed Daily Rate">Fixed Daily Rate</option>
                                    </select>
                                </div>
                                {['Fixed Daily Rate', 'Custom Multiplier'].includes(formData.penaltyDetails?.earlyDeductionType || 'Fixed Daily Rate') && (
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Amount <span className="text-red-500">*</span></label>
                                    <div className="flex items-center">
                                        {(formData.penaltyDetails?.earlyDeductionType || 'Fixed Daily Rate') === 'Fixed Daily Rate' && (
                                            <span className="px-3 py-2 bg-slate-50 border border-r-0 border-slate-200 rounded-l-lg text-sm text-slate-500">₹</span>
                                        )}
                                        <input type="number" min="0" value={formData.penaltyDetails?.earlyAmount || 0} onChange={e => setFormData({...formData, penaltyDetails: {...formData.penaltyDetails, earlyAmount: Number(e.target.value)}})} className={`w-full px-3 py-2 border border-slate-200 text-sm ${(formData.penaltyDetails?.earlyDeductionType || 'Fixed Daily Rate') === 'Fixed Daily Rate' ? 'rounded-none' : 'rounded-l-lg'}`} />
                                        <span className="px-3 py-2 bg-slate-50 border border-l-0 border-slate-200 rounded-r-lg text-sm text-slate-500 whitespace-nowrap">
                                            {(formData.penaltyDetails?.earlyDeductionType || 'Fixed Daily Rate') === 'Fixed Daily Rate' ? '/day' : '* /daily salary'}
                                        </span>
                                    </div>
                                </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : penaltySubView === 'late' ? (
                    <div className="space-y-6">
                        <div className="space-y-4 max-w-lg">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Allowed Late Days <span className="text-red-500">*</span></label>
                                <div className="flex items-center">
                                    <input type="number" min="0" value={formData.penaltyDetails?.lateAllowedDays || 0} onChange={e => setFormData({...formData, penaltyDetails: {...formData.penaltyDetails, lateAllowedDays: Number(e.target.value)}})} className="w-full px-3 py-2 border border-slate-200 rounded-l-lg text-sm" />
                                    <span className="px-4 py-2 bg-slate-50 border border-l-0 border-slate-200 rounded-r-lg text-sm text-slate-500">days</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Only deduct if late by more than <span className="text-red-500">*</span></label>
                                <div className="flex items-center">
                                    <input type="number" min="0" value={formData.penaltyDetails?.lateMins || 0} onChange={e => setFormData({...formData, penaltyDetails: {...formData.penaltyDetails, lateMins: Number(e.target.value)}})} className="w-full px-3 py-2 border border-slate-200 rounded-l-lg text-sm" />
                                    <span className="px-4 py-2 bg-slate-50 border border-l-0 border-slate-200 rounded-r-lg text-sm text-slate-500">mins</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-2">Change deduction based on how late they arrive? <span className="text-red-500">*</span></label>
                                <div className="space-y-2">
                                    <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${formData.penaltyDetails?.lateDynamic === false || formData.penaltyDetails?.lateDynamic === undefined ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200'}`}>
                                        <input type="radio" name="lateDynamic" checked={formData.penaltyDetails?.lateDynamic === false || formData.penaltyDetails?.lateDynamic === undefined} onChange={() => setFormData({...formData, penaltyDetails: {...formData.penaltyDetails, lateDynamic: false}})} className="w-4 h-4 text-blue-600" />
                                        <span className="text-sm text-slate-700">No, use a fixed deduction for late arrival</span>
                                    </label>
                                    <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${formData.penaltyDetails?.lateDynamic === true ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200'}`}>
                                        <input type="radio" name="lateDynamic" checked={formData.penaltyDetails?.lateDynamic === true} onChange={() => setFormData({...formData, penaltyDetails: {...formData.penaltyDetails, lateDynamic: true}})} className="w-4 h-4 text-blue-600" />
                                        <span className="text-sm text-slate-700">Yes, deduct based on how late they arrived</span>
                                    </label>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Deduction <span className="text-red-500">*</span></label>
                                    <select value={formData.penaltyDetails?.lateDeductionType || 'Fixed Hourly Rate'} onChange={e => setFormData({...formData, penaltyDetails: {...formData.penaltyDetails, lateDeductionType: e.target.value}})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                                        <option value="0.5x Hourly Salary">0.5x Hourly Salary</option>
                                        <option value="1x Hourly Salary">1x Hourly Salary</option>
                                        <option value="1.5x Hourly Salary">1.5x Hourly Salary</option>
                                        <option value="Custom Multiplier">Custom Multiplier</option>
                                        <option value="Fixed Hourly Rate">Fixed Hourly Rate</option>
                                    </select>
                                </div>
                                {['Fixed Hourly Rate', 'Custom Multiplier'].includes(formData.penaltyDetails?.lateDeductionType || 'Fixed Hourly Rate') && (
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Amount <span className="text-red-500">*</span></label>
                                    <div className="flex items-center">
                                        {(formData.penaltyDetails?.lateDeductionType || 'Fixed Hourly Rate') === 'Fixed Hourly Rate' && (
                                            <span className="px-3 py-2 bg-slate-50 border border-r-0 border-slate-200 rounded-l-lg text-sm text-slate-500">₹</span>
                                        )}
                                        <input type="number" min="0" value={formData.penaltyDetails?.lateAmount || 50} onChange={e => setFormData({...formData, penaltyDetails: {...formData.penaltyDetails, lateAmount: Number(e.target.value)}})} className={`w-full px-3 py-2 border border-slate-200 text-sm ${(formData.penaltyDetails?.lateDeductionType || 'Fixed Hourly Rate') === 'Fixed Hourly Rate' ? 'rounded-none' : 'rounded-l-lg'}`} />
                                        <span className="px-3 py-2 bg-slate-50 border border-l-0 border-slate-200 rounded-r-lg text-sm text-slate-500 whitespace-nowrap">
                                            {(formData.penaltyDetails?.lateDeductionType || 'Fixed Hourly Rate') === 'Fixed Hourly Rate' ? '/hour' : '* /hourly salary'}
                                        </span>
                                    </div>
                                </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : penaltySubView === 'overtime' ? (
                    <div className="space-y-6">
                        <div className="space-y-6 max-w-lg">
                            <div>
                                <h4 className="font-bold text-sm text-slate-800 mb-4">Working Days</h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Overtime considered after <span className="text-red-500">*</span></label>
                                        <div className="flex items-center">
                                            <input type="number" min="0" value={formData.penaltyDetails?.overtimeMins || 0} onChange={e => setFormData({...formData, penaltyDetails: {...formData.penaltyDetails, overtimeMins: Number(e.target.value)}})} className="w-full px-3 py-2 border border-slate-200 rounded-l-lg text-sm" />
                                            <span className="px-4 py-2 bg-slate-50 border border-l-0 border-slate-200 rounded-r-lg text-sm text-slate-500">mins</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Extra Hours Pay <span className="text-red-500">*</span></label>
                                            <select value={formData.penaltyDetails?.overtimeExtraPayType || 'Fixed Hourly Rate'} onChange={e => setFormData({...formData, penaltyDetails: {...formData.penaltyDetails, overtimeExtraPayType: e.target.value}})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                                                <option value="0.5x Hourly Salary">0.5x Hourly Salary</option>
                                                <option value="1x Hourly Salary">1x Hourly Salary</option>
                                                <option value="1.5x Hourly Salary">1.5x Hourly Salary</option>
                                                <option value="Custom Multiplier">Custom Multiplier</option>
                                                <option value="Fixed Hourly Rate">Fixed Hourly Rate</option>
                                            </select>
                                        </div>
                                        {['Fixed Hourly Rate', 'Custom Multiplier'].includes(formData.penaltyDetails?.overtimeExtraPayType || 'Fixed Hourly Rate') && (
                                        <div className="flex-1">
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Amount <span className="text-red-500">*</span></label>
                                            <div className="flex items-center">
                                                {(formData.penaltyDetails?.overtimeExtraPayType || 'Fixed Hourly Rate') === 'Fixed Hourly Rate' && (
                                                    <span className="px-3 py-2 bg-slate-50 border border-r-0 border-slate-200 rounded-l-lg text-sm text-slate-500">₹</span>
                                                )}
                                                <input type="number" min="0" value={formData.penaltyDetails?.overtimeExtraAmount || 0} onChange={e => setFormData({...formData, penaltyDetails: {...formData.penaltyDetails, overtimeExtraAmount: Number(e.target.value)}})} className={`w-full px-3 py-2 border border-slate-200 text-sm ${(formData.penaltyDetails?.overtimeExtraPayType || 'Fixed Hourly Rate') === 'Fixed Hourly Rate' ? 'rounded-none' : 'rounded-l-lg'}`} />
                                                <span className="px-3 py-2 bg-slate-50 border border-l-0 border-slate-200 rounded-r-lg text-sm text-slate-500 whitespace-nowrap">
                                                    {(formData.penaltyDetails?.overtimeExtraPayType || 'Fixed Hourly Rate') === 'Fixed Hourly Rate' ? '/hour' : '* /hourly salary'}
                                                </span>
                                            </div>
                                        </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-slate-800 mb-4 pt-4 border-t border-slate-100">Weekoffs and Holidays</h4>
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Public Holiday Pay <span className="text-red-500">*</span></label>
                                            <select value={formData.penaltyDetails?.overtimeHolidayPayType || 'Fixed Daily Rate'} onChange={e => setFormData({...formData, penaltyDetails: {...formData.penaltyDetails, overtimeHolidayPayType: e.target.value}})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                                                <option value="Half Day Salary">Half Day Salary</option>
                                                <option value="Full Day Salary">Full Day Salary</option>
                                                <option value="1.5x Daily Salary">1.5x Daily Salary</option>
                                                <option value="Custom Multiplier">Custom Multiplier</option>
                                                <option value="Fixed Daily Rate">Fixed Daily Rate</option>
                                            </select>
                                        </div>
                                        {['Fixed Daily Rate', 'Custom Multiplier'].includes(formData.penaltyDetails?.overtimeHolidayPayType || 'Fixed Daily Rate') && (
                                        <div className="flex-1">
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Amount <span className="text-red-500">*</span></label>
                                            <div className="flex items-center">
                                                {(formData.penaltyDetails?.overtimeHolidayPayType || 'Fixed Daily Rate') === 'Fixed Daily Rate' && (
                                                    <span className="px-3 py-2 bg-slate-50 border border-r-0 border-slate-200 rounded-l-lg text-sm text-slate-500">₹</span>
                                                )}
                                                <input type="number" min="0" value={formData.penaltyDetails?.overtimeHolidayAmount || 0} onChange={e => setFormData({...formData, penaltyDetails: {...formData.penaltyDetails, overtimeHolidayAmount: Number(e.target.value)}})} className={`w-full px-3 py-2 border border-slate-200 text-sm ${(formData.penaltyDetails?.overtimeHolidayPayType || 'Fixed Daily Rate') === 'Fixed Daily Rate' ? 'rounded-none' : 'rounded-l-lg'}`} />
                                                <span className="px-3 py-2 bg-slate-50 border border-l-0 border-slate-200 rounded-r-lg text-sm text-slate-500 whitespace-nowrap">
                                                    {(formData.penaltyDetails?.overtimeHolidayPayType || 'Fixed Daily Rate') === 'Fixed Daily Rate' ? '/day' : '* /daily salary'}
                                                </span>
                                            </div>
                                        </div>
                                        )}
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Week Off Pay <span className="text-red-500">*</span></label>
                                            <select value={formData.penaltyDetails?.overtimeWeekoffPayType || 'Fixed Daily Rate'} onChange={e => setFormData({...formData, penaltyDetails: {...formData.penaltyDetails, overtimeWeekoffPayType: e.target.value}})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                                                <option value="Half Day Salary">Half Day Salary</option>
                                                <option value="Full Day Salary">Full Day Salary</option>
                                                <option value="1.5x Daily Salary">1.5x Daily Salary</option>
                                                <option value="Custom Multiplier">Custom Multiplier</option>
                                                <option value="Fixed Daily Rate">Fixed Daily Rate</option>
                                            </select>
                                        </div>
                                        {['Fixed Daily Rate', 'Custom Multiplier'].includes(formData.penaltyDetails?.overtimeWeekoffPayType || 'Fixed Daily Rate') && (
                                        <div className="flex-1">
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Amount <span className="text-red-500">*</span></label>
                                            <div className="flex items-center">
                                                {(formData.penaltyDetails?.overtimeWeekoffPayType || 'Fixed Daily Rate') === 'Fixed Daily Rate' && (
                                                    <span className="px-3 py-2 bg-slate-50 border border-r-0 border-slate-200 rounded-l-lg text-sm text-slate-500">₹</span>
                                                )}
                                                <input type="number" min="0" value={formData.penaltyDetails?.overtimeWeekoffAmount || 0} onChange={e => setFormData({...formData, penaltyDetails: {...formData.penaltyDetails, overtimeWeekoffAmount: Number(e.target.value)}})} className={`w-full px-3 py-2 border border-slate-200 text-sm ${(formData.penaltyDetails?.overtimeWeekoffPayType || 'Fixed Daily Rate') === 'Fixed Daily Rate' ? 'rounded-none' : 'rounded-l-lg'}`} />
                                                <span className="px-3 py-2 bg-slate-50 border border-l-0 border-slate-200 rounded-r-lg text-sm text-slate-500 whitespace-nowrap">
                                                    {(formData.penaltyDetails?.overtimeWeekoffPayType || 'Fixed Daily Rate') === 'Fixed Daily Rate' ? '/day' : '* /daily salary'}
                                                </span>
                                            </div>
                                        </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
              </div>
            )}

            {activeTab === "documents" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-lg">Documents</h3>
                  <button type="button" onClick={() => setShowDocumentModal(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                    <FileText size={16} /> Add Document
                  </button>
                </div>

                <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-100">
                        <th className="p-4 font-bold text-slate-700">Document Type</th>
                        <th className="p-4 font-bold text-slate-700">File Name</th>
                        <th className="p-4 font-bold text-slate-700">Added On</th>
                        <th className="p-4 font-bold text-slate-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {documentsList && documentsList.length > 0 ? documentsList.map(doc => (
                        <tr key={doc._id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 text-slate-700">{doc.documentType === 'Other' ? doc.customDocumentName : doc.documentType}</td>
                          <td className="p-4">
                            <a href={doc.file?.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline">
                              <FileText size={16} className="text-blue-500" />
                              {doc.file?.name || 'Document'}
                            </a>
                          </td>
                          <td className="p-4 text-slate-500">{new Date(doc.addedOn).toLocaleDateString()}</td>
                          <td className="p-4">
                            <button type="button" onClick={() => handleDocumentDelete(doc._id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Delete Document">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="4" className="p-8 text-center text-slate-500">No documents added yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab !== "personal" && activeTab !== "payroll" && activeTab !== "leave" && activeTab !== "penalty" && activeTab !== "documents" && (
              <div className="pt-6 border-t border-slate-100 flex justify-end">
                <button disabled={saving} type="submit" className="px-8 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-lg shadow-brand-600/20 transition-all disabled:opacity-50">
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      </div>

      {/* Past Employment Modal */}
      {showPastEmploymentModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
                  <div className="p-4 border-b border-slate-100">
                      <h3 className="font-bold text-lg text-slate-900">Past Employment Details</h3>
                  </div>
                  <div className="p-6 space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Company Name <span className="text-red-500">*</span></label>
                          <input type="text" className="w-full px-3 py-2 border rounded-lg text-sm" value={pastEmpForm.companyName} onChange={e => setPastEmpForm({...pastEmpForm, companyName: e.target.value})} />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Designation</label>
                          <input type="text" className="w-full px-3 py-2 border rounded-lg text-sm" value={pastEmpForm.designation} onChange={e => setPastEmpForm({...pastEmpForm, designation: e.target.value})} />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Joining Date <span className="text-red-500">*</span></label>
                          <input type="date" className="w-full px-3 py-2 border rounded-lg text-sm" value={pastEmpForm.joiningDate} onChange={e => setPastEmpForm({...pastEmpForm, joiningDate: e.target.value})} />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Leaving Date <span className="text-red-500">*</span></label>
                          <input type="date" className="w-full px-3 py-2 border rounded-lg text-sm" value={pastEmpForm.leavingDate} onChange={e => setPastEmpForm({...pastEmpForm, leavingDate: e.target.value})} />
                      </div>
                      <div className="flex gap-4">
                          <div className="w-1/3">
                              <label className="block text-xs font-bold text-slate-700 mb-1">Currency</label>
                              <select className="w-full px-3 py-2 border rounded-lg text-sm bg-white" value={pastEmpForm.currency} onChange={e => setPastEmpForm({...pastEmpForm, currency: e.target.value})}>
                                  <option value="INR">INR</option>
                                  <option value="USD">USD</option>
                              </select>
                          </div>
                          <div className="flex-1">
                              <label className="block text-xs font-bold text-slate-700 mb-1">Salary</label>
                              <input type="number" className="w-full px-3 py-2 border rounded-lg text-sm" value={pastEmpForm.salary} onChange={e => setPastEmpForm({...pastEmpForm, salary: e.target.value})} />
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Company GST</label>
                          <input type="text" className="w-full px-3 py-2 border rounded-lg text-sm" value={pastEmpForm.companyGst} onChange={e => setPastEmpForm({...pastEmpForm, companyGst: e.target.value})} />
                      </div>
                  </div>
                  <div className="p-4 bg-slate-50 border-t flex justify-end gap-3">
                      <button type="button" onClick={() => setShowPastEmploymentModal(false)} className="px-4 py-2 border bg-white rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                      <button type="button" onClick={handleAddPastEmployment} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-bold hover:bg-brand-700">Add</button>
                  </div>
              </div>
          </div>
      )}

      {/* Global Modals for EmployeeProfilePage to prevent z-index stacking issues */}
                    {weekoffModalDay && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
                                <div className="p-4 border-b border-slate-200">
                                    <h3 className="font-medium text-slate-800 capitalize">{weekoffModalDay === 'thu' ? 'Thursday' : weekoffModalDay === 'tue' ? 'Tuesday' : weekoffModalDay === 'wed' ? 'Wednesday' : weekoffModalDay === 'fri' ? 'Friday' : weekoffModalDay === 'sat' ? 'Saturday' : weekoffModalDay === 'sun' ? 'Sunday' : 'Monday'} - Week Offs</h3>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {['All Weeks', '1st Week', '2nd Week', '3rd Week', '4th Week', '5th Week'].map(week => (
                                        <div key={week} className="p-4 flex items-center justify-between hover:bg-slate-50">
                                            <span className="text-sm text-slate-700">{week}</span>
                                            <input 
                                                type="checkbox" 
                                                checked={tempWeekoffs.includes(week)}
                                                onChange={(e) => {
                                                    let newArr = [...tempWeekoffs];
                                                    if (e.target.checked) {
                                                        if (week === 'All Weeks') newArr = ['All Weeks'];
                                                        else {
                                                            newArr = newArr.filter(w => w !== 'All Weeks');
                                                            newArr.push(week);
                                                        }
                                                    } else {
                                                        newArr = newArr.filter(w => w !== week);
                                                    }
                                                    setTempWeekoffs(newArr);
                                                }}
                                                className="w-4 h-4 text-blue-600 rounded border-slate-300"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="p-4 flex justify-center gap-4">
                                    <button onClick={() => setWeekoffModalDay(null)} className="px-6 py-1.5 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50">Cancel</button>
                                    <button onClick={() => {
                                        const newSchedule = {...formData.attendanceDetails.workTimings.schedule};
                                        newSchedule[weekoffModalDay].weekoffType = tempWeekoffs.length > 0 ? tempWeekoffs : ['All Weeks'];
                                        setFormData({...formData, attendanceDetails: {...formData.attendanceDetails, workTimings: {...formData.attendanceDetails.workTimings, schedule: newSchedule}}});
                                        setWeekoffModalDay(null);
                                    }} className="px-6 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-medium text-white shadow-sm">Confirm</button>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {shiftModalDay && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                                <div className="p-4 border-b border-slate-200 shrink-0">
                                    <h3 className="font-medium text-slate-800 capitalize">{shiftModalDay === 'thu' ? 'Thursday' : shiftModalDay === 'tue' ? 'Tuesday' : shiftModalDay === 'wed' ? 'Wednesday' : shiftModalDay === 'fri' ? 'Friday' : shiftModalDay === 'sat' ? 'Saturday' : shiftModalDay === 'sun' ? 'Sunday' : 'Monday'} - Shifts</h3>
                                </div>
                                <div className="divide-y divide-slate-100 overflow-y-auto">
                                    {availableShifts.map((shift, idx) => {
                                        const isSelected = tempShifts.some(s => s.name === shift.name && s.startTime === shift.startTime && s.endTime === shift.endTime);
                                        return (
                                            <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                                <span className="text-sm text-slate-700">{shift.name} <span className="text-slate-300 mx-2">|</span> {shift.startTime} - {shift.endTime}</span>
                                                <input 
                                                    type="checkbox" 
                                                    checked={isSelected}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setTempShifts([...tempShifts, shift]);
                                                        } else {
                                                            setTempShifts(tempShifts.filter(s => !(s.name === shift.name && s.startTime === shift.startTime && s.endTime === shift.endTime)));
                                                        }
                                                    }}
                                                    className="w-4 h-4 text-blue-600 rounded border-slate-300"
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="p-4 border-t border-slate-200">
                                    {!showCustomShiftInput ? (
                                        <button onClick={() => setShowCustomShiftInput(true)} className="text-blue-500 font-medium text-sm flex items-center gap-2 hover:text-blue-600">
                                            <Plus size={16} /> Add Custom Shift
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <input type="text" placeholder="Shift Name" value={customShift.name} onChange={e => setCustomShift({...customShift, name: e.target.value})} className="px-2 py-1 text-sm border border-slate-200 rounded-md outline-none w-1/3" />
                                            <input type="time" value={customShift.startTime} onChange={e => setCustomShift({...customShift, startTime: e.target.value})} className="px-2 py-1 text-sm border border-slate-200 rounded-md outline-none w-1/4" />
                                            <span className="text-slate-400">-</span>
                                            <input type="time" value={customShift.endTime} onChange={e => setCustomShift({...customShift, endTime: e.target.value})} className="px-2 py-1 text-sm border border-slate-200 rounded-md outline-none w-1/4" />
                                            <button onClick={() => {
                                                if (customShift.name && customShift.startTime && customShift.endTime) {
                                                    const formatTime = (t) => {
                                                        const [h, m] = t.split(':');
                                                        const ampm = h >= 12 ? 'PM' : 'AM';
                                                        const hh = h % 12 || 12;
                                                        return `${hh < 10 ? '0'+hh : hh}:${m} ${ampm}`;
                                                    };
                                                    const newShiftObj = { name: customShift.name, startTime: formatTime(customShift.startTime), endTime: formatTime(customShift.endTime) };
                                                    setAvailableShifts([...availableShifts, newShiftObj]);
                                                    setTempShifts([...tempShifts, newShiftObj]);
                                                    setShowCustomShiftInput(false);
                                                    setCustomShift({name: '', startTime: '', endTime: ''});
                                                }
                                            }} className="bg-blue-500 text-white p-1 rounded-md hover:bg-blue-600 ml-auto"><CheckCircle size={16} /></button>
                                            <button onClick={() => setShowCustomShiftInput(false)} className="bg-slate-200 text-slate-600 p-1 rounded-md hover:bg-slate-300"><X size={16} /></button>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 flex justify-center gap-4 bg-slate-50 shrink-0">
                                    <button onClick={() => setShiftModalDay(null)} className="px-6 py-1.5 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50">Cancel</button>
                                    <button onClick={() => {
                                        const newSchedule = {...formData.attendanceDetails.workTimings.schedule};
                                        newSchedule[shiftModalDay].shifts = tempShifts;
                                        setFormData({...formData, attendanceDetails: {...formData.attendanceDetails, workTimings: {...formData.attendanceDetails.workTimings, schedule: newSchedule}}});
                                        setShiftModalDay(null);
                                    }} className="px-6 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-medium text-white shadow-sm">Confirm</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {showBiometricModal && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                                    <h3 className="font-medium text-slate-800">Add Biometric Device</h3>
                                    <button onClick={() => setShowBiometricModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm text-slate-700 mb-1">Device Name</label>
                                        <input type="text" placeholder="Device Name" value={tempBiometricDevice.deviceName} onChange={e => setTempBiometricDevice({...tempBiometricDevice, deviceName: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-700 mb-1">Serial Number</label>
                                        <input type="text" placeholder="Serial Number" value={tempBiometricDevice.serialNumber} onChange={e => setTempBiometricDevice({...tempBiometricDevice, serialNumber: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" />
                                    </div>
                                </div>
                                <div className="p-4 border-t border-slate-200 flex justify-end gap-3 bg-white">
                                    <button type="button" onClick={() => { setShowBiometricModal(false); setTempBiometricDevice({deviceName: '', serialNumber: ''}); }} className="px-6 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50">Cancel</button>
                                    <button type="button" onClick={() => {
                                        if (tempBiometricDevice.deviceName && tempBiometricDevice.serialNumber) {
                                            setFormData({...formData, attendanceDetails: {...formData.attendanceDetails, biometricDevices: [...(formData.attendanceDetails?.biometricDevices || []), tempBiometricDevice]}});
                                            setShowBiometricModal(false);
                                            setTempBiometricDevice({deviceName: '', serialNumber: ''});
                                        }
                                    }} className="px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-md text-sm font-medium text-white shadow-sm">Add Device</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {showKioskModal && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                                    <h3 className="font-medium text-slate-800">Add Attendance Kiosk</h3>
                                    <button onClick={() => setShowKioskModal(false)} className="bg-slate-500 text-white rounded-full p-0.5 hover:bg-slate-600 transition-colors"><X size={14} /></button>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-xs text-slate-600 mb-1">Kiosk Name <span className="text-red-500">*</span></label>
                                        <input type="text" placeholder="eg. Main Entrance" value={tempKioskDevice.kioskName} onChange={e => setTempKioskDevice({...tempKioskDevice, kioskName: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm bg-white" />
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-1/3">
                                            <label className="block text-xs text-slate-600 mb-1">Dial Code <span className="text-red-500">*</span></label>
                                            <select value={tempKioskDevice.dialCode} onChange={e => setTempKioskDevice({...tempKioskDevice, dialCode: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm bg-white outline-none">
                                                <option value="+91">+91</option>
                                                <option value="+1">+1</option>
                                            </select>
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-xs text-slate-600 mb-1">Phone Number <span className="text-red-500">*</span></label>
                                            <input type="text" placeholder="eg. 9999999999" value={tempKioskDevice.phoneNumber} onChange={e => setTempKioskDevice({...tempKioskDevice, phoneNumber: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm bg-white" />
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 border-t border-slate-200 flex justify-end gap-3 bg-white">
                                    <button type="button" onClick={() => { setShowKioskModal(false); setTempKioskDevice({kioskName: '', dialCode: '+91', phoneNumber: ''}); }} className="px-6 py-2 border border-slate-200 rounded-md text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100">Cancel</button>
                                    <button type="button" onClick={() => {
                                        if (tempKioskDevice.kioskName && tempKioskDevice.phoneNumber) {
                                            setFormData({...formData, attendanceDetails: {...formData.attendanceDetails, kioskDevices: [...(formData.attendanceDetails?.kioskDevices || []), tempKioskDevice]}});
                                            setShowKioskModal(false);
                                            setTempKioskDevice({kioskName: '', dialCode: '+91', phoneNumber: ''});
                                        }
                                    }} className="px-6 py-2 bg-[#007bff] hover:bg-blue-600 rounded-md text-sm font-medium text-white shadow-sm">Add Kiosk</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {durationModalField && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                                    <h3 className="font-medium text-slate-800">
                                        {durationModalField === 'autoHalfDayIfLateBy' ? 'Auto half day if late by' :
                                         durationModalField === 'mandatoryHalfDayHours' ? 'Mandatory half day hours' :
                                         'Mandatory full day hours'}
                                    </h3>
                                    <button onClick={() => setDurationModalField(null)} className="bg-slate-500 text-white rounded-full p-0.5 hover:bg-slate-600 transition-colors"><X size={14} /></button>
                                </div>
                                <div className="p-6">
                                    <label className="block text-sm text-slate-700 mb-2">Select Duration</label>
                                    <div className="flex items-center gap-2">
                                        <input type="number" min="0" placeholder="0" value={tempDuration.hours} onChange={(e) => setTempDuration({...tempDuration, hours: e.target.value})} className="w-16 px-3 py-2 border border-slate-200 rounded-md text-sm outline-none text-center" />
                                        <span className="text-sm text-slate-600">hours</span>
                                        <input type="number" min="0" max="59" placeholder="0" value={tempDuration.minutes} onChange={(e) => setTempDuration({...tempDuration, minutes: e.target.value})} className="w-16 px-3 py-2 border border-slate-200 rounded-md text-sm outline-none ml-2 text-center" />
                                        <span className="text-sm text-slate-600">minutes</span>
                                    </div>
                                </div>
                                <div className="p-4 border-t border-slate-200 flex justify-center gap-3 bg-white">
                                    <button type="button" onClick={() => {
                                        setFormData({...formData, attendanceDetails: {...formData.attendanceDetails, automationRules: {...formData.attendanceDetails.automationRules, [durationModalField]: null}}});
                                        setDurationModalField(null);
                                    }} className="px-8 py-2 border border-red-200 rounded-md text-sm font-medium text-red-500 bg-white hover:bg-red-50">Turn Off</button>
                                    <button type="button" onClick={() => {
                                        const totalMins = (parseInt(tempDuration.hours) || 0) * 60 + (parseInt(tempDuration.minutes) || 0);
                                        setFormData({...formData, attendanceDetails: {...formData.attendanceDetails, automationRules: {...formData.attendanceDetails.automationRules, [durationModalField]: totalMins || null}}});
                                        setDurationModalField(null);
                                    }} className="px-8 py-2 bg-[#007bff] hover:bg-blue-600 rounded-md text-sm font-medium text-white shadow-sm">Confirm</button>
                                </div>
                            </div>
                        </div>
                    )}

      {/* Add Leave Type Modal */}
      {showLeaveTypeModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          <PlusCircle size={18} className="text-blue-500" />
                          Add Leave Type
                      </h3>
                      <button type="button" onClick={() => setShowLeaveTypeModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={18} /></button>
                  </div>
                  <div className="p-6">
                      <label className="block text-xs font-bold text-slate-700 mb-2">Leave Type Name <span className="text-red-500">*</span></label>
                      <input type="text" autoFocus placeholder="e.g., Maternity Leave" className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" value={newLeaveTypeName} onChange={(e) => setNewLeaveTypeName(e.target.value)} onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                              e.preventDefault();
                              if (newLeaveTypeName.trim()) {
                                  setFormData({
                                      ...formData, 
                                      leaveDetails: {
                                          ...formData.leaveDetails, 
                                          leavePolicy: [...(formData.leaveDetails?.leavePolicy||[]), { leaveType: newLeaveTypeName.trim(), allowedLeaves: 0, carryForwardLeaves: 0 }],
                                          leaveBalance: [...(formData.leaveDetails?.leaveBalance||[]), { leaveType: newLeaveTypeName.trim(), remainingBalance: 0 }]
                                      }
                                  });
                                  setShowLeaveTypeModal(false);
                              }
                          }
                      }} />
                  </div>
                  <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                      <button type="button" onClick={() => setShowLeaveTypeModal(false)} className="px-5 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 transition-colors">Cancel</button>
                      <button type="button" onClick={() => {
                          if (newLeaveTypeName.trim()) {
                              setFormData({
                                  ...formData, 
                                  leaveDetails: {
                                      ...formData.leaveDetails, 
                                      leavePolicy: [...(formData.leaveDetails?.leavePolicy||[]), { leaveType: newLeaveTypeName.trim(), allowedLeaves: 0, carryForwardLeaves: 0 }],
                                      leaveBalance: [...(formData.leaveDetails?.leaveBalance||[]), { leaveType: newLeaveTypeName.trim(), remainingBalance: 0 }]
                                  }
                              });
                              setShowLeaveTypeModal(false);
                          }
                      }} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium text-white shadow-sm transition-colors disabled:opacity-50" disabled={!newLeaveTypeName.trim()}>Add</button>
                  </div>
              </div>
          </div>
      )}

      {/* Add Document Modal */}
      {showDocumentModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="font-bold text-lg text-slate-900">Upload Document</h3>
                      <button onClick={() => setShowDocumentModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                          <X size={20} />
                      </button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Document Type <span className="text-red-500">*</span></label>
                          <select value={documentType} onChange={e => setDocumentType(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                              <option value="Salary Slip">Salary Slip</option>
                              <option value="Bank Account Details">Bank Account Details</option>
                              <option value="Degree">Degree</option>
                              <option value="Driving License">Driving License</option>
                              <option value="PAN Card">PAN Card</option>
                              <option value="Professional Documents">Professional Documents</option>
                              <option value="Employment Contract">Employment Contract</option>
                              <option value="Previous Employment Documents">Previous Employment Documents</option>
                              <option value="Other">Other</option>
                          </select>
                      </div>
                      
                      {documentType === 'Other' && (
                          <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">Document Name <span className="text-red-500">*</span></label>
                              <input type="text" value={customDocumentName} onChange={e => setCustomDocumentName(e.target.value)} placeholder="Enter document name" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                          </div>
                      )}
                      
                      <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">File (Max 5MB) <span className="text-red-500">*</span></label>
                          <p className="text-[10px] text-slate-500 mb-2">Accepted formats: PDF, JPG, PNG, WEBP, DOCX</p>
                          <input type="file" onChange={e => setDocumentFile(e.target.files[0])} accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.doc" className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                      </div>
                  </div>
                  <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end">
                      <button type="button" onClick={() => setShowDocumentModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors">
                          Cancel
                      </button>
                      <button type="button" onClick={handleDocumentUpload} disabled={uploadingDoc} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50">
                          {uploadingDoc ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={16} />}
                          Upload
                      </button>
                  </div>
              </div>
          </div>
      )}
      {/* Delete Document Confirmation Modal */}
      {documentToDelete && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-6 flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                          <AlertTriangle size={32} />
                      </div>
                      <h3 className="font-bold text-xl text-slate-900 mb-2">Delete Document?</h3>
                      <p className="text-sm text-slate-500 mb-6">This action cannot be undone. The document will be permanently removed.</p>
                      <div className="flex gap-3 w-full">
                          <button type="button" onClick={() => setDocumentToDelete(null)} className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-bold transition-colors">
                              Cancel
                          </button>
                          <button type="button" onClick={confirmDocumentDelete} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold shadow-lg shadow-red-600/20 transition-colors">
                              Delete
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </>
  );
};

export default EmployeeProfilePage;
