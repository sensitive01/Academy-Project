import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";

// Layouts
import DashboardLayout from "./layouts/DashboardLayout";
import PublicLayout from "./layouts/PublicLayout";

// Public Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import CourseCatalog from "./pages/lms/CourseCatalog";
import ForgotPassword from "./components/ForgotPassword";
import StudentRegistration from "./pages/StudentRegistration";

import CertificateView from "./pages/lms/CertificateView";

// Dashboard Pages
import Dashboard from "./pages/Dashboard";
import MyLearning from "./pages/lms/MyLearning";
import CoursePlayer from "./pages/lms/CoursePlayer";
import EnrollClass from "./pages/lms/EnrollClass";
import CourseManagement from "./pages/admin/CourseManagement";
import ExamManagement from "./pages/dashboard/ExamManagement";
import AdministrativeConfigs from "./pages/admin/AdministrativeConfigs";
import HR from "./pages/dashboard/HR";
import Settings from "./pages/dashboard/Settings";
import Students from "./pages/dashboard/Students";
import VendorManagement from "./pages/admin/VendorManagement";
import EnquiryManagement from "./pages/admin/EnquiryManagement";
import VendorDashboard from "./pages/dashboard/VendorDashboard";
import ParentManagement from "./pages/admin/ParentManagement";
import AdminLogins from "./pages/admin/AdminLogins";
import ParentDashboard from "./pages/parent/ParentDashboard";
import ChildAttendance from "./pages/parent/ChildAttendance";
import ChildLeave from "./pages/parent/ChildLeave";
import RegisterChild from "./pages/parent/RegisterChild";
import Attendance from "./pages/attendance/Attendance";
import Profile from "./pages/profile/Profile";
import Finance from "./pages/Finance";
import Announcement from "./pages/dashboard/Announcement";
import DiscussionForum from "./pages/dashboard/DiscussionForum";
import Expenses from "./pages/expenses/Expenses";
import MyCourses from "./pages/coach/MyCourses";
import Subscription from "./pages/dashboard/Subscription";
import Notifications from "./pages/dashboard/Notifications";

// Leave
import LeaveRequestList from "./components/LeaveRequestList";

import Loading from "./components/Loading";

// Vendor Pages
import VendorAttendance from "./pages/vendor/VendorAttendance";
import VendorLeaves from "./pages/vendor/VendorLeaves";
import PublicAttendance from "./pages/PublicAttendance";

