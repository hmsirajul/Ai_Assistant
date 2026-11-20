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
  NotebookItem,
  WorkspaceView,
  ComposerTier,
  PhoneBridgeConfig,
  PhoneAction,
  LibraryDocumentItem,
  StudyWorkspaceState,
  StudyCheckItem,
  ClassroomConnectionState,
  ClassroomNotificationRecord
} from "../types";
import {
  DEFAULT_STUDY_WORKSPACE_STATE,
  clearUserLibraryBlobs,
  deleteLibraryBlob
} from "../lib/libraryStorage";
import {
  connectGoogleClassroomOAuth,
  fetchGoogleClassroomSnapshot,
  getClassroomAccessToken,
  clearClassroomAccessToken,
  dispatchBrowserNotification,
  requestBrowserNotificationPermission
} from "../lib/googleClassroom";
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
  reload,
  doc,
  getDoc,
  getDocs,
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

const LEGACY_STORAGE_KEYS = [
  "diptik_active_profile_v1",
  "diptik_saved_profiles_v1",
  "diptik_auth_chosen_v1",
  "diptik_custom_agents_v1",
  "diptik_notebooks_v1",
  "diptik_phone_bridge_v1"
];

function purgeLegacyAndUserLocalCaches(uid?: string) {
  if (typeof window === "undefined") return;
  try {
    LEGACY_STORAGE_KEYS.forEach(k => localStorage.removeItem(k));
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith("diptik_conversations_v2_")) {
        localStorage.removeItem(key);
      }
      if (!uid && key.startsWith("diptik_uid_")) {
        localStorage.removeItem(key);
      }
      if (uid && key.startsWith(`diptik_uid_${uid}_`)) {
        localStorage.removeItem(key);
      }
    });
  } catch {}
}

function getPhoneBridgeStorageKey(uid: string): string {
  return `diptik_uid_${uid}_phone_bridge_v1`;
}

const DEFAULT_PHONE_BRIDGE_CONFIG: PhoneBridgeConfig = {
  channelType: "web_push",
  webhookUrl: "",
  telegramBotToken: "",
  telegramChatId: "",
  dailyBriefingTime: "08:00",
  autoBriefingEnabled: false,
  city: "London"
};

