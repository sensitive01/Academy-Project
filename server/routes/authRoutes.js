const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { upload } = require('../config/cloudinary');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const { protect } = require('../middleware/authMiddleware');
const Otp = require('../models/Otp');
const nodemailer = require('nodemailer');

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Auth with Google
// @route   POST /api/auth/google
// @access  Public
router.post('/google', async (req, res) => {
    const { token } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const { name, email, sub: googleId } = ticket.getPayload();

        let user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: 'Account not found. Please complete registration.',
                action: 'REGISTER_GOOGLE',
                googleData: { name, email, googleId }
            });
        } 
        
        if (!user.googleId) {
            // Link existing account to Google
            user.googleId = googleId;
            await user.save();
        }

        // Check if user is blocked
        if (['coach', 'hr', 'employee'].includes(user.role)) {
            const Employee = require('../models/Employee');
            const employee = await Employee.findOne({ user: user._id });
            if (employee && employee.status === 'inactive') {
                return res.status(403).json({ message: 'Your account has been blocked by the administration. Please contact support.' });
            }
        } else if (user.role === 'student') {
            const Student = require('../models/Student');
            const student = await Student.findOne({ user: user._id });
            if (student && student.status === 'inactive') {
                return res.status(403).json({ message: 'Your account has been blocked by the administration. Please contact support.' });
            }
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            center: user.center,
            profilePic: user.profilePic,
            token: generateToken(user._id, user.role),
        });
    } catch (error) {
        console.error('GOOGLE LOGIN ERROR:', error);
        res.status(401).json({ message: 'Google authentication failed' });
    }
});

// @desc    Send OTP for registration
// @route   POST /api/auth/send-otp
// @access  Public
router.post('/send-otp', async (req, res) => {
    const { email } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await Otp.findOneAndUpdate(
            { email },
            { otp, createdAt: new Date() },
            { upsert: true, new: true }
        );

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Email Verification OTP',
            text: `Your OTP for registration is: ${otp}. It will expire in 10 minutes.`,
        });

        res.json({ message: 'OTP sent to your email' });
    } catch (error) {
        console.error('SEND OTP ERROR:', error);
        res.status(500).json({ message: 'Failed to send OTP' });
    }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            // Check if user is blocked
            if (['coach', 'hr', 'employee'].includes(user.role)) {
                const Employee = require('../models/Employee');
                const employee = await Employee.findOne({ user: user._id });
                if (employee && employee.status === 'inactive') {
                    return res.status(403).json({ message: 'Your account has been blocked by the administration. Please contact support.' });
                }
                if (student && student.status === 'inactive') {
                    return res.status(403).json({ message: 'Your account has been blocked by the administration. Please contact support.' });
                }
            } else if (user.role === 'vendor') {
                const Vendor = require('../models/Vendor');
                const vendor = await Vendor.findOne({ user: user._id });
                if (vendor && vendor.status === 'inactive') {
                    return res.status(403).json({ message: 'Your account has been blocked by the administration. Please contact support.' });
                }
            }

            // Check for 2FA
            if (user.isTwoFactorEnabled) {
                return res.json({
                    _id: user._id,
                    requiresTwoFactor: true,
                });
            }

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                center: user.center,
                profilePic: user.profilePic,
                token: generateToken(user._id, user.role),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Validate 2FA token and login
