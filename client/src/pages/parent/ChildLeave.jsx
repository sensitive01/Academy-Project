// ChildLeave.jsx
import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { Search } from "lucide-react";
import CustomDataTable from "../../components/common/DataTable";
import Loading from "../../components/common/Loading";

const ChildLeave = () => {
  const { user } = useAuth();
  const [leaveList, setLeaveList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (user.role === "parent") {
      fetchParentChildrenLeave();
    } else {
      fetchMyLeave();
    }
  }, []);

  useEffect(() => {
    handleSearch(searchTerm);
  }, [leaveList, searchTerm]);

  // ====================== PARENT ======================
  const fetchParentChildrenLeave = async () => {
    try {
      setLoading(true);
      const res = await api.get("/parent/children");
      const children = res.data;

      const allLeaves = [];

      for (const child of children) {
        const childRes = await api.get(
          `/parent/child/${child._id}/leave-request`
        );
        childRes.data.forEach((leave) => {
          allLeaves.push({
            childName: child.studentNameEnglish || child.firstName,
            ...leave, // startDate, endDate, reason, status, etc.
          });
        });
      }

      setLeaveList(allLeaves);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ====================== STUDENT / EMPLOYEE ======================
  const fetchMyLeave = async () => {
    try {
      setLoading(true);
      const res = await api.get("/leave/me"); // your existing endpoint
      setLeaveList(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ====================== SEARCH ======================
  const handleSearch = (term) => {
    if (!term) {
      setFilteredList(leaveList);
      return;
    }

    const filtered = leaveList.filter(
      (leave) =>
        leave.childName?.toLowerCase().includes(term.toLowerCase()) ||
        leave.reason?.toLowerCase().includes(term.toLowerCase()) ||
        (leave.startDate && leave.startDate.includes(term)) ||
        (leave.endDate && leave.endDate.includes(term))
    );

    setFilteredList(filtered);
  };

  const columns = [
    { name: 'S.No', selector: (row, i) => i + 1, width: '70px', center: true },
    ...(user.role === 'parent' ? [{ name: 'Child', selector: row => row.childName, sortable: true, cell: row => <span className="font-medium text-slate-800">{row.childName}</span> }] : []),
    { name: 'Start Date', selector: row => row.startDate, sortable: true, cell: row => row.startDate?.slice(0, 10) },
    { name: 'End Date', selector: row => row.endDate, sortable: true, cell: row => row.endDate?.slice(0, 10) },
    { name: 'Reason', selector: row => row.reason, wrap: true },
    {
      name: 'Status', selector: row => row.status, sortable: true, cell: row => (
        <span className={`px-2.5 py-1 inline-flex text-[11px] font-bold uppercase tracking-wider rounded-full ${row.status === "approved" ? "bg-green-100 text-green-800" :
            row.status === "pending" ? "bg-yellow-100 text-yellow-800" :
              "bg-red-100 text-red-800"
          }`}>
          {row.status?.charAt(0).toUpperCase() + row.status?.slice(1)}
        </span>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loading message="Fetching leave requests..." />
      </div>
    );
  }

  return (
    <div className="p-4 min-h-screen bg-gray-50">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Leave Requests</h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden pb-4">
        <CustomDataTable
          columns={columns}
          data={filteredList}
          progressPending={loading}
          pagination
          search={searchTerm}
          setSearch={setSearchTerm}
          searchPlaceholder="Search leave requests..."
        />
      </div>
    </div>
  );
};

export default ChildLeave;