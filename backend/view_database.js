// view_database.js - Script to view all CRMS database data
const mysql = require('mysql2/promise');
require('dotenv').config();
const fs = require('fs');

async function viewDatabase() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'crms',
        multipleStatements: true
    });

    console.log('✅ Connected to CRMS database\n');

    let output = '='.repeat(80) + '\n';
    output += 'CRMS DATABASE - COMPLETE DATA DUMP\n';
    output += 'Generated: ' + new Date().toLocaleString() + '\n';
    output += '='.repeat(80) + '\n\n';

    try {
        // 1. Roles
        output += '\n' + '='.repeat(80) + '\n';
        output += '1. ROLES\n';
        output += '='.repeat(80) + '\n';
        const [roles] = await connection.query('SELECT * FROM Roles ORDER BY role_id');
        console.table(roles);
        output += JSON.stringify(roles, null, 2) + '\n';

        // 2. Police Staff
        output += '\n' + '='.repeat(80) + '\n';
        output += '2. POLICE STAFF\n';
        output += '='.repeat(80) + '\n';
        const [staff] = await connection.query('SELECT * FROM Police_Staff ORDER BY staff_id');
        console.table(staff);
        output += JSON.stringify(staff, null, 2) + '\n';

        // 3. Users (with role and staff info)
        output += '\n' + '='.repeat(80) + '\n';
        output += '3. USERS (with Role and Staff Details)\n';
        output += '='.repeat(80) + '\n';
        const [users] = await connection.query(`
      SELECT 
        u.user_id,
        u.username,
        u.password_hash AS password,
        r.role_name,
        ps.name AS staff_name,
        ps.badge_number,
        u.created_at,
        u.last_login
      FROM Users u
      JOIN Roles r ON u.role_id = r.role_id
      JOIN Police_Staff ps ON u.staff_id = ps.staff_id
      ORDER BY u.user_id
    `);
        console.table(users);
        output += JSON.stringify(users, null, 2) + '\n';

        // 4. Crime Categories
        output += '\n' + '='.repeat(80) + '\n';
        output += '4. CRIME CATEGORIES\n';
        output += '='.repeat(80) + '\n';
        const [categories] = await connection.query('SELECT * FROM Crime_Category ORDER BY crime_type_id');
        console.table(categories);
        output += JSON.stringify(categories, null, 2) + '\n';

        // 5. Criminals
        output += '\n' + '='.repeat(80) + '\n';
        output += '5. CRIMINALS\n';
        output += '='.repeat(80) + '\n';
        const [criminals] = await connection.query('SELECT * FROM Criminals ORDER BY criminal_id');
        console.table(criminals);
        output += JSON.stringify(criminals, null, 2) + '\n';

        // 6. Cases (with relationships)
        output += '\n' + '='.repeat(80) + '\n';
        output += '6. CASES (with Crime Type and Accused)\n';
        output += '='.repeat(80) + '\n';
        const [cases] = await connection.query(`
      SELECT 
        c.case_id,
        c.FIR_number,
        cc.crime_name,
        cc.ipc_section,
        cr.name AS primary_accused,
        c.city,
        c.district,
        c.description,
        c.date_reported,
        c.status
      FROM Cases c
      JOIN Crime_Category cc ON c.crime_type_id = cc.crime_type_id
      LEFT JOIN Criminals cr ON c.primary_accused_id = cr.criminal_id
      ORDER BY c.case_id
    `);
        console.table(cases);
        output += JSON.stringify(cases, null, 2) + '\n';

        // 7. FIR Records
        output += '\n' + '='.repeat(80) + '\n';
        output += '7. FIR RECORDS\n';
        output += '='.repeat(80) + '\n';
        const [firs] = await connection.query(`
      SELECT 
        f.FIR_number,
        f.complainant_name,
        f.complainant_contact,
        f.place_of_offence,
        f.police_station,
        f.date_filed,
        c.status AS case_status
      FROM FIR f
      JOIN Cases c ON f.case_id = c.case_id
      ORDER BY f.date_filed DESC
    `);
        console.table(firs);
        output += JSON.stringify(firs, null, 2) + '\n';

        // 8. Investigations
        output += '\n' + '='.repeat(80) + '\n';
        output += '8. INVESTIGATIONS\n';
        output += '='.repeat(80) + '\n';
        const [investigations] = await connection.query(`
      SELECT 
        i.investigation_id,
        c.FIR_number,
        cc.crime_name,
        ps.name AS assigned_officer,
        ps.badge_number,
        i.progress_notes,
        i.last_updated
      FROM Investigations i
      JOIN Cases c ON i.case_id = c.case_id
      JOIN Crime_Category cc ON c.crime_type_id = cc.crime_type_id
      JOIN Police_Staff ps ON i.assigned_to = ps.staff_id
      ORDER BY i.investigation_id
    `);
        console.table(investigations);
        output += JSON.stringify(investigations, null, 2) + '\n';

        // 9. Summary Statistics
        output += '\n' + '='.repeat(80) + '\n';
        output += '9. DATABASE SUMMARY STATISTICS\n';
        output += '='.repeat(80) + '\n';
        const [stats] = await connection.query(`
      SELECT 'Total Roles' AS metric, COUNT(*) AS count FROM Roles
      UNION ALL SELECT 'Total Police Staff', COUNT(*) FROM Police_Staff
      UNION ALL SELECT 'Active Police Staff', COUNT(*) FROM Police_Staff WHERE is_active = 1
      UNION ALL SELECT 'Total Users', COUNT(*) FROM Users
      UNION ALL SELECT 'Total Crime Categories', COUNT(*) FROM Crime_Category
      UNION ALL SELECT 'Total Criminals', COUNT(*) FROM Criminals
      UNION ALL SELECT 'Wanted Criminals', COUNT(*) FROM Criminals WHERE is_wanted = 1
      UNION ALL SELECT 'Total Cases', COUNT(*) FROM Cases
      UNION ALL SELECT 'Open Cases', COUNT(*) FROM Cases WHERE status = 'Open'
      UNION ALL SELECT 'Closed Cases', COUNT(*) FROM Cases WHERE status = 'Closed'
      UNION ALL SELECT 'Total FIRs', COUNT(*) FROM FIR
      UNION ALL SELECT 'Total Investigations', COUNT(*) FROM Investigations
    `);
        console.table(stats);
        output += JSON.stringify(stats, null, 2) + '\n';

        // Save to file
        fs.writeFileSync('database_dump.txt', output);
        console.log('\n✅ Database dump saved to database_dump.txt');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

viewDatabase();
