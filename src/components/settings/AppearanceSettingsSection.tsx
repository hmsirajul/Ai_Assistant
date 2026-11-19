import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../../context/AppContext";
import {
  Download,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  RotateCcw
} from "lucide-react";
import {
  ACCENT_OPTIONS,
  AppearanceConfig,
  ColorMode,
  DEFAULT_APPEARANCE_CONFIG,
  THEME_PRESETS,
  applyAppearanceToDocument,
  getSystemPrefersDark,
  isValidHexColor,
  loadAppearanceConfig,
  saveAppearanceConfig
} from "../../lib/appearance";

export const AppearanceSettingsSection: React.FC = () => {
  const { userProfile, updateUserProfile, addNotification } = useApp();

  const [config, setConfig] = useState<AppearanceConfig>(() => loadAppearanceConfig());
  const [bgInput, setBgInput] = useState(config.background.toUpperCase());
  const [fgInput, setFgInput] = useState(config.foreground.toUpperCase());
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [accentMenuOpen, setAccentMenuOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [copiedTheme, setCopiedTheme] = useState(false);
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => getSystemPrefersDark());

  const themeMenuRef = useRef<HTMLDivElement>(null);
  const accentMenuRef = useRef<HTMLDivElement>(null);

  const activeColorMode: ColorMode =
    userProfile.theme === "light" || userProfile.theme === "dark" || userProfile.theme === "system"
      ? userProfile.theme
      : "system";

  const isEffectiveDark =
    activeColorMode === "dark" || (activeColorMode === "system" && systemPrefersDark);

  useEffect(() => {
    applyAppearanceToDocument(config, activeColorMode);
    saveAppearanceConfig(config);
  }, [config, activeColorMode, systemPrefersDark]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setThemeMenuOpen(false);
      }
      if (accentMenuRef.current && !accentMenuRef.current.contains(e.target as Node)) {
        setAccentMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const updateConfig = (patch: Partial<AppearanceConfig>) => {
    setConfig(prev => ({ ...prev, ...patch }));
  };

  const handleSelectColorMode = async (mode: ColorMode) => {
    applyAppearanceToDocument(config, mode);
    await updateUserProfile({ theme: mode });
    const resolvedLabel =
      mode === "system"
        ? `System (${getSystemPrefersDark() ? "Dark" : "Light"})`
        : mode.charAt(0).toUpperCase() + mode.slice(1);
    addNotification({
      title: "Color mode updated",
      message: `Switched appearance color mode to ${resolvedLabel}.`,
      category: "system"
    });
  };

  const handleSelectPreset = (presetName: string) => {
    const found = THEME_PRESETS.find(p => p.name === presetName);
    if (!found) return;
    const next: AppearanceConfig = {
      ...config,
      themePreset: found.name,
      accentName: found.accentName,
      accentHex: found.accentHex,
      background: found.background.toUpperCase(),
      foreground: found.foreground.toUpperCase(),
      fontFamily: found.fontFamily
    };
    setConfig(next);
    setBgInput(next.background);
    setFgInput(next.foreground);
    setThemeMenuOpen(false);
    addNotification({
      title: "Theme preset applied",
      message: `Applied "${found.name}" visual preset.`,
      category: "system"
    });
  };

  const handleSelectAccent = (name: string, hex: string) => {
    updateConfig({ accentName: name, accentHex: hex });
    setAccentMenuOpen(false);
  };

  const handleHexChange = (target: "background" | "foreground", rawValue: string) => {
    const formatted = rawValue.startsWith("#") ? rawValue.toUpperCase() : `#${rawValue.toUpperCase()}`;
    if (target === "background") {
      setBgInput(formatted.slice(0, 7));
      if (isValidHexColor(formatted)) {
        updateConfig({ background: formatted });
      }
    } else {
      setFgInput(formatted.slice(0, 7));
      if (isValidHexColor(formatted)) {
        updateConfig({ foreground: formatted });
      }
    }
  };

  const handleExportTheme = () => {
    const payload = JSON.stringify(
      {
        colorMode: activeColorMode,
        ...config
      },
      null,
      2
    );
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `diptik-theme-${config.themePreset.toLowerCase().replace(/\s+/g, "-")}.json`;
    link.click();
    URL.revokeObjectURL(url);
    addNotification({
      title: "Theme exported",
      message: `Downloaded ${config.themePreset} color and font specification.`,
      category: "system"
    });
  };

  const handleCopyTheme = async () => {
    const payload = JSON.stringify(
      {
        colorMode: activeColorMode,
        ...config
      },
      null,
      2
    );
    try {
      await navigator.clipboard.writeText(payload);
      setCopiedTheme(true);
      setTimeout(() => setCopiedTheme(false), 1800);
      addNotification({
        title: "Theme copied",
        message: "Appearance theme JSON copied to clipboard.",
        category: "system"
      });
    } catch {
      addNotification({
        title: "Copy failed",
        message: "Clipboard access is unavailable in this browser context.",
        category: "system"
      });
    }
  };

  const handleResetAppearance = () => {
    setConfig(DEFAULT_APPEARANCE_CONFIG);
    setBgInput(DEFAULT_APPEARANCE_CONFIG.background);
    setFgInput(DEFAULT_APPEARANCE_CONFIG.foreground);
    updateUserProfile({ theme: "system" });
    addNotification({
      title: "Appearance reset",
      message: "Restored default appearance settings.",
      category: "system"
    });
  };

  const activeAccentHex = config.accentHex || "#FF6B4A";

  return (
    <div
      className="rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-[#1F1F1F] bg-white dark:bg-[#000000] text-slate-900 dark:text-[#EDEDED] transition-colors duration-150"
      style={
        isEffectiveDark
          ? { backgroundColor: config.background || "#000000", color: config.foreground || "#EDEDED" }
          : undefined
      }
    >
      {/* Header */}
      <header>
        <h1 className="font-display text-2xl sm:text-[28px] font-semibold tracking-tight text-slate-900 dark:text-[#EDEDED]">
          Appearance
        </h1>
        <p className="text-sm text-slate-500 dark:text-[#8E8E93] mt-1">
          Choose the colors and fonts you see in the app
        </p>
      </header>

      {/* Section Subheading */}
      <div className="mt-8 pb-3 border-b border-slate-200 dark:border-[#1F1F1F]">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-[#EDEDED]">Visual style</h2>
      </div>

      {/* Stacked Settings Rows */}
      <div className="divide-y divide-slate-200 dark:divide-[#1F1F1F]">
        {/* 1. Color mode */}
        <div className="py-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="min-w-0 max-w-md">
            <div className="text-sm font-medium text-slate-900 dark:text-[#EDEDED]">Color mode</div>
            <p className="text-xs text-slate-500 dark:text-[#8E8E93] mt-1">
              Use light or dark colors, or follow your system setting
              {activeColorMode === "system" && (
                <span className="ml-1.5 text-slate-700 dark:text-[#cbd5e1]">
                  · Currently {systemPrefersDark ? "Dark" : "Light"}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0" role="radiogroup" aria-label="Color mode">
            {/* System Split Thumbnail */}
            <button
              type="button"
              role="radio"
              aria-checked={activeColorMode === "system"}
              onClick={() => handleSelectColorMode("system")}
              className="group flex flex-col items-center gap-1.5 cursor-pointer focus-visible:outline-none"
            >
              <div
                className={`w-[80px] h-[52px] rounded-[8px] overflow-hidden flex transition-all ${
                  activeColorMode === "system"
                    ? "border-2"
                    : "border border-slate-300 dark:border-[#2A2A2E] hover:border-slate-400 dark:hover:border-[#52525B]"
                }`}
                style={activeColorMode === "system" ? { borderColor: activeAccentHex } : undefined}
              >
                {/* Half Light */}
                <div className="w-1/2 h-full bg-[#F8FAFC] p-1.5 flex flex-col justify-between">
                  <div className="w-5 h-1.5 rounded-full bg-[#CBD5E1]" />
                  <div className="space-y-1">
                    <div className="w-full h-1.5 rounded-full bg-[#2563EB]/80" />
                    <div className="w-4/5 h-1.5 rounded-full bg-[#CBD5E1]" />
                  </div>
                </div>
                {/* Half Dark */}
                <div className="w-1/2 h-full bg-[#111318] p-1.5 flex flex-col justify-between border-l border-[#26262A]">
                  <div className="w-5 h-1.5 rounded-full bg-[#2E323D]" />
                  <div className="space-y-1">
                    <div
                      className="w-full h-1.5 rounded-full"
                      style={{ backgroundColor: activeAccentHex }}
                    />
                    <div className="w-4/5 h-1.5 rounded-full bg-[#2E323D]" />
                  </div>
                </div>
              </div>
              <span
                className={`text-[11px] ${
                  activeColorMode === "system"
                    ? "text-slate-900 dark:text-[#EDEDED] font-semibold"
                    : "text-slate-500 dark:text-[#8E8E93]"
                }`}
              >
                System
              </span>
            </button>

            {/* Light Thumbnail */}
            <button
              type="button"
              role="radio"
              aria-checked={activeColorMode === "light"}
              onClick={() => handleSelectColorMode("light")}
              className="group flex flex-col items-center gap-1.5 cursor-pointer focus-visible:outline-none"
            >
              <div
                className={`w-[80px] h-[52px] rounded-[8px] overflow-hidden bg-[#FFFFFF] p-2 flex flex-col justify-between transition-all ${
                  activeColorMode === "light"
                    ? "border-2"
                    : "border border-slate-300 dark:border-[#2A2A2E] hover:border-slate-400 dark:hover:border-[#52525B]"
                }`}
                style={activeColorMode === "light" ? { borderColor: activeAccentHex } : undefined}
              >
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#CBD5E1]" />
                  <div className="w-7 h-1.5 rounded-full bg-[#E2E8F0]" />
                </div>
                <div className="space-y-1.5">
                  <div className="w-9 h-2 rounded-sm bg-[#2563EB] ml-auto" />
                  <div className="w-11 h-1.5 rounded-sm bg-[#E2E8F0]" />
                </div>
              </div>
              <span
                className={`text-[11px] ${
                  activeColorMode === "light"
                    ? "text-slate-900 dark:text-[#EDEDED] font-semibold"
                    : "text-slate-500 dark:text-[#8E8E93]"
                }`}
              >
                Light
              </span>
            </button>

            {/* Dark Thumbnail */}
            <button
              type="button"
              role="radio"
              aria-checked={activeColorMode === "dark"}
              onClick={() => handleSelectColorMode("dark")}
              className="group flex flex-col items-center gap-1.5 cursor-pointer focus-visible:outline-none"
            >
              <div
                className={`w-[80px] h-[52px] rounded-[8px] overflow-hidden bg-[#121316] p-2 flex flex-col justify-between transition-all ${
                  activeColorMode === "dark"
                    ? "border-2"
                    : "border border-slate-300 dark:border-[#2A2A2E] hover:border-slate-400 dark:hover:border-[#52525B]"
                }`}
                style={activeColorMode === "dark" ? { borderColor: activeAccentHex } : undefined}
              >
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#2E323D]" />
                  <div className="w-7 h-1.5 rounded-full bg-[#262932]" />
                </div>
                <div className="space-y-1.5">
                  <div
                    className="w-9 h-2 rounded-sm ml-auto"
                    style={{ backgroundColor: activeAccentHex }}
                  />
                  <div className="w-11 h-1.5 rounded-sm bg-[#262932]" />
                </div>
              </div>
              <span
                className={`text-[11px] ${
                  activeColorMode === "dark"
                    ? "text-slate-900 dark:text-[#EDEDED] font-semibold"
                    : "text-slate-500 dark:text-[#8E8E93]"
                }`}
              >
                Dark
              </span>
            </button>
          </div>
        </div>

        {/* 2. Theme Preset */}
        <div className="py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0 max-w-md">
            <div className="text-sm font-medium text-slate-900 dark:text-[#EDEDED]">Theme</div>
            <p className="text-xs text-slate-500 dark:text-[#8E8E93] mt-1">
              Start with a preset, then adjust its colors and fonts
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportTheme}
              title="Download theme preset JSON"
              aria-label="Download theme preset"
              className="w-9 h-9 rounded-full bg-slate-100 dark:bg-[#0E0E10] hover:bg-slate-200 dark:hover:bg-[#19191D] border border-slate-200 dark:border-[#26262A] text-slate-600 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-[#EDEDED] flex items-center justify-center transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" strokeWidth={1.75} />
            </button>

            <button
              type="button"
              onClick={handleCopyTheme}
              title="Copy theme preset JSON"
              aria-label="Copy theme preset"
              className="w-9 h-9 rounded-full bg-slate-100 dark:bg-[#0E0E10] hover:bg-slate-200 dark:hover:bg-[#19191D] border border-slate-200 dark:border-[#26262A] text-slate-600 dark:text-[#A1A1AA] hover:text-slate-900 dark:hover:text-[#EDEDED] flex items-center justify-center transition-colors cursor-pointer"
            >
              {copiedTheme ? (
                <Check className="w-4 h-4 text-emerald-500" strokeWidth={2} />
              ) : (
                <Copy className="w-4 h-4" strokeWidth={1.75} />
              )}
            </button>

            <div className="relative" ref={themeMenuRef}>
              <button
                type="button"
                onClick={() => setThemeMenuOpen(prev => !prev)}
                className="inline-flex items-center gap-2.5 pl-2 pr-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-[#0E0E10] hover:bg-slate-200 dark:hover:bg-[#19191D] border border-slate-200 dark:border-[#26262A] text-xs font-medium text-slate-900 dark:text-[#EDEDED] transition-colors cursor-pointer whitespace-nowrap"
              >
                <span className="w-6 h-6 rounded-full bg-white dark:bg-[#1C1C21] border border-slate-200 dark:border-[#2F2F35] text-[11px] font-semibold text-slate-900 dark:text-[#EDEDED] flex items-center justify-center">
                  Aa
                </span>
                <span>{config.themePreset}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-[#8E8E93]" strokeWidth={1.75} />
              </button>

              {themeMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-[#111216] border border-slate-200 dark:border-[#26262A] rounded-xl py-1.5 z-30 shadow-lg dark:shadow-none">
                  {THEME_PRESETS.map(preset => {
                    const selected = config.themePreset === preset.name;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset.name)}
                        className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          selected
                            ? "bg-slate-100 dark:bg-[#1C1C21] text-slate-900 dark:text-[#EDEDED] font-medium"
                            : "text-slate-600 dark:text-[#A1A1AA] hover:bg-slate-50 dark:hover:bg-[#18181B] hover:text-slate-900 dark:hover:text-[#EDEDED]"
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <span
                            className="w-3 h-3 rounded-full border border-black/10 dark:border-white/20"
                            style={{ backgroundColor: preset.accentHex }}
                          />
                          <span>{preset.name}</span>
                        </span>
                        {selected && (
                          <Check className="w-3.5 h-3.5" style={{ color: activeAccentHex }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Accent */}
        <div className="py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0 max-w-md">
            <div className="text-sm font-medium text-slate-900 dark:text-[#EDEDED]">Accent</div>
            <p className="text-xs text-slate-500 dark:text-[#8E8E93] mt-1">
              Set the color for highlights and selected controls
            </p>
          </div>

          <div className="relative shrink-0" ref={accentMenuRef}>
            <button
              type="button"
              onClick={() => setAccentMenuOpen(prev => !prev)}
              className="inline-flex items-center gap-2.5 pl-2.5 pr-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-[#0E0E10] hover:bg-slate-200 dark:hover:bg-[#19191D] border border-slate-200 dark:border-[#26262A] text-xs font-medium text-slate-900 dark:text-[#EDEDED] transition-colors cursor-pointer whitespace-nowrap"
            >
              <span
                className="w-4 h-4 rounded-full shrink-0 border border-black/10 dark:border-white/15"
                style={{ backgroundColor: activeAccentHex }}
              />
              <span>{config.accentName}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-[#8E8E93]" strokeWidth={1.75} />
            </button>

            {accentMenuOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-[#111216] border border-slate-200 dark:border-[#26262A] rounded-xl py-1.5 z-30 shadow-lg dark:shadow-none">
                {ACCENT_OPTIONS.map(opt => {
                  const selected = config.accentName === opt.name;
                  return (
                    <button
                      key={opt.name}
                      type="button"
                      onClick={() => handleSelectAccent(opt.name, opt.hex)}
                      className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        selected
                          ? "bg-slate-100 dark:bg-[#1C1C21] text-slate-900 dark:text-[#EDEDED] font-medium"
                          : "text-slate-600 dark:text-[#A1A1AA] hover:bg-slate-50 dark:hover:bg-[#18181B] hover:text-slate-900 dark:hover:text-[#EDEDED]"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/10 dark:border-white/15"
                          style={{ backgroundColor: opt.hex }}
                        />
                        <span>{opt.name}</span>
                      </span>
                      {selected && <Check className="w-3.5 h-3.5" style={{ color: opt.hex }} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 4. Background */}
        <div className="py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0 max-w-md">
            <div className="text-sm font-medium text-slate-900 dark:text-[#EDEDED]">Background</div>
            <p className="text-xs text-slate-500 dark:text-[#8E8E93] mt-1">
              Set the color behind app content
            </p>
          </div>

          <div className="inline-flex items-center gap-2.5 pl-2 pr-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-[#0E0E10] border border-slate-200 dark:border-[#26262A] focus-within:border-slate-400 dark:focus-within:border-[#52525B] shrink-0 self-start sm:self-auto">
            <label className="relative w-5 h-5 rounded-full border border-slate-300 dark:border-white/25 cursor-pointer shrink-0 overflow-hidden">
              <span
                className="block w-full h-full rounded-full"
                style={{ backgroundColor: config.background }}
              />
              <input
                type="color"
                aria-label="Pick background color"
                value={isValidHexColor(config.background) ? config.background : "#000000"}
                onChange={e => {
                  const hex = e.target.value.toUpperCase();
                  setBgInput(hex);
                  updateConfig({ background: hex });
                }}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </label>
            <input
              type="text"
              aria-label="Background hex color"
              value={bgInput}
              onChange={e => handleHexChange("background", e.target.value)}
              onBlur={() => setBgInput(config.background)}
              className="w-[70px] bg-transparent text-xs font-mono tabular-nums text-slate-900 dark:text-[#EDEDED] focus:outline-none uppercase"
            />
          </div>
        </div>

        {/* 5. Foreground */}
        <div className="py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0 max-w-md">
            <div className="text-sm font-medium text-slate-900 dark:text-[#EDEDED]">Foreground</div>
            <p className="text-xs text-slate-500 dark:text-[#8E8E93] mt-1">
              Choose the main text color
            </p>
          </div>

          <div className="inline-flex items-center gap-2.5 pl-2 pr-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-[#0E0E10] border border-slate-200 dark:border-[#26262A] focus-within:border-slate-400 dark:focus-within:border-[#52525B] shrink-0 self-start sm:self-auto">
            <label className="relative w-5 h-5 rounded-full border border-slate-300 dark:border-white/25 cursor-pointer shrink-0 overflow-hidden">
              <span
                className="block w-full h-full rounded-full"
                style={{ backgroundColor: config.foreground }}
              />
              <input
                type="color"
                aria-label="Pick foreground color"
                value={isValidHexColor(config.foreground) ? config.foreground : "#EDEDED"}
                onChange={e => {
                  const hex = e.target.value.toUpperCase();
                  setFgInput(hex);
                  updateConfig({ foreground: hex });
                }}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </label>
            <input
              type="text"
              aria-label="Foreground hex color"
              value={fgInput}
              onChange={e => handleHexChange("foreground", e.target.value)}
              onBlur={() => setFgInput(config.foreground)}
              className="w-[70px] bg-transparent text-xs font-mono tabular-nums text-slate-900 dark:text-[#EDEDED] focus:outline-none uppercase"
            />
          </div>
        </div>
      </div>

      {/* Footer Collapsible Trigger (Advanced >) */}
      <div className="mt-8 border-b border-slate-200 dark:border-[#1F1F1F]">
        <button
          type="button"
          onClick={() => setAdvancedOpen(prev => !prev)}
          aria-expanded={advancedOpen}
          className="w-full py-4 flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-[#8E8E93] hover:text-slate-900 dark:hover:text-[#EDEDED] transition-colors cursor-pointer"
        >
          <span>Advanced</span>
          <ChevronRight
            className={`w-3.5 h-3.5 transition-transform duration-150 ${
              advancedOpen ? "rotate-90" : ""
            }`}
            strokeWidth={1.75}
          />
        </button>

        {advancedOpen && (
          <div className="pb-6 pt-2 space-y-4 border-t border-slate-200 dark:border-[#1F1F1F]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3">
              <div>
                <div className="text-xs font-medium text-slate-900 dark:text-[#EDEDED]">
                  Interface font
                </div>
                <p className="text-[11px] text-slate-500 dark:text-[#8E8E93] mt-0.5">
                  Primary typeface used across navigation and prose
                </p>
              </div>
              <select
                value={config.fontFamily}
                onChange={e =>
                  updateConfig({
                    fontFamily: e.target.value as AppearanceConfig["fontFamily"]
                  })
                }
                className="bg-slate-100 dark:bg-[#0E0E10] border border-slate-200 dark:border-[#26262A] rounded-full px-3.5 py-1.5 text-xs text-slate-900 dark:text-[#EDEDED] focus:outline-none"
              >
                <option value="DM Sans">DM Sans</option>
                <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                <option value="JetBrains Mono">JetBrains Mono</option>
                <option value="System UI">System UI</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="text-xs font-medium text-slate-900 dark:text-[#EDEDED]">
                  Code & monospace font
                </div>
                <p className="text-[11px] text-slate-500 dark:text-[#8E8E93] mt-0.5">
                  Used for hex values, tabular numerals, and code blocks
                </p>
              </div>
              <select
                value={config.codeFont}
                onChange={e =>
                  updateConfig({
                    codeFont: e.target.value as AppearanceConfig["codeFont"]
                  })
                }
                className="bg-slate-100 dark:bg-[#0E0E10] border border-slate-200 dark:border-[#26262A] rounded-full px-3.5 py-1.5 text-xs text-slate-900 dark:text-[#EDEDED] focus:outline-none"
              >
                <option value="JetBrains Mono">JetBrains Mono</option>
                <option value="IBM Plex Mono">IBM Plex Mono</option>
                <option value="ui-monospace">System Monospace</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500 dark:text-[#8E8E93]">
                Restore default canvas, typography, and accent
              </span>
              <button
                type="button"
                onClick={handleResetAppearance}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-[#0E0E10] hover:bg-slate-200 dark:hover:bg-[#19191D] border border-slate-200 dark:border-[#26262A] text-xs font-medium text-slate-900 dark:text-[#EDEDED] transition-colors cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500 dark:text-[#8E8E93]" />
                <span>Reset defaults</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
