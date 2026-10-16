import { normalizeAnno } from "@/lib/anno-schema";
import type { AnnotationFile, DocMeta } from "@/lib/types";
import { emptyAnno } from "@/lib/types";

const DB_NAME = "atril";
const DB_VERSION = 1;

const memMeta = new Map<string, DocMeta>();
const memFiles = new Map<string, ArrayBuffer>();
const memAnnos = new Map<string, AnnotationFile>();

let persist: "idb" | "memory" = "idb";
let dbPromise: Promise<IDBDatabase | null> | null = null;

function req<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function openDb(): Promise<IDBDatabase | null> {
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

export function peekBytes(id: string): ArrayBuffer | undefined {
  return memFiles.get(id);
}

export function peekAnno(id: string): AnnotationFile | undefined {
  return memAnnos.get(id);
}

export async function loadLibrary(): Promise<DocMeta[]> {
  const db = await openDb();
  if (!db) return [...memMeta.values()].sort((a, b) => b.addedAt - a.addedAt);
  const rows = await req(db.transaction("meta").objectStore("meta").getAll() as IDBRequest<DocMeta[]>);
  memMeta.clear();
  for (const row of rows) memMeta.set(row.id, row);
  return [...memMeta.values()].sort((a, b) => b.addedAt - a.addedAt);
}

export async function loadDoc(
  id: string,
): Promise<{ meta: DocMeta; bytes: ArrayBuffer; anno: AnnotationFile } | null> {
  const cached = memMeta.get(id);
  const bytesHit = memFiles.get(id);
  if (cached && bytesHit) {
    return { meta: cached, bytes: bytesHit, anno: memAnnos.get(id) ?? emptyAnno() };
  }
  const db = await openDb();
  if (!db) return null;
  const tx = db.transaction(["meta", "files", "annos"], "readonly");
  const meta = await req(tx.objectStore("meta").get(id) as IDBRequest<DocMeta | undefined>);
  const file = await req(
    tx.objectStore("files").get(id) as IDBRequest<{ id: string; bytes: ArrayBuffer } | undefined>,
  );
  const annoRow = await req(
    tx.objectStore("annos").get(id) as IDBRequest<{ id: string; anno: unknown } | undefined>,
  );
  if (!meta || !file?.bytes) return null;
  const anno = normalizeAnno(annoRow?.anno);
  memMeta.set(id, meta);
  memFiles.set(id, file.bytes);
  memAnnos.set(id, anno);
  return { meta, bytes: file.bytes, anno };
}

export async function putDoc(meta: DocMeta, bytes: ArrayBuffer, anno: AnnotationFile): Promise<void> {
  memMeta.set(meta.id, meta);
  memFiles.set(meta.id, bytes);
  memAnnos.set(meta.id, anno);
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(["meta", "files", "annos"], "readwrite");
    tx.objectStore("meta").put(meta);
    tx.objectStore("files").put({ id: meta.id, bytes });
    tx.objectStore("annos").put({ id: meta.id, anno });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function saveAnno(id: string, anno: AnnotationFile): Promise<void> {
  memAnnos.set(id, anno);
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("annos", "readwrite");
    tx.objectStore("annos").put({ id, anno });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteDocs(ids: string[]): Promise<void> {
  for (const id of ids) {
    memMeta.delete(id);
    memFiles.delete(id);
    memAnnos.delete(id);
  }
  const db = await openDb();
  if (!db || ids.length === 0) return;
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(["meta", "files", "annos"], "readwrite");
    for (const id of ids) {
      tx.objectStore("meta").delete(id);
      tx.objectStore("files").delete(id);
      tx.objectStore("annos").delete(id);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
