import dotenv from 'dotenv';
dotenv.config();

export const config = {
    openaiApiKey: process.env.OPENAI_API_KEY,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    databaseUrl: process.env.DATABASE_URL,
    llamaCloudApiKey: process.env.LLAMA_CLOUD_API_KEY,
};
