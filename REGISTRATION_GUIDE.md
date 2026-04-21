# InCreEdu - Dynamic User Registration Guide

## 📝 Overview

The login system has been upgraded to support **dynamic user registration**. Users can now:
- Create new accounts directly from the login page
- No longer need pre-existing credentials
- Register as either **Learner** or **Teacher**
- Account credentials are automatically stored in the MySQL database

## 🔄 Architecture

### Before (Static Credentials)
```
Sample User Data → Database → Login Match → Token
(Pre-populated only)
```

### After (Dynamic Registration)
```
New User Input → Registration API → Validate → Hash Password → Store in DB → Auto-Login
                                       ↓
                              Check Duplicate User/Email
```

## 📱 User Interface Changes

### Login Page (`login.html`)
The login page now has **2 main tabs**:

1. **Login Tab** - For existing users
   - Enter User ID and Password
   - Click "Login as Learner" or "Login as Teacher"
   - (Note: Login dropdown has been simplified to single login form)

2. **Register Tab** - For new users
   - Account Type: Learner or Teacher (dropdown)
   - User ID: Unique identifier (6+ characters)
   - Full Name: Your complete name
   - Email: Valid email address
   - Institution: School/College/University (optional)
   - Password: 6+ chars with at least one number
   - Confirm Password: Must match password field
   - Click "Create Account"

### Form Validation

**Frontend Validation:**
- User ID: Minimum 6 characters
- Full Name: Minimum 3 characters
- Email: Valid email format (contains @)
- Password: 6+ characters AND must contain a number
- Confirm Password: Must exactly match password field
- All error messages display as dismissible alerts

**Backend Validation:**
- User ID uniqueness check
- Email uniqueness check
- Password strength verification
- Email format validation
- All required fields check

## 🗄️ Database Integration

### Table Structure (No Changes)
The `users` table structure remains the same:

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(50) UNIQUE NOT NULL,
  user_type ENUM('learner', 'teacher') NOT NULL,
  password_hash VARCHAR(255) NOT NULL,      -- bcryptjs hashed
  email VARCHAR(100),
  full_name VARCHAR(100),
  institution VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  INDEX(user_id)
);
```

### Registration Flow

```
User Submits Registration Form
         ↓
Frontend Validation (JavaScript)
         ↓
POST /api/register to Backend
         ↓
Server-side Validation:
  ├─ User ID not empty
  ├─ Email valid format
  ├─ Password 6+ chars
  ├─ Password contains number
  ├─ User ID unique (DB check)
  └─ Email unique (DB check)
         ↓
Hash Password (bcryptjs, 10 rounds)
         ↓
INSERT INTO users
         ↓
Generate JWT Token
         ↓
Return success + token
         ↓
Browser Auto-Login + Redirect to index.html
```

## 🔌 API Endpoints

### New Endpoint: POST /api/register

**Request:**
```json
{
  "user_id": "STU000001",
  "user_type": "learner",
  "full_name": "John Doe",
  "email": "john@example.com",
  "institution": "Harvard University",
  "password": "secure123"
}
```

**Success Response (201):**
```json
{
  "status": "success",
  "message": "Account created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 42,
    "user_id": "STU000001",
    "user_type": "learner",
    "email": "john@example.com",
    "full_name": "John Doe"
  }
}
```

**Error Responses:**

1. **400 Bad Request** - Validation failed
```json
{
  "status": "error",
  "message": "Password must contain at least one number"
}
```

2. **409 Conflict** - User or email already exists
```json
{
  "status": "error",
  "message": "User ID already exists. Please choose a different ID."
}
```

3. **500 Server Error** - Server-side issue
```json
{
  "status": "error",
  "message": "Server error during registration",
  "error": "detailed error message"
}
```

## 🧪 Testing Registration

### Manual Testing

1. **Start the Server**
   ```bash
   npm start
   ```

2. **Navigate to Login Page**
   ```
    {YOUR_HOST_URL}/login.html
    (e.g., https://your-deployment-url.onrender.com/login.html)
   ```

3. **Click "Register" Tab**

4. **Fill Registration Form**
   ```
   Account Type: Learner
   User ID: NEWSTU001
   Full Name: Alice Brown
   Email: alice@university.edu
   Institution: MIT
   Password: password123
   Confirm: password123
   ```

5. **Click "Create Account"**

6. **Verify:**
   - Success message appears
   - Redirected to index.html
   - User info displayed in navbar
   - Check database: `SELECT * FROM users WHERE user_id='NEWSTU001';`

### Using Test API Script

```bash
# Test registration endpoint with curl
curl -X POST $API_URL/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "TCH000001",
    "user_type": "teacher",
    "full_name": "Prof. Smith",
    "email": "prof.smith@university.edu",
    "institution": "Stanford",
    "password": "teacher123"
  }'
