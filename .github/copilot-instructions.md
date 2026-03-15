---
description: "Workspace-level agent orchestration guidelines. Guides delegation to specialized subagents (create-subagent, memory-keeper) based on user intent."
---

# FlashFolder Agent Orchestration

This workspace uses **specialized subagents** to keep conversations focused and token-efficient.

## Available Subagents

| Agent | Trigger | Purpose |
|-------|---------|---------|
| `create-subagent` | "create", "design", "build" agent | Design custom agents for new tasks/domains |
| `memory-keeper` | "recall", "remember", "what did we" | Retrieve and synthesize past decisions, patterns, context |

## Delegation Rules

### **Invoke create-subagent when:**
- ✅ User: "Create an agent for refactoring"
- ✅ User: "Design a testing specialist"
- ✅ User: "Build an agent that analyzes performance"
- ✅ A recurring task emerges that should become an agent

### **Invoke memory-keeper when:**
- ✅ User: "What debugging patterns have we found?"
- ✅ User: "Recall the API architecture decision"
- ✅ User: "What did we do about the storage issue?"
- ✅ A decision needs historical context or past attempts

### **Stay as default agent when:**
- ✅ Direct coding work (editing, refactoring, debugging)
- ✅ Running commands and testing
- ✅ Answering general questions
- ✅ One-off tasks that don't need delegation

## Workflow Example

```
User: "I keep getting the same authentication error. Design an agent to catch that."

Default agent:
1. Invokes memory-keeper: "What auth issues have we seen before?"
   → Returns past auth debugging patterns
2. Invokes create-subagent: "Design an auth debugger agent"
   → Returns auth-debugger.agent.md
3. Saves new agent to .github/agents/
4. Updates memory with this pattern
```

## File Locations
- **Subagents**: `.github/agents/*.agent.md`
- **Agent log**: `.github/agents/README.md`
- **Memory**: `/memories/` (user), `/memories/session/` (current chat), `/memories/repo/` (project)

## How to Use
1. **Create agents as needed** – Say "create an agent for X"
2. **Use specialized agents** – "@debugging-expert" or "@my-agent-name"
3. **Recall context** – "Remember what we did with Y?"
4. **Review agents** – Ask to see `.github/agents/` to find existing agents

---

**Goal**: Keep your main chat concise and focused, delegate specialized work to subagents, maintain continuity via memory.
