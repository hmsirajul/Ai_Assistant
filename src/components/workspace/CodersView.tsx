import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  Code2,
  Trophy,
  ExternalLink,
  Bookmark,
  CheckCircle2,
  Circle,
  Search,
  PlayCircle,
  FileText,
  Globe
} from "lucide-react";

interface CodingPlatformLink {
  name: string;
  url: string;
  summary: string;
}

interface CodingCategoryGroup {
  category: string;
  subtitle: string;
  platforms: CodingPlatformLink[];
}

const CODERS_TOOLS_DIRECTORY: CodingCategoryGroup[] = [
  {
    category: "Technical Interview Prep & Algorithms",
    subtitle: "Structured data structures, blind/grind lists, and coding interview tracks",
    platforms: [
      {
        name: "LeetCode",
        url: "https://leetcode.com",
        summary: "Industry-standard algorithm problem bank, mock interviews, and weekly contests."
      },
      {
        name: "HackerRank",
        url: "https://www.hackerrank.com",
        summary: "Skill certifications and curated interview preparation kits across languages."
      },
      {
        name: "NeetCode",
        url: "https://neetcode.io",
        summary: "Visual algorithm roadmap (NeetCode 150) with concise video & code explanations."
      }
    ]
  },
  {
    category: "Competitive Programming",
    subtitle: "Rated rounds, speed problem-solving, and algorithmic contests",
    platforms: [
      {
        name: "Codeforces",
        url: "https://codeforces.com",
        summary: "Global rated Div. 1–4 rounds, edu courses, and community editorial blogs."
      },
      {
        name: "CodeChef",
        url: "https://www.codechef.com",
        summary: "Weekly Starters contests, guided learning paths, and practice ratings."
      },
      {
        name: "AtCoder",
        url: "https://atcoder.jp",
        summary: "Clean Beginner (ABC), Regular (ARC), and Educational DP contests."
      }
    ]
  },
  {
    category: "Beginners & Interactive Learning",
    subtitle: "Hands-on fundamentals, syntax drills, and mentored exercises",
    platforms: [
      {
        name: "freeCodeCamp",
        url: "https://www.freecodecamp.org",
        summary: "Free full-stack web, Python, and CS certifications with interactive projects."
      },
      {
        name: "Codecademy",
        url: "https://www.codecademy.com",
        summary: "Interactive browser lessons for Python, JavaScript, C++, SQL, and web foundations."
      },
      {
        name: "Exercism",
        url: "https://exercism.org",
        summary: "Practice fluency in 70+ programming languages with free human code mentorship."
      },
      {
        name: "Codewars",
        url: "https://www.codewars.com",
        summary: "Bite-sized algorithmic kata challenges ranked by difficulty with peer solutions."
      }
    ]
  },
  {
    category: "Frontend & Web Development",
    subtitle: "Real UI design specs, responsive layout challenges, and CSS mastery",
    platforms: [
      {
        name: "Frontend Mentor",
        url: "https://www.frontendmentor.io",
        summary: "Real-world UI briefs and Figma specs for portfolio-grade frontend builds."
      },
      {
        name: "CSSBattle",
        url: "https://cssbattle.dev",
        summary: "Daily visual CSS targeting puzzles to sharpen layout, grid, and positioning speed."
      }
    ]
  },
  {
    category: "Data Science & Machine Learning",
    subtitle: "Datasets, notebooks, competitions, and applied ML courses",
    platforms: [
      {
        name: "Kaggle",
        url: "https://www.kaggle.com",
        summary: "ML competitions, public datasets, GPU notebooks, and concise micro-courses."
      }
    ]
  }
];

interface CpLearningResource {
  id: string;
  title: string;
  authorOrSource: string;
  format: "Video Tutorial" | "Article / Editorial" | "Platform";
  topics: string;
  description: string;
  url: string;
}

