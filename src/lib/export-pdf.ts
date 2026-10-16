import type { AnnotationFile } from "@/lib/types";
import { allMarks } from "@/lib/types";

function safeText(value: string): string {
  return value
    .replace(/\u2014|\u2013/g, "-")
    .replace(/\u2018|\u2019/g, "'")
    .replace(/\u201c|\u201d/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/[^\x09\x0a\x0d\x20-\x7e\u00a1-\u00ff]/g, "");
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return { r: 0.11, g: 0.1, b: 0.08 };
  const value = Number.parseInt(match[1], 16);
  return { r: ((value >> 16) & 255) / 255, g: ((value >> 8) & 255) / 255, b: (value & 255) / 255 };
}

export async function exportAnnotatedPdf(bytes: ArrayBuffer, anno: AnnotationFile): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const doc = await PDFDocument.load(bytes);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const pages = doc.getPages();

  for (const stroke of anno.strokes) {
    const page = pages[stroke.page];
    if (!page || stroke.points.length < 2) continue;
    const { width, height } = page.getSize();
    const color = hexToRgb(stroke.color);
    for (let index = 1; index < stroke.points.length; index += 1) {
      const from = stroke.points[index - 1];
      const to = stroke.points[index];
      if (!from || !to) continue;
      const pressure = (from.p + to.p) / 2;
      page.drawLine({
        start: { x: from.x * width, y: height - from.y * height },
        end: { x: to.x * width, y: height - to.y * height },
        thickness: Math.max(0.6, stroke.size * width * (0.35 + pressure)),
        color: rgb(color.r, color.g, color.b),
        opacity: stroke.kind === "marker" ? 0.4 : 0.92,
      });
    }
    const origin = stroke.points[0];
    if (origin) {
      page.drawText(safeText(stroke.clave), {
        x: Math.min(width - 48, origin.x * width),
        y: Math.min(height - 12, height - origin.y * height + 6),
        size: 8,
        font: bold,
        color: rgb(color.r, color.g, color.b),
      });
    }
  }

  for (const note of anno.notes) {
    const page = pages[note.page];
    if (!page) continue;
    const { width, height } = page.getSize();
    const text = safeText(`${note.clave}  ${note.comment}`.trim()).slice(0, 240);
    if (!text) continue;
    page.drawText(text, {
      x: 36,
      y: Math.max(24, height - note.y * height),
      size: 8,
      font,
      color: rgb(0.56, 0.18, 0.18),
      maxWidth: width - 72,
    });
  }

  const index = doc.addPage([595.28, 841.89]);
  let y = 790;
  index.drawText("Indice de claves", { x: 56, y, size: 18, font: bold, color: rgb(0.11, 0.1, 0.08) });
  y -= 28;
  const marks = allMarks(anno).sort((a, b) => a.page - b.page || a.clave.localeCompare(b.clave));
  if (marks.length === 0) {
    index.drawText("Este documento no tiene marcas.", { x: 56, y, size: 11, font, color: rgb(0.2, 0.18, 0.16) });
  }
  for (const mark of marks) {
    if (y < 64) break;
    const body =
      mark.kind === "quote" ? mark.quote : mark.comment || (mark.kind === "marker" ? "Subrayado" : "Trazo");
    const line = safeText(`${mark.clave}   p. ${mark.page + 1}   ${body}`).slice(0, 140);
    index.drawText(line, { x: 56, y, size: 10, font, color: rgb(0.11, 0.1, 0.08), maxWidth: 480 });
    y -= 16;
  }

  return doc.save();
}
