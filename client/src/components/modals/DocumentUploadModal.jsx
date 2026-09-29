import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, Trash2, Plus, Download } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const DEFAULT_DOCUMENTS = [
  'Aadhaar Card',
  'Parents Aadhaar Card',
  'SSLC/10th Mark Sheet',
  'PUC/12th Mark Sheet',
  'Transfer Certificate',
  'Ration Card',
  'Passport Size Photograph',
  'Caste Certificate',
  'Income Certificate',
  'Bank Passbook'
];

const DocumentUploadModal = ({ isOpen, onClose, student, onUpdate }) => {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [showNewFieldInput, setShowNewFieldInput] = useState(false);

  // Merge default documents with custom uploaded documents
  const [documentTypes, setDocumentTypes] = useState(DEFAULT_DOCUMENTS);

  useEffect(() => {
    if (student) {
      setDocuments(student.documents || []);
      // Add custom document names to documentTypes if they are not in DEFAULT_DOCUMENTS
      if (student.documents) {
        const customDocs = student.documents
          .map(d => d.name)
          .filter(name => !DEFAULT_DOCUMENTS.includes(name));
        if (customDocs.length > 0) {
          setDocumentTypes([...DEFAULT_DOCUMENTS, ...new Set(customDocs)]);
        } else {
          setDocumentTypes(DEFAULT_DOCUMENTS);
        }
      } else {
        setDocumentTypes(DEFAULT_DOCUMENTS);
      }
    }
  }, [student]);

  if (!isOpen) return null;

  const handleFileUpload = async (e, documentName) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentName', documentName);

    try {
      setUploading(true);
      const res = await api.post(`/students/${student._id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setDocuments(res.data.documents);
      toast.success('Document uploaded successfully');
      if (onUpdate) onUpdate(res.data.documents);
    } catch (error) {
      toast.error('Failed to upload document');
      console.error(error);
    } finally {
      setUploading(false);
      e.target.value = null;
    }
  };

  const handleDelete = async (docId) => {
    try {
      setUploading(true);
      const res = await api.delete(`/students/${student._id}/documents/${docId}`);
      setDocuments(res.data.documents);
      toast.success('Document deleted successfully');
      if (onUpdate) onUpdate(res.data.documents);
    } catch (error) {
      toast.error('Failed to delete document');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleAddNewField = () => {
    if (!newFieldName.trim()) return;
    if (!documentTypes.includes(newFieldName.trim())) {
      setDocumentTypes([...documentTypes, newFieldName.trim()]);
    }
    setNewFieldName('');
    setShowNewFieldInput(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-900">Student Documents</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Upload and manage documents for {student?.user?.name}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-white">
          <div className="space-y-4">
            {documentTypes.map((docType, index) => {
              const uploadedDoc = documents.find(d => d.name === docType);

              return (
                <div key={index} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-700">{docType}</h3>
                      {uploadedDoc ? (
                        <span className="text-xs font-bold text-emerald-600">Uploaded</span>
                      ) : (
                        <span className="text-xs font-medium text-amber-600">Pending</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {uploadedDoc ? (
                      <>
                        <a 
                          href={uploadedDoc.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                        >
                          <Download size={16} />
                          View
                        </a>
                        <button 
                          onClick={() => handleDelete(uploadedDoc._id)}
                          disabled={uploading}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Trash2 size={20} />
                        </button>
                      </>
                    ) : (
                      <label className="px-4 py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg text-sm font-bold transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50">
                        <Upload size={16} />
                        Upload
                        <input 
                          type="file" 
                          className="hidden" 
                          onChange={(e) => handleFileUpload(e, docType)}
                          disabled={uploading}
                          accept=".pdf,.jpg,.jpeg,.png"
                        />
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
            {showNewFieldInput ? (
              <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <input
                  type="text"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  placeholder="Enter new document name..."
                  className="flex-1 px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  autoFocus
                />
                <button
                  onClick={handleAddNewField}
                  className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowNewFieldInput(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowNewFieldInput(true)}
                className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-bold hover:bg-slate-50 hover:border-brand-300 hover:text-brand-600 transition-colors"
              >
                <Plus size={20} />
                Add New Document Field
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentUploadModal;
