// Test Course Upload and Management System
const API_BASE_URL = 'http://localhost:5000/api';

let testResults = [];

async function makeRequest(method, endpoint, body = null, token = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };
    
    if (body) options.body = JSON.stringify(body);
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const data = await response.json();
        return { status: response.status, data };
    } catch (error) {
        return { status: 0, error: error.message };
    }
}

async function runTests() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║     COURSE UPLOAD & MANAGEMENT SYSTEM TESTS                ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    let teacherToken = null;
    let learnerToken = null;
    let courseId = null;

    // Test 1: Teacher Login
    console.log('Test 1: Teacher Login');
    const loginRes = await makeRequest('POST', '/login', {
        user_id: 'TCH789012',
        password: 'demo123',
        user_type: 'teacher'
    });
    
    if (loginRes.status === 200) {
        teacherToken = loginRes.data.token;
        testResults.push({ test: 'Teacher Login', status: '✓ PASS', details: 'Token obtained' });
        console.log('✓ PASS: Teacher logged in successfully\n');
    } else {
        testResults.push({ test: 'Teacher Login', status: '✗ FAIL', details: loginRes.data.message });
        console.log(`✗ FAIL: ${loginRes.data.message}\n`);
        return; // Cannot continue without teacher token
    }

    // Test 2: Upload Course
    console.log('Test 2: Upload New Course');
    const courseData = {
        title: 'Advanced JavaScript Concepts',
        domain: 'Technology',
        role: 'Web Developer',
        level: 3,
        video_url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
        thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
        duration_minutes: 45,
        description: 'Master advanced JavaScript techniques including closures, async/await, and modern ES6+ features.',
        tags: ['javascript', 'web-development', 'es6']
    };

    const uploadRes = await makeRequest('POST', '/teacher/courses', courseData, teacherToken);
    
    if (uploadRes.status === 201) {
        courseId = uploadRes.data.course._id;
        testResults.push({ test: 'Upload Course', status: '✓ PASS', details: `Course ID: ${courseId}` });
        console.log(`✓ PASS: Course uploaded successfully\nCourse ID: ${courseId}\n`);
    } else {
        testResults.push({ test: 'Upload Course', status: '✗ FAIL', details: uploadRes.data.message });
        console.log(`✗ FAIL: ${uploadRes.data.message}\n`);
    }

    // Test 3: Get Teacher's Courses
    console.log('Test 3: Get Teacher\'s Courses');
    const getCoursesRes = await makeRequest('GET', '/teacher/courses', null, teacherToken);
    
    if (getCoursesRes.status === 200 && Array.isArray(getCoursesRes.data.courses)) {
        testResults.push({ test: 'Get Courses', status: '✓ PASS', details: `${getCoursesRes.data.count} courses found` });
        console.log(`✓ PASS: Retrieved ${getCoursesRes.data.count} courses\n`);
    } else {
        testResults.push({ test: 'Get Courses', status: '✗ FAIL', details: 'Failed to retrieve courses' });
        console.log('✗ FAIL: Could not retrieve courses\n');
    }

    // Test 4: Get Single Course Details
    if (courseId) {
        console.log('Test 4: Get Course Details');
        const detailRes = await makeRequest('GET', `/teacher/courses/${courseId}`, null, teacherToken);
        
        if (detailRes.status === 200) {
            testResults.push({ test: 'Get Course Details', status: '✓ PASS', details: detailRes.data.course.title });
            console.log(`✓ PASS: Retrieved course: ${detailRes.data.course.title}\n`);
        } else {
            testResults.push({ test: 'Get Course Details', status: '✗ FAIL', details: detailRes.data.message });
            console.log(`✗ FAIL: ${detailRes.data.message}\n`);
        }

        // Test 5: Update Course
        console.log('Test 5: Update Course');
        const updateData = {
            title: 'Advanced JavaScript Concepts - Updated',
            description: 'Updated description with more advanced topics',
            is_published: true
        };

        const updateRes = await makeRequest('PUT', `/teacher/courses/${courseId}`, updateData, teacherToken);
        
        if (updateRes.status === 200) {
            testResults.push({ test: 'Update Course', status: '✓ PASS', details: 'Course updated' });
            console.log('✓ PASS: Course updated successfully\n');
        } else {
            testResults.push({ test: 'Update Course', status: '✗ FAIL', details: updateRes.data.message });
            console.log(`✗ FAIL: ${updateRes.data.message}\n`);
        }

        // Test 6: View Course (Public - Track View)
        console.log('Test 6: Track Course View');
        const viewRes = await makeRequest('POST', `/learner/courses/${courseId}/view`);
        
        if (viewRes.status === 200) {
            testResults.push({ test: 'Track View', status: '✓ PASS', details: `Views: ${viewRes.data.views}` });
            console.log(`✓ PASS: Course view tracked. Total views: ${viewRes.data.views}\n`);
        } else {
            testResults.push({ test: 'Track View', status: '✗ FAIL', details: 'Failed to track view' });
            console.log('✗ FAIL: Could not track view\n');
        }

        // Test 7: Get Course Analytics
        console.log('Test 7: Get Course Analytics');
        const analyticsRes = await makeRequest('GET', `/teacher/courses/${courseId}/analytics`, null, teacherToken);
        
        if (analyticsRes.status === 200) {
            const analytics = analyticsRes.data.analytics;
            testResults.push({ 
                test: 'Get Analytics', 
                status: '✓ PASS', 
                details: `Views: ${analytics.total_views}, Enrolled: ${analytics.total_enrolled}`
            });
            console.log(`✓ PASS: Analytics retrieved\nViews: ${analytics.total_views}\nEnrolled: ${analytics.total_enrolled}\n`);
        } else {
            testResults.push({ test: 'Get Analytics', status: '✗ FAIL', details: analyticsRes.data.message });
            console.log(`✗ FAIL: ${analyticsRes.data.message}\n`);
        }
    }

    // Test 8: Learner Login
    console.log('Test 8: Learner Login');
    const learnerLoginRes = await makeRequest('POST', '/login', {
        user_id: 'LRN123456',
        password: 'demo123',
        user_type: 'learner'
    });
    
    if (learnerLoginRes.status === 200) {
        learnerToken = learnerLoginRes.data.token;
        testResults.push({ test: 'Learner Login', status: '✓ PASS', details: 'Token obtained' });
        console.log('✓ PASS: Learner logged in successfully\n');
    } else {
        testResults.push({ test: 'Learner Login', status: '✗ FAIL', details: learnerLoginRes.data.message });
        console.log(`✗ FAIL: ${learnerLoginRes.data.message}\n`);
    }

    // Test 9: Get Available Courses (Learner)
    if (learnerToken && courseId) {
        console.log('Test 9: Get Available Courses for Learner');
        const availableRes = await makeRequest('GET', '/learner/courses', null, learnerToken);
        
        if (availableRes.status === 200) {
            const count = availableRes.data.courses ? availableRes.data.courses.length : 0;
            testResults.push({ test: 'Get Available Courses', status: '✓ PASS', details: `${count} courses available` });
            console.log(`✓ PASS: Retrieved ${count} available courses for learner\n`);
        } else {
            testResults.push({ test: 'Get Available Courses', status: '✗ FAIL', details: availableRes.data.message });
            console.log(`✗ FAIL: ${availableRes.data.message}\n`);
        }

        // Test 10: Enroll in Course
        console.log('Test 10: Enroll in Course');
        const enrollRes = await makeRequest('POST', `/learner/courses/${courseId}/enroll`, {}, learnerToken);
        
        if (enrollRes.status === 200) {
            testResults.push({ test: 'Enroll Course', status: '✓ PASS', details: enrollRes.data.course.title });
            console.log(`✓ PASS: Learner enrolled in: ${enrollRes.data.course.title}\n`);
        } else {
            testResults.push({ test: 'Enroll Course', status: '✗ FAIL', details: enrollRes.data.message });
            console.log(`✗ FAIL: ${enrollRes.data.message}\n`);
        }

        // Test 11: Mark Course as Completed
        if (enrollRes.status === 200) {
            console.log('Test 11: Mark Course as Completed');
            const completeRes = await makeRequest('POST', `/learner/courses/${courseId}/complete`, {
                rating: 5,
                review: 'Excellent course! Very comprehensive and well-explained.'
            }, learnerToken);
            
            if (completeRes.status === 200) {
                testResults.push({ test: 'Complete Course', status: '✓ PASS', details: 'Course marked as completed' });
                console.log('✓ PASS: Course marked as completed with rating\n');
            } else {
                testResults.push({ test: 'Complete Course', status: '✗ FAIL', details: completeRes.data.message });
                console.log(`✗ FAIL: ${completeRes.data.message}\n`);
            }
        }
    }

    // Test 12: Get Available Courses (Public)
    console.log('Test 12: Get Available Courses (Public)');
    const publicRes = await makeRequest('GET', '/courses/available?domain=Technology&level=3');
    
    if (publicRes.status === 200) {
        const count = publicRes.data.courses ? publicRes.data.courses.length : 0;
        testResults.push({ test: 'Get Public Courses', status: '✓ PASS', details: `${count} courses` });
        console.log(`✓ PASS: Retrieved ${count} public courses\n`);
    } else {
        testResults.push({ test: 'Get Public Courses', status: '✗ FAIL', details: publicRes.data.message });
        console.log(`✗ FAIL: ${publicRes.data.message}\n`);
    }

    // Test 13: Delete Course
    if (courseId && teacherToken) {
        console.log('Test 13: Delete Course');
        const deleteRes = await makeRequest('DELETE', `/teacher/courses/${courseId}`, null, teacherToken);
        
        if (deleteRes.status === 200) {
            testResults.push({ test: 'Delete Course', status: '✓ PASS', details: 'Course deleted' });
            console.log('✓ PASS: Course deleted successfully\n');
        } else {
            testResults.push({ test: 'Delete Course', status: '✗ FAIL', details: deleteRes.data.message });
            console.log(`✗ FAIL: ${deleteRes.data.message}\n`);
        }
    }

    // Print Summary
    printSummary();
}

function printSummary() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║               TEST RESULTS SUMMARY                          ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    const passed = testResults.filter(r => r.status.includes('PASS')).length;
    const failed = testResults.filter(r => r.status.includes('FAIL')).length;
    
    console.log(testResults.map((r, i) => {
        const icon = r.status.includes('PASS') ? '✓' : '✗';
        return `${i + 1}. [${icon}] ${r.test}: ${r.details}`;
    }).join('\n'));
    
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`Total Tests: ${testResults.length} | Passed: ${passed} | Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / testResults.length) * 100).toFixed(1)}%`);
    console.log(`${'─'.repeat(60)}\n`);
}

// Run tests
runTests();
