#!/usr/bin/env node

/**
 * InCreEdu - Password Hash Generator
 * Utility to generate bcrypt password hashes for database
 * Usage: node hash-password.js
 */

const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('\n╔════════════════════════════════════════╗');
console.log('║   InCreEdu Password Hash Generator    ║');
console.log('╚════════════════════════════════════════╝\n');

function askForPassword() {
    rl.question('Enter password to hash (or "exit" to quit): ', async (password) => {
        if (password.toLowerCase() === 'exit') {
            console.log('\n✓ Goodbye!\n');
            rl.close();
            return;
        }

        if (password.length < 4) {
            console.log('❌ Password must be at least 4 characters.\n');
            askForPassword();
            return;
        }

        try {
            console.log('\n⏳ Hashing password (this may take a moment)...\n');
            const hash = await bcrypt.hash(password, 10);
            
            console.log('✓ Hash generated successfully!\n');
            console.log('Password Hash:');
            console.log('─'.repeat(50));
            console.log(hash);
            console.log('─'.repeat(50));
            console.log('\nUse this hash in the database INSERT statement:\n');
            console.log(`INSERT INTO users (user_id, user_type, password_hash, email, full_name, institution)`);
            console.log(`VALUES ('LRN000000', 'learner', '${hash}', 'email@example.com', 'Name', 'University');\n`);
            
            askForPassword();
        } catch (error) {
            console.error('❌ Error hashing password:', error.message);
            askForPassword();
        }
    });
}

askForPassword();
