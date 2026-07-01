import type { ReactNode } from "react";
import { PreviewCanvas } from "~/components/preview-canvas";
import { type PreviewProps, previews } from "~/components/previews";
import { effectiveClasses, type Selection, selectionVariantProps } from "~/utils/editor-selection";
import { flattenState, STATES } from "~/utils/tw-tokens";
import type { CvaModel } from "../../server/lib/cva-codec";

// Two-pane editor: controls on the left, the shared live preview canvas on the right.
export function EditorLayout({
	controls,
	variantStrip,
}: {
	controls: ReactNode;
	variantStrip?: ReactNode;
}) {
	return (
		<div className="grid h-full grid-cols-[340px_1fr]">
			<aside className="min-h-0 overflow-auto border-r border-border bg-mantle">{controls}</aside>
			<PreviewCanvas variantStrip={variantStrip} />
		</div>
	);
}

// Custom primitives (a bare <Icon/>, a leaf with no cva root) expose no data-slot of their own,
// so the live override has nothing to target. Wrap them in one so the inspector restyles them too.
function SlotWrap({ name, wrap, children }: { name: string; wrap: boolean; children: ReactNode }) {
	if (!wrap) return children;
	return (
		<span data-slot={name} className="inline-flex items-center justify-center">
			{children}
		</span>
	);
}

function Section({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div>
			<div className="mb-2.5 text-xs font-medium uppercase tracking-wide text-subtext0">
				{label}
			</div>
			{children}
		</div>
	);
}

// The component preview, filtered to the current selection. One real, interactive instance (use it —
// open it, hover it), plus a row of STATIC tiles for each interaction state. The tiles are `inert`,
// so they show only the forced-state look with no real hover/focus/click stacking on top — which is
// what made the old all-live grid feel broken. Forced states work for previews that forward
// className to their styled root (button, badge, toggle…); others fall back to their base look.
export function EditorPreview({
	name,
	model,
	sel,
	isCustom = false,
}: {
	name: string;
	model: CvaModel;
	sel: Selection;
	isCustom?: boolean;
}) {
	const render = previews[name];
	if (!render) return null;
	const variantProps = selectionVariantProps(sel) as PreviewProps;
	const base = effectiveClasses(model, selectionVariantProps(sel));
	const label =
		sel.type === "cva" && sel.target.kind === "option"
			? `${sel.target.axis} · ${sel.target.option}`
			: "default";

	return (
		<div className="mb-6 flex flex-col gap-6 border-b border-border pb-6">
			<Section label={`live — ${label}`}>
				<div className="flex flex-wrap items-end gap-5">
					<SlotWrap name={name} wrap={isCustom}>
						{render(variantProps)}
					</SlotWrap>
				</div>
			</Section>

			<Section label="states">
				<div className="flex flex-wrap items-end gap-5">
					{STATES.map((s) => {
						const props: PreviewProps = { ...variantProps };
						if (s.key === "disabled:") props.disabled = true;
						else if (s.key) {
							const flat = flattenState(base, s.key);
							if (flat) props.className = flat;
						}
						return (
							<div key={s.key || "base"} className="flex flex-col items-center gap-2">
								<div inert className="pointer-events-none">
									<SlotWrap name={name} wrap={isCustom}>
										{render(props)}
									</SlotWrap>
								</div>
								<span className="font-mono text-[10px] text-subtext0">{s.label}</span>
							</div>
						);
					})}
				</div>
			</Section>
		</div>
	);
}
