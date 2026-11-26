# 🤖 PDF TOOL DEDICATED AGENT RULEBOOK (`PDF_TOOL_AGENT.md`)

> **MANDATORY GOVERNANCE FOR PDF STUDIO AGENT**  
> This rulebook strictly governs all AI agents working on PDF Studio (`tools/pdf_studio/`). All rules herein are permanent, non-negotiable, and optimized for zero token waste, zero port 3000 dependency, and maximum execution speed.

---

## 🔒 1. Mandatory Unlock -> Work -> Re-Lock Lifecycle

1. **Pre-Change Unlock Request:**
   - Before making ANY code changes or modifications inside `tools/pdf_studio/`, **ALWAYS ask the user for explicit permission to unlock the tool first**.
   - Example prompt to user:
     > *"PDF Studio मध्ये बदल करण्यासाठी टूल अनलॉक करण्याची परवानगी द्या: Type `UNLOCK PDF STUDIO` to modify files inside `tools/pdf_studio/`."*
2. **Execution Upon Approval:**
   - Once the user gives explicit confirmation by typing `UNLOCK PDF STUDIO`, unlock the tool and execute the requested work.
3. **Automatic Re-Lock:**
   - Immediately upon completing and verifying changes with Dual-MCP QA, **automatically update `tools/pdf_studio/README_LOCK.md` to `STRICTLY LOCKED & VERIFIED`**.

---

### 🛑 Strict Mandatory `/grill-me` Protocol (Before Every Task)
1. **Zero-Exception Questioning Gate:**
   - No matter how large, detailed, or clear the user's prompt is, **NEVER jump straight into coding or execution** (unless user explicitly says `"skip grilling"` or `"direct implementation"`).
   - You MUST ALWAYS process every request through a **`/grill-me` questioning phase** first so the user can personally review and approve every single detail before you proceed.
2. **Explain Every Question with an Example:**
   - For every question you ask, include a **clear, simple real-world example** explaining what it means and how it will affect PDF Studio.
3. **Mandatory 4-Option Format (`[A]`, `[B]`, `[C]`, `[D]`):**
   - Every single question MUST provide exactly 4 concrete options:
     - 🟢 **[A] (शिफारस केलेले / Recommended):** The safest, best-practice option.
     - 🟠 **[B] (पर्यायी / Alternative):** An alternative approach with trade-offs.
     - 🟡 **[C] (किमान / Minimal):** A minimal or conservative approach.
     - 🔵 **[D] (स्वतःचा पर्याय / Custom):** Allows the user to specify their own custom behavior.
4. **100% Marathi Language Requirement:**
   - Every question, explanation, example, and option MUST be written strictly in **clear, simple Marathi (मराठी)**.
5. **Strict Hold Until User Approves:**
   - Do NOT write or modify a single line of code until the user has reviewed and answered your `/grill-me` questions and explicitly told you to proceed.

---

## 🎯 2. Strict Scope Isolation

1. **Dedicated Scope Boundary:**
   - Your operational scope is **strictly limited to `tools/pdf_studio/`**.
2. **Absolute Zero Leakage:**
   - **NEVER** modify, edit, refactor, or touch:
     - `tools/rename_tool/` (strictly sealed & frozen under `CP-042`)
     - Dashboard modules / App shell
     - Image Studio (`tools/image_studio/`)
     - Print Studio (`tools/print_studio/`)
     - Follow-up Desk (`tools/followup_desk/`)
     - Neutral shared files (`shared/`, `src/ui/index.js`, `app/index.html`) except for forwarding shims or mounting links when required.
3. **Cross-Tool Refusal:**
   - If asked casually to modify another tool during a PDF Studio session, refuse politely and redirect the user to a dedicated session for that tool.

---

## 📁 3. Strict File Containment

1. **No Scattering Outside Tool Directory:**
   - Any new file, helper script, test utility, report, or configuration created for PDF Studio **MUST be placed strictly inside `tools/pdf_studio/`** (e.g., `tools/pdf_studio/tests/`, `tools/pdf_studio/docs/`).
2. **Clean Project Root:**
   - Never scatter temporary scratch scripts, test outputs, or ad-hoc files across the project root or unrelated directories.

---

## ⚡ 4. Immediate Software Update & Live Deployment

1. **Mandatory Live App Target:**
   - The user ALWAYS launches and inspects DocMitra directly from **`C:\Users\USER\AppData\Local\DocMitra\app.exe`**.
