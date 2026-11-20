export type AIMode = "Ask" | "Act" | "Research" | "Create" | "Offline";

export type VoicePersonaName = "Zephyr" | "Puck" | "Charon" | "Kore" | "Fenrir";

export type AIEngineProvider =
  | "Gemini 4 Hydrogen (Default)"
  | "ChatGPT (OpenAI Style)"
  | "Claude (Anthropic Style)"
  | "DiptiK Lite 350M (Offline)";

export interface PhoneAction {
  type: string;
  target: string;
  app: string;
  details: string;
  intentUri?: string;
  verificationMethod?: "webauthn" | "hold_confirm";
  params?: Record<string, any>;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  mode: AIMode;
  modelUsed?: string;
  actionCard?: {
    action: PhoneAction;
    confirmationLevel: number; // 1: Safe, 2: Confirmation required, 3: Strong confirmation
    executed?: boolean;
    result?: string;
  };
  sources?: {
    title: string;
    url: string;
    credibility: string;
  }[];
  codeSnippet?: {
    language: string;
    code: string;
  };
  imageAttachment?: string;
  fileAttachment?: {
    name: string;
    size: string;
    type: string;
  };
  suggestedCommands?: string[];
  isStreaming?: boolean;
  statusText?: string;
  isLiked?: boolean;
  isDisliked?: boolean;
}

export interface ChatConversation {
  id: string;
  title: string;
  lastMessage: string;
  updatedAt: string;
  mode: AIMode;
  isPinned?: boolean;
  isArchived?: boolean;
  isTemporary?: boolean;
  messages: ChatMessage[];
}

export interface AgentTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  goal: string;
  tools: string[];
  memory: string;
  category: "Productivity" | "Research" | "Communication" | "Lifestyle" | "Developer" | "Business";
  instructions: string;
  voiceName?: VoicePersonaName;
  isCustom?: boolean;
}

export interface AgentStep {
  id: number;
  action: string;
  tool: string;
  status: "pending" | "active" | "completed" | "failed";
  description: string;
  output?: string;
}

export interface AgentPlan {
  title: string;
  summary: string;
  requiredPermissions: string[];
  confirmationLevel: string;
  steps: AgentStep[];
}

export interface AutomationLog {
  id: string;
  startTime: string;
  endTime: string;
  stepsCompleted: number;
  result: "Success" | "Failed" | "Cancelled";
  errors?: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  triggerDetails: string;
  conditions: string[];
  actions: string[];
  lastRun: string;
  nextRun: string;
  status: "active" | "paused" | "completed" | "failed";
  confirmationSetting: "Run automatically" | "Ask before running" | "Always require confirmation";
  logs: AutomationLog[];
}

export interface SkillItem {
  id: string;
  name: string;
  description: string;
  category: "Productivity" | "Communication" | "Smart Home" | "Travel" | "Education" | "Business" | "Developer Tools" | "Entertainment";
  isOffline: boolean;
  permissions: string[];
  isEnabled: boolean;
  enabled?: boolean;
}

export interface IntegrationItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  actionsAvailable: string[];
  permissions: string[];
  status: "connected" | "disconnected" | "error";
  account?: string;
  connected?: boolean;
}

export interface KnowledgeItem {
  id: string;
  name: string;
  type: "PDF" | "Word" | "Spreadsheet" | "Text Note" | "Website" | "Image";
  size: string;
  uploadDate: string;
  summary: string;
  topics: string[];
  isOffline: boolean;
  content?: string;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
  checklist: { id: string; text: string; completed: boolean }[];
}

export interface TaskItem {
  id: string;
  title: string;
  dueDate: string;
  time: string;
  priority: "High" | "Medium" | "Low";
  status: "Today" | "Upcoming" | "Completed";
  aiSuggestion?: string;
  reminderSet: boolean;
}

export interface ActivityLogItem {
  id: string;
  command: string;
  interpretation: string;
  actionPerformed: string;
  serviceUsed: string;
  dataAccessed: string;
  permissionUsed: string;
  result: "Success" | "Failed" | "Cancelled" | "Pending Confirmation";
  timestamp: string;
  confirmationLevel: number;
}

export interface MemoryItem {
  id: string;
  category: string;
  title: string;
  value: string;
  fact?: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: "task" | "confirmation" | "automation" | "reminder" | "security" | "system";
  timestamp: string;
  read: boolean;
  actionRequired?: {
    type: string;
    target: string;
    level: number;
    description: string;
  };
}

