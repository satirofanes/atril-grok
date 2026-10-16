import { create } from "zustand";
import { exportSchema, normalizeAnno } from "@/lib/anno-schema";
import { claveTaken, nextClave } from "@/lib/clave";
import { deleteDocs, loadDoc, loadLibrary, peekBytes, putDoc, saveAnno } from "@/lib/library";
import { parseDocument } from "@/lib/parse-document";
import { releasePdf } from "@/lib/pdf-client";
import { buildEssayRecord, buildSamplePdf, SAMPLE_ESSAY_ID, SAMPLE_PDF_ID } from "@/lib/sample";
import { detectFile } from "@/lib/text-format";
import type { AnnotationFile, DocKind, DocMeta, Note, Quote, Stroke, Tool } from "@/lib/types";
import { emptyAnno, markerHex } from "@/lib/types";

const SEED_KEY = "atril-seed";
const PREFS_KEY = "atril-prefs";
const ACTIVE_KEY = "atril-active";
const PDF_FLAG = "atril-pdf-seeded";
const SEED_VERSION = "1";

type Prefs = {
  tool: Tool;
  inkId: string;
  markerId: string;
  sizeStep: number;
  zoom: number;
  showClaves: boolean;
};

export type StudioState = Prefs & {
  booted: boolean;
  bootError: string | null;
  busy: string | null;
  docs: DocMeta[];
  activeId: string | null;
  anno: AnnotationFile;
  past: AnnotationFile[];
  future: AnnotationFile[];
  selectedId: string | null;
  indexOpen: boolean;
  libraryOpen: boolean;
  helpOpen: boolean;
  focusId: string | null;
  boot: () => Promise<void>;
  openDoc: (id: string) => Promise<void>;
  importFiles: (files: File[]) => Promise<void>;
  removeDoc: (id: string) => Promise<void>;
  restoreSamples: () => Promise<void>;
  setTool: (tool: Tool) => void;
  setInkId: (id: string) => void;
  setMarkerId: (id: string) => void;
  setSizeStep: (step: number) => void;
  setZoom: (zoom: number) => void;
  setShowClaves: (show: boolean) => void;
  setIndexOpen: (open: boolean) => void;
  setLibraryOpen: (open: boolean) => void;
  setHelpOpen: (open: boolean) => void;
  select: (id: string | null) => void;
  clearFocus: () => void;
  commitStroke: (draft: Omit<Stroke, "id" | "clave" | "comment" | "createdAt">) => void;
  addNote: (page: number, y: number, comment?: string) => void;
  addQuote: (page: number, y: number, quote: string) => void;
  updateComment: (id: string, comment: string) => void;
  renameMark: (id: string, clave: string) => boolean;
  recolorMark: (id: string, color: string) => void;
  deleteMark: (id: string) => void;
  eraseAt: (page: number, x: number, y: number, threshold: number, record: boolean) => void;
  undo: () => void;
  redo: () => void;
  replaceAnno: (anno: AnnotationFile) => void;
  importAnnoFile: (file: File) => Promise<void>;
};

const parsedCache = new Map<string, Awaited<ReturnType<typeof parseDocument>>>();

export function cachedParsed(id: string) {
  return parsedCache.get(id);
}

export function rememberParsed(id: string, doc: Awaited<ReturnType<typeof parseDocument>>) {
  const previous = parsedCache.get(id);
  if (previous && previous !== doc) previous.dispose();
  parsedCache.set(id, doc);
}

function forgetParsed(id: string) {
  parsedCache.get(id)?.dispose();
  parsedCache.delete(id);
  void releasePdf(id);
}

let bootOnce: Promise<void> | null = null;

function readPrefs(): Partial<Prefs> {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw) as Partial<Prefs>;
    const tools: Tool[] = ["pen", "marker", "note", "select", "eraser", "hand"];
    if (data.tool && !tools.includes(data.tool)) delete data.tool;
    return data;
  } catch {
    return {};
  }
}

function writePrefs(state: StudioState) {
  try {
    const prefs: Prefs = {
      tool: state.tool,
      inkId: state.inkId,
      markerId: state.markerId,
      sizeStep: state.sizeStep,
      zoom: state.zoom,
      showClaves: state.showClaves,
    };
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    if (state.activeId) localStorage.setItem(ACTIVE_KEY, state.activeId);
  } catch {
    /* private mode */
  }
}

