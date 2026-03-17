# Teacher Course Upload & Learner Course Discovery System

## Overview

InCreEdu now features a complete course management system enabling teachers to create, manage, and track courses, while learners discover and enroll in content tailored to their domain and level.

## Features

### 🏫 Teacher Features

#### 1. **Course Upload Interface**
- **Location**: Teacher Dashboard → "Upload Course" tab
- **Fields**:
  - Course Title (required)
  - Domain: Technology, Business, Creative, Healthcare, Education
  - Role/Track (e.g., "Web Developer", "Data Scientist")
  - Level (1-4): Beginner → Expert
  - Video URL (YouTube or streaming platform)
  - Thumbnail URL (optional)
  - Duration in minutes
  - Description (course overview)
  - Tags (comma-separated keywords)

#### 2. **Course Management**
- **Manage Courses Tab**:
  - View all uploaded courses in card format
  - Edit course details (all fields editable)
  - Delete courses permanently
  - Quick stats: Views, Enrolled learners, Average rating

#### 3. **Analytics Dashboard**
- **Analytics Tab**:
  - Total views per course
  - Enrollment count
  - Learner completion tracking
  - Student ratings and reviews
  - Detailed learner list with completion status
  - Engagement metrics

### 👨‍🎓 Learner Features

#### 1. **Course Discovery**
- **Location**: Learning Courses section (appears after login)
- **Auto-filtered by**:
  - Current domain selection
  - Player level (shows courses up to current level + 1)
- **Course Display**:
  - Course title and description
  - Domain, Role, Level badge
  - View count
  - Enrolled learner count
  - Star ratings and review count
  - Duration indicator
  - "View" and "Enroll" buttons

#### 2. **Course Enrollment**
- Click "Enroll" button to join a course
- Automatic tracking of enrollment date
- View enrolled courses in personal dashboard

#### 3. **Course Completion**
- Mark courses as completed
- Submit optional rating (1-5 stars)
- Write course review
- Automatic average rating calculation

---

## API Endpoints

### Teacher Endpoints (Protected - Requires verified teacher token)

#### 1. **Create Course**
```
POST /api/teacher/courses
Content-Type: application/json
Authorization: Bearer {token}

{
  "title": "Introduction to React",
  "domain": "Technology",
  "role": "Frontend Developer",
  "level": 2,
  "video_url": "https://youtube.com/watch?v=...",
  "thumbnail_url": "https://...",
  "duration_minutes": 60,
  "description": "Learn React basics...",
  "tags": ["react", "javascript", "frontend"]
}

Response: (201 Created)
{
  "status": "success",
  "message": "Course uploaded successfully",
  "course": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Introduction to React",
    "domain": "Technology",
    "role": "Frontend Developer",
    "level": 2,
    "created_at": "2026-03-02T10:30:00Z"
  }
}
```

#### 2. **Get All Teacher Courses**
```
GET /api/teacher/courses
Authorization: Bearer {token}

Response: (200 OK)
{
  "status": "success",
  "count": 5,
  "courses": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Introduction to React",
      "domain": "Technology",
      "role": "Frontend Developer",
      "level": 2,
      "views": 245,
      "enrolled_learners": 42,
      "rating": 4.8,
      "created_at": "2026-03-02T10:30:00Z"
    },
    ...
  ]
}
```

#### 3. **Get Single Course**
```
GET /api/teacher/courses/{courseId}
Authorization: Bearer {token}

Response: (200 OK)
{
  "status": "success",
  "course": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Introduction to React",
    "description": "Learn React basics",
    "domain": "Technology",
    "role": "Frontend Developer",
    "level": 2,
    "video_url": "https://youtube.com/watch?v=...",
    "views": 245,
    "enrolled_learners": 42,
    "rating": 4.8,
    "is_published": true,
    "created_at": "2026-03-02T10:30:00Z"
  },
  "analytics": { ... }
}
```

