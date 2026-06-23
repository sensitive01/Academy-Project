import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Briefcase,
  Calendar,
  Mail,
  Phone,
  Camera,
  ShieldCheck,
  FileText,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

const AddEmployeeModal = ({ isOpen, onClose, employee = null }) => {
  const isEdit = !!employee;
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [preview, setPreview] = useState(null);
  const [centers, setCenters] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const { sendOtp, user } = useAuth();
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");

const [formData, setFormData] = useState({
  firstName: "",
  lastName: " ",
  email: "",
  phone: "",
  dob: "",
  gender: "",
  employeeId: "",
  joiningDate: "",
  department: "",
  designation: "",
  role: "employee",
  employmentType: "full-time",
  salary: "",
  shiftStart: "",
  shiftEnd: "",
  center: "",
  profilePic: null,
  idFile: null,
  certificateFile: null,
  contractFile: null,
  subjects: [],
});

  const fetchConfigs = async () => {
    try {
      const [deptRes, roleRes, desigRes, centerRes, subRes] = await Promise.all([
        api.get("/departments"),
        api.get("/roles"),
        api.get("/designations"),
        api.get("/centers"),
        api.get("/subjects"),
      ]);
      console.log("Centers API:", centerRes.data);
      setDepartments(deptRes.data);
      setRoles(roleRes.data);
      setDesignations(desigRes.data);
      setCenters(centerRes.data);
      setAvailableSubjects(subRes.data);
    } catch {
      toast.error("Failed to load configuration data");
    }
  };

  const generateEmployeeId = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `EMP-${year}-${random}`;
  };

  useEffect(() => {
    if (isOpen) {
      fetchConfigs();
      if (isEdit) {
        setFormData({
          firstName: employee.firstName || "",
          lastName: employee.lastName || "",
          email: employee.user?.email || "",
          phone: employee.phone || "",
          dob: employee.dob
            ? new Date(employee.dob).toISOString().split("T")[0]
            : "",
          gender: employee.gender || "",
          employeeId: employee.employeeId || "",
          joiningDate: employee.joiningDate
            ? new Date(employee.joiningDate).toISOString().split("T")[0]
            : "",
          department: employee.department || "",
          designation: employee.designation || "",
          role: employee.user?.role
            ? employee.user.role.toLowerCase()
            : "employee",
          employmentType: employee.employmentType || "full-time",
          salary: employee.salary || "",
          shiftStart: employee.shift?.start || "",
          shiftEnd: employee.shift?.end || "",
          center: employee.center?._id || "",
          profilePic: null,
          idFile: null,
          certificateFile: null,
          contractFile: null,
          subjects: employee.user?.subjects ? employee.user.subjects.map(s => s._id || s) : [],
        });
        setPreview(employee.profilePic?.url || null);
      } else {
        setFormData({
          firstName: "",
          lastName: " ",
          email: "",
          phone: "",
          dob: "",
          gender: "",
          employeeId: generateEmployeeId(),
          joiningDate: new Date().toISOString().split("T")[0],
          department: "",
          designation: "",
          role: "employee",
          employmentType: "full-time",
          salary: "",
          shiftStart: "",
          shiftEnd: "",
          center: (user?.role === 'center' || user?.role === 'hr') ? (user.center?._id || user.center) : "",
          profilePic: null,
          idFile: null,
          certificateFile: null,
          contractFile: null,
          subjects: [],
        });
        setPreview(null);
      }
    }
  }, [isOpen, employee]);

  useEffect(() => {
      if (isEdit && roles.length > 0 && employee?.user?.role) {
        const matchedRole = roles.find(
          (r) =>
            r.name.toLowerCase() === employee.user.role.toLowerCase()
        );

        if (matchedRole) {
          setFormData((prev) => ({
            ...prev,
            role: matchedRole.name,
          }));
        }
      }
    }, [roles, employee, isEdit]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, profilePic: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, [field]: file });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isEdit && !showOtp) {
      const loading = toast.loading("Sending verification OTP...");
      try {
        const result = await sendOtp(formData.email);
        if (result.success) {
          setShowOtp(true);
          toast.success("Verification OTP sent to employee email!", { id: loading });
        } else {
          toast.error(result.error, { id: loading });
        }
      } catch (err) {
        toast.error("Failed to send OTP", { id: loading });
      }
      return;
    }

    const loadingToast = toast.loading(
      isEdit ? "Updating employee records..." : "Creating employee and uploading documents...",
    );

    try {
      const data = new FormData();

      // Append all text fields
      Object.keys(formData).forEach((key) => {
        if (
          formData[key] &&
          !["profilePic", "idFile", "certificateFile", "contractFile", "subjects"].includes(
            key,
          )
        ) {
          data.append(key, formData[key]);
        }
      });

      if (formData.role === "coach" || formData.role === "Coach") {
        data.append("subjects", JSON.stringify(formData.subjects));
      }

      // Append files
      if (formData.profilePic) data.append("profilePic", formData.profilePic);
      if (formData.idFile) data.append("idFile", formData.idFile);
      if (formData.certificateFile)
        data.append("certificateFile", formData.certificateFile);
      if (formData.contractFile)
        data.append("contractFile", formData.contractFile);

      if (!isEdit && showOtp) {
        data.append("otp", otpCode);
      }

      const url = isEdit ? `/employees/${employee._id}` : "/employees";
      const method = isEdit ? "put" : "post";

      const response = await api[method](url, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success(
        response.data.message ||
          `Employee ${isEdit ? "updated" : "created"} successfully!`,
        {
          id: loadingToast,
        },
      );
      onClose();
      setShowOtp(false);
      setOtpCode("");

    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to create employee";
      toast.error(message, { id: loadingToast });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white/90 backdrop-blur-md z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {isEdit ? "Edit Employee" : "Add New Employee"}
            </h2>
            <p className="text-sm text-slate-500">
              {isEdit
                ? "Update employee records and documents."
                : "Enter personal and professional details."}
            </p>
          </div>
          <button
            onClick={() => {
              onClose();
              setShowOtp(false);
              setOtpCode("");
            }}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {showOtp ? (
            <div className="space-y-6 flex flex-col items-center py-10">
              <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center text-brand-600">
                <ShieldCheck size={32} />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-slate-900">Email Verification</h3>
                <p className="text-slate-500 text-sm mt-1">Enter the 6-digit OTP sent to {formData.email}</p>
              </div>
              <div className="w-full max-w-xs">
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 text-center border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-mono text-2xl tracking-[0.5em]"
                  placeholder="000000"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <div className="flex flex-col w-full gap-3">
                <button
                  type="submit"
                  disabled={otpCode.length !== 6}
                  className="w-full py-3 rounded-xl bg-brand-600 text-white font-bold text-lg hover:bg-brand-700 transition-all shadow-lg shadow-brand-600/20 disabled:opacity-50"
                >
                  Verify & Create
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const loading = toast.loading("Resending OTP...");
                    const result = await sendOtp(formData.email);
                    if (result.success) toast.success("OTP Resent!", { id: loading });
                    else toast.error(result.error, { id: loading });
                  }}
                  className="text-brand-600 font-bold text-sm hover:text-brand-700"
                >
                  Resend OTP
                </button>
                <button
                  type="button"
                  onClick={() => setShowOtp(false)}
                  className="text-slate-400 text-sm hover:text-slate-600"
                >
                  Edit Details
                </button>
              </div>
            </div>
          ) : (
            <>
          {/* Section: Profile Picture */}
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden bg-slate-50 relative shadow-inner">
                {preview ? (
                  <img
                    src={preview}
                    alt="Profile"
                    className="w-full h-full object-cover object-center"
                  />
                ) : (
                  <User size={48} className="text-slate-300" />
                )}
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera size={20} className="text-white" />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-900">
                Profile Photo
              </p>
              <div className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-100 font-mono">
                {formData.employeeId}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Click to upload image (max 2MB)
              </p>
            </div>
            {/* Hidden input to ensure it's in the form submit */}
            <input
              type="hidden"
              name="employeeId"
              value={formData.employeeId}
            />
          </div>

          {/* Section: Personal Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <User size={16} className="text-brand-600" /> Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Email (Official) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="email"
                    required
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                    placeholder="john.doe@drrg.edu"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="tel"
                    required
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                    placeholder="+1 234 567 8900"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Date of Birth
                </label>
                <div className="relative">
                  <Calendar
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="date"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                    value={formData.dob}
                    onChange={(e) =>
                      setFormData({ ...formData, dob: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Gender
                </label>
                <select
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData({ ...formData, gender: e.target.value })
                  }
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-100"></div>

          {/* Section: Professional Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Briefcase size={16} className="text-brand-600" /> Role &
              Department
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Joining Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  value={formData.joiningDate}
                  onChange={(e) =>
                    setFormData({ ...formData, joiningDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept.name}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Designation <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  value={formData.designation}
                  onChange={(e) =>
                    setFormData({ ...formData, designation: e.target.value })
                  }
                >
                  <option value="">Select Designation</option>
                  {designations.map((desig) => (
                    <option key={desig._id} value={desig.name}>
                      {desig.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Employment Type
                </label>
                <select
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  value={formData.employmentType}
                  onChange={(e) =>
                    setFormData({ ...formData, employmentType: e.target.value })
                  }
                >
                  <option value="full-time">Full Time</option>
                  <option value="part-time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                  <option value="freelance">Freelance</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                >
                  <option value="">Select Role</option>
                  <option value="sub-admin">Sub-Admin</option>
                  {roles.filter(r => r.name.toLowerCase() !== "sub-admin").map((role) => (
                    <option key={role._id} value={role.name}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              {(formData.role === "coach" || formData.role === "Coach") && (
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Coach Subjects
                  </label>
                  <div className="border border-slate-200 rounded-lg p-3 max-h-40 overflow-y-auto bg-slate-50 space-y-2">
                    {availableSubjects.map((subject) => {
                      const isChecked = formData.subjects.includes(subject._id);
                      return (
                        <label key={subject._id} className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded transition-colors">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({ ...formData, subjects: [...formData.subjects, subject._id] });
                              } else {
                                setFormData({ ...formData, subjects: formData.subjects.filter((id) => id !== subject._id) });
                              }
                            }}
                          />
                          <span className="text-sm text-slate-700">{subject.name} ({subject.code})</span>
                        </label>
                      );
                    })}
                    {availableSubjects.length === 0 && (
                      <p className="text-xs text-slate-400 italic">No subjects available.</p>
                    )}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Center <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm disabled:bg-slate-100 disabled:text-slate-500"
                  value={formData.center}
                  disabled={(user?.role === 'center' || user?.role === 'hr')}
                  onChange={(e) =>
                    setFormData({ ...formData, center: e.target.value })
                  }
                >
                  <option value="">Select Center</option>
                  {centers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} - {c.location}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Shift Start
                </label>
                <input
                  type="time"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  value={formData.shiftStart}
                  onChange={(e) =>
                    setFormData({ ...formData, shiftStart: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Shift End
                </label>
                <input
                  type="time"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  value={formData.shiftEnd}
                  onChange={(e) =>
                    setFormData({ ...formData, shiftEnd: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Salary (Monthly CTC)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                    placeholder="0.00"
                    value={formData.salary}
                    onChange={(e) =>
                      setFormData({ ...formData, salary: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Documents Upload */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileText size={16} className="text-brand-600" /> Documents
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {[
                { label: "Identity Proof (ID)", field: "idFile" },
                { label: "Educational Certificate", field: "certificateFile" },
                { label: "Employment Contract", field: "contractFile" },
              ].map((doc) => (
                <div
                  key={doc.field}
                  className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm text-slate-400">
                      {formData[doc.field] ||
                      (isEdit && employee[doc.field]?.url) ? (
                        <CheckCircle size={20} className="text-green-500" />
                      ) : (
                        <FileText size={20} />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">
                        {doc.label}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate max-w-[200px]">
                        {formData[doc.field]
                          ? formData[doc.field].name
                          : isEdit && employee[doc.field]?.name
                            ? employee[doc.field].name
                            : "No file selected"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isEdit &&
                      employee[doc.field]?.url &&
                      !formData[doc.field] && (
                        <a
                          href={employee[doc.field].url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-slate-400 hover:text-brand-600 transition-colors"
                          title="View Document"
                        >
                          <ExternalLink size={16} />
                        </a>
                      )}
                    <label className="text-xs font-bold text-brand-600 hover:bg-brand-50 px-3 py-1.5 rounded-lg cursor-pointer transition-colors">
                      {formData[doc.field] ||
                      (isEdit && employee[doc.field]?.url)
                        ? "Change"
                        : "Upload"}
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => handleFileChange(e, doc.field)}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-lg bg-brand-600 text-white font-bold text-sm hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/20"
            >
              {isEdit ? "Save Changes" : "Create Employee"}
            </button>
          </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default AddEmployeeModal;
