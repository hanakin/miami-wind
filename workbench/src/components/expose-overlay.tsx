import { type MouseEvent, type PointerEvent, useRef, useState } from "react";
import { useExposeSlot } from "~/hooks/use-workbench-data";
import { useExpose } from "~/stores/expose";

// The capture layer for Expose mode. Covers the preview; when expose is on it outlines the raw,
// un-tagged node under the cursor and on click promotes it to a data-slot. The exposable set is exactly
// the elements carrying the dev source-stamp (data-mw-src, authored in an owned component) that don't
// already have a data-slot — so the highlight IS the "you can expose this" affordance, no code names shown.
const SEL = "[data-mw-src]:not([data-slot])";

export function ExposeOverlay({ component }: { component: string }) {
	const on = useExpose((s) => s.on);
	const expose = useExposeSlot(component);
	const layerRef = useRef<HTMLDivElement>(null);
	const [hover, setHover] = useState<{
		top: number;
		left: number;
		width: number;
		height: number;
	} | null>(null);

	if (!on) return null;

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

	// Nearest exposable node (stamped, not yet slotted) at/above the resolved pixel.
	const target = (x: number, y: number): HTMLElement | null =>
		resolve(x, y)?.closest<HTMLElement>(SEL) ?? null;

	const onMove = (e: PointerEvent<HTMLDivElement>) => {
		const el = target(e.clientX, e.clientY);
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
		const el = target(e.clientX, e.clientY);
		const src = el?.dataset.mwSrc;
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
