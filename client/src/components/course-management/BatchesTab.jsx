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
  X,
  Save,
  Download,
  MoreVertical,
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import CustomDataTable from "../../components/common/DataTable";
import AssignStudentsModal from "../../components/modals/AssignStudentsModal";
import MultiSelectSubjects from "../../components/common/MultiSelectSubjects";
import MultiSelectDropdown from "../../components/common/MultiSelectDropdown";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { saveAs } from "file-saver";

const ActionsDropdown = ({
  row,
  activeTab,
  openLoginModal,
  openAssignModal,
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
        <button 
          onClick={() => { setOpen(false); openAssignModal(row); }} 
          className="w-full text-left px-4 py-2.5 text-[13px] font-semibold flex items-center gap-3 hover:bg-slate-50 transition-colors text-slate-700"
        >
          <UserCheck size={16} className="text-indigo-600"/> Assign Students
        </button>
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

const BatchesTab = () => {
  const activeTab = "batches";
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [batchStep, setBatchStep] = useState(1);
  const [showViewCentersModal, setShowViewCentersModal] = useState(false);
  const [selectedBatchCenters, setSelectedBatchCenters] = useState([]);

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
    centers: [],
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
  const [selectedCenterFilters, setSelectedCenterFilters] = useState(["all"]);
  const [selectedCourseFilters, setSelectedCourseFilters] = useState(["all"]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [centersList, setCentersList] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [batchesList, setBatchesList] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);

  const handleExportExcel = () => {
    const exportRows = filteredData.map((batch, i) => ({
      "S.No": i + 1,
      "Batch ID": batch.batchId || "-",
      "Course": batch.course?.title || "-",
      "Center": batch.centers?.map(c => c.name).join(", ") || batch.center?.name || "-",
      "Semesters": batch.numberOfSemesters || "-",
      "Period": batch.period ? `${batch.period.startDate} to ${batch.period.endDate}` : "-",
      "Students": batch.students?.length || batch.numberOfStudents || 0
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Batches");
    
    const maxLens = {};
    exportRows.forEach(row => {
      Object.keys(row).forEach(key => {
        const valStr = String(row[key]);
        maxLens[key] = Math.max(maxLens[key] || 0, valStr.length);
      });
    });
    worksheet["!cols"] = Object.keys(maxLens).map(key => ({
      wch: Math.max(maxLens[key] + 3, 10)
    }));

    XLSX.writeFile(workbook, "Batches_Directory.xlsx");
    toast.success("Excel exported successfully!");
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Batches Directory", 14, 15);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Generated on: ${new Date().toLocaleDateString("en-IN")} | Total Batches: ${filteredData.length}`, 14, 21);

    const tableColumn = ["S.No", "Batch ID", "Course", "Center", "Period", "Semesters", "Students"];
    const tableRows = [];

    filteredData.forEach((batch, index) => {
      const rowData = [
        index + 1,
        batch.batchId || "-",
        batch.course?.title || "-",
        batch.centers?.map(c => c.name).join(", ") || batch.center?.name || "-",
        batch.period ? `${batch.period.startDate} to ${batch.period.endDate}` : "-",
        batch.numberOfSemesters || "-",
        batch.students?.length || batch.numberOfStudents || 0
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 25,
      theme: "striped",
      styles: { fontSize: 8, cellPadding: 2.5 },
    });
    
    const pdfBlob = doc.output("blob");
    saveAs(pdfBlob, "Batches_Directory.pdf");
    toast.success("PDF exported successfully!");
  };

  const centerFilterOptions = [
    { label: "All Centers", value: "all" },
    ...centersList.map(c => ({ label: c.name, value: c._id }))
  ];

  const handleCenterFilterChange = (newSelection) => {
    if (newSelection.includes("all") && !selectedCenterFilters.includes("all")) {
      setSelectedCenterFilters(["all"]);
    } else if (newSelection.length > 1 && newSelection.includes("all")) {
      setSelectedCenterFilters(newSelection.filter(v => v !== "all"));
    } else if (newSelection.length === 0) {
      setSelectedCenterFilters(["all"]);
    } else {
      setSelectedCenterFilters(newSelection);
    }
  };

  const courseFilterOptions = [
    { label: "All Courses", value: "all" },
    ...coursesList.map(c => ({ label: c.title, value: c._id }))
  ];

  const handleCourseFilterChange = (newSelection) => {
    if (newSelection.includes("all") && !selectedCourseFilters.includes("all")) {
      setSelectedCourseFilters(["all"]);
    } else if (newSelection.length > 1 && newSelection.includes("all")) {
      setSelectedCourseFilters(newSelection.filter(v => v !== "all"));
    } else if (newSelection.length === 0) {
      setSelectedCourseFilters(["all"]);
    } else {
      setSelectedCourseFilters(newSelection);
    }
  };

  const handleModalCentersChange = (newSelection) => {
    if (newSelection.includes("all") && !(formData.centers || []).includes("all")) {
      setFormData({ ...formData, centers: ["all"] });
    } else if (newSelection.length > 1 && newSelection.includes("all")) {
      setFormData({ ...formData, centers: newSelection.filter(v => v !== "all") });
    } else {
      setFormData({ ...formData, centers: newSelection });
    }
  };

  const openAssignStudentsModal = (batch) => {
    setCurrentBatchAssignStudents(batch);
    setShowAssignStudentsModal(true);
  };

  const handleAssignStudentsSuccess = (updatedBatch) => {
    setData(data.map((item) => (item._id === updatedBatch._id ? updatedBatch : item)));
    setShowAssignStudentsModal(false);
    setShowAssignModal(false);
  };

  // Unified Assignment Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [activeAssignTab, setActiveAssignTab] = useState("students");

  const openAssignModal = (batch) => {
    setCurrentBatchAssign(batch);
    const initialData = Array.from({ length: batch.numberOfSemesters || 1 }).map((_, i) => {
      const semNum = i + 1;
      const existingSem = batch.semesters?.find(s => s.semesterNumber === semNum);
      const mappedSubjects = existingSem?.subjects?.map(s => {
        if (!s) return null;
        if (typeof s === 'object') {
          return s._id ? s._id.toString() : s.toString();
        }
        return s.toString();
      }).filter(Boolean) || [];
      return {
        semesterNumber: semNum,
        noOfSubjects: existingSem?.subjects?.length || 0,
        subjects: mappedSubjects
      };
    });
    setAssignSubjectsData(initialData);
    setAssignSemTab(1);
    setActiveAssignTab("students");
    setShowAssignModal(true);
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
        if (activeTab === "batches") {
          let targetCenters = formData.centers || [];
          if (targetCenters.includes("all")) {
            targetCenters = centersList.map(c => c._id);
          }
          if (targetCenters.length === 0) {
            toast.error("Please select at least one center");
            return;
          }

          const loadToast = toast.loading("Updating batch...");
          try {
            const { data: updatedItem } = await api.put(
              `${config[activeTab].endpoint}/${currentId}`,
              { ...formattedData, centers: targetCenters },
            );
            setData(prevData => prevData.map(item => item._id === currentId ? updatedItem : item));
            toast.success("Batch updated successfully");
          } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update batch");
          } finally {
            toast.dismiss(loadToast);
          }
        } else {
          const { data: updatedItem } = await api.put(
            `${config[activeTab].endpoint}/${currentId}`,
            formattedData,
          );
          setData(
            data.map((item) => (item._id === currentId ? updatedItem : item)),
          );
          toast.success(`${config[activeTab].singular} updated`);
        }
      } else {
        if (activeTab === "batches") {
          let centersToCreate = formData.centers || [];
          if (centersToCreate.includes("all")) {
            centersToCreate = centersList.map(c => c._id);
          }
          if (centersToCreate.length === 0) {
            toast.error("Please select at least one center");
            return;
          }

          const loadToast = toast.loading("Creating batch...");
          try {
            const { data: newItem } = await api.post(config[activeTab].endpoint, {
              ...formattedData,
              centers: centersToCreate
            });
            setData([...data, newItem]);
            toast.success("Batch created successfully");
          } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create batch");
          } finally {
            toast.dismiss(loadToast);
          }
        } else {
          const { data: newItem } = await api.post(
            config[activeTab].endpoint,
            formattedData,
          );
          setData([...data, newItem]);
          toast.success(`${config[activeTab].singular} created`);
        }
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
        centers: item.centers ? item.centers.map(c => c._id || c) : (item.center ? [item.center?._id || item.center] : []),
        courses: item.courses ? item.courses.map(c => c._id || c) : (item.course ? [item.course?._id || item.course] : []),
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
        centers: [],
        courses: [],
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
    console.log("OPEN ASSIGN SUBJECT MODAL - BATCH:", batch);
    setCurrentBatchAssign(batch);
    const initialData = Array.from({ length: batch.numberOfSemesters || 1 }).map((_, i) => {
      const semNum = i + 1;
      const existingSem = batch.semesters?.find(s => s.semesterNumber === semNum);
      console.log(`Semester ${semNum} existingSem:`, existingSem);
      const mappedSubjects = existingSem?.subjects?.map(s => {
        if (!s) return null;
        if (typeof s === 'object') {
          return s._id ? s._id.toString() : s.toString();
        }
        return s.toString();
      }).filter(Boolean) || [];
      console.log(`Semester ${semNum} mappedSubjects:`, mappedSubjects);
      return {
        semesterNumber: semNum,
        noOfSubjects: existingSem?.subjects?.length || 0,
        subjects: mappedSubjects
      };
    });
    console.log("initialData:", initialData);
    setAssignSubjectsData(initialData);
    setAssignSemTab(1);
    setShowAssignSubjectModal(true);
  };

  const handleAssignSubjectSubmit = async (e) => {
    e.preventDefault();
    console.log("SUBMIT ASSIGN SUBJECT - assignSubjectsData:", assignSubjectsData);
    try {
      const updatedSemesters = assignSubjectsData.map(sem => ({
        semesterNumber: sem.semesterNumber,
        subjects: sem.subjects
      }));
      console.log("updatedSemesters to send:", updatedSemesters);
      
      const { data: updatedBatch } = await api.put(`/batches/${currentBatchAssign._id}`, {
        ...currentBatchAssign,
        center: currentBatchAssign.center?._id || currentBatchAssign.center,
        courses: currentBatchAssign.courses ? currentBatchAssign.courses.map(c => c._id || c) : [],
        semesters: updatedSemesters
      });
      console.log("updatedBatch returned from server:", updatedBatch);
      
      setData(data.map((item) => (item._id === currentBatchAssign._id ? updatedBatch : item)));
      toast.success("Subjects assigned successfully");
      setShowAssignModal(false);
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
          name: "Course(s)",
          selector: r => r.courses ? r.courses.map(c => c.title).join(", ") : (r.course?.title || "N/A"),
          sortable: true,
          omit: activeTab !== "batches"
        },
        {
          name: "Centers",
          selector: r => r.centers?.length || 0,
          sortable: true,
          width: "120px",
          center: true,
          cell: r => (
            <button
              onClick={() => {
                setSelectedBatchCenters(r.centers || []);
                setShowViewCentersModal(true);
              }}
              className="text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors border border-brand-200 shadow-sm"
            >
              View ({r.centers?.length || 0})
            </button>
          )
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
          openAssignModal={openAssignModal}
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
    const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === "batches") {
      const itemCenterIds = item.centers?.map(c => typeof c === 'object' ? c._id?.toString() : c.toString()) || [];
      const matchesCenter = selectedCenterFilters.includes("all") || 
                            selectedCenterFilters.some(filterId => itemCenterIds.includes(filterId));
      const itemCourseId = item.course?._id ? item.course._id.toString() : item.course?.toString() || "";
      const matchesCourse = selectedCourseFilters.includes("all") || selectedCourseFilters.includes(itemCourseId);
      return matchesSearch && matchesCenter && matchesCourse;
    }
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Batches</h2>
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
          additionalHeaderContent={
            activeTab === "batches" && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Filter Center:</span>
                <div className="w-56">
                  <MultiSelectDropdown
                    options={centerFilterOptions}
                    selected={selectedCenterFilters}
                    onChange={handleCenterFilterChange}
                    placeholder="All Centers"
                  />
                </div>
                
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap ml-2">Course:</span>
                <div className="w-56">
                  <MultiSelectDropdown
                    options={courseFilterOptions}
                    selected={selectedCourseFilters}
                    onChange={handleCourseFilterChange}
                    placeholder="All Courses"
                  />
                </div>

                {(!selectedCenterFilters.includes("all") || selectedCenterFilters.length > 1 || !selectedCourseFilters.includes("all") || selectedCourseFilters.length > 1) && (
                  <button
                    onClick={() => {
                      setSelectedCenterFilters(["all"]);
                      setSelectedCourseFilters(["all"]);
                      setSearchQuery("");
                    }}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                    title="Reset Filter"
                  >
                    <RotateCcw size={16} />
                  </button>
                )}

                {/* Export Dropdown */}
                <div className="relative ml-2">
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white text-xs font-bold rounded-xl hover:bg-brand-700 shadow-sm transition-all active:scale-95"
                    title="Export Options"
                  >
                    <Download size={14} />
                    Export
                  </button>
                  {showExportMenu && (
                    <div className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                      <button 
                        onClick={() => { handleExportExcel(); setShowExportMenu(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <span className="text-emerald-600 font-bold">XLSX</span> Excel
                      </button>
                      <button 
                        onClick={() => { handleExportPDF(); setShowExportMenu(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <span className="text-red-600 font-bold">PDF</span> PDF
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          }
        />
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-start justify-center p-4 py-10">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl scale-in-center">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
                  {config[activeTab].icon}
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  {isEditing
                    ? `Edit ${config[activeTab].singular}`
                    : `Create ${config[activeTab].singular}`}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 bg-gray-50 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
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
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Center(s) *</label>
                    <MultiSelectDropdown
                      options={[{ label: "All Centers", value: "all" }, ...centersList.map(c => ({ label: c.name, value: c._id }))] }
                      selected={formData.centers || []}
                      onChange={handleModalCentersChange}
                      placeholder="Select Center(s)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Course(s) *</label>
                    <MultiSelectDropdown
                      options={coursesList.map(c => ({ label: c.title, value: c._id }))}
                      selected={formData.courses || []}
                      onChange={(selected) => setFormData({ ...formData, courses: selected })}
                      placeholder="Select Course(s)"
                    />
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

      {/* Unified Assignment Modal */}
      {showAssignModal && currentBatchAssign && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-start justify-center p-4 py-10 animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl scale-in-center">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-brand-50 text-brand-600 rounded-xl shadow-sm">
                  <UserCheck size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                    Batch Assignments
                  </h2>
                  <p className="text-sm text-brand-600 font-semibold mt-1">Batch: {currentBatchAssign.name || currentBatchAssign.batchId}</p>
                </div>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-gray-200 gap-6 mb-6">
              <button
                type="button"
                onClick={() => setActiveAssignTab("students")}
                className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 transition-colors relative whitespace-nowrap ${
                  activeAssignTab === "students"
                    ? "text-brand-600 font-extrabold"
                    : "text-gray-500 hover:text-brand-600"
                }`}
              >
                <Users size={16} />
                Assign Students
                {activeAssignTab === "students" && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-600 rounded-t-full" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveAssignTab("semester")}
                className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 transition-colors relative whitespace-nowrap ${
                  activeAssignTab === "semester"
                    ? "text-brand-600 font-extrabold"
                    : "text-gray-500 hover:text-brand-600"
                }`}
              >
                <BookOpen size={16} />
                Assign Semester
                {activeAssignTab === "semester" && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-600 rounded-t-full" />
                )}
              </button>
            </div>

            {/* Tab content */}
            {activeAssignTab === "students" ? (
              <AssignStudentsModal
                batch={currentBatchAssign}
                isTabMode={true}
                onClose={() => setShowAssignModal(false)}
                onAssignSuccess={(updatedBatch) => {
                  handleAssignStudentsSuccess(updatedBatch);
                }}
              />
            ) : (
              <form onSubmit={handleAssignSubjectSubmit} className="space-y-4">
                <div className="flex border-b border-gray-200 gap-4 mb-4 overflow-x-auto">
                  {assignSubjectsData.map((sem) => (
                    <button
                      key={sem.semesterNumber}
                      type="button"
                      onClick={() => setAssignSemTab(sem.semesterNumber)}
                      className={`pb-3 px-2 text-sm font-medium transition-colors relative whitespace-nowrap ${
                        assignSemTab === sem.semesterNumber
                          ? "text-brand-600 font-bold"
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
                    <div key={sem.semesterNumber} className="space-y-4 animate-in fade-in duration-200">
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
                            subjectsList={subjectsList.filter(sub => {
                              const batchCourseIds = (currentBatchAssign?.courses || []).map(c => c._id?.toString() || c.toString());
                              const legacyBatchCourseId = currentBatchAssign?.course?._id?.toString() || currentBatchAssign?.course?.toString();
                              if (legacyBatchCourseId && !batchCourseIds.includes(legacyBatchCourseId)) {
                                batchCourseIds.push(legacyBatchCourseId);
                              }
                              const subCourseId = sub.course?._id?.toString() || sub.course?.toString() || "";
                              const matchesCourse = batchCourseIds.length === 0 || batchCourseIds.includes(subCourseId);
                              const matchesSemester = sub.semester === sem.semesterNumber;
                              return matchesCourse && matchesSemester;
                            })}
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

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-8">
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="px-6 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-600/20 transition-all flex items-center gap-2"
                  >
                    <Save size={18} /> Assign Subjects
                  </button>
                </div>
              </form>
            )}
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
      {showViewCentersModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Assigned Centers</h2>
              <button
                onClick={() => setShowViewCentersModal(false)}
                className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 max-h-[300px] overflow-y-auto">
              {selectedBatchCenters.length > 0 ? (
                <ul className="space-y-2">
                  {selectedBatchCenters.map(center => (
                    <li key={center._id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50">
                      <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-sm">
                        {center.name?.charAt(0) || "C"}
                      </div>
                      <span className="font-semibold text-slate-700">{center.name}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-slate-500 font-medium py-4">No centers assigned.</p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default BatchesTab;