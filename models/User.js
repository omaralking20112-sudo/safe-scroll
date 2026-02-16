const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username:{
        type: String,
        required:true,
        unique:true,
        trim:true,
        minlength:3,
        maxlength:30
    },
    email: {
         required:true,
         unique:true,
         trim:true,
         lowercase: true
    },
    password : {
        type: String,
        required :true
    },
    publicKay:{
        type: String,
        required :true
    },
    encryptedPrivateKay :{
        type: String,
        required :true
    },
    profilePic:{
        type: String,
        default : 'https://cdn-icons-png.flticon.com/512/149/1499071.png'
    },
    bio:{
        type:String,
        maxlength:160,
        default:''
    },
    followers: [{
        type : mongoose.Schema.Types.ObjectId,
        ref:'User'
    }],
    following: [{
        type : mongoose.Schema.Types.ObjectId,
        ref:'User'
    }],
    postsCount:{
        type: Number,
        default:0
    },
    isBanned:{
        type:Boolean,
        default:false
    },
    warnings : {
        type : Number,
        default:0
    },
    createdAt: {
        type: Date,
        default : Date.now
    },
    timestamps: true
    
});

module.exports = mongoose.model('User',userSchema)