// @route   POST /api/auth/2fa/validate
// @access  Public
router.post('/2fa/validate', async (req, res) => {
    const { userId, token } = req.body;

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret.base32,
            encoding: 'base32',
            token: token,
        });

        if (verified) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                center: user.center,
                profilePic: user.profilePic,
                token: generateToken(user._id, user.role),
            });
        } else {
            res.status(401).json({ message: 'Invalid 2FA code' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Setup 2FA (Generate Secret)
// @route   POST /api/auth/2fa/setup
// @access  Private
router.post('/2fa/setup', protect, async (req, res) => {
    try {
        const secret = speakeasy.generateSecret({
            name: `DRRJ Academy (${req.user.email})`,
        });

        // Save secret to user but don't enable yet
        const user = await User.findById(req.user._id);
        user.twoFactorSecret = secret;
        await user.save();

        qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
            if (err) {
                return res.status(500).json({ message: 'Error generating QR code' });
            }
            res.json({ secret: secret.base32, qrCode: data_url });
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Enable 2FA (Verify and Enable)
// @route   POST /api/auth/2fa/enable
// @access  Private
router.post('/2fa/enable', protect, async (req, res) => {
    const { token } = req.body;

    try {
        const user = await User.findById(req.user._id);

        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret.base32,
            encoding: 'base32',
            token: token,
        });

        if (verified) {
            user.isTwoFactorEnabled = true;
            await user.save();
            res.json({ message: '2FA Enabled Successfully' });
        } else {
            res.status(400).json({ message: 'Invalid Code' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Disable 2FA
// @route   POST /api/auth/2fa/disable
// @access  Private
router.post('/2fa/disable', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        user.isTwoFactorEnabled = false;
        user.twoFactorSecret = undefined;
        await user.save();
        res.json({ message: '2FA Disabled' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate("center", "name location");
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            role: user.role,
            center: user.center,
            profilePic: user.profilePic,
            isTwoFactorEnabled: user.isTwoFactorEnabled,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, upload.single('profilePic'), async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;
            user.mobile = req.body.mobile || user.mobile;
            
            if (req.body.email && req.body.email !== user.email) {
                // Verify OTP for email change
                const { otp } = req.body;
                if (!otp) {
                    return res.status(400).json({ message: "OTP is required to change email" });
                }
                const otpRecord = await Otp.findOne({ email: req.body.email, otp });
                if (!otpRecord) {
                    return res.status(400).json({ message: "Invalid or expired OTP" });
                }
                // Delete OTP after verification
                await Otp.deleteOne({ _id: otpRecord._id });
                
                user.email = req.body.email;
            }

            if (req.file) {
                user.profilePic = {
                    url: req.file.path,
                    public_id: req.file.filename,
                    name: req.file.originalname,
                };
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                mobile: updatedUser.mobile,
                role: updatedUser.role,
                profilePic: updatedUser.profilePic,
                isTwoFactorEnabled: updatedUser.isTwoFactorEnabled,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update user password
// @route   PUT /api/auth/password
// @access  Private
router.put('/password', protect, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    try {
        const user = await User.findById(req.user._id);

        if (user && (await user.matchPassword(currentPassword))) {
            user.password = newPassword;
            await user.save();
            res.json({ message: 'Password updated successfully' });
        } else {
            res.status(401).json({ message: 'Invalid current password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Register a new user (student or parent)
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
    const { name, email, mobile, password, role, children, otp, googleId } = req.body;

    try {
        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // OTP verification (skip if Google registration)
        if (!googleId) {
            const otpRecord = await Otp.findOne({ email, otp });
            if (!otpRecord) {
                return res.status(400).json({ message: 'Invalid or expired OTP' });
            }
            // Delete OTP after verification
            await Otp.deleteOne({ _id: otpRecord._id });
        }

        // Create user object safely
        const userData = {
            name,
            email,
            mobile,
            password,
            googleId,
            role: role || 'student',
        };

        // Only add children array if role is parent
        if (role === 'parent') {
            userData.children = Array.isArray(children) ? children : [];
        }

        const user = await User.create(userData);

        if (!user) {
            return res.status(400).json({ message: 'Invalid user data' });
        }

        if (user.role === 'student') {
            const Student = require('../models/Student');
            
            // Generate Student ID
            const year = new Date().getFullYear();
            const random = Math.floor(1000 + Math.random() * 9000);
            const studentId = `STU-${year}-${random}`;

            const studentProfile = await Student.create({
                user: user._id,
                studentId,
                studentNameEnglish: user.name,
                email: user.email,
                phone: user.mobile
            });
            user.studentProfile = studentProfile._id;
            await user.save();
        }

        // If parent and children provided, update students to link to this parent
        if (role === 'parent' && children && children.length > 0) {
            const Student = require('../models/Student');
            await Student.updateMany(
                { _id: { $in: children } },
                { $set: { parent: user._id } }
            );
        }

        // Return user info and token
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            role: user.role,
            children: user.children || [],
            token: generateToken(user._id, user.role),
        });
    } catch (error) {
        console.error('REGISTER ERROR:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Register a new parent (Admin Only)
// @route   POST /api/auth/register-parent
// @access  Private (Admin)
router.post('/register-parent', protect, async (req, res) => {
    // Only Admin can create parents this way
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized as admin' });
    }

    const { name, email, password, mobile, studentIds } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            mobile,
            password,
            role: 'parent',
            children: studentIds || []
        });

        if (user) {
            // Also update the Students to link back to this parent
            if (studentIds && studentIds.length > 0) {
                const Student = require('../models/Student'); // Import here to avoid circular dependency issues at top if any
                await Student.updateMany(
                    { _id: { $in: studentIds } },
                    { $set: { parent: user._id } }
                );
            }

            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                children: user.children
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all administrative users (Admin Only)
// @route   GET /api/auth/admin-users
// @access  Private (Admin)
router.get('/admin-users', protect, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized as admin' });
    }

    try {
        const users = await User.find({
            role: { $in: ['admin', 'sub-admin', 'hr', 'finance', 'vendor'] }
        }).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create an administrative user (Admin Only)
// @route   POST /api/auth/create-admin-user
// @access  Private (Admin)
router.post('/create-admin-user', protect, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized as admin' });
    }

    const { name, email, password, role, mobile } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
            role,
            mobile
        });

        if (user) {
            // For roles that might need a profile, we could trigger creation here,
            // but for simple "logins" as requested, this is sufficient.
            // If they need to add full details, they can go to HR/Vendor management.
            
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update administrative user
// @route   PUT /api/auth/admin-users/:id
// @access  Private (Admin)
router.put('/admin-users/:id', protect, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized as admin' });
    }

    try {
        const user = await User.findById(req.params.id);
        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            user.mobile = req.body.mobile || user.mobile;
            user.role = req.body.role || user.role;
            if (req.body.password) {
                user.password = req.body.password;
            }
            const updatedUser = await user.save();
            res.json(updatedUser);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete administrative user
// @route   DELETE /api/auth/admin-users/:id
// @access  Private (Admin)
router.delete('/admin-users/:id', protect, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized as admin' });
    }

    try {
        const user = await User.findById(req.params.id);
        if (user) {
            await user.deleteOne();
            res.json({ message: 'User removed' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
