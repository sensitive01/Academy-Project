import React from 'react';
import { GraduationCap } from 'lucide-react';

const Loading = ({ fullPage = false, message = "Loading..." }) => {
  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-slate-50/80 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center">
        <div className="relative">
          {/* Outer spinning ring */}
          <div className="w-20 h-20 border-4 border-brand-100 border-t-brand-600 rounded-full animate-spin shadow-xl"></div>
          
          {/* Inner hat icon */}
          <div className="absolute inset-0 flex items-center justify-center text-brand-600 animate-pulse">
             <GraduationCap size={40} />
          </div>
        </div>
        
        <div className="mt-8 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-[2px] bg-brand-600/30 rounded-full"></div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Dr.RG ACADEMY</h2>
            <div className="w-8 h-[2px] bg-brand-600/30 rounded-full"></div>
          </div>
          <p className="text-slate-500 text-sm font-bold tracking-widest uppercase animate-pulse">{message}</p>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-200/20 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 w-full transition-opacity duration-300">
      <div className="relative">
        <div className="w-12 h-12 border-3 border-brand-100 border-t-brand-600 rounded-full animate-spin shadow-sm"></div>
        <div className="absolute inset-0 flex items-center justify-center text-brand-600">
          <GraduationCap size={20} className="animate-pulse" />
        </div>
      </div>
      {message && <p className="mt-3 text-slate-500 text-xs font-black uppercase tracking-tighter animate-pulse">{message}</p>}
    </div>
  );
};

export default Loading;
