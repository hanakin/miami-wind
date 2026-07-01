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
	const model = useComponentModel(name);
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

	// "Has a cva" = some model for this name carries a real base/variants (the live-cva seed of an inline
	// cva), vs the blank seed useEnsureModel gives every component. Checked across all models (a blank and
	// a real seed can coexist under one name). cva components edit via cva; the rest via slots — and a
	// non-cva component gets NO cva target, so it can never write a phantom cva file.
	const hasCva = useWorkbench((s) =>
		Object.values(s.models).some(
			(m) => m.name === name && (m.base.trim() !== "" || Object.keys(m.variants).length > 0),
		),
	);
	// Every data-slot in the source is selectable, cva or not — cva components layer Base/variants on
	// top (built below). A cva'd slot's own static classes are a separate, legitimate edit from its cva.
	const slotList = loadedSlots;
	const firstSlot = slotList[0];

	// Non-cva component but the selection is still the default cva target → jump to its first slot.
	useEffect(() => {
		if (!hasCva && sel.type === "cva" && firstSlot) onSel({ type: "slot", slot: firstSlot });
	}, [hasCva, sel.type, firstSlot, onSel]);

	if (!model) return <p className="p-4 text-sm text-subtext0">Loading {name}…</p>;
	const symbol = model.exportName;
	const apply = (m: CvaModel) => workbenchStore.getState().setModel(symbol, m);

	const cvaOptions = hasCva
		? [
				{
					value: "cva:base",
					label: "Base",
					sel: { type: "cva", target: { kind: "base" } } as Selection,
				},
				...Object.entries(model.variants).flatMap(([axis, opts]) =>
					Object.keys(opts).map((option) => ({
						value: `cva:${axis}:${option}`,
						label: `${axis} · ${option}`,
						sel: { type: "cva", target: { kind: "option", axis, option } } as Selection,
					})),
				),
			]
		: [];
	const slotOptions = slotList.map((slot) => ({
		value: `slot:${slot}`,
		label: slot.startsWith(`${name}-`) ? slot.slice(name.length + 1).replace(/-/g, " ") : slot,
		sel: { type: "slot", slot } as Selection,
	}));
	const allOptions = [...cvaOptions, ...slotOptions];

	const currentValue =
		sel.type === "slot"
			? `slot:${sel.slot}`
			: sel.target.kind === "base"
				? "cva:base"
				: `cva:${sel.target.axis}:${sel.target.option}`;

	const value = sel.type === "slot" ? (slotBase ?? "") : targetClass(model, sel.target);
	const onChange =
		sel.type === "slot"
			? (v: string) => workbenchStore.getState().setSlot(sel.slot, v)
			: (v: string) => apply(setTargetClass(model, sel.target, v));
	// When editing a variant option, base sits beneath it in the cascade — surface its colors as
	// "inherited" so they can be overridden (e.g. set transparent to kill a base hover bg).
	const inherited = sel.type === "cva" && sel.target.kind === "option" ? model.base : "";

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
						{cvaOptions.map((o) => (
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

			<Inspector value={value} inherited={inherited} onChange={onChange} />

			{hasCva && (
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
