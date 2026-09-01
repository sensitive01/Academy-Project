import sys
file_path = 'c:/Users/AJAY/Videos/Dr.Academy/dracademy/client/src/pages/admin/ExamManagement.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace template dropdown
old_dropdown = '''                <label className="block text-sm font-bold text-slate-700 mb-1">Marksheet Template</label>
                  <select required className="w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-500 focus:ring-brand-500 border p-3 text-sm bg-slate-50" value={markFormData.template} onChange={(e) => setMarkFormData({ ...markFormData, template: e.target.value })}>
                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>'''

content = content.replace(old_dropdown, '                </div>')

# Replace Submit button
old_submit = '{isEditing ? "Update Mark" : "Upload Result"}'
content = content.replace(old_submit, 'Next: Choose Template')

# Replace the modal wrapper for showMarkModal
old_modal_start = '''      {showMarkModal && isAdmin && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">'''

new_modal_start = '''      {showMarkModal && isAdmin && (
        <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-100 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-full p-8">'''

content = content.replace(old_modal_start, new_modal_start)
content = content.replace('max-w-2xl', 'max-w-4xl')

# Hide tabs if showMarkModal
old_main_wrap = '      <div className="flex justify-between items-center">'
new_main_wrap = '      {!showMarkModal && !showBulkUploadPreviewModal && (<>\n      <div className="flex justify-between items-center">'

# Find where the tabs end, which is before the modals start
old_modals_start = '      {showMarkModal && isAdmin && ('
new_modals_start = '      </>)}\n      {showMarkModal && isAdmin && ('

content = content.replace(old_main_wrap, new_main_wrap)
content = content.replace(old_modals_start, new_modals_start)

# Do the same wrapper for BulkUploadPreview
old_bulk_modal_start = '''      {showBulkUploadPreviewModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-6xl w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">'''

new_bulk_modal_start = '''      {showBulkUploadPreviewModal && (
        <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-100 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-full p-8 flex flex-col">'''

content = content.replace(old_bulk_modal_start, new_bulk_modal_start)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated successfully")
