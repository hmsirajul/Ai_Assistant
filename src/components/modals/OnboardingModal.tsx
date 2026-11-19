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
      color: "bg-[#FFF0F1] text-[#E31B23]",
      preview: "User: Explain Quantum Computing in simple terms.\nDiptiK AI: Imagine a normal computer as a light switch (On or Off)..."
    },
    {
      title: "Real-Time Voice Control",
      description: "Talk naturally to your AI agent with Gemini 3.8 Live bidirectional audio & live transcripts.",
      icon: Mic,
      color: "bg-emerald-50 text-emerald-600",
      preview: "Live Voice: 'Hey DiptiK, create a task to review Q3 metrics at 5 PM.'\nAgent: Done! I added that to your Today tasks."
    },
    {
      title: "Multi-Step AI Agents",
      description: "Launch specialized agents, build custom workflows, and execute plans step-by-step.",
      icon: Cpu,
      color: "bg-blue-50 text-blue-600",
      preview: "Plan: Gather context -> Draft summary -> Verify safeguards -> Deliver report."
    },
    {
      title: "Profiles & Default Modes",
      description: "Sign in with Google, create custom user profiles, or jump straight in with a default profile.",
      icon: WifiOff,
      color: "bg-amber-50 text-amber-600",
      preview: "Profiles synced to Cloud Firestore + Instant Default Preset access."
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[92vh] relative">
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
            className="absolute top-3.5 right-3.5 z-20 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Step 1: Splash */}
        {step === "splash" && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-[#FFF0F1] to-white min-h-[460px]">
            <div className="mb-6 animate-bounce">
              <DiptiKLogo size="xl" showText={false} />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">DiptiK AI</h1>
            <p className="text-sm font-medium text-gray-600 mt-2 max-w-xs">
              Ask. Speak. Automate. Get things done.
            </p>
            <div className="mt-12 flex flex-col items-center space-y-2">
              <RefreshCw className="w-6 h-6 text-[#E31B23] animate-spin" />
              <span className="text-xs text-gray-500 font-medium">Checking authentication & voice engine...</span>
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
              <h2 className="text-2xl font-extrabold text-gray-900">Welcome to DiptiK AI</h2>
              <p className="text-xs text-gray-600 mt-2 max-w-xs leading-relaxed">
                Sign in, create your own personalized AI profile, or start immediately with a default Gemini / ChatGPT / Offline preset.
              </p>
            </div>
            <div className="space-y-2.5 mt-8">
              <button
                onClick={() => setStep("signin")}
                className="w-full py-3.5 px-4 bg-[#E31B23] hover:bg-[#BF141B] text-white rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Sign In / Create Profile</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  useDefaultProfilePreset("Gemini 4 Hydrogen (Default)");
                  setStep("ready_voice");
                }}
                className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-2xl font-bold text-xs transition-all cursor-pointer"
              >
                Continue with Default Profile
              </button>
              <button
                onClick={() => setStep("carousel")}
                className="w-full py-2 text-xs text-gray-500 hover:text-gray-800 font-semibold transition-colors cursor-pointer"
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
                      idx === carouselIndex ? "w-6 bg-[#E31B23]" : "w-1.5 bg-gray-200"
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={() => setStep("signin")}
                className="text-xs text-gray-500 font-semibold hover:text-gray-900 cursor-pointer"
              >
                Skip
              </button>
            </div>

            <div className="my-auto py-6 flex flex-col items-center text-center">
              {React.createElement(carouselSlides[carouselIndex].icon, {
                className: `w-16 h-16 p-3 rounded-2xl mb-5 ${carouselSlides[carouselIndex].color}`
              })}
              <h3 className="text-xl font-bold text-gray-900">{carouselSlides[carouselIndex].title}</h3>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed max-w-xs">
                {carouselSlides[carouselIndex].description}
              </p>
              <div className="mt-5 w-full bg-gray-50 border border-gray-100 rounded-2xl p-3 text-left text-[11px] font-mono text-gray-700 whitespace-pre-line shadow-inner">
                {carouselSlides[carouselIndex].preview}
              </div>
            </div>

            <div className="flex space-x-3">
              {carouselIndex > 0 && (
                <button
                  onClick={() => setCarouselIndex(carouselIndex - 1)}
                  className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-bold text-xs cursor-pointer"
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
                className="flex-2 py-3 px-4 bg-[#E31B23] text-white rounded-xl font-bold text-xs shadow-md cursor-pointer"
              >
                {carouselIndex === carouselSlides.length - 1 ? "Get Started" : "Next"}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Sign In & Quick Default / Profile Launcher */}
        {step === "signin" && (
          <div className="flex-1 flex flex-col justify-between p-6 sm:p-7 overflow-y-auto text-left">
            <div>
              <div className="flex items-center space-x-2.5 mb-2">
                <DiptiKLogo size="sm" showText={false} />
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900">Sign In or Choose Profile</h3>
                  <p className="text-[11px] text-gray-500">Create your own profile or use a default preset</p>
                </div>
              </div>

              {authError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium space-y-1">
                  <p>{authError}</p>
                  {showConsoleHelp && (
                    <p className="text-[10px] text-red-600">
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
                className="mt-4 w-full py-3 px-4 bg-white hover:bg-gray-50 border border-gray-300 rounded-2xl text-xs font-extrabold text-gray-800 shadow-xs transition-all flex items-center justify-center space-x-2.5 cursor-pointer"
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
                className="mt-2.5 w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-extrabold shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Your Own Custom Profile</span>
              </button>

              {/* Saved Profiles Switcher if any */}
              {savedLocalProfiles.length > 0 && (
                <div className="mt-4">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
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
                        className="p-2.5 rounded-xl border border-gray-200 hover:border-[#E31B23] bg-gray-50 hover:bg-[#FFF0F1]/40 text-left transition-all cursor-pointer"
                      >
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-lg bg-[#E31B23] text-white text-xs font-bold flex items-center justify-center shrink-0">
                            {prof.nickname?.[0] || prof.name?.[0] || "U"}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-gray-900 block truncate">{prof.nickname || prof.name}</span>
                            <span className="text-[9px] text-gray-500 block truncate">{prof.defaultEngine?.split(" (")[0]}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Default Engine Quick Start (Gemini, ChatGPT, Claude, Offline) */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
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
                      className="p-2 rounded-xl border border-gray-200 hover:border-purple-400 hover:bg-purple-50/40 text-left transition-all cursor-pointer"
                    >
                      <span className="text-[11px] font-bold text-gray-900 block truncate">{eng.label}</span>
                      <span className="text-[9px] text-gray-500 block truncate">{eng.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider for Email Sign In */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-[10px]">
                  <span className="px-2 bg-white text-gray-400 font-bold uppercase">Or Email Sign In</span>
                </div>
              </div>

              <form onSubmit={handleEmailSignIn} className="space-y-3">
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#E31B23]"
                    placeholder="Email address"
                  />
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-9 pr-16 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#E31B23]"
                    placeholder="Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-8 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep("forgot")}
                    className="absolute right-2.5 top-2.5 text-[10px] text-[#E31B23] font-bold hover:underline"
                  >
                    Reset
                  </button>
                </div>

                <div className="flex space-x-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-2.5 bg-[#E31B23] hover:bg-[#BF141B] text-white rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>Sign In</span>}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthError("");
                      setStep("register");
                    }}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold text-xs cursor-pointer"
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
          <div className="flex-1 flex flex-col justify-between p-6 sm:p-7 overflow-y-auto text-left">
            <div>
              <h3 className="text-lg font-extrabold text-gray-900 flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-purple-600" />
                <span>Create Your Profile</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Personalize your identity, default AI engine, and live agent voice.
              </p>

              {authError && (
                <div className="mt-3 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
                  {authError}
                </div>
              )}

              <form onSubmit={handleCreateCustomProfile} className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-gray-700 uppercase">Full Name *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                      placeholder="e.g. Alex Rivera"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-700 uppercase">Call Me (Nickname)</label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={e => setNickname(e.target.value)}
                      placeholder="e.g. Alex"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium mt-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-700 uppercase">Email (Optional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium mt-1"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-700 uppercase block mb-1.5">
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
                            ? "bg-purple-50 border-purple-600 ring-1 ring-purple-600"
                            : "bg-white border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <span className="text-[11px] font-bold text-gray-900 block">{eng.label}</span>
                        <span className="text-[9px] text-gray-500 block truncate">{eng.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-gray-700 uppercase flex items-center space-x-1">
                      <Volume2 className="w-3 h-3 text-[#E31B23]" />
                      <span>Agent Voice</span>
                    </label>
                    <select
                      value={selectedVoice}
                      onChange={e => setSelectedVoice(e.target.value as VoicePersonaName)}
                      className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium mt-1"
                    >
                      {VOICE_OPTIONS.map(v => (
                        <option key={v} value={v}>
                          {v} (Live Voice)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-700 uppercase">Persona</label>
                    <select
                      value={selectedPersona}
                      onChange={e => setSelectedPersona(e.target.value)}
                      className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium mt-1"
                    >
                      <option>Default (Friendly & Helpful)</option>
                      <option>Professional (Formal & Concise)</option>
                      <option>Creative (Expressive & Imaginative)</option>
                      <option>Academic (Detailed & Analytical)</option>
                    </select>
                  </div>
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep("signin")}
                    className="py-2.5 px-4 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-2.5 px-4 bg-[#E31B23] hover:bg-[#BF141B] text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center space-x-1.5 cursor-pointer"
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
          <div className="flex-1 flex flex-col justify-between p-6 sm:p-7 overflow-y-auto text-left">
            <div>
              <h3 className="text-lg font-extrabold text-gray-900">Create Authenticated Account</h3>
              <p className="text-xs text-gray-500 mt-0.5">Sync your profile, custom agents, and voice preferences</p>

              {authError && (
                <div className="mt-3 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 space-y-1.5">
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
                      className="px-3 py-1.5 bg-[#E31B23] text-white rounded-lg text-[11px] font-bold cursor-pointer"
                    >
                      Save as Local Profile & Start
                    </button>
                  )}
                </div>
              )}

              <form onSubmit={handleRegisterEmail} className="mt-3 space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-gray-700 uppercase">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium mt-1"
                      placeholder="Your Name"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-700 uppercase">Nickname</label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={e => setNickname(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium mt-1"
                      placeholder="Short name"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-700 uppercase">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium mt-1"
                    placeholder="you@example.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-gray-700 uppercase">Default Engine</label>
                    <select
                      value={selectedEngine}
                      onChange={e => setSelectedEngine(e.target.value)}
                      className="w-full px-2 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium mt-1"
                    >
                      {AI_ENGINES.map(e => (
                        <option key={e.id} value={e.id}>{e.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-700 uppercase">Voice Persona</label>
                    <select
                      value={selectedVoice}
                      onChange={e => setSelectedVoice(e.target.value as VoicePersonaName)}
                      className="w-full px-2 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium mt-1"
                    >
                      {VOICE_OPTIONS.map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-700 uppercase">Create Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium mt-1"
                    placeholder="Minimum 6 characters"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-[#E31B23] hover:bg-[#BF141B] text-white rounded-xl font-bold text-xs shadow-md mt-2 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Create Account & Continue</span>}
                </button>
              </form>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 text-center">
              <button
                onClick={() => setStep("signin")}
                className="text-xs text-gray-600 font-semibold hover:text-gray-900 cursor-pointer"
              >
                Already have an account? <span className="text-[#E31B23]">Sign In</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 6: Ready! Talk to Agent in Real Time or Enter App */}
        {step === "ready_voice" && (
          <div className="flex-1 flex flex-col justify-between p-7 text-center min-h-[440px]">
            <div className="my-auto space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <Check className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-gray-900">
                  Welcome, {userProfile.nickname || userProfile.name}!
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  Profile active with <strong>{userProfile.defaultEngine}</strong> and voice <strong>{userProfile.voiceName || "Zephyr"}</strong>.
                </p>
              </div>
              {authSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800">
                  {authSuccess}
                </div>
              )}

              <div className="p-4 bg-gradient-to-br from-gray-900 to-indigo-950 text-white rounded-2xl text-left space-y-3 shadow-lg">
                <div className="flex items-center space-x-2">
                  <Bot className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-extrabold uppercase tracking-wider">Real-Time Voice Agent Ready</span>
                </div>
                <p className="text-[11px] text-gray-300 leading-relaxed">
                  Talk naturally with your AI agent in real time using Gemini Live Audio, or open Assistant Setup to fine-tune permissions.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    closeAll();
                    openVoiceWithAgent(null);
                  }}
                  className="w-full py-3 px-4 bg-[#E31B23] hover:bg-[#BF141B] text-white rounded-xl text-xs font-extrabold shadow-md flex items-center justify-center space-x-2 cursor-pointer"
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
                className="flex-1 py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold cursor-pointer"
              >
                Customize More
              </button>
              <button
                type="button"
                onClick={closeAll}
                className="flex-1 py-2.5 px-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold cursor-pointer"
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
              <Shield className="w-12 h-12 text-[#E31B23] mx-auto mb-3" />
              <h3 className="text-lg font-extrabold text-gray-900">Reset Password</h3>
              <p className="text-xs text-gray-500 mt-1">Enter your registered email to receive a password reset link.</p>

              {authError && (
                <div className="mt-3 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">{authError}</div>
              )}
              {authSuccess && (
                <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700">{authSuccess}</div>
              )}

              <div className="mt-5 text-left">
                <label className="text-[10px] font-bold text-gray-700 uppercase">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs mt-1"
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
                className="w-full py-3 bg-[#E31B23] text-white rounded-xl font-bold text-xs shadow-md cursor-pointer"
              >
                Send Reset Link
              </button>
              <button
                type="button"
                onClick={() => setStep("signin")}
                className="text-xs text-gray-600 font-semibold cursor-pointer"
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
