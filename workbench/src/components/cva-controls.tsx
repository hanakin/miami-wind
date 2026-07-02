import { Icon } from "@registry-ui/icon";
import { useEffect, useMemo, useState } from "react";
import { Inspector } from "~/components/inspector";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { useComponentModel } from "~/hooks/use-workbench-data";
import { useWorkbench, workbenchStore } from "~/stores/workbench";
import {
	addAxis,
	addOption,
	removeAxis,
	removeOption,
	setTargetClass,
	targetClass,
} from "~/utils/cva-edit";
import type { Selection } from "~/utils/editor-selection";
import { slotForCva } from "~/utils/live-css";
import type { CvaModel } from "../../server/lib/cva-codec";

export function CvaControls({
	name,
	sel,
	onSel,
}: {
	name: string;
	sel: Selection;
	onSel: (sel: Selection) => void;
}) {
	const anyModel = useComponentModel(name);
	const modelsMap = useWorkbench((s) => s.models);
	// Working classes for the selected surface, read live from the store (empty until first edit).
	const slotBase = useWorkbench((s) =>
		sel.type === "slot" ? (s.slots[sel.slot] ?? "") : undefined,
	);
	// The slots loaded from this component's source. Stable maps → memo, so the selector never returns
	// a fresh array (which would loop). loadedSlots holds every data-slot the component actually has.
	const slotsMap = useWorkbench((s) => s.slots);
	const slotOwner = useWorkbench((s) => s.slotOwner);
	const loadedSlots = useMemo(
		() => Object.keys(slotsMap).filter((k) => slotOwner[k] === name),
		[slotsMap, slotOwner, name],
	);

	// Every real cva for this component, in declaration order. A component can have several — item has
	// itemVariants (root) and itemMediaVariants (media) — and each edits its own file. "Real" = a
	// live-cva seed carrying actual base/variants, vs the blank seed useEnsureModel gives every
	// component; the blank is filtered out so a non-cva component gets NO cva target (and can never
	// write a phantom cva file).
	const cvas = useMemo(
		() =>
			Object.values(modelsMap).filter(
				(m) => m.name === name && (m.base.trim() !== "" || Object.keys(m.variants).length > 0),
			),
		[modelsMap, name],
	);
	const hasCva = cvas.length > 0;
	const multi = cvas.length > 1;
	// The cva the current selection edits: matched by symbol, else the first (also the slot-selection
	// fallback). Undefined only for a non-cva component, whose cva paths below never render.
	const model =
		(sel.type === "cva" ? cvas.find((m) => m.exportName === sel.target.symbol) : undefined) ??
		cvas[0];

	const firstSlot = loadedSlots[0];

	// Non-cva component but the selection is still the default cva target → jump to its first slot.
	useEffect(() => {
		if (!hasCva && sel.type === "cva" && firstSlot) onSel({ type: "slot", slot: firstSlot });
	}, [hasCva, sel.type, firstSlot, onSel]);

	if (!anyModel) return <p className="p-4 text-sm text-subtext0">Loading {name}…</p>;
	const apply = (m: CvaModel) => workbenchStore.getState().setModel(m.exportName, m);

	// One dropdown group per cva: Base, any pass-through contexts (`[a]` link), and every variant
	// option — each tagged with the cva's export symbol so it edits the right file. Flat for a single
	// cva; grouped and labeled by slot (item, item-media, …) when a component has several.
	const cvaGroups = cvas.map((m) => {
		const contexts = /\[a\]:/.test(m.base) ? ["a"] : [];
		const options = [
			{
				value: `cva:${m.exportName}:base`,
				label: "Base",
				sel: { type: "cva", target: { kind: "base", symbol: m.exportName } } as Selection,
			},
			...contexts.map((context) => ({
				value: `cva:${m.exportName}:ctx:${context}`,
				label: `link (${context})`,
				sel: {
					type: "cva",
					target: { kind: "context", context, symbol: m.exportName },
				} as Selection,
			})),
			...Object.entries(m.variants).flatMap(([axis, opts]) =>
				Object.keys(opts).map((option) => ({
					value: `cva:${m.exportName}:opt:${axis}:${option}`,
					label: `${axis} · ${option}`,
					sel: {
						type: "cva",
						target: { kind: "option", axis, option, symbol: m.exportName },
					} as Selection,
				})),
			),
		];
		return { symbol: m.exportName, label: slotForCva(m.exportName), options };
	});
	const slotOptions = loadedSlots.map((slot) => ({
		value: `slot:${slot}`,
		label: slot.startsWith(`${name}-`) ? slot.slice(name.length + 1).replace(/-/g, " ") : slot,
		sel: { type: "slot", slot } as Selection,
	}));
	const allOptions = [...cvaGroups.flatMap((g) => g.options), ...slotOptions];

	// The default selection can be created before this component's model has loaded, so it may carry no
	// symbol — fall back to the active (first) cva so the dropdown still reflects it.
	const activeSymbol = sel.type === "cva" ? (sel.target.symbol ?? model?.exportName) : undefined;
	const currentValue =
		sel.type === "slot"
			? `slot:${sel.slot}`
			: sel.target.kind === "base"
				? `cva:${activeSymbol}:base`
				: sel.target.kind === "context"
					? `cva:${activeSymbol}:ctx:${sel.target.context}`
					: `cva:${activeSymbol}:opt:${sel.target.axis}:${sel.target.option}`;

	const value =
		sel.type === "slot" ? (slotBase ?? "") : model ? targetClass(model, sel.target) : "";
	const onChange =
		sel.type === "slot"
			? (v: string) => workbenchStore.getState().setSlot(sel.slot, v)
			: (v: string) => {
					if (model) apply(setTargetClass(model, sel.target, v));
				};
	// When editing a variant option, base sits beneath it in the cascade — surface its colors as
	// "inherited" so they can be overridden (e.g. set transparent to kill a base hover bg).
	const inherited = sel.type === "cva" && sel.target.kind === "option" && model ? model.base : "";

	return (
		<div className="flex flex-col gap-4 p-4">
			<div className="flex flex-col gap-1.5">
				<span className="text-xs font-medium text-subtext0">Editing</span>
				<Select
					value={currentValue}
					onValueChange={(v) =>
						onSel(
							allOptions.find((o) => o.value === v)?.sel ?? {
								type: "cva",
								target: { kind: "base" },
							},
						)
					}
				>
					<SelectTrigger className="h-8">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{multi
							? cvaGroups.map((g) => (
									<SelectGroup key={g.symbol}>
										<SelectLabel>{g.label}</SelectLabel>
										{g.options.map((o) => (
											<SelectItem key={o.value} value={o.value}>
												{o.label}
											</SelectItem>
										))}
									</SelectGroup>
								))
							: cvaGroups[0]?.options.map((o) => (
									<SelectItem key={o.value} value={o.value}>
										{o.label}
									</SelectItem>
								))}
						{slotOptions.length > 0 && (
							<SelectGroup>
								<SelectLabel>Surfaces</SelectLabel>
								{slotOptions.map((o) => (
									<SelectItem key={o.value} value={o.value}>
										{o.label}
									</SelectItem>
								))}
							</SelectGroup>
						)}
					</SelectContent>
				</Select>
			</div>

			<Inspector
				value={value}
				inherited={inherited}
				onChange={onChange}
				context={
					sel.type === "cva" && sel.target.kind === "context" ? `[${sel.target.context}]:` : ""
				}
			/>

			{hasCva && model && (
				<details className="border-t border-border pt-3">
					<summary className="cursor-pointer text-xs font-medium uppercase tracking-wide text-subtext0">
						Manage variants
					</summary>
					<div className="mt-3 flex flex-col gap-2.5">
						{Object.entries(model.variants).map(([axis, opts]) => (
							<div key={axis} className="rounded-md border border-border p-2.5">
								<div className="flex items-center justify-between">
									<span className="font-mono text-xs font-medium text-text">{axis}</span>
									<IconBtn
										label={`delete ${axis}`}
										icon="mdi:trash-can-outline"
										onClick={() => apply(removeAxis(model, axis))}
									/>
								</div>
								<div className="mt-2 flex flex-wrap items-center gap-1">
									{Object.keys(opts).map((opt) => (
										<span
											key={opt}
											className="inline-flex items-center gap-1 rounded bg-interactive py-0.5 pr-1 pl-1.5 font-mono text-[11px] text-text"
										>
											{opt}
											<button
												type="button"
												aria-label={`delete ${opt}`}
												onClick={() => apply(removeOption(model, axis, opt))}
												className="cursor-pointer text-subtext0 hover:text-text"
											>
												<Icon icon="mdi:close" size={11} />
											</button>
										</span>
									))}
									<AddInline placeholder="option" onAdd={(v) => apply(addOption(model, axis, v))} />
								</div>
							</div>
						))}
						<AddInline
							placeholder="new variant axis"
							cta="Add variant"
							onAdd={(v) => apply(addAxis(model, v))}
						/>
					</div>
				</details>
			)}
		</div>
	);
}

