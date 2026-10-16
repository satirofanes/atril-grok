import * as Menu from "@radix-ui/react-dropdown-menu";
import * as Tooltip from "@radix-ui/react-tooltip";
import {
  BookOpen,
  Download,
  Eraser,
  Hand,
  Highlighter,
  List,
  Minus,
  MoreHorizontal,
  MousePointer2,
  PenLine,
  Plus,
  Printer,
  Redo2,
  StickyNote,
  Undo2,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { toast, Toaster } from "sonner";
import { HelpDialog, LibraryDialog } from "@/components/studio/dialogs";
import { IndexPanel } from "@/components/studio/index-panel";
import { DocumentView } from "@/components/studio/pages";
import { cn } from "@/lib/cn";
import { downloadBlob, fileStamp } from "@/lib/download";
import { exportAnnotatedPdf } from "@/lib/export-pdf";
import { peekBytes, saveAnno } from "@/lib/library";
import { subscribePen, type PenSample } from "@/lib/pen-signal";
import { useStudio } from "@/lib/studio-store";
import type { Tool } from "@/lib/types";
import { INK_COLORS, MARKER_COLORS, inkHex, markerHex } from "@/lib/types";

const TOOLS: { id: Tool; label: string; shortcut: string; icon: ComponentType<{ className?: string }> }[] = [
  { id: "hand", label: "Mano", shortcut: "H", icon: Hand },
  { id: "select", label: "Selección", shortcut: "V", icon: MousePointer2 },
  { id: "pen", label: "Pluma", shortcut: "P", icon: PenLine },
  { id: "marker", label: "Marcador", shortcut: "M", icon: Highlighter },
  { id: "note", label: "Nota al margen", shortcut: "N", icon: StickyNote },
  { id: "eraser", label: "Goma", shortcut: "E", icon: Eraser },
];

const ACCEPT =
  ".pdf,.docx,.odt,.epub,.fb2,.pptx,.xlsx,.xls,.ods,.csv,.txt,.md,.markdown,.html,.htm,.rtf,.log,.json";

export function Studio() {
  const booted = useStudio((state) => state.booted);
  const boot = useStudio((state) => state.boot);
  useEffect(() => {
    void boot();
  }, [boot]);
  if (!booted) {
    return (
      <main className="flex min-h-dvh flex-col bg-wall text-ink">
        <header className="flex h-14 items-center border-b border-line bg-folio px-4">
          <p className="font-serif text-3xl leading-none">Atril</p>
        </header>
        <p className="px-4 py-6 text-muted">Abriendo el cuaderno…</p>
      </main>
    );
  }
  return <StudioShell />;
}

function StudioShell() {
  const fileRef = useRef<HTMLInputElement>(null);
  const marksRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [dragOver, setDragOver] = useState(false);
  const [pageWidth, setPageWidth] = useState(() =>
    measurePage(useStudio.getState().zoom, window.innerWidth, false),
  );
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
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = frameRef.current;
    if (!element) return;
    const measure = () => setPageWidth(measurePage(zoom, element.clientWidth, indexOpen));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [zoom, indexOpen]);

  useEffect(() => {
    if (!booted || !activeId) return;
    const handle = window.setTimeout(() => {
      void saveAnno(activeId, anno);
    }, 250);
    return () => window.clearTimeout(handle);
  }, [booted, activeId, anno]);

  useEffect(() => {
    if (!focusId) return;
    const frame = window.requestAnimationFrame(() => {
      const field =
        document.querySelector<HTMLTextAreaElement>(`[data-margin-comment="${focusId}"]`) ??
        document.querySelector<HTMLTextAreaElement>(`[data-index-comment="${focusId}"]`);
      field?.focus();
      clearFocus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [focusId, clearFocus]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const state = useStudio.getState();
      const target = event.target instanceof HTMLElement ? event.target : null;
      const typing = Boolean(
        target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable),
      );
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) state.redo();
        else state.undo();
        return;
      }
      if (event.key === "Escape") state.select(null);
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;
      const key = event.key.toLowerCase();
      const toolByKey: Partial<Record<string, Tool>> = {
        p: "pen",
        m: "marker",
        n: "note",
        v: "select",
        h: "hand",
        e: "eraser",
      };
      const next = toolByKey[key];
      if (next) state.setTool(next);
      if ((event.key === "Delete" || event.key === "Backspace") && state.selectedId) {
        event.preventDefault();
        state.deleteMark(state.selectedId);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function takeFiles(files: File[]) {
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
    const payload = { atril: 1, document: doc.name, ...useStudio.getState().anno };
    downloadBlob(
      fileStamp(doc.name, "atril.json"),
      new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }),
    );
  }

  return (
    <Tooltip.Provider delayDuration={280}>
      <div
        className="shell flex h-dvh flex-col bg-wall text-ink"
        onDragEnter={(event) => {
          if (![...event.dataTransfer.types].includes("Files")) return;
          event.preventDefault();
          dragDepth.current += 1;
          setDragOver(true);
        }}
        onDragOver={(event) => {
          if ([...event.dataTransfer.types].includes("Files")) event.preventDefault();
        }}
        onDragLeave={() => {
          dragDepth.current -= 1;
          if (dragDepth.current <= 0) {
            dragDepth.current = 0;
            setDragOver(false);
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          dragDepth.current = 0;
          setDragOver(false);
          void takeFiles([...event.dataTransfer.files]);
        }}
      >
        <header className="no-print z-40 flex h-14 shrink-0 items-center gap-2 border-b border-line bg-folio px-3">
          <p className="font-serif text-3xl leading-none">Atril</p>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-ink-soft">{doc?.name ?? "Sin documento"}</p>
          </div>
          <PenMeter compact />
          <div className="hidden items-center md:flex">
            <IconButton label="Alejar" onClick={() => setZoom(zoom - 0.1)}>
              <Minus className="size-4" />
            </IconButton>
            <span className="w-12 text-center text-xs text-muted">{Math.round(zoom * 100)}%</span>
            <IconButton label="Acercar" onClick={() => setZoom(zoom + 0.1)}>
              <Plus className="size-4" />
            </IconButton>
          </div>
          <IconButton label="Deshacer" disabled={past === 0} className="hidden sm:grid" onClick={() => useStudio.getState().undo()}>
            <Undo2 className="size-4" />
          </IconButton>
          <IconButton label="Rehacer" disabled={future === 0} className="hidden sm:grid" onClick={() => useStudio.getState().redo()}>
            <Redo2 className="size-4" />
          </IconButton>
          <IconButton label="Abrir documento" onClick={() => fileRef.current?.click()}>
            <Upload className="size-4" />
          </IconButton>
          <IconButton label="Biblioteca" className="hidden sm:grid" onClick={() => setLibraryOpen(true)}>
            <BookOpen className="size-4" />
          </IconButton>
          <IconButton
            label="Índice de claves"
            pressed={indexOpen}
            onClick={() => setIndexOpen(!indexOpen)}
          >
            <List className="size-4" />
          </IconButton>
          <Menu.Root>
            <Menu.Trigger className="grid size-11 place-items-center rounded-md text-ink hover:bg-paper" aria-label="Más acciones">
              <MoreHorizontal className="size-4" />
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Content className="z-50 min-w-52 rounded-md border border-line bg-folio p-1 shadow-folio" align="end" sideOffset={6}>
                <MenuItem onSelect={exportJson} disabled={!doc}>
                  <Download className="size-4" /> Descargar marcas
                </MenuItem>
                <MenuItem onSelect={() => marksRef.current?.click()} disabled={!doc}>
                  Cargar marcas
                </MenuItem>
                <MenuItem onSelect={() => void exportPdf()} disabled={doc?.kind !== "pdf"}>
                  PDF con tinta
                </MenuItem>
                <MenuItem onSelect={() => window.print()} disabled={!doc}>
                  <Printer className="size-4" /> Imprimir dossier
                </MenuItem>
                <MenuItem onSelect={() => setShowClaves(!showClaves)}>
                  {showClaves ? "Ocultar claves" : "Mostrar claves"}
                </MenuItem>
                <MenuItem onSelect={() => setZoom(1)}>Tamaño 100%</MenuItem>
                <MenuItem onSelect={() => setHelpOpen(true)}>Cómo se anota</MenuItem>
              </Menu.Content>
            </Menu.Portal>
          </Menu.Root>
        </header>
        {bootError && <p className="bg-wax-soft px-4 py-2 text-sm text-ink">{bootError}</p>}
        {busy && <p className="bg-paper px-4 py-2 text-sm text-muted">{busy}</p>}
        <div ref={frameRef} className="flex min-h-0 flex-1">
          <ToolRail />
          <DocumentView pageWidth={pageWidth} />
          <IndexPanel />
        </div>
        <nav
          className={cn(
            "no-print flex h-16 shrink-0 items-center gap-1 overflow-x-auto border-t border-line bg-folio px-2 md:hidden",
            indexOpen && "hidden",
          )}
          aria-label="Herramientas"
        >
          {TOOLS.map((item) => (
            <ToolButton key={item.id} {...item} />
          ))}
          <Palette />
          <IconButton label="Deshacer" disabled={past === 0} onClick={() => useStudio.getState().undo()}>
            <Undo2 className="size-4" />
          </IconButton>
          <IconButton label="Rehacer" disabled={future === 0} onClick={() => useStudio.getState().redo()}>
            <Redo2 className="size-4" />
          </IconButton>
        </nav>
        {dragOver && (
          <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center bg-ink/40">
            <p className="rounded-md bg-folio px-6 py-4 font-serif text-2xl text-ink">Suelta el documento</p>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="sr-only"
          onChange={(event) => {
            void takeFiles([...(event.target.files ?? [])]);
            event.target.value = "";
          }}
        />
        <input
          ref={marksRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            void importAnnoFile(file).then(
              () => toast("Marcas cargadas"),
              (error: unknown) => toast.error(error instanceof Error ? error.message : "No se pudieron leer las marcas."),
            );
          }}
        />
        <LibraryDialog onOpenFile={() => fileRef.current?.click()} />
        <HelpDialog />
        <Toaster position="top-center" />
        <span className="sr-only">Herramienta actual: {tool}</span>
      </div>
    </Tooltip.Provider>
  );
}

function measurePage(zoom: number, frameWidth: number, indexOpen: boolean): number {
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
  return (
    <aside className="no-print hidden w-rail shrink-0 flex-col items-center gap-1 overflow-y-auto border-r border-line bg-folio py-2 md:flex">
      {TOOLS.map((item) => (
        <ToolButton key={item.id} {...item} tipSide="right" />
      ))}
      <Palette vertical />
      <label className="mt-2 w-full px-3">
        <span className="sr-only">Grosor del trazo</span>
        <input
          type="range"
          min={1}
          max={8}
          value={sizeStep}
          aria-label="Grosor del trazo"
          onChange={(event) => setSizeStep(Number(event.target.value))}
          className="w-full accent-wax"
        />
      </label>
      <div className="mt-auto flex flex-col">
        <IconButton label="Deshacer" disabled={past === 0} onClick={() => useStudio.getState().undo()}>
          <Undo2 className="size-4" />
        </IconButton>
        <IconButton label="Rehacer" disabled={future === 0} onClick={() => useStudio.getState().redo()}>
          <Redo2 className="size-4" />
        </IconButton>
      </div>
      <PenMeter />
    </aside>
  );
}

function Palette({ vertical = false }: { vertical?: boolean }) {
  const tool = useStudio((state) => state.tool);
  const inkId = useStudio((state) => state.inkId);
  const markerId = useStudio((state) => state.markerId);
  const setInkId = useStudio((state) => state.setInkId);
  const setMarkerId = useStudio((state) => state.setMarkerId);
  const marker = tool === "marker";
  const colors = marker ? MARKER_COLORS : INK_COLORS;
  const active = marker ? markerHex(markerId) : inkHex(inkId);
  return (
    <div className={cn("flex gap-1", vertical ? "flex-col items-center" : "items-center")}>
      {colors.map((color) => (
        <button
          key={color.id}
          type="button"
          aria-label={color.label}
          aria-pressed={active === color.hex}
          className={cn(
            "size-11 shrink-0 rounded-full border-2",
            active === color.hex ? "border-ink" : "border-transparent",
          )}
          style={{ backgroundColor: color.hex }}
          onClick={() => (marker ? setMarkerId(color.id) : setInkId(color.id))}
        />
      ))}
    </div>
  );
}

function ToolButton({
  id,
  label,
  shortcut,
  icon: Icon,
  tipSide = "top",
}: {
  id: Tool;
  label: string;
  shortcut: string;
  icon: ComponentType<{ className?: string }>;
  tipSide?: "top" | "right";
}) {
  const tool = useStudio((state) => state.tool);
  const setTool = useStudio((state) => state.setTool);
  const active = tool === id;
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button
          type="button"
          aria-label={`${label} (${shortcut})`}
          aria-pressed={active}
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-md text-ink-soft hover:bg-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wax",
            active && "bg-ink text-folio hover:bg-ink",
          )}
          onClick={() => setTool(id)}
        >
          <Icon className="size-5" />
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content side={tipSide} className="z-50 rounded-md bg-ink px-2 py-1 text-xs text-folio">
          {label} · {shortcut}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  pressed,
  children,
  className,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-md text-ink hover:bg-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wax disabled:opacity-30",
        pressed && "bg-paper",
        className,
      )}
    >
      {children}
    </button>
  );
}

