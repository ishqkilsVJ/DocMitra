# 🔒 DocMitra Architectural Rulebook & AI Agent Governance (`AGENTS.md`)

> **MANDATORY POLICY FOR ALL AI AGENTS & CONTRIBUTORS**  
> This document sets forth permanent, non-negotiable architectural constraints for the DocMitra codebase. Every agent working in this repository MUST comply with these rules.

---

## 🏛️ Rule 1: "One Folder Per Tool" Architecture

1. **Self-Contained Tool Boundaries:**  
   Every tool in DocMitra MUST live inside its own self-contained folder under `tools/<tool_name>/`.
   ```
   tools/<tool_name>/
   ├── <tool_name>.py            # Dedicated Python backend/file-ops module
   ├── <tool_name>.html          # Scoped component markup
   ├── <tool_name>.css           # Scoped CSS (wrapped under .<tool_name>-scope)
   ├── <tool_name>_ui.js         # UI bindings, interaction handlers, and renderers
   ├── <tool_name>_logic.js      # Pure business logic and domain calculations
   └── README_LOCK.md            # Tool boundary, status, and unlock protocol
   ```
2. **No Scattering:**  
   Never scatter tool-specific logic, styles, or handlers into shared global files (`tokens.css`, `layout.css`, `server.py`, etc.).
3. **Common Utilities Only in `shared/`:**  
   Only truly generic, cross-tool utilities (e.g., toast notification system, native desktop bridge) may reside in `shared/`. Tool business rules belong exclusively inside their respective tool directories.

---

## 🔒 Rule 2: Rename Tool Lock (`tools/rename_tool/`)

1. **Locked by Default:**  
   `tools/rename_tool/` is **STRICTLY LOCKED**. 100% of the Bulk Renamer (UI, Casing, Auto-increment Duplicates, 21 Shortcuts, Preview, Checklist, and Scoped CSS) is fully verified, operational, and locked.
2. **Zero Modification During Other Work:**  
   When working on ANY other tool (PDF Studio, Image Studio, Print Studio, Follow-up Desk, settings modal, or app shell), AI agents are strictly forbidden from modifying, refactoring, reformatting, or deleting any file inside `tools/rename_tool/`.
3. **Explicit Unlock Protocol:**  
   Even when the user explicitly requests changes to the Bulk Renamer in the future, the agent MUST ask for explicit confirmation:
   > *"Confirm tool unlock: Type `UNLOCK RENAME TOOL` to modify files inside `tools/rename_tool/`."*
   Without this exact confirmation, the tool must remain untouched.

---

## 🛡️ Rule 3: The "100-Document Backup" (Shadow / Mirror) Safety Rule

1. **Non-Destructive First:**  
   Never delete, overwrite, or destructively move working files before creating a clean backup.
2. **Shadow Implementation:**  
   Build new or migrated tool implementations in shadow paths first.
3. **Deep Verification Before Cutover:**  
   Test functionality, edge cases, and visual layout (including screenshot and DOM geometry checks) before switching routing.
4. **Quarantine to `_recycle_bin/`:**  
   After full verification passes, move replaced or obsolete prototype files into `_recycle_bin/` rather than deleting them permanently.

---

## 📐 Rule 4: Visual & Design Integrity

1. **Zero Unapproved Visual Changes:**  
   Keep 3-column Bento workstation grids, Hero Card styling, DPI indicators, and layout proportions consistent with the approved specification.
2. **Zero Marathi Text in Production UI:**  
   DocMitra UI must remain 100% clean English for administrative clarity.
3. **Zero Dummy Student Data in Production HTML:**  
   DOM templates must initialize cleanly with real empty states, not mock or hardcoded student records.
