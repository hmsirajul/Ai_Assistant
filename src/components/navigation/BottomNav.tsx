import React from "react";
import { useApp } from "../../context/AppContext";
import { Home, MessageSquare, Sparkles, Cpu, User, Mic } from "lucide-react";

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, openVoiceWithAgent } = useApp();

  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "chat", label: "Chat", icon: MessageSquare },
    // Center space for floating mic button
    { id: "agent", label: "Agent", icon: Sparkles },
    { id: "automations", label: "Automations", icon: Cpu },
    { id: "profile", label: "Profile", icon: User }
  ] as const;

  return (
    <nav className="sticky bottom-0 z-30 bg-white/60 backdrop-blur-xl border-t border-gray-200/40 px-3 sm:px-6 py-2 shadow-lg transition-all">
      <div className="w-full max-w-full mx-auto flex items-center justify-between relative">
        {/* Left 2 Items */}
        {navItems.slice(0, 2).map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
                isActive ? "text-[#E31B23] font-bold" : "text-gray-600 hover:text-gray-950 font-medium"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "scale-110" : ""}`} />
              <span className="text-[11px] mt-0.5">{item.label}</span>
            </button>
          );
        })}

        {/* Center Floating Voice Assistant Button (Section 3) */}
        <div className="relative -top-5 flex flex-col items-center flex-1">
          <button
            onClick={() => openVoiceWithAgent(null)}
            title="Start real-time voice conversation or phone command"
            className="w-14 h-14 rounded-full bg-[#E31B23] hover:bg-[#BF141B] text-white shadow-xl flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 cursor-pointer border-4 border-white/80"
          >
            <Mic className="w-6 h-6 animate-pulse" />
          </button>
          <span className="text-[10px] font-bold text-gray-700 mt-1">Voice</span>
        </div>

        {/* Right 3 Items */}
        {navItems.slice(2).map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
                isActive ? "text-[#E31B23] font-bold" : "text-gray-600 hover:text-gray-950 font-medium"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "scale-110" : ""}`} />
              <span className="text-[11px] mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
