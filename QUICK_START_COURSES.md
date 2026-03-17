# Quick Start Guide: Course Upload & Discovery System

## 🏫 For Teachers

### Getting Started

#### Step 1: Login as Teacher
1. Go to login.html
2. Click "Teacher Login" tab
3. Enter credentials:
   - User ID: `TCH789012`
   - Password: `demo123`
4. Click "Login"

#### Step 2: Verify Teacher Account
> ⚠️ Your account must be verified before uploading courses
- Default teacher accounts (TCH789012, TCH890123, TCH901234) are pre-verified
- Contact admin if your account needs verification

#### Step 3: Access Teacher Dashboard
After login, you'll see the "Teacher Dashboard" section with three tabs:

### Tab 1: Upload Course

**Form Fields:**
- **Course Title** (required): "Advanced JavaScript Patterns"
- **Domain** (required): Select from dropdown
  - Technology
  - Business
  - Creative
  - Healthcare
  - Education
- **Role/Track** (required): "Web Developer", "Full-Stack Engineer", etc.
- **Level** (required): 1-4 (Beginner to Expert)
- **Video URL** (required): 
  - YouTube: `https://youtube.com/watch?v=...`
  - Any streaming platform
- **Thumbnail URL** (optional): Course preview image
- **Duration** (optional): Minutes of course content
- **Tags** (optional): Comma-separated keywords
  - Example: `javascript, design-patterns, advanced`
- **Description** (optional): Course overview and learning outcomes

**Example:**
```
Title: React Hooks Mastery
Domain: Technology
Role: Frontend Developer
Level: 3
Video URL: https://youtube.com/watch?v=example
Duration: 120
Tags: react, hooks, state-management
Description: Learn advanced React hooks including useContext, useReducer, and custom hooks...
```

**Submit:**
- Click "Upload Course"
- Wait for success message
- Form clears automatically

### Tab 2: Manage Courses

**View Your Courses:**
- Each course shows as a card with:
  - Title and metadata
  - Level badge
  - Stats: Views | Enrolled learners | Rating
  - Action buttons

**Actions:**
- **Edit**: Modify course details (click Edit button)
  - Form pre-fills with existing data
  - Submit to save changes
- **Analytics**: View detailed engagement (click Analytics button)
  - Total views and enrollments
  - Learner completion status
  - Student ratings and reviews
- **Delete**: Permanently remove course (click Delete button)
  - Confirmation required
  - Cannot be undone

### Tab 3: Analytics

**Overview Cards:**
- Total views across all courses
- Total enrolled learners
- Completion rates
- Average completion time

**Detailed Analytics:**
- Click any course card to view detailed metrics
- Learner names, email, completion status
- Individual ratings and reviews
- Engagement statistics

**Using Analytics:**
- Identify popular courses
- Monitor learner engagement
- Improve based on completion rates
- Respond to student feedback

---

## 👨‍🎓 For Learners

### Getting Started

#### Step 1: Login as Learner
1. Go to login.html
2. Click "Learner Login" tab
3. Enter credentials:
   - User ID: `LRN123456`
   - Password: `demo123`
4. Click "Login"

#### Step 2: Complete Assessment
1. Click "Begin My Journey" button
2. Answer assessment questions (8 questions)
3. Get career path recommendation
4. Select specific role
5. View personalized roadmap

#### Step 3: Access Learning Courses
After completing your profile setup, you'll see "Learning Courses" section

### Course Discovery

Courses are **automatically filtered** by:
- ✓ Your selected domain (e.g., Technology)
- ✓ Your current level (shows current + next level)

**Course Cards Display:**
- Course title and brief description
- Domain and role information
- Level badge (L1, L2, L3, L4)
- Student rating with review count
- View count and enrollment count
- Duration of the course
- Thumbnail image

### Enrolling in Courses

**Browse Courses:**
1. Scroll through "Learning Courses" section
2. Read course descriptions
3. Check level and ratings

**Enroll:**
1. Click **"View"** button to track course view
2. Click **"Enroll"** button to join
3. Success message appears
4. Check your enrollments

**Complete Course:**
1. Watch the course (from link in analytics)
2. Return to app and enroll if not done
3. Click "Complete" after finishing
4. **Optional**: Add rating (1-5 stars)
5. **Optional**: Write a review

### Finding Courses for Your Level

**Level-Based Filtering:**
- **Level 1 learner**: See courses marked as Level 1-2
- **Level 2 learner**: See courses marked as Level 2-3
- **Level 3 learner**: See courses marked as Level 3-4
- **Level 4 learner**: See courses marked as Level 4

**Progress Path:**
1. Start with Level 1 foundational courses
2. Complete and get rated
3. Progress to Level 2 intermediate courses
4. Build up to Level 4 expert content

---

