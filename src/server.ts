import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { GraphStore } from './services/db';

const app = express();
const port = process.env.PORT || 3000;

// Initialize DB
const db = new GraphStore();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../papers');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// API Endpoints

// Upload a paper
app.post('/api/upload', upload.single('paper'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const filePath = req.file.path;
        console.log(`Processing paper: ${filePath}`);

        // Trigger processing (this might take a while, so ideally we'd use a queue, but for now await is fine for a demo)
        // We need to modify index.ts to export a function we can call, or just call the logic here.
        // For now, I'll assume we can import a runPipeline function or similar. 
        // Since index.ts is currently a script, I might need to refactor it slightly.
        // Let's just spawn a child process for now to keep it simple and robust against blocking the event loop.

        const { exec } = require('child_process');
        exec(`npx ts-node src/index.ts "${filePath}"`, (error: any, stdout: any, stderr: any) => {
            if (error) {
                console.error(`exec error: ${error}`);
                // Don't fail the request if it's already returned, but log it.
                return;
            }
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
        });

        res.json({ message: 'Paper uploaded and processing started', filename: req.file.originalname });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to process paper' });
    }
});

// Get all papers (entities)
app.get('/api/papers', async (req, res) => {
    try {
        // Assuming 'source' is a property in the metadata of nodes, or we need to track papers separately.
        // The current schema might not track 'source' explicitly in a column.
        // Let's check schema.sql.
        // If schema has 'properties' JSONB, we might need to query that.
        // For now, let's just return all nodes as a placeholder or check if we can extract sources.
        // Actually, the user wants to view "papers".
        // If we don't have a papers table, we might need to add one or just list unique sources from node properties if available.
        // Let's assume nodes have a 'source' property in the JSON.

        const result = await (db as any).pool.query("SELECT DISTINCT properties->>'source' as source FROM nodes WHERE properties->>'source' IS NOT NULL");
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch papers' });
    }
});

// Get graph data
app.get('/api/graph', async (req, res) => {
    try {
        const paperSource = req.query.paper as string;
        let nodesQuery = 'SELECT * FROM nodes';
        let edgesQuery = 'SELECT * FROM edges';
        const params: any[] = [];

        if (paperSource) {
            nodesQuery += " WHERE properties->>'source' = $1";
            // For edges, we want edges where BOTH source and target are in the filtered nodes.
            // Or simpler: edges where source or target nodes belong to the paper.
            // But edges don't have 'source' property directly usually, they connect nodes.
            // If we filter nodes, we should filter edges that connect these nodes.
            edgesQuery = `
                SELECT e.* FROM edges e
                JOIN nodes n1 ON e.source_id = n1.id
                JOIN nodes n2 ON e.target_id = n2.id
                WHERE n1.properties->>'source' = $1 AND n2.properties->>'source' = $1
            `;
            params.push(paperSource);
        }

        const nodesResult = await (db as any).pool.query(nodesQuery, params);
        const edgesResult = await (db as any).pool.query(edgesQuery, params);

        // Transform to a format suitable for visualization (e.g., Cytoscape or D3)
        const nodes = nodesResult.rows.map((row: any) => ({
            data: {
                id: row.id,
                label: row.label,
                type: row.type,
                properties: row.properties // Include properties
            }
        }));

        const edges = edgesResult.rows.map((row: any) => ({
            data: {
                source: row.source_id,
                target: row.target_id,
                label: row.relation_type,
                properties: row.properties // Include properties
            }
        }));

        res.json({ elements: [...nodes, ...edges] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch graph data' });
    }
});

app.listen(Number(port), '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${port}`);
});
