const API_BASE_URL = 'https://increedu-platform.onrender.com/api';

// Track current active tab
let activeTab = 'login-learner';

// Switch between Login and Register tabs (and subtypes)
function switchTab(tab) {
    activeTab = tab;
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const target = document.querySelector(`[data-tab="${tab}"]`);
    if (target) target.classList.add('active');
    
    // Hide all forms first
    document.querySelectorAll('.form-container').forEach(form => {
        form.classList.add('hidden');
    });
    
    // Show the requested form
    if (tab === 'login-learner') {
        document.getElementById('learner-form').classList.remove('hidden');
    } else if (tab === 'login-teacher') {
        document.getElementById('teacher-form').classList.remove('hidden');
    } else if (tab === 'login-admin') {
        document.getElementById('admin-form').classList.remove('hidden');
    } else if (tab === 'register') {
        document.getElementById('register-form').classList.remove('hidden');
    }
    
    // Clear previous inputs
    clearForm(tab);
}

// Clear form inputs
function clearForm(tab) {
    if (tab === 'login-learner') {
        document.getElementById('learner-id').value = '';
        document.getElementById('learner-password').value = '';
    } else if (tab === 'login-teacher') {
        document.getElementById('teacher-id').value = '';
        document.getElementById('teacher-password').value = '';
    } else if (tab === 'login-admin') {
        document.getElementById('admin-id').value = '';
        document.getElementById('admin-password').value = '';
    } else if (tab === 'register') {
        document.getElementById('register-type').value = 'learner';
        document.getElementById('register-id').value = '';
        document.getElementById('register-name').value = '';
        document.getElementById('register-email').value = '';
        document.getElementById('register-institution').value = '';
        document.getElementById('register-password').value = '';
        document.getElementById('register-confirm-password').value = '';
    }
}

// Toggle password visibility
function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    const isPassword = field.type === 'password';
    field.type = isPassword ? 'text' : 'password';
    
    // Update icon
    event.target.classList.toggle('fa-eye');
    event.target.classList.toggle('fa-eye-slash');
}

// Validate login credentials
function validateCredentials(id, password, userType) {
    const roleLabel = userType === 'learner' ? 'Learner' : userType === 'teacher' ? 'Teacher' : 'Admin';
    // Check ID format
    if (!id || id.trim().length < 5) {
        showError(userType, `Please enter a valid ${roleLabel} ID`);
        return false;
    }
    
    // Check password length
    if (!password || password.length < 4) {
        showError(userType, 'Password must be at least 4 characters');
        return false;
    }
    
    return true;
}

// Validate learner/teacher ID format
function isValidID(id, type) {
    if (type === 'learner') {
        return /^LRN\d{6}$|^\d{6,10}$/.test(id);
    } else {
        return /^TCH\d{6}$|^\d{6,10}$/.test(id);
    }
}

// Validate registration form
function validateRegistration(userId, fullName, email, password, confirmPassword) {
    // Validate User ID
    if (!userId || userId.length < 6) {
        showError('register', 'User ID must be at least 6 characters');
        return false;
    }

    // Validate Full Name
    if (!fullName || fullName.length < 3) {
        showError('register', 'Please enter your full name (minimum 3 characters)');
        return false;
    }

    // Validate Email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        showError('register', 'Please enter a valid email address');
        return false;
    }

    // Validate Password
    if (!password || password.length < 6) {
        showError('register', 'Password must be at least 6 characters');
        return false;
    }

    // Check password contains number
    if (!/\d/.test(password)) {
        showError('register', 'Password must contain at least one number');
        return false;
    }

    // Validate Password Confirmation
    if (password !== confirmPassword) {
        showError('register', 'Passwords do not match');
        return false;
    }

    return true;
}

