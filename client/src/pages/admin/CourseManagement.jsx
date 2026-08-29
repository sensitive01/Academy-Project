import React, { useState } from "react";
import { BookOpen, MapPin, Layers, BookType, LayoutDashboard } from "lucide-react";
import CoursesTab from "../../components/course-management/CoursesTab";
import BatchesTab from "../../components/course-management/BatchesTab";
import SubjectsTab from "../../components/course-management/SubjectsTab";
import CourseDashboardTab from "../../components/course-management/CourseDashboardTab";
import CenterManagement from "./CenterManagement";

const CourseManagement = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { id: "online_courses", label: "Online Courses", icon: <BookOpen size={18} /> },
    { id: "center_courses", label: "Center Courses", icon: <MapPin size={18} /> },
    { id: "batch", label: "Batches", icon: <Layers size={18} /> },
    { id: "subject", label: "Subjects", icon: <BookType size={18} /> },
    { id: "centers", label: "Centers", icon: <MapPin size={18} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
          <p className="text-sm text-gray-500">Manage courses, batches, and subjects</p>
        </div>
      </div>

      {/* Tabs UI */}
      <div className="flex border-b border-gray-200 gap-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-4 px-2 text-sm font-bold flex items-center gap-2 transition-colors relative whitespace-nowrap group ${activeTab === tab.id
                ? "text-brand-600"
                : "text-gray-500 hover:text-brand-600"
              }`}
          >
            {tab.icon}
            {tab.label}
            <div className={`absolute bottom-0 left-0 w-full h-0.5 rounded-t-full transition-colors ${activeTab === tab.id ? "bg-brand-600" : "bg-transparent group-hover:bg-brand-600"
              }`} />
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "dashboard" && <CourseDashboardTab />}
        {activeTab === "online_courses" && <CoursesTab courseType="Online Courses" />}
        {activeTab === "center_courses" && <CoursesTab courseType="Center Courses" />}
        {activeTab === "batch" && <BatchesTab />}
        {activeTab === "subject" && <SubjectsTab />}
        {activeTab === "centers" && (
          <div className="-mt-6">
            <CenterManagement isTab={true} />
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseManagement;
