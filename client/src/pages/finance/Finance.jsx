import React, { useEffect, useState, useMemo } from "react";
import api from "../../services/api";
import Loading from "../../components/common/Loading";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import CustomDataTable from "../../components/common/DataTable";
import { Search } from "lucide-react";
import StudentFilterBar from "../../components/common/StudentFilterBar";

const Finance = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  // Search Filters
  const [inwardSearch, setInwardSearch] = useState("");
  const [outwardSearch, setOutwardSearch] = useState("");

  const [filterType, setFilterType] = useState([]);
  const [filterCenter, setFilterCenter] = useState([]);
  const [filterCourse, setFilterCourse] = useState([]);
  const [filterBatch, setFilterBatch] = useState([]);
  const [filterYears, setFilterYears] = useState([]);

  const [centers, setCenters] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [studentsMap, setStudentsMap] = useState({});

  useEffect(() => {
    api.get("/centers").then(res => setCenters(res.data || [])).catch(() => {});
    api.get("/courses").then(res => setCourses(res.data?.courses || res.data || [])).catch(() => {});
    api.get("/batches").then(res => setBatches(res.data?.batches || res.data || [])).catch(() => {});
    api.get("/students").then(res => {
      const list = res.data?.students || [];
      const map = {};
      list.forEach(s => {
        if (s._id) map[s._id] = s;
        if (s.user?._id) map[s.user._id] = s;
      });
      setStudentsMap(map);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [selectedMonth]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const [year, month] = selectedMonth.split("-");
      const res = await api.get(`/finance/payments?month=${month}&year=${year}&all=true`);
      setPayments(res.data.payments || []);
    } catch (err) {
      console.error("Error fetching payments:", err);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const inwardPayments = useMemo(() => {
    return payments.filter((p) => {
      if (p.type?.toLowerCase() !== "inward") return false;
      const matchesSearch =
        p.student?.studentNameEnglish
          ?.toLowerCase()
          ?.includes(inwardSearch.toLowerCase()) ||
        p.recipientName?.toLowerCase()?.includes(inwardSearch.toLowerCase()) ||
        inwardSearch === "";
      if (!matchesSearch) return false;

      const sProfile = (p.student && typeof p.student === "object")
        ? p.student
        : (p.student ? studentsMap[p.student] : null);

      if (filterType.length > 0) {
        const isIntern = sProfile?.internships && sProfile.internships.length > 0;
        const matchType = (filterType.includes("intern") && isIntern) || (filterType.includes("inhouse") && !isIntern);
        if (!matchType) return false;
      }

      if (sProfile) {
        if (filterCenter.length > 0) {
          const cId = sProfile.center?._id || sProfile.center;
          if (!cId || !filterCenter.includes(cId)) return false;
        }
        if (filterCourse.length > 0) {
          const courseId = p.course?._id || p.course;
          const hasCourse = filterCourse.includes(courseId) || sProfile.enrolledCourses?.some(ec => filterCourse.includes(ec.course?._id || ec.course)) || filterCourse.includes(sProfile.department);
          if (!hasCourse) return false;
        }
        if (filterBatch.length > 0) {
          const selectedBatches = batches.filter(b => filterBatch.includes(b._id || b.name));
          const matchBatch = selectedBatches.some(b => b.students?.some(bs => bs === sProfile._id || bs?._id === sProfile._id));
          if (!matchBatch) return false;
        }
        if (filterYears.length > 0) {
          if (!sProfile.year || !filterYears.includes(String(sProfile.year))) return false;
        }
      } else if (filterCenter.length > 0 || filterCourse.length > 0 || filterBatch.length > 0 || filterYears.length > 0) {
        return false;
      }

      return true;
    });
  }, [payments, inwardSearch, filterType, filterCenter, filterCourse, filterBatch, filterYears, studentsMap, batches]);

  const outwardPayments = useMemo(() => {
    return payments.filter((p) => {
      if (p.type?.toLowerCase() !== "outward") return false;
      const matchesSearch =
        p.recipientName?.toLowerCase()?.includes(outwardSearch.toLowerCase()) ||
        outwardSearch === "";
      return matchesSearch;
    });
  }, [payments, outwardSearch]);

  const totals = useMemo(() => {
    const revenue = payments
      .filter((p) => p.type === "inward" && p.status === "success")
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const expense = payments
      .filter((p) => p.type === "outward" && p.status === "paid")
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    return {
      revenue,
      expense,
      profit: revenue - expense,
    };
  }, [payments]);

  const [lifetimeStats, setLifetimeStats] = useState({ revenue: 0, expense: 0, profit: 0 });

  useEffect(() => {
    const fetchLifetime = async () => {
      try {
        const res = await api.get("/finance/payments?all=true");
        const allPayments = res.data.payments || [];
        const revenue = allPayments
          .filter((p) => p.type === "inward" && p.status === "success")
          .reduce((sum, p) => sum + (p.amount || 0), 0);
        const expense = allPayments
          .filter((p) => p.type === "outward" && p.status === "paid")
          .reduce((sum, p) => sum + (p.amount || 0), 0);
        setLifetimeStats({ revenue, expense, profit: revenue - expense });
      } catch (err) {
        console.error("Error fetching lifetime stats:", err);
      }
    };
    fetchLifetime();
  }, []);

  const exportToExcel = () => {
    const exportData = [...inwardPayments, ...outwardPayments].map((p, index) => ({
      "S.No": index + 1,
      Name: p.student?.studentNameEnglish || p.recipientName || "-",
      Course: p.course?.title || "-",
      Type: p.type,
      Amount: p.amount,
      Status: p.status,
      Date: new Date(p.createdAt).toLocaleDateString(),
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Finance");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, `Finance_Report_${selectedMonth}.xlsx`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "success":
      case "paid":
        return "bg-green-100 text-green-700";
      case "failed":
        return "bg-red-100 text-red-700";
      case "refunded":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };


return (
  <div className="p-6 space-y-8 bg-slate-50 min-h-screen">

    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Finance Dashboard</h1>
        <p className="text-slate-500 mt-1">Manage and track your school's financial health</p>
      </div>

      <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
        <label className="text-sm font-semibold text-slate-600 ml-2">Filter Month:</label>
        <input
          type="month"
          className="border-none focus:ring-0 text-slate-700 font-medium cursor-pointer"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        />
        <button
          onClick={exportToExcel}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition-colors text-sm font-medium"
        >
          Export Excel
        </button>
      </div>
    </div>

    {/* CARDS */}
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
      <Card
        title={`Revenue (${selectedMonth || 'Selected'})`}
        value={`₹ ${totals.revenue.toLocaleString("en-IN")}`}
        color="text-green-600"
        subtitle="Current selection"
      />
      <Card
        title={`Expense (${selectedMonth || 'Selected'})`}
        value={`₹ ${totals.expense.toLocaleString("en-IN")}`}
        color="text-red-600"
        subtitle="Current selection"
      />
      <Card
        title={`Profit (${selectedMonth || 'Selected'})`}
        value={`₹ ${totals.profit.toLocaleString("en-IN")}`}
        color="text-blue-600"
        subtitle="Current selection"
      />
      <Card
        title="Lifetime Profit"
        value={`₹ ${lifetimeStats.profit.toLocaleString("en-IN")}`}
        color="text-purple-600"
        subtitle="All time total"
      />
    </div>

    {/* ===================== INWARD SECTION ===================== */}

    <h2 className="text-2xl font-semibold">Inward Transactions</h2>

    <div className="flex flex-col md:flex-row justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-100 items-start md:items-center gap-4">
      <div className="relative flex flex-col max-w-md w-full group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
        <input
          type="text"
          placeholder="Search student or recipient..."
          className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all shadow-sm text-sm font-medium"
          value={inwardSearch}
          onChange={(e) => setInwardSearch(e.target.value)}
        />
      </div>
      <div className="text-sm font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
        Showing inward data for: <span className="text-slate-900 font-bold">{selectedMonth}</span>
      </div>
    </div>

    {/* INWARD TABLE */}
    <StudentFilterBar
      filterType={filterType}
      setFilterType={setFilterType}
      filterCenter={filterCenter}
      setFilterCenter={setFilterCenter}
      filterCourse={filterCourse}
      setFilterCourse={setFilterCourse}
      filterBatch={filterBatch}
      setFilterBatch={setFilterBatch}
      filterYears={filterYears}
      setFilterYears={setFilterYears}
      centers={centers}
      courses={courses}
      batches={batches}
      showType={true}
    />
    <Table
      payments={inwardPayments}
      getStatusColor={getStatusColor}
      showCourse
      loading={loading}
    />

    {/* ===================== OUTWARD SECTION ===================== */}
    <h2 className="text-2xl font-semibold">Outward Transactions</h2>
    <div className="flex flex-col md:flex-row justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-100 items-start md:items-center gap-4">
      <div className="relative flex flex-col max-w-md w-full group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
        <input
          type="text"
          placeholder="Search recipient..."
          className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all shadow-sm text-sm font-medium"
          value={outwardSearch}
          onChange={(e) => setOutwardSearch(e.target.value)}
        />
      </div>
      <div className="text-sm font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
        Showing outward data for: <span className="text-slate-900 font-bold">{selectedMonth}</span>
      </div>
    </div>

    {/* OUTWARD TABLE */}
    <Table
      payments={outwardPayments}
      getStatusColor={getStatusColor}
      loading={loading}
    />

  </div>
);
};

////////////////////////////////////////////////////////////
// TABLE COMPONENT
////////////////////////////////////////////////////////////

const Table = ({ title, payments, getStatusColor, showCourse, loading }) => {
  const columns = [
    { name: 'S.No', selector: (row, index) => index + 1, width: '80px', center: true },
    { name: 'Name', selector: row => row.student?.studentNameEnglish || row.recipientName || row.student?.email || "N/A", sortable: true, cell: row => <span className="font-medium text-gray-800">{row.student?.studentNameEnglish || row.recipientName || row.student?.email || "N/A"}</span> },
  ];
  if (showCourse) {
    columns.push({ name: 'Course', selector: row => row.course?.title || "-", sortable: true, cell: row => <span className="text-gray-600">{row.course?.title || "-"}</span> });
  }
  columns.push(
    { name: 'Amount', selector: row => row.amount, sortable: true, cell: row => <span className="font-bold text-gray-800">₹ {row.amount?.toLocaleString("en-IN")}</span> },
    { name: 'Status', selector: row => row.status, sortable: true, center: true, 
      cell: row => (
        <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${getStatusColor(row.status)}`}>
          {row.status}
        </span>
      )
    },
    { name: 'Date', selector: row => row.createdAt, sortable: true, cell: row => <span className="font-mono text-gray-600">{new Date(row.createdAt).toLocaleDateString("en-GB")}</span> }
  );

  return (
    <div className="mt-4">
      {title && <h2 className="text-2xl font-semibold mb-4">{title}</h2>}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden pb-3">
        <CustomDataTable 
          columns={columns}
          data={payments}
          progressPending={loading}
          pagination
        />
      </div>
    </div>
  );
};

// CARD

const Card = ({ title, value, color, subtitle }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
    <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{title}</p>
    <h2 className={`text-3xl font-bold mt-2 ${color}`}>{value}</h2>
    {subtitle && <p className="text-slate-400 text-[10px] mt-1 italic">{subtitle}</p>}
  </div>
);

export default Finance;