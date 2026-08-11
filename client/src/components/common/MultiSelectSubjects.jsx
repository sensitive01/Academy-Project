import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, CheckSquare, Square, X } from 'lucide-react';
import toast from 'react-hot-toast';

const MultiSelectSubjects = ({ subjectsList, selectedSubjects, maxSelection, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
  const renderSelectedTags = () => {
    if (selectedSubjects.length === 0) {
      return <span className="text-gray-400">Select Subjects...</span>;
    }

    return (
      <div className="flex flex-wrap gap-1.5 mt-1">
        {selectedSubjects.map(id => {
          const subject = subjectsList.find(s => s._id === id);
          if (!subject) return null;
          return (
            <span key={id} className="inline-flex items-center gap-1 px-2 py-1 bg-brand-50 text-brand-700 text-xs font-semibold rounded-md border border-brand-100">
              {subject.name}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleSubject(id);
                }}
                className="hover:bg-brand-200 text-brand-600 p-0.5 rounded-full transition-colors"
              >
                <X size={12} />
              </button>
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-start justify-between rounded-xl border-gray-200 shadow-sm border p-3 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[50px] cursor-pointer transition-all"
      >
        <div className="flex-1 pr-2">
          <div className="text-xs font-bold text-gray-500 mb-0.5 uppercase tracking-wider">
            Selected ({selectedSubjects.length}/{maxSelection})
          </div>
          {renderSelectedTags()}
        </div>
        <button type="button" className="mt-1">
          <ChevronDown size={18} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div className="w-full mt-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-3 border-b border-gray-100 bg-gray-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search subjects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border-gray-200 focus:border-brand-500 focus:ring-brand-500 outline-none"
              />
            </div>
            <div className="text-xs text-gray-500 mt-2 font-medium">
              Selected: {selectedSubjects.length} / {maxSelection}
            </div>
          </div>
          
          <div className="max-h-60 overflow-y-auto p-2">
            {filteredSubjects.length === 0 ? (
              <div className="p-3 text-center text-sm text-gray-500">No subjects found.</div>
            ) : (
              filteredSubjects.map(subject => {
                const isSelected = selectedSubjects.includes(subject._id);
                const isDisabled = !isSelected && selectedSubjects.length >= maxSelection;

                return (
                  <label
                    key={subject._id}
                    className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                      isSelected ? 'bg-brand-50' : 'hover:bg-gray-50'
                    } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={isDisabled}
                      onChange={() => handleToggleSubject(subject._id)}
                      className="hidden"
                    />
                    <div className={isSelected ? 'text-brand-600' : 'text-gray-400'}>
                      {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                    </div>
                    <div>
                      <div className={`text-sm font-medium ${isSelected ? 'text-brand-700' : 'text-gray-700'}`}>
                        {subject.name}
                      </div>
                      <div className="text-xs text-gray-500">{subject.code}</div>
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelectSubjects;