function withHistory(state: StudioState, anno: AnnotationFile): Pick<StudioState, "anno" | "past" | "future"> {
  return {
    anno,
    past: [...state.past, state.anno].slice(-40),
    future: [],
  };
}

function patchMark(
  anno: AnnotationFile,
  id: string,
  patch: { clave?: string; comment?: string; color?: string },
): AnnotationFile {
  return {
    version: 1,
    strokes: anno.strokes.map((mark) => (mark.id === id ? { ...mark, ...patch, kind: mark.kind } : mark)),
    notes: anno.notes.map((mark) => (mark.id === id ? { ...mark, ...patch, kind: "note" as const } : mark)),
    quotes: anno.quotes.map((mark) => (mark.id === id ? { ...mark, ...patch, kind: "quote" as const } : mark)),
  };
}

function patchEverywhere(
  state: StudioState,
  id: string,
  patch: { clave?: string; comment?: string; color?: string },
): Partial<StudioState> {
  return {
    anno: patchMark(state.anno, id, patch),
    past: state.past.map((anno) => patchMark(anno, id, patch)),
    future: state.future.map((anno) => patchMark(anno, id, patch)),
  };
}

async function ensurePdfSample(set: (partial: Partial<StudioState>) => void, get: () => StudioState) {
  try {
    if (localStorage.getItem(PDF_FLAG) === "1") return;
    if (get().docs.some((doc) => doc.id === SAMPLE_PDF_ID)) {
      localStorage.setItem(PDF_FLAG, "1");
      return;
    }
    const pdf = await buildSamplePdf();
    await putDoc(pdf.meta, pdf.bytes, emptyAnno());
    localStorage.setItem(PDF_FLAG, "1");
    set({ docs: [pdf.meta, ...get().docs.filter((doc) => doc.id !== SAMPLE_PDF_ID)] });
  } catch {
    /* the essay still opens */
  }
}

