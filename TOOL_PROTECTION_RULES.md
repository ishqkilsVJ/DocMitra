# 🛡️ DocMitra Tool Protection Rules (`TOOL_PROTECTION_RULES.md`)

> **GLOBAL ARCHITECTURAL POLICY**  
> This document specifies strict protection rules for any tool designated as **FROZEN** in `TOOL_FREEZE_REGISTRY.md`. These rules are binding on all AI agents, developers, and automated tools.

---

## 🔒 1. Core Freeze Policy

Once a tool is audited, verified, and officially declared **FROZEN**:
1. **Zero Unapproved Modification:** Agents and contributors must **NEVER** edit, refactor, reorganize, or delete any file inside the frozen tool's folder (`tools/<tool_name>/`) without explicit user permission.
2. **Dedicated Release Checkpoints:** Every frozen tool must have a corresponding Git release tag (e.g., `<tool-name>-final-release`) and branch preserving its pristine working state.
3. **Strict Isolation:** During work on another tool (e.g., `tools/pdf_studio/`), the frozen tool's directory is strictly out-of-bounds.

---

## ⚡ 2. Shared Code & App Shell Guard

1. **Impact Analysis First:** If a future task requires changes to shared resources (`shared/`, `app/index.html`, `src/ui/index.js`, `src/services/`, or `src-tauri/src/lib.rs`):
   - The agent MUST conduct an impact analysis to confirm the change will not break or alter the frozen tool's behavior.
   - Forwarder shims and non-breaking additive extensions are permitted. Modifying existing APIs, Rust commands, or shared helper signatures relied upon by a frozen tool is strictly prohibited.
2. **Zero Ingestion of Tool Logic into Shared Space:** Tool-specific business logic, styling, or rules must never be scattered into global or shared files.

---

## 🚫 3. Prompt Safety Interception Protocol

Whenever a user prompt is received during work on another module:
1. **Scope Inspection:** Check if the prompt requests modifications to a frozen tool (e.g., Rename Tool).
2. **Interception Rule:** If the prompt affects a frozen tool, the agent MUST immediately pause and issue this warning in Marathi:
   > *"हा prompt Frozen [Tool Name] शी संबंधित आहे. या Tool मध्ये बदल करण्यासाठी तुमची स्पष्ट approval आवश्यक आहे. बदल करू का?"*
3. **No Execution Without Explicit Approval:** Under no circumstances should edits be applied to a frozen tool without unambiguous confirmation from the user.

---

## 🏛️ 4. Active Frozen Tools

Refer to [`TOOL_FREEZE_REGISTRY.md`](file:///e:/DocMitra/TOOL_FREEZE_REGISTRY.md) for current active freeze records.
- **Bulk Document Renamer (`tools/rename_tool/`):** `FROZEN & PROTECTED` (Tag: `rename-tool-final-release`, Commit: `d776be1850498ecc6cd936e36c0b72e5d847528f`).
