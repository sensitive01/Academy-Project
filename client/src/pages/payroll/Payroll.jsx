import React, { useEffect, useState, useRef } from "react";
import { Plus, ChevronDown } from "lucide-react";
import Loading from "../../components/Loading";
import api from "../../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import CustomDataTable from "../../components/DataTable";

const Payroll = ({ hideHeader = false, internOnly = false }) => {
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

const viewAdjustments = (employee, type) => {
  const data = (employee.adjustments || []).filter(a => a.type === type);
  setSelectedAdjustmentData(data);
  setSelectedAdjustmentType(type);
  setSelectedAdjustmentEmployee(employee);
  setAdjustmentModalOpen(true);
};

// fetchAttendanceSummary logic moved to backend payroll controller for performance and reliability

/* ==============================
FETCH EMPLOYEES
================================ */
useEffect(() => {
if (user.role === "admin" || user.role === "Hr") {
api.get("/employees")
.then(res => {
let result = res.data;
if (internOnly) {
  result = result.filter(emp => emp.role === "student" && emp.internships?.length > 0);
} else {
  result = result.filter(emp => emp.role !== "student" && emp.role !== "admin");
}
setEmployees(result);
})
.catch(() => toast.error("Failed to fetch employees"));
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

if (!selectedEmployee) return toast.error("Select employee");
if (!salaryData.adjustmentMonth) return toast.error("Select month");
if (!salaryData.adjustmentType) return toast.error("Select type");
if (!salaryData.adjustmentAmount) return toast.error("Enter amount");

try {
const [year, month] = salaryData.adjustmentMonth.split("-");
const payload = {
employeeId: selectedEmployee._id,
type: salaryData.adjustmentType,
month: Number(month),
year: Number(year),
amount: salaryData.adjustmentAmount,
note: salaryData.adjustmentNote || ""
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
  try {
    const res = await api.get(`/payroll/payslip/${payrollId}`, {
      responseType: "blob"
    });
    console.log("Response received:", res);

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `payslip_${employeeName || payrollId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (err) {
    console.error("generatePayslip error:", err.response || err);
    toast.error("Failed to download payslip");
  }
};

  // --- COLUMN DEFINITIONS ---
  const payrollColumns = [
    { name: 'S.No', selector: (row, i) => i + 1, width: '80px', center: true },
    { 
      name: 'Employee', selector: row => row.name, sortable: true, width: '160px',
      cell: row => <div onClick={() => fetchAttendance(row, "all")} className="font-semibold text-gray-800 cursor-pointer hover:text-blue-600 truncate">{row.name}</div>
    },
    {
      name: 'Dept', selector: row => row.department, center: true, width: '180px',
      cell: row => <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">{row.department || "-"}</span>
    },
    { name: 'Basic Salary', selector: row => row.basic, sortable: true,width:"145px", right: true, cell: row => <div className="text-gray-700 font-medium"><span className="text-gray-400 mr-1">₹</span>{row.basic?.toLocaleString("en-IN") || "0"}</div> },
    { name: 'Days', selector: row => row.totalDays, center: true, width: '80px', cell: row => <span className="text-gray-600 font-medium">{row.totalDays || "-"}</span> },
    { name: 'Present', selector: row => row.present, center: true, width: '95px', cell: row => <div className="font-bold text-green-600 cursor-pointer hover:bg-green-50 p-1 rounded" onClick={() => fetchAttendance(row, "present")}>{row.present ?? "-"}</div> },
    { name: 'Leave', selector: row => row.absent, center: true, width: '80px', cell: row => <div className="font-bold text-red-500 cursor-pointer hover:bg-red-50 p-1 rounded" onClick={() => fetchAttendance(row, "leave")}>{row.absent ?? "-"}</div> },
    { 
      name: 'Late Info', center: true, width: '110px',
      cell: row => (
        <div className="flex flex-col items-center cursor-pointer hover:bg-orange-50 p-1 rounded" onClick={() => fetchAttendance(row, "all")}>
          <span className="text-xs font-semibold text-orange-600">{row.lateDays} {row.lateDays === 1 ? 'day' : 'days'}</span>
          <span className="text-[10px] text-gray-500">{row.lateTime}</span>
        </div>
      )
    },
    { name: 'Allowances', selector: row => row.allowances, right: true, width: '130px', cell: row => <div className="font-bold text-blue-600 cursor-pointer hover:bg-blue-50 p-1 rounded" onClick={() => viewAdjustments(row, "allowance")}>{row.allowances > 0 ? <><span className="text-blue-300 mr-1">+ ₹</span>{row.allowances.toLocaleString("en-IN")}</> : '-'}</div> },
    { name: 'Deductions', selector: row => row.deductions, right: true, width: '130px', cell: row => <div className="font-bold text-red-500 cursor-pointer hover:bg-red-50 p-1 rounded" onClick={() => viewAdjustments(row, "deduction")}>{row.deductions > 0 ? <><span className="text-red-300 mr-1">- ₹</span>{row.deductions.toLocaleString("en-IN")}</> : '-'}</div> },
    { name: 'Advance', selector: row => row.advance, right: true, width: '100px', cell: row => <div className="font-bold text-orange-600 cursor-pointer hover:bg-orange-50 p-1 rounded" onClick={() => viewAdjustments(row, "advance")}>{row.advance > 0 ? <><span className="text-orange-300 mr-1">₹</span>{row.advance.toLocaleString("en-IN")}</> : '-'}</div> },
    { name: 'Net Salary', selector: row => row.netSalary, sortable: true, right: true, width: '130px', cell: row => <div className="font-bold text-gray-800"><span className="text-green-600 mr-1">₹</span><span className="text-[15px]">{row.netSalary?.toLocaleString("en-IN")}</span></div> },
    { 
      name: 'Action', center: true, width: '110px',
      cell: row => (
        <div className="flex flex-col gap-1.5 w-full items-center">
          <select className="bg-white border border-gray-300 text-slate-700 px-2 py-1 rounded text-[11px] font-bold w-full outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 cursor-pointer shadow-sm text-center">
            <option value="process">Process</option>
            <option value="hold">Hold</option>
          </select>
          {row._id && (
            <button className="text-brand-600 hover:text-brand-800 transition text-[10px] font-bold underline" onClick={() => generatePayslip(row._id, row.name)}>Payslip</button>
          )} 
        </div>
      )
    }
  ];

  const filteredPayrolls = payrolls.filter(p => p.name?.toLowerCase().includes(searchPayroll.toLowerCase()) || p.department?.toLowerCase().includes(searchPayroll.toLowerCase()));

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
                        ? "bg-brand-600 text-white shadow-md shadow-brand-200"
                        : "bg-gray-50 text-gray-700 hover:bg-brand-50 hover:text-brand-600"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={openPayrollForm}
          className="flex items-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 text-white px-5 py-2.5 rounded-lg hover:from-brand-600 hover:to-brand-700 transition shadow-md shadow-brand-200 font-medium"
        >
          <Plus size={18} />
          Add Adjustment
        </button>
      </div>
      )}

      {/* PAYROLL TABLE */}
      <div
        ref={tableRef}
        className="bg-white border rounded-xl shadow-sm overflow-hidden"
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
            />
      </div>

      {/* ATTENDANCE MODAL */}
      {attendanceModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
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
        </div>
      )}

      {/* ADJUSTMENT MODAL */}
      {adjustmentModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
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
        </div>
      )}

      {/* CREATE ADJUSTMENT PAYROLL FORM MODAL */}
      {payrollFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-[450px] shadow-2xl space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">New Payroll Adjustment</h2>
              <button
                onClick={() => setPayrollFormOpen(false)}
                className="bg-gray-100 rounded-full p-1.5 text-gray-500 hover:bg-gray-200 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* EMPLOYEE */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                <select
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-gray-50 text-gray-800 font-medium cursor-pointer"
                  value={selectedEmployee?._id || ""}
                  onChange={(e) =>
                    setSelectedEmployee(
                      employees.find((emp) => emp._id === e.target.value)
                    )
                  }
                >
                  <option value="">-- Select Employee --</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName} {emp.department ? `(${emp.department})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* TYPE */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adjustment Type</label>
                <select
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-gray-50 text-gray-800 font-medium cursor-pointer"
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
                    placeholder="0"
                    className="w-full border border-gray-300 pl-8 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-gray-50 font-medium text-gray-800"
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
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-gray-50 resize-none h-24 custom-scrollbar text-gray-800"
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
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-blue-700 active:bg-blue-800 transition shadow-md shadow-blue-200 mt-2"
              >
                Save Adjustment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payroll;