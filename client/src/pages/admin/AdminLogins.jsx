import React, { useState, useEffect } from "react";
import { 
  Users, 
  UserPlus, 
  Shield, 
  UserCheck, 
  DollarSign, 
  Truck, 
  Mail, 
  Phone, 
  MoreVertical, 
  Trash2, 
  Key,
  ShieldAlert,
  Edit,
  Eye,
  X
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import ReactDOM from "react-dom";
import CustomDataTable from "../../components/DataTable";
import Loading from "../../components/Loading";

const AdminLogins = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "sub-admin",
    mobile: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const fetchUsers = async () => { 
    try {
      setLoading(true);
      const { data } = await api.get("/auth/admin-users");
      const subAdmins = data.filter(u => u.role === "sub-admin");
      setUsers(subAdmins);
    } catch (error) {
      toast.error("Failed to fetch sub-admins");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openAddModal = () => {
    setFormData({ name: "", email: "", password: "", role: "sub-admin", mobile: "" });
    setIsEditing(false);
    setCurrentId(null);
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setFormData({
      name: user.name,
      email: user.email,
      password: "", 
      role: user.role,
      mobile: user.mobile || ""
    });
    setIsEditing(true);
    setCurrentId(user._id);
    setShowModal(true);
    setOpenMenuId(null);
  };

  const openViewModal = (user) => {
    setSelectedUser(user);
    setShowViewModal(true);
    setOpenMenuId(null);
  };

  const handleDelete = async (id) => {
    setOpenMenuId(null);
    if (window.confirm("Are you sure you want to delete this sub-admin?")) {
      try {
        await api.delete(`/auth/admin-users/${id}`);
        toast.success("Sub-admin deleted successfully");
        fetchUsers();
      } catch (error) {
        toast.error("Failed to delete sub-admin");
      }
    }
  };

  const toggleMenu = (id, event) => {
    if (openMenuId === id) {
      setOpenMenuId(null);
    } else {
      const rect = event.currentTarget.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY,
        left: rect.right - 160,
      });
      setOpenMenuId(id);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (isEditing) {
        await api.put(`/auth/admin-users/${currentId}`, formData);
        toast.success("Sub-admin updated successfully");
      } else {
        await api.post("/auth/create-admin-user", formData);
        toast.success("Sub-admin created successfully");
      }
      setShowModal(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation failed");
    } finally {
      setIsSaving(false);
    }
  };

  const columns = [
    { name: "S.No", selector: (r, i) => i + 1, width: "70px", center: true },
    {
      name: "Name",
      selector: r => r.name,
      sortable: true,
      cell: r => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-xs">
            {r.name?.charAt(0)}
          </div>
          <div className="font-medium text-slate-900">{r.name}</div>
        </div>
      )
    },
    {
      name: "Email",
      selector: r => r.email,
      sortable: true,
    },
    {
        name: "Mobile",
        selector: r => r.mobile || "N/A",
        sortable: true,
    },
    {
      name: "Actions",
      center: true,
      width: "100px",
      cell: r => (
        <div className="relative">
          <button 
            onClick={(e) => toggleMenu(r._id, e)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <MoreVertical size={20} />
          </button>
          
          {openMenuId === r._id && ReactDOM.createPortal(
            <>
              {/* Overlay */}
              <div
                className="fixed inset-0 z-[9998]"
                onClick={() => setOpenMenuId(null)}
              ></div>

              {/* Dropdown */}
              <div
                className="fixed w-40 bg-white rounded-xl shadow-2xl border border-slate-100 z-[9999] py-2 animate-in fade-in zoom-in-95 duration-100"
                style={{
                  top: menuPosition.top,
                  left: menuPosition.left,
                }}
              >
                <button 
                  onClick={() => openViewModal(r)}
                  className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Eye size={16} className="text-blue-500" /> View Details
                </button>
                <button 
                  onClick={() => openEditModal(r)}
                  className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Edit size={16} className="text-brand-500" /> Edit Profile
                </button>
                <button 
                  onClick={() => handleDelete(r._id)}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-slate-50 mt-1"
                >
                  <Trash2 size={16} /> Delete Account
                </button>
              </div>
            </>,
            document.body
          )}
        </div>
      )
    }
  ];

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sub-Admin Management</h1>
          <p className="text-sm text-slate-500">Manage sub-administrative staff and their credentials</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-brand-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-brand-700 transition-all shadow-lg shadow-brand-600/20"
        >
          <UserPlus size={20} /> Add Sub-Admin
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 min-h-[400px]">
        <CustomDataTable
          columns={columns}
          data={users}
          progressPending={loading}
          searchPlaceholder="Search by name or email..."
        />
      </div>

      {/* CREATE/EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <ShieldAlert size={20} className="text-brand-600" /> 
                {isEditing ? "Edit Sub-Admin" : "Create Sub-Admin"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number</label>
                <input
                  type="tel"
                  name="mobile"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                  value={formData.mobile}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password {isEditing && "(Leave blank to keep current)"}</label>
                <input
                  type="password"
                  name="password"
                  required={!isEditing}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                  value={formData.password}
                  onChange={handleInputChange}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-600/20 disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : (isEditing ? "Save Changes" : "Create Account")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center relative">
                <button 
                  onClick={() => setShowViewModal(false)}
                  className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
                >
                    <X size={24} />
                </button>
                
                <div className="w-20 h-20 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-3xl font-bold mx-auto mb-4 border-4 border-brand-50">
                    {selectedUser.name?.charAt(0)}
                </div>
                
                <h3 className="text-2xl font-bold text-slate-900">{selectedUser.name}</h3>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold uppercase tracking-wider mt-2">
                    <Shield size={12} /> Sub-Admin
                </div>
                
                <div className="mt-8 space-y-4 text-left">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Email Address</p>
                        <p className="text-slate-700 font-medium break-all">{selectedUser.email}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Mobile Number</p>
                        <p className="text-slate-700 font-medium">{selectedUser.mobile || "Not Provided"}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Account Created</p>
                        <p className="text-slate-700 font-medium">{new Date(selectedUser.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                    </div>
                </div>
                
                <button 
                    onClick={() => setShowViewModal(false)}
                    className="w-full mt-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
                >
                    Close Details
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLogins;
