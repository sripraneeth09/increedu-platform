# InCreEdu Progress Tracking System

## Overview

The InCreEdu platform includes a comprehensive **persistent progress tracking system** that maintains user learning journey across sessions. This system ensures users never lose their progress and can resume their learning paths seamlessly.

## Features

### 1. **Persistent User Progress**
- User progress is automatically saved to the backend database
- Progress survives page refreshes, browser closes, and new logins
- Users resume from their last completed level automatically

### 2. **Smart Data Synchronization**
- **Auto-save**: Progress auto-saves every 30 seconds
- **Real-time sync**: Changes sync immediately when tasks are completed
- **Offline support**: Uses local storage fallback when offline
- **Sync indicators**: Visual feedback showing sync status

### 3. **Goal Allocation & Tracking**
- Create learning goals with target dates and levels
- Automatic progress tracking toward goals
- Visual countdown timers showing days remaining
- Status indicators (On-track, Overdue, Completed)

### 4. **Conflict Detection**
- Alerts users when switching between different career paths
- Preserves progress for all paths
- Allows seamless switching between roles

### 5. **Sync Status Monitoring**
- Real-time sync status displayed in navbar
- Shows "Syncing...", "Last synced at...", or "Sync failed" messages
- Color-coded feedback (green=success, red=error, gray=neutral)

## Database Schema

### `user_progress` Table
```sql
CREATE TABLE user_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    selected_domain TEXT,
    selected_role TEXT,
    current_level INTEGER DEFAULT 0,
    completed_tasks TEXT DEFAULT '[]',
    total_tasks INTEGER DEFAULT 0,
    progress_percentage INTEGER DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    goals TEXT DEFAULT '[]',
    FOREIGN KEY(user_id) REFERENCES users(id)
);
```

## API Endpoints

### 1. Save Progress
**Endpoint**: `POST /api/save-progress`

**Request Body**:
```json
{
    "user_id": "STU123456",
    "selected_domain": "tech",
    "selected_role": "Software Developer",
    "current_level": 2,
    "completed_tasks": ["1-0", "1-1", "2-0"],
    "total_tasks": 12,
    "progress_percentage": 25
}
```

**Response**:
```json
{
    "status": "success",
    "message": "Progress saved successfully"
}
```

### 2. Load Progress
**Endpoint**: `GET /api/user-progress/{user_id}`

**Response**:
```json
{
    "status": "success",
    "data": {
        "id": 1,
        "user_id": 1,
        "selected_domain": "tech",
        "selected_role": "Software Developer",
        "current_level": 2,
        "completed_tasks": ["1-0", "1-1", "2-0"],
        "total_tasks": 12,
        "progress_percentage": 25,
        "last_updated": "2026-02-26T10:30:00",
        "goals": [...]
    }
}
```

### 3. Update Goals
**Endpoint**: `POST /api/update-goals`

**Request Body**:
```json
{
    "user_id": "STU123456",
    "goals": [
        {
            "id": 1234567890,
            "title": "Complete Level 2 - Web Development",
            "targetDate": "2026-03-26",
            "targetLevel": 2,
            "createdAt": "2026-02-26T08:00:00",
            "status": "active",
            "progress": 50
        }
    ]
}
```

**Response**:
```json
{
    "status": "success",
    "message": "Goals updated successfully"
}
```

## Frontend Implementation

### State Management
The `state` object tracks:
```javascript
{
    // Core progress
    selectedDomain: "tech",
    selectedRole: RoleObject,
    currentLevel: 0,
    completedTasks: Set(),
    totalTasks: 12,
    
    // Goals management
    goals: [],
    
    // Sync status
    isSyncing: false,
    lastSyncTime: Date,
    unsavedChanges: false,
    
    // Recovery
    hasExistingProgress: true,
    currentRoadmap: LevelsArray
}
```

### Key Functions

#### Load Progress on Login
```javascript
await loadUserProgress()
// - Loads saved progress from backend
// - Falls back to local storage if offline
// - Shows sync status
// - Restores completed tasks
```

#### Save Progress After Actions
```javascript
saveUserProgress()
// - Called after task completion
// - Auto-saves every 30 seconds
// - Retries up to 3 times on failure
// - Updates sync status indicator
```

#### Allocate Goals
```javascript
allocateGoal('Complete Level 2', '2026-03-26', 2)
// - Creates new goal with target date
// - Automatically tracks progress
// - Shows deadline countdown
```

#### Display Goal Progress
```javascript
displayGoals()
// - Shows all active goals
// - Color-coded status (green/orange/red)
// - Progress bars for each goal
// - Days remaining counter
```

## User Experience Flow

### 1. First Time User
1. Completes career assessment
2. Selects domain and role
3. Starts Level 1
4. Progress automatically saved

