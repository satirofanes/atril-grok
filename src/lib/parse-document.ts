import { countPdfPages } from "@/lib/pdf-client";
import {
  decodeText,
  markdownToHtml,
  parseCsv,
  rtfToText,
  sanitizeHtml,
  splitHtmlToPages,
  textToHtml,
} from "@/lib/text-format";
import type { DocKind, PageModel, ParsedDoc } from "@/lib/types";

const EMPTY: ParsedDoc = {
  pages: [{ type: "html", title: "Documento", html: "<p>No se pudo leer el archivo.</p>" }],
  warnings: [],
  dispose: () => undefined,
};

export async function parseDocument(kind: DocKind, bytes: ArrayBuffer): Promise<ParsedDoc> {
  switch (kind) {
    case "pdf":
      return parsePdf(bytes);
    case "docx":
      return parseDocx(bytes);
    case "odt":
      return parseOdt(bytes);
    case "epub":
      return parseEpub(bytes);
    case "fb2":
      return parseFb2(bytes);
    case "pptx":
      return parsePptx(bytes);
    case "xlsx":
      return parseSheet(bytes);
    case "csv":
      return {
        pages: [{ type: "table", title: "Tabla", rows: parseCsv(decodeText(bytes)) }],
        warnings: [],
        dispose: () => undefined,
      };
    case "md":
      return htmlDoc(markdownToHtml(decodeText(bytes)));
    case "html":
      return htmlDoc(sanitizeHtml(decodeText(bytes)));
    case "rtf":
      return htmlDoc(textToHtml(rtfToText(decodeText(bytes))));
    case "text":
      return htmlDoc(textToHtml(decodeText(bytes)));
    default:
      return EMPTY;
  }
}

function htmlDoc(html: string, warnings: string[] = []): ParsedDoc {
  const pages = splitHtmlToPages(html).map((page) => ({
    type: "html" as const,
    title: page.title,
    html: page.html,
  }));
  return {
    pages: pages.length > 0 ? pages : [{ type: "html", title: "Documento", html: "<p>Documento vacío.</p>" }],
    warnings,
    dispose: () => undefined,
  };
}

async function parsePdf(bytes: ArrayBuffer): Promise<ParsedDoc> {
  const count = await countPdfPages(bytes);
  if (count < 1) throw new Error("El PDF no tiene páginas.");
  const pages: PageModel[] = Array.from({ length: count }, () => ({ type: "pdf" }));
  const warnings = count > 400 ? ["Documento largo: las páginas se pintan al acercarte."] : [];
  return { pages, warnings, dispose: () => undefined };
}

async function parseDocx(bytes: ArrayBuffer): Promise<ParsedDoc> {
  const mod = await import("mammoth");
  const mammoth = mod.default ?? (mod as unknown as typeof mod.default);
  const result = await mammoth.convertToHtml(
    { arrayBuffer: bytes },
    {
      convertImage: mammoth.images.imgElement(async (image) => {
        const base64 = await image.readAsBase64String();
        return { src: `data:${image.contentType};base64,${base64}` };
      }),
    },
  );
  const warnings = result.messages.slice(0, 3).map((message) => message.message);
  return htmlDoc(sanitizeHtml(result.value), warnings);
}

function zipPath(base: string, href: string): string {
  const raw = `${base}${href}`.split("#")[0]?.split("?")[0] ?? "";
  const parts: string[] = [];
  for (const part of raw.split(/[/\\]/)) {
    if (!part || part === ".") continue;
    if (part === "..") parts.pop();
    else parts.push(decodeURIComponent(part));
  }
  return parts.join("/");
}

function mimeFromName(path: string): string {
  const ext = path.toLowerCase().split(".").pop();
  if (ext === "png") return "image/png";
  if (ext === "gif") return "image/gif";
  if (ext === "webp") return "image/webp";
  if (ext === "svg") return "image/svg+xml";
  return "image/jpeg";
}

