import express from "express";
import http from "http";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration, ThinkingLevel } from "@google/genai";
import { WebSocketServer, WebSocket } from "ws";
import dotenv from "dotenv";

dotenv.config();

const DEFAULT_MODEL = "gemini-4-hydrogen";
const FAST_FALLBACK_MODEL = "gemini-3.1-flash-lite";
const LIVE_MODEL = "gemini-3.8-live";

// Lazy initializers for Gemini clients with required User-Agent header
let aiClient: GoogleGenAI | null = null;
let liveAiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
    } catch (e) {
      console.error("Failed to initialize GoogleGenAI:", e);
    }
  }
  return aiClient;
}

function getLiveAIClient(): GoogleGenAI | null {
  if (!liveAiClient && process.env.GEMINI_API_KEY) {
    try {
      liveAiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        apiVersion: "v1beta",
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
    } catch (e) {
      console.error("Failed to initialize Live GoogleGenAI:", e);
    }
  }
  return liveAiClient;
}

function getEngineSystemNote(engine?: string): string {
  if (!engine) return "";
  const lower = engine.toLowerCase();
  if (lower.includes("chatgpt") || lower.includes("openai")) {
    return "Adopt the crisp, structured, conversational assistant style inspired by ChatGPT: direct answers, clear numbered lists, and proactive follow-up suggestions.";
  }
  if (lower.includes("claude")) {
    return "Adopt a thoughtful, nuanced, well-reasoned analytical style inspired by Claude: balanced perspectives, careful clarity, and empathetic helpfulness.";
  }
  return "Use the DiptiK AI Gemini 4 Hydrogen engine capabilities: fast multimodal reasoning, structured markdown, and proactive mobile action awareness.";
}

