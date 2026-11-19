import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import {
  Smartphone,
  Globe,
  Cloud,
  MessageSquare,
  Mail,
  PhoneCall,
  Calendar,
  ShieldAlert,
  Fingerprint,
  BellRing,
  Send,
  ChevronDown,
  ChevronUp,
  Calculator,
  Sparkles,
  Wifi,
  CheckCircle2,
  X,
  ExternalLink,
  Beaker,
  Trash2,
  MapPin
} from "lucide-react";
import { generateDailyBriefing, dispatchBriefingToPhone, simulatePhoneAction } from "../../services/api";
import { checkBiometricSupport, enrollDeviceBiometric } from "../../lib/biometrics";
import { PWAInstallButton } from "../common/PWAInstallButton";
import { PhonePushChannelType } from "../../types";

export const PhoneActionsModal: React.FC = () => {
  const {
    isPhoneActionsModalOpen,
    setIsPhoneActionsModalOpen,
    setActiveCommandConfirmation,
    addActivityLog,
    addNotification,
    addTask,
    sendMessage,
    setActiveWorkspaceView,
    tasks,
    notes,
    userProfile,
    isOfflineMode,
    developerMode,
    setIsErrorTesterModalOpen,
    phoneBridgeConfig,
    updatePhoneBridgeConfig
  } = useApp();

  const [activeTab, setActiveTab] = useState<"daily" | "safeguards" | "connect">("daily");
  const [showMoreActions, setShowMoreActions] = useState(false);

  // Interactive Drafts (Consolidated single SMS & Email actions)
  const [smsPhone, setSmsPhone] = useState("+1 555-0192");
  const [smsBody, setSmsBody] = useState("Running 10 minutes behind—see you shortly.");
  const [emailTo, setEmailTo] = useState("team@example.com");
  const [emailSubject, setEmailSubject] = useState("Daily Status Update");
  const [emailBody, setEmailBody] = useState("Sharing today's top priorities and schedule summary.");
  const [dialTarget, setDialTarget] = useState("+1 555-0192");
  const [calendarTitle, setCalendarTitle] = useState("Project Review Sync");
  const [calendarTime, setCalendarTime] = useState("Tomorrow · 10:00 AM");
  const [weatherLocation, setWeatherLocation] = useState(phoneBridgeConfig.city || "Dhaka");
  const [webSearchQuery, setWebSearchQuery] = useState("Today's top technology headlines");

  // Secondary "More Actions" state
  const [calcInput, setCalcInput] = useState("450 * 1.15");
  const [calcResult, setCalcResult] = useState("517.50");
  const [unitValue, setUnitValue] = useState("10");
  const [unitType, setUnitType] = useState<"km_mi" | "c_f" | "kg_lb">("km_mi");
  const [unitResult, setUnitResult] = useState("10 km = 6.21 miles");

  // Cloud Briefing & Phone Push state
  const [briefingText, setBriefingText] = useState("");
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [dispatchLoading, setDispatchLoading] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [notifPermission, setNotifPermission] = useState<string>(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );

  // Biometric support state
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [enrollingBiometric, setEnrollingBiometric] = useState(false);

  useEffect(() => {
    checkBiometricSupport().then(status => {
      setBiometricAvailable(status.platformAuthenticatorAvailable);
    });
    if (typeof Notification !== "undefined") {
      setNotifPermission(Notification.permission);
    }
  }, [isPhoneActionsModalOpen]);

  if (!isPhoneActionsModalOpen) return null;

  const triggerConfirmation = (params: {
    type: string;
    target: string;
    app: string;
    level: number;
    details: string;
    intentUri?: string;
    onDone?: () => void;
  }) => {
    setActiveCommandConfirmation({
      action: {
        type: params.type,
        target: params.target,
        app: params.app,
        details: params.details,
        intentUri: params.intentUri
      },
      level: params.level,
      onConfirm: () => {
        params.onDone?.();
        addNotification({
          title: "Action Completed",
          message: params.details,
          category: "system"
        });
      },
      onCancel: () => {}
    });
    setIsPhoneActionsModalOpen(false);
  };

  const runDirectChatIntent = async (prompt: string, mode: "Ask" | "Act" | "Research") => {
    setIsPhoneActionsModalOpen(false);
    setActiveWorkspaceView("chat");
    await sendMessage(prompt, mode, undefined, { webAccess: !isOfflineMode, newConversation: true });
  };

  const handleGenerateBriefing = async () => {
    setBriefingLoading(true);
    setDispatchStatus(null);
    try {
      const res = await generateDailyBriefing({
        city: weatherLocation || phoneBridgeConfig.city,
        tasks,
        notes,
        userProfile,
        isOffline: isOfflineMode
      });
      setBriefingText(res.briefing);
      addActivityLog({
        command: "Generate Daily Mobile Briefing",
        interpretation: `Cloud briefing for ${weatherLocation}`,
        actionPerformed: `Synthesized briefing via ${res.modelUsed}`,
        serviceUsed: "DiptiK Cloud Brain",
        dataAccessed: "Tasks · Notes · Live Weather",
        permissionUsed: "Level 1 Safe Execution",
        result: "Success",
        confirmationLevel: 1
      });
    } catch (err: any) {
      setDispatchStatus({ ok: false, msg: err?.message || "Unable to generate briefing." });
    } finally {
      setBriefingLoading(false);
    }
  };

  const handleSendBriefingToPhone = async () => {
    const content =
      briefingText.trim() ||
      `Daily Update for ${userProfile.nickname || userProfile.name}\nActive Tasks: ${tasks.filter(t => t.status !== "Completed").length}\nLocation: ${phoneBridgeConfig.city}`;

    setDispatchLoading(true);
    setDispatchStatus(null);
    try {
      if (phoneBridgeConfig.channelType === "web_push") {
        if (typeof Notification === "undefined") {
          throw new Error("Browser notifications are unavailable in this environment. Select Telegram, Discord, or Custom Webhook.");
        }
        let perm = Notification.permission;
        if (perm === "default") {
          perm = await Notification.requestPermission();
          setNotifPermission(perm);
        }
        if (perm !== "granted") {
          throw new Error("Notification permission was not granted. Enable notifications or switch to a webhook channel.");
        }
        new Notification("DiptiK AI 3 · Daily Briefing", {
          body: content.replace(/[#*`]/g, "").slice(0, 220),
          icon: "/pwa-192x192.png"
        });
      }

      const res = await dispatchBriefingToPhone({
        channelType: phoneBridgeConfig.channelType,
        webhookUrl: phoneBridgeConfig.webhookUrl,
        telegramBotToken: phoneBridgeConfig.telegramBotToken,
        telegramChatId: phoneBridgeConfig.telegramChatId,
        title: "DiptiK AI 3 · Daily Briefing",
        message: content
      });

      updatePhoneBridgeConfig({ lastBriefingSentAt: new Date().toLocaleTimeString() });
      setDispatchStatus({
        ok: true,
        msg: `Delivered to ${res.channel} at ${new Date(res.timestamp).toLocaleTimeString()}.`
      });
      addNotification({
        title: "Briefing Dispatched",
        message: `Sent daily briefing via ${res.channel}.`,
        category: "system"
      });
    } catch (err: any) {
      setDispatchStatus({ ok: false, msg: err?.message || "Dispatch failed." });
    } finally {
      setDispatchLoading(false);
    }
  };

  const handleEnableBrowserNotifications = async () => {
    if (typeof Notification === "undefined") {
      setDispatchStatus({ ok: false, msg: "Web Notifications are not supported in this browser." });
      return;
    }
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
    if (perm === "granted") {
      new Notification("DiptiK AI 3 Connected", {
        body: "Daily briefings and Level 2/3 action alerts are active on this device.",
        icon: "/pwa-192x192.png"
      });
      setDispatchStatus({ ok: true, msg: "Browser notifications enabled." });
    } else {
      setDispatchStatus({ ok: false, msg: "Permission denied. You can still connect Telegram, Discord, or a Webhook." });
    }
  };

  const handleEnrollBiometric = async () => {
    setEnrollingBiometric(true);
    const res = await enrollDeviceBiometric(userProfile.email || userProfile.name);
    setEnrollingBiometric(false);
    if (res.success && res.credentialId) {
      updatePhoneBridgeConfig({ biometricCredentialId: res.credentialId });
      addNotification({
        title: "Device Biometrics Enrolled",
        message: "Passkey / Face ID / Touch ID is now linked for Level 3 safeguards.",
        category: "security"
      });
    } else {
      addNotification({
        title: "Biometric Setup Notice",
        message: res.error || "Hold-to-Confirm safeguard will be used when hardware passkeys are unavailable.",
        category: "security"
      });
    }
  };

  const handleUnitConvert = () => {
    const val = Number(unitValue) || 0;
    if (unitType === "km_mi") setUnitResult(`${val} km = ${(val * 0.621371).toFixed(2)} miles`);
    else if (unitType === "c_f") setUnitResult(`${val} °C = ${((val * 9) / 5 + 32).toFixed(1)} °F`);
    else setUnitResult(`${val} kg = ${(val * 2.20462).toFixed(2)} lb`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-[#121520] rounded-2xl shadow-2xl overflow-hidden border border-white/[0.1] flex flex-col max-h-[90vh] text-[#e2e8f0]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#FF1E8A]/12 via-[#8A2BE2]/12 to-[#0072FF]/15 border-b border-white/[0.08] px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-[#0072FF]/20 border border-[#0072FF]/35 text-[#00E5FF] shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="min-w-0 text-left">
              <h2 className="font-display font-semibold text-base text-white truncate">
                Phone Actions & Mobile Bridge
              </h2>
              <p className="text-xs text-[#94a3b8] truncate">
                Daily briefings · Confirmed messages & calls · Biometric Level 3 safeguards
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {developerMode && (
              <button
                type="button"
                onClick={() => {
                  setIsPhoneActionsModalOpen(false);
                  setIsErrorTesterModalOpen(true);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-[#181c2b] hover:bg-[#1f2437] border border-white/[0.1] text-[11px] font-medium text-[#cbd5e1] flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <Beaker className="w-3.5 h-3.5 text-[#00E5FF]" />
                <span>Error Lab</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsPhoneActionsModalOpen(false)}
              aria-label="Close Phone Actions"
              className="p-1.5 rounded-lg hover:bg-white/[0.08] text-[#94a3b8] hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Focused 3-Tab Navigation */}
        <div className="flex border-b border-white/[0.08] bg-[#0f121d] px-6 pt-2 overflow-x-auto gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("daily")}
            className={`py-2.5 px-4 font-semibold text-xs border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === "daily"
                ? "border-[#00E5FF] text-white bg-[#121520] rounded-t-xl"
                : "border-transparent text-[#94a3b8] hover:text-white"
            }`}
          >
            Daily Actions (8)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("safeguards")}
            className={`py-2.5 px-4 font-semibold text-xs border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === "safeguards"
                ? "border-[#FF1E8A] text-white bg-[#121520] rounded-t-xl"
                : "border-transparent text-[#94a3b8] hover:text-white"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-[#FF1E8A]" />
            <span>Level 3 Safeguards</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("connect")}
            className={`py-2.5 px-4 font-semibold text-xs border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === "connect"
                ? "border-[#0072FF] text-white bg-[#121520] rounded-t-xl"
                : "border-transparent text-[#94a3b8] hover:text-white"
            }`}
          >
            <BellRing className="w-3.5 h-3.5 text-[#00E5FF]" />
            <span>Phone Connection</span>
          </button>
        </div>

        {/* TAB 1: FOCUSED DAILY ACTIONS */}
        {activeTab === "daily" && (
          <div className="p-6 overflow-y-auto flex-1 space-y-6 text-left gemini-scroll">
            {/* Group A: Daily Updates & Briefings (Level 1 Cloud) */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-[#cbd5e1]">Daily Updates & Briefings</h3>
                <span className="text-[11px] text-emerald-400">Level 1 · Cloud Automatic</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* 1. Daily Morning Briefing */}
                <div className="p-4 rounded-2xl border border-white/[0.08] bg-[#181c2b] flex flex-col justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-white font-semibold text-xs">
                      <Sparkles className="w-4 h-4 text-[#00E5FF] shrink-0" />
                      <span>Daily Briefing & Schedule Digest</span>
                    </div>
                    <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                      Synthesizes today&apos;s {tasks.filter(t => t.status !== "Completed").length} pending tasks, notes, and weather for push or chat delivery.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("connect");
                        handleGenerateBriefing();
                      }}
                      className="flex-1 py-2 px-3 btn-diptik-primary rounded-xl text-xs font-medium cursor-pointer whitespace-nowrap"
                    >
                      Generate Briefing
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        runDirectChatIntent(
                          `Give me my daily briefing for ${weatherLocation}, summarizing pending tasks and top priorities today.`,
                          "Ask"
                        )
                      }
                      className="py-2 px-3 bg-[#121520] hover:bg-white/[0.06] border border-white/[0.1] rounded-xl text-xs text-[#cbd5e1] cursor-pointer whitespace-nowrap"
                    >
                      In Chat
                    </button>
                  </div>
                </div>

                {/* 2. Web Search & Live Grounding */}
                <div className="p-4 rounded-2xl border border-white/[0.08] bg-[#181c2b] flex flex-col justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-white font-semibold text-xs">
                      <Globe className="w-4 h-4 text-[#00E5FF] shrink-0" />
                      <span>Live Web Search</span>
                    </div>
                    <input
                      type="text"
                      value={webSearchQuery}
                      onChange={e => setWebSearchQuery(e.target.value)}
                      placeholder="Search live web updates..."
                      className="w-full px-3 py-1.5 bg-[#121520] border border-white/[0.1] rounded-xl text-xs text-white focus:outline-none focus:border-[#0072FF]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => runDirectChatIntent(webSearchQuery.trim() || "Latest world news today", "Research")}
                    className="w-full py-2 px-3 bg-[#0072FF] hover:bg-[#005ce6] text-white rounded-xl text-xs font-medium cursor-pointer whitespace-nowrap"
                  >
                    Search with Citations
                  </button>
                </div>

                {/* 3. Weather & Directions */}
                <div className="p-4 rounded-2xl border border-white/[0.08] bg-[#181c2b] flex flex-col justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-white font-semibold text-xs">
                      <Cloud className="w-4 h-4 text-[#00E5FF] shrink-0" />
                      <span>Weather & Directions</span>
                    </div>
                    <input
                      type="text"
                      value={weatherLocation}
                      onChange={e => {
                        setWeatherLocation(e.target.value);
                        updatePhoneBridgeConfig({ city: e.target.value });
                      }}
                      placeholder="City or destination..."
                      className="w-full px-3 py-1.5 bg-[#121520] border border-white/[0.1] rounded-xl text-xs text-white focus:outline-none focus:border-[#0072FF]"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        runDirectChatIntent(`What is today's weather and commute forecast in ${weatherLocation}?`, "Ask")
                      }
                      className="flex-1 py-2 px-3 bg-[#121520] hover:bg-white/[0.06] border border-white/[0.1] text-white rounded-xl text-xs font-medium cursor-pointer whitespace-nowrap"
                    >
                      Check Forecast
                    </button>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(weatherLocation || "Dhaka")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2 px-3 bg-[#0072FF] hover:bg-[#005ce6] text-white rounded-xl text-xs font-medium flex items-center gap-1 whitespace-nowrap"
                    >
                      <span>Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* 4. Unread Email & Calendar Summary */}
                <div className="p-4 rounded-2xl border border-white/[0.08] bg-[#181c2b] flex flex-col justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-white font-semibold text-xs">
                      <Mail className="w-4 h-4 text-[#FF1E8A] shrink-0" />
                      <span>Unread Email & Reminders</span>
                    </div>
                    <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                      Summarize priority messages and review upcoming deadlines in one view.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      runDirectChatIntent(
                        "Review my upcoming tasks and help me triage priority follow-ups and reminders for today.",
                        "Act"
                      )
                    }
                    className="w-full py-2 px-3 bg-[#121520] hover:bg-white/[0.06] border border-white/[0.1] text-white rounded-xl text-xs font-medium cursor-pointer whitespace-nowrap"
                  >
                    Triage Updates
                  </button>
                </div>
              </div>
            </section>

            {/* Group B: Consolidated Draft & Confirm Actions (Level 2) */}
            <section className="space-y-3 pt-2 border-t border-white/[0.08]">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-[#cbd5e1]">Draft & Schedule with Confirmation</h3>
                <span className="text-[11px] text-amber-300">Level 2 · Tap-to-Confirm</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* 5. Consolidated SMS Action */}
                <div className="p-4 rounded-2xl border border-white/[0.08] bg-[#181c2b] flex flex-col justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-white font-semibold text-xs">
                        <MessageSquare className="w-4 h-4 text-amber-300 shrink-0" />
                        <span>SMS / Message (Draft & Send)</span>
                      </span>
                      <span className="text-[11px] text-[#94a3b8]">Level 2</span>
                    </div>
                    <input
                      type="text"
                      value={smsPhone}
                      onChange={e => setSmsPhone(e.target.value)}
                      placeholder="Recipient number"
                      className="w-full px-3 py-1.5 bg-[#121520] border border-white/[0.1] rounded-xl text-xs text-white focus:outline-none"
                    />
                    <input
                      type="text"
                      value={smsBody}
                      onChange={e => setSmsBody(e.target.value)}
                      placeholder="Message draft..."
                      className="w-full px-3 py-1.5 bg-[#121520] border border-white/[0.1] rounded-xl text-xs text-white focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      triggerConfirmation({
                        type: "send_sms",
                        target: smsPhone || "Messages",
                        app: "Native Messages",
                        level: 2,
                        details: `Send SMS to ${smsPhone}: "${smsBody}"`,
                        intentUri: `sms:${encodeURIComponent(smsPhone)}?body=${encodeURIComponent(smsBody)}`
                      })
                    }
                    className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap"
                  >
                    Review & Open SMS
                  </button>
                </div>

                {/* 6. Consolidated Email Action */}
                <div className="p-4 rounded-2xl border border-white/[0.08] bg-[#181c2b] flex flex-col justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-white font-semibold text-xs">
                        <Mail className="w-4 h-4 text-amber-300 shrink-0" />
                        <span>Email (Draft & Send)</span>
                      </span>
                      <span className="text-[11px] text-[#94a3b8]">Level 2</span>
                    </div>
                    <input
                      type="email"
                      value={emailTo}
                      onChange={e => setEmailTo(e.target.value)}
                      placeholder="Recipient email"
                      className="w-full px-3 py-1.5 bg-[#121520] border border-white/[0.1] rounded-xl text-xs text-white focus:outline-none"
                    />
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={e => setEmailSubject(e.target.value)}
                      placeholder="Subject line..."
                      className="w-full px-3 py-1.5 bg-[#121520] border border-white/[0.1] rounded-xl text-xs text-white focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      triggerConfirmation({
                        type: "send_email",
                        target: emailTo,
                        app: "Mail Client",
                        level: 2,
                        details: `Prepare email "${emailSubject}" to ${emailTo}`,
                        intentUri: `mailto:${encodeURIComponent(emailTo)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
                      })
                    }
                    className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap"
                  >
                    Review & Compose Email
                  </button>
                </div>

                {/* 7. Voice Call Dialer */}
                <div className="p-4 rounded-2xl border border-white/[0.08] bg-[#181c2b] flex flex-col justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-white font-semibold text-xs">
                        <PhoneCall className="w-4 h-4 text-[#00E5FF] shrink-0" />
                        <span>Voice Call (Dialer Intent)</span>
                      </span>
                      <span className="text-[11px] text-[#94a3b8]">Level 2</span>
                    </div>
                    <input
                      type="tel"
                      value={dialTarget}
                      onChange={e => setDialTarget(e.target.value)}
                      placeholder="Phone number..."
                      className="w-full px-3 py-1.5 bg-[#121520] border border-white/[0.1] rounded-xl text-xs text-white focus:outline-none font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      triggerConfirmation({
                        type: "make_call",
                        target: dialTarget,
                        app: "Phone Dialer",
                        level: 2,
                        details: `Open dialer to call ${dialTarget}`,
                        intentUri: `tel:${dialTarget.replace(/\s+/g, "")}`
                      })
                    }
                    className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap"
                  >
                    Confirm & Dial
                  </button>
                </div>

                {/* 8. Calendar Event & Reminder */}
                <div className="p-4 rounded-2xl border border-white/[0.08] bg-[#181c2b] flex flex-col justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-white font-semibold text-xs">
                        <Calendar className="w-4 h-4 text-[#FF1E8A] shrink-0" />
                        <span>Calendar Event & Reminder</span>
                      </span>
                      <span className="text-[11px] text-[#94a3b8]">Level 2</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={calendarTitle}
                        onChange={e => setCalendarTitle(e.target.value)}
                        placeholder="Event title"
                        className="px-2.5 py-1.5 bg-[#121520] border border-white/[0.1] rounded-xl text-xs text-white focus:outline-none"
                      />
                      <input
                        type="text"
                        value={calendarTime}
                        onChange={e => setCalendarTime(e.target.value)}
                        placeholder="Time"
                        className="px-2.5 py-1.5 bg-[#121520] border border-white/[0.1] rounded-xl text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      triggerConfirmation({
                        type: "calendar_event",
                        target: "Scheduled Tasks",
                        app: "Calendar & Reminders",
                        level: 2,
                        details: `Schedule "${calendarTitle}" (${calendarTime})`,
                        onDone: () => {
                          addTask({
                            title: calendarTitle,
                            dueDate: "Upcoming",
                            time: calendarTime,
                            priority: "High",
                            status: "Today",
                            reminderSet: true
                          });
                        }
                      })
                    }
                    className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap"
                  >
                    Confirm & Schedule
                  </button>
                </div>
              </div>
            </section>

            {/* Collapsible "More Actions & Voice Intents" Drawer */}
            <section className="pt-2 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setShowMoreActions(prev => !prev)}
                className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-[#181c2b] hover:bg-[#1f2437] border border-white/[0.08] text-xs font-medium text-[#cbd5e1] cursor-pointer"
              >
                <span>More Actions · Quick Utilities & Voice Intents</span>
                {showMoreActions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showMoreActions && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-3.5 bg-[#181c2b] border border-white/[0.08] rounded-2xl space-y-2.5">
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Calculator className="w-3.5 h-3.5 text-[#00E5FF]" />
                      <span>Quick Calculator</span>
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={calcInput}
                        onChange={e => setCalcInput(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 bg-[#121520] border border-white/[0.1] rounded-xl text-xs font-mono text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          try {
                            const sanitized = calcInput.replace(/[^-()\d/*+.]/g, "");
                            const val = new Function(`return ${sanitized}`)();
                            setCalcResult(String(val));
                          } catch {
                            setCalcResult("Error");
                          }
                        }}
                        className="px-3 py-1 btn-diptik-primary rounded-xl text-xs font-mono font-semibold cursor-pointer"
                      >
                        =
                      </button>
                    </div>
                    <div className="text-right font-mono text-xs font-semibold text-[#00E5FF] bg-[#121520] px-3 py-1.5 rounded-xl tabular-nums">
                      {calcResult}
                    </div>
                  </div>

                  <div className="p-3.5 bg-[#181c2b] border border-white/[0.08] rounded-2xl space-y-2.5">
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-[#FF1E8A]" />
                      <span>Unit Converter</span>
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={unitValue}
                        onChange={e => setUnitValue(e.target.value)}
                        className="w-16 px-2 py-1.5 bg-[#121520] border border-white/[0.1] rounded-xl text-xs font-mono text-white"
                      />
                      <select
                        value={unitType}
                        onChange={e => setUnitType(e.target.value as any)}
                        className="flex-1 px-2 py-1 bg-[#121520] border border-white/[0.1] rounded-xl text-xs text-white"
                      >
                        <option value="km_mi">km to miles</option>
                        <option value="c_f">°C to °F</option>
                        <option value="kg_lb">kg to lb</option>
                      </select>
                      <button
                        type="button"
                        onClick={handleUnitConvert}
                        className="px-3 py-1 bg-[#0072FF] hover:bg-[#005ce6] text-white rounded-xl text-xs font-medium cursor-pointer"
                      >
                        Go
                      </button>
                    </div>
                    <div className="text-xs font-mono text-emerald-300 bg-[#121520] px-3 py-1.5 rounded-xl tabular-nums">
                      {unitResult}
                    </div>
                  </div>

                  <div className="sm:col-span-2 p-3.5 bg-[#181c2b] border border-white/[0.08] rounded-2xl flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-[#94a3b8]">Trigger secondary utilities by chat or voice:</span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "Set a 15-minute focus timer",
                        "Track USD to BDT exchange rate"
                      ].map(cmd => (
                        <button
                          key={cmd}
                          type="button"
                          onClick={() => runDirectChatIntent(cmd, "Act")}
                          className="px-3 py-1.5 rounded-lg bg-[#121520] hover:bg-white/[0.06] border border-white/[0.1] text-xs text-[#00E5FF] cursor-pointer whitespace-nowrap"
                        >
                          {cmd}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {/* TAB 2: LEVEL 3 BIOMETRIC SAFEGUARDS */}
        {activeTab === "safeguards" && (
          <div className="p-6 overflow-y-auto flex-1 space-y-5 text-left gemini-scroll">
            <div className="p-4 rounded-2xl bg-[#181c2b] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <Fingerprint className="w-4 h-4 text-[#00E5FF]" />
                  <span>Device Biometric Authenticator</span>
                </div>
                <p className="text-[11px] text-[#94a3b8]">
                  {phoneBridgeConfig.biometricCredentialId
                    ? "Device Passkey / Face ID / Touch ID enrolled for Level 3 actions."
                    : biometricAvailable
                    ? "Hardware biometric authenticator detected. Enroll once to guard destructive actions."
                    : "Hold-to-Confirm safeguard active (hardware passkey optional)."}
                </p>
              </div>
              <button
                type="button"
                disabled={enrollingBiometric}
                onClick={handleEnrollBiometric}
                className="px-3.5 py-2 rounded-xl btn-diptik-primary text-xs font-medium cursor-pointer whitespace-nowrap shrink-0"
              >
                {enrollingBiometric
                  ? "Enrolling..."
                  : phoneBridgeConfig.biometricCredentialId
                  ? "Re-enroll Biometric"
                  : "Enable Biometric Guard"}
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl border border-[#FF1744]/25 bg-[#181c2b] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-[#FF8A9E]" />
                    <span className="text-xs font-semibold text-white">
                      Delete Saved Files, Notes, or Calendar Events
                    </span>
                  </div>
                  <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                    Level 3 Safeguard · Prevents accidental permanent deletion without Face ID, Touch ID, or Hold-to-Confirm approval.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    triggerConfirmation({
                      type: "delete_data",
                      target: "Archived Notes & Completed Tasks",
                      app: "Workspace Storage",
                      level: 3,
                      details: "Delete archived temporary drafts after biometric verification"
                    })
                  }
                  className="px-4 py-2 rounded-xl bg-[#FF1744] hover:bg-[#d51038] text-white text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
                >
                  Verify & Clean Up
                </button>
              </div>

              <div className="p-4 rounded-2xl border border-[#FF1744]/25 bg-[#181c2b] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#FF8A9E]" />
                    <span className="text-xs font-semibold text-white">
                      Share Precise Location or External Broadcast
                    </span>
                  </div>
                  <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                    Level 3 Safeguard · Protects GPS coordinates and external webhook broadcasts from unauthorized triggers.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    triggerConfirmation({
                      type: "share_location",
                      target: weatherLocation || "Current Location",
                      app: "Location & Sharing",
                      level: 3,
                      details: `Share live check-in location (${weatherLocation}) with trusted contact`
                    })
                  }
                  className="px-4 py-2 rounded-xl bg-[#FF1744] hover:bg-[#d51038] text-white text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
                >
                  Verify & Share
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: THREE-PART WEB-TO-PHONE CONNECTION */}
        {activeTab === "connect" && (
          <div className="p-6 overflow-y-auto flex-1 space-y-5 text-left gemini-scroll">
            {/* Part 1: Cloud Brain & Briefing Schedule */}
            <div className="p-4 rounded-2xl bg-[#181c2b] border border-white/[0.08] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-semibold text-white">1. Cloud Brain & Daily Briefing</h3>
                  <p className="text-[11px] text-[#94a3b8] mt-0.5">
                    Synthesizes live weather, tasks, and reminders using Gemini 4 Hydrogen.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={briefingLoading}
                  onClick={handleGenerateBriefing}
                  className="px-3.5 py-2 rounded-xl btn-diptik-primary text-xs font-medium cursor-pointer whitespace-nowrap"
                >
                  {briefingLoading ? "Synthesizing..." : "Generate Now"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#94a3b8] mb-1">Briefing City</label>
                  <input
                    type="text"
                    value={phoneBridgeConfig.city}
                    onChange={e => {
                      updatePhoneBridgeConfig({ city: e.target.value });
                      setWeatherLocation(e.target.value);
                    }}
                    className="w-full px-3 py-1.5 bg-[#121520] border border-white/[0.1] rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#94a3b8] mb-1">Daily Schedule Time</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={phoneBridgeConfig.dailyBriefingTime}
                      onChange={e => updatePhoneBridgeConfig({ dailyBriefingTime: e.target.value })}
                      className="flex-1 px-3 py-1.5 bg-[#121520] border border-white/[0.1] rounded-xl text-xs font-mono text-white focus:outline-none"
                    />
                    <label className="flex items-center gap-1.5 text-xs text-[#cbd5e1] cursor-pointer whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={phoneBridgeConfig.autoBriefingEnabled}
                        onChange={e => updatePhoneBridgeConfig({ autoBriefingEnabled: e.target.checked })}
                        className="accent-[#0072FF]"
                      />
                      <span>Auto</span>
                    </label>
                  </div>
                </div>
              </div>

              {briefingText && (
                <textarea
                  rows={5}
                  value={briefingText}
                  onChange={e => setBriefingText(e.target.value)}
                  className="w-full bg-[#121520] border border-white/[0.1] rounded-xl p-3 text-xs text-[#e2e8f0] leading-relaxed focus:outline-none"
                />
              )}
            </div>

            {/* Part 2: Push Notification & Webhook Channel */}
            <div className="p-4 rounded-2xl bg-[#181c2b] border border-white/[0.08] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-semibold text-white">2. Push & Phone Update Channel</h3>
                  <p className="text-[11px] text-[#94a3b8] mt-0.5">
                    Deliver briefings via Browser/PWA Push or forward to Telegram, Discord, or an HTTPS webhook.
                  </p>
                </div>
                {phoneBridgeConfig.lastBriefingSentAt && (
                  <span className="text-[11px] text-emerald-400 tabular-nums">
                    Last sent · {phoneBridgeConfig.lastBriefingSentAt}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(
                  [
                    { id: "web_push", label: "Web Push / PWA" },
                    { id: "telegram", label: "Telegram Bot" },
                    { id: "discord", label: "Discord" },
                    { id: "custom_webhook", label: "Custom Webhook" }
                  ] as { id: PhonePushChannelType; label: string }[]
                ).map(ch => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => updatePhoneBridgeConfig({ channelType: ch.id })}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                      phoneBridgeConfig.channelType === ch.id
                        ? "bg-[#0072FF]/20 border-[#0072FF] text-white"
                        : "bg-[#121520] border-white/[0.08] text-[#94a3b8] hover:text-white"
                    }`}
                  >
                    {ch.label}
                  </button>
                ))}
              </div>

              {phoneBridgeConfig.channelType === "web_push" && (
                <div className="p-3 rounded-xl bg-[#121520] border border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-[#cbd5e1]">
                    Notification permission: <strong className="text-white">{notifPermission}</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleEnableBrowserNotifications}
                      className="px-3 py-1.5 rounded-lg bg-[#0072FF] hover:bg-[#005ce6] text-white text-xs font-medium cursor-pointer whitespace-nowrap"
                    >
                      Enable Notifications
                    </button>
                    <PWAInstallButton compact />
                  </div>
                </div>
              )}

              {phoneBridgeConfig.channelType === "telegram" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="password"
                    value={phoneBridgeConfig.telegramBotToken}
                    onChange={e => updatePhoneBridgeConfig({ telegramBotToken: e.target.value })}
                    placeholder="Telegram Bot Token"
                    className="px-3 py-2 bg-[#121520] border border-white/[0.1] rounded-xl text-xs text-white focus:outline-none"
                  />
                  <input
                    type="text"
                    value={phoneBridgeConfig.telegramChatId}
                    onChange={e => updatePhoneBridgeConfig({ telegramChatId: e.target.value })}
                    placeholder="Telegram Chat ID"
                    className="px-3 py-2 bg-[#121520] border border-white/[0.1] rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
              )}

              {(phoneBridgeConfig.channelType === "discord" ||
                phoneBridgeConfig.channelType === "custom_webhook") && (
                <input
                  type="url"
                  value={phoneBridgeConfig.webhookUrl}
                  onChange={e => updatePhoneBridgeConfig({ webhookUrl: e.target.value })}
                  placeholder="https://discord.com/api/webhooks/... or https://your-endpoint"
                  className="w-full px-3 py-2 bg-[#121520] border border-white/[0.1] rounded-xl text-xs text-white focus:outline-none"
                />
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="text-[11px] text-[#94a3b8]">
                  {dispatchStatus ? (
                    <span className={dispatchStatus.ok ? "text-emerald-400" : "text-[#FF8A9E]"}>
                      {dispatchStatus.msg}
                    </span>
                  ) : (
                    <span>Send the current briefing or test your phone channel connection.</span>
                  )}
                </div>
                <button
                  type="button"
                  disabled={dispatchLoading}
                  onClick={handleSendBriefingToPhone}
                  className="px-4 py-2 rounded-xl bg-[#0072FF] hover:bg-[#005ce6] disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{dispatchLoading ? "Sending..." : "Send Briefing to Phone"}</span>
                </button>
              </div>
            </div>

            {/* Part 3: Mobile Client / Native Bridge Architecture */}
            <div className="p-4 rounded-2xl bg-[#181c2b] border border-white/[0.08] space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-[#00E5FF]" />
                  <span>3. Mobile Client & Native Bridge</span>
                </h3>
                <PWAInstallButton compact />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-[#94a3b8]">
                <div className="p-3 rounded-xl bg-[#121520] border border-white/[0.06] space-y-1">
                  <p className="font-semibold text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Active in PWA / Browser</span>
                  </p>
                  <p>
                    tel:, sms:, mailto: intents, Google Maps links, Web Push notifications, and WebAuthn biometrics.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#121520] border border-white/[0.06] space-y-1">
                  <p className="font-semibold text-[#00E5FF]">Native Wrapper (Capacitor / Flutter)</p>
                  <p>
                    Connects via HTTPS/WebSockets for background audio capture, silent OS toggles, and native BiometricPrompt.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
