import sys
file_path = 'c:/Users/AJAY/Videos/Dr.Academy/dracademy/client/src/pages/admin/ExamManagement.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_bulk_start = 'const handleBulkUploadConfirm = async (payload) => {'
new_bulk_start = 'const processBulkUpload = async (data, templateId) => {'
content = content.replace(old_bulk_start, new_bulk_start)
content = content.replace('const data = payload.data || [];', '')
content = content.replace('template: payload.template', 'template: templateId')

old_return = '  return (\n    <div className="space-y-6">'
new_logic = """
  const handleTemplateConfirm = async (templateId) => {
    if (!templateSelectionTarget) return;
    
    try {
      setIsSaving(true);
      if (templateSelectionTarget.type === 'bulk') {
        await processBulkUpload(templateSelectionTarget.data, templateId);
        setTemplateSelectionTarget(null);
        return;
      }

      if (templateSelectionTarget.type === 'edit') {
        const payload = { ...templateSelectionTarget.data, template: templateId };
        if (payload.subjects && payload.subjects.length > 0) {
           payload.subject = payload.subjects[0].subject;
           payload.theoryMark = payload.subjects[0].theoryMark;
           payload.internalMark = payload.subjects[0].internalMark;
           payload.practicalMark = payload.subjects[0].practicalMark;
        }
        await api.put(`/marks/${templateSelectionTarget.currentId}`, payload);
        toast.success("Mark updated successfully");
      } else if (templateSelectionTarget.type === 'single') {
        const payload = { ...templateSelectionTarget.data, template: templateId };
        const student = students.find(s => s._id === payload.student) || {};
        const course = courses.find(c => c._id === payload.course) || {};
        const batch = batches.find(b => b._id === payload.batch) || {};
        
        const marksForPreview = payload.subjects.map(subConf => {
          const subjectDetails = subjects.find(s => String(s._id) === String(subConf.subject)) || {};
          return {
            subject: subjectDetails,
            theoryMark: subConf.theoryMark,
            internalMark: subConf.internalMark,
            practicalMark: subConf.practicalMark || 0,
            passMark: 40,
            template: templateId
          };
        });

        const previewData = {
          student,
          semester: payload.semester,
          course,
          exam: exams.find(e => e._id === payload.exam) || {},
          batch,
          marks: marksForPreview,
          templateId: templateId
        };
        
        const finalPayload = {
          student: previewData.student._id,
          batch: previewData.batch._id,
          semester: previewData.semester,
          course: previewData.course._id,
          exam: previewData.exam._id,
          marks: previewData.marks.map(m => ({
            subject: m.subject._id,
            theoryMark: m.theoryMark,
            internalMark: m.internalMark,
            practicalMark: m.practicalMark,
            template: templateId
          }))
        };

        await api.post("/marks", finalPayload);
        toast.success("Result uploaded successfully");
      }

      await new Promise(resolve => setTimeout(resolve, 800));
      await fetchData();
      setTemplateSelectionTarget(null);

    } catch (error) {
      console.error("Submit error:", error);
      toast.error(error.response?.data?.message || "Failed to upload result");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTemplatePreview = (templateId) => {
     if (templateSelectionTarget?.type === 'bulk') {
        const firstRow = templateSelectionTarget.data[0];
        if (firstRow) handlePreviewRow(firstRow, templateId);
     } else {
        const payload = templateSelectionTarget.data;
        const student = students.find(s => s._id === payload.student) || {};
        const course = courses.find(c => c._id === payload.course) || {};
        const batch = batches.find(b => b._id === payload.batch) || {};
        
        const marksForPreview = payload.subjects.map(subConf => {
          const subjectDetails = subjects.find(s => String(s._id) === String(subConf.subject)) || {};
          return {
            subject: subjectDetails,
            theoryMark: subConf.theoryMark,
            internalMark: subConf.internalMark,
            practicalMark: subConf.practicalMark || 0,
            passMark: 40,
            template: templateId
          };
        });

        setPreviewSingleData({
          student,
          semester: payload.semester,
          course,
          exam: exams.find(e => e._id === payload.exam) || {},
          batch,
          marks: marksForPreview,
          templateId: templateId
        });
        setShowSinglePreview(true);
     }
  };

  if (templateSelectionTarget) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <TemplateSelector 
          templates={templates}
          selectedTemplate={templateSelectionTarget.data.template || "rg_modern"}
          onSelect={(id) => setTemplateSelectionTarget({...templateSelectionTarget, data: {...templateSelectionTarget.data, template: id}})}
          onPreview={handleTemplatePreview}
          onSubmit={() => handleTemplateConfirm(templateSelectionTarget.data.template)}
          onBack={() => {
            if (templateSelectionTarget.type === 'bulk') setShowBulkUploadPreviewModal(true);
            else setShowMarkModal(true);
            setTemplateSelectionTarget(null);
          }}
          isSaving={isSaving}
        />
        
        {showMarksheetModal && selectedGroupData && (
          <MarksheetModal
            data={selectedGroupData}
            onClose={() => setShowMarksheetModal(false)}
            template={{ id: selectedGroupData.templateId || 'rg_modern' }}
          />
        )}
        
        {showSinglePreview && previewSingleData && (
          <MarksheetModal
            data={previewSingleData}
            onClose={() => setShowSinglePreview(false)}
            template={{ id: previewSingleData.templateId || 'rg_modern' }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
"""
content = content.replace(old_return, new_logic)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done updating")
