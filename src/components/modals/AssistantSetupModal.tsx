import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Sparkles, ShieldCheck, WifiOff, Check, ArrowRight, Download, CheckCircle, Volume2, Globe, Sliders } from "lucide-react";
import { DiptiKLogo } from "../common/DiptiKLogo";

export const AssistantSetupModal: React.FC = () => {
  const {
    showAssistantSetup,
    setShowAssistantSetup,
    userProfile,
    updateUserProfile,
    permissions,
    togglePermission,
    offlinePackages,
    downloadOfflinePackage
  } = useApp();

  const [step, setStep] = useState<"personalize" | "permissions" | "offline">("personalize");
  const [nickname, setNickname] = useState(userProfile.nickname);
  const [style, setStyle] = useState<any>(userProfile.style);
  const [speed, setSpeed] = useState<any>(userProfile.speed);
  const [wifiOnly, setWifiOnly] = useState(true);

  if (!showAssistantSetup) return null;

  const handleFinishSetup = () => {
    updateUserProfile({ nickname, style, speed });
    setShowAssistantSetup(false);
  };

  const responseStyles = [
    { id: "Concise", label: "Concise", desc: "Short, direct answers without pleasantries." },
    { id: "Balanced", label: "Balanced", desc: "Natural conversational tone with key details." },
    { id: "Detailed", label: "Detailed", desc: "Comprehensive explanations with background context." },
    { id: "Professional", label: "Professional", desc: "Formal, workplace-ready vocabulary and structure." },
    { id: "Friendly", label: "Friendly", desc: "Warm, empathetic, and encouraging replies." }
  ] as const;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#121520] rounded-2xl shadow-2xl overflow-hidden border border-white/[0.1] flex flex-col max-h-[90vh] text-[#e2e8f0]">
        
        {/* Modal Header */}
        <div className="bg-[#0f121d] border-b border-white/[0.08] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <DiptiKLogo size="sm" showText={false} />
            <div>
              <h2 className="font-display font-semibold text-base leading-tight">DiptiK AI 3 Setup Guide</h2>
              <p className="text-[11px] text-[#94a3b8]">
                {step === "personalize" && "Step 1/3: Personalization"}
                {step === "permissions" && "Step 2/3: Safety & Permissions"}
                {step === "offline" && "Step 3/3: Offline Intelligence"}
              </p>
            </div>
          </div>
          <div className="flex space-x-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${step === "personalize" ? "bg-[#00E5FF]" : "bg-white/[0.15]"}`} />
            <span className={`w-2.5 h-2.5 rounded-full ${step === "permissions" ? "bg-[#8A2BE2]" : "bg-white/[0.15]"}`} />
            <span className={`w-2.5 h-2.5 rounded-full ${step === "offline" ? "bg-[#FF1E8A]" : "bg-white/[0.15]"}`} />
          </div>
        </div>

        {/* Step 1: Assistant Personalization (Section 7.1) */}
        {step === "personalize" && (
          <div className="p-6 overflow-y-auto flex-1 space-y-5 gemini-scroll text-left">
            <div>
              <h3 className="text-base font-semibold text-white flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-[#00E5FF]" />
                <span>Personalize Your Assistant</span>
              </h3>
              <p className="text-xs text-[#94a3b8] mt-0.5">Configure how DiptiK AI 3 speaks and interacts with you.</p>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider">What should DiptiK AI 3 call you?</label>
              <input
                type="text"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#181c2b] border border-white/[0.1] rounded-xl text-xs font-medium text-white mt-1.5 focus:border-[#0072FF] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider">Preferred Response Style</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {responseStyles.map(st => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStyle(st.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      style === st.id
                        ? "bg-[#0072FF]/15 border-[#0072FF] text-white"
                        : "bg-[#181c2b] border-white/[0.08] hover:bg-[#1f2437]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">{st.label}</span>
                      {style === st.id && <Check className="w-3.5 h-3.5 text-[#00E5FF]" />}
                    </div>
                    <p className="text-[10px] text-[#94a3b8] mt-1">{st.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-[#94a3b8] uppercase flex items-center space-x-1">
                  <Volume2 className="w-3 h-3 text-[#00E5FF]" />
                  <span>Speech Speed</span>
                </label>
                <select
                  value={speed}
                  onChange={e => setSpeed(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#181c2b] border border-white/[0.1] rounded-xl text-xs font-medium text-white mt-1.5 focus:outline-none focus:border-[#0072FF]"
                >
                  <option value="0.8x" className="bg-[#181c2b] text-white">0.8x (Slow)</option>
                  <option value="1.0x" className="bg-[#181c2b] text-white">1.0x (Normal)</option>
                  <option value="1.2x" className="bg-[#181c2b] text-white">1.2x (Fast)</option>
                  <option value="1.5x" className="bg-[#181c2b] text-white">1.5x (Speedy)</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#94a3b8] uppercase flex items-center space-x-1">
                  <Globe className="w-3 h-3 text-[#FF1E8A]" />
                  <span>Language</span>
                </label>
                <select className="w-full px-3 py-2 bg-[#181c2b] border border-white/[0.1] rounded-xl text-xs font-medium text-white mt-1.5 focus:outline-none focus:border-[#0072FF]">
                  <option className="bg-[#181c2b] text-white">English (United States)</option>
                  <option className="bg-[#181c2b] text-white">Spanish (Español)</option>
                  <option className="bg-[#181c2b] text-white">French (Français)</option>
                  <option className="bg-[#181c2b] text-white">Bengali (বাংলা)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Permission Introduction (Section 7.2) */}
        {step === "permissions" && (
          <div className="p-6 overflow-y-auto flex-1 space-y-4 gemini-scroll text-left">
            <div>
              <h3 className="text-base font-semibold text-white flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-[#00E5FF]" />
                <span>Transparent Safety & Permissions</span>
              </h3>
              <p className="text-xs text-[#94a3b8] mt-0.5">
                We request permissions only to execute your commands. Review what each enables:
              </p>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 gemini-scroll">
              {permissions.map(perm => (
                <div
                  key={perm.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    perm.granted ? "bg-[#181c2b] border-[#0072FF]/35" : "bg-[#181c2b]/60 border-white/[0.08]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold text-white flex items-center space-x-1.5">
                        <span>{perm.name}</span>
                        {perm.granted && (
                          <span className="text-[10px] text-emerald-300 font-medium bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        )}
                      </span>
                      <p className="text-[11px] text-[#cbd5e1] mt-1">{perm.description}</p>
                      <p className="text-[10px] text-[#64748b] italic mt-1.5">{perm.privacyNote}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => togglePermission(perm.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ml-3 shrink-0 cursor-pointer whitespace-nowrap ${
                        perm.granted
                          ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30"
                          : "bg-[#1f2437] border border-white/[0.1] text-[#cbd5e1] hover:text-white"
                      }`}
                    >
                      {perm.granted ? "Enabled" : "Enable"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Offline Model Setup (Section 7.3) */}
        {step === "offline" && (
          <div className="p-6 overflow-y-auto flex-1 space-y-4 gemini-scroll text-left">
            <div>
              <h3 className="text-base font-semibold text-white flex items-center space-x-2">
                <WifiOff className="w-4 h-4 text-[#FF1E8A]" />
                <span>On-Device Offline Intelligence</span>
              </h3>
              <p className="text-xs text-[#94a3b8] mt-0.5">
                Use DiptiK AI 3 without cellular or Wi-Fi. Downloaded models run 100% locally on your device.
              </p>
            </div>

            <div className="bg-amber-500/15 border border-amber-500/30 rounded-2xl p-3.5 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-amber-200">Download over Wi-Fi Only</span>
                <p className="text-[10px] text-amber-300/80">Prevents mobile data overages when updating offline packages.</p>
              </div>
              <input
                type="checkbox"
                checked={wifiOnly}
                onChange={() => setWifiOnly(!wifiOnly)}
                className="w-4 h-4 rounded accent-[#00E5FF] cursor-pointer"
              />
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 gemini-scroll">
              {offlinePackages.map(pkg => (
                <div key={pkg.id} className="p-3.5 rounded-2xl border border-white/[0.08] bg-[#181c2b] flex items-center justify-between gap-2">
                  <div className="flex-1 pr-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-white">{pkg.name}</span>
                      <span className="text-[10px] bg-[#121520] border border-white/[0.08] text-[#94a3b8] px-1.5 py-0.5 rounded font-mono">{pkg.size}</span>
                    </div>
                    <p className="text-[11px] text-[#94a3b8] mt-1">{pkg.description}</p>
                    {pkg.status === "downloading" && (
                      <div className="w-full bg-[#121520] h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-gradient-to-r from-[#FF1E8A] via-[#8A2BE2] to-[#00E5FF] h-full transition-all duration-300" style={{ width: `${pkg.progress || 30}%` }} />
                      </div>
                    )}
                  </div>

                  {pkg.status === "downloaded" ? (
                    <span className="flex items-center space-x-1 text-emerald-300 text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-xl shrink-0">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Ready</span>
                    </span>
                  ) : pkg.status === "downloading" ? (
                    <span className="text-xs font-semibold text-[#00E5FF] tabular-nums shrink-0">
                      {pkg.progress}%
                    </span>
                  ) : (
                    <button
                      onClick={() => downloadOfflinePackage(pkg.id)}
                      className="px-3 py-1.5 bg-[#0072FF]/20 hover:bg-[#0072FF] border border-[#0072FF]/35 text-[#00E5FF] hover:text-white rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1 shrink-0 cursor-pointer whitespace-nowrap"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Install</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Footer Controls */}
        <div className="p-4 bg-[#0f121d] border-t border-white/[0.08] flex items-center justify-between">
          {step !== "personalize" ? (
            <button
              onClick={() => setStep(step === "offline" ? "permissions" : "personalize")}
              className="py-2 px-4 rounded-xl text-xs font-medium text-[#cbd5e1] hover:text-white bg-[#181c2b] hover:bg-[#1f2437] border border-white/[0.08] transition-colors cursor-pointer whitespace-nowrap"
            >
              Back
            </button>
          ) : <div />}

          <button
            onClick={() => {
              if (step === "personalize") setStep("permissions");
              else if (step === "permissions") setStep("offline");
              else handleFinishSetup();
            }}
            className="py-2.5 px-6 btn-diptik-primary text-white rounded-xl text-xs font-semibold shadow-md flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap"
          >
            <span>{step === "offline" ? "Complete Setup" : "Next Step"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
