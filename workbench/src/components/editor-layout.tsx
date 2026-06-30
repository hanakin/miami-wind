import type { ReactNode } from "react";
import { PreviewCanvas } from "~/components/preview-canvas";
import { type PreviewProps, previews } from "~/components/previews";
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

// The default-variant class string: base + each default option's classes — what the bare
// component actually renders with, so forced-state previews start from the right baseline.
function defaultClasses(model: CvaModel): string {
	const parts = [model.base];
	for (const [axis, val] of Object.entries(model.defaultVariants)) {
		if (typeof val === "string") parts.push(model.variants[axis]?.[val] ?? "");
	}
	return parts.filter(Boolean).join(" ");
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

// Every interaction state, rendered live. Disabled uses the real prop; hover/focus/active are
// forced by promoting that state's utilities to base — works for previews that forward className
// to the styled root (button, badge, toggle); others fall back to their base look.
function StatesRow({ name, model, wrap }: { name: string; model: CvaModel; wrap: boolean }) {
	const render = previews[name];
	if (!render) return null;
	const base = defaultClasses(model);
	return (
		<div>
			<div className="mb-2.5 text-xs font-medium uppercase tracking-wide text-subtext0">states</div>
			<div className="flex flex-wrap items-end gap-5">
				{STATES.map((s) => {
					const props: PreviewProps = {};
					if (s.key === "disabled:") props.disabled = true;
					else if (s.key) {
						const flat = flattenState(base, s.key);
						if (flat) props.className = flat;
					}
					return (
						<div key={s.key || "base"} className="flex flex-col items-center gap-2">
							<SlotWrap name={name} wrap={wrap}>
								{render(props)}
							</SlotWrap>
							<span className="font-mono text-[10px] text-subtext0">{s.label}</span>
						</div>
					);
				})}
			</div>
		</div>
	);
}

// The scoped component's states + variants, rendered live and labelled — the real instances.
export function VariantStrip({
	name,
	model,
	isCustom = false,
}: {
	name: string;
	model: CvaModel;
	isCustom?: boolean;
}) {
	const render = previews[name];
	if (!render) return null;
	return (
		<div className="mb-6 flex flex-col gap-5 border-b border-border pb-6">
			<StatesRow name={name} model={model} wrap={isCustom} />
			{Object.entries(model.variants).map(([axis, opts]) => (
				<div key={axis}>
					<div className="mb-2.5 text-xs font-medium uppercase tracking-wide text-subtext0">
						{axis}
					</div>
					<div className="flex flex-wrap items-end gap-5">
						{Object.keys(opts).map((opt) => (
							<div key={opt} className="flex flex-col items-center gap-2">
								<SlotWrap name={name} wrap={isCustom}>
									{render({ [axis]: opt })}
								</SlotWrap>
								<span className="font-mono text-[10px] text-subtext0">{opt}</span>
							</div>
						))}
					</div>
				</div>
			))}
		</div>
	);
}
