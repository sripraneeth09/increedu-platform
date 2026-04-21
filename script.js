const API_BASE_URL = 'https://increedu-platform.onrender.com/api';
const BACKEND_BASE = 'https://increedu-platform.onrender.com';

// Handle Course Upload (Create or Update)
async function handleCourseUpload(event) {
    if (event) event.preventDefault();
    console.log('--- Course Action Started ---');

    const token = sessionStorage.getItem('token');
    if (!token) {
        alert('Please login first');
        return;
    }

    const editId = document.getElementById('edit-course-id').value;
    const isEdit = !!editId;

    const formData = new FormData();
    const titleVal = document.getElementById('course-title').value;
    const domainVal = document.getElementById('course-domain').value;
    const roleVal = document.getElementById('course-role').value.trim();
    const levelVal = document.getElementById('course-level').value;

    if (!titleVal || !domainVal || !roleVal || !levelVal) {
        alert('Please fill in all required fields (Subtopic, Domain, Career Path, Level)');
        return;
    }

    formData.append('title', titleVal);
    formData.append('domain', domainVal);
    formData.append('role', roleVal);
    formData.append('level', levelVal);

    const videoFile = document.getElementById('course-video-file').files[0];
    if (videoFile) {
        formData.append('video_file', videoFile);
    } else if (!isEdit) {
        alert('Please select a video file to upload.');
        return;
    }

    formData.append('thumbnail_url', document.getElementById('course-thumbnail-url').value.trim());
    formData.append('duration_minutes', document.getElementById('course-duration').value || '');
    formData.append('description', document.getElementById('course-description').value.trim());
    formData.append('tags', document.getElementById('course-tags').value);

    const feedback = document.getElementById('upload-feedback');
    feedback.textContent = isEdit ? 'Updating...' : 'Uploading...';
    feedback.className = 'text-blue-600 text-sm mt-4 font-semibold';

    const url = isEdit ? `${API_BASE_URL}/teacher/courses/${editId}` : `${API_BASE_URL}/teacher/courses`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
        console.log(`[Upload] Sending ${method} request to ${url}...`);
        console.log('[Upload] Current token:', token ? 'Exists' : 'Missing');
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        console.log('[Upload] Response status:', response.status);
        
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const rawText = await response.text();
            console.error('[Upload] Received non-JSON response:', rawText);
            throw new Error(`Server returned non-JSON response (Status: ${response.status})`);
        }

        if (response.ok) {
            console.log('Action success:', data);
            feedback.textContent = isEdit ? '✓ Course updated successfully!' : '✓ Course uploaded successfully!';
            feedback.className = 'text-green-600 text-sm mt-4 font-semibold';

            if (!isEdit) {
                resetUploadForm();
                // Persist domain for easier batch uploads
                document.getElementById('course-domain').value = domainVal;
                updateSubtopics();
                populateCareerPathsForDomain(domainVal);
                document.getElementById('course-level').value = levelVal;
            } else {
                setTimeout(() => resetUploadForm(), 1500);
            }

            setTimeout(() => {
                if (typeof loadTeacherCourses === 'function') loadTeacherCourses();
            }, 1800);
        } else {
            console.error('Action failed:', data);
            feedback.textContent = `✗ ${data.message || 'Action failed'}`;
            feedback.className = 'text-red-600 text-sm mt-4 font-semibold';
        }
    } catch (error) {
        console.error('Course action error:', error);
        feedback.textContent = '✗ Connection error. Please try again.';
        feedback.className = 'text-red-600 text-sm mt-4 font-semibold';
    }
}

function resetUploadForm() {
    const form = document.getElementById('upload-course-form');
    if (!form) return;

    form.reset();
    const editInput = document.getElementById('edit-course-id');
    if (editInput) editInput.value = '';

    const submitBtn = document.getElementById('upload-course-btn');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Upload Course';
    }

    const feedback = document.getElementById('upload-feedback');
    if (feedback) feedback.textContent = '';

    const titleSelect = document.getElementById('course-title');
    if (titleSelect) {
        titleSelect.innerHTML = '<option value="">Select Level first</option>';
    }

    const videoInput = document.getElementById('course-video-file');
    if (videoInput) videoInput.required = true;
}

// Authentication Check
async function checkLoginStatus() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    const userType = sessionStorage.getItem('userType');
    const userId = sessionStorage.getItem('userId');
    const token = sessionStorage.getItem('token');
    const userName = sessionStorage.getItem('userName');

    const userInfo = document.getElementById('user-info');
    const logoutBtn = document.getElementById('logout-btn');
    const loginBtn = document.getElementById('login-btn');

    if (isLoggedIn && userType && userId && token) {
        try {
            // Verify token with backend
            const response = await fetch(`${API_BASE_URL}/verify-token`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                // Show logged-in state
                if (userInfo) userInfo.classList.remove('hidden');
                if (logoutBtn) logoutBtn.classList.remove('hidden');
                if (loginBtn) loginBtn.classList.add('hidden');

                // Update user display
                const userNameEl = document.getElementById('user-name');
                const userTypeEl = document.getElementById('user-type');
                if (userNameEl) userNameEl.textContent = userName || `${userType === 'learner' ? 'Learner' : userType === 'teacher' ? 'Teacher' : 'Admin'} ${userId}`;
                if (userTypeEl) userTypeEl.textContent = userType === 'learner' ? 'Learner' : userType === 'teacher' ? 'Teacher' : 'Admin';

                // show teacher dashboard only for verified teachers
                if (userType === 'teacher') {
                    try {
                        const profRes = await fetch(`${API_BASE_URL}/user/${userId}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (profRes.ok) {
                            const profJson = await profRes.json();
                            const tSec = document.getElementById('teacher-section');
                            const verifyEl = document.getElementById('teacher-verify-status');
                            const verifyReqEl = document.getElementById('teacher-verification-request');
                            if (profJson.user && profJson.user.is_verified) {
                                // Show full teacher dashboard
                                if (tSec) {
                                    showSection('teacher-section');
                                    tSec.classList.remove('hidden');
                                }
                                if (verifyEl) {
                                    verifyEl.className = 'inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 font-semibold';
                                    verifyEl.innerHTML = '<i class="fas fa-check-circle"></i> Verified Teacher';
                                }
                                if (verifyReqEl) verifyReqEl.classList.add('hidden');

                            } else {
                                // Not verified - show pending notice and limited dashboard
                                if (tSec) {
                                    showSection('teacher-section');
                                    tSec.classList.remove('hidden');
                                }
                                if (verifyEl) {
                                    verifyEl.className = 'inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-100 text-yellow-700 font-semibold';
                                    verifyEl.innerHTML = '<i class="fas fa-hourglass-half"></i> Verification Pending';
                                }
                                if (verifyReqEl) verifyReqEl.classList.remove('hidden');
                            }
                            // Ensure learner landing/assessment is hidden for teachers
                            const landing = document.getElementById('step-landing');
                            if (landing) {
                                landing.classList.remove('section-visible');
                                landing.classList.add('section-hidden');
                            }
                            const learnerSection = document.getElementById('learner-courses-section');
                            if (learnerSection) {
                                learnerSection.classList.remove('section-visible');
                                learnerSection.classList.add('section-hidden');
                            }
                            // Disable Begin My Journey button if present
                            const beginBtn = document.querySelector("button[onclick='startAssessment()']");
                            if (beginBtn) beginBtn.setAttribute('disabled', 'true');
                        }
                    } catch (e) {
                        console.error('Failed to fetch profile for teacher dashboard:', e);
                    }
                }

                // Show admin dashboard for admins
                if (userType === 'admin') {
                    const adminSection = document.getElementById('admin-section');
                    if (adminSection) {
                        showSection('admin-section');
                        adminSection.classList.remove('hidden');
                        // Load admin data after a small delay
                        setTimeout(() => loadAdminOverview(), 500);
                    }
                    // Hide learner sections for admins
                    const landing = document.getElementById('step-landing');
                    if (landing) {
                        landing.classList.remove('section-visible');
                        landing.classList.add('section-hidden');
                    }
                    const learnerSection = document.getElementById('learner-courses-section');
                    if (learnerSection) {
                        learnerSection.classList.remove('section-visible');
                        learnerSection.classList.add('section-hidden');
                    }
                    // Disable Begin My Journey button if present
                    const beginBtn = document.querySelector("button[onclick='startAssessment()']");
                    if (beginBtn) beginBtn.setAttribute('disabled', 'true');
                }

                // Show learner courses section if learner is logged in
                if (userType === 'learner') {
                    const learnerSection = document.getElementById('learner-courses-section');
                    if (learnerSection) {
                        learnerSection.classList.remove('hidden');
                        // Load courses after a small delay to ensure DOM is ready
                        setTimeout(() => loadLearnerCourses(), 500);
                    }
                }
            } else {
                // Token expired or invalid
                sessionStorage.clear();
                window.location.href = 'login.html';
            }
        } catch (error) {
            console.error('Token verification failed:', error);
            // If API is not available, show logged-in state anyway (offline mode)
            if (userInfo) userInfo.classList.remove('hidden');
            if (logoutBtn) logoutBtn.classList.remove('hidden');
            if (loginBtn) loginBtn.classList.add('hidden');

            // Show sync status
            const syncStatus = document.getElementById('sync-status');
            if (syncStatus) syncStatus.classList.remove('hidden');

            const userNameEl = document.getElementById('user-name');
            const userTypeEl = document.getElementById('user-type');
            if (userNameEl) userNameEl.textContent = userName || `${userType === 'learner' ? 'Learner' : userType === 'teacher' ? 'Teacher' : 'Admin'} ${userId}`;
            if (userTypeEl) userTypeEl.textContent = userType === 'learner' ? 'Learner' : userType === 'teacher' ? 'Teacher' : 'Admin';
        }
    } else {
        // Show logged-out state
        if (userInfo) userInfo.classList.add('hidden');
        if (logoutBtn) logoutBtn.classList.add('hidden');
        if (loginBtn) loginBtn.classList.remove('hidden');

        // Hide sync status
        const syncStatus = document.getElementById('sync-status');
        if (syncStatus) syncStatus.classList.add('hidden');
    }
}

// Handle course video upload from teacher dashboard
async function handleVideoUpload(event) {
    event.preventDefault();
    const domain = document.getElementById('video-domain').value;
    const level = document.getElementById('video-level').value;
    const url = document.getElementById('video-url').value.trim();
    const feedback = document.getElementById('upload-feedback');

    if (!domain || !level || !url) {
        if (feedback) feedback.textContent = 'All fields are required.';
        return;
    }

    const token = sessionStorage.getItem('token');
    try {
        const response = await fetch(`${API_BASE_URL}/teacher/upload-video`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ domain, level, url })
        });
        const data = await response.json();
        if (response.ok) {
            if (feedback) {
                feedback.textContent = 'Video uploaded successfully!';
                feedback.className = 'text-green-600 mt-4';
            }
            // clear form
            document.getElementById('video-url').value = '';
        } else {
            if (feedback) {
                feedback.textContent = data.message || 'Upload failed';
                feedback.className = 'text-red-600 mt-4';
            }
        }
    } catch (err) {
        console.error('Upload error', err);
        if (feedback) {
            feedback.textContent = 'Connection error';
            feedback.className = 'text-red-600 mt-4';
        }
    }
}

// Submit teacher verification request (unverified teachers)
async function submitTeacherVerificationRequest(event) {
    event.preventDefault();
    const token = sessionStorage.getItem('token');
    if (!token) {
        alert('Please login first');
        return;
    }

    const feedback = document.getElementById('teacher-verification-feedback');
    const primaryDomain = document.getElementById('teacher-primary-domain')?.value;
    const years = parseInt(document.getElementById('teacher-years-exp')?.value || '0', 10);
    const credentials = document.getElementById('teacher-credentials')?.value?.trim();
    const docsRaw = document.getElementById('teacher-doc-links')?.value || '';
    const notes = document.getElementById('teacher-notes')?.value?.trim();

    const documents = docsRaw
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

    if (!primaryDomain || !credentials) {
        if (feedback) {
            feedback.textContent = 'Please fill Primary Domain and Credentials.';
            feedback.className = 'text-sm text-red-600';
        }
        return;
    }

    if (feedback) {
        feedback.textContent = 'Submitting...';
        feedback.className = 'text-sm text-gray-600';
    }

    try {
        const res = await fetch(`${API_BASE_URL}/teacher/verification/request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                primary_domain: primaryDomain,
                expertise_domains: [primaryDomain],
                years_of_experience: Number.isFinite(years) ? years : 0,
                credentials,
                documents,
                notes
            })
        });

        const data = await res.json();
        if (res.ok) {
            if (feedback) {
                feedback.textContent = '✓ Submitted. Your verification request is now pending.';
                feedback.className = 'text-sm text-green-700 font-semibold';
            }
            // Refresh status display
            setTimeout(() => checkLoginStatus(), 800);
        } else {
            if (feedback) {
                feedback.textContent = `✗ ${data.message || 'Submission failed'}`;
                feedback.className = 'text-sm text-red-600 font-semibold';
            }
        }
    } catch (e) {
        console.error('Verification request error:', e);
        if (feedback) {
            feedback.textContent = '✗ Connection error. Please try again.';
            feedback.className = 'text-sm text-red-600 font-semibold';
        }
    }
}

