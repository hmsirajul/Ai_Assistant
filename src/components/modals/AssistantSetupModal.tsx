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
    <div className="fixed inset-0 z-50 bg-gray-900/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <DiptiKLogo size="sm" showText={false} />
            <div>
              <h2 className="font-bold text-base leading-tight">DiptiK AI Setup Guide</h2>
              <p className="text-[11px] text-gray-400">
                {step === "personalize" && "Step 1/3: Personalization"}
                {step === "permissions" && "Step 2/3: Safety & Permissions"}
                {step === "offline" && "Step 3/3: Offline Intelligence"}
              </p>
            </div>
          </div>
          <div className="flex space-x-1">
            <span className={`w-2.5 h-2.5 rounded-full ${step === "personalize" ? "bg-[#E31B23]" : "bg-gray-600"}`} />
            <span className={`w-2.5 h-2.5 rounded-full ${step === "permissions" ? "bg-[#E31B23]" : "bg-gray-600"}`} />
            <span className={`w-2.5 h-2.5 rounded-full ${step === "offline" ? "bg-[#E31B23]" : "bg-gray-600"}`} />
          </div>
        </div>

        {/* Step 1: Assistant Personalization (Section 7.1) */}
        {step === "personalize" && (
          <div className="p-6 overflow-y-auto flex-1 space-y-5">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center space-x-1.5">
                <Sliders className="w-4 h-4 text-[#E31B23]" />
                <span>Personalize Your Assistant</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Configure how DiptiK AI speaks and interacts with you.</p>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-700 uppercase">What should DiptiK AI call you?</label>
              <input
                type="text"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium mt-1 focus:ring-2 focus:ring-[#E31B23] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-700 uppercase">Preferred Response Style</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {responseStyles.map(st => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStyle(st.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      style === st.id
                        ? "bg-[#FFF0F1] border-[#E31B23] ring-1 ring-[#E31B23]"
                        : "bg-white border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900">{st.label}</span>
                      {style === st.id && <Check className="w-3.5 h-3.5 text-[#E31B23]" />}
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">{st.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-700 uppercase flex items-center space-x-1">
                  <Volume2 className="w-3 h-3 text-gray-400" />
                  <span>Speech Speed</span>
                </label>
                <select
                  value={speed}
                  onChange={e => setSpeed(e.target.value as any)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium mt-1"
                >
                  <option value="0.8x">0.8x (Slow)</option>
                  <option value="1.0x">1.0x (Normal)</option>
                  <option value="1.2x">1.2x (Fast)</option>
                  <option value="1.5x">1.5x (Speedy)</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-700 uppercase flex items-center space-x-1">
                  <Globe className="w-3 h-3 text-gray-400" />
                  <span>Language</span>
                </label>
                <select className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium mt-1">
                  <option>English (United States)</option>
                  <option>Spanish (Español)</option>
                  <option>French (Français)</option>
                  <option>Bengali (বাংলা)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Permission Introduction (Section 7.2) */}
        {step === "permissions" && (
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-[#E31B23]" />
                <span>Transparent Safety & Permissions</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                We request permissions only to execute your commands. Review what each enables:
              </p>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {permissions.map(perm => (
                <div
                  key={perm.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    perm.granted ? "bg-white border-gray-200" : "bg-gray-50 border-gray-200/60"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-gray-900 flex items-center space-x-1.5">
                        <span>{perm.name}</span>
                        {perm.granted && <span className="text-[10px] text-emerald-600 font-normal bg-emerald-50 px-1.5 py-0.2 rounded-full">Active</span>}
                      </span>
                      <p className="text-[11px] text-gray-600 mt-1">{perm.description}</p>
                      <p className="text-[10px] text-gray-400 italic mt-1.5">{perm.privacyNote}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => togglePermission(perm.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ml-3 shrink-0 ${
                        perm.granted
                          ? "bg-emerald-500 text-white shadow-sm hover:bg-emerald-600"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
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
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center space-x-1.5">
                <WifiOff className="w-4 h-4 text-[#E31B23]" />
                <span>On-Device Offline Intelligence</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Use DiptiK AI without cellular or Wi-Fi. Downloaded models run 100% locally on your device.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-900">Download over Wi-Fi Only</span>
                <p className="text-[10px] text-amber-700">Prevents mobile data overages when updating offline packages.</p>
              </div>
              <input
                type="checkbox"
                checked={wifiOnly}
                onChange={() => setWifiOnly(!wifiOnly)}
                className="w-4 h-4 rounded text-[#E31B23]"
              />
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {offlinePackages.map(pkg => (
                <div key={pkg.id} className="p-3.5 rounded-2xl border border-gray-200 bg-white flex items-center justify-between">
                  <div className="flex-1 pr-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-gray-900">{pkg.name}</span>
                      <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">{pkg.size}</span>
                    </div>
                    <p className="text-[11px] text-gray-600 mt-1">{pkg.description}</p>
                    {pkg.status === "downloading" && (
                      <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-[#E31B23] h-full transition-all duration-300" style={{ width: `${pkg.progress || 30}%` }}></div>
                      </div>
                    )}
                  </div>

                  {pkg.status === "downloaded" ? (
                    <span className="flex items-center space-x-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2.5 py-1 rounded-xl">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Ready</span>
                    </span>
                  ) : pkg.status === "downloading" ? (
                    <span className="text-xs font-bold text-[#E31B23] animate-pulse">
                      {pkg.progress}%
                    </span>
                  ) : (
                    <button
                      onClick={() => downloadOfflinePackage(pkg.id)}
                      className="px-3 py-1.5 bg-[#FFF0F1] hover:bg-[#E31B23] text-[#E31B23] hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1 shrink-0"
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
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          {step !== "personalize" ? (
            <button
              onClick={() => setStep(step === "offline" ? "permissions" : "personalize")}
              className="py-2.5 px-4 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-200 transition-colors"
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
            className="py-2.5 px-6 bg-[#E31B23] hover:bg-[#BF141B] text-white rounded-xl text-xs font-bold shadow-md flex items-center space-x-1.5 transition-all"
          >
            <span>{step === "offline" ? "Complete Setup" : "Next Step"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
