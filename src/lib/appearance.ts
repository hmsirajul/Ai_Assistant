export interface AppearanceAccentOption {
  name: string;
  hex: string;
}

export interface AppearanceThemePreset {
  id: string;
  name: string;
  badgeText: string;
  accentName: string;
  accentHex: string;
  background: string;
  foreground: string;
  fontFamily: "DM Sans" | "Plus Jakarta Sans" | "JetBrains Mono" | "System UI";
}

export interface AppearanceConfig {
  themePreset: string;
  accentName: string;
  accentHex: string;
  background: string;
  foreground: string;
  fontFamily: "DM Sans" | "Plus Jakarta Sans" | "JetBrains Mono" | "System UI";
  codeFont: "JetBrains Mono" | "IBM Plex Mono" | "ui-monospace";
  compactDensity: boolean;
}

export type ColorMode = "system" | "light" | "dark";

export const APPEARANCE_STORAGE_KEY = "diptik_appearance_v1";

export const ACCENT_OPTIONS: AppearanceAccentOption[] = [
  { name: "Orange", hex: "#FF6B4A" },
  { name: "Cyan", hex: "#00E5FF" },
  { name: "Blue", hex: "#0072FF" },
  { name: "Pink", hex: "#FF1E8A" },
  { name: "Violet", hex: "#8A2BE2" },
  { name: "Emerald", hex: "#10B981" }
];

export const THEME_PRESETS: AppearanceThemePreset[] = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    badgeText: "Aa",
    accentName: "Orange",
    accentHex: "#FF6B4A",
    background: "#000000",
    foreground: "#EDEDED",
    fontFamily: "DM Sans"
  },
  {
    id: "diptik-ai-3",
    name: "DiptiK AI 3",
    badgeText: "Aa",
    accentName: "Cyan",
    accentHex: "#00E5FF",
    background: "#0b0d14",
    foreground: "#F8FAFC",
    fontFamily: "Plus Jakarta Sans"
  },
  {
    id: "oled-matte",
    name: "OLED Matte",
    badgeText: "Aa",
    accentName: "Blue",
    accentHex: "#0072FF",
    background: "#000000",
    foreground: "#EDEDED",
    fontFamily: "DM Sans"
  },
  {
    id: "orchid-studio",
    name: "Orchid Studio",
    badgeText: "Aa",
    accentName: "Pink",
    accentHex: "#FF1E8A",
    background: "#090b12",
    foreground: "#F1F5F9",
    fontFamily: "Plus Jakarta Sans"
  }
];

export const DEFAULT_APPEARANCE_CONFIG: AppearanceConfig = {
  themePreset: "ChatGPT",
  accentName: "Orange",
  accentHex: "#FF6B4A",
  background: "#000000",
  foreground: "#EDEDED",
  fontFamily: "DM Sans",
  codeFont: "JetBrains Mono",
  compactDensity: false
};

export function loadAppearanceConfig(): AppearanceConfig {
  if (typeof window === "undefined") return DEFAULT_APPEARANCE_CONFIG;
  try {
    const raw = localStorage.getItem(APPEARANCE_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_APPEARANCE_CONFIG, ...JSON.parse(raw) };
    }
  } catch {}
  return DEFAULT_APPEARANCE_CONFIG;
}

export function saveAppearanceConfig(config: AppearanceConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(config));
  } catch {}
}

export function isValidHexColor(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value.trim());
}

export function getSystemPrefersDark(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return true;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function resolveEffectiveDarkMode(colorMode: ColorMode): boolean {
  if (colorMode === "dark") return true;
  if (colorMode === "light") return false;
  return getSystemPrefersDark();
}

export function applyAppearanceToDocument(
  config: AppearanceConfig,
  colorMode: ColorMode = "dark"
): boolean {
  if (typeof document === "undefined") return true;
  const root = document.documentElement;
  const isDark = resolveEffectiveDarkMode(colorMode);

  root.classList.toggle("dark", isDark);
  root.style.colorScheme = isDark ? "dark" : "light";
  root.dataset.colorMode = colorMode;

  if (isDark) {
    if (isValidHexColor(config.background)) {
      root.style.setProperty("--bg-canvas", config.background);
      root.style.setProperty("--appearance-bg", config.background);
    } else {
      root.style.removeProperty("--bg-canvas");
    }
    if (isValidHexColor(config.foreground)) {
      root.style.setProperty("--text-primary", config.foreground);
      root.style.setProperty("--appearance-fg", config.foreground);
    } else {
      root.style.removeProperty("--text-primary");
    }
  } else {
    // Ensure Light mode always uses crisp readable light canvas & dark text
    root.style.setProperty("--bg-canvas", "#f8fafc");
    root.style.setProperty("--text-primary", "#0f172a");
    root.style.setProperty("--appearance-bg", "#ffffff");
    root.style.setProperty("--appearance-fg", "#0f172a");
  }

  if (isValidHexColor(config.accentHex)) {
    root.style.setProperty("--appearance-accent", config.accentHex);
  }

  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute("content", isDark ? config.background || "#0b0d14" : "#f8fafc");
  }

  const fontMap: Record<AppearanceConfig["fontFamily"], string> = {
    "DM Sans": '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    "Plus Jakarta Sans": '"Plus Jakarta Sans", "DM Sans", -apple-system, sans-serif',
    "JetBrains Mono": '"JetBrains Mono", ui-monospace, monospace',
    "System UI": '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  };
  root.style.setProperty("--font-sans", fontMap[config.fontFamily] || fontMap["DM Sans"]);

  const codeFontMap: Record<AppearanceConfig["codeFont"], string> = {
    "JetBrains Mono": '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
    "IBM Plex Mono": '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
    "ui-monospace": 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
  };
  root.style.setProperty("--font-mono", codeFontMap[config.codeFont] || codeFontMap["JetBrains Mono"]);

  return isDark;
}
