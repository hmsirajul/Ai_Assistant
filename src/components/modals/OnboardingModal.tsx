import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import {
  Sparkles,
  Mic,
  Cpu,
  WifiOff,
  Mail,
  Lock,
  User,
  Shield,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  X,
  Volume2,
  UserPlus,
  Bot
} from "lucide-react";
import { DiptiKLogo } from "../common/DiptiKLogo";
import { VoicePersonaName } from "../../types";

const AI_ENGINES = [
  { id: "Gemini 4 Hydrogen (Default)", label: "Gemini 4 Hydrogen", desc: "Google's fast multimodal & live voice default" },
  { id: "ChatGPT (OpenAI Style)", label: "ChatGPT Style", desc: "Structured, direct conversational reasoning" },
  { id: "Claude (Anthropic Style)", label: "Claude Style", desc: "Thoughtful, nuanced & thorough analysis" },
  { id: "DiptiK Lite 350M (Offline)", label: "Offline Lite 350M", desc: "Local privacy-first device assistant" }
];

const VOICE_OPTIONS: VoicePersonaName[] = ["Zephyr", "Puck", "Charon", "Kore", "Fenrir"];

export const OnboardingModal: React.FC = () => {
  const {
    showSplash,
    setShowSplash,
    showOnboarding,
    setShowOnboarding,
    showAuth,
    setShowAuth,
    setShowAssistantSetup,
    isAuthenticated,
    userProfile,
    savedLocalProfiles,
    signInWithGoogle,
    signInWithEmail,
    registerWithEmail,
    sendPasswordReset,
    createCustomLocalProfile,
    useDefaultProfilePreset,
    switchLocalProfile,
    openVoiceWithAgent
  } = useApp();

  const [step, setStep] = useState<
    "splash" | "welcome" | "carousel" | "signin" | "register" | "create_profile" | "forgot" | "ready_voice"
  >("signin");
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Auth & Profile fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("+1 (555) 382-9104");
  const [country, setCountry] = useState("United States");
  const [selectedEngine, setSelectedEngine] = useState("Gemini 4 Hydrogen (Default)");
  const [selectedVoice, setSelectedVoice] = useState<VoicePersonaName>("Zephyr");
  const [selectedPersona, setSelectedPersona] = useState("Default (Friendly & Helpful)");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showConsoleHelp, setShowConsoleHelp] = useState(false);

  useEffect(() => {
    if (showSplash) {
      setStep("splash");
      const timer = setTimeout(() => {
        setStep("welcome");
      }, 1800);
      return () => clearTimeout(timer);
    } else if (showOnboarding) {
      setStep("carousel");
    } else if (showAuth) {
      setStep("signin");
    }
  }, [showSplash, showOnboarding, showAuth]);

  if (!showSplash && !showOnboarding && !showAuth) return null;

  const closeAll = () => {
    setShowSplash(false);
    setShowOnboarding(false);
    setShowAuth(false);
  };

  const handleGoogleLogin = async () => {
    setAuthError("");
    setAuthSuccess("");
    setIsLoading(true);
    try {
      await signInWithGoogle();
      setStep("ready_voice");
    } catch (err: any) {
      const msg = err?.message || "Google sign-in failed.";
      if (msg.includes("popup-closed-by-user")) {
        setAuthError("Sign-in popup was closed before completing.");
      } else {
        setAuthError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    setShowConsoleHelp(false);
    if (!email.includes("@")) {
      setAuthError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setAuthError("Password must be at least 6 characters.");
      return;
    }
    setIsLoading(true);
    try {
      await signInWithEmail(email, password);
      setStep("ready_voice");
    } catch (err: any) {
      const code = err?.code || "";
      if (code === "auth/operation-not-allowed") {
        setShowConsoleHelp(true);
        setAuthError(
          "Email/Password sign-in is not yet enabled in Firebase Console. Use Google Sign-In, Default Profile, or create a Local Profile below."
        );
      } else if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
        setAuthError("Invalid email or password. Try creating an account or signing in with Google.");
      } else {
        setAuthError(err?.message || "Failed to sign in.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    setShowConsoleHelp(false);
    if (!name.trim()) {
      setAuthError("Please enter your full name.");
      return;
    }
    if (!email.includes("@")) {
      setAuthError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setAuthError("Password must be at least 6 characters.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await registerWithEmail({
        name: name.trim(),
        nickname: nickname.trim() || name.trim().split(" ")[0],
        email: email.trim(),
        password,
        phone,
        country,
        defaultEngine: selectedEngine,
        voiceName: selectedVoice,
        persona: selectedPersona
      });
      if (res.needsVerification) {
        setAuthSuccess("Account created! We sent a verification link to your email. You can start using your profile right now.");
      }
      setStep("ready_voice");
    } catch (err: any) {
      const code = err?.code || "";
      if (code === "auth/operation-not-allowed") {
        setShowConsoleHelp(true);
        setAuthError(
          "Email/Password provider is not enabled in Firebase Console yet. Click 'Save as Local Profile & Start' below, or sign in with Google."
        );
      } else if (code === "auth/email-already-in-use") {
        setAuthError("An account with this email already exists. Please Sign In instead.");
      } else {
        setAuthError(err?.message || "Registration failed.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCustomProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setAuthError("Please enter a profile name.");
      return;
    }
    setAuthError("");
    setIsLoading(true);
    try {
      await createCustomLocalProfile({
        name: name.trim(),
        nickname: nickname.trim() || name.trim().split(" ")[0],
        email: email.trim() || `${name.trim().toLowerCase().replace(/\s+/g, ".")}@diptik.ai`,
        country,
        defaultEngine: selectedEngine,
        voiceName: selectedVoice,
        persona: selectedPersona
      });
      setStep("ready_voice");
    } finally {
      setIsLoading(false);
    }
  };

  const carouselSlides = [
    {
      title: "Ask anything",
      description: "Switch between Gemini 4 Hydrogen, ChatGPT-style, Claude-style, or On-Device Lite anytime.",
      icon: Sparkles,
      color: "bg-[#FF1E8A]/15 text-[#FF1E8A] border border-[#FF1E8A]/30",
      preview: "User: Explain Quantum Computing in simple terms.\nDiptiK AI 3: Imagine a normal computer as a light switch (On or Off)..."
    },
    {
      title: "Real-Time Voice Control",
      description: "Talk naturally to your AI agent with Gemini 3.8 Live bidirectional audio & live transcripts.",
      icon: Mic,
      color: "bg-[#0072FF]/15 text-[#00E5FF] border border-[#0072FF]/35",
      preview: "Live Voice: 'Hey DiptiK, create a task to review Q3 metrics at 5 PM.'\nAgent: Done! I added that to your Today tasks."
    },
    {
      title: "Multi-Step AI Agents",
      description: "Launch specialized agents, build custom workflows, and execute plans step-by-step.",
      icon: Cpu,
      color: "bg-[#8A2BE2]/20 text-[#d8b4fe] border border-[#8A2BE2]/40",
      preview: "Plan: Gather context -> Draft summary -> Verify safeguards -> Deliver report."
    },
    {
      title: "Profiles & Default Modes",
      description: "Sign in with Google, create custom user profiles, or jump straight in with a default profile.",
      icon: WifiOff,
      color: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
      preview: "Profiles synced to Cloud Firestore + Instant Default Preset access."
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#121520] rounded-2xl shadow-2xl overflow-hidden border border-white/[0.1] flex flex-col max-h-[92vh] relative text-[#e2e8f0]">
        {/* Close button if authenticated or on quick auth */}
        {(isAuthenticated || step !== "splash") && (
          <button
            onClick={() => {
              if (!isAuthenticated) {
                useDefaultProfilePreset(selectedEngine);
              } else {
                closeAll();
              }
            }}
            title="Use Default & Close"
            className="absolute top-3.5 right-3.5 z-20 p-2 rounded-lg bg-[#181c2b] hover:bg-[#1f2437] border border-white/[0.08] text-[#94a3b8] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Step 1: Splash */}
        {step === "splash" && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-[#121520] to-[#0b0d14] min-h-[460px]">
            <div className="mb-6">
              <DiptiKLogo size="xl" showText={false} />
            </div>
            <h1 className="font-display text-3xl font-bold text-white tracking-tight">DiptiK AI 3</h1>
            <p className="text-sm font-medium text-[#94a3b8] mt-2 max-w-xs">
              Ask. Speak. Automate. Get things done.
            </p>
            <div className="mt-12 flex flex-col items-center space-y-2">
              <RefreshCw className="w-6 h-6 text-[#00E5FF] animate-spin" />
              <span className="text-xs text-[#94a3b8] font-medium">Checking authentication & voice engine...</span>
            </div>
          </div>
        )}

        {/* Step 2: Welcome */}
        {step === "welcome" && (
          <div className="flex-1 flex flex-col justify-between p-8 text-center min-h-[480px]">
            <div className="mt-6 flex flex-col items-center">
              <div className="mb-5">
                <DiptiKLogo size="lg" showText={false} />
              </div>
              <h2 className="font-display text-2xl font-bold text-white">Welcome to DiptiK AI 3</h2>
              <p className="text-xs text-[#94a3b8] mt-2 max-w-xs leading-relaxed">
                Sign in, create your own personalized AI profile, or start immediately with a default Gemini / ChatGPT / Offline preset.
              </p>
            </div>
            <div className="space-y-2.5 mt-8">
              <button
                onClick={() => setStep("signin")}
                className="w-full py-3.5 px-4 btn-diptik-primary text-white rounded-2xl font-semibold text-sm shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Sign In / Create Profile</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  useDefaultProfilePreset("Gemini 4 Hydrogen (Default)");
                  setStep("ready_voice");
                }}
                className="w-full py-3 px-4 bg-[#181c2b] hover:bg-[#1f2437] border border-white/[0.1] text-[#e2e8f0] rounded-2xl font-semibold text-xs transition-all cursor-pointer"
              >
                Continue with Default Profile
              </button>
              <button
                onClick={() => setStep("carousel")}
                className="w-full py-2 text-xs text-[#94a3b8] hover:text-white font-medium transition-colors cursor-pointer"
              >
                Explore Features Tour
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Carousel */}
        {step === "carousel" && (
          <div className="flex-1 flex flex-col justify-between p-8 min-h-[480px]">
            <div className="flex justify-between items-center pr-8">
              <div className="flex space-x-1.5">
                {carouselSlides.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === carouselIndex
                        ? "w-6 bg-gradient-to-r from-[#FF1E8A] to-[#00E5FF]"
                        : "w-1.5 bg-white/[0.18]"
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={() => setStep("signin")}
                className="text-xs text-[#94a3b8] font-medium hover:text-white cursor-pointer"
              >
                Skip
              </button>
            </div>

            <div className="my-auto py-6 flex flex-col items-center text-center">
              {React.createElement(carouselSlides[carouselIndex].icon, {
                className: `w-16 h-16 p-3.5 rounded-2xl mb-5 ${carouselSlides[carouselIndex].color}`
              })}
              <h3 className="font-display text-xl font-semibold text-white">{carouselSlides[carouselIndex].title}</h3>
              <p className="text-xs text-[#cbd5e1] mt-2 leading-relaxed max-w-xs">
                {carouselSlides[carouselIndex].description}
              </p>
              <div className="mt-5 w-full bg-[#181c2b] border border-white/[0.08] rounded-2xl p-3.5 text-left text-[11px] font-mono text-[#cbd5e1] whitespace-pre-line">
                {carouselSlides[carouselIndex].preview}
              </div>
            </div>

            <div className="flex space-x-3">
              {carouselIndex > 0 && (
                <button
                  onClick={() => setCarouselIndex(carouselIndex - 1)}
                  className="flex-1 py-3 px-4 bg-[#181c2b] hover:bg-[#1f2437] border border-white/[0.08] text-[#cbd5e1] rounded-xl font-semibold text-xs cursor-pointer"
                >
                  Back
                </button>
              )}
              <button
                onClick={() => {
                  if (carouselIndex < carouselSlides.length - 1) {
                    setCarouselIndex(carouselIndex + 1);
                  } else {
                    setStep("signin");
                  }
                }}
                className="flex-2 py-3 px-4 btn-diptik-primary text-white rounded-xl font-semibold text-xs shadow-md cursor-pointer"
              >
                {carouselIndex === carouselSlides.length - 1 ? "Get Started" : "Next"}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Sign In & Quick Default / Profile Launcher */}
        {step === "signin" && (
          <div className="flex-1 flex flex-col justify-between p-6 sm:p-7 overflow-y-auto text-left gemini-scroll">
            <div>
              <div className="flex items-center space-x-2.5 mb-2 pr-8">
                <DiptiKLogo size="sm" showText={false} />
                <div>
                  <h3 className="font-display text-lg font-semibold text-white">Sign In or Choose Profile</h3>
                  <p className="text-[11px] text-[#94a3b8]">Create your own profile or use a default preset</p>
                </div>
              </div>

              {authError && (
                <div className="mt-3 p-3 bg-[#FF1744]/15 border border-[#FF1744]/35 rounded-xl text-xs text-[#ffb3c0] font-medium space-y-1">
                  <p>{authError}</p>
                  {showConsoleHelp && (
                    <p className="text-[10px] text-[#ffb3c0]/80">
                      To enable Email/Password in Firebase: open Firebase Console &rarr; Authentication &rarr; Sign-in method &rarr; Enable Email/Password.
                    </p>
                  )}
                </div>
              )}

              {/* Primary Real Auth: Google Sign-In */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="mt-4 w-full py-3 px-4 bg-[#181c2b] hover:bg-[#1f2437] border border-white/[0.15] rounded-2xl text-xs font-semibold text-white shadow-xs transition-all flex items-center justify-center space-x-2.5 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z" />
                  <path fill="#FBBC05" d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z" />
                </svg>
                <span>Continue with Google Account</span>
              </button>

              {/* Quick Custom Profile Builder CTA */}
              <button
                type="button"
                onClick={() => {
                  setAuthError("");
                  setStep("create_profile");
                }}
                className="mt-2.5 w-full py-3 px-4 btn-diptik-primary text-white rounded-2xl text-xs font-semibold shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Your Own Custom Profile</span>
              </button>

              {/* Saved Profiles Switcher if any */}
              {savedLocalProfiles.length > 0 && (
                <div className="mt-4">
                  <span className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider block mb-1.5">
                    Saved Profiles & Default Presets
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {savedLocalProfiles.slice(0, 2).map((prof, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          switchLocalProfile(prof);
                          setStep("ready_voice");
                        }}
                        className="p-2.5 rounded-xl border border-white/[0.08] hover:border-[#0072FF] bg-[#181c2b] hover:bg-[#1f2437] text-left transition-all cursor-pointer"
                      >
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#FF1E8A] via-[#8A2BE2] to-[#0072FF] text-white text-xs font-bold flex items-center justify-center shrink-0">
                            {prof.nickname?.[0] || prof.name?.[0] || "U"}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-white block truncate">{prof.nickname || prof.name}</span>
                            <span className="text-[10px] text-[#94a3b8] block truncate">{prof.defaultEngine?.split(" (")[0]}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Default Engine Quick Start (Gemini, ChatGPT, Claude, Offline) */}
              <div className="mt-3 pt-3 border-t border-white/[0.08]">
                <span className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider block mb-1.5">
                  Or Use Default With Preferred AI Engine
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {AI_ENGINES.map(eng => (
                    <button
                      key={eng.id}
                      type="button"
                      onClick={() => {
                        useDefaultProfilePreset(eng.id);
                        setStep("ready_voice");
                      }}
                      className="p-2.5 rounded-xl border border-white/[0.08] bg-[#181c2b] hover:border-[#0072FF] hover:bg-[#1f2437] text-left transition-all cursor-pointer"
                    >
                      <span className="text-[11px] font-semibold text-white block truncate">{eng.label}</span>
                      <span className="text-[9px] text-[#94a3b8] block truncate">{eng.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider for Email Sign In */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/[0.08]" />
                </div>
                <div className="relative flex justify-center text-[10px]">
                  <span className="px-2 bg-[#121520] text-[#64748b] font-semibold uppercase">Or Email Sign In</span>
                </div>
              </div>

              <form onSubmit={handleEmailSignIn} className="space-y-3">
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#64748b] absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#181c2b] border border-white/[0.1] rounded-xl text-xs font-medium text-white placeholder-[#64748b] focus:outline-none focus:border-[#0072FF]"
                    placeholder="Email address"
                  />
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#64748b] absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-9 pr-20 py-2 bg-[#181c2b] border border-white/[0.1] rounded-xl text-xs font-medium text-white placeholder-[#64748b] focus:outline-none focus:border-[#0072FF]"
                    placeholder="Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-12 top-2.5 text-[#64748b] hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep("forgot")}
                    className="absolute right-2.5 top-2.5 text-[10px] text-[#00E5FF] font-semibold hover:underline cursor-pointer"
                  >
                    Reset
                  </button>
                </div>

                <div className="flex space-x-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-2.5 btn-diptik-primary text-white rounded-xl font-semibold text-xs shadow-sm transition-all flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>Sign In</span>}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthError("");
                      setStep("register");
                    }}
                    className="px-4 py-2.5 bg-[#181c2b] hover:bg-[#1f2437] border border-white/[0.1] text-[#e2e8f0] rounded-xl font-semibold text-xs cursor-pointer whitespace-nowrap"
                  >
                    Sign Up
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Step 4B: Create Your Own Custom Profile (Instant & Persistent) */}
        {step === "create_profile" && (
          <div className="flex-1 flex flex-col justify-between p-6 sm:p-7 overflow-y-auto text-left gemini-scroll">
            <div>
              <h3 className="font-display text-lg font-semibold text-white flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-[#00E5FF]" />
                <span>Create Your Profile</span>
              </h3>
              <p className="text-xs text-[#94a3b8] mt-0.5">
                Personalize your identity, default AI engine, and live agent voice.
              </p>

              {authError && (
                <div className="mt-3 p-2.5 bg-[#FF1744]/15 border border-[#FF1744]/35 rounded-xl text-xs text-[#ffb3c0]">
                  {authError}
                </div>
              )}

              <form onSubmit={handleCreateCustomProfile} className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-semibold text-[#94a3b8] uppercase">Full Name *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                      placeholder="e.g. Alex Rivera"
                      className="w-full px-3 py-2 bg-[#181c2b] border border-white/[0.1] rounded-xl text-xs font-medium text-white placeholder-[#64748b] mt-1 focus:outline-none focus:border-[#0072FF]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-[#94a3b8] uppercase">Call Me (Nickname)</label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={e => setNickname(e.target.value)}
                      placeholder="e.g. Alex"
                      className="w-full px-3 py-2 bg-[#181c2b] border border-white/[0.1] rounded-xl text-xs font-medium text-white placeholder-[#64748b] mt-1 focus:outline-none focus:border-[#0072FF]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-[#94a3b8] uppercase">Email (Optional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className="w-full px-3 py-2 bg-[#181c2b] border border-white/[0.1] rounded-xl text-xs font-medium text-white placeholder-[#64748b] mt-1 focus:outline-none focus:border-[#0072FF]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-[#94a3b8] uppercase block mb-1.5">
                    Default AI Engine (Gemini, ChatGPT, Claude, Local)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {AI_ENGINES.map(eng => (
                      <button
                        key={eng.id}
                        type="button"
                        onClick={() => setSelectedEngine(eng.id)}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          selectedEngine === eng.id
                            ? "bg-[#0072FF]/15 border-[#0072FF] text-white"
                            : "bg-[#181c2b] border-white/[0.08] hover:bg-[#1f2437]"
                        }`}
                      >
                        <span className="text-[11px] font-semibold text-white block">{eng.label}</span>
                        <span className="text-[9px] text-[#94a3b8] block truncate">{eng.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-semibold text-[#94a3b8] uppercase flex items-center space-x-1">
                      <Volume2 className="w-3 h-3 text-[#FF1E8A]" />
                      <span>Agent Voice</span>
                    </label>
                    <select
                      value={selectedVoice}
                      onChange={e => setSelectedVoice(e.target.value as VoicePersonaName)}
                      className="w-full px-2.5 py-2 bg-[#181c2b] border border-white/[0.1] rounded-xl text-xs font-medium text-white mt-1 focus:outline-none focus:border-[#0072FF]"
                    >
                      {VOICE_OPTIONS.map(v => (
                        <option key={v} value={v} className="bg-[#181c2b] text-white">
                          {v} (Live Voice)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-[#94a3b8] uppercase">Persona</label>
                    <select
                      value={selectedPersona}
                      onChange={e => setSelectedPersona(e.target.value)}
                      className="w-full px-2.5 py-2 bg-[#181c2b] border border-white/[0.1] rounded-xl text-xs font-medium text-white mt-1 focus:outline-none focus:border-[#0072FF]"
                    >
                      <option className="bg-[#181c2b] text-white">Default (Friendly & Helpful)</option>
                      <option className="bg-[#181c2b] text-white">Professional (Formal & Concise)</option>
                      <option className="bg-[#181c2b] text-white">Creative (Expressive & Imaginative)</option>
                      <option className="bg-[#181c2b] text-white">Academic (Detailed & Analytical)</option>
                    </select>
                  </div>
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep("signin")}
                    className="py-2.5 px-4 bg-[#181c2b] hover:bg-[#1f2437] border border-white/[0.08] text-[#cbd5e1] rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-2.5 px-4 btn-diptik-primary text-white rounded-xl font-semibold text-xs shadow-md flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Profile & Start</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Step 5: Email Account Registration */}
        {step === "register" && (
          <div className="flex-1 flex flex-col justify-between p-6 sm:p-7 overflow-y-auto text-left gemini-scroll">
            <div>
              <h3 className="font-display text-lg font-semibold text-white">Create Authenticated Account</h3>
              <p className="text-xs text-[#94a3b8] mt-0.5">Sync your profile, custom agents, and voice preferences</p>

              {authError && (
                <div className="mt-3 p-2.5 bg-[#FF1744]/15 border border-[#FF1744]/35 rounded-xl text-xs text-[#ffb3c0] space-y-1.5">
                  <p>{authError}</p>
                  {showConsoleHelp && (
                    <button
                      type="button"
                      onClick={() =>
                        createCustomLocalProfile({
                          name: name || "New User",
                          nickname: nickname || name.split(" ")[0] || "Friend",
                          email,
                          defaultEngine: selectedEngine,
                          voiceName: selectedVoice,
                          persona: selectedPersona
                        }).then(() => setStep("ready_voice"))
                      }
                      className="px-3 py-1.5 btn-diptik-primary text-white rounded-lg text-[11px] font-semibold cursor-pointer"
                    >
                      Save as Local Profile & Start
                    </button>
                  )}
                </div>
              )}

              <form onSubmit={handleRegisterEmail} className="mt-3 space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-[#94a3b8] uppercase">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-[#181c2b] border border-white/[0.1] rounded-xl text-xs font-medium text-white placeholder-[#64748b] mt-1 focus:outline-none focus:border-[#0072FF]"
                      placeholder="Your Name"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-[#94a3b8] uppercase">Nickname</label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={e => setNickname(e.target.value)}
                      className="w-full px-3 py-2 bg-[#181c2b] border border-white/[0.1] rounded-xl text-xs font-medium text-white placeholder-[#64748b] mt-1 focus:outline-none focus:border-[#0072FF]"
                      placeholder="Short name"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-[#94a3b8] uppercase">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[#181c2b] border border-white/[0.1] rounded-xl text-xs font-medium text-white placeholder-[#64748b] mt-1 focus:outline-none focus:border-[#0072FF]"
                    placeholder="you@example.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-[#94a3b8] uppercase">Default Engine</label>
                    <select
                      value={selectedEngine}
                      onChange={e => setSelectedEngine(e.target.value)}
                      className="w-full px-2 py-2 bg-[#181c2b] border border-white/[0.1] rounded-xl text-xs font-medium text-white mt-1 focus:outline-none focus:border-[#0072FF]"
                    >
                      {AI_ENGINES.map(e => (
                        <option key={e.id} value={e.id} className="bg-[#181c2b] text-white">{e.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-[#94a3b8] uppercase">Voice Persona</label>
                    <select
                      value={selectedVoice}
                      onChange={e => setSelectedVoice(e.target.value as VoicePersonaName)}
                      className="w-full px-2 py-2 bg-[#181c2b] border border-white/[0.1] rounded-xl text-xs font-medium text-white mt-1 focus:outline-none focus:border-[#0072FF]"
                    >
                      {VOICE_OPTIONS.map(v => (
                        <option key={v} value={v} className="bg-[#181c2b] text-white">{v}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-[#94a3b8] uppercase">Create Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-3 py-2 bg-[#181c2b] border border-white/[0.1] rounded-xl text-xs font-medium text-white placeholder-[#64748b] mt-1 focus:outline-none focus:border-[#0072FF]"
                    placeholder="Minimum 6 characters"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 btn-diptik-primary text-white rounded-xl font-semibold text-xs shadow-md mt-2 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Create Account & Continue</span>}
                </button>
              </form>
            </div>

            <div className="mt-3 pt-3 border-t border-white/[0.08] text-center">
              <button
                onClick={() => setStep("signin")}
                className="text-xs text-[#94a3b8] font-medium hover:text-white cursor-pointer"
              >
                Already have an account? <span className="text-[#00E5FF] font-semibold">Sign In</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 6: Ready! Talk to Agent in Real Time or Enter App */}
        {step === "ready_voice" && (
          <div className="flex-1 flex flex-col justify-between p-7 text-center min-h-[440px]">
            <div className="my-auto space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                <Check className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-white">
                  Welcome, {userProfile.nickname || userProfile.name}!
                </h3>
                <p className="text-xs text-[#94a3b8] mt-1">
                  Profile active with <strong className="text-white">{userProfile.defaultEngine}</strong> and voice <strong className="text-[#00E5FF]">{userProfile.voiceName || "Zephyr"}</strong>.
                </p>
              </div>
              {authSuccess && (
                <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-200">
                  {authSuccess}
                </div>
              )}

              <div className="p-4 bg-[#181c2b] border border-[#0072FF]/35 text-white rounded-2xl text-left space-y-3 shadow-lg">
                <div className="flex items-center space-x-2">
                  <Bot className="w-5 h-5 text-[#00E5FF]" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#00E5FF]">Real-Time Voice Agent Ready</span>
                </div>
                <p className="text-[11px] text-[#cbd5e1] leading-relaxed">
                  Talk naturally with your AI agent in real time using Gemini Live Audio, or open Assistant Setup to fine-tune permissions.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    closeAll();
                    openVoiceWithAgent(null);
                  }}
                  className="w-full py-3 px-4 btn-diptik-primary text-white rounded-xl text-xs font-semibold shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Mic className="w-4 h-4" />
                  <span>Talk to Agent in Real Time</span>
                </button>
              </div>
            </div>

            <div className="flex space-x-2 pt-3">
              <button
                type="button"
                onClick={() => {
                  closeAll();
                  setShowAssistantSetup(true);
                }}
                className="flex-1 py-2.5 px-3 bg-[#181c2b] hover:bg-[#1f2437] border border-white/[0.1] text-[#e2e8f0] rounded-xl text-xs font-semibold cursor-pointer"
              >
                Customize More
              </button>
              <button
                type="button"
                onClick={closeAll}
                className="flex-1 py-2.5 px-3 bg-[#0072FF] hover:bg-[#005ce6] text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Open Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Step 7: Forgot Password */}
        {step === "forgot" && (
          <div className="flex-1 flex flex-col justify-between p-7 text-center min-h-[400px]">
            <div>
              <Shield className="w-12 h-12 text-[#00E5FF] mx-auto mb-3" />
              <h3 className="font-display text-lg font-semibold text-white">Reset Password</h3>
              <p className="text-xs text-[#94a3b8] mt-1">Enter your registered email to receive a password reset link.</p>

              {authError && (
                <div className="mt-3 p-2.5 bg-[#FF1744]/15 border border-[#FF1744]/35 rounded-xl text-xs text-[#ffb3c0]">{authError}</div>
              )}
              {authSuccess && (
                <div className="mt-3 p-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-200">{authSuccess}</div>
              )}

              <div className="mt-5 text-left">
                <label className="text-[10px] font-semibold text-[#94a3b8] uppercase">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#181c2b] border border-white/[0.1] rounded-xl text-xs text-white placeholder-[#64748b] mt-1 focus:outline-none focus:border-[#0072FF]"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={async () => {
                  setAuthError("");
                  setAuthSuccess("");
                  try {
                    await sendPasswordReset(email);
                    setAuthSuccess(`Password reset email sent to ${email}.`);
                  } catch (err: any) {
                    setAuthError(err?.message || "Could not send reset email.");
                  }
                }}
                className="w-full py-3 btn-diptik-primary text-white rounded-xl font-semibold text-xs shadow-md cursor-pointer"
              >
                Send Reset Link
              </button>
              <button
                type="button"
                onClick={() => setStep("signin")}
                className="text-xs text-[#94a3b8] hover:text-white font-medium cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
