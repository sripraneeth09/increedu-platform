# InCreEdu - Career Discovery Platform
## Database & Backend Setup Guide

### 📋 Project Structure
```
d:\gitam\
├── index.html                 # Main application
├── login.html                 # Login page
├── script.js                  # Main app JavaScript
├── login.js                   # Login JavaScript (updated for API)
├── styles.css                 # Main app styles
├── login-styles.css           # Login styles
├── server.js                  # Node.js/Express backend

├── package.json               # Node dependencies
├── .env                       # Environment configuration
└── README.md                  # This file
```

---

## 🗄️ Database Setup

### Prerequisites
- **MongoDB Server** installed and running (default listens on port 27017)
- **Node.js** (v14 or higher) installed

### Step 1: Start MongoDB

Make sure your MongoDB service is running (`mongod`). The application will connect to the URI specified in `.env` (`mongodb://localhost:27017/InCreEdu` by default) and automatically create the required collections.

### Step 2: Seed Data

Sample users (3 learners / 3 teachers) are seeded on first server startup; no manual import is required.

---

## 🚀 Backend Server Setup

### Step 1: Install Dependencies

Navigate to the project directory and install Node packages:

```bash
cd d:\gitam
npm install
```

This installs:
- **express**: Web framework
- **cors**: Cross-origin requests
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT authentication
- **mysql2**: MySQL database driver
- **dotenv**: Environment variables

### Step 2: Configure Environment

Edit the `.env` file and update MongoDB connection string:

```env
DB_URI=mongodb://localhost:27017/InCreEdu
JWT_SECRET=your_secret_key_here
```
### Step 3: Start the Server

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

You should see:
```
╔════════════════════════════════════╗
║  InCreEdu Server Started           ║
║  Port: 5000                        ║
║  Environment: development          ║
╚════════════════════════════════════╝
```

---

## 🔐 Test Credentials

Use these credentials to test login:

**Learners:**
- ID: `LRN123456` | Password: `demo123`
- ID: `LRN234567` | Password: `demo123`
- ID: `LRN345678` | Password: `demo123`

**Teachers:**
- ID: `TCH789012` | Password: `demo123`
- ID: `TCH890123` | Password: `demo123`
- ID: `TCH901234` | Password: `demo123`

---

## 📡 API Endpoints

### 1. **Login**
```
POST /api/login
Content-Type: application/json

{
    "user_id": "LRN123456",
    "password": "demo123",
    "user_type": "learner"
}

Response:
{
    "status": "success",
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
        "id": 1,
        "user_id": "LRN123456",
        "user_type": "learner",
        "email": "learner1@example.com",
        "full_name": "John Doe"
    }
}
```

### 2. **Verify Token**
```
POST /api/verify-token
Authorization: Bearer {token}

Response:
{
    "status": "success",
    "user": {
        "id": 1,
        "user_id": "LRN123456",
        "user_type": "learner",
        "email": "learner1@example.com"
    }
}
```

### 3. **Get User Profile**
```
GET /api/user/:user_id
Authorization: Bearer {token}

Response:
{
    "status": "success",
    "user": {
        "id": 1,
        "user_id": "LRN123456",
        "user_type": "learner",
        "email": "learner1@example.com",
        "full_name": "John Doe",
        "institution": "Harvard University",
        "created_at": "2024-01-15T10:30:00"
    }
}
```

### 4. **Change Password**
```
POST /api/change-password
Authorization: Bearer {token}
Content-Type: application/json

{
    "old_password": "demo123",
    "new_password": "newpassword123"
}

Response:
{
    "status": "success",
    "message": "Password changed successfully"
}
```

### 5. **Get Login History**
```
GET /api/login-history/:user_id
Authorization: Bearer {token}

Response:
{
    "status": "success",
    "login_history": [
        {
            "id": 1,
            "login_time": "2024-01-20T14:30:00",
            "ip_address": "192.168.1.100",
            "device_info": "Mozilla/5.0...",
            "logout_time": "2024-01-20T14:45:00"
        }
    ]
}
```

