import { z } from "zod";
import type { AnnotationFile, Note, Quote, Stroke } from "@/lib/types";

const pointSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  p: z.number().finite(),
});

const strokeSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["pen", "marker"]),
  page: z.number().int().nonnegative(),
  color: z.string().min(1),
  size: z.number().positive(),
  points: z.array(pointSchema).min(1).max(8000),
  clave: z.string().min(1).max(40),
  comment: z.string().max(8000),
  createdAt: z.number(),
});

const noteSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("note"),
  page: z.number().int().nonnegative(),
  y: z.number().finite(),
  color: z.string().min(1),
  clave: z.string().min(1).max(40),
  comment: z.string().max(8000),
  createdAt: z.number(),
});

const quoteSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("quote"),
  page: z.number().int().nonnegative(),
  y: z.number().finite(),
  color: z.string().min(1),
  clave: z.string().min(1).max(40),
  comment: z.string().max(8000),
  quote: z.string().min(1).max(4000),
  createdAt: z.number(),
});

export const annoSchema = z.object({
  version: z.literal(1).optional(),
  strokes: z.array(strokeSchema).max(4000),
  notes: z.array(noteSchema).max(4000),
  quotes: z.array(quoteSchema).max(4000),
});

export const exportSchema = annoSchema.extend({
  atril: z.literal(1),
  document: z.string().optional(),
});

export function normalizeAnno(raw: unknown): AnnotationFile {
  const parsed = annoSchema.safeParse(raw);
  if (!parsed.success) {
    return { version: 1, strokes: [], notes: [], quotes: [] };
  }
  return {
    version: 1,
    strokes: parsed.data.strokes as Stroke[],
    notes: parsed.data.notes as Note[],
    quotes: parsed.data.quotes as Quote[],
  };
}
