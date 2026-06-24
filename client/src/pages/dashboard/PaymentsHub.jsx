import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  MonitorPlay,
  FileText,
  CalendarDays,
  Building,
  MoreHorizontal,
  Receipt,
  WalletCards,
  Search,
  Filter,
} from "lucide-react";
import Expenses from "../expenses/Expenses";
import Payroll from "../payroll/Payroll";

const PlaceholderTable = ({ title, description }) => {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col items-center justify-center py-20 px-6 text-center animate-in fade-in zoom-in duration-500">
      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100">
        <Receipt size={32} className="text-slate-300" />
      </div>
      <h3 className="text-xl font-black text-slate-800 tracking-tight">{title}</h3>
      <p className="text-sm font-medium text-slate-500 mt-2 max-w-md">
        {description}
      </p>
      <div className="mt-8 flex gap-3">
        <button className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-sm transition-all">
          <Search size={16} className="inline mr-2" /> Search Records
        </button>
        <button className="px-6 py-2.5 bg-brand-50 hover:bg-brand-100 text-brand-600 rounded-xl font-bold text-sm transition-all border border-brand-200">
          <Filter size={16} className="inline mr-2" /> Filter
        </button>
      </div>
    </div>
  );
};

const PaymentsHub = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Initialize mainTab from URL if present
  const initialMainTab = location.pathname.includes("outward") ? "outward" : "inward";
  const [mainTab, setMainTab] = useState(initialMainTab); 
  const [inwardTab, setInwardTab] = useState("online_course");
  const [outwardTab, setOutwardTab] = useState("expense");

  // Sync state when URL changes externally (e.g. clicking sidebar)
  useEffect(() => {
    if (location.pathname.includes("outward") && mainTab !== "outward") {
      setMainTab("outward");
    } else if (location.pathname.includes("inward") && mainTab !== "inward") {
      setMainTab("inward");
    }
  }, [location.pathname]);

  // Update URL when mainTab changes internally
  const handleMainTabChange = (tab) => {
    setMainTab(tab);
    navigate(`/dashboard/payments/${tab}`);
  };

  const inwardTabs = {
    online_course: { label: "Online Course", icon: <MonitorPlay size={18} /> },
    exam_fees: { label: "Exam Fees", icon: <FileText size={18} /> },
    term_fees: { label: "Term Fees", icon: <CalendarDays size={18} /> },
    vendor_payments: { label: "Vendor Payments", icon: <Building size={18} /> },
    others: { label: "Others", icon: <MoreHorizontal size={18} /> },
  };

  const outwardTabs = {
    expense: { label: "Expense", icon: <Receipt size={18} /> },
    salary: { label: "Salary", icon: <WalletCards size={18} /> },
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-in fade-in duration-500 max-w-full overflow-hidden">
      {/* HEADER & MAIN TOGGLE */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col lg:flex-row justify-between items-center gap-6 relative z-10">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Payments Hub</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Manage all inward revenue and outward expenditures.</p>
        </div>

        {/* Main Inward/Outward Toggle */}
        <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
          <button
            onClick={() => handleMainTabChange("inward")}
            className={`flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
              mainTab === "inward"
                ? "bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200/50"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
            }`}
          >
            <ArrowDownCircle size={18} className={mainTab === "inward" ? "text-emerald-500" : ""} />
            Inward
          </button>
          <button
            onClick={() => handleMainTabChange("outward")}
            className={`flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
              mainTab === "outward"
                ? "bg-white text-rose-600 shadow-sm ring-1 ring-slate-200/50"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
            }`}
          >
            <ArrowUpCircle size={18} className={mainTab === "outward" ? "text-rose-500" : ""} />
            Outward
          </button>
        </div>
      </div>

      {/* SUB-TABS */}
      <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-200 gap-8 px-2">
        {mainTab === "inward"
          ? Object.keys(inwardTabs).map((tab) => (
              <button
                key={tab}
                onClick={() => setInwardTab(tab)}
                className={`pb-4 px-2 text-sm font-bold transition-colors relative whitespace-nowrap flex items-center gap-2 group ${
                  inwardTab === tab
                    ? "text-brand-600"
                    : "text-slate-400 hover:text-brand-600"
                }`}
              >
                {inwardTabs[tab].icon}
                {inwardTabs[tab].label}
                <div className={`absolute bottom-0 left-0 w-full h-1 rounded-t-full transition-colors ${
                  inwardTab === tab ? "bg-brand-600" : "bg-transparent group-hover:bg-brand-600"
                }`} />
              </button>
            ))
          : Object.keys(outwardTabs).map((tab) => (
              <button
                key={tab}
                onClick={() => setOutwardTab(tab)}
                className={`pb-4 px-2 text-sm font-bold transition-colors relative whitespace-nowrap flex items-center gap-2 group ${
                  outwardTab === tab
                    ? "text-brand-600"
                    : "text-slate-400 hover:text-brand-600"
                }`}
              >
                {outwardTabs[tab].icon}
                {outwardTabs[tab].label}
                <div className={`absolute bottom-0 left-0 w-full h-1 rounded-t-full transition-colors ${
                  outwardTab === tab ? "bg-brand-600" : "bg-transparent group-hover:bg-brand-600"
                }`} />
              </button>
            ))}
      </div>

      {/* CONTENT AREA */}
      <div className="animate-in slide-in-from-bottom-2 fade-in duration-300">
        {mainTab === "inward" ? (
          <>
            {inwardTab === "online_course" && (
              <PlaceholderTable
                title="Online Course Payments"
                description="Records of all transactions related to online course purchases and subscriptions."
              />
            )}
            {inwardTab === "exam_fees" && (
              <PlaceholderTable
                title="Exam Fees"
                description="Collection of fees for upcoming academic and competitive examinations."
              />
            )}
            {inwardTab === "term_fees" && (
              <PlaceholderTable
                title="Term Fees"
                description="Standard academic term fees collected from enrolled students."
              />
            )}
            {inwardTab === "vendor_payments" && (
              <PlaceholderTable
                title="Vendor Payments (Inward)"
                description="Commissions or revenues received from partnered vendors."
              />
            )}
            {inwardTab === "others" && (
              <PlaceholderTable
                title="Other Inward Revenues"
                description="Miscellaneous incomes, donations, or undefined inward transactions."
              />
            )}
          </>
        ) : (
          <>
            {outwardTab === "expense" && (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4 sm:p-6 overflow-hidden">
                <Expenses hideHeader={true} />
              </div>
            )}
            {outwardTab === "salary" && (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4 sm:p-6 overflow-hidden">
                <Payroll hideHeader={true} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentsHub;
