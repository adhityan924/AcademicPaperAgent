import { GraphStore } from './src/services/db';

async function testPostgres() {
    console.log('Testing Postgres connection...');
    const db = new GraphStore();

    // Wait a bit for schema init
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
        console.log('Upserting node...');
        const nodeId = await db.upsertNode('Test Node PG', 'test_type', { foo: 'bar_pg' });
        console.log('Node upserted with ID:', nodeId);

        console.log('Upserting another node...');
        const nodeId2 = await db.upsertNode('Test Node 2 PG', 'test_type', { foo: 'baz_pg' });
        console.log('Node 2 upserted with ID:', nodeId2);

        console.log('Creating edge...');
        const edgeId = await db.createEdge(nodeId, nodeId2, 'TEST_RELATION_PG', { since: '2024' });
        console.log('Edge created with ID:', edgeId);

        console.log('Test successful!');
    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await db.close();
    }
}

testPostgres();
