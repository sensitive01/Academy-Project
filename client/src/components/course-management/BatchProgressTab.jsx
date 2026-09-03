import React, { useState, useEffect } from "react";
import { Download } from "lucide-react";
import api from "../../services/api";
import CustomDataTable from "../../components/common/DataTable";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import BatchProgressDetails from "./BatchProgressDetails";

const BatchProgressTab = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [selectedTab, setSelectedTab] = useState("total");
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("");

  useEffect(() => {
    fetchProgressData();
  }, []);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/batches/progress");
      setData(res.data);
    } catch (error) {
      console.error("Error fetching batch progress:", error);
      toast.error("Failed to load batch progress");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const exportData = data.map(item => ({
      "Batch ID": item.batchId,
      "Batch Name": item.name,
      "Course(s)": item.courseNames,
      "Total Onboarded": item.totalStudents,
      "Results Uploaded": item.uploadedCount,
      "Remaining Pending": item.remainingCount
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Batch Progress");
    XLSX.writeFile(workbook, "batch_upload_progress.xlsx");
  };

  const columns = [
    {
      name: "S.No",
      selector: (row, index) => index + 1,
      sortable: true,
      width: "90px",
      center: true
    },
    {
      name: "Batch ID",
      selector: row => row.batchId,
      sortable: true,
      cell: row => (
        <button 
          onClick={() => { setSelectedBatchId(row._id); setSelectedTab("total"); }}
          className="text-brand-600 hover:text-brand-800 hover:underline font-medium text-left"
        >
          {row.batchId}
        </button>
      )
    },
    {
      name: "Batch Name",
      selector: row => row.name,
      sortable: true,
      wrap: true,
      cell: row => (
        <button 
          onClick={() => { setSelectedBatchId(row._id); setSelectedTab("total"); }}
          className="text-brand-600 hover:text-brand-800 hover:underline font-medium text-left"
        >
          {row.name}
        </button>
      )
    },
    {
      name: "Course(s)",
      width: "230px", 
      selector: row => row.courseNames,
      sortable: true,
      wrap: true
    },
    {
      name: "Exam Name(s)",
      width: "200px",
      selector: row => row.examNames,
      sortable: true,
      wrap: true,
      cell: row => (
        <span className="font-medium text-slate-700">{row.examNames || '-'}</span>
      )
    },
    {
      name: "Total Onboarded",
      selector: row => row.totalStudents,
      sortable: true,
      center: true,
      width: "180px",
      cell: row => (
        <button 
          onClick={() => { setSelectedBatchId(row._id); setSelectedTab("total"); }}
          className="text-brand-600 hover:text-brand-800 hover:underline font-medium"
        >
          {row.totalStudents}
        </button>
      )
    },
    {
      name: "Results Uploaded",
      selector: row => row.uploadedCount,
      sortable: true,
      center: true,
      width: "180px",
      cell: row => (
        <button 
          onClick={() => { setSelectedBatchId(row._id); setSelectedTab("uploaded"); }}
          className="text-brand-600 hover:text-brand-800 hover:underline font-medium"
        >
          {row.uploadedCount}
        </button>
      )
    },
    {
      name: "Pending",
      selector: row => row.remainingCount,
      sortable: true,
      center: true,
      width: "180px",
      cell: row => (
        <button 
          onClick={() => { setSelectedBatchId(row._id); setSelectedTab("remaining"); }}
          className={`hover:underline ${row.remainingCount > 0 ? "text-amber-600 font-semibold" : "text-green-600 font-semibold"}`}
        >
          {row.remainingCount}
        </button>
      )
    }
  ];

  if (selectedBatchId) {
    return (
      <BatchProgressDetails 
        batchId={selectedBatchId} 
        initialTab={selectedTab}
        onBack={() => setSelectedBatchId(null)} 
      />
    );
  }

  const uniqueCourses = [...new Set(data.flatMap(item => item.courseNames ? item.courseNames.split(", ") : []))].filter(Boolean);

  const filteredData = data.filter(item => {
    const matchesSearch = search.toLowerCase() === "" || 
      (item.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.batchId || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.courseNames || "").toLowerCase().includes(search.toLowerCase());
      
    const matchesCourse = courseFilter === "" || (item.courseNames || "").includes(courseFilter);
    
    return matchesSearch && matchesCourse;
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Upload Progress Overview</h2>
          <p className="text-sm text-gray-500">Track result upload status across all batches</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-600 rounded-lg hover:bg-brand-100 transition-colors text-sm font-medium"
        >
          <Download size={16} />
          Export to Excel
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <CustomDataTable
          columns={columns}
          data={filteredData}
          progressPending={loading}
          searchPlaceholder="Search by batch name, ID, or course..."
          search={search}
          setSearch={setSearch}
          additionalHeaderContent={
            <select 
              value={courseFilter} 
              onChange={e => setCourseFilter(e.target.value)}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm shadow-sm"
            >
              <option value="">All Courses</option>
              {uniqueCourses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          }
        />
      </div>
    </div>
  );
};

export default BatchProgressTab;