// Helper components for professional placeholders
const PlaceholderPage = ({ title, content, features }) => (
  <div className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
    <div className="text-center mb-16">
      <h1 className="text-4xl font-extrabold text-slate-900 mb-6">{title}</h1>
      <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">{content}</p>
    </div>
    {features && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map((f, i) => (
          <div key={i} className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-lg font-bold text-slate-900 mb-2">{f.title}</h3>
            <p className="text-slate-600 text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    )}
  </div>
);

// ---------------------------
// Private Route Wrapper
// ---------------------------
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <Loading fullPage />;

  return user ? children : <Navigate to="/login" replace />;
};

// ---------------------------
// Leave Role Logic
// ---------------------------
function LeaveRequestOrForm() {
  const { user } = useAuth();
  if (!user) return null;

  const isAdmin = user.role?.toLowerCase() === "admin";

  return (
    <LeaveRequestList
      showApplyButton={!isAdmin}
      onlyMine={!isAdmin}
    />
  );
}

// ---------------------------
// Dashboard Redirect Logic
// ---------------------------
const DashboardRedirect = () => {
  const { user } = useAuth();

  if (user?.role === "parent") {
    return <Navigate to="/dashboard/parent-dashboard" replace />;
  }

  if (user?.role === "vendor") {
    return <Navigate to="/dashboard/vendor" replace />;
  }

  return <Dashboard />;
};

// ---------------------------
// Main App
// ---------------------------
function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" reverseOrder={false} />
      <Router>
        <Routes>

          {/* ================= PUBLIC ROUTES ================= */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />

            <Route path="/admissions" element={
              <PlaceholderPage
                title="Admissions 2024-25"
                content="Your journey to global excellence starts here. We offer a seamless admission process for all our medical, hospitality, and vocational programs."
                features={[
                  { title: "Online Application", desc: "Easy-to-use digital portal for submitting your documents and tracking your status." },
                  { title: "Counseling Support", desc: "Dedicated academic counselors to help you choose the right vertical for your career." },
                  { title: "Entrance Guidance", desc: "Full support for institutional and competitive entrance exams across all streams." }
                ]}
              />
            } />

            <Route path="/scholarships" element={
              <PlaceholderPage
                title="Scholarships & Merit Awards"
                content="Dr.RG Academy rewards excellence. We believe financial constraints should never stand in the way of a deserving student's future."
                features={[
                  { title: "Merit-Based", desc: "Awards for top scorers in academic and entrance examinations." },
                  { title: "Needs-Based", desc: "Support for students from economically weaker backgrounds showing high potential." },
                  { title: "International Grants", desc: "Specific funding for students pursuing medical or hospitality degrees abroad." }
                ]}
              />
            } />

            <Route path="/unicarewel" element={
              <PlaceholderPage
                title="Unicarewel Global Education"
                content="Specialized medical education consultancy bridging students with world-class medical universities internationally."
                features={[
                  { title: "MBBS Abroad", desc: "Expert guidance for medical admissions in Russia, Georgia, and other top-tier destinations." },
                  { title: "Documentation", desc: "Complete support for visa processing, university application, and on-ground logistics." },
                  { title: "Student Welfare", desc: "Dedicated support team ensuring our students are safe and successful while studying abroad." }
                ]}
              />
            } />

            <Route path="/rgmtn" element={
              <PlaceholderPage
                title="RGMTN Hospitality Management"
                content="The premier institute for hotel and tourism excellence under the Dr.RG Group banner."
                features={[
                  { title: "Professional Kitchens", desc: "Hands-on training in international cuisines and culinary arts." },
                  { title: "Front Desk Simulators", desc: "Learn guest relations and hospitality software in a real-world environment." },
                  { title: "Cruise Training", desc: "Specialized modules for candidates targeting luxury cruise liners and flight services." }
                ]}
              />
            } />

            <Route path="/bglrgm" element={
              <PlaceholderPage
                title="BGLRGM Vocational Training"
                content="Empowering the workforce with industry-aligned technical skills and vocational certifications."
                features={[
                  { title: "Skill Certification", desc: "Short-term courses recognized by leading national and industrial bodies." },
                  { title: "Practical Workshops", desc: "Focus on 80% practical learning and only 20% theory for immediate employability." },
                  { title: "Job Readiness", desc: "Includes communication skills, soft skills, and interview preparation modules." }
                ]}
              />
            } />

            <Route path="/resource-supply" element={<PlaceholderPage title="Resource Supply" content="Access our full library of brochures, training toolkits, and academic resources." />} />
            <Route path="/benefits" element={<PlaceholderPage title="Why Choose Us?" content="Explore the unique advantages of becoming a Dr.RG Academy student." />} />
            <Route path="/locate-us" element={<PlaceholderPage title="Our Presence" content="Dr.RG Academy is located in Padmanabhanagar, Bangalore, with easy access via public transport and private vehicles. Visit us for admissions, counseling, or inquiries—we’re here to help you." />} />
            <Route path="/privacy-policy" element={<PlaceholderPage title="Privacy Policy" content="Dr.RG Academy respects your privacy and ensures that your personal data is securely handled. We collect information only to improve our services and never share it without consent, except when required by law." />} />
            <Route path="/refund-policy" element={<PlaceholderPage title="Cancellation & Refund Policy" content="Clear guidelines on enrollment cancellations and fee refunds." />} />
            <Route path="/terms-conditions" element={<PlaceholderPage title="Terms & Conditions" content="General operating policies for students and partners." />} />
            <Route path="/courses/masters" element={<PlaceholderPage title="Master Degree Courses" content="Advanced specialized programs for career leadership." />} />
            <Route path="/courses/international" element={<PlaceholderPage title="International Programs" content="Globally recognized degrees from our foreign partner institutions." />} />
            <Route path="/opportunities/onsite" element={<PlaceholderPage title="Onsite Opportunities" content="Direct industry placements and onsite training experiences." />} />
            <Route path="/downloads" element={<PlaceholderPage title="Download Center" content="Digital repository for application forms and prospectuses." />} />
            <Route path="/payment" element={<PlaceholderPage title="Online Fee Payment" content="Secure portal for all your institutional financial transactions." />} />

            <Route
              path="/about"
              element={
                <div className="p-20 text-center">
                  About Us Page (Coming Soon)
                </div>
              }
            />

            <Route
              path="/contact"
              element={
                <div className="p-20 text-center">
                  Contact Page (Coming Soon)
                </div>
              }
            />

            <Route
              path="/courses"
              element={
                <div className="p-20 text-center">
                  <h1 className="text-2xl font-bold mb-4">All Courses</h1>
                  <CourseCatalog />
                </div>
              }
            />

            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* ================= AUTH ================= */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Login />} />
            <Route path="/student-registration" element={<StudentRegistration />} />
          </Route>

          <Route path="/public-attendance" element={<PublicAttendance />} />

          {/* ================= DASHBOARD ROUTES ================= */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<DashboardRedirect />} />

            {/* Announcements */}
            <Route path="announcements" element={<Announcement />} />
            <Route path="forum" element={<DiscussionForum />} />
            <Route path="exams" element={<ExamManagement />} />

            {/* LMS */}
            <Route path="lms" element={<MyLearning />} />
            <Route path="lms/course/:id" element={<CoursePlayer />} />
            <Route path="lms/certificate/:courseId" element={<CertificateView />} />
            <Route path="enroll" element={<EnrollClass />} />

            {/* Parent */}
            <Route path="parent-dashboard" element={<ParentDashboard />} />
            <Route path="/dashboard/parent/child-attendance" element={<ChildAttendance />} />
            <Route path="/dashboard/parent/child-leave" element={<ChildLeave />} />
            <Route
              path="parent/register-child"
              element={<RegisterChild />}
            />

            {/* Attendance */}
            <Route path="attendance" element={<Attendance />} />

            {/* Subscription */}
            <Route path="subscription" element={<PrivateRoute> <Subscription /> </PrivateRoute>} />
            {/* Admin */}
            <Route path="admin/courses" element={<CourseManagement />} />
            <Route path="admin/configs" element={<AdministrativeConfigs />} />
            <Route path="admin/logins" element={<AdminLogins />} />
            <Route path="admin/parents" element={<ParentManagement />} />
            <Route path="admin/vendors" element={<VendorManagement />} />
            <Route path="admin/enquiries" element={<EnquiryManagement />} />
            <Route path="vendor" element={<VendorDashboard />} />
            <Route path="vendor/attendance" element={<VendorAttendance />} />
            <Route path="vendor/leaves" element={<VendorLeaves />} />

            {/* HR */}
            <Route path="hr" element={<HR />} />
            <Route path="finance" element={<Finance />} />
            <Route path="expenses" element={<Expenses />} />

            {/* Students */}
            <Route path="students" element={<Students />} />

            {/* Coach */}
            <Route path="coach/my-courses" element={<MyCourses />} />

            {/* Profile */}
            <Route path="profile" element={<Profile />} />

            {/* Settings */}
            <Route path="settings" element={<Settings />} />

            {/* Notifications */}
            <Route path="notifications" element={<Notifications />} />

            {/* Leave */}
            <Route path="leave-request" element={<LeaveRequestOrForm />} />
          </Route>

          {/* ================= FALLBACK ================= */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;