import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  Cpu,
  Plus,
  Play,
  Pause,
  Clock,
  MapPin,
  Smartphone,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  X,
  Zap
} from "lucide-react";
import { runAutomationTest } from "../../services/api";

export const AutomationsScreen: React.FC = () => {
  const {
    automations,
    toggleAutomationStatus,
    addAutomation,
    deleteAutomation,
    addActivityLog,
    addNotification
  } = useApp();

  const [activeTab, setActiveTab] = useState<"list" | "create" | "history">("list");
  const [selectedAuto, setSelectedAuto] = useState<any>(null);
  const [isTestingId, setIsTestingId] = useState<string | null>(null);

  // Create Form State
  const [autoName, setAutoName] = useState("");
  const [triggerType, setTriggerType] = useState("Time");
  const [triggerVal, setTriggerVal] = useState("7:00 AM Every Weekday");
  const [conditionVal, setConditionVal] = useState("Only if Battery > 20%");
  const [actionVal, setActionVal] = useState("Read calendar, summarize overnight news & turn OFF Do Not Disturb");
  const [autoLevel, setAutoLevel] = useState<number>(1);

  const activeCount = automations.filter(a => a.status === "active").length;

  const handleCreateAutomation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!autoName.trim()) return;
    addAutomation({
      name: autoName,
      trigger: `${triggerType}: ${triggerVal}`,
      action: actionVal,
      status: "active",
      nextRun: "Tomorrow at 7:00 AM",
      lastRun: "Never",
      confirmationLevel: autoLevel as any
    });
    setAutoName("");
    setActiveTab("list");
    addNotification({ title: "Automation Created", message: `"${autoName}" scheduled successfully.`, category: "system" });
  };

  const handleTestRun = async (auto: any) => {
    setIsTestingId(auto.id);
    const res = await runAutomationTest(auto.name, auto.trigger, auto.action);
    setTimeout(() => {
      setIsTestingId(null);
      addActivityLog({
        command: `Test Automation: "${auto.name}"`,
        interpretation: `Triggered by ${auto.trigger}`,
        actionPerformed: res.result,
        serviceUsed: "DiptiK Automation Engine",
        dataAccessed: "System Sensors & Calendar",
        permissionUsed: `Level ${auto.confirmationLevel} Safeguard`,
        result: "Success",
        confirmationLevel: auto.confirmationLevel
      });
      addNotification({
        title: `Automation Executed: ${auto.name}`,
        message: res.result,
        category: "automation"
      });
    }, 1200);
  };

  const triggerIcons: Record<string, any> = {
    Time: Clock,
    Location: MapPin,
    "App event": MessageSquare,
    Message: MessageSquare,
    "Device state": Smartphone
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-gray-900 via-teal-950 to-gray-900 text-white p-5 md:p-6 rounded-3xl shadow-md">
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse shrink-0" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300 truncate">Automations (Section 14)</span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-white mt-1 truncate">
            {activeTab === "list" && `My Automations (${activeCount} Active)`}
            {activeTab === "create" && "Create New Automation"}
            {activeTab === "history" && "Execution History Logs"}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 lg:pt-0 border-t border-white/10 lg:border-t-0">
          {activeTab !== "list" && (
            <button
              onClick={() => setActiveTab("list")}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shadow-sm"
            >
              Back to List
            </button>
          )}
          {activeTab === "list" && (
            <>
              <button
                onClick={() => setActiveTab("history")}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shadow-sm"
              >
                History
              </button>
              <button
                onClick={() => setActiveTab("create")}
                className="px-4 py-2.5 bg-[#E31B23] hover:bg-[#BF141B] text-white rounded-xl text-xs font-bold shadow-md flex items-center space-x-1.5 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>New Automation</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* VIEW 1: Automations List (Section 14.1) */}
      {activeTab === "list" && (
        <div className="space-y-4 text-left">
          
          {/* Quick Stats banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-2xs">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Total Rules</span>
              <p className="text-xl font-extrabold text-gray-900 mt-1">{automations.length}</p>
            </div>
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl shadow-2xs">
              <span className="text-[10px] font-bold text-emerald-700 uppercase">Active Running</span>
              <p className="text-xl font-extrabold text-emerald-900 mt-1">{activeCount}</p>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl shadow-2xs">
              <span className="text-[10px] font-bold text-amber-700 uppercase">Paused Rules</span>
              <p className="text-xl font-extrabold text-amber-900 mt-1">{automations.length - activeCount}</p>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl shadow-2xs">
              <span className="text-[10px] font-bold text-blue-700 uppercase">Triggers Available</span>
              <p className="text-xl font-extrabold text-blue-900 mt-1">5 OS Types</p>
            </div>
          </div>

          {/* Cards List */}
          <div className="space-y-3">
            {automations.map(auto => {
              const IconComp = triggerIcons[auto.trigger.split(":")[0]] || Zap;
              const isActive = auto.status === "active";
              return (
                <div
                  key={auto.id}
                  className={`p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-4 ${
                    isActive ? "bg-white border-gray-200 shadow-sm hover:border-teal-400" : "bg-gray-50/70 border-gray-200 opacity-75"
                  }`}
                >
                  <div className="flex items-start space-x-3.5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-bold ${
                      isActive ? "bg-teal-50 text-teal-700" : "bg-gray-200 text-gray-500"
                    }`}>
                      <IconComp className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* 1. Header in one line */}
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-extrabold text-gray-900 block truncate">{auto.name}</h3>
                      </div>

                      {/* 2. Level left side */}
                      <div className="mt-2 flex items-center">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          auto.confirmationLevel === 3 ? "bg-red-100 text-red-800 border border-red-200" : auto.confirmationLevel === 2 ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        }`}>
                          Level {auto.confirmationLevel} • {auto.confirmationLevel === 3 ? "Strong PIN Safeguard" : auto.confirmationLevel === 2 ? "Confirmation Required" : "Safe Auto Execution"}
                        </span>
                      </div>

                      {/* 3. Description */}
                      <div className="mt-2.5 space-y-1">
                        <p className="text-xs text-teal-700 font-semibold">
                          <strong>Trigger:</strong> {auto.trigger}
                        </p>
                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                          <strong>Action:</strong> {auto.action}
                        </p>
                      </div>

                      <div className="flex items-center space-x-3 mt-2.5 text-[11px] text-gray-400">
                        <span>Next: {auto.nextRun}</span>
                        <span>•</span>
                        <span>Last run: {auto.lastRun}</span>
                      </div>
                    </div>
                  </div>

                  {/* 4. Below keep button */}
                  <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleTestRun(auto)}
                      disabled={isTestingId === auto.id}
                      title="Run test execution"
                      className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-all"
                    >
                      {isTestingId === auto.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                      <span>Test Run</span>
                    </button>

                    <button
                      onClick={() => toggleAutomationStatus(auto.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isActive ? "bg-amber-500 hover:bg-amber-600 text-white shadow-xs" : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                      }`}
                    >
                      {isActive ? "Pause Rule" : "Activate Rule"}
                    </button>

                    <button
                      onClick={() => deleteAutomation(auto.id)}
                      title="Delete rule"
                      className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-xl transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* VIEW 2: Create Automation (Section 14.2) */}
      {activeTab === "create" && (
        <form onSubmit={handleCreateAutomation} className="max-w-2xl mx-auto bg-white p-6 rounded-3xl border border-gray-100 shadow-md text-left space-y-5">
          <h3 className="text-base font-extrabold text-gray-900">Schedule New Automation Rule</h3>

          <div>
            <label className="text-xs font-bold text-gray-700 uppercase">Rule Name</label>
            <input
              type="text"
              value={autoName}
              onChange={e => setAutoName(e.target.value)}
              required
              placeholder="e.g. Evening Wind-down Protocol"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold mt-1"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase">Trigger Type</label>
              <select
                value={triggerType}
                onChange={e => setTriggerType(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium mt-1"
              >
                <option value="Time">Time (Scheduled clock time)</option>
                <option value="Location">Location (GPS Geofence / Arrive / Leave)</option>
                <option value="App event">App Event (Notification received / email)</option>
                <option value="Device state">Device State (Battery / Wi-Fi / Bluetooth)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase">Trigger Condition / Time</label>
              <input
                type="text"
                value={triggerVal}
                onChange={e => setTriggerVal(e.target.value)}
                placeholder="e.g. 10:00 PM Daily"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs mt-1"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 uppercase">Additional Conditions (Optional)</label>
            <input
              type="text"
              value={conditionVal}
              onChange={e => setConditionVal(e.target.value)}
              placeholder="e.g. Only on weekends or when connected to Home Wi-Fi"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 uppercase">Automated Actions to Perform</label>
            <textarea
              value={actionVal}
              onChange={e => setActionVal(e.target.value)}
              rows={3}
              placeholder="e.g. Set phone to Do Not Disturb, set alarm for 7 AM, and draft morning task note..."
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 uppercase block mb-1">Safety Confirmation Level (Section 26)</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { lvl: 1, label: "Level 1: Safe", desc: "Executes automatically in background" },
                { lvl: 2, label: "Level 2: Confirm", desc: "Requires user tap before running" },
                { lvl: 3, label: "Level 3: Strong", desc: "Requires PIN code verification" }
              ].map(item => (
                <button
                  key={item.lvl}
                  type="button"
                  onClick={() => setAutoLevel(item.lvl)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    autoLevel === item.lvl
                      ? "bg-teal-50 border-teal-600 text-teal-900 font-bold ring-1 ring-teal-600"
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 text-xs"
                  }`}
                >
                  <span className="text-xs block font-bold">{item.label}</span>
                  <span className="text-[9px] text-gray-400 mt-0.5 block">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab("list")}
              className="py-2.5 px-5 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2.5 px-6 bg-[#E31B23] text-white rounded-xl text-xs font-bold shadow-md"
            >
              Save Automation Rule
            </button>
          </div>
        </form>
      )}

      {/* VIEW 3: History Logs (Section 14.3) */}
      {activeTab === "history" && (
        <div className="max-w-3xl mx-auto bg-white p-6 rounded-3xl border border-gray-100 shadow-md text-left space-y-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Recent Automation Trigger Events</h3>
          
          <div className="space-y-3">
            {[
              { rule: "Morning Briefing & Calendar Read", time: "Today, 7:00 AM", status: "Success", details: "Read 3 calendar meetings and generated executive note." },
              { rule: "Commute Traffic Check", time: "Yesterday, 5:30 PM", status: "Success", details: "GPS Geofence triggered at Office exit. Checked route via Maps." },
              { rule: "Bedtime Wind-down Protocol", time: "Yesterday, 10:30 PM", status: "Success", details: "Set screen to Grayscale, media volume to 10%, enabled DND." }
            ].map((log, idx) => (
              <div key={idx} className="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-gray-900">{log.rule}</span>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full">
                      {log.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{log.details}</p>
                </div>
                <span className="text-[10px] text-gray-400 font-mono shrink-0">{log.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
