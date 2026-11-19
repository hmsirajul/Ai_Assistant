import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Search, Compass, BookOpen, Share2, Download, CheckCircle, RefreshCw, X, ArrowRight, FileText, ExternalLink } from "lucide-react";
import { runDeepResearch } from "../../services/api";

export const ResearchModal: React.FC = () => {
  const { isResearchModalOpen, setIsResearchModalOpen, addActivityLog, addKnowledgeItem, addNotification } = useApp();

  const [query, setQuery] = useState("AI Agent architecture trends in mobile OS 2026");
  const [depth, setDepth] = useState<"Quick Answer" | "Standard Research" | "Deep Research">("Standard Research");
  const [dateRange, setDateRange] = useState("Past Year");
  const [format, setFormat] = useState("Executive Summary");
  const [status, setStatus] = useState<"setup" | "progress" | "result">("setup");
  const [reportData, setReportData] = useState<any>(null);
  const [progressStep, setProgressStep] = useState(1);

  if (!isResearchModalOpen) return null;

  const handleStartResearch = async () => {
    if (!query.trim()) return;
    setStatus("progress");
    setProgressStep(1);

    const interval = setInterval(() => {
      setProgressStep(prev => {
        if (prev >= 6) {
          clearInterval(interval);
          return 6;
        }
        return prev + 1;
      });
    }, 400);

    const res = await runDeepResearch(query, depth, dateRange, format);
    setTimeout(() => {
      clearInterval(interval);
      setReportData(res);
      setStatus("result");
      addActivityLog({
        command: `Research: "${query}"`,
        interpretation: `Deep Research (${depth}) across multiple verified sources`,
        actionPerformed: "Synthesized executive briefing with citations",
        serviceUsed: "Gemini 4 Hydrogen / Deep Research Engine",
        dataAccessed: "Web & Academic Indexes",
        permissionUsed: "Level 1 Safe Action",
        result: "Success",
        confirmationLevel: 1
      });
    }, 2500);
  };

  const handleSaveToKnowledge = () => {
    if (!reportData) return;
    addKnowledgeItem({
      id: `know_res_${Date.now()}`,
      name: `Research: ${query.slice(0, 25)}...`,
      type: "Text Note",
      size: "45 KB",
      uploadDate: "Just now",
      summary: reportData.report.slice(0, 120) + "...",
      topics: ["Deep Research", depth, "Executive Brief"],
      isOffline: true,
      content: reportData.report
    });
    addNotification({
      title: "Saved to Knowledge Library",
      message: "Research briefing added to your Knowledge Library.",
      category: "system"
    });
  };

  const progressLabels = [
    "1. Planning search terms & source queries...",
    "2. Searching scholarly journals & verified APIs...",
    "3. Reading 14 relevant web & academic sources...",
    "4. Comparing conflicting information & data claims...",
    "5. Preparing answer in " + format + " format...",
    "6. Checking citations & verifying credibility..."
  ];

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-white/10 text-white">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight">Research Mode (Section 18)</h2>
              <p className="text-[11px] text-blue-200">Multi-source comparison, citation checking & report generation</p>
            </div>
          </div>
          <button
            onClick={() => setIsResearchModalOpen(false)}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Research Setup (Section 18.1) */}
        {status === "setup" && (
          <div className="p-6 overflow-y-auto space-y-5 text-left">
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase">Research Question or Topic</label>
              <textarea
                value={query}
                onChange={e => setQuery(e.target.value)}
                rows={3}
                placeholder="What would you like DiptiK AI to investigate deeply?"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium mt-1.5 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 uppercase">Desired Research Depth</label>
              <div className="grid grid-cols-3 gap-2 mt-1.5">
                {(["Quick Answer", "Standard Research", "Deep Research"] as const).map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDepth(d)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      depth === d
                        ? "bg-blue-50 border-blue-600 text-blue-900 font-bold ring-1 ring-blue-600"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-medium"
                    }`}
                  >
                    <span className="text-xs block">{d}</span>
                    <span className="text-[9px] text-gray-400 mt-0.5 block">
                      {d === "Quick Answer" ? "1-2 sources" : d === "Standard Research" ? "5-8 sources" : "15+ sources"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase">Date Range</label>
                <select
                  value={dateRange}
                  onChange={e => setDateRange(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium mt-1"
                >
                  <option>Past Week</option>
                  <option>Past Month</option>
                  <option>Past Year</option>
                  <option>All Time</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase">Output Format</label>
                <select
                  value={format}
                  onChange={e => setFormat(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium mt-1"
                >
                  <option>Executive Summary</option>
                  <option>Detailed Whitepaper</option>
                  <option>Presentation Outline</option>
                  <option>Actionable Bullet Points</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleStartResearch}
                className="py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <span>Start Deep Research</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Research Progress (Section 18.2) */}
        {status === "progress" && (
          <div className="p-12 text-center space-y-6">
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <RefreshCw className="w-20 h-20 text-blue-600 animate-spin" />
              <span className="absolute font-mono text-xs font-bold text-gray-800">{progressStep}/6</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Deep Research in Progress</h3>
              <p className="text-xs text-blue-600 font-semibold mt-2 min-h-[36px]">
                {progressLabels[Math.min(progressStep - 1, 5)]}
              </p>
            </div>
            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden max-w-md mx-auto">
              <div
                className="bg-blue-600 h-full transition-all duration-300"
                style={{ width: `${(progressStep / 6) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Step 3: Research Result (Section 18.3) */}
        {status === "result" && reportData && (
          <div className="p-6 overflow-y-auto space-y-5 text-left flex-1 max-h-[70vh]">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  {reportData.depth}
                </span>
                <h3 className="text-base font-bold text-gray-900 mt-1">{query}</h3>
              </div>
              <div className="flex space-x-1.5">
                <button
                  onClick={handleSaveToKnowledge}
                  title="Save report to Knowledge Library"
                  className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
              </div>
            </div>

            {/* Report body */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl font-sans text-xs text-gray-800 leading-relaxed whitespace-pre-line shadow-inner">
              {reportData.report}
            </div>

            {/* Verified Sources (Section 18.3) */}
            <div>
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center space-x-1">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                <span>Verified Citations & Credibility</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {reportData.sources?.map((src: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-xl border border-gray-200 bg-white flex items-center justify-between">
                    <div className="truncate pr-2">
                      <span className="text-xs font-bold text-gray-900 block truncate">{src.title}</span>
                      <span className="text-[10px] text-gray-400 block truncate">{src.url}</span>
                    </div>
                    <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full shrink-0">
                      {src.credibility}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer controls */}
            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
              <button
                onClick={() => setStatus("setup")}
                className="py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold"
              >
                New Research
              </button>
              <button
                onClick={() => setIsResearchModalOpen(false)}
                className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
