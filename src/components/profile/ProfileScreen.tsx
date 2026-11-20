import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  User,
  Database,
  Wrench,
  Link2,
  Settings,
  HelpCircle,
  ShieldCheck,
  Plus,
  Trash2,
  Upload,
  LogOut,
  Sparkles,
  FileText,
  ChevronRight,
  Zap,
  Save,
  Mic,
  UserPlus,
  CheckCircle2,
  Bot
} from "lucide-react";
import { VoicePersonaName } from "../../types";

const ENGINE_OPTIONS = [
  "Gemini 4 Hydrogen (Default)",
  "ChatGPT (OpenAI Style)",
  "Claude (Anthropic Style)",
  "DiptiK Lite 350M (Offline)"
];

const VOICE_OPTIONS: VoicePersonaName[] = ["Zephyr", "Puck", "Charon", "Kore", "Fenrir"];

export const ProfileScreen: React.FC = () => {
  const {
    userProfile,
    updateUserProfile,
    firebaseUser,
    isAuthenticated,
    setShowAuth,
    setShowOnboarding,
    setShowAssistantSetup,
    setIsErrorTesterModalOpen,
    openVoiceWithAgent,
    logout,
    userFacts,
    addUserFact,
    deleteUserFact,
    knowledgeLibrary,
    addKnowledgeItem,
    deleteKnowledgeItem,
    activityLogs,
    clearActivityLogs,
    skills,
    toggleSkillStatus,
    integrations,
    toggleIntegrationConnection,
    isOfflineMode,
    toggleOfflineMode,
    addNotification,
    profileSubTab: activeTab = "profile",
    setProfileSubTab: setActiveTabState
  } = useApp();

  const setActiveTab = (tab: any) => {
    if (setActiveTabState) {
      setActiveTabState(tab);
    }
    setTimeout(() => {
      const el = document.getElementById("tab-section-content");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 50);
  };

  // New Fact State
  const [newFactCat, setNewFactCat] = useState("Personal");
  const [newFactVal, setNewFactVal] = useState("");

  // New Knowledge State
  const [newKnowName, setNewKnowName] = useState("");
  const [newKnowType, setNewKnowType] = useState<any>("PDF");

  // Quick New Profile form
  const [showNewProfileForm, setShowNewProfileForm] = useState(false);
  const [newProfName, setNewProfName] = useState("");
  const [newProfNickname, setNewProfNickname] = useState("");
  const [newProfEngine, setNewProfEngine] = useState("Gemini 4 Hydrogen (Default)");
  const [newProfVoice, setNewProfVoice] = useState<VoicePersonaName>("Zephyr");
  const [confirmClearLogs, setConfirmClearLogs] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const handleAddFact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFactVal.trim()) return;
    await addUserFact(newFactCat, newFactVal.trim());
    setNewFactVal("");
    addNotification({
      title: "Memory Updated",
      message: `Stored new fact under ${newFactCat}.`,
      category: "system"
    });
  };

  const handleUploadKnowledge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKnowName.trim()) return;
    addKnowledgeItem({
      id: `know_man_${Date.now()}`,
      name: newKnowName.trim(),
      type: newKnowType,
      size: "240 KB",
      uploadDate: "Today",
      summary: `Manual upload of ${newKnowName} for offline knowledge grounding.`,
      topics: [newKnowType, "User Upload", "Offline Synced"],
      isOffline: true,
      content: `Full text representation of ${newKnowName}.`
    });
    setNewKnowName("");
    addNotification({
      title: "Knowledge Added",
      message: "File indexed to local Knowledge Library.",
      category: "system"
    });
  };

  const handleCreateQuickProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfName.trim()) return;
    await updateUserProfile({
      name: newProfName.trim(),
      nickname: newProfNickname.trim() || newProfName.trim().split(" ")[0],
      defaultEngine: newProfEngine,
      voiceName: newProfVoice
    });
    setNewProfName("");
    setNewProfNickname("");
    setShowNewProfileForm(false);
    setSaveMessage("Profile updated! Tap 'Talk Live Now' to converse with your agent.");
  };

  const navCards = [
    {
      id: "profile",
      title: "Profile & Persona",
      subtitle: "Identity, engine & voice",
      icon: User,
      iconBg: "bg-purple-100 text-purple-600",
      activeRing: "ring-2 ring-purple-600 border-purple-200 bg-purple-50/20"
    },
    {
      id: "memory",
      title: "Memory & Learning",
      subtitle: "AI remembers you",
      icon: Database,
      iconBg: "bg-blue-100 text-blue-600",
      activeRing: "ring-2 ring-blue-600 border-blue-200 bg-blue-50/20"
    },
    {
      id: "logs",
      title: "Audit Trail",
      subtitle: "View activity logs",
      icon: ShieldCheck,
      iconBg: "bg-emerald-100 text-emerald-600",
      activeRing: "ring-2 ring-emerald-600 border-emerald-200 bg-emerald-50/20"
    },
    {
      id: "skills",
      title: "Skills & Tools",
      subtitle: "Manage AI abilities",
      icon: Wrench,
      iconBg: "bg-amber-100 text-amber-600",
      activeRing: "ring-2 ring-amber-600 border-amber-200 bg-amber-50/20"
    },
    {
      id: "integrations",
      title: "Connected Apps",
      subtitle: "Services & accounts",
      icon: Link2,
      iconBg: "bg-pink-100 text-pink-600",
      activeRing: "ring-2 ring-pink-600 border-pink-200 bg-pink-50/20"
    },
    {
      id: "settings",
      title: "Settings & Security",
      subtitle: "Preferences & privacy",
      icon: Settings,
      iconBg: "bg-indigo-100 text-indigo-600",
      activeRing: "ring-2 ring-indigo-600 border-indigo-200 bg-indigo-50/20"
    }
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 1. Dark Indigo Hero Card */}
      <div className="bg-gradient-to-r from-[#170A28] via-[#12071E] to-[#190C2C] text-white p-6 md:p-8 rounded-[32px] shadow-xl relative overflow-hidden border border-purple-500/20 text-left">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
          <div className="flex items-center space-x-2">
            <span className="px-3.5 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[11px] font-extrabold uppercase tracking-wider rounded-xl shadow-md">
              {userProfile.tier || userProfile.plan || "PRO AGENT"}
            </span>
            <span className="px-3 py-1 bg-white/10 text-purple-200 text-[11px] font-bold rounded-xl">
              {firebaseUser ? `Verified: ${firebaseUser.email}` : "Default / Local Profile"}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAuth(true)}
              className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl text-xs font-bold text-white cursor-pointer"
            >
              {firebaseUser ? "Switch Account" : "Sign In / Switch"}
            </button>
            {isAuthenticated && (
              <button
                onClick={logout}
                title="Sign out"
                className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 rounded-xl text-xs font-bold text-red-200 flex items-center space-x-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>

        {/* Main avatar & info */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center space-x-5 min-w-0">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-3xl shadow-lg shrink-0 border border-white/20 overflow-hidden">
              {firebaseUser?.photoURL ? (
                <img src={firebaseUser.photoURL} alt={userProfile.name} className="w-full h-full object-cover" />
              ) : (
                userProfile.nickname?.[0] || userProfile.name?.[0] || "U"
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight truncate">
                {userProfile.name}
              </h1>
              <div className="flex items-center space-x-2 mt-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Active Profile</span>
                <span className="text-gray-500 hidden sm:inline">•</span>
                <span className="text-xs font-medium text-gray-300 truncate hidden sm:inline">
                  Call me "{userProfile.nickname}"
                </span>
              </div>
              <p className="text-xs text-purple-200/80 mt-1 max-w-md truncate">
                {userProfile.persona || "Default (Friendly & Helpful)"} • Voice: {userProfile.voiceName || "Zephyr"}
              </p>
            </div>
          </div>

          <div className="shrink-0 pt-2 md:pt-0 flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => openVoiceWithAgent(null)}
              className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-2xl text-xs sm:text-sm font-extrabold text-white shadow-md flex items-center space-x-2 cursor-pointer"
            >
              <Mic className="w-4 h-4 shrink-0" />
              <span>Talk Live Now</span>
            </button>
            <button
              onClick={() => setShowAssistantSetup(true)}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-xs sm:text-sm font-extrabold text-white shadow-md flex items-center space-x-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-purple-300 shrink-0" />
              <span>Customize</span>
            </button>
          </div>
        </div>

        {/* Bottom metrics row */}
        <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-gray-400 uppercase block">Active AI Engine</span>
              <strong className="text-sm md:text-base font-extrabold text-white">
                {userProfile.defaultEngine || "Gemini 4 Hydrogen (Default)"}
              </strong>
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:border-l sm:border-white/10 sm:pl-6">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-gray-400 uppercase block">Live Voice & Style</span>
              <strong className="text-sm md:text-base font-extrabold text-white">
                {userProfile.voiceName || "Zephyr"} • {userProfile.style}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Bento Grid Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {navCards.map(card => {
          const Icon = card.icon;
          const isSelected = activeTab === card.id;
          return (
            <div
              key={card.id}
              onClick={() => setActiveTab(card.id as any)}
              className={`p-5 rounded-3xl border transition-all duration-200 cursor-pointer flex items-center justify-between group text-left ${
                isSelected
                  ? `${card.activeRing} shadow-md`
                  : "bg-white border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-md hover:bg-gray-50/60"
              }`}
            >
              <div className="flex items-center space-x-4 min-w-0">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${card.iconBg} font-bold shadow-xs`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-extrabold text-gray-900 truncate group-hover:text-purple-600 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{card.subtitle}</p>
                </div>
              </div>
              <ChevronRight
                className={`w-5 h-5 shrink-0 transition-transform duration-200 ${
                  isSelected
                    ? "text-gray-900 translate-x-1 font-bold"
                    : "text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5"
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* 3. Help & About Banner */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
        <div className="flex items-center space-x-4 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h4 className="text-base font-extrabold text-gray-900 truncate">Need help getting started?</h4>
            <p className="text-xs text-gray-500 mt-0.5">Learn more about DiptiK AI, Voice Live, and Authentication.</p>
          </div>
        </div>
        <button
          onClick={() => setActiveTab("help")}
          className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer border ${
            activeTab === "help"
              ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
              : "bg-gray-50 hover:bg-gray-100 text-indigo-950 border-gray-200/80 shadow-xs"
          }`}
        >
          <span>Help & About</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div id="tab-section-content" className="scroll-mt-6 pt-2">
        {/* TAB 1: Profile, Multi-Profile Switcher & AI Engine Selection */}
        {activeTab === "profile" && (
          <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm text-left space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-gray-100">
              <div className="flex items-start sm:items-center space-x-3.5">
                <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 font-bold shadow-xs">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-gray-900">
                    User Profile, AI Engine & Voice Persona
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Create your own profile or switch between default presets (Gemini, ChatGPT, Claude, Offline).
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowNewProfileForm(!showNewProfileForm)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>New Profile</span>
              </button>
            </div>

            {saveMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{saveMessage}</span>
                </span>
                <button
                  onClick={() => openVoiceWithAgent(null)}
                  className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                >
                  Talk Live Now
                </button>
              </div>
            )}

            {/* Quick Create New Profile Drawer */}
            {showNewProfileForm && (
              <form
                onSubmit={handleCreateQuickProfile}
                className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-3"
              >
                <h4 className="text-xs font-extrabold text-purple-950 uppercase">Create Another Profile</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={newProfName}
                    onChange={e => setNewProfName(e.target.value)}
                    required
                    placeholder="Full Name (e.g. Sara Khan)"
                    className="px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs font-medium"
                  />
                  <input
                    type="text"
                    value={newProfNickname}
                    onChange={e => setNewProfNickname(e.target.value)}
                    placeholder="Nickname (e.g. Sara)"
                    className="px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs font-medium"
                  />
                  <select
                    value={newProfEngine}
                    onChange={e => setNewProfEngine(e.target.value)}
                    className="px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs font-medium"
                  >
                    {ENGINE_OPTIONS.map(eng => (
                      <option key={eng} value={eng}>{eng}</option>
                    ))}
                  </select>
                  <select
                    value={newProfVoice}
                    onChange={e => setNewProfVoice(e.target.value as VoicePersonaName)}
                    className="px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs font-medium"
                  >
                    {VOICE_OPTIONS.map(v => (
                      <option key={v} value={v}>Voice: {v}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowNewProfileForm(false)}
                    className="px-3 py-1.5 bg-white text-gray-600 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#E31B23] text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Create & Activate Profile
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase flex items-center">
                  <User className="w-3.5 h-3.5 text-purple-600 mr-1.5" />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  value={userProfile.name}
                  onChange={e => updateUserProfile({ name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold mt-1.5"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase flex items-center">
                  <FileText className="w-3.5 h-3.5 text-purple-600 mr-1.5" />
                  <span>Nickname / Call Me</span>
                </label>
                <input
                  type="text"
                  value={userProfile.nickname}
                  onChange={e => updateUserProfile({ nickname: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold mt-1.5"
                />
              </div>
            </div>

            {/* Preferred Default AI Provider / Engine & Live Voice */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase block">
                  Default AI Engine (Gemini, ChatGPT, Claude, Offline)
                </label>
                <select
                  value={userProfile.defaultEngine || "Gemini 4 Hydrogen (Default)"}
                  onChange={e => updateUserProfile({ defaultEngine: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold mt-1.5"
                >
                  {ENGINE_OPTIONS.map(eng => (
                    <option key={eng} value={eng}>{eng}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase block">
                  Real-Time Voice Agent Persona
                </label>
                <select
                  value={userProfile.voiceName || "Zephyr"}
                  onChange={e => updateUserProfile({ voiceName: e.target.value as VoicePersonaName })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold mt-1.5"
                >
                  {VOICE_OPTIONS.map(v => (
                    <option key={v} value={v}>{v} (Gemini Live Audio)</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 uppercase block">Assistant Communication Persona</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-2">
                {[
                  "Default (Friendly & Helpful)",
                  "Professional (Formal & Concise)",
                  "Academic (Detailed & Analytical)",
                  "Casual (Relaxed & Conversational)",
                  "Creative (Expressive & Imaginative)",
                  "Concise (Brief & Direct)",
                  "Enthusiastic (Energetic & Encouraging)",
                  "Empathetic (Supportive & Patient)"
                ].map(p => {
                  const isSel = userProfile.persona === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => updateUserProfile({ persona: p })}
                      className={`p-3 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer ${
                        isSel
                          ? "bg-purple-50 border-purple-600 text-purple-900 font-bold ring-1 ring-purple-600"
                          : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 uppercase block">Custom System Instructions</label>
              <textarea
                value={userProfile.customInstructions || ""}
                onChange={e => updateUserProfile({ customInstructions: e.target.value })}
                rows={3}
                placeholder="e.g. Always format numbers with commas and provide bulleted executive summaries..."
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs mt-1.5"
              />
            </div>

            <div className="pt-3 flex flex-col sm:flex-row gap-3">
              <button
                onClick={async () => {
                  await updateUserProfile(userProfile);
                  setSaveMessage("Profile & Persona saved! Ready for real-time voice.");
                  addNotification({
                    title: "Profile Saved",
                    message: "Your identity, AI engine, and voice preferences have been saved.",
                    category: "system"
                  });
                }}
                className="flex-1 py-3.5 px-6 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-2xl text-sm font-extrabold shadow-lg flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile</span>
              </button>
              <button
                type="button"
                onClick={() => openVoiceWithAgent(null)}
                className="py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-extrabold shadow-md flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Mic className="w-4 h-4" />
                <span>Talk to Agent Live</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: Memory & Knowledge Library */}
        {activeTab === "memory" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-md space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900 uppercase flex items-center space-x-1.5">
                    <Database className="w-4 h-4 text-[#E31B23]" />
                    <span>Long-Term User Facts ({userFacts.length})</span>
                  </span>
                  <span className="text-[10px] bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded-full">
                    {firebaseUser ? "Cloud Synced" : "Local Memory"}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  DiptiK AI learns facts from chat or you can manually add preferences.
                </p>

                <form onSubmit={handleAddFact} className="flex space-x-2">
                  <select
                    value={newFactCat}
                    onChange={e => setNewFactCat(e.target.value)}
                    className="w-28 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium"
                  >
                    <option>Personal</option>
                    <option>Work</option>
                    <option>Preferences</option>
                    <option>Health</option>
                  </select>
                  <input
                    type="text"
                    value={newFactVal}
                    onChange={e => setNewFactVal(e.target.value)}
                    placeholder="e.g. Prefer morning flights..."
                    className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium"
                  />
                  <button type="submit" className="px-3 py-1.5 bg-[#E31B23] text-white rounded-xl text-xs font-bold cursor-pointer">
                    Add
                  </button>
                </form>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {userFacts.map(fact => (
                    <div
                      key={fact.id}
                      className="p-3 bg-gray-50 border border-gray-200/80 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="pr-2">
                        <span className="text-[10px] font-bold bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded uppercase">
                          {fact.category}
                        </span>
                        <span className="ml-2 font-medium text-gray-900">{fact.value || fact.fact || fact.title}</span>
                      </div>
                      <button
                        onClick={() => deleteUserFact(fact.id)}
                        className="text-gray-400 hover:text-red-600 cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-md space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900 uppercase flex items-center space-x-1.5">
                    <FileText className="w-4 h-4 text-[#E31B23]" />
                    <span>Knowledge Library ({knowledgeLibrary.length})</span>
                  </span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                    Offline Ready
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Uploaded PDFs, notes, and research briefs are indexed for instant search.
                </p>

                <form onSubmit={handleUploadKnowledge} className="flex space-x-2">
                  <select
                    value={newKnowType}
                    onChange={e => setNewKnowType(e.target.value as any)}
                    className="w-28 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium"
                  >
                    <option value="PDF">PDF</option>
                    <option value="Text Note">Text Note</option>
                    <option value="Website">Website</option>
                  </select>
                  <input
                    type="text"
                    value={newKnowName}
                    onChange={e => setNewKnowName(e.target.value)}
                    placeholder="File name (e.g. Q3 Roadmap.pdf)"
                    className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Add</span>
                  </button>
                </form>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {knowledgeLibrary.map(item => (
                    <div
                      key={item.id}
                      className="p-3 bg-gray-50 border border-gray-200/80 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="truncate pr-2">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-gray-900 truncate">{item.name}</span>
                          <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                            Synced
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-500 block truncate">{item.summary}</span>
                      </div>
                      <button
                        onClick={() => deleteKnowledgeItem(item.id)}
                        className="text-gray-400 hover:text-red-600 shrink-0 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Activity Logs Audit Trail */}
        {activeTab === "logs" && (
          <div className="max-w-4xl mx-auto bg-white rounded-3xl p-6 border border-gray-100 shadow-md text-left space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-gray-900">Activity & Security Audit Trail</h3>
                <p className="text-xs text-gray-500">
                  Transparency log of every command executed, service invoked, and permission used.
                </p>
              </div>
              {confirmClearLogs ? (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      clearActivityLogs();
                      setConfirmClearLogs(false);
                    }}
                    className="px-3 py-1.5 bg-red-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Confirm Clear
                  </button>
                  <button
                    onClick={() => setConfirmClearLogs(false)}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmClearLogs(true)}
                  className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear History</span>
                </button>
              )}
            </div>

            <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
              {activityLogs.length === 0 ? (
                <p className="text-center text-xs text-gray-400 py-12">No activity recorded yet.</p>
              ) : (
                activityLogs.map(log => (
                  <div
                    key={log.id}
                    className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-extrabold text-gray-900">{log.command}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            log.confirmationLevel === 3
                              ? "bg-red-100 text-red-800"
                              : log.confirmationLevel === 2
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          Level {log.confirmationLevel}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">{log.timestamp}</span>
                      </div>
                      <p className="text-xs text-gray-700">
                        <strong>Interpretation:</strong> {log.interpretation}
                      </p>
                      <p className="text-xs text-[#E31B23]">
                        <strong>Action:</strong> {log.actionPerformed}
                      </p>
                      <div className="flex flex-wrap gap-2 text-[10px] text-gray-500 pt-1">
                        <span>
                          <strong>Service:</strong> {log.serviceUsed}
                        </span>
                        <span>•</span>
                        <span>
                          <strong>Data:</strong> {log.dataAccessed}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl self-start sm:self-center">
                      {log.result}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: Skills & Tools */}
        {activeTab === "skills" && (
          <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 border border-gray-100 shadow-md text-left space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-gray-900">Installed Assistant Skills & Plugins</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {skills.map(sk => {
                const enabled = sk.isEnabled ?? sk.enabled;
                return (
                  <div
                    key={sk.id}
                    className="p-4 rounded-2xl border border-gray-200 bg-white flex items-start justify-between space-x-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-extrabold text-gray-900">{sk.name}</span>
                        <span className="text-[9px] font-bold bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded uppercase">
                          {sk.category}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">{sk.description}</p>
                    </div>
                    <button
                      onClick={() => toggleSkillStatus(sk.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                        enabled
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                      }`}
                    >
                      {enabled ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: Connected Apps */}
        {activeTab === "integrations" && (
          <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 border border-gray-100 shadow-md text-left space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-gray-900">Connected Apps & External Services</h3>
              <p className="text-xs text-gray-500">
                Manage connected accounts and service permissions for your assistant.
              </p>
            </div>

            <div className="space-y-3">
              {integrations.map(intg => {
                const isConnected = intg.status === "connected" || intg.connected;
                return (
                  <div
                    key={intg.id}
                    className="p-4 rounded-2xl border border-gray-200 bg-white flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-extrabold text-gray-900">{intg.name}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isConnected ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {isConnected ? "Connected" : "Disconnected"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{intg.account || intg.description}</p>
                    </div>

                    <button
                      onClick={() => toggleIntegrationConnection(intg.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isConnected
                          ? "bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600"
                          : "bg-[#E31B23] hover:bg-[#BF141B] text-white shadow-sm"
                      }`}
                    >
                      {isConnected ? "Disconnect" : "Connect"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 6: Settings & Safety */}
        {activeTab === "settings" && (
          <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 border border-gray-100 shadow-md text-left space-y-6">
            <h3 className="text-base font-extrabold text-gray-900">Application Settings & Privacy Controls</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-gray-700 uppercase">Appearance Theme</label>
                <select
                  value={userProfile.theme || "light"}
                  onChange={e => updateUserProfile({ theme: e.target.value as any })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium mt-1"
                >
                  <option value="light">Light Theme (Default)</option>
                  <option value="dark">Dark Theme (Twilight Eye-Safe)</option>
                  <option value="system">System Default</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-gray-700 uppercase">Primary Language</label>
                <select
                  value={userProfile.language}
                  onChange={e => updateUserProfile({ language: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium mt-1"
                >
                  <option>English (US)</option>
                  <option>Spanish (Español)</option>
                  <option>French (Français)</option>
                  <option>Bengali (বাংলা)</option>
                  <option>Hindi (हिन्दी)</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Privacy & Voice Configuration</h4>
              <div className="p-4 bg-gray-50 rounded-2xl space-y-3">
                <label className="flex items-center justify-between cursor-pointer text-xs">
                  <span className="font-bold text-gray-900">Offline Lite Mode Only</span>
                  <input
                    type="checkbox"
                    checked={isOfflineMode}
                    onChange={toggleOfflineMode}
                    className="rounded text-[#E31B23]"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer text-xs">
                  <span className="font-bold text-gray-900">Voice Assistant Wake Word ("Hey DiptiK")</span>
                  <input
                    type="checkbox"
                    checked={Boolean(userProfile.wakeWordEnabled)}
                    onChange={() => updateUserProfile({ wakeWordEnabled: !userProfile.wakeWordEnabled })}
                    className="rounded text-[#E31B23]"
                  />
                </label>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-900">Speech Rate</span>
                  <div className="flex space-x-1">
                    {(["0.8x", "1.0x", "1.2x", "1.5x"] as const).map(spd => (
                      <button
                        key={spd}
                        onClick={() => updateUserProfile({ speed: spd })}
                        className={`px-2 py-1 rounded font-bold cursor-pointer ${
                          userProfile.speed === spd ? "bg-[#E31B23] text-white" : "bg-white text-gray-700 border"
                        }`}
                      >
                        {spd}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
              {confirmReset ? (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      localStorage.clear();
                      window.location.reload();
                    }}
                    className="py-2 px-4 bg-red-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Confirm Full Reset
                  </button>
                  <button
                    onClick={() => setConfirmReset(false)}
                    className="py-2 px-4 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmReset(true)}
                  className="py-2.5 px-5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Reset Local State
                </button>
              )}
              <span className="text-xs text-gray-400">DiptiK AI Agent • Gemini 4 Hydrogen & 3.8 Live</span>
            </div>
          </div>
        )}

        {/* TAB 7: Help & About */}
        {activeTab === "help" && (
          <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 border border-gray-100 shadow-md text-left space-y-5">
            <div>
              <h3 className="text-base font-extrabold text-gray-900">DiptiK AI Assistant Architecture</h3>
              <p className="text-xs text-gray-500">Hybrid Online Cloud + Real-Time Live Voice + On-Device Mobile Assistant</p>
            </div>

            <div className="space-y-3 text-xs text-gray-700 leading-relaxed">
              <div className="p-4 bg-gray-50 rounded-2xl space-y-2">
                <h4 className="font-bold text-gray-900">1. Multi-Profile & AI Engine Support</h4>
                <p>
                  Sign in with Google or create custom profiles stored securely, or start anytime with Default presets (Gemini 4 Hydrogen, ChatGPT Style, Claude Style, or On-Device Lite 350M).
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl space-y-2">
                <h4 className="font-bold text-gray-900">2. Real-Time Voice Agent (Gemini 3.8 Live)</h4>
                <p>
                  Tap the center Microphone button or "Talk to Agent" to stream live 16kHz audio and receive instant 24kHz voice responses with live transcripts and hands-free task creation.
                </p>
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setShowOnboarding(true)}
                className="py-2.5 px-5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold flex-1 cursor-pointer"
              >
                Replay Onboarding Guide
              </button>
              <button
                onClick={() => setIsErrorTesterModalOpen(true)}
                className="py-2.5 px-5 bg-[#E31B23] text-white rounded-xl text-xs font-bold flex-1 cursor-pointer"
              >
                Test Error Lab & Safeguards
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