### 2. Returning User
1. Logs in
2. Progress automatically loaded
3. Shown message: "Welcome back! Resuming from Level X"
4. Can continue from saved position

### 3. Changing Career Path
1. User selects different role
2. System alerts: "You have existing progress..., do you want to switch?"
3. Previous progress preserved
4. New path starts

### 4. Offline Mode
1. Internet disconnects
2. Progress saved to local storage
3. Sync status shows: "Offline mode (cached)"
4. When online: Auto-retries and syncs

## Notifications & Feedback

### Success Notifications
- "Progress saved successfully"
- "Goals updated successfully"
- "Welcome back! Resuming from Level X"

### Warning Notifications
- "⚠️ Offline - Progress saved locally"
- "You have unsaved changes..."

### Sync Status Indicators
- 🟢 "Last synced: HH:MM AM/PM" (success)
- 🔴 "Sync failed - will retry" (error)
- ⚪ "Syncing..." (in progress)
- ⚪ "Offline mode (cached)" (offline)

## Error Handling & Recovery

### Network Failures
1. Sync fails → logged to console
2. Visual indicator shows red "Sync failed"
3. Auto-retries every 30 seconds (max 3 attempts)
4. Data saved to local storage
5. On network recovery → auto-sync

### Unsaved Changes Warning
- Browser close/navigate away: "You have unsaved changes..."
- Logout with changes: "You have unsaved changes. Are you sure you want to logout?"
- Auto-forces save before logout

## Performance Optimization

### Auto-Save Interval
- Saves every 30 seconds
- Only if `unsavedChanges = true`
- Retries up to 3 times on failure
- Non-blocking async operation

### Local Storage Fallback
- 5KB avg per user
- Fallback when server unreachable
- Syncs when online
- Cleared on logout

### Conflict Prevention
- `isSyncing` flag prevents concurrent requests
- `unsavedChanges` flag tracks pending updates
- Validation before state updates

## Testing

### Manual Testing Checklist

#### Progress Tracking
- [ ] Complete a task and verify saved
- [ ] Refresh page and verify progress persists
- [ ] Logout and login - progress resumes
- [ ] Check sync status indicator in navbar

#### Offline Mode
- [ ] Disable internet in DevTools
- [ ] Complete tasks offline
- [ ] Verify "Offline mode (cached)" message
- [ ] Re-enable internet - verify auto-sync

#### Goal Management
```javascript
// In browser console:
allocateGoal('Test Goal', '2026-03-15', 3)
displayGoals()
```

#### Error Scenarios
- [ ] Close browser during save
- [ ] Network timeout during save
- [ ] Change domain with existing progress
- [ ] Logout with unsaved changes

### API Testing
```bash
node test-api.js
```

## Best Practices

### For Developers
1. Always call `saveUserProgress()` after state changes
2. Call `updateGoalProgress()` when advancing levels
3. Check `state.unsavedChanges` before navigation
4. Handle `isSyncing` flag to prevent conflicts

### For Administrators
1. Monitor `user_progress` table growth
2. Archive old records monthly
3. Verify sync status in production
4. Check error logs for sync failures

### For Users
1. Allow auto-save to complete (don't close immediately)
2. Check sync status before closing browser
3. Set realistic goal deadlines
4. Review goal progress regularly

## Troubleshooting

### Progress Not Saving
```
1. Check server is running: npm start
2. Check network in DevTools
3. Verify database connection
4. Check browser console for errors
5. Check server terminal for API errors
```

### Sync Status Stuck
```
1. Refresh page
2. Check if server is responding
3. Check local storage: 
   localStorage.getItem('progress_<userId>')
4. Restart server
```

### Goals Not Showing
```
1. Verify goals array in state
2. Call displayGoals() in console
3. Check user_progress.goals column
4. Verify allocateGoal() was called
```

### Offline Mode Issues
```
1. Verify localStorage enabled in browser
2. Check local storage size limit (5MB)
3. Clear old cache: 
   localStorage.clear()
4. Reconnect and verify auto-sync
```

## Future Enhancements

- [ ] Push notifications for goal reminders
- [ ] Progress analytics dashboard
- [ ] Goal collaboration features
- [ ] Progress export (PDF/CSV)
- [ ] Mobile app sync
- [ ] Real-time progress sharing
- [ ] Advanced conflict resolution
- [ ] Progress visualization charts

## Related Documentation

- **[SETUP.md](SETUP.md)** - Initial setup instructions
- **[README.md](README.md)** - Project overview
- **[database-utils.sql](database-utils.sql)** - Database queries

---

**Last Updated**: February 26, 2026
**Version**: 1.0.0
**Status**: Production Ready
