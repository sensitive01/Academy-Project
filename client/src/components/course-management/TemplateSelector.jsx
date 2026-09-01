import React from 'react';
import { Eye, CheckCircle2 } from 'lucide-react';
import MarksheetModal from '../modals/MarksheetModal';

const TemplateSelector = ({ templates, selectedTemplate, onSelect, onPreview, onSubmit, onBack, isSaving }) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-10 relative">
        <button 
          onClick={onBack}
          className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 font-bold bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl transition-colors"
        >
          ← Back
        </button>
        <h2 className="text-3xl font-black text-slate-900 mb-3">Choose Marksheet Template</h2>
        <p className="text-slate-500 max-w-2xl mx-auto">
          Select the design template you want to use for generating the marksheets. 
          You can preview how the data will look before finalizing the upload.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map(t => {
          const isSelected = selectedTemplate === t.id;
          return (
            <div 
              key={t.id}
              onClick={() => onSelect(t.id)}
              className={`relative bg-white rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 border-2
                ${isSelected ? 'border-brand-600 shadow-[0_0_30px_rgba(220,38,38,0.15)] scale-[1.02] z-10' : 'border-transparent shadow-md hover:shadow-xl hover:scale-[1.01] hover:border-slate-200'}
              `}
            >
              {/* Template Card Header/Mockup */}
              <div className="h-64 bg-slate-50 border-b border-slate-100 flex flex-col items-center justify-center p-4 relative group">
                <div className="w-full h-full relative overflow-hidden bg-white shadow-sm border border-slate-200 rounded-lg flex items-center justify-center pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
                  <div className="absolute top-0 left-0 origin-top-left" style={{ transform: 'scale(0.18)', width: '800px' }}>
                    <MarksheetModal 
                      inline={true} 
                      data={{
                        student: { studentId: "DR/2023/001", studentNameEnglish: "JOHN DOE", dob: "2000-01-01" },
                        course: { title: "DIPLOMA IN COMPUTER APPLICATIONS" },
                        semester: 1,
                        templateId: t.id,
                        marks: [
                          { subject: { code: "DCA01", name: "FUNDAMENTALS OF IT" }, theoryMark: 65, internalMark: 18, practicalMark: 0 },
                          { subject: { code: "DCA02", name: "MS OFFICE" }, theoryMark: 55, internalMark: 15, practicalMark: 0 },
                          { subject: { code: "DCA03", name: "PROGRAMMING IN C" }, theoryMark: 60, internalMark: 17, practicalMark: 0 }
                        ]
                      }}
                      template={{ id: t.id }}
                    />
                  </div>
                </div>

                {/* Preview Overlay */}
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onPreview(t.id); }}
                    className="bg-white text-slate-900 font-bold px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 hover:bg-brand-50 hover:text-brand-700 transition-colors transform translate-y-4 group-hover:translate-y-0 duration-300"
                  >
                    <Eye size={18} /> Preview
                  </button>
                </div>
              </div>

              {/* Template Info */}
              <div className="p-5 flex justify-between items-center bg-white">
                <div>
                  <h3 className="font-bold text-slate-800 text-[15px]">{t.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Template ID: {t.id}</p>
                </div>
                <div className={`h-6 w-6 rounded-full flex items-center justify-center transition-colors ${isSelected ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-300'}`}>
                  <CheckCircle2 size={16} className={isSelected ? 'block' : 'hidden'} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end pt-6 border-t border-slate-100">
        <button 
          onClick={onSubmit}
          disabled={!selectedTemplate || isSaving}
          className="bg-brand-600 text-white px-8 py-3.5 rounded-2xl font-black shadow-xl shadow-brand-600/20 hover:bg-brand-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSaving ? (
            <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading...</>
          ) : (
            'Confirm & Upload Result'
          )}
        </button>
      </div>
    </div>
  );
};

export default TemplateSelector;
