import React, { useState, useEffect, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import {
  ArrowLeft,
  Search,
  User,
  UserCheck,
  Fingerprint,
  SlidersHorizontal,
  Mic,
  Smartphone,
  ShieldCheck,
  Database,
  Plug,
  Code2,
  Pencil,
  Check,
  X,
  LogOut,
  Beaker,
  Download,
  CheckCircle2,
  Menu,
  Trash2,
  Palette,
  Volume2
} from "lucide-react";
import { AIEngineProvider, UserProfile, VoicePersonaName } from "../../types";
import { enrollDeviceBiometric } from "../../lib/biometrics";
import { AppearanceSettingsSection } from "./AppearanceSettingsSection";
import {
  VOICE_ACCENT_OPTIONS,
  VOICE_PERSONA_DETAILS,
  VoiceAccent,
  loadVoiceAccent,
  saveVoiceAccent,
  speakWithAccent
} from "../../lib/voice";

type SettingsSectionId =
  | "profile"
  | "account"
  | "security"
  | "preferences"
  | "appearance"
  | "voice"
  | "phone"
  | "permissions"
  | "data"
  | "integrations"
  | "coding";

interface NavItemConfig {
  id: SettingsSectionId;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  keywords: string[];
}

interface NavGroupConfig {
  group: string;
  items: NavItemConfig[];
}

const NAV_GROUPS: NavGroupConfig[] = [
  {
    group: "Profile",
    items: [
      {
        id: "profile",
        label: "Profile",
        icon: User,
        keywords: ["profile", "nickname", "persona", "phone", "sign in", "switch", "avatar"]
      }
    ]
  },
  {
    group: "Account",
    items: [
      {
        id: "account",
        label: "Account",
        icon: UserCheck,
        keywords: ["account", "name", "handle", "username", "email", "plan", "country", "age", "delete"]
      },
      {
        id: "security",
        label: "Security",
        icon: Fingerprint,
        keywords: ["security", "biometric", "passkey", "face id", "lock", "sign out", "level 3"]
      }
    ]
  },
  {
    group: "App",
    items: [
      {
        id: "preferences",
        label: "Preferences",
        icon: SlidersHorizontal,
        keywords: ["app", "language", "style", "offline", "lite"]
      },
      {
        id: "appearance",
        label: "Appearance",
        icon: Palette,
        keywords: ["appearance", "visual style", "color mode", "theme", "accent", "background", "foreground", "fonts", "dark", "light", "system"]
      },
      {
        id: "voice",
        label: "Voice & Audio",
        icon: Mic,
        keywords: ["voice", "uk", "british", "accent", "persona", "zephyr", "puck", "charon", "kore", "fenrir", "speed", "wake"]
      },
      {
        id: "phone",
        label: "Phone & Alerts",
        icon: Smartphone,
        keywords: ["phone", "push", "briefing", "telegram", "discord", "webhook", "city", "notifications"]
      }
    ]
  },
  {
    group: "Data & Privacy",
    items: [
      {
        id: "permissions",
        label: "Permissions",
        icon: ShieldCheck,
        keywords: ["permissions", "microphone", "camera", "gps", "location", "calendar", "contacts", "privacy"]
      },
      {
        id: "data",
        label: "Data & Memory",
        icon: Database,
        keywords: ["data", "memory", "logs", "offline", "packages", "storage", "clear", "privacy"]
      }
    ]
  },
  {
    group: "Integrations",
    items: [
      {
        id: "integrations",
        label: "Connected Apps",
        icon: Plug,
        keywords: ["integrations", "apps", "workspace", "gmail", "calendar", "connect"]
      }
    ]
  },
  {
    group: "Coding",
    items: [
      {
        id: "coding",
        label: "Coding & Models",
        icon: Code2,
        keywords: ["coding", "model", "engine", "gemini", "chatgpt", "claude", "instructions", "developer", "error lab"]
      }
    ]
  }
];

const AGE_RANGES = ["18–24", "25–34", "35–44", "45–54", "55+", "Prefer not to say"];
const RESPONSE_STYLES: UserProfile["style"][] = ["Concise", "Balanced", "Detailed", "Professional", "Friendly"];
const SPEECH_SPEEDS: UserProfile["speed"][] = ["0.8x", "1.0x", "1.2x", "1.5x"];
const AI_ENGINES: AIEngineProvider[] = [
  "Gemini 4 Hydrogen (Default)",
  "ChatGPT (OpenAI Style)",
  "Claude (Anthropic Style)",
  "DiptiK Lite 350M (Offline)"
];

interface SettingRowProps {
  label: string;
  description: string;
  children: React.ReactNode;
}

const SettingRow: React.FC<SettingRowProps> = ({ label, description, children }) => (
  <div className="py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div className="min-w-0 max-w-md">
      <div className="text-sm font-medium text-slate-900 dark:text-white leading-snug">{label}</div>
      <p className="text-xs text-slate-500 dark:text-[#94a3b8] mt-1 leading-relaxed">{description}</p>
    </div>
    <div className="flex items-center sm:justify-end gap-3 shrink-0">{children}</div>
  </div>
);

interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  ariaLabel: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, ariaLabel }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={ariaLabel}
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0072FF] dark:focus-visible:ring-[#00E5FF] ${
      checked
        ? "bg-[#0072FF] border-[#0072FF] dark:border-[#00E5FF]/50"
        : "bg-slate-200 dark:bg-[#181c2b] border-slate-300 dark:border-white/[0.12]"
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-xs transition-transform duration-150 ${
        checked ? "translate-x-6" : "translate-x-1"
      }`}
    />
  </button>
);

export const SettingsWorkspace: React.FC = () => {
  const {
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    userProfile,
    updateUserProfile,
    firebaseUser,
    setShowAuth,
    logout,
    deleteAccount,
    setIsUpgradeModalOpen,
    setIsPhoneActionsModalOpen,
    setIsErrorTesterModalOpen,
    isOfflineMode,
    toggleOfflineMode,
    permissions,
    togglePermission,
    offlinePackages,
    downloadOfflinePackage,
    integrations,
    toggleIntegrationConnection,
    memoryItems,
    clearAllMemory,
    activityLogs,
    clearActivityLogs,
    developerMode,
    setDeveloperMode,
    phoneBridgeConfig,
    updatePhoneBridgeConfig,
    openVoiceWithAgent,
    addNotification
  } = useApp();

  const [activeSection, setActiveSection] = useState<SettingsSectionId>("account");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [voiceAccent, setVoiceAccent] = useState<VoiceAccent>(() => loadVoiceAccent());

  // Inline editing state
  const [editingField, setEditingField] = useState<string | null>(null);
  const [draftValue, setDraftValue] = useState<string>("");

  // Danger zone delete confirmation state
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isSettingsModalOpen) {
      setVoiceAccent(loadVoiceAccent());
    }
  }, [isSettingsModalOpen]);

  useEffect(() => {
    if (!isSettingsModalOpen) {
      setEditingField(null);
      setConfirmDeleteOpen(false);
      setDeleteConfirmText("");
      setMobileNavOpen(false);
      return;
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (editingField) {
          setEditingField(null);
        } else if (confirmDeleteOpen) {
          setConfirmDeleteOpen(false);
        } else {
          setIsSettingsModalOpen(false);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isSettingsModalOpen, editingField, confirmDeleteOpen, setIsSettingsModalOpen]);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredNavGroups = useMemo(() => {
    if (!normalizedQuery) return NAV_GROUPS;
    return NAV_GROUPS.map(g => ({
      ...g,
      items: g.items.filter(
        item =>
          item.label.toLowerCase().includes(normalizedQuery) ||
          g.group.toLowerCase().includes(normalizedQuery) ||
          item.keywords.some(k => k.includes(normalizedQuery))
      )
    })).filter(g => g.items.length > 0);
  }, [normalizedQuery]);

  // Automatically switch to the first matching category when search yields no match in current section
  useEffect(() => {
    if (!normalizedQuery || filteredNavGroups.length === 0) return;
    const allIds = filteredNavGroups.flatMap(g => g.items.map(i => i.id));
    if (!allIds.includes(activeSection)) {
      setActiveSection(allIds[0]);
    }
  }, [normalizedQuery, filteredNavGroups, activeSection]);

  if (!isSettingsModalOpen) return null;

  const effectiveHandle =
    userProfile.handle ||
    (userProfile.nickname || userProfile.name || "user")
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "");

  const effectiveEmail = firebaseUser?.email || userProfile.email;

  const startEdit = (field: string, initialValue: string) => {
    setEditingField(field);
    setDraftValue(initialValue);
  };

  const commitEdit = async (field: string) => {
    const trimmed = draftValue.trim();
    if (!trimmed && field !== "customInstructions") {
      setEditingField(null);
      return;
    }
    switch (field) {
      case "name":
        await updateUserProfile({ name: trimmed });
        break;
      case "handle":
        await updateUserProfile({ handle: trimmed.replace(/^@+/, "").toLowerCase().replace(/[^a-z0-9_]/g, "") });
        break;
      case "nickname":
        await updateUserProfile({ nickname: trimmed });
        break;
      case "email":
        await updateUserProfile({ email: trimmed });
        break;
      case "country":
        await updateUserProfile({ country: trimmed });
        break;
      case "phone":
        await updateUserProfile({ phone: trimmed });
        break;
      case "ageRange":
        await updateUserProfile({ ageRange: trimmed });
        break;
      case "persona":
        await updateUserProfile({ persona: trimmed });
        break;
      case "style_select":
        await updateUserProfile({ style: trimmed as UserProfile["style"] });
        break;
      case "language_view":
        await updateUserProfile({ language: trimmed });
        break;
      case "wakePhraseWord":
        await updateUserProfile({ wakePhraseWord: trimmed });
        break;
      case "customInstructions":
        await updateUserProfile({ customInstructions: trimmed });
        break;
      case "city":
        updatePhoneBridgeConfig({ city: trimmed });
        break;
      case "dailyBriefingTime":
        updatePhoneBridgeConfig({ dailyBriefingTime: trimmed });
        break;
      default:
        break;
    }
    setEditingField(null);
    addNotification({
      title: "Setting updated",
      message: "Your preference has been saved.",
      category: "system"
    });
  };

  const renderEditableValue = (
    field: string,
    displayValue: string,
    rawValue: string,
    options?: {
      type?: "text" | "email" | "select" | "textarea" | "time";
      selectOptions?: string[];
      placeholder?: string;
    }
  ) => {
    if (editingField === field) {
      return (
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {options?.type === "select" && options.selectOptions ? (
            <select
              autoFocus
              value={draftValue}
              onChange={e => setDraftValue(e.target.value)}
              className="bg-white dark:bg-[#121520] border border-[#0072FF] rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
            >
              {options.selectOptions.map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : options?.type === "textarea" ? (
            <textarea
              autoFocus
              rows={3}
              value={draftValue}
              onChange={e => setDraftValue(e.target.value)}
              placeholder={options.placeholder}
              className="w-full sm:w-80 bg-white dark:bg-[#121520] border border-[#0072FF] rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
            />
          ) : (
            <input
              autoFocus
              type={options?.type || "text"}
              value={draftValue}
              onChange={e => setDraftValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitEdit(field);
                }
              }}
              placeholder={options?.placeholder}
              className="w-48 sm:w-56 bg-white dark:bg-[#121520] border border-[#0072FF] rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
            />
          )}
          <button
            type="button"
            onClick={() => commitEdit(field)}
            className="px-3 py-1.5 rounded-lg btn-diptik-primary text-xs font-medium flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>
          <button
            type="button"
            onClick={() => setEditingField(null)}
            aria-label="Cancel editing"
            className="p-1.5 rounded-lg text-slate-500 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/[0.06] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-sm text-slate-700 dark:text-[#e2e8f0] truncate max-w-[220px] sm:max-w-[280px]">
          {displayValue}
        </span>
        <button
          type="button"
          onClick={() => startEdit(field, rawValue)}
          aria-label={`Edit ${field}`}
          className="p-1.5 rounded-lg text-slate-400 dark:text-[#94a3b8] hover:text-[#0072FF] dark:hover:text-[#00E5FF] hover:bg-slate-200/70 dark:hover:bg-white/[0.06] transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0072FF]"
        >
          <Pencil className="w-3.5 h-3.5" strokeWidth={1.75} />
        </button>
      </div>
    );
  };

  const handleConfirmDeleteAccount = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== "DELETE") return;
    setIsDeleting(true);
    try {
      await deleteAccount();
    } finally {
      setIsDeleting(false);
    }
  };

  const sidebarContent = (
    <div className="h-full flex flex-col bg-white dark:bg-[#090b11] border-r border-slate-200 dark:border-white/[0.08] text-left transition-colors duration-150">
      {/* Top Back to app + Search */}
      <div className="px-4 pt-5 pb-3 space-y-4 shrink-0">
        <button
          type="button"
          onClick={() => setIsSettingsModalOpen(false)}
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-[#cbd5e1] hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0072FF] rounded-md px-1 py-1"
        >
          <ArrowLeft className="w-4 h-4 text-[#0072FF] dark:text-[#00E5FF]" strokeWidth={1.75} />
          <span>Back to app</span>
        </button>

        <div className="relative">
          <Search
            className="w-4 h-4 text-slate-400 dark:text-[#64748b] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            strokeWidth={1.75}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search"
            aria-label="Search settings"
            className="w-full bg-slate-100 dark:bg-[#121520] border border-slate-200 dark:border-white/[0.08] focus:border-[#0072FF] rounded-lg pl-9 pr-8 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748b] focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#64748b] hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Categorized Navigation */}
      <nav
        aria-label="Settings sections"
        className="flex-1 overflow-y-auto gemini-scroll px-3 pb-6 space-y-4"
      >
        {filteredNavGroups.length === 0 ? (
          <div className="px-3 py-6 text-xs text-slate-400 dark:text-[#64748b]">
            No sections matching &ldquo;{searchQuery}&rdquo;
          </div>
        ) : (
          filteredNavGroups.map(group => (
            <div key={group.group}>
              <div className="px-2.5 pb-1.5 text-[11px] font-medium text-slate-400 dark:text-[#64748b]">
                {group.group}
              </div>
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveSection(item.id);
                        setEditingField(null);
                        setMobileNavOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-colors cursor-pointer whitespace-nowrap ${
                        isActive
                          ? "bg-slate-100 dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white font-medium"
                          : "border border-transparent text-slate-600 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-white/[0.04]"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? "text-[#0072FF] dark:text-[#00E5FF]" : "text-slate-400 dark:text-[#64748b]"
                        }`}
                        strokeWidth={1.75}
                      />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </nav>

      {/* Subtle footer brand identity */}
      <div className="px-4 py-3 border-t border-slate-200 dark:border-white/[0.08] shrink-0 flex items-center justify-between text-[11px] text-slate-500 dark:text-[#64748b]">
        <span className="font-display font-medium text-slate-700 dark:text-[#94a3b8]">DiptiK AI 3</span>
        <span>{userProfile.plan}</span>
      </div>
    </div>
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Settings and Account Management"
      className="fixed inset-0 z-50 bg-slate-50 dark:bg-[#0b0d14] text-slate-900 dark:text-[#f8fafc] flex flex-col md:flex-row overflow-hidden transition-colors duration-150"
    >
      {/* Desktop Left Sidebar */}
      <aside className="hidden md:block w-[260px] shrink-0 h-full">{sidebarContent}</aside>

      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#090b11] shrink-0">
        <button
          type="button"
          onClick={() => setIsSettingsModalOpen(false)}
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-[#cbd5e1] hover:text-slate-900 dark:hover:text-white cursor-pointer whitespace-nowrap"
        >
          <ArrowLeft className="w-4 h-4 text-[#0072FF] dark:text-[#00E5FF]" />
          <span>Back to app</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileNavOpen(prev => !prev)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.08] text-xs font-medium text-slate-900 dark:text-white cursor-pointer whitespace-nowrap"
        >
          <Menu className="w-3.5 h-3.5 text-[#0072FF] dark:text-[#00E5FF]" />
          <span>Sections</span>
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div
            onClick={() => setMobileNavOpen(false)}
            className="fixed inset-0 bg-slate-950/50 dark:bg-black/75"
            aria-hidden="true"
          />
          <div className="relative z-10 w-[260px] h-full">{sidebarContent}</div>
        </div>
      )}

      {/* Right Main Content Canvas */}
      <main className="flex-1 min-w-0 h-full overflow-y-auto gemini-scroll bg-slate-50 dark:bg-[#0b0d14] px-6 sm:px-12 lg:px-16 py-8 sm:py-12 transition-colors duration-150">
        <div className="max-w-3xl text-left">
          {/* 1. ACCOUNT SECTION */}
          {activeSection === "account" && (
            <div>
              <header>
                <h1 className="font-display text-2xl sm:text-[28px] font-semibold tracking-tight text-slate-900 dark:text-white">
                  Account
                </h1>
                <p className="text-sm text-slate-500 dark:text-[#94a3b8] mt-1">Review your account details</p>
              </header>

              <div className="mt-8 pb-3 border-b border-slate-200 dark:border-white/[0.08]">
                <h2 className="text-sm font-medium text-slate-700 dark:text-[#e2e8f0]">Details</h2>
              </div>

              <div className="divide-y divide-slate-200 dark:divide-white/[0.06]">
                <SettingRow
                  label="Name"
                  description="Your full display name shown across DiptiK AI 3"
                >
                  {renderEditableValue("name", userProfile.name, userProfile.name)}
                </SettingRow>

                <SettingRow
                  label="Handle"
                  description="Unique identifier used for workspace mentions and links"
                >
                  {renderEditableValue("handle", `@${effectiveHandle}`, effectiveHandle, {
                    placeholder: "username"
                  })}
                </SettingRow>

                <SettingRow
                  label="Email"
                  description="Primary email linked to your account and notifications"
                >
                  {renderEditableValue("email", effectiveEmail, effectiveEmail, {
                    type: "email"
                  })}
                </SettingRow>

                <SettingRow
                  label="Plan"
                  description="Current subscription tier and compute capabilities"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-[#0072FF] dark:text-[#00E5FF] whitespace-nowrap">
                      {userProfile.plan}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsUpgradeModalOpen(true)}
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#181c2b] hover:bg-slate-100 dark:hover:bg-[#1f2437] border border-slate-200 dark:border-white/[0.08] text-xs font-medium text-slate-800 dark:text-white transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Manage
                    </button>
                  </div>
                </SettingRow>

                <SettingRow
                  label="Country"
                  description="Regional formatting for dates, weather, and daily briefings"
                >
                  {renderEditableValue(
                    "country",
                    userProfile.country || "Bangladesh",
                    userProfile.country || "Bangladesh"
                  )}
                </SettingRow>

                <SettingRow
                  label="Age range"
                  description="Used to calibrate workspace content and safeguard defaults"
                >
                  {renderEditableValue(
                    "ageRange",
                    userProfile.ageRange || "25–34",
                    userProfile.ageRange || "25–34",
                    {
                      type: "select",
                      selectOptions: AGE_RANGES
                    }
                  )}
                </SettingRow>

                {/* Danger Zone Row */}
                <div className="py-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="min-w-0 max-w-md">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">Delete account</div>
                      <p className="text-xs text-slate-500 dark:text-[#94a3b8] mt-1">
                        Permanently delete your account and its data
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteOpen(prev => !prev)}
                      className="px-4 py-1.5 rounded-full bg-red-50 dark:bg-[#FF1744]/15 hover:bg-red-100 dark:hover:bg-[#FF1744]/25 border border-red-200 dark:border-[#FF1744]/35 text-xs font-medium text-red-600 dark:text-[#ff6b81] transition-colors cursor-pointer whitespace-nowrap shrink-0 self-start sm:self-auto"
                    >
                      Delete
                    </button>
                  </div>

                  {confirmDeleteOpen && (
                    <div className="p-4 rounded-xl bg-red-50/70 dark:bg-[#121520] border border-red-200 dark:border-[#FF1744]/30 space-y-3">
                      <p className="text-xs text-slate-700 dark:text-[#e2e8f0] leading-relaxed">
                        This removes all locally stored conversations, custom agents, notebooks, and
                        resets your profile. Type <span className="font-mono font-semibold text-slate-900 dark:text-white">DELETE</span>{" "}
                        to confirm.
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          value={deleteConfirmText}
                          onChange={e => setDeleteConfirmText(e.target.value)}
                          placeholder="Type DELETE"
                          className="w-40 bg-white dark:bg-[#0b0d14] border border-slate-300 dark:border-white/[0.1] focus:border-[#FF1744] rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none font-mono"
                        />
                        <button
                          type="button"
                          disabled={deleteConfirmText.trim().toUpperCase() !== "DELETE" || isDeleting}
                          onClick={handleConfirmDeleteAccount}
                          className="px-4 py-1.5 rounded-full bg-[#FF1744] hover:bg-[#e0143c] disabled:opacity-40 text-xs font-medium text-white transition-colors cursor-pointer whitespace-nowrap"
                        >
                          {isDeleting ? "Deleting..." : "Confirm Delete"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmDeleteOpen(false);
                            setDeleteConfirmText("");
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs text-slate-500 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. PROFILE SECTION */}
          {activeSection === "profile" && (
            <div>
              <header>
                <h1 className="font-display text-2xl sm:text-[28px] font-semibold tracking-tight text-slate-900 dark:text-white">
                  Profile
                </h1>
                <p className="text-sm text-slate-500 dark:text-[#94a3b8] mt-1">
                  Manage how DiptiK AI 3 addresses and authenticates you
                </p>
              </header>

              <div className="mt-8 pb-3 border-b border-slate-200 dark:border-white/[0.08]">
                <h2 className="text-sm font-medium text-slate-700 dark:text-[#e2e8f0]">Identity</h2>
              </div>

              <div className="divide-y divide-slate-200 dark:divide-white/[0.06]">
                <SettingRow
                  label="Nickname"
                  description="Preferred short name used by your AI assistant in conversation"
                >
                  {renderEditableValue("nickname", userProfile.nickname, userProfile.nickname)}
                </SettingRow>

                <SettingRow
                  label="Assistant persona"
                  description="Default tone and personality preset for responses"
                >
                  {renderEditableValue(
                    "persona",
                    userProfile.persona || "Default (Friendly & Helpful)",
                    userProfile.persona || "Default (Friendly & Helpful)"
                  )}
                </SettingRow>

                <SettingRow
                  label="Phone number"
                  description="Used as default caller/SMS origin when triggering device actions"
                >
                  {renderEditableValue(
                    "phone",
                    userProfile.phone || "Not set",
                    userProfile.phone || ""
                  )}
                </SettingRow>

                <SettingRow
                  label="Session & Authentication"
                  description={
                    firebaseUser
                      ? `Signed in via ${firebaseUser.providerData?.[0]?.providerId || "Firebase"}`
                      : "Using local workspace profile"
                  }
                >
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSettingsModalOpen(false);
                        setShowAuth(true);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-white dark:bg-[#181c2b] hover:bg-slate-100 dark:hover:bg-[#1f2437] border border-slate-200 dark:border-white/[0.08] text-xs font-medium text-slate-800 dark:text-white cursor-pointer whitespace-nowrap"
                    >
                      {firebaseUser ? "Switch account" : "Sign in"}
                    </button>
                    {firebaseUser && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsSettingsModalOpen(false);
                          logout();
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-red-50 dark:bg-[#FF1744]/15 hover:bg-red-100 dark:hover:bg-[#FF1744]/25 border border-red-200 dark:border-[#FF1744]/30 text-xs font-medium text-red-600 dark:text-[#ff6b81] flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign out</span>
                      </button>
                    )}
                  </div>
                </SettingRow>
              </div>
            </div>
          )}

          {/* 3. SECURITY SECTION */}
          {activeSection === "security" && (
            <div>
              <header>
                <h1 className="font-display text-2xl sm:text-[28px] font-semibold tracking-tight text-slate-900 dark:text-white">
                  Security
                </h1>
                <p className="text-sm text-slate-500 dark:text-[#94a3b8] mt-1">
                  Configure Level 3 safeguards, passkeys, and device lock protection
                </p>
              </header>

              <div className="mt-8 pb-3 border-b border-slate-200 dark:border-white/[0.08]">
                <h2 className="text-sm font-medium text-slate-700 dark:text-[#e2e8f0]">Authentication & Safeguards</h2>
              </div>

              <div className="divide-y divide-slate-200 dark:divide-white/[0.06]">
                <SettingRow
                  label="Device Biometrics (Level 3 Guard)"
                  description={
                    phoneBridgeConfig.biometricCredentialId
                      ? "Passkey / Face ID enrolled for sensitive actions"
                      : "Enroll a passkey or rely on the 1.2s Hold-to-Confirm safeguard"
                  }
                >
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await enrollDeviceBiometric(effectiveEmail || userProfile.name);
                      if (res.success && res.credentialId) {
                        updatePhoneBridgeConfig({ biometricCredentialId: res.credentialId });
                        addNotification({
                          title: "Device Biometrics Enrolled",
                          message: "Passkey verification linked for Level 3 safeguards.",
                          category: "security"
                        });
                      } else {
                        addNotification({
                          title: "Biometric Notice",
                          message: res.error || "Hold-to-Confirm safeguard remains active.",
                          category: "security"
                        });
                      }
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-white dark:bg-[#181c2b] hover:bg-slate-100 dark:hover:bg-[#1f2437] border border-slate-200 dark:border-white/[0.08] text-xs font-medium text-[#0072FF] dark:text-[#00E5FF] flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Fingerprint className="w-3.5 h-3.5" />
                    <span>{phoneBridgeConfig.biometricCredentialId ? "Re-enroll passkey" : "Enroll passkey"}</span>
                  </button>
                </SettingRow>

                <SettingRow
                  label="Require Biometric Confirmation"
                  description="Prompt for WebAuthn passkey before deleting items or sending external messages"
                >
                  <ToggleSwitch
                    checked={Boolean(userProfile.biometric)}
                    onChange={() => updateUserProfile({ biometric: !userProfile.biometric })}
                    ariaLabel="Toggle biometric confirmation"
                  />
                </SettingRow>

                <SettingRow
                  label="Workspace App Lock"
                  description="Lock access when returning after extended inactivity"
                >
                  <ToggleSwitch
                    checked={Boolean(userProfile.appLock)}
                    onChange={() => updateUserProfile({ appLock: !userProfile.appLock })}
                    ariaLabel="Toggle app lock"
                  />
                </SettingRow>
              </div>
            </div>
          )}

          {/* 4. PREFERENCES (APP) SECTION */}
          {activeSection === "preferences" && (
            <div>
              <header>
                <h1 className="font-display text-2xl sm:text-[28px] font-semibold tracking-tight text-slate-900 dark:text-white">
                  Preferences
                </h1>
                <p className="text-sm text-slate-500 dark:text-[#94a3b8] mt-1">
                  Customize language, response formatting, and offline execution
                </p>
              </header>

              <div className="mt-8 pb-3 border-b border-slate-200 dark:border-white/[0.08]">
                <h2 className="text-sm font-medium text-slate-700 dark:text-[#e2e8f0]">General</h2>
              </div>

              <div className="divide-y divide-slate-200 dark:divide-white/[0.06]">
                <SettingRow
                  label="Response style"
                  description="Controls detail density and phrasing across answers"
                >
                  {renderEditableValue("style_select", userProfile.style, userProfile.style, {
                    type: "select",
                    selectOptions: RESPONSE_STYLES
                  })}
                </SettingRow>

                <SettingRow
                  label="Offline Lite Mode (350M)"
                  description="Run queries locally on-device without cloud connectivity"
                >
                  <ToggleSwitch
                    checked={isOfflineMode}
                    onChange={toggleOfflineMode}
                    ariaLabel="Toggle Offline Lite Mode"
                  />
                </SettingRow>

                <SettingRow
                  label="Language"
                  description="Primary interface and speech recognition language"
                >
                  {renderEditableValue(
                    "language_view",
                    userProfile.language || "English (US)",
                    userProfile.language || "English (US)",
                    {
                      type: "select",
                      selectOptions: ["English (US)", "English (UK)", "Bengali", "Spanish", "French"]
                    }
                  )}
                </SettingRow>
              </div>
            </div>
          )}

          {/* 4b. APPEARANCE SECTION */}
          {activeSection === "appearance" && <AppearanceSettingsSection />}

          {/* 5. VOICE & AUDIO SECTION */}
          {activeSection === "voice" && (
            <div>
              <header>
                <h1 className="font-display text-2xl sm:text-[28px] font-semibold tracking-tight text-slate-900 dark:text-white">
                  Voice & Audio
                </h1>
                <p className="text-sm text-slate-500 dark:text-[#94a3b8] mt-1">
                  Configure UK voice accent, real-time persona, cadence, and hands-free wake phrase
                </p>
              </header>

              <div className="mt-8 pb-3 border-b border-slate-200 dark:border-white/[0.08]">
                <h2 className="text-sm font-medium text-slate-700 dark:text-[#e2e8f0]">Live Voice</h2>
              </div>

              <div className="divide-y divide-slate-200 dark:divide-white/[0.06]">
                <SettingRow
                  label="Voice accent"
                  description="Default accent used for Live Voice sessions and Read Aloud playback"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <div
                      className="inline-flex items-center rounded-lg border border-slate-200 dark:border-white/[0.1] bg-slate-100 dark:bg-[#121520] p-0.5"
                      role="group"
                      aria-label="Voice accent"
                    >
                      {VOICE_ACCENT_OPTIONS.map(opt => {
                        const isActive = voiceAccent === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              setVoiceAccent(opt.id);
                              saveVoiceAccent(opt.id);
                              addNotification({
                                title: "Voice accent updated",
                                message: `Voice Assistant set to ${opt.label}.`,
                                category: "system"
                              });
                            }}
                            aria-pressed={isActive}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                              isActive
                                ? "bg-white dark:bg-[#1d2233] text-slate-900 dark:text-white shadow-xs"
                                : "text-slate-600 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white"
                            }`}
                          >
                            {opt.id === "en-GB" ? "UK (en-GB)" : "US (en-US)"}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        speakWithAccent(
                          voiceAccent === "en-GB"
                            ? "Good morning. Your British English voice assistant is ready."
                            : "Good morning. Your American English voice assistant is ready.",
                          {
                            accent: voiceAccent,
                            rate:
                              userProfile.speed === "0.8x"
                                ? 0.85
                                : userProfile.speed === "1.2x"
                                  ? 1.2
                                  : userProfile.speed === "1.5x"
                                    ? 1.45
                                    : 1.0
                          }
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-white/[0.12] bg-white dark:bg-[#121520] hover:bg-slate-50 dark:hover:bg-white/[0.05] px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-[#cbd5e1] transition-colors cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-[#0072FF] dark:text-[#00E5FF]" strokeWidth={1.75} />
                      <span>Preview</span>
                    </button>
                  </div>
                </SettingRow>

                <SettingRow
                  label="Voice persona"
                  description="Select the neural voice used during live sessions"
                >
                  <select
                    value={userProfile.voiceName || "Zephyr"}
                    onChange={e => updateUserProfile({ voiceName: e.target.value as VoicePersonaName })}
                    className="bg-white dark:bg-[#121520] border border-slate-300 dark:border-white/[0.1] focus:border-[#0072FF] rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                  >
                    {VOICE_PERSONA_DETAILS.map(v => (
                      <option key={v.name} value={v.name}>
                        {v.name} — {v.tone}
                      </option>
                    ))}
                  </select>
                </SettingRow>

                <SettingRow
                  label="Playback speed"
                  description="Adjust spoken audio playback cadence"
                >
                  <select
                    value={userProfile.speed || "1.0x"}
                    onChange={e => updateUserProfile({ speed: e.target.value as UserProfile["speed"] })}
                    className="bg-white dark:bg-[#121520] border border-slate-300 dark:border-white/[0.1] focus:border-[#0072FF] rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white tabular-nums focus:outline-none"
                  >
                    {SPEECH_SPEEDS.map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </SettingRow>

                <SettingRow
                  label="Voice wake phrase"
                  description="Listen for your hands-free wake phrase when Voice mode is active"
                >
                  <ToggleSwitch
                    checked={Boolean(userProfile.wakeWordEnabled)}
                    onChange={() =>
                      updateUserProfile({
                        wakeWordEnabled: !userProfile.wakeWordEnabled,
                        wakePhrase: !userProfile.wakeWordEnabled
                      })
                    }
                    ariaLabel="Toggle voice wake phrase"
                  />
                </SettingRow>

                <SettingRow
                  label="Wake phrase trigger"
                  description="Spoken phrase that activates voice capture"
                >
                  {renderEditableValue(
                    "wakePhraseWord",
                    userProfile.wakePhraseWord || "Hey DiptiK",
                    userProfile.wakePhraseWord || "Hey DiptiK"
                  )}
                </SettingRow>

                <SettingRow
                  label="Live Voice studio"
                  description="Open the full-screen hands-free voice assistant with your active accent"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setIsSettingsModalOpen(false);
                      openVoiceWithAgent(null);
                    }}
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#D914D4] to-[#0072FF] px-3.5 py-2 text-xs font-medium text-white shadow-sm hover:opacity-95 transition-opacity cursor-pointer"
                  >
                    <Mic className="w-3.5 h-3.5" strokeWidth={1.75} />
                    <span>Launch Voice Assistant</span>
                  </button>
                </SettingRow>
              </div>
            </div>
          )}

          {/* 6. PHONE & ALERTS SECTION */}
          {activeSection === "phone" && (
            <div>
              <header>
                <h1 className="font-display text-2xl sm:text-[28px] font-semibold tracking-tight text-slate-900 dark:text-white">
                  Phone & Alerts
                </h1>
                <p className="text-sm text-slate-500 dark:text-[#94a3b8] mt-1">
                  Configure daily briefing delivery and mobile action routing
                </p>
              </header>

              <div className="mt-8 pb-3 border-b border-slate-200 dark:border-white/[0.08]">
                <h2 className="text-sm font-medium text-slate-700 dark:text-[#e2e8f0]">Mobile Bridge</h2>
              </div>

              <div className="divide-y divide-slate-200 dark:divide-white/[0.06]">
                <SettingRow
                  label="Push delivery channel"
                  description="Where proactive daily briefings and weather/calendar alerts are sent"
                >
                  <select
                    value={phoneBridgeConfig.channelType}
                    onChange={e =>
                      updatePhoneBridgeConfig({
                        channelType: e.target.value as typeof phoneBridgeConfig.channelType
                      })
                    }
                    className="bg-white dark:bg-[#121520] border border-slate-300 dark:border-white/[0.1] focus:border-[#0072FF] rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="web_push">Browser / PWA Push</option>
                    <option value="telegram">Telegram Bot</option>
                    <option value="discord">Discord Webhook</option>
                    <option value="custom_webhook">Custom HTTPS Webhook</option>
                  </select>
                </SettingRow>

                <SettingRow
                  label="Scheduled daily briefing"
                  description="Automatically compile morning updates at your chosen time"
                >
                  <ToggleSwitch
                    checked={phoneBridgeConfig.autoBriefingEnabled}
                    onChange={() =>
                      updatePhoneBridgeConfig({
                        autoBriefingEnabled: !phoneBridgeConfig.autoBriefingEnabled
                      })
                    }
                    ariaLabel="Toggle scheduled daily briefing"
                  />
                </SettingRow>

                <SettingRow
                  label="Briefing time"
                  description="Daily schedule window in 24-hour format"
                >
                  {renderEditableValue(
                    "dailyBriefingTime",
                    phoneBridgeConfig.dailyBriefingTime || "08:00",
                    phoneBridgeConfig.dailyBriefingTime || "08:00",
                    { type: "time" }
                  )}
                </SettingRow>

                <SettingRow
                  label="Briefing city"
                  description="Default city used for local weather and commute summaries"
                >
                  {renderEditableValue(
                    "city",
                    phoneBridgeConfig.city || "Dhaka",
                    phoneBridgeConfig.city || "Dhaka"
                  )}
                </SettingRow>

                <SettingRow
                  label="Phone Actions Hub"
                  description="Open the dedicated device intent launcher and daily briefing preview"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setIsSettingsModalOpen(false);
                      setIsPhoneActionsModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-white dark:bg-[#181c2b] hover:bg-slate-100 dark:hover:bg-[#1f2437] border border-slate-200 dark:border-white/[0.08] text-xs font-medium text-[#0072FF] dark:text-[#00E5FF] cursor-pointer whitespace-nowrap"
                  >
                    Open Phone Actions
                  </button>
                </SettingRow>
              </div>
            </div>
          )}

          {/* 7. PERMISSIONS SECTION */}
          {activeSection === "permissions" && (
            <div>
              <header>
                <h1 className="font-display text-2xl sm:text-[28px] font-semibold tracking-tight text-slate-900 dark:text-white">
                  Permissions
                </h1>
                <p className="text-sm text-slate-500 dark:text-[#94a3b8] mt-1">
                  Control which device capabilities DiptiK AI 3 may access
                </p>
              </header>

              <div className="mt-8 pb-3 border-b border-slate-200 dark:border-white/[0.08]">
                <h2 className="text-sm font-medium text-slate-700 dark:text-[#e2e8f0]">Device Access</h2>
              </div>

              <div className="divide-y divide-slate-200 dark:divide-white/[0.06]">
                {permissions.map(perm => (
                  <SettingRow key={perm.id} label={perm.name} description={perm.description}>
                    <ToggleSwitch
                      checked={perm.granted}
                      onChange={() => togglePermission(perm.id)}
                      ariaLabel={`Toggle ${perm.name} permission`}
                    />
                  </SettingRow>
                ))}
              </div>
            </div>
          )}

          {/* 8. DATA & MEMORY SECTION */}
          {activeSection === "data" && (
            <div>
              <header>
                <h1 className="font-display text-2xl sm:text-[28px] font-semibold tracking-tight text-slate-900 dark:text-white">
                  Data & Memory
                </h1>
                <p className="text-sm text-slate-500 dark:text-[#94a3b8] mt-1">
                  Inspect saved assistant memory, audit logs, and offline model packages
                </p>
              </header>

              <div className="mt-8 pb-3 border-b border-slate-200 dark:border-white/[0.08]">
                <h2 className="text-sm font-medium text-slate-700 dark:text-[#e2e8f0]">Controls</h2>
              </div>

              <div className="divide-y divide-slate-200 dark:divide-white/[0.06]">
                <SettingRow
                  label="Personal AI Memory"
                  description="Long-term preferences and facts remembered across sessions"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-[#94a3b8]">
                      {memoryItems.length} items
                    </span>
                    <button
                      type="button"
                      disabled={memoryItems.length === 0}
                      onClick={() => {
                        clearAllMemory();
                        addNotification({
                          title: "Memory cleared",
                          message: "All saved memory facts have been removed.",
                          category: "security"
                        });
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#181c2b] hover:bg-slate-100 dark:hover:bg-white/[0.08] disabled:opacity-40 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-700 dark:text-[#cbd5e1] flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500 dark:text-[#ff6b81]" />
                      <span>Clear</span>
                    </button>
                  </div>
                </SettingRow>

                <SettingRow
                  label="Transparency Activity Log"
                  description="Audit history of tool invocations and confirmation checks"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-[#94a3b8]">
                      {activityLogs.length} entries
                    </span>
                    <button
                      type="button"
                      disabled={activityLogs.length === 0}
                      onClick={() => {
                        clearActivityLogs();
                        addNotification({
                          title: "Activity log cleared",
                          message: "Audit trail history has been cleared.",
                          category: "security"
                        });
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#181c2b] hover:bg-slate-100 dark:hover:bg-white/[0.08] disabled:opacity-40 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-700 dark:text-[#cbd5e1] cursor-pointer whitespace-nowrap"
                    >
                      Clear logs
                    </button>
                  </div>
                </SettingRow>

                {offlinePackages.map(pkg => (
                  <SettingRow
                    key={pkg.id}
                    label={`${pkg.name} (${pkg.size})`}
                    description={pkg.description}
                  >
                    {pkg.status === "downloaded" ? (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 whitespace-nowrap">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Installed</span>
                      </span>
                    ) : pkg.status === "downloading" ? (
                      <span className="text-xs text-[#0072FF] dark:text-[#00E5FF] whitespace-nowrap">Downloading...</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => downloadOfflinePackage(pkg.id)}
                        className="px-3 py-1.5 rounded-lg bg-[#0072FF] hover:bg-[#005ce6] text-xs font-medium text-white flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Install</span>
                      </button>
                    )}
                  </SettingRow>
                ))}
              </div>
            </div>
          )}

          {/* 9. INTEGRATIONS SECTION */}
          {activeSection === "integrations" && (
            <div>
              <header>
                <h1 className="font-display text-2xl sm:text-[28px] font-semibold tracking-tight text-slate-900 dark:text-white">
                  Connected Apps
                </h1>
                <p className="text-sm text-slate-500 dark:text-[#94a3b8] mt-1">
                  Enable or disconnect external services available to DiptiK AI 3
                </p>
              </header>

              <div className="mt-8 pb-3 border-b border-slate-200 dark:border-white/[0.08]">
                <h2 className="text-sm font-medium text-slate-700 dark:text-[#e2e8f0]">Integrations</h2>
              </div>

              <div className="divide-y divide-slate-200 dark:divide-white/[0.06]">
                {integrations.map(item => {
                  const isConnected = item.status === "connected" || Boolean(item.connected);
                  return (
                    <SettingRow
                      key={item.id}
                      label={item.name}
                      description={
                        item.account && isConnected
                          ? `${item.description} (${item.account})`
                          : item.description
                      }
                    >
                      <button
                        type="button"
                        onClick={() => toggleIntegrationConnection(item.id)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                          isConnected
                            ? "bg-blue-50 dark:bg-[#0072FF]/15 border-blue-200 dark:border-[#00E5FF]/35 text-[#0072FF] dark:text-[#00E5FF] hover:bg-blue-100 dark:hover:bg-[#0072FF]/25"
                            : "bg-white dark:bg-[#181c2b] border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-[#cbd5e1] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1f2437]"
                        }`}
                      >
                        {isConnected ? "Connected" : "Connect"}
                      </button>
                    </SettingRow>
                  );
                })}
              </div>
            </div>
          )}

          {/* 10. CODING & MODELS SECTION */}
          {activeSection === "coding" && (
            <div>
              <header>
                <h1 className="font-display text-2xl sm:text-[28px] font-semibold tracking-tight text-slate-900 dark:text-white">
                  Coding & Models
                </h1>
                <p className="text-sm text-slate-500 dark:text-[#94a3b8] mt-1">
                  Configure default reasoning models, custom instructions, and developer tools
                </p>
              </header>

              <div className="mt-8 pb-3 border-b border-slate-200 dark:border-white/[0.08]">
                <h2 className="text-sm font-medium text-slate-700 dark:text-[#e2e8f0]">Workspace Engine</h2>
              </div>

              <div className="divide-y divide-slate-200 dark:divide-white/[0.06]">
                <SettingRow
                  label="Default AI Engine"
                  description="Primary model provider routed for chat, synthesis, and coding tasks"
                >
                  <select
                    value={userProfile.defaultEngine || "Gemini 4 Hydrogen (Default)"}
                    onChange={e => updateUserProfile({ defaultEngine: e.target.value })}
                    className="bg-white dark:bg-[#121520] border border-slate-300 dark:border-white/[0.1] focus:border-[#0072FF] rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none max-w-[230px]"
                  >
                    {AI_ENGINES.map(engine => (
                      <option key={engine} value={engine}>
                        {engine}
                      </option>
                    ))}
                  </select>
                </SettingRow>

                <SettingRow
                  label="Custom system instructions"
                  description="Persistent formatting or coding conventions injected into assistant prompts"
                >
                  {renderEditableValue(
                    "customInstructions",
                    userProfile.customInstructions
                      ? `${userProfile.customInstructions.slice(0, 42)}${
                          userProfile.customInstructions.length > 42 ? "..." : ""
                        }`
                      : "None configured",
                    userProfile.customInstructions || "",
                    {
                      type: "textarea",
                      placeholder: "e.g. Prefer TypeScript, concise diffs, and strict error handling."
                    }
                  )}
                </SettingRow>

                <SettingRow
                  label="Developer & Simulation Mode"
                  description="Unlock Safeguards & Error Lab diagnostics across menus"
                >
                  <ToggleSwitch
                    checked={developerMode}
                    onChange={() => setDeveloperMode(!developerMode)}
                    ariaLabel="Toggle Developer & Simulation Mode"
                  />
                </SettingRow>

                {developerMode && (
                  <SettingRow
                    label="Safeguards & Error Lab"
                    description="Launch simulated failure and confirmation level diagnostics"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setIsSettingsModalOpen(false);
                        setIsErrorTesterModalOpen(true);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-white dark:bg-[#181c2b] hover:bg-slate-100 dark:hover:bg-[#1f2437] border border-slate-200 dark:border-white/[0.08] text-xs font-medium text-[#0072FF] dark:text-[#00E5FF] flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <Beaker className="w-3.5 h-3.5" />
                      <span>Open Error Lab</span>
                    </button>
                  </SettingRow>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
