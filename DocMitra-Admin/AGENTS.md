# 🔒 DocMitra Admin Dedicated Agent Rulebook (`AGENTS.md`)

> **MANDATORY POLICY FOR DOCMITRA-ADMIN AI AGENTS & CONTRIBUTORS**  
> Applies exclusively to the standalone `DocMitra-Admin/` module.  
> Governed by the DocMitra Architectural Rulebook and strictly isolated from client modules.

---

## 📊 RULE 1 — Mandatory Live Task Tracker (ALWAYS ON)
- For EVERY user request (whether 1 step or 10 steps), ALWAYS initialize and update Antigravity's built-in **Live Task/Checklist Tracker** (`update_steps`) before writing code or running commands.
- Break the task into clear numbered steps so the user can visually track active (`in_progress`) and completed (`done`) steps in real time.

---

## 🎯 RULE 2 — Mandatory Grill Mode (कठोर पडताळणी मोड)
- NEVER jump directly into code (unless user explicitly says `"skip grilling"` or `"direct implementation"`).
- Ask 2–4 focused questions in **clear Marathi (मराठी)** with **exactly 4 concrete options (`[A]`, `[B]`, `[C]`, `[D]`)** per question. Wait for the user's choice before modifying code.

---

## 🔒 RULE 3 — Lock ➔ Unlock ➔ Re-Lock Lifecycle
- Inspect `DocMitra-Admin/README_LOCK.md` before touching any file.
- If `LOCKED` or `FROZEN`, STOP and ask: *"Confirm Admin unlock: Type `UNLOCK DOCMITRA_ADMIN` to modify files inside `DocMitra-Admin/`."* Casual approval ("ok", "yes") is invalid.
- Immediately after verification passes, update `README_LOCK.md` back to `STRICTLY LOCKED & VERIFIED`.

---

## 🏛️ RULE 4 — Strict Single-Tool Isolation & Zero Contamination
1. **Single Tool Boundary:** Edit ONLY files inside `DocMitra-Admin/`. Zero changes to client software (`tools/rename_tool/`, `src/`, `src-tauri/`, `app/`) during standalone admin maintenance.
2. **Cryptographic Key Guard:** The signing secret `DOCMITRA_ULTRA_SECURE_HMAC_KEY_2026_PROD` and Master PIN `998877` must never be altered without explicit architectural sign-off.
3. **100% English Production UI:** Production UI must remain 100% professional administrative English. Marathi is strictly reserved for user chat and documentation.
4. **Bento Workstation Theme:** Canvas `#f4f6fb`, cards `#ffffff`, primary `#0037b0`, active `#059669`, revoke `#dc2626`.

---

## 🚀 RULE 5 — Standalone Packaging & Numbered Checkpoints
1. Record sequential Checkpoints (`ADMIN-CP-001`, `ADMIN-CP-002`...) in `DocMitra-Admin/README_LOCK.md` with Checkpoint ID, Date/Time, and clean working summary.
2. Maintain `DocMitra-Admin.spec` for single-file portable `.exe` compilation.
