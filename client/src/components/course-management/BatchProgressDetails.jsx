import React, { useState, useEffect } from "react";
import { ArrowLeft, Download } from "lucide-react";
import api from "../../services/api";
import CustomDataTable from "../../components/common/DataTable";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";

const BatchProgressDetails = ({ batchId, initialTab = "total", onBack }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [data, setData] = useState({
    batch: null,
    totalStudents: [],
    uploadedStudents: [],
    remainingStudents: [],
  });

  useEffect(() => {
    fetchDetails();
  }, [batchId]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/batches/${batchId}/progress-students`);
      setData(res.data);
    } catch (error) {
      console.error("Error fetching batch details:", error);
      toast.error("Failed to load batch details");
    } finally {
      setLoading(false);
    }
  };

  const getActiveData = () => {
    let currentData = [];
    if (activeTab === "total") currentData = data.totalStudents;
    else if (activeTab === "uploaded") currentData = data.uploadedStudents;
    else currentData = data.remainingStudents;

    if (!search) return currentData;

    return currentData.filter(item => 
      (item.studentId || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.studentNameEnglish || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.centerCode || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.centerName || "").toLowerCase().includes(search.toLowerCase())
    );
  };

  const handleExport = () => {
    const exportData = getActiveData().map(item => ({
      "Student ID": item.studentId,
      "Student Name": item.studentNameEnglish,
      "Center Code": item.centerCode,
      "Center Name": item.centerName,
    }));

    if (exportData.length === 0) {
      toast.error("No data to export");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    const sheetName = activeTab === "total" ? "Total Students" : (activeTab === "uploaded" ? "Uploaded Results" : "Remaining Students");
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    const batchName = data.batch ? data.batch.name.replace(/[^a-zA-Z0-9]/g, '_') : 'Batch';
    XLSX.writeFile(workbook, `${batchName}_${sheetName.replace(/\s+/g, '_')}.xlsx`);
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
      name: "Student",
      selector: row => row.studentNameEnglish,
      sortable: true,
      wrap: true,
      cell: row => (
        <div>
          <div className="font-bold text-slate-900 uppercase">{row.studentNameEnglish}</div>
          <div className="text-xs text-slate-500">{row.studentId}</div>
        </div>
      )
    },
    {
      name: "Center",
      selector: row => row.centerName,
      sortable: true,
      wrap: true,
      cell: row => (
        <div>
          <div className="font-medium text-slate-800">{row.centerName || '-'}</div>
          <div className="text-xs text-slate-500 uppercase">{row.centerCode || '-'}</div>
        </div>
      )
    },
    {
      name: "Batch Name",
      selector: row => data.batch?.name || '-',
      sortable: true,
      wrap: true
    },
    {
      name: "Exam Name",
      selector: row => row.examName,
      sortable: true,
      cell: row => row.examName ? <span className="px-2 py-1 bg-brand-50 text-brand-700 rounded-md text-xs font-bold">{row.examName}</span> : <span className="text-slate-400 italic">Pending</span>
    }
  ];

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {data.batch ? `Progress Details: ${data.batch.name}` : 'Loading...'}
            </h2>
            <p className="text-sm text-gray-500">
              {data.batch ? `Batch ID: ${data.batch.batchId}` : '...'}
            </p>
          </div>
        </div>
        <button
          onClick={handleExport}
          disabled={loading || getActiveData().length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-600 rounded-lg hover:bg-brand-100 transition-colors text-sm font-medium disabled:opacity-50"
        >
          <Download size={16} />
          Export Current Tab
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab("total")}
            className={`flex-1 py-4 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'total' ? 'border-brand-500 text-brand-600 bg-brand-50/30' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            Total Students ({data.totalStudents.length})
          </button>
          <button
            onClick={() => setActiveTab("uploaded")}
            className={`flex-1 py-4 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'uploaded' ? 'border-brand-500 text-brand-600 bg-brand-50/30' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            Results Uploaded ({data.uploadedStudents.length})
          </button>
          <button
            onClick={() => setActiveTab("remaining")}
            className={`flex-1 py-4 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'remaining' ? 'border-amber-500 text-amber-600 bg-amber-50/30' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            Pending ({data.remainingStudents.length})
          </button>
        </div>

        <div className="p-4">
          <CustomDataTable
            columns={columns}
            data={getActiveData()}
            progressPending={loading}
            searchPlaceholder="Search by student name, ID, or center..."
            search={search}
            setSearch={setSearch}
          />
        </div>
      </div>
    </div>
  );
};

export default BatchProgressDetails;
