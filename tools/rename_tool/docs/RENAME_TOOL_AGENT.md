# 🤖 RENAME TOOL DEDICATED AGENT RULEBOOK (`RENAME_TOOL_AGENT.md`)

> **MANDATORY GOVERNANCE FOR BULK RENAME TOOL AGENT**  
> This rulebook strictly governs all AI agents working on the Bulk Rename Tool (`tools/rename_tool/`). All rules herein are permanent, non-negotiable, and optimized for zero token waste and maximum execution speed.

---

## 🔒 1. Mandatory Unlock -> Work -> Re-Lock Lifecycle

1. **Pre-Change Unlock Request:**
   - Before making ANY code changes or modifications inside `tools/rename_tool/`, **ALWAYS ask the user for explicit permission to unlock the tool first**.
   - Example prompt to user:
     > *"Rename Tool मध्ये बदल करण्यासाठी टूल अनलॉक करण्याची परवानगी द्या (कृपया Unlock करण्याची पुष्टी करा)."*
2. **Execution Upon Approval:**
   - Once the user gives confirmation/approval, unlock the tool and execute the requested work.
3. **Automatic Re-Lock:**
   - Immediately upon completing and verifying the changes, **automatically update `tools/rename_tool/README_LOCK.md` to `STRICTLY LOCKED & VERIFIED`**.

---

### 🛑 Strict Mandatory `/grill-me` Protocol (Before Every Task)
1. **Zero-Exception Questioning Gate:**
   - No matter how large, detailed, or clear the user's prompt is, **NEVER jump straight into coding or execution**.
   - You MUST ALWAYS process every request through a **`/grill-me` questioning phase** first so the user can personally review and approve every single detail before you proceed.
2. **Explain Every Question with an Example:**
   - For every question you ask, include a **clear, simple real-world example** explaining what it means and how it will affect the Rename Tool.
3. **Mandatory Color-Coded Options:**
   - Every single question MUST provide color-coded choices in this exact format:
     - 🟢 **Green (शिफारस केलेले / Recommended):** The safest, best-practice option.
     - 🟠 **Orange (पर्यायी / Alternative):** An alternative approach with trade-offs.
     - 🔵 **Custom (स्वतःचा पर्याय):** Allows the user to specify their own custom behavior.
4. **100% Marathi Language Requirement:**
   - Every question, explanation, example, and color-coded option MUST be written strictly in **clear, simple Marathi (मराठी)**.
5. **Strict Hold Until User Approves:**
   - Do NOT write or modify a single line of code until the user has reviewed and answered your `/grill-me` questions and explicitly told you to proceed.

---

## 🎯 2. Strict Scope Isolation

1. **Dedicated Scope Boundary:**
   - Your operational scope is **strictly limited to `tools/rename_tool/`**.
2. **Absolute Zero Leakage:**
   - **NEVER** modify, edit, refactor, or touch:
     - `tools/pdf_studio/`
     - Dashboard modules
     - Image Studio
     - Print Studio
     - Follow-up Desk
     - Unrelated global app settings or shell components.
3. **Cross-Tool Refusal:**
   - If asked casually to modify another tool, refuse politely and redirect the user to a dedicated session for that tool.

---

## 📁 3. Strict File Containment

1. **No Scattering Outside Tool Directory:**
   - Any new file, helper script, test utility, report, or configuration created for the Rename Tool **MUST be placed strictly inside `tools/rename_tool/`** (e.g., `tools/rename_tool/tests/`, `tools/rename_tool/reports/`).
2. **Clean Project Root:**
   - Never scatter temporary scratch scripts, test outputs, or ad-hoc files across the project root or unrelated directories.

---

## ⚡ 4. Immediate Software Update & Live Deployment

1. **Mandatory Live App Target:**
   - The user ALWAYS launches and inspects DocMitra directly from **`C:\Users\USER\AppData\Local\DocMitra\app.exe`**.
2. **Automated Build & Deployment Pipeline:**
   - Once any Rename Tool changes are finalized and verified, you MUST **IMMEDIATELY without asking for extra permission**:
     1. Run `node build-ui.js` to compile the frontend assets.
     2. Rebuild the native desktop binary (`cargo build --release`) and **deploy/copy the updated `app.exe` (and any updated runtime assets) directly into `C:\Users\USER\AppData\Local\DocMitra\`**.
     3. If `app.exe` is currently running and locking the file, safely terminate/close the process first, replace `C:\Users\USER\AppData\Local\DocMitra\app.exe`, and verify the updated timestamp.
3. **Final Status Confirmation:**
   - At the conclusion of every task, clearly confirm to the user (in Marathi) that `C:\Users\USER\AppData\Local\DocMitra\app.exe` has been successfully updated/deployed and the tool is safely re-locked in `README_LOCK.md`.

---

## 🛡️ 5. Engineering & Performance Guardrails (Best Practices)

1. **Targeted Context Reading (Save Tokens & Time):**
   - **NEVER** read massive files (such as the 4,200-line `rename_tool_ui.js`) in their entirety for small edits.
   - Use targeted search (`Select-String` / line range reads) to inspect only the specific function or block being updated.
2. **Automated Verification Gate:**
   - Before compiling the final build, always run relevant quick tests (`node scripts/test_*.js` or targeted unit checks) to guarantee zero regressions, zero false matches, and 100% stability.
3. **Zero Deletion Policy:**
   - **NEVER** permanently delete any existing project or user files without explicit approval. Obsolete files must be quarantined to `_recycle_bin/` only when confirmed.
4. **Communication Language:**
   - User-facing responses, explanations, and questions must be written in **clear, professional Marathi (मराठी)**.
   - All code, variable names, function names, filenames, and production UI text must remain **100% clean English** (zero Marathi in production HTML/DOM).

---

## 🖥️ 6. Real Desktop App Only (No External Browser)

1. **Strict Prohibition of External Browsers:**
   - **NEVER** open an external web browser (Chrome/Edge) for testing or verification.
2. **Direct Desktop App Testing & Verification:**
   - **ALWAYS** launch and test directly from **`C:\Users\USER\AppData\Local\DocMitra\app.exe`** (in Full Screen mode with WebView2 remote debugging enabled when attaching Playwright/DevTools MCP) *after* deploying your latest update there.

---

## 🧹 7. Automatic Post-Implementation Cleanup (Move to Recycle Bin)

1. **Immediate Workspace Hygiene:**
   - Once any task, bug fix, or feature is fully implemented and verified, **IMMEDIATELY** move all temporary test scripts, scratch files, and finished/unnecessary audit reports to the Recycle Bin (or the project's `recycle_bin/` folder) so they do not clutter the workspace, while remaining recoverable if ever needed.
2. **Core Source Protection:**
   - Core application source code must remain strictly safe; **never permanently delete files**.
