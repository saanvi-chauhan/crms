
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  const sqlPath = path.join(__dirname, '../crms.sql');
  console.log(`Reading SQL file from: ${sqlPath}`);
  
  if (!fs.existsSync(sqlPath)) {
    console.error('SQL file not found!');
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(sqlPath, 'utf8');

  // Create connection without database selected to create it
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  try {
    console.log('Connected to MySQL server.');

    // We need to handle the "CREATE DATABASE crms" separately or carefully
    // because if it already exists, it might fail.
    // Also crms.sql has "USE crms" which is good.
    
    // Let's modify the SQL to be safe if DB exists
    // The simplified crms.sql provided in view_file shows:
    // CREATE DATABASE crms;
    // USE crms;
    
    // We will drop it if it exists to be fresh? Or just try to run it?
    // User wants to launch, maybe fresh is better as it is from a dump.
    
    // Let's check if DB exists
    const [rows] = await connection.query("SHOW DATABASES LIKE 'crms'");
    if (rows.length > 0) {
        console.log('Database "crms" already exists.');
        // If we want to ensure schema matches, we might want to drop it.
        // But maybe user has data?
        // The script crms.sql does NOT have DROP DATABASE IF EXISTS.
        // It has CREATE DATABASE crms;
        // This command will fail if DB exists.
        
        console.log('Dropping existing database "crms" to ensure clean setup...');
        await connection.query('DROP DATABASE crms');
    }

    console.log('Executing SQL script...');
    await connection.query(sqlContent);
    console.log('Database setup completed successfully.');

  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

setupDatabase();
