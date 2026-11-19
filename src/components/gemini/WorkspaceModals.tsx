import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  X,
  CheckCircle2,
  Download,
  Smartphone
} from "lucide-react";
import { PWAInstallButton } from "../common/PWAInstallButton";
import { SettingsWorkspace } from "../settings/SettingsWorkspace";

interface WorkspaceModalsProps {
  showNewNotebook: boolean;
  onCloseNewNotebook: () => void;
}

export const WorkspaceModals: React.FC<WorkspaceModalsProps> = ({
  showNewNotebook,
  onCloseNewNotebook
}) => {
  const {
    isGetAppModalOpen,
    setIsGetAppModalOpen,
    isUpgradeModalOpen,
    setIsUpgradeModalOpen,
    userProfile,
    updateUserProfile,
    offlinePackages,
    downloadOfflinePackage,
    addNotebook,
    setActiveNotebookId,
    setActiveWorkspaceView,
    setIsPhoneActionsModalOpen
  } = useApp();

  const [nbTitle, setNbTitle] = useState("");
  const [nbDesc, setNbDesc] = useState("");
  const [nbTags, setNbTags] = useState("Research, Notes");

  const handleCreateNotebook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nbTitle.trim()) return;
    const created = addNotebook({
      title: nbTitle.trim(),
      description: nbDesc.trim() || "Workspace notes and AI synthesis.",
      tags: nbTags
        .split(",")
        .map(t => t.trim())
        .filter(Boolean)
    });
    setActiveNotebookId(created.id);
    setActiveWorkspaceView("notebook");
    setNbTitle("");
    setNbDesc("");
    onCloseNewNotebook();
  };

  return (
    <>
      {/* 1. New Notebook Modal */}
      {showNewNotebook && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateNotebook}
            className="w-full max-w-md bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.1] rounded-2xl p-6 space-y-4 shadow-2xl text-left"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">New notebook</h2>
              <button
                type="button"
                onClick={onCloseNewNotebook}
                className="p-1.5 rounded-lg text-slate-500 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-[#94a3b8] mb-1">Notebook title</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={nbTitle}
                  onChange={e => setNbTitle(e.target.value)}
                  placeholder="e.g. Q4 Product Strategy"
                  className="w-full bg-slate-50 dark:bg-[#181c2b] border border-slate-300 dark:border-white/[0.1] focus:border-[#0072FF] rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-[#94a3b8] mb-1">Summary / Focus</label>
                <input
                  type="text"
                  value={nbDesc}
                  onChange={e => setNbDesc(e.target.value)}
                  placeholder="Brief note about what this notebook tracks..."
                  className="w-full bg-slate-50 dark:bg-[#181c2b] border border-slate-300 dark:border-white/[0.1] focus:border-[#0072FF] rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-[#94a3b8] mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={nbTags}
                  onChange={e => setNbTags(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#181c2b] border border-slate-300 dark:border-white/[0.1] focus:border-[#0072FF] rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onCloseNewNotebook}
                className="px-4 py-2 rounded-xl text-xs text-slate-500 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#0072FF] hover:bg-[#005ce6] text-white text-xs font-medium cursor-pointer"
              >
                Create notebook
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Full Split-Layout Settings & Account Management */}
      <SettingsWorkspace />

      {/* 3. Get App & Offline Packages Modal */}
      {isGetAppModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.1] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] text-left">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-5 h-5 text-[#0072FF] dark:text-[#00E5FF]" />
                <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Get DiptiK AI 3 Mobile & Offline</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsGetAppModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto gemini-scroll space-y-4">
              <p className="text-xs text-slate-600 dark:text-[#94a3b8] leading-relaxed">
                Install offline model packages for on-device voice commands, speech transcription, and zero-connectivity assistance.
              </p>

              <div className="space-y-2.5">
                {offlinePackages.map(pkg => (
                  <div
                    key={pkg.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.08] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">{pkg.name}</span>
                        <span className="text-[11px] font-mono text-slate-400 dark:text-[#64748b]">{pkg.size}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-[#94a3b8] mt-1">{pkg.description}</p>
                    </div>
                    {pkg.status === "downloaded" ? (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Ready</span>
                      </span>
                    ) : pkg.status === "downloading" ? (
                      <span className="text-xs text-[#0072FF] dark:text-[#00E5FF] shrink-0">Downloading...</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => downloadOfflinePackage(pkg.id)}
                        className="px-3 py-1.5 rounded-lg bg-[#0072FF] hover:bg-[#005ce6] text-white text-xs font-medium flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Install</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-2 flex flex-wrap justify-between items-center gap-2 border-t border-slate-200 dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => {
                    setIsGetAppModalOpen(false);
                    setIsPhoneActionsModalOpen(true);
                  }}
                  className="text-xs text-[#0072FF] dark:text-[#00E5FF] hover:underline cursor-pointer"
                >
                  Open Phone Actions & Mobile Bridge
                </button>
                <div className="flex items-center gap-2">
                  <PWAInstallButton compact />
                  <button
                    type="button"
                    onClick={() => setIsGetAppModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-xs text-slate-800 dark:text-white cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Upgrade Plan Modal */}
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-950/50 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.1] rounded-2xl overflow-hidden shadow-2xl text-left">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-white/[0.08] flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">DiptiK AI 3 Workspace Plans</h2>
                <p className="text-xs text-slate-500 dark:text-[#94a3b8]">Current tier: {userProfile.plan}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsUpgradeModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(
                [
                  {
                    id: "Pro AI Agent" as const,
                    audience: "For individual productivity",
                    price: "$20 / month",
                    features: [
                      "DiptiK AI 3 & deep reasoning",
                      "Real-time 16kHz Live Voice sessions",
                      "Unlimited Notebooks & scheduled rules"
                    ]
                  },
                  {
                    id: "Enterprise" as const,
                    audience: "For scaling operations",
                    price: "$45 / month",
                    features: [
                      "Priority low-latency multimodal API",
                      "Cloud Firestore sync & custom agents",
                      "Full audit trail & Level 3 safeguards"
                    ]
                  }
                ] as const
              ).map(plan => {
                const isCurrent = userProfile.plan === plan.id;
                return (
                  <div
                    key={plan.id}
                    className={`p-5 rounded-2xl border space-y-4 ${
                      isCurrent
                        ? "bg-gradient-to-br from-[#FF1E8A]/8 via-[#8A2BE2]/10 to-[#0072FF]/15 border-[#0072FF]"
                        : "bg-slate-50 dark:bg-[#181c2b] border-slate-200 dark:border-white/[0.08]"
                    }`}
                  >
                    <div>
                      <p className="text-xs text-[#0072FF] dark:text-[#00E5FF] font-medium">{plan.audience}</p>
                      <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white mt-0.5">{plan.id}</h3>
                      <p className="text-lg font-semibold text-slate-900 dark:text-white mt-1 tabular-nums">{plan.price}</p>
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-600 dark:text-[#cbd5e1]">
                      {plan.features.map((f, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#0072FF] dark:text-[#00E5FF] shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => {
                        updateUserProfile({ plan: plan.id });
                        setIsUpgradeModalOpen(false);
                      }}
                      className={`w-full py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                        isCurrent
                          ? "bg-slate-200 dark:bg-white/[0.1] text-slate-800 dark:text-white"
                          : "btn-diptik-primary text-white"
                      }`}
                    >
                      {isCurrent ? "Active Plan" : `Switch to ${plan.id}`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
