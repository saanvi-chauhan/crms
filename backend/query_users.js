require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');

async function queryUsers() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT
        });

        console.log('✅ Connected to database\n');

        const [rows] = await connection.execute(`
      SELECT u.user_id, u.username, u.password_hash, r.role_name, ps.name as staff_name, 
             ps.pol_rank, ps.badge_number, u.created_at, u.last_login
      FROM Users u
      JOIN Roles r ON u.role_id = r.role_id
      JOIN Police_Staff ps ON u.staff_id = ps.staff_id
    `);

        let output = '=== ALL USERS IN CRMS DATABASE ===\n\n';

        if (rows.length === 0) {
            output += 'No users found in the database.\n';
        } else {
            rows.forEach((user, index) => {
                output += `User ${index + 1}:\n`;
                output += `  User ID: ${user.user_id}\n`;
                output += `  Username: ${user.username}\n`;
                output += `  Password Hash: ${user.password_hash}\n`;
                output += `  Role: ${user.role_name}\n`;
                output += `  Staff Name: ${user.staff_name}\n`;
                output += `  Rank: ${user.pol_rank}\n`;
                output += `  Badge Number: ${user.badge_number}\n`;
                output += `  Created: ${user.created_at}\n`;
                output += `  Last Login: ${user.last_login || 'Never'}\n`;
                output += '\n';
            });

            output += `Total users: ${rows.length}\n`;
        }

        console.log(output);
        fs.writeFileSync('users_list.txt', output);
        console.log('\n✅ User list saved to users_list.txt');

        await connection.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

queryUsers();
