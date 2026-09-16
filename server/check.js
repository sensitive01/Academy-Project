
const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/dracademy').then(async () => {
  const StudentFee = mongoose.model('StudentFee', new mongoose.Schema({}, { strict: false }));
  const Student = mongoose.model('Student', new mongoose.Schema({ studentNameEnglish: String, studentId: String }, { strict: false }));
  
  const fees = await StudentFee.find({ status: 'paid' });
  for (let f of fees) {
    const s = await Student.findById(f.student);
    console.log('Student:', s ? s.studentNameEnglish : 'Unknown', 'ID:', s ? s.studentId : 'Unknown');
    console.log('Fee Type:', f.feeType, 'Amount:', f.amount, 'PaidAt:', f.paidAt, 'CreatedAt:', f.createdAt);
  }
  process.exit(0);
});

