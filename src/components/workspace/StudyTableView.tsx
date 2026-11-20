import React, { useEffect, useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  AcademicCourseGrade,
  IeltsPracticeLog,
  IeltsVocabNote,
  StudyCheckItem,
  SyllabusUnitItem
} from "../../types";
import {
  GraduationCap,
  Award,
  Plus,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Circle,
  ExternalLink,
  BookMarked,
  Clock,
  Calculator,
  ListChecks,
  ChevronRight,
  RefreshCw,
  Bell,
  BellOff,
  Megaphone,
  Paperclip,
  Link2,
  Unplug,
  AlertCircle,
  CheckCheck
} from "lucide-react";

const GRADE_OPTIONS_4: { label: string; point: number }[] = [
  { label: "A+ (4.00)", point: 4.0 },
  { label: "A (4.00)", point: 4.0 },
  { label: "A- (3.70)", point: 3.7 },
  { label: "B+ (3.30)", point: 3.3 },
  { label: "B (3.00)", point: 3.0 },
  { label: "B- (2.70)", point: 2.7 },
  { label: "C+ (2.30)", point: 2.3 },
  { label: "C (2.00)", point: 2.0 },
  { label: "D (1.00)", point: 1.0 },
  { label: "F (0.00)", point: 0.0 }
];

const GRADE_OPTIONS_5: { label: string; point: number }[] = [
  { label: "A+ (5.00)", point: 5.0 },
  { label: "A (4.50)", point: 4.5 },
  { label: "A- (4.00)", point: 4.0 },
  { label: "B+ (3.50)", point: 3.5 },
  { label: "B (3.00)", point: 3.0 },
  { label: "C (2.50)", point: 2.5 },
  { label: "D (2.00)", point: 2.0 },
  { label: "F (0.00)", point: 0.0 }
];

const IELTS_BAND_STEPS = [
  9.0, 8.5, 8.0, 7.5, 7.0, 6.5, 6.0, 5.5, 5.0, 4.5, 4.0, 3.5, 3.0
];

function roundIeltsBand(rawMean: number): number {
  return Math.round(rawMean * 2) / 2;
}

function getCefrForBand(band: number): string {
  if (band >= 8.5) return "CEFR C2 · Expert";
  if (band >= 7.0) return "CEFR C1 · Operational Proficiency";
  if (band >= 5.5) return "CEFR B2 · Upper Intermediate";
  return "CEFR B1 · Intermediate";
}

