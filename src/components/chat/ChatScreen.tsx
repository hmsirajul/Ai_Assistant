import React, { useState, useRef, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import {
  MessageSquare,
  Plus,
  Search,
  Pin,
  Trash2,
  Share2,
  Copy,
  Volume2,
  RefreshCw,
  Sparkles,
  Mic,
  Camera,
  Paperclip,
  Send,
  Sliders,
  Check,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  CheckSquare,
  Globe,
  WifiOff,
  Code,
  FileText,
  Clock,
  ArrowRight,
  MoreVertical,
  ShieldAlert,
  Play,
  Square,
  AlertTriangle,
  Bot,
  X
} from "lucide-react";

export const ChatScreen: React.FC = () => {
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    activeConversation,
    activeChatAgent,
    setActiveChatAgent,
    createNewConversation,
    sendMessage,
    deleteConversation,
    togglePinConversation,
    activeAIMode,
    setActiveAIMode,
    isOfflineMode,
    addNote,
    addTask,
    addNotification,
    setIsVoiceModalOpen,
    openVoiceWithAgent,
    setIsVisionModalOpen,
    setActiveCommandConfirmation,
    userProfile,
    updateUserProfile
  } = useApp();

  const [input, setInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isTemporaryChat, setIsTemporaryChat] = useState(false);
  const [webAccess, setWebAccess] = useState(true);
  const [selectedModel, setSelectedModel] = useState(userProfile.defaultEngine || "Gemini 4 Hydrogen (Default)");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({});
  const [showSidebar, setShowSidebar] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 1024;
    }
    return false;
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages]);

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setShowSidebar(false);
    }
  };

  const handleCreateNew = () => {
    setActiveConversationId(null);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setShowSidebar(false);
    }
  };

  const handleStopGenerating = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsGenerating(false);
  };

  const handleSend = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText || input;
    if (!textToSend.trim() || isGenerating) return;

    setInput("");
    setIsGenerating(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    try {
      await sendMessage(textToSend, activeAIMode, undefined, {
        webAccess: !isOfflineMode && webAccess,
        signal: controller.signal
      });
    } finally {
      abortControllerRef.current = null;
      setIsGenerating(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReadAloud = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/[*#`_~]/g, ""));
      utterance.rate = userProfile.speed === "1.2x" ? 1.2 : 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSaveToNote = (text: string) => {
    addNote({
      title: `Saved from Chat (${activeAIMode})`,
      content: text,
      tags: ["#chat", `#${activeAIMode.toLowerCase()}`],
      isPinned: false
    });
    addNotification({
      title: "Saved to AI Notes",
      message: "The AI response was saved to your offline AI Notes.",
      category: "system"
    });
  };

  const handleTurnIntoTask = (text: string) => {
    addTask({
      title: text.slice(0, 45) + "...",
      dueDate: "Today",
      time: "5:00 PM",
      priority: "High",
      status: "Today",
      aiSuggestion: "Created from active conversation"
    });
    addNotification({
      title: "Priority Task Created",
      message: "Turned the AI response into a High priority task for today.",
      category: "system"
    });
  };

  const filteredConvs = conversations.filter(c =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pinnedConvs = filteredConvs.filter(c => c.isPinned);
  const recentConvs = filteredConvs.filter(c => !c.isPinned);

  const quickPrompts = [
    { label: "What is today's date and time?", mode: "Ask" },
    { label: "Latest global & tech updates today", mode: "Ask" },
    { label: "Explain Quantum Computing", mode: "Ask" },
    { label: "Write a professional update email", mode: "Create" },
    { label: "Plan a morning meeting routine", mode: "Act" },
    { label: "Create Flutter widget code", mode: "Create" }
  ];

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-130px)] bg-white rounded-3xl border border-gray-100 shadow-md overflow-hidden animate-in fade-in duration-200 relative">
      
      {/* Backdrop overlay for mobile/tablet when sidebar is open */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden animate-in fade-in duration-150"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* 1. Left Sidebar: Conversation List (Section 9.1) */}
      <div className={`
        ${showSidebar ? "flex" : "hidden"} 
        fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
        w-80 h-full lg:h-auto
        border-r border-gray-200 lg:border-gray-100 bg-white lg:bg-gray-50/60 
        flex-col justify-between p-4 shrink-0 
        shadow-2xl lg:shadow-none overflow-y-auto transition-all duration-200
      `}>
        <div className="space-y-3">
          
          {/* Header for Mobile/Tablet Sidebar */}
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 lg:hidden">
            <span className="font-extrabold text-gray-900 text-sm flex items-center space-x-1.5">
              <MessageSquare className="w-4 h-4 text-[#E31B23]" />
              <span>Conversations</span>
            </span>
            <button
              onClick={() => setShowSidebar(false)}
              className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold"
            >
              ✕
            </button>
          </div>

          {/* New Chat Button */}
          <button
            onClick={handleCreateNew}
            className="w-full py-3 px-4 bg-[#E31B23] hover:bg-[#BF141B] text-white rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat Conversation</span>
          </button>

          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#E31B23]"
            />
          </div>

          {/* Pinned Section */}
          {pinnedConvs.length > 0 && (
            <div className="space-y-1 pt-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2">Pinned Chats</span>
              {pinnedConvs.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between group ${
                    activeConversationId === conv.id ? "bg-white shadow-sm border border-gray-200" : "hover:bg-gray-100/80"
                  }`}
                >
                  <div className="truncate pr-2 text-left">
                    <span className="text-xs font-bold text-gray-900 block truncate flex items-center space-x-1">
                      <Pin className="w-3 h-3 text-[#E31B23] shrink-0 fill-[#E31B23]" />
                      <span className="truncate">{conv.title}</span>
                    </span>
                    <span className="text-[10px] text-gray-400 block truncate">{conv.lastMessage}</span>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); togglePinConversation(conv.id); }}
                    title="Unpin chat"
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-700"
                  >
                    <Pin className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Recent Section */}
          <div className="space-y-1 pt-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2">Recent Conversations</span>
            {recentConvs.length === 0 && pinnedConvs.length === 0 ? (
              <div className="px-2 py-4 text-center text-[11px] text-gray-400">
                No past conversations yet. Start a new chat!
              </div>
            ) : (
              recentConvs.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between group text-left ${
                    activeConversationId === conv.id ? "bg-white shadow-sm border border-gray-200" : "hover:bg-gray-100/80"
                  }`}
                >
                  <div className="truncate pr-2">
                    <span className="text-xs font-bold text-gray-900 block truncate">{conv.title}</span>
                    <span className="text-[10px] text-gray-400 block truncate">{conv.lastMessage}</span>
                  </div>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={e => { e.stopPropagation(); togglePinConversation(conv.id); }}
                      title="Pin chat"
                      className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-[#E31B23]"
                    >
                      <Pin className="w-3 h-3" />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); deleteConversation(conv.id); }}
                      title="Delete chat"
                      className="p-1 hover:bg-red-100 rounded text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

        {/* Temporary chat note */}
        <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between text-[11px] text-gray-500 px-1">
          <span>Temporary Chat</span>
          <input
            type="checkbox"
            checked={isTemporaryChat}
            onChange={() => setIsTemporaryChat(!isTemporaryChat)}
            className="rounded text-[#E31B23]"
            title="When active, conversations are not saved to long-term memory"
          />
        </div>
      </div>

      {/* 2. Main Chat Area (Section 9.2) */}
      <div className="flex-1 flex flex-col justify-between bg-white relative overflow-hidden min-w-0">
        
        {/* Top Chat Header */}
        <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-white z-10 gap-2">
          <div className="flex items-center space-x-2 min-w-0">
            {/* Toggle Sidebar Button */}
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl flex items-center space-x-1.5 text-xs font-bold transition-all shrink-0 cursor-pointer"
              title="Toggle Conversations List"
            >
              <MessageSquare className="w-4 h-4 text-[#E31B23]" />
              <span className="hidden sm:inline">Chats</span>
            </button>

            <span className="font-bold text-gray-900 text-sm truncate max-w-[130px] sm:max-w-xs md:max-w-md">
              {activeConversation?.title || "New Chat"}
            </span>
            {isTemporaryChat && (
              <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                Temporary
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            {/* AI Mode Switcher (Section 4 & 9.2) */}
            <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-xl text-xs overflow-x-auto max-w-[160px] sm:max-w-none no-scrollbar">
              {(["Ask", "Act", "Research", "Create", "Offline"] as const).map(md => (
                <button
                  key={md}
                  onClick={() => setActiveAIMode(md)}
                  className={`px-2 py-1 rounded-lg font-bold transition-all whitespace-nowrap shrink-0 ${
                    activeAIMode === md ? "bg-white text-[#E31B23] shadow-sm" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {md}
                </button>
              ))}
            </div>

            {/* Model & Settings Button */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors"
              title="Chat & AI Settings"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Active Agent Banner */}
        {activeChatAgent && (
          <div className="px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-2 min-w-0">
              <Bot className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="font-bold text-indigo-950 truncate">
                Agent Active: {activeChatAgent.name}
              </span>
              <span className="text-[10px] text-indigo-600 hidden sm:inline truncate">
                • {activeChatAgent.goal}
              </span>
            </div>
            <div className="flex items-center space-x-1.5 shrink-0">
              <button
                onClick={() => openVoiceWithAgent(activeChatAgent)}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold flex items-center space-x-1 cursor-pointer"
              >
                <Mic className="w-3 h-3" />
                <span>Talk Live</span>
              </button>
              <button
                onClick={() => setActiveChatAgent(null)}
                title="Clear active agent"
                className="p-1 rounded-lg hover:bg-indigo-100 text-indigo-500 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Chat Settings Modal Overlay (Section 9.4) */}
        {showSettings && (
          <div className="absolute top-14 right-4 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 p-4 z-30 animate-in fade-in duration-150 text-left space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <span className="font-bold text-xs text-gray-900">Chat Settings (Section 9.4)</span>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">AI Model Engine</label>
              <select
                value={selectedModel}
                onChange={e => {
                  setSelectedModel(e.target.value);
                  updateUserProfile({ defaultEngine: e.target.value });
                }}
                className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium mt-1"
              >
                <option value="Gemini 4 Hydrogen (Default)">Gemini 4 Hydrogen (Default • Fast & Capable)</option>
                <option value="ChatGPT Style">ChatGPT Style Persona (Conversational)</option>
                <option value="Claude Style">Claude Style Persona (Thoughtful & Clear)</option>
                <option value="Offline Lite (350M)">DiptiK AI On-Device Lite (350M • Offline)</option>
              </select>
            </div>

            <div className="space-y-2 pt-1 text-xs">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-700 font-medium">Live Web Updates (Google Search)</span>
                <input
                  type="checkbox"
                  checked={!isOfflineMode && webAccess}
                  disabled={isOfflineMode}
                  onChange={() => setWebAccess(!webAccess)}
                  className="rounded text-[#E31B23]"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-700 font-medium">Memory & Profile Access</span>
                <input
                  type="checkbox"
                  checked={!isTemporaryChat}
                  onChange={() => setIsTemporaryChat(!isTemporaryChat)}
                  className="rounded text-[#E31B23]"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-700 font-medium">Automatic Tool Calling</span>
                <input type="checkbox" defaultChecked className="rounded text-[#E31B23]" />
              </label>
            </div>
          </div>
        )}

        {/* Message Area (Section 9.2) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!activeConversation || activeConversation.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-6 px-2">
              <div className="w-16 h-16 rounded-3xl bg-[#FFF0F1] text-[#E31B23] flex items-center justify-center mb-4 shadow-xs">
                <Sparkles className="w-8 h-8" />
              </div>
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-gray-100 text-[10px] font-bold text-gray-700 mb-2">
                <span className={`w-2 h-2 rounded-full ${isOfflineMode ? "bg-amber-500" : "bg-emerald-500 animate-pulse"}`} />
                <span>
                  {isOfflineMode
                    ? "Offline Lite (350M)"
                    : `${userProfile.defaultEngine || "Gemini 4 Hydrogen"} • Real-Time`}
                </span>
              </span>
              <h3 className="text-lg font-extrabold text-gray-900">
                Welcome, {userProfile.nickname || userProfile.name || "Friend"}!
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm leading-relaxed">
                Start a fresh conversation in <span className="font-bold text-gray-700">{activeAIMode} Mode</span>. Ask anything, get live updates, run phone commands, or talk with your voice agent.
              </p>

              <button
                type="button"
                onClick={() => openVoiceWithAgent(activeChatAgent)}
                className="mt-4 inline-flex items-center space-x-1.5 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Mic className="w-3.5 h-3.5 text-[#E31B23]" />
                <span>Talk to Voice Agent in Real Time</span>
              </button>

              {/* Quick Prompts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-5 max-w-md w-full">
                {quickPrompts.map((qp, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(undefined, qp.label)}
                    className="p-3 bg-gray-50 hover:bg-[#FFF0F1]/50 border border-gray-200 hover:border-[#E31B23]/30 rounded-2xl text-left transition-all text-xs font-semibold text-gray-800 cursor-pointer flex items-center justify-between gap-2"
                  >
                    <span className="truncate">"{qp.label}"</span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            activeConversation.messages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"} animate-in fade-in duration-150`}
              >
                <div className="flex items-center space-x-1.5 mb-1 px-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">
                    {msg.sender === "user" ? "You" : `DiptiK AI (${msg.mode})`}
                  </span>
                  <span className="text-[9px] text-gray-400">{msg.timestamp}</span>
                </div>

                <div
                  className={`max-w-xl p-4 rounded-2xl text-xs leading-relaxed text-left ${
                    msg.sender === "user"
                      ? "bg-[#E31B23] text-white rounded-tr-none shadow-sm font-medium"
                      : "bg-gray-50 text-gray-900 rounded-tl-none border border-gray-200/80 shadow-sm font-sans whitespace-pre-line"
                  }`}
                >
                  {msg.isStreaming && !msg.text ? (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <RefreshCw className="w-3.5 h-3.5 text-[#E31B23] animate-spin shrink-0" />
                      <span className="font-medium">{msg.statusText || "Thinking in real time..."}</span>
                    </div>
                  ) : (
                    <>
                      <span>{msg.text}</span>
                      {msg.isStreaming && (
                        <span className="inline-block w-1.5 h-3.5 ml-1 bg-[#E31B23] align-middle animate-pulse" />
                      )}
                    </>
                  )}

                  {/* Live Web Grounding Sources */}
                  {msg.sources && msg.sources.length > 0 && !msg.isStreaming && (
                    <div className="mt-3 pt-2.5 border-t border-gray-200/70 space-y-1.5">
                      <div className="flex items-center space-x-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        <Globe className="w-3 h-3 text-emerald-600" />
                        <span>Live Web Sources</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.map((src, idx) => (
                          <a
                            key={idx}
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 px-2 py-1 bg-white hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 rounded-lg text-[10px] font-semibold text-gray-700 hover:text-emerald-800 transition-colors max-w-[220px]"
                            title={src.url}
                          >
                            <Globe className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                            <span className="truncate">{src.title}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action card if phone command or plan step (Section 11) */}
                  {msg.actionCard && (
                    <div className="mt-3 p-3.5 bg-white border border-gray-200 rounded-xl space-y-2.5 text-gray-900 shadow-xs flex flex-col justify-between">
                      <div>
                        {/* 1. Header in one line */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-gray-900 truncate block">
                            {msg.actionCard.action.app} Command
                          </span>
                        </div>

                        {/* 2. Level left side */}
                        <div className="mt-2 flex items-center">
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-200 px-2.5 py-0.5 rounded-full">
                            Level {msg.actionCard.confirmationLevel} Safeguard • Confirmation Required
                          </span>
                        </div>

                        {/* 3. Description */}
                        <p className="text-xs font-medium text-gray-700 mt-2 leading-relaxed">
                          {msg.actionCard.action.details}
                        </p>
                      </div>

                      {/* 4. Below keep button */}
                      <button
                        onClick={() => {
                          if (!msg.actionCard) return;
                          setActiveCommandConfirmation({
                            action: msg.actionCard.action,
                            level: msg.actionCard.confirmationLevel,
                            onConfirm: () => {
                              addNotification({
                                title: "Action Executed",
                                message: `Approved & executed in ${msg.actionCard?.action.app}!`,
                                category: "system"
                              });
                            },
                            onCancel: () => {}
                          });
                        }}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center"
                      >
                        Approve & Execute Now
                      </button>
                    </div>
                  )}

                  {/* Suggested commands chips */}
                  {msg.suggestedCommands && msg.suggestedCommands.length > 0 && !msg.isStreaming && (
                    <div className="mt-3 pt-3 border-t border-gray-200/60 flex flex-wrap gap-1.5">
                      {msg.suggestedCommands.map((sc, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(undefined, sc)}
                          className="px-2.5 py-1 bg-white hover:bg-[#FFF0F1] text-gray-700 hover:text-[#E31B23] rounded-lg border border-gray-200 text-[10px] font-semibold transition-colors cursor-pointer"
                        >
                          "{sc}"
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Message Actions Bar (Section 9.3) */}
                {msg.sender === "ai" && !msg.isStreaming && msg.text && (
                  <div className="flex items-center space-x-1 mt-1.5 px-1 text-gray-400">
                    <button
                      onClick={() => handleCopy(msg.id, msg.text)}
                      title="Copy response"
                      className="p-1 hover:bg-gray-100 rounded-lg hover:text-gray-700 transition-colors flex items-center space-x-0.5 text-[10px]"
                    >
                      {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === msg.id ? "Copied" : "Copy"}</span>
                    </button>

                    <button
                      onClick={() => handleReadAloud(msg.text)}
                      title="Read aloud via Speech Synthesis"
                      className="p-1 hover:bg-gray-100 rounded-lg hover:text-gray-700 transition-colors text-[10px] flex items-center space-x-0.5"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>Read</span>
                    </button>

                    <button
                      onClick={() => handleSaveToNote(msg.text)}
                      title="Save to AI Notes"
                      className="p-1 hover:bg-gray-100 rounded-lg hover:text-gray-700 transition-colors text-[10px] flex items-center space-x-0.5"
                    >
                      <Bookmark className="w-3 h-3" />
                      <span>Note</span>
                    </button>

                    <button
                      onClick={() => handleTurnIntoTask(msg.text)}
                      title="Turn into priority Task"
                      className="p-1 hover:bg-gray-100 rounded-lg hover:text-gray-700 transition-colors text-[10px] flex items-center space-x-0.5"
                    >
                      <CheckSquare className="w-3 h-3" />
                      <span>Task</span>
                    </button>

                    <button
                      onClick={() => setLikedIds(prev => ({ ...prev, [msg.id]: !prev[msg.id] }))}
                      title="Like response"
                      className={`p-1 hover:bg-gray-100 rounded-lg transition-colors text-[10px] ${likedIds[msg.id] ? "text-[#E31B23]" : ""}`}
                    >
                      <ThumbsUp className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Composer (Section 9.2) */}
        <div className="p-3 bg-white border-t border-gray-100">
          <form onSubmit={e => handleSend(e)} className="flex items-center space-x-2 bg-gray-50 border border-gray-200 rounded-2xl p-1.5 focus-within:ring-2 focus-within:ring-[#E31B23]">
            <button
              type="button"
              onClick={() => setIsVisionModalOpen(true)}
              title="Attach photo or document scan"
              className="p-2 rounded-xl text-gray-400 hover:text-[#E31B23] hover:bg-white transition-colors"
            >
              <Camera className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => openVoiceWithAgent(activeChatAgent)}
              title="Talk to Agent in Real Time"
              className="p-2 rounded-xl text-gray-400 hover:text-[#E31B23] hover:bg-white transition-colors cursor-pointer"
            >
              <Mic className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={`Ask anything or type command in ${activeAIMode} mode...`}
              disabled={isGenerating}
              className="flex-1 bg-transparent px-2 py-2 text-xs font-medium text-gray-900 placeholder-gray-400 focus:outline-none"
            />

            {isGenerating ? (
              <button
                type="button"
                onClick={handleStopGenerating}
                title="Stop generating"
                className="p-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-colors cursor-pointer"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                title="Send message"
                className="p-2 bg-[#E31B23] hover:bg-[#BF141B] disabled:opacity-40 text-white rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </form>
        </div>

      </div>

    </div>
  );
};
