import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit, FileText, Calendar, BookOpen, MapPin, X, CheckSquare, Layers, Download, Upload, FileArchive, DollarSign } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import CustomDataTable from "../../components/common/DataTable";
import { useAuth } from "../../context/AuthContext";
import * as XLSX from 'xlsx';
import MarksheetModal from "../../components/modals/MarksheetModal";
import BulkEditMarksModal from "../../components/modals/BulkEditMarksModal";
import HallTicketModal from "../../components/modals/HallTicketModal";
import AddStudentFeeModal from "../../components/modals/AddStudentFeeModal";
import StudentFeesList from "../../components/payments/StudentFeesList";

const ExamManagement = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [activeTab, setActiveTab] = useState("exams");

  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [centers, setCenters] = useState([]);
  const [batches, setBatches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState([]);
  const [studentFees, setStudentFees] = useState([]);

  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [showMarksheetModal, setShowMarksheetModal] = useState(false);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [showHallTicketModal, setShowHallTicketModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Hall ticket generation states
  const [selectedHallTicketExam, setSelectedHallTicketExam] = useState("");
  const [isGenerateMode, setIsGenerateMode] = useState(false);
  const [selectedHallTicketStudents, setSelectedHallTicketStudents] = useState([]);
  const [hallTickets, setHallTickets] = useState([]);
  const [showGenerateView, setShowGenerateView] = useState(false);
  const [deleteHallTicketConfirm, setDeleteHallTicketConfirm] = useState({ isOpen: false, id: null });

  const [selectedGroupData, setSelectedGroupData] = useState(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedExamData, setSelectedExamData] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null });
  const [showCenterDropdown, setShowCenterDropdown] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    course: "",
    semester: 1,
    centers: [],
    batch: "",
    subjects: [] // array of { subject, date, totalMark, passMark, internalMark, externalMark, theoryMark }
  });

  const [markFormData, setMarkFormData] = useState({
    student: "",
    batch: "",
    semester: 1,
    course: "",
    subjects: [] // array of { subject, theoryMark, internalMark, practicalMark }
  });

  const fileInputRef = React.useRef(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [examsRes, coursesRes, centersRes, batchesRes, subjectsRes, marksRes, studentsRes, feesRes, hallTicketsRes] = await Promise.all([
        api.get("/exams"),
        api.get("/courses"),
        api.get("/centers"),
        api.get("/batches"),
        api.get("/subjects"),
        api.get("/marks"),
        isAdmin ? api.get("/students") : Promise.resolve({ data: [] }),
        isAdmin ? api.get("/student-fees") : Promise.resolve({ data: [] }),
        api.get("/hall-tickets")
      ]);
      setExams(examsRes.data);
      setCourses(coursesRes.data.filter(c => c.type === "Center Courses"));
      setCenters(centersRes.data);
      setBatches(batchesRes.data);
      setSubjects(subjectsRes.data);
      setMarks(marksRes.data);
      setHallTickets(hallTicketsRes.data);
      if (isAdmin) setStudents(studentsRes.data.students || []);
      if (isAdmin) setStudentFees(feesRes.data || []);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (showModal && formData.batch && formData.semester) {
      const availableSubjects = getFilteredSubjects(formData.batch, formData.semester);
      if (availableSubjects.length > 0) {
        setFormData(prev => {
          const newSubjects = availableSubjects.map(sub => {
            const existing = prev.subjects.find(s => String(s.subject) === String(sub._id));
            return existing || {
              subject: sub._id,
              date: "",
              totalMark: 100,
              passMark: 35,
              internalMark: 0,
              externalMark: 0,
              theoryMark: 0
            };
          });
          return { ...prev, subjects: newSubjects };
        });
      }
    }
  }, [formData.batch, formData.semester, showModal, subjects]);

  useEffect(() => {
    if (showMarkModal && markFormData.batch && markFormData.semester) {
      const availableSubjects = getFilteredSubjects(markFormData.batch, markFormData.semester);
      if (availableSubjects.length > 0) {
        setMarkFormData(prev => {
          const newSubjects = availableSubjects.map(sub => {
            const existing = prev.subjects.find(s => String(s.subject) === String(sub._id));
            return existing || {
              subject: sub._id,
              theoryMark: 0,
              internalMark: 0,
              practicalMark: 0
            };
          });
          return { ...prev, subjects: newSubjects };
        });
      }
    }
  }, [markFormData.batch, markFormData.semester, showMarkModal, subjects]);

  const handleCenterToggle = (centerId) => {
    setFormData(prev => {
      const currentCenters = prev.centers || [];
      if (currentCenters.includes(centerId)) {
        return { ...prev, centers: currentCenters.filter(id => id !== centerId) };
      } else {
        return { ...prev, centers: [...currentCenters, centerId] };
      }
    });
  };

  const handleSubjectChange = (subjectId, field, value) => {
    setFormData(prev => {
      const newSubjects = prev.subjects.map(s => {
        if (String(s.subject) === String(subjectId)) {
          return { ...s, [field]: value };
        }
        return s;
      });
      return { ...prev, subjects: newSubjects };
    });
  };

  const handleMarkSubjectChange = (subjectId, field, value) => {
    setMarkFormData(prev => {
      const newSubjects = prev.subjects.map(s => {
        if (String(s.subject) === String(subjectId)) {
          return { ...s, [field]: value };
        }
        return s;
      });
      return { ...prev, subjects: newSubjects };
    });
  };

  const getFilteredSubjects = (batchId, semesterNumber) => {
    if (!batchId || !semesterNumber) return subjects;
    const batch = batches.find(b => b._id === batchId);
    if (!batch || !batch.semesters) return subjects;
    const sem = batch.semesters.find(s => Number(s.semesterNumber) === Number(semesterNumber));
    if (!sem || !sem.subjects || sem.subjects.length === 0) return [];
    
    const subjectIds = sem.subjects.map(s => typeof s === 'object' ? (s._id || s) : s).map(String);
    return subjects.filter(sub => subjectIds.includes(String(sub._id)));
  };

  const getAvailableSemesters = (batchId) => {
    if (!batchId) return [1];
    const batch = batches.find(b => b._id === batchId);
    if (!batch || !batch.numberOfSemesters) return [1];
    return Array.from({ length: batch.numberOfSemesters }, (_, i) => i + 1);
  };

  const openViewModal = (exam) => {
    setSelectedExamData(exam);
    setShowViewModal(true);
  };

  const openModal = (exam = null) => {
    if (exam) {
      setFormData({
        name: exam.name,
        course: exam.course?._id || "",
        semester: exam.semester,
        centers: exam.centers?.map(c => c._id) || [],
        batch: exam.batch?._id || "",
        subjects: exam.subjects?.map(s => ({
          subject: s.subject?._id || s.subject,
          date: s.date ? new Date(s.date).toISOString().split('T')[0] : "",
          totalMark: s.totalMark || 100,
          passMark: s.passMark || 35,
          internalMark: s.internalMark || 0,
          externalMark: s.externalMark || 0,
          theoryMark: s.theoryMark || 0
        })) || []
      });
      setCurrentId(exam._id);
      setIsEditing(true);
    } else {
      setFormData({
        name: "",
        course: "",
        semester: 1,
        centers: [],
        batch: "",
        subjects: []
      });
      setCurrentId(null);
      setIsEditing(false);
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (isEditing) {
        await api.put(`/exams/${currentId}`, payload);
        toast.success("Exam updated successfully");
      } else {
        await api.post("/exams", payload);
        toast.success("Exam created successfully");
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save exam");
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteConfirm({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/exams/${deleteConfirm.id}`);
      toast.success("Exam deleted successfully");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete exam");
    } finally {
      setDeleteConfirm({ isOpen: false, id: null });
    }
  };

  const openMarkModal = (mark = null) => {
    if (mark) {
      setMarkFormData({
        student: mark.student?._id || "",
        batch: mark.batch?._id || "",
        semester: mark.semester || 1,
        course: mark.course?._id || "",
        subjects: [{
          subject: mark.subject?._id || "",
          theoryMark: mark.theoryMark,
          internalMark: mark.internalMark,
          practicalMark: mark.practicalMark || 0
        }]
      });
      setCurrentId(mark._id);
      setIsEditing(true);
    } else {
      setMarkFormData({
        student: "",
        batch: "",
        semester: 1,
        course: "",
        subjects: []
      });
      setCurrentId(null);
      setIsEditing(false);
    }
    setShowMarkModal(true);
  };

  const handleMarkSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        // Editing a single mark
        const payload = {
          student: markFormData.student,
          batch: markFormData.batch,
          semester: markFormData.semester,
          course: markFormData.course,
          subject: markFormData.subjects[0]?.subject,
          theoryMark: markFormData.subjects[0]?.theoryMark,
          internalMark: markFormData.subjects[0]?.internalMark,
          practicalMark: markFormData.subjects[0]?.practicalMark
        };
        await api.put(`/marks/${currentId}`, payload);
        toast.success("Mark updated successfully");
      } else {
        // Bulk uploading new marks for a semester
        await api.post("/marks/bulk-student-semester", markFormData);
        toast.success("Semester results uploaded successfully");
      }
      setShowMarkModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save results");
    }
  };

  const handleBulkUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        if (data.length === 0) {
           toast.error("Excel sheet is empty");
           return;
        }

        const res = await api.post('/marks/bulk', { marks: data });
        toast.success(`Bulk upload completed! Success: ${res.data.results.success}, Failed: ${res.data.results.failed}`);
        if (res.data.results.failed > 0) {
            console.error("Bulk Upload Errors:", res.data.results.errors);
            toast.error("Some records failed. Check console for details.");
        }
        fetchData();
      } catch (err) {
        toast.error("Failed to process Excel file");
      }
      e.target.value = null;
    };
    reader.readAsBinaryString(file);
  };

  const downloadSampleExcel = () => {
    let headers = ["Student ID", "Batch Name", "Semester", "Course Title"];
    let rowData = ["STU123", "Batch A", 1, "Full Stack Web"];
    
    for (let i = 1; i <= 5; i++) {
      headers.push(`Subject ${i} Code`, `Subject ${i} Theory`, `Subject ${i} Internal`, `Subject ${i} Practical`);
      rowData.push(`SUB0${i}`, 40, 20, 10);
    }
    
    const ws = XLSX.utils.aoa_to_sheet([headers, rowData]);
    const wscols = headers.map(h => ({ wch: Math.max(15, h.length + 2) }));
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sample");
    
    XLSX.writeFile(wb, "sample_marks.xlsx");
  };

  const handleMarkDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this mark?")) {
      try {
        await api.delete(`/marks/${id}`);
        toast.success("Mark deleted successfully");
        fetchData();
      } catch (error) {
        toast.error("Failed to delete mark");
      }
    }
  };

  const handleBulkMarkDelete = async (groupMarks) => {
    if (window.confirm(`Are you sure you want to delete all ${groupMarks.length} marks for this semester?`)) {
      try {
        await Promise.all(groupMarks.map(m => api.delete(`/marks/${m._id}`)));
        toast.success("Semester marks deleted successfully");
        fetchData();
      } catch (error) {
        toast.error("Failed to delete marks");
      }
    }
  };

  const handleBulkEditSave = async (updatedMarks, groupDetails) => {
    try {
      await Promise.all(updatedMarks.map(m => {
        return api.put(`/marks/${m._id}`, {
          student: groupDetails.student,
          batch: groupDetails.batch,
          course: groupDetails.course,
          semester: groupDetails.semester,
          subject: m.subject,
          theoryMark: m.theoryMark,
          internalMark: m.internalMark,
          practicalMark: m.practicalMark
        });
      }));
      toast.success("Semester marks updated successfully");
      setShowBulkEditModal(false);
      fetchData();
    } catch (error) {
      toast.error("Failed to update marks");
    }
  };

  const handleStudentChange = (studentId) => {
    if (!studentId) {
      setMarkFormData(prev => ({ ...prev, student: "", course: "", batch: "" }));
      return;
    }
    const st = students.find(s => s._id === studentId);
    let courseId = "";
    let batchId = "";
    if (st) {
      const studentBatch = batches.find(b => 
        b.students && b.students.some(sid => {
          const idStr = typeof sid === 'object' ? (sid._id || sid).toString() : sid.toString();
          return idStr === studentId;
        })
      );
      if (studentBatch) {
        batchId = studentBatch._id;
        courseId = studentBatch.course?._id || studentBatch.course || "";
      } else if (st.enrolledCourses && st.enrolledCourses.length > 0) {
        courseId = st.enrolledCourses[0].course?._id || st.enrolledCourses[0].course || "";
        batchId = st.enrolledCourses[0].batch?._id || st.enrolledCourses[0].batch || "";
      }
    }
    
    // Ensure they are strings, not populated objects
    courseId = typeof courseId === 'object' ? (courseId._id || "") : String(courseId || "");
    batchId = typeof batchId === 'object' ? (batchId._id || "") : String(batchId || "");

    setMarkFormData(prev => ({ ...prev, student: studentId, course: courseId, batch: batchId }));
  };

  const handlePaymentSubmit = async (formData) => {
    try {
      await api.post("/student-fees", formData);
      toast.success("Payment record added successfully");
      setShowPaymentModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add payment");
    }
  };

  const handleTogglePaymentStatus = async (id) => {
    try {
      await api.patch(`/student-fees/${id}/toggle-status`);
      toast.success("Payment status updated");
      fetchData();
    } catch (error) {
      toast.error("Failed to update payment status");
    }
  };

  const handlePaymentDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this payment record?")) {
      try {
        await api.delete(`/student-fees/${id}`);
        toast.success("Payment record deleted successfully");
        fetchData();
      } catch (error) {
        toast.error("Failed to delete payment record");
      }
    }
  };

  const filteredStudentFees = studentFees.filter(f => {
    if (f.feeType !== 'Exam') return false;
    
    if (searchQuery) {
      return f.student?.studentNameEnglish?.toLowerCase().includes(searchQuery.toLowerCase()) || 
             f.student?.studentId?.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const examColumns = [
    { name: "S.No", selector: (row, i) => i + 1, width: "70px", center: true },
    {
      name: "Exam Code/Name",
      selector: row => row.name,
      sortable: true,
      cell: row => (
        <div className="flex items-center gap-3 py-2">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <FileText size={20} />
          </div>
          <div>
            <div className="font-bold text-slate-900">{row.name}</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1">
              <Calendar size={12} /> {new Date(row.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      )
    },
    {
      name: "Course",
      selector: row => row.course?.title,
      sortable: true,
      cell: row => (
        <div>
          <div className="font-semibold text-slate-700">{row.course?.title || "N/A"}</div>
          <div className="text-xs text-slate-500">Sem {row.semester}</div>
        </div>
      )
    },
    {
      name: "Centers",
      cell: row => (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100">
          <MapPin size={12} /> {row.centers?.length || 0} Centers
        </span>
      )
    },
    {
      name: "Subjects",
      cell: row => (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100">
          <BookOpen size={12} /> {row.subjects?.length || 0} Subjects
        </span>
      )
    }
  ];

  if (isAdmin) {
    examColumns.push({
      name: "Actions",
      center: true,
      width: "140px",
      cell: row => (
        <div className="flex justify-center gap-2">
          <button onClick={() => openViewModal(row)} className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="View Schedule">
            <Layers size={18} />
          </button>
          <button onClick={() => openModal(row)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <Edit size={18} />
          </button>
          <button onClick={() => handleDeleteClick(row._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 size={18} />
          </button>
        </div>
      )
    });
  }

  const groupedMarksMap = {};
  marks.forEach(m => {
    if (!m.student) return;
    const key = `${m.student._id}_${m.semester}`;
    if (!groupedMarksMap[key]) {
      let batchId = m.batch?._id || m.batch || m.student?.enrolledCourses?.[0]?.batch || null;
      if (typeof batchId === 'object' && batchId !== null) batchId = batchId._id;
      let batchObj = null;
      if (batchId) batchObj = batches.find(b => String(b._id) === String(batchId));

      groupedMarksMap[key] = {
        key,
        student: m.student,
        course: m.course,
        batch: batchObj,
        semester: m.semester,
        marks: [],
        totalSubjects: 0,
        passCount: 0,
        failCount: 0
      };
    }
    
    // Look up exam config to find pass/fail
    const examConfig = exams.find(e => {
      const eSubId = (e.subject && e.subject._id) ? e.subject._id : e.subject;
      const mSubId = (m.subject && m.subject._id) ? m.subject._id : m.subject;
      const eCourseId = (e.course && e.course._id) ? e.course._id : e.course;
      const mCourseId = (m.course && m.course._id) ? m.course._id : m.course;
      return String(eSubId) === String(mSubId) && String(eCourseId) === String(mCourseId) && e.semester === m.semester;
    });
    
    let isPass = false;
    let totalSecured = (m.theoryMark || 0) + (m.internalMark || 0) + (m.practicalMark || 0);
    
    if (examConfig) {
      isPass = totalSecured >= (examConfig.passMark || 0);
    } else {
      isPass = totalSecured >= 35; // default fallback
    }
    
    groupedMarksMap[key].marks.push({ ...m, isPass, examConfig });
    groupedMarksMap[key].totalSubjects += 1;
    if (isPass) groupedMarksMap[key].passCount += 1;
    else groupedMarksMap[key].failCount += 1;
  });

  const groupedMarksArray = Object.values(groupedMarksMap);

  const hallTicketColumns = [
    { name: "S.No", selector: (row, i) => i + 1, width: "70px", center: true },
    {
      name: "Exam Name",
      selector: row => row.exam?.name,
      sortable: true,
      cell: row => (
        <span className="font-bold text-slate-900">{row.exam?.name || "N/A"}</span>
      )
    },
    {
      name: "Course",
      selector: row => row.exam?.course?.title,
      sortable: true,
      cell: row => (
        <span className="text-slate-700">{row.exam?.course?.title || "N/A"}</span>
      )
    },
    {
      name: "Generated On",
      selector: row => row.generatedAt,
      sortable: true,
      cell: row => (
        <span className="text-slate-500">
          {new Date(row.generatedAt).toLocaleDateString()}
        </span>
      )
    },
    {
      name: "Students",
      selector: row => row.students?.length || 0,
      center: true,
      cell: row => (
        <span className="px-3 py-1 bg-brand-50 text-brand-700 font-bold rounded-full text-xs">
          {row.students?.length || 0}
        </span>
      )
    },
    {
      name: "Action",
      center: true,
      minWidth: "220px",
      cell: row => (
        <div className="flex justify-center gap-2">
          <button 
            onClick={() => {
              setSelectedHallTicketStudents(row.students || []);
              setSelectedHallTicketExam(row.exam?._id || "");
              setShowHallTicketModal(true);
            }} 
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap"
            title="View Hall Tickets"
          >
            <FileText size={18} /> View
          </button>
          <button 
            onClick={() => setDeleteHallTicketConfirm({ isOpen: true, id: row._id })} 
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap"
            title="Delete Hall Ticket Batch"
          >
            <Trash2 size={18} /> Delete
          </button>
        </div>
      )
    }
  ];

  const handleConfirmGeneration = async () => {
    try {
      const selectedStudentIds = selectedHallTicketStudents.map(s => s._id);
      await api.post("/hall-tickets", {
        exam: selectedHallTicketExam,
        students: selectedStudentIds
      });
      toast.success("Hall Tickets generated and saved successfully!");
      fetchData(); // Refresh the hallTickets list
      setShowGenerateView(false);
      setIsGenerateMode(false);
      
      // We don't clear selectedHallTicketStudents here because the modal needs it to display the generated tickets.
      // It will be overwritten next time they view or generate.
      setShowHallTicketModal(true);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save Hall Tickets");
    }
  };

  const confirmDeleteHallTicket = async () => {
    try {
      await api.delete(`/hall-tickets/${deleteHallTicketConfirm.id}`);
      toast.success("Hall Ticket batch deleted successfully");
      fetchData(); // Refresh the hallTickets list
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete Hall Ticket batch");
    } finally {
      setDeleteHallTicketConfirm({ isOpen: false, id: null });
    }
  };

  const markColumns = [
    { name: "S.No", selector: (row, i) => i + 1, width: "70px", center: true },
    {
      name: "Student",
      selector: row => row.student?.studentNameEnglish,
      sortable: true,
      cell: row => (
        <div>
          <div className="font-bold text-slate-900">{row.student?.studentNameEnglish || "N/A"}</div>
          <div className="text-xs text-slate-500">{row.student?.studentId}</div>
        </div>
      )
    },
    {
      name: "Batch",
      selector: row => row.batch?.name,
      sortable: true,
      cell: row => (
        <span className="font-semibold text-slate-700">{row.batch?.name || "N/A"}</span>
      )
    },
    {
      name: "Course",
      selector: row => row.course?.title,
      sortable: true,
      cell: row => (
        <span className="font-semibold text-slate-700">{row.course?.title || "N/A"}</span>
      )
    },
    {
      name: "Semester",
      selector: row => row.semester,
      sortable: true,
      center: true,
      cell: row => (
        <span className="font-semibold text-slate-700">{row.semester || "N/A"}</span>
      )
    },
    {
      name: "Total Subject",
      selector: row => row.totalSubjects,
      sortable: true,
      center: true,
      cell: row => (
        <span className="font-bold text-slate-700">{row.totalSubjects}</span>
      )
    },
    {
      name: "Result",
      cell: row => (
        <div className="flex flex-col gap-1 py-1 text-xs">
          <span className="text-emerald-600 font-bold">Pass: {row.passCount}</span>
          {row.failCount > 0 && <span className="text-red-600 font-bold">Fail: {row.failCount}</span>}
        </div>
      ),
      width: "100px"
    },
    {
      name: "View Marksheet",
      center: true,
      cell: row => (
        <button onClick={() => { setSelectedGroupData(row); setShowMarksheetModal(true); }} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex flex-col items-center gap-1 font-semibold text-[10px]" title="View Marksheet">
          <FileArchive size={16} /> View
        </button>
      )
    }
  ];

  if (isAdmin) {
    markColumns.push({
      name: "Actions",
      center: true,
      width: "100px",
      cell: row => (
        <div className="flex justify-center gap-2">
          <button onClick={() => { setSelectedGroupData(row); setShowBulkEditModal(true); }} className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="Edit Result">
            <Edit size={16} />
          </button>
          <button onClick={() => handleBulkMarkDelete(row.marks)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete Result">
            <Trash2 size={16} />
          </button>
        </div>
      )
    });
  }

  const paymentColumns = [
    { name: "S.No", selector: (row, i) => i + 1, width: "70px", center: true },
    {
      name: "Student", width:"200px",
      selector: row => row.student?.studentNameEnglish,
      sortable: true,
      cell: row => (
        <div className="py-2">
          <div className="font-bold text-slate-900">{row.student?.studentNameEnglish}</div>
          <div className="text-xs text-slate-500">{row.student?.studentId}</div>
        </div>
      )
    },
    {
      name: "Fee Details",
      selector: row => row.feeType,
      cell: row => (
        <div className="py-2 text-xs">
          <div><span className="font-semibold text-slate-700">{row.course?.title}</span></div>
          <div className="text-slate-500 flex gap-2">
            <span>{row.batch?.name}</span>
            <span>&bull;</span>
            <span className="text-brand-600 font-medium">
              {row.feeType === 'Other' ? row.otherFeeType : `${row.feeType} Fee`} 
              {row.terms?.length > 0 && ` (Term ${row.terms[0]})`}
            </span>
          </div>
        </div>
      ),
      width: "350px"
    },
    {
      name: "Amount",
      selector: row => row.amount,
      sortable: true,
      cell: row => <span className="font-bold text-slate-900">₹{row.amount}</span>
    },
    {
      name: "Status",
      selector: row => row.status,
      sortable: true,
      cell: row => (
        <button
          onClick={() => handleTogglePaymentStatus(row._id)}
          className={`px-3 py-1 text-xs font-bold rounded-full transition-colors border ${
            row.status === 'paid' 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
          }`}
        >
          {row.status === 'paid' ? 'PAID' : 'UNPAID'}
        </button>
      )
    },
    {
      name: "Actions",
      center: true,
      width: "150px",
      cell: row => (
        <button onClick={() => handlePaymentDelete(row._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
          <Trash2 size={16} />
        </button>
      )
    }
  ];

  const filteredExams = exams.filter(e => 
    e.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.course?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroupedMarks = groupedMarksArray.filter(m => 
    m.student?.studentNameEnglish?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.student?.studentId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(m.semester).includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Examination Management</h1>
          <p className="text-sm text-slate-500">Manage academy examinations, schedules, and student results</p>
        </div>
        <div className="flex gap-2">
        {isAdmin && activeTab === "exams" && (
          <button onClick={() => openModal()} className="bg-brand-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-brand-700 transition-all shadow-lg shadow-brand-600/20 font-bold">
            <Plus size={20} /> Add Exam
          </button>
        )}
        {isAdmin && activeTab === "marks" && (
          <>
            <button onClick={downloadSampleExcel} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-slate-200 transition-all font-bold">
              <Download size={20} /> Sample CSV
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 font-bold">
              <Upload size={20} /> Bulk Excel
            </button>
            <input type="file" accept=".xlsx, .xls, .csv" className="hidden" ref={fileInputRef} onChange={handleBulkUpload} />
            <button onClick={() => openMarkModal()} className="bg-brand-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-brand-700 transition-all shadow-lg shadow-brand-600/20 font-bold">
              <Plus size={20} /> Upload Result
            </button>
          </>
        )}

        </div>
      </div>

      {/* Tabs */} 
      <div className="flex items-center gap-4 border-b border-slate-200">
        <button
          className={`pb-4 px-2 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "exams" ? "border-brand-600 text-brand-600" : "border-transparent text-slate-500 hover:text-brand-600 hover:border-brand-600"
          }`}
          onClick={() => setActiveTab("exams")}
        >
          <FileText size={18} /> Exams
        </button>
        <button
          className={`pb-4 px-2 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "marks" ? "border-brand-600 text-brand-600" : "border-transparent text-slate-500 hover:text-brand-600 hover:border-brand-600"
          }`}
          onClick={() => setActiveTab("marks")}
        >
          <CheckSquare size={18} /> Results
        </button>
        {isAdmin && (
          <>

            <button
              className={`pb-4 px-2 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === "hall_tickets" ? "border-brand-600 text-brand-600" : "border-transparent text-slate-500 hover:text-brand-600 hover:border-brand-600"
              }`}
              onClick={() => setActiveTab("hall_tickets")}
            >
              <FileText size={18} /> Hall Tickets
            </button>
            <button
              className={`pb-4 px-2 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === "payments_list" ? "border-brand-600 text-brand-600" : "border-transparent text-slate-500 hover:text-brand-600 hover:border-brand-600"
              }`}
              onClick={() => setActiveTab("payments_list")}
            >
              <DollarSign size={18} /> Payments
            </button>
          </>
        )}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {activeTab === "exams" ? (
          <CustomDataTable
            columns={examColumns}
            data={filteredExams}
            progressPending={loading}
            search={searchQuery}
            setSearch={setSearchQuery}
            searchPlaceholder="Search exams by name or course..."
          />
        ) : activeTab === "payments_list" ? (
          <StudentFeesList feeType="Exam" />
        ) : activeTab === "hall_tickets" ? (
          <div className="p-6">
            {!showGenerateView ? (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-slate-800">Generated Hall Tickets</h3>
                  <button 
                    onClick={() => setShowGenerateView(true)}
                    className="bg-brand-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-brand-700 transition-all shadow-lg shadow-brand-600/20 font-bold"
                  >
                    <Plus size={20} /> Generate New
                  </button>
                </div>
                <CustomDataTable
                  columns={hallTicketColumns}
                  data={hallTickets}
                  progressPending={loading}
                  search={searchQuery}
                  setSearch={setSearchQuery}
                  searchPlaceholder="Search generated hall tickets..."
                />
              </div>
            ) : (
            <>
            <div className="mb-6 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Generate New Hall Tickets</h3>
              <button 
                onClick={() => {
                  setShowGenerateView(false);
                  setIsGenerateMode(false);
                  setSelectedHallTicketExam("");
                }}
                className="text-slate-500 hover:text-slate-700 font-bold flex items-center gap-2"
              >
                Back to History
              </button>
            </div>
            <div className="mb-6 flex items-end gap-4">
              <div className="flex-1">
                <label className="block text-sm font-bold text-slate-700 mb-2">Select Exam Schedule</label>
                <select 
                  className="w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3 text-sm bg-slate-50"
                  value={selectedHallTicketExam}
                  onChange={(e) => {
                    setSelectedHallTicketExam(e.target.value);
                    setSelectedHallTicketStudents([]);
                    setIsGenerateMode(false);
                  }}
                >
                  <option value="">-- Select Exam --</option>
                  {exams.map(exam => (
                    <option key={exam._id} value={exam._id}>{exam.name} - Sem {exam.semester}</option>
                  ))}
                </select>
              </div>
              <div className="shrink-0 flex gap-2">
                {!isGenerateMode && selectedHallTicketExam && (
                  <button 
                    onClick={() => setIsGenerateMode(true)}
                    className="bg-brand-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-600/20"
                  >
                    Generate Hall Tickets
                  </button>
                )}
                {isGenerateMode && (
                  <>
                    <button 
                      onClick={() => { setIsGenerateMode(false); setSelectedHallTicketStudents([]); }}
                      className="bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleConfirmGeneration}
                      disabled={selectedHallTicketStudents.length === 0}
                      className="bg-brand-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Confirm Generation ({selectedHallTicketStudents.length})
                    </button>
                  </>
                )}
              </div>
            </div>

            {selectedHallTicketExam && (
              <CustomDataTable
                columns={[
                  { name: "S.NO", selector: (row, idx) => idx + 1, width: "80px", center: true },
                  { name: "STUDENT ID", selector: row => row.studentId, sortable: true },
                  { name: "NAME", selector: row => row.studentNameEnglish, sortable: true },
                  { name: "COURSE", selector: row => row.enrolledCourses?.[0]?.course?.title || 'N/A' },
                  { name: "BATCH", selector: row => batches.find(b => String(b._id) === String(row.enrolledCourses?.[0]?.batch))?.name || 'N/A' },
                ]}
                data={students.filter(student => {
                  const examObj = exams.find(e => String(e._id) === String(selectedHallTicketExam));
                  if (!examObj || !examObj.batch) return false;
                  
                  // Exclude students who already have a hall ticket for this exam
                  const hasHallTicket = hallTickets.some(ht => {
                    const isSameExam = String(typeof ht.exam === 'object' ? ht.exam?._id : ht.exam) === String(selectedHallTicketExam);
                    if (!isSameExam) return false;
                    return ht.students?.some(s => String(typeof s === 'object' ? s?._id : s) === String(student._id));
                  });
                  if (hasHallTicket) return false;

                  // Filter students by this exam's batch
                  const studentBatch = student.enrolledCourses?.[0]?.batch;
                  if (!studentBatch) return false;
                  return String(typeof studentBatch === 'object' ? studentBatch._id : studentBatch) === String(typeof examObj.batch === 'object' ? examObj.batch._id : examObj.batch);
                })}
                selectableRows={isGenerateMode}
                onSelectedRowsChange={({ selectedRows }) => {
                  setSelectedHallTicketStudents(selectedRows);
                }}
                search={searchQuery}
                setSearch={setSearchQuery}
                searchPlaceholder="Search students..."
              />
            )}
            </>
            )}
          </div>
        ) : (
          <CustomDataTable
            columns={markColumns}
            data={filteredGroupedMarks}
            progressPending={loading}
            search={searchQuery}
            setSearch={setSearchQuery}
            searchPlaceholder="Search results by student name, ID or semester..."
          />
        )}
      </div>

      {/* Exam Modal */}
      {showModal && isAdmin && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand-50 text-brand-600 rounded-xl">
                  <FileText size={24} />
                </div>
                <h2 className="text-xl font-bold text-slate-900">{isEditing ? "Edit Exam" : "Create New Exam"}</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-full hover:bg-slate-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Base Exam Code</label>
                  <input type="text" required placeholder="e.g. MIDTERM-01" className="w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3 text-sm bg-slate-50" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Batch</label>
                  <select required className="w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3 text-sm bg-slate-50" value={formData.batch} onChange={(e) => {
                    const selectedBatchId = e.target.value;
                    const selectedBatch = batches.find(b => String(b._id) === String(selectedBatchId));
                    setFormData({ 
                      ...formData, 
                      batch: selectedBatchId,
                      course: (() => {
                        const batchCourses = selectedBatch?.courses?.map(c => c._id || c) || [];
                        const legacyCourse = selectedBatch?.course?._id || selectedBatch?.course;
                        if (legacyCourse && !batchCourses.includes(legacyCourse)) batchCourses.push(legacyCourse);
                        return batchCourses.length === 1 ? batchCourses[0].toString() : (batchCourses.includes(formData.course) ? formData.course : "");
                      })()
                    });
                  }}>
                    <option value="">Select Batch</option>
                    {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Course</label>
                  <select required className="w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3 text-sm bg-slate-50" value={formData.course} onChange={(e) => setFormData({ ...formData, course: e.target.value })}>
                    <option value="">Select Course</option>
                    {courses
                      .filter(c => {
                        if (!formData.batch) return true;
                        const b = batches.find(b => String(b._id) === String(formData.batch));
                        const batchCourses = b?.courses?.map(c => c._id?.toString() || c.toString()) || [];
                        const legacyCourse = b?.course?._id?.toString() || b?.course?.toString();
                        if (legacyCourse && !batchCourses.includes(legacyCourse)) batchCourses.push(legacyCourse);
                        return batchCourses.includes(String(c._id));
                      })
                      .map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Semester</label>
                  <select required className="w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3 text-sm bg-slate-50" value={formData.semester} onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}>
                    {getAvailableSemesters(formData.batch).map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>
              </div>

              <div className="relative">
                <label className="block text-sm font-bold text-slate-700 mb-1">Assign to Centers</label>
                <button
                  type="button"
                  onClick={() => setShowCenterDropdown(!showCenterDropdown)}
                  className="w-full flex items-center justify-between rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3 text-sm bg-slate-50 text-left transition-all"
                >
                  <span className={formData.centers.length === 0 ? "text-slate-500" : "text-slate-900 font-medium"}>
                    {formData.centers.length === 0 ? "Select Centers..." : `${formData.centers.length} Centers Selected`}
                  </span>
                  <div className="text-slate-400 text-[10px] shrink-0">▼</div>
                </button>
                {showCenterDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                    <div className="p-2 space-y-1">
                      {centers.map(center => {
                        const isSelected = formData.centers.includes(center._id);
                        return (
                          <label key={center._id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleCenterToggle(center._id)}
                              className="w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500 focus:ring-offset-0"
                            />
                            <span className="text-sm text-slate-700 font-medium">{center.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
                {formData.centers.length === 0 && !showCenterDropdown && <p className="text-xs text-red-500 mt-1">Please select at least one center.</p>}
              </div>

              {formData.subjects.length > 0 && (
                <div className="mt-6 border-t border-slate-200 pt-6">
                  <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <BookOpen size={16} className="text-brand-500" /> Subject Configurations
                  </h3>
                  <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
                    {formData.subjects.map((subConf, idx) => {
                      const subjectDetails = subjects.find(s => String(s._id) === String(subConf.subject));
                      if (!subjectDetails) return null;
                      return (
                        <div key={subConf.subject} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                          <div className="font-bold text-sm text-slate-800 mb-3 flex items-center justify-between">
                            <span>{subjectDetails.name} ({subjectDetails.code})</span>
                            <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full uppercase">{subjectDetails.type}</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                            <div className="md:col-span-2">
                              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Exam Date</label>
                              <input type="date" required className="w-full rounded-lg border-slate-200 border p-2 text-xs" value={subConf.date} onChange={(e) => handleSubjectChange(subConf.subject, 'date', e.target.value)} />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Total Mark</label>
                              <input type="number" required className="w-full rounded-lg border-slate-200 border p-2 text-xs" value={subConf.totalMark} onChange={(e) => handleSubjectChange(subConf.subject, 'totalMark', Number(e.target.value))} />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Pass Mark</label>
                              <input type="number" required className="w-full rounded-lg border-slate-200 border p-2 text-xs" value={subConf.passMark} onChange={(e) => handleSubjectChange(subConf.subject, 'passMark', Number(e.target.value))} />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Theory</label>
                              <input type="number" required className="w-full rounded-lg border-slate-200 border p-2 text-xs" value={subConf.theoryMark} onChange={(e) => handleSubjectChange(subConf.subject, 'theoryMark', Number(e.target.value))} />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Internal</label>
                              <input type="number" required className="w-full rounded-lg border-slate-200 border p-2 text-xs" value={subConf.internalMark} onChange={(e) => handleSubjectChange(subConf.subject, 'internalMark', Number(e.target.value))} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancel</button>
                <button 
                  type="submit" 
                  disabled={formData.centers.length === 0 || formData.subjects.length === 0}
                  className="flex-1 px-4 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isEditing ? "Update Exam Schedule" : "Create Exam Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Exam Schedule Modal */}
      {showViewModal && selectedExamData && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand-50 text-brand-600 rounded-xl">
                  <Layers size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Exam Schedule: {selectedExamData.name}</h2>
                  <div className="text-sm text-slate-500 font-medium flex gap-4 mt-1">
                    <span className="flex items-center gap-1"><BookOpen size={14}/> {selectedExamData.course?.title} - Sem {selectedExamData.semester}</span>
                    <span className="flex items-center gap-1"><MapPin size={14}/> {selectedExamData.centers?.length || 0} Centers</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-full hover:bg-slate-100 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-bold text-slate-700 mb-2">Assigned Centers</h3>
              <div className="flex flex-wrap gap-2">
                {selectedExamData.centers?.map(c => (
                  <span key={c._id} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-100">
                    {c.name}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-700 mb-3">Subject Schedule</h3>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider">
                      <th className="p-3 font-bold border-b border-slate-200">Date</th>
                      <th className="p-3 font-bold border-b border-slate-200">Subject</th>
                      <th className="p-3 font-bold border-b border-slate-200 text-center">Theory</th>
                      <th className="p-3 font-bold border-b border-slate-200 text-center">Internal</th>
                      <th className="p-3 font-bold border-b border-slate-200 text-center">Pass / Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedExamData.subjects?.sort((a, b) => new Date(a.date) - new Date(b.date)).map((sub, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 text-sm font-medium text-slate-700">
                          {sub.date ? new Date(sub.date).toLocaleDateString() : 'TBD'}
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-800 text-sm">{sub.subject?.name}</div>
                          <div className="text-xs text-slate-500">{sub.subject?.code}</div>
                        </td>
                        <td className="p-3 text-sm text-center text-slate-600">{sub.theoryMark}</td>
                        <td className="p-3 text-sm text-center text-slate-600">{sub.internalMark}</td>
                        <td className="p-3 text-sm text-center font-medium">
                          <span className="text-emerald-600">{sub.passMark}</span>
                          <span className="text-slate-400 mx-1">/</span>
                          <span className="text-slate-700">{sub.totalMark}</span>
                        </td>
                      </tr>
                    ))}
                    {(!selectedExamData.subjects || selectedExamData.subjects.length === 0) && (
                      <tr>
                        <td colSpan="5" className="p-6 text-center text-slate-500 text-sm italic">
                          No subjects configured for this schedule.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mark Modal */}
      {showMarkModal && isAdmin && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand-50 text-brand-600 rounded-xl">
                  <CheckSquare size={24} />
                </div>
                <h2 className="text-xl font-bold text-slate-900">{isEditing ? "Edit Mark" : "Upload Result"}</h2>
              </div>
              <button onClick={() => setShowMarkModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-full hover:bg-slate-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleMarkSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Select Student</label>
                  <select required className="w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3 text-sm bg-slate-50" value={markFormData.student} onChange={(e) => handleStudentChange(e.target.value)}>
                    <option value="">Choose Student</option>
                    {students.map(s => <option key={s._id} value={s._id}>{s.studentNameEnglish} ({s.studentId})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Batch</label>
                  <select required className={`w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3 text-sm ${markFormData.student ? 'bg-slate-100 cursor-not-allowed text-slate-500' : 'bg-slate-50'}`} value={markFormData.batch} onChange={(e) => {
                    const selectedBatchId = e.target.value;
                    const selectedBatch = batches.find(b => String(b._id) === String(selectedBatchId));
                    setMarkFormData({ 
                      ...markFormData, 
                      batch: selectedBatchId,
                      course: (() => {
                        const batchCourses = selectedBatch?.courses?.map(c => c._id || c) || [];
                        const legacyCourse = selectedBatch?.course?._id || selectedBatch?.course;
                        if (legacyCourse && !batchCourses.includes(legacyCourse)) batchCourses.push(legacyCourse);
                        return batchCourses.length === 1 ? batchCourses[0].toString() : (batchCourses.includes(formData.course) ? formData.course : "");
                      })()
                    });
                  }} disabled={!!markFormData.student}>
                    <option value="">Select Batch</option>
                    {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Course</label>
                  <select required className={`w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3 text-sm ${markFormData.student ? 'bg-slate-100 cursor-not-allowed text-slate-500' : 'bg-slate-50'}`} value={markFormData.course} onChange={(e) => setMarkFormData({ ...markFormData, course: e.target.value })} disabled={!!markFormData.student}>
                    <option value="">Select Course</option>
                    {courses
                      .filter(c => {
                        if (!markFormData.batch) return true;
                        const b = batches.find(b => String(b._id) === String(markFormData.batch));
                        const batchCourses = b?.courses?.map(course => course._id?.toString() || course.toString()) || [];
                        const legacyCourse = b?.course?._id?.toString() || b?.course?.toString();
                        if (legacyCourse && !batchCourses.includes(legacyCourse)) batchCourses.push(legacyCourse);
                        return batchCourses.includes(String(c._id));
                      })
                      .map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Semester</label>
                  <select required className="w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3 text-sm bg-slate-50" value={markFormData.semester} onChange={(e) => setMarkFormData({ ...markFormData, semester: Number(e.target.value) })}>
                    {getAvailableSemesters(markFormData.batch).map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>
              </div>
              
              {markFormData.subjects.length > 0 && (
                <div className="mt-6 border-t border-slate-200 pt-6">
                  <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <CheckSquare size={16} className="text-brand-500" /> Enter Subject Marks
                  </h3>
                  <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
                    {markFormData.subjects.map((subConf, idx) => {
                      const subjectDetails = subjects.find(s => String(s._id) === String(subConf.subject));
                      if (!subjectDetails) return null;
                      return (
                        <div key={subConf.subject} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                          <div className="font-bold text-sm text-slate-800 mb-3 flex items-center justify-between">
                            <span>{subjectDetails.name} ({subjectDetails.code})</span>
                            <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full uppercase">{subjectDetails.type}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Theory Mark</label>
                              <input type="number" required className="w-full rounded-lg border-slate-200 border p-2 text-xs" value={subConf.theoryMark} onChange={(e) => handleMarkSubjectChange(subConf.subject, 'theoryMark', Number(e.target.value))} />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Internal Mark</label>
                              <input type="number" required className="w-full rounded-lg border-slate-200 border p-2 text-xs" value={subConf.internalMark} onChange={(e) => handleMarkSubjectChange(subConf.subject, 'internalMark', Number(e.target.value))} />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Practical Mark</label>
                              <input type="number" required className="w-full rounded-lg border-slate-200 border p-2 text-xs" value={subConf.practicalMark} onChange={(e) => handleMarkSubjectChange(subConf.subject, 'practicalMark', Number(e.target.value))} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowMarkModal(false)} className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-600/20">
                  {isEditing ? "Update Mark" : "Upload Result"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMarksheetModal && selectedGroupData && (
        <MarksheetModal 
          data={selectedGroupData} 
          onClose={() => setShowMarksheetModal(false)} 
        />
      )}

      {showBulkEditModal && selectedGroupData && (
        <BulkEditMarksModal 
          data={selectedGroupData} 
          onClose={() => setShowBulkEditModal(false)} 
          onSave={handleBulkEditSave} 
          students={students}
          batches={batches}
          courses={courses}
          subjects={subjects}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Exam Schedule?</h3>
              <p className="text-sm text-slate-500 mb-6">
                Are you sure you want to completely delete this exam schedule? This action cannot be undone.
              </p>
              <div className="flex w-full gap-3">
                <button 
                  onClick={() => setDeleteConfirm({ isOpen: false, id: null })} 
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete} 
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Hall Ticket Confirm Modal */}
      {deleteHallTicketConfirm.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Hall Tickets?</h3>
              <p className="text-sm text-slate-500 mb-6">
                Are you sure you want to completely delete this generated Hall Ticket batch? This action cannot be undone.
              </p>
              <div className="flex w-full gap-3">
                <button 
                  onClick={() => setDeleteHallTicketConfirm({ isOpen: false, id: null })} 
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDeleteHallTicket} 
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hall Ticket Modal */}
      {showHallTicketModal && (
        <HallTicketModal
          students={selectedHallTicketStudents}
          exam={exams.find(e => String(e._id) === String(selectedHallTicketExam))}
          onClose={() => setShowHallTicketModal(false)}
        />
      )}

    </div>
  );
};

export default ExamManagement;
