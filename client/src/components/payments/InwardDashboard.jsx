import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { FileText, MonitorPlay, Building, MoreHorizontal, Banknote } from "lucide-react";

const InwardDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCourse: 0,
    totalCouncil: 0,
    totalExam: 0,
    totalOnline: 0,
    totalVendor: 0,
    totalOthers: 0
  });

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [year, month] = selectedMonth.split("-");
        
        let totalCourse = 0;
        let totalCouncil = 0;
        let totalExam = 0;
        let totalOthers = 0;
        let totalOnline = 0;
        let totalVendor = 0;

        // 1. Fetch general inward payments (e.g. online courses and vendor inwards)
        const res = await api.get(`/finance/payments?type=inward&month=${month}&year=${year}&all=true`);
        const paymentsData = res.data.payments || [];
        paymentsData.forEach(p => {
           if (p.status === 'success' || p.status === 'paid') {
             if (p.recipientName) {
               totalVendor += Number(p.amount) || 0;
             } else {
               totalOnline += Number(p.amount) || 0;
             }
           }
        });

        // 2. Fetch student fees
        const feesRes = await api.get('/student-fees');
        const allFees = feesRes.data || [];

        const addAmount = (feeType, amount) => {
           if (feeType === 'Sem' || feeType === 'Term' || feeType === 'Monthly') totalCourse += amount;
           else if (feeType === 'Council') totalCouncil += amount;
           else if (feeType === 'Exam') totalExam += amount;
           else totalOthers += amount; 
        };

        allFees.forEach(fee => {
          if (fee.feeType === 'Both') {
             if (fee.coursePayments && Array.isArray(fee.coursePayments)) {
               fee.coursePayments.forEach(p => {
                 if (p.status === 'Approved' && p.paidAt) {
                   const d = new Date(p.paidAt);
                   if (d.getMonth() + 1 === parseInt(month) && d.getFullYear() === parseInt(year)) {
                     totalCourse += Number(p.amount) || 0;
                   }
                 }
               });
             }
             if (fee.councilPayments && Array.isArray(fee.councilPayments)) {
               fee.councilPayments.forEach(p => {
                 if (p.status === 'Approved' && p.paidAt) {
                   const d = new Date(p.paidAt);
                   if (d.getMonth() + 1 === parseInt(month) && d.getFullYear() === parseInt(year)) {
                     totalCouncil += Number(p.amount) || 0;
                   }
                 }
               });
             }
          } else {
            if (fee.payments && Array.isArray(fee.payments)) {
              fee.payments.forEach(p => {
                if (p.status === 'Approved' && p.paidAt) {
                  const d = new Date(p.paidAt);
                  if (d.getMonth() + 1 === parseInt(month) && d.getFullYear() === parseInt(year)) {
                     addAmount(fee.feeType, Number(p.amount) || 0);
                  }
                }
              });
            } else if (fee.status === 'paid' && fee.paidAt) {
              const d = new Date(fee.paidAt);
              if (d.getMonth() + 1 === parseInt(month) && d.getFullYear() === parseInt(year)) {
                 addAmount(fee.feeType, Number(fee.amount) || 0);
              }
            }
          }
        });

        setStats({
          totalCourse,
          totalCouncil,
          totalExam,
          totalOnline,
          totalVendor,
          totalOthers
        });
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    if (selectedMonth) {
      fetchData();
    }
  }, [selectedMonth]);

  const StatCard = ({ title, value, icon, colorClass, bgClass }) => (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 animate-in fade-in zoom-in duration-500">
      <div className={`w-14 h-14 rounded-full flex items-center justify-center ${bgClass} ${colorClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-black text-slate-800 tracking-tight">₹{value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h3>
      </div>
    </div>
  );

  if (loading) {
     return <div className="p-8 text-center text-slate-500 font-bold">Loading dashboard data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 bg-white p-3 rounded-2xl shadow-sm border border-slate-100 max-w-sm">
        <label className="text-sm font-semibold text-slate-600 ml-2">Filter Month:</label>
        <input
          type="month"
          className="border-none focus:ring-0 text-slate-700 font-medium cursor-pointer"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title="Course Fees" 
          value={stats.totalCourse} 
          icon={<FileText size={24} />} 
          colorClass="text-emerald-600" 
          bgClass="bg-emerald-50" 
        />
        <StatCard 
          title="Council Fees" 
          value={stats.totalCouncil} 
          icon={<FileText size={24} />} 
          colorClass="text-blue-600" 
          bgClass="bg-blue-50" 
        />
        <StatCard 
          title="Exam Fees" 
          value={stats.totalExam} 
          icon={<FileText size={24} />} 
          colorClass="text-amber-600" 
          bgClass="bg-amber-50" 
        />
        <StatCard 
          title="Online Course" 
          value={stats.totalOnline} 
          icon={<MonitorPlay size={24} />} 
          colorClass="text-purple-600" 
          bgClass="bg-purple-50" 
        />
        <StatCard 
          title="Vendor Payments" 
          value={stats.totalVendor} 
          icon={<Building size={24} />} 
          colorClass="text-rose-600" 
          bgClass="bg-rose-50" 
        />
        <StatCard 
          title="Others" 
          value={stats.totalOthers} 
          icon={<MoreHorizontal size={24} />} 
          colorClass="text-slate-600" 
          bgClass="bg-slate-50" 
        />
      </div>
      
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 flex flex-col items-center justify-center text-center mt-6">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100">
            <Banknote size={32} className="text-slate-300" />
          </div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight">Overall Inward Summary</h3>
          <p className="text-sm font-medium text-slate-500 mt-2 max-w-md">
            Total revenue collected for {new Date(selectedMonth + "-01").toLocaleString("default", { month: "long", year: "numeric" })} is ₹
            {(stats.totalCourse + stats.totalCouncil + stats.totalExam + stats.totalOnline + stats.totalVendor + stats.totalOthers).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
          </p>
      </div>
    </div>
  );
};

export default InwardDashboard;
