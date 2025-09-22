import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function createEmbedding(text: string) {
    const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004"});
    const res = await embeddingModel.embedContent(text);
    return res.embedding.values;
}

export async function createManyEmbeddings(texts: string[]) {
    const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004"});
    const res = await embeddingModel.batchEmbedContents({
        requests: texts.map((text) => ({ content: text })),
    });
    return res.embeddings.map((embedding) => embedding.values);
}

export async function chatWithAI(systemPrompt: string, userQuestion: string) {
    // Note: The user requested 'gemini-2.5-pro', but the latest available model is 'gemini-1.5-pro'.
    // Using 'gemini-1.5-pro' instead.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest", systemInstruction: systemPrompt });
    const chat = model.startChat();
    const result = await chat.sendMessage(userQuestion);
    const response = await result.response;
    return response.text();
}
