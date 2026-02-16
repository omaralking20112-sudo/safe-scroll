const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const KidsSettings = require('../models/KidsSettings');

// الحصول على إعدادات وضع الأطفال
router.get('/settings', auth, async (req, res) => {
    try {
        let settings = await KidsSettings.findOne({ user: req.userId });

        if (!settings) {
            settings = new KidsSettings({ user: req.userId });
            await settings.save();
        }

        res.json({
            success: true,
            settings: {
                isEnabled: settings.isEnabled,
                ageGroup: settings.ageGroup,
                timeLimit: settings.timeLimit,
                contentLevel: settings.contentLevel,
                allowedCategories: settings.allowedCategories
            }
        });

    } catch (error) {
        console.error('Get kids settings error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ'
        });
    }
});

// تحديث إعدادات وضع الأطفال
router.put('/settings', auth, async (req, res) => {
    try {
        const { isEnabled, pinCode, ageGroup, timeLimit, contentLevel } = req.body;

        const settings = await KidsSettings.findOneAndUpdate(
            { user: req.userId },
            {
                isEnabled,
                pinCode: pinCode ? require('bcryptjs').hashSync(pinCode, 10) : undefined,
                ageGroup,
                timeLimit,
                contentLevel
            },
            { new: true, upsert: true }
        );

        res.json({
            success: true,
            message: isEnabled ? 'تم تفعيل وضع الأطفال' : 'تم إلغاء وضع الأطفال',
            settings
        });

    } catch (error) {
        console.error('Update kids settings error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ'
        });
    }
});

// التحقق من الرقم السري
router.post('/verify-pin', auth, async (req, res) => {
    try {
        const { pinCode } = req.body;
        const settings = await KidsSettings.findOne({ user: req.userId });

        if (!settings || !settings.pinCode) {
            return res.status(400).json({
                success: false,
                message: 'لم يتم إعداد رقم سري'
            });
        }

        const isValid = require('bcryptjs').compareSync(pinCode, settings.pinCode);

        res.json({
            success: isValid,
            message: isValid ? '✅ الرقم صحيح' : '❌ الرقم خطأ'
        });

    } catch (error) {
        console.error('Verify pin error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ'
        });
    }
});

module.exports = router;