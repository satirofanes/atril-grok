import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { InkLayer } from "@/components/studio/ink-layer";
import { findQuoteRange, hitStroke } from "@/lib/geometry";
import { clamp01 } from "@/lib/geometry";
import { peekBytes } from "@/lib/library";
import { parseDocument } from "@/lib/parse-document";
import { openPdf } from "@/lib/pdf-client";
import { cachedParsed, rememberParsed, useStudio } from "@/lib/studio-store";
import type { Note, PageModel, ParsedDoc, Quote, Stroke } from "@/lib/types";
import { highlightName } from "@/lib/types";
import { cn } from "@/lib/cn";

export function DocumentView({ pageWidth }: { pageWidth: number }) {
  const activeId = useStudio((state) => state.activeId);
  const kind = useStudio((state) => state.docs.find((doc) => doc.id === state.activeId)?.kind);
  const quotes = useStudio((state) => state.anno.quotes);
  const [parsed, setParsed] = useState<ParsedDoc | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [selection, setSelection] = useState<{ text: string; page: number; y: number; left: number; top: number } | null>(
    null,
  );
  const scrollerRef = useRef<HTMLDivElement>(null);
  const addQuote = useStudio((state) => state.addQuote);
  const addNote = useStudio((state) => state.addNote);

  useEffect(() => {
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
    void parseDocument(kind, bytes).then(
      (result) => {
        if (cancel) {
          result.dispose();
          return;
        }
        rememberParsed(activeId, result);
        setParsed(result);
        setCurrent(0);
      },
      (reason: unknown) => {
        if (!cancel) setError(reason instanceof Error ? reason.message : "No se pudo leer el documento.");
      },
    );
    return () => {
      cancel = true;
    };
  }, [activeId, kind]);

  useEffect(() => {
    const registry = (
      CSS as unknown as {
        highlights?: { set: (name: string, value: object) => void; delete: (name: string) => void };
      }
    ).highlights;
    const HighlightCtor = (window as unknown as { Highlight?: new (...ranges: Range[]) => object }).Highlight;
    if (!registry || !HighlightCtor) return;
    const names = ["atril-amber", "atril-rose", "atril-moss"];
    for (const name of names) registry.delete(name);
    const groups = new Map<string, Range[]>();
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
  }, [quotes, parsed, pageWidth]);

  useEffect(() => {
    const onSelection = () => {
      const selected = window.getSelection();
      if (!selected || selected.isCollapsed || !selected.rangeCount) {
        setSelection(null);
        return;
      }
      const range = selected.getRangeAt(0);
      const node = range.commonAncestorContainer;
      const element = node instanceof Element ? node : node.parentElement;
      const page = element?.closest("[data-folio-page]");
      const text = selected.toString().replace(/\s+/g, " ").trim();
      if (!page || text.length < 2) {
        setSelection(null);
        return;
      }
      const pageRect = page.getBoundingClientRect();
      const rect = range.getBoundingClientRect();
      setSelection({
        text: text.slice(0, 2000),
        page: Number(page.getAttribute("data-folio-page")),
        y: clamp01((rect.top - pageRect.top) / Math.max(1, pageRect.height)),
        left: rect.left + rect.width / 2,
        top: rect.bottom,
      });
    };
    document.addEventListener("selectionchange", onSelection);
    return () => document.removeEventListener("selectionchange", onSelection);
  }, []);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root || !parsed) return;
    const sections = [...root.querySelectorAll("[data-folio-page]")];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        setCurrent(Number((visible.target as HTMLElement).dataset.folioPage ?? 0));
      },
      { root, threshold: [0.35, 0.6] },
    );
    for (const section of sections) observer.observe(section);
    return () => observer.disconnect();
  }, [parsed, pageWidth]);

  const pageCount = parsed?.pages.length ?? 0;

  return (
    <div className="relative min-h-0 flex-1">
      <div ref={scrollerRef} className="reader h-full overflow-auto overscroll-contain">
      {error && (
        <p className="mx-auto mt-8 max-w-xl rounded-md border border-line bg-wax-soft px-4 py-3 text-sm text-ink">
          {error}
        </p>
      )}
      {!parsed && !error && activeId && (
        <p className="px-6 py-8 text-sm text-muted">Abriendo el documento…</p>
      )}
      {!activeId && <EmptyLibrary />}
      {parsed && activeId && (
        <div className="mx-auto flex w-fit min-w-full flex-col items-center px-3 py-6 pb-20 sm:px-6">
          {parsed.warnings.map((warning) => (
            <p key={warning} className="mb-3 max-w-3xl text-sm text-muted">
              {warning}
            </p>
          ))}
          {parsed.pages.map((page, index) => (
            <PageFrame key={`${activeId}-${index}`} page={index} width={pageWidth}>
              <PageBody docId={activeId} page={page} pageNumber={index + 1} width={pageWidth} />
            </PageFrame>
          ))}
          <PrintIndex />
        </div>
      )}
      </div>
      {pageCount > 1 && (
        <div className="no-print absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full border border-line bg-folio px-1 py-1 shadow-folio">
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full text-ink hover:bg-paper"
            aria-label="Folio anterior"
            onClick={() => jumpTo(Math.max(0, current - 1))}
          >
            ‹
          </button>
          <span className="min-w-16 text-center text-sm text-ink-soft">
            {current + 1} / {pageCount}
          </span>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full text-ink hover:bg-paper"
            aria-label="Folio siguiente"
            onClick={() => jumpTo(Math.min(pageCount - 1, current + 1))}
          >
            ›
          </button>
        </div>
      )}
      {selection && (
        <div
          className="no-print fixed z-50 flex -translate-x-1/2 gap-1 rounded-md border border-line bg-folio p-1 shadow-folio"
          style={{ left: selection.left, top: Math.min(window.innerHeight - 64, selection.top + 8) }}
        >
          <button
            type="button"
            className="rounded-md px-3 py-2 text-sm font-medium text-ink hover:bg-paper"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              addQuote(selection.page, selection.y, selection.text);
              window.getSelection()?.removeAllRanges();
              setSelection(null);
            }}
          >
            Subrayar
          </button>
          <button
            type="button"
            className="rounded-md px-3 py-2 text-sm font-medium text-ink hover:bg-paper"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              addNote(selection.page, selection.y, selection.text);
              window.getSelection()?.removeAllRanges();
              setSelection(null);
            }}
          >
            Al margen
          </button>
        </div>
      )}
    </div>
  );
}