export const useStudio = create<StudioState>((set, get) => ({
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
        set({ ...prefs, zoom: clampZoom(prefs.zoom ?? 1), sizeStep: clampStep(prefs.sizeStep ?? 3) });
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
            bootError: null,
          });
          writePrefs(get());
        } else {
          set({ booted: true, docs: metas, activeId: null, anno: emptyAnno() });
        }
        void ensurePdfSample(set, get);
      } catch (error) {
        set({
          booted: true,
          bootError: error instanceof Error ? error.message : "No se pudo abrir la biblioteca.",
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
      libraryOpen: false,
    });
    writePrefs(get());
  },

  importFiles: async (files) => {
    try {
      for (const file of files) {
        if (file.size > 60 * 1024 * 1024) throw new Error(`${file.name} supera 60 MB.`);
        const detected = detectFile(file.name);
        if ("error" in detected) throw new Error(detected.error);
        set({ busy: `Leyendo ${file.name}…` });
        const bytes = await file.arrayBuffer();
        const parsed = await parseDocument(detected.kind, bytes);
        const meta: DocMeta = {
          id: crypto.randomUUID(),
          name: file.name,
          kind: detected.kind,
          pageCount: parsed.pages.length,
          addedAt: Date.now(),
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
          libraryOpen: false,
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
      set({ docs, activeId: null, anno: emptyAnno(), past: [], future: [], selectedId: null });
      return;
    }
    const full = await loadDoc(next.id);
    set({
      docs,
      activeId: next.id,
      anno: full?.anno ?? emptyAnno(),
      past: [],
      future: [],
      selectedId: null,
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
    const metas = await loadLibrary();
    set({
      docs: metas,
      activeId: essay.meta.id,
      anno: essay.anno,
      past: [],
      future: [],
      selectedId: null,
      libraryOpen: false,
    });
    writePrefs(get());
  },

  setTool: (tool) => {
    set({ tool });
    writePrefs(get());
  },
  setInkId: (inkId) => {
    set({ inkId, tool: "pen" });
    writePrefs(get());
  },
  setMarkerId: (markerId) => {
    set({ markerId, tool: "marker" });
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
  select: (selectedId) => set({ selectedId, indexOpen: selectedId ? true : get().indexOpen }),
  clearFocus: () => set({ focusId: null }),

  commitStroke: (draft) => {
    const state = get();
    const stroke: Stroke = {
      ...draft,
      id: crypto.randomUUID(),
      clave: nextClave(draft.kind, state.anno),
      comment: "",
      createdAt: Date.now(),
    };
    set({
      ...withHistory(state, { ...state.anno, strokes: [...state.anno.strokes, stroke] }),
    });
  },

  addNote: (page, y, comment = "") => {
    const state = get();
    const note: Note = {
      id: crypto.randomUUID(),
      kind: "note",
      page,
      y,
      color: "#8f2d2d",
      clave: nextClave("note", state.anno),
      comment: comment.slice(0, 8000),
      createdAt: Date.now(),
    };
    const narrow = typeof window !== "undefined" && window.innerWidth < 1024;
    set({
      ...withHistory(state, { ...state.anno, notes: [...state.anno.notes, note] }),
      selectedId: note.id,
      focusId: note.id,
      indexOpen: narrow ? true : state.indexOpen,
    });
  },

  addQuote: (page, y, quote) => {
    const text = quote.trim();
    if (text.length < 2) return;
    const state = get();
    const mark: Quote = {
      id: crypto.randomUUID(),
      kind: "quote",
      page,
      y,
      color: markerHex(state.markerId),
      clave: nextClave("quote", state.anno),
      comment: "",
      quote: text.slice(0, 2000),
      createdAt: Date.now(),
    };
    set({
      ...withHistory(state, { ...state.anno, quotes: [...state.anno.quotes, mark] }),
      selectedId: mark.id,
      focusId: mark.id,
      indexOpen: true,
    });
  },

  updateComment: (id, comment) => {
    set(patchEverywhere(get(), id, { comment: comment.slice(0, 8000) }));
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
    const anno: AnnotationFile = {
      version: 1,
      strokes: state.anno.strokes.filter((mark) => mark.id !== id),
      notes: state.anno.notes.filter((mark) => mark.id !== id),
      quotes: state.anno.quotes.filter((mark) => mark.id !== id),
    };
    set({
      ...withHistory(state, anno),
      selectedId: state.selectedId === id ? null : state.selectedId,
    });
  },

  eraseAt: (page, x, y, threshold, record) => {
    const state = get();
    const drop = new Set(
      state.anno.strokes
        .filter((stroke) => stroke.page === page && strokeNear(stroke, x, y, threshold))
        .map((stroke) => stroke.id),
    );
    if (drop.size === 0) return;
    const anno: AnnotationFile = {
      ...state.anno,
      strokes: state.anno.strokes.filter((stroke) => !drop.has(stroke.id)),
    };
    set({
      anno,
      past: record ? [...state.past, state.anno].slice(-40) : state.past,
      future: record ? [] : state.future,
      selectedId: state.selectedId && drop.has(state.selectedId) ? null : state.selectedId,
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
      selectedId: null,
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
      selectedId: null,
    });
  },

  replaceAnno: (anno) => {
    const state = get();
    set({ ...withHistory(state, anno), selectedId: null });
  },

  importAnnoFile: async (file) => {
    const data: unknown = JSON.parse(await file.text());
    const parsed = exportSchema.safeParse(data);
    if (!parsed.success) throw new Error("Ese archivo no es un índice de Atril.");
    get().replaceAnno(dedupe(normalizeAnno(parsed.data)));
  },
}));

function clampZoom(zoom: number): number {
  if (!Number.isFinite(zoom)) return 1;
  return Math.min(1.8, Math.max(0.7, zoom));
}

function clampStep(step: number): number {
  if (!Number.isFinite(step)) return 3;
  return Math.min(8, Math.max(1, Math.round(step)));
}

function strokeNear(stroke: Stroke, x: number, y: number, threshold: number): boolean {
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

function dedupe(anno: AnnotationFile): AnnotationFile {
  const seen = new Set<string>();
  const fix = <T extends { clave: string }>(mark: T): T => {
    let clave = mark.clave;
    while (seen.has(clave)) clave = `${clave}-2`;
    seen.add(clave);
    return clave === mark.clave ? mark : { ...mark, clave };
  };
  return {
    version: 1,
    strokes: anno.strokes.map(fix),
    notes: anno.notes.map(fix),
    quotes: anno.quotes.map(fix),
  };
}

export function activeKind(state: StudioState): DocKind | null {
  return state.docs.find((doc) => doc.id === state.activeId)?.kind ?? null;
}
