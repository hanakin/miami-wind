import { Icon } from "@registry-ui/icon";
import { useCallback, useMemo, useState } from "react";
import { EditingMenu } from "~/components/editing-menu";
import { Inspector } from "~/components/inspector";
import { InteractionMenu } from "~/components/interaction-menu";
import { useComponentModel } from "~/hooks/use-workbench-data";
import { useEditorModel } from "~/stores/editor-model";
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
import { parseClasses } from "~/utils/tw-tokens";
import type { CvaModel } from "../../server/lib/cva-codec";

// Canonical class prefix for an interaction the piece doesn't have yet (an "Add" pick) — a present
// state's prefix comes from its real classes instead (below), so hover-vs-`focus:` is never guessed.
const STATE_PREFIX: Record<string, string> = {
	default: "",
	hover: "hover:",
	focus: "focus:",
	"focus-visible": "focus-visible:",
	active: "active:",
	disabled: "disabled:",
	visited: "visited:",
	checked: "data-[state=checked]:",
	selected: "data-[state=selected]:",
};

export function CvaControls({
	name,
	sel,
	onSel,
}: {
	name: string;
	sel: Selection;
	onSel: (sel: Selection) => void;
}) {
	// The active piece from the categorized Editing menu (Stage 3): `piece` = the menu value, `pieceKey`
	// = the store slot it edits (drives the Interaction menu + controls). Each pick also maps to the
	// existing `sel` so the Inspector/Demo keep working (transition glue, removed with the old engine).
	const [piece, setPiece] = useState("");
	const [pieceKey, setPieceKey] = useState("");
	// The active interaction from the Interaction menu (Stage 4). Resets to Default when the piece changes.
	const [interaction, setInteraction] = useState("default");
	const onPick = useCallback(
		(value: string, next: Selection, key: string) => {
			setPiece(value);
			setPieceKey(key);
			setInteraction("default");
			onSel(next);
		},
		[onSel],
	);
	const anyModel = useComponentModel(name);
	// The pre-baked model — source for the interaction's real class prefix (Stage 5 reads values there).
	const editorModel = useEditorModel((s) => s.baseline[name]);
	// The class prefix the controls read/write at: a present state's REAL prefix (`focus:`,
	// `data-[state=open]:`, `data-[disabled]:`) from its baked classes, else the canonical Add prefix.
	const state = useMemo(() => {
		const classes = editorModel?.classesByPieceState[pieceKey]?.[interaction];
		const first = classes ? parseClasses(classes)[0] : undefined;
		return first?.state ?? STATE_PREFIX[interaction] ?? "";
	}, [editorModel, pieceKey, interaction]);
	const modelsMap = useWorkbench((s) => s.models);
	// Working classes for the selected surface, read live from the store (empty until first edit).
	const slotBase = useWorkbench((s) =>
		sel.type === "slot" ? (s.slots[sel.slot] ?? "") : undefined,
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
	// The cva the current selection edits: matched by symbol, else the first (also the slot-selection
	// fallback). Undefined only for a non-cva component, whose cva paths below never render.
	const model =
		(sel.type === "cva" ? cvas.find((m) => m.exportName === sel.target.symbol) : undefined) ??
		cvas[0];

	if (!anyModel) return <p className="p-4 text-sm text-subtext0">Loading {name}…</p>;
	const apply = (m: CvaModel) => workbenchStore.getState().setModel(m.exportName, m);

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
			<EditingMenu name={name} value={piece} onPick={onPick} />

			<InteractionMenu
				name={name}
				pieceKey={pieceKey}
				value={interaction}
				onPick={setInteraction}
			/>

			<Inspector
				value={value}
				inherited={inherited}
				onChange={onChange}
				context={sel.type === "cva" && sel.target.kind === "context" ? sel.target.prefix : ""}
				state={state}
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
