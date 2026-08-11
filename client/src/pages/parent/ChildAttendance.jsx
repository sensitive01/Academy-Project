// ChildAttendance.jsx
import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { Search } from "lucide-react";
import CustomDataTable from "../../components/common/DataTable";
import Loading from "../../components/common/Loading";

const ChildAttendance = () => {
  const { user } = useAuth();
  const [attendanceList, setAttendanceList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (user.role === "parent") {
      fetchParentChildrenAttendance();
    } else {
      fetchMyAttendance();
    }
  }, []);

  useEffect(() => {
    handleSearch(searchTerm);
  }, [attendanceList, searchTerm]);

  // ====================== PARENT ======================
  const fetchParentChildrenAttendance = async () => {
    try {
      setLoading(true);
      const res = await api.get("/parent/children");
      const children = res.data;

      const allAttendance = [];

      for (const child of children) {
        const childRes = await api.get(
          `/parent/child/${child._id}/attendance`
        );
        childRes.data.forEach((att) => {
          allAttendance.push({
            childName: child.studentNameEnglish || child.firstName,
            date: att.date.slice(0, 10),
            loginTime: att.loginTime || "-",
            logoutTime: att.logoutTime || "-",
            totalHours:
              att.loginTime && att.logoutTime
                ? (
                  (new Date(`1970-01-01T${att.logoutTime}`) -
                    new Date(`1970-01-01T${att.loginTime}`)) /
                  1000 /
                  60 /
                  60
                ).toFixed(2)
                : "-",
            status: att.leave ? "Leave" : att.status || "Absent",
          });
        });
      }

      setAttendanceList(allAttendance);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ====================== STUDENT / EMPLOYEE ======================
  const fetchMyAttendance = async () => {
    try {
      setLoading(true);
      const res = await api.get("/attendance/me"); // your existing endpoint
      setAttendanceList(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ====================== SEARCH ======================
  const handleSearch = (term) => {
    if (!term) {
      setFilteredList(attendanceList);
      return;
    }

    const filtered = attendanceList.filter(
      (att) =>
        att.childName?.toLowerCase().includes(term.toLowerCase()) ||
        att.date.includes(term)
    );
    setFilteredList(filtered);
  };

  // ====================== PAGINATION ======================
  const columns = [
    { name: 'S.No', selector: (row, i) => i + 1, width: '70px', center: true },
    ...(user.role === 'parent' ? [{ name: 'Child', selector: row => row.childName, sortable: true, cell: row => <span className="font-medium text-slate-800">{row.childName}</span> }] : []),
    { name: 'Date', selector: row => row.date, sortable: true },
    { name: 'Login', selector: row => row.loginTime },
    { name: 'Logout', selector: row => row.logoutTime },
    { name: 'Hours', selector: row => row.totalHours, center: true, cell: row => <span className="font-semibold text-blue-600">{row.totalHours}</span> },
    {
      name: 'Status', selector: row => row.status, sortable: true, cell: row => (
        <span className={`px-2.5 py-1 inline-flex text-[11px] font-bold uppercase tracking-wider rounded-full ${row.status === "Present" ? "bg-green-100 text-green-700" :
            row.status === "Leave" ? "bg-yellow-100 text-yellow-700" :
              "bg-red-100 text-red-700"
          }`}>
          {row.status}
        </span>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loading message="Fetching child attendance..." />
      </div>
    );
  }

  return (
    <div className="p-4 min-h-screen bg-gray-50">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Attendance</h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden pb-4">
        <CustomDataTable
          columns={columns}
          data={filteredList}
          progressPending={loading}
          pagination
          search={searchTerm}
          setSearch={setSearchTerm}
          searchPlaceholder="Search by child name or date..."
        />
      </div>
    </div>
  );
};

export default ChildAttendance;