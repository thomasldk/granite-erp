import { Client } from 'pg';

const url = "postgresql://postgres:kswjKQPlojbTACxzZElP8723bhsj2bdbn@yamanote.proxy.rlwy.net:12394/postgres";
console.log("Testing connection to:", url.replace(/:[^:@]*@/, ':****@'));

const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false } // Often needed for hosted DBs
});

client.connect()
    .then(() => {
        console.log("✅ CONNECTED SUCCESSFULLY!");
        client.end();
    })
    .catch(e => {
        console.error("❌ CONNECTION ERROR:", e.message);
        console.error("Full Error:", e);
        client.end();
    });
