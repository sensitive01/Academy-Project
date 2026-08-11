const mongoose = require('mongoose');
const Payroll = require('./models/Payroll');

async function check() {
  const MONGO_URI = 'mongodb+srv://techsensitivecoin_db_user:nDLiuBMAMR8dR83R@cluster0.6fi3f4a.mongodb.net/drrjacademy';
  await mongoose.connect(MONGO_URI);
  console.log('Connected to DB');
  const count = await Payroll.findOne({ adjustments: { $exists: true, $not: {$size: 0} } });
  console.log('Adjustments:', JSON.stringify(count.adjustments, null, 2));
  process.exit();
}
check();
