import {
  ChatConversation,
  AgentTemplate,
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
  NotebookItem
} from "../types";

export const initialUserProfile: UserProfile = {
  name: "DiptiK User",
  nickname: "User",
  email: "",
  phone: "",
  country: "",
  language: "English (GB)",
  plan: "Free Lite",
  avatar: "",
  style: "Balanced",
  speed: "1.0x",
  wakePhrase: true,
  wakePhraseWord: "Hey DiptiK",
  appLock: false,
  biometric: false,
  tier: "Free Lite",
  persona: "Default (Friendly & Helpful)",
  defaultEngine: "Gemini 4 Hydrogen (Default)",
  authProvider: "google",
  voiceName: "Zephyr",
  customInstructions: "",
  theme: "system",
  wakeWordEnabled: true
};

export const initialPermissions: PermissionItem[] = [
  {
    id: "microphone",
    name: "Microphone",
    icon: "Mic",
    description: "Enables hands-free voice commands, live conversations, and speech-to-text notes.",
    privacyNote: "Audio is processed locally or streamed securely to Gemini 3.8 Live models. No voice data is stored without consent.",
    granted: true,
    requiredFor: ["Voice Assistant", "Live Chat", "Audio Notes"]
  },
  {
    id: "notifications",
    name: "Notifications",
    icon: "Bell",
    description: "Allows DiptiK AI to send reminders, automation run alerts, and confirmation requests.",
    privacyNote: "Alerts remain on your device and can be filtered by priority level.",
    granted: true,
    requiredFor: ["Reminders", "Automations", "Background Alerts"]
  },
  {
    id: "calendar",
    name: "Calendar",
    icon: "Calendar",
    description: "Enables schedule checking, meeting briefs, and automated event creation.",
    privacyNote: "DiptiK AI reads events only when you ask or run a calendar automation.",
    granted: false,
    requiredFor: ["Meeting Summaries", "Event Creation", "Day Planning"]
  },
  {
    id: "contacts",
    name: "Contacts",
    icon: "Users",
    description: "Required to identify who to call or message when using natural voice commands.",
    privacyNote: "Contact names are matched locally on your device during phone actions.",
    granted: false,
    requiredFor: ["Phone Calls", "SMS Drafting", "Email Addressing"]
  },
  {
    id: "phone",
    name: "Phone & Dialer",
    icon: "PhoneCall",
    description: "Allows DiptiK AI to prepare voice calls and check device call logs when requested.",
    privacyNote: "Level 2 Confirmation required before initiating actual outbound calls.",
    granted: false,
    requiredFor: ["Voice Calls", "Call Summary"]
  },
  {
    id: "location",
    name: "Location & GPS",
    icon: "MapPin",
    description: "Enables location-triggered automations and local weather briefings.",
    privacyNote: "GPS coordinates are evaluated on-device and never shared externally without explicit Level 3 confirmation.",
    granted: false,
    requiredFor: ["Geofence Automations", "Weather", "Traffic Updates"]
  },
  {
    id: "camera",
    name: "Camera & Vision",
    icon: "Camera",
    description: "Enables image scanning, OCR document reading, object translation, and visual problem solving.",
    privacyNote: "Photos are captured only upon direct user trigger in Vision mode.",
    granted: true,
    requiredFor: ["Vision Assistant", "Document Scanning", "Real-time OCR"]
  },
  {
    id: "files",
    name: "Files & Storage",
    icon: "Folder",
    description: "Allows searching local downloaded PDFs, notes, and cloud knowledge documents.",
    privacyNote: "Local files are indexed on-device; Level 3 confirmation required for file deletions.",
    granted: true,
    requiredFor: ["Knowledge Search", "Document Summary", "Offline Storage"]
  },
  {
    id: "bluetooth",
    name: "Bluetooth & Devices",
    icon: "Bluetooth",
    description: "Enables headset wake-word activation and connecting smart home hardware.",
    privacyNote: "Used strictly for audio routing and Bluetooth automation triggers.",
    granted: false,
    requiredFor: ["Headset Voice", "Car Mode", "Device Controls"]
  }
];

