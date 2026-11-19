import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { ShieldAlert, ShieldCheck, AlertTriangle, CheckCircle, RefreshCw, Lock, Smartphone, Play, X, ArrowRight, CornerDownLeft } from "lucide-react";
import { simulatePhoneAction } from "../../services/api";

export const CommandExecutionModal: React.FC = () => {
  const {
    activeCommandConfirmation,
    setActiveCommandConfirmation,
    addActivityLog,
    addNotification,
    userProfile
  } = useApp();

  const [step, setStep] = useState<"preview" | "clarify" | "progress" | "result">("preview");
  const [clarificationAnswer, setClarificationAnswer] = useState("Rahim (Primary Mobile +1 555-0192)");
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [executionLog, setExecutionLog] = useState("");
  const [progressStep, setProgressStep] = useState(1);

  if (!activeCommandConfirmation) return null;

  const { action, level, onConfirm, onCancel } = activeCommandConfirmation;

  const handleStartExecution = () => {
    if (level === 3 && pinInput !== "1234" && pinInput !== "0000") {
      setPinError("Invalid PIN code. Please enter 1234 or 0000 for verification.");
      return;
    }

    setStep("progress");
    setProgressStep(1);

    // Simulate 6-step progress (Section 11.3)
    const interval = setInterval(() => {
      setProgressStep(prev => {
        if (prev >= 6) {
          clearInterval(interval);
          handleComplete();
          return 6;
        }
        return prev + 1;
      });
    }, 450);
  };

  const handleComplete = async () => {
    const sim = await simulatePhoneAction(action.type || "phone_action", action.target || "System", action);
    setExecutionLog(sim.executionLog);
    setStep("result");
    addActivityLog({
      command: action.details || "Command executed",
      interpretation: `AI interpretation of ${action.type || "phone action"}`,
      actionPerformed: sim.executionLog,
      serviceUsed: sim.actionType || "Android System Intent",
      dataAccessed: action.target || "Local Memory",
      permissionUsed: `Level ${level} Safeguard Verified`,
      result: "Success",
      confirmationLevel: level
    });
    if (onConfirm) onConfirm();
  };

  const progressLabels = [
    "1. Understanding request & analyzing intent...",
    "2. Checking user permissions & safety limits...",
    "3. Preparing action in system sandbox...",
    "4. Verifying Level " + level + " confirmation safeguard...",
    "5. Executing native system intent / API call...",
    "6. Verifying result & writing audit log..."
  ];

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className={`p-5 text-white flex items-center justify-between ${
          level === 3 ? "bg-red-800" : level === 2 ? "bg-amber-700" : "bg-emerald-700"
        }`}>
          <div className="flex items-center space-x-2.5">
            {level === 3 ? <Lock className="w-6 h-6" /> : level === 2 ? <AlertTriangle className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
            <div>
              <h2 className="font-bold text-base leading-tight">
                {level === 3 ? "Level 3: Strong Safeguard Required" : level === 2 ? "Level 2: User Confirmation Required" : "Level 1: Safe Action Execution"}
              </h2>
              <p className="text-[11px] text-white/80">
                {level === 3 ? "Biometric or PIN verification needed before proceeding" : "Please review the AI action preview below"}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (onCancel) onCancel();
              setActiveCommandConfirmation(null);
            }}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Command Preview Screen (Section 11.1) */}
        {step === "preview" && (
          <div className="p-6 overflow-y-auto space-y-4 text-left">
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-2.5">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Original Command</span>
                <span className="text-[10px] font-semibold bg-[#FFF0F1] text-[#E31B23] px-2 py-0.5 rounded-full">
                  {action.app || "System Service"}
                </span>
              </div>
              <p className="text-sm font-bold text-gray-900">{action.details || "Execute requested phone action"}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white border border-gray-200 rounded-xl">
                <span className="text-[10px] font-bold text-gray-500 uppercase">AI Interpretation</span>
                <p className="font-medium text-gray-800 mt-1">Open {action.app || "Dialer/App"} with target parameters loaded.</p>
              </div>
              <div className="p-3 bg-white border border-gray-200 rounded-xl">
                <span className="text-[10px] font-bold text-gray-500 uppercase">Required Permission</span>
                <p className="font-medium text-emerald-700 mt-1 flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified & Approved</span>
                </p>
              </div>
            </div>

            {/* If Level 3, require PIN input (Section 26) */}
            {level === 3 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl space-y-2">
                <div className="flex items-center space-x-1.5 text-red-800 font-bold text-xs">
                  <Lock className="w-4 h-4" />
                  <span>Enter Security PIN or Touch Biometric</span>
                </div>
                <p className="text-[11px] text-red-600">
                  This action modifies sensitive account data or deletes files. Verify identity:
                </p>
                <input
                  type="password"
                  value={pinInput}
                  onChange={e => {
                    setPinInput(e.target.value);
                    setPinError("");
                  }}
                  placeholder="Enter PIN (e.g. 1234)"
                  className="w-full px-3 py-2 bg-white border border-red-300 rounded-xl text-center text-sm font-mono tracking-widest font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                {pinError && <p className="text-[10px] text-red-600 font-bold">{pinError}</p>}
              </div>
            )}

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setStep("clarify")}
                className="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition-colors flex-1"
              >
                Need Clarification?
              </button>
              <button
                type="button"
                onClick={handleStartExecution}
                className={`py-3 px-6 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 flex-2 cursor-pointer ${
                  level === 3 ? "bg-red-600 hover:bg-red-700" : level === 2 ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                <span>Confirm & Execute Action</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Clarification Screen (Section 11.2) */}
        {step === "clarify" && (
          <div className="p-6 overflow-y-auto space-y-4 text-left">
            <h3 className="text-base font-bold text-gray-900">Clarify Incomplete Command</h3>
            <p className="text-xs text-gray-600">
              DiptiK AI found multiple possible matches or options for your command. Please specify:
            </p>

            <div className="space-y-2">
              {[
                "Rahim (Primary Mobile +1 555-0192)",
                "Rahim (Work WhatsApp +1 555-8831)",
                "Create Draft Only (Do not send immediately)"
              ].map((opt, i) => (
                <label key={i} className="flex items-center space-x-2.5 p-3 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100">
                  <input
                    type="radio"
                    name="clarify"
                    checked={clarificationAnswer === opt}
                    onChange={() => setClarificationAnswer(opt)}
                    className="text-[#E31B23]"
                  />
                  <span className="text-xs font-medium text-gray-900">{opt}</span>
                </label>
              ))}
            </div>

            <div className="flex space-x-3 pt-3">
              <button
                onClick={() => setStep("preview")}
                className="py-2.5 px-4 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold"
              >
                Back
              </button>
              <button
                onClick={() => setStep("preview")}
                className="py-2.5 px-6 bg-[#E31B23] text-white rounded-xl text-xs font-bold shadow-md flex-1"
              >
                Apply Selection
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Execution Progress (Section 11.3) */}
        {step === "progress" && (
          <div className="p-8 text-center space-y-6">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <RefreshCw className="w-16 h-16 text-[#E31B23] animate-spin" />
              <span className="absolute font-mono text-xs font-bold text-gray-800">{progressStep}/6</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Executing Command Safe Step</h3>
              <p className="text-xs text-[#E31B23] font-semibold mt-2 min-h-[36px]">
                {progressLabels[progressStep - 1]}
              </p>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#E31B23] h-full transition-all duration-300"
                style={{ width: `${(progressStep / 6) * 100}%` }}
              ></div>
            </div>
            <button
              onClick={() => {
                setActiveCommandConfirmation(null);
                addNotification({ title: "Command Cancelled", message: "Execution was paused by user.", category: "system" });
              }}
              className="text-xs text-gray-500 hover:text-red-600 font-semibold"
            >
              Cancel Execution
            </button>
          </div>
        )}

        {/* Step 4: Execution Result (Section 11.4) */}
        {step === "result" && (
          <div className="p-6 overflow-y-auto space-y-4 text-left">
            <div className="flex items-center space-x-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <CheckCircle className="w-8 h-8 text-emerald-600 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-emerald-900">Action Completed Successfully</h3>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Verified by Android Native Intent simulator & logged to audit trail.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl font-mono text-[11px] text-gray-700 whitespace-pre-wrap">
              {executionLog}
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => {
                  addNotification({
                    title: "Action Undone",
                    message: "System state restored and logged to audit trail.",
                    category: "system"
                  });
                  setActiveCommandConfirmation(null);
                }}
                className="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs flex items-center justify-center space-x-1 flex-1 cursor-pointer"
              >
                <CornerDownLeft className="w-3.5 h-3.5" />
                <span>Undo Action</span>
              </button>
              <button
                onClick={() => setActiveCommandConfirmation(null)}
                className="py-3 px-6 bg-[#E31B23] hover:bg-[#BF141B] text-white rounded-xl font-bold text-xs shadow-md flex-2"
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
