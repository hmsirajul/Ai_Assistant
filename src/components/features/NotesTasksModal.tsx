import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { FileText, CheckSquare, Plus, Pin, Trash2, Sparkles, Calendar, Clock, AlertCircle, X, Check, Tag } from "lucide-react";
import { createTailoredContent } from "../../services/api";

export const NotesTasksModal: React.FC = () => {
  const { isNotesModalOpen, setIsNotesModalOpen, notes, addNote, updateNote, deleteNote, tasks, addTask, toggleTaskCompletion, deleteTask, addActivityLog, addNotification } = useApp();

  const [activeTab, setActiveTab] = useState<"notes" | "tasks">("notes");
  const [taskFilter, setTaskFilter] = useState<"Today" | "Upcoming" | "Completed">("Today");
  
  // Note Form State
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteTag, setNoteTag] = useState("#work");

  // Task Form State
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskTime, setTaskTime] = useState("3:00 PM");
  const [taskPriority, setTaskPriority] = useState<"High" | "Medium" | "Low">("Medium");

  if (!isNotesModalOpen) return null;

  const handleCreateNote = () => {
    if (!noteTitle.trim()) return;
    addNote({
      title: noteTitle,
      content: noteContent,
      tags: [noteTag],
      isPinned: false
    });
    setNoteTitle("");
    setNoteContent("");
    setShowNoteForm(false);
    addActivityLog({
      command: `Create AI Note: "${noteTitle}"`,
      interpretation: "Saved new markdown note to local SQLite storage",
      actionPerformed: "Created note with tag " + noteTag,
      serviceUsed: "DiptiK Local Notes",
      dataAccessed: "Notes Database",
      permissionUsed: "Files & Storage Permission",
      result: "Success",
      confirmationLevel: 1
    });
  };

  const handleAIImproveNote = async (note: any) => {
    const res = await createTailoredContent("Study Note / Summary", note.content, "Professional", "Concise");
    updateNote(note.id, { content: res.content });
    addNotification({
      title: "Note Improved",
      message: "AI improved and structured your note.",
      category: "system"
    });
  };

  const handleCreateTask = () => {
    if (!taskTitle.trim()) return;
    addTask({
      title: taskTitle,
      dueDate: "Today",
      time: taskTime,
      priority: taskPriority,
      status: "Today",
      reminderSet: true
    });
    setTaskTitle("");
    setShowTaskForm(false);
  };

  const filteredTasks = tasks.filter(t => t.status === taskFilter);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-[#121520] rounded-2xl shadow-2xl overflow-hidden border border-white/[0.1] flex flex-col max-h-[90vh] text-[#e2e8f0]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#FF1E8A]/15 via-[#8A2BE2]/15 to-[#0072FF]/20 border-b border-white/[0.08] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-[#8A2BE2]/25 border border-[#8A2BE2]/40 text-[#00E5FF]">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-base leading-tight">AI Notes & Task Manager (Section 19)</h2>
              <p className="text-[11px] text-[#94a3b8]">Offline synced notes, AI summaries & priority tasks</p>
            </div>
          </div>
          <button
            onClick={() => setIsNotesModalOpen(false)}
            className="p-1.5 rounded-lg hover:bg-white/[0.08] text-[#94a3b8] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/[0.08] bg-[#0f121d] px-6 pt-2">
          <button
            onClick={() => setActiveTab("notes")}
            className={`py-2.5 px-5 font-semibold text-xs border-b-2 transition-all flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "notes"
                ? "border-[#00E5FF] text-white bg-[#121520] rounded-t-xl"
                : "border-transparent text-[#94a3b8] hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4 text-[#00E5FF]" />
            <span>AI Notes ({notes.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("tasks")}
            className={`py-2.5 px-5 font-semibold text-xs border-b-2 transition-all flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "tasks"
                ? "border-[#FF1E8A] text-white bg-[#121520] rounded-t-xl"
                : "border-transparent text-[#94a3b8] hover:text-white"
            }`}
          >
            <CheckSquare className="w-4 h-4 text-[#FF1E8A]" />
            <span>Task Manager ({tasks.length})</span>
          </button>
        </div>

        {/* Tab 1: AI Notes (Section 19.1) */}
        {activeTab === "notes" && (
          <div className="p-6 overflow-y-auto flex-1 space-y-4 max-h-[70vh] gemini-scroll">
            <div className="flex justify-between items-center gap-2">
              <span className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider">Your Offline Synced Notes</span>
              <button
                onClick={() => setShowNoteForm(!showNoteForm)}
                className="px-3.5 py-1.5 btn-diptik-primary text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New AI Note</span>
              </button>
            </div>

            {/* New Note Form */}
            {showNoteForm && (
              <div className="p-4 bg-[#181c2b] border border-[#0072FF]/35 rounded-2xl space-y-3 animate-in fade-in duration-200">
                <input
                  type="text"
                  value={noteTitle}
                  onChange={e => setNoteTitle(e.target.value)}
                  placeholder="Note Title..."
                  className="w-full px-3 py-2 bg-[#121520] border border-white/[0.1] rounded-xl text-xs font-semibold text-white placeholder-[#64748b] focus:outline-none focus:border-[#0072FF]"
                />
                <textarea
                  value={noteContent}
                  onChange={e => setNoteContent(e.target.value)}
                  rows={3}
                  placeholder="Type or dictate note content..."
                  className="w-full px-3 py-2 bg-[#121520] border border-white/[0.1] rounded-xl text-xs font-medium text-white placeholder-[#64748b] focus:outline-none focus:border-[#0072FF]"
                />
                <div className="flex items-center justify-between">
                  <select
                    value={noteTag}
                    onChange={e => setNoteTag(e.target.value)}
                    className="px-3 py-1.5 bg-[#121520] border border-white/[0.1] rounded-xl text-xs font-medium text-white focus:outline-none"
                  >
                    <option className="bg-[#121520] text-white">#work</option>
                    <option className="bg-[#121520] text-white">#study</option>
                    <option className="bg-[#121520] text-white">#personal</option>
                    <option className="bg-[#121520] text-white">#ai</option>
                  </select>
                  <div className="flex space-x-2">
                    <button onClick={() => setShowNoteForm(false)} className="px-3 py-1.5 text-xs text-[#94a3b8] hover:text-white font-medium cursor-pointer">Cancel</button>
                    <button onClick={handleCreateNote} className="px-4 py-1.5 btn-diptik-primary text-white rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap">Save Note</button>
                  </div>
                </div>
              </div>
            )}

            {/* Notes List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {notes.map(note => (
                <div key={note.id} className="p-4 rounded-2xl border border-white/[0.08] bg-[#181c2b] flex flex-col justify-between space-y-3 hover:border-[#0072FF]/50 transition-all text-left">
                  <div>
                    <div className="flex items-start justify-between">
                      <h4 className="text-xs font-semibold text-white truncate pr-2">{note.title}</h4>
                      <button onClick={() => updateNote(note.id, { isPinned: !note.isPinned })} className="text-[#64748b] hover:text-[#00E5FF] cursor-pointer">
                        <Pin className={`w-3.5 h-3.5 ${note.isPinned ? "text-[#00E5FF] fill-[#00E5FF]" : ""}`} />
                      </button>
                    </div>
                    <p className="text-xs text-[#cbd5e1] mt-1.5 line-clamp-3 leading-relaxed">{note.content}</p>
                  </div>

                  {/* Checklist if any */}
                  {note.checklist && note.checklist.length > 0 && (
                    <div className="space-y-1 pt-2 border-t border-white/[0.08]">
                      {note.checklist.map(item => (
                        <div key={item.id} className="flex items-center space-x-1.5 text-[11px] text-[#cbd5e1]">
                          <input type="checkbox" checked={item.completed} readOnly className="rounded accent-[#00E5FF]" />
                          <span className={item.completed ? "line-through opacity-50" : ""}>{item.text}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.08] text-[10px]">
                    <div className="flex space-x-1">
                      {note.tags.map((tg, idx) => (
                        <span key={idx} className="bg-[#0072FF]/15 text-[#00E5FF] border border-[#0072FF]/30 font-semibold px-2 py-0.5 rounded-full">
                          {tg}
                        </span>
                      ))}
                    </div>
                    <div className="flex space-x-1">
                      <button onClick={() => handleAIImproveNote(note)} title="AI Summarize & Structure" className="p-1.5 hover:bg-white/[0.08] rounded-lg text-[#FF1E8A] cursor-pointer">
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteNote(note.id)} title="Delete Note" className="p-1.5 hover:bg-[#FF1744]/15 rounded-lg text-[#94a3b8] hover:text-[#FF1744] cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Task Manager (Section 19.2) */}
        {activeTab === "tasks" && (
          <div className="p-6 overflow-y-auto flex-1 space-y-4 max-h-[70vh] text-left gemini-scroll">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex space-x-1 bg-[#0f121d] border border-white/[0.08] p-1 rounded-xl">
                {(["Today", "Upcoming", "Completed"] as const).map(fl => (
                  <button
                    key={fl}
                    onClick={() => setTaskFilter(fl)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      taskFilter === fl ? "bg-[#181c2b] text-[#00E5FF] border border-[#0072FF]/40" : "text-[#94a3b8] hover:text-white"
                    }`}
                  >
                    {fl}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowTaskForm(!showTaskForm)}
                className="px-3.5 py-1.5 btn-diptik-primary text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Task</span>
              </button>
            </div>

            {/* New Task Form */}
            {showTaskForm && (
              <div className="p-4 bg-[#181c2b] border border-[#0072FF]/35 rounded-2xl space-y-3 animate-in fade-in duration-200">
                <input
                  type="text"
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  className="w-full px-3 py-2 bg-[#121520] border border-white/[0.1] rounded-xl text-xs font-semibold text-white placeholder-[#64748b] focus:outline-none focus:border-[#0072FF]"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={taskTime}
                    onChange={e => setTaskTime(e.target.value)}
                    placeholder="Time (e.g. 5:00 PM)"
                    className="px-3 py-1.5 bg-[#121520] border border-white/[0.1] rounded-xl text-xs text-white placeholder-[#64748b] focus:outline-none"
                  />
                  <select
                    value={taskPriority}
                    onChange={e => setTaskPriority(e.target.value as any)}
                    className="px-3 py-1.5 bg-[#121520] border border-white/[0.1] rounded-xl text-xs font-medium text-white focus:outline-none"
                  >
                    <option value="High" className="bg-[#121520] text-white">High Priority</option>
                    <option value="Medium" className="bg-[#121520] text-white">Medium Priority</option>
                    <option value="Low" className="bg-[#121520] text-white">Low Priority</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-2">
                  <button onClick={() => setShowTaskForm(false)} className="px-3 py-1.5 text-xs text-[#94a3b8] hover:text-white font-medium cursor-pointer">Cancel</button>
                  <button onClick={handleCreateTask} className="px-4 py-1.5 btn-diptik-primary text-white rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap">Add Task</button>
                </div>
              </div>
            )}

            {/* Task list */}
            <div className="space-y-2.5">
              {filteredTasks.length === 0 ? (
                <p className="text-center text-xs text-[#64748b] py-8">No tasks in this view</p>
              ) : (
                filteredTasks.map(task => (
                  <div key={task.id} className="p-3.5 rounded-2xl border border-white/[0.08] bg-[#181c2b] flex items-center justify-between hover:border-[#0072FF]/50 transition-all">
                    <div className="flex items-start space-x-3 pr-2">
                      <button
                        onClick={() => toggleTaskCompletion(task.id)}
                        className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center mt-0.5 transition-colors cursor-pointer ${
                          task.status === "Completed" ? "bg-[#0072FF] border-[#0072FF] text-white" : "border-white/25 hover:border-[#00E5FF]"
                        }`}
                      >
                        {task.status === "Completed" && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <div>
                        <span className={`text-xs font-semibold text-white block ${task.status === "Completed" ? "line-through opacity-50" : ""}`}>
                          {task.title}
                        </span>
                        <div className="flex items-center space-x-2 mt-1 text-[10px] text-[#94a3b8]">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-[#00E5FF]" />
                            <span>{task.time}</span>
                          </span>
                          <span className={`px-2 py-0.5 rounded-full font-semibold border ${
                            task.priority === "High"
                              ? "bg-[#FF1744]/15 text-[#FF8A9E] border-[#FF1744]/35"
                              : task.priority === "Medium"
                              ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                              : "bg-[#0072FF]/15 text-[#00E5FF] border-[#0072FF]/30"
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                        {task.aiSuggestion && (
                          <div className="mt-2 p-2.5 bg-gradient-to-r from-[#FF1E8A]/10 to-[#0072FF]/10 border border-[#8A2BE2]/30 rounded-xl text-[11px] text-[#e2e8f0] font-medium flex items-center space-x-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-[#00E5FF] shrink-0" />
                            <span>{task.aiSuggestion}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-1.5 hover:bg-[#FF1744]/15 rounded-lg text-[#94a3b8] hover:text-[#FF1744] transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
