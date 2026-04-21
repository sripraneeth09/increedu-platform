require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI).then(async () => {
    const hashedPassword = bcrypt.hashSync('demo123', 10);
    await mongoose.connection.collection('teacher_info').updateOne(
        { user_id: 'TEACHER123' },
        { 
            $set: { 
                password_hash: hashedPassword, 
                is_verified: true, 
                assigned_domains: ['Technology'],
                email: 'teacher123@test.com',
                full_name: 'Test Teacher'
            } 
        },
        { upsert: true }
    );
    console.log('✓ Teacher TEACHER123 updated/created with password demo123');
    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});
