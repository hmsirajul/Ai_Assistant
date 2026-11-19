import React from "react";
import { useApp } from "../../context/AppContext";
import {
  Sparkles,
  Mic,
  Search,
  PenTool,
  Scan,
  Globe,
  ArrowRight,
  MessageSquare,
  Cpu,
  WifiOff,
  Wifi,
  Play,
  Pause,
  Clock,
  CheckCircle,
  FileText,
  Calculator,
  ShieldCheck,
  AlertCircle,
  Folder,
  Send,
  HelpCircle,
  Smartphone
} from "lucide-react";
import { DiptiKLogo } from "../common/DiptiKLogo";

export const HomeScreen: React.FC = () => {
  const {
    userProfile,
    isOfflineMode,
    toggleOfflineMode,
    setActiveTab,
    setActiveAIMode,
    conversations,
    setActiveConversationId,
    automations,
    toggleAutomationStatus,
    setIsVoiceModalOpen,
    setIsResearchModalOpen,
    setIsVisionModalOpen,
    setIsNotesModalOpen,
    setIsPhoneActionsModalOpen,
    setIsErrorTesterModalOpen,
    sendMessage
  } = useApp();

  const activeAutomations = automations.filter(a => a.status === "active").slice(0, 2);
  const recentChats = conversations.slice(0, 3);

  const handleQuickCommand = (cmdText: string, mode: any = "Ask") => {
    setActiveAIMode(mode);
    setActiveTab("chat");
    sendMessage(cmdText, isOfflineMode ? "Offline" : mode);
  };

  const quickActions = [
    { label: "Ask AI", icon: Sparkles, color: "bg-[#FFF0F1] text-[#E31B23]", action: () => { setActiveAIMode("Ask"); setActiveTab("chat"); } },
    { label: "Voice Command", icon: Mic, color: "bg-emerald-50 text-emerald-600", action: () => setIsVoiceModalOpen(true) },
    { label: "Research", icon: Search, color: "bg-blue-50 text-blue-600", action: () => setIsResearchModalOpen(true) },
    { label: "Create Content", icon: PenTool, color: "bg-purple-50 text-purple-600", action: () => { setActiveAIMode("Create"); setActiveTab("chat"); } },
    { label: "Scan Document", icon: Scan, color: "bg-amber-50 text-amber-600", action: () => setIsVisionModalOpen(true) },
    { label: "Phone Actions", icon: Globe, color: "bg-indigo-50 text-indigo-600", action: () => setIsPhoneActionsModalOpen(true) }
  ];

  const suggestedCommands = [
    { title: "Summarize my notifications", mode: "Ask" },
    { title: "Create a reminder for 5 PM", mode: "Act" },
    { title: "Plan my morning schedule", mode: "Act" },
    { title: "Translate English to Spanish", mode: "Ask" },
    { title: "Find my Bluetooth pairing note", mode: "Offline" },
    { title: "Draft a professional update email", mode: "Create" }
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* 1. Greeting & Status Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white p-5 md:p-6 rounded-3xl shadow-md">
        <div className="flex items-center space-x-4 min-w-0">
          <DiptiKLogo size="lg" showText={false} className="shrink-0 drop-shadow-lg" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-300 truncate">DiptiK AI Operational</span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-white mt-1 truncate">
              Hello, {userProfile.nickname || "Explorer"}!
            </h1>
            <p className="text-xs text-gray-300 mt-0.5 line-clamp-2">
              {isOfflineMode
                ? "Operating locally on device (Lite 350M). Zero cloud data usage."
                : `Connected via ${userProfile.defaultEngine || "Gemini 4 Hydrogen"}. Ready for real-time voice, reasoning & agents.`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 lg:pt-0 border-t border-white/10 lg:border-t-0">
          <button
            onClick={() => setIsNotesModalOpen(true)}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm"
          >
            <FileText className="w-4 h-4 text-purple-300 shrink-0" />
            <span className="whitespace-nowrap">AI Notes</span>
          </button>
          <button
            onClick={toggleOfflineMode}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-md ${
              isOfflineMode ? "bg-amber-500 text-gray-950 hover:bg-amber-400 font-extrabold" : "bg-[#E31B23] hover:bg-[#BF141B] text-white"
            }`}
          >
            {isOfflineMode ? <WifiOff className="w-4 h-4 shrink-0" /> : <Wifi className="w-4 h-4 shrink-0" />}
            <span className="whitespace-nowrap">{isOfflineMode ? "Offline Lite Mode" : "Online Cloud Mode"}</span>
          </button>
        </div>
      </div>

      {/* 2. Main Assistant Card (Section 8) */}
      <div className="bg-white rounded-3xl p-6 shadow-md border border-gray-100 text-left space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#FFF0F1] to-transparent rounded-bl-full pointer-events-none -z-10" />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF0F1] flex items-center justify-center text-[#E31B23]">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-gray-900">What can I help you with?</h2>
              <p className="text-xs text-gray-500">Ask anything, run a phone action, or start an agent workflow.</p>
            </div>
          </div>
        </div>

        {/* Quick input bar trigger */}
        <div
          onClick={() => { setActiveAIMode("Ask"); setActiveTab("chat"); }}
          className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-2xl p-3.5 flex items-center justify-between text-gray-400 cursor-pointer transition-all shadow-inner"
        >
          <span className="text-xs font-medium text-gray-500">Ask DiptiK AI a question or give a command...</span>
          <div className="flex items-center space-x-2">
            <span onClick={e => { e.stopPropagation(); setIsVisionModalOpen(true); }} className="p-1.5 hover:bg-white rounded-lg text-gray-500 hover:text-[#E31B23] transition-colors" title="Scan or analyze image">
              <Scan className="w-4 h-4" />
            </span>
            <span onClick={e => { e.stopPropagation(); setIsVoiceModalOpen(true); }} className="p-1.5 bg-[#E31B23] text-white rounded-xl shadow-sm" title="Speak command">
              <Mic className="w-4 h-4" />
            </span>
          </div>
        </div>
      </div>

      {/* 3. Quick Actions Grid (Section 8) */}
      <div>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-1 text-left">Quick Actions</h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
          {quickActions.map((act, idx) => {
            const Icon = act.icon;
            return (
              <button
                key={idx}
                onClick={act.action}
                className="p-3.5 bg-white hover:bg-gray-50 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center text-center group cursor-pointer"
              >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-2 transition-transform group-hover:scale-110 ${act.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-gray-800 leading-tight">{act.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Suggested Commands (Section 8) */}
      <div>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-1 text-left">Suggested Commands</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {suggestedCommands.map((cmd, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickCommand(cmd.title, cmd.mode)}
              className="p-3 bg-white hover:bg-[#FFF0F1]/50 border border-gray-100 hover:border-[#E31B23]/30 rounded-2xl text-left transition-all flex items-center justify-between group shadow-sm cursor-pointer"
            >
              <div className="truncate pr-2">
                <span className="text-xs font-bold text-gray-800 group-hover:text-[#E31B23] block truncate">
                  "{cmd.title}"
                </span>
                <span className="text-[10px] text-gray-400 uppercase font-mono mt-0.5 block">{cmd.mode} Mode</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#E31B23] group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* 5. Recent Conversations (Section 8) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Recent Conversations</h3>
          <button onClick={() => setActiveTab("chat")} className="text-xs font-bold text-[#E31B23] hover:underline">
            View All ({conversations.length})
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {recentChats.map(conv => (
            <div
              key={conv.id}
              onClick={() => { setActiveConversationId(conv.id); setActiveTab("chat"); }}
              className="p-4 bg-white hover:bg-gray-50 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between cursor-pointer space-y-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    conv.mode === "Offline" ? "bg-amber-50 text-amber-800" : "bg-[#FFF0F1] text-[#E31B23]"
                  }`}>
                    {conv.mode} Mode
                  </span>
                  <span className="text-[10px] text-gray-400">{conv.updatedAt}</span>
                </div>
                <h4 className="text-xs font-bold text-gray-900 mt-2 line-clamp-1">{conv.title}</h4>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">{conv.lastMessage}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs font-bold text-[#E31B23]">
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Active Automations Summary (Section 8 & 14) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 bg-white rounded-3xl border border-gray-100 shadow-sm text-left space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-900 flex items-center space-x-1.5">
              <Cpu className="w-4 h-4 text-[#E31B23]" />
              <span>Active Automations ({activeAutomations.length})</span>
            </span>
            <button onClick={() => setActiveTab("automations")} className="text-xs font-bold text-[#E31B23] hover:underline">
              Manage All
            </button>
          </div>

          <div className="space-y-2">
            {activeAutomations.map(auto => (
              <div key={auto.id} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
                <div className="truncate pr-2">
                  <span className="text-xs font-bold text-gray-800 block truncate">{auto.name}</span>
                  <span className="text-[10px] text-gray-500 block">Next: {auto.nextRun}</span>
                </div>
                <button
                  onClick={() => toggleAutomationStatus(auto.id)}
                  title="Pause automation"
                  className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-600 transition-colors"
                >
                  <Pause className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 7. Offline Tools Preview (Section 8 & 31) */}
        <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl border border-amber-200/60 text-left space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-950 flex items-center space-x-1.5">
              <WifiOff className="w-4 h-4 text-amber-700" />
              <span>Downloaded Offline Capabilities</span>
            </span>
            <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
              3 Packages Ready
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { label: "Voice Commands", icon: Mic },
              { label: "Offline Notes", icon: FileText },
              { label: "Translation", icon: Globe },
              { label: "Local Search", icon: Search },
              { label: "Calculator", icon: Calculator },
              { label: "Phone Dialer", icon: Smartphone }
            ].map((tool, i) => {
              const Icon = tool.icon;
              return (
                <div key={i} className="p-2 bg-white/80 rounded-xl flex items-center space-x-1.5 text-xs font-medium text-amber-950 border border-amber-200/50 shadow-2xs">
                  <Icon className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span className="truncate">{tool.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 8. Command Processing Flow Visualizer & Safety Disclaimer (Section 30 - 33) */}
      <div className="p-5 bg-white rounded-3xl border border-gray-100 shadow-sm text-left space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-900 flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>DiptiK AI 12-Step Command Processing & Safety System</span>
          </span>
          <button
            onClick={() => setIsErrorTesterModalOpen(true)}
            className="text-xs text-[#E31B23] font-bold hover:underline flex items-center space-x-1"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Open Error Lab</span>
          </button>
        </div>

        {/* Horizontal steps flow */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-[10px]">
          {[
            "1. User speaks/types",
            "2. Speech to text",
            "3. Language detect",
            "4. Intent classify",
            "5. Engine select",
            "6. Action planning",
            "7. Permission check",
            "8. User safeguard",
            "9. Tool execution",
            "10. Verify result",
            "11. Audit logging",
            "12. Present result"
          ].map((st, i) => (
            <div key={i} className="p-2 bg-gray-50 border border-gray-200 rounded-xl font-mono text-gray-700 font-semibold flex items-center justify-between">
              <span>{st}</span>
              {i < 11 && <span className="text-gray-300 hidden md:inline">→</span>}
            </div>
          ))}
        </div>

        {/* Section 33 Transparency Disclaimer */}
        <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-[11px] text-gray-600 flex items-start space-x-2.5">
          <AlertCircle className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-gray-900">Safety & Transparency Guarantee (Section 33):</strong> DiptiK AI never promises bypassing app permissions, secretly entering passwords, completing banking transfers without confirmation, or reading private app information without consent. DiptiK AI completes supported phone and connected-service actions with clear permissions and explicit user approval.
          </div>
        </div>
      </div>

    </div>
  );
};
