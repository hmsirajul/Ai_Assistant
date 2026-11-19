import React, { useState, useRef } from "react";
import { useApp } from "../../context/AppContext";
import {
  Plus,
  ChevronDown,
  Mic,
  ArrowUp,
  Square,
  Image as ImageIcon,
  FileText,
  Globe,
  WifiOff,
  Scan,
  Smartphone,
  X,
  Check
} from "lucide-react";
import { ComposerTier } from "../../types";

interface PromptComposerProps {
  onSend: (text: string, attachment?: { image?: string; file?: { name: string; size: string; type: string } }, webAccess?: boolean) => Promise<void> | void;
  isGenerating?: boolean;
  onStop?: () => void;
  placeholder?: string;
}

const TIER_OPTIONS: { id: ComposerTier; label: string; desc: string }[] = [
  { id: "Auto", label: "Auto", desc: "Balanced DiptiK AI 3 routing" },
  { id: "Fast", label: "Fast", desc: "Low-latency everyday responses" },
  { id: "Pro", label: "Pro", desc: "Deep reasoning & web synthesis" },
  { id: "Offline", label: "Offline", desc: "On-device Lite 350M local mode" }
];

export const PromptComposer: React.FC<PromptComposerProps> = ({
  onSend,
  isGenerating = false,
  onStop,
  placeholder = "Ask DiptiK AI 3"
}) => {
  const {
    composerTier,
    setComposerTier,
    isOfflineMode,
    openVoiceWithAgent,
    setIsVisionModalOpen,
    setIsPhoneActionsModalOpen
  } = useApp();

  const [text, setText] = useState("");
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showTierMenu, setShowTierMenu] = useState(false);
  const [webAccess, setWebAccess] = useState(true);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: string; type: string } | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = text.trim();
    if ((!trimmed && !attachedImage && !attachedFile) || isGenerating) return;

    const payloadText =
      trimmed ||
      (attachedImage ? "Analyze the attached image." : `Summarize the attached file: ${attachedFile?.name}`);

    const attachment =
      attachedImage || attachedFile
        ? {
            image: attachedImage || undefined,
            file: attachedFile || undefined
          }
        : undefined;

    setText("");
    setAttachedImage(null);
    setAttachedFile(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    await onSend(payloadText, attachment, !isOfflineMode && webAccess);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImage(reader.result as string);
      setShowPlusMenu(false);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeKb = Math.max(1, Math.round(file.size / 1024));
    setAttachedFile({
      name: file.name,
      size: `${sizeKb} KB`,
      type: file.type || "Document"
    });
    setShowPlusMenu(false);
    e.target.value = "";
  };

  const hasContent = Boolean(text.trim() || attachedImage || attachedFile);

  return (
    <form onSubmit={handleSubmit} className="w-full relative">
      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImagePick}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,.md,.csv,.json,.doc,.docx"
        className="hidden"
        onChange={handleFilePick}
      />

      {/* Attachment Preview Row */}
      {(attachedImage || attachedFile) && (
        <div className="mb-2.5 flex flex-wrap items-center gap-2 px-2">
          {attachedImage && (
            <div className="relative inline-flex items-center bg-white dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.1] rounded-xl p-1.5 pr-7 shadow-xs dark:shadow-none">
              <img
                src={attachedImage}
                alt="Attached preview"
                className="w-10 h-10 rounded-lg object-cover"
              />
              <span className="ml-2 text-xs text-slate-700 dark:text-[#cbd5e1]">Image attached</span>
              <button
                type="button"
                onClick={() => setAttachedImage(null)}
                aria-label="Remove attached image"
                className="absolute right-1.5 top-1.5 p-0.5 rounded-full bg-slate-900/60 text-white hover:bg-slate-900 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {attachedFile && (
            <div className="inline-flex items-center gap-2 bg-white dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.1] rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-[#e2e8f0] shadow-xs dark:shadow-none">
              <FileText className="w-3.5 h-3.5 text-[#0072FF] dark:text-[#00E5FF]" />
              <span className="truncate max-w-[180px]">{attachedFile.name}</span>
              <span className="text-slate-400 dark:text-[#64748b] tabular-nums">{attachedFile.size}</span>
              <button
                type="button"
                onClick={() => setAttachedFile(null)}
                aria-label="Remove attached file"
                className="text-slate-400 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Pill Input Bar */}
      <div className="w-full bg-white dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.1] focus-within:border-[#0072FF] dark:focus-within:border-[#0072FF]/80 rounded-[28px] px-3 py-2 shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] transition-colors duration-150 flex items-end gap-2">
        {/* Left "+" Action Menu */}
        <div className="relative shrink-0 pb-0.5">
          <button
            type="button"
            onClick={() => {
              setShowPlusMenu(prev => !prev);
              setShowTierMenu(false);
            }}
            title="Add attachment or tool"
            aria-label="Add attachment or tool"
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0072FF] ${
              showPlusMenu
                ? "bg-slate-100 dark:bg-white/[0.12] text-[#0072FF] dark:text-[#00E5FF]"
                : "text-slate-500 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.07]"
            }`}
          >
            <Plus className="w-5 h-5" strokeWidth={1.75} />
          </button>

          {showPlusMenu && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setShowPlusMenu(false)}
                aria-hidden="true"
              />
              <div className="absolute left-0 bottom-12 w-60 bg-white dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.1] rounded-2xl shadow-2xl p-1.5 z-30 text-left">
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-[#e2e8f0] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4 text-[#FF1E8A]" strokeWidth={1.75} />
                  <span>Upload image</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-[#e2e8f0] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-[#0072FF] dark:text-[#00E5FF]" strokeWidth={1.75} />
                  <span>Attach document</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPlusMenu(false);
                    setIsVisionModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-[#e2e8f0] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <Scan className="w-4 h-4 text-[#0072FF]" strokeWidth={1.75} />
                  <span>Scan with Vision OCR</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPlusMenu(false);
                    setIsPhoneActionsModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-[#e2e8f0] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <Smartphone className="w-4 h-4 text-[#8A2BE2]" strokeWidth={1.75} />
                  <span>Phone actions</span>
                </button>
                <div className="my-1 border-t border-slate-200 dark:border-white/[0.07]" />
                <button
                  type="button"
                  onClick={() => {
                    setWebAccess(prev => !prev);
                    setShowPlusMenu(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-[#e2e8f0] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    {isOfflineMode ? (
                      <WifiOff className="w-4 h-4 text-amber-500 dark:text-amber-400" strokeWidth={1.75} />
                    ) : (
                      <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" strokeWidth={1.75} />
                    )}
                    <span>Web search grounding</span>
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-[#94a3b8]">
                    {isOfflineMode ? "Offline" : webAccess ? "On" : "Off"}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Input Textarea */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={e => {
            setText(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
          }}
          onKeyDown={handleKeyDown}
          placeholder={isOfflineMode ? "Ask DiptiK AI 3 (Offline Lite)" : placeholder}
          className="flex-1 bg-transparent border-0 text-[15px] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748b] focus:outline-none resize-none py-2 px-1 max-h-40 leading-relaxed gemini-scroll"
        />

        {/* Right Controls: "Auto v" + Microphone / Send */}
        <div className="flex items-center gap-1.5 shrink-0 pb-0.5">
          {/* Model / Tier Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowTierMenu(prev => !prev);
                setShowPlusMenu(false);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-slate-600 dark:text-[#cbd5e1] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.07] transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0072FF]"
            >
              <span>{isOfflineMode ? "Offline" : composerTier}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-[#94a3b8]" strokeWidth={1.75} />
            </button>

            {showTierMenu && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setShowTierMenu(false)}
                  aria-hidden="true"
                />
                <div className="absolute right-0 bottom-12 w-60 bg-white dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.1] rounded-2xl shadow-2xl p-1.5 z-30 text-left">
                  {TIER_OPTIONS.map(opt => {
                    const active = (isOfflineMode ? "Offline" : composerTier) === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setComposerTier(opt.id);
                          setShowTierMenu(false);
                        }}
                        className={`w-full flex items-start justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                          active
                            ? "bg-gradient-to-r from-[#FF1E8A]/12 to-[#0072FF]/15 text-slate-900 dark:text-white"
                            : "text-slate-700 dark:text-[#cbd5e1] hover:bg-slate-100 dark:hover:bg-white/[0.06]"
                        }`}
                      >
                        <div>
                          <div className="text-xs font-medium text-slate-900 dark:text-white">{opt.label}</div>
                          <div className="text-[11px] text-slate-500 dark:text-[#94a3b8] mt-0.5">{opt.desc}</div>
                        </div>
                        {active && <Check className="w-3.5 h-3.5 text-[#0072FF] dark:text-[#00E5FF] mt-0.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Microphone / Send / Stop Button */}
          {isGenerating ? (
            <button
              type="button"
              onClick={onStop}
              title="Stop generating"
              aria-label="Stop generating"
              className="w-9 h-9 rounded-full bg-slate-200 dark:bg-white/[0.12] hover:bg-slate-300 dark:hover:bg-white/[0.2] text-slate-900 dark:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          ) : hasContent ? (
            <button
              type="submit"
              title="Send message"
              aria-label="Send message"
              className="w-9 h-9 rounded-full btn-diptik-primary flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5FF]"
            >
              <ArrowUp className="w-4 h-4" strokeWidth={2.25} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => openVoiceWithAgent(null)}
              title="Start voice input"
              aria-label="Start voice input"
              className="w-9 h-9 rounded-full text-slate-500 dark:text-[#cbd5e1] hover:text-[#0072FF] dark:hover:text-[#00E5FF] hover:bg-slate-100 dark:hover:bg-white/[0.08] flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0072FF]"
            >
              <Mic className="w-4 h-4" strokeWidth={1.75} />
            </button>
          )}
        </div>
      </div>
    </form>
  );
};
