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
		this.container = null, this._ensureContainer();
	}
	_ensureContainer() {
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
	[
		"#btnSelectFolder",
		"#btnAutoDetect",
		"#btnRenameAll",
		"#btnUndoRename",
		"#btnClearQueue",
		"#btnKeepOriginal",
		"#btnSaveBatch",
		"#btnExportAudit",
		"#startCompressBtn",
		"#btnClearPdfQueue",
		"#btnSelectPdfFolder",
		"#startImageProcessBtn",
		"#btnAutoCropPassport",
		"#btnClearImageQueue",
		"#btnFilterOversized",
		"#btnPrintDocuments",
		"#btnCancelPrint",
		"#btnPrinterSelect",
		"#btnSendWhatsApp",
		"#btnCopyMarathiNotice",
		"#btnSendBatchSms",
		"#btnExportFollowup",
		"[data-action=\"placeholder\"]"
	].forEach((e) => {
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
// src/ui/index.js
function o() {
	new n().init(), new i().init(), a();
	let e = document.getElementById("themeToggleBtn");
	e && e.addEventListener("click", () => {
		document.documentElement.classList.toggle("dark");
		let e = document.documentElement.classList.contains("dark");
		r.show(e ? "Dark Theme Enabled" : "Light Theme Enabled", "UI Preference Updated", "info");
	}), console.info("[DocMitra] UI Shell initialized successfully.");
}
document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", o) : o();
export { o as initAppShell };
