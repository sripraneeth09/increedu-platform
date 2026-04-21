#!/usr/bin/env node

/**
 * InCreEdu - API Test Suite
 * Tests the Express.js backend API endpoints
 * Usage: node test-api.js
 */

const http = require('http');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

// Color codes for terminal output
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

async function makeRequest(method, path, data = null, extraHeaders = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, API_BASE_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: Object.assign({
                'Content-Type': 'application/json'
            }, extraHeaders)
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: body ? JSON.parse(body) : null
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
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

async function testAPI() {
    log(colors.blue, '\n╔════════════════════════════════════════╗');
    log(colors.blue, '║   InCreEdu API Test Suite              ║');
    log(colors.blue, '╚════════════════════════════════════════╝\n');

    try {
        // Test 1: Health Check
        log(colors.cyan, '📋 Test 1: Health Check (GET /api/health)');
        const health = await makeRequest('GET', '/api/health');
        if (health.status === 200) {
            log(colors.green, `✓ Server is healthy`);
            log(colors.green, `  Database: ${health.body.database}\n`);
        } else {
            log(colors.red, `✗ Health check failed: ${health.status}\n`);
        }

        // Test 2: Learner Login (Valid)
        log(colors.cyan, '📋 Test 2: Learner Login (Valid Credentials)');
        const learnerLogin = await makeRequest('POST', '/api/login', {
            user_id: 'LRN123456',
            password: 'demo123',
            user_type: 'learner'
        });
        if (learnerLogin.status === 200) {
            log(colors.green, `✓ Login successful`);
            log(colors.green, `  Token received: ${learnerLogin.body.token.substring(0, 20)}...`);
            log(colors.green, `  User: ${learnerLogin.body.user.full_name}\n`);
            var learnerToken = learnerLogin.body.token;
        } else {
            log(colors.red, `✗ Login failed: ${learnerLogin.status} - ${learnerLogin.body?.message}\n`);
        }

        // Test 3: Learner Login (Invalid)
        log(colors.cyan, '📋 Test 3: Learner Login (Invalid Credentials)');
        const invalidLogin = await makeRequest('POST', '/api/login', {
            user_id: 'LRN123456',
            password: 'wrongpassword',
            user_type: 'learner'
        });
        if (invalidLogin.status === 401) {
            log(colors.green, `✓ Invalid credentials rejected properly\n`);
        } else {
            log(colors.red, `✗ Expected 401, got ${invalidLogin.status}\n`);
        }

        // Test 4: Verify Token
        if (learnerToken) {
            log(colors.cyan, '📋 Test 4: Verify Token');
            const verifyToken = await makeRequest('POST', '/api/verify-token', {
                token: learnerToken
            });
            if (verifyToken.status === 200) {
                log(colors.green, `✓ Token verified successfully`);
                log(colors.green, `  User ID: ${verifyToken.body.user?.user_id}`);
                log(colors.green, `  Type: ${verifyToken.body.user?.user_type}\n`);
            } else {
                log(colors.red, `✗ Token verification failed: ${verifyToken.status}\n`);
            }

            // Test 5: Teacher video upload (requires teacher login later)
            log(colors.cyan, '📋 Test 5: Teacher Upload Video');
            // first login as teacher
            const teacherLogin = await makeRequest('POST', '/api/login', {
                user_id: 'TCH789012',
                password: 'demo123',
                user_type: 'teacher'
            });
            if (teacherLogin.status === 200) {
                const teacherToken = teacherLogin.body.token;
                const uploadRes = await makeRequest('POST', '/api/teacher/upload-video', {
                    domain: 'tech',
                    level: 1,
                    url: 'https://example.com/video'
                }, { Authorization: `Bearer ${teacherToken}` });
                if (uploadRes.status === 200) {
                    log(colors.green, '✓ Teacher video upload endpoint accepted request');
                } else {
                    log(colors.yellow, `⚠ Upload returned ${uploadRes.status}`);
                }
            } else {
                log(colors.yellow, '⚠ Skipping teacher upload test (login failed)');
            }

            // Test 5: Get User Profile
            log(colors.cyan, '📋 Test 5: Get User Profile');
            const userProfile = await makeRequest('GET', `/api/user/LRN123456`, null, { Authorization: `Bearer ${learnerToken}` });
            if (userProfile.status === 200) {
                log(colors.green, `✓ User profile retrieved`);
                log(colors.green, `  Email: ${userProfile.body.email}`);
                log(colors.green, `  Institution: ${userProfile.body.institution}\n`);
            } else {
                log(colors.red, `✗ Failed to get profile: ${userProfile.status}\n`);
            }

            // Test 6: Login History
            log(colors.cyan, '📋 Test 6: Login History');
            const loginHistory = await makeRequest('GET', `/api/login-history/LRN123456`, null, { Authorization: `Bearer ${learnerToken}` });
            if (loginHistory.status === 200) {
                log(colors.green, `✓ Login history retrieved`);
                const count = Array.isArray(loginHistory.body?.login_history)
                    ? loginHistory.body.login_history.length
                    : 0;
                log(colors.green, `  Records: ${count}\n`);
            } else {
                log(colors.red, `✗ Failed to get history: ${loginHistory.status}\n`);
            }

            // Test 7: Logout
            log(colors.cyan, '📋 Test 7: Logout (POST /api/logout)');
            const logout = await makeRequest('POST', '/api/logout', {
                user_id: 'LRN123456',
                token: learnerToken
            });
            if (logout.status === 200) {
                log(colors.green, `✓ Logout recorded successfully\n`);
            } else {
                log(colors.red, `✗ Logout failed: ${logout.status}\n`);
            }
        }

        // Test 8: Teacher Login
        log(colors.cyan, '📋 Test 8: Teacher Login');
        const teacherLogin = await makeRequest('POST', '/api/login', {
            user_id: 'TCH789012',
            password: 'demo123',
            user_type: 'teacher'
        });
        if (teacherLogin.status === 200) {
            log(colors.green, `✓ Teacher login successful`);
            log(colors.green, `  User: ${teacherLogin.body.user.full_name}\n`);
        } else {
            log(colors.red, `✗ Teacher login failed: ${teacherLogin.status}\n`);
        }

        log(colors.green, '✓ All tests completed!\n');

    } catch (error) {
        log(colors.red, `\n❌ Error: ${error.message}`);
        log(colors.yellow, '\nMake sure the server is running: node server.js\n');
    }
}

testAPI();
