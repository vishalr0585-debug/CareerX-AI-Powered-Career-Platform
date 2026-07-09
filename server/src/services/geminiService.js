/**
 * AI Service — Multi-provider AI helper for CareerX
 *
 * Provider chain (tries in order):
 *   1. Groq  — Free tier, 30 RPM, llama-3.3-70b (best free option)
 *   2. Gemini — Google free tier, 10 RPM, gemini-2.0-flash
 *
 * Set GROQ_API_KEY and/or GEMINI_API_KEY in .env.
 * At least one must be present for AI features to work.
 */
const { GoogleGenerativeAI } = require("@google/generative-ai");

// ── Provider config ────────────────────────────────────────────────────────
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GROQ_KEY = process.env.GROQ_API_KEY;

const genAI = GEMINI_KEY ? new GoogleGenerativeAI(GEMINI_KEY) : null;

const GEMINI_MODELS = ["gemini-2.0-flash", "gemini-2.0-flash-lite"];
const GROQ_MODELS = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const MAX_RETRIES = 1;
const BASE_DELAY_MS = 1500;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Groq API (OpenAI-compatible REST) ──────────────────────────────────────
async function groqRequest(messages, options = {}, model = GROQ_MODELS[0]) {
  const body = {
    model,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 4096,
  };
  if (options.json) body.response_format = { type: "json_object" };

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const e = new Error(
      `Groq ${res.status}: ${err.error?.message || res.statusText}`
    );
    e.status = res.status;
    throw e;
  }
  const data = await res.json();
  return data.choices[0].message.content;
}

// ── Retry + model-fallback wrapper ─────────────────────────────────────────
async function withRetryAndFallback(callFn, models, label) {
  for (const modelName of models) {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await callFn(modelName);
      } catch (err) {
        const msg = err.message || "";
        const is429 = msg.includes("429") || err.status === 429;
        const is503 = msg.includes("503") || err.status === 503;
        const is404 = msg.includes("404") || err.status === 404;
        const isRetryable = is429 || is503;

        if (is404) {
          console.warn(`[${label}] ${modelName} — 404, skipping...`);
          break;
        }
        if (isRetryable && attempt < MAX_RETRIES) {
          const delay =
            BASE_DELAY_MS * Math.pow(2, attempt) + Math.random() * 500;
          console.warn(
            `[${label}] ${modelName} — ${is429 ? "429" : "503"}, retry in ${Math.round(delay)}ms...`
          );
          await sleep(delay);
          continue;
        }
        if (isRetryable) {
          console.warn(
            `[${label}] ${modelName} — exhausted retries, next model...`
          );
          break;
        }
        throw err;
      }
    }
  }
  throw new Error(`[${label}] All models exhausted`);
}

// ── Provider runners ───────────────────────────────────────────────────────
async function runGroqText(prompt, options) {
  return withRetryAndFallback(
    async (model) => {
      const result = await groqRequest(
        [{ role: "user", content: prompt }],
        options,
        model
      );
      console.log(`[Groq] generateText succeeded — ${model}`);
      return result;
    },
    GROQ_MODELS,
    "Groq:Text"
  );
}

async function runGeminiText(prompt, options) {
  return withRetryAndFallback(
    async (modelName) => {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxTokens ?? 4096,
          topP: 0.9,
        },
      });
      console.log(`[Gemini] generateText succeeded — ${modelName}`);
      return result.response.text();
    },
    GEMINI_MODELS,
    "Gemini:Text"
  );
}

async function runGroqJSON(prompt, options) {
  return withRetryAndFallback(
    async (model) => {
      const text = await groqRequest(
        [{ role: "user", content: prompt }],
        { ...options, temperature: options.temperature ?? 0.3, json: true },
        model
      );
      const parsed = JSON.parse(text.trim());
      console.log(`[Groq] generateJSON succeeded — ${model}`);
      return parsed;
    },
    GROQ_MODELS,
    "Groq:JSON"
  );
}

async function runGeminiJSON(fullPrompt, options) {
  return withRetryAndFallback(
    async (modelName) => {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
        generationConfig: {
          temperature: options.temperature ?? 0.3,
          maxOutputTokens: options.maxTokens ?? 4096,
          topP: 0.9,
          responseMimeType: "application/json",
        },
      });
      const text = result.response.text().trim();
      const parsed = JSON.parse(text);
      console.log(`[Gemini] generateJSON succeeded — ${modelName}`);
      return parsed;
    },
    GEMINI_MODELS,
    "Gemini:JSON"
  );
}

async function runGroqChat(history, newMessage, systemInstruction) {
  return withRetryAndFallback(
    async (model) => {
      const messages = [];
      if (systemInstruction)
        messages.push({ role: "system", content: systemInstruction });
      for (const msg of history || []) {
        messages.push({
          role: msg.role === "model" ? "assistant" : msg.role,
          content: msg.parts?.[0]?.text || msg.content || "",
        });
      }
      messages.push({ role: "user", content: newMessage });
      const result = await groqRequest(messages, {}, model);
      console.log(`[Groq] chat succeeded — ${model}`);
      return result;
    },
    GROQ_MODELS,
    "Groq:Chat"
  );
}

async function runGeminiChat(history, newMessage, systemInstruction) {
  return withRetryAndFallback(
    async (modelName) => {
      const chatModel = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemInstruction || undefined,
      });
      const chatSession = chatModel.startChat({
        history: history || [],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          topP: 0.9,
        },
      });
      const result = await chatSession.sendMessage(newMessage);
      console.log(`[Gemini] chat succeeded — ${modelName}`);
      return result.response.text();
    },
    GEMINI_MODELS,
    "Gemini:Chat"
  );
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Generate a text response from a prompt.
 * Tries Groq → Gemini → throws.
 */
async function generateText(prompt, options = {}) {
  if (GROQ_KEY) {
    try {
      return await runGroqText(prompt, options);
    } catch (e) {
      console.warn("[AI] Groq text failed, trying Gemini:", e.message);
    }
  }
  if (genAI) {
    return runGeminiText(prompt, options);
  }
  throw new Error("No AI provider available. Set GROQ_API_KEY or GEMINI_API_KEY in .env");
}

/**
 * Generate & parse a JSON response.
 * Tries Groq → Gemini → throws.
 */
async function generateJSON(prompt, options = {}) {
  const fullPrompt =
    prompt +
    "\n\nIMPORTANT: Respond with ONLY valid JSON. No markdown, no backticks, no extra text. Just the JSON object/array.";

  if (GROQ_KEY) {
    try {
      return await runGroqJSON(fullPrompt, options);
    } catch (e) {
      console.warn("[AI] Groq JSON failed, trying Gemini:", e.message);
    }
  }
  if (genAI) {
    return runGeminiJSON(fullPrompt, options);
  }
  throw new Error("No AI provider available. Set GROQ_API_KEY or GEMINI_API_KEY in .env");
}

/**
 * Multi-turn chat with conversation history.
 * history = [{ role: "user"|"model", parts: [{ text }] }]
 * Tries Groq → Gemini → throws.
 */
async function chat(history, newMessage, systemInstruction) {
  if (GROQ_KEY) {
    try {
      return await runGroqChat(history, newMessage, systemInstruction);
    } catch (e) {
      console.warn("[AI] Groq chat failed, trying Gemini:", e.message);
    }
  }
  if (genAI) {
    return runGeminiChat(history, newMessage, systemInstruction);
  }
  throw new Error("No AI provider available. Set GROQ_API_KEY or GEMINI_API_KEY in .env");
}

module.exports = { generateText, generateJSON, chat };
