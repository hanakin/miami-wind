import { type MouseEvent, type PointerEvent, useRef, useState } from "react";
import { useExposeSlot } from "~/hooks/use-workbench-data";
import { useExpose } from "~/stores/expose";

// The capture layer for Expose mode. Covers the preview; on hover it outlines whatever authored node is
// under the cursor and on click promotes an un-tagged one to a data-slot. The src-stamp plugin marks
// EVERY JSX element in an owned component with data-mw-src, so the stamped set is "every node in the
// component" — not just the exposable few. We highlight all of them and distinguish by state:
//   • no data-slot yet → exposable (pink, click to expose)
//   • already has data-slot → exposed (muted, shown so you don't re-expose it)
// Nodes with no stamp are base-ui's internal wrappers (not authored, not addressable) — skipped.
//
// Hit-testing is rect-based, NOT elementsFromPoint: targets are often <svg> with `pointer-events-none`,
// both of which elementsFromPoint drops. We pick the smallest (deepest) stamped box under the cursor so
// you can point at any node, however nested. ponytail: querySelectorAll per move is fine for the
// workbench's small preview DOM.
const SEL = "[data-preview] [data-mw-src]";

type Hover = {
	top: number;
	left: number;
	width: number;
	height: number;
	exposed: boolean;
	label: string;
};

export function ExposeOverlay({ component }: { component: string }) {
	const on = useExpose((s) => s.on);
	const expose = useExposeSlot(component);
	const layerRef = useRef<HTMLDivElement>(null);
	const [hover, setHover] = useState<Hover | null>(null);

	if (!on) return null;

	// The smallest (deepest) stamped element whose box contains the point — ignores pointer-events.
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

	// The clean part name of an exposed node (strip the "<component>-" prefix the Editing menu also trims).
	const strip = (slot: string) =>
		slot.startsWith(`${component}-`) ? slot.slice(component.length + 1) : slot;

	const onMove = (e: PointerEvent<HTMLDivElement>) => {
		const el = pick(e.clientX, e.clientY);
		const layer = layerRef.current;
		if (!el || !layer) {
			setHover(null);
			return;
		}
		const r = el.getBoundingClientRect();
		const lr = layer.getBoundingClientRect();
		const slot = el.getAttribute("data-slot");
		setHover({
			top: r.top - lr.top,
			left: r.left - lr.left,
			width: r.width,
			height: r.height,
			exposed: slot != null,
			label: slot != null ? `✓ ${strip(slot)}` : "Expose",
		});
	};

	const onClick = (e: MouseEvent<HTMLDivElement>) => {
		const el = pick(e.clientX, e.clientY);
		if (!el || el.hasAttribute("data-slot")) return; // nothing here, or already exposed
		const src = el.getAttribute("data-mw-src");
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
					className={`pointer-events-none absolute rounded-sm ring-2 ${
						hover.exposed ? "ring-foreground/40" : "ring-bright-pink"
					}`}
					style={{ top: hover.top, left: hover.left, width: hover.width, height: hover.height }}
				>
					<span
						className={`absolute -top-5 left-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-medium ${
							hover.exposed
								? "bg-foreground text-background"
								: "bg-bright-pink text-primary-foreground"
						}`}
					>
						{hover.label}
					</span>
				</div>
			)}
		</div>
	);
}
