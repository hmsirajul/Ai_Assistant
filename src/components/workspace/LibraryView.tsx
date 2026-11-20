import React, { useState, useRef } from "react";
import { useApp } from "../../context/AppContext";
import { LibraryDocumentItem, LibraryFolder } from "../../types";
import {
  saveLibraryBlob,
  formatFileSize,
  readTextPreviewIfSupported
} from "../../lib/libraryStorage";
import { PdfSlideReaderModal } from "./PdfSlideReaderModal";
import {
  BookOpen,
  Presentation,
  FileText,
  Bookmark,
  FolderOpen,
  Upload,
  Search,
  Trash2,
  ExternalLink,
  Plus,
  Eye,
  Sparkles,
  Pin
} from "lucide-react";

interface LibraryViewProps {
  onAskAI: (prompt: string) => void;
}

const FOLDERS: ("All" | LibraryFolder)[] = [
  "All",
  "Dictionary",
  "Books & Slides",
  "Notes",
  "Papers",
  "Bookmarks"
];

function detectFileType(file: File): LibraryDocumentItem["fileType"] {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (file.type === "application/pdf" || ext === "pdf") return "PDF";
  if (["ppt", "pptx", "key", "odp"].includes(ext)) return "Slides";
  if (file.type.startsWith("image/") || ["png", "jpg", "jpeg", "webp"].includes(ext)) return "Image";
  return "Text";
}

