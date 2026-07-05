import { useCallback, useEffect, useMemo } from "react";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { useEditorModel } from "~/stores/editor-model";
import { useWorkbench } from "~/stores/workbench";
import type { Selection } from "~/utils/editor-selection";
import { slotForCva } from "~/utils/live-css";

// EditingMenu — the categorized "what piece do I edit" dropdown (editor rebuild, Stage 3).
//
// Renders the pre-baked model's five (six with Trigger) categories — Root · Trigger · Layout/Structure ·
// Parts · Variants · Flags — with the plain name prominent and a dimmed `· namespace` trail. No CSS/
// Tailwind terms surface. Derived entirely from the store, never a static template.
//
// TRANSITION GLUE (removed in Stage 9): each entry also carries the existing editor `Selection` so the
// current Inspector/Demo keep working while Stages 4–7 rebuild the controls onto the store. A piece that
// maps to a live cva (item's root/variants) selects the cva target; everything else selects the slot.

interface Entry {
	value: string; // unique menu value = the piece id
	primary: string; // the prominent plain name
	trail?: string; // the dimmed "· namespace"
	sel: Selection;
	pieceKey: string; // the store slot key this entry edits (for the interaction menu + controls)
}

interface Group {
	key: string;
	label: string;
	entries: Entry[];
}

export function EditingMenu({
	name,
	value,
	onPick,
}: {
	name: string;
	value: string;
	onPick: (value: string, sel: Selection, pieceKey: string) => void;
}) {
	const model = useEditorModel((s) => s.baseline[name]);
	// Live cvas for this component (stable map → memo filter, so the selector never returns a fresh
	// array and loops). Used only to resolve a piece's cva export symbol for the Selection mapping.
	const modelsMap = useWorkbench((s) => s.models);
	const cvas = useMemo(
		() =>
			Object.values(modelsMap).filter(
				(m) => m.name === name && (m.base.trim() !== "" || Object.keys(m.variants).length > 0),
			),
		[modelsMap, name],
	);

	const groups = useMemo<Group[]>(() => {
		if (!model) return [];
		const strip = (slot: string) =>
			slot.startsWith(`${name}-`) ? slot.slice(name.length + 1) : slot;
		const symbolFor = (ns: string) => cvas.find((m) => slotForCva(m.exportName) === ns)?.exportName;
		const isCvaNs = (ns: string) => cvas.some((m) => slotForCva(m.exportName) === ns);
		const trailNs = (ns: string) => (isCvaNs(ns) ? ns : strip(ns));

		const slotEntry = (slot: string): Entry => ({
			value: `slot:${slot}`,
			primary: strip(slot),
			sel: { type: "slot", slot },
			pieceKey: slot,
		});

		const out: Group[] = [];
		const push = (key: string, label: string, entries: Entry[]) => {
			if (entries.length) out.push({ key, label, entries });
		};

		// Root — a cva base when the root IS a cva slot (item), else the slot (dropdown content).
		if (model.root) {
			const sym = symbolFor(model.root);
			out.push({
				key: "root",
				label: "Root",
				entries: [
					sym
						? {
								value: `root:${model.root}`,
								primary: strip(model.root),
								sel: { type: "cva", target: { kind: "base", symbol: sym } },
								pieceKey: model.root,
							}
						: slotEntry(model.root),
				],
			});
		}
		if (model.trigger) push("trigger", "Trigger", [slotEntry(model.trigger)]);
		push("structure", "Layout / Structure", model.structure.map(slotEntry));
		push("parts", "Parts", model.parts.map(slotEntry));

		push(
			"variants",
			"Variants",
			model.variants.map((v) => {
				const sym = symbolFor(v.namespace);
				return {
					value: `variant:${v.namespace}:${v.axis}:${v.name}`,
					primary: v.name,
					trail: `· ${trailNs(v.namespace)}`,
					sel: sym
						? { type: "cva", target: { kind: "option", axis: v.axis, option: v.name, symbol: sym } }
						: { type: "slot", slot: v.namespace },
					pieceKey: v.namespace,
				};
			}),
		);

		// One entry per flag NAME (the prop). `inset` styles item/label/sub-trigger identically — the
		// locked reference lists it once, so dedupe by name; a flag spanning several slots drops its
		// trail (no single owner) and edits the first slot it appears on.
		const byFlag = new Map<string, typeof model.flags>();
		for (const f of model.flags) byFlag.set(f.name, [...(byFlag.get(f.name) ?? []), f]);
		push(
			"flags",
			"Flags",
			[...byFlag.values()].flatMap((uses) => {
				const f = uses[0];
				if (!f) return [];
				const sym = symbolFor(f.namespace);
				// "as link" edits the cva's [a]: pass-through; other flags edit the slot they sit on.
				const sel: Selection =
					f.name === "as link" && sym
						? {
								type: "cva",
								target: { kind: "context", context: "a", prefix: "[a]:", symbol: sym },
							}
						: { type: "slot", slot: f.namespace };
				return [
					{
						value: `flag:${f.name}`,
						primary: f.name,
						trail: uses.length === 1 ? `· ${trailNs(f.namespace)}` : undefined,
						sel,
						pieceKey: f.namespace,
					},
				];
			}),
		);

		return out;
	}, [model, cvas, name]);

	const entries = useMemo(() => groups.flatMap((g) => g.entries), [groups]);

	// Auto-select Root once the model is loaded (or when the current value no longer matches).
	useEffect(() => {
		if (entries.length && !entries.some((e) => e.value === value)) {
			const first = entries[0];
			if (first) onPick(first.value, first.sel, first.pieceKey);
		}
	}, [entries, value, onPick]);

	const change = useCallback(
		(v: string) => {
			const e = entries.find((x) => x.value === v);
			if (e) onPick(e.value, e.sel, e.pieceKey);
		},
		[entries, onPick],
	);

	return (
		<div className="flex flex-col gap-1.5">
			<span className="text-xs font-medium text-subtext0">Editing</span>
			<Select value={value} onValueChange={(v) => change(v ?? "")}>
				<SelectTrigger className="h-8">
					<SelectValue placeholder="Select a piece…" />
				</SelectTrigger>
				<SelectContent>
					{groups.map((g) => (
						<SelectGroup key={g.key}>
							<SelectLabel>{g.label}</SelectLabel>
							{g.entries.map((e) => (
								<SelectItem key={e.value} value={e.value}>
									{e.primary}
									{e.trail && <span className="ml-1.5 text-subtext0">{e.trail}</span>}
								</SelectItem>
							))}
						</SelectGroup>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
