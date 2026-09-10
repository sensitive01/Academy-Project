import React, { useState } from "react";
import { FileText, MoreHorizontal, ArrowLeft } from "lucide-react";
import StudentFeesList from "../../components/payments/StudentFeesList";

const BatchFeesDetail = ({ batch, onBack }) => {
  const [activeTab, setActiveTab] = useState("course_fees");

  const tabs = {
    course_fees: { label: "Course Fees", icon: <FileText size={18} /> },
    council_fees: { label: "Council Fees", icon: <FileText size={18} /> },
    both_fees: { label: "Both Fees", icon: <FileText size={18} /> },
    others: { label: "Others", icon: <MoreHorizontal size={18} /> },
  };

  return (
    <div className="animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10 mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{batch.name} - Fees</h1>
            <p className="text-slate-500 text-sm font-medium mt-1">
              {batch.period?.startDate} to {batch.period?.endDate}
            </p>
          </div>
        </div>
      </div>

      {/* SUB-TABS */}
      <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-200 gap-8 px-2 mb-6">
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
        {activeTab === "course_fees" && <StudentFeesList feeType="Course" excludePaid={true} batchObj={batch} />}
        {activeTab === "council_fees" && <StudentFeesList feeType="Council" excludePaid={true} batchObj={batch} />}
        {activeTab === "both_fees" && <StudentFeesList feeType="Both" excludePaid={true} batchObj={batch} />}
        {activeTab === "others" && <StudentFeesList feeType="Other" excludePaid={true} batchObj={batch} />}
      </div>
    </div>
  );
};

export default BatchFeesDetail;