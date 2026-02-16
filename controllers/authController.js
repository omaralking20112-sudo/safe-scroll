const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// @desc    تسجيل مستخدم جديد
// @route   POST /api/auth/register
exports.register = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { username, email, password } = req.body;

        // التحقق من وجود المستخدم
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: existingUser.email === email 
                    ? 'البريد الإلكتروني موجود مسبقاً'
                    : 'اسم المستخدم موجود مسبقاً'
            });
        }

        // إنشاء مستخدم جديد
        const user = new User({
            username,
            email,
            password
        });

        await user.save();

        // إنشاء توكن
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );

        res.status(201).json({
            success: true,
            message: 'تم إنشاء الحساب بنجاح',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                profilePic: user.profilePic,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في السيرفر'
        });
    }
};

// @desc    تسجيل الدخول
// @route   POST /api/auth/login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // البحث عن المستخدم
        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
            });
        }

        // التحقق من كلمة المرور
        const isMatch = await user.comparePassword(password);
        
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
            });
        }

        // تحديث آخر دخول
        user.lastLogin = Date.now();
        await user.save();

        // إنشاء توكن
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );

        res.json({
            success: true,
            message: 'تم تسجيل الدخول بنجاح',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                profilePic: user.profilePic,
                role: user.role,
                isBanned: user.isBanned
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في السيرفر'
        });
    }
};

// @desc    الحصول على بيانات المستخدم الحالي
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.userId)
            .select('-password')
            .populate('followers', 'username profilePic')
            .populate('following', 'username profilePic');

        res.json({
            success: true,
            user
        });

    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في السيرفر'
        });
    }
};