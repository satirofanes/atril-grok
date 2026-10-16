import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { _ as Eraser, a as Trash2, b as Copy, c as Redo2, d as PenLine, f as MousePointer2, g as Hand, h as Highlighter, l as Printer, m as List, n as Upload, o as StickyNote, p as Minus, r as Undo2, s as Search, t as X, u as Plus, v as Ellipsis, x as BookOpen, y as Download } from "../_libs/lucide-react.mjs";
import { a as object, i as number, n as array, o as string, r as literal, t as _enum } from "../_libs/zod.mjs";
import { a as DialogOverlay, i as DialogDescription, n as DialogClose, o as DialogPortal, r as DialogContent, s as DialogTitle, t as Dialog } from "../_libs/@radix-ui/react-dialog+[...].mjs";
import { a as DropdownMenuTrigger, i as DropdownMenuPortal, n as DropdownMenuContent, r as DropdownMenuItem, t as DropdownMenu } from "../_libs/@radix-ui/react-dropdown-menu+[...].mjs";
import { a as TooltipTrigger, i as TooltipProvider, n as TooltipContent, r as TooltipPortal, t as Tooltip } from "../_libs/@radix-ui/react-tooltip+[...].mjs";
import { n as toast, t as Toaster } from "../_libs/sonner.mjs";
import { t as create } from "../_libs/zustand.mjs";
import { t as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-D2ftEn6v.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var KIND_LABEL = {
	pdf: "PDF",
	docx: "Word",
	odt: "OpenDocument",
	epub: "EPUB",
	fb2: "FB2",
	pptx: "PowerPoint",
	xlsx: "Hoja de cálculo",
	text: "Texto",
	html: "HTML",
	md: "Markdown",
	rtf: "RTF",
	csv: "CSV"
};
var INK_COLORS = [
	{
		id: "ink",
		label: "Tinta",
		hex: "#1c1915"
	},
	{
		id: "blue",
		label: "Azul",
		hex: "#1e4d8c"
	},
	{
		id: "wax",
		label: "Lacre",
		hex: "#8f2d2d"
	},
	{
		id: "forest",
		label: "Bosque",
		hex: "#1e6b45"
	}
];
var MARKER_COLORS = [
	{
		id: "amber",
		label: "Ámbar",
		hex: "#e6b325"
	},
	{
		id: "rose",
		label: "Rosa",
		hex: "#e39aaf"
	},
	{
		id: "moss",
		label: "Musgo",
		hex: "#7dbe6a"
	}
];
function emptyAnno() {
	return {
		version: 1,
		strokes: [],
		notes: [],
		quotes: []
	};
}
function allMarks(anno) {
	return [
		...anno.strokes,
		...anno.notes,
		...anno.quotes
	];
}
function markY(mark) {
	if (mark.kind === "note" || mark.kind === "quote") return mark.y;
	return mark.points[0]?.y ?? 0;
}
function inkHex(id) {
	return INK_COLORS.find((c) => c.id === id)?.hex ?? INK_COLORS[0].hex;
}
function markerHex(id) {
	return MARKER_COLORS.find((c) => c.id === id)?.hex ?? MARKER_COLORS[0].hex;
}
function highlightName(hex) {
	return `atril-${MARKER_COLORS.find((c) => c.hex === hex)?.id ?? "amber"}`;
}
function sizeFromStep(step, kind) {
	const base = .0018 + step * .0014;
	return kind === "marker" ? base * 2.6 : base;
}
var pointSchema = object({
	x: number().finite(),
	y: number().finite(),
	p: number().finite()
});
var strokeSchema = object({
	id: string().min(1),
	kind: _enum(["pen", "marker"]),
	page: number().int().nonnegative(),
	color: string().min(1),
	size: number().positive(),
	points: array(pointSchema).min(1).max(8e3),
	clave: string().min(1).max(40),
	comment: string().max(8e3),
	createdAt: number()
});
var noteSchema = object({
	id: string().min(1),
	kind: literal("note"),
	page: number().int().nonnegative(),
	y: number().finite(),
	color: string().min(1),
	clave: string().min(1).max(40),
	comment: string().max(8e3),
	createdAt: number()
});
var quoteSchema = object({
	id: string().min(1),
	kind: literal("quote"),
	page: number().int().nonnegative(),
	y: number().finite(),
	color: string().min(1),
	clave: string().min(1).max(40),
	comment: string().max(8e3),
	quote: string().min(1).max(4e3),
	createdAt: number()
});
var annoSchema = object({
	version: literal(1).optional(),
	strokes: array(strokeSchema).max(4e3),
	notes: array(noteSchema).max(4e3),
	quotes: array(quoteSchema).max(4e3)
});
var exportSchema = annoSchema.extend({
	atril: literal(1),
	document: string().optional()
});
function normalizeAnno(raw) {
	const parsed = annoSchema.safeParse(raw);
	if (!parsed.success) return {
		version: 1,
		strokes: [],
		notes: [],
		quotes: []
	};
	return {
		version: 1,
		strokes: parsed.data.strokes,
		notes: parsed.data.notes,
		quotes: parsed.data.quotes
	};
}
var PREFIX = {
	pen: "P",
	marker: "S",
	note: "N",
	quote: "C"
};
function nextClave(kind, anno) {
	const prefix = PREFIX[kind];
	const taken = new Set(allMarks(anno).map((m) => m.clave));
	let n = 1;
	while (taken.has(`${prefix}-${String(n).padStart(3, "0")}`)) n += 1;
	return `${prefix}-${String(n).padStart(3, "0")}`;
}
function claveTaken(anno, clave, exceptId) {
	return allMarks(anno).some((m) => m.clave === clave && m.id !== exceptId);
}
var DB_NAME = "atril";
var DB_VERSION = 1;
var memMeta = /* @__PURE__ */ new Map();
var memFiles = /* @__PURE__ */ new Map();
var memAnnos = /* @__PURE__ */ new Map();
var persist = "idb";
var dbPromise = null;
function req(request) {
	return new Promise((resolve, reject) => {
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}
function openDb() {
	if (persist === "memory" || typeof indexedDB === "undefined") {
		persist = "memory";
		return Promise.resolve(null);
	}
	dbPromise ??= new Promise((resolve) => {
		try {
			const request = indexedDB.open(DB_NAME, DB_VERSION);
			request.onupgradeneeded = () => {
				const db = request.result;
				if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta", { keyPath: "id" });
				if (!db.objectStoreNames.contains("files")) db.createObjectStore("files", { keyPath: "id" });
				if (!db.objectStoreNames.contains("annos")) db.createObjectStore("annos", { keyPath: "id" });
			};
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => {
				persist = "memory";
				resolve(null);
			};
		} catch {
			persist = "memory";
			resolve(null);
		}
	});
	return dbPromise;
}
function peekBytes(id) {
	return memFiles.get(id);
}
async function loadLibrary() {
	const db = await openDb();
	if (!db) return [...memMeta.values()].sort((a, b) => b.addedAt - a.addedAt);
	const rows = await req(db.transaction("meta").objectStore("meta").getAll());
	memMeta.clear();
	for (const row of rows) memMeta.set(row.id, row);
	return [...memMeta.values()].sort((a, b) => b.addedAt - a.addedAt);
}
async function loadDoc(id) {
	const cached = memMeta.get(id);
	const bytesHit = memFiles.get(id);
	if (cached && bytesHit) return {
		meta: cached,
		bytes: bytesHit,
		anno: memAnnos.get(id) ?? emptyAnno()
	};
	const db = await openDb();
	if (!db) return null;
	const tx = db.transaction([
		"meta",
		"files",
		"annos"
	], "readonly");
	const meta = await req(tx.objectStore("meta").get(id));
	const file = await req(tx.objectStore("files").get(id));
	const annoRow = await req(tx.objectStore("annos").get(id));
	if (!meta || !file?.bytes) return null;
	const anno = normalizeAnno(annoRow?.anno);
	memMeta.set(id, meta);
	memFiles.set(id, file.bytes);
	memAnnos.set(id, anno);
	return {
		meta,
		bytes: file.bytes,
		anno
	};
}
async function putDoc(meta, bytes, anno) {
	memMeta.set(meta.id, meta);
	memFiles.set(meta.id, bytes);
	memAnnos.set(meta.id, anno);
	const db = await openDb();
	if (!db) return;
	await new Promise((resolve, reject) => {
		const tx = db.transaction([
			"meta",
			"files",
			"annos"
		], "readwrite");
		tx.objectStore("meta").put(meta);
		tx.objectStore("files").put({
			id: meta.id,
			bytes
		});
		tx.objectStore("annos").put({
			id: meta.id,
			anno
		});
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
}
async function saveAnno(id, anno) {
	memAnnos.set(id, anno);
	const db = await openDb();
	if (!db) return;
	await new Promise((resolve, reject) => {
		const tx = db.transaction("annos", "readwrite");
		tx.objectStore("annos").put({
			id,
			anno
		});
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
}
async function deleteDocs(ids) {
	for (const id of ids) {
		memMeta.delete(id);
		memFiles.delete(id);
		memAnnos.delete(id);
	}
	const db = await openDb();
	if (!db || ids.length === 0) return;
	await new Promise((resolve, reject) => {
		const tx = db.transaction([
			"meta",
			"files",
			"annos"
		], "readwrite");
		for (const id of ids) {
			tx.objectStore("meta").delete(id);
			tx.objectStore("files").delete(id);
			tx.objectStore("annos").delete(id);
		}
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
}
var loader = null;
var cache = /* @__PURE__ */ new Map();
function loadPdfjs() {
	if (typeof window === "undefined") return Promise.reject(/* @__PURE__ */ new Error("El visor PDF solo está disponible en el navegador."));
	loader ??= (async () => {
		const pdfjs = await import("../_libs/pdfjs-dist.mjs").then((n) => n.t);
		const worker = await import("./pdf.worker.min-DMv0gVyV.mjs");
		pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
		return pdfjs;
	})();
	return loader;
}
async function openPdf(id, bytes) {
	const existing = cache.get(id);
	if (existing) return existing;
	const pending = (async () => {
		return (await loadPdfjs()).getDocument({ data: new Uint8Array(bytes.slice(0)) }).promise;
	})();
	cache.set(id, pending);
	try {
		return await pending;
	} catch (error) {
		cache.delete(id);
		throw error;
	}
}
async function releasePdf(id) {
	const pending = cache.get(id);
	cache.delete(id);
	if (!pending) return;
	try {
		const pdf = await pending;
		await pdf.cleanup();
		await pdf.loadingTask.destroy();
	} catch {}
}
async function countPdfPages(bytes) {
	const pdf = await (await loadPdfjs()).getDocument({ data: new Uint8Array(bytes.slice(0)) }).promise;
	const count = pdf.numPages;
	await pdf.cleanup();
	await pdf.loadingTask.destroy();
	return count;
}
function escapeHtml(value) {
	return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function decodeText(bytes) {
	return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}
var ALLOWED = /* @__PURE__ */ new Set([
	"P",
	"H1",
	"H2",
	"H3",
	"H4",
	"H5",
	"H6",
	"UL",
	"OL",
	"LI",
	"BLOCKQUOTE",
	"EM",
	"STRONG",
	"B",
	"I",
	"U",
	"A",
	"BR",
	"SPAN",
	"DIV",
	"IMG",
	"TABLE",
	"THEAD",
	"TBODY",
	"TR",
	"TH",
	"TD",
	"CODE",
	"PRE",
	"HR",
	"SUP",
	"SUB",
	"FIGURE",
	"FIGCAPTION",
	"SECTION",
	"ARTICLE",
	"SMALL"
]);
function sanitizeHtml(html) {
	if (typeof DOMParser === "undefined") return "";
	const doc = new DOMParser().parseFromString(`<div id="atril-san">${html}</div>`, "text/html");
	const source = doc.getElementById("atril-san");
	if (!source) return "";
	const holder = doc.createElement("div");
	appendClean(source, holder);
	return holder.innerHTML;
}
function appendClean(source, target) {
	for (const child of [...source.childNodes]) {
		if (child.nodeType === Node.TEXT_NODE) {
			target.appendChild(child.cloneNode());
			continue;
		}
		if (child.nodeType !== Node.ELEMENT_NODE) continue;
		const el = child;
		if (el.tagName === "SCRIPT" || el.tagName === "STYLE" || el.tagName === "IFRAME" || el.tagName === "OBJECT" || el.tagName === "LINK" || el.tagName === "META") continue;
		if (!ALLOWED.has(el.tagName)) {
			appendClean(el, target);
			continue;
		}
		const copy = el.ownerDocument.createElement(el.tagName.toLowerCase());
		copyAttributes(el, copy);
		appendClean(el, copy);
		target.appendChild(copy);
	}
}
function copyAttributes(source, target) {
	for (const attr of [...source.attributes]) {
		const name = attr.name.toLowerCase();
		const value = attr.value.trim();
		if (name.startsWith("on") || name === "style") continue;
		if (target.tagName === "A" && name === "href" && /^(https?:|mailto:)/i.test(value)) {
			target.setAttribute("href", value);
			target.setAttribute("rel", "noreferrer");
			target.setAttribute("target", "_blank");
		} else if (target.tagName === "IMG" && name === "alt") target.setAttribute("alt", value.slice(0, 200));
		else if (target.tagName === "IMG" && name === "src" && /^(data:image\/(?:png|jpeg|jpg|gif|webp);base64,|blob:)/i.test(value)) target.setAttribute("src", value);
		else if ((name === "colspan" || name === "rowspan") && /^\d+$/.test(value)) target.setAttribute(name, value);
	}
}
function textToHtml(source) {
	const blocks = escapeHtml(source).trim().split(/\n{2,}/);
	if (blocks.length === 0 || blocks.length === 1 && blocks[0] === "") return "<p>Este archivo está vacío. Aun así puedes anotar la página.</p>";
	return blocks.map((block) => `<p>${block.replace(/\n/g, "<br>")}</p>`).join("");
}
function markdownToHtml(source) {
	const lines = escapeHtml(source).replace(/\r\n/g, "\n").split("\n");
	const out = [];
	let list = null;
	const close = () => {
		if (!list) return;
		out.push(list === "ul" ? "</ul>" : "</ol>");
		list = null;
	};
	const inline = (value) => value.replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/\*([^*]+)\*/g, "<em>$1</em>");
	for (const line of lines) {
		const heading = /^(#{1,4})\s+(.*)$/.exec(line);
		if (heading) {
			close();
			const level = heading[1].length;
			out.push(`<h${level}>${inline(heading[2])}</h${level}>`);
			continue;
		}
		const bullet = /^[-*]\s+(.*)$/.exec(line);
		if (bullet) {
			if (list !== "ul") {
				close();
				out.push("<ul>");
				list = "ul";
			}
			out.push(`<li>${inline(bullet[1])}</li>`);
			continue;
		}
		const ordered = /^\d+\.\s+(.*)$/.exec(line);
		if (ordered) {
			if (list !== "ol") {
				close();
				out.push("<ol>");
				list = "ol";
			}
			out.push(`<li>${inline(ordered[1])}</li>`);
			continue;
		}
		if (!line.trim()) {
			close();
			continue;
		}
		close();
		if (line.startsWith("> ")) out.push(`<blockquote><p>${inline(line.slice(5))}</p></blockquote>`);
		else out.push(`<p>${inline(line)}</p>`);
	}
	close();
	return out.join("") || "<p>Este archivo está vacío. Aun así puedes anotar la página.</p>";
}
function rtfToText(rtf) {
	let value = rtf.replace(/\r\n/g, "\n");
	value = value.replace(/\\'([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)));
	value = value.replace(/\\u(-?\d+)\??/g, (_, raw) => {
		const code = Number(raw);
		return String.fromCharCode(code < 0 ? code + 65536 : code);
	});
	value = value.replace(/\\par[d]?/g, "\n");
	value = value.replace(/\\line/g, "\n");
	value = value.replace(/\\tab/g, "	");
	value = value.replace(/\{\\\*[^{}]*\}/g, "");
	value = value.replace(/\\[a-zA-Z]+-?\d* ?/g, "");
	value = value.replace(/[{}]/g, "");
	return value.replace(/\n{3,}/g, "\n\n").trim();
}
function splitHtmlToPages(html) {
	if (typeof DOMParser === "undefined") return [{
		title: "Documento",
		html
	}];
	const doc = new DOMParser().parseFromString(`<div id="atril-root">${html}</div>`, "text/html");
	const root = doc.getElementById("atril-root");
	if (!root) return [{
		title: "Documento",
		html
	}];
	const chunks = [];
	let title = "Documento";
	let nodes = [];
	const flush = () => {
		if (nodes.length === 0) return;
		chunks.push({
			title,
			nodes
		});
		nodes = [];
	};
	for (const node of [...root.childNodes]) {
		if (node.nodeType === Node.TEXT_NODE && !(node.textContent ?? "").trim()) continue;
		if (node.nodeType === Node.ELEMENT_NODE) {
			const el = node;
			if (el.tagName === "H1") {
				const text = el.textContent?.trim();
				if (text) title = text;
			}
			if (el.tagName === "H2") {
				if (nodes.length > 0) flush();
				title = el.textContent?.trim() || "Sección";
			}
		}
		nodes.push(node);
	}
	flush();
	if (chunks.length === 0) return [{
		title: "Documento",
		html: "<p>Documento vacío.</p>"
	}];
	return chunks.map((chunk) => {
		const wrap = doc.createElement("div");
		for (const node of chunk.nodes) wrap.appendChild(node);
		return {
			title: chunk.title,
			html: wrap.innerHTML
		};
	});
}
function parseCsv(text) {
	const rows = [];
	let row = [];
	let cell = "";
	let quoted = false;
	for (let i = 0; i < text.length; i += 1) {
		const char = text[i];
		if (quoted) {
			if (char === "\"") {
				if (text[i + 1] === "\"") {
					cell += "\"";
					i += 1;
				} else quoted = false;
			} else cell += char;
			continue;
		}
		if (char === "\"") quoted = true;
		else if (char === ",") {
			row.push(cell);
			cell = "";
		} else if (char === "\n") {
			row.push(cell);
			rows.push(row);
			row = [];
			cell = "";
		} else if (char !== "\r") cell += char;
	}
	row.push(cell);
	if (row.some((value) => value.length > 0)) rows.push(row);
	return rows;
}
var EXT = {
	pdf: "pdf",
	docx: "docx",
	odt: "odt",
	epub: "epub",
	fb2: "fb2",
	pptx: "pptx",
	xlsx: "xlsx",
	xls: "xlsx",
	ods: "xlsx",
	csv: "csv",
	txt: "text",
	text: "text",
	log: "text",
	json: "text",
	md: "md",
	markdown: "md",
	html: "html",
	htm: "html",
	rtf: "rtf"
};
function detectFile(name) {
	const ext = name.toLowerCase().split(".").pop() ?? "";
	if (ext === "doc") return { error: "El .doc antiguo no se puede abrir. Guárdalo como .docx." };
	if (ext === "ppt") return { error: "El .ppt antiguo no se puede abrir. Guárdalo como .pptx." };
	if (ext === "mobi" || ext === "azw" || ext === "azw3" || ext === "kfx") return { error: "MOBI y AZW suelen ir cifrados. Exporta un EPUB y ábrelo aquí." };
	const kind = EXT[ext];
	if (!kind) return { error: "Ese formato no está en el atril. Prueba PDF, Word, EPUB, FB2, PowerPoint, Excel o texto." };
	return { kind };
}
var EMPTY = {
	pages: [{
		type: "html",
		title: "Documento",
		html: "<p>No se pudo leer el archivo.</p>"
	}],
	warnings: [],
	dispose: () => void 0
};
async function parseDocument(kind, bytes) {
	switch (kind) {
		case "pdf": return parsePdf(bytes);
		case "docx": return parseDocx(bytes);
		case "odt": return parseOdt(bytes);
		case "epub": return parseEpub(bytes);
		case "fb2": return parseFb2(bytes);
		case "pptx": return parsePptx(bytes);
		case "xlsx": return parseSheet(bytes);
		case "csv": return {
			pages: [{
				type: "table",
				title: "Tabla",
				rows: parseCsv(decodeText(bytes))
			}],
			warnings: [],
			dispose: () => void 0
		};
		case "md": return htmlDoc(markdownToHtml(decodeText(bytes)));
		case "html": return htmlDoc(sanitizeHtml(decodeText(bytes)));
		case "rtf": return htmlDoc(textToHtml(rtfToText(decodeText(bytes))));
		case "text": return htmlDoc(textToHtml(decodeText(bytes)));
		default: return EMPTY;
	}
}
function htmlDoc(html, warnings = []) {
	const pages = splitHtmlToPages(html).map((page) => ({
		type: "html",
		title: page.title,
		html: page.html
	}));
	return {
		pages: pages.length > 0 ? pages : [{
			type: "html",
			title: "Documento",
			html: "<p>Documento vacío.</p>"
		}],
		warnings,
		dispose: () => void 0
	};
}
async function parsePdf(bytes) {
	const count = await countPdfPages(bytes);
	if (count < 1) throw new Error("El PDF no tiene páginas.");
	return {
		pages: Array.from({ length: count }, () => ({ type: "pdf" })),
		warnings: count > 400 ? ["Documento largo: las páginas se pintan al acercarte."] : [],
		dispose: () => void 0
	};
}
async function parseDocx(bytes) {
	const mod = await import("../_libs/mammoth+xmlbuilder.mjs").then((n) => /* @__PURE__ */ __toESM(n.t()));
	const mammoth = mod.default ?? mod;
	const result = await mammoth.convertToHtml({ arrayBuffer: bytes }, { convertImage: mammoth.images.imgElement(async (image) => {
		const base64 = await image.readAsBase64String();
		return { src: `data:${image.contentType};base64,${base64}` };
	}) });
	const warnings = result.messages.slice(0, 3).map((message) => message.message);
	return htmlDoc(sanitizeHtml(result.value), warnings);
}
function zipPath(base, href) {
	const raw = `${base}${href}`.split("#")[0]?.split("?")[0] ?? "";
	const parts = [];
	for (const part of raw.split(/[/\\]/)) {
		if (!part || part === ".") continue;
		if (part === "..") parts.pop();
		else parts.push(decodeURIComponent(part));
	}
	return parts.join("/");
}
function mimeFromName(path) {
	const ext = path.toLowerCase().split(".").pop();
	if (ext === "png") return "image/png";
	if (ext === "gif") return "image/gif";
	if (ext === "webp") return "image/webp";
	if (ext === "svg") return "image/svg+xml";
	return "image/jpeg";
}
async function parseOdt(bytes) {
	const { default: JSZip } = await import("../_libs/jszip+[...].mjs").then((n) => /* @__PURE__ */ __toESM(n.t()));
	const content = await (await JSZip.loadAsync(bytes)).file("content.xml")?.async("string");
	if (!content) throw new Error("El OpenDocument no tiene content.xml.");
	const doc = new DOMParser().parseFromString(content, "application/xml");
	const parts = [];
	for (const node of doc.getElementsByTagName("*")) {
		const name = node.localName;
		if (name !== "h" && name !== "p") continue;
		const parent = node.parentElement?.localName;
		if (parent === "p" || parent === "h") continue;
		const text = (node.textContent ?? "").replace(/\s+/g, " ").trim();
		if (!text) continue;
		parts.push(name === "h" ? `<h2>${escape(text)}</h2>` : `<p>${escape(text)}</p>`);
	}
	return htmlDoc(parts.join("") || "<p>El documento no tiene texto.</p>");
}
function escape(value) {
	return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
async function parseEpub(bytes) {
	const { default: JSZip } = await import("../_libs/jszip+[...].mjs").then((n) => /* @__PURE__ */ __toESM(n.t()));
	const zip = await JSZip.loadAsync(bytes);
	const urls = [];
	const dispose = () => {
		for (const url of urls) URL.revokeObjectURL(url);
	};
	try {
		const container = await zip.file("META-INF/container.xml")?.async("string");
		if (!container) throw new Error("El EPUB no tiene container.xml.");
		const rootFile = [...new DOMParser().parseFromString(container, "application/xml").getElementsByTagName("*")].find((node) => node.localName === "rootfile")?.getAttribute("full-path");
		if (!rootFile) throw new Error("El EPUB no indica el OPF.");
		const opf = await zip.file(rootFile)?.async("string");
		if (!opf) throw new Error("No se pudo leer el índice del EPUB.");
		const opfDoc = new DOMParser().parseFromString(opf, "application/xml");
		const base = rootFile.includes("/") ? rootFile.slice(0, rootFile.lastIndexOf("/") + 1) : "";
		const manifest = /* @__PURE__ */ new Map();
		for (const node of opfDoc.getElementsByTagName("*")) {
			if (node.localName !== "item") continue;
			const id = node.getAttribute("id");
			const href = node.getAttribute("href");
			if (!id || !href) continue;
			manifest.set(id, {
				href,
				type: node.getAttribute("media-type") ?? ""
			});
		}
		const spine = [];
		for (const node of opfDoc.getElementsByTagName("*")) {
			if (node.localName !== "itemref") continue;
			const idref = node.getAttribute("idref");
			if (idref) spine.push(idref);
		}
		const pages = [];
		const warnings = [];
		for (const id of spine) {
			if (pages.length >= 80) {
				warnings.push("Se muestran los primeros 80 capítulos.");
				break;
			}
			const item = manifest.get(id);
			if (!item) continue;
			if (!(item.type.includes("html") || /\.x?html?$/i.test(item.href))) continue;
			const path = zipPath(base, item.href);
			const raw = await zip.file(path)?.async("string");
			if (!raw) continue;
			const chapter = new DOMParser().parseFromString(raw, "text/html");
			const title = chapter.querySelector("h1, h2")?.textContent?.trim() || chapter.querySelector("title")?.textContent?.trim() || `Capítulo ${pages.length + 1}`;
			const dir = path.includes("/") ? path.slice(0, path.lastIndexOf("/") + 1) : "";
			for (const image of chapter.querySelectorAll("img")) {
				const src = image.getAttribute("src");
				if (!src || src.startsWith("data:") || src.startsWith("blob:")) continue;
				const file = zip.file(zipPath(dir, src));
				if (!file) continue;
				const rawBlob = await file.async("blob");
				const blob = rawBlob.type ? rawBlob : new Blob([rawBlob], { type: mimeFromName(zipPath(dir, src)) });
				const url = URL.createObjectURL(blob);
				urls.push(url);
				image.setAttribute("src", url);
			}
			const clean = sanitizeHtml(chapter.body?.innerHTML ?? "");
			if (!clean.trim()) continue;
			pages.push({
				type: "html",
				title,
				html: clean
			});
		}
		if (pages.length === 0) throw new Error("El EPUB no tiene capítulos legibles.");
		return {
			pages,
			warnings,
			dispose
		};
	} catch (error) {
		dispose();
		throw error;
	}
}
async function parseFb2(bytes) {
	const xml = decodeText(bytes);
	const doc = new DOMParser().parseFromString(xml, "application/xml");
	if (doc.querySelector("parsererror")) throw new Error("El FB2 no es un XML válido.");
	const parts = [];
	const bookTitle = [...doc.getElementsByTagName("*")].find((node) => node.localName === "book-title");
	if (bookTitle?.textContent?.trim()) parts.push(`<h1>${escape(bookTitle.textContent.trim())}</h1>`);
	const body = [...doc.getElementsByTagName("*")].find((node) => node.localName === "body");
	if (!body) throw new Error("El FB2 no tiene cuerpo.");
	const walk = (node) => {
		for (const child of [...node.children]) {
			const name = child.localName;
			if (name === "title") {
				const text = (child.textContent ?? "").replace(/\s+/g, " ").trim();
				if (text) parts.push(`<h2>${escape(text)}</h2>`);
			} else if (name === "p" || name === "subtitle" || name === "text-author") {
				const text = (child.textContent ?? "").replace(/\s+/g, " ").trim();
				if (text) parts.push(name === "subtitle" ? `<h3>${escape(text)}</h3>` : `<p>${escape(text)}</p>`);
			} else if (name === "section" || name === "body" || name === "epigraph" || name === "cite") walk(child);
		}
	};
	walk(body);
	return htmlDoc(parts.join("") || "<p>El libro no tiene texto.</p>");
}
async function parsePptx(bytes) {
	const { default: JSZip } = await import("../_libs/jszip+[...].mjs").then((n) => /* @__PURE__ */ __toESM(n.t()));
	const zip = await JSZip.loadAsync(bytes);
	const names = Object.keys(zip.files).filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name)).sort((a, b) => slideNumber(a) - slideNumber(b));
	if (names.length === 0) throw new Error("La presentación no tiene láminas.");
	const pages = [];
	for (const name of names) {
		const xml = await zip.file(name)?.async("string");
		if (!xml) continue;
		const lines = paragraphs(xml);
		if (lines.length === 0) pages.push({
			type: "slide",
			title: `Lámina ${pages.length + 1}`,
			lines: ["Lámina sin texto."]
		});
		else pages.push({
			type: "slide",
			title: lines[0] ?? "Lámina",
			lines: lines.slice(1)
		});
	}
	return {
		pages,
		warnings: [],
		dispose: () => void 0
	};
}
function slideNumber(path) {
	const match = /(\d+)\.xml$/.exec(path);
	return match ? Number(match[1]) : 0;
}
function paragraphs(xml) {
	const doc = new DOMParser().parseFromString(xml, "application/xml");
	const lines = [];
	for (const node of doc.getElementsByTagName("*")) {
		if (node.localName !== "p") continue;
		const bits = [];
		for (const child of node.getElementsByTagName("*")) if (child.localName === "t" && child.textContent) bits.push(child.textContent);
		const line = bits.join("").replace(/\s+/g, " ").trim();
		if (line) lines.push(line);
	}
	return lines;
}
async function parseSheet(bytes) {
	const XLSX = await import("../_libs/xlsx.mjs").then((n) => n.t);
	const book = XLSX.read(bytes, { type: "array" });
	if (book.SheetNames.length === 0) throw new Error("El libro no tiene hojas.");
	return {
		pages: book.SheetNames.slice(0, 30).map((name) => {
			const sheet = book.Sheets[name];
			return {
				type: "table",
				title: name,
				rows: (sheet ? XLSX.utils.sheet_to_json(sheet, {
					header: 1,
					raw: false,
					defval: ""
				}) : []).map((row) => Array.isArray(row) ? row.map((cell) => String(cell ?? "")) : [])
			};
		}),
		warnings: book.SheetNames.length > 30 ? ["Se muestran las primeras 30 hojas."] : [],
		dispose: () => void 0
	};
}
var SAMPLE_ESSAY_ID = "sample-cuaderno";
var SAMPLE_PDF_ID = "sample-informe";
var QUOTE = "el río se movió ocho metros en una década";
function essayHtml() {
	return `
<h1>Cuaderno del río falso</h1>
<blockquote>Informe para revisión. No es un mapa: es la discusión de un mapa. Cada afirmación pide marca, clave y nota.</blockquote>
<p>En el verano de 1926 la comisión de límites caminó la ribera norte con un teodolito prestado y un cuaderno que se mojó dos veces. El plano que todavía cita el archivo municipal dibuja un meandro donde los vecinos recuerdan una playa recta. La discrepancia no es un adorno: decide de quién es el álamo, y con el álamo el derecho de paso.</p>
<p>Quien revise este texto debería marcar, no asentir. La frase más frágil es esta: ${QUOTE}. No hay hito, no hay año de la medición anterior, no hay nombre de quien sostuvo la mira. Si la cifra se queda, tiene que ganar una fuente o salir del párrafo.</p>
<h2>La orilla que no coincide</h2>
<p>El plano 14-B es una heliográfica sin escala legible en el margen inferior. Aun así el texto lo trata como si fuera una medición. Hay una diferencia entre recordar una playa y demostrar que el meandro no existía. La primera cabe en una nota. La segunda exige la foja.</p>
<p>Elena Varela escribe en septiembre de 1927 sobre el álamo y el camino de las vacas. No menciona metros ni meandro. Fundir su carta con el parte del barquero produce un testimonio único que en realidad son dos. O se separan, o se declara por qué se funden.</p>
<h2>Tres correcciones</h2>
<p>Primera. El cierre dice que el plano municipal queda corregido. No queda. Queda cuestionado. Corregir es otro documento, con firma y con fecha.</p>
<p>Segunda. «Comisión» no es un autor. Hace falta el nombre de quien firmó el acta del 12 de agosto, foja 4, donde consta la lluvia y no consta ninguna cifra.</p>
<p>Tercera. El derecho de paso no se deduce del álamo. Se deduce de quién lo plantó, o de una servidumbre escrita. Hoy el párrafo salta de un árbol a un derecho. El salto debe verse.</p>
<h2>Cómo quiero las marcas</h2>
<p>Cada objeción lleva una clave. No un garabato huérfano: una clave que se pueda citar en la carta al archivo. P para la pluma, S para el subrayado, N para la nota al margen, C cuando la cita queda iluminada en el propio texto.</p>
<p>Si la clave automática no sirve, se cambia. REV-12 dice más que un número cuando la nota va a salir del cuaderno. La pluma es para pensar encima del papel. El marcador es para lo que no puede quedarse como está. La nota al margen es la frase que el texto todavía no se atreve a decir.</p>
<h2>Lo que sí está en el archivo</h2>
<ul>
<li>Acta de la comisión, 12 de agosto de 1926, foja 4. Menciona lluvia, no metros.</li>
<li>Carta de Elena Varela, septiembre de 1927. Habla del álamo, no del meandro.</li>
<li>Plano 14-B, copia heliográfica, sin escala legible.</li>
</ul>
<p>Hasta que esas tres piezas se citen con foja, los ocho metros son una hipótesis, no un hallazgo. Anótalo así.</p>
`.trim();
}
function encode(text) {
	const bytes = new TextEncoder().encode(text);
	return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}
function buildEssayRecord() {
	const html = essayHtml();
	const pages = splitHtmlToPages(sanitizeHtml(html));
	let page = 0;
	pages.forEach((item, index) => {
		if (item.html.includes("ocho metros")) page = index;
	});
	const now = Date.now();
	const anno = {
		version: 1,
		strokes: [],
		notes: [{
			id: "seed-note-1",
			kind: "note",
			page,
			y: .72,
			color: "#8f2d2d",
			clave: "N-001",
			comment: "Pedir la foja 4 antes de aceptar el meandro. La lluvia consta; los metros, no.",
			createdAt: now
		}],
		quotes: [{
			id: "seed-quote-1",
			kind: "quote",
			page,
			y: .62,
			color: "#e6b325",
			clave: "C-001",
			comment: "Ocho metros: bajar a hipótesis o citar la medición. Hoy no hay hito.",
			quote: QUOTE,
			createdAt: now
		}]
	};
	return {
		meta: {
			id: SAMPLE_ESSAY_ID,
			name: "Cuaderno del río falso.html",
			kind: "html",
			pageCount: Math.max(1, pages.length),
			addedAt: now - 2e3
		},
		bytes: encode(html),
		anno
	};
}
async function buildSamplePdf() {
	const { PDFDocument, StandardFonts, rgb } = await import("../_libs/pdf-lib.mjs").then((n) => n.t);
	const doc = await PDFDocument.create();
	const font = await doc.embedFont(StandardFonts.TimesRoman);
	const bold = await doc.embedFont(StandardFonts.TimesRomanBold);
	doc.setTitle("Informe de campo");
	doc.setAuthor("Atril");
	const ink = rgb(.11, .1, .08);
	const wax = rgb(.56, .18, .18);
	const drawPage = (title, paragraphs) => {
		const page = doc.addPage([595.28, 841.89]);
		let y = 780;
		page.drawText(title, {
			x: 64,
			y,
			size: 20,
			font: bold,
			color: ink
		});
		y -= 18;
		page.drawText("Cuaderno 4  ·  ribera norte", {
			x: 64,
			y,
			size: 11,
			font,
			color: wax
		});
		y -= 36;
		for (const paragraph of paragraphs) {
			const lines = wrapText(paragraph, font, 12, 460);
			for (const line of lines) {
				if (y < 72) return;
				page.drawText(line, {
					x: 64,
					y,
					size: 12,
					font,
					color: ink
				});
				y -= 18;
			}
			y -= 10;
		}
	};
	drawPage("Informe de campo", [
		"Se revisa el plano 14-B junto con el acta del 12 de agosto de 1926. El plano dibuja un meandro. Los vecinos describen una playa recta. El cuaderno de la comisión se mojó y varias cifras quedaron ilegibles.",
		"No anotar todavía una distancia. La única medida que circula, ocho metros, no tiene hito ni nombre de quien midió. Hasta entonces el meandro es una hipótesis.",
		"Este PDF es una hoja de trabajo: la pluma, el marcador y la goma caen encima de la página. Cada trazo recibe una clave para citarlo después."
	]);
	drawPage("Pendientes", [
		"1. Pedir al archivo la foja 4 del acta. Confirmar que habla de lluvia y no de metros.",
		"2. Separar la carta de Elena Varela del parte del barquero. Son dos voces.",
		"3. No afirmar que el plano queda corregido. Queda cuestionado.",
		"4. Si una marca importa para la carta, cambiar su clave automática por algo citable, por ejemplo REV-12."
	]);
	const saved = await doc.save();
	const bytes = saved.buffer.slice(saved.byteOffset, saved.byteOffset + saved.byteLength);
	return {
		meta: {
			id: SAMPLE_PDF_ID,
			name: "Informe de campo.pdf",
			kind: "pdf",
			pageCount: 2,
			addedAt: Date.now()
		},
		bytes
	};
}
function wrapText(text, font, size, maxWidth) {
	const words = text.split(/\s+/);
	const lines = [];
	let line = "";
	for (const word of words) {
		const next = line ? `${line} ${word}` : word;
		if (line && font.widthOfTextAtSize(next, size) > maxWidth) {
			lines.push(line);
			line = word;
		} else line = next;
	}
	if (line) lines.push(line);
	return lines;
}
var SEED_KEY = "atril-seed";
var PREFS_KEY = "atril-prefs";
var ACTIVE_KEY = "atril-active";
var PDF_FLAG = "atril-pdf-seeded";
var SEED_VERSION = "1";
var parsedCache = /* @__PURE__ */ new Map();
function cachedParsed(id) {
	return parsedCache.get(id);
}
function rememberParsed(id, doc) {
	const previous = parsedCache.get(id);
	if (previous && previous !== doc) previous.dispose();
	parsedCache.set(id, doc);
}
function forgetParsed(id) {
	parsedCache.get(id)?.dispose();
	parsedCache.delete(id);
	releasePdf(id);
}
var bootOnce = null;
function readPrefs() {
	try {
		const raw = localStorage.getItem(PREFS_KEY);
		if (!raw) return {};
		const data = JSON.parse(raw);
		if (data.tool && ![
			"pen",
			"marker",
			"note",
			"select",
			"eraser",
			"hand"
		].includes(data.tool)) delete data.tool;
		return data;
	} catch {
		return {};
	}
}
function writePrefs(state) {
	try {
		const prefs = {
			tool: state.tool,
			inkId: state.inkId,
			markerId: state.markerId,
			sizeStep: state.sizeStep,
			zoom: state.zoom,
			showClaves: state.showClaves
		};
		localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
		if (state.activeId) localStorage.setItem(ACTIVE_KEY, state.activeId);
	} catch {}
}
function withHistory(state, anno) {
	return {
		anno,
		past: [...state.past, state.anno].slice(-40),
		future: []
	};
}
function patchMark(anno, id, patch) {
	return {
		version: 1,
		strokes: anno.strokes.map((mark) => mark.id === id ? {
			...mark,
			...patch,
			kind: mark.kind
		} : mark),
		notes: anno.notes.map((mark) => mark.id === id ? {
			...mark,
			...patch,
			kind: "note"
		} : mark),
		quotes: anno.quotes.map((mark) => mark.id === id ? {
			...mark,
			...patch,
			kind: "quote"
		} : mark)
	};
}
function patchEverywhere(state, id, patch) {
	return {
		anno: patchMark(state.anno, id, patch),
		past: state.past.map((anno) => patchMark(anno, id, patch)),
		future: state.future.map((anno) => patchMark(anno, id, patch))
	};
}
async function ensurePdfSample(set, get) {
	try {
		if (localStorage.getItem(PDF_FLAG) === "1") return;
		if (get().docs.some((doc) => doc.id === "sample-informe")) {
			localStorage.setItem(PDF_FLAG, "1");
			return;
		}
		const pdf = await buildSamplePdf();
		await putDoc(pdf.meta, pdf.bytes, emptyAnno());
		localStorage.setItem(PDF_FLAG, "1");
		set({ docs: [pdf.meta, ...get().docs.filter((doc) => doc.id !== SAMPLE_PDF_ID)] });
	} catch {}
}
var useStudio = create((set, get) => ({
	booted: false,
	bootError: null,
	busy: null,
	docs: [],
	activeId: null,
	anno: emptyAnno(),
	past: [],
	future: [],
	selectedId: null,
	indexOpen: false,
	libraryOpen: false,
	helpOpen: false,
	focusId: null,
	tool: "pen",
	inkId: "ink",
	markerId: "amber",
	sizeStep: 3,
	zoom: 1,
	showClaves: true,
	boot: () => {
		bootOnce ??= (async () => {
			try {
				const prefs = readPrefs();
				set({
					...prefs,
					zoom: clampZoom(prefs.zoom ?? 1),
					sizeStep: clampStep(prefs.sizeStep ?? 3)
				});
				let metas = await loadLibrary();
				if (localStorage.getItem(SEED_KEY) !== SEED_VERSION) {
					forgetParsed(SAMPLE_ESSAY_ID);
					await deleteDocs([SAMPLE_ESSAY_ID]);
					const essay = buildEssayRecord();
					await putDoc(essay.meta, essay.bytes, essay.anno);
					localStorage.setItem(SEED_KEY, SEED_VERSION);
					metas = [essay.meta, ...(await loadLibrary()).filter((doc) => doc.id !== SAMPLE_ESSAY_ID)];
				}
				const preferred = localStorage.getItem(ACTIVE_KEY);
				const active = metas.find((doc) => doc.id === preferred) ?? metas[0] ?? null;
				if (active) {
					const full = await loadDoc(active.id);
					set({
						booted: true,
						docs: metas,
						activeId: active.id,
						anno: full?.anno ?? emptyAnno(),
						bootError: null
					});
					writePrefs(get());
				} else set({
					booted: true,
					docs: metas,
					activeId: null,
					anno: emptyAnno()
				});
				ensurePdfSample(set, get);
			} catch (error) {
				set({
					booted: true,
					bootError: error instanceof Error ? error.message : "No se pudo abrir la biblioteca."
				});
			}
		})();
		return bootOnce;
	},
	openDoc: async (id) => {
		const full = await loadDoc(id);
		if (!full) throw new Error("No encuentro ese documento.");
		set({
			activeId: id,
			anno: full.anno,
			past: [],
			future: [],
			selectedId: null,
			libraryOpen: false
		});
		writePrefs(get());
	},
	importFiles: async (files) => {
		try {
			for (const file of files) {
				if (file.size > 62914560) throw new Error(`${file.name} supera 60 MB.`);
				const detected = detectFile(file.name);
				if ("error" in detected) throw new Error(detected.error);
				set({ busy: `Leyendo ${file.name}…` });
				const bytes = await file.arrayBuffer();
				const parsed = await parseDocument(detected.kind, bytes);
				const meta = {
					id: crypto.randomUUID(),
					name: file.name,
					kind: detected.kind,
					pageCount: parsed.pages.length,
					addedAt: Date.now()
				};
				rememberParsed(meta.id, parsed);
				await putDoc(meta, bytes, emptyAnno());
				set({
					docs: [meta, ...get().docs.filter((doc) => doc.id !== meta.id)],
					activeId: meta.id,
					anno: emptyAnno(),
					past: [],
					future: [],
					selectedId: null,
					libraryOpen: false
				});
				writePrefs(get());
			}
		} finally {
			set({ busy: null });
		}
	},
	removeDoc: async (id) => {
		await deleteDocs([id]);
		forgetParsed(id);
		const docs = get().docs.filter((doc) => doc.id !== id);
		if (get().activeId !== id) {
			set({ docs });
			return;
		}
		const next = docs[0];
		if (!next) {
			set({
				docs,
				activeId: null,
				anno: emptyAnno(),
				past: [],
				future: [],
				selectedId: null
			});
			return;
		}
		const full = await loadDoc(next.id);
		set({
			docs,
			activeId: next.id,
			anno: full?.anno ?? emptyAnno(),
			past: [],
			future: [],
			selectedId: null
		});
		writePrefs(get());
	},
	restoreSamples: async () => {
		localStorage.removeItem(PDF_FLAG);
		await deleteDocs([SAMPLE_ESSAY_ID, SAMPLE_PDF_ID]);
		const essay = buildEssayRecord();
		await putDoc(essay.meta, essay.bytes, essay.anno);
		localStorage.setItem(SEED_KEY, SEED_VERSION);
		const pdf = await buildSamplePdf();
		await putDoc(pdf.meta, pdf.bytes, emptyAnno());
		localStorage.setItem(PDF_FLAG, "1");
		set({
			docs: await loadLibrary(),
			activeId: essay.meta.id,
			anno: essay.anno,
			past: [],
			future: [],
			selectedId: null,
			libraryOpen: false
		});
		writePrefs(get());
	},
	setTool: (tool) => {
		set({ tool });
		writePrefs(get());
	},
	setInkId: (inkId) => {
		set({
			inkId,
			tool: "pen"
		});
		writePrefs(get());
	},
	setMarkerId: (markerId) => {
		set({
			markerId,
			tool: "marker"
		});
		writePrefs(get());
	},
	setSizeStep: (sizeStep) => {
		set({ sizeStep: clampStep(sizeStep) });
		writePrefs(get());
	},
	setZoom: (zoom) => {
		set({ zoom: clampZoom(zoom) });
		writePrefs(get());
	},
	setShowClaves: (showClaves) => {
		set({ showClaves });
		writePrefs(get());
	},
	setIndexOpen: (indexOpen) => set({ indexOpen }),
	setLibraryOpen: (libraryOpen) => set({ libraryOpen }),
	setHelpOpen: (helpOpen) => set({ helpOpen }),
	select: (selectedId) => set({
		selectedId,
		indexOpen: selectedId ? true : get().indexOpen
	}),
	clearFocus: () => set({ focusId: null }),
	commitStroke: (draft) => {
		const state = get();
		const stroke = {
			...draft,
			id: crypto.randomUUID(),
			clave: nextClave(draft.kind, state.anno),
			comment: "",
			createdAt: Date.now()
		};
		set({ ...withHistory(state, {
			...state.anno,
			strokes: [...state.anno.strokes, stroke]
		}) });
	},
	addNote: (page, y, comment = "") => {
		const state = get();
		const note = {
			id: crypto.randomUUID(),
			kind: "note",
			page,
			y,
			color: "#8f2d2d",
			clave: nextClave("note", state.anno),
			comment: comment.slice(0, 8e3),
			createdAt: Date.now()
		};
		const narrow = typeof window !== "undefined" && window.innerWidth < 1024;
		set({
			...withHistory(state, {
				...state.anno,
				notes: [...state.anno.notes, note]
			}),
			selectedId: note.id,
			focusId: note.id,
			indexOpen: narrow ? true : state.indexOpen
		});
	},
	addQuote: (page, y, quote) => {
		const text = quote.trim();
		if (text.length < 2) return;
		const state = get();
		const mark = {
			id: crypto.randomUUID(),
			kind: "quote",
			page,
			y,
			color: markerHex(state.markerId),
			clave: nextClave("quote", state.anno),
			comment: "",
			quote: text.slice(0, 2e3),
			createdAt: Date.now()
		};
		set({
			...withHistory(state, {
				...state.anno,
				quotes: [...state.anno.quotes, mark]
			}),
			selectedId: mark.id,
			focusId: mark.id,
			indexOpen: true
		});
	},
	updateComment: (id, comment) => {
		set(patchEverywhere(get(), id, { comment: comment.slice(0, 8e3) }));
	},
	renameMark: (id, clave) => {
		const clean = clave.trim();
		if (!clean || clean.length > 40) return false;
		const state = get();
		if (claveTaken(state.anno, clean, id)) return false;
		set(patchEverywhere(state, id, { clave: clean }));
		return true;
	},
	recolorMark: (id, color) => set(patchEverywhere(get(), id, { color })),
	deleteMark: (id) => {
		const state = get();
		set({
			...withHistory(state, {
				version: 1,
				strokes: state.anno.strokes.filter((mark) => mark.id !== id),
				notes: state.anno.notes.filter((mark) => mark.id !== id),
				quotes: state.anno.quotes.filter((mark) => mark.id !== id)
			}),
			selectedId: state.selectedId === id ? null : state.selectedId
		});
	},
	eraseAt: (page, x, y, threshold, record) => {
		const state = get();
		const drop = new Set(state.anno.strokes.filter((stroke) => stroke.page === page && strokeNear(stroke, x, y, threshold)).map((stroke) => stroke.id));
		if (drop.size === 0) return;
		set({
			anno: {
				...state.anno,
				strokes: state.anno.strokes.filter((stroke) => !drop.has(stroke.id))
			},
			past: record ? [...state.past, state.anno].slice(-40) : state.past,
			future: record ? [] : state.future,
			selectedId: state.selectedId && drop.has(state.selectedId) ? null : state.selectedId
		});
	},
	undo: () => {
		const state = get();
		const previous = state.past[state.past.length - 1];
		if (!previous) return;
		set({
			anno: previous,
			past: state.past.slice(0, -1),
			future: [state.anno, ...state.future].slice(0, 40),
			selectedId: null
		});
	},
	redo: () => {
		const state = get();
		const next = state.future[0];
		if (!next) return;
		set({
			anno: next,
			future: state.future.slice(1),
			past: [...state.past, state.anno].slice(-40),
			selectedId: null
		});
	},
	replaceAnno: (anno) => {
		set({
			...withHistory(get(), anno),
			selectedId: null
		});
	},
	importAnnoFile: async (file) => {
		const data = JSON.parse(await file.text());
		const parsed = exportSchema.safeParse(data);
		if (!parsed.success) throw new Error("Ese archivo no es un índice de Atril.");
		get().replaceAnno(dedupe(normalizeAnno(parsed.data)));
	}
}));
function clampZoom(zoom) {
	if (!Number.isFinite(zoom)) return 1;
	return Math.min(1.8, Math.max(.7, zoom));
}
function clampStep(step) {
	if (!Number.isFinite(step)) return 3;
	return Math.min(8, Math.max(1, Math.round(step)));
}
function strokeNear(stroke, x, y, threshold) {
	return stroke.points.some((point, index) => {
		const next = stroke.points[index + 1] ?? point;
		const dx = next.x - point.x;
		const dy = next.y - point.y;
		const len = dx * dx + dy * dy;
		const t = len === 0 ? 0 : Math.min(1, Math.max(0, ((x - point.x) * dx + (y - point.y) * dy) / len));
		const px = point.x + t * dx;
		const py = point.y + t * dy;
		return Math.hypot(x - px, y - py) <= threshold;
	});
}
function dedupe(anno) {
	const seen = /* @__PURE__ */ new Set();
	const fix = (mark) => {
		let clave = mark.clave;
		while (seen.has(clave)) clave = `${clave}-2`;
		seen.add(clave);
		return clave === mark.clave ? mark : {
			...mark,
			clave
		};
	};
	return {
		version: 1,
		strokes: anno.strokes.map(fix),
		notes: anno.notes.map(fix),
		quotes: anno.quotes.map(fix)
	};
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function PaperDialog({ open, onOpenChange, title, description, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, { className: "fixed inset-0 z-50 bg-ink/40" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "fixed inset-x-3 top-14 z-50 max-h-sheet overflow-y-auto rounded-lg border border-line bg-folio p-5 shadow-folio focus:outline-none sm:inset-x-auto sm:left-1/2 sm:w-xl sm:-translate-x-1/2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
					className: "font-serif text-3xl leading-none",
					children: title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, {
					className: "mt-2 text-sm text-muted",
					children: description
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogClose, {
					className: "grid size-11 shrink-0 place-items-center rounded-md hover:bg-paper",
					"aria-label": "Cerrar",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" })
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4",
				children
			})]
		})] })
	});
}
function LibraryDialog({ onOpenFile }) {
	const open = useStudio((state) => state.libraryOpen);
	const setOpen = useStudio((state) => state.setLibraryOpen);
	const docs = useStudio((state) => state.docs);
	const activeId = useStudio((state) => state.activeId);
	const openDoc = useStudio((state) => state.openDoc);
	const removeDoc = useStudio((state) => state.removeDoc);
	const restore = useStudio((state) => state.restoreSamples);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PaperDialog, {
		open,
		onOpenChange: setOpen,
		title: "Biblioteca",
		description: "PDF, Word, OpenDocument, PowerPoint, Excel, EPUB, FB2, HTML, Markdown, RTF y texto.",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "mb-4 h-11 rounded-md bg-ink px-4 text-sm font-medium text-folio",
				onClick: onOpenFile,
				children: "Abrir archivo"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "divide-y divide-line border-y border-line",
				children: [docs.map((doc) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex items-center gap-2 py-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: cn("min-w-0 flex-1 py-2 text-left", doc.id === activeId && "text-wax"),
						onClick: () => void openDoc(doc.id),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block truncate font-medium",
							children: doc.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-xs text-muted",
							children: [
								KIND_LABEL[doc.kind],
								" · ",
								doc.pageCount,
								" ",
								doc.pageCount === 1 ? "página" : "páginas"
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "h-11 shrink-0 px-2 text-sm text-muted hover:text-wax",
						onClick: () => void removeDoc(doc.id),
						children: "Quitar"
					})]
				}, doc.id)), docs.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "py-4 text-sm text-muted",
					children: "No hay documentos guardados."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "mt-4 text-sm text-wax underline-offset-2 hover:underline",
				onClick: () => void restore(),
				children: "Reponer los documentos de muestra"
			})
		]
	});
}
function HelpDialog() {
	const open = useStudio((state) => state.helpOpen);
	const setOpen = useStudio((state) => state.setHelpOpen);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaperDialog, {
		open,
		onOpenChange: setOpen,
		title: "Cómo se anota",
		description: "Pluma, marcador y notas al margen, cada una con una clave para citarla.",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-4 text-sm leading-6 text-ink-soft",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
						className: "text-ink",
						children: "Pluma (P)"
					}),
					" traza tinta con la presión del lápiz.",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
						className: "text-ink",
						children: "Marcador (M)"
					}),
					" subraya. ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
						className: "text-ink",
						children: "Nota (N)"
					}),
					" ",
					"deja un comentario en el margen. ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
						className: "text-ink",
						children: "Selección (V)"
					}),
					" elige texto: al soltar aparecen Subrayar y Al margen. ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
						className: "text-ink",
						children: "Mano (H)"
					}),
					" desplaza la página.",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
						className: "text-ink",
						children: "Goma (E)"
					}),
					" levanta un trazo entero."
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Una tableta Wacom, o cualquier lápiz que el navegador reconozca, manda presión, inclinación y el extremo de goma. El botón lateral de la pluma también borra. El dedo se ignora un instante si la pluma acaba de tocar, para no manchar con la palma." }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Cada marca nace con una clave: P-001, S-001, N-001 o C-001. Puedes cambiarla por algo citable, como REV-12. El índice busca esa clave y salta al folio. También se copia, se exporta en JSON y, en un PDF, se incrusta al descargar la copia anotada." }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Deshacer es Ctrl+Z o Cmd+Z. Rehacer, Ctrl+Shift+Z. Supr elimina la marca seleccionada." })
			]
		})
	});
}
var FILTERS = [
	{
		id: "all",
		label: "Todas"
	},
	{
		id: "pen",
		label: "Pluma"
	},
	{
		id: "marker",
		label: "Marcador"
	},
	{
		id: "quote",
		label: "Citas"
	},
	{
		id: "note",
		label: "Notas"
	}
];
function IndexPanel() {
	const open = useStudio((state) => state.indexOpen);
	const setOpen = useStudio((state) => state.setIndexOpen);
	const anno = useStudio((state) => state.anno);
	const selectedId = useStudio((state) => state.selectedId);
	const select = useStudio((state) => state.select);
	const [query, setQuery] = (0, import_react.useState)("");
	const [filter, setFilter] = (0, import_react.useState)("all");
	const marks = (0, import_react.useMemo)(() => {
		const needle = query.trim().toLowerCase();
		return allMarks(anno).filter((mark) => filter === "all" ? true : mark.kind === filter).filter((mark) => {
			if (!needle) return true;
			return (mark.kind === "quote" ? `${mark.clave} ${mark.comment} ${mark.quote}` : `${mark.clave} ${mark.comment}`).toLowerCase().includes(needle);
		}).sort((a, b) => a.page - b.page || markY(a) - markY(b) || a.clave.localeCompare(b.clave));
	}, [
		anno,
		filter,
		query
	]);
	const selected = allMarks(anno).find((mark) => mark.id === selectedId) ?? null;
	if (!open) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		className: "no-print fixed inset-0 z-30 bg-ink/30 xl:hidden",
		"aria-label": "Cerrar índice",
		onClick: () => setOpen(false)
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		className: "no-print fixed inset-y-0 right-0 z-40 flex w-full flex-col border-l border-line bg-folio shadow-folio sm:w-80 xl:static xl:w-80 xl:shadow-none",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-2 border-b border-line px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-serif text-2xl leading-none",
					children: "Claves"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-xs text-muted",
					children: [allMarks(anno).length, " marcas en este documento"]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "grid size-11 place-items-center rounded-md hover:bg-paper xl:hidden",
					"aria-label": "Cerrar índice",
					onClick: () => setOpen(false),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "border-b border-line px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "flex items-center gap-2 rounded-md border border-line bg-paper px-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "size-4 text-muted" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: query,
						onChange: (event) => setQuery(event.target.value),
						onKeyDown: (event) => {
							if (event.key !== "Enter" || !marks[0]) return;
							select(marks[0].id);
							jump(marks[0]);
						},
						placeholder: "Buscar clave o comentario",
						className: "h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-2 flex flex-wrap gap-1",
					children: FILTERS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-pressed": filter === item.id,
						className: cn("rounded-full px-3 py-1 text-xs", filter === item.id ? "bg-ink text-folio" : "bg-paper text-ink-soft"),
						onClick: () => setFilter(item.id),
						children: item.label
					}, item.id))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-h-0 flex-1 overflow-y-auto",
				children: [marks.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "px-4 py-6 text-sm text-muted",
					children: "Todavía no hay marcas con ese criterio. Dibuja, subraya una selección o deja una nota."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: marks.map((mark) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: cn("flex w-full flex-col items-start gap-1 border-b border-line px-4 py-3 text-left", selectedId === mark.id ? "bg-wax-soft" : "hover:bg-paper"),
					onClick: () => {
						select(mark.id);
						jump(mark);
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "flex w-full items-center justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-semibold text-wax",
							children: mark.clave
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-xs text-muted",
							children: [
								label(mark),
								" · ",
								mark.page + 1
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "line-clamp-2 font-serif text-sm text-ink-soft",
						children: excerpt(mark) || "Sin comentario"
					})]
				}) }, mark.id)) })]
			}),
			selected && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MarkEditor, { mark: selected })
		]
	})] });
}
function MarkEditor({ mark }) {
	const rename = useStudio((state) => state.renameMark);
	const updateComment = useStudio((state) => state.updateComment);
	const recolor = useStudio((state) => state.recolorMark);
	const remove = useStudio((state) => state.deleteMark);
	const [clave, setClave] = (0, import_react.useState)(mark.clave);
	(0, import_react.useEffect)(() => setClave(mark.clave), [mark.clave, mark.id]);
	const colors = mark.kind === "pen" || mark.kind === "note" ? INK_COLORS : MARKER_COLORS;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "border-t border-line p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
				className: "block text-xs text-muted",
				htmlFor: "clave-field",
				children: "Clave para localizar el comentario"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-1 flex gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					id: "clave-field",
					value: clave,
					maxLength: 40,
					onChange: (event) => setClave(event.target.value),
					onBlur: () => {
						const next = clave.trim();
						if (!next || next === mark.clave) {
							setClave(mark.clave);
							return;
						}
						if (!rename(mark.id, next)) {
							setClave(mark.clave);
							toast.error("Esa clave ya está en uso.");
						}
					},
					onKeyDown: (event) => {
						if (event.key === "Enter") event.currentTarget.blur();
					},
					className: "h-11 min-w-0 flex-1 rounded-md border border-line bg-paper px-2 font-semibold text-ink outline-none focus-visible:outline-2 focus-visible:outline-wax"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "grid size-11 place-items-center rounded-md border border-line hover:bg-paper",
					"aria-label": "Copiar clave",
					onClick: () => {
						navigator.clipboard.writeText(mark.clave).then(() => toast(`Clave ${mark.clave} copiada`), () => toast.error("No se pudo copiar."));
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-4" })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
				"data-index-comment": mark.id,
				value: mark.comment,
				rows: 4,
				placeholder: "Comentario de revisión",
				onChange: (event) => updateComment(mark.id, event.target.value),
				className: "mt-2 w-full resize-none rounded-md border border-line bg-paper px-2 py-2 font-serif text-sm outline-none focus-visible:outline-2 focus-visible:outline-wax"
			}),
			mark.kind === "quote" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 line-clamp-3 font-serif text-sm text-muted",
				children: [
					"“",
					mark.quote,
					"”"
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2 flex items-center justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex gap-1",
					children: colors.map((color) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": color.label,
						"aria-pressed": mark.color === color.hex,
						className: cn("size-11 rounded-full border-2", mark.color === color.hex ? "border-ink" : "border-line"),
						style: { backgroundColor: color.hex },
						onClick: () => recolor(mark.id, color.hex)
					}, color.id))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "grid size-11 place-items-center rounded-md text-wax hover:bg-wax-soft",
					"aria-label": "Eliminar marca",
					onClick: () => remove(mark.id),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
				})]
			})
		]
	});
}
function label(mark) {
	if (mark.kind === "pen") return "Pluma";
	if (mark.kind === "marker") return "Marcador";
	if (mark.kind === "quote") return "Cita";
	return "Nota";
}
function excerpt(mark) {
	if (mark.comment.trim()) return mark.comment.trim();
	if (mark.kind === "quote") return mark.quote;
	return "";
}
function jump(mark) {
	document.getElementById(`folio-page-${mark.page}`)?.scrollIntoView({
		behavior: "smooth",
		block: "center"
	});
}
function clamp01(value) {
	if (Number.isNaN(value)) return 0;
	return Math.min(1, Math.max(0, value));
}
function distToSegment(px, py, ax, ay, bx, by) {
	const dx = bx - ax;
	const dy = by - ay;
	const len = dx * dx + dy * dy;
	if (len === 0) return Math.hypot(px - ax, py - ay);
	const t = Math.min(1, Math.max(0, ((px - ax) * dx + (py - ay) * dy) / len));
	return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
function hitStroke(strokes, x, y, threshold) {
	let best = null;
	let bestDistance = threshold;
	for (const stroke of strokes) {
		const points = stroke.points;
		if (points.length === 0) continue;
		if (points.length === 1) {
			const distance = Math.hypot(x - points[0].x, y - points[0].y);
			if (distance < bestDistance) {
				bestDistance = distance;
				best = stroke;
			}
			continue;
		}
		for (let index = 1; index < points.length; index += 1) {
			const distance = distToSegment(x, y, points[index - 1].x, points[index - 1].y, points[index].x, points[index].y);
			if (distance < bestDistance) {
				bestDistance = distance;
				best = stroke;
			}
		}
	}
	return best;
}
function findQuoteRange(root, quote) {
	const trimmed = quote.trim();
	if (!trimmed || typeof document === "undefined") return null;
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
	const nodes = [];
	let raw = "";
	let current = walker.nextNode();
	while (current) {
		nodes.push(current);
		raw += current.textContent ?? "";
		current = walker.nextNode();
	}
	const exact = raw.indexOf(trimmed);
	if (exact >= 0) return rangeBetween(nodes, exact, exact + trimmed.length);
	let normalized = "";
	const map = [];
	let pendingSpace = false;
	for (let index = 0; index < raw.length; index += 1) {
		const char = raw[index] ?? "";
		if (/\s/.test(char)) {
			pendingSpace = normalized.length > 0;
			continue;
		}
		if (pendingSpace) {
			normalized += " ";
			map.push(index);
			pendingSpace = false;
		}
		normalized += char;
		map.push(index);
	}
	const needle = trimmed.replace(/\s+/g, " ");
	const found = normalized.indexOf(needle);
	if (found < 0) return null;
	const start = map[found];
	const endIndex = map[found + needle.length - 1];
	if (start === void 0 || endIndex === void 0) return null;
	return rangeBetween(nodes, start, endIndex + 1);
}
function rangeBetween(nodes, start, end) {
	let cursor = 0;
	let startNode = null;
	let startOffset = 0;
	let endNode = null;
	let endOffset = 0;
	for (const node of nodes) {
		const length = node.textContent?.length ?? 0;
		if (!startNode && cursor + length > start) {
			startNode = node;
			startOffset = start - cursor;
		}
		if (cursor + length >= end) {
			endNode = node;
			endOffset = end - cursor;
			break;
		}
		cursor += length;
	}
	if (!startNode || !endNode) return null;
	const range = document.createRange();
	try {
		range.setStart(startNode, Math.max(0, startOffset));
		range.setEnd(endNode, Math.max(0, endOffset));
		return range;
	} catch {
		return null;
	}
}
var listeners = /* @__PURE__ */ new Set();
function emitPen(sample) {
	for (const listener of listeners) listener(sample);
}
function subscribePen(listener) {
	listeners.add(listener);
	return () => listeners.delete(listener);
}
function isEraserEvent(event) {
	if (event.button === 5 || (event.buttons & 32) === 32) return true;
	return event.pointerType === "pen" && (event.button === 2 || event.buttons === 2);
}
var lastPenAt = 0;
function InkLayer({ page }) {
	const ref = (0, import_react.useRef)(null);
	const liveRef = (0, import_react.useRef)([]);
	const rafRef = (0, import_react.useRef)(0);
	const modeRef = (0, import_react.useRef)(null);
	const eraseRecord = (0, import_react.useRef)(true);
	const announced = (0, import_react.useRef)(false);
	const [live, setLive] = (0, import_react.useState)(null);
	const [box, setBox] = (0, import_react.useState)({
		w: 1,
		h: 1
	});
	const tool = useStudio((state) => state.tool);
	const inkId = useStudio((state) => state.inkId);
	const markerId = useStudio((state) => state.markerId);
	const sizeStep = useStudio((state) => state.sizeStep);
	const allStrokes = useStudio((state) => state.anno.strokes);
	const strokes = (0, import_react.useMemo)(() => allStrokes.filter((stroke) => stroke.page === page), [allStrokes, page]);
	const selectedId = useStudio((state) => state.selectedId);
	const commitStroke = useStudio((state) => state.commitStroke);
	const eraseAt = useStudio((state) => state.eraseAt);
	(0, import_react.useEffect)(() => {
		const element = ref.current;
		if (!element) return;
		const measure = () => {
			const rect = element.getBoundingClientRect();
			const next = {
				w: Math.max(1, rect.width),
				h: Math.max(1, rect.height)
			};
			setBox((current) => current.w === next.w && current.h === next.h ? current : next);
		};
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(element);
		return () => observer.disconnect();
	}, []);
	const drawing = tool === "pen" || tool === "marker" || tool === "eraser";
	function boxRect() {
		return ref.current?.getBoundingClientRect() ?? null;
	}
	function toPoint(event, rect) {
		const x = clamp01((event.clientX - rect.left) / rect.width);
		const y = clamp01((event.clientY - rect.top) / rect.height);
		let pressure = event.pointerType === "mouse" ? .72 : event.pressure;
		if (!pressure || pressure < .02) pressure = event.pointerType === "pen" ? .2 : .55;
		if (event.pointerType === "pen") {
			const tilt = Math.min(1, Math.hypot(event.tiltX || 0, event.tiltY || 0) / 70);
			pressure = clamp01(pressure * (1 + tilt * .35));
		}
		return {
			x,
			y,
			p: pressure
		};
	}
	function remember(points) {
		const current = liveRef.current;
		for (const point of points) {
			const last = current[current.length - 1];
			if (last) {
				const dx = point.x - last.x;
				const dy = point.y - last.y;
				if (dx * dx + dy * dy < 14e-7) continue;
			}
			current.push(point);
		}
		if (!rafRef.current) rafRef.current = window.requestAnimationFrame(() => {
			rafRef.current = 0;
			setLive(liveRef.current.slice());
		});
	}
	function finishDraw() {
		const points = liveRef.current.slice();
		liveRef.current = [];
		setLive(null);
		modeRef.current = null;
		if (points.length === 0) return;
		if (points.length === 1) {
			const only = points[0];
			if (!only) return;
			points.push({
				...only,
				x: clamp01(only.x + .002)
			});
		}
		const kind = tool === "marker" ? "marker" : "pen";
		commitStroke({
			kind,
			page,
			color: kind === "marker" ? markerHex(markerId) : inkHex(inkId),
			size: sizeFromStep(sizeStep, kind),
			points
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref,
		className: "absolute inset-0 z-10",
		style: {
			touchAction: drawing ? "none" : "auto",
			pointerEvents: drawing ? "auto" : "none"
		},
		onContextMenu: (event) => {
			if (drawing) event.preventDefault();
		},
		onPointerDown: (event) => {
			if (event.pointerType === "pen") lastPenAt = Date.now();
			if (event.pointerType === "touch" && Date.now() - lastPenAt < 800) return;
			if (!drawing) return;
			const rect = boxRect();
			if (!rect) return;
			const eraser = tool === "eraser" || isEraserEvent(event);
			if (!eraser && event.button !== 0) return;
			event.preventDefault();
			event.currentTarget.setPointerCapture(event.pointerId);
			if (event.pointerType === "pen" && !announced.current) {
				announced.current = true;
				toast("Pluma detectada", { description: "Presión, inclinación y la goma del reverso ya anotan en la página." });
			}
			emitPen({
				kind: eraser ? "eraser" : event.pointerType === "pen" ? "pen" : event.pointerType === "touch" ? "touch" : "mouse",
				pressure: event.pressure || (event.pointerType === "mouse" ? .7 : .4)
			});
			if (eraser) {
				modeRef.current = "erase";
				eraseRecord.current = true;
				const point = toPoint(event.nativeEvent, rect);
				eraseAt(page, point.x, point.y, 18 / rect.width, true);
				eraseRecord.current = false;
				return;
			}
			modeRef.current = "draw";
			liveRef.current = [];
			remember([toPoint(event.nativeEvent, rect)]);
		},
		onPointerMove: (event) => {
			if (event.pointerType === "pen") lastPenAt = Date.now();
			if (!modeRef.current) return;
			const rect = boxRect();
			if (!rect) return;
			const events = event.nativeEvent.getCoalescedEvents?.() ?? [event.nativeEvent];
			if (modeRef.current === "erase" || isEraserEvent(event)) {
				for (const sample of events) {
					const point = toPoint(sample, rect);
					eraseAt(page, point.x, point.y, 18 / rect.width, eraseRecord.current);
					eraseRecord.current = false;
				}
				emitPen({
					kind: "eraser",
					pressure: event.pressure || .5
				});
				return;
			}
			remember(events.map((sample) => toPoint(sample, rect)));
			emitPen({
				kind: event.pointerType === "pen" ? "pen" : event.pointerType === "touch" ? "touch" : "mouse",
				pressure: event.pressure || .7
			});
		},
		onPointerUp: () => {
			if (modeRef.current === "draw") finishDraw();
			else modeRef.current = null;
			emitPen({
				kind: "idle",
				pressure: 0
			});
		},
		onPointerCancel: () => {
			if (modeRef.current === "draw") finishDraw();
			else modeRef.current = null;
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
			className: "h-full w-full overflow-visible",
			"aria-hidden": "true",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StrokeGroup, {
					strokes: strokes.filter((stroke) => stroke.kind === "marker"),
					width: box.w,
					height: box.h,
					blend: true,
					selectedId
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StrokeGroup, {
					strokes: strokes.filter((stroke) => stroke.kind === "pen"),
					width: box.w,
					height: box.h,
					selectedId
				}),
				live && live.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StrokeShape, {
					stroke: {
						id: "live",
						kind: tool === "marker" ? "marker" : "pen",
						page,
						color: tool === "marker" ? markerHex(markerId) : inkHex(inkId),
						size: sizeFromStep(sizeStep, tool === "marker" ? "marker" : "pen"),
						points: live,
						clave: "",
						comment: "",
						createdAt: 0
					},
					width: box.w,
					height: box.h,
					selected: false
				})
			]
		})
	});
}
function StrokeGroup({ strokes, width, height, blend, selectedId }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", {
		style: blend ? { mixBlendMode: "multiply" } : void 0,
		children: strokes.map((stroke) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StrokeShape, {
			stroke,
			width,
			height,
			selected: stroke.id === selectedId
		}, stroke.id))
	});
}
function StrokeShape({ stroke, width, height, selected }) {
	const lines = stroke.points.slice(1).map((point, index) => {
		const previous = stroke.points[index];
		if (!previous) return null;
		const pressure = (previous.p + point.p) / 2;
		const strokeWidth = Math.max(1.25, stroke.size * width * (.35 + pressure * .9));
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
			x1: previous.x * width,
			y1: previous.y * height,
			x2: point.x * width,
			y2: point.y * height,
			stroke: selected ? "var(--color-wax)" : stroke.color,
			strokeWidth: selected ? strokeWidth + 1.5 : strokeWidth,
			strokeLinecap: "round",
			opacity: stroke.kind === "marker" ? .55 : .92
		}, `${stroke.id}-${index}`);
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", { children: lines });
}
function DocumentView({ pageWidth }) {
	const activeId = useStudio((state) => state.activeId);
	const kind = useStudio((state) => state.docs.find((doc) => doc.id === state.activeId)?.kind);
	const quotes = useStudio((state) => state.anno.quotes);
	const [parsed, setParsed] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)(null);
	const [current, setCurrent] = (0, import_react.useState)(0);
	const [selection, setSelection] = (0, import_react.useState)(null);
	const scrollerRef = (0, import_react.useRef)(null);
	const addQuote = useStudio((state) => state.addQuote);
	const addNote = useStudio((state) => state.addNote);
	(0, import_react.useEffect)(() => {
		if (!activeId || !kind) {
			setParsed(null);
			return;
		}
		const cached = cachedParsed(activeId);
		if (cached) {
			setParsed(cached);
			setError(null);
			setCurrent(0);
			return;
		}
		const bytes = peekBytes(activeId);
		if (!bytes) return;
		let cancel = false;
		setError(null);
		parseDocument(kind, bytes).then((result) => {
			if (cancel) {
				result.dispose();
				return;
			}
			rememberParsed(activeId, result);
			setParsed(result);
			setCurrent(0);
		}, (reason) => {
			if (!cancel) setError(reason instanceof Error ? reason.message : "No se pudo leer el documento.");
		});
		return () => {
			cancel = true;
		};
	}, [activeId, kind]);
	(0, import_react.useEffect)(() => {
		const registry = CSS.highlights;
		const HighlightCtor = window.Highlight;
		if (!registry || !HighlightCtor) return;
		const names = [
			"atril-amber",
			"atril-rose",
			"atril-moss"
		];
		for (const name of names) registry.delete(name);
		const groups = /* @__PURE__ */ new Map();
		for (const quote of quotes) {
			const root = document.querySelector(`[data-folio-page="${quote.page}"] .folio-html`);
			if (!root) continue;
			const range = findQuoteRange(root, quote.quote);
			if (!range) continue;
			const name = highlightName(quote.color);
			const list = groups.get(name) ?? [];
			list.push(range);
			groups.set(name, list);
		}
		for (const [name, ranges] of groups) registry.set(name, new HighlightCtor(...ranges));
		return () => {
			for (const name of names) registry.delete(name);
		};
	}, [
		quotes,
		parsed,
		pageWidth
	]);
	(0, import_react.useEffect)(() => {
		const onSelection = () => {
			const selected = window.getSelection();
			if (!selected || selected.isCollapsed || !selected.rangeCount) {
				setSelection(null);
				return;
			}
			const range = selected.getRangeAt(0);
			const node = range.commonAncestorContainer;
			const page = (node instanceof Element ? node : node.parentElement)?.closest("[data-folio-page]");
			const text = selected.toString().replace(/\s+/g, " ").trim();
			if (!page || text.length < 2) {
				setSelection(null);
				return;
			}
			const pageRect = page.getBoundingClientRect();
			const rect = range.getBoundingClientRect();
			setSelection({
				text: text.slice(0, 2e3),
				page: Number(page.getAttribute("data-folio-page")),
				y: clamp01((rect.top - pageRect.top) / Math.max(1, pageRect.height)),
				left: rect.left + rect.width / 2,
				top: rect.bottom
			});
		};
		document.addEventListener("selectionchange", onSelection);
		return () => document.removeEventListener("selectionchange", onSelection);
	}, []);
	(0, import_react.useEffect)(() => {
		const root = scrollerRef.current;
		if (!root || !parsed) return;
		const sections = [...root.querySelectorAll("[data-folio-page]")];
		const observer = new IntersectionObserver((entries) => {
			const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
			if (!visible) return;
			setCurrent(Number(visible.target.dataset.folioPage ?? 0));
		}, {
			root,
			threshold: [.35, .6]
		});
		for (const section of sections) observer.observe(section);
		return () => observer.disconnect();
	}, [parsed, pageWidth]);
	const pageCount = parsed?.pages.length ?? 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative min-h-0 flex-1",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				ref: scrollerRef,
				className: "reader h-full overflow-auto overscroll-contain",
				children: [
					error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mx-auto mt-8 max-w-xl rounded-md border border-line bg-wax-soft px-4 py-3 text-sm text-ink",
						children: error
					}),
					!parsed && !error && activeId && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "px-6 py-8 text-sm text-muted",
						children: "Abriendo el documento…"
					}),
					!activeId && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyLibrary, {}),
					parsed && activeId && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mx-auto flex w-fit min-w-full flex-col items-center px-3 py-6 pb-20 sm:px-6",
						children: [
							parsed.warnings.map((warning) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mb-3 max-w-3xl text-sm text-muted",
								children: warning
							}, warning)),
							parsed.pages.map((page, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageFrame, {
								page: index,
								width: pageWidth,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageBody, {
									docId: activeId,
									page,
									pageNumber: index + 1,
									width: pageWidth
								})
							}, `${activeId}-${index}`)),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PrintIndex, {})
						]
					})
				]
			}),
			pageCount > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "no-print absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full border border-line bg-folio px-1 py-1 shadow-folio",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "grid size-11 place-items-center rounded-full text-ink hover:bg-paper",
						"aria-label": "Folio anterior",
						onClick: () => jumpTo(Math.max(0, current - 1)),
						children: "‹"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "min-w-16 text-center text-sm text-ink-soft",
						children: [
							current + 1,
							" / ",
							pageCount
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "grid size-11 place-items-center rounded-full text-ink hover:bg-paper",
						"aria-label": "Folio siguiente",
						onClick: () => jumpTo(Math.min(pageCount - 1, current + 1)),
						children: "›"
					})
				]
			}),
			selection && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "no-print fixed z-50 flex -translate-x-1/2 gap-1 rounded-md border border-line bg-folio p-1 shadow-folio",
				style: {
					left: selection.left,
					top: Math.min(window.innerHeight - 64, selection.top + 8)
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "rounded-md px-3 py-2 text-sm font-medium text-ink hover:bg-paper",
					onMouseDown: (event) => event.preventDefault(),
					onClick: () => {
						addQuote(selection.page, selection.y, selection.text);
						window.getSelection()?.removeAllRanges();
						setSelection(null);
					},
					children: "Subrayar"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "rounded-md px-3 py-2 text-sm font-medium text-ink hover:bg-paper",
					onMouseDown: (event) => event.preventDefault(),
					onClick: () => {
						addNote(selection.page, selection.y, selection.text);
						window.getSelection()?.removeAllRanges();
						setSelection(null);
					},
					children: "Al margen"
				})]
			})
		]
	});
}
function jumpTo(page) {
	document.getElementById(`folio-page-${page}`)?.scrollIntoView({
		behavior: "smooth",
		block: "start"
	});
}
function PageFrame({ page, width, children }) {
	const tool = useStudio((state) => state.tool);
	const strokes = useStudio((state) => state.anno.strokes);
	const allNotes = useStudio((state) => state.anno.notes);
	const allQuotes = useStudio((state) => state.anno.quotes);
	const showClaves = useStudio((state) => state.showClaves);
	const selectedId = useStudio((state) => state.selectedId);
	const addNote = useStudio((state) => state.addNote);
	const select = useStudio((state) => state.select);
	const notes = (0, import_react.useMemo)(() => allNotes.filter((note) => note.page === page), [allNotes, page]);
	const quotes = (0, import_react.useMemo)(() => allQuotes.filter((quote) => quote.page === page), [allQuotes, page]);
	const folioRef = (0, import_react.useRef)(null);
	const [height, setHeight] = (0, import_react.useState)(640);
	(0, import_react.useEffect)(() => {
		const element = folioRef.current;
		if (!element) return;
		const observer = new ResizeObserver(() => setHeight(element.getBoundingClientRect().height));
		observer.observe(element);
		return () => observer.disconnect();
	}, []);
	const pageStrokes = strokes.filter((stroke) => stroke.page === page);
	const selectable = tool === "select" || tool === "note";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		id: `folio-page-${page}`,
		"data-folio-page": page,
		className: "mb-8 flex scroll-mt-4 flex-wrap items-start gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				ref: folioRef,
				className: cn("folio relative border border-line bg-folio shadow-folio", selectable ? "select-text" : "select-none", tool === "hand" && "cursor-grab active:cursor-grabbing"),
				style: { width },
				onPointerDown: (event) => {
					if (event.target.closest("button, a, textarea, input")) return;
					const rect = event.currentTarget.getBoundingClientRect();
					const x = clamp01((event.clientX - rect.left) / rect.width);
					const y = clamp01((event.clientY - rect.top) / rect.height);
					if (tool === "hand") {
						const scroller = event.currentTarget.closest(".reader");
						if (!(scroller instanceof HTMLElement)) return;
						event.preventDefault();
						const originX = event.clientX;
						const originY = event.clientY;
						const startLeft = scroller.scrollLeft;
						const startTop = scroller.scrollTop;
						const move = (sample) => {
							scroller.scrollLeft = startLeft - (sample.clientX - originX);
							scroller.scrollTop = startTop - (sample.clientY - originY);
						};
						const end = () => {
							window.removeEventListener("pointermove", move);
							window.removeEventListener("pointerup", end);
							window.removeEventListener("pointercancel", end);
						};
						window.addEventListener("pointermove", move);
						window.addEventListener("pointerup", end);
						window.addEventListener("pointercancel", end);
						return;
					}
					if (tool === "note") {
						event.preventDefault();
						addNote(page, y);
						return;
					}
					if (tool === "select") {
						const hit = hitStroke(pageStrokes, x, y, 16 / rect.width);
						if (hit) {
							event.preventDefault();
							select(hit.id);
						}
					}
				},
				children: [
					children,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InkLayer, { page }),
					showClaves && pageStrokes.map((stroke) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClaveChip, {
						stroke,
						selected: stroke.id === selectedId
					}, stroke.id))
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gutter, {
				page,
				height,
				notes,
				quotes
			}),
			(notes.length > 0 || quotes.length > 0) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2 lg:hidden",
				style: { width },
				children: [quotes.map((quote) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: cn("rounded-md px-3 py-2 text-left text-sm", selectedId === quote.id ? "bg-wax text-folio" : "bg-paper text-wax"),
					onClick: () => select(quote.id),
					children: quote.clave
				}, quote.id)), notes.map((note) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NoteCard, { note }, note.id))]
			})
		]
	});
}
function ClaveChip({ stroke, selected }) {
	const select = useStudio((state) => state.select);
	const tool = useStudio((state) => state.tool);
	const point = stroke.points[0];
	if (!point) return null;
	const drawing = tool === "pen" || tool === "marker" || tool === "eraser";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		className: cn("absolute z-20 -translate-y-full rounded-sm px-1.5 py-0.5 font-sans text-xs font-semibold", selected ? "bg-wax text-folio" : "bg-ink text-folio"),
		style: {
			left: `${point.x * 100}%`,
			top: `${point.y * 100}%`,
			pointerEvents: drawing ? "none" : "auto"
		},
		onClick: (event) => {
			event.stopPropagation();
			select(stroke.id);
		},
		children: stroke.clave
	});
}
function Gutter({ page, height, notes, quotes }) {
	const selectedId = useStudio((state) => state.selectedId);
	const select = useStudio((state) => state.select);
	const stacked = stackNotes(notes, height);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		className: "relative hidden w-gutter shrink-0 lg:block",
		"aria-label": `Margen del folio ${page + 1}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-y-0 left-0 w-px bg-line" }),
			quotes.map((quote) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: cn("absolute left-3 rounded-sm px-1.5 py-0.5 text-xs font-semibold", selectedId === quote.id ? "bg-wax text-folio" : "bg-paper text-wax"),
				style: { top: quote.y * height },
				onClick: () => select(quote.id),
				children: quote.clave
			}, quote.id)),
			stacked.map(({ note, top }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute right-0 left-3",
				style: { top },
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NoteCard, { note })
			}, note.id))
		]
	});
}
function NoteCard({ note }) {
	const selectedId = useStudio((state) => state.selectedId);
	const select = useStudio((state) => state.select);
	const updateComment = useStudio((state) => state.updateComment);
	const deleteMark = useStudio((state) => state.deleteMark);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: cn("rounded-md border bg-folio p-2", selectedId === note.id ? "border-wax" : "border-line"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "text-xs font-semibold text-wax",
				onClick: () => select(note.id),
				children: note.clave
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "text-xs text-muted hover:text-ink",
				onClick: () => deleteMark(note.id),
				children: "Quitar"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
			"data-margin-comment": note.id,
			value: note.comment,
			rows: 3,
			placeholder: "Nota al margen",
			onChange: (event) => updateComment(note.id, event.target.value),
			onFocus: () => select(note.id),
			className: "mt-1 w-full resize-none bg-transparent font-serif text-sm text-ink outline-none placeholder:text-muted"
		})]
	});
}
function stackNotes(notes, height) {
	const sorted = [...notes].sort((a, b) => a.y - b.y);
	let last = -999;
	return sorted.map((note) => {
		let top = note.y * height;
		if (top < last + 116) top = last + 116;
		last = top;
		return {
			note,
			top
		};
	});
}
function PageBody({ docId, page, pageNumber, width }) {
	if (page.type === "pdf") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PdfSheet, {
		docId,
		pageNumber,
		width
	});
	if (page.type === "table") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-96 overflow-x-auto px-4 py-6 sm:px-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-3 font-sans text-xs tracking-widest text-muted uppercase",
			children: page.title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("table", {
			className: "w-full border-collapse font-sans text-sm",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: page.rows.map((row, rowIndex) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
				className: rowIndex === 0 ? "bg-paper font-semibold" : void 0,
				children: row.map((cell, cellIndex) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "border border-line px-2 py-1 align-top",
					children: cell
				}, `${rowIndex}-${cellIndex}`))
			}, `${page.title}-${rowIndex}`)) })
		})]
	});
	if (page.type === "slide") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "flex min-h-96 flex-col justify-center px-6 py-10 sm:px-12",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "font-sans text-xs tracking-widest text-wax uppercase",
				children: ["Lámina ", pageNumber]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-3 font-serif text-4xl leading-tight text-ink",
				children: page.title
			}),
			page.lines.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-6 space-y-2 font-serif text-xl text-ink-soft",
				children: page.lines.map((line, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: line }, `${pageNumber}-${index}`))
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "folio-html min-h-96 px-6 py-8 sm:px-10 sm:py-12",
		"data-folio-html": true,
		dangerouslySetInnerHTML: { __html: page.html }
	});
}
function PdfSheet({ docId, pageNumber, width }) {
	const holderRef = (0, import_react.useRef)(null);
	const canvasRef = (0, import_react.useRef)(null);
	const [show, setShow] = (0, import_react.useState)(false);
	const [aspect, setAspect] = (0, import_react.useState)(1.414);
	const [failed, setFailed] = (0, import_react.useState)(false);
	const height = Math.max(200, Math.round(width * aspect));
	(0, import_react.useEffect)(() => {
		const element = holderRef.current;
		if (!element) return;
		const observer = new IntersectionObserver((entries) => {
			if (entries.some((entry) => entry.isIntersecting)) setShow(true);
		}, { rootMargin: "700px" });
		observer.observe(element);
		return () => observer.disconnect();
	}, []);
	(0, import_react.useEffect)(() => {
		if (!show) return;
		const bytes = peekBytes(docId);
		const canvas = canvasRef.current;
		if (!bytes || !canvas) return;
		let cancel = false;
		let task = null;
		(async () => {
			try {
				const pdf = await openPdf(docId, bytes);
				if (cancel) return;
				const pdfPage = await pdf.getPage(pageNumber);
				if (cancel) return;
				const base = pdfPage.getViewport({ scale: 1 });
				if (cancel) return;
				setAspect(base.height / base.width);
				const dpr = Math.min(2, window.devicePixelRatio || 1);
				const viewport = pdfPage.getViewport({ scale: width / base.width * dpr });
				canvas.width = Math.floor(viewport.width);
				canvas.height = Math.floor(viewport.height);
				const renderTask = pdfPage.render({
					canvas,
					viewport
				});
				task = renderTask;
				if (cancel) {
					renderTask.cancel();
					return;
				}
				await renderTask.promise;
			} catch {
				if (!cancel) setFailed(true);
			}
		})();
		return () => {
			cancel = true;
			task?.cancel();
		};
	}, [
		show,
		docId,
		pageNumber,
		width
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref: holderRef,
		className: "relative bg-folio",
		style: {
			width,
			height
		},
		children: [
			show && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
				ref: canvasRef,
				className: "absolute inset-0 h-full w-full"
			}),
			!show && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-paper" }),
			failed && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "absolute inset-0 grid place-items-center px-6 text-center text-sm text-muted",
				children: [
					"No se pudo pintar la página ",
					pageNumber,
					"."
				]
			})
		]
	});
}
function EmptyLibrary() {
	const restore = useStudio((state) => state.restoreSamples);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-xl px-6 py-16",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-serif text-4xl text-ink",
				children: "El atril está vacío"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-base text-ink-soft",
				children: "Abre un PDF, un Word, una presentación, una hoja de cálculo, un EPUB o un texto. La pluma cae encima de la página."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "mt-6 rounded-md bg-ink px-4 py-3 text-sm font-medium text-folio",
				onClick: () => void restore().catch(() => void 0),
				children: "Reponer el cuaderno de muestra"
			})
		]
	});
}
function PrintIndex() {
	const anno = useStudio((state) => state.anno);
	const marks = [
		...anno.strokes,
		...anno.notes,
		...anno.quotes
	].sort((a, b) => a.page - b.page || a.clave.localeCompare(b.clave));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "print-only mt-8 w-full max-w-3xl",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "font-serif text-3xl",
			children: "Índice de claves"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-4 space-y-2 text-sm",
			children: marks.map((mark) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: mark.clave }),
				` · folio ${mark.page + 1} · `,
				mark.kind === "quote" ? mark.quote : mark.comment || "Sin comentario"
			] }, mark.id))
		})]
	});
}
function downloadBlob(filename, blob) {
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	link.click();
	window.setTimeout(() => URL.revokeObjectURL(url), 1e3);
}
function fileStamp(name, extension) {
	return `${name.replace(/\.[^.]+$/, "") || "documento"}.${extension}`;
}
function safeText(value) {
	return value.replace(/\u2014|\u2013/g, "-").replace(/\u2018|\u2019/g, "'").replace(/\u201c|\u201d/g, "\"").replace(/\u2026/g, "...").replace(/[^\x09\x0a\x0d\x20-\x7e\u00a1-\u00ff]/g, "");
}
function hexToRgb(hex) {
	const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
	if (!match) return {
		r: .11,
		g: .1,
		b: .08
	};
	const value = Number.parseInt(match[1], 16);
	return {
		r: (value >> 16 & 255) / 255,
		g: (value >> 8 & 255) / 255,
		b: (value & 255) / 255
	};
}
async function exportAnnotatedPdf(bytes, anno) {
	const { PDFDocument, StandardFonts, rgb } = await import("../_libs/pdf-lib.mjs").then((n) => n.t);
	const doc = await PDFDocument.load(bytes);
	const font = await doc.embedFont(StandardFonts.Helvetica);
	const bold = await doc.embedFont(StandardFonts.HelveticaBold);
	const pages = doc.getPages();
	for (const stroke of anno.strokes) {
		const page = pages[stroke.page];
		if (!page || stroke.points.length < 2) continue;
		const { width, height } = page.getSize();
		const color = hexToRgb(stroke.color);
		for (let index = 1; index < stroke.points.length; index += 1) {
			const from = stroke.points[index - 1];
			const to = stroke.points[index];
			if (!from || !to) continue;
			const pressure = (from.p + to.p) / 2;
			page.drawLine({
				start: {
					x: from.x * width,
					y: height - from.y * height
				},
				end: {
					x: to.x * width,
					y: height - to.y * height
				},
				thickness: Math.max(.6, stroke.size * width * (.35 + pressure)),
				color: rgb(color.r, color.g, color.b),
				opacity: stroke.kind === "marker" ? .4 : .92
			});
		}
		const origin = stroke.points[0];
		if (origin) page.drawText(safeText(stroke.clave), {
			x: Math.min(width - 48, origin.x * width),
			y: Math.min(height - 12, height - origin.y * height + 6),
			size: 8,
			font: bold,
			color: rgb(color.r, color.g, color.b)
		});
	}
	for (const note of anno.notes) {
		const page = pages[note.page];
		if (!page) continue;
		const { width, height } = page.getSize();
		const text = safeText(`${note.clave}  ${note.comment}`.trim()).slice(0, 240);
		if (!text) continue;
		page.drawText(text, {
			x: 36,
			y: Math.max(24, height - note.y * height),
			size: 8,
			font,
			color: rgb(.56, .18, .18),
			maxWidth: width - 72
		});
	}
	const index = doc.addPage([595.28, 841.89]);
	let y = 790;
	index.drawText("Indice de claves", {
		x: 56,
		y,
		size: 18,
		font: bold,
		color: rgb(.11, .1, .08)
	});
	y -= 28;
	const marks = allMarks(anno).sort((a, b) => a.page - b.page || a.clave.localeCompare(b.clave));
	if (marks.length === 0) index.drawText("Este documento no tiene marcas.", {
		x: 56,
		y,
		size: 11,
		font,
		color: rgb(.2, .18, .16)
	});
	for (const mark of marks) {
		if (y < 64) break;
		const body = mark.kind === "quote" ? mark.quote : mark.comment || (mark.kind === "marker" ? "Subrayado" : "Trazo");
		const line = safeText(`${mark.clave}   p. ${mark.page + 1}   ${body}`).slice(0, 140);
		index.drawText(line, {
			x: 56,
			y,
			size: 10,
			font,
			color: rgb(.11, .1, .08),
			maxWidth: 480
		});
		y -= 16;
	}
	return doc.save();
}
var TOOLS = [
	{
		id: "hand",
		label: "Mano",
		shortcut: "H",
		icon: Hand
	},
	{
		id: "select",
		label: "Selección",
		shortcut: "V",
		icon: MousePointer2
	},
	{
		id: "pen",
		label: "Pluma",
		shortcut: "P",
		icon: PenLine
	},
	{
		id: "marker",
		label: "Marcador",
		shortcut: "M",
		icon: Highlighter
	},
	{
		id: "note",
		label: "Nota al margen",
		shortcut: "N",
		icon: StickyNote
	},
	{
		id: "eraser",
		label: "Goma",
		shortcut: "E",
		icon: Eraser
	}
];
var ACCEPT = ".pdf,.docx,.odt,.epub,.fb2,.pptx,.xlsx,.xls,.ods,.csv,.txt,.md,.markdown,.html,.htm,.rtf,.log,.json";
function Studio() {
	const booted = useStudio((state) => state.booted);
	const boot = useStudio((state) => state.boot);
	(0, import_react.useEffect)(() => {
		boot();
	}, [boot]);
	if (!booted) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-dvh flex-col bg-wall text-ink",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
			className: "flex h-14 items-center border-b border-line bg-folio px-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-serif text-3xl leading-none",
				children: "Atril"
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "px-4 py-6 text-muted",
			children: "Abriendo el cuaderno…"
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StudioShell, {});
}
function StudioShell() {
	const fileRef = (0, import_react.useRef)(null);
	const marksRef = (0, import_react.useRef)(null);
	const dragDepth = (0, import_react.useRef)(0);
	const [dragOver, setDragOver] = (0, import_react.useState)(false);
	const [pageWidth, setPageWidth] = (0, import_react.useState)(() => measurePage(useStudio.getState().zoom, window.innerWidth, false));
	const zoom = useStudio((state) => state.zoom);
	const setZoom = useStudio((state) => state.setZoom);
	const activeId = useStudio((state) => state.activeId);
	const anno = useStudio((state) => state.anno);
	const booted = useStudio((state) => state.booted);
	const doc = useStudio((state) => state.docs.find((item) => item.id === state.activeId));
	const tool = useStudio((state) => state.tool);
	const indexOpen = useStudio((state) => state.indexOpen);
	const setIndexOpen = useStudio((state) => state.setIndexOpen);
	const setLibraryOpen = useStudio((state) => state.setLibraryOpen);
	const setHelpOpen = useStudio((state) => state.setHelpOpen);
	const busy = useStudio((state) => state.busy);
	const bootError = useStudio((state) => state.bootError);
	const importFiles = useStudio((state) => state.importFiles);
	const importAnnoFile = useStudio((state) => state.importAnnoFile);
	const focusId = useStudio((state) => state.focusId);
	const clearFocus = useStudio((state) => state.clearFocus);
	const showClaves = useStudio((state) => state.showClaves);
	const setShowClaves = useStudio((state) => state.setShowClaves);
	const past = useStudio((state) => state.past.length);
	const future = useStudio((state) => state.future.length);
	const frameRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const element = frameRef.current;
		if (!element) return;
		const measure = () => setPageWidth(measurePage(zoom, element.clientWidth, indexOpen));
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(element);
		return () => observer.disconnect();
	}, [zoom, indexOpen]);
	(0, import_react.useEffect)(() => {
		if (!booted || !activeId) return;
		const handle = window.setTimeout(() => {
			saveAnno(activeId, anno);
		}, 250);
		return () => window.clearTimeout(handle);
	}, [
		booted,
		activeId,
		anno
	]);
	(0, import_react.useEffect)(() => {
		if (!focusId) return;
		const frame = window.requestAnimationFrame(() => {
			(document.querySelector(`[data-margin-comment="${focusId}"]`) ?? document.querySelector(`[data-index-comment="${focusId}"]`))?.focus();
			clearFocus();
		});
		return () => window.cancelAnimationFrame(frame);
	}, [focusId, clearFocus]);
	(0, import_react.useEffect)(() => {
		const onKey = (event) => {
			const state = useStudio.getState();
			const target = event.target instanceof HTMLElement ? event.target : null;
			const typing = Boolean(target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable));
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
				event.preventDefault();
				if (event.shiftKey) state.redo();
				else state.undo();
				return;
			}
			if (event.key === "Escape") state.select(null);
			if (typing || event.metaKey || event.ctrlKey || event.altKey) return;
			const next = {
				p: "pen",
				m: "marker",
				n: "note",
				v: "select",
				h: "hand",
				e: "eraser"
			}[event.key.toLowerCase()];
			if (next) state.setTool(next);
			if ((event.key === "Delete" || event.key === "Backspace") && state.selectedId) {
				event.preventDefault();
				state.deleteMark(state.selectedId);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);
	async function takeFiles(files) {
		if (files.length === 0) return;
		try {
			await importFiles(files);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "No se pudo abrir el archivo.");
		}
	}
	async function exportPdf() {
		if (!doc || doc.kind !== "pdf" || !activeId) return;
		const bytes = peekBytes(activeId);
		if (!bytes) {
			toast.error("El PDF todavía no está en memoria.");
			return;
		}
		try {
			const saved = await exportAnnotatedPdf(bytes, useStudio.getState().anno);
			const copy = new Uint8Array(saved.byteLength);
			copy.set(saved);
			downloadBlob(fileStamp(doc.name, "anotado.pdf"), new Blob([copy], { type: "application/pdf" }));
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "No se pudo exportar el PDF.");
		}
	}
	function exportJson() {
		if (!doc) return;
		const payload = {
			atril: 1,
			document: doc.name,
			...useStudio.getState().anno
		};
		downloadBlob(fileStamp(doc.name, "atril.json"), new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipProvider, {
		delayDuration: 280,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "shell flex h-dvh flex-col bg-wall text-ink",
			onDragEnter: (event) => {
				if (![...event.dataTransfer.types].includes("Files")) return;
				event.preventDefault();
				dragDepth.current += 1;
				setDragOver(true);
			},
			onDragOver: (event) => {
				if ([...event.dataTransfer.types].includes("Files")) event.preventDefault();
			},
			onDragLeave: () => {
				dragDepth.current -= 1;
				if (dragDepth.current <= 0) {
					dragDepth.current = 0;
					setDragOver(false);
				}
			},
			onDrop: (event) => {
				event.preventDefault();
				dragDepth.current = 0;
				setDragOver(false);
				takeFiles([...event.dataTransfer.files]);
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "no-print z-40 flex h-14 shrink-0 items-center gap-2 border-b border-line bg-folio px-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-serif text-3xl leading-none",
							children: "Atril"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "min-w-0 flex-1",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate text-sm text-ink-soft",
								children: doc?.name ?? "Sin documento"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PenMeter, { compact: true }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "hidden items-center md:flex",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconButton, {
									label: "Alejar",
									onClick: () => setZoom(zoom - .1),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { className: "size-4" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "w-12 text-center text-xs text-muted",
									children: [Math.round(zoom * 100), "%"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconButton, {
									label: "Acercar",
									onClick: () => setZoom(zoom + .1),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" })
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconButton, {
							label: "Deshacer",
							disabled: past === 0,
							className: "hidden sm:grid",
							onClick: () => useStudio.getState().undo(),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Undo2, { className: "size-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconButton, {
							label: "Rehacer",
							disabled: future === 0,
							className: "hidden sm:grid",
							onClick: () => useStudio.getState().redo(),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Redo2, { className: "size-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconButton, {
							label: "Abrir documento",
							onClick: () => fileRef.current?.click(),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconButton, {
							label: "Biblioteca",
							className: "hidden sm:grid",
							onClick: () => setLibraryOpen(true),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, { className: "size-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconButton, {
							label: "Índice de claves",
							pressed: indexOpen,
							onClick: () => setIndexOpen(!indexOpen),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(List, { className: "size-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenu, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuTrigger, {
							className: "grid size-11 place-items-center rounded-md text-ink hover:bg-paper",
							"aria-label": "Más acciones",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ellipsis, { className: "size-4" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuPortal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuContent, {
							className: "z-50 min-w-52 rounded-md border border-line bg-folio p-1 shadow-folio",
							align: "end",
							sideOffset: 6,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(MenuItem, {
									onSelect: exportJson,
									disabled: !doc,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" }), " Descargar marcas"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuItem, {
									onSelect: () => marksRef.current?.click(),
									disabled: !doc,
									children: "Cargar marcas"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuItem, {
									onSelect: () => void exportPdf(),
									disabled: doc?.kind !== "pdf",
									children: "PDF con tinta"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(MenuItem, {
									onSelect: () => window.print(),
									disabled: !doc,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, { className: "size-4" }), " Imprimir dossier"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuItem, {
									onSelect: () => setShowClaves(!showClaves),
									children: showClaves ? "Ocultar claves" : "Mostrar claves"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuItem, {
									onSelect: () => setZoom(1),
									children: "Tamaño 100%"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuItem, {
									onSelect: () => setHelpOpen(true),
									children: "Cómo se anota"
								})
							]
						}) })] })
					]
				}),
				bootError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "bg-wax-soft px-4 py-2 text-sm text-ink",
					children: bootError
				}),
				busy && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "bg-paper px-4 py-2 text-sm text-muted",
					children: busy
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					ref: frameRef,
					className: "flex min-h-0 flex-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolRail, {}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocumentView, { pageWidth }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IndexPanel, {})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
					className: cn("no-print flex h-16 shrink-0 items-center gap-1 overflow-x-auto border-t border-line bg-folio px-2 md:hidden", indexOpen && "hidden"),
					"aria-label": "Herramientas",
					children: [
						TOOLS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolButton, { ...item }, item.id)),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Palette, {}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconButton, {
							label: "Deshacer",
							disabled: past === 0,
							onClick: () => useStudio.getState().undo(),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Undo2, { className: "size-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconButton, {
							label: "Rehacer",
							disabled: future === 0,
							onClick: () => useStudio.getState().redo(),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Redo2, { className: "size-4" })
						})
					]
				}),
				dragOver && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "pointer-events-none fixed inset-0 z-50 grid place-items-center bg-ink/40",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "rounded-md bg-folio px-6 py-4 font-serif text-2xl text-ink",
						children: "Suelta el documento"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					ref: fileRef,
					type: "file",
					accept: ACCEPT,
					multiple: true,
					className: "sr-only",
					onChange: (event) => {
						takeFiles([...event.target.files ?? []]);
						event.target.value = "";
					}
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					ref: marksRef,
					type: "file",
					accept: "application/json,.json",
					className: "sr-only",
					onChange: (event) => {
						const file = event.target.files?.[0];
						event.target.value = "";
						if (!file) return;
						importAnnoFile(file).then(() => toast("Marcas cargadas"), (error) => toast.error(error instanceof Error ? error.message : "No se pudieron leer las marcas."));
					}
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LibraryDialog, { onOpenFile: () => fileRef.current?.click() }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HelpDialog, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, { position: "top-center" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "sr-only",
					children: ["Herramienta actual: ", tool]
				})
			]
		})
	});
}
function measurePage(zoom, frameWidth, indexOpen) {
	const wideTools = window.matchMedia("(min-width: 768px)").matches;
	const wideGutter = window.matchMedia("(min-width: 1024px)").matches;
	const dockedIndex = indexOpen && window.matchMedia("(min-width: 1280px)").matches;
	const rail = wideTools ? 72 : 0;
	const index = dockedIndex ? 320 : 0;
	const gutter = wideGutter ? 240 : 0;
	const available = Math.max(280, frameWidth - rail - index - 32);
	return Math.round(Math.min(760 * zoom, Math.max(280, available - gutter)));
}
function ToolRail() {
	const past = useStudio((state) => state.past.length);
	const future = useStudio((state) => state.future.length);
	const sizeStep = useStudio((state) => state.sizeStep);
	const setSizeStep = useStudio((state) => state.setSizeStep);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		className: "no-print hidden w-rail shrink-0 flex-col items-center gap-1 overflow-y-auto border-r border-line bg-folio py-2 md:flex",
		children: [
			TOOLS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolButton, {
				...item,
				tipSide: "right"
			}, item.id)),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Palette, { vertical: true }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "mt-2 w-full px-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "sr-only",
					children: "Grosor del trazo"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "range",
					min: 1,
					max: 8,
					value: sizeStep,
					"aria-label": "Grosor del trazo",
					onChange: (event) => setSizeStep(Number(event.target.value)),
					className: "w-full accent-wax"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-auto flex flex-col",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconButton, {
					label: "Deshacer",
					disabled: past === 0,
					onClick: () => useStudio.getState().undo(),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Undo2, { className: "size-4" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconButton, {
					label: "Rehacer",
					disabled: future === 0,
					onClick: () => useStudio.getState().redo(),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Redo2, { className: "size-4" })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PenMeter, {})
		]
	});
}
function Palette({ vertical = false }) {
	const tool = useStudio((state) => state.tool);
	const inkId = useStudio((state) => state.inkId);
	const markerId = useStudio((state) => state.markerId);
	const setInkId = useStudio((state) => state.setInkId);
	const setMarkerId = useStudio((state) => state.setMarkerId);
	const marker = tool === "marker";
	const colors = marker ? MARKER_COLORS : INK_COLORS;
	const active = marker ? markerHex(markerId) : inkHex(inkId);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("flex gap-1", vertical ? "flex-col items-center" : "items-center"),
		children: colors.map((color) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			"aria-label": color.label,
			"aria-pressed": active === color.hex,
			className: cn("size-11 shrink-0 rounded-full border-2", active === color.hex ? "border-ink" : "border-transparent"),
			style: { backgroundColor: color.hex },
			onClick: () => marker ? setMarkerId(color.id) : setInkId(color.id)
		}, color.id))
	});
}
function ToolButton({ id, label, shortcut, icon: Icon, tipSide = "top" }) {
	const tool = useStudio((state) => state.tool);
	const setTool = useStudio((state) => state.setTool);
	const active = tool === id;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tooltip, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipTrigger, {
		asChild: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			"aria-label": `${label} (${shortcut})`,
			"aria-pressed": active,
			className: cn("grid size-11 shrink-0 place-items-center rounded-md text-ink-soft hover:bg-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wax", active && "bg-ink text-folio hover:bg-ink"),
			onClick: () => setTool(id),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-5" })
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TooltipPortal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TooltipContent, {
		side: tipSide,
		className: "z-50 rounded-md bg-ink px-2 py-1 text-xs text-folio",
		children: [
			label,
			" · ",
			shortcut
		]
	}) })] });
}
function IconButton({ label, onClick, disabled, pressed, children, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		"aria-label": label,
		"aria-pressed": pressed,
		disabled,
		onClick,
		className: cn("grid size-11 shrink-0 place-items-center rounded-md text-ink hover:bg-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wax disabled:opacity-30", pressed && "bg-paper", className),
		children
	});
}
function MenuItem({ children, onSelect, disabled }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
		disabled,
		className: "flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm text-ink outline-none data-[disabled]:opacity-40 data-[highlighted]:bg-paper",
		onSelect,
		children
	});
}
function PenMeter({ compact = false }) {
	const [sample, setSample] = (0, import_react.useState)({
		kind: "idle",
		pressure: 0
	});
	(0, import_react.useEffect)(() => {
		let frame = 0;
		let latest = {
			kind: "idle",
			pressure: 0
		};
		return subscribePen((next) => {
			latest = next;
			if (frame) return;
			frame = window.requestAnimationFrame(() => {
				frame = 0;
				setSample(latest);
			});
		});
	}, []);
	const label = sample.kind === "pen" ? "Pluma" : sample.kind === "eraser" ? "Goma" : sample.kind === "touch" ? "Dedo" : sample.kind === "mouse" ? "Ratón" : "Puntero";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn(compact ? "hidden w-24 sm:block" : "w-full px-3 pb-3"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "h-1 overflow-hidden rounded-full bg-line",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "h-full origin-left bg-wax",
				style: { transform: `scaleX(${sample.kind === "idle" ? 0 : sample.pressure})` }
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-xs text-muted",
			children: label
		})]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Studio, {});
}
//#endregion
export { Home as component };
