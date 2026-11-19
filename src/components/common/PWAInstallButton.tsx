import React, { useState } from "react";
import { Download, Smartphone, X } from "lucide-react";
import { usePWAInstall } from "../../hooks/usePWAInstall";

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className={`btn-diptik-primary rounded-xl font-medium flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
          compact ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-xs"
        }`}
      >
        <Download className="w-3.5 h-3.5" strokeWidth={1.75} />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#181c2b] hover:bg-slate-100 dark:hover:bg-[#1f2437] border border-slate-200 dark:border-white/[0.1] text-xs font-medium text-slate-900 dark:text-white flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#0072FF] dark:text-[#00E5FF]" strokeWidth={1.75} />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 bg-slate-950/50 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.1] rounded-2xl p-5 shadow-2xl text-left space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">Install on iPhone or iPad</h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-slate-500 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ol className="space-y-2 text-xs text-slate-600 dark:text-[#cbd5e1] leading-relaxed list-decimal list-inside">
                <li>
                  Tap the <strong className="text-slate-900 dark:text-white">Share</strong> icon in Safari&apos;s navigation bar.
                </li>
                <li>
                  Scroll down and select <strong className="text-slate-900 dark:text-white">Add to Home Screen</strong>.
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2 rounded-xl bg-slate-100 dark:bg-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-xs font-medium text-slate-900 dark:text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
