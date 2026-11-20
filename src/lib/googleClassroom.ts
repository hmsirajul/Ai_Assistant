import {
  auth,
  GoogleAuthProvider,
  signInWithPopup,
  linkWithPopup,
  reauthenticateWithPopup
} from "./firebase";
import { ClassroomCourseSummary } from "../types";

export const CLASSROOM_SCOPES = [
  "https://www.googleapis.com/auth/classroom.courses.readonly",
  "https://www.googleapis.com/auth/classroom.coursework.me.readonly",
  "https://www.googleapis.com/auth/classroom.announcements.readonly",
  "https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly",
  "https://www.googleapis.com/auth/classroom.rosters.readonly"
];

// Strictly in-memory OAuth access token cache (never written to localStorage/sessionStorage)
let cachedClassroomAccessToken: string | null = null;

export function getClassroomAccessToken(): string | null {
  return cachedClassroomAccessToken;
}

export function setClassroomAccessToken(token: string | null): void {
  cachedClassroomAccessToken = token;
}

export function clearClassroomAccessToken(): void {
  cachedClassroomAccessToken = null;
}

export interface ClassroomOAuthConnectionResult {
  accessToken: string;
  accountEmail: string;
  accountName: string;
}

export async function connectGoogleClassroomOAuth(
  forceSelectAccount = false
): Promise<ClassroomOAuthConnectionResult> {
  const provider = new GoogleAuthProvider();
  CLASSROOM_SCOPES.forEach(scope => provider.addScope(scope));
  provider.setCustomParameters({
    prompt: forceSelectAccount ? "select_account consent" : "consent",
    include_granted_scopes: "true"
  });

  const currentUser = auth.currentUser;
  const hasGoogleLinked = Boolean(
    currentUser?.providerData?.some(p => p.providerId === "google.com")
  );

  let result;
  if (currentUser && !forceSelectAccount && !hasGoogleLinked) {
    try {
      result = await linkWithPopup(currentUser, provider);
    } catch (err: any) {
      if (
        err?.code === "auth/credential-already-in-use" ||
        err?.code === "auth/provider-already-linked" ||
        err?.code === "auth/email-already-in-use"
      ) {
        result = await signInWithPopup(auth, provider);
      } else {
        throw err;
      }
    }
  } else if (currentUser && !forceSelectAccount && hasGoogleLinked) {
    try {
      result = await reauthenticateWithPopup(currentUser, provider);
    } catch (err: any) {
      if (err?.code === "auth/user-mismatch") {
        result = await signInWithPopup(auth, provider);
      } else {
        throw err;
      }
    }
  } else {
    result = await signInWithPopup(auth, provider);
  }

  const credential = GoogleAuthProvider.credentialFromResult(result);
  const accessToken = credential?.accessToken;
  if (!accessToken) {
    throw new Error("Could not obtain a Google Classroom access token. Please allow Classroom permissions and try again.");
  }

  cachedClassroomAccessToken = accessToken;

  const accountEmail =
    result.user.email ||
    result.user.providerData?.find(p => p.providerId === "google.com")?.email ||
    "";
  const accountName =
    result.user.displayName ||
    result.user.providerData?.find(p => p.providerId === "google.com")?.displayName ||
    accountEmail ||
    "Google Account";

  return {
    accessToken,
    accountEmail,
    accountName
  };
}

export interface ParsedClassroomAssignment {
  externalId: string;
  courseId: string;
  courseName: string;
  teacherName: string;
  title: string;
  description: string;
  dueDateLabel: string;
  linkUrl?: string;
  attachmentUrl?: string;
  attachmentLabel?: string;
  creationTime: string;
  updateTime: string;
}

export interface ParsedClassroomAnnouncement {
  externalId: string;
  type: "announcement" | "material";
  courseId: string;
  courseName: string;
  teacherName: string;
  title: string;
  summary: string;
  linkUrl?: string;
  creationTime: string;
  updateTime: string;
}

export interface GoogleClassroomSnapshot {
  courses: ClassroomCourseSummary[];
  assignments: ParsedClassroomAssignment[];
  updates: ParsedClassroomAnnouncement[];
}

