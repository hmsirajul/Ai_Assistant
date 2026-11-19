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
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#121520] rounded-2xl shadow-2xl overflow-hidden border border-white/[0.1] flex flex-col max-h-[90vh] text-[#e2e8f0]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#8A2BE2]/20 via-[#0072FF]/15 to-[#121520] border-b border-white/[0.08] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-[#0072FF]/20 border border-[#0072FF]/35 text-[#00E5FF]">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-base leading-tight">Research Mode (Section 18)</h2>
              <p className="text-[11px] text-[#94a3b8]">Multi-source comparison, citation checking & report generation</p>
            </div>
          </div>
          <button
            onClick={() => setIsResearchModalOpen(false)}
            className="p-1.5 rounded-lg hover:bg-white/[0.08] text-[#94a3b8] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step 1: Research Setup (Section 18.1) */}
        {status === "setup" && (
          <div className="p-6 overflow-y-auto space-y-5 text-left">
            <div>
              <label className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider">Research Question or Topic</label>
              <textarea
                value={query}
                onChange={e => setQuery(e.target.value)}
                rows={3}
                placeholder="What would you like DiptiK AI 3 to investigate deeply?"
                className="w-full p-3 bg-[#181c2b] border border-white/[0.1] rounded-xl text-xs font-medium text-white placeholder-[#64748b] mt-1.5 focus:border-[#0072FF] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider">Desired Research Depth</label>
              <div className="grid grid-cols-3 gap-2.5 mt-1.5">
                {(["Quick Answer", "Standard Research", "Deep Research"] as const).map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDepth(d)}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      depth === d
                        ? "bg-[#0072FF]/15 border-[#0072FF] text-white font-semibold"
                        : "bg-[#181c2b] border-white/[0.08] text-[#cbd5e1] hover:bg-[#1f2437] text-xs font-medium"
                    }`}
                  >
                    <span className="text-xs block">{d}</span>
                    <span className={`text-[10px] mt-0.5 block ${depth === d ? "text-[#00E5FF]" : "text-[#64748b]"}`}>
                      {d === "Quick Answer" ? "1-2 sources" : d === "Standard Research" ? "5-8 sources" : "15+ sources"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider">Date Range</label>
                <select
                  value={dateRange}
                  onChange={e => setDateRange(e.target.value)}
                  className="w-full p-2.5 bg-[#181c2b] border border-white/[0.1] rounded-xl text-xs font-medium text-white mt-1.5 focus:border-[#0072FF] focus:outline-none"
                >
                  <option className="bg-[#181c2b] text-white">Past Week</option>
                  <option className="bg-[#181c2b] text-white">Past Month</option>
                  <option className="bg-[#181c2b] text-white">Past Year</option>
                  <option className="bg-[#181c2b] text-white">All Time</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider">Output Format</label>
                <select
                  value={format}
                  onChange={e => setFormat(e.target.value)}
                  className="w-full p-2.5 bg-[#181c2b] border border-white/[0.1] rounded-xl text-xs font-medium text-white mt-1.5 focus:border-[#0072FF] focus:outline-none"
                >
                  <option className="bg-[#181c2b] text-white">Executive Summary</option>
                  <option className="bg-[#181c2b] text-white">Detailed Whitepaper</option>
                  <option className="bg-[#181c2b] text-white">Presentation Outline</option>
                  <option className="bg-[#181c2b] text-white">Actionable Bullet Points</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleStartResearch}
                className="py-2.5 px-6 btn-diptik-primary text-white rounded-xl text-xs font-semibold shadow-md flex items-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap"
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
              <RefreshCw className="w-20 h-20 text-[#00E5FF] animate-spin" />
              <span className="absolute font-mono text-xs font-semibold text-white">{progressStep}/6</span>
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Deep Research in Progress</h3>
              <p className="text-xs text-[#00E5FF] font-medium mt-2 min-h-[36px]">
                {progressLabels[Math.min(progressStep - 1, 5)]}
              </p>
            </div>
            <div className="w-full bg-[#181c2b] border border-white/[0.08] h-2.5 rounded-full overflow-hidden max-w-md mx-auto">
              <div
                className="bg-gradient-to-r from-[#FF1E8A] via-[#8A2BE2] to-[#00E5FF] h-full transition-all duration-300"
                style={{ width: `${(progressStep / 6) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Step 3: Research Result (Section 18.3) */}
        {status === "result" && reportData && (
          <div className="p-6 overflow-y-auto space-y-5 text-left flex-1 max-h-[70vh] gemini-scroll">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 gap-3">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#00E5FF] bg-[#0072FF]/15 border border-[#0072FF]/30 px-2.5 py-0.5 rounded-full">
                  {reportData.depth}
                </span>
                <h3 className="text-base font-semibold text-white mt-1.5">{query}</h3>
              </div>
              <div className="flex space-x-1.5 shrink-0">
                <button
                  onClick={handleSaveToKnowledge}
                  title="Save report to Knowledge Library"
                  className="px-3 py-1.5 rounded-xl bg-[#181c2b] hover:bg-[#1f2437] border border-white/[0.1] text-[#cbd5e1] hover:text-white text-xs font-medium flex items-center space-x-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5 text-[#00E5FF]" />
                  <span>Save</span>
                </button>
              </div>
            </div>

            {/* Report body */}
            <div className="p-4 bg-[#181c2b] border border-white/[0.08] rounded-2xl font-sans text-xs text-[#e2e8f0] leading-relaxed whitespace-pre-line">
              {reportData.report}
            </div>

            {/* Verified Sources (Section 18.3) */}
            <div>
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#00E5FF]" />
                <span>Verified Citations & Credibility</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {reportData.sources?.map((src: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl border border-white/[0.08] bg-[#181c2b] flex items-center justify-between gap-2">
                    <div className="truncate pr-2">
                      <span className="text-xs font-semibold text-white block truncate">{src.title}</span>
                      <span className="text-[10px] text-[#94a3b8] block truncate">{src.url}</span>
                    </div>
                    <span className="text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full shrink-0">
                      {src.credibility}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer controls */}
            <div className="flex justify-between items-center pt-3 border-t border-white/[0.08]">
              <button
                onClick={() => setStatus("setup")}
                className="py-2 px-4 bg-[#181c2b] hover:bg-[#1f2437] border border-white/[0.08] text-[#cbd5e1] hover:text-white rounded-xl text-xs font-medium cursor-pointer whitespace-nowrap"
              >
                New Research
              </button>
              <button
                onClick={() => setIsResearchModalOpen(false)}
                className="py-2.5 px-6 btn-diptik-primary text-white rounded-xl text-xs font-semibold shadow-md cursor-pointer whitespace-nowrap"
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
