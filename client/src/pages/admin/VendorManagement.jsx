import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { toast } from "react-hot-toast";
import { Plus, Briefcase, Mail, Phone, MapPin, Building, Globe, MoreVertical, Edit, Trash2, Ban, UserCheck, X } from "lucide-react";
import ReactDOM from "react-dom";
import Loading from "../../components/Loading";
import CustomDataTable from "../../components/DataTable";

const VendorManagement = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [search, setSearch] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    companyName: "",
    contactPerson: "",
    mobile: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    website: "",
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const res = await api.get("/vendors");
      setVendors(res.data);
    } catch (error) {
      toast.error("Failed to fetch vendors");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openAddModal = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      companyName: "",
      contactPerson: "",
      mobile: "",
      street: "",
      city: "",
      state: "",
      zip: "",
      website: "",
    });
    setIsEditing(false);
    setCurrentId(null);
    setShowModal(true);
  };

  const openEditModal = (vendor) => {
    setFormData({
      name: vendor.user?.name || "",
      email: vendor.email || "",
      password: "",
      companyName: vendor.companyName || "",
      contactPerson: vendor.contactPerson || "",
      mobile: vendor.mobile || "",
      street: vendor.address?.street || "",
      city: vendor.address?.city || "",
      state: vendor.address?.state || "",
      zip: vendor.address?.zip || "",
      website: vendor.website || "",
    });
    setIsEditing(true);
    setCurrentId(vendor._id);
    setShowModal(true);
    setOpenMenuId(null);
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

  const handleDelete = async (id) => {
    setOpenMenuId(null);
    if (window.confirm("Are you sure you want to delete this vendor? This will also remove their user account.")) {
      try {
        await api.delete(`/vendors/${id}`);
        toast.success("Vendor deleted successfully");
        fetchVendors();
      } catch (error) {
        toast.error("Failed to delete vendor");
      }
    }
  };

  const handleToggleStatus = async (id) => {
    setOpenMenuId(null);
    try {
      const res = await api.patch(`/vendors/${id}/status`);
      toast.success(res.data.message);
      fetchVendors();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        companyName: formData.companyName,
        contactPerson: formData.contactPerson,
        mobile: formData.mobile,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
        },
        website: formData.website,
      };

      if (isEditing) {
        await api.put(`/vendors/${currentId}`, payload);
        toast.success("Vendor updated successfully");
      } else {
        await api.post("/vendors", payload);
        toast.success("Vendor created successfully");
      }
      
      setShowModal(false);
      fetchVendors();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error saving vendor");
    }
  };

  const filteredVendors = Array.isArray(vendors) ? vendors.filter(vendor => 
    vendor.companyName?.toLowerCase().includes(search.toLowerCase()) ||
    vendor.email?.toLowerCase().includes(search.toLowerCase()) ||
    vendor.contactPerson?.toLowerCase().includes(search.toLowerCase())
  ) : [];

  const columns = [
    {
      name: 'S.No',
      width: '70px',
      center: true,
      cell: (row, index) => (
        <span className="font-semibold text-slate-800">{index + 1}</span>
      )    
    },
    {
      name: 'Company Name',
      selector: row => row.companyName,
      sortable: true,
      cell: row => (
        <div className="flex items-center gap-3 py-2">
          <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-xs shrink-0">
            {row.companyName?.charAt(0)}
          </div>
          <div>
            <div className="font-bold text-slate-900">{row.companyName}</div>
            <div className="text-[10px] text-slate-500 truncate max-w-[150px]">{row.website}</div>
          </div>
        </div>
      ),
      width: '200px',
    },
    {
      name: 'Contact Person',
      selector: row => row.contactPerson,
      sortable: true,
      cell: row => (
        <div>
          <div className="font-medium text-slate-700 text-sm">{row.contactPerson}</div>
          <div className="text-[11px] text-slate-500">{row.mobile}</div>
        </div>
      ),
    },
    {
      name: 'Email',
      selector: row => row.email,
      sortable: true,
      cell: row => <span className="text-sm">{row.email}</span>
    },
    {
      name: 'Status',
      selector: row => row.status,
      sortable: true,
      width: '110px',
      cell: row => (
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
          row.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
        }`}>
          {row.status}
        </span>
      ),
    },
    {
      name: 'Actions',
      width: '150px', 
      center: true, 
      cell: row => (
        <div className="relative">
          <button
            onClick={(e) => toggleMenu(row._id, e)}
            className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-colors"
          >
            <MoreVertical size={18} />
          </button>
          
          {openMenuId === row._id && ReactDOM.createPortal(
            <>
              <div className="fixed inset-0 z-[9998]" onClick={() => setOpenMenuId(null)}></div>
              <div
                className="fixed w-44 bg-white rounded-xl shadow-2xl border border-slate-100 z-[9999] py-2 animate-in fade-in zoom-in-95 duration-100"
                style={{ top: menuPosition.top, left: menuPosition.left }}
              >
                <button
                  onClick={() => openEditModal(row)}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  <Edit size={16} className="text-brand-500" /> Edit Details
                </button>
                <button
                  onClick={() => handleToggleStatus(row._id)}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm ${
                    row.status === 'active' ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'
                  }`}
                >
                  {row.status === 'active' ? (
                    <><Ban size={16} /> Mark Inactive</>
                  ) : (
                    <><UserCheck size={16} /> Mark Active</>
                  )}
                </button>
                <button
                  onClick={() => handleDelete(row._id)}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-slate-50 mt-1 pt-2"
                >
                  <Trash2 size={16} /> Delete Vendor
                </button>
              </div>
            </>,
            document.body
          )}
        </div>
      ),
    }
  ];

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 flex items-center gap-2">
            <Briefcase className="text-brand-600" /> Vendor Management
          </h1>
          <p className="text-slate-500 mt-1">Manage external vendors and internship partners</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-600/20 active:scale-95"
        >
          <Plus size={20} />
          <span className="font-bold">Add Vendor</span>
        </button>
      </div>

      {/* Vendors Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 min-h-[400px]">
        <CustomDataTable
          columns={columns}
          data={filteredVendors}
          search={search}
          setSearch={setSearch}
          searchPlaceholder="Search vendors by name, email, or contact person..."
        />
      </div>

      {/* Add/Edit Vendor Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl my-8 animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  {isEditing ? "Update Vendor" : "Register New Vendor"}
                </h2>
                <p className="text-sm text-slate-500">Enter vendor and company credentials</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-full"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                <div className="space-y-4">
                    <h3 className="text-xs font-black text-brand-600 uppercase tracking-[0.2em] mb-4">Account Access</h3>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">User Full Name *</label>
                        <input
                            type="text"
                            name="name"
                            required
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all font-medium"
                            value={formData.name}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Login Email *</label>
                        <input
                            type="email"
                            name="email"
                            required
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all font-medium"
                            value={formData.email}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password {isEditing && "(Leave blank to keep current)"}</label>
                        <input
                            type="password"
                            name="password"
                            placeholder={isEditing ? "••••••••" : "Default: Vendor@123"}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all font-medium"
                            value={formData.password}
                            onChange={handleInputChange}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-xs font-black text-brand-600 uppercase tracking-[0.2em] mb-4">Company Profile</h3>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Company Name *</label>
                        <input
                            type="text"
                            name="companyName"
                            required
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all font-medium"
                            value={formData.companyName}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Contact Person</label>
                        <input
                            type="text"
                            name="contactPerson"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all font-medium"
                            value={formData.contactPerson}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mobile No.</label>
                        <input
                            type="tel"
                            name="mobile"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all font-medium"
                            value={formData.mobile}
                            onChange={handleInputChange}
                        />
                    </div>
                </div>

                <div className="space-y-4 col-span-full pt-4">
                    <h3 className="text-xs font-black text-brand-600 uppercase tracking-[0.2em] mb-4">Location & Social</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2"><MapPin size={14} /> City</label>
                            <input
                                type="text"
                                name="city"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 transition-all font-medium"
                                value={formData.city}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-2"><Globe size={14} /> Website</label>
                            <input
                                type="url"
                                name="website"
                                placeholder="https://example.com"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 transition-all font-medium"
                                value={formData.website}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>
                </div>

              </div>

              <div className="mt-12 flex justify-end gap-3 pt-8 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-8 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-10 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold shadow-lg shadow-brand-500/20 transition-all active:scale-95"
                >
                  {isEditing ? "Save Changes" : "Create Vendor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorManagement;
