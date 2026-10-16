export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function fileStamp(name: string, extension: string): string {
  const base = name.replace(/\.[^.]+$/, "") || "documento";
  return `${base}.${extension}`;
}
