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
  typeOptions,
  onReset,
  className
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

  const hasActiveFilters = 
    (filterType?.length > 0) ||
    (filterCenter?.length > 0) ||
    (filterCourse?.length > 0) ||
    (filterBatch?.length > 0) ||
    (filterYears?.length > 0) ||
    (filterVendor?.length > 0) ||
    (filterStatus?.length > 0);

  return (
    <div className={className || "flex flex-wrap items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6"}>
      {showType && setFilterType && (
        <div className="min-w-[140px] flex-1">
          <MultiSelectDropdown
            options={typeOptions || [
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
            options={[
              { label: "1st Year", value: "1st Year" },
              { label: "2nd Year", value: "2nd Year" },
              { label: "3rd Year", value: "3rd Year" },
              { label: "4th Year", value: "4th Year" }
            ]}
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

      {hasActiveFilters && (
        <button
          type="button"
          onClick={handleReset}
          title="Reset Filters"
          className="h-[42px] px-4 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 hover:border-red-200 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 group cursor-pointer shrink-0"
        >
          <RotateCcw size={16} className="transition-transform group-hover:-rotate-90 duration-200" />
          <span className="text-xs font-bold uppercase tracking-wider">Reset</span>
        </button>
      )}
    </div>
  );
};

export default StudentFilterBar;