export interface UserProfile {
  uid?: string;
  name: string;
  nickname: string;
  email: string;
  phone: string;
  country: string;
  language: string;
  plan: "Free Lite" | "Pro AI Agent" | "Enterprise";
  avatar: string;
  style: "Concise" | "Balanced" | "Detailed" | "Professional" | "Friendly";
  speed: "0.8x" | "1.0x" | "1.2x" | "1.5x";
  wakePhrase: boolean;
  wakePhraseWord: string;
  appLock: boolean;
  biometric: boolean;
  tier?: string;
  persona?: string;
  defaultEngine?: string;
  authProvider?: "google" | "email" | "default";
  voiceName?: VoicePersonaName;
  customInstructions?: string;
  theme?: "light" | "dark" | "system";
  wakeWordEnabled?: boolean;
  handle?: string;
  ageRange?: string;
}

export interface PermissionItem {
  id: string;
  name: string;
  icon: string;
  description: string;
  privacyNote: string;
  granted: boolean;
  requiredFor: string[];
}

export interface OfflineModelPackage {
  id: string;
  name: string;
  size: string;
  description: string;
  status: "downloaded" | "available" | "downloading";
  progress?: number;
}

export interface NotebookItem {
  id: string;
  title: string;
  description: string;
  content: string;
  tags: string[];
  updatedAt: string;
  pinned?: boolean;
}

export type WorkspaceView =
  | "chat"
  | "library"
  | "study-table"
  | "scheduled"
  | "customize"
  | "coders"
  | "notebook"
  | "all-notebooks";

export type ComposerTier = "Auto" | "Fast" | "Pro" | "Offline";

export type PhonePushChannelType = "web_push" | "telegram" | "discord" | "custom_webhook";

export interface PhoneBridgeConfig {
  channelType: PhonePushChannelType;
  webhookUrl: string;
  telegramBotToken: string;
  telegramChatId: string;
  dailyBriefingTime: string;
  autoBriefingEnabled: boolean;
  city: string;
  biometricCredentialId?: string;
  lastBriefingSentAt?: string;
}

export type LibraryFolder =
  | "Dictionary"
  | "Books & Slides"
  | "Notes"
  | "Papers"
  | "Bookmarks";

export interface LibraryDocumentItem {
  id: string;
  title: string;
  folder: LibraryFolder;
  fileType: "PDF" | "Slides" | "Image" | "Text" | "Bookmark";
  mimeType: string;
  sizeBytes: number;
  sizeLabel: string;
  url?: string;
  notes: string;
  localBlobId?: string;
  textPreview?: string;
  uploadedAt: string;
  updatedAt: string;
}

export interface AcademicCourseGrade {
  id: string;
  semester: string;
  code: string;
  title: string;
  credits: number;
  letterGrade: string;
  gradePoint: number;
}

export interface SyllabusUnitItem {
  id: string;
  courseName: string;
  moduleTitle: string;
  completedUnits: number;
  totalUnits: number;
  examDate: string;
}

export interface StudyCheckItem {
  id: string;
  title: string;
  category: string;
  dueDate: string;
  completed: boolean;
}

export interface AcademicLinkItem {
  id: string;
  title: string;
  url: string;
  category: string;
}

export interface IeltsPracticeLog {
  id: string;
  date: string;
  skill: "Listening" | "Reading" | "Writing" | "Speaking";
  score: number;
  topic: string;
}

export interface IeltsVocabNote {
  id: string;
  term: string;
  category: "Vocabulary" | "Cue Card";
  meaningOrNotes: string;
  example: string;
}

export interface StudyWorkspaceState {
  gpaScale: "4.0" | "5.0";
  gpaCourses: AcademicCourseGrade[];
  syllabusItems: SyllabusUnitItem[];
  academicChecklist: StudyCheckItem[];
  academicLinks: AcademicLinkItem[];
  pomodoroMinutesTotal: number;
  ieltsTargetBand: number;
  ieltsScores: {
    listening: number;
    reading: number;
    writing: number;
    speaking: number;
  };
  ieltsPracticeLogs: IeltsPracticeLog[];
  ieltsVocabNotes: IeltsVocabNote[];
  ieltsChecklist: StudyCheckItem[];
  codersBookmarkedIds: string[];
  codersCompletedIds: string[];
}
