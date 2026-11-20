import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  PanelLeftOpen,
  Menu,
  Plus,
  Smartphone,
  Mic,
  UserCheck,
  Settings,
  WifiOff,
  Wifi,
  LogOut,
  Beaker
} from "lucide-react";
import { PWAInstallButton } from "../common/PWAInstallButton";

interface TopRightBarProps {
  isSidebarOpen: boolean;
  onOpenSidebar: () => void;
  onOpenMobileSidebar: () => void;
}

function getInitials(name: string): string {
  const parts = (name || "U").trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (name || "U").slice(0, 2).toUpperCase();
}

export const TopRightBar: React.FC<TopRightBarProps> = ({
  isSidebarOpen,
  onOpenSidebar,
  onOpenMobileSidebar
}) => {
  const {
    userProfile,
    firebaseUser,
    isOfflineMode,
    toggleOfflineMode,
    setIsGetAppModalOpen,
    setIsUpgradeModalOpen,
    setIsSettingsModalOpen,
    setIsErrorTesterModalOpen,
    openVoiceWithAgent,
    setShowAuth,
    logout,
    developerMode
  } = useApp();

  const [menuOpen, setMenuOpen] = useState(false);

  const avatarSrc = firebaseUser?.photoURL || userProfile.avatar || "";
  const displayName = firebaseUser?.displayName || userProfile.name || "User";

  return (
    <header className="w-full px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4 shrink-0 relative z-20">
      {/* Left: Reopen Sidebar when collapsed (Desktop) or Drawer trigger (Mobile) */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="Open navigation menu"
          className="lg:hidden p-2 rounded-lg text-slate-500 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" strokeWidth={1.75} />
        </button>

        {!isSidebarOpen && (
          <button
            type="button"
            onClick={onOpenSidebar}
            title="Expand sidebar"
            aria-label="Expand sidebar"
            className="hidden lg:flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/[0.06] transition-colors cursor-pointer whitespace-nowrap"
          >
            <PanelLeftOpen className="w-4 h-4" strokeWidth={1.75} />
            <span>Sidebar</span>
          </button>
        )}
      </div>

      {/* Right: Floating Action Bar ("Get app", PWA Install, "+ Upgrade", User Menu Avatar) */}
      <div className="flex items-center gap-2.5 shrink-0">
        <PWAInstallButton compact />

        <button
          type="button"
          onClick={() => setIsGetAppModalOpen(true)}
          className="px-3.5 py-2 rounded-full text-[13px] font-medium text-slate-600 dark:text-[#cbd5e1] hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/[0.06] transition-colors duration-150 flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0072FF]"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#0072FF] dark:text-[#00E5FF]" strokeWidth={1.75} />
          <span>Get app</span>
        </button>

        <button
          type="button"
          onClick={() => setIsUpgradeModalOpen(true)}
          className="px-4 py-2 rounded-full btn-diptik-primary text-[13px] font-medium flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5FF]"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2.25} />
          <span>Upgrade</span>
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(prev => !prev)}
            title="Account & assistant menu"
            aria-label="Account and assistant menu"
            className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF1E8A] via-[#8A2BE2] to-[#0072FF] hover:brightness-110 border border-slate-200 dark:border-white/[0.2] text-white text-xs font-semibold flex items-center justify-center overflow-hidden transition-all cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5FF]"
          >
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
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setMenuOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.1] rounded-2xl shadow-2xl p-2 z-30 text-left">
                <div className="px-3 py-2.5 border-b border-slate-200 dark:border-white/[0.08] mb-1">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{displayName}</p>
                  <p className="text-[11px] text-slate-500 dark:text-[#94a3b8] truncate mt-0.5">{userProfile.email}</p>
                  <p className="text-[11px] text-[#0072FF] dark:text-[#00E5FF] mt-1">
                    {userProfile.plan} · {isOfflineMode ? "Offline Lite" : "Online Cloud"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setShowAuth(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-[#e2e8f0] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <UserCheck className="w-4 h-4 text-[#0072FF] dark:text-[#00E5FF]" strokeWidth={1.75} />
                  <span>{firebaseUser ? "Switch Account / Profile" : "Sign In or Switch Profile"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    openVoiceWithAgent(null);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-[#e2e8f0] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <Mic className="w-4 h-4 text-[#FF1E8A]" strokeWidth={1.75} />
                  <span>Live Voice Assistant</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    toggleOfflineMode();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-[#e2e8f0] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    {isOfflineMode ? (
                      <WifiOff className="w-4 h-4 text-amber-500 dark:text-amber-400" strokeWidth={1.75} />
                    ) : (
                      <Wifi className="w-4 h-4 text-emerald-600 dark:text-emerald-400" strokeWidth={1.75} />
                    )}
                    <span>Offline Lite Mode</span>
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-[#94a3b8]">{isOfflineMode ? "On" : "Off"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setIsSettingsModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-[#e2e8f0] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-slate-500 dark:text-[#94a3b8]" strokeWidth={1.75} />
                  <span>Settings & Privacy</span>
                </button>

                {developerMode && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setIsErrorTesterModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-[#e2e8f0] hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                  >
                    <Beaker className="w-4 h-4 text-slate-500 dark:text-[#94a3b8]" strokeWidth={1.75} />
                    <span>Safeguards & Error Lab</span>
                  </button>
                )}

                {firebaseUser && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#FF1744] hover:bg-[#FF1744]/10 transition-colors cursor-pointer mt-1 border-t border-slate-200 dark:border-white/[0.06]"
                  >
                    <LogOut className="w-4 h-4" strokeWidth={1.75} />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
