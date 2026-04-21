const API_BASE_URL = (process.env.API_BASE_URL || 'http://localhost:5000') + '/api';
const fs = require('fs');
const path = require('path');

async function runTests() {
    console.log('--- Course System Verification (V2) ---');

    // 1. Login as teacher
    console.log('\n1. Logging in as Teacher...');
    const loginRes = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: 'TEACHER123',
            password: 'demo123',
            user_type: 'teacher'
        })
    });
    
    const loginData = await loginRes.json();
    if (!loginRes.ok) {
        console.error('✗ Login failed:', loginData.message);
        return;
    }
    const token = loginData.token;
    console.log('✓ Teacher logged in');

    // 2. Upload a new course with video
    console.log('\n2. Uploading a new course...');
    const formData = new FormData();
    formData.append('title', 'Test Subtopic 1');
    formData.append('domain', 'Technology');
    formData.append('role', 'Web Developer');
    formData.append('level', '1');
    formData.append('description', 'A test course for verification');
    
    const videoBlob = new Blob([fs.readFileSync('test_video.mp4')], { type: 'video/mp4' });
    formData.append('video_file', videoBlob, 'test_video.mp4');

    const uploadRes = await fetch(`${API_BASE_URL}/teacher/courses`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });

    const uploadData = await uploadRes.json();
    if (!uploadRes.ok) {
        console.error('✗ Upload failed:', uploadData.message);
        return;
    }
    const courseId = uploadData.course._id;
    console.log('✓ Course uploaded. ID:', courseId);

    // 3. Update metadata (no video)
    console.log('\n3. Updating course metadata...');
    const updateData = new FormData();
    updateData.append('title', 'Updated Subtopic Title');
    updateData.append('description', 'Updated description content');
    
    const updateRes = await fetch(`${API_BASE_URL}/teacher/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: updateData
    });

    const updateResData = await updateRes.json();
    if (!updateRes.ok) {
        console.error('✗ Update failed:', updateResData.message);
    } else {
        console.log('✓ Metadata updated. New title:', updateResData.course.title);
    }

    // 4. Update with a new video
    console.log('\n4. Updating course with a new video...');
    const videoUpdateData = new FormData();
    videoUpdateData.append('description', 'Description after video update');
    
    // Create another dummy video
    fs.writeFileSync('test_video_v2.mp4', Buffer.from([0,0,0,32,102,116,121,112,109,112,52,50,0,0,0,0,109,112,52,50,105,115,111,109,49,50,51]));
    const videoBlobV2 = new Blob([fs.readFileSync('test_video_v2.mp4')], { type: 'video/mp4' });
    videoUpdateData.append('video_file', videoBlobV2, 'test_video_v2.mp4');

    const videoUpdateRes = await fetch(`${API_BASE_URL}/teacher/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: videoUpdateData
    });

    const videoUpdateResData = await videoUpdateRes.json();
    if (!videoUpdateRes.ok) {
        console.error('✗ Video update failed:', videoUpdateResData.message);
    } else {
        console.log('✓ Video updated. New URL:', videoUpdateResData.course.video_url);
        if (videoUpdateResData.course.video_url.includes('course-')) {
             console.log('✓ Video filename contains timestamp - Multer rename confirmed');
        }
    }

    console.log('\n--- Verification Completed ---');
}

runTests().catch(err => console.error('Unexpected error:', err));
