import type { Stroke } from "@/lib/types";

export function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function distToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const len = dx * dx + dy * dy;
  if (len === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.min(1, Math.max(0, ((px - ax) * dx + (py - ay) * dy) / len));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

export function hitStroke(strokes: Stroke[], x: number, y: number, threshold: number): Stroke | null {
  let best: Stroke | null = null;
  let bestDistance = threshold;
  for (const stroke of strokes) {
    const points = stroke.points;
    if (points.length === 0) continue;
    if (points.length === 1) {
      const distance = Math.hypot(x - points[0].x, y - points[0].y);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = stroke;
      }
      continue;
    }
    for (let index = 1; index < points.length; index += 1) {
      const distance = distToSegment(
        x,
        y,
        points[index - 1].x,
        points[index - 1].y,
        points[index].x,
        points[index].y,
      );
      if (distance < bestDistance) {
        bestDistance = distance;
        best = stroke;
      }
    }
  }
  return best;
}

export function findQuoteRange(root: ParentNode, quote: string): Range | null {
  const trimmed = quote.trim();
  if (!trimmed || typeof document === "undefined") return null;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let raw = "";
  let current: Node | null = walker.nextNode();
  while (current) {
    nodes.push(current as Text);
    raw += current.textContent ?? "";
    current = walker.nextNode();
  }
  const exact = raw.indexOf(trimmed);
  if (exact >= 0) return rangeBetween(nodes, exact, exact + trimmed.length);

  let normalized = "";
  const map: number[] = [];
  let pendingSpace = false;
  for (let index = 0; index < raw.length; index += 1) {
    const char = raw[index] ?? "";
    if (/\s/.test(char)) {
      pendingSpace = normalized.length > 0;
      continue;
    }
    if (pendingSpace) {
      normalized += " ";
      map.push(index);
      pendingSpace = false;
    }
    normalized += char;
    map.push(index);
  }
  const needle = trimmed.replace(/\s+/g, " ");
  const found = normalized.indexOf(needle);
  if (found < 0) return null;
  const start = map[found];
  const endIndex = map[found + needle.length - 1];
  if (start === undefined || endIndex === undefined) return null;
  return rangeBetween(nodes, start, endIndex + 1);
}

function rangeBetween(nodes: Text[], start: number, end: number): Range | null {
  let cursor = 0;
  let startNode: Text | null = null;
  let startOffset = 0;
  let endNode: Text | null = null;
  let endOffset = 0;
  for (const node of nodes) {
    const length = node.textContent?.length ?? 0;
    if (!startNode && cursor + length > start) {
      startNode = node;
      startOffset = start - cursor;
    }
    if (cursor + length >= end) {
      endNode = node;
      endOffset = end - cursor;
      break;
    }
    cursor += length;
  }
  if (!startNode || !endNode) return null;
  const range = document.createRange();
  try {
    range.setStart(startNode, Math.max(0, startOffset));
    range.setEnd(endNode, Math.max(0, endOffset));
    return range;
  } catch {
    return null;
  }
}
