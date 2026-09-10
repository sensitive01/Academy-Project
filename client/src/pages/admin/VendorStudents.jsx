import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { toast } from "react-hot-toast";
import { Users, ArrowLeft } from "lucide-react";
import Loading from "../../components/common/Loading";
import CustomDataTable from "../../components/common/DataTable";

const VendorStudents = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchVendorStudents();
  }, [id]);

  const fetchVendorStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/vendors/${id}/students`);
      setStudents(res.data);
    } catch (error) {
      toast.error("Failed to fetch students for this vendor");
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = Array.isArray(students) ? students.filter(student => 
    student.studentNameEnglish?.toLowerCase().includes(search.toLowerCase()) ||
    student.email?.toLowerCase().includes(search.toLowerCase()) ||
    student.phone?.toLowerCase().includes(search.toLowerCase())
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
      name: 'Student Details',
      selector: row => row.studentNameEnglish,
      sortable: true,
      cell: row => (
        <div className="flex items-center gap-3 py-2">
          <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-xs shrink-0">
            {row.studentNameEnglish?.charAt(0)}
          </div>
          <div>
            <div className="font-bold text-slate-900">{row.studentNameEnglish}</div>
            <div className="text-[10px] text-slate-500">{row.studentId}</div>
          </div>
        </div>
      ),
      width: '250px',
    },
    {
      name: 'Contact',
      selector: row => row.phone,
      sortable: true,
      cell: row => (
        <div>
          <div className="font-medium text-slate-700 text-sm">{row.phone}</div>
          <div className="text-[11px] text-slate-500">{row.email}</div>
        </div>
      ),
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
    }
  ];

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold font-heading text-slate-900 flex items-center gap-2">
              <Users className="text-brand-600" /> Vendor's Students
            </h1>
            <p className="text-slate-500 mt-1">Students assigned to this vendor for internship</p>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 min-h-[400px]">
        <CustomDataTable
          columns={columns}
          data={filteredStudents}
          search={search}
          setSearch={setSearch}
          searchPlaceholder="Search students by name, email, or phone..."
        />
      </div>
    </div>
  );
};

export default VendorStudents;