### 6. **Logout**
```
POST /api/logout
Content-Type: application/json

{
    "user_id": "LRN123456"
}

Response:
{
    "status": "success",
    "message": "Logged out successfully"
}
```

### 7. **Health Check**
```
GET /api/health

Response:
{
    "status": "success",
    "message": "Database connection successful",
    "timestamp": "2024-01-20T14:30:00"
}
```

---

## 🔒 Security Features

✅ **Password Hashing**: bcryptjs (10 rounds)
✅ **JWT Authentication**: Secure token-based auth
✅ **Session Management**: Login/logout tracking
✅ **IP Logging**: Records user IP addresses
✅ **Device Tracking**: Stores device information
✅ **Account Status**: Disabled accounts blocked
✅ **CORS Protection**: Configured origins only
✅ **Input Validation**: Server-side validation

---

## 🛠️ Troubleshooting

### "Error: ECONNREFUSED" (Port 5000)
- Check if server is running
- Try different port: `PORT=3000 npm start`

### "Error: ER_ACCESS_DENIED_FOR_USER"
- Verify MySQL credentials in `.env`
- Check MySQL is running: `net start MySQL80` (Windows)

### "Error: ER_NO_DB_ERROR"
- Ensure database is created: `CREATE DATABASE incredu;`
- Import schema: `mysql -u root incredu < database.sql`

### "Error: Can't find module"
- Run `npm install` again
- Delete `node_modules` and try again

### "CORS Error in Browser"
- Ensure server is running on port 5000
- Check `.env` `CORS_ORIGIN` setting

---

## 📊 Database Schema

### `users` Table
| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| user_id | VARCHAR(50) | Unique learner/teacher ID |
| user_type | ENUM | 'learner' or 'teacher' |
| password_hash | VARCHAR(255) | Bcrypt hashed password |
| email | VARCHAR(100) | Email address |
| full_name | VARCHAR(100) | User's name |
| institution | VARCHAR(100) | School/university |
| created_at | TIMESTAMP | Account creation time |
| is_active | BOOLEAN | Account status |

### `login_logs` Table
| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| user_id | INT | Foreign key to users |
| login_time | TIMESTAMP | When user logged in |
| ip_address | VARCHAR(45) | User's IP address |
| device_info | VARCHAR(255) | Browser/device info |
| logout_time | TIMESTAMP | When user logged out |
| session_duration | INT | Duration in seconds |

### `password_resets` Table
| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| user_id | INT | Foreign key to users |
| reset_token | VARCHAR(255) | Unique reset token |
| expires_at | TIMESTAMP | Token expiration |
| created_at | TIMESTAMP | Request time |
| used | BOOLEAN | If token was used |

---

## 🎯 Next Steps

1. **Add more users**: Insert credentials into `users` table
2. **Customize**: Update colors, text in HTML/CSS files
3. **Deploy**: Use services like Heroku, AWS, or DigitalOcean
4. **Email Integration**: Add password reset emails
5. **Two-Factor Auth**: Implement 2FA for security
6. **Admin Dashboard**: Create admin panel
7. **Analytics**: Track user progress and assessments

---

## 📞 Support

For issues or questions, refer to:
- [Express.js Docs](https://expressjs.com/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [JWT Documentation](https://jwt.io/)
- [bcryptjs Docs](https://github.com/dcodeIO/bcrypt.js)

---

## ✅ Quick Start Checklist

- [ ] MySQL installed and running
- [ ] Database created: `incredu`
- [ ] Tables imported from `database.sql`
- [ ] Node.js installed
- [ ] Dependencies installed: `npm install`
- [ ] `.env` file configured
- [ ] Server started: `npm start`
- [ ] Test login at `login.html`
- [ ] Verify data in database

---

**Version**: 1.0.0  
**Last Updated**: February 2026  
**License**: MIT
