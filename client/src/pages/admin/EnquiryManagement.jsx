import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { toast } from "react-hot-toast";
import { 
  Mail, 
  Phone, 
  User, 
  Calendar, 
  Trash2, 
  Eye, 
  CheckCircle, 
  Clock, 
  MessageSquare,
  Filter,
  MoreVertical,
  X,
  FileText
} from "lucide-react";
import Loading from "../../components/Loading";
import CustomDataTable from "../../components/DataTable";

const EnquiryManagement = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const stats = {
    total: enquiries.length,
    new: enquiries.filter(e => e.status === 'new').length,
    contacted: enquiries.filter(e => e.status === 'contacted').length,
    resolved: enquiries.filter(e => e.status === 'resolved').length,
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const res = await api.get("/enquiries");
      setEnquiries(res.data);
    } catch (error) {
      toast.error("Failed to fetch enquiries");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await api.put(`/enquiries/${id}`, { status: newStatus });
      toast.success(`Enquiry marked as ${newStatus}`);
      fetchEnquiries();
      if (selectedEnquiry && selectedEnquiry._id === id) {
        setSelectedEnquiry({ ...selectedEnquiry, status: newStatus });
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleDeleteEnquiry = async (id) => {
    if (!window.confirm("Are you sure you want to delete this enquiry?")) return;
    try {
      await api.delete(`/enquiries/${id}`);
      toast.success("Enquiry deleted successfully");
      fetchEnquiries();
      if (selectedEnquiry && selectedEnquiry._id === id) {
        setShowDetailModal(false);
      }
    } catch (error) {
      toast.error("Failed to delete enquiry");
    }
  };

  const statsData = [
    { label: 'Total Enquiries', value: stats.total, color: 'text-white', bg: 'bg-slate-900', icon: <FileText className="opacity-20" size={40} /> },
    { label: 'New Lead', value: stats.new, color: 'text-white', bg: 'bg-blue-600', icon: <Clock className="opacity-20" size={40} /> },
    { label: 'Contacted', value: stats.contacted, color: 'text-white', bg: 'bg-amber-500', icon: <Phone className="opacity-20" size={40} /> },
    { label: 'Resolved', value: stats.resolved, color: 'text-white', bg: 'bg-emerald-600', icon: <CheckCircle className="opacity-20" size={40} /> }
  ];

  const filteredEnquiries = enquiries.filter(enquiry => {
    const matchesSearch = 
      enquiry.name?.toLowerCase().includes(search.toLowerCase()) ||
      enquiry.email?.toLowerCase().includes(search.toLowerCase()) ||
      enquiry.phone?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || enquiry.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      name: 'S.No',
      selector: (row, index) => index + 1,
      width: '80px',
      cell: (row, index) => (
        <div className="text-slate-500 font-bold">{index + 1}.</div>
      )
    },
    {
      name: 'Enquirer Details',
      selector: row => row.name,
      sortable: true,
      width: '350px',
      cell: row => (
        <div className="flex items-center gap-3 py-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center font-black text-sm shrink-0 border border-slate-200">
            {row.name?.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <div className="font-black text-slate-900 truncate uppercase text-xs tracking-wide">{row.name}</div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Mail size={12} className="text-slate-400" /> {row.email || 'N/A'}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Phone size={12} className="text-slate-400" /> {row.phone}
            </div>
          </div>
        </div>
      )
    },
    {
      name: 'Enquiry Message',
      selector: row => row.message,
      sortable: false,
      width: '300px',
      cell: row => (
        <div className="py-2 max-w-md">
          <div className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-medium">
            "{row.message}"
          </div>
        </div>
      )
    },
    {
      name: 'Date',
      selector: row => row.createdAt,
      sortable: true,
      width: '150px',
      cell: row => (
        <div className="flex flex-col">
          <span className="text-slate-900 font-bold">
            {new Date(row.createdAt).toLocaleDateString()}
          </span>
          <span className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">
            {new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      )
    },
    {
      name: 'Status',
      selector: row => row.status,
      sortable: true,
      width: '130px',
      cell: row => {
        const styles = {
          new: "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100",
          contacted: "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-100",
          resolved: "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-100"
        };
        return (
          <span className={`px-3 py-1 rounded-lg text-[10px] font-black border uppercase tracking-wider ${styles[row.status]}`}>
            {row.status}
          </span>
        );
      }
    },
    {
      name: 'Actions',
      width: '120px',
      cell: row => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setSelectedEnquiry(row);
              setShowDetailModal(true);
            }}
            className="p-2.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all"
            title="View Details"
          >
            <Eye size={20} />
          </button>
          
          <div className="relative group">
            <button className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all">
              <MoreVertical size={20} />
            </button>
            <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block z-20 w-48 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden p-1">
                {row.status !== 'contacted' && (
                    <button 
                        onClick={() => handleStatusUpdate(row._id, 'contacted')}
                        className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-600 hover:bg-amber-50 hover:text-amber-700 rounded-xl flex items-center gap-2 transition-colors"
                    >
                        <Clock size={14} /> Mark Contacted
                    </button>
                )}
                {row.status !== 'resolved' && (
                    <button 
                        onClick={() => handleStatusUpdate(row._id, 'resolved')}
                        className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl flex items-center gap-2 transition-colors"
                    >
                        <CheckCircle size={14} /> Mark Resolved
                    </button>
                )}
                <div className="h-px bg-slate-100 my-1"></div>
                <button 
                    onClick={() => handleDeleteEnquiry(row._id)}
                    className="w-full px-4 py-2.5 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2 transition-colors"
                >
                    <Trash2 size={14} /> Delete Enquiry
                </button>
            </div>
          </div>
        </div>
      )
    }
  ];

  if (loading) return <Loading />;

  return (
    <div className="p-0 sm:p-6 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      {/* Header & Stats Section */}
      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1 bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-brand-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700"></div>
          <h1 className="text-3xl font-black font-heading text-slate-900 relative z-10 tracking-tight">
            Enquiry Management
          </h1>
          <p className="text-slate-400 mt-2 font-medium relative z-10 max-w-md">Manage your business leads and customer enquiries with standard industrial workflows.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 flex-[2]">
          {statsData.map((stat, i) => (
            <div key={i} className={`${stat.bg} p-6 rounded-[28px] shadow-lg shadow-black/5 border border-white/10 transition-all hover:-translate-y-1 relative overflow-hidden group`}>
              <div className="absolute right-[-10%] bottom-[-10%] transition-transform group-hover:scale-110 duration-500">
                {stat.icon}
              </div>
              <div className="text-[10px] font-black text-white/70 uppercase tracking-[0.2em] relative z-10">{stat.label}</div>
              <div className={`text-3xl font-black mt-2 ${stat.color} relative z-10`}>{stat.value}</div>
              <div className="mt-4 h-1.5 w-12 bg-white/20 rounded-full relative z-10">
                <div 
                    className="h-full bg-white rounded-full" 
                    style={{ width: stat.value > 0 ? '60%' : '0%' }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 bg-white p-2 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl w-full sm:w-auto">
                {['all', 'new', 'contacted', 'resolved'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                            filterStatus === status 
                            ? 'bg-white text-slate-900 shadow-sm' 
                            : 'text-slate-400 hover:bg-slate-200/50'
                        }`}
                    >
                        {status}
                    </button>
                ))}
            </div>
            <div className="text-xs font-bold text-slate-400 px-4">
                Showing {filteredEnquiries.length} of {enquiries.length} Enquiries
            </div>
        </div>

        <div className="bg-white rounded-[40px] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
            <CustomDataTable
                columns={columns}
                data={filteredEnquiries}
                search={search}
                setSearch={setSearch}
                searchPlaceholder="Search by name, email, or phone number..."
            />
        </div>
      </div>

      {/* Enquiry Detail Modal */}
      {showDetailModal && selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white/90 backdrop-blur-md z-10 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-xl shadow-inner border border-brand-100">
                  {selectedEnquiry.name?.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Enquiry Details</h2>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 font-medium">
                    <Calendar size={14} />
                    Received: {new Date(selectedEnquiry.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Profile Context */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <User size={16} className="text-brand-600" /> Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <p className="text-xs font-bold text-slate-500 mb-1">Contact Person</p>
                    <p className="text-sm font-semibold text-slate-900">{selectedEnquiry.name}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <p className="text-xs font-bold text-slate-500 mb-1">Email Channel</p>
                    <a href={`mailto:${selectedEnquiry.email}`} className="text-sm font-semibold text-brand-600 hover:underline flex items-center gap-2">
                        {selectedEnquiry.email || 'No email provided'}
                    </a>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <p className="text-xs font-bold text-slate-500 mb-1">Phone Identity</p>
                    <a href={`tel:${selectedEnquiry.phone}`} className="text-sm font-semibold text-slate-900 hover:text-brand-600 flex items-center gap-2">
                        {selectedEnquiry.phone}
                    </a>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <p className="text-xs font-bold text-slate-500 mb-1">Current Status</p>
                    <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                        selectedEnquiry.status === 'new' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 
                        selectedEnquiry.status === 'contacted' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 
                        'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    }`}>
                        {selectedEnquiry.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-100"></div>

              {/* Message Context */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare size={16} className="text-brand-600" /> Message Details
                </h3>
                <div className="p-5 rounded-xl border border-slate-100 bg-slate-50 relative">
                  <MessageSquare className="absolute top-4 right-4 text-slate-200" size={32} />
                  <p className="text-sm text-slate-700 leading-relaxed relative z-10 whitespace-pre-wrap">
                    {selectedEnquiry.message}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-6 border-t border-slate-100 bg-slate-50 mt-auto shrink-0 gap-4">
              <button
                onClick={() => handleDeleteEnquiry(selectedEnquiry._id)}
                className="w-full sm:w-auto px-4 py-2.5 text-red-600 font-bold text-sm hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-2 border border-transparent hover:border-red-100"
              >
                <Trash2 size={16} /> Delete Entry
              </button>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <a 
                    href={`mailto:${selectedEnquiry.email}?subject=Follow-up on your enquiry`}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-bold text-sm hover:bg-slate-50 transition-colors shadow-sm"
                >
                    <Mail size={16} /> Reply
                </a>
                {selectedEnquiry.status !== 'contacted' && (
                    <button 
                        onClick={() => handleStatusUpdate(selectedEnquiry._id, 'contacted')}
                        className="flex-1 sm:flex-none px-4 py-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg font-bold text-sm hover:bg-amber-100 transition-colors shadow-sm"
                    >
                        Mark Contacted
                    </button>
                )}
                {selectedEnquiry.status !== 'resolved' && (
                    <button 
                        onClick={() => handleStatusUpdate(selectedEnquiry._id, 'resolved')}
                        className="flex-1 sm:flex-none px-4 py-2.5 bg-brand-600 text-white rounded-lg font-bold text-sm hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/20"
                    >
                        Mark Resolved
                    </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnquiryManagement;
