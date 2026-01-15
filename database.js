const pg = require('pg')
const {Pool}=pg;
const pool = new Pool({
    host:'localhost',
    user:'postgres',
    password:'password',
    database:'llm_docs',
    port:5432
})
async function initializeDB(){
    try {
        //pg vector extension
        await pool.query(`CREATE EXTENSION IF NOT EXISTS vector`);
        console.log("PG Vector extension ensured.");
        //create table for storing document embeddings 
        await pool.query(`CREATE TABLE IF NOT EXISTS document_embeddings(
            id SERIAL PRIMARY KEY,
            chunk TEXT NOT NULL,
            response TEXT,
            embedding vector(768),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            
            )`)
        console.log("Document embeddings table ensured.");

        // Ensure response column exists (useful if table was already created without it)
        await pool.query(`ALTER TABLE document_embeddings ADD COLUMN IF NOT EXISTS response TEXT`);

           await pool.query(`
      CREATE INDEX IF NOT EXISTS embedding_index 
      ON document_embeddings USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100);
    `);
    console.log("index created for faster search");
        
    } catch (error) {
         console.error("Error setting up database:", error);
        
    }
}
async function saveEmbedding(chunk, embedding, response = null){
    try {
        const vectorString = `[${embedding.join(',')}]`;  
        const query = `INSERT INTO document_embeddings(chunk, embedding, response) VALUES($1, $2, $3) RETURNING id`;
        const result = await pool.query(query, [chunk, vectorString, response]);
        return result.rows[0].id;
    } catch (error) {
        console.error("Error saving document:", error);
    }
}

async function findsimilarDocuments(embedding, limit = 5) {
    try {
        const vectorString = `[${embedding.join(',')}]`; // 👈 FIX

        const query = `
            SELECT id, chunk, response, embedding <=> $1 AS distance
            FROM document_embeddings
            ORDER BY embedding <=> $1
            LIMIT $2
        `;

        const result = await pool.query(query, [vectorString, limit]);
        return result.rows;
    } catch (error) {
        console.error("Error finding similar documents:", error);
    }
}


module.exports={pool,initializeDB,saveEmbedding,findsimilarDocuments};