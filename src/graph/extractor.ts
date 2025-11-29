import { z } from 'zod';
import { ChatAnthropic } from '@langchain/anthropic';
import { StateGraph, END } from '@langchain/langgraph';
import { config } from '../config';

// 1. Define Zod Schema
const NodeSchema = z.object({
    label: z.string().describe("The unique name or identifier of the entity"),
    type: z.string().describe("The type of the entity (e.g. PAPER, CONCEPT, METHOD)"),
    properties: z.record(z.string(), z.any()).optional().describe("Additional metadata about the entity"),
});

const EdgeSchema = z.object({
    source_label: z.string().describe("The label of the source node"),
    target_label: z.string().describe("The label of the target node"),
    relation_type: z.string().describe("The type of relationship (e.g. INTRODUCES, IMPROVES_ON)"),
    properties: z.record(z.string(), z.any()).optional().describe("Reasoning and other metadata for the relationship"),
});

const ExtractionSchema = z.object({
    nodes: z.array(NodeSchema).describe("List of entities extracted from the text"),
    edges: z.array(EdgeSchema).describe("List of relationships between the extracted entities"),
});

export type ExtractionOutput = z.infer<typeof ExtractionSchema>;

// 2. Define State
interface GraphState {
    pdfText: string;
    extractedData?: ExtractionOutput;
}

// 3. Define Node
const extractKnowledge = async (state: GraphState) => {
    const model = new ChatAnthropic({
        model: "claude-sonnet-4-5-20250929",
        temperature: 0,
        apiKey: config.anthropicApiKey,
    });

    const structuredModel = model.withStructuredOutput(ExtractionSchema);

    const systemPrompt = `You are an AI Researcher building a Knowledge Graph. Read the paper text. Extract key concepts. Focus on **semantic novelty**.
  
  Rules:
  1. Identify the main paper, authors, methods proposed, metrics used, and datasets.
  2. If Paper A renders faster than Paper B, create an 'IMPROVES_ON' edge with property {'aspect': 'rendering_speed'}.
  3. Do not just dump citations. Focus on the core contributions and relationships.
  4. Ensure every 'source_label' and 'target_label' in edges exists in the 'nodes' list.
  `;

    try {
        const result = await structuredModel.invoke([
            { role: "system", content: systemPrompt },
            { role: "user", content: state.pdfText },
        ]);

        return { extractedData: result };
    } catch (error) {
        console.error("Error extracting knowledge:", error);
        // Return empty data instead of crashing
        return { extractedData: { nodes: [], edges: [] } };
    }
};

// 4. Create Graph
const workflow = new StateGraph<GraphState>({
    channels: {
        pdfText: {
            reducer: (x: string, y: string) => y,
            default: () => ""
        },
        extractedData: {
            reducer: (x: ExtractionOutput | undefined, y: ExtractionOutput | undefined) => y,
            default: () => undefined
        }
    }
})
    .addNode("extract_knowledge", extractKnowledge)
    .addEdge("__start__", "extract_knowledge")
    .addEdge("extract_knowledge", END);

export const extractionGraph = workflow.compile();
