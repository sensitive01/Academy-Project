import React, { useMemo, useState, useEffect } from "react";
import { Wallet, CreditCard, Banknote, Smartphone, TrendingUp, Trophy } from "lucide-react";
import api from "../../services/api";
import Loading from "../common/Loading";

const InwardDashboard = () => {
  const [inwardPayments, setInwardPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        const [year, month] = selectedMonth.split("-");
        const res = await api.get(`/finance/payments?type=inward&month=${month}&year=${year}&all=true`);
        setInwardPayments(res.data.payments || []);
      } catch (err) {
        console.error("Error fetching payments:", err);
      } finally {
        setLoading(false);
      }
    };
    if (selectedMonth) {
      fetchPayments();
    }
  }, [selectedMonth]);
  // Only consider successful payments for analytics
  const successfulPayments = useMemo(() => {
    return inwardPayments.filter((p) => p.status === "success" || p.status === "paid");
  }, [inwardPayments]);

  const totalRevenue = useMemo(() => {
    return successfulPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }, [successfulPayments]);

  const paymentMethods = useMemo(() => {
    const methods = {};
    successfulPayments.forEach((p) => {
      let method = p.paymentMethod?.toLowerCase() || "other";
      if (method.includes("upi") || method.includes("gpay") || method.includes("phonepe") || method.includes("paytm")) method = "UPI";
      else if (method.includes("card") || method.includes("debit") || method.includes("credit")) method = "Card";
      else if (method.includes("cash")) method = "Cash";
      else if (method.includes("bank") || method.includes("transfer") || method.includes("neft") || method.includes("rtgs") || method.includes("imps")) method = "Bank Transfer";
      else method = "Other";

      methods[method] = (methods[method] || 0) + (Number(p.amount) || 0);
    });

    return Object.keys(methods)
      .map((key) => ({
        method: key,
        amount: methods[key],
        percentage: totalRevenue > 0 ? ((methods[key] / totalRevenue) * 100).toFixed(1) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [successfulPayments, totalRevenue]);

  const topCourses = useMemo(() => {
    const courses = {};
    successfulPayments.forEach((p) => {
      const courseTitle = p.course?.title || p.course?.name || "Unassigned / General";
      courses[courseTitle] = (courses[courseTitle] || 0) + (Number(p.amount) || 0);
    });

    return Object.keys(courses)
      .map((key) => ({
        title: key,
        amount: courses[key],
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5); // Top 5 courses
  }, [successfulPayments]);

  const getMethodIcon = (method) => {
    switch (method) {
      case "UPI":
        return <Smartphone size={16} className="text-purple-500" />;
      case "Card":
        return <CreditCard size={16} className="text-blue-500" />;
      case "Cash":
        return <Banknote size={16} className="text-emerald-500" />;
      case "Bank Transfer":
        return <Banknote size={16} className="text-indigo-500" />;
      default:
        return <Wallet size={16} className="text-slate-500" />;
    }
  };

  const getMethodColor = (method) => {
    switch (method) {
      case "UPI":
        return "bg-purple-500";
      case "Card":
        return "bg-blue-500";
      case "Cash":
        return "bg-emerald-500";
      case "Bank Transfer":
        return "bg-indigo-500";
      default:
        return "bg-slate-400";
    }
  };

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

      {loading ? (
        <div className="p-8 text-center text-slate-500 font-bold">Loading dashboard data...</div>
      ) : successfulPayments.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center mb-6">
          <p className="text-slate-500 font-medium">No successful inward payments found for this period to generate analytics.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 animate-in fade-in zoom-in duration-500">
      
      {/* TOTAL REVENUE WIDGET */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <TrendingUp size={120} />
        </div>
        <div className="relative z-10">
          <p className="text-slate-500 font-bold uppercase tracking-wider text-xs mb-2">Collected Revenue</p>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">
            <span className="text-emerald-500 mr-1">₹</span>
            {totalRevenue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
          </h2>
          <p className="text-xs text-slate-400 mt-2 font-medium">
            Based on {successfulPayments.length} successful {successfulPayments.length === 1 ? 'transaction' : 'transactions'}
          </p>
        </div>
      </div>

      {/* PAYMENT METHODS BREAKDOWN */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Wallet size={16} className="text-slate-400" />
          Payment Methods
        </h3>
        
        <div className="space-y-4">
          {paymentMethods.map((pm, idx) => (
            <div key={idx}>
              <div className="flex justify-between items-end mb-1">
                <div className="flex items-center gap-2">
                  {getMethodIcon(pm.method)}
                  <span className="text-sm font-bold text-slate-700">{pm.method}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-slate-800">₹{pm.amount.toLocaleString("en-IN")}</span>
                  <span className="text-xs text-slate-400 ml-2 font-medium">{pm.percentage}%</span>
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div 
                  className={`${getMethodColor(pm.method)} h-2 rounded-full`} 
                  style={{ width: `${pm.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TOP COURSES LEADERBOARD */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Trophy size={16} className="text-amber-500" />
          Top Performing Courses
        </h3>
        
        <div className="space-y-3">
          {topCourses.map((course, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-slate-200 text-slate-600' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>
                  #{idx + 1}
                </div>
                <span className="text-sm font-semibold text-slate-700 truncate">{course.title}</span>
              </div>
              <span className="text-sm font-bold text-emerald-600 shrink-0 ml-2">₹{(course.amount / 1000).toFixed(1)}k</span>
            </div>
          ))}
          {topCourses.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-4">No course data available.</p>
          )}
        </div>
      </div>
      </div>
      )}
    </div>
  );
};

export default InwardDashboard;
