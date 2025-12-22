import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function inspectSQLite() {
    const db = await open({
        filename: './prisma/dev.db',
        driver: sqlite3.Database
    });

    console.log('--- PaymentTerm Columns ---');
    const cols = await db.all("PRAGMA table_info(PaymentTerm)");
    console.table(cols);

    console.log('--- PaymentTerm Data ---');
    const rows = await db.all("SELECT * FROM PaymentTerm");
    console.log(JSON.stringify(rows, null, 2));
}

inspectSQLite();