async function parseOdt(bytes: ArrayBuffer): Promise<ParsedDoc> {
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(bytes);
  const content = await zip.file("content.xml")?.async("string");
  if (!content) throw new Error("El OpenDocument no tiene content.xml.");
  const doc = new DOMParser().parseFromString(content, "application/xml");
  const parts: string[] = [];
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

function escape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function parseEpub(bytes: ArrayBuffer): Promise<ParsedDoc> {
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(bytes);
  const urls: string[] = [];
  const dispose = () => {
    for (const url of urls) URL.revokeObjectURL(url);
  };
  try {
    const container = await zip.file("META-INF/container.xml")?.async("string");
    if (!container) throw new Error("El EPUB no tiene container.xml.");
    const containerDoc = new DOMParser().parseFromString(container, "application/xml");
    const rootFile = [...containerDoc.getElementsByTagName("*")]
      .find((node) => node.localName === "rootfile")
      ?.getAttribute("full-path");
    if (!rootFile) throw new Error("El EPUB no indica el OPF.");
    const opf = await zip.file(rootFile)?.async("string");
    if (!opf) throw new Error("No se pudo leer el índice del EPUB.");
    const opfDoc = new DOMParser().parseFromString(opf, "application/xml");
    const base = rootFile.includes("/") ? rootFile.slice(0, rootFile.lastIndexOf("/") + 1) : "";
    const manifest = new Map<string, { href: string; type: string }>();
    for (const node of opfDoc.getElementsByTagName("*")) {
      if (node.localName !== "item") continue;
      const id = node.getAttribute("id");
      const href = node.getAttribute("href");
      if (!id || !href) continue;
      manifest.set(id, { href, type: node.getAttribute("media-type") ?? "" });
    }
    const spine: string[] = [];
    for (const node of opfDoc.getElementsByTagName("*")) {
      if (node.localName !== "itemref") continue;
      const idref = node.getAttribute("idref");
      if (idref) spine.push(idref);
    }
    const pages: PageModel[] = [];
    const warnings: string[] = [];
    for (const id of spine) {
      if (pages.length >= 80) {
        warnings.push("Se muestran los primeros 80 capítulos.");
        break;
      }
      const item = manifest.get(id);
      if (!item) continue;
      const isHtml =
        item.type.includes("html") || /\.x?html?$/i.test(item.href);
      if (!isHtml) continue;
      const path = zipPath(base, item.href);
      const raw = await zip.file(path)?.async("string");
      if (!raw) continue;
      const chapter = new DOMParser().parseFromString(raw, "text/html");
      const title =
        chapter.querySelector("h1, h2")?.textContent?.trim() ||
        chapter.querySelector("title")?.textContent?.trim() ||
        `Capítulo ${pages.length + 1}`;
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
      pages.push({ type: "html", title, html: clean });
    }
    if (pages.length === 0) throw new Error("El EPUB no tiene capítulos legibles.");
    return { pages, warnings, dispose };
  } catch (error) {
    dispose();
    throw error;
  }
}

async function parseFb2(bytes: ArrayBuffer): Promise<ParsedDoc> {
  const xml = decodeText(bytes);
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.querySelector("parsererror")) throw new Error("El FB2 no es un XML válido.");
  const parts: string[] = [];
  const bookTitle = [...doc.getElementsByTagName("*")].find((node) => node.localName === "book-title");
  if (bookTitle?.textContent?.trim()) parts.push(`<h1>${escape(bookTitle.textContent.trim())}</h1>`);
  const body = [...doc.getElementsByTagName("*")].find((node) => node.localName === "body");
  if (!body) throw new Error("El FB2 no tiene cuerpo.");
  const walk = (node: Element) => {
    for (const child of [...node.children]) {
      const name = child.localName;
      if (name === "title") {
        const text = (child.textContent ?? "").replace(/\s+/g, " ").trim();
        if (text) parts.push(`<h2>${escape(text)}</h2>`);
      } else if (name === "p" || name === "subtitle" || name === "text-author") {
        const text = (child.textContent ?? "").replace(/\s+/g, " ").trim();
        if (text) parts.push(name === "subtitle" ? `<h3>${escape(text)}</h3>` : `<p>${escape(text)}</p>`);
      } else if (name === "section" || name === "body" || name === "epigraph" || name === "cite") {
        walk(child);
      }
    }
  };
  walk(body);
  return htmlDoc(parts.join("") || "<p>El libro no tiene texto.</p>");
}

async function parsePptx(bytes: ArrayBuffer): Promise<ParsedDoc> {
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(bytes);
  const names = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
    .sort((a, b) => slideNumber(a) - slideNumber(b));
  if (names.length === 0) throw new Error("La presentación no tiene láminas.");
  const pages: PageModel[] = [];
  for (const name of names) {
    const xml = await zip.file(name)?.async("string");
    if (!xml) continue;
    const lines = paragraphs(xml);
    if (lines.length === 0) {
      pages.push({ type: "slide", title: `Lámina ${pages.length + 1}`, lines: ["Lámina sin texto."] });
    } else {
      pages.push({ type: "slide", title: lines[0] ?? "Lámina", lines: lines.slice(1) });
    }
  }
  return { pages, warnings: [], dispose: () => undefined };
}

function slideNumber(path: string): number {
  const match = /(\d+)\.xml$/.exec(path);
  return match ? Number(match[1]) : 0;
}

function paragraphs(xml: string): string[] {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const lines: string[] = [];
  for (const node of doc.getElementsByTagName("*")) {
    if (node.localName !== "p") continue;
    const bits: string[] = [];
    for (const child of node.getElementsByTagName("*")) {
      if (child.localName === "t" && child.textContent) bits.push(child.textContent);
    }
    const line = bits.join("").replace(/\s+/g, " ").trim();
    if (line) lines.push(line);
  }
  return lines;
}

async function parseSheet(bytes: ArrayBuffer): Promise<ParsedDoc> {
  const XLSX = await import("xlsx");
  const book = XLSX.read(bytes, { type: "array" });
  if (book.SheetNames.length === 0) throw new Error("El libro no tiene hojas.");
  const pages: PageModel[] = book.SheetNames.slice(0, 30).map((name) => {
    const sheet = book.Sheets[name];
    const rows = sheet
      ? XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(sheet, {
          header: 1,
          raw: false,
          defval: "",
        })
      : [];
    return {
      type: "table" as const,
      title: name,
      rows: rows.map((row) => (Array.isArray(row) ? row.map((cell) => String(cell ?? "")) : [])),
    };
  });
  const warnings = book.SheetNames.length > 30 ? ["Se muestran las primeras 30 hojas."] : [];
  return { pages, warnings, dispose: () => undefined };
}
