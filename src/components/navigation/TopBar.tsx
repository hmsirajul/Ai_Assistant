import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  Bell,
  Wifi,
  WifiOff,
  Smartphone,
  Monitor,
  ShieldCheck,
  HelpCircle,
  Menu,
  X,
  Beaker,
  Zap,
  Cpu,
  Activity,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  User,
  Settings,
  History,
  Wrench,
  LogIn,
  LogOut,
  Mic
} from "lucide-react";
import { DiptiKLogo } from "../common/DiptiKLogo";

export const TopBar: React.FC = () => {
  const {
    userProfile,
    isAuthenticated,
    firebaseUser,
    setShowAuth,
    logout,
    isOfflineMode,
    toggleOfflineMode,
    isMobileFrame,
    setIsMobileFrame,
    notifications,
    markAllNotificationsRead,
    setActiveTab,
    setIsErrorTesterModalOpen,
    openVoiceWithAgent
  } = useApp();

  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showSideMenu, setShowSideMenu] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-xs">
        {/* Left Brand & Sidebar Menu Trigger */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowSideMenu(true)}
            className="flex items-center space-x-3 p-1.5 -ml-1.5 rounded-2xl hover:bg-gray-100/80 transition-all cursor-pointer group text-left"
            title="Click to open AI Engine & Diagnostics Sidebar"
          >
            <div className="relative shrink-0">
              <DiptiKLogo size="sm" showText={false} className="group-hover:scale-105 transition-transform" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-gray-900 group-hover:text-purple-600 transition-colors">
                DiptiK AI
              </span>
              <span className="text-[10px] font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-2 py-0.5 rounded-md uppercase tracking-wide shadow-2xs">
                4.0
              </span>
              <div className="flex items-center text-gray-400 group-hover:text-gray-800 ml-1 transition-colors bg-gray-100 group-hover:bg-gray-200 px-2 py-1 rounded-xl">
                <Menu className="w-4 h-4" />
              </div>
            </div>
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-2">
          {/* View Frame Toggle */}
          <button
            onClick={() => setIsMobileFrame(!isMobileFrame)}
            title={isMobileFrame ? "Switch to Wide Desktop View" : "Switch to Mobile App Frame"}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors hidden md:block cursor-pointer"
          >
            {isMobileFrame ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
          </button>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600 relative transition-colors cursor-pointer"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#E31B23] text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-200 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-2">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-gray-900 text-sm">Notifications</span>
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-medium">
                      {notifications.length}
                    </span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-xs text-[#E31B23] font-semibold hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <p className="text-center text-xs text-gray-400 py-6">No recent notifications</p>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        className={`p-3 rounded-xl border transition-all text-left ${
                          n.read ? "bg-white border-gray-100" : "bg-[#FFF0F1] border-[#E31B23]/20"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-xs font-bold text-gray-900">{n.title}</span>
                          <span className="text-[10px] text-gray-400">{n.timestamp}</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{n.message}</p>
                        {n.actionRequired && (
                          <div className="mt-2 pt-2 border-t border-gray-200/60 flex items-center justify-between">
                            <span className="text-[10px] text-[#E31B23] font-semibold flex items-center space-x-1">
                              <ShieldCheck className="w-3 h-3" />
                              <span>Level {n.actionRequired.level} Safeguard</span>
                            </span>
                            <button
                              onClick={() => {
                                setShowNotifDropdown(false);
                                setActiveTab("chat");
                              }}
                              className="px-2.5 py-1 bg-[#E31B23] text-white rounded-lg text-[10px] font-bold hover:bg-[#BF141B] cursor-pointer"
                            >
                              Review Action
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Live Voice Trigger */}
          <button
            onClick={() => openVoiceWithAgent(null)}
            title="Start Real-Time Voice Conversation"
            className="p-2 rounded-full bg-[#FFF0F1] hover:bg-[#E31B23] text-[#E31B23] hover:text-white transition-colors cursor-pointer"
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Switch Profile / Auth */}
          <button
            onClick={() => setShowAuth(true)}
            title="Switch Profile or Sign In"
            className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-[11px] font-bold transition-colors cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5 text-purple-600" />
            <span className="max-w-[90px] truncate">{userProfile.nickname || "Profiles"}</span>
          </button>

          {/* Profile Avatar */}
          <button
            onClick={() => setActiveTab("profile")}
            title={`Open ${userProfile.name} Profile`}
            className="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-xs focus:ring-2 focus:ring-purple-600 transition-all cursor-pointer shrink-0"
          >
            <img
              src={userProfile.avatar}
              alt={userProfile.name}
              className="w-full h-full object-cover"
            />
          </button>
        </div>
      </header>

      {/* Slide-over Sidebar Drawer */}
      {showSideMenu && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            onClick={() => setShowSideMenu(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 left-0 max-w-sm w-[88vw] bg-white shadow-2xl border-r border-gray-100 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-left duration-300 z-50">
            <div>
              {/* Header */}
              <div className="p-6 bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950 text-white flex items-center justify-between border-b border-white/10">
                <div className="flex items-center space-x-3 min-w-0">
                  <DiptiKLogo size="md" showText={false} className="shrink-0" />
                  <div className="min-w-0 text-left">
                    <div className="flex items-center space-x-1.5">
                      <h2 className="text-lg font-extrabold text-white tracking-tight truncate">DiptiK AI</h2>
                      <span className="text-[10px] font-bold bg-purple-500/30 text-purple-200 border border-purple-400/30 px-1.5 py-0.5 rounded-md uppercase">
                        v4.0
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 truncate mt-0.5">Your AI Companion & Executive Assistant</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSideMenu(false)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-6 text-left">
                {/* 0. Active Account & Profile Switcher */}
                <div className="p-4 rounded-3xl bg-gray-50 border border-gray-200 flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-3 min-w-0">
                    <img
                      src={userProfile.avatar}
                      alt={userProfile.name}
                      className="w-10 h-10 rounded-2xl object-cover border border-gray-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-gray-900 truncate">{userProfile.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">
                        {firebaseUser ? "Cloud Synced" : isAuthenticated ? "Local Profile" : "Guest"} • {userProfile.defaultEngine || "Gemini 4 Hydrogen"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button
                      onClick={() => {
                        setShowSideMenu(false);
                        setShowAuth(true);
                      }}
                      className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[11px] font-bold cursor-pointer"
                    >
                      Switch
                    </button>
                    {firebaseUser && (
                      <button
                        onClick={() => {
                          setShowSideMenu(false);
                          logout();
                        }}
                        title="Sign Out"
                        className="p-1.5 bg-gray-200 hover:bg-red-100 text-gray-600 hover:text-red-600 rounded-xl cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 1. AI Engine & Mode Switcher (Below Logo as requested) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center space-x-1.5">
                      <Cpu className="w-4 h-4 text-purple-600" />
                      <span>AI Engine & Connectivity</span>
                    </label>
                    <span className="flex items-center space-x-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{isOfflineMode ? "Offline Lite" : "Online Cloud"}</span>
                    </span>
                  </div>

                  <div className={`p-4 rounded-3xl border transition-all ${
                    isOfflineMode
                      ? "bg-amber-50/70 border-amber-200"
                      : "bg-gradient-to-br from-purple-50 via-indigo-50/50 to-white border-purple-200/80 shadow-xs"
                  }`}>
                    <div className="flex items-start space-x-3.5">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs font-bold ${
                        isOfflineMode ? "bg-amber-500 text-white" : "bg-gradient-to-br from-purple-600 to-indigo-600 text-white"
                      }`}>
                        {isOfflineMode ? <WifiOff className="w-5 h-5" /> : <Wifi className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-extrabold text-gray-900 truncate">
                          {isOfflineMode ? "Offline AI Lite Mode" : "Online Cloud AI"}
                        </h4>
                        <p className="text-xs font-bold text-purple-700 mt-0.5 truncate">
                          {isOfflineMode ? "On-Device 350M • Zero Telemetry" : `${userProfile.defaultEngine || "Gemini 4 Hydrogen"} • Live Voice`}
                        </p>
                        <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                          {isOfflineMode
                            ? "Running purely locally on your device with 350M parameters. Zero data leaves your hardware."
                            : "Connected to Gemini 4 Hydrogen & Gemini 3.8 Live for real-time voice, reasoning, and agent tools."}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={toggleOfflineMode}
                      className={`mt-4 w-full py-2.5 px-4 rounded-xl text-xs font-extrabold shadow-sm flex items-center justify-center space-x-2 transition-all cursor-pointer border ${
                        isOfflineMode
                          ? "bg-amber-500 text-gray-950 border-amber-400 hover:bg-amber-400"
                          : "bg-white hover:bg-gray-50 text-purple-900 border-purple-300 shadow-xs"
                      }`}
                    >
                      <span>{isOfflineMode ? "Switch to Online Cloud AI" : "Switch to Offline Lite Mode"}</span>
                    </button>
                  </div>
                </div>

                {/* 2. Error Lab & Safeguards (Moved from TopBar) */}
                <div className="space-y-2">
                  <label className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center space-x-1.5">
                    <Beaker className="w-4 h-4 text-[#E31B23]" />
                    <span>Diagnostics & Error Lab</span>
                  </label>

                  <div className="p-4 rounded-3xl bg-gradient-to-br from-gray-900 via-stone-900 to-gray-950 text-white shadow-md space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-300 flex items-center space-x-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>Safeguards Section 26 & 27</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#E31B23]/20 border border-[#E31B23]/40 text-[10px] font-bold text-red-300">
                        Active Lab
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Test simulated edge cases, API timeouts, rate limits, and multi-tier safety interventions.
                    </p>
                    <button
                      onClick={() => {
                        setShowSideMenu(false);
                        setIsErrorTesterModalOpen(true);
                      }}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-[#E31B23] to-[#BF141B] hover:from-[#BF141B] hover:to-[#991016] text-white rounded-xl text-xs font-extrabold shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer"
                    >
                      <Beaker className="w-4 h-4" />
                      <span>Open Error Lab</span>
                    </button>
                  </div>
                </div>

                {/* 3. System Status & Health */}
                <div className="space-y-2.5">
                  <label className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center space-x-1.5">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    <span>System Telemetry & Health</span>
                  </label>

                  <div className="bg-gray-50/80 rounded-2xl p-3.5 border border-gray-100 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Reasoning Latency:</span>
                      <span className="font-bold text-emerald-600 flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>142ms (Optimal)</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Active Persona:</span>
                      <span className="font-bold text-gray-900 truncate max-w-[140px]">
                        {userProfile.persona ? userProfile.persona.split(" (")[0] : "Default"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Vector Memory:</span>
                      <span className="font-bold text-purple-600">Connected (Local RAG)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Safety Shield:</span>
                      <span className="font-bold text-gray-900">Level 1 Active</span>
                    </div>
                  </div>
                </div>

                {/* 4. Quick Navigation Links */}
                <div className="space-y-2">
                  <label className="text-xs font-extrabold text-gray-900 uppercase tracking-wider block">
                    Quick Navigation
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setActiveTab("profile");
                        setShowSideMenu(false);
                      }}
                      className="p-3 rounded-2xl bg-white border border-gray-200 hover:border-purple-300 hover:bg-purple-50/30 transition-all text-left flex flex-col justify-between group cursor-pointer"
                    >
                      <User className="w-5 h-5 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="font-extrabold text-xs text-gray-900">Profile & Persona</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("logs");
                        setShowSideMenu(false);
                      }}
                      className="p-3 rounded-2xl bg-white border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all text-left flex flex-col justify-between group cursor-pointer"
                    >
                      <History className="w-5 h-5 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="font-extrabold text-xs text-gray-900">Audit Trail</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("skills");
                        setShowSideMenu(false);
                      }}
                      className="p-3 rounded-2xl bg-white border border-gray-200 hover:border-amber-300 hover:bg-amber-50/30 transition-all text-left flex flex-col justify-between group cursor-pointer"
                    >
                      <Wrench className="w-5 h-5 text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="font-extrabold text-xs text-gray-900">Skills & Tools</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("settings");
                        setShowSideMenu(false);
                      }}
                      className="p-3 rounded-2xl bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all text-left flex flex-col justify-between group cursor-pointer"
                    >
                      <Settings className="w-5 h-5 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="font-extrabold text-xs text-gray-900">Settings</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
              <p className="text-xs font-extrabold text-gray-700">DiptiK AI v4.0 • Hybrid Live Edition</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Secure AI Companion • Section 1 - 33 Compliant</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