2. **Automated Build & Deployment Pipeline:**
   - Once any PDF Studio changes are finalized and verified, you MUST **IMMEDIATELY without asking for extra permission**:
     1. Run `node build-ui.js` to compile the frontend assets.
     2. Rebuild the native desktop binary (`cargo tauri build` or `cargo build --release`) and **deploy/copy the updated `app.exe` directly into `C:\Users\USER\AppData\Local\DocMitra\`**.
     3. If `app.exe` is currently running and locking the file, safely terminate/close the process first, replace `C:\Users\USER\AppData\Local\DocMitra\app.exe`, and verify the updated timestamp.
3. **Final Status Confirmation:**
   - At the conclusion of every task, clearly confirm to the user (in Marathi) that `C:\Users\USER\AppData\Local\DocMitra\app.exe` has been successfully updated/deployed and the tool is safely re-locked in `README_LOCK.md`.

---

## 🧪 5. Mandatory Dual-MCP Automated QA Gate (ALWAYS ON)

After EVERY code change, UI tweak, feature addition, or bug fix inside PDF Studio (before building `app.exe`, re-locking, or presenting a completion report):
1. **Run Playwright MCP (Functional & UI E2E Test):**
   - Automatically test all modified PDF Studio user flows, tool switching, drag & drop, card rendering, and execution using **Playwright MCP**.
2. **Run Chrome DevTools MCP (Console, Network & Layout Inspection):**
   - Automatically inspect the live app using **Chrome DevTools MCP** to guarantee **0 console errors**, **0 uncaught runtime exceptions**, **0 broken IPC calls**, and clean DOM rendering.
3. **Strict Pass-Only Approval Gate:**
   - NEVER present a task as "Done", NEVER deploy `app.exe`, and NEVER re-lock PDF Studio until **BOTH Playwright MCP and Chrome DevTools MCP pass 100%**.
   - Always include a short **Dual-MCP Verification Report** (Playwright: PASS/FAIL + Chrome DevTools: 0 Console Errors) in the final Marathi summary.

---

## 🛡️ 6. Engineering & Performance Guardrails (PDF Studio Best Practices)

1. **Zero-Port Native IPC Bridge (No Localhost:3000):**
   - All disk reading and writing MUST route through Tauri's native commands: `invoke('read_binary_file')` and `invoke('write_binary_file')` via `shared/native-bridge.js`.
   - Never use `http://localhost:3000/api/...` or browser `<a download>` links for core document processing; write output files directly to disk in dedicated subfolders.
2. **Zero Overwrite Protection:**
   - Never overwrite user original PDF files. Always output processed files to dedicated subfolders (`Compressed_PDF/`, `Merged_PDF/`, `Split_PDF/`, `Converted_JPG/`, `Rotated_PDF/`, `Enhanced_PDF/`).
3. **Automatic Windows Lock Stripping:**
   - All written files must automatically clear Windows Read-Only flags and strip `:Zone.Identifier` Mark-of-the-Web streams via Tauri's `strip_windows_file_locks`.
4. **Targeted Context Reading (Save Tokens & Time):**
   - **NEVER** read massive files in their entirety for small edits. Use targeted line-range reads or searches.
5. **Zero Deletion Policy:**
   - **NEVER** permanently delete any existing project or user files without explicit approval.
6. **Communication Language:**
   - User-facing responses, explanations, and questions must be written in **clear, professional Marathi (मराठी)**.
   - All code, variable names, function names, filenames, and production UI text must remain **100% clean English** (zero Marathi in production HTML/DOM).
7. **Clean Empty State & Scoped CSS:**
   - Zero hardcoded student dummy cards in DOM templates; initialize with clean empty states.
   - All styles must remain strictly scoped under `.pdf-studio-scope`.
8. **Unified Suite-Wide Toast Policy:**
   - All notifications must strictly route through `import { toast } from '../../shared/toast.js'`. Never create localized floating banners.

---

## 🖥️ 7. Real Desktop App Only (No External Browser)

1. **Strict Prohibition of External Browsers:**
   - **NEVER** open an external web browser (Chrome/Edge) for testing or verification.
2. **Direct Desktop App Testing & Verification:**
   - **ALWAYS** launch and test directly from **`C:\Users\USER\AppData\Local\DocMitra\app.exe`** (with remote debugging port enabled when attaching Playwright / Chrome DevTools MCP) after deploying your latest update.

---

## 🧹 8. Automatic Post-Implementation Cleanup (Move to Recycle Bin)

1. **Immediate Workspace Hygiene:**
   - Once any task, bug fix, or feature is fully implemented and verified, **IMMEDIATELY** move all temporary test scripts, scratch files, and intermediate test outputs to the Recycle Bin (`recycle_bin/`) so they do not clutter the workspace.
2. **Core Source Protection:**
   - Core application source code must remain strictly safe; **never permanently delete files**.
