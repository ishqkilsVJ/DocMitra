# 🔒 DocMitra Architectural Rulebook (`AGENTS.md`)

> **MANDATORY POLICY FOR ALL AI AGENTS & CONTRIBUTORS**  
> Applies to all modules (`rename_tool`, `pdf_studio`, `image_studio`, `print_studio`, `followup_desk`).  
> For dedicated Rename Tool work, agents MUST ALSO follow [`RENAME_TOOL_AGENT.md`](file:///e:/DocMitra/tools/rename_tool/docs/RENAME_TOOL_AGENT.md).  
> Governed by the DocMitra Master Tool Workflow: [`docmitra-tool-workflow`](file:///e:/DocMitra/.agents/skills/docmitra-tool-workflow/SKILL.md).

---

## 📊 RULE 1 — Mandatory Live Task Tracker (ALWAYS ON)
- For EVERY user request (whether 2 steps or 25 steps), ALWAYS initialize and update Antigravity's built-in **Live Task/Checklist Tracker** (`update_steps`) before writing code or running commands.
- Break the task into clear numbered steps (e.g., `1/5`, `2/5`...) so the user can visually track completed (`✓`) and active steps in real time. Never skip this.

---

## 🎯 RULE 2 — Mandatory Grill Mode (Before Coding)
- NEVER jump directly into code (unless user explicitly says `"skip grilling"` or `"direct implementation"`).
- Ask 2–4 focused questions in **clear Marathi (मराठी)** with **exactly 4 concrete options (`[A]`, `[B]`, `[C]`, `[D]`)** per question. Wait for the user's choice (e.g., `1-A, 2-B`) before proceeding.

---

## 🔒 RULE 3 — Lock ➔ Unlock ➔ Re-Lock Lifecycle
- Inspect `tools/<tool_name>/README_LOCK.md` before touching any file.
- If `LOCKED` or `FROZEN`, STOP and ask: *"Confirm tool unlock: Type `UNLOCK <TOOL_NAME>` to modify files inside `tools/<tool_name>/`."* Casual approval ("ok", "yes") is invalid.
- Immediately after verification passes, update `README_LOCK.md` back to `LOCKED` and confirm.

---

## 🏛️ RULE 4 — Strict Single-Tool Isolation & UI Quality
1. **Single Tool Boundary:** Edit ONLY files inside `tools/<target_tool>/`. Zero changes to other frozen tools (`pdf_studio`, etc.) or neutral `shared/` files.
2. **App Shell & Shared Code Guard:** Shared files (`shared/`, `app/index.html`, `src/ui/index.js`) may only have forwarder shims or mounting links added; tool-specific business logic must NEVER be scattered into shared files.
3. **"One Folder Per Tool" Containment:** Any new file, helper script, or test created for a tool MUST be placed strictly inside that tool's folder (`tools/<tool_name>/`).
4. **100% English Production UI:** Production UI must remain 100% professional administrative English. Marathi is strictly reserved for user chat and documentation.
5. **Zero Dummy Student Data:** DOM templates must initialize cleanly with real empty states.
6. **Scoped CSS:** All styling must be strictly scoped under the `.<tool_name>-scope` namespace.

---

## 🚀 RULE 5 — Auto-Deploy, Cleanup & Numbered Checkpoints
1. **Immediate Software Update:** After tool modifications and tests pass 100%, compile UI with `node build-ui.js`, build release with `cargo build --release` (or `cargo tauri build`), and deploy directly to `C:\Users\USER\AppData\Local\DocMitra\app.exe`.
2. **Clean Workspace:** Move any temporary or junk files to Recycle Bin (never leave clutter). Never delete existing project or user files without explicit approval.
3. **Auto-Checkpoint Rule:** Record a sequential Git Checkpoint (`CP-001`, `CP-002`, ...) in [`CHECKPOINT_LOG.md`](file:///e:/DocMitra/CHECKPOINT_LOG.md) with Checkpoint ID, Date/Time, Module Name, Git Commit Hash, and a 1-line clean working summary so any future issue can be rolled back in 1 command.
4. **1-Command Rollback Rule:** If any future change introduces bugs or regressions, upon user request, the agent MUST safely archive broken commits into a backup branch (`rollback-archive/<commit>`), reset `master` to the target checkpoint tag (`git reset --hard CP-XXX`), and verify the restored build.

---

## 🧪 RULE 6 — Mandatory Dual-MCP Automated QA Gate (ALWAYS ON)
After EVERY code change, UI tweak, feature addition, or bug fix across ANY DocMitra module (before building `app.exe`, re-locking, or presenting a completion report):
1. **Run Playwright MCP (Functional & UI E2E Test):**
   - Automatically test all modified user flows, clicks, inputs, modals, and edge cases using **Playwright MCP**.
2. **Run Chrome DevTools MCP (Console, Network & Layout Inspection):**
   - Automatically inspect the live app using **Chrome DevTools MCP** to guarantee **0 console errors**, **0 uncaught runtime exceptions**, **0 broken network/IPC calls**, and clean DOM/layout rendering.
3. **Strict Pass-Only Approval Gate:**
   - NEVER present a task as "Done", NEVER deploy `app.exe`, and NEVER re-lock a tool until **BOTH Playwright MCP and Chrome DevTools MCP pass 100%**.
   - Always include a short **Dual-MCP Verification Report** (Playwright: PASS/FAIL + Chrome DevTools: 0 Console Errors) in the final Marathi summary.
   - This is a permanent global rule—execute it automatically every time without asking the user.

