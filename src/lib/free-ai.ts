import { InferenceClient } from "@huggingface/inference";

// Initialize the Hugging Face client
const hf = process.env.HUGGINGFACE_API_KEY
  ? new InferenceClient(process.env.HUGGINGFACE_API_KEY)
  : null;

// Rate limiting helper
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface EmbeddingResult {
  embedding: number[];
  text: string;
}

export async function generateEmbedding(
  text: string
): Promise<EmbeddingResult> {
  try {
    await delay(200); // Rate limiting

    if (hf) {
      try {
        // Use the official Hugging Face Inference client for feature extraction
        const embedding = await hf.featureExtraction({
          model: "sentence-transformers/all-MiniLM-L6-v2",
          inputs: text,
        });

        // The official client returns the embedding array directly
        if (embedding && Array.isArray(embedding)) {
          // Ensure it's a flat array of numbers
          const flatEmbedding = embedding.flat() as number[];
          return { embedding: flatEmbedding, text: text };
        }
      } catch (error) {
        console.log("Hugging Face embedding failed, using fallback");
      }
    }

    // Fallback to simple hash-based embedding
    return { embedding: generateSimpleEmbedding(text), text: text };
  } catch (error: unknown) {
    console.error("Error generating embedding:", error);
    return { embedding: generateSimpleEmbedding(text), text: text };
  }
}

export async function generateQueryEmbedding(query: string): Promise<number[]> {
  const result = await generateEmbedding(query);
  return result.embedding;
}

export async function interpretQuery(query: string): Promise<{
  interpretedQuery: string;
  suggestedFilters: string[];
}> {
  try {
    if (hf) {
      try {
        // Use a simpler model that's available
        const result = await hf.textGeneration({
          model: "microsoft/DialoGPT-small",
          inputs: `Query: ${query}`,
          parameters: {
            max_length: 30,
            temperature: 0.7,
            return_full_text: false,
          },
        });

        if (result && result.generated_text) {
          return {
            interpretedQuery: result.generated_text,
            suggestedFilters: extractKeywords(query),
          };
        }
      } catch (error) {
        console.log("Hugging Face interpretation failed, using fallback");
      }
    }

    // Fallback to keyword extraction
    return {
      interpretedQuery: query,
      suggestedFilters: extractKeywords(query),
    };
  } catch (error) {
    console.error("Error interpreting query:", error);
    return {
      interpretedQuery: query,
      suggestedFilters: extractKeywords(query),
    };
  }
}

// Simple hash-based embedding for fallback
export function generateSimpleEmbedding(text: string): number[] {
  const words = text.toLowerCase().split(/\s+/);
  const embedding = new Array(384).fill(0); // 384 dimensions like MiniLM

  words.forEach((word, index) => {
    const hash = simpleHash(word);
    const position = hash % 384;
    embedding[position] = (embedding[position] + 1) % 10;
  });

  return embedding;
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

export function extractKeywords(text: string): string[] {
  const keywords = new Set<string>();
  const words = text.toLowerCase().split(/\s+/);

  // Common AI/tech keywords
  const techKeywords = [
    "ai",
    "artificial intelligence",
    "machine learning",
    "ml",
    "data science",
    "startup",
    "entrepreneur",
    "founder",
    "tech",
    "technology",
    "programming",
    "developer",
    "design",
    "ui",
    "ux",
    "product",
    "marketing",
    "business",
    "community",
    "slack",
    "discord",
    "chat",
    "collaboration",
    "networking",
  ];

  words.forEach((word) => {
    if (techKeywords.some((keyword) => word.includes(keyword))) {
      keywords.add(word);
    }
  });

  return Array.from(keywords);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;

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
