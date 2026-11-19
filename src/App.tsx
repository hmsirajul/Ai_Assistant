/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { TopBar } from "./components/navigation/TopBar";
import { BottomNav } from "./components/navigation/BottomNav";
import { HomeScreen } from "./components/home/HomeScreen";
import { DiptiKLogo } from "./components/common/DiptiKLogo";
import { ChatScreen } from "./components/chat/ChatScreen";
import { AgentScreen } from "./components/agent/AgentScreen";
import { AutomationsScreen } from "./components/automations/AutomationsScreen";
import { ProfileScreen } from "./components/profile/ProfileScreen";

// Modals
import { OnboardingModal } from "./components/modals/OnboardingModal";
import { AssistantSetupModal } from "./components/modals/AssistantSetupModal";
import { VoiceAssistantModal } from "./components/modals/VoiceAssistantModal";
import { CommandExecutionModal } from "./components/modals/CommandExecutionModal";
import { ErrorTesterModal } from "./components/modals/ErrorTesterModal";
import { ResearchModal } from "./components/features/ResearchModal";
import { VisionModal } from "./components/features/VisionModal";
import { NotesTasksModal } from "./components/features/NotesTasksModal";
import { PhoneActionsModal } from "./components/features/PhoneActionsModal";

import { Smartphone, Monitor, Bell, X, UserCheck } from "lucide-react";
import { ErrorBoundary } from "./components/common/ErrorBoundary";

const MainContent: React.FC = () => {
  const {
    activeTab,
    notifications,
    clearNotifications,
    userProfile,
    setShowAuth
  } = useApp();

  const [isPhoneFrame, setIsPhoneFrame] = useState(false);
  const [showToast, setShowToast] = useState(true);

  const latestNotif = notifications[0];

  return (
    <div className={`min-h-screen font-sans transition-colors ${
      userProfile.theme === "dark" ? "bg-gray-950 text-gray-100" : "bg-[#F8F9FA] text-gray-900"
    }`}>
      
      {/* Top Controls Bar for View Mode (Phone vs Desktop) */}
      <div className="bg-gray-900 text-white px-4 py-2 flex items-center justify-between text-xs border-b border-gray-800">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5">
            <DiptiKLogo size="xs" showText={false} />
            <span className="font-extrabold tracking-wider text-[#E31B23]">DIPTIK AI AGENT</span>
          </div>
          <span className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded text-[10px] hidden sm:inline">
            Hybrid Online/Offline Mobile Assistant Architecture
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAuth(true)}
            className="px-2.5 py-1 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-200 text-[11px] font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            title="Switch Profile or Authenticate"
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="truncate max-w-[110px]">{userProfile.nickname || "Profiles"}</span>
          </button>

          <div className="flex items-center space-x-1 bg-gray-800 p-0.5 rounded-lg">
            <button
              onClick={() => setIsPhoneFrame(false)}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center space-x-1 ${
                !isPhoneFrame ? "bg-[#E31B23] text-white font-bold" : "text-gray-400 hover:text-white"
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Responsive App View</span>
            </button>
            <button
              onClick={() => setIsPhoneFrame(true)}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center space-x-1 ${
                isPhoneFrame ? "bg-[#E31B23] text-white font-bold" : "text-gray-400 hover:text-white"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Simulated Phone Frame</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification Banner */}
      {latestNotif && showToast && (
        <div className="fixed top-12 right-4 z-50 max-w-sm bg-white border border-gray-200 rounded-2xl p-3.5 shadow-xl flex items-start space-x-3 animate-in slide-in-from-top duration-300">
          <div className="p-2 rounded-xl bg-[#FFF0F1] text-[#E31B23] shrink-0">
            <Bell className="w-4 h-4" />
          </div>
          <div className="flex-1 pr-2 text-left">
            <h4 className="text-xs font-extrabold text-gray-900">{latestNotif.title}</h4>
            <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">{latestNotif.message}</p>
          </div>
          <button
            onClick={() => {
              setShowToast(false);
              setTimeout(() => {
                clearNotifications();
                setShowToast(true);
              }, 300);
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Container (responsive or phone frame) */}
      <div className={`mx-auto transition-all duration-300 ${
        isPhoneFrame
          ? "max-w-[430px] my-6 border-8 border-gray-900 rounded-[50px] shadow-2xl overflow-hidden bg-white min-h-[880px] relative"
          : "max-w-7xl px-3 sm:px-6 py-4"
      }`}>
        
        {/* Top Navigation */}
        <TopBar />

        {/* Screen Switcher */}
        <main className="mt-4 mb-24">
          {activeTab === "home" && <HomeScreen />}
          {activeTab === "chat" && <ChatScreen />}
          {activeTab === "agent" && <AgentScreen />}
          {activeTab === "automations" && <AutomationsScreen />}
          {activeTab === "profile" && <ProfileScreen />}
        </main>

        {/* Bottom Navigation */}
        <BottomNav />
      </div>

      {/* All Global Modal Interfaces */}
      <OnboardingModal />
      <AssistantSetupModal />
      <VoiceAssistantModal />
      <CommandExecutionModal />
      <ErrorTesterModal />
      <ResearchModal />
      <VisionModal />
      <NotesTasksModal />
      <PhoneActionsModal />

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
