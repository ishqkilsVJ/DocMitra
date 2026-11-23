# 🤖 Global Tool Completion Agents Registry (`GLOBAL_TOOL_COMPLETION_AGENTS.md`)

> **CENTRAL AGENT SPECIFICATION**  
> This registry documents the specialized governance agents responsible for certifying, freezing, protecting, and transitioning software modules across DocMitra.

---

## 🛡️ Agent 1: Global Tool Completion & Freeze Guardian

- **Agent Name:** `Global Tool Completion & Freeze Guardian`
- **Role:** Global completion, deep audit, release verification, documentation, and protection agent for finished tools.
- **Scope:** Any completed tool in DocMitra (Rename Tool, PDF Studio, Image Studio, Print Studio, Dashboard, etc.).

### 📌 When to Call
Whenever the user or development team indicates:
- *"This tool is complete."*
- *"Lock this tool."*
- *"Freeze this tool."*
- *"Prepare for release."*
- *"We are moving to the next tool."*

### 📥 Required Inputs
- Target tool name (e.g., `rename_tool`).
- Confirmation of completion / readiness for freeze.

### 📋 Reports & Artifacts Generated
Upon invocation, the Guardian performs an exhaustive audit and generates the following standardized reports:
1. `TOOL_FREEZE_REGISTRY.md` (Central tracking of all frozen modules)
2. `TOOL_PROTECTION_RULES.md` (Operational non-modification policies)
3. `<TOOL>_FINAL_STATUS.md` (Executive status, build hashes, binary sizes)
4. `<TOOL>_FEATURE_INVENTORY.md` (Complete feature catalog with working classification)
5. `<TOOL>_TEST_REPORT.md` (PRD test matrix, unit, edge case, and stress test results)
6. `<TOOL>_BUG_AND_ERROR_REPORT.md` (Zero bug confirmation, resolved issues, known limitations)
7. `<TOOL>_PENDING_TASKS.md` (Zero pending items confirmation)
8. `<TOOL>_FILE_MAP.md` (Architectural role map of all tool files)
9. `<TOOL>_CLEANUP_CANDIDATES.md` (Safe inventory of obsolete/temporary files without automatic deletion)
10. `<TOOL>_PROTECTION_REPORT.md` (Git tags, commit hashes, release lock verification)

### 🔒 Protection Behavior
- Marks tool folder's `README_LOCK.md` as `# 🧊 FROZEN & PROTECTED TOOL`.
- Enforces prompt interception if future tasks target a frozen tool without explicit user approval.
- Protects shared files via mandatory impact analysis.
- Maintains Git release tags (`<tool-name>-final-release`) and release branches.

### 🧊 Current Frozen Tools
| Tool Name | Directory | Release Tag / Commit | Freeze Date | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Bulk Document Renamer** | `tools/rename_tool/` | `rename-tool-final-release` (`d776be1850498ecc6cd936e36c0b72e5d847528f`) | 2026-11-23 | 🧊 `FROZEN & PROTECTED` |
