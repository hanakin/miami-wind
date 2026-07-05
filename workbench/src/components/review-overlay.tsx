import { type MouseEvent, type PointerEvent, useRef, useState } from "react";
import { reviewStore, useReview } from "~/stores/review";

// The capture layer for Review mode. Covers the preview; when review is on it intercepts pointer events,
// outlines the piece under the cursor, and on click drops a numbered pin anchored to that element's real
// data-slot/data-demo/data-view. Read-only — it resolves anchors off the live DOM, never edits it.
export function ReviewOverlay({ component }: { component: string }) {
	const on = useReview((s) => s.on);
	const notes = useReview((s) => s.notes);
	const layerRef = useRef<HTMLDivElement>(null);
	const [hover, setHover] = useState<{
		top: number;
		left: number;
		width: number;
		height: number;
		label: string;
	} | null>(null);

	if (!on) return null;

	const pins = notes.filter((n) => n.component === component);

	// The topmost preview element under the point, skipping our own overlay + its children.
	const resolve = (x: number, y: number): HTMLElement | null => {
		const layer = layerRef.current;
		const el = document
			.elementsFromPoint(x, y)
			.find(
				(e): e is HTMLElement =>
					e instanceof HTMLElement &&
					e !== layer &&
					!layer?.contains(e) &&
					!!e.closest("[data-preview]"),
			);
		return el ?? null;
	};

	const onMove = (e: PointerEvent<HTMLDivElement>) => {
		const raw = resolve(e.clientX, e.clientY);
		const layer = layerRef.current;
		if (!raw || !layer) {
			setHover(null);
			return;
		}
		const slot = raw.closest<HTMLElement>("[data-slot]");
		const target = slot ?? raw;
		const r = target.getBoundingClientRect();
		const lr = layer.getBoundingClientRect();
		const demo = raw.closest<HTMLElement>("[data-demo]")?.dataset.demo ?? "";
		setHover({
			top: r.top - lr.top,
			left: r.left - lr.left,
			width: r.width,
			height: r.height,
			label: slot?.dataset.slot || demo || "—",
		});
	};

	const onClick = (e: MouseEvent<HTMLDivElement>) => {
		const layer = layerRef.current;
		if (!layer) return;
		const raw = resolve(e.clientX, e.clientY);
		const lr = layer.getBoundingClientRect();
		const piece = raw?.closest<HTMLElement>("[data-slot]")?.dataset.slot ?? "";
		const demo = raw?.closest<HTMLElement>("[data-demo]")?.dataset.demo ?? "";
		const view =
			raw?.closest<HTMLElement>("[data-view]")?.dataset.view === "example" ? "example" : "demo";
		reviewStore
			.getState()
			.addNote({ component, view, demo, piece, x: e.clientX - lr.left, y: e.clientY - lr.top });
	};

	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents: pointer-driven annotation layer; no keyboard equivalent to "click that pixel".
		// biome-ignore lint/a11y/noStaticElementInteractions: the capture layer is intentionally a bare div, not a control.
		<div
			ref={layerRef}
			onPointerMove={onMove}
			onPointerLeave={() => setHover(null)}
			onClick={onClick}
			className="absolute inset-0 z-40 cursor-crosshair"
		>
			{hover && (
				<div
					className="pointer-events-none absolute rounded-sm ring-2 ring-primary"
					style={{ top: hover.top, left: hover.left, width: hover.width, height: hover.height }}
				>
					<span className="absolute -top-5 left-0 whitespace-nowrap rounded bg-primary px-1.5 py-0.5 font-mono text-[10px] text-primary-foreground">
						{hover.label}
					</span>
				</div>
			)}
			{pins.map((n, i) => (
				<span
					key={n.id}
					className="pointer-events-none absolute flex size-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground shadow"
					style={{ left: n.x, top: n.y }}
				>
					{i + 1}
				</span>
			))}
		</div>
	);
}
