# Session Agents Log

Track custom agents created during your work sessions.

## Agents Created This Session
<!-- Example format:
- **debugging-expert** (created via create-subagent)
  - Purpose: Find and fix TypeScript errors
  - Tools: read, search, execute
  - Created: March 15, 2026
-->

## Quick Reference
All custom agents are stored in:
- `.github/agents/*.agent.md` (workspace-scoped)
- `~/.vscode/extensions/.../agents/*.agent.md` (user-scoped)

## Handoff Patterns
Use these patterns to invoke agents:
- `@create-subagent "Design an agent for..."` - Create new agents
- `@memory-keeper "What patterns..."` - Recall past decisions