function loadPhoneBridgeForUid(uid?: string | null): PhoneBridgeConfig {
  if (typeof window === "undefined" || !uid) return DEFAULT_PHONE_BRIDGE_CONFIG;
  try {
    const raw = localStorage.getItem(getPhoneBridgeStorageKey(uid));
    if (raw) return { ...DEFAULT_PHONE_BRIDGE_CONFIG, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_PHONE_BRIDGE_CONFIG;
}

function sanitizeDocId(rawId: string): string {
  const cleaned = (rawId || "").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 120);
  return cleaned || `doc_${Date.now()}`;
}

function stripUndefinedDeep<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function sanitizeForBlueprint(profile: UserProfile, uid: string) {
  const validPlans = ["Free Lite", "Pro AI Agent", "Enterprise"];
  const validStyles = ["Concise", "Balanced", "Detailed", "Professional", "Friendly"];
  const validSpeeds = ["0.8x", "1.0x", "1.2x", "1.5x"];
  const validVoices = ["Zephyr", "Puck", "Charon", "Kore", "Fenrir"];
  const validThemes = ["light", "dark", "system"];

  const safeName = (profile.name || "").trim().slice(0, 100) || "DiptiK User";
  const safeNick = (profile.nickname || "").trim().slice(0, 50) || safeName.split(" ")[0] || "User";
  const safeEmail = (profile.email || "").trim().slice(0, 150);

  return {
    uid,
    name: safeName,
    nickname: safeNick,
    handle: (profile.handle || safeNick.toLowerCase().replace(/[^a-z0-9_]/g, "")).slice(0, 50),
    ageRange: (profile.ageRange || "").slice(0, 30),
    email: safeEmail.length >= 3 ? safeEmail : "user@diptik.ai",
    phone: (profile.phone || "").slice(0, 30),
    country: (profile.country || "").slice(0, 60),
    language: (profile.language || "English (GB)").slice(0, 40),
    plan: validPlans.includes(profile.plan) ? profile.plan : "Free Lite",
    avatar: (profile.avatar || "").slice(0, 900),
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
    theme: validThemes.includes(profile.theme || "system") ? profile.theme || "system" : "system",
    wakeWordEnabled: Boolean(profile.wakeWordEnabled ?? true)
  };
}

function sanitizeMessagesForFirestore(messages: ChatMessage[]) {
  return messages.slice(-150).map(m => {
    const cleanMsg: Record<string, any> = {
      id: String(m.id || `msg_${Date.now()}`).slice(0, 120),
      sender: m.sender === "user" ? "user" : "ai",
      text: String(m.text || "").slice(0, 16000),
      timestamp: String(m.timestamp || "").slice(0, 40),
      mode: m.mode || "Ask"
    };
    if (m.modelUsed) cleanMsg.modelUsed = String(m.modelUsed).slice(0, 80);
    if (m.actionCard) cleanMsg.actionCard = JSON.parse(JSON.stringify(m.actionCard));
    if (Array.isArray(m.sources) && m.sources.length > 0) {
      cleanMsg.sources = m.sources.slice(0, 10).map(s => ({
        title: String(s.title || "").slice(0, 200),
        url: String(s.url || "").slice(0, 500),
        credibility: String(s.credibility || "").slice(0, 60)
      }));
    }
    if (m.fileAttachment) {
      cleanMsg.fileAttachment = {
        name: String(m.fileAttachment.name || "").slice(0, 200),
        size: String(m.fileAttachment.size || "").slice(0, 40),
        type: String(m.fileAttachment.type || "").slice(0, 80)
      };
    }
    if (Array.isArray(m.suggestedCommands) && m.suggestedCommands.length > 0) {
      cleanMsg.suggestedCommands = m.suggestedCommands.slice(0, 6).map(s => String(s).slice(0, 120));
    }
    if (typeof m.imageAttachment === "string" && m.imageAttachment.length <= 20000) {
      cleanMsg.imageAttachment = m.imageAttachment;
    }
    return cleanMsg;
  });
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
  signInWithEmail: (email: string, password: string) => Promise<{ needsVerification: boolean }>;
  registerWithEmail: (params: {
    name: string;
    nickname: string;
    email: string;
    password: string;
    phone?: string;
    country?: string;
    defaultEngine?: string;
    voiceName?: UserProfile["voiceName"];
    persona?: string;
  }) => Promise<{ needsVerification: boolean }>;
  reloadAuthUser: () => Promise<boolean>;
  resendVerificationEmail: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
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
  recordVoiceExchange: (params: {
    conversationId?: string | null;
    userText: string;
    assistantText: string;
    sources?: { title: string; url: string; credibility: string }[];
    modelUsed?: string;
    mode?: AIMode;
  }) => string | null;
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

  // Library Documents & Study Workspace (Academic, IELTS & Coders)
  libraryDocs: LibraryDocumentItem[];
  addLibraryDoc: (docItem: LibraryDocumentItem) => Promise<void>;
  updateLibraryDoc: (id: string, updates: Partial<LibraryDocumentItem>) => Promise<void>;
  deleteLibraryDoc: (id: string) => Promise<void>;
  studyWorkspace: StudyWorkspaceState;
  updateStudyWorkspace: (updater: Partial<StudyWorkspaceState> | ((prev: StudyWorkspaceState) => StudyWorkspaceState)) => void;

  // Google Classroom Connections & Smart Notifications
  classroomTokenReady: boolean;
  classroomSyncing: boolean;
  classroomSyncError: string | null;
  connectGoogleClassroom: (forceSelectAccount?: boolean) => Promise<void>;
  syncGoogleClassroomNow: (options?: { silent?: boolean; isInitialConnect?: boolean }) => Promise<void>;
  disconnectGoogleClassroom: (removeSyncedTasks?: boolean) => Promise<void>;
  updateClassroomPreferences: (
    updates: Partial<
      Pick<ClassroomConnectionState, "assignmentNotifications" | "announcementNotifications" | "browserNotifications">
    >
  ) => Promise<void>;
  markClassroomNotificationRead: (id: string) => void;
  markAllClassroomNotificationsRead: () => void;
  clearClassroomNotificationHistory: () => void;

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

  // Strict Firebase Auth States
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [showSplash, setShowSplash] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [showAuth, setShowAuth] = useState<boolean>(false);
  const [showAssistantSetup, setShowAssistantSetup] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Core Private Per-User State (ALWAYS initialized blank so zero data leaks before login)
  const [userProfile, setUserProfile] = useState<UserProfile>(initialUserProfile);
  const [permissions, setPermissions] = useState<PermissionItem[]>(initialPermissions);
  const [offlinePackages, setOfflinePackages] = useState<OfflineModelPackage[]>(initialOfflinePackages);
  const [conversations, setConversations] = useState<ChatConversation[]>(initialConversations);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeChatAgent, setActiveChatAgent] = useState<AgentTemplate | null>(null);
  const [customAgents, setCustomAgents] = useState<AgentTemplate[]>([]);
  const agentTemplates = [...customAgents, ...initialAgentTemplates];

  const [activeAgentPlan, setActiveAgentPlan] = useState<AgentPlan | null>(null);
  const [voiceAgent, setVoiceAgent] = useState<AgentTemplate | null>(null);
  const [automations, setAutomations] = useState<AutomationRule[]>(initialAutomations);
  const [skills, setSkills] = useState<SkillItem[]>(initialSkills);
  const [integrations, setIntegrations] = useState<IntegrationItem[]>(initialIntegrations);
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>(initialKnowledge);
  const [notebooks, setNotebooks] = useState<NotebookItem[]>(initialNotebooks);
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null);
  const [notes, setNotes] = useState<NoteItem[]>(initialNotes);
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>(initialActivityLogs);
  const [memoryItems, setMemoryItems] = useState<MemoryItem[]>(initialMemory);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [libraryDocs, setLibraryDocs] = useState<LibraryDocumentItem[]>([]);
  const [studyWorkspace, setStudyWorkspace] = useState<StudyWorkspaceState>(DEFAULT_STUDY_WORKSPACE_STATE);
  const studyWorkspaceRef = useRef<StudyWorkspaceState>(DEFAULT_STUDY_WORKSPACE_STATE);
  const studySyncTimerRef = useRef<number | null>(null);
  const [classroomTokenReady, setClassroomTokenReady] = useState<boolean>(false);
  const [classroomSyncing, setClassroomSyncing] = useState<boolean>(false);
  const [classroomSyncError, setClassroomSyncError] = useState<string | null>(null);
  const classroomSyncInFlightRef = useRef<boolean>(false);
  const lastAutoPollAtRef = useRef<number>(0);

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

  const [developerMode, setDeveloperModeState] = useState<boolean>(false);
  const setDeveloperMode = (val: boolean) => {
    setDeveloperModeState(val);
    const uid = auth.currentUser?.uid;
    if (typeof window !== "undefined" && uid) {
      try {
        localStorage.setItem(`diptik_uid_${uid}_dev_mode`, val ? "true" : "false");
      } catch {}
    }
  };

  const [phoneBridgeConfig, setPhoneBridgeConfig] = useState<PhoneBridgeConfig>(DEFAULT_PHONE_BRIDGE_CONFIG);
  const updatePhoneBridgeConfig = (updates: Partial<PhoneBridgeConfig>) => {
    setPhoneBridgeConfig(prev => {
      const next = { ...prev, ...updates };
      const uid = auth.currentUser?.uid;
      if (typeof window !== "undefined" && uid) {
        try {
          localStorage.setItem(getPhoneBridgeStorageKey(uid), JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  };

  const unsubsRef = useRef<(() => void)[]>([]);
  const activeUidRef = useRef<string | null>(null);
  const conversationsRef = useRef<ChatConversation[]>([]);
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  const resetPrivateWorkspaceState = () => {
    setUserProfile(initialUserProfile);
    setConversations([]);
    setActiveConversationId(null);
    setActiveChatAgent(null);
    setCustomAgents([]);
    setNotebooks([]);
    setActiveNotebookId(null);
    setNotes([]);
    setTasks([]);
    setActivityLogs([]);
    setMemoryItems([]);
    setNotifications([]);
    setAutomations([]);
    setKnowledge([]);
    setIntegrations(initialIntegrations);
    setPermissions(initialPermissions);
    setLibraryDocs([]);
    setStudyWorkspace(DEFAULT_STUDY_WORKSPACE_STATE);
    studyWorkspaceRef.current = DEFAULT_STUDY_WORKSPACE_STATE;
    clearClassroomAccessToken();
    setClassroomTokenReady(false);
    setClassroomSyncing(false);
    setClassroomSyncError(null);
    classroomSyncInFlightRef.current = false;
    setPhoneBridgeConfig(DEFAULT_PHONE_BRIDGE_CONFIG);
    setDeveloperModeState(false);
    setActiveWorkspaceView("chat");
    setIsSettingsModalOpen(false);
    setIsVoiceModalOpen(false);
    setIsResearchModalOpen(false);
    setIsVisionModalOpen(false);
    setIsNotesModalOpen(false);
    setIsPhoneActionsModalOpen(false);
    setIsErrorTesterModalOpen(false);
    setIsGetAppModalOpen(false);
    setIsUpgradeModalOpen(false);
  };

  useEffect(() => {
    purgeLegacyAndUserLocalCaches();
    checkServerHealth().then(data => {
      setServerOnlineCapable(data.onlineModeAvailable);
      setLiveVoiceCapable(Boolean(data.liveVoiceAvailable ?? data.onlineModeAvailable));
      if (!data.onlineModeAvailable) {
        setIsOfflineMode(true);
      }
    });
  }, []);

  const attachVerifiedUserListeners = async (user: User) => {
    const uid = user.uid;
    activeUidRef.current = uid;
    const userDocPath = `users/${uid}`;
    const userRef = doc(db, "users", uid);

    // Load user-scoped local preferences (non-sensitive UI prefs)
    setPhoneBridgeConfig(loadPhoneBridgeForUid(uid));
    if (typeof window !== "undefined") {
      try {
        setDeveloperModeState(localStorage.getItem(`diptik_uid_${uid}_dev_mode`) === "true");
      } catch {}
    }

    try {
      const snap = await getDoc(userRef);
      if (activeUidRef.current !== uid) return;

      if (!snap.exists()) {
        const providerId = user.providerData?.[0]?.providerId;
        const derivedName = (user.displayName || user.email?.split("@")[0] || "DiptiK User").slice(0, 100);
        const derivedNickname = (derivedName.split(/\s+/)[0] || "User").slice(0, 50);
        const newProfile: UserProfile = {
          ...initialUserProfile,
          uid,
          name: derivedName,
          nickname: derivedNickname,
          handle: derivedNickname.toLowerCase().replace(/[^a-z0-9_]/g, ""),
          email: (user.email || "").slice(0, 150),
          avatar: (user.photoURL || "").slice(0, 900),
          authProvider: providerId === "google.com" ? "google" : "email"
        };
        const payload = {
          ...sanitizeForBlueprint(newProfile, uid),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        await setDoc(userRef, payload);
        if (activeUidRef.current === uid) {
          setUserProfile(newProfile);
        }
      } else {
        const data = snap.data() as Partial<UserProfile>;
        if (activeUidRef.current === uid) {
          setUserProfile({
            ...initialUserProfile,
            ...data,
            uid
          });
        }
      }
    } catch (err) {
      console.error("Error initializing user profile in Firestore:", err);
      if (err instanceof Error && err.message.includes("Missing or insufficient permissions")) {
        handleFirestoreError(err, OperationType.WRITE, userDocPath);
      }
    }

    if (activeUidRef.current !== uid) return;

    const addSub = (unsub: () => void) => {
      unsubsRef.current.push(unsub);
    };

    // 1. Profile Listener
    addSub(
      onSnapshot(
        userRef,
        docSnap => {
          if (activeUidRef.current !== uid) return;
          if (docSnap.exists()) {
            const data = docSnap.data() as Partial<UserProfile>;
            setUserProfile(prev => ({
              ...prev,
              ...data,
              uid
            }));
          }
        },
        err => {
          handleFirestoreError(err, OperationType.GET, userDocPath);
        }
      )
    );

    // 2. Custom Agents Listener
    const agentsPath = `users/${uid}/agents`;
    addSub(
      onSnapshot(
        query(collection(db, "users", uid, "agents"), where("ownerId", "==", uid)),
        snapshot => {
          if (activeUidRef.current !== uid) return;
          const loaded: AgentTemplate[] = snapshot.docs.map(d => {
            const data = d.data();
            return {
              id: d.id,
              name: data.name || "Custom Agent",
              icon: data.icon || "Sparkles",
              description: data.description || "",
              goal: data.goal || "",
              tools: Array.isArray(data.tools) ? data.tools : [],
              memory: data.memory || "Private memory",
              category: data.category || "Productivity",
              instructions: data.instructions || "",
              voiceName: data.voiceName || "Zephyr",
              isCustom: true
            };
          });
          setCustomAgents(loaded);
        },
        err => {
          handleFirestoreError(err, OperationType.LIST, agentsPath);
        }
      )
    );

    // 3. Memories Listener (Always overwrite with user's exact memories, including empty [])
    const memoriesPath = `users/${uid}/memories`;
    addSub(
      onSnapshot(
        query(collection(db, "users", uid, "memories"), where("ownerId", "==", uid)),
        snapshot => {
          if (activeUidRef.current !== uid) return;
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
        },
        err => {
          handleFirestoreError(err, OperationType.LIST, memoriesPath);
        }
      )
    );

    // 4. Conversations Listener
    const convsPath = `users/${uid}/conversations`;
    addSub(
      onSnapshot(
        query(collection(db, "users", uid, "conversations"), where("ownerId", "==", uid)),
        snapshot => {
          if (activeUidRef.current !== uid) return;
          const loadedConvs: ChatConversation[] = snapshot.docs
            .map(d => {
              const data = d.data();
              const updatedMs = data.updatedAt?.toMillis ? data.updatedAt.toMillis() : 0;
              return {
                id: d.id,
                title: data.title || "Conversation",
                lastMessage: data.lastMessage || "",
                updatedAt: data.updatedAtLabel || "Recently",
                mode: data.mode || "Ask",
                isPinned: Boolean(data.isPinned),
                isArchived: Boolean(data.isArchived),
                messages: Array.isArray(data.messages) ? data.messages : [],
                _sortMs: updatedMs
              };
            })
            .sort((a: any, b: any) => (b._sortMs || 0) - (a._sortMs || 0))
            .map(({ _sortMs, ...rest }: any) => rest);
          setConversations(loadedConvs);
        },
        err => {
          handleFirestoreError(err, OperationType.LIST, convsPath);
        }
      )
    );

    // 5. Notebooks Listener
    const notebooksPath = `users/${uid}/notebooks`;
    addSub(
      onSnapshot(
        query(collection(db, "users", uid, "notebooks"), where("ownerId", "==", uid)),
        snapshot => {
          if (activeUidRef.current !== uid) return;
          const loadedNbs: NotebookItem[] = snapshot.docs
            .map(d => {
              const data = d.data();
              const updatedMs = data.updatedAt?.toMillis ? data.updatedAt.toMillis() : 0;
              return {
                id: d.id,
                title: data.title || "Untitled Notebook",
                description: data.description || "",
                content: data.content || "",
                tags: Array.isArray(data.tags) ? data.tags : [],
                updatedAt: data.updatedAtLabel || "Recently",
                pinned: Boolean(data.pinned),
                _sortMs: updatedMs
              };
            })
            .sort((a: any, b: any) => (b._sortMs || 0) - (a._sortMs || 0))
            .map(({ _sortMs, ...rest }: any) => rest);
          setNotebooks(loadedNbs);
        },
        err => {
          handleFirestoreError(err, OperationType.LIST, notebooksPath);
        }
      )
    );

    // 6. Notes Listener
    const notesPath = `users/${uid}/notes`;
    addSub(
      onSnapshot(
        query(collection(db, "users", uid, "notes"), where("ownerId", "==", uid)),
        snapshot => {
          if (activeUidRef.current !== uid) return;
          const loadedNotes: NoteItem[] = snapshot.docs.map(d => {
            const data = d.data();
            return {
              id: d.id,
              title: data.title || "Untitled Note",
              content: data.content || "",
              tags: Array.isArray(data.tags) ? data.tags : [],
              createdAt: data.createdAtLabel || "Recently",
              updatedAt: data.updatedAtLabel || "Recently",
              isPinned: Boolean(data.isPinned),
              checklist: Array.isArray(data.checklist) ? data.checklist : []
            };
          });
          setNotes(loadedNotes);
        },
        err => {
          handleFirestoreError(err, OperationType.LIST, notesPath);
        }
      )
    );

    // 7. Tasks Listener
    const tasksPath = `users/${uid}/tasks`;
    addSub(
      onSnapshot(
        query(collection(db, "users", uid, "tasks"), where("ownerId", "==", uid)),
        snapshot => {
          if (activeUidRef.current !== uid) return;
          const loadedTasks: TaskItem[] = snapshot.docs.map(d => {
            const data = d.data();
            return {
              id: d.id,
              title: data.title || "Task",
              dueDate: data.dueDate || "Today",
              time: data.time || "12:00 PM",
              priority: data.priority || "Medium",
              status: data.status || "Today",
              aiSuggestion: data.aiSuggestion,
              reminderSet: Boolean(data.reminderSet)
            };
          });
          setTasks(loadedTasks);
        },
        err => {
          handleFirestoreError(err, OperationType.LIST, tasksPath);
        }
      )
    );

    // 8. Activity Logs Listener
    const logsPath = `users/${uid}/activityLogs`;
    addSub(
      onSnapshot(
        query(collection(db, "users", uid, "activityLogs"), where("ownerId", "==", uid)),
        snapshot => {
          if (activeUidRef.current !== uid) return;
          const loadedLogs: ActivityLogItem[] = snapshot.docs
            .map(d => {
              const data = d.data();
              const createdMs = data.createdAt?.toMillis ? data.createdAt.toMillis() : 0;
              return {
                id: d.id,
                command: data.command || "",
                interpretation: data.interpretation || "",
                actionPerformed: data.actionPerformed || "",
                serviceUsed: data.serviceUsed || "",
                dataAccessed: data.dataAccessed || "",
                permissionUsed: data.permissionUsed || "",
                result: data.result || "Success",
                timestamp: data.timestampLabel || "Recently",
                confirmationLevel: data.confirmationLevel ?? 1,
                _sortMs: createdMs
              };
            })
            .sort((a: any, b: any) => (b._sortMs || 0) - (a._sortMs || 0))
            .map(({ _sortMs, ...rest }: any) => rest);
          setActivityLogs(loadedLogs);
        },
        err => {
          handleFirestoreError(err, OperationType.LIST, logsPath);
        }
      )
    );

    // 9. Library Documents Listener
    const libDocsPath = `users/${uid}/libraryDocs`;
    addSub(
      onSnapshot(
        query(collection(db, "users", uid, "libraryDocs"), where("ownerId", "==", uid)),
        snapshot => {
          if (activeUidRef.current !== uid) return;
          const loadedDocs: LibraryDocumentItem[] = snapshot.docs
            .map(d => {
              const data = d.data();
              const createdMs = data.createdAt?.toMillis ? data.createdAt.toMillis() : 0;
              return {
                id: d.id,
                title: data.title || "Untitled Document",
                folder: data.folder || "Books & Slides",
                fileType: data.fileType || "PDF",
                mimeType: data.mimeType || "application/pdf",
                sizeBytes: Number(data.sizeBytes || 0),
                sizeLabel: data.sizeLabel || "0 KB",
                url: data.url || undefined,
                notes: data.notes || "",
                localBlobId: data.localBlobId || undefined,
                textPreview: data.textPreview || undefined,
                uploadedAt: data.uploadedAt || "Recently",
                updatedAt: data.updatedAtLabel || "Recently",
                _sortMs: createdMs
              };
            })
            .sort((a: any, b: any) => (b._sortMs || 0) - (a._sortMs || 0))
            .map(({ _sortMs, ...rest }: any) => rest);
          setLibraryDocs(loadedDocs);
        },
        err => {
          handleFirestoreError(err, OperationType.LIST, libDocsPath);
        }
      )
    );

    // 10. Study Workspace Listener (Academic, IELTS, Coders & Google Classroom sync)
    const studyDocPath = `users/${uid}/studyWorkspaces/default`;
    addSub(
      onSnapshot(
        doc(db, "users", uid, "studyWorkspaces", "default"),
        docSnap => {
          if (activeUidRef.current !== uid) return;
          if (docSnap.exists()) {
            const data = docSnap.data();
            const mergedStudy: StudyWorkspaceState = {
              gpaScale: data.gpaScale === "5.0" ? "5.0" : "4.0",
              gpaCourses: Array.isArray(data.gpaCourses) ? data.gpaCourses : DEFAULT_STUDY_WORKSPACE_STATE.gpaCourses,
              syllabusItems: Array.isArray(data.syllabusItems) ? data.syllabusItems : DEFAULT_STUDY_WORKSPACE_STATE.syllabusItems,
              academicChecklist: Array.isArray(data.academicChecklist) ? data.academicChecklist : DEFAULT_STUDY_WORKSPACE_STATE.academicChecklist,
              academicLinks: Array.isArray(data.academicLinks) ? data.academicLinks : DEFAULT_STUDY_WORKSPACE_STATE.academicLinks,
              pomodoroMinutesTotal: Number(data.pomodoroMinutesTotal || 0),
              ieltsTargetBand: Number(data.ieltsTargetBand || 7.5),
              ieltsScores: data.ieltsScores || DEFAULT_STUDY_WORKSPACE_STATE.ieltsScores,
              ieltsPracticeLogs: Array.isArray(data.ieltsPracticeLogs) ? data.ieltsPracticeLogs : DEFAULT_STUDY_WORKSPACE_STATE.ieltsPracticeLogs,
              ieltsVocabNotes: Array.isArray(data.ieltsVocabNotes) ? data.ieltsVocabNotes : DEFAULT_STUDY_WORKSPACE_STATE.ieltsVocabNotes,
              ieltsChecklist: Array.isArray(data.ieltsChecklist) ? data.ieltsChecklist : DEFAULT_STUDY_WORKSPACE_STATE.ieltsChecklist,
              codersBookmarkedIds: Array.isArray(data.codersBookmarkedIds) ? data.codersBookmarkedIds : [],
              codersCompletedIds: Array.isArray(data.codersCompletedIds) ? data.codersCompletedIds : [],
              classroomConnection: data.classroomConnection
                ? {
                    ...DEFAULT_STUDY_WORKSPACE_STATE.classroomConnection,
                    ...data.classroomConnection,
                    courses: Array.isArray(data.classroomConnection.courses) ? data.classroomConnection.courses : []
                  }
                : DEFAULT_STUDY_WORKSPACE_STATE.classroomConnection,
              classroomNotificationHistory: Array.isArray(data.classroomNotificationHistory)
                ? data.classroomNotificationHistory
                : []
            };
            studyWorkspaceRef.current = mergedStudy;
            setStudyWorkspace(mergedStudy);
          } else {
            studyWorkspaceRef.current = DEFAULT_STUDY_WORKSPACE_STATE;
            setStudyWorkspace(DEFAULT_STUDY_WORKSPACE_STATE);
          }
        },
        err => {
          handleFirestoreError(err, OperationType.GET, studyDocPath);
        }
      )
    );
  };

  // Listen strictly to Firebase Auth state; NEVER load shared/fallback data for unauthenticated visitors
  useEffect(() => {
    const cleanupListeners = () => {
      unsubsRef.current.forEach(unsub => {
        try {
          unsub();
        } catch {}
      });
      unsubsRef.current = [];
    };

    const unsubAuth = onAuthStateChanged(auth, async user => {
      cleanupListeners();
      activeUidRef.current = null;
      resetPrivateWorkspaceState();
      setFirebaseUser(user);

      try {
        if (user) {
          if (user.emailVerified) {
            setIsAuthenticated(true);
            await attachVerifiedUserListeners(user);
          } else {
            // Unverified email/password user: keep isolated on verify gate without exposing any data
            setIsAuthenticated(false);
            setUserProfile({
              ...initialUserProfile,
              uid: user.uid,
              name: user.displayName || user.email?.split("@")[0] || "DiptiK User",
              nickname: (user.displayName?.split(" ")[0] || user.email?.split("@")[0] || "User").slice(0, 50),
              email: user.email || "",
              authProvider: "email"
            });
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error("Auth state initialization error:", err);
      } finally {
        setAuthReady(true);
      }
    });

    return () => {
      cleanupListeners();
      unsubAuth();
    };
  }, []);

  const signInWithGoogle = async (): Promise<UserProfile> => {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const derivedName = (user.displayName || user.email?.split("@")[0] || "DiptiK User").slice(0, 100);
    const profile: UserProfile = {
      ...initialUserProfile,
      uid: user.uid,
      name: derivedName,
      nickname: (derivedName.split(/\s+/)[0] || "User").slice(0, 50),
      email: (user.email || "").slice(0, 150),
      avatar: (user.photoURL || "").slice(0, 900),
      authProvider: "google"
    };
    setIsAuthenticated(Boolean(user.emailVerified));
    setShowAuth(false);
    setShowOnboarding(false);
    addNotification({
      title: "Signed in with Google",
      message: `Welcome ${profile.nickname}! Your private workspace is ready.`,
      category: "system"
    });
    return profile;
  };

  const signInWithEmail = async (email: string, password: string): Promise<{ needsVerification: boolean }> => {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    const needsVerification = !cred.user.emailVerified;
    if (!needsVerification) {
      setIsAuthenticated(true);
      setShowAuth(false);
      setShowOnboarding(false);
      addNotification({
        title: "Signed In",
        message: `Welcome back, ${cred.user.displayName || cred.user.email}!`,
        category: "system"
      });
    } else {
      setIsAuthenticated(false);
    }
    return { needsVerification };
  };

  const registerWithEmail = async (params: {
    name: string;
    nickname: string;
    email: string;
    password: string;
    phone?: string;
    country?: string;
    defaultEngine?: string;
    voiceName?: UserProfile["voiceName"];
    persona?: string;
  }) => {
    const cred = await createUserWithEmailAndPassword(auth, params.email.trim(), params.password);
    await updateProfile(cred.user, { displayName: params.name.trim() });
    try {
      await sendEmailVerification(cred.user);
    } catch (e) {
      console.warn("Could not send verification email:", e);
    }
    const newProf: UserProfile = {
      ...initialUserProfile,
      uid: cred.user.uid,
      name: params.name.trim(),
      nickname: (params.nickname || params.name.trim().split(" ")[0] || "User").slice(0, 50),
      email: params.email.trim(),
      phone: params.phone || "",
      country: params.country || "",
      defaultEngine: params.defaultEngine || initialUserProfile.defaultEngine,
      voiceName: params.voiceName || "Zephyr",
      persona: params.persona || initialUserProfile.persona,
      authProvider: "email"
    };
    setUserProfile(newProf);
    setIsAuthenticated(Boolean(cred.user.emailVerified));
    return { needsVerification: !cred.user.emailVerified };
  };

  const reloadAuthUser = async (): Promise<boolean> => {
    if (!auth.currentUser) return false;
    await reload(auth.currentUser);
    if (auth.currentUser.emailVerified) {
      await auth.currentUser.getIdToken(true);
      setFirebaseUser(auth.currentUser);
      setIsAuthenticated(true);
      setShowAuth(false);
      setShowOnboarding(false);
      if (activeUidRef.current !== auth.currentUser.uid) {
        await attachVerifiedUserListeners(auth.currentUser);
      }
      return true;
    }
    return false;
  };

  const resendVerificationEmail = async (): Promise<void> => {
    if (!auth.currentUser) throw new Error("No active user session.");
    await sendEmailVerification(auth.currentUser);
  };

  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const logout = async () => {
    const currentUid = auth.currentUser?.uid;
    unsubsRef.current.forEach(unsub => {
      try {
        unsub();
      } catch {}
    });
    unsubsRef.current = [];
    activeUidRef.current = null;

    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
    } catch (e) {
      console.warn("Sign out error:", e);
    }
    purgeLegacyAndUserLocalCaches(currentUid);
    resetPrivateWorkspaceState();
    setFirebaseUser(null);
    setIsAuthenticated(false);
    setShowAuth(true);
  };

  const deleteAccount = async () => {
    const currentUser = auth.currentUser;
    const uid = currentUser?.uid;

    unsubsRef.current.forEach(unsub => {
      try {
        unsub();
      } catch {}
    });
    unsubsRef.current = [];
    activeUidRef.current = null;

    if (currentUser && uid && currentUser.emailVerified) {
      const subcollections = ["agents", "memories", "conversations", "notebooks", "notes", "tasks", "activityLogs", "libraryDocs", "studyWorkspaces"];
      for (const sub of subcollections) {
        try {
          const snap = await getDocs(query(collection(db, "users", uid, sub), where("ownerId", "==", uid)));
          for (const d of snap.docs) {
            await deleteDoc(doc(db, "users", uid, sub, d.id));
          }
        } catch (err) {
          console.warn(`Cleanup skipped for ${sub}:`, err);
        }
      }
      try {
        await deleteDoc(doc(db, "users", uid));
      } catch (err) {
        console.warn("User doc delete notice:", err);
      }
    }

    if (uid) {
      await clearUserLibraryBlobs(uid);
    }

    if (currentUser) {
      try {
        await deleteUser(currentUser);
      } catch {
        await signOut(auth);
      }
    }

    purgeLegacyAndUserLocalCaches(uid);
    resetPrivateWorkspaceState();
    setFirebaseUser(null);
    setIsAuthenticated(false);
    setIsSettingsModalOpen(false);
    setShowAuth(true);
  };

  const toggleOfflineMode = () => {
    const next = !isOfflineMode;
    setIsOfflineMode(next);
    addActivityLog({
      command: next ? "Switch to Offline Mode" : "Switch to Online Mode",
      interpretation: next ? "Activate On-Device Lite 350M engine & local index" : "Connect to cloud Gemini 4 Hydrogen LLM gateway",
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
    setPermissions(prev => prev.map(p => (p.id === id ? { ...p, granted: !p.granted } : p)));
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

  const persistConversationToFirestore = async (conv: ChatConversation, isNew = false) => {
    if (conv.isTemporary) return;
    if (!auth.currentUser || !auth.currentUser.emailVerified) return;
    const uid = auth.currentUser.uid;
    const convId = sanitizeDocId(conv.id);
    const path = `users/${uid}/conversations/${convId}`;
    const docRef = doc(db, "users", uid, "conversations", convId);

    const basePayload = {
      ownerId: uid,
      title: String(conv.title || "Conversation").slice(0, 200),
      lastMessage: String(conv.lastMessage || "").slice(0, 500),
      updatedAtLabel: String(conv.updatedAt || "Just now").slice(0, 60),
      mode: conv.mode || "Ask",
      isPinned: Boolean(conv.isPinned),
      isArchived: Boolean(conv.isArchived),
      messages: sanitizeMessagesForFirestore(conv.messages),
      updatedAt: serverTimestamp()
    };

    try {
      if (isNew) {
        await setDoc(docRef, {
          ...basePayload,
          createdAt: serverTimestamp()
        });
      } else {
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          await updateDoc(docRef, basePayload);
        } else {
          await setDoc(docRef, {
            ...basePayload,
            createdAt: serverTimestamp()
          });
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
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
    if (!isTemporary) {
      void persistConversationToFirestore(newConv, true);
    }
    return newId;
  };

  const recordVoiceExchange = (params: {
    conversationId?: string | null;
    userText: string;
    assistantText: string;
    sources?: { title: string; url: string; credibility: string }[];
    modelUsed?: string;
    mode?: AIMode;
  }): string | null => {
    if (!auth.currentUser || !auth.currentUser.emailVerified) return null;

    const cleanUser = (params.userText || "").trim();
    const cleanAi = (params.assistantText || "").trim();
    if (!cleanUser && !cleanAi) return null;

    const effectiveMode: AIMode = params.mode || (isOfflineMode ? "Offline" : "Ask");
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newMsgs: ChatMessage[] = [];

    if (cleanUser) {
      newMsgs.push({
        id: `msg_vu_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        sender: "user",
        text: cleanUser,
        timestamp: nowTime,
        mode: effectiveMode
      });
    }
    if (cleanAi) {
      newMsgs.push({
        id: `msg_va_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        sender: "ai",
        text: cleanAi,
        timestamp: nowTime,
        mode: effectiveMode,
        modelUsed: params.modelUsed || "Gemini 3.8 Live (Voice)",
        sources: params.sources && params.sources.length > 0 ? params.sources : undefined
      });
    }

    const existing = params.conversationId
      ? conversationsRef.current.find(c => c.id === params.conversationId)
      : undefined;

    if (!existing) {
      const targetId = params.conversationId || `conv_voice_${Date.now()}`;
      const titleSeed = cleanUser || cleanAi || "Voice Conversation";
      const title = `Voice: ${titleSeed.slice(0, 32)}${titleSeed.length > 32 ? "..." : ""}`;
      const summary = (cleanAi || cleanUser).slice(0, 120);
      const created: ChatConversation = {
        id: targetId,
        title,
        lastMessage: summary,
        updatedAt: "Just now",
        mode: effectiveMode,
        messages: newMsgs
      };
      conversationsRef.current = [created, ...conversationsRef.current];
      setConversations(conversationsRef.current);
      setActiveConversationId(targetId);
      void persistConversationToFirestore(created, true);
      return targetId;
    }

    const updated: ChatConversation = {
      ...existing,
      lastMessage: (cleanAi || cleanUser || existing.lastMessage).slice(0, 120),
      updatedAt: "Just now",
      messages: [...existing.messages, ...newMsgs]
    };
    conversationsRef.current = conversationsRef.current.map(c => (c.id === existing.id ? updated : c));
    setConversations(conversationsRef.current);
    void persistConversationToFirestore(updated, false);
    return existing.id;
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

    const existingConv =
      !options?.newConversation && activeConversationId
        ? conversationsRef.current.find(c => c.id === activeConversationId)
        : undefined;
    let targetConvId = existingConv?.id;
    const history = (existingConv?.messages || []).map(m => ({
      sender: m.sender,
      text: m.text
    }));

    let workingConv: ChatConversation;
    if (!targetConvId) {
      targetConvId = `conv_${Date.now()}`;
      workingConv = {
        id: targetConvId,
        title: text.slice(0, 28) + (text.length > 28 ? "..." : ""),
        lastMessage: text.slice(0, 120),
        updatedAt: "Just now",
        mode: effectiveMode,
        messages: [userMsg, placeholderAiMsg]
      };
      setConversations(prev => [workingConv, ...prev]);
      setActiveConversationId(targetConvId);
    } else {
      const newTitle = existingConv!.title.includes("Conversation")
        ? text.slice(0, 28) + (text.length > 28 ? "..." : "")
        : existingConv!.title;
      workingConv = {
        ...existingConv!,
        title: newTitle,
        lastMessage: text.slice(0, 120),
        updatedAt: "Just now",
        messages: [...existingConv!.messages, userMsg, placeholderAiMsg]
      };
      setConversations(prev => prev.map(c => (c.id === targetConvId ? workingConv : c)));
    }

    const updateAiMsg = (updater: (m: ChatMessage) => ChatMessage) => {
      setConversations(prev =>
        prev.map(c => {
          if (c.id !== targetConvId) return c;
          const updatedMsgs = c.messages.map(m => (m.id === aiMsgId ? updater(m) : m));
          const latestAi = updatedMsgs.find(m => m.id === aiMsgId);
          const nextConv: ChatConversation = {
            ...c,
            lastMessage: latestAi?.text ? latestAi.text.slice(0, 60) + (latestAi.text.length > 60 ? "..." : "") : c.lastMessage,
            updatedAt: "Just now",
            messages: updatedMsgs
          };
          workingConv = nextConv;
          return nextConv;
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
          memories: existingConv?.isTemporary ? [] : memoryItems.slice(0, 5).map(m => ({ title: m.title, value: m.value }))
        },
        {
          onStatus: status => {
            updateAiMsg(m => ({ ...m, statusText: status }));
          },
          onChunk: delta => {
            updateAiMsg(m => ({
              ...m,
              text: m.text + delta,
              statusText: undefined
            }));
          },
          onDone: meta => {
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

            // Persist finalized conversation to Firestore for this user only
            setTimeout(() => {
              const latest = conversationsRef.current.find(c => c.id === targetConvId) || workingConv;
              if (latest && !latest.isTemporary) {
                void persistConversationToFirestore(latest, !existingConv);
              }
            }, 0);

            addActivityLog({
              command: text,
              interpretation: meta.action ? `Phone command: ${meta.action.details}` : `AI Chat in ${effectiveMode} mode`,
              actionPerformed: meta.action ? "Prepared phone action draft" : "Streamed real-time AI response",
              serviceUsed: meta.modelUsed || "Gemini 4 Hydrogen",
              dataAccessed: meta.action ? meta.action.app : meta.sources?.length ? "Live Web + Context" : "Conversation Context",
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
          onError: errMsg => {
            updateAiMsg(m => ({
              ...m,
              isStreaming: false,
              statusText: undefined,
              text: m.text
                ? `${m.text}\n\n_(Stream interrupted: ${errMsg})_`
                : `Unable to get a response right now: ${errMsg}. Please try sending again.`
            }));
            setTimeout(() => {
              const latest = conversationsRef.current.find(c => c.id === targetConvId) || workingConv;
              if (latest && !latest.isTemporary) {
                void persistConversationToFirestore(latest, !existingConv);
              }
            }, 0);
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
      setTimeout(() => {
        const latest = conversationsRef.current.find(c => c.id === targetConvId) || workingConv;
        if (latest && !latest.isTemporary) {
          void persistConversationToFirestore(latest, !existingConv);
        }
      }, 0);
    }
  };

  const deleteConversation = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConversationId === id) {
      const remaining = conversations.filter(c => c.id !== id);
      setActiveConversationId(remaining.length > 0 ? remaining[0].id : null);
    }
    if (auth.currentUser && auth.currentUser.emailVerified) {
      const uid = auth.currentUser.uid;
      const convId = sanitizeDocId(id);
      const path = `users/${uid}/conversations/${convId}`;
      deleteDoc(doc(db, "users", uid, "conversations", convId)).catch(err =>
        handleFirestoreError(err, OperationType.DELETE, path)
      );
    }
  };

  const togglePinConversation = (id: string) => {
    let updatedConv: ChatConversation | undefined;
    setConversations(prev =>
      prev.map(c => {
        if (c.id === id) {
          updatedConv = { ...c, isPinned: !c.isPinned };
          return updatedConv;
        }
        return c;
      })
    );
    if (updatedConv && !updatedConv.isTemporary) {
      void persistConversationToFirestore(updatedConv, false);
    }
  };

  const addAgentTemplate = async (agent: AgentTemplate) => {
    const newAgent: AgentTemplate = { ...agent, isCustom: true };
    setCustomAgents(prev => [newAgent, ...prev]);

    if (auth.currentUser && auth.currentUser.emailVerified) {
      const uid = auth.currentUser.uid;
      const agentId = sanitizeDocId(newAgent.id);
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
          memory: (newAgent.memory || "Private memory").slice(0, 150),
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
    setCustomAgents(prev => prev.filter(a => a.id !== id));
    if (auth.currentUser && auth.currentUser.emailVerified) {
      const uid = auth.currentUser.uid;
      const agentId = sanitizeDocId(id);
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
    const id = `note_${Date.now()}`;
    const newNote: NoteItem = {
      id,
      title: note.title || "Untitled Note",
      content: note.content || "",
      tags: note.tags || ["#general"],
      createdAt: "Just now",
      updatedAt: "Just now",
      isPinned: !!note.isPinned,
      checklist: note.checklist || []
    };
    setNotes(prev => [newNote, ...prev]);

    if (auth.currentUser && auth.currentUser.emailVerified) {
      const uid = auth.currentUser.uid;
      const noteId = sanitizeDocId(id);
      const path = `users/${uid}/notes/${noteId}`;
      setDoc(doc(db, "users", uid, "notes", noteId), {
        ownerId: uid,
        title: newNote.title.slice(0, 200),
        content: newNote.content.slice(0, 10000),
        tags: newNote.tags.slice(0, 10).map(t => String(t).slice(0, 40)),
        createdAtLabel: newNote.createdAt.slice(0, 60),
        updatedAtLabel: newNote.updatedAt.slice(0, 60),
        isPinned: newNote.isPinned,
        checklist: newNote.checklist.slice(0, 50),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }).catch(err => handleFirestoreError(err, OperationType.CREATE, path));
    }
  };

  const updateNote = (id: string, updates: Partial<NoteItem>) => {
    let updated: NoteItem | undefined;
    setNotes(prev =>
      prev.map(n => {
        if (n.id === id) {
          updated = { ...n, ...updates, updatedAt: "Just now" };
          return updated;
        }
        return n;
      })
    );
    if (updated && auth.currentUser && auth.currentUser.emailVerified) {
      const uid = auth.currentUser.uid;
      const noteId = sanitizeDocId(id);
      const path = `users/${uid}/notes/${noteId}`;
      updateDoc(doc(db, "users", uid, "notes", noteId), {
        ownerId: uid,
        title: updated.title.slice(0, 200),
        content: updated.content.slice(0, 10000),
        tags: updated.tags.slice(0, 10).map(t => String(t).slice(0, 40)),
        createdAtLabel: updated.createdAt.slice(0, 60),
        updatedAtLabel: updated.updatedAt.slice(0, 60),
        isPinned: updated.isPinned,
        checklist: updated.checklist.slice(0, 50),
        updatedAt: serverTimestamp()
      }).catch(err => handleFirestoreError(err, OperationType.UPDATE, path));
    }
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (auth.currentUser && auth.currentUser.emailVerified) {
      const uid = auth.currentUser.uid;
      const noteId = sanitizeDocId(id);
      const path = `users/${uid}/notes/${noteId}`;
      deleteDoc(doc(db, "users", uid, "notes", noteId)).catch(err =>
        handleFirestoreError(err, OperationType.DELETE, path)
      );
    }
  };

  const addNotebook = (nb: Partial<NotebookItem>): NotebookItem => {
    const id = `nb_${Date.now()}`;
    const newNb: NotebookItem = {
      id,
      title: nb.title?.trim() || "Untitled Notebook",
      description: nb.description?.trim() || "Workspace notes and research synthesis.",
      content: nb.content || `# ${nb.title?.trim() || "Untitled Notebook"}\n\nStart writing notes, ideas, or ask DiptiK AI 3 to synthesize your sources.`,
      tags: nb.tags && nb.tags.length > 0 ? nb.tags : ["Notes"],
      updatedAt: "Just now",
      pinned: nb.pinned ?? false
    };
    setNotebooks(prev => [newNb, ...prev]);

    if (auth.currentUser && auth.currentUser.emailVerified) {
      const uid = auth.currentUser.uid;
      const nbId = sanitizeDocId(id);
      const path = `users/${uid}/notebooks/${nbId}`;
      setDoc(doc(db, "users", uid, "notebooks", nbId), {
        ownerId: uid,
        title: newNb.title.slice(0, 200),
        description: newNb.description.slice(0, 500),
        content: newNb.content.slice(0, 25000),
        tags: newNb.tags.slice(0, 10).map(t => String(t).slice(0, 40)),
        updatedAtLabel: newNb.updatedAt.slice(0, 60),
        pinned: Boolean(newNb.pinned),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }).catch(err => handleFirestoreError(err, OperationType.CREATE, path));
    }
    return newNb;
  };

  const updateNotebook = (id: string, updates: Partial<NotebookItem>) => {
    let updated: NotebookItem | undefined;
    setNotebooks(prev =>
      prev.map(nb => {
        if (nb.id === id) {
          updated = { ...nb, ...updates, updatedAt: "Just now" };
          return updated;
        }
        return nb;
      })
    );
    if (updated && auth.currentUser && auth.currentUser.emailVerified) {
      const uid = auth.currentUser.uid;
      const nbId = sanitizeDocId(id);
      const path = `users/${uid}/notebooks/${nbId}`;
      updateDoc(doc(db, "users", uid, "notebooks", nbId), {
        ownerId: uid,
        title: updated.title.slice(0, 200),
        description: updated.description.slice(0, 500),
        content: updated.content.slice(0, 25000),
        tags: updated.tags.slice(0, 10).map(t => String(t).slice(0, 40)),
        updatedAtLabel: updated.updatedAt.slice(0, 60),
        pinned: Boolean(updated.pinned),
        updatedAt: serverTimestamp()
      }).catch(err => handleFirestoreError(err, OperationType.UPDATE, path));
    }
  };

  const deleteNotebook = (id: string) => {
    setNotebooks(prev => prev.filter(nb => nb.id !== id));
    if (activeNotebookId === id) {
      setActiveNotebookId(null);
    }
    if (auth.currentUser && auth.currentUser.emailVerified) {
      const uid = auth.currentUser.uid;
      const nbId = sanitizeDocId(id);
      const path = `users/${uid}/notebooks/${nbId}`;
      deleteDoc(doc(db, "users", uid, "notebooks", nbId)).catch(err =>
        handleFirestoreError(err, OperationType.DELETE, path)
      );
    }
  };

  const addTask = (task: Partial<TaskItem>) => {
    const id = `task_${Date.now()}`;
    const newTask: TaskItem = {
      id,
      title: task.title || "New Task",
      dueDate: task.dueDate || "Today",
      time: task.time || "12:00 PM",
      priority: task.priority || "Medium",
      status: task.status || "Today",
      aiSuggestion: task.aiSuggestion,
      reminderSet: !!task.reminderSet
    };
    setTasks(prev => [newTask, ...prev]);

    if (auth.currentUser && auth.currentUser.emailVerified) {
      const uid = auth.currentUser.uid;
      const taskId = sanitizeDocId(id);
      const path = `users/${uid}/tasks/${taskId}`;
      const payload: Record<string, any> = {
        ownerId: uid,
        title: newTask.title.slice(0, 200),
        dueDate: newTask.dueDate.slice(0, 60),
        time: newTask.time.slice(0, 40),
        priority: newTask.priority,
        status: newTask.status,
        reminderSet: Boolean(newTask.reminderSet),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      if (newTask.aiSuggestion) {
        payload.aiSuggestion = newTask.aiSuggestion.slice(0, 500);
      }
      setDoc(doc(db, "users", uid, "tasks", taskId), payload).catch(err =>
        handleFirestoreError(err, OperationType.CREATE, path)
      );
    }
  };

  const toggleTaskCompletion = (id: string) => {
    let updated: TaskItem | undefined;
    setTasks(prev =>
      prev.map(t => {
        if (t.id === id) {
          updated = { ...t, status: t.status === "Completed" ? "Today" : "Completed" };
          return updated;
        }
        return t;
      })
    );
    if (updated && auth.currentUser && auth.currentUser.emailVerified) {
      const uid = auth.currentUser.uid;
      const taskId = sanitizeDocId(id);
      const path = `users/${uid}/tasks/${taskId}`;
      updateDoc(doc(db, "users", uid, "tasks", taskId), {
        ownerId: uid,
        title: updated.title.slice(0, 200),
        dueDate: updated.dueDate.slice(0, 60),
        time: updated.time.slice(0, 40),
        priority: updated.priority,
        status: updated.status,
        reminderSet: Boolean(updated.reminderSet),
        ...(updated.aiSuggestion ? { aiSuggestion: updated.aiSuggestion.slice(0, 500) } : {}),
        updatedAt: serverTimestamp()
      }).catch(err => handleFirestoreError(err, OperationType.UPDATE, path));
    }
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (auth.currentUser && auth.currentUser.emailVerified) {
      const uid = auth.currentUser.uid;
      const taskId = sanitizeDocId(id);
      const path = `users/${uid}/tasks/${taskId}`;
      deleteDoc(doc(db, "users", uid, "tasks", taskId)).catch(err =>
        handleFirestoreError(err, OperationType.DELETE, path)
      );
    }
  };

  const addLibraryDoc = async (docItem: LibraryDocumentItem) => {
    setLibraryDocs(prev => [docItem, ...prev]);
    if (auth.currentUser && auth.currentUser.emailVerified) {
      const uid = auth.currentUser.uid;
      const docId = sanitizeDocId(docItem.id);
      const path = `users/${uid}/libraryDocs/${docId}`;
      const payload: Record<string, any> = {
        ownerId: uid,
        title: String(docItem.title || "Untitled Document").slice(0, 240),
        folder: docItem.folder || "Books & Slides",
        fileType: docItem.fileType || "PDF",
        mimeType: String(docItem.mimeType || "application/pdf").slice(0, 120),
        sizeBytes: Math.max(0, Math.min(2147483647, Math.round(docItem.sizeBytes || 0))),
        sizeLabel: String(docItem.sizeLabel || "0 KB").slice(0, 40),
        notes: String(docItem.notes || "").slice(0, 15000),
        uploadedAt: String(docItem.uploadedAt || "Just now").slice(0, 60),
        updatedAtLabel: String(docItem.updatedAt || "Just now").slice(0, 60),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      if (docItem.url) payload.url = String(docItem.url).slice(0, 600);
      if (docItem.localBlobId) payload.localBlobId = String(docItem.localBlobId).slice(0, 128);
      if (docItem.textPreview) payload.textPreview = String(docItem.textPreview).slice(0, 12000);
      try {
        await setDoc(doc(db, "users", uid, "libraryDocs", docId), payload);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    }
  };

  const updateLibraryDoc = async (id: string, updates: Partial<LibraryDocumentItem>) => {
    let updatedDoc: LibraryDocumentItem | undefined;
    setLibraryDocs(prev =>
      prev.map(item => {
        if (item.id === id) {
          updatedDoc = { ...item, ...updates, updatedAt: "Just now" };
          return updatedDoc;
        }
        return item;
      })
    );
    if (updatedDoc && auth.currentUser && auth.currentUser.emailVerified) {
      const uid = auth.currentUser.uid;
      const docId = sanitizeDocId(id);
      const path = `users/${uid}/libraryDocs/${docId}`;
      const payload: Record<string, any> = {
        ownerId: uid,
        title: String(updatedDoc.title || "Untitled Document").slice(0, 240),
        folder: updatedDoc.folder || "Books & Slides",
        fileType: updatedDoc.fileType || "PDF",
        mimeType: String(updatedDoc.mimeType || "application/pdf").slice(0, 120),
        sizeBytes: Math.max(0, Math.min(2147483647, Math.round(updatedDoc.sizeBytes || 0))),
        sizeLabel: String(updatedDoc.sizeLabel || "0 KB").slice(0, 40),
        notes: String(updatedDoc.notes || "").slice(0, 15000),
        uploadedAt: String(updatedDoc.uploadedAt || "Just now").slice(0, 60),
        updatedAtLabel: "Just now",
        updatedAt: serverTimestamp()
      };
      if (updatedDoc.url) payload.url = String(updatedDoc.url).slice(0, 600);
      if (updatedDoc.localBlobId) payload.localBlobId = String(updatedDoc.localBlobId).slice(0, 128);
      if (updatedDoc.textPreview) payload.textPreview = String(updatedDoc.textPreview).slice(0, 12000);
      try {
        const ref = doc(db, "users", uid, "libraryDocs", docId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          await updateDoc(ref, payload);
        } else {
          await setDoc(ref, { ...payload, createdAt: serverTimestamp() });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    }
  };

  const deleteLibraryDoc = async (id: string) => {
    const target = libraryDocs.find(d => d.id === id);
    setLibraryDocs(prev => prev.filter(d => d.id !== id));
    const uid = auth.currentUser?.uid;
    if (uid && target?.localBlobId) {
      await deleteLibraryBlob(uid, target.localBlobId).catch(() => {});
    }
    if (auth.currentUser && auth.currentUser.emailVerified && uid) {
      const docId = sanitizeDocId(id);
      const path = `users/${uid}/libraryDocs/${docId}`;
      try {
        await deleteDoc(doc(db, "users", uid, "libraryDocs", docId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    }
  };

  const persistStudyWorkspaceToFirestore = async (nextState: StudyWorkspaceState) => {
    if (!auth.currentUser || !auth.currentUser.emailVerified) return;
    const uid = auth.currentUser.uid;
    const path = `users/${uid}/studyWorkspaces/default`;
    const ref = doc(db, "users", uid, "studyWorkspaces", "default");
    const safeClassroomConn = stripUndefinedDeep({
      connected: Boolean(nextState.classroomConnection?.connected),
      accountEmail: String(nextState.classroomConnection?.accountEmail || "").slice(0, 150),
      accountName: String(nextState.classroomConnection?.accountName || "").slice(0, 120),
      lastSyncAt: String(nextState.classroomConnection?.lastSyncAt || "").slice(0, 60),
      courses: (nextState.classroomConnection?.courses || []).slice(0, 25),
      assignmentNotifications: nextState.classroomConnection?.assignmentNotifications ?? true,
      announcementNotifications: nextState.classroomConnection?.announcementNotifications ?? true,
      browserNotifications: Boolean(nextState.classroomConnection?.browserNotifications)
    });
    const safeHistory = stripUndefinedDeep((nextState.classroomNotificationHistory || []).slice(0, 100));

    const payload = {
      ownerId: uid,
      gpaScale: nextState.gpaScale === "5.0" ? "5.0" : "4.0",
      gpaCourses: stripUndefinedDeep((nextState.gpaCourses || []).slice(0, 80)),
      syllabusItems: stripUndefinedDeep((nextState.syllabusItems || []).slice(0, 80)),
      academicChecklist: stripUndefinedDeep((nextState.academicChecklist || []).slice(0, 100)),
      academicLinks: stripUndefinedDeep((nextState.academicLinks || []).slice(0, 60)),
      pomodoroMinutesTotal: Math.max(0, Math.min(1000000, Math.round(nextState.pomodoroMinutesTotal || 0))),
      ieltsTargetBand: Math.max(0, Math.min(9, Number(nextState.ieltsTargetBand || 7.5))),
      ieltsScores: stripUndefinedDeep(nextState.ieltsScores || DEFAULT_STUDY_WORKSPACE_STATE.ieltsScores),
      ieltsPracticeLogs: stripUndefinedDeep((nextState.ieltsPracticeLogs || []).slice(0, 120)),
      ieltsVocabNotes: stripUndefinedDeep((nextState.ieltsVocabNotes || []).slice(0, 150)),
      ieltsChecklist: stripUndefinedDeep((nextState.ieltsChecklist || []).slice(0, 100)),
      codersBookmarkedIds: (nextState.codersBookmarkedIds || []).slice(0, 100).map(s => String(s).slice(0, 80)),
      codersCompletedIds: (nextState.codersCompletedIds || []).slice(0, 100).map(s => String(s).slice(0, 80)),
      classroomConnection: safeClassroomConn,
      classroomNotificationHistory: safeHistory,
      updatedAt: serverTimestamp()
    };
    try {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        await updateDoc(ref, payload);
      } else {
        await setDoc(ref, { ...payload, createdAt: serverTimestamp() });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const updateStudyWorkspace = (
    updater: Partial<StudyWorkspaceState> | ((prev: StudyWorkspaceState) => StudyWorkspaceState)
  ) => {
    setStudyWorkspace(prev => {
      const next = typeof updater === "function" ? updater(prev) : { ...prev, ...updater };
      studyWorkspaceRef.current = next;
      if (studySyncTimerRef.current) {
        window.clearTimeout(studySyncTimerRef.current);
      }
      studySyncTimerRef.current = window.setTimeout(() => {
        void persistStudyWorkspaceToFirestore(next);
      }, 350);
      return next;
    });
  };

  const syncGoogleClassroomNow = async (options?: { silent?: boolean; isInitialConnect?: boolean }) => {
    const token = getClassroomAccessToken();
    if (!token) {
      setClassroomTokenReady(false);
      if (!options?.silent) {
        setClassroomSyncError("Session token not active in memory. Reconnect Google Classroom to sync live updates.");
      }
      return;
    }
    if (classroomSyncInFlightRef.current) return;
    classroomSyncInFlightRef.current = true;
    setClassroomSyncing(true);
    setClassroomSyncError(null);

    try {
      const snapshot = await fetchGoogleClassroomSnapshot(token);
      const curr = studyWorkspaceRef.current;
      const prevConn = curr.classroomConnection || DEFAULT_STUDY_WORKSPACE_STATE.classroomConnection;
      const hadPreviousSync = Boolean(prevConn.lastSyncAt) && !options?.isInitialConnect;

      // 1. De-duplicated assignment upsert into academicChecklist (Study Table Task Manager)
      const existingChecklist = [...(curr.academicChecklist || [])];
      const byExternalId = new Map<string, number>();
      existingChecklist.forEach((item, idx) => {
        if (item.externalId) {
          byExternalId.set(item.externalId, idx);
        }
      });

      let newAssignmentCount = 0;
      const newlyAddedAssignments: typeof snapshot.assignments = [];

      for (const a of snapshot.assignments) {
        const existingIdx = byExternalId.get(a.externalId);
        if (existingIdx !== undefined) {
          const prevTask = existingChecklist[existingIdx];
          existingChecklist[existingIdx] = {
            ...prevTask,
            title: a.title,
            category: "Classroom",
            dueDate: a.dueDateLabel,
            source: "google_classroom",
            externalId: a.externalId,
            courseName: a.courseName,
            description: a.description || undefined,
            linkUrl: a.linkUrl || undefined,
            attachmentUrl: a.attachmentUrl || undefined,
            attachmentLabel: a.attachmentLabel || undefined,
            updatedAtIso: a.updateTime
          };
        } else {
          newAssignmentCount += 1;
          newlyAddedAssignments.push(a);
          const createdTask: StudyCheckItem = {
            id: `ack_gc_${sanitizeDocId(a.externalId)}`,
            title: a.title,
            category: "Classroom",
            dueDate: a.dueDateLabel,
            completed: false,
            source: "google_classroom",
            externalId: a.externalId,
            courseName: a.courseName,
            description: a.description || undefined,
            linkUrl: a.linkUrl || undefined,
            attachmentUrl: a.attachmentUrl || undefined,
            attachmentLabel: a.attachmentLabel || undefined,
            updatedAtIso: a.updateTime
          };
          existingChecklist.unshift(createdTask);
          byExternalId.set(a.externalId, 0);
          // Re-index map keys shifted by unshift
          existingChecklist.forEach((item, idx) => {
            if (item.externalId) byExternalId.set(item.externalId, idx);
          });
        }
      }

      // Prioritize keeping manual tasks + newest Classroom tasks within Firestore's 100-item bound
      const manualTasks = existingChecklist.filter(t => t.source !== "google_classroom");
      const classroomTasks = existingChecklist.filter(t => t.source === "google_classroom");
      const mergedChecklist = [
        ...classroomTasks.slice(0, Math.max(0, 100 - manualTasks.length)),
        ...manualTasks
      ].slice(0, 100);

      // 2. Smart Notification History & Alerts (Assignments + Announcements + Materials)
      const prevHistory = [...(curr.classroomNotificationHistory || [])];
      const existingHistoryExternalIds = new Set(prevHistory.map(h => h.externalId));
      const newHistoryRecords: ClassroomNotificationRecord[] = [];
      const formatLabel = (iso: string) => {
        const dt = new Date(iso);
        if (Number.isNaN(dt.getTime())) return "Just now";
        return dt.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
      };

      for (const a of snapshot.assignments) {
        if (!existingHistoryExternalIds.has(a.externalId)) {
          existingHistoryExternalIds.add(a.externalId);
          newHistoryRecords.push({
            id: `cn_a_${sanitizeDocId(a.externalId)}`,
            externalId: a.externalId,
            type: "assignment",
            courseId: a.courseId,
            courseName: a.courseName,
            teacherName: a.teacherName,
            title: a.title,
            summary: a.description ? a.description.slice(0, 180) : `New assignment due ${a.dueDateLabel}.`,
            linkUrl: a.linkUrl,
            createdAtIso: a.updateTime || a.creationTime,
            timestampLabel: formatLabel(a.updateTime || a.creationTime),
            read: !hadPreviousSync
          });
        }
      }

      const newlyDetectedUpdates: typeof snapshot.updates = [];
      for (const u of snapshot.updates) {
        if (!existingHistoryExternalIds.has(u.externalId)) {
          existingHistoryExternalIds.add(u.externalId);
          newlyDetectedUpdates.push(u);
          newHistoryRecords.push({
            id: `cn_u_${sanitizeDocId(u.externalId)}`,
            externalId: u.externalId,
            type: u.type,
            courseId: u.courseId,
            courseName: u.courseName,
            teacherName: u.teacherName,
            title: u.title,
            summary: u.summary,
            linkUrl: u.linkUrl,
            createdAtIso: u.updateTime || u.creationTime,
            timestampLabel: formatLabel(u.updateTime || u.creationTime),
            read: !hadPreviousSync
          });
        }
      }

      const mergedHistory = [...newHistoryRecords, ...prevHistory]
        .sort((a, b) => new Date(b.createdAtIso).getTime() - new Date(a.createdAtIso).getTime())
        .slice(0, 100);

      const syncTimestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const nextState: StudyWorkspaceState = {
        ...curr,
        academicChecklist: mergedChecklist,
        classroomConnection: {
          ...prevConn,
          connected: true,
          lastSyncAt: syncTimestamp,
          courses: snapshot.courses
        },
        classroomNotificationHistory: mergedHistory
      };

      studyWorkspaceRef.current = nextState;
      setStudyWorkspace(nextState);
      if (studySyncTimerRef.current) {
        window.clearTimeout(studySyncTimerRef.current);
      }
      await persistStudyWorkspaceToFirestore(nextState);

      // 3. Emit targeted notifications respecting user preferences
      if (!hadPreviousSync) {
        addNotification({
          title: "Google Classroom Connected",
          message: `Synced ${snapshot.courses.length} course(s), ${snapshot.assignments.length} assignment(s), and ${snapshot.updates.length} classroom update(s).`,
          category: "system"
        });
      } else {
        if (prevConn.assignmentNotifications && newlyAddedAssignments.length > 0) {
          const topA = newlyAddedAssignments[0];
          const extra = newlyAddedAssignments.length > 1 ? ` (+${newlyAddedAssignments.length - 1} more)` : "";
          const msg = `${topA.courseName}: ${topA.title} · Due ${topA.dueDateLabel}${extra}`;
          addNotification({
            title: "New Classroom Assignment Added",
            message: msg,
            category: "task",
            actionUrl: topA.linkUrl,
            actionLabel: "Open in Classroom"
          });
          if (prevConn.browserNotifications) {
            dispatchBrowserNotification("New Classroom Assignment", msg);
          }
        }

        if (prevConn.announcementNotifications && newlyDetectedUpdates.length > 0) {
          const topU = newlyDetectedUpdates[0];
          const extra = newlyDetectedUpdates.length > 1 ? ` (+${newlyDetectedUpdates.length - 1} more updates)` : "";
          const msg = `${topU.teacherName}: ${topU.summary}${extra}`;
          addNotification({
            title: `${topU.courseName} · Announcement`,
            message: msg,
            category: "reminder",
            actionUrl: topU.linkUrl,
            actionLabel: "Open Original Post"
          });
          if (prevConn.browserNotifications) {
            dispatchBrowserNotification(`${topU.courseName} · ${topU.teacherName}`, msg);
          }
        } else if (!options?.silent && newAssignmentCount === 0 && newlyDetectedUpdates.length === 0) {
          addNotification({
            title: "Classroom Up to Date",
            message: `Checked ${snapshot.courses.length} active course(s). No new posts since ${syncTimestamp}.`,
            category: "system"
          });
        }
      }

      lastAutoPollAtRef.current = Date.now();
    } catch (err: any) {
      if (err?.message === "CLASSROOM_TOKEN_EXPIRED") {
        clearClassroomAccessToken();
        setClassroomTokenReady(false);
        setClassroomSyncError("Google Classroom session expired. Click Reconnect to resume live sync.");
      } else {
        const msg = err?.message || "Unable to reach Google Classroom API.";
        setClassroomSyncError(msg);
        if (!options?.silent) {
          addNotification({
            title: "Classroom Sync Issue",
            message: msg,
            category: "system"
          });
        }
      }
    } finally {
      classroomSyncInFlightRef.current = false;
      setClassroomSyncing(false);
    }
  };

  const connectGoogleClassroom = async (forceSelectAccount = false) => {
    setClassroomSyncError(null);
    setClassroomSyncing(true);
    try {
      const res = await connectGoogleClassroomOAuth(forceSelectAccount);
      setClassroomTokenReady(true);

      const curr = studyWorkspaceRef.current;
      const isInitialConnect = !curr.classroomConnection?.connected;
      const nextState: StudyWorkspaceState = {
        ...curr,
        classroomConnection: {
          ...(curr.classroomConnection || DEFAULT_STUDY_WORKSPACE_STATE.classroomConnection),
          connected: true,
          accountEmail: res.accountEmail,
          accountName: res.accountName
        }
      };
      studyWorkspaceRef.current = nextState;
      setStudyWorkspace(nextState);
      await persistStudyWorkspaceToFirestore(nextState);

      setClassroomSyncing(false);
      await syncGoogleClassroomNow({ silent: false, isInitialConnect });
    } catch (err: any) {
      setClassroomSyncing(false);
      const code = err?.code || "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        setClassroomSyncError("Google sign-in popup was closed before completing authorization.");
      } else {
        const msg = err?.message || "Could not authorize Google Classroom.";
        setClassroomSyncError(msg);
        addNotification({
          title: "Classroom Authorization Failed",
          message: msg,
          category: "security"
        });
      }
    }
  };

  const disconnectGoogleClassroom = async (removeSyncedTasks = false) => {
    clearClassroomAccessToken();
    setClassroomTokenReady(false);
    setClassroomSyncError(null);

    const curr = studyWorkspaceRef.current;
    const nextChecklist = removeSyncedTasks
      ? (curr.academicChecklist || []).filter(item => item.source !== "google_classroom")
      : curr.academicChecklist || [];

    const nextState: StudyWorkspaceState = {
      ...curr,
      academicChecklist: nextChecklist,
      classroomConnection: {
        ...DEFAULT_STUDY_WORKSPACE_STATE.classroomConnection,
        assignmentNotifications: curr.classroomConnection?.assignmentNotifications ?? true,
        announcementNotifications: curr.classroomConnection?.announcementNotifications ?? true,
        browserNotifications: false
      },
      classroomNotificationHistory: []
    };

    studyWorkspaceRef.current = nextState;
    setStudyWorkspace(nextState);
    if (studySyncTimerRef.current) {
      window.clearTimeout(studySyncTimerRef.current);
    }
    await persistStudyWorkspaceToFirestore(nextState);

    addNotification({
      title: "Google Classroom Disconnected",
      message: removeSyncedTasks
        ? "Disconnected Google Classroom and removed synced assignments."
        : "Disconnected Google Classroom. Existing tasks remain in your Study Table.",
      category: "system"
    });
  };

  const updateClassroomPreferences = async (
    updates: Partial<
      Pick<ClassroomConnectionState, "assignmentNotifications" | "announcementNotifications" | "browserNotifications">
    >
  ) => {
    let resolvedBrowserPref = updates.browserNotifications;
    if (updates.browserNotifications === true) {
      const granted = await requestBrowserNotificationPermission();
      if (!granted) {
        resolvedBrowserPref = false;
        setClassroomSyncError("Browser notifications are blocked or unsupported in this window.");
      }
    }

    updateStudyWorkspace(prev => ({
      ...prev,
      classroomConnection: {
        ...(prev.classroomConnection || DEFAULT_STUDY_WORKSPACE_STATE.classroomConnection),
        ...updates,
        ...(resolvedBrowserPref !== undefined ? { browserNotifications: resolvedBrowserPref } : {})
      }
    }));
  };

  const markClassroomNotificationRead = (id: string) => {
    updateStudyWorkspace(prev => ({
      ...prev,
      classroomNotificationHistory: (prev.classroomNotificationHistory || []).map(item =>
        item.id === id ? { ...item, read: true } : item
      )
    }));
  };

  const markAllClassroomNotificationsRead = () => {
    updateStudyWorkspace(prev => ({
      ...prev,
      classroomNotificationHistory: (prev.classroomNotificationHistory || []).map(item => ({
        ...item,
        read: true
      }))
    }));
  };

  const clearClassroomNotificationHistory = () => {
    updateStudyWorkspace(prev => ({
      ...prev,
      classroomNotificationHistory: []
    }));
  };

  // Background Classroom sync across all app views (every 90s + on tab visibility return)
  useEffect(() => {
    if (!isAuthenticated || !studyWorkspace.classroomConnection?.connected || !classroomTokenReady) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void syncGoogleClassroomNow({ silent: true });
    }, 90_000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible" && Date.now() - lastAutoPollAtRef.current > 20_000) {
        void syncGoogleClassroomNow({ silent: true });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isAuthenticated, studyWorkspace.classroomConnection?.connected, classroomTokenReady]);

  const addActivityLog = (log: Omit<ActivityLogItem, "id" | "timestamp">) => {
    const id = `act_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newLog: ActivityLogItem = {
      ...log,
      id,
      timestamp
    };
    setActivityLogs(prev => [newLog, ...prev]);

    if (auth.currentUser && auth.currentUser.emailVerified) {
      const uid = auth.currentUser.uid;
      const logId = sanitizeDocId(id);
      const path = `users/${uid}/activityLogs/${logId}`;
      setDoc(doc(db, "users", uid, "activityLogs", logId), {
        ownerId: uid,
        command: String(log.command || "").slice(0, 300),
        interpretation: String(log.interpretation || "").slice(0, 500),
        actionPerformed: String(log.actionPerformed || "").slice(0, 500),
        serviceUsed: String(log.serviceUsed || "").slice(0, 120),
        dataAccessed: String(log.dataAccessed || "").slice(0, 150),
        permissionUsed: String(log.permissionUsed || "").slice(0, 120),
        result: log.result,
        timestampLabel: timestamp.slice(0, 60),
        confirmationLevel: Math.min(3, Math.max(1, Math.round(log.confirmationLevel || 1))),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }).catch(err => handleFirestoreError(err, OperationType.CREATE, path));
    }
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
      const memId = sanitizeDocId(id);
      const path = `users/${uid}/memories/${memId}`;
      try {
        await setDoc(doc(db, "users", uid, "memories", memId), {
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
      const memId = sanitizeDocId(id);
      const path = `users/${uid}/memories/${memId}`;
      try {
        await deleteDoc(doc(db, "users", uid, "memories", memId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    }
  };

  const clearAllMemory = () => {
    const toDelete = [...memoryItems];
    setMemoryItems([]);
    if (auth.currentUser && auth.currentUser.emailVerified) {
      const uid = auth.currentUser.uid;
      toDelete.forEach(item => {
        const memId = sanitizeDocId(item.id);
        deleteDoc(doc(db, "users", uid, "memories", memId)).catch(err =>
          handleFirestoreError(err, OperationType.DELETE, `users/${uid}/memories/${memId}`)
        );
      });
    }
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
    const toDelete = [...activityLogs];
    setActivityLogs([]);
    if (auth.currentUser && auth.currentUser.emailVerified) {
      const uid = auth.currentUser.uid;
      toDelete.forEach(item => {
        const logId = sanitizeDocId(item.id);
        deleteDoc(doc(db, "users", uid, "activityLogs", logId)).catch(err =>
          handleFirestoreError(err, OperationType.DELETE, `users/${uid}/activityLogs/${logId}`)
        );
      });
    }
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
        reloadAuthUser,
        resendVerificationEmail,
        sendPasswordReset,
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
        recordVoiceExchange,
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
        libraryDocs,
        addLibraryDoc,
        updateLibraryDoc,
        deleteLibraryDoc,
        studyWorkspace,
        updateStudyWorkspace,
        classroomTokenReady,
        classroomSyncing,
        classroomSyncError,
        connectGoogleClassroom,
        syncGoogleClassroomNow,
        disconnectGoogleClassroom,
        updateClassroomPreferences,
        markClassroomNotificationRead,
        markAllClassroomNotificationsRead,
        clearClassroomNotificationHistory,
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