export const initialOfflinePackages: OfflineModelPackage[] = [
  {
    id: "pkg_voice",
    name: "Basic Voice Commands",
    size: "45 MB",
    description: "On-device intent classifier for alarms, timers, volume, flashlight, and app launching.",
    status: "downloaded"
  },
  {
    id: "pkg_speech",
    name: "Offline Speech Recognition",
    size: "185 MB",
    description: "Zero-latency local voice-to-text transcription without requiring Wi-Fi or cellular.",
    status: "downloaded"
  },
  {
    id: "pkg_assistant",
    name: "DiptiK Lite 350M Assistant",
    size: "380 MB",
    description: "Quantized local language model for offline Q&A, basic writing, and offline note summarization.",
    status: "downloaded"
  },
  {
    id: "pkg_translate",
    name: "Offline Translation 40 Languages",
    size: "240 MB",
    description: "Instant speech and text translation dictionaries for travel without internet.",
    status: "available"
  },
  {
    id: "pkg_ocr",
    name: "Local Document OCR & Summarizer",
    size: "110 MB",
    description: "On-device optical character recognition and bullet-point document summarizer.",
    status: "available"
  }
];

export const initialNotebooks: NotebookItem[] = [];

export const initialConversations: ChatConversation[] = [];

export const initialAgentTemplates: AgentTemplate[] = [
  {
    id: "agent_personal",
    name: "Personal Assistant",
    icon: "Sparkles",
    description: "Manages day-to-day schedule, summarizes emails, coordinates reminders, and prepares morning briefs.",
    goal: "Organize user calendar, draft communication, and maintain daily productivity rhythm.",
    tools: ["Google Calendar", "Gmail Integration", "Notifications", "DiptiK Notes"],
    memory: "Private per-user long-term memory.",
    category: "Productivity",
    instructions: "Always check calendar conflicts before creating new meetings. Summarize emails into bullet points with clear action items."
  },
  {
    id: "agent_research",
    name: "Research Assistant",
    icon: "Search",
    description: "Performs multi-source web searches, compares conflicting information, and builds executive reports.",
    goal: "Conduct thorough research with credible citations and downloadable executive briefings.",
    tools: ["Web Search Engine", "Gemini Deep Research", "PDF Summarizer", "Citation Checker"],
    memory: "Private session research context.",
    category: "Research",
    instructions: "Always provide verified official sources. Highlight discrepancies between articles."
  },
  {
    id: "agent_travel",
    name: "Travel & Flight Planner",
    icon: "Compass",
    description: "Tracks flights, compares currency values, suggests itineraries, and saves offline reservation cards.",
    goal: "Provide end-to-end travel itineraries with live weather, flight delays, and offline maps.",
    tools: ["Flight Tracker API", "Currency Converter", "Weather Service", "Offline Storage"],
    memory: "Private travel preference memory.",
    category: "Lifestyle",
    instructions: "Monitor flight status 24 hours before departure and generate clear travel checklists."
  },
  {
    id: "agent_dev",
    name: "Developer & Code Assistant",
    icon: "Code",
    description: "Writes React/Flutter code, debugs errors, explains architecture, and searches documentation.",
    goal: "Assist developers with clean syntax, mobile UI design patterns, and bug remediation.",
    tools: ["GitHub Integration", "Code Syntax Sandbox", "StackOverflow API", "Terminal Docs"],
    memory: "Private developer preference memory.",
    category: "Developer",
    instructions: "Write clean, modular TypeScript or Dart code without unnecessary boilerplate. Explain root causes clearly."
  },
  {
    id: "agent_content",
    name: "Content Creator",
    icon: "PenTool",
    description: "Drafts professional emails, study summaries, social posts, blog outlines, and presentation slides.",
    goal: "Generate polished written and visual content tailored to user tone and voice.",
    tools: ["Gemini 4 Hydrogen Text", "Image Generation Engine", "Grammar & Style Editor", "Markdown Export"],
    memory: "Private writing style memory.",
    category: "Communication",
    instructions: "Adapt tone dynamically (concise, professional, persuasive). Provide 3 headline options for every post."
  }
];

