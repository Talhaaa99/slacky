import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface EmbeddingResult {
  embedding: number[];
  text: string;
}

// Rate limiting helper
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateEmbedding(
  text: string
): Promise<EmbeddingResult> {
  try {
    // Add a small delay to prevent rate limiting
    await delay(100);

    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float",
    });

    return {
      embedding: response.data[0].embedding,
      text: text,
    };
  } catch (error: unknown) {
    console.error("Error generating embedding:", error);

    const errorObj = error as { code?: string; status?: number };
    if (errorObj.code === "insufficient_quota" || errorObj.status === 429) {
      console.log("Rate limit hit. Waiting 5 seconds before retry...");
      await delay(5000);

      // Try one more time
      try {
        const response = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: text,
          encoding_format: "float",
        });

        return {
          embedding: response.data[0].embedding,
          text: text,
        };
      } catch (retryError) {
        console.error("Retry also failed:", retryError);
        throw new Error(
          "OpenAI quota exceeded. Please check your billing settings."
        );
      }
    }

    throw new Error("Failed to generate embedding");
  }
}

export async function generateQueryEmbedding(query: string): Promise<number[]> {
  const result = await generateEmbedding(query);
  return result.embedding;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function parseEmbedding(embeddingString: string): number[] {
  try {
    return JSON.parse(embeddingString);
  } catch {
    return [];
  }
}

export function stringifyEmbedding(embedding: number[]): string {
  return JSON.stringify(embedding);
}
