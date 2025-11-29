import fs from 'fs';
import path from 'path';
import { GraphStore } from './services/db';
import { extractionGraph } from './graph/extractor';
import { parsePdfToMarkdown } from './utils/pdf';
import { config } from './config';

async function main() {
    const inputPath = process.argv[2] || './papers';

    if (!fs.existsSync(inputPath)) {
        console.error(`Path ${inputPath} does not exist.`);
        process.exit(1);
    }

    const db = new GraphStore();
    let files: string[] = [];
    let papersDir = '';

    const stats = fs.statSync(inputPath);
    if (stats.isDirectory()) {
        papersDir = inputPath;
        files = fs.readdirSync(papersDir).filter(f => f.endsWith('.pdf'));
        console.log(`Found ${files.length} PDF files in ${papersDir}`);
    } else if (stats.isFile() && inputPath.endsWith('.pdf')) {
        papersDir = path.dirname(inputPath);
        files = [path.basename(inputPath)];
        console.log(`Processing single file: ${files[0]}`);
    } else {
        console.error('Invalid input. Please provide a PDF file or a directory containing PDFs.');
        process.exit(1);
    }

    for (const file of files) {
        const filePath = path.join(papersDir, file);
        console.log(`Processing ${file}...`);

        try {
            // 1. Parse PDF
            console.log(`  Parsing PDF...`);
            const markdown = await parsePdfToMarkdown(filePath);

            // 2. Extract Knowledge
            console.log(`  Extracting knowledge...`);
            const result = await extractionGraph.invoke({ pdfText: markdown });

            if (!result.extractedData) {
                console.warn(`  No data extracted for ${file}`);
                continue;
            }

            const { nodes, edges } = result.extractedData;
            console.log(`  Extracted ${nodes.length} nodes and ${edges.length} edges.`);

            // 3. Save to DB
            console.log(`  Saving to database...`);
            const labelToId = new Map<string, string>();

            // Upsert Nodes
            for (const node of nodes) {
                const properties = { ...node.properties, source: file };
                const id = await db.upsertNode(node.label, node.type, properties);
                labelToId.set(node.label, id);
            }

            // Create Edges
            for (const edge of edges) {
                const sourceId = labelToId.get(edge.source_label);
                const targetId = labelToId.get(edge.target_label);

                if (sourceId !== undefined && targetId !== undefined) {
                    await db.createEdge(sourceId, targetId, edge.relation_type, edge.properties);
                } else {
                    console.warn(`  Skipping edge ${edge.source_label} -> ${edge.target_label}: Node not found.`);
                }
            }

            console.log(`  Done with ${file}`);

        } catch (error) {
            console.error(`  Failed to process ${file}:`, error);
            // Fault tolerance: continue to next file
        }
    }

    await db.close();
    console.log('Pipeline completed.');
}

main().catch(console.error);
