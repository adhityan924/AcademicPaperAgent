# Academic Knowledge Graph

A professional tool for extracting knowledge from academic papers (PDFs) and building a structured Knowledge Graph.

## Tech Stack
- **Language**: TypeScript (Node.js)
- **Orchestration**: LangGraph.js
- **LLM**: OpenAI GPT-4o (via LangChain)
- **PDF Parser**: LlamaParse (via API)
- **Database**: Postgres

## Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Variables**:
    Copy `.env.example` to `.env` and fill in your keys:
    ```bash
    cp .env.example .env
    ```
    - `OPENAI_API_KEY`: Your OpenAI API key.
    - `DATABASE_URL`: Your Postgres connection string.
    - `LLAMA_CLOUD_API_KEY`: Your LlamaCloud API key.

3.  **Database Setup**:
    The application will automatically apply the schema in `src/schema.sql` if it doesn't exist, but you can also run it manually.

## Usage

1.  **Start the Server**:
    ```bash
    npm start
    ```

2.  **Access the Web Interface**:
    Open `http://localhost:3000` to upload papers and view the knowledge graph.

## Architecture
See [DESIGN.md](DESIGN.md) for details on the system architecture and design decisions.
