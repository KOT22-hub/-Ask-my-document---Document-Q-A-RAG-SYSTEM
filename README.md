Ask My Documents — RAG Chat Assistant 🤖

“Ask My Documents” is a backend-first Retrieval-Augmented Generation (RAG) system that allows users to upload documents and ask questions. 
The system answers strictly from the uploaded documents, preventing hallucinations and ensuring context-grounded responses.

Key Features
1.Document Upload & Ingestion 📄
-Accepts .txt files via API
2.Chunking Strategy ✂️
-Breaks documents into meaningful chunks with overlap for better context
3.Embedding Generation 🔢
-Converts text chunks into vectors using a consistent embedding model
-Ties text with vector for indexing
-Vector Storage (pgvector + PostgreSQL) 🗃️
-Stores embeddings for fast similarity search
4.Query Pipeline 🔍
-Receives user questions
-Generates embedding for the question
-Searches for most relevant chunks in pgvector
5.Controlled Generation (RAG) 🤖
-LLM generates answers strictly from retrieved chunks
-Returns “I don't know ” if context is missing
-Limits chunks passed to LLM to avoid context overflow
Testing
Fully tested via Postman ✅
API endpoints validated for uploading, indexing, and querying
Architecture 
Flow: Upload → Chunk → Embed → Store → Query → Retrieve → Generate Answer
Tech Stack:
Backend: Node.js / Express
Vector DB: PostgreSQL + pgvector using docker
LLM: Ollama
Frontend: To be added in future updates 🌐
