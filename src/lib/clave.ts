import type { AnnotationFile, Mark } from "@/lib/types";
import { allMarks } from "@/lib/types";

const PREFIX: Record<Mark["kind"], string> = {
  pen: "P",
  marker: "S",
  note: "N",
  quote: "C",
};

export function nextClave(kind: Mark["kind"], anno: AnnotationFile): string {
  const prefix = PREFIX[kind];
  const taken = new Set(allMarks(anno).map((m) => m.clave));
  let n = 1;
  while (taken.has(`${prefix}-${String(n).padStart(3, "0")}`)) n += 1;
  return `${prefix}-${String(n).padStart(3, "0")}`;
}

export function claveTaken(anno: AnnotationFile, clave: string, exceptId?: string): boolean {
  return allMarks(anno).some((m) => m.clave === clave && m.id !== exceptId);
}