// Handle logout
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        const userId = sessionStorage.getItem('userId');

        // Attempt to save progress (silent fail ok)
        try { saveUserProgress(); } catch (e) { }

        // Call logout API
        if (userId) {
            fetch(`${API_BASE_URL}/logout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId })
            }).catch(e => console.log('Logout API call failed:', e));
        }

        sessionStorage.clear();
        if (userId) localStorage.removeItem(`progress_${userId}`);

        console.log('✓ User logged out');
        window.location.href = 'login.html';
    }
}

// Check login status on page load
document.addEventListener('DOMContentLoaded', async () => {
    checkLoginStatus();

    // Load progress FIRST and wait for it to complete
    await loadUserProgress();

    // Check immediately after loading if user has existing progress
    if (state.hasExistingProgress && state.selectedRole && state.selectedDomain) {
        const progress = state.totalTasks > 0 ? 
            Math.round((state.completedTasks.size / state.totalTasks) * 100) : 0;
            
        console.log('🔄 User has existing progress:', progress + '%');

        if (progress === 100) {
            console.log('🏁 Journey completed, showing opportunities');
            showSection('step-opportunities');
            showOpportunities();
        } else {
            // Updated: Show landing page but update the button
            const mainActionBtn = document.getElementById('main-action-btn');
            if (mainActionBtn) {
                mainActionBtn.innerHTML = 'Continue My Journey <i class="fas fa-arrow-right ml-2"></i>';
                mainActionBtn.onclick = () => {
                    showSection('step-roadmap');
                    initRoadmap();
                    
                    // Render the saved level with completed tasks
                    if (state.currentLevel !== null) {
                        setTimeout(() => {
                            const levels = state.selectedRole.roadmap;
                            renderLevelContent(state.currentLevel, levels);
                            
                            // Highlight completed tasks
                            state.completedTasks.forEach(taskId => {
                                const taskCheckbox = document.getElementById(taskId);
                                if (taskCheckbox) {
                                    taskCheckbox.checked = true;
                                    taskCheckbox.parentElement?.classList.add('task-completed');
                                }
                            });
                        }, 50);
                    }
                };
            }
            console.log('✓ Landing page ready with Continue button');
        }
    }
    // If NOT returning user, assessment will show by default (normal flow)
});

// State
const state = {
    currentQuestion: 0,
    scores: { tech: 0, business: 0, creative: 0, healthcare: 0, education: 0 },
    selectedDomain: null,
    selectedRole: null,
    currentLevel: 0,
    completedTasks: new Set(),
    totalTasks: 0,
    mentorsShown: false,
    currentRoadmap: null,
    goals: [],
    hasExistingProgress: false,
    isSyncing: false,
    lastSyncTime: null,
    unsavedChanges: false
};

// Debounce variables to prevent too many concurrent saves
let lastSaveAttempt = 0;
const SAVE_DEBOUNCE_MS = 2000; // Wait at least 2 seconds between saves

// Load user progress from backend
async function loadUserProgress() {
    const userId = sessionStorage.getItem('userId');
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';

    if (!isLoggedIn || !userId) return;

    try {
        state.isSyncing = true;
        updateSyncStatus('Syncing...');

        const response = await fetch(`${API_BASE_URL}/user-progress/${userId}`);
        const result = await response.json();

        if (result.status === 'success' && result.data) {
            const progress = result.data;
            state.selectedDomain = progress.selected_domain;
            state.currentLevel = progress.current_level;
            state.totalTasks = progress.total_tasks;
            state.goals = progress.goals || [];
            state.hasExistingProgress = true;
            state.lastSyncTime = new Date();

            // Restore completed tasks
            if (progress.completed_tasks && Array.isArray(progress.completed_tasks)) {
                state.completedTasks = new Set(progress.completed_tasks);
            }

            // Restore the actual role object from domains data
            if (progress.selected_domain && progress.selected_role) {
                const domain = domains[progress.selected_domain];
                if (domain) {
                    const roleObj = domain.roles.find(r => r.title === progress.selected_role);
                    if (roleObj) {
                        state.selectedRole = roleObj;
                        console.log('✓ Role object restored:', roleObj.title);
                    }
                }
            }

            // Save to local storage for offline fallback
            localStorage.setItem(`progress_${userId}`, JSON.stringify(progress));

            console.log('✓ User progress loaded:', progress);
            console.log('✓ Current level:', state.currentLevel);
            console.log('✓ Completed tasks:', state.completedTasks.size);
            updateSyncStatus('Last synced: ' + new Date().toLocaleTimeString(), true);
        }
    } catch (error) {
        console.error('Failed to load user progress:', error);

        // Try to load from local storage as fallback
        try {
            const cachedProgress = localStorage.getItem(`progress_${userId}`);
            if (cachedProgress) {
                const progress = JSON.parse(cachedProgress);
                state.selectedDomain = progress.selected_domain;
                state.currentLevel = progress.current_level;
                state.totalTasks = progress.total_tasks;
                state.goals = progress.goals || [];
                state.hasExistingProgress = true;

                if (progress.completed_tasks && Array.isArray(progress.completed_tasks)) {
                    state.completedTasks = new Set(progress.completed_tasks);
                }

                // Restore the actual role object from domains data
                if (progress.selected_domain && progress.selected_role) {
                    const domain = domains[progress.selected_domain];
                    if (domain) {
                        const roleObj = domain.roles.find(r => r.title === progress.selected_role);
                        if (roleObj) {
                            state.selectedRole = roleObj;
                            console.log('✓ Role object restored from cache:', roleObj.title);
                        }
                    }
                }

                console.log('✓ Progress loaded from local cache');
                updateSyncStatus('Offline mode (cached)', false);
            }
        } catch (cacheError) {
            console.error('Failed to load cached progress:', cacheError);
            updateSyncStatus('Sync failed', false);
        }
    } finally {
        state.isSyncing = false;
    }
}

// Save user progress to backend with visual feedback
async function saveUserProgress() {
    const userId = sessionStorage.getItem('userId');
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';

    if (!isLoggedIn || !userId) {
        return Promise.resolve(); // Silent return if not logged in
    }

    // Debounce: prevent too frequent saves
    const now = Date.now();
    if (now - lastSaveAttempt < SAVE_DEBOUNCE_MS) {
        return Promise.resolve(); // Skip this save, will try again later
    }

    if (state.isSyncing) {
        return Promise.resolve(); // Return if already syncing
    }

    try {
        state.isSyncing = true;
        lastSaveAttempt = now;
        state.unsavedChanges = false;
        updateSyncStatus('Saving...');

        // Extract role title from role object if it's an object
        const roleTitle = (state.selectedRole && typeof state.selectedRole === 'object')
            ? state.selectedRole.title
            : (state.selectedRole || '');

        const progressData = {
            user_id: userId,
            selected_domain: state.selectedDomain,
            selected_role: roleTitle,
            current_level: state.currentLevel,
            completed_tasks: Array.from(state.completedTasks),
            total_tasks: state.totalTasks,
            progress_percentage: state.totalTasks > 0 ?
                Math.round((state.completedTasks.size / state.totalTasks) * 100) : 0
        };

        // Save to local storage immediately
        localStorage.setItem(`progress_${userId}`, JSON.stringify(progressData));

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch(`${API_BASE_URL}/save-progress`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(progressData),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
        }

        const result = await response.json();
        if (result.status === 'success') {
            console.log('✓ Progress saved');
            state.lastSyncTime = new Date();
            updateSyncStatus('Last synced: ' + new Date().toLocaleTimeString(), true);
            return Promise.resolve();
        } else {
            throw new Error(result.message || 'Unknown error');
        }
    } catch (error) {
        console.error('Failed to save progress:', error.message);
        state.unsavedChanges = true;
        updateSyncStatus('Sync failed - will retry', false);
        // Silent fail - don't show notification on every error to avoid spam
        return Promise.reject(error);
    } finally {
        state.isSyncing = false;
    }
}

// Save goals to backend
async function saveGoals() {
    const userId = sessionStorage.getItem('userId');
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';

    if (!isLoggedIn || !userId) return;

    try {
        const response = await fetch(`${API_BASE_URL}/update-goals`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: userId,
                goals: state.goals
            })
        });

        const result = await response.json();
        if (result.status === 'success') {
            console.log('✓ Goals saved');
        }
    } catch (error) {
        console.error('Failed to save goals:', error);
    }
}

// Update UI sync status (Disabled at user request)
function updateSyncStatus(message, isSuccess = null) {
    // UI element removed
    return;
}

// Show notifications
function showNotification(message, type = 'success') {
    const notifEl = document.createElement('div');
    notifEl.className = `fixed bottom-4 right-4 px-4 py-3 rounded-lg text-white text-sm font-medium z-50 animate-slide-up ${type === 'success' ? 'bg-green-500' : type === 'warning' ? 'bg-orange-500' : 'bg-red-500'
        }`;
    notifEl.textContent = message;
    document.body.appendChild(notifEl);

    setTimeout(() => {
        notifEl.remove();
    }, 3000);
}

// Dynamic Questions (Loaded from backend API)
let questions = [];

// Map teacher form domain values to domains config keys (and vice versa)
const DOMAIN_FORM_TO_KEY = { Technology: 'tech', Business: 'business', Creative: 'creative', Healthcare: 'healthcare', Education: 'education' };
const DOMAIN_KEY_TO_FORM = { tech: 'Technology', business: 'Business', creative: 'Creative', healthcare: 'Healthcare', education: 'Education' };

// Domain configurations with specific roles and roadmaps
const domains = {
    tech: {
        name: "Technology & Engineering",
        icon: "fa-laptop-code",
        color: "blue",
        description: "You excel at logical thinking, problem-solving, and understanding complex systems. You enjoy creating solutions through code and technology.",
        strengths: ["Analytical Thinking", "Problem Solving", "Attention to Detail", "Logical Reasoning"],
        roles: [
            {
                title: "Software Developer",
                icon: "fa-code",
                description: "Build applications and software solutions",
                roadmap: [
                    {
                        level: 1, title: "Programming Fundamentals", desc: "Master core programming concepts", modules: [
                            { title: "Data Structures & Algorithms", duration: "45 min", type: "interactive" },
                            { title: "Version Control with Git", duration: "30 min", type: "video" },
                            { title: "Clean Code Principles", duration: "25 min", type: "reading" }
                        ]
                    },
                    {
                        level: 2, title: "Web Development", desc: "Build modern web applications", modules: [
                            { title: "Frontend Frameworks (React/Vue)", duration: "60 min", type: "project" },
                            { title: "Backend API Development", duration: "50 min", type: "coding" },
                            { title: "Database Design", duration: "40 min", type: "interactive" }
                        ]
                    },
                    {
                        level: 3, title: "Advanced Concepts", desc: "System design and architecture", modules: [
                            { title: "System Design Basics", duration: "55 min", type: "video" },
                            { title: "Cloud Services (AWS/Azure)", duration: "45 min", type: "lab" },
                            { title: "DevOps Fundamentals", duration: "40 min", type: "reading" }
                        ]
                    },
                    {
                        level: 4, title: "Professional Skills", desc: "Interview prep and career growth", modules: [
                            { title: "Technical Interview Prep", duration: "50 min", type: "practice" },
                            { title: "Portfolio Building", duration: "35 min", type: "project" },
                            { title: "Agile Methodologies", duration: "30 min", type: "reading" }
                        ]
                    }
                ],
                mentors: [
                    { name: "Alex Chen", role: "Senior Engineer", company: "Google", expertise: "System Architecture" },
                    { name: "Sarah Johnson", role: "Tech Lead", company: "Microsoft", expertise: "Full Stack Dev" },
                    { name: "Raj Patel", role: "CTO", company: "StartupX", expertise: "Cloud Computing" }
                ],
                opportunities: [
                    { name: "Junior Developer", company: "TechCorp", type: "Full-time", location: "Remote", salary: "$60K-80K" },
                    { name: "Frontend Engineer", company: "DesignStudio", type: "Full-time", location: "New York", salary: "$70K-90K" },
                    { name: "Full Stack Dev", company: "StartupHub", type: "Contract", location: "San Francisco", salary: "$80K-100K" }
                ]
            },
            {
                title: "Data Scientist",
                icon: "fa-database",
                description: "Analyze data and build ML models",
                roadmap: [
                    {
                        level: 1, title: "Data Fundamentals", desc: "Statistics and Python basics", modules: [
                            { title: "Python for Data Science", duration: "50 min", type: "coding" },
                            { title: "Statistics & Probability", duration: "45 min", type: "interactive" },
                            { title: "Data Visualization", duration: "40 min", type: "project" }
                        ]
                    },
                    {
                        level: 2, title: "Machine Learning", desc: "ML algorithms and models", modules: [
                            { title: "Supervised Learning", duration: "60 min", type: "interactive" },
                            { title: "Unsupervised Learning", duration: "55 min", type: "coding" },
                            { title: "Model Evaluation", duration: "40 min", type: "reading" }
                        ]
                    }
                ],
                mentors: [
                    { name: "Dr. Emily Wu", role: "Principal Data Scientist", company: "Amazon", expertise: "Machine Learning" }
                ],
                opportunities: [
                    { name: "Data Analyst", company: "FinanceCo", type: "Full-time", location: "Chicago", salary: "$65K-85K" }
                ]
            },
            {
                title: "UX/UI Designer",
                icon: "fa-mobile-alt",
                description: "Design user experiences and interfaces",
                roadmap: [
                    {
                        level: 1, title: "Design Foundations", desc: "Color theory and typography", modules: [
                            { title: "Design Principles", duration: "40 min", type: "video" },
                            { title: "Figma Basics", duration: "50 min", type: "tutorial" }
                        ]
                    }
                ],
                mentors: [
                    { name: "Maria Garcia", role: "Design Director", company: "Airbnb", expertise: "User Research" }
                ],
                opportunities: [
                    { name: "Product Designer", company: "CreativeAgency", type: "Full-time", location: "Austin", salary: "$75K-95K" }
                ]
            }
        ]
    },
    business: {
        name: "Business & Entrepreneurship",
        icon: "fa-briefcase",
        color: "orange",
        description: "You demonstrate strong strategic thinking and opportunity identification. You naturally understand value creation and market dynamics.",
        strengths: ["Leadership", "Strategic Thinking", "Negotiation", "Risk Assessment"],
        roles: [
            {
                title: "Franchise Owner",
                icon: "fa-store",
                description: "Operate established business models",
                roadmap: [
                    {
                        level: 1, title: "Franchise Fundamentals", desc: "Understanding franchise models", modules: [
                            { title: "Franchise vs Independent", duration: "20 min", type: "video" },
                            { title: "Investment Analysis", duration: "30 min", type: "worksheet" },
                            { title: "Market Research", duration: "25 min", type: "interactive" }
                        ]
                    },
                    {
                        level: 2, title: "Planning & Setup", desc: "Legal and financial planning", modules: [
                            { title: "Business Plan Creation", duration: "45 min", type: "template" },
                            { title: "Location Selection", duration: "35 min", type: "case-study" },
                            { title: "Legal Documentation", duration: "40 min", type: "reading" }
                        ]
                    },
                    {
                        level: 3, title: "Operations", desc: "Running the day-to-day", modules: [
                            { title: "Staff Management", duration: "35 min", type: "video" },
                            { title: "Inventory Systems", duration: "30 min", type: "tutorial" },
                            { title: "Customer Service Excellence", duration: "25 min", type: "interactive" }
                        ]
                    },
                    {
                        level: 4, title: "Growth & Scaling", desc: "Expand your business", modules: [
                            { title: "Marketing Strategies", duration: "40 min", type: "workshop" },
                            { title: "Multi-unit Management", duration: "45 min", type: "case-study" },
                            { title: "Franchise Your Concept", duration: "50 min", type: "video" }
                        ]
                    }
                ],
                mentors: [
                    { name: "Robert Chen", role: "Franchise Consultant", company: "FranchisePro", expertise: "Multi-unit Operations" },
                    { name: "Lisa Park", role: "Franchisee", company: "Subway (5 units)", expertise: "Quick Service" },
                    { name: "Mike Johnson", role: "Business Attorney", company: "LegalBiz", expertise: "Franchise Law" }
                ],
                opportunities: [
                    { name: "FreshBites Franchise", company: "FreshBites Inc", type: "Food & Beverage", investment: "$50K-80K", location: "Pan India" },
                    { name: "CleanSpark License", company: "CleanSpark", type: "Service", investment: "$30K-50K", location: "Metro Cities" },
                    { name: "EduCenter Franchise", company: "EduPlus", type: "Education", investment: "$40K-70K", location: "Tier 1-2 Cities" }
                ]
            },
            {
                title: "Startup Founder",
                icon: "fa-rocket",
                description: "Build innovative companies from scratch",
                roadmap: [
                    {
                        level: 1, title: "Ideation", desc: "Problem identification and validation", modules: [
                            { title: "Finding Product-Market Fit", duration: "40 min", type: "video" },
                            { title: "Customer Discovery", duration: "50 min", type: "worksheet" }
                        ]
                    },
                    {
                        level: 2, title: "MVP Development", desc: "Build and test your product", modules: [
                            { title: "Lean Startup Method", duration: "35 min", type: "reading" },
                            { title: "No-Code Tools", duration: "45 min", type: "tutorial" }
                        ]
                    }
                ],
                mentors: [
                    { name: "Elon Musk", role: "CEO", company: "SpaceX", expertise: "Innovation" }
                ],
                opportunities: [
                    { name: "Y Combinator", company: "YC", type: "Accelerator", investment: "$125K", location: "Mountain View" }
                ]
            },
            {
                title: "E-commerce Entrepreneur",
                icon: "fa-shopping-cart",
                description: "Build online retail businesses",
                roadmap: [
                    {
                        level: 1, title: "Platform Setup", desc: "Choose and configure platforms", modules: [
                            { title: "Shopify vs Amazon", duration: "30 min", type: "comparison" },
                            { title: "Product Sourcing", duration: "40 min", type: "video" }
                        ]
                    }
                ],
                mentors: [
                    { name: "Jeff Bezos", role: "Founder", company: "Amazon", expertise: "E-commerce" }
                ],
                opportunities: [
                    { name: "Dropshipping Partner", company: "AliExpress", type: "Partnership", investment: "$1K-5K", location: "Global" }
                ]
            }
        ]
    },
    creative: {
        name: "Creative Arts & Design",
        icon: "fa-palette",
        color: "purple",
        description: "You think visually, value aesthetics, and communicate effectively through creative mediums. You bring unique perspectives to every project.",
        strengths: ["Creativity", "Visual Thinking", "Communication", "Empathy"],
        roles: [
            {
                title: "Content Creator",
                icon: "fa-video",
                description: "Build audience through digital content",
                roadmap: [
                    {
                        level: 1, title: "Content Strategy", desc: "Find your niche and voice", modules: [
                            { title: "Platform Selection", duration: "30 min", type: "video" },
                            { title: "Personal Branding", duration: "40 min", type: "worksheet" },
                            { title: "Content Calendar", duration: "25 min", type: "template" }
                        ]
                    },
                    {
                        level: 2, title: "Production", desc: "Create high-quality content", modules: [
                            { title: "Video Editing Basics", duration: "50 min", type: "tutorial" },
                            { title: "Thumbnail Design", duration: "30 min", type: "project" },
                            { title: "SEO for Creators", duration: "35 min", type: "reading" }
                        ]
                    },
                    {
                        level: 3, title: "Monetization", desc: "Turn passion into income", modules: [
                            { title: "Sponsorships & Brand Deals", duration: "40 min", type: "video" },
                            { title: "Affiliate Marketing", duration: "35 min", type: "interactive" },
                            { title: "Merchandise & Products", duration: "30 min", type: "case-study" }
                        ]
                    },
                    {
                        level: 4, title: "Growth", desc: "Scale your influence", modules: [
                            { title: "Community Building", duration: "35 min", type: "workshop" },
                            { title: "Cross-Platform Strategy", duration: "40 min", type: "reading" },
                            { title: "Team Building", duration: "30 min", type: "video" }
                        ]
                    }
                ],
                mentors: [
                    { name: "Emma Chamberlain", role: "Creator", company: "YouTube", expertise: "Lifestyle Content" },
                    { name: "Casey Neistat", role: "Filmmaker", company: "CNN", expertise: "Storytelling" },
                    { name: "Charli D'Amelio", role: "Influencer", company: "TikTok", expertise: "Short-form Video" }
                ],
                opportunities: [
                    { name: "Brand Partnership", company: "Nike", type: "Sponsorship", investment: "None", location: "Remote" },
                    { name: "Netflix Creator", company: "Netflix", type: "Contract", location: "Los Angeles", salary: "Per project" },
                    { name: "Spotify Podcast", company: "Spotify", type: "Exclusive", location: "Remote", salary: "$50K-200K" }
                ]
            },
            {
                title: "Graphic Designer",
                icon: "fa-pen-nib",
                description: "Create visual concepts and branding",
                roadmap: [
                    {
                        level: 1, title: "Design Tools", desc: "Master Adobe Creative Suite", modules: [
                            { title: "Photoshop Essentials", duration: "45 min", type: "tutorial" },
                            { title: "Illustrator Basics", duration: "40 min", type: "project" }
                        ]
                    }
                ],
                mentors: [
                    { name: "Paula Scher", role: "Partner", company: "Pentagram", expertise: "Brand Identity" }
                ],
                opportunities: [
                    { name: "Junior Designer", company: "DesignStudio", type: "Full-time", location: "New York", salary: "$45K-65K" }
                ]
            },
            {
                title: "Digital Marketer",
                icon: "fa-bullhorn",
                description: "Drive growth through digital channels",
                roadmap: [
                    {
                        level: 1, title: "Marketing Basics", desc: "Channels and strategies", modules: [
                            { title: "Social Media Marketing", duration: "40 min", type: "video" },
                            { title: "Google Ads", duration: "45 min", type: "interactive" }
                        ]
                    }
                ],
                mentors: [
                    { name: "Neil Patel", role: "Founder", company: "NP Digital", expertise: "SEO & Content" }
                ],
                opportunities: [
                    { name: "Marketing Manager", company: "GrowthCo", type: "Full-time", location: "Remote", salary: "$70K-90K" }
                ]
            }
        ]
    },
    healthcare: {
        name: "Healthcare & Wellness",
        icon: "fa-heartbeat",
        color: "green",
        description: "You have a natural inclination to help others and improve their wellbeing. You combine empathy with scientific knowledge.",
        strengths: ["Empathy", "Scientific Mind", "Patience", "Communication"],
        roles: [
            {
                title: "Registered Nurse",
                icon: "fa-user-nurse",
                description: "Provide patient care and support",
                roadmap: [
                    {
                        level: 1, title: "Nursing Fundamentals", desc: "Basic care and anatomy", modules: [
                            { title: "Human Anatomy", duration: "60 min", type: "video" },
                            { title: "Patient Care Basics", duration: "50 min", type: "simulation" },
                            { title: "Medical Terminology", duration: "40 min", type: "reading" }
                        ]
                    },
                    {
                        level: 2, title: "Clinical Skills", desc: "Hands-on medical procedures", modules: [
                            { title: "Vital Signs", duration: "45 min", type: "lab" },
                            { title: "Medication Administration", duration: "55 min", type: "simulation" },
                            { title: "Emergency Response", duration: "50 min", type: "interactive" }
                        ]
                    },
                    {
                        level: 3, title: "Specialization", desc: "Choose your nursing path", modules: [
                            { title: "Pediatric Care", duration: "45 min", type: "video" },
                            { title: "Geriatric Nursing", duration: "40 min", type: "case-study" },
                            { title: "ICU Basics", duration: "50 min", type: "reading" }
                        ]
                    },
                    {
                        level: 4, title: "Licensing", desc: "Pass NCLEX and get certified", modules: [
                            { title: "NCLEX Prep", duration: "60 min", type: "practice" },
                            { title: "State Requirements", duration: "30 min", type: "reading" },
                            { title: "Job Interview Skills", duration: "35 min", type: "workshop" }
                        ]
                    }
                ],
                mentors: [
                    { name: "Dr. Sarah Kim", role: "Head Nurse", company: "Johns Hopkins", expertise: "Critical Care" },
                    { name: "James Wilson", role: "Nurse Practitioner", company: "Mayo Clinic", expertise: "Family Medicine" },
                    { name: "Maria Garcia", role: "ICU Nurse", company: "Cleveland Clinic", expertise: "Emergency Care" }
                ],
                opportunities: [
                    { name: "Staff Nurse", company: "City Hospital", type: "Full-time", location: "New York", salary: "$65K-85K" },
                    { name: "Travel Nurse", company: "NurseFly", type: "Contract", location: "Nationwide", salary: "$80K-120K" },
                    { name: "School Nurse", company: "Public Schools", type: "Part-time", location: "Chicago", salary: "$45K-60K" }
                ]
            },
            {
                title: "Health Coach",
                icon: "fa-running",
                description: "Guide clients to wellness goals",
                roadmap: [
                    {
                        level: 1, title: "Wellness Basics", desc: "Nutrition and fitness", modules: [
                            { title: "Nutrition Science", duration: "45 min", type: "video" },
                            { title: "Exercise Physiology", duration: "40 min", type: "reading" }
                        ]
                    }
                ],
                mentors: [
                    { name: "Jillian Michaels", role: "Trainer", company: "Self-employed", expertise: "Fitness" }
                ],
                opportunities: [
                    { name: "Online Coach", company: "BetterMe", type: "Remote", location: "Global", salary: "$50K-100K" }
                ]
            }
        ]
    },
    education: {
        name: "Education & Training",
        icon: "fa-graduation-cap",
        color: "pink",
        description: "You have a passion for sharing knowledge and helping others grow. You excel at breaking down complex concepts.",
        strengths: ["Communication", "Patience", "Organization", "Mentorship"],
        roles: [
            {
                title: "Online Educator",
                icon: "fa-laptop",
                description: "Teach learners through digital platforms",
                roadmap: [
                    {
                        level: 1, title: "Teaching Fundamentals", desc: "Pedagogy and engagement", modules: [
                            { title: "Learning Theories", duration: "40 min", type: "video" },
                            { title: "Online Engagement", duration: "35 min", type: "interactive" },
                            { title: "Curriculum Design", duration: "45 min", type: "template" }
                        ]
                    },
                    {
                        level: 2, title: "Content Creation", desc: "Create engaging courses", modules: [
                            { title: "Video Production", duration: "50 min", type: "tutorial" },
                            { title: "Assessment Design", duration: "40 min", type: "worksheet" },
                            { title: "Interactive Tools", duration: "35 min", type: "lab" }
                        ]
                    },
                    {
                        level: 3, title: "Platform Mastery", desc: "Teach on popular platforms", modules: [
                            { title: "Udemy & Skillshare", duration: "40 min", type: "video" },
                            { title: "YouTube Education", duration: "45 min", type: "case-study" },
                            { title: "Live Teaching", duration: "35 min", type: "workshop" }
                        ]
                    },
                    {
                        level: 4, title: "Monetization", desc: "Build sustainable income", modules: [
                            { title: "Course Marketing", duration: "40 min", type: "reading" },
                            { title: "Community Building", duration: "35 min", type: "interactive" },
                            { title: "Scaling Your School", duration: "45 min", type: "video" }
                        ]
                    }
                ],
                mentors: [
                    { name: "Sal Khan", role: "Founder", company: "Khan Academy", expertise: "Math Education" },
                    { name: "Angela Yu", role: "Instructor", company: "Udemy", expertise: "Coding Bootcamps" },
                    { name: "Dr. Jordan Peterson", role: "Professor", company: "University of Toronto", expertise: "Psychology" }
                ],
                opportunities: [
                    { name: "Course Creator", company: "Coursera", type: "Contract", location: "Remote", salary: "$50K-200K" },
                    { name: "Tutor", company: "VIPKid", type: "Part-time", location: "Remote", salary: "$20-40/hr" },
                    { name: "Corporate Trainer", company: "Google", type: "Full-time", location: "Mountain View", salary: "$90K-120K" }
                ]
            },
            {
                title: "Instructional Designer",
                icon: "fa-book",
                description: "Design educational programs and materials",
                roadmap: [
                    {
                        level: 1, title: "Design Principles", desc: "Adult learning and UX", modules: [
                            { title: "Andragogy Basics", duration: "40 min", type: "reading" },
                            { title: "Learning Management Systems", duration: "45 min", type: "tutorial" }
                        ]
                    }
                ],
                mentors: [
                    { name: "Julie Dirksen", role: "Author", company: "Usable Learning", expertise: "Design Strategy" }
                ],
                opportunities: [
                    { name: "ID Specialist", company: "Amazon", type: "Full-time", location: "Seattle", salary: "$80K-110K" }
                ]
            }
        ]
    }
};

// Navigation
function showSection(id) {
    document.querySelectorAll('main > section').forEach(s => {
        s.classList.remove('section-visible');
        s.classList.add('section-hidden');
    });
    document.getElementById(id).classList.remove('section-hidden');
    document.getElementById(id).classList.add('section-visible');
    window.scrollTo(0, 0);
}

async function startAssessment() {
    // Check if user is logged in before starting
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
        window.location.href = 'login.html';
        return;
    }

    showSection('step-assessment');
    
    // Add loading visuals while fetching questions
    const qText = document.getElementById('question-text');
    const grid = document.getElementById('options-grid');
    const nextBtn = document.getElementById('next-btn');
    const backBtn = document.getElementById('back-btn');
    
    // Save original if needed
    qText.textContent = "Loading your assessment...";
    grid.innerHTML = `<div class="col-span-1 md:col-span-3 text-center py-8"><i class="fas fa-circle-notch fa-spin text-4xl text-brand-blue"></i></div>`;
    nextBtn.style.display = 'none';
    backBtn.style.display = 'none';

    try {
        const res = await fetch(`${API_BASE_URL}/questions`);
        if (!res.ok) throw new Error('Failed to fetch questions');
        const data = await res.json();
        
        if (data.status === 'success' && data.questions && data.questions.length > 0) {
            questions = data.questions;
        } else {
            qText.textContent = "No questions found. Please try again later.";
            grid.innerHTML = '';
            return;
        }
    } catch (e) {
        console.error("Error loading questions from DB:", e);
        qText.textContent = "Connection error. Please try again later.";
        grid.innerHTML = '';
        return;
    }
    
    // Reset state for new quiz
    state.currentQuestion = 0;
    state.selectedAnswers = []; // This will hold the user's selected domains

    // Restore buttons and start
    nextBtn.style.display = 'inline-flex';
    backBtn.style.display = 'inline-flex';
    renderQuestion(0);
}

function renderQuestion(index) {
    state.currentQuestion = index;
    const q = questions[index];

    document.getElementById('current-q').textContent = index + 1;
    document.getElementById('total-q').textContent = questions.length;
    const progress = Math.round(((index + 1) / questions.length) * 100);
    document.getElementById('progress-text').textContent = progress + '%';
    document.getElementById('progress-bar').style.width = progress + '%';
    document.getElementById('back-btn').style.visibility = index === 0 ? 'hidden' : 'visible';

    document.getElementById('question-text').textContent = q.text || q.questionText || "Question text missing";

    const grid = document.getElementById('options-grid');
    grid.innerHTML = '';

    const opts = q.options || q.answers || [];
    opts.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = 'option-card bg-white rounded-2xl p-6 text-center card-shadow card-hover animate-slide-up';
        btn.style.animationDelay = `${i * 100}ms`;
        
        const type = opt.domain || opt.type;
        btn.onclick = () => selectOption(type, btn);
        
        btn.innerHTML = `
            <h3 class="font-semibold text-gray-900 text-base flex items-center justify-center h-full">${opt.text}</h3>
        `;
        
        // Re-select if user navigated back
        if (state.selectedAnswers[index] === type) {
            btn.classList.add('selected');
            state.tempSelection = type;
            document.getElementById('next-btn').disabled = false;
        }
        
        grid.appendChild(btn);
    });

    if (!state.selectedAnswers[index]) {
        document.getElementById('next-btn').disabled = true;
        state.tempSelection = null;
    }
}

function selectOption(type, btn) {
    document.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
    btn.classList.add('selected');
    state.tempSelection = type;
    document.getElementById('next-btn').disabled = false;
}

function nextQuestion() {
    if (state.tempSelection) {
        state.selectedAnswers[state.currentQuestion] = state.tempSelection;
    }
    if (state.currentQuestion < questions.length - 1) {
        renderQuestion(state.currentQuestion + 1);
    } else {
        showResults();
    }
}

function prevQuestion() {
    if (state.currentQuestion > 0) {
        renderQuestion(state.currentQuestion - 1);
    }
}

async function showResults() {
    showSection('step-results');

    // Show loading state for results
    document.getElementById('career-title').textContent = 'Analyzing Results...';
    document.getElementById('result-icon').className = `fas fa-spinner fa-spin text-brand-blue`;
    document.getElementById('career-description').textContent = 'Calculating your best career fit based on your responses.';
    document.getElementById('strengths-list').innerHTML = '';

    try {
        const response = await fetch(`${API_BASE_URL}/submit-answers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answers: state.selectedAnswers })
        });
        
        if (!response.ok) throw new Error('Failed to submit answers');
        
        const data = await response.json();
        if (data.status === 'success' && data.result) {
            state.selectedDomain = data.result;
        } else {
            state.selectedDomain = 'tech'; // fallback
        }
    } catch (e) {
        console.error('Submit answers error:', e);
        state.selectedDomain = 'tech'; // fallback
    }

    const domainKey = state.selectedDomain;
    const domain = domains[domainKey];

    // Update UI - NO SCORES SHOWN, only recommendation
    document.getElementById('career-title').textContent = domain.name;
    document.getElementById('result-icon').className = `fas ${domain.icon} text-domain-${domainKey}`;
    document.getElementById('career-description').textContent = domain.description;

    // Show strengths instead of scores
    const strengthsContainer = document.getElementById('strengths-list');
    strengthsContainer.innerHTML = domain.strengths.map(s =>
        `<span class="px-3 py-1 rounded-full bg-white border border-gray-200 text-sm font-medium text-gray-700">${s}</span>`
    ).join('');
}

