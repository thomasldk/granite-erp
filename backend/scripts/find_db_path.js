
const { Client } = require('pg');
require('dotenv').config({ path: '../.env' });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function findPath() {
    try {
        await client.connect();
        const res = await client.query('SHOW data_directory;');
        console.log('PG_DATA_PATH:', res.rows[0].data_directory);
        await client.end();
    } catch (err) {
        console.error('Error:', err);
    }
}

findPath();
