import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  Search,
  PanelLeftClose,
  Plus,
  BookOpen,
  Image as ImageIcon,
  CalendarClock,
  SlidersHorizontal,
  Video,
  ChevronDown,
  ChevronRight,
  NotebookPen,
  Settings,
  Pin,
  Trash2,
  X,
  FolderOpen
} from "lucide-react";
import { WorkspaceView } from "../../types";
import { DiptiKLogo } from "../common/DiptiKLogo";

interface GeminiSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenNewNotebook: () => void;
}

export const GeminiSparkleIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="gemini-sparkle-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#93c5fd" />
        <stop offset="55%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
    </defs>
    <path
      d="M12 2C12.3 7.1 16.9 11.7 22 12C16.9 12.3 12.3 16.9 12 22C11.7 16.9 7.1 12.3 2 12C7.1 11.7 11.7 7.1 12 2Z"
      fill="url(#gemini-sparkle-grad)"
    />
  </svg>
);

function getInitials(name: string): string {
  const parts = (name || "U").trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (name || "U").slice(0, 2).toUpperCase();
}

export const GeminiSidebar: React.FC<GeminiSidebarProps> = ({
  isOpen,
  onToggle,
  isMobileOpen,
  onCloseMobile,
  onOpenNewNotebook
}) => {
  const {
    activeWorkspaceView,
    setActiveWorkspaceView,
    conversations,
    activeConversationId,
    setActiveConversationId,
    togglePinConversation,
    deleteConversation,
    notebooks,
    activeNotebookId,
    setActiveNotebookId,
    userProfile,
    firebaseUser,
    setIsSettingsModalOpen,
    setShowAuth
  } = useApp();

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notebooksOpen, setNotebooksOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [historyFilter, setHistoryFilter] = useState<"all" | "pinned" | "offline">("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const navItems: { id: WorkspaceView; label: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }> }[] = [
    { id: "library", label: "Library", icon: BookOpen },
    { id: "images", label: "Images", icon: ImageIcon },
    { id: "scheduled", label: "Scheduled", icon: CalendarClock },
    { id: "customize", label: "Customize", icon: SlidersHorizontal },
    { id: "videos", label: "Videos", icon: Video }
  ];

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredNotebooks = notebooks
    .filter(nb => !normalizedQuery || nb.title.toLowerCase().includes(normalizedQuery))
    .slice(0, 3);

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch =
      !normalizedQuery ||
      conv.title.toLowerCase().includes(normalizedQuery) ||
      conv.lastMessage.toLowerCase().includes(normalizedQuery);
    if (!matchesSearch) return false;
    if (historyFilter === "pinned") return Boolean(conv.isPinned);
    if (historyFilter === "offline") return conv.mode === "Offline";
    return true;
  });

  const handleNewChat = () => {
    setActiveConversationId(null);
    setActiveNotebookId(null);
    setActiveWorkspaceView("chat");
    onCloseMobile();
  };

  const handleSelectNav = (view: WorkspaceView) => {
    setActiveWorkspaceView(view);
    onCloseMobile();
  };

  const handleSelectNotebook = (id: string) => {
    setActiveNotebookId(id);
    setActiveWorkspaceView("notebook");
    onCloseMobile();
  };

  const handleSelectChat = (id: string) => {
    setActiveConversationId(id);
    setActiveWorkspaceView("chat");
    onCloseMobile();
  };

  const avatarSrc = firebaseUser?.photoURL || userProfile.avatar || "";
  const displayName = firebaseUser?.displayName || userProfile.name || "User";

  const sidebarBody = (
    <aside className="w-[272px] h-full bg-white dark:bg-[#121520] border-r border-slate-200 dark:border-white/[0.08] flex flex-col text-slate-700 dark:text-[#e2e8f0] select-none transition-colors duration-150">
      {/* 1. Top Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between shrink-0">
        <button
          type="button"
          onClick={handleNewChat}
          className="flex items-center gap-2 text-left group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0072FF] rounded-lg px-1 py-0.5"
        >
          <DiptiKLogo size="xs" showText={false} />
          <span className="font-display text-[16px] font-semibold tracking-tight text-slate-900 dark:text-white whitespace-nowrap flex items-center gap-1.5">
            <span>DiptiK AI</span>
            <span className="text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded-md bg-gradient-to-r from-[#FF1E8A]/15 to-[#0072FF]/20 text-[#0072FF] dark:text-[#00E5FF] border border-[#0072FF]/35 leading-none">
              3
            </span>
          </span>
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowSearch(prev => !prev)}
            title="Search chats and notebooks"
            aria-label="Search chats and notebooks"
            className={`p-2 rounded-lg transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0072FF] ${
              showSearch
                ? "bg-slate-100 dark:bg-white/[0.1] text-[#0072FF] dark:text-[#00E5FF]"
                : "text-slate-500 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06]"
            }`}
          >
            <Search className="w-4 h-4" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={() => {
              if (isMobileOpen) onCloseMobile();
              else onToggle();
            }}
            title="Toggle sidebar"
            aria-label="Toggle sidebar"
            className="p-2 rounded-lg text-slate-500 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0072FF]"
          >
            <PanelLeftClose className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* Inline Search Input */}
      {showSearch && (
        <div className="px-3 pb-2.5 shrink-0">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-[#64748b] absolute left-3 pointer-events-none" strokeWidth={1.75} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter chats & notebooks..."
              autoFocus
              className="w-full bg-slate-100 dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.08] focus:border-[#0072FF] rounded-xl pl-8 pr-7 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748b] focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-2 text-slate-400 dark:text-[#64748b] hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. Main Nav */}
      <div className="px-3 pb-3 space-y-1 shrink-0 border-b border-slate-200 dark:border-white/[0.06]">
        <button
          type="button"
          onClick={handleNewChat}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors duration-150 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0072FF] ${
            activeWorkspaceView === "chat" && !activeConversationId
              ? "bg-gradient-to-r from-[#FF1E8A]/12 via-[#8A2BE2]/12 to-[#0072FF]/15 text-slate-900 dark:text-white border border-[#0072FF]/40"
              : "bg-slate-100 dark:bg-[#181c2b] hover:bg-slate-200/70 dark:hover:bg-[#1f2437] text-slate-900 dark:text-white border border-slate-200 dark:border-white/[0.08]"
          }`}
        >
          <Plus className="w-4 h-4 text-[#0072FF] dark:text-[#00E5FF] shrink-0" strokeWidth={2} />
          <span>New chat</span>
        </button>

        <nav className="pt-1.5 space-y-0.5" aria-label="Primary workspace navigation">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeWorkspaceView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectNav(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors duration-150 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0072FF] ${
                  isActive
                    ? "bg-slate-100 dark:bg-white/[0.08] text-slate-900 dark:text-white font-medium"
                    : "text-slate-600 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-white/[0.05]"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#0072FF] dark:text-[#00E5FF]" : "text-slate-500 dark:text-[#94a3b8]"}`} strokeWidth={1.75} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* 3. Notebooks Section (Collapsible) */}
      <div className="px-3 py-2.5 border-b border-slate-200 dark:border-white/[0.06] shrink-0">
        <button
          type="button"
          onClick={() => setNotebooksOpen(prev => !prev)}
          className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-medium text-slate-500 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <span>Notebooks</span>
          {notebooksOpen ? (
            <ChevronDown className="w-3.5 h-3.5" strokeWidth={1.75} />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.75} />
          )}
        </button>

        {notebooksOpen && (
          <div className="mt-1 space-y-0.5">
            <button
              type="button"
              onClick={() => {
                onOpenNewNotebook();
                onCloseMobile();
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] text-slate-700 dark:text-[#cbd5e1] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-white/[0.05] transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 text-[#FF1E8A] shrink-0" strokeWidth={2} />
              <span>New notebook</span>
            </button>

            {filteredNotebooks.map(nb => {
              const isSelected = activeWorkspaceView === "notebook" && activeNotebookId === nb.id;
              return (
                <button
                  key={nb.id}
                  type="button"
                  onClick={() => handleSelectNotebook(nb.id)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] text-left transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-slate-100 dark:bg-white/[0.08] text-slate-900 dark:text-white font-medium"
                      : "text-slate-600 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-white/[0.05]"
                  }`}
                >
                  <NotebookPen className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-[#0072FF] dark:text-[#00E5FF]" : "text-slate-400 dark:text-[#64748b]"}`} strokeWidth={1.75} />
                  <span className="truncate">{nb.title}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => handleSelectNav("all-notebooks")}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[12px] transition-colors cursor-pointer whitespace-nowrap ${
                activeWorkspaceView === "all-notebooks"
                  ? "bg-slate-100 dark:bg-white/[0.08] text-slate-900 dark:text-white font-medium"
                  : "text-slate-500 dark:text-[#64748b] hover:text-slate-800 dark:hover:text-[#cbd5e1] hover:bg-slate-100/70 dark:hover:bg-white/[0.04]"
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
              <span>All notebooks</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. Chat History Section (Independently Scrollable) */}
      <div className="flex-1 min-h-0 flex flex-col px-3 pt-2.5 pb-2 relative">
        <div className="flex items-center justify-between px-2 py-1 shrink-0">
          <button
            type="button"
            onClick={() => setHistoryOpen(prev => !prev)}
            className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <span>{historyFilter === "all" ? "All" : historyFilter === "pinned" ? "Pinned" : "Offline"}</span>
            {historyOpen ? (
              <ChevronDown className="w-3 h-3" strokeWidth={1.75} />
            ) : (
              <ChevronRight className="w-3 h-3" strokeWidth={1.75} />
            )}
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFilterMenu(prev => !prev)}
              title="Filter chat history"
              aria-label="Filter chat history"
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                historyFilter !== "all" || showFilterMenu
                  ? "text-[#0072FF] dark:text-[#00E5FF] bg-slate-100 dark:bg-white/[0.08]"
                  : "text-slate-400 dark:text-[#64748b] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06]"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>

            {showFilterMenu && (
              <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.1] rounded-xl shadow-xl py-1 z-30">
                {(["all", "pinned", "offline"] as const).map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => {
                      setHistoryFilter(f);
                      setShowFilterMenu(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left text-xs capitalize transition-colors cursor-pointer ${
                      historyFilter === f
                        ? "text-[#0072FF] dark:text-[#00E5FF] bg-slate-100 dark:bg-white/[0.06] font-medium"
                        : "text-slate-700 dark:text-[#cbd5e1] hover:bg-slate-50 dark:hover:bg-white/[0.05]"
                    }`}
                  >
                    {f === "all" ? "All chats" : f === "pinned" ? "Pinned" : "Offline"}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {historyOpen && (
          <div className="flex-1 min-h-0 overflow-y-auto gemini-scroll mt-1 space-y-0.5 pr-1">
            {filteredConversations.length === 0 ? (
              <p className="px-2.5 py-3 text-xs text-slate-400 dark:text-[#64748b]">No matching chats</p>
            ) : (
              filteredConversations.map(conv => {
                const isSelected = activeWorkspaceView === "chat" && activeConversationId === conv.id;
                return (
                  <div
                    key={conv.id}
                    className={`group flex items-center justify-between rounded-lg transition-colors duration-150 ${
                      isSelected
                        ? "bg-slate-100 dark:bg-white/[0.09] text-slate-900 dark:text-white"
                        : "text-slate-600 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-white/[0.05]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectChat(conv.id)}
                      className="flex-1 min-w-0 text-left px-2.5 py-2 text-[13px] truncate cursor-pointer focus-visible:outline-none"
                    >
                      {conv.title}
                    </button>
                    <div className="flex items-center gap-0.5 pr-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          togglePinConversation(conv.id);
                        }}
                        title={conv.isPinned ? "Unpin" : "Pin"}
                        aria-label={conv.isPinned ? "Unpin chat" : "Pin chat"}
                        className={`p-1 rounded hover:bg-slate-200/80 dark:hover:bg-white/[0.1] cursor-pointer ${
                          conv.isPinned ? "text-[#0072FF] dark:text-[#00E5FF]" : "text-slate-400 dark:text-[#64748b] hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        <Pin className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          deleteConversation(conv.id);
                        }}
                        title="Delete chat"
                        aria-label="Delete chat"
                        className="p-1 rounded text-slate-400 dark:text-[#64748b] hover:text-[#FF1744] hover:bg-slate-200/80 dark:hover:bg-white/[0.1] cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* 5. Footer Profile */}
      <div className="px-3 py-3 border-t border-slate-200 dark:border-white/[0.08] shrink-0 flex items-center justify-between gap-2 bg-white dark:bg-[#121520] transition-colors duration-150">
        <button
          type="button"
          onClick={() => setShowAuth(true)}
          title="Manage profile or sign in"
          className="flex items-center gap-2.5 min-w-0 flex-1 text-left rounded-xl p-1.5 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0072FF]"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF1E8A] via-[#8A2BE2] to-[#0072FF] border border-slate-200 dark:border-white/[0.2] text-white text-xs font-semibold flex items-center justify-center shrink-0 overflow-hidden">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={displayName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{getInitials(displayName)}</span>
            )}
          </div>
          <span className="text-[12px] font-medium tracking-wide text-slate-700 dark:text-[#e2e8f0] truncate">
            {displayName}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setIsSettingsModalOpen(true)}
          title="Settings"
          aria-label="Open settings"
          className="p-2 rounded-lg text-slate-500 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0072FF]"
        >
          <Settings className="w-4 h-4" strokeWidth={1.75} />
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Fixed / Collapsible Rail */}
      {isOpen && (
        <div className="hidden lg:block h-screen sticky top-0 shrink-0 z-20">
          {sidebarBody}
        </div>
      )}

      {/* Mobile Slide-Over Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-slate-950/50 dark:bg-black/70 backdrop-blur-xs"
            aria-hidden="true"
          />
          <div className="relative z-10 h-full">{sidebarBody}</div>
        </div>
      )}
    </>
  );
};
