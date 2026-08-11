require('dotenv').config();
const connectDB = require('./config/db');
const Employee = require('./models/Employee');

connectDB().then(async () => {
    try {
        const res = await Employee.updateOne({_id: '6993ff61934af8b0d5b23040'}, {$set: {status: 'inactive'}});
        console.log("Success:", res);
    } catch(err) {
        console.error("Error:", err);
    } finally {
        process.exit(0);
    }
});
