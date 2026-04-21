const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_change_in_production';

// MongoDB setup
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/InCreEdu';
mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

/**
 * Mongoose Schemas & Models
 */
// Learner documents (formerly "student")
const learnerSchema = new mongoose.Schema({
    user_id: { type: String, unique: true, required: true },
    password_hash: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    full_name: String,
    institution: String,
    created_at: { type: Date, default: Date.now },
    is_active: { type: Boolean, default: true }
}, { collection: 'learner_info' });
const Learner = mongoose.model('Learner', learnerSchema);

// Teacher documents with verification flag
const teacherSchema = new mongoose.Schema({
    user_id: { type: String, unique: true, required: true },
    password_hash: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    full_name: String,
    institution: String,
    created_at: { type: Date, default: Date.now },
    is_active: { type: Boolean, default: true },
    is_verified: { type: Boolean, default: false },
    verification_date: Date,
    verified_by: String,
    // Assigned domains determine what this teacher can upload to
    assigned_domains: { type: [String], default: [] },
    primary_domain: { type: String, default: null }
}, { collection: 'teacher_info' });
const Teacher = mongoose.model('Teacher', teacherSchema);

// Admin documents for system administration
const adminSchema = new mongoose.Schema({
    user_id: { type: String, unique: true, required: true },
    password_hash: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    full_name: String,
    created_at: { type: Date, default: Date.now },
    is_active: { type: Boolean, default: true },
    role: { type: String, default: 'admin' }
}, { collection: 'admin_info' });
const Admin = mongoose.model('Admin', adminSchema);

// login log with dynamic reference based on userType
const loginLogSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'userType' },
    userType: { type: String, required: true, enum: ['Learner', 'Teacher', 'Admin'] },
    login_time: { type: Date, default: Date.now },
    ip_address: String,
    device_info: String,
    logout_time: Date,
    session_duration: Number
});
const LoginLog = mongoose.model('LoginLog', loginLogSchema);

const passwordResetSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'userType' },
    userType: { type: String, required: true, enum: ['Learner', 'Teacher', 'Admin'] },
    reset_token: { type: String, unique: true, required: true },
    expires_at: Date,
    used: { type: Boolean, default: false }
});
const PasswordReset = mongoose.model('PasswordReset', passwordResetSchema);

// Progress only for learners
const userProgressSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Learner', required: true, unique: true },
    selected_domain: String,
    selected_role: String,
    current_level: { type: Number, default: 0 },
    completed_tasks: { type: [String], default: [] },
    total_tasks: { type: Number, default: 0 },
    progress_percentage: { type: Number, default: 0 },
    last_updated: { type: Date, default: Date.now },
    goals: { type: [String], default: [] }
});
const UserProgress = mongoose.model('UserProgress', userProgressSchema);

// Teacher Verification with detailed credentials
const teacherVerificationSchema = new mongoose.Schema({
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true, unique: true },
    credentials: String,
    expertise_domains: [String],
    years_of_experience: Number,
    verification_status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    verification_date: Date,
    verified_by: String,
    submission_date: { type: Date, default: Date.now },
    documents: [String],
    notes: String
}, { collection: 'teacher_verification' });
const TeacherVerification = mongoose.model('TeacherVerification', teacherVerificationSchema);

// Enhanced Course schema with full metadata and statistics
const courseSchema = new mongoose.Schema({
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
    title: { type: String, required: true },
    description: String,
    domain: { type: String, required: true }, // e.g., 'Technology', 'Business', etc.
    role: { type: String, required: true }, // e.g., 'Developer', 'Manager', etc.
    level: { type: Number, enum: [1, 2, 3, 4], required: true },
    video_url: { type: String, required: true },
    thumbnail_url: String,
    duration_minutes: Number,
    views: { type: Number, default: 0 },
    enrolled_learners: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    number_of_reviews: { type: Number, default: 0 },
    is_published: { type: Boolean, default: true },
    tags: [String],
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
}, { collection: 'courses' });
const Course = mongoose.model('Course', courseSchema);

// Course Analytics tracking
const courseAnalyticsSchema = new mongoose.Schema({
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, unique: true },
    total_views: { type: Number, default: 0 },
    unique_viewers: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    total_enrolled: { type: Number, default: 0 },
    enrolled_learners: [
        {
            learner: { type: mongoose.Schema.Types.ObjectId, ref: 'Learner' },
            enrolled_date: { type: Date, default: Date.now },
            completed: { type: Boolean, default: false },
            completion_date: Date,
            rating: Number,
            review: String
        }
    ],
    average_completion_time_minutes: Number,
    completion_rate: Number,
    last_updated: { type: Date, default: Date.now }
}, { collection: 'course_analytics' });
const CourseAnalytics = mongoose.model('CourseAnalytics', courseAnalyticsSchema);

// Course videos uploaded by teachers (legacy - kept for compatibility)
const courseVideoSchema = new mongoose.Schema({
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
    domain: { type: String, required: true },
    level: { type: Number, enum: [1, 2, 3, 4], required: true },
    url: { type: String, required: true },
    uploaded_at: { type: Date, default: Date.now }
});
const CourseVideo = mongoose.model('CourseVideo', courseVideoSchema);

// Quiz Questions mapped to domains
const questionSchema = new mongoose.Schema({
    text: { type: String, required: true },
    options: [{
        text: { type: String, required: true },
        domain: { type: String, required: true, enum: ['tech', 'business', 'creative', 'healthcare', 'education'] } // Matches current logic
    }]
}, { collection: 'questions' });
const Question = mongoose.model('Question', questionSchema);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure upload directory exists
const uploadDir = path.join(__dirname, 'uploads', 'courses');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, 'course-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Authentication middleware
const authenticateToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                status: 'error',
                message: 'No token provided'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({
            status: 'error',
            message: 'Invalid or expired token'
        });
    }
};

// Seed sample data when database is empty
async function seedDatabase() {
    const learnerCount = await Learner.countDocuments();
    const teacherCount = await Teacher.countDocuments();
    const adminCount = await Admin.countDocuments();

    if (learnerCount === 0) {
        const samplePassword = 'demo123';
        const hashedPassword = bcrypt.hashSync(samplePassword, 10);

        const learners = [
            { user_id: 'LRN123456', password_hash: hashedPassword, email: 'learner1@university.com', full_name: 'Alice Johnson', institution: 'University A' },
            { user_id: 'LRN234567', password_hash: hashedPassword, email: 'learner2@university.com', full_name: 'Bob Smith', institution: 'University B' },
            { user_id: 'LRN345678', password_hash: hashedPassword, email: 'learner3@university.com', full_name: 'Carol White', institution: 'University C' }
        ];
        await Learner.insertMany(learners);
        console.log('✓ Sample learners inserted');
    }
    if (teacherCount === 0) {
        const samplePassword = 'demo123';
        const hashedPassword = bcrypt.hashSync(samplePassword, 10);
        const teachers = [
            { user_id: 'TCH789012', password_hash: hashedPassword, email: 'teacher1@university.com', full_name: 'Prof. David Brown', institution: 'University A', is_verified: true, primary_domain: 'Technology', assigned_domains: ['Technology'] },
            { user_id: 'TCH890123', password_hash: hashedPassword, email: 'teacher2@university.com', full_name: 'Prof. Emma Davis', institution: 'University B', is_verified: true, primary_domain: 'Business', assigned_domains: ['Business'] },
            { user_id: 'TCH901234', password_hash: hashedPassword, email: 'teacher3@university.com', full_name: 'Prof. Frank Wilson', institution: 'University C', is_verified: true, primary_domain: 'Creative', assigned_domains: ['Creative'] }
        ];
        await Teacher.insertMany(teachers);
        console.log('✓ Sample teachers inserted');
    }
    if (adminCount === 0) {
        const adminPassword = 'admin123';
        const hashedPassword = bcrypt.hashSync(adminPassword, 10);
        const admins = [
            { user_id: 'ADM123456', password_hash: hashedPassword, email: 'admin@increedu.com', full_name: 'System Administrator', institution: 'InCreEdu' }
        ];
        await Admin.insertMany(admins);
        console.log('✓ Sample admin inserted');
    }
}

