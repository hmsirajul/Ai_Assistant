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
  ChevronRight
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
  const { studyWorkspace, updateStudyWorkspace } = useApp();
  const [subTab, setSubTab] = useState<"academic" | "ielts">("academic");

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

              {/* Assignment & Exam Checklist */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.08] space-y-4">
                <div className="flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                    Assignments & Exam Checklist
                  </h2>
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

                <div className="divide-y divide-slate-100 dark:divide-white/[0.06] max-h-64 overflow-y-auto gemini-scroll">
                  {studyWorkspace.academicChecklist.map(item => (
                    <div key={item.id} className="py-2.5 flex items-center justify-between gap-2">
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
                  ))}
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
