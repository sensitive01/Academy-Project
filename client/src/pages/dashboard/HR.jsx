import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  Ban,
  Unlock,
  Edit,
} from "lucide-react";
import AddEmployeeModal from "../../components/modals/AddEmployeeModal";
import api from "../../services/api";
import toast from "react-hot-toast";
import ReactDOM from "react-dom";
import Loading from "../../components/Loading";

import CustomDataTable from "../../components/DataTable";

const EmployeeList = ({ employees, loading, onEdit, onToggleStatus, onDelete }) => {
  const [openMenuId, setOpenMenuId] = useState(null);
  const [search, setSearch] = useState("");
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const filteredEmployees = employees.filter(emp => 
    emp.firstName?.toLowerCase().includes(search.toLowerCase()) || 
    emp.lastName?.toLowerCase().includes(search.toLowerCase()) ||
    emp.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
    emp.department?.toLowerCase().includes(search.toLowerCase())
  );

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
    { name: "Employee", selector: row => row.firstName, sortable: true, cell: row => (
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
    ), width: "220px"},
    { name: "Role / Dept", selector: row => row.department, sortable: true, cell: row => (
      <div>
        <div className="font-bold text-slate-800 capitalize text-xs tracking-tight">{row.user?.role || "Employee"}</div>
        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{row.department}</div>
      </div>
    )},
    { name: "Center", selector: row => row.center?.name, sortable: true, cell: row => (
      <div className="flex items-center gap-1.5">
        <div className="p-1 px-2 text-indigo-700 rounded-md text-[10px] font-black uppercase tracking-widest border border-indigo-100">
          {row.center?.name || "N/A"}
        </div>
      </div>
    ), width: "150px"},
    { name: "Status", selector: row => row.status, sortable: true, cell: row => (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
        row.status === "active" ? "bg-green-50 text-green-700 border-green-200" : "bg-yellow-50 text-yellow-700 border-yellow-200"
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${row.status === "active" ? "bg-green-500" : "bg-yellow-500"}`}></span>
        {row.status}
      </span>
    )},
    { name: "Contact", cell: row => (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-xs text-slate-600"><Mail size={12} className="text-slate-400"/> {row.user?.email}</div>
        <div className="flex items-center gap-2 text-xs text-slate-600"><Phone size={12} className="text-slate-400"/> {row.phone}</div>
      </div>
    ), width: "200px"},
    { name: "Joined", selector: row => row.joiningDate, sortable: true, cell: row => (
      <span className="text-slate-600 text-sm whitespace-nowrap">
        {new Date(row.joiningDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
      </span>
    )},
    { name: "Action", cell: row => (
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
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[9998]"
        onClick={() => setOpenMenuId(null)}
      ></div>

      {/* Dropdown */}
      <div
        className="fixed w-48 bg-white rounded-xl shadow-2xl border border-slate-100 z-[9999] py-2"
        style={{
          top: menuPosition.top,
          left: menuPosition.left,
        }}
      >
        <button
          onClick={() => { onEdit(row); setOpenMenuId(null); }}
          className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-slate-50"
        >
          <Edit size={16} className="text-amber-500" /> Edit Details
        </button>

        <button
          onClick={() => { onToggleStatus(row._id); setOpenMenuId(null); }}
          className={`w-full flex items-center gap-3 px-4 py-2 text-sm ${
            row.status === "active"
              ? "text-orange-600 hover:bg-orange-50"
              : "text-green-600 hover:bg-green-50"
          }`}
        >
          {row.status === "active" ? (
            <>
              <Ban size={16} /> Block Employee
            </>
          ) : (
            <>
              <Unlock size={16} /> Unblock Employee
            </>
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
    document.body   // 🔥 THIS IS THE KEY FIX
  )}
      </div>
    ), width: "90px"}
  ];


  return (
    <CustomDataTable 
      columns={columns}
      data={filteredEmployees}
      progressPending={loading}
      search={search}
      setSearch={setSearch}
      searchPlaceholder="Search employees by name, ID, or role..."
      exportButton={
        <button className="flex items-center gap-2 px-4 py-2 font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-colors">
          <Filter size={16} /> Filters
        </button>
      }
    />
  );
};

const HR = () => {
  const [activeTab, setActiveTab] = useState("employees");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [user, setUser] = useState(null);

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

  const fetchUser = async () => {
    try {
      const res = await api.get("/auth/me");
      setUser(res.data);
    } catch {
      toast.error("Failed to fetch user info");
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

  // --- Delete Handler ---
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
    fetchUser();
    fetchEmployees();
  }, []);

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

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Employee Management
          </h1>
          <p className="text-slate-500 text-sm">
            Manage your staff profiles, roles, and records.
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedEmployee(null);
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-lg font-bold shadow-lg shadow-brand-600/20 hover:bg-brand-700 transition-all"
        >
          <UserPlus size={18} />
          Add Employee
        </button>
      </div>

      {/* Quick Stats */}
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

      {/* Tab Content */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === "employees" && (
          <EmployeeList
            employees={employees}
            loading={loading}
            onRefresh={fetchEmployees}
            onEdit={handleEditInitiate}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDeleteEmployee}
          />
        )}

      </div>
    </div>
  );
};

export default HR;