/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { GeminiSidebar } from "./components/gemini/GeminiSidebar";
import { TopRightBar } from "./components/gemini/TopRightBar";
import { WorkspaceMain } from "./components/gemini/WorkspaceMain";
import { WorkspaceModals } from "./components/gemini/WorkspaceModals";

// Global Feature & Safeguard Modals
import { OnboardingModal } from "./components/modals/OnboardingModal";
import { AssistantSetupModal } from "./components/modals/AssistantSetupModal";
import { VoiceAssistantModal } from "./components/modals/VoiceAssistantModal";
import { CommandExecutionModal } from "./components/modals/CommandExecutionModal";
import { ErrorTesterModal } from "./components/modals/ErrorTesterModal";
import { ResearchModal } from "./components/features/ResearchModal";
import { VisionModal } from "./components/features/VisionModal";
import { NotesTasksModal } from "./components/features/NotesTasksModal";
import { PhoneActionsModal } from "./components/features/PhoneActionsModal";

import { Bell, X } from "lucide-react";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { OfflineIndicator } from "./components/common/OfflineIndicator";
import { applyAppearanceToDocument, loadAppearanceConfig } from "./lib/appearance";

const MainContent: React.FC = () => {
  const { notifications, userProfile } = useApp();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [showNewNotebookModal, setShowNewNotebookModal] = useState(false);
  const [dismissedNotifId, setDismissedNotifId] = useState<string | null>(null);

  const initialLatestIdRef = useRef<string | null>(notifications[0]?.id ?? null);
  const latestNotif = notifications[0];
  const hasNewToast =
    Boolean(latestNotif) &&
    latestNotif.id !== initialLatestIdRef.current &&
    latestNotif.id !== dismissedNotifId;

  useEffect(() => {
    const mode =
      userProfile.theme === "light" || userProfile.theme === "dark" || userProfile.theme === "system"
        ? userProfile.theme
        : "system";
    const syncTheme = () => applyAppearanceToDocument(loadAppearanceConfig(), mode);
    syncTheme();

    if (mode === "system" && typeof window !== "undefined" && window.matchMedia) {
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      mql.addEventListener("change", syncTheme);
      return () => mql.removeEventListener("change", syncTheme);
    }
  }, [userProfile.theme]);

  useEffect(() => {
    if (!hasNewToast || !latestNotif) return;
    const timer = setTimeout(() => {
      setDismissedNotifId(latestNotif.id);
    }, 4500);
    return () => clearTimeout(timer);
  }, [hasNewToast, latestNotif]);

  return (
    <div className="min-h-screen h-screen bg-slate-50 dark:bg-[#0b0d14] text-slate-900 dark:text-[#f8fafc] flex overflow-hidden font-sans transition-colors duration-150">
      {/* Fixed Collapsible Left Sidebar & Mobile Slide-Over */}
      <GeminiSidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(prev => !prev)}
        isMobileOpen={isMobileDrawerOpen}
        onCloseMobile={() => setIsMobileDrawerOpen(false)}
        onOpenNewNotebook={() => setShowNewNotebookModal(true)}
      />

      {/* Fluid Main Workspace */}
      <div className="flex-1 min-w-0 h-screen flex flex-col bg-slate-50 dark:bg-[#0b0d14] relative overflow-hidden transition-colors duration-150">
        <TopRightBar
          isSidebarOpen={isSidebarOpen}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onOpenMobileSidebar={() => setIsMobileDrawerOpen(true)}
        />

        <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <WorkspaceMain onOpenNewNotebook={() => setShowNewNotebookModal(true)} />
        </main>
      </div>

      {/* User-Triggered Action Toast Notification */}
      {hasNewToast && latestNotif && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-[70] max-w-sm bg-white dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.1] rounded-2xl p-3.5 shadow-2xl flex items-start gap-3 text-left"
        >
          <div className="p-2 rounded-xl bg-gradient-to-br from-[#FF1E8A]/15 to-[#0072FF]/20 text-[#0072FF] dark:text-[#00E5FF] shrink-0">
            <Bell className="w-4 h-4" />
          </div>
          <div className="flex-1 pr-2 min-w-0">
            <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate">{latestNotif.title}</h4>
            <p className="text-[11px] text-slate-600 dark:text-[#94a3b8] mt-0.5 leading-relaxed line-clamp-2">
              {latestNotif.message}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDismissedNotifId(latestNotif.id)}
            aria-label="Dismiss notification"
            className="text-slate-400 dark:text-[#64748b] hover:text-slate-900 dark:hover:text-white cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Workspace & Feature Modals */}
      <WorkspaceModals
        showNewNotebook={showNewNotebookModal}
        onCloseNewNotebook={() => setShowNewNotebookModal(false)}
      />
      <OnboardingModal />
      <AssistantSetupModal />
      <VoiceAssistantModal />
      <CommandExecutionModal />
      <ErrorTesterModal />
      <ResearchModal />
      <VisionModal />
      <NotesTasksModal />
      <PhoneActionsModal />
      <OfflineIndicator />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <MainContent />
      </AppProvider>
    </ErrorBoundary>
  );
}