export const LibraryView: React.FC<LibraryViewProps> = ({ onAskAI }) => {
  const {
    firebaseUser,
    libraryDocs,
    addLibraryDoc,
    deleteLibraryDoc,
    notes,
    setIsResearchModalOpen,
    setIsNotesModalOpen,
    addNotification
  } = useApp();

  const [activeFolder, setActiveFolder] = useState<"All" | LibraryFolder>("All");
  const [uploadFolder, setUploadFolder] = useState<LibraryFolder>("Dictionary");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeReaderDoc, setActiveReaderDoc] = useState<LibraryDocumentItem | null>(null);

  // Bookmark form state
  const [showBookmarkForm, setShowBookmarkForm] = useState(false);
  const [bookmarkTitle, setBookmarkTitle] = useState("");
  const [bookmarkUrl, setBookmarkUrl] = useState("");
  const [bookmarkNotes, setBookmarkNotes] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadFiles = async (files: FileList | null, targetFolder?: LibraryFolder) => {
    if (!files || files.length === 0 || !firebaseUser?.uid) return;
    setIsUploading(true);
    const chosenFolder = targetFolder || (activeFolder === "All" || activeFolder === "Bookmarks" ? uploadFolder : activeFolder);

    try {
      for (const file of Array.from(files)) {
        const id = `lib_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const blobId = `blob_${id}`;
        await saveLibraryBlob(firebaseUser.uid, blobId, file, file.name, file.type);
        const textPreview = await readTextPreviewIfSupported(file);
        const fileType = detectFileType(file);
        const docItem: LibraryDocumentItem = {
          id,
          title: file.name,
          folder: chosenFolder,
          fileType,
          mimeType: file.type || "application/pdf",
          sizeBytes: file.size,
          sizeLabel: formatFileSize(file.size),
          notes: "",
          localBlobId: blobId,
          textPreview,
          uploadedAt: new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" }),
          updatedAt: "Just now"
        };
        await addLibraryDoc(docItem);
      }
      addNotification({
        title: "Added to Library",
        message: `${files.length} file${files.length > 1 ? "s" : ""} saved to ${chosenFolder}.`,
        category: "system"
      });
    } catch (err) {
      console.error("Library upload error:", err);
      addNotification({
        title: "Upload issue",
        message: "Could not store the selected file locally. Try a smaller file or another format.",
        category: "security"
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddBookmark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookmarkTitle.trim() || !bookmarkUrl.trim()) return;
    const normalizedUrl = bookmarkUrl.trim().startsWith("http")
      ? bookmarkUrl.trim()
      : `https://${bookmarkUrl.trim()}`;

    await addLibraryDoc({
      id: `lib_bm_${Date.now()}`,
      title: bookmarkTitle.trim(),
      folder: "Bookmarks",
      fileType: "Bookmark",
      mimeType: "text/uri-list",
      sizeBytes: 0,
      sizeLabel: "Web link",
      url: normalizedUrl,
      notes: bookmarkNotes.trim(),
      uploadedAt: new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      updatedAt: "Just now"
    });

    setBookmarkTitle("");
    setBookmarkUrl("");
    setBookmarkNotes("");
    setShowBookmarkForm(false);
    setActiveFolder("Bookmarks");
  };

  const folderCounts = FOLDERS.reduce(
    (acc, folder) => {
      acc[folder] =
        folder === "All"
          ? libraryDocs.length
          : libraryDocs.filter(d => d.folder === folder).length;
      return acc;
    },
    {} as Record<"All" | LibraryFolder, number>
  );

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const visibleDocs = libraryDocs.filter(doc => {
    const matchesFolder = activeFolder === "All" || doc.folder === activeFolder;
    const matchesQuery =
      !normalizedSearch ||
      doc.title.toLowerCase().includes(normalizedSearch) ||
      doc.notes.toLowerCase().includes(normalizedSearch) ||
      doc.folder.toLowerCase().includes(normalizedSearch);
    return matchesFolder && matchesQuery;
  });

  const getItemIcon = (item: LibraryDocumentItem) => {
    if (item.folder === "Dictionary") return <BookOpen className="w-4 h-4 text-[#0072FF] dark:text-[#00E5FF]" />;
    if (item.fileType === "Slides") return <Presentation className="w-4 h-4 text-[#8A2BE2]" />;
    if (item.fileType === "Bookmark") return <Bookmark className="w-4 h-4 text-[#FF1E8A]" />;
    if (item.fileType === "PDF") return <FileText className="w-4 h-4 text-[#0072FF] dark:text-[#00E5FF]" />;
    return <FolderOpen className="w-4 h-4 text-slate-600 dark:text-slate-300" />;
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto gemini-scroll px-4 sm:px-8 pb-12">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-white/[0.08] pb-4 text-left">
          <div>
            <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
              Library
            </h1>
            <p className="text-sm text-slate-500 dark:text-[#94a3b8] mt-1">
              Organize dictionary PDFs, academic books, lecture slides, papers, and bookmarks — click any file to read inline.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsResearchModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-white dark:bg-[#181c2b] hover:bg-slate-100 dark:hover:bg-[#1f2437] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#0072FF] dark:text-[#00E5FF]" />
              <span>Deep Research</span>
            </button>
            <button
              type="button"
              onClick={() => setShowBookmarkForm(prev => !prev)}
              className="px-3 py-2 rounded-xl bg-white dark:bg-[#181c2b] hover:bg-slate-100 dark:hover:bg-[#1f2437] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Bookmark className="w-3.5 h-3.5 text-[#FF1E8A]" />
              <span>Add Bookmark</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (activeFolder !== "All" && activeFolder !== "Bookmarks") {
                  setUploadFolder(activeFolder);
                }
                fileInputRef.current?.click();
              }}
              className="px-3.5 py-2 rounded-xl bg-[#0072FF] hover:bg-[#005ce6] text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isUploading ? "Uploading..." : "Upload PDF / Slides"}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.ppt,.pptx,.key,.odp,.txt,.md,.csv,.json,.png,.jpg,.jpeg,.webp"
              className="hidden"
              onChange={e => void handleUploadFiles(e.target.files)}
            />
          </div>
        </div>

        {/* Folder Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {FOLDERS.map(folder => {
            const active = activeFolder === folder;
            return (
              <button
                key={folder}
                type="button"
                onClick={() => setActiveFolder(folder)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-2 ${
                  active
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                    : "bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/[0.05]"
                }`}
              >
                <span>{folder}</span>
                <span className={`tabular-nums text-[11px] ${active ? "opacity-80" : "text-slate-400 dark:text-[#64748b]"}`}>
                  {folderCounts[folder]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Add Bookmark Panel */}
        {showBookmarkForm && (
          <form
            onSubmit={handleAddBookmark}
            className="p-4 rounded-2xl bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.08] grid grid-cols-1 sm:grid-cols-4 gap-3 text-left"
          >
            <input
              type="text"
              value={bookmarkTitle}
              onChange={e => setBookmarkTitle(e.target.value)}
              required
              placeholder="Resource title (e.g. Cambridge Dictionary)"
              className="bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#0072FF]"
            />
            <input
              type="text"
              value={bookmarkUrl}
              onChange={e => setBookmarkUrl(e.target.value)}
              required
              placeholder="URL (https://...)"
              className="bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#0072FF]"
            />
            <input
              type="text"
              value={bookmarkNotes}
              onChange={e => setBookmarkNotes(e.target.value)}
              placeholder="Short note (optional)"
              className="bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#0072FF]"
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-[#0072FF] hover:bg-[#005ce6] text-white text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save Link</span>
              </button>
              <button
                type="button"
                onClick={() => setShowBookmarkForm(false)}
                className="px-3 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Search + Quick Upload Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-stretch">
          <div className="lg:col-span-1 relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 dark:text-[#64748b] absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search titles, folders, or notes..."
              className="w-full bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.08] focus:border-[#0072FF] rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748b] focus:outline-none"
            />
          </div>

          <div
            onDragOver={e => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => {
              e.preventDefault();
              setIsDragging(false);
              void handleUploadFiles(e.dataTransfer.files);
            }}
            className={`lg:col-span-2 rounded-xl border border-dashed px-4 py-2 flex flex-wrap items-center justify-between gap-3 transition-colors ${
              isDragging
                ? "border-[#0072FF] bg-blue-50/70 dark:bg-[#0072FF]/10"
                : "border-slate-300 dark:border-white/[0.14] bg-white dark:bg-[#121520]"
            }`}
          >
            <div className="flex items-center gap-2.5 text-left min-w-0">
              <Upload className="w-4 h-4 text-[#0072FF] dark:text-[#00E5FF] shrink-0" />
              <span className="text-xs text-slate-600 dark:text-[#cbd5e1] truncate">
                Drop PDFs, lecture slides, or notes here to save to
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <select
                aria-label="Target library folder"
                value={activeFolder !== "All" && activeFolder !== "Bookmarks" ? activeFolder : uploadFolder}
                onChange={e => {
                  const f = e.target.value as LibraryFolder;
                  setUploadFolder(f);
                  if (activeFolder !== "All") setActiveFolder(f);
                }}
                className="bg-slate-100 dark:bg-[#181c2b] border border-slate-200 dark:border-white/[0.08] rounded-lg px-2.5 py-1 text-xs font-medium text-slate-800 dark:text-white focus:outline-none"
              >
                <option value="Dictionary">Dictionary</option>
                <option value="Books & Slides">Books & Slides</option>
                <option value="Notes">Notes</option>
                <option value="Papers">Papers</option>
              </select>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-medium cursor-pointer hover:opacity-90"
              >
                Browse
              </button>
            </div>
          </div>
        </div>

        {/* Documents Grid */}
        {visibleDocs.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.08] text-center space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center mx-auto text-[#0072FF] dark:text-[#00E5FF]">
              {activeFolder === "Dictionary" ? (
                <BookOpen className="w-5 h-5" />
              ) : activeFolder === "Bookmarks" ? (
                <Bookmark className="w-5 h-5 text-[#FF1E8A]" />
              ) : (
                <Presentation className="w-5 h-5" />
              )}
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                {searchQuery
                  ? "No matching study files"
                  : activeFolder === "Dictionary"
                    ? "Your Dictionary shelf is ready"
                    : activeFolder === "Books & Slides"
                      ? "Store your academic books & lecture slides"
                      : activeFolder === "Bookmarks"
                        ? "Save key study bookmarks here"
                        : "Upload PDFs, papers, or study notes"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#94a3b8] leading-relaxed">
                {activeFolder === "Bookmarks"
                  ? "Keep quick links to online dictionaries, course portals, and references."
                  : "Uploaded PDFs and documents are saved privately to your account storage and open inside the built-in distraction-free reader."}
              </p>
            </div>
            <div className="pt-1">
              {activeFolder === "Bookmarks" ? (
                <button
                  type="button"
                  onClick={() => setShowBookmarkForm(true)}
                  className="px-4 py-2 rounded-xl bg-[#0072FF] hover:bg-[#005ce6] text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Bookmark</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-[#0072FF] hover:bg-[#005ce6] text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Select PDF or Slides</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {visibleDocs.map(docItem => (
              <div
                key={docItem.id}
                onClick={() => setActiveReaderDoc(docItem)}
                className="group p-4 rounded-2xl bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.08] hover:border-[#0072FF]/50 transition-colors cursor-pointer flex flex-col justify-between gap-3 text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center shrink-0 mt-0.5">
                      {getItemIcon(docItem)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-[#0072FF] dark:group-hover:text-[#00E5FF] transition-colors">
                        {docItem.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-[#94a3b8] mt-0.5 tabular-nums">
                        {docItem.folder} · {docItem.fileType}
                        {docItem.sizeBytes > 0 ? ` · ${docItem.sizeLabel}` : ""} · {docItem.uploadedAt}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      void deleteLibraryDoc(docItem.id);
                    }}
                    aria-label="Remove item"
                    className="p-1.5 rounded-lg text-slate-400 dark:text-[#64748b] hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {docItem.notes && (
                  <p className="text-xs text-slate-600 dark:text-[#cbd5e1] line-clamp-2 leading-relaxed">
                    {docItem.notes}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                  <span className="text-[11px] font-medium text-[#0072FF] dark:text-[#00E5FF] flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{docItem.fileType === "Bookmark" ? "Open & Notes" : "Open in Reader"}</span>
                  </span>
                  {docItem.url && (
                    <a
                      href={docItem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="text-[11px] text-slate-500 dark:text-[#94a3b8] hover:text-slate-900 dark:hover:text-white inline-flex items-center gap-1"
                    >
                      <span>Visit site</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Notes Integration */}
        {(activeFolder === "All" || activeFolder === "Notes") && notes.length > 0 && (
          <div className="pt-2 space-y-3 text-left">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-medium text-slate-600 dark:text-[#94a3b8]">
                Synced Quick Notes ({notes.length})
              </h2>
              <button
                type="button"
                onClick={() => setIsNotesModalOpen(true)}
                className="text-xs font-medium text-[#0072FF] dark:text-[#00E5FF] hover:underline cursor-pointer"
              >
                Open Notes & Tasks
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {notes.slice(0, 4).map(note => (
                <div
                  key={note.id}
                  onClick={() => setIsNotesModalOpen(true)}
                  className="p-4 rounded-xl bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.16] transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900 dark:text-white truncate">{note.title}</span>
                    {note.isPinned && <Pin className="w-3.5 h-3.5 text-[#0072FF] dark:text-[#00E5FF]" />}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-[#94a3b8] mt-1 line-clamp-2">{note.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Distraction-Free In-App Reader */}
      <PdfSlideReaderModal
        docItem={activeReaderDoc}
        onClose={() => setActiveReaderDoc(null)}
        onAskAI={onAskAI}
      />
    </div>
  );
};
