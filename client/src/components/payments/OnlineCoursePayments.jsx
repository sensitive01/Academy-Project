import React, { useEffect, useState } from "react";
import api from "../../services/api";
import CustomDataTable from "../common/DataTable";
import { downloadReceipt } from "../../utils/downloadReceipt";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import ReactDOM from "react-dom";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { saveAs } from "file-saver";
import toast from "react-hot-toast";

const OnlineCoursePayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState("excel");

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

  const handleExport = () => {
    setShowExportModal(false);
    if (exportFormat === "excel") {
      const data = filtered.map((p, i) => ({
        "S.No": i + 1,
        "Student Name": p.student?.studentNameEnglish || "N/A",
        "Email": p.student?.email || "-",
        "Course": p.course?.title || "-",
        "Amount": p.amount || 0,
        "Payment ID": p.razorpayPaymentId || "Manual",
        "Status": p.status || "-",
        "Date": p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-IN") : "-"
      }));
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Payments");
      XLSX.writeFile(workbook, "Online_Course_Payments.xlsx");
      toast.success("Excel exported successfully!");
    } else {
      const doc = new jsPDF({ orientation: "landscape" });
      doc.text("Online Course Payments Report", 14, 15);
      
      const tableColumn = ["S.No", "Student Name", "Course", "Amount", "Payment ID", "Status", "Date"];
      const tableRows = [];
      filtered.forEach((p, index) => {
        const rowData = [
          index + 1,
          p.student?.studentNameEnglish || "N/A",
          p.course?.title || "-",
          p.amount ? `Rs. ${p.amount.toLocaleString("en-IN")}` : "Rs. 0",
          p.razorpayPaymentId || "Manual",
          p.status || "-",
          p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-IN") : "-"
        ];
        tableRows.push(rowData);
      });
      
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 20,
        theme: "striped",
        styles: { fontSize: 8, cellPadding: 2 }
      });
      
      const pdfBlob = doc.output("blob");
      saveAs(pdfBlob, "Online_Course_Payments.pdf");
      toast.success("PDF exported successfully!");
    }
  };

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
        exportButton={
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-200 transition-colors cursor-pointer"
          >
            <Download size={14} /> Export
          </button>
        }
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

      {/* EXPORT MODAL */}
      {showExportModal && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[10000] p-4" onClick={() => setShowExportModal(false)}>
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Export Data</h3>
            <p className="text-slate-500 text-xs mb-6">Choose your preferred format to export the filtered list.</p>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => setExportFormat("excel")}
                className={`p-4 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                  exportFormat === "excel"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-slate-100 hover:border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className={`p-2.5 rounded-xl ${exportFormat === "excel" ? "bg-emerald-500 text-white" : "bg-slate-50 text-slate-400"}`}>
                  <FileSpreadsheet size={20} />
                </div>
                <span className="text-xs font-bold">Excel (.xlsx)</span>
              </button>

              <button
                onClick={() => setExportFormat("pdf")}
                className={`p-4 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                  exportFormat === "pdf"
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-slate-100 hover:border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className={`p-2.5 rounded-xl ${exportFormat === "pdf" ? "bg-red-500 text-white" : "bg-slate-50 text-slate-400"}`}>
                  <FileText size={20} />
                </div>
                <span className="text-xs font-bold">PDF Document</span>
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-red-200 transition-all cursor-pointer"
              >
                Export
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default OnlineCoursePayments;
