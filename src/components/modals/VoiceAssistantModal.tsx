import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../../context/AppContext";
import {
  Mic,
  MicOff,
  Volume2,
  X,
  Keyboard,
  WifiOff,
  RefreshCw,
  PhoneOff,
  Send,
  Globe,
  ExternalLink,
  History,
  CheckCircle2
} from "lucide-react";
import { DiptiKLogo } from "../common/DiptiKLogo";
import { AgentTemplate, VoicePersonaName } from "../../types";
import { sendChatMessageStream } from "../../services/api";
import {
  VOICE_PERSONA_DETAILS,
  VoiceAccent,
  loadVoiceAccent,
  saveVoiceAccent,
  speakWithAccent,
  stopSpeechSynthesis
} from "../../lib/voice";

const VOICES: VoicePersonaName[] = ["Zephyr", "Puck", "Charon", "Kore", "Fenrir"];

interface VoiceSource {
  title: string;
  url: string;
  credibility: string;
}

interface VoiceTurn {
  id: string;
  userText: string;
  agentText: string;
  sources?: VoiceSource[];
  timestamp: string;
}

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

function getSpeechRate(speed?: string): number {
  if (speed === "0.8x") return 0.85;
  if (speed === "1.2x") return 1.2;
  if (speed === "1.5x") return 1.45;
  return 1.0;
}

