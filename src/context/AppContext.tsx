import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import {
  AIMode,
  ChatConversation,
  ChatMessage,
  AgentTemplate,
  AgentPlan,
  AutomationRule,
  SkillItem,
  IntegrationItem,
  KnowledgeItem,
  NoteItem,
  TaskItem,
  ActivityLogItem,
  MemoryItem,
  NotificationItem,
  UserProfile,
  PermissionItem,
  OfflineModelPackage,
  PhoneAction,
  VoicePersonaName,
  NotebookItem,
  WorkspaceView,
  ComposerTier,
  PhoneBridgeConfig
} from "../types";
import {
  initialUserProfile,
  initialPermissions,
  initialOfflinePackages,
  initialAgentTemplates,
  initialAutomations,
  initialSkills,
  initialIntegrations,
  initialKnowledge,
  initialNotes,
  initialTasks,
  initialActivityLogs,
  initialMemory,
  initialNotifications,
  initialConversations,
  initialNotebooks
} from "../data/mockData";
import { checkServerHealth, sendChatMessageStream } from "../services/api";
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  deleteUser,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  OperationType,
  handleFirestoreError,
  User
} from "../lib/firebase";

const LOCAL_PROFILE_KEY = "diptik_active_profile_v1";
const LOCAL_SAVED_PROFILES_KEY = "diptik_saved_profiles_v1";
const LOCAL_AUTH_CHOSEN_KEY = "diptik_auth_chosen_v1";
const LOCAL_CUSTOM_AGENTS_KEY = "diptik_custom_agents_v1";
const LOCAL_CONVERSATIONS_PREFIX = "diptik_conversations_v2_";
const LOCAL_NOTEBOOKS_KEY = "diptik_notebooks_v1";
const LOCAL_DEV_MODE_KEY = "diptik_developer_mode_v1";
const LOCAL_PHONE_BRIDGE_KEY = "diptik_phone_bridge_v1";

const DEFAULT_PHONE_BRIDGE_CONFIG: PhoneBridgeConfig = {
  channelType: "web_push",
  webhookUrl: "",
  telegramBotToken: "",
  telegramChatId: "",
  dailyBriefingTime: "08:00",
  autoBriefingEnabled: false,
  city: "Dhaka"
};

function getProfileStorageKey(profile: { uid?: string; email?: string; name?: string }): string {
  const raw = profile.uid || profile.email || profile.name || "default";
  return `${LOCAL_CONVERSATIONS_PREFIX}${raw.toLowerCase().replace(/[^a-z0-9@._-]/g, "_")}`;
}

