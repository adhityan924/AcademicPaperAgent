import { GraphStore } from './src/services/db';

async function testMongo() {
    console.log('Testing MongoDB connection...');
    const db = new GraphStore();

    try {
        console.log('Upserting node...');
        const nodeId = await db.upsertNode('Test Node', 'test_type', { foo: 'bar' });
        console.log('Node upserted with ID:', nodeId);

        console.log('Upserting another node...');
        const nodeId2 = await db.upsertNode('Test Node 2', 'test_type', { foo: 'baz' });
        console.log('Node 2 upserted with ID:', nodeId2);

        console.log('Creating edge...');
        const edgeId = await db.createEdge(nodeId, nodeId2, 'TEST_RELATION', { since: '2023' });
        console.log('Edge created with ID:', edgeId);

        console.log('Test successful!');
    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await db.close();
    }
}

testMongo();
