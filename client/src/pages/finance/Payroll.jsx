import React, { useEffect, useState, useRef } from "react";
import { Plus, ChevronDown, Download, FileSpreadsheet, FileText } from "lucide-react";
import Loading from "../../components/common/Loading";
import api from "../../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import CustomDataTable from "../../components/common/DataTable";
import ReactDOM from "react-dom";
import StudentFilterBar from "../../components/common/StudentFilterBar";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { saveAs } from "file-saver";

const Payroll = ({ hideHeader = false, internOnly = false, paidOnly = false }) => {
const { user } = useAuth();
const [payrolls, setPayrolls] = useState([]);
const [loading, setLoading] = useState(true);
const [selectedMonth, setSelectedMonth] = useState("");
const [showMonthGrid, setShowMonthGrid] = useState(false);
const [payrollFormOpen, setPayrollFormOpen] = useState(false);
const [employees, setEmployees] = useState([]);
const [selectedEmployee, setSelectedEmployee] = useState(null);
const [salaryData, setSalaryData] = useState({
adjustmentType: "",
adjustmentMonth: "",
adjustmentAmount: 0,
adjustmentNote: ""
});

const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
const [attendanceLoading, setAttendanceLoading] = useState(false);
const [attendanceSummary, setAttendanceSummary] = useState({
present: 0,
absent: 0,
remainingDays: 0
});

const [selectedAttendanceEmployee, setSelectedAttendanceEmployee] = useState(null);
const tableRef = useRef(null);
const [highlightedRow, setHighlightedRow] = useState(null);
const [searchPayroll, setSearchPayroll] = useState("");
const [attendanceData, setAttendanceData] = useState({});
const [attendanceFilter, setAttendanceFilter] = useState("all");
const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
const [selectedAdjustmentData, setSelectedAdjustmentData] = useState([]);
const [selectedAdjustmentType, setSelectedAdjustmentType] = useState("");
const [selectedAdjustmentEmployee, setSelectedAdjustmentEmployee] = useState(null);

const [payslipModalOpen, setPayslipModalOpen] = useState(false);
const [currentPayslipUrl, setCurrentPayslipUrl] = useState(null);
const [currentPayslipName, setCurrentPayslipName] = useState("");

const [selectedTableRows, setSelectedTableRows] = useState([]);
const [toggleClearRows, setToggleClearRows] = useState(false);
const [showExportModal, setShowExportModal] = useState(false);
const [exportFormat, setExportFormat] = useState("excel");
const [fromDate, setFromDate] = useState("");
const [toDate, setToDate] = useState("");
const fileInputRef = useRef(null);

const [filterType, setFilterType] = useState([]);
const [filterCenter, setFilterCenter] = useState([]);
const [filterCourse, setFilterCourse] = useState([]);
const [filterBatch, setFilterBatch] = useState([]);
const [filterYears, setFilterYears] = useState([]);
const [filterVendor, setFilterVendor] = useState([]);

const [studentsMap, setStudentsMap] = useState({});
const [centers, setCenters] = useState([]);
const [courses, setCourses] = useState([]);
const [batches, setBatches] = useState([]);
const [vendors, setVendors] = useState([]);

useEffect(() => {
  api.get("/centers").then(res => setCenters(res.data || [])).catch(() => {});
  api.get("/courses").then(res => {
    const list = res.data?.courses || res.data || [];
    setCourses(list.filter(c => c.type === "Center Courses"));
  }).catch(() => {});
  api.get("/batches").then(res => setBatches(res.data?.batches || res.data || [])).catch(() => {});
  api.get("/vendors").then(res => setVendors(res.data || [])).catch(() => {});
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

const handleRowSelected = React.useCallback(state => {
  setSelectedTableRows(state.selectedRows);
}, []);

const handleStatusUpdate = async (records, status) => {
  if (!records || records.length === 0) return;
  if (!selectedMonth) return;
  const [year, month] = selectedMonth.split("-");
  
  try {
    const payload = {
      records,
      month: Number(month),
      year: Number(year),
      status
    };
    await api.post("/payroll/bulk-status", payload, {
      headers: { Authorization: `Bearer ${user.token || localStorage.getItem('token')}` }
    });
    toast.success(`Successfully set ${records.length} records to ${status}`);
    setToggleClearRows(!toggleClearRows);
    setSelectedTableRows([]);
    await fetchPayrolls();
  } catch (err) {
    console.error(err);
    toast.error(err.response?.data?.message || err.message || "Failed to update status");
  }
};

const viewAdjustments = (employee, type) => {
  const data = (employee.adjustments || []).filter(a => a.type === type);
  setSelectedAdjustmentData(data);
  setSelectedAdjustmentType(type);
  setSelectedAdjustmentEmployee(employee);
  setAdjustmentModalOpen(true);
};

/* ==============================
FETCH EMPLOYEES
================================ */
useEffect(() => {
if (user.role === "admin" || user.role === "Hr") {
  if (internOnly) {
    api.get("/students")
      .then(res => {
        let result = res.data.students || [];
        result = result.filter(stu => stu.internships?.length > 0);
        // Map student structure to match expected employee structure in payroll if necessary
        // or just setEmployees
        setEmployees(result);
      })
      .catch(() => toast.error("Failed to fetch interns"));
  } else {
    api.get("/employees")
      .then(res => {
        let result = res.data;
        result = result.filter(emp => emp.role !== "student" && emp.role !== "admin");
        setEmployees(result);
      })
      .catch(() => toast.error("Failed to fetch employees"));
  }
} else {
setSelectedEmployee({
_id: user.id,
firstName: user.name,
lastName: ""
});
}
}, [user, internOnly]);

/* ==============================
MONTH OPTIONS
================================ */
const getMonthOptions = () => {
const options = [];
const now = new Date();
for (let i = 0; i < 12; i++) {
const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
options.push({
value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
label: d.toLocaleString("default", { month: "short", year: "numeric" })
});
}
return options.reverse();
};

/* ==============================
FETCH PAYROLLS
================================ */
const fetchPayrolls = async () => {
  if (!selectedMonth) return;
  const [year, month] = selectedMonth.split("-");
  setLoading(true);
  try {
    const res = await api.get(`/payroll/salary/all?month=${month}&year=${year}&internOnly=${internOnly}`);
    setPayrolls(res.data);
  } catch (err) {
    console.error("Failed to load payroll", err);
    toast.error("Failed to load payroll");
  }
  setLoading(false);
};

/* ==============================
DEFAULT MONTH
================================ */
useEffect(() => {
const now = new Date();
setSelectedMonth(
`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
);
}, []);

useEffect(() => {
if (selectedMonth) fetchPayrolls();
}, [selectedMonth]);

/* ==============================
OPEN ADJUSTMENT FORM
================================ */
const openPayrollForm = () => {
if (user.role === "admin") setSelectedEmployee(null);
setSalaryData(prev => ({
...prev,
adjustmentMonth: selectedMonth
}));
setPayrollFormOpen(true);
};

/* ==============================
SAVE ADJUSTMENT
================================ */
const handleSavePayroll = async () => {

if (!selectedEmployee) return toast.error(internOnly ? "Select intern student" : "Select employee");
if (!salaryData.adjustmentMonth) return toast.error("Select month");
if (!salaryData.adjustmentType) return toast.error("Select type");
if (!salaryData.adjustmentAmount) return toast.error("Enter amount");

try {
const [year, month] = salaryData.adjustmentMonth.split("-");
const internshipId = selectedEmployee.internshipId || (selectedEmployee.internships && selectedEmployee.internships[selectedEmployee.internships.length - 1]?._id);
const payload = {
employeeId: selectedEmployee._id || selectedEmployee.employeeId,
type: salaryData.adjustmentType,
month: Number(month),
year: Number(year),
amount: salaryData.adjustmentAmount,
note: salaryData.adjustmentNote || "",
internshipId: internshipId || undefined
};

await api.post("/payroll/adjustment", payload);
toast.success("Payroll adjustment saved");
await fetchPayrolls();
setHighlightedRow(selectedEmployee._id);
setTimeout(() => {
const row = document.getElementById(`row-${selectedEmployee._id}`);
if (row) {
row.scrollIntoView({
behavior: "smooth",
block: "center"
});
}
}, 100);
setPayrollFormOpen(false);
setSalaryData({
adjustmentType: "",
adjustmentMonth: selectedMonth,
adjustmentAmount: 0,
adjustmentNote: ""
});
} catch (err) {
console.error(err);
toast.error("Failed to save adjustment");
}
};

const handleBulkUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const loadToast = toast.loading("Processing bulk upload...");

  try {
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (!data || data.length === 0) {
          toast.error("Spreadsheet is empty", { id: loadToast });
          return;
        }

        const adjustments = [];
        const [year, month] = selectedMonth.split("-");

        data.forEach(row => {
          const empId = row["Intern ID"] || row["Employee ID"] || row["ID"];
          if (!empId) return;

          const allowance = Number(row["Allowance"]) || 0;
          const allowanceReason = row["Allowance Reason"] || "";
          
          const deduction = Number(row["Deduction"]) || 0;
          const deductionReason = row["Deduction Reason"] || "";

          // find the intern in filteredPayrolls to attach internshipId if available
          const currentPayroll = filteredPayrolls.find(p => p.employeeId === String(empId) || p._id === String(empId));
          const internshipId = currentPayroll?.internshipId || null;

          if (allowance > 0) {
            adjustments.push({
              employeeId: empId,
              month: Number(month),
              year: Number(year),
              type: "allowance",
              amount: allowance,
              note: allowanceReason,
              internshipId
            });
          }

          if (deduction > 0) {
            adjustments.push({
              employeeId: empId,
              month: Number(month),
              year: Number(year),
              type: "deduction",
              amount: deduction,
              note: deductionReason,
              internshipId
            });
          }
        });

        if (adjustments.length === 0) {
          toast.error("No valid allowances or deductions found in the spreadsheet.", { id: loadToast });
          return;
        }

        const res = await api.post("/payroll/bulk-adjustment", { adjustments });
        toast.success(res.data.message || "Bulk upload successful", { id: loadToast });
        await fetchPayrolls();
      } catch (err) {
        console.error("Bulk upload processing error:", err);
        toast.error("Failed to process bulk upload.", { id: loadToast });
      }
    };
    reader.readAsBinaryString(file);
  } catch (err) {
    toast.error("Failed to read file.", { id: loadToast });
  } finally {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }
};

const handleDownloadTemplate = () => {
  try {
    const templateData = filteredPayrolls.map(p => ({
      "Intern ID": p.employeeId || p._id,
      "Intern Name": p.name || "",
      "Allowance": 0,
      "Allowance Reason": "",
      "Deduction": 0,
      "Deduction Reason": ""
    }));

    if (templateData.length === 0) {
      templateData.push({
        "Intern ID": "e.g., STU001",
        "Intern Name": "e.g., John Doe",
        "Allowance": 500,
        "Allowance Reason": "Travel",
        "Deduction": 0,
        "Deduction Reason": ""
      });
    }

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    
    const colWidths = [
      { wch: 25 },
      { wch: 30 },
      { wch: 12 },
      { wch: 25 },
      { wch: 12 },
      { wch: 25 }
    ];
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

    const fileName = `Intern_Payroll_Template_${selectedMonth || "Latest"}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    toast.success("Template downloaded successfully");
  } catch (error) {
    console.error("Template generation error:", error);
    toast.error("Failed to generate template");
  }
};

/* ==============================
FETCH ATTENDANCE SUMMARY
================================ */
const fetchAttendance = async (employee, filter = "all") => {
  if (!selectedMonth) return;
  const [year, month] = selectedMonth.split("-");
  setAttendanceLoading(true);
  setSelectedAttendanceEmployee(employee);
  setAttendanceFilter(filter);

  try {
    // Fetch daily attendance for the employee
    const res = await api.get(
      `/attendance/employee/${employee.userId}/monthly?month=${Number(month)}&year=${Number(year)}`
    );
    // res.data is an array of attendance records
    setAttendanceSummary(res.data || []);
    setAttendanceModalOpen(true);
  } catch (err) {
    console.error(err);
    toast.error("Failed to fetch attendance");
  }
  setAttendanceLoading(false);
};

const calculateHours = (login, logout) => {
  const start = new Date(`1970-01-01T${login}`);
  const end = new Date(`1970-01-01T${logout}`);

  const diffMs = end - start;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}h ${minutes}m`;
};

const generatePayslip = async (payrollId, employeeName) => {
  console.log("Generating payslip for:", payrollId, employeeName);
  const toastId = toast.loading("Generating Payslip...");
  try {
    const res = await api.get(`/payroll/payslip/${payrollId}`, {
      responseType: "blob"
    });
    console.log("Response received:", res);

    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    setCurrentPayslipUrl(url);
    setCurrentPayslipName(`payslip_${employeeName || payrollId}.pdf`);
    setPayslipModalOpen(true);
    toast.success("Payslip generated successfully", { id: toastId });
  } catch (err) {
    console.error("generatePayslip error:", err.response || err);
    toast.error("Failed to generate payslip", { id: toastId });
  }
};

  const handleExport = () => {
    setShowExportModal(false);
    if (exportFormat === "excel") {
      const data = filteredPayrolls.map((p, i) => ({
        "S.No": i + 1,
        [internOnly ? "Intern Name" : "Employee Name"]: p.name || "-",
        Department: p.department || "-",
        "Basic Salary": p.basic || 0,
        "Total Days": p.totalDays || 0,
        "Present": p.present || 0,
        "Leave": p.absent || 0,
        "Late Days": p.lateDays || 0,
        "Allowances": p.allowances || 0,
        "Deductions": p.deductions || 0,
        "Advance": p.advance || 0,
        "Net Salary": p.netSalary || 0,
        Status: p.status || "process"
      }));
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Payroll");
      
      const fileName = internOnly 
        ? `Intern_Payroll_${selectedMonth}.xlsx`
        : `Employee_Payroll_${selectedMonth}.xlsx`;
        
      XLSX.writeFile(workbook, fileName);
      toast.success("Excel exported successfully!");
    } else {
      const doc = new jsPDF({ orientation: "landscape" });
      const title = internOnly 
        ? `Intern Payroll - ${selectedMonth}`
        : `Employee Payroll - ${selectedMonth}`;
      doc.text(title, 14, 15);
      
      const tableColumn = [
        "S.No",
        internOnly ? "Intern Name" : "Employee Name",
        "Dept",
        "Basic",
        "Days",
        "Present",
        "Leave",
        "Late Info",
        "Allowances",
        "Deductions",
        "Advance",
        "Net Salary",
        "Status"
      ];
      
      const tableRows = [];
      filteredPayrolls.forEach((p, index) => {
        const rowData = [
          index + 1,
          p.name || "-",
          p.department || "-",
          p.basic ? `Rs. ${p.basic.toLocaleString("en-IN")}` : "Rs. 0",
          p.totalDays || 0,
          p.present || 0,
          p.absent || 0,
          p.lateDays || 0,
          p.allowances ? `Rs. ${p.allowances.toLocaleString("en-IN")}` : "Rs. 0",
          p.deductions ? `Rs. ${p.deductions.toLocaleString("en-IN")}` : "Rs. 0",
          p.advance ? `Rs. ${p.advance.toLocaleString("en-IN")}` : "Rs. 0",
          p.netSalary ? `Rs. ${p.netSalary.toLocaleString("en-IN")}` : "Rs. 0",
          p.status || "process"
        ];
        tableRows.push(rowData);
      });
      
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 20,
        theme: "striped",
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 15 }, // S.No
          1: { cellWidth: 35 }, // Name
          2: { cellWidth: 20 }, // Dept
          3: { cellWidth: 18 }, // Basic
          4: { cellWidth: 12 }, // Days
          5: { cellWidth: 15 }, // Present
          6: { cellWidth: 15 }, // Leave
          7: { cellWidth: 15 }, // Late Info
          8: { cellWidth: 20 }, // Allowances
          9: { cellWidth: 20 }, // Deductions
          10: { cellWidth: 18 }, // Advance
          11: { cellWidth: 22 }, // Net Salary
          12: { cellWidth: 18 }  // Status
        }
      });
      
      const pdfBlob = doc.output("blob");
      const fileName = internOnly 
        ? `Intern_Payroll_${selectedMonth}.pdf`
        : `Employee_Payroll_${selectedMonth}.pdf`;
      saveAs(pdfBlob, fileName);
      toast.success("PDF exported successfully!");
    }
  };

  // --- COLUMN DEFINITIONS ---
  const payrollColumns = [
    { name: 'S.No', selector: (row, i) => i + 1, width: '70px', center: "true" },
    { 
      name: 'Employee', selector: row => row.name, sortable: true, width: '160px',
      cell: row => <div onClick={() => fetchAttendance(row, "all")} className="font-semibold text-gray-800 cursor-pointer hover:text-blue-600 truncate">{row.name}</div>
    },
    {
      name: 'Dept', selector: row => row.department, center: "true", width: '180px',
      cell: row => <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">{row.department || "-"}</span>
    },
    { name: 'Basic Salary', selector: row => row.basic, sortable: true, width:"145px", center: "true", cell: row => <div className="text-gray-700 font-medium text-center w-full"><span className="text-gray-400 mr-1">₹</span>{row.basic?.toLocaleString("en-IN") || "0"}</div> },
    { name: 'Days', selector: row => row.totalDays, center: "true", width: '80px', cell: row => <span className="text-gray-600 font-medium">{row.totalDays || "-"}</span> },
    { name: 'Present', selector: row => row.present, center: "true", width: '95px', cell: row => <div className="font-bold text-green-600 cursor-pointer hover:bg-green-50 p-1 rounded" onClick={() => fetchAttendance(row, "present")}>{row.present ?? "-"}</div> },
    { name: 'Leave', selector: row => row.absent, center: "true", width: '80px', cell: row => <div className="font-bold text-red-500 cursor-pointer hover:bg-red-50 p-1 rounded" onClick={() => fetchAttendance(row, "leave")}>{row.absent ?? "-"}</div> },
    { 
      name: 'Late Info', center: "true", width: '110px',
      cell: row => (
        <div className="flex flex-col items-center cursor-pointer hover:bg-orange-50 p-1 rounded" onClick={() => fetchAttendance(row, "all")}>
          <span className="text-xs font-semibold text-orange-600">{row.lateDays} {row.lateDays === 1 ? 'day' : 'days'}</span>
          <span className="text-[10px] text-gray-500">{row.lateTime}</span>
        </div>
      )
    },
    { name: 'Allowances', selector: row => row.allowances, center: "true", width: '130px', cell: row => <div className="font-bold text-blue-600 cursor-pointer hover:bg-blue-50 p-1 rounded text-center w-full" onClick={() => viewAdjustments(row, "allowance")}>{row.allowances > 0 ? <><span className="text-blue-300 mr-1">+ ₹</span>{row.allowances.toLocaleString("en-IN")}</> : '-'}</div> },
    { name: 'Deductions', selector: row => row.deductions, center: "true", width: '130px', cell: row => <div className="font-bold text-red-500 cursor-pointer hover:bg-red-50 p-1 rounded text-center w-full" onClick={() => viewAdjustments(row, "deduction")}>{row.deductions > 0 ? <><span className="text-red-300 mr-1">- ₹</span>{row.deductions.toLocaleString("en-IN")}</> : '-'}</div> },
    { name: 'Advance', selector: row => row.advance, center: "true", width: '100px', cell: row => <div className="font-bold text-orange-600 cursor-pointer hover:bg-orange-50 p-1 rounded text-center w-full" onClick={() => viewAdjustments(row, "advance")}>{row.advance > 0 ? <><span className="text-orange-300 mr-1">₹</span>{row.advance.toLocaleString("en-IN")}</> : '-'}</div> },
    { name: 'Net Salary', selector: row => row.netSalary, sortable: true, center: "true", width: '130px', cell: row => <div className="font-bold text-gray-800 text-center w-full"><span className="text-green-600 mr-1">₹</span><span className="text-[15px]">{row.netSalary?.toLocaleString("en-IN")}</span></div> },
    { 
      name: 'Action', center: "true", width: '120px',
      cell: row => {
        const currentStatus = row.status || "process";
        const hasBeenActedUpon = currentStatus === "processed" || currentStatus === "hold" || currentStatus === "paid";
        
        if (paidOnly) {
           return (
             <div className="flex flex-col gap-1.5 w-full items-center">
               <span className="bg-blue-100 border border-blue-300 text-blue-700 px-2 py-1 rounded text-[11px] font-bold w-full text-center">Paid</span>
               {row._id && (
                 <button className="text-brand-600 hover:text-brand-800 transition text-[10px] font-bold underline" onClick={() => generatePayslip(row._id, row.name)}>Payslip</button>
               )}
             </div>
           );
        }

        return (
          <div className="flex flex-col gap-1.5 w-full items-center">
            <select 
              value={currentStatus}
              onChange={(e) => handleStatusUpdate([{employeeId: row.employeeId || row._id, internshipId: row.internshipId}], e.target.value)}
              className={`border px-2 py-1 rounded text-[11px] font-bold w-full outline-none focus:ring-1 cursor-pointer shadow-sm text-center ${
                currentStatus === 'hold'
                  ? 'bg-orange-100 border-orange-300 text-orange-700 focus:border-orange-500 focus:ring-orange-500'
                  : currentStatus === 'processed'
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-700 focus:border-emerald-500 focus:ring-emerald-500'
                  : currentStatus === 'paid'
                  ? 'bg-blue-100 border-blue-300 text-blue-700 focus:border-blue-500 focus:ring-blue-500'
                  : 'bg-white border-gray-300 text-slate-700 focus:border-brand-500 focus:ring-brand-500'
              }`}
            >
              <option value="process">Process</option>
              <option value="processed">Processed</option>
              <option value="hold">Hold</option>
              <option value="paid">Paid</option>
            </select>
            {hasBeenActedUpon && row._id && (
              <button className="text-brand-600 hover:text-brand-800 transition text-[10px] font-bold underline" onClick={() => generatePayslip(row._id, row.name)}>Payslip</button>
            )} 
          </div>
        );
      }
    }
  ];

  const filteredPayrolls = React.useMemo(() => {
    return payrolls.filter(p => {
      if (paidOnly && p.status !== "paid") return false;

      const matchSearch = searchPayroll
        ? p.name?.toLowerCase().includes(searchPayroll.toLowerCase()) || p.department?.toLowerCase().includes(searchPayroll.toLowerCase())
        : true;
      if (!matchSearch) return false;

      if (fromDate || toDate) {
        const pDate = p.createdAt ? new Date(p.createdAt).setHours(0,0,0,0) : null;
        if (pDate) {
          if (fromDate) {
            const from = new Date(fromDate).setHours(0,0,0,0);
            if (pDate < from) return false;
          }
          if (toDate) {
            const to = new Date(toDate).setHours(23,59,59,999);
            if (pDate > to) return false;
          }
        } else {
          return false;
        }
      }

      const sProfile = studentsMap[p.employeeId] || Object.values(studentsMap).find(s => s._id === p.employeeId || s.user?._id === p.employeeId);

      if (filterVendor.length > 0) {
        const recordVendorNames = [];
        const recordVendorIds = [];

        if (p.vendorName) {
          recordVendorNames.push(p.vendorName.toLowerCase());
        }

        if (sProfile && sProfile.internships) {
          sProfile.internships.forEach(i => {
            if (i.vendorName) recordVendorNames.push(i.vendorName.toLowerCase());
            if (i.vendor) {
              if (typeof i.vendor === 'object') {
                if (i.vendor._id) recordVendorIds.push(String(i.vendor._id));
                if (i.vendor.companyName) recordVendorNames.push(i.vendor.companyName.toLowerCase());
                if (i.vendor.name) recordVendorNames.push(i.vendor.name.toLowerCase());
              } else {
                recordVendorIds.push(String(i.vendor));
              }
            }
          });
        }

        const matchVendor = filterVendor.some(val => {
          const valStr = String(val).toLowerCase();
          if (recordVendorIds.includes(String(val))) return true;
          if (recordVendorNames.some(name => name.includes(valStr) || valStr.includes(name))) return true;
          const vendorObj = vendors.find(v => String(v._id) === String(val) || (v.companyName || v.name)?.toLowerCase() === valStr);
          if (vendorObj) {
            const vName = (vendorObj.companyName || vendorObj.name || "").toLowerCase();
            if (vName && recordVendorNames.some(name => name.includes(vName) || vName.includes(name))) return true;
          }
          return false;
        });

        if (!matchVendor) return false;
      }

      if (sProfile) {
        if (filterCenter.length > 0) {
          const cId = sProfile.center?._id || sProfile.center;
          if (!cId || !filterCenter.includes(cId)) return false;
        }
        if (filterCourse.length > 0) {
          const hasCourse = sProfile.enrolledCourses?.some(ec => filterCourse.includes(ec.course?._id || ec.course)) || filterCourse.includes(sProfile.department);
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
  }, [payrolls, searchPayroll, filterCenter, filterCourse, filterBatch, filterYears, filterVendor, studentsMap, batches, vendors]);

  const attendanceColumns = attendanceFilter === "leave" ? [
    { name: 'S.No', selector: (row, i) => i + 1, width: '60px' },
    { name: 'Leave Type', selector: row => row.leaveType, cell: row => <span className="capitalize font-medium text-gray-700">{row.leaveType || "-"}</span> },
    { name: 'Reason', selector: row => row.reason, cell: row => <span className="text-gray-600">{row.reason || "-"}</span> },
    { name: 'Applied Date', selector: row => row.createdAt, cell: row => <span className="font-mono text-gray-600">{row.createdAt ? new Date(row.startDate).toLocaleDateString("en-GB") : "-"}</span> },
    { name: 'Status', selector: row => row.status, center: true, width: '120px', cell: row => <span className="px-2.5 py-1 rounded-md text-[11px] uppercase font-bold bg-green-100 text-green-700 border border-green-200">{row.status || "Approved"}</span> }
  ] : [
    { name: 'S.No', selector: (row, i) => i + 1, width: '60px' },
    { name: 'Date', selector: row => row.date || row.startDate, sortable: true, cell: row => <span className="font-mono text-gray-700 font-medium">{new Date(row.date || row.startDate).toLocaleDateString("en-GB", { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span> },
    { 
      name: 'Status', selector: row => row.type, center: true, width: '100px',
      cell: row => row.type === "leave" ? <span className="px-2.5 py-1 rounded-md text-[11px] uppercase font-bold bg-red-100 text-red-700 border border-red-200">Leave</span> : <span className="px-2.5 py-1 rounded-md text-[11px] uppercase font-bold bg-green-100 text-green-700 border border-green-200">Present</span>
    },
    { name: 'Login', selector: row => row.loginTime, center: true, cell: row => <span className="font-mono text-gray-600">{row.loginTime || "-"}</span> },
    { name: 'Logout', selector: row => row.logoutTime, center: true, cell: row => <span className="font-mono text-gray-600">{row.logoutTime || "-"}</span> },
    { name: 'Working Hours', center: true, cell: row => <span className="font-mono font-medium text-gray-800 bg-gray-50 px-2 py-1 rounded">{row.type !== "leave" && row.loginTime && row.logoutTime ? calculateHours(row.loginTime, row.logoutTime) : "-"}</span> }
  ];

  const adjustmentColumns = [
    { name: 'S.No', selector: (row, i) => i + 1, width: '80px', center: true },
    { 
      name: 'Amount', selector: row => row.amount, right: true,width:"150px", sortable: true,
      cell: row => <span className={`font-bold ${selectedAdjustmentType === "allowance" ? "text-blue-600" : selectedAdjustmentType === "deduction" ? "text-red-500" : "text-orange-600"}`}>₹{row.amount?.toLocaleString("en-IN")}</span>
    },
    { name: 'Date Added', selector: row => row.createdAt, center: true, cell: row => <span className="text-gray-500 font-mono">{new Date(row.createdAt).toLocaleDateString("en-GB")}</span> },
    { name: 'Note / Reason', selector: row => row.note, cell: row => <span className="text-gray-600">{row.note || "-"}</span> }
  ];

  /* ==============================
  UI
  ================================ */
  return (
    <div className="space-y-6">
      {/* HEADER */}
      {!hideHeader && (
      <div className="flex justify-between items-center bg-white border p-5 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-gray-600 font-semibold">Payroll Month:</span>
          <div className="relative">
            <button
              onClick={() => setShowMonthGrid(!showMonthGrid)}
              className="px-4 py-2 border rounded-lg flex items-center gap-2 bg-gray-50 hover:bg-gray-100 transition shadow-sm text-gray-800 font-medium"
            >
              {selectedMonth &&
                new Date(selectedMonth).toLocaleString("default", {
                  month: "long",
                  year: "numeric"
                })}
              <ChevronDown size={18} className="text-gray-500" />
            </button>
            {showMonthGrid && (
              <div className="absolute top-12 left-0 bg-white border shadow-xl rounded-lg p-3 grid grid-cols-3 gap-2 z-50 w-80">
                {getMonthOptions().map((m) => (
                  <button
                    key={m.value}
                    onClick={() => {
                      setSelectedMonth(m.value);
                      setShowMonthGrid(false);
                    }}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                      selectedMonth === m.value
                        ? "bg-red-600 text-white shadow-md shadow-red-200"
                        : "bg-gray-50 text-gray-700 hover:bg-red-50 hover:text-red-600"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!paidOnly && selectedTableRows.length > 0 && (
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 px-3 py-2 rounded-lg">
              <span className="text-sm font-semibold text-orange-700 mr-2">
                {selectedTableRows.length} selected
              </span>
              <button
                onClick={() => handleStatusUpdate(selectedTableRows.map(r => ({employeeId: r.employeeId || r._id, internshipId: r.internshipId})), "hold")}
                className="bg-orange-500 text-white text-xs px-3 py-1.5 rounded hover:bg-orange-600 transition shadow-sm font-bold"
              >
                Hold Selected
              </button>
              <button
                onClick={() => handleStatusUpdate(selectedTableRows.map(r => ({employeeId: r.employeeId || r._id, internshipId: r.internshipId})), "processed")}
                className="bg-brand-600 text-white text-xs px-3 py-1.5 rounded hover:bg-brand-700 transition shadow-sm font-bold"
              >
                Process Selected
              </button>
              {selectedTableRows.every(r => r.status === "processed" || r.status === "hold" || r.status === "paid") && (
                <button
                  onClick={() => handleStatusUpdate(selectedTableRows.map(r => ({employeeId: r.employeeId || r._id, internshipId: r.internshipId})), "paid")}
                  className="bg-emerald-600 text-white text-xs px-3 py-1.5 rounded hover:bg-emerald-700 transition shadow-sm font-bold"
                >
                  Paid Selected
                </button>
              )}
            </div>
          )}

          <button
            onClick={openPayrollForm}
            className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-5 py-2.5 rounded-lg hover:from-red-600 hover:to-red-700 transition shadow-md shadow-red-200 font-medium"
          >
            <Plus size={18} />
            Add Adjustment
          </button>
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleBulkUpload} 
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-slate-100 text-slate-700 px-5 py-2.5 rounded-lg hover:bg-slate-200 transition shadow-sm font-medium border border-slate-200"
          >
            <FileSpreadsheet size={18} className="text-emerald-600" />
            Bulk Upload
          </button>
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 bg-slate-100 text-slate-700 px-5 py-2.5 rounded-lg hover:bg-slate-200 transition shadow-sm font-medium border border-slate-200"
          >
            <Download size={18} className="text-blue-600" />
            Template
          </button>

        </div>
      </div>
      )}

      {/* PAYROLL TABLE */}
      {internOnly && (
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
          filterVendor={filterVendor}
          setFilterVendor={setFilterVendor}
          centers={centers}
          courses={courses}
          batches={batches}
          vendors={vendors}
          showVendor={true}
          showType={false}
        />
      )}
      <div
        ref={tableRef}
        className="bg-white border rounded-xl shadow-sm overflow-x-auto"
      >
            <CustomDataTable 
              columns={payrollColumns} 
              data={filteredPayrolls} 
              search={searchPayroll}
              setSearch={setSearchPayroll}
              searchPlaceholder="Search by name or department..."
              progressPending={loading}
              pointerOnHover={false}
              paginationPerPage={15}
              selectableRows={!paidOnly}
              onSelectedRowsChange={handleRowSelected}
              clearSelectedRows={toggleClearRows} // resets selection after bulk action
              exportButton={
                <button
                  onClick={() => setShowExportModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-200 transition-colors cursor-pointer"
                >
                  <Download size={14} /> Export
                </button>
              }
              additionalHeaderContent={
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap py-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">From:</span>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-700 shadow-sm cursor-pointer hover:bg-slate-100/50 transition-colors"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">To:</span>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-700 shadow-sm cursor-pointer hover:bg-slate-100/50 transition-colors"
                    />
                  </div>
                  {(fromDate || toDate) && (
                    <button
                      onClick={() => {
                        setFromDate("");
                        setToDate("");
                      }}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-all border border-red-100 shadow-sm shrink-0 whitespace-nowrap cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              }
            />
      </div>

      {/* ATTENDANCE MODAL */}
      {attendanceModalOpen && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[10000] p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gray-50 p-5 border-b flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Attendance Details
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Employee: <span className="font-semibold text-gray-700">{selectedAttendanceEmployee?.firstName || selectedAttendanceEmployee?.name}</span>
                  <span className="mx-2">•</span>
                  Filter: <span className="font-medium capitalize text-blue-600">{attendanceFilter}</span>
                </p>
              </div>
              <button
                onClick={() => setAttendanceModalOpen(false)}
                className="bg-white rounded-full p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition shadow-sm border"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="p-0 overflow-hidden flex-1 flex flex-col">
              {attendanceLoading ? (
                <Loading message="Syncing attendance logs..." />
              ) : (
                <div className="overflow-hidden flex-1 w-full bg-white">
                  <CustomDataTable 
                    columns={attendanceColumns} 
                    data={attendanceSummary.filter((record) => {
                      if (attendanceFilter === "present") return record.type !== "leave";
                      if (attendanceFilter === "leave") return record.type === "leave";
                      return true;
                    })}
                    pagination={false}
                  />
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ADJUSTMENT MODAL */}
      {adjustmentModalOpen && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[10000] p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="bg-gray-50 p-5 border-b flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-800 capitalize">
                  {selectedAdjustmentType}s Details
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Employee: <span className="font-semibold text-gray-700">{selectedAdjustmentEmployee?.name}</span>
                </p>
              </div>
              <button
                onClick={() => setAdjustmentModalOpen(false)}
                className="bg-white rounded-full p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition shadow-sm border"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="p-0 overflow-hidden flex-1 bg-white">
              <CustomDataTable 
                columns={adjustmentColumns} 
                data={selectedAdjustmentData}
                pagination={false}
              />
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* CREATE ADJUSTMENT PAYROLL FORM MODAL */}
      {payrollFormOpen && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[10000] p-4">
          <div className="bg-white rounded-2xl p-6 w-[450px] shadow-2xl space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">
                {internOnly ? "New Intern Payroll Adjustment" : "New Payroll Adjustment"}
              </h2>
              <button
                onClick={() => setPayrollFormOpen(false)}
                className="bg-gray-100 rounded-full p-1.5 text-gray-500 hover:bg-gray-200 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* EMPLOYEE / INTERN */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {internOnly ? "Intern Student" : "Employee"}
                </label>
                <select
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition bg-gray-50 text-gray-800 font-medium cursor-pointer"
                  value={selectedEmployee?._id || ""}
                  onChange={(e) =>
                    setSelectedEmployee(
                      employees.find((emp) => emp._id === e.target.value)
                    )
                  }
                >
                  <option value="">-- Select {internOnly ? "Intern Student" : "Employee"} --</option>
                  {employees.map((emp) => {
                    const name = emp.studentNameEnglish || emp.user?.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || "Intern Student";
                    const detail = emp.studentId ? `(${emp.studentId})` : emp.department ? `(${emp.department})` : "";
                    return (
                      <option key={emp._id} value={emp._id}>
                        {name} {detail}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* TYPE */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adjustment Type</label>
                <select
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition bg-gray-50 text-gray-800 font-medium cursor-pointer"
                  value={salaryData.adjustmentType}
                  onChange={(e) =>
                    setSalaryData({
                      ...salaryData,
                      adjustmentType: e.target.value,
                    })
                  }
                >
                  <option value="">-- Select Type --</option>
                  <option value="allowance">Allowance (+)</option>
                  <option value="deduction">Deduction (-)</option>
                  <option value="advance">Advance (-)</option>
                </select>
              </div>

              {/* AMOUNT */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-gray-500 font-medium">₹</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full border border-gray-300 pl-8 p-2.5 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition bg-gray-50 font-medium text-gray-800"
                    value={salaryData.adjustmentAmount || ""}
                    onChange={(e) =>
                      setSalaryData({
                        ...salaryData,
                        adjustmentAmount: e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              {/* NOTE */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note / Reason</label>
                <textarea
                  placeholder="Enter details..."
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition bg-gray-50 resize-none h-24 custom-scrollbar text-gray-800"
                  value={salaryData.adjustmentNote}
                  onChange={(e) =>
                    setSalaryData({
                      ...salaryData,
                      adjustmentNote: e.target.value,
                    })
                  }
                />
              </div>

              <button
                onClick={handleSavePayroll}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-red-700 active:bg-red-800 transition shadow-md shadow-red-200 mt-2"
              >
                Save Adjustment
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* PAYSLIP PREVIEW MODAL */}
      {payslipModalOpen && currentPayslipUrl && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[10000] p-4 sm:p-6">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col h-[90vh] overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Payslip Preview
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {currentPayslipName}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={currentPayslipUrl}
                  download={currentPayslipName}
                  className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-brand-700 transition"
                >
                  Download PDF
                </a>
                <button
                  onClick={() => {
                    setPayslipModalOpen(false);
                    // Revoke object URL after a delay to ensure the modal closes properly
                    setTimeout(() => URL.revokeObjectURL(currentPayslipUrl), 100);
                  }}
                  className="bg-white rounded-full p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition shadow-sm border"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
            </div>

            <div className="flex-1 w-full bg-gray-100 overflow-hidden relative">
              <iframe 
                src={currentPayslipUrl} 
                className="w-full h-full border-none"
                title="Payslip PDF"
              />
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* EXPORT MODAL */}
      {showExportModal && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[10000] p-4" onClick={() => setShowExportModal(false)}>
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Export Payroll Data</h3>
            <p className="text-slate-500 text-xs mb-6">Choose your preferred format to export the filtered payroll list.</p>
            
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

export default Payroll;