const CP_LEARNING_RESOURCES: CpLearningResource[] = [
  {
    id: "cp_algorithms",
    title: "CP-Algorithms (e-maxx)",
    authorOrSource: "cp-algorithms.com",
    format: "Article / Editorial",
    topics: "Graphs · Number Theory · Segment Trees · DP",
    description: "In-depth written proofs, complexity analysis, and C++ implementations of classic competitive algorithms.",
    url: "https://cp-algorithms.com"
  },
  {
    id: "usaco_guide",
    title: "USACO Guide",
    authorOrSource: "Competitive Programming Initiative",
    format: "Platform",
    topics: "Bronze to Platinum · Structured Modules",
    description: "Topic-by-topic curated roadmap pairing written articles, video walkthroughs, and graded practice problems.",
    url: "https://usaco.guide"
  },
  {
    id: "codeforces_edu",
    title: "Codeforces EDU Section",
    authorOrSource: "ITMO / Codeforces",
    format: "Video Tutorial",
    topics: "Binary Search · Two Pointers · DSU · Segment Tree",
    description: "Structured lecture videos paired directly with step-by-step practice problem sets inside Codeforces.",
    url: "https://codeforces.com/edu/courses"
  },
  {
    id: "cses_problemset",
    title: "CSES Problem Set",
    authorOrSource: "University of Helsinki",
    format: "Platform",
    topics: "Introductory · Sorting · DP · Trees · Geometry",
    description: "300 essential competitive programming problems accompanying the Competitive Programmer's Handbook.",
    url: "https://cses.fi/problemset/"
  },
  {
    id: "cph_handbook",
    title: "Competitive Programmer's Handbook (PDF)",
    authorOrSource: "Antti Laaksonen",
    format: "Article / Editorial",
    topics: "Complete Reference Book · Bitmasks · Amortized Analysis",
    description: "Free authoritative book covering everything from time complexity to advanced tree & string algorithms.",
    url: "https://cses.fi/book/book.pdf"
  },
  {
    id: "errichto_yt",
    title: "Errichto Algorithms & DP Lectures",
    authorOrSource: "YouTube · Kamil Debowski",
    format: "Video Tutorial",
    topics: "Dynamic Programming · Contest Strategy · Math",
    description: "High-signal contest walkthroughs, DP workshop lectures, and problem-solving thought processes.",
    url: "https://www.youtube.com/@Errichto"
  },
  {
    id: "striver_tuf",
    title: "Take U Forward · Striver A2Z & DP Series",
    authorOrSource: "takeuforward.org",
    format: "Video Tutorial",
    topics: "Recursion · DP · Graphs · Trees",
    description: "Step-by-step video lectures and written editorials building intuition from brute force to optimal solutions.",
    url: "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/"
  },
  {
    id: "william_fiset",
    title: "William Fiset Graph Theory & Data Structures",
    authorOrSource: "YouTube · William Fiset",
    format: "Video Tutorial",
    topics: "Dijkstra · Max Flow · Fenwick Tree · Union-Find",
    description: "Clean animated visualizations explaining graph theory, network flow, and advanced data structures.",
    url: "https://www.youtube.com/@WilliamFiset-videos"
  },
  {
    id: "gfg_algorithms",
    title: "GeeksforGeeks Algorithms & Editorials",
    authorOrSource: "geeksforgeeks.org",
    format: "Article / Editorial",
    topics: "Greedy · Backtracking · String Matching · Divide & Conquer",
    description: "Written articles with step-by-step dry runs and multi-language implementations for core algorithms.",
    url: "https://www.geeksforgeeks.org/fundamentals-of-algorithms/"
  }
];

