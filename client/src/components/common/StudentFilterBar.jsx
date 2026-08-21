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
  filterStatus,
  setFilterStatus,
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
    if (setFilterStatus) setFilterStatus([]);
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

      {showVendor && setFilterVendor && (!showType || filterType?.includes("intern")) && (
        <div className="min-w-[140px] flex-1">
          <MultiSelectDropdown
            options={Array.from(new Map(vendors.map(v => [v.companyName || v.name, { label: v.companyName || v.name, value: v._id }])).values())}
            selected={filterVendor}
            onChange={setFilterVendor}
            placeholder="All Vendors"
          />
        </div>
      )}

      {setFilterCenter && (
        <div className="min-w-[140px] flex-1">
          <MultiSelectDropdown
            options={Array.from(new Map(centers.map(c => [c.name, { label: c.name, value: c._id }])).values())}
            selected={filterCenter}
            onChange={setFilterCenter}
            placeholder="All Centers"
          />
        </div>
      )}

      {setFilterCourse && (
        <div className="min-w-[140px] flex-1">
          <MultiSelectDropdown
            options={Array.from(new Map(courses.map(c => [c.title || c.name, { label: c.title || c.name, value: c._id || c.title }])).values())}
            selected={filterCourse}
            onChange={setFilterCourse}
            placeholder="All Courses"
          />
        </div>
      )}

      {setFilterBatch && (
        <div className="min-w-[140px] flex-1">
          <MultiSelectDropdown
            options={Array.from(new Map(batches.map(b => [b.name || b.batchId, { label: b.name || b.batchId, value: b.name || b.batchId }])).values())}
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

      {setFilterStatus && (
        <div className="min-w-[140px] flex-1">
          <MultiSelectDropdown
            options={[
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" }
            ]}
            selected={filterStatus}
            onChange={setFilterStatus}
            placeholder="All Statuses"
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
