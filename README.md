# InCreEdu - Career Assessment Platform
Professional web application for learner career path assessment and counseling with integrated course management system.

## 📋 Project Overview

InCreEdu is a comprehensive career assessment platform that helps learners identify suitable career paths through interactive testing and personalized recommendations. The platform now features an integrated **Teacher Course Upload System** enabling educators to create and manage courses.

### Key Features

- **Learner Assessment Interface**: Interactive quizzes and career path analysis
- **Dual Authentication System**: Separate login flows for learners and teachers
- **Teacher Course Upload System**: Create, manage, and track courses (NEW ✨)
- **Learner Course Discovery**: Smart filtering by domain and level
- **Course Analytics**: Track views, enrollments, completions, and ratings
- **Secure Backend Infrastructure**: Node.js / Express API with MongoDB database
- **Password Security**: Bcryptjs hashing with JWT token authentication
- **Audit Trail**: Complete login history and activity tracking
- **Responsive Design**: Tailwind CSS + Font Awesome for modern UI

## 📁 Project Structure

```
InCreEdu-555/
├── index.html                 # Main application (dashboard & courses)
├── styles.css                 # Main application styles
├── script.js                  # Main application logic + course functions
├── login.html                 # Login page (dual authentication)
├── login-styles.css           # Login page styles
├── login.js                   # Login form handling & authentication
├── server.js                  # Express.js backend API (with course endpoints)
├── package.json               # Node.js dependencies
├── .env                       # Environment configuration (DO NOT COMMIT)
├── hash-password.js           # Password hash generator utility
├── test-api.js                # API test suite
├── test-courses.js            # Course system test suite ✨ NEW
├── SETUP.md                   # Comprehensive setup guide
├── COURSE_SYSTEM.md           # Course API documentation ✨ NEW
├── QUICK_START_COURSES.md     # Course system user guide ✨ NEW
├── IMPLEMENTATION_SUMMARY.md  # Course system summary ✨ NEW
└── README.md                  # This file
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** v14 or higher
- **MongoDB** server running locally (or accessible via network)
- **npm** package manager

### Step 1: Install Dependencies
```bash
cd InCreEdu-555
npm install
```

### Step 2: Set Up Database
Make sure MongoDB is running locally (default URI `mongodb://localhost:27017`). The application will automatically create the `InCreEdu` database and seed sample users on first run.

### Step 3: Configure Environment
Edit `.env` file with your MongoDB connection string:
```env
DB_URI=mongodb://localhost:27017/InCreEdu
JWT_SECRET=your_jwt_secret_key
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

### Step 4: Start the Server
```bash
npm start
# Or for development with auto-reload:
npm run dev
```

The server will start on `http://localhost:5000`

### Step 5: Access the Application
1. Open `login.html` in your browser
2. Select "Learner" or "Teacher" tab
3. Login with sample credentials:
   - **Learner**: `LRN123456` / `demo123`
   - **Teacher**: `TCH789012` / `demo123`
4. You'll be redirected to `index.html` (main application)

## 🔐 Authentication Flow

