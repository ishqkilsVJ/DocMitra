// src/ui/navigation.js
var e = [
	"bg-primary-container",
	"text-on-primary",
	"font-bold",
	"shadow-sm"
], t = [
	"text-on-surface-variant",
	"hover:bg-surface-container-high",
	"hover:text-on-surface"
], n = class {
	constructor() {
		this.currentView = "bulk-renamer", this.views = {
			"bulk-renamer": document.getElementById("view-bulk-renamer"),
			"pdf-studio": document.getElementById("view-pdf-studio"),
			"image-studio": document.getElementById("view-image-studio"),
			"print-studio": document.getElementById("view-print-studio"),
			"follow-up": document.getElementById("view-follow-up")
		}, this.navTabs = document.querySelectorAll(".nav-tab[data-view]");
	}
	init() {
		this._bindTabs(), this._bindKeyboardShortcuts(), this.switchView("bulk-renamer");
	}
	_bindTabs() {
		this.navTabs.forEach((e) => {
			e.addEventListener("click", (t) => {
				t.preventDefault();
				let n = e.getAttribute("data-view");
				n && this.switchView(n);
			});
		});
	}
	_bindKeyboardShortcuts() {
		window.addEventListener("keydown", (e) => {
			e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && (e.key === "0" || e.key === "1" ? (e.preventDefault(), this.switchView("bulk-renamer")) : e.key === "2" ? (e.preventDefault(), this.switchView("pdf-studio")) : e.key === "3" ? (e.preventDefault(), this.switchView("image-studio")) : e.key === "4" ? (e.preventDefault(), this.switchView("print-studio")) : e.key === "5" && (e.preventDefault(), this.switchView("follow-up")));
		});
	}
	switchView(n) {
		if (!this.views[n]) {
			console.warn(`[Navigation] View "${n}" not found.`);
			return;
		}
		let r = this.currentView;
		this.currentView = n, Object.keys(this.views).forEach((e) => {
			let t = this.views[e];
			t && (e === n ? t.classList.remove("hidden") : t.classList.add("hidden"));
		}), this.navTabs.forEach((r) => {
			r.getAttribute("data-view") === n ? (r.classList.remove(...t), r.classList.add(...e)) : (r.classList.remove(...e), r.classList.add(...t));
		}), typeof this.onViewChange == "function" && this.onViewChange(n, r);
	}
}, r = new class {
	constructor() {
		this.container = null, typeof document < "u" && this._ensureContainer();
	}
	_ensureContainer() {
		if (typeof document > "u") return;
		let e = document.getElementById("toast-container");
		e || (e = document.createElement("div"), e.id = "toast-container", e.setAttribute("aria-live", "polite"), document.body.appendChild(e)), this.container = e;
	}
	show(e, t = "Ready to connect", n = "info", r = 3e3) {
		this._ensureContainer();
		let i = document.createElement("div");
		i.className = `toast-item toast-${n}`;
		let a = document.createElement("span");
		a.className = "material-symbols-outlined text-[20px] shrink-0", n === "success" ? (a.textContent = "check_circle", a.classList.add("text-emerald-400")) : n === "warning" ? (a.textContent = "warning", a.classList.add("text-amber-400")) : n === "error" ? (a.textContent = "error", a.classList.add("text-red-400")) : (a.textContent = "info", a.classList.add("text-blue-400")), i.appendChild(a);
		let o = document.createElement("div");
		o.className = "flex flex-col min-w-0";
		let s = document.createElement("span");
		if (s.className = "font-bold font-headline text-white text-[13px] leading-tight truncate", s.textContent = e, o.appendChild(s), t) {
			let e = document.createElement("span");
			e.className = "font-mono text-[11px] text-slate-300 mt-0.5 leading-tight", e.textContent = t, o.appendChild(e);
		}
		i.appendChild(o);
		let c = document.createElement("button");
		c.type = "button", c.className = "ml-auto text-slate-400 hover:text-white transition-colors p-1 flex items-center justify-center", c.setAttribute("aria-label", "Dismiss notification");
		let l = document.createElement("span");
		l.className = "material-symbols-outlined text-[16px]", l.textContent = "close", c.appendChild(l);
		let u = () => {
			i.classList.add("toast-leaving"), setTimeout(() => {
				i.parentNode && i.parentNode.removeChild(i);
			}, 200);
		};
		c.addEventListener("click", (e) => {
			e.stopPropagation(), u();
		}), i.appendChild(c), this.container.appendChild(i), r > 0 && setTimeout(u, r);
	}
}(), i = class {
	constructor() {
		this.overlay = document.getElementById("settings-modal-overlay"), this.modal = document.getElementById("settingsModal"), this.openBtn = document.getElementById("openSettingsBtn"), this.closeBtn = document.getElementById("closeSettingsBtn"), this.subnavBtns = document.querySelectorAll(".settings-subnav-btn"), this.sections = document.querySelectorAll(".settings-section"), this.isOpen = !1;
	}
	init() {
		this._bindOpenClose(), this._bindSubnav(), this._bindModalActions();
	}
	open() {
		this.overlay && (this.overlay.classList.remove("hidden"), this.isOpen = !0, document.body.style.overflow = "hidden");
	}
	close() {
		this.overlay && (this.overlay.classList.add("hidden"), this.isOpen = !1, document.body.style.overflow = "");
	}
	_bindOpenClose() {
		this.openBtn && this.openBtn.addEventListener("click", (e) => {
			e.preventDefault(), this.open();
		}), this.closeBtn && this.closeBtn.addEventListener("click", (e) => {
			e.preventDefault(), this.close();
		}), this.overlay && this.overlay.addEventListener("click", (e) => {
			e.target === this.overlay && this.close();
		}), window.addEventListener("keydown", (e) => {
			e.key === "Escape" && this.isOpen ? (e.preventDefault(), this.close()) : (e.ctrlKey || e.metaKey) && e.key === "," && (e.preventDefault(), this.isOpen ? this.close() : this.open());
		});
	}
	_bindSubnav() {
		let e = [
			"bg-surface-container-lowest",
			"text-primary",
			"font-semibold",
			"shadow-xs",
			"border-l-[3px]",
			"border-primary"
		], t = [
			"text-on-surface-variant",
			"hover:bg-surface-container",
			"hover:text-on-surface"
		];
		this.subnavBtns.forEach((n) => {
			n.addEventListener("click", () => {
				let r = n.getAttribute("data-target-section");
				this.subnavBtns.forEach((n) => {
					n.classList.remove(...e), n.classList.add(...t);
				}), n.classList.remove(...t), n.classList.add(...e), this.sections.forEach((e) => {
					e.id === r ? e.classList.remove("hidden") : e.classList.add("hidden");
				});
			});
		});
	}
	_bindModalActions() {
		let e = document.getElementById("addNewRuleBtn");
		e && e.addEventListener("click", () => {
			this._showAddRulePrompt();
		});
		let t = document.getElementById("saveRulesBtn");
		t && t.addEventListener("click", () => {
			r.show("Settings & Rules Saved", "Configuration saved to local schema store", "success");
		});
		let n = document.getElementById("resetRulesBtn");
		n && n.addEventListener("click", () => {
			r.show("Factory Reset Default", "Ready to connect rule restoration engine", "warning");
		});
		let i = document.getElementById("exportConfigBtn");
		i && i.addEventListener("click", () => {
			r.show("Export Configuration", "Ready to connect JSON export routine", "info");
		});
	}
	_showAddRulePrompt() {
		let e = window.prompt("Enter Canonical Document Label (e.g., GAP CERTIFICATE):", "GAP AFFIDAVIT");
		if (!e || !e.trim()) return;
		let t = (window.prompt("Enter 2-4 letter Shortcut (e.g., GAP):", "GAP") || "DOC").trim(), n = document.getElementById("canonicalRuleRows");
		if (!n) return;
		let i = document.createElement("div");
		i.className = "grid grid-cols-12 items-center px-space-md py-space-sm bg-surface-container-high/40 hover:bg-surface-container-low transition-colors group animate-pulse";
		let a = document.createElement("div");
		a.className = "col-span-1";
		let o = document.createElement("span");
		o.className = "px-2 py-0.5 rounded bg-primary text-on-primary font-mono-code text-[11px] font-bold", o.textContent = "P7", a.appendChild(o), i.appendChild(a);
		let s = document.createElement("div");
		s.className = "col-span-4 flex flex-col pr-space-sm";
		let c = document.createElement("span");
		c.className = "font-label-lg text-label-lg font-bold text-on-surface", c.textContent = e.toUpperCase();
		let l = document.createElement("span");
		l.className = "font-mono-code text-[10px] text-tertiary font-bold", l.textContent = "CUSTOM_RULE_SAVED", s.appendChild(c), s.appendChild(l), i.appendChild(s);
		let u = document.createElement("div");
		u.className = "col-span-2";
		let d = document.createElement("span");
		d.className = "px-2 py-1 bg-surface-container-highest rounded text-on-surface font-mono-code text-[12px] font-bold shadow-2xs", d.textContent = t.toUpperCase(), u.appendChild(d), i.appendChild(u);
		let f = document.createElement("div");
		f.className = "col-span-4 pr-space-sm";
		let p = document.createElement("div");
		p.className = "flex flex-wrap gap-1";
		let m = document.createElement("span");
		m.className = "px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-mono-code text-[11px]", m.textContent = t.toLowerCase(), p.appendChild(m);
		let h = document.createElement("span");
		h.className = "px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-mono-code text-[11px]", h.textContent = "custom_rule", p.appendChild(h), f.appendChild(p), i.appendChild(f);
		let g = document.createElement("div");
		g.className = "col-span-1 flex items-center justify-end";
		let _ = document.createElement("span");
		_.className = "px-2 py-0.5 rounded-full bg-tertiary-container/15 text-tertiary font-label-sm text-[10px] font-bold", _.textContent = "NEW", g.appendChild(_), i.appendChild(g), n.appendChild(i), setTimeout(() => i.classList.remove("animate-pulse"), 1200), r.show(`Rule Added: ${e.toUpperCase()}`, `Shortcut: ${t.toUpperCase()}`, "success");
	}
};
// src/ui/placeholders.js
function a() {
	["[data-action=\"placeholder\"]"].forEach((e) => {
		document.querySelectorAll(e).forEach((e) => {
			e.addEventListener("click", (t) => {
				e.tagName === "A" && e.getAttribute("href") === "#" && t.preventDefault();
				let n = e.getAttribute("data-action-label") || e.getAttribute("title") || e.innerText.trim().split("\n")[0] || "Action";
				r.show(n, "Ready to connect", "info");
			});
		});
	}), document.querySelectorAll(".tool-ribbon-btn").forEach((e) => {
		e.addEventListener("click", (t) => {
			t.preventDefault();
			let n = e.querySelector(".font-label-md")?.textContent?.trim() || "Tool Selected";
			r.show(n, "Ready to connect", "info");
		});
	});
	let e = document.getElementById("zoomDisplay"), t = document.getElementById("pageDisplay"), n = 100, i = 1, a = document.getElementById("btnZoomIn");
	a && a.addEventListener("click", () => {
		if (n < 200) {
			n += 10, e && (e.textContent = `${n}%`);
			let t = document.getElementById("printPreviewStage");
			t && (t.style.transform = `scale(${n / 100})`);
		}
	});
	let o = document.getElementById("btnZoomOut");
	o && o.addEventListener("click", () => {
		if (n > 50) {
			n -= 10, e && (e.textContent = `${n}%`);
			let t = document.getElementById("printPreviewStage");
			t && (t.style.transform = `scale(${n / 100})`);
		}
	});
	let s = document.getElementById("btnZoomReset");
	s && s.addEventListener("click", () => {
		n = 100, e && (e.textContent = "100%");
		let t = document.getElementById("printPreviewStage");
		t && (t.style.transform = "scale(1)");
	});
	let c = document.getElementById("btnPrevPage");
	c && c.addEventListener("click", () => {
		i > 1 && (i--, t && (t.textContent = `Page ${i} of 11`));
	});
	let l = document.getElementById("btnNextPage");
	l && l.addEventListener("click", () => {
		i < 11 && (i++, t && (t.textContent = `Page ${i} of 11`));
	});
	let u = document.getElementById("selectAllCheckbox");
	u && u.addEventListener("change", () => {
		document.querySelectorAll(".student-checkbox").forEach((e) => {
			e.checked = u.checked;
		}), r.show(u.checked ? "Selected All Candidates" : "Deselected Candidates", "Ready to connect batch dispatcher", "info");
	}), document.querySelectorAll(".pan-grab-active").forEach((e) => {
		let t = !1, n, r;
		e.addEventListener("mousedown", (i) => {
			i.target.closest("input, button, select, a, textarea") || (t = !0, e.classList.add("is-dragging"), n = i.pageY - e.offsetTop, r = e.scrollTop);
		}), e.addEventListener("mouseleave", () => {
			t = !1, e.classList.remove("is-dragging");
		}), e.addEventListener("mouseup", () => {
			t = !1, e.classList.remove("is-dragging");
		}), e.addEventListener("mousemove", (i) => {
			if (!t) return;
			i.preventDefault();
			let a = (i.pageY - e.offsetTop - n) * 1.5;
			e.scrollTop = r - a;
		});
	});
}
// src/services/native-bridge-service.js
var o = "http://localhost:3000";
function s() {
	if (typeof window < "u") {
		if (window.__TAURI__?.core?.invoke) return window.__TAURI__.core.invoke;
		if (window.__TAURI_INTERNALS__?.invoke) return window.__TAURI_INTERNALS__.invoke;
	}
	return null;
}
async function c() {
	let e = s();
	if (e) try {
		let t = await e("pick_native_folder");
		return t ? await e("list_native_directory", { path: t }) : {
			success: !1,
			cancelled: !0
		};
	} catch (e) {
		console.warn("[NativeBridge] Tauri pick_native_folder failed, falling back:", e);
	}
	if (typeof window < "u" && typeof window.showDirectoryPicker == "function") try {
		let e = await window.showDirectoryPicker(), t = [], n = [];
		for await (let [r, i] of e.entries()) if (i.kind === "file") {
			let e = await i.getFile();
			e.handle = i, e.url = URL.createObjectURL(e), t.push({
				name: e.name,
				path: e.name,
				size: e.size,
				ext: ("." + e.name.split(".").pop()).toLowerCase(),
				url: e.url,
				fileObj: e
			});
		} else i.kind === "directory" && n.push({
			name: i.name,
			path: i.name,
			handle: i
		});
		return {
			success: !0,
			path: e.name,
			name: e.name,
			subfolders: n,
			files: t
		};
	} catch (e) {
		if (e.name === "AbortError") return {
			success: !1,
			cancelled: !0
		};
		console.warn("[NativeBridge] showDirectoryPicker error, trying backend:", e);
	}
	try {
		let e = new AbortController(), t = setTimeout(() => e.abort(), 6e4), n = await fetch(`${o}/api/native-select-folder`, { signal: e.signal });
		if (clearTimeout(t), n.ok) {
			let e = await n.json();
			if (e.success || e.cancelled) return e;
		}
	} catch (e) {
		console.warn("[NativeBridge] Backend folder picker failed:", e);
	}
	return new Promise((e) => {
		let t = document.getElementById("hiddenFallbackFolderInput");
		t || (t = document.createElement("input"), t.id = "hiddenFallbackFolderInput", t.type = "file", t.webkitdirectory = !0, t.style.display = "none", document.body.appendChild(t)), t.value = "", t.onchange = (t) => {
			let n = Array.from(t.target.files || []);
			if (n.length === 0) return e({
				success: !1,
				cancelled: !0
			});
			let r = n[0].webkitRelativePath ? n[0].webkitRelativePath.split("/")[0] : "Selected Folder";
			e({
				success: !0,
				name: r,
				path: r,
				files: n.map((e) => ({
					name: e.name,
					path: e.webkitRelativePath || e.name,
					size: e.size,
					ext: ("." + e.name.split(".").pop()).toLowerCase(),
					url: URL.createObjectURL(e),
					fileObj: e
				}))
			});
		}, t.click();
	});
}
async function l(e = "All Files (*.*)|*.*", t = "Select Files") {
	let n = s();
	if (n) try {
		return await n("pick_native_files");
	} catch (e) {
		console.warn("[NativeBridge] Tauri pick_native_files failed, falling back:", e);
	}
	if (typeof window < "u" && typeof window.showOpenFilePicker == "function") try {
		let e = await window.showOpenFilePicker({ multiple: !0 }), t = [];
		for (let n of e) {
			let e = await n.getFile();
			e.handle = n, t.push({
				name: e.name,
				path: e.name,
				size: e.size,
				ext: ("." + e.name.split(".").pop()).toLowerCase(),
				url: URL.createObjectURL(e),
				fileObj: e
			});
		}
		return {
			success: !0,
			files: t
		};
	} catch (e) {
		if (e.name === "AbortError") return {
			success: !1,
			cancelled: !0
		};
		console.warn("[NativeBridge] showOpenFilePicker error, trying backend:", e);
	}
	try {
		let n = await fetch(`${o}/api/native-select-files?filter=${encodeURIComponent(e)}&title=${encodeURIComponent(t)}`);
		if (n.ok) {
			let e = await n.json();
			if (e.success || e.cancelled) return e;
		}
	} catch (e) {
		console.warn("[NativeBridge] Backend file picker failed:", e);
	}
	return new Promise((e) => {
		let t = document.getElementById("hiddenFallbackFilesInput");
		t || (t = document.createElement("input"), t.id = "hiddenFallbackFilesInput", t.type = "file", t.multiple = !0, t.style.display = "none", document.body.appendChild(t)), t.value = "", t.onchange = (t) => {
			let n = Array.from(t.target.files || []);
			if (n.length === 0) return e({
				success: !1,
				cancelled: !0
			});
			e({
				success: !0,
				files: n.map((e) => ({
					name: e.name,
					path: e.name,
					size: e.size,
					ext: ("." + e.name.split(".").pop()).toLowerCase(),
					url: URL.createObjectURL(e),
					fileObj: e
				}))
			});
		}, t.click();
	});
}
async function u(e) {
	let t = s();
	if (t) try {
		return await t("list_native_directory", { path: e });
	} catch (e) {
		console.warn("[NativeBridge] Tauri list_native_directory failed, trying backend:", e);
	}
	try {
		let t = await fetch(`${o}/api/list-directory?path=${encodeURIComponent(e)}`);
		return t.ok ? await t.json() : {
			success: !1,
			errorCode: "DM-104",
			error: `Server error: ${t.status}`
		};
	} catch (e) {
		return {
			success: !1,
			errorCode: "DM-104",
			error: e.message
		};
	}
}
async function d(e, t, n = "", r = 0) {
	let i = s();
	if (i) try {
		let a = await i("rename_native_file", {
			oldPath: e,
			old_path: e,
			newName: t,
			new_name: t,
			studentName: n,
			student_name: n,
			rotation: r
		});
		if (a) return {
			success: !!a.success,
			oldPath: a.oldPath || a.old_path || e,
			newPath: a.path || a.newPath || a.new_path,
			path: a.path || a.newPath || a.new_path,
			name: a.newName || a.new_name || t,
			error: a.error
		};
	} catch (e) {
		console.warn("[NativeBridge] Tauri rename_native_file failed, trying backend:", e);
	}
	try {
		let i = await (await fetch(`${o}/api/native-rename`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				oldPath: e,
				newName: t,
				studentName: n,
				rotation: r
			})
		})).json();
		return {
			success: !!i.success,
			oldPath: i.oldPath || e,
			newPath: i.path || i.newPath,
			path: i.path || i.newPath,
			name: i.name || t,
			error: i.error
		};
	} catch (e) {
		return {
			success: !1,
			error: e.message
		};
	}
}
async function f(e, t) {
	let n = s();
	if (n) try {
		let r = await n("rename_native_folder", {
			oldPath: e,
			old_path: e,
			newName: t,
			new_name: t
		});
		if (r) return {
			success: !!r.success,
			oldPath: r.oldPath || r.old_path || e,
			newPath: r.path || r.newPath || r.new_path,
			path: r.path || r.newPath || r.new_path,
			name: r.newName || r.new_name || t,
			error: r.error
		};
	} catch (e) {
		console.warn("[NativeBridge] Tauri rename_native_folder failed, trying fallback:", e);
	}
	return d(e, t);
}
async function p(e, t) {
	try {
		return await (await fetch(`${o}/api/native-rotate-file`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				filePath: e,
				angle: t
			})
		})).json();
	} catch (e) {
		return {
			success: !1,
			error: e.message
		};
	}
}
async function m({ sourcePath: e, targetDir: t, targetName: n = "", studentName: r = "" }) {
	try {
		return await (await fetch(`${o}/api/native-import-file`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				sourcePath: e,
				targetDir: t,
				targetName: n,
				studentName: r
			})
		})).json();
	} catch (e) {
		return {
			success: !1,
			error: e.message
		};
	}
}
async function h(e) {
	let t = s();
	if (t) try {
		return { success: !!await t("open_in_explorer", { path: e }) };
	} catch (e) {
		console.warn("[NativeBridge] Tauri open_in_explorer failed:", e);
	}
	try {
		let t = await fetch(`${o}/api/open-folder?path=${encodeURIComponent(e)}`);
		return t.ok ? await t.json() : {
			success: !1,
			error: `Failed to open Explorer: ${t.status}`
		};
	} catch (e) {
		return {
			success: !1,
			error: e.message
		};
	}
}
// tools/rename_tool/rename_tool_logic.js
var g = {
	PHOTO: "Photo",
	SIGNATURE: "Signature",
	"AADHAAR CARD": "Aadhaar Card",
	"AADHAR CARD": "Aadhaar Card",
	"10TH MARKSHEET": "10th Marksheet",
	"10TH PASSING CERTIFICATE": "10th Passing Certificate",
	"10TH MARKSHEET AND PASSING CERTIFICATE": "10th Marksheet and Passing Certificate",
	"10TH MARKSHEET AND PASSING": "10th Marksheet and Passing Certificate",
	"12TH MARKSHEET": "12th Marksheet",
	"12TH PASSING CERTIFICATE": "12th Passing Certificate",
	"12TH MARKSHEET AND PASSING CERTIFICATE": "12th Marksheet and Passing Certificate",
	"12TH MARKSHEET AND PASSING": "12th Marksheet and Passing Certificate",
	"12TH LC": "12th LC",
	"LEAVING CERTIFICATE": "12th LC",
	"PREVIOUS YEAR MARKSHEET": "Previous Year Marksheet",
	"CASTE CERTIFICATE": "Caste Certificate",
	"CASTE VALIDITY CERTIFICATE": "Caste Validity Certificate",
	"VALIDITY CERTIFICATE": "Caste Validity Certificate",
	"NON CREAMY LAYER CERTIFICATE": "Non Creamy Layer Certificate",
	"INCOME CERTIFICATE": "Income Certificate",
	"DOMICILE CERTIFICATE": "Domicile Certificate",
	"NATIONALITY CERTIFICATE": "Nationality Certificate",
	"RATION CARD": "Ration Card",
	"BANK PASSBOOK": "Bank Passbook",
	"PASSBOOK BANK": "Bank Passbook",
	"CAP ALLOTMENT LETTER": "CAP Allotment Letter",
	"BONAFIDE CERTIFICATE": "Bonafide Certificate",
	"FEE RECEIPT": "Fee Receipt",
	"ADMISSION FEE RECEIPT": "Fee Receipt",
	"ATTENDANCE CERTIFICATE": "Attendance Certificate",
	"HOSTEL CERTIFICATE": "Hostel Certificate",
	"HOSTEL RECEIPT / BONAFIDE": "Hostel Certificate",
	"GAP CERTIFICATE": "Gap Certificate",
	"SELF DECLARATION": "Self Declaration",
	"PARENT DECLARATION": "Parent Declaration",
	"DEATH CERTIFICATE": "Death Certificate",
	"NON HOSTEL DECLARATION": "Non Hostel Declaration",
	"DISABILITY CERTIFICATE": "Disability Certificate",
	"APAAR ID": "APAAR ID",
	"ABC ID": "APAAR ID",
	"CET APPLICATION FORM": "CET Application Form",
	"CET APPLICATION CONFIRMATION": "CET Application Form",
	"CET SCORE CARD": "CET Score Card",
	"CET SCORECARD": "CET Score Card",
	"STATUS RETENTION FORM": "Status Retention Form",
	"EWS CERTIFICATE": "EWS Certificate",
	"MIGRATION CERTIFICATE": "Migration Certificate",
	"MEDICAL FITNESS CERTIFICATE": "Medical Fitness Certificate",
	"BIRTH CERTIFICATE": "Birth Certificate",
	"PAN CARD": "PAN Card",
	"VOTER ID": "Voter ID",
	"DRIVING LICENSE": "Driving License",
	"11TH MARKSHEET": "11th Marksheet",
	"11TH PASSING CERTIFICATE": "11th Passing Certificate",
	"10TH LC": "10th LC",
	"1ST YEAR MARKSHEET": "1st Year Marksheet",
	"2ND YEAR MARKSHEET": "2nd Year Marksheet",
	"3RD YEAR MARKSHEET": "3rd Year Marksheet",
	"4TH YEAR MARKSHEET": "4th Year Marksheet",
	"PASSING CERTIFICATE": "Passing Certificate",
	"DEGREE CERTIFICATE": "Degree Certificate",
	"REGISTRATION CERTIFICATE": "Registration Certificate",
	"INTERNSHIP CERTIFICATE": "Internship Certificate",
	"CHARACTER CERTIFICATE": "Character Certificate",
	"GAZETTE CERTIFICATE": "Gazette Certificate",
	"MINORITY CERTIFICATE": "Minority Certificate",
	"MINORITY DECLARATION": "Minority Certificate",
	"RESIDENTIAL DOCUMENT": "Residential Document",
	"ATTEMPT CERTIFICATE": "Attempt Certificate"
}, _ = {
	marskheet: "marksheet",
	markshet: "marksheet",
	markshit: "marksheet",
	pasing: "passing",
	pasingg: "passing",
	aadhhar: "aadhaar",
	adhar: "aadhaar",
	aadhar: "aadhaar",
	bonafied: "bonafide",
	bonafidee: "bonafide",
	domocile: "domicile",
	pasbook: "passbook",
	pasbok: "passbook",
	incom: "income",
	incme: "income",
	certifcte: "certificate",
	certifcate: "certificate",
	certificte: "certificate",
	certficate: "certificate",
	certifitcate: "certificate",
	atempt: "attempt",
	attmpt: "attempt",
	phot: "photo"
}, v = [
	{
		id: "12th-marksheet-passing-link",
		part1: "12TH MARKSHEET",
		part2: "12TH PASSING CERTIFICATE",
		combined: "12TH MARKSHEET AND PASSING",
		type: "combined"
	},
	{
		id: "10th-marksheet-passing-link",
		part1: "10TH MARKSHEET",
		part2: "10TH PASSING CERTIFICATE",
		combined: "10TH MARKSHEET AND PASSING",
		type: "combined"
	},
	{
		id: "domicile-nationality-link",
		part1: "DOMICILE CERTIFICATE",
		part2: "NATIONALITY CERTIFICATE",
		combined: "DOMICILE AND NATIONALITY CERTIFICATE",
		type: "combined"
	},
	{
		id: "lc-tc-alias",
		part1: "12TH LC",
		part2: "12TH TC",
		combined: "12TH LC",
		type: "alias"
	}
], y = {
	"MAHA DBT": [
		["PHOTO", [
			"photo",
			"pic",
			"passport photo",
			"photograph"
		]],
		["SIGNATURE", [
			"signature",
			"sign",
			"student sign"
		]],
		["AADHAAR CARD", [
			"aadhaar card",
			"aadhar",
			"adhar",
			"uid"
		]],
		["10TH MARKSHEET", [
			"10th marksheet",
			"ssc marksheet",
			"10 mark sheet",
			"10th mark"
		]],
		["10TH PASSING CERTIFICATE", [
			"10th passing certificate",
			"ssc passing",
			"10 passing",
			"10 pasing"
		]],
		["10TH MARKSHEET AND PASSING CERTIFICATE", [
			"10th marksheet and passing certificate",
			"10th combined",
			"ssc marksheet passing"
		]],
		["12TH MARKSHEET", [
			"12th marksheet",
			"hsc marksheet",
			"12 mark sheet"
		]],
		["12TH PASSING CERTIFICATE", [
			"12th passing certificate",
			"hsc passing",
			"12 passing",
			"12 pasing"
		]],
		["12TH MARKSHEET AND PASSING CERTIFICATE", [
			"12th marksheet and passing certificate",
			"12th combined",
			"hsc marksheet passing"
		]],
		["12TH LC", [
			"12th lc",
			"12 lc",
			"12 l",
			"leaving certificate",
			"school leaving",
			"tc",
			"transfer certificate"
		]],
		["PREVIOUS YEAR MARKSHEET", [
			"previous year marksheet",
			"last exam marksheet",
			"prev marksheet"
		]],
		["CASTE CERTIFICATE", [
			"caste certificate",
			"cast",
			"jati pramanpatra"
		]],
		["CASTE VALIDITY CERTIFICATE", [
			"caste validity certificate",
			"validity",
			"cvc",
			"tribe validity"
		]],
		["NON CREAMY LAYER CERTIFICATE", [
			"non creamy layer",
			"ncl",
			"non criminal",
			"non-creamy"
		]],
		["INCOME CERTIFICATE", [
			"income certificate",
			"utpanna dakhla",
			"tahsildar income",
			"form 16"
		]],
		["DOMICILE CERTIFICATE", [
			"domicile certificate",
			"adhiwas",
			"maharashtra domicile"
		]],
		["NATIONALITY CERTIFICATE", [
			"nationality certificate",
			"rashtriyatva",
			"nationality proof"
		]],
		["RATION CARD", ["ration card", "shidha patrika"]],
		["BANK PASSBOOK", [
			"bank passbook",
			"passbook",
			"bank account",
			"npci seeded"
		]],
		["CAP ALLOTMENT LETTER", [
			"cap allotment letter",
			"admission confirmation letter",
			"allotment"
		]],
		["BONAFIDE CERTIFICATE", [
			"bonafide certificate",
			"bonafide",
			"college bonafide"
		]],
		["FEE RECEIPT", [
			"fee receipt",
			"admission fee receipt",
			"tuition fee"
		]],
		["ATTENDANCE CERTIFICATE", ["attendance certificate", "college attendance"]],
		["HOSTEL CERTIFICATE", [
			"hostel certificate",
			"rent agreement",
			"private hostel proof"
		]],
		["GAP CERTIFICATE", [
			"gap certificate",
			"educational gap",
			"gap affidavit"
		]],
		["SELF DECLARATION", [
			"self declaration",
			"swayam ghoshnapatra",
			"declaration"
		]],
		["PARENT DECLARATION", [
			"parent declaration",
			"hamipatra",
			"father declaration"
		]],
		["DEATH CERTIFICATE", [
			"death certificate",
			"father death certificate",
			"mrutyu pramanpatra"
		]]
	],
	"SWAYAM DEENDAYAL YOJANA": [
		["PHOTO", [
			"photo",
			"pic",
			"passport photo",
			"photograph"
		]],
		["SIGNATURE", [
			"signature",
			"sign",
			"student sign"
		]],
		["AADHAAR CARD", [
			"aadhaar card",
			"aadhar",
			"adhar",
			"uid"
		]],
		["10TH MARKSHEET", [
			"10th marksheet",
			"ssc marksheet",
			"10 mark sheet",
			"10th mark"
		]],
		["10TH MARKSHEET AND PASSING CERTIFICATE", [
			"10th marksheet and passing certificate",
			"10th combined",
			"ssc marksheet passing"
		]],
		["12TH MARKSHEET", [
			"12th marksheet",
			"hsc marksheet",
			"12 mark sheet"
		]],
		["12TH MARKSHEET AND PASSING CERTIFICATE", [
			"12th marksheet and passing certificate",
			"12th combined",
			"hsc marksheet passing"
		]],
		["12TH LC", [
			"12th lc",
			"12 lc",
			"12 l",
			"leaving certificate",
			"school leaving",
			"tc",
			"transfer certificate"
		]],
		["PREVIOUS YEAR MARKSHEET", [
			"previous year marksheet",
			"last exam marksheet",
			"prev marksheet"
		]],
		["CASTE CERTIFICATE", [
			"caste certificate",
			"cast",
			"jati pramanpatra"
		]],
		["CASTE VALIDITY CERTIFICATE", [
			"caste validity certificate",
			"validity",
			"cvc",
			"tribe validity"
		]],
		["DOMICILE CERTIFICATE", [
			"domicile certificate",
			"adhiwas",
			"maharashtra domicile"
		]],
		["INCOME CERTIFICATE", [
			"income certificate",
			"utpanna dakhla",
			"tahsildar income",
			"form 16"
		]],
		["BANK PASSBOOK", [
			"bank passbook",
			"passbook",
			"bank account",
			"npci seeded"
		]],
		["BONAFIDE CERTIFICATE", [
			"bonafide certificate",
			"bonafide",
			"college bonafide"
		]],
		["CAP ALLOTMENT LETTER", [
			"cap allotment letter",
			"admission confirmation letter",
			"allotment"
		]],
		["ATTENDANCE CERTIFICATE", ["attendance certificate", "college attendance"]],
		["HOSTEL CERTIFICATE", [
			"hostel certificate",
			"rent agreement",
			"private hostel proof"
		]],
		["NON HOSTEL DECLARATION", [
			"non hostel declaration",
			"government hostel non allotment",
			"warden letter"
		]],
		["SELF DECLARATION", [
			"self declaration",
			"swayam ghoshnapatra",
			"declaration"
		]],
		["PARENT DECLARATION", [
			"parent declaration",
			"hamipatra",
			"father declaration"
		]],
		["DISABILITY CERTIFICATE", [
			"disability certificate",
			"divyang",
			"pwd certificate",
			"udid"
		]]
	],
	"CET CELL": [
		["PHOTO", [
			"photo",
			"pic",
			"passport photo",
			"photograph"
		]],
		["SIGNATURE", [
			"signature",
			"sign",
			"student sign"
		]],
		["AADHAAR CARD", [
			"aadhaar card",
			"aadhar",
			"adhar",
			"uid"
		]],
		["APAAR ID", [
			"apaar id",
			"abc id",
			"academic bank of credits"
		]],
		["CET APPLICATION FORM", [
			"cet application form",
			"cet application confirmation",
			"cap registration form"
		]],
		["CET SCORE CARD", [
			"cet score card",
			"cet result",
			"scorecard",
			"neet score card"
		]],
		["CAP ALLOTMENT LETTER", [
			"cap allotment letter",
			"admission confirmation letter",
			"allotment"
		]],
		["STATUS RETENTION FORM", [
			"status retention form",
			"retention form",
			"cet retention"
		]],
		["10TH MARKSHEET", [
			"10th marksheet",
			"ssc marksheet",
			"10 mark sheet",
			"10th mark"
		]],
		["10TH PASSING CERTIFICATE", [
			"10th passing certificate",
			"ssc passing",
			"10 passing",
			"10 pasing"
		]],
		["10TH MARKSHEET AND PASSING CERTIFICATE", [
			"10th marksheet and passing certificate",
			"10th combined",
			"ssc marksheet passing"
		]],
		["12TH MARKSHEET", [
			"12th marksheet",
			"hsc marksheet",
			"12 mark sheet"
		]],
		["12TH PASSING CERTIFICATE", [
			"12th passing certificate",
			"hsc passing",
			"12 passing",
			"12 pasing"
		]],
		["12TH MARKSHEET AND PASSING CERTIFICATE", [
			"12th marksheet and passing certificate",
			"12th combined",
			"hsc marksheet passing"
		]],
		["12TH LC", [
			"12th lc",
			"12 lc",
			"12 l",
			"leaving certificate",
			"school leaving",
			"tc",
			"transfer certificate"
		]],
		["DOMICILE CERTIFICATE", [
			"domicile certificate",
			"adhiwas",
			"maharashtra domicile"
		]],
		["NATIONALITY CERTIFICATE", [
			"nationality certificate",
			"rashtriyatva",
			"nationality proof"
		]],
		["CASTE CERTIFICATE", [
			"caste certificate",
			"cast",
			"jati pramanpatra"
		]],
		["CASTE VALIDITY CERTIFICATE", [
			"caste validity certificate",
			"validity",
			"cvc",
			"tribe validity"
		]],
		["NON CREAMY LAYER CERTIFICATE", [
			"non creamy layer",
			"ncl",
			"non criminal",
			"non-creamy"
		]],
		["EWS CERTIFICATE", ["ews certificate", "economically weaker section"]],
		["INCOME CERTIFICATE", [
			"income certificate",
			"utpanna dakhla",
			"tahsildar income",
			"form 16"
		]],
		["GAP CERTIFICATE", [
			"gap certificate",
			"educational gap",
			"gap affidavit"
		]],
		["MIGRATION CERTIFICATE", ["migration certificate", "migration"]],
		["MEDICAL FITNESS CERTIFICATE", [
			"medical fitness certificate",
			"fitness certificate",
			"health certificate"
		]],
		["BIRTH CERTIFICATE", [
			"birth certificate",
			"janma dakhla",
			"dob proof"
		]]
	],
	"EDUCATIONAL DOCUMENTS": [
		["PHOTO", [
			"photo",
			"pic",
			"passport photo",
			"photograph"
		]],
		["SIGNATURE", [
			"signature",
			"sign",
			"student sign"
		]],
		["AADHAAR CARD", [
			"aadhaar card",
			"aadhar",
			"adhar",
			"uid"
		]],
		["10TH MARKSHEET", [
			"10th marksheet",
			"ssc marksheet",
			"10 mark sheet",
			"10th mark"
		]],
		["10TH PASSING CERTIFICATE", [
			"10th passing certificate",
			"ssc passing",
			"10 passing",
			"10 pasing"
		]],
		["10TH MARKSHEET AND PASSING CERTIFICATE", [
			"10th marksheet and passing certificate",
			"10th combined",
			"ssc marksheet passing"
		]],
		["12TH MARKSHEET", [
			"12th marksheet",
			"hsc marksheet",
			"12 mark sheet"
		]],
		["12TH PASSING CERTIFICATE", [
			"12th passing certificate",
			"hsc passing",
			"12 passing",
			"12 pasing"
		]],
		["12TH MARKSHEET AND PASSING CERTIFICATE", [
			"12th marksheet and passing certificate",
			"12th combined",
			"hsc marksheet passing"
		]],
		["12TH LC", [
			"12th lc",
			"12 lc",
			"12 l",
			"leaving certificate",
			"school leaving",
			"tc",
			"transfer certificate"
		]],
		["PREVIOUS YEAR MARKSHEET", [
			"previous year marksheet",
			"last exam marksheet",
			"prev marksheet"
		]],
		["CASTE CERTIFICATE", [
			"caste certificate",
			"cast",
			"jati pramanpatra"
		]],
		["CASTE VALIDITY CERTIFICATE", [
			"caste validity certificate",
			"validity",
			"cvc",
			"tribe validity"
		]],
		["NON CREAMY LAYER CERTIFICATE", [
			"non creamy layer",
			"ncl",
			"non criminal",
			"non-creamy"
		]],
		["INCOME CERTIFICATE", [
			"income certificate",
			"utpanna dakhla",
			"tahsildar income",
			"form 16"
		]],
		["DOMICILE CERTIFICATE", [
			"domicile certificate",
			"adhiwas",
			"maharashtra domicile"
		]],
		["NATIONALITY CERTIFICATE", [
			"nationality certificate",
			"rashtriyatva",
			"nationality proof"
		]],
		["RATION CARD", ["ration card", "shidha patrika"]],
		["BANK PASSBOOK", [
			"bank passbook",
			"passbook",
			"bank account",
			"npci seeded"
		]],
		["CAP ALLOTMENT LETTER", [
			"cap allotment letter",
			"admission confirmation letter",
			"allotment"
		]],
		["BONAFIDE CERTIFICATE", [
			"bonafide certificate",
			"bonafide",
			"college bonafide"
		]],
		["FEE RECEIPT", [
			"fee receipt",
			"admission fee receipt",
			"tuition fee"
		]],
		["ATTENDANCE CERTIFICATE", ["attendance certificate", "college attendance"]],
		["HOSTEL CERTIFICATE", [
			"hostel certificate",
			"rent agreement",
			"private hostel proof"
		]],
		["GAP CERTIFICATE", [
			"gap certificate",
			"educational gap",
			"gap affidavit"
		]],
		["SELF DECLARATION", [
			"self declaration",
			"swayam ghoshnapatra",
			"declaration"
		]],
		["PARENT DECLARATION", [
			"parent declaration",
			"hamipatra",
			"father declaration"
		]],
		["DEATH CERTIFICATE", [
			"death certificate",
			"father death certificate",
			"mrutyu pramanpatra"
		]],
		["NON HOSTEL DECLARATION", [
			"non hostel declaration",
			"government hostel non allotment",
			"warden letter"
		]],
		["DISABILITY CERTIFICATE", [
			"disability certificate",
			"divyang",
			"pwd certificate",
			"udid"
		]],
		["APAAR ID", [
			"apaar id",
			"abc id",
			"academic bank of credits"
		]],
		["CET APPLICATION FORM", [
			"cet application form",
			"cet application confirmation",
			"cap registration form"
		]],
		["CET SCORE CARD", [
			"cet score card",
			"cet result",
			"scorecard",
			"neet score card"
		]],
		["STATUS RETENTION FORM", [
			"status retention form",
			"retention form",
			"cet retention"
		]],
		["EWS CERTIFICATE", ["ews certificate", "economically weaker section"]],
		["MIGRATION CERTIFICATE", ["migration certificate", "migration"]],
		["MEDICAL FITNESS CERTIFICATE", [
			"medical fitness certificate",
			"fitness certificate",
			"health certificate"
		]],
		["BIRTH CERTIFICATE", [
			"birth certificate",
			"janma dakhla",
			"dob proof"
		]],
		["PAN CARD", ["pan card", "permanent account number"]],
		["VOTER ID", [
			"voter id",
			"election card",
			"epic"
		]],
		["DRIVING LICENSE", [
			"driving license",
			"dl",
			"licence"
		]],
		["11TH MARKSHEET", ["11th marksheet", "11th mark"]],
		["1ST YEAR MARKSHEET", [
			"1st year marksheet",
			"first year marksheet",
			"fy marksheet",
			"sem 1",
			"sem 2"
		]],
		["2ND YEAR MARKSHEET", [
			"2nd year marksheet",
			"second year marksheet",
			"sy marksheet",
			"sem 3",
			"sem 4"
		]],
		["3RD YEAR MARKSHEET", [
			"3rd year marksheet",
			"third year marksheet",
			"ty marksheet",
			"sem 5",
			"sem 6"
		]],
		["4TH YEAR MARKSHEET", [
			"4th year marksheet",
			"fourth year marksheet",
			"final year marksheet"
		]],
		["PASSING CERTIFICATE", [
			"passing certificate",
			"degree passing",
			"diploma passing",
			"provisional certificate"
		]],
		["DEGREE CERTIFICATE", [
			"degree certificate",
			"convocation certificate",
			"diploma certificate"
		]],
		["REGISTRATION CERTIFICATE", [
			"registration certificate",
			"council registration",
			"mnc registration",
			"nursing registration"
		]],
		["INTERNSHIP CERTIFICATE", [
			"internship certificate",
			"internship completion",
			"clinical experience"
		]],
		["CHARACTER CERTIFICATE", [
			"character certificate",
			"conduct certificate",
			"charitra dakhla"
		]],
		["GAZETTE CERTIFICATE", [
			"gazette certificate",
			"name change gazette",
			"rajpatra",
			"marriage certificate"
		]],
		["MINORITY CERTIFICATE", [
			"minority certificate",
			"minority declaration",
			"alpsankhyank pramanpatra",
			"minority proof"
		]]
	]
};
y["MAHA DBT FORM"] = y["MAHA DBT"], y.SWAYAM = y["SWAYAM DEENDAYAL YOJANA"], y["SWAYAM FORM"] = y["SWAYAM DEENDAYAL YOJANA"], y.EDUCATIONAL = y["EDUCATIONAL DOCUMENTS"];
var b = [
	{
		id: "photo",
		displayName: "PHOTO",
		primaryShortcut: "PIC",
		alternateKeywords: [
			"photo",
			"pic",
			"passport photo",
			"photograph"
		],
		outputName: "PHOTO"
	},
	{
		id: "signature",
		displayName: "Signature",
		primaryShortcut: "SIG",
		alternateKeywords: [
			"signature",
			"sign",
			"student sign"
		],
		outputName: "SIGNATURE"
	},
	{
		id: "aadhaar-card",
		displayName: "Aadhaar Card",
		primaryShortcut: "ADR",
		alternateKeywords: [
			"aadhaar card",
			"aadhar",
			"adhar",
			"uid"
		],
		outputName: "AADHAAR CARD"
	},
	{
		id: "10th-marksheet",
		displayName: "10th Marksheet",
		primaryShortcut: "10M",
		alternateKeywords: [
			"10th marksheet",
			"ssc marksheet",
			"10 mark sheet",
			"10th mark"
		],
		outputName: "10TH MARKSHEET"
	},
	{
		id: "10th-passing",
		displayName: "10th Passing Certificate",
		primaryShortcut: "10P",
		alternateKeywords: [
			"10th passing certificate",
			"ssc passing",
			"10 passing",
			"10 pasing"
		],
		outputName: "10TH PASSING CERTIFICATE"
	},
	{
		id: "10th-marksheet-passing",
		displayName: "10th Marksheet & Passing",
		primaryShortcut: "10MP",
		alternateKeywords: [
			"10th marksheet and passing certificate",
			"10th combined",
			"ssc marksheet passing"
		],
		outputName: "10TH MARKSHEET AND PASSING CERTIFICATE"
	},
	{
		id: "12th-marksheet",
		displayName: "12th Marksheet",
		primaryShortcut: "12M",
		alternateKeywords: [
			"12th marksheet",
			"hsc marksheet",
			"12 mark sheet"
		],
		outputName: "12TH MARKSHEET"
	},
	{
		id: "12th-passing",
		displayName: "12th Passing Certificate",
		primaryShortcut: "12P",
		alternateKeywords: [
			"12th passing certificate",
			"hsc passing",
			"12 passing",
			"12 pasing"
		],
		outputName: "12TH PASSING CERTIFICATE"
	},
	{
		id: "12th-marksheet-passing",
		displayName: "12th Marksheet & Passing",
		primaryShortcut: "12MP",
		alternateKeywords: [
			"12th marksheet and passing certificate",
			"12th combined",
			"hsc marksheet passing"
		],
		outputName: "12TH MARKSHEET AND PASSING CERTIFICATE"
	},
	{
		id: "12th-lc",
		displayName: "12th LC",
		primaryShortcut: "12LC",
		alternateKeywords: [
			"12th lc",
			"12 lc",
			"12 l",
			"leaving certificate",
			"school leaving",
			"tc",
			"transfer certificate"
		],
		outputName: "12TH LC"
	},
	{
		id: "previous-year-marksheet",
		displayName: "Previous Year Marksheet",
		primaryShortcut: "PYM",
		alternateKeywords: [
			"previous year marksheet",
			"last exam marksheet",
			"prev marksheet"
		],
		outputName: "PREVIOUS YEAR MARKSHEET"
	},
	{
		id: "caste-certificate",
		displayName: "Caste Certificate",
		primaryShortcut: "CST",
		alternateKeywords: [
			"caste certificate",
			"cast",
			"jati pramanpatra"
		],
		outputName: "CASTE CERTIFICATE"
	},
	{
		id: "caste-validity",
		displayName: "Caste Validity Certificate",
		primaryShortcut: "VAL",
		alternateKeywords: [
			"caste validity certificate",
			"validity",
			"cvc",
			"tribe validity"
		],
		outputName: "CASTE VALIDITY CERTIFICATE"
	},
	{
		id: "non-creamy-layer",
		displayName: "Non Creamy Layer Certificate",
		primaryShortcut: "NCL",
		alternateKeywords: [
			"non creamy layer",
			"ncl",
			"non criminal",
			"non-creamy"
		],
		outputName: "NON CREAMY LAYER CERTIFICATE"
	},
	{
		id: "income-certificate",
		displayName: "Income Certificate",
		primaryShortcut: "INC",
		alternateKeywords: [
			"income certificate",
			"utpanna dakhla",
			"tahsildar income",
			"form 16"
		],
		outputName: "INCOME CERTIFICATE"
	},
	{
		id: "domicile-certificate",
		displayName: "Domicile Certificate",
		primaryShortcut: "DOM",
		alternateKeywords: [
			"domicile certificate",
			"adhiwas",
			"maharashtra domicile"
		],
		outputName: "DOMICILE CERTIFICATE"
	},
	{
		id: "nationality-certificate",
		displayName: "Nationality Certificate",
		primaryShortcut: "NAT",
		alternateKeywords: [
			"nationality certificate",
			"rashtriyatva",
			"nationality proof"
		],
		outputName: "NATIONALITY CERTIFICATE"
	},
	{
		id: "ration-card",
		displayName: "Ration Card",
		primaryShortcut: "RAT",
		alternateKeywords: ["ration card", "shidha patrika"],
		outputName: "RATION CARD"
	},
	{
		id: "bank-passbook",
		displayName: "Bank Passbook",
		primaryShortcut: "BNK",
		alternateKeywords: [
			"bank passbook",
			"passbook",
			"bank account",
			"npci seeded"
		],
		outputName: "BANK PASSBOOK"
	},
	{
		id: "cap-allotment",
		displayName: "CAP Allotment Letter",
		primaryShortcut: "CAP",
		alternateKeywords: [
			"cap allotment letter",
			"admission confirmation letter",
			"allotment"
		],
		outputName: "CAP ALLOTMENT LETTER"
	},
	{
		id: "bonafide-certificate",
		displayName: "Bonafide Certificate",
		primaryShortcut: "BON",
		alternateKeywords: [
			"bonafide certificate",
			"bonafide",
			"college bonafide"
		],
		outputName: "BONAFIDE CERTIFICATE"
	},
	{
		id: "fee-receipt",
		displayName: "Fee Receipt",
		primaryShortcut: "FEE",
		alternateKeywords: [
			"fee receipt",
			"admission fee receipt",
			"tuition fee"
		],
		outputName: "FEE RECEIPT"
	},
	{
		id: "attendance-certificate",
		displayName: "Attendance Certificate",
		primaryShortcut: "ATT",
		alternateKeywords: ["attendance certificate", "college attendance"],
		outputName: "ATTENDANCE CERTIFICATE"
	},
	{
		id: "hostel-certificate",
		displayName: "Hostel Certificate",
		primaryShortcut: "HST",
		alternateKeywords: [
			"hostel certificate",
			"rent agreement",
			"private hostel proof"
		],
		outputName: "HOSTEL CERTIFICATE"
	},
	{
		id: "gap-certificate",
		displayName: "Gap Certificate",
		primaryShortcut: "GAP",
		alternateKeywords: [
			"gap certificate",
			"educational gap",
			"gap affidavit"
		],
		outputName: "GAP CERTIFICATE"
	},
	{
		id: "self-declaration",
		displayName: "Self Declaration",
		primaryShortcut: "SDC",
		alternateKeywords: [
			"self declaration",
			"swayam ghoshnapatra",
			"declaration"
		],
		outputName: "SELF DECLARATION"
	},
	{
		id: "parent-declaration",
		displayName: "Parent Declaration",
		primaryShortcut: "PDC",
		alternateKeywords: [
			"parent declaration",
			"hamipatra",
			"father declaration"
		],
		outputName: "PARENT DECLARATION"
	},
	{
		id: "death-certificate",
		displayName: "Death Certificate",
		primaryShortcut: "DTH",
		alternateKeywords: [
			"death certificate",
			"father death certificate",
			"mrutyu pramanpatra"
		],
		outputName: "DEATH CERTIFICATE"
	},
	{
		id: "non-hostel-declaration",
		displayName: "Non Hostel Declaration",
		primaryShortcut: "NHC",
		alternateKeywords: [
			"non hostel declaration",
			"government hostel non allotment",
			"warden letter"
		],
		outputName: "NON HOSTEL DECLARATION"
	},
	{
		id: "disability-certificate",
		displayName: "Disability Certificate",
		primaryShortcut: "DIS",
		alternateKeywords: [
			"disability certificate",
			"divyang",
			"pwd certificate",
			"udid"
		],
		outputName: "DISABILITY CERTIFICATE"
	},
	{
		id: "apaar-id",
		displayName: "APAAR ID",
		primaryShortcut: "APR",
		alternateKeywords: [
			"apaar id",
			"abc id",
			"academic bank of credits"
		],
		outputName: "APAAR ID"
	},
	{
		id: "cet-application-form",
		displayName: "CET Application Form",
		primaryShortcut: "CETAF",
		alternateKeywords: [
			"cet application form",
			"cet application confirmation",
			"cap registration form"
		],
		outputName: "CET APPLICATION FORM"
	},
	{
		id: "cet-score-card",
		displayName: "CET Score Card",
		primaryShortcut: "CETSC",
		alternateKeywords: [
			"cet score card",
			"cet result",
			"scorecard",
			"neet score card"
		],
		outputName: "CET SCORE CARD"
	},
	{
		id: "status-retention-form",
		displayName: "Status Retention Form",
		primaryShortcut: "SRF",
		alternateKeywords: [
			"status retention form",
			"retention form",
			"cet retention"
		],
		outputName: "STATUS RETENTION FORM"
	},
	{
		id: "ews-certificate",
		displayName: "EWS Certificate",
		primaryShortcut: "EWS",
		alternateKeywords: ["ews certificate", "economically weaker section"],
		outputName: "EWS CERTIFICATE"
	},
	{
		id: "migration-certificate",
		displayName: "Migration Certificate",
		primaryShortcut: "MIG",
		alternateKeywords: ["migration certificate", "migration"],
		outputName: "MIGRATION CERTIFICATE"
	},
	{
		id: "medical-fitness",
		displayName: "Medical Fitness Certificate",
		primaryShortcut: "MED",
		alternateKeywords: [
			"medical fitness certificate",
			"fitness certificate",
			"health certificate"
		],
		outputName: "MEDICAL FITNESS CERTIFICATE"
	},
	{
		id: "birth-certificate",
		displayName: "Birth Certificate",
		primaryShortcut: "BRT",
		alternateKeywords: [
			"birth certificate",
			"janma dakhla",
			"dob proof"
		],
		outputName: "BIRTH CERTIFICATE"
	},
	{
		id: "pan-card",
		displayName: "PAN Card",
		primaryShortcut: "PAN",
		alternateKeywords: ["pan card", "permanent account number"],
		outputName: "PAN CARD"
	},
	{
		id: "voter-id",
		displayName: "Voter ID",
		primaryShortcut: "VOT",
		alternateKeywords: [
			"voter id",
			"election card",
			"epic"
		],
		outputName: "VOTER ID"
	},
	{
		id: "driving-license",
		displayName: "Driving License",
		primaryShortcut: "DL",
		alternateKeywords: [
			"driving license",
			"dl",
			"licence"
		],
		outputName: "DRIVING LICENSE"
	},
	{
		id: "11th-marksheet",
		displayName: "11th Marksheet",
		primaryShortcut: "11M",
		alternateKeywords: ["11th marksheet", "11th mark"],
		outputName: "11TH MARKSHEET"
	},
	{
		id: "1st-year-marksheet",
		displayName: "1st Year Marksheet",
		primaryShortcut: "1YM",
		alternateKeywords: [
			"1st year marksheet",
			"first year marksheet",
			"fy marksheet",
			"sem 1",
			"sem 2"
		],
		outputName: "1ST YEAR MARKSHEET"
	},
	{
		id: "2nd-year-marksheet",
		displayName: "2nd Year Marksheet",
		primaryShortcut: "2YM",
		alternateKeywords: [
			"2nd year marksheet",
			"second year marksheet",
			"sy marksheet",
			"sem 3",
			"sem 4"
		],
		outputName: "2ND YEAR MARKSHEET"
	},
	{
		id: "3rd-year-marksheet",
		displayName: "3rd Year Marksheet",
		primaryShortcut: "3YM",
		alternateKeywords: [
			"3rd year marksheet",
			"third year marksheet",
			"ty marksheet",
			"sem 5",
			"sem 6"
		],
		outputName: "3RD YEAR MARKSHEET"
	},
	{
		id: "4th-year-marksheet",
		displayName: "4th Year Marksheet",
		primaryShortcut: "4YM",
		alternateKeywords: [
			"4th year marksheet",
			"fourth year marksheet",
			"final year marksheet"
		],
		outputName: "4TH YEAR MARKSHEET"
	},
	{
		id: "passing-certificate",
		displayName: "Passing Certificate",
		primaryShortcut: "DPC",
		alternateKeywords: [
			"passing certificate",
			"degree passing",
			"diploma passing",
			"provisional certificate"
		],
		outputName: "PASSING CERTIFICATE"
	},
	{
		id: "degree-certificate",
		displayName: "Degree Certificate",
		primaryShortcut: "DEG",
		alternateKeywords: [
			"degree certificate",
			"convocation certificate",
			"diploma certificate"
		],
		outputName: "DEGREE CERTIFICATE"
	},
	{
		id: "registration-certificate",
		displayName: "Registration Certificate",
		primaryShortcut: "REG",
		alternateKeywords: [
			"registration certificate",
			"council registration",
			"mnc registration",
			"nursing registration"
		],
		outputName: "REGISTRATION CERTIFICATE"
	},
	{
		id: "internship-certificate",
		displayName: "Internship Certificate",
		primaryShortcut: "INT",
		alternateKeywords: [
			"internship certificate",
			"internship completion",
			"clinical experience"
		],
		outputName: "INTERNSHIP CERTIFICATE"
	},
	{
		id: "character-certificate",
		displayName: "Character Certificate",
		primaryShortcut: "CHR",
		alternateKeywords: [
			"character certificate",
			"conduct certificate",
			"charitra dakhla"
		],
		outputName: "CHARACTER CERTIFICATE"
	},
	{
		id: "gazette-certificate",
		displayName: "Gazette Certificate",
		primaryShortcut: "GAZ",
		alternateKeywords: [
			"gazette certificate",
			"name change gazette",
			"rajpatra",
			"marriage certificate"
		],
		outputName: "GAZETTE CERTIFICATE"
	},
	{
		id: "minority-certificate",
		displayName: "Minority Certificate",
		primaryShortcut: "MIN",
		alternateKeywords: [
			"minority certificate",
			"minority declaration",
			"alpsankhyank pramanpatra",
			"minority proof"
		],
		outputName: "MINORITY CERTIFICATE"
	}
];
function x(e = null) {
	return e ? b.map((t) => {
		let n = e[t.outputName];
		return n && Array.isArray(n) && n.length > 0 ? {
			...t,
			primaryShortcut: n[0].toUpperCase(),
			alternateKeywords: n.slice(1)
		} : t;
	}) : b;
}
function S(e, t = null) {
	if (!e || typeof e != "string") return null;
	let n = e.toLowerCase().trim();
	if (!n) return null;
	let r = n.replace(/\s+/g, ""), i = x(t);
	for (let e of i) {
		let t = e.primaryShortcut.toLowerCase();
		if (n === t || r.length >= 2 && r.length <= 6 && r === t) return e.outputName;
	}
	for (let e of i) if (e.alternateKeywords) for (let t of e.alternateKeywords) {
		let i = t.toLowerCase().trim(), a = i.replace(/\s+/g, "");
		if (n === i || r.length >= 2 && r === a) return e.outputName;
	}
	for (let e of i) {
		let t = e.primaryShortcut.toLowerCase(), i = RegExp(`(^|[^a-z0-9])${t}([^a-z0-9]|$)`, "i");
		if (i.test(n) || r.length >= 2 && r.length <= 6 && i.test(r)) return e.outputName;
		if (e.alternateKeywords) for (let t of e.alternateKeywords) {
			let r = t.toLowerCase().trim();
			if (RegExp(`(^|[^a-z0-9])${r}([^a-z0-9]|$)`, "i").test(n)) return e.outputName;
		}
	}
	return null;
}
var C = [
	{
		id: "12th-marksheet-passing-combined",
		outputName: "12TH MARKSHEET AND PASSING",
		shortcut: "12MP",
		patterns: [
			/\b12mp\b/i,
			/\b12tmp\b/i,
			/\b12(th)?\s*(mark|marksheet).*(pass|passing)\b/i,
			/\b12(th)?\s*(pass|passing).*(mark|marksheet)\b/i,
			/\b12(th)?\s*combined\b/i
		]
	},
	{
		id: "10th-marksheet-passing-combined",
		outputName: "10TH MARKSHEET AND PASSING",
		shortcut: "10MP",
		patterns: [
			/\b10mp\b/i,
			/\b10tmp\b/i,
			/\b10(th)?\s*(mark|marksheet).*(pass|passing)\b/i,
			/\b10(th)?\s*(pass|passing).*(mark|marksheet)\b/i,
			/\b10(th)?\s*combined\b/i
		]
	},
	{
		id: "12th-lc",
		outputName: "12TH LC",
		shortcut: "12LC",
		patterns: [
			/\b12lc\b/i,
			/\b12(th)?\s*lc\b/i,
			/\b12(th)?\s*leaving\b/i,
			/\b12(th)?\s*tc\b/i,
			/\bhsc\s*lc\b/i,
			/\bhsc\s*leaving\b/i
		]
	},
	{
		id: "12th-marksheet",
		outputName: "12TH MARKSHEET",
		shortcut: "12M",
		patterns: [
			/\b12m\b/i,
			/\b12(th)?\s*(mark|marksheet|mark-sheet|marks|scorecard)\b/i,
			/\bhsc\s*(mark|marksheet|mark-sheet)\b/i
		]
	},
	{
		id: "12th-passing",
		outputName: "12TH PASSING CERTIFICATE",
		shortcut: "12P",
		patterns: [
			/\b12p\b/i,
			/\b12(th)?\s*(pass|passing|board|sanad)\b/i,
			/\bhsc\s*(pass|passing|board|sanad)\b/i
		]
	},
	{
		id: "10th-lc",
		outputName: "10TH LC",
		shortcut: "10LC",
		patterns: [
			/\b10lc\b/i,
			/\b10(th)?\s*lc\b/i,
			/\b10(th)?\s*leaving\b/i,
			/\b10(th)?\s*tc\b/i,
			/\bssc\s*lc\b/i,
			/\bssc\s*leaving\b/i
		]
	},
	{
		id: "10th-marksheet",
		outputName: "10TH MARKSHEET",
		shortcut: "10M",
		patterns: [
			/\b10m\b/i,
			/\b10(th)?\s*(mark|marksheet|mark-sheet|marks|scorecard)\b/i,
			/\bssc\s*(mark|marksheet|mark-sheet)\b/i
		]
	},
	{
		id: "10th-passing",
		outputName: "10TH PASSING CERTIFICATE",
		shortcut: "10P",
		patterns: [
			/\b10p\b/i,
			/\b10(th)?\s*(pass|passing|board|sanad)\b/i,
			/\bssc\s*(pass|passing|board|sanad)\b/i
		]
	},
	{
		id: "aadhaar-card",
		outputName: "AADHAAR CARD",
		shortcut: "ADR",
		patterns: [
			/\badr\b/i,
			/\baadhar\b/i,
			/\baadhaar\b/i,
			/\badhar\b/i,
			/\buidai\b/i,
			/\be-?aadhaar\b/i
		]
	},
	{
		id: "pan-card",
		outputName: "PAN CARD",
		shortcut: "PAN",
		patterns: [
			/\bpan\b/i,
			/\bpancard\b/i,
			/\bnsdl\b/i,
			/\butiitsl\b/i
		]
	},
	{
		id: "photo",
		outputName: "PHOTO",
		shortcut: "PIC",
		patterns: [
			/\bpic\b/i,
			/\bphoto\b/i,
			/\bphotograph\b/i,
			/\bpassport_?size\b/i,
			/\bimage\b/i
		]
	},
	{
		id: "signature",
		outputName: "SIGNATURE",
		shortcut: "SIG",
		patterns: [
			/\bsig\b/i,
			/\bsign\b/i,
			/\bsignature\b/i,
			/\bstudent\s*sign\b/i,
			/\bsahi\b/i
		]
	},
	{
		id: "caste-validity",
		outputName: "CASTE VALIDITY CERTIFICATE",
		shortcut: "VAL",
		patterns: [
			/\bval\b/i,
			/\bvld\b/i,
			/\bvalidity\b/i,
			/\bcaste\s*validity\b/i,
			/\bcvc\b/i,
			/\btribe\s*validity\b/i,
			/\bpadtalni\b/i,
			/\bpramanpatra\b/i
		]
	},
	{
		id: "caste-certificate",
		outputName: "CASTE CERTIFICATE",
		shortcut: "CST",
		patterns: [
			/\bcst\b/i,
			/\bcas\b/i,
			/\bcaste\b/i,
			/\bcast\b/i,
			/\bjati\b/i,
			/\bjati\s*pramanpatra\b/i,
			/\bcategory\b/i
		]
	},
	{
		id: "non-creamy-layer",
		outputName: "NON CREAMY LAYER CERTIFICATE",
		shortcut: "NCL",
		patterns: [
			/\bncl\b/i,
			/\bnon\s*creamy\b/i,
			/\bnon\s*criminal\b/i,
			/\bnon-creamy\b/i,
			/\bcreamy\s*layer\b/i
		]
	},
	{
		id: "income-certificate",
		outputName: "INCOME CERTIFICATE",
		shortcut: "INC",
		patterns: [
			/\binc\b/i,
			/\bincome\b/i,
			/\butpann\b/i,
			/\butpanna\s*dakhla\b/i,
			/\btahsildar\s*income\b/i,
			/\bform\s*16\b/i,
			/\btahsildar\b/i
		]
	},
	{
		id: "domicile-certificate",
		outputName: "DOMICILE CERTIFICATE",
		shortcut: "DOM",
		patterns: [
			/\bdom\b/i,
			/\bdomicile\b/i,
			/\badhivasa?\b/i,
			/\bmaharashtra\s*domicile\b/i,
			/\bnivas\b/i
		]
	},
	{
		id: "nationality-certificate",
		outputName: "NATIONALITY CERTIFICATE",
		shortcut: "NAT",
		patterns: [
			/\bnat\b/i,
			/\bnationality\b/i,
			/\brashtriyatva\b/i,
			/\bnationality\s*proof\b/i
		]
	},
	{
		id: "ration-card",
		outputName: "RATION CARD",
		shortcut: "RAT",
		patterns: [
			/\brat\b/i,
			/\bration\b/i,
			/\bration\s*card\b/i,
			/\bshidha\s*patrika\b/i,
			/\bshidori\b/i
		]
	},
	{
		id: "bank-passbook",
		outputName: "BANK PASSBOOK",
		shortcut: "BNK",
		patterns: [
			/\bbnk\b/i,
			/\bpassbook\b/i,
			/\bbank\s*passbook\b/i,
			/\bbank\s*account\b/i,
			/\bnpci\s*seeded\b/i,
			/\bbank\b/i,
			/\bstatement\b/i,
			/\bcheque\b/i
		]
	},
	{
		id: "cap-allotment",
		outputName: "CAP ALLOTMENT LETTER",
		shortcut: "CAP",
		patterns: [
			/\bcap\b/i,
			/\ballotment\b/i,
			/\bcap\s*allotment\b/i,
			/\badmission\s*confirmation\b/i
		]
	},
	{
		id: "bonafide-certificate",
		outputName: "BONAFIDE CERTIFICATE",
		shortcut: "BON",
		patterns: [
			/\bbon\b/i,
			/\bbnf\b/i,
			/\bbonafide\b/i,
			/\bcollege\s*bonafide\b/i,
			/\bbonafied\b/i
		]
	},
	{
		id: "fee-receipt",
		outputName: "FEE RECEIPT",
		shortcut: "FEE",
		patterns: [
			/\bfee\b/i,
			/\bfee\s*receipt\b/i,
			/\badmission\s*fee\b/i,
			/\btuition\s*fee\b/i
		]
	},
	{
		id: "attendance-certificate",
		outputName: "ATTENDANCE CERTIFICATE",
		shortcut: "ATT",
		patterns: [
			/\batt\b/i,
			/\battendance\b/i,
			/\bcollege\s*attendance\b/i
		]
	},
	{
		id: "hostel-certificate",
		outputName: "HOSTEL CERTIFICATE",
		shortcut: "HST",
		patterns: [
			/\bhst\b/i,
			/\bhostel\b/i,
			/\bhostel\s*certificate\b/i,
			/\brent\s*agreement\b/i,
			/\bprivate\s*hostel\b/i
		]
	},
	{
		id: "gap-certificate",
		outputName: "GAP CERTIFICATE",
		shortcut: "GAP",
		patterns: [
			/\bgap\b/i,
			/\bgap\s*affidavit\b/i,
			/\beducational\s*gap\b/i,
			/\bgap\s*cert\b/i
		]
	},
	{
		id: "self-declaration",
		outputName: "SELF DECLARATION",
		shortcut: "SDC",
		patterns: [
			/\bsdc\b/i,
			/\bslf\b/i,
			/\bself\s*declaration\b/i,
			/\bswayam\s*ghoshnapatra\b/i,
			/\bdeclaration\b/i
		]
	},
	{
		id: "parent-declaration",
		outputName: "PARENT DECLARATION",
		shortcut: "PDC",
		patterns: [
			/\bpdc\b/i,
			/\bpar\b/i,
			/\bparent\s*(declaration|undertaking|form)\b/i,
			/\bhamipatra\b/i,
			/\bfather\s*declaration\b/i,
			/\bpalak\s*(ghoshana|pratigya|pratigyapatra|declaration|undertaking)\b/i
		]
	},
	{
		id: "death-certificate",
		outputName: "DEATH CERTIFICATE",
		shortcut: "DTH",
		patterns: [
			/\bdth\b/i,
			/\bdeath\b/i,
			/\bdeath\s*certificate\b/i,
			/\bfather\s*death\b/i,
			/\bmrutyu\s*pramanpatra\b/i
		]
	},
	{
		id: "non-hostel-declaration",
		outputName: "NON HOSTEL DECLARATION",
		shortcut: "NHC",
		patterns: [
			/\bnhc\b/i,
			/\bnon\s*hostel\b/i,
			/\bgovernment\s*hostel\s*non\b/i,
			/\bwarden\s*letter\b/i
		]
	},
	{
		id: "disability-certificate",
		outputName: "DISABILITY CERTIFICATE",
		shortcut: "DIS",
		patterns: [
			/\bdis\b/i,
			/\bpwd\b/i,
			/\bdisability\b/i,
			/\bdivyang\b/i,
			/\bpwd\s*certificate\b/i,
			/\budid\b/i
		]
	},
	{
		id: "apaar-id",
		outputName: "APAAR ID",
		shortcut: "APR",
		patterns: [
			/\bapr\b/i,
			/\bapaar\b/i,
			/\bapaar\s*id\b/i,
			/\babc\s*id\b/i,
			/\bacademic\s*bank\b/i
		]
	},
	{
		id: "cet-application-form",
		outputName: "CET APPLICATION FORM",
		shortcut: "CETAF",
		patterns: [
			/\bcetaf\b/i,
			/\bcet\s*application\b/i,
			/\bcet\s*form\b/i,
			/\bcap\s*registration\b/i
		]
	},
	{
		id: "cet-score-card",
		outputName: "CET SCORE CARD",
		shortcut: "CETSC",
		patterns: [
			/\bcetsc\b/i,
			/\bcet\s*score\b/i,
			/\bcet\s*result\b/i,
			/\bneet\s*score\b/i,
			/\bscorecard\b/i
		]
	},
	{
		id: "status-retention-form",
		outputName: "STATUS RETENTION FORM",
		shortcut: "SRF",
		patterns: [
			/\bsrf\b/i,
			/\bstatus\s*retention\b/i,
			/\bretention\s*form\b/i,
			/\bcet\s*retention\b/i
		]
	},
	{
		id: "ews-certificate",
		outputName: "EWS CERTIFICATE",
		shortcut: "EWS",
		patterns: [
			/\bews\b/i,
			/\beconomically\s*weaker\b/i,
			/\bews\s*certificate\b/i
		]
	},
	{
		id: "migration-certificate",
		outputName: "MIGRATION CERTIFICATE",
		shortcut: "MIG",
		patterns: [
			/\bmig\b/i,
			/\bmigration\b/i,
			/\bmigration\s*certificate\b/i
		]
	},
	{
		id: "medical-fitness",
		outputName: "MEDICAL FITNESS CERTIFICATE",
		shortcut: "MED",
		patterns: [
			/\bmed\b/i,
			/\bfitness\b/i,
			/\bmedical\s*fitness\b/i,
			/\bhealth\s*certificate\b/i
		]
	},
	{
		id: "attempt-certificate",
		outputName: "ATTEMPT CERTIFICATE",
		shortcut: "ATM",
		patterns: [
			/\batm\b/i,
			/\battempt\b/i,
			/\bprayatna\b/i
		]
	},
	{
		id: "birth-certificate",
		outputName: "BIRTH CERTIFICATE",
		shortcut: "BRT",
		patterns: [
			/\bbrt\b/i,
			/\bbirth\b/i,
			/\bjanma\b/i,
			/\bjanma\s*dakhla\b/i,
			/\bdob\s*proof\b/i,
			/\bdob\b/i
		]
	},
	{
		id: "voter-id",
		outputName: "VOTER ID",
		shortcut: "VOT",
		patterns: [
			/\bvot\b/i,
			/\bvoter\b/i,
			/\belection\s*card\b/i,
			/\bepic\b/i
		]
	},
	{
		id: "driving-license",
		outputName: "DRIVING LICENSE",
		shortcut: "DL",
		patterns: [
			/\bdl\b/i,
			/\bdriving\s*licen[sc]e\b/i,
			/\blicen[sc]e\b/i
		]
	},
	{
		id: "11th-marksheet",
		outputName: "11TH MARKSHEET",
		shortcut: "11M",
		patterns: [/\b11m\b/i, /\b11(th)?\s*(mark|marksheet|mark-sheet)\b/i]
	},
	{
		id: "1st-year-marksheet",
		outputName: "1ST YEAR MARKSHEET",
		shortcut: "1YM",
		patterns: [
			/\b1ym\b/i,
			/\b1st\s*year\b/i,
			/\bfirst\s*year\s*mark/i,
			/\bfy\s*marksheet\b/i,
			/\bsem\s*1\b/i,
			/\bsem\s*2\b/i
		]
	},
	{
		id: "2nd-year-marksheet",
		outputName: "2ND YEAR MARKSHEET",
		shortcut: "2YM",
		patterns: [
			/\b2ym\b/i,
			/\b2nd\s*year\b/i,
			/\bsecond\s*year\s*mark/i,
			/\bsy\s*marksheet\b/i,
			/\bsem\s*3\b/i,
			/\bsem\s*4\b/i
		]
	},
	{
		id: "3rd-year-marksheet",
		outputName: "3RD YEAR MARKSHEET",
		shortcut: "3YM",
		patterns: [
			/\b3ym\b/i,
			/\b3rd\s*year\b/i,
			/\bthird\s*year\s*mark/i,
			/\bty\s*marksheet\b/i,
			/\bsem\s*5\b/i,
			/\bsem\s*6\b/i
		]
	},
	{
		id: "4th-year-marksheet",
		outputName: "4TH YEAR MARKSHEET",
		shortcut: "4YM",
		patterns: [
			/\b4ym\b/i,
			/\b4th\s*year\b/i,
			/\bfourth\s*year\s*mark/i,
			/\bfinal\s*year\s*marksheet\b/i
		]
	},
	{
		id: "passing-certificate",
		outputName: "PASSING CERTIFICATE",
		shortcut: "DPC",
		patterns: [
			/\bdpc\b/i,
			/\bdegree\s*passing\b/i,
			/\bdiploma\s*passing\b/i,
			/\bprovisional\s*certificate\b/i
		]
	},
	{
		id: "degree-certificate",
		outputName: "DEGREE CERTIFICATE",
		shortcut: "DEG",
		patterns: [
			/\bdeg\b/i,
			/\bdegree\b/i,
			/\bconvocation\b/i,
			/\bdiploma\s*certificate\b/i
		]
	},
	{
		id: "registration-certificate",
		outputName: "REGISTRATION CERTIFICATE",
		shortcut: "REG",
		patterns: [
			/\breg\b/i,
			/\bcouncil\s*registration\b/i,
			/\bmnc\s*registration\b/i,
			/\bnursing\s*registration\b/i
		]
	},
	{
		id: "internship-certificate",
		outputName: "INTERNSHIP CERTIFICATE",
		shortcut: "INT",
		patterns: [
			/\bint\b/i,
			/\binternship\b/i,
			/\bclinical\s*experience\b/i
		]
	},
	{
		id: "character-certificate",
		outputName: "CHARACTER CERTIFICATE",
		shortcut: "CHR",
		patterns: [
			/\bchr\b/i,
			/\bcharacter\b/i,
			/\bconduct\s*certificate\b/i,
			/\bcharitra\s*dakhla\b/i
		]
	},
	{
		id: "gazette-certificate",
		outputName: "GAZETTE CERTIFICATE",
		shortcut: "GAZ",
		patterns: [
			/\bgaz\b/i,
			/\bgazette\b/i,
			/\bname\s*change\s*gazette\b/i,
			/\brajpatra\b/i,
			/\bmarriage\s*certificate\b/i
		]
	},
	{
		id: "minority-certificate",
		outputName: "MINORITY CERTIFICATE",
		shortcut: "MIN",
		patterns: [
			/\bmin\b/i,
			/\bminority\b/i,
			/\balpsankhyank\b/i,
			/\bminority\s*declaration\b/i
		]
	}
];
function w(e, t = null) {
	if (!e || typeof e != "string") return {
		docType: null,
		confidence: 0,
		matchedPattern: null
	};
	let n = e.replace(/[_\-\.]+/g, " ").trim().toLowerCase(), r = n.replace(/\s+/g, "");
	if (t) for (let [e, i] of Object.entries(t)) for (let t of i) {
		let i = t.toLowerCase().trim(), a = RegExp(`(^|[^a-z0-9])${i}([^a-z0-9]|$)`, "i");
		if (a.test(n) || r.length >= 2 && r.length <= 6 && (a.test(r) || r === i)) return {
			docType: e,
			confidence: 95,
			matchedPattern: t
		};
	}
	for (let e of C) for (let t of e.patterns) if (t.test(n) || r.length >= 2 && r.length <= 6 && t.test(r)) return {
		docType: e.outputName,
		confidence: 90,
		matchedPattern: t.toString()
	};
	return {
		docType: null,
		confidence: 0,
		matchedPattern: null
	};
}
function T(e) {
	if (!e) return "";
	let t = e.lastIndexOf(".");
	return t > 0 ? e.slice(t) : "";
}
function E(e) {
	return !e || typeof e != "string" ? "" : e.replace(/(\.[a-zA-Z0-9]+)+$/i, "").trim();
}
function D(e, t) {
	let n = w(e, t);
	return n && n.docType ? n.docType : S(e, t) || null;
}
function O(e, t = "preserve", n = null) {
	let r = e, i = t;
	return n !== null && (r = t, i = n), r ? i === "upper" ? r.toUpperCase() : i === "lower" ? r.toLowerCase() : i === "title" ? r.toLowerCase().replace(/(^|[\s\-_])\S/g, (e) => e.toUpperCase()) : r : "";
}
function k(e, t, n, r = "preserve") {
	let i = D(e, n), a = "";
	a = i ? g[i.toUpperCase()] || i : E(e);
	let o = a;
	if (t && t.trim()) {
		let e = t.trim().replace(/[_\-]+/g, " ").replace(/\s+/g, " "), n = a.replace(/[_\-]+/g, " ").replace(/\s+/g, " ");
		if (n.toLowerCase() === e.toLowerCase()) o = a;
		else {
			let t = e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
			o = RegExp(`(^|\\s)${t}(\\s|$)`, "i").test(n) ? a : `${a} ${e}`;
		}
	}
	return O(o, r);
}
function A(e) {
	if (!e || !e.trim()) return "File name cannot be empty.";
	let t = e.trim();
	if (e.endsWith(".") || e.endsWith(" ") || t.endsWith(".")) return "File name cannot end with a period or space.";
	if (/[\x00-\x1f\\/:*?"<>|]/.test(e)) return "File name cannot contain \\ / : * ? \" < > | or control characters.";
	if (t === "." || t === "..") return "Invalid file name.";
	let n = t.toUpperCase().split(".")[0].trim();
	return [
		"CON",
		"PRN",
		"AUX",
		"NUL",
		"COM1",
		"COM2",
		"COM3",
		"COM4",
		"COM5",
		"COM6",
		"COM7",
		"COM8",
		"COM9",
		"LPT1",
		"LPT2",
		"LPT3",
		"LPT4",
		"LPT5",
		"LPT6",
		"LPT7",
		"LPT8",
		"LPT9"
	].includes(n) ? "This file name is reserved by Windows OS." : "";
}
function j(e, t, n, r = "") {
	let i = /* @__PURE__ */ new Map();
	if (n) for (let e of n) e && i.set(e.toLowerCase(), e);
	if (!i.has(e.toLowerCase()) || e.toLowerCase() === (t || "").toLowerCase()) return e;
	let a = T(e), o = E(e), s = o, c = 2, l = "", u = (r || "").trim();
	if (u) {
		let e = u.toLowerCase(), t = o.toLowerCase();
		if (t.endsWith(e)) {
			let n = t.lastIndexOf(e), r = o.slice(0, n).trim(), i = o.slice(n).trim();
			r && (s = r, l = ` ${i}`);
		}
	}
	let d = s.match(/^(.*?)\s+(\d+)$/);
	if (d) {
		let e = d[1].trim(), t = parseInt(d[2], 10), n = `${e}${l}${a}`.toLowerCase();
		i.has(n) && (s = e, c = t + 1);
	}
	let f = `${s} ${c}${l}${a}`;
	for (; i.has(f.toLowerCase()) && f.toLowerCase() !== (t || "").toLowerCase();) c++, f = `${s} ${c}${l}${a}`;
	return f;
}
var M = new class {
	constructor(e = 10) {
		this.history = [], this.maxHistory = e;
	}
	pushBatch(e, t) {
		t && t.length && (this.history.push({
			dir: e,
			dirName: e ? e.name : "",
			plan: [...t],
			timestamp: (/* @__PURE__ */ new Date()).toISOString()
		}), this.history.length > this.maxHistory && this.history.shift());
	}
	peek() {
		return this.history[this.history.length - 1] || null;
	}
	pop() {
		return this.history.pop() || null;
	}
	canUndo() {
		return this.history.length > 0;
	}
	clear() {
		this.history = [];
	}
}(), ee = (e) => e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function te(e, t) {
	return e === e.toUpperCase() ? t.toUpperCase() : e === e.toLowerCase() ? t.toLowerCase() : e[0] === e[0].toUpperCase() ? t[0].toUpperCase() + t.slice(1).toLowerCase() : t;
}
function ne(e, t) {
	if (!e || typeof e != "string") return e;
	let n = e;
	for (let [e, r] of Object.entries(t || {})) {
		if (!e) continue;
		let t = RegExp(`(^|[^a-zA-Z0-9])(${ee(e)})([^a-zA-Z0-9]|$)`, "gi");
		n = n.replace(t, (e, t, n, i) => t + te(n, r) + i);
	}
	return n;
}
function re(e, t, n = "") {
	let r = e.toLowerCase(), i = t.toLowerCase().trim();
	return n === "CASTE CERTIFICATE" && (r.includes("validity") || r.includes("vld")) && !r.includes("caste certificate") && !r.includes("cast certificate") ? !1 : i.includes(" ") ? r.includes(i) : RegExp(`(^|[^a-z0-9])${i}([^a-z0-9]|$)`, "i").test(r);
}
function ie(e, t, n = v) {
	let r = t.name.trim().toUpperCase(), i = Array.isArray(n) ? n : v;
	for (let t of i) if (t.type === "combined" && (t.part1 === r || t.part2 === r)) {
		let n = t.combined.toLowerCase(), r = e.find((e) => {
			let t = e.toLowerCase();
			return t.includes(n) || t.includes("12th") && t.includes("marksheet") && t.includes("passing") || t.includes("10th") && t.includes("marksheet") && t.includes("passing") || t.includes("12mp") || t.includes("10mp");
		});
		if (r) return {
			status: "green",
			matchedFile: r,
			isLinked: !0,
			linkedReason: `Fulfilled via combined file "${t.combined}"`
		};
	}
	for (let t of i) if (t.type === "alias" && t.part1 === r) {
		let n = t.part2.toLowerCase(), r = e.find((e) => e.toLowerCase().includes(n));
		if (r) return {
			status: "green",
			matchedFile: r,
			isLinked: !0,
			linkedReason: `Fulfilled via alias "${t.part2}"`
		};
	}
	let a = Array.isArray(t.keywords) ? t.keywords : [t.name];
	for (let t of a) {
		let n = e.find((e) => re(e, t, r));
		if (n) return {
			status: "green",
			matchedFile: n,
			isLinked: !1
		};
	}
	return {
		status: "red",
		matchedFile: null,
		isLinked: !1
	};
}
function ae(e, t) {
	let n = new Blob(["﻿" + t], { type: "text/csv;charset=utf-8;" }), r = URL.createObjectURL(n), i = document.createElement("a");
	i.setAttribute("href", r), i.setAttribute("download", e), i.style.display = "none", document.body.appendChild(i), i.click(), document.body.removeChild(i), URL.revokeObjectURL(r);
}
function N(e) {
	if (e == null) return "\"\"";
	let t = String(e);
	return t.includes("\"") || t.includes(",") || t.includes("\n") || t.includes("\r") ? `"${t.replace(/"/g, "\"\"")}"` : `"${t}"`;
}
function P(e, t, n = "Checklist") {
	let r = [[
		"Sr No",
		"Student Name",
		"Folder Name",
		...t.map((e) => e.name),
		"Verified Count",
		"Missing Count",
		"Total Rules",
		"Completion %",
		"Readiness Status",
		"Missing Documents"
	].map(N).join(",")];
	return e.forEach((e, n) => {
		let i = {};
		e.summary && Array.isArray(e.summary.evaluations) && e.summary.evaluations.forEach((e) => {
			i[e.rule.name] = e.status === "green" ? e.isLinked ? "LINKED" : "PRESENT" : "MISSING";
		});
		let a = [
			n + 1,
			e.studentName || "Unknown Student",
			e.folderName || "",
			...t.map((e) => i[e.name] || "MISSING"),
			e.summary?.foundCount || 0,
			e.summary?.missingCount || 0,
			e.summary?.totalRequired || t.length,
			`${e.summary?.percentComplete || 0}%`,
			e.summary?.isReady ? "READY FOR SUBMISSION" : "INCOMPLETE",
			(e.summary?.missingList || []).join("; ")
		];
		r.push(a.map(N).join(","));
	}), r.join("\r\n");
}
async function oe(e, t, n = null) {
	let r = [];
	try {
		let i = 0;
		for (let a of t) {
			let o = e && (e.nativePath || e.path) || "", s = a.nativePath || a.file && (a.file.path || a.file.nativePath) || (o ? `${o}/${a.old}` : null);
			if (s) {
				let e = a.studentName || a.file && a.file.studentName || "", o = a.rotation || a.file && a.file.rotation || 0, c = typeof window < "u" && window.location && window.location.search && window.location.search.includes("test_mode=1"), l;
				if (c) {
					let e = s.includes("/") ? s.substring(0, s.lastIndexOf("/")) : s.includes("\\") ? s.substring(0, s.lastIndexOf("\\")) : "", t = e ? `${e}/${a.next}` : a.next;
					l = {
						success: !0,
						name: a.next,
						path: t,
						newPath: t
					};
				} else l = await d(s, a.next, e, o);
				if (!l.success) throw Error(l.error || `Failed to rename ${a.old}`);
				let u = l.name || a.next;
				if (a.next = u, a.file) {
					let e = l.path || l.newPath;
					if (e) {
						a.file.path = e, a.file.nativePath = e;
						let t = typeof window < "u" && window.location?.origin && !window.location.origin.startsWith("file:") && !window.location.origin.includes("tauri") ? window.location.origin : "http://localhost:3000";
						a.file.url = `${t}/api/serve-file?path=${encodeURIComponent(e)}`;
					}
					if (a.file.name = u, a.file.targetName = u, a.file.isRenamed = !0, a.file.status = "renamed", a.file.rotation = 0, a.file._pdfBytes = null, a.file._blobUrl && typeof URL < "u" && URL.revokeObjectURL) {
						try {
							URL.revokeObjectURL(a.file._blobUrl);
						} catch {}
						a.file._blobUrl = null;
					}
				}
				r.push(a), i++, n && n(Math.round(i / t.length * 100), `Renamed ${i} of ${t.length} files...`);
				continue;
			}
			let c = a.old.toLowerCase() === a.next.toLowerCase() && a.old !== a.next;
			if (!c) {
				let t = a.next, n = await e.getFileHandle(t, { create: !1 }).catch(() => null);
				if (n) {
					let r = T(t), i = E(t).replace(/\s+\d+$/, ""), o = 1;
					for (t = `${i} ${o}${r}`, n = await e.getFileHandle(t, { create: !1 }).catch(() => null); n;) o++, t = `${i} ${o}${r}`, n = await e.getFileHandle(t, { create: !1 }).catch(() => null);
					a.next = t;
				}
			}
			let l = a.handle;
			l ||= await e.getFileHandle(a.old, { create: !1 }).catch(() => null);
			let u = !1;
			if (l && typeof l.move == "function") try {
				if (c) {
					let e = `__tmp_${Date.now()}_${a.next}`;
					await l.move(e), await l.move(a.next);
				} else await l.move(a.next);
				u = !0, r.push(a);
			} catch (e) {
				console.warn("sourceHandle.move() not supported on this handle, falling back to stream copy:", e), u = !1;
			}
			if (!u) {
				let t = await a.file.arrayBuffer(), n;
				if (c) {
					let r = `__tmp_${Date.now()}_${a.next}`, i = await (await e.getFileHandle(r, { create: !0 })).createWritable();
					await i.write(t), await i.close(), await e.removeEntry(a.old), n = await e.getFileHandle(a.next, { create: !0 });
					let o = await n.createWritable();
					await o.write(t), await o.close(), await e.removeEntry(r);
				} else {
					n = await e.getFileHandle(a.next, { create: !0 });
					let r = await n.createWritable();
					await r.write(t), await r.close(), await e.removeEntry(a.old);
				}
				r.push(a);
			}
			i++, n && n(Math.round(i / t.length * 100), `${i}/${t.length} files renamed`);
		}
		return r;
	} catch (e) {
		throw e;
	}
}
async function se(e, t, n = null) {
	let r = [...t].reverse(), i = 0;
	for (let t of r) {
		let a = e && (e.nativePath || e.path) || "", o = t.file && (t.file.path || t.file.nativePath) || (a ? `${a}/${t.next}` : null) || (t.nativePath ? t.nativePath.replace(/[^\\\/]+$/, t.next) : null);
		if (o) {
			let e = typeof window < "u" && window.location && window.location.search && window.location.search.includes("test_mode=1"), s;
			if (e) {
				let e = o.includes("/") ? o.substring(0, o.lastIndexOf("/")) : o.includes("\\") ? o.substring(0, o.lastIndexOf("\\")) : "", n = e ? `${e}/${t.old}` : t.old;
				s = {
					success: !0,
					name: t.old,
					path: n,
					newPath: n
				};
			} else s = await d(o, t.old);
			if (s && s.success) {
				let e = s.path || t.nativePath || (a ? `${a}/${t.old}` : o.replace(/[^\\\/]+$/, t.old));
				if (t.file) {
					t.file.path = e, t.file.nativePath = e, t.file.name = t.old, t.file.targetName = t.old;
					let n = typeof window < "u" && window.location?.origin && !window.location.origin.startsWith("file:") && !window.location.origin.includes("tauri") ? window.location.origin : "http://localhost:3000";
					t.file.url = `${n}/api/serve-file?path=${encodeURIComponent(e)}`, t.file.isRenamed = !1, t.file.status = "pending";
				}
			}
			i++, n && n(Math.round(i / r.length * 100), `Undo: ${i}/${r.length}`);
			continue;
		}
		let s = t.old.toLowerCase() === t.next.toLowerCase() && t.old !== t.next, c = await e.getFileHandle(t.next, { create: !1 }).catch(() => null);
		if (c && typeof c.move == "function") {
			if (s) {
				let e = `__tmp_undo_${Date.now()}_${t.old}`;
				await c.move(e), await c.move(t.old);
			} else await c.move(t.old);
		} else if (c) {
			let n = await (await c.getFile()).arrayBuffer(), r = await (await e.getFileHandle(t.old, { create: !0 })).createWritable();
			await r.write(n), await r.close(), await e.removeEntry(t.next);
		}
		i++, n && n(Math.round(i / r.length * 100), `Undo: ${i}/${r.length}`);
	}
}
var ce = [
	{
		canonical: "AADHAAR CARD",
		code: "ADR",
		patterns: [
			/\bunique identification authority\b/i,
			/\buidai\b/i,
			/\baadhaar\b/i,
			/\badhar\b/i,
			/\bmera aadhaar\b/i,
			/\bidentification authority of india\b/i,
			/\b\d{4}\s\d{4}\s\d{4}\b/,
			/\bvid\s*:\s*\d{4}\b/i
		],
		primaryKeywords: [
			"aadhaar",
			"uidai",
			"unique identification",
			"आधार",
			"enrollment"
		],
		secondaryKeywords: [
			"male",
			"female",
			"dob",
			"year of birth",
			"father",
			"address"
		]
	},
	{
		canonical: "10TH MARKSHEET",
		code: "10M",
		patterns: [
			/\bsecondary school certificate\b/i,
			/\bs\.s\.c\b/i,
			/\bssc examination\b/i,
			/\bboard of secondary\b/i,
			/\b10th marksheet\b/i,
			/\bstd\.?\s*10\b/i,
			/\bstandard x\b/i,
			/\bmatriculation\b/i
		],
		primaryKeywords: [
			"secondary school",
			"s.s.c",
			"ssc",
			"xth",
			"10th",
			"matric"
		],
		secondaryKeywords: [
			"statement of marks",
			"candidate name",
			"seat no",
			"centre no",
			"pass"
		]
	},
	{
		canonical: "12TH MARKSHEET",
		code: "12M",
		patterns: [
			/\bhigher secondary certificate\b/i,
			/\bh\.s\.c\b/i,
			/\bhsc examination\b/i,
			/\bboard of higher secondary\b/i,
			/\b12th marksheet\b/i,
			/\bstd\.?\s*12\b/i,
			/\bstandard xii\b/i,
			/\bintermediate\b/i
		],
		primaryKeywords: [
			"higher secondary",
			"h.s.c",
			"hsc",
			"xiith",
			"12th",
			"science",
			"commerce",
			"arts"
		],
		secondaryKeywords: [
			"statement of marks",
			"candidate name",
			"seat no",
			"centre no",
			"stream",
			"pass"
		]
	},
	{
		canonical: "12TH LEAVING CERTIFICATE",
		code: "12LC",
		patterns: [
			/\bleaving certificate\b/i,
			/\btransfer certificate\b/i,
			/\bcollege leaving\b/i,
			/\bschool leaving\b/i,
			/\bconduct\s*:\s*good\b/i,
			/\bdate of leaving\b/i,
			/\bdate of birth\b/i
		],
		primaryKeywords: [
			"leaving certificate",
			"transfer certificate",
			"tc",
			"school leaving",
			"college leaving"
		],
		secondaryKeywords: [
			"date of birth",
			"conduct",
			"progress",
			"religion",
			"caste",
			"nationality"
		]
	},
	{
		canonical: "CASTE CERTIFICATE",
		code: "CST",
		patterns: [
			/\bcaste certificate\b/i,
			/\bform of caste\b/i,
			/\bbelong to\s+\w+\s+caste\b/i,
			/\bbackward class\b/i,
			/\bscheduled caste\b/i,
			/\bscheduled tribe\b/i,
			/\bother backward class\b/i,
			/\bobc\b/i,
			/\bvjnt\b/i,
			/\bnt-[a-d]\b/i,
			/\bsebc\b/i,
			/\bजात प्रमाणपत्र\b/i
		],
		primaryKeywords: [
			"caste certificate",
			"backward class",
			"sub divisional officer",
			"competent authority",
			"caste"
		],
		secondaryKeywords: [
			"ordinance",
			"constitution",
			"tahasildar",
			"deputy collector"
		]
	},
	{
		canonical: "CASTE VALIDITY CERTIFICATE",
		code: "VLD",
		patterns: [
			/\bcaste validity\b/i,
			/\bvalidity certificate\b/i,
			/\bscrutiny committee\b/i,
			/\bverification of caste\b/i,
			/\bvalidity of caste\b/i,
			/\bजात वैधता प्रमाणपत्र\b/i
		],
		primaryKeywords: [
			"caste validity",
			"validity certificate",
			"scrutiny committee",
			"caste certificate scrutiny"
		],
		secondaryKeywords: [
			"district caste",
			"certificate of validity",
			"verified"
		]
	},
	{
		canonical: "INCOME CERTIFICATE",
		code: "INC",
		patterns: [
			/\bincome certificate\b/i,
			/\bannual family income\b/i,
			/\bannual income\b/i,
			/\bउत्पन्नाचा दाखला\b/i,
			/\bउत्पन्न प्रमाणपत्र\b/i,
			/\bfinancial year\b/i
		],
		primaryKeywords: [
			"income certificate",
			"annual income",
			"tahsildar",
			"taluka executive magistrate"
		],
		secondaryKeywords: [
			"rupees",
			"lakhs",
			"financial year",
			"head of family"
		]
	},
	{
		canonical: "DOMICILE CERTIFICATE",
		code: "DOM",
		patterns: [
			/\bdomicile certificate\b/i,
			/\bage,?\s*nationality\s*(and|&)\s*domicile\b/i,
			/\bage and domicile\b/i,
			/\bresident of\s+state of maharashtra\b/i,
			/\bstate of maharashtra\b/i,
			/\bअधिवास प्रमाणपत्र\b/i
		],
		primaryKeywords: [
			"domicile",
			"age and nationality",
			"state of maharashtra",
			"ordinary resident"
		],
		secondaryKeywords: [
			"executive magistrate",
			"tahsildar",
			"mumbai",
			"pune",
			"nagpur",
			"district"
		]
	},
	{
		canonical: "NON CREAMY LAYER CERTIFICATE",
		code: "NCL",
		patterns: [
			/\bnon[-\s]creamy layer\b/i,
			/\bdoes not belong to the persons\/sections \(creamy layer\)\b/i,
			/\bcreamy layer\b/i
		],
		primaryKeywords: [
			"non creamy layer",
			"creamy layer",
			"other backward classes"
		],
		secondaryKeywords: [
			"annual income",
			"sub divisional officer",
			"valid upto"
		]
	},
	{
		canonical: "RATION CARD",
		code: "RAT",
		patterns: [
			/\bration card\b/i,
			/\bfood (and|&) civil supplies\b/i,
			/\bconsumer affairs\b/i,
			/\bcard no\b/i
		],
		primaryKeywords: [
			"ration card",
			"food civil supplies",
			"fair price"
		],
		secondaryKeywords: [
			"head of family",
			"gas connection",
			"bpl",
			"apl"
		]
	},
	{
		canonical: "BANK PASSBOOK",
		code: "BNK",
		patterns: [
			/\bpassbook\b/i,
			/\baccount (number|no)\b/i,
			/\bifsc\s*code\b/i,
			/\bbranch\b/i,
			/\bstate bank of india\b/i,
			/\bbank of maharashtra\b/i,
			/\bbank of baroda\b/i
		],
		primaryKeywords: [
			"passbook",
			"ifsc",
			"account number",
			"bank"
		],
		secondaryKeywords: [
			"savings",
			"branch",
			"micr",
			"cif"
		]
	},
	{
		canonical: "GAP CERTIFICATE",
		code: "GAP",
		patterns: [
			/\bgap certificate\b/i,
			/\baffidavit for gap\b/i,
			/\bgap in education\b/i,
			/\beducational gap\b/i
		],
		primaryKeywords: [
			"gap certificate",
			"affidavit",
			"educational gap"
		],
		secondaryKeywords: [
			"notary",
			"stamp paper",
			"solemnly affirm"
		]
	}
];
function le({ canonical: e, code: t = "", primaryKeywords: n = [], secondaryKeywords: r = [] }) {
	if (!e || typeof e != "string") return null;
	let i = e.trim().toUpperCase(), a = (t || "").trim().toUpperCase() || i.slice(0, 3);
	g[i] = i;
	let o = (e) => e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), s = [RegExp(`\\b${o(i)}\\b`, "i")];
	a && a.length >= 2 && s.push(RegExp(`\\b${o(a)}\\b`, "i"));
	for (let e of n) e && e.trim().length >= 3 && s.push(RegExp(`\\b${o(e.trim())}\\b`, "i"));
	let c = [i.toLowerCase()];
	for (let e of n) if (e && typeof e == "string" && e.trim().length >= 3) {
		let t = e.trim().toLowerCase();
		c.includes(t) || c.push(t);
	}
	let l = [];
	for (let e of r) if (e && typeof e == "string" && e.trim().length >= 3) {
		let t = e.trim().toLowerCase();
		!c.includes(t) && !l.includes(t) && l.push(t);
	}
	let u = {
		canonical: i,
		code: a,
		patterns: s,
		primaryKeywords: c,
		secondaryKeywords: l
	}, d = ce.findIndex((e) => e.canonical === i);
	return d === -1 ? ce.push(u) : ce[d] = u, u;
}
function ue(e, t) {
	if (e === t) return 0;
	if (!e || !e.length) return (t || "").length;
	if (!t || !t.length) return e.length;
	let n = e.toLowerCase(), r = t.toLowerCase(), i = [];
	for (let e = 0; e <= n.length; e++) i[e] = [e];
	for (let e = 0; e <= r.length; e++) i[0][e] = e;
	for (let e = 1; e <= n.length; e++) for (let t = 1; t <= r.length; t++) {
		let a = n[e - 1] === r[t - 1] ? 0 : 1;
		i[e][t] = Math.min(i[e - 1][t] + 1, i[e][t - 1] + 1, i[e - 1][t - 1] + a);
	}
	return i[n.length][r.length];
}
function F(e, t) {
	if (!e && !t) return 1;
	if (!e || !t) return 0;
	let n = e.toLowerCase().trim(), r = t.toLowerCase().trim();
	if (n === r) return 1;
	let i = Math.max(n.length, r.length);
	if (i === 0) return 1;
	let a = ue(n, r);
	return Math.max(0, 1 - a / i);
}
function I(e) {
	return !e || typeof e != "string" ? [] : e.replace(/\.[a-zA-Z0-9]+$/i, "").replace(/[^a-zA-Z0-9]+/g, " ").toLowerCase().split(/\s+/).filter((e) => e.length > 0);
}
var de = [
	{
		id: "10",
		tags: [
			"10",
			"10th",
			"ssc",
			"tenth",
			"x"
		]
	},
	{
		id: "11",
		tags: [
			"11",
			"11th",
			"xi",
			"eleventh"
		]
	},
	{
		id: "12",
		tags: [
			"12",
			"12th",
			"hsc",
			"twelfth",
			"xii"
		]
	},
	{
		id: "1st",
		tags: [
			"1st",
			"first",
			"fy",
			"sem1",
			"sem-1"
		]
	},
	{
		id: "2nd",
		tags: [
			"2nd",
			"second",
			"sy",
			"sem2",
			"sem-2"
		]
	},
	{
		id: "3rd",
		tags: [
			"3rd",
			"third",
			"ty",
			"sem3",
			"sem-3"
		]
	},
	{
		id: "4th",
		tags: [
			"4th",
			"fourth",
			"sem4",
			"sem-4"
		]
	}
];
function fe(e) {
	let t = (e || "").toLowerCase();
	for (let e of de) if (e.tags.includes(t)) return e.id;
	return null;
}
function pe(e) {
	let t = /* @__PURE__ */ new Set();
	for (let n of e) {
		let e = fe(n);
		e && t.add(e);
	}
	return t;
}
function me(e, t) {
	if (t && t.size > 0) {
		for (let n of e) if (!t.has(n)) return !0;
	}
	return !1;
}
function L(e, t = "", n = null, r = null) {
	if (!e || typeof e != "string") return {
		docType: null,
		canonical: null,
		code: null,
		confidence: 0,
		isConfident: !1,
		reason: "Empty filename"
	};
	let i = E(e).trim();
	if (!i) return {
		docType: null,
		canonical: null,
		code: null,
		confidence: 0,
		isConfident: !1,
		reason: "Empty basename"
	};
	let a = ne(i, _), o = a.replace(/[_\-\.\+,\(\)\[\]]+/g, " ").replace(/\s+/g, " ").trim().toLowerCase(), s = I(a), c = pe(s), l = w(a, n);
	l.docType || (l = w(i, n));
	let u = S(a, n) || S(i, n);
	if (l && l.docType) {
		let e = l.docType.toUpperCase(), n = g[e] || e, r = n.toUpperCase(), a = i.toUpperCase().replace(/\s+/g, " ").trim(), o = !1;
		if (t && t.trim()) {
			let n = t.trim().toUpperCase().replace(/\s+/g, " ");
			(a === `${r} ${n}` || a === `${e} ${n}`) && (o = !0);
		}
		return o || a !== r && a !== e || (o = !0), {
			docType: e,
			canonical: n,
			code: null,
			confidence: o ? 100 : 95,
			isConfident: !0,
			reason: o ? "Exact match" : "Pattern match"
		};
	}
	if (u) {
		let e = u.toUpperCase(), n = g[e] || e, r = n.toUpperCase(), a = i.toUpperCase().replace(/\s+/g, " ").trim(), o = !1;
		if (t && t.trim()) {
			let n = t.trim().toUpperCase().replace(/\s+/g, " ");
			(a === `${r} ${n}` || a === `${e} ${n}`) && (o = !0);
		}
		return o || a !== r && a !== e || (o = !0), {
			docType: e,
			canonical: n,
			code: null,
			confidence: o ? 100 : 90,
			isConfident: !0,
			reason: o ? "Exact match" : "Shortcut match"
		};
	}
	let d = [
		{
			type: "12TH LC",
			code: "12LC",
			patterns: [/\b12(th)?\s*(lc|tc|leaving|l)\b/i, /\b12l\b/i],
			tokens: [
				"12th lc",
				"12 lc",
				"12th tc",
				"12 tc",
				"12th leaving",
				"12 leaving",
				"12lc",
				"12l",
				"leaving certificate",
				"school leaving",
				"tc",
				"transfer certificate"
			],
			primary: [
				"lc",
				"tc",
				"leaving",
				"transfer",
				"12l",
				"12lc"
			],
			qualifier: [
				"12",
				"12th",
				"hsc"
			],
			standard: "12"
		},
		{
			type: "12TH MARKSHEET AND PASSING CERTIFICATE",
			code: "12MP",
			tokens: [
				"12mp",
				"12tmp",
				"12th passing marksheet",
				"12 marksheet passing",
				"12th marksheet and passing",
				"12th combined"
			],
			standard: "12",
			minScore: 90
		},
		{
			type: "10TH MARKSHEET AND PASSING CERTIFICATE",
			code: "10MP",
			tokens: [
				"10mp",
				"10tmp",
				"10th passing marksheet",
				"10 marksheet passing",
				"10th marksheet and passing",
				"10th combined"
			],
			standard: "10",
			minScore: 90
		},
		{
			type: "12TH MARKSHEET",
			code: "12M",
			patterns: [/\b12(th)?\s*(m|mark|marksheet|hsc)\b/i, /\bhsc\s*mark/i],
			tokens: [
				"12th marksheet",
				"hsc marksheet",
				"12 marksheet",
				"12th mark",
				"12m",
				"hsc"
			],
			primary: [
				"marksheet",
				"markshet",
				"mark"
			],
			qualifier: [
				"12",
				"12th",
				"hsc"
			],
			standard: "12"
		},
		{
			type: "10TH MARKSHEET",
			code: "10M",
			patterns: [/\b10(th)?\s*(m|mark|marksheet|ssc)\b/i, /\bssc\s*mark/i],
			tokens: [
				"10th marksheet",
				"ssc marksheet",
				"10 marksheet",
				"10th mark",
				"10m",
				"ssc"
			],
			primary: [
				"marksheet",
				"markshet",
				"mark"
			],
			qualifier: [
				"10",
				"10th",
				"ssc"
			],
			standard: "10"
		},
		{
			type: "12TH PASSING CERTIFICATE",
			code: "12P",
			tokens: [
				"12th passing",
				"hsc passing",
				"12p",
				"12th pass"
			],
			primary: ["passing", "sanad"],
			qualifier: [
				"12",
				"12th",
				"hsc"
			],
			standard: "12"
		},
		{
			type: "10TH PASSING CERTIFICATE",
			code: "10P",
			tokens: [
				"10th passing",
				"ssc passing",
				"10p",
				"10th pass"
			],
			primary: ["passing", "sanad"],
			qualifier: [
				"10",
				"10th",
				"ssc"
			],
			standard: "10"
		},
		{
			type: "10TH LC",
			code: "10LC",
			patterns: [/\b10(th)?\s*(lc|tc|leaving|l)\b/i, /\b10l\b/i],
			tokens: [
				"10th lc",
				"10 lc",
				"10th tc",
				"10 tc",
				"10th leaving",
				"10 leaving",
				"10lc",
				"10l"
			],
			primary: [
				"lc",
				"tc",
				"leaving",
				"transfer",
				"10l",
				"10lc"
			],
			qualifier: [
				"10",
				"10th",
				"ssc"
			],
			standard: "10"
		},
		{
			type: "AADHAAR CARD",
			code: "ADR",
			tokens: [
				"aadhaar",
				"adhar",
				"aadhar",
				"adr",
				"uid",
				"uidai",
				"adhaar"
			],
			primary: [
				"aadhaar",
				"adhar",
				"aadhar",
				"adr"
			]
		},
		{
			type: "CASTE CERTIFICATE",
			code: "CST",
			patterns: [/\b(cst|cas|caste)\b/i],
			tokens: [
				"caste certificate",
				"caste cert",
				"cst",
				"cas",
				"caste",
				"jati",
				"jati pramanpatra"
			],
			primary: [
				"caste",
				"jati",
				"cst",
				"cas"
			]
		},
		{
			type: "CASTE VALIDITY CERTIFICATE",
			code: "VAL",
			tokens: [
				"caste validity",
				"validity",
				"val",
				"vld",
				"cvc",
				"padtalni",
				"tribe validity"
			],
			primary: [
				"validity",
				"padtalni",
				"val",
				"cvc"
			]
		},
		{
			type: "DOMICILE CERTIFICATE",
			code: "DOM",
			tokens: [
				"domicile",
				"dom",
				"adivasi",
				"rahavasi",
				"residential certificate",
				"residence",
				"adhiwas"
			],
			primary: [
				"domicile",
				"dom",
				"adivasi",
				"rahavasi"
			]
		},
		{
			type: "NATIONALITY CERTIFICATE",
			code: "NAT",
			tokens: [
				"nationality",
				"nat",
				"rashtriyatva",
				"nationality proof"
			],
			primary: ["nationality", "nat"]
		},
		{
			type: "INCOME CERTIFICATE",
			code: "INC",
			patterns: [
				/\b(income|inc|utpanna)\b/i,
				/\bin\s*\(\d+\)/i,
				/\bin\./i,
				/\binc\b/i
			],
			tokens: [
				"income certificate",
				"income cert",
				"inc",
				"in",
				"utpanna",
				"tahsildar",
				"utpanna dakhla",
				"form 16"
			],
			primary: [
				"income",
				"inc",
				"utpanna"
			]
		},
		{
			type: "NON CREAMY LAYER CERTIFICATE",
			code: "NCL",
			tokens: [
				"non creamy",
				"creamy layer",
				"ncl",
				"noncreamy",
				"non criminal"
			],
			primary: [
				"ncl",
				"non creamy",
				"creamy"
			]
		},
		{
			type: "RATION CARD",
			code: "RAT",
			tokens: [
				"ration card",
				"ration",
				"rat",
				"rc",
				"shidha patrika"
			],
			primary: ["ration", "rat"]
		},
		{
			type: "PHOTO",
			code: "PIC",
			tokens: [
				"passport photo",
				"photo",
				"photograph",
				"pic",
				"image",
				"student photo"
			],
			primary: [
				"photo",
				"pic",
				"photograph"
			]
		},
		{
			type: "SIGNATURE",
			code: "SIG",
			tokens: [
				"signature",
				"sign",
				"signatur",
				"sahi",
				"student sign"
			],
			primary: [
				"signature",
				"sign",
				"signatur",
				"sahi"
			]
		},
		{
			type: "BANK PASSBOOK",
			code: "BNK",
			tokens: [
				"bank passbook",
				"passbook",
				"bank statement",
				"account",
				"passbook bank",
				"npci seeded"
			],
			primary: ["passbook", "bank"]
		},
		{
			type: "PAN CARD",
			code: "PAN",
			tokens: [
				"pan card",
				"pancard",
				"pan",
				"permanent account number"
			],
			primary: ["pan", "pancard"]
		},
		{
			type: "GAP CERTIFICATE",
			code: "GAP",
			tokens: [
				"gap certificate",
				"gap affidavit",
				"gap cert",
				"affidavit for gap",
				"educational gap"
			],
			primary: ["gap", "affidavit"]
		},
		{
			type: "BONAFIDE CERTIFICATE",
			code: "BON",
			tokens: [
				"bonafide certificate",
				"bonafide cert",
				"bonfide",
				"bnf",
				"bonafied",
				"bon"
			],
			primary: [
				"bonafide",
				"bonfide",
				"bon"
			]
		},
		{
			type: "SELF DECLARATION",
			code: "SDC",
			patterns: [
				/\bself\s*declaration\b/i,
				/\bsvayam\s*ghoshana\b/i,
				/\bsdc\b/i,
				/\bslf\b/i
			],
			tokens: [
				"self declaration",
				"undertaking",
				"declaration form",
				"pratigyapatra",
				"svayam",
				"sdc",
				"swayam ghoshnapatra"
			],
			primary: [
				"declaration",
				"undertaking",
				"self",
				"sdc"
			]
		},
		{
			type: "PARENT DECLARATION",
			code: "PDC",
			patterns: [
				/\bparent\s*(declaration|undertaking|form)\b/i,
				/\bpalak\s*(ghoshana|pratigya|pratigyapatra|declaration|undertaking)\b/i,
				/\bpdc\b/i,
				/\bhamipatra\b/i
			],
			tokens: [
				"parent declaration",
				"palak ghoshana",
				"palak declaration",
				"parent undertaking",
				"pdc",
				"hamipatra"
			],
			primary: [
				"parent declaration",
				"palak ghoshana",
				"pdc",
				"hamipatra"
			]
		},
		{
			type: "ATTEMPT CERTIFICATE",
			code: "ATM",
			tokens: [
				"attempt certificate",
				"attempt",
				"atm"
			],
			primary: ["attempt", "atm"]
		},
		{
			type: "BIRTH CERTIFICATE",
			code: "BRT",
			tokens: [
				"birth certificate",
				"janma dakhla",
				"brt",
				"birth",
				"dob proof"
			],
			primary: [
				"birth",
				"janma",
				"brt"
			]
		},
		{
			type: "CAP ALLOTMENT LETTER",
			code: "CAP",
			tokens: [
				"allotment letter",
				"cap allotment",
				"merit list",
				"cap letter",
				"admission confirmation"
			],
			primary: ["allotment", "cap"]
		},
		{
			type: "FEE RECEIPT",
			code: "FEE",
			tokens: [
				"fee receipt",
				"admission fee receipt",
				"tuition fee",
				"fee"
			],
			primary: ["fee", "receipt"]
		},
		{
			type: "ATTENDANCE CERTIFICATE",
			code: "ATT",
			tokens: [
				"attendance certificate",
				"college attendance",
				"attendance"
			],
			primary: ["attendance"]
		},
		{
			type: "HOSTEL CERTIFICATE",
			code: "HST",
			tokens: [
				"hostel certificate",
				"rent agreement",
				"private hostel proof",
				"hostel"
			],
			primary: ["hostel"]
		},
		{
			type: "DEATH CERTIFICATE",
			code: "DTH",
			tokens: [
				"death certificate",
				"father death certificate",
				"mrutyu pramanpatra",
				"death"
			],
			primary: ["death", "mrutyu"]
		},
		{
			type: "NON HOSTEL DECLARATION",
			code: "NHC",
			tokens: [
				"non hostel declaration",
				"government hostel non allotment",
				"warden letter",
				"nhc"
			],
			primary: ["non hostel", "nhc"]
		},
		{
			type: "DISABILITY CERTIFICATE",
			code: "DIS",
			tokens: [
				"disability certificate",
				"divyang",
				"pwd certificate",
				"udid",
				"dis",
				"pwd"
			],
			primary: [
				"disability",
				"divyang",
				"dis"
			]
		},
		{
			type: "APAAR ID",
			code: "APR",
			tokens: [
				"apaar id",
				"abc id",
				"academic bank of credits",
				"apaar",
				"apr"
			],
			primary: ["apaar", "apr"]
		},
		{
			type: "CET APPLICATION FORM",
			code: "CETAF",
			tokens: [
				"cet application form",
				"cet application confirmation",
				"cap registration form",
				"cetaf"
			],
			primary: ["cetaf", "cet application"]
		},
		{
			type: "CET SCORE CARD",
			code: "CETSC",
			tokens: [
				"cet score card",
				"cet result",
				"scorecard",
				"neet score card",
				"cetsc"
			],
			primary: [
				"cetsc",
				"score card",
				"scorecard"
			]
		},
		{
			type: "STATUS RETENTION FORM",
			code: "SRF",
			tokens: [
				"status retention form",
				"retention form",
				"cet retention",
				"srf"
			],
			primary: ["retention", "srf"]
		},
		{
			type: "EWS CERTIFICATE",
			code: "EWS",
			tokens: [
				"ews certificate",
				"economically weaker section",
				"ews"
			],
			primary: ["ews"]
		},
		{
			type: "MIGRATION CERTIFICATE",
			code: "MIG",
			tokens: [
				"migration certificate",
				"migration",
				"mig"
			],
			primary: ["migration", "mig"]
		},
		{
			type: "MEDICAL FITNESS CERTIFICATE",
			code: "MED",
			tokens: [
				"medical fitness certificate",
				"fitness certificate",
				"health certificate",
				"med"
			],
			primary: [
				"fitness",
				"medical",
				"med"
			]
		},
		{
			type: "VOTER ID",
			code: "VOT",
			tokens: [
				"voter id",
				"election card",
				"epic",
				"vot"
			],
			primary: ["voter", "vot"]
		},
		{
			type: "DRIVING LICENSE",
			code: "DL",
			tokens: [
				"driving license",
				"dl",
				"licence",
				"license"
			],
			primary: [
				"driving",
				"license",
				"dl"
			]
		},
		{
			type: "11TH MARKSHEET",
			code: "11M",
			tokens: [
				"11th marksheet",
				"11th mark",
				"11m"
			],
			primary: ["11th", "11m"]
		},
		{
			type: "1ST YEAR MARKSHEET",
			code: "1YM",
			tokens: [
				"1st year marksheet",
				"first year marksheet",
				"fy marksheet",
				"sem 1",
				"sem 2",
				"1ym"
			],
			primary: [
				"1st year",
				"fy marksheet",
				"1ym"
			]
		},
		{
			type: "2ND YEAR MARKSHEET",
			code: "2YM",
			tokens: [
				"2nd year marksheet",
				"second year marksheet",
				"sy marksheet",
				"sem 3",
				"sem 4",
				"2ym"
			],
			primary: [
				"2nd year",
				"sy marksheet",
				"2ym"
			]
		},
		{
			type: "3RD YEAR MARKSHEET",
			code: "3YM",
			tokens: [
				"3rd year marksheet",
				"third year marksheet",
				"ty marksheet",
				"sem 5",
				"sem 6",
				"3ym"
			],
			primary: [
				"3rd year",
				"ty marksheet",
				"3ym"
			]
		},
		{
			type: "4TH YEAR MARKSHEET",
			code: "4YM",
			tokens: [
				"4th year marksheet",
				"fourth year marksheet",
				"final year marksheet",
				"4ym"
			],
			primary: ["4th year", "4ym"]
		},
		{
			type: "PASSING CERTIFICATE",
			code: "DPC",
			tokens: [
				"passing certificate",
				"degree passing",
				"diploma passing",
				"provisional certificate",
				"dpc"
			],
			primary: ["passing", "dpc"]
		},
		{
			type: "DEGREE CERTIFICATE",
			code: "DEG",
			tokens: [
				"degree certificate",
				"convocation certificate",
				"diploma certificate",
				"deg"
			],
			primary: ["degree", "deg"]
		},
		{
			type: "REGISTRATION CERTIFICATE",
			code: "REG",
			tokens: [
				"registration certificate",
				"council registration",
				"mnc registration",
				"nursing registration",
				"reg"
			],
			primary: ["registration", "reg"]
		},
		{
			type: "INTERNSHIP CERTIFICATE",
			code: "INT",
			tokens: [
				"internship certificate",
				"internship completion",
				"clinical experience",
				"int"
			],
			primary: ["internship", "int"]
		},
		{
			type: "CHARACTER CERTIFICATE",
			code: "CHR",
			tokens: [
				"character certificate",
				"conduct certificate",
				"charitra dakhla",
				"chr"
			],
			primary: ["character", "chr"]
		},
		{
			type: "GAZETTE CERTIFICATE",
			code: "GAZ",
			tokens: [
				"gazette certificate",
				"name change gazette",
				"rajpatra",
				"marriage certificate",
				"gaz"
			],
			primary: ["gazette", "gaz"]
		},
		{
			type: "MINORITY CERTIFICATE",
			code: "MIN",
			tokens: [
				"minority certificate",
				"minority declaration",
				"alpsankhyank pramanpatra",
				"minority proof",
				"min"
			],
			primary: ["minority", "min"]
		}
	];
	if (r) {
		let e = Array.isArray(r) ? r : Object.values(r);
		for (let t of e) {
			let e = (typeof t == "string" ? t : t.name || (Array.isArray(t) ? t[0] : "")).toUpperCase();
			if (!e) continue;
			let n = (t.code || Array.isArray(t) && t[2] || "").toUpperCase(), r = t.keywords || Array.isArray(t) && t[1] || [], i = Array.isArray(r) ? r : typeof r == "string" ? r.split(",").map((e) => e.trim()) : [];
			if (!d.find((t) => t.type === e)) {
				let t = I(e), r = pe(t), a = r.size > 0 ? Array.from(r)[0] : null;
				d.push({
					type: e,
					code: n,
					tokens: [e.toLowerCase(), ...i.map((e) => e.toLowerCase())],
					primary: t.filter((e) => ![
						"certificate",
						"card",
						"form",
						"letter",
						"doc"
					].includes(e)),
					standard: a
				});
			}
		}
	}
	let f = null, p = 0;
	for (let e of d) {
		if (me(c, e.standard ? /* @__PURE__ */ new Set([e.standard]) : pe(I(e.type)))) continue;
		let t = 0;
		if (e.patterns) {
			for (let n of e.patterns) if (n.test(o)) {
				t = Math.max(t, 90);
				break;
			}
		}
		if (e.tokens) for (let n of e.tokens) {
			let e = n.toLowerCase().trim();
			if (e) {
				if (e.length <= 3) {
					if (RegExp(`(^|[^a-z0-9])${e}([^a-z0-9]|$)`, "i").test(o)) {
						t = Math.max(t, 90);
						break;
					}
				} else if (o.includes(e)) {
					t = Math.max(t, 90);
					break;
				}
			}
		}
		let n = I(e.type);
		if (n.length > 0) {
			let e = 0, r = 0;
			for (let t of n) {
				let n = fe(t);
				if (n) {
					c.has(n) && (e++, r += 1);
					continue;
				}
				let i = 0;
				for (let e of s) {
					if (e === t) {
						i = 1;
						break;
					}
					let n = F(e, t);
					n > i && (i = n);
				}
				i >= .8 && (e++, r += i);
			}
			if (e === n.length && n.length > 0) {
				let e = r / n.length, i = e >= .98 ? 95 : Math.round(80 + (e - .8) * 75);
				t = Math.max(t, i);
			} else e >= 1 && n.length <= 2 && !["card", "certificate"].includes(n[0]) && (t = Math.max(t, 50));
		}
		if (e.primary && e.qualifier) {
			let n = e.primary.some((e) => s.some((t) => t === e || F(t, e) >= .8)), r = e.qualifier.some((e) => RegExp(`(^|[^a-z0-9])${e}([^a-z0-9]|$)`, "i").test(o));
			n && r ? t = Math.max(t, 90) : n && !r && !e.standard && (t = Math.max(t, 50));
		} else e.primary && e.primary.some((e) => s.some((t) => t === e || F(t, e) >= .8)) && (t = Math.max(t, 85));
		t > p && (p = t, f = e);
	}
	if (t && t.trim() && p > 0 && t.trim().toLowerCase().split(/\s+/).filter((e) => e.length > 2).some((e) => o.includes(e)) && (p = Math.min(100, p + 5)), f && p >= 30) {
		let e = f.type.toUpperCase(), n = g[e] || e, r = n.toUpperCase(), a = i.toUpperCase().replace(/\s+/g, " ").trim(), o = !1;
		if (t && t.trim()) {
			let n = t.trim().toUpperCase().replace(/\s+/g, " ");
			(a === `${r} ${n}` || a === `${e} ${n}`) && (o = !0);
		}
		o || a !== r && a !== e || (o = !0);
		let s = o ? 100 : p;
		return {
			docType: f.type,
			canonical: n,
			code: f.code || null,
			confidence: s,
			isConfident: s >= 80,
			reason: o ? "Exact match" : `Filename token match (${s}%)`
		};
	}
	return {
		docType: null,
		canonical: null,
		code: null,
		confidence: p,
		isConfident: !1,
		reason: "Below 30% threshold"
	};
}
function R(e) {
	return e ? String(e).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;") : "";
}
function he(e, t, n = "") {
	let r = E(e), i = E(t);
	if (r === i) return {
		oldHtml: R(r),
		newHtml: R(i),
		isIdentical: !0,
		changeType: "identical"
	};
	let a = r.toLowerCase() === i.toLowerCase(), o = (n || "").replace(/\.[a-zA-Z0-9]+$/i, "").trim(), s = r.split(/(\s+|[_\-]+)/), c = i.split(/(\s+|[_\-]+)/), l = new Set(r.toLowerCase().split(/[\s_\-]+/).filter(Boolean)), u = new Set(i.toLowerCase().split(/[\s_\-]+/).filter(Boolean)), d = new Set(o ? o.toLowerCase().split(/[\s_\-]+/).filter(Boolean) : []), f = s.map((e) => {
		if (!e.trim() || /^[_\-]+$/.test(e)) return R(e);
		let t = e.toLowerCase();
		return u.has(t) ? `<span class="text-secondary">${R(e)}</span>` : `<span class="diff-del">${R(e)}</span>`;
	}), p = [], m = o.toLowerCase(), h = i;
	if (o && h.toLowerCase().includes(m)) {
		let e = h.toLowerCase().indexOf(m), t = h.slice(0, e), n = h.slice(e, e + m.length), r = h.slice(e + m.length), i = (e) => e.split(/(\s+|[_\-]+)/).map((e) => {
			if (!e.trim() || /^[_\-]+$/.test(e)) return R(e);
			let t = e.toLowerCase();
			return l.has(t) ? `<span class="text-on-surface font-semibold">${R(e)}</span>` : `<span class="diff-add">${R(e)}</span>`;
		}).join("");
		p.push(i(t)), p.push(`<span class="diff-student">${R(n)}</span>`), p.push(i(r));
	} else p = c.map((e) => {
		if (!e.trim() || /^[_\-]+$/.test(e)) return R(e);
		let t = e.toLowerCase();
		return d.has(t) ? `<span class="diff-student">${R(e)}</span>` : l.has(t) ? `<span class="text-on-surface font-semibold">${R(e)}</span>` : `<span class="diff-add">${R(e)}</span>`;
	});
	let g = "rename";
	return a ? g = "casing" : o && i.toLowerCase().includes(m) && !r.toLowerCase().includes(m) && (g = "student"), {
		oldHtml: f.join(""),
		newHtml: p.join(""),
		isIdentical: !1,
		changeType: g
	};
}
function ge(e, t, n = {}) {
	let { order: r = "doc_student", separator: i = " ", includeStudent: a = !0, casing: o = "upper" } = n, s = (e || "").trim(), c = (t || "").trim(), l = [];
	return l = a && c ? r === "student_doc" ? [c, s] : [s, c] : [s], O(l.filter(Boolean).join(i), o);
}
function _e(e) {
	if (!e) return "";
	let t = E(e);
	return t = t.replace(/WhatsApp\s*Image\s*\d{4}[-_]\d{2}[-_]\d{2}\s*(at\s*[\d\.]+)?/gi, ""), t = t.replace(/(IMG|VID|DOC)[-_]\d{8}[-_]\d{4,6}/gi, ""), t = t.replace(/\bSCAN\s*\(\d+\)/gi, ""), t = t.replace(/\bSCAN[-_]?\d+/gi, ""), t = t.replace(/\(\s*\)/g, ""), t = t.replace(/[_\-]+/g, " "), t = t.replace(/\s+/g, " ").trim(), t;
}
function ve(e) {
	if (!e) return "";
	let t = E(e);
	return t = t.replace(/[^a-zA-Z0-9\s\-_]/g, " "), t = t.replace(/\s+/g, " ").trim(), t;
}
// src/core/constants.js
var ye = {
	marskheet: "marksheet",
	markshet: "marksheet",
	markshit: "marksheet",
	pasing: "passing",
	pasingg: "passing",
	aadhhar: "aadhaar",
	adhar: "aadhaar",
	aadhar: "aadhaar",
	bonafied: "bonafide",
	bonafidee: "bonafide",
	domocile: "domicile",
	pasbook: "passbook",
	pasbok: "passbook",
	incom: "income",
	incme: "income",
	certifcte: "certificate",
	certifcate: "certificate",
	certificte: "certificate",
	certficate: "certificate",
	certifitcate: "certificate",
	atempt: "attempt",
	attmpt: "attempt",
	phot: "photo"
}, be = [
	{
		id: "12th-marksheet-passing-link",
		part1: "12TH MARKSHEET",
		part2: "12TH PASSING CERTIFICATE",
		combined: "12TH MARKSHEET AND PASSING",
		type: "combined"
	},
	{
		id: "10th-marksheet-passing-link",
		part1: "10TH MARKSHEET",
		part2: "10TH PASSING CERTIFICATE",
		combined: "10TH MARKSHEET AND PASSING",
		type: "combined"
	},
	{
		id: "domicile-nationality-link",
		part1: "DOMICILE CERTIFICATE",
		part2: "NATIONALITY CERTIFICATE",
		combined: "DOMICILE AND NATIONALITY CERTIFICATE",
		type: "combined"
	},
	{
		id: "lc-tc-alias",
		part1: "12TH LC",
		part2: "12TH TC",
		combined: "12TH LC",
		type: "alias"
	}
], xe = "2026.11.passing_canonical_v2", z = {
	"MAHA DBT FORM": [
		["AADHAAR CARD", ["aadhaar card"]],
		["PHOTO", ["photo"]],
		["10TH MARKSHEET", ["10th marksheet"]],
		["10TH PASSING CERTIFICATE", ["10th passing certificate", "10th passing"]],
		["12TH MARKSHEET", ["12th marksheet"]],
		["12TH PASSING CERTIFICATE", ["12th passing certificate", "12th passing"]],
		["12TH LC", ["12th lc"]],
		["CASTE CERTIFICATE", ["caste certificate"]],
		["VALIDITY CERTIFICATE", ["validity certificate"]],
		["INCOME CERTIFICATE", ["income certificate"]],
		["NATIONALITY CERTIFICATE", ["nationality certificate"]],
		["DOMICILE CERTIFICATE", ["domicile certificate"]],
		["PASSBOOK BANK", ["passbook bank", "bank passbook"]]
	],
	"MH CET FORM": [
		["PHOTO", ["photo"]],
		["AADHAAR CARD", ["aadhaar card"]],
		["10TH MARKSHEET", ["10th marksheet"]],
		["10TH PASSING CERTIFICATE", ["10th passing certificate", "10th passing"]],
		["12TH MARKSHEET", ["12th marksheet"]],
		["12TH PASSING CERTIFICATE", ["12th passing certificate", "12th passing"]],
		["12TH LC", ["12th lc"]],
		["CASTE CERTIFICATE", ["caste certificate"]],
		["VALIDITY CERTIFICATE", ["validity certificate"]],
		["DOMICILE CERTIFICATE", ["domicile certificate"]],
		["NATIONALITY CERTIFICATE", ["nationality certificate"]],
		["INCOME CERTIFICATE", ["income certificate"]],
		["ATTEMPT CERTIFICATE", ["attempt certificate"]]
	],
	"SWAYAM FORM": [
		["PHOTO", ["photo"]],
		["AADHAAR CARD", ["aadhaar card"]],
		["10TH MARKSHEET", ["10th marksheet"]],
		["12TH MARKSHEET", ["12th marksheet"]],
		["12TH LC", ["12th lc"]],
		["CASTE CERTIFICATE", ["caste certificate"]],
		["DOMICILE CERTIFICATE", ["domicile certificate"]],
		["SELF DECLARATION", ["self declaration"]],
		["PARENT DECLARATION", ["parent declaration"]],
		["PASSBOOK BANK", ["passbook bank", "bank passbook"]],
		["BONAFIDE CERTIFICATE", ["bonafide certificate"]]
	]
}, Se = {
	"MAHA DBT FORM": [
		"AADHAAR CARD",
		"PHOTO",
		"10TH MARKSHEET",
		"10TH PASSING CERTIFICATE",
		"12TH MARKSHEET",
		"12TH PASSING CERTIFICATE",
		"12TH LC",
		"CASTE CERTIFICATE",
		"VALIDITY CERTIFICATE",
		"INCOME CERTIFICATE",
		"NATIONALITY CERTIFICATE",
		"DOMICILE CERTIFICATE",
		"PASSBOOK BANK"
	],
	"MH CET FORM": [
		"PHOTO",
		"AADHAAR CARD",
		"10TH MARKSHEET",
		"10TH PASSING CERTIFICATE",
		"12TH MARKSHEET",
		"12TH PASSING CERTIFICATE",
		"12TH LC",
		"CASTE CERTIFICATE",
		"VALIDITY CERTIFICATE",
		"DOMICILE CERTIFICATE",
		"NATIONALITY CERTIFICATE",
		"INCOME CERTIFICATE",
		"ATTEMPT CERTIFICATE"
	],
	"SWAYAM / DEEN DAYAL SCHEME": [
		"PHOTO",
		"AADHAAR CARD",
		"10TH MARKSHEET",
		"11TH MARKSHEET",
		"12TH MARKSHEET",
		"12TH LC",
		"CASTE CERTIFICATE",
		"VALIDITY CERTIFICATE",
		"DOMICILE CERTIFICATE",
		"SELF DECLARATION",
		"PARENT DECLARATION",
		"PASSBOOK BANK",
		"BONAFIDE CERTIFICATE"
	]
}, B = {
	name: "BulkStudentRenamerSettingsDB",
	version: 1,
	store: "settings",
	key: "current"
}, Ce = [
	{
		id: "aadhaar-card",
		displayName: "Aadhaar Card",
		primaryShortcut: "ADR",
		alternateKeywords: [],
		outputName: "AADHAAR CARD"
	},
	{
		id: "pan-card",
		displayName: "PAN Card",
		primaryShortcut: "PAN",
		alternateKeywords: [],
		outputName: "PAN CARD"
	},
	{
		id: "photo",
		displayName: "Student Photo",
		primaryShortcut: "PIC",
		alternateKeywords: [],
		outputName: "PHOTO"
	},
	{
		id: "10th-marksheet",
		displayName: "10th Marksheet",
		primaryShortcut: "10M",
		alternateKeywords: [],
		outputName: "10TH MARKSHEET"
	},
	{
		id: "10th-passing",
		displayName: "10th Passing Certificate",
		primaryShortcut: "10P",
		alternateKeywords: [],
		outputName: "10TH PASSING CERTIFICATE"
	},
	{
		id: "11th-marksheet",
		displayName: "11th Marksheet",
		primaryShortcut: "11M",
		alternateKeywords: [],
		outputName: "11TH MARKSHEET"
	},
	{
		id: "11th-passing",
		displayName: "11th Passing Certificate",
		primaryShortcut: "11P",
		alternateKeywords: [],
		outputName: "11TH PASSING CERTIFICATE"
	},
	{
		id: "10th-lc",
		displayName: "10th Leaving Certificate (LC)",
		primaryShortcut: "10LC",
		alternateKeywords: [],
		outputName: "10TH LC"
	},
	{
		id: "10th-marksheet-passing-combined",
		displayName: "10th Marksheet and Passing Combined",
		primaryShortcut: "10MP",
		alternateKeywords: [],
		outputName: "10TH MARKSHEET AND PASSING"
	},
	{
		id: "apaar-id",
		displayName: "APAAR ID / ABC ID",
		primaryShortcut: "APAAR",
		alternateKeywords: [],
		outputName: "APAAR ID"
	},
	{
		id: "degree-certificate",
		displayName: "Degree Certificate",
		primaryShortcut: "DEG",
		alternateKeywords: [],
		outputName: "DEGREE CERTIFICATE"
	},
	{
		id: "registration-certificate",
		displayName: "Registration Certificate (Nursing/Council)",
		primaryShortcut: "REG",
		alternateKeywords: [],
		outputName: "REGISTRATION CERTIFICATE"
	},
	{
		id: "ration-card",
		displayName: "Ration Card",
		primaryShortcut: "RAT",
		alternateKeywords: [],
		outputName: "RATION CARD"
	},
	{
		id: "12th-marksheet",
		displayName: "12th Marksheet",
		primaryShortcut: "12M",
		alternateKeywords: [],
		outputName: "12TH MARKSHEET"
	},
	{
		id: "12th-passing",
		displayName: "12th Passing Certificate",
		primaryShortcut: "12P",
		alternateKeywords: [],
		outputName: "12TH PASSING CERTIFICATE"
	},
	{
		id: "12th-lc",
		displayName: "12th Leaving Certificate (LC)",
		primaryShortcut: "12LC",
		alternateKeywords: [],
		outputName: "12TH LC"
	},
	{
		id: "12th-marksheet-passing-combined",
		displayName: "12th Marksheet & Passing Combined",
		primaryShortcut: "12MP",
		alternateKeywords: [],
		outputName: "12TH MARKSHEET AND PASSING"
	},
	{
		id: "caste-certificate",
		displayName: "Caste Certificate",
		primaryShortcut: "CST",
		alternateKeywords: ["CAST"],
		outputName: "CASTE CERTIFICATE"
	},
	{
		id: "validity-certificate",
		displayName: "Caste Validity Certificate",
		primaryShortcut: "VLD",
		alternateKeywords: [],
		outputName: "VALIDITY CERTIFICATE"
	},
	{
		id: "domicile-certificate",
		displayName: "Domicile Certificate",
		primaryShortcut: "DOM",
		alternateKeywords: ["DOMI"],
		outputName: "DOMICILE CERTIFICATE"
	},
	{
		id: "nationality-certificate",
		displayName: "Nationality Certificate",
		primaryShortcut: "NAT",
		alternateKeywords: ["NATI"],
		outputName: "NATIONALITY CERTIFICATE"
	},
	{
		id: "income-certificate",
		displayName: "Income Certificate",
		primaryShortcut: "INC",
		alternateKeywords: ["INCO"],
		outputName: "INCOME CERTIFICATE"
	},
	{
		id: "bank-passbook",
		displayName: "Bank Passbook",
		primaryShortcut: "BNK",
		alternateKeywords: ["PASS"],
		outputName: "PASSBOOK BANK"
	},
	{
		id: "attempt-certificate",
		displayName: "Attempt Certificate",
		primaryShortcut: "ATM",
		alternateKeywords: [],
		outputName: "ATTEMPT CERTIFICATE"
	},
	{
		id: "birth-certificate",
		displayName: "Birth Certificate",
		primaryShortcut: "BRT",
		alternateKeywords: ["BIR"],
		outputName: "BIRTH CERTIFICATE"
	},
	{
		id: "bonafide-certificate",
		displayName: "Bonafide Certificate",
		primaryShortcut: "BNF",
		alternateKeywords: ["BONA"],
		outputName: "BONAFIDE CERTIFICATE"
	},
	{
		id: "gap-certificate",
		displayName: "Gap Certificate",
		primaryShortcut: "GAP",
		alternateKeywords: [],
		outputName: "GAP CERTIFICATE"
	},
	{
		id: "self-declaration",
		displayName: "Self Declaration",
		primaryShortcut: "SLF",
		alternateKeywords: ["SELF"],
		outputName: "SELF DECLARATION"
	},
	{
		id: "parent-declaration",
		displayName: "Parent Declaration",
		primaryShortcut: "PAR",
		alternateKeywords: ["PART"],
		outputName: "PARENT DECLARATION"
	},
	{
		id: "cap-allotment",
		displayName: "CAP Allotment Letter",
		primaryShortcut: "CAP",
		alternateKeywords: [],
		outputName: "CAP ALLOTMENT LETTER"
	}
];
function we(e = Ce) {
	let t = {};
	for (let n of e) t[n.outputName] = [n.primaryShortcut.toLowerCase(), ...(n.alternateKeywords || []).map((e) => e.toLowerCase())];
	return t;
}
// src/libraries/checklist-library.js
function Te(e) {
	return Object.fromEntries(Object.entries(e).map(([e, t]) => [e, t.map((e) => Array.isArray(e) ? {
		name: e[0],
		keywords: e[1],
		short: e[0].replace(/ CERTIFICATE| MARK SHEET| MARKSHEET/g, "").slice(0, 18)
	} : e)]));
}
// src/services/storage-service.js
var Ee = "v3_exact_single", V = we(), H = (e, t) => {
	try {
		let n = localStorage.getItem(e);
		return n ? JSON.parse(n) : t;
	} catch {
		return t;
	}
}, U = (e, t) => {
	try {
		localStorage.setItem(e, JSON.stringify(t));
	} catch {}
}, De = (e) => {
	let t = {};
	Object.entries(e || {}).forEach(([e, n]) => {
		let r = /^12\s*LC$/i.test(e) || e === "12TH LEAVING CERTIFICATE" ? "12TH LC" : e;
		t[r] = [...t[r] || [], ...Array.isArray(n) ? n : []].filter((e, t, n) => n.indexOf(e) === t);
	});
	let n = {};
	return Object.entries(t).forEach(([e, r]) => {
		e !== "12TH MARKSHEET AND PASSING" && (n[e] = r, e === "12TH PASSING CERTIFICATE" && t["12TH MARKSHEET AND PASSING"] && (n["12TH MARKSHEET AND PASSING"] = t["12TH MARKSHEET AND PASSING"]));
	}), n;
}, Oe = (e) => {
	let t = e.name === "12TH LEAVING CERTIFICATE" ? "12TH LC" : e.name;
	return {
		...e,
		name: t,
		keywords: [...new Set(e.keywords || [])],
		short: e.short || t.slice(0, 18)
	};
}, ke = (e) => {
	let t = e.filter((e) => e.name === "12TH MARKSHEET AND PASSING");
	if (!t.length) return e;
	let n = e.filter((e) => e.name !== "12TH MARKSHEET AND PASSING"), r = n.findIndex((e) => e.name === "12TH PASSING CERTIFICATE");
	return n.splice(r < 0 ? n.length : r + 1, 0, ...t), n;
}, Ae = (e) => {
	let t = Te(z), n = e || {}, r = {};
	return Object.keys(t).forEach((e) => {
		let i = Array.isArray(n[e]) ? n[e].map(Oe) : [], a = new Map(i.map((e) => [e.name.toUpperCase(), e]));
		t[e].forEach((e) => {
			let t = Oe(e);
			a.has(t.name.toUpperCase()) || i.push(t);
		}), r[e] = ke(i);
	}), Object.entries(n).forEach(([e, t]) => {
		r[e] || (r[e] = ke(t.map(Oe)));
	}), r;
};
function je() {
	let e = localStorage.getItem("dictVersion"), t, n;
	e === Ee ? (t = De(H("renameSettings", V)), n = H("renameProfiles", { Default: V })) : (t = V, n = { Default: V }, U("renameSettings", t), U("renameProfiles", n), localStorage.setItem("dictVersion", Ee));
	let r = localStorage.getItem("checklistVersion"), i;
	r === "2026.11.passing_canonical_v2" ? i = Ae(H("checklists", null)) : (i = Te(z), U("checklists", i), localStorage.setItem("checklistVersion", xe));
	let a = {
		...ye,
		...H("spellingCorrections", {}) || {}
	}, o = H("linkedRules", be);
	return {
		groups: t,
		checklists: i,
		spelling: a,
		profiles: n,
		linkedRules: o,
		style: localStorage.getItem("nameStyle") || "preserve",
		active: Object.keys(n)[0] || "Default"
	};
}
function Me() {
	return new Promise((e, t) => {
		if (!("indexedDB" in window)) return t(/* @__PURE__ */ Error("IndexedDB unavailable"));
		let n = indexedDB.open(B.name, B.version);
		n.onupgradeneeded = () => {
			n.result.objectStoreNames.contains(B.store) || n.result.createObjectStore(B.store);
		}, n.onsuccess = () => e(n.result), n.onerror = () => t(n.error || /* @__PURE__ */ Error("IndexedDB open failed"));
	});
}
function Ne(e) {
	return Me().then((t) => new Promise((n, r) => {
		let i = t.transaction(B.store, "readwrite");
		i.objectStore(B.store).put(e, B.key), i.oncomplete = () => n(!0), i.onerror = () => r(i.error);
	}));
}
function W(e) {
	let t = {
		groups: e.groups,
		checklists: e.checklists,
		spelling: e.spelling,
		profiles: e.profiles,
		linkedRules: e.linkedRules,
		style: e.style,
		savedAt: (/* @__PURE__ */ new Date()).toISOString()
	};
	U("renameSettings", t.groups), U("checklists", t.checklists), U("spellingCorrections", t.spelling), U("renameProfiles", t.profiles), U("linkedRules", t.linkedRules), localStorage.setItem("nameStyle", t.style), Ne(t).catch(() => {});
}
async function Pe() {
	try {
		let e = await (await fetch("http://localhost:3000/api/load-document-presets")).json();
		if (e && e.success && e.data && e.data.forms) return e.data;
	} catch (e) {
		console.warn("[StorageService] Failed to load document presets from backend:", e);
	}
	return H("documentPresets", { forms: z });
}
async function Fe(e) {
	U("documentPresets", e);
	try {
		await fetch("http://localhost:3000/api/save-document-presets", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(e)
		});
	} catch (e) {
		console.warn("[StorageService] Failed to persist document presets to disk:", e);
	}
}
// src/services/followup-service.js
var Ie = "studentDocumentFollowUps", Le = [];
function G() {
	try {
		if (typeof localStorage < "u") {
			let e = localStorage.getItem(Ie);
			return e ? JSON.parse(e) : [];
		}
		return Le;
	} catch {
		return Le;
	}
}
function K(e) {
	try {
		Le = e, typeof localStorage < "u" && localStorage.setItem(Ie, JSON.stringify(e));
	} catch (e) {
		console.error("Failed to save follow-ups:", e);
	}
}
function q({ folderName: e, studentName: t, documentName: n, promisedDate: r, note: i = "" }) {
	let a = G(), o = (e || "").trim(), s = (n || "").trim().toUpperCase(), c = (t || e || "").trim(), l = a.findIndex((e) => e.folderName.toLowerCase() === o.toLowerCase() && e.documentName.toUpperCase() === s && e.status === "pending"), u = Date.now();
	if (l >= 0) return a[l].promisedDate = r, a[l].note = i, a[l].updatedAt = u, K(a), a[l];
	let d = {
		id: `fu_${u}_${Math.random().toString(36).slice(2, 7)}`,
		folderName: o,
		studentName: c,
		documentName: s,
		promisedDate: r || Ve(),
		note: i || "",
		status: "pending",
		createdAt: u,
		resolvedAt: null
	};
	return a.push(d), K(a), d;
}
function Re(e, t) {
	let n = G(), r = (e || "").trim().toLowerCase(), i = (t || "").trim().toUpperCase(), a = !1;
	return n.forEach((e) => {
		e.folderName.trim().toLowerCase() === r && e.documentName.trim().toUpperCase() === i && e.status === "pending" && (e.status = "resolved", e.resolvedAt = Date.now(), a = !0);
	}), a && K(n), a;
}
function ze(e, t) {
	let n = G(), r = (e || "").trim().toLowerCase(), i = (t || "").trim().toUpperCase();
	return n.find((e) => e.folderName.trim().toLowerCase() === r && e.documentName.trim().toUpperCase() === i && e.status === "pending") || null;
}
function Be(e, t = Y()) {
	let n = Ue(e, t);
	return n < 0 ? "overdue" : n === 0 ? "today" : "upcoming";
}
function J(e) {
	if (!e) return "";
	let t = e.split("-");
	return t.length === 3 ? new Date(Number(t[0]), Number(t[1]) - 1, Number(t[2])).toLocaleDateString("en-IN", {
		day: "numeric",
		month: "short",
		year: "numeric"
	}) : e;
}
function Y() {
	let e = /* @__PURE__ */ new Date();
	return `${e.getFullYear()}-${String(e.getMonth() + 1).padStart(2, "0")}-${String(e.getDate()).padStart(2, "0")}`;
}
function Ve(e = 1) {
	let t = /* @__PURE__ */ new Date();
	return t.setDate(t.getDate() + e), `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}
function He() {
	let e = /* @__PURE__ */ new Date(), t = (1 - e.getDay() + 7) % 7 || 7;
	return e.setDate(e.getDate() + t), `${e.getFullYear()}-${String(e.getMonth() + 1).padStart(2, "0")}-${String(e.getDate()).padStart(2, "0")}`;
}
function Ue(e, t) {
	return e === t ? 0 : e < t ? -1 : 1;
}
// tools/rename_tool/rename_tool_ui.js
function We() {
	if (typeof window < "u") {
		if (window.__TAURI__?.core?.invoke) return window.__TAURI__.core.invoke;
		if (window.__TAURI_INTERNALS__?.invoke) return window.__TAURI_INTERNALS__.invoke;
		if (window.__TAURI__?.invoke) return window.__TAURI__.invoke;
	}
	return null;
}
function X(e) {
	if (!e) return null;
	if (e._blobUrl) return e._blobUrl;
	if (typeof e.url == "string" && (e.url.startsWith("blob:") || e.url.startsWith("data:"))) return e.url;
	if (e.fileObj && typeof URL < "u" && URL.createObjectURL) try {
		return e._blobUrl = URL.createObjectURL(e.fileObj), e.url = e._blobUrl, e.url;
	} catch {}
	let t = e.path || e.name || "";
	if (typeof window < "u") {
		let n = window.__TAURI__?.core?.convertFileSrc || window.__TAURI__?.tauri?.convertFileSrc || window.__TAURI_INTERNALS__?.convertFileSrc;
		if (typeof n == "function" && t && (t.includes(":") || t.startsWith("/"))) {
			let r = n(t);
			if (r) return e.url = r, r;
		}
	}
	if (t) {
		let n = "http://localhost:3000";
		if (typeof window < "u" && window.location && window.location.origin) {
			let e = window.location.origin;
			!e.startsWith("file:") && !e.includes("tauri") && (n = e);
		}
		let r = `${n}/api/serve-file?path=${encodeURIComponent(t)}`;
		return e.url = e.url || r, r;
	}
	return e.url || null;
}
function Z(e) {
	if (!e) return !0;
	let t = e.toLowerCase().trim();
	return !!(t === "thumbs.db" || t === "ehthumbs.db" || t === "desktop.ini" || t === ".ds_store" || t.startsWith(".") || t.startsWith("~$") || t.endsWith(".tmp"));
}
function Ge(e) {
	let t = (e || "").toUpperCase().trim();
	return [
		"ADR",
		"PAN",
		"PIC",
		"SIG",
		"VOT",
		"DL",
		"UID",
		"APR"
	].includes(t) ? "bg-blue-600 text-white font-extrabold" : [
		"10M",
		"10P",
		"10MP",
		"11M",
		"12M",
		"12P",
		"12LC",
		"12MP",
		"1YM",
		"2YM",
		"3YM",
		"4YM",
		"PYM",
		"DPC",
		"DEG",
		"REG",
		"INT",
		"CHR",
		"ATM",
		"BNF",
		"BRT"
	].includes(t) ? "bg-emerald-700 text-white font-extrabold" : [
		"CST",
		"VAL",
		"NCL",
		"VLD"
	].includes(t) ? "bg-purple-700 text-white font-extrabold" : [
		"INC",
		"DOM",
		"NAT",
		"BNK",
		"RAT",
		"EWS"
	].includes(t) ? "bg-amber-600 text-white font-extrabold" : [
		"SDC",
		"PDC",
		"GAP",
		"SLF",
		"PAR",
		"NHC",
		"DIS",
		"PWD",
		"MED",
		"GAZ",
		"MIN",
		"DTH",
		"CETAF",
		"CETSC",
		"SRF",
		"CAP",
		"BON",
		"FEE",
		"ATT",
		"HST"
	].includes(t) ? "bg-slate-700 text-white font-extrabold" : "bg-primary text-on-primary font-extrabold";
}
var Ke = b.map((e) => ({
	code: e.primaryShortcut,
	codes: [e.primaryShortcut],
	label: e.outputName,
	canonical: e.outputName,
	keywords: Array.isArray(e.alternateKeywords) ? [...e.alternateKeywords] : []
})), qe = new Map(Ke.map((e) => [e.code, e])), Je = {
	"MAHA DBT": (/* @__PURE__ */ "PIC.SIG.ADR.10M.10P.10MP.12M.12P.12MP.12LC.PYM.CST.VAL.NCL.INC.DOM.NAT.RAT.BNK.CAP.BON.FEE.ATT.HST.GAP.SDC.PDC.DTH".split(".")).map((e) => {
		let t = qe.get(e);
		return {
			name: t.canonical,
			code: t.code,
			keywords: [...t.keywords]
		};
	}),
	"SWAYAM DEENDAYAL YOJANA": [
		"PIC",
		"SIG",
		"ADR",
		"10M",
		"10MP",
		"12M",
		"12MP",
		"12LC",
		"PYM",
		"CST",
		"VAL",
		"DOM",
		"INC",
		"BNK",
		"BON",
		"CAP",
		"ATT",
		"HST",
		"NHC",
		"SDC",
		"PDC",
		"DIS"
	].map((e) => {
		let t = qe.get(e);
		return {
			name: t.canonical,
			code: t.code,
			keywords: [...t.keywords]
		};
	}),
	"CET CELL": (/* @__PURE__ */ "PIC.SIG.ADR.APR.CETAF.CETSC.CAP.SRF.10M.10P.10MP.12M.12P.12MP.12LC.DOM.NAT.CST.VAL.NCL.EWS.INC.GAP.MIG.MED.BRT".split(".")).map((e) => {
		let t = qe.get(e);
		return {
			name: t.canonical,
			code: t.code,
			keywords: [...t.keywords]
		};
	}),
	"EDUCATIONAL DOCUMENTS": (/* @__PURE__ */ "PIC.SIG.ADR.10M.10P.10MP.12M.12P.12MP.12LC.PYM.CST.VAL.NCL.INC.DOM.NAT.RAT.BNK.CAP.BON.FEE.ATT.HST.GAP.SDC.PDC.DTH.NHC.DIS.APR.CETAF.CETSC.SRF.EWS.MIG.MED.BRT.PAN.VOT.DL.11M.1YM.2YM.3YM.4YM.DPC.DEG.REG.INT.CHR.GAZ.MIN".split(".")).map((e) => {
		let t = qe.get(e);
		return {
			name: t.canonical,
			code: t.code,
			keywords: [...t.keywords]
		};
	})
}, Ye = class {
	constructor() {
		this.state = {
			folder: null,
			subfolders: [],
			currentSubfolderIndex: 0,
			files: [],
			currentIndex: 0,
			studentName: "",
			style: "preserve",
			settings: null,
			documentPresets: null,
			activePreset: "MAHA DBT",
			customShortcuts: [],
			history: [],
			zoom: 100,
			rotation: 0,
			panEnabled: !1,
			splitCompare: !1,
			watcherActive: !0,
			lastMtimeCheck: 0,
			currentPdfPage: 1,
			totalPdfPages: 1,
			activePdfDoc: null,
			activePdfUrl: null,
			isSmartScanning: !1,
			isMissingDocsCollapsed: !0
		}, this._scanAbortController = null, this.shortcuts21 = JSON.parse(JSON.stringify(Ke)), this._presetDocsSearchQuery = "", this._shortcutsSearchQuery = "";
	}
	init() {
		this.state.settings = je(), this.loadPresetsAndSettings();
		let e = localStorage.getItem("docmitra_casing_style");
		this.state.style = e && [
			"upper",
			"title",
			"lower"
		].includes(e.toLowerCase()) ? e.toLowerCase() : "upper", this._bindDOM(), this._bindKeyboardShortcuts(), this._startBackgroundWatcher(), window.addEventListener("storage", (e) => {
			if (e.key === "docmitra_settings" || e.key === "docmitra_casing_style" || e.key === "docmitra_active_preset") {
				this.state.settings = je();
				let e = localStorage.getItem("docmitra_casing_style");
				this.state.style = e && [
					"upper",
					"title",
					"lower"
				].includes(e.toLowerCase()) ? e.toLowerCase() : "upper", this.loadPresetsAndSettings(), this._recalculateTargetNames(!0), this.renderQueue(), this.renderCurrentPreview();
			}
		}), console.info("[DocMitra Renamer] Renamer UI manager initialized."), typeof window < "u" && (window.location.search.includes("test_mode=1") || window.__DOCMITRA_TEST_MODE__) && this._initTestModeData();
	}
	_initTestModeData() {
		console.info("[DocMitra Renamer] Test mode active (?test_mode=1). Loading mock dataset..."), this.loadFolderData({
			name: "Vijay_Ramesh_Yadav",
			path: "E:/College/Admission_2026/FYJC/Vijay_Ramesh_Yadav",
			files: [
				{
					name: "10th_marksheet.pdf",
					path: "E:/College/Admission_2026/FYJC/Vijay_Ramesh_Yadav/10th_marksheet.pdf",
					size: 154200,
					ext: ".pdf"
				},
				{
					name: "aadhaar_card_front.jpg",
					path: "E:/College/Admission_2026/FYJC/Vijay_Ramesh_Yadav/aadhaar_card_front.jpg",
					size: 21e4,
					ext: ".jpg"
				},
				{
					name: "caste_certificate.pdf",
					path: "E:/College/Admission_2026/FYJC/Vijay_Ramesh_Yadav/caste_certificate.pdf",
					size: 18e4,
					ext: ".pdf"
				},
				{
					name: "12th_hsc_marksheet.pdf",
					path: "E:/College/Admission_2026/FYJC/Vijay_Ramesh_Yadav/12th_hsc_marksheet.pdf",
					size: 165e3,
					ext: ".pdf"
				},
				{
					name: "domicile_certificate.pdf",
					path: "E:/College/Admission_2026/FYJC/Vijay_Ramesh_Yadav/domicile_certificate.pdf",
					size: 195e3,
					ext: ".pdf"
				},
				{
					name: "leaving_certificate_tc.pdf",
					path: "E:/College/Admission_2026/FYJC/Vijay_Ramesh_Yadav/leaving_certificate_tc.pdf",
					size: 14e4,
					ext: ".pdf"
				},
				{
					name: "unrecognized_scan_img_0099.pdf",
					path: "E:/College/Admission_2026/FYJC/Vijay_Ramesh_Yadav/unrecognized_scan_img_0099.pdf",
					size: 98e3,
					ext: ".pdf"
				}
			]
		});
	}
	_bindDOM() {
		let e = document.getElementById("btnSelectFolder");
		e && e.addEventListener("click", () => this.handleSelectFolder());
		let t = document.getElementById("chkIncludeFolderName");
		if (t) {
			let e = localStorage.getItem("docmitra_include_folder_name");
			e !== null && (t.checked = e === "true"), t.addEventListener("change", () => {
				localStorage.setItem("docmitra_include_folder_name", String(t.checked)), this._recalculateTargetNames(!0), this.renderQueue(), this.renderCurrentPreview(), this.updateTelemetry();
				let e = t.checked ? "Folder name included in files" : "Folder name removed from files";
				r.show("Filename Setting", e, "info");
			});
		}
		let n = document.getElementById("btnEditFolderName"), i = document.getElementById("btnApplyFolderName"), a = document.getElementById("displayFolderName"), o = document.getElementById("inputEditFolderName");
		if (n && o && a) {
			n.addEventListener("click", () => {
				o.value = this.state.studentName || this.state.folder?.name || "", a.classList.add("hidden"), n.classList.add("hidden"), o.classList.remove("hidden"), i && i.classList.remove("hidden"), o.focus(), o.select();
			});
			let e = async () => {
				let e = o.value.trim(), t = this.state.studentName || this.state.folder?.name || "", s = this.state.folder && (this.state.folder.nativePath || this.state.folder.path) || "";
				if (o.classList.add("hidden"), i && i.classList.add("hidden"), a.classList.remove("hidden"), n.classList.remove("hidden"), !e || e === t) return;
				if (this.state.studentName = e, a.textContent = e, a.title = e, s) try {
					let t = await f(s, e);
					if (t && t.success) {
						let n = t.newPath || t.path;
						if (n) {
							let t = s.replace(/\\/g, "/").toLowerCase(), r = n.replace(/\\/g, "/");
							this.state.folder && (this.state.folder.name = e, this.state.folder.path = n, this.state.folder.nativePath = n);
							for (let e of this.state.files) if (e.path) {
								let n = e.path.replace(/\\/g, "/");
								n.toLowerCase().startsWith(t) && (e.path = r + n.slice(t.length), e.nativePath &&= e.path);
							}
						}
					} else t && t.error && console.warn("[DocMitra] Physical folder rename notice:", t.error);
				} catch (e) {
					console.warn("[DocMitra] Physical folder rename error:", e);
				}
				let c = document.getElementById("chkIncludeFolderName");
				(!c || c.checked) && (this._recalculateTargetNames(!0), this.renderQueue(), this.renderCurrentPreview()), this.updateTelemetry(), r.show("Folder Renamed", `Folder name updated to: ${e}`, "success");
			};
			i && i.addEventListener("click", e), o.addEventListener("keydown", (t) => {
				t.key === "Enter" ? (t.preventDefault(), e()) : t.key === "Escape" && (o.classList.add("hidden"), i && i.classList.add("hidden"), a.classList.remove("hidden"), n.classList.remove("hidden"));
			});
		}
		let s = document.getElementById("btnRenameAll");
		s && s.addEventListener("click", () => this.handleRenameAll());
		let c = document.getElementById("btnUndoRename");
		c && c.addEventListener("click", () => this.handleUndo());
		let l = document.getElementById("btnKeepOriginal");
		l && l.addEventListener("click", () => this.handleKeepOriginal());
		let u = document.getElementById("btnSaveBatch");
		u && u.addEventListener("click", () => this.handleSaveBatch());
		let d = document.getElementById("btnExportAudit");
		d && d.addEventListener("click", () => this.handleExportAudit());
		let p = document.getElementById("btnSmartScanBatch");
		p && p.addEventListener("click", () => this.handleSmartScanBatch());
		let m = document.getElementById("btnRenameMatched");
		m && m.addEventListener("click", () => this.openCrossCheckModal());
		let h = document.getElementById("btnCloseAddDocModal");
		h && h.addEventListener("click", () => this.closeAddDocumentModal());
		let g = document.getElementById("btnCancelAddDoc");
		g && g.addEventListener("click", () => this.closeAddDocumentModal());
		let _ = document.getElementById("btnSaveAddDoc");
		_ && _.addEventListener("click", () => this.handleSaveDocumentType());
		let v = document.getElementById("btnRenameSettings");
		v && v.addEventListener("click", () => this.handleOpenSettingsModal("presets"));
		let y = document.getElementById("btnCloseRenameSettings");
		y && y.addEventListener("click", () => this.handleCloseSettingsModal());
		let b = document.getElementById("btnDoneRenameSettings");
		b && b.addEventListener("click", () => this.handleCloseSettingsModal());
		let x = document.getElementById("tabBtnPresets");
		x && x.addEventListener("click", () => this.renderSettingsModal("presets"));
		let S = document.getElementById("tabBtnShortcuts");
		S && S.addEventListener("click", () => this.renderSettingsModal("shortcuts"));
		let C = document.getElementById("selectActivePreset");
		C && C.addEventListener("change", (e) => this.handleSwitchActivePreset(e.target.value));
		let w = document.getElementById("btnNewPreset");
		w && w.addEventListener("click", () => this.handleNewPreset());
		let T = document.getElementById("btnCopyPreset");
		T && T.addEventListener("click", () => this.handleCopyPreset());
		let D = document.getElementById("btnRenamePreset");
		D && D.addEventListener("click", () => this.handleRenamePreset());
		let k = document.getElementById("btnDeletePreset");
		k && k.addEventListener("click", () => this.handleDeletePreset());
		let A = document.getElementById("btnResetPresetsDefault");
		A && A.addEventListener("click", () => this.handleResetPresetsDefault());
		let j = document.getElementById("btnAddDocToPreset");
		j && j.addEventListener("click", () => this.openAddDocumentModal());
		let M = document.getElementById("btnAddNewShortcut");
		M && M.addEventListener("click", () => this.openAddDocumentModal(null, !0));
		let ee = document.getElementById("inputSearchPresetDocs");
		ee && ee.addEventListener("input", (e) => {
			this._presetDocsSearchQuery = e.target.value.trim().toLowerCase(), this.renderPresetDocsTable();
		});
		let te = document.getElementById("inputSearchShortcuts");
		te && te.addEventListener("input", (e) => {
			this._shortcutsSearchQuery = e.target.value.trim().toLowerCase(), this.renderShortcutsTable();
		}), this._initCrossCheckEvents();
		let ne = () => {
			document.querySelectorAll("#casingRadiosGroup label").forEach((e) => {
				let t = e.querySelector("input");
				e.className = t && t.checked ? "flex items-center cursor-pointer text-white bg-primary font-mono-code text-[11px] px-2 py-0.5 rounded shadow-xs select-none font-bold transition-all casing-pill-active" : "flex items-center cursor-pointer text-secondary hover:text-on-surface font-mono-code text-[11px] px-2 py-0.5 rounded transition-all select-none";
			});
		};
		document.querySelectorAll("input[name=\"casingStyleRadio\"]").forEach((e) => {
			e.value === (this.state.style || "upper") && (e.checked = !0), e.addEventListener("change", (e) => {
				if (e.target.checked) {
					let t = e.target.value;
					this.state.style = t, localStorage.setItem("docmitra_casing_style", t), ne();
					for (let e of this.state.files) !e.isRenamed && !e.isKept && (e.userEditedName = O(e.userEditedName || E(e.name), t));
					this._recalculateTargetNames(), this.renderQueue(), this.renderCurrentPreview();
					let n = this.state.files.filter((e) => !e.isRenamed && !e.isKept).length, i = t.toUpperCase() === "UPPER" ? "UPPERCASE" : t.toUpperCase() === "LOWER" ? "LOWERCASE" : "TITLE CASE";
					r.show("Case Style Changed", `Applied ${i} to ${n} pending files`, "info");
				}
			});
		}), ne();
		let re = document.getElementById("btnClearWorkspace");
		re && re.addEventListener("click", () => this.handleClearQueue());
		let ie = document.getElementById("btnClearQueue");
		ie && ie.addEventListener("click", () => this.handleClearQueue());
		let ae = document.getElementById("btnEmptySelectFolder");
		ae && ae.addEventListener("click", () => this.handleSelectFolder());
		let N = document.getElementById("btnEmptyAddFiles");
		N && N.addEventListener("click", () => this.handleAddFiles());
		let P = document.querySelector("#col-queue input");
		P && (P.addEventListener("keydown", (e) => {
			(e.key === "Tab" || e.key === "Enter") && (e.preventDefault(), r.show("Intake Folder Needed", "Press \"Select Folder\" (F2) to choose admission documents.", "info")), /[\\/:*?"<>|]/.test(e.key) && (e.preventDefault(), r.show("Character Not Allowed", `Windows filenames cannot contain ${e.key}`, "warning"));
		}), P.addEventListener("input", (e) => {
			/[\\/:*?"<>|]/.test(e.target.value) && (e.target.value = e.target.value.replace(/[\\/:*?"<>|]/g, ""), r.show("Character Not Allowed", "Illegal characters removed", "warning"));
		})), document.querySelectorAll("#col-queue .grid-cols-3 button").forEach((e) => {
			e.addEventListener("click", () => {
				let t = e.querySelector("span:first-child")?.textContent?.trim() || "", n = e.querySelector("span:last-child")?.textContent?.trim() || "";
				r.show(`Preset Selected: ${t}`, `Press "Select Folder" (F2) to rename documents with ${n}.`, "info");
			});
		}), this._bindPreviewControls();
	}
	_bindKeyboardShortcuts() {
		window.addEventListener("keydown", (e) => {
			let t = document.getElementById("view-bulk-renamer");
			if (!t || t.classList.contains("hidden")) return;
			let n = document.getElementById("settings-modal-overlay");
			if (!n || n.classList.contains("hidden")) {
				if (e.key === "Escape") {
					let t = document.getElementById("modalRenameSettings");
					if (t && !t.classList.contains("hidden")) {
						e.preventDefault(), this.handleCloseSettingsModal();
						return;
					}
					let n = document.getElementById("modalAddDocument");
					if (n && !n.classList.contains("hidden")) {
						e.preventDefault(), this.closeAddDocumentModal();
						return;
					}
					let r = document.getElementById("modalCrossCheck");
					if (r && !r.classList.contains("hidden")) {
						e.preventDefault(), this.closeCrossCheckModal();
						return;
					}
				}
				e.key === "F2" ? (e.preventDefault(), this.handleSelectFolder()) : e.key === "F4" ? (e.preventDefault(), this.handleSmartScanBatch()) : e.key === "F8" ? (e.preventDefault(), this.handleRenameAll()) : e.key === "F9" ? (e.preventDefault(), this.handleExportAudit()) : (e.ctrlKey || e.metaKey) && e.key === "ArrowLeft" ? (e.preventDefault(), this.handlePrevFolder()) : (e.ctrlKey || e.metaKey) && e.key === "ArrowRight" ? (e.preventDefault(), this.handleNextFolder()) : (e.ctrlKey || e.metaKey) && (e.key === "z" || e.key === "Z") && !e.shiftKey && e.target.tagName !== "INPUT" ? (e.preventDefault(), this.handleUndo()) : (e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S") && (e.preventDefault(), this.handleSaveBatch());
			}
		});
	}
	_bindPreviewControls() {
		let e = document.getElementById("col-preview");
		if (!e) return;
		let t = e.querySelector("button[title*=\"Zoom In\"]"), n = e.querySelector("button[title*=\"Zoom Out\"]"), i = e.querySelector("button[title*=\"Reset Zoom\"]"), a = e.querySelector("button[title*=\"Rotate\"]"), o = e.querySelector("input[type=\"range\"]"), s = e.querySelector("button[title*=\"Fit to A4 Width\"]"), c = e.querySelector("button[title*=\"Pan Hand\"]"), l = e.querySelector("button[title*=\"Split Compare\"]"), u = e.querySelector(".border-t button");
		t && t.addEventListener("click", () => {
			this.state.zoom = Math.min(300, this.state.zoom + 20), o && (o.value = this.state.zoom), this._applyPreviewTransform();
		}), n && n.addEventListener("click", () => {
			this.state.zoom = Math.max(40, this.state.zoom - 20), o && (o.value = this.state.zoom), this._applyPreviewTransform();
		}), o && o.addEventListener("input", (e) => {
			this.state.zoom = Number(e.target.value), this._applyPreviewTransform();
		}), i && i.addEventListener("click", () => {
			this.state.zoom = 100;
			let e = this.state.files[this.state.currentIndex];
			e && (e.rotation = 0), this.state.rotation = 0, o && (o.value = 100), this._applyPreviewTransform();
		}), a && a.addEventListener("click", () => {
			let e = this.state.files[this.state.currentIndex];
			e ? (e.rotation = ((e.rotation || 0) + 90) % 360, this.state.rotation = e.rotation) : this.state.rotation = (this.state.rotation + 90) % 360, this._applyPreviewTransform();
		}), s && s.addEventListener("click", () => {
			this.state.zoom = 120, o && (o.value = 120), this._applyPreviewTransform(), r.show("Fit to A4 Width", "Zoom set to 120% standard document view", "info");
		}), c && c.addEventListener("click", () => {
			this.state.panEnabled = !this.state.panEnabled;
			let t = e.querySelector(".overflow-auto");
			t && (t.classList.toggle("cursor-grab", this.state.panEnabled), t.classList.toggle("bg-primary/5", this.state.panEnabled)), c.classList.toggle("bg-primary/20", this.state.panEnabled), c.classList.toggle("text-primary", this.state.panEnabled), r.show("Pan Hand", this.state.panEnabled ? "Pan mode active: click & drag preview" : "Pan mode disabled", "info");
		});
		let d = e.querySelector(".overflow-auto");
		if (d) {
			d.addEventListener("wheel", (e) => {
				if (e.ctrlKey) {
					e.preventDefault();
					let t = e.deltaY < 0 ? 15 : -15;
					this.state.zoom = Math.max(40, Math.min(300, this.state.zoom + t)), o && (o.value = this.state.zoom), this._applyPreviewTransform();
				}
			}, { passive: !1 });
			let e = !1, t = 0, n = 0, r = 0, i = 0;
			d.addEventListener("mousedown", (a) => {
				this.state.panEnabled && (e = !0, d.classList.add("cursor-grabbing"), t = a.pageX - d.offsetLeft, n = a.pageY - d.offsetTop, r = d.scrollLeft, i = d.scrollTop);
			}), window.addEventListener("mousemove", (a) => {
				if (!e) return;
				a.preventDefault();
				let o = a.pageX - d.offsetLeft, s = a.pageY - d.offsetTop;
				d.scrollLeft = r - (o - t), d.scrollTop = i - (s - n);
			}), window.addEventListener("mouseup", () => {
				e && (e = !1, d.classList.remove("cursor-grabbing"));
			});
		}
		l && l.addEventListener("click", () => {
			this.state.splitCompare = !this.state.splitCompare, l.classList.toggle("bg-primary/20", this.state.splitCompare), l.classList.toggle("text-primary", this.state.splitCompare), this.renderCurrentPreview(), r.show("Split Compare", this.state.splitCompare ? "Split compare mode active" : "Single view restored", "info");
		}), u && u.addEventListener("click", () => {
			this.state.zoom = 100, this.state.rotation = 0, o && (o.value = 100), this._applyPreviewTransform(), r.show("Filters Reset", "Preview display restored to default", "info");
		});
		let f = e.querySelector("#btnPdfPrevPage"), p = e.querySelector("#btnPdfNextPage"), m = e.querySelector("#renamerPdfPageBadge");
		f && f.addEventListener("click", (e) => {
			e.stopPropagation(), this.state.currentPdfPage > 1 && this._renderPdfPage(this.state.currentPdfPage - 1);
		}), p && p.addEventListener("click", (e) => {
			e.stopPropagation(), this.state.currentPdfPage < this.state.totalPdfPages && this._renderPdfPage(this.state.currentPdfPage + 1);
		}), m && m.addEventListener("click", (e) => {
			if (e.stopPropagation(), this.state.totalPdfPages > 1) {
				let e = window.prompt(`Jump to Page (1 to ${this.state.totalPdfPages}):`, String(this.state.currentPdfPage));
				if (e) {
					let t = parseInt(e, 10);
					!isNaN(t) && t >= 1 && t <= this.state.totalPdfPages && this._renderPdfPage(t);
				}
			}
		});
	}
	_applyPreviewTransform() {
		let e = document.getElementById("previewContainerStage"), t = this.state.files[this.state.currentIndex], n = t ? t.rotation || 0 : this.state.rotation || 0;
		e && (e.style.transform = `scale(${this.state.zoom / 100}) rotate(${n}deg)`, e.style.transformOrigin = "center center", e.style.transition = "transform 0.15s ease-out");
		let r = document.getElementById("col-preview");
		if (r) {
			let e = r.querySelector(".font-mono-code.text-label-sm");
			e && (e.textContent = this.state.zoom === 100 ? "Fit to Page" : `${this.state.zoom}%`);
		}
	}
	_startBackgroundWatcher() {
		setInterval(async () => {
			if (this.state.watcherActive && this.state.folder?.path) try {
				let e = await u(this.state.folder.path);
				if (e.success && Array.isArray(e.files)) {
					let t = e.files.filter((e) => !Z(e.name)), n = new Set(this.state.files.map((e) => e.name)), r = new Set(t.map((e) => e.name)), i = !1;
					if (n.size !== r.size) i = !0;
					else for (let e of r) if (!n.has(e)) {
						i = !0;
						break;
					}
					i && this._syncDiskFiles(t);
				}
			} catch {}
		}, 4e3);
	}
	_syncDiskFiles(e) {
		let t = /* @__PURE__ */ new Map();
		this.state.files.forEach((e) => {
			t.set(e.name, {
				targetName: e.targetName,
				isRenamed: e.isRenamed,
				isKept: e.isKept,
				docType: e.docType,
				isMatched: e.isMatched
			});
		}), this.loadFolderData({
			name: this.state.folder.name,
			path: this.state.folder.path,
			files: e
		}, t);
	}
	async handleSelectFolder() {
		r.show("Opening Folder Picker", "Navigating Windows Explorer...", "info");
		try {
			let e = await c();
			if (!e.success) {
				e.cancelled || r.show("Folder Select Error", e.error || "Failed to select folder", "error");
				return;
			}
			let t = (e.files || []).filter((e) => !Z(e.name));
			if (e.subfolders && e.subfolders.length > 1) {
				this.state.subfolders = e.subfolders, this.state.currentSubfolderIndex = 0, await this.loadSubfolder(0), r.show("Batch Folder Loaded", `${e.subfolders.length} student folders detected`, "success");
				return;
			}
			if (e.subfolders && e.subfolders.length === 1 && t.length === 0) {
				this.state.subfolders = e.subfolders, this.state.currentSubfolderIndex = 0, await this.loadSubfolder(0), r.show("Student Folder Loaded", e.subfolders[0].name, "success");
				return;
			}
			if (t.length > 0) {
				e.files = t, this.state.subfolders = e.subfolders || [], this.loadFolderData(e), r.show("Folder Loaded", `${t.length} files found`, "success");
				return;
			}
			r.show("Selected Folder is Empty", "Remaining on previous folder.", "warning");
		} catch (e) {
			r.show("Folder Error", e.message, "error");
		}
	}
	async loadSubfolder(e) {
		if (e < 0 || e >= this.state.subfolders.length) return;
		this.state.currentSubfolderIndex = e;
		let t = this.state.subfolders[e], n = typeof t == "string" ? t : t.path || "";
		try {
			let e = await u(n);
			e.success && (e.files = (e.files || []).filter((e) => !Z(e.name)), this.loadFolderData(e));
		} catch (e) {
			r.show("Subfolder Error", e.message, "error");
		}
	}
	handlePrevFolder() {
		this.state.subfolders.length === 0 ? r.show("Single Folder Mode", "No parent batch subfolders active.", "info") : this.state.currentSubfolderIndex > 0 ? this.loadSubfolder(this.state.currentSubfolderIndex - 1) : r.show("First Folder", "Already on the first student folder.", "info");
	}
	handleNextFolder() {
		this.state.subfolders.length === 0 ? r.show("Single Folder Mode", "No parent batch subfolders active.", "info") : this.state.currentSubfolderIndex < this.state.subfolders.length - 1 ? this.loadSubfolder(this.state.currentSubfolderIndex + 1) : r.show("Last Folder", "Already on the last student folder.", "info");
	}
	async handleAddFiles() {
		r.show("Opening File Picker", "Select files to append in-place...", "info");
		try {
			let e = await l("All Supported Files (*.pdf;*.jpg;*.jpeg;*.png;*.docx)|*.pdf;*.jpg;*.jpeg;*.png;*.docx|All Files (*.*)|*.*", "Select Files to Add");
			if (!e.success) return;
			let t = (e.files || []).filter((e) => !Z(e.name));
			if (t.length === 0) {
				r.show("No Files Selected", "0 valid documents selected.", "info");
				return;
			}
			this.state.folder?.path;
			let n = new Set(this.state.files.map((e) => e.targetName)), i = t.map((e, t) => {
				let r = e.ext || T(e.name), i = E(e.name), a = L(e.name, this.state.studentName, this.state.settings?.groups, this.getAllPresetDocuments()), o = a.docType, s = a.confidence >= 30, c = i;
				c = o ? k(o, this.state.studentName, this.state.settings?.groups, this.state.style) : k(i, this.state.studentName, null, this.state.style);
				let l = j(c.endsWith(r) ? c : c + r, e.name, n, this.state.studentName);
				n.add(l);
				let u = a.confidence;
				return i.toUpperCase() === E(c).toUpperCase() && (u = 100), {
					id: `file_append_${Date.now()}_${t}`,
					name: e.name,
					path: e.path,
					size: e.size || 0,
					ext: r,
					fileObj: e.fileObj || null,
					url: X(e),
					docType: o,
					smartDocType: o,
					smartConfidence: u,
					isMatched: s,
					suggestedName: l,
					targetName: l,
					status: s ? u >= 80 ? "matched" : "needs_review" : "unmatched",
					isRenamed: !1,
					isKept: !1,
					rotation: 0,
					isScanning: !1
				};
			});
			this.state.files.push(...i), this.updateTelemetry(), this.renderQueue(), this.renderCurrentPreview(), r.show("Files Appended", `${i.length} files added to queue in-place`, "success"), i.length > 0 && this.handleSmartScanBatch();
		} catch (e) {
			r.show("Add Files Error", e.message, "error");
		}
	}
	handleOpenInExplorer() {
		this.state.folder?.path ? (h(this.state.folder.path), r.show("Opening Windows Explorer", this.state.folder.path, "info")) : r.show("No Active Folder", "Please select a folder first.", "warning");
	}
	getEffectiveStudentName() {
		let e = document.getElementById("chkIncludeFolderName");
		return e && !e.checked ? "" : this.state.studentName || "";
	}
	loadFolderData(e, t = null) {
		let n = e.path || "", r = e.name || (n ? n.split(/[\\/]/).pop() : "Selected Folder"), i = r.replace(/\.[a-zA-Z0-9]+$/i, "").replace(/^(?:roll\s*no\.?|student|candidate|sr\.?\s*no\.?)\s*[\d\w]*[\s_\.\-]+/i, "").replace(/^[0-9]+[_\.\s-]+/, "").replace(/\s*[\(\[][^\)\]]*(?:final|new|copy|admission|cet|dbt|\d{4})[^\)\]]*[\)\]]/gi, "").trim(), a = i.replace(/\.[a-zA-Z0-9]+$/i, "").replace(/_/g, " ").replace(/\s+/g, " ").trim();
		/^\d+$/.test(a) && (a = ""), this.state.folder = {
			name: r,
			path: n,
			nativePath: n
		}, this.state.studentName = a;
		let o = document.getElementById("displayFolderName");
		o && (o.textContent = i || "Selected Folder", o.title = n || i);
		let s = document.getElementById("inputEditFolderName");
		s && (s.value = a || i);
		let c = (e.files || []).filter((e) => !Z(e.name)), l = /* @__PURE__ */ new Set(), u = this.getEffectiveStudentName();
		this.state.files = c.map((e, r) => {
			let i = e.ext || T(e.name), a = E(e.name), o = t ? t.get(e.name) : null;
			if (o) return l.add(o.targetName), {
				id: `file_${r}_${Date.now()}`,
				name: e.name,
				path: e.path || `${n}/${e.name}`,
				size: e.size || 0,
				ext: i,
				fileObj: e.fileObj || null,
				url: X(e),
				docType: o.docType,
				isMatched: o.isMatched,
				suggestedName: o.targetName,
				targetName: o.targetName,
				status: o.isRenamed ? "renamed" : o.isKept ? "kept" : o.isMatched ? "matched" : "pending",
				isRenamed: o.isRenamed,
				isKept: o.isKept
			};
			let s = L(e.name, u, this.state.settings?.groups, this.getAllPresetDocuments()), c = s.docType, d = s.confidence >= 30, f = a;
			f = c ? k(c, u, this.state.settings?.groups, this.state.style) : k(a, u, null, this.state.style);
			let p = j(f.endsWith(i) ? f : f + i, e.name, l, u);
			l.add(p);
			let m = s.confidence;
			return a.toUpperCase() === E(f).toUpperCase() && (m = 100), {
				id: `file_${r}_${Date.now()}`,
				name: e.name,
				path: e.path || `${n}/${e.name}`,
				size: e.size || 0,
				ext: i,
				fileObj: e.fileObj || null,
				url: X(e),
				docType: c,
				smartDocType: c,
				smartConfidence: m,
				isMatched: d,
				suggestedName: p,
				targetName: p,
				status: d ? m >= 80 ? "matched" : "needs_review" : "unmatched",
				isRenamed: !1,
				isKept: !1,
				rotation: 0,
				isScanning: !1
			};
		}), this._scanAbortController &&= (this._scanAbortController.abort(), null), this.state.currentIndex = 0, this.state.rotation = 0, this.updateTelemetry(), this.renderQueue(), this.renderCurrentPreview(), this.state.files.length > 0 && this.handleSmartScanBatch();
	}
	_recalculateTargetNames(e = !1) {
		let t = /* @__PURE__ */ new Set();
		for (let e of this.state.files) (e.isRenamed || e.isKept) && t.add(e.targetName || e.name);
		let n = this.getEffectiveStudentName(), r = this.getAllPresetDocuments();
		for (let i of this.state.files) if (!i.isRenamed && !i.isKept) {
			if (e || !i.isMatched) {
				let e = L(i.name, n, this.state.settings?.groups, r);
				e.confidence >= 30 && (i.docType = e.docType, i.smartDocType = e.docType, i.smartConfidence = e.confidence, i.isMatched = !0, i.status = e.confidence >= 80 ? "matched" : "needs_review");
			}
			i.docType && (i.docType = O(i.docType, this.state.style), i.smartDocType = O(i.smartDocType || i.docType, this.state.style)), i.hasUserEdited && i.userEditedName && (i.userEditedName = O(i.userEditedName, this.state.style));
			let a = i.docType || E(i.name), o = i.ext || ("." + i.name.split(".").pop()).toLowerCase(), s = i.hasUserEdited && i.userEditedName ? i.userEditedName : k(a, n, this.state.settings?.groups, this.state.style), c = j(s.endsWith(o) ? s : `${s}${o}`, i.name, t, n);
			t.add(c), i.targetName = c, E(i.name).toUpperCase() === E(s).toUpperCase() && (i.smartConfidence = 100);
		}
	}
	updateTelemetry() {
		let e = this.state.files.length, t = this.state.files.filter((e) => e.isMatched || e.isRenamed || e.isKept).length, n = e - t, i = e > 0 ? Math.round(t / e * 100) : 0, a = document.getElementById("activeFolderPath");
		if (a) {
			for (; a.firstChild;) a.removeChild(a.firstChild);
			if (this.state.folder?.path) {
				a.title = this.state.folder.path;
				let e = this.state.folder.path.replace(/\\/g, "/"), t = e.split("/").filter(Boolean), n = [], i = "";
				t.forEach((t, r) => {
					i = r === 0 && (t.includes(":") || e.startsWith("/")) ? t : i ? `${i}/${t}` : t, n.push(i);
				});
				let o = [];
				o = t.length > 3 ? [
					{
						seg: t[0],
						path: n[0],
						isLast: !1
					},
					{
						isEllipsis: !0,
						title: n.slice(1, t.length - 2).join(" / ")
					},
					{
						seg: t[t.length - 2],
						path: n[t.length - 2],
						isLast: !1
					},
					{
						seg: t[t.length - 1],
						path: n[t.length - 1],
						isLast: !0
					}
				] : t.map((e, r) => ({
					seg: e,
					path: n[r],
					isLast: r === t.length - 1
				})), o.forEach((e, t) => {
					if (e.isEllipsis) {
						let t = document.createElement("span");
						t.className = "text-secondary/70 font-mono-code px-1 py-0.5 rounded hover:bg-surface-container cursor-default select-none text-[11px]", t.textContent = "...", t.title = `Intermediate folders: ${e.title}`, a.appendChild(t);
					} else {
						let t = document.createElement("span");
						t.className = e.isLast ? "text-on-surface font-bold truncate select-text px-1 py-0.5 rounded" : "text-secondary hover:text-primary transition-colors cursor-pointer px-1 py-0.5 rounded hover:bg-surface-container", t.textContent = e.seg, t.title = e.isLast ? e.path : `Click to jump to parent folder: ${e.path}`, e.isLast || t.addEventListener("click", async (t) => {
							t.stopPropagation(), r.show("Navigating Folder", `Opening ${e.path}...`, "info");
							let n = await u(e.path);
							n && n.success ? (this.loadFolderData(n), r.show("Navigated to Folder", e.path, "success")) : r.show("Navigation Failed", n?.error || "Could not read directory", "error");
						}), a.appendChild(t);
					}
					if (t < o.length - 1) {
						let e = document.createElement("span");
						e.className = "text-outline-variant/60 mx-0.5 select-none font-normal text-[10px]", e.textContent = ">", a.appendChild(e);
					}
				});
			} else a.textContent = "No folder selected";
		}
		let o = document.getElementById("folderCounterPill");
		o && (o.textContent = this.state.subfolders.length > 0 ? `Folder ${this.state.currentSubfolderIndex + 1} of ${this.state.subfolders.length}` : e > 0 ? "Folder 1 of 1" : "Folder 0 of 0");
		let s = document.getElementById("telemetryTotalFiles");
		s && (s.textContent = String(e));
		let c = document.getElementById("telemetryReadyFiles");
		c && (c.textContent = `${t} (${i}%)`);
		let l = document.getElementById("telemetryUnmatchedFiles");
		l && (l.textContent = String(n));
		let d = document.getElementById("btnRenameAll");
		if (d) {
			let e = this.state.files.filter((e) => !e.isRenamed && (e.targetName && e.targetName !== e.name || e.rotation && e.rotation % 360 != 0)), t = d.querySelector(".font-bold");
			t && (t.textContent = `Rename All (${e.length} Files)`);
		}
		let f = document.getElementById("btnRenameMatched");
		if (f) {
			let e = this.state.files.filter((e) => e.isRenamed || e.status === "needs_review" ? !1 : e.smartConfidence >= 80 || e.smartConfidence === void 0 && e.isMatched).length, t = f.querySelector("span:not(.material-symbols-outlined)");
			t && (t.textContent = `Rename Matched (${e})`), f.disabled = e === 0;
		}
	}
	renderQueue() {
		let e = document.getElementById("col-queue");
		if (!e) return;
		for (; e.firstChild;) e.removeChild(e.firstChild);
		let t = document.createElement("div");
		if (t.className = "flex flex-col gap-space-sm overflow-y-auto pr-1 flex-1 min-h-0 custom-pan-scroll pan-grab-active queue-scroll-area", this.state.files.length === 0) {
			let n = document.createElement("div");
			n.className = "flex flex-col gap-space-xs shrink-0 select-none";
			let r = document.createElement("div");
			r.className = "flex items-center justify-between px-1 text-label-sm";
			let i = document.createElement("div");
			i.className = "flex items-center gap-2";
			let a = document.createElement("span");
			a.className = "px-2 py-0.5 rounded bg-surface-container-high text-secondary font-bold text-[11px] flex items-center gap-1.5 shadow-xs";
			let o = document.createElement("span");
			o.className = "material-symbols-outlined text-[13px]", o.textContent = "edit_document", a.appendChild(o), a.appendChild(document.createTextNode("Standby (0 / 0)")), i.appendChild(a), r.appendChild(i), n.appendChild(r);
			let s = document.createElement("div");
			s.className = "p-space-sm bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-xs flex flex-col gap-2 relative";
			let c = document.createElement("div");
			c.className = "flex items-center justify-between text-label-sm";
			let l = document.createElement("label");
			l.className = "font-bold text-on-surface text-[12px]", l.textContent = "Rename To:", c.appendChild(l);
			let u = document.createElement("span");
			u.className = "text-[11px] text-secondary font-mono-code", u.textContent = "Awaiting intake files", c.appendChild(u), s.appendChild(c);
			let d = document.createElement("div");
			d.className = "h-9 w-full rounded-lg bg-surface-container/60 border border-outline-variant/30 px-3 flex items-center justify-between text-secondary/40 font-mono-code text-[12px]";
			let f = document.createElement("span");
			f.className = "italic text-secondary/50", f.textContent = "Select student folder (F2) to rename...", d.appendChild(f), s.appendChild(d), n.appendChild(s), t.appendChild(n);
			let p = document.createElement("div");
			p.className = "flex flex-col gap-1.5 pt-2 select-none";
			let m = document.createElement("div");
			m.className = "flex items-center justify-between px-1 text-label-sm pb-1";
			let h = document.createElement("span");
			h.className = "font-bold text-on-surface text-[12px]", h.textContent = "ALL LOADED DOCUMENTS (0 / 0 Done)", m.appendChild(h);
			let g = document.createElement("span");
			g.className = "text-secondary text-[11px] font-mono-code", g.textContent = "Standby", m.appendChild(g), p.appendChild(m);
			for (let e = 1; e <= 5; e++) {
				let t = document.createElement("div");
				t.className = "p-2 rounded-lg border border-outline-variant/20 bg-surface-container-lowest/50 flex items-center justify-between gap-2 opacity-50";
				let n = document.createElement("div");
				n.className = "flex items-center gap-2 flex-1 min-w-0";
				let r = document.createElement("span");
				r.className = "w-5 h-5 rounded bg-surface-container text-secondary text-[10px] font-mono-code font-bold flex items-center justify-center shrink-0", r.textContent = String(e), n.appendChild(r);
				let i = document.createElement("div");
				i.className = "h-3 rounded bg-slate-300 dark:bg-slate-700/60 skeleton-bar flex-1 max-w-[160px]", n.appendChild(i), t.appendChild(n), p.appendChild(t);
			}
			t.appendChild(p), e.appendChild(t);
			let _ = document.getElementById("utilityScrollArea");
			_ && this.renderUtilityPanel(_);
			return;
		}
		let n = this.state.files[this.state.currentIndex];
		if (n) {
			let e = document.createElement("div");
			e.className = "flex flex-col gap-space-xs shrink-0";
			let i = document.createElement("div");
			i.className = "flex items-center justify-between px-1 text-label-sm";
			let a = document.createElement("div");
			a.className = "flex items-center gap-2";
			let o = document.createElement("span");
			o.className = "px-2.5 py-1 rounded bg-primary text-on-primary font-bold text-[11px] flex items-center gap-1.5 shadow-sm";
			let s = document.createElement("span");
			s.className = "material-symbols-outlined text-[14px]", s.textContent = "edit_document", o.appendChild(s);
			let c = document.createTextNode(`Editing ${this.state.currentIndex + 1} of ${this.state.files.length}`);
			o.appendChild(c), a.appendChild(o), i.appendChild(a);
			let l = document.createElement("div");
			l.className = "flex items-center gap-1.5";
			let u = document.createElement("span");
			u.id = "activeFileLiveBadge", n.status === "needs_review" ? (u.className = "confidence-badge confidence-badge-med", u.textContent = "🟡 Needs Review") : n.smartConfidence !== void 0 && n.smartConfidence >= 30 ? n.smartConfidence >= 80 ? (u.className = "confidence-badge confidence-badge-high", u.textContent = `🟢 ${n.smartConfidence}% ${n.smartDocType || n.docType || "DOCUMENT"}`) : (u.className = "confidence-badge confidence-badge-med", u.textContent = `🟡 ${n.smartConfidence}% ${n.smartDocType || n.docType || "DOCUMENT"}`) : n.isMatched && n.docType ? (u.className = "confidence-badge confidence-badge-high", u.textContent = `🟢 Matched: ${n.docType}`) : (u.className = "confidence-badge confidence-badge-low", u.textContent = "🔴 Unmatched"), l.appendChild(u);
			let d = E(n.name), f = E(n.targetName || n.suggestedName || "");
			if (f && d.toLowerCase() !== f.toLowerCase()) {
				let e = F(d, f);
				if (e >= .4 && e < .99) {
					let t = Math.round((1 - e) * 100), n = document.createElement("span");
					n.className = "px-1.5 py-0.5 rounded text-[10px] font-mono-code font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30", n.textContent = `~${t}% Typo/Diff`, l.appendChild(n);
				}
			}
			i.appendChild(l), e.appendChild(i);
			let p = document.createElement("article");
			p.className = "bg-surface-container-lowest rounded-xl shadow-sm p-3 flex flex-col gap-2.5 border border-outline-variant/30 border-l-4 border-l-primary relative";
			let m = document.createElement("div");
			m.className = "flex items-center gap-1.5 text-[11px] font-mono-code text-secondary w-full min-w-0 overflow-hidden";
			let h = document.createElement("span");
			h.className = "shrink-0 select-none text-secondary", h.textContent = "Original:", m.appendChild(h);
			let g = document.createElement("strong");
			g.className = "text-on-surface truncate min-w-0 flex-1 cursor-pointer hover:underline hover:text-primary transition-colors font-medium", g.title = "Click to reset input to original name", g.textContent = E(n.name), g.addEventListener("click", () => {
				let e = E(n.name);
				delete n.userEditedName, n.hasUserEdited = !1, n.targetName = n.name, w.value = e, this.updateTelemetry(), this.renderCoreShortcuts(""), r.show("Input Reset", e, "info");
			}), m.appendChild(g), p.appendChild(m);
			let _ = document.createElement("div");
			_.className = "flex flex-col gap-1.5";
			let v = document.createElement("div");
			v.className = "flex items-center justify-between font-label-sm font-semibold";
			let y = document.createElement("label");
			y.className = "text-on-surface font-bold text-[13px]", y.textContent = "Rename To:", v.appendChild(y);
			let b = document.createElement("span");
			b.className = "text-secondary text-[11px] flex items-center gap-1", b.appendChild(document.createTextNode("Press "));
			let x = document.createElement("kbd");
			x.className = "px-1.5 py-0.5 rounded bg-surface-container font-mono-code text-[10px] text-on-surface font-bold border border-outline-variant/40", x.textContent = "Tab", b.appendChild(x), b.appendChild(document.createTextNode(" or "));
			let S = document.createElement("kbd");
			S.className = "px-1.5 py-0.5 rounded bg-surface-container font-mono-code text-[10px] text-on-surface font-bold border border-outline-variant/40", S.textContent = "Enter", b.appendChild(S), b.appendChild(document.createTextNode(" to save & next")), v.appendChild(b), _.appendChild(v);
			let C = document.createElement("div");
			C.className = "relative flex items-center w-full shadow-sm";
			let w = document.createElement("input");
			w.id = "inputRenameTarget", w.type = "text", w.autocomplete = "new-password", w.setAttribute("autocomplete", "new-password"), w.setAttribute("autocorrect", "off"), w.setAttribute("autocapitalize", "off"), w.setAttribute("spellcheck", "false"), w.setAttribute("name", `docmitra_rename_${Date.now()}`), w.className = "w-full h-10 px-3 rounded-lg bg-surface-container-lowest font-mono-code text-[13px] text-on-surface font-semibold border-2 border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-xs", w.value = O(n.userEditedName === void 0 ? n.targetName ? E(n.targetName) : E(n.name) : n.userEditedName, this.state.style || "upper"), w.addEventListener("keydown", (e) => {
				if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) e.preventDefault(), this.handleRenameSingleFile(n);
				else if (e.key === "Tab" && !e.shiftKey) {
					e.preventDefault();
					let t = w.value.trim(), r = this.resolveShortcut(t);
					if (r) {
						let e = k(r.canonical || r.label, this.getEffectiveStudentName(), this.state.settings?.groups, this.state.style).replace(/(\.[a-zA-Z0-9]+)+$/i, "").trim();
						w.value = e, this.handleConfirmCurrentName(e);
					} else {
						let e = t || n.targetName || n.suggestedName || E(n.name);
						this.handleConfirmCurrentName(e);
					}
				} else if (e.key === "Tab" && e.shiftKey) e.preventDefault(), this.handleNavigateBackward();
				else if (e.key === "Enter") {
					e.preventDefault();
					let t = w.value.trim(), r = this.resolveShortcut(t);
					if (r) {
						let e = k(r.canonical || r.label, this.getEffectiveStudentName(), this.state.settings?.groups, this.state.style).replace(/(\.[a-zA-Z0-9]+)+$/i, "").trim();
						w.value = e, this.handleConfirmCurrentName(e);
					} else {
						let e = t || n.targetName || n.suggestedName || E(n.name);
						this.handleConfirmCurrentName(e);
					}
				} else /[\\/:*?"<>|]/.test(e.key) && (e.preventDefault(), r.show("Character Not Allowed", `Windows filenames cannot contain ${e.key}`, "warning"));
			}), w.addEventListener("input", (e) => {
				let t = e.target.value;
				/[\\/:*?"<>|]/.test(t) && (t = t.replace(/[\\/:*?"<>|]/g, ""), e.target.value = t, r.show("Character Not Allowed", "Illegal Windows filename characters removed", "warning")), n.hasUserEdited = !0, n.userEditedName = t;
				let i = n.ext || T(n.name), a = t.replace(/(\.[a-zA-Z0-9]+)+$/i, "").trim(), o = document.getElementById("activeFileLiveBadge");
				if (!a) {
					n.targetName = n.name, n.docType = null, n.isMatched = !1, o && (o.className = "confidence-badge confidence-badge-low", o.textContent = "🔴 Unmatched"), this.updateTelemetry(), this.renderCoreShortcuts("");
					return;
				}
				let s = a.replace(/\s+/g, "").toLowerCase(), c = this.resolveShortcut(a) || this.resolveShortcut(s);
				if (!c) {
					for (let e of this.shortcuts21 || []) if ((Array.isArray(e.keywords) ? e.keywords : []).some((e) => e.toLowerCase() === a.toLowerCase() || e.toLowerCase() === s)) {
						c = e;
						break;
					}
				}
				if (!c) {
					let e = this.getAllPresetDocuments().find((e) => e.code && (e.code.toLowerCase() === a.toLowerCase() || e.code.toLowerCase() === s) || Array.isArray(e.keywords) && e.keywords.some((e) => e.toLowerCase() === a.toLowerCase() || e.toLowerCase() === s));
					e && (c = {
						code: e.code,
						codes: [e.code],
						canonical: e.name.toUpperCase(),
						label: e.name
					});
				}
				if (c) {
					let e = c.canonical || c.label;
					n.docType = e, n.isMatched = !0, o && (o.className = "confidence-badge confidence-badge-high", o.textContent = `🟢 Matched: ${e}`);
					let t = k(e, this.getEffectiveStudentName(), this.state.settings?.groups, this.state.style).replace(/(\.[a-zA-Z0-9]+)+$/i, "").trim();
					n.targetName = `${t}${i}`;
				} else {
					n.docType = a, n.isMatched = !1, o && (o.className = "confidence-badge confidence-badge-med", o.textContent = `✏️ Custom: ${a}`);
					let e = k(a, this.state.studentName, null, this.state.style).replace(/(\.[a-zA-Z0-9]+)+$/i, "").trim();
					n.targetName = `${e}${i}`;
				}
				this.updateTelemetry();
				let l = document.querySelector("#previewContainerStage .font-headline-sm");
				l && (l.textContent = E(n.targetName)), this.renderCoreShortcuts(t);
			}), C.appendChild(w), _.appendChild(C), p.appendChild(_), e.appendChild(p), t.appendChild(e), requestAnimationFrame(() => {
				w.focus(), w.select(), e.scrollIntoView({
					behavior: "smooth",
					block: "start"
				}), this.renderCoreShortcuts(w.value);
			});
		}
		let i = document.createElement("div");
		i.className = "flex flex-col gap-1.5 pt-1.5 flex-1 min-h-0 select-none";
		let a = document.createElement("div");
		a.className = "flex items-center justify-between px-2 py-1 rounded bg-surface-container border border-outline-variant/40 text-[11px] font-mono-code text-secondary shrink-0";
		let o = document.createElement("div");
		o.className = "flex items-center gap-1.5 text-primary font-semibold";
		let s = document.createElement("span");
		s.className = "material-symbols-outlined text-[15px]", s.textContent = "format_list_bulleted", o.appendChild(s), o.appendChild(document.createTextNode("ALL LOADED DOCUMENTS")), a.appendChild(o);
		let c = this.state.files.filter((e) => e.isRenamed).length, l = document.createElement("span");
		l.className = "text-[10px] text-secondary font-medium", l.textContent = `${c} / ${this.state.files.length} Done`, a.appendChild(l), i.appendChild(a);
		let u = document.createElement("div");
		u.className = "flex flex-col gap-1 overflow-y-auto pr-0.5 custom-pan-scroll flex-1", this.state.files.forEach((e, t) => {
			let n = t === this.state.currentIndex, r = !!e.isRenamed, i = document.createElement("article");
			i.dataset.index = String(t), i.className = n ? "h-8 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/50 ring-1 ring-primary/30 shadow-xs flex items-center justify-between gap-2 transition-all cursor-pointer shrink-0 font-semibold active-queue-item" : r ? "h-8 px-2.5 py-1 rounded-lg bg-surface-container-lowest/80 border border-emerald-500/30 shadow-xs flex items-center justify-between gap-2 hover:bg-surface-container-low transition-colors cursor-pointer shrink-0 text-secondary" : "h-8 px-2.5 py-1 rounded-lg bg-surface-container-lowest shadow-xs flex items-center justify-between gap-2 hover:bg-surface-container-low transition-colors border border-outline-variant/30 cursor-pointer shrink-0", i.title = `Original: ${E(e.name)}\nTarget: ${E(e.targetName || e.name)} (Click to jump & edit)`, i.addEventListener("click", () => {
				this.state.currentIndex = t, this.renderQueue(), this.renderCurrentPreview();
			});
			let a = document.createElement("div");
			a.className = "flex items-center gap-1.5 min-w-0 flex-1";
			let o = document.createElement("span");
			o.className = r ? "w-4 h-4 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-mono-code font-bold text-[10px] flex items-center justify-center shrink-0 border border-emerald-300 dark:border-emerald-700" : n ? "w-4 h-4 rounded bg-primary text-on-primary font-mono-code font-bold text-[10px] flex items-center justify-center shrink-0 shadow-2xs" : "w-4 h-4 rounded bg-surface-container text-secondary font-mono-code font-bold text-[10px] flex items-center justify-center shrink-0", o.textContent = r ? "✓" : String(t + 1), a.appendChild(o);
			let s = document.createElement("span");
			s.className = n ? "font-mono-code text-[11px] text-primary font-bold truncate flex-1 min-w-0" : r ? "font-mono-code text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold truncate flex-1 min-w-0" : "font-mono-code text-[11px] text-on-surface font-medium truncate flex-1 min-w-0", s.textContent = r ? E(e.name) : e.hasUserEdited && e.targetName ? E(e.targetName) : O(E(e.name), this.state.style), a.appendChild(s), i.appendChild(a), this.getShortCodeForDoc(e.smartDocType || e.docType);
			let c = e.smartConfidence === void 0 ? e.isMatched ? 90 : 0 : e.smartConfidence;
			if (e.isScanning) {
				let e = document.createElement("span");
				e.className = "confidence-badge bg-primary/20 text-primary flex items-center gap-1 font-bold shrink-0 text-[10px] px-1.5 py-0.5";
				let t = document.createElement("span");
				t.className = "material-symbols-outlined text-[11px] animate-spin", t.textContent = "sync", e.appendChild(t), e.appendChild(document.createTextNode("SCANNING")), i.appendChild(e);
			} else if (r) {
				let e = document.createElement("span");
				e.className = "confidence-badge bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold shrink-0 text-[10px] px-1.5 py-0.5", e.textContent = "✓", i.appendChild(e);
			} else if (c >= 30) {
				let e = document.createElement("span");
				c >= 80 ? (e.className = "confidence-badge confidence-badge-high shrink-0 text-[10px] px-1.5 py-0.5", e.textContent = `🟢 ${c}%`) : (e.className = "confidence-badge confidence-badge-med shrink-0 text-[10px] px-1.5 py-0.5", e.textContent = `🟡 ${c}%`), i.appendChild(e);
			} else {
				let e = document.createElement("span");
				e.className = "confidence-badge confidence-badge-low shrink-0 text-[10px] px-1.5 py-0.5", e.textContent = "🔴 UNMATCH", i.appendChild(e);
			}
			u.appendChild(i);
		}), i.appendChild(u), t.appendChild(i), requestAnimationFrame(() => {
			let e = u.querySelector(".active-queue-item");
			e && e.scrollIntoView({
				behavior: "smooth",
				block: "nearest"
			});
		}), e.appendChild(t);
		let d = document.getElementById("utilityScrollArea");
		d && this.renderUtilityPanel(d);
	}
	renderUtilityPanel(e) {
		for (; e.firstChild;) e.removeChild(e.firstChild);
		if (this.state.files.length === 0) {
			let t = document.createElement("div");
			t.className = "flex flex-col gap-1.5 shrink-0 select-none";
			let n = document.createElement("div");
			n.className = "flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-surface-container border border-outline-variant/30 text-[11px] font-mono-code text-secondary shrink-0";
			let r = document.createElement("div");
			r.className = "flex items-center gap-1.5 font-bold";
			let i = document.createElement("span");
			i.className = "material-symbols-outlined text-[15px] text-secondary", i.textContent = "checklist", r.appendChild(i);
			let a = document.createElement("span");
			a.textContent = "MISSING DOCUMENTS (Checklist)", r.appendChild(a), n.appendChild(r);
			let o = document.createElement("span");
			o.className = "text-[10px] text-secondary/70", o.textContent = "Standby", n.appendChild(o), t.appendChild(n);
			let s = document.createElement("div");
			s.className = "p-3 rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-lowest/60 flex flex-col gap-2 select-none";
			let c = document.createElement("div");
			c.className = "h-3 w-3/4 bg-slate-300 dark:bg-slate-700/50 rounded skeleton-bar", s.appendChild(c);
			let l = document.createElement("div");
			l.className = "h-3 w-1/2 bg-slate-300 dark:bg-slate-700/50 rounded skeleton-bar", s.appendChild(l);
			let u = document.createElement("span");
			u.className = "text-[11px] text-secondary/60 italic pt-1", u.textContent = "Checklist audit will verify missing records upon folder load.", s.appendChild(u), t.appendChild(s), e.appendChild(t);
			return;
		}
		let t = this.getActivePresetDocuments(), n = new Set(this.state.files.map((e) => (e.docType || "").toUpperCase()).filter(Boolean)), i = t.filter((e) => {
			let t = e.name.toUpperCase();
			if (n.has(t)) return !1;
			for (let e of v) if (e.combined && n.has(e.combined.toUpperCase()) && (t === e.part1.toUpperCase() || t === e.part2.toUpperCase())) return !1;
			return !0;
		});
		if (i.length > 0) {
			let t = document.createElement("div");
			t.className = "flex flex-col gap-1.5 shrink-0";
			let n = document.createElement("div");
			n.className = "flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] font-mono-code text-amber-900 dark:text-amber-300 shrink-0 cursor-pointer select-none hover:bg-amber-500/20 transition-colors" + (this.state.isMissingDocsCollapsed ? " animate-pulse" : ""), n.onclick = () => {
				this.state.isMissingDocsCollapsed = !this.state.isMissingDocsCollapsed, this.renderQueue();
			};
			let a = document.createElement("div");
			a.className = "flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-400 text-[11px] font-mono-code";
			let o = document.createElement("span");
			o.className = "material-symbols-outlined text-[15px]", o.textContent = "warning", a.appendChild(o), a.appendChild(document.createTextNode(`${i.length} Missing Documents Found`));
			let s = document.createElement("select");
			s.id = "selectQuickPreset", s.className = "px-1.5 py-0.5 rounded bg-amber-600/20 hover:bg-amber-600/30 text-amber-900 dark:text-amber-200 text-[10px] font-mono-code uppercase font-bold ml-1 border-none outline-none cursor-pointer", s.title = "Switch active document preset", (this.state.documentPresets ? Object.keys(this.state.documentPresets) : ["MAHA DBT", "SWAYAM"]).forEach((e) => {
				let t = document.createElement("option");
				t.value = e, t.textContent = e, e === this.state.activePreset && (t.selected = !0), s.appendChild(t);
			}), s.addEventListener("click", (e) => e.stopPropagation()), s.addEventListener("change", (e) => {
				e.stopPropagation(), this.handleSwitchActivePreset(e.target.value);
			}), a.appendChild(s), n.appendChild(a);
			let c = document.createElement("div");
			c.className = "flex items-center gap-1.5";
			let u = document.createElement("span");
			if (u.className = "material-symbols-outlined text-[16px] text-amber-800 transition-transform", u.textContent = this.state.isMissingDocsCollapsed ? "expand_more" : "expand_less", c.appendChild(u), n.appendChild(c), t.appendChild(n), !this.state.isMissingDocsCollapsed) {
				let e = document.createElement("div");
				e.className = "flex flex-col gap-1 shrink-0", i.forEach((t) => {
					let n = t.name, i = t.code, a = document.createElement("article");
					a.className = "h-8 px-2 py-1 rounded-lg bg-surface-container-lowest shadow-xs flex items-center justify-between gap-1.5 border border-amber-500/30 hover:border-amber-500/50 transition-colors shrink-0";
					let o = document.createElement("div");
					o.className = "flex items-center gap-1.5 min-w-0 flex-1";
					let s = document.createElement("span");
					s.className = "w-1.5 h-1.5 rounded-full bg-error shrink-0", o.appendChild(s);
					let c = this.state.style || "upper";
					c === "lower" ? (i || "").toLowerCase() : c === "title" ? i && i.length <= 4 && /\d/.test(i) ? i.toUpperCase() : O(i || "", "title") : (i || "").toUpperCase();
					let u = O(n, c), d = document.createElement("span");
					d.className = "font-mono-code text-[11px] font-bold text-on-surface truncate", d.textContent = u, o.appendChild(d);
					let f = this.state.studentName || this.state.folder?.name || "Student", p = ze(f, n);
					if (p) {
						let e = document.createElement("span");
						e.className = "px-1.5 py-0.2 rounded font-mono-code text-[9px] bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold shrink-0 flex items-center gap-0.5", e.textContent = `📅 ${J(p.promisedDate)}`, o.appendChild(e);
					}
					a.appendChild(o);
					let h = document.createElement("div");
					h.className = "flex items-center gap-1 shrink-0";
					let g = document.createElement("div");
					g.className = "relative inline-block";
					let _ = document.createElement("button");
					_.type = "button", _.className = "px-1.5 py-0.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-mono-code text-[9px] font-semibold flex items-center gap-0.5 border border-outline-variant/30 cursor-pointer transition-colors";
					let v = document.createElement("span");
					v.className = "material-symbols-outlined text-[12px] text-primary", v.textContent = "event", _.appendChild(v), _.appendChild(document.createTextNode("Date")), g.appendChild(_);
					let y = document.createElement("div");
					y.className = "hidden absolute right-0 bottom-full mb-1 w-48 bg-surface-container-lowest rounded-lg shadow-lg border border-outline-variant/40 p-2 z-50 flex flex-col gap-1 text-[11px] font-mono-code";
					let b = document.createElement("button");
					b.type = "button", b.className = "w-full text-left px-2 py-1 rounded hover:bg-surface-container text-on-surface cursor-pointer", b.textContent = `Today (${J(Y())})`, b.onclick = (e) => {
						e.stopPropagation(), q({
							folderName: f,
							studentName: f,
							documentName: n,
							promisedDate: Y(),
							note: `Missing ${n} during intake`
						}), y.classList.add("hidden"), r.show("Follow-up Scheduled", `${n} promise date set for Today`, "success"), this.renderQueue();
					}, y.appendChild(b);
					let x = document.createElement("button");
					x.type = "button", x.className = "w-full text-left px-2 py-1 rounded hover:bg-surface-container text-on-surface cursor-pointer", x.textContent = `Tomorrow (${J(Ve(1))})`, x.onclick = (e) => {
						e.stopPropagation(), q({
							folderName: f,
							studentName: f,
							documentName: n,
							promisedDate: Ve(1),
							note: `Missing ${n} during intake`
						}), y.classList.add("hidden"), r.show("Follow-up Scheduled", `${n} promise date set for Tomorrow`, "success"), this.renderQueue();
					}, y.appendChild(x);
					let S = document.createElement("button");
					S.type = "button", S.className = "w-full text-left px-2 py-1 rounded hover:bg-surface-container text-on-surface cursor-pointer", S.textContent = `Monday (${J(He())})`, S.onclick = (e) => {
						e.stopPropagation(), q({
							folderName: f,
							studentName: f,
							documentName: n,
							promisedDate: He(),
							note: `Missing ${n} during intake`
						}), y.classList.add("hidden"), r.show("Follow-up Scheduled", `${n} promise date set for Monday`, "success"), this.renderQueue();
					}, y.appendChild(S);
					let C = document.createElement("div");
					C.className = "flex items-center gap-1 pt-1 border-t border-surface-container mt-1";
					let w = document.createElement("input");
					w.type = "date", w.className = "flex-1 text-[10px] p-1 rounded bg-surface-container text-on-surface border border-outline-variant/40 outline-none";
					let D = document.createElement("button");
					D.type = "button", D.className = "px-2 py-1 rounded bg-primary text-on-primary text-[10px] font-bold cursor-pointer", D.textContent = "Set", D.onclick = (e) => {
						e.stopPropagation(), w.value && (q({
							folderName: f,
							studentName: f,
							documentName: n,
							promisedDate: w.value,
							note: `Missing ${n} during intake`
						}), y.classList.add("hidden"), r.show("Follow-up Scheduled", `${n} promise date: ${w.value}`, "success"), this.renderQueue());
					}, C.appendChild(w), C.appendChild(D), y.appendChild(C), _.onclick = (e) => {
						e.stopPropagation(), y.classList.toggle("hidden");
					}, g.appendChild(y), h.appendChild(g);
					let A = document.createElement("button");
					A.type = "button", A.className = "px-2 py-0.5 rounded bg-primary hover:bg-primary/90 text-on-primary font-mono-code text-[9px] font-bold flex items-center gap-0.5 shadow-xs cursor-pointer transition-colors";
					let j = document.createElement("span");
					j.className = "material-symbols-outlined text-[12px]", j.textContent = "download", A.appendChild(j), A.appendChild(document.createTextNode("Import")), A.onclick = async (e) => {
						e.stopPropagation(), r.show("Select File for Import", `Select document for ${n}`, "info");
						try {
							let e = await l("All Supported Files (*.pdf;*.jpg;*.jpeg;*.png;*.docx)|*.pdf;*.jpg;*.jpeg;*.png;*.docx|All Files (*.*)|*.*", `Select File for ${n}`);
							if (!e.success || !e.files || e.files.length === 0) return;
							let t = e.files[0], i = t.ext || T(t.name), a = this.state.folder?.path || "", o = this.state.studentName || this.state.folder?.name || "", s = n, c = !0, u = null;
							try {
								u = L(t.name, o, this.state.settings?.groups), u && u.docType ? n && u.docType.toUpperCase() === n.toUpperCase() ? (s = n, c = u.confidence >= 50) : n ? (s = n, c = u.confidence >= 30) : (s = u.docType, c = u.confidence >= 70) : (s = n, c = !1);
							} catch (e) {
								console.warn("[DocMitra Import] Filename matching warning:", e), c = !1;
							}
							let d = `${k(s || n || E(t.name), o, this.state.settings?.groups, this.state.style).replace(/(\.[a-zA-Z0-9]+)+$/i, "").trim()}${i}`, f = null;
							a && t.path && (f = await m({
								sourcePath: t.path,
								targetDir: a,
								targetName: d,
								studentName: o
							}));
							let p = f && f.name ? f.name : d, h = f && f.path ? f.path : a ? `${a}/${p}` : t.path, g = f && f.size ? f.size : t.size || 0, _ = {
								id: `imported_${Date.now()}`,
								name: p,
								targetName: p,
								suggestedName: p,
								path: h,
								nativePath: h,
								size: g,
								ext: i,
								url: f && f.url ? f.url : t.url,
								docType: s || n,
								isMatched: c,
								isRenamed: !1,
								isKept: !1,
								rotation: 0,
								isScanning: !1,
								smartConfidence: u ? u.confidence : c ? 90 : 40,
								smartDocType: u ? u.docType : s,
								status: c ? "matched" : "needs_review"
							};
							this.state.files.push(_), this.updateTelemetry(), this.renderQueue(), this.renderCurrentPreview(), c ? r.show("Document Imported", `Imported ${E(p)} as ${s}`, "success") : r.show("Imported — Needs Review", `Imported ${E(p)}; please verify document type.`, "warning");
						} catch (e) {
							r.show("Import Error", e.message, "error");
						}
					}, h.appendChild(A), a.appendChild(h), e.appendChild(a);
				}), t.appendChild(e);
			}
			e.appendChild(t);
		} else {
			let t = document.createElement("div");
			t.className = "p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between gap-2 text-emerald-800 dark:text-emerald-300";
			let n = document.createElement("div");
			n.className = "flex items-center gap-2";
			let r = document.createElement("span");
			r.className = "material-symbols-outlined text-[18px] text-tertiary", r.textContent = "check_circle", n.appendChild(r);
			let i = document.createElement("span");
			i.className = "font-mono-code text-[11px] font-bold", i.textContent = "All Required Documents Present", n.appendChild(i), t.appendChild(n);
			let a = document.createElement("select");
			a.className = "px-1.5 py-0.5 rounded bg-emerald-600/20 text-emerald-900 dark:text-emerald-200 text-[10px] font-mono-code uppercase font-bold border-none outline-none cursor-pointer", (this.state.documentPresets ? Object.keys(this.state.documentPresets) : ["MAHA DBT", "SWAYAM"]).forEach((e) => {
				let t = document.createElement("option");
				t.value = e, t.textContent = e, e === this.state.activePreset && (t.selected = !0), a.appendChild(t);
			}), a.addEventListener("change", (e) => this.handleSwitchActivePreset(e.target.value)), t.appendChild(a), e.appendChild(t);
		}
		let a = document.createElement("div");
		a.id = "coreShortcutsContainer", a.className = "flex flex-col gap-1.5 shrink-0 mt-2 bg-surface-container-lowest/80 p-2.5 rounded-xl border border-outline-variant/30 shadow-xs", e.appendChild(a);
		let o = document.getElementById("inputRenameTarget")?.value || "";
		this.renderCoreShortcuts(o);
	}
	renderCoreShortcuts(e = "") {
		let t = document.getElementById("coreShortcutsContainer");
		if (!t) return;
		for (; t.firstChild;) t.removeChild(t.firstChild);
		if (this.state.files.length === 0) return;
		let n = this.state.files[this.state.currentIndex], r = n ? E(n.name) : "", i = (e || "").trim();
		!n?.hasUserEdited && i.toLowerCase() === r.toLowerCase() && (i = "");
		let a = this.getAllPresetDocuments(), o = [], s = /* @__PURE__ */ new Set();
		for (let e of this.shortcuts21 || []) {
			let t = e.canonical || e.label, n = Array.isArray(e.codes) && e.codes.length > 0 ? e.codes : e.code ? [e.code] : [];
			for (let r of n) {
				let i = (r || "").toUpperCase();
				i && !s.has(i) && (o.push({
					code: i,
					codes: n,
					label: t,
					canonical: t,
					keywords: e.keywords
				}), s.add(i));
			}
		}
		for (let e of a) {
			let t = (e.code || "").toUpperCase();
			t && !s.has(t) && (o.push({
				code: t,
				codes: [t],
				label: e.name,
				canonical: e.name.toUpperCase(),
				keywords: e.keywords
			}), s.add(t));
		}
		let c = [], l = !1;
		if (i) {
			let e = i.toLowerCase(), t = o.filter((t) => t.code.toLowerCase() === e), n = o.filter((t) => t.code.toLowerCase().startsWith(e) && t.code.toLowerCase() !== e), r = o.filter((t) => !t.code.toLowerCase().startsWith(e) && (Array.isArray(t.keywords) ? t.keywords : []).some((t) => t.toLowerCase().includes(e))), a = o.filter((t) => t.code.toLowerCase().startsWith(e) || (Array.isArray(t.keywords) ? t.keywords : []).some((t) => t.toLowerCase().includes(e)) ? !1 : (t.label || "").toLowerCase().includes(e) || (t.canonical || "").toLowerCase().includes(e)), s = [
				...t,
				...n,
				...r,
				...a
			], u = /* @__PURE__ */ new Set(), d = [];
			for (let e of s) u.has(e.code) || (u.add(e.code), d.push(e));
			d.length > 0 ? (c = d.slice(0, 5), l = !1) : (c = o.slice(0, 5), l = !0);
		} else {
			let e = this.getActivePresetDocuments(), t = new Set(this.state.files.map((e) => (e.docType || "").toUpperCase()).filter(Boolean)), n = e.filter((e) => !t.has(e.name.toUpperCase())), r = [];
			for (let e of n) {
				let t = o.find((t) => t.canonical === e.name.toUpperCase() || t.code === e.code);
				if (t && !r.some((e) => e.code === t.code) && (r.push(t), r.length >= 5)) break;
			}
			for (let e of o) {
				if (r.length >= 5) break;
				r.some((t) => t.code === e.code) || r.push(e);
			}
			c = r.slice(0, 5);
		}
		if (c.forEach((e) => {
			let n = document.createElement("div");
			n.className = "flex items-center justify-between p-2 rounded-lg bg-surface-container-lowest border border-outline-variant/30 hover:border-primary/50 hover:bg-surface-container-low transition-all cursor-pointer shadow-xs group", n.title = `Click or type ${e.code} to rename`;
			let r = document.createElement("div");
			r.className = "flex items-center gap-2 min-w-0 flex-1";
			let i = this.state.style || "upper", a = i === "lower" ? e.code.toLowerCase() : i === "title" ? e.code.length <= 4 && /\d/.test(e.code) ? e.code.toUpperCase() : O(e.code, "title") : e.code.toUpperCase(), o = O(e.label || e.canonical, i), s = document.createElement("span");
			s.className = `px-2 py-0.5 rounded font-mono-code font-bold text-[11px] shrink-0 ${Ge(e.code)}`, s.textContent = a, r.appendChild(s);
			let c = document.createElement("span");
			c.className = "text-[12px] font-semibold text-on-surface truncate flex-1", c.textContent = o, r.appendChild(c), n.appendChild(r);
			let l = document.createElement("span");
			l.className = "material-symbols-outlined text-[16px] text-secondary group-hover:text-primary transition-colors shrink-0", l.textContent = "arrow_forward", n.appendChild(l), n.addEventListener("click", (t) => {
				t.stopPropagation(), this.applyShortcutToCurrentFile(e.code);
			}), t.appendChild(n);
		}), l) {
			let e = document.createElement("div");
			e.className = "text-[11px] text-secondary italic px-1 pt-1", e.textContent = `No shortcode matches — saving as custom text (Showing top suggestions for "${i}")`, t.prepend(e);
		}
	}
	resolveShortcut(e) {
		if (!e) return null;
		let t = String(e).trim().toUpperCase();
		if (!t) return null;
		for (let e of this.shortcuts21 || []) if (e.code && e.code.toUpperCase() === t || Array.isArray(e.codes) && e.codes.some((e) => e && e.toUpperCase() === t)) return e;
		for (let e of this.state.customShortcuts || []) if (e.code && e.code.toUpperCase() === t || Array.isArray(e.codes) && e.codes.some((e) => e && e.toUpperCase() === t)) return e;
		let n = this.getAllPresetDocuments();
		for (let e of n) if (e.code && e.code.toUpperCase() === t) return {
			code: e.code,
			codes: [e.code],
			canonical: e.name.toUpperCase(),
			label: e.name,
			keywords: e.keywords
		};
		for (let e of b || []) if (e.primaryShortcut && e.primaryShortcut.toUpperCase() === t) return {
			code: e.primaryShortcut,
			codes: [e.primaryShortcut],
			canonical: e.outputName,
			label: e.outputName,
			keywords: e.alternateKeywords
		};
		return null;
	}
	applyShortcutToCurrentFile(e) {
		let t = this.state.files[this.state.currentIndex];
		if (!t) return;
		let n = this.resolveShortcut(e), i = n ? (n.canonical || n.outputName || n.label || n.name).toUpperCase() : e.toUpperCase(), a = t.ext || ("." + t.name.split(".").pop()).toLowerCase(), o = k(i, this.getEffectiveStudentName(), this.state.settings?.groups, this.state.style).replace(/(\.[a-zA-Z0-9]+)+$/i, "").trim();
		t.targetName = `${o}${a}`, t.userEditedName = o, t.hasUserEdited = !0, t.isMatched = !0, t.docType = i, t.smartDocType = i, t.smartConfidence = 100, t.status = "ready";
		let s = document.getElementById("inputRenameTarget");
		s && (s.value = o, s.focus(), s.select()), r.show("Selected Document", `${e} → ${o}`, "info"), this.updateTelemetry(), this.renderQueue();
	}
	handleNavigateBackward() {
		this.state.files.length > 0 && (this.state.currentIndex = (this.state.currentIndex - 1 + this.state.files.length) % this.state.files.length, this.renderQueue(), this.renderCurrentPreview());
	}
	async handleKeepOriginal() {
		let e = this.state.files[this.state.currentIndex];
		if (e) {
			if (e.targetName = e.name, e.isKept = !0, e.status = "kept", e.rotation && e.rotation % 360 != 0) {
				let t = e.path || (this.state.folder?.path ? `${this.state.folder.path}/${e.name}` : null);
				if (t) try {
					let n = await p(t, e.rotation);
					if (n && n.success && (e.rotation = 0, e._pdfBytes = null, e._blobUrl && typeof URL < "u" && URL.revokeObjectURL)) {
						try {
							URL.revokeObjectURL(e._blobUrl);
						} catch {}
						e._blobUrl = null;
					}
				} catch (e) {
					console.warn("[DocMitra] Rotation on keep failed:", e);
				}
			}
			r.show("Kept Original", E(e.name), "info"), this.state.files.length > 0 && (this.state.currentIndex = (this.state.currentIndex + 1) % this.state.files.length), this.updateTelemetry(), this.renderQueue(), this.renderCurrentPreview();
		}
	}
	async handleConfirmCurrentName(e) {
		let t = this.state.files[this.state.currentIndex];
		if (!t) return;
		let n = t.ext || T(t.name), i = (e || "").trim();
		if (!i) {
			r.show("Document Name Required", "Please provide a valid filename.", "warning");
			return;
		}
		let a = i.replace(/(\.[a-zA-Z0-9]+)+$/i, "").trim(), o = this.resolveShortcut(a);
		if (o) {
			let e = o.canonical || o.label;
			a = k(e, this.getEffectiveStudentName(), this.state.settings?.groups, this.state.style).replace(/(\.[a-zA-Z0-9]+)+$/i, "").trim(), t.docType = e, t.isMatched = !0;
		}
		let s = `${a}${n}`, c = /* @__PURE__ */ new Set();
		for (let e of this.state.files) e !== t && (e.isRenamed || e.isKept ? c.add(e.targetName || e.name) : e.name && c.add(e.name));
		let l = this.getEffectiveStudentName(), u = j(s, t.name, c, l), f = u.toLowerCase() !== s.toLowerCase();
		s = u;
		let p = E(s), m = A(s);
		if (m) {
			r.show("Validation Error", `${p}: ${m}`, "error");
			return;
		}
		let h = this.state.folder && (this.state.folder.nativePath || this.state.folder.path) || "", g = t.nativePath || t.path || (h ? `${h}/${t.name}` : null), _ = E(t.name) !== p, v = t.rotation && t.rotation % 360 != 0, y = typeof window < "u" && (window.location?.search?.includes("test_mode=1") || window.__DOCMITRA_TEST_MODE__);
		if (g && (_ || v)) {
			let e = l || t.studentName || "", i = t.rotation || 0;
			r.show("Renaming Document", `Renaming to ${p}...`, "info");
			try {
				let o;
				if (o = y ? {
					success: !0,
					name: s,
					path: g.replace(/[^\\\/]+$/, s)
				} : await d(g, s, e, i), !o.success) throw Error(o.error || `Failed to rename ${t.name}`);
				let c = o.name || s, l = o.path || o.newPath || g.replace(/[^\\\/]+$/, c), u = {
					old: t.name,
					next: c,
					file: t,
					nativePath: g,
					studentName: e,
					rotation: i
				};
				if (M.pushBatch(this.state.folder, [u]), t.name = c, t.targetName = c, t.userEditedName = E(c), t.path = l, t.nativePath = l, t.isRenamed = !0, t.status = "renamed", t.smartConfidence = 100, t.hasUserEdited = !0, t.rotation = 0, t._pdfBytes = null, t._blobUrl && typeof URL < "u" && URL.revokeObjectURL) {
					try {
						URL.revokeObjectURL(t._blobUrl);
					} catch {}
					t._blobUrl = null;
				}
				t.url = `${typeof window < "u" && window.location?.origin && !window.location.origin.startsWith("file:") && !window.location.origin.includes("tauri") ? window.location.origin : "http://localhost:3000"}/api/serve-file?path=${encodeURIComponent(l)}`, f || c.toLowerCase() !== `${a}${n}`.toLowerCase() ? r.show("Duplicate Auto-Numbered", `Saved as: ${E(c)}`, "info") : r.show("Renamed Successfully", E(c), "success");
			} catch (e) {
				r.show("Rename Error", e.message, "error");
				return;
			}
		} else t.targetName = s, t.userEditedName = p, t.hasUserEdited = !0, t.isMatched = !0, t.status = "ready", t.smartConfidence = 100, t.smartDocType = t.docType || t.smartDocType || p, f ? r.show("Duplicate Auto-Numbered", `Saved as: ${p}`, "info") : r.show("Name Confirmed", p, "info");
		this.state.files.length > 0 && (this.state.currentIndex = (this.state.currentIndex + 1) % this.state.files.length), this.updateTelemetry(), this.renderQueue(), this.renderCurrentPreview();
	}
	async handleRenameSingleFile(e) {
		let t = e || this.state.files[this.state.currentIndex];
		if (!t) return;
		if (!t.targetName || t.targetName === t.name) {
			let e = document.getElementById("inputRenameTarget");
			if (e && e.value.trim()) {
				let n = t.ext || T(t.name), r = e.value.trim().replace(/(\.[a-zA-Z0-9]+)+$/i, "").trim();
				t.targetName = `${r}${n}`, t.userEditedName = r, t.hasUserEdited = !0, t.isMatched = !0, t.status = "ready", t.smartConfidence = 100, t.smartDocType = t.docType || t.smartDocType || r;
			}
		}
		if (!t.targetName) {
			r.show("Document Name Required", "Please enter a target name first.", "warning");
			return;
		}
		let n = A(t.targetName);
		if (n) {
			r.show("Validation Error", `${E(t.name)}: ${n}`, "error");
			return;
		}
		let i = this.state.folder && (this.state.folder.nativePath || this.state.folder.path) || "", a = t.nativePath || t.path || (i ? `${i}/${t.name}` : null);
		if (!a) {
			r.show("Path Error", "Cannot determine file disk path.", "error");
			return;
		}
		let o = this.state.studentName || t.studentName || "", s = t.rotation || 0;
		r.show("Renaming File", `Renaming to ${E(t.targetName)}...`, "info");
		try {
			let e = await d(a, t.targetName, o, s);
			if (!e.success) throw Error(e.error || `Failed to rename ${t.name}`);
			let n = e.name || t.targetName, i = e.path || e.newPath || a.replace(/[^\\\/]+$/, n), c = {
				old: t.name,
				next: n,
				file: t,
				nativePath: a,
				studentName: o,
				rotation: s
			};
			if (M.pushBatch(this.state.folder, [c]), t.name = n, t.targetName = n, t.userEditedName = E(n), t.isRenamed = !0, t.status = "renamed", t.path = i, t.nativePath = i, t.rotation = 0, t._pdfBytes = null, t._blobUrl && typeof URL < "u" && URL.revokeObjectURL) {
				try {
					URL.revokeObjectURL(t._blobUrl);
				} catch {}
				t._blobUrl = null;
			}
			t.url = `${typeof window < "u" && window.location?.origin && !window.location.origin.startsWith("file:") && !window.location.origin.includes("tauri") ? window.location.origin : "http://localhost:3000"}/api/serve-file?path=${encodeURIComponent(i)}`, r.show("Renamed Successfully", E(n), "success");
			let l = this.state.files.findIndex((e, t) => t > this.state.currentIndex && !e.isRenamed && !e.isKept);
			l === -1 ? this.state.currentIndex < this.state.files.length - 1 && this.state.currentIndex++ : this.state.currentIndex = l, this.updateTelemetry(), this.renderQueue(), this.renderCurrentPreview();
		} catch (e) {
			r.show("Rename Error", e.message, "error");
		}
	}
	async handleRenameAll() {
		let e = this.state.files.filter((e) => !e.isRenamed && (e.targetName && e.targetName !== e.name || e.rotation && e.rotation % 360 != 0));
		if (e.length === 0) {
			r.show("No Changes Needed", "All files are already named or kept.", "info");
			return;
		}
		for (let t of e) {
			let e = A(t.targetName);
			if (e) {
				r.show("Validation Error", `${E(t.name)}: ${e}`, "error");
				return;
			}
		}
		let t = e.map((e) => ({
			old: e.name,
			next: e.targetName,
			file: e,
			nativePath: e.path || e.nativePath,
			studentName: this.state.studentName || "",
			rotation: e.rotation || 0
		}));
		r.show("Executing Batch Rename", `Processing ${t.length} files atomically...`, "info");
		try {
			await oe(this.state.folder, t, (e, t) => {
				console.log(`[Rename Progress] ${e}%: ${t}`);
			}), M.pushBatch(this.state.folder, t), e.forEach((e) => {
				if (e.name = e.targetName, e.isRenamed = !0, e.status = "renamed", e.rotation = 0, e._pdfBytes = null, e._blobUrl && typeof URL < "u" && URL.revokeObjectURL) {
					try {
						URL.revokeObjectURL(e._blobUrl);
					} catch {}
					e._blobUrl = null;
				}
				e.path &&= e.path.replace(/[^\\\/]+$/, e.name), e.nativePath &&= e.nativePath.replace(/[^\\\/]+$/, e.name);
				let t = typeof window < "u" && window.location?.origin && !window.location.origin.startsWith("file:") && !window.location.origin.includes("tauri") ? window.location.origin : "http://localhost:3000";
				(e.path || e.nativePath) && (e.url = `${t}/api/serve-file?path=${encodeURIComponent(e.path || e.nativePath)}`);
			}), r.show("Batch Complete!", `Successfully renamed ${t.length} files.`, "success"), this.updateTelemetry(), this.renderQueue(), this.renderCurrentPreview();
		} catch (e) {
			r.show("Rename Failed", e.message, "error");
		}
	}
	async handleUndo() {
		if (!M.canUndo()) {
			r.show("Undo Stack Empty", "No previous rename batch to undo.", "info");
			return;
		}
		let e = M.pop();
		r.show("Reverting Changes", `Restoring ${e.plan.length} files...`, "info");
		try {
			await se(e.dir, e.plan, (e, t) => {
				console.log(`[Undo Progress] ${e}%: ${t}`);
			}), e.plan.forEach((e) => {
				let t = this.state.files.find((t) => t.targetName === e.next || t.name === e.next || e.file && t.id === e.file.id);
				if (t) {
					t.name = e.old, t.targetName = e.old, t.isRenamed = !1, t.status = "pending";
					let n = e.nativePath || (this.state.folder?.path ? `${this.state.folder.path}/${e.old}` : t.path?.replace(/[^\\\/]+$/, e.old));
					n && (t.path = n, t.nativePath = n, t.url = `http://localhost:3000/api/serve-file?path=${encodeURIComponent(n)}`);
				}
			}), r.show("Undo Successful", `Restored ${e.plan.length} files to original names.`, "success"), this.updateTelemetry(), this.renderQueue(), this.renderCurrentPreview();
		} catch (e) {
			r.show("Undo Failed", e.message, "error");
		}
	}
	async extractTextFromFile(e) {
		if (!e) return "";
		if (e.ext === ".pdf" || e.name && e.name.toLowerCase().endsWith(".pdf")) try {
			if (window.pdfjsLib || await new Promise((e) => this._loadPdfJs(e)), window.pdfjsLib && e.url) {
				let t = await (await window.pdfjsLib.getDocument(e.url).promise).getPage(1), n = ((await t.getTextContent()).items || []).map((e) => e.str).join(" ").trim();
				if (n && n.length >= 35) return n;
				let r = t.getViewport({ scale: 1.5 }), i = document.createElement("canvas");
				i.width = r.width, i.height = r.height;
				let a = i.getContext("2d");
				await t.render({
					canvasContext: a,
					viewport: r
				}).promise;
				let o = i.toDataURL("image/jpeg", .85), s = await (await fetch("http://localhost:3000/api/ocr-extract", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ base64Image: o })
				})).json();
				if (s && s.success) return s.text || "";
			}
		} catch (e) {
			console.warn("[DocMitra Renamer] PDF OCR extraction warning:", e);
		}
		else try {
			let t = await (await fetch("http://localhost:3000/api/ocr-extract", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ filePath: e.path || e.nativePath || "" })
			})).json();
			if (t && t.success) return t.text || "";
		} catch (e) {
			console.warn("[DocMitra Renamer] Image OCR extraction warning:", e);
		}
		return "";
	}
	async handleSmartScanBatch() {
		if (this.state.files.length === 0) return;
		this._scanAbortController && this._scanAbortController.abort(), this._scanAbortController = new AbortController();
		let e = this._scanAbortController.signal, t = this.state.files.filter((e) => !e.isRenamed && !e.isKept);
		if (t.length === 0) return;
		this.state.isSmartScanning = !0;
		let n = document.getElementById("btnSmartScanBatch"), i = n ? n.innerHTML : "";
		n && (n.classList.add("smart-scan-pulse"), n.innerHTML = `<span class="material-symbols-outlined text-[16px] animate-spin text-primary">sync</span><span>Scanning (0/${t.length})...</span>`);
		let a = /* @__PURE__ */ new Set();
		for (let e of this.state.files) (e.isRenamed || e.isKept) && a.add(e.targetName || e.name);
		r.show("Smart Scan Started", "Scanning File #1 immediately...", "info");
		let o = 0, s = [...t], c = this.state.files[this.state.currentIndex];
		if (c && s.includes(c)) {
			let e = s.indexOf(c);
			e > 0 && (s.splice(e, 1), s.unshift(c));
		}
		try {
			for (let t = 0; t < s.length && !e.aborted; t++) {
				let r = s[t];
				if (!r.isKept) {
					if (r.isScanning = !0, n && (n.innerHTML = `<span class="material-symbols-outlined text-[16px] animate-spin text-primary">sync</span><span>Scanning (${t + 1}/${s.length})...</span>`), this.renderQueue(), await new Promise((e) => setTimeout(e, 40)), e.aborted) break;
					try {
						let e = L(r.name, this.state.studentName, this.state.settings?.groups, this.getActivePresetDocuments());
						if (r.smartEvaluation = e, r.smartConfidence = e.confidence, r.smartDocType = e.docType, e.confidence >= 30 && e.docType) {
							r.docType = e.docType, r.isMatched = !0, e.confidence >= 80 && o++;
							let t = j(`${k(e.docType, this.state.studentName, this.state.settings?.groups, this.state.style).replace(/(\.[a-zA-Z0-9]+)+$/i, "").trim()}${r.ext || ("." + r.name.split(".").pop()).toLowerCase()}`, r.name, a, this.state.studentName);
							a.add(t), r.targetName = t, r.status = e.confidence >= 80 ? "matched" : "needs_review";
						} else r.isMatched = !1, r.docType = null, r.status = "unmatched";
					} catch (e) {
						console.error("[DocMitra Renamer] Filename match error on file:", r.name, e), r.smartConfidence = 0, r.isMatched = !1, r.docType = null, r.status = "unmatched";
					} finally {
						r.isScanning = !1;
					}
					this.updateTelemetry(), this.renderQueue(), this.state.files[this.state.currentIndex] === r && this.renderCurrentPreview(), await new Promise((e) => setTimeout(e, 40));
				}
			}
		} finally {
			this.state.isSmartScanning = !1, this.state.files.forEach((e) => {
				e.isScanning = !1;
			}), n && (n.classList.remove("smart-scan-pulse"), n.innerHTML = i), this.updateTelemetry(), this.renderQueue();
		}
		e.aborted || r.show("Smart Scan Complete", `${o} of ${t.length} documents identified with high confidence (>=80%).`, o > 0 ? "success" : "info");
	}
	async handleRenameAllMatched() {
		this.openCrossCheckModal();
	}
	loadPresetsAndSettings() {
		let e = localStorage.getItem("docmitra_active_preset");
		e ? e === "MAHA DBT FORM" || e === "MAHA DBT" ? this.state.activePreset = "MAHA DBT" : e === "SWAYAM FORM" || e === "SWAYAM" || e === "SWAYAM DEENDAYAL YOJANA" ? this.state.activePreset = "SWAYAM DEENDAYAL YOJANA" : e === "EDUCATIONAL" || e === "EDUCATIONAL DOCUMENTS" ? this.state.activePreset = "EDUCATIONAL DOCUMENTS" : e === "CET CELL" ? this.state.activePreset = "CET CELL" : this.state.activePreset = e : this.state.activePreset = "MAHA DBT";
		try {
			let e = localStorage.getItem("docmitra_rename_presets");
			e && (this.state.documentPresets = JSON.parse(e));
		} catch (e) {
			console.warn("[DocMitra Renamer] Failed to parse local presets:", e);
		}
		if (this.state.documentPresets && typeof this.state.documentPresets == "object" && (this.state.documentPresets.SWAYAM && !this.state.documentPresets["SWAYAM DEENDAYAL YOJANA"] && (this.state.documentPresets["SWAYAM DEENDAYAL YOJANA"] = this.state.documentPresets.SWAYAM, delete this.state.documentPresets.SWAYAM), this.state.documentPresets.EDUCATIONAL && !this.state.documentPresets["EDUCATIONAL DOCUMENTS"] && (this.state.documentPresets["EDUCATIONAL DOCUMENTS"] = this.state.documentPresets.EDUCATIONAL, delete this.state.documentPresets.EDUCATIONAL)), !this.state.documentPresets || Object.keys(this.state.documentPresets).length === 0) this.state.documentPresets = JSON.parse(JSON.stringify(Je)), this.savePresetsAndSettings();
		else {
			let e = !1;
			for (let [t, n] of Object.entries(Je)) if (!this.state.documentPresets[t]) this.state.documentPresets[t] = JSON.parse(JSON.stringify(n)), e = !0;
			else {
				let r = this.state.documentPresets[t];
				if (Array.isArray(r)) {
					let t = new Set(r.map((e) => (e.code || "").toUpperCase()));
					for (let i of n) t.has(i.code.toUpperCase()) || (r.push(JSON.parse(JSON.stringify(i))), e = !0);
				}
			}
			e && this.savePresetsAndSettings();
		}
		try {
			let e = localStorage.getItem("docmitra_custom_shortcuts");
			if (e && (this.state.customShortcuts = JSON.parse(e), Array.isArray(this.state.customShortcuts))) for (let e of this.state.customShortcuts) e.code && !this.shortcuts21.some((t) => t.code.toUpperCase() === e.code.toUpperCase()) && this.shortcuts21.push({
				code: e.code.toUpperCase(),
				label: e.label || e.canonical,
				canonical: e.canonical
			});
		} catch (e) {
			console.warn("[DocMitra Renamer] Failed to parse custom shortcuts:", e);
		}
		this.syncPresetsToShortcuts();
	}
	savePresetsAndSettings() {
		try {
			localStorage.setItem("docmitra_rename_presets", JSON.stringify(this.state.documentPresets)), localStorage.setItem("docmitra_active_preset", this.state.activePreset), this.state.settings && (this.state.settings.activeChecklist = this.state.activePreset, this.state.settings.checklists = this.state.documentPresets, W(this.state.settings)), this.state.customShortcuts && localStorage.setItem("docmitra_custom_shortcuts", JSON.stringify(this.state.customShortcuts)), Fe({ forms: this.state.documentPresets }).catch(() => {});
		} catch (e) {
			console.warn("[DocMitra Renamer] Failed to persist presets and settings:", e);
		}
	}
	syncPresetsToShortcuts() {
		if (!this.state.documentPresets) return;
		let e = /* @__PURE__ */ new Map();
		for (let t of this.shortcuts21) t && t.code && e.set(t.code.toUpperCase(), t);
		for (let t of Object.keys(this.state.documentPresets)) {
			let n = this.state.documentPresets[t];
			if (Array.isArray(n)) for (let t of n) {
				if (!t) continue;
				let n = (t.code || "").trim().toUpperCase();
				if (!n) continue;
				let r = (t.name || "").trim(), i = Array.isArray(t.keywords) ? t.keywords : typeof t.keywords == "string" ? t.keywords.split(",").map((e) => e.trim()) : [];
				if (e.has(n)) {
					let t = e.get(n);
					if (r && (!t.canonical || t.canonical === t.code) && (t.canonical = r.toUpperCase(), t.label = r), Array.isArray(t.keywords)) {
						let e = /* @__PURE__ */ new Set([...t.keywords, ...i]);
						t.keywords = Array.from(e);
					} else t.keywords = i;
				} else {
					let t = {
						code: n,
						label: r || n,
						canonical: (r || n).toUpperCase(),
						keywords: i
					};
					this.shortcuts21.push(t), e.set(n, t);
				}
			}
		}
	}
	getAllPresetDocuments() {
		let e = /* @__PURE__ */ new Map();
		if (this.state.documentPresets) for (let t of Object.keys(this.state.documentPresets)) {
			let n = this.state.documentPresets[t];
			if (Array.isArray(n)) for (let t of n) {
				if (!t) continue;
				let n = (t.code || "").toUpperCase().trim(), r = (t.name || "").toUpperCase().trim(), i = n || r;
				i && !e.has(i) && e.set(i, {
					name: (t.name || "").toUpperCase(),
					code: n,
					keywords: Array.isArray(t.keywords) ? t.keywords : []
				});
			}
		}
		for (let t of this.shortcuts21) {
			let n = (t.code || "").toUpperCase().trim(), r = (t.canonical || t.label || "").toUpperCase().trim(), i = n || r;
			i && !e.has(i) && e.set(i, {
				name: r,
				code: n,
				keywords: Array.isArray(t.keywords) ? t.keywords : []
			});
		}
		return Array.from(e.values());
	}
	getShortCodeForDoc(e) {
		if (!e) return null;
		let t = e.toUpperCase().trim(), n = this.shortcuts21.find((e) => e.code.toUpperCase() === t || e.canonical && e.canonical.toUpperCase() === t || e.label && e.label.toUpperCase() === t);
		if (n && n.code) return n.code;
		let r = this.getAllPresetDocuments().find((e) => e.code.toUpperCase() === t || e.name.toUpperCase() === t);
		return r && r.code ? r.code : null;
	}
	getActivePresetDocuments() {
		let e = this.state.activePreset || "MAHA DBT";
		return (this.state.documentPresets && this.state.documentPresets[e] || this.state.documentPresets && this.state.documentPresets["MAHA DBT"] || []).map((e) => typeof e == "string" ? {
			name: e.toUpperCase(),
			code: "",
			keywords: [e.toLowerCase()]
		} : Array.isArray(e) ? {
			name: e[0].toUpperCase(),
			code: e[2] || "",
			keywords: e[1] || [e[0].toLowerCase()]
		} : {
			name: (e.name || "").toUpperCase(),
			code: (e.code || "").toUpperCase(),
			keywords: e.keywords || [e.name?.toLowerCase()]
		});
	}
	handleOpenSettingsModal(e = "presets") {
		let t = document.getElementById("modalRenameSettings");
		t && (t.classList.remove("hidden"), this.renderSettingsModal(e));
	}
	handleCloseSettingsModal() {
		let e = document.getElementById("modalRenameSettings");
		e && e.classList.add("hidden"), this._presetDocsSearchQuery = "", this._shortcutsSearchQuery = "";
		let t = document.getElementById("inputSearchPresetDocs");
		t && (t.value = "");
		let n = document.getElementById("inputSearchShortcuts");
		n && (n.value = ""), this._recalculateTargetNames(!0), this.updateTelemetry(), this.renderQueue(), this.renderCurrentPreview();
	}
	renderSettingsModal(e = "presets") {
		let t = document.getElementById("tabContentPresets"), n = document.getElementById("tabContentShortcuts"), r = document.getElementById("tabBtnPresets"), i = document.getElementById("tabBtnShortcuts");
		e === "presets" ? (t?.classList.remove("hidden"), n?.classList.add("hidden"), r?.classList.add("text-primary", "border-primary", "font-bold"), r?.classList.remove("text-secondary", "border-transparent", "font-medium"), i?.classList.remove("text-primary", "border-primary", "font-bold"), i?.classList.add("text-secondary", "border-transparent", "font-medium")) : (t?.classList.add("hidden"), n?.classList.remove("hidden"), i?.classList.add("text-primary", "border-primary", "font-bold"), i?.classList.remove("text-secondary", "border-transparent", "font-medium"), r?.classList.remove("text-primary", "border-primary", "font-bold"), r?.classList.add("text-secondary", "border-transparent", "font-medium"));
		let a = document.getElementById("selectActivePreset");
		a && this.state.documentPresets && (a.innerHTML = "", Object.keys(this.state.documentPresets).forEach((e) => {
			let t = document.createElement("option");
			t.value = e, t.textContent = e.length > 14 ? e.slice(0, 12) + "..." : e, t.title = e, e === this.state.activePreset && (t.selected = !0), a.appendChild(t);
		}), a.title = `Active Preset: ${this.state.activePreset}`), this.renderPresetDocsTable(), this.renderShortcutsTable();
	}
	renderPresetDocsTable() {
		let e = this.getActivePresetDocuments(), t = document.getElementById("presetDocCountBadge"), n = document.getElementById("presetDocsTableBody");
		if (!n) return;
		n.innerHTML = "";
		let r = (this._presetDocsSearchQuery || "").trim().toLowerCase(), i = r ? e.filter((e) => {
			let t = (e.name || "").toLowerCase(), n = (Array.isArray(e.keywords) ? e.keywords.join(" ") : e.keywords || "").toLowerCase();
			return t.includes(r) || n.includes(r);
		}) : e;
		if (t && (t.textContent = r ? `${i.length} / ${e.length}` : String(e.length)), i.length === 0) {
			let e = document.createElement("tr");
			e.innerHTML = r ? `<td colspan="4" class="py-6 text-center text-secondary italic">No documents match "${this._presetDocsSearchQuery}".</td>` : "<td colspan=\"4\" class=\"py-6 text-center text-secondary italic\">No documents in this preset. Click \"Add Document\" above.</td>", n.appendChild(e);
		} else i.forEach((t, r) => {
			let i = document.createElement("tr");
			i.className = "hover:bg-surface-container-low transition-colors";
			let a = Array.isArray(t.keywords) ? t.keywords.join(", ") : t.keywords || "", o = e.indexOf(t);
			i.innerHTML = `
        <td class="py-2.5 px-3 text-center text-secondary font-mono-code" style="width: 48px;">${r + 1}</td>
        <td class="py-2.5 px-3 font-semibold text-on-surface truncate" style="width: 32%;" title="${t.name}">${t.name}</td>
        <td class="py-2.5 px-3 text-secondary text-[11px] leading-relaxed whitespace-normal break-words" style="width: 55%;" title="${a}">${a || "<span class=\"italic opacity-50\">-</span>"}</td>
        <td class="py-2.5 px-3 text-right whitespace-nowrap pr-4" style="width: 90px;">
          <div class="flex items-center justify-end gap-1">
            <button class="w-6 h-6 rounded hover:bg-primary/10 text-secondary hover:text-primary transition-colors flex items-center justify-center cursor-pointer btn-edit-doc" title="Edit document" type="button" data-doc-idx="${o}">
              <span class="material-symbols-outlined text-[15px]">edit</span>
            </button>
            <button class="w-6 h-6 rounded hover:bg-error/10 text-secondary hover:text-error transition-colors flex items-center justify-center cursor-pointer btn-del-doc" title="Remove document from preset" type="button" data-doc-idx="${o}">
              <span class="material-symbols-outlined text-[15px]">delete</span>
            </button>
          </div>
        </td>
      `;
			let s = i.querySelector(".btn-edit-doc");
			s && s.addEventListener("click", () => this.openEditDocumentModal(t, o));
			let c = i.querySelector(".btn-del-doc");
			c && c.addEventListener("click", () => this.handleRemoveDocFromPreset(o)), n.appendChild(i);
		});
	}
	renderShortcutsTable() {
		let e = document.getElementById("shortcutsTableBody");
		if (!e) return;
		e.innerHTML = "";
		let t = document.getElementById("shortcutsCountBadge"), n = this.shortcuts21.length, r = (this._shortcutsSearchQuery || "").trim().toLowerCase(), i = r ? this.shortcuts21.filter((e) => {
			let t = (Array.isArray(e.codes) && e.codes.length > 0 ? e.codes : e.code ? [e.code] : []).some((e) => (e || "").toLowerCase().includes(r)), n = (e.canonical || e.label || "").toLowerCase(), i = (Array.isArray(e.keywords) ? e.keywords.join(" ") : e.keywords || "").toLowerCase();
			return t || n.includes(r) || i.includes(r);
		}) : this.shortcuts21;
		if (t && (t.textContent = r ? `${i.length} / ${n}` : String(n)), i.length === 0) {
			let t = document.createElement("tr");
			t.innerHTML = `<td colspan="5" class="py-6 text-center text-secondary italic">No shortcuts match "${this._shortcutsSearchQuery}".</td>`, e.appendChild(t);
		} else i.forEach((t, n) => {
			let r = document.createElement("tr");
			r.className = "hover:bg-surface-container-low transition-colors";
			let i = Array.isArray(t.keywords) ? t.keywords.join(", ") : t.keywords || "", a = Array.isArray(t.codes) && t.codes.length > 0 ? t.codes : t.code ? [t.code] : [], o = a.map((e) => `<span class="px-1.5 py-0.5 rounded font-mono-code font-bold text-[10px] ${Ge(e)}">${e}</span>`).join(" ");
			r.innerHTML = `
        <td class="py-2.5 px-3 text-center text-secondary font-mono-code" style="width: 48px;">${n + 1}</td>
        <td class="py-2.5 px-3 whitespace-normal" style="width: 14%;"><div class="flex flex-wrap gap-1">${o}</div></td>
        <td class="py-2.5 px-3 font-semibold text-on-surface truncate" style="width: 25%;" title="${t.canonical || t.label}">${t.canonical || t.label}</td>
        <td class="py-2.5 px-3 text-secondary text-[11px] leading-relaxed whitespace-normal break-words" style="width: 45%;" title="${i}">${i || "<span class=\"italic opacity-50\">-</span>"}</td>
        <td class="py-2.5 px-3 text-right whitespace-nowrap pr-4" style="width: 90px;">
          <div class="flex items-center justify-end gap-1">
            <button class="w-6 h-6 rounded hover:bg-primary/10 text-secondary hover:text-primary transition-colors flex items-center justify-center cursor-pointer btn-edit-shortcut" title="Edit shortcut" type="button" data-code="${t.code || a[0]}">
              <span class="material-symbols-outlined text-[15px]">edit</span>
            </button>
            <button class="w-6 h-6 rounded hover:bg-error/10 text-secondary hover:text-error transition-colors flex items-center justify-center cursor-pointer btn-del-shortcut" title="Delete shortcut" type="button" data-code="${t.code || a[0]}">
              <span class="material-symbols-outlined text-[15px]">delete</span>
            </button>
          </div>
        </td>
      `;
			let s = r.querySelector(".btn-edit-shortcut");
			s && s.addEventListener("click", () => this.handleEditShortcut(t.code || a[0]));
			let c = r.querySelector(".btn-del-shortcut");
			c && c.addEventListener("click", () => this.handleRemoveShortcut(t.code || a[0])), e.appendChild(r);
		});
	}
	handleSwitchActivePreset(e) {
		e && this.state.documentPresets[e] && (this.state.activePreset = e, this.savePresetsAndSettings(), this._recalculateTargetNames(!0), this.updateTelemetry(), this.renderQueue(), this.renderCurrentPreview(), this.renderSettingsModal("presets"), r.show("Preset Switched", `Active preset: ${e}`, "success"));
	}
	handleNewPreset() {
		let e = window.prompt("Enter name for the new document preset (e.g. CET CELL, MSBNPE):");
		if (!e || !e.trim()) return;
		let t = e.trim().toUpperCase();
		this.state.documentPresets[t] ? r.show("Preset Exists", `Preset "${t}" already exists.`, "warning") : (this.state.documentPresets[t] = [], this.handleSwitchActivePreset(t), r.show("Preset Created", `New preset "${t}" created. You can now add documents to it.`, "success"));
	}
	handleCopyPreset() {
		let e = this.state.activePreset, t = this.state.documentPresets[e] || [], n = `${e} 2`, i = 2;
		for (; this.state.documentPresets[n];) i++, n = `${e} ${i}`;
		let a = window.prompt(`Copy preset "${e}" to new name:`, n);
		if (!a || !a.trim()) return;
		let o = a.trim().toUpperCase();
		this.state.documentPresets[o] ? r.show("Duplicate Preset", `Preset "${o}" already exists.`, "warning") : (this.state.documentPresets[o] = JSON.parse(JSON.stringify(t)), this.handleSwitchActivePreset(o), r.show("Preset Copied", `Copied "${e}" to "${o}".`, "success"));
	}
	handleRenamePreset() {
		let e = this.state.activePreset, t = window.prompt(`Rename preset "${e}" to:`, e);
		if (!t || !t.trim() || t.trim().toUpperCase() === e) return;
		let n = t.trim().toUpperCase();
		this.state.documentPresets[n] ? r.show("Duplicate Name", `Preset "${n}" already exists.`, "warning") : (this.state.documentPresets[n] = this.state.documentPresets[e], delete this.state.documentPresets[e], this.handleSwitchActivePreset(n), r.show("Preset Renamed", `Preset renamed to "${n}".`, "success"));
	}
	handleDeletePreset() {
		if (Object.keys(this.state.documentPresets).length <= 1) {
			r.show("Cannot Delete", "At least one preset must remain.", "warning");
			return;
		}
		let e = this.state.activePreset;
		if (!window.confirm(`Are you sure you want to delete preset "${e}"?`)) return;
		delete this.state.documentPresets[e];
		let t = Object.keys(this.state.documentPresets);
		this.state.activePreset = t[0] || "MAHA DBT", this.savePresetsAndSettings(), this._recalculateTargetNames(!0), this.updateTelemetry(), this.renderQueue(), this.renderCurrentPreview(), this.renderSettingsModal("presets"), r.show("Preset Deleted", `Preset "${e}" deleted. Switched to ${this.state.activePreset}.`, "info");
	}
	handleResetPresetsDefault() {
		window.confirm("Reset document presets to factory defaults? All custom presets will be removed and default 4 presets restored.") && (this.state.documentPresets = JSON.parse(JSON.stringify(Je)), this.state.activePreset = "MAHA DBT", this.state.customShortcuts = [], this.shortcuts21 = JSON.parse(JSON.stringify(Ke)), this.savePresetsAndSettings(), this._recalculateTargetNames(!0), this.updateTelemetry(), this.renderQueue(), this.renderCurrentPreview(), this.renderSettingsModal("presets"), r.show("Reset Complete", "Document presets restored to factory defaults.", "success"));
	}
	handleRemoveDocFromPreset(e) {
		let t = this.state.documentPresets[this.state.activePreset];
		if (t && t[e]) {
			let n = t.splice(e, 1)[0];
			this.savePresetsAndSettings(), this._recalculateTargetNames(!0), this.updateTelemetry(), this.renderQueue(), this.renderCurrentPreview(), this.renderSettingsModal("presets"), r.show("Document Removed", `${n.name || "Document"} removed from preset.`, "info");
		}
	}
	handleRemoveShortcut(e) {
		e && (this.state.customShortcuts = (this.state.customShortcuts || []).filter((t) => t.code.toUpperCase() !== e.toUpperCase()), this.shortcuts21 = this.shortcuts21.filter((t) => t.code.toUpperCase() !== e.toUpperCase()), this.savePresetsAndSettings(), this.renderSettingsModal("shortcuts"), r.show("Shortcut Removed", `Shortcut ${e} removed.`, "info"));
	}
	openEditDocumentModal(e, t) {
		this._editingDocIdx = t, this.openAddDocumentModal(e, !1);
	}
	handleEditShortcut(e) {
		let t = (e || "").toUpperCase(), n = this.resolveShortcut(t) || this.shortcuts21.find((e) => e.code && e.code.toUpperCase() === t || Array.isArray(e.codes) && e.codes.some((e) => e && e.toUpperCase() === t));
		if (!n) return;
		let r = (this.state.customShortcuts || []).find((e) => e.code && e.code.toUpperCase() === t || Array.isArray(e.codes) && e.codes.some((e) => e && e.toUpperCase() === t));
		this._editingShortcutCode = t;
		let i = Array.isArray(n.codes) && n.codes.length > 0 ? n.codes : [n.code || t];
		this.openAddDocumentModal({
			code: n.code || t,
			codes: i,
			name: n.canonical || n.label,
			keywords: r ? r.keywords : n.keywords || []
		}, !0);
	}
	renderShortcutChips() {
		let e = document.getElementById("containerShortcutChips");
		if (e) {
			if (e.innerHTML = "", !this._currentShortcutCodes || this._currentShortcutCodes.length === 0) {
				let t = document.createElement("span");
				t.className = "text-secondary text-[11px] italic select-none", t.textContent = "No short codes added. Type code above and click Add or press Enter.", e.appendChild(t);
			} else this._currentShortcutCodes.forEach((t) => {
				let n = document.createElement("span");
				n.className = "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-primary text-white font-mono-code font-bold text-[11px] shadow-xs select-none";
				let r = document.createElement("span");
				r.textContent = t, n.appendChild(r);
				let i = document.createElement("button");
				i.type = "button", i.className = "hover:bg-white/20 rounded p-0.5 inline-flex items-center justify-center cursor-pointer text-white/80 hover:text-white transition-colors", i.title = `Remove ${t}`, i.innerHTML = "<span class=\"material-symbols-outlined text-[13px]\">close</span>", i.addEventListener("click", (e) => {
					e.preventDefault(), e.stopPropagation(), this._currentShortcutCodes = this._currentShortcutCodes.filter((e) => e !== t), this.renderShortcutChips();
				}), n.appendChild(i), e.appendChild(n);
			});
		}
	}
	openAddDocumentModal(e = null, t = !1) {
		let n = document.getElementById("modalAddDocument");
		if (!n) return;
		let r = document.getElementById("containerAddDocCode"), i = document.getElementById("inputAddDocCode"), a = document.getElementById("inputAddDocName"), o = document.getElementById("inputAddDocAliases"), s = document.getElementById("addDocTargetPreview"), c = n.querySelector("h3"), l = n.querySelector("p");
		this._isShortcutOnly = !!t, this._isShortcutOnly ? (r && r.classList.remove("hidden"), l && (l.textContent = "Assign short code(s) and keywords to a canonical document name"), this._currentShortcutCodes = e ? Array.isArray(e.codes) && e.codes.length > 0 ? [...e.codes] : e.code ? [e.code] : [] : [], this.renderShortcutChips()) : (r && r.classList.add("hidden"), l && (l.textContent = "Define document name and keywords for auto-matching in preset"), this._currentShortcutCodes = []), e ? (c && (c.textContent = t ? "Edit Shortcut" : "Edit Document in Preset"), i && (i.value = ""), a && (a.value = e.name || e.canonical || ""), o && (o.value = Array.isArray(e.keywords) ? e.keywords.join(", ") : e.keywords || "")) : (this._editingDocIdx = null, this._editingShortcutCode = null, c && (c.textContent = t ? "Add Shortcut" : "Add Document to Preset"), i && (i.value = ""), a && (a.value = ""), o && (o.value = ""));
		let u = () => {
			let e = k(a?.value.trim() || "DOCUMENT", this.getEffectiveStudentName(), null, this.state.style).replace(/(\.[a-zA-Z0-9]+)+$/i, "").trim();
			s && (s.textContent = e);
		};
		a && (a.oninput = u, a.onkeydown = (e) => {
			e.key === "Enter" && (e.preventDefault(), this.handleSaveDocumentType());
		});
		let d = document.getElementById("btnAddShortcutChip");
		d && (d.onclick = (e) => {
			e.preventDefault();
			let t = (i?.value || "").trim().toUpperCase();
			t && (this._currentShortcutCodes ||= [], this._currentShortcutCodes.includes(t) || (this._currentShortcutCodes.push(t), this.renderShortcutChips()), i && (i.value = ""), i?.focus());
		}), i && (i.oninput = () => {
			i.value = i.value.toUpperCase();
		}, i.onkeydown = (e) => {
			if (e.key === "Enter") {
				e.preventDefault();
				let t = (i.value || "").trim().toUpperCase();
				t ? (this._currentShortcutCodes ||= [], this._currentShortcutCodes.includes(t) || (this._currentShortcutCodes.push(t), this.renderShortcutChips()), i.value = "") : a?.focus();
			}
		}), u(), n.classList.remove("hidden"), this._isShortcutOnly && i ? i.focus() : a && a.focus();
	}
	closeAddDocumentModal() {
		let e = document.getElementById("modalAddDocument");
		e && e.classList.add("hidden"), this._editingDocIdx = null, this._editingShortcutCode = null, this._isShortcutOnly = !1, this._currentShortcutCodes = [];
	}
	handleSaveDocumentType() {
		let e = document.getElementById("inputAddDocCode"), t = document.getElementById("inputAddDocName"), n = document.getElementById("inputAddDocAliases"), i = (t?.value || "").trim();
		if (!i) {
			r.show("Document Name Required", "Please enter a Full Document Name.", "warning");
			return;
		}
		let a = i.toUpperCase(), o = (n?.value || "").trim(), s = [];
		s = o ? o.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean) : [a.toLowerCase(), ...I(a)];
		let c = this._isShortcutOnly;
		if (c) {
			let t = (e?.value || "").trim().toUpperCase();
			if (!t || this._currentShortcutCodes && this._currentShortcutCodes.includes(t) || (this._currentShortcutCodes ||= [], this._currentShortcutCodes.push(t)), !this._currentShortcutCodes || this._currentShortcutCodes.length === 0) {
				r.show("Short Code Required", "Please add at least one short code chip.", "warning");
				return;
			}
			let n = [...this._currentShortcutCodes], i = n[0];
			if (this._editingShortcutCode) {
				let e = this._editingShortcutCode.toUpperCase();
				this.shortcuts21 = this.shortcuts21.filter((t) => !(t.code && t.code.toUpperCase() === e || Array.isArray(t.codes) && t.codes.some((t) => t && t.toUpperCase() === e))), this.state.customShortcuts && (this.state.customShortcuts = this.state.customShortcuts.filter((t) => !(t.code && t.code.toUpperCase() === e || Array.isArray(t.codes) && t.codes.some((t) => t && t.toUpperCase() === e))));
			}
			let o = {
				code: i,
				codes: n,
				label: a,
				canonical: a,
				keywords: s
			};
			this.shortcuts21.push(o), this.state.customShortcuts || (this.state.customShortcuts = []), this.state.customShortcuts.push(o), n.forEach((e) => {
				le({
					canonical: a,
					code: e,
					primaryKeywords: [a.toLowerCase(), e.toLowerCase()],
					secondaryKeywords: s
				});
			});
		} else {
			this.state.documentPresets[this.state.activePreset] || (this.state.documentPresets[this.state.activePreset] = []);
			let e = this.state.documentPresets[this.state.activePreset], t = {
				name: a,
				keywords: s
			};
			if (this._editingDocIdx !== null && this._editingDocIdx !== void 0 && e[this._editingDocIdx]) e[this._editingDocIdx] = t;
			else {
				let n = e.findIndex((e) => (typeof e == "string" ? e : e.name || "").toUpperCase() === a);
				n === -1 ? e.push(t) : e[n] = t;
			}
		}
		this._editingDocIdx = null, this._editingShortcutCode = null, this._isShortcutOnly = !1, this._currentShortcutCodes = [], this.closeAddDocumentModal(), this.savePresetsAndSettings(), this._recalculateTargetNames(!0), this.updateTelemetry(), this.renderQueue(), this.renderCurrentPreview(), this.renderSettingsModal(c ? "shortcuts" : "presets"), r.show("Saved", `${a} saved successfully.`, "success");
	}
	_initCrossCheckEvents() {
		let e = document.getElementById("modalCrossCheck");
		if (!e) return;
		let t = document.getElementById("btnCloseCrossCheckModal");
		t && t.addEventListener("click", () => this.closeCrossCheckModal());
		let n = document.getElementById("btnCancelCrossCheck");
		n && n.addEventListener("click", () => this.closeCrossCheckModal());
		let i = document.getElementById("btnConfirmBatchRename");
		i && i.addEventListener("click", () => this.handleConfirmCrossCheckRename()), e.querySelectorAll("[data-pattern-order]").forEach((t) => {
			t.addEventListener("click", () => {
				this._crossCheckState && (this._crossCheckState.order = t.dataset.patternOrder, e.querySelectorAll("[data-pattern-order]").forEach((e) => e.classList.toggle("active", e === t)), this._renderCrossCheckRows());
			});
		}), e.querySelectorAll("[data-pattern-sep]").forEach((t) => {
			t.addEventListener("click", () => {
				this._crossCheckState && (this._crossCheckState.separator = t.dataset.patternSep, e.querySelectorAll("[data-pattern-sep]").forEach((e) => e.classList.toggle("active", e === t)), this._renderCrossCheckRows());
			});
		});
		let a = document.getElementById("btnToggleCrossCheckStudent"), o = document.getElementById("crossCheckStudentToggleLabel");
		a && a.addEventListener("click", () => {
			this._crossCheckState && (this._crossCheckState.includeStudent = !this._crossCheckState.includeStudent, o && (o.textContent = this._crossCheckState.includeStudent ? "ON" : "OFF"), a.classList.toggle("opacity-50", !this._crossCheckState.includeStudent), this._renderCrossCheckRows());
		}), e.querySelectorAll("[data-pattern-case]").forEach((t) => {
			t.addEventListener("click", () => {
				this._crossCheckState && (this._crossCheckState.casing = t.dataset.patternCase, e.querySelectorAll("[data-pattern-case]").forEach((e) => e.classList.toggle("active", e === t)), this._renderCrossCheckRows());
			});
		}), e.querySelectorAll("[data-pattern-filter]").forEach((t) => {
			t.addEventListener("click", () => {
				this._crossCheckState && (this._crossCheckState.filter = t.dataset.patternFilter, e.querySelectorAll("[data-pattern-filter]").forEach((e) => e.classList.toggle("active", e === t)), this._renderCrossCheckRows());
			});
		});
		let s = document.getElementById("btnTogglePowerUtilities"), c = document.getElementById("stripPowerUtilities"), l = document.getElementById("powerUtilitiesArrow");
		s && c && s.addEventListener("click", () => {
			c.classList.contains("hidden") ? (c.classList.remove("hidden"), l && (l.style.transform = "rotate(180deg)")) : (c.classList.add("hidden"), l && (l.style.transform = "rotate(0deg)"));
		});
		let u = document.getElementById("btnCrossCheckApplyReplace"), d = document.getElementById("inputCrossCheckFind"), f = document.getElementById("inputCrossCheckReplace");
		u && d && f && u.addEventListener("click", () => {
			let e = d.value, t = f.value;
			if (!e) {
				r.show("Find Empty", "Please enter text to find.", "info");
				return;
			}
			let n = 0;
			this._getMatchedCrossCheckFiles().forEach((r) => {
				let i = this._getCrossCheckTargetBase(r);
				if (i.toLowerCase().includes(e.toLowerCase())) {
					let a = new RegExp(e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), o = i.replace(a, t);
					this._crossCheckState.overrides.set(r.id, o), n++;
				}
			}), r.show("Find & Replace", `Replaced in ${n} document(s).`, "success"), this._renderCrossCheckRows();
		});
		let p = document.getElementById("btnCrossCheckCleanJunk");
		p && p.addEventListener("click", () => {
			let e = 0;
			this._getMatchedCrossCheckFiles().forEach((t) => {
				let n = this._getCrossCheckTargetBase(t), r = _e(n);
				r !== n && (this._crossCheckState.overrides.set(t.id, r), e++);
			}), r.show("Junk Cleanup", `Cleaned scanner timestamps and prefixes in ${e} document(s).`, "success"), this._renderCrossCheckRows();
		});
		let m = document.getElementById("btnCrossCheckPortalSafe");
		m && m.addEventListener("click", () => {
			let e = 0;
			this._getMatchedCrossCheckFiles().forEach((t) => {
				let n = this._getCrossCheckTargetBase(t), r = ve(n);
				r !== n && (this._crossCheckState.overrides.set(t.id, r), e++);
			}), r.show("Portal-Safe Cleaned", `Formatted ${e} document(s) for admission portals.`, "success"), this._renderCrossCheckRows();
		});
		let h = document.getElementById("btnCrossCheckResetPatterns");
		h && h.addEventListener("click", () => {
			this._crossCheckState.overrides.clear(), this._crossCheckState.order = "doc_student", this._crossCheckState.separator = " ", this._crossCheckState.includeStudent = !0, this._crossCheckState.casing = this.state.style || "upper", this._crossCheckState.filter = "all", e.querySelectorAll("[data-pattern-order]").forEach((e) => e.classList.toggle("active", e.dataset.patternOrder === "doc_student")), e.querySelectorAll("[data-pattern-sep]").forEach((e) => e.classList.toggle("active", e.dataset.patternSep === " ")), e.querySelectorAll("[data-pattern-case]").forEach((e) => e.classList.toggle("active", e.dataset.patternCase === this._crossCheckState.casing)), e.querySelectorAll("[data-pattern-filter]").forEach((e) => e.classList.toggle("active", e.dataset.patternFilter === "all")), o && (o.textContent = "ON"), a && a.classList.remove("opacity-50"), r.show("Rules Reset", "Reset patterns to smart auto-match defaults.", "info"), this._renderCrossCheckRows();
		});
		let g = document.getElementById("chkCrossCheckSelectAll");
		g && g.addEventListener("change", (t) => {
			e.querySelectorAll(".crosscheck-row-cb").forEach((e) => {
				e.checked = t.target.checked;
				let n = e.closest("tr");
				n && n.dataset.fileId && this._crossCheckState.userToggled.set(n.dataset.fileId, t.target.checked);
			}), this._updateCrossCheckSelectionCount();
		}), e.addEventListener("keydown", (t) => {
			if (e.classList.contains("hidden")) return;
			let n = t.target.tagName === "INPUT" && t.target.type === "text";
			if (t.key === "Escape") {
				t.preventDefault(), this.closeCrossCheckModal();
				return;
			}
			if (t.key === "Enter") {
				if (n) {
					if (t.target.id === "inputCrossCheckFind" || t.target.id === "inputCrossCheckReplace") {
						t.preventDefault();
						let e = document.getElementById("btnCrossCheckApplyReplace");
						e && e.click();
					}
					return;
				}
				t.preventDefault();
				let e = document.getElementById("btnConfirmBatchRename");
				e && !e.disabled && this.handleConfirmCrossCheckRename();
				return;
			}
			if (n) return;
			let r = Array.from(e.querySelectorAll("#crossCheckTableBody tr"));
			if (r.length !== 0) {
				if (t.key === "ArrowDown") t.preventDefault(), this._crossCheckState.focusedIndex = Math.min(this._crossCheckState.focusedIndex + 1, r.length - 1), this._highlightFocusedCrossCheckRow(r);
				else if (t.key === "ArrowUp") t.preventDefault(), this._crossCheckState.focusedIndex = Math.max(this._crossCheckState.focusedIndex - 1, 0), this._highlightFocusedCrossCheckRow(r);
				else if (t.key === " ") {
					t.preventDefault();
					let e = r[this._crossCheckState.focusedIndex];
					if (e) {
						let t = e.querySelector(".crosscheck-row-cb");
						t && (t.checked = !t.checked, e.dataset.fileId && this._crossCheckState.userToggled.set(e.dataset.fileId, t.checked), this._updateCrossCheckSelectionCount());
					}
				}
			}
		});
		let _ = document.getElementById("btnFloatingUndo");
		_ && _.addEventListener("click", () => {
			this.hideFloatingUndoToast(), this.handleUndo();
		});
		let v = document.getElementById("btnDismissFloatingUndo");
		v && v.addEventListener("click", () => {
			this.hideFloatingUndoToast();
		});
	}
	_highlightFocusedCrossCheckRow(e) {
		e.forEach((e, t) => {
			let n = t === this._crossCheckState.focusedIndex;
			e.classList.toggle("keyboard-focused-row", n), n && e.scrollIntoView({
				block: "nearest",
				behavior: "smooth"
			});
		});
	}
	_getMatchedCrossCheckFiles() {
		return this.state.files.filter((e) => e.isRenamed || e.status === "needs_review" ? !1 : e.smartConfidence >= 80 || e.smartConfidence === void 0 && e.isMatched);
	}
	_getCrossCheckTargetBase(e) {
		return this._crossCheckState && this._crossCheckState.overrides && this._crossCheckState.overrides.has(e.id) ? this._crossCheckState.overrides.get(e.id) : e.docType || E(e.name);
	}
	_getCrossCheckTargetName(e) {
		let t = (this.state.studentName || "").replace(/\.[a-zA-Z0-9]+$/i, "").trim(), n = e.ext || T(e.name) || "", r = this._getCrossCheckTargetBase(e), i = "";
		return i = this._crossCheckState && this._crossCheckState.overrides && this._crossCheckState.overrides.has(e.id) ? O(r, this._crossCheckState.casing) : ge(r, t, {
			order: this._crossCheckState ? this._crossCheckState.order : "doc_student",
			separator: this._crossCheckState ? this._crossCheckState.separator : " ",
			includeStudent: !this._crossCheckState || this._crossCheckState.includeStudent,
			casing: this._crossCheckState ? this._crossCheckState.casing : this.state.style || "upper"
		}), `${i}${n}`;
	}
	openCrossCheckModal() {
		if (this._getMatchedCrossCheckFiles().length === 0) {
			r.show("No Matched Documents", "No auto-matched documents found with >=80% confidence.", "info");
			return;
		}
		let e = document.getElementById("modalCrossCheck");
		if (!e) return;
		this._crossCheckState = {
			order: "doc_student",
			separator: " ",
			includeStudent: !0,
			casing: this.state.style || "upper",
			filter: "all",
			overrides: /* @__PURE__ */ new Map(),
			userToggled: /* @__PURE__ */ new Map(),
			focusedIndex: 0
		}, e.querySelectorAll("[data-pattern-order]").forEach((e) => e.classList.toggle("active", e.dataset.patternOrder === "doc_student")), e.querySelectorAll("[data-pattern-sep]").forEach((e) => e.classList.toggle("active", e.dataset.patternSep === " ")), e.querySelectorAll("[data-pattern-case]").forEach((e) => e.classList.toggle("active", e.dataset.patternCase === this._crossCheckState.casing)), e.querySelectorAll("[data-pattern-filter]").forEach((e) => e.classList.toggle("active", e.dataset.patternFilter === "all"));
		let t = document.getElementById("crossCheckStudentToggleLabel");
		t && (t.textContent = "ON");
		let n = document.getElementById("btnToggleCrossCheckStudent");
		n && n.classList.remove("opacity-50"), this._renderCrossCheckRows(), e.classList.remove("hidden");
	}
	_renderCrossCheckRows() {
		let e = document.getElementById("modalCrossCheck");
		if (!e) return;
		let t = document.getElementById("crossCheckTableBody"), n = document.getElementById("crossCheckIdenticalTableBody"), r = document.getElementById("crossCheckTotalCount"), i = document.getElementById("crossCheckActiveCount"), a = document.getElementById("crossCheckIdenticalCount"), o = document.getElementById("crossCheckActiveEmpty"), s = document.getElementById("drawerIdenticalFiles"), c = document.getElementById("crossCheckStudentLabel"), l = (this.state.studentName || "").replace(/\.[a-zA-Z0-9]+$/i, "").trim();
		c && (c.textContent = l || "Not Set");
		let u = this._getMatchedCrossCheckFiles();
		r && (r.textContent = String(u.length));
		let d = this._crossCheckState ? this._crossCheckState.filter : "all", f = u.filter((e) => {
			let t = (e.ext || T(e.name) || "").toLowerCase();
			return d === "pdf" ? t === ".pdf" : d !== "images" || [
				".jpg",
				".jpeg",
				".png",
				".webp",
				".bmp"
			].includes(t);
		});
		t && (t.innerHTML = ""), n && (n.innerHTML = "");
		let p = [], m = [];
		f.forEach((e) => {
			let t = this._getCrossCheckTargetName(e), n = he(e.name, t, this.state.studentName);
			n.isIdentical ? m.push({
				file: e,
				targetName: t,
				diff: n
			}) : p.push({
				file: e,
				targetName: t,
				diff: n
			});
		}), i && (i.textContent = String(p.length)), a && (a.textContent = String(m.length)), o && o.classList.toggle("hidden", p.length > 0), s && s.classList.toggle("hidden", m.length === 0), p.forEach((e, n) => {
			let { file: r, targetName: i, diff: a } = e, o = document.createElement("tr");
			o.className = "hover:bg-surface-container-high/40 transition-colors", o.dataset.fileId = r.id;
			let s = !this._crossCheckState.userToggled.has(r.id) || this._crossCheckState.userToggled.get(r.id), c = document.createElement("td");
			c.className = "py-2 px-3 text-center";
			let l = document.createElement("input");
			l.type = "checkbox", l.checked = s, l.className = "w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer crosscheck-row-cb", l.addEventListener("change", () => {
				this._crossCheckState.userToggled.set(r.id, l.checked), this._updateCrossCheckSelectionCount();
			}), c.appendChild(l), o.appendChild(c);
			let u = document.createElement("td");
			u.className = "py-2 px-3 font-mono-code text-[12px] truncate max-w-[240px]", u.title = E(r.name), u.innerHTML = a.oldHtml, o.appendChild(u);
			let d = document.createElement("td");
			d.className = "py-2 px-2 text-center text-outline-variant font-bold select-none", d.textContent = "→", o.appendChild(d);
			let f = document.createElement("td");
			f.className = "py-2 px-3 font-mono-code text-[12px] truncate max-w-[280px]", f.title = E(i), f.innerHTML = a.newHtml, o.appendChild(f);
			let p = document.createElement("td");
			p.className = "py-2 px-3 text-right flex items-center justify-end gap-1.5";
			let m = document.createElement("span");
			if (a.changeType === "casing") m.className = "px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-primary/10 text-primary border border-primary/20", m.textContent = "Case Change";
			else if (a.changeType === "student") m.className = "px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-tertiary-fixed text-on-tertiary-fixed", m.textContent = "+ Student";
			else {
				let e = r.smartConfidence === void 0 ? 90 : r.smartConfidence;
				m.className = "confidence-badge confidence-badge-high", m.textContent = `🟢 ${e}% Match`;
			}
			p.appendChild(m), o.appendChild(p), t && t.appendChild(o);
		}), m.forEach((e) => {
			let { file: t, targetName: r, diff: i } = e, a = document.createElement("tr");
			a.className = "hover:bg-surface-container-high/40 transition-colors", a.dataset.fileId = t.id;
			let o = this._crossCheckState.userToggled.has(t.id) ? this._crossCheckState.userToggled.get(t.id) : !1, s = document.createElement("td");
			s.className = "py-2 px-3 text-center w-10";
			let c = document.createElement("input");
			c.type = "checkbox", c.checked = o, c.className = "w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer crosscheck-row-cb", c.addEventListener("change", () => {
				this._crossCheckState.userToggled.set(t.id, c.checked), this._updateCrossCheckSelectionCount();
			}), s.appendChild(c), a.appendChild(s);
			let l = document.createElement("td");
			l.className = "py-2 px-3 font-mono-code text-[11px] text-secondary truncate max-w-[240px]", l.title = E(t.name), l.textContent = E(t.name), a.appendChild(l);
			let u = document.createElement("td");
			u.className = "py-2 px-2 text-center text-outline-variant select-none w-8", u.textContent = "→", a.appendChild(u);
			let d = document.createElement("td");
			d.className = "py-2 px-3 font-mono-code text-[11px] text-secondary truncate max-w-[280px]", d.title = E(r), d.textContent = E(r), a.appendChild(d);
			let f = document.createElement("td");
			f.className = "py-2 px-3 text-right";
			let p = document.createElement("span");
			p.className = "px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-surface-container text-secondary border border-outline-variant/30", p.textContent = "Identical", f.appendChild(p), a.appendChild(f), n && n.appendChild(a);
		});
		let h = Array.from(e.querySelectorAll("#crossCheckTableBody tr"));
		h.length > 0 && (this._crossCheckState.focusedIndex = Math.min(this._crossCheckState.focusedIndex, h.length - 1), this._highlightFocusedCrossCheckRow(h)), this._updateCrossCheckSelectionCount();
	}
	_updateCrossCheckSelectionCount() {
		let e = document.getElementById("modalCrossCheck");
		if (!e) return;
		let t = e.querySelectorAll(".crosscheck-row-cb"), n = Array.from(t).filter((e) => e.checked), r = document.getElementById("crossCheckSelectedCount"), i = document.getElementById("confirmRenameLabel"), a = document.getElementById("btnConfirmBatchRename"), o = document.getElementById("chkCrossCheckSelectAll");
		r && (r.textContent = String(n.length)), i && (i.textContent = `Confirm & Rename (${n.length})`), a && (a.disabled = n.length === 0), o && (o.checked = t.length > 0 && n.length === t.length);
	}
	closeCrossCheckModal() {
		let e = document.getElementById("modalCrossCheck");
		e && e.classList.add("hidden");
	}
	showFloatingUndoToast(e) {
		let t = document.getElementById("toastFloatingUndo");
		if (!t) return;
		let n = document.getElementById("floatingUndoMessage"), r = document.getElementById("floatingUndoBtnLabel");
		n && (n.innerHTML = `Successfully renamed <strong>${e}</strong> documents in 0.1s`), r && (r.textContent = `Undo All (${e})`), t.classList.remove("hidden"), this._floatingUndoTimer && clearTimeout(this._floatingUndoTimer), this._floatingUndoTimer = setTimeout(() => {
			this.hideFloatingUndoToast();
		}, 7e3);
	}
	hideFloatingUndoToast() {
		let e = document.getElementById("toastFloatingUndo");
		e && e.classList.add("hidden"), this._floatingUndoTimer &&= (clearTimeout(this._floatingUndoTimer), null);
	}
	async handleConfirmCrossCheckRename() {
		let e = document.getElementById("modalCrossCheck");
		if (!e) return;
		let t = e.querySelectorAll(".crosscheck-row-cb:checked"), n = [];
		if (t.forEach((e) => {
			let t = e.closest("tr");
			if (t && t.dataset.fileId) {
				let e = this.state.files.find((e) => e.id === t.dataset.fileId);
				e && n.push(e);
			}
		}), n.length === 0) {
			r.show("No Files Selected", "Please select at least one document to rename.", "warning");
			return;
		}
		let i = [];
		for (let e of n) {
			let t = this._getCrossCheckTargetName(e), n = A(t);
			if (n) {
				r.show("Validation Error", `${E(e.name)}: ${n}`, "error");
				return;
			}
			i.push({
				old: e.name,
				next: t,
				file: e,
				nativePath: e.path || e.nativePath,
				studentName: this.state.studentName || "",
				rotation: e.rotation || 0
			});
		}
		try {
			await oe(this.state.folder, i, (e, t) => {
				console.log(`[Batch Rename Progress] ${e}%: ${t}`);
			}), M.pushBatch(this.state.folder, i), i.forEach((e) => {
				let t = e.file;
				if (t.name = e.next, t.targetName = e.next, t.isRenamed = !0, t.status = "renamed", t.rotation = 0, t._pdfBytes = null, t._blobUrl && typeof URL < "u" && URL.revokeObjectURL) {
					try {
						URL.revokeObjectURL(t._blobUrl);
					} catch {}
					t._blobUrl = null;
				}
				t.path &&= t.path.replace(/[^\\\/]+$/, t.name), t.nativePath &&= t.nativePath.replace(/[^\\\/]+$/, t.name);
				let n = typeof window < "u" && window.location?.origin && !window.location.origin.startsWith("file:") && !window.location.origin.includes("tauri") ? window.location.origin : "http://localhost:3000";
				(t.path || t.nativePath) && (t.url = `${n}/api/serve-file?path=${encodeURIComponent(t.path || t.nativePath)}`);
			}), this.closeCrossCheckModal(), this.showFloatingUndoToast(i.length);
			let e = this.state.files.findIndex((e) => !e.isRenamed);
			e !== -1 && (this.state.currentIndex = e), this.updateTelemetry(), this.renderQueue(), this.renderCurrentPreview();
		} catch (e) {
			r.show("Rename Failed", e.message, "error");
		}
	}
	handleSaveBatch() {
		if (!this.state.folder) {
			r.show("No Active Batch", "Please load a folder first.", "warning");
			return;
		}
		let e = {
			folder: this.state.folder,
			files: this.state.files.map((e) => ({
				name: e.name,
				targetName: e.targetName,
				docType: e.docType,
				isMatched: e.isMatched,
				isRenamed: e.isRenamed,
				isKept: e.isKept
			})),
			timestamp: (/* @__PURE__ */ new Date()).toISOString()
		};
		localStorage.setItem("docmitra_last_batch", JSON.stringify(e)), r.show("Batch State Saved", "Current progress saved locally.", "success");
	}
	handleExportAudit() {
		if (this.state.files.length === 0) {
			r.show("Nothing to Export", "Queue is empty.", "info");
			return;
		}
		let e = this.state.activePreset || this.state.settings?.activeChecklist || "MAHA DBT", t = [];
		t = this.state.documentPresets && this.state.documentPresets[e] ? this.state.documentPresets[e].map((e) => ({
			name: e.name,
			keywords: Array.isArray(e.keywords) ? e.keywords : [e.name.toLowerCase()]
		})) : ((this.state.settings?.checklists || y)[e] || y["MAHA DBT FORM"] || []).map((e) => Array.isArray(e) ? {
			name: e[0],
			keywords: e[1] || [e[0].toLowerCase()]
		} : e);
		let n = this.state.files.map((e) => e.targetName || e.name), i = this.state.settings?.linkedRules || v, a = t.map((e) => ie(n, e, i)), o = a.filter((e) => e.status === "green").length, s = a.length - o, c = t.length > 0 ? Math.round(o / t.length * 100) : 0, l = a.map((e, n) => e.status === "green" ? null : t[n].name).filter(Boolean), u = P([{
			studentName: this.state.studentName || "Student",
			folderName: this.state.folder?.name || "Folder",
			summary: {
				evaluations: a.map((e, n) => ({
					rule: t[n],
					status: e.status,
					isLinked: e.isLinked
				})),
				foundCount: o,
				missingCount: s,
				totalRequired: t.length,
				percentComplete: c,
				isReady: s === 0,
				missingList: l
			}
		}], t, e);
		ae(`DocMitra_Audit_${(this.state.studentName || "Batch").replace(/\s+/g, "_")}.csv`, u), r.show("Audit Exported", `CSV report for ${t.length} admission rules downloaded.`, "success");
	}
	handleClearQueue(e = !1) {
		if (this.state.files && typeof URL < "u" && URL.revokeObjectURL) for (let e of this.state.files) {
			if (e && e._blobUrl) {
				try {
					URL.revokeObjectURL(e._blobUrl);
				} catch {}
				e._blobUrl = null;
			}
			e._pdfBytes = null;
		}
		this.state.files = [], this.state.folder = null, this.state.subfolders = [], this.state.currentSubfolderIndex = 0, this.state.studentName = "", this.state.currentIndex = 0, this.state.activePdfDoc = null, this.state.activePdfUrl = null, this.updateTelemetry(), this.renderQueue(), this.renderCurrentPreview(), e || r.show("Workspace Cleared", "Intake queue and preview have been reset.", "info");
	}
	renderCurrentPreview() {
		let e = document.getElementById("col-preview");
		if (!e) return;
		let t = this.state.files[this.state.currentIndex];
		this.state.rotation = t && t.rotation || 0;
		let n = e.querySelector(".overflow-auto");
		if (!n) return;
		for (; n.firstChild;) n.removeChild(n.firstChild);
		if (!t) {
			let e = document.createElement("div");
			e.id = "previewContainerStage", e.className = "h-full max-h-[calc(100vh-175px)] aspect-[1/1.414] bg-surface-container-lowest rounded-xl shadow-md p-space-lg flex flex-col items-center justify-center text-center gap-4 relative select-none border border-outline-variant/30 shrink-0";
			let t = document.createElement("div");
			t.className = "w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner";
			let r = document.createElement("span");
			r.className = "material-symbols-outlined text-[36px]", r.textContent = "drive_file_rename_outline", t.appendChild(r), e.appendChild(t);
			let i = document.createElement("div");
			i.className = "flex flex-col gap-1 max-w-xs";
			let a = document.createElement("h3");
			a.className = "font-headline-sm text-[17px] font-bold text-on-surface", a.textContent = "No Document Loaded for Preview", i.appendChild(a);
			let o = document.createElement("p");
			o.className = "text-body-sm text-secondary text-[12px] leading-relaxed", o.textContent = "Select a student folder (F2) from the top-right toolbar to begin admission document renaming.", i.appendChild(o), e.appendChild(i);
			let s = document.createElement("div");
			s.className = "flex items-center gap-2 font-mono-code text-[11px] text-secondary opacity-60 mt-1 select-none", s.innerHTML = "<span>DPI: Standby</span><span>•</span><span>Buffer: Empty</span><span>•</span><span>Zero Zoom</span>", e.appendChild(s), n.appendChild(e);
			return;
		}
		let r = e.querySelector("strong.text-tertiary, strong.text-error");
		if (r) {
			let e = (t.size / 1024).toFixed(0);
			t.size <= 262144 ? (r.className = "text-tertiary font-bold", r.textContent = `${e} KB / 256 KB Safe`) : (r.className = "text-error font-bold", r.textContent = `${e} KB (>256 KB Safe Buffer)`);
		}
		if (/\.pdf$/i.test(t.name) || (this.state.activePdfDoc = null, this.state.activePdfUrl = null, this.state.currentPdfPage = 1, this.state.totalPdfPages = 1, this._updatePdfPageIndicator()), this.state.splitCompare && this.state.files.length > 1) {
			let e = this.state.currentIndex > 0 ? this.state.currentIndex - 1 : 1, r = this.state.files[e], i = document.createElement("div");
			i.id = "previewContainerStage", i.className = "flex flex-row gap-space-md items-center justify-center h-full max-h-[calc(100vh-175px)]";
			let a = this._createStageElement(r, `Compare: ${r.name}`), o = this._createStageElement(t, `Active: ${t.targetName || t.name}`);
			i.appendChild(a), i.appendChild(o), n.appendChild(i), this._applyPreviewTransform();
			return;
		}
		let i = this._createStageElement(t);
		n.appendChild(i), this._applyPreviewTransform();
	}
	_createStageElement(e, t = null) {
		let n = document.createElement("div");
		if (t || (n.id = "previewContainerStage"), n.className = "h-full max-h-[calc(100vh-175px)] aspect-[1/1.414] bg-surface-container-lowest rounded shadow-2xl p-space-md flex flex-col justify-between relative overflow-hidden select-text border border-outline-variant/40 shrink-0", t) {
			let e = document.createElement("div");
			e.className = "absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-mono-code text-[10px] font-bold shadow-xs", e.textContent = t, n.appendChild(e);
		}
		let r = /\.(jpe?g|png|webp|bmp|gif)$/i.test(e.name), i = /\.pdf$/i.test(e.name);
		if (r) {
			let t = document.createElement("img");
			t.alt = e.name, t.className = "w-full h-full object-contain";
			let r = (r) => {
				e._blobUrl = r, t.src = r, n.contains(t) || (n.innerHTML = "", n.appendChild(t));
			};
			if (e._blobUrl) r(e._blobUrl);
			else if (e.fileObj) try {
				r(URL.createObjectURL(e.fileObj));
			} catch {
				this._renderDocumentInfoFallback(n, e);
			}
			else {
				let i = We();
				if (e.path && i) n.innerHTML = "<div class=\"flex items-center justify-center w-full h-full text-secondary text-[12px]\"><span class=\"material-symbols-outlined text-[20px] animate-spin text-primary mr-2\">sync</span><span>Loading document preview...</span></div>", i("read_binary_file", { path: e.path }).then((t) => {
					let n = e.name.toLowerCase().endsWith(".png") ? "image/png" : e.name.toLowerCase().endsWith(".webp") ? "image/webp" : "image/jpeg", i = new Blob([new Uint8Array(t)], { type: n });
					r(URL.createObjectURL(i));
				}).catch((r) => {
					console.warn("Native read_binary_file error, falling back:", r);
					let i = X(e);
					i ? (t.src = i, t.onload = () => {
						n.innerHTML = "", n.appendChild(t);
					}, t.onerror = () => this._renderDocumentInfoFallback(n, e)) : this._renderDocumentInfoFallback(n, e);
				});
				else {
					let r = X(e);
					r ? (t.src = r, t.onload = () => {
						n.innerHTML = "", n.appendChild(t);
					}, t.onerror = () => this._renderDocumentInfoFallback(n, e)) : this._renderDocumentInfoFallback(n, e);
				}
			}
		} else if (i) {
			let t = document.createElement("canvas");
			t.id = "previewPdfCanvas", t.className = "w-full h-full object-contain";
			let r = async (i) => {
				if (!window.pdfjsLib) this._loadPdfJs(() => r(i));
				else try {
					n.innerHTML = "", n.appendChild(t);
					let r = i instanceof Uint8Array ? i.slice(0) : new Uint8Array(i);
					this.state.activePdfDoc = await window.pdfjsLib.getDocument({ data: r }).promise, this.state.activePdfUrl = e.path || e.name, this.state.totalPdfPages = this.state.activePdfDoc.numPages || 1, this.state.currentPdfPage = 1, await this._renderPdfPage(1, t);
				} catch (t) {
					console.warn("PDF render error:", t), this._renderDocumentInfoFallback(n, e);
				}
			};
			if (e._pdfBytes) r(e._pdfBytes);
			else if (e.fileObj) e.fileObj.arrayBuffer().then((t) => {
				e._pdfBytes = new Uint8Array(t), r(e._pdfBytes);
			}).catch(() => this._renderDocumentInfoFallback(n, e));
			else {
				let t = We();
				if (e.path && t) n.innerHTML = "<div class=\"flex items-center justify-center w-full h-full text-secondary text-[12px]\"><span class=\"material-symbols-outlined text-[20px] animate-spin text-primary mr-2\">sync</span><span>Loading PDF preview...</span></div>", t("read_binary_file", { path: e.path }).then((t) => {
					e._pdfBytes = new Uint8Array(t), r(e._pdfBytes);
				}).catch((t) => {
					console.warn("Native PDF read error, falling back to fetch:", t);
					let i = X(e);
					i ? fetch(i).then((e) => e.arrayBuffer()).then((t) => {
						e._pdfBytes = new Uint8Array(t), r(e._pdfBytes);
					}).catch(() => this._renderDocumentInfoFallback(n, e)) : this._renderDocumentInfoFallback(n, e);
				});
				else {
					let t = X(e);
					t ? fetch(t).then((e) => e.arrayBuffer()).then((t) => {
						e._pdfBytes = new Uint8Array(t), r(e._pdfBytes);
					}).catch(() => this._renderDocumentInfoFallback(n, e)) : this._renderDocumentInfoFallback(n, e);
				}
			}
		} else this._renderDocumentInfoFallback(n, e);
		return n;
	}
	async _renderPdfPage(e, t = null) {
		if (!this.state.activePdfDoc) return;
		let n = t || document.getElementById("previewPdfCanvas");
		if (n) try {
			let t = await this.state.activePdfDoc.getPage(e), r = t.getViewport({ scale: 2 });
			n.height = r.height, n.width = r.width;
			let i = n.getContext("2d");
			await t.render({
				canvasContext: i,
				viewport: r
			}).promise, this.state.currentPdfPage = e, this._updatePdfPageIndicator();
		} catch (t) {
			console.warn(`Error rendering PDF page ${e}:`, t);
		}
	}
	_updatePdfPageIndicator() {
		let e = document.getElementById("col-preview");
		if (!e) return;
		let t = e.querySelector("#renamerPdfPageBadge"), n = e.querySelector("#btnPdfPrevPage"), r = e.querySelector("#btnPdfNextPage");
		t && (t.textContent = this.state.totalPdfPages > 1 ? `Page ${this.state.currentPdfPage} of ${this.state.totalPdfPages}` : "Page 1 of 1", t.style.cursor = this.state.totalPdfPages > 1 ? "pointer" : "default", t.title = this.state.totalPdfPages > 1 ? "Click to jump to page" : "Single page document"), n && (n.disabled = this.state.currentPdfPage <= 1), r && (r.disabled = this.state.currentPdfPage >= this.state.totalPdfPages || this.state.totalPdfPages <= 1);
	}
	_loadPdfJs(e) {
		if (window.pdfjsLib) {
			e && e();
			return;
		}
		if (this._pdfLoading) return;
		this._pdfLoading = !0;
		let t = [
			"assets/js/libs/pdf.min.js",
			"/app/assets/js/libs/pdf.min.js",
			"app/assets/js/libs/pdf.min.js",
			"src/js/pdf.min.js",
			"https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
		], n = 0, r = () => {
			if (n >= t.length) {
				this._pdfLoading = !1, console.warn("[DocMitra Renamer] Could not load pdf.js from any candidate source.");
				return;
			}
			let i = t[n++], a = document.createElement("script");
			a.src = i, a.onload = () => {
				if (window.pdfjsLib) {
					let t = i.includes("cdnjs") ? "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js" : i.replace("pdf.min.js", "pdf.worker.min.js");
					window.pdfjsLib.GlobalWorkerOptions.workerSrc = t, this._pdfLoading = !1, e && e();
				} else r();
			}, a.onerror = () => r(), document.head.appendChild(a);
		};
		r();
	}
	_renderDocumentInfoFallback(e, t) {
		for (; e.firstChild;) e.removeChild(e.firstChild);
		let n = document.createElement("div");
		n.className = "flex flex-col items-center text-center gap-1 border-b pb-2 border-outline-variant/50";
		let r = document.createElement("span");
		r.className = "font-mono-code text-[10px] tracking-widest text-secondary uppercase font-bold", r.textContent = "DocMitra Offline Document Inspector", n.appendChild(r);
		let i = document.createElement("span");
		i.className = "font-headline-sm text-[15px] font-bold text-on-surface uppercase", i.textContent = t.targetName || t.name, n.appendChild(i), e.appendChild(n);
		let a = document.createElement("div");
		a.className = "flex-1 flex flex-col items-center justify-center gap-2 text-center p-4";
		let o = document.createElement("span");
		o.className = "material-symbols-outlined text-[64px] text-primary opacity-40", o.textContent = "description", a.appendChild(o);
		let s = document.createElement("div");
		s.className = "font-mono-code text-[12px] text-secondary";
		let c = t.ext || T(t.name) || "DOC";
		s.textContent = `Size: ${t.size ? (t.size / 1024).toFixed(1) : "0.0"} KB • Type: ${c.toUpperCase().replace(/^\./, "")}`, a.appendChild(s);
		let l = document.createElement("div");
		l.className = t.isMatched ? "px-3 py-1 rounded bg-tertiary-fixed text-on-tertiary-fixed font-bold font-mono-code text-[11px]" : "px-3 py-1 rounded bg-surface-variant text-on-surface-variant font-bold font-mono-code text-[11px]", l.textContent = t.isMatched ? `Matched: ${t.docType}` : "Unmatched File", a.appendChild(l), e.appendChild(a);
		let u = document.createElement("div");
		u.className = "text-center border-t pt-2 border-outline-variant/30 text-[10px] font-mono-code text-secondary", u.textContent = "Air-Gapped High-Precision Preview Stage", e.appendChild(u);
	}
};
function Xe() {
	let e = new Ye();
	return e.init(), typeof window < "u" && (window.docmitraRenamer = e), e;
}
// src/services/export-import-service.js
function Ze(e) {
	let t = {
		format: "BulkStudentRenamerSettings",
		version: 1,
		exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
		groups: e.groups,
		profiles: e.profiles,
		checklists: e.checklists,
		spelling: e.spelling,
		style: e.style
	}, n = new Blob([JSON.stringify(t, null, 2)], { type: "application/json" }), r = URL.createObjectURL(n), i = document.createElement("a");
	i.href = r, i.download = `student-renamer-settings-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`, i.click(), setTimeout(() => URL.revokeObjectURL(r), 1e3);
}
function Qe(e, t) {
	return new Promise((n, r) => {
		if (!e) return r(/* @__PURE__ */ Error("No backup file selected."));
		if (e.size > 5242880) return r(/* @__PURE__ */ Error("Backup file exceeds maximum allowed size (5 MB)."));
		let i = new FileReader();
		i.onload = () => {
			try {
				let e = JSON.parse(i.result);
				if (!e || typeof e != "object") throw Error("Invalid JSON data.");
				if (e.format !== "BulkStudentRenamerSettings") throw Error("Invalid settings backup format. Expected BulkStudentRenamerSettings.");
				e.groups && typeof e.groups == "object" && (t.groups = JSON.parse(JSON.stringify(e.groups))), e.profiles && typeof e.profiles == "object" && (t.profiles = JSON.parse(JSON.stringify(e.profiles))), e.checklists && typeof e.checklists == "object" && (t.checklists = JSON.parse(JSON.stringify(e.checklists))), e.spelling && typeof e.spelling == "object" && (t.spelling = JSON.parse(JSON.stringify(e.spelling))), [
					"preserve",
					"upper",
					"lower",
					"title"
				].includes(e.style) && (t.style = e.style), t.active = Object.keys(t.profiles || {})[0] || "Default", n(t);
			} catch (e) {
				r(e);
			}
		}, i.onerror = () => r(/* @__PURE__ */ Error("Failed to read the file.")), i.readAsText(e);
	});
}
// src/ui/settings-ui.js
var $e = class {
	constructor() {
		this.state = null, this.initialState = null, this.activeChecklist = "MAHA DBT FORM";
	}
	async init() {
		await this.loadState(), this._bindButtons(), this.renderAll(), console.info("[DocMitra Settings] Settings UI manager initialized.");
	}
	async loadState() {
		this.state = je();
		try {
			let e = await Pe();
			e && e.forms && Object.keys(e.forms).length > 0 && (this.state.checklists = e.forms);
		} catch (e) {
			console.warn("[SettingsUI] Could not load presets from server:", e);
		}
		this.initialState = JSON.parse(JSON.stringify(this.state));
	}
	_bindButtons() {
		let e = document.getElementById("saveRulesBtn");
		e && e.addEventListener("click", () => this.handleSave());
		let t = document.getElementById("resetRulesBtn");
		t && t.addEventListener("click", () => this.handleReset());
		let n = document.getElementById("discardBtn");
		n && n.addEventListener("click", () => this.handleDiscard());
		let i = document.getElementById("addNewRuleBtn");
		i && i.addEventListener("click", () => this.handleAddNewRule());
		let a = document.getElementById("btnExportSettingsJSON");
		a && a.addEventListener("click", () => {
			try {
				Ze(this.state), r.show("Settings Exported", "Configuration JSON file downloaded.", "success");
			} catch (e) {
				r.show("Export Error", e.message, "error");
			}
		});
		let o = document.getElementById("btnTriggerImportJSON"), s = document.getElementById("inputImportSettingsJSON");
		o && s && (o.addEventListener("click", () => s.click()), s.addEventListener("change", async (e) => {
			let t = e.target.files?.[0];
			if (t) try {
				await Qe(t, this.state), W(this.state), this.initialState = JSON.parse(JSON.stringify(this.state)), this.renderAll(), r.show("Import Successful", "System configuration restored and verified.", "success");
			} catch (e) {
				r.show("Import Failed", e.message || "Invalid settings JSON format.", "error");
			} finally {
				s.value = "";
			}
		}));
	}
	renderAll() {
		this.renderCanonicalRules(), this.renderShortcutMatrix(), this.renderChecklists();
	}
	renderCanonicalRules() {
		let e = document.getElementById("canonicalRuleRows");
		if (!e) return;
		for (; e.firstChild;) e.removeChild(e.firstChild);
		let t = this.state.groups || {};
		Object.entries(t).forEach(([t, n], i) => {
			let a = i % 2 == 1, o = document.createElement("div");
			o.className = `grid grid-cols-12 items-center px-space-md py-space-sm ${a ? "bg-surface-container-low/40" : "bg-surface-container-lowest"} hover:bg-surface-container-low transition-colors group`;
			let s = document.createElement("div");
			s.className = "col-span-1";
			let c = document.createElement("span");
			c.className = "px-2 py-0.5 rounded bg-surface-container-high text-primary font-mono-code text-[11px] font-bold", c.textContent = `#${String(i + 1).padStart(2, "0")}`, s.appendChild(c), o.appendChild(s);
			let l = document.createElement("div");
			l.className = "col-span-4 flex flex-col pr-space-sm";
			let u = document.createElement("span");
			u.className = "font-label-lg text-label-lg font-bold text-on-surface group-hover:text-primary transition-colors", u.textContent = t, l.appendChild(u);
			let d = document.createElement("span");
			d.className = "font-mono-code text-[10px] text-on-surface-variant", d.textContent = `TOKEN_${t.replace(/[^A-Z0-9]/gi, "_").toUpperCase()}`, l.appendChild(d), o.appendChild(l);
			let f = document.createElement("div");
			f.className = "col-span-2";
			let p = Ce.find((e) => e.outputName.toUpperCase() === t.toUpperCase()), m = p ? p.primaryShortcut : (n[0] || "DOC").toUpperCase().slice(0, 4), h = document.createElement("span");
			h.className = "px-2 py-1 bg-surface-container-high rounded text-on-surface font-mono-code text-[12px] font-bold shadow-2xs", h.textContent = m, f.appendChild(h), o.appendChild(f);
			let g = document.createElement("div");
			g.className = "col-span-4 pr-space-sm";
			let _ = document.createElement("div");
			_.className = "flex flex-wrap gap-1 max-h-16 overflow-y-auto", (n || []).forEach((e) => {
				let t = document.createElement("span");
				t.className = /[\u0900-\u097F]/.test(e) ? "px-1.5 py-0.5 rounded bg-surface-container text-primary font-semibold text-[11px]" : "px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-mono-code text-[11px]", t.textContent = e, _.appendChild(t);
			}), g.appendChild(_), o.appendChild(g);
			let v = document.createElement("div");
			v.className = "col-span-1 flex items-center justify-end gap-1";
			let y = document.createElement("button");
			y.type = "button", y.className = "p-1 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded transition-colors cursor-pointer", y.title = "Edit Keywords";
			let b = document.createElement("span");
			b.className = "material-symbols-outlined text-[16px]", b.textContent = "edit", y.appendChild(b), y.addEventListener("click", () => {
				let e = (n || []).join(", "), i = window.prompt(`Edit keywords for "${t}" (comma-separated):`, e);
				if (i !== null) {
					let e = i.split(",").map((e) => e.trim()).filter(Boolean);
					this.state.groups[t] = e, this.renderCanonicalRules(), r.show("Rule Updated", `Keywords updated for ${t}`, "info");
				}
			}), v.appendChild(y);
			let x = document.createElement("button");
			x.type = "button", x.className = "p-1 text-on-surface-variant hover:text-error hover:bg-error-container hover:text-on-error-container rounded transition-colors cursor-pointer", x.title = "Delete Rule";
			let S = document.createElement("span");
			S.className = "material-symbols-outlined text-[16px]", S.textContent = "delete", x.appendChild(S), x.addEventListener("click", () => {
				window.confirm(`Are you sure you want to delete canonical rule "${t}"?`) && (delete this.state.groups[t], this.renderCanonicalRules(), r.show("Rule Deleted", t, "warning"));
			}), v.appendChild(x), o.appendChild(v), e.appendChild(o);
		});
	}
	handleAddNewRule() {
		let e = window.prompt("Enter Canonical Document Label (e.g. \"MINORITY CERTIFICATE\"):");
		if (!e || !e.trim()) return;
		let t = e.trim().toUpperCase();
		if (this.state.groups[t]) {
			r.show("Rule Exists", `Rule "${t}" is already registered.`, "warning");
			return;
		}
		let n = (window.prompt(`Enter keywords for "${t}" (comma-separated):`, t.toLowerCase()) || t.toLowerCase()).split(",").map((e) => e.trim()).filter(Boolean);
		this.state.groups[t] = n, this.renderCanonicalRules(), r.show("Custom Rule Added", t, "success");
	}
	renderShortcutMatrix() {
		let e = document.getElementById("shortcutMatrixRows");
		if (e) {
			for (; e.firstChild;) e.removeChild(e.firstChild);
			[
				{
					code: "ADR",
					doc: "Aadhaar Card",
					logic: "Match \\b(ADR|Aadhaar|UID)\\b",
					canonical: "AADHAAR CARD"
				},
				{
					code: "PAN",
					doc: "PAN Card",
					logic: "Match \\b(PAN|Pancard)\\b (Never \"Pankaj\")",
					canonical: "PAN CARD"
				},
				{
					code: "PIC",
					doc: "Student Photo",
					logic: "Match \\b(PIC|Photo|Passport)\\b",
					canonical: "PHOTO"
				},
				{
					code: "10M",
					doc: "10th Marksheet",
					logic: "Match \\b(10M|10th mark|ssc)\\b",
					canonical: "10TH MARKSHEET"
				},
				{
					code: "10P",
					doc: "10th Passing",
					logic: "Match \\b(10P|10th passing|sanad)\\b",
					canonical: "10TH PASSING CERTIFICATE"
				},
				{
					code: "12M",
					doc: "12th Marksheet",
					logic: "Match \\b(12M|12th mark|hsc)\\b",
					canonical: "12TH MARKSHEET"
				},
				{
					code: "12P",
					doc: "12th Passing",
					logic: "Match \\b(12P|12th passing|hsc pass)\\b",
					canonical: "12TH PASSING CERTIFICATE"
				},
				{
					code: "12LC",
					doc: "12th Leaving Cert",
					logic: "Match \\b(12LC|12th lc|tc|leaving)\\b",
					canonical: "12TH LC"
				},
				{
					code: "12MP",
					doc: "12th Mark & Passing",
					logic: "Combined Dual Document Match",
					canonical: "12TH MARKSHEET AND PASSING"
				},
				{
					code: "CST",
					doc: "Caste Certificate",
					logic: "Match \\b(CST|Cast|Caste)\\b (No Validity)",
					canonical: "CASTE CERTIFICATE"
				},
				{
					code: "VLD",
					doc: "Validity Certificate",
					logic: "Match \\b(VLD|Validity|Pramanpatra)\\b",
					canonical: "VALIDITY CERTIFICATE"
				},
				{
					code: "DOM",
					doc: "Domicile Certificate",
					logic: "Match \\b(DOM|Domicile|Adhiwas)\\b",
					canonical: "DOMICILE CERTIFICATE"
				},
				{
					code: "NAT",
					doc: "Nationality Certificate",
					logic: "Match \\b(NAT|Nationality|Rashtriyatva)\\b",
					canonical: "NATIONALITY CERTIFICATE"
				},
				{
					code: "INC",
					doc: "Income Certificate",
					logic: "Match \\b(INC|Income|Utpanna)\\b",
					canonical: "INCOME CERTIFICATE"
				},
				{
					code: "BNK",
					doc: "Bank Passbook",
					logic: "Match \\b(BNK|Passbook|Bank)\\b",
					canonical: "PASSBOOK BANK"
				},
				{
					code: "ATM",
					doc: "Attempt Certificate",
					logic: "Match \\b(ATM|Attempt)\\b",
					canonical: "ATTEMPT CERTIFICATE"
				},
				{
					code: "BRT",
					doc: "Birth Certificate",
					logic: "Match \\b(BRT|Birth|Janam)\\b",
					canonical: "BIRTH CERTIFICATE"
				},
				{
					code: "BNF",
					doc: "Bonafide Certificate",
					logic: "Match \\b(BNF|Bonafide)\\b",
					canonical: "BONAFIDE CERTIFICATE"
				},
				{
					code: "GAP",
					doc: "Gap Certificate",
					logic: "Match \\b(GAP|Gap cert|Affidavit)\\b",
					canonical: "GAP CERTIFICATE"
				},
				{
					code: "SLF",
					doc: "Self Declaration",
					logic: "Match \\b(SLF|Self decl|Pratidnyapatra)\\b",
					canonical: "SELF DECLARATION"
				},
				{
					code: "PAR",
					doc: "Parent Declaration",
					logic: "Match \\b(PAR|Parent decl)\\b",
					canonical: "PARENT DECLARATION"
				}
			].forEach((t) => {
				let n = document.createElement("div");
				n.className = "grid grid-cols-12 items-center px-space-md py-2 hover:bg-surface-container-lowest transition-colors";
				let r = document.createElement("div");
				r.className = "col-span-2";
				let i = document.createElement("span");
				i.className = "px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-mono-code text-[12px] font-bold", i.textContent = t.code, r.appendChild(i), n.appendChild(r);
				let a = document.createElement("div");
				a.className = "col-span-4 font-label-md font-semibold text-on-surface", a.textContent = t.doc, n.appendChild(a);
				let o = document.createElement("div");
				o.className = "col-span-4 font-mono-code text-[11px] text-secondary", o.textContent = t.logic, n.appendChild(o);
				let s = document.createElement("div");
				s.className = "col-span-2 text-right";
				let c = document.createElement("span");
				c.className = "px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono-code text-[10px] font-bold", c.textContent = "Word-Safe \\b", s.appendChild(c), n.appendChild(s), e.appendChild(n);
			});
		}
	}
	renderChecklists() {
		let e = document.getElementById("checklistFormTabs"), t = document.getElementById("checklistRulesList");
		if (!e || !t) return;
		for (; e.firstChild;) e.removeChild(e.firstChild);
		for (; t.firstChild;) t.removeChild(t.firstChild);
		let n = this.state.checklists || z;
		Object.keys(n).forEach((t) => {
			let n = document.createElement("button");
			n.type = "button", n.className = t === this.activeChecklist ? "px-3 py-1.5 rounded-lg bg-primary text-on-primary font-label-sm font-bold shadow-xs cursor-pointer" : "px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm font-semibold cursor-pointer", n.textContent = t, n.addEventListener("click", () => {
				this.activeChecklist = t, this.renderChecklists();
			}), e.appendChild(n);
		});
		let i = n[this.activeChecklist] || [], a = document.createElement("div");
		a.className = "flex items-center justify-between pb-2 mb-2 border-b border-outline-variant/30";
		let o = document.createElement("span");
		o.className = "font-label-sm font-bold text-secondary uppercase", o.textContent = `${this.activeChecklist} (${i.length} Documents)`, a.appendChild(o);
		let s = document.createElement("button");
		s.type = "button", s.className = "px-2.5 py-1 rounded bg-primary text-on-primary font-label-sm font-bold flex items-center gap-1 shadow-xs cursor-pointer hover:bg-primary/90";
		let c = document.createElement("span");
		c.className = "material-symbols-outlined text-[14px]", c.textContent = "add", s.appendChild(c), s.appendChild(document.createTextNode("Add Document")), s.onclick = () => {
			let e = window.prompt("Enter document name (e.g. INCOME CERTIFICATE):");
			if (!e || !e.trim()) return;
			let t = window.prompt("Enter document shortcode (e.g. INC):") || "", i = {
				name: e.trim().toUpperCase(),
				code: t.trim().toUpperCase(),
				required: !0
			};
			n[this.activeChecklist] || (n[this.activeChecklist] = []), n[this.activeChecklist].push(i), this.state.checklists = n, this.renderChecklists(), r.show("Document Added", `${i.name} added to ${this.activeChecklist}`, "success");
		}, a.appendChild(s), t.appendChild(a), i.forEach((e, n) => {
			let a = document.createElement("div");
			a.className = "p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-between gap-3 shadow-2xs";
			let o = typeof e == "string" ? e : e.name || (Array.isArray(e) ? e[0] : ""), s = e.code || "", c = e.required === void 0 || !!e.required, l = document.createElement("div");
			l.className = "flex items-center gap-2.5 min-w-0 flex-1";
			let u = document.createElement("span");
			if (u.className = "w-6 h-6 rounded bg-surface-container text-secondary font-mono-code text-[11px] font-bold flex items-center justify-center shrink-0", u.textContent = String(n + 1), l.appendChild(u), s) {
				let e = document.createElement("span");
				e.className = "px-1.5 py-0.5 rounded bg-surface-container-high text-primary font-mono-code text-[10px] font-bold shrink-0", e.textContent = s, l.appendChild(e);
			}
			let d = document.createElement("span");
			d.className = "font-label-md font-bold text-on-surface truncate", d.textContent = o, l.appendChild(d), a.appendChild(l);
			let f = document.createElement("div");
			f.className = "flex items-center gap-1.5 shrink-0";
			let p = document.createElement("button");
			p.type = "button", p.className = c ? "px-2 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-mono-code text-[10px] font-bold cursor-pointer transition-colors" : "px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 font-mono-code text-[10px] font-semibold cursor-pointer transition-colors", p.textContent = c ? "Mandatory" : "Optional", p.title = "Click to toggle Mandatory / Optional", p.onclick = () => {
				typeof e == "object" && !Array.isArray(e) ? e.required = !c : i[n] = {
					name: o,
					code: s,
					required: !c
				}, this.renderChecklists();
			}, f.appendChild(p);
			let m = document.createElement("button");
			m.type = "button", m.className = "w-6 h-6 rounded bg-surface-container hover:bg-surface-container-high text-secondary flex items-center justify-center cursor-pointer transition-colors", m.title = "Edit document rule";
			let h = document.createElement("span");
			h.className = "material-symbols-outlined text-[13px]", h.textContent = "edit", m.appendChild(h), m.onclick = () => {
				let e = window.prompt("Edit document name:", o);
				if (!e || !e.trim()) return;
				let t = window.prompt("Edit document shortcode:", s) || "";
				i[n] = {
					name: e.trim().toUpperCase(),
					code: t.trim().toUpperCase(),
					required: c
				}, this.renderChecklists(), r.show("Document Updated", e, "info");
			}, f.appendChild(m);
			let g = document.createElement("button");
			g.type = "button", g.className = "w-6 h-6 rounded bg-surface-container hover:bg-error/20 hover:text-error text-secondary flex items-center justify-center cursor-pointer transition-colors", g.title = "Delete document rule";
			let _ = document.createElement("span");
			_.className = "material-symbols-outlined text-[13px]", _.textContent = "delete", g.appendChild(_), g.onclick = () => {
				window.confirm(`Remove ${o} from ${this.activeChecklist}?`) && (i.splice(n, 1), this.renderChecklists(), r.show("Document Removed", o, "info"));
			}, f.appendChild(g), a.appendChild(f), t.appendChild(a);
		});
	}
	async handleSave() {
		W(this.state), await Fe({ forms: this.state.checklists }), this.initialState = JSON.parse(JSON.stringify(this.state)), r.show("Settings Saved", "System rules updated and applied to workstation.", "success");
		let e = document.getElementById("settings-modal-overlay");
		e && e.classList.add("hidden"), document.body.style.overflow = "";
	}
	handleReset() {
		window.confirm("Reset all rules, shortcuts, and checklists to factory defaults?") && (this.state.groups = we(), this.state.checklists = JSON.parse(JSON.stringify(z)), W(this.state), this.initialState = JSON.parse(JSON.stringify(this.state)), this.renderAll(), r.show("Factory Defaults Restored", "All default rules loaded.", "info"));
	}
	handleDiscard() {
		this.state = JSON.parse(JSON.stringify(this.initialState)), this.renderAll(), r.show("Changes Discarded", "Reverted to previous configuration.", "info");
		let e = document.getElementById("settings-modal-overlay");
		e && e.classList.add("hidden"), document.body.style.overflow = "";
	}
};
function et() {
	let e = new $e();
	return e.init(), e;
}
// tools/pdf_studio/pdf_studio_logic.js
var tt = {
	A4_PORTRAIT: {
		width: 595.28,
		height: 841.89,
		label: "A4 Portrait"
	},
	A4_LANDSCAPE: {
		width: 841.89,
		height: 595.28,
		label: "A4 Landscape"
	}
};
function nt(e) {
	let t = 2, n = e.length;
	for (; t < n && e[t] === 255;) {
		let r = e[t + 1];
		t += 2;
		let i = r >= 192 && r <= 195 || r >= 197 && r <= 199 || r >= 201 && r <= 203 || r >= 205 && r <= 207;
		if (t + 1 >= n) break;
		let a = e[t] << 8 | e[t + 1];
		if (i && t + 6 < n) {
			let n = e[t + 3] << 8 | e[t + 4];
			return {
				width: e[t + 5] << 8 | e[t + 6],
				height: n
			};
		}
		t += a;
	}
	return {
		width: 595,
		height: 842
	};
}
function Q(e = [], t = "portrait", n = 0) {
	if (!e.length) throw Error("No images provided for PDF creation.");
	let r = [], i = 0, a = (e) => new TextEncoder().encode(e), o = [], s = (e) => {
		o.push(e), i += e.length;
	};
	s(a("%PDF-1.4\n%âãÏÓ\n")), r.push(i), s(a("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"));
	let c = e.length, l = [];
	for (let e = 0; e < c; e++) l.push(3 + e * 3);
	r.push(i), s(a(`2 0 obj\n<< /Type /Pages /Kids [ ${l.map((e) => `${e} 0 R`).join(" ")} ] /Count ${c} >>\nendobj\n`));
	for (let o = 0; o < c; o++) {
		let c = e[o], l = 3 + o * 3, u = l + 1, d = l + 2, f = c.bytes, { width: p, height: m } = c.width && c.height ? c : nt(f), h = tt.A4_PORTRAIT.width, g = tt.A4_PORTRAIT.height;
		(t === "landscape" || t === "fit" && p > m) && (h = tt.A4_LANDSCAPE.width, g = tt.A4_LANDSCAPE.height);
		let _ = h - 36, v = g - 36, y = Math.min(_ / p, v / m), b = p * y, x = m * y, S = (h - b) / 2, C = (g - x) / 2, w = n ? ` /Rotate ${n}` : "";
		r.push(i), s(a(`${l} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${h.toFixed(2)} ${g.toFixed(2)}]${w} /Contents ${u} 0 R /Resources << /XObject << /Im${o + 1} ${d} 0 R >> >> >>\nendobj\n`));
		let T = `q ${b.toFixed(2)} 0 0 ${x.toFixed(2)} ${S.toFixed(2)} ${C.toFixed(2)} cm /Im${o + 1} Do Q\n`, E = T.length;
		r.push(i), s(a(`${u} 0 obj\n<< /Length ${E} >>\nstream\n${T}endstream\nendobj\n`)), r.push(i), s(a(`${d} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${p} /Height ${m} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${f.length} >>\nstream\n`)), s(f), s(a("\nendstream\nendobj\n"));
	}
	let u = i, d = 3 + c * 3;
	s(a(`xref\n0 ${d}\n0000000000 65535 f \n`));
	for (let e of r) s(a(`${String(e).padStart(10, "0")} 00000 n \n`));
	return s(a(`trailer\n<< /Size ${d} /Root 1 0 R >>\nstartxref\n${u}\n%%EOF\n`)), new Blob(o, { type: "application/pdf" });
}
function rt(e) {
	let t = [], n = e.length, r = 0;
	for (; r < n - 3;) if (e[r] === 255 && e[r + 1] === 216 && e[r + 2] === 255) {
		let i = r;
		for (r += 2; r < n - 1;) {
			if (e[r] === 255 && e[r + 1] === 217) {
				let n = r + 2, a = e.slice(i, n), o = nt(a);
				t.push({
					bytes: a,
					width: o.width,
					height: o.height
				}), r = n;
				break;
			}
			r++;
		}
	} else r++;
	return t;
}
function $(e) {
	let t = rt(e);
	if (!t.length) return [];
	if (t.length === 1) return t;
	let n = Math.max(...t.map((e) => (e.width || 0) * (e.height || 0))), r = Math.max(...t.map((e) => e.bytes?.length || 0)), i = t.filter((e) => {
		let t = e.width || 1, i = e.height || 1, a = t * i, o = t / i, s = e.bytes?.length || 0;
		return !((o > 3 || o < .33 || i < 220 || t < 220) && (a < n * .35 || s < r * .35));
	});
	return (i.length ? i : t).sort((e, t) => {
		let n = (e.width || 0) * (e.height || 0), r = (t.width || 0) * (t.height || 0);
		return r === n ? (t.bytes?.length || 0) - (e.bytes?.length || 0) : r - n;
	});
}
function it(e, t = "Document.pdf") {
	let n = $(e), r = t.replace(/\.pdf$/i, "");
	return n.length ? n.map((e, t) => {
		let i = n.length === 1 ? `${r}.jpg` : `${r}_page_${t + 1}.jpg`, a = new Blob([e.bytes], { type: "image/jpeg" });
		return {
			fileName: i,
			blob: a,
			size: a.size,
			pageIndex: t + 1,
			width: e.width,
			height: e.height
		};
	}) : [];
}
function at(e, t = "Document.pdf") {
	let n = $(e), r = t.replace(/\.pdf$/i, "");
	return n.length ? n.map((e, t) => {
		let n = `${r}_page_${t + 1}.pdf`, i = Q([e], "portrait");
		return {
			fileName: n,
			blob: i,
			size: i.size,
			pageIndex: t + 1
		};
	}) : [];
}
function ot(e = [], t = "portrait") {
	let n = [];
	for (let t of e) {
		let e = $(t);
		n.push(...e);
	}
	if (!n.length) throw Error("No document images could be extracted to merge PDFs.");
	return Q(n, t);
}
function st(e, t = 90) {
	let n = (t % 360 + 360) % 360;
	if (n === 0) return new Blob([e], { type: "application/pdf" });
	let r = $(e);
	if (r.length > 0) return Q(r, "portrait", n);
	try {
		let t = "", r = 65536;
		for (let n = 0; n < e.length; n += r) t += String.fromCharCode.apply(null, e.subarray(n, n + r));
		let i = /(\d+\s+\d+\s+obj\s*<<[\s\S]*?\/Type\s*\/Page(?!\w)[\s\S]*?>>\s*endobj)/g;
		if (i.test(t)) {
			let e = t.replace(i, (e) => /\/Rotate\s+\d+/.test(e) ? e.replace(/\/Rotate\s+\d+/, `/Rotate ${n}`) : e.replace(/\/Type\s*\/Page(?!\w)/, `/Type /Page /Rotate ${n}`)), r = new Uint8Array(e.length);
			for (let t = 0; t < e.length; t++) r[t] = e.charCodeAt(t) & 255;
			return new Blob([r], { type: "application/pdf" });
		}
	} catch (e) {
		console.warn("In-place PDF dictionary rotation skipped:", e);
	}
	throw Error("No pages found in PDF to rotate.");
}
function ct(e, t, n = "auto") {
	if (!e) return "document.pdf";
	let r = e.lastIndexOf("."), i = r === -1 ? e : e.slice(0, r), a = r === -1 ? "" : e.slice(r), o = i.replace(/[\s_-]+\d+\s*(?:KB|MB)$/i, "").trim();
	return n === "MB" || n === "auto" && t >= 10485760 ? `${o} ${Math.max(1, Math.round(Number(t || 0) / 1048576))} MB${a}` : `${o} ${Math.max(1, Math.round(Number(t || 0) / 1024))} KB${a}`;
}
// tools/pdf_studio/pdf_studio_ui.js
var lt = class {
	constructor() {
		this.activeTool = "compress_pdf", this.files = [], this.isProcessing = !1;
	}
	init() {
		this._bindRibbonTools(), this._bindActions(), this._bindDropzone(), this.renderQueue(), console.info("[DocMitra PDF Studio] PDF Studio UI manager initialized.");
	}
	_bindRibbonTools() {
		let e = document.querySelectorAll("#view-pdf-studio .tool-ribbon-btn"), t = [
			"compress_pdf",
			"merge_pdf",
			"split_pdf",
			"pdf_to_jpg",
			"rotate_pdf",
			"clean_pdf"
		];
		e.forEach((e, n) => {
			e.addEventListener("click", (r) => {
				r.preventDefault();
				let i = t[n] || "compress_pdf";
				this.setTool(i, e);
			});
		});
	}
	setTool(e, t = null) {
		if (this.activeTool = e, document.querySelectorAll("#view-pdf-studio .tool-ribbon-btn").forEach((e) => {
			e.classList.remove("bg-primary-container", "text-on-primary", "font-semibold", "shadow-sm"), e.classList.add("text-on-surface-variant", "hover:bg-surface-container-low", "hover:text-on-surface");
			let t = e.querySelector(".bg-primary\\/60");
			t && t.remove();
		}), t) {
			t.classList.remove("text-on-surface-variant", "hover:bg-surface-container-low", "hover:text-on-surface"), t.classList.add("bg-primary-container", "text-on-primary", "font-semibold", "shadow-sm");
			let e = document.createElement("span");
			e.className = "bg-primary/60 text-on-primary text-[10px] font-mono-code px-1.5 py-0.5 rounded font-bold uppercase tracking-tight", e.textContent = "Active", t.appendChild(e);
		}
		this._updateProcessButtonLabel(), r.show("Tool Selected", this._getToolDisplayName(e), "info");
	}
	_getToolDisplayName(e) {
		switch (e) {
			case "compress_pdf": return "Compress PDF (<256 KB MahaDBT)";
			case "merge_pdf": return "Merge PDF Dossier";
			case "split_pdf": return "Split / Extract Pages";
			case "pdf_to_jpg": return "Convert PDF to JPG";
			case "rotate_pdf": return "Rotate All Pages 90°";
			case "clean_pdf": return "Clean & Enhance";
			default: return "Process Files";
		}
	}
	_updateProcessButtonLabel() {
		let e = document.getElementById("startCompressBtn");
		if (!e) return;
		let t = e.querySelector("span:nth-of-type(2)");
		if (t) {
			let e = this.files.length, n = "Start Process";
			this.activeTool === "compress_pdf" ? n = "Compress" : this.activeTool === "merge_pdf" ? n = "Merge" : this.activeTool === "split_pdf" ? n = "Split" : this.activeTool === "pdf_to_jpg" ? n = "Convert to JPG" : this.activeTool === "rotate_pdf" ? n = "Rotate" : this.activeTool === "clean_pdf" && (n = "Clean & Enhance"), t.textContent = `${n} (${e} Files)`;
		}
	}
	_bindActions() {
		let e = document.getElementById("btnBrowsePdfDir");
		e && e.addEventListener("click", () => this.handleBrowseFolder());
		let t = document.getElementById("btnAddPdfFiles");
		t && t.addEventListener("click", () => this.handleAddFiles());
		let n = document.getElementById("btnRotateAllPdf");
		n && n.addEventListener("click", () => this.handleRotateAll());
		let r = document.getElementById("btnClearPdfQueue");
		r && r.addEventListener("click", () => this.handleClearQueue());
		let i = document.getElementById("btnFilterOversizedPdf");
		i && i.addEventListener("click", () => this.handleFilterOversized());
		let a = document.getElementById("startCompressBtn");
		a && a.addEventListener("click", () => this.handleStartProcess());
	}
	_bindDropzone() {
		let e = document.getElementById("view-pdf-studio");
		e && (e.addEventListener("dragover", (e) => {
			e.preventDefault(), e.stopPropagation();
		}), e.addEventListener("drop", async (e) => {
			e.preventDefault(), e.stopPropagation();
			let t = Array.from(e.dataTransfer?.files || []).filter((e) => /\.pdf$/i.test(e.name));
			t.length === 0 ? r.show("Invalid Files", "Please drop PDF files only.", "warning") : await this.loadDroppedFiles(t);
		}));
	}
	async handleBrowseFolder() {
		r.show("Opening Folder Picker", "Navigating Windows Explorer...", "info");
		try {
			let e = await c();
			if (!e.success) {
				e.cancelled || r.show("Folder Select Error", e.error || "Failed to select folder", "error");
				return;
			}
			let t = (e.files || []).filter((e) => /\.pdf$/i.test(e.name));
			if (t.length === 0) {
				r.show("No PDFs Found", "Selected directory contains 0 PDF files.", "warning");
				return;
			}
			await this.loadNativeFiles(t), r.show("PDFs Loaded", `${t.length} files added to execution queue.`, "success");
		} catch (e) {
			r.show("Folder Error", e.message, "error");
		}
	}
	async handleAddFiles() {
		let e = document.createElement("input");
		e.type = "file", e.accept = ".pdf,application/pdf", e.multiple = !0, e.style.display = "none", e.addEventListener("change", async (t) => {
			let n = Array.from(t.target.files || []);
			n.length > 0 && await this.loadDroppedFiles(n), document.body.removeChild(e);
		}), document.body.appendChild(e), e.click();
	}
	async loadNativeFiles(e) {
		for (let t of e) try {
			let e = t.url || (t.path ? `http://localhost:3000/api/serve-file?path=${encodeURIComponent(t.path)}` : null), n = null;
			if (e) {
				let t = await (await fetch(e)).arrayBuffer();
				n = new Uint8Array(t);
			}
			this.files.push({
				id: `pdf_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
				name: t.name,
				path: t.path,
				size: t.size || (n ? n.length : 0),
				bytes: n,
				pageCount: 1,
				status: "ready"
			});
		} catch (e) {
			console.warn(`Failed to preload bytes for ${t.name}:`, e);
		}
		this.updateStats(), this.renderQueue();
	}
	async loadDroppedFiles(e) {
		for (let t of e) {
			let e = await t.arrayBuffer(), n = new Uint8Array(e);
			this.files.push({
				id: `pdf_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
				name: t.name,
				path: t.name,
				size: t.size,
				bytes: n,
				pageCount: 1,
				status: "ready"
			});
		}
		this.updateStats(), this.renderQueue(), r.show("PDFs Added", `${e.length} files added to queue.`, "success");
	}
	updateStats() {
		let e = this.files.length, t = (this.files.reduce((e, t) => e + t.size, 0) / 1048576).toFixed(2), n = (e * 230 * 1024 / 1048576).toFixed(2), r = document.getElementById("pdfQueueCount");
		r && (r.textContent = `${e} Files Loaded`);
		let i = document.getElementById("pdfQueueStats");
		i && (i.textContent = `Total: ${t} MB → Projected: ~${n} MB`), this._updateProcessButtonLabel();
	}
	renderQueue() {
		let e = document.getElementById("pdfCardsGrid");
		if (e) {
			for (; e.firstChild;) e.removeChild(e.firstChild);
			if (this.files.length === 0) {
				let t = document.createElement("div");
				t.className = "col-span-full p-8 text-center bg-surface-container-lowest rounded-xl border border-surface-container-high/80 flex flex-col items-center gap-2";
				let n = document.createElement("span");
				n.className = "material-symbols-outlined text-[40px] text-primary opacity-60", n.textContent = "picture_as_pdf", t.appendChild(n);
				let r = document.createElement("div");
				r.className = "font-headline-sm font-bold text-on-surface", r.textContent = "No PDF Files in Execution Queue", t.appendChild(r);
				let i = document.createElement("div");
				i.className = "text-body-sm text-secondary", i.textContent = "Drag & drop admission PDF documents here or click \"Browse Directory\" to get started.", t.appendChild(i), e.appendChild(t);
			} else this.files.forEach((t, n) => {
				let r = document.createElement("div");
				r.className = "bg-surface-container-lowest rounded-xl border border-surface-container-high/80 p-2.5 flex flex-col justify-between hover:shadow-md transition-shadow group relative";
				let i = document.createElement("div");
				i.className = "absolute top-1.5 right-1.5 z-10 flex items-center gap-1";
				let a = document.createElement("button");
				a.type = "button", a.className = "w-5 h-5 rounded flex items-center justify-center bg-surface-container-lowest/90 text-outline hover:text-primary transition-colors shadow-xs cursor-pointer", a.title = "Rotate 90°";
				let o = document.createElement("span");
				o.className = "material-symbols-outlined text-[13px]", o.textContent = "rotate_right", a.appendChild(o), a.addEventListener("click", (e) => {
					e.stopPropagation(), this.rotateSingleFile(n);
				}), i.appendChild(a);
				let s = document.createElement("button");
				s.type = "button", s.className = "w-5 h-5 rounded flex items-center justify-center bg-surface-container-lowest/90 text-outline hover:text-error transition-colors shadow-xs cursor-pointer", s.title = "Remove";
				let c = document.createElement("span");
				c.className = "material-symbols-outlined text-[13px]", c.textContent = "close", s.appendChild(c), s.addEventListener("click", (e) => {
					e.stopPropagation(), this.removeFile(n);
				}), i.appendChild(s), r.appendChild(i);
				let l = document.createElement("div");
				l.className = "relative w-full h-24 rounded-lg bg-surface-container-low overflow-hidden mb-2 border border-surface-container-high/60 flex items-center justify-center";
				let u = document.createElement("canvas");
				u.className = "w-full h-full object-contain", l.appendChild(u);
				let d = document.createElement("div");
				d.className = "absolute bottom-1 right-1 bg-inverse-surface/80 text-inverse-on-surface rounded px-1 text-[9px] font-mono-code", d.textContent = `${t.pageCount || 1}p`, t.bytes && window.pdfjsLib && window.pdfjsLib.getDocument({ data: t.bytes }).promise.then((e) => {
					t.pageCount = e.numPages, d.textContent = `${e.numPages}p`, e.getPage(1).then((e) => {
						let t = e.getViewport({ scale: .5 });
						u.height = t.height, u.width = t.width, e.render({
							canvasContext: u.getContext("2d"),
							viewport: t
						});
					});
				}).catch(() => {
					u.style.display = "none";
					let e = document.createElement("span");
					e.className = "material-symbols-outlined text-[32px] text-primary opacity-50", e.textContent = "picture_as_pdf", l.appendChild(e);
				}), l.appendChild(d), r.appendChild(l);
				let f = document.createElement("div");
				f.className = "font-headline-sm text-[12px] font-bold text-on-surface truncate mb-1", f.title = t.name, f.textContent = t.name, r.appendChild(f);
				let p = document.createElement("div");
				p.className = "bg-surface-container-low border border-surface-container-high/60 rounded-lg p-1.5 flex flex-col gap-0.5 font-mono-code text-[10px]";
				let m = document.createElement("div");
				m.className = "flex items-center justify-between text-outline";
				let h = t.size > 1048576 ? `${(t.size / 1048576).toFixed(2)} MB` : `${(t.size / 1024).toFixed(0)} KB`, g = document.createElement("span");
				g.textContent = `Old: ${h}`, m.appendChild(g);
				let _ = t.size > 262144, v = document.createElement("span");
				v.className = _ ? "text-emerald-700 font-bold" : "text-primary font-semibold", v.textContent = _ ? "-75%" : "Safe", m.appendChild(v), p.appendChild(m);
				let y = document.createElement("div");
				y.className = "flex items-center justify-between font-bold text-on-surface";
				let b = document.createElement("span");
				b.textContent = "Target:", y.appendChild(b);
				let x = document.createElement("span");
				x.className = "text-primary font-bold", x.textContent = _ ? "< 256 KB" : h, y.appendChild(x), p.appendChild(y), r.appendChild(p), e.appendChild(r);
			});
		}
	}
	rotateSingleFile(e) {
		let t = this.files[e];
		if (t && t.bytes) try {
			let e = st(t.bytes, 90);
			e.arrayBuffer().then((n) => {
				t.bytes = new Uint8Array(n), t.size = e.size, this.renderQueue(), r.show("Page Rotated", `${t.name} rotated 90° clockwise.`, "info");
			});
		} catch (e) {
			r.show("Rotate Error", e.message, "error");
		}
	}
	removeFile(e) {
		this.files.splice(e, 1), this.updateStats(), this.renderQueue();
	}
	handleRotateAll() {
		if (this.files.length === 0) {
			r.show("Queue Empty", "Add PDF files first.", "info");
			return;
		}
		let e = 0;
		this.files.forEach((t) => {
			if (t.bytes) try {
				let n = st(t.bytes, 90);
				n.arrayBuffer().then((i) => {
					t.bytes = new Uint8Array(i), t.size = n.size, e++, e === this.files.length && (this.renderQueue(), r.show("All Rotated", `Rotated all ${this.files.length} PDFs by 90°.`, "success"));
				});
			} catch {}
		});
	}
	handleClearQueue() {
		this.files = [], this.updateStats(), this.renderQueue(), r.show("Queue Cleared", "PDF workstation reset.", "info");
	}
	handleFilterOversized() {
		let e = this.files.length;
		this.files = this.files.filter((e) => e.size > 262144), this.updateStats(), this.renderQueue(), r.show("Filter Applied", `Kept ${this.files.length} oversized files (>256 KB) from ${e}.`, "info");
	}
	async handleStartProcess() {
		if (this.files.length === 0) {
			r.show("No Files", "Please add PDF files to process.", "warning");
			return;
		}
		if (this.isProcessing) return;
		this.isProcessing = !0;
		let e = this.activeTool;
		r.show("Processing Started", `Running ${this._getToolDisplayName(e)} on ${this.files.length} files...`, "info");
		try {
			if (e === "merge_pdf") {
				let e = ot(this.files.map((e) => e.bytes).filter(Boolean), "portrait");
				this._downloadBlob(e, "Merged_Admission_Dossier.pdf"), r.show("Merge Complete!", "Merged PDF Dossier generated and saved.", "success");
			} else if (e === "compress_pdf") {
				let e = 0;
				for (let t of this.files) {
					if (!t.bytes) continue;
					let n = $(t.bytes), r;
					r = n.length > 0 ? Q(n, "portrait") : new Blob([t.bytes], { type: "application/pdf" });
					let i = ct(t.name, r.size);
					this._downloadBlob(r, i), e++;
				}
				r.show("Compression Complete!", `Compressed ${e} files to safe MahaDBT thresholds.`, "success");
			} else if (e === "split_pdf") {
				let e = 0;
				for (let t of this.files) t.bytes && at(t.bytes, t.name).forEach((t) => {
					this._downloadBlob(t.blob, t.fileName), e++;
				});
				r.show("Split Complete!", `Extracted ${e} individual PDF pages.`, "success");
			} else if (e === "pdf_to_jpg") {
				let e = 0;
				for (let t of this.files) t.bytes && it(t.bytes, t.name).forEach((t) => {
					this._downloadBlob(t.blob, t.fileName), e++;
				});
				r.show("Conversion Complete!", `Extracted ${e} high-resolution JPG pages.`, "success");
			} else if (e === "rotate_pdf") {
				let e = 0;
				for (let t of this.files) {
					if (!t.bytes) continue;
					let n = st(t.bytes, 90);
					this._downloadBlob(n, t.name), e++;
				}
				r.show("Rotation Complete!", `Rotated and saved ${e} PDF documents.`, "success");
			} else {
				let e = 0;
				for (let t of this.files) {
					if (!t.bytes) continue;
					let n = Q($(t.bytes), "portrait");
					this._downloadBlob(n, t.name), e++;
				}
				r.show("Enhancement Complete!", `Watermarks filtered and ${e} PDFs enhanced.`, "success");
			}
		} catch (e) {
			r.show("Operation Failed", e.message, "error");
		} finally {
			this.isProcessing = !1;
		}
	}
	_downloadBlob(e, t) {
		let n = URL.createObjectURL(e), r = document.createElement("a");
		r.href = n, r.download = t, r.style.display = "none", document.body.appendChild(r), r.click(), setTimeout(() => {
			document.body.removeChild(r), URL.revokeObjectURL(n);
		}, 1e3);
	}
};
function ut() {
	let e = new lt();
	return e.init(), e;
}
// src/modules/image-studio.js
function dt(e, t, n, r = "magic_color") {
	if (!e || r === "none" || r === "original") return;
	let i = e.getImageData(0, 0, t, n), a = i.data;
	for (let e = 0; e < a.length; e += 4) {
		let t = a[e], n = a[e + 1], i = a[e + 2], o = .299 * t + .587 * n + .114 * i;
		if (r === "magic_color" || r === "enhanced") o > 165 ? (t = Math.min(255, t * 1.18 + 15), n = Math.min(255, n * 1.18 + 15), i = Math.min(255, i * 1.18 + 15)) : o < 115 && (t = Math.max(0, t * .82), n = Math.max(0, n * .82), i = Math.max(0, i * .82)), a[e] = t, a[e + 1] = n, a[e + 2] = i;
		else if (r === "bw_scan") {
			let t = o > 140 ? 255 : 0;
			a[e] = t, a[e + 1] = t, a[e + 2] = t;
		} else if (r === "brighten") a[e] = Math.min(255, t * 1.25 + 20), a[e + 1] = Math.min(255, n * 1.25 + 20), a[e + 2] = Math.min(255, i * 1.25 + 20);
		else if (r === "sharp_contrast") {
			let r = 1.35;
			a[e] = Math.min(255, Math.max(0, ((t / 255 - .5) * r + .5) * 255)), a[e + 1] = Math.min(255, Math.max(0, ((n / 255 - .5) * r + .5) * 255)), a[e + 2] = Math.min(255, Math.max(0, ((i / 255 - .5) * r + .5) * 255));
		} else r === "grayscale" && (a[e] = o, a[e + 1] = o, a[e + 2] = o);
	}
	e.putImageData(i, 0, 0);
}
function ft(e, t = 0) {
	let n = document.createElement("canvas"), r = (t % 360 + 360) % 360, i = r === 90 || r === 270, a = i ? e.height : e.width, o = i ? e.width : e.height;
	n.width = a, n.height = o;
	let s = n.getContext("2d");
	return s.save(), s.translate(n.width / 2, n.height / 2), s.rotate(r * Math.PI / 180), s.drawImage(e, -e.width / 2, -e.height / 2), s.restore(), n;
}
async function pt(e, t = 250, n = {}) {
	let { rotation: r = 0, filterMode: i = "none", outputMime: a = "image/jpeg", maxDimension: o = 2400 } = n;
	return new Promise((n, s) => {
		let c = new Image(), l = URL.createObjectURL(e);
		c.onload = async () => {
			URL.revokeObjectURL(l);
			try {
				let e = c.width, s = c.height;
				if (Math.max(e, s) > o) {
					let t = o / Math.max(e, s);
					e = Math.round(e * t), s = Math.round(s * t);
				}
				let l;
				if (r === 0 ? (l = document.createElement("canvas"), l.width = e, l.height = s, l.getContext("2d").drawImage(c, 0, 0, e, s)) : l = ft(c, r), i && i !== "none" && dt(l.getContext("2d"), l.width, l.height, i), !t || t <= 0) {
					let e = await new Promise((e) => l.toBlob(e, a, .9));
					return n({
						blob: e,
						size: e.size,
						targetHit: !0,
						width: l.width,
						height: l.height,
						quality: .9
					});
				}
				let u = t * 1024, d = .08, f = .96, p = null, m = .85;
				for (let e = 0; e < 6; e++) {
					let e = (d + f) / 2, t = await new Promise((t) => l.toBlob(t, a, e));
					if (p = t, m = e, t.size > u) f = e;
					else if (d = e, t.size >= u * .92) break;
				}
				if (p && p.size > u) {
					let e = l, t = p, n = 0;
					for (; t && t.size > u && n < 8 && e.width > 250;) {
						n++;
						let r = t.size, i = Math.min(.88, Math.max(.2, Math.sqrt(u / r) * .95)), o = Math.max(250, Math.round(e.width * i)), s = Math.max(300, Math.round(e.height * i)), c = document.createElement("canvas");
						c.width = o, c.height = s;
						let l = c.getContext("2d");
						if (l && (l.imageSmoothingEnabled = !0, l.imageSmoothingQuality = "high", l.drawImage(e, 0, 0, o, s)), t = await new Promise((e) => c.toBlob(e, a, m)), e = c, t && t.size <= u) break;
					}
					t && (p = t, l = e);
				}
				n({
					blob: p,
					size: p ? p.size : 0,
					targetHit: p ? p.size <= u * 1.05 : !1,
					width: l.width,
					height: l.height,
					quality: Math.round(m * 100)
				});
			} catch (e) {
				s(e);
			}
		}, c.onerror = () => {
			URL.revokeObjectURL(l), s(/* @__PURE__ */ Error("Failed to load image file for compression"));
		}, c.src = l;
	});
}
async function mt(e, t = "image/png") {
	return new Promise((n, r) => {
		let i = new Image(), a = URL.createObjectURL(e);
		i.onload = () => {
			URL.revokeObjectURL(a);
			try {
				let e = document.createElement("canvas");
				e.width = i.width, e.height = i.height, e.getContext("2d").drawImage(i, 0, 0), e.toBlob((i) => {
					if (!i) return r(/* @__PURE__ */ Error("Canvas format conversion failed"));
					n({
						blob: i,
						size: i.size,
						mime: t,
						width: e.width,
						height: e.height
					});
				}, t, .92);
			} catch (e) {
				r(e);
			}
		}, i.onerror = () => {
			URL.revokeObjectURL(a), r(/* @__PURE__ */ Error("Failed to load image for format conversion"));
		}, i.src = a;
	});
}
// src/ui/image-studio-ui.js
var ht = class {
	constructor() {
		this.activeTool = "compress_photo_sign", this.files = [], this.isProcessing = !1;
	}
	init() {
		this._bindRibbonTools(), this._bindActions(), this._bindDropzone(), this.renderQueue(), console.info("[DocMitra Image Studio] Image Studio UI manager initialized.");
	}
	_bindRibbonTools() {
		let e = document.querySelectorAll("#view-image-studio .tool-ribbon-btn"), t = [
			"compress_photo_sign",
			"passport_crop",
			"sign_clean_invert",
			"image_to_pdf",
			"magic_color",
			"resize_convert"
		];
		e.forEach((e, n) => {
			e.addEventListener("click", (r) => {
				r.preventDefault();
				let i = t[n] || "compress_photo_sign";
				this.setTool(i, e);
			});
		});
	}
	setTool(e, t = null) {
		if (this.activeTool = e, document.querySelectorAll("#view-image-studio .tool-ribbon-btn").forEach((e) => {
			e.classList.remove("bg-primary-container", "text-on-primary", "font-semibold", "shadow-sm"), e.classList.add("text-on-surface-variant", "hover:bg-surface-container-low", "hover:text-on-surface");
			let t = e.querySelector(".bg-primary\\/60");
			t && t.remove();
		}), t) {
			t.classList.remove("text-on-surface-variant", "hover:bg-surface-container-low", "hover:text-on-surface"), t.classList.add("bg-primary-container", "text-on-primary", "font-semibold", "shadow-sm");
			let e = document.createElement("span");
			e.className = "bg-primary/60 text-on-primary text-[10px] font-mono-code px-1.5 py-0.5 rounded font-bold uppercase tracking-tight", e.textContent = "Active", t.appendChild(e);
		}
		this._updateProcessButtonLabel(), r.show("Tool Selected", this._getToolDisplayName(e), "info");
	}
	_getToolDisplayName(e) {
		switch (e) {
			case "compress_photo_sign": return "Compress Photo (<50KB) & Sign (<20KB)";
			case "passport_crop": return "Passport Crop (3.5 × 4.5 cm)";
			case "sign_clean_invert": return "Signature Clean & Invert";
			case "image_to_pdf": return "Image to PDF (A4)";
			case "magic_color": return "CamScanner Magic Color";
			case "resize_convert": return "Resize & Convert (JPG/PNG)";
			default: return "Image Processing";
		}
	}
	_updateProcessButtonLabel() {
		let e = document.getElementById("startImageProcessBtn");
		if (!e) return;
		let t = e.querySelector("span:nth-of-type(2)");
		if (t) {
			let e = this.files.length, n = "Start Process";
			this.activeTool === "compress_photo_sign" ? n = "Compress" : this.activeTool === "passport_crop" ? n = "Passport Crop" : this.activeTool === "sign_clean_invert" ? n = "Clean Signature" : this.activeTool === "image_to_pdf" ? n = "Convert to PDF" : this.activeTool === "magic_color" ? n = "Apply Magic Color" : this.activeTool === "resize_convert" && (n = "Convert Format"), t.textContent = `${n} (${e} Files)`;
		}
	}
	_bindActions() {
		let e = document.getElementById("btnBrowseImageDir");
		e && e.addEventListener("click", () => this.handleBrowseFolder());
		let t = document.getElementById("btnAddImageFiles");
		t && t.addEventListener("click", () => this.handleAddFiles());
		let n = document.getElementById("btnRotateAllImages");
		n && n.addEventListener("click", () => this.handleRotateAll());
		let r = document.getElementById("btnClearImageQueue");
		r && r.addEventListener("click", () => this.handleClearQueue());
		let i = document.getElementById("btnFilterOversizedImages");
		i && i.addEventListener("click", () => this.handleFilterOversized());
		let a = document.getElementById("startImageProcessBtn");
		a && a.addEventListener("click", () => this.handleStartProcess());
	}
	_bindDropzone() {
		let e = document.getElementById("view-image-studio");
		e && (e.addEventListener("dragover", (e) => {
			e.preventDefault(), e.stopPropagation();
		}), e.addEventListener("drop", async (e) => {
			e.preventDefault(), e.stopPropagation();
			let t = Array.from(e.dataTransfer?.files || []).filter((e) => /\.(jpe?g|png|webp|bmp|gif)$/i.test(e.name));
			t.length === 0 ? r.show("Invalid Files", "Please drop image files (JPG, PNG, WebP) only.", "warning") : await this.loadDroppedFiles(t);
		}));
	}
	async handleBrowseFolder() {
		r.show("Opening Folder Picker", "Navigating Windows Explorer...", "info");
		try {
			let e = await c();
			if (!e.success) {
				e.cancelled || r.show("Folder Select Error", e.error || "Failed to select folder", "error");
				return;
			}
			let t = (e.files || []).filter((e) => /\.(jpe?g|png|webp|bmp|gif)$/i.test(e.name));
			if (t.length === 0) {
				r.show("No Images Found", "Selected directory contains 0 image files.", "warning");
				return;
			}
			await this.loadNativeFiles(t), r.show("Images Loaded", `${t.length} photos added to execution queue.`, "success");
		} catch (e) {
			r.show("Folder Error", e.message, "error");
		}
	}
	async handleAddFiles() {
		let e = document.createElement("input");
		e.type = "file", e.accept = "image/*,.jpg,.jpeg,.png,.webp,.bmp", e.multiple = !0, e.style.display = "none", e.addEventListener("change", async (t) => {
			let n = Array.from(t.target.files || []);
			n.length > 0 && await this.loadDroppedFiles(n), document.body.removeChild(e);
		}), document.body.appendChild(e), e.click();
	}
	async loadNativeFiles(e) {
		for (let t of e) {
			let e = t.url || (t.path ? `http://localhost:3000/api/serve-file?path=${encodeURIComponent(t.path)}` : null);
			this.files.push({
				id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
				name: t.name,
				path: t.path,
				size: t.size || 0,
				url: e,
				fileOrBlob: null,
				width: 0,
				height: 0,
				status: "ready"
			});
		}
		this.renderQueue();
	}
	async loadDroppedFiles(e) {
		for (let t of e) {
			let e = URL.createObjectURL(t);
			this.files.push({
				id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
				name: t.name,
				path: t.name,
				size: t.size,
				url: e,
				fileOrBlob: t,
				width: 0,
				height: 0,
				status: "ready"
			});
		}
		this.renderQueue(), r.show("Images Added", `${e.length} photos added to queue.`, "success");
	}
	renderQueue() {
		let e = document.getElementById("imageCardsGrid");
		if (e) {
			for (; e.firstChild;) e.removeChild(e.firstChild);
			if (this.files.length === 0) {
				let t = document.createElement("div");
				t.className = "col-span-full p-8 text-center bg-surface-container-lowest rounded-xl border border-surface-container-high/80 flex flex-col items-center gap-2";
				let n = document.createElement("span");
				n.className = "material-symbols-outlined text-[40px] text-primary opacity-60", n.textContent = "image", t.appendChild(n);
				let r = document.createElement("div");
				r.className = "font-headline-sm font-bold text-on-surface", r.textContent = "No Images in Studio Queue", t.appendChild(r);
				let i = document.createElement("div");
				i.className = "text-body-sm text-secondary", i.textContent = "Drag & drop student photos or signatures here or click \"Browse Directory\".", t.appendChild(i), e.appendChild(t), this._updateProcessButtonLabel();
			} else this.files.forEach((t, n) => {
				let r = document.createElement("div");
				r.className = "bg-surface-container-lowest rounded-xl border border-surface-container-high/80 p-2.5 flex flex-col justify-between hover:shadow-md transition-shadow group relative";
				let i = document.createElement("div");
				i.className = "absolute top-1.5 right-1.5 z-10 flex items-center gap-1";
				let a = document.createElement("button");
				a.type = "button", a.className = "w-5 h-5 rounded flex items-center justify-center bg-surface-container-lowest/90 text-outline hover:text-primary transition-colors shadow-xs cursor-pointer", a.title = "Rotate 90°";
				let o = document.createElement("span");
				o.className = "material-symbols-outlined text-[13px]", o.textContent = "rotate_right", a.appendChild(o), a.addEventListener("click", (e) => {
					e.stopPropagation(), this.rotateSingleFile(n);
				}), i.appendChild(a);
				let s = document.createElement("button");
				s.type = "button", s.className = "w-5 h-5 rounded flex items-center justify-center bg-surface-container-lowest/90 text-outline hover:text-error transition-colors shadow-xs cursor-pointer", s.title = "Remove";
				let c = document.createElement("span");
				c.className = "material-symbols-outlined text-[13px]", c.textContent = "close", s.appendChild(c), s.addEventListener("click", (e) => {
					e.stopPropagation(), this.removeFile(n);
				}), i.appendChild(s), r.appendChild(i);
				let l = document.createElement("div");
				if (l.className = "relative w-full h-24 rounded-lg bg-surface-container-low overflow-hidden mb-2 border border-surface-container-high/60 flex items-center justify-center", t.url) {
					let e = document.createElement("img");
					e.src = t.url, e.alt = t.name, e.className = "w-full h-full object-contain", l.appendChild(e);
				}
				r.appendChild(l);
				let u = document.createElement("div");
				u.className = "font-headline-sm text-[12px] font-bold text-on-surface truncate mb-1", u.title = t.name, u.textContent = t.name, r.appendChild(u);
				let d = /sign|signature|स्वाक्षरी/i.test(t.name), f = /photo|pic|passport|फोटो/i.test(t.name), p = d ? 20 : f ? 50 : 256, m = document.createElement("div");
				m.className = "bg-surface-container-low border border-surface-container-high/60 rounded-lg p-1.5 flex flex-col gap-0.5 font-mono-code text-[10px]";
				let h = document.createElement("div");
				h.className = "flex items-center justify-between text-outline";
				let g = Math.round(t.size / 1024);
				h.appendChild(document.createTextNode(`Size: ${g} KB`));
				let _ = document.createElement("span");
				_.className = d ? "text-amber-700 font-bold" : "text-primary font-bold", _.textContent = d ? "Sign" : f ? "Photo" : "Doc", h.appendChild(_), m.appendChild(h);
				let v = document.createElement("div");
				v.className = "flex items-center justify-between font-bold text-on-surface", v.appendChild(document.createTextNode("Target:"));
				let y = document.createElement("span");
				y.className = "text-primary font-bold", y.textContent = `< ${p} KB`, v.appendChild(y), m.appendChild(v), r.appendChild(m), e.appendChild(r);
			}), this._updateProcessButtonLabel();
		}
	}
	rotateSingleFile(e) {
		let t = this.files[e];
		if (!t || !t.url) return;
		let n = new Image();
		n.crossOrigin = "anonymous", n.onload = () => {
			ft(n, 90).toBlob((e) => {
				t.url = URL.createObjectURL(e), t.size = e.size, t.fileOrBlob = e, this.renderQueue(), r.show("Image Rotated", `${t.name} rotated 90° clockwise.`, "info");
			}, "image/jpeg", .92);
		}, n.src = t.url;
	}
	removeFile(e) {
		this.files.splice(e, 1), this.renderQueue();
	}
	handleRotateAll() {
		this.files.forEach((e, t) => this.rotateSingleFile(t));
	}
	handleClearQueue() {
		this.files = [], this.renderQueue(), r.show("Queue Cleared", "Image workstation reset.", "info");
	}
	handleFilterOversized() {
		let e = this.files.length;
		this.files = this.files.filter((e) => e.size > 51200), this.renderQueue(), r.show("Filter Applied", `Kept ${this.files.length} oversized files (>50 KB) from ${e}.`, "info");
	}
	async handleStartProcess() {
		if (this.files.length === 0) {
			r.show("No Images", "Please add image files to process.", "warning");
			return;
		}
		if (this.isProcessing) return;
		this.isProcessing = !0;
		let e = this.activeTool;
		r.show("Processing Images", `Executing ${this._getToolDisplayName(e)} on ${this.files.length} files...`, "info");
		try {
			let t = 0;
			for (let n of this.files) {
				let r = n.fileOrBlob;
				if (!r && n.url && (r = await (await fetch(n.url)).blob()), r) {
					if (e === "compress_photo_sign") {
						let e = /sign|signature|स्वाक्षरी/i.test(n.name) ? 18 : 45, i = await pt(r, e);
						this._downloadBlob(i.blob, `Compressed_${n.name}`), t++;
					} else if (e === "passport_crop") {
						let e = await pt(await this._cropPassport(r), 48);
						this._downloadBlob(e.blob, `Passport_${n.name}`), t++;
					} else if (e === "sign_clean_invert") {
						let e = await pt(r, 18, { filterMode: "sharp_contrast" });
						this._downloadBlob(e.blob, `Clean_Sign_${n.name}`), t++;
					} else if (e === "image_to_pdf") {
						let e = await r.arrayBuffer(), i = Q([{
							bytes: new Uint8Array(e),
							width: 0,
							height: 0
						}], "portrait"), a = n.name.replace(/\.[a-zA-Z0-9]+$/, "") + ".pdf";
						this._downloadBlob(i, a), t++;
					} else if (e === "magic_color") {
						let e = await pt(r, 240, { filterMode: "enhanced" });
						this._downloadBlob(e.blob, `Magic_${n.name}`), t++;
					} else {
						let e = await mt(r, "image/jpeg");
						this._downloadBlob(e.blob, `Converted_${n.name.replace(/\.[a-zA-Z0-9]+$/, ".jpg")}`), t++;
					}
				}
			}
			r.show("Process Complete!", `Successfully processed and saved ${t} files.`, "success");
		} catch (e) {
			r.show("Processing Error", e.message, "error");
		} finally {
			this.isProcessing = !1;
		}
	}
	async _cropPassport(e) {
		return new Promise((t, n) => {
			let r = new Image(), i = URL.createObjectURL(e);
			r.onload = () => {
				URL.revokeObjectURL(i);
				let e = document.createElement("canvas");
				e.width = 350, e.height = 450;
				let n = e.getContext("2d"), a = r.width / r.height, o = 350 / 450, s, c, l, u;
				a > o ? (u = r.height, l = r.height * o, s = (r.width - l) / 2, c = 0) : (l = r.width, u = r.width / o, s = 0, c = (r.height - u) / 2), n.drawImage(r, s, c, l, u, 0, 0, 350, 450), e.toBlob(t, "image/jpeg", .95);
			}, r.onerror = () => {
				URL.revokeObjectURL(i), n(/* @__PURE__ */ Error("Failed to load image for passport cropping"));
			}, r.src = i;
		});
	}
	_downloadBlob(e, t) {
		let n = URL.createObjectURL(e), r = document.createElement("a");
		r.href = n, r.download = t, r.style.display = "none", document.body.appendChild(r), r.click(), setTimeout(() => {
			document.body.removeChild(r), URL.revokeObjectURL(n);
		}, 1e3);
	}
};
function gt() {
	let e = new ht();
	return e.init(), e;
}
// src/libraries/document-matcher.js
var _t = [
	{
		id: "12th-marksheet-passing-combined",
		outputName: "12TH MARKSHEET AND PASSING",
		shortcut: "12MP",
		patterns: [
			/\b12mp\b/i,
			/\b12tmp\b/i,
			/\b12(th)?\s*(mark|marksheet|मार्क|मार्कशीट).*(pass|passing|पास)\b/i,
			/\b12(th)?\s*(pass|passing|पास).*(mark|marksheet|मार्क|मार्कशीट)\b/i,
			/\b12(th)?\s*combined\b/i
		]
	},
	{
		id: "10th-marksheet-passing-combined",
		outputName: "10TH MARKSHEET AND PASSING",
		shortcut: "10MP",
		patterns: [
			/\b10mp\b/i,
			/\b10tmp\b/i,
			/\b10(th)?\s*(mark|marksheet|मार्क|मार्कशीट).*(pass|passing|पास)\b/i,
			/\b10(th)?\s*(pass|passing|पास).*(mark|marksheet|मार्क|मार्कशीट)\b/i,
			/\b10(th)?\s*combined\b/i
		]
	},
	{
		id: "12th-lc",
		outputName: "12TH LC",
		shortcut: "12LC",
		patterns: [
			/\b12lc\b/i,
			/\b12(th)?\s*lc\b/i,
			/\b12(th)?\s*leaving\b/i,
			/\b12(th)?\s*tc\b/i,
			/\bhsc\s*lc\b/i,
			/\bhsc\s*leaving\b/i,
			/12.*(एलसी|दाखला|tc)/i
		]
	},
	{
		id: "12th-marksheet",
		outputName: "12TH MARKSHEET",
		shortcut: "12M",
		patterns: [
			/\b12m\b/i,
			/\b12(th)?\s*(mark|marksheet|marskheet)\b/i,
			/\bhsc\s*(mark|marksheet)\b/i,
			/12.*(मार्क|मार्कशीट)/i
		]
	},
	{
		id: "12th-passing",
		outputName: "12TH PASSING CERTIFICATE",
		shortcut: "12P",
		patterns: [
			/\b12p\b/i,
			/\b12(th)?\s*(pass|passing|pasing)\b/i,
			/\bhsc\s*(pass|passing)\b/i,
			/12.*(पास|पासिंग)/i
		]
	},
	{
		id: "10th-lc",
		outputName: "10TH LC",
		shortcut: "10LC",
		patterns: [
			/\b10lc\b/i,
			/\b10l\b/i,
			/\b10(th)?\s*lc\b/i,
			/\b10(th)?\s*leaving\b/i,
			/\b10(th)?\s*tc\b/i,
			/\bssc\s*(lc|leaving|tc)\b/i,
			/10.*(एलसी|दाखला|tc)/i
		]
	},
	{
		id: "10th-marksheet",
		outputName: "10TH MARKSHEET",
		shortcut: "10M",
		patterns: [
			/\b10m\b/i,
			/\b10(th)?\s*(mark|marksheet|marskheet)\b/i,
			/\bssc\s*(mark|marksheet)\b/i,
			/10.*(मार्क|मार्कशीट)/i
		]
	},
	{
		id: "10th-passing",
		outputName: "10TH PASSING CERTIFICATE",
		shortcut: "10P",
		patterns: [
			/\b10p\b/i,
			/\b10(th)?\s*(pass|passing|pasing)\b/i,
			/\bssc\s*(pass|passing)\b/i,
			/10.*(पास|पासिंग)/i
		]
	},
	{
		id: "aadhaar-card",
		outputName: "AADHAAR CARD",
		shortcut: "ADR",
		patterns: [
			/\badr\b/i,
			/\b(aadhaar|aadhar|adhar|aadhhar)\b/i,
			/\buid\b/i,
			/आधार/i
		]
	},
	{
		id: "pan-card",
		outputName: "PAN CARD",
		shortcut: "PAN",
		patterns: [
			/\bpan\b/i,
			/\bpan\s*card\b/i,
			/पॅन/i
		]
	},
	{
		id: "photo",
		outputName: "PHOTO",
		shortcut: "PIC",
		patterns: [
			/\bpic\b/i,
			/\b(photo|photograph|picture)\b/i,
			/\bstudent\s*photo\b/i,
			/\bpassport\s*photo\b/i,
			/फोटो/i
		]
	},
	{
		id: "caste-certificate",
		outputName: "CASTE CERTIFICATE",
		shortcut: "CST",
		patterns: [
			/\bcst\b/i,
			/\bcast\b/i,
			/\bcaste\b/i,
			/\bjati\b/i,
			/जात/i
		]
	},
	{
		id: "validity-certificate",
		outputName: "VALIDITY CERTIFICATE",
		shortcut: "VLD",
		patterns: [
			/\bvld\b/i,
			/\bvalidity\b/i,
			/\bcaste\s*validity\b/i,
			/वैधता/i
		]
	},
	{
		id: "domicile-certificate",
		outputName: "DOMICILE CERTIFICATE",
		shortcut: "DOM",
		patterns: [
			/\bdom\b/i,
			/\bdomi\b/i,
			/\b(domicile|domocile|adhivas)\b/i,
			/अधिवास|रहिवासी/i
		]
	},
	{
		id: "nationality-certificate",
		outputName: "NATIONALITY CERTIFICATE",
		shortcut: "NAT",
		patterns: [
			/\bnat\b/i,
			/\bnati\b/i,
			/\bnationality\b/i,
			/राष्ट्रीयत्व/i
		]
	},
	{
		id: "income-certificate",
		outputName: "INCOME CERTIFICATE",
		shortcut: "INC",
		patterns: [
			/\binc\b/i,
			/\binco\b/i,
			/\b(income|incom|utpanna)\b/i,
			/उत्पन्न/i
		]
	},
	{
		id: "bank-passbook",
		outputName: "PASSBOOK BANK",
		shortcut: "BNK",
		patterns: [
			/\bbnk\b/i,
			/\bpass\b/i,
			/\b(passbook|pasbook|bank\s*passbook)\b/i,
			/पासबुक|बँक/i
		]
	},
	{
		id: "attempt-certificate",
		outputName: "ATTEMPT CERTIFICATE",
		shortcut: "ATM",
		patterns: [
			/\batm\b/i,
			/\b(attempt|atempt|attmpt)\b/i,
			/अटेम्प्ट|प्रयत्न/i
		]
	},
	{
		id: "birth-certificate",
		outputName: "BIRTH CERTIFICATE",
		shortcut: "BRT",
		patterns: [
			/\bbrt\b/i,
			/\bbir\b/i,
			/\b(birth|janma)\b/i,
			/जन्म/i
		]
	},
	{
		id: "bonafide-certificate",
		outputName: "BONAFIDE CERTIFICATE",
		shortcut: "BNF",
		patterns: [
			/\bbnf\b/i,
			/\bbona\b/i,
			/\b(bonafide|bonafied|bonafidee)\b/i,
			/बोनाफाईड|बोनाफाइड/i
		]
	},
	{
		id: "gap-certificate",
		outputName: "GAP CERTIFICATE",
		shortcut: "GAP",
		patterns: [
			/\bgap\b/i,
			/\bgap\s*certificate\b/i,
			/\bgap\s*affidavit\b/i,
			/गॅप/i
		]
	},
	{
		id: "self-declaration",
		outputName: "SELF DECLARATION",
		shortcut: "SLF",
		patterns: [
			/\bslf\b/i,
			/\bself\b/i,
			/\bself\s*declaration\b/i,
			/\bsvataha\b/i,
			/स्वयं/i
		]
	},
	{
		id: "parent-declaration",
		outputName: "PARENT DECLARATION",
		shortcut: "PAR",
		patterns: [
			/\bpar\b/i,
			/\bpart\b/i,
			/\b(parent|palak)\b/i,
			/\bparent\s*declaration\b/i,
			/पालक/i
		]
	},
	{
		id: "apaar-id",
		outputName: "APAAR ID",
		shortcut: "APAAR",
		patterns: [
			/\bapaar\b/i,
			/\bapaar\s*id\b/i,
			/\babc\s*id\b/i,
			/\babc\b/i,
			/अपार/i
		]
	},
	{
		id: "degree-certificate",
		outputName: "DEGREE CERTIFICATE",
		shortcut: "DEG",
		patterns: [
			/\bdeg\b/i,
			/\bdegree\b/i,
			/\bdegree\s*certificate\b/i,
			/पदवी/i
		]
	},
	{
		id: "registration-certificate",
		outputName: "REGISTRATION CERTIFICATE",
		shortcut: "REG",
		patterns: [
			/\breg\b/i,
			/\bregistration\b/i,
			/\bregistration\s*certificate\b/i,
			/नोंदणी/i
		]
	},
	{
		id: "ration-card",
		outputName: "RATION CARD",
		shortcut: "RAT",
		patterns: [
			/\brat\b/i,
			/\bration\b/i,
			/\bration\s*card\b/i,
			/रेशन/i
		]
	}
];
function vt(e, t = null) {
	if (!e || typeof e != "string") return {
		docType: null,
		percentage: 0,
		badgeText: "Needs Input ✏️",
		badgeClass: "matchNeutral",
		status: "none"
	};
	let n = e.trim().toLowerCase(), r = n.replace(/[-_.]+/g, " ");
	for (let e of _t) if (n === e.shortcut.toLowerCase() || r.trim() === e.shortcut.toLowerCase()) return {
		docType: e.outputName,
		percentage: 100,
		badgeText: `100% Match: ${e.outputName}`,
		badgeClass: "matchGreen",
		status: "exact"
	};
	if (t) {
		for (let [e, r] of Object.entries(t)) if (Array.isArray(r)) {
			for (let t of r) if (n === t.toLowerCase().trim()) return {
				docType: e,
				percentage: 100,
				badgeText: `100% Match: ${e}`,
				badgeClass: "matchGreen",
				status: "exact"
			};
		}
	}
	for (let e of _t) for (let t of e.patterns) if (t.test(n) || t.test(r)) return {
		docType: e.outputName,
		percentage: 100,
		badgeText: `100% Match: ${e.outputName}`,
		badgeClass: "matchGreen",
		status: "pattern"
	};
	if (t) {
		for (let [e, r] of Object.entries(t)) if (Array.isArray(r)) for (let t of r) {
			let r = t.toLowerCase().trim();
			if (r.length > 2 && n.includes(r)) return {
				docType: e,
				percentage: 90,
				badgeText: `90% Match: ${e}`,
				badgeClass: "matchYellow",
				status: "custom"
			};
		}
	}
	return {
		docType: null,
		percentage: 0,
		badgeText: "Needs Input ✏️",
		badgeClass: "matchNeutral",
		status: "none"
	};
}
({ ...Se });
function yt(e) {
	if (!e || typeof e != "string") return "";
	let t = vt(e);
	if (t && t.docType) return t.docType;
	let n = e.replace(/\.[^/.]+$/, "");
	return n = n.replace(/\s*\(p\.\d+\)/i, ""), n.trim().toUpperCase();
}
function bt(e) {
	if (!e || typeof e != "string") return "";
	let t = e.replace(/\.[^/.]+$/, "").trim(), n = vt(t);
	if (n && n.docType) {
		let e = n.docType, r = t, i = RegExp(`^${e}\\b`, "i");
		if (i.test(r) ? r = r.replace(i, "").trim() : e.split(/\s+/).forEach((e) => {
			if (e.length > 2) {
				let t = RegExp(`\\b${e}\\b`, "gi");
				r = r.replace(t, "").trim();
			}
		}), r = r.replace(/^[-_.\s]+|[-_.\s]+$/g, "").trim(), r.length >= 3) return r;
	}
	return t;
}
function xt(e, t = []) {
	return !Array.isArray(e) || e.length === 0 ? [] : !Array.isArray(t) || t.length === 0 ? [...e] : [...e].sort((e, n) => {
		let r = e.docType || yt(e.label || e.name), i = n.docType || yt(n.label || n.name), a = t.findIndex((e) => {
			let t = e.toUpperCase(), n = r.toUpperCase();
			return t === n || n.includes(t) || t.includes(n);
		}), o = t.findIndex((e) => {
			let t = e.toUpperCase(), n = i.toUpperCase();
			return t === n || n.includes(t) || t.includes(n);
		});
		return a === -1 && (a = 9999), o === -1 && (o = 9999), a === o ? (e.pageNumber || 1) - (n.pageNumber || 1) : a - o;
	});
}
// src/ui/print-studio-ui.js
var St = class {
	constructor() {
		this.presets = { ...Se }, this.activePresetKey = "MAHA DBT FORM", this.documents = [], this.activeDocIndex = 0, this.zoomLevel = 100;
	}
	init() {
		this._seedDemoDocumentsIfEmpty(), this._bindControls(), this.renderPresetSelector(), this.renderDocumentList(), this.renderActivePreview(), this.renderThumbnails(), console.info("[DocMitra Print Studio] Print Studio UI manager initialized.");
	}
	_seedDemoDocumentsIfEmpty() {
		if (this.documents.length === 0) {
			let e = [
				{
					name: "10TH MARKSHEET Vijay Ramesh Yadav.pdf",
					docType: "10TH MARKSHEET",
					studentName: "VIJAY RAMESH YADAV",
					authority: "MAHARASHTRA STATE BOARD",
					docId: "MSB-2024-098231",
					date: "12-JUNE-2024"
				},
				{
					name: "12TH MARKSHEET Vijay Ramesh Yadav.pdf",
					docType: "12TH MARKSHEET",
					studentName: "VIJAY RAMESH YADAV",
					authority: "MAHARASHTRA STATE BOARD",
					docId: "MSB-2026-114920",
					date: "21-MAY-2026"
				},
				{
					name: "12TH LC Vijay Ramesh Yadav.pdf",
					docType: "12TH LC",
					studentName: "VIJAY RAMESH YADAV",
					authority: "KIRTI M. DOONGURSEE COLLEGE",
					docId: "LC-2026-8831",
					date: "04-JUNE-2026"
				},
				{
					name: "AADHAAR CARD Vijay Ramesh Yadav.pdf",
					docType: "AADHAAR CARD",
					studentName: "VIJAY RAMESH YADAV",
					authority: "UNIQUE IDENTIFICATION AUTHORITY OF INDIA",
					docId: "UID-XXXX-XXXX-9021",
					date: "VERIFIED"
				},
				{
					name: "DOMICILE CERTIFICATE Vijay Ramesh Yadav.pdf",
					docType: "DOMICILE CERTIFICATE",
					studentName: "VIJAY RAMESH YADAV",
					authority: "TAHSILDAR OFFICE MUMBAI",
					docId: "REV-MAHA-2025-4412",
					date: "14-AUG-2025"
				},
				{
					name: "INCOME CERTIFICATE Vijay Ramesh Yadav.pdf",
					docType: "INCOME CERTIFICATE",
					studentName: "VIJAY RAMESH YADAV",
					authority: "TAHSILDAR OFFICE MUMBAI",
					docId: "INC-2026-098214",
					date: "02-APR-2026"
				},
				{
					name: "CASTE CERTIFICATE Vijay Ramesh Yadav.pdf",
					docType: "CASTE CERTIFICATE",
					studentName: "VIJAY RAMESH YADAV",
					authority: "SUB DIVISIONAL OFFICER (SDO)",
					docId: "CST-MAHA-2022-771",
					date: "19-OCT-2022"
				},
				{
					name: "PASSBOOK BANK Vijay Ramesh Yadav.pdf",
					docType: "PASSBOOK BANK",
					studentName: "VIJAY RAMESH YADAV",
					authority: "STATE BANK OF INDIA",
					docId: "SBI-A/C-XXXX9812",
					date: "ACTIVE"
				}
			];
			this.documents = e.map((e, t) => ({
				id: `print_doc_${t + 1}`,
				name: e.name,
				path: e.name,
				docType: e.docType,
				studentName: e.studentName,
				authority: e.authority,
				docId: e.docId,
				date: e.date,
				pageNumber: 1,
				totalPages: 1,
				rotation: 0,
				status: "queued"
			}));
		}
	}
	_bindControls() {
		let e = document.getElementById("sequencePresetSelect");
		e && e.addEventListener("change", (e) => {
			this.activePresetKey = e.target.value;
			let t = document.getElementById("activeSeqLabel");
			t && (t.textContent = this.activePresetKey), r.show("Preset Selected", this.activePresetKey, "info");
		});
		let t = document.getElementById("browseBtn");
		t && t.addEventListener("click", () => this.handleBrowseFolder());
		let n = document.getElementById("addAutoSeqBtn");
		n && n.addEventListener("click", () => this.handleAutoOrder());
		let i = document.getElementById("addAsIsBtn");
		i && i.addEventListener("click", () => {
			r.show("Natural Order Kept", "Queue preserved as loaded.", "info");
		});
		let a = document.getElementById("btnSavePreset");
		a && a.addEventListener("click", () => {
			r.show("Preset Saved", `Saved order for ${this.activePresetKey}`, "success");
		}), [document.getElementById("clearQueueBtn"), document.getElementById("dockClearBtn")].forEach((e) => {
			e && e.addEventListener("click", () => this.handleClearQueue());
		});
		let o = document.getElementById("zoomInBtn"), s = document.getElementById("zoomOutBtn"), c = document.getElementById("fitScreenBtn");
		o && o.addEventListener("click", () => {
			this.zoomLevel = Math.min(200, this.zoomLevel + 10), this._updateZoom();
		}), s && s.addEventListener("click", () => {
			this.zoomLevel = Math.max(50, this.zoomLevel - 10), this._updateZoom();
		}), c && c.addEventListener("click", () => {
			this.zoomLevel = 100, this._updateZoom();
		});
		let l = document.getElementById("prevPageBtn"), u = document.getElementById("nextPageBtn");
		l && l.addEventListener("click", () => {
			this.activeDocIndex > 0 && (this.activeDocIndex--, this.renderActivePreview(), this.renderThumbnails());
		}), u && u.addEventListener("click", () => {
			this.activeDocIndex < this.documents.length - 1 && (this.activeDocIndex++, this.renderActivePreview(), this.renderThumbnails());
		});
		let d = document.getElementById("primaryPrintBtn");
		d && d.addEventListener("click", () => this.handlePrint());
	}
	_updateZoom() {
		let e = document.getElementById("zoomLevelDisplay");
		e && (e.textContent = `${this.zoomLevel}%`);
		let t = document.getElementById("a4Sheet");
		t && (t.style.transform = `scale(${this.zoomLevel / 100})`, t.style.transformOrigin = "top center", t.style.transition = "transform 0.2s ease-out");
	}
	renderPresetSelector() {
		let e = document.getElementById("sequencePresetSelect");
		if (e) {
			for (; e.firstChild;) e.removeChild(e.firstChild);
			Object.keys(this.presets).forEach((t) => {
				let n = document.createElement("option");
				n.value = t, n.textContent = t, t === this.activePresetKey && (n.selected = !0), e.appendChild(n);
			});
		}
	}
	handleAutoOrder() {
		let e = this.presets[this.activePresetKey] || [];
		this.documents = xt(this.documents, e), this.activeDocIndex = 0, this.renderDocumentList(), this.renderActivePreview(), this.renderThumbnails(), r.show("Sequence Applied", `Ordered according to ${this.activePresetKey} criteria.`, "success");
	}
	async handleBrowseFolder() {
		r.show("Opening Folder Picker", "Navigating Windows Explorer...", "info");
		try {
			let e = await c();
			if (!e.success) {
				e.cancelled || r.show("Folder Select Error", e.error || "Failed to select folder", "error");
				return;
			}
			let t = e.files || [];
			if (t.length === 0) {
				r.show("No Files Found", "Selected directory contains 0 files.", "warning");
				return;
			}
			this.documents = t.map((e, t) => {
				let n = yt(e.name), r = bt(e.name);
				return {
					id: `print_doc_${Date.now()}_${t}`,
					name: e.name,
					path: e.path,
					docType: n || e.name,
					studentName: r || "Student",
					authority: "VERIFIED ISSUING AUTHORITY",
					docId: `DOC-${Date.now().toString().slice(-6)}`,
					date: "ACTIVE",
					pageNumber: 1,
					totalPages: 1,
					rotation: 0,
					status: "queued"
				};
			}), this.activeDocIndex = 0, this.renderDocumentList(), this.renderActivePreview(), this.renderThumbnails(), r.show("Documents Loaded", `${this.documents.length} files added to Print Studio.`, "success");
		} catch (e) {
			r.show("Folder Error", e.message, "error");
		}
	}
	handleClearQueue() {
		this.documents = [], this.activeDocIndex = 0, this.renderDocumentList(), this.renderActivePreview(), this.renderThumbnails(), r.show("Queue Reset", "Print queue cleared.", "info");
	}
	handlePrint() {
		this.documents.length === 0 ? r.show("Print Queue Empty", "Please load documents first.", "warning") : (r.show("Spooling Documents", `Sending ${this.documents.length} pages to Windows Print Spooler...`, "info"), setTimeout(() => {
			window.print();
		}, 500));
	}
	renderDocumentList() {
		let e = document.getElementById("documentList"), t = document.getElementById("queueCounterBadge");
		if (t && (t.textContent = `${this.documents.length} Documents`), e) {
			for (; e.firstChild;) e.removeChild(e.firstChild);
			this.documents.forEach((t, n) => {
				let i = n === this.activeDocIndex, a = document.createElement("div");
				a.className = `p-3 rounded-lg border flex items-center justify-between gap-2.5 transition-all cursor-pointer ${i ? "bg-surface-container-high border-primary ring-1 ring-primary/40 shadow-xs" : "bg-surface-container-lowest border-outline-variant/30 hover:bg-surface-container-low"}`, a.addEventListener("click", () => {
					this.activeDocIndex = n, this.renderDocumentList(), this.renderActivePreview(), this.renderThumbnails();
				});
				let o = document.createElement("div");
				o.className = "flex items-center gap-2.5 min-w-0 flex-1";
				let s = document.createElement("span");
				s.className = i ? "w-6 h-6 rounded bg-primary text-on-primary font-mono-code text-[11px] font-bold flex items-center justify-center shrink-0" : "w-6 h-6 rounded bg-surface-container text-secondary font-mono-code text-[11px] font-medium flex items-center justify-center shrink-0", s.textContent = String(n + 1), o.appendChild(s);
				let c = document.createElement("div");
				c.className = "flex flex-col min-w-0";
				let l = document.createElement("span");
				l.className = "font-label-md font-bold text-on-surface truncate", l.textContent = t.docType, c.appendChild(l);
				let u = document.createElement("span");
				u.className = "text-[10px] font-mono-code text-secondary truncate", u.textContent = t.name, c.appendChild(u), o.appendChild(c), a.appendChild(o);
				let d = document.createElement("div");
				d.className = "flex items-center gap-1 shrink-0";
				let f = document.createElement("button");
				f.type = "button", f.className = "p-1 text-secondary hover:text-primary rounded hover:bg-surface-container transition-colors cursor-pointer", f.title = "Rotate 90°";
				let p = document.createElement("span");
				p.className = "material-symbols-outlined text-[15px]", p.textContent = "rotate_right", f.appendChild(p), f.addEventListener("click", (e) => {
					e.stopPropagation(), t.rotation = (t.rotation + 90) % 360, this.renderActivePreview(), r.show("Rotated", `${t.docType} rotated 90°.`, "info");
				}), d.appendChild(f);
				let m = document.createElement("button");
				m.type = "button", m.className = "p-1 text-secondary hover:text-error rounded hover:bg-error-container/40 transition-colors cursor-pointer", m.title = "Remove";
				let h = document.createElement("span");
				h.className = "material-symbols-outlined text-[15px]", h.textContent = "close", m.appendChild(h), m.addEventListener("click", (e) => {
					e.stopPropagation(), this.documents.splice(n, 1), this.activeDocIndex >= this.documents.length && (this.activeDocIndex = Math.max(0, this.documents.length - 1)), this.renderDocumentList(), this.renderActivePreview(), this.renderThumbnails();
				}), d.appendChild(m), a.appendChild(d), e.appendChild(a);
			});
		}
	}
	renderActivePreview() {
		let e = this.documents[this.activeDocIndex], t = this.documents.length, n = document.getElementById("pageStepLabel"), r = document.getElementById("previewPageIndicator");
		if (n && (n.textContent = `PAGE ${this.activeDocIndex + 1} OF ${Math.max(1, t)}`), r && (r.textContent = `Page ${this.activeDocIndex + 1} of ${Math.max(1, t)}`), !e) return;
		let i = document.getElementById("sheetMainTitle"), a = document.getElementById("sheetSubTitle"), o = document.getElementById("docCodeDisplay"), s = document.getElementById("paramAuthority"), c = document.getElementById("paramDocId"), l = document.getElementById("paramIssueDate");
		i && (i.textContent = e.docType), a && (a.textContent = `${e.studentName} • ADMISSION DOSSIER`), o && (o.textContent = `DM-CERT-${String(this.activeDocIndex + 1).padStart(3, "0")}`), s && (s.textContent = e.authority || "GOVERNMENT OF MAHARASHTRA"), c && (c.textContent = e.docId || "DOC-VERIFIED-01"), l && (l.textContent = e.date || "ACTIVE");
		let u = document.getElementById("a4Sheet");
		u && (u.style.transform = `scale(${this.zoomLevel / 100}) rotate(${e.rotation || 0}deg)`);
	}
	renderThumbnails() {
		let e = document.getElementById("thumbStrip");
		if (e) {
			for (; e.firstChild;) e.removeChild(e.firstChild);
			this.documents.forEach((t, n) => {
				let r = n === this.activeDocIndex, i = document.createElement("button");
				i.type = "button", i.className = `thumb-btn flex flex-col items-center gap-1 p-1 rounded-lg transition-all shrink-0 cursor-pointer ${r ? "bg-primary-container text-on-primary ring-2 ring-primary shadow-xs" : "bg-surface-container-low hover:bg-surface-container text-on-surface"}`, i.addEventListener("click", () => {
					this.activeDocIndex = n, this.renderDocumentList(), this.renderActivePreview(), this.renderThumbnails();
				});
				let a = document.createElement("div");
				a.className = "w-10 h-14 bg-surface-container-lowest rounded border border-outline-variant/40 flex items-center justify-center";
				let o = document.createElement("span");
				o.className = "material-symbols-outlined text-[18px] text-primary", o.textContent = "description", a.appendChild(o), i.appendChild(a);
				let s = document.createElement("span");
				s.className = "font-mono-code text-[10px] font-bold", s.textContent = `p.${n + 1}`, i.appendChild(s), e.appendChild(i);
			});
		}
	}
};
function Ct() {
	let e = new St();
	return e.init(), e;
}
// src/ui/followup-ui.js
var wt = class {
	constructor() {
		this.items = [], this.searchQuery = "";
	}
	init() {
		this._seedDemoDataIfEmpty(), this.items = G(), this._bindControls(), this.renderTable(), console.info("[DocMitra Follow-up Desk] Follow-up UI manager initialized.");
	}
	_seedDemoDataIfEmpty() {
		if (G().length === 0) {
			let e = Y(), t = Ve(2);
			K([
				{
					id: "fu_demo_1",
					folderName: "Vijay_Ramesh_Yadav",
					studentName: "Vijay Ramesh Yadav",
					rollNo: "FYJC-2026-084",
					phone: "+91 98231 44510",
					documentName: "12TH LEAVING CERTIFICATE (LC)",
					promisedDate: "2026-11-18",
					folderPath: "E:\\College\\Admission_2026\\FYJC\\Vijay_Ramesh_Yadav",
					note: "Original LC submitted at junior college, requested 3 days grace period.",
					status: "pending",
					createdAt: Date.now() - 432e6
				},
				{
					id: "fu_demo_2",
					folderName: "Aarti_Suresh_Patil",
					studentName: "Aarti Suresh Patil",
					rollNo: "ENGG-2026-102",
					phone: "+91 98192 33419",
					documentName: "DOMICILE CERTIFICATE",
					promisedDate: e,
					folderPath: "E:\\College\\Admission_2026\\Degree\\Aarti_Suresh_Patil",
					note: "MahaOnline application token attached, awaiting digital signature.",
					status: "pending",
					createdAt: Date.now() - 1728e5
				},
				{
					id: "fu_demo_3",
					folderName: "Rahul_Shinde",
					studentName: "Rahul Tanaji Shinde",
					rollNo: "DSE-2026-045",
					phone: "+91 97654 22108",
					documentName: "CASTE VALIDITY CERTIFICATE",
					promisedDate: t,
					folderPath: "E:\\College\\Admission_2026\\DSE\\Rahul_Shinde",
					note: "Scrutiny committee hearing scheduled this week.",
					status: "pending",
					createdAt: Date.now() - 864e5
				},
				{
					id: "fu_demo_4",
					folderName: "Sneha_Anand_More",
					studentName: "Sneha Anand More",
					rollNo: "FYJC-2026-192",
					phone: "+91 94220 88192",
					documentName: "INCOME CERTIFICATE (TAHSILDAR)",
					promisedDate: t,
					folderPath: "E:\\College\\Admission_2026\\FYJC\\Sneha_Anand_More",
					note: "Tahsildar verification pending.",
					status: "pending",
					createdAt: Date.now()
				}
			]);
		}
	}
	_bindControls() {
		let e = document.getElementById("inputFollowupSearch");
		e && e.addEventListener("input", (e) => {
			this.searchQuery = (e.target.value || "").trim().toLowerCase(), this.renderTable();
		});
		let t = document.getElementById("btnOpenBatchDirFollowup");
		t && t.addEventListener("click", () => this.handleOpenBatchDirectory());
	}
	async handleOpenBatchDirectory() {
		r.show("Opening Folder Picker", "Navigating Windows Explorer...", "info");
		try {
			let e = await c();
			if (!e.success) {
				e.cancelled || r.show("Folder Select Error", e.error || "Failed to select folder", "error");
				return;
			}
			r.show("Batch Directory Loaded", e.path || "Directory opened", "success");
		} catch (e) {
			r.show("Folder Error", e.message, "error");
		}
	}
	renderTable() {
		let e = document.getElementById("followupTableBody");
		if (!e) return;
		for (; e.firstChild;) e.removeChild(e.firstChild);
		let t = this.items.filter((e) => {
			if (e.status === "resolved") return !1;
			if (!this.searchQuery) return !0;
			let t = this.searchQuery;
			return e.studentName?.toLowerCase().includes(t) || e.rollNo?.toLowerCase().includes(t) || e.phone?.includes(t) || e.documentName?.toLowerCase().includes(t) || e.folderName?.toLowerCase().includes(t);
		});
		if (t.length === 0) {
			let t = document.createElement("tr"), n = document.createElement("td");
			n.colSpan = 5, n.className = "py-8 text-center text-secondary", n.textContent = "No pending follow-up records found matching criteria.", t.appendChild(n), e.appendChild(t);
		} else t.forEach((t) => {
			let n = document.createElement("tr");
			n.className = "hover:bg-surface-container-low transition-colors";
			let i = document.createElement("td");
			i.className = "py-3.5 px-space-md";
			let a = document.createElement("div");
			a.className = "font-headline-sm text-headline-sm font-bold text-on-surface", a.textContent = t.studentName, i.appendChild(a);
			let o = document.createElement("div");
			o.className = "font-mono-code text-label-sm text-secondary font-medium", o.textContent = `${t.rollNo || "REG-2026"} • ${t.phone || "+91 98XXX XXXXX"}`, i.appendChild(o), n.appendChild(i);
			let s = document.createElement("td");
			s.className = "py-3.5 px-space-md";
			let c = document.createElement("span");
			c.className = "inline-flex items-center gap-1 px-2.5 py-1 rounded bg-error-container text-on-error-container font-label-sm text-label-sm font-bold";
			let l = document.createElement("span");
			l.className = "material-symbols-outlined text-[15px]", l.textContent = "error", c.appendChild(l);
			let u = document.createTextNode(` ${t.documentName}`);
			c.appendChild(u), s.appendChild(c), n.appendChild(s);
			let d = document.createElement("td");
			d.className = "py-3.5 px-space-md";
			let f = Be(t.promisedDate), p = document.createElement("div");
			p.className = f === "overdue" ? "font-mono-code font-bold text-error" : f === "today" ? "font-mono-code font-bold text-amber-700" : "font-mono-code font-bold text-emerald-700", p.textContent = J(t.promisedDate), d.appendChild(p);
			let m = document.createElement("span");
			f === "overdue" ? (m.className = "text-[10px] font-bold uppercase tracking-wider text-error bg-error-container/40 px-1.5 py-0.5 rounded", m.textContent = "OVERDUE") : f === "today" ? (m.className = "text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded", m.textContent = "DUE TODAY") : (m.className = "text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded", m.textContent = "UPCOMING"), d.appendChild(m), n.appendChild(d);
			let h = document.createElement("td");
			h.className = "py-3.5 px-space-md";
			let g = document.createElement("div");
			g.className = "flex items-center gap-1.5 text-secondary font-mono-code text-[11px]";
			let _ = document.createElement("span");
			_.className = "material-symbols-outlined text-[15px] text-primary shrink-0", _.textContent = "folder", g.appendChild(_);
			let v = document.createElement("span");
			v.className = "truncate max-w-[200px] text-on-surface font-semibold", v.textContent = t.folderPath || t.folderName, v.title = t.folderPath || t.folderName, g.appendChild(v);
			let y = document.createElement("button");
			y.type = "button", y.className = "ml-1 text-primary hover:text-primary-container inline-flex items-center cursor-pointer", y.title = "Open Folder";
			let b = document.createElement("span");
			b.className = "material-symbols-outlined text-[15px]", b.textContent = "open_in_new", y.appendChild(b), y.addEventListener("click", async () => {
				try {
					t.folderPath && (await fetch(`http://localhost:3000/api/open-folder?path=${encodeURIComponent(t.folderPath)}`), r.show("Folder Opened", t.folderPath, "info"));
				} catch {
					r.show("Open Folder", t.folderName, "info");
				}
			}), g.appendChild(y), h.appendChild(g), n.appendChild(h);
			let x = document.createElement("td");
			x.className = "py-3.5 px-space-md text-right";
			let S = document.createElement("div");
			S.className = "flex items-center justify-end gap-1.5";
			let C = document.createElement("button");
			C.type = "button", C.className = "h-8 px-space-sm rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-label-sm font-semibold flex items-center gap-1 shadow-xs cursor-pointer", C.title = "Send WhatsApp Notification";
			let w = document.createElement("span");
			w.className = "material-symbols-outlined text-[14px]", w.textContent = "chat", C.appendChild(w), C.appendChild(document.createTextNode("WhatsApp")), C.addEventListener("click", () => {
				this.sendWhatsApp(t);
			}), S.appendChild(C);
			let T = document.createElement("button");
			T.type = "button", T.className = "h-8 px-space-sm rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-sm font-semibold flex items-center gap-1 transition-colors cursor-pointer", T.title = "Copy Marathi Admission Notice";
			let E = document.createElement("span");
			E.className = "material-symbols-outlined text-[14px] text-secondary", E.textContent = "content_copy", T.appendChild(E), T.appendChild(document.createTextNode("Copy Notice")), T.addEventListener("click", () => {
				this.copyNoticeToClipboard(t);
			}), S.appendChild(T);
			let D = document.createElement("button");
			D.type = "button", D.className = "h-8 px-space-sm rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-on-primary font-label-sm font-semibold flex items-center gap-1 transition-colors cursor-pointer", D.title = "Mark Document Received";
			let O = document.createElement("span");
			O.className = "material-symbols-outlined text-[14px]", O.textContent = "check_circle", D.appendChild(O), D.appendChild(document.createTextNode("Received")), D.addEventListener("click", () => {
				this.markItemResolved(t);
			}), S.appendChild(D), x.appendChild(S), n.appendChild(x), e.appendChild(n);
		});
	}
	generateMarathiNotice(e) {
		let t = J(e.promisedDate);
		return `सस्नेह नमस्कार,
विद्यार्थी नाव: ${e.studentName} (${e.rollNo || "Admission 2026"})

आपल्या महाराष्ट्र शैक्षणिक प्रवेश प्रक्रियेसाठी खालील आवश्यक कागदपत्र अद्याप महाविद्यालयात प्रलंबित आहे:
📄 कागदपत्र: *${e.documentName}*
📅 अंतिम मुदत: *${t}*

कृपया सदर मूळ अथवा साक्षांकित प्रत दिलेल्या मुदतीपूर्वी प्रवेश विभागाकडे सादर करावी, जेणेकरून आपला प्रवेश अंतिम निश्चित होईल.

- प्रवेश विभाग (Admission Office)
(DocMitra Administrative Workstation)`;
	}
	copyNoticeToClipboard(e) {
		let t = this.generateMarathiNotice(e);
		navigator.clipboard.writeText(t), r.show("सूचना कॉपी झाली", `Notification for ${e.studentName} copied to clipboard.`, "success");
	}
	sendWhatsApp(e) {
		let t = this.generateMarathiNotice(e), n = (e.phone || "").replace(/[^0-9]/g, ""), i = n.length >= 10 ? `https://wa.me/${n}?text=${encodeURIComponent(t)}` : `https://wa.me/?text=${encodeURIComponent(t)}`;
		window.open(i, "_blank"), r.show("WhatsApp उघडत आहे", `Opening WhatsApp for ${e.studentName}...`, "info");
	}
	markItemResolved(e) {
		Re(e.folderName, e.documentName), e.status = "resolved", this.renderTable(), r.show("कागदपत्र प्राप्त!", `${e.documentName} for ${e.studentName} marked as received.`, "success");
	}
};
function Tt() {
	let e = new wt();
	return e.init(), e;
}
// src/ui/index.js
function Et() {
	let e = new n();
	e.init(), new i().init(), et();
	let t = Xe();
	typeof window < "u" && (window.renamerUI = t, window.location.search.includes("test_loaded=1") && setTimeout(() => {
		t.state.folder = {
			name: "Vijay_Ramesh_Yadav",
			path: "E:/Students/Vijay_Ramesh_Yadav"
		}, t.state.studentName = "Vijay Ramesh Yadav", t.state.files = [
			{
				name: "10th_marksheet.pdf",
				size: 184320,
				ext: ".pdf",
				status: "pending",
				targetName: "10TH MARKSHEET VIJAY RAMESH YADAV.pdf",
				isRenamed: !1,
				matchConfidence: 95
			},
			{
				name: "adhar_card.pdf",
				size: 215040,
				ext: ".pdf",
				status: "pending",
				targetName: "AADHAAR CARD VIJAY RAMESH YADAV.pdf",
				isRenamed: !1,
				matchConfidence: 90
			},
			{
				name: "photo_scan.jpg",
				size: 95400,
				ext: ".jpg",
				status: "pending",
				targetName: "PHOTO VIJAY RAMESH YADAV.jpg",
				isRenamed: !1,
				matchConfidence: 95
			}
		], t.state.currentIndex = 0, t.renderQueue();
	}, 200)), e.onViewChange = (e, n) => {
		n === "bulk-renamer" && e !== "bulk-renamer" && t.handleClearQueue(!0);
	}, ut(), gt(), Ct(), Tt(), a();
	let o = document.getElementById("themeToggleBtn");
	o && o.addEventListener("click", () => {
		document.documentElement.classList.toggle("dark");
		let e = document.documentElement.classList.contains("dark");
		r.show(e ? "Dark Theme Enabled" : "Light Theme Enabled", "UI Preference Updated", "info");
	}), console.info("[DocMitra] UI Shell & Modules initialized successfully.");
}
document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", Et) : Et();
export { Et as initAppShell };
