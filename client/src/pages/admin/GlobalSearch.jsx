import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import {
  Search,
  GraduationCap,
  Users,
  ShieldCheck,
  Building2,
  ChevronRight,
  User,
  MapPin,
  Clock,
  Briefcase
} from "lucide-react";
import Loading from "../../components/common/Loading";

const GlobalSearch = () => {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState({
    students: [],
    employees: [],
    courses: [],
    centers: [],
    vendors: []
  });
  const [isLoading, setIsLoading] = useState(false);

  // Debounce logic to avoid too many API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  // Fetch results when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim().length > 0) {
      fetchResults();
    } else {
      setResults({
        students: [],
        employees: [],
        courses: [],
        centers: [],
        vendors: []
      });
    }
  }, [debouncedQuery]);

  const fetchResults = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get(`/search?q=${debouncedQuery}`);
      setResults(data);
    } catch (error) {
      console.error("Error fetching search results:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const ResultCard = ({ icon: Icon, title, subtitle, link, meta }) => (
    <Link 
      to={link}
      className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-brand-200 transition-all group flex items-center gap-4"
    >
      <div className="w-12 h-12 bg-slate-50 text-slate-400 group-hover:bg-brand-50 group-hover:text-brand-600 rounded-xl flex items-center justify-center transition-colors">
        <Icon size={24} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-brand-600 transition-colors">
          {title}
        </h4>
        <p className="text-xs text-slate-500 truncate mt-0.5">{subtitle}</p>
        {meta && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase">
              {meta}
            </span>
          </div>
        )}
      </div>
      <ChevronRight size={18} className="text-slate-300 group-hover:text-brand-400 transition-colors" />
    </Link>
  );

  const hasResults = 
    results.students.length > 0 || 
    results.employees.length > 0 || 
    results.courses.length > 0 || 
    results.centers.length > 0 ||
    results.vendors?.length > 0;

  return (
    <div className="p-4 sm:p-6 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      
      {/* Search Header */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-50 rounded-full blur-3xl opacity-50 translate-y-1/2 -translate-x-1/4"></div>
        
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-brand-100">
            <Search size={28} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Global Search</h1>
          <p className="text-slate-500 text-sm font-medium mb-8">Search across students, employees, vendors, courses, and centers.</p>
          
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-500 transition-colors">
              <Search size={22} />
            </div>
            <input
              type="text"
              autoFocus
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-lg rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm"
              placeholder="Type a name, email, or course title..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {isLoading && (
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results Area */}
      {query.trim().length > 0 && !isLoading && !hasResults && (
        <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-sm text-center">
          <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No results found</h3>
          <p className="text-sm text-slate-500 mt-1">We couldn't find anything matching "{query}". Try adjusting your search.</p>
        </div>
      )}

      {hasResults && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          
          {/* Students */}
          {results.students.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap size={20} className="text-brand-600" />
                <h2 className="text-lg font-black text-slate-800 tracking-tight">Students</h2>
                <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2 py-0.5 rounded-full">{results.students.length}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.students.map(student => (
                  <ResultCard 
                    key={student._id}
                    icon={GraduationCap}
                    title={student.name}
                    subtitle={student.email}
                    link={`/dashboard/students?search=${encodeURIComponent(student.email)}`}
                    meta={student.customId || 'Student'}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Employees */}
          {results.employees.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Users size={20} className="text-blue-600" />
                <h2 className="text-lg font-black text-slate-800 tracking-tight">Employees</h2>
                <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2 py-0.5 rounded-full">{results.employees.length}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.employees.map(emp => (
                  <ResultCard 
                    key={emp._id}
                    icon={User}
                    title={emp.name}
                    subtitle={emp.email}
                    link={`/dashboard/hr?search=${encodeURIComponent(emp.email)}`}
                    meta={emp.role.replace('-', ' ')}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Courses */}
          {results.courses.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck size={20} className="text-emerald-600" />
                <h2 className="text-lg font-black text-slate-800 tracking-tight">Courses</h2>
                <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2 py-0.5 rounded-full">{results.courses.length}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.courses.map(course => (
                  <ResultCard 
                    key={course._id}
                    icon={ShieldCheck}
                    title={course.title}
                    subtitle={course.category}
                    link={`/dashboard/admin/courses?search=${encodeURIComponent(course.title)}`}
                    meta={course.level || 'Course'}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Centers */}
          {results.centers.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Building2 size={20} className="text-purple-600" />
                <h2 className="text-lg font-black text-slate-800 tracking-tight">Centers</h2>
                <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2 py-0.5 rounded-full">{results.centers.length}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.centers.map(center => (
                  <ResultCard 
                    key={center._id}
                    icon={Building2}
                    title={center.name}
                    subtitle={center.location ? `${center.location.city}, ${center.location.state}` : 'Location NA'}
                    link={`/dashboard/admin/centers?search=${encodeURIComponent(center.name)}`}
                    meta="Center"
                  />
                ))}
              </div>
            </section>
          )}

          {/* Vendors */}
          {results.vendors && results.vendors.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Briefcase size={20} className="text-orange-600" />
                <h2 className="text-lg font-black text-slate-800 tracking-tight">Vendors</h2>
                <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2 py-0.5 rounded-full">{results.vendors.length}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.vendors.map(vendor => (
                  <ResultCard 
                    key={vendor._id}
                    icon={Briefcase}
                    title={vendor.companyName}
                    subtitle={vendor.contactPerson || vendor.email}
                    link={`/dashboard/admin/vendors?search=${encodeURIComponent(vendor.companyName)}`}
                    meta="Vendor"
                  />
                ))}
              </div>
            </section>
          )}

        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
