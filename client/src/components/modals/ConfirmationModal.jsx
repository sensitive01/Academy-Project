import React from "react";
import { AlertTriangle, Info, CheckCircle, XCircle, X } from "lucide-react";

/**
 * ConfirmationModal - A premium, professional confirmation dialog.
 */
const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message = "This action cannot be undone. Please confirm to proceed.",
  confirmText = "Confirm Action",
  cancelText = "Cancel",
  type = "danger"
}) => {
  if (!isOpen) return null;

  const typeConfigs = {
    danger: {
      icon: <XCircle className="text-red-600" size={24} />,
      btnClass: "bg-red-600 hover:bg-red-700 text-white shadow-red-200",
      ring: "ring-red-100",
      bg: "bg-red-50",
      titleColor: "text-red-950"
    },
    warning: {
      icon: <AlertTriangle className="text-amber-600" size={24} />,
      btnClass: "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200",
      ring: "ring-amber-100",
      bg: "bg-amber-50",
      titleColor: "text-amber-950"
    },
    success: {
      icon: <CheckCircle className="text-emerald-600" size={24} />,
      btnClass: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200",
      ring: "ring-emerald-100",
      bg: "bg-emerald-50",
      titleColor: "text-emerald-950"
    },
    info: {
      icon: <Info className="text-indigo-600" size={24} />,
      btnClass: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200",
      ring: "ring-indigo-100",
      bg: "bg-indigo-50",
      titleColor: "text-indigo-950"
    }
  };

  const config = typeConfigs[type] || typeConfigs.info;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 isolate">
      {/* Backdrop with sophisticated blur and fade */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-all duration-500 animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white w-full max-w-[400px] rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Main Header / Icon Section */}
        <div className="p-8 pb-4 text-center flex flex-col items-center">
          {/* Animated Icon Ring */}
          <div className={`w-16 h-16 rounded-full ${config.bg} flex items-center justify-center ring-8 ${config.ring} mb-6 animate-in slide-in-from-top-2 duration-500`}>
            {config.icon}
          </div>

          <h3 className={`text-2xl font-black tracking-tight leading-tight mb-3 ${config.titleColor}`}>
            {title}
          </h3>
          
          <p className="text-slate-500 text-[15px] leading-relaxed font-medium px-2">
            {message}
          </p>
        </div>

        {/* Footer / Buttons Layout */}
        <div className="p-8 pt-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 rounded-xl text-slate-500 bg-slate-50 font-bold text-sm hover:text-slate-700 hover:bg-slate-100 transition-all duration-200"
          >
            {cancelText}
          </button>

          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 py-3.5 rounded-xl font-black text-sm tracking-wide shadow-xl active:scale-[0.98] transition-all duration-200 ${config.btnClass}`}
          >
            {confirmText}
          </button>
        </div>

        {/* Discreet Close Button Case */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-300 hover:bg-slate-100 hover:text-slate-500 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Bottom Decorative Edge */}
        <div className={`h-1.5 w-full ${config.bg.replace('bg-', 'bg-')}`} />
      </div>
    </div>
  );
};

export default ConfirmationModal;
