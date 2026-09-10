import React, { useState, useEffect } from "react";
import { XCircle, Plus } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import ReactDOM from "react-dom";
import { useAuth } from "../../context/AuthContext";
import Select from "react-select";

const AddExpenseModal = ({ isOpen, onClose, onAdded, defaultCategory = "" }) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(defaultCategory);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [submittedBy, setSubmittedBy] = useState("");
  const { user } = useAuth();

  const isPrivileged = user?.role === "admin" || user?.role === "finance";

  useEffect(() => {
    if (isOpen && isPrivileged) {
      const fetchEmployees = async () => {
        try {
          const res = await api.get("/employees");
          setEmployees(res.data.filter(emp => emp.status === "active"));
        } catch (err) {
          console.error("Failed to fetch employees", err);
        }
      };
      fetchEmployees();
    }
  }, [isOpen, isPrivileged]);

  /* ================= RESET ================= */
  const resetForm = () => {
    setTitle("");
    setCategory(defaultCategory);
    setAmount("");
    setDescription("");
    setDate(new Date().toISOString().split("T")[0]);
    setReceipt(null);
    setSubmittedBy("");
  };

  /* ================= FILE VALIDATION ================= */
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPG, PNG or PDF allowed");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5MB");
      return;
    }

    setReceipt(file);
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // prevent double submission

    if (!title.trim() || !category.trim()) {
      toast.error("Title and Category are required");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("category", category.trim());
      formData.append("amount", Number(amount));
      formData.append("description", description.trim());
      formData.append("date", date);

      if (receipt) {
        formData.append("receipt", receipt);
      }
      if (isPrivileged && submittedBy) {
        formData.append("submittedBy", submittedBy);
      }

      await api.post("/expenses", formData);

      toast.success("Expense added successfully!");
      onAdded?.();
      resetForm();
      onClose();
    } catch (err) {
      if (err.response?.data?.errors) {
        const firstError = Object.values(err.response.data.errors)[0];
        toast.error(firstError || "Validation failed");
      } else {
        toast.error(err.response?.data?.message || "Failed to add expense");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 bg-black/40 z-[10000] flex justify-center items-center"
      onClick={() => {
        resetForm();
        onClose();
      }}
    >
      <div
        className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={() => {
            resetForm();
            onClose();
          }}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <XCircle size={22} />
        </button>

        <h2 className="text-lg font-bold mb-4 text-slate-800">
          Add Expense
        </h2>

        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          {/* Title */}
          <input
            type="text"
            placeholder="Expense Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            required
          />

          {/* Category */}
          {defaultCategory !== "Rent" && (
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            >
              <option value="">Select Category</option>
              <option value="Travel">Travel</option>
              <option value="Food">Food</option>
              <option value="Accommodation">Accommodation</option>
              <option value="Office Supplies">Office Supplies</option>
              <option value="Medical">Medical</option>
              <option value="Other">Other</option>
            </select>
          )}

          {/* Assign to Employee (Admin/Finance Only) */}
          {isPrivileged && (
            <div className="flex flex-col gap-1">
              <Select
                options={[
                  { value: user?._id || user?.id, label: `${user?.name || 'Admin'} (Self)` },
                  ...employees.map((emp) => ({
                    value: emp.user?._id || emp.user,
                    label: `${emp.firstName} ${emp.lastName} (${emp.department})`
                  }))
                ]}
                value={
                  submittedBy
                    ? {
                        value: submittedBy,
                        label: (() => {
                          if (submittedBy === (user?._id || user?.id)) return `${user?.name || 'Admin'} (Self)`;
                          const emp = employees.find(e => (e.user?._id || e.user) === submittedBy);
                          return emp ? `${emp.firstName} ${emp.lastName} (${emp.department})` : "";
                        })()
                      }
                    : null
                }
                onChange={(option) => setSubmittedBy(option ? option.value : "")}
                placeholder="-- Search Employee --"
                isClearable
                isSearchable
                styles={{
                  control: (base) => ({
                    ...base,
                    borderRadius: "0.5rem",
                    borderColor: "#e2e8f0",
                    minHeight: "42px",
                    "&:hover": { borderColor: "#ef4444" },
                    boxShadow: "none"
                  })
                }}
              />
              {submittedBy && (() => {
                const emp = employees.find(e => (e.user?._id || e.user) === submittedBy);
                if (emp && emp.center) {
                  const centerName = emp.center.name || emp.center.centerName || (typeof emp.center === 'string' ? emp.center : "Assigned");
                  return (
                    <div className="mt-2">
                      <input
                        type="text"
                        value={`Center: ${centerName}`}
                        disabled
                        className="w-full border px-3 py-2 rounded-lg bg-slate-50 text-slate-500 font-semibold cursor-not-allowed"
                      />
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}

          {/* Amount */}
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="1"
            className="border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            required
          />

          {/* Date */}
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />

          {/* Description */}
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="3"
            className="border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />

          {/* Receipt */}
          <input
            type="file"
            onChange={handleFileChange}
            className="border px-3 py-2 rounded-lg"
            accept=".jpg,.jpeg,.png,.pdf"
          />

          {receipt && (
            <p className="text-xs text-slate-500">
              Selected: {receipt.name}
            </p>
          )}

          {/* Buttons */}
          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
              disabled={loading}
              className="w-full border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-semibold hover:bg-slate-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700"
            >
              <Plus size={16} />
              {loading ? "Adding..." : "Add Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default AddExpenseModal;