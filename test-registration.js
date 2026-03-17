#!/usr/bin/env node

/**
 * Dynamic Registration Test
 * Tests the new user registration API
 */

const http = require('http');

const API_BASE_URL = 'http://localhost:5000';

function makeRequest(method, path, data = null) {
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

async function testRegistration() {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   InCreEdu Registration API Test       ║');
    console.log('╚════════════════════════════════════════╝\n');

    try {
        // Test 1: Health Check
        console.log('📋 Test 1: Health Check');
        const health = await makeRequest('GET', '/api/health');
        if (health.status === 200) {
            console.log('✓ Server is running\n');
        } else {
            console.log('✗ Server health check failed\n');
            return;
        }

        // Test 2: Valid Registration
        console.log('📋 Test 2: Register New User (Valid)');
        const register1 = await makeRequest('POST', '/api/register', {
            user_id: 'NEWLRN' + Date.now().toString().slice(-6),
            user_type: 'learner',
            full_name: 'Test User',
            email: 'testuser' + Date.now() + '@example.com',
            institution: 'Test University',
            password: 'test12345'
        });

        console.log('Status:', register1.status);
        if (register1.status === 201) {
            console.log('✓ Registration successful');
            console.log('  User ID:', register1.body.user.user_id);
            console.log('  Email:', register1.body.user.email);
            console.log('  Token received:', register1.body.token.substring(0, 20) + '...\n');
        } else {
            console.log('✗ Registration failed:', register1.body.message + '\n');
        }

        // Test 3: Duplicate User ID
        console.log('📋 Test 3: Register with Duplicate User ID');
        const register2 = await makeRequest('POST', '/api/register', {
            user_id: 'LRN123456',  // Same as existing user
            user_type: 'learner',
            full_name: 'Another User',
            email: 'another@example.com',
            institution: 'Test University',
            password: 'test12345'
        });

        if (register2.status === 409) {
            console.log('✓ Correctly rejected duplicate User ID');
            console.log('  Message:', register2.body.message + '\n');
        } else {
            console.log('✗ Should have rejected duplicate User ID (got ' + register2.status + ')\n');
        }

        // Test 4: Weak Password
        console.log('📋 Test 4: Register with Weak Password');
        const register3 = await makeRequest('POST', '/api/register', {
            user_id: 'NEWUSER001',
            user_type: 'learner',
            full_name: 'Weak Pass User',
            email: 'weakpass@example.com',
            institution: 'Test University',
            password: 'nodigits'  // No number
        });

        if (register3.status === 400) {
            console.log('✓ Correctly rejected weak password');
            console.log('  Message:', register3.body.message + '\n');
        } else {
            console.log('✗ Should have rejected weak password (got ' + register3.status + ')\n');
        }

        // Test 5: Invalid Email
        console.log('📋 Test 5: Register with Invalid Email');
        const register4 = await makeRequest('POST', '/api/register', {
            user_id: 'NEWEMAIL001',
            user_type: 'learner',
            full_name: 'Bad Email User',
            email: 'notanemail',  // Invalid
            institution: 'Test University',
            password: 'password123'
        });

        if (register4.status === 400) {
            console.log('✓ Correctly rejected invalid email');
            console.log('  Message:', register4.body.message + '\n');
        } else {
            console.log('✗ Should have rejected invalid email (got ' + register4.status + ')\n');
        }

        // Test 6: Short User ID
        console.log('📋 Test 6: Register with Short User ID');
        const register5 = await makeRequest('POST', '/api/register', {
            user_id: 'LRN',  // Too short
            user_type: 'learner',
            full_name: 'Short ID User',
            email: 'shortid@example.com',
            institution: 'Test University',
            password: 'password123'
        });

        if (register5.status === 400) {
            console.log('✓ Correctly rejected short User ID');
            console.log('  Message:', register5.body.message + '\n');
        } else {
            console.log('✗ Should have rejected short User ID (got ' + register5.status + ')\n');
        }

        // Test 7: Register Teacher
        console.log('📋 Test 7: Register New Teacher');
        const register6 = await makeRequest('POST', '/api/register', {
            user_id: 'TEACHER' + Date.now().toString().slice(-5),
            user_type: 'teacher',
            full_name: 'Prof. New Teacher',
            email: 'prof.new' + Date.now() + '@example.com',
            institution: 'New University',
            password: 'teach12345'
        });

        if (register6.status === 201) {
            console.log('✓ Teacher registration successful');
            console.log('  User ID:', register6.body.user.user_id);
            console.log('  Type:', register6.body.user.user_type + '\n');
        } else {
            console.log('✗ Teacher registration failed:', register6.body.message + '\n');
        }

        console.log('✓ All registration tests completed!\n');

    } catch (error) {
        console.log('❌ Error:', error.message);
        console.log('\nMake sure the server is running: npm start\n');
    }
}

testRegistration();