```

## 🔐 Security Features

### Password Security
- ✅ Bcryptjs hashing with 10 salt rounds
- ✅ Password strength validation (6+ chars, includes number)
- ✅ Passwords never stored in plain text
- ✅ Passwords never sent back to client

### Data Validation
- ✅ Frontend validation for UX
- ✅ Backend validation for security
- ✅ Email format validation (RFC 5322 simplified)
- ✅ SQL injection prevention (parameterized queries)

### Uniqueness Checks
- ✅ User ID must be unique across entire system
- ✅ Email must be unique across entire system
- ✅ Prevents duplicate account creation
- ✅ Database constraints enforced with UNIQUE indexes

### Session Management
- ✅ JWT token issued upon successful registration
- ✅ Token auto-login (no password re-entry needed)
- ✅ 24-hour token expiration
- ✅ Login history tracked in `login_logs` table

## 📊 Database Queries for Registration

### View Recently Registered Users
```sql
SELECT user_id, user_type, full_name, email, created_at 
FROM users 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
ORDER BY created_at DESC;
```

### Count Registrations by Type
```sql
SELECT user_type, COUNT(*) as count 
FROM users 
GROUP BY user_type;
```

### Find Duplicate Emails (Should be 0)
```sql
SELECT email, COUNT(*) as count 
FROM users 
GROUP BY email 
HAVING count > 1;
```

### List All Users with Registration Date
```sql
SELECT id, user_id, user_type, full_name, email, created_at, is_active
FROM users
ORDER BY created_at DESC;
```

## 🚀 JavaScript Functions Added

### `handleRegister(event)` - Registration Form Handler
- Validates all form inputs
- Sends POST request to /api/register
- Handles success/error responses
- Auto-logs in user after registration
- Redirects to main application

### `validateRegistration()` - Form Validation
- User ID length check (6+ chars)
- Full name check (3+ chars)
- Email format validation
- Password strength (6+ chars, includes number)
- Password confirmation match
- Shows error messages to user

### `clearForm(tab)` - Form Reset
- Clears register form fields
- Resets to default values
- Called when switching tabs

## 🔄 Session Flow After Registration

```
User Submits Registration
         ↓
Account Created in Database
         ↓
JWT Token Generated
         ↓
sessionStorage.setItem('token', token)
sessionStorage.setItem('isLoggedIn', 'true')
sessionStorage.setItem('userId', user_id)
sessionStorage.setItem('userName', full_name)
sessionStorage.setItem('userType', user_type)
sessionStorage.setItem('userEmail', email)
         ↓
Redirect to index.html
         ↓
index.html calls checkLoginStatus()
         ↓
Token Verified Against Backend
         ↓
Homepage Loads with User Info
```

## ❌ Error Handling

The system handles these registration scenarios:

| Scenario | Response | User Message |
|----------|----------|--------------|
| User ID too short | 400 | "User ID must be at least 6 characters" |
| Invalid email | 400 | "Please enter a valid email address" |
| Weak password | 400 | "Password must contain at least one number" |
| Passwords don't match | 400 | "Passwords do not match" |
| User ID already exists | 409 | "User ID already exists. Please choose a different ID." |
| Email already registered | 409 | "Email already registered. Please use a different email." |
| Connection error | Network | "Connection error. Make sure the server is running." |
| Server crash | 500 | "Server error during registration" |

## 🔗 File Changes Summary

### Modified Files:

1. **login.html**
   - Changed tab structure (Login / Register tabs)
   - Added registration form with 7 fields
   - Field validation messages
   - Link to switch back to login from register

2. **login.js**
   - Updated `switchTab()` function
   - Updated `clearForm()` function
   - Added `handleRegister()` function
   - Added `validateRegistration()` function
   - Updated `showError()` to handle 'register' form type

3. **server.js**
   - Added POST `/api/register` endpoint
   - Validates all user inputs
   - Checks for duplicate user_id and email
   - Hashes password with bcryptjs
   - Inserts new user into database
   - Generates JWT token
   - Logs first login in login_logs table

## ✅ Testing Checklist

- [ ] Start server: `npm start`
- [ ] Open login.html in browser
- [ ] Click "Register" tab
- [ ] Try registering with valid data
- [ ] Verify redirect to index.html
- [ ] Check user info displays correctly
- [ ] Check database has new user: `SELECT * FROM users WHERE user_id='NEW_USER_ID';`
- [ ] Try registering with duplicate User ID → should show error
- [ ] Try registering with duplicate email → should show error
- [ ] Try registering with weak password → should show error
- [ ] Try login with newly registered account
- [ ] Check login_logs shows registration login

## 🎯 Key Improvements

✨ **No More Static Sample Data Required**
- New users can self-register without admin involvement
- Immediate access upon account creation
- Demo users no longer needed for testing

✨ **Better User Experience**
- "Register" and "Login" clearly separated
- Dual login form (teacher/learner distinction supported)
- Clear field labels and requirements
- Real-time validation feedback

✨ **Production-Ready**
- Duplicate prevention (User ID + Email uniqueness)
- Password strength requirements
- Input validation on both frontend and backend
- Secure password hashing
- Audit trail of registration (in login_logs)

## 📚 Next Steps

1. **Production Deployment**
   - Update JWT_SECRET in .env
   - Set NODE_ENV=production
   - Update CORS origins

2. **Email Verification** (Optional)
   - Send confirmation email to registered address
   - Require email verification before login

3. **Additional Features**
   - Password reset via email
   - Account deactivation
   - Admin user management panel
   - Email notifications

---

**Last Updated**: February 26, 2026
**Version**: 2.0.0 - Dynamic Registration
**Status**: Production Ready