mongoose.connection.once('open', () => {
    seedDatabase().catch(err => console.error('Seed error:', err));
});

// Test Database Connection
app.get('/api/health', (req, res) => {
    if (mongoose.connection.readyState === 1) {
        res.json({
            status: 'success',
            message: 'Database connection successful',
            database: 'MongoDB',
            timestamp: new Date().toISOString()
        });
    } else {
        res.status(500).json({
            status: 'error',
            message: 'Database not connected',
            database: 'MongoDB',
            timestamp: new Date().toISOString()
        });
    }
});

// ==================== QUIZ API ====================

// Clear all questions (Admin use to reset databank)
app.delete('/api/questions', async (req, res) => {
    try {
        const result = await Question.deleteMany({});
        res.json({ status: 'success', deletedCount: result.deletedCount, message: `Successfully cleared ${result.deletedCount} old questions.` });
    } catch (err) {
        console.error('Clear questions error:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// Add Question (Admin or internal use to populate quiz databank)
app.post('/api/add-question', async (req, res) => {
    try {
        const payload = Array.isArray(req.body) ? req.body : [req.body];
        
        // Basic validation
        payload.forEach(q => {
            if (!q.text || !q.options || q.options.length === 0) {
                throw new Error("Invalid question format. Must include 'text' and 'options' array.");
            }
        });

        const result = await Question.insertMany(payload);
        res.status(201).json({ status: 'success', insertedCount: result.length, data: result });
    } catch (err) {
        console.error('Add question error:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// Get random questions for the assessment
app.get('/api/questions', async (req, res) => {
    try {
        // Fetch 10 random questions from DB using $sample aggregation
        const questions = await Question.aggregate([{ $sample: { size: 10 } }]);
        
        if (!questions || questions.length === 0) {
            return res.status(404).json({ status: 'error', message: 'No questions found in the database. Please add questions first.' });
        }
        
        res.json({ status: 'success', questions });
    } catch (err) {
        console.error('Get questions error:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// Submit generic quiz answers and compute dominant career path
app.post('/api/submit-answers', async (req, res) => {
    try {
        const { answers } = req.body; // e.g., ["tech", "business", "tech"]
        if (!Array.isArray(answers) || answers.length === 0) {
            return res.status(400).json({ status: 'error', message: 'Answers array is required and cannot be empty.' });
        }
        
        const counts = {};
        answers.forEach(domain => {
            counts[domain] = (counts[domain] || 0) + 1;
        });

        let maxDomain = answers[0];
        let maxCount = 0;
        for (const [domain, count] of Object.entries(counts)) {
            if (count > maxCount) {
                maxCount = count;
                maxDomain = domain;
            }
        }
        
        res.json({
            status: 'success',
            result: maxDomain,
            score: counts
        });
    } catch (err) {
        console.error('Submit answers error:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// ==================== EXTERNAL API ====================

// Get Jobs Route (Using free Remotive API)
// Native fetch is available in Node.js >= 18
app.get('/api/jobs', async (req, res) => {
    try {
        const { domain, location } = req.query;
        let apiUrl = 'https://remotive.com/api/remote-jobs?limit=15';
        
        // Map common domains to better search terms for Remotive
        let searchDomain = domain;
        if (domain && typeof domain === 'string') {
            const cleanDomain = domain.toLowerCase();
            if (cleanDomain.includes('software') || cleanDomain.includes('web') || cleanDomain.includes('frontend') || cleanDomain.includes('backend')) {
                searchDomain = 'developer';
            } else if (cleanDomain.includes('data')) {
                searchDomain = 'data';
            } else if (cleanDomain.includes('hardware') || cleanDomain.includes('network') || cleanDomain.includes('cloud')) {
                searchDomain = 'engineer';
            } else if (cleanDomain.includes('business') || cleanDomain.includes('management')) {
                searchDomain = 'product';
            }
            apiUrl += `&search=${encodeURIComponent(searchDomain)}`;
        }
        
        console.log(`[Jobs] Fetching for domain: "${domain}", location: "${location}"`);
        
        const response = await axios.get(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'application/json'
            },
            timeout: 10000 // 10 second timeout
        });
        
        const data = response.data;
        
        let jobs = data.jobs || [];
        console.log(`[Jobs] Found ${jobs.length} jobs from Remotive`);
        
        // Location filtering: Remotive is global/remote, but we can filter by candidate_required_location
        if (location && location.toLowerCase() !== 'remote' && location.toLowerCase() !== 'anywhere') {
            const locLower = location.toLowerCase();
            const originalCount = jobs.length;
            jobs = jobs.filter(job => {
                const reqLoc = (job.candidate_required_location || '').toLowerCase();
                const title = (job.title || '').toLowerCase();
                return reqLoc.includes(locLower) || 
                       reqLoc.includes('worldwide') || 
                       reqLoc.includes('anywhere') || 
                       reqLoc.includes('global') ||
                       title.includes(locLower);
            });
            console.log(`[Jobs] Filtered from ${originalCount} to ${jobs.length} for location: ${location}`);
        }
        
        // Map to expected format
        const formattedJobs = jobs.map(job => ({
            title: job.title,
            company: job.company_name,
            location: job.candidate_required_location || 'Remote',
            type: job.job_type ? job.job_type.replace('_', ' ') : 'Full-time',
            apply_link: job.url,
            salary: job.salary || 'Competitive',
            logo: job.company_logo_url
        }));
        
        res.json({
            status: 'success',
            jobs: formattedJobs
        });
    } catch (error) {
        console.error('[Jobs] API Error:', error.message);
        if (error.response) {
            console.error('[Jobs] Response Status:', error.response.status);
        }
        
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch job opportunities',
            details: error.message
        });
    }
});


// Login Route
app.post('/api/login', async (req, res) => {
    try {
        const { user_id, password, user_type } = req.body;

        // Validate input
        if (!user_id || !password) {
            return res.status(400).json({
                status: 'error',
                message: 'User ID and password are required'
            });
        }

        if (!user_type || !['learner', 'teacher', 'admin'].includes(user_type)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid user type'
            });
        }

        let user;
        if (user_type === 'learner') {
            user = await Learner.findOne({ user_id });
        } else if (user_type === 'teacher') {
            user = await Teacher.findOne({ user_id });
        } else if (user_type === 'admin') {
            user = await Admin.findOne({ user_id });
        }

        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid user ID or password'
            });
        }

        if (!user.is_active) {
            return res.status(403).json({
                status: 'error',
                message: 'Account is disabled. Please contact support.'
            });
        }

        // Allow teachers to authenticate even if not verified so they can
        // access their limited dashboard and see verification status.
        // Protected operations (uploading courses) still check `is_verified`.

        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            await LoginLog.create({ user: user._id, userType: user_type === 'learner' ? 'Learner' : user_type === 'teacher' ? 'Teacher' : 'Admin', ip_address: req.ip, device_info: req.get('user-agent') });
            return res.status(401).json({
                status: 'error',
                message: 'Invalid user ID or password'
            });
        }

        const token = jwt.sign(
            {
                id: user._id,
                user_id: user.user_id,
                user_type: user_type,
                email: user.email
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        await LoginLog.create({ user: user._id, userType: user_type === 'learner' ? 'Learner' : user_type === 'teacher' ? 'Teacher' : 'Admin', ip_address: req.ip, device_info: req.get('user-agent') });

        res.json({
            status: 'success',
            message: 'Login successful',
            token: token,
            user: {
                id: user._id,
                user_id: user.user_id,
                user_type: user_type,
                email: user.email,
                full_name: user.full_name
            },
            is_verified: user.is_verified || false
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error during login',
            error: error.message
        });
    }
});



// User Registration Route
app.post('/api/register', async (req, res) => {
    try {
        const { user_id, user_type, full_name, email, institution, password } = req.body;

        // Validate input
        if (!user_id || !password || !full_name || !email) {
            return res.status(400).json({
                status: 'error',
                message: 'All fields are required'
            });
        }

        // Validate user type
        if (!user_type || !['learner', 'teacher'].includes(user_type)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid user type'
            });
        }

        // Validate user_id format
        if (user_id.length < 6) {
            return res.status(400).json({
                status: 'error',
                message: 'User ID must be at least 6 characters'
            });
        }

        // Validate password strength
        if (password.length < 6) {
            return res.status(400).json({
                status: 'error',
                message: 'Password must be at least 6 characters'
            });
        }

        if (!/\d/.test(password)) {
            return res.status(400).json({
                status: 'error',
                message: 'Password must contain at least one number'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid email format'
            });
        }

        // check duplicates in appropriate collection
        const existsInLearners = await Learner.findOne({ user_id });
        const existsInTeachers = await Teacher.findOne({ user_id });
        const existsInAdmins = await Admin.findOne({ user_id });
        if (existsInLearners || existsInTeachers || existsInAdmins) {
            return res.status(409).json({
                status: 'error',
                message: 'User ID already exists. Please choose a different ID.'
            });
        }

        const emailExists = await Learner.findOne({ email }) || await Teacher.findOne({ email }) || await Admin.findOne({ email });
        if (emailExists) {
            return res.status(409).json({
                status: 'error',
                message: 'Email already registered. Please use a different email.'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        let newUser;
        if (user_type === 'learner') {
            newUser = await Learner.create({
                user_id,
                password_hash: hashedPassword,
                email,
                full_name,
                institution: institution || null
            });
        } else if (user_type === 'teacher') {
            // teacher registration starts unverified
            newUser = await Teacher.create({
                user_id,
                password_hash: hashedPassword,
                email,
                full_name,
                institution: institution || null,
                is_verified: false
            });
        }

        const token = jwt.sign(
            {
                id: newUser._id,
                user_id: newUser.user_id,
                user_type: user_type,
                email: newUser.email
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Log registration as first login
        await LoginLog.create({ user: newUser._id, userType: user_type === 'learner' ? 'Learner' : user_type === 'teacher' ? 'Teacher' : 'Admin', ip_address: req.ip, device_info: req.get('user-agent') });

        res.status(201).json({
            status: 'success',
            message: 'Account created successfully',
            token: token,
            user: {
                id: newUser._id,
                user_id: newUser.user_id,
                user_type: user_type,
                email: newUser.email,
                full_name: newUser.full_name
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error during registration',
            error: error.message
        });
    }
});



// Verify Token Route
app.post('/api/verify-token', (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1] || req.body.token;

        if (!token) {
            return res.status(401).json({
                status: 'error',
                message: 'No token provided'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        res.json({
            status: 'success',
            message: 'Token is valid',
            user: decoded
        });

    } catch (error) {
        res.status(401).json({
            status: 'error',
            message: 'Invalid or expired token',
            error: error.message
        });
    }
});

// Get User Profile Route
app.get('/api/user/:user_id', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                status: 'error',
                message: 'No token provided'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        // determine which model to query based on token
        let user;
        if (decoded.user_type === 'learner') {
            user = await Learner.findOne({ user_id: req.params.user_id }).select('-password_hash -__v');
        } else if (decoded.user_type === 'teacher') {
            user = await Teacher.findOne({ user_id: req.params.user_id }).select('-password_hash -__v');
        }

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        res.json({
            status: 'success',
            user: user
        });
    } catch (error) {
        res.status(401).json({
            status: 'error',
            message: 'Unauthorized',
            error: error.message
        });
    }
});

// Change Password Route
app.post('/api/change-password', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const { old_password, new_password } = req.body;

        if (!token) {
            return res.status(401).json({
                status: 'error',
                message: 'No token provided'
            });
        }

        if (!old_password || !new_password) {
            return res.status(400).json({
                status: 'error',
                message: 'Old and new passwords are required'
            });
        }

        if (new_password.length < 6) {
            return res.status(400).json({
                status: 'error',
                message: 'New password must be at least 6 characters'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        let user;
        if (decoded.user_type === 'learner') {
            user = await Learner.findById(decoded.id);
        } else {
            user = await Teacher.findById(decoded.id);
        }
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        const passwordMatch = await bcrypt.compare(old_password, user.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({
                status: 'error',
                message: 'Old password is incorrect'
            });
        }

        const hashedPassword = await bcrypt.hash(new_password, 10);
        user.password_hash = hashedPassword;
        await user.save();

        res.json({
            status: 'success',
            message: 'Password changed successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Server error',
            error: error.message
        });
    }
});

// Get Login History Route
app.get('/api/login-history/:user_id', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                status: 'error',
                message: 'No token provided'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        // determine which collection to search based on user_type in params? we can try both
        let user;
        if (decoded.user_type === 'learner') {
            user = await Learner.findOne({ user_id: req.params.user_id });
        } else if (decoded.user_type === 'teacher') {
            user = await Teacher.findOne({ user_id: req.params.user_id });
        }
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        const logs = await LoginLog.find({ user: user._id, userType: decoded.user_type === 'learner' ? 'Learner' : 'Teacher' })
            .sort({ login_time: -1 })
            .limit(10)
            .select('-__v -user');

        res.json({
            status: 'success',
            login_history: logs
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Server error',
            error: error.message
        });
    }
});

// ==================== TEACHER VERIFICATION WORKFLOW ====================

// Teacher submits (or updates) a verification request
app.post('/api/teacher/verification/request', authenticateToken, async (req, res) => {
    try {
        if (req.user.user_type !== 'teacher') {
            return res.status(403).json({ status: 'error', message: 'Only teachers may submit verification requests' });
        }

        const teacher = await Teacher.findById(req.user.id);
        if (!teacher) {
            return res.status(404).json({ status: 'error', message: 'Teacher not found' });
        }

        const {
            primary_domain,
            expertise_domains,
            years_of_experience,
            credentials,
            documents,
            notes
        } = req.body;

        const domains = Array.isArray(expertise_domains) ? expertise_domains.filter(Boolean) : [];
        const normalizedDomains = (domains.length ? domains : [primary_domain]).filter(Boolean);

        if (!credentials || normalizedDomains.length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'credentials and at least one domain are required'
            });
        }

        // --- ENFORCE SINGLE TEACHER PER DOMAIN ---
        // Check if ANY other teacher (verified or pending) already claims any of these domains
        const existingTeacher = await Teacher.findOne({
            assigned_domains: { $in: normalizedDomains },
            _id: { $ne: teacher._id },
            is_verified: true
        });

        const existingPending = await TeacherVerification.findOne({
            expertise_domains: { $in: normalizedDomains },
            teacher: { $ne: teacher._id },
            verification_status: { $in: ['pending', 'approved'] }
        });

        if (existingTeacher || existingPending) {
            return res.status(409).json({
                status: 'error',
                message: 'already teacher exists'
            });
        }
        // -----------------------------------------

        const verification = await TeacherVerification.findOneAndUpdate(
            { teacher: teacher._id },
            {
                teacher: teacher._id,
                credentials,
                expertise_domains: normalizedDomains,
                years_of_experience: Number.isFinite(Number(years_of_experience)) ? Number(years_of_experience) : null,
                verification_status: 'pending',
                submission_date: new Date(),
                documents: Array.isArray(documents) ? documents.filter(Boolean) : [],
                notes: notes || null,
                verification_date: null,
                verified_by: null
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // Store requested domains on teacher profile (still unverified until admin approval)
        teacher.is_verified = false;
        teacher.primary_domain = primary_domain || normalizedDomains[0] || teacher.primary_domain;
        teacher.assigned_domains = normalizedDomains;
        teacher.verification_date = null;
        teacher.verified_by = null;
        await teacher.save();

        res.status(201).json({
            status: 'success',
            message: 'Verification request submitted',
            verification: {
                id: verification._id,
                verification_status: verification.verification_status,
                expertise_domains: verification.expertise_domains,
                submission_date: verification.submission_date
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error', error: error.message });
    }
});

// Teacher verification (simple endpoint for admin use)
app.post('/api/teacher/verify', async (req, res) => {
    try {
        const { teacher_id } = req.body;
        if (!teacher_id) {
            return res.status(400).json({ status: 'error', message: 'Teacher ID required' });
        }
        const teacher = await Teacher.findOne({ user_id: teacher_id });
        if (!teacher) {
            return res.status(404).json({ status: 'error', message: 'Teacher not found' });
        }
        teacher.is_verified = true;
        await teacher.save();
        res.json({ status: 'success', message: 'Teacher verified' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error', error: error.message });
    }
});

// Upload course video (legacy endpoint - teachers only)
app.post('/api/teacher/upload-video', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ status: 'error', message: 'No token provided' });
        }
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.user_type !== 'teacher') {
            return res.status(403).json({ status: 'error', message: 'Only teachers may upload videos' });
        }
        const teacher = await Teacher.findById(decoded.id);
        if (!teacher || !teacher.is_verified) {
            return res.status(403).json({ status: 'error', message: 'Teacher not verified or not found' });
        }
        const { domain, level, url } = req.body;
        if (!domain || !level || !url) {
            return res.status(400).json({ status: 'error', message: 'domain, level and url are required' });
        }
        const video = await CourseVideo.create({ teacher: teacher._id, domain, level, url });
        res.json({ status: 'success', message: 'Video uploaded', video });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error', error: error.message });
    }
});

// ==================== TEACHER COURSE MANAGEMENT ENDPOINTS ====================

// Get all courses for authenticated teacher
app.get('/api/teacher/courses', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ status: 'error', message: 'No token provided' });
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.user_type !== 'teacher') return res.status(403).json({ status: 'error', message: 'Access denied' });
        const teacher = await Teacher.findById(decoded.id);
        if (!teacher) return res.status(404).json({ status: 'error', message: 'Teacher not found' });

        const courses = await Course.find({ teacher: teacher._id })
            .sort({ created_at: -1 })
            .populate('teacher', 'user_id full_name');

        res.json({ status: 'success', courses });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error', error: error.message });
    }
});

// Get single course for teacher (for editing)
app.get('/api/teacher/courses/:courseId', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ status: 'error', message: 'No token provided' });
        const decoded = jwt.verify(token, JWT_SECRET);
        const teacher = await Teacher.findById(decoded.id);
        if (!teacher) return res.status(404).json({ status: 'error', message: 'Teacher not found' });

        const course = await Course.findOne({ _id: req.params.courseId, teacher: teacher._id });
        if (!course) return res.status(404).json({ status: 'error', message: 'Course not found' });
        res.json({ status: 'success', course });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error', error: error.message });
    }
});

