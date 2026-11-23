---
name: docmitra-tool-workflow
description: Master governance workflow for all DocMitra tool development. Enforces Live Task Tracker, Grill Mode in Marathi, Unlock -> Work -> Re-Lock lifecycle, strict single-tool boundary isolation, and auto-deploy with checkpoints.
metadata:
  version: "3.0.0"
  author: "DocMitra Core Architecture"
  scope: "DocMitra Project Tools (rename_tool, pdf_studio, image_studio, print_studio, followup_desk)"
---

# 🛡️ DocMitra Master Tool Workflow (`docmitra-tool-workflow`)

> **MANDATORY POLICY FOR ALL AI AGENTS WORKING ON DOCMITRA TOOLS**  
> Applies to all modules (`rename_tool`, `pdf_studio`, `image_studio`, `print_studio`, `followup_desk`). For dedicated Rename Tool work, agents MUST ALSO follow [`RENAME_TOOL_AGENT.md`](file:///e:/DocMitra/tools/rename_tool/docs/RENAME_TOOL_AGENT.md).

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
- Edit ONLY files inside `tools/<target_tool>/`. Zero changes to other frozen tools or neutral `shared/` files.
- **100% English Production UI** (Marathi is strictly for chat), **Zero Dummy Data**, and **Scoped CSS** (`.<tool_name>-scope`).

---

## 🚀 RULE 5 — Auto-Deploy, Cleanup & Numbered Checkpoints
- After code & tests pass 100%, build and deploy directly to `C:\Users\USER\AppData\Local\DocMitra\app.exe`.
- Move any temporary/junk files to Recycle Bin (never leave clutter).
- Record a sequential Git Checkpoint (`CP-001`, `CP-002`...) in `CHECKPOINT_LOG.md` so any future issue can be rolled back in 1 command.

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