function IconBtn({ label, icon, onClick }: { label: string; icon: string; onClick: () => void }) {
	return (
		<button
			type="button"
			aria-label={label}
			onClick={onClick}
			className="grid size-6 cursor-pointer place-items-center rounded text-subtext0 transition-colors hover:bg-interactive hover:text-error"
		>
			<Icon icon={icon} size={14} />
		</button>
	);
}

function AddInline({
	placeholder,
	cta,
	onAdd,
}: {
	placeholder: string;
	cta?: string;
	onAdd: (v: string) => void;
}) {
	const [v, setV] = useState("");
	const add = () => {
		const clean = v.trim();
		if (clean) {
			onAdd(clean);
			setV("");
		}
	};
	return (
		<div className="flex items-center gap-1">
			<input
				value={v}
				onChange={(e) => setV(e.target.value)}
				onKeyDown={(e) => e.key === "Enter" && add()}
				placeholder={placeholder}
				spellCheck={false}
				className="h-7 w-28 rounded-md border border-border bg-input px-2 font-mono text-[11px] text-text outline-none focus-visible:border-primary"
			/>
			<button
				type="button"
				onClick={add}
				className="grid h-7 cursor-pointer place-items-center rounded-md border border-border px-2 text-xs text-subtext transition-colors hover:border-primary hover:text-text"
			>
				{cta ?? <Icon icon="mdi:plus" size={14} />}
			</button>
		</div>
	);
}
