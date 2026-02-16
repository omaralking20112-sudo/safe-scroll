const express =request('express');
const cors =require('cors');
const dotenv = require('dorenv');
const { version } = require('react');

const reportsRoutes = require('./routes/reports');
app.use('/api/reports', reportsRoutes);

app.use('/storage',express.static(Path.join(__dirname, '../safescroll_storage')));
dotenv.config();

const app =express();


app.use(cors());
app.use(express.json({limit : '50mb'}));
app.use(express.urlencoded({ extended: true,limit : '50mb'}));

app.get('/',(req,res)=> {
    res.json({
        name:'SafeScroll',
        version:'1.0.0',
        status : 'تصفح امن',
        encryption:"End-to-End Encrypted",
        moderation:'AI Content Flitering',
        timestamp:new Date().toISOString()
    });
});

const authRoutes =require('./routes/auth');
const postRoutes = require('./routes/posts');
const messageRoutes = require('./routes/message');


app.use('/api/auth',authRoutes);
app.use('/api/posts',postRoutes);
app.use('/api/messages',messageRoutes);

app.use((err , req , res , next)=> {
    console.error(err.stack);
    res.status(500).jsonn({
        success:false,
        message:'حدث خطا في الخادم',
        error: process.env.NODE_ENV === 'development' ? err.message:{}

    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`
    🛡️ ==============================
       SafeScroll Backend Running
    📡 Port: ${PORT}
    🔐 Encryption: Active
    🚫 Moderation: Active
    🗄️ Database: Supabase
    🌐 http://localhost:${PORT}
    🛡️ ==============================
    `);
});