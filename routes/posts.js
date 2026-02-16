const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Post = require('../models/Post');

// إنشاء منشور جديد
router.post('/', auth, async (req, res) => {
    try {
        const { imageUrl, caption } = req.body;

        const post = new Post({
            user: req.userId,
            imageUrl,
            caption
        });

        await post.save();

        // تحديث عدد منشورات المستخدم
        await User.findByIdAndUpdate(req.userId, {
            $inc: { postsCount: 1 }
        });

        res.status(201).json({
            success: true,
            message: 'تم نشر المنشور بنجاح',
            post
        });

    } catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في إنشاء المنشور'
        });
    }
});

// جلب المنشورات
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const posts = await Post.find({ isApproved: true })
            .populate('user', 'username profilePic')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Post.countDocuments({ isApproved: true });

        res.json({
            success: true,
            posts,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get posts error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في جلب المنشورات'
        });
    }
});

// إعجاب بمنشور
router.post('/:id/like', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'المنشور غير موجود'
            });
        }

        const alreadyLiked = post.likes.includes(req.userId);

        if (alreadyLiked) {
            // إلغاء الإعجاب
            post.likes = post.likes.filter(id => id.toString() !== req.userId);
        } else {
            // إضافة إعجاب
            post.likes.push(req.userId);
        }

        await post.save();

        res.json({
            success: true,
            liked: !alreadyLiked,
            likesCount: post.likes.length
        });

    } catch (error) {
        console.error('Like post error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ'
        });
    }
});

module.exports = router;