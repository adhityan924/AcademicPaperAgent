import fs from 'fs';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdf = require('pdf-parse');

export async function parsePdfToMarkdown(filePath: string): Promise<string> {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        // @ts-ignore
        const data = await pdf(dataBuffer);

        // Basic cleanup to make it more "markdown-like"
        // 1. Remove excessive newlines
        let text = data.text.replace(/\n\n+/g, '\n\n');

        // 2. Try to identify headers (lines that are short and uppercase might be headers)
        // This is a heuristic and won't be perfect, but better than raw text.
        text = text.split('\n').map((line: string) => {
            const trimmed = line.trim();
            if (trimmed.length > 0 && trimmed.length < 50 && trimmed === trimmed.toUpperCase()) {
                return `## ${trimmed}`;
            }
            return line;
        }).join('\n');

        return text;
    } catch (error) {
        console.error(`Error parsing PDF ${filePath}:`, error);
        throw error;
    }
}
