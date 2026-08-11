import React, { useEffect, useState } from "react";
import { BookOpen, IndianRupee, GraduationCap, Clock } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import Loading from "../../components/common/Loading";

const EnrollClass = () => {
  const { user } = useAuth();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [children, setChildren] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [viewCourse, setViewCourse] = useState(null);

  /////////////////////////////////////////////////////////////
  // FETCH COURSES
  /////////////////////////////////////////////////////////////
  const fetchAvailableCourses = async (studentIdParam) => {
    try {
      setLoading(true);

      let url = "/courses/available";

      if (user?.role === "parent" && studentIdParam) {
        url += `?studentId=${studentIdParam}`;
      }

      const { data } = await api.get(url);
      setCourses(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  /////////////////////////////////////////////////////////////
  // FETCH CHILDREN (FOR PARENT)
  /////////////////////////////////////////////////////////////
  const fetchChildren = async () => {
    try {
      const { data } = await api.get("/parent/children");

      setChildren(data);

      if (data.length > 0) {
        const firstStudent = data[0]._id;
        setSelectedStudent(firstStudent);
        fetchAvailableCourses(firstStudent);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load children");
    }
  };

  /////////////////////////////////////////////////////////////
  // INITIAL LOAD
  /////////////////////////////////////////////////////////////
  useEffect(() => {
    if (!user) return;

    if (user.role === "parent") {
      fetchChildren();
    } else {
      fetchAvailableCourses();
    }
  }, [user]);

  /////////////////////////////////////////////////////////////
  // ENROLL FUNCTION
  /////////////////////////////////////////////////////////////
  const handleEnroll = async (course) => {
    try {
      let studentId = user?._id;

      if (user?.role === "parent") {
        if (!selectedStudent) {
          toast.error("Please select a student");
          return;
        }
        studentId = selectedStudent;
      }

      /////////////////////////////////////////////////////////////
      // FREE COURSE
      /////////////////////////////////////////////////////////////
      if (course.price === 0) {
        await api.post(`/courses/${course._id}/enroll-free`, { studentId });
        toast.success("Enrolled successfully 🎉");
        fetchAvailableCourses(studentId);
        return;
      }

      /////////////////////////////////////////////////////////////
      // CREATE ORDER
      /////////////////////////////////////////////////////////////
      const { data } = await api.post("/payment/create-order", {
        courseId: course._id,
        studentId,
      });

      /////////////////////////////////////////////////////////////
      // RAZORPAY OPTIONS
      /////////////////////////////////////////////////////////////
      const options = {
        key: "rzp_test_43B9POe4e23YRY",
        amount: data.amount,
        currency: data.currency,
        name: "Dr Academy",
        description: course.title,
        order_id: data.orderId,
        handler: async function (response) {
          try {
            // Log all values for debugging
            console.log("Razorpay response:", response);
            if (
              !response.razorpay_order_id ||
              !response.razorpay_payment_id ||
              !response.razorpay_signature
            ) {
              toast.error("Payment response incomplete");
              return;
            }

            await api.post("/payment/verify-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              courseId: course._id,
              studentId,
            });

            toast.success("Payment successful 🎉");
            fetchAvailableCourses(studentId);
          } catch (error) {
            console.error(error);
            toast.error(
              error.response?.data?.message || "Payment verification failed"
            );
          }
        },
        modal: {
          ondismiss: function () {
            toast.error("Payment cancelled");
          },
        },
        theme: {
          color: "#2563eb",
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", function () {
        toast.error("Payment failed");
      });

      rzp.open();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Enrollment failed");
    }
  };

  const fetchCourseDetails = async (courseId) => {
  try {
    const { data } = await api.get(`/courses/${courseId}`);
    setViewCourse(data);
  } catch (error) {
    console.error(error);
    toast.error("Failed to load course details");
  }
};

  /////////////////////////////////////////////////////////////
  // LOADING UI
  /////////////////////////////////////////////////////////////

  /////////////////////////////////////////////////////////////
  // UI
  /////////////////////////////////////////////////////////////
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-black text-slate-900">Available Classes</h1>

      {user?.role === "parent" && (
        <div className="bg-white p-4 rounded-xl shadow border w-80">
          <label className="text-sm font-bold text-slate-600">Select Student</label>
          <select
            value={selectedStudent}
            onChange={(e) => {
              const id = e.target.value;
              setSelectedStudent(id);
              fetchAvailableCourses(id);
            }}
            className="mt-2 w-full border rounded-lg p-2"
          >
            {children.map((child) => (
              <option key={child._id} value={child._id}>
                {child.studentNameEnglish || child.firstName} {/* Updated for your data */}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {loading ? 
          <div className="col-span-full py-20 flex flex-col items-center justify-center opacity-40 animate-pulse">
            <BookOpen size={50} className="text-slate-300 mb-4" />
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Scanning Catalog...</p>
          </div>
         : courses.length === 0 ? 
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 shadow-inner">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
               <BookOpen size={40} className="text-slate-300" />
            </div>
            <h2 className="text-2xl font-black text-slate-800">
              No Courses Available
            </h2>
            <p className="text-slate-500 mt-2 mb-8 max-w-sm mx-auto">
              Great job! You have already enrolled in all our currently available courses. 🎉
            </p>
            {user?.role !== "parent" && (
              <div className="flex gap-4">
                 <button 
                   onClick={() => window.location.href='/dashboard/lms'}
                   className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-95"
                 >
                    Go to My Learning <GraduationCap size={18} />
                 </button>
              </div>
            )}
          </div>
         : 
          courses.map((course) => (
            <div
              key={course._id}
              className="flex flex-col overflow-hidden rounded-3xl bg-white shadow hover:shadow-xl border"
            >
              <div className="h-52 bg-slate-100">
                {course.thumbnail?.url ? (
                  <img
                    src={course.thumbnail.url}
                    alt={course.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <BookOpen size={48} />
                  </div>
                )}
              </div>

              <div className="p-6 flex flex-col flex-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{course.category}</span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {course.duration} {course.durationUnit}s
                  </span>
                </div>

                <h3 className="text-xl font-bold mt-2">{course.title}</h3>

                <p className="text-sm text-slate-500 mt-2">
                  {course.description.length > 100
                    ? `${course.description.slice(0, 100)}...`
                    : course.description}
                </p>

                <div className="mt-auto flex justify-between items-center pt-6">
                  <div className="text-2xl font-black flex items-center">
                    {course.price === 0 ? (
                      <span className="text-green-600">FREE</span>
                    ) : (
                      <>
                        <IndianRupee size={18} />
                        {course.price}
                      </>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => fetchCourseDetails(course._id)}
                      className="bg-slate-200 text-slate-800 px-4 py-2 rounded-xl hover:bg-slate-300"
                    >
                      View Course
                    </button>

                    <button
                      onClick={() => handleEnroll(course)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700"
                    >
                      <GraduationCap size={18} /> Enroll
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        }
      </div>

      {viewCourse && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
            {/* Close Button */}
            <button
              onClick={() => setViewCourse(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>

            {/* Hero / Thumbnail */}
            <div className="relative h-64 bg-slate-900">
              {viewCourse.thumbnail?.url ? (
                <img
                  src={viewCourse.thumbnail.url}
                  alt={viewCourse.title}
                  className="w-full h-full object-cover opacity-60"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500">
                  No Image
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
              <div className="absolute bottom-6 left-8 right-8 text-white">
                <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-full mb-3 inline-block">
                  {viewCourse.category}
                </span>
                <h3 className="text-3xl font-black">{viewCourse.title}</h3>
              </div>
            </div>

            {/* Main Content */}
            <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 text-slate-900">
              {/* Left Column: Description + Syllabus */}
              <div className="lg:col-span-2 space-y-8">
                {/* Overview */}
                <section>
                  <h4 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <BookOpen size={16} /> Course Overview
                  </h4>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-line text-sm">
                    {viewCourse.description}
                  </p>
                </section>

                {/* Curriculum */}
                <section>
                  <h4 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                    Curriculum & Syllabus
                  </h4>
                  <div className="space-y-4">
                    {viewCourse.syllabus?.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50 border border-slate-100 rounded-2xl p-5"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded">
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
                        <p className="text-xs text-slate-500">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Right Column: Meta Cards */}
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex items-center gap-4">
                  <div className="p-3 bg-white rounded-xl shadow-sm text-green-600">
                    <IndianRupee size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                      Investment
                    </p>
                    <p className="text-xl font-black text-slate-900">
                      {viewCourse.price === 0 ? "Free" : `₹${viewCourse.price}`}
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
                      {viewCourse.duration} {viewCourse.durationUnit}s
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex items-center gap-4">
                  <div className="p-3 bg-white rounded-xl shadow-sm text-blue-600">
                    <GraduationCap size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                      Level
                    </p>
                    <p className="text-xl font-black text-slate-900">
                      {viewCourse.level}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex items-center gap-4">
                  <div className="p-3 bg-white rounded-xl shadow-sm text-purple-600">
                    <GraduationCap size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                      Instructor
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      {viewCourse.instructor?.name || "Not Assigned"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="flex justify-end pt-6 border-t border-gray-100 sticky bottom-0 bg-white z-10 p-4">
              <button
                onClick={() => setViewCourse(null)}
                className="bg-slate-200 text-slate-800 px-6 py-2 rounded-xl hover:bg-slate-300 font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnrollClass;