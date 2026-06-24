import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit, FileText, Calendar, BookOpen, MapPin, X, CheckSquare, Layers, Download, Upload, FileArchive, DollarSign } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import CustomDataTable from "../../components/DataTable";
import { useAuth } from "../../context/AuthContext";
import * as XLSX from 'xlsx';
import MarksheetModal from "../../components/MarksheetModal";
import BulkEditMarksModal from "../../components/BulkEditMarksModal";
import AddStudentFeeModal from "../../components/AddStudentFeeModal";

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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedGroupData, setSelectedGroupData] = useState(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    date: "",
    course: "",
    semester: 1,
    center: "",
    batch: "",
    subject: "",
    totalMark: 100,
    passMark: 35,
    internalMark: 0,
    externalMark: 0,
    theoryMark: 0
  });

  const [markFormData, setMarkFormData] = useState({
    student: "",
    batch: "",
    semester: 1,
    course: "",
    subject: "",
    theoryMark: 0,
    internalMark: 0,
    practicalMark: 0
  });

  const fileInputRef = React.useRef(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [examsRes, coursesRes, centersRes, batchesRes, subjectsRes, marksRes, studentsRes, feesRes] = await Promise.all([
        api.get("/exams"),
        api.get("/courses"),
        api.get("/centers"),
        api.get("/batches"),
        api.get("/subjects"),
        api.get("/marks"),
        isAdmin ? api.get("/students") : Promise.resolve({ data: [] }),
        isAdmin ? api.get("/student-fees") : Promise.resolve({ data: [] })
      ]);
      setExams(examsRes.data);
      setCourses(coursesRes.data);
      setCenters(centersRes.data);
      setBatches(batchesRes.data);
      setSubjects(subjectsRes.data);
      setMarks(marksRes.data);
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

  const openModal = (exam = null) => {
    if (exam) {
      setFormData({
        name: exam.name,
        date: new Date(exam.date).toISOString().split('T')[0],
        course: exam.course?._id || "",
        semester: exam.semester,
        center: exam.center?._id || "",
        batch: exam.batch?._id || "",
        subject: exam.subject?._id || "",
        totalMark: exam.totalMark || 100,
        passMark: exam.passMark || 35,
        internalMark: exam.internalMark || 0,
        externalMark: exam.externalMark || 0,
        theoryMark: exam.theoryMark || 0
      });
      setCurrentId(exam._id);
      setIsEditing(true);
    } else {
      setFormData({
        name: "",
        date: "",
        course: "",
        semester: 1,
        center: "",
        batch: "",
        subject: "",
        totalMark: 100,
        passMark: 35,
        internalMark: 0,
        externalMark: 0,
        theoryMark: 0
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

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this exam?")) {
      try {
        await api.delete(`/exams/${id}`);
        toast.success("Exam deleted successfully");
        fetchData();
      } catch (error) {
        toast.error("Failed to delete exam");
      }
    }
  };

  const openMarkModal = (mark = null) => {
    if (mark) {
      setMarkFormData({
        student: mark.student?._id || "",
        batch: mark.batch?._id || "",
        semester: mark.semester || 1,
        course: mark.course?._id || "",
        subject: mark.subject?._id || "",
        theoryMark: mark.theoryMark,
        internalMark: mark.internalMark,
        practicalMark: mark.practicalMark || 0
      });
      setCurrentId(mark._id);
      setIsEditing(true);
    } else {
      setMarkFormData({
        student: "",
        batch: "",
        semester: 1,
        course: "",
        subject: "",
        theoryMark: 0,
        internalMark: 0,
        practicalMark: 0
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
        await api.put(`/marks/${currentId}`, markFormData);
        toast.success("Mark updated successfully");
      } else {
        await api.post("/marks", markFormData);
        toast.success("Mark added successfully");
      }
      setShowMarkModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save mark");
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
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Student ID,Semester,Course Title,Subject Code,Theory Mark,Internal Mark,Practical Mark\n"
      + "STU123,1,Class 10,MAT01,40,20,10";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sample_marks.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    const st = students.find(s => s._id === studentId);
    let courseId = "";
    let batchId = "";
    if (st && st.enrolledCourses && st.enrolledCourses.length > 0) {
      courseId = st.enrolledCourses[0].course?._id || st.enrolledCourses[0].course || "";
      batchId = st.enrolledCourses[0].batch || "";
    }
    setMarkFormData({ ...markFormData, student: studentId, course: courseId, batch: batchId });
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
    if (searchQuery) {
      return f.student?.studentNameEnglish?.toLowerCase().includes(searchQuery.toLowerCase()) || 
             f.student?.studentId?.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const examColumns = [
    { name: "S.No", selector: (row, i) => i + 1, width: "70px", center: true },
    {
      name: "Exam Name",
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
              <Calendar size={12} /> {new Date(row.date).toLocaleDateString()}
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
      name: "Center",
      selector: row => row.center?.name,
      sortable: true,
      cell: row => (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100">
          <MapPin size={12} /> {row.center?.name || "N/A"}
        </span>
      )
    },
    {
      name: "Subject",
      cell: row => (
        <div className="py-2">
          {row.subject ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {row.subject.name} ({row.subject.code})
            </span>
          ) : (
            <span className="text-xs text-slate-400 italic">No Subject</span>
          )}
        </div>
      ),
      width: "200px"
    }
  ];

  if (isAdmin) {
    examColumns.push({
      name: "Actions",
      center: true,
      width: "120px",
      cell: row => (
        <div className="flex justify-center gap-2">
          <button onClick={() => openModal(row)} className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
            <Edit size={18} />
          </button>
          <button onClick={() => handleDelete(row._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
          <p className="text-sm text-slate-500">Manage academy examinations, schedules, and student marks</p>
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

        {isAdmin && activeTab === "payments" && (
          <button onClick={() => setShowPaymentModal(true)} className="bg-brand-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-brand-700 shadow-md shadow-brand-600/20 transition-all hover:scale-[1.02]">
            <Plus size={20} /> Add Fees
          </button>
        )}
        </div>
      </div>

      {/* Tabs */} 
      <div className="flex items-center gap-4 border-b border-slate-200">
        <button
          className={`pb-4 px-2 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "exams" ? "border-brand-600 text-brand-600" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
          onClick={() => setActiveTab("exams")}
        >
          <FileText size={18} /> Exams
        </button>
        <button
          className={`pb-4 px-2 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "marks" ? "border-brand-600 text-brand-600" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
          onClick={() => setActiveTab("marks")}
        >
          <CheckSquare size={18} /> Marks
        </button>
        {isAdmin && (
          <button
            className={`pb-4 px-2 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === "payments" ? "border-brand-600 text-brand-600" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
            onClick={() => setActiveTab("payments")}
          >
            <DollarSign size={18} /> Fees
          </button>
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
        ) : activeTab === "payments" ? (
          <CustomDataTable
            columns={paymentColumns}
            data={filteredStudentFees}
            progressPending={loading}
            search={searchQuery}
            setSearch={setSearchQuery}
            searchPlaceholder="Search payments by student name or ID..."
          />
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
                  <label className="block text-sm font-bold text-slate-700 mb-1">Exam Code</label>
                  <input type="text" required className="w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3 text-sm bg-slate-50" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Exam Date</label>
                  <input type="date" required className="w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3 text-sm bg-slate-50" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Course</label>
                  <select required className="w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3 text-sm bg-slate-50" value={formData.course} onChange={(e) => setFormData({ ...formData, course: e.target.value })}>
                    <option value="">Select Course</option>
                    {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Semester</label>
                  <select required className="w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3 text-sm bg-slate-50" value={formData.semester} onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}>
                    {[1, 2, 3, 4, 5, 6].map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Center</label>
                  <select required className="w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3 text-sm bg-slate-50" value={formData.center} onChange={(e) => setFormData({ ...formData, center: e.target.value })}>
                    <option value="">Select Center</option>
                    {centers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Batch</label>
                  <select required className="w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3 text-sm bg-slate-50" value={formData.batch} onChange={(e) => setFormData({ ...formData, batch: e.target.value })}>
                    <option value="">Select Batch</option>
                    {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Subject</label>
                  <select required className="w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3 text-sm bg-slate-50" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })}>
                    <option value="">Select Subject</option>
                    {subjects.map(sub => <option key={sub._id} value={sub._id}>{sub.name} ({sub.code})</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Total Mark</label>
                  <input type="number" required className="w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3 text-sm bg-slate-50" value={formData.totalMark} onChange={(e) => setFormData({ ...formData, totalMark: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Pass Mark</label>
                  <input type="number" required className="w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3 text-sm bg-slate-50" value={formData.passMark} onChange={(e) => setFormData({ ...formData, passMark: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Internal</label>
                  <input type="number" required className="w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3 text-sm bg-slate-50" value={formData.internalMark} onChange={(e) => setFormData({ ...formData, internalMark: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">External</label>
                  <input type="number" required className="w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3 text-sm bg-slate-50" value={formData.externalMark} onChange={(e) => setFormData({ ...formData, externalMark: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Theory</label>
                  <input type="number" required className="w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3 text-sm bg-slate-50" value={formData.theoryMark} onChange={(e) => setFormData({ ...formData, theoryMark: Number(e.target.value) })} />
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-600/20">
                  {isEditing ? "Update Exam" : "Create Exam"}
                </button>
              </div>
            </form>
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
                  <select required className="w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3 text-sm bg-slate-50" value={markFormData.batch} onChange={(e) => setMarkFormData({ ...markFormData, batch: e.target.value })}>
                    <option value="">Select Batch</option>
                    {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Course</label>
                  <select required className="w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3 text-sm bg-slate-50" value={markFormData.course} onChange={(e) => setMarkFormData({ ...markFormData, course: e.target.value })}>
                    <option value="">Select Course</option>
                    {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Semester</label>
                  <select required className="w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3 text-sm bg-slate-50" value={markFormData.semester} onChange={(e) => setMarkFormData({ ...markFormData, semester: Number(e.target.value) })}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Subject</label>
                  <select required className="w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3 text-sm bg-slate-50" value={markFormData.subject} onChange={(e) => setMarkFormData({ ...markFormData, subject: e.target.value })}>
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
                  </select>
                </div>
                

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Theory Mark</label>
                  <input type="number" required className="w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3 text-sm bg-slate-50" value={markFormData.theoryMark} onChange={(e) => setMarkFormData({ ...markFormData, theoryMark: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Internal Mark</label>
                  <input type="number" required className="w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3 text-sm bg-slate-50" value={markFormData.internalMark} onChange={(e) => setMarkFormData({ ...markFormData, internalMark: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Practical Mark</label>
                  <input type="number" required className="w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3 text-sm bg-slate-50" value={markFormData.practicalMark} onChange={(e) => setMarkFormData({ ...markFormData, practicalMark: Number(e.target.value) })} />
                </div>
              </div>
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

      {showPaymentModal && (
        <AddStudentFeeModal
          onClose={() => setShowPaymentModal(false)}
          onSave={handlePaymentSubmit}
          students={students}
          centers={centers}
          courses={courses}
          batches={batches}
        />
      )}
    </div>
  );
};

export default ExamManagement;