// Get analytics for a specific course
app.get('/api/teacher/courses/:courseId/analytics', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ status: 'error', message: 'No token provided' });

        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.user_type !== 'teacher') return res.status(403).json({ status: 'error', message: 'Access denied' });

        const teacher = await Teacher.findById(decoded.id);
        if (!teacher) return res.status(404).json({ status: 'error', message: 'Teacher not found' });

        const course = await Course.findOne({ _id: req.params.courseId, teacher: teacher._id });
        if (!course) return res.status(404).json({ status: 'error', message: 'Course not found' });

        const analytics = await CourseAnalytics.findOne({ course: course._id })
            .populate('enrolled_learners.learner', 'full_name user_id email');

        if (!analytics) {
            return res.json({
                status: 'success',
                analytics: {
                    title: course.title,
                    total_views: 0,
                    total_enrolled: 0,
                    completion_rate: 0,
                    enrolled_learners: []
                }
            });
        }

        const totalEnrolled = analytics.enrolled_learners.length;
        const completedCount = analytics.enrolled_learners.filter(e => e.completed).length;
        const completionRate = totalEnrolled > 0 ? (completedCount / totalEnrolled) * 100 : 0;

        res.json({
            status: 'success',
            analytics: {
                title: course.title,
                total_views: analytics.total_views,
                total_enrolled: totalEnrolled,
                completion_rate: completionRate,
                enrolled_learners: analytics.enrolled_learners
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error', error: error.message });
    }
});