function showRoles() {
    showSection('step-roles');
    const domain = domains[state.selectedDomain];

    document.getElementById('roles-domain-title').textContent = domain.name;

    // Select first by default
    state.selectedRole = domain.roles[0];

    const grid = document.getElementById('roles-grid');
    grid.innerHTML = '';

    domain.roles.forEach((role, index) => {
        const card = document.createElement('div');
        card.className = `cursor-pointer rounded-2xl p-6 border-2 transition-all ${index === 0 ? 'border-brand-blue bg-blue-50' : 'border-gray-200 bg-white hover:border-brand-blue'}`;
        card.onclick = () => selectRole(role, card);
        card.innerHTML = `
            <div class="w-14 h-14 rounded-xl bg-${domain.color}-100 flex items-center justify-center text-2xl text-${domain.color}-600 mb-4">
                <i class="fas ${role.icon}"></i>
            </div>
            <h3 class="font-bold text-lg text-gray-900 mb-2">${role.title}</h3>
            <p class="text-sm text-gray-500 mb-3">${role.description}</p>
            <div class="flex items-center text-xs text-gray-400">
                <i class="fas fa-clock mr-1"></i> ${role.roadmap.length} levels
            </div>
            ${index === 0 ? '<div class="mt-3 inline-flex items-center text-brand-blue text-sm font-medium"><i class="fas fa-check-circle mr-1"></i> Selected</div>' : ''}
        `;
        grid.appendChild(card);
    });

    document.getElementById('select-role-btn').disabled = false;
}