function loadConversationsForProfile(profile: { uid?: string; email?: string; name?: string }): ChatConversation[] {
  if (typeof window === "undefined") return initialConversations;
  try {
    const raw = localStorage.getItem(getProfileStorageKey(profile));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return initialConversations;
}

function sanitizeForBlueprint(profile: UserProfile, uid: string) {
  const validPlans = ["Free Lite", "Pro AI Agent", "Enterprise"];
  const validStyles = ["Concise", "Balanced", "Detailed", "Professional", "Friendly"];
  const validSpeeds = ["0.8x", "1.0x", "1.2x", "1.5x"];
  const validVoices = ["Zephyr", "Puck", "Charon", "Kore", "Fenrir"];
  const validThemes = ["light", "dark", "system"];

  return {
    uid,
    name: (profile.name || "User").slice(0, 100),
    nickname: (profile.nickname || profile.name || "User").slice(0, 50),
    email: (profile.email || "user@diptik.ai").slice(0, 150),
    phone: (profile.phone || "").slice(0, 30),
    country: (profile.country || "United States").slice(0, 60),
    language: (profile.language || "English (US)").slice(0, 40),
    plan: validPlans.includes(profile.plan) ? profile.plan : "Pro AI Agent",
    avatar: (profile.avatar || initialUserProfile.avatar).slice(0, 500),
    style: validStyles.includes(profile.style) ? profile.style : "Balanced",
    speed: validSpeeds.includes(profile.speed) ? profile.speed : "1.0x",
    wakePhrase: Boolean(profile.wakePhrase),
    wakePhraseWord: (profile.wakePhraseWord || "Hey DiptiK").slice(0, 40),
    appLock: Boolean(profile.appLock),
    biometric: Boolean(profile.biometric),
    persona: (profile.persona || "Default (Friendly & Helpful)").slice(0, 120),
    defaultEngine: (profile.defaultEngine || "Gemini 4 Hydrogen (Default)").slice(0, 80),
    authProvider: (profile.authProvider || "google").slice(0, 40),
    voiceName: validVoices.includes(profile.voiceName || "Zephyr") ? profile.voiceName || "Zephyr" : "Zephyr",
    customInstructions: (profile.customInstructions || "").slice(0, 1000),
    theme: validThemes.includes(profile.theme || "light") ? profile.theme || "light" : "light",
    wakeWordEnabled: Boolean(profile.wakeWordEnabled ?? true)
  };
}

interface AppContextType {
  // Navigation & View Mode
  activeTab: "home" | "chat" | "agent" | "automations" | "profile";
  setActiveTab: (tab: any) => void;
  activeWorkspaceView: WorkspaceView;
  setActiveWorkspaceView: (view: WorkspaceView) => void;
  composerTier: ComposerTier;
  setComposerTier: (tier: ComposerTier) => void;
  profileSubTab: "profile" | "memory" | "logs" | "skills" | "integrations" | "settings" | "help";
  setProfileSubTab: (tab: any) => void;
  activeAIMode: AIMode;
  setActiveAIMode: (mode: AIMode) => void;
  isOfflineMode: boolean;
  setIsOfflineMode: (offline: boolean) => void;
  toggleOfflineMode: () => void;
  isMobileFrame: boolean;
  setIsMobileFrame: (val: boolean) => void;
  serverOnlineCapable: boolean;
  liveVoiceCapable: boolean;

  // Onboarding & Auth States
  authReady: boolean;
  firebaseUser: User | null;
  showSplash: boolean;
  setShowSplash: (val: boolean) => void;
  showOnboarding: boolean;
  setShowOnboarding: (val: boolean) => void;
  setIsOnboardingModalOpen: (val: boolean) => void;
  showAuth: boolean;
  setShowAuth: (val: boolean) => void;
  showAssistantSetup: boolean;
  setShowAssistantSetup: (val: boolean) => void;
  setIsAssistantSetupModalOpen: (val: boolean) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (val: boolean) => void;
  signInWithGoogle: () => Promise<UserProfile>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (params: {
    name: string;
    nickname: string;
    email: string;
    password: string;
    phone?: string;
    country?: string;
    defaultEngine?: string;
    voiceName?: VoicePersonaName;
    persona?: string;
  }) => Promise<{ needsVerification: boolean }>;
  sendPasswordReset: (email: string) => Promise<void>;
  createCustomLocalProfile: (params: Partial<UserProfile>) => Promise<UserProfile>;
  useDefaultProfilePreset: (engine?: string) => void;
  savedLocalProfiles: UserProfile[];
  switchLocalProfile: (profile: UserProfile) => void;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;

  // User Profile & Settings
  userProfile: UserProfile;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  permissions: PermissionItem[];
  togglePermission: (id: string) => void;
  offlinePackages: OfflineModelPackage[];
  downloadOfflinePackage: (id: string) => void;
  deleteOfflinePackage: (id: string) => void;

  // Chat Conversations
  conversations: ChatConversation[];
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  activeConversation: ChatConversation | null;
  activeChatAgent: AgentTemplate | null;
  setActiveChatAgent: (agent: AgentTemplate | null) => void;
  createNewConversation: (mode?: AIMode, title?: string, isTemporary?: boolean) => string;
  sendMessage: (
    text: string,
    mode?: AIMode,
    attachment?: any,
    options?: { webAccess?: boolean; signal?: AbortSignal; newConversation?: boolean }
  ) => Promise<void>;
  deleteConversation: (id: string) => void;
  togglePinConversation: (id: string) => void;

  // Agents
  agentTemplates: AgentTemplate[];
  addAgentTemplate: (agent: AgentTemplate) => Promise<void>;
  deleteAgentTemplate: (id: string) => Promise<void>;
  activeAgentPlan: AgentPlan | null;
  setActiveAgentPlan: (plan: AgentPlan | null) => void;
  voiceAgent: AgentTemplate | null;
  setVoiceAgent: (agent: AgentTemplate | null) => void;
  openVoiceWithAgent: (agent?: AgentTemplate | null) => void;

  // Automations
  automations: AutomationRule[];
  addAutomation: (rule: AutomationRule) => void;
  deleteAutomation: (id: string) => void;
  toggleAutomationStatus: (id: string) => void;
  runAutomationNow: (id: string) => void;

  // Skills & Integrations
  skills: SkillItem[];
  toggleSkill: (id: string) => void;
  toggleSkillStatus: (id: string) => void;
  integrations: IntegrationItem[];
  toggleIntegration: (id: string) => void;
  toggleIntegrationConnection: (id: string) => void;

  // Notebooks
  notebooks: NotebookItem[];
  activeNotebookId: string | null;
  setActiveNotebookId: (id: string | null) => void;
  addNotebook: (nb: Partial<NotebookItem>) => NotebookItem;
  updateNotebook: (id: string, updates: Partial<NotebookItem>) => void;
  deleteNotebook: (id: string) => void;

  // Knowledge, Notes & Tasks
  knowledge: KnowledgeItem[];
  knowledgeLibrary: KnowledgeItem[];
  addKnowledgeItem: (item: KnowledgeItem) => void;
  deleteKnowledgeItem: (id: string) => void;
  notes: NoteItem[];
  addNote: (note: Partial<NoteItem>) => void;
  updateNote: (id: string, updates: Partial<NoteItem>) => void;
  deleteNote: (id: string) => void;
  tasks: TaskItem[];
  addTask: (task: Partial<TaskItem>) => void;
  toggleTaskCompletion: (id: string) => void;
  deleteTask: (id: string) => void;

  // Transparency Activity Logs & Memory
  activityLogs: ActivityLogItem[];
  addActivityLog: (log: Omit<ActivityLogItem, "id" | "timestamp">) => void;
  clearActivityLogs: () => void;
  memoryItems: MemoryItem[];
  userFacts: MemoryItem[];
  addMemoryItem: (category: MemoryItem["category"], title: string, value: string) => Promise<void>;
  addUserFact: (category: any, val: string) => Promise<void>;
  deleteMemoryItem: (id: string) => Promise<void>;
  deleteUserFact: (id: string) => Promise<void>;
  clearAllMemory: () => void;

  // Notifications
  notifications: NotificationItem[];
  addNotification: (notif: Omit<NotificationItem, "id" | "timestamp" | "read">) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  deleteNotification: (id: string) => void;
  clearNotifications: () => void;

  // Modals & Active Execution Safeguards
  isVoiceModalOpen: boolean;
  setIsVoiceModalOpen: (val: boolean) => void;
  isResearchModalOpen: boolean;
  setIsResearchModalOpen: (val: boolean) => void;
  isVisionModalOpen: boolean;
  setIsVisionModalOpen: (val: boolean) => void;
  isNotesModalOpen: boolean;
  setIsNotesModalOpen: (val: boolean) => void;
  isPhoneActionsModalOpen: boolean;
  setIsPhoneActionsModalOpen: (val: boolean) => void;
  isErrorTesterModalOpen: boolean;
  setIsErrorTesterModalOpen: (val: boolean) => void;
  isSettingsModalOpen: boolean;
  setIsSettingsModalOpen: (val: boolean) => void;
  isGetAppModalOpen: boolean;
  setIsGetAppModalOpen: (val: boolean) => void;
  isUpgradeModalOpen: boolean;
  setIsUpgradeModalOpen: (val: boolean) => void;
  developerMode: boolean;
  setDeveloperMode: (val: boolean) => void;
  phoneBridgeConfig: PhoneBridgeConfig;
  updatePhoneBridgeConfig: (updates: Partial<PhoneBridgeConfig>) => void;

  // Level 1, 2, 3 Safeguard Confirmation Modal
  activeCommandConfirmation: {
    action: PhoneAction;
    level: number;
    onConfirm: () => void;
    onCancel: () => void;
  } | null;
  setActiveCommandConfirmation: (val: any) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTabState] = useState<"home" | "chat" | "agent" | "automations" | "profile">("home");
  const [profileSubTab, setProfileSubTab] = useState<"profile" | "memory" | "logs" | "skills" | "integrations" | "settings" | "help">("profile");

  const setActiveTab = (tab: any) => {
    if (["memory", "logs", "skills", "integrations", "settings", "help"].includes(tab)) {
      setProfileSubTab(tab);
      setActiveTabState("profile");
    } else if (tab === "profile") {
      setActiveTabState("profile");
      setProfileSubTab("profile");
    } else {
      setActiveTabState(tab as any);
    }
  };

  const [activeWorkspaceView, setActiveWorkspaceView] = useState<WorkspaceView>("chat");
  const [composerTier, setComposerTierState] = useState<ComposerTier>("Auto");
  const [activeAIMode, setActiveAIMode] = useState<AIMode>("Ask");
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(false);
  const [serverOnlineCapable, setServerOnlineCapable] = useState<boolean>(true);
  const [liveVoiceCapable, setLiveVoiceCapable] = useState<boolean>(true);

  const setComposerTier = (tier: ComposerTier) => {
    setComposerTierState(tier);
    if (tier === "Offline") {
      setIsOfflineMode(true);
      setActiveAIMode("Offline");
    } else {
      setIsOfflineMode(false);
      if (tier === "Pro") setActiveAIMode("Research");
      else setActiveAIMode("Ask");
    }
  };

  // Firebase Auth & Onboarding States (Never block arrival with a forced popup)
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [showSplash, setShowSplash] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [showAuth, setShowAuth] = useState<boolean>(false);
  const [showAssistantSetup, setShowAssistantSetup] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Saved local profiles for quick switching / default mode
  const [savedLocalProfiles, setSavedLocalProfiles] = useState<UserProfile[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(LOCAL_SAVED_PROFILES_KEY);
        if (raw) return JSON.parse(raw);
      } catch {}
    }
    return [initialUserProfile];
  });

  // Core Data State
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(LOCAL_PROFILE_KEY);
        if (raw) return { ...initialUserProfile, ...JSON.parse(raw) };
      } catch {}
    }
    return initialUserProfile;
  });

  const [permissions, setPermissions] = useState<PermissionItem[]>(initialPermissions);
  const [offlinePackages, setOfflinePackages] = useState<OfflineModelPackage[]>(initialOfflinePackages);
  const [conversations, setConversations] = useState<ChatConversation[]>(() =>
    loadConversationsForProfile(userProfile)
  );
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeChatAgent, setActiveChatAgent] = useState<AgentTemplate | null>(null);

  const [customAgents, setCustomAgents] = useState<AgentTemplate[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(LOCAL_CUSTOM_AGENTS_KEY);
        if (raw) return JSON.parse(raw);
      } catch {}
    }
    return [];
  });
  const agentTemplates = [...customAgents, ...initialAgentTemplates];

  const [activeAgentPlan, setActiveAgentPlan] = useState<AgentPlan | null>(null);
  const [voiceAgent, setVoiceAgent] = useState<AgentTemplate | null>(null);
  const [automations, setAutomations] = useState<AutomationRule[]>(initialAutomations);
  const [skills, setSkills] = useState<SkillItem[]>(initialSkills);
  const [integrations, setIntegrations] = useState<IntegrationItem[]>(initialIntegrations);
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>(initialKnowledge);
  const [notebooks, setNotebooks] = useState<NotebookItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(LOCAL_NOTEBOOKS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return initialNotebooks;
  });
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null);
  const [notes, setNotes] = useState<NoteItem[]>(initialNotes);
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>(initialActivityLogs);
  const [memoryItems, setMemoryItems] = useState<MemoryItem[]>(initialMemory);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);

  // Modal Triggers
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
  const [isResearchModalOpen, setIsResearchModalOpen] = useState<boolean>(false);
  const [isVisionModalOpen, setIsVisionModalOpen] = useState<boolean>(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState<boolean>(false);
  const [isPhoneActionsModalOpen, setIsPhoneActionsModalOpen] = useState<boolean>(false);
  const [isErrorTesterModalOpen, setIsErrorTesterModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isGetAppModalOpen, setIsGetAppModalOpen] = useState<boolean>(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState<boolean>(false);
  const [activeCommandConfirmation, setActiveCommandConfirmation] = useState<any>(null);

  const [developerMode, setDeveloperModeState] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem(LOCAL_DEV_MODE_KEY) === "true";
      } catch {}
    }
    return false;
  });

  const setDeveloperMode = (val: boolean) => {
    setDeveloperModeState(val);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(LOCAL_DEV_MODE_KEY, val ? "true" : "false");
      } catch {}
    }
  };

  const [phoneBridgeConfig, setPhoneBridgeConfig] = useState<PhoneBridgeConfig>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(LOCAL_PHONE_BRIDGE_KEY);
        if (raw) return { ...DEFAULT_PHONE_BRIDGE_CONFIG, ...JSON.parse(raw) };
      } catch {}
    }
    return DEFAULT_PHONE_BRIDGE_CONFIG;
  });

  const updatePhoneBridgeConfig = (updates: Partial<PhoneBridgeConfig>) => {
    setPhoneBridgeConfig(prev => {
      const next = { ...prev, ...updates };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(LOCAL_PHONE_BRIDGE_KEY, JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  };

  const profileUnsubRef = useRef<(() => void) | null>(null);
  const agentsUnsubRef = useRef<(() => void) | null>(null);
  const memoriesUnsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    checkServerHealth().then(data => {
      setServerOnlineCapable(data.onlineModeAvailable);
      setLiveVoiceCapable(Boolean(data.liveVoiceAvailable ?? data.onlineModeAvailable));
      if (!data.onlineModeAvailable) {
        setIsOfflineMode(true);
      }
    });
  }, []);

  // Persist local profile & custom agents
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(userProfile));
      } catch {}
    }
  }, [userProfile]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(LOCAL_SAVED_PROFILES_KEY, JSON.stringify(savedLocalProfiles));
      } catch {}
    }
  }, [savedLocalProfiles]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(LOCAL_NOTEBOOKS_KEY, JSON.stringify(notebooks));
      } catch {}
    }
  }, [notebooks]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const persistable = conversations
          .filter(c => !c.isTemporary)
          .map(c => ({
            ...c,
            messages: c.messages.map(m => ({ ...m, isStreaming: false, statusText: undefined }))
          }));
        localStorage.setItem(getProfileStorageKey(userProfile), JSON.stringify(persistable));
      } catch {}
    }
  }, [conversations, userProfile]);

  // Listen to Firebase Auth state & attach Firestore listeners when signed in and verified
  useEffect(() => {
    const cleanupListeners = () => {
      if (profileUnsubRef.current) { profileUnsubRef.current(); profileUnsubRef.current = null; }
      if (agentsUnsubRef.current) { agentsUnsubRef.current(); agentsUnsubRef.current = null; }
      if (memoriesUnsubRef.current) { memoriesUnsubRef.current(); memoriesUnsubRef.current = null; }
    };

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      cleanupListeners();
      setFirebaseUser(user);

      if (user) {
        setIsAuthenticated(true);
        setConversations(loadConversationsForProfile({ uid: user.uid, email: user.email || undefined }));
        setActiveConversationId(null);
        const userDocPath = `users/${user.uid}`;
        const userRef = doc(db, "users", user.uid);

        if (user.emailVerified) {
          try {
            const snap = await getDoc(userRef);
            if (!snap.exists()) {
              const newProfile: UserProfile = {
                ...initialUserProfile,
                uid: user.uid,
                name: (user.displayName || user.email?.split("@")[0] || "DiptiK User").slice(0, 100),
                nickname: (user.displayName?.split(" ")[0] || user.email?.split("@")[0] || "Friend").slice(0, 50),
                email: (user.email || "user@diptik.ai").slice(0, 150),
                avatar: user.photoURL || initialUserProfile.avatar,
                authProvider: user.providerData?.[0]?.providerId === "google.com" ? "google" : "email"
              };
              const payload = {
                ...sanitizeForBlueprint(newProfile, user.uid),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              };
              await setDoc(userRef, payload);
              setUserProfile(newProfile);
            }
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, userDocPath);
          }

          // Subscribe to user profile document
          profileUnsubRef.current = onSnapshot(
            userRef,
            (docSnap) => {
              if (docSnap.exists()) {
                const data = docSnap.data() as Partial<UserProfile>;
                setUserProfile(prev => ({
                  ...prev,
                  ...data,
                  uid: user.uid
                }));
              }
            },
            (err) => {
              handleFirestoreError(err, OperationType.GET, userDocPath);
            }
          );

          // Subscribe to user's custom agents (query enforces ownerId == uid)
          const agentsPath = `users/${user.uid}/agents`;
          const agentsQuery = query(collection(db, "users", user.uid, "agents"), where("ownerId", "==", user.uid));
          agentsUnsubRef.current = onSnapshot(
            agentsQuery,
            (snapshot) => {
              const loaded: AgentTemplate[] = snapshot.docs.map(d => {
                const data = d.data();
                return {
                  id: d.id,
                  name: data.name || "Custom Agent",
                  icon: data.icon || "Sparkles",
                  description: data.description || "",
                  goal: data.goal || "",
                  tools: Array.isArray(data.tools) ? data.tools : [],
                  memory: data.memory || "Long-term memory",
                  category: data.category || "Productivity",
                  instructions: data.instructions || "",
                  voiceName: data.voiceName || "Zephyr",
                  isCustom: true
                };
              });
              setCustomAgents(loaded);
            },
            (err) => {
              handleFirestoreError(err, OperationType.LIST, agentsPath);
            }
          );

          // Subscribe to user's memories
          const memoriesPath = `users/${user.uid}/memories`;
          const memoriesQuery = query(collection(db, "users", user.uid, "memories"), where("ownerId", "==", user.uid));
          memoriesUnsubRef.current = onSnapshot(
            memoriesQuery,
            (snapshot) => {
              if (!snapshot.empty) {
                const loadedMem: MemoryItem[] = snapshot.docs.map(d => {
                  const data = d.data();
                  return {
                    id: d.id,
                    category: data.category || "Personal",
                    title: data.title || "",
                    value: data.value || "",
                    fact: data.value || "",
                    updatedAt: "Synced"
                  };
                });
                setMemoryItems(loadedMem);
              }
            },
            (err) => {
              handleFirestoreError(err, OperationType.LIST, memoriesPath);
            }
          );
        } else {
          // Authenticated via email/password but email not verified yet -> keep local profile state
          setUserProfile(prev => ({
            ...prev,
            uid: user.uid,
            name: user.displayName || prev.name,
            email: user.email || prev.email,
            authProvider: "email"
          }));
        }
      } else {
        // Not signed into Firebase; check if user already picked default/local profile
        const chosen = typeof window !== "undefined" && localStorage.getItem(LOCAL_AUTH_CHOSEN_KEY);
        setIsAuthenticated(Boolean(chosen));
      }

      setAuthReady(true);
    });

    return () => {
      cleanupListeners();
      unsubAuth();
    };
  }, []);

  const signInWithGoogle = async (): Promise<UserProfile> => {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_AUTH_CHOSEN_KEY, "google");
    }
    const profile: UserProfile = {
      ...userProfile,
      uid: user.uid,
      name: (user.displayName || user.email?.split("@")[0] || "DiptiK User").slice(0, 100),
      nickname: (user.displayName?.split(" ")[0] || user.email?.split("@")[0] || "Friend").slice(0, 50),
      email: (user.email || "").slice(0, 150),
      avatar: user.photoURL || initialUserProfile.avatar,
      authProvider: "google"
    };
    setUserProfile(profile);
    setConversations(loadConversationsForProfile(profile));
    setActiveConversationId(null);
    setIsAuthenticated(true);
    setShowAuth(false);
    setShowOnboarding(false);
    addNotification({
      title: "Signed in with Google",
      message: `Welcome ${profile.nickname}! Your profile and custom agents sync automatically.`,
      category: "system"
    });
    return profile;
  };

  const signInWithEmail = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_AUTH_CHOSEN_KEY, "email");
    }
    const emailProf: UserProfile = {
      ...userProfile,
      uid: cred.user.uid,
      name: cred.user.displayName || email.split("@")[0] || userProfile.name,
      nickname: (cred.user.displayName?.split(" ")[0] || email.split("@")[0] || userProfile.nickname),
      email: cred.user.email || email,
      authProvider: "email"
    };
    setUserProfile(emailProf);
    setConversations(loadConversationsForProfile(emailProf));
    setActiveConversationId(null);
    setIsAuthenticated(true);
    setShowAuth(false);
    setShowOnboarding(false);
    addNotification({
      title: "Signed In",
      message: `Welcome back, ${cred.user.displayName || cred.user.email}!`,
      category: "system"
    });
  };

  const registerWithEmail = async (params: {
    name: string;
    nickname: string;
    email: string;
    password: string;
    phone?: string;
    country?: string;
    defaultEngine?: string;
    voiceName?: VoicePersonaName;
    persona?: string;
  }) => {
    const cred = await createUserWithEmailAndPassword(auth, params.email, params.password);
    await updateProfile(cred.user, { displayName: params.name });
    try {
      await sendEmailVerification(cred.user);
    } catch (e) {
      console.warn("Could not send verification email:", e);
    }
    const newProf: UserProfile = {
      ...initialUserProfile,
      uid: cred.user.uid,
      name: params.name,
      nickname: params.nickname || params.name.split(" ")[0],
      email: params.email,
      phone: params.phone || initialUserProfile.phone,
      country: params.country || initialUserProfile.country,
      defaultEngine: params.defaultEngine || initialUserProfile.defaultEngine,
      voiceName: params.voiceName || "Zephyr",
      persona: params.persona || initialUserProfile.persona,
      authProvider: "email"
    };
    setUserProfile(newProf);
    setConversations([]);
    setActiveConversationId(null);
    setSavedLocalProfiles(prev => [newProf, ...prev.filter(p => p.email !== newProf.email)]);
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_AUTH_CHOSEN_KEY, "email");
    }
    setIsAuthenticated(true);
    return { needsVerification: !cred.user.emailVerified };
  };

  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const createCustomLocalProfile = async (params: Partial<UserProfile>): Promise<UserProfile> => {
    const profile: UserProfile = {
      ...initialUserProfile,
      ...params,
      name: params.name || "Custom User",
      nickname: params.nickname || params.name?.split(" ")[0] || "Friend",
      email: params.email || `${(params.nickname || "user").toLowerCase().replace(/\s+/g, "")}@diptik.ai`,
      authProvider: auth.currentUser ? userProfile.authProvider : "default",
      defaultEngine: params.defaultEngine || "Gemini 4 Hydrogen (Default)",
      voiceName: params.voiceName || "Zephyr"
    };

    setUserProfile(profile);
    setConversations(loadConversationsForProfile(profile));
    setActiveConversationId(null);
    setSavedLocalProfiles(prev => [
      profile,
      ...prev.filter(p => p.email !== profile.email && p.name !== profile.name)
    ]);

    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_AUTH_CHOSEN_KEY, "profile");
    }
    setIsAuthenticated(true);
    setShowAuth(false);
    setShowOnboarding(false);

    if (auth.currentUser && auth.currentUser.emailVerified) {
      await updateUserProfile(profile);
    }

    addNotification({
      title: "Profile Created",
      message: `Profile "${profile.name}" is active with ${profile.defaultEngine}. Tap Voice to talk to your agent!`,
      category: "system"
    });
    return profile;
  };

  const useDefaultProfilePreset = (engine?: string) => {
    const selectedEngine = engine || "Gemini 4 Hydrogen (Default)";
    const preset: UserProfile = {
      ...initialUserProfile,
      defaultEngine: selectedEngine,
      authProvider: "default",
      nickname: selectedEngine.includes("ChatGPT")
        ? "ChatGPT User"
        : selectedEngine.includes("Claude")
        ? "Claude User"
        : "Explorer"
    };
    setUserProfile(preset);
    setConversations(loadConversationsForProfile(preset));
    setActiveConversationId(null);
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_AUTH_CHOSEN_KEY, "default");
    }
    setIsOfflineMode(selectedEngine.includes("Offline"));
    setIsAuthenticated(true);
    setShowAuth(false);
    setShowOnboarding(false);
    addNotification({
      title: "Default Profile Ready",
      message: `Active engine: ${selectedEngine}. You can create a custom profile or sign in anytime.`,
      category: "system"
    });
  };

  const switchLocalProfile = (profile: UserProfile) => {
    setUserProfile(profile);
    setConversations(loadConversationsForProfile(profile));
    setActiveConversationId(null);
    setIsOfflineMode((profile.defaultEngine || "").includes("Offline"));
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_AUTH_CHOSEN_KEY, "profile");
    }
    setIsAuthenticated(true);
    setShowAuth(false);
    addNotification({
      title: "Switched Profile",
      message: `Now using profile: ${profile.name} (${profile.defaultEngine})`,
      category: "system"
    });
  };

  const logout = async () => {
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
    } catch (e) {
      console.warn("Sign out error:", e);
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem(LOCAL_AUTH_CHOSEN_KEY);
    }
    setIsAuthenticated(false);
    setUserProfile(initialUserProfile);
    setConversations([]);
    setActiveConversationId(null);
    setCustomAgents([]);
    setShowAuth(true);
    addNotification({
      title: "Signed Out",
      message: "Select a profile or sign in to continue.",
      category: "system"
    });
  };

  const deleteAccount = async () => {
    try {
      if (auth.currentUser) {
        try {
          await deleteUser(auth.currentUser);
        } catch {
          await signOut(auth);
        }
      }
    } catch (e) {
      console.warn("Account cleanup signout notice:", e);
    }
    if (typeof window !== "undefined") {
      try {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith("diptik_")) {
            localStorage.removeItem(key);
          }
        });
      } catch {}
    }
    setIsAuthenticated(false);
    setUserProfile(initialUserProfile);
    setSavedLocalProfiles([initialUserProfile]);
    setConversations([]);
    setActiveConversationId(null);
    setCustomAgents([]);
    setNotebooks(initialNotebooks);
    setMemoryItems([]);
    setActivityLogs([]);
    setPhoneBridgeConfig(DEFAULT_PHONE_BRIDGE_CONFIG);
    setIsSettingsModalOpen(false);
    addNotification({
      title: "Account Data Deleted",
      message: "Your local workspace data and session have been permanently cleared.",
      category: "security"
    });
  };

  const toggleOfflineMode = () => {
    const next = !isOfflineMode;
    setIsOfflineMode(next);
    addActivityLog({
      command: next ? "Switch to Offline Mode" : "Switch to Online Mode",
      interpretation: next ? "Activate On-Device Lite 350M engine & SQLite index" : "Connect to cloud Gemini 4 Hydrogen LLM gateway",
      actionPerformed: `Switched AI mode to ${next ? "Offline Lite" : "Online Cloud"}`,
      serviceUsed: next ? "On-Device Engine" : "Cloud LLM Gateway",
      dataAccessed: "System Connection State",
      permissionUsed: "Level 1 Safe Action",
      result: "Success",
      confirmationLevel: 1
    });
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    const merged: UserProfile = { ...userProfile, ...updates };
    setUserProfile(merged);
    if (updates.defaultEngine) {
      setIsOfflineMode(updates.defaultEngine.includes("Offline"));
    }
    setSavedLocalProfiles(prev => {
      const idx = prev.findIndex(p => p.email === merged.email);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = merged;
        return copy;
      }
      return [merged, ...prev];
    });

    if (auth.currentUser && auth.currentUser.emailVerified) {
      const uid = auth.currentUser.uid;
      const path = `users/${uid}`;
      try {
        const userRef = doc(db, "users", uid);
        const snap = await getDoc(userRef);
        const clean = sanitizeForBlueprint(merged, uid);
        if (snap.exists()) {
          await updateDoc(userRef, {
            ...clean,
            updatedAt: serverTimestamp()
          });
        } else {
          await setDoc(userRef, {
            ...clean,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    }
  };

  const togglePermission = (id: string) => {
    setPermissions(prev =>
      prev.map(p => (p.id === id ? { ...p, granted: !p.granted } : p))
    );
  };

  const downloadOfflinePackage = (id: string) => {
    setOfflinePackages(prev =>
      prev.map(pkg => (pkg.id === id ? { ...pkg, status: "downloading", progress: 30 } : pkg))
    );

    setTimeout(() => {
      setOfflinePackages(prev =>
        prev.map(pkg => (pkg.id === id ? { ...pkg, status: "downloaded", progress: 100 } : pkg))
      );
      addNotification({
        title: "Offline Package Downloaded",
        message: "Your new offline model package is ready for use without internet.",
        category: "system"
      });
    }, 1500);
  };

  const deleteOfflinePackage = (id: string) => {
    setOfflinePackages(prev =>
      prev.map(pkg => (pkg.id === id ? { ...pkg, status: "available", progress: 0 } : pkg))
    );
  };

  const activeConversation = conversations.find(c => c.id === activeConversationId) || null;

  const createNewConversation = (mode: AIMode = activeAIMode, title?: string, isTemporary?: boolean) => {
    const newId = `conv_${Date.now()}`;
    const newConv: ChatConversation = {
      id: newId,
      title: title || `${mode} Conversation`,
      lastMessage: "New conversation started",
      updatedAt: "Just now",
      mode: isOfflineMode ? "Offline" : mode,
      isTemporary,
      messages: []
    };
    setConversations(prev => [newConv, ...prev]);
    setActiveConversationId(newId);
    return newId;
  };

  const sendMessage = async (
    text: string,
    mode: AIMode = activeAIMode,
    attachment?: any,
    options?: { webAccess?: boolean; signal?: AbortSignal; newConversation?: boolean }
  ) => {
    const effectiveMode: AIMode = isOfflineMode ? "Offline" : mode;
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: "user",
      text,
      timestamp: nowTime,
      mode: effectiveMode,
      imageAttachment: attachment?.image,
      fileAttachment: attachment?.file
    };

    const aiMsgId = `msg_ai_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const placeholderAiMsg: ChatMessage = {
      id: aiMsgId,
      sender: "ai",
      text: "",
      timestamp: nowTime,
      mode: effectiveMode,
      isStreaming: true,
      statusText: effectiveMode === "Offline" ? "Processing locally..." : "Connecting in real time..."
    };

    const existingConv = !options?.newConversation && activeConversationId
      ? conversations.find(c => c.id === activeConversationId)
      : undefined;
    let targetConvId = existingConv?.id;
    const history = (existingConv?.messages || []).map(m => ({
      sender: m.sender,
      text: m.text
    }));

    if (!targetConvId) {
      targetConvId = `conv_${Date.now()}`;
      const newConv: ChatConversation = {
        id: targetConvId,
        title: text.slice(0, 28) + (text.length > 28 ? "..." : ""),
        lastMessage: text,
        updatedAt: "Just now",
        mode: effectiveMode,
        messages: [userMsg, placeholderAiMsg]
      };
      setConversations(prev => [newConv, ...prev]);
      setActiveConversationId(targetConvId);
    } else {
      setConversations(prev =>
        prev.map(c => {
          if (c.id === targetConvId) {
            const newTitle = c.title.includes("Conversation") ? text.slice(0, 28) + (text.length > 28 ? "..." : "") : c.title;
            return {
              ...c,
              title: newTitle,
              lastMessage: text,
              updatedAt: "Just now",
              messages: [...c.messages, userMsg, placeholderAiMsg]
            };
          }
          return c;
        })
      );
    }

    const targetConv = existingConv;

    const updateAiMsg = (updater: (m: ChatMessage) => ChatMessage) => {
      setConversations(prev =>
        prev.map(c => {
          if (c.id !== targetConvId) return c;
          const updatedMsgs = c.messages.map(m => (m.id === aiMsgId ? updater(m) : m));
          const latestAi = updatedMsgs.find(m => m.id === aiMsgId);
          return {
            ...c,
            lastMessage: latestAi?.text ? latestAi.text.slice(0, 60) + (latestAi.text.length > 60 ? "..." : "") : c.lastMessage,
            updatedAt: "Just now",
            messages: updatedMsgs
          };
        })
      );
    };

    const clientDateTime = new Date().toLocaleString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
    const timezone = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "";

    try {
      await sendChatMessageStream(
        {
          message: text,
          mode: effectiveMode,
          history,
          style: userProfile.style,
          isOffline: isOfflineMode,
          webAccess: options?.webAccess ?? true,
          userProfile,
          activeAgent: activeChatAgent,
          clientDateTime,
          timezone,
          memories: targetConv?.isTemporary ? [] : memoryItems.slice(0, 5).map(m => ({ title: m.title, value: m.value }))
        },
        {
          onStatus: (status) => {
            updateAiMsg(m => ({ ...m, statusText: status }));
          },
          onChunk: (delta) => {
            updateAiMsg(m => ({
              ...m,
              text: m.text + delta,
              statusText: undefined
            }));
          },
          onDone: (meta) => {
            updateAiMsg(m => ({
              ...m,
              isStreaming: false,
              statusText: undefined,
              mode: meta.mode,
              modelUsed: meta.modelUsed,
              sources: meta.sources,
              suggestedCommands: meta.suggestedCommands,
              actionCard: meta.action
                ? {
                    action: meta.action,
                    confirmationLevel: meta.confirmationLevel,
                    executed: false
                  }
                : undefined
            }));

            addActivityLog({
              command: text,
              interpretation: meta.action ? `Phone command: ${meta.action.details}` : `AI Chat in ${effectiveMode} mode`,
              actionPerformed: meta.action ? "Prepared phone action draft" : "Streamed real-time AI response",
              serviceUsed: meta.modelUsed || "Gemini 4 Hydrogen",
              dataAccessed: meta.action ? meta.action.app : (meta.sources?.length ? "Live Web + Context" : "Conversation Context"),
              permissionUsed: meta.action ? "Level 2 Safeguard" : "Level 1 Safe",
              result: "Success",
              confirmationLevel: meta.confirmationLevel
            });

            if (meta.action && meta.confirmationLevel >= 2) {
              addNotification({
                title: `Confirmation Required (Level ${meta.confirmationLevel})`,
                message: `DiptiK AI prepared an action for ${meta.action.app}: "${meta.action.details}". Review and confirm.`,
                category: "confirmation",
                actionRequired: {
                  type: meta.action.type,
                  target: meta.action.target,
                  level: meta.confirmationLevel,
                  description: meta.action.details
                }
              });
            }
          },
          onError: (errMsg) => {
            updateAiMsg(m => ({
              ...m,
              isStreaming: false,
              statusText: undefined,
              text: m.text
                ? `${m.text}\n\n_(Stream interrupted: ${errMsg})_`
                : `Unable to get a response right now: ${errMsg}. Please try sending again.`
            }));
          }
        },
        options?.signal
      );
    } catch (err: any) {
      if (err?.name === "AbortError") {
        updateAiMsg(m => ({
          ...m,
          isStreaming: false,
          statusText: undefined,
          text: m.text || "_Generation stopped._"
        }));
      } else {
        updateAiMsg(m => ({
          ...m,
          isStreaming: false,
          statusText: undefined,
          text: m.text || `Connection error: ${err?.message || "Please check your connection and try again."}`
        }));
      }
    }
  };

  const deleteConversation = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConversationId === id) {
      const remaining = conversations.filter(c => c.id !== id);
      setActiveConversationId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const togglePinConversation = (id: string) => {
    setConversations(prev =>
      prev.map(c => (c.id === id ? { ...c, isPinned: !c.isPinned } : c))
    );
  };

  const addAgentTemplate = async (agent: AgentTemplate) => {
    const newAgent: AgentTemplate = { ...agent, isCustom: true };
    const updated = [newAgent, ...customAgents];
    setCustomAgents(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(LOCAL_CUSTOM_AGENTS_KEY, JSON.stringify(updated));
      } catch {}
    }

    if (auth.currentUser && auth.currentUser.emailVerified) {
      const uid = auth.currentUser.uid;
      const agentId = newAgent.id.replace(/[^a-zA-Z0-9_-]/g, "_");
      const path = `users/${uid}/agents/${agentId}`;
      try {
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            ...sanitizeForBlueprint(userProfile, uid),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
        const validCategories = ["Productivity", "Research", "Communication", "Lifestyle", "Developer", "Business"];
        const validVoices = ["Zephyr", "Puck", "Charon", "Kore", "Fenrir"];
        await setDoc(doc(db, "users", uid, "agents", agentId), {
          ownerId: uid,
          name: newAgent.name.slice(0, 80),
          icon: (newAgent.icon || "Sparkles").slice(0, 40),
          description: (newAgent.description || "").slice(0, 300),
          goal: (newAgent.goal || "").slice(0, 300),
          tools: (newAgent.tools || []).slice(0, 10).map(t => String(t).slice(0, 60)),
          memory: (newAgent.memory || "Long-term memory").slice(0, 150),
          category: validCategories.includes(newAgent.category) ? newAgent.category : "Productivity",
          instructions: (newAgent.instructions || "").slice(0, 1000),
          voiceName: validVoices.includes(newAgent.voiceName || "Zephyr") ? newAgent.voiceName || "Zephyr" : "Zephyr",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    }
  };

  const deleteAgentTemplate = async (id: string) => {
    const updated = customAgents.filter(a => a.id !== id);
    setCustomAgents(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(LOCAL_CUSTOM_AGENTS_KEY, JSON.stringify(updated));
      } catch {}
    }
    if (auth.currentUser && auth.currentUser.emailVerified) {
      const uid = auth.currentUser.uid;
      const agentId = id.replace(/[^a-zA-Z0-9_-]/g, "_");
      const path = `users/${uid}/agents/${agentId}`;
      try {
        await deleteDoc(doc(db, "users", uid, "agents", agentId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    }
  };

  const openVoiceWithAgent = (agent?: AgentTemplate | null) => {
    setVoiceAgent(agent || null);
    setIsVoiceModalOpen(true);
  };

  const addAutomation = (rule: AutomationRule) => {
    setAutomations(prev => [rule, ...prev]);
    addNotification({
      title: "Automation Active",
      message: `Rule "${rule.name}" is scheduled to trigger: ${rule.triggerDetails}`,
      category: "automation"
    });
  };

  const toggleAutomationStatus = (id: string) => {
    setAutomations(prev =>
      prev.map(a => (a.id === id ? { ...a, status: a.status === "active" ? "paused" : "active" } : a))
    );
  };

  const runAutomationNow = (id: string) => {
    setAutomations(prev =>
      prev.map(a => {
        if (a.id === id) {
          const newLog = {
            id: `log_${Date.now()}`,
            startTime: "Just now",
            endTime: "Just now",
            stepsCompleted: a.actions.length,
            result: "Success" as const
          };
          return { ...a, lastRun: "Just now", logs: [newLog, ...a.logs] };
        }
        return a;
      })
    );
    addNotification({
      title: "Automation Executed",
      message: "The selected automation rule ran all steps successfully.",
      category: "automation"
    });
  };

  const deleteAutomation = (id: string) => {
    setAutomations(prev => prev.filter(a => a.id !== id));
  };

  const toggleSkill = (id: string) => {
    setSkills(prev => prev.map(s => (s.id === id ? { ...s, isEnabled: !s.isEnabled } : s)));
  };

  const toggleIntegration = (id: string) => {
    setIntegrations(prev =>
      prev.map(i => {
        if (i.id === id) {
          const next = i.status === "connected" ? "disconnected" : "connected";
          return { ...i, status: next, account: next === "connected" ? userProfile.email : undefined };
        }
        return i;
      })
    );
  };

  const addKnowledgeItem = (item: KnowledgeItem) => {
    setKnowledge(prev => [item, ...prev]);
  };

  const deleteKnowledgeItem = (id: string) => {
    setKnowledge(prev => prev.filter(k => k.id !== id));
  };

  const addNote = (note: Partial<NoteItem>) => {
    const newNote: NoteItem = {
      id: `note_${Date.now()}`,
      title: note.title || "Untitled Note",
      content: note.content || "",
      tags: note.tags || ["#general"],
      createdAt: "Just now",
      updatedAt: "Just now",
      isPinned: !!note.isPinned,
      checklist: note.checklist || []
    };
    setNotes(prev => [newNote, ...prev]);
  };

  const updateNote = (id: string, updates: Partial<NoteItem>) => {
    setNotes(prev => prev.map(n => (n.id === id ? { ...n, ...updates, updatedAt: "Just now" } : n)));
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const addNotebook = (nb: Partial<NotebookItem>): NotebookItem => {
    const newNb: NotebookItem = {
      id: `nb_${Date.now()}`,
      title: nb.title?.trim() || "Untitled Notebook",
      description: nb.description?.trim() || "Workspace notes and research synthesis.",
      content: nb.content || `# ${nb.title?.trim() || "Untitled Notebook"}\n\nStart writing notes, ideas, or ask DiptiK AI 3 to synthesize your sources.`,
      tags: nb.tags && nb.tags.length > 0 ? nb.tags : ["Notes"],
      updatedAt: "Just now",
      pinned: nb.pinned ?? false
    };
    setNotebooks(prev => [newNb, ...prev]);
    return newNb;
  };

  const updateNotebook = (id: string, updates: Partial<NotebookItem>) => {
    setNotebooks(prev =>
      prev.map(nb => (nb.id === id ? { ...nb, ...updates, updatedAt: "Just now" } : nb))
    );
  };

  const deleteNotebook = (id: string) => {
    setNotebooks(prev => prev.filter(nb => nb.id !== id));
    if (activeNotebookId === id) {
      setActiveNotebookId(null);
    }
  };

  const addTask = (task: Partial<TaskItem>) => {
    const newTask: TaskItem = {
      id: `task_${Date.now()}`,
      title: task.title || "New Task",
      dueDate: task.dueDate || "Today",
      time: task.time || "12:00 PM",
      priority: task.priority || "Medium",
      status: task.status || "Today",
      aiSuggestion: task.aiSuggestion,
      reminderSet: !!task.reminderSet
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const toggleTaskCompletion = (id: string) => {
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, status: t.status === "Completed" ? "Today" : "Completed" } : t))
    );
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const addActivityLog = (log: Omit<ActivityLogItem, "id" | "timestamp">) => {
    const newLog: ActivityLogItem = {
      ...log,
      id: `act_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };
    setActivityLogs(prev => [newLog, ...prev]);
  };

  const addMemoryItem = async (category: MemoryItem["category"], title: string, value: string) => {
    const id = `mem_${Date.now()}`;
    const newItem: MemoryItem = {
      id,
      category,
      title,
      value,
      fact: value,
      updatedAt: "Just now"
    };
    setMemoryItems(prev => [newItem, ...prev]);

    if (auth.currentUser && auth.currentUser.emailVerified) {
      const uid = auth.currentUser.uid;
      const path = `users/${uid}/memories/${id}`;
      try {
        await setDoc(doc(db, "users", uid, "memories", id), {
          ownerId: uid,
          category: category.slice(0, 40),
          title: title.slice(0, 160),
          value: value.slice(0, 500),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    }
  };

  const deleteMemoryItem = async (id: string) => {
    setMemoryItems(prev => prev.filter(m => m.id !== id));
    if (auth.currentUser && auth.currentUser.emailVerified) {
      const uid = auth.currentUser.uid;
      const path = `users/${uid}/memories/${id}`;
      try {
        await deleteDoc(doc(db, "users", uid, "memories", id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    }
  };

  const clearAllMemory = () => {
    setMemoryItems([]);
    addNotification({
      title: "Memory Cleared",
      message: "All stored personal memories and user preferences have been purged.",
      category: "security"
    });
  };

  const addNotification = (notif: Omit<NotificationItem, "id" | "timestamp" | "read">) => {
    const newNotif: NotificationItem = {
      ...notif,
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: "Just now",
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const clearActivityLogs = () => {
    setActivityLogs([]);
  };

  const addUserFact = async (category: any, val: string) => {
    await addMemoryItem(category, val, val);
  };

  const deleteUserFact = async (id: string) => {
    await deleteMemoryItem(id);
  };

  const toggleSkillStatus = (id: string) => {
    toggleSkill(id);
  };

  const toggleIntegrationConnection = (id: string) => {
    toggleIntegration(id);
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        activeWorkspaceView,
        setActiveWorkspaceView,
        composerTier,
        setComposerTier,
        profileSubTab,
        setProfileSubTab,
        activeAIMode,
        setActiveAIMode,
        isOfflineMode,
        setIsOfflineMode,
        toggleOfflineMode,
        isMobileFrame,
        setIsMobileFrame,
        serverOnlineCapable,
        liveVoiceCapable,
        authReady,
        firebaseUser,
        showSplash,
        setShowSplash,
        showOnboarding,
        setShowOnboarding,
        setIsOnboardingModalOpen: setShowOnboarding,
        showAuth,
        setShowAuth,
        showAssistantSetup,
        setShowAssistantSetup,
        setIsAssistantSetupModalOpen: setShowAssistantSetup,
        isAuthenticated,
        setIsAuthenticated,
        signInWithGoogle,
        signInWithEmail,
        registerWithEmail,
        sendPasswordReset,
        createCustomLocalProfile,
        useDefaultProfilePreset,
        savedLocalProfiles,
        switchLocalProfile,
        logout,
        deleteAccount,
        userProfile,
        updateUserProfile,
        permissions,
        togglePermission,
        offlinePackages,
        downloadOfflinePackage,
        deleteOfflinePackage,
        conversations,
        activeConversationId,
        setActiveConversationId,
        activeConversation,
        activeChatAgent,
        setActiveChatAgent,
        createNewConversation,
        sendMessage,
        deleteConversation,
        togglePinConversation,
        agentTemplates,
        addAgentTemplate,
        deleteAgentTemplate,
        activeAgentPlan,
        setActiveAgentPlan,
        voiceAgent,
        setVoiceAgent,
        openVoiceWithAgent,
        automations,
        addAutomation,
        deleteAutomation,
        toggleAutomationStatus,
        runAutomationNow,
        skills,
        toggleSkill,
        toggleSkillStatus,
        integrations,
        toggleIntegration,
        toggleIntegrationConnection,
        knowledge,
        knowledgeLibrary: knowledge,
        addKnowledgeItem,
        deleteKnowledgeItem,
        notebooks,
        activeNotebookId,
        setActiveNotebookId,
        addNotebook,
        updateNotebook,
        deleteNotebook,
        notes,
        addNote,
        updateNote,
        deleteNote,
        tasks,
        addTask,
        toggleTaskCompletion,
        deleteTask,
        activityLogs,
        addActivityLog,
        clearActivityLogs,
        memoryItems,
        userFacts: memoryItems,
        addMemoryItem,
        addUserFact,
        deleteMemoryItem,
        deleteUserFact,
        clearAllMemory,
        notifications,
        addNotification,
        markNotificationRead,
        markAllNotificationsRead,
        deleteNotification,
        clearNotifications,
        isVoiceModalOpen,
        setIsVoiceModalOpen,
        isResearchModalOpen,
        setIsResearchModalOpen,
        isVisionModalOpen,
        setIsVisionModalOpen,
        isNotesModalOpen,
        setIsNotesModalOpen,
        isPhoneActionsModalOpen,
        setIsPhoneActionsModalOpen,
        isErrorTesterModalOpen,
        setIsErrorTesterModalOpen,
        isSettingsModalOpen,
        setIsSettingsModalOpen,
        isGetAppModalOpen,
        setIsGetAppModalOpen,
        isUpgradeModalOpen,
        setIsUpgradeModalOpen,
        developerMode,
        setDeveloperMode,
        phoneBridgeConfig,
        updatePhoneBridgeConfig,
        activeCommandConfirmation,
        setActiveCommandConfirmation
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
