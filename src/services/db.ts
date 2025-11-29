import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import dns from 'dns';
import { URL } from 'url';
import { promisify } from 'util';

dotenv.config();

const resolve4 = promisify(dns.resolve4);

export class GraphStore {
    private pool!: Pool;

    constructor() {
        this.initPool();
    }

    private async initPool() {
        let connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/academic_agent';

        try {
            // Manually resolve hostname to IPv4 to bypass Render's IPv6 issues
            const parsedUrl = new URL(connectionString);
            const hostname = parsedUrl.hostname;

            if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
                console.log(`Resolving ${hostname} to IPv4...`);
                const addresses = await resolve4(hostname);
                if (addresses && addresses.length > 0) {
                    console.log(`Resolved ${hostname} to ${addresses[0]}`);
                    parsedUrl.hostname = addresses[0];
                    connectionString = parsedUrl.toString();
                }
            }
        } catch (error) {
            console.error('DNS resolution failed, falling back to original connection string:', error);
        }

        this.pool = new Pool({
            connectionString,
            ssl: {
                rejectUnauthorized: false
            }
        });

        this.initSchema();
    }

    private async initSchema() {
        try {
            const schemaPath = path.join(__dirname, '../schema.sql');
            const schemaSql = fs.readFileSync(schemaPath, 'utf8');
            await this.pool.query(schemaSql);
            console.log('Schema initialized');
        } catch (error) {
            console.error('Error initializing schema:', error);
        }
    }

    async close() {
        await this.pool.end();
    }

    async upsertNode(label: string, type: string, metadata: any = {}): Promise<string> {
        const query = `
            INSERT INTO nodes (label, type, properties)
            VALUES ($1, $2, $3)
            ON CONFLICT (label, type) 
            DO UPDATE SET properties = $3
            RETURNING id;
        `;

        try {
            const res = await this.pool.query(query, [label, type, JSON.stringify(metadata)]);
            return res.rows[0].id.toString();
        } catch (error) {
            console.error(`Error upserting node ${label}:`, error);
            throw error;
        }
    }

    async createEdge(sourceId: string, targetId: string, relation: string, metadata: any = {}): Promise<string> {
        const query = `
            INSERT INTO edges (source_id, target_id, relation_type, properties)
            VALUES ($1, $2, $3, $4)
            RETURNING id;
        `;

        try {
            const res = await this.pool.query(query, [
                parseInt(sourceId),
                parseInt(targetId),
                relation,
                JSON.stringify(metadata)
            ]);
            return res.rows[0].id.toString();
        } catch (error) {
            console.error(`Error creating edge:`, error);
            throw error;
        }
    }
}
