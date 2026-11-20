import { StudyWorkspaceState } from "../types";

const DB_NAME = "diptik_library_blobs_v1";
const DB_VERSION = 1;
const STORE_NAME = "blobs";

export interface StoredLibraryBlobRecord {
  key: string;
  uid: string;
  blobId: string;
  fileName: string;
  mimeType: string;
  blob: Blob;
  savedAt: number;
}

function openLibraryDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is unavailable in this environment."));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "key" });
        store.createIndex("by_uid", "uid", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Failed to open IndexedDB."));
  });
}

function makeBlobKey(uid: string, blobId: string): string {
  return `${uid}:${blobId}`;
}

export async function saveLibraryBlob(
  uid: string,
  blobId: string,
  blob: Blob,
  fileName: string,
  mimeType: string
): Promise<void> {
  const db = await openLibraryDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const record: StoredLibraryBlobRecord = {
      key: makeBlobKey(uid, blobId),
      uid,
      blobId,
      fileName,
      mimeType: mimeType || blob.type || "application/octet-stream",
      blob,
      savedAt: Date.now()
    };
    store.put(record);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error || new Error("Failed to save file locally."));
    };
  });
}

export async function getLibraryBlob(
  uid: string,
  blobId: string
): Promise<StoredLibraryBlobRecord | null> {
  const db = await openLibraryDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(makeBlobKey(uid, blobId));
    req.onsuccess = () => {
      db.close();
      const rec = req.result as StoredLibraryBlobRecord | undefined;
      if (!rec || rec.uid !== uid) {
        resolve(null);
      } else {
        resolve(rec);
      }
    };
    req.onerror = () => {
      db.close();
      reject(req.error || new Error("Failed to read local file."));
    };
  });
}

export async function deleteLibraryBlob(uid: string, blobId: string): Promise<void> {
  const db = await openLibraryDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(makeBlobKey(uid, blobId));
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error || new Error("Failed to delete local file."));
    };
  });
}

