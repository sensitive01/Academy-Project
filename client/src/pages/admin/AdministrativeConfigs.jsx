import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import CustomDataTable from "../../components/DataTable";
import AssignStudentsModal from "../../components/AssignStudentsModal";
import MultiSelectSubjects from "../../components/MultiSelectSubjects";

const toTitleCase = (str) => {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const AdministrativeConfigs = () => {
  const [activeTab, setActiveTab] = useState("departments");
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
  const [loginData, setLoginData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [isSavingLogin, setIsSavingLogin] = useState(false);
  const [loginExists, setLoginExists] = useState(false);

  // Assign Subjects State
  const [showAssignSubjectModal, setShowAssignSubjectModal] = useState(false);
  const [currentBatchAssign, setCurrentBatchAssign] = useState(null);
  const [assignSemTab, setAssignSemTab] = useState(1);
  const [assignSubjectsData, setAssignSubjectsData] = useState([]);

  // Assign Students State
  const [showAssignStudentsModal, setShowAssignStudentsModal] = useState(false);
  const [currentBatchAssignStudents, setCurrentBatchAssignStudents] = useState(null);

  const config = {
    departments: {
      title: "Departments",
      singular: "Department",
      endpoint: "/departments",
      icon: <Building2 size={20} />,
    },
    roles: {
      title: "Roles",
      singular: "Role",
      endpoint: "/roles",
      icon: <UserCheck size={20} />,
    },
    designations: {
      title: "Designations",
      singular: "Designation",
      endpoint: "/designations",
      icon: <Briefcase size={20} />,
    },
    centers: {
      title: "Centers",
      singular: "Center",
      endpoint: "/centers",
      icon: <MapPin size={20} />,
    },
    batches: {
      title: "Batches",
      singular: "Batch",
      endpoint: "/batches",
      icon: <Layers size={20} />,
    },
    subjects: {
      title: "Subjects",
      singular: "Subject",
      endpoint: "/subjects",
      icon: <BookOpen size={20} />,
    },
    examFees: {
      title: "Fees",
      singular: "Exam Fee",
      endpoint: "/exam-fees",
      icon: <DollarSign size={20} />,
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
        setCoursesList(coursesRes.data.filter(c => c.type === "Academic" || !c.type));
        setBatchesList(batchesRes.data);
      } else if (activeTab === "batches") {
        const [batchesRes, coursesRes, subjectsRes, centersRes] = await Promise.all([
          api.get("/batches"),
          api.get("/courses"),
          api.get("/subjects"),
          api.get("/centers")
        ]);
        setData(batchesRes.data);
        setCoursesList(coursesRes.data.filter(c => c.type === "Academic" || !c.type));
        setSubjectsList(subjectsRes.data);
        setCentersList(centersRes.data);
      } else if (activeTab === "subjects") {
        const [subjectsRes, coursesRes] = await Promise.all([
          api.get("/subjects"),
          api.get("/courses")
        ]);
        setData(subjectsRes.data);
        setCoursesList(coursesRes.data.filter(c => c.type === "Academic" || !c.type));
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
  }, [activeTab]);

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
    setLoginData({ name: center.name, email: "", password: "" });
    setLoginExists(false);
    try {
      const { data } = await api.get(`/centers/${center._id}/login`);
      if (data) {
        setLoginData({
          name: data.name || center.name,
          email: data.email || "",
          password: "", // Don't show password
        });
        setLoginExists(true);
      }
    } catch (error) {
      console.error("Error fetching login:", error);
    }
    setShowLoginModal(true);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsSavingLogin(true);
    try {
      await api.post(`/centers/${currentId}/login`, loginData);
      toast.success("Center login saved successfully");
      setShowLoginModal(false);
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
        <div className="flex items-center">
          <div className="h-10 w-10 bg-brand-50 text-brand-600 rounded-lg flex items-center justify-center">
            {config[activeTab].icon}
          </div>
          <div className="ml-3 font-medium text-gray-900">{r.name}</div>
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
        <div className="flex justify-center gap-2">
          {activeTab === "centers" && (
            <button onClick={() => openLoginModal(r)} className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50">
              <Key size={18} />
            </button>
          )}
          {activeTab === "batches" && (
            <>
              <button onClick={() => openAssignStudentsModal(r)} className="text-indigo-600 hover:text-indigo-900 p-2 rounded-lg hover:bg-indigo-50" title="Assign Students">
                <Users size={18} />
              </button>
              <button onClick={() => openAssignSubjectModal(r)} className="text-emerald-600 hover:text-emerald-900 p-2 rounded-lg hover:bg-emerald-50" title="Assign Subjects">
                <BookOpen size={18} />
              </button>
            </>
          )}
          <button onClick={() => openModal(r)} className="text-brand-600 hover:text-brand-900 p-2 rounded-lg hover:bg-brand-50">
            <Edit size={18} />
          </button>
          <button onClick={() => handleDelete(r._id)} className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50">
            <Trash2 size={18} />
          </button>
        </div>
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Administrative Configs
          </h1>
          <p className="text-sm text-gray-500">
            Manage departments, roles, designations, and centers
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-brand-700 transition-colors shadow-sm"
        >
          <Plus size={20} /> Add {config[activeTab].singular}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-8">
        {Object.keys(config).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 px-2 text-sm font-medium transition-colors relative ${activeTab === tab
              ? "text-brand-600"
              : "text-gray-500 hover:text-gray-700"
              }`}
          >
            <div className="flex items-center gap-2">
              {config[tab].icon}
              {config[tab].title}
            </div>
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-600 rounded-t-full" />
            )}
          </button>
        ))}
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
                      <option value="Both">Both</option>
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl scale-in-center">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Key size={20} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Manage Center Login</h2>
            </div>
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  readOnly={loginExists}
                  className={`w-full rounded-xl border border-gray-200 p-3 ${loginExists ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""}`}
                  value={loginData.name}
                  onChange={(e) => setLoginData({ ...loginData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  readOnly={loginExists}
                  className={`w-full rounded-xl border border-gray-200 p-3 ${loginExists ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""}`}
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {loginExists ? "Update Password" : "Password"}
                </label>
                <input
                  type="password"
                  className="w-full rounded-xl border border-gray-200 p-3"
                  placeholder={loginExists ? "••••••••" : "Enter new password..."}
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                />
                {loginExists && (
                  <p className="mt-1 text-xs text-brand-600 font-medium">
                    * Password is already set. Enter a new one only if you wish to change it.
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingLogin}
                  className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 shadow-md transition-all disabled:opacity-50"
                >
                  {isSavingLogin ? "Saving..." : "Save Login Details"}
                </button>
              </div>
            </form>
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

export default AdministrativeConfigs;