## 📊 Common Workflows

### Teacher: Create and Manage a Course Series

**Scenario:** You want to create a 4-level course series on Web Development

1. **Create Level 1: Basics**
   - Title: "Web Development Fundamentals"
   - Level: 1
   - Content: HTML, CSS, JavaScript basics

2. **Create Level 2: Intermediate**
   - Title: "Advanced CSS & JavaScript"
   - Level: 2
   - Content: Flexbox, ES6+, DOM manipulation

3. **Create Level 3: Frameworks**
   - Title: "React Fundamentals"
   - Level: 3
   - Content: Components, State, Hooks

4. **Create Level 4: Advanced**
   - Title: "React Performance & Patterns"
   - Level: 4
   - Content: Advanced patterns, optimization

**Track Progress:**
- After uploading, go to Analytics tab
- Watch engagement grow as learners progress
- Adjust content based on completion rates

---

### Learner: Complete a Learning Path

**Scenario:** You're a Technology domain learner starting at Level 1

1. **Start Your Journey**
   - Select "Technology" domain
   - Select "Web Developer" role
   - Complete Level 1 courses

2. **Progress Through Levels**
   - Level 1: Learn HTML, CSS, JavaScript basics
   - Complete courses and submit ratings
   - Advance to Level 2

3. **Level 2: Intermediate Skills**
   - Learn advanced JavaScript and CSS
   - Use modern tools and frameworks
   - Complete 2-3 courses

4. **Level 3: Deep Expertise**
   - Master React or your chosen framework
   - Build projects
   - Get certified

5. **Level 4: Expert Status**
   - Advanced patterns and optimization
   - Lead projects
   - Potentially become a teacher!

---

## ⚠️ Troubleshooting

### Course Upload Issues

**"Teacher not verified" error**
- Solution: Contact admin to verify your teacher account
- Verified teachers can upload immediately

**Form validation errors**
- Ensure all required fields are filled
- Use valid URLs for video and thumbnail
- Level must be 1-4

**Course not appearing in listings**
- Check `is_published` is true
- Ensure domain is set correctly
- Verify level matches expected range

### Enrollment Issues

**"No courses available" for learners**
- Complete assessment first to set domain
- Progress through levels to unlock higher-level courses
- Check that courses are published

**Can't find a specific course**
- Use the Refresh button to reload courses
- Verify the course domain matches your selection
- Check if you've already enrolled

---

## 🎯 Tips & Tricks

### For Teachers

✅ **Best Practices:**
1. **Use clear, searchable titles**
   - ❌ "Course 1" 
   - ✅ "Introduction to React Hooks"

2. **Set topics as tags**
   - Examples: `javascript`, `react`, `hooks`, `state-management`
   - Helps learners find your courses

3. **Review analytics weekly**
   - Monitor completion rates
   - Respond to student feedback
   - Improve low-performing sections

4. **Set appropriate levels**
   - Level 1: No prerequisites
   - Level 2: Assumes Level 1 knowledge
   - Level 3: Assumes Level 1-2 foundation
   - Level 4: Advanced topics only

5. **Include video duration**
   - Helps learners plan study time
   - Increases credibility

### For Learners

✅ **Best Strategies:**
1. **Follow the level progression**
   - Don't skip levels
   - Build solid foundations first

2. **Read descriptions carefully**
   - Check prerequisites
   - Understand learning outcomes

3. **Complete before rating**
   - Watch full course
   - Then provide honest feedback

4. **Check teacher profiles**
   - Look at instructor ratings
   - Read other student reviews

5. **Take notes while learning**
   - Use external tools if needed
   - Practice concepts immediately

---

## 📱 UI Navigation Map

```
Login Page
    ↓
Teacher Login → Teacher Dashboard
                ├─ Upload Course (Create new course)
                ├─ Manage Courses (Edit/Delete/View)
                └─ Analytics (View engagement data)

Learner Login → Main App (Assessment & Roadmap)
                ↓
            Learning Courses Section
                ├─ Course Cards (Browse)
                ├─ View Button (Track view)
                ├─ Enroll Button (Join course)
                └─ Complete Button (Finish & rate)
```

---

## 🔐 Security Notes

- **Verified teachers only**: Only verified teachers can upload courses
- **Protected endpoints**: All teacher actions require authentication
- **Learner data privacy**: Reviews are associated with learner accounts
- **Token expiration**: Sessions expire after 24 hours
- **Secure passwords**: Remember to change default passwords

---

## 📞 Support

For issues or questions:
1. Check the [COURSE_SYSTEM.md](COURSE_SYSTEM.md) for detailed API documentation
2. Review test results in [test-courses.js](test-courses.js)
3. Check browser console for error messages
4. Contact admin for account verification issues

---

**Happy Teaching and Learning! 🚀**
