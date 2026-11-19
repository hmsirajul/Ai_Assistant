import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Camera, Upload, Scan, FileText, Globe, Sparkles, Check, Copy, Share2, X, RefreshCw, Eye } from "lucide-react";
import { analyzeImageVision } from "../../services/api";

export const VisionModal: React.FC = () => {
  const { isVisionModalOpen, setIsVisionModalOpen, addKnowledgeItem, addActivityLog, addNotification } = useApp();

  const [mode, setMode] = useState<any>("Scan Document");
  const [prompt, setPrompt] = useState("Extract all text and structure into clean markdown.");
  const [selectedImage, setSelectedImage] = useState<string | null>(
    "data:image/svg+xml;utf8," +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="360" viewBox="0 0 600 360"><rect width="600" height="360" fill="#0b0d14"/><rect x="40" y="36" width="520" height="288" rx="16" fill="#181c2b" stroke="#28304a" stroke-width="1.5"/><text x="72" y="84" fill="#f8fafc" font-family="sans-serif" font-size="22" font-weight="600">Quarterly Architecture Review</text><text x="72" y="120" fill="#94a3b8" font-family="sans-serif" font-size="14">Date: Nov 19, 2026  |  Status: Ready for OCR</text><line x1="72" y1="142" x2="528" y2="142" stroke="#28304a"/><text x="72" y="176" fill="#cbd5e1" font-family="sans-serif" font-size="14">1. Hybrid edge + cloud model routing latency: 140ms</text><text x="72" y="206" fill="#cbd5e1" font-family="sans-serif" font-size="14">2. Offline SQLite knowledge index synced: 3 packages</text><text x="72" y="236" fill="#cbd5e1" font-family="sans-serif" font-size="14">3. Action confirmation safeguards: Levels 1 - 3 active</text><rect x="72" y="264" width="168" height="34" rx="8" fill="#0072FF"/><text x="94" y="286" fill="#ffffff" font-family="sans-serif" font-size="13" font-weight="600">Extract Text &amp; Summary</text></svg>`
      )
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  if (!isVisionModalOpen) return null;

  const modes = [
    { id: "Scan Document", icon: Scan, desc: "Extract structured tables, OCR typography, and paperwork." },
    { id: "Ask About Image", icon: Sparkles, desc: "General visual Q&A and scene understanding." },
    { id: "Translate Text", icon: Globe, desc: "Instant translation of signs, menus, and foreign text." },
    { id: "Read Text", icon: FileText, desc: "Quick optical character recognition for easy copying." }
  ];

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setResult(null);
    const res = await analyzeImageVision(mode, prompt, selectedImage || undefined);
    setTimeout(() => {
      setIsAnalyzing(false);
      setResult(res);
      addActivityLog({
        command: `Vision: ${mode}`,
        interpretation: `Scan & OCR visual data for ${mode}`,
        actionPerformed: "Extracted typography and generated actionable recommendations",
        serviceUsed: "Gemini 4 Hydrogen / Vision OCR",
        dataAccessed: "Uploaded Image Buffer",
        permissionUsed: "Camera & Vision Permission",
        result: "Success",
        confirmationLevel: 1
      });
    }, 1500);
  };

  const handleCopyText = () => {
    if (result?.extractedText || result?.analysis) {
      navigator.clipboard?.writeText(result.extractedText || result.analysis);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveToKnowledge = () => {
    if (!result) return;
    addKnowledgeItem({
      id: `know_vis_${Date.now()}`,
      name: `Vision Scan (${mode}): ${new Date().toLocaleDateString()}`,
      type: "Image",
      size: "820 KB",
      uploadDate: "Just now",
      summary: result.analysis.slice(0, 100) + "...",
      topics: ["Vision OCR", mode, ...result.detectedObjects],
      isOffline: true,
      content: result.analysis
    });
    addNotification({
      title: "Saved OCR Scan",
      message: "Extracted text saved to Knowledge Library.",
      category: "system"
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#121520] rounded-2xl shadow-2xl overflow-hidden border border-white/[0.1] flex flex-col max-h-[90vh] text-[#e2e8f0]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0072FF]/20 via-[#8A2BE2]/15 to-[#121520] border-b border-white/[0.08] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-[#0072FF]/20 border border-[#0072FF]/35 text-[#00E5FF]">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-base leading-tight">Camera & Vision Scanner (Section 17)</h2>
              <p className="text-[11px] text-[#94a3b8]">Real-time OCR, document scanning, translation & scene analysis</p>
            </div>
          </div>
          <button
            onClick={() => setIsVisionModalOpen(false)}
            className="p-1.5 rounded-lg hover:bg-white/[0.08] text-[#94a3b8] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-left max-h-[75vh] gemini-scroll">
          
          {/* Mode Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {modes.map(m => {
              const Icon = m.icon;
              const isSelected = mode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setMode(m.id);
                    setResult(null);
                  }}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#0072FF]/15 border-[#0072FF] text-white font-semibold"
                      : "bg-[#181c2b] border-white/[0.08] text-[#cbd5e1] hover:bg-[#1f2437] text-xs"
                  }`}
                >
                  <Icon className={`w-4 h-4 mx-auto mb-1 ${isSelected ? "text-[#00E5FF]" : "text-[#64748b]"}`} />
                  <span className="text-xs block font-semibold truncate">{m.id}</span>
                </button>
              );
            })}
          </div>

          {/* Image preview & upload */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            <div className="relative rounded-2xl overflow-hidden border border-white/[0.1] bg-[#0b0d14] group max-h-56 flex items-center justify-center">
              {selectedImage ? (
                <img src={selectedImage} alt="Scan preview" className="w-full h-56 object-cover opacity-95 group-hover:opacity-100 transition-opacity" />
              ) : (
                <div className="p-8 text-center text-[#64748b]">
                  <Camera className="w-8 h-8 mx-auto mb-2 opacity-60" />
                  <span className="text-xs">No image selected</span>
                </div>
              )}
              
              <label className="absolute bottom-2.5 right-2.5 bg-[#121520]/90 hover:bg-[#181c2b] border border-white/[0.15] text-white px-3 py-1.5 rounded-xl text-xs font-medium flex items-center space-x-1.5 cursor-pointer backdrop-blur-xs transition-all">
                <Upload className="w-3.5 h-3.5 text-[#00E5FF]" />
                <span>Upload Photo</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider">Analysis Instruction</label>
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 bg-[#181c2b] border border-white/[0.1] rounded-xl text-xs font-medium text-white mt-1.5 focus:border-[#0072FF] focus:outline-none"
                />
              </div>

              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !selectedImage}
                className="w-full py-2.5 btn-diptik-primary disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer whitespace-nowrap"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Scanning & OCR Processing...</span>
                  </>
                ) : (
                  <>
                    <Scan className="w-4 h-4" />
                    <span>Scan & Analyze Image</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Analysis Result (Section 17.2) */}
          {result && (
            <div className="space-y-4 pt-3 border-t border-white/[0.08] animate-in fade-in duration-200">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full uppercase">
                  {result.mode} Complete
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={handleCopyText}
                    className="px-2.5 py-1.5 bg-[#181c2b] hover:bg-[#1f2437] border border-white/[0.1] text-[#cbd5e1] hover:text-white rounded-lg text-xs font-medium flex items-center space-x-1 cursor-pointer whitespace-nowrap"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Copied" : "Copy OCR"}</span>
                  </button>
                  <button
                    onClick={handleSaveToKnowledge}
                    className="px-2.5 py-1.5 bg-[#0072FF]/20 hover:bg-[#0072FF]/30 border border-[#0072FF]/35 text-[#00E5FF] rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap"
                  >
                    Save to Knowledge
                  </button>
                </div>
              </div>

              <div className="p-4 bg-[#181c2b] border border-white/[0.08] rounded-2xl font-sans text-xs text-[#e2e8f0] leading-relaxed whitespace-pre-line">
                {result.analysis}
              </div>

              {/* Detected tags */}
              <div>
                <span className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">Detected Elements</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {result.detectedObjects?.map((obj: string, i: number) => (
                    <span key={i} className="text-[10px] font-medium bg-[#181c2b] border border-white/[0.08] text-[#cbd5e1] px-2.5 py-0.5 rounded-full">
                      {obj}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