// Show error message
function showError(userType, message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'mb-4 p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3 animate-slide-up';
    alertDiv.innerHTML = `
        <i class="fas fa-exclamation-circle text-red-600 text-lg"></i>
        <div>
            <p class="font-semibold text-red-800">${message}</p>
        </div>
        <button onclick="this.parentElement.remove()" class="ml-auto text-red-400 hover:text-red-600">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    let form;
    if (userType === 'learner') {
        form = document.getElementById('learner-form');
    } else if (userType === 'register') {
        form = document.getElementById('register-form');
    } else if (userType === 'admin') {
        form = document.getElementById('admin-form');
    } else {
        form = document.getElementById('teacher-form');
    }
    
    if (form) form.insertBefore(alertDiv, form.firstChild);
    
    // Auto remove after 5 seconds
    setTimeout(() => alertDiv.remove(), 5000);
}

// Show success message (optionally specify userType to target correct form)
function showSuccess(message, userType) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'mb-4 p-4 rounded-lg bg-green-50 border border-green-200 flex items-center gap-3 animate-slide-up';
    alertDiv.innerHTML = `
        <i class="fas fa-check-circle text-green-600 text-lg"></i>
        <div>
            <p class="font-semibold text-green-800">${message}</p>
        </div>
    `;
    
    let form;
    if (userType === 'teacher') form = document.getElementById('teacher-form');
    else if (userType === 'admin') form = document.getElementById('admin-form');
    else form = document.getElementById('learner-form');
    if (form) form.insertBefore(alertDiv, form.firstChild);
}

// Handle login form submission
async function handleLogin(event, userType) {
    event.preventDefault();
    
    // Get form inputs based on user type
    let idField, passwordField, form;
    if (userType === 'learner') {
        idField = 'learner-id';
        passwordField = 'learner-password';
        form = document.getElementById('learner-form');
    } else if (userType === 'teacher') {
        idField = 'teacher-id';
        passwordField = 'teacher-password';
        form = document.getElementById('teacher-form');
    } else if (userType === 'admin') {
        idField = 'admin-id';
        passwordField = 'admin-password';
        form = document.getElementById('admin-form');
    } else {
        showError(userType, 'Invalid user type');
        return;
    }
    
    const id = document.getElementById(idField).value.trim();
    const password = document.getElementById(passwordField).value.trim();
    
    // Validate inputs
    if (!validateCredentials(id, password, userType)) {
        return;
    }
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;

    // Disable button and show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Authenticating...';

    try {
        // Call login API
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: id,
                password: password,
                user_type: userType
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // Login failed
            showError(userType, data.message || 'Login failed. Please try again.');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
            return;
        }

        // Login successful
        const roleLabel = userType === 'learner' ? 'Learner' : userType === 'teacher' ? 'Teacher' : 'Admin';
        showSuccess(`${roleLabel} login successful! Redirecting...`, userType);
        
        // Store authentication info
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('userType', userType);
        sessionStorage.setItem('userId', data.user.user_id);
        sessionStorage.setItem('userName', data.user.full_name || `${roleLabel} ${data.user.user_id}`);
        sessionStorage.setItem('loginTime', new Date().toLocaleString());
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('userEmail', data.user.email || '');
        // Save verification status for teacher
        if (userType === 'teacher') {
            sessionStorage.setItem('isVerified', (data.is_verified === true).toString());
            if (!data.is_verified) {
                showError('teacher', 'Your account is pending verification. You can sign in and view limited features.');
            }
        }

        // Log successful login
        console.log(`✓ Login successful for ${userType}: ${data.user.user_id}`);

        // Redirect to main application
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);

    } catch (error) {
        console.error('Login error:', error);
        showError(userType, 'Connection error. Make sure the server is running.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

// Handle registration form submission
async function handleRegister(event) {
    event.preventDefault();
    
    // Get form inputs
    const userType = document.getElementById('register-type').value;
    const userId = document.getElementById('register-id').value.trim();
    const fullName = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const institution = document.getElementById('register-institution').value.trim();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    
    // Validate inputs
    if (!validateRegistration(userId, fullName, email, password, confirmPassword)) {
        return;
    }

    // Get the submit button
    const form = document.getElementById('register-form');
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;

    // Disable button and show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creating Account...';

    try {
        // Call registration API
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: userId,
                user_type: userType,
                full_name: fullName,
                email: email,
                institution: institution || null,
                password: password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // Registration failed
            showError('register', data.message || 'Registration failed. Please try again.');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
            return;
        }

        // Registration successful
        showSuccess(`✓ Account created successfully! Logging you in...`, userType);

        // Auto-login after registration
        setTimeout(() => {
            document.getElementById('register-id').value = userId;
            document.getElementById('register-password').value = '';
            
            // Simulate login for newly created account
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('userType', userType);
            sessionStorage.setItem('userId', userId);
            sessionStorage.setItem('userName', fullName);
            sessionStorage.setItem('loginTime', new Date().toLocaleString());
            sessionStorage.setItem('token', data.token);
            sessionStorage.setItem('userEmail', email);

            console.log(`✓ New account registered and logged in: ${userId}`);

            // Redirect to main application
            window.location.href = 'index.html';
        }, 1500);

    } catch (error) {
        console.error('Registration error:', error);
        showError('register', 'Connection error. Make sure the server is running.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

// Check if user is logged in (to be used in index.html)
function isUserLoggedIn() {
    return sessionStorage.getItem('isLoggedIn') === 'true';
}

// Get current user info
function getCurrentUser() {
    return {
        isLoggedIn: sessionStorage.getItem('isLoggedIn') === 'true',
        userType: sessionStorage.getItem('userType'),
        userId: sessionStorage.getItem('userId'),
        userName: sessionStorage.getItem('userName'),
        loginTime: sessionStorage.getItem('loginTime')
    };
}

// Handle logout
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        const userId = sessionStorage.getItem('userId');
        
        // Call logout API to record logout time
        if (userId) {
            fetch(`${API_BASE_URL}/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ user_id: userId })
            }).catch(error => console.log('Logout API call failed:', error));
        }

        sessionStorage.clear();
        console.log('✓ User logged out');
        window.location.href = 'login.html';
    }
}

