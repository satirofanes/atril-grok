export const DOC_KINDS = [
  "pdf",
  "docx",
  "odt",
  "epub",
  "fb2",
  "pptx",
  "xlsx",
  "text",
  "html",
  "md",
  "rtf",
  "csv",
] as const;

export type DocKind = (typeof DOC_KINDS)[number];

export type Tool = "pen" | "marker" | "note" | "select" | "eraser" | "hand";

export type Point = { x: number; y: number; p: number };

export type Stroke = {
  id: string;
  kind: "pen" | "marker";
  page: number;
  color: string;
  size: number;
  points: Point[];
  clave: string;
  comment: string;
  createdAt: number;
};

export type Note = {
  id: string;
  kind: "note";
  page: number;
  y: number;
  color: string;
  clave: string;
  comment: string;
  createdAt: number;
};

export type Quote = {
  id: string;
  kind: "quote";
  page: number;
  y: number;
  color: string;
  clave: string;
  comment: string;
  quote: string;
  createdAt: number;
};

export type Mark = Stroke | Note | Quote;

export type AnnotationFile = {
  version: 1;
  strokes: Stroke[];
  notes: Note[];
  quotes: Quote[];
};

export type PageModel =
  | { type: "html"; html: string; title: string }
  | { type: "table"; title: string; rows: string[][] }
  | { type: "slide"; title: string; lines: string[] }
  | { type: "pdf" };

export type ParsedDoc = {
  pages: PageModel[];
  warnings: string[];
  dispose: () => void;
};

export type DocMeta = {
  id: string;
  name: string;
  kind: DocKind;
  pageCount: number;
  addedAt: number;
};

export const KIND_LABEL: Record<DocKind, string> = {
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
  csv: "CSV",
};

export const INK_COLORS = [
  { id: "ink", label: "Tinta", hex: "#1c1915" },
  { id: "blue", label: "Azul", hex: "#1e4d8c" },
  { id: "wax", label: "Lacre", hex: "#8f2d2d" },
  { id: "forest", label: "Bosque", hex: "#1e6b45" },
] as const;

export const MARKER_COLORS = [
  { id: "amber", label: "Ámbar", hex: "#e6b325" },
  { id: "rose", label: "Rosa", hex: "#e39aaf" },
  { id: "moss", label: "Musgo", hex: "#7dbe6a" },
] as const;

export type InkId = (typeof INK_COLORS)[number]["id"];
export type MarkerId = (typeof MARKER_COLORS)[number]["id"];

export function emptyAnno(): AnnotationFile {
  return { version: 1, strokes: [], notes: [], quotes: [] };
}

export function allMarks(anno: AnnotationFile): Mark[] {
  return [...anno.strokes, ...anno.notes, ...anno.quotes];
}

export function markY(mark: Mark): number {
  if (mark.kind === "note" || mark.kind === "quote") return mark.y;
  return mark.points[0]?.y ?? 0;
}

export function inkHex(id: string): string {
  return INK_COLORS.find((c) => c.id === id)?.hex ?? INK_COLORS[0].hex;
}

export function markerHex(id: string): string {
  return MARKER_COLORS.find((c) => c.id === id)?.hex ?? MARKER_COLORS[0].hex;
}

export function highlightName(hex: string): string {
  const found = MARKER_COLORS.find((c) => c.hex === hex);
  return `atril-${found?.id ?? "amber"}`;
}

export function sizeFromStep(step: number, kind: "pen" | "marker"): number {
  const base = 0.0018 + step * 0.0014;
  return kind === "marker" ? base * 2.6 : base;
}
