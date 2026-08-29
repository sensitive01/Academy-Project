import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Plus,
  Trash2,
  Edit,
  Building2,
  UserCheck,
  Briefcase,
  MapPin,
  Key,
  Layers,
  BookOpen,
  DollarSign,
  Users,
  Eye,
  EyeOff,
  MoreVertical,
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import CustomDataTable from "../../components/common/DataTable";
import AssignStudentsModal from "../../components/modals/AssignStudentsModal";
import MultiSelectSubjects from "../../components/common/MultiSelectSubjects";

const ActionsDropdown = ({
  row,
  activeTab,
  openLoginModal,
  openAssignStudentsModal,
  openAssignSubjectModal,
  openModal,
  handleDelete
}) => {
  const [open, setOpen] = React.useState(false);
  const [coords, setCoords] = React.useState({ x: 0, y: 0 });
  const buttonRef = React.useRef(null);
  const menuRef = React.useRef(null);

  const handleOpen = (e) => {
    e.stopPropagation();
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        x: rect.right,
        y: rect.bottom + window.scrollY
      });
    }
    setOpen(!open);
  };

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current && !menuRef.current.contains(event.target) &&
        buttonRef.current && !buttonRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    
    const handleScroll = () => {
      setOpen(false);
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("scroll", handleScroll, true);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("scroll", handleScroll, true);
    };
  }, [open]);

  const dropdownMenu = open ? createPortal(
    <div 
      ref={menuRef}
      style={{
        position: 'absolute',
        top: `${coords.y + 4}px`,
        left: `${coords.x - 192}px`,
        zIndex: 9999
      }}
      className="w-48 bg-white rounded-xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.15)] border border-slate-100 py-1.5 overflow-hidden text-left animate-in fade-in zoom-in-95 duration-100"
    >
      {activeTab === "centers" && (
        <button 
          onClick={() => { setOpen(false); openLoginModal(row); }} 
          className="w-full text-left px-4 py-2.5 text-[13px] font-semibold flex items-center gap-3 hover:bg-slate-50 transition-colors text-slate-700"
        >
          <Key size={16} className="text-blue-600"/> Center Credentials
        </button>
      )}
      {activeTab === "batches" && (
        <>
          <button 
            onClick={() => { setOpen(false); openAssignStudentsModal(row); }} 
            className="w-full text-left px-4 py-2.5 text-[13px] font-semibold flex items-center gap-3 hover:bg-slate-50 transition-colors text-slate-700"
          >
            <Users size={16} className="text-indigo-600"/> Assign Students
          </button>
          <button 
            onClick={() => { setOpen(false); openAssignSubjectModal(row); }} 
            className="w-full text-left px-4 py-2.5 text-[13px] font-semibold flex items-center gap-3 hover:bg-slate-50 transition-colors text-slate-700"
          >
            <BookOpen size={16} className="text-emerald-600"/> Assign Subjects
          </button>
        </>
      )}
      <button 
        onClick={() => { setOpen(false); openModal(row); }} 
        className="w-full text-left px-4 py-2.5 text-[13px] font-semibold flex items-center gap-3 hover:bg-slate-50 transition-colors text-slate-700"
      >
        <Edit size={16} className="text-brand-600"/> Edit Details
      </button>
      <div className="h-px bg-slate-100 my-1 mx-2"></div>
      <button 
        onClick={() => { setOpen(false); handleDelete(row._id); }} 
        className="w-full text-left px-4 py-2.5 text-[13px] font-semibold flex items-center gap-3 hover:bg-red-50 transition-colors text-red-600"
      >
        <Trash2 size={16} /> Delete
      </button>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button 
        ref={buttonRef}
        onClick={handleOpen} 
        className={`p-1.5 rounded-lg transition-colors relative z-10 ${open ? 'bg-brand-50 text-brand-600' : 'text-slate-400 hover:text-brand-600 hover:bg-slate-50'}`}
        title="More Actions"
      >
        <MoreVertical size={18} />
      </button>
      {dropdownMenu}
    </>
  );
};

