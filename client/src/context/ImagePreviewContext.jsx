import React, { createContext, useContext, useState } from 'react';
import ReactDOM from 'react-dom';

const ImagePreviewContext = createContext();

export const useImagePreview = () => {
  return useContext(ImagePreviewContext);
};

export const ImagePreviewProvider = ({ children }) => {
  const [previewImage, setPreviewImage] = useState(null);

  const showPreview = (imageUrl) => {
    setPreviewImage(imageUrl);
  };

  const closePreview = () => {
    setPreviewImage(null);
  };

  return (
    <ImagePreviewContext.Provider value={{ showPreview, closePreview }}>
      {children}
      {/* IMAGE PREVIEW MODAL */}
      {previewImage && typeof document !== 'undefined' && ReactDOM.createPortal(
        <div 
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={closePreview}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center animate-in zoom-in-95 duration-200">
            <img 
              src={previewImage} 
              alt="Preview" 
              className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl border border-white/10"
              onClick={e => e.stopPropagation()}
            />
            <button 
              onClick={closePreview}
              className="absolute -top-4 -right-4 bg-red-500 text-white p-2 rounded-full shadow-xl hover:bg-red-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
        </div>,
        document.body
      )}
    </ImagePreviewContext.Provider>
  );
};
