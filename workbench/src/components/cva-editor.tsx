import { Inspector } from "~/components/inspector";
import { cn } from "~/utils/cn";
import { sameTarget, type Target, targetClass, targetLabel } from "~/utils/cva-edit";
import type { CvaModel } from "../../server/lib/cva-codec";

interface Props {
	model: CvaModel;
	selected: Target;
	onSelect: (t: Target) => void;
	onChangeClass: (value: string) => void;
}

// The editing panel: pick a target (base or an axis-option), tweak it with the rich inspector,
// and fall back to the raw class string for anything the controls don't cover.
export function CvaEditor({ model, selected, onSelect, onChangeClass }: Props) {
	const targets: Target[] = [
		{ kind: "base" },
		...Object.entries(model.variants).flatMap(([axis, opts]) =>
			Object.keys(opts).map((option): Target => ({ kind: "option", axis, option })),
		),
	];
	const current = targetClass(model, selected);

	return (
		<div className="flex h-full flex-col">
			<div className="border-b border-border p-4">
				<h2 className="text-xs font-medium uppercase tracking-wide text-subtext0">Target</h2>
				<div className="mt-2 flex flex-wrap gap-1.5">
					{targets.map((t) => (
						<button
							key={targetLabel(t)}
							type="button"
							onClick={() => onSelect(t)}
							className={cn(
								"cursor-pointer rounded px-2 py-1 text-xs transition-colors",
								sameTarget(t, selected)
									? "bg-primary text-primary-foreground"
									: "bg-interactive text-subtext hover:text-text",
							)}
						>
							{targetLabel(t)}
						</button>
					))}
				</div>
			</div>

			<div className="flex-1 overflow-auto p-4">
				<Inspector value={current} onChange={onChangeClass} />

				<details className="mt-5 border-t border-border pt-3">
					<summary className="cursor-pointer text-xs font-medium text-subtext0 transition-colors hover:text-text">
						Raw class string
					</summary>
					<textarea
						value={current}
						onChange={(e) => onChangeClass(e.target.value)}
						spellCheck={false}
						className="mt-2 h-32 w-full resize-y rounded-md border border-border bg-input p-3 font-mono text-xs leading-relaxed text-text outline-none focus-visible:border-primary"
					/>
				</details>
			</div>
		</div>
	);
}
