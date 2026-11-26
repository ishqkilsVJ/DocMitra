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
		this.container = null, this.activeToast = null, this.maxVisible = 1, this._pulseTimeout = null, typeof document < "u" && this._ensureContainer();
	}
	_ensureContainer() {
		if (typeof document > "u") return;
		let e = document.getElementById("toast-container");
		e ? (e.classList.contains("bottom-12") || e.classList.contains("bottom-6")) && (e.className = "fixed top-20 right-6 z-[9999] flex flex-col gap-2 pointer-events-none max-w-[420px] select-none") : (e = document.createElement("div"), e.id = "toast-container", e.className = "fixed top-20 right-6 z-[9999] flex flex-col gap-2 pointer-events-none max-w-[420px] select-none", e.setAttribute("aria-live", "polite"), document.body.appendChild(e)), this.container = e;
	}
	success(e, t = "", n = null) {
		this.show(e, t, "success", n);
	}
	error(e, t = "", n = null) {
		this.show(e, t, "error", n);
	}
	warning(e, t = "", n = null) {
		this.show(e, t, "warning", n);
	}
	info(e, t = "", n = null) {
		this.show(e, t, "info", n);
	}
	show(e, t = "", n = "info", r = null, i = null) {
		if (this._ensureContainer(), !this.container) return;
		let a = (e || "").trim(), o = (t || "").trim(), s = `${n}:${a}`, c = r;
		c ??= i && typeof i.onClick == "function" ? 0 : n === "warning" || n === "error" ? 3e3 : 1800, this.activeToast && this.activeToast.key === s && !i && !this.activeToast.action ? (this.activeToast.count += 1, this._updateInPlace(this.activeToast, a, o, c)) : (this.activeToast && this._removeToast(this.activeToast, !0), this._createToastCard(a, o, n, c, i, s));
	}
	_updateInPlace(e, t, n, r) {
		e && e.el && (e.counterEl && (e.counterEl.textContent = `×${e.count}`, e.counterEl.classList.remove("hidden")), e.subtitleEl && n && (e.subtitleEl.textContent = n), e.el.classList.remove("toast-pulse"), e.el.offsetWidth, e.el.classList.add("toast-pulse"), e.timer &&= (clearTimeout(e.timer), null), r > 0 && (e.timer = setTimeout(() => {
			this._removeToast(e);
		}, r)));
	}
	_createToastCard(e, t, n, r, i, a) {
		let o = document.createElement("div");
		o.className = `toast-item toast-${n}`;
		let s = document.createElement("span");
		s.className = "material-symbols-outlined text-[20px] shrink-0", n === "success" ? (s.textContent = "check_circle", s.className += " text-emerald-400") : n === "warning" ? (s.textContent = "warning", s.className += " text-amber-400") : n === "error" ? (s.textContent = "error", s.className += " text-rose-400") : (s.textContent = "info", s.className += " text-blue-400"), o.appendChild(s);
		let c = document.createElement("div");
		c.className = "flex flex-col min-w-0 flex-1";
		let l = document.createElement("div");
		l.className = "flex items-center gap-1.5 flex-wrap";
		let u = document.createElement("span");
		u.className = "font-bold font-headline text-white text-[13px] leading-tight truncate", u.textContent = e, l.appendChild(u);
		let d = document.createElement("span");
		d.className = "toast-counter-badge hidden", d.textContent = "×1", l.appendChild(d), c.appendChild(l);
		let f = null;
		if (t && (f = document.createElement("span"), f.className = "font-mono text-[11px] text-slate-300 mt-0.5 leading-tight truncate max-w-[280px]", f.textContent = t, c.appendChild(f)), o.appendChild(c), i && typeof i.onClick == "function") {
			let e = document.createElement("button");
			e.type = "button", e.className = "ml-auto mr-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-[11px] font-mono transition-all cursor-pointer flex items-center gap-1 shadow-sm shrink-0", e.innerHTML = `
        <span class="material-symbols-outlined text-[14px]">undo</span>
        <span>${i.label || "Undo"}</span>
      `, e.addEventListener("click", (e) => {
				e.stopPropagation(), this._removeToast(h), i.onClick();
			}), o.appendChild(e);
		}
		let p = document.createElement("button");
		p.type = "button", p.className = "text-slate-400 hover:text-white transition-colors p-1 flex items-center justify-center shrink-0 cursor-pointer rounded hover:bg-slate-800/60", p.setAttribute("aria-label", "Dismiss notification");
		let m = document.createElement("span");
		m.className = "material-symbols-outlined text-[16px]", m.textContent = "close", p.appendChild(m), p.addEventListener("click", (e) => {
			e.stopPropagation(), this._removeToast(h);
		}), o.appendChild(p);
		let h = {
			key: a,
			el: o,
			counterEl: d,
			subtitleEl: f,
			count: 1,
			timer: null,
			action: i
		};
		r > 0 && (h.timer = setTimeout(() => {
			this._removeToast(h);
		}, r)), this.container.appendChild(o), this.activeToast = h;
	}
	_removeToast(e, t = !1) {
		e && e.el && (e.timer &&= (clearTimeout(e.timer), null), this.activeToast === e && (this.activeToast = null), t ? e.el.parentNode && e.el.parentNode.removeChild(e.el) : (e.el.classList.add("toast-leaving"), setTimeout(() => {
			e.el && e.el.parentNode && e.el.parentNode.removeChild(e.el);
		}, 180)));
	}
}();
function i(e, t = "info", n = "", i = null, a = null) {
	r.show(e, n, t, i, a);
}
typeof window < "u" && (window.DocMitraToast = r, window.showToast = i);
// src/ui/modal.js
var a = class {
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
function o() {
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
var s = "http://localhost:3000";
function c() {
	if (typeof window < "u") {
		if (window.__TAURI__?.core?.invoke) return window.__TAURI__.core.invoke;
		if (window.__TAURI_INTERNALS__?.invoke) return window.__TAURI_INTERNALS__.invoke;
	}
	return null;
}
function l() {
	return !!c();
}
async function u() {
	if (l()) return !0;
	if (typeof window < "u" && !window.__DOCMITRA_HAS_BACKEND__) return !1;
	try {
		return (await fetch(`${s}/api/license-status`, { signal: AbortSignal.timeout(1e3) })).ok;
	} catch {
		return !1;
	}
}
async function d() {
	let e = c();
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
		let e = new AbortController(), t = setTimeout(() => e.abort(), 6e4), n = await fetch(`${s}/api/native-select-folder`, { signal: e.signal });
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
async function f(e = "All Files (*.*)|*.*", t = "Select Files") {
	let n = c();
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
		let n = await fetch(`${s}/api/native-select-files?filter=${encodeURIComponent(e)}&title=${encodeURIComponent(t)}`);
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
async function p(e) {
	let t = c();
	if (t) try {
		return await t("list_native_directory", { path: e });
	} catch (e) {
		console.warn("[NativeBridge] Tauri list_native_directory failed, trying backend:", e);
	}
	if (typeof window < "u" && !window.__TAURI__ && !window.__DOCMITRA_HAS_BACKEND__) return {
		success: !1,
		error: "Native directory access unavailable in browser environment."
	};
	try {
		let t = await fetch(`${s}/api/list-directory?path=${encodeURIComponent(e)}`);
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
async function m(e, t, n = "", r = 0) {
	let i = c();
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
		let i = await (await fetch(`${s}/api/native-rename`, {
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
async function h(e, t) {
	let n = c();
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
	return m(e, t);
}
async function g(e, t) {
	let n = c();
	if (n) try {
		let r = await n("move_native_file", {
			sourcePath: e,
			source_path: e,
			targetDirPath: t,
			target_dir_path: t
		});
		if (r) return {
			success: !!r.success,
			oldPath: r.oldPath || r.old_path || e,
			newPath: r.path || r.newPath || r.new_path,
			path: r.path || r.newPath || r.new_path,
			name: r.newName || r.new_name,
			error: r.error
		};
	} catch (e) {
		console.warn("[NativeBridge] Tauri move_native_file failed:", e);
	}
	let r = e.split(/[\/\\]/).pop();
	return {
		success: !0,
		oldPath: e,
		newPath: `${t}/${r}`,
		path: `${t}/${r}`,
		name: r,
		error: null
	};
}
async function _(e) {
	let t = c();
	if (t) try {
		let n = await t("read_binary_file", { path: e });
		return new Uint8Array(n);
	} catch (e) {
		throw console.warn("[NativeBridge] read_binary_file failed:", e), e;
	}
	return null;
}
async function v(e, t) {
	let n = c();
	if (n) try {
		return await n("write_binary_file", {
			path: e,
			bytes: t instanceof Uint8Array ? Array.from(t) : t
		}), { success: !0 };
	} catch (e) {
		return console.warn("[NativeBridge] write_binary_file failed:", e), {
			success: !1,
			error: e.message
		};
	}
	return { success: !0 };
}
async function y({ sourcePath: e, targetDir: t, targetName: n = "", studentName: r = "", moveFile: i = !0 }) {
	let a = c();
	if (a) try {
		return await a("import_native_file", {
			sourcePath: e,
			targetDir: t,
			targetName: n,
			moveFile: !!i
		});
	} catch (e) {
		console.warn("[NativeBridge] Tauri import_native_file failed, falling back:", e);
	}
	try {
		return await (await fetch(`${s}/api/native-import-file`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				sourcePath: e,
				targetDir: t,
				targetName: n,
				studentName: r,
				moveFile: !!i
			})
		})).json();
	} catch (e) {
		return {
			success: !1,
			error: e.message
		};
	}
}
async function b(e) {
	let t = c();
	if (t) try {
		return { success: !!await t("open_in_explorer", { path: e }) };
	} catch (e) {
		console.warn("[NativeBridge] Tauri open_in_explorer failed:", e);
	}
	try {
		let t = await fetch(`${s}/api/open-folder?path=${encodeURIComponent(e)}`);
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
// tools/rename_tool/rotation_engine.js
function x(e, t = 90) {
	let n = (t % 360 + 360) % 360;
	if (n === 0) return e;
	try {
		let t = "", r = 65536;
		for (let n = 0; n < e.length; n += r) t += String.fromCharCode.apply(null, e.subarray(n, n + r));
		let i = /(\d+\s+\d+\s+obj\s*<<[\s\S]*?\/Type\s*\/Page(?!\w)[\s\S]*?>>\s*endobj)/g, a = 0, o = t.replace(i, (e) => {
			a++;
			let t = e.match(/\/Rotate\s+(\d+)/);
			if (t) {
				let r = ((parseInt(t[1], 10) || 0) + n) % 360;
				return e.replace(/\/Rotate\s+\d+/, `/Rotate ${r}`);
			}
			return e.replace(/\/Type\s*\/Page(?!\w)/, `/Type /Page /Rotate ${n}`);
		});
		if (a > 0) {
			let e = new Uint8Array(o.length);
			for (let t = 0; t < o.length; t++) e[t] = o.charCodeAt(t) & 255;
			return e;
		}
		let s = /(\d+\s+\d+\s+obj\s*<<[\s\S]*?\/Type\s*\/Pages(?!\w)[\s\S]*?>>\s*endobj)/g, c = 0, l = t.replace(s, (e) => {
			c++;
			let t = e.match(/\/Rotate\s+(\d+)/);
			if (t) {
				let r = ((parseInt(t[1], 10) || 0) + n) % 360;
				return e.replace(/\/Rotate\s+\d+/, `/Rotate ${r}`);
			}
			return e.replace(/\/Type\s*\/Pages(?!\w)/, `/Type /Pages /Rotate ${n}`);
		});
		if (c > 0) {
			let e = new Uint8Array(l.length);
			for (let t = 0; t < l.length; t++) e[t] = l.charCodeAt(t) & 255;
			return e;
		}
		return null;
	} catch (e) {
		return console.warn("[RotationEngine] PDF in-place rotation failed:", e), null;
	}
}
async function S(e, t = "image/jpeg", n = 90) {
	let r = (n % 360 + 360) % 360;
	if (r === 0 || typeof window > "u" || !window.document) return e;
	let i = new Blob([e], { type: t }), a = URL.createObjectURL(i), o = new Image();
	await new Promise((e, t) => {
		o.onload = e, o.onerror = () => t(/* @__PURE__ */ Error("Failed to load image for rotation")), o.src = a;
	}), URL.revokeObjectURL(a);
	let s = document.createElement("canvas"), c = s.getContext("2d");
	r === 90 || r === 270 ? (s.width = o.naturalHeight || o.height, s.height = o.naturalWidth || o.width) : (s.width = o.naturalWidth || o.width, s.height = o.naturalHeight || o.height), c.translate(s.width / 2, s.height / 2), c.rotate(r * Math.PI / 180), c.drawImage(o, -o.width / 2, -o.height / 2);
	let l = t.includes("png") ? "image/png" : "image/jpeg", u = await (await new Promise((e) => {
		s.toBlob((t) => e(t), l, .95);
	})).arrayBuffer();
	return new Uint8Array(u);
}
async function C({ filePath: e, ext: t, bytes: n, degrees: r = 90 }) {
	try {
		let i = n;
		if (!i && e && (i = await _(e)), !i || !i.length) return {
			success: !1,
			error: "File content could not be read"
		};
		let a = (t || e.split(".").pop() || "").toLowerCase().replace(/^\./, ""), o;
		if (a === "pdf") {
			if (o = x(i, r), !o) return {
				success: !1,
				error: "PDF structure does not support in-place byte rotation"
			};
		} else if ([
			"jpg",
			"jpeg",
			"png",
			"webp",
			"bmp"
		].includes(a)) o = await S(i, a === "png" ? "image/png" : "image/jpeg", r);
		else return {
			success: !1,
			error: `Unsupported file type for rotation: .${a}`
		};
		if (e) {
			let t = await v(e, o);
			if (!t.success) return {
				success: !1,
				error: t.error || "Failed to write rotated file to disk"
			};
		}
		return {
			success: !0,
			newBytes: o
		};
	} catch (e) {
		return console.error("[RotationEngine] Error rotating file on disk:", e), {
			success: !1,
			error: e.message
		};
	}
}
// tools/rename_tool/rename_tool_logic.js
var w = {
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
	"DOMICILE AND NATIONALITY CERTIFICATE": "Domicile and Nationality Certificate",
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
	"ATTEMPT CERTIFICATE": "Attempt Certificate",
	"12TH PASSING": "12th Passing Certificate",
	"10TH PASSING": "10th Passing Certificate",
	"CET CELL FORM": "CET Application Form",
	"DOMICILE AND NATIONALITY": "Domicile and Nationality Certificate",
	"NATIONALITY AND DOMICILE": "Domicile and Nationality Certificate",
	"NATIONALITY AND DOMOCILE": "Domicile and Nationality Certificate",
	"NATIONALITY DOMICILE": "Domicile and Nationality Certificate",
	"DOMICILE NATIONALITY": "Domicile and Nationality Certificate"
};
function T(e) {
	if (!e || typeof e != "string") return "";
	let t = e.trim().toUpperCase();
	return w[t] ? w[t].toUpperCase() : t;
}
function E(e, t) {
	if (!e) return;
	let n = e.trim().toUpperCase();
	w[n] = t || e;
}
function D(e) {
	if (!e) return;
	let t = e.trim().toUpperCase();
	delete w[t];
}
function O(e) {
	if (e && Array.isArray(e)) for (let t of e) {
		if (!t) continue;
		let e = (typeof t == "string" ? t : t.name || t.canonical || "").trim();
		e && (w[e.toUpperCase()] = e);
	}
}
var ee = {
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
	bonafaid: "bonafide",
	domocile: "domicile",
	domisail: "domicile",
	pasbook: "passbook",
	pasbok: "passbook",
	incom: "income",
	incme: "income",
	kcast: "caste",
	kast: "caste",
	sartificat: "certificate",
	sartifiket: "certificate",
	sartifakit: "certificate",
	certifcte: "certificate",
	certifcate: "certificate",
	certificte: "certificate",
	certficate: "certificate",
	certifitcate: "certificate",
	atempt: "attempt",
	attmpt: "attempt",
	phot: "photo",
	foto: "photo",
	woter: "voter"
}, k = {
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
		["DOMICILE AND NATIONALITY CERTIFICATE", [
			"domicile and nationality certificate",
			"domicile nationality",
			"nationality domicile",
			"domicile and nationality",
			"domnat",
			"natdom",
			"dn"
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
		["DOMICILE AND NATIONALITY CERTIFICATE", [
			"domicile and nationality certificate",
			"domicile nationality",
			"nationality domicile",
			"domicile and nationality",
			"domnat",
			"natdom",
			"dn"
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
		["DOMICILE AND NATIONALITY CERTIFICATE", [
			"domicile and nationality certificate",
			"domicile nationality",
			"nationality domicile",
			"domicile and nationality",
			"domnat",
			"natdom",
			"dn"
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
		["DOMICILE AND NATIONALITY CERTIFICATE", [
			"domicile and nationality certificate",
			"domicile nationality",
			"nationality domicile",
			"domicile and nationality",
			"domnat",
			"natdom",
			"dn"
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
k["MAHA DBT FORM"] = k["MAHA DBT"], k.SWAYAM = k["SWAYAM DEENDAYAL YOJANA"], k["SWAYAM FORM"] = k["SWAYAM DEENDAYAL YOJANA"], k.EDUCATIONAL = k["EDUCATIONAL DOCUMENTS"];
var A = [
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
		id: "domicile-nationality-certificate",
		displayName: "Domicile & Nationality",
		primaryShortcut: "DOMNAT",
		alternateKeywords: [
			"domicile and nationality certificate",
			"domicile nationality",
			"nationality domicile",
			"domicile and nationality",
			"dn",
			"natdom"
		],
		outputName: "DOMICILE AND NATIONALITY CERTIFICATE"
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
function te(e = null) {
	return e ? A.map((t) => {
		let n = e[t.outputName];
		return n && Array.isArray(n) && n.length > 0 ? {
			...t,
			primaryShortcut: n[0].toUpperCase(),
			alternateKeywords: n.slice(1)
		} : t;
	}) : A;
}
var ne = {
	"10th": [
		"ssc",
		"10",
		"matric",
		"matriculation",
		"10th class",
		"class 10"
	],
	ssc: [
		"10th",
		"10",
		"matric",
		"matriculation"
	],
	"12th": [
		"hsc",
		"12",
		"inter",
		"intermediate",
		"12th class",
		"class 12"
	],
	hsc: [
		"12th",
		"12",
		"inter",
		"intermediate"
	],
	"11th": ["11", "fyjc"],
	marksheet: [
		"mark sheet",
		"marks",
		"mark",
		"result",
		"score card",
		"grade card"
	],
	passing: [
		"passing certificate",
		"pass cert",
		"passing cert",
		"pass certificate",
		"sanad",
		"board cert"
	],
	lc: [
		"leaving certificate",
		"school leaving",
		"tc",
		"transfer certificate",
		"college leaving",
		"leaving"
	],
	tc: [
		"transfer certificate",
		"leaving certificate",
		"lc",
		"school leaving"
	],
	caste: [
		"cast",
		"jati",
		"samaj",
		"jati pramanpatra"
	],
	validity: [
		"caste validity",
		"cvc",
		"validity certificate",
		"padtalani",
		"pramanpatra"
	],
	"non creamy": [
		"ncl",
		"non creamy layer",
		"non criminal",
		"non-creamy",
		"unnath va pragat"
	],
	ncl: [
		"non creamy layer",
		"non creamy",
		"non criminal"
	],
	income: [
		"utpanna",
		"utpanna dakhla",
		"tahsildar income",
		"form 16",
		"salary slip",
		"income cert"
	],
	domicile: [
		"adhivas",
		"rehivasi",
		"domicile cert",
		"residence",
		"residence certificate",
		"maharashtra domicile"
	],
	nationality: [
		"rashtriyatva",
		"indian nationality",
		"nationality cert",
		"citizenship"
	],
	aadhaar: [
		"aadhar",
		"aadhar card",
		"adhar",
		"adhaar",
		"uid",
		"uidai",
		"adhar card"
	],
	pan: [
		"pan card",
		"pancard",
		"income tax pan"
	],
	voter: [
		"voter card",
		"voting card",
		"epic",
		"election card",
		"matdar card"
	],
	driving: [
		"driving license",
		"license",
		"dl",
		"vehicle license"
	],
	photo: [
		"photo",
		"photograph",
		"passport photo",
		"pass photo",
		"pic",
		"profile photo"
	],
	signature: [
		"sign",
		"signature",
		"student signature",
		"st sign",
		"sig"
	],
	bonafide: [
		"bonafide certificate",
		"bona fide",
		"college bonafide"
	],
	gap: [
		"gap certificate",
		"gap affidavit",
		"shikshanit khand"
	],
	"self declaration": [
		"self declaration",
		"self declaration certificate",
		"swayam ghoshana",
		"sdc"
	],
	"parent declaration": [
		"parent declaration",
		"parents declaration",
		"palak ghoshana",
		"pdc"
	],
	death: ["death certificate", "mrutyu dakhla"],
	disability: [
		"disability certificate",
		"handicapped",
		"divyang",
		"pwd certificate",
		"apang",
		"pwd"
	],
	ews: [
		"economically weaker section",
		"ews certificate",
		"arthik durbal ghatak"
	],
	migration: ["migration certificate", "migration cert"],
	medical: [
		"medical fitness",
		"fitness certificate",
		"arogya dakhla"
	],
	birth: [
		"birth certificate",
		"janam dakhla",
		"janma pramanpatra"
	],
	ration: [
		"ration card",
		"rationcard",
		"ration book",
		"rasan kard"
	],
	bank: [
		"bank passbook",
		"passbook",
		"account statement",
		"bank statement"
	],
	cetaf: [
		"cet application form",
		"application form",
		"cet form"
	],
	cetsc: [
		"cet score card",
		"cet result",
		"cet marksheet",
		"mht cet score card"
	],
	cap: [
		"cap allotment",
		"allotment letter",
		"cap round allotment"
	],
	srf: [
		"scrutiny form",
		"fc verification",
		"document verification receipt"
	],
	fee: [
		"fee receipt",
		"fees",
		"receipt",
		"admission fee receipt"
	],
	attendance: ["attendance certificate", "attendance report"],
	hostel: [
		"hostel certificate",
		"hostel receipt",
		"vasatigruh dakhla"
	]
};
function j(e, t = []) {
	if (!e || typeof e != "string") return "";
	let n = e.toLowerCase().trim().replace(/[^a-z0-9\s_-]/g, " ").split(/[\s_-]+/).filter((e) => e.length > 0);
	if (n.length === 0) return "";
	let r = /* @__PURE__ */ new Set(), i = n.join(" ");
	if (r.add(i), Array.isArray(t)) {
		for (let e of t) if (e && typeof e == "string") {
			let t = e.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
			t.length >= 2 && r.add(t);
		}
	}
	for (let [e, t] of Object.entries(ne)) {
		let a = RegExp(`\\b${e}\\b`, "i");
		if (a.test(i)) for (let e of t) r.add(i.replace(a, e)), n.length <= 4 && r.add(e);
	}
	i.includes("10th") ? (r.add(i.replace(/\b10th\b/g, "10")), r.add(i.replace(/\b10th\b/g, "ssc"))) : i.includes("10") && (r.add(i.replace(/\b10\b/g, "10th")), r.add(i.replace(/\b10\b/g, "ssc"))), i.includes("12th") ? (r.add(i.replace(/\b12th\b/g, "12")), r.add(i.replace(/\b12th\b/g, "hsc"))) : i.includes("12") && (r.add(i.replace(/\b12\b/g, "12th")), r.add(i.replace(/\b12\b/g, "hsc"))), i.includes("marksheet") && (r.add(i.replace(/\bmarksheet\b/g, "mark")), r.add(i.replace(/\bmarksheet\b/g, "mark sheet")), n.length >= 2 && r.add(`${n[n.length - 1]} ${n.slice(0, -1).join(" ")}`)), i.includes("passing certificate") && (r.add(i.replace(/\bpassing certificate\b/g, "passing")), r.add(i.replace(/\bpassing certificate\b/g, "pass cert"))), i.includes("caste") && (r.add("kcast"), r.add("kast"), r.add("cst")), i.includes("certificate") && (r.add(i.replace(/\bcertificate\b/g, "sartificat")), r.add(i.replace(/\bcertificate\b/g, "certi")), r.add(i.replace(/\bcertificate\b/g, "dakhla"))), i.includes("domicile") && (r.add("domisail"), r.add("domicil"), r.add("rehivasi")), i.includes("income") && (r.add("incom"), r.add("utpanna"), r.add("utpanna dakhla")), i.includes("non creamy") && (r.add("non crimiler"), r.add("non criminal")), i.includes("marksheet") && r.add(i.replace(/\bmarksheet\b/g, "markshit")), i.includes("aadhaar") && (r.add("adhar"), r.add("aadhar"), r.add("adhaar")), i.includes("photo") && r.add("foto"), i.includes("bonafide") && (r.add("bonafaid"), r.add("bonfide"));
	for (let e of n) e.length >= 3 && ![
		"and",
		"for",
		"the",
		"from",
		"with"
	].includes(e) && r.add(e);
	let a = Array.from(r).map((e) => e.trim().toLowerCase().replace(/[^a-z0-9\s_-]/g, "").replace(/\s+/g, " ")).filter((e) => e.length >= 2);
	return Array.from(new Set(a)).slice(0, 25).join(", ");
}
function M(e, t = null) {
	if (!e || typeof e != "string") return null;
	let n = e.toLowerCase().trim();
	if (!n) return null;
	let r = n.replace(/\s+/g, ""), i = te(t);
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
var re = [
	{
		id: "12th-marksheet-passing-combined",
		outputName: "12TH MARKSHEET AND PASSING CERTIFICATE",
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
		outputName: "10TH MARKSHEET AND PASSING CERTIFICATE",
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
			/\bvaliditi\b/i,
			/\b(caste?|cast|kast)\s*validit/i,
			/\bcvc\b/i,
			/\btribe\s*validity\b/i,
			/\bpadtalni\b/i
		]
	},
	{
		id: "caste-certificate",
		outputName: "CASTE CERTIFICATE",
		shortcut: "CST",
		patterns: [
			/\bcst\b/i,
			/\bcas\b/i,
			/\bcaste\b(?!.*validit)/i,
			/\bcast\b(?!.*validit)/i,
			/\bjati\b(?!.*validit)/i,
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
		id: "domicile-nationality-certificate",
		outputName: "DOMICILE AND NATIONALITY CERTIFICATE",
		shortcut: "DOMNAT",
		patterns: [
			/\bdomnat\b/i,
			/\bnatdom\b/i,
			/\bdomicile\s*(and|&)\s*nationality\b/i,
			/\bnationality\s*(and|&)\s*domicile\b/i,
			/\bage\s*nationality\s*(and|&)\s*domicile\b/i
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
function ie(e, t, n = null) {
	if (!e || !t) return;
	let r = e.toUpperCase().trim(), i = re.find((e) => e.shortcut && e.shortcut.toUpperCase() === r);
	if (i && (i.outputName = t.toUpperCase().trim(), n && Array.isArray(n))) for (let e of n) {
		let t = e.trim().toLowerCase();
		if (t.length >= 2) {
			let e = RegExp(`\\b${t.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "i");
			i.patterns.some((t) => t.toString() === e.toString()) || i.patterns.unshift(e);
		}
	}
}
function N(e, t = null) {
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
	for (let e of re) for (let t of e.patterns) if (t.test(n) || r.length >= 2 && r.length <= 6 && t.test(r)) return {
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
function P(e) {
	if (!e) return "";
	let t = e.lastIndexOf(".");
	return t > 0 ? e.slice(t) : "";
}
function F(e) {
	return !e || typeof e != "string" ? "" : e.replace(/(\.[a-zA-Z0-9]+)+$/i, "").trim();
}
function ae(e, t) {
	let n = N(e, t);
	return n && n.docType ? n.docType : M(e, t) || null;
}
function I(e, t = "preserve", n = null) {
	let r = e, i = t;
	return n !== null && (r = t, i = n), r ? i === "upper" ? r.toUpperCase() : i === "lower" ? r.toLowerCase() : i === "title" ? r.toLowerCase().replace(/(^|[\s\-_])\S/g, (e) => e.toUpperCase()) : r : "";
}
function L(e, t, n, r = "preserve") {
	let i = "", a = (e || "").trim().toUpperCase();
	if (w[a]) i = w[a];
	else {
		let t = ae(e, n);
		i = t ? w[t.toUpperCase()] || t : F(e);
	}
	let o = i;
	if (t && t.trim()) {
		let e = t.trim().replace(/[_\-]+/g, " ").replace(/\s+/g, " "), n = i.replace(/[_\-]+/g, " ").replace(/\s+/g, " ");
		if (n.toLowerCase() === e.toLowerCase()) o = i;
		else {
			let t = e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
			o = RegExp(`(^|\\s)${t}(\\s|$)`, "i").test(n) ? i : `${i} ${e}`;
		}
	}
	return I(o, r);
}
function R(e) {
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
function z(e, t, n, r = "") {
	let i = /* @__PURE__ */ new Map();
	if (n) for (let e of n) e && i.set(e.toLowerCase(), e);
	if (!i.has(e.toLowerCase())) return e;
	let a = P(e), o = F(e), s = o, c = 2, l = "", u = (r || "").trim();
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
	for (; i.has(f.toLowerCase());) c++, f = `${s} ${c}${l}${a}`;
	return f;
}
var B = new class {
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
}(), oe = (e) => e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function se(e, t) {
	return e === e.toUpperCase() ? t.toUpperCase() : e === e.toLowerCase() ? t.toLowerCase() : e[0] === e[0].toUpperCase() ? t[0].toUpperCase() + t.slice(1).toLowerCase() : t;
}
function ce(e, t) {
	if (!e || typeof e != "string") return e;
	let n = e;
	for (let [e, r] of Object.entries(t || {})) {
		if (!e) continue;
		let t = RegExp(`(^|[^a-zA-Z0-9])(${oe(e)})([^a-zA-Z0-9]|$)`, "gi");
		n = n.replace(t, (e, t, n, i) => t + se(n, r) + i);
	}
	return n;
}
async function le(e, t, n = null) {
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
				} else l = await m(s, a.next, e, o);
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
					let r = P(t), i = F(t).replace(/\s+\d+$/, ""), o = 1;
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
async function ue(e, t, n = null) {
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
			} else s = await m(o, t.old);
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
var de = [
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
		canonical: "DOMICILE AND NATIONALITY CERTIFICATE",
		code: "DOMNAT",
		patterns: [
			/\bdomicile\s*(and|&)\s*nationality\b/i,
			/\bnationality\s*(and|&)\s*domicile\b/i,
			/\bage,?\s*nationality\s*(and|&)\s*domicile\b/i,
			/\bअधिवास\s*(आणि|व)\s*राष्ट्रीयत्व\b/i
		],
		primaryKeywords: [
			"domicile and nationality",
			"nationality and domicile",
			"age nationality and domicile",
			"domnat"
		],
		secondaryKeywords: [
			"executive magistrate",
			"tahsildar",
			"state of maharashtra",
			"ordinary resident"
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
function fe({ canonical: e, code: t = "", primaryKeywords: n = [], secondaryKeywords: r = [] }) {
	if (!e || typeof e != "string") return null;
	let i = e.trim().toUpperCase(), a = (t || "").trim().toUpperCase() || i.slice(0, 3);
	w[i] = i;
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
	}, d = de.findIndex((e) => e.canonical === i);
	return d === -1 ? de.push(u) : de[d] = u, u;
}
function pe(e, t) {
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
function me(e, t) {
	if (!e && !t) return 1;
	if (!e || !t) return 0;
	let n = e.toLowerCase().trim(), r = t.toLowerCase().trim();
	if (n === r) return 1;
	let i = Math.max(n.length, r.length);
	if (i === 0) return 1;
	let a = pe(n, r);
	return Math.max(0, 1 - a / i);
}
function V(e) {
	return !e || typeof e != "string" ? [] : e.replace(/\.[a-zA-Z0-9]+$/i, "").replace(/[^a-zA-Z0-9]+/g, " ").toLowerCase().split(/\s+/).filter((e) => e.length > 0);
}
var he = [
	{
		id: "10",
		tags: [
			"10",
			"10th",
			"ssc",
			"tenth",
			"x",
			"dahavi",
			"dahawi"
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
			"xii",
			"baravi",
			"barawi"
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
function ge(e) {
	let t = (e || "").toLowerCase();
	for (let e of he) if (e.tags.includes(t)) return e.id;
	return null;
}
function _e(e) {
	let t = /* @__PURE__ */ new Set();
	for (let n of e) {
		let e = ge(n);
		e && t.add(e);
	}
	return t;
}
function ve(e, t) {
	if (t && t.size > 0) {
		for (let n of e) if (!t.has(n)) return !0;
	}
	return !1;
}
function H(e) {
	if (!e || typeof e != "string") return "";
	let t = e.toLowerCase().trim();
	return t = t.replace(/(\.[a-zA-Z0-9]+)+$/i, ""), t = t.replace(/\bkc([aeiou])/gi, "k$1"), t = t.replace(/\bkn([aeiou])/gi, "n$1"), t = t.replace(/\bps([aeiou])/gi, "s$1"), t = t.replace(/w/gi, "v"), t = t.replace(/ph/gi, "f"), t = t.replace(/sh/gi, "s"), t = t.replace(/ee+/gi, "i"), t = t.replace(/oo+/gi, "u"), t = t.replace(/\b(sartificat|sartifiket|sartifakit|sartificet|certi|cert|dakhla|pramanpatra|praman\s*patra)\b/gi, "certificate"), t = t.replace(/\b(domisail|domicile|domicil|adivas|adhiwas|rehivasi|rahavasi)\b/gi, "domicile"), t = t.replace(/\b(incom|incm|utpanna|utpann)\b/gi, "income"), t = t.replace(/\b(bonafaid|bonafied|bonfide|bona\s*fide)\b/gi, "bonafide"), t = t.replace(/\b(non\s*crimiler|non\s*criminal|noncreamy|non\s*creamy|ncl)\b/gi, "non creamy layer"), t = t.replace(/\b(markshit|markshet|marskheet|mark\s*sheet|scorecard|score\s*card)\b/gi, "marksheet"), t = t.replace(/\b(pasing|pass\s*cert|sanad)\b/gi, "passing"), t = t.replace(/\b(adhar|aadhar|aadhhar|adhaar|uid|uidai)\b/gi, "aadhaar"), t = t.replace(/\b(rasan|rashan|shidha|patrika)\b/gi, "ration"), t = t.replace(/\b(skool|clg|college)\b/gi, "school"), t = t.replace(/\b(lc|tc|leaving|transfer)\b/gi, "leaving certificate"), t = t.replace(/\b(foto|pic|image|photograph)\b/gi, "photo"), t = t.replace(/\b(signatur|sahi|signature|st\s*sign)\b/gi, "signature"), t = t.replace(/\b(validiti|validty)\b/gi, "validity"), t = t.replace(/\b(dahavi|dahawi|ssc|tenth)\b/gi, "10th"), t = t.replace(/\b(baravi|barawi|hsc|twelfth)\b/gi, "12th"), t.replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}
function ye(e) {
	if (!e || typeof e != "string") return ["", ""];
	let t = e.toUpperCase().trim();
	if (!t) return ["", ""];
	let n = "", r = "", i = 0, a = t.length;
	function o(e) {
		return e < 0 || e >= a ? !1 : /[AEIOUY]/.test(t[e]);
	}
	function s(e, n, ...r) {
		if (e < 0 || e >= a) return !1;
		let i = t.substr(e, n);
		return r.includes(i);
	}
	for (s(0, 2, "GN", "KN", "PN", "WR", "PS") && (i += 1), t[0] === "X" && (n += "S", r += "S", i += 1); i < a && (n.length < 8 || r.length < 8);) switch (t[i]) {
		case "A":
		case "E":
		case "I":
		case "O":
		case "U":
		case "Y":
			i === 0 && (n += "A", r += "A"), i += 1;
			break;
		case "B":
			n += "P", r += "P", i = t[i + 1] === "B" ? i + 2 : i + 1;
			break;
		case "C":
			s(i, 2, "CH") ? (n += "X", r += "X", i += 2) : s(i, 2, "CI", "CE", "CY") ? (n += "S", r += "S", i += 2) : s(i, 2, "CK", "CG", "CQ") ? (n += "K", r += "K", i += 2) : s(i, 2, "CZ") ? (n += "S", r += "S", i += 2) : (n += "K", r += "K", i = t[i + 1] === "C" ? i + 2 : i + 1);
			break;
		case "D":
			s(i, 2, "DG") ? (n += "J", r += "J", i += 2) : s(i, 2, "DT", "DD") ? (n += "T", r += "T", i += 2) : (n += "T", r += "T", i += 1);
			break;
		case "F":
			n += "F", r += "F", i = t[i + 1] === "F" ? i + 2 : i + 1;
			break;
		case "G":
			s(i, 2, "GH") ? (i > 0 && !o(i - 1) && (n += "K", r += "K"), i += 2) : s(i, 2, "GN") ? (n += "N", r += "KN", i += 2) : s(i, 2, "GE", "GI", "GY") ? (n += "J", r += "K", i += 2) : (n += "K", r += "K", i = t[i + 1] === "G" ? i + 2 : i + 1);
			break;
		case "H":
			(i === 0 || !o(i - 1)) && o(i + 1) ? (n += "H", r += "H", i += 2) : i += 1;
			break;
		case "J":
			n += "J", r += "J", i = t[i + 1] === "J" ? i + 2 : i + 1;
			break;
		case "K":
			n += "K", r += "K", i = t[i + 1] === "K" ? i + 2 : i + 1;
			break;
		case "L":
			n += "L", r += "L", i = t[i + 1] === "L" ? i + 2 : i + 1;
			break;
		case "M":
			n += "M", r += "M", i = t[i + 1] === "M" ? i + 2 : i + 1;
			break;
		case "N":
			n += "N", r += "N", i = t[i + 1] === "N" ? i + 2 : i + 1;
			break;
		case "P":
			s(i, 2, "PH") ? (n += "F", r += "F", i += 2) : (n += "P", r += "P", i = s(i + 1, 1, "P", "B") ? i + 2 : i + 1);
			break;
		case "Q":
			n += "K", r += "K", i = t[i + 1] === "Q" ? i + 2 : i + 1;
			break;
		case "R":
			n += "R", r += "R", i = t[i + 1] === "R" ? i + 2 : i + 1;
			break;
		case "S":
			s(i, 2, "SH") ? (n += "X", r += "X", i += 2) : s(i, 3, "SIO", "SIA") ? (n += "S", r += "X", i += 3) : (n += "S", r += "S", i = s(i + 1, 1, "S", "Z") ? i + 2 : i + 1);
			break;
		case "T":
			s(i, 4, "TION") ? (n += "XN", r += "XN", i += 4) : s(i, 3, "TIA", "TCH") ? (n += "X", r += "X", i += 3) : s(i, 2, "TH") ? (n += "T", r += "T", i += 2) : (n += "T", r += "T", i = s(i + 1, 1, "T", "D") ? i + 2 : i + 1);
			break;
		case "V":
			n += "F", r += "F", i = t[i + 1] === "V" ? i + 2 : i + 1;
			break;
		case "W":
			o(i + 1) && (n += "F", r += "F"), i += 1;
			break;
		case "X":
			n += "KS", r += "KS", i = s(i + 1, 1, "C", "X") ? i + 2 : i + 1;
			break;
		case "Z":
			n += "S", r += "S", i = s(i + 1, 1, "Z") ? i + 2 : i + 1;
			break;
		default: i += 1;
	}
	return [n, r];
}
function be(e, t) {
	if (!e || !t) return 0;
	let n = e.toLowerCase().trim(), r = t.toLowerCase().trim();
	if (n === r) return 1;
	if (n.length < 4 || r.length < 4) return 0;
	let i = [
		"file",
		"files",
		"doc",
		"docs",
		"document",
		"pdf",
		"scan",
		"copy",
		"page",
		"text",
		"random",
		"order",
		"misc"
	];
	if (i.includes(n) || i.includes(r)) return 0;
	let [a, o] = ye(n), [s, c] = ye(r);
	return !a || !s ? 0 : a === s ? 1 : o && o === s || c && a === c || o && c && o === c ? .95 : a.length >= 3 && s.length >= 3 && (a.startsWith(s) || s.startsWith(a)) ? .85 : 0;
}
function xe(e, t = "", n = null, r = null) {
	if (!e || typeof e != "string") return {
		docType: null,
		canonical: null,
		code: null,
		confidence: 0,
		isConfident: !1,
		reason: "Empty filename"
	};
	let i = F(e).trim();
	if (!i) return {
		docType: null,
		canonical: null,
		code: null,
		confidence: 0,
		isConfident: !1,
		reason: "Empty basename"
	};
	let a = H(i), o = ce(i, ee), s = o.replace(/[_\-\.\+,\(\)\[\]]+/g, " ").replace(/\s+/g, " ").trim().toLowerCase(), c = V(o), l = V(a), u = Array.from(/* @__PURE__ */ new Set([...c, ...l])), d = _e(u);
	if (r) {
		let e = Array.isArray(r) ? r : Object.values(r);
		for (let t of e) {
			if (!t) continue;
			let e = (typeof t == "string" ? t : t.name || t.canonical || (Array.isArray(t) ? t[0] : "")).trim().toUpperCase();
			if (!e) continue;
			let n = (t.code || Array.isArray(t) && t[2] || "").trim().toUpperCase(), r = t.keywords || Array.isArray(t) && t[1] || [], c = Array.isArray(r) ? r : typeof r == "string" ? r.split(",").map((e) => e.trim()) : [];
			if (ve(d, _e(V(e)))) continue;
			if (n) {
				let t = RegExp(`(^|[^a-z0-9])${n}([^a-z0-9]|$)`, "i");
				if (t.test(o) || t.test(i) || t.test(a)) return {
					docType: e,
					canonical: w[e] || e,
					code: n,
					confidence: 95,
					isConfident: !0,
					reason: `Preset shortcode match (${n})`
				};
			}
			let l = e.toLowerCase(), u = H(l);
			if (s === l || a === u || s.startsWith(l + " ") || s.endsWith(" " + l) || s.includes(" " + l + " ") || a.startsWith(u + " ") || a.endsWith(" " + u) || a.includes(" " + u + " ")) return {
				docType: e,
				canonical: w[e] || e,
				code: n || null,
				confidence: 100,
				isConfident: !0,
				reason: "Exact preset document match"
			};
			for (let t of c) {
				let r = t.toLowerCase().trim();
				if (!r) continue;
				let c = H(r);
				if (r.length <= 3) {
					let t = RegExp(`(^|[^a-z0-9])${r}([^a-z0-9]|$)`, "i");
					if (t.test(o) || t.test(i) || t.test(a)) return {
						docType: e,
						canonical: w[e] || e,
						code: n || null,
						confidence: 95,
						isConfident: !0,
						reason: `Preset keyword match (${r})`
					};
				} else if (s.includes(r) || a.includes(r) || a.includes(c)) return {
					docType: e,
					canonical: w[e] || e,
					code: n || null,
					confidence: 90,
					isConfident: !0,
					reason: `Preset keyword match (${r})`
				};
			}
		}
	}
	let f = N(o, n);
	f.docType || (f = N(a, n)), f.docType || (f = N(i, n));
	let p = M(o, n) || M(a, n) || M(i, n);
	if (f && f.docType) {
		let e = f.docType.toUpperCase(), n = w[e] || e, r = n.toUpperCase(), a = i.toUpperCase().replace(/\s+/g, " ").trim(), o = !1;
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
	if (p) {
		let e = p.toUpperCase(), n = w[e] || e, r = n.toUpperCase(), a = i.toUpperCase().replace(/\s+/g, " ").trim(), o = !1;
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
	let m = [
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
				"transfer certificate",
				"skool leaving"
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
				"12th combined",
				"12th markshit and pasing"
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
				"10th combined",
				"10th markshit and pasing"
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
				"hsc",
				"12th markshit",
				"baravi markshit"
			],
			primary: [
				"marksheet",
				"markshet",
				"mark",
				"markshit"
			],
			qualifier: [
				"12",
				"12th",
				"hsc",
				"baravi"
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
				"ssc",
				"10th markshit",
				"dahavi markshit"
			],
			primary: [
				"marksheet",
				"markshet",
				"mark",
				"markshit"
			],
			qualifier: [
				"10",
				"10th",
				"ssc",
				"dahavi"
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
				"12th pass",
				"12th pasing",
				"hsc pasing"
			],
			primary: [
				"passing",
				"sanad",
				"pasing"
			],
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
				"10th pass",
				"10th pasing",
				"ssc pasing"
			],
			primary: [
				"passing",
				"sanad",
				"pasing"
			],
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
				"adhaar",
				"adhar card",
				"aadhar card"
			],
			primary: [
				"aadhaar",
				"adhar",
				"aadhar",
				"adr"
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
				"tribe validity",
				"cast validity",
				"kast validity",
				"cast validiti",
				"caste validiti",
				"validiti"
			],
			primary: [
				"validity",
				"padtalni",
				"validiti",
				"val",
				"cvc"
			]
		},
		{
			type: "CASTE CERTIFICATE",
			code: "CST",
			patterns: [/\b(cst|cas|caste|kcast|kast)\b/i],
			tokens: [
				"caste certificate",
				"caste cert",
				"cst",
				"cas",
				"caste",
				"jati",
				"jati pramanpatra",
				"kcast",
				"kast",
				"sartificat",
				"dakhla"
			],
			primary: [
				"caste",
				"jati",
				"cst",
				"cas",
				"kcast",
				"kast"
			]
		},
		{
			type: "DOMICILE AND NATIONALITY CERTIFICATE",
			code: "DOMNAT",
			tokens: [
				"domicile and nationality",
				"domicile nationality",
				"nationality domicile",
				"domicile and nationality certificate",
				"domnat",
				"natdom",
				"dn"
			],
			primary: [
				"domicile and nationality",
				"domnat",
				"natdom"
			],
			minScore: 90
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
				"adhiwas",
				"domisail",
				"domicil",
				"rehivasi",
				"dakhla"
			],
			primary: [
				"domicile",
				"dom",
				"adivasi",
				"rahavasi",
				"domisail",
				"rehivasi"
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
			primary: [
				"nationality",
				"nat",
				"rashtriyatva"
			]
		},
		{
			type: "INCOME CERTIFICATE",
			code: "INC",
			patterns: [
				/\b(income|inc|utpanna|incom)\b/i,
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
				"form 16",
				"incom",
				"dakhla"
			],
			primary: [
				"income",
				"inc",
				"utpanna",
				"incom"
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
				"non criminal",
				"non crimiler",
				"unnath va pragat"
			],
			primary: [
				"ncl",
				"non creamy",
				"creamy",
				"non crimiler"
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
				"shidha patrika",
				"rashan",
				"rasan",
				"rashan kard"
			],
			primary: [
				"ration",
				"rat",
				"rashan"
			]
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
				"student photo",
				"foto"
			],
			primary: [
				"photo",
				"pic",
				"photograph",
				"foto"
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
				"npci seeded",
				"bank pasbuk",
				"pasbuk"
			],
			primary: [
				"passbook",
				"bank",
				"pasbuk"
			]
		},
		{
			type: "PAN CARD",
			code: "PAN",
			tokens: [
				"pan card",
				"pancard",
				"pan",
				"permanent account number",
				"pan kard"
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
				"educational gap",
				"gap sartifiket"
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
				"bon",
				"bonafaid"
			],
			primary: [
				"bonafide",
				"bonfide",
				"bon",
				"bonafaid"
			]
		},
		{
			type: "SELF DECLARATION",
			code: "SDC",
			patterns: [
				/\bself\s*declaration\b/i,
				/\bsvayam\s*ghoshana\b/i,
				/\bsdc\b/i,
				/\bslf\b/i,
				/\bself\s*declarashan\b/i
			],
			tokens: [
				"self declaration",
				"undertaking",
				"declaration form",
				"pratigyapatra",
				"svayam",
				"sdc",
				"swayam ghoshnapatra",
				"self declarashan"
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
				"atm",
				"atempt sartificat"
			],
			primary: [
				"attempt",
				"atm",
				"atempt"
			]
		},
		{
			type: "BIRTH CERTIFICATE",
			code: "BRT",
			tokens: [
				"birth certificate",
				"janma dakhla",
				"brt",
				"birth",
				"dob proof",
				"birth dakhla",
				"janam dakhla"
			],
			primary: [
				"birth",
				"janma",
				"brt",
				"janam"
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
			patterns: [/\b(fee|fees|tuition)\s*(receipt|reciept|risit|slip|challan|payment)\b/i, /\b(fee|fees)\b/i],
			tokens: [
				"fee receipt",
				"admission fee receipt",
				"tuition fee",
				"fee",
				"fee risit",
				"fees receipt"
			],
			primary: ["fee", "fees"],
			qualifier: [
				"receipt",
				"reciept",
				"risit",
				"slip",
				"payment"
			]
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
				"hostel",
				"vasatigruh dakhla"
			],
			primary: ["hostel", "vasatigruh"]
		},
		{
			type: "DEATH CERTIFICATE",
			code: "DTH",
			tokens: [
				"death certificate",
				"father death certificate",
				"mrutyu pramanpatra",
				"death",
				"mrutyu dakhla"
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
				"pwd",
				"divyang cert"
			],
			primary: [
				"disability",
				"divyang",
				"dis",
				"pwd"
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
			primary: [
				"apaar",
				"apr",
				"abc"
			]
		},
		{
			type: "CET APPLICATION FORM",
			code: "CETAF",
			tokens: [
				"cet application form",
				"cet application confirmation",
				"cap registration form",
				"cetaf",
				"cet aplication form"
			],
			primary: [
				"cetaf",
				"cet application",
				"aplication"
			]
		},
		{
			type: "CET SCORE CARD",
			code: "CETSC",
			tokens: [
				"cet score card",
				"cet result",
				"scorecard",
				"neet score card",
				"cetsc",
				"cet score kard"
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
				"ews",
				"ews dakhla"
			],
			primary: ["ews"]
		},
		{
			type: "MIGRATION CERTIFICATE",
			code: "MIG",
			tokens: [
				"migration certificate",
				"migration",
				"mig",
				"migrashan cert"
			],
			primary: [
				"migration",
				"mig",
				"migrashan"
			]
		},
		{
			type: "MEDICAL FITNESS CERTIFICATE",
			code: "MED",
			tokens: [
				"medical fitness certificate",
				"fitness certificate",
				"health certificate",
				"med",
				"medical fitnes",
				"arogya dakhla"
			],
			primary: [
				"fitness",
				"medical",
				"med",
				"arogya"
			]
		},
		{
			type: "VOTER ID",
			code: "VOT",
			tokens: [
				"voter id",
				"election card",
				"epic",
				"vot",
				"woter id",
				"woter"
			],
			primary: [
				"voter",
				"vot",
				"woter"
			]
		},
		{
			type: "DRIVING LICENSE",
			code: "DL",
			tokens: [
				"driving license",
				"dl",
				"licence",
				"license",
				"drivin lisence"
			],
			primary: [
				"driving",
				"license",
				"dl",
				"drivin"
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
				"1ym",
				"1st year markshit",
				"fy markshit"
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
				"2ym",
				"2nd year markshit",
				"sy markshit"
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
				"3ym",
				"3rd year markshit",
				"ty markshit"
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
				"deg",
				"digree convocation"
			],
			primary: [
				"degree",
				"deg",
				"digree"
			]
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
			let n = (t.code || Array.isArray(t) && t[2] || "").toUpperCase(), r = t.keywords || Array.isArray(t) && t[1] || [], i = Array.isArray(r) ? r : typeof r == "string" ? r.split(",").map((e) => e.trim()) : [], a = m.find((t) => t.type === e || t.code && n && t.code.toUpperCase() === n);
			if (a) a.type = e, a.code = n, a.tokens = [e.toLowerCase(), ...i.map((e) => e.toLowerCase())];
			else {
				let t = V(e), r = _e(t), a = r.size > 0 ? Array.from(r)[0] : null;
				m.push({
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
	let h = null, g = 0;
	for (let e of m) {
		if (ve(d, e.standard ? /* @__PURE__ */ new Set([e.standard]) : _e(V(e.type))) || e.type === "CASTE CERTIFICATE" && (/\b(validity|validiti|padtalni|padtalani|cvc|val)\b/i.test(s) || /\b(validity|validiti|padtalni|cvc|val)\b/i.test(a) || u.some((e) => [
			"validity",
			"validiti",
			"padtalni",
			"cvc"
		].includes(e)))) continue;
		let t = 0;
		if (e.patterns) {
			for (let n of e.patterns) if (n.test(s) || n.test(a)) {
				t = Math.max(t, 90);
				break;
			}
		}
		if (e.tokens) for (let n of e.tokens) {
			let e = n.toLowerCase().trim();
			if (!e) continue;
			let r = H(e);
			if (e.length <= 3) {
				let n = RegExp(`(^|[^a-z0-9])${e}([^a-z0-9]|$)`, "i");
				if (n.test(s) || n.test(a)) {
					t = Math.max(t, 90);
					break;
				}
			} else if (s.includes(e) || a.includes(e) || a.includes(r)) {
				t = Math.max(t, 90);
				break;
			}
		}
		let n = V(e.type);
		if (n.length > 0) {
			let e = 0, r = 0;
			for (let t of n) {
				let n = ge(t);
				if (n) {
					d.has(n) && (e++, r += 1);
					continue;
				}
				if ([
					"and",
					"for",
					"the",
					"of"
				].includes(t)) {
					e++, r += 1;
					continue;
				}
				let i = 0;
				for (let e of u) {
					if (e === t) {
						i = 1;
						break;
					}
					let n = H(e), r = H(t);
					(n === r || e === r || n === t) && (i = Math.max(i, .95));
					let a = be(e, t);
					a > i && (i = a);
					let o = me(e, t);
					o > i && (i = o);
				}
				i >= .8 && (e++, r += i);
			}
			if (e === n.length && n.length > 0) {
				let e = r / n.length, i = e >= .98 ? 95 : Math.round(e >= .85 ? 85 + (e - .85) * 50 : 80 + (e - .8) * 50);
				t = Math.max(t, i);
			} else e >= 1 && n.length <= 2 && ![
				"card",
				"certificate",
				"receipt",
				"form",
				"letter"
			].includes(n[0]) && u.some((e) => e === n[0] || be(e, n[0]) >= .85 || H(e) === n[0]) && (t = Math.max(t, 85));
		}
		if (e.primary && e.qualifier) {
			let n = e.primary.some((e) => u.some((t) => t === e || be(t, e) >= .85 || H(t) === e || me(t, e) >= .8)), r = e.qualifier.some((e) => {
				let t = RegExp(`(^|[^a-z0-9])${e}([^a-z0-9]|$)`, "i");
				return t.test(s) || t.test(a);
			});
			n && r ? t = Math.max(t, 90) : n && !r && !e.standard && (t = Math.max(t, 50));
		} else e.primary && e.primary.some((e) => u.some((t) => t === e || be(t, e) >= .85 || H(t) === e || me(t, e) >= .8)) && (t = Math.max(t, 85));
		t > g && (g = t, h = e);
	}
	if (t && t.trim() && g > 0 && t.trim().toLowerCase().split(/\s+/).filter((e) => e.length > 2).some((e) => s.includes(e) || a.includes(e)) && (g = Math.min(100, g + 5)), h && g >= 50) {
		let e = h.type.toUpperCase(), n = w[e] || e, r = n.toUpperCase(), a = i.toUpperCase().replace(/\s+/g, " ").trim(), o = !1;
		if (t && t.trim()) {
			let n = t.trim().toUpperCase().replace(/\s+/g, " ");
			(a === `${r} ${n}` || a === `${e} ${n}`) && (o = !0);
		}
		o || a !== r && a !== e || (o = !0);
		let s = o ? 100 : g;
		return {
			docType: h.type,
			canonical: n,
			code: h.code || null,
			confidence: s,
			isConfident: s >= 80,
			reason: o ? "Exact match" : s >= 85 ? `Indian Phonetic match (${s}%)` : `Filename token match (${s}%)`
		};
	}
	return {
		docType: null,
		canonical: null,
		code: null,
		confidence: g,
		isConfident: !1,
		reason: "Below 50% threshold"
	};
}
function U(e) {
	return e ? String(e).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;") : "";
}
function Se(e, t, n = "") {
	let r = F(e), i = F(t);
	if (r === i) return {
		oldHtml: U(r),
		newHtml: U(i),
		isIdentical: !0,
		changeType: "identical"
	};
	let a = r.toLowerCase() === i.toLowerCase(), o = (n || "").replace(/\.[a-zA-Z0-9]+$/i, "").trim(), s = r.split(/(\s+|[_\-]+)/), c = i.split(/(\s+|[_\-]+)/), l = new Set(r.toLowerCase().split(/[\s_\-]+/).filter(Boolean)), u = new Set(i.toLowerCase().split(/[\s_\-]+/).filter(Boolean)), d = new Set(o ? o.toLowerCase().split(/[\s_\-]+/).filter(Boolean) : []), f = s.map((e) => {
		if (!e.trim() || /^[_\-]+$/.test(e)) return U(e);
		let t = e.toLowerCase();
		return u.has(t) ? `<span class="text-secondary">${U(e)}</span>` : `<span class="diff-del">${U(e)}</span>`;
	}), p = [], m = o.toLowerCase(), h = i;
	if (o && h.toLowerCase().includes(m)) {
		let e = h.toLowerCase().indexOf(m), t = h.slice(0, e), n = h.slice(e, e + m.length), r = h.slice(e + m.length), i = (e) => e.split(/(\s+|[_\-]+)/).map((e) => {
			if (!e.trim() || /^[_\-]+$/.test(e)) return U(e);
			let t = e.toLowerCase();
			return l.has(t) ? `<span class="text-on-surface font-semibold">${U(e)}</span>` : `<span class="diff-add">${U(e)}</span>`;
		}).join("");
		p.push(i(t)), p.push(`<span class="diff-student">${U(n)}</span>`), p.push(i(r));
	} else p = c.map((e) => {
		if (!e.trim() || /^[_\-]+$/.test(e)) return U(e);
		let t = e.toLowerCase();
		return d.has(t) ? `<span class="diff-student">${U(e)}</span>` : l.has(t) ? `<span class="text-on-surface font-semibold">${U(e)}</span>` : `<span class="diff-add">${U(e)}</span>`;
	});
	let g = "rename";
	return a ? g = "casing" : o && i.toLowerCase().includes(m) && !r.toLowerCase().includes(m) && (g = "student"), {
		oldHtml: f.join(""),
		newHtml: p.join(""),
		isIdentical: !1,
		changeType: g
	};
}
function Ce(e, t, n = {}) {
	let { order: r = "doc_student", separator: i = " ", includeStudent: a = !0, casing: o = "upper" } = n, s = (e || "").trim(), c = (t || "").trim(), l = [];
	return l = a && c ? r === "student_doc" ? [c, s] : [s, c] : [s], I(l.filter(Boolean).join(i), o);
}
function we(e) {
	if (!e) return "";
	let t = F(e);
	return t = t.replace(/WhatsApp\s*Image\s*\d{4}[-_]\d{2}[-_]\d{2}\s*(at\s*[\d\.]+)?/gi, ""), t = t.replace(/(IMG|VID|DOC)[-_]\d{8}[-_]\d{4,6}/gi, ""), t = t.replace(/\bSCAN\s*\(\d+\)/gi, ""), t = t.replace(/\bSCAN[-_]?\d+/gi, ""), t = t.replace(/\(\s*\)/g, ""), t = t.replace(/[_\-]+/g, " "), t = t.replace(/\s+/g, " ").trim(), t;
}
function Te(e) {
	if (!e) return "";
	let t = F(e);
	return t = t.replace(/[^a-zA-Z0-9\s\-_]/g, " "), t = t.replace(/\s+/g, " ").trim(), t;
}
function Ee(e, t, n = "") {
	if (!e || !t) return 0;
	let r = F(e).trim(), i = F(t).trim(), a = (n || "").trim();
	if (a) {
		let e = a.toLowerCase();
		if (!r.toLowerCase().includes(e)) {
			let e = a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
			i = i.replace(RegExp(`\\s*${e}\\s*`, "i"), " ").trim();
		}
	}
	let o = r.toLowerCase().replace(/(\d+)\s+(th|st|nd|rd)\b/gi, "$1$2").replace(/\bmark\s+sheet\b/gi, "marksheet").replace(/[\s_\-]+/g, " ").trim(), s = i.toLowerCase().replace(/(\d+)\s+(th|st|nd|rd)\b/gi, "$1$2").replace(/\bmark\s+sheet\b/gi, "marksheet").replace(/[\s_\-]+/g, " ").trim();
	if (!o || !s || o === s) return 0;
	let c = pe(o, s), l = Math.max(o.length, s.length);
	if (l === 0) return 0;
	let u = Math.round(c / l * 100);
	return Math.min(100, Math.max(0, u));
}
function De(e) {
	let t = /* @__PURE__ */ new Map();
	if (!Array.isArray(e) || e.length === 0) return t;
	e.forEach((e) => {
		let n = e.id || e.name;
		t.set(n, {
			status: null,
			isMaster: !1,
			reason: ""
		});
	});
	let n = (e, t) => {
		let n = e.findIndex((e) => {
			let n = t(e);
			return !/[\s_\-]+(\d+|\(\d+\))(?=\s|$)/i.test(n);
		});
		return n >= 0 ? n : 0;
	}, r = /* @__PURE__ */ new Map();
	e.forEach((e) => {
		let t = Number(e.size) || 0, n = (e.ext || P(e.name) || "").toLowerCase();
		if (t > 0 && n) {
			let i = `${t}_${n}`;
			r.has(i) || r.set(i, []), r.get(i).push(e);
		}
	}), r.forEach((e) => {
		if (e.length >= 2) {
			let r = n(e, (e) => F(e.targetName || e.name || ""));
			e.forEach((e, n) => {
				let i = e.id || e.name;
				if (n === r) {
					let e = t.get(i);
					e && (e.isMaster = !0);
				} else {
					let e = t.get(i);
					e && e.status === "confirmed" || t.set(i, {
						status: "probable",
						isMaster: !1,
						reason: "Same file size & extension"
					});
				}
			});
		}
	});
	let i = /* @__PURE__ */ new Map();
	e.forEach((e) => {
		e.sha256 && (i.has(e.sha256) || i.set(e.sha256, []), i.get(e.sha256).push(e));
	}), i.forEach((e) => {
		if (e.length >= 2) {
			let r = n(e, (e) => F(e.targetName || e.name || ""));
			e.forEach((e, n) => {
				let i = e.id || e.name;
				if (n === r) {
					let e = t.get(i);
					e && (e.isMaster = !0, e.status = null);
				} else t.set(i, {
					status: "confirmed",
					isMaster: !1,
					reason: "Identical SHA-256 content hash"
				});
			});
		}
	});
	let a = /* @__PURE__ */ new Map();
	return e.forEach((e) => {
		let t = F(e.targetName || e.name || ""), n = t.toLowerCase().replace(/[\s_\-]+(\d+|\(\d+\))(?=\s|$)/gi, "").replace(/[\s_\-]+/g, " ").trim(), r = `${n}|${(e.ext || P(e.name) || "").toLowerCase()}`;
		n.length >= 1 && (a.has(r) || a.set(r, []), a.get(r).push({
			file: e,
			originalName: t
		}));
	}), a.forEach((e) => {
		if (e.length >= 2) {
			let r = e.some((e) => /[\s_\-]+(\d+|\(\d+\))(?=\s|$)/i.test(e.originalName)), i = e.some((t, n) => e.some((e, r) => n !== r && t.file.size > 0 && t.file.size === e.file.size));
			if (r || i) {
				let r = n(e, (e) => e.originalName);
				e.forEach((e, n) => {
					let i = e.file.id || e.file.name;
					if (n === r) {
						let e = t.get(i);
						e && (e.isMaster = !0, e.status = null);
					} else t.set(i, {
						status: "confirmed",
						isMaster: !1,
						reason: "Canonical base document collision"
					});
				});
			}
		}
	}), t;
}
// src/core/constants.js
var Oe = {
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
}, ke = [
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
], Ae = "2026.11.passing_canonical_v2", W = {
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
}, je = {
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
}, G = {
	name: "BulkStudentRenamerSettingsDB",
	version: 1,
	store: "settings",
	key: "current"
}, Me = [
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
function Ne(e = Me) {
	let t = {};
	for (let n of e) t[n.outputName] = [n.primaryShortcut.toLowerCase(), ...(n.alternateKeywords || []).map((e) => e.toLowerCase())];
	return t;
}
// src/libraries/checklist-library.js
function Pe(e) {
	return Object.fromEntries(Object.entries(e).map(([e, t]) => [e, t.map((e) => Array.isArray(e) ? {
		name: e[0],
		keywords: e[1],
		short: e[0].replace(/ CERTIFICATE| MARK SHEET| MARKSHEET/g, "").slice(0, 18)
	} : e)]));
}
// src/services/storage-service.js
var Fe = "v3_exact_single", Ie = Ne(), Le = {}, K = (e, t) => {
	try {
		if (typeof localStorage < "u" && localStorage.getItem) {
			let t = localStorage.getItem(e);
			if (t) return JSON.parse(t);
		}
	} catch {}
	return Le[e] === void 0 ? t : Le[e];
}, q = (e, t) => {
	try {
		typeof localStorage < "u" && localStorage.setItem && localStorage.setItem(e, JSON.stringify(t));
	} catch {}
	Le[e] = t;
}, Re = (e) => {
	let t = {};
	Object.entries(e || {}).forEach(([e, n]) => {
		let r = /^12\s*LC$/i.test(e) || e === "12TH LEAVING CERTIFICATE" ? "12TH LC" : e;
		t[r] = [...t[r] || [], ...Array.isArray(n) ? n : []].filter((e, t, n) => n.indexOf(e) === t);
	});
	let n = {};
	return Object.entries(t).forEach(([e, r]) => {
		e !== "12TH MARKSHEET AND PASSING" && (n[e] = r, e === "12TH PASSING CERTIFICATE" && t["12TH MARKSHEET AND PASSING"] && (n["12TH MARKSHEET AND PASSING"] = t["12TH MARKSHEET AND PASSING"]));
	}), n;
}, ze = (e) => {
	let t = e.name === "12TH LEAVING CERTIFICATE" ? "12TH LC" : e.name;
	return {
		...e,
		name: t,
		keywords: [...new Set(e.keywords || [])],
		short: e.short || t.slice(0, 18)
	};
}, Be = (e) => {
	let t = e.filter((e) => e.name === "12TH MARKSHEET AND PASSING");
	if (!t.length) return e;
	let n = e.filter((e) => e.name !== "12TH MARKSHEET AND PASSING"), r = n.findIndex((e) => e.name === "12TH PASSING CERTIFICATE");
	return n.splice(r < 0 ? n.length : r + 1, 0, ...t), n;
}, Ve = (e) => {
	let t = Pe(W), n = e || {}, r = {};
	return Object.keys(t).forEach((e) => {
		let i = Array.isArray(n[e]) ? n[e].map(ze) : [], a = new Map(i.map((e) => [e.name.toUpperCase(), e]));
		t[e].forEach((e) => {
			let t = ze(e);
			a.has(t.name.toUpperCase()) || i.push(t);
		}), r[e] = Be(i);
	}), Object.entries(n).forEach(([e, t]) => {
		r[e] || (r[e] = Be(t.map(ze)));
	}), r;
};
function He() {
	let e = localStorage.getItem("dictVersion"), t, n;
	e === Fe ? (t = Re(K("renameSettings", Ie)), n = K("renameProfiles", { Default: Ie })) : (t = Ie, n = { Default: Ie }, q("renameSettings", t), q("renameProfiles", n), localStorage.setItem("dictVersion", Fe));
	let r = localStorage.getItem("checklistVersion"), i;
	r === "2026.11.passing_canonical_v2" ? i = Ve(K("checklists", null)) : (i = Pe(W), q("checklists", i), localStorage.setItem("checklistVersion", Ae));
	let a = {
		...Oe,
		...K("spellingCorrections", {}) || {}
	}, o = K("linkedRules", ke);
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
function Ue() {
	return new Promise((e, t) => {
		if (!("indexedDB" in window)) return t(/* @__PURE__ */ Error("IndexedDB unavailable"));
		let n = indexedDB.open(G.name, G.version);
		n.onupgradeneeded = () => {
			n.result.objectStoreNames.contains(G.store) || n.result.createObjectStore(G.store);
		}, n.onsuccess = () => e(n.result), n.onerror = () => t(n.error || /* @__PURE__ */ Error("IndexedDB open failed"));
	});
}
function We(e) {
	return Ue().then((t) => new Promise((n, r) => {
		let i = t.transaction(G.store, "readwrite");
		i.objectStore(G.store).put(e, G.key), i.oncomplete = () => n(!0), i.onerror = () => r(i.error);
	}));
}
function Ge(e) {
	let t = {
		groups: e.groups,
		checklists: e.checklists,
		spelling: e.spelling,
		profiles: e.profiles,
		linkedRules: e.linkedRules,
		style: e.style,
		savedAt: (/* @__PURE__ */ new Date()).toISOString()
	};
	q("renameSettings", t.groups), q("checklists", t.checklists), q("spellingCorrections", t.spelling), q("renameProfiles", t.profiles), q("linkedRules", t.linkedRules), localStorage.setItem("nameStyle", t.style), We(t).catch(() => {});
}
async function Ke() {
	if (typeof window < "u" && window.DOCMITRA_ENABLE_REMOTE_BACKEND) try {
		let e = await (await fetch("http://localhost:3000/api/load-document-presets")).json();
		if (e && e.success && e.data && e.data.forms) return e.data;
	} catch (e) {
		console.warn("[StorageService] Failed to load document presets from backend:", e);
	}
	return K("documentPresets", { forms: W });
}
async function qe(e) {
	if (q("documentPresets", e), typeof window < "u" && window.DOCMITRA_ENABLE_REMOTE_BACKEND) try {
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
var Je = "studentDocumentFollowUps", Ye = [];
function J() {
	try {
		if (typeof localStorage < "u") {
			let e = localStorage.getItem(Je);
			return e ? JSON.parse(e) : [];
		}
		return Ye;
	} catch {
		return Ye;
	}
}
function Xe(e) {
	try {
		Ye = e, typeof localStorage < "u" && localStorage.setItem(Je, JSON.stringify(e));
	} catch (e) {
		console.error("Failed to save follow-ups:", e);
	}
}
function Ze({ folderName: e, studentName: t, documentName: n, promisedDate: r, note: i = "" }) {
	let a = J(), o = (e || "").trim(), s = (n || "").trim().toUpperCase(), c = (t || e || "").trim(), l = a.findIndex((e) => e.folderName.toLowerCase() === o.toLowerCase() && e.documentName.toUpperCase() === s && e.status === "pending"), u = Date.now();
	if (l >= 0) return a[l].promisedDate = r, a[l].note = i, a[l].updatedAt = u, Xe(a), a[l];
	let d = {
		id: `fu_${u}_${Math.random().toString(36).slice(2, 7)}`,
		folderName: o,
		studentName: c,
		documentName: s,
		promisedDate: r || rt(),
		note: i || "",
		status: "pending",
		createdAt: u,
		resolvedAt: null
	};
	return a.push(d), Xe(a), d;
}
function Qe(e, t) {
	let n = J(), r = (e || "").trim().toLowerCase(), i = (t || "").trim().toUpperCase(), a = !1;
	return n.forEach((e) => {
		e.folderName.trim().toLowerCase() === r && e.documentName.trim().toUpperCase() === i && e.status === "pending" && (e.status = "resolved", e.resolvedAt = Date.now(), a = !0);
	}), a && Xe(n), a;
}
function $e(e, t) {
	let n = J(), r = (e || "").trim().toLowerCase(), i = (t || "").trim().toUpperCase();
	return n.find((e) => e.folderName.trim().toLowerCase() === r && e.documentName.trim().toUpperCase() === i && e.status === "pending") || null;
}
function et(e, t = nt()) {
	let n = it(e, t);
	return n < 0 ? "overdue" : n === 0 ? "today" : "upcoming";
}
function tt(e) {
	if (!e) return "";
	let t = e.split("-");
	return t.length === 3 ? new Date(Number(t[0]), Number(t[1]) - 1, Number(t[2])).toLocaleDateString("en-IN", {
		day: "numeric",
		month: "short",
		year: "numeric"
	}) : e;
}
function nt() {
	let e = /* @__PURE__ */ new Date();
	return `${e.getFullYear()}-${String(e.getMonth() + 1).padStart(2, "0")}-${String(e.getDate()).padStart(2, "0")}`;
}
function rt(e = 1) {
	let t = /* @__PURE__ */ new Date();
	return t.setDate(t.getDate() + e), `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}
function it(e, t) {
	return e === t ? 0 : e < t ? -1 : 1;
}
// tools/rename_tool/missing_documents_modal.js
function at(e, t) {
	let n = String(e || "").trim(), r = String(t || "").trim();
	return n.localeCompare(r, void 0, {
		numeric: !0,
		sensitivity: "base"
	});
}
function ot({ studentName: e = "Student", folderPath: t = "", activePreset: n = "MAHA DBT", presentCount: r = 0, totalCount: i = 0, percent: a = 100, missingRules: o = [], presentDocs: s = [], followupMap: c = {} }) {
	let l = /* @__PURE__ */ new Date(), u = (e) => String(e).padStart(2, "0"), d = `${u(l.getDate())}-${u(l.getMonth() + 1)}-${l.getFullYear()}`, f = l.getHours(), p = f >= 12 ? "PM" : "AM";
	f = f % 12 || 12;
	let m = `${u(f)}:${u(l.getMinutes())} ${p}`, h = "=".repeat(76), g = "-".repeat(76), _ = "";
	return _ += `${h}\n`, _ += `STUDENT / FOLDER NAME : ${e.toUpperCase()}\n`, _ += `${h}\n`, t && (_ += `Folder Path           : ${t}\n`), _ += `Report Date & Time    : ${d}, ${m}\n`, _ += `Active Scheme/Preset  : ${n}\n`, _ += `Application Status    : ${r} of ${i} Documents Staged (${a}% Verified)\n`, _ += "\n", _ += `${g}\n`, _ += `❌ MISSING DOCUMENTS (${o.length} Required):\n`, _ += `${g}\n`, o.length === 0 ? _ += "  🎉 All required documents have been verified and staged in this folder!\n" : o.forEach((e, t) => {
		let n = typeof e == "string" ? e : e.name || "", r = String(t + 1).padStart(2, " "), i = c && c[n] ? ` [Follow-up Promise Date: ${c[n]}]` : "";
		_ += `  ${r}. ${n}${i}\n`;
	}), _ += "\n", _ += `${g}\n`, _ += `✅ PRESENT DOCUMENTS IN FOLDER (${s.length} Verified / Ready):\n`, _ += `${g}\n`, s.length === 0 ? _ += "  (No verified documents found in folder yet)\n" : s.forEach((e, t) => {
		let n = e.docType || e.name || "Document", r = String(t + 1).padStart(2, " "), i = (e.ext || (e.name ? e.name.split(".").pop() : "PDF")).toUpperCase().replace(".", ""), a = st(e.size), o = e.isCombined ? " (via Combined)" : "";
		_ += `  ${r}. ${n} [${i}, ${a}]${o}\n`;
	}), _ += "\n", _ += `${h}\n`, _ += "Generated by DocMitra Suite — Administrative Bento Workstation\n", _ += `${h}\n`, _;
}
function Y(e) {
	return e ? String(e).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;") : "";
}
function st(e) {
	return !e || e <= 0 ? "0 KB" : `${Math.round(e / 1024)} KB`;
}
function ct(e) {
	if (!e) {
		let e = /* @__PURE__ */ new Date();
		return `${String(e.getDate()).padStart(2, "0")}-${String(e.getMonth() + 1).padStart(2, "0")}-${e.getFullYear()}`;
	}
	let t = new Date(e);
	return isNaN(t.getTime()) ? "25-11-2026" : `${String(t.getDate()).padStart(2, "0")}-${String(t.getMonth() + 1).padStart(2, "0")}-${t.getFullYear()}`;
}
var lt = class {
	constructor(e = {}) {
		this.container = e.container || document.body, this.onImportFile = e.onImportFile || (() => {}), this.onSetFollowup = e.onSetFollowup || (() => {}), this.onPresetChange = e.onPresetChange || (() => {}), this.onRenameFolder = e.onRenameFolder || (() => {}), this.onViewDocument = e.onViewDocument || (() => {}), this.onClose = e.onClose || (() => {}), this.modalEl = null, this.contentEl = null, this.quickPreviewEl = null, this.deskNotepadEl = null, this.isOpen = !1, this.currentProps = null, this._handleKeydown = this._handleKeydown.bind(this);
	}
	mount() {
		if (this.modalEl) return;
		let e = document.createElement("div");
		e.id = "modalMissingDocumentsDesk", e.className = "rename-tool-scope fixed inset-0 z-[1050] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 hidden select-none animate-in fade-in duration-150", e.innerHTML = "\n      <div class=\"relative w-full max-w-[1040px] max-h-[94vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto transition-all duration-300\">\n        <div id=\"missingModalContent\" class=\"flex flex-col h-full overflow-hidden\"></div>\n\n        <!-- In-Modal Quick Preview Overlay (Choice 3-C) -->\n        <div id=\"inModalQuickPreview\" class=\"hidden absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center p-4\">\n          <div class=\"relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-200\">\n            <div class=\"px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between\">\n              <div class=\"flex items-center gap-2 min-w-0\">\n                <span class=\"material-symbols-outlined text-primary text-[20px] shrink-0\">visibility</span>\n                <span id=\"quickPreviewTitle\" class=\"font-heading font-bold text-sm text-slate-900 truncate\">Document Preview</span>\n              </div>\n              <div class=\"flex items-center gap-2 shrink-0\">\n                <button id=\"btnQuickPreviewClose\" type=\"button\" class=\"p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition cursor-pointer\" title=\"Close Preview (Esc)\">\n                  <span class=\"material-symbols-outlined text-[20px]\">close</span>\n                </button>\n              </div>\n            </div>\n            <div id=\"quickPreviewBody\" class=\"flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-100 min-h-[360px]\">\n              <!-- Dynamic image or PDF canvas rendered here -->\n            </div>\n          </div>\n        </div>\n\n        <!-- In-Modal Document Desk Report Notepad Overlay (Choice 1-A) -->\n        <div id=\"inModalDeskNotepad\" class=\"hidden absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center p-3 sm:p-5\">\n          <div class=\"relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] border border-slate-200\">\n            <!-- Notepad Header -->\n            <div class=\"px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3\">\n              <div class=\"flex items-center gap-2.5 min-w-0\">\n                <span class=\"w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base shrink-0 shadow-2xs\">📝</span>\n                <div class=\"min-w-0\">\n                  <h3 class=\"font-heading font-extrabold text-sm sm:text-base text-slate-900 leading-snug truncate\">\n                    Document Desk Report — <span id=\"notepadStudentHeader\" class=\"text-blue-700 font-extrabold uppercase\"></span>\n                  </h3>\n                </div>\n              </div>\n              <div class=\"flex items-center gap-2 shrink-0\">\n                <button id=\"btnNotepadCopy\" type=\"button\" class=\"inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition cursor-pointer active:scale-95 shadow-2xs\" title=\"Copy entire report to clipboard\">\n                  <span class=\"material-symbols-outlined text-[16px]\">content_copy</span>\n                  <span>Copy Report</span>\n                </button>\n                <button id=\"btnNotepadSave\" type=\"button\" class=\"inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition cursor-pointer active:scale-95 shadow-2xs\" title=\"Save report as .txt file in student folder\">\n                  <span class=\"material-symbols-outlined text-[16px]\">save</span>\n                  <span>Save .txt</span>\n                </button>\n                <button id=\"btnNotepadOpenSystem\" type=\"button\" class=\"inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-300 transition cursor-pointer active:scale-95 shadow-2xs\" title=\"Open in Windows Notepad (notepad.exe)\">\n                  <span class=\"material-symbols-outlined text-[16px]\">open_in_new</span>\n                  <span>Windows Notepad</span>\n                </button>\n                <button id=\"btnNotepadClose\" type=\"button\" class=\"p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition cursor-pointer ml-1\" title=\"Close Notepad (Esc)\">\n                  <svg class=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">\n                    <path d=\"M6 18L18 6M6 6l12 12\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n                  </svg>\n                </button>\n              </div>\n            </div>\n\n            <!-- Notepad Textarea Body -->\n            <div class=\"flex-1 p-4 bg-slate-100 overflow-hidden flex flex-col min-h-[360px]\">\n              <textarea id=\"notepadReportContent\" readonly class=\"w-full flex-1 min-h-[340px] font-mono text-[12px] sm:text-[13px] text-slate-800 bg-white p-4 rounded-xl border border-slate-300 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed custom-scroll select-text\" placeholder=\"Generating document checklist report...\"></textarea>\n            </div>\n\n            <!-- Notepad Footer -->\n            <div class=\"px-5 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500\">\n              <span id=\"notepadReportStats\" class=\"font-medium\">Ready</span>\n              <span class=\"font-mono text-[11px] text-slate-400\">DocMitra Administrative Bento Report</span>\n            </div>\n          </div>\n        </div>\n      </div>\n    ", this.container.appendChild(e), this.modalEl = e, this.contentEl = e.querySelector("#missingModalContent"), this.quickPreviewEl = e.querySelector("#inModalQuickPreview"), this.deskNotepadEl = e.querySelector("#inModalDeskNotepad"), this.modalEl.addEventListener("click", (e) => {
			e.target === this.modalEl && (this.deskNotepadEl && !this.deskNotepadEl.classList.contains("hidden") ? this.closeNotepad() : this.quickPreviewEl.classList.contains("hidden") ? this.close() : this.closeQuickPreview());
		});
		let t = e.querySelector("#btnQuickPreviewClose");
		t && (t.onclick = () => this.closeQuickPreview());
		let n = e.querySelector("#btnNotepadClose");
		n && (n.onclick = () => this.closeNotepad());
		let i = e.querySelector("#btnNotepadCopy");
		i && (i.onclick = async () => {
			let t = e.querySelector("#notepadReportContent"), n = t ? t.value : "";
			try {
				await navigator.clipboard.writeText(n), r.show("Report Copied", "Student report copied to clipboard.", "success");
			} catch {
				t && (t.select(), document.execCommand("copy"), r.show("Report Copied", "Student report copied to clipboard.", "success"));
			}
		});
		let a = e.querySelector("#btnNotepadSave");
		a && (a.onclick = async () => {
			let t = e.querySelector("#notepadReportContent"), n = t ? t.value : "", { studentName: i = "Student", folderPath: a = "" } = this.currentProps || {}, o = `${i.replace(/[^a-zA-Z0-9_\-\s]/g, "").trim().replace(/\s+/g, "_") || "STUDENT"}_DOCUMENT_REPORT.txt`, s = !1;
			if (a) {
				let e = `${a.replace(/[\\/]+$/, "")}\\${o}`;
				try {
					let t = new TextEncoder().encode(n);
					await v(e, Array.from(t)) && (s = !0, r.show("Report Saved", `Saved to ${o}`, "success"));
				} catch (e) {
					console.warn("[MissingDesk] Failed to write report file directly:", e);
				}
			}
			if (!s) {
				let e = new Blob([n], { type: "text/plain;charset=utf-8" }), t = URL.createObjectURL(e), i = document.createElement("a");
				i.href = t, i.download = o, document.body.appendChild(i), i.click(), setTimeout(() => {
					document.body.removeChild(i), URL.revokeObjectURL(t);
				}, 100), r.show("Report Downloaded", `Downloaded ${o}`, "success");
			}
		});
		let o = e.querySelector("#btnNotepadOpenSystem");
		o && (o.onclick = async () => {
			let t = e.querySelector("#notepadReportContent"), n = t ? t.value : "", { studentName: i = "Student", folderPath: a = "" } = this.currentProps || {}, o = `${i.replace(/[^a-zA-Z0-9_\-\s]/g, "").trim().replace(/\s+/g, "_") || "STUDENT"}_DOCUMENT_REPORT.txt`, s = "";
			s = a ? `${a.replace(/[\\/]+$/, "")}\\${o}` : `C:\\Windows\\Temp\\${o}`;
			try {
				let e = new TextEncoder().encode(n);
				await v(s, Array.from(e)), await b(s), r.show("Opening Notepad", "Opening report in Windows Notepad...", "info");
			} catch (e) {
				console.warn("[MissingDesk] Failed to launch Notepad via Explorer:", e), r.show("Notice", "Report copied to clipboard. Paste into Notepad.", "info");
			}
		});
	}
	open(e) {
		this.mount(), this.currentProps = e, this.isOpen = !0, this.modalEl.classList.remove("hidden"), document.addEventListener("keydown", this._handleKeydown), this.render();
	}
	close() {
		this.isOpen && (this.isOpen = !1, this.modalEl && (this.modalEl.classList.add("hidden"), this.closeQuickPreview(), this.closeNotepad()), document.removeEventListener("keydown", this._handleKeydown), this.onClose());
	}
	closeNotepad() {
		this.deskNotepadEl && this.deskNotepadEl.classList.add("hidden");
	}
	showNotepadReport() {
		if (!this.deskNotepadEl || !this.currentProps) return;
		let { studentName: e = "Student", folderPath: t = "", activePreset: n = "MAHA DBT", missingRules: r = [], presentDocs: i = [], followupMap: a = {}, totalRequiredCount: o = 0 } = this.currentProps, s = i.length, c = r.length, l = o || s + c, u = l > 0 ? Math.round(s / l * 100) : 100, d = ot({
			studentName: e,
			folderPath: t,
			activePreset: n,
			presentCount: s,
			totalCount: l,
			percent: u,
			missingRules: r,
			presentDocs: i,
			followupMap: a
		}), f = this.deskNotepadEl.querySelector("#notepadStudentHeader");
		f && (f.textContent = e.toUpperCase());
		let p = this.deskNotepadEl.querySelector("#notepadReportContent");
		p && (p.value = d);
		let m = this.deskNotepadEl.querySelector("#notepadReportStats");
		m && (m.textContent = `${s} Present • ${c} Missing • ${u}% Verified`), this.deskNotepadEl.classList.remove("hidden"), p && (p.focus(), p.select());
	}
	closeQuickPreview() {
		if (this.quickPreviewEl) {
			this.quickPreviewEl.classList.add("hidden");
			let e = this.quickPreviewEl.querySelector("#quickPreviewBody");
			e && (e.innerHTML = "");
		}
	}
	async showQuickPreview(e) {
		if (!this.quickPreviewEl) return;
		let t = this.quickPreviewEl.querySelector("#quickPreviewTitle"), n = this.quickPreviewEl.querySelector("#quickPreviewBody"), r = e.docType || e.name || "Document";
		if (t && (t.textContent = `${r} • ${st(e.size)}`), !n) return;
		n.innerHTML = "\n      <div class=\"flex flex-col items-center justify-center p-8 gap-2 text-slate-500 text-xs font-mono\">\n        <span class=\"material-symbols-outlined text-[28px] animate-spin text-blue-600\">sync</span>\n        <span>Loading document preview...</span>\n      </div>\n    ", this.quickPreviewEl.classList.remove("hidden");
		let i = (e.ext || (e.name ? e.name.split(".").pop() : "pdf")).toLowerCase().replace(".", ""), a = [
			"jpg",
			"jpeg",
			"png",
			"webp",
			"gif",
			"bmp"
		].includes(i), o = i === "pdf", s = e.rotation || 0, c = document.createElement("div");
		c.className = "bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden flex items-center justify-center relative p-2 transition-transform duration-200", c.style.maxHeight = "65vh", c.style.maxWidth = "100%", s && (c.style.transform = `rotate(${s}deg)`);
		let l = async (t) => {
			if (!window.pdfjsLib) n.innerHTML = "<div class=\"text-xs text-slate-500 font-mono\">Initializing PDF engine...</div>";
			else try {
				let e = document.createElement("canvas");
				e.className = "max-w-full max-h-[60vh] object-contain shadow-sm rounded";
				let r = t instanceof Uint8Array ? t.slice(0) : new Uint8Array(t), i = await (await window.pdfjsLib.getDocument({ data: r }).promise).getPage(1), a = i.getViewport({ scale: 1.5 });
				e.width = a.width, e.height = a.height;
				let o = e.getContext("2d");
				await i.render({
					canvasContext: o,
					viewport: a
				}).promise, n.innerHTML = "", c.appendChild(e), n.appendChild(c);
			} catch (t) {
				console.warn("[QuickPreview] PDF render error:", t), n.innerHTML = `
          <div class="flex flex-col items-center justify-center p-6 text-center text-slate-500 gap-2">
            <span class="material-symbols-outlined text-[32px] text-amber-500">picture_as_pdf</span>
            <span class="text-xs font-semibold text-slate-700">Unable to render PDF preview</span>
            <span class="text-[11px] text-slate-400 font-mono">${Y(e.name || "")}</span>
          </div>
        `;
			}
		};
		if (a) {
			let t = (e) => {
				let t = document.createElement("img");
				t.src = e, t.alt = r, t.className = "max-w-full max-h-[60vh] object-contain rounded", n.innerHTML = "", c.appendChild(t), n.appendChild(c);
			};
			if (e._blobUrl) t(e._blobUrl);
			else if (e.fileObj) try {
				let n = URL.createObjectURL(e.fileObj);
				e._blobUrl = n, t(n);
			} catch {
				displayFallback();
			}
			else {
				let r = e.path || e.nativePath;
				if (r) try {
					let n = await _(r);
					if (!n || n.length === 0) throw Error("Empty file bytes");
					let a = new Blob([n], { type: i === "png" ? "image/png" : i === "webp" ? "image/webp" : "image/jpeg" }), o = URL.createObjectURL(a);
					e._blobUrl = o, t(o);
				} catch (t) {
					console.warn("[QuickPreview] Image load error:", t), n.innerHTML = `
              <div class="flex flex-col items-center justify-center p-6 text-center text-slate-500 gap-2">
                <span class="material-symbols-outlined text-[32px] text-amber-500">warning</span>
                <span class="text-xs font-semibold text-slate-700">Unable to load image preview</span>
                <span class="text-[11px] text-slate-400 font-mono">${Y(e.name || "")}</span>
              </div>
            `;
				}
				else n.innerHTML = "<div class=\"text-xs text-slate-500 font-mono\">No file path available.</div>";
			}
		} else if (o) {
			if (e._pdfBytes) await l(e._pdfBytes);
			else if (e.fileObj) try {
				let t = await e.fileObj.arrayBuffer();
				e._pdfBytes = new Uint8Array(t), await l(e._pdfBytes);
			} catch {
				n.innerHTML = "<div class=\"text-xs text-rose-500 font-mono\">Failed to read PDF file object.</div>";
			}
			else {
				let t = e.path || e.nativePath;
				if (t) try {
					let n = await _(t);
					if (!n || n.length === 0) throw Error("Empty PDF bytes");
					e._pdfBytes = n, await l(n);
				} catch (t) {
					console.warn("[QuickPreview] PDF load error:", t), n.innerHTML = `
              <div class="flex flex-col items-center justify-center p-6 text-center text-slate-500 gap-2">
                <span class="material-symbols-outlined text-[32px] text-amber-500">picture_as_pdf</span>
                <span class="text-xs font-semibold text-slate-700">Unable to load PDF preview</span>
                <span class="text-[11px] text-slate-400 font-mono">${Y(e.name || "")}</span>
              </div>
            `;
				}
				else n.innerHTML = "<div class=\"text-xs text-slate-500 font-mono\">No PDF file path available.</div>";
			}
		} else n.innerHTML = `
        <div class="flex flex-col items-center justify-center p-6 text-center text-slate-500 gap-2">
          <span class="material-symbols-outlined text-[32px] text-blue-500">description</span>
          <span class="text-xs font-semibold text-slate-700">${Y(r)}</span>
          <span class="text-[11px] text-slate-400 font-mono">${Y(e.ext || "DOCUMENT")} • ${st(e.size)}</span>
        </div>
      `;
	}
	_handleKeydown(e) {
		if (e.key === "Escape") e.preventDefault(), e.stopPropagation(), this.deskNotepadEl && !this.deskNotepadEl.classList.contains("hidden") ? this.closeNotepad() : this.quickPreviewEl && !this.quickPreviewEl.classList.contains("hidden") ? this.closeQuickPreview() : this.close();
		else if (e.key === "Enter") {
			let t = document.activeElement ? document.activeElement.tagName : "";
			t !== "INPUT" && t !== "BUTTON" && t !== "SELECT" && (e.preventDefault(), this.close());
		}
	}
	render(e) {
		if (e && (this.currentProps = e), !this.contentEl || !this.currentProps) return;
		let { studentName: t = "Student", folderPath: n = "", activePreset: r = "MAHA DBT", presetsList: i = [
			"MAHA DBT",
			"CET CELL",
			"SWAYAM DEENDAYAL YOJANA",
			"EDUCATIONAL DOCUMENTS"
		], missingRules: a = [], presentDocs: o = [], followupMap: s = {}, totalRequiredCount: c = 0 } = this.currentProps;
		a.sort((e, t) => at(typeof e == "string" ? e : e.name || "", typeof t == "string" ? t : t.name || "")), o.sort((e, t) => at(e.docType || e.name || "", t.docType || t.name || ""));
		let l = a.length, u = o.length, d = c || u + l, f = d > 0 ? Math.round(u / d * 100) : 100, p = 163.3, m = p - p * f / 100;
		this.contentEl.innerHTML = `
      <!-- BEGIN: ModalHeader -->
      <header class="px-6 py-4 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 bg-white sticky top-0 z-20 shrink-0">
        <div class="flex items-center space-x-3.5">
          <!-- App icon with double-layered bookmark/layer symbol -->
          <div class="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
          </div>
          <div>
            <h1 class="font-heading text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-snug">
              Document Desk
            </h1>
          </div>
        </div>

        <!-- Bento PRESET Selector Pill with Elevated Floating Menu -->
        <div class="flex items-center">
          <div id="modalPresetCard" class="relative group flex items-center space-x-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition shadow-xs cursor-pointer select-none" title="Click to switch active document preset">
            <span class="w-2 h-2 rounded-full bg-blue-600 shadow-[0_0_6px_rgba(37,99,235,0.4)]"></span>
            <span>PRESET: <strong id="modalPresetActiveName" class="text-slate-900">${Y(r)}</strong></span>
            <svg id="modalPresetChevron" class="w-3.5 h-3.5 text-slate-500 ml-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M19 9l-7 7-7-7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
            </svg>

            <!-- Elevated Floating Menu (z-[9999]) with Active Checkmarks -->
            <div id="modalPresetMenu" class="hidden absolute top-[calc(100%+6px)] right-0 w-[240px] bg-white border border-slate-200 rounded-xl shadow-2xl z-[9999] py-1.5 overflow-hidden transition-all duration-150">
              ${i.map((e) => {
			let t = e === r;
			return `
                  <div class="modal-preset-item flex items-center justify-between px-3.5 py-2 text-[12px] font-mono font-semibold cursor-pointer transition-colors rounded-lg mx-1 ${t ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-700 hover:bg-slate-100 hover:text-blue-600"}" data-preset="${Y(e)}">
                    <span class="truncate mr-2">${Y(e)}</span>
                    ${t ? "<span class=\"material-symbols-outlined text-[16px] text-blue-600 shrink-0\">check</span>" : ""}
                  </div>
                `;
		}).join("")}
            </div>
          </div>
        </div>
      </header>
      <!-- END: ModalHeader -->

      <!-- BEGIN: ModalBodyContent -->
      <main class="flex-1 overflow-y-auto px-6 py-5 space-y-5 custom-scroll">
        <!-- BEGIN: ApplicationReadinessSection -->
        <section class="bg-gradient-to-r from-slate-50 via-slate-50/70 to-blue-50/30 border border-slate-200/90 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-xs" data-purpose="readiness-banner">
          <div class="flex items-center space-x-4 sm:space-x-5">
            <div class="relative w-16 h-16 shrink-0 flex items-center justify-center">
              <svg class="w-16 h-16 transform -rotate-90">
                <circle class="text-slate-200" cx="32" cy="32" fill="transparent" r="26" stroke="currentColor" stroke-width="5"></circle>
                <circle class="text-emerald-500 progress-ring__circle transition-all duration-500" cx="32" cy="32" fill="transparent" r="26" stroke="currentColor" stroke-dasharray="163.3" stroke-dashoffset="${m}" stroke-linecap="round" stroke-width="5.5"></circle>
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center leading-none text-center">
                <span class="text-[13px] font-extrabold text-slate-800">${f}%</span>
                <span class="text-[8px] font-bold text-emerald-600 uppercase tracking-tight mt-0.5">VERIFIED</span>
              </div>
            </div>

            <div class="space-y-1">
              <div class="flex items-center space-x-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                <span>STUDENT NAME:</span>
                <div id="missingStudentDisplayWrap" class="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-indigo-50/80 text-blue-900 font-extrabold px-3 py-1 rounded-lg border border-blue-300 shadow-xs text-xs sm:text-sm normal-case tracking-wide">
                  <span class="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse shrink-0 shadow-[0_0_8px_rgba(37,99,235,0.6)]"></span>
                  <span id="missingStudentNameDisplay" class="font-heading font-extrabold text-blue-900">${Y(t)}</span>
                  <button id="btnMissingEditFolder" aria-label="Edit student name" class="text-blue-600 hover:text-blue-800 p-0.5 rounded hover:bg-blue-100 transition cursor-pointer ml-1" type="button" title="Edit Student / Folder Name">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                    </svg>
                  </button>
                </div>

                <!-- Inline Edit Form (Hidden by default) -->
                <div id="missingStudentEditWrap" class="inline-flex items-center space-x-1.5 hidden">
                  <input id="inputMissingEditStudent" type="text" value="${Y(t)}" class="px-2 py-0.5 rounded border border-blue-500 text-xs font-bold font-heading text-slate-800 focus:outline-none w-48 shadow-2xs">
                  <button id="btnMissingApplyStudent" type="button" class="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer">Apply</button>
                  <button id="btnMissingCancelStudent" type="button" class="px-1.5 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-600 text-[11px] cursor-pointer">✕</button>
                </div>
              </div>

              <div class="flex items-center flex-wrap gap-2 pt-0.5">
                <h2 class="text-base sm:text-lg font-extrabold text-slate-900 font-heading">
                  ${u} of ${d} Documents Staged (${f}% Verified)
                </h2>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3 shrink-0">
            <!-- Left Summary Card: MISSING DOCUMENTS (Aliged with Left Column) -->
            <div class="bg-white border border-rose-200/90 rounded-xl px-4 py-2.5 min-w-[130px] flex items-center space-x-3 shadow-xs">
              <div class="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
              </div>
              <div>
                <p class="text-[10px] font-bold uppercase tracking-wider text-rose-600 leading-none">MISSING DOCUMENTS</p>
                <p class="text-sm font-extrabold text-rose-600 mt-1">${l} Documents</p>
              </div>
            </div>

            <!-- Right Summary Card: PRESENT DOCUMENTS (Aligned with Right Column) -->
            <div class="bg-white border-2 border-emerald-500/80 rounded-xl px-4 py-2.5 min-w-[140px] flex items-center space-x-3 shadow-xs ring-2 ring-emerald-100">
              <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
              </div>
              <div>
                <p class="text-[10px] font-bold uppercase tracking-wider text-emerald-600 leading-none">PRESENT DOCUMENTS</p>
                <p class="text-sm font-extrabold text-emerald-700 mt-1">${u} Documents</p>
              </div>
            </div>
          </div>
        </section>
        <!-- END: ApplicationReadinessSection -->

        <!-- BEGIN: 2-COLUMN SIDE-BY-SIDE BENTO LAYOUT (EXACT STITCH REPLICATION) -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5" data-purpose="bento-columns-layout">

          <!-- LEFT COLUMN: Missing Documents (${l} Required) -->
          <div class="flex flex-col bg-slate-50/60 border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
            <!-- Column Header -->
            <div class="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <h3 class="font-heading text-sm sm:text-base font-bold text-slate-900 tracking-tight">Missing Documents</h3>
              </div>
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${l > 0 ? "bg-rose-100 text-rose-700 border border-rose-200" : "bg-emerald-100 text-emerald-800 border border-emerald-200"}">
                ${l > 0 ? `${l} Required` : "0 Required"}
              </span>
            </div>

            <!-- Scrollable Missing Documents List -->
            <div class="p-3.5 space-y-2.5 overflow-y-auto custom-pan-scroll" style="max-height: 440px;">
              ${l === 0 ? "\n                <div class=\"p-6 text-center text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200 font-medium text-xs\">\n                  🎉 All required documents have been verified and staged in this folder!\n                </div>\n              " : a.map((e) => {
			let t = typeof e == "string" ? e : e.name || "", n = s[t] || "";
			return `
                  <div class="bg-white border border-slate-200 border-l-[3.5px] border-l-rose-500 rounded-lg p-3 flex items-center justify-between gap-3 shadow-xs hover:border-slate-300 transition">
                    <div class="min-w-0 flex-1 flex items-center space-x-2.5 mr-2">
                      <span class="text-xs sm:text-sm font-bold text-slate-800 tracking-wide uppercase truncate" title="${Y(t)}">${Y(t)}</span>
                      <span class="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-full shrink-0">Missing</span>
                    </div>

                    <div class="flex items-center space-x-2 shrink-0">
                      <!-- Compact Calendar Icon Button (Point 3) -->
                      <div class="relative flex items-center" title="Set follow-up promise date">
                        <button type="button" class="btn-missing-date-trigger p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-2xs" title="${n ? `Follow-up Date: ${n}` : "Set follow-up promise date"}">
                          <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                          ${n ? `<span class="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">${Y(n)}</span>` : ""}
                        </button>
                        <input type="date" value="${Y(n)}" data-doc="${Y(t)}" class="missing-followup-input absolute opacity-0 pointer-events-none w-0 h-0">
                      </div>

                      <button type="button" data-doc="${Y(t)}" class="btn-missing-import-file bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold px-3 py-1.5 rounded-lg inline-flex items-center space-x-1 shadow-xs transition cursor-pointer" title="Import external file for ${Y(t)}">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                        </svg>
                        <span>Import</span>
                      </button>
                    </div>
                  </div>
                `;
		}).join("")}
            </div>
          </div>

          <!-- RIGHT COLUMN: Present Documents in Folder (${u} Verified / Ready) -->
          <div class="flex flex-col bg-slate-50/60 border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
            <!-- Column Header -->
            <div class="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <h3 class="font-heading text-sm sm:text-base font-bold text-slate-900 tracking-tight">Present Documents in Folder</h3>
              </div>
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                ${u} Verified / Ready
              </span>
            </div>

            <!-- Scrollable Present Documents List -->
            <div class="p-3.5 space-y-2.5 overflow-y-auto custom-pan-scroll" style="max-height: 440px;">
              ${o.length === 0 ? "\n                <div class=\"p-6 text-center text-slate-500 bg-white rounded-lg border border-slate-200 font-medium text-xs\">\n                  No verified documents found in this folder yet. Use [Import] on the left to add missing files.\n                </div>\n              " : o.map((e, t) => {
			let n = e.docType || e.name || "Document", r = st(e.size), i = e.isCombined || !1, a = (e.ext || (e.name ? e.name.split(".").pop() : "PDF")).toUpperCase().replace(".", ""), o = ct(e.dateCreated || e.ctime || e.birthtime || e.dateModified || e.lastModified), s = a === "JPG" || a === "JPEG" || a === "PNG";
			return `
                  <div class="bg-white border border-emerald-200/90 border-l-[3.5px] border-l-emerald-500 rounded-lg p-3 shadow-xs hover:border-emerald-300 transition flex items-center justify-between gap-3">
                    <div class="min-w-0 space-y-1">
                      <div class="flex items-center space-x-2">
                        <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 text-[10px] font-bold">✓</span>
                        <h4 class="font-heading font-bold text-xs sm:text-sm text-slate-900 tracking-tight truncate" title="${Y(n)}">${Y(n)}</h4>
                        <span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full shrink-0">Verified</span>
                      </div>
                      <div class="flex items-center space-x-2 text-[11px] text-slate-500 pl-7">
                        <span class="${s ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-700"} font-bold text-[9px] px-1 py-0.2 rounded">${Y(a)}</span>
                        <span class="font-semibold text-slate-700">${Y(r)}</span>
                        <span>•</span>
                        <span>Created: ${Y(o)}</span>
                        ${i ? "<span class=\"px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 text-[9px] font-bold\">via Combined</span>" : ""}
                      </div>
                    </div>

                    <!-- Eye Icon Quick Inspect Button (Choice 3-C) -->
                    <button type="button" data-doc-idx="${t}" class="btn-present-view-inspect p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition shrink-0 cursor-pointer active:scale-95" title="View / Inspect Document (${Y(n)})">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                        <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
                      </svg>
                    </button>
                  </div>
                `;
		}).join("")}
            </div>
          </div>
        </div>
        <!-- END: 2-COLUMN SIDE-BY-SIDE BENTO LAYOUT -->
      </main>
      <!-- END: ModalBodyContent -->

      <!-- BEGIN: ModalFooter -->
      <footer class="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between sticky bottom-0 z-20 shrink-0">
        <!-- Left Action Button: Student Report (Notepad) -->
        <div>
          <button id="btnDeskReport" type="button" class="inline-flex items-center space-x-2 bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-300 text-slate-800 px-3.5 py-2 rounded-lg text-xs font-bold shadow-2xs hover:border-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer active:scale-95" title="Generate and open student document report in Notepad">
            <span class="text-base leading-none">📝</span>
            <span class="font-heading font-extrabold text-slate-800">Report</span>
            <span class="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-mono text-[10px] font-bold border border-blue-200">Notepad</span>
          </button>
        </div>

        <!-- Right Action Button: Back to Renamer -->
        <div>
          <button id="btnMissingModalDone" type="button" class="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md shadow-blue-500/20 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 cursor-pointer active:scale-95" title="Close and return to Bulk Renamer (Esc)">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M10 19l-7-7m0 0l7-7m-7 7h18" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"></path>
            </svg>
            <span>Back to Renamer</span>
            <kbd class="ml-1.5 px-1.5 py-0.5 bg-blue-700 text-blue-100 rounded text-[10px] font-mono font-normal">Esc</kbd>
          </button>
        </div>
      </footer>
      <!-- END: ModalFooter -->
    `;
		let h = this.contentEl.querySelector("#btnDeskReport");
		h && (h.onclick = () => this.showNotepadReport());
		let g = this.contentEl.querySelector("#btnMissingModalDone");
		g && (g.onclick = () => this.close());
		let _ = this.contentEl.querySelector("#modalPresetCard"), v = this.contentEl.querySelector("#modalPresetMenu"), y = this.contentEl.querySelector("#modalPresetChevron");
		_ && v && (_.onclick = (e) => {
			e.stopPropagation(), v.classList.contains("hidden") ? (v.classList.remove("hidden"), y && y.classList.add("rotate-180")) : (v.classList.add("hidden"), y && y.classList.remove("rotate-180"));
		}, v.querySelectorAll(".modal-preset-item").forEach((e) => {
			e.onclick = (t) => {
				t.stopPropagation();
				let n = e.getAttribute("data-preset");
				v.classList.add("hidden"), y && y.classList.remove("rotate-180"), n && n !== r && this.onPresetChange(n);
			};
		}), document.addEventListener("click", (e) => {
			_.contains(e.target) || (v.classList.add("hidden"), y && y.classList.remove("rotate-180"));
		}, { once: !0 }));
		let b = this.contentEl.querySelector("#btnMissingEditFolder"), x = this.contentEl.querySelector("#missingStudentDisplayWrap"), S = this.contentEl.querySelector("#missingStudentEditWrap"), C = this.contentEl.querySelector("#inputMissingEditStudent"), w = this.contentEl.querySelector("#btnMissingApplyStudent"), T = this.contentEl.querySelector("#btnMissingCancelStudent");
		if (b && x && S && C) {
			b.onclick = () => {
				x.classList.add("hidden"), S.classList.remove("hidden"), C.focus(), C.select();
			};
			let e = () => {
				let e = C.value.trim();
				S.classList.add("hidden"), x.classList.remove("hidden"), e && e !== t && this.onRenameFolder(e);
			};
			w && (w.onclick = e), T && (T.onclick = () => {
				C.value = t, S.classList.add("hidden"), x.classList.remove("hidden");
			}), C.onkeydown = (n) => {
				n.key === "Enter" ? (n.preventDefault(), e()) : n.key === "Escape" && (n.preventDefault(), n.stopPropagation(), C.value = t, S.classList.add("hidden"), x.classList.remove("hidden"));
			};
		}
		this.contentEl.querySelectorAll(".btn-missing-date-trigger").forEach((e) => {
			e.onclick = (t) => {
				t.stopPropagation();
				let n = e.closest("div"), r = n ? n.querySelector(".missing-followup-input") : null;
				r && (typeof r.showPicker == "function" ? r.showPicker() : r.click());
			};
		}), this.contentEl.querySelectorAll(".missing-followup-input").forEach((e) => {
			e.onchange = (e) => {
				let t = e.target.getAttribute("data-doc"), n = e.target.value;
				this.onSetFollowup({
					docName: t,
					date: n
				});
			};
		}), this.contentEl.querySelectorAll(".btn-missing-import-file").forEach((e) => {
			e.onclick = (t) => {
				t.stopPropagation();
				let n = e.getAttribute("data-doc");
				this.onImportFile(n);
			};
		}), this.contentEl.querySelectorAll(".btn-present-view-inspect").forEach((e) => {
			e.onclick = (t) => {
				t.stopPropagation();
				let n = parseInt(e.getAttribute("data-doc-idx"), 10), r = o[n];
				r && this.showQuickPreview(r);
			};
		});
	}
};
// tools/rename_tool/rename_tool_ui.js
function ut() {
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
	return !!(t === "thumbs.db" || t === "ehthumbs.db" || t === "desktop.ini" || t === ".ds_store" || t.startsWith(".") || t.startsWith("~$") || t.endsWith(".tmp") || t.includes(".docmitra_id"));
}
function dt(e) {
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
		"DOMNAT",
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
var ft = A.map((e) => ({
	code: e.primaryShortcut,
	codes: [e.primaryShortcut],
	label: e.outputName,
	canonical: e.outputName,
	keywords: Array.isArray(e.alternateKeywords) ? [...e.alternateKeywords] : []
})), pt = new Map(ft.map((e) => [e.code, e])), mt = {
	"MAHA DBT": (/* @__PURE__ */ "PIC.SIG.ADR.10M.10P.12M.12P.12LC.PYM.CST.VAL.NCL.INC.DOM.NAT.RAT.BNK.CAP.BON.FEE.ATT.HST.GAP.SDC.PDC.DTH".split(".")).map((e) => {
		let t = pt.get(e);
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
		"10P",
		"12M",
		"12P",
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
		let t = pt.get(e);
		return {
			name: t.canonical,
			code: t.code,
			keywords: [...t.keywords]
		};
	}),
	"CET CELL": [
		"PIC",
		"SIG",
		"ADR",
		"APR",
		"CETAF",
		"CETSC",
		"CAP",
		"SRF",
		"10M",
		"10P",
		"12M",
		"12P",
		"12LC",
		"DOM",
		"NAT",
		"CST",
		"VAL",
		"NCL",
		"EWS",
		"INC",
		"GAP",
		"MIG",
		"MED",
		"BRT"
	].map((e) => {
		let t = pt.get(e);
		return {
			name: t.canonical,
			code: t.code,
			keywords: [...t.keywords]
		};
	}),
	"EDUCATIONAL DOCUMENTS": (/* @__PURE__ */ "PIC.SIG.ADR.10M.10P.12M.12P.12LC.PYM.CST.VAL.NCL.INC.DOM.NAT.RAT.BNK.CAP.BON.FEE.ATT.HST.GAP.SDC.PDC.DTH.NHC.DIS.APR.CETAF.CETSC.SRF.EWS.MIG.MED.BRT.PAN.VOT.DL.11M.1YM.2YM.3YM.4YM.DPC.DEG.REG.INT.CHR.GAZ.MIN".split(".")).map((e) => {
		let t = pt.get(e);
		return {
			name: t.canonical,
			code: t.code,
			keywords: [...t.keywords]
		};
	})
}, ht = class {
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
			isMissingDocsCollapsed: !0,
			isMissingModalOpen: !1
		}, this._scanAbortController = null, this.missingModal = null, this.shortcuts21 = JSON.parse(JSON.stringify(ft)), this._presetDocsSearchQuery = "", this._shortcutsSearchQuery = "", this._sortOrder = "asc", this._recentMoves = [];
	}
	init() {
		this.state.settings = He(), this.loadPresetsAndSettings();
		let e = localStorage.getItem("docmitra_casing_style");
		this.state.style = e && [
			"upper",
			"title",
			"lower"
		].includes(e.toLowerCase()) ? e.toLowerCase() : "upper", this._bindDOM(), this._bindKeyboardShortcuts(), this._startBackgroundWatcher(), window.addEventListener("storage", (e) => {
			if (e.key === "docmitra_settings" || e.key === "docmitra_casing_style" || e.key === "docmitra_active_preset") {
				this.state.settings = He();
				let e = localStorage.getItem("docmitra_casing_style");
				this.state.style = e && [
					"upper",
					"title",
					"lower"
				].includes(e.toLowerCase()) ? e.toLowerCase() : "upper", this.loadPresetsAndSettings(), this._recalculateTargetNames(!0), this.renderQueue(), this.renderCurrentPreview();
			}
		}), console.info("[DocMitra Renamer] Renamer UI manager initialized."), this.renderQueue(), typeof window < "u" && (window.location.search.includes("test_mode=1") || window.__DOCMITRA_TEST_MODE__) && this._initTestModeData();
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
		e && e.addEventListener("click", () => this.handleSelectFolder()), document.addEventListener("focusin", (e) => {
			e.target && e.target.tagName === "INPUT" && ![
				"checkbox",
				"radio",
				"range"
			].includes(e.target.type) && (e.target.setAttribute("autocomplete", "new-password"), e.target.setAttribute("autocorrect", "off"), e.target.setAttribute("autocapitalize", "off"), e.target.setAttribute("spellcheck", "false"), e.target.setAttribute("data-form-type", "other"), e.target.setAttribute("data-lpignore", "true"));
		}, !0);
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
				o.value = this.state.studentName || this.state.folder?.name || "", o.setAttribute("autocomplete", "new-password"), o.setAttribute("autocorrect", "off"), o.setAttribute("autocapitalize", "off"), o.setAttribute("spellcheck", "false"), o.setAttribute("data-form-type", "other"), o.setAttribute("data-lpignore", "true"), a.classList.add("hidden"), n.classList.add("hidden"), o.classList.remove("hidden"), i && i.classList.remove("hidden"), o.focus(), o.select();
			});
			let e = async () => {
				let e = o.value.trim();
				o.classList.add("hidden"), i && i.classList.add("hidden"), a.classList.remove("hidden"), n.classList.remove("hidden"), await this.applyFolderRename(e);
			};
			i && i.addEventListener("click", e), o.addEventListener("keydown", (t) => {
				t.key === "Enter" ? (t.preventDefault(), e()) : t.key === "Escape" && (o.classList.add("hidden"), i && i.classList.add("hidden"), a.classList.remove("hidden"), n.classList.remove("hidden"));
			});
		}
		let s = document.getElementById("btnRenameAll");
		s && s.addEventListener("click", () => this.handleRenameAll());
		let c = document.getElementById("btnUndoRename");
		c && c.addEventListener("click", () => this.handleUndo());
		let l = document.getElementById("btnMoveToDuplicates");
		l && l.addEventListener("click", () => {
			this.getExtraDuplicateFiles().length > 0 ? this.handleMoveAllDuplicates() : this.handleMoveFileToDuplicates();
		});
		let u = document.getElementById("btnUndoSafeMove");
		u && u.addEventListener("click", () => this.handleUndoSafeMove());
		let d = document.getElementById("btnRescanFiles");
		d && d.addEventListener("click", () => this.handleRescanFiles());
		let f = document.getElementById("btnSortQueue");
		f && f.addEventListener("click", () => this.handleSortDocuments());
		let p = document.getElementById("btnSaveBatch");
		p && p.addEventListener("click", () => this.handleSaveBatch());
		let m = document.getElementById("btnSmartScanBatch");
		m && m.addEventListener("click", () => this.handleSmartScanBatch());
		let h = document.getElementById("btnRenameMatched");
		h && h.addEventListener("click", () => this.openCrossCheckModal());
		let g = document.getElementById("btnCloseAddDocModal");
		g && g.addEventListener("click", () => this.closeAddDocumentModal());
		let _ = document.getElementById("btnCancelAddDoc");
		_ && _.addEventListener("click", () => this.closeAddDocumentModal());
		let v = document.getElementById("btnSaveAddDoc");
		v && v.addEventListener("click", () => this.handleSaveDocumentType());
		let y = document.getElementById("btnRenameSettings");
		y && y.addEventListener("click", () => this.handleOpenSettingsModal("presets"));
		let b = document.getElementById("btnCloseRenameSettings");
		b && b.addEventListener("click", () => this.handleCloseSettingsModal());
		let x = document.getElementById("btnDoneRenameSettings");
		x && x.addEventListener("click", () => this.handleCloseSettingsModal());
		let S = document.getElementById("tabBtnPresets");
		S && S.addEventListener("click", () => this.renderSettingsModal("presets"));
		let C = document.getElementById("tabBtnShortcuts");
		C && C.addEventListener("click", () => this.renderSettingsModal("shortcuts"));
		let w = document.getElementById("tabBtnLinked");
		w && w.addEventListener("click", () => this.renderSettingsModal("linked"));
		let T = document.getElementById("btnOpenAddLinkRuleModal");
		T && T.addEventListener("click", () => this.openAddLinkRuleModal());
		let E = document.getElementById("btnCloseLinkRuleModal");
		E && E.addEventListener("click", () => this.closeAddLinkRuleModal());
		let D = document.getElementById("btnCancelLinkRuleModal");
		D && D.addEventListener("click", () => this.closeAddLinkRuleModal());
		let O = document.getElementById("btnSaveLinkRule");
		O && O.addEventListener("click", () => this.handleSaveLinkRule());
		let ee = document.getElementById("inputSearchLinkedRules");
		ee && ee.addEventListener("input", (e) => {
			this._linkedRulesSearchQuery = e.target.value, this.renderLinkedRulesTable();
		});
		let k = document.getElementById("selectActivePreset");
		k && k.addEventListener("change", (e) => this.handleSwitchActivePreset(e.target.value));
		let A = document.getElementById("btnNewPreset");
		A && A.addEventListener("click", () => this.handleNewPreset());
		let te = document.getElementById("btnCopyPreset");
		te && te.addEventListener("click", () => this.handleCopyPreset());
		let ne = document.getElementById("btnRenamePreset");
		ne && ne.addEventListener("click", () => this.handleRenamePreset());
		let j = document.getElementById("btnDeletePreset");
		j && j.addEventListener("click", () => this.handleDeletePreset());
		let M = document.getElementById("btnResetPresetsDefault");
		M && M.addEventListener("click", () => this.handleResetPresetsDefault());
		let re = document.getElementById("btnAddDocToPreset");
		re && re.addEventListener("click", () => this.openAddDocumentModal());
		let ie = document.getElementById("btnAddNewShortcut");
		ie && ie.addEventListener("click", () => this.openAddDocumentModal(null, !0));
		let N = document.getElementById("btnAddDocOrShortcut");
		N && N.addEventListener("click", () => {
			let e = this.state.settingsActiveTab === "shortcuts" || document.getElementById("tabContentShortcuts") && !document.getElementById("tabContentShortcuts").classList.contains("hidden");
			this.openAddDocumentModal(null, e);
		}), document.addEventListener("keydown", (e) => {
			if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
				let t = document.getElementById("modalRenameSettings");
				if (t && !t.classList.contains("hidden")) {
					e.preventDefault();
					let t = document.getElementById("btnAddDocOrShortcut") || document.getElementById("btnAddDocToPreset");
					t && t.click();
				}
			}
		}), document.addEventListener("click", (e) => {
			e.target.closest(".keyword-popover-container") || document.querySelectorAll(".keyword-popover-card:not(.hidden)").forEach((e) => e.classList.add("hidden"));
		});
		let P = document.getElementById("inputSearchPresetDocs");
		P && P.addEventListener("input", (e) => {
			this._presetDocsSearchQuery = e.target.value.trim().toLowerCase(), this.renderPresetDocsTable();
		});
		let ae = document.getElementById("inputSearchShortcuts");
		ae && ae.addEventListener("input", (e) => {
			this._shortcutsSearchQuery = e.target.value.trim().toLowerCase(), this.renderShortcutsTable();
		}), this._initCrossCheckEvents();
		let L = () => {
			document.querySelectorAll("#casingRadiosGroup label").forEach((e) => {
				let t = e.querySelector("input");
				e.className = t && t.checked ? "flex items-center cursor-pointer text-white bg-primary font-mono-code text-[11px] px-2 py-0.5 rounded shadow-xs select-none font-bold transition-all casing-pill-active" : "flex items-center cursor-pointer text-secondary hover:text-on-surface font-mono-code text-[11px] px-2 py-0.5 rounded transition-all select-none";
			});
		};
		document.querySelectorAll("input[name=\"casingStyleRadio\"]").forEach((e) => {
			e.value === (this.state.style || "upper") && (e.checked = !0), e.addEventListener("change", (e) => {
				if (e.target.checked) {
					let t = e.target.value;
					this.state.style = t, localStorage.setItem("docmitra_casing_style", t), L();
					for (let e of this.state.files) !e.isRenamed && !e.isKept && (e.userEditedName = I(e.userEditedName || F(e.name), t));
					this._recalculateTargetNames(), this.renderQueue(), this.renderCurrentPreview();
					let n = this.state.files.filter((e) => !e.isRenamed && !e.isKept).length, i = t.toUpperCase() === "UPPER" ? "UPPERCASE" : t.toUpperCase() === "LOWER" ? "LOWERCASE" : "TITLE CASE";
					r.show("Case Style Changed", `Applied ${i} to ${n} pending files`, "info");
				}
			});
		}), L();
		let R = document.getElementById("btnClearWorkspace");
		R && R.addEventListener("click", () => this.handleClearQueue());
		let z = document.getElementById("btnClearQueue");
		z && z.addEventListener("click", () => this.handleClearQueue());
		let B = document.getElementById("btnEmptySelectFolder");
		B && B.addEventListener("click", () => this.handleSelectFolder());
		let oe = document.getElementById("btnEmptyAddFiles");
		oe && oe.addEventListener("click", () => this.handleAddFiles());
		let se = document.querySelector("#col-queue input");
		se && (se.addEventListener("keydown", (e) => {
			(e.key === "Tab" || e.key === "Enter") && (e.preventDefault(), r.show("Intake Folder Needed", "Press \"Select Folder\" (F2) to choose admission documents.", "info")), /[\\/:*?"<>|]/.test(e.key) && (e.preventDefault(), r.show("Character Not Allowed", `Windows filenames cannot contain ${e.key}`, "warning"));
		}), se.addEventListener("input", (e) => {
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
					if (this.missingModal && this.missingModal.isOpen) {
						e.preventDefault(), this.missingModal.quickPreviewEl && !this.missingModal.quickPreviewEl.classList.contains("hidden") ? this.missingModal.closeQuickPreview() : this.missingModal.close();
						return;
					}
					let t = document.getElementById("modalRenameSettings");
					if (t && !t.classList.contains("hidden")) {
						e.preventDefault(), this.handleCloseSettingsModal();
						return;
					}
					let n = document.getElementById("modalAddLinkRule");
					if (n && !n.classList.contains("hidden")) {
						e.preventDefault(), this.closeAddLinkRuleModal();
						return;
					}
					let r = document.getElementById("modalAddDocument");
					if (r && !r.classList.contains("hidden")) {
						e.preventDefault(), this.closeAddDocumentModal();
						return;
					}
					let i = document.getElementById("modalCrossCheck");
					if (i && !i.classList.contains("hidden")) {
						e.preventDefault(), this.closeCrossCheckModal();
						return;
					}
				}
				if (e.key === "F2") e.preventDefault(), this.handleSelectFolder();
				else if (e.key === "F4") e.preventDefault(), this.handleSmartScanBatch();
				else if (e.key === "F8") e.preventDefault(), this.handleRenameAll();
				else if (e.key === "F5") e.preventDefault(), this.handleRescanFiles();
				else if (e.key === "Delete") {
					if (e.target && e.target.tagName === "INPUT" && e.target.id !== "inputRenameTarget") return;
					e.preventDefault();
					let t = this.state.files[this.state.currentIndex];
					t && this.handleMoveFileToDuplicates(t);
				} else if ((e.ctrlKey || e.metaKey) && e.key === "ArrowLeft") e.preventDefault(), this.handlePrevFolder();
				else if ((e.ctrlKey || e.metaKey) && e.key === "ArrowRight") e.preventDefault(), this.handleNextFolder();
				else if ((e.ctrlKey || e.metaKey) && (e.key === "z" || e.key === "Z") && !e.shiftKey && e.target.tagName !== "INPUT") e.preventDefault(), this.handleUndo();
				else if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) e.preventDefault(), this.handleSaveBatch();
				else if ((e.key === "PageDown" || e.key === "PageUp") && this.state.totalPdfPages > 1 && !(e.target && e.target.tagName === "INPUT" && e.target.id !== "inputRenameTarget")) e.preventDefault(), e.key === "PageDown" && this.state.currentPdfPage < this.state.totalPdfPages ? this._renderPdfPage(this.state.currentPdfPage + 1) : e.key === "PageUp" && this.state.currentPdfPage > 1 && this._renderPdfPage(this.state.currentPdfPage - 1);
				else {
					if (e.ctrlKey || e.metaKey) {
						if (e.key === "+" || e.key === "=") {
							e.preventDefault(), this.state.zoom = Math.min(300, this.state.zoom + 20), this._applyPreviewTransform();
							return;
						}
						if (e.key === "-" || e.key === "_") {
							e.preventDefault(), this.state.zoom = Math.max(40, this.state.zoom - 20), this._applyPreviewTransform();
							return;
						}
						if (e.key === "0") {
							e.preventDefault(), this.state.zoom = 100, this._applyPreviewTransform();
							return;
						}
					}
					if ((e.key === "r" || e.key === "R") && !e.ctrlKey && !e.metaKey && !e.altKey) {
						if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.isContentEditable)) return;
						let t = document.getElementById("btnRotateCW");
						if (t) {
							e.preventDefault(), t.click();
							return;
						}
					}
				}
			}
		});
	}
	_bindPreviewControls() {
		let e = document.getElementById("col-preview");
		if (!e) return;
		let t = e.querySelector("button[title*=\"Zoom In\"]"), n = e.querySelector("button[title*=\"Zoom Out\"]"), i = e.querySelector("button[title*=\"Fit to Page\"]") || e.querySelector("button[title*=\"Fit to A4 Width\"]"), a = e.querySelector("button[title*=\"Reset Zoom\"]"), o = e.querySelector("#btnRotateCCW"), s = e.querySelector("#btnRotateCW") || e.querySelector("#btnRenamerRotatePreview"), c = e.querySelector("#btnRotateFlip"), l = e.querySelector("input[type=\"range\"]"), u = e.querySelector("button[title*=\"Fit to A4 Width\"]"), d = e.querySelector("button[title*=\"Pan Hand\"]"), f = e.querySelector("button[title*=\"Split Compare\"]"), p = e.querySelector(".border-t button");
		t && t.addEventListener("click", () => {
			this.state.zoom = Math.min(300, this.state.zoom + 20), l && (l.value = this.state.zoom), this._applyPreviewTransform();
		}), n && n.addEventListener("click", () => {
			this.state.zoom = Math.max(40, this.state.zoom - 20), l && (l.value = this.state.zoom), this._applyPreviewTransform();
		}), i && i.addEventListener("click", () => {
			this.state.zoom = 100, l && (l.value = 100), this._applyPreviewTransform();
		}), l && l.addEventListener("input", (e) => {
			this.state.zoom = Number(e.target.value), this._applyPreviewTransform();
		}), a && a.addEventListener("click", () => {
			this.state.zoom = 100;
			let e = this.state.files[this.state.currentIndex];
			e && (e.rotation = 0), this.state.rotation = 0, l && (l.value = 100), this._applyPreviewTransform();
		});
		let m = async (e, t) => {
			let n = this.state.files[this.state.currentIndex];
			if (!n) {
				this.state.rotation = ((this.state.rotation || 0) + e + 360) % 360, this._applyPreviewTransform();
				return;
			}
			let i = t ? t.innerHTML : null;
			t && (t.disabled = !0, t.innerHTML = "<span class=\"material-symbols-outlined text-[15px] animate-spin\">refresh</span>");
			try {
				let t = n._pdfBytes || n.bytes, i = await C({
					filePath: n.path,
					ext: n.ext || (n.name ? n.name.split(".").pop() : ""),
					bytes: t,
					degrees: e
				});
				if (i.success && i.newBytes) {
					if (n.bytes = i.newBytes, n._pdfBytes = i.newBytes, n._blobUrl = null, n.url) try {
						URL.revokeObjectURL(n.url);
					} catch {}
					let t = (n.ext || n.name.split(".").pop() || "").toLowerCase(), a = t.includes("pdf") ? "application/pdf" : t.includes("png") ? "image/png" : "image/jpeg";
					n.url = URL.createObjectURL(new Blob([i.newBytes], { type: a })), n._blobUrl = n.url, n.rotation = 0, this.state.rotation = 0, this._applyPreviewTransform(), this.renderCurrentPreview();
					let o = e > 0 ? `+${e}` : `${e}`;
					r.show("Document Rotated", `${n.name} rotated ${o}° and saved to disk.`, "success");
				} else n.rotation = ((n.rotation || 0) + e + 360) % 360, this.state.rotation = n.rotation, this._applyPreviewTransform(), r.show("Preview Rotated", i.error || "Rotated in viewport.", "info");
			} catch (t) {
				console.error("[DocMitra Renamer] Rotation failed:", t), n.rotation = ((n.rotation || 0) + e + 360) % 360, this.state.rotation = n.rotation, this._applyPreviewTransform();
			} finally {
				t && i && (t.disabled = !1, t.innerHTML = i);
			}
		};
		o && o.addEventListener("click", () => m(-90, o)), s && s.addEventListener("click", () => m(90, s)), c && c.addEventListener("click", () => m(180, c)), u && u.addEventListener("click", () => {
			this.state.zoom = 120, l && (l.value = 120), this._applyPreviewTransform(), r.show("Fit to A4 Width", "Zoom set to 120% standard document view", "info");
		}), d && d.addEventListener("click", () => {
			this.state.panEnabled = !this.state.panEnabled;
			let t = e.querySelector(".overflow-auto");
			t && (t.classList.toggle("cursor-grab", this.state.panEnabled), t.classList.toggle("bg-primary/5", this.state.panEnabled)), d.classList.toggle("bg-primary/20", this.state.panEnabled), d.classList.toggle("text-primary", this.state.panEnabled), r.show("Pan Hand", this.state.panEnabled ? "Pan mode active: click & drag preview" : "Pan mode disabled", "info");
		});
		let h = e.querySelector(".overflow-auto");
		if (h) {
			let e = !1;
			h.addEventListener("wheel", (t) => {
				if (t.ctrlKey) {
					t.preventDefault();
					let e = t.deltaY < 0 ? 15 : -15;
					this.state.zoom = Math.max(40, Math.min(300, this.state.zoom + e)), l && (l.value = this.state.zoom), this._applyPreviewTransform();
				} else if (this.state.totalPdfPages > 1) {
					if (e) return;
					t.deltaY > 18 ? this.state.currentPdfPage < this.state.totalPdfPages && (t.preventDefault(), e = !0, this._renderPdfPage(this.state.currentPdfPage + 1), setTimeout(() => {
						e = !1;
					}, 260)) : t.deltaY < -18 && this.state.currentPdfPage > 1 && (t.preventDefault(), e = !0, this._renderPdfPage(this.state.currentPdfPage - 1), setTimeout(() => {
						e = !1;
					}, 260));
				}
			}, { passive: !1 });
			let t = !1, n = 0, r = 0, i = 0, a = 0;
			h.addEventListener("mousedown", (e) => {
				this.state.panEnabled && (t = !0, h.classList.add("cursor-grabbing"), n = e.pageX - h.offsetLeft, r = e.pageY - h.offsetTop, i = h.scrollLeft, a = h.scrollTop);
			}), window.addEventListener("mousemove", (e) => {
				if (!t) return;
				e.preventDefault();
				let o = e.pageX - h.offsetLeft, s = e.pageY - h.offsetTop;
				h.scrollLeft = i - (o - n), h.scrollTop = a - (s - r);
			}), window.addEventListener("mouseup", () => {
				t && (t = !1, h.classList.remove("cursor-grabbing"));
			});
		}
		f && f.addEventListener("click", () => {
			this.state.splitCompare = !this.state.splitCompare, f.classList.toggle("bg-primary/20", this.state.splitCompare), f.classList.toggle("text-primary", this.state.splitCompare), this.renderCurrentPreview(), r.show("Split Compare", this.state.splitCompare ? "Split compare mode active" : "Single view restored", "info");
		}), p && p.addEventListener("click", () => {
			this.state.zoom = 100, this.state.rotation = 0, l && (l.value = 100), this._applyPreviewTransform(), r.show("Filters Reset", "Preview display restored to default", "info");
		});
		let g = e.querySelector("#btnPdfPrevPage"), _ = e.querySelector("#btnPdfNextPage"), v = e.querySelector("#renamerPdfPageBadge");
		g && g.addEventListener("click", (e) => {
			e.stopPropagation(), this.state.currentPdfPage > 1 && this._renderPdfPage(this.state.currentPdfPage - 1);
		}), _ && _.addEventListener("click", (e) => {
			e.stopPropagation(), this.state.currentPdfPage < this.state.totalPdfPages && this._renderPdfPage(this.state.currentPdfPage + 1);
		}), v && v.addEventListener("click", (e) => {
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
			let e = r.querySelector("#renamerZoomReadout") || r.querySelector(".font-mono-code.text-label-sm");
			e && (e.textContent = this.state.zoom === 100 ? "Fit" : `${this.state.zoom}%`);
		}
	}
	_startBackgroundWatcher() {
		setInterval(async () => {
			if (this.state.watcherActive && this.state.folder?.path && (typeof window > "u" || window.__TAURI__ || window.__DOCMITRA_HAS_BACKEND__)) try {
				let e = await p(this.state.folder.path);
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
			let e = await d();
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
			let e = await p(n);
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
			let e = await f("All Supported Files (*.pdf;*.jpg;*.jpeg;*.png;*.docx)|*.pdf;*.jpg;*.jpeg;*.png;*.docx|All Files (*.*)|*.*", "Select Files to Add");
			if (!e.success) return;
			let t = (e.files || []).filter((e) => !Z(e.name));
			if (t.length === 0) {
				r.show("No Files Selected", "0 valid documents selected.", "info");
				return;
			}
			this.state.folder?.path;
			let n = new Set(this.state.files.map((e) => e.targetName)), i = t.map((e, t) => {
				let r = e.ext || P(e.name), i = F(e.name), a = xe(e.name, this.state.studentName, this.state.settings?.groups, this.getAllPresetDocuments()), o = a.docType, s = a.confidence >= 50, c = i;
				c = o ? L(o, this.state.studentName, this.state.settings?.groups, this.state.style) : L(i, this.state.studentName, null, this.state.style);
				let l = z(c.endsWith(r) ? c : c + r, e.name, n, this.state.studentName);
				n.add(l);
				let u = a.confidence;
				return i.toUpperCase() === F(c).toUpperCase() && (u = 100), {
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
		this.state.folder?.path ? (b(this.state.folder.path), r.show("Opening Windows Explorer", this.state.folder.path, "info")) : r.show("No Active Folder", "Please select a folder first.", "warning");
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
			let i = e.ext || P(e.name), a = F(e.name), o = t ? t.get(e.name) : null;
			if (o) return l.add(o.targetName), {
				id: `file_${r}_${Date.now()}`,
				name: e.name,
				path: e.path || `${n}/${e.name}`,
				size: e.size || 0,
				dateCreated: e.ctime || e.birthtime || e.dateCreated || e.lastModified || Date.now(),
				dateModified: e.lastModified || e.fileObj?.lastModified || e.dateModified || e.modified || Date.now(),
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
			let s = xe(e.name, u, this.state.settings?.groups, this.getAllPresetDocuments()), c = s.docType, d = s.confidence >= 50, f = a;
			f = c ? L(c, u, this.state.settings?.groups, this.state.style) : L(a, u, null, this.state.style);
			let p = z(f.endsWith(i) ? f : f + i, e.name, l, u);
			l.add(p);
			let m = s.confidence;
			return a.toUpperCase() === F(f).toUpperCase() && (m = 100), {
				id: `file_${r}_${Date.now()}`,
				name: e.name,
				path: e.path || `${n}/${e.name}`,
				size: e.size || 0,
				dateCreated: e.ctime || e.birthtime || e.dateCreated || e.lastModified || Date.now(),
				dateModified: e.lastModified || e.fileObj?.lastModified || e.dateModified || e.modified || Date.now(),
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
		}), this._scanAbortController &&= (this._scanAbortController.abort(), null), this.state.currentIndex = 0, this.state.rotation = 0, this.updateTelemetry(), this.renderQueue(), this.renderCurrentPreview(), this.state.files.length > 0 && (this.handleSmartScanBatch(), this._computeDuplicateHashesAsync());
	}
	async _computeDuplicateHashesAsync() {
		if (!this.state.files || this.state.files.length === 0) return;
		let e = /* @__PURE__ */ new Map();
		this.state.files.forEach((t) => {
			let n = Number(t.size) || 0, r = (t.ext || P(t.name) || "").toLowerCase();
			if (n > 0 && r) {
				let i = `${n}_${r}`;
				e.has(i) || e.set(i, []), e.get(i).push(t);
			}
		});
		let t = [];
		if (e.forEach((e) => {
			e.length >= 2 && e.forEach((e) => {
				e.sha256 || t.push(e);
			});
		}), t.length === 0) return;
		let n = ut(), r = !1;
		for (let e of t) try {
			let t = null;
			if (e.fileObj && typeof e.fileObj.arrayBuffer == "function") t = await e.fileObj.arrayBuffer();
			else if (e.path && n) {
				let r = await n("read_binary_file", { path: e.path });
				r && (t = new Uint8Array(r).buffer);
			}
			if (t && typeof crypto < "u" && crypto.subtle) {
				let n = await crypto.subtle.digest("SHA-256", t);
				e.sha256 = Array.from(new Uint8Array(n)).map((e) => e.toString(16).padStart(2, "0")).join(""), r = !0;
			}
		} catch {}
		if (r) {
			this.renderQueue();
			let e = document.getElementById("modalCrossCheck");
			e && !e.classList.contains("hidden") && this._renderCrossCheckRows();
		}
	}
	_recalculateTargetNames(e = !1) {
		let t = /* @__PURE__ */ new Set();
		for (let e of this.state.files) (e.isRenamed || e.isKept) && t.add(e.targetName || e.name);
		let n = this.getEffectiveStudentName(), r = this.getAllPresetDocuments();
		for (let i of this.state.files) if (!i.isRenamed && !i.isKept) {
			if (e || !i.isMatched) {
				let e = xe(i.name, n, this.state.settings?.groups, r);
				e.confidence >= 50 && (i.docType = e.docType, i.smartDocType = e.docType, i.smartConfidence = e.confidence, i.isMatched = !0, i.status = e.confidence >= 80 ? "matched" : "needs_review");
			}
			i.docType && (i.docType = I(i.docType, this.state.style), i.smartDocType = I(i.smartDocType || i.docType, this.state.style)), i.hasUserEdited && i.userEditedName && (i.userEditedName = I(i.userEditedName, this.state.style));
			let a = i.docType || F(i.name), o = i.ext || ("." + i.name.split(".").pop()).toLowerCase(), s = i.hasUserEdited && i.userEditedName ? i.userEditedName : L(a, n, this.state.settings?.groups, this.state.style), c = z(s.endsWith(o) ? s : `${s}${o}`, i.name, t, n);
			t.add(c), i.targetName = c, F(i.name).toUpperCase() === F(s).toUpperCase() && (i.smartConfidence = 100);
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
							let n = await p(e.path);
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
		let u = document.getElementById("btnRenameAll");
		if (u) {
			let e = this.state.files.filter((e) => !e.isRenamed && (e.targetName && e.targetName !== e.name || e.rotation && e.rotation % 360 != 0)), t = u.querySelector(".font-bold");
			t && (t.textContent = `Rename All (${e.length} Files)`);
		}
		let d = document.getElementById("btnRenameMatched");
		if (d) {
			let e = d.querySelector("span:not(.material-symbols-outlined)");
			e && (e.textContent = "Bulk Rename"), d.disabled = this.state.files.length === 0;
		}
		let f = document.getElementById("btnMoveToDuplicates"), m = document.getElementById("moveDuplicatesLabel");
		if (f) {
			let e = this.getExtraDuplicateFiles();
			e.length > 0 ? (m && (m.textContent = `Move Duplicates (${e.length})`), f.classList.add("bg-rose-950/80", "hover:bg-rose-900", "border-rose-700/80", "text-rose-200"), f.classList.remove("bg-slate-800", "hover:bg-slate-700", "border-slate-700", "text-slate-200"), f.title = `Bulk move ${e.length} extra duplicate copies to "Duplicate Files" subfolder`) : (m && (m.textContent = "Move Duplicates"), f.classList.remove("bg-rose-950/80", "hover:bg-rose-900", "border-rose-700/80", "text-rose-200"), f.classList.add("bg-slate-800", "hover:bg-slate-700", "border-slate-700", "text-slate-200"), f.title = "No extra duplicate copies found");
		}
		let h = document.getElementById("btnUndoSafeMove");
		h && (this._recentMoves && this._recentMoves.length > 0 ? (h.classList.remove("opacity-40", "cursor-not-allowed"), h.classList.add("opacity-100", "cursor-pointer"), h.disabled = !1, h.title = "Undo last move (Restore moved document from \"Duplicate Files\")") : (h.classList.add("opacity-40", "cursor-not-allowed"), h.classList.remove("opacity-100", "cursor-pointer"), h.disabled = !0, h.title = "No recently moved files to undo"));
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
			u.id = "activeFileLiveBadge", n.status === "needs_review" ? (u.className = "confidence-badge confidence-badge-med", u.textContent = "🟡 Needs Review") : n.smartConfidence !== void 0 && n.smartConfidence >= 50 ? n.smartConfidence >= 80 ? (u.className = "confidence-badge confidence-badge-high", u.textContent = `🟢 ${n.smartConfidence}% ${n.smartDocType || n.docType || "DOCUMENT"}`) : (u.className = "confidence-badge confidence-badge-med", u.textContent = `🟡 ${n.smartConfidence}% ${n.smartDocType || n.docType || "DOCUMENT"}`) : n.isMatched && n.docType ? (u.className = "confidence-badge confidence-badge-high", u.textContent = `🟢 Matched: ${n.docType}`) : (u.className = "confidence-badge confidence-badge-low", u.textContent = "🔴 Unmatched"), l.appendChild(u);
			let d = F(n.name), f = F(n.targetName || n.suggestedName || "");
			if (f && d.toLowerCase() !== f.toLowerCase()) {
				let e = me(d, f);
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
			g.className = "text-on-surface truncate min-w-0 flex-1 cursor-pointer hover:underline hover:text-primary transition-colors font-medium", g.title = "Click to reset input to original name", g.textContent = F(n.name), g.addEventListener("click", () => {
				let e = F(n.name);
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
			w.id = "inputRenameTarget", w.type = "text", w.autocomplete = "new-password", w.setAttribute("autocomplete", "new-password"), w.setAttribute("autocorrect", "off"), w.setAttribute("autocapitalize", "off"), w.setAttribute("spellcheck", "false"), w.setAttribute("name", `docmitra_rename_${Date.now()}`), w.className = "w-full h-10 px-3 rounded-lg bg-surface-container-lowest font-mono-code text-[13px] text-on-surface font-semibold border-2 border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-xs", w.value = I(n.userEditedName === void 0 ? n.targetName ? F(n.targetName) : F(n.name) : n.userEditedName, this.state.style || "upper"), w.addEventListener("keydown", (e) => {
				if (e.key === "Delete") e.preventDefault(), this.handleMoveFileToDuplicates(n);
				else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) e.preventDefault(), this.handleRenameSingleFile(n);
				else if (e.key === "Tab" && !e.shiftKey) {
					e.preventDefault();
					let t = w.value.trim(), r = this.resolveShortcut(t);
					if (r) {
						let e = L(r.canonical || r.label, this.getEffectiveStudentName(), this.state.settings?.groups, this.state.style).replace(/(\.[a-zA-Z0-9]+)+$/i, "").trim();
						w.value = e, this.handleConfirmCurrentName(e);
					} else {
						let e = t || n.targetName || n.suggestedName || F(n.name);
						this.handleConfirmCurrentName(e);
					}
				} else if (e.key === "Tab" && e.shiftKey) e.preventDefault(), this.handleNavigateBackward();
				else if (e.key === "Enter") {
					e.preventDefault();
					let t = w.value.trim(), r = this.resolveShortcut(t);
					if (r) {
						let e = L(r.canonical || r.label, this.getEffectiveStudentName(), this.state.settings?.groups, this.state.style).replace(/(\.[a-zA-Z0-9]+)+$/i, "").trim();
						w.value = e, this.handleConfirmCurrentName(e);
					} else {
						let e = t || n.targetName || n.suggestedName || F(n.name);
						this.handleConfirmCurrentName(e);
					}
				} else /[\\/:*?"<>|]/.test(e.key) && (e.preventDefault(), r.show("Character Not Allowed", `Windows filenames cannot contain ${e.key}`, "warning"));
			}), w.addEventListener("input", (e) => {
				let t = e.target.value;
				/[\\/:*?"<>|]/.test(t) && (t = t.replace(/[\\/:*?"<>|]/g, ""), e.target.value = t, r.show("Character Not Allowed", "Illegal Windows filename characters removed", "warning")), n.hasUserEdited = !0, n.userEditedName = t;
				let i = n.ext || P(n.name), a = t.replace(/(\.[a-zA-Z0-9]+)+$/i, "").trim(), o = document.getElementById("activeFileLiveBadge");
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
					let t = L(e, this.getEffectiveStudentName(), this.state.settings?.groups, this.state.style).replace(/(\.[a-zA-Z0-9]+)+$/i, "").trim();
					n.targetName = `${t}${i}`;
				} else {
					n.docType = a, n.isMatched = !1, o && (o.className = "confidence-badge confidence-badge-med", o.textContent = `✏️ Custom: ${a}`);
					let e = L(a, this.state.studentName, null, this.state.style).replace(/(\.[a-zA-Z0-9]+)+$/i, "").trim();
					n.targetName = `${e}${i}`;
				}
				this.updateTelemetry();
				let l = document.querySelector("#previewContainerStage .font-headline-sm");
				l && (l.textContent = F(n.targetName)), this.renderCoreShortcuts(t);
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
		u.className = "flex flex-col gap-1 overflow-y-auto pr-0.5 custom-pan-scroll flex-1";
		let d = De(this.state.files);
		this.state.files.forEach((e, t) => {
			let n = t === this.state.currentIndex, r = !!e.isRenamed, i = document.createElement("article");
			i.dataset.index = String(t), i.className = n ? "h-8 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/50 ring-1 ring-primary/30 shadow-xs flex items-center justify-between gap-2 transition-all cursor-pointer shrink-0 font-semibold active-queue-item" : r ? "h-8 px-2.5 py-1 rounded-lg bg-surface-container-lowest/80 border border-emerald-500/30 shadow-xs flex items-center justify-between gap-2 hover:bg-surface-container-low transition-colors cursor-pointer shrink-0 text-secondary" : "h-8 px-2.5 py-1 rounded-lg bg-surface-container-lowest shadow-xs flex items-center justify-between gap-2 hover:bg-surface-container-low transition-colors border border-outline-variant/30 cursor-pointer shrink-0", i.title = `Original: ${F(e.name)}\nTarget: ${F(e.targetName || e.name)} (Click to jump & edit)`, i.addEventListener("click", () => {
				this.state.currentIndex = t, this.renderQueue(), this.renderCurrentPreview();
			});
			let a = document.createElement("div");
			a.className = "flex items-center gap-1.5 min-w-0 flex-1";
			let o = document.createElement("span");
			o.className = r ? "w-4 h-4 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-mono-code font-bold text-[10px] flex items-center justify-center shrink-0 border border-emerald-300 dark:border-emerald-700" : n ? "w-4 h-4 rounded bg-primary text-on-primary font-mono-code font-bold text-[10px] flex items-center justify-center shrink-0 shadow-2xs" : "w-4 h-4 rounded bg-surface-container text-secondary font-mono-code font-bold text-[10px] flex items-center justify-center shrink-0", o.textContent = String(t + 1), a.appendChild(o);
			let s = document.createElement("span");
			s.className = n ? "font-mono-code text-[11px] text-primary font-bold truncate flex-1 min-w-0" : r ? "font-mono-code text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold truncate flex-1 min-w-0" : "font-mono-code text-[11px] text-on-surface font-medium truncate flex-1 min-w-0", s.textContent = F(r ? e.name : e.hasUserEdited && e.targetName ? e.targetName : I(F(e.name), this.state.style)), a.appendChild(s), i.appendChild(a), this.getShortCodeForDoc(e.smartDocType || e.docType);
			let c = e.smartConfidence === void 0 ? e.isMatched ? 90 : 0 : e.smartConfidence, l = d.get(e.id || e.name), f = l ? l.status : null;
			if (f === "confirmed") {
				let e = document.createElement("span");
				e.className = "confidence-badge badge-dup-confirmed shrink-0 text-[10px] px-1.5 py-0.5 select-none", e.textContent = "Duplicate", e.title = "Confirmed Duplicate (100% Identical or Copy Suffix Collision)", i.appendChild(e);
			} else if (f === "probable") {
				let e = document.createElement("span");
				e.className = "confidence-badge badge-dup-probable shrink-0 text-[10px] px-1.5 py-0.5 select-none", e.textContent = "50% Dup", e.title = "Probable Duplicate (Exact same byte size & file extension)", i.appendChild(e);
			}
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
			let p = document.createElement("button");
			p.type = "button", p.title = "Move to \"Duplicate Files\" subfolder (Del)", p.className = "w-5 h-5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-amber-500 flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer", p.innerHTML = "<span class=\"material-symbols-outlined text-[13px]\">drive_file_move</span>", p.addEventListener("click", (t) => {
				t.stopPropagation(), this.handleMoveFileToDuplicates(e);
			}), i.classList.add("group"), i.appendChild(p), u.appendChild(i);
		}), i.appendChild(u), t.appendChild(i), requestAnimationFrame(() => {
			let e = u.querySelector(".active-queue-item");
			e && e.scrollIntoView({
				behavior: "smooth",
				block: "nearest"
			});
		}), e.appendChild(t);
		let f = document.getElementById("utilityScrollArea");
		f && this.renderUtilityPanel(f);
	}
	buildPresetDropdown() {
		let e = document.createElement("div");
		e.id = "customPresetCard", e.className = "group relative flex items-center justify-between bg-surface-container-lowest border border-outline-variant/60 hover:border-primary/80 rounded-xl px-3 h-[38px] shadow-2xs hover:shadow-[0_0_15px_rgba(0,55,176,0.18)] transition-all duration-200 cursor-pointer select-none", e.title = "Click to switch active document preset";
		let t = document.createElement("div");
		t.className = "flex items-center gap-1.5 min-w-0 flex-1 mr-2";
		let n = document.createElement("span");
		n.className = "w-1.5 h-1.5 rounded-full bg-primary inline-block shrink-0 shadow-[0_0_6px_rgba(0,55,176,0.4)]", t.appendChild(n);
		let r = document.createElement("span");
		r.className = "font-mono-code text-[10px] text-secondary group-hover:text-primary uppercase font-bold tracking-wider shrink-0 transition-colors", r.textContent = "PRESET:", t.appendChild(r);
		let i = document.createElement("span");
		i.id = "customPresetActiveName", i.className = "font-mono-code text-[12px] font-bold text-on-surface truncate text-left tracking-wide flex-1", i.textContent = this.state.activePreset || "MAHA DBT", t.appendChild(i), e.appendChild(t);
		let a = document.createElement("span");
		a.id = "customPresetChevron", a.className = "material-symbols-outlined text-[18px] text-secondary group-hover:text-primary transition-transform duration-200 shrink-0", a.textContent = "expand_more", e.appendChild(a);
		let o = document.createElement("select");
		o.id = "selectQuickPreset", o.className = "hidden", e.appendChild(o);
		let s = document.createElement("div");
		s.id = "customPresetMenu", s.className = "hidden absolute top-[calc(100%+6px)] left-0 w-full min-w-[240px] bg-surface-container-lowest border border-outline-variant/60 rounded-xl shadow-xl z-[9999] py-1.5 overflow-hidden backdrop-blur-md transition-all duration-150";
		let c = this.state.documentPresets ? Object.keys(this.state.documentPresets) : [
			"MAHA DBT",
			"SWAYAM DEENDAYAL YOJANA",
			"CET CELL",
			"EDUCATIONAL DOCUMENTS"
		], l = Array.from(/* @__PURE__ */ new Set([
			...c,
			"MAHA DBT",
			"SWAYAM DEENDAYAL YOJANA",
			"CET CELL",
			"EDUCATIONAL DOCUMENTS"
		])), u = () => {
			s.innerHTML = "", o.innerHTML = "", l.forEach((e) => {
				let t = document.createElement("option");
				t.value = e, t.textContent = e, e === (this.state.activePreset || "MAHA DBT") && (t.selected = !0), o.appendChild(t);
				let n = document.createElement("div"), r = e === (this.state.activePreset || "MAHA DBT");
				n.className = `flex items-center justify-between px-3 py-2 text-[12px] font-mono-code font-semibold cursor-pointer transition-colors rounded-lg mx-1 ${r ? "bg-primary/10 text-primary font-bold" : "text-on-surface hover:bg-surface-container-high/60 hover:text-primary"}`;
				let c = document.createElement("span");
				if (c.className = "truncate mr-2", c.textContent = e, n.appendChild(c), r) {
					let e = document.createElement("span");
					e.className = "material-symbols-outlined text-[16px] text-primary shrink-0", e.textContent = "check", n.appendChild(e);
				}
				n.addEventListener("click", (t) => {
					t.stopPropagation(), this.handleSwitchActivePreset(e), i.textContent = e, o.value = e, o.dispatchEvent(new Event("change", { bubbles: !0 })), s.classList.add("hidden"), a.classList.remove("rotate-180"), u(), this.state.isMissingModalOpen && this.updateMissingModal();
				}), s.appendChild(n);
			});
		};
		return u(), e.addEventListener("click", (e) => {
			e.stopPropagation(), s.classList.contains("hidden") ? (document.querySelectorAll("#customPresetMenu:not(.hidden)").forEach((e) => e.classList.add("hidden")), s.classList.remove("hidden"), a.classList.add("rotate-180")) : (s.classList.add("hidden"), a.classList.remove("rotate-180"));
		}), document.addEventListener("click", (t) => {
			e.contains(t.target) || (s.classList.add("hidden"), a.classList.remove("rotate-180"));
		}), e.appendChild(s), e;
	}
	buildSettingsPresetDropdown() {
		let e = document.getElementById("settingsPresetContainer");
		if (!e) return;
		e.innerHTML = "";
		let t = document.createElement("div");
		t.id = "settingsPresetCard", t.className = "group relative flex items-center justify-between bg-surface-container-lowest border border-outline-variant/60 hover:border-primary/80 rounded-xl px-3 h-[38px] shadow-2xs hover:shadow-[0_0_15px_rgba(0,55,176,0.18)] transition-all duration-200 cursor-pointer select-none min-w-[220px]", t.title = "Click to switch active document preset";
		let n = document.createElement("div");
		n.className = "flex items-center gap-1.5 min-w-0 flex-1 mr-2";
		let r = document.createElement("span");
		r.className = "w-1.5 h-1.5 rounded-full bg-primary inline-block shrink-0 shadow-[0_0_6px_rgba(0,55,176,0.4)]", n.appendChild(r);
		let i = document.createElement("span");
		i.className = "font-mono-code text-[10px] text-secondary group-hover:text-primary uppercase font-bold tracking-wider shrink-0 transition-colors", i.textContent = "PRESET:", n.appendChild(i);
		let a = document.createElement("span");
		a.id = "settingsPresetActiveName", a.className = "font-mono-code text-[12px] font-bold text-on-surface truncate text-left tracking-wide flex-1", a.textContent = this.state.activePreset || "MAHA DBT", n.appendChild(a), t.appendChild(n);
		let o = document.createElement("span");
		o.id = "settingsPresetChevron", o.className = "material-symbols-outlined text-[18px] text-secondary group-hover:text-primary transition-transform duration-200 shrink-0", o.textContent = "expand_more", t.appendChild(o);
		let s = document.createElement("select");
		s.id = "selectActivePreset", s.className = "hidden", t.appendChild(s);
		let c = document.createElement("div");
		c.id = "settingsPresetMenu", c.className = "hidden absolute top-[calc(100%+6px)] left-0 w-full min-w-[240px] bg-surface-container-lowest border border-outline-variant/60 rounded-xl shadow-xl z-[9999] py-1.5 overflow-hidden backdrop-blur-md transition-all duration-150";
		let l = this.state.documentPresets ? Object.keys(this.state.documentPresets) : [
			"MAHA DBT",
			"SWAYAM DEENDAYAL YOJANA",
			"CET CELL",
			"EDUCATIONAL DOCUMENTS"
		], u = Array.from(/* @__PURE__ */ new Set([
			...l,
			"MAHA DBT",
			"SWAYAM DEENDAYAL YOJANA",
			"CET CELL",
			"EDUCATIONAL DOCUMENTS"
		])), d = () => {
			c.innerHTML = "", s.innerHTML = "", u.forEach((e) => {
				let t = document.createElement("option");
				t.value = e, t.textContent = e, e === (this.state.activePreset || "MAHA DBT") && (t.selected = !0), s.appendChild(t);
				let n = document.createElement("div"), r = e === (this.state.activePreset || "MAHA DBT");
				n.className = `flex items-center justify-between px-3 py-2 text-[12px] font-mono-code font-semibold cursor-pointer transition-colors rounded-lg mx-1 ${r ? "bg-primary/10 text-primary font-bold" : "text-on-surface hover:bg-surface-container-high/60 hover:text-primary"}`;
				let i = document.createElement("span");
				if (i.className = "truncate mr-2", i.textContent = e, n.appendChild(i), r) {
					let e = document.createElement("span");
					e.className = "material-symbols-outlined text-[16px] text-primary shrink-0", e.textContent = "check", n.appendChild(e);
				}
				n.addEventListener("click", (t) => {
					t.stopPropagation(), this.handleSwitchActivePreset(e), a.textContent = e, s.value = e, s.dispatchEvent(new Event("change", { bubbles: !0 })), c.classList.add("hidden"), o.classList.remove("rotate-180"), d(), this.renderPresetDocsTable();
				}), c.appendChild(n);
			});
		};
		d(), t.addEventListener("click", (e) => {
			e.stopPropagation(), c.classList.contains("hidden") ? (document.querySelectorAll("#settingsPresetMenu:not(.hidden), #customPresetMenu:not(.hidden)").forEach((e) => e.classList.add("hidden")), c.classList.remove("hidden"), o.classList.add("rotate-180")) : (c.classList.add("hidden"), o.classList.remove("rotate-180"));
		}), document.addEventListener("click", (e) => {
			t.contains(e.target) || (c.classList.add("hidden"), o.classList.remove("rotate-180"));
		}), t.appendChild(c), e.appendChild(t);
	}
	renderUtilityPanel(e) {
		for (; e.firstChild;) e.removeChild(e.firstChild);
		if (this.state.files.length === 0) {
			let t = document.createElement("div");
			t.className = "flex flex-col gap-2 shrink-0 select-none";
			let n = this.buildPresetDropdown();
			t.appendChild(n);
			let r = document.createElement("div");
			r.className = "grid grid-cols-2 gap-2", r.innerHTML = "\n        <div class=\"bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-2.5 shadow-2xs flex items-center gap-2 opacity-60\">\n          <div class=\"w-7 h-7 rounded-lg bg-surface-container text-secondary flex items-center justify-center font-bold shrink-0\">\n            <span class=\"material-symbols-outlined text-[18px]\">verified</span>\n          </div>\n          <div class=\"min-w-0\">\n            <span class=\"text-[9px] text-secondary uppercase font-semibold block leading-tight truncate\">Completed</span>\n            <span class=\"font-mono-code text-[12px] font-bold text-secondary block leading-tight truncate\">0 Docs</span>\n          </div>\n        </div>\n        <div class=\"bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-2.5 shadow-2xs flex items-center gap-2 opacity-60\">\n          <div class=\"w-7 h-7 rounded-lg bg-surface-container text-secondary flex items-center justify-center font-bold shrink-0\">\n            <span class=\"material-symbols-outlined text-[18px]\">pending_actions</span>\n          </div>\n          <div class=\"min-w-0\">\n            <span class=\"text-[9px] text-secondary uppercase font-semibold block leading-tight truncate\">Missing</span>\n            <span class=\"font-mono-code text-[12px] font-bold text-secondary block leading-tight truncate\">-- Docs</span>\n          </div>\n        </div>\n      ", t.appendChild(r);
			let i = document.createElement("button");
			i.type = "button", i.id = "btnOpenMissingDeskModal", i.className = "w-full py-2 px-3 rounded-xl bg-surface-container-lowest text-secondary font-mono-code text-[11px] font-bold border border-outline-variant/60 shadow-2xs flex items-center justify-center gap-1.5 cursor-not-allowed opacity-50 shrink-0", i.disabled = !0, i.innerHTML = "\n        <span class=\"material-symbols-outlined text-[15px]\">open_in_new</span>\n        <span>↗ Document Desk</span>\n      ", t.appendChild(i), e.appendChild(t);
			let a = document.createElement("div");
			a.className = "p-2.5 rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-lowest/60 text-[11px] text-secondary/70 italic text-center select-none", a.textContent = "Select an intake folder (F2) to verify missing documents.", e.appendChild(a);
			return;
		}
		let t = this.getActivePresetDocuments(), n = new Set(this.state.files.map((e) => (e.docType || "").toUpperCase()).filter(Boolean)), r = t.filter((e) => {
			let t = (e.name || e).toUpperCase();
			return !this.isChecklistRuleSatisfied(t, n);
		}), i = this.state.files.length, a = r.length, o = document.createElement("div");
		o.className = "flex flex-col gap-2 shrink-0 select-none";
		let s = this.buildPresetDropdown();
		o.appendChild(s);
		let c = document.createElement("div");
		c.className = "grid grid-cols-2 gap-2";
		let l = document.createElement("div");
		l.className = "bg-surface-container-lowest border border-emerald-300 dark:border-emerald-700 rounded-xl p-2.5 shadow-2xs flex items-center gap-2", l.innerHTML = `
      <div class="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
        <span class="material-symbols-outlined text-[18px]">verified</span>
      </div>
      <div class="min-w-0">
        <span class="text-[9px] text-secondary uppercase font-semibold block leading-tight truncate">Completed</span>
        <span class="font-mono-code text-[12px] font-bold text-emerald-800 dark:text-emerald-400 block leading-tight truncate">${i} Docs</span>
      </div>
    `, c.appendChild(l);
		let u = document.createElement("div");
		u.className = "bg-surface-container-lowest border border-rose-300 dark:border-rose-700 rounded-xl p-2.5 shadow-2xs flex items-center gap-2", u.innerHTML = `
      <div class="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold shrink-0">
        <span class="material-symbols-outlined text-[18px]">pending_actions</span>
      </div>
      <div class="min-w-0">
        <span class="text-[9px] text-secondary uppercase font-semibold block leading-tight truncate">Missing</span>
        <span class="font-mono-code text-[12px] font-bold text-rose-700 dark:text-rose-400 block leading-tight truncate">${a} Docs</span>
      </div>
    `, c.appendChild(u), o.appendChild(c);
		let d = document.createElement("button");
		d.type = "button", d.id = "btnOpenMissingDeskModal", d.className = "w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-mono-code text-[11px] font-bold border border-slate-700 shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0", d.title = "Open Document Desk Modal (Missing docs, follow-up dates & import)", d.innerHTML = `
      <span class="material-symbols-outlined text-[15px]">open_in_new</span>
      <span>↗ Document Desk</span>
      ${a > 0 ? `
      <span class="relative flex h-2 w-2 mr-0.5 shrink-0" title="${a} missing documents need attention">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
      </span>
    ` : ""}
    `, d.onclick = (e) => {
			e.stopPropagation(), this.openMissingDocumentsModal();
		}, o.appendChild(d), e.appendChild(o);
		let f = document.createElement("div");
		f.id = "coreShortcutsContainer", f.className = "flex flex-col gap-1.5 shrink-0 mt-2 bg-surface-container-lowest/80 p-2.5 rounded-xl border border-outline-variant/30 shadow-xs", e.appendChild(f);
		let p = document.getElementById("inputRenameTarget")?.value || "";
		this.renderCoreShortcuts(p);
	}
	renderCoreShortcuts(e = "") {
		let t = document.getElementById("coreShortcutsContainer");
		if (!t) return;
		for (; t.firstChild;) t.removeChild(t.firstChild);
		if (this.state.files.length === 0) return;
		let n = this.state.files[this.state.currentIndex], r = n ? F(n.name) : "", i = (e || "").trim();
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
		let c = [];
		if (i) {
			let e = i.toLowerCase(), t = o.filter((t) => t.code.toLowerCase() === e), n = o.filter((t) => t.code.toLowerCase().startsWith(e) && t.code.toLowerCase() !== e), r = o.filter((t) => !t.code.toLowerCase().startsWith(e) && (Array.isArray(t.keywords) ? t.keywords : []).some((t) => t.toLowerCase().includes(e))), a = o.filter((t) => t.code.toLowerCase().startsWith(e) || (Array.isArray(t.keywords) ? t.keywords : []).some((t) => t.toLowerCase().includes(e)) ? !1 : (t.label || "").toLowerCase().includes(e) || (t.canonical || "").toLowerCase().includes(e)), s = [
				...t,
				...n,
				...r,
				...a
			], l = /* @__PURE__ */ new Set(), u = [];
			for (let e of s) l.has(e.code) || (l.add(e.code), u.push(e));
			c = u.length > 0 ? u.slice(0, 5) : o.slice(0, 5);
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
		c.forEach((e) => {
			let n = document.createElement("div");
			n.className = "flex items-center justify-between p-2 rounded-lg bg-surface-container-lowest border border-outline-variant/30 hover:border-primary/50 hover:bg-surface-container-low transition-all cursor-pointer shadow-xs group", n.title = `Click or type ${e.code} to rename`;
			let r = document.createElement("div");
			r.className = "flex items-center gap-2 min-w-0 flex-1";
			let i = this.state.style || "upper", a = i === "lower" ? e.code.toLowerCase() : i === "title" ? e.code.length <= 4 && /\d/.test(e.code) ? e.code.toUpperCase() : I(e.code, "title") : e.code.toUpperCase(), o = I(e.label || e.canonical, i), s = document.createElement("span");
			s.className = `px-2 py-0.5 rounded font-mono-code font-bold text-[11px] shrink-0 ${dt(e.code)}`, s.textContent = a, r.appendChild(s);
			let c = document.createElement("span");
			c.className = "text-[12px] font-semibold text-on-surface truncate flex-1", c.textContent = o, r.appendChild(c), n.appendChild(r);
			let l = document.createElement("span");
			l.className = "material-symbols-outlined text-[16px] text-secondary group-hover:text-primary transition-colors shrink-0", l.textContent = "arrow_forward", n.appendChild(l), n.addEventListener("click", (t) => {
				t.stopPropagation(), this.applyShortcutToCurrentFile(e.code);
			}), t.appendChild(n);
		});
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
		for (let e of A || []) if (e.primaryShortcut && e.primaryShortcut.toUpperCase() === t) return {
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
		let n = this.resolveShortcut(e), i = n ? (n.canonical || n.outputName || n.label || n.name).toUpperCase() : e.toUpperCase(), a = t.ext || ("." + t.name.split(".").pop()).toLowerCase(), o = L(i, this.getEffectiveStudentName(), this.state.settings?.groups, this.state.style).replace(/(\.[a-zA-Z0-9]+)+$/i, "").trim();
		t.targetName = `${o}${a}`, t.userEditedName = o, t.hasUserEdited = !0, t.isMatched = !0, t.docType = i, t.smartDocType = i, t.smartConfidence = 100, t.status = "ready";
		let s = document.getElementById("inputRenameTarget");
		s && (s.value = o, s.focus(), s.select()), r.show("Selected Document", `${e} → ${o}`, "info"), this.updateTelemetry(), this.renderQueue();
	}
	handleNavigateBackward() {
		this.state.files.length > 0 && (this.state.currentIndex = (this.state.currentIndex - 1 + this.state.files.length) % this.state.files.length, this.renderQueue(), this.renderCurrentPreview());
	}
	async handleRescanFiles() {
		if (!this.state.files || this.state.files.length === 0) {
			r.show("No Files to Re-Scan", "Please select a folder first.", "info");
			return;
		}
		let e = this.state.folder?.nativePath || this.state.folder?.path;
		if (e && u()) try {
			let t = await p(e);
			if (t && t.success && Array.isArray(t.files)) {
				let e = t.files.filter((e) => !Z(e.name) && !e.name.toLowerCase().includes("duplicate files"));
				t.files = e, this.loadFolderData(t), this._computeDuplicateHashesAsync(), r.show("Fresh Re-Scan Complete", `Reloaded ${e.length} files from disk. All reset to pending.`, "success");
				return;
			}
		} catch (e) {
			console.warn("[DocMitra Renamer] Native rescan fallback:", e);
		}
		this.state.files.forEach((e) => {
			e.isRenamed = !1, e.isKept = !1, e.hasUserEdited = !1, e.userEditedName = void 0, e.status = "pending";
		}), this.state.currentIndex = 0, this._recalculateTargetNames(!0), this.updateTelemetry(), this.renderQueue(), this.renderCurrentPreview(), this._computeDuplicateHashesAsync(), this._scanAbortController &&= (this._scanAbortController.abort(), null), this.handleSmartScanBatch(), r.show("Fresh Re-Scan Complete", `All ${this.state.files.length} files reset to 0 Done. Ready for re-matching.`, "success");
	}
	handleSortDocuments(e = null) {
		if (!this.state.files || this.state.files.length === 0) {
			r.show("No Files to Sort", "Please load documents first.", "info");
			return;
		}
		this._sortOrder = e === "asc" || e === "desc" ? e : this._sortOrder === "asc" ? "desc" : "asc";
		let t = this.state.files[this.state.currentIndex];
		if (this.state.files.sort((e, t) => {
			let n = e.targetName || e.name || "", r = t.targetName || t.name || "", i = n.localeCompare(r, void 0, {
				numeric: !0,
				sensitivity: "base"
			});
			return this._sortOrder === "asc" ? i : -i;
		}), t) {
			let e = this.state.files.findIndex((e) => e.id === t.id || e.name === t.name);
			e !== -1 && (this.state.currentIndex = e);
		}
		let n = document.getElementById("sortQueueLabel");
		n && (n.textContent = this._sortOrder === "asc" ? "Sort A–Z" : "Sort Z–A");
		let i = document.getElementById("modalSortLabel");
		i && (i.textContent = this._sortOrder === "asc" ? "Sort A–Z" : "Sort Z–A"), this.renderQueue(), this.renderCurrentPreview();
		let a = document.getElementById("modalCrossCheck");
		a && !a.classList.contains("hidden") && this._renderCrossCheckRows(), r.show("Sorted", `Documents sorted ${this._sortOrder === "asc" ? "A → Z" : "Z → A"}`, "info");
	}
	getExtraDuplicateFiles() {
		if (!this.state.files || this.state.files.length === 0) return [];
		let e = De(this.state.files), t = [];
		return this.state.files.forEach((n) => {
			let r = e.get(n.id || n.name);
			r && (r.status === "confirmed" || r.status === "probable") && !r.isMaster && t.push(n);
		}), t;
	}
	async handleMoveAllDuplicates() {
		let e = this.getExtraDuplicateFiles();
		if (e.length === 0) {
			r.show("No Extra Duplicates", "All documents are single master copies.", "info");
			return;
		}
		let t = this.state.folder?.nativePath || this.state.folder?.path || (e[0].path ? e[0].path.substring(0, Math.max(e[0].path.lastIndexOf("\\"), e[0].path.lastIndexOf("/"))) : ""), n = t ? `${t}\\Duplicate Files` : "Duplicate Files", i = [], a = new Set(e.map((e) => e.id || e.name));
		for (let t of e) {
			let e = "";
			if (t.path && u()) try {
				let r = await g(t.path, n);
				r && r.success && (e = r.new_path || r.path || `${n}\\${t.name}`);
			} catch (e) {
				console.warn("[DocMitra Renamer] Move error for", t.name, e);
			}
			else e = `${n}\\${t.name}`;
			let r = this.state.files.findIndex((e) => e.id === t.id || e.name === t.name);
			i.push({
				file: { ...t },
				srcPath: t.path,
				movedPath: e,
				originalIndex: r
			});
		}
		this._recentMoves.push({
			isBatch: !0,
			records: i
		}), this.state.files = this.state.files.filter((e) => !a.has(e.id || e.name)), this.state.currentIndex >= this.state.files.length && (this.state.currentIndex = Math.max(0, this.state.files.length - 1)), this.updateTelemetry(), this.renderQueue(), this.renderCurrentPreview(), this._computeDuplicateHashesAsync();
		let o = document.getElementById("modalCrossCheck");
		o && !o.classList.contains("hidden") && this._renderCrossCheckRows(), r.show("Duplicates Moved", `Safely moved ${i.length} duplicate file(s) to "Duplicate Files"`, "success", 7e3, {
			label: "Undo",
			onClick: () => this.handleUndoSafeMove()
		});
	}
	async handleMoveFileToDuplicates(e = null) {
		let t = e || this.state.files[this.state.currentIndex];
		if (!t) {
			r.show("No Document Selected", "Please select a document to move.", "warning");
			return;
		}
		let n = this.state.folder?.nativePath || this.state.folder?.path || (t.path ? t.path.substring(0, Math.max(t.path.lastIndexOf("\\"), t.path.lastIndexOf("/"))) : ""), i = n ? `${n}\\Duplicate Files` : "Duplicate Files", a = "";
		if (t.path && u()) try {
			let e = await g(t.path, i);
			if (!e || !e.success) {
				r.show("Move Failed", e?.error || "Could not move file to Duplicate Files folder.", "error");
				return;
			}
			a = e.new_path || e.path || `${i}\\${t.name}`;
		} catch (e) {
			r.show("Move Error", e?.message || String(e), "error");
			return;
		}
		else a = `${i}\\${t.name}`;
		let o = this.state.files.findIndex((e) => e.id === t.id || e.name === t.name);
		this._recentMoves.push({
			file: { ...t },
			srcPath: t.path,
			movedPath: a,
			originalIndex: o
		}), o !== -1 && (this.state.files.splice(o, 1), this.state.currentIndex >= this.state.files.length && (this.state.currentIndex = Math.max(0, this.state.files.length - 1))), this.updateTelemetry(), this.renderQueue(), this.renderCurrentPreview(), this._computeDuplicateHashesAsync();
		let s = document.getElementById("modalCrossCheck");
		s && !s.classList.contains("hidden") && this._renderCrossCheckRows(), r.show("Safe Moved", `"${t.name}" moved to "Duplicate Files"`, "info", 6e3, {
			label: "Undo",
			onClick: () => this.handleUndoSafeMove()
		});
	}
	async handleUndoSafeMove() {
		if (!this._recentMoves || this._recentMoves.length === 0) {
			r.show("Nothing to Undo", "No recent moved files found.", "info");
			return;
		}
		let e = this._recentMoves.pop();
		if (!e) return;
		if (e.isBatch && Array.isArray(e.records)) {
			let t = 0, n = [...e.records].sort((e, t) => (e.originalIndex ?? 0) - (t.originalIndex ?? 0));
			for (let e of n) {
				if (e.srcPath && e.movedPath && u()) try {
					let t = e.srcPath.substring(0, Math.max(e.srcPath.lastIndexOf("\\"), e.srcPath.lastIndexOf("/")));
					await g(e.movedPath, t);
				} catch (t) {
					console.warn("[DocMitra Renamer] Restore error for", e.file?.name, t);
				}
				let n = Math.min(e.originalIndex ?? this.state.files.length, this.state.files.length);
				this.state.files.splice(n, 0, e.file), t++;
			}
			this.updateTelemetry(), this.renderQueue(), this.renderCurrentPreview(), this._computeDuplicateHashesAsync();
			let i = document.getElementById("modalCrossCheck");
			i && !i.classList.contains("hidden") && this._renderCrossCheckRows(), r.show("Restored", `Restored ${t} file(s) from "Duplicate Files"`, "success");
			return;
		}
		if (e.srcPath && e.movedPath && u()) try {
			let t = e.srcPath.substring(0, Math.max(e.srcPath.lastIndexOf("\\"), e.srcPath.lastIndexOf("/"))), n = await g(e.movedPath, t);
			if (!n || !n.success) {
				r.show("Restore Failed", n?.error || "Could not restore file from Duplicate Files.", "error");
				return;
			}
		} catch (e) {
			r.show("Restore Error", e?.message || String(e), "error");
			return;
		}
		let t = Math.min(e.originalIndex ?? this.state.files.length, this.state.files.length);
		this.state.files.splice(t, 0, e.file), this.state.currentIndex = t, this.updateTelemetry(), this.renderQueue(), this.renderCurrentPreview(), this._computeDuplicateHashesAsync();
		let n = document.getElementById("modalCrossCheck");
		n && !n.classList.contains("hidden") && this._renderCrossCheckRows(), r.show("Restored", `"${e.file.name}" restored from "Duplicate Files"`, "success");
	}
	async handleMoveModalDuplicates() {
		await this.handleMoveAllDuplicates();
	}
	async handleConfirmCurrentName(e) {
		let t = this.state.files[this.state.currentIndex];
		if (!t) return;
		let n = t.ext || P(t.name), i = (e || "").trim();
		if (!i) {
			r.show("Document Name Required", "Please provide a valid filename.", "warning");
			return;
		}
		let a = i.replace(/(\.[a-zA-Z0-9]+)+$/i, "").trim(), o = this.resolveShortcut(a);
		if (o) {
			let e = o.canonical || o.label;
			a = L(e, this.getEffectiveStudentName(), this.state.settings?.groups, this.state.style).replace(/(\.[a-zA-Z0-9]+)+$/i, "").trim(), t.docType = e, t.isMatched = !0;
		}
		let s = `${a}${n}`, c = /* @__PURE__ */ new Set();
		for (let e of this.state.files) e !== t && (e.isRenamed || e.isKept ? c.add(e.targetName || e.name) : e.name && c.add(e.name));
		let l = this.getEffectiveStudentName(), u = z(s, t.name, c, l), d = u.toLowerCase() !== s.toLowerCase();
		s = u;
		let f = F(s), p = R(s);
		if (p) {
			r.show("Validation Error", `${f}: ${p}`, "error");
			return;
		}
		let h = this.state.folder && (this.state.folder.nativePath || this.state.folder.path) || "", g = t.nativePath || t.path || (h ? `${h}/${t.name}` : null), _ = F(t.name) !== f, v = t.rotation && t.rotation % 360 != 0, y = typeof window < "u" && (window.location?.search?.includes("test_mode=1") || window.__DOCMITRA_TEST_MODE__);
		if (g && (_ || v)) {
			let e = l || t.studentName || "", i = t.rotation || 0;
			r.show("Renaming Document", `Renaming to ${f}...`, "info");
			try {
				let o;
				if (o = y ? {
					success: !0,
					name: s,
					path: g.replace(/[^\\\/]+$/, s)
				} : await m(g, s, e, i), !o.success) throw Error(o.error || `Failed to rename ${t.name}`);
				let c = o.name || s, l = o.path || o.newPath || g.replace(/[^\\\/]+$/, c), u = {
					old: t.name,
					next: c,
					file: t,
					nativePath: g,
					studentName: e,
					rotation: i
				};
				if (B.pushBatch(this.state.folder, [u]), t.name = c, t.targetName = c, t.userEditedName = F(c), t.path = l, t.nativePath = l, t.isRenamed = !0, t.status = "renamed", t.smartConfidence = 100, t.hasUserEdited = !0, t.rotation = 0, t._pdfBytes = null, t._blobUrl && typeof URL < "u" && URL.revokeObjectURL) {
					try {
						URL.revokeObjectURL(t._blobUrl);
					} catch {}
					t._blobUrl = null;
				}
				t.url = `${typeof window < "u" && window.location?.origin && !window.location.origin.startsWith("file:") && !window.location.origin.includes("tauri") ? window.location.origin : "http://localhost:3000"}/api/serve-file?path=${encodeURIComponent(l)}`, d || c.toLowerCase() !== `${a}${n}`.toLowerCase() ? r.show("Duplicate Auto-Numbered", `Saved as: ${F(c)}`, "info") : r.show("Renamed Successfully", F(c), "success");
			} catch (e) {
				r.show("Rename Error", e.message, "error");
				return;
			}
		} else t.targetName = s, t.userEditedName = f, t.hasUserEdited = !0, t.isMatched = !0, t.status = "ready", t.smartConfidence = 100, t.smartDocType = t.docType || t.smartDocType || f, d ? r.show("Duplicate Auto-Numbered", `Saved as: ${f}`, "info") : r.show("Name Confirmed", f, "info");
		if (this.state.files.length > 0) {
			let e = this.state.currentIndex, t = (e + 1) % this.state.files.length;
			this.state.currentIndex = t, e === this.state.files.length - 1 && t === 0 && (this.handleSortDocuments("asc"), this.state.currentIndex = 0, r.show("Queue Auto-Sorted", "Cycle complete: documents sorted 1–0 & A–Z", "info"));
		}
		this.updateTelemetry(), this.renderQueue(), this.renderCurrentPreview(), this._computeDuplicateHashesAsync();
	}
	async handleRenameSingleFile(e) {
		let t = e || this.state.files[this.state.currentIndex];
		if (!t) return;
		if (!t.targetName || t.targetName === t.name) {
			let e = document.getElementById("inputRenameTarget");
			if (e && e.value.trim()) {
				let n = t.ext || P(t.name), r = e.value.trim().replace(/(\.[a-zA-Z0-9]+)+$/i, "").trim();
				t.targetName = `${r}${n}`, t.userEditedName = r, t.hasUserEdited = !0, t.isMatched = !0, t.status = "ready", t.smartConfidence = 100, t.smartDocType = t.docType || t.smartDocType || r;
			}
		}
		if (!t.targetName) {
			r.show("Document Name Required", "Please enter a target name first.", "warning");
			return;
		}
		let n = R(t.targetName);
		if (n) {
			r.show("Validation Error", `${F(t.name)}: ${n}`, "error");
			return;
		}
		let i = this.state.folder && (this.state.folder.nativePath || this.state.folder.path) || "", a = t.nativePath || t.path || (i ? `${i}/${t.name}` : null);
		if (!a) {
			r.show("Path Error", "Cannot determine file disk path.", "error");
			return;
		}
		let o = this.state.studentName || t.studentName || "", s = t.rotation || 0;
		r.show("Renaming File", `Renaming to ${F(t.targetName)}...`, "info");
		try {
			let e = await m(a, t.targetName, o, s);
			if (!e.success) throw Error(e.error || `Failed to rename ${t.name}`);
			let n = e.name || t.targetName, i = e.path || e.newPath || a.replace(/[^\\\/]+$/, n), c = {
				old: t.name,
				next: n,
				file: t,
				nativePath: a,
				studentName: o,
				rotation: s
			};
			if (B.pushBatch(this.state.folder, [c]), t.name = n, t.targetName = n, t.userEditedName = F(n), t.isRenamed = !0, t.status = "renamed", t.path = i, t.nativePath = i, t.rotation = 0, t._pdfBytes = null, t._blobUrl && typeof URL < "u" && URL.revokeObjectURL) {
				try {
					URL.revokeObjectURL(t._blobUrl);
				} catch {}
				t._blobUrl = null;
			}
			t.url = `${typeof window < "u" && window.location?.origin && !window.location.origin.startsWith("file:") && !window.location.origin.includes("tauri") ? window.location.origin : "http://localhost:3000"}/api/serve-file?path=${encodeURIComponent(i)}`, r.show("Renamed Successfully", F(n), "success");
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
			let e = R(t.targetName);
			if (e) {
				r.show("Validation Error", `${F(t.name)}: ${e}`, "error");
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
			await le(this.state.folder, t, (e, t) => {
				console.log(`[Rename Progress] ${e}%: ${t}`);
			}), B.pushBatch(this.state.folder, t), e.forEach((e) => {
				if (e.name = e.targetName, e.isRenamed = !0, e.status = "renamed", e.rotation = 0, e._pdfBytes = null, e._blobUrl && typeof URL < "u" && URL.revokeObjectURL) {
					try {
						URL.revokeObjectURL(e._blobUrl);
					} catch {}
					e._blobUrl = null;
				}
				e.path &&= e.path.replace(/[^\\\/]+$/, e.name), e.nativePath &&= e.nativePath.replace(/[^\\\/]+$/, e.name);
				let t = typeof window < "u" && window.location?.origin && !window.location.origin.startsWith("file:") && !window.location.origin.includes("tauri") ? window.location.origin : "http://localhost:3000";
				(e.path || e.nativePath) && (e.url = `${t}/api/serve-file?path=${encodeURIComponent(e.path || e.nativePath)}`);
			}), r.show("Batch Complete!", `Successfully renamed ${t.length} files.`, "success"), this.updateTelemetry(), this.renderQueue(), this.renderCurrentPreview(), this._computeDuplicateHashesAsync();
		} catch (e) {
			r.show("Rename Failed", e.message, "error");
		}
	}
	async handleUndo() {
		if (!B.canUndo()) {
			r.show("Undo Stack Empty", "No previous rename batch to undo.", "info");
			return;
		}
		let e = B.pop();
		r.show("Reverting Changes", `Restoring ${e.plan.length} files...`, "info");
		try {
			await ue(e.dir, e.plan, (e, t) => {
				console.log(`[Undo Progress] ${e}%: ${t}`);
			}), e.plan.forEach((e) => {
				let t = this.state.files.find((t) => t.targetName === e.next || t.name === e.next || e.file && t.id === e.file.id);
				if (t) {
					t.name = e.old, t.targetName = e.old, t.isRenamed = !1, t.status = "pending";
					let n = e.nativePath || (this.state.folder?.path ? `${this.state.folder.path}/${e.old}` : t.path?.replace(/[^\\\/]+$/, e.old));
					n && (t.path = n, t.nativePath = n, t.url = X(t));
				}
			}), r.show("Undo Successful", `Restored ${e.plan.length} files to original names.`, "success"), this.updateTelemetry(), this.renderQueue(), this.renderCurrentPreview(), this._computeDuplicateHashesAsync();
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
						let e = xe(r.name, this.state.studentName, this.state.settings?.groups, this.getActivePresetDocuments());
						if (r.smartEvaluation = e, r.smartConfidence = e.confidence, r.smartDocType = e.docType, e.confidence >= 50 && e.docType) {
							r.docType = e.docType, r.isMatched = !0, e.confidence >= 80 && o++;
							let t = z(`${L(e.docType, this.state.studentName, this.state.settings?.groups, this.state.style).replace(/(\.[a-zA-Z0-9]+)+$/i, "").trim()}${r.ext || ("." + r.name.split(".").pop()).toLowerCase()}`, r.name, a, this.state.studentName);
							a.add(t), r.targetName = t, r.status = e.confidence >= 80 ? "matched" : "needs_review";
						} else r.isMatched = !1, r.docType = null, r.status = "unmatched";
					} catch (e) {
						console.error("[DocMitra Renamer] Filename match error on file:", r.name, e), r.smartConfidence = 0, r.isMatched = !1, r.docType = null, r.status = "unmatched";
					} finally {
						r.isScanning = !1;
					}
					this.updateTelemetry(), this.renderQueue(), await new Promise((e) => setTimeout(e, 40));
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
		e && [
			"MAHA DBT",
			"SWAYAM DEENDAYAL YOJANA",
			"CET CELL",
			"EDUCATIONAL DOCUMENTS"
		].includes(e) ? this.state.activePreset = e : this.state.activePreset = "MAHA DBT", this.state.documentPresets = JSON.parse(JSON.stringify(mt)), this.savePresetsAndSettings();
		try {
			let e = localStorage.getItem("docmitra_custom_shortcuts");
			if (e && (this.state.customShortcuts = JSON.parse(e), Array.isArray(this.state.customShortcuts))) for (let e of this.state.customShortcuts) {
				if (!e || !e.code) continue;
				let t = e.code.toUpperCase(), n = this.shortcuts21.findIndex((e) => e.code.toUpperCase() === t), r = {
					code: t,
					codes: e.codes || [t],
					label: e.label || e.canonical || t,
					canonical: T(e.canonical || e.label || t),
					keywords: Array.isArray(e.keywords) ? e.keywords : []
				};
				n === -1 ? this.shortcuts21.push(r) : this.shortcuts21[n] = r;
			}
		} catch (e) {
			console.warn("[DocMitra Renamer] Failed to parse custom shortcuts:", e);
		}
		let t = !1, n = (e) => {
			if (!e || typeof e != "string") return e;
			let t = e.trim().toUpperCase();
			return /^[A-Z0-9]+_\d+$/.test(t) ? t.replace(/_(\d+)$/, "$1") : t;
		};
		if (this.state.documentPresets && typeof this.state.documentPresets == "object") for (let e of Object.keys(this.state.documentPresets)) {
			let r = this.state.documentPresets[e];
			if (Array.isArray(r)) for (let e of r) {
				if (e && e.code) {
					let r = n(e.code);
					r !== e.code && (e.code = r, t = !0);
				}
				if (e && Array.isArray(e.codes)) {
					let r = e.codes.map((e) => n(e));
					JSON.stringify(r) !== JSON.stringify(e.codes) && (e.codes = r, t = !0);
				}
			}
		}
		if (Array.isArray(this.state.customShortcuts)) for (let e of this.state.customShortcuts) {
			if (e && e.code) {
				let r = n(e.code);
				r !== e.code && (e.code = r, t = !0);
			}
			if (e && Array.isArray(e.codes)) {
				let r = e.codes.map((e) => n(e));
				JSON.stringify(r) !== JSON.stringify(e.codes) && (e.codes = r, t = !0);
			}
		}
		if (Array.isArray(this.shortcuts21)) for (let e of this.shortcuts21) e && e.code && (e.code = n(e.code)), e && Array.isArray(e.codes) && (e.codes = e.codes.map((e) => n(e)));
		t && this.savePresetsAndSettings(), this.syncPresetsToShortcuts();
		let r = this.getAllPresetDocuments();
		O(r);
		for (let e of r) e && e.code && e.name && (ie(e.code, e.name, e.keywords), E(e.name, e.name));
		try {
			let e = localStorage.getItem("docmitra_rename_linked_rules");
			e && (this.state.linkedRules = JSON.parse(e));
		} catch (e) {
			console.warn("[DocMitra Renamer] Failed to parse linked rules:", e);
		}
		let i = [
			{
				id: "link_10th",
				combined: "10TH MARKSHEET AND PASSING CERTIFICATE",
				part1: "10TH MARKSHEET",
				part2: "10TH PASSING CERTIFICATE"
			},
			{
				id: "link_12th",
				combined: "12TH MARKSHEET AND PASSING CERTIFICATE",
				part1: "12TH MARKSHEET",
				part2: "12TH PASSING CERTIFICATE"
			},
			{
				id: "link_domicile_nationality",
				combined: "DOMICILE AND NATIONALITY CERTIFICATE",
				part1: "DOMICILE CERTIFICATE",
				part2: "NATIONALITY CERTIFICATE"
			}
		];
		if (!Array.isArray(this.state.linkedRules) || this.state.linkedRules.length === 0) this.state.linkedRules = JSON.parse(JSON.stringify(i)), this.saveLinkedRules();
		else {
			this.state.linkedRules = this.state.linkedRules.map((e) => {
				let t = T(e.combined), n = T(e.part1), r = T(e.part2);
				return (e.id === "link_domicile_nationality" || n === "DOMICILE CERTIFICATE" && (r.includes("DOMOCILE") || r.includes("DOMICILE"))) && (r = "NATIONALITY CERTIFICATE", t = "DOMICILE AND NATIONALITY CERTIFICATE"), (e.id === "link_12th" || n === "12TH MARKSHEET" && (r === "12TH PASSING" || r === "12TH PASSING CERTIFICATE")) && (r = "12TH PASSING CERTIFICATE", t = "12TH MARKSHEET AND PASSING CERTIFICATE"), (e.id === "link_10th" || n === "10TH MARKSHEET" && (r === "10TH PASSING" || r === "10TH PASSING CERTIFICATE")) && (r = "10TH PASSING CERTIFICATE", t = "10TH MARKSHEET AND PASSING CERTIFICATE"), {
					id: e.id || `link_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
					combined: t,
					part1: n,
					part2: r
				};
			});
			let e = new Set(this.state.linkedRules.map((e) => e.combined));
			for (let t of i) e.has(t.combined) || this.state.linkedRules.push(t);
			this.saveLinkedRules(), this.updateLinkedRulesCountBadge();
		}
	}
	savePresetsAndSettings() {
		try {
			localStorage.setItem("docmitra_rename_presets", JSON.stringify(this.state.documentPresets)), localStorage.setItem("docmitra_active_preset", this.state.activePreset), this.state.linkedRules && localStorage.setItem("docmitra_rename_linked_rules", JSON.stringify(this.state.linkedRules)), this.state.settings && (this.state.settings.activeChecklist = this.state.activePreset, this.state.settings.checklists = this.state.documentPresets, Ge(this.state.settings)), this.state.customShortcuts && localStorage.setItem("docmitra_custom_shortcuts", JSON.stringify(this.state.customShortcuts)), qe({ forms: this.state.documentPresets }).catch(() => {});
		} catch (e) {
			console.warn("[DocMitra Renamer] Failed to persist presets and settings:", e);
		}
	}
	saveLinkedRules() {
		try {
			Array.isArray(this.state.linkedRules) && localStorage.setItem("docmitra_rename_linked_rules", JSON.stringify(this.state.linkedRules));
		} catch (e) {
			console.warn("[DocMitra Renamer] Failed to save linked rules:", e);
		}
		this.updateLinkedRulesCountBadge();
	}
	updateLinkedRulesCountBadge() {
		let e = (this.state.linkedRules || []).length, t = document.getElementById("linkedRulesCountBadge");
		t && (t.textContent = String(e));
		let n = document.getElementById("linkedTableCountBadge");
		n && (n.textContent = String(e));
	}
	getLinkedRules() {
		return Array.isArray(this.state.linkedRules) && this.state.linkedRules.length > 0 ? this.state.linkedRules : [
			{
				id: "link_10th",
				combined: "10TH MARKSHEET AND PASSING CERTIFICATE",
				part1: "10TH MARKSHEET",
				part2: "10TH PASSING CERTIFICATE"
			},
			{
				id: "link_12th",
				combined: "12TH MARKSHEET AND PASSING CERTIFICATE",
				part1: "12TH MARKSHEET",
				part2: "12TH PASSING CERTIFICATE"
			},
			{
				id: "link_domicile_nationality",
				combined: "DOMICILE AND NATIONALITY CERTIFICATE",
				part1: "DOMICILE CERTIFICATE",
				part2: "NATIONALITY CERTIFICATE"
			}
		];
	}
	isChecklistRuleSatisfied(e, t) {
		let n = T(e), r = new Set(Array.from(t || []).map((e) => T(e)));
		if (r.has(n)) return !0;
		let i = this.getLinkedRules();
		for (let e of i) {
			let t = T(e.combined), i = T(e.part1), a = T(e.part2);
			if (t && r.has(t) && (n === i || n === a) || n === t && i && a && r.has(i) && r.has(a)) return !0;
		}
		return !1;
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
					if (r && (t.canonical = r.toUpperCase(), t.label = r), Array.isArray(t.keywords)) {
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
		let t = document.getElementById("tabContentPresets"), n = document.getElementById("tabContentShortcuts"), r = document.getElementById("tabContentLinked"), i = document.getElementById("tabBtnPresets"), a = document.getElementById("tabBtnShortcuts"), o = document.getElementById("tabBtnLinked");
		[
			i,
			a,
			o
		].forEach((e) => {
			e?.classList.remove("text-primary", "border-primary", "font-bold"), e?.classList.add("text-secondary", "border-transparent", "font-medium");
		}), t?.classList.add("hidden"), n?.classList.add("hidden"), r?.classList.add("hidden"), e === "presets" ? (t?.classList.remove("hidden"), i?.classList.add("text-primary", "border-primary", "font-bold"), i?.classList.remove("text-secondary", "border-transparent", "font-medium")) : e === "shortcuts" ? (n?.classList.remove("hidden"), a?.classList.add("text-primary", "border-primary", "font-bold"), a?.classList.remove("text-secondary", "border-transparent", "font-medium")) : e === "linked" && (r?.classList.remove("hidden"), o?.classList.add("text-primary", "border-primary", "font-bold"), o?.classList.remove("text-secondary", "border-transparent", "font-medium")), this.buildSettingsPresetDropdown(), this.renderPresetDocsTable(), this.renderShortcutsTable(), this.renderLinkedRulesTable();
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
			i.className = "row-compact-42 hover:bg-surface-container-low transition-colors group";
			let a = e.indexOf(t);
			i.innerHTML = `
        <td class="py-1 px-3 text-center text-secondary font-mono-code text-[11px]" style="width: 44px;">${r + 1}</td>
        <td class="py-1 px-3 font-semibold text-on-surface truncate text-[12px]" style="width: 32%;" title="${U(t.name)}">${U(t.name)}</td>
        <td class="py-1 px-3 text-secondary text-[11px] overflow-visible relative" style="width: 55%;">${this._renderKeywordsWithPopover(t.keywords)}</td>
        <td class="py-1 px-3 text-right whitespace-nowrap pr-4" style="width: 80px;">
          <div class="flex items-center justify-end gap-1">
            <button class="w-6 h-6 rounded hover:bg-primary/10 text-secondary hover:text-primary transition-colors flex items-center justify-center cursor-pointer btn-edit-doc" title="Edit document" type="button" data-doc-idx="${a}">
              <span class="material-symbols-outlined text-[15px]">edit</span>
            </button>
            <button class="w-6 h-6 rounded hover:bg-error/10 text-secondary hover:text-error transition-colors flex items-center justify-center cursor-pointer btn-del-doc" title="Remove document from preset" type="button" data-doc-idx="${a}">
              <span class="material-symbols-outlined text-[15px]">delete</span>
            </button>
          </div>
        </td>
      `;
			let o = i.querySelector(".btn-edit-doc");
			o && o.addEventListener("click", () => this.openEditDocumentModal(t, a));
			let s = i.querySelector(".btn-del-doc");
			s && s.addEventListener("click", () => this.handleRemoveDocFromPreset(a)), this._initKeywordPopoverEvents(i), n.appendChild(i);
		});
	}
	_renderKeywordsWithPopover(e) {
		let t = Array.isArray(e) ? e : typeof e == "string" && e ? e.split(",").map((e) => e.trim()).filter(Boolean) : [];
		if (!t || t.length === 0) return "<span class=\"italic opacity-50 text-[11px]\">-</span>";
		let n = t.slice(0, 2), r = t.slice(2), i = n.map((e) => `<span class="px-2 py-0.5 rounded bg-surface-container text-on-surface font-medium text-[11px] border border-outline-variant/30 shrink-0 truncate max-w-[120px]" title="${U(e)}">${U(e)}</span>`).join("");
		if (r.length === 0) return `<div class="flex items-center gap-1.5 h-full overflow-hidden">${i}</div>`;
		let a = r.map((e) => `<span class="px-1.5 py-0.5 rounded bg-surface-container text-secondary text-[10px] border border-outline-variant/30">${U(e)}</span>`).join("");
		return `
      <div class="flex items-center gap-1.5 h-full overflow-visible">
        ${i}
        <div class="relative inline-block keyword-popover-container">
          <button type="button" class="btn-kw-popover px-2 py-0.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary font-bold text-[10px] border border-primary/20 cursor-pointer transition-all flex items-center gap-0.5 shrink-0 select-none" title="Click to view all ${t.length} keywords">
            <span>+${r.length} more</span>
            <span class="material-symbols-outlined text-[12px]">expand_more</span>
          </button>
          <div class="keyword-popover-card hidden">
            <div class="text-[10px] font-bold text-secondary uppercase font-mono-code mb-1.5 flex items-center justify-between">
              <span>All ${t.length} Keyword Aliases</span>
              <span class="text-primary font-bold">100% Match Engine</span>
            </div>
            <div class="flex flex-wrap gap-1 max-h-40 overflow-y-auto pr-1 custom-pan-scroll">
              ${a}
            </div>
          </div>
        </div>
      </div>
    `;
	}
	_initKeywordPopoverEvents(e) {
		e && e.querySelectorAll(".btn-kw-popover").forEach((e) => {
			e.addEventListener("click", (t) => {
				t.stopPropagation();
				let n = e.closest(".keyword-popover-container")?.querySelector(".keyword-popover-card");
				if (!n) return;
				let r = n.classList.contains("hidden");
				document.querySelectorAll(".keyword-popover-card:not(.hidden)").forEach((e) => e.classList.add("hidden")), r && n.classList.remove("hidden");
			});
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
			r.className = "row-compact-42 hover:bg-surface-container-low transition-colors group";
			let i = Array.isArray(t.codes) && t.codes.length > 0 ? t.codes : t.code ? [t.code] : [], a = i.map((e) => `<span class="px-1.5 py-0.5 rounded font-mono-code font-bold text-[10px] ${dt(e)}">${e}</span>`).join(" ");
			r.innerHTML = `
        <td class="py-1 px-3 text-center text-secondary font-mono-code text-[11px]" style="width: 44px;">${n + 1}</td>
        <td class="py-1 px-3 whitespace-normal" style="width: 15%;"><div class="flex flex-wrap gap-1 max-h-[30px] overflow-hidden">${a}</div></td>
        <td class="py-1 px-3 font-semibold text-on-surface truncate text-[12px]" style="width: 25%;" title="${U(t.canonical || t.label)}">${U(t.canonical || t.label)}</td>
        <td class="py-1 px-3 text-secondary text-[11px] overflow-visible relative" style="width: 46%;">${this._renderKeywordsWithPopover(t.keywords)}</td>
        <td class="py-1 px-3 text-right whitespace-nowrap pr-4" style="width: 80px;">
          <div class="flex items-center justify-end gap-1">
            <button class="w-6 h-6 rounded hover:bg-primary/10 text-secondary hover:text-primary transition-colors flex items-center justify-center cursor-pointer btn-edit-shortcut" title="Edit shortcut" type="button" data-code="${t.code || i[0]}">
              <span class="material-symbols-outlined text-[15px]">edit</span>
            </button>
            <button class="w-6 h-6 rounded hover:bg-error/10 text-secondary hover:text-error transition-colors flex items-center justify-center cursor-pointer btn-del-shortcut" title="Delete shortcut" type="button" data-code="${t.code || i[0]}">
              <span class="material-symbols-outlined text-[15px]">delete</span>
            </button>
          </div>
        </td>
      `;
			let o = r.querySelector(".btn-edit-shortcut");
			o && o.addEventListener("click", () => this.handleEditShortcut(t.code || i[0]));
			let s = r.querySelector(".btn-del-shortcut");
			s && s.addEventListener("click", () => this.handleRemoveShortcut(t.code || i[0])), this._initKeywordPopoverEvents(r), e.appendChild(r);
		});
	}
	handleSwitchActivePreset(e) {
		e && this.state.documentPresets[e] && (this.state.activePreset = e, this.savePresetsAndSettings(), this._recalculateTargetNames(!0), this.updateTelemetry(), this.renderQueue(), this.renderCurrentPreview(), this.renderSettingsModal("presets"), r.show("Preset Switched", `Active preset: ${e}`, "success"));
	}
	_showInlinePresetAction(e, t, n) {
		let r = document.getElementById("settingsPresetContainer");
		if (!r) return;
		r.innerHTML = "";
		let i = document.createElement("div");
		i.id = "settingsPresetInlineForm", i.className = "flex items-center gap-1.5 bg-surface-container-lowest border-2 border-primary rounded-xl px-2.5 h-[38px] shadow-sm select-none min-w-[260px] animate-in fade-in duration-100";
		let a = document.createElement("span");
		a.className = "w-1.5 h-1.5 rounded-full bg-primary inline-block shrink-0 shadow-[0_0_6px_rgba(0,55,176,0.4)]", i.appendChild(a);
		let o = document.createElement("span");
		o.className = "font-mono-code text-[10px] text-primary uppercase font-bold tracking-wider shrink-0", o.textContent = `${e}:`, i.appendChild(o);
		let s = document.createElement("input");
		s.id = "inputInlinePresetAction", s.type = "text", s.value = t || "", s.className = "font-mono-code text-[12px] font-bold text-on-surface bg-transparent border-b border-primary/50 focus:border-primary focus:outline-none w-44 uppercase px-1", i.appendChild(s);
		let c = document.createElement("button");
		c.id = "btnApplyInlinePresetAction", c.type = "button", c.className = "w-6 h-6 rounded bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white flex items-center justify-center cursor-pointer transition shrink-0", c.title = "Apply (Enter)", c.innerHTML = "<svg class=\"w-3.5 h-3.5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path d=\"M5 13l4 4L19 7\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>", i.appendChild(c);
		let l = document.createElement("button");
		l.id = "btnCancelInlinePresetAction", l.type = "button", l.className = "w-6 h-6 rounded bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-700 flex items-center justify-center cursor-pointer transition shrink-0", l.title = "Cancel (Esc)", l.innerHTML = "<svg class=\"w-3.5 h-3.5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path d=\"M6 18L18 6M6 6l12 12\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>", i.appendChild(l), r.appendChild(i), s.focus(), s.select();
		let u = () => {
			let e = s.value.trim().toUpperCase();
			e ? n(e) : this.buildSettingsPresetDropdown();
		};
		c.onclick = (e) => {
			e.stopPropagation(), u();
		}, l.onclick = (e) => {
			e.stopPropagation(), this.buildSettingsPresetDropdown();
		}, s.onkeydown = (e) => {
			e.key === "Enter" ? (e.preventDefault(), e.stopPropagation(), u()) : e.key === "Escape" && (e.preventDefault(), e.stopPropagation(), this.buildSettingsPresetDropdown());
		};
	}
	showCustomConfirmationDialog({ title: e = "Confirm Action", messageHtml: t = "", confirmText: n = "Confirm", onConfirm: r = null }) {
		let i = document.getElementById("modalConfirmActionDialog");
		i || (i = document.createElement("div"), i.id = "modalConfirmActionDialog", i.className = "fixed inset-0 z-[10000] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-in fade-in duration-150", document.body.appendChild(i)), i.innerHTML = `
      <div class="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-rose-200 overflow-hidden p-5 flex flex-col items-center text-center space-y-4">
        <div class="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="space-y-1">
          <h3 class="text-base font-bold text-slate-900 font-heading">${U(e)}</h3>
          <p class="text-xs text-slate-600 leading-relaxed">
            ${t}
          </p>
        </div>
        <div class="flex items-center justify-center gap-2.5 w-full pt-1">
          <button id="btnCancelCustomConfirm" type="button" class="flex-1 py-2 px-3 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer">
            Cancel
          </button>
          <button id="btnProceedCustomConfirm" type="button" class="flex-1 py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold shadow-xs transition cursor-pointer">
            ${U(n)}
          </button>
        </div>
      </div>
    `, i.classList.remove("hidden");
		let a = () => {
			i.classList.add("hidden"), document.removeEventListener("keydown", o);
		}, o = (e) => {
			e.key === "Escape" && (e.preventDefault(), e.stopPropagation(), a());
		};
		document.addEventListener("keydown", o);
		let s = i.querySelector("#btnCancelCustomConfirm");
		s && (s.onclick = a), i.onclick = (e) => {
			e.target === i && a();
		};
		let c = i.querySelector("#btnProceedCustomConfirm");
		c && (c.onclick = () => {
			a(), typeof r == "function" && r();
		});
	}
	showCustomPresetDeleteDialog(e) {
		this.showCustomConfirmationDialog({
			title: "Delete Preset",
			messageHtml: `Are you sure you want to permanently delete preset <strong class="text-rose-700 font-mono">${U(e)}</strong>?`,
			confirmText: "Delete Preset",
			onConfirm: () => {
				delete this.state.documentPresets[e], this.state.settings && this.state.settings.checklists && delete this.state.settings.checklists[e];
				let t = Object.keys(this.state.documentPresets);
				this.state.activePreset = t[0] || "MAHA DBT", this.savePresetsAndSettings(), this._recalculateTargetNames(!0), this.updateTelemetry(), this.renderQueue(), this.renderCurrentPreview(), this.renderSettingsModal("presets"), r.show("Preset Deleted", `Preset "${e}" deleted. Switched to ${this.state.activePreset}.`, "info");
			}
		});
	}
	renderLinkedRulesTable() {
		let e = this.getLinkedRules(), t = document.getElementById("linkedTableCountBadge"), n = document.getElementById("linkedRulesCountBadge"), r = document.getElementById("linkedRulesTableBody");
		if (!r) return;
		r.innerHTML = "";
		let i = (this._linkedRulesSearchQuery || "").trim().toLowerCase(), a = i ? e.filter((e) => {
			let t = (e.combined || "").toLowerCase(), n = (e.part1 || "").toLowerCase(), r = (e.part2 || "").toLowerCase();
			return t.includes(i) || n.includes(i) || r.includes(i);
		}) : e;
		if (t && (t.textContent = i ? `${a.length} / ${e.length}` : String(e.length)), n && (n.textContent = String(e.length)), a.length === 0) {
			let e = document.createElement("tr");
			e.innerHTML = i ? `<td colspan="5" class="py-6 text-center text-secondary italic">No linked rules match "${U(this._linkedRulesSearchQuery)}".</td>` : "<td colspan=\"5\" class=\"py-6 text-center text-secondary italic\">No linked rules configured. Click \"+ Add Link Rule\" to link combined documents.</td>", r.appendChild(e);
		} else a.forEach((e, t) => {
			let n = document.createElement("tr");
			n.className = "row-compact-42 hover:bg-surface-container-low transition-colors group", n.innerHTML = `
        <td class="py-1 px-3 text-center text-secondary font-mono-code text-[11px]" style="width: 44px;">${t + 1}</td>
        <td class="py-1 px-3 font-semibold text-primary truncate text-[12px]" style="width: 32%;" title="${U(e.combined)}">
          <div class="flex items-center gap-1.5 truncate">
            <span class="material-symbols-outlined text-[14px] text-primary shrink-0">link</span>
            <span class="truncate">${U(e.combined)}</span>
          </div>
        </td>
        <td class="py-1 px-3 text-on-surface truncate text-[12px]" style="width: 27%;" title="${U(e.part1)}">
          <span class="px-2 py-0.5 rounded bg-surface-container text-slate-800 text-[11px] font-mono-code">${U(e.part1)}</span>
        </td>
        <td class="py-1 px-3 text-on-surface truncate text-[12px]" style="width: 27%;" title="${U(e.part2)}">
          <span class="px-2 py-0.5 rounded bg-surface-container text-slate-800 text-[11px] font-mono-code">${U(e.part2)}</span>
        </td>
        <td class="py-1 px-3 text-right whitespace-nowrap pr-4" style="width: 80px;">
          <div class="flex items-center justify-end gap-1">
            <button class="w-6 h-6 rounded hover:bg-primary/10 text-secondary hover:text-primary transition-colors flex items-center justify-center cursor-pointer btn-edit-link" title="Edit linked rule" type="button" data-rule-id="${U(e.id)}">
              <span class="material-symbols-outlined text-[15px]">edit</span>
            </button>
            <button class="w-6 h-6 rounded hover:bg-error/10 text-secondary hover:text-error transition-colors flex items-center justify-center cursor-pointer btn-del-link" title="Delete linked rule" type="button" data-rule-id="${U(e.id)}">
              <span class="material-symbols-outlined text-[15px]">delete</span>
            </button>
          </div>
        </td>
      `;
			let i = n.querySelector(".btn-edit-link");
			i && i.addEventListener("click", () => this.openAddLinkRuleModal(e.id));
			let a = n.querySelector(".btn-del-link");
			a && a.addEventListener("click", () => this.handleDeleteLinkRule(e.id)), r.appendChild(n);
		});
	}
	getMasterCanonicalDocuments() {
		let e = /* @__PURE__ */ new Set();
		if (Array.isArray(this.shortcuts21)) for (let t of this.shortcuts21) {
			let n = (t.canonical || t.label || t.name || "").trim();
			n && e.add(T(n));
		}
		if (Array.isArray(this.state.customShortcuts)) for (let t of this.state.customShortcuts) {
			let n = (t.canonical || t.label || t.name || "").trim();
			n && e.add(T(n));
		}
		if (this.state.documentPresets) {
			for (let t of Object.values(this.state.documentPresets)) if (Array.isArray(t)) for (let n of t) {
				let t = (n.name || n.label || n || "").trim();
				t && e.add(T(t));
			}
		}
		let t = this.getLinkedRules();
		for (let n of t) n.combined && e.add(T(n.combined)), n.part1 && e.add(T(n.part1)), n.part2 && e.add(T(n.part2));
		Object.values(w).forEach((t) => {
			t && e.add(t.toUpperCase());
		});
		let n = /\b(test|anita|vijay|all document|2026)\b/i;
		return Array.from(e).filter((e) => !!e && !n.test(e)).sort((e, t) => e.localeCompare(t));
	}
	_renderSearchableCombobox(e, t, { placeholder: n, selectedVal: r, excludedDocs: i = [], onChange: a }) {
		let o = document.getElementById(e), s = document.getElementById(t);
		if (!o || !s) return;
		s.value = r || "", o.innerHTML = "";
		let c = this.getMasterCanonicalDocuments(), l = new Set((i || []).map((e) => (e || "").trim().toUpperCase())), u = c.filter((e) => !l.has(e.trim().toUpperCase())), d = document.createElement("div");
		d.className = "combobox-trigger w-full h-10 px-3 rounded-xl bg-surface border border-outline-variant/60 hover:border-primary/60 focus:border-primary focus:ring-2 focus:ring-primary/20 flex items-center justify-between cursor-pointer transition-all shadow-2xs select-none";
		let f = document.createElement("span");
		f.className = `truncate font-mono-code text-[12px] font-bold ${r ? "text-on-surface" : "text-secondary/70"}`, f.textContent = r || n, d.appendChild(f);
		let p = document.createElement("span");
		p.className = "material-symbols-outlined text-[18px] text-secondary shrink-0 transition-transform duration-150", p.textContent = "expand_more", d.appendChild(p), o.appendChild(d);
		let m = document.createElement("div");
		m.className = "combobox-panel hidden absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-2xl z-[10000] overflow-hidden flex flex-col animate-in fade-in duration-100";
		let h = document.createElement("div");
		h.className = "p-2 border-b border-slate-100 bg-slate-50/90 sticky top-0 z-10 flex items-center gap-1.5", h.innerHTML = `
      <span class="material-symbols-outlined text-[16px] text-slate-400 shrink-0">search</span>
      <input type="text" class="combobox-search-input w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[12px] font-mono-code font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" placeholder="Type to filter ${u.length} documents...">
    `, m.appendChild(h);
		let g = h.querySelector("input"), _ = document.createElement("div");
		_.className = "combobox-items-list max-h-52 overflow-y-auto divide-y divide-slate-50 py-1", m.appendChild(_), o.appendChild(m);
		let v = (e = "") => {
			_.innerHTML = "";
			let t = e.trim().toLowerCase(), n = t ? u.filter((e) => e.toLowerCase().includes(t)) : u;
			if (n.length === 0) {
				let e = document.createElement("div");
				e.className = "p-4 text-center text-[12px] text-slate-400 italic", e.textContent = "No matching documents found", _.appendChild(e);
			} else n.forEach((e) => {
				let t = r && e.toUpperCase() === r.toUpperCase(), n = document.createElement("div");
				n.className = `combobox-item px-3.5 py-2 text-[12px] font-mono-code font-semibold cursor-pointer flex items-center justify-between transition-colors ${t ? "bg-blue-50 text-blue-700 font-bold" : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"}`;
				let i = document.createElement("span");
				if (i.className = "truncate mr-2", i.textContent = e, n.appendChild(i), t) {
					let e = document.createElement("span");
					e.className = "material-symbols-outlined text-[16px] text-blue-600 shrink-0", e.textContent = "check", n.appendChild(e);
				}
				n.addEventListener("click", (t) => {
					t.stopPropagation(), s.value = e, b(), typeof a == "function" && a(e);
				}), _.appendChild(n);
			});
		};
		v(""), g && (g.addEventListener("input", (e) => {
			v(e.target.value);
		}), g.addEventListener("click", (e) => e.stopPropagation()));
		let y = () => {
			document.querySelectorAll(".combobox-panel").forEach((e) => {
				e !== m && e.classList.add("hidden");
			}), m.classList.remove("hidden"), p.style.transform = "rotate(180deg)", g && (g.value = "", v(""), setTimeout(() => g.focus(), 50));
		}, b = () => {
			m.classList.add("hidden"), p.style.transform = "rotate(0deg)";
		};
		d.addEventListener("click", (e) => {
			e.stopPropagation(), m.classList.contains("hidden") ? y() : b();
		});
		let x = (e) => {
			o.contains(e.target) || (b(), document.removeEventListener("click", x));
		};
		document.addEventListener("click", x);
	}
	openAddLinkRuleModal(e = null) {
		let t = document.getElementById("modalAddLinkRule");
		if (!t) return;
		let n = document.getElementById("modalAddLinkRuleTitle"), r = document.getElementById("inputEditLinkRuleId"), i = null;
		e && (i = this.getLinkedRules().find((t) => t.id === e));
		let a = i && i.part1 || "", o = i && i.part2 || "", s = i && i.combined || "";
		i ? (n && (n.textContent = "Edit Link Rule"), r && (r.value = i.id)) : (n && (n.textContent = "Add Link Rule"), r && (r.value = ""));
		let c = () => {
			this._renderSearchableCombobox("comboboxContainerPart1", "selectLinkPart1", {
				placeholder: "-- Select Document No. 1 --",
				selectedVal: a,
				excludedDocs: [],
				onChange: (e) => {
					a = e, o && o.toUpperCase() === a.toUpperCase() && (o = ""), s && s.toUpperCase() === a.toUpperCase() && (s = ""), c();
				}
			}), this._renderSearchableCombobox("comboboxContainerPart2", "selectLinkPart2", {
				placeholder: "-- Select Document No. 2 --",
				selectedVal: o,
				excludedDocs: a ? [a] : [],
				onChange: (e) => {
					o = e, s && s.toUpperCase() === o.toUpperCase() && (s = ""), c();
				}
			}), this._renderSearchableCombobox("comboboxContainerCombined", "selectLinkCombined", {
				placeholder: "-- Select Combined Document --",
				selectedVal: s,
				excludedDocs: [a, o].filter(Boolean),
				onChange: (e) => {
					s = e, c();
				}
			});
		};
		c(), t.classList.remove("hidden");
	}
	closeAddLinkRuleModal() {
		let e = document.getElementById("modalAddLinkRule");
		e && e.classList.add("hidden");
		let t = document.getElementById("inputEditLinkRuleId");
		t && (t.value = ""), document.querySelectorAll(".combobox-panel").forEach((e) => e.classList.add("hidden"));
	}
	handleSaveLinkRule() {
		let e = document.getElementById("inputEditLinkRuleId"), t = document.getElementById("selectLinkCombined"), n = document.getElementById("selectLinkPart1"), i = document.getElementById("selectLinkPart2"), a = e ? e.value.trim() : "", o = t ? t.value.trim().toUpperCase() : "", s = n ? n.value.trim().toUpperCase() : "", c = i ? i.value.trim().toUpperCase() : "";
		if (!o || !s || !c) r.show("Missing Selection", "Please select Document No. 1, Document No. 2, and Combined Document.", "warning");
		else if (s === c) r.show("Invalid Rule", "Document No. 1 and Document No. 2 cannot be the same document.", "warning");
		else if (o === s || o === c) r.show("Invalid Rule", "Combined document cannot be identical to its component parts.", "warning");
		else if (this.getLinkedRules().find((e) => {
			if (a && e.id === a) return !1;
			let t = (e.combined || "").toUpperCase() === o, n = (e.part1 || "").toUpperCase() === s && (e.part2 || "").toUpperCase() === c || (e.part1 || "").toUpperCase() === c && (e.part2 || "").toUpperCase() === s;
			return t || n;
		})) r.show("Duplicate Rule", "A link rule with these documents already exists.", "warning");
		else {
			if (a) {
				let e = this.state.linkedRules.findIndex((e) => e.id === a);
				e !== -1 && (this.state.linkedRules[e] = {
					id: a,
					combined: o,
					part1: s,
					part2: c
				});
			} else {
				let e = `link_${Date.now()}`;
				Array.isArray(this.state.linkedRules) || (this.state.linkedRules = []), this.state.linkedRules.push({
					id: e,
					combined: o,
					part1: s,
					part2: c
				});
			}
			this.saveLinkedRules(), this.closeAddLinkRuleModal(), this.renderLinkedRulesTable(), this.updateTelemetry(), this.updateMissingModal(), r.show("Rule Saved", `Linked rule for "${o}" saved successfully.`, "success");
		}
	}
	handleDeleteLinkRule(e) {
		let t = this.getLinkedRules().find((t) => t.id === e);
		t && this.showCustomConfirmationDialog({
			title: "Delete Link Rule",
			messageHtml: `Are you sure you want to permanently delete the link rule for <strong class="text-rose-700 font-mono">${U(t.combined)}</strong>?`,
			confirmText: "Delete Rule",
			onConfirm: () => {
				this.state.linkedRules = this.getLinkedRules().filter((t) => t.id !== e), this.saveLinkedRules(), this.renderLinkedRulesTable(), this.updateTelemetry(), this.updateMissingModal(), r.show("Rule Deleted", `Removed linked rule for "${t.combined}".`, "info");
			}
		});
	}
	handleNewPreset() {
		this._showInlinePresetAction("NEW", "", (e) => {
			this.state.documentPresets[e] ? r.show("Preset Exists", `Preset "${e}" already exists.`, "warning") : (this.state.documentPresets[e] = [], this.handleSwitchActivePreset(e), r.show("Preset Created", `New preset "${e}" created.`, "success"));
		});
	}
	handleCopyPreset() {
		let e = this.state.activePreset, t = this.state.documentPresets[e] || [], n = `${e} 2`, i = 2;
		for (; this.state.documentPresets[n];) i++, n = `${e} ${i}`;
		this._showInlinePresetAction("COPY TO", n, (n) => {
			this.state.documentPresets[n] ? r.show("Duplicate Preset", `Preset "${n}" already exists.`, "warning") : (this.state.documentPresets[n] = JSON.parse(JSON.stringify(t)), this.handleSwitchActivePreset(n), r.show("Preset Copied", `Copied "${e}" to "${n}".`, "success"));
		});
	}
	handleRenamePreset() {
		let e = this.state.activePreset;
		this._showInlinePresetAction("RENAME", e, (t) => {
			t === e ? this.buildSettingsPresetDropdown() : this.state.documentPresets[t] ? r.show("Duplicate Name", `Preset "${t}" already exists.`, "warning") : (this.state.documentPresets[t] = this.state.documentPresets[e], delete this.state.documentPresets[e], this.handleSwitchActivePreset(t), r.show("Preset Renamed", `Preset renamed to "${t}".`, "success"));
		});
	}
	handleDeletePreset() {
		if (Object.keys(this.state.documentPresets).length <= 1) {
			r.show("Cannot Delete", "At least one preset must remain.", "warning");
			return;
		}
		let e = this.state.activePreset;
		this.showCustomPresetDeleteDialog(e);
	}
	handleResetPresetsDefault() {
		this.showCustomConfirmationDialog({
			title: "Reset Presets",
			messageHtml: "Reset document presets to factory defaults? All custom presets will be removed and default 4 presets restored.",
			confirmText: "Reset Presets",
			onConfirm: () => {
				this.state.documentPresets = JSON.parse(JSON.stringify(mt)), this.state.activePreset = "MAHA DBT", this.state.customShortcuts = [], this.shortcuts21 = JSON.parse(JSON.stringify(ft)), this.savePresetsAndSettings(), this._recalculateTargetNames(!0), this.updateTelemetry(), this.renderQueue(), this.renderCurrentPreview(), this.renderSettingsModal("presets"), r.show("Reset Complete", "Document presets restored to factory defaults.", "success");
			}
		});
	}
	handleRemoveDocFromPreset(e) {
		let t = this.state.documentPresets[this.state.activePreset];
		if (t && t[e]) {
			let n = t.splice(e, 1)[0];
			this.savePresetsAndSettings(), this._recalculateTargetNames(!0), this.updateTelemetry(), this.renderQueue(), this.renderCurrentPreview(), this.renderSettingsModal("presets"), r.show("Document Removed from Preset", `${n.name || "Document"} unlinked from "${this.state.activePreset}". Global shortcut preserved.`, "info");
		}
	}
	handleRemoveShortcut(e) {
		if (!e) return;
		let t = String(e).trim().toUpperCase(), n = this.shortcuts21.find((e) => e.code && e.code.toUpperCase() === t || Array.isArray(e.codes) && e.codes.some((e) => e && e.toUpperCase() === t)), i = (n?.canonical || n?.label || t).toUpperCase();
		this.shortcuts21 = n ? this.shortcuts21.filter((e) => e !== n) : this.shortcuts21.filter((e) => e.code.toUpperCase() !== t), this.state.customShortcuts && (this.state.customShortcuts = this.state.customShortcuts.filter((e) => {
			if (e === n || e.code && e.code.toUpperCase() === t || Array.isArray(e.codes) && e.codes.some((e) => e && e.toUpperCase() === t)) return !1;
			let r = (e.canonical || e.label || "").toUpperCase();
			return !(r && r === i);
		}));
		let a = 0;
		if (this.state.documentPresets) for (let e of Object.keys(this.state.documentPresets)) {
			let n = this.state.documentPresets[e];
			if (Array.isArray(n)) {
				let r = n.length;
				this.state.documentPresets[e] = n.filter((e) => {
					let n = (e.name || "").trim().toUpperCase(), r = (e.code || "").trim().toUpperCase();
					return !(n && n === i || r && r === t);
				}), n.length < r && a++;
			}
		}
		this.savePresetsAndSettings(), this.renderSettingsModal("shortcuts"), r.show("Shortcut Removed", `Removed "${i}" and unlinked from ${a} preset(s).`, "info");
	}
	openEditDocumentModal(e, t) {
		this._editingDocIdx = t, this._editingShortcutCode = null, this.openAddDocumentModal(e, !1);
	}
	handleEditShortcut(e) {
		let t = (e || "").toUpperCase(), n = this.resolveShortcut(t) || this.shortcuts21.find((e) => e.code && e.code.toUpperCase() === t || Array.isArray(e.codes) && e.codes.some((e) => e && e.toUpperCase() === t));
		if (!n) return;
		let r = (this.state.customShortcuts || []).find((e) => e.code && e.code.toUpperCase() === t || Array.isArray(e.codes) && e.codes.some((e) => e && e.toUpperCase() === t));
		this._editingShortcutCode = t, this._editingDocIdx = null;
		let i = Array.isArray(n.codes) && n.codes.length > 0 ? n.codes : [n.code || t];
		this.openAddDocumentModal({
			code: n.code || t,
			codes: i,
			name: n.canonical || n.label,
			keywords: r ? r.keywords : n.keywords || []
		}, !0);
	}
	findAvailableShortcutCode(e, t = "") {
		if (!e) return "";
		let n = String(e).trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
		if (!n) return "";
		let r = (t || "").trim().toUpperCase(), i = (e) => {
			if (this._currentShortcutCodes && this._currentShortcutCodes.some((t) => t && t.toUpperCase() === e)) return !0;
			let t = [...this.shortcuts21 || [], ...this.state.customShortcuts || []];
			for (let n of t) {
				let t = (n.canonical || n.label || n.name || "").trim().toUpperCase();
				if (!(r && t === r) && (n.code && n.code.toUpperCase() === e || Array.isArray(n.codes) && n.codes.some((t) => t && t.toUpperCase() === e))) return !0;
			}
			let n = this.getAllPresetDocuments();
			for (let t of n) {
				let n = (t.name || "").trim().toUpperCase();
				if (!(r && n === r) && t.code && t.code.toUpperCase() === e) return !0;
			}
			return !1;
		};
		if (!i(n)) return n;
		let a = 2, o = `${n}${a}`;
		for (; i(o);) a++, o = `${n}${a}`;
		return o;
	}
	renderShortcutChips(e = null) {
		let t = document.getElementById("containerShortcutChips");
		if (t) {
			if (t.innerHTML = "", !this._currentShortcutCodes || this._currentShortcutCodes.length === 0) {
				let e = document.createElement("span");
				e.className = "text-secondary text-[11px] italic select-none", e.textContent = "No short codes added. Type code above and click Add or press Enter.", t.appendChild(e);
			} else this._currentShortcutCodes.forEach((n) => {
				let r = e && e.toUpperCase() === n.toUpperCase(), i = document.createElement("span");
				i.className = `inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-primary text-white font-mono-code font-bold text-[11px] shadow-xs select-none transition-all duration-300 ${r ? "chip-glow-anim ring-2 ring-primary ring-offset-2" : ""}`, i.dataset.code = n;
				let a = document.createElement("span");
				a.textContent = n, i.appendChild(a);
				let o = document.createElement("button");
				o.type = "button", o.className = "hover:bg-white/20 rounded p-0.5 inline-flex items-center justify-center cursor-pointer text-white/80 hover:text-white transition-colors", o.title = `Remove ${n}`, o.innerHTML = "<span class=\"material-symbols-outlined text-[13px]\">close</span>", o.addEventListener("click", (e) => {
					e.preventDefault(), e.stopPropagation(), this._currentShortcutCodes = this._currentShortcutCodes.filter((e) => e !== n), this.renderShortcutChips();
					let t = document.getElementById("inputAddDocName"), r = document.getElementById("inputAddDocAliases");
					!this._aliasesManuallyEdited && t?.value.trim() && (r && (r.value = j(t.value, this._currentShortcutCodes)), this.validateKeywordsInput());
				}), i.appendChild(o), t.appendChild(i);
			});
		}
	}
	renderPresetPills() {
		let e = document.getElementById("containerPresetPills");
		if (!e) return;
		e.innerHTML = "";
		let t = Object.keys(this.state.documentPresets || mt);
		t.length === 0 ? e.innerHTML = "<span class=\"text-secondary text-[11px] italic\">No presets available.</span>" : (t.forEach((t) => {
			let n = this._selectedPresetKeys && this._selectedPresetKeys.has(t), r = document.createElement("button");
			r.type = "button", r.className = n ? "inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#0037b0] text-white font-bold text-[11px] shadow-xs cursor-pointer transition-all border border-[#0037b0]" : "inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-surface text-secondary hover:text-on-surface font-medium text-[11px] cursor-pointer transition-all border border-outline-variant/50 hover:border-primary/50", r.innerHTML = `
        <span class="material-symbols-outlined text-[13px] ${n ? "font-bold" : "opacity-40"}">${n ? "check" : "add"}</span>
        <span>${U(t)}</span>
      `, r.addEventListener("click", (e) => {
				e.preventDefault(), this._selectedPresetKeys ||= /* @__PURE__ */ new Set(), this._selectedPresetKeys.has(t) ? this._selectedPresetKeys.delete(t) : this._selectedPresetKeys.add(t), this.renderPresetPills();
			}), e.appendChild(r);
		}), this.updatePresetFeedbackBanner());
	}
	updatePresetFeedbackBanner() {
		let e = document.getElementById("dynamicPresetFeedback"), t = document.getElementById("dynamicPresetFeedbackText");
		if (e && t) {
			if ((this._selectedPresetKeys ? this._selectedPresetKeys.size : 0) === 0) {
				e.className = "p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 text-[11px] flex items-start gap-2 mt-1";
				let n = e.querySelector(".material-symbols-outlined");
				n && (n.className = "material-symbols-outlined text-[16px] text-amber-600 shrink-0 mt-0.5"), t.innerHTML = "<strong>Shortcut Only:</strong> No presets selected. This will be saved purely as a <em>Keyboard Shortcut &amp; Rename Rule</em> without appearing in any preset checklist.";
			} else {
				e.className = "p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-on-surface text-[11px] flex items-start gap-2 mt-1";
				let n = e.querySelector(".material-symbols-outlined");
				n && (n.className = "material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5"), t.innerHTML = `<strong>Dual Save:</strong> Will be added to <strong>Shortcuts &amp; Rename Rules</strong> AND simultaneously included in preset checklists for: <strong>${U(Array.from(this._selectedPresetKeys).join(", "))}</strong>.`;
			}
		}
	}
	validateKeywordsInput() {
		let e = document.getElementById("inputAddDocAliases"), t = document.getElementById("btnSaveAddDoc"), n = document.getElementById("hintKeywordsValidation"), r = (e?.value || "").trim().length > 0;
		return t && (t.disabled = !r), n && n.classList.toggle("hidden", r), r;
	}
	openAddDocumentModal(e = null, t = !1) {
		let n = document.getElementById("modalAddDocument");
		if (!n) return;
		let i = document.getElementById("containerAddDocCode"), a = document.getElementById("inputAddDocCode"), o = document.getElementById("inputAddDocName"), s = document.getElementById("inputAddDocAliases"), c = document.getElementById("addDocTargetPreview"), l = n.querySelector("h3"), u = n.querySelector("p");
		if (i && i.classList.remove("hidden"), u && (u.textContent = "Define document name, short code(s), keywords, and preset assignments"), this._fromShortcutsTab = !!t, this._selectedPresetKeys = /* @__PURE__ */ new Set(), this._aliasesManuallyEdited = !1, e) {
			let n = (e.name || e.canonical || "").trim().toUpperCase(), r = (e.code || (Array.isArray(e.codes) ? e.codes[0] : "")).trim().toUpperCase();
			if (this.state.documentPresets) for (let [e, t] of Object.entries(this.state.documentPresets)) Array.isArray(t) && t.some((e) => {
				let t = (e.name || "").trim().toUpperCase(), i = (e.code || "").trim().toUpperCase();
				return n && t === n || r && i === r;
			}) && this._selectedPresetKeys.add(e);
			!t && this.state.activePreset && this._selectedPresetKeys.add(this.state.activePreset);
			let i = [];
			if (Array.isArray(e.codes) && e.codes.length > 0) i = [...e.codes];
			else if (e.code) i = [e.code];
			else {
				let e = this.shortcuts21.find((e) => (e.canonical || e.label || "").toUpperCase() === n);
				e && (i = Array.isArray(e.codes) && e.codes.length > 0 ? [...e.codes] : [e.code]);
			}
			this._currentShortcutCodes = i, l && (l.textContent = "Edit Document Type"), a && (a.value = ""), o && (o.value = e.name || e.canonical || ""), s && (s.value = Array.isArray(e.keywords) ? e.keywords.join(", ") : e.keywords || "", s.value.trim() && (this._aliasesManuallyEdited = !0));
		} else this._editingDocIdx = null, this._editingShortcutCode = null, this._currentShortcutCodes = [], !t && this.state.activePreset && this._selectedPresetKeys.add(this.state.activePreset), l && (l.textContent = "Add Document Type"), a && (a.value = ""), o && (o.value = ""), s && (s.value = "");
		this.renderShortcutChips(), this.renderPresetPills();
		let d = () => {
			let e = L(o?.value.trim() || "DOCUMENT", this.getEffectiveStudentName(), null, this.state.style).replace(/(\.[a-zA-Z0-9]+)+$/i, "").trim();
			c && (c.textContent = e);
		};
		o && (o.oninput = () => {
			if (d(), !this._aliasesManuallyEdited) {
				let e = j(o.value, this._currentShortcutCodes);
				s && (s.value = e);
			}
			this.validateKeywordsInput();
		}, o.onkeydown = (e) => {
			e.key === "Enter" && (e.preventDefault(), this.handleSaveDocumentType());
		});
		let f = () => {
			let e = (a?.value || "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
			if (!e) return;
			if (this._currentShortcutCodes && this._currentShortcutCodes.includes(e)) {
				a && (a.classList.add("shake-anim", "border-primary"), setTimeout(() => a.classList.remove("shake-anim", "border-primary"), 600)), this.renderShortcutChips(e), r.show("Code Already Added", `Code "${e}" is already added as a chip.`, "info"), a && (a.value = "");
				return;
			}
			let t = (o?.value || "").trim().toUpperCase(), n = null, i = [...this.shortcuts21 || [], ...this.state.customShortcuts || []];
			for (let r of i) {
				let i = (r.canonical || r.label || r.name || "").trim().toUpperCase();
				if (!(t && i === t) && (r.code && r.code.toUpperCase() === e || Array.isArray(r.codes) && r.codes.some((t) => t && t.toUpperCase() === e))) {
					n = i;
					break;
				}
			}
			if (this._currentShortcutCodes ||= [], n) {
				let i = this.findAvailableShortcutCode(e, t);
				this._currentShortcutCodes.push(i), this.renderShortcutChips(i), r.show("Auto-Numbered Code", `Code "${e}" is assigned to "${n}". Auto-assigned "${i}".`, "info");
			} else this._currentShortcutCodes.push(e), this.renderShortcutChips();
			if (!this._aliasesManuallyEdited && o?.value.trim()) {
				let e = j(o.value, this._currentShortcutCodes);
				s && (s.value = e);
			}
			this.validateKeywordsInput(), a && (a.value = ""), a?.focus();
		}, p = document.getElementById("btnAddShortcutChip");
		p && (p.onclick = (e) => {
			e.preventDefault(), f();
		}), a && (a.oninput = () => {
			a.value = a.value.toUpperCase();
		}, a.onkeydown = (e) => {
			e.key === "Enter" && (e.preventDefault(), (a.value || "").trim() ? f() : o?.focus());
		});
		let m = document.getElementById("btnAutoGenerateKeywords");
		m && (m.onclick = (e) => {
			e.preventDefault();
			let t = (o?.value || "").trim();
			if (!t) {
				r.show("Document Name Required", "Please enter Full Document Name first to generate smart keywords.", "info"), o?.focus();
				return;
			}
			let n = j(t, this._currentShortcutCodes);
			s && (s.value = n, this._aliasesManuallyEdited = !1, this.validateKeywordsInput(), r.show("Keywords Auto-Generated", "Smart Indian academic aliases generated.", "success"));
		}), s && (s.oninput = () => {
			this._aliasesManuallyEdited = !0, this.validateKeywordsInput();
		}), d(), this.validateKeywordsInput(), n.classList.remove("hidden"), o && o.focus();
	}
	closeAddDocumentModal() {
		let e = document.getElementById("modalAddDocument");
		e && e.classList.add("hidden"), this._editingDocIdx = null, this._editingShortcutCode = null, this._fromShortcutsTab = !1, this._currentShortcutCodes = [], this._selectedPresetKeys = /* @__PURE__ */ new Set(), this._aliasesManuallyEdited = !1;
	}
	handleSaveDocumentType() {
		let e = document.getElementById("inputAddDocCode"), t = document.getElementById("inputAddDocName"), n = document.getElementById("inputAddDocAliases"), i = (t?.value || "").trim();
		if (!i) {
			r.show("Document Name Required", "Please enter a Full Document Name.", "warning"), t?.focus();
			return;
		}
		let a = i.toUpperCase(), o = (n?.value || "").trim();
		if (!o) {
			r.show("Keywords Required", "Keywords / Aliases are required for smart scanning & auto-matching.", "warning"), n?.focus(), this.validateKeywordsInput();
			return;
		}
		let s = o.split(",").map((e) => e.trim().toLowerCase().replace(/[^a-z0-9\s_-]/g, "")).filter((e) => e.length >= 2), c = Array.from(new Set(s)), l = (e?.value || "").trim().toUpperCase();
		if (l) {
			let e = l.replace(/[^A-Z0-9_-]/g, "");
			if (e && !this._currentShortcutCodes.includes(e)) {
				let t = this.findAvailableShortcutCode(e, a);
				this._currentShortcutCodes.push(t);
			}
		}
		if (!this._currentShortcutCodes || this._currentShortcutCodes.length === 0) {
			let e = a.split(/[\s_-]+/).filter((e) => e.length > 0), t = "";
			t = e.length >= 2 ? (e[0][0] + e[1][0] + (e[2] ? e[2][0] : "")).toUpperCase() : a.substring(0, 3).toUpperCase();
			let n = this.findAvailableShortcutCode(t || "DOC", a);
			this._currentShortcutCodes.push(n);
		}
		let u = [...this._currentShortcutCodes], d = u[0], f = null, p = null;
		if (this._editingShortcutCode) {
			p = this._editingShortcutCode.toUpperCase();
			let e = this.shortcuts21.find((e) => e.code && e.code.toUpperCase() === p || Array.isArray(e.codes) && e.codes.some((e) => e && e.toUpperCase() === p));
			f = (e?.canonical || e?.label || "").toUpperCase();
		} else if (this._editingDocIdx !== null && this._editingDocIdx !== void 0) {
			let e = this.state.documentPresets[this.state.activePreset];
			e && e[this._editingDocIdx] && (f = (e[this._editingDocIdx].name || "").toUpperCase(), p = (e[this._editingDocIdx].code || "").toUpperCase());
		}
		(p || f) && (this.shortcuts21 = this.shortcuts21.filter((e) => {
			let t = (e.canonical || e.label || "").toUpperCase(), n = (e.code || "").toUpperCase();
			return !(p && (n === p || Array.isArray(e.codes) && e.codes.some((e) => e && e.toUpperCase() === p)) || f && t === f);
		}), this.state.customShortcuts && (this.state.customShortcuts = this.state.customShortcuts.filter((e) => {
			let t = (e.canonical || e.label || "").toUpperCase(), n = (e.code || "").toUpperCase();
			return !(p && (n === p || Array.isArray(e.codes) && e.codes.some((e) => e && e.toUpperCase() === p)) || f && t === f);
		})));
		let m = {
			code: d,
			codes: u,
			label: a,
			canonical: a,
			keywords: c
		};
		if (this.shortcuts21.push(m), this.state.customShortcuts || (this.state.customShortcuts = []), this.state.customShortcuts.push(m), u.forEach((e) => {
			fe({
				canonical: a,
				code: e,
				primaryKeywords: [a.toLowerCase(), e.toLowerCase()],
				secondaryKeywords: c
			});
		}), E(a, a), ie(d, a, c), pt.set(d, {
			code: d,
			canonical: a,
			label: a,
			keywords: c
		}), f && f !== a) {
			D(f), E(f, a);
			for (let e of this.state.files) e.docType && e.docType.toUpperCase() === f && (e.docType = a, e.smartDocType = a);
		}
		let h = this._selectedPresetKeys || /* @__PURE__ */ new Set();
		this.state.documentPresets || (this.state.documentPresets = {});
		for (let e of Object.keys(this.state.documentPresets)) {
			Array.isArray(this.state.documentPresets[e]) || (this.state.documentPresets[e] = []);
			let t = this.state.documentPresets[e];
			if (h.has(e)) {
				let e = t.findIndex((e) => {
					let t = (e.name || "").trim().toUpperCase(), n = (e.code || "").trim().toUpperCase();
					return !!(f && t === f || p && n === p || t === a || n === d);
				}), n = {
					name: a,
					code: d,
					keywords: c
				};
				e === -1 ? t.push(n) : t[e] = n;
			} else (f || p) && (this.state.documentPresets[e] = t.filter((e) => {
				let t = (e.name || "").trim().toUpperCase(), n = (e.code || "").trim().toUpperCase();
				return !(f && t === f || p && n === p);
			}));
		}
		let g = this._fromShortcutsTab;
		this.closeAddDocumentModal(), this.savePresetsAndSettings(), this.syncPresetsToShortcuts(), O(this.getAllPresetDocuments()), this._recalculateTargetNames(!0), this.updateTelemetry(), this.renderQueue(), this.renderCurrentPreview(), this.renderSettingsModal(g ? "shortcuts" : "presets"), h.size === 0 ? r.show("Shortcut Saved", `"${a}" saved purely as Keyboard Shortcut & Rename Rule.`, "success") : r.show("Document Type Saved", `"${a}" saved to Shortcuts & included in ${h.size} preset(s).`, "success");
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
				this._crossCheckState && (this._crossCheckState.order = t.dataset.patternOrder, e.querySelectorAll("[data-pattern-order]").forEach((e) => e.classList.toggle("active", e === t)), this._recalculateAndRenderCrossCheck(!0));
			});
		});
		let a = document.getElementById("btnToggleCrossCheckStudent"), o = document.getElementById("crossCheckStudentToggleLabel");
		a && a.addEventListener("click", () => {
			if (!this._crossCheckState) return;
			this._crossCheckState.includeStudent = !this._crossCheckState.includeStudent;
			let e = this._crossCheckState.includeStudent;
			o && (o.textContent = e ? "ON" : "OFF"), a.className = `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold border transition-all cursor-pointer ${e ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-100"}`, this._recalculateAndRenderCrossCheck(!0);
		}), e.querySelectorAll("[data-pattern-case]").forEach((t) => {
			t.addEventListener("click", () => {
				this._crossCheckState && (this._crossCheckState.casing = t.dataset.patternCase, e.querySelectorAll("[data-pattern-case]").forEach((e) => e.classList.toggle("active", e === t)), this._recalculateAndRenderCrossCheck(!0));
			});
		}), e.querySelectorAll("[data-pattern-filter]").forEach((t) => {
			t.addEventListener("click", () => {
				this._crossCheckState && (this._crossCheckState.filter = t.dataset.patternFilter, e.querySelectorAll("[data-pattern-filter]").forEach((e) => e.classList.toggle("active", e === t)), this._renderCrossCheckRows());
			});
		});
		let s = document.getElementById("btnModalMoveDuplicates");
		s && s.addEventListener("click", () => this.handleMoveModalDuplicates());
		let c = document.getElementById("btnTogglePowerUtilities"), l = document.getElementById("stripPowerUtilities"), u = document.getElementById("powerUtilitiesArrow");
		c && l && c.addEventListener("click", () => {
			let e = l.classList.contains("hidden");
			l.classList.toggle("hidden", !e), l.classList.toggle("flex", e), c.classList.toggle("bg-amber-100", e), c.classList.toggle("text-amber-800", e), c.classList.toggle("border-amber-300", e), c.classList.toggle("bg-white", !e), c.classList.toggle("text-slate-700", !e), c.classList.toggle("border-slate-200", !e), u && u.classList.toggle("rotate-180", e);
		});
		let d = document.getElementById("btnCrossCheckApplyReplace"), f = document.getElementById("inputCrossCheckFind"), p = document.getElementById("inputCrossCheckReplace");
		d && f && p && d.addEventListener("click", () => {
			let e = f.value, t = p.value;
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
			}), r.show("Find & Replace", `Replaced in ${n} document(s).`, "success"), this._recalculateAndRenderCrossCheck(!0);
		});
		let m = document.getElementById("btnCrossCheckCleanJunk");
		m && m.addEventListener("click", () => {
			let e = 0;
			this._getMatchedCrossCheckFiles().forEach((t) => {
				let n = this._getCrossCheckTargetBase(t), r = we(n);
				r !== n && (this._crossCheckState.overrides.set(t.id, r), e++);
			}), r.show("Junk Cleanup", `Cleaned scanner timestamps and prefixes in ${e} document(s).`, "success"), this._recalculateAndRenderCrossCheck(!0);
		});
		let h = document.getElementById("btnCrossCheckPortalSafe");
		h && h.addEventListener("click", () => {
			let e = 0;
			this._getMatchedCrossCheckFiles().forEach((t) => {
				let n = this._getCrossCheckTargetBase(t), r = Te(n);
				r !== n && (this._crossCheckState.overrides.set(t.id, r), e++);
			}), r.show("Portal-Safe Cleaned", `Formatted ${e} document(s) for admission portals.`, "success"), this._recalculateAndRenderCrossCheck(!0);
		});
		let g = document.getElementById("btnCrossCheckResetPatterns");
		g && g.addEventListener("click", () => {
			this._crossCheckState.overrides.clear(), this._crossCheckState.order = "doc_student", this._crossCheckState.separator = " ", this._crossCheckState.includeStudent = !0, this._crossCheckState.casing = this.state.style || "upper", this._crossCheckState.filter = "all", e.querySelectorAll("[data-pattern-order]").forEach((e) => e.classList.toggle("active", e.dataset.patternOrder === "doc_student")), e.querySelectorAll("[data-pattern-case]").forEach((e) => e.classList.toggle("active", e.dataset.patternCase === this._crossCheckState.casing)), e.querySelectorAll("[data-pattern-filter]").forEach((e) => e.classList.toggle("active", e.dataset.patternFilter === "all")), o && (o.textContent = "ON"), a && (a.className = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold border transition-all cursor-pointer bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"), r.show("Rules Reset", "Reset patterns to smart auto-match defaults.", "info"), this._recalculateAndRenderCrossCheck(!0);
		});
		let _ = document.getElementById("chkCrossCheckSelectAll");
		_ && _.addEventListener("change", (t) => {
			e.querySelectorAll("#crossCheckTableBody > div").forEach((e) => {
				e.dataset.fileId && this._crossCheckState.userToggled.set(e.dataset.fileId, t.target.checked);
			}), this._renderCrossCheckRows();
		});
		let v = document.getElementById("btnModalSort");
		v && v.addEventListener("click", () => this.handleSortDocuments()), e.addEventListener("keydown", (t) => {
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
			let r = Array.from(e.querySelectorAll("#crossCheckTableBody > div"));
			if (r.length !== 0) {
				if (t.key === "ArrowDown") {
					t.preventDefault(), this._crossCheckState.focusedIndex = Math.min(this._crossCheckState.focusedIndex + 1, r.length - 1), this._renderCrossCheckRows();
					let e = r[this._crossCheckState.focusedIndex];
					e && e.scrollIntoView({ block: "nearest" });
				} else if (t.key === "ArrowUp") {
					t.preventDefault(), this._crossCheckState.focusedIndex = Math.max(this._crossCheckState.focusedIndex - 1, 0), this._renderCrossCheckRows();
					let e = r[this._crossCheckState.focusedIndex];
					e && e.scrollIntoView({ block: "nearest" });
				} else if (t.key === " ") {
					t.preventDefault();
					let e = r[this._crossCheckState.focusedIndex];
					if (e && e.dataset.fileId) {
						let t = e.dataset.fileId, n = this._crossCheckState.userToggled.get(t) ?? !1;
						this._crossCheckState.userToggled.set(t, !n), this._renderCrossCheckRows();
					}
				}
			}
		});
		let y = document.getElementById("btnFloatingUndo");
		y && y.addEventListener("click", () => {
			this.hideFloatingUndoToast(), this.handleUndo();
		});
		let b = document.getElementById("btnDismissFloatingUndo");
		b && b.addEventListener("click", () => {
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
		return (this.state.files || []).filter((e) => !Z(e.name));
	}
	_getCrossCheckTargetBase(e) {
		if (this._crossCheckState && this._crossCheckState.overrides && this._crossCheckState.overrides.has(e.id)) return this._crossCheckState.overrides.get(e.id);
		let t = e.docType || e.smartDocType || e.smartMatchedDoc;
		if (t) return t;
		let n = (this.state.studentName || "").replace(/\.[a-zA-Z0-9]+$/i, "").trim(), r = F(e.name);
		if (n) {
			let e = RegExp(`\\b${n.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "gi");
			r = r.replace(e, "").trim();
		}
		return r || F(e.name);
	}
	_getCrossCheckTargetName(e) {
		let t = (this.state.studentName || "").replace(/\.[a-zA-Z0-9]+$/i, "").trim(), n = e.ext || P(e.name) || "", r = this._getCrossCheckTargetBase(e), i = "";
		return i = this._crossCheckState && this._crossCheckState.overrides && this._crossCheckState.overrides.has(e.id) ? I(r, this._crossCheckState.casing) : Ce(r, t, {
			order: this._crossCheckState ? this._crossCheckState.order : "doc_student",
			separator: this._crossCheckState ? this._crossCheckState.separator : " ",
			includeStudent: !this._crossCheckState || this._crossCheckState.includeStudent,
			casing: this._crossCheckState ? this._crossCheckState.casing : this.state.style || "upper"
		}), `${i}${n}`;
	}
	openCrossCheckModal() {
		let e = this._getMatchedCrossCheckFiles();
		if (e.length === 0) {
			r.show("No Documents", "Please select a folder first to bulk rename.", "info");
			return;
		}
		let t = document.getElementById("modalCrossCheck");
		if (!t) return;
		this._crossCheckState = {
			order: "doc_student",
			separator: " ",
			includeStudent: !0,
			casing: this.state.style || "upper",
			filter: "all",
			overrides: /* @__PURE__ */ new Map(),
			userToggled: /* @__PURE__ */ new Map(),
			focusedIndex: 0
		}, e.forEach((e) => {
			let t = this._getCrossCheckTargetName(e), n = F(e.name) === F(t);
			this._crossCheckState.userToggled.set(e.id, !n);
		}), t.querySelectorAll("[data-pattern-order]").forEach((e) => e.classList.toggle("active", e.dataset.patternOrder === "doc_student")), t.querySelectorAll("[data-pattern-case]").forEach((e) => e.classList.toggle("active", e.dataset.patternCase === this._crossCheckState.casing)), t.querySelectorAll("[data-pattern-filter]").forEach((e) => e.classList.toggle("active", e.dataset.patternFilter === "all"));
		let n = document.getElementById("crossCheckStudentToggleLabel");
		n && (n.textContent = "ON");
		let i = document.getElementById("btnToggleCrossCheckStudent");
		i && (i.className = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold border transition-all cursor-pointer bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"), this._renderCrossCheckRows(), t.classList.remove("hidden");
	}
	_recalculateAndRenderCrossCheck(e = !0) {
		if (!this._crossCheckState) return;
		let t = this._getMatchedCrossCheckFiles();
		e && t.forEach((e) => {
			let t = this._getCrossCheckTargetName(e), n = F(e.name) === F(t);
			this._crossCheckState.userToggled.set(e.id, !n);
		}), this._renderCrossCheckRows();
	}
	_renderCrossCheckRows() {
		if (!document.getElementById("modalCrossCheck")) return;
		let e = document.getElementById("crossCheckTableBody"), t = document.getElementById("crossCheckTotalCount"), n = document.getElementById("crossCheckActiveEmpty"), r = document.getElementById("crossCheckStudentLabel"), i = (this.state.studentName || "").replace(/\.[a-zA-Z0-9]+$/i, "").trim();
		r && (r.textContent = i || "Not Set");
		let a = this._getMatchedCrossCheckFiles();
		t && (t.textContent = String(a.length));
		let o = this._crossCheckState ? this._crossCheckState.filter : "all", s = a.filter((e) => {
			let t = (e.ext || P(e.name) || "").toLowerCase();
			return o === "pdf" ? t === ".pdf" : o !== "images" || [
				".jpg",
				".jpeg",
				".png",
				".webp",
				".bmp"
			].includes(t);
		});
		e && (e.innerHTML = ""), n && n.classList.toggle("hidden", s.length > 0);
		let c = De(this.state.files), l = 0;
		this.state.files.forEach((e) => {
			let t = c.get(e.id || e.name);
			t && t.status === "confirmed" && !t.isMaster && l++;
		});
		let u = document.getElementById("btnModalMoveDuplicates"), d = document.getElementById("modalMoveDuplicatesLabel");
		u && (l > 0 ? (u.classList.remove("hidden"), d && (d.textContent = `Move Duplicates (${l})`)) : u.classList.add("hidden")), s.forEach((t, n) => {
			let r = this._getCrossCheckTargetName(t), i = F(t.name) === F(r), a = this._crossCheckState.userToggled.has(t.id) ? this._crossCheckState.userToggled.get(t.id) : !i, o = this._crossCheckState.focusedIndex === n, s = Se(t.name, r, this.state.studentName), l = document.createElement("div");
			l.dataset.fileId = t.id;
			let u = "grid grid-cols-[32px_minmax(0,1fr)_22px_minmax(0,1.1fr)_104px] items-center gap-2 px-3 min-h-[38px] py-1.5 rounded-lg border transition-all cursor-pointer ";
			u += o ? "border-blue-600 bg-blue-50/35 shadow-2xs" : i && !a ? "border-transparent bg-slate-50/45 hover:bg-slate-100/60" : "border-transparent hover:bg-slate-50 border-b-slate-100", l.className = u;
			let d = document.createElement("div");
			d.className = "flex items-center justify-center";
			let f = document.createElement("input");
			f.type = "checkbox", f.checked = a, f.className = "w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600 crosscheck-row-cb", f.addEventListener("change", (e) => {
				e.stopPropagation(), this._crossCheckState.userToggled.set(t.id, f.checked), this._updateCrossCheckSelectionCount(), this._renderCrossCheckRows();
			}), d.appendChild(f), l.appendChild(d);
			let p = document.createElement("div");
			p.className = "font-mono-code text-[12px] flex items-center justify-between gap-1.5 min-w-0";
			let m = document.createElement("span");
			m.className = "truncate flex-1 min-w-0", m.title = F(t.name), m.innerHTML = i ? `<span class="text-slate-400">${U(F(t.name))}</span>` : s.oldHtml, p.appendChild(m);
			let h = document.createElement("div");
			h.className = "flex items-center gap-1 shrink-0";
			let g = c.get(t.id || t.name), _ = g ? g.status : null;
			if (_ === "confirmed") {
				let e = document.createElement("span");
				e.className = "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold badge-dup-confirmed whitespace-nowrap select-none", e.textContent = "Duplicate", e.title = "Confirmed Duplicate (100% Identical or Copy Suffix Collision)", h.appendChild(e);
			} else if (_ === "probable") {
				let e = document.createElement("span");
				e.className = "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold badge-dup-probable whitespace-nowrap select-none", e.textContent = "50% Dup", e.title = "Probable Duplicate (Exact same byte size & file extension)", h.appendChild(e);
			}
			let v = Ee(t.name, r, this.state.studentName);
			if (v > 0) {
				let e = document.createElement("span");
				e.className = `inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap select-none ${v >= 30 ? "badge-wrong-major" : "badge-wrong-minor"}`, e.textContent = `${v}% Wrong`, e.title = `${v}% difference from suggested document name`, h.appendChild(e);
			}
			if (_ === "confirmed" || _ === "probable") {
				let e = document.createElement("button");
				e.type = "button", e.title = "Move this file to \"Duplicate Files\" subfolder (Del)", e.className = "w-4 h-4 rounded hover:bg-slate-200 text-slate-400 hover:text-amber-600 flex items-center justify-center shrink-0 cursor-pointer ml-0.5", e.innerHTML = "<span class=\"material-symbols-outlined text-[12px]\">drive_file_move</span>", e.addEventListener("click", (e) => {
					e.stopPropagation(), this.handleMoveFileToDuplicates(t);
				}), h.appendChild(e);
			}
			h.children.length > 0 && p.appendChild(h), l.appendChild(p);
			let y = document.createElement("div");
			y.className = "flex items-center justify-center text-slate-300 font-bold select-none", y.innerHTML = "<svg class=\"w-3.5 h-3.5 text-slate-300\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M14 5l7 7m0 0l-7 7m7-7H3\"/></svg>", l.appendChild(y);
			let b = document.createElement("div");
			b.className = "font-mono-code text-[12px] truncate", b.title = F(r), b.innerHTML = i ? `<span class="text-slate-400 font-medium">${U(F(r))}</span>` : s.newHtml, l.appendChild(b);
			let x = document.createElement("div");
			if (x.className = "flex justify-end", i) x.innerHTML = "\n          <span class=\"inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50/90 text-emerald-700 border border-emerald-200/90 whitespace-nowrap\">\n            <svg class=\"w-3 h-3\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M5 13l4 4L19 7\"/></svg>\n            <span>Perfect</span>\n          </span>\n        ";
			else {
				let e = t.smartConfidence === void 0 ? t.isMatched ? 90 : 0 : t.smartConfidence;
				if (!(t.isMatched !== !1 && e >= 30)) x.innerHTML = "\n            <span class=\"inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-rose-50 text-rose-700 border-rose-200 whitespace-nowrap\">\n              <span class=\"w-1.5 h-1.5 rounded-full bg-rose-500\"></span>\n              Unmatched\n            </span>\n          ";
				else {
					let t = e >= 90;
					x.innerHTML = `
            <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${t ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"} whitespace-nowrap">
              <span class="w-1.5 h-1.5 rounded-full ${t ? "bg-emerald-500" : "bg-amber-500"}"></span>
              ${e}% Match
            </span>
          `;
				}
			}
			l.appendChild(x), l.addEventListener("click", (e) => {
				e.target !== f && (this._crossCheckState.focusedIndex = n, this._renderCrossCheckRows());
			}), e && e.appendChild(l);
		}), s.length > 0 && (this._crossCheckState.focusedIndex = Math.min(this._crossCheckState.focusedIndex, s.length - 1)), this._updateCrossCheckSelectionCount();
	}
	_updateCrossCheckSelectionCount() {
		let e = document.getElementById("modalCrossCheck");
		if (!e) return;
		let t = this._getMatchedCrossCheckFiles(), n = 0;
		t.forEach((e) => {
			(this._crossCheckState?.userToggled.get(e.id) ?? !1) && n++;
		});
		let r = document.getElementById("crossCheckSelectedCount"), i = document.getElementById("crossCheckTotalCount"), a = document.getElementById("confirmRenameLabel"), o = document.getElementById("btnConfirmBatchRename"), s = document.getElementById("chkCrossCheckSelectAll");
		r && (r.textContent = String(n)), i && (i.textContent = String(t.length)), a && (a.textContent = `Confirm & Rename (${n})`), o && (o.disabled = n === 0, o.classList.toggle("opacity-40", n === 0), o.classList.toggle("cursor-not-allowed", n === 0), o.classList.toggle("cursor-pointer", n > 0));
		let c = Array.from(e.querySelectorAll(".crosscheck-row-cb")), l = c.filter((e) => e.checked).length;
		s && (s.checked = c.length > 0 && l === c.length, s.indeterminate = l > 0 && l < c.length);
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
			let t = e.closest("[data-file-id]");
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
			let t = this._getCrossCheckTargetName(e), n = R(t);
			if (n) {
				r.show("Validation Error", `${F(e.name)}: ${n}`, "error");
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
			await le(this.state.folder, i, (e, t) => {
				console.log(`[Batch Rename Progress] ${e}%: ${t}`);
			}), B.pushBatch(this.state.folder, i), i.forEach((e) => {
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
			e !== -1 && (this.state.currentIndex = e), this.updateTelemetry(), this.renderQueue(), this.renderCurrentPreview(), this._computeDuplicateHashesAsync();
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
	renderPreview() {
		return this.renderCurrentPreview();
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
			s.className = "flex items-center gap-2 font-mono-code text-[11px] text-secondary opacity-60 mt-1 select-none", s.innerHTML = "<span>Standby • Ready for Intake</span>", e.appendChild(s), n.appendChild(e);
			return;
		}
		if (/\.pdf$/i.test(t.name) || (this.state.activePdfDoc = null, this.state.activePdfUrl = null, this.state.currentPdfPage = 1, this.state.totalPdfPages = 1, this._updatePdfPageIndicator()), this.state.splitCompare && this.state.files.length > 1) {
			let e = this.state.currentIndex > 0 ? this.state.currentIndex - 1 : 1, r = this.state.files[e], i = document.createElement("div");
			i.id = "previewContainerStage", i.className = "flex flex-row gap-space-md items-center justify-center h-full max-h-[calc(100vh-175px)]";
			let a = this._createStageElement(r, `Compare: ${r.name}`), o = this._createStageElement(t, `Active: ${t.targetName || t.name}`);
			i.appendChild(a), i.appendChild(o), n.appendChild(i), this._applyPreviewTransform();
			return;
		}
		let r = this._createStageElement(t);
		n.appendChild(r), this._applyPreviewTransform();
	}
	_createStageElement(e, t = null) {
		let n = document.createElement("div");
		if (t || (n.id = "previewContainerStage"), n.className = "h-full max-h-[calc(100vh-175px)] aspect-[1/1.414] bg-surface-container-lowest rounded shadow-2xl p-space-md flex flex-col justify-between relative overflow-hidden select-text border border-outline-variant/40 shrink-0", t) {
			let e = document.createElement("div");
			e.className = "absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-mono-code text-[10px] font-bold shadow-xs", e.textContent = t, n.appendChild(e);
		}
		let r = () => {
			if (t) return n;
			let e = document.getElementById("previewContainerStage");
			return e && e.isConnected ? e : n;
		}, i = /\.(jpe?g|png|webp|bmp|gif)$/i.test(e.name), a = /\.pdf$/i.test(e.name);
		if (i) {
			let t = document.createElement("img");
			t.alt = e.name, t.className = "w-full h-full object-contain";
			let i = (n) => {
				e._blobUrl = n, t.src = n;
				let i = r();
				i.contains(t) || (i.innerHTML = "", i.appendChild(t));
			};
			if (e._blobUrl) i(e._blobUrl);
			else if (e.fileObj) try {
				i(URL.createObjectURL(e.fileObj));
			} catch {
				this._renderDocumentInfoFallback(r(), e);
			}
			else {
				let a = ut();
				if (e.path && a) n.innerHTML = "<div class=\"flex items-center justify-center w-full h-full text-secondary text-[12px]\"><span class=\"material-symbols-outlined text-[20px] animate-spin text-primary mr-2\">sync</span><span>Loading document preview...</span></div>", a("read_binary_file", { path: e.path }).then((t) => {
					let n = e.name.toLowerCase().endsWith(".png") ? "image/png" : e.name.toLowerCase().endsWith(".webp") ? "image/webp" : "image/jpeg", r = new Blob([new Uint8Array(t)], { type: n });
					i(URL.createObjectURL(r));
				}).catch((n) => {
					console.warn("Native read_binary_file error, falling back:", n);
					let i = X(e);
					i ? (t.src = i, t.onload = () => {
						let e = r();
						e.innerHTML = "", e.appendChild(t);
					}, t.onerror = () => this._renderDocumentInfoFallback(r(), e)) : this._renderDocumentInfoFallback(r(), e);
				});
				else {
					let n = X(e);
					n ? (t.src = n, t.onload = () => {
						let e = r();
						e.innerHTML = "", e.appendChild(t);
					}, t.onerror = () => this._renderDocumentInfoFallback(r(), e)) : this._renderDocumentInfoFallback(r(), e);
				}
			}
		} else if (a) {
			let t = document.createElement("canvas");
			t.id = "previewPdfCanvas", t.className = "w-full h-full object-contain";
			let i = async (n) => {
				if (!window.pdfjsLib) this._loadPdfJs(() => i(n));
				else try {
					let i = r();
					i.innerHTML = "", i.appendChild(t);
					let a = n instanceof Uint8Array ? n.slice(0) : new Uint8Array(n);
					this.state.activePdfDoc = await window.pdfjsLib.getDocument({ data: a }).promise, this.state.activePdfUrl = e.path || e.name, this.state.totalPdfPages = this.state.activePdfDoc.numPages || 1, this.state.currentPdfPage = 1, this._updatePdfPageIndicator(), await this._renderPdfPage(1, t);
				} catch (t) {
					console.warn("PDF render error:", t), this._renderDocumentInfoFallback(r(), e);
				}
			};
			if (e._pdfBytes) i(e._pdfBytes);
			else if (e.fileObj) e.fileObj.arrayBuffer().then((t) => {
				e._pdfBytes = new Uint8Array(t), i(e._pdfBytes);
			}).catch(() => this._renderDocumentInfoFallback(r(), e));
			else {
				let t = ut();
				if (e.path && t) n.innerHTML = "<div class=\"flex items-center justify-center w-full h-full text-secondary text-[12px]\"><span class=\"material-symbols-outlined text-[20px] animate-spin text-primary mr-2\">sync</span><span>Loading PDF preview...</span></div>", t("read_binary_file", { path: e.path }).then((t) => {
					e._pdfBytes = new Uint8Array(t), i(e._pdfBytes);
				}).catch((t) => {
					console.warn("Native PDF read error, falling back to fetch:", t);
					let n = X(e);
					n ? fetch(n).then((e) => e.arrayBuffer()).then((t) => {
						e._pdfBytes = new Uint8Array(t), i(e._pdfBytes);
					}).catch(() => this._renderDocumentInfoFallback(r(), e)) : this._renderDocumentInfoFallback(r(), e);
				});
				else {
					let t = X(e);
					t ? fetch(t).then((e) => e.arrayBuffer()).then((t) => {
						e._pdfBytes = new Uint8Array(t), i(e._pdfBytes);
					}).catch(() => this._renderDocumentInfoFallback(r(), e)) : this._renderDocumentInfoFallback(r(), e);
				}
			}
		} else this._renderDocumentInfoFallback(r(), e);
		return n;
	}
	async _renderPdfPage(e, t = null) {
		if (!this.state.activePdfDoc) return;
		let n = t || document.getElementById("previewPdfCanvas");
		if (n) {
			if (this._pdfPageRenderTask) {
				try {
					this._pdfPageRenderTask.cancel();
				} catch {}
				this._pdfPageRenderTask = null;
			}
			try {
				let t = await this.state.activePdfDoc.getPage(e), r = t.getViewport({ scale: 2 });
				n.height = r.height, n.width = r.width;
				let i = n.getContext("2d"), a = t.render({
					canvasContext: i,
					viewport: r
				});
				this._pdfPageRenderTask = a, await a.promise, this._pdfPageRenderTask = null, this.state.currentPdfPage = e, this._updatePdfPageIndicator();
			} catch (t) {
				if (t && t.name === "RenderingCancelledException") return;
				console.warn(`Error rendering PDF page ${e}:`, t);
			}
		}
	}
	_updatePdfPageIndicator() {
		let e = document.getElementById("col-preview");
		if (!e) return;
		let t = e.querySelector("#renamerPdfPageBadge"), n = e.querySelector("#renamerPdfPageBadgeText") || t, r = e.querySelector("#btnPdfPrevPage"), i = e.querySelector("#btnPdfNextPage"), a = e.querySelector("#pdfPulseDot"), o = this.state.totalPdfPages > 1;
		n && (n.textContent = o ? `Page ${this.state.currentPdfPage} of ${this.state.totalPdfPages}` : "Page 1 of 1"), t && (t.style.cursor = o ? "pointer" : "default", t.title = o ? "Click to jump to any page" : "Single page document"), a && (a.style.display = o ? "inline-block" : "none"), r && (r.disabled = this.state.currentPdfPage <= 1), i && (i.disabled = this.state.currentPdfPage >= this.state.totalPdfPages || !o);
	}
	_loadPdfJs(e) {
		if (window.pdfjsLib) {
			e && e();
			return;
		}
		if (this._pdfCallbacks ||= [], e && this._pdfCallbacks.push(e), this._pdfLoading) return;
		this._pdfLoading = !0;
		let t = [
			"assets/js/libs/pdf.min.js",
			"/app/assets/js/libs/pdf.min.js",
			"app/assets/js/libs/pdf.min.js",
			"src/js/pdf.min.js",
			"https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
		], n = 0, r = () => {
			if (n >= t.length) {
				this._pdfLoading = !1, console.warn("[DocMitra Renamer] Could not load pdf.js from any candidate source."), this._pdfCallbacks && [...this._pdfCallbacks], this._pdfCallbacks = [];
				return;
			}
			let e = t[n++], i = document.createElement("script");
			i.src = e, i.onload = () => {
				if (window.pdfjsLib) {
					let t = e.includes("cdnjs") ? "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js" : e.replace("pdf.min.js", "pdf.worker.min.js");
					window.pdfjsLib.GlobalWorkerOptions.workerSrc = t, this._pdfLoading = !1;
					let n = this._pdfCallbacks ? [...this._pdfCallbacks] : [];
					this._pdfCallbacks = [], n.forEach((e) => {
						try {
							e();
						} catch (e) {
							console.error("[DocMitra Renamer] PDF callback error:", e);
						}
					});
				} else r();
			}, i.onerror = () => r(), document.head.appendChild(i);
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
		let c = t.ext || P(t.name) || "DOC";
		s.textContent = `Size: ${t.size ? (t.size / 1024).toFixed(1) : "0.0"} KB • Type: ${c.toUpperCase().replace(/^\./, "")}`, a.appendChild(s);
		let l = document.createElement("div");
		l.className = t.isMatched ? "px-3 py-1 rounded bg-tertiary-fixed text-on-tertiary-fixed font-bold font-mono-code text-[11px]" : "px-3 py-1 rounded bg-surface-variant text-on-surface-variant font-bold font-mono-code text-[11px]", l.textContent = t.isMatched ? `Matched: ${t.docType}` : "Unmatched File", a.appendChild(l), e.appendChild(a);
		let u = document.createElement("div");
		u.className = "text-center border-t pt-2 border-outline-variant/30 text-[10px] font-mono-code text-secondary", u.textContent = "Air-Gapped High-Precision Preview Stage", e.appendChild(u);
	}
	async applyFolderRename(e) {
		let t = this.state.studentName || this.state.folder?.name || "", n = this.state.folder && (this.state.folder.nativePath || this.state.folder.path) || "";
		if (!e || e === t) return;
		this.state.studentName = e;
		let i = document.getElementById("displayFolderName");
		i && (i.textContent = e, i.title = e);
		let a = document.getElementById("inputEditFolderName");
		if (a && (a.value = e), n) try {
			let t = await h(n, e);
			if (t && t.success) {
				let r = t.newPath || t.path;
				if (r) {
					let t = n.replace(/\\/g, "/").toLowerCase(), i = r.replace(/\\/g, "/");
					this.state.folder && (this.state.folder.name = e, this.state.folder.path = r, this.state.folder.nativePath = r);
					for (let e of this.state.files) if (e.path) {
						let n = e.path.replace(/\\/g, "/");
						n.toLowerCase().startsWith(t) && (e.path = i + n.slice(t.length), e.nativePath &&= e.path);
					}
				}
			} else t && t.error && console.warn("[DocMitra] Physical folder rename notice:", t.error);
		} catch (e) {
			console.warn("[DocMitra] Physical folder rename error:", e);
		}
		let o = document.getElementById("chkIncludeFolderName");
		(!o || o.checked) && (this._recalculateTargetNames(!0), this.renderQueue(), this.renderCurrentPreview()), this.updateTelemetry(), this.updateMissingModal(), r.show("Folder Renamed", `Folder name updated to: ${e}`, "success");
	}
	async handleImportMissingDocument(e) {
		if (!this.state.folder?.path) r.show("Select Folder First", "Please select a student folder before importing documents.", "warning");
		else {
			r.show("Select File for Import", `Select document for ${e}`, "info");
			try {
				let t = await f("All Supported Files (*.pdf;*.jpg;*.jpeg;*.png;*.docx)|*.pdf;*.jpg;*.jpeg;*.png;*.docx|All Files (*.*)|*.*", `Select File for ${e}`);
				if (!t.success || !t.files || t.files.length === 0) return;
				let n = t.files[0], i = n.ext || P(n.name), a = this.state.folder.path, o = document.getElementById("chkIncludeFolderName"), s = (o ? o.checked : this.state.settings?.includeFolderNameInFile !== !1) && (this.state.studentName || this.state.folder?.name) || "", c = this.state.style || "upper", l = `${L(e || F(n.name), s, this.state.settings?.groups, c).replace(/(\.[a-zA-Z0-9]+)+$/i, "").trim()}${i}`, u = null;
				if (a && n.path && (u = await y({
					sourcePath: n.path,
					targetDir: a,
					targetName: l,
					studentName: s,
					moveFile: !0
				})), u && u.success === !1) throw Error(u.error || "Failed to move file to destination folder");
				let d = u && u.name ? u.name : l, p = u && u.path ? u.path : `${a}/${d}`, m = u && u.size ? u.size : n.size || 0, h = {
					id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
					name: d,
					targetName: d,
					suggestedName: d,
					path: p,
					nativePath: p,
					size: m,
					ext: i,
					dateCreated: u && (u.ctime || u.dateCreated) ? u.ctime || u.dateCreated : n.ctime || n.dateCreated || Date.now(),
					dateModified: Date.now(),
					lastModified: Date.now(),
					url: u && u.url ? u.url : n.url || X(n),
					docType: e,
					isMatched: !0,
					isRenamed: !1,
					isKept: !1,
					rotation: 0,
					isScanning: !1,
					smartConfidence: 100,
					smartDocType: e,
					status: "matched"
				};
				this.state.files.push(h), this.updateTelemetry(), this.renderQueue(), this.renderCurrentPreview(), this.updateMissingModal(), r.show("Document Imported", `Moved & imported ${d} as ${e}`, "success");
			} catch (e) {
				console.error("[DocMitra Import] Import error:", e), r.show("Import Error", e.message || "Failed to import document", "error");
			}
		}
	}
	openMissingDocumentsModal() {
		this.missingModal ||= new lt({
			onImportFile: (e) => this.handleImportMissingDocument(e),
			onRenameFolder: async (e) => {
				await this.applyFolderRename(e);
			},
			onViewDocument: (e) => {
				let t = this.state.files.findIndex((t) => t.name === e.name || t.path === e.path);
				t !== -1 && (this.state.currentIndex = t, this.renderQueue(), this.renderCurrentPreview(), r.show("Document Selected", `Focused on ${e.name}`, "info"));
			},
			onSetFollowup: ({ docName: e, date: t }) => {
				let n = this.state.studentName || this.state.folder?.name || "Student";
				Ze({
					folderName: n,
					studentName: n,
					documentName: e,
					promisedDate: t,
					note: "Missing document follow-up"
				}), r.show("Follow-up Scheduled", `${e} promise date set for ${t}`, "success"), this.updateMissingModal(), this.renderQueue();
			},
			onPresetChange: (e) => {
				this.handleSwitchActivePreset(e), this.updateMissingModal();
			},
			onClose: () => {
				this.state.isMissingModalOpen = !1;
			}
		}), this.state.isMissingModalOpen = !0, this.updateMissingModal();
	}
	updateMissingModal() {
		if (!this.missingModal || !this.state.isMissingModalOpen) return;
		let e = this.state.studentName || this.state.folder?.name || "Student", t = this.state.folder?.path || "", n = this.state.activePreset || "MAHA DBT", r = this.state.documentPresets ? Object.keys(this.state.documentPresets) : [
			"MAHA DBT",
			"SWAYAM DEENDAYAL YOJANA",
			"CET CELL",
			"EDUCATIONAL DOCUMENTS"
		], i = this.getActivePresetDocuments(), a = new Set(this.state.files.map((e) => (e.docType || "").toUpperCase()).filter(Boolean)), o = i.filter((e) => {
			let t = (e.name || e).toUpperCase();
			return !this.isChecklistRuleSatisfied(t, a);
		}), s = this.state.files.map((e) => {
			let n = e.docType || e.targetName || e.name, r = !1, i = this.getLinkedRules();
			for (let e of i) if (e.combined && (n || "").toUpperCase() === e.combined.toUpperCase()) {
				r = !0;
				break;
			}
			let a = e.ext || P(e.name) || "pdf", o = e.dateModified || e.lastModified || e.modified || Date.now(), s = e.dateCreated || e.ctime || e.birthtime || o, c = e.path || e.filePath || e.nativePath || (t ? `${t.replace(/[\\/]+$/, "")}\\${e.name}` : e.name);
			return {
				name: e.name,
				docType: n,
				size: e.size || 0,
				ext: a.toUpperCase().replace(".", ""),
				dateModified: o,
				dateCreated: s,
				isCombined: r,
				path: c,
				nativePath: c,
				rotation: e.rotation || 0,
				_blobUrl: e._blobUrl || null,
				_pdfBytes: e._pdfBytes || null,
				fileObj: e.fileObj || e.file || null
			};
		});
		for (let e of i) {
			let t = (e.name || e).toUpperCase(), n = T(t);
			if (!a.has(t) && this.isChecklistRuleSatisfied(t, a)) {
				let e = this.getLinkedRules().find((e) => {
					let t = T(e.part1), r = T(e.part2);
					return t === n || r === n;
				}), r = e ? T(e.combined) : "", i = this.state.files.find((e) => {
					let t = T(e.docType || e.targetName || e.name || "");
					return r && (t === r || t.includes(r) || r.includes(t));
				}) || this.state.files[0];
				if (i) {
					let e = i.ext || P(i.name) || "pdf", n = i.path || i.filePath || i.nativePath || "";
					s.push({
						name: `${i.name} (${t})`,
						docType: t,
						size: i.size || 0,
						ext: e.toUpperCase().replace(".", ""),
						dateModified: i.dateModified || Date.now(),
						dateCreated: i.dateCreated || Date.now(),
						isCombined: !0,
						path: n,
						nativePath: n,
						rotation: i.rotation || 0,
						_blobUrl: i._blobUrl || null,
						_pdfBytes: i._pdfBytes || null,
						fileObj: i.fileObj || null
					});
				}
			}
		}
		let c = {};
		o.forEach((t) => {
			let n = typeof t == "string" ? t : t.name || "", r = $e(e, n);
			r && r.promisedDate && (c[n] = r.promisedDate);
		}), o.sort((e, t) => at(typeof e == "string" ? e : e.name || "", typeof t == "string" ? t : t.name || "")), s.sort((e, t) => at(e.docType || e.name || "", t.docType || t.name || "")), this.missingModal.open({
			studentName: e,
			folderPath: t,
			activePreset: n,
			presetsList: r,
			missingRules: o,
			presentDocs: s,
			followupMap: c,
			totalRequiredCount: i.length
		});
	}
};
function gt() {
	let e = new ht();
	return e.init(), typeof window < "u" && (window.docmitraRenamer = e), e;
}
// src/services/export-import-service.js
function _t(e) {
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
function vt(e, t) {
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
var yt = class {
	constructor() {
		this.state = null, this.initialState = null, this.activeChecklist = "MAHA DBT FORM";
	}
	async init() {
		await this.loadState(), this._bindButtons(), this.renderAll(), console.info("[DocMitra Settings] Settings UI manager initialized.");
	}
	async loadState() {
		this.state = He();
		try {
			let e = await Ke();
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
				_t(this.state), r.show("Settings Exported", "Configuration JSON file downloaded.", "success");
			} catch (e) {
				r.show("Export Error", e.message, "error");
			}
		});
		let o = document.getElementById("btnTriggerImportJSON"), s = document.getElementById("inputImportSettingsJSON");
		o && s && (o.addEventListener("click", () => s.click()), s.addEventListener("change", async (e) => {
			let t = e.target.files?.[0];
			if (t) try {
				await vt(t, this.state), Ge(this.state), this.initialState = JSON.parse(JSON.stringify(this.state)), this.renderAll(), r.show("Import Successful", "System configuration restored and verified.", "success");
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
			let p = Me.find((e) => e.outputName.toUpperCase() === t.toUpperCase()), m = p ? p.primaryShortcut : (n[0] || "DOC").toUpperCase().slice(0, 4), h = document.createElement("span");
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
		let n = this.state.checklists || W;
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
		Ge(this.state), await qe({ forms: this.state.checklists }), this.initialState = JSON.parse(JSON.stringify(this.state)), r.show("Settings Saved", "System rules updated and applied to workstation.", "success");
		let e = document.getElementById("settings-modal-overlay");
		e && e.classList.add("hidden"), document.body.style.overflow = "";
	}
	handleReset() {
		window.confirm("Reset all rules, shortcuts, and checklists to factory defaults?") && (this.state.groups = Ne(), this.state.checklists = JSON.parse(JSON.stringify(W)), Ge(this.state), this.initialState = JSON.parse(JSON.stringify(this.state)), this.renderAll(), r.show("Factory Defaults Restored", "All default rules loaded.", "info"));
	}
	handleDiscard() {
		this.state = JSON.parse(JSON.stringify(this.initialState)), this.renderAll(), r.show("Changes Discarded", "Reverted to previous configuration.", "info");
		let e = document.getElementById("settings-modal-overlay");
		e && e.classList.add("hidden"), document.body.style.overflow = "";
	}
};
function bt() {
	let e = new yt();
	return e.init(), e;
}
// tools/pdf_studio/pdf_studio_logic.js
var xt = {
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
function St(e) {
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
		let c = e[o], l = 3 + o * 3, u = l + 1, d = l + 2, f = c.bytes, { width: p, height: m } = c.width && c.height ? c : St(f), h = xt.A4_PORTRAIT.width, g = xt.A4_PORTRAIT.height;
		(t === "landscape" || t === "fit" && p > m) && (h = xt.A4_LANDSCAPE.width, g = xt.A4_LANDSCAPE.height);
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
function Ct(e) {
	let t = [], n = e.length, r = 0;
	for (; r < n - 3;) if (e[r] === 255 && e[r + 1] === 216 && e[r + 2] === 255) {
		let i = r;
		for (r += 2; r < n - 1;) {
			if (e[r] === 255 && e[r + 1] === 217) {
				let n = r + 2, a = e.slice(i, n), o = St(a);
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
	let t = Ct(e);
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
function wt(e, t = "Document.pdf", n = []) {
	let r = $(e);
	!r.length && n && n.length && (r = n);
	let i = t.replace(/\.pdf$/i, "");
	return r.length ? r.map((e, t) => {
		let n = r.length === 1 ? `${i}.jpg` : `${i}_page_${t + 1}.jpg`, a = new Blob([e.bytes], { type: "image/jpeg" });
		return {
			fileName: n,
			blob: a,
			bytes: e.bytes,
			size: a.size,
			pageIndex: t + 1,
			width: e.width,
			height: e.height
		};
	}) : [];
}
function Tt(e, t = "Document.pdf", n = null, r = []) {
	let i = $(e);
	!i.length && r && r.length && (i = r);
	let a = t.replace(/\.pdf$/i, "");
	if (!i.length) return [];
	let o = [];
	return i.forEach((e, t) => {
		if (n && !n.includes(t)) return;
		let r = `${a}_page_${t + 1}.pdf`, i = Q([e], "portrait");
		o.push({
			fileName: r,
			blob: i,
			bytes: e.bytes,
			size: i.size,
			pageIndex: t + 1
		});
	}), o;
}
function Et(e = [], t = "portrait") {
	let n = [];
	for (let t of e) {
		let e = $(t);
		n.push(...e);
	}
	if (!n.length) throw Error("No document images could be extracted to merge PDFs.");
	return Q(n, t);
}
function Dt(e, t = 90) {
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
function Ot(e) {
	switch (e) {
		case "compress_pdf": return "Compressed_PDF";
		case "hyper_compress": return "Hyper_Compressed_PDF";
		case "pdf_to_jpg": return "Converted_JPG";
		case "jpg_to_pdf": return "Converted_PDF";
		case "merge_pdf": return "Merged_PDF";
		case "split_pdf": return "Split_PDF";
		case "rotate_pdf": return "Rotated_PDF";
		case "clean_pdf": return "Enhanced_PDF";
		case "compress_jpg":
		case "bulk_compress": return "Compressed_JPG";
		case "rotate_image": return "Rotated_JPG";
		case "clean_image": return "Enhanced_JPG";
		case "format_convert": return "Converted_Images";
		case "converted_png": return "Converted_PNG";
		default: return "Processed_Files";
	}
}
function kt(e, t) {
	if (!e || !e.trim() || e.trim().toLowerCase() === "all") return Array.from({ length: t }, (e, t) => t);
	let n = /* @__PURE__ */ new Set(), r = e.split(/[,;\s]+/);
	for (let e of r) if (e) {
		if (e.includes("-")) {
			let [r, i] = e.split("-"), a = parseInt(r, 10), o = parseInt(i, 10);
			if (!isNaN(a) && !isNaN(o)) {
				let e = Math.max(1, Math.min(a, o)), r = Math.min(t, Math.max(a, o));
				for (let t = e; t <= r; t++) n.add(t - 1);
			}
		} else {
			let r = parseInt(e, 10);
			!isNaN(r) && r >= 1 && r <= t && n.add(r - 1);
		}
	}
	let i = Array.from(n).sort((e, t) => e - t);
	return i.length ? i : Array.from({ length: t }, (e, t) => t);
}
async function At(e, t = 150, n = .82) {
	if (typeof window > "u" || !window.pdfjsLib) throw Error("PDF.js library is not loaded");
	let r = await window.pdfjsLib.getDocument({ data: e.slice() }).promise, i = r.numPages, a = (t || 150) / 72, o = [];
	for (let e = 1; e <= i; e++) {
		let t = await r.getPage(e), i = t.getViewport({ scale: a }), s = document.createElement("canvas");
		s.width = Math.floor(i.width), s.height = Math.floor(i.height);
		let c = s.getContext("2d");
		await t.render({
			canvasContext: c,
			viewport: i
		}).promise;
		let l = s.toDataURL("image/jpeg", n).split(",")[1], u = atob(l), d = new Uint8Array(u.length);
		for (let e = 0; e < u.length; e++) d[e] = u.charCodeAt(e);
		o.push({
			bytes: d,
			width: s.width,
			height: s.height,
			pageIndex: e
		});
	}
	return o;
}
// tools/pdf_studio/rotation_engine.js
function jt(e, t = 90) {
	let n = (t % 360 + 360) % 360;
	if (n === 0) return e;
	try {
		let t = "", r = 65536;
		for (let n = 0; n < e.length; n += r) t += String.fromCharCode.apply(null, e.subarray(n, n + r));
		let i = /(\d+\s+\d+\s+obj\s*<<[\s\S]*?\/Type\s*\/Page(?!\w)[\s\S]*?>>\s*endobj)/g, a = 0, o = t.replace(i, (e) => {
			a++;
			let t = e.match(/\/Rotate\s+(\d+)/);
			if (t) {
				let r = ((parseInt(t[1], 10) || 0) + n) % 360;
				return e.replace(/\/Rotate\s+\d+/, `/Rotate ${r}`);
			}
			return e.replace(/\/Type\s*\/Page(?!\w)/, `/Type /Page /Rotate ${n}`);
		});
		if (a > 0) {
			let e = new Uint8Array(o.length);
			for (let t = 0; t < o.length; t++) e[t] = o.charCodeAt(t) & 255;
			return e;
		}
		let s = /(\d+\s+\d+\s+obj\s*<<[\s\S]*?\/Type\s*\/Pages(?!\w)[\s\S]*?>>\s*endobj)/g, c = 0, l = t.replace(s, (e) => {
			c++;
			let t = e.match(/\/Rotate\s+(\d+)/);
			if (t) {
				let r = ((parseInt(t[1], 10) || 0) + n) % 360;
				return e.replace(/\/Rotate\s+\d+/, `/Rotate ${r}`);
			}
			return e.replace(/\/Type\s*\/Pages(?!\w)/, `/Type /Pages /Rotate ${n}`);
		});
		if (c > 0) {
			let e = new Uint8Array(l.length);
			for (let t = 0; t < l.length; t++) e[t] = l.charCodeAt(t) & 255;
			return e;
		}
		return e;
	} catch (t) {
		return console.warn("[PDF Studio RotationEngine] PDF in-place rotation failed:", t), e;
	}
}
async function Mt(e, t = "image/jpeg", n = 90) {
	let r = (n % 360 + 360) % 360;
	if (r === 0 || typeof window > "u" || !window.document) return e;
	let i = new Blob([e], { type: t }), a = URL.createObjectURL(i), o = new Image();
	await new Promise((e, t) => {
		o.onload = e, o.onerror = () => t(/* @__PURE__ */ Error("Failed to load image for rotation")), o.src = a;
	}), URL.revokeObjectURL(a);
	let s = document.createElement("canvas"), c = s.getContext("2d");
	r === 90 || r === 270 ? (s.width = o.naturalHeight || o.height, s.height = o.naturalWidth || o.width) : (s.width = o.naturalWidth || o.width, s.height = o.naturalHeight || o.height), c.translate(s.width / 2, s.height / 2), c.rotate(r * Math.PI / 180), c.drawImage(o, -o.width / 2, -o.height / 2);
	let l = t.includes("png") ? "image/png" : "image/jpeg", u = await (await new Promise((e) => {
		s.toBlob((t) => e(t), l, .95);
	})).arrayBuffer();
	return new Uint8Array(u);
}
async function Nt({ filePath: e, ext: t, bytes: n, degrees: r = 90 }) {
	try {
		let i = n;
		if (!i && e && (i = await _(e)), !i || !i.length) return {
			success: !1,
			error: "File content could not be read"
		};
		let a = (t || (e ? e.split(".").pop() : "")).toLowerCase().replace(/^\./, ""), o;
		if (a === "pdf") o = jt(i, r);
		else if (a === "png") o = await Mt(i, "image/png", r);
		else if (a === "jpg" || a === "jpeg") o = await Mt(i, "image/jpeg", r);
		else return {
			success: !1,
			error: `Unsupported file extension: ${a}`
		};
		if (!o || !o.length) return {
			success: !1,
			error: "Rotation engine returned empty buffer"
		};
		if (e) {
			let t = await v(e, o);
			if (!t.success) return {
				success: !1,
				error: t.error || "Failed to write rotated file to disk"
			};
			if (typeof window < "u" && window.__TAURI__?.invoke) try {
				await window.__TAURI__.invoke("strip_windows_file_locks", { paths: [e] });
			} catch (e) {
				console.warn("[PDF Studio] strip_windows_file_locks warning:", e);
			}
		}
		return {
			success: !0,
			newBytes: o
		};
	} catch (e) {
		return console.error("[PDF Studio RotationEngine] Physical rotation failed:", e), {
			success: !1,
			error: e.message
		};
	}
}
// tools/pdf_studio/compress_pro_engine.js
function Pt(e) {
	if (!e) return "Document.pdf";
	let t = e.lastIndexOf("."), n = t === -1 ? e : e.slice(0, t), r = t === -1 ? "" : e.slice(t);
	return `${n.replace(/[\s_-]+\d+(?:\.\d+)?\s*(?:KB|MB)$/i, "").trim()}${r}`;
}
function Ft(e, t) {
	let n = Pt(e), r = n.lastIndexOf("."), i = r === -1 ? n : n.slice(0, r), a = r === -1 ? ".pdf" : n.slice(r);
	return t >= 10485760 ? `${i} ${(t / 1048576).toFixed(2)} MB${a}` : `${i} ${Math.max(1, Math.round(t / 1024))} KB${a}`;
}
function It(e, t) {
	return (e || 0) <= t * 1024;
}
function Lt(e, t, n) {
	try {
		let r = e.getImageData(0, 0, t, n), i = r.data, a = i.length, o = 255 / 232;
		for (let e = 0; e < a; e += 4) i[e] = Math.min(255, Math.max(0, (i[e] - 14) * o)), i[e + 1] = Math.min(255, Math.max(0, (i[e + 1] - 14) * o)), i[e + 2] = Math.min(255, Math.max(0, (i[e + 2] - 14) * o));
		let s = new Uint8ClampedArray(i), c = t * 4;
		for (let e = 1; e < n - 1; e += 2) {
			let n = e * c;
			for (let e = 1; e < t - 1; e += 2) {
				let t = n + e * 4;
				for (let e = 0; e < 3; e++) {
					let n = s[t + e], r = s[t - c + e], a = s[t + c + e], o = s[t - 4 + e], l = s[t + 4 + e], u = n * 2.2 - (r + a + o + l) * .3;
					i[t + e] = u < 0 ? 0 : u > 255 ? 255 : u;
				}
			}
		}
		e.putImageData(r, 0, 0);
	} catch (e) {
		console.warn("[CompressProEngine] Micro-sharpen skipped:", e);
	}
}
function Rt(e, t, n) {
	try {
		let r = Math.min(n, 800), i = Math.min(t, 800), a = e.getImageData(0, 0, i, r).data, o = 0;
		for (let e = 20; e < r - 20; e += 15) {
			let t = e * i * 4, n = a[t] < 110;
			for (let e = 20; e < i - 20; e += 4) {
				let r = a[t + e * 4] < 110;
				r !== n && (o++, n = r);
			}
		}
		return o > 180;
	} catch {
		return !1;
	}
}
function zt(e, t, n) {
	try {
		let r = e.getImageData(0, 0, t, n), i = r.data, a = i.length;
		for (let e = 0; e < a; e += 4) {
			let t = i[e] * .299 + i[e + 1] * .587 + i[e + 2] * .114 | 0;
			i[e] = t, i[e + 1] = t, i[e + 2] = t;
		}
		e.putImageData(r, 0, 0);
	} catch (e) {
		console.warn("[CompressProEngine] Grayscale fallback error:", e);
	}
}
function Bt(e, t = 150) {
	let n = document.createElement("canvas"), r = (t || 150) / 72, i = Math.round(595.28 * r), a = Math.round(841.89 * r), o = Math.round(18 * r), s = i - o * 2, c = a - o * 2;
	n.width = i, n.height = a;
	let l = n.getContext("2d");
	l.fillStyle = "#FFFFFF", l.fillRect(0, 0, i, a);
	let u = e.naturalWidth || e.width, d = e.naturalHeight || e.height, f = Math.min(s / u, c / d, 1), p = Math.round(u * f), m = Math.round(d * f), h = Math.round(o + (s - p) / 2), g = Math.round(o + (c - m) / 2);
	return l.drawImage(e, h, g, p, m), n;
}
function Vt(e) {
	try {
		let t = "", n = 65536;
		for (let r = 0; r < e.length; r += n) t += String.fromCharCode.apply(null, e.subarray(r, r + n));
		let r = t.replace(/\/Metadata\s+\d+\s+\d+\s+R/g, "");
		if (r = r.replace(/\/PieceInfo\s*<<[\s\S]*?>>/g, ""), r = r.replace(/\/Thumb\s+\d+\s+\d+\s+R/g, ""), r.length < t.length) {
			let e = new Uint8Array(r.length);
			for (let t = 0; t < r.length; t++) e[t] = r.charCodeAt(t) & 255;
			return e;
		}
		return e;
	} catch {
		return e;
	}
}
function Ht(e) {
	if (!e || e.length < 8) return e;
	let t = -1, n = Math.min(e.length - 5, 2048);
	for (let r = 0; r < n; r++) if (e[r] === 37 && e[r + 1] === 80 && e[r + 2] === 68 && e[r + 3] === 70) {
		t = r;
		break;
	}
	return t > 0 ? e.slice(t) : e;
}
async function Ut(e, t = .82) {
	return new Promise((n) => {
		e.toBlob((e) => {
			e ? e.arrayBuffer().then((e) => n(new Uint8Array(e))) : n(/* @__PURE__ */ new Uint8Array());
		}, "image/jpeg", t);
	});
}
async function Wt({ canvases: e, targetKb: t, hasQr: n = !1, rotation: r = 0 }) {
	let i = t * 1024, a = e.length || 1, o = .28, s = .94, c = null, l = null;
	n && (o = Math.max(o, .45));
	let u = i * .94;
	i * .99;
	for (let t = 1; t <= 4; t++) {
		let t = (o + s) / 2, n = [];
		for (let r of e) {
			let e = await Ut(r, t);
			n.push(e);
		}
		let a = Q(n, "portrait", r), d = a.size;
		if (!c || d <= i || d < c.size && c.size > i) {
			c = a;
			let e = await a.arrayBuffer();
			l = new Uint8Array(e);
		}
		if (d >= u && d <= i) break;
		d > i ? s = t : o = t;
	}
	if (c && c.size > i && a >= 1) {
		for (let t of e) zt(t.getContext("2d"), t.width, t.height);
		o = n ? .4 : .26, s = .88;
		for (let t = 1; t <= 3; t++) {
			let t = (o + s) / 2, n = [];
			for (let r of e) {
				let e = await Ut(r, t);
				n.push(e);
			}
			let a = Q(n, "portrait", r);
			if (a.size < c.size) {
				c = a;
				let e = await a.arrayBuffer();
				l = new Uint8Array(e);
			}
			if (a.size <= i) break;
			s = t;
		}
	}
	let d = !1, f = 0;
	return c && c.size > i && (d = !0, f = Math.round(c.size / 1024)), {
		blob: c,
		finalBytes: l,
		size: c ? c.size : 0,
		isAtFloor: d,
		floorKb: f
	};
}
async function Gt(e, t = 300) {
	if (!e || !e.bytes || !e.bytes.length) return {
		success: !1,
		error: "Empty file buffer"
	};
	let n = /\.(jpe?g|png|webp)$/i.test(e.name), r = t * 1024;
	if (It(e.size, t)) {
		if (n) {
			let t = Q([e.bytes.slice()], "portrait", e.rotation || 0), n = await t.arrayBuffer(), r = new Uint8Array(n), i = Ft(e.name.replace(/\.[^/.]+$/, "") + ".pdf", r.length);
			return {
				success: !0,
				finalBytes: r,
				finalBlob: t,
				finalSize: r.length,
				outName: i,
				isAtFloor: !1,
				floorKb: 0,
				skippedSmaller: !0
			};
		}
		{
			let t = Ft(e.name, e.size), n = new Blob([e.bytes.slice()], { type: "application/pdf" });
			return {
				success: !0,
				finalBytes: e.bytes.slice(),
				finalBlob: n,
				finalSize: e.size,
				outName: t,
				isAtFloor: !1,
				floorKb: 0,
				skippedSmaller: !0
			};
		}
	}
	let i = e.bytes.slice();
	if (!n && (i = Ht(i), i = Vt(i), i.length <= r)) {
		let t = Ft(e.name, i.length), n = new Blob([i], { type: "application/pdf" });
		return {
			success: !0,
			finalBytes: i,
			finalBlob: n,
			finalSize: i.length,
			outName: t,
			isAtFloor: !1,
			floorKb: 0,
			skippedSmaller: !1
		};
	}
	let a = [], o = !1;
	if (n) {
		let t = new Blob([i], { type: e.name.match(/\.png$/i) ? "image/png" : "image/jpeg" }), n = Bt(await createImageBitmap(t), 150), r = n.getContext("2d");
		o = Rt(r, n.width, n.height), Lt(r, n.width, n.height), a.push(n);
	} else if (window.pdfjsLib) {
		let t = await window.pdfjsLib.getDocument({ data: i.slice() }).promise, n = t.numPages;
		for (let r = 1; r <= n; r++) {
			let n = await t.getPage(r), i = n.getViewport({
				scale: 150 / 72,
				rotation: e.rotation || 0
			}), s = document.createElement("canvas");
			s.width = Math.floor(i.width), s.height = Math.floor(i.height);
			let c = s.getContext("2d");
			await n.render({
				canvasContext: c,
				viewport: i
			}).promise, o ||= Rt(c, s.width, s.height), Lt(c, s.width, s.height), a.push(s);
		}
	}
	let s = await Wt({
		canvases: a,
		targetKb: t,
		hasQr: o,
		rotation: e.rotation || 0
	}), c = Ft(e.name.replace(/\.[^/.]+$/, "") + ".pdf", s.size);
	return {
		success: !0,
		finalBytes: s.finalBytes,
		finalBlob: s.blob,
		finalSize: s.size,
		outName: c,
		isAtFloor: s.isAtFloor,
		floorKb: s.floorKb,
		skippedSmaller: !1
	};
}
async function Kt(e, t, n, r) {
	let i = [], a = Math.min(3, Math.max(2, (navigator.hardwareConcurrency || 4) - 1)), o = [...e], s = Array(a).fill(null).map(async () => {
		for (; o.length > 0;) {
			let e = o.shift();
			if (!e) break;
			try {
				n && n(e.id, 25);
				let a = await Gt(e, t);
				n && n(e.id, 100), i.push({
					file: e,
					res: a
				}), r && r(e, a);
			} catch (t) {
				console.error("[CompressProEngine] File failed:", e.name, t);
				let n = {
					success: !1,
					error: t.message
				};
				i.push({
					file: e,
					res: n
				}), r && r(e, n);
			}
		}
	});
	return await Promise.all(s), i;
}
// tools/pdf_studio/pdf_studio_ui.js
var qt = class {
	constructor() {
		this.activeTool = "compress_pdf", this.files = [], this.activeFolderPath = "", this.activeFolderName = "", this.targetKb = 300, this.jpgDpi = 150, this.splitPageRange = "", this.isProcessing = !1, this.lastOutputFolder = "", this.sortDesc = !0, this.draggedIndex = null, this.modalFileIdx = -1, this.modalPage = 1, this.modalTotalPages = 1, this.modalZoom = "fit", this.modalRotation = 0, this.modalPdfDoc = null, this.renderTask = null;
	}
	init() {
		this._bindRibbonTools(), this._bindActions(), this._bindDropzone(), this._bindTargetSizeControls(), this._bindBentoDropdowns(), this._bindModalControls(), this._bindHotkeys(), this.setTool("compress_pdf"), this.renderQueue(), console.info("[DocMitra PDF Studio] Zero-Port Native UI Manager initialized.");
	}
	_bindRibbonTools() {
		document.querySelectorAll("#view-pdf-studio .tool-ribbon-btn").forEach((e) => {
			e.addEventListener("click", (t) => {
				t.preventDefault();
				let n = e.getAttribute("data-tool") || "compress_pdf";
				this.setTool(n, e);
			});
		});
	}
	setTool(e, t = null) {
		this.activeTool = e, document.querySelectorAll("#view-pdf-studio .tool-ribbon-btn").forEach((e) => {
			e.classList.remove("bg-primary-container", "text-on-primary", "font-semibold", "shadow-sm"), e.classList.add("text-on-surface-variant", "hover:bg-surface-container-low", "hover:text-on-surface");
			let t = e.querySelector(".active-tool-badge");
			t && t.remove();
		});
		let n = t || document.querySelector(`#view-pdf-studio .tool-ribbon-btn[data-tool="${e}"]`);
		if (n && (n.classList.remove("text-on-surface-variant", "hover:bg-surface-container-low", "hover:text-on-surface"), n.classList.add("bg-primary-container", "text-on-primary", "font-semibold", "shadow-sm"), !n.querySelector(".active-tool-badge"))) {
			let e = document.createElement("span");
			e.className = "active-tool-badge bg-primary/60 text-on-primary text-[10px] font-mono-code px-1.5 py-0.5 rounded font-bold uppercase tracking-tight", e.textContent = "Active", n.appendChild(e);
		}
		let i = document.getElementById("compressTargetControlBar"), a = document.getElementById("bentoJpgDpiWrapper"), o = document.getElementById("splitRangeWrapper");
		i && i.classList.toggle("hidden", e !== "compress_pdf"), a && a.classList.toggle("hidden", e !== "pdf_to_jpg"), o && o.classList.toggle("hidden", e !== "split_pdf");
		let s = Ot(e), c = document.getElementById("sidebarOutputSubfolderText");
		c && (c.textContent = s);
		let l = document.getElementById("footerSubfolderOutputText");
		l && (l.textContent = `${s}/`), this._updateProcessButtonLabel(), r.show("Tool Selected", this._getToolDisplayName(e), "info");
	}
	_getToolDisplayName(e) {
		switch (e) {
			case "compress_pdf": return "Compress PDF";
			case "merge_pdf": return "Merge PDF";
			case "split_pdf": return "Split PDF";
			case "pdf_to_jpg": return "PDF to JPG";
			case "jpg_to_pdf": return "JPG to PDF";
			case "rotate_pdf": return "Rotate PDF";
			case "clean_pdf": return "Clean & Enhance";
			default: return "Compress PDF";
		}
	}
	_updateProcessButtonLabel() {
		let e = document.getElementById("startCompressBtn");
		if (!e) return;
		let t = e.querySelector("span:nth-of-type(2)") || e.querySelector("span:last-of-type");
		t && (t.textContent = this._getToolDisplayName(this.activeTool));
	}
	_bindTargetSizeControls() {
		let e = document.querySelectorAll("#compressTargetControlBar .target-radio-pill"), t = document.getElementById("sliderTargetKb"), n = document.getElementById("inputManualTargetKb"), i = document.getElementById("inputManualTargetMb"), a = (t) => {
			e.forEach((e) => {
				let n = parseInt(e.getAttribute("data-kb"), 10);
				n === t ? n === 300 ? (e.className = "target-radio-pill relative px-3 py-0.5 text-xs font-bold text-white bg-blue-600 rounded-md shadow-md ring-2 ring-blue-500/50 flex items-center gap-1.5 transition cursor-pointer", e.innerHTML = "\n              <span class=\"relative flex h-1.5 w-1.5\">\n                <span class=\"animate-beacon-ping absolute inline-flex h-full w-full rounded-full bg-sky-300 opacity-75\"></span>\n                <span class=\"relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400\"></span>\n              </span>\n              <span class=\"tracking-wide\">300 KB</span>\n            ") : (e.className = "target-radio-pill px-2.5 py-0.5 text-xs font-bold text-white bg-blue-600 rounded-md shadow-xs transition cursor-pointer", e.textContent = `${n} KB`) : (e.className = "target-radio-pill px-2.5 py-0.5 text-xs font-medium text-slate-600 rounded-md hover:bg-white hover:text-slate-900 transition cursor-pointer", e.textContent = `${n} KB`);
			});
		}, o = (e, r) => {
			let o = parseInt(e, 10);
			(isNaN(o) || o <= 0) && (o = 300), o > 102400 && (o = 102400), this.targetKb = o, r !== "slider" && t && (t.value = Math.min(Math.max(o, 50), 1e3)), r !== "inputKb" && n && (n.value = o), r !== "inputMb" && i && (i.value = (o / 1024).toFixed(2)), a(o), this.updateStats(), this.updateCardsProjectedSize();
		};
		e.forEach((e) => {
			e.addEventListener("click", (t) => {
				t.preventDefault();
				let n = parseInt(e.getAttribute("data-kb"), 10);
				o(n, "radio"), r.show("Target Size", `Target set to < ${n} KB`, "info");
			});
		}), t && t.addEventListener("input", (e) => {
			let t = parseInt(e.target.value, 10);
			o(t, "slider");
		}), n && (n.addEventListener("input", (e) => {
			let t = parseInt(e.target.value, 10);
			!isNaN(t) && t > 0 && o(t, "inputKb");
		}), n.addEventListener("change", (e) => {
			let t = parseInt(e.target.value, 10);
			(isNaN(t) || t < 30) && (t = 30), o(t, "inputKb");
		})), i && (i.addEventListener("input", (e) => {
			let t = parseFloat(e.target.value);
			if (!isNaN(t) && t > 0) {
				let e = Math.round(t * 1024);
				o(e, "inputMb");
			}
		}), i.addEventListener("change", (e) => {
			let t = parseFloat(e.target.value);
			(isNaN(t) || t < .05) && (t = .05), t > 100 && (t = 100);
			let n = Math.round(t * 1024);
			o(n, "inputMb");
		})), o(300, "init");
	}
	_bindActions() {
		let e = document.getElementById("btnBrowsePdfDir");
		e && e.addEventListener("click", () => this.handleBrowseFolder());
		let t = document.getElementById("btnAddPdfFiles");
		t && t.addEventListener("click", () => this.handleAddFiles());
		let n = document.getElementById("btnRotateAllPdf");
		n && n.addEventListener("click", () => this.handleRotateAll());
		let i = document.getElementById("btnClearPdfQueue");
		i && i.addEventListener("click", () => this.handleClearQueue());
		let a = document.getElementById("btnFilterOversizedPdf");
		a && a.addEventListener("click", () => this.handleFilterOversized());
		let o = document.getElementById("btnOpenOutputFolder");
		o && o.addEventListener("click", () => {
			this.lastOutputFolder && b(this.lastOutputFolder);
		});
		let s = document.getElementById("btnPdfScrollLeft"), c = document.getElementById("btnPdfScrollRight"), l = document.getElementById("pdfCardsGrid");
		s && l && s.addEventListener("click", () => {
			l.scrollBy({
				left: -300,
				behavior: "smooth"
			});
		}), c && l && c.addEventListener("click", () => {
			l.scrollBy({
				left: 300,
				behavior: "smooth"
			});
		});
		let u = document.getElementById("btnPdfSortSize");
		u && u.addEventListener("click", () => {
			this.sortDesc = !this.sortDesc, this.files.sort((e, t) => this.sortDesc ? t.size - e.size : e.size - t.size), u.textContent = this.sortDesc ? "Size (Desc)" : "Size (Asc)", this.renderQueue();
		});
		let d = document.getElementById("btnPdfSortDocket");
		d && d.addEventListener("click", () => {
			this.files.sort((e, t) => e.name.localeCompare(t.name, void 0, {
				numeric: !0,
				sensitivity: "base"
			})), this.renderQueue(), r.show("Queue Sorted", "Natural sorting (1-0, A-Z) applied.", "info");
		});
		let f = document.getElementById("inputSplitPageRange");
		f && f.addEventListener("input", (e) => {
			this.splitPageRange = e.target.value.trim();
		});
		let p = document.getElementById("startCompressBtn");
		p && p.addEventListener("click", () => this.handleStartProcess());
	}
	_bindBentoDropdowns() {
		let e = document.getElementById("btnBentoJpgDpi"), t = document.getElementById("menuBentoJpgDpi"), n = document.getElementById("labelJpgDpi");
		e && t && (e.addEventListener("click", (e) => {
			e.stopPropagation(), t.classList.toggle("hidden");
		}), t.querySelectorAll("button[data-dpi]").forEach((e) => {
			e.addEventListener("click", (i) => {
				i.stopPropagation();
				let a = parseInt(e.getAttribute("data-dpi"), 10) || 150;
				this.jpgDpi = a, n && (n.textContent = `${a} DPI ${a === 150 ? "(Fast)" : a === 300 ? "(High Quality)" : "(Web)"}`), t.classList.add("hidden"), this._updateProcessButtonLabel(), r.show("DPI Updated", `PDF to JPG resolution set to ${a} DPI`, "info");
			});
		})), document.addEventListener("click", () => {
			t && !t.classList.contains("hidden") && t.classList.add("hidden");
		});
	}
	_bindDropzone() {
		let e = document.getElementById("view-pdf-studio");
		e && (e.addEventListener("dragover", (e) => {
			e.preventDefault(), e.stopPropagation();
		}), e.addEventListener("drop", async (e) => {
			e.preventDefault(), e.stopPropagation();
			let t = Array.from(e.dataTransfer?.files || []), n = this.activeTool === "compress_pdf", i = this.activeTool === "jpg_to_pdf", a = n || i ? i ? /\.(jpe?g|png)$/i : /\.(pdf|jpe?g|png)$/i : /\.pdf$/i, o = t.filter((e) => a.test(e.name)), s = t.filter((e) => !a.test(e.name));
			s.length > 0 && r.show("Unsupported File Skipped", `Skipped ${s.length} unsupported file(s). Only PDF, JPG, and PNG are allowed.`, "warning"), o.length === 0 ? s.length === 0 && r.show("No Files Dropped", n ? "Please drop PDF, JPG, or PNG files." : "Please drop valid documents.", "warning") : await this.loadDroppedFiles(o);
		}));
	}
	_bindHotkeys() {
		window.addEventListener("keydown", (e) => {
			let t = document.getElementById("view-pdf-studio");
			if (!t || t.classList.contains("hidden")) return;
			let n = document.getElementById("modalPdfStudioPreview");
			if (n && !n.classList.contains("hidden")) {
				if (e.key === "Escape") {
					e.preventDefault(), this.closePreviewModal();
					return;
				}
				if (e.key === "PageUp" || e.key === "ArrowLeft") {
					e.preventDefault(), this.modalPrevPage();
					return;
				}
				if (e.key === "PageDown" || e.key === "ArrowRight") {
					e.preventDefault(), this.modalNextPage();
					return;
				}
				if (e.key === "r" || e.key === "R") {
					e.preventDefault(), this.modalRotate(90);
					return;
				}
				if (e.ctrlKey && (e.key === "+" || e.key === "=")) {
					e.preventDefault(), this.modalZoomIn();
					return;
				}
				if (e.ctrlKey && e.key === "-") {
					e.preventDefault(), this.modalZoomOut();
					return;
				}
				if (e.ctrlKey && e.key === "0") {
					e.preventDefault(), this.modalZoomFit();
					return;
				}
			} else e.key === "F2" ? (e.preventDefault(), this.handleBrowseFolder()) : e.key === "F8" ? (e.preventDefault(), this.handleStartProcess()) : e.altKey && (e.key === "m" || e.key === "M") ? (e.preventDefault(), this.setTool("merge_pdf")) : e.altKey && (e.key === "s" || e.key === "S") ? (e.preventDefault(), this.setTool("split_pdf")) : e.altKey && (e.key === "j" || e.key === "J") ? (e.preventDefault(), this.setTool("pdf_to_jpg")) : e.altKey && (e.key === "p" || e.key === "P") ? (e.preventDefault(), this.setTool("jpg_to_pdf")) : e.altKey && (e.key === "r" || e.key === "R") ? (e.preventDefault(), this.setTool("rotate_pdf")) : e.key === "Escape" && this.handleClearQueue();
		});
	}
	async handleBrowseFolder() {
		r.show("Opening Folder Picker", "Navigating Windows Explorer...", "info");
		try {
			let e = await d();
			if (!e.success) {
				e.cancelled || r.show("Folder Select Error", e.error || "Failed to select folder", "error");
				return;
			}
			this.activeFolderPath = e.path || "", this.activeFolderName = e.name || (e.path ? e.path.split(/[\/\\]/).pop() : "Selected Folder");
			let t = document.getElementById("displayPdfFolderName");
			t && (t.textContent = this.activeFolderName, t.title = this.activeFolderPath);
			let n = this.activeTool === "compress_pdf", i = this.activeTool === "jpg_to_pdf", a = (e.files || []).filter((e) => n ? /\.(pdf|jpe?g|png|webp)$/i.test(e.name) : i ? /\.(jpe?g|png|webp)$/i.test(e.name) : /\.pdf$/i.test(e.name));
			if (a.length === 0) {
				r.show("No Files Found", "Folder contains 0 matching documents.", "warning");
				return;
			}
			await this.loadNativeFiles(a), r.show("Files Loaded", `${a.length} files added from ${this.activeFolderName}.`, "success");
		} catch (e) {
			r.show("Folder Error", e.message, "error");
		}
	}
	async handleAddFiles() {
		try {
			let e = this.activeTool === "compress_pdf", t = this.activeTool === "jpg_to_pdf", n = await f(e ? "Documents & Images (*.pdf;*.jpg;*.jpeg;*.png)|*.pdf;*.jpg;*.jpeg;*.png" : t ? "Images (*.jpg;*.jpeg;*.png)|*.jpg;*.jpeg;*.png" : "PDF Documents (*.pdf)|*.pdf", e ? "Select Documents (PDF, JPG, PNG) - DocMitra" : t ? "Select Images for PDF - DocMitra" : "Select PDF Files - DocMitra");
			if (n && n.success && n.files && n.files.length) {
				if (!this.activeFolderPath && n.files[0].path) {
					let e = n.files[0].path.replace(/\\/g, "/").split("/");
					e.pop(), this.activeFolderPath = e.join("/"), this.activeFolderName = e.pop() || "Selected Folder";
					let t = document.getElementById("displayPdfFolderName");
					t && (t.textContent = this.activeFolderName, t.title = this.activeFolderPath);
				}
				await this.loadNativeFiles(n.files), r.show("Files Added", `${n.files.length} files added to execution queue.`, "success");
				return;
			}
		} catch (e) {
			console.warn("Native select files fallback:", e);
		}
		let e = document.createElement("input");
		e.type = "file", e.accept = this.activeTool === "compress_pdf" || this.activeTool === "jpg_to_pdf" ? ".pdf,.jpg,.jpeg,.png,image/jpeg,image/png,application/pdf" : ".pdf,application/pdf", e.multiple = !0, e.style.display = "none", e.addEventListener("change", async (t) => {
			let n = Array.from(t.target.files || []), i = this.activeTool === "compress_pdf" || this.activeTool === "jpg_to_pdf" ? this.activeTool === "jpg_to_pdf" ? /\.(jpe?g|png)$/i : /\.(pdf|jpe?g|png)$/i : /\.pdf$/i, a = n.filter((e) => i.test(e.name)), o = n.filter((e) => !i.test(e.name));
			o.length > 0 && r.show("Unsupported File Skipped", `Skipped ${o.length} unsupported file(s). Only PDF, JPG, and PNG are allowed.`, "warning"), a.length > 0 && await this.loadDroppedFiles(a), document.body.removeChild(e);
		}), document.body.appendChild(e), e.click();
	}
	async loadNativeFiles(e) {
		let t = this.activeTool === "compress_pdf", n = this.activeTool === "jpg_to_pdf", i = t || n ? n ? /\.(jpe?g|png)$/i : /\.(pdf|jpe?g|png)$/i : /\.pdf$/i, a = e.filter((e) => i.test(e.name)), o = e.filter((e) => !i.test(e.name));
		if (o.length > 0 && r.show("Unsupported File Skipped", `Skipped ${o.length} unsupported file(s). Only PDF, JPG, and PNG are allowed.`, "warning"), a.length !== 0) {
			for (let e of a) try {
				let t = null;
				if (e.path) t = await _(e.path);
				else if (e.fileObj) {
					let n = await e.fileObj.arrayBuffer();
					t = new Uint8Array(n);
				}
				let n = e.dir || (e.path ? e.path.substring(0, e.path.lastIndexOf(/[\/\\]/)) : this.activeFolderPath);
				if (!this.activeFolderPath && n) {
					this.activeFolderPath = n.replace(/\\/g, "/"), this.activeFolderName = this.activeFolderPath.split("/").pop() || "Folder";
					let e = document.getElementById("displayPdfFolderName");
					e && (e.textContent = this.activeFolderName, e.title = this.activeFolderPath);
				}
				this.files.push({
					id: `pdf_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
					name: e.name,
					path: e.path || e.name,
					dir: n,
					size: e.size || (t ? t.length : 0),
					bytes: t,
					pageCount: 1,
					rotation: 0,
					status: "ready"
				});
			} catch (t) {
				console.warn(`[PDF-STUDIO] Failed to read bytes for ${e.name} via Native IPC:`, t);
			}
			this.updateStats(), this.renderQueue();
		}
	}
	async loadDroppedFiles(e) {
		for (let t of e) {
			let e = await t.arrayBuffer(), n = new Uint8Array(e);
			this.files.push({
				id: `pdf_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
				name: t.name,
				path: t.name,
				dir: this.activeFolderPath || "",
				size: t.size,
				bytes: n,
				pageCount: 1,
				rotation: 0,
				status: "ready"
			});
		}
		this.updateStats(), this.renderQueue(), r.show("Files Queued", `${e.length} files added to execution queue.`, "success");
	}
	updateStats() {
		let e = this.files.length, t = this.files.reduce((e, t) => e + (t.size || 0), 0), n = (t / 1048576).toFixed(2), r = this.files.reduce((e, t) => e + Math.min(t.size || 0, this.targetKb * 1024), 0), i = (r / 1048576).toFixed(2), a = t > 0 && t > r ? Math.max(0, Math.round((t - r) / t * 100)) : 0, o = document.getElementById("summaryPdfCount");
		o && (o.innerHTML = `${e} Documents <span class="text-[10px] font-normal text-slate-500 font-sans">(Ready)</span>`);
		let s = document.getElementById("summaryPdfTotalSize");
		s && (s.innerHTML = `${n} MB <span class="text-[10px] font-normal text-slate-400 font-sans">(Uncompressed)</span>`);
		let c = document.getElementById("summaryPdfProjected");
		c && (c.textContent = `~${i} MB`);
		let l = document.getElementById("summaryPdfReductionBadge");
		l && (l.textContent = `↓ -${a}% saved`);
		let u = document.getElementById("pdfQueueCount");
		u && (u.textContent = `${e} Files`);
		let d = document.getElementById("pdfQueueStats");
		d && (d.textContent = `Total: ${n} MB → Projected: ~${i} MB`), this._updateProcessButtonLabel();
	}
	renderQueue() {
		let e = document.getElementById("pdfCardsGrid");
		if (e) {
			for (; e.firstChild;) e.removeChild(e.firstChild);
			if (this.files.length === 0) {
				let t = document.createElement("div");
				t.className = "col-span-full p-8 text-center bg-surface-container-lowest rounded-xl border border-surface-container-high/80 flex flex-col items-center gap-2";
				let n = document.createElement("span");
				n.className = "material-symbols-outlined text-[40px] text-primary opacity-60", n.textContent = this.activeTool === "jpg_to_pdf" ? "add_photo_alternate" : "picture_as_pdf", t.appendChild(n);
				let r = document.createElement("div");
				r.className = "font-headline-sm font-bold text-on-surface", r.textContent = "Drag & Drop Files", t.appendChild(r);
				let i = document.createElement("div");
				i.className = "text-body-sm text-secondary", i.textContent = "or use Add Files above to queue documents for processing.", t.appendChild(i), e.appendChild(t);
			} else this.files.forEach((t, n) => {
				let i = document.createElement("div");
				i.className = "docket-card relative bg-white rounded-xl border border-slate-200/90 p-2.5 flex flex-col justify-between hover:border-blue-400 hover:shadow-lg transition-all group cursor-pointer stitch-paper-shadow", i.setAttribute("data-file-id", t.id), this.activeTool === "merge_pdf" && (i.setAttribute("draggable", "true"), i.addEventListener("dragstart", (e) => {
					this.draggedIndex = n, i.classList.add("card-dragging"), e.dataTransfer.effectAllowed = "move";
				}), i.addEventListener("dragend", () => {
					i.classList.remove("card-dragging"), this.draggedIndex = null;
				}), i.addEventListener("dragover", (e) => {
					e.preventDefault(), e.dataTransfer.dropEffect = "move", i.classList.add("card-drag-over");
				}), i.addEventListener("dragleave", () => {
					i.classList.remove("card-drag-over");
				}), i.addEventListener("drop", (e) => {
					if (e.preventDefault(), i.classList.remove("card-drag-over"), this.draggedIndex !== null && this.draggedIndex !== n) {
						let e = this.files.splice(this.draggedIndex, 1)[0];
						this.files.splice(n, 0, e), this.renderQueue(), r.show("Reordered", `Moved "${e.name}" to position ${n + 1}.`, "info");
					}
				}));
				let a = document.createElement("div");
				a.className = "flex items-center justify-between gap-1 mb-1.5";
				let o = /\.(jpe?g)$/i.test(t.name), s = /\.(png|webp)$/i.test(t.name), c = document.createElement("span");
				o ? (c.className = "px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-600 text-white font-mono uppercase", c.textContent = "JPG") : s ? (c.className = "px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-600 text-white font-mono uppercase", c.textContent = "PNG") : (c.className = "px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-white font-mono uppercase", c.textContent = "PDF"), a.appendChild(c);
				let l = document.createElement("div");
				l.className = "flex items-center gap-1";
				let u = this.targetKb * 1024, d = document.createElement("span");
				d.className = "badge-reduction-pct bg-rose-50 border border-rose-200 text-rose-600 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono", t.size > u ? d.textContent = `-${Math.min(95, Math.max(1, Math.round((t.size - u) / t.size * 100)))}%` : d.style.display = "none", l.appendChild(d);
				let f = document.createElement("button");
				f.type = "button", f.className = "w-5 h-5 rounded flex items-center justify-center bg-slate-100 hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-colors shadow-2xs cursor-pointer opacity-70 group-hover:opacity-100", f.title = "Rotate 90° Clockwise";
				let p = document.createElement("span");
				p.className = "material-symbols-outlined text-[13px]", p.textContent = "rotate_right", f.appendChild(p), f.addEventListener("click", (e) => {
					e.stopPropagation(), this.rotateSingleFile(n);
				}), l.appendChild(f);
				let m = document.createElement("button");
				m.type = "button", m.className = "w-5 h-5 rounded flex items-center justify-center bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors shadow-2xs cursor-pointer opacity-70 group-hover:opacity-100", m.title = "Remove File";
				let h = document.createElement("span");
				h.className = "material-symbols-outlined text-[13px]", h.textContent = "close", m.appendChild(h), m.addEventListener("click", (e) => {
					e.stopPropagation(), this.removeFile(n);
				}), l.appendChild(m), a.appendChild(l), i.appendChild(a);
				let g = document.createElement("div");
				g.className = "relative w-full h-56 rounded-lg bg-slate-50 border border-slate-200/80 overflow-hidden mb-2 p-1.5 flex items-center justify-center group-hover:bg-blue-50/20 transition-colors";
				let _ = document.createElement("canvas");
				if (_.className = "max-w-full max-h-full object-contain shadow-xs rounded bg-white", g.appendChild(_), t.thumbUrl) {
					let e = new Image();
					e.onload = () => {
						_.width = e.width, _.height = e.height, _.getContext("2d").drawImage(e, 0, 0);
					}, e.src = t.thumbUrl;
				} else if (t.bytes && window.pdfjsLib && !t.name.match(/\.(jpe?g|png|webp)$/i)) window.pdfjsLib.getDocument({ data: t.bytes.slice() }).promise.then((e) => {
					t.pageCount = e.numPages, e.getPage(1).then((e) => {
						let n = e.getViewport({
							scale: .5,
							rotation: t.rotation || 0
						});
						_.height = n.height, _.width = n.width, e.render({
							canvasContext: _.getContext("2d"),
							viewport: n
						}).promise.then(() => {
							try {
								t.thumbUrl = _.toDataURL("image/jpeg", .85);
							} catch {}
						}).catch(() => {});
					});
				}).catch((e) => {
					console.warn("PDF.js thumbnail render error:", e), _.style.display = "none";
					let t = document.createElement("span");
					t.className = "material-symbols-outlined text-[36px] text-blue-500 opacity-40", t.textContent = "picture_as_pdf", g.appendChild(t);
				});
				else if (t.bytes && t.name.match(/\.(jpe?g|png|webp)$/i)) {
					let e = new Image(), n = new Blob([t.bytes.slice()], { type: s ? "image/png" : "image/jpeg" });
					e.src = URL.createObjectURL(n), e.onload = () => {
						_.width = e.width, _.height = e.height, _.getContext("2d").drawImage(e, 0, 0);
						try {
							t.thumbUrl = _.toDataURL("image/jpeg", .85);
						} catch {}
						URL.revokeObjectURL(e.src);
					};
				}
				i.appendChild(g);
				let v = document.createElement("div");
				v.className = "font-sans text-xs font-bold text-slate-800 truncate mb-1.5", v.title = t.name, v.textContent = t.name, i.appendChild(v);
				let y = document.createElement("div");
				y.className = "flex items-center justify-between gap-1 pt-1 border-t border-slate-100";
				let b = t.size > 1048576 ? `${(t.size / 1048576).toFixed(2)} MB` : `${Math.round(t.size / 1024)} KB`, x = t.size > u ? this.targetKb >= 1024 ? `${(this.targetKb / 1024).toFixed(2)} MB` : `${this.targetKb} KB` : b, S = document.createElement("span");
				S.className = "badge-orig-size px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded font-mono text-[10px] font-bold truncate", S.textContent = `Orig ${b}`, y.appendChild(S);
				let C = document.createElement("span");
				C.className = t.size > u ? "badge-comp-size px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200/80 rounded font-mono text-[10px] font-bold truncate" : "badge-comp-size px-1.5 py-0.5 bg-slate-50 text-slate-600 border border-slate-200/80 rounded font-mono text-[10px] font-bold truncate", C.textContent = `Comp ${x}`, y.appendChild(C), i.appendChild(y), i.addEventListener("click", () => {
					this.openPreviewModal(n);
				}), e.appendChild(i);
			});
		}
	}
	updateCardsProjectedSize() {
		let e = document.querySelectorAll("#pdfCardsGrid .docket-card[data-file-id]"), t = this.targetKb * 1024, n = this.targetKb >= 1024 ? `${(this.targetKb / 1024).toFixed(2)} MB` : `${this.targetKb} KB`;
		e.forEach((e) => {
			let r = e.getAttribute("data-file-id"), i = this.files.find((e) => e.id === r);
			if (!i) return;
			let a = e.querySelector(".badge-reduction-pct"), o = e.querySelector(".badge-comp-size"), s = i.size > 1048576 ? `${(i.size / 1048576).toFixed(2)} MB` : `${Math.round(i.size / 1024)} KB`;
			if (i.size > t) {
				let e = Math.min(95, Math.max(1, Math.round((i.size - t) / i.size * 100)));
				a && (a.textContent = `-${e}%`, a.style.display = ""), o && (o.textContent = `Comp ${n}`, o.className = "badge-comp-size px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200/80 rounded font-mono text-[10px] font-bold truncate");
			} else a && (a.style.display = "none"), o && (o.textContent = `Comp ${s}`, o.className = "badge-comp-size px-1.5 py-0.5 bg-slate-50 text-slate-600 border border-slate-200/80 rounded font-mono text-[10px] font-bold truncate");
		});
	}
	async rotateSingleFile(e) {
		let t = this.files[e];
		if (t && t.bytes) {
			r.show("Rotating...", `Rotating ${t.name} 90° clockwise...`, "info");
			try {
				let e = await Nt({
					filePath: t.path,
					ext: t.name.split(".").pop(),
					bytes: t.bytes.slice(),
					degrees: 90
				});
				if (!e.success) {
					r.show("Rotate Failed", e.error || "Could not rotate file on disk", "error");
					return;
				}
				t.bytes = e.newBytes, t.size = e.newBytes.length, t.rotation = ((t.rotation || 0) + 90) % 360, t.thumbUrl = null;
				let n = document.querySelector(`.docket-card[data-file-id="${t.id}"]`);
				if (n) {
					let e = n.querySelector("canvas");
					if (e) {
						if (t.name.match(/\.(jpe?g|png|webp)$/i)) {
							let n = new Image(), r = new Blob([t.bytes.slice()], { type: t.name.match(/\.png$/i) ? "image/png" : "image/jpeg" });
							n.src = URL.createObjectURL(r), n.onload = () => {
								e.width = n.width, e.height = n.height, e.getContext("2d").drawImage(n, 0, 0);
								try {
									t.thumbUrl = e.toDataURL("image/jpeg", .85);
								} catch {}
								URL.revokeObjectURL(n.src);
							};
						} else if (window.pdfjsLib) {
							let n = await (await window.pdfjsLib.getDocument({ data: t.bytes.slice() }).promise).getPage(1), r = n.getViewport({
								scale: .5,
								rotation: 0
							});
							e.width = r.width, e.height = r.height;
							let i = e.getContext("2d");
							await n.render({
								canvasContext: i,
								viewport: r
							}).promise;
							try {
								t.thumbUrl = e.toDataURL("image/jpeg", .85);
							} catch {}
						}
					}
					let r = n.querySelector(".badge-orig-size");
					r && (r.textContent = `Orig ${t.size > 1048576 ? `${(t.size / 1048576).toFixed(2)} MB` : `${Math.round(t.size / 1024)} KB`}`);
				}
				this.updateStats(), this.updateCardsProjectedSize(), r.show("File Rotated & Saved", "File rotated & saved directly to disk.", "success");
			} catch (e) {
				console.error("[PDF Studio] Rotate error:", e), r.show("Rotate Error", e.message, "error");
			}
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
				t.rotation = ((t.rotation || 0) + 90) % 360;
				let n = Dt(t.bytes, 90);
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
		let e = this.targetKb * 1024, t = this.files.length;
		this.files = this.files.filter((t) => t.size > e), this.updateStats(), this.renderQueue(), r.show("Filter Applied", `Kept ${this.files.length} oversized files (>${this.targetKb} KB) from ${t}.`, "info");
	}
	_bindModalControls() {
		let e = document.getElementById("btnClosePdfModal");
		e && e.addEventListener("click", () => this.closePreviewModal());
		let t = document.getElementById("btnPdfModalPrev"), n = document.getElementById("btnPdfModalNext");
		t && t.addEventListener("click", () => this.modalPrevPage()), n && n.addEventListener("click", () => this.modalNextPage());
		let r = document.getElementById("btnPdfModalZoomIn"), i = document.getElementById("btnPdfModalZoomOut"), a = document.getElementById("btnPdfModalZoomFit"), o = document.getElementById("btnPdfModalZoomReset");
		r && r.addEventListener("click", () => this.modalZoomIn()), i && i.addEventListener("click", () => this.modalZoomOut()), a && a.addEventListener("click", () => this.modalZoomFit()), o && o.addEventListener("click", () => this.modalZoomReset());
		let s = document.getElementById("btnPdfModalRotateCCW"), c = document.getElementById("btnPdfModalRotateCW"), l = document.getElementById("btnPdfModalRotateFlip");
		s && s.addEventListener("click", () => this.modalRotate(-90)), c && c.addEventListener("click", () => this.modalRotate(90)), l && l.addEventListener("click", () => this.modalRotate(180));
	}
	async openPreviewModal(e) {
		let t = this.files[e];
		if (!t || !t.bytes) return;
		this.modalFileIdx = e, this.modalPage = 1, this.modalZoom = "fit", this.modalRotation = t.rotation || 0;
		let n = document.getElementById("modalPdfStudioPreview");
		n && n.classList.remove("hidden");
		let r = document.getElementById("pdfModalDocTitle");
		r && (r.textContent = t.name);
		let i = document.getElementById("pdfModalDocMeta"), a = t.size > 1048576 ? `${(t.size / 1048576).toFixed(2)} MB` : `${(t.size / 1024).toFixed(0)} KB`;
		if (i && (i.textContent = `Size: ${a} • Direct Output Ready`), window.pdfjsLib && !t.name.match(/\.(jpe?g|png|webp)$/i)) try {
			this.modalPdfDoc = await window.pdfjsLib.getDocument({ data: t.bytes.slice() }).promise, this.modalTotalPages = this.modalPdfDoc.numPages, this.renderModalPage();
		} catch (e) {
			console.warn("PDF.js modal load failed:", e);
		}
		else this.modalTotalPages = 1, this.renderModalImage(t.bytes);
	}
	closePreviewModal() {
		let e = document.getElementById("modalPdfStudioPreview");
		if (e && e.classList.add("hidden"), this.renderTask) try {
			this.renderTask.cancel();
		} catch {}
		this.modalPdfDoc = null, this.modalFileIdx = -1;
	}
	modalPrevPage() {
		this.modalPage > 1 && (this.modalPage--, this.renderModalPage());
	}
	modalNextPage() {
		this.modalPage < this.modalTotalPages && (this.modalPage++, this.renderModalPage());
	}
	modalZoomIn() {
		let e = typeof this.modalZoom == "number" ? this.modalZoom : 1;
		this.modalZoom = Math.min(3, e + .25), this.renderModalPage();
	}
	modalZoomOut() {
		let e = typeof this.modalZoom == "number" ? this.modalZoom : 1;
		this.modalZoom = Math.max(.4, e - .25), this.renderModalPage();
	}
	modalZoomFit() {
		this.modalZoom = "fit", this.renderModalPage();
	}
	modalZoomReset() {
		this.modalZoom = 1, this.renderModalPage();
	}
	modalRotate(e) {
		this.modalRotation = (this.modalRotation + e + 360) % 360, this.modalFileIdx >= 0 && this.files[this.modalFileIdx] && (this.files[this.modalFileIdx].rotation = this.modalRotation), this.renderModalPage(), this.renderQueue();
	}
	async renderModalPage() {
		if (!this.modalPdfDoc) return;
		let e = document.getElementById("pdfModalPageIndicatorText");
		e && (e.textContent = `Page ${this.modalPage} of ${this.modalTotalPages}`);
		let t = document.getElementById("btnPdfModalPrev"), n = document.getElementById("btnPdfModalNext");
		t && (t.disabled = this.modalPage <= 1), n && (n.disabled = this.modalPage >= this.modalTotalPages);
		let r = document.getElementById("pdfModalZoomReadout");
		r && (r.textContent = this.modalZoom === "fit" ? "Fit" : `${Math.round(this.modalZoom * 100)}%`);
		let i = document.getElementById("pdfModalCanvas"), a = document.getElementById("pdfModalViewport");
		if (i && a) try {
			this.renderTask && this.renderTask.cancel();
			let e = await this.modalPdfDoc.getPage(this.modalPage), t = e.getViewport({
				scale: 1,
				rotation: this.modalRotation
			}), n = 1;
			if (this.modalZoom === "fit") {
				let e = a.clientWidth - 48, r = a.clientHeight - 48;
				n = Math.min(e / t.width, r / t.height);
			} else n = this.modalZoom;
			let r = e.getViewport({
				scale: n,
				rotation: this.modalRotation
			});
			i.width = Math.floor(r.width), i.height = Math.floor(r.height);
			let o = i.getContext("2d");
			this.renderTask = e.render({
				canvasContext: o,
				viewport: r
			}), await this.renderTask.promise;
		} catch (e) {
			e.name !== "RenderingCancelledException" && console.warn("Modal page render error:", e);
		}
	}
	renderModalImage(e) {
		let t = document.getElementById("pdfModalCanvas");
		if (!t) return;
		let n = new Image(), r = new Blob([e], { type: "image/jpeg" });
		n.src = URL.createObjectURL(r), n.onload = () => {
			t.width = n.width, t.height = n.height, t.getContext("2d").drawImage(n, 0, 0), URL.revokeObjectURL(n.src);
		};
	}
	async saveOutputFile(e, t, n) {
		let r;
		if (n instanceof Uint8Array) r = n;
		else if (n instanceof Blob) {
			let e = await n.arrayBuffer();
			r = new Uint8Array(e);
		} else throw Error("Invalid output format");
		let i = this.activeFolderPath ? `${this.activeFolderPath}/${e}` : `Output/${e}`, a = t.replace(/[<>:"/\\|?*]/g, "_"), o = a.lastIndexOf(".");
		o !== -1 && a.slice(0, o), o !== -1 && a.slice(o);
		let s = `${i}/${a}`, c = await v(s, r);
		if (!c.success) throw Error(c.error || `Failed to write file ${s}`);
		if (typeof window < "u" && window.__TAURI__?.invoke) try {
			await window.__TAURI__.invoke("strip_windows_file_locks", { paths: [s] });
		} catch {}
		return this.lastOutputFolder = i, s;
	}
	async handleStartProcess() {
		if (this.files.length === 0) {
			r.show("No Files", "Please add files to process.", "warning");
			return;
		}
		if (this.isProcessing) return;
		this.isProcessing = !0;
		let e = this.activeTool, t = Ot(e);
		r.show("Processing Started", `Running ${this._getToolDisplayName(e)} via Zero-Port Native IPC...`, "info");
		try {
			let n = 0;
			if (e === "compress_pdf") await Kt(this.files, this.targetKb, (e, t) => {
				let n = document.querySelector(`.docket-card[data-file-id="${e}"]`);
				if (n) {
					let e = n.querySelector(".badge-comp-size");
					e && (e.textContent = `Comp ~${t}%...`);
				}
			}, async (e, r) => {
				if (r && r.success) {
					await this.saveOutputFile(t, r.outName, r.finalBlob || r.finalBytes), n++;
					let i = document.querySelector(`.docket-card[data-file-id="${e.id}"]`);
					if (i) {
						let e = i.querySelector(".badge-comp-size");
						if (e && (e.textContent = `Comp ${r.finalSize >= 1048576 ? `${(r.finalSize / 1048576).toFixed(2)} MB` : `${Math.round(r.finalSize / 1024)} KB`}`, e.className = "badge-comp-size px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-300 rounded font-mono text-[10px] font-bold truncate"), r.isAtFloor) {
							let e = i.querySelector(".badge-floor-limit");
							e || (e = document.createElement("div"), e.className = "badge-floor-limit mt-1 px-1.5 py-0.5 bg-amber-50 border border-amber-300 text-amber-800 rounded font-mono text-[9px] font-bold text-center", i.appendChild(e)), e.textContent = `⚠ Min readable limit: ${r.floorKb} KB`;
						}
					}
				}
			}), r.show("Compression Complete!", `Saved ${n} files directly into ${t}/`, "success");
			else if (e === "merge_pdf") {
				let e = Et(this.files.map((e) => e.bytes).filter(Boolean), "portrait"), i = this.activeFolderName ? `Merged_Admission_Dossier_${this.activeFolderName}.pdf` : "Merged_Admission_Dossier.pdf";
				await this.saveOutputFile(t, i, e), n = 1, r.show("Merge Complete!", `Dossier saved to ${t}/${i}`, "success");
			} else if (e === "split_pdf") {
				for (let e of this.files) {
					if (!e.bytes) continue;
					let r = $(e.bytes);
					r && r.length !== 0 || (r = await At(e.bytes, 150, .85));
					let i = r.length || e.pageCount || 1, a = kt(this.splitPageRange, i), o = Tt(e.bytes, e.name, a, r);
					for (let e of o) await this.saveOutputFile(t, e.fileName, e.blob), n++;
				}
				r.show("Split Complete!", `Extracted ${n} pages into ${t}/`, "success");
			} else if (e === "pdf_to_jpg") {
				for (let e of this.files) {
					if (!e.bytes) continue;
					let r = [], i = $(e.bytes);
					i && i.length !== 0 || (r = await At(e.bytes, this.jpgDpi, .85));
					let a = wt(e.bytes, e.name, r);
					for (let e of a) await this.saveOutputFile(t, e.fileName, e.blob || e.bytes), n++;
				}
				r.show("Conversion Complete!", `Saved ${n} high-res JPGs to ${t}/`, "success");
			} else if (e === "jpg_to_pdf") {
				let e = [];
				for (let t of this.files) t.bytes && e.push({ bytes: t.bytes });
				if (e.length > 0) {
					let i = Q(e, "portrait"), a = this.activeFolderName ? `Compiled_Documents_${this.activeFolderName}.pdf` : "Compiled_Document.pdf";
					await this.saveOutputFile(t, a, i), n = 1, r.show("Compilation Complete!", `Compiled ${e.length} images into ${t}/${a}`, "success");
				}
			} else if (e === "rotate_pdf") {
				for (let e of this.files) {
					if (!e.bytes) continue;
					let r = Dt(e.bytes, e.rotation || 90);
					await this.saveOutputFile(t, e.name, r), n++;
				}
				r.show("Rotation Complete!", `Saved ${n} rotated PDFs to ${t}/`, "success");
			} else {
				for (let e of this.files) {
					if (!e.bytes) continue;
					let r = Q($(e.bytes), "portrait");
					await this.saveOutputFile(t, e.name, r), n++;
				}
				r.show("Enhancement Complete!", `Saved ${n} clean PDFs to ${t}/`, "success");
			}
			let i = document.getElementById("btnOpenOutputFolder");
			i && i.classList.remove("hidden");
		} catch (e) {
			console.error("[PDF-STUDIO] Process failed:", e), r.show("Operation Failed", e.message, "error");
		} finally {
			this.isProcessing = !1;
		}
	}
};
function Jt() {
	let e = new qt();
	return e.init(), typeof window < "u" && (window.pdfStudioUI = e), e;
}
// src/modules/image-studio.js
function Yt(e, t, n, r = "magic_color") {
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
function Xt(e, t = 0) {
	let n = document.createElement("canvas"), r = (t % 360 + 360) % 360, i = r === 90 || r === 270, a = i ? e.height : e.width, o = i ? e.width : e.height;
	n.width = a, n.height = o;
	let s = n.getContext("2d");
	return s.save(), s.translate(n.width / 2, n.height / 2), s.rotate(r * Math.PI / 180), s.drawImage(e, -e.width / 2, -e.height / 2), s.restore(), n;
}
async function Zt(e, t = 250, n = {}) {
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
				if (r === 0 ? (l = document.createElement("canvas"), l.width = e, l.height = s, l.getContext("2d").drawImage(c, 0, 0, e, s)) : l = Xt(c, r), i && i !== "none" && Yt(l.getContext("2d"), l.width, l.height, i), !t || t <= 0) {
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
async function Qt(e, t = "image/png") {
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
var $t = class {
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
			let e = await d();
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
			Xt(n, 90).toBlob((e) => {
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
						let e = /sign|signature|स्वाक्षरी/i.test(n.name) ? 18 : 45, i = await Zt(r, e);
						this._downloadBlob(i.blob, `Compressed_${n.name}`), t++;
					} else if (e === "passport_crop") {
						let e = await Zt(await this._cropPassport(r), 48);
						this._downloadBlob(e.blob, `Passport_${n.name}`), t++;
					} else if (e === "sign_clean_invert") {
						let e = await Zt(r, 18, { filterMode: "sharp_contrast" });
						this._downloadBlob(e.blob, `Clean_Sign_${n.name}`), t++;
					} else if (e === "image_to_pdf") {
						let e = await r.arrayBuffer(), i = Q([{
							bytes: new Uint8Array(e),
							width: 0,
							height: 0
						}], "portrait"), a = n.name.replace(/\.[a-zA-Z0-9]+$/, "") + ".pdf";
						this._downloadBlob(i, a), t++;
					} else if (e === "magic_color") {
						let e = await Zt(r, 240, { filterMode: "enhanced" });
						this._downloadBlob(e.blob, `Magic_${n.name}`), t++;
					} else {
						let e = await Qt(r, "image/jpeg");
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
function en() {
	let e = new $t();
	return e.init(), e;
}
// src/libraries/document-matcher.js
var tn = [
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
function nn(e, t = null) {
	if (!e || typeof e != "string") return {
		docType: null,
		percentage: 0,
		badgeText: "Needs Input ✏️",
		badgeClass: "matchNeutral",
		status: "none"
	};
	let n = e.trim().toLowerCase(), r = n.replace(/[-_.]+/g, " ");
	for (let e of tn) if (n === e.shortcut.toLowerCase() || r.trim() === e.shortcut.toLowerCase()) return {
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
	for (let e of tn) for (let t of e.patterns) if (t.test(n) || t.test(r)) return {
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
({ ...je });
function rn(e) {
	if (!e || typeof e != "string") return "";
	let t = nn(e);
	if (t && t.docType) return t.docType;
	let n = e.replace(/\.[^/.]+$/, "");
	return n = n.replace(/\s*\(p\.\d+\)/i, ""), n.trim().toUpperCase();
}
function an(e) {
	if (!e || typeof e != "string") return "";
	let t = e.replace(/\.[^/.]+$/, "").trim(), n = nn(t);
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
function on(e, t = []) {
	return !Array.isArray(e) || e.length === 0 ? [] : !Array.isArray(t) || t.length === 0 ? [...e] : [...e].sort((e, n) => {
		let r = e.docType || rn(e.label || e.name), i = n.docType || rn(n.label || n.name), a = t.findIndex((e) => {
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
var sn = class {
	constructor() {
		this.presets = { ...je }, this.activePresetKey = "MAHA DBT FORM", this.documents = [], this.activeDocIndex = 0, this.zoomLevel = 100;
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
		this.documents = on(this.documents, e), this.activeDocIndex = 0, this.renderDocumentList(), this.renderActivePreview(), this.renderThumbnails(), r.show("Sequence Applied", `Ordered according to ${this.activePresetKey} criteria.`, "success");
	}
	async handleBrowseFolder() {
		r.show("Opening Folder Picker", "Navigating Windows Explorer...", "info");
		try {
			let e = await d();
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
				let n = rn(e.name), r = an(e.name);
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
function cn() {
	let e = new sn();
	return e.init(), e;
}
// src/ui/followup-ui.js
var ln = class {
	constructor() {
		this.items = [], this.searchQuery = "";
	}
	init() {
		this._seedDemoDataIfEmpty(), this.items = J(), this._bindControls(), this.renderTable(), console.info("[DocMitra Follow-up Desk] Follow-up UI manager initialized.");
	}
	_seedDemoDataIfEmpty() {
		if (J().length === 0) {
			let e = nt(), t = rt(2);
			Xe([
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
			let e = await d();
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
			let f = et(t.promisedDate), p = document.createElement("div");
			p.className = f === "overdue" ? "font-mono-code font-bold text-error" : f === "today" ? "font-mono-code font-bold text-amber-700" : "font-mono-code font-bold text-emerald-700", p.textContent = tt(t.promisedDate), d.appendChild(p);
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
		let t = tt(e.promisedDate);
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
		Qe(e.folderName, e.documentName), e.status = "resolved", this.renderTable(), r.show("कागदपत्र प्राप्त!", `${e.documentName} for ${e.studentName} marked as received.`, "success");
	}
};
function un() {
	let e = new ln();
	return e.init(), e;
}
// src/ui/index.js
function dn() {
	let e = new n();
	e.init(), new a().init(), bt();
	let t = gt();
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
	}, Jt(), en(), cn(), un(), o();
	let i = document.getElementById("themeToggleBtn");
	i && i.addEventListener("click", () => {
		document.documentElement.classList.toggle("dark");
		let e = document.documentElement.classList.contains("dark");
		r.show(e ? "Dark Theme Enabled" : "Light Theme Enabled", "UI Preference Updated", "info");
	}), console.info("[DocMitra] UI Shell & Modules initialized successfully.");
}
document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", dn) : dn();
export { dn as initAppShell };