// Create/Upload a new course (teachers only)
// Handle course upload with video file
app.post('/api/teacher/courses', upload.single('video_file'), async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ status: 'error', message: 'No token provided' });
        }
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.user_type !== 'teacher') {
            return res.status(403).json({ status: 'error', message: 'Only teachers can upload courses' });
        }

        const teacher = await Teacher.findById(decoded.id);
        if (!teacher || !teacher.is_verified) {
            return res.status(403).json({ status: 'error', message: 'Teacher not verified or not found' });
        }

        const { title, description, domain, role, level, thumbnail_url, duration_minutes, tags } = req.body;

        // Validation
        if (!title || !domain || !role || !level) {
            return res.status(400).json({
                status: 'error',
                message: 'title, domain, role, and level are required'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                status: 'error',
                message: 'A video file must be uploaded'
            });
        }

        // Enforce teacher domain assignment (if set)
        if (Array.isArray(teacher.assigned_domains) && teacher.assigned_domains.length > 0) {
            if (!teacher.assigned_domains.includes(domain)) {
                return res.status(403).json({
                    status: 'error',
                    message: `You are allowed to upload only to your assigned domain(s): ${teacher.assigned_domains.join(', ')}`
                });
            }
        }

        if (![1, 2, 3, 4].includes(Number(level))) {
            return res.status(400).json({
                status: 'error',
                message: 'Level must be between 1 and 4'
            });
        }

        const video_url = `/uploads/courses/${req.file.filename}`;

        const course = await Course.create({
            teacher: teacher._id,
            title,
            description,
            domain,
            role,
            level: Number(level),
            video_url,
            thumbnail_url,
            duration_minutes: duration_minutes ? Number(duration_minutes) : null,
            tags: tags ? tags.split(',').map(tag => tag.trim()) : []
        });

        // Create analytics entry for this course
        await CourseAnalytics.create({ course: course._id });

        res.status(201).json({
            status: 'success',
            message: 'Course uploaded successfully',
            course: {
                _id: course._id,
                title: course.title,
                domain: course.domain,
                role: course.role,
                level: course.level,
                created_at: course.created_at
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error', error: error.message });
    }
});

