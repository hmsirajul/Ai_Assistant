export type VoiceAccent = "en-GB" | "en-US";

export const VOICE_ACCENT_STORAGE_KEY = "diptik_voice_accent_v1";

export const VOICE_ACCENT_OPTIONS: {
  id: VoiceAccent;
  label: string;
  shortLabel: string;
  description: string;
}[] = [
  {
    id: "en-GB",
    label: "British English (UK)",
    shortLabel: "UK · en-GB",
    description: "Natural British English accent, cadence, and UK phrasing"
  },
  {
    id: "en-US",
    label: "American English (US)",
    shortLabel: "US · en-US",
    description: "Standard North American English accent and phrasing"
  }
];

export const VOICE_PERSONA_DETAILS: {
  name: "Zephyr" | "Puck" | "Charon" | "Kore" | "Fenrir";
  tone: string;
}[] = [
  { name: "Zephyr", tone: "Warm & balanced" },
  { name: "Puck", tone: "Crisp & upbeat" },
  { name: "Charon", tone: "Deep & composed" },
  { name: "Kore", tone: "Soft & articulate" },
  { name: "Fenrir", tone: "Resonant & direct" }
];

export function loadVoiceAccent(): VoiceAccent {
  if (typeof window === "undefined") return "en-GB";
  try {
    const saved = localStorage.getItem(VOICE_ACCENT_STORAGE_KEY);
    if (saved === "en-GB" || saved === "en-US") return saved;
  } catch {}
  return "en-GB";
}

export function saveVoiceAccent(accent: VoiceAccent): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(VOICE_ACCENT_STORAGE_KEY, accent);
  } catch {}
}

export function selectPreferredSpeechVoice(
  accent: VoiceAccent = "en-GB"
): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const targetPrefix = accent.toLowerCase();
  const matchingLangVoices = voices.filter(v =>
    v.lang.toLowerCase().replace("_", "-").startsWith(targetPrefix)
  );

  if (matchingLangVoices.length > 0) {
    if (accent === "en-GB") {
      const preferredNames = [
        "google uk english female",
        "google uk english male",
        "sonia",
        "libby",
        "ryan",
        "kate",
        "daniel",
        "serena",
        "martha",
        "arthur",
        "oliver"
      ];
      for (const pref of preferredNames) {
        const hit = matchingLangVoices.find(v => v.name.toLowerCase().includes(pref));
        if (hit) return hit;
      }
    }
    return matchingLangVoices[0];
  }

  return voices.find(v => v.lang.toLowerCase().startsWith("en")) || voices[0];
}

export function speakWithAccent(
  text: string,
  options?: {
    accent?: VoiceAccent;
    rate?: number;
    queue?: boolean;
    onStart?: () => void;
    onEnd?: () => void;
  }
): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const cleanText = text.replace(/[*#`_~]/g, "").trim();
  if (!cleanText) return;

  const accent = options?.accent || loadVoiceAccent();
  if (!options?.queue) {
    window.speechSynthesis.cancel();
  }

  const utter = new SpeechSynthesisUtterance(cleanText);
  utter.lang = accent;
  utter.rate = options?.rate ?? 1.0;

  const chosenVoice = selectPreferredSpeechVoice(accent);
  if (chosenVoice) {
    utter.voice = chosenVoice;
  }

  if (options?.onStart) utter.onstart = options.onStart;
  if (options?.onEnd) {
    utter.onend = options.onEnd;
    utter.onerror = options.onEnd;
  }

  window.speechSynthesis.speak(utter);
}

export function stopSpeechSynthesis(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