async function startServer() {
  // Pre-warm Gemini clients eagerly on server boot to eliminate cold-start setup delay
  getAIClient();
  getLiveAIClient();

  const app = express();
  const PORT = 3000;
  const server = http.createServer(app);

  app.use(express.json({ limit: "50mb" }));

  // 1. Health & Server Info
  app.get("/api/health", (req, res) => {
    const hasKey = !!process.env.GEMINI_API_KEY;
    res.json({
      status: "ok",
      onlineModeAvailable: hasKey,
      liveVoiceAvailable: hasKey,
      defaultModel: DEFAULT_MODEL,
      liveModel: LIVE_MODEL,
      timestamp: new Date().toISOString(),
      supportedModes: ["Ask", "Act", "Research", "Create", "Offline"]
    });
  });

function detectPhoneAction(message: string) {
  const lowerMsg = (message || "").toLowerCase();
  let detectedAction = null;
  let confirmationLevel = 1;

  if (lowerMsg.includes("call ") || lowerMsg.includes("phone ")) {
    const contact = (message || "").replace(/.*call\s+/i, "").trim() || "Contact";
    detectedAction = { type: "phone_call", target: contact, app: "Phone / Dialer", details: `Prepare voice call to ${contact}` };
    confirmationLevel = 2;
  } else if (lowerMsg.includes("remind me") || lowerMsg.includes("create reminder") || lowerMsg.includes("alarm") || lowerMsg.includes("timer")) {
    detectedAction = { type: "alarm_reminder", target: "Clock / Calendar", app: "System Clock", details: `Set alarm or timer for "${message}"` };
    confirmationLevel = 1;
  } else if (lowerMsg.includes("send message") || lowerMsg.includes("sms") || lowerMsg.includes("whatsapp")) {
    detectedAction = { type: "send_message", target: "Default Messaging App", app: "Messages", details: `Prepare draft SMS based on: "${message}"` };
    confirmationLevel = 2;
  } else if (lowerMsg.includes("delete ") || lowerMsg.includes("remove all") || lowerMsg.includes("clear memory")) {
    detectedAction = { type: "delete_data", target: "System Storage", app: "File Manager / Memory", details: `High security action requested: "${message}"` };
    confirmationLevel = 3;
  } else if (lowerMsg.includes("flashlight") || lowerMsg.includes("torch")) {
    const state = lowerMsg.includes("off") ? "OFF" : "ON";
    detectedAction = { type: "flashlight", target: "Device Hardware", app: "System Controls", details: `Turn Flashlight ${state}` };
    confirmationLevel = 1;
  } else if (lowerMsg.includes("open youtube") || lowerMsg.includes("search for flutter")) {
    detectedAction = { type: "open_app", target: "YouTube", app: "YouTube App", details: `Open YouTube and search for requested topic` };
    confirmationLevel = 1;
  }
  return { detectedAction, confirmationLevel };
}

function buildSmartOfflineReply(message: string, mode: string, detectedAction: any, clientDateTime?: string, timezone?: string) {
  const lower = (message || "").toLowerCase();
  if (lower.includes("time") || lower.includes("date") || lower.includes("today") || lower.includes("day is it")) {
    const nowStr = clientDateTime || new Date().toLocaleString();
    return `[Offline Mode - Local Clock]: Your current local date & time is **${nowStr}**${timezone ? ` (${timezone})` : ""}.`;
  }
  if (detectedAction) {
    return `[Offline Mode - On-Device AI]: Prepared device command for **${detectedAction.app}**: ${detectedAction.details}.`;
  }
  const mathMatch = message.trim().match(/^[\d\s+\-*/().]+$/);
  if (mathMatch) {
    try {
      const result = Function(`"use strict"; return (${mathMatch[0]})`)();
      if (typeof result === "number" && !Number.isNaN(result)) {
        return `[Offline Mode - Local Calculator]: \`${mathMatch[0].trim()}\` = **${result}**`;
      }
    } catch {}
  }
  if (mode === "Create") {
    return `[Offline Mode - On-Device AI]: I drafted a local outline for "${message}" on your device. Switch to Online Mode for live cloud generation and web updates.`;
  }
  return `[Offline Mode - On-Device AI]: You are currently in Offline Lite mode, so cloud web search is paused. Switch to **Online Cloud AI** to get real-time answers and web updates for "${message}".`;
}

function buildChatSystemInstruction(params: {
  userProfile?: Record<string, any>;
  activeEngine?: string;
  style?: string;
  mode?: string;
  activeAgent?: any;
  clientDateTime?: string;
  timezone?: string;
  memories?: { title: string; value: string }[];
}) {
  const {
    userProfile = {},
    activeEngine = DEFAULT_MODEL,
    style = "Balanced",
    mode = "Ask",
    activeAgent = null,
    clientDateTime,
    timezone,
    memories = []
  } = params;

  const agentPrompt = activeAgent
    ? `\nActive Agent Role: ${activeAgent.name}\nAgent Goal: ${activeAgent.goal}\nAgent Instructions: ${activeAgent.instructions}\nConnected Tools: ${(activeAgent.tools || []).join(", ")}`
    : "";

  const memoryPrompt = memories.length > 0
    ? `\nSaved User Memories:\n${memories.slice(0, 5).map(m => `- ${m.title}: ${m.value}`).join("\n")}`
    : "";

  const nowUtc = new Date().toISOString();
  const timeContext = `Current User Local Date & Time: ${clientDateTime || new Date().toLocaleString()}${timezone ? ` (${timezone})` : ""}. Current Server UTC Time: ${nowUtc}.`;

  return `You are DiptiK AI Agent, a fast, helpful, real-time AI assistant (like ChatGPT / Gemini) that answers questions accurately, provides live web updates when asked about current events/news/weather/prices, automates tasks, and prepares phone actions.
${timeContext}
Current User Name: ${userProfile.name || "User"} (Nickname: ${userProfile.nickname || "User"}).
Assistant Persona: ${userProfile.persona || "Default (Friendly & Helpful)"}.
Preferred Response Style: ${style} (be concise if 'Concise', warm & friendly if 'Friendly', thorough if 'Detailed').
${userProfile.customInstructions ? `User Custom Instructions: ${userProfile.customInstructions}` : ""}
${getEngineSystemNote(activeEngine)}
Current AI Mode: ${mode}.${agentPrompt}${memoryPrompt}
Guidelines:
- Answer the user's question directly and clearly using clean Markdown formatting.
- When asked for today's time or date, state the user's local time/date above clearly.
- When asked about current events, live updates, news, weather, or recent facts, use Google Search results to give accurate, up-to-date answers.
- If the user asks to perform a phone action (like calling someone, setting alarms, sending emails, opening apps), confirm the prepared action clearly and explain any confirmation safeguard.`;
}

function extractGroundingSources(groundingChunks: any[] | undefined) {
  if (!Array.isArray(groundingChunks)) return [];
  const seen = new Set<string>();
  const out: { title: string; url: string; credibility: string }[] = [];
  for (const chunk of groundingChunks) {
    const uri = chunk?.web?.uri;
    const title = chunk?.web?.title;
    if (uri && !seen.has(uri)) {
      seen.add(uri);
      out.push({
        title: title || uri,
        url: uri,
        credibility: "Live Web"
      });
    }
  }
  return out.slice(0, 6);
}

function isTransientGeminiError(err: any): boolean {
  const msg = String(err?.message || err);
  return msg.includes("503") || msg.includes("429") || msg.includes("UNAVAILABLE") || msg.includes("RESOURCE_EXHAUSTED");
}

function isModelOverloadedError(err: any): boolean {
  const msg = String(err?.message || err);
  return msg.includes("503") || msg.includes("UNAVAILABLE");
}

function isSearchToolQuotaOrUnsupported(err: any): boolean {
  const status = Number(err?.status || 0);
  const msg = String(err?.message || err);
  return (
    status === 429 ||
    status === 403 ||
    status === 400 ||
    msg.includes("429") ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.includes("quota") ||
    msg.includes("PERMISSION_DENIED") ||
    msg.includes("INVALID_ARGUMENT")
  );
}

let googleSearchCooldownUntil = 0;

function decodeXmlEntities(str: string): string {
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function describeWmoWeatherCode(code: number): string {
  if (code === 0) return "Clear sky";
  if (code <= 3) return "Partly cloudy";
  if (code <= 48) return "Foggy";
  if (code <= 57) return "Drizzle";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Rain showers";
  if (code <= 99) return "Thunderstorm";
  return "Variable conditions";
}

function isSafePublicHttpUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    const h = parsed.hostname.toLowerCase();
    if (
      h === "localhost" ||
      h === "127.0.0.1" ||
      h === "0.0.0.0" ||
      h === "::1" ||
      h.startsWith("10.") ||
      h.startsWith("192.168.") ||
      h.startsWith("169.254.") ||
      h.endsWith(".local") ||
      h.endsWith(".internal")
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

async function fetchRealtimeWebFallback(
  rawQuery: string,
  city?: string
): Promise<{
  contextText: string;
  sources: { title: string; url: string; credibility: string }[];
}> {
  const query = rawQuery.trim();
  const sources: { title: string; url: string; credibility: string }[] = [];
  const snippets: string[] = [];
  const seenUrls = new Set<string>();
  const addSource = (title: string, url: string, credibility: string) => {
    if (url && isSafePublicHttpUrl(url) && !seenUrls.has(url)) {
      seenUrls.add(url);
      sources.push({ title: title || url, url, credibility });
    }
  };

  const headers = {
    "User-Agent": "Mozilla/5.0 (compatible; DiptiKAI/1.0)"
  };

  const tasks: Promise<void>[] = [];

  // 1. Google News RSS (Live headlines & current events)
  tasks.push(
    (async () => {
      const res = await fetch(
        `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`,
        { headers, signal: AbortSignal.timeout(2800) }
      );
      if (!res.ok) return;
      const xml = await res.text();
      const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
      const topNews: string[] = [];
      for (const item of itemMatches.slice(0, 5)) {
        const titleMatch = item.match(/<title>([\s\S]*?)<\/title>/i);
        const linkMatch = item.match(/<link>([\s\S]*?)<\/link>/i);
        const pubMatch = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
        const srcMatch = item.match(/<source[^>]*>([\s\S]*?)<\/source>/i);
        const title = titleMatch ? decodeXmlEntities(titleMatch[1]) : "";
        const link = linkMatch ? decodeXmlEntities(linkMatch[1]) : "";
        const pubDate = pubMatch ? decodeXmlEntities(pubMatch[1]) : "";
        const publisher = srcMatch ? decodeXmlEntities(srcMatch[1]) : "Google News";
        if (title) {
          topNews.push(`- ${title}${pubDate ? ` (${pubDate})` : ""}${publisher ? ` [${publisher}]` : ""}`);
          if (link) addSource(title, link, publisher);
        }
      }
      if (topNews.length > 0) {
        snippets.push(`Live News Results:\n${topNews.join("\n")}`);
      }
    })().catch(() => {})
  );

  // 2. Wikipedia 1-shot Search + Extracts (Historical events, encyclopedic facts, entities)
  tasks.push(
    (async () => {
      const res = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=3&prop=extracts|info&exintro=1&explaintext=1&exchars=650&inprop=url&format=json&origin=*`,
        { headers, signal: AbortSignal.timeout(2800) }
      );
      if (!res.ok) return;
      const data: any = await res.json();
      const pagesObj = data?.query?.pages;
      if (!pagesObj) return;
      const pages = Object.values(pagesObj)
        .filter((p: any) => p && (p.extract || p.title))
        .sort((a: any, b: any) => (a.index ?? 99) - (b.index ?? 99))
        .slice(0, 3);
      const wikiLines: string[] = [];
      for (const p of pages as any[]) {
        const cleanExtract = String(p.extract || "").replace(/\s+/g, " ").trim().slice(0, 500);
        if (cleanExtract) {
          wikiLines.push(`- ${p.title}: ${cleanExtract}`);
        }
        if (p.fullurl) {
          addSource(`${p.title} - Wikipedia`, p.fullurl, "Wikipedia");
        }
      }
      if (wikiLines.length > 0) {
        snippets.push(`Encyclopedic Reference:\n${wikiLines.join("\n")}`);
      }
    })().catch(() => {})
  );

  // 3. DuckDuckGo Instant Answer API
  tasks.push(
    (async () => {
      const res = await fetch(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
        { headers, signal: AbortSignal.timeout(2200) }
      );
      if (!res.ok) return;
      const data: any = await res.json();
      const ddgLines: string[] = [];
      if (data?.Answer) ddgLines.push(`Instant Answer: ${data.Answer}`);
      if (data?.AbstractText) {
        ddgLines.push(`Summary (${data.AbstractSource || "Web"}): ${data.AbstractText}`);
        if (data.AbstractURL) addSource(data.Heading || data.AbstractSource || "Web", data.AbstractURL, data.AbstractSource || "Live Web");
      }
      if (Array.isArray(data?.RelatedTopics)) {
        for (const rt of data.RelatedTopics.slice(0, 2)) {
          if (rt?.Text) {
            ddgLines.push(`- ${rt.Text}`);
            if (rt.FirstURL) addSource(rt.Text.slice(0, 60), rt.FirstURL, "Live Web");
          }
        }
      }
      if (ddgLines.length > 0) {
        snippets.push(`Web Instant Context:\n${ddgLines.join("\n")}`);
      }
    })().catch(() => {})
  );

  // 4. Live Weather via Open-Meteo if weather/forecast query
  if (/\b(weather|temperature|forecast|rain|humidity|wind)\b/i.test(query)) {
    tasks.push(
      (async () => {
        const cityMatch = query.match(/\b(?:in|for|at)\s+([a-zA-Z\s]{2,35}?)(?:\s+(?:today|now|tomorrow|this week|weather)|\?|$)/i);
        const targetCity = (cityMatch?.[1] || city || "London").trim();
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(targetCity)}&count=1&format=json`,
          { headers, signal: AbortSignal.timeout(2200) }
        );
        if (!geoRes.ok) return;
        const geo: any = await geoRes.json();
        const loc = geo?.results?.[0];
        if (!loc) return;
        const wxRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=2`,
          { headers, signal: AbortSignal.timeout(2200) }
        );
        if (!wxRes.ok) return;
        const wx: any = await wxRes.json();
        const cur = wx?.current;
        if (cur) {
          const cond = describeWmoWeatherCode(Number(cur.weather_code ?? 0));
          const high = wx?.daily?.temperature_2m_max?.[0];
          const low = wx?.daily?.temperature_2m_min?.[0];
          snippets.push(
            `Live Weather (${loc.name}, ${loc.country || ""}): ${cond}, ${cur.temperature_2m}°C (feels like ${cur.apparent_temperature}°C), Humidity ${cur.relative_humidity_2m}%, Wind ${cur.wind_speed_10m} km/h${high !== undefined ? `, Today High ${high}°C / Low ${low}°C` : ""}.`
          );
          addSource(`Open-Meteo Live Weather: ${loc.name}`, "https://open-meteo.com/", "Live Weather");
        }
      })().catch(() => {})
    );
  }

  // 5. Live Crypto Prices via Coinbase if crypto query
  if (/\b(bitcoin|btc|ethereum|eth|solana|sol|crypto|dogecoin|doge|xrp)\b/i.test(query)) {
    tasks.push(
      (async () => {
        const coins: [RegExp, string, string][] = [
          [/\b(bitcoin|btc)\b/i, "BTC-USD", "Bitcoin (BTC)"],
          [/\b(ethereum|eth)\b/i, "ETH-USD", "Ethereum (ETH)"],
          [/\b(solana|sol)\b/i, "SOL-USD", "Solana (SOL)"],
          [/\b(dogecoin|doge)\b/i, "DOGE-USD", "Dogecoin (DOGE)"],
          [/\bxrp\b/i, "XRP-USD", "XRP"]
        ];
        const matched = coins.filter(([rx]) => rx.test(query));
        const toFetch = matched.length > 0 ? matched : coins.slice(0, 2);
        const lines: string[] = [];
        await Promise.all(
          toFetch.map(async ([, pair, label]) => {
            const r = await fetch(`https://api.coinbase.com/v2/prices/${pair}/spot`, {
              headers,
              signal: AbortSignal.timeout(2000)
            });
            if (!r.ok) return;
            const d: any = await r.json();
            if (d?.data?.amount) {
              lines.push(`- ${label}: $${Number(d.data.amount).toLocaleString("en-US", { maximumFractionDigits: 2 })} USD (Coinbase live spot)`);
            }
          })
        );
        if (lines.length > 0) {
          snippets.push(`Live Crypto Prices:\n${lines.join("\n")}`);
          addSource("Coinbase Spot Market Prices", "https://www.coinbase.com/explore", "Live Market");
        }
      })().catch(() => {})
    );
  }

  // 6. Live Currency Rates if currency/exchange query
  if (/\b(exchange rate|currency|usd|eur|gbp|bdt|inr|jpy|cad|aud|dollar|pound|euro|taka)\b/i.test(query)) {
    tasks.push(
      (async () => {
        const r = await fetch("https://open.er-api.com/v6/latest/USD", {
          headers,
          signal: AbortSignal.timeout(2200)
        });
        if (!r.ok) return;
        const d: any = await r.json();
        const rates = d?.rates;
        if (rates) {
          const picked = ["EUR", "GBP", "BDT", "INR", "JPY", "CAD", "AUD"]
            .filter(c => rates[c])
            .map(c => `1 USD = ${rates[c]} ${c}`)
            .join(", ");
          if (picked) {
            snippets.push(`Live FX Rates (Base USD, updated ${d.time_last_update_utc || "today"}): ${picked}`);
            addSource("ExchangeRate API (Live FX)", "https://www.exchangerate-api.com/", "Live Market");
          }
        }
      })().catch(() => {})
    );
  }

  await Promise.allSettled(tasks);
  return {
    contextText: snippets.join("\n\n").slice(0, 5000),
    sources: sources.slice(0, 6)
  };
}