function selectRole(role, card) {
    // Check for conflict with existing progress
    if (state.hasExistingProgress && state.selectedRole &&
        state.selectedRole.title !== role.title) {

        const confirmed = confirm(
            `You have existing progress in "${state.selectedRole.title}".\n\n` +
            `Do you want to switch to "${role.title}"?\n\n` +
            `Your previous progress will be saved and you can resume anytime.`
        );

        if (!confirmed) return;
    }

    state.selectedRole = role;

    // Update visual selection
    const cards = document.querySelectorAll('#roles-grid > div');
    cards.forEach((c, i) => {
        if (c === card) {
            c.className = 'cursor-pointer rounded-2xl p-6 border-2 border-brand-blue bg-blue-50 transition-all';
            if (!c.innerHTML.includes('Selected')) {
                c.innerHTML += '<div class="mt-3 inline-flex items-center text-brand-blue text-sm font-medium"><i class="fas fa-check-circle mr-1"></i> Selected</div>';
            }
        } else {
            c.className = 'cursor-pointer rounded-2xl p-6 border-2 border-gray-200 bg-white hover:border-brand-blue transition-all';
            c.innerHTML = c.innerHTML.replace(/<div class="mt-3.*Selected<\/div>/, '');
        }
    });

    state.unsavedChanges = true;
}

async function selectRoleAndContinue() {
    showSection('step-roadmap');
    saveUserProgress();
    initRoadmap();

    // Batch enroll in all courses for selected domain and role
    const token = sessionStorage.getItem('token');
    if (token && state.selectedDomain && state.selectedRole) {
        // Map domain key to human-readable form value
        const domainFormValue = DOMAIN_KEY_TO_FORM[state.selectedDomain] || state.selectedDomain;

        try {
            fetch(`${API_BASE_URL}/learner/courses/enroll-batch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    domain: domainFormValue,
                    role: state.selectedRole.title
                })
            });
        } catch (e) {
            console.error('Batch enrollment failed:', e);
        }
    }
}

function initRoadmap() {
    const role = state.selectedRole;
    document.getElementById('roadmap-title').textContent = role.title;
    document.getElementById('roadmap-subtitle').textContent = role.description;

    const levels = role.roadmap;
    state.totalTasks = levels.reduce((acc, lvl) => acc + lvl.modules.length, 0);

    renderLevels(levels);

    // If user has existing progress, start from their last level
    const startLevel = state.hasExistingProgress ? state.currentLevel : 0;
    renderLevelContent(startLevel, levels);

    // Show resume message if coming back to saved progress
    if (state.hasExistingProgress && startLevel > 0) {
        showNotification(`✓ Welcome back! Resuming from Level ${startLevel + 1}`, 'success');
    }
}

function renderLevels(levels) {
    const container = document.getElementById('levels-list');
    container.innerHTML = '';

    levels.forEach((level, index) => {
        const div = document.createElement('div');
        const isActive = index === 0;
        const isCompleted = index < state.currentLevel;

        div.className = `relative pl-8 py-2 cursor-pointer`;
        div.onclick = () => renderLevelContent(index, levels);

        div.innerHTML = `
            ${index < levels.length - 1 ? `<div class="absolute left-3 top-8 bottom-0 w-0.5 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}"></div>` : ''}
            <div class="absolute left-0 top-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isCompleted ? 'bg-green-500 text-white' : isActive ? 'bg-brand-blue text-white' : 'bg-gray-200 text-gray-600'}">
                ${isCompleted ? '<i class="fas fa-check"></i>' : level.level}
            </div>
            <div class="${isActive ? 'text-gray-900' : 'text-gray-500'}">
                <h4 class="font-semibold ${isActive ? 'text-brand-blue' : ''} text-sm">${level.title}</h4>
                <p class="text-xs mt-0.5 line-clamp-1">${level.desc}</p>
            </div>
        `;
        container.appendChild(div);
    });
}

function renderLevelContent(levelIndex, levels) {
    state.currentLevel = levelIndex;
    state.currentRoadmap = levels;
    state.unsavedChanges = true;

    // Don't save here - will be auto-saved after 20 seconds

    const level = levels[levelIndex];
    const container = document.getElementById('level-content');

    renderLevels(levels);

    container.innerHTML = `
        <div class="flex items-center justify-between mb-6">
            <div>
                <span class="text-xs font-bold text-brand-blue uppercase tracking-wider">Level ${level.level}</span>
                <h3 class="text-2xl font-bold text-gray-900 mt-1">${level.title}</h3>
            </div>
            <div class="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-brand-blue">
                <i class="fas fa-graduation-cap text-xl"></i>
            </div>
        </div>
        
        <p class="text-gray-600 mb-6">${level.desc}</p>
        
        <div class="space-y-4" id="modules-list">
            ${level.modules.map((module, idx) => `
                <div class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm transition-all hover:border-brand-blue group" id="module-container-${idx}">
                    <!-- Module Header (Clickable for Accordion) -->
                    <div class="flex items-center gap-4 p-4 cursor-pointer hover:bg-blue-50/50" onclick="toggleModuleAccordion(${idx}, '${module.title}', '${module.type}')">
                        <!-- Checkbox (Stop Propagation to avoid double toggling) -->
                        <div onclick="event.stopPropagation();">
                            <label class="cursor-pointer relative flex items-center justify-center p-1">
                                <input type="checkbox" class="checkbox-custom absolute opacity-0 w-0 h-0" 
                                       ${state.completedTasks.has(`${level.level}-${idx}`) ? 'checked' : ''}
                                       onchange="toggleTask('${level.level}-${idx}', this)">
                                <div class="w-6 h-6 rounded border-2 border-gray-300 flex items-center justify-center transition-all bg-white hover:border-brand-blue checked-style pointer-events-none">
                                    <svg class="w-4 h-4 text-white hidden check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                                </div>
                            </label>
                        </div>
                        
                        <!-- Module Info -->
                        <div class="flex-1">
                            <div class="flex items-center gap-2 mb-1">
                                <span class="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200 uppercase font-medium text-[10px]">${module.type}</span>
                                <span class="text-xs text-gray-400"><i class="far fa-clock mr-1"></i>${module.duration}</span>
                            </div>
                            <h4 class="font-medium text-gray-900 group-hover:text-brand-blue transition-colors text-sm">${module.title}</h4>
                        </div>
                        
                        <!-- Expand Icon -->
                        <div class="w-8 h-8 rounded-full flex items-center justify-center bg-gray-50 text-gray-400 transition-transform duration-300" id="module-icon-${idx}">
                            <i class="fas fa-chevron-down"></i>
                        </div>
                    </div>
                    
                    <!-- Accordion Content (Hidden by default) -->
                    <div id="module-content-${idx}" class="hidden border-t border-gray-100 bg-gray-50/50">
                        <div class="p-4" id="module-body-${idx}">
                            <div class="text-center py-6 text-gray-500">
                                <i class="fas fa-spinner animate-spin mr-2"></i>Loading content...
                            </div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>

        <div class="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center">
            <button onclick="renderLevelContent(${Math.max(0, levelIndex - 1)}, state.currentRoadmap)" 
                    class="px-4 py-2 text-gray-500 hover:text-gray-900 font-medium text-sm ${levelIndex === 0 ? 'invisible' : ''}">
                <i class="fas fa-arrow-left mr-2"></i> Back
            </button>
            ${levelIndex === levels.length - 1 ? `
                <button onclick="completeRoadmap()" class="px-6 py-2.5 bg-brand-blue text-white rounded-lg font-medium hover:bg-blue-600 transition-colors text-sm">
                    Complete Path <i class="fas fa-check ml-2"></i>
                </button>
            ` : `
                <button onclick="renderLevelContent(${levelIndex + 1}, state.currentRoadmap)" 
                        class="px-6 py-2.5 bg-brand-blue text-white rounded-lg font-medium hover:bg-blue-600 transition-colors text-sm">
                    Next Level <i class="fas fa-arrow-right ml-2"></i>
                </button>
            `}
        </div>
    `;

    // Fetch Level Videos securely in background so they are ready for accordions
    window.currentLevelExactVideos = [];
    loadLevelVideosData(level.level);

}

// Fetch level videos specifically for the module accordion matcher
async function loadLevelVideosData(levelNumber) {
    const domainKey = state.selectedDomain;
    const roleTitle = state.selectedRole?.title;
    if (!domainKey || !roleTitle) return;

    const domainFormValue = DOMAIN_KEY_TO_FORM[domainKey] || domainKey;

    try {
        const params = new URLSearchParams({
            domain: domainFormValue,
            role: roleTitle,
            level: String(levelNumber),
            exact: 'true'
        });
        const url = `${API_BASE_URL}/courses/available?${params}`;
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            const courses = data.courses || [];
            window.currentLevelExactVideos = courses.filter(c => Number(c.level) === Number(levelNumber));
        }
    } catch (e) {
        console.error('Failed to pre-load level videos:', e);
    }
}

// Handle accordion toggle
function toggleModuleAccordion(idx, moduleTitle, moduleType) {
    const contentDiv = document.getElementById(`module-content-${idx}`);
    const iconDiv = document.getElementById(`module-icon-${idx}`);

    // Toggle hidden state
    if (contentDiv.classList.contains('hidden')) {
        // Expand
        contentDiv.classList.remove('hidden');
        iconDiv.style.transform = 'rotate(180deg)';

        // Render content inside
        renderModuleContent(idx, moduleTitle, moduleType);
    } else {
        // Collapse
        contentDiv.classList.add('hidden');
        iconDiv.style.transform = 'rotate(0deg)';
    }
}

function renderModuleContent(idx, moduleTitle, moduleType) {
    const bodyDiv = document.getElementById(`module-body-${idx}`);

    // Always try to find a matching video regardless of type - everything is video now
    let matchedVideo = null;
    if (window.currentLevelExactVideos && window.currentLevelExactVideos.length > 0) {
        // Exact title match first (teacher uploaded for this specific subtopic)
        matchedVideo = window.currentLevelExactVideos.find(v =>
            v.title.toLowerCase().trim() === moduleTitle.toLowerCase().trim()
        );

        // Fuzzy match: any significant word in module title appears in video title
        if (!matchedVideo) {
            const titleWords = moduleTitle.toLowerCase().split(' ').filter(w => w.length > 3);
            matchedVideo = window.currentLevelExactVideos.find(v => {
                const vTitle = v.title.toLowerCase();
                return titleWords.some(w => vTitle.includes(w));
            });
        }
    }

    // ALWAYS render as video — all types are video
    if (matchedVideo) {
        const teacherName = matchedVideo.teacher?.full_name || matchedVideo.teacher?.user_id || 'Teacher';
        const videoSrc = matchedVideo.video_url;
        const isLocal = videoSrc && videoSrc.startsWith('/uploads/');
        const backendBase = BACKEND_BASE;
        const fullVideoSrc = isLocal ? `${backendBase}${videoSrc}` : videoSrc;

        bodyDiv.innerHTML = `
            <div class="flex flex-col gap-4">
                <div class="w-full rounded-xl overflow-hidden bg-black" style="aspect-ratio:16/9;">
                    <video controls class="w-full h-full" preload="metadata" onplay="incrementCourseView('${matchedVideo._id}')">
                        <source src="${fullVideoSrc}" type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                </div>
                <div class="flex items-center justify-between">
                    <div>
                        <h5 class="font-bold text-gray-900 text-base">${matchedVideo.title}</h5>
                        <p class="text-sm text-gray-500 mt-0.5"><i class="fas fa-chalkboard-teacher mr-1"></i> By ${teacherName}${matchedVideo.duration_minutes ? ' &middot; ' + matchedVideo.duration_minutes + ' min' : ''}</p>
                    </div>
                    <a href="${fullVideoSrc}" target="_blank" rel="noopener" class="flex-shrink-0 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-colors" onclick="incrementCourseView('${matchedVideo._id}')">
                        <i class="fas fa-external-link-alt mr-1"></i>Open
                    </a>
                </div>
            </div>
        `;

        // Store matched course ID for the toggleTask logic
        bodyDiv.dataset.matchedCourseId = matchedVideo._id;
    } else {
        // No video uploaded yet — show clear placeholder
        bodyDiv.innerHTML = `
            <div class="flex flex-col items-center justify-center gap-3 py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                <div class="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center text-brand-blue">
                    <i class="fas fa-video text-2xl"></i>
                </div>
                <h5 class="font-bold text-gray-900">${moduleTitle}</h5>
                <p class="text-sm text-gray-500 text-center max-w-xs">No video uploaded yet for this topic. The teacher will upload a video soon.</p>
            </div>
        `;
    }
}

function toggleTask(taskId, checkbox) {
    if (checkbox.checked) {
        state.completedTasks.add(taskId);

        // Find if there's a matched course for this module and increment view
        const [levelNum, moduleIdx] = taskId.split('-');
        const bodyDiv = document.getElementById(`module-body-${moduleIdx}`);
        let courseId = bodyDiv?.dataset.matchedCourseId;

        if (!courseId && window.currentLevelExactVideos) {
            // Try to find matching video from pre-loaded level data
            const moduleContainer = document.getElementById(`module-container-${moduleIdx}`);
            const moduleTitle = moduleContainer?.querySelector('h4')?.textContent;
            if (moduleTitle) {
                const matched = window.currentLevelExactVideos.find(v =>
                    v.title.toLowerCase().trim() === moduleTitle.toLowerCase().trim()
                );
                if (matched) courseId = matched._id;
            }
        }

        if (courseId) {
            incrementCourseView(courseId);
        }
    } else {
        state.completedTasks.delete(taskId);
    }

    state.unsavedChanges = true;
    updateProgress();
    saveUserProgress();

    const progress = (state.completedTasks.size / state.totalTasks) * 100;
    if (progress >= 50 && !state.mentorsShown) {
        setTimeout(() => showMentors(), 600);
    }
}

// Helper to increment view count
function incrementCourseView(courseId) {
    if (!courseId) return;
    try {
        fetch(`${API_BASE_URL}/courses/${courseId}/increment-view`, {
            method: 'POST'
        }).catch(e => console.log('View increment failed:', e));
    } catch (e) {
        console.error('View increment error:', e);
    }
}

function updateProgress() {
    const progress = Math.round((state.completedTasks.size / state.totalTasks) * 100);
    document.getElementById('roadmap-percent').textContent = progress + '%';
    document.getElementById('roadmap-progress-bar').style.width = progress + '%';
}

function showMentors() {
    state.mentorsShown = true;
    showSection('step-mentors');

    const mentors = state.selectedRole.mentors || [];
    const grid = document.getElementById('mentors-grid');
    grid.innerHTML = '';

    mentors.forEach((mentor, i) => {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-2xl p-6 card-shadow card-hover text-center animate-slide-up';
        card.style.animationDelay = `${i * 150}ms`;
        card.innerHTML = `
            <img src="https://i.pravatar.cc/150?u=${mentor.name}" alt="${mentor.name}" class="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-blue-50">
            <h3 class="font-bold text-lg text-gray-900">${mentor.name}</h3>
            <p class="text-brand-blue text-sm font-medium mb-1">${mentor.role}</p>
            <p class="text-gray-500 text-sm mb-3">${mentor.company}</p>
            <span class="inline-block px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium mb-4">${mentor.expertise}</span>
            <button class="w-full py-2 rounded-lg border-2 border-brand-blue text-brand-blue font-medium hover:bg-brand-blue hover:text-white transition-all text-sm">
                <i class="fab fa-linkedin mr-2"></i>Connect
            </button>
        `;
        grid.appendChild(card);
    });
}

function continueRoadmap() {
    showSection('step-roadmap');
}

function completeRoadmap() {
    // Check if ALL tasks are completed
    if (state.completedTasks.size < state.totalTasks) {
        showNotification(`Please complete all activities before finishing the path. (${state.completedTasks.size}/${state.totalTasks} completed)`, 'warning');
        
        // Find first incomplete level and scroll to it
        // This is a nice-to-have UX improvement
        console.log('⚠️ Completion blocked: Not all tasks finished');
        return;
    }

    showSection('step-completion');
    document.getElementById('completion-role').textContent = state.selectedRole.title;

    const skills = state.selectedRole.roadmap.flatMap(l => l.modules.map(m => m.title)).slice(0, 6);
    document.getElementById('skills-tags').innerHTML = skills.map(s =>
        `<span class="px-3 py-1.5 rounded-full bg-blue-50 text-brand-blue text-sm font-medium border border-blue-100"><i class="fas fa-check mr-2"></i>${s}</span>`
    ).join('');

    // Trigger final save after UI update
    setTimeout(() => {
        lastSaveAttempt = 0; // Reset debounce
        saveUserProgress();
    }, 100);
}

function showOpportunities() {
    showSection('step-opportunities');
    
    // Automatically fetch jobs on first load for the selected role
    const roleTitle = typeof state.selectedRole === 'object' ? state.selectedRole.title : state.selectedRole;
    if (roleTitle) {
        // Set default location to Remote to cast a wide net with Remotive API initially
        const locInput = document.getElementById('job-location-input');
        if (locInput && !locInput.value) locInput.value = 'Remote';
        fetchDynamicJobs(roleTitle, locInput ? locInput.value : 'Remote');
    }
}

async function fetchDynamicJobs(domainOverride = null, locationOverride = null) {
    const container = document.getElementById('opportunities-list');
    const loading = document.getElementById('job-loading-indicator');
    const errorMsg = document.getElementById('job-error-message');
    
    // Clear previous
    if (container) container.innerHTML = '';
    if (errorMsg) errorMsg.classList.add('hidden');
    if (loading) loading.classList.remove('hidden');
    
    // Get search params
    // Using domainOverride if passed (e.g. from showOpportunities initial call), otherwise selectedRole
    let domain = domainOverride || (typeof state.selectedRole === 'object' ? state.selectedRole.title : state.selectedRole);
    // Map internal domains/roles to better search terms for Remotive (optional but helps)
    if (domain === 'Software Developer' || domain === 'Web Developer' || domain === 'Frontend') domain = 'developer';
    if (domain === 'Data Scientist') domain = 'data';
    
    const locationInput = document.getElementById('job-location-input')?.value;
    const location = locationOverride || locationInput || '';
    
    try {
        const queryParams = new URLSearchParams({ domain });
        if (location) queryParams.append('location', location);
        
        const response = await fetch(`${API_BASE_URL}/jobs?${queryParams}`);
        if (!response.ok) throw new Error('API request failed');
        
        const data = await response.json();
        
        if (loading) loading.classList.add('hidden');
        
        if (data.status === 'success' && data.jobs && data.jobs.length > 0) {
            renderDynamicJobs(data.jobs);
        } else {
            if (errorMsg) errorMsg.classList.remove('hidden');
            const errText = document.getElementById('job-error-text');
            if (errText) errText.textContent = 'No jobs found matching your criteria. Try adjusting the location or exploring remote roles.';
        }
    } catch (e) {
        console.error('Error fetching dynamic jobs:', e);
        if (loading) loading.classList.add('hidden');
        if (errorMsg) errorMsg.classList.remove('hidden');
        const errText = document.getElementById('job-error-text');
        if (errText) errText.textContent = 'Failed to connect to the job server. Please try again later.';
    }
}

function renderDynamicJobs(jobs) {
    const container = document.getElementById('opportunities-list');
    if (!container) return;
    container.innerHTML = '';
    
    jobs.forEach((opp, i) => {
        const div = document.createElement('div');
        div.className = 'bg-white rounded-2xl p-6 card-shadow card-hover flex flex-col md:flex-row items-center gap-6 animate-slide-up';
        div.style.animationDelay = `${(i % 5) * 100}ms`;

        // We use default icons based on type if no logo is provided
        const logoHtml = opp.logo 
            ? `<div class="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100 bg-white"><img src="${opp.logo}" alt="${opp.company}" class="w-full h-full object-contain p-1" onerror="this.onerror=null; this.src='https://via.placeholder.com/64?text=${opp.company.substring(0,2)}';"></div>`
            : `<div class="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-blue to-brand-dark flex items-center justify-center text-2xl text-white flex-shrink-0 font-bold">${opp.company.substring(0,1)}</div>`;

        div.innerHTML = `
            ${logoHtml}
            <div class="flex-1 text-center md:text-left w-full">
                <div class="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1">
                    <h3 class="font-bold text-lg md:text-xl text-gray-900 line-clamp-1" title="${opp.title}">${opp.title}</h3>
                    <span class="px-2 py-0.5 rounded bg-blue-50 text-brand-blue text-xs font-semibold uppercase tracking-wider">${opp.type || 'Full-time'}</span>
                </div>
                <p class="text-gray-500 text-sm font-medium mb-3">${opp.company}</p>
                <div class="flex flex-wrap gap-2 justify-center md:justify-start">
                    <span class="px-3 py-1.5 rounded-full bg-gray-50 text-gray-700 text-xs font-medium flex items-center shadow-sm">
                        <i class="fas fa-map-marker-alt text-brand-orange mr-1.5"></i>${opp.location || 'Remote'}
                    </span>
                    ${opp.salary && opp.salary !== 'Competitive' ? `
                    <span class="px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-xs font-medium flex items-center shadow-sm">
                        <i class="fas fa-dollar-sign mr-1"></i>${opp.salary}
                    </span>` : ''}
                </div>
            </div>
            <a href="${opp.apply_link}" target="_blank" rel="noopener noreferrer" class="w-full md:w-auto px-8 py-3 bg-brand-orange hover:bg-orange-600 text-white rounded-xl font-semibold transition-all text-sm whitespace-nowrap text-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                Apply Now <i class="fas fa-external-link-alt ml-1"></i>
            </a>
        `;
        container.appendChild(div);
    });
}

function getUserLocation() {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser");
        return;
    }
    
    const locInput = document.getElementById('job-location-input');
    if (locInput) locInput.value = 'Locating...';
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            try {
                // Reverse geocode to get city name using free BigDataCloud API
                const { latitude, longitude } = position.coords;
                const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
                const data = await response.json();
                
                const city = data.city || data.locality || data.principalSubdivision || 'Local';
                if (locInput) locInput.value = city;
                fetchDynamicJobs(); // Trigger refresh with new location
            } catch (err) {
                console.error("Geocoding failed", err);
                if (locInput) locInput.value = 'Remote';
                fetchDynamicJobs();
            }
        },
        (error) => {
            console.error("Error getting location", error);
            if (locInput) locInput.value = 'Remote';
            alert("Unable to retrieve your location. Showing remote jobs instead.");
            fetchDynamicJobs();
        }
    );
}

// Goal Allocation Functions
function allocateGoal(goalTitle, targetDate, level) {
    const newGoal = {
        id: Date.now(),
        title: goalTitle,
        targetDate: targetDate,
        targetLevel: level,
        createdAt: new Date().toISOString(),
        status: 'active',
        progress: 0
    };

    state.goals.push(newGoal);
    state.unsavedChanges = true;
    saveGoals();

    // Reset debounce for important goal save
    lastSaveAttempt = 0;
    saveUserProgress();

    console.log('✓ Goal allocated:', newGoal);
    displayGoals();
}

function displayGoals() {
    const goalsContainer = document.getElementById('goals-list');
    if (!goalsContainer) return;

    if (state.goals.length === 0) {
        goalsContainer.innerHTML = '<p class="text-gray-500 text-sm">No goals allocated yet</p>';
        return;
    }

    goalsContainer.innerHTML = state.goals.map(goal => {
        const daysRemaining = Math.ceil(
            (new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24)
        );
        const statusColor = daysRemaining < 0 ? 'bg-red-50 text-red-700' :
            daysRemaining < 7 ? 'bg-orange-50 text-orange-700' :
                'bg-green-50 text-green-700';

        return `
            <div class="bg-white rounded-lg border border-gray-200 p-4 mb-3">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <h4 class="font-medium text-gray-900">${goal.title}</h4>
                        <p class="text-xs text-gray-500">Target: Level ${goal.targetLevel}</p>
                    </div>
                    <span class="px-2 py-1 rounded text-xs font-medium ${statusColor}">
                        ${daysRemaining < 0 ? 'Overdue' : daysRemaining + ' days left'}
                    </span>
                </div>
                <div class="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div class="h-full bg-brand-blue rounded-full" style="width: ${goal.progress}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

function updateGoalProgress() {
    if (state.currentLevel && state.goals.length > 0) {
        state.goals.forEach(goal => {
            const progressPercent = (state.currentLevel / goal.targetLevel) * 100;
            goal.progress = Math.min(progressPercent, 100);
        });
        saveGoals();
        displayGoals();
    }
}

// Save progress on visibility change (user switches tabs/windows)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden, save progress immediately
        const userId = sessionStorage.getItem('userId');
        const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';

        if (isLoggedIn && userId && state.unsavedChanges) {
            console.log('Page hidden, saving progress...');
            saveUserProgress();
        }
    }
});

// Save progress every 20 seconds with retry logic
let syncRetryCount = 0;
const maxRetries = 3;

setInterval(() => {
    const userId = sessionStorage.getItem('userId');
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';

    if (isLoggedIn && userId && state.unsavedChanges) {
        saveUserProgress().then(() => {
            syncRetryCount = 0;
        }).catch(() => {
            syncRetryCount++;
            if (syncRetryCount < maxRetries) {
                console.log(`Retry sync attempt ${syncRetryCount}/${maxRetries}`);
            }
        });
    }
}, 20000);

// Warn before closing if unsaved changes
window.addEventListener('beforeunload', (e) => {
    const userId = sessionStorage.getItem('userId');
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';

    // Save progress immediately on page unload/refresh
    if (isLoggedIn && userId && (state.completedTasks.size > 0 || state.selectedDomain)) {
        // Extract role title from role object if it's an object
        const roleTitle = typeof state.selectedRole === 'object'
            ? state.selectedRole?.title
            : state.selectedRole;

        // Use synchronous approach for unload (beacon API for offline support)
        const progressData = {
            user_id: userId,
            selected_domain: state.selectedDomain,
            selected_role: roleTitle,
            current_level: state.currentLevel,
            completed_tasks: Array.from(state.completedTasks),
            total_tasks: state.totalTasks,
            progress_percentage: state.totalTasks > 0 ?
                Math.round((state.completedTasks.size / state.totalTasks) * 100) : 0
        };

        // Save to local storage immediately (guaranteed to work)
        localStorage.setItem(`progress_${userId}`, JSON.stringify(progressData));

        // Try to send to server using sendBeacon (best effort, won't block)
        try {
            navigator.sendBeacon(
                `${API_BASE_URL}/save-progress`,
                JSON.stringify(progressData)
            );
        } catch (err) {
            console.log('Beacon save attempt made');
        }
    }

    // Show warning only if there are truly unsaved changes
    if (state.unsavedChanges) {
        e.preventDefault();
        e.returnValue = 'Your progress is being saved. Are you sure you want to leave?';
    }
});

// ==================== TEACHER COURSE MANAGEMENT ====================

// Teacher Tab Switching
document.addEventListener('DOMContentLoaded', () => {
    const teacherTabBtns = document.querySelectorAll('.teacher-tab-btn');
    teacherTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            switchTeacherTab(tabName);
        });
    });
});

function switchTeacherTab(tabName) {
    // Hide all tabs
    const allTabs = document.querySelectorAll('.teacher-tab-content');
    allTabs.forEach(tab => tab.classList.add('hidden'));

    // Remove active state from all buttons
    const allBtns = document.querySelectorAll('.teacher-tab-btn');
    allBtns.forEach(btn => {
        btn.classList.remove('active', 'border-b-2', 'border-brand-blue', 'text-gray-900');
        btn.classList.add('text-gray-600');
    });

    // Show selected tab
    const selectedTab = document.getElementById(`teacher-${tabName}-tab`);
    if (selectedTab) selectedTab.classList.remove('hidden');

    // Activate button
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active', 'border-b-2', 'border-brand-blue', 'text-gray-900');
        activeBtn.classList.remove('text-gray-600');
    }

    // Load content based on tab
    if (tabName === 'manage') {
        loadTeacherCourses();
    } else if (tabName === 'analytics') {
        loadTeacherAnalytics();
    }
}

// Teacher management functions moved higher for reliability

// Populate career path (role) dropdown from domain - same options learners see
function populateCareerPathsForDomain(domainFormValue) {
    const roleSelect = document.getElementById('course-role');
    if (!roleSelect) return;
    const key = DOMAIN_FORM_TO_KEY[domainFormValue];
    if (!key || !domains[key]) {
        roleSelect.innerHTML = '<option value="">Select Domain first</option>';
        roleSelect.value = '';
        return;
    }
    const domainConfig = domains[key];
    const roles = domainConfig.roles || [];
    roleSelect.innerHTML = '<option value="">Select Career Path</option>' +
        roles.map(r => `<option value="${r.title}">${r.title} — ${r.description || ''}</option>`).join('');
    roleSelect.value = '';
}

// Dynamically populate subtopics for the selected path out of the roadmap
function updateSubtopics() {
    const domainVal = document.getElementById('course-domain')?.value;
    const roleVal = document.getElementById('course-role')?.value;
    const levelVal = document.getElementById('course-level')?.value;
    const titleSelect = document.getElementById('course-title');

    if (!titleSelect) return;

    if (!domainVal || !roleVal || !levelVal) {
        titleSelect.innerHTML = '<option value="">Select Domain, Path, and Level first</option>';
        titleSelect.value = '';
        return;
    }

    const key = DOMAIN_FORM_TO_KEY[domainVal];
    if (!key || !domains[key]) {
        titleSelect.innerHTML = '<option value="">Invalid Domain</option>';
        return;
    }

    const domainConfig = domains[key];
    const role = domainConfig.roles?.find(r => r.title === roleVal);

    if (!role) {
        titleSelect.innerHTML = '<option value="">Invalid Career Path</option>';
        return;
    }

    const levelPlan = role.roadmap?.find(l => parseInt(l.level) === parseInt(levelVal));

    if (!levelPlan || !levelPlan.modules || levelPlan.modules.length === 0) {
        titleSelect.innerHTML = '<option value="">No subtopics found for this level</option>';
        return;
    }

    let optionsHTML = '<option value="">Select Subtopic</option>';
    levelPlan.modules.forEach(mod => {
        optionsHTML += `<option value="${mod.title}">${mod.title} (${mod.duration || 'Video'})</option>`;
    });

    titleSelect.innerHTML = optionsHTML;
    titleSelect.value = '';
}

// Wire up domain change to populate career paths and parent select
document.addEventListener('DOMContentLoaded', () => {
    const domainEl = document.getElementById('course-domain');
    const roleEl = document.getElementById('course-role');
    const levelEl = document.getElementById('course-level');

    if (domainEl) {
        domainEl.addEventListener('change', (e) => {
            const val = e.target.value;
            populateCareerPathsForDomain(val);
            updateSubtopics();
        });
        // Initial populate if domain already has value (e.g. locked for verified teacher)
        if (domainEl.value) {
            populateCareerPathsForDomain(domainEl.value);
            updateSubtopics();
        }
    }

    if (roleEl) {
        roleEl.addEventListener('change', updateSubtopics);
    }

    if (levelEl) {
        levelEl.addEventListener('change', updateSubtopics);
    }
});

// Load Teacher's Courses
async function loadTeacherCourses() {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    const coursesList = document.getElementById('teacher-courses-list');
    coursesList.innerHTML = '<p class="text-gray-500 text-center py-8">Loading courses...</p>';

    try {
        const response = await fetch(`${API_BASE_URL}/teacher/courses`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (response.ok && data.courses.length > 0) {
            coursesList.innerHTML = data.courses.map(course => `
                <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <h4 class="font-bold text-gray-900">${course.title}</h4>
                            <p class="text-sm text-gray-600">${course.domain} - ${course.role}</p>
                        </div>
                        <span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                            Level ${course.level}
                        </span>
                    </div>
                    <div class="flex items-center gap-4 text-sm text-gray-600 mb-4">
                        <span><i class="fas fa-eye mr-1"></i>${course.views || 0} views</span>
                        <span><i class="fas fa-users mr-1"></i>${course.enrolled_learners || 0} enrolled</span>
                        <span><i class="fas fa-star mr-1"></i>${(course.rating || 0).toFixed(1)} rating</span>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="editCourse('${course._id}')" class="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-semibold flex items-center gap-1 transition-colors">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button onclick="viewCourseAnalytics('${course._id}')" class="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded text-sm font-semibold flex items-center gap-1 transition-colors">
                            <i class="fas fa-chart-bar"></i> Analytics
                        </button>
                        <button onclick="deleteCourse('${course._id}')" class="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-semibold flex items-center gap-1 transition-colors">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `).join('');
        } else {
            coursesList.innerHTML = '<p class="text-gray-500 text-center py-8">No courses yet. Upload your first course!</p>';
        }
    } catch (error) {
        console.error('Error loading courses:', error);
        coursesList.innerHTML = '<p class="text-red-600 text-center py-8">Error loading courses</p>';
    }
}

// Edit Course
async function editCourse(courseId) {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch(`${API_BASE_URL}/teacher/courses/${courseId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        if (response.ok) {
            const course = data.course;

            // Switch to upload tab before populating
            switchTeacherTab('upload');

            // Reset form first
            resetUploadForm();

            // Populate hidden ID
            document.getElementById('edit-course-id').value = courseId;

            // Populate form with course data
            document.getElementById('course-domain').value = course.domain;
            populateCareerPathsForDomain(course.domain);
            document.getElementById('course-role').value = course.role;
            document.getElementById('course-level').value = course.level;

            // Populate title options and then set value
            updateSubtopics();
            document.getElementById('course-title').value = course.title;

            document.getElementById('course-thumbnail-url').value = course.thumbnail_url || '';
            document.getElementById('course-duration').value = course.duration_minutes || '';
            document.getElementById('course-description').value = course.description || '';
            document.getElementById('course-tags').value = (course.tags || []).join(', ');

            // Video is optional during edit
            document.getElementById('course-video-file').required = false;

            // Change submit button to update
            const submitBtn = document.getElementById('upload-course-btn');
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
            }

            // Scroll to form
            document.getElementById('teacher-upload-tab').scrollIntoView({ behavior: 'smooth' });
        }
    } catch (error) {
        console.error('Error loading course:', error);
        alert('Failed to load course details');
    }
}

// updateCourse is now handled by handleCourseUpload for consistency
async function updateCourse(event, courseId) {
    // This is kept as a wrapper for any legacy calls, but handleCourseUpload is the primary entry point
    handleCourseUpload(event);
}

// Delete Course
async function deleteCourse(courseId) {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
        return;
    }

    const token = sessionStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch(`${API_BASE_URL}/teacher/courses/${courseId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            alert('Course deleted successfully');
            loadTeacherCourses();
        } else {
            alert('Failed to delete course');
        }
    } catch (error) {
        console.error('Error deleting course:', error);
        alert('Error deleting course');
    }
}

// Load Teacher Analytics
async function loadTeacherAnalytics() {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    const analyticsContent = document.getElementById('teacher-analytics-content');

    try {
        const response = await fetch(`${API_BASE_URL}/teacher/courses`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (response.ok && data.courses.length > 0) {
            analyticsContent.innerHTML = `
                <div class="grid md:grid-cols-2 gap-6">
                    ${data.courses.map(course => `
                        <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200 cursor-pointer hover:shadow-md transition-shadow"
                             onclick="viewCourseAnalytics('${course._id}')">
                            <h4 class="font-bold text-gray-900 mb-2">${course.title}</h4>
                            <div class="grid grid-cols-2 gap-2 text-sm">
                                <div class="bg-white rounded p-2">
                                    <p class="text-gray-500 text-xs">Total Views</p>
                                    <p class="text-2xl font-bold text-brand-blue">${course.views || 0}</p>
                                </div>
                                <div class="bg-white rounded p-2">
                                    <p class="text-gray-500 text-xs">Enrolled</p>
                                    <p class="text-2xl font-bold text-green-600">${course.enrolled_learners || 0}</p>
                                </div>
                            </div>
                            <p class="text-xs text-gray-600 mt-2"><i class="fas fa-arrow-right mr-1"></i>Click for details</p>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            analyticsContent.innerHTML = '<p class="text-gray-500 text-center py-8">No courses to analyze</p>';
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
        analyticsContent.innerHTML = '<p class="text-red-600 text-center py-8">Error loading analytics</p>';
    }
}

// View Course Analytics Details
async function viewCourseAnalytics(courseId) {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch(`${API_BASE_URL}/teacher/courses/${courseId}/analytics`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (response.ok) {
            const analytics = data.analytics;
            const analyticsContent = document.getElementById('teacher-analytics-content');

            analyticsContent.innerHTML = `
                <div class="space-y-6">
                    <div class="flex items-center justify-between">
                        <h3 class="text-2xl font-bold text-gray-900">${analytics.title}</h3>
                        <button onclick="loadTeacherAnalytics()" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-semibold">
                            <i class="fas fa-arrow-left mr-2"></i>Back
                        </button>
                    </div>
                    
                    <div class="grid md:grid-cols-3 gap-4">
                        <div class="bg-blue-50 rounded-xl p-4 border border-blue-200">
                            <p class="text-gray-600 text-sm font-semibold mb-1">Total Views</p>
                            <p class="text-3xl font-bold text-brand-blue">${analytics.total_views}</p>
                        </div>
                        <div class="bg-green-50 rounded-xl p-4 border border-green-200">
                            <p class="text-gray-600 text-sm font-semibold mb-1">Total Enrolled</p>
                            <p class="text-3xl font-bold text-green-600">${analytics.total_enrolled}</p>
                        </div>
                        <div class="bg-purple-50 rounded-xl p-4 border border-purple-200">
                            <p class="text-gray-600 text-sm font-semibold mb-1">Completion Rate</p>
                            <p class="text-3xl font-bold text-purple-600">${(analytics.completion_rate || 0).toFixed(1)}%</p>
                        </div>
                    </div>
                    
                    ${analytics.enrolled_learners.length > 0 ? `
                        <div>
                            <h4 class="font-bold text-gray-900 mb-3">Enrolled Learners</h4>
                            <div class="space-y-2">
                                ${analytics.enrolled_learners.slice(0, 10).map(e => `
                                    <div class="bg-white rounded p-3 flex justify-between items-center border border-gray-200">
                                        <div>
                                            <p class="font-semibold text-gray-900">${e.learner?.full_name || 'Unknown'}</p>
                                            <p class="text-xs text-gray-500">${e.learner?.user_id || 'N/A'}</p>
                                        </div>
                                        <div class="text-sm">
                                            ${e.completed ? '<span class="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">Completed</span>' : '<span class="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-semibold">In Progress</span>'}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading course analytics:', error);
        alert('Failed to load analytics');
    }
}

// ==================== LEARNER COURSE DISCOVERY ====================

// Load Available Courses for Learner
async function loadLearnerCourses() {
    const token = sessionStorage.getItem('token');
    const userType = sessionStorage.getItem('userType');
    const courseGrid = document.getElementById('learner-courses-grid');

    if (!courseGrid) return; // Section might not be visible for teachers

    courseGrid.innerHTML = `
        <div class="col-span-full text-center py-12">
            <i class="fas fa-spinner animate-spin text-3xl text-brand-blue mb-4"></i>
            <p class="text-gray-600">Loading courses...</p>
        </div>
    `;

    try {
        let url = `${API_BASE_URL}/courses/available`;

        // If logged in as learner, use personalized endpoint
        if (token && userType === 'learner') {
            url = `${API_BASE_URL}/learner/courses`;
        }

        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const response = await fetch(url, { headers });

        const data = await response.json();

        if (response.ok && data.courses && data.courses.length > 0) {
            courseGrid.innerHTML = data.courses.map(course => `
                <div class="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow hover:-translate-y-1 duration-300">
                    ${course.thumbnail_url ? `
                        <div class="w-full h-40 bg-gradient-to-br from-blue-200 to-purple-200 overflow-hidden">
                            <img src="${course.thumbnail_url}" alt="${course.title}" class="w-full h-full object-cover">
                        </div>
                    ` : `
                        <div class="w-full h-40 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white">
                            <i class="fas fa-video text-4xl opacity-50"></i>
                        </div>
                    `}
                    
                    <div class="p-4">
                        <div class="flex items-start justify-between mb-2">
                            <div>
                                <h3 class="font-bold text-gray-900">${course.title}</h3>
                                <p class="text-sm text-gray-600">${course.domain} <span class="text-gray-400">•</span> ${course.role}</p>
                            </div>
                            <span class="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold whitespace-nowrap">
                                L${course.level}
                            </span>
                        </div>
                        
                        <p class="text-sm text-gray-600 mb-3 line-clamp-2">${course.description || 'Professional course content'}</p>
                        
                        <div class="flex items-center gap-3 text-xs text-gray-500 mb-4">
                            <span><i class="fas fa-eye mr-1"></i>${course.views || 0} views</span>
                            <span><i class="fas fa-users mr-1"></i>${course.enrolled_learners || 0} enrolled</span>
                            ${course.duration_minutes ? `<span><i class="fas fa-clock mr-1"></i>${course.duration_minutes}min</span>` : ''}
                        </div>
                        
                        <div class="flex items-center gap-2 mb-4">
                            ${course.rating > 0 ? `
                                <div class="flex items-center gap-1">
                                    ${'⭐'.repeat(Math.round(course.rating))}
                                    <span class="text-xs text-gray-600">(${course.number_of_reviews || 0})</span>
                                </div>
                            ` : `<p class="text-xs text-gray-500">No ratings yet</p>`}
                        </div>
                        
                        <div class="flex gap-2">
                            <button onclick="viewCourse('${course._id}')" class="flex-1 px-3 py-2 bg-brand-blue hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-colors">
                                <i class="fas fa-play mr-1"></i>View
                            </button>
                            ${token && userType === 'learner' ? `
                                <button onclick="enrollCourse('${course._id}')" class="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold transition-colors">
                                    <i class="fas fa-check mr-1"></i>Enroll
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            courseGrid.innerHTML = '<div class="col-span-full text-center py-12"><p class="text-gray-500">No courses available for your level yet</p></div>';
        }
    } catch (error) {
        console.error('Error loading courses:', error);
        courseGrid.innerHTML = '<div class="col-span-full text-center py-12"><p class="text-red-600">Error loading courses</p></div>';
    }
}

// View Course (Track View)
async function viewCourse(courseId) {
    const token = sessionStorage.getItem('token');

    try {
        // Track view
        await fetch(`${API_BASE_URL}/learner/courses/${courseId}/view`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
        });

        // Open course in modal or new tab
        alert('Opening course... (Implementation for full course viewer can be added)');
    } catch (error) {
        console.error('Error tracking view:', error);
    }
}

// Enroll in Course
async function enrollCourse(courseId) {
    const token = sessionStorage.getItem('token');
    if (!token) {
        alert('Please login to enroll in courses');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/learner/courses/${courseId}/enroll`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            alert('✓ Successfully enrolled in ' + data.course.title);
            loadLearnerCourses(); // Refresh the list
        } else {
            alert('✗ ' + (data.message || 'Enrollment failed'));
        }
    } catch (error) {
        console.error('Error enrolling:', error);
        alert('Error enrolling in course');
    }
}

// ==================== ADMIN DASHBOARD ====================

// Admin Tab Switching
document.addEventListener('DOMContentLoaded', () => {
    const adminTabBtns = document.querySelectorAll('.admin-tab-btn');
    adminTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            switchAdminTab(tabName);
        });
    });
});

function switchAdminTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.admin-tab-content').forEach(tab => tab.classList.add('hidden'));
    // Reset all buttons
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.classList.remove('active', 'border-b-2', 'border-red-500', 'text-gray-900');
        btn.classList.add('text-gray-600');
    });
    // Show selected tab
    const selectedTab = document.getElementById(`admin-${tabName}-tab`);
    if (selectedTab) selectedTab.classList.remove('hidden');
    // Activate button
    const activeBtn = document.querySelector(`.admin-tab-btn[data-tab="${tabName}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active', 'border-b-2', 'border-red-500', 'text-gray-900');
        activeBtn.classList.remove('text-gray-600');
    }
    // Load data for tab
    if (tabName === 'overview') loadAdminOverview();
    else if (tabName === 'users') loadAdminUsers();
    else if (tabName === 'verifications') loadAdminVerificationQueue();
    else if (tabName === 'progress') loadAdminProgress();
    else if (tabName === 'courses') loadAdminCourses();
}

// Load Progress Tracking for Admin
async function loadAdminProgress() {
    const token = sessionStorage.getItem('token');
    if (!token) return;
    const container = document.getElementById('admin-progress-content');
    if (!container) return;
    container.innerHTML = '<p class="text-gray-500 text-center py-8">Loading progress data...</p>';
    try {
        const res = await fetch(`${API_BASE_URL}/admin/progress`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        if (res.ok && data.data && data.data.length > 0) {
            container.innerHTML = data.data.map(p => `
                <div class="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <i class="fas fa-user-graduate text-blue-600"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="font-semibold text-gray-900 truncate">${p.user?.full_name || p.user?.user_id || 'Unknown'}</p>
                        <p class="text-xs text-gray-500">${p.selected_role || 'No role'} · ${p.selected_domain || 'No domain'}</p>
                    </div>
                    <div class="flex flex-col items-end flex-shrink-0">
                        <span class="font-bold text-brand-blue">${p.progress_percentage || 0}%</span>
                        <div class="w-24 h-2 bg-gray-200 rounded-full mt-1">
                            <div class="h-2 bg-brand-blue rounded-full" style="width:${p.progress_percentage || 0}%"></div>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">No progress data available.</p>';
        }
    } catch (e) {
        container.innerHTML = '<p class="text-red-500 text-center py-8">Failed to load progress data.</p>';
    }
}

// Load Course Management for Admin
async function loadAdminCourses() {
    const token = sessionStorage.getItem('token');
    if (!token) return;
    const container = document.getElementById('admin-courses-content');
    if (!container) return;
    container.innerHTML = '<p class="text-gray-500 text-center py-8">Loading courses...</p>';
    try {
        const res = await fetch(`${API_BASE_URL}/admin/courses`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        if (res.ok && data.courses && data.courses.length > 0) {
            container.innerHTML = `
                <div class="flex justify-between items-center mb-4">
                    <p class="text-sm text-gray-500">${data.courses.length} total courses</p>
                    <button onclick="loadAdminCourses()" class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm font-semibold">
                        <i class="fas fa-sync mr-1"></i>Refresh
                    </button>
                </div>
                <div class="space-y-3">
                ${data.courses.map(course => `
                    <div class="flex items-start justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 gap-4">
                        <div class="flex-1 min-w-0">
                            <h4 class="font-bold text-gray-900 truncate">${course.title}</h4>
                            <p class="text-sm text-gray-600">${course.domain} · ${course.role} · Level ${course.level}</p>
                            <p class="text-xs text-gray-400 mt-1">By ${course.teacher?.full_name || course.teacher?.user_id || 'Unknown Teacher'}</p>
                        </div>
                        <div class="flex gap-2 flex-shrink-0">
                            <span class="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">L${course.level}</span>
                            <button onclick="adminDeleteCourse('${course._id}')" class="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs font-semibold transition-colors">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
                </div>
            `;
        } else {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">No courses found.</p>';
        }
    } catch (e) {
        container.innerHTML = '<p class="text-red-500 text-center py-8">Failed to load courses.</p>';
    }
}

async function adminDeleteCourse(courseId) {
    if (!confirm('Delete this course? This cannot be undone.')) return;
    const token = sessionStorage.getItem('token');
    try {
        const res = await fetch(`${API_BASE_URL}/admin/courses/${courseId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) { alert('Course deleted'); loadAdminCourses(); }
        else alert('Failed to delete course');
    } catch (e) { alert('Error deleting course'); }
}

// Admin Functions
// Load admin overview data
async function loadAdminOverview() {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();

            // Update stats
            document.getElementById('total-learners').textContent = data.data.users.total_learners;
            document.getElementById('total-teachers').textContent = data.data.users.total_teachers;
            document.getElementById('verified-teachers').textContent = data.data.users.verified_teachers;
            document.getElementById('avg-progress').textContent = Math.round(data.data.progress.average_progress_percentage) + '%';

            // Update recent activity
            const activityContainer = document.getElementById('recent-activity');
            if (data.data.recent_activity && data.data.recent_activity.length > 0) {
                activityContainer.innerHTML = data.data.recent_activity.map(activity => `
                    <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-user text-blue-600 text-sm"></i>
                        </div>
                        <div class="flex-1">
                            <p class="text-sm font-semibold text-gray-900">${activity.user?.full_name || activity.user?.user_id} (${activity.userType})</p>
                            <p class="text-xs text-gray-500">${new Date(activity.login_time).toLocaleString()}</p>
                        </div>
                    </div>
                `).join('');
            } else {
                activityContainer.innerHTML = '<p class="text-gray-500 text-center py-4">No recent activity</p>';
            }
        }
    } catch (error) {
        console.error('Error loading admin overview:', error);
    }
}

// Load admin users management
async function loadAdminUsers() {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            const usersContainer = document.getElementById('admin-users-list');

            const allUsers = [
                ...data.data.learners.map(user => ({ ...user, type: 'learner' })),
                ...data.data.teachers.map(user => ({ ...user, type: 'teacher' })),
                ...data.data.admins.map(user => ({ ...user, type: 'admin' }))
            ];

            usersContainer.innerHTML = allUsers.map(user => `
                <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 ${user.type === 'admin' ? 'bg-red-100' : user.type === 'teacher' ? 'bg-orange-100' : 'bg-blue-100'} rounded-full flex items-center justify-center">
                            <i class="fas ${user.type === 'admin' ? 'fa-user-shield text-red-600' : user.type === 'teacher' ? 'fa-chalkboard-teacher text-orange-600' : 'fa-user-graduate text-blue-600'}"></i>
                        </div>
                        <div>
                            <p class="font-semibold text-gray-900">${user.full_name || user.user_id}</p>
                            <p class="text-sm text-gray-500">${user.user_id} • ${user.email}</p>
                            ${user.type === 'teacher' ? `<p class="text-xs ${user.is_verified ? 'text-green-600' : 'text-yellow-600'}">${user.is_verified ? 'Verified' : 'Pending Verification'}</p>` : ''}
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        ${user.type === 'teacher' ? `
                            <button onclick="toggleTeacherVerification('${user._id}', ${!user.is_verified})" 
                                    class="px-3 py-1 ${user.is_verified ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-green-100 text-green-700 hover:bg-green-200'} rounded text-sm font-semibold transition-colors">
                                ${user.is_verified ? 'Unverify' : 'Verify'}
                            </button>
                        ` : ''}
                        <button onclick="toggleUserStatus('${user._id}', '${user.type}', ${!user.is_active})" 
                                class="px-3 py-1 ${user.is_active ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'} rounded text-sm font-semibold transition-colors">
                            ${user.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading admin users:', error);
    }
}

// Load teacher verification queue (Admin)
async function loadAdminVerificationQueue() {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    const list = document.getElementById('admin-verifications-list');
    if (list) list.innerHTML = '<p class="text-gray-500 text-center py-8">Loading verification requests...</p>';

    try {
        const res = await fetch(`${API_BASE_URL}/admin/teacher-verifications?status=pending`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (!res.ok) {
            if (list) list.innerHTML = `<p class="text-red-600 text-center py-8">Failed to load: ${data.message || 'Error'}</p>`;
            return;
        }

        const items = data.items || [];
        if (!list) return;

        if (items.length === 0) {
            list.innerHTML = '<p class="text-gray-500 text-center py-8">No pending verification requests.</p>';
            return;
        }

        list.innerHTML = items.map(item => {
            const teacherName = item.teacher?.full_name || item.teacher?.user_id || 'Teacher';
            const teacherId = item.teacher?.user_id || '';
            const email = item.teacher?.email || '';
            const domain = item.primary_domain || (item.expertise_domains || [])[0] || '—';
            const docs = (item.documents || []).slice(0, 3);

            return `
                <div class="bg-gray-50 rounded-xl p-5 border border-gray-200">
                    <div class="flex items-start justify-between gap-4">
                        <div>
                            <p class="font-bold text-gray-900">${teacherName}</p>
                            <p class="text-sm text-gray-600">${teacherId}${email ? ` • ${email}` : ''}</p>
                            <div class="mt-2 flex flex-wrap gap-2">
                                <span class="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold">Domain: ${domain}</span>
                                <span class="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold">Pending</span>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="reviewTeacherVerificationRequest('${item._id}', 'approved')" class="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold">
                                Approve
                            </button>
                            <button onclick="reviewTeacherVerificationRequest('${item._id}', 'rejected')" class="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold">
                                Reject
                            </button>
                        </div>
                    </div>

                    <div class="mt-4">
                        <p class="text-sm font-semibold text-gray-700 mb-1">Credentials</p>
                        <p class="text-sm text-gray-700 whitespace-pre-wrap">${(item.credentials || '').replace(/</g, '&lt;')}</p>
                    </div>

                    ${docs.length ? `
                        <div class="mt-4">
                            <p class="text-sm font-semibold text-gray-700 mb-2">Documents</p>
                            <div class="flex flex-wrap gap-2">
                                ${docs.map((d, idx) => `<a href="${d}" target="_blank" rel="noopener" class="px-3 py-1 rounded bg-white border border-gray-200 text-xs text-brand-blue hover:underline">Doc ${idx + 1}</a>`).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error('Error loading verification queue:', e);
        if (list) list.innerHTML = '<p class="text-red-600 text-center py-8">Error loading verification requests.</p>';
    }
}

// Approve/reject verification request (Admin)
async function reviewTeacherVerificationRequest(verificationId, status) {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    const notes = prompt(`Enter notes for ${status === 'approved' ? 'approval' : 'rejection'} (optional):`) || '';

    try {
        const res = await fetch(`${API_BASE_URL}/admin/teacher-verifications/${verificationId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status, notes })
        });
        const data = await res.json();
        if (res.ok) {
            alert(data.message || 'Updated');
            loadAdminVerificationQueue();
            loadAdminUsers();
        } else {
            alert('Error: ' + (data.message || 'Failed to update'));
        }
    } catch (e) {
        console.error('Review verification error:', e);
        alert('Error updating verification');
    }
}

// Toggle teacher verification
async function toggleTeacherVerification(teacherId, verify) {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/teachers/${teacherId}/verify`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ is_verified: verify })
        });

        const data = await response.json();
        if (response.ok) {
            alert(data.message);
            loadAdminUsers(); // Refresh the list
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error toggling teacher verification:', error);
        alert('Error updating teacher verification');
    }
}

// Toggle user status
async function toggleUserStatus(userId, userType, activate) {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ is_active: activate, user_type: userType })
        });

        const data = await response.json();
        if (response.ok) {
            alert(data.message);
            loadAdminUsers(); // Refresh the list
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error toggling user status:', error);
        alert('Error updating user status');
    }
}

// Admin tab switching
document.addEventListener('DOMContentLoaded', function () {
    // Admin tab switching
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const tab = this.getAttribute('data-tab');

            // Update tab buttons
            document.querySelectorAll('.admin-tab-btn').forEach(b => {
                b.classList.remove('active', 'border-b-2', 'border-red-500', 'text-gray-900');
                b.classList.add('text-gray-600');
            });
            this.classList.add('active', 'border-b-2', 'border-red-500', 'text-gray-900');
            this.classList.remove('text-gray-600');

            // Hide all admin tabs
            document.querySelectorAll('.admin-tab-content').forEach(content => {
                content.classList.add('hidden');
            });

            // Show selected tab
            const targetTab = document.getElementById(`admin-${tab}-tab`);
            if (targetTab) {
                targetTab.classList.remove('hidden');
            }

            // Load data for specific tabs
            if (tab === 'users') {
                loadAdminUsers();
            } else if (tab === 'overview') {
                loadAdminOverview();
            } else if (tab === 'verifications') {
                loadAdminVerificationQueue();
            }
            // Add more tab loading logic as needed
        });
    });
});

