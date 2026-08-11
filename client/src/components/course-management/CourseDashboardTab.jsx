import React, { useState, useEffect } from "react";
import { BookOpen, MapPin, Layers, BookType } from "lucide-react";
import api from "../../services/api";
import Loading from "../../components/common/Loading";

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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Minimalist Card 1 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-500">Total Courses</span>
            <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center">
              <BookOpen size={16} className="text-brand-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-slate-900">{courses.length}</span>
          </div>
          <div className="mt-4 flex gap-4 text-xs font-medium text-slate-400">
            <span>Online: <span className="text-slate-700">{courses.filter(c => c.type === 'Online Courses').length}</span></span>
            <span>Center: <span className="text-slate-700">{courses.filter(c => c.type === 'Center Courses').length}</span></span>
          </div>
        </div>

        {/* Minimalist Card 2 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-500">Total Batches</span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
              <Layers size={16} className="text-emerald-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-slate-900">{batches.length}</span>
          </div>
          <div className="mt-4 text-xs font-medium text-slate-400">
            Active training groups
          </div>
        </div>

        {/* Minimalist Card 3 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-500">Total Subjects</span>
            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
              <BookType size={16} className="text-amber-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-slate-900">{subjects.length}</span>
          </div>
          <div className="mt-4 text-xs font-medium text-slate-400">
            Curriculum modules
          </div>
        </div>

        {/* Minimalist Card 4 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-500">Active Centers</span>
            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
              <MapPin size={16} className="text-indigo-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-slate-900">{centers.length}</span>
          </div>
          <div className="mt-4 text-xs font-medium text-slate-400">
            Operational branches
          </div>
        </div>

      </div>
    </div>
  );
};

export default CourseDashboardTab;