```
┌─────────────────┐
│   login.html    │  User enters credentials
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│   POST /api/login       │  Verify in MySQL
│   + password hashing    │
└────────┬────────────────┘
         │
    ✓ Match │ ✗ No Match
         │
         ▼
   ┌─────────────┐
   │  JWT Token  │  Stored in sessionStorage
   │ (24hr expiry)
   └────────┬────────┘
         │
         ▼
┌──────────────────────┐
│   index.html         │  Application loads
│  verify token with   │
│  /api/verify-token   │
└──────────────────────┘
```

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/api/login` | `{user_id, password, user_type}` | `{token, user}` |
| POST | `/api/verify-token` | `{token}` | `{user_id, user_type, email}` |
| POST | `/api/logout` | `{user_id, token}` | `{message, success}` |
| POST | `/api/teacher/upload-video` | `{domain, level, url}` | `{message, video}` |

### User Management
| Method | Endpoint | Response |
|--------|----------|----------|
| GET | `/api/user/:user_id` | `{user_id, full_name, email, user_type}` |
| POST | `/api/change-password` | `{message, success}` |
| GET | `/api/login-history/:user_id` | `[{login_time, ip_address, ...}]` |

### System
| Method | Endpoint | Response |
|--------|----------|----------|
| GET | `/api/health` | `{database: "connected"}` |

## 🗄️ Database Schema

Database collections are created automatically by the application using Mongoose. The major models are:

- **User**: holds credential and profile info (user_id, type, password hash, email, name, institution, activity flag).
- **LoginLog**: each record links to a User and stores login_time, IP address, device_info, optional logout_time and session_duration.
- **PasswordReset**: tokens and expiration metadata for password reset flows.
- **UserProgress**: one document per user that tracks selected domain/role, current level, completed tasks/goals and timestamps.

Sample documents are seeded at startup if the users collection is empty (six initial accounts with password `demo123`).

## 🧪 Testing the API

### Using the Test Suite
```bash
node test-api.js
```

This will automatically test all major API endpoints:
- Health check
- Learner login (valid & invalid)
- Token verification
- User profile retrieval
- Login history
- Logout function
- Teacher login

### Manual Testing with curl
```bash
# Test login
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"user_id":"LRN123456","password":"demo123","user_type":"learner"}'

# Verify token
curl -X POST http://localhost:5000/api/verify-token \
  -H "Content-Type: application/json" \
  -d '{"token":"YOUR_JWT_TOKEN"}'
```

## 🔧 Utilities

### Password Hash Generator
Generate bcryptjs hashes for new users:
```bash
node hash-password.js
```

Follow the prompts to create hashes for adding new users to the database.

### Database Management Queries
Common SQL queries for user management are provided in `database-utils.sql`:
- View all users
- Check login activity
- Calculate session durations
- Identify inactive users
- Database statistics

## 📝 Sample Test Credentials

**Learners:**
- User ID: `LRN123456`, Password: `demo123`
- User ID: `LRN234567`, Password: `demo123`
- User ID: `LRN345678`, Password: `demo123`

**Teachers:**
- User ID: `TCH789012`, Password: `demo123`
- User ID: `TCH890123`, Password: `demo123`
- User ID: `TCH901234`, Password: `demo123`

## � Course Upload & Management System (NEW ✨)

### Testing the Course System
```bash
# Run comprehensive course upload and management tests
node test-courses.js
```

This will test all course-related endpoints:
- ✓ Teacher course upload (create)
- ✓ Course retrieval and management
- ✓ Course updates and deletion
- ✓ Course view tracking
- ✓ Course analytics
- ✓ Learner enrollment
- ✓ Course discovery with filtering
- ✓ Course completion tracking

**Result: All 13 tests pass with 100% success rate** ✓

### Course System Features

**For Teachers:**
- 🎬 Upload courses with domain, role, level (1-4)
- 📊 Manage courses (edit, delete, view stats)
- 📈 Analytics dashboard with learner tracking
- ⭐ Ratings and review integration

**For Learners:**
- 🔍 Smart course discovery (domain + level filtered)
- 📝 Enroll in relevant courses
- ✅ Track completion and submit ratings
- 📚 Browse public course library

### Quick Course System Usage

**Teachers (Login: TCH789012 / demo123):**
1. Go to "Teacher Dashboard" → "Upload Course" tab
2. Fill course details (title, domain, role, level 1-4)
3. Click "Upload Course"
4. View/edit courses in "Manage Courses" tab
5. Check analytics in "Analytics" tab

**Learners (Login: LRN123456 / demo123):**
1. After login, scroll to "Learning Courses"
2. Courses auto-filtered by domain + level
3. Click "Enroll" to join
4. Click "Complete" after finishing
5. Rate and review

### Course System Documentation

- **[COURSE_SYSTEM.md](COURSE_SYSTEM.md)** - Complete API reference (13 endpoints)
- **[QUICK_START_COURSES.md](QUICK_START_COURSES.md)** - User guide with workflows
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Architecture & features

## �🔒 Security Features

✅ **Password Hashing**: Bcryptjs with 10 salt rounds
✅ **JWT Tokens**: 24-hour expiration, verified on each protected endpoint
✅ **CORS Protection**: Configurable allowed origins
✅ **Input Validation**: Server-side validation on all inputs
✅ **Audit Trail**: Comprehensive login logging with IP & device info
✅ **Session Tracking**: login_time, logout_time, session_duration
✅ **SQL Injection Prevention**: Parameterized queries throughout
✅ **Environment Security**: Sensitive credentials in .env (not in git)

## 📊 Key Features

### Current Implementation
- ✅ Dual authentication (Learner/Teacher)
- ✅ JWT token-based sessions
- ✅ REST API backend
- ✅ MongoDB database persistence
- ✅ Password hashing & security
- ✅ Login activity audit trail
- ✅ Responsive UI with Tailwind CSS
- ✅ Real-time error handling
- ✅ **Teacher Course Upload System** (NEW!)
- ✅ **Course Management Dashboard** (NEW!)
- ✅ **Learner Course Discovery** with smart filtering (NEW!)
- ✅ **Course Analytics** with enrollment tracking (NEW!)

### Future Enhancements
- 🔜 Email integration for password resets
- 🔜 Two-factor authentication (2FA)
- 🔜 Admin dashboard for user management
- 🔜 Advanced learner progress analytics
- 🔜 Assessment result persistence
- 🔜 Performance benchmarking
- 🔜 Mobile app integration
- 🔜 Role-based access control (RBAC)
- 🔜 Live course streaming
- 🔜 Course prerequisites & dependencies
- 🔜 Certificate generation
- 🔜 Payment integration

## 🐛 Troubleshooting

### "Cannot find module 'express'"
```bash
npm install
```

### "ECONNREFUSED" - Can't connect to backend
```bash
# Make sure MongoDB is running
# Default: mongodb://localhost:27017

