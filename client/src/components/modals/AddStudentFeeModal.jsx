import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, DollarSign } from 'lucide-react';

const AddStudentFeeModal = ({ onClose, onSave, students, centers, courses, batches }) => {
  const [formData, setFormData] = useState({
    student: "",
    center: "",
    course: "",
    batch: "",
    feeType: "Term",
    otherFeeType: "",
    terms: [],
    amount: 0,
    status: "pending",
    dueDate: "",
    penaltyAmount: 0,
    finalDueDate: "",
    finalPenaltyAmount: 0
  });

  const handleStudentChange = (studentId) => {
    if (!studentId) {
      setFormData(prev => ({
        ...prev,
        student: "",
        center: "",
        course: "",
        batch: ""
      }));
      return;
    }

    const selectedStudent = students.find(s => s._id === studentId);
    let batchId = "";
    let courseId = "";
    let centerId = "";

    if (selectedStudent) {
      // Find any batch that contains this student first
      const studentBatch = batches.find(b => 
        b.students && b.students.some(sid => {
          const idStr = typeof sid === 'object' ? (sid._id || sid).toString() : sid.toString();
          return idStr === studentId;
        })
      );

      if (studentBatch) {
        batchId = studentBatch._id;
        courseId = studentBatch.course?._id || studentBatch.course;
        centerId = studentBatch.center?._id || studentBatch.center;
      } else {
        // Fallback to student's profile settings if they have no assigned batch
        centerId = selectedStudent.center?._id || selectedStudent.center || "";
        const enrolledCourse = selectedStudent.enrolledCourses?.[0]?.course;
        courseId = enrolledCourse?._id || enrolledCourse || "";
        const enrolledBatch = selectedStudent.enrolledCourses?.[0]?.batch;
        batchId = enrolledBatch?._id || enrolledBatch || "";
      }
    }

    setFormData(prev => ({
      ...prev,
      student: studentId,
      batch: batchId,
      course: courseId,
      center: centerId
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
              <DollarSign size={24} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Add Student Payment</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-full hover:bg-slate-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Student</label>
              <select required className="w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3 text-sm bg-slate-50" value={formData.student} onChange={e => handleStudentChange(e.target.value)}>
                <option value="">Select Student</option>
                {students?.map(s => <option key={s._id} value={s._id}>{s.studentNameEnglish} ({s.studentId})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Center</label>
              <select required className={`w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3 text-sm ${formData.student ? 'bg-slate-100 cursor-not-allowed text-slate-500' : 'bg-slate-50'}`} value={formData.center} onChange={e => setFormData({...formData, center: e.target.value})} disabled={!!formData.student}>
                <option value="">Select Center</option>
                {centers?.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Course</label>
              <select required className={`w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3 text-sm ${formData.student ? 'bg-slate-100 cursor-not-allowed text-slate-500' : 'bg-slate-50'}`} value={formData.course} onChange={e => setFormData({...formData, course: e.target.value})} disabled={!!formData.student}>
                <option value="">Select Course</option>
                {courses?.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Batch</label>
              <select required className={`w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3 text-sm ${formData.student ? 'bg-slate-100 cursor-not-allowed text-slate-500' : 'bg-slate-50'}`} value={formData.batch} onChange={e => setFormData({...formData, batch: e.target.value})} disabled={!!formData.student}>
                <option value="">Select Batch</option>
                {batches?.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Fee Type</label>
              <select required className="w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3 text-sm bg-slate-50" value={formData.feeType} onChange={e => setFormData({...formData, feeType: e.target.value})}>
                <option value="Sem">Sem Fee</option>
                <option value="Term">Term Fee</option>
                <option value="Monthly">Monthly Fee</option>
                <option value="Other">Other</option>
              </select>
            </div>
            {formData.feeType === 'Other' && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Specify Other Fee</label>
                <input type="text" required className="w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3 text-sm bg-slate-50" value={formData.otherFeeType} onChange={e => setFormData({...formData, otherFeeType: e.target.value})} />
              </div>
            )}
            {formData.feeType === 'Sem' && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Semester</label>
                <select className="w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3 text-sm bg-slate-50" value={formData.terms[0] || ""} onChange={e => setFormData({...formData, terms: e.target.value ? [Number(e.target.value)] : []})}>
                  <option value="">Select Semester (Optional)</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => <option key={sem} value={sem}>Semester {sem}</option>)}
                </select>
              </div>
            )}
            {formData.feeType === 'Term' && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Term / Installment</label>
                <select className="w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3 text-sm bg-slate-50" value={formData.terms[0] || ""} onChange={e => setFormData({...formData, terms: e.target.value ? [Number(e.target.value)] : []})}>
                  <option value="">Select Term (Optional)</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => <option key={sem} value={sem}>Term {sem}</option>)}
                </select>
              </div>
            )}
            {formData.feeType === 'Monthly' && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Month</label>
                <input type="month" required className="w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3 text-sm bg-slate-50" onChange={e => setFormData({...formData, terms: [new Date(e.target.value).getMonth() + 1]})} />
              </div>
            )}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Amount (₹)</label>
              <input type="number" required min="0" className="w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3 text-sm bg-slate-50" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} />
            </div>
          </div>
          
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mt-6">
             <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">Penalty Tracking Configuration</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Due Date</label>
                  <input type="date" className="w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-2.5 text-sm bg-white" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Penalty Amount (₹)</label>
                  <input type="number" min="0" className="w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-2.5 text-sm bg-white" value={formData.penaltyAmount} onChange={e => setFormData({...formData, penaltyAmount: Number(e.target.value)})} />
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Final Due Date</label>
                  <input type="date" className="w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-2.5 text-sm bg-white" value={formData.finalDueDate} onChange={e => setFormData({...formData, finalDueDate: e.target.value})} />
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Final Penalty Amount (₹)</label>
                  <input type="number" min="0" className="w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-2.5 text-sm bg-white" value={formData.finalPenaltyAmount} onChange={e => setFormData({...formData, finalPenaltyAmount: Number(e.target.value)})} />
               </div>
             </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2">
              <Save size={18} /> Save Payment
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default AddStudentFeeModal;