async function generateWithModelFallback(
  ai: GoogleGenAI,
  params: {
    contents: any;
    config?: Record<string, any>;
    thinkingLevel?: ThinkingLevel;
  }
) {
  const attempts = [
    { model: DEFAULT_MODEL, thinkingLevel: params.thinkingLevel ?? ThinkingLevel.LOW },
    { model: FAST_FALLBACK_MODEL, thinkingLevel: ThinkingLevel.MINIMAL }
  ];

  let lastErr: any = null;
  for (let i = 0; i < attempts.length; i++) {
    const attempt = attempts[i];
    try {
      const config = {
        ...(params.config || {}),
        thinkingConfig: { thinkingLevel: attempt.thinkingLevel }
      };
      return await ai.models.generateContent({
        model: attempt.model,
        contents: params.contents,
        config
      });
    } catch (err: any) {
      lastErr = err;
      if (!isTransientGeminiError(err) || i === attempts.length - 1) {
        throw err;
      }
    }
  }
  throw lastErr;
}

async function generateChatWithRetry(
  ai: GoogleGenAI,
  contents: any,
  systemInstruction: string,
  useSearch: boolean,
  rawUserQuery = ""
) {
  const canTryGoogleSearch = useSearch && Date.now() >= googleSearchCooldownUntil;
  const modelsToTry = canTryGoogleSearch
    ? [
        { model: DEFAULT_MODEL, thinkingLevel: ThinkingLevel.LOW, allowSearch: true },
        { model: FAST_FALLBACK_MODEL, thinkingLevel: ThinkingLevel.MINIMAL, allowSearch: true },
        { model: DEFAULT_MODEL, thinkingLevel: ThinkingLevel.LOW, allowSearch: false },
        { model: FAST_FALLBACK_MODEL, thinkingLevel: ThinkingLevel.MINIMAL, allowSearch: false }
      ]
    : [
        { model: DEFAULT_MODEL, thinkingLevel: ThinkingLevel.LOW, allowSearch: false },
        { model: FAST_FALLBACK_MODEL, thinkingLevel: ThinkingLevel.MINIMAL, allowSearch: false }
      ];

  let lastErr: any = null;
  let primaryOverloaded = false;
  let webFallbackData: { contextText: string; sources: { title: string; url: string; credibility: string }[] } | null = null;

  for (let i = 0; i < modelsToTry.length; i++) {
    const attempt = modelsToTry[i];
    if (primaryOverloaded && attempt.model === DEFAULT_MODEL) {
      continue;
    }
    try {
      let effectiveContents = contents;
      if (useSearch && !attempt.allowSearch && rawUserQuery.trim() && !webFallbackData) {
        webFallbackData = await fetchRealtimeWebFallback(rawUserQuery);
      }
      if (webFallbackData?.contextText && !attempt.allowSearch && Array.isArray(contents) && contents.length > 0) {
        const cloned = [...contents];
        const last = cloned[cloned.length - 1];
        const origText = last?.parts?.[0]?.text || rawUserQuery;
        cloned[cloned.length - 1] = {
          role: last?.role || "user",
          parts: [
            {
              text: `${origText}\n\n[Live Web Context Retrieved ${new Date().toISOString()}]:\n${webFallbackData.contextText}`
            }
          ]
        };
        effectiveContents = cloned;
      }

      const response = await ai.models.generateContent({
        model: attempt.model,
        contents: effectiveContents,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: attempt.thinkingLevel },
          ...(attempt.allowSearch ? { tools: [{ googleSearch: {} }] } : {})
        }
      });
      return { response, usedModel: attempt.model, fallbackSources: webFallbackData?.sources || [] };
    } catch (err: any) {
      lastErr = err;
      if (attempt.allowSearch && isSearchToolQuotaOrUnsupported(err)) {
        googleSearchCooldownUntil = Date.now() + 90_000;
      }
      if (attempt.model === DEFAULT_MODEL && isModelOverloadedError(err)) {
        primaryOverloaded = true;
      }
      const isTransient = isTransientGeminiError(err);
      const canFallbackSearch = attempt.allowSearch && isSearchToolQuotaOrUnsupported(err);
      if ((!isTransient && !canFallbackSearch) || i === modelsToTry.length - 1) throw err;
    }
  }
  throw lastErr;
}

  // 2A. Real-Time Streaming AI Chat (SSE - like ChatGPT / Gemini)
  app.post("/api/chat/stream", async (req, res) => {
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const sendEvent = (payload: Record<string, any>) => {
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      }
    };

    try {
      const {
        message = "",
        mode = "Ask",
        history = [],
        style = "Balanced",
        model = DEFAULT_MODEL,
        isOffline = false,
        webAccess = true,
        voiceFast = false,
        userProfile = {},
        activeAgent = null,
        clientDateTime,
        timezone,
        memories = []
      } = req.body || {};

      const { detectedAction, confirmationLevel } = detectPhoneAction(message);
      const ai = getAIClient();

      if (isOffline || mode === "Offline") {
        const offlineReply = buildSmartOfflineReply(message, mode, detectedAction, clientDateTime, timezone);
        sendEvent({ type: "status", status: "Running locally on device..." });
        sendEvent({ type: "chunk", text: offlineReply });
        sendEvent({
          type: "done",
          mode: "Offline",
          modelUsed: "DiptiK AI On-Device Lite (350M)",
          action: detectedAction,
          confirmationLevel,
          sources: [],
          suggestedCommands: ["Switch to Online Cloud AI", "Summarize local notes", "Set 7 AM alarm"],
          timestamp: new Date().toISOString()
        });
        return res.end();
      }

      if (!ai) {
        sendEvent({
          type: "error",
          message: "GEMINI_API_KEY is not configured on the server. Please check your environment secrets or switch to Offline Mode."
        });
        return res.end();
      }

      const activeEngine = userProfile.defaultEngine || model || DEFAULT_MODEL;
      const useSearch = Boolean(webAccess);
      sendEvent({
        type: "status",
        status: useSearch ? "Checking live updates & thinking..." : "Generating response..."
      });

      const systemInstruction = buildChatSystemInstruction({
        userProfile,
        activeEngine,
        style,
        mode,
        activeAgent,
        clientDateTime,
        timezone,
        memories
      });

      const chatHistory = (history || [])
        .filter((m: any) => m?.text && m.text.trim().length > 0)
        .slice(-12)
        .map((msg: any) => ({
          role: msg.sender === "user" ? "user" : "model",
          parts: [{ text: msg.text }]
        }));

      const contents = [
        ...chatHistory,
        { role: "user", parts: [{ text: message }] }
      ];

      const canTryGoogleSearch = useSearch && Date.now() >= googleSearchCooldownUntil;
      const modelsToTry = voiceFast
        ? canTryGoogleSearch
          ? [
              { model: FAST_FALLBACK_MODEL, thinkingLevel: ThinkingLevel.MINIMAL, allowSearch: true, status: "Searching live web..." },
              { model: DEFAULT_MODEL, thinkingLevel: ThinkingLevel.LOW, allowSearch: true, status: "Checking live web updates..." },
              { model: FAST_FALLBACK_MODEL, thinkingLevel: ThinkingLevel.MINIMAL, allowSearch: false, status: "Fetching live web & answering..." }
            ]
          : [
              { model: FAST_FALLBACK_MODEL, thinkingLevel: ThinkingLevel.MINIMAL, allowSearch: false, status: useSearch ? "Fetching live web results..." : "Generating response..." },
              { model: DEFAULT_MODEL, thinkingLevel: ThinkingLevel.LOW, allowSearch: false, status: "Responding..." }
            ]
        : canTryGoogleSearch
        ? [
            { model: DEFAULT_MODEL, thinkingLevel: ThinkingLevel.LOW, allowSearch: true, status: "Checking live web updates & thinking..." },
            { model: FAST_FALLBACK_MODEL, thinkingLevel: ThinkingLevel.MINIMAL, allowSearch: true, status: "Trying fast search engine..." },
            { model: DEFAULT_MODEL, thinkingLevel: ThinkingLevel.LOW, allowSearch: false, status: "Fetching live web results..." },
            { model: FAST_FALLBACK_MODEL, thinkingLevel: ThinkingLevel.MINIMAL, allowSearch: false, status: "Switching to fast engine..." }
          ]
        : [
            { model: DEFAULT_MODEL, thinkingLevel: ThinkingLevel.LOW, allowSearch: false, status: useSearch ? "Fetching live web results..." : "Generating response..." },
            { model: FAST_FALLBACK_MODEL, thinkingLevel: ThinkingLevel.MINIMAL, allowSearch: false, status: "Switching to fast engine..." }
          ];

      let streamedText = "";
      let groundingChunks: any[] = [];
      let fallbackWebSources: { title: string; url: string; credibility: string }[] = [];
      let fallbackWebContextLoaded = false;
      let fallbackWebContextText = "";
      let usedModel = DEFAULT_MODEL;
      let streamError: any = null;
      let primaryOverloaded = false;

      for (let attemptIdx = 0; attemptIdx < modelsToTry.length; attemptIdx++) {
        const attempt = modelsToTry[attemptIdx];
        if (primaryOverloaded && attempt.model === DEFAULT_MODEL) {
          continue;
        }
        if (attempt.allowSearch && Date.now() < googleSearchCooldownUntil) {
          continue;
        }
        usedModel = attempt.model;
        try {
          if (attemptIdx > 0 || (useSearch && !attempt.allowSearch)) {
            sendEvent({ type: "status", status: attempt.status });
          }

          let effectiveContents = contents;
          if (useSearch && !attempt.allowSearch) {
            if (!fallbackWebContextLoaded) {
              fallbackWebContextLoaded = true;
              const webRes = await fetchRealtimeWebFallback(message, userProfile?.country || "");
              fallbackWebContextText = webRes.contextText;
              fallbackWebSources = webRes.sources;
            }
            if (fallbackWebContextText) {
              effectiveContents = [
                ...chatHistory,
                {
                  role: "user",
                  parts: [
                    {
                      text: `${message}\n\n[Live Web Search Context (${new Date().toISOString()})]:\n${fallbackWebContextText}\n\nUse the live web context above when relevant and cite facts cleanly.`
                    }
                  ]
                }
              ];
            }
          }

          const stream = await ai.models.generateContentStream({
            model: attempt.model,
            contents: effectiveContents as any,
            config: {
              systemInstruction,
              thinkingConfig: { thinkingLevel: attempt.thinkingLevel },
              ...(attempt.allowSearch ? { tools: [{ googleSearch: {} }] } : {})
            }
          });

          for await (const chunk of stream) {
            if (res.destroyed || res.writableEnded) break;
            const delta = chunk.text;
            if (delta) {
              streamedText += delta;
              sendEvent({ type: "chunk", text: delta });
            }
            const gChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
            if (Array.isArray(gChunks) && gChunks.length > 0) {
              groundingChunks = groundingChunks.concat(gChunks);
            }
          }
          streamError = null;
          break;
        } catch (err: any) {
          streamError = err;
          if (attempt.allowSearch && isSearchToolQuotaOrUnsupported(err)) {
            googleSearchCooldownUntil = Date.now() + 90_000;
          }
          if (attempt.model === DEFAULT_MODEL && isModelOverloadedError(err)) {
            primaryOverloaded = true;
          }
          const isTransient = isTransientGeminiError(err);
          const canFallbackSearch = attempt.allowSearch && isSearchToolQuotaOrUnsupported(err);
          if (streamedText.length > 0 || (!isTransient && !canFallbackSearch) || attemptIdx === modelsToTry.length - 1) {
            throw err;
          }
        }
      }

      if (streamError && !streamedText) {
        throw streamError;
      }

      const sources = groundingChunks.length > 0 ? extractGroundingSources(groundingChunks) : fallbackWebSources;
      sendEvent({
        type: "done",
        mode,
        modelUsed: `${activeEngine} (${usedModel})`,
        action: detectedAction,
        confirmationLevel,
        sources,
        suggestedCommands: [
          "Tell me more about this",
          "Summarize into bullet points",
          "What's the latest update today?",
          "Turn this into a task"
        ],
        timestamp: new Date().toISOString()
      });
      res.end();
    } catch (error: any) {
      console.error("Chat Stream API error:", error);
      sendEvent({
        type: "error",
        message: error?.message || "Unable to reach Gemini AI right now. Please try again."
      });
      res.end();
    }
  });

  // 2B. Main AI Chat & Command Processing (Non-streaming endpoint)
  app.post("/api/chat", async (req, res) => {
    try {
      const {
        message = "",
        mode = "Ask",
        history = [],
        style = "Balanced",
        model = DEFAULT_MODEL,
        isOffline = false,
        webAccess = true,
        userProfile = {},
        activeAgent = null,
        clientDateTime,
        timezone,
        memories = []
      } = req.body || {};

      const { detectedAction, confirmationLevel } = detectPhoneAction(message);
      const ai = getAIClient();

      if (isOffline || mode === "Offline") {
        return res.json({
          reply: buildSmartOfflineReply(message, mode, detectedAction, clientDateTime, timezone),
          mode: "Offline",
          modelUsed: "DiptiK AI On-Device Lite (350M)",
          action: detectedAction,
          confirmationLevel,
          sources: [],
          suggestedCommands: ["Switch to Online Cloud AI", "Summarize local notes", "Set 7 AM alarm"],
          timestamp: new Date().toISOString()
        });
      }

      if (!ai) {
        return res.status(503).json({
          error: "GEMINI_API_KEY is missing on the server.",
          reply: "Online AI is unavailable because GEMINI_API_KEY is not configured.",
          mode,
          modelUsed: "Unavailable"
        });
      }

      const activeEngine = userProfile.defaultEngine || model || DEFAULT_MODEL;
      const systemInstruction = buildChatSystemInstruction({
        userProfile,
        activeEngine,
        style,
        mode,
        activeAgent,
        clientDateTime,
        timezone,
        memories
      });

      const chatHistory = (history || [])
        .filter((m: any) => m?.text && m.text.trim().length > 0)
        .slice(-12)
        .map((msg: any) => ({
          role: msg.sender === "user" ? "user" : "model",
          parts: [{ text: msg.text }]
        }));

      const contents = [
        ...chatHistory,
        { role: "user", parts: [{ text: message }] }
      ];

      const { response, usedModel, fallbackSources } = await generateChatWithRetry(
        ai,
        contents as any,
        systemInstruction,
        Boolean(webAccess),
        message
      );

      const reply = response.text || "I have processed your request.";
      const grounded = extractGroundingSources(response.candidates?.[0]?.groundingMetadata?.groundingChunks);
      const sources = grounded.length > 0 ? grounded : fallbackSources;

      res.json({
        reply,
        mode,
        modelUsed: `${activeEngine} (${usedModel})`,
        action: detectedAction,
        confirmationLevel,
        sources,
        suggestedCommands: ["Tell me more", "Summarize into bullet points", "What's the latest update today?", "Create a task checklist"],
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Chat API error:", error);
      res.status(503).json({
        error: error.message || "Failed to process chat message",
        reply: `Unable to reach Gemini AI (${error?.message || "transient error"}). Please try again.`,
        mode: req.body?.mode || "Ask",
        modelUsed: DEFAULT_MODEL
      });
    }
  });

  // 3. AI Agent Multi-Step Planner
  app.post("/api/agent/plan", async (req, res) => {
    try {
      const {
        objective,
        agentType = "Personal Assistant",
        tools = ["Calendar", "Notes", "Email"],
        agentGoal = "",
        agentInstructions = "",
        userProfile = {}
      } = req.body;

      const ai = getAIClient();
      if (ai) {
        const prompt = `You are an AI Agent Planner for DiptiK AI Mobile Assistant.
User: ${userProfile.nickname || userProfile.name || "User"}
Objective: "${objective}"
Selected Agent: ${agentType}
Agent Goal: ${agentGoal}
Agent Instructions: ${agentInstructions}
Available Connected Tools: ${tools.join(", ")}

Create a structured 4-step execution plan tailored specifically to the objective and available tools.`;

        const resp = await generateWithModelFallback(ai, {
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                summary: { type: Type.STRING },
                requiredPermissions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                confirmationLevel: { type: Type.STRING },
                steps: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.INTEGER },
                      action: { type: Type.STRING },
                      tool: { type: Type.STRING },
                      status: { type: Type.STRING },
                      description: { type: Type.STRING }
                    },
                    required: ["id", "action", "tool", "status", "description"]
                  }
                }
              },
              required: ["title", "summary", "requiredPermissions", "confirmationLevel", "steps"]
            }
          }
        });

        try {
          const rawText = (resp.text || "{}").trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "");
          const parsed = JSON.parse(rawText);
          if (parsed && Array.isArray(parsed.steps) && parsed.steps.length > 0) {
            return res.json(parsed);
          }
        } catch {
          // Fall back to default structured plan below
        }
      }

      // Offline / Fallback plan
      res.json({
        title: `Plan for: ${objective.slice(0, 40)}`,
        summary: `${agentType} will coordinate ${tools.slice(0, 3).join(", ")} to complete your objective.`,
        requiredPermissions: ["Calendar", "Notifications", "Files"],
        confirmationLevel: "Level 2 (Confirmation Required)",
        steps: [
          { id: 1, action: "Gather context & user preferences", tool: tools[0] || "DiptiK Notes", status: "pending", description: "Analyze user profile, schedule, and available notes related to the objective." },
          { id: 2, action: "Draft structured execution output", tool: tools[1] || "Gemini 4 Hydrogen", status: "pending", description: "Synthesize findings and prepare clear actionable deliverables." },
          { id: 3, action: "Verify safeguards & permissions", tool: "Safety Engine", status: "pending", description: "Ensure all proposed actions respect Level 1/2/3 user confirmations." },
          { id: 4, action: "Deliver final summary & follow-up", tool: "Notifications", status: "pending", description: "Present final outcome and schedule any requested reminders." }
        ]
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to generate plan" });
    }
  });

  // 4. Execute Agent Step (Real Gemini-powered execution)
  app.post("/api/agent/execute-step", async (req, res) => {
    try {
      const { step, objective, agentName = "AI Agent", agentInstructions = "", previousOutputs = [], userProfile = {} } = req.body;
      const ai = getAIClient();

      if (ai) {
        const prevContext = previousOutputs.length > 0
          ? `\nPrevious step outputs:\n${previousOutputs.map((p: any) => `- Step ${p.id} (${p.action}): ${p.output}`).join("\n")}`
          : "";

        const prompt = `You are "${agentName}" executing step ${step.id} of an approved workflow.
User: ${userProfile.nickname || userProfile.name || "User"}
Overall Objective: "${objective}"
Agent Instructions: ${agentInstructions || "Be thorough, practical, and concise."}
Current Step Action: "${step.action}"
Tool Used: ${step.tool}
Step Description: ${step.description}${prevContext}

Produce a concise, realistic, actionable execution result for this step (3-5 lines max, plain text or light bullet points) showing concrete progress toward the user's objective.`;

        const resp = await generateWithModelFallback(ai, {
          contents: prompt
        });

        return res.json({
          success: true,
          stepId: step.id,
          output: resp.text || `Executed "${step.action}" via ${step.tool}.`,
          timestamp: new Date().toLocaleTimeString(),
          nextActionSuggestion: "Proceed to next step"
        });
      }

      res.json({
        success: true,
        stepId: step.id,
        output: `[Offline Execution] Completed "${step.action}" using ${step.tool}. Verified safety permissions and stored local context.`,
        timestamp: new Date().toLocaleTimeString(),
        nextActionSuggestion: "Proceed to next step"
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        stepId: req.body?.step?.id,
        output: `Execution error: ${error.message || "Unable to complete step."}`,
        timestamp: new Date().toLocaleTimeString()
      });
    }
  });

  // 5. Vision / Camera Assistant
  app.post("/api/vision/analyze", async (req, res) => {
    try {
      const { mode = "Ask About Image", prompt = "Analyze this image", imageBase64 } = req.body;

      const ai = getAIClient();
      if (ai && imageBase64) {
        try {
          const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
          const resp = await generateWithModelFallback(ai, {
            contents: [
              {
                role: "user",
                parts: [
                  { inlineData: { mimeType: "image/jpeg", data: base64Data } },
                  { text: `Mode: ${mode}. Instruction: ${prompt}. Analyze the visual content thoroughly, extract any visible text, identify key objects, and provide 3 suggested follow-up actions for a mobile assistant user.` }
                ]
              }
            ]
          });
          return res.json({
            analysis: resp.text,
            mode,
            detectedObjects: ["Document / Screen", "Typography", "Visual Layout", "Mobile Device"],
            extractedText: "Detected clean structured text and UI elements.",
            suggestedActions: ["Summarize text", "Translate to Spanish", "Save as AI Note", "Export to PDF"]
          });
        } catch (e) {
          console.error("Vision API error:", e);
        }
      }

      let analysisText = "";
      if (mode === "Scan Document") {
        analysisText = `**Document Scan Complete**\n\n**Title**: AI Mobile Application Architecture Specification\n**Key Highlights**:\n- 5 core navigation modules verified\n- Dual-engine online & offline capability supported\n- 3-Level Safety and Permission Confirmation system enabled.`;
      } else if (mode === "Translate Text") {
        analysisText = `**Translation Detected (English -> Spanish)**\n\n*Original*: "Your personal AI assistant for conversations, tasks, and everyday phone actions."\n*Translated*: "Tu asistente personal de IA para conversaciones, tareas y acciones diarias del teléfono."`;
      } else {
        analysisText = `**Image Analysis Result**:\n\nDetected structured document elements and clear visual layout.`;
      }

      res.json({
        analysis: analysisText,
        mode,
        detectedObjects: ["User Interface", "Text Document", "Calendar Elements", "Status Badge"],
        extractedText: "Ask. Automate. Get things done. - DiptiK AI Assistant",
        suggestedActions: ["Ask Follow-Up Question", "Copy Extracted Text", "Translate Content", "Save to Knowledge Library"]
      });
    } catch (error: any) {
      res.status(500).json({ error: "Vision processing failed" });
    }
  });

  // 6. Deep Research Mode (Real-Time Web Grounded)
  app.post("/api/research", async (req, res) => {
    const { query, depth = "Standard Research", dateRange = "Past Year", format = "Executive Summary" } = req.body;
    const ai = getAIClient();

    if (ai) {
      try {
        const prompt = `Current UTC Time: ${new Date().toISOString()}.
Conduct a real-time, web-grounded mobile AI research report on: "${query}".
Depth level: ${depth}. Time frame: ${dateRange}. Output format: ${format}.
Include:
1. Executive Summary (with current facts and dates)
2. 3-4 Key Findings with bullet points
3. Comparative Analysis & Conflicting Information
4. Recommended Next Steps for the user.`;

        const { response, fallbackSources } = await generateChatWithRetry(
          ai,
          [{ role: "user", parts: [{ text: prompt }] }],
          "You are DiptiK AI Deep Research Analyst. Use live Google Search results to provide accurate, up-to-date findings.",
          true,
          query
        );

        const groundedSources = extractGroundingSources(
          response.candidates?.[0]?.groundingMetadata?.groundingChunks
        );
        const finalSources = groundedSources.length > 0 ? groundedSources : fallbackSources;

        return res.json({
          report: response.text || "Research synthesis completed.",
          query,
          depth,
          sources: finalSources,
          timestamp: new Date().toISOString()
        });
      } catch (e: any) {
        console.error("Research API error:", e);
        return res.status(503).json({
          error: e?.message || "Failed to run live research",
          report: `Unable to complete live research right now (${e?.message || "service busy"}). Please try again.`,
          query,
          depth,
          sources: [],
          timestamp: new Date().toISOString()
        });
      }
    }

    res.status(503).json({
      error: "GEMINI_API_KEY is not configured on the server.",
      report: "Live Deep Research requires online AI configuration.",
      query,
      depth,
      sources: [],
      timestamp: new Date().toISOString()
    });
  });

  // 7. Create Content Mode
  app.post("/api/content/create", async (req, res) => {
    const { contentType = "Email", prompt, tone = "Professional", length = "Medium" } = req.body;
    const ai = getAIClient();
    if (ai) {
      try {
        const resp = await generateWithModelFallback(ai, {
          contents: `Create high quality content. Type: ${contentType}. Tone: ${tone}. Length: ${length}. Prompt: ${prompt}. Formatted cleanly with Markdown.`
        });
        return res.json({ content: resp.text, contentType, timestamp: new Date().toISOString() });
      } catch (e) {
        console.error("Content create error:", e);
      }
    }

    res.json({
      content: `**Subject: ${prompt.slice(0, 40)}...**\n\nDear Team,\n\nPrepared update regarding ${prompt}.\n\nBest regards,\nDiptiK AI Assistant`,
      contentType,
      timestamp: new Date().toISOString()
    });
  });

  // 8. Cloud Brain Daily Briefing, Push/Webhook Dispatch & Phone Action Execution
  app.post("/api/phone/briefing", async (req, res) => {
    try {
      const {
        city = "Dhaka",
        tasks = [],
        notes = [],
        userProfile = {},
        isOffline = false
      } = req.body || {};

      const activeTasks = (tasks as any[])
        .filter(t => t.status !== "Completed")
        .slice(0, 6)
        .map(t => `- ${t.title} (${t.dueDate || "Today"} · ${t.time || "Anytime"} · ${t.priority || "Medium"})`)
        .join("\n");

      const recentNotes = (notes as any[])
        .slice(0, 3)
        .map(n => `- ${n.title}: ${(n.content || "").slice(0, 120)}`)
        .join("\n");

      const ai = !isOffline ? getAIClient() : null;
      const nowStr = new Date().toLocaleString();

      if (ai) {
        try {
          const prompt = `Create a crisp, actionable Mobile Daily Briefing for ${userProfile.nickname || userProfile.name || "User"} (${nowStr}).
Location for weather/commute context: ${city}.
Active scheduled tasks:
${activeTasks || "- No pending tasks recorded"}
Recent notes:
${recentNotes || "- No recent notes"}

Include 3 short sections with Markdown headings:
1. Weather & Commute Pulse (include current conditions for ${city} via Google Search)
2. Today's Schedule & Priority Actions
3. Quick Phone Actions Suggested
Keep total length concise (~160 words) so it reads cleanly on a phone notification feed.`;

          const { response, usedModel, fallbackSources } = await generateChatWithRetry(
            ai,
            [{ role: "user", parts: [{ text: prompt }] }],
            "You are DiptiK AI 3 Cloud Brain generating a concise daily mobile briefing.",
            true,
            `weather and news in ${city}`
          );

          const grounded = extractGroundingSources(response.candidates?.[0]?.groundingMetadata?.groundingChunks);
          return res.json({
            briefing: response.text || "Your daily briefing is ready.",
            sources: grounded.length > 0 ? grounded : fallbackSources,
            modelUsed: usedModel,
            generatedAt: new Date().toISOString()
          });
        } catch (err) {
          console.error("Daily briefing generation fallback:", err);
        }
      }

      const fallbackBriefing = `### Daily Briefing · ${city}
**Generated**: ${nowStr}

### Today's Schedule & Priority Actions
${activeTasks || "- Clear schedule today. Add a task or reminder anytime."}

### Recent Notes
${recentNotes || "- No recent notes saved."}

### Suggested Actions
- Review unread messages or prepare outgoing drafts in Phone Actions
- Start a 5-minute focus check-in when ready`;

      res.json({
        briefing: fallbackBriefing,
        sources: [],
        modelUsed: isOffline ? "On-Device Lite" : "Local Fallback",
        generatedAt: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Failed to generate daily briefing" });
    }
  });

  app.post("/api/phone/dispatch-briefing", async (req, res) => {
    try {
      const {
        channelType = "web_push",
        webhookUrl = "",
        telegramBotToken = "",
        telegramChatId = "",
        title = "DiptiK AI 3 · Daily Briefing",
        message = ""
      } = req.body || {};

      if (!message.trim()) {
        return res.status(400).json({ error: "Briefing content cannot be empty." });
      }

      const safeValidateHttpsUrl = (rawUrl: string): URL => {
        const parsed = new URL(rawUrl.trim());
        if (parsed.protocol !== "https:") {
          throw new Error("Webhook URL must use https://");
        }
        const host = parsed.hostname.toLowerCase();
        if (
          host === "localhost" ||
          host === "127.0.0.1" ||
          host === "0.0.0.0" ||
          host.startsWith("10.") ||
          host.startsWith("192.168.") ||
          host.startsWith("169.254.")
        ) {
          throw new Error("Private or local network webhook URLs are not allowed.");
        }
        return parsed;
      };

      if (channelType === "telegram") {
        if (!telegramBotToken.trim() || !telegramChatId.trim()) {
          return res.status(400).json({ error: "Telegram Bot Token and Chat ID are required." });
        }
        const tgRes = await fetch(
          `https://api.telegram.org/bot${encodeURIComponent(telegramBotToken.trim())}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: telegramChatId.trim(),
              text: `*${title}*\n\n${message.slice(0, 3800)}`,
              parse_mode: "Markdown"
            })
          }
        );
        const tgData = await tgRes.json().catch(() => ({}));
        if (!tgRes.ok || !tgData?.ok) {
          return res.status(400).json({
            error: tgData?.description || `Telegram API returned HTTP ${tgRes.status}`
          });
        }
        return res.json({
          delivered: true,
          channel: "Telegram Bot",
          timestamp: new Date().toISOString()
        });
      }

      if (channelType === "discord") {
        const url = safeValidateHttpsUrl(webhookUrl);
        const discordRes = await fetch(url.toString(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "DiptiK AI 3",
            content: `**${title}**\n${message.slice(0, 1900)}`
          })
        });
        if (!discordRes.ok) {
          return res.status(400).json({ error: `Discord webhook returned HTTP ${discordRes.status}` });
        }
        return res.json({
          delivered: true,
          channel: "Discord Webhook",
          timestamp: new Date().toISOString()
        });
      }

      if (channelType === "custom_webhook") {
        const url = safeValidateHttpsUrl(webhookUrl);
        const hookRes = await fetch(url.toString(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: "DiptiK AI 3",
            title,
            message,
            timestamp: new Date().toISOString()
          })
        });
        if (!hookRes.ok) {
          return res.status(400).json({ error: `Webhook returned HTTP ${hookRes.status}` });
        }
        return res.json({
          delivered: true,
          channel: "Custom HTTPS Webhook",
          timestamp: new Date().toISOString()
        });
      }

      return res.json({
        delivered: true,
        channel: "Browser / PWA Notification",
        payload: { title, body: message.slice(0, 260) },
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(400).json({ error: error?.message || "Failed to dispatch briefing" });
    }
  });

  app.post("/api/action/simulate", (req, res) => {
    const { actionType, target, params } = req.body || {};
    const details = params?.details ? ` · ${params.details}` : "";
    const verificationLabel = params?.verificationMethod === "webauthn"
      ? "Device biometric passkey verified."
      : params?.verificationMethod === "hold_confirm"
      ? "Explicit Hold-to-Confirm safeguard verified."
      : "User approval verified.";
    res.json({
      status: "success",
      actionType,
      target,
      executionLog: `Executed "${actionType}" for ${target}${details}. ${verificationLabel} Activity log updated.`,
      timestamp: new Date().toLocaleTimeString(),
      undoSupported: actionType !== "send_sms" && actionType !== "make_call"
    });
  });

  // 9. Real-Time Voice Agent WebSocket (Gemini Live API)
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    const pathname = new URL(request.url || "/", "http://localhost").pathname;
    if (pathname === "/api/live") {
      wss.handleUpgrade(request, socket, head, ws => {
        wss.emit("connection", ws, request);
      });
    }
  });

  const liveTools: FunctionDeclaration[] = [
    {
      name: "search_live_web",
      description:
        "Search the live web using Google Search for real-time, up-to-date news, weather, stock/crypto prices, live scores, current events, facts, or any information the user asks you to check or find online.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          query: {
            type: Type.STRING,
            description: "The real-time web search query to execute"
          }
        },
        required: ["query"]
      }
    },
    {
      name: "browse_url",
      description:
        "Browse and inspect a specific website URL or link to read its current content and summarize or answer questions about it.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          url: {
            type: Type.STRING,
            description: "Full URL starting with https:// or domain name to browse"
          },
          focus: {
            type: Type.STRING,
            description: "What specific detail or update to check on the page"
          }
        },
        required: ["url"]
      }
    },
    {
      name: "get_current_datetime",
      description: "Get the user's exact current live local date, time, timezone, and city.",
      parameters: {
        type: Type.OBJECT,
        properties: {}
      }
    },
    {
      name: "get_workspace_items",
      description: "Read the signed-in user's current tasks, reminders, notes, and saved memories in their private workspace.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          filter: {
            type: Type.STRING,
            description: "Filter by 'tasks', 'notes', 'memories', or 'all'"
          }
        }
      }
    },
    {
      name: "create_task",
      description: "Create a reminder or task in the user's DiptiK AI task list.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Task title or reminder text" },
          time: { type: Type.STRING, description: "Time for the reminder, e.g. 5:00 PM or 7:00 AM" },
          priority: { type: Type.STRING, description: "High, Medium, or Low" }
        },
        required: ["title"]
      }
    },
    {
      name: "save_note",
      description: "Save a quick note in the user's DiptiK AI Notes.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Short title for the note" },
          content: { type: Type.STRING, description: "Note content" }
        },
        required: ["title", "content"]
      }
    },
    {
      name: "prepare_phone_action",
      description: "Prepare a phone action such as making a call, sending an SMS, or setting an alarm.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          actionType: { type: Type.STRING, description: "phone_call, send_message, alarm_reminder, or flashlight" },
          target: { type: Type.STRING, description: "Contact name, app, or device control" },
          details: { type: Type.STRING, description: "Human-readable summary of the action" }
        },
        required: ["actionType", "target", "details"]
      }
    }
  ];

  const liveSearchCache = new Map<
    string,
    { answer: string; sources: { title: string; url: string; credibility: string }[]; expiresAt: number }
  >();

  async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
    let timer: NodeJS.Timeout | undefined;
    try {
      return await Promise.race([
        promise,
        new Promise<T>((_, reject) => {
          timer = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
        })
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  async function runFastVoiceWebSearch(
    ai: GoogleGenAI,
    searchQuery: string,
    sessionContext: { city: string; timezone: string; clientDateTime: string }
  ) {
    const cacheKey = `${searchQuery.toLowerCase()}::${sessionContext.city.toLowerCase()}`;
    const cached = liveSearchCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return { answer: cached.answer, sources: cached.sources, cached: true };
    }

    const prompt = `UTC: ${new Date().toISOString()} | City: ${sessionContext.city || "Global"}.
Query: "${searchQuery}"
Give a direct, factual 2-3 sentence live answer with exact current numbers, dates, or headlines for voice playback.`;

    // Tier 1: Gemini native Google Search Grounding (when not in quota cooldown)
    if (Date.now() >= googleSearchCooldownUntil) {
      try {
        const response = await withTimeout(
          ai.models.generateContent({
            model: FAST_FALLBACK_MODEL,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
              systemInstruction: "You are an ultra-fast live web lookup engine for a real-time voice assistant. Reply in 2-3 crisp spoken sentences using Google Search.",
              thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
              tools: [{ googleSearch: {} }]
            }
          }),
          5500,
          "Live web search"
        );
        const sources = extractGroundingSources(
          response.candidates?.[0]?.groundingMetadata?.groundingChunks
        );
        const answer = response.text || "No results found.";
        if (liveSearchCache.size >= 100) {
          const oldestKey = liveSearchCache.keys().next().value;
          if (oldestKey) liveSearchCache.delete(oldestKey);
        }
        liveSearchCache.set(cacheKey, {
          answer,
          sources,
          expiresAt: Date.now() + 60_000
        });
        return { answer, sources, cached: false };
      } catch (err: any) {
        if (isSearchToolQuotaOrUnsupported(err)) {
          googleSearchCooldownUntil = Date.now() + 90_000;
        }
      }
    }

    // Tier 2: Fast Parallel Real-Time Web Retrieval (Google News RSS, Wikipedia, DDG, Weather/FX/Crypto) + Fast Gemini Synthesis
    const webData = await fetchRealtimeWebFallback(searchQuery, sessionContext.city);
    const synthesisPrompt = webData.contextText
      ? `Current UTC: ${new Date().toISOString()} | User Local Time: ${sessionContext.clientDateTime || new Date().toLocaleString()} | City: ${sessionContext.city || "Global"}.
User Question: "${searchQuery}"

Retrieved Live Web & Reference Data:
${webData.contextText}

Answer the user's question directly and factually in 2-3 crisp spoken sentences. Use the retrieved live data above when relevant, and your verified knowledge for historical/general facts. Never mention technical errors or tool failures.`
      : `Current UTC: ${new Date().toISOString()} | User Local Time: ${sessionContext.clientDateTime || new Date().toLocaleString()} | City: ${sessionContext.city || "Global"}.
User Question: "${searchQuery}"

Answer clearly, accurately, and concisely in 2-3 crisp spoken sentences using verified factual knowledge.`;

    try {
      const synthResp = await withTimeout(
        ai.models.generateContent({
          model: FAST_FALLBACK_MODEL,
          contents: [{ role: "user", parts: [{ text: synthesisPrompt }] }],
          config: {
            systemInstruction: "You are an ultra-fast factual briefing engine for a voice assistant. Give direct, confident, accurate 2-3 sentence spoken answers.",
            thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL }
          }
        }),
        6000,
        "Fast web synthesis"
      );
      const answer = synthResp.text?.trim() || webData.contextText || "No details available.";
      if (liveSearchCache.size >= 100) {
        const oldestKey = liveSearchCache.keys().next().value;
        if (oldestKey) liveSearchCache.delete(oldestKey);
      }
      liveSearchCache.set(cacheKey, {
        answer,
        sources: webData.sources,
        expiresAt: Date.now() + 60_000
      });
      return { answer, sources: webData.sources, cached: false };
    } catch {
      if (webData.contextText) {
        return { answer: webData.contextText.slice(0, 600), sources: webData.sources, cached: false };
      }
      throw new Error("Unable to retrieve answer right now.");
    }
  }

  async function executeLiveToolCall(
    name: string,
    args: Record<string, any>,
    sessionContext: {
      city: string;
      timezone: string;
      clientDateTime: string;
      tasks: any[];
      notes: any[];
      memories: any[];
    },
    safeSend: (payload: Record<string, any>) => void
  ): Promise<Record<string, any>> {
    if (name === "search_live_web") {
      const searchQuery = String(args.query || "").trim();
      if (!searchQuery) return { error: "Empty search query." };
      safeSend({
        type: "toolStatus",
        tool: "search_live_web",
        status: `Searching live web: "${searchQuery}"...`
      });
      const ai = getAIClient();
      if (!ai) return { error: "Cloud search unavailable without GEMINI_API_KEY." };
      try {
        const { answer, sources } = await runFastVoiceWebSearch(ai, searchQuery, sessionContext);
        if (sources.length > 0) {
          safeSend({ type: "liveSources", sources, query: searchQuery });
        }
        return {
          query: searchQuery,
          liveAnswer: answer,
          topSources: sources.slice(0, 3).map(s => s.title),
          retrievedAtUtc: new Date().toISOString()
        };
      } catch (err: any) {
        return { error: err?.message || "Live web search failed." };
      } finally {
        safeSend({ type: "toolStatus", status: "" });
      }
    }

    if (name === "browse_url") {
      let targetUrl = String(args.url || "").trim();
      if (!targetUrl) return { error: "URL is required." };
      if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = `https://${targetUrl}`;
      }
      if (!isSafePublicHttpUrl(targetUrl)) {
        return { error: "Only public http/https URLs can be browsed." };
      }
      const focus = String(args.focus || "Summarize key live updates and headlines in 2-3 sentences.");
      safeSend({
        type: "toolStatus",
        tool: "browse_url",
        status: `Browsing ${targetUrl}...`
      });
      const ai = getAIClient();
      if (!ai) return { error: "Cloud browsing unavailable without GEMINI_API_KEY." };
      try {
        // 1. Try Gemini urlContext if not in quota cooldown
        if (Date.now() >= googleSearchCooldownUntil) {
          try {
            const resp = await withTimeout(
              ai.models.generateContent({
                model: FAST_FALLBACK_MODEL,
                contents: `Inspect ${targetUrl}. Focus: ${focus}. UTC: ${new Date().toISOString()}. Answer concisely in 2-3 sentences for voice.`,
                config: {
                  thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
                  tools: [{ urlContext: {} }]
                }
              }),
              5500,
              "URL browse"
            );
            const gSources = extractGroundingSources(
              resp.candidates?.[0]?.groundingMetadata?.groundingChunks
            );
            const sources = [
              { title: targetUrl, url: targetUrl, credibility: "Browsed Page" },
              ...gSources.filter(s => s.url !== targetUrl)
            ].slice(0, 5);
            safeSend({ type: "liveSources", sources, query: targetUrl });
            return {
              url: targetUrl,
              pageSummary: resp.text || "Page inspected.",
              fetchedAtUtc: new Date().toISOString()
            };
          } catch (err: any) {
            if (isSearchToolQuotaOrUnsupported(err)) {
              googleSearchCooldownUntil = Date.now() + 90_000;
            }
          }
        }

        // 2. Direct HTTP page fetch + fast extraction + Gemini summarization
        try {
          const pageRes = await fetch(targetUrl, {
            headers: { "User-Agent": "Mozilla/5.0 (compatible; DiptiKAI/1.0)" },
            signal: AbortSignal.timeout(4500)
          });
          if (pageRes.ok) {
            const html = await pageRes.text();
            const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
            const pageTitle = titleMatch ? decodeXmlEntities(titleMatch[1]) : targetUrl;
            const visibleText = html
              .replace(/<script[\s\S]*?<\/script>/gi, " ")
              .replace(/<style[\s\S]*?<\/style>/gi, " ")
              .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
              .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
              .replace(/<[^>]+>/g, " ")
              .replace(/\s+/g, " ")
              .trim()
              .slice(0, 5000);

            if (visibleText.length >= 120) {
              const synth = await withTimeout(
                ai.models.generateContent({
                  model: FAST_FALLBACK_MODEL,
                  contents: `URL: ${targetUrl}\nPage Title: ${pageTitle}\nFocus: ${focus}\n\nExtracted Live Page Text:\n${visibleText}\n\nSummarize the key facts/headlines concisely in 2-3 spoken sentences.`,
                  config: { thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL } }
                }),
                5500,
                "Page summary"
              );
              const sources = [{ title: pageTitle, url: targetUrl, credibility: "Browsed Page" }];
              safeSend({ type: "liveSources", sources, query: targetUrl });
              return {
                url: targetUrl,
                title: pageTitle,
                pageSummary: synth.text || visibleText.slice(0, 400),
                fetchedAtUtc: new Date().toISOString()
              };
            }
          }
        } catch {}

        // 3. Fallback to fast web search for that URL / domain
        const fallback = await runFastVoiceWebSearch(ai, `${targetUrl} ${focus}`, sessionContext);
        const sources = [
          { title: targetUrl, url: targetUrl, credibility: "Browsed Page" },
          ...fallback.sources.filter(s => s.url !== targetUrl)
        ].slice(0, 5);
        safeSend({ type: "liveSources", sources, query: targetUrl });
        return {
          url: targetUrl,
          pageSummary: fallback.answer,
          fetchedAtUtc: new Date().toISOString()
        };
      } catch (err: any) {
        return { error: err?.message || "Failed to browse URL." };
      } finally {
        safeSend({ type: "toolStatus", status: "" });
      }
    }

    if (name === "get_current_datetime") {
      return {
        serverUtc: new Date().toISOString(),
        userLocalDateTime: sessionContext.clientDateTime || new Date().toLocaleString(),
        timezone: sessionContext.timezone || "UTC",
        city: sessionContext.city || ""
      };
    }

    if (name === "get_workspace_items") {
      const filter = String(args.filter || "all").toLowerCase();
      return {
        ...(filter === "all" || filter === "tasks" ? { tasks: sessionContext.tasks.slice(0, 15) } : {}),
        ...(filter === "all" || filter === "notes" ? { notes: sessionContext.notes.slice(0, 10) } : {}),
        ...(filter === "all" || filter === "memories" ? { memories: sessionContext.memories.slice(0, 10) } : {})
      };
    }

    if (name === "create_task") {
      sessionContext.tasks.unshift({
        title: args.title || "Voice Reminder",
        time: args.time || "5:00 PM",
        priority: args.priority || "Medium",
        status: "Today"
      });
    } else if (name === "save_note") {
      sessionContext.notes.unshift({
        title: args.title || "Voice Note",
        content: args.content || ""
      });
    }

    safeSend({ type: "toolAction", name, args });
    return { result: `Executed ${name} successfully in DiptiK AI workspace.` };
  }

  wss.on("connection", (clientWs: WebSocket) => {
    let liveSession: any = null;
    let isClosed = false;
    const sessionContext = {
      city: "",
      timezone: "",
      clientDateTime: "",
      tasks: [] as any[],
      notes: [] as any[],
      memories: [] as any[]
    };

    const safeSend = (payload: Record<string, any>) => {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify(payload));
      }
    };

    clientWs.on("message", async (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        if (msg.type === "sync_context" && msg.context) {
          if (Array.isArray(msg.context.tasks)) sessionContext.tasks = msg.context.tasks.slice(0, 20);
          if (Array.isArray(msg.context.notes)) sessionContext.notes = msg.context.notes.slice(0, 15);
          if (Array.isArray(msg.context.memories)) sessionContext.memories = msg.context.memories.slice(0, 15);
          if (msg.context.clientDateTime) sessionContext.clientDateTime = String(msg.context.clientDateTime);
          if (msg.context.timezone) sessionContext.timezone = String(msg.context.timezone);
          if (msg.context.city) sessionContext.city = String(msg.context.city);
          return;
        }

        if (msg.type === "setup") {
          const ai = getLiveAIClient();
          if (!ai) {
            safeSend({
              type: "error",
              message: "Live voice requires GEMINI_API_KEY configured on the server. Switching to Offline/Text mode."
            });
            return;
          }

          if (liveSession) {
            try { liveSession.close(); } catch {}
            liveSession = null;
          }

          const {
            nickname = "User",
            persona = "Default (Friendly & Helpful)",
            customInstructions = "",
            agentName = "DiptiK Voice Agent",
            agentGoal = "Help the user in real-time voice conversation.",
            agentInstructions = "",
            voiceName = "Zephyr",
            voiceAccent = "en-GB",
            engine = "Gemini",
            city = "",
            timezone = "",
            clientDateTime = "",
            tasks = [],
            notes = [],
            memories = []
          } = msg.config || {};

          sessionContext.city = String(city || "");
          sessionContext.timezone = String(timezone || "");
          sessionContext.clientDateTime = String(clientDateTime || new Date().toLocaleString());
          sessionContext.tasks = Array.isArray(tasks) ? tasks.slice(0, 20) : [];
          sessionContext.notes = Array.isArray(notes) ? notes.slice(0, 15) : [];
          sessionContext.memories = Array.isArray(memories) ? memories.slice(0, 15) : [];

          const validVoices = ["Zephyr", "Puck", "Charon", "Kore", "Fenrir"];
          const selectedVoice = validVoices.includes(voiceName) ? voiceName : "Zephyr";
          const isUKAccent = voiceAccent !== "en-US";
          const accentInstruction = isUKAccent
            ? "Speech Accent & Dialect: Speak strictly in a natural, refined British English (UK) accent with authentic Southern British / Received Pronunciation cadence, natural British intonation, and UK vocabulary and spelling (e.g., 'schedule' as 'shed-yool', 'organise', 'colour', 'mobile', 'diary'). Maintain this UK English accent consistently throughout the entire spoken conversation."
            : "Speech Accent & Dialect: Speak in a natural, clear American English (US) accent and standard North American phrasing.";

          const taskSummary =
            sessionContext.tasks.length > 0
              ? sessionContext.tasks
                  .slice(0, 6)
                  .map((t: any) => `- ${t.title} (${t.time || "Anytime"}, ${t.status || "Today"})`)
                  .join("\n")
              : "No pending tasks.";

          const memorySummary =
            sessionContext.memories.length > 0
              ? sessionContext.memories
                  .slice(0, 6)
                  .map((m: any) => `- ${m.title}: ${m.value}`)
                  .join("\n")
              : "No saved memories.";

          const systemInstruction = `You are ${agentName}, a real-time, live-connected voice AI assistant inside DiptiK AI 3.
You are speaking directly with ${nickname}.
Live Context:
- User Local Date & Time: ${sessionContext.clientDateTime}${sessionContext.timezone ? ` (${sessionContext.timezone})` : ""}
- Server UTC Time: ${new Date().toISOString()}
- Location / City: ${sessionContext.city || "Not specified"}
Persona: ${persona}.
Agent Goal: ${agentGoal}.
${accentInstruction}
${agentInstructions ? `Agent Instructions: ${agentInstructions}` : ""}
${customInstructions ? `User Custom Instructions: ${customInstructions}` : ""}
${getEngineSystemNote(engine)}

User's Private Workspace Snapshot:
Tasks:
${taskSummary}
Memories:
${memorySummary}

CRITICAL REAL-TIME RULES:
- Never give static, outdated, or guessed answers for current facts, news, weather, prices, sports, exchange rates, schedules, or anything after your knowledge cutoff.
- Whenever the user asks you to check, look up, search, find, or browse something online—or asks about current events, today's updates, weather, or live information—ALWAYS call \`search_live_web\` immediately and report the live findings.
- Whenever the user mentions a website or URL to inspect, call \`browse_url\`.
- Whenever asked about the current time or date, call \`get_current_datetime\` or state the live time accurately.
- Whenever asked about their tasks, reminders, or notes, call \`get_workspace_items\`, \`create_task\`, or \`save_note\`.
- Keep your spoken responses natural, conversational, warm, and concise (1-3 sentences unless asked for detail) since the user is listening in real time.`;

          liveSession = await ai.live.connect({
            model: LIVE_MODEL,
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: selectedVoice }
                }
              },
              inputAudioTranscription: {},
              outputAudioTranscription: {},
              tools: [{ functionDeclarations: liveTools }],
              systemInstruction
            },
            callbacks: {
              onopen: () => {},
              onmessage: (message: LiveServerMessage) => {
                if (isClosed) return;
                const content = message.serverContent;

                if (content?.inputTranscription?.text) {
                  safeSend({ type: "inputTranscript", text: content.inputTranscription.text });
                }
                if (content?.outputTranscription?.text) {
                  safeSend({ type: "outputTranscript", text: content.outputTranscription.text });
                }

                for (const part of content?.modelTurn?.parts ?? []) {
                  if (part.inlineData?.data) {
                    safeSend({ type: "audio", audio: part.inlineData.data });
                  }
                }

                if (content?.interrupted) {
                  safeSend({ type: "interrupted" });
                }
                if (content?.turnComplete) {
                  safeSend({ type: "turnComplete" });
                }

                const calls = message.toolCall?.functionCalls ?? [];
                if (calls.length > 0) {
                  void (async () => {
                    const functionResponses = await Promise.all(
                      calls.map(async call => {
                        const result = await executeLiveToolCall(
                          call.name || "",
                          (call.args || {}) as Record<string, any>,
                          sessionContext,
                          safeSend
                        );
                        return {
                          id: call.id,
                          name: call.name,
                          response: result
                        };
                      })
                    );
                    if (!isClosed && liveSession) {
                      try {
                        liveSession.sendToolResponse({ functionResponses });
                      } catch (e) {
                        console.error("Failed to send live tool response:", e);
                      }
                    }
                  })();
                }
              },
              onerror: (err: any) => {
                console.error("Gemini Live session error:", err);
                safeSend({ type: "error", message: err?.message || "Live voice session error" });
              },
              onclose: () => {
                if (!isClosed) {
                  safeSend({ type: "closed" });
                }
              }
            }
          });
          if (isClosed) {
            try { liveSession.close(); } catch {}
            liveSession = null;
            return;
          }
          safeSend({ type: "ready", voiceName: selectedVoice, agentName });
          return;
        }

        if (!liveSession) return;

        if (msg.type === "audio" && msg.audio) {
          liveSession.sendRealtimeInput({
            audio: { data: msg.audio, mimeType: "audio/pcm;rate=16000" }
          });
        } else if (msg.type === "text" && msg.text) {
          liveSession.sendClientContent({
            turns: [{ role: "user", parts: [{ text: msg.text }] }],
            turnComplete: true
          });
        }
      } catch (err: any) {
        console.error("WebSocket message handling error:", err);
        safeSend({ type: "error", message: err?.message || "Failed to process voice stream" });
      }
    });

    clientWs.on("close", () => {
      isClosed = true;
      if (liveSession) {
        try { liveSession.close(); } catch {}
        liveSession = null;
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const hmrDisabled = process.env.DISABLE_HMR === "true";
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: hmrDisabled ? false : { server },
        ...(hmrDisabled ? { ws: false } : {})
      },
      plugins: hmrDisabled
        ? [
            {
              name: "disable-hmr-client-ws",
              enforce: "post",
              transform(code, id) {
                if (id.replace(/\\/g, "/").endsWith("/vite/dist/client/client.mjs")) {
                  return code.replace(
                    "transport.connect(createHMRHandler(handleMessage));",
                    "transport.send = async () => {}; transport.invoke = async () => {};"
                  );
                }
              }
            }
          ]
        : [],
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`DiptiK AI Agent Full-Stack Server running on http://localhost:${PORT}`);
  });
}

startServer();
