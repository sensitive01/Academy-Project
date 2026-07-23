import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { toast } from "react-hot-toast";
import { UserCheck, CalendarDays, Watch, Search } from "lucide-react";
import Loading from "../../components/Loading";

import CustomDataTable from "../../components/DataTable";

const VendorDashboard = () => {
    const [interns, setInterns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Modal state for viewing details
    const [selectedIntern, setSelectedIntern] = useState(null);

    useEffect(() => {
        fetchMyInterns();
    }, []);

    const fetchMyInterns = async () => {
        try {
            setLoading(true);
            const res = await api.get("/vendors/my-interns");
            setInterns(res.data);
        } catch (error) {
            toast.error("Failed to fetch interns");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredInterns = Array.isArray(interns) ? interns.filter((intern) =>
        intern.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        intern.email?.toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

    const columns = [
        {
            name: 'S.No',
            selector: (row, index) => index + 1,
            sortable: true,
            width: '100px',
            cell: (row, index) => (
                <span className="font-semibold text-slate-800">{index + 1}</span>
            )
        },
        {
            name: 'Intern Details',
            selector: row => row.name,
            sortable: true,
            cell: row => (
                <div className="flex items-center gap-3 py-2">
                    <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                        {row.name?.charAt(0)}
                    </div>
                    <div>
                        <p className="font-bold text-slate-900">{row.name}</p>
                        <p className="text-xs text-slate-500">{row.email}</p>
                    </div>
                </div>
            ),
            width: '250px'
        },
        {
            name: 'Timeline',
            selector: row => row.internshipDetails?.startDate,
            sortable: true,
            cell: row => {
                const details = row.internshipDetails;
                const start = new Date(details.startDate).toLocaleDateString();
                const end = new Date(details.endDate).toLocaleDateString();
                return (
                    <div className="text-sm">
                        <p className="text-slate-900 font-medium whitespace-nowrap">Start: {start}</p>
                        <p className="text-slate-500 whitespace-nowrap">End: {end}</p>
                    </div>
                );
            }
        },
        {
            name: 'Location',
            selector: row => row.internshipDetails?.location,
            sortable: true,
            cell: row => (
                <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-full whitespace-nowrap">
                    {row.internshipDetails?.location || 'Remote'}
                </span>
            )
        },
        {
            name: 'Actions',
            cell: row => (
                <button
                    onClick={() => setSelectedIntern(row)}
                    className="px-5 py-2 bg-brand-600 border border-brand-700 text-white hover:bg-brand-700 font-bold text-xs uppercase tracking-widest rounded-lg transition-all shadow-sm shadow-brand-500/20 active:scale-95"
                >
                    View Data
                </button>
            ),
            center: true,
            width: '150px'
        }
    ];

    if (loading) return <Loading />;

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 font-heading">Vendor Dashboard</h1>
                    <p className="text-slate-500 mt-1">Manage and monitor your current interns</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Stats */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider">Active Interns</h3>
                        <p className="text-3xl font-bold text-slate-900 mt-1">{interns.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
                        <UserCheck size={24} />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider">Programs</h3>
                        <p className="text-3xl font-bold text-slate-900 mt-1">
                            {new Set(interns.map(i => i.internshipDetails?.title || 'Intern')).size}
                        </p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                        <CalendarDays size={24} />
                    </div>
                </div>
            </div>

            {/* Interns Table */}
            <CustomDataTable
                columns={columns}
                data={filteredInterns}
                search={searchTerm}
                setSearch={setSearchTerm}
                searchPlaceholder="Search interns by name or email..."
            />

            {/* Intern Details Modal */}
            {selectedIntern && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl my-8">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-xl font-bold font-heading text-slate-800">
                                Intern Data: {selectedIntern.name}
                            </h2>
                            <button
                                onClick={() => setSelectedIntern(null)}
                                className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-full"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6">
                            {/* Personal Details Section */}
                            <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
                                    <UserCheck size={20} className="text-brand-500" />
                                    Intern Personal Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                                    <div>
                                        <p className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">Full Name (English)</p>
                                        <p className="text-slate-900 font-semibold">{selectedIntern.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">Email Address</p>
                                        <p className="text-slate-900 font-semibold">{selectedIntern.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">Phone / WhatsApp</p>
                                        <p className="text-slate-900 font-semibold">{selectedIntern.phone || selectedIntern.whatsapp || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">Gender</p>
                                        <p className="text-slate-900 font-semibold capitalize">{selectedIntern.gender || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">Date of Birth</p>
                                        <p className="text-slate-900 font-semibold">{selectedIntern.dob ? new Date(selectedIntern.dob).toLocaleDateString() : 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">Father's Name</p>
                                        <p className="text-slate-900 font-semibold">{selectedIntern.fatherName || 'N/A'}</p>
                                    </div>
                                    <div className="lg:col-span-1">
                                        <p className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">Primary Address</p>
                                        <p className="text-slate-900 font-semibold">
                                            {selectedIntern.address ? 
                                                `${selectedIntern.address.village}, ${selectedIntern.address.post}, ${selectedIntern.address.taluk}, ${selectedIntern.address.district} - ${selectedIntern.address.pin}` 
                                                : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                                    <Watch size={20} className="text-brand-500" />
                                    Attendance Records
                                </h3>
                                <div className="bg-slate-50 rounded-2xl p-4 max-h-[300px] overflow-y-auto outline outline-1 outline-slate-200">
                                    {selectedIntern.attendance && selectedIntern.attendance.length > 0 ? (
                                        <div className="space-y-3">
                                            {selectedIntern.attendance.map((record) => (
                                                <div key={record._id} className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                                                    <span className="text-sm font-medium text-slate-700">
                                                        {new Date(record.date).toLocaleDateString()}
                                                    </span>
                                                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                                                        (record.status || 'Present').toLowerCase() === 'present' ? 'bg-emerald-100 text-emerald-700' :
                                                        (record.status || '').toLowerCase() === 'absent' ? 'bg-rose-100 text-rose-700' :
                                                        'bg-amber-100 text-amber-700'
                                                    }`}>
                                                        {record.status || 'Present'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-500 text-center py-4">No attendance records found during the internship period.</p>
                                    )}
                                </div>
                            </div>

                          
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                                    <CalendarDays size={20} className="text-brand-500" />
                                    Leave Applications
                                </h3>
                                <div className="bg-slate-50 rounded-2xl p-4 max-h-[300px] overflow-y-auto outline outline-1 outline-slate-200">
                                    {selectedIntern.leaves && selectedIntern.leaves.length > 0 ? (
                                        <div className="space-y-3">
                                            {selectedIntern.leaves.map((leave) => (
                                                <div key={leave._id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                                                            {leave.startDate ? new Date(leave.startDate).toLocaleDateString() : 'N/A'} - {leave.endDate ? new Date(leave.endDate).toLocaleDateString() : 'N/A'}
                                                        </span>
                                                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md ${
                                                            leave.status?.toLowerCase() === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                                            leave.status?.toLowerCase() === 'rejected' ? 'bg-rose-100 text-rose-700' :
                                                            'bg-amber-100 text-amber-700'
                                                        }`}>
                                                            {leave.status || 'Pending'}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">{leave.reason}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-500 text-center py-4">No leave requests found during the internship period.</p>
                                    )}
                                </div>
                            </div>
                            </div> */}
                        </div>

                        {/* <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 mt-2 flex justify-end">
                            <button
                                onClick={() => setSelectedIntern(null)}
                                className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-medium transition-colors"
                            >
                                Close
                            </button>
                        </div> */}
                    </div>
                </div>
            )}
        </div>
    );
};

export default VendorDashboard;
