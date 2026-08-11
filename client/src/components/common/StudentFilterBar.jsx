import React from "react";
import { RotateCcw } from "lucide-react";
import MultiSelectDropdown from "./MultiSelectDropdown";

const StudentFilterBar = ({
  filterType,
  setFilterType,
  filterCenter,
  setFilterCenter,
  filterCourse,
  setFilterCourse,
  filterBatch,
  setFilterBatch,
  filterYears,
  setFilterYears,
  filterVendor,
  setFilterVendor,
  centers = [],
  courses = [],
  batches = [],
  vendors = [],
  showVendor = false,
  showType = true,
  onReset
}) => {
  const handleReset = () => {
    if (setFilterType) setFilterType([]);
    if (setFilterCenter) setFilterCenter([]);
    if (setFilterCourse) setFilterCourse([]);
    if (setFilterBatch) setFilterBatch([]);
    if (setFilterYears) setFilterYears([]);
    if (setFilterVendor) setFilterVendor([]);
    if (onReset) onReset();
  };

  return (
    <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6">
      {showType && setFilterType && (
        <div className="min-w-[140px] flex-1">
          <MultiSelectDropdown
            options={[
              { label: "Intern", value: "intern" },
              { label: "In-house", value: "inhouse" }
            ]}
            selected={filterType}
            onChange={(selected) => {
              setFilterType(selected);
              if (setFilterVendor && !selected.includes("intern")) setFilterVendor([]);
            }}
            placeholder="All Types"
          />
        </div>
      )}

      {showVendor && setFilterVendor && (
        <div className="min-w-[140px] flex-1">
          <MultiSelectDropdown
            options={vendors.map(v => ({ label: v.companyName || v.name, value: v._id }))}
            selected={filterVendor}
            onChange={setFilterVendor}
            placeholder="All Vendors"
          />
        </div>
      )}

      {setFilterCenter && (
        <div className="min-w-[140px] flex-1">
          <MultiSelectDropdown
            options={centers.map(c => ({ label: c.name, value: c._id }))}
            selected={filterCenter}
            onChange={setFilterCenter}
            placeholder="All Centers"
          />
        </div>
      )}

      {setFilterCourse && (
        <div className="min-w-[140px] flex-1">
          <MultiSelectDropdown
            options={courses.map(c => ({ label: c.title || c.name, value: c._id || c.title }))}
            selected={filterCourse}
            onChange={setFilterCourse}
            placeholder="All Courses"
          />
        </div>
      )}

      {setFilterBatch && (
        <div className="min-w-[140px] flex-1">
          <MultiSelectDropdown
            options={batches.map(b => ({ label: b.name || b.batchId, value: b._id || b.name }))}
            selected={filterBatch}
            onChange={setFilterBatch}
            placeholder="All Batches"
          />
        </div>
      )}

      {setFilterYears && (
        <div className="min-w-[140px] flex-1">
          <MultiSelectDropdown
            options={[1, 2, 3, 4].map(y => ({ label: `Year ${y}`, value: String(y) }))}
            selected={filterYears}
            onChange={setFilterYears}
            placeholder="All Years"
          />
        </div>
      )}

      <button
        type="button"
        onClick={handleReset}
        title="Reset Filters"
        className="h-[42px] px-3 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 group cursor-pointer shrink-0"
      >
        <RotateCcw size={16} className="transition-transform group-hover:-rotate-90 duration-200" />
        <span className="text-xs font-bold uppercase tracking-wider">Reset</span>
      </button>
    </div>
  );
};

export default StudentFilterBar;
