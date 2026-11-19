import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Camera, Upload, Scan, FileText, Globe, Sparkles, Check, Copy, Share2, X, RefreshCw, Eye } from "lucide-react";
import { analyzeImageVision } from "../../services/api";

export const VisionModal: React.FC = () => {
  const { isVisionModalOpen, setIsVisionModalOpen, addKnowledgeItem, addActivityLog, addNotification } = useApp();

  const [mode, setMode] = useState<any>("Scan Document");
  const [prompt, setPrompt] = useState("Extract all text and structure into clean markdown.");
  const [selectedImage, setSelectedImage] = useState<string | null>("https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=600&q=80");
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
    <div className="fixed inset-0 z-50 bg-gray-900/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-white/10 text-white">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight">Camera & Vision Scanner (Section 17)</h2>
              <p className="text-[11px] text-emerald-200">Real-time OCR, document scanning, translation & scene analysis</p>
            </div>
          </div>
          <button
            onClick={() => setIsVisionModalOpen(false)}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-left max-h-[75vh]">
          
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
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    isSelected
                      ? "bg-emerald-50 border-emerald-600 text-emerald-900 font-bold ring-1 ring-emerald-600"
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 text-xs"
                  }`}
                >
                  <Icon className={`w-4 h-4 mx-auto mb-1 ${isSelected ? "text-emerald-600" : "text-gray-400"}`} />
                  <span className="text-xs block font-bold truncate">{m.id}</span>
                </button>
              );
            })}
          </div>

          {/* Image preview & upload */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-900 group max-h-56 flex items-center justify-center">
              {selectedImage ? (
                <img src={selectedImage} alt="Scan preview" className="w-full h-56 object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
              ) : (
                <div className="p-8 text-center text-gray-400">
                  <Camera className="w-8 h-8 mx-auto mb-2 opacity-60" />
                  <span className="text-xs">No image selected</span>
                </div>
              )}
              
              <label className="absolute bottom-2 right-2 bg-black/70 hover:bg-black text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer backdrop-blur-xs transition-all">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Photo</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase">Analysis Instruction</label>
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium mt-1 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !selectedImage}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer"
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
            <div className="space-y-4 pt-3 border-t border-gray-100 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase">
                  {result.mode} Complete
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={handleCopyText}
                    className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold flex items-center space-x-1"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Copied" : "Copy OCR"}</span>
                  </button>
                  <button
                    onClick={handleSaveToKnowledge}
                    className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg text-xs font-bold"
                  >
                    Save to Knowledge
                  </button>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl font-sans text-xs text-gray-800 leading-relaxed whitespace-pre-line shadow-inner">
                {result.analysis}
              </div>

              {/* Detected tags */}
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase">Detected Elements</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {result.detectedObjects?.map((obj: string, i: number) => (
                    <span key={i} className="text-[10px] font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
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