const toTitleCase = (str) => {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const CenterManagement = ({ isTab = false }) => {
  const activeTab = "centers";
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [batchStep, setBatchStep] = useState(1);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    description: "",
    certificateDate: "",
    code: "",
    type: "Theory",
    semester: 1,
    center: "",
    course: "",
    batch: "",
    fee: 0,
    feeType: "Term",
    otherFeeType: "",
    terms: [],
    batchId: "",
    numberOfSemesters: 1,
    period: { startDate: "", endDate: "" },
    numberOfStudents: 0,
    semesters: [],
  });
  const [searchQuery, setSearchQuery] = useState("");

  const [centersList, setCentersList] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [batchesList, setBatchesList] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);

  const openAssignStudentsModal = (batch) => {
    setCurrentBatchAssignStudents(batch);
    setShowAssignStudentsModal(true);
  };

  const handleAssignStudentsSuccess = (updatedBatch) => {
    setData(data.map((item) => (item._id === updatedBatch._id ? updatedBatch : item)));
    setShowAssignStudentsModal(false);
  };

  // Login Management State
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loginData, setLoginData] = useState({
    name: "",
    email: "",
    password: "",
    role: "center"
  });
  const [isSavingLogin, setIsSavingLogin] = useState(false);
  const [centerUsers, setCenterUsers] = useState([]);

  // Assign Subjects State
  const [showAssignSubjectModal, setShowAssignSubjectModal] = useState(false);
  const [currentBatchAssign, setCurrentBatchAssign] = useState(null);
  const [assignSemTab, setAssignSemTab] = useState(1);
  const [assignSubjectsData, setAssignSubjectsData] = useState([]);

  // Assign Students State
  const [showAssignStudentsModal, setShowAssignStudentsModal] = useState(false);
  const [currentBatchAssignStudents, setCurrentBatchAssignStudents] = useState(null);

  const config = {
    roles: {
      title: "Roles",
      singular: "Role",
      endpoint: "/roles",
      icon: <UserCheck size={20} />,
    },
    centers: {
      title: "Centers",
      singular: "Center",
      endpoint: "/centers",
      icon: <MapPin size={20} />,
    },
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "examFees") {
        const [feesRes, centersRes, coursesRes, batchesRes] = await Promise.all([
          api.get("/exam-fees"),
          api.get("/centers"),
          api.get("/courses"),
          api.get("/batches"),
        ]);
        setData(feesRes.data);
        setCentersList(centersRes.data);
        setCoursesList(coursesRes.data.filter(c => c.type === "Center Courses"));
        setBatchesList(batchesRes.data);
      } else if (activeTab === "batches") {
        const [batchesRes, coursesRes, subjectsRes, centersRes] = await Promise.all([
          api.get("/batches"),
          api.get("/courses"),
          api.get("/subjects"),
          api.get("/centers")
        ]);
        setData(batchesRes.data);
        setCoursesList(coursesRes.data.filter(c => c.type === "Center Courses"));
        setSubjectsList(subjectsRes.data);
        setCentersList(centersRes.data);
      } else if (activeTab === "subjects") {
        const [subjectsRes, coursesRes] = await Promise.all([
          api.get("/subjects"),
          api.get("/courses")
        ]);
        setData(subjectsRes.data);
        setCoursesList(coursesRes.data.filter(c => c.type === "Center Courses"));
      } else {
        const { data } = await api.get(config[activeTab].endpoint);
        setData(data);
      }
    } catch {
      toast.error(`Error fetching ${activeTab}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (
      window.confirm(
        `Are you sure you want to delete this ${config[activeTab].singular}?`,
      )
    ) {
      try {
        await api.delete(`${config[activeTab].endpoint}/${id}`);
        setData(data.filter((item) => item._id !== id));
        toast.success(`${config[activeTab].singular} deleted`);
      } catch {
        toast.error(`Error deleting ${activeTab}`);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formattedData = {
      ...formData,
      name: formData.name ? toTitleCase(formData.name.trim()) : undefined,
    };

    try {
      if (isEditing) {
        const { data: updatedItem } = await api.put(
          `${config[activeTab].endpoint}/${currentId}`,
          formattedData,
        );
        setData(
          data.map((item) => (item._id === currentId ? updatedItem : item)),
        );
        toast.success(`${config[activeTab].singular} updated`);
      } else {
        const { data: newItem } = await api.post(
          config[activeTab].endpoint,
          formattedData,
        );
        setData([...data, newItem]);
        toast.success(`${config[activeTab].singular} created`);
      }
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.message || `Error saving ${activeTab}`);
    }
  };

  const openModal = (item = null) => {
    setBatchStep(1);
    if (item) {
      setFormData({
        name: item.name || "",
        location: item.location || "",
        description: item.description || "",
        certificateDate: item.certificateDate || "",
        code: item.code || "",
        type: item.type || "Theory",
        semester: item.semester || 1,
        center: item.center?._id || item.center || "",
        course: item.course?._id || item.course || "",
        batch: item.batch?._id || item.batch || "",
        fee: item.fee || 0,
        feeType: item.feeType || "Term",
        otherFeeType: item.otherFeeType || "",
        terms: item.terms || [],
        batchId: item.batchId || "",
        numberOfSemesters: item.numberOfSemesters || 1,
        period: item.period || { startDate: "", endDate: "" },
        semesters: item.semesters || [],
      });
      setIsEditing(true);
      setCurrentId(item._id);
    } else {
      setFormData({
        name: "",
        location: "",
        description: "",
        certificateDate: "",
        code: "",
        type: "Theory",
        semester: 1,
        center: "",
        course: "",
        batch: "",
        fee: 0,
        feeType: "Term",
        otherFeeType: "",
        terms: [],
        batchId: "",
        numberOfSemesters: 1,
        period: { startDate: "", endDate: "" },
        semesters: [],
      });
      setIsEditing(false);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setCurrentId(null);
  };

  const openLoginModal = async (center) => {
    setCurrentId(center._id);
    setSelectedCenter(center);
    setShowPassword(false);
    setLoginData({ name: center.name, email: "", password: "", role: "center" });
    setCenterUsers([]);
    try {
      const { data } = await api.get(`/centers/${center._id}/login`);
      if (data && data.length > 0) {
        setCenterUsers(data);
        const existing = data.find((u) => u.role === "center");
        if (existing) {
          setLoginData({
            name: existing.name || center.name,
            email: existing.email || "",
            password: "",
            role: "center",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching login:", error);
    }
    setShowLoginModal(true);
  };

  const handleRoleSelectChange = (role) => {
    setShowPassword(false);
    const existing = centerUsers.find((u) => u.role === role);
    if (existing) {
      setLoginData({
        name: existing.name || selectedCenter?.name || "",
        email: existing.email || "",
        password: "",
        role: role,
      });
    } else {
      setLoginData({
        name: selectedCenter?.name || "",
        email: "",
        password: "",
        role: role,
      });
    }
  };

  const handleSelectAccount = (user) => {
    setShowPassword(false);
    setLoginData({
      name: user.name || "",
      email: user.email || "",
      password: "",
      role: user.role,
    });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsSavingLogin(true);
    try {
      await api.post(`/centers/${currentId}/login`, loginData);
      toast.success("Center login saved successfully");
      // refresh users
      const { data } = await api.get(`/centers/${currentId}/login`);
      setCenterUsers(data);
      const updated = data.find((u) => u.role === loginData.role);
      setLoginData({
        name: updated?.name || loginData.name,
        email: updated?.email || loginData.email,
        password: "",
        role: loginData.role,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Error saving login");
    } finally {
      setIsSavingLogin(false);
    }
  };

  const openAssignSubjectModal = (batch) => {
    setCurrentBatchAssign(batch);
    const initialData = Array.from({ length: batch.numberOfSemesters || 1 }).map((_, i) => {
      const semNum = i + 1;
      const existingSem = batch.semesters?.find(s => s.semesterNumber === semNum);
      return {
        semesterNumber: semNum,
        noOfSubjects: existingSem?.subjects?.length || 0,
        subjects: existingSem?.subjects?.map(s => typeof s === 'object' ? s._id : s) || []
      };
    });
    setAssignSubjectsData(initialData);
    setAssignSemTab(1);
    setShowAssignSubjectModal(true);
  };

  const handleAssignSubjectSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedSemesters = assignSubjectsData.map(sem => ({
        semesterNumber: sem.semesterNumber,
        subjects: sem.subjects
      }));
      
      const { data: updatedBatch } = await api.put(`/batches/${currentBatchAssign._id}`, {
        ...currentBatchAssign,
        center: currentBatchAssign.center?._id || currentBatchAssign.center,
        course: currentBatchAssign.course?._id || currentBatchAssign.course,
        semesters: updatedSemesters
      });
      
      setData(data.map((item) => (item._id === currentBatchAssign._id ? updatedBatch : item)));
      toast.success("Subjects assigned successfully");
      setShowAssignSubjectModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Error assigning subjects");
    }
  };

  const columns = [
    { name: "S.No", selector: (r, i) => i + 1, width: "70px", center: true },

    {
      name: `${config[activeTab].singular} Name`,
      selector: r => r.name,
      sortable: true,
      omit: activeTab === "examFees",
      cell: r => (
        <div className="flex items-center cursor-pointer group" onClick={() => openModal(r)}>
          <div className="h-10 w-10 bg-brand-50 text-brand-600 rounded-lg flex items-center justify-center group-hover:ring-2 ring-brand-500 transition-all">
            {config[activeTab].icon}
          </div>
          <div className="ml-3 font-medium text-gray-900 group-hover:text-brand-600 transition-colors">{r.name}</div>
        </div>
      )
    },
    ...(activeTab === "centers"
      ? [
        {
          name: "Center ID",
          selector: r => r.centerId,
          sortable: true,
          width: "150px",
          center: true,
          cell: r => (
            <span className="font-mono text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-1 rounded">
              {r.centerId || "N/A"}
            </span>
          ),
        },
        {
          name: "Location",
          selector: r => r.location,
          sortable: true,
          cell: r => (
            <span className="text-gray-500 font-medium">
              {r.location || "N/A"}
            </span>
          ),
        },
      ]
      : []),
    ...(activeTab === "subjects"
      ? [
        {
          name: "Subject Code",
          selector: r => r.code,
          sortable: true,
          width: "150px",
          center: true,
          cell: r => (
            <span className="font-mono text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-1 rounded">
              {r.code || "N/A"}
            </span>
          ),
        },
        {
          name: "Type",
          selector: r => r.type,
          sortable: true,
          width: "120px",
        },
      ]
      : []),
    ...(activeTab === "batches"
      ? [
        {
          name: "Batch ID",
          selector: r => r.batchId,
          sortable: true,
          width: "150px",
          center: true,
          cell: r => (
            <span className="font-mono text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-1 rounded">
              {r.batchId || "N/A"}
            </span>
          ),
        },
        {
          name: "Course",
          selector: r => r.course?.title || "N/A",
          sortable: true,
        },
        {
          name: "Center",
          selector: r => r.center?.name || "N/A",
          sortable: true,
        },
        {
          name: "Semesters",
          selector: r => r.numberOfSemesters,
          sortable: true,
          width: "125px",
          center: true,
        },
        {
          name: "Period",
          selector: r => r.period ? `${r.period.startDate} to ${r.period.endDate}` : "N/A",
          sortable: true,
          width: "160px",
        },
        {
          name: "Students",
          selector: r => r.students?.length || r.numberOfStudents || 0,
          sortable: true,
          width: "120px",
          center: true,
        },
      ]
      : []),
    ...(activeTab === "examFees"
      ? [
        { name: "Center", selector: r => r.center?.name, sortable: true },
        { name: "Course", selector: r => r.course?.title, sortable: true },
        { name: "Batch", selector: r => r.batch?.name, sortable: true },
        { name: "Type", selector: r => r.feeType === "Other" ? r.otherFeeType : (r.feeType || "Term"), sortable: true },
        { name: "Terms", selector: r => r.terms?.join(", ") || "-", sortable: true },
        {
          name: "Fee",
          selector: r => r.fee,
          sortable: true,
          cell: r => <span className="font-bold text-green-600">₹{r.fee}</span>
        },
      ]
      : []),

    {
      name: "Actions",
      center: true,
      width: "140px",
      cell: r => (
        <ActionsDropdown
          row={r}
          activeTab={activeTab}
          openLoginModal={openLoginModal}
          openAssignStudentsModal={openAssignStudentsModal}
          openAssignSubjectModal={openAssignSubjectModal}
          openModal={openModal}
          handleDelete={handleDelete}
        />
      )
    }
  ];

  const filteredData = data.filter(item => {
    if (activeTab === "examFees") {
      return (
        item.center?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.course?.title?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return item.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Center Management</h1>
          <p className="text-sm text-gray-500">Manage all academy centers and branches</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-brand-700 transition-colors shadow-sm"
        >
          <Plus size={20} /> Add {config[activeTab].singular}
        </button>
      </div>



      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden pb-4">
        <CustomDataTable
          columns={columns}
          data={filteredData}
          progressPending={loading}
          search={searchQuery}
          setSearch={setSearchQuery}
          searchPlaceholder={`Search ${config[activeTab].title.toLowerCase()}...`}
        />
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-start justify-center p-4 py-10">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl scale-in-center">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
                {config[activeTab].icon}
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                {isEditing
                  ? `Edit ${config[activeTab].singular}`
                  : `Create ${config[activeTab].singular}`}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab !== "examFees" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    {config[activeTab].singular} Name
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    className="w-full rounded-xl border-gray-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3"
                    placeholder={`Enter ${config[activeTab].singular.toLowerCase()} name...`}
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
              )}

              {activeTab === "examFees" && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Fee Type</label>
                    <select required className="w-full rounded-xl border-gray-200 p-3 bg-white border shadow-sm focus:border-brand-500" value={formData.feeType} onChange={e => setFormData({ ...formData, feeType: e.target.value })}>
                      <option value="Term">Term Fees</option>
                      <option value="Exam">Exam Fees</option>
                      <option value="Other">Other Fees</option>
                    </select>
                  </div>
                  {formData.feeType === "Other" && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Specify Other Fee</label>
                      <input type="text" required className="w-full rounded-xl border-gray-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3" value={formData.otherFeeType} onChange={e => setFormData({ ...formData, otherFeeType: e.target.value })} placeholder="E.g., Library Fee" />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Center</label>
                    <select required className="w-full rounded-xl border-gray-200 p-3 bg-white border shadow-sm focus:border-brand-500" value={formData.center} onChange={e => setFormData({ ...formData, center: e.target.value })}>
                      <option value="">Select Center</option>
                      {centersList.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Course</label>
                    <select required className="w-full rounded-xl border-gray-200 p-3 bg-white border shadow-sm focus:border-brand-500" value={formData.course} onChange={e => setFormData({ ...formData, course: e.target.value })}>
                      <option value="">Select Course</option>
                      {coursesList.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Batch</label>
                    <select required className="w-full rounded-xl border-gray-200 p-3 bg-white border shadow-sm focus:border-brand-500" value={formData.batch} onChange={e => setFormData({ ...formData, batch: e.target.value })}>
                      <option value="">Select Batch</option>
                      {batchesList.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Term</label>
                    <select required className="w-full rounded-xl border-gray-200 p-3 bg-white border shadow-sm focus:border-brand-500" value={formData.terms[0] || ""} onChange={e => {
                      setFormData({ ...formData, terms: [Number(e.target.value)] });
                    }}>
                      <option value="">Select Term</option>
                      {[1, 2].map(term => (
                        <option key={term} value={term}>Term {term}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Fee Amount (₹)</label>
                    <input type="number" required className="w-full rounded-xl border-gray-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3" value={formData.fee} onChange={e => setFormData({ ...formData, fee: Number(e.target.value) })} />
                  </div>
                </>
              )}

              {activeTab === "centers" && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-xl border-gray-200 p-3"
                      placeholder="Enter location..."
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-xl border-gray-200 p-3"
                      placeholder="Enter description..."
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                    />
                  </div>
                </>
              )}

              {activeTab === "subjects" && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Subject Code
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full rounded-xl border-gray-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3"
                      placeholder="Enter subject code..."
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Subject Type
                    </label>
                    <select
                      required
                      className="w-full rounded-xl border-gray-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3"
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value })
                      }
                    >
                      <option value="Theory">Theory</option>
                      <option value="Practical">Practical</option>
                    </select>
                  </div>
                </>
              )}

              {activeTab === "batches" && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Batch ID</label>
                    <input type="text" required className="w-full rounded-xl border-gray-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3" value={formData.batchId} onChange={e => setFormData({ ...formData, batchId: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Center</label>
                    <select required className="w-full rounded-xl border-gray-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3 bg-white" value={formData.center} onChange={e => setFormData({ ...formData, center: e.target.value })}>
                      <option value="">Select Center</option>
                      {centersList.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Course</label>
                    <select required className="w-full rounded-xl border-gray-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3 bg-white" value={formData.course} onChange={e => setFormData({ ...formData, course: e.target.value })}>
                      <option value="">Select Course</option>
                      {coursesList.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Start Date</label>
                      <input type="month" required className="w-full rounded-xl border-gray-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3" value={formData.period?.startDate} onChange={e => setFormData({ ...formData, period: { ...formData.period, startDate: e.target.value } })} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">End Date</label>
                      <input type="month" required className="w-full rounded-xl border-gray-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3" value={formData.period?.endDate} onChange={e => setFormData({ ...formData, period: { ...formData.period, endDate: e.target.value } })} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Certificate Date (Optional)</label>
                    <input type="date" className="w-full rounded-xl border-gray-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3" value={formData.certificateDate} onChange={e => setFormData({ ...formData, certificateDate: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Number of Semesters</label>
                    <input type="number" min="1" required className="w-full rounded-xl border-gray-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3" value={formData.numberOfSemesters} onChange={e => {
                      const num = Number(e.target.value);
                      setFormData(prev => ({ ...prev, numberOfSemesters: num, semesters: prev.semesters.slice(0, num) }));
                    }} />
                  </div>
                </>
              )}
              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 shadow-md shadow-brand-200 transition-all hover:scale-[1.02]"
                >
                  {isEditing
                    ? "Save Changes"
                    : `Add ${config[activeTab].singular}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Subjects Modal */}
      {showAssignSubjectModal && currentBatchAssign && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-start justify-center p-4 py-10">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl scale-in-center">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <BookOpen size={20} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Assign Subjects to {currentBatchAssign.name || currentBatchAssign.batchId}
              </h2>
            </div>
            
            <form onSubmit={handleAssignSubjectSubmit} className="space-y-4">
              <div className="flex border-b border-gray-200 gap-4 mb-4 overflow-x-auto">
                {assignSubjectsData.map((sem) => (
                  <button
                    key={sem.semesterNumber}
                    type="button"
                    onClick={() => setAssignSemTab(sem.semesterNumber)}
                    className={`pb-3 px-2 text-sm font-medium transition-colors relative whitespace-nowrap ${
                      assignSemTab === sem.semesterNumber
                        ? "text-brand-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Semester {sem.semesterNumber}
                    {assignSemTab === sem.semesterNumber && (
                      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-600 rounded-t-full" />
                    )}
                  </button>
                ))}
              </div>
              
              {assignSubjectsData.map((sem, index) => {
                if (sem.semesterNumber !== assignSemTab) return null;
                
                return (
                  <div key={sem.semesterNumber} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Number of Subjects
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="w-full rounded-xl border-gray-200 p-3"
                        value={sem.noOfSubjects}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const newData = [...assignSubjectsData];
                          newData[index].noOfSubjects = val;
                          setAssignSubjectsData(newData);
                        }}
                      />
                    </div>
                    
                    {sem.noOfSubjects > 0 && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Select Subjects</label>
                        <MultiSelectSubjects
                          subjectsList={subjectsList}
                          selectedSubjects={sem.subjects || []}
                          maxSelection={sem.noOfSubjects}
                          onChange={(selectedIds) => {
                            const newData = [...assignSubjectsData];
                            newData[index].subjects = selectedIds;
                            setAssignSubjectsData(newData);
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowAssignSubjectModal(false)}
                  className="px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 shadow-md transition-all"
                >
                  Save Assignments
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-start justify-center p-4 py-10">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl scale-in-center">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Key size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Manage Center Logins</h2>
              </div>
              <button onClick={() => setShowLoginModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Existing Users List */}
              <div className="border-r border-slate-100 pr-6">
                <h3 className="text-sm font-bold text-slate-700 mb-4">Existing Accounts</h3>
                {centerUsers.length === 0 ? (
                  <p className="text-sm text-slate-500">No accounts created for this center yet.</p>
                ) : (
                  <div className="space-y-3">
                    {centerUsers.map((u) => {
                      const isSelected = loginData.role === u.role;
                      return (
                        <div
                          key={u._id}
                          onClick={() => handleSelectAccount(u)}
                          className={`p-3 rounded-xl border flex justify-between items-center cursor-pointer transition-all ${
                            isSelected
                              ? "bg-blue-50 border-blue-300 ring-2 ring-blue-500/20 shadow-sm"
                              : "bg-slate-50 border-slate-100 hover:bg-slate-100/80"
                          }`}
                        >
                          <div className="overflow-hidden">
                            <p className="text-sm font-bold text-slate-800 truncate">{u.name}</p>
                            <p className="text-xs text-slate-500 truncate">{u.email}</p>
                          </div>
                          <div className="px-2 py-1 bg-brand-50 text-brand-700 text-[10px] font-bold rounded capitalize whitespace-nowrap">
                            {u.role.replace('-', ' ')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Create/Update Form */}
              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-4">Create or Update Account</h3>
                <form onSubmit={handleLoginSubmit} autoComplete="off" className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Role</label>
                    <select
                      required
                      className="w-full rounded-xl border border-gray-200 p-2.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      value={loginData.role}
                      onChange={(e) => handleRoleSelectChange(e.target.value)}
                    >
                      <option value="center">Center Admin</option>
                      <option value="center-hr">Center HR</option>
                      <option value="center-finance">Center Finance</option>
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1">* Creating an account for an existing role will update it.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Display Name</label>
                    <input
                      type="text"
                      required
                      autoComplete="off"
                      className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      value={loginData.name}
                      onChange={(e) => setLoginData({ ...loginData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      autoComplete="off"
                      name="center_account_email"
                      className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        name="center_account_password"
                        className="w-full rounded-xl border border-gray-200 p-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        placeholder={centerUsers.some(u => u.role === loginData.role) ? "Enter new password to update..." : "Enter password..."}
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors p-1"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSavingLogin}
                      className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 shadow-md transition-all disabled:opacity-50"
                    >
                      {isSavingLogin ? "Saving..." : "Save Account"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAssignStudentsModal && currentBatchAssignStudents && (
        <AssignStudentsModal
          batch={currentBatchAssignStudents}
          onClose={() => setShowAssignStudentsModal(false)}
          onAssignSuccess={handleAssignStudentsSuccess}
        />
      )}
    </div>
  );
};

export default CenterManagement;