import React, { useState, useRef, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { PromptComposer } from "./PromptComposer";
import { DiptiKLogo } from "../common/DiptiKLogo";
import {
  Clock,
  MapPin,
  Target,
  Copy,
  Check,
  Volume2,
  Bookmark,
  ExternalLink,
  ShieldAlert,
  Play,
  Pause,
  Plus,
  Trash2,
  NotebookPen,
  Sparkles,
  Mic,
  Bot,
  FileText,
  RefreshCw,
  CheckCircle2
} from "lucide-react";
import { runAutomationTest } from "../../services/api";
import { VoicePersonaName } from "../../types";
import { loadVoiceAccent, speakWithAccent } from "../../lib/voice";
import { LibraryView } from "../workspace/LibraryView";
import { StudyTableView } from "../workspace/StudyTableView";
import { CodersView } from "../workspace/CodersView";

const PROMPT_SUGGESTIONS = [
  {
    text: "Clean up my calendar for me",
    icon: Clock,
    mode: "Act" as const
  },
  {
    text: "Plan a trip to Cox's Bazar",
    icon: MapPin,
    mode: "Research" as const
  },
  {
    text: "Reset my focus in 5 minutes",
    icon: Target,
    mode: "Ask" as const
  }
];

function renderFormattedText(raw: string): React.ReactNode {
  if (!raw) return null;
  const lines = raw.split("\n");
  return lines.map((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("### ")) {
      return (
        <h4 key={i} className="font-display text-[15px] font-semibold text-slate-900 dark:text-white mt-3 mb-1">
          {trimmed.slice(4)}
        </h4>
      );
    }
    if (trimmed.startsWith("## ")) {
      return (
        <h3 key={i} className="font-display text-base font-semibold text-slate-900 dark:text-white mt-3.5 mb-1.5">
          {trimmed.slice(3)}
        </h3>
      );
    }
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      return (
        <div key={i} className="flex items-start gap-2 pl-1 my-1">
          <span className="text-[#0072FF] dark:text-[#00E5FF] mt-1 text-xs" aria-hidden="true">•</span>
          <span>{renderInlineMarkdown(trimmed.slice(2))}</span>
        </div>
      );
    }
    if (/^\d+\.\s/.test(trimmed)) {
      const match = trimmed.match(/^(\d+\.)\s(.*)$/);
      if (match) {
        return (
          <div key={i} className="flex items-start gap-2 pl-1 my-1">
            <span className="text-[#0072FF] dark:text-[#00E5FF] font-mono text-xs mt-0.5 tabular-nums">{match[1]}</span>
            <span>{renderInlineMarkdown(match[2])}</span>
          </div>
        );
      }
    }
    if (!trimmed) return <div key={i} className="h-2" />;
    return (
      <p key={i} className="my-1 leading-relaxed">
        {renderInlineMarkdown(line)}
      </p>
    );
  });
}

function renderInlineMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className="font-semibold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={idx} className="font-mono text-[12px] bg-slate-200/70 dark:bg-white/[0.08] text-[#0072FF] dark:text-[#00E5FF] px-1.5 py-0.5 rounded">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

interface WorkspaceMainProps {
  onOpenNewNotebook: () => void;
}

export const WorkspaceMain: React.FC<WorkspaceMainProps> = ({ onOpenNewNotebook }) => {
  const {
    activeWorkspaceView,
    setActiveWorkspaceView,
    activeConversation,
    setActiveConversationId,
    sendMessage,
    activeAIMode,
    isOfflineMode,
    userProfile,
    updateUserProfile,
    notebooks,
    activeNotebookId,
    setActiveNotebookId,
    updateNotebook,
    deleteNotebook,
    addNotebook,
    tasks,
    toggleTaskCompletion,
    automations,
    toggleAutomationStatus,
    addAutomation,
    deleteAutomation,
    agentTemplates,
    addAgentTemplate,
    deleteAgentTemplate,
    setActiveChatAgent,
    openVoiceWithAgent,
    setIsPhoneActionsModalOpen,
    setActiveCommandConfirmation,
    addNotification
  } = useApp();

  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scheduled automation quick-add state
  const [newAutoName, setNewAutoName] = useState("");
  const [newAutoTrigger, setNewAutoTrigger] = useState("Daily at 9:00 AM");
  const [newAutoAction, setNewAutoAction] = useState("Summarize inbox & calendar agenda");
  const [runningAutoId, setRunningAutoId] = useState<string | null>(null);

  // Customize agent quick-add state
  const [showNewAgent, setShowNewAgent] = useState(false);
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentGoal, setNewAgentGoal] = useState("");
  const [newAgentInstructions, setNewAgentInstructions] = useState("");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages?.length]);

  const handleSendPrompt = async (
    text: string,
    attachment?: { image?: string; file?: { name: string; size: string; type: string } },
    webAccess = true,
    overrideMode?: "Ask" | "Act" | "Research" | "Create" | "Offline"
  ) => {
    if (isGenerating) return;
    setActiveWorkspaceView("chat");
    setIsGenerating(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      await sendMessage(text, overrideMode || activeAIMode, attachment, {
        webAccess,
        signal: controller.signal
      });
    } finally {
      abortRef.current = null;
      setIsGenerating(false);
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsGenerating(false);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleReadAloud = (text: string) => {
    const rate =
      userProfile.speed === "0.8x"
        ? 0.85
        : userProfile.speed === "1.2x"
          ? 1.2
          : userProfile.speed === "1.5x"
            ? 1.5
            : 1.0;
    speakWithAccent(text, {
      accent: loadVoiceAccent(),
      rate
    });
  };

  const handleSaveResponseToNotebook = (text: string) => {
    const nb = addNotebook({
      title: `Saved Insight · ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      description: "Saved directly from DiptiK AI 3 chat conversation.",
      content: text,
      tags: ["Chat Save"]
    });
    addNotification({
      title: "Saved to Notebooks",
      message: `"${nb.title}" added to your Notebooks.`,
      category: "system"
    });
  };

  const activeNotebook = notebooks.find(n => n.id === activeNotebookId) || null;

  // ------------------------------------------------------------------
  // VIEW 1: ZERO-STATE CHAT STAGE ("Where should we start?")
  // ------------------------------------------------------------------
  if (activeWorkspaceView === "chat" && !activeConversation) {
    return (
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-4 sm:px-8 pb-12 relative overflow-y-auto gemini-scroll">
        {/* Soft Dual-Hemisphere DiptiK Logo Ambient Glow (Pink/Violet Left + Cyber Blue Right) */}
        <div
          className="pointer-events-none absolute inset-0 opacity-60 dark:opacity-100"
          style={{
            background:
              "radial-gradient(ellipse 38% 42% at 38% 44%, rgba(217, 20, 212, 0.14) 0%, transparent 72%), radial-gradient(ellipse 42% 45% at 62% 44%, rgba(0, 114, 255, 0.18) 0%, transparent 72%)"
          }}
          aria-hidden="true"
        />

        <div className="w-full max-w-3xl mx-auto relative z-10 flex flex-col items-center">
          <h1
            className="font-display text-3xl sm:text-[40px] font-semibold tracking-tight text-slate-900 dark:text-white text-center mb-8"
            style={{ textWrap: "balance" }}
          >
            Where should we start?
          </h1>

          <PromptComposer
            onSend={(text, att, web) => handleSendPrompt(text, att, web)}
            isGenerating={isGenerating}
            onStop={handleStop}
            placeholder="Ask DiptiK AI 3"
          />

          {/* 3 Left-Aligned Quick Prompt Suggestions */}
          <div className="w-full mt-5 space-y-1.5">
            {PROMPT_SUGGESTIONS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendPrompt(item.text, undefined, !isOfflineMode, item.mode)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-[14px] text-slate-600 dark:text-[#cbd5e1] hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.05] transition-colors duration-150 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0072FF]"
                >
                  <Icon
                    className="w-4 h-4 text-slate-400 dark:text-[#94a3b8] group-hover:text-[#0072FF] dark:group-hover:text-[#00E5FF] shrink-0 transition-colors"
                    strokeWidth={1.75}
                  />
                  <span className="truncate">{item.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // VIEW 2: ACTIVE CHAT CONVERSATION THREAD
  // ------------------------------------------------------------------
  if (activeWorkspaceView === "chat" && activeConversation) {
    return (
      <div className="flex-1 min-h-0 flex flex-col relative">
        <div className="flex-1 min-h-0 overflow-y-auto gemini-scroll px-4 sm:px-8 pt-2 pb-6">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.06] pb-3">
              <div className="min-w-0">
                <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white truncate">
                  {activeConversation.title}
                </h2>
                <p className="text-xs text-slate-500 dark:text-[#64748b] mt-0.5">
                  {activeConversation.mode} Mode · {activeConversation.updatedAt}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveConversationId(null)}
                className="text-xs text-slate-500 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white px-2.5 py-1 rounded-lg hover:bg-slate-200/70 dark:hover:bg-white/[0.06] transition-colors cursor-pointer shrink-0"
              >
                New chat
              </button>
            </div>

            {activeConversation.messages.map(msg => {
              const isUser = msg.sender === "user";
              return (
                <div key={msg.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  {isUser ? (
                    <div className="max-w-[82%] bg-white dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.08] rounded-2xl rounded-tr-sm px-4 py-3 text-[15px] text-slate-900 dark:text-white leading-relaxed shadow-xs dark:shadow-none">
                      {msg.imageAttachment && (
                        <img
                          src={msg.imageAttachment}
                          alt="User attachment"
                          className="max-h-48 rounded-xl mb-2 object-cover border border-slate-200 dark:border-white/[0.08]"
                        />
                      )}
                      {msg.fileAttachment && (
                        <div className="flex items-center gap-2 text-xs text-[#0072FF] dark:text-[#00E5FF] bg-slate-100 dark:bg-white/[0.05] px-2.5 py-1.5 rounded-lg mb-2">
                          <FileText className="w-3.5 h-3.5" />
                          <span>{msg.fileAttachment.name}</span>
                        </div>
                      )}
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  ) : (
                    <div className="w-full flex items-start gap-3.5 text-left">
                      <div className="w-7 h-7 rounded-full bg-white dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.12] flex items-center justify-center shrink-0 mt-0.5 shadow-xs dark:shadow-none">
                        <DiptiKLogo size="xs" showText={false} />
                      </div>

                      <div className="flex-1 min-w-0 space-y-2.5">
                        {msg.isStreaming && !msg.text && (
                          <div className="text-xs text-slate-500 dark:text-[#94a3b8]">
                            {msg.statusText || "Thinking..."}
                          </div>
                        )}

                        <div className="text-[15px] text-slate-700 dark:text-[#e2e8f0] leading-relaxed">
                          {renderFormattedText(msg.text)}
                        </div>

                        {msg.actionCard && (
                          <div className="mt-3 p-4 rounded-2xl bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.1] space-y-3 shadow-xs dark:shadow-none">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 text-xs font-medium text-slate-800 dark:text-[#cbd5e1]">
                                <ShieldAlert className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                                <span>
                                  {msg.actionCard.action.app} · Level {msg.actionCard.confirmationLevel} Safeguard
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-[#94a3b8]">{msg.actionCard.action.details}</p>
                            {!msg.actionCard.executed && (
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveCommandConfirmation({
                                    action: msg.actionCard!.action,
                                    level: msg.actionCard!.confirmationLevel,
                                    onConfirm: () => {
                                      addNotification({
                                        title: "Action Executed",
                                        message: msg.actionCard!.action.details,
                                        category: "system"
                                      });
                                    },
                                    onCancel: () => {}
                                  })
                                }
                                className="px-3.5 py-1.5 rounded-xl btn-diptik-primary text-xs font-medium cursor-pointer"
                              >
                                Review & Confirm Action
                              </button>
                            )}
                          </div>
                        )}

                        {msg.sources && msg.sources.length > 0 && (
                          <div className="pt-2 flex flex-wrap gap-2">
                            {msg.sources.map((src, sIdx) => (
                              <a
                                key={sIdx}
                                href={src.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.08] hover:border-[#0072FF]/50 dark:hover:border-[#00E5FF]/50 text-xs text-[#0072FF] dark:text-[#00E5FF] transition-colors"
                              >
                                <span className="truncate max-w-[200px]">{src.title}</span>
                                <ExternalLink className="w-3 h-3 shrink-0" />
                              </a>
                            ))}
                          </div>
                        )}

                        {!msg.isStreaming && msg.text && (
                          <div className="flex flex-wrap items-center gap-1 pt-1">
                            <button
                              type="button"
                              onClick={() => handleCopy(msg.id, msg.text)}
                              className="p-1.5 rounded-lg text-slate-400 dark:text-[#64748b] hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/[0.06] transition-colors cursor-pointer flex items-center gap-1 text-xs"
                              title="Copy response"
                            >
                              {copiedId === msg.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReadAloud(msg.text)}
                              className="p-1.5 rounded-lg text-slate-400 dark:text-[#64748b] hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                              title="Read aloud"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveResponseToNotebook(msg.text)}
                              className="p-1.5 rounded-lg text-slate-400 dark:text-[#64748b] hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                              title="Save to Notebooks"
                            >
                              <Bookmark className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Pinned Bottom Composer */}
        <div className="px-4 sm:px-8 pb-5 pt-2 shrink-0 bg-gradient-to-t from-slate-50 via-slate-50/95 dark:from-[#0b0d14] dark:via-[#0b0d14]/95 to-transparent">
          <div className="max-w-3xl mx-auto">
            <PromptComposer
              onSend={(text, att, web) => handleSendPrompt(text, att, web)}
              isGenerating={isGenerating}
              onStop={handleStop}
              placeholder="Ask a follow-up"
            />
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // VIEW 3: SINGLE NOTEBOOK WORKSPACE
  // ------------------------------------------------------------------
  if (activeWorkspaceView === "notebook" && activeNotebook) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto gemini-scroll px-4 sm:px-8 pb-12">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-white/[0.08] pb-4">
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={activeNotebook.title}
                onChange={e => updateNotebook(activeNotebook.id, { title: e.target.value })}
                className="w-full bg-transparent font-display text-2xl font-semibold text-slate-900 dark:text-white focus:outline-none border-b border-transparent focus:border-[#0072FF]"
              />
              <p className="text-xs text-slate-500 dark:text-[#94a3b8] mt-1">
                Updated {activeNotebook.updatedAt} · {activeNotebook.tags.join(" · ")}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() =>
                  handleSendPrompt(
                    `Summarize and expand key action items for my notebook "${activeNotebook.title}":\n\n${activeNotebook.content}`,
                    undefined,
                    true,
                    "Research"
                  )
                }
                className="px-3.5 py-2 rounded-xl bg-[#0072FF] hover:bg-[#005ce6] text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ask DiptiK AI 3 about this notebook</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteNotebook(activeNotebook.id);
                  setActiveWorkspaceView("all-notebooks");
                }}
                aria-label="Delete notebook"
                className="p-2 rounded-xl bg-white dark:bg-[#181c2b] hover:bg-red-50 dark:hover:bg-red-500/15 text-slate-500 dark:text-[#94a3b8] hover:text-red-600 dark:hover:text-red-400 border border-slate-200 dark:border-white/[0.08] transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-[#94a3b8] mb-2">Description</label>
            <input
              type="text"
              value={activeNotebook.description}
              onChange={e => updateNotebook(activeNotebook.id, { description: e.target.value })}
              className="w-full bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.08] focus:border-[#0072FF] rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-[#e2e8f0] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-[#94a3b8] mb-2">Notebook Content (Markdown)</label>
            <textarea
              rows={14}
              value={activeNotebook.content}
              onChange={e => updateNotebook(activeNotebook.id, { content: e.target.value })}
              className="w-full bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.08] focus:border-[#0072FF] rounded-2xl p-4 text-sm font-mono text-slate-800 dark:text-[#e2e8f0] leading-relaxed focus:outline-none gemini-scroll"
            />
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // VIEW 4: ALL NOTEBOOKS
  // ------------------------------------------------------------------
  if (activeWorkspaceView === "all-notebooks") {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto gemini-scroll px-4 sm:px-8 pb-12">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 dark:border-white/[0.08] pb-4">
            <div>
              <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">All Notebooks</h1>
              <p className="text-sm text-slate-500 dark:text-[#94a3b8] mt-1">
                Organize research notes, project specs, and AI-synthesized briefs.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenNewNotebook}
              className="px-4 py-2 rounded-xl bg-[#0072FF] hover:bg-[#005ce6] text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>New notebook</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notebooks.map(nb => (
              <div
                key={nb.id}
                onClick={() => {
                  setActiveNotebookId(nb.id);
                  setActiveWorkspaceView("notebook");
                }}
                className="p-5 rounded-2xl bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.08] hover:border-[#0072FF]/50 transition-colors cursor-pointer flex flex-col justify-between space-y-4 text-left shadow-xs dark:shadow-none"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <NotebookPen className="w-4 h-4 text-[#0072FF] dark:text-[#00E5FF]" strokeWidth={1.75} />
                    <span className="text-xs text-slate-400 dark:text-[#64748b] tabular-nums">{nb.updatedAt}</span>
                  </div>
                  <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white line-clamp-1">{nb.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-[#94a3b8] line-clamp-3 leading-relaxed">{nb.description}</p>
                </div>
                <div className="text-xs text-slate-400 dark:text-[#64748b] pt-2 border-t border-slate-200 dark:border-white/[0.06]">
                  {nb.tags.join(" · ")}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // VIEW 5: LIBRARY (Dictionary, Books & Slides, Notes, Papers, Bookmarks + PDF Reader)
  // ------------------------------------------------------------------
  if (activeWorkspaceView === "library") {
    return (
      <LibraryView
        onAskAI={prompt => handleSendPrompt(prompt, undefined, !isOfflineMode, "Research")}
      />
    );
  }

  // ------------------------------------------------------------------
  // VIEW 6: STUDY TABLE (Academic & IELTS)
  // ------------------------------------------------------------------
  if (activeWorkspaceView === "study-table") {
    return <StudyTableView />;
  }

  // ------------------------------------------------------------------
  // VIEW 7: SCHEDULED (Automations & Priority Tasks)
  // ------------------------------------------------------------------
  if (activeWorkspaceView === "scheduled") {
    const handleAddRule = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newAutoName.trim()) return;
      addAutomation({
        id: `auto_${Date.now()}`,
        name: newAutoName.trim(),
        trigger: newAutoTrigger.trim() || "Daily at 9:00 AM",
        triggerDetails: newAutoTrigger.trim(),
        conditions: ["Device ready"],
        actions: [newAutoAction.trim() || "Run assistant summary"],
        lastRun: "Never",
        nextRun: newAutoTrigger.trim(),
        status: "active",
        confirmationSetting: "Run automatically",
        logs: []
      });
      setNewAutoName("");
    };

    const handleTestRule = async (rule: any) => {
      setRunningAutoId(rule.id);
      const res = await runAutomationTest(rule.name, rule.trigger, rule.actions?.[0] || "Execute rule");
      setTimeout(() => {
        setRunningAutoId(null);
        addNotification({
          title: `Executed: ${rule.name}`,
          message: res.result,
          category: "automation"
        });
      }, 700);
    };

    return (
      <div className="flex-1 min-h-0 overflow-y-auto gemini-scroll px-4 sm:px-8 pb-12">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-white/[0.08] pb-4">
            <div>
              <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">Scheduled</h1>
              <p className="text-sm text-slate-500 dark:text-[#94a3b8] mt-1">
                Automated workflows, recurring briefings, and scheduled daily tasks.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsPhoneActionsModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#181c2b] hover:bg-slate-100 dark:hover:bg-[#1f2437] border border-slate-200 dark:border-white/[0.08] text-xs font-medium text-slate-800 dark:text-white cursor-pointer"
            >
              Device Actions & Safeguards
            </button>
          </div>

          <form
            onSubmit={handleAddRule}
            className="p-4 rounded-2xl bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.08] grid grid-cols-1 sm:grid-cols-4 gap-3 shadow-xs dark:shadow-none"
          >
            <input
              type="text"
              value={newAutoName}
              onChange={e => setNewAutoName(e.target.value)}
              placeholder="Automation name..."
              className="bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#0072FF]"
            />
            <input
              type="text"
              value={newAutoTrigger}
              onChange={e => setNewAutoTrigger(e.target.value)}
              placeholder="Schedule trigger..."
              className="bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#0072FF]"
            />
            <input
              type="text"
              value={newAutoAction}
              onChange={e => setNewAutoAction(e.target.value)}
              placeholder="Action..."
              className="bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#0072FF]"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#0072FF] hover:bg-[#005ce6] text-white text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule</span>
            </button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {automations.map(rule => (
              <div
                key={rule.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.08] space-y-3 text-left shadow-xs dark:shadow-none"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{rule.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-[#94a3b8] mt-0.5">
                      {rule.trigger} · {rule.status === "active" ? "Active" : "Paused"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleTestRule(rule)}
                      title="Run now"
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#181c2b] hover:bg-[#0072FF] text-slate-600 dark:text-[#cbd5e1] hover:text-white transition-colors cursor-pointer"
                    >
                      {runningAutoId === rule.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleAutomationStatus(rule.id)}
                      title={rule.status === "active" ? "Pause" : "Resume"}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#181c2b] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-600 dark:text-[#cbd5e1] cursor-pointer"
                    >
                      {rule.status === "active" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteAutomation(rule.id)}
                      title="Delete"
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/15 text-slate-400 dark:text-[#64748b] hover:text-red-500 dark:hover:text-red-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-[#cbd5e1]">{rule.actions[0]}</p>
                <p className="text-[11px] text-slate-400 dark:text-[#64748b] tabular-nums">Next run: {rule.nextRun}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2.5 pt-2">
            <h2 className="font-display text-sm font-medium text-slate-500 dark:text-[#94a3b8]">Scheduled Tasks ({tasks.length})</h2>
            {tasks.map(t => (
              <div
                key={t.id}
                className="p-3.5 rounded-xl bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.08] flex items-center justify-between gap-3"
              >
                <button
                  type="button"
                  onClick={() => toggleTaskCompletion(t.id)}
                  className="flex items-center gap-3 text-left flex-1 min-w-0 cursor-pointer"
                >
                  <CheckCircle2
                    className={`w-4 h-4 shrink-0 ${
                      t.status === "Completed" ? "text-emerald-500 dark:text-emerald-400" : "text-slate-400 dark:text-[#64748b]"
                    }`}
                  />
                  <span
                    className={`text-sm truncate ${
                      t.status === "Completed" ? "line-through text-slate-400 dark:text-[#64748b]" : "text-slate-900 dark:text-white"
                    }`}
                  >
                    {t.title}
                  </span>
                </button>
                <span className="text-xs text-slate-500 dark:text-[#94a3b8] tabular-nums shrink-0">
                  {t.dueDate} · {t.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // VIEW 8: CUSTOMIZE (Custom Agents, Engine & Instructions)
  // ------------------------------------------------------------------
  if (activeWorkspaceView === "customize") {
    const handleCreateAgent = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newAgentName.trim()) return;
      await addAgentTemplate({
        id: `agent_${Date.now()}`,
        name: newAgentName.trim(),
        icon: "Sparkles",
        description: newAgentGoal.trim() || "Custom specialized assistant",
        goal: newAgentGoal.trim() || "Assist with tailored workflows",
        tools: ["Web search", "DiptiK Notes"],
        memory: "Long-term memory",
        category: "Productivity",
        instructions: newAgentInstructions.trim() || "Be concise, structured, and direct.",
        voiceName: userProfile.voiceName || "Zephyr",
        isCustom: true
      });
      setNewAgentName("");
      setNewAgentGoal("");
      setNewAgentInstructions("");
      setShowNewAgent(false);
    };

    return (
      <div className="flex-1 min-h-0 overflow-y-auto gemini-scroll px-4 sm:px-8 pb-12">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-white/[0.08] pb-4">
            <div>
              <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">Customize</h1>
              <p className="text-sm text-slate-500 dark:text-[#94a3b8] mt-1">
                Configure custom instructions, AI engine defaults, and specialized agents.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowNewAgent(prev => !prev)}
              className="px-4 py-2 rounded-xl bg-[#0072FF] hover:bg-[#005ce6] text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Agent</span>
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.08] space-y-4 text-left shadow-xs dark:shadow-none">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-[#94a3b8] mb-1.5">Default AI Engine</label>
                <select
                  value={userProfile.defaultEngine || "Gemini 4 Hydrogen (Default)"}
                  onChange={e => updateUserProfile({ defaultEngine: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#0072FF]"
                >
                  <option value="Gemini 4 Hydrogen (Default)">Gemini 4 Hydrogen (Default)</option>
                  <option value="ChatGPT (OpenAI Style)">ChatGPT Style</option>
                  <option value="Claude (Anthropic Style)">Claude Style</option>
                  <option value="DiptiK Lite 350M (Offline)">On-Device Lite 350M (Offline)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-[#94a3b8] mb-1.5">Live Voice Persona</label>
                <select
                  value={userProfile.voiceName || "Zephyr"}
                  onChange={e => updateUserProfile({ voiceName: e.target.value as VoicePersonaName })}
                  className="w-full bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#0072FF]"
                >
                  {(["Zephyr", "Puck", "Charon", "Kore", "Fenrir"] as const).map(v => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-[#94a3b8] mb-1.5">Custom Instructions</label>
              <textarea
                rows={3}
                value={userProfile.customInstructions || ""}
                onChange={e => updateUserProfile({ customInstructions: e.target.value })}
                placeholder="Tell DiptiK AI 3 how you prefer responses structured..."
                className="w-full bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.08] focus:border-[#0072FF] rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          {showNewAgent && (
            <form
              onSubmit={handleCreateAgent}
              className="p-5 rounded-2xl bg-white dark:bg-[#121520] border border-[#0072FF]/40 space-y-3 text-left shadow-xs dark:shadow-none"
            >
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">New Custom Agent</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newAgentName}
                  onChange={e => setNewAgentName(e.target.value)}
                  required
                  placeholder="Agent name (e.g. Agri Advisor)"
                  className="bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
                <input
                  type="text"
                  value={newAgentGoal}
                  onChange={e => setNewAgentGoal(e.target.value)}
                  placeholder="Primary goal..."
                  className="bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
              <textarea
                rows={2}
                value={newAgentInstructions}
                onChange={e => setNewAgentInstructions(e.target.value)}
                placeholder="System instructions..."
                className="w-full bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.08] rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewAgent(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-500 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#0072FF] text-white text-xs font-medium cursor-pointer"
                >
                  Save Agent
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agentTemplates.map(agent => (
              <div
                key={agent.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.08] space-y-3 text-left flex flex-col justify-between shadow-xs dark:shadow-none"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <Bot className="w-4 h-4 text-[#0072FF] dark:text-[#00E5FF]" />
                      <span>{agent.name}</span>
                    </span>
                    {agent.isCustom && (
                      <button
                        type="button"
                        onClick={() => deleteAgentTemplate(agent.id)}
                        className="p-1 text-slate-400 dark:text-[#64748b] hover:text-red-500 dark:hover:text-red-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-[#94a3b8] leading-relaxed">{agent.description}</p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveChatAgent(agent);
                      setActiveConversationId(null);
                      setActiveWorkspaceView("chat");
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#181c2b] hover:bg-slate-200 dark:hover:bg-[#1f2437] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-800 dark:text-white cursor-pointer"
                  >
                    Chat with Agent
                  </button>
                  <button
                    type="button"
                    onClick={() => openVoiceWithAgent(agent)}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-[#0072FF]/20 hover:bg-blue-100 dark:hover:bg-[#0072FF]/35 text-xs text-[#0072FF] dark:text-[#00E5FF] flex items-center gap-1 cursor-pointer"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Talk Live</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // VIEW 9: CODERS (Tools Directory & CP Learning Hub)
  // ------------------------------------------------------------------
  return <CodersView />;
};