function formatDueDate(
  dueDate?: { year?: number; month?: number; day?: number },
  dueTime?: { hours?: number; minutes?: number }
): string {
  if (!dueDate?.year || !dueDate?.month || !dueDate?.day) {
    return "No due date";
  }
  const hrs = dueTime?.hours ?? 23;
  const mins = dueTime?.minutes ?? 59;
  // Classroom API dueDate/dueTime are UTC
  const dt = new Date(Date.UTC(dueDate.year, dueDate.month - 1, dueDate.day, hrs, mins));
  if (Number.isNaN(dt.getTime())) {
    return `${dueDate.month}/${dueDate.day}/${dueDate.year}`;
  }
  const datePart = dt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (dueTime?.hours !== undefined) {
    const timePart = dt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    return `${datePart}, ${timePart}`;
  }
  return datePart;
}

function extractFirstMaterial(materials?: any[]): { url?: string; label?: string } {
  if (!Array.isArray(materials) || materials.length === 0) return {};
  for (const m of materials) {
    if (m?.driveFile?.driveFile?.alternateLink) {
      return {
        url: m.driveFile.driveFile.alternateLink,
        label: m.driveFile.driveFile.title || "Drive attachment"
      };
    }
    if (m?.link?.url) {
      return {
        url: m.link.url,
        label: m.link.title || "Attached link"
      };
    }
    if (m?.youtubeVideo?.alternateLink) {
      return {
        url: m.youtubeVideo.alternateLink,
        label: m.youtubeVideo.title || "YouTube video"
      };
    }
    if (m?.form?.formUrl) {
      return {
        url: m.form.formUrl,
        label: m.form.title || "Google Form"
      };
    }
  }
  return {};
}