// Modal functions
function showModal(type) {
    document.getElementById(`${type}-modal`).classList.remove('hidden');
}

function closeModal(type) {
    document.getElementById(`${type}-modal`).classList.add('hidden');
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    const forgotModal = document.getElementById('forgot-modal');
    const supportModal = document.getElementById('support-modal');
    
    if (event.target === forgotModal) {
        forgotModal.classList.add('hidden');
    }
    if (event.target === supportModal) {
        supportModal.classList.add('hidden');
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        document.getElementById('forgot-modal').classList.add('hidden');
        document.getElementById('support-modal').classList.add('hidden');
    }
});

// Demo login credentials info (for testing)
console.log(`
╔════════════════════════════════════════╗
║     InCreEdu Login Demo Credentials    ║
╠════════════════════════════════════════╣
║ Learner ID:  LRN123456  | Pass: demo123 ║
║ Teacher ID:  TCH789012  | Pass: demo123 ║
║ Admin ID:    ADM123456  | Pass: admin123 ║
║                                        ║
║ Or use any ID (6+ digits) with pass    ║
╚════════════════════════════════════════╝
`);

// Page load animations
window.addEventListener('load', function() {
    // Animate form elements on load
    document.querySelectorAll('input').forEach((input, index) => {
        input.style.animationDelay = `${index * 100}ms`;
    });
});

// Enter key to submit form
document.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        let form;
        if (activeTab === 'login-learner') {
            form = document.getElementById('learner-form');
        } else if (activeTab === 'login-teacher') {
            form = document.getElementById('teacher-form');
        } else if (activeTab === 'login-admin') {
            form = document.getElementById('admin-form');
        } else if (activeTab === 'register') {
            form = document.getElementById('register-form');
        }
        if (form) {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.click();
        }
    }
});