// Redundant course retrieval endpoint removed (handled by /api/teacher/courses at line 1013)

// Get a single course details for teacher
app.get('/api/teacher/courses/:courseId', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ status: 'error', message: 'No token provided' });
        }
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.user_type !== 'teacher') {
            return res.status(403).json({ status: 'error', message: 'Only teachers can access this' });
        }

        const course = await Course.findById(req.params.courseId)
            .populate('teacher', 'user_id full_name email');

        if (!course) {
            return res.status(404).json({ status: 'error', message: 'Course not found' });
        }

        if (course.teacher._id.toString() !== decoded.id) {
            return res.status(403).json({ status: 'error', message: 'You do not own this course' });
        }

        const analytics = await CourseAnalytics.findOne({ course: course._id });

        res.json({
            status: 'success',
            course,
            analytics
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error', error: error.message });
    }
});

// Update a course (teachers only)
app.put('/api/teacher/courses/:courseId', upload.single('video_file'), async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ status: 'error', message: 'No token provided' });
        }
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.user_type !== 'teacher') {
            return res.status(403).json({ status: 'error', message: 'Only teachers can update courses' });
        }

        const course = await Course.findById(req.params.courseId);
        if (!course) {
            return res.status(404).json({ status: 'error', message: 'Course not found' });
        }

        if (course.teacher.toString() !== decoded.id) {
            return res.status(403).json({ status: 'error', message: 'You do not own this course' });
        }

        const { title, description, domain, role, level, thumbnail_url, duration_minutes, tags, is_published } = req.body;

        // Update fields if provided
        if (title) course.title = title;
        if (description) course.description = description;
        if (domain) course.domain = domain;
        if (role) course.role = role;
        if (level) {
            const levelNum = Number(level);
            if (![1, 2, 3, 4].includes(levelNum)) {
                return res.status(400).json({ status: 'error', message: 'Level must be between 1 and 4' });
            }
            course.level = levelNum;
        }

        if (thumbnail_url !== undefined) course.thumbnail_url = thumbnail_url;
        if (duration_minutes !== undefined) course.duration_minutes = duration_minutes ? Number(duration_minutes) : null;
        if (tags !== undefined) course.tags = tags ? tags.split(',').map(tag => tag.trim()) : [];
        if (is_published !== undefined) course.is_published = (is_published === 'true' || is_published === true);

        // Update video if a new file is uploaded
        if (req.file) {
            course.video_url = `/uploads/courses/${req.file.filename}`;
        }

        course.updated_at = new Date();
        await course.save();

        res.json({
            status: 'success',
            message: 'Course updated successfully',
            course
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error', error: error.message });
    }
});

// Increment course view count
app.post('/api/courses/:courseId/increment-view', async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);
        if (!course) {
            return res.status(404).json({ status: 'error', message: 'Course not found' });
        }

        course.views += 1;
        await course.save();

        // Update analytics record
        let analytics = await CourseAnalytics.findOne({ course: course._id });
        if (!analytics) {
            analytics = await CourseAnalytics.create({ course: course._id, total_views: 1 });
        } else {
            analytics.total_views += 1;
            await analytics.save();
        }

        res.json({ status: 'success', message: 'View count incremented', views: course.views });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error', error: error.message });
    }
});

// Batch enroll learner in multiple courses based on domain and role
app.post('/api/learner/courses/enroll-batch', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ status: 'error', message: 'No token provided' });

        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.user_type !== 'learner') return res.status(403).json({ status: 'error', message: 'Only learners can enroll' });

        const { domain, role } = req.body;
        if (!domain || !role) return res.status(400).json({ status: 'error', message: 'Domain and role are required' });

        // Find all courses for this domain and role
        const courses = await Course.find({ domain, role });

        const results = [];
        for (const course of courses) {
            // Check if already enrolled in analytics
            let analytics = await CourseAnalytics.findOne({ course: course._id });
            if (!analytics) {
                analytics = await CourseAnalytics.create({ course: course._id });
            }

            const alreadyEnrolled = analytics.enrolled_learners.some(
                e => e.learner.toString() === decoded.id
            );

            if (!alreadyEnrolled) {
                analytics.enrolled_learners.push({
                    learner: new mongoose.Types.ObjectId(decoded.id),
                    enrolled_date: new Date()
                });
                analytics.total_enrolled += 1;
                await analytics.save();

                course.enrolled_learners += 1;
                await course.save();
                results.push(course._id);
            }
        }

        res.json({ status: 'success', enrolled_count: results.length, courses: results });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error', error: error.message });
    }
});

// Delete a course (teachers only)
app.delete('/api/teacher/courses/:courseId', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ status: 'error', message: 'No token provided' });
        }
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.user_type !== 'teacher') {
            return res.status(403).json({ status: 'error', message: 'Only teachers can delete courses' });
        }

        const course = await Course.findById(req.params.courseId);
        if (!course) {
            return res.status(404).json({ status: 'error', message: 'Course not found' });
        }

        if (course.teacher.toString() !== decoded.id) {
            return res.status(403).json({ status: 'error', message: 'You do not own this course' });
        }

        // Delete associated analytics
        await CourseAnalytics.deleteOne({ course: course._id });

        await Course.findByIdAndDelete(req.params.courseId);

        res.json({
            status: 'success',
            message: 'Course deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error', error: error.message });
    }
});

// Get course analytics
app.get('/api/teacher/courses/:courseId/analytics', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ status: 'error', message: 'No token provided' });
        }
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.user_type !== 'teacher') {
            return res.status(403).json({ status: 'error', message: 'Only teachers can access analytics' });
        }

        const course = await Course.findById(req.params.courseId);
        if (!course) {
            return res.status(404).json({ status: 'error', message: 'Course not found' });
        }

        if (course.teacher.toString() !== decoded.id) {
            return res.status(403).json({ status: 'error', message: 'You do not own this course' });
        }

        const analytics = await CourseAnalytics.findOne({ course: course._id })
            .populate('enrolled_learners.learner', 'user_id full_name email');

        res.json({
            status: 'success',
            analytics: {
                course_id: course._id,
                title: course.title,
                total_views: analytics?.total_views || 0,
                total_enrolled: analytics?.total_enrolled || 0,
                enrolled_learners: analytics?.enrolled_learners || [],
                completion_rate: analytics?.completion_rate || 0,
                average_completion_time: analytics?.average_completion_time_minutes || 0
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error', error: error.message });
    }
});

