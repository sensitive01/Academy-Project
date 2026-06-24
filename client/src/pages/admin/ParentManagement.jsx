import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { UserPlus, Check, Loader2, Trash2, Users } from "lucide-react";
import toast from "react-hot-toast";
import CustomDataTable from "../../components/DataTable";
import ConfirmationModal from "../../components/modals/ConfirmationModal";

const ParentManagement = () => {
  const [parents, setParents] = useState([]);
  const [loadingParents, setLoadingParents] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedChildren, setSelectedChildren] = useState([]);
  const [showChildrenModal, setShowChildrenModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    mobile: ""
  });

  const [submitting, setSubmitting] = useState(false);
  const [searchParent, setSearchParent] = useState("");
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, id: null });

  const parentColumns = [
    { name: 'S.no', selector: (row, i) => i + 1, width: '100px', sortable: true, center: true },
    { name: 'Name', selector: row => row.name, sortable: true, cell: row => <span className="font-medium text-gray-800">{row.name}</span> },
    { name: 'Email', selector: row => row.email, sortable: true, cell: row => <span className="text-gray-600">{row.email}</span> },
    { name: 'Mobile', selector: row => row.mobile || "N/A" },
    { name: 'Actions', center: true, cell: row => (
        <div className="flex justify-center gap-2">
          <button onClick={() => fetchChildren(row._id)} className="bg-green-500 text-white px-3 py-1.5 rounded-lg shadow-sm hover:bg-green-600 transition" title="View Children">
            <Users size={16} />
          </button>
          <button onClick={() => handleDelete(row._id)} className="bg-red-500 text-white px-3 py-1.5 rounded-lg shadow-sm hover:bg-red-600 transition" title="Delete">
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  const filteredParents = parents.filter(p => p.name?.toLowerCase().includes(searchParent.toLowerCase()) || p.email?.toLowerCase().includes(searchParent.toLowerCase()) || p.mobile?.includes(searchParent));

  const childColumns = [
    { name: 'S.no', selector: (row, i) => i + 1, width: '80px', center: true },
    { name: 'Child Name', selector: row => row.studentNameEnglish, sortable: true, cell: row => <span className="font-medium text-gray-800">{row.studentNameEnglish}</span> },
    { name: 'Age', selector: row => row.age, cell: row => <span>{row.age || "N/A"}</span> }
  ];

  // Fetch all parents
  const fetchParents = async () => {
    setLoadingParents(true);
    try {
      const res = await api.get("/parent/parents");
      setParents(res.data);
    } catch (err) {
      toast.error("Failed to fetch parents");
    } finally {
      setLoadingParents(false);
    }
  };

  useEffect(() => {
    fetchParents();
  }, []);

  // Handle parent creation
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/auth/register-parent", formData);
      toast.success("Parent account created successfully!");
      setFormData({ name: "", email: "", password: "", mobile: "" });
      setShowForm(false);
      fetchParents();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create parent");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete parent
  const handleDelete = (id) => {
    setConfirmConfig({ isOpen: true, id });
  };

  const confirmParentDelete = async () => {
    const id = confirmConfig.id;
    if (!id) return;
    
    try {
      await api.delete(`/parent/parent/${id}`);
      toast.success("Parent deleted successfully");
      setParents((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete parent");
    } finally {
      setConfirmConfig({ isOpen: false, id: null });
    }
  };

  // Fetch children by parent id
  const fetchChildren = async (parentId) => {
    try {
      const res = await api.get(`/parent/parent/${parentId}`);
      setSelectedChildren(res.data || []);
      setShowChildrenModal(true);
    } catch (err) {
      toast.error("Failed to fetch children");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Parent Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-brand-700"
        >
          <UserPlus size={20} /> Add Parent
        </button>
      </div>

      {/* Parent Form */}
      {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            
            <div
              className="bg-white w-full max-w-2xl shadow-lg flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b">
                <h2 className="text-lg font-bold">Add Parent</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-500 hover:text-gray-800"
                >
                  ✕
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Parent Name</label>
                    <input
                      type="text"
                      required
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email"
                      required
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Password</label>
                    <input
                      type="password"
                      required
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Mobile</label>
                    <input
                      type="tel"
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    />
                  </div>

                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 flex items-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <Check size={18} />
                    )}
                    Create
                  </button>

                </div>
              </form>
            </div>
          </div>
        )}

       <div className="overflow-hidden bg-white rounded-xl shadow-sm border border-gray-100 pb-4">
          <CustomDataTable 
            columns={parentColumns} 
            data={filteredParents} 
            progressPending={loadingParents}
            search={searchParent}
            setSearch={setSearchParent}
            searchPlaceholder="Search parents by name, email or mobile..."
          />
        </div>

      {/* Children Modal */}
      {showChildrenModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50"
          onClick={() => setShowChildrenModal(false)}
        >
          <div
            className="bg-white rounded w-full max-w-4xl max-h-[80vh] overflow-y-auto p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Children Details</h2>
              <button
                onClick={() => setShowChildrenModal(false)}
                className="text-gray-700 px-3 py-1 rounded hover:bg-gray-200"
              >
                Close
              </button>
            </div>

            {selectedChildren.length === 0 ? (
              <p>No children found for this parent.</p>
            ) : (
              <div className="overflow-hidden bg-white border border-gray-100 rounded-xl">
                <CustomDataTable 
                  columns={childColumns}
                  data={selectedChildren}
                  pagination={false}
                />
              </div>
            )}
          </div>
        </div>
      )}
      <ConfirmationModal
        isOpen={confirmConfig.isOpen}
        title="Delete Parent Account"
        message="Are you sure you want to delete this parent? This will also remove their access to student records."
        confirmText="Delete Account"
        onConfirm={confirmParentDelete}
        onClose={() => setConfirmConfig({ isOpen: false, id: null })}
        type="danger"
      />
    </div>
  );
};

export default ParentManagement;