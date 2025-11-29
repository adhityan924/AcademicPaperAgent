import { GraphStore } from './src/services/db';

async function clearDb() {
    const db = new GraphStore();
    try {
        console.log('Clearing database...');
        // We need to access the pool. Since it's private, we might need to use a raw connection or modify GraphStore.
        // However, for this quick task, I'll just use the fact that I can probably execute a query if I modify GraphStore or just use `pg` directly here.
        // Let's use `pg` directly to avoid modifying source code just for this.

        const { Pool } = require('pg');
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/academic_agent'
        });

        await pool.query('TRUNCATE TABLE edges, nodes RESTART IDENTITY CASCADE;');
        console.log('Database cleared successfully.');
        await pool.end();
    } catch (error) {
        console.error('Error clearing database:', error);
    }
    process.exit(0);
}

clearDb();