function jumpTo(page: number) {
  document.getElementById(`folio-page-${page}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function PageFrame({ page, width, children }: { page: number; width: number; children: ReactNode }) {
  const tool = useStudio((state) => state.tool);
  const strokes = useStudio((state) => state.anno.strokes);
  const allNotes = useStudio((state) => state.anno.notes);
  const allQuotes = useStudio((state) => state.anno.quotes);
  const showClaves = useStudio((state) => state.showClaves);
  const selectedId = useStudio((state) => state.selectedId);
  const addNote = useStudio((state) => state.addNote);
  const select = useStudio((state) => state.select);
  const notes = useMemo(() => allNotes.filter((note) => note.page === page), [allNotes, page]);
  const quotes = useMemo(() => allQuotes.filter((quote) => quote.page === page), [allQuotes, page]);
  const folioRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(640);

  useEffect(() => {
    const element = folioRef.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setHeight(element.getBoundingClientRect().height));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const pageStrokes = strokes.filter((stroke) => stroke.page === page);
  const selectable = tool === "select" || tool === "note";

  return (
    <section id={`folio-page-${page}`} data-folio-page={page} className="mb-8 flex scroll-mt-4 flex-wrap items-start gap-4">
      <div
        ref={folioRef}
        className={cn(
          "folio relative border border-line bg-folio shadow-folio",
          selectable ? "select-text" : "select-none",
          tool === "hand" && "cursor-grab active:cursor-grabbing",
        )}
        style={{ width }}
        onPointerDown={(event) => {
          const target = event.target as HTMLElement;
          if (target.closest("button, a, textarea, input")) return;
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
            const move = (sample: PointerEvent) => {
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
        }}
      >
        {children}
        <InkLayer page={page} />
        {showClaves &&
          pageStrokes.map((stroke) => (
            <ClaveChip key={stroke.id} stroke={stroke} selected={stroke.id === selectedId} />
          ))}
      </div>
      <Gutter page={page} height={height} notes={notes} quotes={quotes} />
      {(notes.length > 0 || quotes.length > 0) && (
        <div className="space-y-2 lg:hidden" style={{ width }}>
          {quotes.map((quote) => (
            <button
              key={quote.id}
              type="button"
              className={cn(
                "rounded-md px-3 py-2 text-left text-sm",
                selectedId === quote.id ? "bg-wax text-folio" : "bg-paper text-wax",
              )}
              onClick={() => select(quote.id)}
            >
              {quote.clave}
            </button>
          ))}
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      )}
    </section>
  );
}

function ClaveChip({ stroke, selected }: { stroke: Stroke; selected: boolean }) {
  const select = useStudio((state) => state.select);
  const tool = useStudio((state) => state.tool);
  const point = stroke.points[0];
  if (!point) return null;
  const drawing = tool === "pen" || tool === "marker" || tool === "eraser";
  return (
    <button
      type="button"
      className={cn(
        "absolute z-20 -translate-y-full rounded-sm px-1.5 py-0.5 font-sans text-xs font-semibold",
        selected ? "bg-wax text-folio" : "bg-ink text-folio",
      )}
      style={{
        left: `${point.x * 100}%`,
        top: `${point.y * 100}%`,
        pointerEvents: drawing ? "none" : "auto",
      }}
      onClick={(event) => {
        event.stopPropagation();
        select(stroke.id);
      }}
    >
      {stroke.clave}
    </button>
  );
}

function Gutter({
  page,
  height,
  notes,
  quotes,
}: {
  page: number;
  height: number;
  notes: Note[];
  quotes: Quote[];
}) {
  const selectedId = useStudio((state) => state.selectedId);
  const select = useStudio((state) => state.select);
  const stacked = stackNotes(notes, height);
  return (
    <aside className="relative hidden w-gutter shrink-0 lg:block" aria-label={`Margen del folio ${page + 1}`}>
      <div className="absolute inset-y-0 left-0 w-px bg-line" />
      {quotes.map((quote) => (
        <button
          key={quote.id}
          type="button"
          className={cn(
            "absolute left-3 rounded-sm px-1.5 py-0.5 text-xs font-semibold",
            selectedId === quote.id ? "bg-wax text-folio" : "bg-paper text-wax",
          )}
          style={{ top: quote.y * height }}
          onClick={() => select(quote.id)}
        >
          {quote.clave}
        </button>
      ))}
      {stacked.map(({ note, top }) => (
        <div key={note.id} className="absolute right-0 left-3" style={{ top }}>
          <NoteCard note={note} />
        </div>
      ))}
    </aside>
  );
}

function NoteCard({ note }: { note: Note }) {
  const selectedId = useStudio((state) => state.selectedId);
  const select = useStudio((state) => state.select);
  const updateComment = useStudio((state) => state.updateComment);
  const deleteMark = useStudio((state) => state.deleteMark);
  return (
    <article
      className={cn(
        "rounded-md border bg-folio p-2",
        selectedId === note.id ? "border-wax" : "border-line",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <button type="button" className="text-xs font-semibold text-wax" onClick={() => select(note.id)}>
          {note.clave}
        </button>
        <button type="button" className="text-xs text-muted hover:text-ink" onClick={() => deleteMark(note.id)}>
          Quitar
        </button>
      </div>
      <textarea
        data-margin-comment={note.id}
        value={note.comment}
        rows={3}
        placeholder="Nota al margen"
        onChange={(event) => updateComment(note.id, event.target.value)}
        onFocus={() => select(note.id)}
        className="mt-1 w-full resize-none bg-transparent font-serif text-sm text-ink outline-none placeholder:text-muted"
      />
    </article>
  );
}

function stackNotes(notes: Note[], height: number): { note: Note; top: number }[] {
  const sorted = [...notes].sort((a, b) => a.y - b.y);
  let last = -999;
  return sorted.map((note) => {
    let top = note.y * height;
    if (top < last + 116) top = last + 116;
    last = top;
    return { note, top };
  });
}

function PageBody({
  docId,
  page,
  pageNumber,
  width,
}: {
  docId: string;
  page: PageModel;
  pageNumber: number;
  width: number;
}) {
  if (page.type === "pdf") return <PdfSheet docId={docId} pageNumber={pageNumber} width={width} />;
  if (page.type === "table") {
    return (
      <div className="min-h-96 overflow-x-auto px-4 py-6 sm:px-8">
        <p className="mb-3 font-sans text-xs tracking-widest text-muted uppercase">{page.title}</p>
        <table className="w-full border-collapse font-sans text-sm">
          <tbody>
            {page.rows.map((row, rowIndex) => (
              <tr key={`${page.title}-${rowIndex}`} className={rowIndex === 0 ? "bg-paper font-semibold" : undefined}>
                {row.map((cell, cellIndex) => (
                  <td key={`${rowIndex}-${cellIndex}`} className="border border-line px-2 py-1 align-top">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (page.type === "slide") {
    return (
      <article className="flex min-h-96 flex-col justify-center px-6 py-10 sm:px-12">
        <p className="font-sans text-xs tracking-widest text-wax uppercase">Lámina {pageNumber}</p>
        <h2 className="mt-3 font-serif text-4xl leading-tight text-ink">{page.title}</h2>
        {page.lines.length > 0 && (
          <ul className="mt-6 space-y-2 font-serif text-xl text-ink-soft">
            {page.lines.map((line, index) => (
              <li key={`${pageNumber}-${index}`}>{line}</li>
            ))}
          </ul>
        )}
      </article>
    );
  }
  return (
    <div
      className="folio-html min-h-96 px-6 py-8 sm:px-10 sm:py-12"
      data-folio-html
      dangerouslySetInnerHTML={{ __html: page.html }}
    />
  );
}

function PdfSheet({ docId, pageNumber, width }: { docId: string; pageNumber: number; width: number }) {
  const holderRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [show, setShow] = useState(false);
  const [aspect, setAspect] = useState(1.414);
  const [failed, setFailed] = useState(false);
  const height = Math.max(200, Math.round(width * aspect));

  useEffect(() => {
    const element = holderRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setShow(true);
      },
      { rootMargin: "700px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!show) return;
    const bytes = peekBytes(docId);
    const canvas = canvasRef.current;
    if (!bytes || !canvas) return;
    let cancel = false;
    let task: { cancel: () => void } | null = null;
    void (async () => {
      try {
        const pdf = await openPdf(docId, bytes);
        if (cancel) return;
        const pdfPage = await pdf.getPage(pageNumber);
        if (cancel) return;
        const base = pdfPage.getViewport({ scale: 1 });
        if (cancel) return;
        setAspect(base.height / base.width);
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const viewport = pdfPage.getViewport({ scale: (width / base.width) * dpr });
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const renderTask = pdfPage.render({ canvas, viewport });
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
  }, [show, docId, pageNumber, width]);

  return (
    <div ref={holderRef} className="relative bg-folio" style={{ width, height }}>
      {show && <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />}
      {!show && <div className="absolute inset-0 bg-paper" />}
      {failed && (
        <p className="absolute inset-0 grid place-items-center px-6 text-center text-sm text-muted">
          No se pudo pintar la página {pageNumber}.
        </p>
      )}
    </div>
  );
}

function EmptyLibrary() {
  const restore = useStudio((state) => state.restoreSamples);
  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <h1 className="font-serif text-4xl text-ink">El atril está vacío</h1>
      <p className="mt-3 text-base text-ink-soft">
        Abre un PDF, un Word, una presentación, una hoja de cálculo, un EPUB o un texto. La pluma cae encima
        de la página.
      </p>
      <button
        type="button"
        className="mt-6 rounded-md bg-ink px-4 py-3 text-sm font-medium text-folio"
        onClick={() => void restore().catch(() => undefined)}
      >
        Reponer el cuaderno de muestra
      </button>
    </div>
  );
}

function PrintIndex() {
  const anno = useStudio((state) => state.anno);
  const marks = [...anno.strokes, ...anno.notes, ...anno.quotes].sort((a, b) => a.page - b.page || a.clave.localeCompare(b.clave));
  return (
    <section className="print-only mt-8 w-full max-w-3xl">
      <h2 className="font-serif text-3xl">Índice de claves</h2>
      <ul className="mt-4 space-y-2 text-sm">
        {marks.map((mark) => (
          <li key={mark.id}>
            <strong>{mark.clave}</strong>
            {` · folio ${mark.page + 1} · `}
            {mark.kind === "quote" ? mark.quote : mark.comment || "Sin comentario"}
          </li>
        ))}
      </ul>
    </section>
  );
}
