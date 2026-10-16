import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { clamp01 } from "@/lib/geometry";
import { emitPen, isEraserEvent } from "@/lib/pen-signal";
import { useStudio } from "@/lib/studio-store";
import type { Point, Stroke } from "@/lib/types";
import { markerHex, inkHex, sizeFromStep } from "@/lib/types";

let lastPenAt = 0;

export function InkLayer({ page }: { page: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const liveRef = useRef<Point[]>([]);
  const rafRef = useRef(0);
  const modeRef = useRef<"draw" | "erase" | null>(null);
  const eraseRecord = useRef(true);
  const announced = useRef(false);
  const [live, setLive] = useState<Point[] | null>(null);
  const [box, setBox] = useState({ w: 1, h: 1 });
  const tool = useStudio((state) => state.tool);
  const inkId = useStudio((state) => state.inkId);
  const markerId = useStudio((state) => state.markerId);
  const sizeStep = useStudio((state) => state.sizeStep);
  const allStrokes = useStudio((state) => state.anno.strokes);
  const strokes = useMemo(
    () => allStrokes.filter((stroke) => stroke.page === page),
    [allStrokes, page],
  );
  const selectedId = useStudio((state) => state.selectedId);
  const commitStroke = useStudio((state) => state.commitStroke);
  const eraseAt = useStudio((state) => state.eraseAt);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => {
      const rect = element.getBoundingClientRect();
      const next = { w: Math.max(1, rect.width), h: Math.max(1, rect.height) };
      setBox((current) => (current.w === next.w && current.h === next.h ? current : next));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const drawing = tool === "pen" || tool === "marker" || tool === "eraser";

  function boxRect() {
    return ref.current?.getBoundingClientRect() ?? null;
  }

  function toPoint(event: PointerEvent, rect: DOMRect): Point {
    const x = clamp01((event.clientX - rect.left) / rect.width);
    const y = clamp01((event.clientY - rect.top) / rect.height);
    let pressure = event.pointerType === "mouse" ? 0.72 : event.pressure;
    if (!pressure || pressure < 0.02) pressure = event.pointerType === "pen" ? 0.2 : 0.55;
    if (event.pointerType === "pen") {
      const tilt = Math.min(1, Math.hypot(event.tiltX || 0, event.tiltY || 0) / 70);
      pressure = clamp01(pressure * (1 + tilt * 0.35));
    }
    return { x, y, p: pressure };
  }

  function remember(points: Point[]) {
    const current = liveRef.current;
    for (const point of points) {
      const last = current[current.length - 1];
      if (last) {
        const dx = point.x - last.x;
        const dy = point.y - last.y;
        if (dx * dx + dy * dy < 0.0000014) continue;
      }
      current.push(point);
    }
    if (!rafRef.current) {
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = 0;
        setLive(liveRef.current.slice());
      });
    }
  }

  function finishDraw() {
    const points = liveRef.current.slice();
    liveRef.current = [];
    setLive(null);
    modeRef.current = null;
    if (points.length === 0) return;
    if (points.length === 1) {
      const only = points[0];
      if (!only) return;
      points.push({ ...only, x: clamp01(only.x + 0.002) });
    }
    const kind = tool === "marker" ? "marker" : "pen";
    commitStroke({
      kind,
      page,
      color: kind === "marker" ? markerHex(markerId) : inkHex(inkId),
      size: sizeFromStep(sizeStep, kind),
      points,
    });
  }

  return (
    <div
      ref={ref}
      className="absolute inset-0 z-10"
      style={{
        touchAction: drawing ? "none" : "auto",
        pointerEvents: drawing ? "auto" : "none",
      }}
      onContextMenu={(event) => {
        if (drawing) event.preventDefault();
      }}
      onPointerDown={(event) => {
        if (event.pointerType === "pen") lastPenAt = Date.now();
        if (event.pointerType === "touch" && Date.now() - lastPenAt < 800) return;
        if (!drawing) return;
        const rect = boxRect();
        if (!rect) return;
        const eraser = tool === "eraser" || isEraserEvent(event);
        if (!eraser && event.button !== 0) return;
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        if (event.pointerType === "pen" && !announced.current) {
          announced.current = true;
          toast("Pluma detectada", {
            description: "Presión, inclinación y la goma del reverso ya anotan en la página.",
          });
        }
        emitPen({
          kind: eraser ? "eraser" : event.pointerType === "pen" ? "pen" : event.pointerType === "touch" ? "touch" : "mouse",
          pressure: event.pressure || (event.pointerType === "mouse" ? 0.7 : 0.4),
        });
        if (eraser) {
          modeRef.current = "erase";
          eraseRecord.current = true;
          const point = toPoint(event.nativeEvent, rect);
          eraseAt(page, point.x, point.y, 18 / rect.width, true);
          eraseRecord.current = false;
          return;
        }
        modeRef.current = "draw";
        liveRef.current = [];
        remember([toPoint(event.nativeEvent, rect)]);
      }}
      onPointerMove={(event) => {
        if (event.pointerType === "pen") lastPenAt = Date.now();
        if (!modeRef.current) return;
        const rect = boxRect();
        if (!rect) return;
        const events = event.nativeEvent.getCoalescedEvents?.() ?? [event.nativeEvent];
        const eraser = modeRef.current === "erase" || isEraserEvent(event);
        if (eraser) {
          for (const sample of events) {
            const point = toPoint(sample, rect);
            eraseAt(page, point.x, point.y, 18 / rect.width, eraseRecord.current);
            eraseRecord.current = false;
          }
          emitPen({ kind: "eraser", pressure: event.pressure || 0.5 });
          return;
        }
        remember(events.map((sample) => toPoint(sample, rect)));
        emitPen({
          kind: event.pointerType === "pen" ? "pen" : event.pointerType === "touch" ? "touch" : "mouse",
          pressure: event.pressure || 0.7,
        });
      }}
      onPointerUp={() => {
        if (modeRef.current === "draw") finishDraw();
        else modeRef.current = null;
        emitPen({ kind: "idle", pressure: 0 });
      }}
      onPointerCancel={() => {
        if (modeRef.current === "draw") finishDraw();
        else modeRef.current = null;
      }}
    >
      <svg className="h-full w-full overflow-visible" aria-hidden="true">
        <StrokeGroup strokes={strokes.filter((stroke) => stroke.kind === "marker")} width={box.w} height={box.h} blend selectedId={selectedId} />
        <StrokeGroup strokes={strokes.filter((stroke) => stroke.kind === "pen")} width={box.w} height={box.h} selectedId={selectedId} />
        {live && live.length > 1 && (
          <StrokeShape
            stroke={{
              id: "live",
              kind: tool === "marker" ? "marker" : "pen",
              page,
              color: tool === "marker" ? markerHex(markerId) : inkHex(inkId),
              size: sizeFromStep(sizeStep, tool === "marker" ? "marker" : "pen"),
              points: live,
              clave: "",
              comment: "",
              createdAt: 0,
            }}
            width={box.w}
            height={box.h}
            selected={false}
          />
        )}
      </svg>
    </div>
  );
}

