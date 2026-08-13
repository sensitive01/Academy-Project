import React, { useState, useEffect } from "react";
import { Users, Briefcase, CalendarCheck, DollarSign, UserCheck, Building2, Layers } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

import AddEmployeeModal from "../../components/modals/AddEmployeeModal";
import TakeAttendanceModal from "../../components/modals/TakeAttendanceModal";

import Attendance from "../../pages/attendance/Attendance";
import Payroll from "../../pages/finance/Payroll";
import LeaveRequestList from "../../components/leave/LeaveRequestList";
import DepartmentTab from "../../components/employee-management/DepartmentTab";
import DesignationTab from "../../components/employee-management/DesignationTab";
import { CheckCircle, Clock } from "lucide-react";

// Assuming EmployeeList is kept in the same file or a new one. I will just paste the EmployeeList code here so it works seamlessly.
import ReactDOM from "react-dom";
import { Mail, Phone, MoreVertical, Edit, Ban, Unlock, XCircle, Filter, RotateCcw, Download, FileSpreadsheet, FileText } from "lucide-react";
import CustomDataTable from "../../components/common/DataTable";
import { useMemo } from "react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { saveAs } from "file-saver";

const EmployeeTable = ({ employees, loading, onEdit, onToggleStatus, onDelete }) => {
  const [openMenuId, setOpenMenuId] = useState(null);
  const [search, setSearch] = useState("");
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const [selectedCenter, setSelectedCenter] = useState("all");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedRole, setSelectedRole] = useState("all");

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState("excel");

  const centerOptions = useMemo(() => {
    const centers = employees.map(emp => emp.center).filter(Boolean);
    const uniqueCenters = [];
    const seenIds = new Set();
    centers.forEach(c => {
      const id = c._id ? c._id.toString() : c.toString();
      if (!seenIds.has(id)) {
        seenIds.add(id);
        uniqueCenters.push({ id, name: c.name || `Center ${id.substring(0, 4)}` });
      }
    });
    return [
      { label: "All Centers", value: "all" },
      ...uniqueCenters.map(c => ({ label: c.name, value: c.id }))
    ];
  }, [employees]);

  const departmentOptions = useMemo(() => {
    const depts = employees.map(emp => emp.department).filter(Boolean);
    const uniqueDepts = [...new Set(depts)];
    return [
      { label: "All Departments", value: "all" },
      ...uniqueDepts.map(d => ({ label: d, value: d }))
    ];
  }, [employees]);

  const roleOptions = useMemo(() => {
    const roles = employees.map(emp => emp.user?.role).filter(Boolean);
    const uniqueRoles = [...new Set(roles)];
    return [
      { label: "All Roles", value: "all" },
      ...uniqueRoles.map(r => ({ label: r.charAt(0).toUpperCase() + r.slice(1), value: r }))
    ];
  }, [employees]);

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch =
      emp.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      emp.lastName?.toLowerCase().includes(search.toLowerCase()) ||
      emp.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
      emp.department?.toLowerCase().includes(search.toLowerCase());

    const empCenterId = emp.center?._id ? emp.center._id.toString() : emp.center ? emp.center.toString() : "";
    const matchesCenter = selectedCenter === "all" || empCenterId === selectedCenter;

    const matchesDept = selectedDept === "all" || emp.department === selectedDept;

    const matchesStatus = selectedStatus === "all" || emp.status === selectedStatus;

    const matchesRole = selectedRole === "all" || emp.user?.role === selectedRole;

    return matchesSearch && matchesCenter && matchesDept && matchesStatus && matchesRole;
  });

  const handleExport = () => {
    setShowExportModal(false);
    if (exportFormat === "excel") {
      const data = filteredEmployees.map((emp, i) => ({
        "S.No": i + 1,
        "Employee ID": emp.employeeId || "-",
        Name: `${emp.firstName} ${emp.lastName}`,
        Email: emp.user?.email || "-",
        Phone: emp.phone || "-",
        Role: emp.user?.role || "-",
        Department: emp.department || "-",
        Center: emp.center?.name || "-",
        Status: emp.status || "-",
        Joined: emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString("en-IN") : "-"
      }));
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");
      XLSX.writeFile(workbook, "Employees.xlsx");
      toast.success("Excel exported successfully!");
    } else {
      const doc = new jsPDF();
      doc.text("Employees Directory", 14, 15);
      
      const tableColumn = ["S.No", "Employee ID", "Name", "Email", "Phone", "Role", "Dept", "Center", "Status"];
      const tableRows = [];

      filteredEmployees.forEach((emp, index) => {
        const rowData = [
          index + 1,
          emp.employeeId || "-",
          `${emp.firstName} ${emp.lastName}`,
          emp.user?.email || "-",
          emp.phone || "-",
          emp.user?.role || "-",
          emp.department || "-",
          emp.center?.name || "-",
          emp.status || "-"
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
          0: { cellWidth: 10 }, // S.No
          1: { cellWidth: 22 }, // Employee ID
          2: { cellWidth: 28 }, // Name
          3: { cellWidth: 38 }, // Email
          4: { cellWidth: 22 }, // Phone
          5: { cellWidth: 18 }, // Role
          6: { cellWidth: 18 }, // Dept
          7: { cellWidth: 18 }, // Center
          8: { cellWidth: 16 }  // Status
        }
      });
      
      const pdfBlob = doc.output("blob");
      saveAs(pdfBlob, "Employees_Report.pdf");
      toast.success("PDF exported successfully!");
    }
  };

  const toggleMenu = (id, event) => {
    if (openMenuId === id) {
      setOpenMenuId(null);
    } else {
      const rect = event.currentTarget.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY,
        left: rect.right - 180,
      });
      setOpenMenuId(id);
    }
  };

  const columns = [
    { name: "S.No", selector: (row, index) => index + 1, width: "80px" },
    {
      name: "Employee", selector: row => row.firstName, sortable: true, cell: row => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 shadow-sm">
            {row.profilePic?.url ? (
              <img src={row.profilePic.url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-brand-600 font-bold bg-brand-50">
                {row.firstName?.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <div className="font-bold text-slate-900 whitespace-nowrap leading-tight">{row.firstName} {row.lastName}</div>
            <div className="text-[11px] font-medium text-slate-500">{row.employeeId}</div>
          </div>
        </div>
      ), width: "220px"
    },
    {
      name: "Role / Dept", selector: row => row.department, sortable: true, cell: row => (
        <div>
          <div className="font-bold text-slate-800 capitalize text-xs tracking-tight">{row.user?.role || "Employee"}</div>
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{row.department}</div>
        </div>
      )
    },
    {
      name: "Center", selector: row => row.center?.name, sortable: true, cell: row => (
        <div className="flex items-center gap-1.5">
          <div className="p-1 px-2 text-indigo-700 rounded-md text-[10px] font-black uppercase tracking-widest border border-indigo-100">
            {row.center?.name || "N/A"}
          </div>
        </div>
      ), width: "150px"
    },
    {
      name: "Status", selector: row => row.status, sortable: true, cell: row => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${row.status === "active" ? "bg-green-50 text-green-700 border-green-200" : "bg-yellow-50 text-yellow-700 border-yellow-200"
          }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${row.status === "active" ? "bg-green-500" : "bg-yellow-500"}`}></span>
          {row.status}
        </span>
      )
    },
    {
      name: "Contact", cell: row => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs text-slate-600"><Mail size={12} className="text-slate-400" /> {row.user?.email}</div>
          <div className="flex items-center gap-2 text-xs text-slate-600"><Phone size={12} className="text-slate-400" /> {row.phone}</div>
        </div>
      ), width: "200px"
    },
    {
      name: "Joined", selector: row => row.joiningDate, sortable: true, cell: row => (
        <span className="text-slate-600 text-sm whitespace-nowrap">
          {new Date(row.joiningDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
        </span>
      )
    },
    {
      name: "Action", cell: row => (
        <div className="relative">
          <button
            onClick={(e) => toggleMenu(row._id, e)}
            className="p-2 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors border shadow-sm ml-auto block"
          >
            <MoreVertical size={16} />
          </button>
          {openMenuId === row._id &&
            ReactDOM.createPortal(
              <>
                <div className="fixed inset-0 z-[9998]" onClick={() => setOpenMenuId(null)}></div>
                <div
                  className="fixed w-48 bg-white rounded-xl shadow-2xl border border-slate-100 z-[9999] py-2"
                  style={{ top: menuPosition.top, left: menuPosition.left }}
                >
                  <button
                    onClick={() => { onEdit(row); setOpenMenuId(null); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-slate-50"
                  >
                    <Edit size={16} className="text-amber-500" /> Edit Details
                  </button>

                  <button
                    onClick={() => { onToggleStatus(row._id); setOpenMenuId(null); }}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm ${row.status === "active"
                        ? "text-orange-600 hover:bg-orange-50"
                        : "text-green-600 hover:bg-green-50"
                      }`}
                  >
                    {row.status === "active" ? (
                      <><Ban size={16} /> Block Employee</>
                    ) : (
                      <><Unlock size={16} /> Unblock Employee</>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm(`Delete ${row.firstName}?`)) {
                        onDelete(row._id);
                        setOpenMenuId(null);
                      }
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <XCircle size={16} /> Delete Employee
                  </button>
                </div>
              </>,
              document.body
            )}
        </div>
      ), width: "90px"
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden pb-4">
      <CustomDataTable
        columns={columns}
        data={filteredEmployees}
        progressPending={loading}
        search={search}
        setSearch={setSearch}
        searchPlaceholder="Search employees by name, ID, or role..."
        additionalHeaderContent={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCenter}
              onChange={(e) => setSelectedCenter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-700 shadow-sm cursor-pointer hover:bg-slate-100/50 transition-colors"
            >
              {centerOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-700 shadow-sm cursor-pointer hover:bg-slate-100/50 transition-colors"
            >
              {departmentOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-700 shadow-sm cursor-pointer hover:bg-slate-100/50 transition-colors"
            >
              {roleOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-700 shadow-sm cursor-pointer hover:bg-slate-100/50 transition-colors"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Blocked</option>
            </select>

            {(selectedCenter !== "all" || selectedDept !== "all" || selectedStatus !== "all" || selectedRole !== "all") && (
              <button
                onClick={() => {
                  setSelectedCenter("all");
                  setSelectedDept("all");
                  setSelectedStatus("all");
                  setSelectedRole("all");
                  setSearch("");
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title="Reset Filters"
              >
                <RotateCcw size={14} />
              </button>
            )}

            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/10 transition-colors cursor-pointer"
            >
              <Download size={14} /> Export
            </button>
          </div>
        }
      />

      {showExportModal && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[10000] p-4" onClick={() => setShowExportModal(false)}>
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 animate-out fade-out" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Export Data</h3>
            <p className="text-slate-500 text-xs mb-6">Choose your preferred format to export the filtered employee list.</p>
            
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
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-brand-600/20 transition-all"
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


const EmployeeManagement = () => {
  const [activeTab, setActiveTab] = useState("employee");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await api.get("/employees");
      setEmployees(res.data);
    } catch {
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await api.patch(`/employees/${id}/status`);
      toast.success(res.data.message);
      fetchEmployees();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleEditInitiate = (employee) => {
    setSelectedEmployee(employee);
    setIsAddModalOpen(true);
  };

  const handleDeleteEmployee = async (id) => {
    try {
      await api.delete(`/employees/${id}`);
      toast.success("Employee deleted successfully");
      fetchEmployees();
    } catch {
      toast.error("Failed to delete employee");
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const tabs = [
    { id: "employee", label: "Employee", icon: <Users size={18} /> },
    { id: "coach", label: "Coach", icon: <Briefcase size={18} /> },
    { id: "attendance", label: "Attendance", icon: <CalendarCheck size={18} /> },
    { id: "payroll", label: "Payroll", icon: <DollarSign size={18} /> },
    { id: "leave", label: "Leave", icon: <UserCheck size={18} /> },
    { id: "department", label: "Department", icon: <Building2 size={18} /> },
    { id: "designation", label: "Designation", icon: <Layers size={18} /> },
  ];

  return (
    <div className="space-y-6">
      <AddEmployeeModal
        isOpen={isAddModalOpen}
        employee={selectedEmployee}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedEmployee(null);
          fetchEmployees();
        }}
      />
      <TakeAttendanceModal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
      />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
          <p className="text-sm text-gray-500">Manage staff profiles, attendance, payroll, and configs</p>
        </div>
        <div className="flex gap-3">
          {activeTab === "employee" && (
            <button
              onClick={() => {
                setSelectedEmployee(null);
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-lg font-bold shadow-lg shadow-brand-600/20 hover:bg-brand-700 transition-all"
            >
              <UserCheck size={18} />
              Add Employee
            </button>
          )}
          {activeTab === "attendance" && (
            <button
              onClick={() => setIsAttendanceModalOpen(true)}
              className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-lg font-bold shadow-lg shadow-brand-600/20 hover:bg-brand-700 transition-all"
            >
              <CalendarCheck size={18} />
              Mark Attendance
            </button>
          )}
        </div>
      </div>

      {/* Quick Stats (Only show on Employee and Coach tabs) */}
      {(activeTab === "employee" || activeTab === "coach") && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Total Employees", value: employees.length, icon: Users, color: "blue" },
            {
              label: "Active Staff",
              value: employees.filter((e) => e.status === "active").length,
              icon: CheckCircle,
              color: "green",
            },
            {
              label: "Total Roles",
              value: [...new Set(employees.map((e) => e.user?.role))].length,
              icon: Clock,
              color: "orange",
            },
            {
              label: "Dept. Count",
              value: [...new Set(employees.map((e) => e.department))].length,
              icon: Briefcase,
              color: "purple",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between"
            >
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg bg-${stat.color}-50 text-${stat.color}-600`}>
                <stat.icon size={20} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs UI */}
      <div className="flex border-b border-gray-200 gap-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-4 px-2 text-sm font-bold flex items-center gap-2 transition-colors relative whitespace-nowrap group ${
              activeTab === tab.id
                ? "text-brand-600"
                : "text-gray-500 hover:text-brand-600"
            }`}
          >
            {tab.icon}
            {tab.label}
            <div className={`absolute bottom-0 left-0 w-full h-0.5 rounded-t-full transition-colors ${
              activeTab === tab.id ? "bg-brand-600" : "bg-transparent group-hover:bg-brand-600"
            }`} />
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "employee" && (
          <EmployeeTable
            employees={employees.filter(e => e.user?.role?.toLowerCase() !== "coach")}
            loading={loading}
            onEdit={handleEditInitiate}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDeleteEmployee}
          />
        )}
        {activeTab === "coach" && (
          <EmployeeTable
            employees={employees.filter(e => e.user?.role?.toLowerCase() === "coach")}
            loading={loading}
            onEdit={handleEditInitiate}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDeleteEmployee}
          />
        )}
        {activeTab === "attendance" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 overflow-hidden">
             <Attendance employeeOnly={true} hideHeader={true} />
          </div>
        )}
        {activeTab === "payroll" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 overflow-hidden">
             <Payroll />
          </div>
        )}
        {activeTab === "leave" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 overflow-hidden">
             <LeaveRequestList showApplyButton={true} onlyMine={false} />
          </div>
        )}
        {activeTab === "department" && <DepartmentTab />}
        {activeTab === "designation" && <DesignationTab />}
      </div>
    </div>
  );
};

export default EmployeeManagement;