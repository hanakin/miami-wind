import { type ComponentType, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { previews } from "~/components/previews";
import type { Selection } from "~/utils/editor-selection";

type Demo = { name: string; Component: ComponentType };

// The scene owns loading — no registration files. Glob the two sibling folders: adding a demo = dropping
// a file in components/demo/<component>/; an override = components/examples/<component>/<filterKey>.tsx.
const demoModules = import.meta.glob("./demo/*/*.tsx", { eager: true });
const overrideModules = import.meta.glob("./examples/*/*.tsx", { eager: true });

function byComponent(modules: Record<string, unknown>): Record<string, Demo[]> {
	const out: Record<string, Demo[]> = {};
	for (const [path, mod] of Object.entries(modules)) {
		const m = path.match(/\/(?:demo|examples)\/([^/]+)\/([^/]+)\.tsx$/);
		if (!m) continue;
		const [, component, file] = m;
		if (!component || !file) continue;
		const Component = Object.values(mod as Record<string, unknown>).find(
			(v): v is ComponentType => typeof v === "function",
		);
		if (!Component) continue;
		const list = out[component] ?? [];
		list.push({ name: file, Component });
		out[component] = list;
	}
	for (const list of Object.values(out)) list.sort((a, b) => a.name.localeCompare(b.name));
	return out;
}

const DEMOS = byComponent(demoModules);
const OVERRIDES = byComponent(overrideModules);

type Focus =
	| { kind: "slot"; html: string; from: string }
	| { kind: "demo"; name: string }
	| { kind: "override"; name: string }
	| { kind: "none" };

// The component editor's preview. Top: every demo for the selected component (globbed, no registration).
// Below: the focused filter — a slot's single default instance, or the whole demo that represents the
// selected variant/context (override-first when a components/examples/ file matches). The root carries
// data-preview so the live-cva/slot CSS overlay reaches both sections.
export function DemoScene({ name, sel }: { name: string; sel: Selection }) {
	// Demos for this component, else the legacy preview (transitional, until every component is migrated).
	const demos = DEMOS[name];
	const entries = useMemo<Demo[]>(() => {
		if (demos?.length) return demos;
		const legacy = previews[name];
		return legacy ? [{ name: "legacy", Component: () => <>{legacy()}</> }] : [];
	}, [name, demos]);

	const slot = sel.type === "slot" ? sel.slot : null;
	const opt = sel.type === "cva" && sel.target.kind === "option" ? sel.target : null;
	const ctx = sel.type === "cva" && sel.target.kind === "context" ? sel.target : null;
	const filterKey =
		slot ?? (opt ? `${opt.axis}-${opt.option}` : ctx ? `context-${ctx.context}` : null);
	// The selector that identifies the demo representing a variant/size/context (null for a slot or base).
	// Scope to the component's root slot ([data-slot=name]) so a variant match is the root's own — not a
	// sub-part that happens to carry the same data-attr (e.g. ItemMedia also has data-variant="default").
	const deriveSelector = opt
		? `[data-slot="${name}"][data-${opt.axis}="${opt.option}"]`
		: ctx
			? ctx.context === "a"
				? `a[data-slot="${name}"]`
				: `[data-variant="${ctx.context}"]`
			: null;
	// Fallback for a variant that lives on a sub-slot, not the root — e.g. item-media's icon/image
	// (data-variant on [data-slot=item-media]). Tried only if the root-scoped match finds nothing.
	const deriveFallback = opt ? `[data-${opt.axis}="${opt.option}"]` : null;

	const topRef = useRef<HTMLDivElement>(null);
	const [focus, setFocus] = useState<Focus>({ kind: "none" });

	useEffect(() => {
		if (!filterKey) {
			setFocus({ kind: "none" });
			return;
		}
		// Override-first: a components/examples/<name>/<key>.tsx file wins (forced renders, e.g. open menus).
		const override = OVERRIDES[name]?.find(
			(o) => o.name === filterKey || o.name === `${name}-${filterKey}`,
		);
		if (override) {
			setFocus({ kind: "override", name: override.name });
			return;
		}
		const root = topRef.current;
		if (!root) {
			setFocus({ kind: "none" });
			return;
		}
		let alive = true;
		const derive = () => {
			if (!alive) return;
			const sections = [...root.querySelectorAll<HTMLElement>("[data-demo]")];
			if (slot) {
				// The default use: the first occurrence of the slot across the demos — one instance only.
				for (const s of sections) {
					const el = s.querySelector<HTMLElement>(`[data-slot="${slot}"]`);
					if (el) {
						setFocus({ kind: "slot", html: el.outerHTML, from: s.dataset.demo ?? "" });
						return;
					}
				}
			} else if (deriveSelector) {
				// The whole demo that represents this variant/context — reuse a finalized demo, don't invent.
				// Root-scoped match first, then the sub-slot fallback.
				for (const dsel of [deriveSelector, deriveFallback]) {
					if (!dsel) continue;
					for (const s of sections) {
						if (s.querySelector(dsel)) {
							setFocus({ kind: "demo", name: s.dataset.demo ?? "" });
							return;
						}
					}
				}
			}
			setFocus({ kind: "none" });
		};
		derive();
		// One delayed pass for async-loaded icons. Deliberately NOT a live MutationObserver — observing the
		// subtree while iconify re-renders it loops (setState → render → mutate → observe).
		const t = setTimeout(derive, 150);
		return () => {
			alive = false;
			clearTimeout(t);
		};
	}, [name, slot, filterKey, deriveSelector, deriveFallback]);

	return (
		<div data-preview className="flex flex-col gap-8 p-6">
			<div ref={topRef} className="flex flex-wrap items-start gap-8">
				{entries.length === 0 ? (
					<p className="text-sm text-subtext0">No demos for {name} yet.</p>
				) : (
					entries.map((d) => (
						<Section key={d.name} label={d.name.replace(/-/g, " ")}>
							<div data-demo={d.name} className="flex flex-wrap items-start gap-5">
								<d.Component />
							</div>
						</Section>
					))
				)}
			</div>

			{filterKey && (
				<Section label={filterLabel(sel, name)}>{renderFocus(focus, name, entries)}</Section>
			)}
		</div>
	);
}

function renderFocus(focus: Focus, name: string, entries: Demo[]): ReactNode {
	if (focus.kind === "slot") {
		return (
			<div className="flex w-72 max-w-full flex-col items-start gap-1.5">
				{/* biome-ignore lint/security/noDangerouslySetInnerHtml: cloned from our own rendered demos above. */}
				<div className="w-full" dangerouslySetInnerHTML={{ __html: focus.html }} />
				<span className="font-mono text-[10px] text-subtext0">from {focus.from}</span>
			</div>
		);
	}
	if (focus.kind === "demo") {
		const d = entries.find((e) => e.name === focus.name);
		return d ? <d.Component /> : null;
	}
	if (focus.kind === "override") {
		const o = OVERRIDES[name]?.find((e) => e.name === focus.name);
		return o ? <o.Component /> : null;
	}
	return <p className="text-sm text-subtext0">Not present in these demos.</p>;
}

function Section({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className="flex flex-col gap-2">
			<span className="text-xs font-medium uppercase tracking-wide text-subtext0">{label}</span>
			{children}
		</div>
	);
}

// "item-title" → "slot · title"; a variant option → "variant · outline"; a context → "[a]".
function filterLabel(sel: Selection, name: string): string {
	if (sel.type === "slot") {
		const s = sel.slot;
		return `slot · ${s.startsWith(`${name}-`) ? s.slice(name.length + 1).replace(/-/g, " ") : s}`;
	}
	if (sel.target.kind === "option") return `${sel.target.axis} · ${sel.target.option}`;
	if (sel.target.kind === "context") return `[${sel.target.context}]`;
	return "";
}
