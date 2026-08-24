import { MemoryClient } from "mem0ai";
import { GoogleGenAI } from "@google/genai";

const withTimeout = (promise, ms = 2000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Operation timed out')), ms))
  ]);
};

let mem0Client = null;
export const getMem0Client = () => {
  const apiKey = process.env.MEM0_API_KEY;
  if (!apiKey || apiKey === "your_key_here") {
    return null;
  }
  if (!mem0Client) {
    try {
      mem0Client = new MemoryClient({ apiKey });
    } catch (err) {
      console.warn("Mem0 initialization failed:", err.message);
      return null;
    }
  }
  return mem0Client;
};

let geminiClient = null;
export const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_key_here") {
    return null;
  }
  if (!geminiClient) {
    try {
      geminiClient = new GoogleGenAI({ apiKey });
    } catch (err) {
      console.warn("GoogleGenAI initialization failed:", err.message);
      return null;
    }
  }
  return geminiClient;
};

/**
 * Searches user long-term memories using Mem0 with strict 2-second timeout
 */
export const searchMem0 = async (userId, query) => {
  try {
    const client = getMem0Client();
    if (!client) return [];
    const searchPromise = client.search(query, { filters: { user_id: userId.toString() } });
    const res = await withTimeout(searchPromise, 2000);
    const list = Array.isArray(res) ? res : res?.results || [];
    return list
      .map((r) => r.memory || r.text || (typeof r === "string" ? r : ""))
      .filter(Boolean);
  } catch (err) {
    console.warn("Mem0 search note (non-blocking):", err.message);
    return [];
  }
};

/**
 * Adds conversational memory to Mem0 asynchronously (non-blocking)
 */
export const addMem0 = async (userId, messages) => {
  try {
    const client = getMem0Client();
    if (!client) return;
    const addPromise = client.add(messages, { user_id: userId.toString() });
    await withTimeout(addPromise, 4000);
  } catch (err) {
    console.warn("Mem0 add note:", err.message);
  }
};
