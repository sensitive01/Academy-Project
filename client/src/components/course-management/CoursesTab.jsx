import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Plus,
  Trash2,
  Edit,
  Eye,
  ToggleLeft,
  ToggleRight,
  X,
  BookOpen,
  Clock,
  BarChart,
  IndianRupee,
  User as UserIcon,
  CheckCircle2,
  Users as UsersIcon,
  Play,
  Video,
  MoreVertical,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import toast from "react-hot-toast";
import CustomDataTable from "../../components/common/DataTable";
import LessonManagementModal from "../../components/modals/LessonManagementModal";
import Loading from "../../components/common/Loading";
import ConfirmationModal from "../../components/modals/ConfirmationModal";

const ActionsDropdown = ({ 
  row, 
  handleToggleStatus, 
  handleView, 
  handleEdit,
  handleShowStudents, 
  handleManageLessons, 
  handleDelete,
  courseType
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
        left: `${coords.x - 192}px`, // 192px is w-48
        zIndex: 9999
      }}
      className="w-48 bg-white rounded-xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.15)] border border-slate-100 py-1.5 overflow-hidden text-left animate-in fade-in zoom-in-95 duration-100"
    >
      <button 
        onClick={() => { setOpen(false); handleToggleStatus(row._id); }} 
        className="w-full text-left px-4 py-2.5 text-[13px] font-semibold flex items-center gap-3 hover:bg-slate-50 transition-colors text-slate-700"
      >
        {row.isActive ? <ToggleRight size={16} className="text-green-600"/> : <ToggleLeft size={16} className="text-slate-400"/>}
        {row.isActive ? "Deactivate" : "Activate"}
      </button>
      <button 
        onClick={() => { setOpen(false); handleView(row); }} 
        className="w-full text-left px-4 py-2.5 text-[13px] font-semibold flex items-center gap-3 hover:bg-slate-50 transition-colors text-slate-700"
      >
        <Eye size={16} className="text-brand-600"/> View Details
      </button>
      <button 
        onClick={() => { setOpen(false); handleEdit(row); }} 
        className="w-full text-left px-4 py-2.5 text-[13px] font-semibold flex items-center gap-3 hover:bg-slate-50 transition-colors text-slate-700"
      >
        <Edit size={16} className="text-blue-600"/> Edit Course
      </button>
      <button 
        onClick={() => { setOpen(false); handleShowStudents(row); }} 
        className="w-full text-left px-4 py-2.5 text-[13px] font-semibold flex items-center gap-3 hover:bg-slate-50 transition-colors text-slate-700"
      >
        <UsersIcon size={16} className="text-purple-600"/> Enrolled Students
      </button>
      {courseType !== "Center Courses" && (
        <button 
          onClick={() => { setOpen(false); handleManageLessons(row); }} 
          className="w-full text-left px-4 py-2.5 text-[13px] font-semibold flex items-center gap-3 hover:bg-slate-50 transition-colors text-slate-700"
        >
          <Play size={16} className="text-orange-600"/> Manage Lessons
        </button>
      )}
      <div className="h-px bg-slate-100 my-1 mx-2"></div>
      <button 
        onClick={() => { setOpen(false); handleDelete(row._id); }} 
        className="w-full text-left px-4 py-2.5 text-[13px] font-semibold flex items-center gap-3 hover:bg-red-50 transition-colors text-red-600"
      >
        <Trash2 size={16} /> Delete Course
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