export async function clearUserLibraryBlobs(uid: string): Promise<void> {
  if (!uid) return;
  try {
    const db = await openLibraryDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const index = store.index("by_uid");
      const req = index.getAllKeys(IDBKeyRange.only(uid));
      req.onsuccess = () => {
        const keys = req.result || [];
        keys.forEach(k => store.delete(k));
      };
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch {
    // Ignore if IndexedDB is blocked
  }
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export async function readTextPreviewIfSupported(file: File): Promise<string | undefined> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const isText =
    file.type.startsWith("text/") ||
    ["txt", "md", "markdown", "csv", "json", "py", "cpp", "c", "js", "ts"].includes(ext);
  if (!isText || file.size > 1024 * 512) return undefined;
  try {
    const text = await file.text();
    return text.slice(0, 12000);
  } catch {
    return undefined;
  }
}

export const DEFAULT_STUDY_WORKSPACE_STATE: StudyWorkspaceState = {
  gpaScale: "4.0",
  gpaCourses: [
    {
      id: "crs_1",
      semester: "Semester 1",
      code: "CSE 101",
      title: "Structured Programming",
      credits: 3,
      letterGrade: "A",
      gradePoint: 4.0
    },
    {
      id: "crs_2",
      semester: "Semester 1",
      code: "MAT 102",
      title: "Calculus & Linear Algebra",
      credits: 3,
      letterGrade: "A-",
      gradePoint: 3.7
    },
    {
      id: "crs_3",
      semester: "Semester 2",
      code: "CSE 203",
      title: "Data Structures & Algorithms",
      credits: 4,
      letterGrade: "A",
      gradePoint: 4.0
    }
  ],
  syllabusItems: [
    {
      id: "syl_1",
      courseName: "CSE 203 · Data Structures",
      moduleTitle: "Trees, Graphs & Shortest Paths",
      completedUnits: 5,
      totalUnits: 8,
      examDate: "Midterm · Next Fri"
    },
    {
      id: "syl_2",
      courseName: "ENG 105 · Academic Writing",
      moduleTitle: "Research Synthesis & Citations",
      completedUnits: 3,
      totalUnits: 6,
      examDate: "Essay Due · 10 days"
    }
  ],
  academicChecklist: [
    {
      id: "ack_1",
      title: "Submit Algorithm Lab 4 report",
      category: "Assignment",
      dueDate: "Tomorrow",
      completed: false
    },
    {
      id: "ack_2",
      title: "Review Lecture Slides Ch. 1–4",
      category: "Exam Prep",
      dueDate: "This Week",
      completed: false
    }
  ],
  academicLinks: [
    { id: "lnk_1", title: "Google Scholar", url: "https://scholar.google.com", category: "Research" },
    { id: "lnk_2", title: "MIT OpenCourseWare", url: "https://ocw.mit.edu", category: "Lectures" },
    { id: "lnk_3", title: "Overleaf LaTeX", url: "https://www.overleaf.com", category: "Papers" },
    { id: "lnk_4", title: "arXiv Preprints", url: "https://arxiv.org", category: "Papers" }
  ],
  pomodoroMinutesTotal: 0,
  ieltsTargetBand: 7.5,
  ieltsScores: {
    listening: 7.5,
    reading: 7.5,
    writing: 6.5,
    speaking: 7.0
  },
  ieltsPracticeLogs: [
    {
      id: "il_1",
      date: "Today",
      skill: "Listening",
      score: 7.5,
      topic: "Cambridge Academic Test 1 · Sections 1-4"
    },
    {
      id: "il_2",
      date: "Yesterday",
      skill: "Writing",
      score: 6.5,
      topic: "Task 2 Opinion Essay · Urban Transport"
    }
  ],
  ieltsVocabNotes: [
    {
      id: "iv_1",
      term: "Ubiquitous",
      category: "Vocabulary",
      meaningOrNotes: "Present, appearing, or found everywhere (Band 8 lexical resource).",
      example: "Smartphones have become ubiquitous in modern university classrooms."
    },
    {
      id: "iv_2",
      term: "Describe a useful book or resource you read",
      category: "Cue Card",
      meaningOrNotes: "1. What it was  2. Why you chose it  3. Key takeaways  4. How it helped your study routine.",
      example: "Keep 2-minute structure: Intro (20s) -> Story/Detail (60s) -> Impact (40s)."
    }
  ],
  ieltsChecklist: [
    {
      id: "ick_1",
      title: "Complete 1 timed Academic Reading passage (20 mins)",
      category: "Reading",
      dueDate: "Daily",
      completed: false
    },
    {
      id: "ick_2",
      title: "Write 250-word Task 2 essay & review cohesion",
      category: "Writing",
      dueDate: "3x / week",
      completed: false
    },
    {
      id: "ick_3",
      title: "Record 2-minute Speaking Part 2 cue card response",
      category: "Speaking",
      dueDate: "Daily",
      completed: false
    }
  ],
  codersBookmarkedIds: [],
  codersCompletedIds: [],
  classroomConnection: {
    connected: false,
    accountEmail: "",
    accountName: "",
    lastSyncAt: "",
    courses: [],
    assignmentNotifications: true,
    announcementNotifications: true,
    browserNotifications: false
  },
  classroomNotificationHistory: []
};

export function loadLocalLibraryDocs(uid: string): any[] {
  if (typeof window === "undefined" || !uid) return [];
  try {
    const raw = localStorage.getItem(`diptik_uid_${uid}_library_docs_v1`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalLibraryDocs(uid: string, docs: any[]): void {
  if (typeof window === "undefined" || !uid) return;
  try {
    localStorage.setItem(`diptik_uid_${uid}_library_docs_v1`, JSON.stringify(docs));
  } catch {}
}

export function loadLocalStudyWorkspace(uid: string): StudyWorkspaceState {
  if (typeof window === "undefined" || !uid) return DEFAULT_STUDY_WORKSPACE_STATE;
  try {
    const raw = localStorage.getItem(`diptik_uid_${uid}_study_workspace_v1`);
    if (raw) {
      return { ...DEFAULT_STUDY_WORKSPACE_STATE, ...JSON.parse(raw) };
    }
  } catch {}
  return DEFAULT_STUDY_WORKSPACE_STATE;
}

export function saveLocalStudyWorkspace(uid: string, state: StudyWorkspaceState): void {
  if (typeof window === "undefined" || !uid) return;
  try {
    localStorage.setItem(`diptik_uid_${uid}_study_workspace_v1`, JSON.stringify(state));
  } catch {}
}
