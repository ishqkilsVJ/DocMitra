# 🚩 DocMitra Master Checkpoint & Rollback Log (`CHECKPOINT_LOG.md`)

> **GLOBAL ARCHITECTURAL POLICY: NUMBERED MILESTONE CHECKPOINTS**  
> Every verified, working milestone, feature, or bug fix across any module is permanently recorded with a sequential Git tag (`CP-001`, `CP-002`, ..., `CP-100+`).  
> In case of any bug or regression, the 1-Command Rollback Rule restores the project safely to any previous clean checkpoint.

---

## 📜 Checkpoint Registry

| Checkpoint ID | Date & Time (IST) | Module / Tool | Git Commit Hash | 1-Line Clean Working Summary | Rollback Command |
| :---: | :---: | :---: | :---: | :--- | :--- |
| **`CP-001`** | 2026-11-23 07:33 AM | **Bulk Document Renamer** (`tools/rename_tool/`) | `2d396f0` | 100% Bug-free final release: Physical Windows folder rename, exact typing casing, circular queue loop (1..N..1), 2-row settings modal, live search, 24/24 PRD tests passed. | `git reset --hard CP-001` |
| **`CP-002`** | 2026-11-23 08:00 AM | **Root Directory / Docs Cleanup** (`tools/rename_tool/docs/`) | `0970910` | Safely organized 9 Rename Tool .md reports into tools/rename_tool/docs/, updated references in AGENTS.md, SKILL.md, and TOOL_FREEZE_REGISTRY.md with 100% test integrity. | `git reset --hard CP-002` |
| **`CP-003`** | 2026-11-23 08:35 AM | **Bulk Document Renamer** (`tools/rename_tool/`) | `9ff25a1` | Fixed 4 UI bugs in Settings modal: Child modal z-index stacking (z-9999), Shortcuts table 5-column alignment with '#', locked table widths (48px, 24%, 11%, 48%, 90px) with clean downward text wrapping, and live search bars in both tabs. Built via cargo tauri build with embedded frontend dist. | `git reset --hard CP-003` |

---

## 🛡️ Checkpoint & Rollback Operational Rules

### 1. 🔄 Auto-Checkpoint Rule (Mandatory)
- After EVERY verified, working feature, bug fix, or milestone across any module, the AI Agent must automatically:
  1. Create a sequential numbered Git tag (`CP-001`, `CP-002`, `CP-003`, up to `CP-100+`).
  2. Append a new row to `CHECKPOINT_LOG.md` with: Checkpoint ID, Timestamp, Module Name, Git Commit Hash, and a concise 1-line summary of what works cleanly.
  3. Ensure the release build (`cargo tauri build` / `node build-ui.js`) compiles with 0 errors.

### 2. ⏪ 1-Command Safe Rollback Rule
- If any future change introduces bugs or regressions (e.g., at `CP-021` or `CP-022`), and the user requests a rollback to an earlier clean checkpoint (e.g., `CP-020`):
  1. **Safe Archive:** The broken commits are preserved in a safety branch (e.g., `git branch rollback-archive/<current-commit>`).
  2. **Clean Restore:** The working branch is reset cleanly to the target tag:
     ```powershell
     git reset --hard <TARGET_CHECKPOINT_TAG>
     ```
  3. **Verification:** Immediately run `node build-ui.js` and test suites to verify that the clean working state is 100% restored.
