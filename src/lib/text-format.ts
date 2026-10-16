export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function decodeText(bytes: ArrayBuffer): string {
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

const ALLOWED = new Set([
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
  "SMALL",
]);

export function sanitizeHtml(html: string): string {
  if (typeof DOMParser === "undefined") return "";
  const doc = new DOMParser().parseFromString(`<div id="atril-san">${html}</div>`, "text/html");
  const source = doc.getElementById("atril-san");
  if (!source) return "";
  const holder = doc.createElement("div");
  appendClean(source, holder);
  return holder.innerHTML;
}

function appendClean(source: Node, target: Node) {
  for (const child of [...source.childNodes]) {
    if (child.nodeType === Node.TEXT_NODE) {
      target.appendChild(child.cloneNode());
      continue;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) continue;
    const el = child as HTMLElement;
    if (
      el.tagName === "SCRIPT" ||
      el.tagName === "STYLE" ||
      el.tagName === "IFRAME" ||
      el.tagName === "OBJECT" ||
      el.tagName === "LINK" ||
      el.tagName === "META"
    ) {
      continue;
    }
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

function copyAttributes(source: HTMLElement, target: HTMLElement) {
  for (const attr of [...source.attributes]) {
    const name = attr.name.toLowerCase();
    const value = attr.value.trim();
    if (name.startsWith("on") || name === "style") continue;
    if (target.tagName === "A" && name === "href" && /^(https?:|mailto:)/i.test(value)) {
      target.setAttribute("href", value);
      target.setAttribute("rel", "noreferrer");
      target.setAttribute("target", "_blank");
    } else if (target.tagName === "IMG" && name === "alt") {
      target.setAttribute("alt", value.slice(0, 200));
    } else if (
      target.tagName === "IMG" &&
      name === "src" &&
      /^(data:image\/(?:png|jpeg|jpg|gif|webp);base64,|blob:)/i.test(value)
    ) {
      target.setAttribute("src", value);
    } else if ((name === "colspan" || name === "rowspan") && /^\d+$/.test(value)) {
      target.setAttribute(name, value);
    }
  }
}

export function textToHtml(source: string): string {
  const blocks = escapeHtml(source).trim().split(/\n{2,}/);
  if (blocks.length === 0 || (blocks.length === 1 && blocks[0] === "")) {
    return "<p>Este archivo está vacío. Aun así puedes anotar la página.</p>";
  }
  return blocks.map((block) => `<p>${block.replace(/\n/g, "<br>")}</p>`).join("");
}

export function markdownToHtml(source: string): string {
  const lines = escapeHtml(source).replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let list: "ul" | "ol" | null = null;
  const close = () => {
    if (!list) return;
    out.push(list === "ul" ? "</ul>" : "</ol>");
    list = null;
  };
  const inline = (value: string) =>
    value
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>");

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

export function rtfToText(rtf: string): string {
  let value = rtf.replace(/\r\n/g, "\n");
  value = value.replace(/\\'([0-9a-fA-F]{2})/g, (_, hex: string) =>
    String.fromCharCode(Number.parseInt(hex, 16)),
  );
  value = value.replace(/\\u(-?\d+)\??/g, (_, raw: string) => {
    const code = Number(raw);
    return String.fromCharCode(code < 0 ? code + 65536 : code);
  });
  value = value.replace(/\\par[d]?/g, "\n");
  value = value.replace(/\\line/g, "\n");
  value = value.replace(/\\tab/g, "\t");
  value = value.replace(/\{\\\*[^{}]*\}/g, "");
  value = value.replace(/\\[a-zA-Z]+-?\d* ?/g, "");
  value = value.replace(/[{}]/g, "");
  return value.replace(/\n{3,}/g, "\n\n").trim();
}

export function splitHtmlToPages(html: string): { title: string; html: string }[] {
  if (typeof DOMParser === "undefined") return [{ title: "Documento", html }];
  const doc = new DOMParser().parseFromString(`<div id="atril-root">${html}</div>`, "text/html");
  const root = doc.getElementById("atril-root");
  if (!root) return [{ title: "Documento", html }];
  const chunks: { title: string; nodes: Node[] }[] = [];
  let title = "Documento";
  let nodes: Node[] = [];
  const flush = () => {
    if (nodes.length === 0) return;
    chunks.push({ title, nodes });
    nodes = [];
  };
  for (const node of [...root.childNodes]) {
    if (node.nodeType === Node.TEXT_NODE && !(node.textContent ?? "").trim()) continue;
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
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
  if (chunks.length === 0) return [{ title: "Documento", html: "<p>Documento vacío.</p>" }];
  return chunks.map((chunk) => {
    const wrap = doc.createElement("div");
    for (const node of chunk.nodes) wrap.appendChild(node);
    return { title: chunk.title, html: wrap.innerHTML };
  });
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else quoted = false;
      } else cell += char;
      continue;
    }
    if (char === '"') quoted = true;
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

const EXT: Record<string, import("@/lib/types").DocKind> = {
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
  rtf: "rtf",
};

export function detectFile(name: string): { kind: import("@/lib/types").DocKind } | { error: string } {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  if (ext === "doc") {
    return { error: "El .doc antiguo no se puede abrir. Guárdalo como .docx." };
  }
  if (ext === "ppt") {
    return { error: "El .ppt antiguo no se puede abrir. Guárdalo como .pptx." };
  }
  if (ext === "mobi" || ext === "azw" || ext === "azw3" || ext === "kfx") {
    return { error: "MOBI y AZW suelen ir cifrados. Exporta un EPUB y ábrelo aquí." };
  }
  const kind = EXT[ext];
  if (!kind) {
    return {
      error: "Ese formato no está en el atril. Prueba PDF, Word, EPUB, FB2, PowerPoint, Excel o texto.",
    };
  }
  return { kind };
}
