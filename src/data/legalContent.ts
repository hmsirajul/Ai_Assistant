export interface LegalSection {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface LegalDocumentData {
  title: string;
  subtitle: string;
  lastUpdated: string;
  effectiveDate: string;
  summary: string;
  sections: LegalSection[];
}

export const LEGAL_META = {
  appName: "DiptiK AI Assistant",
  shortName: "DiptiK AI 3",
  contactEmail: "msirajul.betopia@gmail.com",
  lastUpdated: "November 21, 2026"
};

export const PRIVACY_POLICY_CONTENT: LegalDocumentData = {
  title: "Privacy Policy",
  subtitle: "How DiptiK AI Assistant collects, uses, protects, and isolates your personal data and connected Google services.",
  lastUpdated: LEGAL_META.lastUpdated,
  effectiveDate: LEGAL_META.lastUpdated,
  summary:
    "DiptiK AI Assistant is built with strict per-user account isolation. Your chats, notebooks, uploaded study files, Study Table progress, and optional Google Classroom sync data remain private to your verified account.",
  sections: [
    {
      id: "overview",
      title: "1. Overview & Scope",
      paragraphs: [
        "This Privacy Policy explains how DiptiK AI Assistant ('we', 'our', or 'the Application') handles information when you visit or use our web application, AI voice and text chat features, Study Table, Library reader, and optional integrations.",
        "By creating an account or accessing our services, you agree to the practices described in this Privacy Policy."
      ]
    },
    {
      id: "information-collected",
      title: "2. Information We Collect",
      paragraphs: [
        "We collect only the information required to authenticate your account, personalize your assistant workspace, and provide the features you actively choose to use:"
      ],
      bullets: [
        "Account Information: Name, email address, profile photo URL, and authentication provider metadata supplied via Firebase Authentication (Google Sign-In or Email/Password).",
        "Workspace & Study Data: Conversations, custom assistant instructions, notebooks, notes, tasks, saved memories, GPA/IELTS trackers, and Library file metadata stored under your private user ID.",
        "User-Uploaded Files: Study documents, PDFs, lecture slides, or images you explicitly upload to your Library or attach to chats.",
        "Voice & Chat Inputs: Text prompts or live voice audio streams submitted when you interact with the assistant."
      ]
    },
    {
      id: "google-classroom-data",
      title: "3. Google Classroom & Google API User Data",
      paragraphs: [
        "Connecting Google Classroom is completely optional. If you choose to authorize Google Classroom inside Study Table → Connections, DiptiK AI Assistant requests read-only permissions solely to sync your academic coursework:",
        "DiptiK AI Assistant's use and transfer to any other app of information received from Google APIs will adhere to the Google API Services User Data Policy, including the Limited Use requirements."
      ],
      bullets: [
        "Read-Only Course Data: Active course names, sections, and teacher names (`classroom.courses.readonly`, `classroom.rosters.readonly`).",
        "Assignments & Study Materials: Published coursework deadlines, descriptions, links, and class materials (`classroom.coursework.me.readonly`, `classroom.courseworkmaterials.readonly`) imported directly into your Study Table Task Manager.",
        "Class Announcements: Teacher announcements (`classroom.announcements.readonly`) surfaced in your private Notification History with links to open the original post in Google Classroom.",
        "In-Memory OAuth Token Handling: Google Classroom OAuth access tokens are held strictly in browser memory during your active session and are never persisted to browser storage or shared with other users.",
        "No Advertising or Third-Party Resale: Google Workspace / Classroom data is never sold, used for targeted advertising, or used to train generalized external AI models."
      ]
    },
    {
      id: "how-we-use-data",
      title: "4. How We Use Your Information",
      paragraphs: [
        "We process your data strictly to operate, maintain, and secure your personal DiptiK AI Assistant workspace:"
      ],
      bullets: [
        "Authenticate your identity and enforce strict account-level isolation in Cloud Firestore.",
        "Generate real-time AI chat, research, and voice responses when you submit prompts.",
        "Synchronize your tasks, reminders, Library files, and optional Google Classroom updates across your logged-in sessions.",
        "Prevent abuse, enforce security rules, and diagnose technical errors."
      ]
    },
    {
      id: "storage-security",
      title: "5. Data Isolation, Storage & Security",
      paragraphs: [
        "Every authenticated user's records are partitioned by their unique Firebase Authentication User ID (`uid`) and enforced server-side via Cloud Firestore Security Rules. Other users cannot read, list, or modify your private conversations, notes, or synced Classroom data.",
        "Local Library file blobs stored for instant in-app PDF/slide viewing remain inside your browser's origin-isolated storage on your device."
      ]
    },
    {
      id: "data-retention-deletion",
      title: "6. Your Controls, Disconnection & Data Deletion",
      paragraphs: [
        "You retain full control over your workspace and connected accounts at all times:"
      ],
      bullets: [
        "Disconnect Google Classroom Anytime: Inside Study Table → Connections, click 'Disconnect' to immediately revoke the in-memory Classroom session token, clear synced courses and notification history, and optionally remove imported Classroom tasks.",
        "Revoke Google Access Externally: You may also revoke DiptiK AI Assistant's permissions at any time from your Google Account Security Permissions page (myaccount.google.com/permissions).",
        "Delete Workspace Items or Account: You can delete individual chats, notes, tasks, or Library files inside the app, or contact us to request complete account removal."
      ]
    },
    {
      id: "third-party-services",
      title: "7. Third-Party Infrastructure",
      paragraphs: [
        "DiptiK AI Assistant relies on trusted cloud infrastructure providers solely to deliver app functionality, including Google Firebase (Authentication and Cloud Firestore) and Gemini API models for real-time assistant responses. Each provider processes data in accordance with applicable security and privacy standards."
      ]
    },
    {
      id: "contact",
      title: "8. Contact Us",
      paragraphs: [
        `If you have questions about this Privacy Policy, data handling, or deletion requests, please contact us at ${LEGAL_META.contactEmail}.`
      ]
    }
  ]
};

export const TERMS_OF_SERVICE_CONTENT: LegalDocumentData = {
  title: "Terms of Service",
  subtitle: "Rules, responsibilities, and service terms governing your use of DiptiK AI Assistant.",
  lastUpdated: LEGAL_META.lastUpdated,
  effectiveDate: LEGAL_META.lastUpdated,
  summary:
    "These Terms of Service govern your access to DiptiK AI Assistant, including its AI chat and voice capabilities, Study Table tools, Library reader, and optional Google Classroom integration.",
  sections: [
    {
      id: "acceptance",
      title: "1. Acceptance of Terms",
      paragraphs: [
        "By accessing or using DiptiK AI Assistant, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree with these terms, please discontinue use of the application."
      ]
    },
    {
      id: "accounts-eligibility",
      title: "2. User Accounts & Security",
      paragraphs: [
        "You are responsible for maintaining the confidentiality of your login credentials and for all activity conducted under your authenticated account."
      ],
      bullets: [
        "You must provide accurate account information and verify your email address when registering via Email/Password.",
        "You may only connect Google Classroom or other third-party accounts that you are authorized to access.",
        "You agree not to attempt to bypass authentication gates, Firestore security rules, or access any other user's private workspace."
      ]
    },
    {
      id: "acceptable-use",
      title: "3. Acceptable Use",
      paragraphs: [
        "DiptiK AI Assistant is designed for personal productivity, academic organization, coding reference, and research. You agree not to misuse the service or use it for unlawful, abusive, or harmful purposes:"
      ],
      bullets: [
        "Do not upload malware, malicious scripts, or content that infringes intellectual property or privacy rights.",
        "Do not attempt to disrupt, overload, scrape, or reverse-engineer server APIs or WebSocket endpoints.",
        "Do not use AI outputs or automated tools in violation of your academic institution's honor code or applicable laws."
      ]
    },
    {
      id: "ai-outputs",
      title: "4. AI-Generated Content & Accuracy",
      paragraphs: [
        "AI responses, summaries, live search citations, and study suggestions are generated automatically to assist your workflow. While we strive for accuracy and speed, AI outputs may occasionally contain inaccuracies or outdated details.",
        "You remain responsible for verifying critical academic deadlines, coursework requirements, code, and factual claims against official sources."
      ]
    },
    {
      id: "google-classroom-terms",
      title: "5. Google Classroom Integration",
      paragraphs: [
        "When you authorize Google Classroom, DiptiK AI Assistant acts strictly on your behalf with read-only permissions to display your courses, assignments, and teacher announcements inside your personal Study Table.",
        "Availability of Google Classroom data depends on Google Classroom API uptime and any institutional policies enforced by your school or university domain administrator."
      ]
    },
    {
      id: "user-content",
      title: "6. Ownership of Your Content",
      paragraphs: [
        "You retain full ownership and intellectual property rights over the notes, uploaded PDFs/slides, study tasks, and prompts you create or upload inside DiptiK AI Assistant.",
        "You grant us only the limited technical rights necessary to store, display, and process your content to operate the features you request."
      ]
    },
    {
      id: "disclaimers",
      title: "7. Service Availability & Disclaimers",
      paragraphs: [
        "DiptiK AI Assistant is provided on an 'as is' and 'as available' basis without warranties of any kind, whether express or implied. We may update, improve, or modify features over time to maintain reliability and security."
      ]
    },
    {
      id: "limitation-liability",
      title: "8. Limitation of Liability",
      paragraphs: [
        "To the maximum extent permitted by applicable law, DiptiK AI Assistant and its developer shall not be liable for any indirect, incidental, consequential, or special damages, including missed deadlines or data loss resulting from third-party service outages or user configuration."
      ]
    },
    {
      id: "changes-contact",
      title: "9. Changes & Contact Information",
      paragraphs: [
        "We may revise these Terms of Service periodically. Continued use of the application after updates take effect constitutes acceptance of the revised terms.",
        `Questions regarding these Terms of Service may be sent to ${LEGAL_META.contactEmail}.`
      ]
    }
  ]
};
