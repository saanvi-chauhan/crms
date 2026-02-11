require('dotenv').config();
const mysql = require('mysql2/promise');

async function updatePasswords() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT
        });

        console.log('✅ Connected to database\n');

        // Update all passwords to plain text "secret123"
        const [result] = await connection.execute(
            "UPDATE Users SET password_hash = 'secret123'"
        );

        console.log(`✅ Updated ${result.affectedRows} user passwords to "secret123"`);
        console.log('\n⚠️  WARNING: Passwords are now stored in PLAIN TEXT!');
        console.log('This is NOT secure and should ONLY be used for development/testing.\n');

        await connection.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

updatePasswords();
