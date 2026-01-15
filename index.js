const express = require('express');
const cors = require('cors');
const app = express();
const env = require('dotenv');
const fileupload = require('express-fileupload');
const {split}= require('llm-splitter');
const {Ollama} = require('ollama');
const {pool,initializeDB,saveEmbedding,findsimilarDocuments} = require('./database');

env.config();
app.use(cors());
app.use(fileupload());
app.use(express.json());

const PORT = process.env.PORT 
const ollama = new Ollama({host:'http://127.0.0.1:11434'})

app.post('/api/upload-text', async (req,res)=>{

    try {
            if(!req.files || Object.keys(req.files).length === 0){
        return res.status(400).send('No files were uploaded.');
    }
    const uploadedfile = req.files.file;

    const textcontent = uploadedfile.data.toString('utf-8').replace(/\s/g,' ').trim();

    const chunks = split(textcontent,{chunkSize:400,chunkOverlap:60});
    console.log(chunks)
    //embedding the chunks from the text file 
    const batch = await ollama.embed({
        model:'nomic-embed-text',
        input: chunks.map(chunk => chunk.text)
    })

    console.log(batch.embeddings[0].length);

    for(let i=0;i<chunks.length;i++){
        const chunk = chunks[i].text;
        const embedding = batch.embeddings[i];
        await saveEmbedding(chunk,embedding);
    }


    res.json({message:"successfully uploaded and saved to databas",content:textcontent});

    
        
    } catch (error) {
        res.json({message:"error occured",error:error.message});
        console.log(error)
        
    }


    
})

app.post('/api/chat',async(req,res)=>{
    try {
        const {prompt}= req.body;
          if (!prompt) {
            return res.status(400).json({ message: "Prompt is required" });
        }

        const embedresponse = await ollama.embed({
            model:'nomic-embed-text',
            input:prompt
            
        })
        const userembedding = embedresponse.embeddings[0];
        const similardocs = await findsimilarDocuments(userembedding, 5);

        console.log( "similar doc has been found "+similardocs.length);
        
    
         const context = similardocs
  .map(doc => doc.chunk)
  .join('\n\n');

        // 3. Generate Answer
        const chatResponse = await ollama.chat({
  model: 'gemma3:1b',
  messages: [
    {
      role: 'system',
      content: `
You are a question-answering assistant.
Answer ONLY using the provided context.
If the answer is not contained in the context, say "I don't know".

Context:
${context}
      `
    },
    { role: 'user', content: prompt }
  ]
});

        const answer = chatResponse.message.content;
        
        // 4. Save Interaction (Memory)
        await saveEmbedding(prompt, userembedding, answer);

        res.json({ answer });
        
    } catch (error) {
                
        console.error(error);
        res.status(500).json({ message: "Error processing chat", error: error.message });
        
    }
})

app.listen(PORT, () => {
    initializeDB();

    console.log(`Server is running on port ${PORT}`);
});
// test commit
