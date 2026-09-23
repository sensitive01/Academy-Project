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
import { useImagePreview } from "../../context/ImagePreviewContext";

const AddEmployeeModal = ({ isOpen, onClose, employee = null }) => {
  const isEdit = !!employee;
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [preview, setPreview] = useState(null);
  const [centers, setCenters] = useState([]);
  const { showPreview } = useImagePreview();
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
    privilegedLeave: 0,
    sickLeave: 0,
    casualLeave: 0,

    maritalStatus: "",
    bloodGroup: "",
    guardianName: "",
    emergencyContactName: "",
    emergencyContactMobile: "",
    emergencyContactRelationship: "",
    emergencyContactAddress: "",
    aadhaar: "",
    pan: "",
    drivingLicense: "",
    voterId: "",
    uan: "",
    currentAddress: "",
    permanentAddress: "",
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
          privilegedLeave: employee.leaveBalances?.privilegedLeave || 0,
          sickLeave: employee.leaveBalances?.sickLeave || 0,
          casualLeave: employee.leaveBalances?.casualLeave || 0,
          maritalStatus: employee.maritalStatus || "",
          bloodGroup: employee.bloodGroup || "",
          guardianName: employee.guardianName || "",
          emergencyContactName: employee.emergencyContactName || "",
          emergencyContactMobile: employee.emergencyContactMobile || "",
          emergencyContactRelationship: employee.emergencyContactRelationship || "",
          emergencyContactAddress: employee.emergencyContactAddress || "",
          aadhaar: employee.aadhaar || "",
          pan: employee.pan || "",
          drivingLicense: employee.drivingLicense || "",
          voterId: employee.voterId || "",
          uan: employee.uan || "",
          currentAddress: employee.currentAddress || "",
          permanentAddress: employee.permanentAddress || "",
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
          privilegedLeave: 0,
          sickLeave: 0,
          casualLeave: 0,
          maritalStatus: "",
          bloodGroup: "",
          guardianName: "",
          emergencyContactName: "",
          emergencyContactMobile: "",
          emergencyContactRelationship: "",
          emergencyContactAddress: "",
          aadhaar: "",
          pan: "",
          drivingLicense: "",
          voterId: "",
          uan: "",
          currentAddress: "",
          permanentAddress: "",
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

    

    const loadingToast = toast.loading(
      isEdit ? "Updating employee records..." : "Creating employee and uploading documents...",
    );

    try {
      const data = new FormData();

      // Append all text fields
      Object.keys(formData).forEach((key) => {
        if (
          formData[key] !== null && formData[key] !== undefined && formData[key] !== "" &&
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

              
              {/* Section: Basic Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <User size={16} className="text-brand-600" /> Basic Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Name <span className="text-red-500">*</span></label>
                    <div className="flex gap-2">
                        <input type="text" required className="w-1/2 px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 text-sm" placeholder="First Name" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} />
                        <input type="text" required className="w-1/2 px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 text-sm" placeholder="Last Name" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Mobile Number <span className="text-red-500">*</span></label>
                    <input type="tel" required className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 text-sm" placeholder="+91 9876543210" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Personal Email ID <span className="text-red-500">*</span></label>
                    <input type="email" required className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 text-sm" placeholder="email@example.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Date of Birth</label>
                    <input type="date" className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 text-sm" value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Gender</label>
                    <select className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 text-sm" value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})}>
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Marital Status</label>
                    <select className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 text-sm" value={formData.maritalStatus} onChange={(e) => setFormData({...formData, maritalStatus: e.target.value})}>
                      <option value="">Select Status</option>
                      <option value="single">Single</option>
                      <option value="married">Married</option>
                      <option value="divorced">Divorced</option>
                      <option value="widowed">Widowed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Blood Group</label>
                    <select className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 text-sm" value={formData.bloodGroup} onChange={(e) => setFormData({...formData, bloodGroup: e.target.value})}>
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+</option><option value="A-">A-</option>
                      <option value="B+">B+</option><option value="B-">B-</option>
                      <option value="O+">O+</option><option value="O-">O-</option>
                      <option value="AB+">AB+</option><option value="AB-">AB-</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Guardian's Name</label>
                    <input type="text" className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 text-sm" value={formData.guardianName} onChange={(e) => setFormData({...formData, guardianName: e.target.value})} />
                  </div>
                  <div className="md:col-span-2">
                    <div className="h-px bg-slate-100 my-2"></div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Emergency Contact Name</label>
                    <input type="text" className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 text-sm" value={formData.emergencyContactName} onChange={(e) => setFormData({...formData, emergencyContactName: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Emergency Contact Mobile</label>
                    <input type="tel" className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 text-sm" value={formData.emergencyContactMobile} onChange={(e) => setFormData({...formData, emergencyContactMobile: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Emergency Contact Relationship</label>
                    <input type="text" className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 text-sm" value={formData.emergencyContactRelationship} onChange={(e) => setFormData({...formData, emergencyContactRelationship: e.target.value})} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Emergency Contact Address</label>
                    <textarea rows="2" className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 text-sm" value={formData.emergencyContactAddress} onChange={(e) => setFormData({...formData, emergencyContactAddress: e.target.value})}></textarea>
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-100"></div>

              {/* Section: Government IDs */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FileText size={16} className="text-brand-600" /> Government IDs
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Aadhaar</label>
                    <input type="text" className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 text-sm" value={formData.aadhaar} onChange={(e) => setFormData({...formData, aadhaar: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">PAN</label>
                    <input type="text" className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 text-sm" value={formData.pan} onChange={(e) => setFormData({...formData, pan: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Driving License</label>
                    <input type="text" className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 text-sm" value={formData.drivingLicense} onChange={(e) => setFormData({...formData, drivingLicense: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Voter ID</label>
                    <input type="text" className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 text-sm" value={formData.voterId} onChange={(e) => setFormData({...formData, voterId: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">UAN</label>
                    <input type="text" className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 text-sm" value={formData.uan} onChange={(e) => setFormData({...formData, uan: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-100"></div>

              {/* Section: Address Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Briefcase size={16} className="text-brand-600" /> Address Details
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Current Address</label>
                    <textarea rows="2" className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 text-sm" value={formData.currentAddress} onChange={(e) => setFormData({...formData, currentAddress: e.target.value})}></textarea>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Permanent Address</label>
                    <textarea rows="2" className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 text-sm" value={formData.permanentAddress} onChange={(e) => setFormData({...formData, permanentAddress: e.target.value})}></textarea>
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-100"></div>

              {/* Section: System Requirements */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck size={16} className="text-brand-600" /> System Settings (Mandatory)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-amber-50 p-4 rounded-xl border border-amber-100">
                  <div>
                    <label className="block text-xs font-bold text-amber-800 mb-1">System Role <span className="text-red-500">*</span></label>
                    <select required className="w-full px-3 py-2 rounded-lg border border-amber-200 focus:ring-2 focus:ring-brand-500 text-sm bg-white" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
                      {roles.map(r => <option key={r._id} value={r.name}>{r.name}</option>)}
                    </select>
                    <p className="text-[10px] text-amber-600 mt-1">Determines login access</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-amber-800 mb-1">Center Assignment <span className="text-red-500">*</span></label>
                    <select required className="w-full px-3 py-2 rounded-lg border border-amber-200 focus:ring-2 focus:ring-brand-500 text-sm bg-white" value={formData.center} onChange={(e) => setFormData({...formData, center: e.target.value})}>
                      <option value="">Select Center</option>
                      {centers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                    <p className="text-[10px] text-amber-600 mt-1">Required for employee association</p>
                  </div>
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
        </form>
      </div>
    </div>
  );
};

export default AddEmployeeModal;
