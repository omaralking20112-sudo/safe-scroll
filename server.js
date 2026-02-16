
const user = newUser.rows[0];

        // إنشاء توكن
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET || 'safescroll_secret_key',
            { expiresIn: '30d' }
        );

        res.status(201).json({
            success: true,
            message: '✅ تم إنشاء الحساب بنجاح',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                profilePic: user.profile_pic
            }
        });

     catch (err) {
        console.error('❌ Register error:', err);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في السيرفر',
            error: err.message
        });
    }
});

// تسجيل الدخول
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // البحث عن المستخدم
        const result = await query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
            });
        }

        const user = result.rows[0];

        // التحقق من كلمة المرور
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
            });
        }

        // إنشاء توكن
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET || 'safescroll_secret_key',
            { expiresIn: '30d' }
        );

        res.json({
            success: true,
            message: '✅ تم تسجيل الدخول بنجاح',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                profilePic: user.profile_pic,
                role: user.role,
                isBanned: user.is_banned
            }
        });

    } catch (err) {
        console.error('❌ Login error:', err);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في السيرفر'
        });
    }
});

// Middleware للتحقق من التوكن
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'الوصول مرفوض. لا يوجد توكن'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'safescroll_secret_key');
        req.userId = decoded.userId;
        req.username = decoded.username;
        next();

    } catch (err) {
        res.status(401).json({
            success: false,
            message: 'التوكن غير صالح'
        });
    }
};

// الحصول على بيانات المستخدم الحالي
app.get('/api/auth/me', auth, async (req, res) => {
    try {
        const result = await query(
            SELECT id, username, email, profile_pic, bio, role, is_banned, 
                    warnings, posts_count, created_at
             FROM users WHERE id = $1,
            [req.userId]
        );

        res.json({
            success: true,
            user: result.rows[0]
        });

    } catch (err) {
        console.error('❌ Get me error:', err);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في السيرفر'
        });
    }
});

// ==================== Posts Routes ====================
// إنشاء منشور جديد
app.post('/api/posts', auth, async (req, res) => {
    try {
        const { imageUrl, caption } = req.body;

        const result = await query(
            INSERT INTO posts (user_id, image_url, caption)
             VALUES ($1, $2, $3) RETURNING *,
            [req.userId, imageUrl, caption]
        );


// تحديث عدد منشورات المستخدم
        await query(
            'UPDATE users SET posts_count = posts_count + 1 WHERE id = $1',
            [req.userId]
        );

        res.status(201).json({
            success: true,
            message: '✅ تم نشر المنشور بنجاح',
            post: result.rows[0]
        });

    } catch (err) {
        console.error('❌ Create post error:', err);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في إنشاء المنشور'
        });
    }
});

// جلب المنشورات
app.get('/api/posts', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const result = await query(
            SELECT p.*, u.username, u.profile_pic,
                    (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
                    (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
             FROM posts p
             JOIN users u ON p.user_id = u.id
             WHERE p.is_approved = true
             ORDER BY p.created_at DESC
             LIMIT $1 OFFSET $2,
            [limit, offset]
        );

        const totalResult = await query('SELECT COUNT(*) as total FROM posts WHERE is_approved = true');

        res.json({
            success: true,
            posts: result.rows,
            pagination: {
                page,
                limit,
                total: parseInt(totalResult.rows[0].total),
                pages: Math.ceil(totalResult.rows[0].total / limit)
            }
        });

    } catch (err) {
        console.error('❌ Get posts error:', err);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في جلب المنشورات'
        });
    }
});

// إعجاب بمنشور
app.post('/api/posts/:id/like', auth, async (req, res) => {
    try {
        const postId = req.params.id;

        // التحقق من وجود إعجاب
        const existingLike = await query(
            'SELECT * FROM likes WHERE user_id = $1 AND post_id = $2',
            [req.userId, postId]
        );

        if (existingLike.rows.length > 0) {
            // إلغاء الإعجاب
            await query(
                'DELETE FROM likes WHERE user_id = $1 AND post_id = $2',
                [req.userId, postId]
            );

            await query(
                'UPDATE posts SET likes_count = likes_count - 1 WHERE id = $1',
                [postId]
            );

            res.json({
                success: true,
                liked: false,
                message: 'تم إلغاء الإعجاب'
            });
        } else {
            // إضافة إعجاب
            await query(
                'INSERT INTO likes (user_id, post_id) VALUES ($1, $2)',
                [req.userId, postId]
            );

            await query(
                'UPDATE posts SET likes_count = likes_count + 1 WHERE id = $1',
                [postId]
            );

            res.json({
                success: true,
                liked: true,
                message: '✅ تم الإعجاب'
            });
        }

    } catch (err) {
        console.error('❌ Like error:', err);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ'
        });
    }
});

// ==================== معالجة الأخطاء ====================
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err.stack);
    res.status(500).json({
        success: false,
        message: 'حدث خطأ في الخادم',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

// ==================== تشغيل الخادم ====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(
    🚀 ==============================
       SafeScroll API is running
    📡 Port: ${PORT}
    🗄️  Database: PostgreSQL
    🌍 Environment: ${process.env.NODE_ENV || 'development'}
    🔗 http://localhost:${PORT}
    🚀 ==============================
    );
});

module.exports = app;
