
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    // معرف المستخدم صاحب المنشور
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'معرف المستخدم مطلوب'],
        index: true
    },
    
    // رابط الصورة (مخزنة في Cloudinary أو تخزين محلي)
    imageUrl: {
        type: String,
        required: [true, 'رابط الصورة مطلوب']
    },
    
    // معرف الصورة في التخزين (للحذف)
    imagePublicId: {
        type: String
    },
    
    // نص المنشور
    caption: {
        type: String,
        maxlength: [2200, 'النص طويل جداً (الحد الأقصى 2200 حرف)'],
        default: ''
    },
    
    // الموقع (اختياري)
    location: {
        type: String,
        maxlength: [100, 'اسم الموقع طويل جداً']
    },
    
    // قائمة الإعجابات
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    
    // عدد الإعجابات (للسرعة)
    likesCount: {
        type: Number,
        default: 0
    },
    
    // التعليقات
    comments: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        text: {
            type: String,
            required: [true, 'نص التعليق مطلوب'],
            maxlength: [500, 'التعليق طويل جداً']
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // عدد التعليقات (للسرعة)
    commentsCount: {
        type: Number,
        default: 0
    },
    
    // حالة الموافقة (للرقابة)
    isApproved: {
        type: Boolean,
        default: true,
        index: true
    },
    
    // هل تم التبليغ عنه؟
    isReported: {
        type: Boolean,
        default: false
    },
    
    // عدد مرات التبليغ
    reportCount: {
        type: Number,
        default: 0
    },
    
    // درجة المحتوى (للرقابة)
    moderationScore: {
        type: Number,
        min: 0,
        max: 1,
        default: 0
    },
    
    // هل هو مناسب للأطفال؟
    isKidFriendly: {
        type: Boolean,
        default: true
    }

}, {
    timestamps: true, // يضيف created_at و updated_at تلقائياً
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

//  الفهارس للبحث السريع
postSchema.index({ user: 1, createdAt: -1 });
postSchema.index({ isApproved: 1, createdAt: -1 });
postSchema.index({ isKidFriendly: 1, createdAt: -1 });
postSchema.index({ likesCount: -1 });
postSchema.index({ createdAt: -1 });

//  تحديث likesCount تلقائياً عند إضافة/إزالة إعجاب
postSchema.pre('save', function(next) {
    this.likesCount = this.likes.length;
    this.commentsCount = this.comments.length;
    next();
});

//  حذف التعليقات عند حذف المنشور (إذا أردت)
postSchema.pre('remove', async function(next) {
    // يمكن إضافة منطق لحذف التعليقات المرتبطة
    next();
});

//  دوال مساعدة
postSchema.methods = {
    // إضافة إعجاب
    async addLike(userId) {
        if (!this.likes.includes(userId)) {
            this.likes.push(userId);
            await this.save();
        }
        return this;
    },
    
    // إزالة إعجاب
    async removeLike(userId) {
        this.likes = this.likes.filter(id => id.toString() !== userId.toString());
        await this.save();
        return this;
    },
    
    // التحقق من إعجاب مستخدم
    isLikedBy(userId) {
        return this.likes.some(id => id.toString() === userId.toString());
    },
    
    // إضافة تعليق
    async addComment(userId, text) {
        this.comments.push({
            user: userId,
            text: text
        });
        await this.save();
        return this.comments[this.comments.length - 1];
    },
    
    // حذف تعليق
    async removeComment(commentId) {
        this.comments = this.comments.filter(c => c._id.toString() !== commentId.toString());
        await this.save();
        return this;
    }
};


//  دوال ثابتة
postSchema.statics = {
    // جلب منشورات مستخدم
    async getUserPosts(userId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        return this.find({ user: userId, isApproved: true })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('user', 'username profilePic');
    },
    
    // جلب المنشورات الشائعة
    async getPopularPosts(limit = 10) {
        return this.find({ isApproved: true })
            .sort({ likesCount: -1, createdAt: -1 })
            .limit(limit)
            .populate('user', 'username profilePic');
    },
    
    // جلب منشورات مناسبة للأطفال
    async getKidFriendlyPosts(limit = 20) {
        return this.find({ 
            isApproved: true, 
            isKidFriendly: true 
        })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('user', 'username profilePic');
    }
};

module.exports = mongoose.model('Post', postSchema);