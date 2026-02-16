const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Report = require('../models/Report');
const Post = require('../models/Post');
const User = require('../models/User');

// تقديم بلاغ جديد
router.post('/', auth, async (req, res) => {
    try {
        const { reportedUserId, reportedPostId, reason, description } = req.body;

        // التحقق من عدم وجود بلاغ مكرر
        const existingReport = await Report.findOne({
            reporter: req.userId,
            reportedUser: reportedUserId,
            reportedPost: reportedPostId,
            status: 'pending'
        });

        if (existingReport) {
            return res.status(400).json({
                success: false,
                message: 'لقد قمت بالتبليغ مسبقاً'
            });
        }

        // تحديد الأولوية
        let priority = 'normal';
        const criticalReasons = ['nudity', 'violence', 'hate_speech', 'underage'];
        if (criticalReasons.includes(reason)) {
            priority = 'high';
        }

        const report = new Report({
            reporter: req.userId,
            reportedUser: reportedUserId,
            reportedPost: reportedPostId,
            reason,
            description,
            priority
        });

        await report.save();

        // زيادة عدد تقارير المنشور إذا كان موجود
        if (reportedPostId) {
            await Post.findByIdAndUpdate(reportedPostId, {
                $inc: { reportCount: 1 },
                isReported: true
            });
        }

        res.status(201).json({
            success: true,
            message: 'تم تقديم البلاغ بنجاح',
            reportId: report._id
        });

    } catch (error) {
        console.error('Create report error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في تقديم البلاغ'
        });
    }
});

// جلب البلاغات (للمشرفين)
router.get('/admin', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
            return res.status(403).json({
                success: false,
                message: 'غير مصرح'
            });
        }

        const reports = await Report.find({ status: 'pending' })
            .populate('reporter', 'username')
            .populate('reportedUser', 'username')
            .populate('reportedPost')
            .sort({ priority: -1, createdAt: 1 });

        res.json({
            success: true,
            reports
        });

    } catch (error) {
        console.error('Get reports error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ'
        });
    }
});

module.exports = router;