const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  kidsSettings: {
    enabled: { type: Boolean, default: false }, // تمكين وضع الأطفال
    timeLimit: { type: Number, default: 60 }, // حدود زمنية بالدقائق (مثل 60 دقيقة)
    allowedSites: [{ type: String }], // قائمة مواقع آمنة (مثل ["example.com"])
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', UserSchema);