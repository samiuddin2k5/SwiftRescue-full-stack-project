import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Initialize Google GenAI client (Secure / Server-side)
// We handle missing key gracefully so the backend never crashes on cold start.
export let aiClient = null;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (GEMINI_API_KEY && GEMINI_API_KEY !== "MY_GEMINI_API_KEY") {
  try {
    aiClient = new GoogleGenAI({
      apiKey: GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("✅ Google GenAI client initialized successfully under backend controller.");
  } catch (err) {
    console.error("❌ Failed to initialize Google GenAI client in backend:", err);
  }
} else {
  console.log("⚠️ GEMINI_API_KEY not configured or placeholder detected. Chatbots will use fallback mechanisms.");
}
