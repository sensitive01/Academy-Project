import React, { useState, useEffect } from "react";
import { Download } from "lucide-react";
import api from "../../services/api";
import CustomDataTable from "../../components/common/DataTable";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";

const BatchProgressTab = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

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
      name: "Batch ID",
      selector: row => row.batchId,
      sortable: true
    },
    {
      name: "Batch Name",
      selector: row => row.name,
      sortable: true,
      wrap: true
    },
    {
      name: "Course(s)",
      selector: row => row.courseNames,
      sortable: true,
      wrap: true
    },
    {
      name: "Total Onboarded",
      selector: row => row.totalStudents,
      sortable: true,
      center: true
    },
    {
      name: "Results Uploaded",
      selector: row => row.uploadedCount,
      sortable: true,
      center: true
    },
    {
      name: "Remaining Pending",
      selector: row => row.remainingCount,
      sortable: true,
      center: true,
      cell: row => (
        <span className={row.remainingCount > 0 ? "text-amber-600 font-semibold" : "text-green-600 font-semibold"}>
          {row.remainingCount}
        </span>
      )
    }
  ];

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
          data={data}
          loading={loading}
          searchPlaceholder="Search by batch name, ID, or course..."
        />
      </div>
    </div>
  );
};

export default BatchProgressTab;
