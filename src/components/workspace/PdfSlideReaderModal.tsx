import React, { useEffect, useState } from "react";
import { LibraryDocumentItem } from "../../types";
import { useApp } from "../../context/AppContext";
import { getLibraryBlob, saveLibraryBlob, formatFileSize } from "../../lib/libraryStorage";
import {
  X,
  Download,
  ExternalLink,
  PanelRightOpen,
  PanelRightClose,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  FileText,
  Presentation,
  BookOpen,
  Upload,
  Check
} from "lucide-react";

interface PdfSlideReaderModalProps {
  docItem: LibraryDocumentItem | null;
  onClose: () => void;
  onAskAI?: (prompt: string) => void;
}

export const PdfSlideReaderModal: React.FC<PdfSlideReaderModalProps> = ({
  docItem,
  onClose,
  onAskAI
}) => {
  const { firebaseUser, updateLibraryDoc } = useApp();
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loadingBlob, setLoadingBlob] = useState(false);
  const [missingLocalBlob, setMissingLocalBlob] = useState(false);
  const [showNotesPane, setShowNotesPane] = useState(true);
  const [notesDraft, setNotesDraft] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    if (!docItem) return;
    setNotesDraft(docItem.notes || "");
    setZoom(100);
    setMissingLocalBlob(false);

    let revokedUrl: string | null = null;
    let cancelled = false;

    const loadBlob = async () => {
      if (!docItem.localBlobId || !firebaseUser?.uid) {
        setObjectUrl(null);
        return;
      }
      setLoadingBlob(true);
      try {
        const record = await getLibraryBlob(firebaseUser.uid, docItem.localBlobId);
        if (cancelled) return;
        if (record?.blob) {
          const url = URL.createObjectURL(record.blob);
          revokedUrl = url;
          setObjectUrl(url);
          setMissingLocalBlob(false);
        } else {
          setObjectUrl(null);
          setMissingLocalBlob(true);
        }
      } catch {
        if (!cancelled) {
          setObjectUrl(null);
          setMissingLocalBlob(true);
        }
      } finally {
        if (!cancelled) setLoadingBlob(false);
      }
    };

    void loadBlob();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelled = true;
      window.removeEventListener("keydown", handleKeyDown);
      if (revokedUrl) URL.revokeObjectURL(revokedUrl);
    };
  }, [docItem?.id, docItem?.localBlobId, firebaseUser?.uid]);

  if (!docItem) return null;

  const handleSaveNotes = async () => {
    await updateLibraryDoc(docItem.id, { notes: notesDraft });
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 1800);
  };

  const handleReattachFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !firebaseUser?.uid) return;
    const blobId = docItem.localBlobId || `blob_${Date.now()}`;
    await saveLibraryBlob(firebaseUser.uid, blobId, file, file.name, file.type);
    await updateLibraryDoc(docItem.id, {
      localBlobId: blobId,
      sizeBytes: file.size,
      sizeLabel: formatFileSize(file.size),
      mimeType: file.type || docItem.mimeType
    });
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    setMissingLocalBlob(false);
  };

  const isPdf = docItem.fileType === "PDF" || docItem.mimeType === "application/pdf";
  const isImage = docItem.fileType === "Image" || docItem.mimeType.startsWith("image/");
  const isText = docItem.fileType === "Text" || Boolean(docItem.textPreview);
  const isBookmark = docItem.fileType === "Bookmark";

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Reader: ${docItem.title}`}
    >
      <div className="w-full max-w-6xl h-[92vh] bg-white dark:bg-[#0f121b] border border-slate-200 dark:border-white/[0.1] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Minimal Reader Header */}
        <div className="px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-white/[0.08] flex items-center justify-between gap-3 bg-white dark:bg-[#121520] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0">
              {isPdf ? (
                <BookOpen className="w-4 h-4 text-[#0072FF] dark:text-[#00E5FF]" />
              ) : docItem.fileType === "Slides" ? (
                <Presentation className="w-4 h-4 text-[#8A2BE2]" />
              ) : (
                <FileText className="w-4 h-4 text-[#0072FF] dark:text-[#00E5FF]" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-sm sm:text-base font-semibold text-slate-900 dark:text-white truncate">
                {docItem.title}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-[#94a3b8] tabular-nums truncate">
                {docItem.folder} · {docItem.fileType}
                {docItem.sizeBytes > 0 ? ` · ${docItem.sizeLabel}` : ""} · {docItem.uploadedAt}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {(isImage || isText) && (
              <div className="hidden sm:flex items-center gap-1 mr-1 border-r border-slate-200 dark:border-white/[0.08] pr-2">
                <button
                  type="button"
                  onClick={() => setZoom(z => Math.max(60, z - 15))}
                  title="Zoom out"
                  className="p-1.5 rounded-lg text-slate-500 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] cursor-pointer"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono text-slate-600 dark:text-[#cbd5e1] w-11 text-center tabular-nums">
                  {zoom}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom(z => Math.min(200, z + 15))}
                  title="Zoom in"
                  className="p-1.5 rounded-lg text-slate-500 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] cursor-pointer"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(100)}
                  title="Reset zoom"
                  className="p-1.5 rounded-lg text-slate-500 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {onAskAI && (
              <button
                type="button"
                onClick={() => {
                  const context = docItem.textPreview
                    ? docItem.textPreview.slice(0, 2500)
                    : docItem.notes || docItem.url || docItem.title;
                  onAskAI(`Help me study "${docItem.title}" (${docItem.folder}). Summarize key concepts and create 5 study review questions:\n\n${context}`);
                  onClose();
                }}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-xs font-medium text-slate-800 dark:text-white transition-colors cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#0072FF] dark:text-[#00E5FF]" />
                <span>Ask AI</span>
              </button>
            )}

            {objectUrl && (
              <a
                href={objectUrl}
                download={docItem.title}
                className="p-2 rounded-lg text-slate-500 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                title="Download file"
              >
                <Download className="w-4 h-4" />
              </a>
            )}

            {docItem.url && (
              <a
                href={docItem.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0072FF] text-white text-xs font-medium hover:bg-[#005ce6] transition-colors whitespace-nowrap"
              >
                <span>Open Link</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            <button
              type="button"
              onClick={() => setShowNotesPane(prev => !prev)}
              title={showNotesPane ? "Hide study notes pane" : "Show study notes pane"}
              className="p-2 rounded-lg text-slate-500 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              {showNotesPane ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close reader"
              className="p-2 rounded-lg text-slate-500 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Reader Main Body (Document Canvas + Optional Split Notes Pane) */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
          <div className="flex-1 min-w-0 min-h-0 bg-slate-100 dark:bg-[#0b0d14] flex flex-col overflow-auto gemini-scroll">
            {loadingBlob ? (
              <div className="flex-1 flex items-center justify-center text-sm text-slate-500 dark:text-[#94a3b8]">
                Loading document from local encrypted storage...
              </div>
            ) : isBookmark && docItem.url ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center">
                  <ExternalLink className="w-5 h-5 text-[#0072FF] dark:text-[#00E5FF]" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">{docItem.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-[#94a3b8] break-all">{docItem.url}</p>
                </div>
                <a
                  href={docItem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-[#0072FF] hover:bg-[#005ce6] text-white text-xs font-medium inline-flex items-center gap-2 transition-colors"
                >
                  <span>Open Resource in New Tab</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ) : isPdf && objectUrl ? (
              <iframe
                src={`${objectUrl}#toolbar=1&navpanes=0`}
                title={docItem.title}
                className="w-full h-full flex-1 border-0 bg-white"
              />
            ) : isImage && objectUrl ? (
              <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
                <img
                  src={objectUrl}
                  alt={docItem.title}
                  style={{ width: `${zoom}%`, maxWidth: "none" }}
                  className="rounded-xl shadow-lg border border-slate-200 dark:border-white/[0.08] bg-white object-contain"
                />
              </div>
            ) : isText && docItem.textPreview ? (
              <div className="flex-1 p-6 sm:p-8 overflow-y-auto gemini-scroll">
                <div
                  className="max-w-3xl mx-auto bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-xs"
                  style={{ fontSize: `${Math.round((14 * zoom) / 100)}px` }}
                >
                  <pre className="whitespace-pre-wrap font-sans text-slate-800 dark:text-slate-200 leading-relaxed">
                    {docItem.textPreview}
                  </pre>
                </div>
              </div>
            ) : objectUrl ? (
              // Non-PDF slides (e.g., .pptx, .key, .odp) stored locally
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center">
                  <Presentation className="w-6 h-6 text-[#8A2BE2]" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                    {docItem.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-[#94a3b8] leading-relaxed">
                    Slide deck ({docItem.sizeLabel}) is saved safely in your local library. Browsers render PDFs natively inline; for PowerPoint/Keynote decks, download or export slides to PDF for inline page-by-page viewing.
                  </p>
                </div>
                <a
                  href={objectUrl}
                  download={docItem.title}
                  className="px-5 py-2.5 rounded-xl bg-[#0072FF] hover:bg-[#005ce6] text-white text-xs font-medium inline-flex items-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Slide Deck</span>
                </a>
              </div>
            ) : missingLocalBlob ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center">
                  <Upload className="w-5 h-5 text-[#0072FF] dark:text-[#00E5FF]" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                    File stored on another device or session
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-[#94a3b8] leading-relaxed">
                    Your study notes and metadata synced from your account, while large PDF/slide binaries are kept privately on the device where they were uploaded. Re-select the file here to view it on this device.
                  </p>
                </div>
                <label className="px-4 py-2 rounded-xl bg-[#0072FF] hover:bg-[#005ce6] text-white text-xs font-medium inline-flex items-center gap-2 cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Attach File on This Device</span>
                  <input
                    type="file"
                    accept=".pdf,.ppt,.pptx,.key,.odp,.txt,.md,.png,.jpg,.jpeg,.webp"
                    className="hidden"
                    onChange={handleReattachFile}
                  />
                </label>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 text-sm text-slate-500 dark:text-[#94a3b8]">
                No binary preview available for this item. Use the notes panel to review your study annotations.
              </div>
            )}
          </div>

          {/* Right Split Pane: Persistent Study Notes */}
          {showNotesPane && (
            <div className="w-full lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#121520] flex flex-col shrink-0 h-56 lg:h-auto">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-white/[0.06] flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                  Reader Notes & Highlights
                </span>
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  className="px-2.5 py-1 rounded-lg bg-[#0072FF] hover:bg-[#005ce6] text-white text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {notesSaved ? <Check className="w-3 h-3" /> : null}
                  <span>{notesSaved ? "Saved" : "Save"}</span>
                </button>
              </div>
              <textarea
                value={notesDraft}
                onChange={e => setNotesDraft(e.target.value)}
                onBlur={handleSaveNotes}
                placeholder="Write definitions, page numbers, or lecture takeaways while reading..."
                className="flex-1 w-full p-4 bg-transparent text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-[#64748b] resize-none focus:outline-none leading-relaxed gemini-scroll"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
