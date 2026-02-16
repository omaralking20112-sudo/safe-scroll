const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reportedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reportedPost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    },
    reason: {
        type: String,
        required: true,
        enum: [
            'spam',
            'harassment',
            'nudity',
            'violence',
            'hate_speech',
            'scam',
            'underage',
            'other'
        ]
    },
    description: {
        type: String,
        maxlength: 500
    },
    status: {
        type: String,
        enum: ['pending', 'reviewing', 'resolved', 'rejected'],
        default: 'pending'
    },
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'critical'],
        default: 'normal'
    },
    action: {
        type: String,
        enum: ['none', 'warning', 'post_removed', 'user_banned'],
        default: 'none'
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: Date
}, {
    timestamps: true
});

// فهارس للبحث السريع
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ reporter: 1, reportedUser: 1 });
reportSchema.index({ priority: 1, status: 1 });

module.exports = mongoose.model('Report', reportSchema);