function StrokeGroup({
  strokes,
  width,
  height,
  blend,
  selectedId,
}: {
  strokes: Stroke[];
  width: number;
  height: number;
  blend?: boolean;
  selectedId: string | null;
}) {
  return (
    <g style={blend ? { mixBlendMode: "multiply" } : undefined}>
      {strokes.map((stroke) => (
        <StrokeShape
          key={stroke.id}
          stroke={stroke}
          width={width}
          height={height}
          selected={stroke.id === selectedId}
        />
      ))}
    </g>
  );
}

function StrokeShape({
  stroke,
  width,
  height,
  selected,
}: {
  stroke: Stroke;
  width: number;
  height: number;
  selected: boolean;
}) {
  const lines = stroke.points.slice(1).map((point, index) => {
    const previous = stroke.points[index];
    if (!previous) return null;
    const pressure = (previous.p + point.p) / 2;
    const strokeWidth = Math.max(1.25, stroke.size * width * (0.35 + pressure * 0.9));
    return (
      <line
        key={`${stroke.id}-${index}`}
        x1={previous.x * width}
        y1={previous.y * height}
        x2={point.x * width}
        y2={point.y * height}
        stroke={selected ? "var(--color-wax)" : stroke.color}
        strokeWidth={selected ? strokeWidth + 1.5 : strokeWidth}
        strokeLinecap="round"
        opacity={stroke.kind === "marker" ? 0.55 : 0.92}
      />
    );
  });
  return <g>{lines}</g>;
}
