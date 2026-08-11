import React, { useEffect, useState } from "react";
import { 
  CreditCard, 
  Search, 
  CheckCircle2, 
  Receipt,
  Download,
  Calendar,
  Lock,
  ExternalLink,
  BookOpen
} from "lucide-react";
import api from "../../services/api";
import CustomDataTable from "../../components/common/DataTable";
import Loading from "../../components/common/Loading";
import toast from "react-hot-toast";

const Subscription = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const { data } = await api.get("/payment/my-subscriptions");
        setSubscriptions(data);
      } catch (error) {
        console.error("Error fetching subscriptions:", error);
        toast.error("Failed to load your subscription details");
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, []);

  const handleDownloadInvoice = async (paymentId) => {
    try {
      toast.loading("Preparing your invoice...", { id: "invoice-download" });
      const response = await api.get(`/payment/invoice/${paymentId}`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice_${paymentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success("Invoice downloaded successfully!", { id: "invoice-download" });
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast.error("Failed to download invoice", { id: "invoice-download" });
    }
  };

  const columns = [
    {
      name: "S.No",
      selector: (row, i) => i + 1,
      width: "70px",
      center: true,
    },
    {
      name: "Course Details",
      selector: row => row.course?.title,
      sortable: true,
      grow: 2,
      cell: row => (
        <div className="flex items-center gap-4 py-3">
          {row.course?.thumbnail?.url ? (
            <img 
              src={row.course.thumbnail.url} 
              alt={row.course.title} 
              className="w-12 h-12 rounded-xl object-cover border border-slate-100 shadow-sm"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 border border-slate-100 shadow-sm">
              <BookOpen size={20} />
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 leading-tight">
              {row.course?.title || "Unknown Course"}
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              {row.course?.category || "LMS"}
            </span>
          </div>
        </div>
      ),
    },
    {
      name: "Amount Paid",
      selector: row => row.amount,
      sortable: true,
      cell: row => (
        <span className="font-black text-slate-900 tracking-tight">
          ₹{row.amount}
        </span>
      ),
    },
    {
      name: "Purchase Date",
      selector: row => row.createdAt,
      sortable: true,
      cell: row => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-700">
            {new Date(row.createdAt).toLocaleDateString("en-IN", {
               day: '2-digit', 
               month: 'short', 
               year: 'numeric'
            })}
          </span>
          <span className="text-[10px] text-slate-400 font-bold">
            {new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      ),
    },
    {
      name: "Transaction ID",
      selector: row => row.razorpayPaymentId,
      minWidth: "160px",
      cell: row => (
        <code className="text-[11px] font-mono bg-slate-100 px-2 py-1 rounded-md text-slate-600 border border-slate-200 whitespace-nowrap">
          {row.razorpayPaymentId || "MANUAL_ENROLL"}
        </code>
      ),
    },
    {
      name: "Status",
      selector: row => row.status,
      center: true,
      cell: row => (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100">
          <CheckCircle2 size={12} />
          {row.status}
        </div>
      ),
    },
    {
      name: "Invoice",
      center: true,
      cell: row => (
        <button 
          onClick={() => handleDownloadInvoice(row._id)}
          className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors border border-transparent hover:border-brand-100"
          title="Download Invoice"
        >
          <Download size={18} />
        </button>
      ),
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="space-y-4 text-center md:text-left max-w-lg">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full border border-white/5 backdrop-blur-md mb-2">
              <Lock size={14} className="text-brand-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Secure Billing Vault</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none">
              Your <span className="text-brand-400">Subscriptions</span>
            </h1>
            <p className="text-slate-400 text-lg font-medium leading-relaxed">
              Track your course investment, download invoices, and manage your learning portfolio all in one place.
            </p>
          </div>
          
          <div className="flex flex-col items-center justify-center p-8 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl min-w-[240px]">
            <Receipt size={40} className="text-brand-400 mb-4" />
            <span className="text-3xl font-black">{subscriptions.length}</span>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mt-1">Total Purchases</span>
          </div>
        </div>
        
        {/* Animated Background Decor */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-600/20 blur-[100px] rounded-full -mr-20 -mt-20 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/10 blur-[80px] rounded-full -ml-20 -mb-20" />
      </div>

      {/* Main Table Display */}
      {subscriptions.length > 0 || loading ? (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Purchase History</h2>
              <p className="text-slate-500 text-sm font-medium">All your successful transactions</p>
            </div>
            {/* <div className="relative w-full md:w-80 group"> ... </div> */}
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
            <CustomDataTable 
              columns={columns}
              data={subscriptions.filter(s => s.course?.title?.toLowerCase().includes(searchQuery.toLowerCase()))}
              pagination
              progressPending={loading}
              search={searchQuery}
              setSearch={setSearchQuery}
              noDataComponent={
                <div className="py-20 text-center bg-white w-full border-b border-slate-200">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                    <Search size={32} className="text-slate-300" />
                  </div>
                  <h3 className="text-xl font-black text-slate-800">No matching results</h3>
                  <p className="text-slate-500 text-sm max-w-xs mx-auto">
                    Try adjusting your search criteria.
                  </p>
                </div>
              }
            />
          </div>
        </div>
      ) : (
        <div className="py-20 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200 shadow-inner">
           <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <CreditCard size={32} className="text-slate-300" />
           </div>
           <h3 className="text-xl font-black text-slate-800">No subscriptions found</h3>
           <p className="text-slate-500 text-sm max-w-xs mx-auto mb-8">
              You haven't purchased any courses yet. Start your journey today!
           </p>
           <button 
             onClick={() => window.location.href='/dashboard/enroll'}
             className="inline-flex items-center gap-2 bg-brand-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-brand-700 transition-all shadow-lg shadow-brand-600/20 active:scale-95"
           >
              Enroll in a Course <ExternalLink size={16} />
           </button>
        </div>
      )}

      {/* Security Banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6">
        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600 flex-shrink-0">
          <Calendar size={24} />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h4 className="font-bold text-blue-900">Need help with a payment?</h4>
          <p className="text-blue-700/70 text-sm font-medium">For any billing issues or queries regarding your subscriptions, please contact our support team at billing@drrgacademy.com</p>
        </div>
        <button className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all">
          Contact Support
        </button>
      </div>
    </div>
  );
};

export default Subscription;
