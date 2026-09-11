import React, { useState, useEffect } from "react";
import {
  FileText,
  CheckSquare,
  Users,
  Search,
  Calendar,
  Building
} from "lucide-react";
import api from "../../services/api";
import PendingApprovalsList from "../../components/payments/PendingApprovalsList";
import BatchFeesDetail from "./BatchFeesDetail";
import CustomDataTable from "../../components/common/DataTable";

const FeesCollection = () => {
  const [activeTab, setActiveTab] = useState("fees_collection");
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedBatch, setSelectedBatch] = useState(null);

  useEffect(() => {
    if (activeTab === "fees_collection" && !selectedBatch) {
      fetchBatches();
    }
  }, [activeTab, selectedBatch]);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const res = await api.get("/batches");
      setBatches(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = {
    fees_collection: { label: "Fees Collection", icon: <FileText size={18} /> },
    approvals: { label: "Pending Approvals", icon: <CheckSquare size={18} /> },
  };

  if (selectedBatch) {
    return <BatchFeesDetail batch={selectedBatch} onBack={() => setSelectedBatch(null)} />;
  }

  const filteredBatches = batches.filter(b => 
    !search || 
    b.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.batchId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-in fade-in duration-500 max-w-full">
      {/* HEADER */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Fees Management</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Manage batch-wise fee collections and pending approvals.</p>
        </div>
      </div>

      {/* SUB-TABS */}
      <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-200 gap-8 px-2">
        {Object.keys(tabs).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 px-2 text-sm font-bold transition-colors relative whitespace-nowrap flex items-center gap-2 group ${
              activeTab === tab ? "text-brand-600" : "text-slate-400 hover:text-brand-600"
            }`}
          >
            {tabs[tab].icon}
            {tabs[tab].label}
            <div
              className={`absolute bottom-0 left-0 w-full h-1 rounded-t-full transition-colors ${
                activeTab === tab ? "bg-brand-600" : "bg-transparent group-hover:bg-brand-600"
              }`}
            />
          </button>
        ))}
      </div>

      {/* CONTENT AREA */}
      <div className="animate-in slide-in-from-bottom-2 fade-in duration-300">
        {activeTab === "approvals" && <PendingApprovalsList />}
        
        {activeTab === "fees_collection" && (
          <div className="space-y-4">

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <CustomDataTable
                columns={[
                  {
                    name: "S.No",
                    selector: (row, index) => index + 1,
                    sortable: true,
                    width: "100px",
                  },
                  {
                    name: "Batch Name",
                    selector: row => row.name,
                    sortable: true,
                    cell: row => (
                      <div className="font-bold text-brand-600 cursor-pointer hover:underline" onClick={() => setSelectedBatch(row)}>
                        {row.name}
                      </div>
                    )
                  },
                  {
                    name: "Batch ID",
                    selector: row => row.batchId,
                    sortable: true,
                    cell: row => (
                      <span className="px-2 py-1 bg-slate-50 text-slate-600 rounded-md text-[10px] font-bold border border-slate-200 whitespace-nowrap">
                        {row.batchId}
                      </span>
                    )
                  },
                  {
                    name: "Centers",
                    selector: row => row.centers?.map(c => c.name).join(', ') || "No centers",
                    sortable: true,
                  },
                  {
                    name: "Students",
                    selector: row => row.numberOfStudents || 0,
                    sortable: true,
                  },
                  {
                    name: "Period",
                    selector: row => `${row.period?.startDate || "N/A"} to ${row.period?.endDate || "N/A"}`,
                    sortable: true,
                  }
                ]}
                data={filteredBatches}
                search={search}
                setSearch={setSearch}
                searchPlaceholder="Search by batch name or Id..."
                progressPending={loading}
                noDataComponent={
                  <div className="flex flex-col justify-center items-center h-64 bg-white w-full border-b border-slate-200 gap-3">
                    <Building className="w-12 h-12 text-slate-300" />
                    <p className="text-slate-500 font-bold">No batches found</p>
                  </div>
                }
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeesCollection;