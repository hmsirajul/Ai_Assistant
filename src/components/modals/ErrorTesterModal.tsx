import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { AlertTriangle, WifiOff, ShieldAlert, FileX, HardDrive, MicOff, Lock, X, RefreshCw, CheckCircle2, ArrowRight } from "lucide-react";
import { DiptiKLogo } from "../common/DiptiKLogo";

export const ErrorTesterModal: React.FC = () => {
  const { isErrorTesterModalOpen, setIsErrorTesterModalOpen, toggleOfflineMode, togglePermission, addNotification } = useApp();
  const [activeError, setActiveError] = useState<string | null>("no_internet");

  if (!isErrorTesterModalOpen) return null;

  const errorStates = [
    {
      id: "no_internet",
      title: "No Internet Connection",
      icon: WifiOff,
      color: "text-amber-600 bg-amber-50 border-amber-200",
      desc: "Network unreachable while requesting cloud Gemini 4 Hydrogen reasoning.",
      recovery: "DiptiK AI seamlessly switched your active session to On-Device Lite (350M) engine.",
      actionLabel: "Test Offline Toggle",
      onAction: toggleOfflineMode
    },
    {
      id: "perm_denied",
      title: "Permission Denied",
      icon: ShieldAlert,
      color: "text-red-600 bg-red-50 border-red-200",
      desc: "Attempted to execute 'Call Rahim' without Phone & Dialer permission granted.",
      recovery: "Execution halted at safeguard step. Please review safety transparency card.",
      actionLabel: "Grant Phone Permission",
      onAction: () => {
        togglePermission("phone");
        addNotification({ title: "Permission Granted", message: "Phone & Dialer access enabled for DiptiK AI voice actions.", category: "security" });
      }
    },
    {
      id: "unsupported",
      title: "Unsupported Action",
      icon: AlertTriangle,
      color: "text-purple-600 bg-purple-50 border-purple-200",
      desc: "User requested: 'Transfer $500 from banking app without confirmation.'",
      recovery: "Per Section 33 safety limits, DiptiK AI cannot bypass banking security or enter passwords secretly.",
      actionLabel: "View Safety Policy",
      onAction: () => addNotification({ title: "Safety Policy (Section 33)", message: "DiptiK AI only executes supported OS intents with clear permissions and explicit approval.", category: "security" })
    },
    {
      id: "app_missing",
      title: "Application Not Installed",
      icon: FileX,
      color: "text-blue-600 bg-blue-50 border-blue-200",
      desc: "Command 'Open Notion workspace' failed because Notion is not installed on device.",
      recovery: "We prepared a web browser fallback link or Play Store redirect.",
      actionLabel: "Open Web Fallback",
      onAction: () => addNotification({ title: "Web Fallback Prepared", message: "Prepared safe web route to notion.so workspace.", category: "system" })
    },
    {
      id: "contact_multi",
      title: "Multiple Contacts Found",
      icon: AlertTriangle,
      color: "text-orange-600 bg-orange-50 border-orange-200",
      desc: "Found 3 contacts matching 'Rahim': Primary Mobile, WhatsApp, and Work Email.",
      recovery: "Clarification screen triggered asking user to select desired target.",
      actionLabel: "Simulate Clarification",
      onAction: () => addNotification({ title: "Clarification Triggered", message: "Multi-contact selector prompt displayed for target confirmation.", category: "system" })
    },
    {
      id: "service_expired",
      title: "Service Connection Expired",
      icon: RefreshCw,
      color: "text-rose-600 bg-rose-50 border-rose-200",
      desc: "Google Gmail OAuth integration token expired during background sync.",
      recovery: "Notification sent to user to re-authenticate without losing draft state.",
      actionLabel: "Re-Connect OAuth",
      onAction: () => addNotification({ title: "Gmail Connected", message: "OAuth token refreshed successfully.", category: "system" })
    },
    {
      id: "storage_low",
      title: "Insufficient Storage",
      icon: HardDrive,
      color: "text-stone-700 bg-stone-100 border-stone-300",
      desc: "Attempted to download Offline Speech Recognition package (185 MB) with only 50 MB free.",
      recovery: "Prompted user to clear old cached research briefings or select lite package.",
      actionLabel: "Clear Cache (42 MB)",
      onAction: () => addNotification({ title: "Cache Cleared", message: "Freed 42 MB of cached reports; 220 MB now available.", category: "system" })
    },
    {
      id: "biometric_fail",
      title: "Security Verification Failed",
      icon: Lock,
      color: "text-red-700 bg-red-100 border-red-300",
      desc: "Level 3 safeguard check failed: PIN entered did not match user credentials.",
      recovery: "Action immediately blocked. All pending modifications purged from memory.",
      actionLabel: "Retry PIN (1234)",
      onAction: () => addNotification({ title: "Safeguard Unlocked", message: "PIN 1234 accepted. Level 3 safeguard verified.", category: "security" })
    }
  ];

  const current = errorStates.find(e => e.id === activeError) || errorStates[0];

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gray-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-[#E31B23] text-white">
              <DiptiKLogo size="xs" showText={false} />
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight">Error States & Safety Lab (Section 27)</h2>
              <p className="text-[11px] text-gray-400">Interactive simulator to test DiptiK AI's error recovery and Level 1-3 safeguards</p>
            </div>
          </div>
          <button
            onClick={() => setIsErrorTesterModalOpen(false)}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 overflow-hidden">
          
          {/* Left error list */}
          <div className="border-r border-gray-200 bg-gray-50 p-3 overflow-y-auto space-y-1.5 max-h-[60vh] md:max-h-full">
            <span className="text-[10px] font-bold text-gray-400 uppercase px-2">Select Error Scenario</span>
            {errorStates.map(err => {
              const Icon = err.icon;
              const isSelected = activeError === err.id;
              return (
                <button
                  key={err.id}
                  onClick={() => setActiveError(err.id)}
                  className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center space-x-2.5 ${
                    isSelected
                      ? "bg-white shadow-sm border border-gray-200 text-gray-900 font-bold"
                      : "text-gray-600 hover:bg-gray-100 text-xs font-medium"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isSelected ? "text-[#E31B23]" : "text-gray-400"}`} />
                  <span className="text-xs truncate">{err.title}</span>
                </button>
              );
            })}
          </div>

          {/* Right active error details */}
          <div className="md:col-span-2 p-6 overflow-y-auto flex flex-col justify-between space-y-6 text-left">
            <div className="space-y-4">
              <div className={`p-4 rounded-2xl border flex items-start space-x-3 ${current.color}`}>
                <current.icon className="w-6 h-6 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold">{current.title}</h3>
                  <p className="text-xs mt-1 leading-relaxed opacity-90">{current.desc}</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>DiptiK AI Automated Recovery Protocol</span>
                </span>
                <p className="text-xs font-medium text-gray-800 leading-relaxed">
                  {current.recovery}
                </p>
              </div>

              <div className="p-3 bg-[#FFF0F1] border border-[#E31B23]/20 rounded-xl text-[11px] text-gray-700">
                <strong>Why this matters:</strong> Per Section 33, DiptiK AI never bypasses system security or fails silently. Clear feedback is presented with one-tap remediation.
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <span className="text-[10px] text-gray-400 font-mono">Error ID: {current.id}</span>
              <div className="flex space-x-2">
                <button
                  onClick={current.onAction}
                  className="py-2.5 px-5 bg-[#E31B23] hover:bg-[#BF141B] text-white rounded-xl text-xs font-bold shadow-md flex items-center space-x-1.5 transition-all"
                >
                  <span>{current.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
