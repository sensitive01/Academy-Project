const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    mobile: {
        type: String,
    },
    password: {
        type: String,
        required: function() { return !this.googleId; },
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true,
    },
    role: {
        type: String,
        default: 'student',
        enum: ['student', 'admin', 'sub-admin', 'employee', 'parent', 'coach', 'hr', 'finance', 'center', 'vendor'],
        set: v => v.toLowerCase(),
    },

    studentProfile: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
    },
    employeeProfile: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
    },
    vendorProfile: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
    },
    center: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Center',
    },
    // For Parent Role
    children: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
    }],
    twoFactorSecret: {
        type: Object,
    },
    isTwoFactorEnabled: {
        type: Boolean,
        default: false,
    },
    enrolledCourses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
    }],
    resetPasswordOtp: String,
    resetPasswordOtpExpire: Date,
    profilePic: {
        url: String,
        public_id: String,
        name: String,
    },
}, {
    timestamps: true,
});

userSchema.pre('save', async function () {
    if (!this.password || !this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    if (!this.password) return false;
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
