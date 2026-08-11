import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const MultiSelectDropdown = ({ options, selected, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (value) => {
    const currentSelected = Array.isArray(selected) ? selected : [];
    if (currentSelected.includes(value)) {
      onChange(currentSelected.filter(v => v !== value));
    } else {
      onChange([...currentSelected, value]);
    }
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-brand-500 outline-none transition-all flex items-center justify-between min-w-[140px]"
      >
        <span className="truncate pr-2 text-slate-700">
          {selected.length === 0 ? placeholder : `${selected.length} Selected`}
        </span>
        <ChevronDown size={14} className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-[999] top-full left-0 mt-2 min-w-[200px] w-max max-w-xs bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden py-2 max-h-60 overflow-y-auto">
          {options.map(opt => {
            const isSelected = selected ? selected.includes(opt.value) : false;
            return (
              <div
                key={opt.value}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggle(opt.value);
                }}
                className="flex items-start gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <div className={`w-4 h-4 rounded border shrink-0 mt-0.5 flex items-center justify-center transition-colors ${isSelected ? 'bg-brand-500 border-brand-500' : 'border-slate-300'}`}>
                  {isSelected && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span className={`text-sm font-medium select-none break-words ${isSelected ? 'text-brand-700 font-bold' : 'text-slate-700'}`}>
                  {opt.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
