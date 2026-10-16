export type PenKind = "idle" | "mouse" | "touch" | "pen" | "eraser";

export type PenSample = {
  kind: PenKind;
  pressure: number;
};

type Listener = (sample: PenSample) => void;

const listeners = new Set<Listener>();

export function emitPen(sample: PenSample) {
  for (const listener of listeners) listener(sample);
}

export function subscribePen(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isEraserEvent(event: { pointerType: string; button: number; buttons: number }): boolean {
  if (event.button === 5 || (event.buttons & 32) === 32) return true;
  return event.pointerType === "pen" && (event.button === 2 || event.buttons === 2);
}
