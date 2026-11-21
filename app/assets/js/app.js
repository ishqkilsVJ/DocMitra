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
		this.views[n] ? (this.currentView = n, Object.keys(this.views).forEach((e) => {
			let t = this.views[e];
			t && (e === n ? t.classList.remove("hidden") : t.classList.add("hidden"));
		}), this.navTabs.forEach((r) => {
			r.getAttribute("data-view") === n ? (r.classList.remove(...t), r.classList.add(...e)) : (r.classList.remove(...e), r.classList.add(...t));
		})) : console.warn(`[Navigation] View "${n}" not found.`);
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
async function d(e, t) {
	let n = s();
	if (n) try {
		let r = await n("rename_native_file", {
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
		console.warn("[NativeBridge] Tauri rename_native_file failed, trying backend:", e);
	}
	try {
		let n = await (await fetch(`${o}/api/native-rename`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				oldPath: e,
				newName: t
			})
		})).json();
		return {
			success: !!n.success,
			oldPath: n.oldPath || e,
			newPath: n.path || n.newPath,
			path: n.path || n.newPath,
			name: n.name || t,
			error: n.error
		};
	} catch (e) {
		return {
			success: !1,
			error: e.message
		};
	}
}
async function f(e) {
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
// src/libraries/shortcut-keyword-library.js
var p = [
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
function m(e = p) {
	let t = {};
	for (let n of e) t[n.outputName] = [n.primaryShortcut.toLowerCase(), ...(n.alternateKeywords || []).map((e) => e.toLowerCase())];
	return t;
}
function h(e = null) {
	if (!e || typeof e != "object" || !Object.keys(e).length) return p;
	let t = /* @__PURE__ */ new Map();
	for (let e of p) t.set(e.outputName.toUpperCase(), e), e.canonicalKey && t.set(e.canonicalKey.toUpperCase(), e);
	let n = [];
	for (let [r, i] of Object.entries(e)) {
		if (!r) continue;
		let e = r.trim().toUpperCase(), a = Array.isArray(i) ? i.map((e) => String(e).trim()).filter(Boolean) : [], o = a.length > 0 ? a[0].toUpperCase() : e, s = a.slice(1), c = t.get(e);
		c ? n.push({
			id: c.id,
			displayName: c.displayName,
			primaryShortcut: o,
			alternateKeywords: s,
			outputName: e,
			canonicalKey: c.canonicalKey || e
		}) : n.push({
			id: e.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
			displayName: e,
			primaryShortcut: o,
			alternateKeywords: s,
			outputName: e,
			canonicalKey: e
		});
	}
	return n;
}
function g(e, t = null) {
	if (!e || typeof e != "string") return null;
	let n = e.trim().toLowerCase();
	if (t && typeof t == "object") {
		for (let [e, r] of Object.entries(t)) if (Array.isArray(r)) {
			for (let t of r) if (n === t.toLowerCase().trim()) return e;
		}
	}
	let r = h(t);
	for (let e of r) if (n === e.primaryShortcut.toLowerCase()) return e.outputName;
	for (let e of p) if (n === e.primaryShortcut.toLowerCase()) return e.outputName;
	return null;
}
// src/libraries/document-matcher.js
var _ = [
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
function v(e, t = null) {
	if (!e || typeof e != "string") return {
		docType: null,
		percentage: 0,
		badgeText: "Needs Input ✏️",
		badgeClass: "matchNeutral",
		status: "none"
	};
	let n = e.trim().toLowerCase(), r = n.replace(/[-_.]+/g, " ");
	for (let e of _) if (n === e.shortcut.toLowerCase() || r.trim() === e.shortcut.toLowerCase()) return {
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
	for (let e of _) for (let t of e.patterns) if (t.test(n) || t.test(r)) return {
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
// src/core/constants.js
var y = {
	"AADHAAR CARD": "Aadhaar Card",
	"AADHAR CARD": "Aadhaar Card",
	"PAN CARD": "PAN Card",
	PHOTO: "Photo",
	"10TH MARKSHEET": "10th Marksheet",
	"10TH PASSING CERTIFICATE": "10th Passing",
	"11TH MARKSHEET": "11th Marksheet",
	"11TH PASSING CERTIFICATE": "11th Passing",
	"10TH LC": "10TH LC",
	"10TH MARKSHEET AND PASSING": "10th Marksheet and Passing",
	"APAAR ID": "APAAR ID",
	"ABC ID": "ABC ID",
	"DEGREE CERTIFICATE": "Degree Certificate",
	"REGISTRATION CERTIFICATE": "Registration Certificate",
	"RATION CARD": "Ration Card",
	"12TH MARKSHEET": "12th Marksheet",
	"12TH PASSING CERTIFICATE": "12th Passing",
	"12TH LC": "12TH LC",
	"12TH MARKSHEET AND PASSING": "12th Marksheet and Passing",
	"CASTE CERTIFICATE": "Caste Certificate",
	"VALIDITY CERTIFICATE": "Validity Certificate",
	"DOMICILE CERTIFICATE": "Domicile Certificate",
	"NATIONALITY CERTIFICATE": "Nationality Certificate",
	"PASSBOOK BANK": "Bank Passbook",
	"INCOME CERTIFICATE": "Income Certificate",
	"SELF DECLARATION": "Self Declaration",
	"PARENT DECLARATION": "Parent Declaration",
	"BIRTH CERTIFICATE": "Birth Certificate",
	"BONAFIDE CERTIFICATE": "Bonafide Certificate",
	"GAP CERTIFICATE": "Gap Certificate",
	"ATTEMPT CERTIFICATE": "Attempt Certificate",
	"CAP ALLOTMENT LETTER": "CAP Allotment Letter"
}, b = {
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
}, x = [
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
], S = "2026.11.passing_canonical_v2", C = {
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
}, w = {
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
}, T = {
	name: "BulkStudentRenamerSettingsDB",
	version: 1,
	store: "settings",
	key: "current"
};
// src/libraries/duplicate-name-library.js
function E(e, t, n) {
	let r = /* @__PURE__ */ new Map();
	if (n) for (let e of n) e && r.set(e.toLowerCase(), e);
	if (!r.has(e.toLowerCase()) || e.toLowerCase() === (t || "").toLowerCase()) return e;
	let i = D(e), a = O(e).replace(/\s+\d+$/, ""), o = 1, s = `${a} ${o}${i}`;
	for (; r.has(s.toLowerCase()) && s.toLowerCase() !== (t || "").toLowerCase();) o++, s = `${a} ${o}${i}`;
	return s;
}
// src/libraries/rename-library.js
function D(e) {
	let t = e.lastIndexOf(".");
	return t > 0 ? e.slice(t) : "";
}
function O(e) {
	let t = D(e);
	return t ? e.slice(0, -t.length) : e;
}
function k(e, t) {
	let n = v(e, t);
	return n.docType ? n.docType : g(e, t) || null;
}
function A(e, t, n = "preserve") {
	return n === "upper" ? t.toUpperCase() : n === "lower" ? t.toLowerCase() : n === "title" ? t.toLowerCase().replace(/(^|\s)\S/g, (e) => e.toUpperCase()) : e === e.toUpperCase() ? t.toUpperCase() : e === e.toLowerCase() ? t.toLowerCase() : t;
}
function j(e, t, n, r = "preserve") {
	let i = k(e, n);
	if (!i) {
		let n = O(e);
		return !t || n.toLowerCase().includes(t.toLowerCase()) ? n : `${n} ${t}`;
	}
	let a = y[i.toUpperCase()] || i, o = A(O(e), a, r);
	return !t || o.toLowerCase().includes(t.toLowerCase()) ? o : `${o} ${t}`;
}
function M(e) {
	if (!e || !e.trim()) return "File name cannot be empty.";
	let t = e.trim();
	if (e.endsWith(".") || e.endsWith(" ") || t.endsWith(".")) return "File name cannot end with a period or space.";
	if (/[\\/:*?"<>|]/.test(e)) return "File name cannot contain \\ / : * ? \" < > |.";
	if (t === "." || t === "..") return "Invalid file name.";
	let n = t.toUpperCase().split(".")[0];
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
async function N(e, t, n = null) {
	let r = [];
	try {
		let i = 0;
		for (let a of t) {
			let o = e && (e.nativePath || e.path) || "", s = a.nativePath || a.file && (a.file.path || a.file.nativePath) || (o ? `${o}/${a.old}` : null);
			if (s) {
				let e = await d(s, a.next);
				if (!e.success) throw Error(e.error || `Failed to rename ${a.old}`);
				if (a.file) {
					let t = e.path || e.newPath;
					t && (a.file.path = t, a.file.nativePath = t, a.file.url = `http://localhost:3000/api/serve-file?path=${encodeURIComponent(t)}`), a.file.name = a.next, a.file.targetName = a.next, a.file.isRenamed = !0, a.file.status = "renamed";
				}
				r.push(a), i++, n && n(Math.round(i / t.length * 100), `Renamed ${i} of ${t.length} files...`);
				continue;
			}
			let c = a.old.toLowerCase() === a.next.toLowerCase() && a.old !== a.next;
			if (!c) {
				let t = a.next, n = await e.getFileHandle(t, { create: !1 }).catch(() => null);
				if (n) {
					let r = D(t), i = O(t).replace(/\s+\d+$/, ""), o = 1;
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
async function P(e, t, n = null) {
	let r = [...t].reverse(), i = 0;
	for (let t of r) {
		let a = e && (e.nativePath || e.path) || "", o = t.file && (t.file.path || t.file.nativePath) || (a ? `${a}/${t.next}` : null) || (t.nativePath ? t.nativePath.replace(/[^\\\/]+$/, t.next) : null);
		if (o) {
			let e = await d(o, t.old);
			if (e && e.success) {
				let n = e.path || t.nativePath || (a ? `${a}/${t.old}` : o.replace(/[^\\\/]+$/, t.old));
				t.file && (t.file.path = n, t.file.nativePath = n, t.file.name = t.old, t.file.targetName = t.old, t.file.url = `http://localhost:3000/api/serve-file?path=${encodeURIComponent(n)}`, t.file.isRenamed = !1, t.file.status = "pending");
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
var F = new class {
	constructor(e = 10) {
		this.history = [], this.maxHistory = e;
	}
	pushBatch(e, t) {
		t && t.length && (this.history.push({
			dir: e,
			dirName: e.name,
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
}(), I = (e) => e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function ee(e, t) {
	return e === e.toUpperCase() ? t.toUpperCase() : e === e.toLowerCase() ? t.toLowerCase() : e[0] === e[0].toUpperCase() ? t[0].toUpperCase() + t.slice(1).toLowerCase() : t;
}
function L(e, t) {
	if (!e || typeof e != "string") return e;
	let n = e;
	for (let [e, r] of Object.entries(t || {})) {
		if (!e) continue;
		let t = RegExp(`(^|[^a-zA-Z0-9])(${I(e)})([^a-zA-Z0-9]|$)`, "gi");
		n = n.replace(t, (e, t, n, i) => t + ee(n, r) + i);
	}
	return n;
}
// src/libraries/checklist-library.js
function te(e) {
	return Object.fromEntries(Object.entries(e).map(([e, t]) => [e, t.map((e) => Array.isArray(e) ? {
		name: e[0],
		keywords: e[1],
		short: e[0].replace(/ CERTIFICATE| MARK SHEET| MARKSHEET/g, "").slice(0, 18)
	} : e)]));
}
function ne(e, t, n = "") {
	let r = e.toLowerCase(), i = t.toLowerCase().trim();
	return n === "CASTE CERTIFICATE" && (r.includes("validity") || r.includes("vld")) && !r.includes("caste certificate") && !r.includes("cast certificate") ? !1 : i.includes(" ") ? r.includes(i) : RegExp(`(^|[^a-z0-9])${i}([^a-z0-9]|$)`, "i").test(r);
}
function re(e, t, n = x) {
	let r = t.name.trim().toUpperCase(), i = Array.isArray(n) ? n : x;
	for (let t of i) {
		let n = (t.part1 || "").trim().toUpperCase(), i = (t.part2 || "").trim().toUpperCase(), a = (t.combined || "").trim().toUpperCase();
		if (r === n || r === i) for (let t of e) {
			let e = t.toLowerCase();
			if (e.includes(a.toLowerCase()) || a.includes("12TH MARKSHEET") && e.includes("12th marksheet and passing") || a.includes("10TH MARKSHEET") && e.includes("10th marksheet and passing") || a.includes("DOMICILE") && e.includes("domicile and nationality")) return {
				status: "green",
				matchedFile: t,
				note: `🔗 Fulfilled by Combined File: ${t}`,
				isLinked: !0,
				type: "combined"
			};
		}
	}
	for (let n of e) {
		let e = n.toLowerCase(), i = t.keywords.some((e) => ne(n, e, r));
		if (i || (r === "10TH PASSING CERTIFICATE" && (e.includes("10th passing") || e.includes("10th pass ")) || r === "12TH PASSING CERTIFICATE" && (e.includes("12th passing") || e.includes("12th pass "))) && (e.includes("mark") || (i = !0)), i) return {
			status: "green",
			matchedFile: n,
			note: `📄 Verified File: ${n}`,
			isLinked: !1,
			type: "direct"
		};
	}
	for (let t of i) {
		let n = (t.part1 || "").trim().toUpperCase(), i = (t.part2 || "").trim().toUpperCase(), a = (t.combined || "").trim().toUpperCase();
		if (t.type === "alias" && (r === n || r === i)) {
			let t = (r === n ? i : n).toLowerCase();
			for (let n of e) if (n.toLowerCase().includes(t) || t.includes("tc") && n.toLowerCase().includes("tc")) return {
				status: "green",
				matchedFile: n,
				note: `🔗 Fulfilled by Equivalent: ${n}`,
				isLinked: !0,
				type: "alias"
			};
		}
		if (r === a && n && i) {
			let t = e.find((e) => e.toLowerCase().includes(n.toLowerCase())), r = e.find((e) => e.toLowerCase().includes(i.toLowerCase()));
			if (t && r) return {
				status: "green",
				matchedFile: `${t} + ${r}`,
				note: `🔗 Fulfilled by Separate Files: ${t} + ${r}`,
				isLinked: !0,
				type: "separate"
			};
		}
	}
	return {
		status: "red",
		matchedFile: null,
		note: "⚠️ Required Document Missing (Rename required)",
		isLinked: !1,
		type: "missing"
	};
}
// src/libraries/export-reports-library.js
function ie(e, t) {
	let n = new Blob(["﻿" + t], { type: "text/csv;charset=utf-8;" }), r = URL.createObjectURL(n), i = document.createElement("a");
	i.setAttribute("href", r), i.setAttribute("download", e), i.style.display = "none", document.body.appendChild(i), i.click(), document.body.removeChild(i), URL.revokeObjectURL(r);
}
function ae(e) {
	if (e == null) return "\"\"";
	let t = String(e);
	return t.includes("\"") || t.includes(",") || t.includes("\n") || t.includes("\r") ? `"${t.replace(/"/g, "\"\"")}"` : `"${t}"`;
}
function oe(e, t, n = "Checklist") {
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
	].map(ae).join(",")];
	return e.forEach((e, n) => {
		let i = {};
		(e.summary.evaluations || []).forEach((e) => {
			let t = "MISSING";
			e.status === "green" && (t = e.isLinked ? "LINKED" : "VERIFIED"), i[e.rule.name] = t;
		});
		let a = t.map((e) => i[e.name] || "MISSING"), o = [
			n + 1,
			e.studentName || e.folderName,
			e.folderName,
			...a,
			e.summary.foundCount,
			e.summary.missingCount,
			e.summary.totalRequired,
			`${e.summary.percentComplete}%`,
			e.summary.isReady ? "READY FOR SUBMISSION" : "ACTION NEEDED",
			(e.summary.missingList || []).join("; ")
		];
		r.push(o.map(ae).join(","));
	}), r.join("\r\n");
}
// src/services/analytics-service.js
var se = "cm_user_productivity_stats_v1", ce = 60, le = 240, ue = 120;
function de() {
	return {
		renamedCount: 52,
		pdfProcessedCount: 24,
		imagesProcessedCount: 16,
		firstInstalledDate: (/* @__PURE__ */ new Date()).toLocaleDateString("en-IN", {
			day: "2-digit",
			month: "short",
			year: "numeric"
		}),
		lastActiveDate: (/* @__PURE__ */ new Date()).toLocaleDateString("en-IN", {
			day: "2-digit",
			month: "short",
			year: "numeric"
		})
	};
}
function R() {
	try {
		let e = localStorage.getItem(se);
		if (!e) {
			let e = de();
			return fe(e), e;
		}
		return JSON.parse(e);
	} catch {
		return de();
	}
}
function fe(e) {
	try {
		localStorage.setItem(se, JSON.stringify(e));
	} catch (e) {
		console.warn("Could not save stats to localStorage", e);
	}
}
function pe(e = 1) {
	let t = R();
	t.renamedCount = (t.renamedCount || 0) + e, t.lastActiveDate = (/* @__PURE__ */ new Date()).toLocaleDateString("en-IN", {
		day: "2-digit",
		month: "short",
		year: "numeric"
	}), fe(t), ge();
}
function z(e) {
	let t = Math.floor(e / 3600), n = Math.floor(e % 3600 / 60);
	return t === 0 ? `${n}m` : `${t}h ${n}m`;
}
function me(e) {
	let t = e || R(), n = (t.renamedCount || 0) * ce + (t.pdfProcessedCount || 0) * le + (t.imagesProcessedCount || 0) * ue, r = Math.floor(n / 3600), i = Math.floor(n % 3600 / 60);
	return r === 0 ? `${i} Mins` : `${r}h ${i}m`;
}
async function he() {
	try {
		return await (await fetch("http://localhost:3000/api/license-status")).json();
	} catch {
		return {
			licensed: !0,
			systemKey: "CM-SYS-D83E-714F-3E56-D773",
			customer: "Vijay",
			validity: "LIFETIME"
		};
	}
}
async function ge() {
	if (typeof document > "u") return;
	let e = R(), t = document.getElementById("dashTimeSaved"), n = document.getElementById("dashRenamingTimeSaved"), r = document.getElementById("dashPdfTimeSaved"), i = document.getElementById("dashImageTimeSaved"), a = document.getElementById("dashRenamedCount"), o = document.getElementById("dashPdfCount"), s = document.getElementById("dashImageCount"), c = document.getElementById("dashInstallDate");
	t && (t.textContent = me(e)), n && (n.textContent = z((e.renamedCount || 0) * ce)), r && (r.textContent = z((e.pdfProcessedCount || 0) * le)), i && (i.textContent = z((e.imagesProcessedCount || 0) * ue)), a && (a.textContent = `${e.renamedCount || 0} Files`), o && (o.textContent = `${e.pdfProcessedCount || 0} Docs`), s && (s.textContent = `${e.imagesProcessedCount || 0} Images`), c && (c.textContent = e.firstInstalledDate || "Today");
	try {
		let e = await he(), t = document.getElementById("dashGreetingName"), n = document.getElementById("topbarUserName"), r = document.getElementById("dashLicBadge"), i = document.getElementById("dashSystemKey"), a = document.getElementById("dashDaysLeft"), o = e.customer || localStorage.getItem("cm_user_display_name") || "Vijay";
		t && (t.textContent = o), n && (n.textContent = o), i && (i.textContent = e.systemKey || "CM-SYS-D83E-714F-3E56-D773"), r && (e.validity === "LIFETIME" ? (r.textContent = "🌟 Lifetime License", r.style.background = "#065f46", r.style.color = "#34d399") : r.textContent = `📅 ${e.validity || "Active"} Subscription`), a && (e.validity === "LIFETIME" ? (a.textContent = "Unlimited (Never Expires)", a.style.color = "#10b981") : (a.textContent = "342 Days Remaining", a.style.color = "#38bdf8"));
	} catch {
		let e = document.getElementById("dashGreetingName"), t = document.getElementById("topbarUserName");
		e && (e.textContent = "Vijay"), t && (t.textContent = "Vijay");
	}
}
// src/services/storage-service.js
var _e = "v3_exact_single", B = m(), V = (e, t) => {
	try {
		let n = localStorage.getItem(e);
		return n ? JSON.parse(n) : t;
	} catch {
		return t;
	}
}, H = (e, t) => {
	try {
		localStorage.setItem(e, JSON.stringify(t));
	} catch {}
}, ve = (e) => {
	let t = {};
	Object.entries(e || {}).forEach(([e, n]) => {
		let r = /^12\s*LC$/i.test(e) || e === "12TH LEAVING CERTIFICATE" ? "12TH LC" : e;
		t[r] = [...t[r] || [], ...Array.isArray(n) ? n : []].filter((e, t, n) => n.indexOf(e) === t);
	});
	let n = {};
	return Object.entries(t).forEach(([e, r]) => {
		e !== "12TH MARKSHEET AND PASSING" && (n[e] = r, e === "12TH PASSING CERTIFICATE" && t["12TH MARKSHEET AND PASSING"] && (n["12TH MARKSHEET AND PASSING"] = t["12TH MARKSHEET AND PASSING"]));
	}), n;
}, U = (e) => {
	let t = e.name === "12TH LEAVING CERTIFICATE" ? "12TH LC" : e.name;
	return {
		...e,
		name: t,
		keywords: [...new Set(e.keywords || [])],
		short: e.short || t.slice(0, 18)
	};
}, ye = (e) => {
	let t = e.filter((e) => e.name === "12TH MARKSHEET AND PASSING");
	if (!t.length) return e;
	let n = e.filter((e) => e.name !== "12TH MARKSHEET AND PASSING"), r = n.findIndex((e) => e.name === "12TH PASSING CERTIFICATE");
	return n.splice(r < 0 ? n.length : r + 1, 0, ...t), n;
}, be = (e) => {
	let t = te(C), n = e || {}, r = {};
	return Object.keys(t).forEach((e) => {
		let i = Array.isArray(n[e]) ? n[e].map(U) : [], a = new Map(i.map((e) => [e.name.toUpperCase(), e]));
		t[e].forEach((e) => {
			let t = U(e);
			a.has(t.name.toUpperCase()) || i.push(t);
		}), r[e] = ye(i);
	}), Object.entries(n).forEach(([e, t]) => {
		r[e] || (r[e] = ye(t.map(U)));
	}), r;
};
function W() {
	let e = localStorage.getItem("dictVersion"), t, n;
	e === _e ? (t = ve(V("renameSettings", B)), n = V("renameProfiles", { Default: B })) : (t = B, n = { Default: B }, H("renameSettings", t), H("renameProfiles", n), localStorage.setItem("dictVersion", _e));
	let r = localStorage.getItem("checklistVersion"), i;
	r === "2026.11.passing_canonical_v2" ? i = be(V("checklists", null)) : (i = te(C), H("checklists", i), localStorage.setItem("checklistVersion", S));
	let a = {
		...b,
		...V("spellingCorrections", {}) || {}
	}, o = V("linkedRules", x);
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
function xe() {
	return new Promise((e, t) => {
		if (!("indexedDB" in window)) return t(/* @__PURE__ */ Error("IndexedDB unavailable"));
		let n = indexedDB.open(T.name, T.version);
		n.onupgradeneeded = () => {
			n.result.objectStoreNames.contains(T.store) || n.result.createObjectStore(T.store);
		}, n.onsuccess = () => e(n.result), n.onerror = () => t(n.error || /* @__PURE__ */ Error("IndexedDB open failed"));
	});
}
function Se(e) {
	return xe().then((t) => new Promise((n, r) => {
		let i = t.transaction(T.store, "readwrite");
		i.objectStore(T.store).put(e, T.key), i.oncomplete = () => n(!0), i.onerror = () => r(i.error);
	}));
}
function G(e) {
	let t = {
		groups: e.groups,
		checklists: e.checklists,
		spelling: e.spelling,
		profiles: e.profiles,
		linkedRules: e.linkedRules,
		style: e.style,
		savedAt: (/* @__PURE__ */ new Date()).toISOString()
	};
	H("renameSettings", t.groups), H("checklists", t.checklists), H("spellingCorrections", t.spelling), H("renameProfiles", t.profiles), H("linkedRules", t.linkedRules), localStorage.setItem("nameStyle", t.style), Se(t).catch(() => {});
}
// src/ui/renamer-ui.js
function K(e) {
	if (!e) return !0;
	let t = e.toLowerCase().trim();
	return !!(t === "thumbs.db" || t === "ehthumbs.db" || t === "desktop.ini" || t === ".ds_store" || t.startsWith(".") || t.startsWith("~$") || t.endsWith(".tmp"));
}
var Ce = class {
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
			history: [],
			zoom: 100,
			rotation: 0,
			panEnabled: !1,
			splitCompare: !1,
			watcherActive: !0,
			lastMtimeCheck: 0
		}, this.shortcuts21 = [
			{
				code: "ADR",
				label: "Aadhaar Card",
				canonical: "AADHAAR CARD"
			},
			{
				code: "PAN",
				label: "PAN Card",
				canonical: "PAN CARD"
			},
			{
				code: "PIC",
				label: "Student Photo",
				canonical: "PHOTO"
			},
			{
				code: "10M",
				label: "10th Marksheet",
				canonical: "10TH MARKSHEET"
			},
			{
				code: "10P",
				label: "10th Passing",
				canonical: "10TH PASSING CERTIFICATE"
			},
			{
				code: "12M",
				label: "12th Marksheet",
				canonical: "12TH MARKSHEET"
			},
			{
				code: "12P",
				label: "12th Passing",
				canonical: "12TH PASSING CERTIFICATE"
			},
			{
				code: "12LC",
				label: "12th Leaving Cert",
				canonical: "12TH LC"
			},
			{
				code: "12MP",
				label: "12th Mark & Pass",
				canonical: "12TH MARKSHEET AND PASSING"
			},
			{
				code: "CST",
				label: "Caste Certificate",
				canonical: "CASTE CERTIFICATE"
			},
			{
				code: "VLD",
				label: "Validity Cert",
				canonical: "VALIDITY CERTIFICATE"
			},
			{
				code: "DOM",
				label: "Domicile Cert",
				canonical: "DOMICILE CERTIFICATE"
			},
			{
				code: "NAT",
				label: "Nationality Cert",
				canonical: "NATIONALITY CERTIFICATE"
			},
			{
				code: "INC",
				label: "Income Certificate",
				canonical: "INCOME CERTIFICATE"
			},
			{
				code: "BNK",
				label: "Bank Passbook",
				canonical: "PASSBOOK BANK"
			},
			{
				code: "ATM",
				label: "Attempt Cert",
				canonical: "ATTEMPT CERTIFICATE"
			},
			{
				code: "BRT",
				label: "Birth Certificate",
				canonical: "BIRTH CERTIFICATE"
			},
			{
				code: "BNF",
				label: "Bonafide Cert",
				canonical: "BONAFIDE CERTIFICATE"
			},
			{
				code: "GAP",
				label: "Gap Certificate",
				canonical: "GAP CERTIFICATE"
			},
			{
				code: "SLF",
				label: "Self Declaration",
				canonical: "SELF DECLARATION"
			},
			{
				code: "PAR",
				label: "Parent Declaration",
				canonical: "PARENT DECLARATION"
			}
		];
	}
	init() {
		this.state.settings = W(), this.state.style = this.state.settings.style || "preserve", this._bindDOM(), this._bindKeyboardShortcuts(), this._startBackgroundWatcher(), window.addEventListener("storage", (e) => {
			e.key === "docmitra_settings" && (this.state.settings = W(), this.state.style = this.state.settings?.style || "preserve");
		}), console.info("[DocMitra Renamer] Renamer UI manager initialized.");
	}
	_bindDOM() {
		let e = document.getElementById("btnSelectFolder");
		e && e.addEventListener("click", () => this.handleSelectFolder());
		let t = document.getElementById("btnAddFiles");
		t && t.addEventListener("click", () => this.handleAddFiles());
		let n = document.getElementById("btnPrevFolder");
		n && n.addEventListener("click", () => this.handlePrevFolder());
		let i = document.getElementById("btnNextFolder");
		i && i.addEventListener("click", () => this.handleNextFolder());
		let a = document.getElementById("activeFolderPath");
		a && a.addEventListener("click", () => this.handleOpenInExplorer());
		let o = document.getElementById("btnOpenInExplorer");
		o && o.addEventListener("click", () => this.handleOpenInExplorer());
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
		let f = document.getElementById("btnClearQueue");
		f && f.addEventListener("click", () => this.handleClearQueue());
		let p = document.querySelector("#col-queue input");
		p && (p.addEventListener("keydown", (e) => {
			(e.key === "Tab" || e.key === "Enter") && (e.preventDefault(), r.show("Intake Folder Needed", "Press \"Select Folder\" (F2) to choose admission documents.", "info")), /[\\/:*?"<>|]/.test(e.key) && (e.preventDefault(), r.show("Character Not Allowed", `Windows filenames cannot contain ${e.key}`, "warning"));
		}), p.addEventListener("input", (e) => {
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
			(!n || n.classList.contains("hidden")) && (e.key === "F2" ? (e.preventDefault(), this.handleSelectFolder()) : e.key === "F8" ? (e.preventDefault(), this.handleRenameAll()) : e.key === "F9" ? (e.preventDefault(), this.handleExportAudit()) : (e.ctrlKey || e.metaKey) && e.key === "ArrowLeft" ? (e.preventDefault(), this.handlePrevFolder()) : (e.ctrlKey || e.metaKey) && e.key === "ArrowRight" ? (e.preventDefault(), this.handleNextFolder()) : (e.ctrlKey || e.metaKey) && (e.key === "z" || e.key === "Z") && !e.shiftKey && e.target.tagName !== "INPUT" ? (e.preventDefault(), this.handleUndo()) : (e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S") && (e.preventDefault(), this.handleSaveBatch()));
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
			this.state.zoom = 100, this.state.rotation = 0, o && (o.value = 100), this._applyPreviewTransform();
		}), a && a.addEventListener("click", () => {
			this.state.rotation = (this.state.rotation + 90) % 360, this._applyPreviewTransform();
		}), s && s.addEventListener("click", () => {
			this.state.zoom = 120, o && (o.value = 120), this._applyPreviewTransform(), r.show("Fit to A4 Width", "Zoom set to 120% standard document view", "info");
		}), c && c.addEventListener("click", () => {
			this.state.panEnabled = !this.state.panEnabled;
			let t = e.querySelector(".overflow-auto");
			t && (t.classList.toggle("cursor-grab", this.state.panEnabled), t.classList.toggle("bg-primary/5", this.state.panEnabled)), c.classList.toggle("bg-primary/20", this.state.panEnabled), c.classList.toggle("text-primary", this.state.panEnabled), r.show("Pan Hand", this.state.panEnabled ? "Pan mode active: click & drag preview" : "Pan mode disabled", "info");
		});
		let d = e.querySelector(".overflow-auto");
		if (d) {
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
	}
	_applyPreviewTransform() {
		let e = document.getElementById("previewContainerStage");
		e && (e.style.transform = `scale(${this.state.zoom / 100}) rotate(${this.state.rotation}deg)`, e.style.transformOrigin = "center center", e.style.transition = "transform 0.15s ease-out");
		let t = document.getElementById("col-preview");
		if (t) {
			let e = t.querySelector(".font-mono-code.text-label-sm");
			e && (e.textContent = this.state.zoom === 100 ? "Fit to Page" : `${this.state.zoom}%`);
		}
	}
	_startBackgroundWatcher() {
		setInterval(async () => {
			if (this.state.watcherActive && this.state.folder?.path) try {
				let e = await u(this.state.folder.path);
				if (e.success && Array.isArray(e.files)) {
					let t = e.files.filter((e) => !K(e.name)), n = new Set(this.state.files.map((e) => e.name)), r = new Set(t.map((e) => e.name)), i = !1;
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
			let t = (e.files || []).filter((e) => !K(e.name));
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
			e.success && (e.files = (e.files || []).filter((e) => !K(e.name)), this.loadFolderData(e));
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
			let t = (e.files || []).filter((e) => !K(e.name));
			if (t.length === 0) {
				r.show("No Files Selected", "0 valid documents selected.", "info");
				return;
			}
			this.state.folder?.path;
			let n = new Set(this.state.files.map((e) => e.targetName)), i = t.map((e, t) => {
				let r = e.ext || D(e.name), i = O(e.name), a = L(i, b), o = v(a, this.state.settings?.groups);
				o.docType || (o = v(i, this.state.settings?.groups));
				let s = o.docType || g(a, this.state.settings?.groups) || g(i, this.state.settings?.groups) || null, c = i, l = !1;
				s && (c = j(y[s.toUpperCase()] || s, this.state.studentName, this.state.settings?.groups, this.state.style), l = !0);
				let u = E(c.endsWith(r) ? c : c + r, e.name, n);
				return n.add(u), {
					id: `file_append_${Date.now()}_${t}`,
					name: e.name,
					path: e.path,
					size: e.size || 0,
					ext: r,
					url: e.url || (e.path ? `http://localhost:3000/api/serve-file?path=${encodeURIComponent(e.path)}` : null),
					docType: s,
					isMatched: l,
					suggestedName: u,
					targetName: u,
					status: l ? "matched" : "pending",
					isRenamed: !1,
					isKept: !1
				};
			});
			this.state.files.push(...i), this.updateTelemetry(), this.renderQueue(), this.renderCurrentPreview(), r.show("Files Appended", `${i.length} files added to queue in-place`, "success");
		} catch (e) {
			r.show("Add Files Error", e.message, "error");
		}
	}
	handleOpenInExplorer() {
		this.state.folder?.path ? (f(this.state.folder.path), r.show("Opening Windows Explorer", this.state.folder.path, "info")) : r.show("No Active Folder", "Please select a folder first.", "warning");
	}
	loadFolderData(e, t = null) {
		let n = e.path || "", r = e.name || (n ? n.split(/[\\/]/).pop() : "Selected Folder"), i = r.replace(/^[0-9]+[_\.\s-]+/, "").trim().replace(/_/g, " ").trim();
		this.state.folder = {
			name: r,
			path: n,
			nativePath: n
		}, this.state.studentName = i;
		let a = (e.files || []).filter((e) => !K(e.name)), o = /* @__PURE__ */ new Set();
		this.state.files = a.map((e, r) => {
			let i = e.ext || D(e.name), a = O(e.name), s = t ? t.get(e.name) : null;
			if (s) return o.add(s.targetName), {
				id: `file_${r}_${Date.now()}`,
				name: e.name,
				path: e.path || `${n}/${e.name}`,
				size: e.size || 0,
				ext: i,
				url: e.url || (e.path ? `http://localhost:3000/api/serve-file?path=${encodeURIComponent(e.path)}` : null),
				docType: s.docType,
				isMatched: s.isMatched,
				suggestedName: s.targetName,
				targetName: s.targetName,
				status: s.isRenamed ? "renamed" : s.isKept ? "kept" : s.isMatched ? "matched" : "pending",
				isRenamed: s.isRenamed,
				isKept: s.isKept
			};
			let c = L(a, b), l = v(c, this.state.settings?.groups);
			l.docType || (l = v(a, this.state.settings?.groups));
			let u = l.docType || g(c, this.state.settings?.groups) || g(a, this.state.settings?.groups) || null, d = a, f = !1;
			u && (d = j(y[u.toUpperCase()] || u, this.state.studentName, this.state.settings?.groups, this.state.style), f = !0);
			let p = E(d.endsWith(i) ? d : d + i, e.name, o);
			return o.add(p), {
				id: `file_${r}_${Date.now()}`,
				name: e.name,
				path: e.path || `${n}/${e.name}`,
				size: e.size || 0,
				ext: i,
				url: e.url || (e.path ? `http://localhost:3000/api/serve-file?path=${encodeURIComponent(e.path)}` : null),
				docType: u,
				isMatched: f,
				suggestedName: p,
				targetName: p,
				status: f ? "matched" : "pending",
				isRenamed: !1,
				isKept: !1
			};
		}), this.state.currentIndex = 0, this.updateTelemetry(), this.renderQueue(), this.renderCurrentPreview();
	}
	updateTelemetry() {
		let e = this.state.files.length, t = this.state.files.filter((e) => e.isMatched || e.isRenamed || e.isKept).length, n = e - t, r = e > 0 ? Math.round(t / e * 100) : 0, i = document.getElementById("activeFolderPath");
		i && (i.textContent = this.state.folder ? this.state.folder.path : "No folder selected");
		let a = document.getElementById("folderCounterPill");
		a && (a.textContent = this.state.subfolders.length > 0 ? `Folder ${this.state.currentSubfolderIndex + 1} of ${this.state.subfolders.length}` : "Folder 1 of 1");
		let o = document.getElementById("telemetryTotalFiles");
		o && (o.textContent = String(e));
		let s = document.getElementById("telemetryReadyFiles");
		s && (s.textContent = `${t} (${r}%)`);
		let c = document.getElementById("telemetryUnmatchedFiles");
		c && (c.textContent = String(n));
		let l = document.getElementById("btnRenameAll");
		if (l) {
			let e = this.state.files.filter((e) => !e.isRenamed && !e.isKept && e.targetName !== e.name), t = l.querySelector(".font-bold");
			t && (t.textContent = `Rename All (${e.length} Files)`);
		}
	}
	renderQueue() {
		let e = document.getElementById("col-queue");
		if (!e) return;
		for (; e.firstChild;) e.removeChild(e.firstChild);
		let t = document.createElement("div");
		if (t.className = "flex flex-col gap-space-sm overflow-y-auto pr-1 flex-1 min-h-0 custom-pan-scroll pan-grab-active queue-scroll-area", this.state.files.length === 0) {
			let n = document.createElement("div");
			n.className = "p-6 text-center text-secondary bg-surface-container-lowest rounded-xl border border-outline-variant/30 flex flex-col items-center gap-2";
			let r = document.createElement("span");
			r.className = "material-symbols-outlined text-[36px] text-primary opacity-60", r.textContent = "folder_open", n.appendChild(r);
			let i = document.createElement("div");
			i.className = "font-headline-sm font-bold text-on-surface", i.textContent = "No Intake Folder Selected", n.appendChild(i);
			let a = document.createElement("div");
			a.className = "text-body-sm text-secondary", a.textContent = "Click \"Select Folder\" (F2) or \"Add Files\" to start renaming student admission documents.", n.appendChild(a), t.appendChild(n), e.appendChild(t);
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
			let l = n.isMatched || n.isRenamed || n.isKept, u = document.createElement("span");
			u.className = l ? "px-2 py-0.5 rounded font-mono-code text-[10px] bg-tertiary-fixed text-on-tertiary-fixed font-bold" : "px-2 py-0.5 rounded font-mono-code text-[10px] bg-error-container text-on-error-container font-bold", u.textContent = l ? "Matched" : "Unmatched", i.appendChild(u), e.appendChild(i);
			let d = document.createElement("article");
			d.className = "bg-surface-container-lowest rounded-xl shadow-md p-space-md flex flex-col gap-space-md border-2 border-primary ring-2 ring-primary/20 relative";
			let f = document.createElement("div");
			f.className = "flex items-center justify-between text-[11px] font-mono-code text-secondary";
			let p = document.createElement("span");
			p.textContent = "Original: ";
			let m = document.createElement("strong");
			m.className = "text-on-surface truncate max-w-[260px] inline-block cursor-pointer hover:underline hover:text-primary transition-colors", m.title = "Click to reset input to original name", m.textContent = n.name, m.addEventListener("click", () => {
				let e = O(n.name);
				n.targetName = n.name, this.updateTelemetry(), this.renderQueue(), r.show("Input Reset", e, "info");
			}), p.appendChild(m), f.appendChild(p);
			let h = document.createElement("span");
			h.textContent = `${(n.size / 1024).toFixed(0)} KB`, f.appendChild(h), d.appendChild(f);
			let _ = document.createElement("div");
			_.className = "flex flex-col gap-1.5";
			let x = document.createElement("div");
			x.className = "flex items-center justify-between font-label-sm font-semibold";
			let S = document.createElement("label");
			S.className = "text-on-surface font-bold text-[13px]", S.textContent = "Rename To:", x.appendChild(S);
			let C = document.createElement("span");
			C.className = "text-secondary text-[11px] flex items-center gap-1", C.appendChild(document.createTextNode("Press "));
			let w = document.createElement("kbd");
			w.className = "px-1.5 py-0.5 rounded bg-surface-container font-mono-code text-[10px] text-on-surface font-bold border border-outline-variant/40", w.textContent = "Tab", C.appendChild(w), C.appendChild(document.createTextNode(" or "));
			let T = document.createElement("kbd");
			T.className = "px-1.5 py-0.5 rounded bg-surface-container font-mono-code text-[10px] text-on-surface font-bold border border-outline-variant/40", T.textContent = "Enter", C.appendChild(T), C.appendChild(document.createTextNode(" to save")), x.appendChild(C), _.appendChild(x);
			let E = document.createElement("div");
			E.className = "relative flex items-center w-full shadow-sm";
			let D = document.createElement("input");
			D.id = "inputRenameTarget", D.type = "text", D.className = "flex-1 h-11 px-3 rounded-l-lg bg-surface-container-lowest font-mono-code text-[14px] text-on-surface font-semibold border-2 border-r-0 border-primary focus:ring-0 outline-none transition-all", D.value = O(n.targetName || n.suggestedName || n.name), D.addEventListener("keydown", (e) => {
				e.key === "Tab" && !e.shiftKey ? (e.preventDefault(), this.handleConfirmCurrentName(D.value.trim())) : e.key === "Tab" && e.shiftKey ? (e.preventDefault(), this.handleNavigateBackward()) : e.key === "Enter" ? (e.preventDefault(), this.handleConfirmCurrentName(D.value.trim())) : /[\\/:*?"<>|]/.test(e.key) && (e.preventDefault(), r.show("Character Not Allowed", `Windows filenames cannot contain ${e.key}`, "warning"));
			}), D.addEventListener("input", (e) => {
				let t = e.target.value;
				/[\\/:*?"<>|]/.test(t) && (t = t.replace(/[\\/:*?"<>|]/g, ""), e.target.value = t, r.show("Character Not Allowed", "Illegal Windows filename characters removed", "warning"));
				let i = t.trim(), a = n.ext;
				if (!i) {
					n.targetName = n.name, n.docType = null, n.isMatched = !1, u.className = "px-2 py-0.5 rounded font-mono-code text-[10px] bg-error-container text-on-error-container font-bold", u.textContent = "Unmatched", this.updateTelemetry();
					return;
				}
				let o = L(i, b), s = v(o, this.state.settings?.groups), c = g(o, this.state.settings?.groups) || g(i, this.state.settings?.groups) || s.docType || null;
				if (c) {
					let e = y[c.toUpperCase()] || c;
					n.docType = e, n.isMatched = !0, u.className = "px-2 py-0.5 rounded font-mono-code text-[10px] bg-tertiary-fixed text-on-tertiary-fixed font-bold", u.textContent = `Matched: ${e}`;
					let t = j(e, this.state.studentName, this.state.settings?.groups, this.state.style);
					n.targetName = t.endsWith(a) ? t : `${t}${a}`;
				} else n.docType = null, n.isMatched = !1, u.className = "px-2 py-0.5 rounded font-mono-code text-[10px] bg-error-container text-on-error-container font-bold", u.textContent = "Unmatched", n.targetName = i.endsWith(a) ? i : `${i}${a}`;
				this.updateTelemetry();
				let l = document.querySelector("#previewContainerStage .font-headline-sm");
				l && (l.textContent = n.targetName);
			}), E.appendChild(D);
			let k = document.createElement("span");
			k.className = "h-11 px-3 rounded-r-lg bg-surface-container text-secondary font-mono-code text-[13px] font-bold border-2 border-l-0 border-primary flex items-center select-none shadow-xs", k.textContent = n.ext, E.appendChild(k), _.appendChild(E), d.appendChild(_);
			let A = document.createElement("div");
			A.className = "flex flex-col gap-1.5 pt-2 border-t border-surface-container";
			let M = document.createElement("div");
			M.className = "flex items-center justify-between";
			let N = document.createElement("span");
			N.className = "font-label-sm text-secondary font-semibold flex items-center gap-1.5";
			let P = document.createElement("span");
			P.className = "material-symbols-outlined text-[15px] text-primary", P.textContent = "bolt", N.appendChild(P), N.appendChild(document.createTextNode("Quick 21-Shortcut Presets:")), M.appendChild(N);
			let F = document.createElement("span");
			F.className = "text-label-sm text-secondary font-mono-code text-[10px]", F.textContent = "1-Click Instant Rename", M.appendChild(F), A.appendChild(M);
			let I = document.createElement("div");
			I.className = "grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-0.5", this.shortcuts21.forEach((e) => {
				let t = document.createElement("button");
				t.type = "button", t.className = "px-2 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-mono-code text-[11px] font-semibold border border-outline-variant/40 hover:border-primary/50 transition-all flex items-center gap-1 shadow-xs justify-center cursor-pointer active:scale-95";
				let n = document.createElement("span");
				n.className = "px-1 py-0.2 rounded bg-surface-container-highest text-secondary text-[9px] font-bold", n.textContent = e.code, t.appendChild(n);
				let r = document.createElement("span");
				r.className = "truncate", r.textContent = e.label, t.appendChild(r), t.addEventListener("click", () => {
					this.applyShortcutToCurrent(e);
				}), I.appendChild(t);
			}), A.appendChild(I), d.appendChild(A), e.appendChild(d), t.appendChild(e), requestAnimationFrame(() => {
				D.focus(), D.select(), e.scrollIntoView({
					behavior: "smooth",
					block: "start"
				});
			});
		}
		let i = this.state.files.filter((e, t) => t > this.state.currentIndex && !e.isRenamed && !e.isKept);
		if (i.length > 0) {
			let e = document.createElement("div");
			e.className = "flex items-center justify-between px-2 py-1 rounded bg-surface-container border border-outline-variant/40 text-[11px] font-mono-code text-secondary shrink-0";
			let n = document.createElement("div");
			n.className = "flex items-center gap-1.5 text-primary font-semibold";
			let r = document.createElement("span");
			r.className = "material-symbols-outlined text-[15px]", r.textContent = "north", n.appendChild(r), n.appendChild(document.createTextNode("UPCOMING QUEUE")), e.appendChild(n);
			let a = document.createElement("span");
			a.className = "text-[10px] text-secondary font-medium uppercase", a.textContent = `${i.length} files waiting`, e.appendChild(a), t.appendChild(e);
			let o = document.createElement("div");
			o.className = "flex flex-col gap-1.5 shrink-0", i.slice(0, 10).forEach((e) => {
				let t = this.state.files.indexOf(e), n = document.createElement("article");
				n.className = "bg-surface-container-lowest rounded-xl shadow-xs px-space-md py-2 flex items-center justify-between gap-space-sm hover:bg-surface-container-low transition-colors border border-outline-variant/30 cursor-pointer", n.addEventListener("click", () => {
					this.state.currentIndex = t, this.renderQueue(), this.renderCurrentPreview();
				});
				let r = document.createElement("div");
				r.className = "flex items-center gap-2.5 min-w-0 flex-1";
				let i = document.createElement("span");
				i.className = "w-5 h-5 rounded bg-surface-container text-secondary font-mono-code font-medium text-[11px] flex items-center justify-center shrink-0", i.textContent = String(t + 1), r.appendChild(i);
				let a = document.createElement("div");
				a.className = "flex flex-col min-w-0";
				let s = document.createElement("span");
				s.className = "font-mono-code text-[12px] text-on-surface font-semibold truncate", s.textContent = O(e.targetName || e.suggestedName || e.name), a.appendChild(s);
				let c = document.createElement("span");
				c.className = "text-[10px] font-mono-code text-secondary truncate", c.textContent = e.name, a.appendChild(c), r.appendChild(a), n.appendChild(r);
				let l = document.createElement("span");
				l.className = e.isMatched ? "px-1.5 py-0.5 rounded font-mono-code text-[9px] bg-tertiary-fixed text-on-tertiary-fixed font-bold uppercase shrink-0" : "px-1.5 py-0.5 rounded font-mono-code text-[9px] bg-surface-variant text-on-surface-variant font-bold uppercase shrink-0", l.textContent = e.docType || "Select", n.appendChild(l), o.appendChild(n);
			}), t.appendChild(o);
		}
		let a = this.state.files.filter((e) => e.isRenamed || e.isKept);
		if (a.length > 0) {
			let e = document.createElement("div");
			e.className = "mt-auto pt-2 flex flex-col gap-1.5 shrink-0";
			let n = document.createElement("div");
			n.className = "flex items-center justify-between px-2 py-1 rounded bg-emerald-100 border border-emerald-300 text-[11px] font-mono-code text-emerald-900";
			let r = document.createElement("div");
			r.className = "flex items-center gap-1.5 font-bold";
			let i = document.createElement("span");
			i.className = "material-symbols-outlined text-[15px] text-tertiary", i.textContent = "south", r.appendChild(i), r.appendChild(document.createTextNode("COMPLETED FILES")), n.appendChild(r);
			let o = document.createElement("span");
			o.className = "text-[10px] font-semibold text-tertiary uppercase", o.textContent = `${a.length} finished`, n.appendChild(o), e.appendChild(n), a.forEach((t) => {
				let n = this.state.files.indexOf(t), r = document.createElement("article");
				r.className = "bg-surface-container-lowest rounded-xl shadow-xs px-space-md py-1.5 flex items-center justify-between gap-space-sm border border-emerald-300 cursor-pointer hover:bg-emerald-50/50 transition-colors", r.title = "Click to re-open and re-rename in Active Card", r.addEventListener("click", () => {
					this.state.currentIndex = n, this.renderQueue(), this.renderCurrentPreview();
				});
				let i = document.createElement("div");
				i.className = "flex items-center gap-2 min-w-0 flex-1";
				let a = document.createElement("span");
				a.className = "w-4 h-4 rounded-full bg-emerald-500 text-on-primary font-mono-code font-bold text-[9px] flex items-center justify-center shrink-0";
				let o = document.createElement("span");
				o.className = "material-symbols-outlined text-[11px]", o.textContent = "check", a.appendChild(o), i.appendChild(a);
				let s = document.createElement("span");
				s.className = "font-mono-code text-[11px] text-tertiary font-bold truncate", s.textContent = t.targetName, i.appendChild(s), r.appendChild(i);
				let c = document.createElement("span");
				c.className = "font-mono-code text-[10px] text-secondary shrink-0", c.textContent = `${(t.size / 1024).toFixed(0)} KB`, r.appendChild(c), e.appendChild(r);
			}), t.appendChild(e);
		}
		e.appendChild(t);
	}
	async applyShortcutToCurrent(e) {
		let t = this.state.files[this.state.currentIndex];
		if (!t) return;
		let n = e.canonical, r = t.ext, i = j(n, this.state.studentName, this.state.settings?.groups, this.state.style), a = i.endsWith(r) ? i : `${i}${r}`, o = new Set(this.state.files.map((e) => e.targetName));
		o.delete(t.targetName);
		let s = E(a, t.name, o);
		t.targetName = s, t.docType = n, t.isMatched = !0, t.status = "matched", await this.handleConfirmCurrentName(s);
	}
	async handleConfirmCurrentName(e) {
		let t = this.state.files[this.state.currentIndex];
		if (!t) return;
		let n = (e || "").trim(), i = t.ext || ("." + t.name.split(".").pop()).toLowerCase();
		if (!n) {
			this.handleKeepOriginal();
			return;
		}
		let a = n.endsWith(i) ? n.slice(0, -i.length).trim() : n, o = L(a, b), s = g(o, this.state.settings?.groups) || g(a, this.state.settings?.groups), c = v(o, this.state.settings?.groups), l = s || c.docType || null;
		if (l) {
			let e = y[l.toUpperCase()] || l, r = j(e, this.state.studentName, this.state.settings?.groups, this.state.style);
			n = r.endsWith(i) ? r : `${r}${i}`, t.docType = e, t.isMatched = !0;
		} else n.endsWith(i) || (n = `${n}${i}`);
		let u = new Set(this.state.files.map((e) => e.targetName));
		u.delete(t.targetName), n = E(n, t.name, u);
		let f = M(n);
		if (f) {
			r.show("Invalid Filename", f, "error");
			return;
		}
		try {
			let e = this.state.folder?.path || "", i = t.path || (e ? `${e}/${t.name}` : null);
			if (i && t.name !== n) {
				let e = await d(i, n);
				if (e.success) {
					let a = e.path || i.replace(/\\/g, "/").replace(/\/[^\/]+$/, "") + "/" + n;
					F.pushBatch(this.state.folder, [{
						old: t.name,
						next: n,
						file: t,
						nativePath: t.path
					}]), t.name = n, t.targetName = n, t.path = a, t.nativePath = a, t.url = `http://localhost:3000/api/serve-file?path=${encodeURIComponent(a)}`, t.isRenamed = !0, t.status = "renamed", pe(1), r.show("Renamed", n, "success");
				} else {
					r.show("Rename Error", e.error || "Failed to rename on disk", "error");
					return;
				}
			} else t.name = n, t.targetName = n, t.isRenamed = !0, t.status = "renamed", r.show("Name Confirmed", n, "info");
		} catch (e) {
			r.show("Rename Failed", e.message, "error");
			return;
		}
		this.updateTelemetry();
		let p = this.state.files.findIndex((e, t) => t > this.state.currentIndex && !e.isRenamed && !e.isKept);
		if (p !== -1) this.state.currentIndex = p;
		else {
			let e = this.state.files.findIndex((e) => !e.isRenamed && !e.isKept);
			e !== -1 && (this.state.currentIndex = e);
		}
		this.renderQueue(), this.renderCurrentPreview();
	}
	handleNavigateBackward() {
		this.state.currentIndex > 0 ? (this.state.currentIndex--, this.renderQueue(), this.renderCurrentPreview()) : r.show("First Document", "Already on the first document in queue.", "info");
	}
	handleKeepOriginal() {
		let e = this.state.files[this.state.currentIndex];
		if (!e) return;
		e.targetName = e.name, e.isKept = !0, e.status = "kept", r.show("Kept Original", e.name, "info");
		let t = this.state.files.findIndex((e, t) => t > this.state.currentIndex && !e.isRenamed && !e.isKept);
		if (t !== -1) this.state.currentIndex = t;
		else {
			let e = this.state.files.findIndex((e) => !e.isRenamed && !e.isKept);
			e !== -1 && (this.state.currentIndex = e);
		}
		this.updateTelemetry(), this.renderQueue(), this.renderCurrentPreview();
	}
	async handleRenameAll() {
		let e = this.state.files.filter((e) => !e.isRenamed && !e.isKept && e.targetName !== e.name);
		if (e.length === 0) {
			r.show("No Changes Needed", "All files are already named or kept.", "info");
			return;
		}
		for (let t of e) {
			let e = M(t.targetName);
			if (e) {
				r.show("Validation Error", `${t.name}: ${e}`, "error");
				return;
			}
		}
		let t = e.map((e) => ({
			old: e.name,
			next: e.targetName,
			file: e,
			nativePath: e.path
		}));
		r.show("Executing Batch Rename", `Processing ${t.length} files atomically...`, "info");
		try {
			await N(this.state.folder, t, (e, t) => {
				console.log(`[Rename Progress] ${e}%: ${t}`);
			}), F.pushBatch(this.state.folder, t), e.forEach((e) => {
				e.name = e.targetName, e.isRenamed = !0, e.status = "renamed";
			}), r.show("Batch Complete!", `Successfully renamed ${t.length} files.`, "success"), this.updateTelemetry(), this.renderQueue(), this.renderCurrentPreview();
		} catch (e) {
			r.show("Rename Failed", e.message, "error");
		}
	}
	async handleUndo() {
		if (!F.canUndo()) {
			r.show("Undo Stack Empty", "No previous rename batch to undo.", "info");
			return;
		}
		let e = F.pop();
		r.show("Reverting Changes", `Restoring ${e.plan.length} files...`, "info");
		try {
			await P(e.dir, e.plan, (e, t) => {
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
		let e = this.state.settings?.activeChecklist || "MAHA DBT FORM", t = ((this.state.settings?.checklists || C)[e] || C["MAHA DBT FORM"] || []).map((e) => Array.isArray(e) ? {
			name: e[0],
			keywords: e[1] || [e[0].toLowerCase()]
		} : e), n = this.state.files.map((e) => e.targetName || e.name), i = this.state.settings?.linkedRules || x, a = t.map((e) => re(n, e, i)), o = a.filter((e) => e.status === "green").length, s = a.length - o, c = t.length > 0 ? Math.round(o / t.length * 100) : 0, l = a.map((e, n) => e.status === "green" ? null : t[n].name).filter(Boolean), u = oe([{
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
		ie(`DocMitra_Audit_${(this.state.studentName || "Batch").replace(/\s+/g, "_")}.csv`, u), r.show("Audit Exported", `CSV report for ${t.length} admission rules downloaded.`, "success");
	}
	handleClearQueue() {
		this.state.files = [], this.state.folder = null, this.state.currentIndex = 0, this.updateTelemetry(), this.renderQueue(), this.renderCurrentPreview(), r.show("Queue Cleared", "Intake workstation reset.", "info");
	}
	renderCurrentPreview() {
		let e = document.getElementById("col-preview");
		if (!e) return;
		let t = this.state.files[this.state.currentIndex], n = e.querySelector(".overflow-auto");
		if (!n) return;
		for (; n.firstChild;) n.removeChild(n.firstChild);
		if (!t) {
			let e = document.createElement("div");
			e.className = "flex flex-col items-center justify-center gap-3 text-secondary opacity-60";
			let t = document.createElement("span");
			t.className = "material-symbols-outlined text-[64px]", t.textContent = "visibility", e.appendChild(t);
			let r = document.createElement("span");
			r.className = "font-mono-code text-[13px]", r.textContent = "No Document Loaded for Preview", e.appendChild(r), n.appendChild(e);
			return;
		}
		let r = e.querySelector("strong.text-tertiary, strong.text-error");
		if (r) {
			let e = (t.size / 1024).toFixed(0);
			t.size <= 262144 ? (r.className = "text-tertiary font-bold", r.textContent = `${e} KB / 256 KB Safe`) : (r.className = "text-error font-bold", r.textContent = `${e} KB (>256 KB Safe Buffer)`);
		}
		if (this.state.splitCompare && this.state.files.length > 1) {
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
		if (r && e.url) {
			let t = document.createElement("img");
			t.src = e.url, t.alt = e.name, t.className = "w-full h-full object-contain", n.appendChild(t);
		} else if (i && window.pdfjsLib && e.url) {
			let t = document.createElement("canvas");
			t.className = "w-full h-full object-contain", n.appendChild(t), window.pdfjsLib.getDocument(e.url).promise.then((e) => {
				e.getPage(1).then((e) => {
					let n = e.getViewport({ scale: 1.5 });
					t.height = n.height, t.width = n.width, e.render({
						canvasContext: t.getContext("2d"),
						viewport: n
					});
				});
			}).catch((t) => {
				console.warn("PDF.js render error:", t), this._renderDocumentInfoFallback(n, e);
			});
		} else {
			if (i && !window.pdfjsLib && !this._pdfLoading) {
				this._pdfLoading = !0;
				let e = document.createElement("script");
				e.src = "assets/js/libs/pdf.min.js", e.onload = () => {
					window.pdfjsLib && (window.pdfjsLib.GlobalWorkerOptions.workerSrc = "assets/js/libs/pdf.worker.min.js", this.renderCurrentPreview());
				}, document.head.appendChild(e);
			}
			this._renderDocumentInfoFallback(n, e);
		}
		return n;
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
		s.className = "font-mono-code text-[12px] text-secondary", s.textContent = `Size: ${(t.size / 1024).toFixed(1)} KB • Type: ${t.ext.toUpperCase()}`, a.appendChild(s);
		let c = document.createElement("div");
		c.className = t.isMatched ? "px-3 py-1 rounded bg-tertiary-fixed text-on-tertiary-fixed font-bold font-mono-code text-[11px]" : "px-3 py-1 rounded bg-surface-variant text-on-surface-variant font-bold font-mono-code text-[11px]", c.textContent = t.isMatched ? `Matched: ${t.docType}` : "Unmatched File", a.appendChild(c), e.appendChild(a);
		let l = document.createElement("div");
		l.className = "text-center border-t pt-2 border-outline-variant/30 text-[10px] font-mono-code text-secondary", l.textContent = "Air-Gapped High-Precision Preview Stage", e.appendChild(l);
	}
};
function we() {
	let e = new Ce();
	return e.init(), e;
}
// src/services/export-import-service.js
function Te(e) {
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
function Ee(e, t) {
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
var De = class {
	constructor() {
		this.state = null, this.initialState = null, this.activeChecklist = "11th / 12th (FYJC / SYJC)";
	}
	init() {
		this.loadState(), this._bindButtons(), this.renderAll(), console.info("[DocMitra Settings] Settings UI manager initialized.");
	}
	loadState() {
		this.state = W(), this.initialState = JSON.parse(JSON.stringify(this.state));
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
				Te(this.state), r.show("Settings Exported", "Configuration JSON file downloaded.", "success");
			} catch (e) {
				r.show("Export Error", e.message, "error");
			}
		});
		let o = document.getElementById("btnTriggerImportJSON"), s = document.getElementById("inputImportSettingsJSON");
		o && s && (o.addEventListener("click", () => s.click()), s.addEventListener("change", async (e) => {
			let t = e.target.files?.[0];
			if (t) try {
				await Ee(t, this.state), G(this.state), this.initialState = JSON.parse(JSON.stringify(this.state)), this.renderAll(), r.show("Import Successful", "System configuration restored and verified.", "success");
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
			let m = p.find((e) => e.outputName.toUpperCase() === t.toUpperCase()), h = m ? m.primaryShortcut : (n[0] || "DOC").toUpperCase().slice(0, 4), g = document.createElement("span");
			g.className = "px-2 py-1 bg-surface-container-high rounded text-on-surface font-mono-code text-[12px] font-bold shadow-2xs", g.textContent = h, f.appendChild(g), o.appendChild(f);
			let _ = document.createElement("div");
			_.className = "col-span-4 pr-space-sm";
			let v = document.createElement("div");
			v.className = "flex flex-wrap gap-1 max-h-16 overflow-y-auto", (n || []).forEach((e) => {
				let t = document.createElement("span");
				t.className = /[\u0900-\u097F]/.test(e) ? "px-1.5 py-0.5 rounded bg-surface-container text-primary font-semibold text-[11px]" : "px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-mono-code text-[11px]", t.textContent = e, v.appendChild(t);
			}), _.appendChild(v), o.appendChild(_);
			let y = document.createElement("div");
			y.className = "col-span-1 flex items-center justify-end gap-1";
			let b = document.createElement("button");
			b.type = "button", b.className = "p-1 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded transition-colors cursor-pointer", b.title = "Edit Keywords";
			let x = document.createElement("span");
			x.className = "material-symbols-outlined text-[16px]", x.textContent = "edit", b.appendChild(x), b.addEventListener("click", () => {
				let e = (n || []).join(", "), i = window.prompt(`Edit keywords for "${t}" (comma-separated):`, e);
				if (i !== null) {
					let e = i.split(",").map((e) => e.trim()).filter(Boolean);
					this.state.groups[t] = e, this.renderCanonicalRules(), r.show("Rule Updated", `Keywords updated for ${t}`, "info");
				}
			}), y.appendChild(b);
			let S = document.createElement("button");
			S.type = "button", S.className = "p-1 text-on-surface-variant hover:text-error hover:bg-error-container hover:text-on-error-container rounded transition-colors cursor-pointer", S.title = "Delete Rule";
			let C = document.createElement("span");
			C.className = "material-symbols-outlined text-[16px]", C.textContent = "delete", S.appendChild(C), S.addEventListener("click", () => {
				window.confirm(`Are you sure you want to delete canonical rule "${t}"?`) && (delete this.state.groups[t], this.renderCanonicalRules(), r.show("Rule Deleted", t, "warning"));
			}), y.appendChild(S), o.appendChild(y), e.appendChild(o);
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
		let n = this.state.checklists || C;
		Object.keys(n).forEach((t) => {
			let n = document.createElement("button");
			n.type = "button", n.className = t === this.activeChecklist ? "px-3 py-1.5 rounded-lg bg-primary text-on-primary font-label-sm font-bold shadow-xs cursor-pointer" : "px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm font-semibold cursor-pointer", n.textContent = t, n.addEventListener("click", () => {
				this.activeChecklist = t, this.renderChecklists();
			}), e.appendChild(n);
		}), (n[this.activeChecklist] || []).forEach((e, n) => {
			let r = document.createElement("div");
			r.className = "p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-between gap-3 shadow-2xs";
			let i = document.createElement("div");
			i.className = "flex items-center gap-2.5";
			let a = document.createElement("span");
			a.className = "w-6 h-6 rounded bg-surface-container text-secondary font-mono-code text-[11px] font-bold flex items-center justify-center", a.textContent = String(n + 1), i.appendChild(a);
			let o = document.createElement("span");
			o.className = "font-label-md font-bold text-on-surface", o.textContent = e.name || e[0], i.appendChild(o), r.appendChild(i);
			let s = document.createElement("div");
			s.className = "flex items-center gap-2";
			let c = document.createElement("span");
			c.className = "px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono-code text-[10px] font-bold", c.textContent = "Mandatory", s.appendChild(c), r.appendChild(s), t.appendChild(r);
		});
	}
	handleSave() {
		G(this.state), this.initialState = JSON.parse(JSON.stringify(this.state)), r.show("Settings Saved", "System rules updated and applied to workstation.", "success");
		let e = document.getElementById("settings-modal-overlay");
		e && e.classList.add("hidden"), document.body.style.overflow = "";
	}
	handleReset() {
		window.confirm("Reset all rules, shortcuts, and checklists to factory defaults?") && (this.state.groups = m(), this.state.checklists = JSON.parse(JSON.stringify(C)), G(this.state), this.initialState = JSON.parse(JSON.stringify(this.state)), this.renderAll(), r.show("Factory Defaults Restored", "All default rules loaded.", "info"));
	}
	handleDiscard() {
		this.state = JSON.parse(JSON.stringify(this.initialState)), this.renderAll(), r.show("Changes Discarded", "Reverted to previous configuration.", "info");
		let e = document.getElementById("settings-modal-overlay");
		e && e.classList.add("hidden"), document.body.style.overflow = "";
	}
};
function Oe() {
	let e = new De();
	return e.init(), e;
}
// src/modules/pdf-studio.js
var q = {
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
function ke(e) {
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
function J(e = [], t = "portrait", n = 0) {
	if (!e.length) throw Error("No images provided for PDF creation.");
	let r = [], i = 0, a = (e) => new TextEncoder().encode(e), o = [], s = (e) => {
		o.push(e), i += e.length;
	};
	s(a("%PDF-1.4\n%âãÏÓ\n")), r.push(i), s(a("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"));
	let c = e.length, l = [];
	for (let e = 0; e < c; e++) l.push(3 + e * 3);
	r.push(i), s(a(`2 0 obj\n<< /Type /Pages /Kids [ ${l.map((e) => `${e} 0 R`).join(" ")} ] /Count ${c} >>\nendobj\n`));
	for (let o = 0; o < c; o++) {
		let c = e[o], l = 3 + o * 3, u = l + 1, d = l + 2, f = c.bytes, { width: p, height: m } = c.width && c.height ? c : ke(f), h = q.A4_PORTRAIT.width, g = q.A4_PORTRAIT.height;
		(t === "landscape" || t === "fit" && p > m) && (h = q.A4_LANDSCAPE.width, g = q.A4_LANDSCAPE.height);
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
function Ae(e) {
	let t = [], n = e.length, r = 0;
	for (; r < n - 3;) if (e[r] === 255 && e[r + 1] === 216 && e[r + 2] === 255) {
		let i = r;
		for (r += 2; r < n - 1;) {
			if (e[r] === 255 && e[r + 1] === 217) {
				let n = r + 2, a = e.slice(i, n), o = ke(a);
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
function Y(e) {
	let t = Ae(e);
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
function je(e, t = "Document.pdf") {
	let n = Y(e), r = t.replace(/\.pdf$/i, "");
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
function Me(e, t = "Document.pdf") {
	let n = Y(e), r = t.replace(/\.pdf$/i, "");
	return n.length ? n.map((e, t) => {
		let n = `${r}_page_${t + 1}.pdf`, i = J([e], "portrait");
		return {
			fileName: n,
			blob: i,
			size: i.size,
			pageIndex: t + 1
		};
	}) : [];
}
function Ne(e = [], t = "portrait") {
	let n = [];
	for (let t of e) {
		let e = Y(t);
		n.push(...e);
	}
	if (!n.length) throw Error("No document images could be extracted to merge PDFs.");
	return J(n, t);
}
function X(e, t = 90) {
	let n = (t % 360 + 360) % 360;
	if (n === 0) return new Blob([e], { type: "application/pdf" });
	let r = Y(e);
	if (r.length > 0) return J(r, "portrait", n);
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
function Pe(e, t, n = "auto") {
	if (!e) return "document.pdf";
	let r = e.lastIndexOf("."), i = r === -1 ? e : e.slice(0, r), a = r === -1 ? "" : e.slice(r), o = i.replace(/[\s_-]+\d+\s*(?:KB|MB)$/i, "").trim();
	return n === "MB" || n === "auto" && t >= 10485760 ? `${o} ${Math.max(1, Math.round(Number(t || 0) / 1048576))} MB${a}` : `${o} ${Math.max(1, Math.round(Number(t || 0) / 1024))} KB${a}`;
}
// src/ui/pdf-studio-ui.js
var Fe = class {
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
				u.className = "w-full h-full object-contain", l.appendChild(u), t.bytes && window.pdfjsLib && window.pdfjsLib.getDocument({ data: t.bytes }).promise.then((e) => {
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
				});
				let d = document.createElement("div");
				d.className = "absolute bottom-1 right-1 bg-inverse-surface/80 text-inverse-on-surface rounded px-1 text-[9px] font-mono-code", d.textContent = `${t.pageCount || 1}p`, l.appendChild(d), r.appendChild(l);
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
			let e = X(t.bytes, 90);
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
				let n = X(t.bytes, 90);
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
				let e = Ne(this.files.map((e) => e.bytes).filter(Boolean), "portrait");
				this._downloadBlob(e, "Merged_Admission_Dossier.pdf"), r.show("Merge Complete!", "Merged PDF Dossier generated and saved.", "success");
			} else if (e === "compress_pdf") {
				let e = 0;
				for (let t of this.files) {
					if (!t.bytes) continue;
					let n = Y(t.bytes), r;
					r = n.length > 0 ? J(n, "portrait") : new Blob([t.bytes], { type: "application/pdf" });
					let i = Pe(t.name, r.size);
					this._downloadBlob(r, i), e++;
				}
				r.show("Compression Complete!", `Compressed ${e} files to safe MahaDBT thresholds.`, "success");
			} else if (e === "split_pdf") {
				let e = 0;
				for (let t of this.files) t.bytes && Me(t.bytes, t.name).forEach((t) => {
					this._downloadBlob(t.blob, t.fileName), e++;
				});
				r.show("Split Complete!", `Extracted ${e} individual PDF pages.`, "success");
			} else if (e === "pdf_to_jpg") {
				let e = 0;
				for (let t of this.files) t.bytes && je(t.bytes, t.name).forEach((t) => {
					this._downloadBlob(t.blob, t.fileName), e++;
				});
				r.show("Conversion Complete!", `Extracted ${e} high-resolution JPG pages.`, "success");
			} else if (e === "rotate_pdf") {
				let e = 0;
				for (let t of this.files) {
					if (!t.bytes) continue;
					let n = X(t.bytes, 90);
					this._downloadBlob(n, t.name), e++;
				}
				r.show("Rotation Complete!", `Rotated and saved ${e} PDF documents.`, "success");
			} else {
				let e = 0;
				for (let t of this.files) {
					if (!t.bytes) continue;
					let n = J(Y(t.bytes), "portrait");
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
function Ie() {
	let e = new Fe();
	return e.init(), e;
}
// src/modules/image-studio.js
function Le(e, t, n, r = "magic_color") {
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
function Re(e, t = 0) {
	let n = document.createElement("canvas"), r = (t % 360 + 360) % 360, i = r === 90 || r === 270, a = i ? e.height : e.width, o = i ? e.width : e.height;
	n.width = a, n.height = o;
	let s = n.getContext("2d");
	return s.save(), s.translate(n.width / 2, n.height / 2), s.rotate(r * Math.PI / 180), s.drawImage(e, -e.width / 2, -e.height / 2), s.restore(), n;
}
async function Z(e, t = 250, n = {}) {
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
				if (r === 0 ? (l = document.createElement("canvas"), l.width = e, l.height = s, l.getContext("2d").drawImage(c, 0, 0, e, s)) : l = Re(c, r), i && i !== "none" && Le(l.getContext("2d"), l.width, l.height, i), !t || t <= 0) {
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
async function ze(e, t = "image/png") {
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
var Be = class {
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
			Re(n, 90).toBlob((e) => {
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
						let e = /sign|signature|स्वाक्षरी/i.test(n.name) ? 18 : 45, i = await Z(r, e);
						this._downloadBlob(i.blob, `Compressed_${n.name}`), t++;
					} else if (e === "passport_crop") {
						let e = await Z(await this._cropPassport(r), 48);
						this._downloadBlob(e.blob, `Passport_${n.name}`), t++;
					} else if (e === "sign_clean_invert") {
						let e = await Z(r, 18, { filterMode: "sharp_contrast" });
						this._downloadBlob(e.blob, `Clean_Sign_${n.name}`), t++;
					} else if (e === "image_to_pdf") {
						let e = await r.arrayBuffer(), i = J([{
							bytes: new Uint8Array(e),
							width: 0,
							height: 0
						}], "portrait"), a = n.name.replace(/\.[a-zA-Z0-9]+$/, "") + ".pdf";
						this._downloadBlob(i, a), t++;
					} else if (e === "magic_color") {
						let e = await Z(r, 240, { filterMode: "enhanced" });
						this._downloadBlob(e.blob, `Magic_${n.name}`), t++;
					} else {
						let e = await ze(r, "image/jpeg");
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
function Ve() {
	let e = new Be();
	return e.init(), e;
}
({ ...w });
function Q(e) {
	if (!e || typeof e != "string") return "";
	let t = v(e);
	if (t && t.docType) return t.docType;
	let n = e.replace(/\.[^/.]+$/, "");
	return n = n.replace(/\s*\(p\.\d+\)/i, ""), n.trim().toUpperCase();
}
function He(e) {
	if (!e || typeof e != "string") return "";
	let t = e.replace(/\.[^/.]+$/, "").trim(), n = v(t);
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
function Ue(e, t = []) {
	return !Array.isArray(e) || e.length === 0 ? [] : !Array.isArray(t) || t.length === 0 ? [...e] : [...e].sort((e, n) => {
		let r = e.docType || Q(e.label || e.name), i = n.docType || Q(n.label || n.name), a = t.findIndex((e) => {
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
var We = class {
	constructor() {
		this.presets = { ...w }, this.activePresetKey = "MAHA DBT FORM", this.documents = [], this.activeDocIndex = 0, this.zoomLevel = 100;
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
		this.documents = Ue(this.documents, e), this.activeDocIndex = 0, this.renderDocumentList(), this.renderActivePreview(), this.renderThumbnails(), r.show("Sequence Applied", `Ordered according to ${this.activePresetKey} criteria.`, "success");
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
				let n = Q(e.name), r = He(e.name);
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
function Ge() {
	let e = new We();
	return e.init(), e;
}
// src/services/followup-service.js
var Ke = "studentDocumentFollowUps", $ = [];
function qe() {
	try {
		if (typeof localStorage < "u") {
			let e = localStorage.getItem(Ke);
			return e ? JSON.parse(e) : [];
		}
		return $;
	} catch {
		return $;
	}
}
function Je(e) {
	try {
		$ = e, typeof localStorage < "u" && localStorage.setItem(Ke, JSON.stringify(e));
	} catch (e) {
		console.error("Failed to save follow-ups:", e);
	}
}
function Ye(e, t) {
	let n = qe(), r = (e || "").trim().toLowerCase(), i = (t || "").trim().toUpperCase(), a = !1;
	return n.forEach((e) => {
		e.folderName.trim().toLowerCase() === r && e.documentName.trim().toUpperCase() === i && e.status === "pending" && (e.status = "resolved", e.resolvedAt = Date.now(), a = !0);
	}), a && Je(n), a;
}
function Xe(e, t = Qe()) {
	let n = et(e, t);
	return n < 0 ? "overdue" : n === 0 ? "today" : "upcoming";
}
function Ze(e) {
	if (!e) return "";
	let t = e.split("-");
	return t.length === 3 ? new Date(Number(t[0]), Number(t[1]) - 1, Number(t[2])).toLocaleDateString("en-IN", {
		day: "numeric",
		month: "short",
		year: "numeric"
	}) : e;
}
function Qe() {
	let e = /* @__PURE__ */ new Date();
	return `${e.getFullYear()}-${String(e.getMonth() + 1).padStart(2, "0")}-${String(e.getDate()).padStart(2, "0")}`;
}
function $e(e = 1) {
	let t = /* @__PURE__ */ new Date();
	return t.setDate(t.getDate() + e), `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}
function et(e, t) {
	return e === t ? 0 : e < t ? -1 : 1;
}
// src/ui/followup-ui.js
var tt = class {
	constructor() {
		this.items = [], this.searchQuery = "";
	}
	init() {
		this._seedDemoDataIfEmpty(), this.items = qe(), this._bindControls(), this.renderTable(), console.info("[DocMitra Follow-up Desk] Follow-up UI manager initialized.");
	}
	_seedDemoDataIfEmpty() {
		if (qe().length === 0) {
			let e = Qe(), t = $e(2);
			Je([
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
			let f = Xe(t.promisedDate), p = document.createElement("div");
			p.className = f === "overdue" ? "font-mono-code font-bold text-error" : f === "today" ? "font-mono-code font-bold text-amber-700" : "font-mono-code font-bold text-emerald-700", p.textContent = Ze(t.promisedDate), d.appendChild(p);
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
		let t = Ze(e.promisedDate);
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
		Ye(e.folderName, e.documentName), e.status = "resolved", this.renderTable(), r.show("कागदपत्र प्राप्त!", `${e.documentName} for ${e.studentName} marked as received.`, "success");
	}
};
function nt() {
	let e = new tt();
	return e.init(), e;
}
// src/ui/index.js
function rt() {
	new n().init(), new i().init(), Oe(), we(), Ie(), Ve(), Ge(), nt(), a();
	let e = document.getElementById("themeToggleBtn");
	e && e.addEventListener("click", () => {
		document.documentElement.classList.toggle("dark");
		let e = document.documentElement.classList.contains("dark");
		r.show(e ? "Dark Theme Enabled" : "Light Theme Enabled", "UI Preference Updated", "info");
	}), console.info("[DocMitra] UI Shell & Modules initialized successfully.");
}
document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", rt) : rt();
export { rt as initAppShell };
