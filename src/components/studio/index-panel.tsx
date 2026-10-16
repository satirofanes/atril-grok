import { useEffect, useMemo, useState } from "react";
import { Copy, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { useStudio } from "@/lib/studio-store";
import type { Mark } from "@/lib/types";
import { INK_COLORS, MARKER_COLORS, allMarks, markY } from "@/lib/types";

type Filter = "all" | Mark["kind"];

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "pen", label: "Pluma" },
  { id: "marker", label: "Marcador" },
  { id: "quote", label: "Citas" },
  { id: "note", label: "Notas" },
];

export function IndexPanel() {
  const open = useStudio((state) => state.indexOpen);
  const setOpen = useStudio((state) => state.setIndexOpen);
  const anno = useStudio((state) => state.anno);
  const selectedId = useStudio((state) => state.selectedId);
  const select = useStudio((state) => state.select);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const marks = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return allMarks(anno)
      .filter((mark) => (filter === "all" ? true : mark.kind === filter))
      .filter((mark) => {
        if (!needle) return true;
        const blob =
          mark.kind === "quote" ? `${mark.clave} ${mark.comment} ${mark.quote}` : `${mark.clave} ${mark.comment}`;
        return blob.toLowerCase().includes(needle);
      })
      .sort((a, b) => a.page - b.page || markY(a) - markY(b) || a.clave.localeCompare(b.clave));
  }, [anno, filter, query]);

  const selected = allMarks(anno).find((mark) => mark.id === selectedId) ?? null;

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="no-print fixed inset-0 z-30 bg-ink/30 xl:hidden"
        aria-label="Cerrar índice"
        onClick={() => setOpen(false)}
      />
      <aside className="no-print fixed inset-y-0 right-0 z-40 flex w-full flex-col border-l border-line bg-folio shadow-folio sm:w-80 xl:static xl:w-80 xl:shadow-none">
        <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
          <div>
            <h2 className="font-serif text-2xl leading-none">Claves</h2>
            <p className="mt-1 text-xs text-muted">{allMarks(anno).length} marcas en este documento</p>
          </div>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-md hover:bg-paper xl:hidden"
            aria-label="Cerrar índice"
            onClick={() => setOpen(false)}
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="border-b border-line px-4 py-3">
          <label className="flex items-center gap-2 rounded-md border border-line bg-paper px-2">
            <Search className="size-4 text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter" || !marks[0]) return;
                select(marks[0].id);
                jump(marks[0]);
              }}
              placeholder="Buscar clave o comentario"
              className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted"
            />
          </label>
          <div className="mt-2 flex flex-wrap gap-1">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={filter === item.id}
                className={cn(
                  "rounded-full px-3 py-1 text-xs",
                  filter === item.id ? "bg-ink text-folio" : "bg-paper text-ink-soft",
                )}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {marks.length === 0 && (
            <p className="px-4 py-6 text-sm text-muted">
              Todavía no hay marcas con ese criterio. Dibuja, subraya una selección o deja una nota.
            </p>
          )}
          <ul>
            {marks.map((mark) => (
              <li key={mark.id}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full flex-col items-start gap-1 border-b border-line px-4 py-3 text-left",
                    selectedId === mark.id ? "bg-wax-soft" : "hover:bg-paper",
                  )}
                  onClick={() => {
                    select(mark.id);
                    jump(mark);
                  }}
                >
                  <span className="flex w-full items-center justify-between gap-2">
                    <span className="font-semibold text-wax">{mark.clave}</span>
                    <span className="text-xs text-muted">
                      {label(mark)} · {mark.page + 1}
                    </span>
                  </span>
                  <span className="line-clamp-2 font-serif text-sm text-ink-soft">
                    {excerpt(mark) || "Sin comentario"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        {selected && <MarkEditor mark={selected} />}
      </aside>
    </>
  );
}

function MarkEditor({ mark }: { mark: Mark }) {
  const rename = useStudio((state) => state.renameMark);
  const updateComment = useStudio((state) => state.updateComment);
  const recolor = useStudio((state) => state.recolorMark);
  const remove = useStudio((state) => state.deleteMark);
  const [clave, setClave] = useState(mark.clave);

  useEffect(() => setClave(mark.clave), [mark.clave, mark.id]);

  const colors = mark.kind === "pen" || mark.kind === "note" ? INK_COLORS : MARKER_COLORS;

  return (
    <div className="border-t border-line p-4">
      <label className="block text-xs text-muted" htmlFor="clave-field">
        Clave para localizar el comentario
      </label>
      <div className="mt-1 flex gap-2">
        <input
          id="clave-field"
          value={clave}
          maxLength={40}
          onChange={(event) => setClave(event.target.value)}
          onBlur={() => {
            const next = clave.trim();
            if (!next || next === mark.clave) {
              setClave(mark.clave);
              return;
            }
            if (!rename(mark.id, next)) {
              setClave(mark.clave);
              toast.error("Esa clave ya está en uso.");
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
          className="h-11 min-w-0 flex-1 rounded-md border border-line bg-paper px-2 font-semibold text-ink outline-none focus-visible:outline-2 focus-visible:outline-wax"
        />
        <button
          type="button"
          className="grid size-11 place-items-center rounded-md border border-line hover:bg-paper"
          aria-label="Copiar clave"
          onClick={() => {
            void navigator.clipboard.writeText(mark.clave).then(
              () => toast(`Clave ${mark.clave} copiada`),
              () => toast.error("No se pudo copiar."),
            );
          }}
        >
          <Copy className="size-4" />
        </button>
      </div>
      <textarea
        data-index-comment={mark.id}
        value={mark.comment}
        rows={4}
        placeholder="Comentario de revisión"
        onChange={(event) => updateComment(mark.id, event.target.value)}
        className="mt-2 w-full resize-none rounded-md border border-line bg-paper px-2 py-2 font-serif text-sm outline-none focus-visible:outline-2 focus-visible:outline-wax"
      />
      {mark.kind === "quote" && <p className="mt-2 line-clamp-3 font-serif text-sm text-muted">“{mark.quote}”</p>}
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex gap-1">
          {colors.map((color) => (
            <button
              key={color.id}
              type="button"
              aria-label={color.label}
              aria-pressed={mark.color === color.hex}
              className={cn(
                "size-11 rounded-full border-2",
                mark.color === color.hex ? "border-ink" : "border-line",
              )}
              style={{ backgroundColor: color.hex }}
              onClick={() => recolor(mark.id, color.hex)}
            />
          ))}
        </div>
        <button
          type="button"
          className="grid size-11 place-items-center rounded-md text-wax hover:bg-wax-soft"
          aria-label="Eliminar marca"
          onClick={() => remove(mark.id)}
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  );
}

function label(mark: Mark): string {
  if (mark.kind === "pen") return "Pluma";
  if (mark.kind === "marker") return "Marcador";
  if (mark.kind === "quote") return "Cita";
  return "Nota";
}

function excerpt(mark: Mark): string {
  if (mark.comment.trim()) return mark.comment.trim();
  if (mark.kind === "quote") return mark.quote;
  return "";
}

function jump(mark: Mark) {
  document.getElementById(`folio-page-${mark.page}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
}
