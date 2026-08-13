import React, { useEffect, useState } from "react";
import api from "../../services/api";
import CustomDataTable from "../common/DataTable";
import { downloadReceipt } from "../../utils/downloadReceipt";
import { Download } from "lucide-react";

const OnlineCoursePayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("all");

  useEffect(() => {
    fetchPayments();
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await api.get("/courses");
      setCourses(res.data?.filter(c => c.type === "Online Courses") || []);
    } catch (err) {
      console.error("Failed to load courses", err);
    }
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get("/finance/payments?type=inward&all=true");
      setPayments(res.data.payments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = payments.filter((p) => {
    const term = search.toLowerCase();
    const matchesSearch =
      p.student?.studentNameEnglish?.toLowerCase().includes(term) ||
      p.student?.email?.toLowerCase().includes(term) ||
      p.course?.title?.toLowerCase().includes(term) ||
      p.razorpayPaymentId?.toLowerCase().includes(term);

    const pCourseId = p.course?._id ? p.course._id.toString() : p.course ? p.course.toString() : "";
    const matchesCourse = selectedCourse === "all" || pCourseId === selectedCourse;

    return matchesSearch && matchesCourse;
  });

  const columns = [
    { name: "S.No", selector: (row, i) => i + 1, width: "70px", center: true },
    { 
      name: "Student", 
      selector: row => row.student?.studentNameEnglish, 
      sortable: true,
      cell: row => (
        <div>
          <div className="font-bold text-gray-800">{row.student?.studentNameEnglish || "N/A"}</div>
          <div className="text-[10px] text-gray-500">{row.student?.email || ""}</div>
        </div>
      )
    },
    { 
      name: "Course", 
      selector: row => row.course?.title, 
      sortable: true,
      cell: row => <span className="font-medium text-gray-700">{row.course?.title || "-"}</span>
    },
    { 
      name: "Amount", 
      selector: row => row.amount, 
      sortable: true, 
      cell: row => <span className="font-bold text-green-600">₹ {row.amount?.toLocaleString("en-IN")}</span> 
    },
    { 
      name: "Payment ID", 
      selector: row => row.razorpayPaymentId,
      cell: row => <span className="font-mono text-xs text-gray-500">{row.razorpayPaymentId || "Manual"}</span>
    },
    { 
      name: "Status", 
      selector: row => row.status, 
      sortable: true, 
      center: true,
      cell: row => (
        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
          row.status === "success" || row.status === "paid" ? "bg-green-100 text-green-700" :
          row.status === "failed" ? "bg-red-100 text-red-700" :
          "bg-gray-100 text-gray-700"
        }`}>
          {row.status}
        </span>
      )
    },
    { 
      name: "Date", 
      selector: row => row.createdAt, 
      sortable: true, 
      cell: row => <span className="text-gray-600 font-medium">{new Date(row.createdAt).toLocaleDateString("en-GB")}</span> 
    },
    {
      name: "Action",
      center: true,
      width: "100px",
      cell: row => (
        (row.status === "success" || row.status === "paid") && (
          <button 
            onClick={() => downloadReceipt(`/payment/invoice/${row._id}`, `Receipt_${row._id}.pdf`)}
            className="text-brand-500 hover:text-brand-700 hover:bg-brand-50 p-2 rounded-lg transition-colors"
            title="Download Receipt"
          >
            <Download size={16} />
          </button>
        )
      )
    }
  ];

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4 sm:p-6 overflow-hidden">
      <CustomDataTable
        columns={columns}
        data={filtered}
        progressPending={loading}
        search={search}
        setSearch={setSearch}
        searchPlaceholder="Search by student, email, course or payment ID..."
        pagination
        additionalHeaderContent={
          <div className="flex items-center gap-2 flex-nowrap overflow-x-auto py-1">
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-700 shadow-sm cursor-pointer hover:bg-slate-100/50 transition-colors max-w-[180px] truncate"
            >
              <option value="all">All Courses</option>
              {courses.map(c => (
                <option key={c._id} value={c._id}>{c.title}</option>
              ))}
            </select>
            {selectedCourse !== "all" && (
              <button
                onClick={() => setSelectedCourse("all")}
                className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-all border border-red-100 shadow-sm shrink-0 whitespace-nowrap animate-in fade-in"
              >
                Reset Filters
              </button>
            )}
          </div>
        }
      />
    </div>
  );
};

export default OnlineCoursePayments;
