import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../../context/AppContext";
import {
  Mic,
  MicOff,
  Volume2,
  X,
  Keyboard,
  Sparkles,
  WifiOff,
  RefreshCw,
  Bot,
  PhoneOff,
  Send
} from "lucide-react";
import { DiptiKLogo } from "../common/DiptiKLogo";
import { AgentTemplate, VoicePersonaName } from "../../types";

const VOICES: VoicePersonaName[] = ["Zephyr", "Puck", "Charon", "Kore", "Fenrir"];

function floatTo16BitPcmBase64(float32Array: Float32Array): string {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64PcmToFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const view = new DataView(bytes.buffer);
  const float32 = new Float32Array(bytes.byteLength / 2);
  for (let i = 0; i < float32.length; i++) {
    float32[i] = view.getInt16(i * 2, true) / 32768.0;
  }
  return float32;
}

export const VoiceAssistantModal: React.FC = () => {
  const {
    isVoiceModalOpen,
    setIsVoiceModalOpen,
    isOfflineMode,
    liveVoiceCapable,
    userProfile,
    agentTemplates,
    voiceAgent,
    setVoiceAgent,
    sendMessage,
    addTask,
    addNote,
    addNotification,
    addActivityLog,
    setActiveCommandConfirmation
  } = useApp();

  const [connectionState, setConnectionState] = useState<
    "idle" | "connecting" | "listening" | "speaking" | "offline" | "error"
  >("idle");
  const [selectedVoice, setSelectedVoice] = useState<VoicePersonaName>(
    voiceAgent?.voiceName || userProfile.voiceName || "Zephyr"
  );
  const [userTranscript, setUserTranscript] = useState("");
  const [agentTranscript, setAgentTranscript] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [inputText, setInputText] = useState("");
  const [micLevel, setMicLevel] = useState(0);

  // Refs to avoid stale closures inside audio & websocket callbacks
  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const isMutedRef = useRef<boolean>(false);
  const sessionReadyRef = useRef<boolean>(false);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    if (voiceAgent?.voiceName) {
      setSelectedVoice(voiceAgent.voiceName);
    } else if (userProfile.voiceName) {
      setSelectedVoice(userProfile.voiceName);
    }
  }, [voiceAgent, userProfile.voiceName]);

  const stopAllPlayback = () => {
    activeSourcesRef.current.forEach(src => {
      try {
        src.stop();
      } catch {}
    });
    activeSourcesRef.current.clear();
    if (outputAudioCtxRef.current) {
      nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
    } else {
      nextStartTimeRef.current = 0;
    }
  };

  const cleanupSession = () => {
    sessionReadyRef.current = false;
    stopAllPlayback();

    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch {}
      processorRef.current.onaudioprocess = null;
      processorRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    if (inputAudioCtxRef.current) {
      try {
        inputAudioCtxRef.current.close();
      } catch {}
      inputAudioCtxRef.current = null;
    }

    if (outputAudioCtxRef.current) {
      try {
        outputAudioCtxRef.current.close();
      } catch {}
      outputAudioCtxRef.current = null;
    }

    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {}
      wsRef.current = null;
    }

    setMicLevel(0);
  };

  const playPcmChunk = (base64Audio: string) => {
    const ctx = outputAudioCtxRef.current;
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const float32 = base64PcmToFloat32(base64Audio);
    const buffer = ctx.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    const startTime = Math.max(ctx.currentTime + 0.02, nextStartTimeRef.current);
    source.start(startTime);
    nextStartTimeRef.current = startTime + buffer.duration;

    activeSourcesRef.current.add(source);
    source.onended = () => {
      activeSourcesRef.current.delete(source);
      if (activeSourcesRef.current.size === 0) {
        setConnectionState(prev => (prev === "speaking" ? "listening" : prev));
      }
    };
  };

  const handleLiveToolAction = (name: string, args: Record<string, any>) => {
    if (name === "create_task") {
      addTask({
        title: args.title || "Voice Reminder",
        time: args.time || "5:00 PM",
        priority: (args.priority as any) || "Medium",
        status: "Today",
        reminderSet: true
      });
      addNotification({
        title: "Voice Agent Added Task",
        message: `Task "${args.title}" scheduled for ${args.time || "Today"}.`,
        category: "task"
      });
    } else if (name === "save_note") {
      addNote({
        title: args.title || "Voice Note",
        content: args.content || "",
        tags: ["#voice"]
      });
      addNotification({
        title: "Voice Agent Saved Note",
        message: `Saved note "${args.title}" to AI Notes.`,
        category: "system"
      });
    } else if (name === "prepare_phone_action") {
      setActiveCommandConfirmation({
        action: {
          type: args.actionType || "phone_call",
          target: args.target || "Device",
          app: "Voice Command",
          details: args.details || "Prepared via real-time voice agent"
        },
        level: args.actionType === "alarm_reminder" || args.actionType === "flashlight" ? 1 : 2,
        onConfirm: () => {},
        onCancel: () => {}
      });
    }
    addActivityLog({
      command: `Live Voice Tool: ${name}`,
      interpretation: JSON.stringify(args),
      actionPerformed: `Executed ${name} during real-time conversation`,
      serviceUsed: "Gemini 3.8 Live API",
      dataAccessed: "Workspace Tasks / Notes",
      permissionUsed: "Microphone & Live Agent",
      result: "Success",
      confirmationLevel: 1
    });
  };

  const startLiveSession = async (targetAgent: AgentTemplate | null, voice: VoicePersonaName) => {
    cleanupSession();
    setErrorMsg("");
    setUserTranscript("");
    setAgentTranscript(
      isOfflineMode || !liveVoiceCapable
        ? "Offline mode active. Type or tap a prompt to talk with local assistant."
        : `Connecting to ${targetAgent ? targetAgent.name : "DiptiK Voice Agent"} in real time...`
    );

    if (isOfflineMode || !liveVoiceCapable) {
      setConnectionState("offline");
      return;
    }

    setConnectionState("connecting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      streamRef.current = stream;

      const inputCtx = new AudioContext({ sampleRate: 16000 });
      const outputCtx = new AudioContext({ sampleRate: 24000 });
      inputAudioCtxRef.current = inputCtx;
      outputAudioCtxRef.current = outputCtx;
      nextStartTimeRef.current = outputCtx.currentTime;

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${protocol}//${window.location.host}/api/live`);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            type: "setup",
            config: {
              nickname: userProfile.nickname || userProfile.name || "Friend",
              persona: userProfile.persona || "Default (Friendly & Helpful)",
              customInstructions: userProfile.customInstructions || "",
              agentName: targetAgent?.name || "DiptiK Voice Agent",
              agentGoal: targetAgent?.goal || "Assist the user in real-time voice conversation and task automation.",
              agentInstructions: targetAgent?.instructions || "",
              voiceName: voice,
              engine: userProfile.defaultEngine || "Gemini 4 Hydrogen (Default)"
            }
          })
        );
      };

      ws.onmessage = event => {
        const msg = JSON.parse(event.data);

        if (msg.type === "ready") {
          sessionReadyRef.current = true;
          setConnectionState("listening");
          setAgentTranscript(`Connected to ${msg.agentName} (${msg.voiceName}). Go ahead — I'm listening!`);
        } else if (msg.type === "audio" && msg.audio) {
          setConnectionState("speaking");
          playPcmChunk(msg.audio);
        } else if (msg.type === "inputTranscript" && msg.text) {
          setUserTranscript(prev => (prev ? `${prev} ${msg.text}` : msg.text).trim());
        } else if (msg.type === "outputTranscript" && msg.text) {
          setAgentTranscript(prev => {
            const cleanPrev = prev.startsWith("Connected to ") ? "" : prev;
            return `${cleanPrev}${msg.text}`;
          });
        } else if (msg.type === "interrupted") {
          stopAllPlayback();
          setConnectionState("listening");
        } else if (msg.type === "turnComplete") {
          if (activeSourcesRef.current.size === 0) {
            setConnectionState("listening");
          }
        } else if (msg.type === "toolAction") {
          handleLiveToolAction(msg.name, msg.args || {});
        } else if (msg.type === "error") {
          setErrorMsg(msg.message || "Voice connection encountered an error.");
          setConnectionState("error");
        } else if (msg.type === "closed") {
          sessionReadyRef.current = false;
        }
      };

      ws.onerror = () => {
        setErrorMsg("WebSocket connection error. Please check your microphone and network.");
        setConnectionState("error");
      };

      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = e => {
        const channelData = e.inputBuffer.getChannelData(0);

        // Compute visual mic amplitude
        let sum = 0;
        for (let i = 0; i < channelData.length; i += 8) {
          sum += Math.abs(channelData[i]);
        }
        const avg = sum / (channelData.length / 8);
        setMicLevel(isMutedRef.current ? 0 : Math.min(1, avg * 8));

        if (!isMutedRef.current && sessionReadyRef.current && ws.readyState === WebSocket.OPEN) {
          const base64 = floatTo16BitPcmBase64(channelData);
          ws.send(JSON.stringify({ type: "audio", audio: base64 }));
        }
      };

      source.connect(processor);
      processor.connect(inputCtx.destination);
    } catch (err: any) {
      console.error("Failed to start real-time voice:", err);
      setErrorMsg(
        err?.name === "NotAllowedError"
          ? "Microphone permission denied. Please allow microphone access in your browser, or use text input below."
          : err?.message || "Could not access microphone."
      );
      setConnectionState("error");
    }
  };

  useEffect(() => {
    if (isVoiceModalOpen) {
      startLiveSession(voiceAgent, selectedVoice);
    } else {
      cleanupSession();
      setConnectionState("idle");
    }
    return () => {
      cleanupSession();
    };
  }, [isVoiceModalOpen]);

  if (!isVoiceModalOpen) return null;

  const handleAgentSwitch = (agentId: string) => {
    const found = agentTemplates.find(a => a.id === agentId) || null;
    setVoiceAgent(found);
    const nextVoice = found?.voiceName || selectedVoice;
    setSelectedVoice(nextVoice);
    startLiveSession(found, nextVoice);
  };

  const handleVoiceChange = (voice: VoicePersonaName) => {
    setSelectedVoice(voice);
    startLiveSession(voiceAgent, voice);
  };

  const handleSendTextCommand = async (text: string) => {
    if (!text.trim()) return;
    setUserTranscript(text);

    if (sessionReadyRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
      setAgentTranscript("");
      wsRef.current.send(JSON.stringify({ type: "text", text }));
      return;
    }

    // Fallback via /api/chat + speechSynthesis
    setConnectionState("speaking");
    await sendMessage(text, isOfflineMode ? "Offline" : "Act");
    const reply = isOfflineMode
      ? `[Offline Mode] Processed "${text}" locally.`
      : `Processed "${text}".`;
    setAgentTranscript(reply);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(reply);
      window.speechSynthesis.speak(utterance);
    }
    setConnectionState(isOfflineMode ? "offline" : "listening");
  };

  const barHeights = [18, 32, 48, 28, 56, 44, 62, 36, 52, 26, 40, 22];

  return (
    <div className="fixed inset-0 z-50 bg-gray-950/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6 text-white animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-w-2xl mx-auto w-full">
        <div className="flex items-center space-x-2.5">
          <DiptiKLogo size="xs" showText={false} />
          <div className="text-left">
            <span className="text-xs font-extrabold uppercase tracking-wider text-white block">
              Real-Time Voice Agent
            </span>
            <span className="text-[10px] text-gray-400">
              {userProfile.nickname} • {userProfile.defaultEngine}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Select Agent to talk to */}
          <select
            value={voiceAgent?.id || ""}
            onChange={e => handleAgentSwitch(e.target.value)}
            className="bg-white/10 border border-white/20 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl focus:outline-none"
          >
            <option value="" className="text-gray-900">
              General Voice Agent
            </option>
            {agentTemplates.map(ag => (
              <option key={ag.id} value={ag.id} className="text-gray-900">
                {ag.name}
              </option>
            ))}
          </select>

          {/* Select Voice */}
          <select
            value={selectedVoice}
            onChange={e => handleVoiceChange(e.target.value as VoicePersonaName)}
            className="bg-white/10 border border-white/20 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl focus:outline-none"
          >
            {VOICES.map(v => (
              <option key={v} value={v} className="text-gray-900">
                Voice: {v}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              cleanupSession();
              setIsVoiceModalOpen(false);
            }}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Center Live Status, Waveform & Transcripts */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-xl mx-auto w-full text-center space-y-6 my-4 overflow-y-auto">
        {/* Status Badge */}
        <div className="inline-flex items-center space-x-2 bg-white/10 border border-white/15 px-4 py-1.5 rounded-full">
          {connectionState === "connecting" && <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />}
          {connectionState === "listening" && <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />}
          {connectionState === "speaking" && <Volume2 className="w-3.5 h-3.5 text-[#E31B23] animate-pulse" />}
          {connectionState === "offline" && <WifiOff className="w-3.5 h-3.5 text-amber-400" />}
          <span className="text-xs font-bold text-gray-100 capitalize">
            {connectionState === "listening"
              ? `Live • Listening (${voiceAgent ? voiceAgent.name : "DiptiK Agent"})`
              : connectionState === "speaking"
              ? `${voiceAgent ? voiceAgent.name : "Agent"} Speaking...`
              : connectionState === "connecting"
              ? "Establishing Real-Time Voice Stream..."
              : connectionState === "offline"
              ? "Offline Voice Fallback"
              : "Voice Session Issue"}
          </span>
        </div>

        {/* Dynamic Reactive Waveform */}
        <div className="flex items-center justify-center space-x-1.5 h-20 w-full px-6">
          {barHeights.map((base, idx) => {
            const activeScale =
              connectionState === "speaking"
                ? 0.9 + ((idx % 3) * 0.25)
                : connectionState === "listening"
                ? 0.35 + micLevel * 0.95
                : 0.2;
            const h = Math.max(8, Math.round(base * activeScale));
            return (
              <div
                key={idx}
                className={`w-2 rounded-full transition-all duration-100 ${
                  connectionState === "speaking"
                    ? "bg-emerald-400"
                    : connectionState === "listening"
                    ? "bg-[#E31B23]"
                    : "bg-gray-600"
                }`}
                style={{ height: `${h}px` }}
              />
            );
          })}
        </div>

        {errorMsg && (
          <div className="w-full p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-xs text-red-200 flex items-center justify-between gap-3 text-left">
            <span>{errorMsg}</span>
            <button
              onClick={() => startLiveSession(voiceAgent, selectedVoice)}
              className="px-3 py-1.5 bg-[#E31B23] text-white rounded-xl font-bold shrink-0 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Live Transcripts */}
        <div className="w-full space-y-3 text-left">
          {userTranscript && (
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10">
              <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">
                {userProfile.nickname || "You"} (Live Speech)
              </span>
              <p className="text-sm text-white font-medium leading-relaxed">{userTranscript}</p>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/15 space-y-1.5">
            <div className="flex items-center space-x-1.5">
              <Bot className="w-3.5 h-3.5 text-[#E31B23]" />
              <span className="text-[10px] font-bold uppercase text-[#E31B23]">
                {voiceAgent ? voiceAgent.name : "DiptiK AI Live Agent"}
              </span>
            </div>
            <p className="text-sm font-semibold text-white leading-relaxed">
              {agentTranscript || "Say hello or ask your agent to plan a task, create a reminder, or answer a question."}
            </p>
          </div>
        </div>

        {/* Quick Voice / Text Starters */}
        <div className="flex flex-wrap gap-2 justify-center">
          {[
            "Introduce yourself and help me plan today",
            "Create a task to review notes at 5 PM",
            "Save a note about my morning ideas"
          ].map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSendTextCommand(prompt)}
              className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[11px] font-medium text-gray-200 transition-colors cursor-pointer"
            >
              "{prompt}"
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="max-w-lg mx-auto w-full flex flex-col items-center space-y-3">
        {showKeyboard ? (
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSendTextCommand(inputText);
              setInputText("");
            }}
            className="w-full flex space-x-2 bg-white/10 p-2 rounded-2xl border border-white/20"
          >
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Send a live text message to the voice agent..."
              className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none"
              autoFocus
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#E31B23] hover:bg-[#BF141B] text-white rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
            <button
              type="button"
              onClick={() => setShowKeyboard(false)}
              className="p-2 text-gray-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </form>
        ) : (
          <div className="flex items-center justify-center space-x-6">
            {/* Mute toggle */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
              className={`p-4 rounded-full transition-all cursor-pointer ${
                isMuted
                  ? "bg-red-500/25 text-red-300 border border-red-500"
                  : "bg-white/10 text-gray-200 hover:bg-white/20"
              }`}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            {/* Reconnect / End Call */}
            {connectionState === "error" || connectionState === "offline" ? (
              <button
                onClick={() => startLiveSession(voiceAgent, selectedVoice)}
                className="w-20 h-20 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xl flex items-center justify-center transition-all border-4 border-white/20 cursor-pointer"
                title="Connect Live Voice"
              >
                <Sparkles className="w-8 h-8" />
              </button>
            ) : (
              <button
                onClick={() => {
                  cleanupSession();
                  setIsVoiceModalOpen(false);
                }}
                className="w-20 h-20 rounded-full bg-[#E31B23] hover:bg-[#BF141B] text-white shadow-2xl flex items-center justify-center transition-all border-4 border-white/20 cursor-pointer"
                title="End Live Voice Session"
              >
                <PhoneOff className="w-8 h-8" />
              </button>
            )}

            {/* Keyboard toggle */}
            <button
              onClick={() => setShowKeyboard(true)}
              title="Type message to live agent"
              className="p-4 rounded-full bg-white/10 text-gray-200 hover:bg-white/20 transition-all cursor-pointer"
            >
              <Keyboard className="w-6 h-6" />
            </button>
          </div>
        )}

        <p className="text-[10px] text-gray-400">
          {isMuted ? "Microphone muted" : "Speak naturally — you can interrupt the agent anytime."}
        </p>
      </div>
    </div>
  );
};
