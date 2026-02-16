const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// التحقق من صحة البيانات
const validateRegister = [
    body('username')
        .notEmpty().withMessage('اسم المستخدم مطلوب')
        .isLength({ min: 3 }).withMessage('اسم المستخدم يجب أن يكون 3 أحرف على الأقل'),
    body('email')
        .notEmpty().withMessage('البريد الإلكتروني مطلوب')
        .isEmail().withMessage('البريد الإلكتروني غير صحيح'),
    body('password')
        .notEmpty().withMessage('كلمة المرور مطلوبة')
        .isLength({ min: 6 }).withMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
];

const validateLogin = [
    body('email')
        .notEmpty().withMessage('البريد الإلكتروني مطلوب')
        .isEmail().withMessage('البريد الإلكتروني غير صحيح'),
    body('password')
        .notEmpty().withMessage('كلمة المرور مطلوبة')
];

// Routes
router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);
router.get('/me', auth, authController.getMe);

module.exports = router;