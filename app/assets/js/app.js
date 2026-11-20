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
// src/services/native-bridge-service.js
var o = "http://localhost:3000";
async function s() {
	try {
		let e = new AbortController(), t = setTimeout(() => e.abort(), 3e5), n = await fetch(`${o}/api/native-select-folder`, { signal: e.signal });
		return clearTimeout(t), n.ok ? await n.json() : {
			success: !1,
			errorCode: "CM-103",
			error: `Server error: ${n.status}`
		};
	} catch (e) {
		let t = e.name === "AbortError";
		return {
			success: !1,
			errorCode: t ? "CM-106" : "CM-103",
			error: t ? "Folder picker dialog timed out after 5 minutes." : e.message
		};
	}
}
async function c(e, t) {
	try {
		return await (await fetch(`${o}/api/native-rename`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				oldPath: e,
				newName: t
			})
		})).json();
	} catch (e) {
		return {
			success: !1,
			error: e.message
		};
	}
}
// src/libraries/shortcut-keyword-library.js
var l = [
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
function u(e = l) {
	let t = {};
	for (let n of e) t[n.outputName] = [n.primaryShortcut.toLowerCase(), ...(n.alternateKeywords || []).map((e) => e.toLowerCase())];
	return t;
}
function d(e = null) {
	if (!e || typeof e != "object" || !Object.keys(e).length) return l;
	let t = /* @__PURE__ */ new Map();
	for (let e of l) t.set(e.outputName.toUpperCase(), e), e.canonicalKey && t.set(e.canonicalKey.toUpperCase(), e);
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
function f(e, t = null) {
	if (!e || typeof e != "string") return null;
	let n = e.trim().toLowerCase();
	if (t && typeof t == "object") {
		for (let [e, r] of Object.entries(t)) if (Array.isArray(r)) {
			for (let t of r) if (n === t.toLowerCase().trim()) return e;
		}
	}
	let r = d(t);
	for (let e of r) if (n === e.primaryShortcut.toLowerCase()) return e.outputName;
	for (let e of l) if (n === e.primaryShortcut.toLowerCase()) return e.outputName;
	return null;
}
// src/libraries/document-matcher.js
var p = [
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
function m(e, t = null) {
	if (!e || typeof e != "string") return {
		docType: null,
		percentage: 0,
		badgeText: "Needs Input ✏️",
		badgeClass: "matchNeutral",
		status: "none"
	};
	let n = e.trim().toLowerCase(), r = n.replace(/[-_.]+/g, " ");
	for (let e of p) if (n === e.shortcut.toLowerCase() || r.trim() === e.shortcut.toLowerCase()) return {
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
	for (let e of p) for (let t of e.patterns) if (t.test(n) || t.test(r)) return {
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
var h = {
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
}, g = {
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
}, _ = [
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
], v = "2026.11.passing_canonical_v2", y = {
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
}, b = {
	name: "BulkStudentRenamerSettingsDB",
	version: 1,
	store: "settings",
	key: "current"
};
// src/libraries/duplicate-name-library.js
function x(e, t, n) {
	let r = /* @__PURE__ */ new Map();
	if (n) for (let e of n) e && r.set(e.toLowerCase(), e);
	if (!r.has(e.toLowerCase()) || e.toLowerCase() === (t || "").toLowerCase()) return e;
	let i = S(e), a = C(e).replace(/\s+\d+$/, ""), o = 1, s = `${a} ${o}${i}`;
	for (; r.has(s.toLowerCase()) && s.toLowerCase() !== (t || "").toLowerCase();) o++, s = `${a} ${o}${i}`;
	return s;
}
// src/libraries/rename-library.js
function S(e) {
	let t = e.lastIndexOf(".");
	return t > 0 ? e.slice(t) : "";
}
function C(e) {
	let t = S(e);
	return t ? e.slice(0, -t.length) : e;
}
function w(e, t) {
	let n = m(e, t);
	return n.docType ? n.docType : f(e, t) || null;
}
function T(e, t, n = "preserve") {
	return n === "upper" ? t.toUpperCase() : n === "lower" ? t.toLowerCase() : n === "title" ? t.toLowerCase().replace(/(^|\s)\S/g, (e) => e.toUpperCase()) : e === e.toUpperCase() ? t.toUpperCase() : e === e.toLowerCase() ? t.toLowerCase() : t;
}
function E(e, t, n, r = "preserve") {
	let i = w(e, n);
	if (!i) {
		let n = C(e);
		return !t || n.toLowerCase().includes(t.toLowerCase()) ? n : `${n} ${t}`;
	}
	let a = h[i.toUpperCase()] || i, o = T(C(e), a, r);
	return !t || o.toLowerCase().includes(t.toLowerCase()) ? o : `${o} ${t}`;
}
function D(e) {
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
async function O(e, t, n = null) {
	let r = [];
	try {
		let i = 0;
		for (let a of t) {
			if (e && e.nativePath) {
				let o = await c(a.nativePath || a.file && a.file.nativePath || `${e.nativePath}/${a.old}`, a.next);
				if (!o.success) throw Error(o.error || `Failed to rename ${a.old}`);
				r.push(a), i++, n && n(Math.round(i / t.length * 100), `Renamed ${i} of ${t.length} files...`);
				continue;
			}
			let o = a.old.toLowerCase() === a.next.toLowerCase() && a.old !== a.next;
			if (!o) {
				let t = a.next, n = await e.getFileHandle(t, { create: !1 }).catch(() => null);
				if (n) {
					let r = S(t), i = C(t).replace(/\s+\d+$/, ""), o = 1;
					for (t = `${i} ${o}${r}`, n = await e.getFileHandle(t, { create: !1 }).catch(() => null); n;) o++, t = `${i} ${o}${r}`, n = await e.getFileHandle(t, { create: !1 }).catch(() => null);
					a.next = t;
				}
			}
			let s = a.handle;
			s ||= await e.getFileHandle(a.old, { create: !1 }).catch(() => null);
			let l = !1;
			if (s && typeof s.move == "function") try {
				if (o) {
					let e = `__tmp_${Date.now()}_${a.next}`;
					await s.move(e), await s.move(a.next);
				} else await s.move(a.next);
				l = !0, r.push(a);
			} catch (e) {
				console.warn("sourceHandle.move() not supported on this handle, falling back to stream copy:", e), l = !1;
			}
			if (!l) {
				let t = await a.file.arrayBuffer(), n;
				if (o) {
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
async function k(e, t, n = null) {
	let r = [...t].reverse(), i = 0;
	for (let t of r) {
		if (e && e.nativePath) {
			await c(`${e.nativePath}/${t.next}`, t.old), i++, n && n(Math.round(i / r.length * 100), `Undo: ${i}/${r.length}`);
			continue;
		}
		let a = t.old.toLowerCase() === t.next.toLowerCase() && t.old !== t.next, o = await e.getFileHandle(t.next, { create: !1 }).catch(() => null);
		if (o && typeof o.move == "function") {
			if (a) {
				let e = `__tmp_undo_${Date.now()}_${t.old}`;
				await o.move(e), await o.move(t.old);
			} else await o.move(t.old);
		} else if (o) {
			let n = await (await o.getFile()).arrayBuffer(), r = await (await e.getFileHandle(t.old, { create: !0 })).createWritable();
			await r.write(n), await r.close(), await e.removeEntry(t.next);
		}
		i++, n && n(Math.round(i / r.length * 100), `Undo: ${i}/${r.length}`);
	}
}
var A = new class {
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
}();
// src/libraries/export-reports-library.js
function j(e, t) {
	let n = new Blob(["﻿" + t], { type: "text/csv;charset=utf-8;" }), r = URL.createObjectURL(n), i = document.createElement("a");
	i.setAttribute("href", r), i.setAttribute("download", e), i.style.display = "none", document.body.appendChild(i), i.click(), document.body.removeChild(i), URL.revokeObjectURL(r);
}
function M(e) {
	if (e == null) return "\"\"";
	let t = String(e);
	return t.includes("\"") || t.includes(",") || t.includes("\n") || t.includes("\r") ? `"${t.replace(/"/g, "\"\"")}"` : `"${t}"`;
}
function N(e, t, n = "Checklist") {
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
	].map(M).join(",")];
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
		r.push(o.map(M).join(","));
	}), r.join("\r\n");
}
// src/libraries/checklist-library.js
function P(e) {
	return Object.fromEntries(Object.entries(e).map(([e, t]) => [e, t.map((e) => Array.isArray(e) ? {
		name: e[0],
		keywords: e[1],
		short: e[0].replace(/ CERTIFICATE| MARK SHEET| MARKSHEET/g, "").slice(0, 18)
	} : e)]));
}
// src/services/storage-service.js
var F = "v3_exact_single", I = u(), L = (e, t) => {
	try {
		let n = localStorage.getItem(e);
		return n ? JSON.parse(n) : t;
	} catch {
		return t;
	}
}, R = (e, t) => {
	try {
		localStorage.setItem(e, JSON.stringify(t));
	} catch {}
}, z = (e) => {
	let t = {};
	Object.entries(e || {}).forEach(([e, n]) => {
		let r = /^12\s*LC$/i.test(e) || e === "12TH LEAVING CERTIFICATE" ? "12TH LC" : e;
		t[r] = [...t[r] || [], ...Array.isArray(n) ? n : []].filter((e, t, n) => n.indexOf(e) === t);
	});
	let n = {};
	return Object.entries(t).forEach(([e, r]) => {
		e !== "12TH MARKSHEET AND PASSING" && (n[e] = r, e === "12TH PASSING CERTIFICATE" && t["12TH MARKSHEET AND PASSING"] && (n["12TH MARKSHEET AND PASSING"] = t["12TH MARKSHEET AND PASSING"]));
	}), n;
}, B = (e) => {
	let t = e.name === "12TH LEAVING CERTIFICATE" ? "12TH LC" : e.name;
	return {
		...e,
		name: t,
		keywords: [...new Set(e.keywords || [])],
		short: e.short || t.slice(0, 18)
	};
}, V = (e) => {
	let t = e.filter((e) => e.name === "12TH MARKSHEET AND PASSING");
	if (!t.length) return e;
	let n = e.filter((e) => e.name !== "12TH MARKSHEET AND PASSING"), r = n.findIndex((e) => e.name === "12TH PASSING CERTIFICATE");
	return n.splice(r < 0 ? n.length : r + 1, 0, ...t), n;
}, H = (e) => {
	let t = P(y), n = e || {}, r = {};
	return Object.keys(t).forEach((e) => {
		let i = Array.isArray(n[e]) ? n[e].map(B) : [], a = new Map(i.map((e) => [e.name.toUpperCase(), e]));
		t[e].forEach((e) => {
			let t = B(e);
			a.has(t.name.toUpperCase()) || i.push(t);
		}), r[e] = V(i);
	}), Object.entries(n).forEach(([e, t]) => {
		r[e] || (r[e] = V(t.map(B)));
	}), r;
};
function U() {
	let e = localStorage.getItem("dictVersion"), t, n;
	e === F ? (t = z(L("renameSettings", I)), n = L("renameProfiles", { Default: I })) : (t = I, n = { Default: I }, R("renameSettings", t), R("renameProfiles", n), localStorage.setItem("dictVersion", F));
	let r = localStorage.getItem("checklistVersion"), i;
	r === "2026.11.passing_canonical_v2" ? i = H(L("checklists", null)) : (i = P(y), R("checklists", i), localStorage.setItem("checklistVersion", v));
	let a = {
		...g,
		...L("spellingCorrections", {}) || {}
	}, o = L("linkedRules", _);
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
function W() {
	return new Promise((e, t) => {
		if (!("indexedDB" in window)) return t(/* @__PURE__ */ Error("IndexedDB unavailable"));
		let n = indexedDB.open(b.name, b.version);
		n.onupgradeneeded = () => {
			n.result.objectStoreNames.contains(b.store) || n.result.createObjectStore(b.store);
		}, n.onsuccess = () => e(n.result), n.onerror = () => t(n.error || /* @__PURE__ */ Error("IndexedDB open failed"));
	});
}
function G(e) {
	return W().then((t) => new Promise((n, r) => {
		let i = t.transaction(b.store, "readwrite");
		i.objectStore(b.store).put(e, b.key), i.oncomplete = () => n(!0), i.onerror = () => r(i.error);
	}));
}
function K(e) {
	let t = {
		groups: e.groups,
		checklists: e.checklists,
		spelling: e.spelling,
		profiles: e.profiles,
		linkedRules: e.linkedRules,
		style: e.style,
		savedAt: (/* @__PURE__ */ new Date()).toISOString()
	};
	R("renameSettings", t.groups), R("checklists", t.checklists), R("spellingCorrections", t.spelling), R("renameProfiles", t.profiles), R("linkedRules", t.linkedRules), localStorage.setItem("nameStyle", t.style), G(t).catch(() => {});
}
// src/ui/renamer-ui.js
var q = class {
	constructor() {
		this.state = {
			folder: null,
			files: [],
			currentIndex: 0,
			studentName: "",
			style: "preserve",
			settings: null,
			history: [],
			zoom: 100,
			rotation: 0
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
		this.state.settings = U(), this.state.style = this.state.settings.style || "preserve", this._bindDOM(), this._bindKeyboardShortcuts(), console.info("[DocMitra Renamer] Renamer UI manager initialized.");
	}
	_bindDOM() {
		let e = document.getElementById("btnSelectFolder");
		e && e.addEventListener("click", () => this.handleSelectFolder());
		let t = document.getElementById("btnAddFiles");
		t && t.addEventListener("click", () => this.handleAddFiles());
		let n = document.getElementById("btnRescanFolder");
		n && n.addEventListener("click", () => this.handleRescan());
		let i = document.getElementById("btnCopyFolderPath");
		i && i.addEventListener("click", () => {
			this.state.folder?.path && (navigator.clipboard.writeText(this.state.folder.path), r.show("Copied to Clipboard", this.state.folder.path, "info"));
		});
		let a = document.getElementById("btnRenameAll");
		a && a.addEventListener("click", () => this.handleRenameAll());
		let o = document.getElementById("btnUndoRename");
		o && o.addEventListener("click", () => this.handleUndo());
		let s = document.getElementById("btnKeepOriginal");
		s && s.addEventListener("click", () => this.handleKeepOriginal());
		let c = document.getElementById("btnSaveBatch");
		c && c.addEventListener("click", () => this.handleSaveBatch());
		let l = document.getElementById("btnExportAudit");
		l && l.addEventListener("click", () => this.handleExportAudit());
		let u = document.getElementById("btnClearQueue");
		u && u.addEventListener("click", () => this.handleClearQueue()), this._bindPreviewControls();
	}
	_bindKeyboardShortcuts() {
		window.addEventListener("keydown", (e) => {
			let t = document.getElementById("view-bulk-renamer");
			if (!t || t.classList.contains("hidden")) return;
			let n = document.getElementById("settings-modal-overlay");
			if (!n || n.classList.contains("hidden")) {
				if (e.key === "F2") e.preventDefault(), this.handleSelectFolder();
				else if (e.key === "F8") e.preventDefault(), this.handleRenameAll();
				else if (e.key === "F9") e.preventDefault(), this.handleExportAudit();
				else if ((e.ctrlKey || e.metaKey) && (e.key === "z" || e.key === "Z") && !e.shiftKey && e.target.tagName !== "INPUT") e.preventDefault(), this.handleUndo();
				else if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) e.preventDefault(), this.handleSaveBatch();
				else if (e.key === "Tab") {
					let t = document.getElementById("inputRenameTarget");
					if (e.target === t) {
						e.preventDefault(), this.handleConfirmCurrentName(t.value);
						return;
					}
				}
			}
		});
	}
	_bindPreviewControls() {
		let e = document.getElementById("col-preview");
		if (!e) return;
		let t = e.querySelector("button[title*=\"Zoom In\"]"), n = e.querySelector("button[title*=\"Zoom Out\"]"), r = e.querySelector("button[title*=\"Reset Zoom\"]"), i = e.querySelector("button[title*=\"Rotate\"]");
		t && t.addEventListener("click", () => {
			this.state.zoom = Math.min(300, this.state.zoom + 20), this._applyPreviewTransform();
		}), n && n.addEventListener("click", () => {
			this.state.zoom = Math.max(40, this.state.zoom - 20), this._applyPreviewTransform();
		}), r && r.addEventListener("click", () => {
			this.state.zoom = 100, this.state.rotation = 0, this._applyPreviewTransform();
		}), i && i.addEventListener("click", () => {
			this.state.rotation = (this.state.rotation + 90) % 360, this._applyPreviewTransform();
		});
	}
	_applyPreviewTransform() {
		let e = document.getElementById("previewContainerStage");
		e && (e.style.transform = `scale(${this.state.zoom / 100}) rotate(${this.state.rotation}deg)`, e.style.transformOrigin = "center center", e.style.transition = "transform 0.2s ease-out");
	}
	async handleSelectFolder() {
		r.show("Opening Folder Picker", "Navigating Windows Explorer...", "info");
		try {
			let e = await s();
			if (!e.success) {
				e.cancelled || r.show("Folder Select Error", e.error || "Failed to select folder", "error");
				return;
			}
			this.loadFolderData(e), r.show("Folder Loaded", `${e.files ? e.files.length : 0} files found`, "success");
		} catch (e) {
			r.show("Folder Error", e.message, "error");
		}
	}
	loadFolderData(e) {
		let t = e.path || "", n = e.name || (t ? t.split(/[\\/]/).pop() : "Selected Folder"), r = n.replace(/_/g, " ").trim();
		this.state.folder = {
			name: n,
			path: t,
			nativePath: t
		}, this.state.studentName = r;
		let i = e.files || [], a = /* @__PURE__ */ new Set();
		this.state.files = i.map((e, n) => {
			let r = e.ext || S(e.name), i = C(e.name), o = m(i, this.state.settings?.groups).docType || f(i, this.state.settings?.groups) || null, s = i, c = !1;
			o && (s = E(h[o.toUpperCase()] || o, this.state.studentName, this.state.settings?.groups, this.state.style), c = !0);
			let l = x(s.endsWith(r) ? s : s + r, e.name, a);
			return a.add(l), {
				id: `file_${n}_${Date.now()}`,
				name: e.name,
				path: e.path || `${t}/${e.name}`,
				size: e.size || 0,
				ext: r,
				url: e.url || (e.path ? `http://localhost:3000/api/serve-file?path=${encodeURIComponent(e.path)}` : null),
				docType: o,
				isMatched: c,
				suggestedName: l,
				targetName: l,
				status: c ? "matched" : "pending",
				isRenamed: !1,
				isKept: !1
			};
		}), this.state.currentIndex = 0, this.updateTelemetry(), this.renderQueue(), this.renderCurrentPreview();
	}
	updateTelemetry() {
		let e = this.state.files.length, t = this.state.files.filter((e) => e.isMatched || e.status === "renamed" || e.status === "kept").length, n = e - t, r = (this.state.files.reduce((e, t) => e + (t.size || 0), 0) / 1048576).toFixed(1), i = e > 0 ? Math.round(t / e * 100) : 0, a = document.getElementById("activeFolderPath");
		a && (a.textContent = this.state.folder ? this.state.folder.path : "No folder selected");
		let o = document.getElementById("telemetryTotalFiles");
		o && (o.textContent = String(e));
		let s = document.getElementById("telemetryMatchedFiles");
		s && (s.textContent = `${t} (${i}%)`);
		let c = document.getElementById("telemetryPendingFiles");
		c && (c.textContent = String(n));
		let l = document.getElementById("telemetryTotalSize");
		l && (l.textContent = `${r} MB`);
		let u = document.getElementById("btnRenameAll");
		if (u) {
			let e = this.state.files.filter((e) => !e.isRenamed && !e.isKept && e.targetName !== e.name), t = u.querySelector(".font-bold");
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
			a.className = "text-body-sm text-secondary", a.textContent = "Click \"Select Folder\" (F2) above to load student files and run automated canonical matching.", n.appendChild(a), t.appendChild(n), e.appendChild(t);
			return;
		}
		let n = this.state.files[this.state.currentIndex];
		if (n) {
			let e = document.createElement("div");
			e.className = "flex flex-col gap-space-xs shrink-0";
			let r = document.createElement("div");
			r.className = "flex items-center justify-between px-1 text-label-sm";
			let i = document.createElement("div");
			i.className = "flex items-center gap-2";
			let a = document.createElement("span");
			a.className = "px-2.5 py-1 rounded bg-primary text-on-primary font-bold text-[11px] flex items-center gap-1.5 shadow-sm";
			let o = document.createElement("span");
			o.className = "material-symbols-outlined text-[14px]", o.textContent = "edit_document", a.appendChild(o);
			let s = document.createTextNode(`Editing ${this.state.currentIndex + 1} of ${this.state.files.length}`);
			a.appendChild(s), i.appendChild(a), r.appendChild(i);
			let c = document.createElement("span");
			c.className = n.isMatched ? "px-2 py-0.5 rounded font-mono-code text-[10px] bg-tertiary-fixed text-on-tertiary-fixed font-bold" : "px-2 py-0.5 rounded font-mono-code text-[10px] bg-error-container text-on-error-container font-bold", c.textContent = n.isMatched ? "Matched" : "Unmatched", r.appendChild(c), e.appendChild(r);
			let l = document.createElement("article");
			l.className = "bg-surface-container-lowest rounded-xl shadow-md p-space-md flex flex-col gap-space-md border-2 border-primary ring-2 ring-primary/20 relative";
			let u = document.createElement("div");
			u.className = "flex items-center justify-between text-[11px] font-mono-code text-secondary";
			let d = document.createElement("span");
			d.textContent = "Original: ";
			let f = document.createElement("strong");
			f.className = "text-on-surface truncate max-w-[260px] inline-block", f.textContent = n.name, d.appendChild(f), u.appendChild(d);
			let p = document.createElement("span");
			p.textContent = `${(n.size / 1024).toFixed(0)} KB`, u.appendChild(p), l.appendChild(u);
			let m = document.createElement("div");
			m.className = "flex flex-col gap-1.5";
			let h = document.createElement("div");
			h.className = "flex items-center justify-between font-label-sm font-semibold";
			let g = document.createElement("label");
			g.className = "text-on-surface font-bold text-[13px]", g.textContent = "Rename To:", h.appendChild(g);
			let _ = document.createElement("span");
			_.className = "text-secondary text-[11px] flex items-center gap-1", _.appendChild(document.createTextNode("Press "));
			let v = document.createElement("kbd");
			v.className = "px-1.5 py-0.5 rounded bg-surface-container font-mono-code text-[10px] text-on-surface font-bold border border-outline-variant/40", v.textContent = "Tab", _.appendChild(v), _.appendChild(document.createTextNode(" to save")), h.appendChild(_), m.appendChild(h);
			let y = document.createElement("div");
			y.className = "relative flex items-center";
			let b = document.createElement("input");
			b.id = "inputRenameTarget", b.type = "text", b.className = "w-full h-11 px-3 rounded-lg bg-surface-container-lowest font-mono-code text-[14px] text-on-surface font-semibold border-2 border-primary focus:ring-2 focus:ring-primary outline-none shadow-sm transition-all", b.value = n.targetName || n.suggestedName || n.name, b.addEventListener("input", (e) => {
				let t = e.target.value;
				n.targetName = t, this.updateTelemetry();
			}), b.addEventListener("keydown", (e) => {
				e.key === "Enter" && (e.preventDefault(), this.handleConfirmCurrentName(b.value));
			}), y.appendChild(b), m.appendChild(y), l.appendChild(m);
			let x = document.createElement("div");
			x.className = "flex flex-col gap-1.5 pt-2 border-t border-surface-container";
			let S = document.createElement("div");
			S.className = "flex items-center justify-between";
			let C = document.createElement("span");
			C.className = "font-label-sm text-secondary font-semibold flex items-center gap-1.5";
			let w = document.createElement("span");
			w.className = "material-symbols-outlined text-[15px] text-primary", w.textContent = "bolt", C.appendChild(w), C.appendChild(document.createTextNode("Quick 21-Shortcut Presets:")), S.appendChild(C);
			let T = document.createElement("span");
			T.className = "text-label-sm text-secondary font-mono-code text-[10px]", T.textContent = "Click to rename", S.appendChild(T), x.appendChild(S);
			let E = document.createElement("div");
			E.className = "grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-0.5", this.shortcuts21.forEach((e) => {
				let t = document.createElement("button");
				t.type = "button", t.className = "px-2 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-mono-code text-[11px] font-semibold border border-outline-variant/40 hover:border-primary/50 transition-all flex items-center gap-1 shadow-xs justify-center cursor-pointer";
				let n = document.createElement("span");
				n.className = "px-1 py-0.2 rounded bg-surface-container-highest text-secondary text-[9px] font-bold", n.textContent = e.code, t.appendChild(n);
				let r = document.createElement("span");
				r.className = "truncate", r.textContent = e.label, t.appendChild(r), t.addEventListener("click", () => {
					this.applyShortcutToCurrent(e);
				}), E.appendChild(t);
			}), x.appendChild(E), l.appendChild(x), e.appendChild(l), t.appendChild(e);
		}
		let r = this.state.files.filter((e, t) => t > this.state.currentIndex && !e.isRenamed && !e.isKept);
		if (r.length > 0) {
			let e = document.createElement("div");
			e.className = "flex items-center justify-between px-2 py-1 rounded bg-surface-container border border-outline-variant/40 text-[11px] font-mono-code text-secondary shrink-0";
			let n = document.createElement("div");
			n.className = "flex items-center gap-1.5 text-primary font-semibold";
			let i = document.createElement("span");
			i.className = "material-symbols-outlined text-[15px]", i.textContent = "north", n.appendChild(i), n.appendChild(document.createTextNode("UPCOMING QUEUE")), e.appendChild(n);
			let a = document.createElement("span");
			a.className = "text-[10px] text-secondary font-medium uppercase", a.textContent = `${r.length} files waiting`, e.appendChild(a), t.appendChild(e);
			let o = document.createElement("div");
			o.className = "flex flex-col gap-1.5 shrink-0", r.slice(0, 10).forEach((e) => {
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
				s.className = "font-mono-code text-[12px] text-on-surface font-semibold truncate", s.textContent = e.targetName || e.suggestedName || e.name, a.appendChild(s);
				let c = document.createElement("span");
				c.className = "text-[10px] font-mono-code text-secondary truncate", c.textContent = e.name, a.appendChild(c), r.appendChild(a), n.appendChild(r);
				let l = document.createElement("span");
				l.className = e.isMatched ? "px-1.5 py-0.5 rounded font-mono-code text-[9px] bg-tertiary-fixed text-on-tertiary-fixed font-bold uppercase shrink-0" : "px-1.5 py-0.5 rounded font-mono-code text-[9px] bg-surface-variant text-on-surface-variant font-bold uppercase shrink-0", l.textContent = e.docType || "Select", n.appendChild(l), o.appendChild(n);
			}), t.appendChild(o);
		}
		let i = this.state.files.filter((e) => e.isRenamed || e.isKept);
		if (i.length > 0) {
			let e = document.createElement("div");
			e.className = "mt-auto pt-2 flex flex-col gap-1.5 shrink-0";
			let n = document.createElement("div");
			n.className = "flex items-center justify-between px-2 py-1 rounded bg-emerald-100 border border-emerald-300 text-[11px] font-mono-code text-emerald-900";
			let r = document.createElement("div");
			r.className = "flex items-center gap-1.5 font-bold";
			let a = document.createElement("span");
			a.className = "material-symbols-outlined text-[15px] text-tertiary", a.textContent = "south", r.appendChild(a), r.appendChild(document.createTextNode("COMPLETED FILES")), n.appendChild(r);
			let o = document.createElement("span");
			o.className = "text-[10px] font-semibold text-tertiary uppercase", o.textContent = `${i.length} finished`, n.appendChild(o), e.appendChild(n), i.forEach((t) => {
				let n = document.createElement("article");
				n.className = "bg-surface-container-lowest rounded-xl shadow-xs px-space-md py-1.5 flex items-center justify-between gap-space-sm border border-emerald-300";
				let r = document.createElement("div");
				r.className = "flex items-center gap-2 min-w-0 flex-1";
				let i = document.createElement("span");
				i.className = "w-4 h-4 rounded-full bg-emerald-500 text-on-primary font-mono-code font-bold text-[9px] flex items-center justify-center shrink-0";
				let a = document.createElement("span");
				a.className = "material-symbols-outlined text-[11px]", a.textContent = "check", i.appendChild(a), r.appendChild(i);
				let o = document.createElement("span");
				o.className = "font-mono-code text-[11px] text-tertiary font-bold truncate", o.textContent = t.targetName, r.appendChild(o), n.appendChild(r);
				let s = document.createElement("span");
				s.className = "font-mono-code text-[10px] text-secondary shrink-0", s.textContent = `${(t.size / 1024).toFixed(0)} KB`, n.appendChild(s), e.appendChild(n);
			}), t.appendChild(e);
		}
		e.appendChild(t);
	}
	applyShortcutToCurrent(e) {
		let t = this.state.files[this.state.currentIndex];
		if (!t) return;
		let n = e.canonical, r = t.ext, i = E(n, this.state.studentName, this.state.settings?.groups, this.state.style), a = i.endsWith(r) ? i : `${i}${r}`, o = new Set(this.state.files.map((e) => e.targetName));
		o.delete(t.targetName);
		let s = x(a, t.name, o);
		t.targetName = s, t.docType = n, t.isMatched = !0, t.status = "matched", this.updateTelemetry(), this.renderQueue(), this.handleConfirmCurrentName(s);
	}
	handleConfirmCurrentName(e) {
		let t = this.state.files[this.state.currentIndex];
		if (!t) return;
		let n = D(e);
		if (n) {
			r.show("Invalid Filename", n, "error");
			return;
		}
		t.targetName = e, r.show("Target Updated", e, "info");
		let i = this.state.files.findIndex((e, t) => t > this.state.currentIndex && !e.isRenamed && !e.isKept);
		if (i !== -1) this.state.currentIndex = i;
		else {
			let e = this.state.files.findIndex((e) => !e.isRenamed && !e.isKept);
			e !== -1 && (this.state.currentIndex = e);
		}
		this.renderQueue(), this.renderCurrentPreview();
	}
	handleKeepOriginal() {
		let e = this.state.files[this.state.currentIndex];
		e && (e.targetName = e.name, e.isKept = !0, e.status = "kept", r.show("Kept Original", e.name, "info"), this.state.currentIndex < this.state.files.length - 1 && this.state.currentIndex++, this.updateTelemetry(), this.renderQueue(), this.renderCurrentPreview());
	}
	async handleRenameAll() {
		let e = this.state.files.filter((e) => !e.isRenamed && !e.isKept && e.targetName !== e.name);
		if (e.length === 0) {
			r.show("No Changes Needed", "All files are already named or kept.", "info");
			return;
		}
		for (let t of e) {
			let e = D(t.targetName);
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
			await O(this.state.folder, t, (e, t) => {
				console.log(`[Rename Progress] ${e}%: ${t}`);
			}), A.pushBatch(this.state.folder, t), e.forEach((e) => {
				e.name = e.targetName, e.isRenamed = !0, e.status = "renamed";
			}), r.show("Batch Complete!", `Successfully renamed ${t.length} files.`, "success"), this.updateTelemetry(), this.renderQueue(), this.renderCurrentPreview();
		} catch (e) {
			r.show("Rename Failed", e.message, "error");
		}
	}
	async handleUndo() {
		if (!A.canUndo()) {
			r.show("Undo Stack Empty", "No previous rename batch to undo.", "info");
			return;
		}
		let e = A.pop();
		r.show("Reverting Changes", `Restoring ${e.plan.length} files...`, "info");
		try {
			await k(e.dir, e.plan, (e, t) => {
				console.log(`[Undo Progress] ${e}%: ${t}`);
			}), e.plan.forEach((e) => {
				let t = this.state.files.find((t) => t.targetName === e.next || t.name === e.next);
				t && (t.name = e.old, t.targetName = e.old, t.isRenamed = !1, t.status = "pending");
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
		let e = N([{
			studentName: this.state.studentName || "Student",
			folderName: this.state.folder?.name || "Folder",
			summary: {
				evaluations: this.state.files.map((e) => ({
					rule: { name: e.docType || e.name },
					status: e.isMatched || e.isRenamed ? "green" : "missing",
					isLinked: !1
				})),
				foundCount: this.state.files.filter((e) => e.isMatched || e.isRenamed).length,
				missingCount: this.state.files.filter((e) => !e.isMatched && !e.isRenamed).length,
				totalRequired: this.state.files.length,
				percentComplete: Math.round(this.state.files.filter((e) => e.isMatched || e.isRenamed).length / this.state.files.length * 100),
				isReady: this.state.files.every((e) => e.isMatched || e.isRenamed),
				missingList: this.state.files.filter((e) => !e.isMatched && !e.isRenamed).map((e) => e.name)
			}
		}], this.state.files.map((e) => ({ name: e.docType || e.name })), "Admission Audit");
		j(`DocMitra_Audit_${(this.state.studentName || "Batch").replace(/\s+/g, "_")}.csv`, e), r.show("Audit Exported", "CSV report downloaded with UTF-8 BOM.", "success");
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
		let r = document.createElement("div");
		r.id = "previewContainerStage", r.className = "h-full max-h-[calc(100vh-175px)] aspect-[1/1.414] bg-surface-container-lowest rounded shadow-2xl p-space-md flex flex-col justify-between relative overflow-hidden select-text border border-outline-variant/40 shrink-0";
		let i = /\.(jpe?g|png|webp|bmp|gif)$/i.test(t.name), a = /\.pdf$/i.test(t.name);
		if (i && t.url) {
			let e = document.createElement("img");
			e.src = t.url, e.alt = t.name, e.className = "w-full h-full object-contain", r.appendChild(e);
		} else if (a && window.pdfjsLib && t.url) {
			let e = document.createElement("canvas");
			e.className = "w-full h-full object-contain", r.appendChild(e), window.pdfjsLib.getDocument(t.url).promise.then((t) => {
				t.getPage(1).then((t) => {
					let n = t.getViewport({ scale: 1.5 });
					e.height = n.height, e.width = n.width, t.render({
						canvasContext: e.getContext("2d"),
						viewport: n
					});
				});
			}).catch((e) => {
				console.warn("PDF.js render error:", e), this._renderDocumentInfoFallback(r, t);
			});
		} else this._renderDocumentInfoFallback(r, t);
		n.appendChild(r);
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
function J() {
	let e = new q();
	return e.init(), e;
}
// src/services/export-import-service.js
function Y(e) {
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
function X(e, t) {
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
var Z = class {
	constructor() {
		this.state = null, this.initialState = null, this.activeChecklist = "11th / 12th (FYJC / SYJC)";
	}
	init() {
		this.loadState(), this._bindButtons(), this.renderAll(), console.info("[DocMitra Settings] Settings UI manager initialized.");
	}
	loadState() {
		this.state = U(), this.initialState = JSON.parse(JSON.stringify(this.state));
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
				Y(this.state), r.show("Settings Exported", "Configuration JSON file downloaded.", "success");
			} catch (e) {
				r.show("Export Error", e.message, "error");
			}
		});
		let o = document.getElementById("btnTriggerImportJSON"), s = document.getElementById("inputImportSettingsJSON");
		o && s && (o.addEventListener("click", () => s.click()), s.addEventListener("change", async (e) => {
			let t = e.target.files?.[0];
			if (t) try {
				await X(t, this.state), K(this.state), this.initialState = JSON.parse(JSON.stringify(this.state)), this.renderAll(), r.show("Import Successful", "System configuration restored and verified.", "success");
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
			let u = document.createElement("div");
			u.className = "col-span-4 flex flex-col pr-space-sm";
			let d = document.createElement("span");
			d.className = "font-label-lg text-label-lg font-bold text-on-surface group-hover:text-primary transition-colors", d.textContent = t, u.appendChild(d);
			let f = document.createElement("span");
			f.className = "font-mono-code text-[10px] text-on-surface-variant", f.textContent = `TOKEN_${t.replace(/[^A-Z0-9]/gi, "_").toUpperCase()}`, u.appendChild(f), o.appendChild(u);
			let p = document.createElement("div");
			p.className = "col-span-2";
			let m = l.find((e) => e.outputName.toUpperCase() === t.toUpperCase()), h = m ? m.primaryShortcut : (n[0] || "DOC").toUpperCase().slice(0, 4), g = document.createElement("span");
			g.className = "px-2 py-1 bg-surface-container-high rounded text-on-surface font-mono-code text-[12px] font-bold shadow-2xs", g.textContent = h, p.appendChild(g), o.appendChild(p);
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
		let n = this.state.checklists || y;
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
		K(this.state), this.initialState = JSON.parse(JSON.stringify(this.state)), r.show("Settings Saved", "System rules updated and applied to workstation.", "success");
		let e = document.getElementById("settings-modal-overlay");
		e && e.classList.add("hidden"), document.body.style.overflow = "";
	}
	handleReset() {
		window.confirm("Reset all rules, shortcuts, and checklists to factory defaults?") && (this.state.groups = u(), this.state.checklists = JSON.parse(JSON.stringify(y)), K(this.state), this.initialState = JSON.parse(JSON.stringify(this.state)), this.renderAll(), r.show("Factory Defaults Restored", "All default rules loaded.", "info"));
	}
	handleDiscard() {
		this.state = JSON.parse(JSON.stringify(this.initialState)), this.renderAll(), r.show("Changes Discarded", "Reverted to previous configuration.", "info");
		let e = document.getElementById("settings-modal-overlay");
		e && e.classList.add("hidden"), document.body.style.overflow = "";
	}
};
function Q() {
	let e = new Z();
	return e.init(), e;
}
// src/ui/index.js
function $() {
	new n().init(), new i().init(), Q(), J(), a();
	let e = document.getElementById("themeToggleBtn");
	e && e.addEventListener("click", () => {
		document.documentElement.classList.toggle("dark");
		let e = document.documentElement.classList.contains("dark");
		r.show(e ? "Dark Theme Enabled" : "Light Theme Enabled", "UI Preference Updated", "info");
	}), console.info("[DocMitra] UI Shell & Modules initialized successfully.");
}
document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", $) : $();
export { $ as initAppShell };
