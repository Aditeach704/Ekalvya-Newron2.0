import { GoogleGenAI } from "@google/genai";

const DEFAULT_MODEL = "gemini-2.8-flash";

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === "your_google_ai_studio_api_key_here") {
    const error = new Error("Gemini is not configured. Add GEMINI_API_KEY to your .env file and restart Newron.");
    error.statusCode = 503;
    throw error;
  }
  return new GoogleGenAI({ apiKey });
}

/** Generate a Newron response using Gemini, optionally with Google Search grounding. */
export async function generateWithGemini({
  message,
  history = [],
  useGoogleSearch = false,
  image = null,
  systemInstruction = "",
} = {}) {
  if (typeof message !== "string" || !message.trim()) {
    const error = new Error("Please enter a message.");
    error.statusCode = 400;
    throw error;
  }

  const contents = [];
  for (const item of Array.isArray(history) ? history.slice(-24) : []) {
    if (!item || !["user", "assistant", "model"].includes(item.role)) continue;
    const text = typeof item.text === "string" ? item.text.trim() :
      typeof item.content === "string" ? item.content.trim() : "";
    if (!text) continue;
    contents.push({
      role: item.role === "assistant" ? "model" : item.role,
      parts: [{ text: text.slice(0, 20_000) }],
    });
  }

  const parts = [{ text: message.trim() }];
  if (image != null) {
    if (typeof image.data !== "string" || typeof image.mimeType !== "string") {
      const error = new Error("Image data is invalid.");
      error.statusCode = 400;
      throw error;
    }
    const allowed = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
    if (!allowed.has(image.mimeType)) {
      const error = new Error("Image type must be PNG, JPEG, WEBP, or GIF.");
      error.statusCode = 415;
      throw error;
    }
    const raw = image.data.replace(/^data:[^,]+,/, "");
    if (!raw || raw.length > 8_000_000) {
      const error = new Error("Image is empty or too large. Please use an image under about 6 MB.");
      error.statusCode = 413;
      throw error;
    }
    parts.push({ inlineData: { mimeType: image.mimeType, data: raw } });
  }
  contents.push({ role: "user", parts });

  const ai = getClient();
  let response;
  try {
    response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL,
      contents,
      config: {
        systemInstruction: systemInstruction || "You are Ekalyva Newron ANI, a helpful, capable, friendly AI assistant. Be clear, accurate, and honest. If uncertain, say so. Never claim you performed actions you did not perform.",
        ...(useGoogleSearch ? { tools: [{ googleSearch: {} }] } : {}),
      },
    });
  } catch (cause) {
    const error = new Error(cause?.message || "Gemini request failed.");
    error.cause = cause;
    if (/429|quota|rate.?limit|RESOURCE_EXHAUSTED/i.test(error.message)) error.statusCode = 429;
    else if (/401|403|API key|permission|unauthorized/i.test(error.message)) error.statusCode = 502;
    else if (/timeout|deadline/i.test(error.message)) error.statusCode = 504;
    throw error;
  }

  const answer = typeof response?.text === "string" ? response.text.trim() : "";
  if (!answer) {
    const finishReason = response?.candidates?.[0]?.finishReason;
    const error = new Error(finishReason
      ? `Gemini returned no text (finish reason: ${finishReason}). Try rephrasing your message.`
      : "Gemini returned no text. Please try again or check your API quota.");
    error.statusCode = 502;
    throw error;
  }

  const metadata = response.candidates?.[0]?.groundingMetadata;
  const seen = new Set();
  const citations = (metadata?.groundingChunks || [])
    .map((chunk) => chunk?.web)
    .filter((web) => web && typeof web.uri === "string" && /^https?:\/\//i.test(web.uri))
    .filter((web) => {
      if (seen.has(web.uri)) return false;
      seen.add(web.uri);
      return true;
    })
    .map((web) => ({ title: typeof web.title === "string" && web.title ? web.title : web.uri, url: web.uri }));

  return {
    reply: answer,
    citations,
    searchQueries: Array.isArray(metadata?.webSearchQueries) ? metadata.webSearchQueries : [],
    provider: "google-gemini",
  };
}