// ==================== LEARNER COURSE DISCOVERY ENDPOINTS ====================

// Get available courses for learner based on domain and level
app.get('/api/learner/courses', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ status: 'error', message: 'No token provided' });
        }
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.user_type !== 'learner') {
            return res.status(403).json({ status: 'error', message: 'Only learners can access this' });
        }

        const learner = await Learner.findById(decoded.id);
        if (!learner) {
            return res.status(404).json({ status: 'error', message: 'Learner not found' });
        }

        // Get learner's progress
        const progress = await UserProgress.findOne({ user: learner._id });
        const learnerDomain = progress?.selected_domain;
        const learnerLevel = (progress?.current_level ?? 1);

        let query = { is_published: true };

        // Filter by domain if learner has selected one
        if (learnerDomain) {
            query.domain = learnerDomain;
        }

        // Show courses for current level and below
        query.level = { $lte: learnerLevel + 1 };

        const courses = await Course.find(query)
            .populate('teacher', 'user_id full_name')
            .sort({ created_at: -1 })
            .select('-__v');

        res.json({
            status: 'success',
            learner_domain: learnerDomain,
            learner_level: learnerLevel,
            count: courses.length,
            courses
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error', error: error.message });
    }
});

// Get available courses without authentication for browsing (public view)
app.get('/api/courses/available', async (req, res) => {
    try {
        const { domain, level, role, exact } = req.query;

        let query = { is_published: true };
        if (domain) query.domain = domain;
        if (role) query.role = role;
        if (level) {
            const lvl = parseInt(level);
            if (Number.isNaN(lvl)) {
                return res.status(400).json({ status: 'error', message: 'Invalid level' });
            }
            if (String(exact).toLowerCase() === 'true') {
                query.level = lvl;
            } else {
                query.level = { $lte: lvl + 1 };
            }
        }

        const courses = await Course.find(query)
            .populate('teacher', 'user_id full_name')
            .sort({ created_at: -1 })
            .select('-__v');

        res.json({
            status: 'success',
            count: courses.length,
            courses
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error', error: error.message });
    }
});

// Track course view
app.post('/api/learner/courses/:courseId/view', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const decoded = token ? jwt.verify(token, JWT_SECRET) : null;

        const course = await Course.findById(req.params.courseId);
        if (!course) {
            return res.status(404).json({ status: 'error', message: 'Course not found' });
        }

        // Increment view count
        course.views += 1;
        await course.save();

        // Update analytics
        const analytics = await CourseAnalytics.findOne({ course: course._id });
        if (analytics) {
            analytics.total_views += 1;

            // Track unique viewer if authenticated
            if (decoded && decoded.user_type === 'learner') {
                if (!analytics.unique_viewers.includes(decoded.id)) {
                    analytics.unique_viewers.push(decoded.id);
                }
            }

            analytics.last_updated = new Date();
            await analytics.save();
        }

        res.json({
            status: 'success',
            message: 'View recorded',
            views: course.views
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error', error: error.message });
    }
});

// Enroll learner in course
app.post('/api/learner/courses/:courseId/enroll', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ status: 'error', message: 'No token provided' });
        }
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.user_type !== 'learner') {
            return res.status(403).json({ status: 'error', message: 'Only learners can enroll' });
        }

        const learner = await Learner.findById(decoded.id);
        if (!learner) {
            return res.status(404).json({ status: 'error', message: 'Learner not found' });
        }

        const course = await Course.findById(req.params.courseId);
        if (!course) {
            return res.status(404).json({ status: 'error', message: 'Course not found' });
        }

        // Update analytics
        const analytics = await CourseAnalytics.findOne({ course: course._id });
        if (analytics) {
            // Check if already enrolled
            const alreadyEnrolled = analytics.enrolled_learners.some(
                e => e.learner.toString() === learner._id.toString()
            );

            if (!alreadyEnrolled) {
                analytics.enrolled_learners.push({
                    learner: learner._id,
                    enrolled_date: new Date()
                });
                analytics.total_enrolled += 1;

                // Also increment course enrolled_learners count
                course.enrolled_learners += 1;
                await course.save();
            }

            analytics.last_updated = new Date();
            await analytics.save();
        }

        res.json({
            status: 'success',
            message: 'Successfully enrolled in course',
            course: {
                _id: course._id,
                title: course.title,
                domain: course.domain,
                role: course.role,
                level: course.level
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error', error: error.message });
    }
});

// Mark course as completed
app.post('/api/learner/courses/:courseId/complete', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ status: 'error', message: 'No token provided' });
        }
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.user_type !== 'learner') {
            return res.status(403).json({ status: 'error', message: 'Only learners can complete courses' });
        }

        const { rating, review } = req.body;
        const learner = await Learner.findById(decoded.id);
        const course = await Course.findById(req.params.courseId);

        if (!course) {
            return res.status(404).json({ status: 'error', message: 'Course not found' });
        }

        const analytics = await CourseAnalytics.findOne({ course: course._id });
        if (analytics) {
            const enrollmentIndex = analytics.enrolled_learners.findIndex(
                e => e.learner.toString() === learner._id.toString()
            );

            if (enrollmentIndex !== -1) {
                analytics.enrolled_learners[enrollmentIndex].completed = true;
                analytics.enrolled_learners[enrollmentIndex].completion_date = new Date();
                if (rating) analytics.enrolled_learners[enrollmentIndex].rating = rating;
                if (review) analytics.enrolled_learners[enrollmentIndex].review = review;

                // Update course rating
                const allRatings = analytics.enrolled_learners
                    .filter(e => e.rating)
                    .map(e => e.rating);
                if (allRatings.length > 0) {
                    course.rating = allRatings.reduce((a, b) => a + b) / allRatings.length;
                    course.number_of_reviews = allRatings.length;
                    await course.save();
                }

                analytics.last_updated = new Date();
                await analytics.save();
            }
        }

        res.json({
            status: 'success',
            message: 'Course marked as completed'
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Server error', error: error.message });
    }
});

// Logout Route
app.post('/api/logout', async (req, res) => {
    try {
        const { user_id } = req.body;

        if (!user_id) {
            return res.status(400).json({
                status: 'error',
                message: 'User ID is required'
            });
        }

        // try learners first then teachers
        let user = await Learner.findOne({ user_id });
        let type = 'Learner';
        if (!user) {
            user = await Teacher.findOne({ user_id });
            type = 'Teacher';
        }
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        const log = await LoginLog.findOne({ user: user._id, userType: type })
            .sort({ login_time: -1 });

        if (log) {
            log.logout_time = new Date();
            log.session_duration = Math.floor((log.logout_time - log.login_time) / 1000);
            await log.save();
        }

        res.json({
            status: 'success',
            message: 'Logged out successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Server error',
            error: error.message
        });
    }
});

