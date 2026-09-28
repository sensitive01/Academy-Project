import React from 'react';
import { X } from 'lucide-react';

const ViewListModal = ({ isOpen, onClose, title, items, renderItem }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-5 overflow-y-auto">
          {items && items.length > 0 ? (
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={item._id || index} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  {renderItem ? renderItem(item) : (
                    <span className="font-medium text-slate-700">{item.name || item.title || "Unknown"}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              No items available.
            </div>
          )}
        </div>
        
        <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewListModal;