export const VoiceAssistantModal: React.FC = () => {
  const {
    isVoiceModalOpen,
    setIsVoiceModalOpen,
    isOfflineMode,
    liveVoiceCapable,
    userProfile,
    updateUserProfile,
    agentTemplates,
    voiceAgent,
    setVoiceAgent,
    recordVoiceExchange,
    tasks,
    notes,
    memoryItems,
    phoneBridgeConfig,
    addTask,
    addNote,
    addNotification,
    addActivityLog,
    setActiveCommandConfirmation,
    setActiveWorkspaceView,
    setActiveConversationId
  } = useApp();

  const [connectionState, setConnectionState] = useState<
    "idle" | "connecting" | "listening" | "speaking" | "offline" | "error"
  >("idle");
  const [selectedVoice, setSelectedVoice] = useState<VoicePersonaName>(
    voiceAgent?.voiceName || userProfile.voiceName || "Zephyr"
  );
  const [voiceAccent, setVoiceAccent] = useState<VoiceAccent>(() => loadVoiceAccent());
  const [userTranscript, setUserTranscript] = useState("");
  const [agentTranscript, setAgentTranscript] = useState("");
  const [toolStatus, setToolStatus] = useState("");
  const [liveSources, setLiveSources] = useState<VoiceSource[]>([]);
  const [sessionTurns, setSessionTurns] = useState<VoiceTurn[]>([]);
  const [savedConvId, setSavedConvId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [inputText, setInputText] = useState("");
  const [speakPhase, setSpeakPhase] = useState(0);

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
  const sessionSeqRef = useRef<number>(0);
  const glowRef = useRef<HTMLDivElement | null>(null);

  // Live voice turn persistence refs
  const voiceConvIdRef = useRef<string | null>(null);
  const turnUserRef = useRef<string>("");
  const turnAgentRef = useRef<string>("");
  const turnSourcesRef = useRef<VoiceSource[]>([]);
  const turnSavedRef = useRef<boolean>(false);
  const toolPendingRef = useRef<boolean>(false);
  const sessionTurnsRef = useRef<VoiceTurn[]>([]);
  const fallbackAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    sessionTurnsRef.current = sessionTurns;
  }, [sessionTurns]);

  useEffect(() => {
    if (voiceAgent?.voiceName) {
      setSelectedVoice(voiceAgent.voiceName);
    } else if (userProfile.voiceName) {
      setSelectedVoice(userProfile.voiceName);
    }
  }, [voiceAgent, userProfile.voiceName]);

  // Keep server-side voice context synced if tasks/notes/memories update mid-session
  useEffect(() => {
    if (sessionReadyRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "sync_context",
          context: {
            tasks: tasks.filter(t => t.status !== "Completed").slice(0, 15),
            notes: notes.slice(0, 10),
            memories: memoryItems.slice(0, 10),
            city: phoneBridgeConfig.city || userProfile.country || "",
            timezone: typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "",
            clientDateTime: new Date().toLocaleString()
          }
        })
      );
    }
  }, [tasks, notes, memoryItems, phoneBridgeConfig.city, userProfile.country]);

  // Smooth speaking animation tick
  useEffect(() => {
    if (connectionState !== "speaking") return;
    const id = window.setInterval(() => {
      setSpeakPhase(p => (p + 1) % 36);
    }, 90);
    return () => window.clearInterval(id);
  }, [connectionState]);

  const flushCurrentTurnToHistory = (modelLabel = "Gemini 3.8 Live (Voice + Web)", force = false) => {
    if (turnSavedRef.current) return;
    const uText = turnUserRef.current.trim();
    const aText = turnAgentRef.current.trim();
    if (!uText && !aText) return;
    if (!force && !aText) return;

    turnSavedRef.current = true;
    const sourcesSnapshot = [...turnSourcesRef.current];
    const convId = recordVoiceExchange({
      conversationId: voiceConvIdRef.current,
      userText: uText,
      assistantText: aText,
      sources: sourcesSnapshot,
      modelUsed: modelLabel,
      mode: isOfflineMode ? "Offline" : "Ask"
    });

    if (convId) {
      voiceConvIdRef.current = convId;
      setSavedConvId(convId);
    }

    const completedTurn: VoiceTurn = {
      id: `vturn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userText: uText,
      agentText: aText,
      sources: sourcesSnapshot.length > 0 ? sourcesSnapshot : undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };
    setSessionTurns(prev => [...prev, completedTurn]);
  };

  const resetCurrentTurnBuffers = () => {
    turnUserRef.current = "";
    turnAgentRef.current = "";
    turnSourcesRef.current = [];
    turnSavedRef.current = false;
    toolPendingRef.current = false;
  };

  const stopAllPlayback = () => {
    stopSpeechSynthesis();
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
    flushCurrentTurnToHistory("Gemini 3.8 Live (Voice + Web)", true);
    toolPendingRef.current = false;
    sessionReadyRef.current = false;
    stopAllPlayback();

    if (fallbackAbortRef.current) {
      try {
        fallbackAbortRef.current.abort();
      } catch {}
      fallbackAbortRef.current = null;
    }

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

    setToolStatus("");
    if (glowRef.current) {
      glowRef.current.style.transform = "scale(1)";
    }
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

    const startTime = Math.max(ctx.currentTime + 0.005, nextStartTimeRef.current);
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

  const startLiveSession = async (
    targetAgent: AgentTemplate | null,
    voice: VoicePersonaName,
    accent: VoiceAccent = voiceAccent
  ) => {
    const seq = ++sessionSeqRef.current;
    cleanupSession();
    resetCurrentTurnBuffers();
    setErrorMsg("");
    setUserTranscript("");
    setLiveSources([]);
    setToolStatus("");

    const accentLabel = accent === "en-GB" ? "UK English" : "US English";
    setAgentTranscript(
      isOfflineMode || !liveVoiceCapable
        ? `Offline voice mode (${accentLabel}). Speak or type a prompt below.`
        : `Connecting ${targetAgent ? targetAgent.name : "DiptiK Live Voice"} (${accentLabel})...`
    );

    if (isOfflineMode || !liveVoiceCapable) {
      setConnectionState("offline");
      return;
    }

    setConnectionState("connecting");

    try {
      // Open WebSocket and Output AudioContext immediately in parallel with mic acquisition
      const outputCtx = new AudioContext({ sampleRate: 24000 });
      outputAudioCtxRef.current = outputCtx;
      nextStartTimeRef.current = outputCtx.currentTime;

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${protocol}//${window.location.host}/api/live`);
      wsRef.current = ws;

      const clientDateTime = new Date().toLocaleString(undefined, {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
      const timezone =
        typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "";

      ws.onopen = () => {
        if (seq !== sessionSeqRef.current) return;
        ws.send(
          JSON.stringify({
            type: "setup",
            config: {
              nickname: userProfile.nickname || userProfile.name || "Friend",
              persona: userProfile.persona || "Default (Friendly & Helpful)",
              customInstructions: userProfile.customInstructions || "",
              agentName: targetAgent?.name || "DiptiK Voice Agent",
              agentGoal:
                targetAgent?.goal ||
                "Assist the user fast in real-time voice with live web search and workspace tasks.",
              agentInstructions: targetAgent?.instructions || "",
              voiceName: voice,
              voiceAccent: accent,
              engine: userProfile.defaultEngine || "Gemini 4 Hydrogen (Default)",
              city: phoneBridgeConfig.city || userProfile.country || "",
              timezone,
              clientDateTime,
              tasks: tasks.filter(t => t.status !== "Completed").slice(0, 10),
              notes: notes.slice(0, 6),
              memories: memoryItems.slice(0, 8)
            }
          })
        );
      };

      ws.onmessage = event => {
        if (seq !== sessionSeqRef.current) return;
        const msg = JSON.parse(event.data);

        if (msg.type === "ready") {
          sessionReadyRef.current = true;
          setConnectionState("listening");
          setAgentTranscript(
            `${msg.agentName} (${msg.voiceName} · ${accent === "en-GB" ? "UK" : "US"} · Fast Live Web) is listening.`
          );
        } else if (msg.type === "audio" && msg.audio) {
          setConnectionState("speaking");
          playPcmChunk(msg.audio);
        } else if (msg.type === "toolStatus") {
          const nextStatus = msg.status || "";
          toolPendingRef.current = Boolean(nextStatus);
          setToolStatus(nextStatus);
        } else if (msg.type === "liveSources" && Array.isArray(msg.sources)) {
          const incoming: VoiceSource[] = msg.sources;
          const merged = [...turnSourcesRef.current];
          incoming.forEach(src => {
            if (src?.url && !merged.some(m => m.url === src.url)) {
              merged.push(src);
            }
          });
          turnSourcesRef.current = merged.slice(0, 8);
          setLiveSources(turnSourcesRef.current);
        } else if (msg.type === "inputTranscript" && msg.text) {
          if (turnAgentRef.current.trim().length > 0) {
            flushCurrentTurnToHistory();
            resetCurrentTurnBuffers();
            setLiveSources([]);
            setAgentTranscript("");
          }
          turnUserRef.current = `${turnUserRef.current} ${msg.text}`.trim();
          setUserTranscript(turnUserRef.current);
        } else if (msg.type === "outputTranscript" && msg.text) {
          turnAgentRef.current = `${turnAgentRef.current}${msg.text}`;
          setAgentTranscript(turnAgentRef.current);
        } else if (msg.type === "interrupted") {
          stopAllPlayback();
          flushCurrentTurnToHistory();
          toolPendingRef.current = false;
          setToolStatus("");
          setConnectionState("listening");
        } else if (msg.type === "turnComplete") {
          if (!toolPendingRef.current) {
            setToolStatus("");
            flushCurrentTurnToHistory();
            if (activeSourcesRef.current.size === 0) {
              setConnectionState("listening");
            }
          }
        } else if (msg.type === "toolAction") {
          handleLiveToolAction(msg.name, msg.args || {});
        } else if (msg.type === "error") {
          setToolStatus("");
          setErrorMsg(msg.message || "Voice connection encountered an error.");
          setConnectionState("error");
        } else if (msg.type === "closed") {
          setToolStatus("");
          sessionReadyRef.current = false;
        }
      };

      ws.onerror = () => {
        if (seq !== sessionSeqRef.current) return;
        setToolStatus("");
        setErrorMsg("Live audio stream disconnected. You can reconnect or type below for fast live web answers.");
        setConnectionState("error");
      };

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      if (seq !== sessionSeqRef.current) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }

      streamRef.current = stream;
      const inputCtx = new AudioContext({ sampleRate: 16000 });
      inputAudioCtxRef.current = inputCtx;

      const source = inputCtx.createMediaStreamSource(stream);
      // 1024 samples @ 16kHz = 64ms low-latency audio frames (4x faster than 4096)
      const processor = inputCtx.createScriptProcessor(1024, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = e => {
        const channelData = e.inputBuffer.getChannelData(0);

        if (glowRef.current) {
          if (isMutedRef.current) {
            glowRef.current.style.transform = "scale(1)";
          } else {
            let sum = 0;
            for (let i = 0; i < channelData.length; i += 8) {
              sum += Math.abs(channelData[i]);
            }
            const avg = sum / (channelData.length / 8);
            const lvl = Math.min(1, avg * 8);
            glowRef.current.style.transform = `scale(${(1 + lvl * 0.16).toFixed(3)})`;
          }
        }

        if (!isMutedRef.current && sessionReadyRef.current && ws.readyState === WebSocket.OPEN) {
          const base64 = floatTo16BitPcmBase64(channelData);
          ws.send(JSON.stringify({ type: "audio", audio: base64 }));
        }
      };

      source.connect(processor);
      processor.connect(inputCtx.destination);
    } catch (err: any) {
      if (seq !== sessionSeqRef.current) return;
      console.error("Failed to start real-time voice:", err);
      setErrorMsg(
        err?.name === "NotAllowedError"
          ? "Microphone permission was denied. Allow mic access or type below to chat with fast live web search."
          : err?.message || "Could not access microphone."
      );
      setConnectionState("error");
    }
  };

  useEffect(() => {
    if (isVoiceModalOpen) {
      voiceConvIdRef.current = null;
      setSavedConvId(null);
      setSessionTurns([]);
      const currentAccent = loadVoiceAccent();
      setVoiceAccent(currentAccent);
      startLiveSession(voiceAgent, selectedVoice, currentAccent);
    } else {
      cleanupSession();
      setConnectionState("idle");
    }
    return () => {
      cleanupSession();
    };
  }, [isVoiceModalOpen]);

  useEffect(() => {
    if (!isVoiceModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        cleanupSession();
        setIsVoiceModalOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isVoiceModalOpen, setIsVoiceModalOpen]);

  if (!isVoiceModalOpen) return null;

  const handleAgentSwitch = (agentId: string) => {
    const found = agentTemplates.find(a => a.id === agentId) || null;
    setVoiceAgent(found);
    const nextVoice = found?.voiceName || selectedVoice;
    setSelectedVoice(nextVoice);
    startLiveSession(found, nextVoice, voiceAccent);
  };

  const handleVoiceChange = (voice: VoicePersonaName) => {
    setSelectedVoice(voice);
    updateUserProfile({ voiceName: voice });
    startLiveSession(voiceAgent, voice, voiceAccent);
  };

  const handleAccentChange = (nextAccent: VoiceAccent) => {
    if (nextAccent === voiceAccent) return;
    setVoiceAccent(nextAccent);
    saveVoiceAccent(nextAccent);
    startLiveSession(voiceAgent, selectedVoice, nextAccent);
  };

  const handlePreviewVoice = () => {
    const sample =
      voiceAccent === "en-GB"
        ? `Hello ${userProfile.nickname || "there"}, DiptiK Voice is active in British English with live web search connected.`
        : `Hello ${userProfile.nickname || "there"}, DiptiK Voice is active in American English with live web search connected.`;

    speakWithAccent(sample, {
      accent: voiceAccent,
      rate: getSpeechRate(userProfile.speed),
      onStart: () => setConnectionState("speaking"),
      onEnd: () =>
        setConnectionState(prev =>
          prev === "speaking" ? (isOfflineMode || !liveVoiceCapable ? "offline" : "listening") : prev
        )
    });
  };

  const handleSendTextCommand = async (text: string) => {
    const cleanPrompt = text.trim();
    if (!cleanPrompt) return;

    flushCurrentTurnToHistory();
    resetCurrentTurnBuffers();
    turnUserRef.current = cleanPrompt;
    setUserTranscript(cleanPrompt);
    setAgentTranscript("");
    setLiveSources([]);

    // Path A: Active Gemini Live WebSocket session -> model speaks back in real-time & searches live web via tools
    if (sessionReadyRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
      setToolStatus("Sending to live voice engine...");
      wsRef.current.send(JSON.stringify({ type: "text", text: cleanPrompt }));
      return;
    }

    // Path B: Direct Streaming Cloud AI Fallback with Live Google Search + Speech Synthesis + History Persistence
    if (fallbackAbortRef.current) {
      try {
        fallbackAbortRef.current.abort();
      } catch {}
    }
    const controller = new AbortController();
    fallbackAbortRef.current = controller;

    stopAllPlayback();
    setConnectionState("speaking");
    setToolStatus(isOfflineMode ? "Running locally..." : "Checking live web updates...");

    const history = sessionTurnsRef.current.flatMap(t => {
      const items: { sender: "user" | "ai"; text: string }[] = [];
      if (t.userText) items.push({ sender: "user", text: t.userText });
      if (t.agentText) items.push({ sender: "ai", text: t.agentText });
      return items;
    });

    const clientDateTime = new Date().toLocaleString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
    const timezone =
      typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "";

    let accumulated = "";
    let spokenIndex = 0;
    let speechStarted = false;
    const rate = getSpeechRate(userProfile.speed);

    const flushSpeechQueue = (flushRemaining = false) => {
      const unspoken = accumulated.slice(spokenIndex);
      if (!unspoken) return;
      if (flushRemaining) {
        if (unspoken.trim()) {
          speakWithAccent(unspoken.trim(), {
            accent: voiceAccent,
            rate,
            queue: speechStarted,
            onEnd: () =>
              setConnectionState(isOfflineMode || !liveVoiceCapable ? "offline" : "listening")
          });
          spokenIndex = accumulated.length;
          speechStarted = true;
        } else {
          setConnectionState(isOfflineMode || !liveVoiceCapable ? "offline" : "listening");
        }
        return;
      }

      // Speak each finished sentence as soon as punctuation arrives
      const match = unspoken.match(/^([\s\S]*?[.!?](?:\s|$)|\S[\s\S]*?\n)/);
      if (match && match[1].trim().length >= 12) {
        const sentence = match[1].trim();
        speakWithAccent(sentence, {
          accent: voiceAccent,
          rate,
          queue: speechStarted
        });
        spokenIndex += match[1].length;
        speechStarted = true;
      }
    };

    try {
      await sendChatMessageStream(
        {
          message: cleanPrompt,
          mode: isOfflineMode ? "Offline" : "Ask",
          history,
          style: "Concise",
          isOffline: isOfflineMode,
          webAccess: !isOfflineMode,
          voiceFast: true,
          userProfile,
          activeAgent: voiceAgent,
          clientDateTime,
          timezone,
          memories: memoryItems.slice(0, 6).map(m => ({ title: m.title, value: m.value }))
        },
        {
          onStatus: status => {
            setToolStatus(status);
          },
          onChunk: delta => {
            accumulated += delta;
            turnAgentRef.current = accumulated;
            setAgentTranscript(accumulated);
            flushSpeechQueue(false);
          },
          onDone: meta => {
            setToolStatus("");
            const finalText = accumulated.trim() || "I have completed checking that for you.";
            turnAgentRef.current = finalText;
            const sources = meta.sources || [];
            turnSourcesRef.current = sources;
            setLiveSources(sources);

            flushCurrentTurnToHistory(meta.modelUsed || "Gemini 3.1 Flash Lite (Voice Web)");
            if (!accumulated.trim()) {
              accumulated = finalText;
            }
            flushSpeechQueue(true);
          },
          onError: errMsg => {
            setToolStatus("");
            const msg = accumulated.trim() || `Unable to fetch live update: ${errMsg}`;
            turnAgentRef.current = msg;
            setAgentTranscript(msg);
            flushCurrentTurnToHistory("Voice Fallback");
            setConnectionState("error");
          }
        },
        controller.signal
      );
    } catch (err: any) {
      setToolStatus("");
      if (err?.name !== "AbortError") {
        const msg = accumulated.trim() || `Live update error: ${err?.message || "Connection failed"}`;
        turnAgentRef.current = msg;
        setAgentTranscript(msg);
        setConnectionState("error");
      }
    }
  };

  const handleOpenSavedInChat = () => {
    const targetId = voiceConvIdRef.current || savedConvId;
    cleanupSession();
    setIsVoiceModalOpen(false);
    if (targetId) {
      setActiveConversationId(targetId);
      setActiveWorkspaceView("chat");
    }
  };

  const activePersonaTone =
    VOICE_PERSONA_DETAILS.find(v => v.name === selectedVoice)?.tone || "Warm & balanced";

  const statusText =
    toolStatus
      ? toolStatus
      : connectionState === "listening"
      ? `Listening · ${voiceAccent === "en-GB" ? "UK English" : "US English"}`
      : connectionState === "speaking"
      ? `Speaking · ${selectedVoice} (${voiceAccent === "en-GB" ? "UK" : "US"})`
      : connectionState === "connecting"
      ? "Connecting real-time audio & web engine..."
      : connectionState === "offline"
      ? `Offline Voice · ${voiceAccent === "en-GB" ? "UK English" : "US English"}`
      : connectionState === "error"
      ? "Mic unavailable — type below for live web voice answers"
      : "Ready";

  const orbScale =
    connectionState === "speaking"
      ? 1.06 + (speakPhase % 4) * 0.025
      : 1;

  const isSessionActive =
    connectionState === "listening" ||
    connectionState === "speaking" ||
    connectionState === "connecting";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="DiptiK Real-Time Voice Assistant"
      className="fixed inset-0 z-50 bg-slate-50/95 dark:bg-[#090b11]/95 backdrop-blur-2xl flex flex-col justify-between px-4 sm:px-8 py-5 text-slate-900 dark:text-white transition-colors duration-150"
    >
      {/* 1. Minimal Top Studio Header */}
      <header className="max-w-3xl mx-auto w-full flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-white/[0.08] shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <DiptiKLogo size="xs" showText={false} />
          <div className="text-left min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-sm font-semibold tracking-tight text-slate-900 dark:text-white truncate">
                {voiceAgent ? voiceAgent.name : "DiptiK Voice"}
              </h2>
              {!isOfflineMode && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                  <Globe className="w-2.5 h-2.5" />
                  Live Web
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-[#94a3b8] truncate">
              {selectedVoice} · {activePersonaTone} · {voiceAccent === "en-GB" ? "UK Accent" : "US Accent"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {savedConvId && (
            <button
              type="button"
              onClick={handleOpenSavedInChat}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0072FF]/10 hover:bg-[#0072FF]/15 text-[#0072FF] dark:text-[#00E5FF] border border-[#0072FF]/25 text-xs font-medium transition-colors cursor-pointer"
              title="Open saved voice history in Chat"
            >
              <History className="w-3.5 h-3.5" />
              <span>View in History</span>
            </button>
          )}

          {/* Segmented UK / US Accent Switch */}
          <div
            role="group"
            aria-label="Voice accent"
            className="inline-flex items-center p-0.5 rounded-lg bg-slate-200/70 dark:bg-[#121520] border border-slate-200 dark:border-white/[0.08]"
          >
            <button
              type="button"
              onClick={() => handleAccentChange("en-GB")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                voiceAccent === "en-GB"
                  ? "bg-white dark:bg-[#181c2b] text-slate-900 dark:text-white shadow-xs dark:shadow-none"
                  : "text-slate-500 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              UK (en-GB)
            </button>
            <button
              type="button"
              onClick={() => handleAccentChange("en-US")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                voiceAccent === "en-US"
                  ? "bg-white dark:bg-[#181c2b] text-slate-900 dark:text-white shadow-xs dark:shadow-none"
                  : "text-slate-500 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              US (en-US)
            </button>
          </div>

          {/* Agent Selector */}
          <select
            aria-label="Select voice agent"
            value={voiceAgent?.id || ""}
            onChange={e => handleAgentSwitch(e.target.value)}
            className="bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.1] text-slate-800 dark:text-white text-xs font-medium px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[#0072FF] cursor-pointer"
          >
            <option value="">General Assistant</option>
            {agentTemplates.map(ag => (
              <option key={ag.id} value={ag.id}>
                {ag.name}
              </option>
            ))}
          </select>

          {/* Voice Persona Selector */}
          <select
            aria-label="Select neural voice"
            value={selectedVoice}
            onChange={e => handleVoiceChange(e.target.value as VoicePersonaName)}
            className="bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.1] text-slate-800 dark:text-white text-xs font-medium px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[#0072FF] cursor-pointer"
          >
            {VOICES.map(v => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              cleanupSession();
              setIsVoiceModalOpen(false);
            }}
            aria-label="Close voice assistant"
            className="p-2 rounded-lg bg-white dark:bg-[#121520] hover:bg-slate-100 dark:hover:bg-[#181c2b] border border-slate-200 dark:border-white/[0.08] text-slate-500 dark:text-[#cbd5e1] hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Center Studio Stage: Acoustic Halo & Editorial Transcript */}
      <main className="flex-1 min-h-0 flex flex-col items-center justify-center max-w-2xl mx-auto w-full py-5 overflow-y-auto gemini-scroll space-y-6">
        {/* Acoustic Orb */}
        <div className="flex flex-col items-center space-y-4 shrink-0">
          <div className="relative w-40 h-40 sm:w-44 sm:h-44 flex items-center justify-center">
            {/* Ambient Dual-Tone Glow */}
            <div
              ref={glowRef}
              className="absolute inset-2 rounded-full transition-transform duration-100 pointer-events-none"
              style={{
                transform: `scale(${orbScale})`,
                opacity: connectionState === "error" ? 0.2 : 0.9,
                background:
                  connectionState === "speaking"
                    ? "radial-gradient(circle, rgba(0,229,255,0.22) 0%, rgba(0,114,255,0.12) 55%, transparent 72%)"
                    : connectionState === "listening"
                    ? "radial-gradient(circle, rgba(255,30,138,0.2) 0%, rgba(138,43,226,0.12) 55%, transparent 72%)"
                    : "radial-gradient(circle, rgba(148,163,184,0.14) 0%, transparent 70%)"
              }}
              aria-hidden="true"
            />

            {/* Precision Harmonic Ring SVG */}
            <svg
              viewBox="0 0 200 200"
              className="absolute inset-0 w-full h-full pointer-events-none"
              aria-hidden="true"
            >
              {Array.from({ length: 36 }).map((_, idx) => {
                const angle = (idx * 10 * Math.PI) / 180;
                const wave =
                  connectionState === "speaking"
                    ? 6 + Math.abs(Math.sin((idx + speakPhase) * 0.45)) * 14
                    : connectionState === "listening"
                    ? 4 + (idx % 3) * 3
                    : 2;
                const rInner = 66;
                const rOuter = rInner + wave;
                const x1 = 100 + Math.cos(angle) * rInner;
                const y1 = 100 + Math.sin(angle) * rInner;
                const x2 = 100 + Math.cos(angle) * rOuter;
                const y2 = 100 + Math.sin(angle) * rOuter;
                const strokeColor =
                  connectionState === "speaking"
                    ? idx % 2 === 0
                      ? "#00E5FF"
                      : "#0072FF"
                    : connectionState === "listening"
                    ? idx % 2 === 0
                      ? "#FF1E8A"
                      : "#8A2BE2"
                    : "currentColor";
                return (
                  <line
                    key={idx}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={strokeColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    className={
                      connectionState === "listening" || connectionState === "speaking"
                        ? "opacity-85"
                        : "text-slate-300 dark:text-white/20"
                    }
                  />
                );
              })}
            </svg>

            {/* Center Surface Disc */}
            <div
              className="relative w-20 h-20 rounded-full bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.1] shadow-sm dark:shadow-none flex items-center justify-center transition-transform duration-150"
              style={{ transform: `scale(${connectionState === "speaking" ? 1.04 : 1})` }}
            >
              {toolStatus ? (
                <Globe className="w-6 h-6 text-[#0072FF] dark:text-[#00E5FF] animate-pulse" strokeWidth={1.75} />
              ) : connectionState === "connecting" ? (
                <RefreshCw className="w-6 h-6 text-[#0072FF] dark:text-[#00E5FF] animate-spin" strokeWidth={1.75} />
              ) : connectionState === "offline" ? (
                <WifiOff className="w-6 h-6 text-amber-500 dark:text-amber-400" strokeWidth={1.75} />
              ) : connectionState === "speaking" ? (
                <Volume2 className="w-6 h-6 text-[#0072FF] dark:text-[#00E5FF]" strokeWidth={1.75} />
              ) : (
                <DiptiKLogo size="sm" showText={false} />
              )}
            </div>
          </div>

          {/* Unboxed State Metadata */}
          <div className="flex flex-col items-center gap-1.5">
            <p className="text-sm font-medium text-slate-800 dark:text-[#e2e8f0] flex items-center gap-2">
              {toolStatus && <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0072FF] dark:text-[#00E5FF]" />}
              <span>{statusText}</span>
            </p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handlePreviewVoice}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0072FF] dark:text-[#00E5FF] hover:underline cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Preview {voiceAccent === "en-GB" ? "UK" : "US"} accent</span>
              </button>
              {savedConvId && (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Saved to your private history</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Error Callout */}
        {errorMsg && (
          <div className="w-full max-w-xl p-3.5 rounded-xl bg-red-50 dark:bg-[#FF1744]/10 border border-red-200 dark:border-[#FF1744]/30 text-xs text-red-700 dark:text-[#ffb3c0] flex items-center justify-between gap-4 text-left shrink-0">
            <span>{errorMsg}</span>
            <button
              type="button"
              onClick={() => startLiveSession(voiceAgent, selectedVoice, voiceAccent)}
              className="px-3.5 py-1.5 btn-diptik-primary rounded-lg text-xs font-medium shrink-0 cursor-pointer whitespace-nowrap"
            >
              Reconnect
            </button>
          </div>
        )}

        {/* Editorial Transcript Stream */}
        <div className="w-full max-w-xl space-y-4 text-left">
          {userTranscript && (
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.08] px-4 py-2.5">
                <div className="text-[11px] text-slate-400 dark:text-[#64748b] mb-0.5">
                  {userProfile.nickname || "You"}
                </div>
                <p className="text-sm text-slate-900 dark:text-white leading-relaxed">
                  {userTranscript}
                </p>
              </div>
            </div>
          )}

          <div className="border-t border-slate-200 dark:border-white/[0.08] pt-4 space-y-3">
            <div className="text-xs font-medium text-[#0072FF] dark:text-[#00E5FF]">
              {voiceAgent ? voiceAgent.name : "DiptiK AI 3"} · {voiceAccent === "en-GB" ? "British English" : "US English"}
            </div>
            <p className="text-[15px] sm:text-base text-slate-800 dark:text-[#f1f5f9] leading-relaxed whitespace-pre-wrap">
              {agentTranscript ||
                "Ask for live news, real-time web updates, current prices, website checks, or personal tasks."}
            </p>

            {/* Live Web Grounding Sources */}
            {liveSources.length > 0 && (
              <div className="pt-2 space-y-1.5">
                <div className="text-[11px] font-medium text-slate-500 dark:text-[#94a3b8] flex items-center gap-1.5">
                  <Globe className="w-3 h-3 text-[#0072FF] dark:text-[#00E5FF]" />
                  <span>Live Web Sources</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {liveSources.map((src, idx) => (
                    <a
                      key={idx}
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#121520] hover:bg-slate-100 dark:hover:bg-[#181c2b] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-700 dark:text-[#cbd5e1] max-w-[240px] transition-colors"
                    >
                      <span className="truncate">{src.title || src.url}</span>
                      <ExternalLink className="w-3 h-3 shrink-0 text-[#0072FF] dark:text-[#00E5FF]" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Live Web & Task Starter Prompts */}
        <div className="w-full max-w-xl flex flex-wrap gap-2 justify-center shrink-0">
          {[
            "Check today's latest world and tech news",
            "Find the current live Bitcoin and gold prices",
            "Check my tasks and help me organise today",
            "Browse bbc.com/news for today's top headline"
          ].map((prompt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSendTextCommand(prompt)}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#121520] hover:bg-slate-100 dark:hover:bg-[#181c2b] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-600 dark:text-[#cbd5e1] hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>
      </main>

      {/* 3. Refined Bottom Studio Control Dock */}
      <footer className="max-w-lg mx-auto w-full flex flex-col items-center space-y-3 pt-4 border-t border-slate-200 dark:border-white/[0.08] shrink-0">
        {showKeyboard ? (
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSendTextCommand(inputText);
              setInputText("");
            }}
            className="w-full flex items-center gap-2 bg-white dark:bg-[#121520] p-1.5 rounded-2xl border border-slate-200 dark:border-white/[0.1] shadow-sm dark:shadow-none"
          >
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Ask anything live or enter a URL to check..."
              className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748b] focus:outline-none"
              autoFocus
            />
            <button
              type="submit"
              className="px-4 py-2 btn-diptik-primary rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
            <button
              type="button"
              onClick={() => setShowKeyboard(false)}
              aria-label="Close text input"
              className="p-2 text-slate-400 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <div className="flex items-center justify-center gap-5">
            <button
              type="button"
              onClick={() => setIsMuted(prev => !prev)}
              title={isMuted ? "Unmute microphone" : "Mute microphone"}
              aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors cursor-pointer border ${
                isMuted
                  ? "bg-red-50 dark:bg-[#FF1744]/20 text-red-600 dark:text-[#FF8A9E] border-red-200 dark:border-[#FF1744]/40"
                  : "bg-white dark:bg-[#121520] border-slate-200 dark:border-white/[0.1] text-slate-600 dark:text-[#cbd5e1] hover:bg-slate-100 dark:hover:bg-[#181c2b] hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {isSessionActive ? (
              <button
                type="button"
                onClick={() => {
                  cleanupSession();
                  setIsVoiceModalOpen(false);
                }}
                aria-label="End live voice session"
                title="End live voice session"
                className="w-14 h-14 rounded-full bg-[#FF1744] hover:bg-[#d51038] text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => startLiveSession(voiceAgent, selectedVoice, voiceAccent)}
                aria-label="Start live voice session"
                title="Start live voice session"
                className="w-14 h-14 rounded-full btn-diptik-primary text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
              >
                <Mic className="w-5 h-5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowKeyboard(true)}
              title="Type message to live agent"
              aria-label="Type message to live agent"
              className="w-12 h-12 rounded-full bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.1] text-slate-600 dark:text-[#cbd5e1] hover:bg-slate-100 dark:hover:bg-[#181c2b] hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center cursor-pointer"
            >
              <Keyboard className="w-5 h-5" />
            </button>
          </div>
        )}

        <p className="text-xs text-slate-400 dark:text-[#64748b]">
          {isMuted ? "Microphone muted" : "Live web browsing & private account history enabled"}
        </p>
      </footer>
    </div>
  );
};