const CoursesTab = ({ courseType }) => {
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const isEdit = !!selectedCourse;
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [fetchingStudents, setFetchingStudents] = useState(false);
  const [currentCourseTitle, setCurrentCourseTitle] = useState("");
  const [showManageLessons, setShowManageLessons] = useState(false);
  const [manageCourse, setManageCourse] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, id: null });

  // Form State
  const [formData, setFormData] = useState({
    courseId: "",
    title: "",
    description: "",
    price: "",
    category: courseType === "Center Courses" ? "Center Courses" : "Development",
    type: courseType,
    level: "Beginner",
    duration: "",
    durationUnit: courseType === "Center Courses" ? "year" : "week",
    instructor: "",
    subjects: [],
    thumbnail: null,
    syllabus: [{ week: courseType === "Center Courses" ? "Year 1" : "Week 1", topic: "", description: "", projectName: "" }],
    inlineSubjects: [{ name: "", code: "", semester: 1, type: "Theory" }],
  });
  const [preview, setPreview] = useState(null);

  const fetchCourses = async () => {
    try {
      const { data } = await api.get("/courses");
      setCourses(data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const fetchInstructors = async () => {
    try {
      const { data } = await api.get("/employees");
      // Map employees to a format usable for the dropdown (using their associated user ID)
      const list = data
        .map((emp) => ({
          id: emp.user?._id,
          name: emp.user?.name || `${emp.firstName} ${emp.lastName}`,
          role: emp.user?.role || emp.role,
        }))
        .filter((instructor) => 
          instructor.id && 
          (instructor.role?.toLowerCase() === "coach" || 
           instructor.role?.toLowerCase() === "admin" ||
           instructor.role?.toLowerCase() === "center")
        );
      setInstructors(list);
    } catch (error) {
      console.error("Error fetching instructors:", error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const { data } = await api.get("/subjects");
      setAvailableSubjects(data);
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchCourses(), fetchInstructors(), fetchSubjects()]);
      setLoading(false);
    };
    init();
  }, []);

  const handleEdit = (course) => {
    setSelectedCourse(course);
    setFormData({
      courseId: course.courseId || "",
      title: course.title,
      description: course.description,
      price: course.price,
      category: course.category,
      type: course.type || courseType,
      level: course.level,
      duration: course.duration,
      durationUnit: course.durationUnit || (courseType === "Center Courses" ? "year" : "week"),
      instructor: course.instructor?._id || course.instructor || "",
      subjects: course.subjects ? course.subjects.map(s => s._id || s) : [],
      thumbnail: null,
      syllabus:
        course.syllabus && course.syllabus.length > 0
          ? course.syllabus
          : [{ week: courseType === "Center Courses" ? "Year 1" : "Week 1", topic: "", description: "", projectName: "" }],
      inlineSubjects:
        course.subjects && course.subjects.length > 0
          ? course.subjects.map(s => ({
              _id: s._id,
              name: s.name || "",
              code: s.code || "",
              semester: s.semester || 1,
              type: s.type || "Theory"
            }))
          : [{ name: "", code: "", semester: 1, type: "Theory" }],
    });
    setPreview(course.thumbnail?.url || null);
    setShowModal(true);
  };

  const handleView = (course) => {
    setIsViewOnly(true);
    setSelectedCourse(course);
    setFormData({
      courseId: course.courseId || "",
      title: course.title,
      description: course.description,
      price: course.price,
      category: course.category,
      type: course.type || courseType,
      level: course.level,
      duration: course.duration,
      durationUnit: course.durationUnit || (courseType === "Center Courses" ? "year" : "week"),
      instructor: course.instructor?._id || course.instructor || "",
      subjects: course.subjects ? course.subjects.map(s => s._id || s) : [],
      thumbnail: null,
      syllabus:
        course.syllabus && course.syllabus.length > 0
          ? course.syllabus
          : [{ week: courseType === "Center Courses" ? "Year 1" : "Week 1", topic: "", description: "", projectName: "" }],
      inlineSubjects:
        course.subjects && course.subjects.length > 0
          ? course.subjects.map(s => ({
              _id: s._id,
              name: s.name || "",
              code: s.code || "",
              semester: s.semester || 1,
              type: s.type || "Theory"
            }))
          : [{ name: "", code: "", semester: 1, type: "Theory" }],
    });
    setPreview(course.thumbnail?.url || null);
    setShowModal(true);
  };

  const handleSwitchToEdit = () => {
    setIsViewOnly(false);
  };

  const handleToggleStatus = async (id) => {
    try {
      const { data } = await api.patch(`/courses/${id}/status`);
      toast.success(data.message);
      fetchCourses();
    } catch {
      toast.error("Failed to toggle status");
    }
  };

  const handleDelete = (id) => {
    setConfirmConfig({ isOpen: true, id });
  };

  const confirmCourseDelete = async () => {
    const id = confirmConfig.id;
    if (!id) return;
    
    try {
      await api.delete(`/courses/${id}`);
      setCourses(courses.filter((course) => course._id !== id));
      toast.success("Course deleted successfully");
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Failed to delete course");
    } finally {
      setConfirmConfig({ isOpen: false, id: null });
    }
  };
  
  const handleManageLessons = (course) => {
    setManageCourse(course);
    setShowManageLessons(true);
  };

  const handleShowStudents = async (course) => {
    setFetchingStudents(true);
    setCurrentCourseTitle(course.title);
    setShowStudentsModal(true);
    try {
      const { data } = await api.get(`/courses/${course._id}/students`);
      setEnrolledStudents(data);
    } catch (error) {
      toast.error("Failed to fetch enrolled students");
      console.error(error);
    } finally {
      setFetchingStudents(false);
    }
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, thumbnail: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateSyllabus = (index, field, value) => {
    const newSyllabus = [...formData.syllabus];
    newSyllabus[index][field] = value;
    setFormData({ ...formData, syllabus: newSyllabus });
  };

  const addSyllabusRow = () => {
    setFormData((prev) => ({
      ...prev,
      syllabus: [
        ...prev.syllabus,
        {
          week: `${prev.durationUnit === "week" ? "Week" : (prev.durationUnit === "month" ? "Month" : "Year")} ${prev.syllabus.length + 1}`,
          topic: "",
          description: "",
          projectName: "",
        },
      ],
    }));
  };

  const handleDurationChange = (val) => {
    const num = parseInt(val) || 0;
    setFormData((prev) => {
      let newSyllabus = [...prev.syllabus];
      // 🟢 Increase → add modules
      if (num > newSyllabus.length) {
        for (let i = newSyllabus.length; i < num; i++) {
          newSyllabus.push({
            week: `${prev.durationUnit === "week" ? "Week" : (prev.durationUnit === "month" ? "Month" : "Year")} ${i + 1}`,
            topic: "",
            description: "",
            projectName: "",
          });
        }
      }

      // 🔴 Decrease → remove extra modules
      if (num < newSyllabus.length) {
        newSyllabus = newSyllabus.slice(0, num);
      }

      return {
        ...prev,
        duration: val,
        syllabus: newSyllabus,
      };
    });
  };

  const removeSyllabusRow = (index) => {
    const newSyllabus = formData.syllabus.filter((_, i) => i !== index);
    setFormData({ ...formData, syllabus: newSyllabus });
  };

  const updateInlineSubject = (index, field, value) => {
    const newSubjects = [...formData.inlineSubjects];
    newSubjects[index][field] = value;
    setFormData({ ...formData, inlineSubjects: newSubjects });
  };

  const addInlineSubjectRow = () => {
    setFormData((prev) => ({
      ...prev,
      inlineSubjects: [
        ...prev.inlineSubjects,
        { name: "", code: "", semester: 1, type: "Theory" },
      ],
    }));
  };

  const removeInlineSubjectRow = (index) => {
    const newSubjects = formData.inlineSubjects.filter((_, i) => i !== index);
    setFormData({ ...formData, inlineSubjects: newSubjects });
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (courseType === "Center Courses" && !formData.courseId?.trim()) {
      toast.error("Please enter a Course ID for Center Courses");
      return;
    }

    const loadingToast = toast.loading("Saving course...");
    try {
      const data = new FormData();
      if (formData.courseId !== undefined) {
        data.append("courseId", formData.courseId.trim());
      }
      data.append("title", formData.title || "Untitled Course");
      data.append("description", formData.description || "");
      data.append("price", courseType === "Center Courses" ? "0" : (formData.price || "0"));
      data.append("category", courseType === "Center Courses" ? "Center Courses" : (formData.category || "Development"));
      data.append("type", courseType);
      data.append("level", courseType === "Center Courses" ? "Beginner" : (formData.level || "Beginner"));
      data.append("duration", formData.duration);
      data.append("durationUnit", formData.durationUnit);
      data.append("instructor", formData.instructor || user?._id);
      data.append("subjects", JSON.stringify(formData.subjects));
      if (courseType === "Center Courses") {
        data.append("inlineSubjects", JSON.stringify(formData.inlineSubjects));
      } else {
        data.append("syllabus", JSON.stringify(formData.syllabus));
      }

      if (formData.thumbnail) {
        data.append("thumbnail", formData.thumbnail);
      }

      if (isEdit) {
        await api.put(`/courses/${selectedCourse._id}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Course updated successfully!");
      } else {
        await api.post("/courses", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Course created successfully!");
      }

      fetchCourses();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error("Error saving:", error);
      toast.error(error.response?.data?.message || "Failed to save course");
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  const resetForm = () => {
    setSelectedCourse(null);
    setFormData({
      courseId: "",
      title: "",
      description: "",
      price: courseType === "Center Courses" ? "0" : "",
      category: courseType === "Center Courses" ? "Center Courses" : "Development",
      type: courseType,
      level: "Beginner",
      duration: "",
      durationUnit: courseType === "Center Courses" ? "year" : "week",
      instructor: "",
      subjects: [],
      thumbnail: null,
      syllabus: [
        { week: courseType === "Center Courses" ? "Year 1" : "Week 1", topic: "", description: "", projectName: "" },
      ],
      inlineSubjects: [{ name: "", code: "", semester: 1, type: "Theory" }],
    });
    setPreview(null);
    setIsViewOnly(false);
    setShowModal(false);
  };


  const columns = [
    { name: 'S.No', selector: (row, index) => index + 1, width: '100px', sortable: true, center: true },
    { name: 'Course', grow: 3, minWidth: '300px', sortable: true, selector: row => row.title, cell: row => (
        <div 
          className="flex items-center cursor-pointer group" 
          onClick={() => handleView(row)}
        >
          {courseType !== "Center Courses" && (
            <div className="flex-shrink-0 h-10 w-16 bg-gray-100 rounded overflow-hidden group-hover:ring-2 ring-brand-500 transition-all">
              {row.thumbnail?.url ? (
                <img className="h-10 w-16 object-cover" src={row.thumbnail.url} alt="" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-[10px] text-gray-400">No Image</div>
              )}
            </div>
          )}
          <div className={courseType !== "Center Courses" ? "ml-4" : ""}>
            <div className="text-sm font-bold text-gray-900 group-hover:text-brand-600 transition-colors">{row.title}</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mt-0.5">{row.courseId || "NO-ID"}</div>
            <div className="text-xs font-semibold text-slate-500 mt-1">
              {row.duration ? `${row.duration} ${row.durationUnit || (courseType === 'Center Courses' ? 'year' : 'week')}s` : ''}
              {courseType !== "Center Courses" && row.level ? ` • ${row.level}` : ''}
            </div>
          </div>
        </div>
      )
    },
    ...(courseType !== "Center Courses" ? [
      { name: 'Category', selector: row => row.category, sortable: true, cell: row => (
        <span className="px-2.5 py-1 inline-flex text-[11px] font-bold uppercase tracking-wider rounded-full bg-blue-100 text-blue-800">{row.category}</span>
      )},
      { name: 'Price', selector: row => row.price, sortable: true, cell: row => (
        <span className="text-sm text-gray-900 font-bold">{row.price === 0 || row.price === "0" ? "Free" : `₹${row.price}`}</span>
      )},
    ] : []),
    { name: 'Status', selector: row => row.isActive, sortable: true, cell: row => (
      <span className={`px-2.5 py-1 inline-flex text-[11px] font-bold uppercase tracking-wider rounded-full ${row.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
        {row.isActive ? "Published" : "Draft"}
      </span>
    )},
    { name: 'Actions', center: true, width: '100px', cell: row => (
        <ActionsDropdown 
          row={row} 
          handleToggleStatus={handleToggleStatus}
          handleView={handleView}
          handleEdit={handleEdit}
          handleShowStudents={handleShowStudents}
          handleManageLessons={handleManageLessons}
          handleDelete={handleDelete}
          courseType={courseType}
        />
      )
    }
  ];

  const filteredCourses = courses.filter(c => c.type === courseType && (
    c.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.courseId?.toLowerCase().includes(searchQuery.toLowerCase())
  ));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">{courseType}</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-brand-700 transition-colors shadow-sm font-semibold text-sm"
        >
          <Plus size={20} /> {courseType === "Center Courses" ? "Add Center Course" : "Add New Course"}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden pb-4">
        <CustomDataTable 
          columns={columns}
          data={filteredCourses}
          progressPending={loading}
          progressComponent={<Loading message="Loading courses..." />}
          search={searchQuery}
          setSearch={setSearchQuery}
          searchPlaceholder="Search courses by title, ID, or category..."
        />
      </div>

      <ConfirmationModal
        isOpen={confirmConfig.isOpen}
        title="Delete Course"
        message="Are you sure you want to delete this course? This will permanently remove all associated lessons and data."
        confirmText="Delete Permanently"
        onConfirm={confirmCourseDelete}
        onClose={() => setConfirmConfig({ isOpen: false, id: null })}
        type="danger"
      />

      {/* Enrolled Students Modal */}
      {showStudentsModal && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Enrolled Students</h2>
                <p className="text-sm text-gray-500">Course: <span className="text-brand-600 font-semibold">{currentCourseTitle}</span></p>
              </div>
              <button
                onClick={() => {
                  setShowStudentsModal(false);
                  setEnrolledStudents([]);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {fetchingStudents ? (
                <Loading message={`Retreiving students for ${currentCourseTitle}...`} />
              ) : enrolledStudents.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-slate-500">No students enrolled in this course yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {enrolledStudents.map((student) => (
                    <div key={student._id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
                        {student.profilePic?.url ? (
                          <img src={student.profilePic.url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-lg">
                            {student.studentNameEnglish?.[0]}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 truncate">{student.studentNameEnglish}</h4>
                        <p className="text-xs text-slate-500 truncate">{student.email}</p>
                        <p className="text-[10px] text-brand-600 font-semibold uppercase mt-1">{student.phone || student.whatsapp || "No Contact"}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${student.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                          {student.status}
                        </span>
                        <p className="text-[9px] text-slate-400 mt-2 italic">Joined {new Date(student.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Course Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {isViewOnly
                    ? "Course Details"
                    : isEdit
                      ? (courseType === "Center Courses" ? "Edit Center Course" : "Edit Course")
                      : (courseType === "Center Courses" ? "Add Center Course" : "Create New Course")}
                </h2>
                <p className="text-sm text-gray-500">
                  {isEdit
                    ? "Update course details."
                    : "Fill in the course details and curriculum."}
                </p>
              </div>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={24} />
              </button>
            </div>

            {isViewOnly ? (
              <div className="flex-1 overflow-y-auto">
                {/* Hero Section */}
                {courseType !== "Center Courses" ? (
                  <div className="relative h-64 bg-slate-900">
                    {preview ? (
                      <img
                        src={preview}
                        alt=""
                        className="w-full h-full object-cover opacity-60"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500">
                        No Industrial Image
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                    <div className="absolute bottom-6 left-8 right-8 text-white">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-3 py-1 bg-brand-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-full inline-block">
                          {formData.category}
                        </span>
                        {formData.courseId && (
                          <span className="px-3 py-1 bg-black/50 backdrop-blur-md text-brand-200 border border-brand-400/40 text-[10px] font-mono font-bold tracking-wider rounded-full inline-block">
                            ID: {formData.courseId}
                          </span>
                        )}
                      </div>
                      <h3 className="text-3xl font-black">{formData.title}</h3>
                    </div>
                    <button
                      onClick={handleSwitchToEdit}
                      className="absolute top-6 right-8 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm transition-all border border-white/20"
                    >
                      <Edit size={16} /> Edit Course
                    </button>
                  </div>
                ) : (
                  <div className="relative h-56 bg-gradient-to-br from-brand-900 via-slate-800 to-slate-900 overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                    
                    <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-between items-end gap-8 z-10">
                      <div className="text-white flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="px-3 py-1 bg-brand-500/20 backdrop-blur-md text-brand-100 border border-brand-500/30 text-[10px] font-black uppercase tracking-widest rounded-md inline-block">
                            {formData.category}
                          </span>
                          {formData.courseId && (
                            <span className="px-3 py-1 bg-white/10 backdrop-blur-md text-white border border-white/20 text-[10px] font-mono font-bold tracking-wider rounded-md inline-block">
                              ID: {formData.courseId}
                            </span>
                          )}
                        </div>
                        <h3 className="text-3xl lg:text-4xl font-black tracking-tight leading-tight">{formData.title}</h3>
                      </div>
                      <button
                        onClick={handleSwitchToEdit}
                        className="bg-white text-slate-900 hover:bg-slate-50 px-6 py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all shadow-xl hover:shadow-2xl whitespace-nowrap flex-shrink-0"
                      >
                        <Edit size={16} className="text-brand-600" /> Edit Course
                      </button>
                    </div>
                  </div>
                )}

                {courseType !== "Center Courses" ? (
                  <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 text-slate-900">
                    <div className="lg:col-span-2 space-y-8">
                      <section>
                        <h4 className="text-sm font-bold text-brand-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <BookOpen size={16} /> Course Overview
                        </h4>
                        <p className="text-slate-600 leading-relaxed whitespace-pre-line text-sm">
                          {formData.description}
                        </p>
                      </section>
                      <section>
                        <h4 className="text-sm font-bold text-brand-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <CheckCircle2 size={16} /> Curriculum & Syllabus
                        </h4>
                        <div className="space-y-4">
                          {formData.syllabus.map((item, idx) => (
                            <div
                              key={idx}
                              className="bg-slate-50 border border-slate-100 rounded-2xl p-5 hover:border-brand-200 transition-colors"
                            >
                              <div className="flex justify-between items-start mb-3">
                                <span className="text-[10px] font-black text-brand-600 uppercase bg-brand-50 px-2 py-0.5 rounded">
                                  {item.week}
                                </span>
                                {item.projectName && (
                                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded italic">
                                    Project: {item.projectName}
                                  </span>
                                )}
                              </div>
                              <h5 className="font-bold text-slate-800 mb-2">
                                {item.topic || "Untitled Topic"}
                              </h5>
                              <p className="text-xs text-slate-500 line-clamp-2">
                                {item.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex items-center gap-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm text-brand-600">
                          <IndianRupee size={24} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">
                            Investment
                          </p>
                          <p className="text-xl font-black text-slate-900">
                            {formData.price === "0"
                              ? "Free"
                              : `₹${formData.price}`}
                          </p>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex items-center gap-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm text-orange-600">
                          <Clock size={24} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">
                            Duration
                          </p>
                          <p className="text-xl font-black text-slate-900">
                            {formData.duration} {formData.durationUnit}s
                          </p>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex items-center gap-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm text-blue-600">
                          <BarChart size={24} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">
                            Level
                          </p>
                          <p className="text-xl font-black text-slate-900">
                            {formData.level}
                          </p>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex items-center gap-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm text-purple-600">
                          <UserIcon size={24} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">
                            Instructor
                          </p>
                          <p className="text-sm font-bold text-slate-900">
                            {instructors.find((i) => i.id === formData.instructor)
                              ?.name || "Not Assigned"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 flex flex-col gap-8 text-slate-900">
                    <section>
                      <h4 className="text-sm font-bold text-brand-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <BookOpen size={16} /> Course Overview
                      </h4>
                      <p className="text-slate-600 leading-relaxed whitespace-pre-line text-sm">
                        {formData.description}
                      </p>
                    </section>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex items-center gap-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm text-brand-600 font-mono font-black text-sm">
                          ID
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">
                            Course ID
                          </p>
                          <p className="text-lg font-black text-slate-900 font-mono tracking-wide">
                            {formData.courseId || "NO-ID"}
                          </p>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex items-center gap-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm text-brand-600">
                          <BookOpen size={24} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">
                            Total Subjects
                          </p>
                          <p className="text-xl font-black text-slate-900">
                            {formData.inlineSubjects.length}
                          </p>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex items-center gap-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm text-orange-600">
                          <Clock size={24} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">
                            Duration
                          </p>
                          <p className="text-xl font-black text-slate-900">
                            {formData.duration} {formData.durationUnit}s
                          </p>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex items-center gap-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm text-purple-600">
                          <UserIcon size={24} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">
                            Instructor
                          </p>
                          <p className="text-sm font-bold text-slate-900 truncate max-w-[150px]">
                            {instructors.find((i) => i.id === formData.instructor)
                              ?.name || "Not Assigned"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <section>
                      <h4 className="text-sm font-bold text-brand-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <BookOpen size={16} /> Subjects Curriculum
                      </h4>
                      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        {(() => {
                          const bySemester = formData.inlineSubjects.reduce((acc, curr) => {
                            const sem = curr.semester || 1;
                            if (!acc[sem]) acc[sem] = [];
                            acc[sem].push(curr);
                            return acc;
                          }, {});
                          return Object.keys(bySemester).sort((a,b) => a-b).map(sem => (
                            <div key={sem} className="mb-8 last:mb-0">
                              <h5 className="font-bold text-slate-800 text-sm mb-4 pb-3 border-b border-slate-100 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center text-xs font-black shadow-inner border border-brand-100/50">
                                  {sem}
                                </div>
                                Semester {sem}
                              </h5>
                              <div className="space-y-3">
                                {bySemester[sem].map((item, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 border border-slate-100 hover:border-brand-200 hover:bg-brand-50/30 transition-all group">
                                     <div className="flex items-center gap-4">
                                       <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-brand-400 transition-colors"></div>
                                       <div>
                                         <h6 className="font-bold text-slate-900 text-sm">{item.name || "Untitled Subject"}</h6>
                                         <p className="text-[11px] text-slate-500 mt-0.5 font-medium uppercase tracking-wider">{item.type}</p>
                                       </div>
                                     </div>
                                     <div className="text-right">
                                       <span className="text-[10px] font-black text-slate-600 uppercase bg-white border border-slate-200 shadow-sm px-3 py-1.5 rounded-lg group-hover:text-brand-600 group-hover:border-brand-200 transition-colors">
                                         {item.code || "NO CODE"}
                                       </span>
                                     </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </section>
                  </div>
                )}
              </div>
            ) : (
              <form
                onSubmit={handleSave}
                className="flex-1 overflow-y-auto p-6 space-y-8"
              >
                {/* Form Inputs (Existing Logic) */}
                <div className={`grid grid-cols-1 ${courseType !== "Center Courses" ? "lg:grid-cols-2" : ""} gap-8`}>
                  {/* Left Column: Basic Info */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-brand-600 uppercase tracking-wider">
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Course ID {courseType === "Center Courses" ? <span className="text-red-500">*</span> : <span className="text-gray-400 font-normal">(Optional)</span>}
                        </label>
                        <input
                          type="text"
                          required={courseType === "Center Courses"}
                          className="w-full rounded-lg border-gray-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-2.5 text-sm font-semibold tracking-wider font-mono uppercase"
                          placeholder={courseType === "Center Courses" ? "e.g. ADCA, DCA-01" : "e.g. REACT-01"}
                          value={formData.courseId || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, courseId: e.target.value })
                          }
                        />
                        <p className="text-[10px] text-gray-400 mt-1">Manual course code / ID</p>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Course Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          className="w-full rounded-lg border-gray-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-2.5 text-sm"
                          placeholder={courseType === "Center Courses" ? "e.g. Advanced Diploma in Computer Applications" : "e.g. Master React in 30 Days"}
                          value={formData.title}
                          onChange={(e) =>
                            setFormData({ ...formData, title: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        rows={8}
                        className="w-full rounded-lg border-gray-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-2.5 text-sm"
                        placeholder="Write a brief overview of the course..."
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>
                    {courseType !== "Center Courses" && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                              Price (₹)
                            </label>
                            <input
                              type="number"
                              className="w-full rounded-lg border-gray-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-2.5 text-sm"
                              placeholder="0.00"
                              value={formData.price}
                              onChange={(e) =>
                                setFormData({ ...formData, price: e.target.value })
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                              Level
                            </label>
                            <select
                              className="w-full rounded-lg border-gray-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-2.5 text-sm appearance-none"
                              value={formData.level}
                              onChange={(e) =>
                                setFormData({ ...formData, level: e.target.value })
                              }
                            >
                              <option>Beginner</option>
                              <option>Intermediate</option>
                              <option>Advanced</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            Category
                          </label>
                          <select
                            className="w-full rounded-lg border-gray-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-2.5 text-sm appearance-none"
                            value={formData.category}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                category: e.target.value,
                              })
                            }
                          >
                            <option>Development</option>
                            <option>Design</option>
                            <option>Business</option>
                            <option>Marketing</option>
                          </select>
                        </div>
                      </>
                    )}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Duration
                        </label>
                        <div className="flex border rounded-lg border-gray-200 overflow-hidden shadow-sm">
                          <input
                            type="number"
                            placeholder="8"
                            className="w-full border-0 p-2.5 text-sm focus:ring-0"
                            value={formData.duration}
                            onChange={(e) => handleDurationChange(e.target.value)}
                          />
                          <select
                            className="bg-gray-50 border-0 border-l p-2.5 text-xs font-bold uppercase tracking-wider text-gray-600 focus:ring-0 cursor-pointer"
                            value={formData.durationUnit}
                            onChange={(e) => {
                              const unit = e.target.value;
                              const updatedSyllabus = formData.syllabus.map((s, idx) => ({
                                ...s,
                                week: `${unit === "week" ? "Week" : (unit === "month" ? "Month" : "Year")} ${idx + 1}`
                              }));
                              setFormData(prev => ({ 
                                ...prev, 
                                durationUnit: unit, 
                                syllabus: updatedSyllabus 
                              }));
                            }}
                          >
                            {courseType === "Center Courses" ? (
                              <option value="year">Years</option>
                            ) : (
                              <>
                                <option value="week">Weeks</option>
                                <option value="month">Months</option>
                              </>
                            )}
                          </select>
                        </div>
                      </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Course Instructor / Coach
                      </label>
                      <select
                        className="w-full rounded-lg border-gray-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-2.5 text-sm appearance-none"
                        value={formData.instructor}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            instructor: e.target.value,
                          })
                        }
                      >
                        <option value="">Select an Instructor</option>
                        {instructors.map((inst) => (
                          <option key={inst.id} value={inst.id}>
                            {inst.name} ({inst.role})
                          </option>
                        ))}
                        {!instructors.some((i) => i.id === user?._id) &&
                          user?.role === "Coach" && (
                            <option value={user?._id}>
                              You ({user?.name})
                            </option>
                          )}
                      </select>
                    </div>


                  </div>

                  {/* Right Column: Thumbnail */}
                  {courseType !== "Center Courses" && (
                    <div className="space-y-6">
                      <h3 className="text-sm font-bold text-brand-600 uppercase tracking-wider">
                        Thumbnail Image
                      </h3>
                      <div className="space-y-4">
                        <div className="h-48 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center bg-gray-50 overflow-hidden relative group">
                          {preview ? (
                            <>
                              <img
                                src={preview}
                                alt="Course"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPreview(null);
                                    setFormData({ ...formData, thumbnail: null });
                                  }}
                                  className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/40"
                                >
                                  <Trash2 size={20} />
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="text-center p-6">
                              <label className="cursor-pointer">
                                <div className="bg-brand-50 p-2 rounded-full inline-block mb-2 text-brand-600">
                                  <Plus size={24} />
                                </div>
                                <p className="text-sm font-bold text-gray-700">
                                  Click to upload thumbnail
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  PNG, JPG up to 2MB (16:9 ratio)
                                </p>
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="image/*"
                                  onChange={handleThumbnailChange}
                                />
                              </label>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Curriculum Section */}
                {courseType !== "Center Courses" && (
                  <div className="pt-6 border-t border-gray-100 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold text-brand-600 uppercase tracking-wider">
                        Course Curriculum / Syllabus
                      </h3>
                    <button
                      type="button"
                      onClick={addSyllabusRow}
                      className="text-xs bg-brand-50 text-brand-600 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 hover:bg-brand-100 transition-colors"
                    >
                      <Plus size={14} /> Add Week/Module
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.syllabus.map((item, index) => (
                      <div
                        key={index}
                        className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4 relative group"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="md:col-span-1">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                              Week / Module
                            </label>
                            <input
                              type="text"
                              className="w-full bg-white rounded-lg border-gray-200 border p-2 text-xs font-bold"
                              value={item.week}
                              onChange={(e) =>
                                updateSyllabus(index, "week", e.target.value)
                              }
                            />
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                              Topic Title
                            </label>
                            <input
                              type="text"
                              className="w-full bg-white rounded-lg border-gray-200 border p-2 text-xs"
                              placeholder="e.g. Introduction to React Fundamentals"
                              value={item.topic}
                              onChange={(e) =>
                                updateSyllabus(index, "topic", e.target.value)
                              }
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                              Module Coverage / Description
                            </label>
                            <textarea
                              rows={4}
                              className="w-full bg-white rounded-lg border-gray-200 border p-2 text-xs"
                              placeholder="What will students learn in this module?"
                              value={item.description}
                              onChange={(e) =>
                                updateSyllabus(
                                  index,
                                  "description",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                              Project Name (Optional)
                            </label>
                            <textarea
                              rows={4}
                              className="w-full bg-white rounded-lg border-gray-200 border p-2 text-xs border-brand-100"
                              placeholder="e.g. Building a Weather App with React"
                              value={item.projectName}
                              onChange={(e) =>
                                updateSyllabus(
                                  index,
                                  "projectName",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                        </div>
                        {formData.syllabus.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSyllabusRow(index)}
                            className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 hover:text-white"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                )}

                {/* Subjects Section for Center Courses */}
                {courseType === "Center Courses" && (
                  <div className="pt-6 border-t border-gray-100 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold text-brand-600 uppercase tracking-wider">
                        Course Subjects
                      </h3>
                      <button
                        type="button"
                        onClick={addInlineSubjectRow}
                        className="text-xs bg-brand-50 text-brand-600 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 hover:bg-brand-100 transition-colors"
                      >
                        <Plus size={14} /> Add Subject
                      </button>
                    </div>

                    <div className="space-y-4">
                      {formData.inlineSubjects.map((subject, index) => (
                        <div
                          key={index}
                          className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4 relative group"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-2">
                              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                                Subject Name
                              </label>
                              <input
                                type="text"
                                className="w-full bg-white rounded-lg border-gray-200 border p-2 text-xs font-bold"
                                placeholder="e.g. Mathematics"
                                value={subject.name}
                                onChange={(e) =>
                                  updateInlineSubject(index, "name", e.target.value)
                                }
                              />
                            </div>
                            <div className="md:col-span-1">
                              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                                Subject Code
                              </label>
                              <input
                                type="text"
                                className="w-full bg-white rounded-lg border-gray-200 border p-2 text-xs"
                                placeholder="e.g. MAT101"
                                value={subject.code}
                                onChange={(e) =>
                                  updateInlineSubject(index, "code", e.target.value)
                                }
                              />
                            </div>
                            <div className="md:col-span-1">
                              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                                Semester
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="8"
                                className="w-full bg-white rounded-lg border-gray-200 border p-2 text-xs"
                                value={subject.semester}
                                onChange={(e) =>
                                  updateInlineSubject(index, "semester", parseInt(e.target.value) || 1)
                                }
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                                Type
                              </label>
                              <select
                                className="w-full bg-white rounded-lg border-gray-200 border p-2 text-xs"
                                value={subject.type}
                                onChange={(e) =>
                                  updateInlineSubject(index, "type", e.target.value)
                                }
                              >
                                <option value="Theory">Theory</option>
                                <option value="Practical">Practical</option>
                              </select>
                            </div>
                          </div>
                          
                          {formData.inlineSubjects.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeInlineSubjectRow(index)}
                              className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 hover:text-white"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Modal Actions */}
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 sticky bottom-0 bg-white z-10 py-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-2.5 text-gray-600 font-bold text-sm hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-2.5 bg-brand-600 text-white rounded-xl font-bold text-sm hover:bg-brand-700 shadow-lg shadow-brand-600/20 transition-all"
                  >
                    {isEdit ? "Save Changes" : "Create Course"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {manageCourse && (
        <LessonManagementModal
          course={manageCourse}
          isOpen={showManageLessons}
          onClose={() => {
            setShowManageLessons(false);
            setManageCourse(null);
          }}
          onUpdate={fetchCourses}
        />
      )}
    </div>
  );
};

export default CoursesTab;