#### 4. **Update Course**
```
PUT /api/teacher/courses/{courseId}
Content-Type: application/json
Authorization: Bearer {token}

{
  "title": "Introduction to React - Advanced",
  "description": "Updated course description",
  "level": 3,
  "is_published": true
}

Response: (200 OK)
{
  "status": "success",
  "message": "Course updated successfully",
  "course": { ...updated course data... }
}
```

#### 5. **Delete Course**
```
DELETE /api/teacher/courses/{courseId}
Authorization: Bearer {token}

Response: (200 OK)
{
  "status": "success",
  "message": "Course deleted successfully"
}
```

#### 6. **Get Course Analytics**
```
GET /api/teacher/courses/{courseId}/analytics
Authorization: Bearer {token}

Response: (200 OK)
{
  "status": "success",
  "analytics": {
    "course_id": "507f1f77bcf86cd799439011",
    "title": "Introduction to React",
    "total_views": 245,
    "total_enrolled": 42,
    "completion_rate": 78.5,
    "average_completion_time": 120,
    "enrolled_learners": [
      {
        "learner": {
          "user_id": "LRN123456",
          "full_name": "Alice Johnson",
          "email": "alice@example.com"
        },
        "enrolled_date": "2026-03-01T14:22:00Z",
        "completed": true,
        "completion_date": "2026-03-02T16:45:00Z",
        "rating": 5,
        "review": "Excellent course!"
      },
      ...
    ]
  }
}
```

---

### Learner Endpoints (Protected - Requires learner token OR public)

#### 1. **Get Available Courses (Personalized)**
```
GET /api/learner/courses
Authorization: Bearer {learnerToken}

Response: (200 OK)
{
  "status": "success",
  "learner_domain": "Technology",
  "learner_level": 2,
  "count": 8,
  "courses": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Advanced JavaScript",
      "description": "Master advanced JS concepts",
      "domain": "Technology",
      "role": "Web Developer",
      "level": 2,
      "views": 245,
      "enrolled_learners": 42,
      "rating": 4.8,
      "number_of_reviews": 18,
      "teacher": {
        "user_id": "TCH789012",
        "full_name": "Prof. David Brown"
      }
    },
    ...
  ]
}
```

#### 2. **Get Available Courses (Public)**
```
GET /api/courses/available?domain=Technology&level=2&role=Developer

Response: (200 OK)
{
  "status": "success",
  "count": 12,
  "courses": [...]
}
```

#### 3. **Track Course View**
```
POST /api/learner/courses/{courseId}/view
Content-Type: application/json
Authorization: Bearer {token} (optional)

Response: (200 OK)
{
  "status": "success",
  "message": "View recorded",
  "views": 246
}
```

#### 4. **Enroll in Course**
```
POST /api/learner/courses/{courseId}/enroll
Authorization: Bearer {learnerToken}

Response: (200 OK)
{
  "status": "success",
  "message": "Successfully enrolled in course",
  "course": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Advanced JavaScript",
    "domain": "Technology",
    "role": "Web Developer",
    "level": 2
  }
}
```

#### 5. **Mark Course as Completed**
```
POST /api/learner/courses/{courseId}/complete
Content-Type: application/json
Authorization: Bearer {learnerToken}

{
  "rating": 5,
  "review": "Excellent course! Very comprehensive."
}

Response: (200 OK)
{
  "status": "success",
  "message": "Course marked as completed"
}
```

---

## Database Schemas

### Course Schema
```javascript
{
  _id: ObjectId,
  teacher: ObjectId(ref: Teacher),
  title: String (required),
  description: String,
  domain: String (required), // Technology, Business, Creative, etc.
  role: String (required),   // Web Developer, Data Scientist, etc.
  level: Number (1-4, required),
  video_url: String (required),
  thumbnail_url: String,
  duration_minutes: Number,
  views: Number (default: 0),
  enrolled_learners: Number (default: 0),
  rating: Number (0-5, default: 0),
  number_of_reviews: Number (default: 0),
  is_published: Boolean (default: true),
  tags: [String],
  created_at: Date,
  updated_at: Date
}
```

