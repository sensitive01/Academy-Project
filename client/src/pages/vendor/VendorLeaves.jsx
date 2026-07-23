import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { toast } from "react-hot-toast";
import Loading from "../../components/Loading";
import CustomDataTable from "../../components/DataTable";

const VendorLeaves = () => {
    const [leaveData, setLeaveData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.get("/vendors/my-interns");
            
            // Flatten the nested data to get all leave records with intern names
            const allLeaves = [];
            res.data.forEach(intern => {
                if (intern.leaves && Array.isArray(intern.leaves)) {
                    intern.leaves.forEach(record => {
                        allLeaves.push({
                            ...record,
                            internName: intern.name,
                            internEmail: intern.email
                        });
                    });
                }
            });
            
            setLeaveData(allLeaves.sort((a, b) => new Date(b.startDate) - new Date(a.startDate)));
        } catch (error) {
            toast.error("Failed to fetch leave data");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredData = leaveData.filter(item => 
        item.internName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.internEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.leaveType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.status.toLowerCase().includes(searchTerm.toLowerCase())
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
            name: 'Type',
            selector: row => row.leaveType,
            sortable: true,
            cell: row => <span className="font-semibold text-slate-700">{row.leaveType}</span>
        },
        {
            name: 'Period',
            selector: row => row.startDate,
            sortable: true,
            cell: row => (
                <div className="text-sm">
                    <p className="text-slate-900 font-medium">From: {new Date(row.startDate).toLocaleDateString()}</p>
                    <p className="text-slate-500">To: {new Date(row.endDate).toLocaleDateString()}</p>
                </div>
            )
        },
        {
            name: 'Reason',
            selector: row => row.reason,
            sortable: false,
            cell: row => <p className="text-slate-600 truncate max-w-[200px]" title={row.reason}>{row.reason}</p>
        },
        {
            name: 'Status',
            selector: row => row.status,
            sortable: true,
            cell: row => (
                <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                    row.status?.toLowerCase() === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                    row.status?.toLowerCase() === 'rejected' ? 'bg-rose-100 text-rose-700' :
                    'bg-amber-100 text-amber-700'
                }`}>
                    {row.status || 'Pending'}
                </span>
            )
        }
    ];

    if (loading) return <Loading />;

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 font-heading">Leave Applications</h1>
                    <p className="text-slate-500 mt-1">Review and track leave requests from your interns</p>
                </div>
            </div>

            <CustomDataTable
                columns={columns}
                data={filteredData}
                search={searchTerm}
                setSearch={setSearchTerm}
                searchPlaceholder="Search by name, type or status..."
            />
        </div>
    );
};

export default VendorLeaves;