export const CodersView: React.FC = () => {
  const { studyWorkspace, updateStudyWorkspace } = useApp();
  const [subTab, setSubTab] = useState<"tools" | "cp">("tools");
  const [toolSearch, setToolSearch] = useState("");
  const [cpFilter, setCpFilter] = useState<
    "All" | "Video Tutorial" | "Article / Editorial" | "Platform" | "Bookmarked"
  >("All");

  const bookmarkedSet = new Set(studyWorkspace.codersBookmarkedIds || []);
  const completedSet = new Set(studyWorkspace.codersCompletedIds || []);

  const toggleBookmark = (id: string) => {
    updateStudyWorkspace(prev => {
      const curr = prev.codersBookmarkedIds || [];
      const next = curr.includes(id) ? curr.filter(x => x !== id) : [...curr, id];
      return { ...prev, codersBookmarkedIds: next };
    });
  };

  const toggleCompleted = (id: string) => {
    updateStudyWorkspace(prev => {
      const curr = prev.codersCompletedIds || [];
      const next = curr.includes(id) ? curr.filter(x => x !== id) : [...curr, id];
      return { ...prev, codersCompletedIds: next };
    });
  };

  const normalizedSearch = toolSearch.trim().toLowerCase();

  const filteredToolsGroups = CODERS_TOOLS_DIRECTORY.map(group => ({
    ...group,
    platforms: group.platforms.filter(
      p =>
        !normalizedSearch ||
        p.name.toLowerCase().includes(normalizedSearch) ||
        p.summary.toLowerCase().includes(normalizedSearch) ||
        group.category.toLowerCase().includes(normalizedSearch)
    )
  })).filter(g => g.platforms.length > 0);

  const filteredCpResources = CP_LEARNING_RESOURCES.filter(res => {
    const matchesSearch =
      !normalizedSearch ||
      res.title.toLowerCase().includes(normalizedSearch) ||
      res.topics.toLowerCase().includes(normalizedSearch) ||
      res.description.toLowerCase().includes(normalizedSearch);
    if (!matchesSearch) return false;
    if (cpFilter === "Bookmarked") return bookmarkedSet.has(res.id);
    if (cpFilter === "All") return true;
    return res.format === cpFilter;
  });

  return (
    <div className="flex-1 min-h-0 overflow-y-auto gemini-scroll px-4 sm:px-8 pb-12">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header + Sub-Section Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-white/[0.08] pb-4 text-left">
          <div>
            <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
              Coders
            </h1>
            <p className="text-sm text-slate-500 dark:text-[#94a3b8] mt-1">
              Curated practice platforms by discipline and a Competitive Programming learning hub of videos & articles.
            </p>
          </div>

          <div className="inline-flex items-center p-1 rounded-xl bg-slate-200/70 dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.08] shrink-0">
            <button
              type="button"
              onClick={() => setSubTab("tools")}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                subTab === "tools"
                  ? "bg-white dark:bg-[#0b0d14] text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-[#0072FF] dark:text-[#00E5FF]" />
              <span>Tools</span>
            </button>
            <button
              type="button"
              onClick={() => setSubTab("cp")}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                subTab === "cp"
                  ? "bg-white dark:bg-[#0b0d14] text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-[#8A2BE2]" />
              <span>CP (Competitive Programming)</span>
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-md flex items-center">
            <Search className="w-4 h-4 text-slate-400 dark:text-[#64748b] absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={toolSearch}
              onChange={e => setToolSearch(e.target.value)}
              placeholder={subTab === "tools" ? "Search coding platforms..." : "Search algorithms, videos, or guides..."}
              className="w-full bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.08] focus:border-[#0072FF] rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748b] focus:outline-none"
            />
          </div>

          {subTab === "cp" && (
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {(["All", "Video Tutorial", "Article / Editorial", "Platform", "Bookmarked"] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setCpFilter(tab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    cpFilter === tab
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                      : "bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {tab === "Video Tutorial"
                    ? "Videos"
                    : tab === "Article / Editorial"
                      ? "Articles & Editorials"
                      : tab === "Platform"
                        ? "Platforms"
                        : tab}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ================================================================ */}
        {/* SUB-SECTION 1: TOOLS DIRECTORY (EXACT 5 CATEGORIES)              */}
        {/* ================================================================ */}
        {subTab === "tools" && (
          <div className="space-y-7 text-left">
            {filteredToolsGroups.map(group => (
              <section key={group.category} className="space-y-3">
                <div>
                  <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                    {group.category}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-[#94a3b8] mt-0.5">{group.subtitle}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {group.platforms.map(platform => (
                    <a
                      key={platform.name}
                      href={platform.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group p-4 rounded-2xl bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.08] hover:border-[#0072FF]/50 transition-colors flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white group-hover:text-[#0072FF] dark:group-hover:text-[#00E5FF] transition-colors">
                            {platform.name}
                          </h3>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0072FF] dark:group-hover:text-[#00E5FF] shrink-0" />
                        </div>
                        <p className="text-xs text-slate-600 dark:text-[#cbd5e1] leading-relaxed">
                          {platform.summary}
                        </p>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 dark:text-[#64748b] truncate">
                        {platform.url.replace(/^https?:\/\/(www\.)?/, "")}
                      </span>
                    </a>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* ================================================================ */}
        {/* SUB-SECTION 2: CP LEARNING HUB (VIDEOS & ARTICLES)               */}
        {/* ================================================================ */}
        {subTab === "cp" && (
          <div className="space-y-4 text-left">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#94a3b8]">
              <span>
                Showing <span className="tabular-nums font-medium text-slate-800 dark:text-white">{filteredCpResources.length}</span> curated resources
              </span>
              <span className="tabular-nums">
                {completedSet.size} completed · {bookmarkedSet.size} saved
              </span>
            </div>

            {filteredCpResources.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.08] text-center text-xs text-slate-500 dark:text-[#94a3b8]">
                No matching CP resources found. Try clearing your filter or search query.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCpResources.map(res => {
                  const isBookmarked = bookmarkedSet.has(res.id);
                  const isCompleted = completedSet.has(res.id);
                  const FormatIcon =
                    res.format === "Video Tutorial"
                      ? PlayCircle
                      : res.format === "Article / Editorial"
                        ? FileText
                        : Globe;

                  return (
                    <div
                      key={res.id}
                      className="p-5 rounded-2xl bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.08] flex flex-col justify-between gap-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <FormatIcon className="w-4 h-4 text-[#0072FF] dark:text-[#00E5FF] shrink-0" />
                            <span className="text-[11px] font-medium text-slate-500 dark:text-[#94a3b8] truncate">
                              {res.format} · {res.authorOrSource}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => toggleBookmark(res.id)}
                              title={isBookmarked ? "Remove bookmark" : "Bookmark resource"}
                              aria-label={isBookmarked ? "Remove bookmark" : "Bookmark resource"}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isBookmarked
                                  ? "text-[#FF1E8A] bg-pink-50 dark:bg-pink-500/10"
                                  : "text-slate-400 hover:text-slate-900 dark:hover:text-white"
                              }`}
                            >
                              <Bookmark className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleCompleted(res.id)}
                              title={isCompleted ? "Mark unread" : "Mark completed"}
                              aria-label={isCompleted ? "Mark unread" : "Mark completed"}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isCompleted
                                  ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10"
                                  : "text-slate-400 hover:text-slate-900 dark:hover:text-white"
                              }`}
                            >
                              {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                          {res.title}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-[#cbd5e1] leading-relaxed">
                          {res.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
                        <span className="text-[11px] text-slate-400 dark:text-[#64748b] truncate">
                          {res.topics}
                        </span>
                        <a
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-[#0072FF] dark:text-[#00E5FF] hover:underline inline-flex items-center gap-1 shrink-0 whitespace-nowrap"
                        >
                          <span>{res.format === "Video Tutorial" ? "Watch" : "Read / Open"}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
