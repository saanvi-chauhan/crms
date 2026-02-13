// check_active_cases.js
const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkActiveCases() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'crms'
    });

    console.log('✅ Connected to database\n');

    try {
        // Check all cases
        const [allCases] = await connection.query('SELECT case_id, FIR_number, status, primary_accused_id FROM Cases');
        console.log('📊 ALL CASES:');
        console.table(allCases);

        // Check active cases (what the API returns)
        const [activeCases] = await connection.query(`
      SELECT c.case_id, c.FIR_number, cc.crime_name, c.city, c.district, c.status, c.primary_accused_id,
             CASE WHEN c.primary_accused_id IS NOT NULL THEN 'Has Primary Accused' ELSE 'No Primary Accused' END as accused_status
      FROM Cases c
      LEFT JOIN Crime_Category cc ON c.crime_type_id = cc.crime_type_id
      WHERE c.status IN ('Open', 'Under Investigation')
      ORDER BY c.date_reported DESC
    `);

        console.log('\n📊 ACTIVE CASES (Open or Under Investigation):');
        console.table(activeCases);
        console.log(`\nTotal active cases: ${activeCases.length}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

checkActiveCases();