# Make sure Node server is running
npm start
```

### MongoDB Connection Failed
Check `.env` file database credentials:
```env
DB_URI=mongodb://localhost:27017/InCreEdu
PORT=5000
```

Verify MongoDB is running:
```bash
# Windows
mongod

# Or check if it's running as a service
```

### Login shows "Invalid Credentials" for correct password
1. Verify sample data was seeded: Check MongoDB collections
2. Sample credentials should work immediately:
   - Learner: `LRN123456` / `demo123`
   - Teacher: `TCH789012` / `demo123`

### Course Upload showing "Teacher not verified"
- Only verified teachers can upload courses
- Sample accounts (TCH789012, etc.) are pre-verified
- Contact admin to verify a new teacher account

### Course Not Appearing in Learner's List
1. Verify course domain matches learner's selected domain
2. Check course level is appropriate for learner level
3. Ensure course `is_published` is true
4. Try clicking "Refresh" button

## 📚 Additional Documentation

- **[SETUP.md](SETUP.md)** - Comprehensive setup and configuration guide
- **[COURSE_SYSTEM.md](COURSE_SYSTEM.md)** - Course API documentation (13 endpoints)
- **[QUICK_START_COURSES.md](QUICK_START_COURSES.md)** - Course system user guide
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - System architecture
- **[package.json](package.json)** - Node.js dependencies and scripts
- **[server.js](server.js)** - Express API implementation details
- **[.env](.env)** - Environment configuration template

## 🏗️ Development Mode

For development with automatic server restart on file changes:
```bash
npm run dev
```

This uses `nodemon` to watch for changes and restart the server automatically.

## 📦 Dependencies

### Runtime
- **express** (v4.18+) - Web framework
- **cors** - Cross-origin requests
- **body-parser** - Request body parsing
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **mysql2** - MySQL database client
- **dotenv** - Environment variables

### Development
- **nodemon** - Auto-restart on file changes

## 📄 License

This project is part of the InCreEdu platform. All rights reserved.

## 👥 Support

For issues or questions:
1. Check **[SETUP.md](SETUP.md)** troubleshooting section
2. Review **[database-utils.sql](database-utils.sql)** for database queries
3. Run `node test-api.js` to verify API functionality
4. Check browser console (F12) for frontend errors
5. Check server terminal for backend errors

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Status**: Production Ready
