import React, { useState } from 'react';
import { Search, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const MultiSelectSubjects = ({ subjectsList, selectedSubjects, maxSelection, onChange }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSubjects = subjectsList.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleSubject = (subjectId) => {
    const isSelected = selectedSubjects.includes(subjectId);
    if (isSelected) {
      onChange(selectedSubjects.filter(id => id !== subjectId));
    } else {
      if (selectedSubjects.length >= maxSelection) {
        toast.error(`You can only select up to ${maxSelection} subjects`);
        return;
      }
      onChange([...selectedSubjects, subjectId]);
    }
  };

  return (
    <div className="border border-slate-200 rounded-2xl bg-slate-50/50 p-4 space-y-3">
      {/* Search Bar */}
      {subjectsList.length > 4 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search subjects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-brand-500 outline-none bg-white font-medium"
          />
        </div>
      )}

      {/* Grid of Subjects */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
        {filteredSubjects.map(subject => {
          const isSelected = selectedSubjects.includes(subject._id);
          const isDisabled = !isSelected && selectedSubjects.length >= maxSelection;

          return (
            <button
              key={subject._id}
              type="button"
              disabled={isDisabled}
              onClick={() => handleToggleSubject(subject._id)}
              className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
              } ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="overflow-hidden pr-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {subject.code}
                </span>
                <p className="text-sm font-semibold truncate leading-tight mt-0.5">
                  {subject.name}
                </p>
              </div>
              <div className="flex-shrink-0">
                {isSelected ? (
                  <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                    <Check size={12} className="stroke-[3]" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="text-[11px] font-bold text-slate-500 text-right uppercase tracking-wider">
        Selected: {selectedSubjects.length} / {maxSelection}
      </div>
    </div>
  );
};

export default MultiSelectSubjects;
