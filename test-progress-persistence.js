#!/usr/bin/env node

/**
 * Progress Persistence Test Suite
 * Tests the progress save/load and auto-resume functionality
 * Usage: node test-progress-persistence.js
 */

const http = require('http');
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

// Color codes
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(color, message) {
    console.log(`${color}${message}${colors.reset}`);
}

async function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, API_BASE_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        body: body ? JSON.parse(body) : null
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        body: body
                    });
                }
            });
        });

        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function testProgressPersistence() {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   Progress Persistence Test Suite      ║');
    console.log('╚════════════════════════════════════════╝\n');

    try {
        // Step 1: Register a new user
        log(colors.cyan, '📝 Step 1: User Registration');
        const testUserId = `test_user_${Date.now()}`;
        const registerRes = await makeRequest('POST', '/api/register', {
            user_id: testUserId,
            full_name: 'Test User Progress',
            email: `test${Date.now()}@example.com`,
            password: 'TestPass123!',
            user_type: 'learner',
            institution: 'Test University'
        });

        if (![200, 201].includes(registerRes.status)) {
            log(colors.red, `✗ Registration failed: ${registerRes.status}`);
            return;
        }
        log(colors.green, `✓ User registered: ${testUserId}\n`);

        // Step 2: Login
        log(colors.cyan, '🔓 Step 2: User Login');
        const loginRes = await makeRequest('POST', '/api/login', {
            user_id: testUserId,
            password: 'TestPass123!',
            user_type: 'learner'
        });

        if (loginRes.status !== 200) {
            log(colors.red, `✗ Login failed: ${loginRes.status}`);
            return;
        }
        log(colors.green, `✓ Login successful\n`);

        // Step 3: Save progress (simulate completing some tasks)
        log(colors.cyan, '💾 Step 3: Save Initial Progress');
        const progressSaveRes = await makeRequest('POST', '/api/save-progress', {
            user_id: testUserId,
            selected_domain: 'tech',
            selected_role: 'Software Developer',
            current_level: 2,
            completed_tasks: ['task-1-1', 'task-1-2', 'task-2-1'],
            total_tasks: 15,
            progress_percentage: 20
        });

        if (progressSaveRes.status !== 200) {
            log(colors.red, `✗ Progress save failed: ${progressSaveRes.status}`);
            return;
        }
        log(colors.green, `✓ Progress saved: Level 2, 3 tasks completed\n`);

        // Step 4: Verify progress was saved by loading it
        log(colors.cyan, '📥 Step 4: Load Progress (First Time)');
        const progressLoadRes1 = await makeRequest('GET', `/api/user-progress/${testUserId}`);

        if (progressLoadRes1.status !== 200 || !progressLoadRes1.body.data) {
            log(colors.red, `✗ Failed to load progress: ${progressLoadRes1.status}`);
            return;
        }

        const loadedProgress1 = progressLoadRes1.body.data;
        log(colors.green, `✓ Progress loaded successfully`);
        log(colors.green, `  Domain: ${loadedProgress1.selected_domain}`);
        log(colors.green, `  Role: ${loadedProgress1.selected_role}`);
        log(colors.green, `  Current Level: ${loadedProgress1.current_level}`);
        log(colors.green, `  Completed Tasks: ${loadedProgress1.completed_tasks.length}`);
        log(colors.green, `  Progress: ${loadedProgress1.progress_percentage}%\n`);

        // Step 5: Simulate logout
        log(colors.cyan, '🚪 Step 5: Logout');
        const logoutRes = await makeRequest('POST', '/api/logout', {
            user_id: testUserId,
            token: 'demo-token'
        });

        if (logoutRes.status === 200) {
            log(colors.green, `✓ Logout successful\n`);
        } else {
            log(colors.yellow, `⚠ Logout returned: ${logoutRes.status}\n`);
        }

        // Step 6: Login again - This should trigger auto-resume
        log(colors.cyan, '🔓 Step 6: Re-login (Should auto-resume)');
        const reloginRes = await makeRequest('POST', '/api/login', {
            user_id: testUserId,
            password: 'TestPass123!',
            user_type: 'learner'
        });

        if (reloginRes.status !== 200) {
            log(colors.red, `✗ Re-login failed: ${reloginRes.status}`);
            return;
        }
        log(colors.green, `✓ Re-login successful\n`);

        // Step 7: Load progress again (should be identical)
        log(colors.cyan, '📥 Step 7: Load Progress (After Re-login)');
        const progressLoadRes2 = await makeRequest('GET', `/api/user-progress/${testUserId}`);

        if (progressLoadRes2.status !== 200 || !progressLoadRes2.body.data) {
            log(colors.red, `✗ Failed to load progress on re-login: ${progressLoadRes2.status}`);
            return;
        }

        const loadedProgress2 = progressLoadRes2.body.data;
        log(colors.green, `✓ Progress reloaded after re-login`);
        log(colors.green, `  Domain: ${loadedProgress2.selected_domain}`);
        log(colors.green, `  Role: ${loadedProgress2.selected_role}`);
        log(colors.green, `  Current Level: ${loadedProgress2.current_level}`);
        log(colors.green, `  Completed Tasks: ${loadedProgress2.completed_tasks.length}`);
        log(colors.green, `  Progress: ${loadedProgress2.progress_percentage}%\n`);

        // Step 8: Verify data consistency
        log(colors.cyan, '🔍 Step 8: Data Consistency Check');
        let consistencyPassed = true;

        if (loadedProgress1.selected_domain !== loadedProgress2.selected_domain) {
            log(colors.red, `✗ Domain mismatch: ${loadedProgress1.selected_domain} → ${loadedProgress2.selected_domain}`);
            consistencyPassed = false;
        } else {
            log(colors.green, `✓ Domain consistent`);
        }

        if (loadedProgress1.selected_role !== loadedProgress2.selected_role) {
            log(colors.red, `✗ Role mismatch: ${loadedProgress1.selected_role} → ${loadedProgress2.selected_role}`);
            consistencyPassed = false;
        } else {
            log(colors.green, `✓ Role consistent`);
        }

        if (loadedProgress1.current_level !== loadedProgress2.current_level) {
            log(colors.red, `✗ Level mismatch: ${loadedProgress1.current_level} → ${loadedProgress2.current_level}`);
            consistencyPassed = false;
        } else {
            log(colors.green, `✓ Level consistent`);
        }

        if (JSON.stringify(loadedProgress1.completed_tasks) !== JSON.stringify(loadedProgress2.completed_tasks)) {
            log(colors.red, `✗ Completed tasks mismatch`);
            consistencyPassed = false;
        } else {
            log(colors.green, `✓ Completed tasks consistent`);
        }

        log('');

        // Step 9: Update progress
        log(colors.cyan, '🔄 Step 9: Update Progress (Add More Tasks)');
        const progressUpdateRes = await makeRequest('POST', '/api/save-progress', {
            user_id: testUserId,
            selected_domain: 'tech',
            selected_role: 'Software Developer',
            current_level: 3,
            completed_tasks: ['task-1-1', 'task-1-2', 'task-2-1', 'task-2-2', 'task-3-1'],
            total_tasks: 15,
            progress_percentage: 33
        });

        if (progressUpdateRes.status !== 200) {
            log(colors.red, `✗ Progress update failed: ${progressUpdateRes.status}`);
            return;
        }
        log(colors.green, `✓ Progress updated: Level 3, 5 tasks completed\n`);

        // Step 10: Verify update
        log(colors.cyan, '✔️ Step 10: Verify Update');
        const progressLoadRes3 = await makeRequest('GET', `/api/user-progress/${testUserId}`);

        if (progressLoadRes3.status === 200 && progressLoadRes3.body.data) {
            const loadedProgress3 = progressLoadRes3.body.data;
            if (loadedProgress3.current_level === 3 && loadedProgress3.completed_tasks.length === 5) {
                log(colors.green, `✓ Update verified: Level 3, 5 tasks\n`);
            } else {
                log(colors.red, `✗ Update verification failed\n`);
            }
        }

        // Final Summary
        log(colors.blue, '╔════════════════════════════════════════╗');
        if (consistencyPassed) {
            log(colors.green, '║  ✓ ALL TESTS PASSED - PERSISTENCE OK  ║');
        } else {
            log(colors.red, '║  ✗ SOME TESTS FAILED                  ║');
        }
        log(colors.blue, '╚════════════════════════════════════════╝\n');

    } catch (error) {
        log(colors.red, `\n❌ Error: ${error.message}`);
        log(colors.yellow, '\nMake sure the server is running: node server.js\n');
    }
}

testProgressPersistence();
