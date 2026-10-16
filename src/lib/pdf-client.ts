import type { PDFDocumentProxy } from "pdfjs-dist";

let loader: Promise<typeof import("pdfjs-dist")> | null = null;
const cache = new Map<string, Promise<PDFDocumentProxy>>();

export function loadPdfjs() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("El visor PDF solo está disponible en el navegador."));
  }
  loader ??= (async () => {
    const pdfjs = await import("pdfjs-dist");
    const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    return pdfjs;
  })();
  return loader;
}

export async function openPdf(id: string, bytes: ArrayBuffer): Promise<PDFDocumentProxy> {
  const existing = cache.get(id);
  if (existing) return existing;
  const pending = (async () => {
    const pdfjs = await loadPdfjs();
    const task = pdfjs.getDocument({ data: new Uint8Array(bytes.slice(0)) });
    return task.promise;
  })();
  cache.set(id, pending);
  try {
    return await pending;
  } catch (error) {
    cache.delete(id);
    throw error;
  }
}

export async function releasePdf(id: string) {
  const pending = cache.get(id);
  cache.delete(id);
  if (!pending) return;
  try {
    const pdf = await pending;
    await pdf.cleanup();
    await pdf.loadingTask.destroy();
  } catch {
    /* already gone */
  }
}

export async function countPdfPages(bytes: ArrayBuffer): Promise<number> {
  const pdfjs = await loadPdfjs();
  const task = pdfjs.getDocument({ data: new Uint8Array(bytes.slice(0)) });
  const pdf = await task.promise;
  const count = pdf.numPages;
  await pdf.cleanup();
  await pdf.loadingTask.destroy();
  return count;
}