async function classroomGet<T>(url: string, accessToken: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
  if (res.status === 401) {
    throw new Error("CLASSROOM_TOKEN_EXPIRED");
  }
  if (!res.ok) {
    let detail = `Google Classroom API error (${res.status})`;
    try {
      const errJson = await res.json();
      if (errJson?.error?.message) detail = errJson.error.message;
    } catch {}
    const err = new Error(detail) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return res.json() as Promise<T>;
}

export async function fetchGoogleClassroomSnapshot(
  accessToken: string
): Promise<GoogleClassroomSnapshot> {
  const coursesData = await classroomGet<{ courses?: any[] }>(
    "https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE&pageSize=25",
    accessToken
  );

  const rawCourses = Array.isArray(coursesData.courses) ? coursesData.courses.slice(0, 15) : [];

  const assignments: ParsedClassroomAssignment[] = [];
  const updates: ParsedClassroomAnnouncement[] = [];
  const courses: ClassroomCourseSummary[] = [];

  await Promise.all(
    rawCourses.map(async course => {
      const courseId = String(course.id);
      const courseName = [course.name, course.section].filter(Boolean).join(" · ") || "Classroom Course";

      // 1. Teachers roster
      const teacherMap = new Map<string, string>();
      let primaryTeacher = "Course Teacher";
      try {
        const teachersData = await classroomGet<{ teachers?: any[] }>(
          `https://classroom.googleapis.com/v1/courses/${encodeURIComponent(courseId)}/teachers?pageSize=10`,
          accessToken
        );
        const list = Array.isArray(teachersData.teachers) ? teachersData.teachers : [];
        list.forEach((t, idx) => {
          const fullName = t?.profile?.name?.fullName || t?.profile?.emailAddress;
          if (t?.userId && fullName) {
            teacherMap.set(String(t.userId), fullName);
            if (idx === 0) primaryTeacher = fullName;
          }
        });
      } catch {
        // Gracefully ignore if roster visibility is restricted for a specific course
      }

      courses.push({
        id: courseId,
        name: course.name || "Untitled Course",
        section: course.section || undefined,
        teacherName: primaryTeacher,
        alternateLink: course.alternateLink || undefined
      });

      // 2. CourseWork (Assignments)
      try {
        const cwData = await classroomGet<{ courseWork?: any[] }>(
          `https://classroom.googleapis.com/v1/courses/${encodeURIComponent(courseId)}/courseWork?courseWorkStates=PUBLISHED&orderBy=updateTime%20desc&pageSize=20`,
          accessToken
        );
        const cwList = Array.isArray(cwData.courseWork) ? cwData.courseWork : [];
        for (const work of cwList) {
          const mat = extractFirstMaterial(work.materials);
          const creatorName =
            (work.creatorUserId && teacherMap.get(String(work.creatorUserId))) || primaryTeacher;
          assignments.push({
            externalId: `gc_cw_${courseId}_${work.id}`,
            courseId,
            courseName,
            teacherName: creatorName,
            title: String(work.title || "Untitled Assignment").slice(0, 180),
            description: String(work.description || "").trim().slice(0, 600),
            dueDateLabel: formatDueDate(work.dueDate, work.dueTime),
            linkUrl: work.alternateLink || course.alternateLink,
            attachmentUrl: mat.url,
            attachmentLabel: mat.label,
            creationTime: work.creationTime || new Date().toISOString(),
            updateTime: work.updateTime || work.creationTime || new Date().toISOString()
          });
        }
      } catch (err: any) {
        if (err?.message === "CLASSROOM_TOKEN_EXPIRED") throw err;
      }

      // 3. Announcements
      try {
        const annData = await classroomGet<{ announcements?: any[] }>(
          `https://classroom.googleapis.com/v1/courses/${encodeURIComponent(courseId)}/announcements?announcementStates=PUBLISHED&orderBy=updateTime%20desc&pageSize=15`,
          accessToken
        );
        const annList = Array.isArray(annData.announcements) ? annData.announcements : [];
        for (const ann of annList) {
          const text = String(ann.text || "").trim();
          const creatorName =
            (ann.creatorUserId && teacherMap.get(String(ann.creatorUserId))) || primaryTeacher;
          const summary = text.length > 220 ? `${text.slice(0, 217)}...` : text || "Posted a new classroom announcement.";
          updates.push({
            externalId: `gc_ann_${courseId}_${ann.id}`,
            type: "announcement",
            courseId,
            courseName,
            teacherName: creatorName,
            title: `${course.name || courseName} Announcement`,
            summary,
            linkUrl: ann.alternateLink || course.alternateLink,
            creationTime: ann.creationTime || new Date().toISOString(),
            updateTime: ann.updateTime || ann.creationTime || new Date().toISOString()
          });
        }
      } catch (err: any) {
        if (err?.message === "CLASSROOM_TOKEN_EXPIRED") throw err;
      }

      // 4. CourseWork Materials (Teacher classroom material updates)
      try {
        const matData = await classroomGet<{ courseWorkMaterial?: any[] }>(
          `https://classroom.googleapis.com/v1/courses/${encodeURIComponent(courseId)}/courseWorkMaterials?courseWorkMaterialStates=PUBLISHED&orderBy=updateTime%20desc&pageSize=10`,
          accessToken
        );
        const matList = Array.isArray(matData.courseWorkMaterial) ? matData.courseWorkMaterial : [];
        for (const item of matList) {
          const creatorName =
            (item.creatorUserId && teacherMap.get(String(item.creatorUserId))) || primaryTeacher;
          const desc = String(item.description || "").trim();
          updates.push({
            externalId: `gc_mat_${courseId}_${item.id}`,
            type: "material",
            courseId,
            courseName,
            teacherName: creatorName,
            title: String(item.title || "New Class Material").slice(0, 160),
            summary: desc ? (desc.length > 200 ? `${desc.slice(0, 197)}...` : desc) : `New study material posted in ${course.name || courseName}.`,
            linkUrl: item.alternateLink || course.alternateLink,
            creationTime: item.creationTime || new Date().toISOString(),
            updateTime: item.updateTime || item.creationTime || new Date().toISOString()
          });
        }
      } catch (err: any) {
        if (err?.message === "CLASSROOM_TOKEN_EXPIRED") throw err;
      }
    })
  );

  // Sort updates newest first
  updates.sort(
    (a, b) => new Date(b.updateTime).getTime() - new Date(a.updateTime).getTime()
  );

  return {
    courses,
    assignments,
    updates
  };
}

export async function requestBrowserNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  try {
    const perm = await Notification.requestPermission();
    return perm === "granted";
  } catch {
    return false;
  }
}

export function dispatchBrowserNotification(title: string, body: string): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    const notif = new Notification(title, {
      body,
      icon: "/pwa-192x192.png",
      tag: title.slice(0, 60)
    });
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
  } catch {
    // Ignore if browser restricts Notification constructor inside iframe
  }
}