### CourseAnalytics Schema
```javascript
{
  _id: ObjectId,
  course: ObjectId(ref: Course),
  total_views: Number,
  unique_viewers: [ObjectId], // Learner IDs
  total_enrolled: Number,
  enrolled_learners: [
    {
      learner: ObjectId(ref: Learner),
      enrolled_date: Date,
      completed: Boolean,
      completion_date: Date,
      rating: Number,
      review: String
    }
  ],
  average_completion_time_minutes: Number,
  completion_rate: Number,
  last_updated: Date
}
```

### TeacherVerification Schema
```javascript
{
  _id: ObjectId,
  teacher: ObjectId(ref: Teacher),
  credentials: String,
  expertise_domains: [String],
  years_of_experience: Number,
  verification_status: String (pending|approved|rejected),
  verification_date: Date,
  verified_by: String,
  submission_date: Date,
  documents: [String],
  notes: String
}
```

---

## UI Components

### Teacher Dashboard Tabs

#### Upload Course Tab
- Form with all required fields
- Real-time validation
- Success feedback message
- Form reset after submission

#### Manage Courses Tab
- Card-based course display
- Inline statistics (views, enrollments, rating)
- Action buttons: Edit, Analytics, Delete
- Edit modal with pre-filled form data
- Confirmation dialog for deletion

#### Analytics Tab
- Overview cards showing total stats
- Clickable course cards for detailed analytics
- Learner list with completion status
- Rating and review display

### Learner Courses Section
- Grid layout for course cards
- Course thumbnail/placeholder
- Course metadata display
- Refresh button for manual reload
- "View" and "Enroll" buttons
- Auto-loading on learner login

---

## Video URL Compatibility

Supported platforms:
- YouTube (https://youtube.com/watch?v=...)
- Vimeo (https://vimeo.com/...)
- Custom streaming (any valid video URL)

---

## Filtering & Display Logic

### Course Visibility for Learners
- **Domain Match**: Shows courses in selected domain
- **Level Filtering**: Shows courses for current level and one level above
  - Level 1 learner → sees Level 1 & 2 courses
  - Level 2 learner → sees Level 2 & 3 courses
  - Level 3 learner → sees Level 3 & 4 courses
  - Level 4 learner → sees Level 4 courses only

### View Tracking
- Increments course view count
- Tracks unique viewers (if logged in)
- Used for popularity metrics

### Enrollment Tracking
- Records learner enrollment date
- Prevents duplicate enrollments
- Increments enrolled_learners count

---

## Administrative Features

### Teacher Verification
- Teachers cannot upload courses without verification
- Admin endpoint: `POST /api/teacher/verify`
- Verification status stored in TeacherVerification collection

### Course Publishing
- Teachers can draft/publish courses
- `is_published: false` hides from learners
- Update endpoint allows toggling publication status

---

## Best Practices

### For Teachers
1. ✅ Use descriptive, searchable titles
2. ✅ Add relevant tags for discoverability
3. ✅ Set appropriate difficulty levels
4. ✅ Include quality thumbnails
5. ✅ Add comprehensive descriptions
6. ✅ Monitor analytics for engagement

### For Learners
1. ✅ View course details before enrolling
2. ✅ Start with Level 1 courses if new
3. ✅ Complete courses fully before rating
4. ✅ Provide constructive feedback
5. ✅ Progress through levels systematically

---

## Future Enhancements

- [ ] Live class scheduling
- [ ] Peer-to-peer learning groups
- [ ] Certificate generation
- [ ] Payment integration for premium courses
- [ ] Advanced search and filtering
- [ ] Prerequisite course linking
- [ ] Discussion forums per course
- [ ] Assignment submission system
- [ ] Course recommendations engine
- [ ] Batch enrollment

---

## Test Results

All 13 API endpoints tested and validated ✓:
1. ✓ Teacher Login
2. ✓ Upload Course
3. ✓ Get Courses
4. ✓ Get Course Details
5. ✓ Update Course
6. ✓ Track View
7. ✓ Get Analytics
8. ✓ Learner Login
9. ✓ Get Available Courses
10. ✓ Enroll in Course
11. ✓ Complete Course
12. ✓ Get Public Courses
13. ✓ Delete Course

**Success Rate: 100%** ✓
