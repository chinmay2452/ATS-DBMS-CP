const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setup() {
    // 1. Connect without database specified
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        multipleStatements: true // Essential for running full SQL scripts
    });

    console.log('🔗 Connected to MySQL...');

    try {
        // 2. Create Database
        console.log(`🔨 Creating database ${process.env.DB_NAME}...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME};`);
        await connection.query(`USE ${process.env.DB_NAME};`);

        // 3. Read and Run Table Creation Script
        console.log('📋 Creating tables...');
        const ddlPath = path.join(__dirname, '..', 'SQL', 'ddl', 'create_tables.sql');
        const ddlSql = fs.readFileSync(ddlPath, 'utf8');
        await connection.query(ddlSql);

        // 4. Read and Run Sample Data Script
        console.log('💾 Inserting sample data...');
        const dmlPath = path.join(__dirname, '..', 'SQL', 'dml', 'insert_data.sql');
        const dmlSql = fs.readFileSync(dmlPath, 'utf8');
        await connection.query(dmlSql);

        // 5. Read and Run Functionalities (Procedures, etc.)
        console.log('⚙️ Setting up procedures and views...');
        const funcFiles = ['views.sql', 'procedures.sql', 'triggers.sql'];
        for (const file of funcFiles) {
            const fPath = path.join(__dirname, '..', 'SQL', 'functionalities', file);
            if (fs.existsSync(fPath)) {
                let fSql = fs.readFileSync(fPath, 'utf8');

                // Handle DELIMITER: strip DELIMITER lines, split on '//' for procedures/triggers
                if (fSql.includes('DELIMITER')) {
                    // Remove DELIMITER lines and split blocks on '//'
                    fSql = fSql.replace(/^DELIMITER\s+.*$/gm, '');
                    const blocks = fSql.split('//').map(b => b.trim()).filter(b => b.length > 0);
                    for (const block of blocks) {
                        await connection.query(block).catch(err =>
                            console.log(`⚠️ Warning in ${file}:`, err.message)
                        );
                    }
                } else {
                    // Views and simple SQL — run as-is with multipleStatements
                    await connection.query(fSql).catch(err =>
                        console.log(`⚠️ Warning in ${file}:`, err.message)
                    );
                }
            }
        }

        console.log('✨ DATABASE SETUP COMPLETE! ✨');
        console.log('You can now run "node server.js"');

    } catch (err) {
        console.error('❌ Setup failed:', err.message);
        if (err.message.includes('Access denied')) {
            console.log('\n💡 TIP: Your MySQL password in .env might be wrong.');
        }
    } finally {
        await connection.end();
    }
}

setup();
