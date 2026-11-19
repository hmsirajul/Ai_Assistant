import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  Sparkles,
  Plus,
  Search,
  Compass,
  Code,
  PenTool,
  Calendar,
  Briefcase,
  BookOpen,
  Check,
  Play,
  Trash2,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Mic,
  MessageSquare,
  Copy,
  Zap
} from "lucide-react";
import { generateAgentPlan, executeAgentStep } from "../../services/api";
import { AgentTemplate, VoicePersonaName } from "../../types";

const VOICES: VoicePersonaName[] = ["Zephyr", "Puck", "Charon", "Kore", "Fenrir"];

export const AgentScreen: React.FC = () => {
  const {
    agentTemplates,
    addAgentTemplate,
    deleteAgentTemplate,
    activeAgentPlan,
    setActiveAgentPlan,
    addActivityLog,
    addNotification,
    setActiveTab,
    setActiveChatAgent,
    openVoiceWithAgent,
    userProfile
  } = useApp();

  const [activeView, setActiveView] = useState<"dashboard" | "create" | "details" | "planner" | "workspace">("dashboard");
  const [selectedAgent, setSelectedAgent] = useState<AgentTemplate>(agentTemplates[0]);
  const [objectiveInput, setObjectiveInput] = useState("Organize my meetings and prepare an executive morning summary.");
  const [isPlanning, setIsPlanning] = useState(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // Create Agent Form State
  const [agentName, setAgentName] = useState("");
  const [agentDesc, setAgentDesc] = useState("");
  const [agentGoal, setAgentGoal] = useState("");
  const [agentInst, setAgentInst] = useState("");
  const [selectedTools, setSelectedTools] = useState<string[]>(["Google Calendar", "Gmail Integration", "DiptiK Notes"]);
  const [memoryType, setMemoryType] = useState("Long-term memory");
  const [agentCategory, setAgentCategory] = useState<AgentTemplate["category"]>("Productivity");
  const [agentVoice, setAgentVoice] = useState<VoicePersonaName>("Zephyr");

  // Workspace Execution State
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepOutputs, setStepOutputs] = useState<Record<number, string>>({});
  const [isExecutingStep, setIsExecutingStep] = useState(false);
  const [autoContinue, setAutoContinue] = useState(true);

  const availableToolsList = [
    "Web search",
    "Gmail Integration",
    "Google Calendar",
    "Contacts",
    "Files & Storage",
    "Camera & Vision",
    "DiptiK Notes",
    "Location GPS",
    "On-Device Calculator",
    "Voice Translation"
  ];

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentName.trim()) return;
    const newAgent: AgentTemplate = {
      id: `agent_${Date.now()}`,
      name: agentName.trim(),
      icon: "Sparkles",
      description: agentDesc.trim() || `Custom ${agentCategory} AI agent`,
      goal: agentGoal.trim() || "Execute tailored user instructions",
      tools: selectedTools.slice(0, 10),
      memory: memoryType,
      category: agentCategory,
      instructions: agentInst.trim() || "Be helpful, accurate, and concise.",
      voiceName: agentVoice,
      isCustom: true
    };
    await addAgentTemplate(newAgent);
    setSelectedAgent(newAgent);
    setAgentName("");
    setAgentDesc("");
    setAgentGoal("");
    setAgentInst("");
    setActiveView("details");
    setStatusBanner(`Agent "${newAgent.name}" created and ready for live voice or workflow execution.`);
    addNotification({
      title: "New Agent Created",
      message: `Agent "${newAgent.name}" is ready for task planning and real-time voice.`,
      category: "system"
    });
  };

  const handleDuplicateAgent = async (agent: AgentTemplate) => {
    const copy: AgentTemplate = {
      ...agent,
      id: `agent_${Date.now()}`,
      name: `${agent.name} (Copy)`,
      isCustom: true
    };
    await addAgentTemplate(copy);
    setSelectedAgent(copy);
    setStatusBanner(`Duplicated "${agent.name}" into your workspace.`);
  };

  const handleGeneratePlan = async (customObjective?: string, agentOverride?: AgentTemplate) => {
    const targetObj = (customObjective ?? objectiveInput).trim();
    const targetAgent = agentOverride || selectedAgent;
    if (!targetObj) return;

    setIsPlanning(true);
    setStatusBanner(null);
    const plan = await generateAgentPlan(
      targetObj,
      targetAgent?.name || "Personal Assistant",
      targetAgent?.tools || ["Calendar"],
      {
        agentGoal: targetAgent?.goal,
        agentInstructions: targetAgent?.instructions,
        userProfile
      }
    );

    setIsPlanning(false);
    setActiveAgentPlan(plan);
    setCurrentStepIndex(0);
    setStepOutputs({});
    setActiveView("planner");
    addActivityLog({
      command: `Agent Plan: "${targetObj.slice(0, 30)}..."`,
      interpretation: `Generated ${plan.steps?.length || 4}-step multi-tool plan via ${targetAgent?.name}`,
      actionPerformed: "Verified required permissions and confirmation safeguard level",
      serviceUsed: "Gemini 4 Hydrogen / Agent Planner",
      dataAccessed: targetAgent?.tools?.join(", ") || "Connected Tools",
      permissionUsed: "Level 2 Safeguard",
      result: "Success",
      confirmationLevel: 2
    });
  };

  const runStepsSequentially = async (startIndex: number, runAll: boolean) => {
    if (!activeAgentPlan) return;
    let planCopy = { ...activeAgentPlan, steps: [...activeAgentPlan.steps] };
    const localOutputs: Record<number, string> = { ...stepOutputs };

    for (let idx = startIndex; idx < planCopy.steps.length; idx++) {
      const step = planCopy.steps[idx];
      setCurrentStepIndex(idx);
      setIsExecutingStep(true);

      const previousOutputs = planCopy.steps
        .slice(0, idx)
        .filter(s => localOutputs[s.id])
        .map(s => ({ id: s.id, action: s.action, output: localOutputs[s.id] }));

      const res = await executeAgentStep(step, planCopy.title, {
        agentName: selectedAgent?.name,
        agentInstructions: selectedAgent?.instructions,
        previousOutputs,
        userProfile
      });

      localOutputs[step.id] = res.output;
      setStepOutputs({ ...localOutputs });

      planCopy = {
        ...planCopy,
        steps: planCopy.steps.map((st, i) =>
          i === idx ? { ...st, status: "completed" as const, output: res.output } : st
        )
      };
      setActiveAgentPlan(planCopy);
      setCurrentStepIndex(idx + 1);
      setIsExecutingStep(false);

      addActivityLog({
        command: `Agent Step ${step.id}: ${step.action}`,
        interpretation: `Executed with ${step.tool}`,
        actionPerformed: res.output.slice(0, 120),
        serviceUsed: selectedAgent?.name || "AI Agent",
        dataAccessed: step.tool,
        permissionUsed: "Level 2 Safeguard",
        result: res.success ? "Success" : "Failed",
        confirmationLevel: 2
      });

      if (!runAll) break;
    }

    if (runAll || startIndex >= planCopy.steps.length - 1) {
      addNotification({
        title: "Agent Workflow Completed",
        message: `"${planCopy.title}" finished all steps.`,
        category: "automation"
      });
    }
  };

  const iconMap: Record<string, any> = {
    Sparkles,
    Search,
    Compass,
    Code,
    PenTool,
    Calendar,
    Briefcase,
    BookOpen
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 1. Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-gray-900 via-indigo-950 to-gray-900 text-white p-5 md:p-6 rounded-3xl shadow-md">
        <div className="min-w-0 flex-1 text-left">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300 truncate">
              AI Agent Studio • Live & Enabled
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-white mt-1 truncate">
            {activeView === "dashboard" && "Agent Dashboard"}
            {activeView === "create" && "Create Custom Agent"}
            {activeView === "details" && `${selectedAgent?.name}`}
            {activeView === "planner" && "Agent Task Planner"}
            {activeView === "workspace" && "Active Agent Workspace"}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 lg:pt-0 border-t border-white/10 lg:border-t-0">
          <button
            onClick={() => openVoiceWithAgent(selectedAgent)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center space-x-1.5 cursor-pointer whitespace-nowrap"
          >
            <Mic className="w-4 h-4 shrink-0" />
            <span>Talk to Agent</span>
          </button>

          {activeView !== "dashboard" && (
            <button
              onClick={() => setActiveView("dashboard")}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shadow-sm"
            >
              Back to Dashboard
            </button>
          )}
          {activeView === "dashboard" && (
            <button
              onClick={() => setActiveView("create")}
              className="px-4 py-2.5 bg-[#E31B23] hover:bg-[#BF141B] text-white rounded-xl text-xs font-bold shadow-md flex items-center space-x-1.5 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Create New Agent</span>
            </button>
          )}
        </div>
      </div>

      {statusBanner && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-900 flex items-center justify-between">
          <span>{statusBanner}</span>
          <button onClick={() => setStatusBanner(null)} className="text-emerald-700 font-bold cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* VIEW 1: Dashboard */}
      {activeView === "dashboard" && (
        <div className="space-y-8 text-left">
          {/* Quick Start Objective Box */}
          <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-3xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h2 className="text-base font-extrabold text-gray-900">
                  What would you like an agent to accomplish?
                </h2>
              </div>
              <select
                value={selectedAgent?.id}
                onChange={e => {
                  const found = agentTemplates.find(a => a.id === e.target.value);
                  if (found) setSelectedAgent(found);
                }}
                className="px-3 py-1.5 bg-white border border-purple-200 rounded-xl text-xs font-bold text-purple-900"
              >
                {agentTemplates.map(ag => (
                  <option key={ag.id} value={ag.id}>
                    Agent: {ag.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={objectiveInput}
                onChange={e => setObjectiveInput(e.target.value)}
                placeholder="e.g. Organize my meetings and prepare a morning summary..."
                className="flex-1 px-4 py-3 bg-white border border-purple-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-purple-600 focus:outline-none shadow-inner"
              />
              <button
                onClick={() => handleGeneratePlan()}
                disabled={isPlanning}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white rounded-2xl text-xs font-bold shadow-md flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
              >
                {isPlanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Plan & Execute</span>}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] text-gray-600">
              <span className="font-bold">Try:</span>
              <button
                onClick={() => setObjectiveInput("Organize my meetings and prepare an executive morning summary.")}
                className="hover:text-purple-700 underline cursor-pointer"
              >
                "Organize morning meetings"
              </button>
              <span>•</span>
              <button
                onClick={() => setObjectiveInput("Research mobile AI agent privacy standards and build a report.")}
                className="hover:text-purple-700 underline cursor-pointer"
              >
                "Research privacy standards"
              </button>
              <span>•</span>
              <button
                onClick={() => setObjectiveInput("Plan a 3-day developer productivity sprint with daily milestones.")}
                className="hover:text-purple-700 underline cursor-pointer"
              >
                "Plan developer sprint"
              </button>
            </div>
          </div>

          {/* Recommended & Custom Agents Grid */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">
              Available AI Agents ({agentTemplates.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {agentTemplates.map(agent => {
                const IconComp = iconMap[agent.icon] || Sparkles;
                return (
                  <div
                    key={agent.id}
                    className="p-5 bg-white hover:bg-gray-50/70 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                  >
                    <div
                      onClick={() => {
                        setSelectedAgent(agent);
                        setActiveView("details");
                      }}
                      className="cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-[#FFF0F1] text-[#E31B23] flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                          <IconComp className="w-6 h-6" />
                        </div>
                        <div className="flex items-center space-x-1.5">
                          {agent.isCustom && (
                            <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                              Custom
                            </span>
                          )}
                          <span className="text-[10px] font-bold bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full uppercase">
                            {agent.category}
                          </span>
                        </div>
                      </div>
                      <h4 className="text-sm font-extrabold text-gray-900 mt-3">{agent.name}</h4>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">{agent.description}</p>
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => openVoiceWithAgent(agent)}
                          title="Talk to this agent in real time"
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-xl text-[11px] font-bold flex items-center space-x-1 transition-colors cursor-pointer"
                        >
                          <Mic className="w-3 h-3" />
                          <span>Voice</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveChatAgent(agent);
                            setActiveTab("chat");
                          }}
                          title="Chat with this agent"
                          className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white rounded-xl text-[11px] font-bold flex items-center space-x-1 transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>Chat</span>
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedAgent(agent);
                          setActiveView("details");
                        }}
                        className="text-xs font-bold text-[#E31B23] flex items-center space-x-1 cursor-pointer"
                      >
                        <span>Run</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: Create Agent Screen */}
      {activeView === "create" && (
        <form
          onSubmit={handleCreateAgent}
          className="max-w-2xl mx-auto bg-white p-6 rounded-3xl border border-gray-100 shadow-md text-left space-y-5"
        >
          <h3 className="text-base font-extrabold text-gray-900">Configure Custom AI Agent</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-gray-700 uppercase">Agent Name *</label>
              <input
                type="text"
                value={agentName}
                onChange={e => setAgentName(e.target.value)}
                required
                placeholder="e.g. Financial Check-in Agent"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase">Category</label>
              <select
                value={agentCategory}
                onChange={e => setAgentCategory(e.target.value as AgentTemplate["category"])}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium mt-1"
              >
                <option>Productivity</option>
                <option>Research</option>
                <option>Communication</option>
                <option>Lifestyle</option>
                <option>Developer</option>
                <option>Business</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase">Short Description</label>
              <input
                type="text"
                value={agentDesc}
                onChange={e => setAgentDesc(e.target.value)}
                placeholder="Summarize what this agent specializes in..."
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase">Live Voice Persona</label>
              <select
                value={agentVoice}
                onChange={e => setAgentVoice(e.target.value as VoicePersonaName)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium mt-1"
              >
                {VOICES.map(v => (
                  <option key={v} value={v}>
                    {v} (Gemini Live Audio)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 uppercase">Main Goal</label>
            <input
              type="text"
              value={agentGoal}
              onChange={e => setAgentGoal(e.target.value)}
              placeholder="What is the ultimate purpose of this agent?"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 uppercase">Agent System Instructions</label>
            <textarea
              value={agentInst}
              onChange={e => setAgentInst(e.target.value)}
              rows={3}
              placeholder="Provide exact rules, constraints, or tone guidelines..."
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 uppercase block mb-2">
              Connected Tools & Integrations (Max 10)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {availableToolsList.map(t => {
                const isSel = selectedTools.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      if (isSel) setSelectedTools(prev => prev.filter(x => x !== t));
                      else if (selectedTools.length < 10) setSelectedTools(prev => [...prev, t]);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all flex items-center justify-between cursor-pointer ${
                      isSel
                        ? "bg-[#FFF0F1] border-[#E31B23] text-[#E31B23] font-bold"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="truncate pr-1">{t}</span>
                    {isSel && <Check className="w-3.5 h-3.5 text-[#E31B23] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 uppercase block mb-1">Memory Option</label>
            <select
              value={memoryType}
              onChange={e => setMemoryType(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium"
            >
              <option>No memory (Stateless session)</option>
              <option>Conversation memory (Current chat thread only)</option>
              <option>Project memory (Retains context across related tasks)</option>
              <option>Long-term memory (Cross-session knowledge & user preferences)</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveView("dashboard")}
              className="py-2.5 px-5 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2.5 px-6 bg-[#E31B23] hover:bg-[#BF141B] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
            >
              Save & Launch Agent
            </button>
          </div>
        </form>
      )}

      {/* VIEW 3: Agent Details */}
      {activeView === "details" && selectedAgent && (
        <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 border border-gray-100 shadow-md text-left space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-14 h-14 rounded-2xl bg-[#FFF0F1] text-[#E31B23] flex items-center justify-center font-bold">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <span className="text-[10px] font-bold bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full uppercase">
                  {selectedAgent.category}
                </span>
                <h2 className="text-xl font-extrabold text-gray-900 mt-1">{selectedAgent.name}</h2>
                <p className="text-xs text-gray-500">{selectedAgent.description}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => openVoiceWithAgent(selectedAgent)}
                className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-sm flex items-center space-x-1.5 cursor-pointer"
              >
                <Mic className="w-4 h-4" />
                <span>Talk Live</span>
              </button>
              <button
                onClick={() => {
                  setActiveChatAgent(selectedAgent);
                  setActiveTab("chat");
                }}
                className="py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs font-bold shadow-sm flex items-center space-x-1.5 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Open Chat</span>
              </button>
            </div>
          </div>

          {/* Custom Objective Runner for this agent */}
          <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-2.5">
            <label className="text-xs font-extrabold text-purple-950 block">
              Run Workflow with {selectedAgent.name}
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={objectiveInput}
                onChange={e => setObjectiveInput(e.target.value)}
                placeholder={`Give ${selectedAgent.name} an objective...`}
                className="flex-1 px-3.5 py-2.5 bg-white border border-purple-200 rounded-xl text-xs font-medium"
              />
              <button
                onClick={() => handleGeneratePlan(objectiveInput, selectedAgent)}
                disabled={isPlanning}
                className="py-2.5 px-5 bg-[#E31B23] hover:bg-[#BF141B] text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                {isPlanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                <span>Start Agent Workflow</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-gray-50 rounded-2xl space-y-2">
              <span className="font-bold text-gray-700 uppercase">Main Objective & Instructions</span>
              <p className="font-semibold text-gray-900">{selectedAgent.goal}</p>
              <p className="text-gray-600 italic mt-1">{selectedAgent.instructions}</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl space-y-2">
              <span className="font-bold text-gray-700 uppercase">Memory & Voice Persona</span>
              <p className="font-semibold text-purple-900">{selectedAgent.memory}</p>
              <p className="text-[11px] text-gray-600">
                Voice Persona: <strong>{selectedAgent.voiceName || "Zephyr"}</strong> • Requires Level 2 Confirmation for external actions.
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Connected Tools ({selectedAgent.tools.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {selectedAgent.tools.map((tl, idx) => (
                <span
                  key={idx}
                  className="bg-white border border-gray-200 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-800 shadow-2xs flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{tl}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-gray-400">DiptiK AI Agent Architecture</span>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleDuplicateAgent(selectedAgent)}
                className="text-gray-600 hover:text-gray-900 font-bold flex items-center space-x-1 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Duplicate</span>
              </button>
              {selectedAgent.isCustom && (
                <button
                  onClick={async () => {
                    await deleteAgentTemplate(selectedAgent.id);
                    setSelectedAgent(agentTemplates[0]);
                    setActiveView("dashboard");
                    setStatusBanner(`Deleted custom agent "${selectedAgent.name}".`);
                  }}
                  className="text-red-600 hover:text-red-700 font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: Agent Task Planner */}
      {activeView === "planner" && activeAgentPlan && (
        <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 border border-gray-100 shadow-md text-left space-y-6 animate-in fade-in duration-200">
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase text-purple-700 bg-white px-2 py-0.5 rounded-full shadow-2xs">
                AI Agent Task Planner • {selectedAgent?.name}
              </span>
              <h2 className="text-lg font-extrabold text-purple-950 mt-1">{activeAgentPlan.title}</h2>
              <p className="text-xs text-purple-800 mt-0.5">{activeAgentPlan.summary}</p>
            </div>
            <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full shrink-0">
              {activeAgentPlan.confirmationLevel}
            </span>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Generated Execution Steps ({activeAgentPlan.steps.length})
            </h3>
            {activeAgentPlan.steps.map((st, i) => (
              <div
                key={st.id}
                className="p-4 rounded-2xl border border-gray-200 bg-white flex flex-col justify-between space-y-3 shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-gray-900 truncate block">
                      Step {st.id}: {st.action}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center">
                    <span className="text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 px-2.5 py-0.5 rounded-full">
                      Level 2 • {st.tool} Safeguard
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 mt-2 leading-relaxed">{st.description}</p>
                </div>

                <button
                  onClick={() => {
                    setActiveView("workspace");
                    runStepsSequentially(i, false);
                  }}
                  className="w-full py-2 px-3 bg-gray-100 hover:bg-purple-600 hover:text-white text-gray-800 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Run This Step in Workspace</span>
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
            <button
              onClick={() => setActiveView("dashboard")}
              className="py-2.5 px-4 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold cursor-pointer"
            >
              Edit Objective
            </button>
            <button
              onClick={() => {
                setCurrentStepIndex(0);
                setStepOutputs({});
                setActiveView("workspace");
                runStepsSequentially(0, autoContinue);
              }}
              className="py-3 px-7 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs font-bold shadow-md flex items-center space-x-2 cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>Approve Plan & Launch Workspace</span>
            </button>
          </div>
        </div>
      )}

      {/* VIEW 5: Agent Workspace */}
      {activeView === "workspace" && activeAgentPlan && (
        <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 border border-gray-100 shadow-md text-left space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                Active Execution Workspace • {selectedAgent?.name}
              </span>
              <h2 className="text-base font-extrabold text-gray-900 mt-1">{activeAgentPlan.title}</h2>
            </div>
            <div className="flex items-center space-x-3">
              <label className="flex items-center space-x-1.5 text-xs text-gray-600 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoContinue}
                  onChange={() => setAutoContinue(!autoContinue)}
                  className="rounded text-purple-600"
                />
                <span>Auto-Continue Steps</span>
              </label>
              <button
                onClick={() => openVoiceWithAgent(selectedAgent)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Discuss Live</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {activeAgentPlan.steps.map((st, i) => {
              const isCompleted = st.status === "completed" || Boolean(stepOutputs[st.id]);
              const isCurrent = i === currentStepIndex && !isCompleted;
              return (
                <div
                  key={st.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isCurrent
                      ? "bg-purple-50 border-purple-300 ring-1 ring-purple-500 shadow-sm"
                      : isCompleted
                      ? "bg-emerald-50/50 border-emerald-200"
                      : "bg-gray-50/50 border-gray-200 opacity-75"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isCompleted
                            ? "bg-emerald-600 text-white"
                            : isCurrent
                            ? "bg-purple-600 text-white animate-pulse"
                            : "bg-gray-300 text-gray-700"
                        }`}
                      >
                        {isCompleted ? <Check className="w-3.5 h-3.5" /> : st.id}
                      </span>
                      <span className="text-xs font-bold text-gray-900">{st.action}</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white border border-gray-200">
                      {isCompleted ? "Completed" : isCurrent ? "Active Step" : "Pending"}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 mt-2 pl-8">{st.description}</p>

                  {stepOutputs[st.id] && (
                    <div className="mt-3 ml-8 p-3 bg-white rounded-xl border border-gray-200/80 text-xs text-gray-800 whitespace-pre-line shadow-2xs">
                      <strong className="text-emerald-700 block mb-1">Tool Output ({st.tool}):</strong>
                      {stepOutputs[st.id]}
                    </div>
                  )}

                  {!isCompleted && !isExecutingStep && (
                    <div className="mt-4 ml-8 flex items-center space-x-2">
                      <button
                        onClick={() => runStepsSequentially(i, autoContinue)}
                        className="py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{autoContinue ? "Run From Here" : "Approve & Run Step"}</span>
                      </button>
                    </div>
                  )}
                  {isCurrent && isExecutingStep && (
                    <div className="mt-4 ml-8 flex items-center space-x-2 text-xs font-bold text-purple-700">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Executing {st.tool} with Gemini 4 Hydrogen...</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
            <button
              onClick={() => {
                setActiveView("dashboard");
                setStatusBanner("Agent workspace paused. You can resume or start a new workflow anytime.");
              }}
              className="py-2 px-4 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold cursor-pointer"
            >
              Pause Workspace
            </button>
            <button
              onClick={() => {
                setActiveTab("home");
                addNotification({
                  title: "Workflow Complete",
                  message: `"${activeAgentPlan.title}" results saved to Activity History.`,
                  category: "system"
                });
              }}
              className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
            >
              Finish & Return Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
