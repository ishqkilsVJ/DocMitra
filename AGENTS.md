# 🔒 DocMitra Architectural Rulebook (`AGENTS.md`)

> **MANDATORY POLICY FOR ALL AI AGENTS & CONTRIBUTORS**  
> This document sets forth core architectural boundaries for the DocMitra repository. For dedicated Rename Tool work, agents MUST follow [`RENAME_TOOL_AGENT.md`](file:///e:/DocMitra/RENAME_TOOL_AGENT.md).

---

## 🤖 Permanent Tool Isolation & Lifecycles

### 🔒 1. Rename Tool (`tools/rename_tool/`)
- **Dedicated Rulebook:** All work on Rename Tool is strictly governed by [`RENAME_TOOL_AGENT.md`](file:///e:/DocMitra/RENAME_TOOL_AGENT.md).
- **Unlock -> Work -> Re-Lock:** Before making code changes to Rename Tool, always ask the user for explicit permission to unlock it first. Once approved, complete work, run `node build-ui.js`, and automatically re-lock `tools/rename_tool/README_LOCK.md`.
- **Zero Cross-Tool Leakage:** Never touch files inside `tools/rename_tool/` when working on other modules.

### 🔒 2. PDF Studio (`tools/pdf_studio/`)
- **Strictly Isolated and Locked:** `tools/pdf_studio/` is self-contained.
- **Zero Modification Without Explicit Approval:** When working on other tools or general features, agents must never touch `tools/pdf_studio/`. Modifying `tools/pdf_studio/` requires explicit user permission.

---

## 🎯 3. Strict Single-Tool Agent Scope
1. **Single Tool Boundary:** Every agent session is restricted to ONLY the single tool assigned to that conversation.
2. **Never Cross Tool Boundaries:** An agent assigned to one tool must NEVER touch, edit, or refactor files belonging to other tools, the Dashboard, or unrelated tool folders.
3. **App Shell & Shared Code Guard:** Shared files (`shared/`, `app/index.html`, `src/ui/index.js`) may only have forwarder shims or mounting links added; tool-specific business logic must NEVER be scattered into shared files.

---

## 🏛️ 4. "One Folder Per Tool" Architecture
1. **Self-Contained Tool Folders:** Every tool MUST live inside its own self-contained folder under `tools/<tool_name>/` (`<tool_name>.py`, `<tool_name>.html`, `<tool_name>.css`, `<tool_name>_ui.js`, `<tool_name>_logic.js`, and `README_LOCK.md`).
2. **Strict File Containment:** Any new file, helper script, or test created for a tool MUST be placed strictly inside that tool's folder (`tools/<tool_name>/`).
3. **No Scattering:** Never scatter tool-specific logic or styles into shared global files.

---

## ⚡ 5. Execution & Quality Standards
1. **Immediate Software Update:** After tool modifications are verified, immediately update the software by running `node build-ui.js` without extra permission.
2. **Targeted Context Reading:** Avoid reading massive multi-thousand-line files in full for small changes. Inspect only the relevant functions/line ranges to minimize token consumption.
3. **No Unnecessary Grilling:** If the user's instructions are clear, execute directly without stalling. Ask clarifying questions only if a requirement is genuinely ambiguous.
4. **Zero Deletion Policy:** Never delete existing project or user files without explicit approval.
5. **Zero Marathi Text in Production UI:** Production UI must remain 100% professional administrative English. Marathi is reserved for user chat and documentation.
6. **Zero Dummy Student Data:** DOM templates must initialize cleanly with real empty states.
