import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { previews } from "~/components/previews";
import {
	contextExamples,
	type ExampleEntry,
	examples,
	primaryExamples,
	variantExamples,
} from "~/examples";
import { type Selection, selectionVariantProps } from "~/utils/editor-selection";

type Snap = { example: string; html: string };

// The component editor's preview: shadcn's example set on top and — below it — a focused view of the
// current selection: a selected data-slot extracted from those same rendered examples, OR the primary
// example re-rendered with a selected variant option applied. The root carries data-preview so the
// live-cva/slot CSS overlay reaches every section (snapshots included).
export function ExamplePreview({ name, sel }: { name: string; sel: Selection }) {
	// Vendored examples when present, else the legacy hand-authored preview (transitional, until this
	// component's examples are authored). Memoized on name so slot changes don't remount it.
	const entries = useMemo<ExampleEntry[]>(() => {
		const vendored = examples[name];
		if (vendored) return vendored;
		const legacy = previews[name];
		return legacy
			? [{ name: "legacy", label: "Legacy preview", Component: () => <>{legacy()}</> }]
			: [];
	}, [name]);

	const slot = sel.type === "slot" ? sel.slot : null;
	// A selected variant option → re-render the primary example with it applied (below). Covers stock,
	// modified, and newly-added variants alike, since the option comes from the live cva model.
	const variantSel = sel.type === "cva" && sel.target.kind === "option" ? sel.target : null;
	const Primary = primaryExamples[name];
	// Some variants don't read as a lone card — e.g. item's `default` is fully transparent. When a
	// richer example is mapped for the exact option, show that instead (it uses the variant in context).
	const VariantExample = variantSel
		? variantExamples[name]?.[`${variantSel.axis}:${variantSel.option}`]
		: undefined;
	// A pass-through context (e.g. `a`) → render the example that triggers it (the item as a link) so
	// its styling is visible and editable.
	const contextSel = sel.type === "cva" && sel.target.kind === "context" ? sel.target : null;
	const ContextExample = contextSel ? contextExamples[name]?.[contextSel.context] : undefined;
	const topRef = useRef<HTMLDivElement>(null);
	const [snap, setSnap] = useState<Snap | null>(null);

	// Show the DEFAULT use of the selected slot: its first occurrence across the examples, in order —
	// one instance only, so it's unambiguous what the left inspector is editing (the slot's classes
	// apply to every occurrence). Re-runs on slot change and once after mount for async-loaded icons.
	useEffect(() => {
		const root = topRef.current;
		if (!root || !slot) {
			setSnap(null);
			return;
		}
		let alive = true;
		const extract = () => {
			if (!alive) return;
			for (const section of root.querySelectorAll<HTMLElement>("[data-example]")) {
				const el = section.querySelector<HTMLElement>(`[data-slot="${slot}"]`);
				if (el) {
					setSnap({ example: section.dataset.example ?? "", html: el.outerHTML });
					return;
				}
			}
			setSnap(null);
		};
		extract();
		// One delayed pass catches async-loaded icons. Deliberately NOT a live MutationObserver:
		// observing the subtree while iconify re-rendered it created a setState → render → mutate →
		// observe feedback loop that froze the tab. `name` isn't a dep — the route remounts on change.
		const t = setTimeout(extract, 150);
		return () => {
			alive = false;
			clearTimeout(t);
		};
	}, [slot]);

	return (
		<div data-preview className="flex flex-col gap-8 p-6">
			<div ref={topRef} className="flex flex-wrap items-start gap-8">
				{entries.length === 0 ? (
					<p className="text-sm text-subtext0">No examples for {name} yet.</p>
				) : (
					entries.map((e) => (
						<Section key={e.name} label={e.label}>
							<div data-example={e.label} className="flex flex-wrap items-start gap-5">
								<e.Component />
							</div>
						</Section>
					))
				)}
			</div>

			{slot && (
				<Section label={`slot · ${slotLabel(name, slot)}`}>
					{snap ? (
						<div className="flex flex-col items-start gap-1.5">
							{/* biome-ignore lint/security/noDangerouslySetInnerHtml: cloned from our own rendered examples above. */}
							<div dangerouslySetInnerHTML={{ __html: snap.html }} />
							<span className="font-mono text-[10px] text-subtext0">from {snap.example}</span>
						</div>
					) : (
						<p className="text-sm text-subtext0">Not present in these examples.</p>
					)}
				</Section>
			)}

			{variantSel && (
				<Section label={`${variantSel.axis} · ${variantSel.option}`}>
					{VariantExample ? (
						<VariantExample />
					) : Primary ? (
						<Primary {...selectionVariantProps(sel)} />
					) : (
						<p className="text-sm text-subtext0">No primary example for {name} yet.</p>
					)}
				</Section>
			)}

			{contextSel && (
				<Section label={`[${contextSel.context}]`}>
					{ContextExample ? (
						<ContextExample />
					) : (
						<p className="text-sm text-subtext0">
							No {contextSel.context} example for {name} yet.
						</p>
					)}
				</Section>
			)}
		</div>
	);
}

function Section({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className="flex flex-col gap-2">
			<span className="text-xs font-medium uppercase tracking-wide text-subtext0">{label}</span>
			{children}
		</div>
	);
}

// "item-title" → "title" (drop the component prefix), matching the left controls' slot labels.
function slotLabel(name: string, slot: string): string {
	return slot.startsWith(`${name}-`) ? slot.slice(name.length + 1).replace(/-/g, " ") : slot;
}