export const StudyTableView: React.FC = () => {
  const {
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
    clearClassroomNotificationHistory
  } = useApp();
  const [subTab, setSubTab] = useState<"academic" | "ielts">("academic");

  // Google Classroom Connections UI state
  const [taskSourceFilter, setTaskSourceFilter] = useState<"all" | "classroom" | "manual">("all");
  const [notifHistoryFilter, setNotifHistoryFilter] = useState<"all" | "assignment" | "announcement">("all");
  const [confirmDisconnectOpen, setConfirmDisconnectOpen] = useState(false);
  const [removeTasksOnDisconnect, setRemoveTasksOnDisconnect] = useState(false);
  const [confirmClearHistory, setConfirmClearHistory] = useState(false);

  // Academic: GPA quick add
  const [courseSemester, setCourseSemester] = useState("Semester 3");
  const [courseCode, setCourseCode] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [courseCredits, setCourseCredits] = useState("3");
  const [coursePoint, setCoursePoint] = useState("4.0");

  // Academic: Syllabus quick add
  const [sylCourse, setSylCourse] = useState("");
  const [sylModule, setSylModule] = useState("");
  const [sylUnits, setSylUnits] = useState("8");
  const [sylExam, setSylExam] = useState("");

  // Academic: Checklist quick add
  const [acadTaskTitle, setAcadTaskTitle] = useState("");
  const [acadTaskDue, setAcadTaskDue] = useState("This Week");

  // Academic: Custom link quick add
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  // Academic: Pomodoro Timer
  const [timerPreset, setTimerPreset] = useState<25 | 5 | 15>(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);

  // IELTS: Practice log quick add
  const [pracSkill, setPracSkill] = useState<IeltsPracticeLog["skill"]>("Listening");
  const [pracScore, setPracScore] = useState("7.5");
  const [pracTopic, setPracTopic] = useState("");

  // IELTS: Vocab & Cue Card quick add
  const [vocabTerm, setVocabTerm] = useState("");
  const [vocabCat, setVocabCat] = useState<IeltsVocabNote["category"]>("Vocabulary");
  const [vocabMeaning, setVocabMeaning] = useState("");
  const [vocabExample, setVocabExample] = useState("");
  const [vocabFilter, setVocabFilter] = useState("");
  const [expandedCueId, setExpandedCueId] = useState<string | null>(null);

  // IELTS: Checklist quick add
  const [ieltsTaskTitle, setIeltsTaskTitle] = useState("");
  const [ieltsTaskCat, setIeltsTaskCat] = useState("Reading");

  useEffect(() => {
    if (!timerRunning) return;
    const interval = window.setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          setTimerRunning(false);
          if (timerPreset === 25) {
            updateStudyWorkspace(curr => ({
              ...curr,
              pomodoroMinutesTotal: (curr.pomodoroMinutesTotal || 0) + 25
            }));
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [timerRunning, timerPreset]);

  const handleSelectTimerPreset = (mins: 25 | 5 | 15) => {
    setTimerRunning(false);
    setTimerPreset(mins);
    setSecondsLeft(mins * 60);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // GPA calculation
  const totalCredits = studyWorkspace.gpaCourses.reduce((sum, c) => sum + (Number(c.credits) || 0), 0);
  const weightedSum = studyWorkspace.gpaCourses.reduce(
    (sum, c) => sum + (Number(c.credits) || 0) * (Number(c.gradePoint) || 0),
    0
  );
  const cgpa = totalCredits > 0 ? weightedSum / totalCredits : 0;

  const gradeOptions = studyWorkspace.gpaScale === "5.0" ? GRADE_OPTIONS_5 : GRADE_OPTIONS_4;

  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitle.trim()) return;
    const credits = Math.max(0.5, Math.min(12, Number(courseCredits) || 3));
    const point = Math.max(0, Math.min(Number(studyWorkspace.gpaScale), Number(coursePoint) || 0));
    const matchedOpt = gradeOptions.find(o => Math.abs(o.point - point) < 0.05);
    const newCourse: AcademicCourseGrade = {
      id: `crs_${Date.now()}`,
      semester: courseSemester.trim() || "Current",
      code: courseCode.trim().toUpperCase() || "COURSE",
      title: courseTitle.trim(),
      credits,
      letterGrade: matchedOpt ? matchedOpt.label.split(" ")[0] : `${point.toFixed(2)}`,
      gradePoint: point
    };
    updateStudyWorkspace(prev => ({
      ...prev,
      gpaCourses: [newCourse, ...prev.gpaCourses]
    }));
    setCourseCode("");
    setCourseTitle("");
  };

  const handleDeleteCourse = (id: string) => {
    updateStudyWorkspace(prev => ({
      ...prev,
      gpaCourses: prev.gpaCourses.filter(c => c.id !== id)
    }));
  };

  const handleAddSyllabus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sylCourse.trim()) return;
    const total = Math.max(1, Math.min(50, Math.round(Number(sylUnits) || 8)));
    const item: SyllabusUnitItem = {
      id: `syl_${Date.now()}`,
      courseName: sylCourse.trim(),
      moduleTitle: sylModule.trim() || "Core Modules",
      completedUnits: 0,
      totalUnits: total,
      examDate: sylExam.trim() || "Upcoming"
    };
    updateStudyWorkspace(prev => ({
      ...prev,
      syllabusItems: [item, ...prev.syllabusItems]
    }));
    setSylCourse("");
    setSylModule("");
    setSylExam("");
  };

  const handleStepSyllabus = (id: string, delta: number) => {
    updateStudyWorkspace(prev => ({
      ...prev,
      syllabusItems: prev.syllabusItems.map(item =>
        item.id === id
          ? {
              ...item,
              completedUnits: Math.max(0, Math.min(item.totalUnits, item.completedUnits + delta))
            }
          : item
      )
    }));
  };

  const handleAddAcademicCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acadTaskTitle.trim()) return;
    const item: StudyCheckItem = {
      id: `ack_${Date.now()}`,
      title: acadTaskTitle.trim(),
      category: "Coursework",
      dueDate: acadTaskDue.trim() || "Soon",
      completed: false
    };
    updateStudyWorkspace(prev => ({
      ...prev,
      academicChecklist: [item, ...prev.academicChecklist]
    }));
    setAcadTaskTitle("");
  };

  const handleAddAcademicLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkTitle.trim() || !linkUrl.trim()) return;
    const normalized = linkUrl.trim().startsWith("http") ? linkUrl.trim() : `https://${linkUrl.trim()}`;
    updateStudyWorkspace(prev => ({
      ...prev,
      academicLinks: [
        ...prev.academicLinks,
        { id: `lnk_${Date.now()}`, title: linkTitle.trim(), url: normalized, category: "Personal" }
      ]
    }));
    setLinkTitle("");
    setLinkUrl("");
  };

  // IELTS calculations
  const { listening, reading, writing, speaking } = studyWorkspace.ieltsScores;
  const rawIeltsAvg = (listening + reading + writing + speaking) / 4;
  const overallBand = roundIeltsBand(rawIeltsAvg);

  const handleAddIeltsLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pracTopic.trim()) return;
    const entry: IeltsPracticeLog = {
      id: `il_${Date.now()}`,
      date: new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      skill: pracSkill,
      score: Number(pracScore) || 7.0,
      topic: pracTopic.trim()
    };
    updateStudyWorkspace(prev => ({
      ...prev,
      ieltsPracticeLogs: [entry, ...prev.ieltsPracticeLogs]
    }));
    setPracTopic("");
  };

  const handleAddVocab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vocabTerm.trim() || !vocabMeaning.trim()) return;
    const entry: IeltsVocabNote = {
      id: `iv_${Date.now()}`,
      term: vocabTerm.trim(),
      category: vocabCat,
      meaningOrNotes: vocabMeaning.trim(),
      example: vocabExample.trim()
    };
    updateStudyWorkspace(prev => ({
      ...prev,
      ieltsVocabNotes: [entry, ...prev.ieltsVocabNotes]
    }));
    setVocabTerm("");
    setVocabMeaning("");
    setVocabExample("");
  };

  const handleAddIeltsCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ieltsTaskTitle.trim()) return;
    const item: StudyCheckItem = {
      id: `ick_${Date.now()}`,
      title: ieltsTaskTitle.trim(),
      category: ieltsTaskCat,
      dueDate: "Target",
      completed: false
    };
    updateStudyWorkspace(prev => ({
      ...prev,
      ieltsChecklist: [item, ...prev.ieltsChecklist]
    }));
    setIeltsTaskTitle("");
  };

  const pendingAcadCount = studyWorkspace.academicChecklist.filter(i => !i.completed).length;
  const classroomConn = studyWorkspace.classroomConnection;
  const classroomHistory = studyWorkspace.classroomNotificationHistory || [];
  const unreadClassroomCount = classroomHistory.filter(n => !n.read).length;

  const filteredAcademicTasks = studyWorkspace.academicChecklist.filter(item => {
    if (taskSourceFilter === "classroom") return item.source === "google_classroom";
    if (taskSourceFilter === "manual") return item.source !== "google_classroom";
    return true;
  });

  const filteredClassroomHistory = classroomHistory.filter(entry => {
    if (notifHistoryFilter === "assignment") return entry.type === "assignment";
    if (notifHistoryFilter === "announcement") return entry.type === "announcement" || entry.type === "material";
    return true;
  });

  return (
    <div className="flex-1 min-h-0 overflow-y-auto gemini-scroll px-4 sm:px-8 pb-12">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header + Sub-Section Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-white/[0.08] pb-4 text-left">
          <div>
            <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
              Study Table
            </h1>
            <p className="text-sm text-slate-500 dark:text-[#94a3b8] mt-1">
              University coursework trackers, GPA calculator, focus timer, and IELTS preparation workspace.
            </p>
          </div>

          <div className="inline-flex items-center p-1 rounded-xl bg-slate-200/70 dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.08] shrink-0">
            <button
              type="button"
              onClick={() => setSubTab("academic")}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                subTab === "academic"
                  ? "bg-white dark:bg-[#0b0d14] text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-[#0072FF] dark:text-[#00E5FF]" />
              <span>Academic</span>
            </button>
            <button
              type="button"
              onClick={() => setSubTab("ielts")}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                subTab === "ielts"
                  ? "bg-white dark:bg-[#0b0d14] text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Award className="w-3.5 h-3.5 text-[#FF1E8A]" />
              <span>IELTS</span>
            </button>
          </div>
        </div>

        {/* ================================================================ */}
        {/* SUB-SECTION 1: ACADEMIC                                          */}
        {/* ================================================================ */}
        {subTab === "academic" && (
          <div className="space-y-6 text-left">
            {/* Key Metrics Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.08]">
                <p className="text-[11px] font-medium text-slate-500 dark:text-[#94a3b8]">Cumulative CGPA</p>
                <p className="font-display text-2xl font-semibold text-slate-900 dark:text-white tabular-nums mt-1">
                  {cgpa.toFixed(2)}
                  <span className="text-xs font-normal text-slate-400 dark:text-[#64748b] ml-1">
                    / {studyWorkspace.gpaScale}
                  </span>
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.08]">
                <p className="text-[11px] font-medium text-slate-500 dark:text-[#94a3b8]">Credits Completed</p>
                <p className="font-display text-2xl font-semibold text-slate-900 dark:text-white tabular-nums mt-1">
                  {totalCredits}
                  <span className="text-xs font-normal text-slate-400 dark:text-[#64748b] ml-1">
                    ({studyWorkspace.gpaCourses.length} courses)
                  </span>
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.08]">
                <p className="text-[11px] font-medium text-slate-500 dark:text-[#94a3b8]">Pending Deadlines</p>
                <p className="font-display text-2xl font-semibold text-slate-900 dark:text-white tabular-nums mt-1">
                  {pendingAcadCount}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.08]">
                <p className="text-[11px] font-medium text-slate-500 dark:text-[#94a3b8]">Focus Logged</p>
                <p className="font-display text-2xl font-semibold text-slate-900 dark:text-white tabular-nums mt-1">
                  {studyWorkspace.pomodoroMinutesTotal}
                  <span className="text-xs font-normal text-slate-400 dark:text-[#64748b] ml-1">mins</span>
                </p>
              </div>
            </div>

            {/* Connections: Google Classroom Integration & Smart Notifications */}
            <div
              id="classroom-connections"
              className="p-5 rounded-2xl bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.08] space-y-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 dark:border-white/[0.06] pb-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link2 className="w-4 h-4 text-[#0072FF] dark:text-[#00E5FF]" />
                    <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                      Connections · Google Classroom
                    </h2>
                    {classroomConn.connected && (
                      <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
                        · {classroomTokenReady ? "Live sync active" : "Synced (reconnect for live polling)"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-[#94a3b8]">
                    {classroomConn.connected
                      ? `Connected as ${classroomConn.accountName || "Google Account"} (${classroomConn.accountEmail})${
                          classroomConn.lastSyncAt ? ` · Last synced ${classroomConn.lastSyncAt}` : ""
                        }`
                      : "Authorize with Google OAuth 2.0 to sync active courses, auto-import assignments into your Task Manager, and receive teacher announcement alerts."}
                  </p>
                </div>

                {classroomConn.connected ? (
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {classroomTokenReady ? (
                      <button
                        type="button"
                        onClick={() => void syncGoogleClassroomNow({ silent: false })}
                        disabled={classroomSyncing}
                        className="px-3 py-1.5 rounded-xl bg-[#0072FF] hover:bg-[#005ce6] disabled:opacity-60 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${classroomSyncing ? "animate-spin" : ""}`} />
                        <span>{classroomSyncing ? "Syncing..." : "Sync Now"}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void connectGoogleClassroom(false)}
                        disabled={classroomSyncing}
                        className="h-9 px-3.5 rounded-xl bg-white dark:bg-[#131314] border border-[#747775]/60 dark:border-[#8e918f]/60 hover:bg-slate-50 dark:hover:bg-[#1f2024] text-slate-800 dark:text-[#e3e3e3] text-xs font-medium flex items-center gap-2 cursor-pointer whitespace-nowrap transition-colors"
                      >
                        <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
                          <path fill="#EA4335" d="M12 5c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.09 14.97 0 12 0 7.31 0 3.26 2.69 1.29 6.6l3.66 2.84C5.81 6.86 8.65 5 12 5z" />
                          <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.72 2.89c2.17-2 3.7-4.95 3.7-8.71z" />
                          <path fill="#FBBC05" d="M4.95 14.44A7.12 7.12 0 0 1 4.58 12c0-.85.15-1.68.37-2.44L1.29 6.72A11.98 11.98 0 0 0 0 12c0 1.93.46 3.77 1.29 5.28l3.66-2.84z" />
                          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.72-2.89c-1.08.72-2.45 1.16-4.21 1.16-3.35 0-6.19-1.86-7.05-4.44l-3.66 2.84C3.26 21.31 7.31 24 12 24z" />
                        </svg>
                        <span>{classroomSyncing ? "Connecting..." : "Reconnect Live Sync"}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => void connectGoogleClassroom(true)}
                      disabled={classroomSyncing}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#181c2b] hover:bg-slate-200 dark:hover:bg-[#1f2437] text-slate-700 dark:text-[#cbd5e1] text-xs font-medium cursor-pointer whitespace-nowrap transition-colors"
                    >
                      Switch Account
                    </button>

                    <button
                      type="button"
                      onClick={() => setConfirmDisconnectOpen(true)}
                      className="px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 text-xs font-medium flex items-center gap-1 cursor-pointer whitespace-nowrap transition-colors"
                    >
                      <Unplug className="w-3.5 h-3.5" />
                      <span>Disconnect</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => void connectGoogleClassroom(true)}
                    disabled={classroomSyncing}
                    className="h-10 px-4 rounded-xl bg-white dark:bg-[#131314] border border-[#747775] dark:border-[#8e918f] hover:bg-slate-50 dark:hover:bg-[#1f2024] text-[#1f1f1f] dark:text-[#e3e3e3] text-sm font-medium flex items-center gap-2.5 cursor-pointer whitespace-nowrap shadow-xs transition-colors disabled:opacity-60"
                  >
                    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] shrink-0" aria-hidden="true">
                      <path fill="#EA4335" d="M12 5c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.09 14.97 0 12 0 7.31 0 3.26 2.69 1.29 6.6l3.66 2.84C5.81 6.86 8.65 5 12 5z" />
                      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.72 2.89c2.17-2 3.7-4.95 3.7-8.71z" />
                      <path fill="#FBBC05" d="M4.95 14.44A7.12 7.12 0 0 1 4.58 12c0-.85.15-1.68.37-2.44L1.29 6.72A11.98 11.98 0 0 0 0 12c0 1.93.46 3.77 1.29 5.28l3.66-2.84z" />
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.72-2.89c-1.08.72-2.45 1.16-4.21 1.16-3.35 0-6.19-1.86-7.05-4.44l-3.66 2.84C3.26 21.31 7.31 24 12 24z" />
                    </svg>
                    <span>{classroomSyncing ? "Connecting Google Classroom..." : "Sign in with Google"}</span>
                  </button>
                )}
              </div>

              {classroomSyncError && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="flex-1">{classroomSyncError}</span>
                </div>
              )}

              {/* Explicit Confirmation Dialog for Disconnecting Google Classroom */}
              {confirmDisconnectOpen && (
                <div className="p-4 rounded-xl bg-red-50/70 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 space-y-3">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-red-900 dark:text-red-200">
                      Disconnect Google Classroom?
                    </p>
                    <p className="text-[11px] text-red-700 dark:text-red-300">
                      This clears your synced courses and Classroom notification history from this workspace.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-[#cbd5e1] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={removeTasksOnDisconnect}
                      onChange={e => setRemoveTasksOnDisconnect(e.target.checked)}
                      className="rounded accent-red-600"
                    />
                    <span>Also remove synced Google Classroom assignments from Task Manager</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        void disconnectGoogleClassroom(removeTasksOnDisconnect);
                        setConfirmDisconnectOpen(false);
                        setRemoveTasksOnDisconnect(false);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium cursor-pointer"
                    >
                      Confirm Disconnect
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmDisconnectOpen(false);
                        setRemoveTasksOnDisconnect(false);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-[#cbd5e1] text-xs font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {classroomConn.connected && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Left: Connected Courses & Notification Preferences */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#94a3b8]">
                          Synced Courses ({classroomConn.courses.length})
                        </h3>
                      </div>
                      {classroomConn.courses.length === 0 ? (
                        <p className="text-xs text-slate-400 dark:text-[#64748b] py-3">
                          No active courses found for this Google account.
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-52 overflow-y-auto gemini-scroll pr-1">
                          {classroomConn.courses.map(course => (
                            <div
                              key={course.id}
                              className="p-3 rounded-xl bg-slate-50 dark:bg-[#181c2b] border border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                  {course.name}
                                  {course.section ? ` · ${course.section}` : ""}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-[#94a3b8] truncate">
                                  {course.teacherName || "Google Classroom"}
                                </p>
                              </div>
                              {course.alternateLink && (
                                <a
                                  href={course.alternateLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  aria-label={`Open ${course.name} in Google Classroom`}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-[#0072FF] dark:hover:text-[#00E5FF] shrink-0"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Notification Preferences */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#181c2b] border border-slate-200/80 dark:border-white/[0.06] space-y-3">
                      <div className="flex items-center gap-1.5">
                        <Bell className="w-3.5 h-3.5 text-[#0072FF] dark:text-[#00E5FF]" />
                        <h3 className="text-xs font-semibold text-slate-900 dark:text-white">
                          Notification Preferences
                        </h3>
                      </div>

                      <label className="flex items-center justify-between gap-3 cursor-pointer">
                        <div>
                          <p className="text-xs font-medium text-slate-800 dark:text-white">
                            Assignment alerts
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-[#94a3b8]">
                            Notify when new coursework is added to Task Manager
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={classroomConn.assignmentNotifications}
                          onChange={e =>
                            void updateClassroomPreferences({ assignmentNotifications: e.target.checked })
                          }
                          className="w-4 h-4 accent-[#0072FF] cursor-pointer shrink-0"
                        />
                      </label>

                      <label className="flex items-center justify-between gap-3 cursor-pointer">
                        <div>
                          <p className="text-xs font-medium text-slate-800 dark:text-white">
                            Announcement & material alerts
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-[#94a3b8]">
                            Short notifications with teacher name and post link
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={classroomConn.announcementNotifications}
                          onChange={e =>
                            void updateClassroomPreferences({ announcementNotifications: e.target.checked })
                          }
                          className="w-4 h-4 accent-[#0072FF] cursor-pointer shrink-0"
                        />
                      </label>

                      <label className="flex items-center justify-between gap-3 cursor-pointer">
                        <div>
                          <p className="text-xs font-medium text-slate-800 dark:text-white">
                            Desktop browser notifications
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-[#94a3b8]">
                            Show OS alerts while using other tabs
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={classroomConn.browserNotifications}
                          onChange={e =>
                            void updateClassroomPreferences({ browserNotifications: e.target.checked })
                          }
                          className="w-4 h-4 accent-[#0072FF] cursor-pointer shrink-0"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Right: Notification History Feed */}
                  <div className="lg:col-span-7 flex flex-col space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Megaphone className="w-3.5 h-3.5 text-[#FF1E8A]" />
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#94a3b8]">
                          Notification History
                        </h3>
                        {unreadClassroomCount > 0 && (
                          <span className="text-[11px] font-semibold text-[#0072FF] dark:text-[#00E5FF] tabular-nums">
                            · {unreadClassroomCount} new
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {(
                          [
                            { id: "all", label: "All" },
                            { id: "assignment", label: "Assignments" },
                            { id: "announcement", label: "Announcements" }
                          ] as const
                        ).map(tab => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setNotifHistoryFilter(tab.id)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium cursor-pointer whitespace-nowrap transition-colors ${
                              notifHistoryFilter === tab.id
                                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                                : "bg-slate-100 dark:bg-[#181c2b] text-slate-600 dark:text-[#94a3b8]"
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                        {unreadClassroomCount > 0 && (
                          <button
                            type="button"
                            onClick={markAllClassroomNotificationsRead}
                            title="Mark all as read"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#0072FF] dark:hover:text-[#00E5FF] cursor-pointer"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {classroomHistory.length > 0 && !confirmClearHistory && (
                          <button
                            type="button"
                            onClick={() => setConfirmClearHistory(true)}
                            title="Clear notification history"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {confirmClearHistory && (
                      <div className="p-2.5 rounded-xl bg-red-50/70 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 flex items-center justify-between gap-2 text-xs">
                        <span className="text-red-800 dark:text-red-200">Clear all Classroom notification history?</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              clearClassroomNotificationHistory();
                              setConfirmClearHistory(false);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-[11px] font-medium cursor-pointer"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmClearHistory(false)}
                            className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.08] text-[11px] cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 max-h-80 overflow-y-auto gemini-scroll pr-1">
                      {filteredClassroomHistory.length === 0 ? (
                        <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#181c2b] border border-slate-200/80 dark:border-white/[0.06] text-center space-y-1.5">
                          <BellOff className="w-4 h-4 text-slate-400 mx-auto" />
                          <p className="text-xs text-slate-500 dark:text-[#94a3b8]">
                            No classroom updates recorded for this filter yet.
                          </p>
                        </div>
                      ) : (
                        filteredClassroomHistory.map(item => (
                          <div
                            key={item.id}
                            onClick={() => {
                              if (!item.read) markClassroomNotificationRead(item.id);
                            }}
                            className={`p-3.5 rounded-xl border transition-colors ${
                              item.read
                                ? "bg-slate-50 dark:bg-[#181c2b] border-slate-200/80 dark:border-white/[0.06]"
                                : "bg-blue-50/50 dark:bg-[#0072FF]/10 border-[#0072FF]/30"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 space-y-0.5">
                                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                  {!item.read && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#0072FF] dark:bg-[#00E5FF] shrink-0" />
                                  )}
                                  <span className="font-semibold text-[#0072FF] dark:text-[#00E5FF]">
                                    {item.type === "assignment"
                                      ? "Assignment"
                                      : item.type === "material"
                                      ? "Material"
                                      : "Announcement"}
                                  </span>
                                  <span className="text-slate-400 dark:text-[#64748b]">·</span>
                                  <span className="font-medium text-slate-700 dark:text-[#cbd5e1] truncate">
                                    {item.courseName}
                                  </span>
                                  <span className="text-slate-400 dark:text-[#64748b]">·</span>
                                  <span className="text-slate-500 dark:text-[#94a3b8] truncate">
                                    {item.teacherName}
                                  </span>
                                </div>
                                <p className="text-xs font-semibold text-slate-900 dark:text-white">
                                  {item.title}
                                </p>
                                <p className="text-[11px] text-slate-600 dark:text-[#cbd5e1] leading-relaxed line-clamp-2">
                                  {item.summary}
                                </p>
                              </div>
                              <span className="text-[10px] text-slate-400 dark:text-[#64748b] tabular-nums shrink-0">
                                {item.timestampLabel}
                              </span>
                            </div>
                            {item.linkUrl && (
                              <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-white/[0.06] flex justify-end">
                                <a
                                  href={item.linkUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-medium text-[#0072FF] dark:text-[#00E5FF] hover:underline"
                                >
                                  <span>Open in Google Classroom</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Row 1: GPA/CGPA Calculator + Pomodoro Focus Timer */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* GPA / CGPA Calculator */}
              <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.08] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-[#0072FF] dark:text-[#00E5FF]" />
                    <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                      GPA & CGPA Calculator
                    </h2>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-500 dark:text-[#94a3b8]">Scale:</span>
                    {(["4.0", "5.0"] as const).map(scale => (
                      <button
                        key={scale}
                        type="button"
                        onClick={() => updateStudyWorkspace({ gpaScale: scale })}
                        className={`px-2.5 py-1 rounded-lg font-medium tabular-nums cursor-pointer transition-colors ${
                          studyWorkspace.gpaScale === scale
                            ? "bg-[#0072FF] text-white"
                            : "bg-slate-100 dark:bg-[#181c2b] text-slate-600 dark:text-[#94a3b8]"
                        }`}
                      >
                        {scale}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleAddCourse} className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  <input
                    type="text"
                    value={courseSemester}
                    onChange={e => setCourseSemester(e.target.value)}
                    placeholder="Semester"
                    className="bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.08] rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#0072FF]"
                  />
                  <input
                    type="text"
                    value={courseCode}
                    onChange={e => setCourseCode(e.target.value)}
                    placeholder="Code (CSE 203)"
                    className="bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.08] rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#0072FF]"
                  />
                  <input
                    type="text"
                    value={courseTitle}
                    onChange={e => setCourseTitle(e.target.value)}
                    required
                    placeholder="Course title..."
                    className="col-span-2 sm:col-span-2 bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.08] rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#0072FF]"
                  />
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="12"
                    value={courseCredits}
                    onChange={e => setCourseCredits(e.target.value)}
                    title="Credits"
                    className="bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.08] rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white tabular-nums focus:outline-none focus:border-[#0072FF]"
                  />
                  <div className="flex items-center gap-1.5">
                    <select
                      aria-label="Grade point"
                      value={coursePoint}
                      onChange={e => setCoursePoint(e.target.value)}
                      className="flex-1 min-w-0 bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.08] rounded-xl px-2 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#0072FF]"
                    >
                      {gradeOptions.map(opt => (
                        <option key={opt.label} value={opt.point.toString()}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      aria-label="Add course"
                      className="p-2 rounded-xl bg-[#0072FF] hover:bg-[#005ce6] text-white cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </form>

                <div className="divide-y divide-slate-100 dark:divide-white/[0.06] max-h-64 overflow-y-auto gemini-scroll">
                  {studyWorkspace.gpaCourses.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-[#64748b] py-4 text-center">
                      Add your courses above to calculate semester GPA and cumulative CGPA.
                    </p>
                  ) : (
                    studyWorkspace.gpaCourses.map(course => (
                      <div key={course.id} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                            {course.code} · {course.title}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-[#94a3b8] tabular-nums">
                            {course.semester} · {course.credits} credits
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs font-mono font-semibold text-[#0072FF] dark:text-[#00E5FF] tabular-nums">
                            {course.letterGrade} ({Number(course.gradePoint).toFixed(2)})
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteCourse(course.id)}
                            aria-label="Remove course"
                            className="p-1 text-slate-400 hover:text-red-500 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Pomodoro Study Timer */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.08] flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#FF1E8A]" />
                    <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                      Focus Timer
                    </h2>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-[#94a3b8] tabular-nums">
                    {studyWorkspace.pomodoroMinutesTotal}m logged
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {([
                    { mins: 25, label: "Focus 25m" },
                    { mins: 5, label: "Break 5m" },
                    { mins: 15, label: "Long 15m" }
                  ] as const).map(p => (
                    <button
                      key={p.mins}
                      type="button"
                      onClick={() => handleSelectTimerPreset(p.mins)}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer transition-colors whitespace-nowrap ${
                        timerPreset === p.mins
                          ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                          : "bg-slate-100 dark:bg-[#181c2b] text-slate-600 dark:text-[#94a3b8]"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="py-4 text-center">
                  <div className="font-mono text-5xl font-semibold tracking-tight text-slate-900 dark:text-white tabular-nums">
                    {formatTimer(secondsLeft)}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-[#94a3b8] mt-1.5">
                    {timerRunning
                      ? timerPreset === 25
                        ? "Deep study session running"
                        : "Rest & recharge"
                      : "Ready to focus"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTimerRunning(prev => !prev)}
                    className="flex-1 py-2.5 rounded-xl bg-[#0072FF] hover:bg-[#005ce6] text-white text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    {timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{timerRunning ? "Pause" : "Start"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTimerRunning(false);
                      setSecondsLeft(timerPreset * 60);
                    }}
                    title="Reset timer"
                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#181c2b] hover:bg-slate-200 dark:hover:bg-[#1f2437] text-slate-700 dark:text-white cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Row 2: Syllabus Tracker + Assignment & Exam Checklist */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Syllabus Tracker */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.08] space-y-4">
                <div className="flex items-center gap-2">
                  <BookMarked className="w-4 h-4 text-[#8A2BE2]" />
                  <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                    Syllabus & Course Tracker
                  </h2>
                </div>

                <form onSubmit={handleAddSyllabus} className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    value={sylCourse}
                    onChange={e => setSylCourse(e.target.value)}
                    required
                    placeholder="Course (e.g. PHY 101)"
                    className="bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.08] rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#0072FF]"
                  />
                  <input
                    type="text"
                    value={sylModule}
                    onChange={e => setSylModule(e.target.value)}
                    placeholder="Current topic..."
                    className="bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.08] rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#0072FF]"
                  />
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={sylUnits}
                    onChange={e => setSylUnits(e.target.value)}
                    title="Total units/chapters"
                    placeholder="Units"
                    className="bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.08] rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white tabular-nums focus:outline-none focus:border-[#0072FF]"
                  />
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={sylExam}
                      onChange={e => setSylExam(e.target.value)}
                      placeholder="Exam date"
                      className="flex-1 min-w-0 bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.08] rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#0072FF]"
                    />
                    <button
                      type="submit"
                      aria-label="Add syllabus item"
                      className="p-2 rounded-xl bg-[#0072FF] hover:bg-[#005ce6] text-white cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </form>

                <div className="space-y-3">
                  {studyWorkspace.syllabusItems.map(item => {
                    const pct = Math.round((item.completedUnits / Math.max(1, item.totalUnits)) * 100);
                    return (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#181c2b] border border-slate-200/80 dark:border-white/[0.06] space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                              {item.courseName}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-[#94a3b8] truncate">
                              {item.moduleTitle} · {item.examDate}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStepSyllabus(item.id, -1)}
                              className="w-6 h-6 rounded-md bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold text-slate-700 dark:text-white cursor-pointer"
                            >
                              -
                            </button>
                            <span className="text-xs font-mono font-semibold text-slate-900 dark:text-white tabular-nums px-1">
                              {item.completedUnits}/{item.totalUnits}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleStepSyllabus(item.id, 1)}
                              className="w-6 h-6 rounded-md bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold text-slate-700 dark:text-white cursor-pointer"
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateStudyWorkspace(prev => ({
                                  ...prev,
                                  syllabusItems: prev.syllabusItems.filter(s => s.id !== item.id)
                                }))
                              }
                              aria-label="Delete syllabus tracker"
                              className="p-1 text-slate-400 hover:text-red-500 cursor-pointer ml-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-white/[0.08] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#0072FF] transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Assignment & Exam Task Manager */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.08] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                      Task Manager & Assignments
                    </h2>
                  </div>

                  <div className="flex items-center gap-1">
                    {(
                      [
                        { id: "all", label: "All" },
                        { id: "classroom", label: "Classroom" },
                        { id: "manual", label: "Manual" }
                      ] as const
                    ).map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setTaskSourceFilter(tab.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium cursor-pointer whitespace-nowrap transition-colors ${
                          taskSourceFilter === tab.id
                            ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                            : "bg-slate-100 dark:bg-[#181c2b] text-slate-600 dark:text-[#94a3b8]"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleAddAcademicCheck} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={acadTaskTitle}
                    onChange={e => setAcadTaskTitle(e.target.value)}
                    required
                    placeholder="Add assignment, lab, or exam milestone..."
                    className="flex-1 min-w-0 bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#0072FF]"
                  />
                  <input
                    type="text"
                    value={acadTaskDue}
                    onChange={e => setAcadTaskDue(e.target.value)}
                    placeholder="Due date"
                    className="w-24 bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.08] rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#0072FF]"
                  />
                  <button
                    type="submit"
                    aria-label="Add checklist item"
                    className="p-2 rounded-xl bg-[#0072FF] hover:bg-[#005ce6] text-white cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </form>

                <div className="divide-y divide-slate-100 dark:divide-white/[0.06] max-h-72 overflow-y-auto gemini-scroll">
                  {filteredAcademicTasks.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-[#64748b] py-6 text-center">
                      {taskSourceFilter === "classroom"
                        ? "No Google Classroom assignments synced yet."
                        : "No tasks in this list yet."}
                    </p>
                  ) : (
                    filteredAcademicTasks.map(item => (
                      <div key={item.id} className="py-3 flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          <button
                            type="button"
                            onClick={() =>
                              updateStudyWorkspace(prev => ({
                                ...prev,
                                academicChecklist: prev.academicChecklist.map(x =>
                                  x.id === item.id ? { ...x, completed: !x.completed } : x
                                )
                              }))
                            }
                            aria-label={`Toggle ${item.title}`}
                            className="mt-0.5 shrink-0 cursor-pointer"
                          >
                            {item.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                          <div className="min-w-0 flex-1 space-y-1">
                            <p
                              className={`text-xs font-medium ${
                                item.completed
                                  ? "line-through text-slate-400 dark:text-[#64748b]"
                                  : "text-slate-900 dark:text-white"
                              }`}
                            >
                              {item.title}
                            </p>
                            {(item.courseName || item.source === "google_classroom") && (
                              <p className="text-[11px] text-[#0072FF] dark:text-[#00E5FF] truncate">
                                {item.courseName || "Google Classroom"}
                              </p>
                            )}
                            {item.description && (
                              <p className="text-[11px] text-slate-500 dark:text-[#94a3b8] line-clamp-2 leading-relaxed">
                                {item.description}
                              </p>
                            )}
                            {(item.linkUrl || item.attachmentUrl) && (
                              <div className="flex flex-wrap items-center gap-3 pt-0.5">
                                {item.linkUrl && (
                                  <a
                                    href={item.linkUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-[#cbd5e1] hover:text-[#0072FF] dark:hover:text-[#00E5FF]"
                                  >
                                    <span>Open Assignment</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                                {item.attachmentUrl && (
                                  <a
                                    href={item.attachmentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-[#cbd5e1] hover:text-[#0072FF] dark:hover:text-[#00E5FF]"
                                  >
                                    <Paperclip className="w-3 h-3" />
                                    <span className="truncate max-w-[160px]">
                                      {item.attachmentLabel || "Attachment"}
                                    </span>
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] text-slate-400 dark:text-[#64748b] tabular-nums">
                            {item.dueDate}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateStudyWorkspace(prev => ({
                                ...prev,
                                academicChecklist: prev.academicChecklist.filter(x => x.id !== item.id)
                              }))
                            }
                            aria-label="Delete item"
                            className="p-1 text-slate-400 hover:text-red-500 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Row 3: Quick Academic Resource Links */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.08] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                  Quick Academic Resource Links
                </h2>
                <form onSubmit={handleAddAcademicLink} className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={linkTitle}
                    onChange={e => setLinkTitle(e.target.value)}
                    placeholder="Site name..."
                    className="bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.08] rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#0072FF]"
                  />
                  <input
                    type="text"
                    value={linkUrl}
                    onChange={e => setLinkUrl(e.target.value)}
                    placeholder="https://..."
                    className="bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.08] rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#0072FF]"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-medium cursor-pointer"
                  >
                    Add Link
                  </button>
                </form>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {studyWorkspace.academicLinks.map(lnk => (
                  <div
                    key={lnk.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#181c2b] border border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between gap-2 group"
                  >
                    <a
                      href={lnk.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-w-0 flex-1 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-[#0072FF] dark:group-hover:text-[#00E5FF] truncate">
                          {lnk.title}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-[#64748b] truncate">{lnk.category}</p>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0072FF] shrink-0" />
                    </a>
                    {lnk.category === "Personal" && (
                      <button
                        type="button"
                        onClick={() =>
                          updateStudyWorkspace(prev => ({
                            ...prev,
                            academicLinks: prev.academicLinks.filter(x => x.id !== lnk.id)
                          }))
                        }
                        aria-label="Remove link"
                        className="p-1 text-slate-400 hover:text-red-500 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* SUB-SECTION 2: IELTS                                             */}
        {/* ================================================================ */}
        {subTab === "ielts" && (
          <div className="space-y-6 text-left">
            {/* IELTS Band Score Calculator */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.08] space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#FF1E8A]" />
                    <span>IELTS Band Score Calculator</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-[#94a3b8] mt-0.5">
                    Official nearest-0.5 rounding · Raw mean: <span className="tabular-nums">{rawIeltsAvg.toFixed(2)}</span>
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[11px] text-slate-500 dark:text-[#94a3b8]">Target Band</p>
                    <select
                      aria-label="Target IELTS band"
                      value={studyWorkspace.ieltsTargetBand}
                      onChange={e => updateStudyWorkspace({ ieltsTargetBand: Number(e.target.value) })}
                      className="mt-0.5 bg-slate-100 dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.08] rounded-lg px-2 py-1 text-xs font-semibold text-slate-900 dark:text-white tabular-nums"
                    >
                      {IELTS_BAND_STEPS.map(b => (
                        <option key={b} value={b}>
                          {b.toFixed(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-center">
                    <p className="text-[10px] uppercase tracking-wider opacity-75">Overall Band</p>
                    <p className="font-display text-2xl font-bold tabular-nums leading-tight">
                      {overallBand.toFixed(1)}
                    </p>
                    <p className="text-[10px] opacity-80">{getCefrForBand(overallBand)}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {(
                  [
                    { key: "listening", label: "Listening" },
                    { key: "reading", label: "Reading" },
                    { key: "writing", label: "Writing" },
                    { key: "speaking", label: "Speaking" }
                  ] as const
                ).map(skill => {
                  const val = studyWorkspace.ieltsScores[skill.key];
                  return (
                    <div
                      key={skill.key}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#181c2b] border border-slate-200/80 dark:border-white/[0.06] space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-600 dark:text-[#cbd5e1]">
                          {skill.label}
                        </span>
                        <span className="font-mono text-sm font-semibold text-[#0072FF] dark:text-[#00E5FF] tabular-nums">
                          {val.toFixed(1)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={3.0}
                        max={9.0}
                        step={0.5}
                        value={val}
                        onChange={e =>
                          updateStudyWorkspace(prev => ({
                            ...prev,
                            ieltsScores: {
                              ...prev.ieltsScores,
                              [skill.key]: Number(e.target.value)
                            }
                          }))
                        }
                        aria-label={`${skill.label} band score`}
                        className="w-full accent-[#0072FF] cursor-pointer"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Row 2: 4-Skill Practice Tracker + IELTS Study Checklist */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Practice Log Tracker */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.08] space-y-4">
                <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                  L / R / W / S Practice Tracker
                </h2>

                <form onSubmit={handleAddIeltsLog} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <select
                    aria-label="Practice skill"
                    value={pracSkill}
                    onChange={e => setPracSkill(e.target.value as IeltsPracticeLog["skill"])}
                    className="bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.08] rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="Listening">Listening</option>
                    <option value="Reading">Reading</option>
                    <option value="Writing">Writing</option>
                    <option value="Speaking">Speaking</option>
                  </select>
                  <select
                    aria-label="Practice score"
                    value={pracScore}
                    onChange={e => setPracScore(e.target.value)}
                    className="bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.08] rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white tabular-nums"
                  >
                    {IELTS_BAND_STEPS.map(b => (
                      <option key={b} value={b.toString()}>
                        Band {b.toFixed(1)}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={pracTopic}
                    onChange={e => setPracTopic(e.target.value)}
                    required
                    placeholder="Test / topic..."
                    className="bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.08] rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#0072FF]"
                  />
                  <button
                    type="submit"
                    className="py-2 px-3 rounded-xl bg-[#0072FF] hover:bg-[#005ce6] text-white text-xs font-medium flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log</span>
                  </button>
                </form>

                <div className="divide-y divide-slate-100 dark:divide-white/[0.06] max-h-60 overflow-y-auto gemini-scroll">
                  {studyWorkspace.ieltsPracticeLogs.map(log => (
                    <div key={log.id} className="py-2.5 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-900 dark:text-white truncate">{log.topic}</p>
                        <p className="text-[11px] text-slate-500 dark:text-[#94a3b8]">
                          {log.skill} · {log.date}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-xs font-semibold text-[#0072FF] dark:text-[#00E5FF] tabular-nums">
                          {Number(log.score).toFixed(1)}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateStudyWorkspace(prev => ({
                              ...prev,
                              ieltsPracticeLogs: prev.ieltsPracticeLogs.filter(x => x.id !== log.id)
                            }))
                          }
                          aria-label="Delete practice log"
                          className="p-1 text-slate-400 hover:text-red-500 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* IELTS Study Checklist */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.08] space-y-4">
                <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                  IELTS Preparation Checklist
                </h2>

                <form onSubmit={handleAddIeltsCheck} className="flex items-center gap-2">
                  <select
                    aria-label="Checklist category"
                    value={ieltsTaskCat}
                    onChange={e => setIeltsTaskCat(e.target.value)}
                    className="bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.08] rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="Listening">Listening</option>
                    <option value="Reading">Reading</option>
                    <option value="Writing">Writing</option>
                    <option value="Speaking">Speaking</option>
                  </select>
                  <input
                    type="text"
                    value={ieltsTaskTitle}
                    onChange={e => setIeltsTaskTitle(e.target.value)}
                    required
                    placeholder="Add IELTS drill or milestone..."
                    className="flex-1 min-w-0 bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#0072FF]"
                  />
                  <button
                    type="submit"
                    aria-label="Add IELTS task"
                    className="p-2 rounded-xl bg-[#0072FF] hover:bg-[#005ce6] text-white cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </form>

                <div className="divide-y divide-slate-100 dark:divide-white/[0.06] max-h-60 overflow-y-auto gemini-scroll">
                  {studyWorkspace.ieltsChecklist.map(item => (
                    <div key={item.id} className="py-2.5 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateStudyWorkspace(prev => ({
                            ...prev,
                            ieltsChecklist: prev.ieltsChecklist.map(x =>
                              x.id === item.id ? { ...x, completed: !x.completed } : x
                            )
                          }))
                        }
                        className="flex items-center gap-2.5 text-left flex-1 min-w-0 cursor-pointer"
                      >
                        {item.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span
                          className={`text-xs truncate ${
                            item.completed ? "line-through text-slate-400 dark:text-[#64748b]" : "text-slate-900 dark:text-white"
                          }`}
                        >
                          {item.title}
                        </span>
                      </button>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-slate-400 dark:text-[#64748b]">{item.category}</span>
                        <button
                          type="button"
                          onClick={() =>
                            updateStudyWorkspace(prev => ({
                              ...prev,
                              ieltsChecklist: prev.ieltsChecklist.filter(x => x.id !== item.id)
                            }))
                          }
                          aria-label="Delete IELTS checklist item"
                          className="p-1 text-slate-400 hover:text-red-500 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Vocabulary & Cue-Card Notes */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.08] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                  Vocabulary & Cue-Card Notes
                </h2>
                <input
                  type="text"
                  value={vocabFilter}
                  onChange={e => setVocabFilter(e.target.value)}
                  placeholder="Filter words or cue cards..."
                  className="bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#0072FF]"
                />
              </div>

              <form onSubmit={handleAddVocab} className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                <select
                  aria-label="Entry type"
                  value={vocabCat}
                  onChange={e => setVocabCat(e.target.value as IeltsVocabNote["category"])}
                  className="bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.08] rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white"
                >
                  <option value="Vocabulary">Vocabulary</option>
                  <option value="Cue Card">Cue Card</option>
                </select>
                <input
                  type="text"
                  value={vocabTerm}
                  onChange={e => setVocabTerm(e.target.value)}
                  required
                  placeholder={vocabCat === "Vocabulary" ? "Word / idiom..." : "Cue card prompt..."}
                  className="bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.08] rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#0072FF]"
                />
                <input
                  type="text"
                  value={vocabMeaning}
                  onChange={e => setVocabMeaning(e.target.value)}
                  required
                  placeholder={vocabCat === "Vocabulary" ? "Definition..." : "Bullet outline..."}
                  className="bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.08] rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#0072FF]"
                />
                <input
                  type="text"
                  value={vocabExample}
                  onChange={e => setVocabExample(e.target.value)}
                  placeholder="Example / speaking tip..."
                  className="bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.08] rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#0072FF]"
                />
                <button
                  type="submit"
                  className="py-2 px-3 rounded-xl bg-[#0072FF] hover:bg-[#005ce6] text-white text-xs font-medium flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save Note</span>
                </button>
              </form>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {studyWorkspace.ieltsVocabNotes
                  .filter(
                    v =>
                      !vocabFilter.trim() ||
                      v.term.toLowerCase().includes(vocabFilter.toLowerCase()) ||
                      v.meaningOrNotes.toLowerCase().includes(vocabFilter.toLowerCase())
                  )
                  .map(entry => {
                    const isExpanded = expandedCueId === entry.id;
                    return (
                      <div
                        key={entry.id}
                        className="p-4 rounded-xl bg-slate-50 dark:bg-[#181c2b] border border-slate-200/80 dark:border-white/[0.06] space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setExpandedCueId(isExpanded ? null : entry.id)}
                            className="flex items-center gap-1.5 text-left min-w-0 cursor-pointer"
                          >
                            <ChevronRight
                              className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ${
                                isExpanded ? "rotate-90" : ""
                              }`}
                            />
                            <span className="text-xs font-semibold text-slate-900 dark:text-white">
                              {entry.term}
                            </span>
                          </button>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] text-[#0072FF] dark:text-[#00E5FF] font-medium">
                              {entry.category}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateStudyWorkspace(prev => ({
                                  ...prev,
                                  ieltsVocabNotes: prev.ieltsVocabNotes.filter(x => x.id !== entry.id)
                                }))
                              }
                              aria-label="Delete vocab note"
                              className="p-1 text-slate-400 hover:text-red-500 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-[#cbd5e1] leading-relaxed pl-5">
                          {entry.meaningOrNotes}
                        </p>
                        {entry.example && isExpanded && (
                          <p className="text-[11px] italic text-slate-500 dark:text-[#94a3b8] pl-5 pt-1">
                            "{entry.example}"
                          </p>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
