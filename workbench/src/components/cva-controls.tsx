import { Icon } from "@registry-ui/icon";
import { useState } from "react";
import { Inspector } from "~/components/inspector";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { useComponentModel } from "~/hooks/use-workbench-data";
import { workbenchStore } from "~/stores/workbench";
import {
	addAxis,
	addOption,
	removeAxis,
	removeOption,
	setTargetClass,
	type Target,
	targetClass,
} from "~/utils/cva-edit";
import type { CvaModel } from "../../server/lib/cva-codec";

// Start editing where the colors actually live — the default variant — not the (usually colorless)
// shared base, so the color controls reflect the component you see and "none" clears a real color.
function firstVariantTarget(model: CvaModel | undefined): Target {
	if (!model) return { kind: "base" };
	for (const [axis, opt] of Object.entries(model.defaultVariants)) {
		if (typeof opt === "string") return { kind: "option", axis, option: opt };
	}
	const [axis, opts] = Object.entries(model.variants)[0] ?? [];
	const opt = opts && Object.keys(opts)[0];
	return axis && opt ? { kind: "option", axis, option: opt } : { kind: "base" };
}

export function CvaControls({ name }: { name: string }) {
	const model = useComponentModel(name);
	const [target, setTarget] = useState<Target>(() => firstVariantTarget(model));

	if (!model) return <p className="p-4 text-sm text-subtext0">No cva for {name}.</p>;
	const symbol = model.exportName;
	const apply = (m: CvaModel) => workbenchStore.getState().setModel(symbol, m);

	const options = [
		{ value: "base", label: "Base", target: { kind: "base" } as Target },
		...Object.entries(model.variants).flatMap(([axis, opts]) =>
			Object.keys(opts).map((option) => ({
				value: `${axis}:${option}`,
				label: `${axis} · ${option}`,
				target: { kind: "option", axis, option } as Target,
			})),
		),
	];
	const currentValue = target.kind === "base" ? "base" : `${target.axis}:${target.option}`;

	return (
		<div className="flex flex-col gap-4 p-4">
			<div className="flex flex-col gap-1.5">
				<span className="text-xs font-medium text-subtext0">Editing</span>
				<Select
					value={currentValue}
					onValueChange={(v) =>
						setTarget(options.find((o) => o.value === v)?.target ?? { kind: "base" })
					}
				>
					<SelectTrigger className="h-8">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{options.map((o) => (
							<SelectItem key={o.value} value={o.value}>
								{o.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<Inspector
				value={targetClass(model, target)}
				onChange={(v) => apply(setTargetClass(model, target, v))}
			/>

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