// Save User Progress Route (learners only)
app.post('/api/save-progress', async (req, res) => {
    try {
        const { user_id, selected_domain, selected_role, current_level, completed_tasks, total_tasks, progress_percentage } = req.body;

        if (!user_id) {
            return res.status(400).json({
                status: 'error',
                message: 'User ID is required'
            });
        }

        const user = await Learner.findOne({ user_id });
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'Learner not found'
            });
        }

        const progress = await UserProgress.findOneAndUpdate(
            { user: user._id },
            {
                selected_domain,
                selected_role,
                current_level,
                completed_tasks: completed_tasks || [],
                total_tasks,
                progress_percentage,
                last_updated: new Date()
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.json({
            status: 'success',
            message: 'Progress saved successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Server error',
            error: error.message
        });
    }
});

// Get User Progress Route (learner only)
app.get('/api/user-progress/:user_id', async (req, res) => {
    try {
        const { user_id } = req.params;

        const user = await Learner.findOne({ user_id });
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'Learner not found'
            });
        }

        const progress = await UserProgress.findOne({ user: user._id }).lean();
        if (!progress) {
            return res.json({
                status: 'success',
                data: null,
                message: 'No progress found for learner'
            });
        }

        res.json({
            status: 'success',
            data: progress
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Server error',
            error: error.message
        });
    }
});

// Update Goals Route
app.post('/api/update-goals', async (req, res) => {
    try {
        const { user_id, goals } = req.body;

        if (!user_id) {
            return res.status(400).json({
                status: 'error',
                message: 'User ID is required'
            });
        }

        const user = await Learner.findOne({ user_id });
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'Learner not found'
            });
        }

        await UserProgress.findOneAndUpdate(
            { user: user._id },
            { goals: goals || [], last_updated: new Date() },
            { upsert: true }
        );

        res.json({
            status: 'success',
            message: 'Goals updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Server error',
            error: error.message
        });
    }
});

// Admin Routes
// Get all users and their progress (Admin only)
app.get('/api/admin/users', authenticateToken, async (req, res) => {
    try {
        if (req.user.user_type !== 'admin') {
            return res.status(403).json({
                status: 'error',
                message: 'Access denied. Admin privileges required.'
            });
        }

        const learners = await Learner.find({}, 'user_id full_name email institution created_at is_active');
        const teachers = await Teacher.find({}, 'user_id full_name email institution created_at is_active is_verified');
        const admins = await Admin.find({}, 'user_id full_name email created_at is_active');

        // Get progress for all learners
        const progressData = await UserProgress.find({})
            .populate('user', 'user_id full_name')
            .select('user selected_domain selected_role current_level progress_percentage last_updated');

        res.json({
            status: 'success',
            data: {
                learners: learners.map(learner => ({
                    ...learner.toObject(),
                    user_type: 'learner',
                    progress: progressData.find(p => p.user._id.toString() === learner._id.toString())
                })),
                teachers: teachers.map(teacher => ({
                    ...teacher.toObject(),
                    user_type: 'teacher'
                })),
                admins: admins.map(admin => ({
                    ...admin.toObject(),
                    user_type: 'admin'
                }))
            }
        });
    } catch (error) {
        console.error('Admin users fetch error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error fetching users',
            error: error.message
        });
    }
});

// Get system statistics (Admin only)
app.get('/api/admin/stats', authenticateToken, async (req, res) => {
    try {
        if (req.user.user_type !== 'admin') {
            return res.status(403).json({
                status: 'error',
                message: 'Access denied. Admin privileges required.'
            });
        }

        const totalLearners = await Learner.countDocuments({ is_active: true });
        const totalTeachers = await Teacher.countDocuments({ is_active: true });
        const totalAdmins = await Admin.countDocuments({ is_active: true });
        const verifiedTeachers = await Teacher.countDocuments({ is_verified: true, is_active: true });

        const totalProgress = await UserProgress.countDocuments();
        const avgProgress = await UserProgress.aggregate([
            { $group: { _id: null, avg: { $avg: '$progress_percentage' } } }
        ]);

        const recentLogins = await LoginLog.find()
            .sort({ login_time: -1 })
            .limit(10)
            .populate('user', 'user_id full_name')
            .select('user userType login_time');

        res.json({
            status: 'success',
            data: {
                users: {
                    total_learners: totalLearners,
                    total_teachers: totalTeachers,
                    total_admins: totalAdmins,
                    verified_teachers: verifiedTeachers
                },
                progress: {
                    total_progress_records: totalProgress,
                    average_progress_percentage: avgProgress[0]?.avg || 0
                },
                recent_activity: recentLogins
            }
        });
    } catch (error) {
        console.error('Admin stats fetch error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error fetching statistics',
            error: error.message
        });
    }
});

// Update user status (Admin only)
app.put('/api/admin/users/:userId/status', authenticateToken, async (req, res) => {
    try {
        if (req.user.user_type !== 'admin') {
            return res.status(403).json({
                status: 'error',
                message: 'Access denied. Admin privileges required.'
            });
        }

        const { userId } = req.params;
        const { is_active, user_type } = req.body;

        let UserModel;
        if (user_type === 'learner') UserModel = Learner;
        else if (user_type === 'teacher') UserModel = Teacher;
        else if (user_type === 'admin') UserModel = Admin;
        else {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid user type'
            });
        }

        const user = await UserModel.findByIdAndUpdate(
            userId,
            { is_active },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        res.json({
            status: 'success',
            message: `User ${is_active ? 'activated' : 'deactivated'} successfully`,
            user: {
                id: user._id,
                user_id: user.user_id,
                is_active: user.is_active
            }
        });
    } catch (error) {
        console.error('Admin user status update error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error updating user status',
            error: error.message
        });
    }
});

// Verify teacher (Admin only)
app.put('/api/admin/teachers/:teacherId/verify', authenticateToken, async (req, res) => {
    try {
        if (req.user.user_type !== 'admin') {
            return res.status(403).json({
                status: 'error',
                message: 'Access denied. Admin privileges required.'
            });
        }

        const { teacherId } = req.params;
        const { is_verified } = req.body;

        const teacher = await Teacher.findByIdAndUpdate(
            teacherId,
            {
                is_verified,
                verification_date: is_verified ? new Date() : null,
                verified_by: is_verified ? req.user.user_id : null
            },
            { new: true }
        );

        if (!teacher) {
            return res.status(404).json({
                status: 'error',
                message: 'Teacher not found'
            });
        }

        res.json({
            status: 'success',
            message: `Teacher ${is_verified ? 'verified' : 'unverified'} successfully`,
            teacher: {
                id: teacher._id,
                user_id: teacher.user_id,
                is_verified: teacher.is_verified,
                verification_date: teacher.verification_date
            }
        });
    } catch (error) {
        console.error('Admin teacher verification error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error updating teacher verification',
            error: error.message
        });
    }
});

// ==================== ADMIN VERIFICATION QUEUE ====================