export const initialAutomations: AutomationRule[] = [];

export const initialSkills: SkillItem[] = [
  {
    id: "skill_prod",
    name: "Productivity & Schedule Suite",
    description: "Enables DiptiK AI to create calendar events, check reminders, and summarize daily agendas.",
    category: "Productivity",
    isOffline: false,
    permissions: ["Calendar", "Notifications"],
    isEnabled: true
  },
  {
    id: "skill_offline_cmd",
    name: "Offline Device Control Engine",
    description: "Allows voice control of flashlight, volume, Wi-Fi, Bluetooth, alarms, and timers without internet.",
    category: "Smart Home",
    isOffline: true,
    permissions: ["Phone & Dialer", "Bluetooth & Devices"],
    isEnabled: true
  },
  {
    id: "skill_trans",
    name: "Real-time Voice Translator",
    description: "Live bidirectional voice translation for over 40 languages with natural speech output.",
    category: "Travel",
    isOffline: true,
    permissions: ["Microphone"],
    isEnabled: true
  },
  {
    id: "skill_ocr",
    name: "Smart Vision & Document Scanner",
    description: "Scan physical paperwork, extract OCR text, summarize receipts, and solve math formulas.",
    category: "Education",
    isOffline: false,
    permissions: ["Camera & Vision"],
    isEnabled: true
  },
  {
    id: "skill_code",
    name: "Developer Terminal & Sandbox",
    description: "Execute code snippets, review GitHub PRs, and debug React/Flutter architecture.",
    category: "Developer Tools",
    isOffline: false,
    permissions: ["Files & Storage"],
    isEnabled: false
  }
];

export const initialIntegrations: IntegrationItem[] = [
  {
    id: "int_gmail",
    name: "Google Gmail",
    description: "Read unread emails, draft replies, and summarize thread chains.",
    icon: "Mail",
    actionsAvailable: ["Read unread", "Create draft", "Summarize thread", "Search sender"],
    permissions: ["Read email metadata", "Create draft messages"],
    status: "disconnected"
  },
  {
    id: "int_calendar",
    name: "Google Calendar",
    description: "Schedule appointments, check availability, and receive conflict alerts.",
    icon: "Calendar",
    actionsAvailable: ["Create meeting", "Check availability", "Delete event", "List daily agenda"],
    permissions: ["Read and write calendar events"],
    status: "disconnected"
  },
  {
    id: "int_drive",
    name: "Google Drive",
    description: "Search cloud files, summarize PDFs, and export research briefings.",
    icon: "HardDrive",
    actionsAvailable: ["Search files", "Read document content", "Save export PDF"],
    permissions: ["Read file metadata", "Write exported files"],
    status: "disconnected"
  },
  {
    id: "int_slack",
    name: "Slack Workspace",
    description: "Summarize channel discussions, send quick team updates, and check DMs.",
    icon: "MessageSquare",
    actionsAvailable: ["Read channel summaries", "Post message", "Check mentions"],
    permissions: ["Read public channels", "Send messages as user"],
    status: "disconnected"
  },
  {
    id: "int_spotify",
    name: "Spotify Music & Podcasts",
    description: "Play playlists, control media playback, and discover ambient focus playlists.",
    icon: "Music",
    actionsAvailable: ["Play playlist", "Pause/Resume", "Search track"],
    permissions: ["Control playback state"],
    status: "disconnected"
  },
  {
    id: "int_github",
    name: "GitHub Repositories",
    description: "Track pull requests, summarize code changes, and review issues.",
    icon: "GitBranch",
    actionsAvailable: ["List open PRs", "Summarize commit diffs", "Check issue status"],
    permissions: ["Read repo metadata"],
    status: "disconnected"
  }
];

export const initialKnowledge: KnowledgeItem[] = [];

export const initialNotes: NoteItem[] = [];

export const initialTasks: TaskItem[] = [];

export const initialActivityLogs: ActivityLogItem[] = [];

export const initialMemory: MemoryItem[] = [];

export const initialNotifications: NotificationItem[] = [];
