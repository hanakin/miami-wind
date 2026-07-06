import { type MouseEvent, type PointerEvent, useRef, useState } from "react";
import { useExposeSlot } from "~/hooks/use-workbench-data";
import { useExpose } from "~/stores/expose";

// The capture layer for Expose mode. Covers the preview; on hover it outlines the raw, un-tagged node
// under the cursor and on click promotes it to a data-slot. The exposable set is exactly the elements
// carrying the dev source-stamp (data-mw-src, authored in an owned component) that aren't a data-slot
// yet — so the highlight IS the "you can expose this" affordance, same as Review's hover outline.
//
// Hit-testing is rect-based, NOT elementsFromPoint: the targets (icons, indicators) render as <svg>
// with `pointer-events-none`, and elementsFromPoint skips both SVG and pointer-events:none nodes — so
// the actual exposure targets can never be hit that way. Instead we pick the smallest exposable box
// under the cursor. ponytail: querySelectorAll per move is fine for the workbench's small preview DOM.
const SEL = "[data-preview] [data-mw-src]:not([data-slot])";

type Box = { top: number; left: number; width: number; height: number };

export function ExposeOverlay({ component }: { component: string }) {
	const on = useExpose((s) => s.on);
	const expose = useExposeSlot(component);
	const layerRef = useRef<HTMLDivElement>(null);
	const [hover, setHover] = useState<Box | null>(null);

	if (!on) return null;

	// The smallest (deepest) exposable element whose box contains the point — ignores pointer-events.
	const pick = (x: number, y: number): Element | null => {
		let best: Element | null = null;
		let bestArea = Number.POSITIVE_INFINITY;
		for (const el of document.querySelectorAll(SEL)) {
			const r = el.getBoundingClientRect();
			if (r.width === 0 || r.height === 0) continue;
			if (x < r.left || x > r.right || y < r.top || y > r.bottom) continue;
			const area = r.width * r.height;
			if (area < bestArea) {
				best = el;
				bestArea = area;
			}
		}
		return best;
	};

	const onMove = (e: PointerEvent<HTMLDivElement>) => {
		const el = pick(e.clientX, e.clientY);
		const layer = layerRef.current;
		if (!el || !layer) {
			setHover(null);
			return;
		}
		const r = el.getBoundingClientRect();
		const lr = layer.getBoundingClientRect();
		setHover({ top: r.top - lr.top, left: r.left - lr.left, width: r.width, height: r.height });
	};

	const onClick = (e: MouseEvent<HTMLDivElement>) => {
		const src = pick(e.clientX, e.clientY)?.getAttribute("data-mw-src");
		if (!src) return;
		const part = window.prompt("Name this part (lowercase, e.g. icon)")?.trim();
		if (!part) return;
		expose.mutate({ src, part }, { onError: (err) => window.alert(err.message) });
	};

	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents: pointer-driven exposure layer; no keyboard equivalent to "click that pixel".
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
					className="pointer-events-none absolute rounded-sm ring-2 ring-bright-pink"
					style={{ top: hover.top, left: hover.left, width: hover.width, height: hover.height }}
				>
					<span className="absolute -top-5 left-0 whitespace-nowrap rounded bg-bright-pink px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
						Expose
					</span>
				</div>
			)}
		</div>
	);
}
