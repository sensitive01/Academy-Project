const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 15000,
            socketTimeoutMS: 45000
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Drop unique indexes on batches collection if they exist to allow duplicate names/IDs across different centers
        try {
            await mongoose.connection.db.collection("batches").dropIndex("name_1");
        } catch (err) {
            // Ignore errors for non-existent indexes
        }
        try {
            await mongoose.connection.collection('batches').dropIndex("batchId_1");
        } catch (err) {
            // Ignore errors for non-existent indexes
        }
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
    }
};

module.exports = connectDB;
