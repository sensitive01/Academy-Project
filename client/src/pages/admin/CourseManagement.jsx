import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import toast from "react-hot-toast";
import CustomDataTable from "../../components/DataTable";
import LessonManagementModal from "../../components/modals/LessonManagementModal";
import Loading from "../../components/Loading";
import ConfirmationModal from "../../components/modals/ConfirmationModal";

const CourseManagement = () => {
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
    title: "",
    description: "",
    price: "",
    category: "Development",
    type: "Academic",
    level: "Beginner",
    duration: "",
    durationUnit: "week",
    instructor: "",
    subjects: [],
    thumbnail: null,
    syllabus: [{ week: "Week 1", topic: "", description: "", projectName: "" }],
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
      title: course.title,
      description: course.description,
      price: course.price,
      category: course.category,
      type: course.type || "Academic",
      level: course.level,
      duration: course.duration,
      durationUnit: course.durationUnit || "week",
      instructor: course.instructor?._id || course.instructor || "",
      subjects: course.subjects ? course.subjects.map(s => s._id || s) : [],
      thumbnail: null,
      syllabus:
        course.syllabus && course.syllabus.length > 0
          ? course.syllabus
          : [{ week: "Week 1", topic: "", description: "", projectName: "" }],
    });
    setPreview(course.thumbnail?.url || null);
    setShowModal(true);
  };

  const handleView = (course) => {
    setIsViewOnly(true);
    setSelectedCourse(course);
    setFormData({
      title: course.title,
      description: course.description,
      price: course.price,
      category: course.category,
      type: course.type || "Academic",
      level: course.level,
      duration: course.duration,
      durationUnit: course.durationUnit || "week",
      instructor: course.instructor?._id || course.instructor || "",
      subjects: course.subjects ? course.subjects.map(s => s._id || s) : [],
      thumbnail: null,
      syllabus:
        course.syllabus && course.syllabus.length > 0
          ? course.syllabus
          : [{ week: "Week 1", topic: "", description: "", projectName: "" }],
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
          week: `${prev.durationUnit === "week" ? "Week" : "Month"} ${prev.syllabus.length + 1}`,
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
            week: `${prev.durationUnit === "week" ? "Week" : "Month"} ${i + 1}`,
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

  const handleSave = async (e) => {
    e.preventDefault();

    // Validation: Check if all syllabus topics are filled
    const incompleteSyllabus = formData.syllabus.some(s => !s.topic || !s.description);
    if (incompleteSyllabus) {
      return toast.error("Please fill in topic and description for all modules before submitting.");
    }

    const loadingToast = toast.loading("Saving course...");
    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("price", formData.price);
      data.append("category", formData.category);
      data.append("type", formData.type);
      data.append("level", formData.level);
      data.append("duration", formData.duration);
      data.append("durationUnit", formData.durationUnit);
      data.append("instructor", formData.instructor || user?._id);
      data.append("subjects", JSON.stringify(formData.subjects));
      data.append("syllabus", JSON.stringify(formData.syllabus));

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
      toast.error("Failed to save course");
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  const resetForm = () => {
    setSelectedCourse(null);
    setFormData({
      title: "",
      description: "",
      price: "",
      category: "Development",
      type: "Academic",
      level: "Beginner",
      duration: "",
      durationUnit: "week",
      instructor: "",
      subjects: [],
      thumbnail: null,
      syllabus: [
        { week: "Week 1", topic: "", description: "", projectName: "" },
      ],
    });
    setPreview(null);
    setIsViewOnly(false);
    setShowModal(false);
  };


  const columns = [
    { name: 'S.No', selector: (row, index) => index + 1, width: '100px', sortable: true, center: true },
    { name: 'Course', grow: 3, minWidth: '300px', sortable: true, selector: row => row.title, cell: row => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-16 bg-gray-100 rounded overflow-hidden">
            {row.thumbnail?.url ? (
              <img className="h-10 w-16 object-cover" src={row.thumbnail.url} alt="" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-[10px] text-gray-400">No Image</div>
            )}
          </div>
          <div className="ml-4">
            <div className="text-sm font-bold text-gray-900">{row.title}</div>
            <div className="text-xs font-semibold text-slate-500">{row.duration} {row.durationUnit}s • {row.level}</div>
          </div>
        </div>
      )
    },
    { name: 'Category', selector: row => row.category, sortable: true, cell: row => (
      <span className="px-2.5 py-1 inline-flex text-[11px] font-bold uppercase tracking-wider rounded-full bg-blue-100 text-blue-800">{row.category}</span>
    )},
    { name: 'Price', selector: row => row.price, sortable: true, cell: row => (
      <span className="text-sm text-gray-900 font-bold">{row.price === 0 || row.price === "0" ? "Free" : `₹${row.price}`}</span>
    )},
    { name: 'Status', selector: row => row.isActive, sortable: true, cell: row => (
      <span className={`px-2.5 py-1 inline-flex text-[11px] font-bold uppercase tracking-wider rounded-full ${row.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
        {row.isActive ? "Published" : "Draft"}
      </span>
    )},
    { name: 'Actions', center: true, width: '180px', cell: row => (
        <div className="flex items-center gap-x-3">
          <button onClick={() => handleToggleStatus(row._id)} className={`transition-colors ${row.isActive ? "text-green-600 hover:text-green-800" : "text-slate-400 hover:text-slate-600"}`} title={row.isActive ? "Deactivate" : "Activate"}>
            {row.isActive ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
          </button>
          <button onClick={() => handleView(row)} className="text-brand-600 hover:text-brand-900 transition-colors" title="View Details">
            <Eye size={18} />
          </button>
          <button onClick={() => handleShowStudents(row)} className="text-purple-600 hover:text-purple-900 transition-colors" title="Enrolled Students">
            <UsersIcon size={18} />
          </button>
          <button onClick={() => handleManageLessons(row)} className="text-orange-600 hover:text-orange-900 transition-colors" title="Manage Lessons">
            <Play size={18} />
          </button>
          <button onClick={() => handleDelete(row._id)} className="text-red-600 hover:text-red-900 transition-colors" title="Delete">
            <Trash2 size={18} />
          </button>
        </div>
      )
    }
  ];

  const filteredCourses = courses.filter(c => c.title?.toLowerCase().includes(searchQuery.toLowerCase()) || c.category?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-brand-700 transition-colors"
        >
          <Plus size={20} /> Add New Course
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
          searchPlaceholder="Search courses by title or category..."
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
                      ? "Edit Course"
                      : "Create New Course"}
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
                    <span className="px-3 py-1 bg-brand-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-full mb-3 inline-block">
                      {formData.category}
                    </span>
                    <h3 className="text-3xl font-black">{formData.title}</h3>
                  </div>
                  <button
                    onClick={handleSwitchToEdit}
                    className="absolute top-6 right-8 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm transition-all border border-white/20"
                  >
                    <Edit size={16} /> Edit Course
                  </button>
                </div>

                <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 text-slate-900">
                  {/* Left Column: Details */}
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

                  {/* Right Column: Meta Info Cards */}
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
              </div>
            ) : (
              <form
                onSubmit={handleSave}
                className="flex-1 overflow-y-auto p-6 space-y-8"
              >
                {/* Form Inputs (Existing Logic) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column: Basic Info */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-brand-600 uppercase tracking-wider">
                      Basic Information
                    </h3>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Course Title
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full rounded-lg border-gray-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-2.5 text-sm"
                        placeholder="e.g. Master React in 30 Days"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        required
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
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Price (₹)
                        </label>
                        <input
                          type="number"
                          required
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
                    <div className="grid grid-cols-2 gap-4">
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
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Type
                        </label>
                        <select
                          className="w-full rounded-lg border-gray-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-2.5 text-sm appearance-none"
                          value={formData.type}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              type: e.target.value,
                            })
                          }
                        >
                          <option value="Academic">Academic</option>
                          <option value="Online">Online</option>
                          <option value="Offline">Offline</option>
                        </select>
                      </div>
                    </div>
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
                                week: `${unit === "week" ? "Week" : "Month"} ${idx + 1}`
                              }));
                              setFormData(prev => ({ 
                                ...prev, 
                                durationUnit: unit, 
                                syllabus: updatedSyllabus 
                              }));
                            }}
                          >
                            <option value="week">Weeks</option>
                            <option value="month">Months</option>
                          </select>
                        </div>
                      </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Course Instructor / Coach
                      </label>
                      <select
                        required
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
                </div>

                {/* Curriculum Section */}
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

export default CourseManagement;
