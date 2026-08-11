import React, { useState, useEffect } from "react";
import {
  Eye,
  X,
  BookOpen,
  Clock,
  BarChart,
  IndianRupee,
  User as UserIcon,
  CheckCircle2,
  Users as UsersIcon,
  Play,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import toast from "react-hot-toast";
import CustomDataTable from "../../components/common/DataTable";
import Loading from "../../components/common/Loading";

const MyCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [fetchingStudents, setFetchingStudents] = useState(false);
  const [currentCourseTitle, setCurrentCourseTitle] = useState("");

  const fetchMyCourses = async () => {
    try {
      setLoading(true);
      // Fetch all courses and filter by current user's ID as instructor
      const { data } = await api.get("/courses");
      const myCourses = data.filter(c => 
        (c.instructor?._id || c.instructor) === user?._id
      );
      setCourses(myCourses);
    } catch (error) {
      console.error("Error fetching coach courses:", error);
      toast.error("Failed to load your assigned courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchMyCourses();
  }, [user]);

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

  const handleView = (course) => {
    setSelectedCourse(course);
    setShowDetailsModal(true);
  };

  const columns = [
    { name: 'S.No', selector: (row, index) => index + 1, width: '80px', sortable: true, center: true },
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
    { name: 'Status', selector: row => row.isActive, sortable: true, cell: row => (
      <span className={`px-2.5 py-1 inline-flex text-[11px] font-bold uppercase tracking-wider rounded-full ${row.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
        {row.isActive ? "Published" : "Draft"}
      </span>
    )},
    { name: 'Actions', center: true, width: '120px', cell: row => (
        <div className="flex items-center gap-x-3">
          <button onClick={() => handleView(row)} className="text-brand-600 hover:text-brand-900 transition-colors" title="View Details">
            <Eye size={18} />
          </button>
          <button onClick={() => handleShowStudents(row)} className="text-purple-600 hover:text-purple-900 transition-colors" title="Enrolled Students">
            <UsersIcon size={18} />
          </button>
        </div>
      )
    }
  ];

  const filteredCourses = courses.filter(c => c.title?.toLowerCase().includes(searchQuery.toLowerCase()) || c.category?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Assigned Courses</h1>
          <p className="text-sm text-slate-500">View and manage students in your courses</p>
        </div>
        <div className="text-sm text-slate-500 bg-white px-4 py-2 rounded-xl border border-slate-200">
          Instructor: <span className="font-bold text-slate-900">{user?.name}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden pb-4">
        <CustomDataTable 
          columns={columns}
          data={filteredCourses}
          progressPending={loading}
          progressComponent={<Loading message="Loading courses..." />}
          search={searchQuery}
          setSearch={setSearchQuery}
          searchPlaceholder="Search your courses..."
        />
      </div>

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

      {/* Course Details Modal */}
      {showDetailsModal && selectedCourse && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <h2 className="text-xl font-bold text-gray-900">Course Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="relative h-64 bg-slate-900">
                {selectedCourse.thumbnail?.url ? (
                  <img src={selectedCourse.thumbnail.url} alt="" className="w-full h-full object-cover opacity-60" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500"> No Industry Image </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                <div className="absolute bottom-6 left-8 right-8 text-white">
                  <span className="px-3 py-1 bg-brand-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-full mb-3 inline-block">
                    {selectedCourse.category}
                  </span>
                  <h3 className="text-3xl font-black">{selectedCourse.title}</h3>
                </div>
              </div>

              <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 text-slate-900">
                <div className="lg:col-span-2 space-y-8">
                  <section>
                    <h4 className="text-sm font-bold text-brand-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <BookOpen size={16} /> Course Overview
                    </h4>
                    <p className="text-slate-600 leading-relaxed whitespace-pre-line text-sm">
                      {selectedCourse.description}
                    </p>
                  </section>

                  <section>
                    <h4 className="text-sm font-bold text-brand-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <CheckCircle2 size={16} /> Curriculum & Syllabus
                    </h4>
                    <div className="space-y-4">
                      {selectedCourse.syllabus?.map((item, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl p-5 hover:border-brand-200 transition-colors">
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-[10px] font-black text-brand-600 uppercase bg-brand-50 px-2 py-0.5 rounded">{item.week}</span>
                             {item.projectName && <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded italic">Project: {item.projectName}</span>}
                          </div>
                          <h5 className="font-bold text-slate-800 mb-2">{item.topic || "Untitled Topic"}</h5>
                          <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                <div className="space-y-4">
                   <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex items-center gap-4">
                      <div className="p-3 bg-white rounded-xl shadow-sm text-brand-600"> <IndianRupee size={24} /> </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Investment</p>
                        <p className="text-xl font-black text-slate-900">{selectedCourse.price === 0 || selectedCourse.price === "0" ? "Free" : `₹${selectedCourse.price}`}</p>
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex items-center gap-4">
                      <div className="p-3 bg-white rounded-xl shadow-sm text-orange-600"> <Clock size={24} /> </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Duration</p>
                        <p className="text-xl font-black text-slate-900">{selectedCourse.duration} {selectedCourse.durationUnit}s</p>
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex items-center gap-4">
                      <div className="p-3 bg-white rounded-xl shadow-sm text-blue-600"> <BarChart size={24} /> </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Level</p>
                        <p className="text-xl font-black text-slate-900">{selectedCourse.level}</p>
                      </div>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCourses;
