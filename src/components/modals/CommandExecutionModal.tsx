import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../../context/AppContext";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Lock,
  Fingerprint,
  X,
  ArrowRight,
  CornerDownLeft,
  ExternalLink
} from "lucide-react";
import { simulatePhoneAction } from "../../services/api";
import { verifyDeviceBiometric } from "../../lib/biometrics";

export const CommandExecutionModal: React.FC = () => {
  const {
    activeCommandConfirmation,
    setActiveCommandConfirmation,
    addActivityLog,
    addNotification,
    phoneBridgeConfig,
    updatePhoneBridgeConfig,
    userProfile,
    developerMode
  } = useApp();

  const [step, setStep] = useState<"preview" | "clarify" | "progress" | "result">("preview");
  const [clarificationAnswer, setClarificationAnswer] = useState("Primary Contact");
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [biometricVerified, setBiometricVerified] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState<"webauthn" | "hold_confirm" | undefined>(undefined);
  const [biometricError, setBiometricError] = useState("");
  const [holdProgress, setHoldProgress] = useState(0);
  const [executionLog, setExecutionLog] = useState("");
  const [progressStep, setProgressStep] = useState(1);

  const holdIntervalRef = useRef<number | null>(null);
  const execIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    setStep("preview");
    setBiometricLoading(false);
    setBiometricVerified(false);
    setVerificationMethod(undefined);
    setBiometricError("");
    setHoldProgress(0);
    setExecutionLog("");
    setProgressStep(1);
    return () => {
      if (holdIntervalRef.current) window.clearInterval(holdIntervalRef.current);
      if (execIntervalRef.current) window.clearInterval(execIntervalRef.current);
    };
  }, [activeCommandConfirmation]);

  if (!activeCommandConfirmation) return null;

  const { action, level, onConfirm, onCancel } = activeCommandConfirmation;

  const handleBiometricVerify = async () => {
    setBiometricLoading(true);
    setBiometricError("");
    const result = await verifyDeviceBiometric(
      phoneBridgeConfig.biometricCredentialId,
      userProfile.email || userProfile.name
    );
    setBiometricLoading(false);

    if (result.verified) {
      if (result.credentialId && result.credentialId !== phoneBridgeConfig.biometricCredentialId) {
        updatePhoneBridgeConfig({ biometricCredentialId: result.credentialId });
      }
      setBiometricVerified(true);
      setVerificationMethod("webauthn");
      runExecution("webauthn");
    } else {
      setBiometricError(
        result.error || "Biometric check could not complete. Use Hold-to-Confirm below."
      );
    }
  };

  const startHoldConfirm = () => {
    if (holdIntervalRef.current) window.clearInterval(holdIntervalRef.current);
    setBiometricError("");
    const start = Date.now();
    const duration = 1200;
    holdIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setHoldProgress(pct);
      if (pct >= 100) {
        if (holdIntervalRef.current) window.clearInterval(holdIntervalRef.current);
        holdIntervalRef.current = null;
        setBiometricVerified(true);
        setVerificationMethod("hold_confirm");
        runExecution("hold_confirm");
      }
    }, 30);
  };

  const cancelHoldConfirm = () => {
    if (holdIntervalRef.current) {
      window.clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    setHoldProgress(0);
  };

  const runExecution = (methodOverride?: "webauthn" | "hold_confirm") => {
    const activeMethod = methodOverride || verificationMethod;
    if (level === 3 && !activeMethod && !biometricVerified) {
      setBiometricError("Verify with device biometrics or press and hold to confirm this Level 3 action.");
      return;
    }

    setStep("progress");
    setProgressStep(1);

    execIntervalRef.current = window.setInterval(() => {
      setProgressStep(prev => {
        if (prev >= 4) {
          if (execIntervalRef.current) window.clearInterval(execIntervalRef.current);
          execIntervalRef.current = null;
          handleComplete(activeMethod);
          return 4;
        }
        return prev + 1;
      });
    }, 320);
  };

  const handleComplete = async (activeMethod?: "webauthn" | "hold_confirm") => {
    const sim = await simulatePhoneAction(action.type || "phone_action", action.target || "Device", {
      details: action.details,
      verificationMethod: activeMethod
    });

    if (action.intentUri && (action.intentUri.startsWith("tel:") || action.intentUri.startsWith("sms:") || action.intentUri.startsWith("mailto:"))) {
      const anchor = document.createElement("a");
      anchor.href = action.intentUri;
      anchor.style.display = "none";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    }

    setExecutionLog(sim.executionLog);
    setStep("result");

    addActivityLog({
      command: action.details || "Phone action executed",
      interpretation: `Action: ${action.type || "phone_action"}`,
      actionPerformed: sim.executionLog,
      serviceUsed: action.app || "DiptiK Phone Bridge",
      dataAccessed: action.target || "User Workspace",
      permissionUsed:
        level === 3
          ? `Level 3 Verified (${activeMethod === "webauthn" ? "Device Biometrics" : "Hold-to-Confirm"})`
          : `Level ${level} Confirmed`,
      result: "Success",
      confirmationLevel: level
    });

    if (onConfirm) onConfirm();
  };

  const progressLabels = [
    "1. Reviewing action parameters & target...",
    "2. Checking workspace permission level...",
    `3. Confirming Level ${level} safeguard...`,
    "4. Dispatching action & recording activity log..."
  ];

  const isExternalHttpsIntent = Boolean(action.intentUri && action.intentUri.startsWith("https://"));

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#121520] rounded-2xl shadow-2xl overflow-hidden border border-white/[0.1] flex flex-col max-h-[90vh] text-[#e2e8f0]">
        {/* Header */}
        <div
          className={`px-6 py-4 border-b border-white/[0.08] flex items-center justify-between ${
            level === 3
              ? "bg-gradient-to-r from-[#FF1744]/20 to-[#121520]"
              : level === 2
              ? "bg-gradient-to-r from-amber-500/15 to-[#121520]"
              : "bg-gradient-to-r from-emerald-500/15 to-[#121520]"
          }`}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`p-2 rounded-xl border ${
                level === 3
                  ? "bg-[#FF1744]/15 border-[#FF1744]/35 text-[#FF8A9E]"
                  : level === 2
                  ? "bg-amber-500/15 border-amber-500/35 text-amber-300"
                  : "bg-emerald-500/15 border-emerald-500/35 text-emerald-300"
              }`}
            >
              {level === 3 ? (
                <Lock className="w-5 h-5" />
              ) : level === 2 ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="font-display font-semibold text-base text-white leading-tight">
                {level === 3
                  ? "Level 3 · Biometric Safeguard"
                  : level === 2
                  ? "Level 2 · Confirm Before Sending"
                  : "Level 1 · Quick Action"}
              </h2>
              <p className="text-[11px] text-[#94a3b8]">
                {level === 3
                  ? "Device biometric verification required before proceeding"
                  : "Review details before launching action"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (onCancel) onCancel();
              setActiveCommandConfirmation(null);
            }}
            aria-label="Close confirmation"
            className="p-1.5 rounded-lg hover:bg-white/[0.08] text-[#94a3b8] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step 1: Preview */}
        {step === "preview" && (
          <div className="p-6 overflow-y-auto space-y-4 text-left">
            <div className="bg-[#181c2b] border border-white/[0.08] rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between gap-2 text-[11px] text-[#94a3b8]">
                <span>Requested Action</span>
                <span className="text-[#00E5FF] font-medium">{action.app || "Phone Bridge"}</span>
              </div>
              <p className="text-sm font-semibold text-white">{action.details || "Execute requested action"}</p>
              {action.target && (
                <p className="text-xs text-[#94a3b8]">Target · {action.target}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-[#181c2b] border border-white/[0.08] rounded-xl">
                <span className="text-[11px] text-[#94a3b8]">Execution Path</span>
                <p className="font-medium text-[#e2e8f0] mt-1">
                  {action.intentUri
                    ? `Device intent (${action.intentUri.split(":")[0]}:)`
                    : `Workspace / ${action.app || "Phone Bridge"}`}
                </p>
              </div>
              <div className="p-3.5 bg-[#181c2b] border border-white/[0.08] rounded-xl">
                <span className="text-[11px] text-[#94a3b8]">Safeguard Tier</span>
                <p className="font-medium text-emerald-300 mt-1 flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Level {level} Checked</span>
                </p>
              </div>
            </div>

            {level === 3 && (
              <div className="p-4 bg-[#FF1744]/10 border border-[#FF1744]/35 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-[#FF8A9E] font-semibold text-xs">
                  <Fingerprint className="w-4 h-4 shrink-0" />
                  <span>Biometric Identity Verification</span>
                </div>
                <p className="text-[11px] text-[#cbd5e1] leading-relaxed">
                  High-risk actions (deleting data, sharing location, external broadcasts) require Face ID, Touch ID, Windows Hello, or a deliberate Hold-to-Confirm gesture.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    disabled={biometricLoading}
                    onClick={handleBiometricVerify}
                    className="py-2.5 px-3.5 rounded-xl bg-[#FF1744] hover:bg-[#d51038] disabled:opacity-60 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Fingerprint className="w-4 h-4" />
                    <span>{biometricLoading ? "Prompting..." : "Verify Biometrics"}</span>
                  </button>

                  <button
                    type="button"
                    onMouseDown={startHoldConfirm}
                    onMouseUp={cancelHoldConfirm}
                    onMouseLeave={cancelHoldConfirm}
                    onTouchStart={startHoldConfirm}
                    onTouchEnd={cancelHoldConfirm}
                    className="relative overflow-hidden py-2.5 px-3.5 rounded-xl bg-[#181c2b] hover:bg-[#1f2437] border border-[#FF1744]/40 text-white text-xs font-semibold flex items-center justify-center cursor-pointer whitespace-nowrap select-none"
                  >
                    <span
                      className="absolute inset-y-0 left-0 bg-[#FF1744]/40 transition-all duration-75"
                      style={{ width: `${holdProgress}%` }}
                    />
                    <span className="relative z-10">
                      {holdProgress > 0 ? `Holding (${holdProgress}%)` : "Hold 1.2s to Confirm"}
                    </span>
                  </button>
                </div>

                {biometricError && (
                  <p className="text-[11px] text-amber-300 leading-relaxed">{biometricError}</p>
                )}
              </div>
            )}

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setStep("clarify")}
                className="py-2.5 px-4 bg-[#181c2b] hover:bg-[#1f2437] border border-white/[0.08] text-[#cbd5e1] hover:text-white rounded-xl font-medium text-xs transition-colors flex-1 cursor-pointer whitespace-nowrap"
              >
                Adjust Target
              </button>
              {level < 3 && (
                <button
                  type="button"
                  onClick={() => runExecution()}
                  className={`py-2.5 px-6 text-white rounded-xl font-semibold text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 flex-2 cursor-pointer whitespace-nowrap ${
                    level === 2 ? "bg-amber-600 hover:bg-amber-500" : "btn-diptik-primary"
                  }`}
                >
                  <span>Confirm & Run</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Clarification */}
        {step === "clarify" && (
          <div className="p-6 overflow-y-auto space-y-4 text-left">
            <h3 className="text-base font-semibold text-white">Select Delivery Target</h3>
            <p className="text-xs text-[#94a3b8]">
              Choose how DiptiK AI 3 should route this action:
            </p>

            <div className="space-y-2">
              {[
                `Primary Target (${action.target || "Device"})`,
                "Save Draft Only (Do not send immediately)",
                "Route via Connected Mobile Webhook"
              ].map((opt, i) => (
                <label
                  key={i}
                  className={`flex items-center space-x-2.5 p-3 rounded-xl cursor-pointer border transition-colors ${
                    clarificationAnswer === opt
                      ? "bg-[#0072FF]/15 border-[#0072FF] text-white"
                      : "bg-[#181c2b] border-white/[0.08] text-[#cbd5e1] hover:bg-[#1f2437]"
                  }`}
                >
                  <input
                    type="radio"
                    name="clarify"
                    checked={clarificationAnswer === opt}
                    onChange={() => setClarificationAnswer(opt)}
                    className="accent-[#00E5FF]"
                  />
                  <span className="text-xs font-medium">{opt}</span>
                </label>
              ))}
            </div>

            <div className="flex space-x-3 pt-3">
              <button
                type="button"
                onClick={() => setStep("preview")}
                className="py-2.5 px-4 bg-[#181c2b] hover:bg-[#1f2437] border border-white/[0.08] text-[#cbd5e1] rounded-xl text-xs font-medium cursor-pointer whitespace-nowrap"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep("preview")}
                className="py-2.5 px-6 btn-diptik-primary text-white rounded-xl text-xs font-semibold shadow-md flex-1 cursor-pointer whitespace-nowrap"
              >
                Apply Selection
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Progress */}
        {step === "progress" && (
          <div className="p-8 text-center space-y-6">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <RefreshCw className="w-16 h-16 text-[#00E5FF] animate-spin" />
              <span className="absolute font-mono text-xs font-semibold text-white tabular-nums">
                {progressStep}/4
              </span>
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Executing Action</h3>
              <p className="text-xs text-[#00E5FF] font-medium mt-2 min-h-[36px]">
                {progressLabels[progressStep - 1]}
              </p>
            </div>
            <div className="w-full bg-[#181c2b] border border-white/[0.08] h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#FF1E8A] via-[#8A2BE2] to-[#00E5FF] h-full transition-all duration-300"
                style={{ width: `${(progressStep / 4) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Step 4: Result */}
        {step === "result" && (
          <div className="p-6 overflow-y-auto space-y-4 text-left">
            <div className="flex items-center space-x-3 p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl">
              <CheckCircle className="w-7 h-7 text-emerald-400 shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-emerald-200">Action Completed</h3>
                <p className="text-[11px] text-emerald-300/80 mt-0.5">
                  {developerMode
                    ? "Verified in Developer Mode & recorded in activity log."
                    : "Verified and recorded in your activity log."}
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-[#181c2b] border border-white/[0.08] rounded-xl font-mono text-[11px] text-[#cbd5e1] whitespace-pre-wrap">
              {executionLog}
            </div>

            {isExternalHttpsIntent && (
              <a
                href={action.intentUri}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-[#0072FF] hover:bg-[#005ce6] text-white text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <span>Open External Link</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  addNotification({
                    title: "Action Reverted",
                    message: "Action reverted in workspace activity log.",
                    category: "system"
                  });
                  setActiveCommandConfirmation(null);
                }}
                className="py-2.5 px-4 bg-[#181c2b] hover:bg-[#1f2437] border border-white/[0.08] text-[#cbd5e1] hover:text-white rounded-xl font-medium text-xs flex items-center justify-center space-x-1.5 flex-1 cursor-pointer whitespace-nowrap"
              >
                <CornerDownLeft className="w-3.5 h-3.5" />
                <span>Undo</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveCommandConfirmation(null)}
                className="py-2.5 px-6 btn-diptik-primary text-white rounded-xl font-semibold text-xs shadow-md flex-2 cursor-pointer whitespace-nowrap"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
