import React, { useState } from "react";
import {
  FileText,
  CheckSquare,
  MoreHorizontal,
} from "lucide-react";
import StudentFeesList from "../../components/payments/StudentFeesList";
import PendingApprovalsList from "../../components/payments/PendingApprovalsList";

const FeesCollection = () => {
  const [activeTab, setActiveTab] = useState("course_fees");

  const tabs = {
    course_fees: { label: "Course Fees", icon: <FileText size={18} /> },
    council_fees: { label: "Council Fees", icon: <FileText size={18} /> },
    approvals: { label: "Pending Approvals", icon: <CheckSquare size={18} /> },
    others: { label: "Others", icon: <MoreHorizontal size={18} /> },
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-in fade-in duration-500 max-w-full">
      {/* HEADER */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Fees Collection</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Manage and collect student course, council, and other fees.</p>
        </div>
      </div>

      {/* SUB-TABS */}
      <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-200 gap-8 px-2">
        {Object.keys(tabs).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 px-2 text-sm font-bold transition-colors relative whitespace-nowrap flex items-center gap-2 group ${
              activeTab === tab ? "text-brand-600" : "text-slate-400 hover:text-brand-600"
            }`}
          >
            {tabs[tab].icon}
            {tabs[tab].label}
            <div
              className={`absolute bottom-0 left-0 w-full h-1 rounded-t-full transition-colors ${
                activeTab === tab ? "bg-brand-600" : "bg-transparent group-hover:bg-brand-600"
              }`}
            />
          </button>
        ))}
      </div>

      {/* CONTENT AREA */}
      <div className="animate-in slide-in-from-bottom-2 fade-in duration-300">
        {activeTab === "course_fees" && <StudentFeesList feeType="Course" excludePaid={true} />}
        {activeTab === "council_fees" && <StudentFeesList feeType="Council" excludePaid={true} />}
        {activeTab === "approvals" && <PendingApprovalsList />}
        {activeTab === "others" && <StudentFeesList feeType="Other" excludePaid={true} />}
      </div>
    </div>
  );
};

export default FeesCollection;
