import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Smartphone, Zap, Volume2, Sun, Wifi, Bluetooth, MapPin, Camera, Music, PhoneCall, MessageSquare, Calculator, Globe, Cloud, Plane, DollarSign, ShieldAlert, Check, X, ArrowRight } from "lucide-react";
import { simulatePhoneAction } from "../../services/api";

export const PhoneActionsModal: React.FC = () => {
  const { isPhoneActionsModalOpen, setIsPhoneActionsModalOpen, setActiveCommandConfirmation, addActivityLog, addNotification } = useApp();

  const [activeTab, setActiveTab] = useState<"device" | "online" | "confirm">("device");
  const [flashlightState, setFlashlightState] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(80);
  const [brightnessLevel, setBrightnessLevel] = useState(65);
  const [wifiState, setWifiState] = useState(true);
  const [bluetoothState, setBluetoothState] = useState(false);
  const [calcInput, setCalcInput] = useState("450 * 1.15");
  const [calcResult, setCalcResult] = useState("517.50");
  const [unitValue, setUnitValue] = useState("10");
  const [unitResult, setUnitResult] = useState("10 km = 6.21 miles");

  if (!isPhoneActionsModalOpen) return null;

  const handleSimulateAction = async (type: string, target: string, level: number, details: string) => {
    if (level >= 2) {
      setActiveCommandConfirmation({
        action: { type, target, app: target, details },
        level,
        onConfirm: () => {
          addNotification({ title: "Action Executed", message: `${details} completed.`, category: "system" });
        },
        onCancel: () => {}
      });
      setIsPhoneActionsModalOpen(false);
    } else {
      const sim = await simulatePhoneAction(type, target, { details });
      addActivityLog({
        command: details,
        interpretation: `System Action: ${type}`,
        actionPerformed: sim.executionLog,
        serviceUsed: "Android OS Hardware Intent",
        dataAccessed: target,
        permissionUsed: "Level 1 Safe Action",
        result: "Success",
        confirmationLevel: 1
      });
      addNotification({
        title: "Level 1 Safe Action Executed",
        message: sim.executionLog,
        category: "system"
      });
    }
  };

  const handleToggleFlashlight = () => {
    const next = !flashlightState;
    setFlashlightState(next);
    handleSimulateAction("flashlight", "Camera LED", 1, `Turn Flashlight ${next ? "ON" : "OFF"}`);
  };

  const handleToggleWifi = () => {
    const next = !wifiState;
    setWifiState(next);
    handleSimulateAction("wifi_toggle", "System Wi-Fi", 1, `Turn Wi-Fi ${next ? "ON" : "OFF"}`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-red-900 to-rose-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-white/10 text-white">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight">Supported Phone Actions (Section 12)</h2>
              <p className="text-[11px] text-red-200">Test offline device controls, online APIs & Level 1-3 confirmation safeguards</p>
            </div>
          </div>
          <button
            onClick={() => setIsPhoneActionsModalOpen(false)}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 bg-gray-50 px-6 pt-2">
          <button
            onClick={() => setActiveTab("device")}
            className={`py-2.5 px-5 font-bold text-xs border-b-2 transition-all ${
              activeTab === "device"
                ? "border-[#E31B23] text-[#E31B23] bg-white rounded-t-xl shadow-sm"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            Offline / Device Actions (23)
          </button>
          <button
            onClick={() => setActiveTab("online")}
            className={`py-2.5 px-5 font-bold text-xs border-b-2 transition-all ${
              activeTab === "online"
                ? "border-[#E31B23] text-[#E31B23] bg-white rounded-t-xl shadow-sm"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            Online Cloud Actions (18)
          </button>
          <button
            onClick={() => setActiveTab("confirm")}
            className={`py-2.5 px-5 font-bold text-xs border-b-2 transition-all flex items-center space-x-1 ${
              activeTab === "confirm"
                ? "border-[#E31B23] text-[#E31B23] bg-white rounded-t-xl shadow-sm"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Safeguarded Actions</span>
          </button>
        </div>

        {/* Tab 1: Device Actions (Section 12.1) */}
        {activeTab === "device" && (
          <div className="p-6 overflow-y-auto flex-1 space-y-5 max-h-[70vh] text-left">
            <div>
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Hardware & System Settings</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                <button
                  onClick={handleToggleFlashlight}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center ${
                    flashlightState ? "bg-amber-100 border-amber-400 text-amber-900 font-bold" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Zap className={`w-5 h-5 mb-1 ${flashlightState ? "text-amber-600 fill-amber-500" : "text-gray-400"}`} />
                  <span className="text-xs">Flashlight</span>
                  <span className="text-[10px] text-gray-400 font-mono">{flashlightState ? "ON" : "OFF"}</span>
                </button>

                <button
                  onClick={handleToggleWifi}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center ${
                    wifiState ? "bg-blue-50 border-blue-400 text-blue-900 font-bold" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Wifi className={`w-5 h-5 mb-1 ${wifiState ? "text-blue-600" : "text-gray-400"}`} />
                  <span className="text-xs">Wi-Fi</span>
                  <span className="text-[10px] text-gray-400 font-mono">{wifiState ? "Connected" : "Disabled"}</span>
                </button>

                <button
                  onClick={() => {
                    const next = !bluetoothState;
                    setBluetoothState(next);
                    handleSimulateAction("bluetooth", "Bluetooth Adapter", 1, `Turn Bluetooth ${next ? "ON" : "OFF"}`);
                  }}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center ${
                    bluetoothState ? "bg-indigo-50 border-indigo-400 text-indigo-900 font-bold" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Bluetooth className={`w-5 h-5 mb-1 ${bluetoothState ? "text-indigo-600" : "text-gray-400"}`} />
                  <span className="text-xs">Bluetooth</span>
                  <span className="text-[10px] text-gray-400 font-mono">{bluetoothState ? "Pairing" : "OFF"}</span>
                </button>

                <button
                  onClick={() => handleSimulateAction("camera_photo", "System Camera", 2, "Take a photo with camera after user confirmation")}
                  className="p-3 rounded-2xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 text-center flex flex-col items-center justify-center"
                >
                  <Camera className="w-5 h-5 mb-1 text-[#E31B23]" />
                  <span className="text-xs font-bold">Take Photo</span>
                  <span className="text-[10px] text-amber-600 font-semibold">Level 2 Confirm</span>
                </button>
              </div>
            </div>

            {/* Sliders for Volume and Brightness */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-gray-800">
                  <span className="flex items-center space-x-1.5">
                    <Volume2 className="w-4 h-4 text-[#E31B23]" />
                    <span>Media Volume</span>
                  </span>
                  <span>{volumeLevel}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volumeLevel}
                  onChange={e => setVolumeLevel(Number(e.target.value))}
                  className="w-full accent-[#E31B23]"
                />
              </div>

              <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-gray-800">
                  <span className="flex items-center space-x-1.5">
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>Screen Brightness</span>
                  </span>
                  <span>{brightnessLevel}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={brightnessLevel}
                  onChange={e => setBrightnessLevel(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>
            </div>

            {/* Device Calculator & Convert Units */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 bg-white border border-gray-200 rounded-2xl space-y-2">
                <span className="text-xs font-bold text-gray-900 flex items-center space-x-1">
                  <Calculator className="w-3.5 h-3.5 text-gray-500" />
                  <span>On-Device Calculator</span>
                </span>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={calcInput}
                    onChange={e => setCalcInput(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono"
                  />
                  <button
                    onClick={() => {
                      try {
                        const sanitized = calcInput.replace(/[^-()\d/*+.]/g, "");
                        const val = new Function(`return ${sanitized}`)();
                        setCalcResult(String(val));
                      } catch (e) {
                        setCalcResult("Error");
                      }
                    }}
                    className="px-3 py-1 bg-[#E31B23] text-white rounded-xl text-xs font-bold font-mono"
                  >
                    =
                  </button>
                </div>
                <div className="text-right font-mono text-sm font-bold text-gray-900 bg-gray-50 px-3 py-1.5 rounded-xl">
                  {calcResult}
                </div>
              </div>

              <div className="p-3.5 bg-white border border-gray-200 rounded-2xl space-y-2">
                <span className="text-xs font-bold text-gray-900 flex items-center space-x-1">
                  <Globe className="w-3.5 h-3.5 text-gray-500" />
                  <span>Offline Unit Converter</span>
                </span>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={unitValue}
                    onChange={e => setUnitValue(e.target.value)}
                    className="w-20 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono"
                  />
                  <select className="flex-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium">
                    <option>Km to Miles</option>
                    <option>Celsius to Fahrenheit</option>
                    <option>Kg to Pounds</option>
                  </select>
                  <button
                    onClick={() => {
                      const val = Number(unitValue);
                      setUnitResult(`${val} km = ${(val * 0.621371).toFixed(2)} miles`);
                    }}
                    className="px-3 py-1 bg-gray-800 text-white rounded-xl text-xs font-bold"
                  >
                    Convert
                  </button>
                </div>
                <div className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl">
                  {unitResult}
                </div>
              </div>
            </div>

            {/* Quick Action Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: "Set Alarm (7:00 AM)", target: "System Clock", level: 1, desc: "Schedules system alarm timer automatically" },
                { label: "Start 15m Timer", target: "System Clock", level: 1, desc: "Launches countdown timer in background clock" },
                { label: "Play Local Music", target: "Music Player", level: 1, desc: "Resumes local audio playback from storage" },
                { label: "Prepare Phone Call", target: "Dialer", level: 2, desc: "Opens native dialer with contact pre-filled" },
                { label: "Prepare SMS Draft", target: "Messages", level: 2, desc: "Creates draft message for user review" },
                { label: "Start Audio Recording", target: "Voice Recorder", level: 2, desc: "Initializes hardware microphone recording" }
              ].map((act, i) => (
                <div key={i} className="p-3.5 rounded-2xl border border-gray-200 bg-white hover:border-gray-300 flex flex-col justify-between space-y-2.5 shadow-xs">
                  <div>
                    {/* 1. Header in one line */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-gray-900 block truncate">{act.label}</span>
                    </div>

                    {/* 2. Level left side */}
                    <div className="mt-2 flex items-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        act.level === 2 ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      }`}>
                        Level {act.level} • {act.level === 2 ? "User Confirmation" : "Safe Execution"}
                      </span>
                    </div>

                    {/* 3. Description */}
                    <p className="text-[11px] text-gray-600 mt-2 leading-relaxed">{act.desc}</p>
                  </div>

                  {/* 4. Below keep button */}
                  <button
                    onClick={() => handleSimulateAction(act.label, act.target, act.level, act.label)}
                    className="w-full py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center"
                  >
                    Run Action (Level {act.level})
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Online Cloud Actions (Section 12.2) */}
        {activeTab === "online" && (
          <div className="p-6 overflow-y-auto flex-1 space-y-4 max-h-[70vh] text-left">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Cloud Connected Capabilities</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { title: "Search the Web", desc: "Retrieve real-time search engine results & citations", icon: Globe, level: 1 },
                { title: "Check Weather & Directions", desc: "Get live weather maps and GPS navigation routes", icon: Cloud, level: 1 },
                { title: "Read Connected Email", desc: "Summarize unread inbox threads from Google Gmail", icon: MessageSquare, level: 1 },
                { title: "Track Flights & Currency", desc: "Live flight delays, gate updates & exchange rates", icon: Plane, level: 1 },
                { title: "Send Prepared Email", desc: "Send draft message through Gmail API integration", icon: MessageSquare, level: 2 },
                { title: "Create Calendar Events", desc: "Add scheduled meetings with automated reminders", icon: Cloud, level: 2 }
              ].map((act, idx) => {
                const Icon = act.icon;
                return (
                  <div key={idx} className="p-4 rounded-2xl border border-gray-200 bg-white flex flex-col justify-between space-y-3 shadow-xs hover:border-red-300 transition-all">
                    <div>
                      {/* 1. Header in one line */}
                      <div className="flex items-center space-x-2">
                        <Icon className="w-4 h-4 text-[#E31B23] shrink-0" />
                        <span className="text-xs font-extrabold text-gray-900 block truncate">{act.title}</span>
                      </div>

                      {/* 2. Level left side */}
                      <div className="mt-2 flex items-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          act.level === 2 ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        }`}>
                          Level {act.level} • {act.level === 2 ? "Confirmation Safeguard" : "Safe Automatic Execution"}
                        </span>
                      </div>

                      {/* 3. Description */}
                      <p className="text-[11px] text-gray-600 mt-2 leading-relaxed">{act.desc}</p>
                    </div>

                    {/* 4. Below keep button */}
                    <button
                      onClick={() => handleSimulateAction(act.title, "Cloud Service", act.level, `Execute online action: ${act.title}`)}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center ${
                        act.level === 2 ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-[#FFF0F1] hover:bg-[#E31B23] text-[#E31B23] hover:text-white"
                      }`}
                    >
                      Test Action (Level {act.level})
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Actions Requiring Confirmation (Section 12.3 & 26) */}
        {activeTab === "confirm" && (
          <div className="p-6 overflow-y-auto flex-1 space-y-4 max-h-[70vh] text-left">
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 leading-relaxed">
              <strong>Level 2 & Level 3 Safeguards</strong>: Per Section 26, any action that sends communications, deletes files, modifies account credentials, or makes financial purchases requires explicit user confirmation before executing.
            </div>

            <div className="space-y-2.5">
              {[
                { title: "Sending SMS / Messages", target: "Rahim (+1 555-0192)", level: 2, desc: "Requires reviewing draft text before outbound transmission." },
                { title: "Sending Emails", target: "Executive Team", level: 2, desc: "Requires confirming subject and recipients in Gmail." },
                { title: "Making Outbound Voice Calls", target: "Rahim", level: 2, desc: "Prevents accidental pocket dials or background calling." },
                { title: "Deleting Saved Files or Calendar Events", target: "Local Knowledge / Calendar", level: 3, desc: "Requires Touch Biometric or PIN code (1234) verification." },
                { title: "Sharing Precise Location or Publishing Content", target: "Social API / GPS", level: 3, desc: "Strong privacy protection against background tracking." }
              ].map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl border border-gray-200 bg-white flex flex-col justify-between space-y-3 shadow-xs hover:border-gray-300 transition-all">
                  <div>
                    {/* 1. Header in one line */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-gray-900 block truncate">{item.title}</span>
                    </div>

                    {/* 2. Level left side */}
                    <div className="mt-2 flex items-center">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        item.level === 3 ? "bg-red-100 text-red-800 border border-red-200" : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}>
                        Level {item.level} • {item.level === 3 ? "PIN / Biometric Safeguard" : "User Confirmation Required"}
                      </span>
                    </div>

                    {/* 3. Description */}
                    <p className="text-[11px] text-gray-600 mt-2 leading-relaxed">{item.desc}</p>
                  </div>

                  {/* 4. Below keep button */}
                  <button
                    onClick={() => handleSimulateAction(item.title, item.target, item.level, `Test Level ${item.level} Safeguard: ${item.title}`)}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold text-white shadow-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                      item.level === 3 ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700"
                    }`}
                  >
                    <span>Simulate Safeguard (Level {item.level})</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