function MenuItem({
  children,
  onSelect,
  disabled,
}: {
  children: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
}) {
  return (
    <Menu.Item
      disabled={disabled}
      className="flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm text-ink outline-none data-[disabled]:opacity-40 data-[highlighted]:bg-paper"
      onSelect={onSelect}
    >
      {children}
    </Menu.Item>
  );
}

function PenMeter({ compact = false }: { compact?: boolean }) {
  const [sample, setSample] = useState<PenSample>({ kind: "idle", pressure: 0 });
  useEffect(() => {
    let frame = 0;
    let latest: PenSample = { kind: "idle", pressure: 0 };
    return subscribePen((next) => {
      latest = next;
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        setSample(latest);
      });
    });
  }, []);
  const label =
    sample.kind === "pen"
      ? "Pluma"
      : sample.kind === "eraser"
        ? "Goma"
        : sample.kind === "touch"
          ? "Dedo"
          : sample.kind === "mouse"
            ? "Ratón"
            : "Puntero";
  return (
    <div className={cn(compact ? "hidden w-24 sm:block" : "w-full px-3 pb-3")}>
      <div className="h-1 overflow-hidden rounded-full bg-line">
        <div
          className="h-full origin-left bg-wax"
          style={{ transform: `scaleX(${sample.kind === "idle" ? 0 : sample.pressure})` }}
        />
      </div>
      <p className="mt-1 text-xs text-muted">{label}</p>
    </div>
  );
}