// List teacher verification requests (Admin only)
app.get('/api/admin/teacher-verifications', authenticateToken, async (req, res) => {
    try {
        if (req.user.user_type !== 'admin') {
            return res.status(403).json({ status: 'error', message: 'Access denied. Admin privileges required.' });
        }

        const { status } = req.query;
        const query = {};
        if (status && ['pending', 'approved', 'rejected'].includes(status)) {
            query.verification_status = status;
        }

        const items = await TeacherVerification.find(query)
            .populate('teacher', 'user_id full_name email institution is_verified primary_domain assigned_domains')
            .sort({ submission_date: -1 })
            .select('-__v');

        res.json({
            status: 'success',
            count: items.length,
            items
        });
    } catch (error) {
        console.error('Admin verification queue error:', error);
        res.status(500).json({ status: 'error', message: 'Server error fetching verification requests', error: error.message });
    }
});

// Approve/reject a teacher verification request (Admin only)
app.put('/api/admin/teacher-verifications/:verificationId', authenticateToken, async (req, res) => {
    try {
        if (req.user.user_type !== 'admin') {
            return res.status(403).json({ status: 'error', message: 'Access denied. Admin privileges required.' });
        }

        const { verificationId } = req.params;
        const { status, notes, assigned_domains, primary_domain } = req.body;

        if (!status || !['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ status: 'error', message: 'status must be approved or rejected' });
        }

        const verification = await TeacherVerification.findById(verificationId).populate('teacher');
        if (!verification) {
            return res.status(404).json({ status: 'error', message: 'Verification request not found' });
        }

        const now = new Date();
        verification.verification_status = status;
        verification.verification_date = now;
        verification.verified_by = req.user.user_id;
        if (notes !== undefined) verification.notes = notes;

        // Admin may optionally override assigned domains on approval
        const domainsOverride = Array.isArray(assigned_domains) ? assigned_domains.filter(Boolean) : null;
        if (domainsOverride && domainsOverride.length > 0) {
            verification.expertise_domains = domainsOverride;
        }
        if (primary_domain) {
            // store as first domain for convenience
            if (!verification.expertise_domains.includes(primary_domain)) {
                verification.expertise_domains = [primary_domain, ...verification.expertise_domains];
            }
        }

        await verification.save();

        // Update teacher profile
        const teacher = await Teacher.findById(verification.teacher._id);
        if (!teacher) {
            return res.status(404).json({ status: 'error', message: 'Teacher not found' });
        }

        if (status === 'approved') {
            teacher.is_verified = true;
            teacher.verification_date = now;
            teacher.verified_by = req.user.user_id;
            teacher.assigned_domains = verification.expertise_domains || teacher.assigned_domains;
            teacher.primary_domain = primary_domain || teacher.primary_domain || (teacher.assigned_domains || [])[0] || null;
        } else {
            teacher.is_verified = false;
            teacher.verification_date = now;
            teacher.verified_by = req.user.user_id;
        }

        await teacher.save();

        res.json({
            status: 'success',
            message: `Verification ${status} successfully`,
            teacher: {
                id: teacher._id,
                user_id: teacher.user_id,
                is_verified: teacher.is_verified,
                primary_domain: teacher.primary_domain,
                assigned_domains: teacher.assigned_domains
            }
        });
    } catch (error) {
        console.error('Admin verification review error:', error);
        res.status(500).json({ status: 'error', message: 'Server error updating verification request', error: error.message });
    }
});

// ==================== ADMIN ENDPOINTS ====================

// Helper: verify admin token
async function verifyAdminToken(req) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return null;
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.user_type !== 'admin') return null;
    return decoded;
}

// GET /api/admin/stats - overview stats
app.get('/api/admin/stats', async (req, res) => {
    try {
        const admin = await verifyAdminToken(req);
        if (!admin) return res.status(403).json({ status: 'error', message: 'Admin access required' });
        const [learnerCount, teacherCount, verifiedCount] = await Promise.all([
            Learner.countDocuments(),
            Teacher.countDocuments(),
            Teacher.countDocuments({ is_verified: true })
        ]);
        const progressDocs = await UserProgress.find({}, 'progress_percentage');
        const avgProgress = progressDocs.length
            ? progressDocs.reduce((s, p) => s + (p.progress_percentage || 0), 0) / progressDocs.length
            : 0;
        const recentActivity = await LoginLog.find()
            .sort({ login_time: -1 }).limit(10)
            .populate('user', 'full_name user_id');
        res.json({ status: 'success', data: { users: { total_learners: learnerCount, total_teachers: teacherCount, verified_teachers: verifiedCount }, progress: { average_progress_percentage: avgProgress }, recent_activity: recentActivity } });
    } catch (e) { res.status(500).json({ status: 'error', message: e.message }); }
});

// GET /api/admin/users - list all users
app.get('/api/admin/users', async (req, res) => {
    try {
        const admin = await verifyAdminToken(req);
        if (!admin) return res.status(403).json({ status: 'error', message: 'Admin access required' });
        const [learners, teachers, admins] = await Promise.all([
            Learner.find({}, '-password_hash'),
            Teacher.find({}, '-password_hash'),
            Admin.find({}, '-password_hash')
        ]);
        res.json({ status: 'success', data: { learners, teachers, admins } });
    } catch (e) { res.status(500).json({ status: 'error', message: e.message }); }
});

// GET /api/admin/progress - all learner progress records
app.get('/api/admin/progress', async (req, res) => {
    try {
        const admin = await verifyAdminToken(req);
        if (!admin) return res.status(403).json({ status: 'error', message: 'Admin access required' });
        const progressRecords = await UserProgress.find()
            .populate('user', 'full_name user_id email')
            .sort({ progress_percentage: -1 });
        res.json({ status: 'success', data: progressRecords });
    } catch (e) { res.status(500).json({ status: 'error', message: e.message }); }
});

// GET /api/admin/courses - all courses for admin management
app.get('/api/admin/courses', async (req, res) => {
    try {
        const admin = await verifyAdminToken(req);
        if (!admin) return res.status(403).json({ status: 'error', message: 'Admin access required' });
        const courses = await Course.find()
            .populate('teacher', 'user_id full_name')
            .sort({ created_at: -1 });
        res.json({ status: 'success', courses });
    } catch (e) { res.status(500).json({ status: 'error', message: e.message }); }
});

// DELETE /api/admin/courses/:id - admin can delete any course
app.delete('/api/admin/courses/:courseId', async (req, res) => {
    try {
        const admin = await verifyAdminToken(req);
        if (!admin) return res.status(403).json({ status: 'error', message: 'Admin access required' });
        const course = await Course.findByIdAndDelete(req.params.courseId);
        if (!course) return res.status(404).json({ status: 'error', message: 'Course not found' });
        // Remove associated analytics
        await CourseAnalytics.deleteOne({ course: course._id });
        res.json({ status: 'success', message: 'Course deleted' });
    } catch (e) { res.status(500).json({ status: 'error', message: e.message }); }
});

// Error handling middleware

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: err.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n╔════════════════════════════════════╗`);
    console.log(`║  InCreEdu Server Started           ║`);
    console.log(`║  Port: ${PORT}${' '.repeat(23 - PORT.toString().length)}║`);
    console.log(`║  Database: MongoDB (${MONGO_URI})${' '.repeat(Math.max(0, 15 - MONGO_URI.length))}║`);
    console.log(`║  Environment: ${process.env.NODE_ENV || 'development'}${' '.repeat(13 - (process.env.NODE_ENV || 'development').length)}║`);
    console.log(`╚════════════════════════════════════╝\n`);
});

