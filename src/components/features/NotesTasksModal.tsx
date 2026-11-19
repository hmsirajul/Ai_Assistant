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
    <div className="fixed inset-0 z-50 bg-gray-900/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-white/10 text-white">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight">AI Notes & Task Manager (Section 19)</h2>
              <p className="text-[11px] text-purple-200">Offline SQLite synced notes, AI summaries & priority tasks</p>
            </div>
          </div>
          <button
            onClick={() => setIsNotesModalOpen(false)}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-100 bg-gray-50 px-6 pt-2">
          <button
            onClick={() => setActiveTab("notes")}
            className={`py-2.5 px-6 font-bold text-xs border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === "notes"
                ? "border-purple-600 text-purple-900 bg-white rounded-t-xl shadow-sm"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>AI Notes ({notes.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("tasks")}
            className={`py-2.5 px-6 font-bold text-xs border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === "tasks"
                ? "border-purple-600 text-purple-900 bg-white rounded-t-xl shadow-sm"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Task Manager ({tasks.length})</span>
          </button>
        </div>

        {/* Tab 1: AI Notes (Section 19.1) */}
        {activeTab === "notes" && (
          <div className="p-6 overflow-y-auto flex-1 space-y-4 max-h-[70vh]">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Your Offline Synced Notes</span>
              <button
                onClick={() => setShowNoteForm(!showNoteForm)}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New AI Note</span>
              </button>
            </div>

            {/* New Note Form */}
            {showNoteForm && (
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl space-y-3 animate-in fade-in duration-200">
                <input
                  type="text"
                  value={noteTitle}
                  onChange={e => setNoteTitle(e.target.value)}
                  placeholder="Note Title..."
                  className="w-full px-3 py-2 bg-white border border-purple-300 rounded-xl text-xs font-bold"
                />
                <textarea
                  value={noteContent}
                  onChange={e => setNoteContent(e.target.value)}
                  rows={3}
                  placeholder="Type or dictate note content..."
                  className="w-full px-3 py-2 bg-white border border-purple-300 rounded-xl text-xs font-medium"
                />
                <div className="flex items-center justify-between">
                  <select
                    value={noteTag}
                    onChange={e => setNoteTag(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-purple-300 rounded-xl text-xs font-medium"
                  >
                    <option>#work</option>
                    <option>#study</option>
                    <option>#personal</option>
                    <option>#ai</option>
                  </select>
                  <div className="flex space-x-2">
                    <button onClick={() => setShowNoteForm(false)} className="px-3 py-1.5 text-xs text-gray-600 font-semibold">Cancel</button>
                    <button onClick={handleCreateNote} className="px-4 py-1.5 bg-purple-600 text-white rounded-xl text-xs font-bold">Save Note</button>
                  </div>
                </div>
              </div>
            )}

            {/* Notes List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {notes.map(note => (
                <div key={note.id} className="p-4 rounded-2xl border border-gray-200 bg-white flex flex-col justify-between space-y-3 shadow-sm hover:border-purple-300 transition-all text-left">
                  <div>
                    <div className="flex items-start justify-between">
                      <h4 className="text-xs font-bold text-gray-900 truncate pr-2">{note.title}</h4>
                      <button onClick={() => updateNote(note.id, { isPinned: !note.isPinned })} className="text-gray-400 hover:text-purple-600">
                        <Pin className={`w-3.5 h-3.5 ${note.isPinned ? "text-purple-600 fill-purple-600" : ""}`} />
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-3 leading-relaxed">{note.content}</p>
                  </div>

                  {/* Checklist if any */}
                  {note.checklist && note.checklist.length > 0 && (
                    <div className="space-y-1 pt-2 border-t border-gray-100">
                      {note.checklist.map(item => (
                        <div key={item.id} className="flex items-center space-x-1.5 text-[11px] text-gray-600">
                          <input type="checkbox" checked={item.completed} readOnly className="rounded text-purple-600" />
                          <span className={item.completed ? "line-through opacity-60" : ""}>{item.text}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[10px]">
                    <div className="flex space-x-1">
                      {note.tags.map((tg, idx) => (
                        <span key={idx} className="bg-purple-50 text-purple-700 font-semibold px-2 py-0.5 rounded-full">
                          {tg}
                        </span>
                      ))}
                    </div>
                    <div className="flex space-x-1">
                      <button onClick={() => handleAIImproveNote(note)} title="AI Summarize & Structure" className="p-1 hover:bg-purple-50 rounded text-purple-600">
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteNote(note.id)} title="Delete Note" className="p-1 hover:bg-red-50 rounded text-red-500">
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
          <div className="p-6 overflow-y-auto flex-1 space-y-4 max-h-[70vh] text-left">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex space-x-1.5 bg-gray-100 p-1 rounded-xl">
                {(["Today", "Upcoming", "Completed"] as const).map(fl => (
                  <button
                    key={fl}
                    onClick={() => setTaskFilter(fl)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      taskFilter === fl ? "bg-white text-purple-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {fl}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowTaskForm(!showTaskForm)}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Task</span>
              </button>
            </div>

            {/* New Task Form */}
            {showTaskForm && (
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl space-y-3 animate-in fade-in duration-200">
                <input
                  type="text"
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  className="w-full px-3 py-2 bg-white border border-purple-300 rounded-xl text-xs font-bold"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={taskTime}
                    onChange={e => setTaskTime(e.target.value)}
                    placeholder="Time (e.g. 5:00 PM)"
                    className="px-3 py-1.5 bg-white border border-purple-300 rounded-xl text-xs"
                  />
                  <select
                    value={taskPriority}
                    onChange={e => setTaskPriority(e.target.value as any)}
                    className="px-3 py-1.5 bg-white border border-purple-300 rounded-xl text-xs font-medium"
                  >
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-2">
                  <button onClick={() => setShowTaskForm(false)} className="px-3 py-1.5 text-xs text-gray-600 font-semibold">Cancel</button>
                  <button onClick={handleCreateTask} className="px-4 py-1.5 bg-purple-600 text-white rounded-xl text-xs font-bold">Add Task</button>
                </div>
              </div>
            )}

            {/* Task list */}
            <div className="space-y-2.5">
              {filteredTasks.length === 0 ? (
                <p className="text-center text-xs text-gray-400 py-8">No tasks in this view</p>
              ) : (
                filteredTasks.map(task => (
                  <div key={task.id} className="p-3.5 rounded-2xl border border-gray-200 bg-white flex items-center justify-between hover:border-purple-300 transition-all">
                    <div className="flex items-start space-x-3 pr-2">
                      <button
                        onClick={() => toggleTaskCompletion(task.id)}
                        className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center mt-0.5 transition-colors ${
                          task.status === "Completed" ? "bg-purple-600 border-purple-600 text-white" : "border-gray-300 hover:border-purple-600"
                        }`}
                      >
                        {task.status === "Completed" && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <div>
                        <span className={`text-xs font-bold text-gray-900 block ${task.status === "Completed" ? "line-through opacity-50" : ""}`}>
                          {task.title}
                        </span>
                        <div className="flex items-center space-x-2 mt-1 text-[10px] text-gray-500">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-purple-600" />
                            <span>{task.time}</span>
                          </span>
                          <span className={`px-1.5 py-0.2 rounded font-bold ${
                            task.priority === "High" ? "bg-red-50 text-red-700" : task.priority === "Medium" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                        {task.aiSuggestion && (
                          <div className="mt-2 p-2 bg-purple-50/70 border border-purple-200/50 rounded-xl text-[11px] text-purple-900 font-medium flex items-center space-x-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            <span>{task.aiSuggestion}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
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
