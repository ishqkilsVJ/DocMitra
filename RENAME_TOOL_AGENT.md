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

## ⚡ 4. Immediate Software Update & Final Confirmation

1. **Instant UI Bundle Compilation:**
   - Once the Rename Tool changes are finalized and verified, **IMMEDIATELY update the software by running `node build-ui.js` without asking for extra permission**.
   - This takes only ~100ms and immediately updates `app/assets/js/app.js`.
2. **Native Rust Build Condition:**
   - **DO NOT** run `cargo build --release` for standard frontend/logic updates.
   - Run `cargo build --release` ONLY if files inside `src-tauri/src/` (Rust backend) change or if the user explicitly requests a full native `.exe` release build.
3. **Final Status Confirmation:**
   - At the conclusion of every task, clearly report to the user (in Marathi) that the software has been updated (`node build-ui.js` completed) and the tool is safely re-locked in `README_LOCK.md`.

---

## 🛡️ 5. Engineering & Performance Guardrails (Best Practices)

1. **Targeted Context Reading (Save Tokens & Time):**
   - **NEVER** read massive files (such as the 4,200-line `rename_tool_ui.js`) in their entirety for small edits.
   - Use targeted search (`Select-String` / line range reads) to inspect only the specific function or block being updated.
2. **No Unnecessary Grilling:**
   - If the user's prompt or instruction is clear and specific, **DO NOT stall with mandatory 4-option questionnaires**. Proceed directly with execution.
   - Ask concise clarifying questions **ONLY** if a requirement is genuinely ambiguous or carries architectural risk.
3. **Automated Verification Gate:**
   - Before compiling the final build, always run relevant quick tests (`node scripts/test_*.js` or targeted unit checks) to guarantee zero regressions, zero false matches, and 100% stability.
4. **Zero Deletion Policy:**
   - **NEVER** permanently delete any existing project or user files without explicit approval. Obsolete files must be quarantined to `_recycle_bin/` only when confirmed.
5. **Communication Language:**
   - User-facing responses, explanations, and questions must be written in **clear, professional Marathi (मराठी)**.
   - All code, variable names, function names, filenames, and production UI text must remain **100% clean English** (zero Marathi in production HTML/DOM).
