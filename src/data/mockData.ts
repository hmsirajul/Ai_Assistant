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
  OfflineModelPackage
} from "../types";

export const initialUserProfile: UserProfile = {
  name: "Default User",
  nickname: "Explorer",
  email: "default@diptik.ai",
  phone: "+1 (555) 382-9104",
  country: "United States",
  language: "English (US)",
  plan: "Pro AI Agent",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80",
  style: "Balanced",
  speed: "1.0x",
  wakePhrase: true,
  wakePhraseWord: "Hey DiptiK",
  appLock: false,
  biometric: true,
  tier: "Pro Agent",
  persona: "Default (Friendly & Helpful)",
  defaultEngine: "Gemini 4 Hydrogen (Default)",
  authProvider: "default",
  voiceName: "Zephyr",
  customInstructions: "Always provide clear, well-structured summaries and bullet points.",
  theme: "light",
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
    granted: true,
    requiredFor: ["Meeting Summaries", "Event Creation", "Day Planning"]
  },
  {
    id: "contacts",
    name: "Contacts",
    icon: "Users",
    description: "Required to identify who to call or message when using natural voice commands.",
    privacyNote: "Contact names are matched locally on your device during phone actions.",
    granted: true,
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
    description: "Enables location-triggered automations (e.g. when arriving at work or leaving home).",
    privacyNote: "GPS coordinates are evaluated on-device and never shared externally without explicit Level 3 confirmation.",
    granted: true,
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

export const initialConversations: ChatConversation[] = [
  {
    id: "conv_1",
    title: "Morning Briefing & Calendar Plan",
    lastMessage: "Here is your executive morning summary for today. You have 3 priority meetings.",
    updatedAt: "10 mins ago",
    mode: "Ask",
    isPinned: true,
    messages: [
      {
        id: "m_1",
        sender: "user",
        text: "Summarize my schedule for today and highlight priority action items.",
        timestamp: "9:00 AM",
        mode: "Ask"
      },
      {
        id: "m_2",
        sender: "ai",
        text: "Good morning! Here is your executive summary for **Sunday, July 26, 2026**:\n\n### Today's Schedule\n1. **10:00 AM - Product Roadmap Sync** (Google Meet)\n2. **1:30 PM - AI Agent Architecture Review** (Room 4B)\n3. **4:00 PM - Quarterly Budget Check-in**\n\n### Priority Action Items\n- Review the 350M offline quantized model benchmarks before the 1:30 PM review.\n- Prepare draft response for Rahim regarding mobile automation triggers.\n\n*Would you like me to set a 15-minute reminder before your first meeting?*",
        timestamp: "9:01 AM",
        mode: "Ask",
        modelUsed: "gemini-4-hydrogen",
        suggestedCommands: ["Set reminder for 9:45 AM", "Draft message to Rahim", "Summarize latest emails"]
      }
    ]
  },
  {
    id: "conv_2",
    title: "Phone Command: SMS to Rahim",
    lastMessage: "Draft message prepared for Rahim. Waiting for your Level 2 confirmation to send.",
    updatedAt: "1 hour ago",
    mode: "Act",
    isPinned: true,
    messages: [
      {
        id: "m_3",
        sender: "user",
        text: "Send a message to Rahim saying I will arrive at 6 PM for the dinner.",
        timestamp: "8:00 AM",
        mode: "Act"
      },
      {
        id: "m_4",
        sender: "ai",
        text: "I have prepared the SMS for **Rahim** (+1 555-0192). Since sending messages requires **Level 2 Confirmation** for privacy, please review and approve the draft below.",
        timestamp: "8:00 AM",
        mode: "Act",
        modelUsed: "gemini-4-hydrogen",
        actionCard: {
          action: {
            type: "send_message",
            target: "Rahim (+1 555-0192)",
            app: "Messages App",
            details: "Hey Rahim, I will arrive at 6 PM for the dinner."
          },
          confirmationLevel: 2,
          executed: false
        }
      }
    ]
  },
  {
    id: "conv_3",
    title: "Offline Local Knowledge Search",
    lastMessage: "[Offline Mode] Found 2 saved PDF manuals matching 'Bluetooth headset pairing'.",
    updatedAt: "Yesterday",
    mode: "Offline",
    isPinned: false,
    messages: [
      {
        id: "m_5",
        sender: "user",
        text: "Find my notes about Bluetooth headset pairing instructions.",
        timestamp: "4:30 PM",
        mode: "Offline"
      },
      {
        id: "m_6",
        sender: "ai",
        text: "operating in **Offline Mode**. I searched your on-device SQLite knowledge index and found 2 relevant items:\n\n1. **Audio Gear Manual.pdf** (Page 4: Pairing mode hold power for 5s)\n2. **Tech Notes** (Tag: #bluetooth)\n\n*All local searches are processed 100% on-device with zero cloud telemetry.*",
        timestamp: "4:30 PM",
        mode: "Offline",
        modelUsed: "DiptiK AI On-Device Lite (350M)"
      }
    ]
  }
];

export const initialAgentTemplates: AgentTemplate[] = [
  {
    id: "agent_personal",
    name: "Personal Assistant",
    icon: "Sparkles",
    description: "Manages day-to-day schedule, summarizes emails, coordinates reminders, and prepares morning briefs.",
    goal: "Organize user calendar, draft communication, and maintain daily productivity rhythm.",
    tools: ["Google Calendar", "Gmail Integration", "Android Notifications", "DiptiK Notes"],
    memory: "Long-term memory (remembers work hours, preferred meeting durations, and family names).",
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
    memory: "Project memory (retains research context across multiple query sessions).",
    category: "Research",
    instructions: "Always provide at least 3 peer-reviewed or verified official sources. Highlight discrepancies between articles."
  },
  {
    id: "agent_travel",
    name: "Travel & Flight Planner",
    icon: "Compass",
    description: "Tracks flights, compares currency values, suggests itineraries, and saves offline reservation cards.",
    goal: "Provide end-to-end travel itineraries with live weather, flight delays, and offline maps.",
    tools: ["Flight Tracker API", "Currency Converter", "Weather Service", "Offline Storage"],
    memory: "Project memory (remembers seat preferences, dietary restrictions, and frequent flyer numbers).",
    category: "Lifestyle",
    instructions: "Monitor flight status 24 hours before departure and generate offline reservation PDFs for airport use."
  },
  {
    id: "agent_dev",
    name: "Developer & Code Assistant",
    icon: "Code",
    description: "Writes React/Flutter code, debugs errors, explains architecture, and searches documentation.",
    goal: "Assist developers with clean syntax, mobile UI design patterns, and bug remediation.",
    tools: ["GitHub Integration", "Code Syntax Sandbox", "StackOverflow API", "Terminal Docs"],
    memory: "Long-term memory (remembers preferred programming languages, Tailwind conventions, and framework versions).",
    category: "Developer",
    instructions: "Write clean, modular TypeScript or Dart code without unnecessary boilerplate. Explain root causes clearly."
  },
  {
    id: "agent_content",
    name: "Content Creator",
    icon: "PenTool",
    description: "Drafts professional emails, study summaries, LinkedIn posts, blog outlines, and presentation slides.",
    goal: "Generate polished written and visual content tailored to user tone and brand voice.",
    tools: ["Gemini 4 Hydrogen Text", "Image Generation Engine", "Grammar & Style Editor", "Markdown Export"],
    memory: "Long-term memory (retains user brand voice, vocabulary preferences, and target audience).",
    category: "Communication",
    instructions: "Adapt tone dynamically (concise, professional, persuasive). Provide 3 headline options for every post."
  }
];

export const initialAutomations: AutomationRule[] = [
  {
    id: "auto_morning",
    name: "Morning Executive Briefing",
    trigger: "Daily at 8:00 AM",
    triggerDetails: "Fires every weekday morning at 08:00 AM",
    conditions: ["Internet available", "Device battery > 20%"],
    actions: [
      "Read today's Google Calendar appointments",
      "Summarize top 3 unread emails in Gmail",
      "Check local weather forecast",
      "Speak executive summary via voice output"
    ],
    lastRun: "Today at 8:00 AM",
    nextRun: "Tomorrow at 8:00 AM",
    status: "active",
    confirmationSetting: "Run automatically",
    logs: [
      {
        id: "log_1",
        startTime: "Today 08:00:02 AM",
        endTime: "Today 08:00:15 AM",
        stepsCompleted: 4,
        result: "Success"
      },
      {
        id: "log_2",
        startTime: "Yesterday 08:00:01 AM",
        endTime: "Yesterday 08:00:12 AM",
        stepsCompleted: 4,
        result: "Success"
      }
    ]
  },
  {
    id: "auto_meeting",
    name: "Auto-Silence in Scheduled Meetings",
    trigger: "Calendar event start",
    triggerDetails: "When any event marked 'Busy' begins on Google Calendar",
    conditions: ["Event duration > 15 minutes", "Device not connected to Car Bluetooth"],
    actions: [
      "Set phone ringer volume to 0 (Vibrate)",
      "Send auto-reply SMS to incoming calls: 'In a meeting, will reply soon.'",
      "Restore ringer volume when meeting ends"
    ],
    lastRun: "Yesterday at 3:00 PM",
    nextRun: "Today at 1:30 PM",
    status: "active",
    confirmationSetting: "Ask before running",
    logs: [
      {
        id: "log_3",
        startTime: "Yesterday 03:00:00 PM",
        endTime: "Yesterday 04:00:00 PM",
        stepsCompleted: 3,
        result: "Success"
      }
    ]
  },
  {
    id: "auto_battery",
    name: "Battery Saver & Offline Switch",
    trigger: "Battery level < 15%",
    triggerDetails: "When device battery drops below 15%",
    conditions: ["Device not charging"],
    actions: [
      "Switch DiptiK AI mode from Online Cloud to Offline Lite (350M)",
      "Reduce screen brightness by 30%",
      "Disable background sync for low-priority integrations"
    ],
    lastRun: "3 days ago",
    nextRun: "When battery < 15%",
    status: "active",
    confirmationSetting: "Run automatically",
    logs: []
  },
  {
    id: "auto_study",
    name: "Daily Study Review Checklist",
    trigger: "Daily at 7:00 PM",
    triggerDetails: "Every evening at 19:00",
    conditions: ["Specific day: Mon, Tue, Wed, Thu"],
    actions: [
      "Scan recently added notes tagged #study",
      "Generate 5 quiz questions using Gemini 4 Hydrogen",
      "Show interactive notification with start button"
    ],
    lastRun: "Yesterday at 7:00 PM",
    nextRun: "Today at 7:00 PM",
    status: "paused",
    confirmationSetting: "Run automatically",
    logs: []
  }
];

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
    status: "connected",
    account: "msirajul.betopia@gmail.com"
  },
  {
    id: "int_calendar",
    name: "Google Calendar",
    description: "Schedule appointments, check availability, and receive conflict alerts.",
    icon: "Calendar",
    actionsAvailable: ["Create meeting", "Check availability", "Delete event", "List daily agenda"],
    permissions: ["Read and write calendar events"],
    status: "connected",
    account: "msirajul.betopia@gmail.com"
  },
  {
    id: "int_drive",
    name: "Google Drive",
    description: "Search cloud files, summarize PDFs, and export research briefings.",
    icon: "HardDrive",
    actionsAvailable: ["Search files", "Read document content", "Save export PDF"],
    permissions: ["Read file metadata", "Write exported files"],
    status: "connected",
    account: "msirajul.betopia@gmail.com"
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

export const initialKnowledge: KnowledgeItem[] = [
  {
    id: "know_1",
    name: "DiptiK AI Mobile Architecture Spec.pdf",
    type: "PDF",
    size: "2.4 MB",
    uploadDate: "July 24, 2026",
    summary: "Complete system roadmap detailing 5 bottom navigation modules, 3-level confirmation safeguards, and offline lite model sync.",
    topics: ["Mobile Architecture", "Offline AI", "Safety Levels", "Flutter & Express"],
    isOffline: true,
    content: "The DiptiK AI Agent operates with a hybrid dual-engine architecture: Online Cloud LLM (Gemini 4 Hydrogen) for deep reasoning and On-Device Lite (350M) for instant phone commands."
  },
  {
    id: "know_2",
    name: "Project Betopia Q3 Targets.xlsx",
    type: "Spreadsheet",
    size: "145 KB",
    uploadDate: "July 20, 2026",
    summary: "Financial projections and user acquisition targets for the Pro AI Agent tier launch.",
    topics: ["Finance", "Q3 Targets", "Pro Tier", "Acquisition"],
    isOffline: false,
    content: "Q3 Acquisition Target: 50,000 active mobile users. Conversion goal to Pro AI tier: 12.5%."
  },
  {
    id: "know_3",
    name: "Android App Intents Documentation",
    type: "Website",
    size: "Web Link",
    uploadDate: "July 18, 2026",
    summary: "Official reference for voice assistant wake words, system actions, and background execution limits.",
    topics: ["Android 15", "App Intents", "Wake Word", "System Actions"],
    isOffline: true,
    content: "Android App Intents enable voice assistants to trigger specific screens and functions while respecting OS safety constraints."
  }
];

export const initialNotes: NoteItem[] = [
  {
    id: "note_1",
    title: "AI Agent Architecture Checklist",
    content: "Key deliverables for the upcoming engineering sprint review. Ensure offline sync queue is tested.",
    tags: ["#work", "#engineering", "#ai"],
    createdAt: "July 25, 2026",
    updatedAt: "Today 10:30 AM",
    isPinned: true,
    checklist: [
      { id: "c1", text: "Implement 5 bottom navigation tabs", completed: true },
      { id: "c2", text: "Create Level 1, 2, and 3 confirmation dialogs", completed: true },
      { id: "c3", text: "Integrate Gemini 4 Hydrogen server endpoint", completed: true },
      { id: "c4", text: "Test offline fallback simulator", completed: false }
    ]
  },
  {
    id: "note_2",
    title: "Dinner Party with Rahim - Menu Ideas",
    content: "Guests arriving around 6:00 PM. Preferred dietary items: Mediterranean mezze, grilled salmon, and mint lemonade.",
    tags: ["#personal", "#dinner", "#recipes"],
    createdAt: "July 24, 2026",
    updatedAt: "Yesterday",
    isPinned: false,
    checklist: [
      { id: "c5", text: "Confirm RSVP count with Rahim", completed: true },
      { id: "c6", text: "Buy fresh mint and lemons", completed: false }
    ]
  }
];

export const initialTasks: TaskItem[] = [
  {
    id: "task_1",
    title: "Review 350M Offline Quantized Model benchmarks",
    dueDate: "Today",
    time: "1:00 PM",
    priority: "High",
    status: "Today",
    aiSuggestion: "DiptiK AI can summarize the 12-page benchmark PDF into 5 key bullet points before your meeting.",
    reminderSet: true
  },
  {
    id: "task_2",
    title: "Send Q3 Roadmap Update to Executive Team",
    dueDate: "Today",
    time: "4:30 PM",
    priority: "Medium",
    status: "Today",
    aiSuggestion: "Use Content Creator mode with 'Professional' tone to draft this email in 5 seconds.",
    reminderSet: true
  },
  {
    id: "task_3",
    title: "Backup downloaded offline knowledge to Drive",
    dueDate: "Tomorrow",
    time: "10:00 AM",
    priority: "Low",
    status: "Upcoming",
    reminderSet: false
  }
];

export const initialActivityLogs: ActivityLogItem[] = [
  {
    id: "act_1",
    command: "Call Rahim",
    interpretation: "Prepare outbound voice telephone call to Rahim (+1 555-0192)",
    actionPerformed: "Opened Phone Dialer with Rahim selected. Checked user permission.",
    serviceUsed: "Android Native Dialer Intent",
    dataAccessed: "Local Contacts Index",
    permissionUsed: "Phone & Dialer Permission",
    result: "Pending Confirmation",
    timestamp: "Today, 10:45 AM",
    confirmationLevel: 2
  },
  {
    id: "act_2",
    command: "Set alarm for 7:00 AM tomorrow",
    interpretation: "Create system clock alarm for 07:00 AM recurring weekday",
    actionPerformed: "Created alarm labeled 'Morning Wake-up' in System Clock",
    serviceUsed: "System Clock Service",
    dataAccessed: "None (Local Timer)",
    permissionUsed: "Level 1 Safe Action",
    result: "Success",
    timestamp: "Today, 09:12 AM",
    confirmationLevel: 1
  },
  {
    id: "act_3",
    command: "Summarize top 3 emails from Sarah",
    interpretation: "Query Gmail API for unread threads from sender 'Sarah' and summarize",
    actionPerformed: "Retrieved 3 email threads and generated bulleted briefing",
    serviceUsed: "Google Gmail API + Gemini 4 Hydrogen",
    dataAccessed: "Email Header & Body Content",
    permissionUsed: "Gmail Integration Permission",
    result: "Success",
    timestamp: "Yesterday, 04:15 PM",
    confirmationLevel: 1
  },
  {
    id: "act_4",
    command: "Delete all cached offline research reports",
    interpretation: "Purge local temporary document storage in /sdcard/diptik/cache",
    actionPerformed: "Requested Level 3 Biometric Confirmation from user",
    serviceUsed: "Local File Manager",
    dataAccessed: "Cached Reports Directory (42 MB)",
    permissionUsed: "Level 3 Strong Safeguard",
    result: "Cancelled",
    timestamp: "July 24, 2026, 02:20 PM",
    confirmationLevel: 3
  }
];

export const initialMemory: MemoryItem[] = [
  {
    id: "mem_1",
    category: "Preferences",
    title: "Preferred Response Tone",
    value: "Balanced, objective, and structured with clean markdown formatting. Avoid marketing fluff.",
    updatedAt: "2 days ago"
  },
  {
    id: "mem_2",
    category: "Work",
    title: "Primary Office Hours",
    value: "Monday to Friday, 9:00 AM - 5:30 PM. Silence notifications during deep work sessions (2-4 PM).",
    updatedAt: "1 week ago"
  },
  {
    id: "mem_3",
    category: "Important People",
    title: "Rahim (Colleague & Friend)",
    value: "Phone: +1 555-0192. Frequent dinner partner and engineering project collaborator.",
    updatedAt: "3 days ago"
  },
  {
    id: "mem_4",
    category: "Instructions",
    title: "Level 3 Safeguard Rule",
    value: "Never delete calendar events or cloud files without asking for explicit confirmation first.",
    updatedAt: "July 20, 2026"
  }
];

export const initialNotifications: NotificationItem[] = [
  {
    id: "notif_1",
    title: "Automation Task Completed",
    message: "Morning Executive Briefing finished running successfully. 4 actions performed.",
    category: "automation",
    timestamp: "10 mins ago",
    read: false
  },
  {
    id: "notif_2",
    title: "Action Confirmation Required",
    message: "DiptiK AI prepared an SMS for Rahim: 'I will arrive at 6 PM'. Tap to approve.",
    category: "confirmation",
    timestamp: "45 mins ago",
    read: false,
    actionRequired: {
      type: "send_message",
      target: "Rahim (+1 555-0192)",
      level: 2,
      description: "Send prepared SMS message"
    }
  },
  {
    id: "notif_3",
    title: "Offline Model Update Available",
    message: "An updated Lite 350M model with 15% faster speech transcription is ready to download over Wi-Fi.",
    category: "system",
    timestamp: "Yesterday",
    read: true
  }
];
