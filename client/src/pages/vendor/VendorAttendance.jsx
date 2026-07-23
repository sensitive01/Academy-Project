import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { toast } from "react-hot-toast";
import Loading from "../../components/Loading";
import CustomDataTable from "../../components/DataTable";

const VendorAttendance = () => {
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.get("/vendors/my-interns");
            
            // Flatten the nested data to get all attendance records with intern names
            const allAttendance = [];
            res.data.forEach(intern => {
                if (intern.attendance && Array.isArray(intern.attendance)) {
                    intern.attendance.forEach(record => {
                        allAttendance.push({
                            ...record,
                            internName: intern.name,
                            internEmail: intern.email
                        });
                    });
                }
            });
            
            setAttendanceData(allAttendance.sort((a, b) => new Date(b.date) - new Date(a.date)));
        } catch (error) {
            toast.error("Failed to fetch attendance data");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredData = attendanceData.filter(item => 
        item.internName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.internEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.status || 'Present').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const columns = [
        {
            name: 'S.No',
            selector: (row, index) => index + 1,
            sortable: true,
            width: '100px',
        },
        {
            name: 'Intern Name',
            selector: row => row.internName,
            sortable: true,
            cell: row => (
                <div>
                    <p className="font-bold text-slate-800">{row.internName}</p>
                    <p className="text-xs text-slate-500">{row.internEmail}</p>
                </div>
            )
        },
        {
            name: 'Date',
            selector: row => row.date,
            sortable: true,
            cell: row => new Date(row.date).toLocaleDateString(),
        },
        {
            name: 'Login Time',
            selector: row => row.loginTime,
            sortable: true,
            cell: row => <span className="font-medium text-slate-600">{row.loginTime}</span>
        },
        {
            name: 'Logout Time',
            selector: row => row.logoutTime,
            sortable: true,
            cell: row => <span className="font-medium text-slate-600">{row.logoutTime || '---'}</span>
        },
        {
            name: 'Status',
            selector: row => row.status || 'Present',
            sortable: true,
            cell: row => (
                <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                    (row.status || 'Present').toLowerCase() === 'present' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}>
                    {row.status || 'Present'}
                </span>
            )
        }
    ];

    if (loading) return <Loading />;

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 font-heading">Intern Attendance</h1>
                    <p className="text-slate-500 mt-1">Full attendance history for all assigned interns</p>
                </div>
            </div>

            <CustomDataTable
                columns={columns}
                data={filteredData}
                search={searchTerm}
                setSearch={setSearchTerm}
                searchPlaceholder="Search by intern name or status..."
            />
        </div>
    );
};

export default VendorAttendance;
