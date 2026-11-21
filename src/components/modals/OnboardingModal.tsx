import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import {
  Mail,
  Lock,
  Shield,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  X,
  LogOut,
  CheckCircle2,
  UserCheck
} from "lucide-react";
import { DiptiKLogo } from "../common/DiptiKLogo";
import { VoicePersonaName } from "../../types";
import { VOICE_PERSONA_DETAILS, VoiceAccent, loadVoiceAccent, saveVoiceAccent } from "../../lib/voice";
import { navigateToPath } from "../../lib/navigation";

export const OnboardingModal: React.FC = () => {
  const {
    authReady,
    firebaseUser,
    showAuth,
    setShowAuth,
    showOnboarding,
    setShowOnboarding,
    userProfile,
    signInWithGoogle,
    signInWithEmail,
    registerWithEmail,
    reloadAuthUser,
    resendVerificationEmail,
    sendPasswordReset,
    logout
  } = useApp();

  const isVerifiedSignedIn = Boolean(firebaseUser && firebaseUser.emailVerified);
  const isUnverifiedSignedIn = Boolean(firebaseUser && !firebaseUser.emailVerified);
  const isForcedAuthGate = authReady && !isVerifiedSignedIn;

  const [tab, setTab] = useState<"signin" | "register" | "forgot" | "verify_email">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [selectedVoice, setSelectedVoice] = useState<VoicePersonaName>("Zephyr");
  const [voiceAccent, setVoiceAccent] = useState<VoiceAccent>(() => loadVoiceAccent());
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [showConsoleHelp, setShowConsoleHelp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isUnverifiedSignedIn) {
      setTab("verify_email");
    } else if (showAuth || showOnboarding) {
      setTab("signin");
    }
    setAuthError("");
    setAuthSuccess("");
    setShowConsoleHelp(false);
  }, [isUnverifiedSignedIn, showAuth, showOnboarding]);

  // If already signed in and verified, only render when explicitly opened (e.g. Switch Account)
  if (!isForcedAuthGate && !showAuth && !showOnboarding) {
    return null;
  }

  const closeModal = () => {
    if (isForcedAuthGate) return;
    setShowAuth(false);
    setShowOnboarding(false);
  };

  const mapAuthError = (err: any): string => {
    const code = err?.code || "";
    const msg = err?.message || "";
    if (code === "auth/popup-closed-by-user") {
      return "Sign-in popup was closed before completing.";
    }
    if (code === "auth/popup-blocked") {
      return "Your browser blocked the sign-in popup. Please allow popups for this site and try again.";
    }
    if (code === "auth/unauthorized-domain") {
      const host = typeof window !== "undefined" ? window.location.hostname : "this domain";
      return `Domain "${host}" is not authorized in Firebase Console → Authentication → Settings → Authorized domains.`;
    }
    if (code === "auth/operation-not-allowed") {
      setShowConsoleHelp(true);
      return "Email/Password sign-in is not enabled in Firebase Console yet. Enable it under Authentication → Sign-in method, or use Continue with Google above.";
    }
    if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
      return "Invalid email or password. Please check your credentials or create an account.";
    }
    if (code === "auth/email-already-in-use") {
      return "An account with this email already exists. Please switch to Sign In.";
    }
    if (code === "auth/weak-password") {
      return "Password must be at least 6 characters.";
    }
    if (code === "auth/too-many-requests") {
      return "Too many attempts. Please wait a moment before trying again.";
    }
    return msg || "Authentication failed. Please try again.";
  };

  const handleGoogleLogin = async () => {
    setAuthError("");
    setAuthSuccess("");
    setShowConsoleHelp(false);
    setIsLoading(true);
    try {
      await signInWithGoogle();
      closeModal();
    } catch (err: any) {
      setAuthError(mapAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    setShowConsoleHelp(false);
    if (!email.trim().includes("@")) {
      setAuthError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setAuthError("Password must be at least 6 characters.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await signInWithEmail(email, password);
      if (res.needsVerification) {
        setTab("verify_email");
        setAuthSuccess("Please verify your email address before accessing your private workspace.");
      } else {
        closeModal();
      }
    } catch (err: any) {
      setAuthError(mapAuthError(err));
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
    if (!email.trim().includes("@")) {
      setAuthError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setAuthError("Password must be at least 6 characters.");
      return;
    }
    saveVoiceAccent(voiceAccent);
    setIsLoading(true);
    try {
      const res = await registerWithEmail({
        name: name.trim(),
        nickname: nickname.trim() || name.trim().split(" ")[0],
        email: email.trim(),
        password,
        voiceName: selectedVoice
      });
      if (res.needsVerification) {
        setTab("verify_email");
        setAuthSuccess("Account created! We sent a verification link to your inbox. Verify your email, then click Continue below.");
      } else {
        closeModal();
      }
    } catch (err: any) {
      setAuthError(mapAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    setAuthError("");
    setAuthSuccess("");
    setIsLoading(true);
    try {
      const verified = await reloadAuthUser();
      if (!verified) {
        setAuthError("Email is not verified yet. Open the verification link in your inbox, then click Continue again.");
      }
    } catch (err: any) {
      setAuthError(err?.message || "Could not verify session status.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setAuthError("");
    setAuthSuccess("");
    setIsLoading(true);
    try {
      await resendVerificationEmail();
      setAuthSuccess("Verification link resent! Please check your inbox and spam folder.");
    } catch (err: any) {
      setAuthError(mapAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    if (!email.trim().includes("@")) {
      setAuthError("Enter your account email address.");
      return;
    }
    setIsLoading(true);
    try {
      await sendPasswordReset(email);
      setAuthSuccess(`Password reset link sent to ${email.trim()}.`);
    } catch (err: any) {
      setAuthError(mapAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`${
        isForcedAuthGate
          ? "min-h-screen w-full bg-slate-50 dark:bg-[#0b0d14] flex flex-col items-center justify-between p-4 sm:p-6"
          : "fixed inset-0 z-50 bg-slate-950/55 dark:bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
      }`}
    >
      {isForcedAuthGate && <div className="hidden sm:block" aria-hidden="true" />}
      <div className="w-full max-w-md bg-white dark:bg-[#121520] rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-white/[0.1] flex flex-col max-h-[92vh] relative text-slate-900 dark:text-[#e2e8f0]">
        {!isForcedAuthGate && (
          <button
            type="button"
            onClick={closeModal}
            aria-label="Close account modal"
            className="absolute top-3.5 right-3.5 z-20 p-2 rounded-lg bg-slate-100 dark:bg-[#181c2b] hover:bg-slate-200 dark:hover:bg-[#1f2437] border border-slate-200 dark:border-white/[0.08] text-slate-500 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Case 1: Already verified & signed in -> Account Switcher / Status */}
        {isVerifiedSignedIn ? (
          <div className="p-6 sm:p-7 space-y-5 text-left">
            <div className="flex items-center gap-3 pr-8">
              <DiptiKLogo size="sm" showText={false} />
              <div>
                <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Private Account Active</h2>
                <p className="text-xs text-slate-500 dark:text-[#94a3b8]">All chats, notebooks, and memories are isolated to your account</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.08] flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF1E8A] via-[#8A2BE2] to-[#0072FF] text-white text-xs font-semibold flex items-center justify-center overflow-hidden shrink-0">
                {firebaseUser?.photoURL ? (
                  <img src={firebaseUser.photoURL} alt={userProfile.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                ) : (
                  <span>{(userProfile.nickname || userProfile.name || "U").slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{userProfile.name}</p>
                <p className="text-xs text-slate-500 dark:text-[#94a3b8] truncate">{firebaseUser?.email || userProfile.email}</p>
              </div>
              <UserCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={async () => {
                  await logout();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/15 text-red-600 dark:text-[#FF8A9E] text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out & Switch Account</span>
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-xs font-semibold text-slate-800 dark:text-white cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : tab === "verify_email" ? (
          /* Case 2: Signed up/in with Email, awaiting verification */
          <div className="p-6 sm:p-7 space-y-5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#0072FF]/10 border border-[#0072FF]/30 text-[#0072FF] dark:text-[#00E5FF] flex items-center justify-center mx-auto">
              <Mail className="w-6 h-6" />
            </div>

            <div>
              <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white">Verify your email</h2>
              <p className="text-xs text-slate-500 dark:text-[#94a3b8] mt-1.5 leading-relaxed">
                For your privacy, verify <strong className="text-slate-900 dark:text-white">{firebaseUser?.email}</strong> before accessing your private workspace.
              </p>
            </div>

            {authError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-600 dark:text-[#ffb3c0] text-left">
                {authError}
              </div>
            )}
            {authSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 text-left flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authSuccess}</span>
              </div>
            )}

            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                disabled={isLoading}
                onClick={handleCheckVerification}
                className="w-full py-2.5 px-4 btn-diptik-primary text-white rounded-xl text-xs font-semibold shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>I've Verified My Email — Continue</span>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={handleResendVerification}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-[#181c2b] hover:bg-slate-200 dark:hover:bg-[#1f2437] border border-slate-200 dark:border-white/[0.1] text-xs font-semibold text-slate-700 dark:text-[#e2e8f0] cursor-pointer"
              >
                Resend Verification Link
              </button>

              <button
                type="button"
                onClick={logout}
                className="w-full py-2 text-xs text-slate-500 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white font-medium cursor-pointer"
              >
                Sign out or use Google Sign-In instead
              </button>
            </div>
          </div>
        ) : (
          /* Case 3: Private Sign In / Sign Up / Forgot Password Gate */
          <div className="p-6 sm:p-7 overflow-y-auto gemini-scroll text-left space-y-5">
            <div className="flex items-center gap-3">
              <DiptiKLogo size="sm" showText={false} />
              <div>
                <h1 className="font-display text-lg font-semibold text-slate-900 dark:text-white">DiptiK AI 3</h1>
                <p className="text-xs text-slate-500 dark:text-[#94a3b8]">
                  Sign in to access your private, encrypted workspace
                </p>
              </div>
            </div>

            {tab !== "forgot" && (
              <div className="grid grid-cols-2 rounded-xl bg-slate-100 dark:bg-[#181c2b] p-1 border border-slate-200 dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => {
                    setTab("signin");
                    setAuthError("");
                    setAuthSuccess("");
                    setShowConsoleHelp(false);
                  }}
                  className={`py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    tab === "signin"
                      ? "bg-white dark:bg-[#23293f] text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab("register");
                    setAuthError("");
                    setAuthSuccess("");
                    setShowConsoleHelp(false);
                  }}
                  className={`py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    tab === "register"
                      ? "bg-white dark:bg-[#23293f] text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Sign Up
                </button>
              </div>
            )}

            {authError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-700 dark:text-[#ffb3c0] space-y-1.5">
                <p>{authError}</p>
                {showConsoleHelp && (
                  <p className="text-[11px] opacity-85">
                    Firebase Console → Authentication → Sign-in method → Enable Email/Password.
                  </p>
                )}
              </div>
            )}

            {authSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-700 dark:text-emerald-300">
                {authSuccess}
              </div>
            )}

            {tab !== "forgot" && (
              <>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-slate-50 dark:bg-[#181c2b] hover:bg-slate-100 dark:hover:bg-[#1f2437] border border-slate-300 dark:border-white/[0.15] rounded-xl text-xs font-semibold text-slate-900 dark:text-white shadow-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z" />
                    <path fill="#FBBC05" d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z" />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-white/[0.08]" />
                  </div>
                  <div className="relative flex justify-center text-[10px]">
                    <span className="px-2.5 bg-white dark:bg-[#121520] text-slate-400 dark:text-[#64748b] font-semibold uppercase tracking-wider">
                      Or with Email
                    </span>
                  </div>
                </div>
              </>
            )}

            {tab === "signin" && (
              <form onSubmit={handleEmailSignIn} className="space-y-3">
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 dark:text-[#64748b] absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-[#181c2b] border border-slate-300 dark:border-white/[0.1] rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748b] focus:outline-none focus:border-[#0072FF]"
                    placeholder="Email address"
                  />
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 dark:text-[#64748b] absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    className="w-full pl-9 pr-20 py-2 bg-slate-50 dark:bg-[#181c2b] border border-slate-300 dark:border-white/[0.1] rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748b] focus:outline-none focus:border-[#0072FF]"
                    placeholder="Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-12 top-2.5 text-slate-400 dark:text-[#64748b] hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthError("");
                      setAuthSuccess("");
                      setTab("forgot");
                    }}
                    className="absolute right-2.5 top-2.5 text-[10px] text-[#0072FF] dark:text-[#00E5FF] font-semibold hover:underline cursor-pointer"
                  >
                    Reset
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 btn-diptik-primary text-white rounded-xl font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Sign In</span>}
                </button>
              </form>
            )}

            {tab === "register" && (
              <form onSubmit={handleRegisterEmail} className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 dark:text-[#94a3b8] uppercase">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#181c2b] border border-slate-300 dark:border-white/[0.1] rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748b] mt-1 focus:outline-none focus:border-[#0072FF]"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 dark:text-[#94a3b8] uppercase">Nickname</label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={e => setNickname(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#181c2b] border border-slate-300 dark:border-white/[0.1] rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748b] mt-1 focus:outline-none focus:border-[#0072FF]"
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-500 dark:text-[#94a3b8] uppercase">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#181c2b] border border-slate-300 dark:border-white/[0.1] rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748b] mt-1 focus:outline-none focus:border-[#0072FF]"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-500 dark:text-[#94a3b8] uppercase">Create Password</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    minLength={6}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#181c2b] border border-slate-300 dark:border-white/[0.1] rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748b] mt-1 focus:outline-none focus:border-[#0072FF]"
                    placeholder="Minimum 6 characters"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 dark:text-[#94a3b8] uppercase">Voice Accent</label>
                    <select
                      value={voiceAccent}
                      onChange={e => setVoiceAccent(e.target.value as VoiceAccent)}
                      className="w-full px-2.5 py-2 bg-slate-50 dark:bg-[#181c2b] border border-slate-300 dark:border-white/[0.1] rounded-xl text-xs font-medium text-slate-900 dark:text-white mt-1 focus:outline-none focus:border-[#0072FF]"
                    >
                      <option value="en-GB">UK (en-GB)</option>
                      <option value="en-US">US (en-US)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 dark:text-[#94a3b8] uppercase">Voice Persona</label>
                    <select
                      value={selectedVoice}
                      onChange={e => setSelectedVoice(e.target.value as VoicePersonaName)}
                      className="w-full px-2.5 py-2 bg-slate-50 dark:bg-[#181c2b] border border-slate-300 dark:border-white/[0.1] rounded-xl text-xs font-medium text-slate-900 dark:text-white mt-1 focus:outline-none focus:border-[#0072FF]"
                    >
                      {VOICE_PERSONA_DETAILS.map(v => (
                        <option key={v.name} value={v.name}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 btn-diptik-primary text-white rounded-xl font-semibold text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Create Private Account</span>}
                </button>
              </form>
            )}

            {tab === "forgot" && (
              <form onSubmit={handlePasswordReset} className="space-y-3">
                <div className="flex items-center gap-2 text-slate-700 dark:text-[#e2e8f0]">
                  <Shield className="w-4 h-4 text-[#0072FF] dark:text-[#00E5FF]" />
                  <h2 className="text-sm font-semibold">Reset Password</h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-[#94a3b8]">
                  Enter your account email and we will send a password reset link.
                </p>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#181c2b] border border-slate-300 dark:border-white/[0.1] rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748b] focus:outline-none focus:border-[#0072FF]"
                  placeholder="you@example.com"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 btn-diptik-primary text-white rounded-xl font-semibold text-xs shadow-sm cursor-pointer"
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthError("");
                    setAuthSuccess("");
                    setTab("signin");
                  }}
                  className="w-full py-1.5 text-xs text-slate-500 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white font-medium cursor-pointer"
                >
                  Back to Sign In
                </button>
              </form>
            )}

            <div className="pt-2 border-t border-slate-200 dark:border-white/[0.06] space-y-2 text-center">
              <p className="text-[11px] text-slate-400 dark:text-[#64748b] leading-relaxed">
                Each user’s chats, notebooks, notes, and memories are strictly private and isolated by account UID.
              </p>
              {!isForcedAuthGate && (
                <div className="flex items-center justify-center gap-3 text-[11px] text-slate-500 dark:text-[#94a3b8]">
                  <a
                    href="/privacy"
                    onClick={e => {
                      e.preventDefault();
                      closeModal();
                      navigateToPath("/privacy");
                    }}
                    className="hover:text-[#0072FF] dark:hover:text-[#00E5FF] transition-colors"
                  >
                    Privacy Policy
                  </a>
                  <span aria-hidden="true">·</span>
                  <a
                    href="/terms"
                    onClick={e => {
                      e.preventDefault();
                      closeModal();
                      navigateToPath("/terms");
                    }}
                    className="hover:text-[#0072FF] dark:hover:text-[#00E5FF] transition-colors"
                  >
                    Terms of Service
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {isForcedAuthGate && (
        <footer className="w-full max-w-md pt-6 pb-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-[#94a3b8]">
          <span>© {new Date().getFullYear()} DiptiK AI Assistant</span>
          <span aria-hidden="true">·</span>
          <a
            href="/privacy"
            onClick={e => {
              e.preventDefault();
              navigateToPath("/privacy");
            }}
            className="hover:text-[#0072FF] dark:hover:text-[#00E5FF] font-medium transition-colors"
          >
            Privacy Policy
          </a>
          <span aria-hidden="true">·</span>
          <a
            href="/terms"
            onClick={e => {
              e.preventDefault();
              navigateToPath("/terms");
            }}
            className="hover:text-[#0072FF] dark:hover:text-[#00E5FF] font-medium transition-colors"
          >
            Terms of Service
          </a>
        </footer>
      )}
    </div>
  );
};
