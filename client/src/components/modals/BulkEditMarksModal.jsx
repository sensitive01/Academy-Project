import React, { useState } from 'react';
import { X, Save, CheckSquare } from 'lucide-react';

const BulkEditMarksModal = ({ data, onClose, onSave, students, batches, courses, subjects, templates, isSaving }) => {
  const [groupDetails, setGroupDetails] = useState({
    student: data.student?._id || data.student,
    batch: data.batch?._id || data.batch,
    course: data.course?._id || data.course,
    semester: data.semester,
    template: data.templateId || (data.marks && data.marks.length > 0 ? data.marks[0].template : 'rg_modern') || 'rg_modern'
  });

  const [marksState, setMarksState] = useState(
    data.marks.map(m => ({
      _id: m._id,
      subject: m.subject?._id || m.subject,
      theoryMark: m.theoryMark || 0,
      internalMark: m.internalMark || 0,
      practicalMark: m.practicalMark || 0
    }))
  );

  const handleChange = (id, field, value) => {
    setMarksState(prev => prev.map(m => m._id === id ? { ...m, [field]: Number(value) } : m));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(marksState, groupDetails);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-50 text-brand-600 rounded-xl">
              <CheckSquare size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Bulk Edit Semester Result</h2>
            </div>
          </div>
          <button onClick={onClose} disabled={isSaving} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-full hover:bg-slate-100 transition-colors disabled:opacity-50">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Student</label>
              <select required disabled={isSaving} className="w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-2.5 text-sm bg-white disabled:opacity-50" value={groupDetails.student} onChange={(e) => setGroupDetails({ ...groupDetails, student: e.target.value })}>
                <option value="">Select Student</option>
                {students?.map(s => <option key={s._id} value={s._id}>{s.studentNameEnglish} ({s.studentId})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Batch</label>
              <select disabled={isSaving} className="w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-2.5 text-sm bg-white disabled:opacity-50" value={groupDetails.batch} onChange={(e) => setGroupDetails({ ...groupDetails, batch: e.target.value })}>
                <option value="">Select Batch</option>
                {batches?.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Course</label>
              <select required disabled={isSaving} className="w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-2.5 text-sm bg-white disabled:opacity-50" value={groupDetails.course} onChange={(e) => setGroupDetails({ ...groupDetails, course: e.target.value })}>
                <option value="">Select Course</option>
                {courses?.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Semester</label>
              <select required disabled={isSaving} className="w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-2.5 text-sm bg-white disabled:opacity-50" value={groupDetails.semester} onChange={(e) => setGroupDetails({ ...groupDetails, semester: Number(e.target.value) })}>
                <option value="">Select Semester</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => <option key={sem} value={sem}>Semester {sem}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1">Marksheet Template</label>
              <select required disabled={isSaving} className="w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-2.5 text-sm bg-white disabled:opacity-50" value={groupDetails.template} onChange={(e) => setGroupDetails({ ...groupDetails, template: e.target.value })}>
                {templates?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-4">Subject</th>
                  <th className="p-4">Theory Mark</th>
                  <th className="p-4">Internal Mark</th>
                  <th className="p-4 text-center">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {marksState.map((m) => (
                  <tr key={m._id} className="hover:bg-slate-50">
                    <td className="p-4 font-medium text-slate-900">
                      <select required disabled={isSaving} className="w-full rounded-lg border-slate-200 focus:border-brand-500 focus:ring-brand-500 p-2 text-sm disabled:opacity-50" value={m.subject} onChange={(e) => handleChange(m._id, 'subject', e.target.value)}>
                        <option value="">Select Subject</option>
                        {subjects?.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
                      </select>
                    </td>
                    <td className="p-4">
                      <input
                        type="number"
                        disabled={isSaving}
                        className="w-24 rounded-lg border-slate-200 focus:border-brand-500 focus:ring-brand-500 p-2 text-center disabled:opacity-50"
                        value={m.theoryMark}
                        onChange={(e) => handleChange(m._id, 'theoryMark', e.target.value)}
                        required
                      />
                    </td>
                    <td className="p-4">
                      <input
                        type="number"
                        disabled={isSaving}
                        className="w-24 rounded-lg border-slate-200 focus:border-brand-500 focus:ring-brand-500 p-2 text-center disabled:opacity-50"
                        value={m.internalMark}
                        onChange={(e) => handleChange(m._id, 'internalMark', e.target.value)}
                        required
                      />
                    </td>
                    <td className="p-4 text-center font-bold text-brand-600 bg-brand-50">
                      {m.theoryMark + m.internalMark + (m.practicalMark || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} disabled={isSaving} className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={isSaving} className="flex-1 px-4 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-600/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
              {isSaving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} /> Save All Marks
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkEditMarksModal;
