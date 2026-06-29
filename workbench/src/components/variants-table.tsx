import { Fragment } from "react";
import { previews } from "~/components/previews";
import { cn } from "~/utils/cn";
import type { Target } from "~/utils/cva-edit";
import type { CvaModel } from "../../server/lib/cva-codec";

interface Props {
	model: CvaModel;
	selected: Target;
	onSelect: (t: Target) => void;
}

// Renders every variant combination of a cva as live previews, with clickable axis-option
// headers that select what the inspector edits. Two-axis cvas render as a grid; the selected
// option's row/column is highlighted.
export function VariantsTable({ model, selected, onSelect }: Props) {
	const render = previews[model.name];
	if (!render)
		return <p className="text-sm text-subtext0">No preview registered for {model.name}.</p>;

	const axes = Object.keys(model.variants);

	if (axes.length === 0) return <Cell>{render()}</Cell>;

	if (axes.length === 1) {
		const axis = axes[0];
		if (!axis) return null;
		const options = Object.keys(model.variants[axis] ?? {});
		return (
			<div className="inline-grid grid-cols-[auto_1fr] items-center gap-x-6 gap-y-3">
				{options.map((option) => (
					<Fragment key={option}>
						<OptionHeader axis={axis} option={option} selected={selected} onSelect={onSelect} />
						<Cell highlighted={isOn(selected, axis, option)}>{render({ [axis]: option })}</Cell>
					</Fragment>
				))}
			</div>
		);
	}

	const rowAxis = axes[0];
	const colAxis = axes[1];
	if (!rowAxis || !colAxis) return null;
	const rowOpts = Object.keys(model.variants[rowAxis] ?? {});
	const colOpts = Object.keys(model.variants[colAxis] ?? {});

	return (
		<table className="border-separate border-spacing-3">
			<thead>
				<tr>
					<th className="text-left text-xs font-medium text-subtext0">
						{rowAxis} \ {colAxis}
					</th>
					{colOpts.map((c) => (
						<th key={c}>
							<OptionHeader axis={colAxis} option={c} selected={selected} onSelect={onSelect} />
						</th>
					))}
				</tr>
			</thead>
			<tbody>
				{rowOpts.map((r) => (
					<tr key={r}>
						<th className="text-left align-middle">
							<OptionHeader axis={rowAxis} option={r} selected={selected} onSelect={onSelect} />
						</th>
						{colOpts.map((c) => (
							<td key={c}>
								<Cell highlighted={isOn(selected, rowAxis, r) || isOn(selected, colAxis, c)}>
									{render({ [rowAxis]: r, [colAxis]: c })}
								</Cell>
							</td>
						))}
					</tr>
				))}
			</tbody>
		</table>
	);
}

function isOn(selected: Target, axis: string, option: string): boolean {
	return selected.kind === "option" && selected.axis === axis && selected.option === option;
}

function OptionHeader({
	axis,
	option,
	selected,
	onSelect,
}: {
	axis: string;
	option: string;
	selected: Target;
	onSelect: (t: Target) => void;
}) {
	const active = isOn(selected, axis, option);
	return (
		<button
			type="button"
			onClick={() => onSelect({ kind: "option", axis, option })}
			className={cn(
				"cursor-pointer rounded px-2 py-1 text-xs font-medium transition-colors",
				active
					? "bg-primary text-primary-foreground"
					: "text-subtext0 hover:bg-interactive hover:text-text",
			)}
		>
			{option}
		</button>
	);
}

function Cell({
	children,
	highlighted = false,
}: {
	children: React.ReactNode;
	highlighted?: boolean;
}) {
	return (
		<div
			className={cn(
				"pointer-events-none grid min-h-20 min-w-28 place-items-center rounded-md border p-3",
				highlighted ? "border-primary bg-surface" : "border-border bg-card",
			)}
		>
			{children}
		</div>
	);
}
