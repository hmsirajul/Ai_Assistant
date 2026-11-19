import React from "react";
import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/40 px-3 py-1.5 text-xs font-medium text-amber-800 dark:text-amber-200 backdrop-blur-md shadow-lg"
    >
      <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-300 shrink-0" />
      <span>Offline Mode · Cached workspace active</span>
    </div>
  );
};
