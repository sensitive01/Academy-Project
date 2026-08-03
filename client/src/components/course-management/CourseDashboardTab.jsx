import React, { useState, useEffect } from "react";
import { BookOpen, MapPin, Layers, BookType } from "lucide-react";
import api from "../../services/api";
import Loading from "../../components/Loading";

const CourseDashboardTab = () => {
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [coursesRes, batchesRes, subjectsRes, centersRes] = await Promise.all([
          api.get("/courses").catch(() => ({ data: [] })),
          api.get("/batches").catch(() => ({ data: [] })),
          api.get("/subjects").catch(() => ({ data: [] })),
          api.get("/centers").catch(() => ({ data: [] }))
        ]);

        setCourses(coursesRes.data.courses || coursesRes.data || []);
        setBatches(batchesRes.data.batches || batchesRes.data || []);
        setSubjects(subjectsRes.data.subjects || subjectsRes.data || []);
        setCenters(centersRes.data || []);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-brand-200 transition-all">
          <div className="min-w-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none truncate">Online Courses</p>
            <p className="text-3xl font-black text-slate-900 mt-2">{courses.filter(c => c.courseType === 'Online Courses').length}</p>
          </div>
          <div className="p-4 rounded-2xl bg-blue-50 text-blue-600 group-hover:rotate-12 transition-all shrink-0">
            <BookOpen size={26} strokeWidth={2.5} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-brand-200 transition-all">
          <div className="min-w-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none truncate">Center Courses</p>
            <p className="text-3xl font-black text-slate-900 mt-2">{courses.filter(c => c.courseType === 'Center Courses').length}</p>
          </div>
          <div className="p-4 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:rotate-12 transition-all shrink-0">
            <BookOpen size={26} strokeWidth={2.5} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-brand-200 transition-all">
          <div className="min-w-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none truncate">Total Batches</p>
            <p className="text-3xl font-black text-slate-900 mt-2">{batches.length}</p>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:rotate-12 transition-all shrink-0">
            <Layers size={26} strokeWidth={2.5} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-brand-200 transition-all">
          <div className="min-w-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none truncate">Total Subjects</p>
            <p className="text-3xl font-black text-slate-900 mt-2">{subjects.length}</p>
          </div>
          <div className="p-4 rounded-2xl bg-amber-50 text-amber-600 group-hover:rotate-12 transition-all shrink-0">
            <BookType size={26} strokeWidth={2.5} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">Course Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                <BookOpen className="text-brand-500" size={20} />
                <span className="font-bold text-slate-700">Total Unique Courses</span>
              </div>
              <span className="text-lg font-black text-slate-900">{courses.length}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                <MapPin className="text-indigo-500" size={20} />
                <span className="font-bold text-slate-700">Active Centers</span>
              </div>
              <span className="text-lg font-black text-slate-900">{centers.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDashboardTab;
