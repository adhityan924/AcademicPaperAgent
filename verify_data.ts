import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function verifyData() {
    console.log('Verifying data in Postgres...');

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });

    try {
        const nodeRes = await pool.query('SELECT COUNT(*) FROM nodes');
        const edgeRes = await pool.query('SELECT COUNT(*) FROM edges');

        const nodeCount = parseInt(nodeRes.rows[0].count);
        const edgeCount = parseInt(edgeRes.rows[0].count);

        console.log(`Found ${nodeCount} nodes in the database.`);
        console.log(`Found ${edgeCount} edges in the database.`);

        if (nodeCount > 0 && edgeCount > 0) {
            console.log('Data verification SUCCESSFUL.');

            // List a few nodes
            const nodes = await pool.query('SELECT * FROM nodes LIMIT 3');
            console.log('Sample nodes:', JSON.stringify(nodes.rows, null, 2));
        } else {
            console.error('Data verification FAILED: Database is empty.');
        }

    } catch (error) {
        console.error('Verification failed:', error);
    } finally {
        await pool.end();
    }
}

verifyData();
