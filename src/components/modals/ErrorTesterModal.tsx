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
      color: "text-amber-300 bg-amber-500/15 border-amber-500/30",
      desc: "Network unreachable while requesting cloud Gemini 4 Hydrogen reasoning.",
      recovery: "DiptiK AI 3 seamlessly switched your active session to On-Device Lite (350M) engine.",
      actionLabel: "Test Offline Toggle",
      onAction: toggleOfflineMode
    },
    {
      id: "perm_denied",
      title: "Permission Denied",
      icon: ShieldAlert,
      color: "text-[#FF8A9E] bg-[#FF1744]/15 border-[#FF1744]/35",
      desc: "Attempted to execute 'Call Contact' without Phone & Dialer permission granted.",
      recovery: "Execution halted at safeguard step. Please review safety transparency card.",
      actionLabel: "Grant Phone Permission",
      onAction: () => {
        togglePermission("phone");
        addNotification({ title: "Permission Granted", message: "Phone & Dialer access enabled for DiptiK AI 3 voice actions.", category: "security" });
      }
    },
    {
      id: "unsupported",
      title: "Unsupported Action",
      icon: AlertTriangle,
      color: "text-[#f0abfc] bg-[#8A2BE2]/20 border-[#8A2BE2]/40",
      desc: "User requested: 'Transfer $500 from banking app without confirmation.'",
      recovery: "Per Section 33 safety limits, DiptiK AI 3 cannot bypass banking security or enter passwords secretly.",
      actionLabel: "View Safety Policy",
      onAction: () => addNotification({ title: "Safety Policy (Section 33)", message: "DiptiK AI 3 only executes supported OS intents with clear permissions and explicit approval.", category: "security" })
    },
    {
      id: "app_missing",
      title: "Application Not Installed",
      icon: FileX,
      color: "text-[#00E5FF] bg-[#0072FF]/15 border-[#0072FF]/35",
      desc: "Command 'Open Notion workspace' failed because Notion is not installed on device.",
      recovery: "We prepared a web browser fallback link or Play Store redirect.",
      actionLabel: "Open Web Fallback",
      onAction: () => addNotification({ title: "Web Fallback Prepared", message: "Prepared safe web route to notion.so workspace.", category: "system" })
    },
    {
      id: "contact_multi",
      title: "Multiple Contacts Found",
      icon: AlertTriangle,
      color: "text-amber-300 bg-amber-500/15 border-amber-500/30",
      desc: "Found 3 contacts matching 'Contact': Primary Mobile, WhatsApp, and Work Email.",
      recovery: "Clarification screen triggered asking user to select desired target.",
      actionLabel: "Simulate Clarification",
      onAction: () => addNotification({ title: "Clarification Triggered", message: "Multi-contact selector prompt displayed for target confirmation.", category: "system" })
    },
    {
      id: "service_expired",
      title: "Service Connection Expired",
      icon: RefreshCw,
      color: "text-[#FF8A9E] bg-[#FF1E8A]/15 border-[#FF1E8A]/35",
      desc: "Google Gmail OAuth integration token expired during background sync.",
      recovery: "Notification sent to user to re-authenticate without losing draft state.",
      actionLabel: "Re-Connect OAuth",
      onAction: () => addNotification({ title: "Gmail Connected", message: "OAuth token refreshed successfully.", category: "system" })
    },
    {
      id: "storage_low",
      title: "Insufficient Storage",
      icon: HardDrive,
      color: "text-[#cbd5e1] bg-white/[0.06] border-white/[0.15]",
      desc: "Attempted to download Offline Speech Recognition package (185 MB) with only 50 MB free.",
      recovery: "Prompted user to clear old cached research briefings or select lite package.",
      actionLabel: "Clear Cache (42 MB)",
      onAction: () => addNotification({ title: "Cache Cleared", message: "Freed 42 MB of cached reports; 220 MB now available.", category: "system" })
    },
    {
      id: "biometric_fail",
      title: "Biometric Verification Failed",
      icon: Lock,
      color: "text-[#FF8A9E] bg-[#FF1744]/15 border-[#FF1744]/35",
      desc: "Level 3 safeguard check failed: device biometric passkey or Hold-to-Confirm check was cancelled.",
      recovery: "Action immediately blocked. All pending modifications cleared from memory.",
      actionLabel: "Retry Biometric Check",
      onAction: () => addNotification({ title: "Biometric Safeguard Verified", message: "Device biometric verification accepted. Level 3 safeguard unlocked.", category: "security" })
    }
  ];

  const current = errorStates.find(e => e.id === activeError) || errorStates[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#121520] rounded-2xl shadow-2xl overflow-hidden border border-white/[0.1] flex flex-col max-h-[90vh] text-[#e2e8f0]">
        
        {/* Header */}
        <div className="bg-[#0f121d] border-b border-white/[0.08] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#FF1E8A]/20 to-[#0072FF]/25 border border-white/[0.1]">
              <DiptiKLogo size="xs" showText={false} />
            </div>
            <div>
              <h2 className="font-display font-semibold text-base leading-tight">Error States & Safety Lab (Section 27)</h2>
              <p className="text-[11px] text-[#94a3b8]">Interactive simulator to test DiptiK AI 3 error recovery and Level 1-3 safeguards</p>
            </div>
          </div>
          <button
            onClick={() => setIsErrorTesterModalOpen(false)}
            className="p-1.5 rounded-lg hover:bg-white/[0.08] text-[#94a3b8] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 overflow-hidden">
          
          {/* Left error list */}
          <div className="border-r border-white/[0.08] bg-[#0f121d] p-3 overflow-y-auto space-y-1.5 max-h-[60vh] md:max-h-full gemini-scroll">
            <span className="text-[10px] font-semibold text-[#64748b] uppercase px-2 block mb-1">Select Error Scenario</span>
            {errorStates.map(err => {
              const Icon = err.icon;
              const isSelected = activeError === err.id;
              return (
                <button
                  key={err.id}
                  onClick={() => setActiveError(err.id)}
                  className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center space-x-2.5 cursor-pointer border ${
                    isSelected
                      ? "bg-[#181c2b] border-[#0072FF]/50 text-white font-semibold"
                      : "border-transparent text-[#94a3b8] hover:bg-[#181c2b] hover:text-white text-xs font-medium"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isSelected ? "text-[#00E5FF]" : "text-[#64748b]"}`} />
                  <span className="text-xs truncate">{err.title}</span>
                </button>
              );
            })}
          </div>

          {/* Right active error details */}
          <div className="md:col-span-2 p-6 overflow-y-auto flex flex-col justify-between space-y-6 text-left">
            <div className="space-y-4">
              <div className={`p-4 rounded-2xl border flex items-start space-x-3 ${current.color}`}>
                <current.icon className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold">{current.title}</h3>
                  <p className="text-xs mt-1 leading-relaxed opacity-90">{current.desc}</p>
                </div>
              </div>

              <div className="p-4 bg-[#181c2b] border border-white/[0.08] rounded-2xl space-y-2">
                <span className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>DiptiK AI 3 Automated Recovery Protocol</span>
                </span>
                <p className="text-xs font-medium text-[#e2e8f0] leading-relaxed">
                  {current.recovery}
                </p>
              </div>

              <div className="p-3.5 bg-gradient-to-r from-[#FF1E8A]/10 to-[#0072FF]/10 border border-[#8A2BE2]/30 rounded-xl text-[11px] text-[#cbd5e1]">
                <strong className="text-white">Why this matters:</strong> Per Section 33, DiptiK AI 3 never bypasses system security or fails silently. Clear feedback is presented with one-tap remediation.
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
              <span className="text-[11px] text-[#64748b] font-mono">Error ID: {current.id}</span>
              <div className="flex space-x-2">
                <button
                  onClick={current.onAction}
                  className="py-2.5 px-5 btn-diptik-primary text-white rounded-xl text-xs font-semibold shadow-md flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap"
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
