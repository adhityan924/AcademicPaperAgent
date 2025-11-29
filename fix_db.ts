import { GraphStore } from './src/services/db';

async function fixDb() {
    const db = new GraphStore();
    console.log('Backfilling source property...');

    try {
        // Update all nodes that don't have a source property to have 'academic_paper.pdf'
        // This is a hack for the current session since we know what file was processed.
        await (db as any).pool.query(`
            UPDATE nodes 
            SET properties = jsonb_set(properties, '{source}', '"academic_paper.pdf"') 
            WHERE properties->>'source' IS NULL
        `);
        console.log('Backfill complete.');
    } catch (error) {
        console.error('Error backfilling DB:', error);
    } finally {
        await db.close();
    }
}

fixDb();
