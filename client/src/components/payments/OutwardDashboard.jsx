import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { Receipt, WalletCards, Coins, Home, Banknote } from "lucide-react";

const OutwardDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalExpense: 0,
    totalRent: 0,
    totalSalary: 0,
    totalStipend: 0,
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
        
        // Fetch expenses
        const expensesRes = await api.get("/expenses");
        const expenses = expensesRes.data?.data || [];

        let totalExpense = 0;
        let totalRent = 0;

        expenses.forEach(exp => {
          const d = new Date(exp.createdAt);
          if (d.getMonth() + 1 === parseInt(month) && d.getFullYear() === parseInt(year)) {
          if (exp.status === "paid" || exp.status === "reimbursed") {
            if (exp.category === "Rent") {
              totalRent += Number(exp.amount) || 0;
            } else {
              totalExpense += Number(exp.amount) || 0;
            }
          }
          }
        });

        let totalSalary = 0;
        let totalStipend = 0;
        
        // We'll just fetch intern payrolls and regular payrolls for the current month
        const [empPayrollRes, internPayrollRes] = await Promise.all([
          api.get(`/payroll/salary/all?month=${month}&year=${year}&internOnly=false`),
          api.get(`/payroll/salary/all?month=${month}&year=${year}&internOnly=true`)
        ]);

        const empPayrolls = empPayrollRes.data || [];
        const internPayrolls = internPayrollRes.data || [];

        empPayrolls.forEach(pr => {
          if (pr.status === "paid") {
             totalSalary += Number(pr.netSalary) || 0;
          }
        });

        internPayrolls.forEach(pr => {
          if (pr.status === "paid") {
             totalStipend += Number(pr.netSalary) || 0;
          }
        });

        setStats({
          totalExpense,
          totalRent,
          totalSalary,
          totalStipend
        });

      } catch (err) {
        console.error(err);
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Expense" 
          value={stats.totalExpense} 
          icon={<Receipt size={24} />} 
          colorClass="text-rose-600" 
          bgClass="bg-rose-50" 
        />
        <StatCard 
          title="Total Salary (This Month)" 
          value={stats.totalSalary} 
          icon={<WalletCards size={24} />} 
          colorClass="text-blue-600" 
          bgClass="bg-blue-50" 
        />
        <StatCard 
          title="Total Stipend (This Month)" 
          value={stats.totalStipend} 
          icon={<Coins size={24} />} 
          colorClass="text-amber-600" 
          bgClass="bg-amber-50" 
        />
        <StatCard 
          title="Total Rent" 
          value={stats.totalRent} 
          icon={<Home size={24} />} 
          colorClass="text-purple-600" 
          bgClass="bg-purple-50" 
        />
      </div>
      
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 flex flex-col items-center justify-center text-center mt-6">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100">
            <Banknote size={32} className="text-slate-300" />
          </div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight">Overall Outward Summary</h3>
          <p className="text-sm font-medium text-slate-500 mt-2 max-w-md">
            This dashboard aggregates all your paid expenses, rent, and current month's payroll. 
          </p>
          <div className="mt-6 px-8 py-4 bg-slate-50 border border-slate-200 rounded-2xl">
             <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Total Outward Cash Flow</p>
             <h2 className="text-3xl font-black text-slate-800">₹{(stats.totalExpense + stats.totalRent + stats.totalSalary + stats.totalStipend).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h2>
          </div>
      </div>
    </div>
  );
};

export default OutwardDashboard;
