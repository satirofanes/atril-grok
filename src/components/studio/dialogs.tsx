import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { KIND_LABEL } from "@/lib/types";
import { useStudio } from "@/lib/studio-store";
import { cn } from "@/lib/cn";

export function PaperDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/40" />
        <Dialog.Content className="fixed inset-x-3 top-14 z-50 max-h-sheet overflow-y-auto rounded-lg border border-line bg-folio p-5 shadow-folio focus:outline-none sm:inset-x-auto sm:left-1/2 sm:w-xl sm:-translate-x-1/2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Dialog.Title className="font-serif text-3xl leading-none">{title}</Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-muted">{description}</Dialog.Description>
            </div>
            <Dialog.Close className="grid size-11 shrink-0 place-items-center rounded-md hover:bg-paper" aria-label="Cerrar">
              <X className="size-5" />
            </Dialog.Close>
          </div>
          <div className="mt-4">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function LibraryDialog({ onOpenFile }: { onOpenFile: () => void }) {
  const open = useStudio((state) => state.libraryOpen);
  const setOpen = useStudio((state) => state.setLibraryOpen);
  const docs = useStudio((state) => state.docs);
  const activeId = useStudio((state) => state.activeId);
  const openDoc = useStudio((state) => state.openDoc);
  const removeDoc = useStudio((state) => state.removeDoc);
  const restore = useStudio((state) => state.restoreSamples);

  return (
    <PaperDialog
      open={open}
      onOpenChange={setOpen}
      title="Biblioteca"
      description="PDF, Word, OpenDocument, PowerPoint, Excel, EPUB, FB2, HTML, Markdown, RTF y texto."
    >
      <button
        type="button"
        className="mb-4 h-11 rounded-md bg-ink px-4 text-sm font-medium text-folio"
        onClick={onOpenFile}
      >
        Abrir archivo
      </button>
      <ul className="divide-y divide-line border-y border-line">
        {docs.map((doc) => (
          <li key={doc.id} className="flex items-center gap-2 py-2">
            <button
              type="button"
              className={cn("min-w-0 flex-1 py-2 text-left", doc.id === activeId && "text-wax")}
              onClick={() => void openDoc(doc.id)}
            >
              <span className="block truncate font-medium">{doc.name}</span>
              <span className="text-xs text-muted">
                {KIND_LABEL[doc.kind]} · {doc.pageCount} {doc.pageCount === 1 ? "página" : "páginas"}
              </span>
            </button>
            <button
              type="button"
              className="h-11 shrink-0 px-2 text-sm text-muted hover:text-wax"
              onClick={() => void removeDoc(doc.id)}
            >
              Quitar
            </button>
          </li>
        ))}
        {docs.length === 0 && <li className="py-4 text-sm text-muted">No hay documentos guardados.</li>}
      </ul>
      <button
        type="button"
        className="mt-4 text-sm text-wax underline-offset-2 hover:underline"
        onClick={() => void restore()}
      >
        Reponer los documentos de muestra
      </button>
    </PaperDialog>
  );
}

export function HelpDialog() {
  const open = useStudio((state) => state.helpOpen);
  const setOpen = useStudio((state) => state.setHelpOpen);
  return (
    <PaperDialog
      open={open}
      onOpenChange={setOpen}
      title="Cómo se anota"
      description="Pluma, marcador y notas al margen, cada una con una clave para citarla."
    >
      <div className="space-y-4 text-sm leading-6 text-ink-soft">
        <p>
          <strong className="text-ink">Pluma (P)</strong> traza tinta con la presión del lápiz.{" "}
          <strong className="text-ink">Marcador (M)</strong> subraya. <strong className="text-ink">Nota (N)</strong>{" "}
          deja un comentario en el margen. <strong className="text-ink">Selección (V)</strong> elige texto: al
          soltar aparecen Subrayar y Al margen. <strong className="text-ink">Mano (H)</strong> desplaza la página.{" "}
          <strong className="text-ink">Goma (E)</strong> levanta un trazo entero.
        </p>
        <p>
          Una tableta Wacom, o cualquier lápiz que el navegador reconozca, manda presión, inclinación y el
          extremo de goma. El botón lateral de la pluma también borra. El dedo se ignora un instante si la pluma
          acaba de tocar, para no manchar con la palma.
        </p>
        <p>
          Cada marca nace con una clave: P-001, S-001, N-001 o C-001. Puedes cambiarla por algo citable, como
          REV-12. El índice busca esa clave y salta al folio. También se copia, se exporta en JSON y, en un PDF,
          se incrusta al descargar la copia anotada.
        </p>
        <p>Deshacer es Ctrl+Z o Cmd+Z. Rehacer, Ctrl+Shift+Z. Supr elimina la marca seleccionada.</p>
      </div>
    </PaperDialog>
  );
}
